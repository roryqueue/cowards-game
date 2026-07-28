import { CANDIDATE_BOUNDED_CANONICAL_SOURCE } from "./candidate-bounded-canonical-source.js"

export const WORKER_SIGNAL_V117 = Object.freeze({
  starting: 0,
  ready: 1,
  go: 2,
  done: 3,
} as const)

export const WORKER_HARNESS_SOURCE = `
import { workerData } from "node:worker_threads"

const FORBIDDEN_CAPABILITY = "FORBIDDEN_CAPABILITY"

const forbiddenError = (name) =>
  new Error(FORBIDDEN_CAPABILITY + ": " + name)

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

const installFunctionConstructorBlock = () => {
  Object.defineProperty(Function.prototype, "constructor", {
    value: forbiddenFunction("Function.constructor"),
    writable: false,
    configurable: false,
  })
}

const installGlobalBlocks = () => {
  Object.defineProperty(globalThis, "eval", {
    value: forbiddenFunction("eval"),
    writable: false,
    configurable: false,
  })
  Object.defineProperty(globalThis, "Math", {
    value: sanitizedMath,
    writable: false,
    configurable: false,
  })
}

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

const byteLength = (text) => new TextEncoder().encode(text).length

const isPlainJsonObject = (value) => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false
  }

  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

const isJsonValue = (value) => {
  if (value === null) {
    return true
  }

  switch (typeof value) {
    case "string":
    case "boolean":
      return true
    case "number":
      return Number.isFinite(value)
    case "object":
      if (Array.isArray(value)) {
        return value.every(isJsonValue)
      }
      if (!isPlainJsonObject(value)) {
        return false
      }
      return Object.values(value).every(isJsonValue)
    default:
      return false
  }
}

const outputByteLimit = () =>
  typeof workerData.outputByteLimit === "number" && workerData.outputByteLimit > 0
    ? workerData.outputByteLimit
    : 262144

const capRuntimeResult = (result) => {
  if (result.ok && !isJsonValue(result.value)) {
    return {
      ok: false,
      violation: {
        type: "INVALID_OUTPUT",
        message: "Strategy method must return JSON-only data",
      },
    }
  }

  let serialized
  try {
    serialized = JSON.stringify(result)
  } catch {
    return {
      ok: false,
      violation: {
        type: "INVALID_OUTPUT",
        message: "Strategy method must return JSON-only data",
      },
    }
  }

  const capBytes = outputByteLimit()
  if (byteLength(serialized) > capBytes) {
    return {
      ok: false,
      violation: {
        type: "OVERSIZED_OUTPUT",
        message: "Strategy output exceeded " + capBytes + " bytes",
      },
    }
  }

  return JSON.parse(serialized)
}

const isForbiddenCapabilityMessage = (message) =>
  message.startsWith(FORBIDDEN_CAPABILITY) ||
  /code generation from strings/i.test(message)

const createStrategyModuleSource = (source) =>
  [
    'const FORBIDDEN_CAPABILITY = "FORBIDDEN_CAPABILITY"',
    'const forbiddenError = (name) => new Error(FORBIDDEN_CAPABILITY + ": " + name)',
    'const forbiddenFunction = (name) => new Proxy(function blockedCapability() {}, {',
    '  apply() { throw forbiddenError(name) },',
    '  construct() { throw forbiddenError(name) },',
    '  get() { throw forbiddenError(name) },',
    '})',
    'const sanitizedGlobalThis = new Proxy(Object.freeze({}), {',
    '  get(_target, prop) { throw forbiddenError(String(prop)) },',
    '  set(_target, prop) { throw forbiddenError(String(prop)) },',
    '})',
    'const module = { exports: {} }',
    'const exports = module.exports',
    'const Function = forbiddenFunction("Function")',
    'const process = forbiddenFunction("process")',
    'const require = forbiddenFunction("require")',
    'const fetch = forbiddenFunction("fetch")',
    'const WebAssembly = forbiddenFunction("WebAssembly")',
    'const Worker = forbiddenFunction("Worker")',
    'const Date = forbiddenFunction("Date")',
    'const crypto = forbiddenFunction("crypto")',
    'const performance = forbiddenFunction("performance")',
    'const Buffer = forbiddenFunction("Buffer")',
    'const queueMicrotask = forbiddenFunction("queueMicrotask")',
    'const setTimeout = forbiddenFunction("setTimeout")',
    'const setInterval = forbiddenFunction("setInterval")',
    'const setImmediate = forbiddenFunction("setImmediate")',
    'const console = forbiddenFunction("console")',
    'const global = sanitizedGlobalThis',
    'const globalThis = sanitizedGlobalThis',
    source,
    'const strategy = module.exports && module.exports.default',
    'export default strategy',
  ].join("\\n")

const strategyModuleUrl = (source) =>
  new URL(
    "data:text/javascript;charset=utf-8," +
      encodeURIComponent(createStrategyModuleSource(source)),
  )

const runStrategy = async (source) => {
  installGlobalBlocks()
  const imported = await import(strategyModuleUrl(source).href)
  installFunctionConstructorBlock()
  const strategy = imported.default
  const method = strategy && strategy[workerData.methodName]
  if (typeof method !== "function") {
    return {
      ok: false,
      violation: { type: "INVALID_OUTPUT", message: "Strategy method is missing" },
    }
  }

  const value = method.call(strategy, workerData.input)
  if (value && typeof value.then === "function") {
    return {
      ok: false,
      violation: {
        type: "INVALID_OUTPUT",
        message: "Strategy methods must return synchronously",
      },
    }
  }

  return { ok: true, value }
}

const main = async () => {
  try {
    port.postMessage(capRuntimeResult(await runStrategy(workerData.source)))
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
}

const port = workerData.port
const signal = new Int32Array(workerData.signalBuffer)

void main()
`

