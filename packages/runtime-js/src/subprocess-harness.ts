export const SUBPROCESS_HARNESS_SOURCE = `
import { exit, stderr, stdin, stdout } from "node:process"

const FORBIDDEN_CAPABILITY = "FORBIDDEN_CAPABILITY"

const runtimeViolationTypes = new Set([
  "INVALID_OUTPUT",
  "TIMEOUT",
  "THROWN_EXCEPTION",
  "FORBIDDEN_CAPABILITY",
  "OVERSIZED_OUTPUT",
])

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

const writeDiagnostic = (message) => {
  stderr.write(String(message) + "\\n")
}

const failProtocol = (message) => {
  writeDiagnostic(message)
  exit(70)
}

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

const isRuntimeViolation = (value) =>
  isPlainJsonObject(value) &&
  runtimeViolationTypes.has(value.type) &&
  typeof value.message === "string" &&
  value.message.length > 0

const isRuntimeResult = (value) => {
  if (!isPlainJsonObject(value) || typeof value.ok !== "boolean") {
    return false
  }

  if (value.ok) {
    return Object.hasOwn(value, "value") && isJsonValue(value.value)
  }

  return Object.hasOwn(value, "violation") && isRuntimeViolation(value.violation)
}

const isSubprocessRequest = (value) =>
  isPlainJsonObject(value) &&
  typeof value.source === "string" &&
  value.source.length > 0 &&
  (value.methodName === "selectActivations" ||
    value.methodName === "soldierBrain") &&
  (value.outputByteLimit === undefined ||
    (Number.isInteger(value.outputByteLimit) && value.outputByteLimit > 0)) &&
  Object.hasOwn(value, "input") &&
  isJsonValue(value.input)

const toViolation = (type, message) => ({ type, message })

const byteLength = (text) => new TextEncoder().encode(text).length

const outputByteLimit = (request) =>
  typeof request.outputByteLimit === "number" && request.outputByteLimit > 0
    ? request.outputByteLimit
    : 262144

const capRuntimeResult = (request, result) => {
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

  const capBytes = outputByteLimit(request)
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

const runStrategy = async (request) => {
  installGlobalBlocks()
  installFunctionConstructorBlock()
  const imported = await import(strategyModuleUrl(request.source).href)
  const strategy = imported.default
  const method = strategy && strategy[request.methodName]
  if (typeof method !== "function") {
    return {
      ok: false,
      violation: {
        type: "INVALID_OUTPUT",
        message: "Strategy method is missing",
      },
    }
  }

  const value = method.call(strategy, request.input)
  if (value && typeof value.then === "function") {
    return {
      ok: false,
      violation: {
        type: "INVALID_OUTPUT",
        message: "Strategy methods must return synchronously",
      },
    }
  }

  if (!isJsonValue(value)) {
    return {
      ok: false,
      violation: {
        type: "INVALID_OUTPUT",
        message: "Strategy method must return JSON-only data",
      },
    }
  }

  return { ok: true, value }
}

const readStdin = async () => {
  let text = ""
  stdin.setEncoding("utf8")
  for await (const chunk of stdin) {
    text += chunk
  }
  return text
}

const main = async () => {
  let request
  try {
    request = JSON.parse(await readStdin())
  } catch {
    failProtocol("Subprocess request was not valid JSON")
  }

  if (!isSubprocessRequest(request)) {
    failProtocol("Subprocess request failed schema validation")
  }

  let result
  try {
    result = await runStrategy(request)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    result = {
      ok: false,
      violation: isForbiddenCapabilityMessage(message)
        ? toViolation("FORBIDDEN_CAPABILITY", message)
        : toViolation("THROWN_EXCEPTION", message),
    }
  }

  if (!isRuntimeResult(result)) {
    failProtocol("Subprocess response failed schema validation")
  }

  stdout.write(JSON.stringify(capRuntimeResult(request, result)))
}

void main()
`
