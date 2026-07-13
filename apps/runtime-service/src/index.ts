import { runtimeJsWorkerEntrypoint } from "@cowards/runtime-js/worker"
import { createRuntimeExecutionHttpServer } from "./server.js"
import {
  createRuntimeServiceConfig,
  formatRuntimeServiceConfigLogLines,
} from "./runtime-config.js"
import {
  createRuntimeEvidenceAuthorityLoader,
  runtimeEvidenceAuthorityConfigFromEnvironment,
} from "./runtime-evidence-authority.js"

const startRuntimeExecutionService = (): void => {
  const authorityLoader = createRuntimeEvidenceAuthorityLoader(
    runtimeEvidenceAuthorityConfigFromEnvironment(),
  )
  authorityLoader.load()
  const runtimeConfig = createRuntimeServiceConfig({
    strategyExecutionAdapter: process.env.STRATEGY_EXECUTION_ADAPTER,
    allowLocalWorkerThreadFallback:
      process.env.COWARDS_RUNTIME_SERVICE_ALLOW_LOCAL_WORKER_THREAD === "1",
  })
  const port = Number.parseInt(process.env.RUNTIME_SERVICE_PORT ?? "3107", 10)
  const host = process.env.RUNTIME_SERVICE_HOST ?? "127.0.0.1"
  const server = createRuntimeExecutionHttpServer({
    runtimeConfig,
    authorityLoader,
  })

  console.log("Coward's Game runtime execution service ready")
  console.log(`${runtimeJsWorkerEntrypoint} ready`)
  console.log("runtime-execution-service-v1.15 ready")
  for (const line of formatRuntimeServiceConfigLogLines(runtimeConfig)) {
    console.log(line)
  }

  const shutdown = () => {
    server.close(() => {
      process.exit(0)
    })
  }

  process.once("SIGINT", shutdown)
  process.once("SIGTERM", shutdown)

  server.listen(port, host, () => {
    console.log(`Runtime execution service listening on ${host}:${port}`)
  })
}

try {
  startRuntimeExecutionService()
} catch {
  console.error("Coward's Game runtime execution service unavailable.")
  process.exitCode = 1
}