/** Inactive v1.17 guest. It receives no authentication material. */
export const WORKER_HARNESS_V117_SOURCE = `
import { workerData } from "node:worker_threads"

const forbidden = (name) => new Proxy(function blocked() {}, {
  apply() { throw new Error("FORBIDDEN_CAPABILITY:" + name) },
  construct() { throw new Error("FORBIDDEN_CAPABILITY:" + name) },
  get() { throw new Error("FORBIDDEN_CAPABILITY:" + name) },
})
const sanitizedMath = new Proxy(Math, {
  get(target, property) {
    if (property === "random") throw new Error("FORBIDDEN_CAPABILITY:Math.random")
    const value = Reflect.get(target, property)
    return typeof value === "function" ? value.bind(target) : value
  },
})
const installGlobalBlocks = () => {
  Object.defineProperty(globalThis, "eval", {
    value: forbidden("eval"), writable: false, configurable: false,
  })
  Object.defineProperty(globalThis, "Math", {
    value: sanitizedMath, writable: false, configurable: false,
  })
  Object.defineProperty(Function.prototype, "constructor", {
    value: forbidden("Function.constructor"), writable: false, configurable: false,
  })
}
const moduleSource = (source) => [
  'const sanitizedGlobalThis = new Proxy(Object.freeze({}), { get(_target, property) { throw new Error("FORBIDDEN_CAPABILITY:" + String(property)) }, set(_target, property) { throw new Error("FORBIDDEN_CAPABILITY:" + String(property)) } })',
  'const module = { exports: {} }',
  'const exports = module.exports',
  'const forbidden = (name) => new Proxy(function blocked() {}, { apply() { throw new Error("FORBIDDEN_CAPABILITY:" + name) }, construct() { throw new Error("FORBIDDEN_CAPABILITY:" + name) }, get() { throw new Error("FORBIDDEN_CAPABILITY:" + name) } })',
  'const Function = forbidden("Function")',
  'const process = forbidden("process")',
  'const require = forbidden("require")',
  'const fetch = forbidden("fetch")',
  'const WebAssembly = forbidden("WebAssembly")',
  'const Worker = forbidden("Worker")',
  'const Date = forbidden("Date")',
  'const crypto = forbidden("crypto")',
  'const performance = forbidden("performance")',
  'const Buffer = forbidden("Buffer")',
  'const queueMicrotask = forbidden("queueMicrotask")',
  'const setTimeout = forbidden("setTimeout")',
  'const setInterval = forbidden("setInterval")',
  'const setImmediate = forbidden("setImmediate")',
  'const console = forbidden("console")',
  'const global = sanitizedGlobalThis',
  'const globalThis = sanitizedGlobalThis',
  source,
  'export default module.exports && module.exports.default',
].join("\\n")
const moduleUrl = (source) => new URL(
  "data:text/javascript;charset=utf-8," + encodeURIComponent(moduleSource(source)),
)
const frame = (tag, payload = new Uint8Array()) => {
  const bytes = new Uint8Array(payload.length + 1)
  bytes[0] = tag.charCodeAt(0)
  bytes.set(payload, 1)
  return bytes
}
${CANDIDATE_BOUNDED_CANONICAL_SOURCE}
const caughtTag = (error, fallback) => {
  const message = error instanceof Error ? error.message : ""
  return message.startsWith("FORBIDDEN_CAPABILITY:") ? "F" : fallback
}
const signal = new Int32Array(workerData.signalBuffer)
const publish = (output) => {
  workerData.port.postMessage(output, [output.buffer])
  Atomics.store(signal, 0, ${WORKER_SIGNAL_V117.done})
  Atomics.notify(signal, 0)
  workerData.port.close()
}
const main = async () => {
  if (!workerData || typeof workerData !== "object" ||
    typeof workerData.source !== "string" || workerData.source.length === 0 ||
    (workerData.methodName !== "selectActivations" && workerData.methodName !== "soldierBrain") ||
    !Object.hasOwn(workerData, "input") ||
    !Number.isSafeInteger(workerData.outputByteLimit) || workerData.outputByteLimit < 0 ||
    workerData.outputByteLimit > 262144) {
    publish(frame("T"))
    return
  }
  let method
  let strategy
  try {
    installGlobalBlocks()
    const imported = await import(moduleUrl(workerData.source).href)
    strategy = imported.default
    method = strategy && strategy[workerData.methodName]
  } catch (error) {
    publish(frame(caughtTag(error, "R")))
    return
  }
  if (typeof method !== "function") {
    publish(frame("I"))
    return
  }

  Atomics.store(signal, 0, ${WORKER_SIGNAL_V117.ready})
  Atomics.notify(signal, 0)
  Atomics.wait(signal, 0, ${WORKER_SIGNAL_V117.ready})
  if (Atomics.load(signal, 0) !== ${WORKER_SIGNAL_V117.go}) {
    publish(frame("R"))
    return
  }

  let output
  let value
  try {
    value = method.call(strategy, workerData.input)
  } catch (error) {
    output = frame(caughtTag(error, "X"))
  }
  if (output === undefined) {
    if (value && typeof value.then === "function") {
      output = frame("I")
    } else {
      try {
        output = boundedCanonicalFrame(value, workerData.outputByteLimit)
      } catch (error) {
        output = frame(caughtTag(error, "I"))
      }
    }
  }
  publish(output)
}
void main()
`
