import {
  PublicStrategyPageServiceDtoSchema,
  ServiceErrorDtoSchema,
  assertPublicServiceDtoLeakSafe,
  type PublicStrategyPageServiceDto,
  type ServiceErrorDto,
  type StrategyId,
} from "@cowards/spec"

export type PublicGoReadFailureClass =
  | "go_unavailable"
  | "go_timeout"
  | "go_non_json"
  | "go_schema_invalid"
  | "go_privacy_violation"
  | "go_status_mismatch"
  | "go_body_divergent"

export interface PublicGoReadFailureDiagnostic {
  routeId: "getPublicStrategyPage"
  selectedBackend: "go"
  status: number | null
  durationBucket: "lt_100ms" | "lt_500ms" | "lt_1000ms" | "gte_1000ms"
  failureClass: PublicGoReadFailureClass
}

export class PublicGoReadError extends Error {
  readonly diagnostic: PublicGoReadFailureDiagnostic

  constructor(
    message: string,
    diagnostic: PublicGoReadFailureDiagnostic,
    options?: ErrorOptions,
  ) {
    super(message, options)
    this.name = "PublicGoReadError"
    this.diagnostic = diagnostic
  }
}

export interface PublicGoReadClientOptions {
  baseUrl: string
  timeoutMs?: number
  fetchImpl?: typeof fetch
  now?: () => number
}

export interface PublicGoReadClient {
  getPublicStrategyPage(
    strategyId: StrategyId,
  ): Promise<PublicStrategyPageServiceDto | null>
}

const durationBucket = (
  startedAt: number,
  endedAt: number,
): PublicGoReadFailureDiagnostic["durationBucket"] => {
  const elapsed = Math.max(0, endedAt - startedAt)
  if (elapsed < 100) {
    return "lt_100ms"
  }
  if (elapsed < 500) {
    return "lt_500ms"
  }
  if (elapsed < 1_000) {
    return "lt_1000ms"
  }
  return "gte_1000ms"
}

const isAbortError = (error: unknown): boolean =>
  error instanceof DOMException
    ? error.name === "AbortError" || error.name === "TimeoutError"
    : error instanceof Error && error.name === "AbortError"

const makeDiagnostic = (
  failureClass: PublicGoReadFailureClass,
  status: number | null,
  startedAt: number,
  endedAt: number,
): PublicGoReadFailureDiagnostic => ({
  routeId: "getPublicStrategyPage",
  selectedBackend: "go",
  status,
  durationBucket: durationBucket(startedAt, endedAt),
  failureClass,
})

export const isPublicGoReadError = (
  error: unknown,
): error is PublicGoReadError => error instanceof PublicGoReadError

const safeRelativeLinkPatterns = [
  /^\/matchsets\/[^/]+$/,
  /^\/matches\/[^/]+\/replay$/,
  /^\/replays\/[^/]+$/,
] as const

const assertSafeStrategyLinks = (
  page: PublicStrategyPageServiceDto,
  status: number,
  startedAt: number,
  endedAt: number,
): void => {
  for (const href of [
    ...page.payload.strategy.resultLinks,
    ...page.payload.strategy.replayLinks,
  ]) {
    if (!safeRelativeLinkPatterns.some((pattern) => pattern.test(href))) {
      throw new PublicGoReadError(
        "Go public Strategy read returned unsafe evidence link",
        makeDiagnostic("go_body_divergent", status, startedAt, endedAt),
      )
    }
  }
}

