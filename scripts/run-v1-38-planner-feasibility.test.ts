import { afterEach, describe, expect, it, vi } from "vitest"
const safety = vi.hoisted(() => ({ deniedHost: vi.fn(() => { throw new Error("TEST_LIVE_HOST_DENIED") }), review: "---\nstatus: issues_found\n---\nDeterministic unresolved test fixture.\n" }))
// No routine test in this module may construct a host, regardless of the real
// repository's review state. Synthetic hosts must be explicitly supplied.
vi.mock("./lib/v1-38-planner-supervised-runtime.js", () => ({ createPlannerSupervisedRuntime: safety.deniedHost }))
vi.mock("node:fs", async importOriginal => {
  const actual = await importOriginal<typeof import("node:fs")>()
  return { ...actual, readFileSync: (...args: Parameters<typeof actual.readFileSync>) => String(args[0]).endsWith("/263-REVIEW.md") ? safety.review : Reflect.apply(actual.readFileSync, actual, args) }
})
import { mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { admitPlannerReceipt, retainedBenchmarkPass, buildPlannerValidationInventory, createValidationContextOwner, evaluatePlannerValidation, parsePlannerArguments, preparePlannerFeasibility, verifyPlannerFeasibility, runPlannerFeasibility, readPlannerChargeInventory } from "./run-v1-38-planner-feasibility.js"
import { validateStrategySource } from "../packages/runtime-js/src/validation.js"
import { SoldierBrainInputV119Schema, StrategyInputV119Schema, admitCanonicalJsonValue } from "@cowards/spec"
import { labRoot } from "../packages/strategy-lab/src/contracts.js"
import { buildFeasibilityCorpus } from "../packages/strategy-lab/src/feasibility-protocol.js"
import { MATCH_KERNEL } from "../packages/engine/src/index.js"
import { admitRetainedRuntime, admitRetainedValidationResult } from "./run-v1-38-planner-feasibility.js"
import { LAB_ADMITTED_ROOTS } from "../packages/strategy-lab/src/contracts.js"

const dirs: string[] = []
afterEach(() => { for (const dir of dirs.splice(0)) rmSync(dir,{ recursive: true,force: true }) })
describe("private feasibility CLI synthetic/read-only modes", () => {
  it("rejects altered retained runtime identity and result classification without a host",()=>{
    const root=labRoot("fixture",{}),c=buildPlannerValidationInventory().cases[0]!
    const identity={revisionId:"fixture",sourceRoot:root,executableRoot:root,tupleId:MATCH_KERNEL.tupleId,tupleRoot:LAB_ADMITTED_ROOTS.tupleRoot,image:LAB_ADMITTED_ROOTS.image,harnessRoot:root,budgetRoot:root,attemptRoot:root,runtimeLimitsRoot:LAB_ADMITTED_ROOTS.runtimeLimitsRoot}
    const request={kind:"selectActivations",semanticTupleId:MATCH_KERNEL.tupleId,requestId:c.root,coordinates:{phaseNumber:1,roundNumber:1,stage:"select_bottom",ordinal:0},input:c.input} as Parameters<typeof admitRetainedRuntime>[2]
    const e={identity,requestId:request.requestId,method:request.kind,inputRoot:labRoot("runtime-input",request.input),ordinal:0,invocationRoot:labRoot("supervised-invocation",{identity,requestId:request.requestId,method:request.kind,inputRoot:labRoot("runtime-input",request.input),ordinal:0}),charged:true,completed:true,outputBytes:1,result:{ok:false,violation:{type:"INVALID_OUTPUT",message:"synthetic"}}}
    const admitted=admitRetainedRuntime(e,identity,request,0)
    expect(()=>admitRetainedValidationResult({classification:"player_violation",value:null},admitted)).not.toThrow()
    expect(()=>admitRetainedValidationResult({classification:"success",value:null},admitted)).toThrow(/CLASSIFICATION/)
    expect(()=>admitRetainedRuntime({...e,identity:{...identity,revisionId:"changed"}},identity,request,0)).toThrow(/BINDING/)
    expect(()=>admitRetainedRuntime({...e,unknown:true},identity,request,0)).toThrow(/SCHEMA/)
    expect(safety.deniedHost).not.toHaveBeenCalled()
  })
  it("preserves durable charges without returned summaries and verifies an interrupted non-pass", () => {
    const root = realpathSync(mkdtempSync(join(tmpdir(),"lab-cli-ledger-"))); dirs.push(root)
    const paths = { manifestPath: join(root,"manifest.json"),outputDirectory: join(root,"phase263-feasibility") }
    const manifest = preparePlannerFeasibility(paths)
    const write = (file: string,value: unknown) => { const encoded = admitCanonicalJsonValue(value,{ profile:"canonical-manifest" }); if (!encoded.ok) throw Error("fixture"); writeFileSync(join(paths.outputDirectory,file),encoded.canonicalBytes) }
    write("consumed.json",{ manifestRoot:manifest.root,executionRoot:manifest.executionRoot })
    const inventory = buildPlannerValidationInventory()
    for (let i=0;i<3;i++) write(`validation/charge-${i}.json`,{manifestRoot:manifest.root,ordinal:i,caseRoot:inventory.cases[i]!.root})
    write("validation/dispatch-0.json",{manifestRoot:manifest.root,ordinal:0,caseRoot:inventory.cases[0]!.root})
    const request = {kind:"selectActivations",semanticTupleId:MATCH_KERNEL.tupleId,requestId:labRoot("benchmark-call",{sourceRoot:manifest.sourceRoot,corpusRoot:manifest.corpusRoot,ordinal:0,method:"selectActivations"}),coordinates:{phaseNumber:1,roundNumber:1,stage:"select_bottom",ordinal:0},input:buildFeasibilityCorpus().selectActivations[0]!.input}
    write("benchmark/charge-0.json",{manifestRoot:manifest.root,ordinal:0,requestRoot:labRoot("benchmark-request",request)})
    const counts = readPlannerChargeInventory(paths,true)
    expect(counts).toMatchObject({casesCharged:3,casesUnused:253,validationGuestAttempts:1,validationGuestCalls:0,validationUncertainCases:3,benchmarkCalls:1,benchmarkGuestCalls:0,benchmarkUncertainCalls:1,benchmarkCallsUnused:2199})
    const receipt = {schemaVersion:"planner-feasibility-receipt-v1",status:"non_pass",empirical:true,reason:"LAB_INTERRUPTED",...counts,matchAttemptsCharged:0,matchAttemptsUnused:24,matchAttemptsUncertain:0,cleanupComplete:false,scientificCells:8,arenaLabels:3,geometries:2,elapsedMs:1,hostPeakRssKiB:1,productionAuthorized:false}
    write("receipt.json",receipt)
    expect(verifyPlannerFeasibility(paths)).toMatchObject({status:"non_pass",executed:false})
    expect(readPlannerChargeInventory(paths)).toEqual(counts)
    for(const altered of [{...receipt,benchmarkCalls:999},{...receipt,matchAttemptsUnused:-1},{...receipt,extra:true},{...receipt,cleanupComplete:"yes"},{...receipt,validationGuestCalls:undefined}]) expect(()=>admitPlannerReceipt(altered)).toThrow()
    write("receipt.json",{...receipt,validationGuestCalls:1})
    expect(()=>verifyPlannerFeasibility(paths)).toThrow(/RECEIPT_DERIVATION/)
    write("receipt.json",receipt)
    write("lab-matches/run-binding.json",{schemaVersion:"lab-run-binding-v1",graphRoot:manifest.graphRoot,kind:"synthetic",machineRoot:manifest.machineRoot,executionRoot:manifest.executionRoot})
    expect(()=>verifyPlannerFeasibility(paths)).toThrow(/RUN_BINDING/)
    expect(safety.deniedHost).not.toHaveBeenCalled()
  },60000)
  it("never promotes complete low latency samples after failed summary or cleanup",()=>{
    expect(retainedBenchmarkPass(true,2200,true,true)).toBe(true)
    expect(retainedBenchmarkPass(true,2200,false,true)).toBe(false)
    expect(retainedBenchmarkPass(true,2200,true,false)).toBe(false)
  })
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
    expect(safety.deniedHost).not.toHaveBeenCalled() // even if real REVIEW becomes clean
    expect(resolve(options.outputDirectory)).not.toBe(process.cwd())
  },30000)
})
