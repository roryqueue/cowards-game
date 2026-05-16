export const WORKER_HARNESS_SOURCE = `
import { workerData } from "node:worker_threads"

const FORBIDDEN_CAPABILITY = "FORBIDDEN_CAPABILITY"

const forbiddenError = (name) => new Error(\`\${FORBIDDEN_CAPABILITY}: \${name}\`)

const forbiddenFunction = (name) =>
  new Proxy(function blockedCapability() {}, {
    apply() {
      throw forbiddenError(name)
    },
    construct() {
      throw forbiddenError(name)
    },
    get() {
      throw forbiddenError(name)
    },
  })

const sanitizedGlobalThis = new Proxy(Object.freeze({}), {
  get(_target, prop) {
    throw forbiddenError(String(prop))
  },
  set(_target, prop) {
    throw forbiddenError(String(prop))
  },
})

const sanitizedMath = new Proxy(Math, {
  get(target, prop) {
    if (prop === "random") {
      throw forbiddenError("Math.random")
    }
    const value = Reflect.get(target, prop)
    return typeof value === "function" ? value.bind(target) : value
  },
})

const toViolation = (type, message) => ({ type, message })

const compileStrategy = (source) => {
  const body = source.trim().replace(/^export\\s+default\\s+/, "return ")
  const blockedNames = [
    "eval",
    "Function",
    "process",
    "require",
    "fetch",
    "WebAssembly",
    "Worker",
    "Date",
    "setTimeout",
    "setInterval",
    "setImmediate",
    "Math",
    "globalThis",
  ]
  const blockedValues = [
    forbiddenFunction("eval"),
    forbiddenFunction("Function"),
    forbiddenFunction("process"),
    forbiddenFunction("require"),
    forbiddenFunction("fetch"),
    forbiddenFunction("WebAssembly"),
    forbiddenFunction("Worker"),
    forbiddenFunction("Date"),
    forbiddenFunction("setTimeout"),
    forbiddenFunction("setInterval"),
    forbiddenFunction("setImmediate"),
    sanitizedMath,
    sanitizedGlobalThis,
  ]
  return Function(...blockedNames, body)(...blockedValues)
}

const port = workerData.port
const signal = new Int32Array(workerData.signalBuffer)

try {
  const strategy = compileStrategy(workerData.source)
  const method = strategy?.[workerData.methodName]

  if (typeof method !== "function") {
    port.postMessage({
      ok: false,
      violation: toViolation("INVALID_OUTPUT", "Strategy method is missing"),
    })
  } else {
    const value = method.call(strategy, workerData.input)

    if (value && typeof value.then === "function") {
      port.postMessage({
        ok: false,
        violation: toViolation("INVALID_OUTPUT", "Strategy methods must return synchronously"),
      })
    } else {
      port.postMessage({ ok: true, value })
    }
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  port.postMessage({
    ok: false,
    violation: message.startsWith(FORBIDDEN_CAPABILITY)
      ? toViolation("FORBIDDEN_CAPABILITY", message)
      : toViolation("THROWN_EXCEPTION", message),
  })
} finally {
  Atomics.store(signal, 0, 1)
  Atomics.notify(signal, 0)
  port.close()
}
`
