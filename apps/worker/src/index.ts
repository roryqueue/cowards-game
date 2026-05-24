import { runtimeJsWorkerEntrypoint } from "@cowards/runtime-js/worker"
import { createDatabasePool } from "@cowards/persistence"
import {
  assertTypeScriptWorkerEntrypointAllowed,
  formatTypeScriptWorkerOwnershipLogLine,
  runWorkerLoop,
} from "./runner.js"
import {
  createWorkerRuntimeConfig,
  formatWorkerRuntimeConfigLogLines,
} from "./runtime-config.js"

// COWARDS_TYPESCRIPT_WORKER_PURPOSE must be rollback, test, or parity.
const jobOwnership = assertTypeScriptWorkerEntrypointAllowed(process.env)

const runtimeConfig = createWorkerRuntimeConfig({
  strategyExecutionAdapter: process.env.STRATEGY_EXECUTION_ADAPTER,
})

console.log("Coward's Game TypeScript worker quarantine ready")
console.log(formatTypeScriptWorkerOwnershipLogLine(jobOwnership))
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
  jobOwnership,
}).catch((error: unknown) => {
  console.error(error)
  void shutdown().finally(() => process.exit(1))
})
