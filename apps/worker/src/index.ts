import { runtimeJsWorkerEntrypoint } from "@cowards/runtime-js/worker"
import { createDatabasePool } from "@cowards/persistence"
import { runWorkerLoop } from "./runner.js"

console.log("Coward's Game worker ready")
console.log(`${runtimeJsWorkerEntrypoint} ready`)

const pool = createDatabasePool()

const shutdown = async () => {
  await pool.end()
}

process.once("SIGINT", () => {
  void shutdown().finally(() => process.exit(0))
})
process.once("SIGTERM", () => {
  void shutdown().finally(() => process.exit(0))
})

void runWorkerLoop(pool, {
  workerId: process.env.WORKER_ID ?? "worker:local",
}).catch((error: unknown) => {
  console.error(error)
  void shutdown().finally(() => process.exit(1))
})
