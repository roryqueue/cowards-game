import { describe, expect, it } from "vitest"
import { STRATEGY_SOURCE_BYTES } from "@cowards/spec"
import { validateStrategySource } from "./validation.js"

const validSource = `
export default {
  selectActivations() {
    return { activationOrders: [], strategyMemory: {} }
  },
  soldierBrain() {
    return { action: { type: "TURN_TO_STONE" }, soldierMemory: {} }
  },
}
`

const expectCode = (source: string, code: string) => {
  const report = validateStrategySource(source)

  expect(report.valid).toBe(false)
  expect(report.errors.map((error) => error.code)).toContain(code)
}

describe("validateStrategySource", () => {
  it.each([
    ["eval(", validSource.replace("return", "eval('1'); return")],
    [
      "Function(",
      validSource.replace("return", "Function('return 1')(); return"),
    ],
    [
      "new Function",
      validSource.replace("return", "new Function('return 1')(); return"),
    ],
    [
      "constructor recovery",
      validSource.replace(
        "return",
        "(() => {}).constructor('return process')(); return",
      ),
    ],
    ["process", validSource.replace("return", "process; return")],
    ["process.env", validSource.replace("return", "process.env; return")],
    ["require(", validSource.replace("return", `require("fs"); return`)],
    ["node:fs", validSource.replace("return", `"node:fs"; return`)],
    ["fs/promises", validSource.replace("return", `"fs/promises"; return`)],
    ["node:http", validSource.replace("return", `"node:http"; return`)],
    ["node:https", validSource.replace("return", `"node:https"; return`)],
    ["fetch(", validSource.replace("return", "fetch('/x'); return")],
    ["Date.now", validSource.replace("return", "Date.now(); return")],
    ["new Date", validSource.replace("return", "new Date(); return")],
    ["Math.random", validSource.replace("return", "Math.random(); return")],
    ["Worker(", validSource.replace("return", "Worker('x'); return")],
    [
      "worker_threads",
      validSource.replace("return", `"worker_threads"; return`),
    ],
    ["child_process", validSource.replace("return", `"child_process"; return`)],
    ["WebAssembly", validSource.replace("return", "WebAssembly; return")],
    ["npm install", validSource.replace("return", `"npm install x"; return`)],
    ["pnpm add", validSource.replace("return", `"pnpm add x"; return`)],
    ["yarn add", validSource.replace("return", `"yarn add x"; return`)],
  ])("rejects forbidden category: %s", (_label, source) => {
    expectCode(source, "FORBIDDEN_PATTERN")
  })

  it("uses IMPORT_NOT_ALLOWED for import expressions", () => {
    expectCode(
      `import { x } from "module"\n${validSource}`,
      "IMPORT_NOT_ALLOWED",
    )
    expectCode(
      validSource.replace("return", `import("x"); return`),
      "IMPORT_NOT_ALLOWED",
    )
  })

  it("rejects source size overflow", () => {
    const source = `export default { selectActivations() {}, soldierBrain() {} }\n${"x".repeat(
      STRATEGY_SOURCE_BYTES,
    )}`

    expectCode(source, "SOURCE_TOO_LARGE")
  })

  it("rejects missing default export and method names", () => {
    expectCode("const strategy = {}", "MISSING_DEFAULT_EXPORT")
    expectCode(
      "export default { soldierBrain() {} }",
      "MISSING_SELECT_ACTIVATIONS",
    )
    expectCode(
      "export default { selectActivations() {} }",
      "MISSING_SOLDIER_BRAIN",
    )
  })

  it("rejects async strategy methods with ASYNC_METHOD_NOT_ALLOWED", () => {
    expectCode(
      validSource.replace("selectActivations()", "async selectActivations()"),
      "ASYNC_METHOD_NOT_ALLOWED",
    )
    expectCode(
      validSource.replace("soldierBrain()", "soldierBrain: async function()"),
      "ASYNC_METHOD_NOT_ALLOWED",
    )
  })

  it("rejects syntactically invalid source with TRANSPILE_FAILED", () => {
    expectCode(
      "export default { selectActivations() {}, soldierBrain() {",
      "TRANSPILE_FAILED",
    )
  })

  it("accepts a valid minimal strategy", () => {
    const report = validateStrategySource(validSource)

    expect(report.valid).toBe(true)
    expect(report.errors).toEqual([])
    expect(report.warnings).toEqual([])
    expect(report.sourceHash).toMatch(/^[a-f0-9]{64}$/)
    expect(report.sourceBytes).toBe(
      new TextEncoder().encode(validSource).length,
    )
  })
})
