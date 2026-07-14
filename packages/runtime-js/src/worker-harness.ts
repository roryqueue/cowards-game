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

const encoder = new TextEncoder()
const forbidden = (name) => new Proxy(function blocked() {}, {
  apply() { throw new Error("FORBIDDEN_CAPABILITY:" + name) },
  construct() { throw new Error("FORBIDDEN_CAPABILITY:" + name) },
  get() { throw new Error("FORBIDDEN_CAPABILITY:" + name) },
})
const compareBytes = (left, right) => {
  const a = encoder.encode(left)
  const b = encoder.encode(right)
  for (let index = 0; index < Math.min(a.length, b.length); index += 1) {
    if (a[index] !== b[index]) return a[index] - b[index]
  }
  return a.length - b.length
}
const canonical = (value) => {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return JSON.stringify(value)
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("INVALID_OUTPUT")
    return Object.is(value, -0) ? "0" : JSON.stringify(value).replace(/e\\+/u, "e")
  }
  if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]"
  if (typeof value !== "object" || value === undefined) throw new Error("INVALID_OUTPUT")
  const prototype = Object.getPrototypeOf(value)
  if (prototype !== Object.prototype && prototype !== null) throw new Error("INVALID_OUTPUT")
  return "{" + Object.keys(value).sort(compareBytes).map((key) =>
    JSON.stringify(key) + ":" + canonical(value[key])
  ).join(",") + "}"
}
const moduleSource = (source) => [
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
  'const console = forbidden("console")',
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
const main = async () => {
  let output
  try {
    const imported = await import(moduleUrl(workerData.source).href)
    const strategy = imported.default
    const method = strategy && strategy[workerData.methodName]
    if (typeof method !== "function") {
      output = frame("I")
    } else {
      const value = method.call(strategy, workerData.input)
      if (value && typeof value.then === "function") {
        output = frame("I")
      } else {
        const payload = encoder.encode(canonical(value))
        output = payload.length > workerData.outputByteLimit
          ? frame("O")
          : frame("S", payload)
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : ""
    output = frame(message.startsWith("FORBIDDEN_CAPABILITY:") ? "F" : "X")
  }
  workerData.port.postMessage(output, [output.buffer])
  Atomics.store(new Int32Array(workerData.signalBuffer), 0, 1)
  Atomics.notify(new Int32Array(workerData.signalBuffer), 0)
  workerData.port.close()
}
void main()
`
