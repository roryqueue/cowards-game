import {
  assertTypeScriptWorkerEntrypointAllowed,
  TypeScriptWorkerRetiredError,
} from "./runner.js"

try {
  assertTypeScriptWorkerEntrypointAllowed()
} catch (error) {
  const retirement =
    error instanceof TypeScriptWorkerRetiredError
      ? error
      : new TypeScriptWorkerRetiredError()
  process.stderr.write(
    `${JSON.stringify({
      code: retirement.code,
      message: retirement.message,
    })}\n`,
  )
  process.exitCode = 1
}
