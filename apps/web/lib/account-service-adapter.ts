import { createDatabasePool } from "@cowards/persistence/db"
import { createCowardsLocalService } from "@cowards/service"
import { cookies } from "next/headers.js"
import { SESSION_COOKIE_NAME } from "./competitive-session.js"
import {
  createGoBackendServiceClient,
  type GoBackendServiceClient,
} from "./go-backend-service-client.js"

type AccountReadPool = ReturnType<typeof createDatabasePool>
type WithPool = <T>(fn: (pool: AccountReadPool) => Promise<T>) => Promise<T>

const withDatabasePool: WithPool = async (fn) => {
  const pool = createDatabasePool()
  try {
    return await fn(pool)
  } finally {
    await pool.end()
  }
}

export interface GoBackendOwnershipEnv extends Record<
  string,
  string | undefined
> {
  COWARDS_GO_BACKEND_OWNER?: string | undefined
  COWARDS_GO_AUTH_SESSION?: string | undefined
  COWARDS_GO_ACCOUNT_REVISIONS?: string | undefined
  COWARDS_GO_ACCOUNT_FORKS?: string | undefined
  COWARDS_GO_EXHIBITIONS?: string | undefined
  COWARDS_GO_BACKEND_URL?: string | undefined
  COWARDS_GO_BACKEND_SERVICE_TIMEOUT_MS?: string | undefined
  COWARDS_NO_TYPESCRIPT_BACKEND?: string | undefined
}

const isStrictNoTypeScriptBackendSelected = (
  env: GoBackendOwnershipEnv,
): boolean =>
  env.COWARDS_GO_BACKEND_OWNER === "go" ||
  env.COWARDS_NO_TYPESCRIPT_BACKEND === "1"

export const isGoAuthSessionSelected = (
  env: GoBackendOwnershipEnv = process.env,
): boolean =>
  isStrictNoTypeScriptBackendSelected(env) ||
  env.COWARDS_GO_AUTH_SESSION === "1"

export const isGoAccountRevisionsSelected = (
  env: GoBackendOwnershipEnv = process.env,
): boolean =>
  isStrictNoTypeScriptBackendSelected(env) ||
  env.COWARDS_GO_ACCOUNT_REVISIONS === "1"

export const isGoAccountForksSelected = (
  env: GoBackendOwnershipEnv = process.env,
): boolean =>
  isStrictNoTypeScriptBackendSelected(env) ||
  env.COWARDS_GO_ACCOUNT_FORKS === "1"

export const assertGoAccountForksCanReadBack = (
  env: GoBackendOwnershipEnv = process.env,
): void => {
  if (isGoAccountForksSelected(env) && !isGoAccountRevisionsSelected(env)) {
    throw new Error(
      "account forks Go ownership requires Go-owned account revision reads",
    )
  }
}

export const isGoExhibitionsSelected = (
  env: GoBackendOwnershipEnv = process.env,
): boolean =>
  isStrictNoTypeScriptBackendSelected(env) || env.COWARDS_GO_EXHIBITIONS === "1"

const selectedGoBackendTimeoutMs = (
  env: GoBackendOwnershipEnv = process.env,
): number => {
  const parsed = Number.parseInt(
    env.COWARDS_GO_BACKEND_SERVICE_TIMEOUT_MS ?? "",
    10,
  )
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 30_000
}

export const createSelectedGoBackendClient = (
  env: GoBackendOwnershipEnv = process.env,
  fetchImpl?: typeof fetch,
): GoBackendServiceClient | null =>
  env.COWARDS_GO_BACKEND_URL
    ? createGoBackendServiceClient({
        baseUrl: env.COWARDS_GO_BACKEND_URL,
        timeoutMs: selectedGoBackendTimeoutMs(env),
        ...(fetchImpl ? { fetchImpl } : {}),
      })
    : null

export const requireSelectedGoBackendClient = (
  routeFamily: string,
  env: GoBackendOwnershipEnv = process.env,
): GoBackendServiceClient => {
  const client = createSelectedGoBackendClient(env)
  if (!client) {
    throw new Error(
      `${routeFamily} Go ownership requires COWARDS_GO_BACKEND_URL`,
    )
  }
  return client
}

export const createAccountReadService = ({
  env = process.env,
  goClient = createSelectedGoBackendClient(env),
}: {
  env?: GoBackendOwnershipEnv | undefined
  goClient?: GoBackendServiceClient | null | undefined
} = {}) => {
  let localService: ReturnType<typeof createCowardsLocalService> | undefined
  const getLocalService = (): ReturnType<typeof createCowardsLocalService> => {
    localService ??= createCowardsLocalService({
      withPool: withDatabasePool,
    })
    return localService
  }
  return {
    async getAuthSession(sessionId: string) {
      if (!isGoAuthSessionSelected(env)) {
        return getLocalService().getAuthSession(sessionId)
      }
      if (!goClient) {
        throw new Error(
          "auth/session Go ownership requires COWARDS_GO_BACKEND_URL",
        )
      }
      return goClient.getAuthSession(sessionId)
    },
    async listStrategyRevisions(sessionId: string) {
      if (!isGoAccountRevisionsSelected(env)) {
        return getLocalService().listStrategyRevisions(sessionId)
      }
      if (!goClient) {
        throw new Error(
          "account revisions Go ownership requires COWARDS_GO_BACKEND_URL",
        )
      }
      return goClient.listStrategyRevisions(sessionId)
    },
  }
}

export const accountReadService = createAccountReadService()

export const getAccountSessionId = async (): Promise<string> =>
  (await cookies()).get(SESSION_COOKIE_NAME)?.value ?? ""
