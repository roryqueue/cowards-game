import {
  AuthSessionServiceDtoSchema,
  CreateMatchSetServiceDtoSchema,
  ListStrategyRevisionsServiceDtoSchema,
  RevokeSessionServiceDtoSchema,
  ServiceErrorDtoSchema,
  StrategyRevisionSourceServiceDtoSchema,
  StrategyRevisionSubmissionServiceDtoSchema,
  type AuthSessionServiceDto,
  type ListStrategyRevisionsServiceDto,
  type MatchSetId,
  type StrategyRevisionId,
} from "@cowards/spec"
import { CompetitiveInputError } from "./competitive-errors.js"
import { SESSION_COOKIE_NAME } from "./competitive-session.js"

interface ServiceSchema<T> {
  safeParse(
    value: unknown,
  ): { success: true; data: T } | { success: false; error: unknown }
}

const CreateGoMatchSetServiceDtoSchema: ServiceSchema<CreateMatchSetServiceDto> =
  {
    safeParse(value) {
      const parsed = CreateMatchSetServiceDtoSchema.safeParse(value)
      if (!parsed.success) {
        return parsed
      }
      const raw =
        value && typeof value === "object"
          ? (value as Record<string, unknown>)
          : {}
      return {
        success: true,
        data: {
          ...parsed.data,
          ...(raw.status === "queued" ? { status: "queued" as const } : {}),
          ...(typeof raw.matchCount === "number" &&
          Number.isInteger(raw.matchCount) &&
          raw.matchCount >= 0
            ? { matchCount: raw.matchCount }
            : {}),
        },
      }
    },
  }

export interface GoBackendServiceClientOptions {
  baseUrl: string
  timeoutMs?: number
  fetchImpl?: typeof fetch
}

export interface GoBackendServiceClient {
  getAuthSession(sessionId: string): Promise<AuthSessionServiceDto>
  createSession(input: {
    username: unknown
    password: unknown
  }): Promise<{ body: AuthSessionServiceDto; setCookie?: string | undefined }>
  createAccount(input: {
    username: unknown
    password: unknown
    handle: unknown
    displayName: unknown
  }): Promise<{ body: AuthSessionServiceDto; setCookie?: string | undefined }>
  revokeSession(sessionId: string): Promise<void>
  listStrategyRevisions(
    sessionId: string,
  ): Promise<ListStrategyRevisionsServiceDto>
  createStrategyRevision(
    sessionId: string,
    input: {
      strategyId?: string | undefined
      source: unknown
      label?: unknown
      notes?: unknown
      starterId?: unknown
      advancedId?: unknown
    },
  ): Promise<StrategyRevisionSubmissionServiceDto>
  getStrategyRevisionSource(
    sessionId: string,
    revisionId: StrategyRevisionId,
  ): Promise<StrategyRevisionSourceServiceDto | null>
  forkStarterStrategy(
    sessionId: string,
    starterId: unknown,
  ): Promise<StrategyRevisionSubmissionServiceDto>
  forkAdvancedStrategy(
    sessionId: string,
    advancedId: unknown,
  ): Promise<StrategyRevisionSubmissionServiceDto>
  createMatchSet(
    sessionId: string,
    input: { presetId: unknown; revisionIds: unknown; counted?: boolean },
  ): Promise<CreateMatchSetServiceDto>
}

export interface StrategyRevisionSubmissionServiceDto {
  apiVersion: "service-api-v1.8"
  kind: "strategyRevisionCreated"
  strategyId: string
  strategyRevisionId: StrategyRevisionId
  validationStatus: "valid" | "invalid"
}

export interface StrategyRevisionSourceServiceDto {
  apiVersion: "service-api-v1.8"
  kind: "strategyRevisionSource"
  strategyRevisionId: StrategyRevisionId
  source: string
  sourceHash: string
}

export interface CreateMatchSetServiceDto {
  apiVersion: "service-api-v1.8"
  kind: "matchSetCreated"
  matchSetId: MatchSetId
  publicHref: string
  status?: "queued" | undefined
  matchCount?: number | undefined
}

const toBody = (value: unknown): string | undefined =>
  value === undefined ? undefined : JSON.stringify(value)

const cookieHeader = (sessionId: string): Record<string, string> =>
  sessionId
    ? { cookie: `${SESSION_COOKIE_NAME}=${encodeURIComponent(sessionId)}` }
    : {}

const parseJson = (text: string): unknown =>
  text.length ? JSON.parse(text) : null

export class GoBackendServiceUnavailableError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = "GoBackendServiceUnavailableError"
  }
}

export const isGoBackendServiceUnavailableError = (
  error: unknown,
): error is GoBackendServiceUnavailableError =>
  error instanceof GoBackendServiceUnavailableError

