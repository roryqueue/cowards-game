import { expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { plannerExecutableClosure } from "./v1-38-executable-closure.js"
const repository = fileURLToPath(new URL("../../", import.meta.url))
it("binds selected executor, ABI and kernel changes and rejects unresolved imports", () => {
  const entries = ["scripts/run-v1-38-planner-feasibility.ts"]
  const baseline = plannerExecutableClosure(repository, entries)
  for (const target of ["packages/runtime-js/src/executor.ts", "packages/spec/src/schemas.ts", "packages/engine/src/kernel/step.ts"]) {
    expect(baseline.files.some(file => file.path === target)).toBe(true)
    const changed = plannerExecutableClosure(repository, entries, path => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8") + (path === target ? "\n// changed executable dependency" : ""))
    expect(changed.root).not.toBe(baseline.root)
  }
  expect(baseline.files.some(file => file.path.startsWith("dependency:"))).toBe(true)
  expect(baseline.files.some(file => file.path.startsWith(".planning/"))).toBe(false)
  expect(() => plannerExecutableClosure(repository, entries, path => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8") + (path === entries[0] ? '\nimport "./does-not-exist.js"' : ""))).toThrow(/UNRESOLVED/)
}, 30000)
