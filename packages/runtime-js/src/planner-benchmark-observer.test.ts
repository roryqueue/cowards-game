import { describe, expect, it } from "vitest"
import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import { execFileSync } from "node:child_process"
import ts from "typescript"
import { buildPlannerBenchmarkObserverHarness, WORKER_HARNESS_SOURCE, WORKER_HARNESS_V117_SOURCE } from "./worker-harness.js"

describe("private method observer source contract (no Strategy execution)", () => {
  it("keeps default and historical harness bytes exact", () => {
    const before = execFileSync("git", ["show", "233ee746:packages/runtime-js/src/worker-harness.ts"], { encoding: "utf8", cwd: new URL("../../../", import.meta.url) })
    const current = readFileSync(new URL("./worker-harness.ts", import.meta.url), "utf8")
    expect(current.startsWith(before)).toBe(true)
    expect(buildPlannerBenchmarkObserverHarness()).not.toBe(WORKER_HARNESS_SOURCE)
    expect(WORKER_HARNESS_V117_SOURCE).not.toContain("plannerNow")
  })
  it("captures clock lexically before import and measures only the actual synchronous method call", () => {
    const source = buildPlannerBenchmarkObserverHarness()
    expect(source).toContain('import { hrtime as plannerHrtime } from "node:process"')
    expect(source.indexOf("const plannerNow")).toBeLessThan(source.indexOf("const runStrategy"))
    expect(source).toContain("const started = plannerNow()")
    expect(source).toContain("try { return method.call(strategy, workerData.input) }")
    expect(source).toContain("const plannerNumber = Number")
    expect(source).toContain("finally { plannerDurationMs = plannerNumber(plannerNow() - started) / 1000000 }")
    expect(source).toContain("binding: workerData.timingBinding")
    expect(source).toContain("output: value, timing:")
    const moduleBody = source.slice(source.indexOf("const createStrategyModuleSource"), source.indexOf("const strategyModuleUrl"))
    expect(moduleBody).not.toContain("plannerNow")
    expect(moduleBody).not.toContain("timingBinding")
    expect(moduleBody).toContain('forbiddenFunction("performance")')
    const parsed = ts.createSourceFile("observer.mjs", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS)
    expect((parsed as any).parseDiagnostics).toHaveLength(0)
    expect(createHash("sha256").update(source).digest("hex")).toMatch(/^[a-f0-9]{64}$/)
  })
})
