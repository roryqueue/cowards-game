import { createDatabasePool } from "@cowards/persistence/db"
import { getSession, type PublicUserAccount } from "@cowards/persistence/auth"
import {
  createCowardsLocalService,
  type CowardsService,
} from "@cowards/service"
import { cookies } from "next/headers.js"
import {
  createPublicGoReadClient,
  isPublicGoReadError,
  type PublicGoReadClient,
  type PublicGoReadFailureDiagnostic,
} from "./public-go-read-client.js"
import { SESSION_COOKIE_NAME } from "./competitive-session.js"

type PublicReadPool = ReturnType<typeof createDatabasePool>
type WithPool = <T>(fn: (pool: PublicReadPool) => Promise<T>) => Promise<T>

export type PublicReadBackendOwner = "typescript" | "go"

export interface PublicReadRouteOwnership {
  routeId: "getPublicStrategyPage"
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
  COWARDS_GO_BACKEND_URL?: string | undefined
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
  const goSelected = env.COWARDS_GO_PUBLIC_STRATEGY_READS === "1"
  return {
    routeId: "getPublicStrategyPage",
    method: "GET",
    path: "/public/strategies/{strategyId}",
    privacyClass: "public",
    defaultOwner: "typescript",
    selectedOwner: goSelected ? "go" : "typescript",
    fallbackPolicy: "no_fallback_when_go_selected",
    rollbackOwner: "typescript",
    diagnosticsClass: "public_go_read",
    disallowedScopes,
    goBaseUrlConfigured: Boolean(env.COWARDS_GO_BACKEND_URL),
  }
}

const withDatabasePool: WithPool = async (fn) => {
  const pool = createDatabasePool()
  try {
    return await fn(pool)
  } finally {
    await pool.end()
  }
}

export type PublicReadUser = PublicUserAccount

export interface CreatePublicReadServiceOptions {
  env?: PublicReadRouteOwnershipEnv | undefined
  typescriptService?: CowardsService | undefined
  goClient?: PublicGoReadClient | undefined
  fetchImpl?: typeof fetch | undefined
  withPool?: WithPool | undefined
}

export const publicReadRouteOwnership = resolvePublicReadRouteOwnership(
  process.env,
)

export const createPublicReadService = ({
  env = process.env,
  typescriptService,
  goClient,
  fetchImpl,
  withPool = withDatabasePool,
}: CreatePublicReadServiceOptions = {}): CowardsService => {
  const routeOwnership = resolvePublicReadRouteOwnership(env)
  const localService =
    typescriptService ??
    createCowardsLocalService({
      withPool,
    })
  const selectedGoClient =
    goClient ??
    (env.COWARDS_GO_BACKEND_URL
      ? createPublicGoReadClient({
          baseUrl: env.COWARDS_GO_BACKEND_URL,
          ...(fetchImpl ? { fetchImpl } : {}),
        })
      : null)

  return {
    ...localService,
    async getPublicStrategyPage(strategyId) {
      if (routeOwnership.selectedOwner === "typescript") {
        return localService.getPublicStrategyPage(strategyId)
      }
      if (!selectedGoClient) {
        throw new Error(
          "COWARDS_GO_PUBLIC_STRATEGY_READS requires COWARDS_GO_BACKEND_URL",
        )
      }
      return selectedGoClient.getPublicStrategyPage(strategyId)
    },
  }
}

export const publicReadService = createPublicReadService()

export const publicGoReadFailureDiagnostic = (
  error: unknown,
): PublicGoReadFailureDiagnostic | null =>
  isPublicGoReadError(error) ? error.diagnostic : null

export const getCurrentPublicReadUser =
  async (): Promise<PublicReadUser | null> => {
    const sessionId = (await cookies()).get(SESSION_COOKIE_NAME)?.value ?? ""
    return (
      (await withDatabasePool((pool) => getSession(pool, sessionId)))?.user ??
      null
    )
  }