export const createGoBackendServiceClient = ({
  baseUrl,
  timeoutMs = 1_000,
  fetchImpl = fetch,
}: GoBackendServiceClientOptions): GoBackendServiceClient => {
  const resolvedBaseUrl = new URL(baseUrl)

  const request = async <T>({
    method,
    path,
    schema,
    sessionId,
    body,
    notFoundAsNull = false,
  }: {
    method: "GET" | "POST" | "DELETE"
    path: string
    schema: ServiceSchema<T>
    sessionId?: string | undefined
    body?: unknown
    notFoundAsNull?: boolean
  }): Promise<{ body: T | null; setCookie?: string | undefined }> => {
    const controller = new AbortController()
    const timeout = globalThis.setTimeout(() => controller.abort(), timeoutMs)
    let response: Response
    try {
      const requestInit: RequestInit = {
        method,
        headers: {
          accept: "application/json",
          ...(body === undefined ? {} : { "content-type": "application/json" }),
          ...(sessionId === undefined ? {} : cookieHeader(sessionId)),
        },
        signal: controller.signal,
      }
      const encodedBody = toBody(body)
      if (encodedBody !== undefined) {
        requestInit.body = encodedBody
      }
      response = await fetchImpl(new URL(path, resolvedBaseUrl), requestInit)
    } catch (error) {
      throw new GoBackendServiceUnavailableError("Go backend is unavailable.", {
        cause: error,
      })
    } finally {
      globalThis.clearTimeout(timeout)
    }

    let parsedBody: unknown
    try {
      parsedBody = parseJson(await response.text())
    } catch (error) {
      throw new GoBackendServiceUnavailableError(
        "Go backend returned a non-JSON response.",
        { cause: error },
      )
    }

    if (response.status === 404 && notFoundAsNull) {
      const parsedError = ServiceErrorDtoSchema.safeParse(parsedBody)
      if (parsedError.success && parsedError.data.code === "NOT_FOUND") {
        return { body: null }
      }
    }

    if (response.status < 200 || response.status >= 300) {
      const parsedError = ServiceErrorDtoSchema.safeParse(parsedBody)
      if (parsedError.success) {
        throw new CompetitiveInputError(parsedError.data.message, {
          status: parsedError.data.status,
        })
      }
      throw new GoBackendServiceUnavailableError(
        "Go backend returned an invalid error response.",
      )
    }

    const parsed = schema.safeParse(parsedBody)
    if (!parsed.success) {
      throw new GoBackendServiceUnavailableError(
        "Go backend response failed schema validation.",
        { cause: parsed.error },
      )
    }

    return {
      body: parsed.data,
      setCookie: response.headers.get("set-cookie") ?? undefined,
    }
  }

  return {
    async getAuthSession(sessionId) {
      const result = await request({
        method: "GET",
        path: "/auth/session",
        schema: AuthSessionServiceDtoSchema,
        sessionId,
      })
      return result.body!
    },
    async createSession(input) {
      const result = await request({
        method: "POST",
        path: "/auth/session",
        schema: AuthSessionServiceDtoSchema,
        body: input,
      })
      return { body: result.body!, setCookie: result.setCookie }
    },
    async createAccount(input) {
      const result = await request({
        method: "POST",
        path: "/auth/sign-up",
        schema: AuthSessionServiceDtoSchema,
        body: input,
      })
      return { body: result.body!, setCookie: result.setCookie }
    },
    async revokeSession(sessionId) {
      await request({
        method: "DELETE",
        path: "/auth/session",
        schema: RevokeSessionServiceDtoSchema,
        sessionId,
      })
    },
    async listStrategyRevisions(sessionId) {
      const result = await request({
        method: "GET",
        path: "/account/strategy-revisions",
        schema:
          ListStrategyRevisionsServiceDtoSchema as ServiceSchema<ListStrategyRevisionsServiceDto>,
        sessionId,
      })
      return result.body!
    },
    async createStrategyRevision(sessionId, input) {
      const result = await request({
        method: "POST",
        path: "/account/strategy-revisions",
        schema: StrategyRevisionSubmissionServiceDtoSchema,
        sessionId,
        body: input,
      })
      return result.body!
    },
    async getStrategyRevisionSource(sessionId, revisionId) {
      const result = await request({
        method: "GET",
        path: `/account/strategy-revisions/${encodeURIComponent(
          revisionId,
        )}/source`,
        schema: StrategyRevisionSourceServiceDtoSchema,
        sessionId,
        notFoundAsNull: true,
      })
      return result.body
    },
    async forkStarterStrategy(sessionId, starterId) {
      const result = await request({
        method: "POST",
        path: "/account/starter-forks",
        schema: StrategyRevisionSubmissionServiceDtoSchema,
        sessionId,
        body: { starterId },
      })
      return result.body!
    },
    async forkAdvancedStrategy(sessionId, advancedId) {
      const result = await request({
        method: "POST",
        path: "/account/advanced-forks",
        schema: StrategyRevisionSubmissionServiceDtoSchema,
        sessionId,
        body: { advancedId },
      })
      return result.body!
    },
    async createMatchSet(sessionId, input) {
      const result = await request({
        method: "POST",
        path: "/matchsets",
        schema: CreateGoMatchSetServiceDtoSchema,
        sessionId,
        body: {
          presetId: input.presetId,
          entrantRevisionIds: Array.isArray(input.revisionIds)
            ? input.revisionIds
            : [],
          counted: input.counted !== false,
        },
      })
      return result.body!
    },
  }
}
