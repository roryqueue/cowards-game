import { runtimeJsWorkerEntrypoint } from "@cowards/runtime-js/worker"
import { createRuntimeExecutionHttpServer } from "./server.js"
import { formatRuntimeServiceConfigLogLines } from "./runtime-config.js"
import { runtimeServiceConfigFromEnvironment } from "./production-runtime-config.js"
import {
  createRuntimeEvidenceAuthorityLoader,
  createRuntimeEvidenceAuthorityLoaderV117,
  runtimeEvidenceAuthorityConfigFromEnvironment,
} from "./runtime-evidence-authority.js"

const startRuntimeExecutionService = (): void => {
  const authorityConfig = runtimeEvidenceAuthorityConfigFromEnvironment()
  const authorityLoader = createRuntimeEvidenceAuthorityLoader(authorityConfig)
  const authorityLoaderV117 =
    createRuntimeEvidenceAuthorityLoaderV117(authorityConfig)
  authorityLoader.load()
  const runtimeConfig = runtimeServiceConfigFromEnvironment()
  const port = Number.parseInt(process.env.RUNTIME_SERVICE_PORT ?? "3107", 10)
  const host = process.env.RUNTIME_SERVICE_HOST ?? "127.0.0.1"
  const server = createRuntimeExecutionHttpServer({
    runtimeConfig,
    authorityLoader,
    authorityLoaderV117,
  })

  console.log("Coward's Game runtime execution service ready")
  console.log(`${runtimeJsWorkerEntrypoint} ready`)
  console.log("runtime-execution-service-v1.16 ready")
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
