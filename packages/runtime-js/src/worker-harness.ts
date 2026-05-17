export const WORKER_HARNESS_SOURCE = `
import vm from "node:vm"
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

const isForbiddenCapabilityMessage = (message) =>
  message.startsWith(FORBIDDEN_CAPABILITY) ||
  /code generation from strings/i.test(message)

const createSandbox = () => {
  const module = { exports: {} }
  const sandbox = {
    module,
    exports: module.exports,
    eval: forbiddenFunction("eval"),
    Function: forbiddenFunction("Function"),
    process: forbiddenFunction("process"),
    require: forbiddenFunction("require"),
    fetch: forbiddenFunction("fetch"),
    WebAssembly: forbiddenFunction("WebAssembly"),
    Worker: forbiddenFunction("Worker"),
    Date: forbiddenFunction("Date"),
    setTimeout: forbiddenFunction("setTimeout"),
    setInterval: forbiddenFunction("setInterval"),
    setImmediate: forbiddenFunction("setImmediate"),
    Math: sanitizedMath,
    globalThis: sanitizedGlobalThis,
    __methodName: workerData.methodName,
    __inputJson: JSON.stringify(workerData.input),
    __result: undefined,
  }
  return vm.createContext(sandbox, {
    codeGeneration: { strings: false, wasm: false },
  })
}

const runStrategy = (source) => {
  const context = createSandbox()
  new vm.Script(source).runInContext(context)
  new vm.Script(\`
    const strategy = module.exports && module.exports.default
    const method = strategy && strategy[__methodName]
    if (typeof method !== "function") {
      __result = {
        ok: false,
        violation: { type: "INVALID_OUTPUT", message: "Strategy method is missing" },
      }
    } else {
      const value = method.call(strategy, JSON.parse(__inputJson))
      if (value && typeof value.then === "function") {
        __result = {
          ok: false,
          violation: {
            type: "INVALID_OUTPUT",
            message: "Strategy methods must return synchronously",
          },
        }
      } else {
        __result = { ok: true, value }
      }
    }
  \`).runInContext(context)
  return context.__result
}

const port = workerData.port
const signal = new Int32Array(workerData.signalBuffer)

try {
  port.postMessage(runStrategy(workerData.source))
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  port.postMessage({
    ok: false,
    violation: isForbiddenCapabilityMessage(message)
      ? toViolation("FORBIDDEN_CAPABILITY", message)
      : toViolation("THROWN_EXCEPTION", message),
  })
} finally {
  Atomics.store(signal, 0, 1)
  Atomics.notify(signal, 0)
  port.close()
}
`
