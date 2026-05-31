import {
  PublicLadderPageServiceDtoSchema,
  PublicMatchSetSummaryServiceDtoSchema,
  PublicPlayerPageServiceDtoSchema,
  PublicReplayEvidenceServiceDtoSchema,
  PublicReplayMetadataServiceDtoSchema,
  PublicStrategyPageServiceDtoSchema,
  ServiceErrorDtoSchema,
  assertPublicServiceDtoLeakSafe,
  type MatchId,
  type MatchSetId,
  type PublicLadderPageServiceDto,
  type PublicMatchSetSummaryServiceDto,
  type PublicPlayerPageServiceDto,
  type PublicReplayEvidenceServiceDto,
  type PublicReplayMetadataServiceDto,
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
  routeId:
    | "getPublicStrategyPage"
    | "getPublicPlayerPage"
    | "getPublicLadderSeason"
    | "getPublicMatchSetSummary"
    | "getPublicReplayEvidence"
    | "getPublicReplayMetadata"
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
  getPublicPlayerPage(
    handle: string,
  ): Promise<PublicPlayerPageServiceDto | null>
  getPublicLadderSeason(
    seasonId: string,
  ): Promise<PublicLadderPageServiceDto | null>
  getPublicMatchSetSummary(
    matchSetId: MatchSetId,
  ): Promise<PublicMatchSetSummaryServiceDto | null>
  getPublicReplayMetadata(
    matchId: MatchId,
  ): Promise<PublicReplayMetadataServiceDto | null>
  getPublicReplayEvidence(
    matchId: MatchId,
  ): Promise<PublicReplayEvidenceServiceDto | null>
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
  routeId: PublicGoReadFailureDiagnostic["routeId"],
  failureClass: PublicGoReadFailureClass,
  status: number | null,
  startedAt: number,
  endedAt: number,
): PublicGoReadFailureDiagnostic => ({
  routeId,
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

interface PublicSchema<T> {
  safeParse(
    value: unknown,
  ): { success: true; data: T } | { success: false; error: unknown }
}

const assertSafeLinks = (
  routeId: PublicGoReadFailureDiagnostic["routeId"],
  hrefs: readonly string[],
  status: number,
  startedAt: number,
  endedAt: number,
): void => {
  for (const href of hrefs) {
    if (!safeRelativeLinkPatterns.some((pattern) => pattern.test(href))) {
      throw new PublicGoReadError(
        "Go public read returned unsafe evidence link",
        makeDiagnostic(
          routeId,
          "go_body_divergent",
          status,
          startedAt,
          endedAt,
        ),
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
    routeId: PublicGoReadFailureDiagnostic["routeId"],
    path: string,
  ): Promise<{
    body: unknown
    status: number
    startedAt: number
    endedAt: number
  }> => {
    const startedAt = now()
    const controller = new AbortController()
    const timeout = globalThis.setTimeout(() => controller.abort(), timeoutMs)
    const url = new URL(path, resolvedBaseUrl)
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
          makeDiagnostic(
            routeId,
            "go_non_json",
            response.status,
            startedAt,
            endedAt,
          ),
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
          routeId,
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

  const requestPublicDto = async <T>({
    routeId,
    path,
    schema,
    validate,
  }: {
    routeId: PublicGoReadFailureDiagnostic["routeId"]
    path: string
    schema: PublicSchema<T>
    validate?: (
      dto: T,
      status: number,
      startedAt: number,
      endedAt: number,
    ) => void
  }): Promise<T | null> => {
    const { body, status, startedAt, endedAt } = await requestJson(
      routeId,
      path,
    )
    try {
      assertPublicServiceDtoLeakSafe(body)
    } catch (error) {
      throw new PublicGoReadError(
        "Go public read privacy validation failed",
        makeDiagnostic(
          routeId,
          "go_privacy_violation",
          status,
          startedAt,
          endedAt,
        ),
        { cause: error },
      )
    }

    if (status === 404) {
      const parsedError = ServiceErrorDtoSchema.safeParse(body)
      if (!parsedError.success) {
        throw new PublicGoReadError(
          "Go public read returned invalid not-found body",
          makeDiagnostic(
            routeId,
            "go_status_mismatch",
            status,
            startedAt,
            endedAt,
          ),
          { cause: parsedError.error },
        )
      }
      if (
        parsedError.data.code !== "NOT_FOUND" ||
        parsedError.data.status !== status
      ) {
        throw new PublicGoReadError(
          "Go public read returned mismatched not-found body",
          makeDiagnostic(
            routeId,
            "go_status_mismatch",
            status,
            startedAt,
            endedAt,
          ),
        )
      }
      return null
    }

    if (status < 200 || status >= 300) {
      const parsedError = ServiceErrorDtoSchema.safeParse(body)
      if (!parsedError.success || parsedError.data.status !== status) {
        throw new PublicGoReadError(
          "Go public read returned mismatched error body",
          makeDiagnostic(
            routeId,
            "go_status_mismatch",
            status,
            startedAt,
            endedAt,
          ),
          { cause: parsedError.success ? undefined : parsedError.error },
        )
      }
      const serviceError: ServiceErrorDto = parsedError.data
      throw new PublicGoReadError(
        serviceError.message,
        makeDiagnostic(
          routeId,
          "go_status_mismatch",
          status,
          startedAt,
          endedAt,
        ),
      )
    }

    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      throw new PublicGoReadError(
        "Go public read schema validation failed",
        makeDiagnostic(
          routeId,
          "go_schema_invalid",
          status,
          startedAt,
          endedAt,
        ),
        { cause: parsed.error },
      )
    }

    validate?.(parsed.data, status, startedAt, endedAt)
    return parsed.data
  }

  const assertCanonicalHref = (
    routeId: PublicGoReadFailureDiagnostic["routeId"],
    actual: string,
    expected: string,
    status: number,
    startedAt: number,
    endedAt: number,
  ): void => {
    if (actual !== expected) {
      throw new PublicGoReadError(
        "Go public read returned divergent canonical href",
        makeDiagnostic(
          routeId,
          "go_body_divergent",
          status,
          startedAt,
          endedAt,
        ),
      )
    }
  }

  const assertReplayMatchIdentity = (
    routeId: "getPublicReplayMetadata" | "getPublicReplayEvidence",
    actual: { matchId: MatchId; metadata: { matchId: MatchId } },
    expected: MatchId,
    status: number,
    startedAt: number,
    endedAt: number,
  ): void => {
    if (actual.matchId !== expected || actual.metadata.matchId !== expected) {
      throw new PublicGoReadError(
        "Go public replay read returned divergent Match id",
        makeDiagnostic(
          routeId,
          "go_body_divergent",
          status,
          startedAt,
          endedAt,
        ),
      )
    }
  }

  return {
    async getPublicStrategyPage(strategyId) {
      return (await requestPublicDto({
        routeId: "getPublicStrategyPage",
        path: `/public/strategies/${encodeURIComponent(strategyId)}`,
        schema:
          PublicStrategyPageServiceDtoSchema as PublicSchema<PublicStrategyPageServiceDto>,
        validate: (page, status, startedAt, endedAt) => {
          assertCanonicalHref(
            "getPublicStrategyPage",
            page.canonicalHref,
            `/strategies/${encodeURIComponent(strategyId)}`,
            status,
            startedAt,
            endedAt,
          )
          assertSafeLinks(
            "getPublicStrategyPage",
            [
              ...page.payload.strategy.resultLinks,
              ...page.payload.strategy.replayLinks,
            ],
            status,
            startedAt,
            endedAt,
          )
        },
      })) as PublicStrategyPageServiceDto | null
    },
    async getPublicPlayerPage(handle) {
      return (await requestPublicDto({
        routeId: "getPublicPlayerPage",
        path: `/public/players/${encodeURIComponent(handle)}`,
        schema:
          PublicPlayerPageServiceDtoSchema as PublicSchema<PublicPlayerPageServiceDto>,
        validate: (page, status, startedAt, endedAt) =>
          assertCanonicalHref(
            "getPublicPlayerPage",
            page.canonicalHref,
            `/players/${encodeURIComponent(handle)}`,
            status,
            startedAt,
            endedAt,
          ),
      })) as PublicPlayerPageServiceDto | null
    },
    async getPublicLadderSeason(seasonId) {
      return (await requestPublicDto({
        routeId: "getPublicLadderSeason",
        path: `/public/ladders/${encodeURIComponent(seasonId)}`,
        schema:
          PublicLadderPageServiceDtoSchema as PublicSchema<PublicLadderPageServiceDto>,
        validate: (page, status, startedAt, endedAt) => {
          assertCanonicalHref(
            "getPublicLadderSeason",
            page.canonicalHref,
            `/ladder/${encodeURIComponent(seasonId)}`,
            status,
            startedAt,
            endedAt,
          )
          assertSafeLinks(
            "getPublicLadderSeason",
            page.payload.matchSets.flatMap((matchSet) => [
              matchSet.resultHref,
              ...(matchSet.replayHref ? [matchSet.replayHref] : []),
            ]),
            status,
            startedAt,
            endedAt,
          )
        },
      })) as PublicLadderPageServiceDto | null
    },
    async getPublicMatchSetSummary(matchSetId) {
      return (await requestPublicDto({
        routeId: "getPublicMatchSetSummary",
        path: `/public/matchsets/${encodeURIComponent(matchSetId)}/summary`,
        schema:
          PublicMatchSetSummaryServiceDtoSchema as PublicSchema<PublicMatchSetSummaryServiceDto>,
        validate: (summary, status, startedAt, endedAt) =>
          assertSafeLinks(
            "getPublicMatchSetSummary",
            summary.result.matches
              .map((match) =>
                match.replayAvailable
                  ? `/matches/${encodeURIComponent(match.matchId)}/replay`
                  : "",
              )
              .filter(Boolean),
            status,
            startedAt,
            endedAt,
          ),
      })) as PublicMatchSetSummaryServiceDto | null
    },
    async getPublicReplayMetadata(matchId) {
      return (await requestPublicDto({
        routeId: "getPublicReplayMetadata",
        path: `/public/replays/${encodeURIComponent(matchId)}/metadata`,
        schema:
          PublicReplayMetadataServiceDtoSchema as PublicSchema<PublicReplayMetadataServiceDto>,
        validate: (metadata, status, startedAt, endedAt) =>
          assertReplayMatchIdentity(
            "getPublicReplayMetadata",
            metadata,
            matchId,
            status,
            startedAt,
            endedAt,
          ),
      })) as PublicReplayMetadataServiceDto | null
    },
    async getPublicReplayEvidence(matchId) {
      return (await requestPublicDto({
        routeId: "getPublicReplayEvidence",
        path: `/public/replays/${encodeURIComponent(matchId)}/evidence`,
        schema:
          PublicReplayEvidenceServiceDtoSchema as PublicSchema<PublicReplayEvidenceServiceDto>,
        validate: (evidence, status, startedAt, endedAt) =>
          assertReplayMatchIdentity(
            "getPublicReplayEvidence",
            evidence,
            matchId,
            status,
            startedAt,
            endedAt,
          ),
      })) as PublicReplayEvidenceServiceDto | null
    },
  }
}
