import { runtimeJsWorkerEntrypoint } from "@cowards/runtime-js/worker"
import { createDatabasePool } from "@cowards/persistence"
import { runWorkerLoop } from "./runner.js"
import {
  createWorkerRuntimeConfig,
  formatWorkerRuntimeConfigLogLines,
} from "./runtime-config.js"

const runtimeConfig = createWorkerRuntimeConfig({
  strategyExecutionAdapter: process.env.STRATEGY_EXECUTION_ADAPTER,
})

console.log("Coward's Game worker ready")
console.log(`${runtimeJsWorkerEntrypoint} ready`)
for (const line of formatWorkerRuntimeConfigLogLines(runtimeConfig)) {
  console.log(line)
}

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
  runtimeConfig,
}).catch((error: unknown) => {
  console.error(error)
  void shutdown().finally(() => process.exit(1))
})
