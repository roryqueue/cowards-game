import type { AuthSessionServiceDto } from "@cowards/spec"
import {
  createPublicGoReadClient,
  isPublicGoReadError,
  type PublicGoReadClient,
  type PublicGoReadFailureDiagnostic,
} from "./public-go-read-client.js"
import { getAccountSession } from "./account-service-boundary.js"

export type PublicReadBackendOwner = "typescript" | "go"
export type PublicReadRouteId =
  | "getPublicStrategyPage"
  | "getPublicPlayerPage"
  | "getPublicLadderSeason"
  | "getPublicMatchSetSummary"
  | "getPublicReplayEvidence"
  | "getPublicReplayMetadata"

export interface PublicReadRouteOwnership {
  routeId: "getPublicStrategyPage"
  selectedRoutes: readonly PublicReadRouteId[]
  method: "GET"
  path: "/public/strategies/{strategyId}"
  privacyClass: "public"
  defaultOwner: "typescript"
  selectedOwner: PublicReadBackendOwner
  fallbackPolicy: "no_fallback_when_go_selected"
  rollbackOwner: "typescript"
  diagnosticsClass: "public_go_read"
  disallowedScopes: readonly string[]
  goBaseUrlConfigured: boolean
}

export interface PublicReadRouteOwnershipEnv extends Record<
  string,
  string | undefined
> {
  COWARDS_GO_PUBLIC_STRATEGY_READS?: string | undefined
  COWARDS_GO_PUBLIC_READS?: string | undefined
  COWARDS_GO_BACKEND_OWNER?: string | undefined
  COWARDS_GO_BACKEND_URL?: string | undefined
  COWARDS_NO_TYPESCRIPT_BACKEND?: string | undefined
}

const disallowedScopes = [
  "go_writes",
  "auth_session_mutation",
  "ladder_writes",
  "match_orchestration",
  "jobs",
  "migrations",
  "persistence_ownership",
  "strategy_source_retrieval",
  "strategy_execution",
  "runtime_sandbox_promotion",
  "counted_non_js_play",
] as const

export const resolvePublicReadRouteOwnership = (
  env: PublicReadRouteOwnershipEnv = process.env,
): PublicReadRouteOwnership => {
  const allGoSelected =
    env.COWARDS_GO_PUBLIC_READS === "1" ||
    env.COWARDS_GO_BACKEND_OWNER === "go" ||
    env.COWARDS_NO_TYPESCRIPT_BACKEND === "1"
  const selectedRoutes: PublicReadRouteId[] = allGoSelected
    ? [
        "getPublicStrategyPage",
        "getPublicPlayerPage",
        "getPublicLadderSeason",
        "getPublicMatchSetSummary",
        "getPublicReplayEvidence",
        "getPublicReplayMetadata",
      ]
    : env.COWARDS_GO_PUBLIC_STRATEGY_READS === "1"
      ? ["getPublicStrategyPage"]
      : []
  return {
    routeId: "getPublicStrategyPage",
    selectedRoutes,
    method: "GET",
    path: "/public/strategies/{strategyId}",
    privacyClass: "public",
    defaultOwner: "typescript",
    selectedOwner: selectedRoutes.length > 0 ? "go" : "typescript",
    fallbackPolicy: "no_fallback_when_go_selected",
    rollbackOwner: "typescript",
    diagnosticsClass: "public_go_read",
    disallowedScopes,
    goBaseUrlConfigured: Boolean(env.COWARDS_GO_BACKEND_URL),
  }
}

export type PublicReadUser = NonNullable<AuthSessionServiceDto["user"]>

export interface PublicReadService {
  getPublicMatchSetSummary: PublicGoReadClient["getPublicMatchSetSummary"]
  getPublicReplayMetadata: PublicGoReadClient["getPublicReplayMetadata"]
  getPublicStrategyPage: PublicGoReadClient["getPublicStrategyPage"]
  getPublicPlayerPage: PublicGoReadClient["getPublicPlayerPage"]
  getPublicLadderSeason: PublicGoReadClient["getPublicLadderSeason"]
}

export interface CreatePublicReadServiceOptions {
  env?: PublicReadRouteOwnershipEnv | undefined
  goClient?: PublicGoReadClient | undefined
  fetchImpl?: typeof fetch | undefined
}

export const publicReadRouteOwnership = resolvePublicReadRouteOwnership(
  process.env,
)

const requireGoClient = (
  routeId: PublicReadRouteId,
  goClient: PublicGoReadClient | null,
): PublicGoReadClient => {
  if (!goClient) {
    throw new Error(`${routeId} Go ownership requires COWARDS_GO_BACKEND_URL`)
  }
  return goClient
}

const assertRouteGoSelected = (
  routeId: PublicReadRouteId,
  routeOwnership: PublicReadRouteOwnership,
): void => {
  if (
    routeOwnership.selectedRoutes.length > 0 &&
    !routeOwnership.selectedRoutes.includes(routeId)
  ) {
    throw new Error(
      `${routeId} is not selected for Go ownership in this topology`,
    )
  }
}

export const createPublicReadService = ({
  env = process.env,
  goClient,
  fetchImpl,
}: CreatePublicReadServiceOptions = {}): PublicReadService => {
  const routeOwnership = resolvePublicReadRouteOwnership(env)
  const selectedGoClient =
    goClient ??
    (env.COWARDS_GO_BACKEND_URL
      ? createPublicGoReadClient({
          baseUrl: env.COWARDS_GO_BACKEND_URL,
          ...(fetchImpl ? { fetchImpl } : {}),
        })
      : null)

  return {
    async getPublicMatchSetSummary(matchSetId) {
      assertRouteGoSelected("getPublicMatchSetSummary", routeOwnership)
      return requireGoClient(
        "getPublicMatchSetSummary",
        selectedGoClient,
      ).getPublicMatchSetSummary(matchSetId)
    },
    async getPublicReplayMetadata(matchId) {
      assertRouteGoSelected("getPublicReplayMetadata", routeOwnership)
      return requireGoClient(
        "getPublicReplayMetadata",
        selectedGoClient,
      ).getPublicReplayMetadata(matchId)
    },
    async getPublicStrategyPage(strategyId) {
      assertRouteGoSelected("getPublicStrategyPage", routeOwnership)
      return requireGoClient(
        "getPublicStrategyPage",
        selectedGoClient,
      ).getPublicStrategyPage(strategyId)
    },
    async getPublicPlayerPage(handle) {
      assertRouteGoSelected("getPublicPlayerPage", routeOwnership)
      return requireGoClient(
        "getPublicPlayerPage",
        selectedGoClient,
      ).getPublicPlayerPage(handle)
    },
    async getPublicLadderSeason(seasonId) {
      assertRouteGoSelected("getPublicLadderSeason", routeOwnership)
      return requireGoClient(
        "getPublicLadderSeason",
        selectedGoClient,
      ).getPublicLadderSeason(seasonId)
    },
  }
}

export const publicReadService = createPublicReadService()

export const publicGoReadFailureDiagnostic = (
  error: unknown,
): PublicGoReadFailureDiagnostic | null =>
  isPublicGoReadError(error) ? error.diagnostic : null

export const getCurrentPublicReadUser =
  async (): Promise<PublicReadUser | null> => (await getAccountSession()).user
