import { afterEach, describe, expect, it } from "vitest"
import { mkdtempSync, readFileSync, realpathSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { buildPlannerValidationInventory, evaluatePlannerValidation, parsePlannerArguments, preparePlannerFeasibility, verifyPlannerFeasibility, runPlannerFeasibility } from "./run-v1-38-planner-feasibility.js"

const dirs: string[] = []
afterEach(() => { for (const dir of dirs.splice(0)) rmSync(dir,{ recursive: true,force: true }) })
describe("private feasibility CLI synthetic/read-only modes", () => {
  it("requires one exact mode and explicit private paths, never silently runs", () => {
    expect(() => parsePlannerArguments([])).toThrow()
    expect(() => parsePlannerArguments(["--run","--verify","--manifest","a","--output","b"])).toThrow()
    expect(() => parsePlannerArguments(["--run","--manifest","a","--output","b","--secret","x"])).toThrow()
    expect(parsePlannerArguments(["--verify","--manifest","a","--output","b"]).mode).toBe("verify")
  })
  it("freezes exactly256 classified cases and rejects missing/duplicated/tampered records", () => {
    const inventory = buildPlannerValidationInventory()
    expect(inventory.cases).toHaveLength(256)
    expect(inventory.cases.filter(c => c.family === "pair")).toHaveLength(128)
    expect(inventory.cases.filter(c => c.family === "tactic")).toHaveLength(64)
    expect(inventory.cases.filter(c => c.family === "hostile")).toHaveLength(64)
    expect(new Set(inventory.cases.map(c => c.root)).size).toBe(256)
    expect(() => evaluatePlannerValidation(inventory,[])).toThrow()
  })
  it("temporary prepare is no-clobber; verify prepared state never executes; unresolved review blocks run", async () => {
    const root = realpathSync(mkdtempSync(join(tmpdir(),"lab-cli-test-"))); dirs.push(root)
    const options = { manifestPath: join(root,"manifest.json"),outputDirectory: join(root,"phase263-feasibility") }
    const manifest = preparePlannerFeasibility(options)
    expect(manifest.claimClass).toBe("private_offline")
    expect(() => preparePlannerFeasibility(options)).toThrow()
    expect(verifyPlannerFeasibility(options)).toMatchObject({ status: "prepared",executed: false })
    expect(readFileSync(options.manifestPath,"utf8")).not.toContain("SECRET")
    await expect(runPlannerFeasibility(options)).rejects.toThrow(/REVIEW/)
    expect(resolve(options.outputDirectory)).not.toBe(process.cwd())
  },30000)
})
