import { createDatabasePool } from "@cowards/persistence/db"
import { createCowardsLocalService } from "@cowards/service"
import { cookies } from "next/headers.js"
import { SESSION_COOKIE_NAME } from "./competitive-session.js"

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

export const accountReadService = createCowardsLocalService({
  withPool: withDatabasePool,
})

export const getAccountSessionId = async (): Promise<string> =>
  (await cookies()).get(SESSION_COOKIE_NAME)?.value ?? ""