export const createPublicGoReadClient = ({
  baseUrl,
  timeoutMs = 1_000,
  fetchImpl = fetch,
  now = () => globalThis.performance.now(),
}: PublicGoReadClientOptions): PublicGoReadClient => {
  const resolvedBaseUrl = new URL(baseUrl)

  const requestJson = async (
    strategyId: StrategyId,
  ): Promise<{
    body: unknown
    status: number
    startedAt: number
    endedAt: number
  }> => {
    const startedAt = now()
    const controller = new AbortController()
    const timeout = globalThis.setTimeout(() => controller.abort(), timeoutMs)
    const url = new URL(
      `/public/strategies/${encodeURIComponent(strategyId)}`,
      resolvedBaseUrl,
    )
    let response: Response | null = null
    try {
      response = await fetchImpl(url, {
        headers: { accept: "application/json" },
        signal: controller.signal,
      })
      const text = await response.text()
      const endedAt = now()
      try {
        return {
          body: text.length ? JSON.parse(text) : null,
          status: response.status,
          startedAt,
          endedAt,
        }
      } catch (error) {
        throw new PublicGoReadError(
          "Go public Strategy read returned non-JSON",
          makeDiagnostic("go_non_json", response.status, startedAt, endedAt),
          { cause: error },
        )
      }
    } catch (error) {
      if (isPublicGoReadError(error)) {
        throw error
      }
      const endedAt = now()
      const failureClass = isAbortError(error) ? "go_timeout" : "go_unavailable"
      throw new PublicGoReadError(
        "Go public Strategy read failed",
        makeDiagnostic(
          failureClass,
          response?.status ?? null,
          startedAt,
          endedAt,
        ),
        { cause: error },
      )
    } finally {
      globalThis.clearTimeout(timeout)
    }
  }

  return {
    async getPublicStrategyPage(strategyId) {
      const { body, status, startedAt, endedAt } = await requestJson(strategyId)
      try {
        assertPublicServiceDtoLeakSafe(body)
      } catch (error) {
        throw new PublicGoReadError(
          "Go public Strategy read privacy validation failed",
          makeDiagnostic("go_privacy_violation", status, startedAt, endedAt),
          { cause: error },
        )
      }

      if (status === 404) {
        const parsedError = ServiceErrorDtoSchema.safeParse(body)
        if (!parsedError.success) {
          throw new PublicGoReadError(
            "Go public Strategy read returned invalid not-found body",
            makeDiagnostic("go_status_mismatch", status, startedAt, endedAt),
            { cause: parsedError.error },
          )
        }
        if (
          parsedError.data.code !== "NOT_FOUND" ||
          parsedError.data.status !== status
        ) {
          throw new PublicGoReadError(
            "Go public Strategy read returned mismatched not-found body",
            makeDiagnostic("go_status_mismatch", status, startedAt, endedAt),
          )
        }
        return null
      }

      if (status < 200 || status >= 300) {
        const parsedError = ServiceErrorDtoSchema.safeParse(body)
        if (!parsedError.success || parsedError.data.status !== status) {
          throw new PublicGoReadError(
            "Go public Strategy read returned mismatched error body",
            makeDiagnostic("go_status_mismatch", status, startedAt, endedAt),
            { cause: parsedError.success ? undefined : parsedError.error },
          )
        }
        const serviceError: ServiceErrorDto = parsedError.data
        throw new PublicGoReadError(
          serviceError.message,
          makeDiagnostic("go_status_mismatch", status, startedAt, endedAt),
        )
      }

      const parsed = PublicStrategyPageServiceDtoSchema.safeParse(body)
      if (!parsed.success) {
        throw new PublicGoReadError(
          "Go public Strategy read schema validation failed",
          makeDiagnostic("go_schema_invalid", status, startedAt, endedAt),
          { cause: parsed.error },
        )
      }

      if (
        parsed.data.canonicalHref !==
        `/strategies/${encodeURIComponent(strategyId)}`
      ) {
        throw new PublicGoReadError(
          "Go public Strategy read returned divergent canonical href",
          makeDiagnostic("go_body_divergent", status, startedAt, endedAt),
        )
      }

      assertSafeStrategyLinks(
        parsed.data as PublicStrategyPageServiceDto,
        status,
        startedAt,
        endedAt,
      )

      return parsed.data as PublicStrategyPageServiceDto
    },
  }
}
