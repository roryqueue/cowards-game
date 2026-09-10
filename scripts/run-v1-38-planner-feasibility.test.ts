import { afterEach, describe, expect, it } from "vitest"
import { mkdtempSync, readFileSync, realpathSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { buildPlannerValidationInventory, createValidationContextOwner, evaluatePlannerValidation, parsePlannerArguments, preparePlannerFeasibility, verifyPlannerFeasibility, runPlannerFeasibility } from "./run-v1-38-planner-feasibility.js"
import { validateStrategySource } from "../packages/runtime-js/src/validation.js"
import { SoldierBrainInputV119Schema, StrategyInputV119Schema } from "@cowards/spec"

const dirs: string[] = []
afterEach(() => { for (const dir of dirs.splice(0)) rmSync(dir,{ recursive: true,force: true }) })
describe("private feasibility CLI synthetic/read-only modes", () => {
  it("owns at most two hosts across256 cases, closes fresh promptly and genuinely reuses declared contexts", () => {
    const inventory = buildPlannerValidationInventory()
    const owner = createValidationContextOwner<{ close(): { cleanupComplete: boolean; orphanedChild: boolean }; calls: number; closes: number }>(inventory.cases)
    const created: { close(): { cleanupComplete: boolean; orphanedChild: boolean }; calls: number; closes: number }[] = []
    const byContext = new Map<string,typeof created[number]>()
    let live = 0,peak = 0,rejected = 0,guestCalls = 0
    try {
      for (const c of inventory.cases) try {
        if ((c.source !== null && !validateStrategySource(c.source).valid) || !(c.method === "selectActivations" ? StrategyInputV119Schema : SoldierBrainInputV119Schema).safeParse(c.input).success) { rejected++; continue }
        const host = owner.acquire(c,() => {
          live++; peak = Math.max(peak,live)
          const instance = { calls: 0,closes: 0,close() { this.closes++; live--; return { cleanupComplete: true,orphanedChild: false } } }
          created.push(instance); return instance
        })
        const previous = byContext.get(c.context)
        if (previous) expect(host).toBe(previous)
        byContext.set(c.context,host); host.calls++; guestCalls++
      } finally { expect(owner.finishCase(c)).toBe(true) }
    } finally { expect(owner.closeAll()).toBe(true) }
    expect(rejected).toBe(24); expect(guestCalls).toBe(232)
    expect(created).toHaveLength(170)
    expect(peak).toBe(1); expect(live).toBe(0)
    expect(created.every(h => h.closes === 1)).toBe(true)
    expect(byContext.get("reused-selectActivations")?.calls).toBe(32)
    expect(byContext.get("reused-soldierBrain")?.calls).toBe(32)
  })
  it("retains failed cleanup truth, prevents replacement hosts and globally drains early errors exactly once", () => {
    const a = { ordinal: 0,context: "reused" },b = { ordinal: 1,context: "reused" }
    const owner = createValidationContextOwner([a,b])
    let closes = 0
    owner.acquire(a,() => ({ close() { closes++; return { cleanupComplete: false,orphanedChild: true } } }))
    expect(owner.finishCase(a)).toBe(true)
    expect(owner.closeAll()).toBe(false)
    expect(owner.remainingOwnedContexts).toBe(1)
    expect(() => owner.acquire(b,() => { throw new Error("must not create") })).toThrow(/CLEANUP/)
    expect(owner.closeAll()).toBe(false); expect(closes).toBe(1)
    const cap = createValidationContextOwner([{ordinal:0,context:"a"},{ordinal:1,context:"b"},{ordinal:2,context:"c"},{ordinal:3,context:"a"},{ordinal:4,context:"b"},{ordinal:5,context:"c"}])
    const clean = () => ({ close: () => ({ cleanupComplete: true,orphanedChild: false }) })
    cap.acquire({ordinal:0,context:"a"},clean); cap.acquire({ordinal:1,context:"b"},clean)
    expect(() => cap.acquire({ordinal:2,context:"c"},clean)).toThrow(/HOST_CAP/)
    expect(cap.closeAll()).toBe(true)
  })
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
