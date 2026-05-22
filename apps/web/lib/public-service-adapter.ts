import { createDatabasePool } from "@cowards/persistence/db"
import { getSession, type PublicUserAccount } from "@cowards/persistence/auth"
import { createCowardsLocalService } from "@cowards/service"
import { cookies } from "next/headers.js"
import { SESSION_COOKIE_NAME } from "./competitive-session.js"

type PublicReadPool = ReturnType<typeof createDatabasePool>
type WithPool = <T>(fn: (pool: PublicReadPool) => Promise<T>) => Promise<T>

const withDatabasePool: WithPool = async (fn) => {
  const pool = createDatabasePool()
  try {
    return await fn(pool)
  } finally {
    await pool.end()
  }
}

export type PublicReadUser = PublicUserAccount

export const publicReadService = createCowardsLocalService({
  withPool: withDatabasePool,
})

export const getCurrentPublicReadUser =
  async (): Promise<PublicReadUser | null> => {
    const sessionId = (await cookies()).get(SESSION_COOKIE_NAME)?.value ?? ""
    return (
      (await withDatabasePool((pool) => getSession(pool, sessionId)))?.user ??
      null
    )
  }
