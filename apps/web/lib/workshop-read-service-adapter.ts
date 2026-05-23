import { createDatabasePool } from "@cowards/persistence/db"
import { createCowardsLocalService } from "@cowards/service"

type WorkshopReadPool = ReturnType<typeof createDatabasePool>
type WithPool = <T>(fn: (pool: WorkshopReadPool) => Promise<T>) => Promise<T>

const withDatabasePool: WithPool = async (fn) => {
  const pool = createDatabasePool()
  try {
    return await fn(pool)
  } finally {
    await pool.end()
  }
}

export const workshopReadService = createCowardsLocalService({
  withPool: withDatabasePool,
})
