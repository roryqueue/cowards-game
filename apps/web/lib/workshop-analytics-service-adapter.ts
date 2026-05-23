import { createDatabasePool } from "@cowards/persistence/db"
import { createCowardsLocalService } from "@cowards/service"

type WorkshopAnalyticsReadPool = ReturnType<typeof createDatabasePool>
type WithPool = <T>(
  fn: (pool: WorkshopAnalyticsReadPool) => Promise<T>,
) => Promise<T>

const withDatabasePool: WithPool = async (fn) => {
  const pool = createDatabasePool()
  try {
    return await fn(pool)
  } finally {
    await pool.end()
  }
}

export const workshopAnalyticsReadService = createCowardsLocalService({
  withPool: withDatabasePool,
})
