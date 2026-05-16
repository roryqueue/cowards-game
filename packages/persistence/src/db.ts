import { Pool, type PoolClient } from "pg"

export interface DatabaseConfig {
  connectionString: string
}

export const defaultDatabaseUrl =
  "postgresql://cowards:cowards@localhost:5432/cowards"

export const loadDatabaseConfig = (
  env: NodeJS.ProcessEnv = process.env,
): DatabaseConfig => ({
  connectionString: env.DATABASE_URL ?? defaultDatabaseUrl,
})

export const createDatabasePool = (
  config: DatabaseConfig = loadDatabaseConfig(),
): Pool => new Pool({ connectionString: config.connectionString })

export const withTransaction = async <T>(
  pool: Pool,
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> => {
  const client = await pool.connect()
  try {
    await client.query("begin")
    const result = await fn(client)
    await client.query("commit")
    return result
  } catch (error) {
    await client.query("rollback")
    throw error
  } finally {
    client.release()
  }
}
