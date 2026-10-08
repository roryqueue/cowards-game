import { describe, expect, it, vi } from "vitest"
import * as accounting from "../../packages/strategy-lab/src/league/lean-experiment.js"
import * as correction from "../run-v1-38-lean-correction.js"
import * as retained from "./v1-38-lean-correction-retained.js"
import { LEAN_COLD_REUSE_HISTORY } from "./v1-38-lean-baseline-reuse.js"
import { labRoot } from "../../packages/strategy-lab/src/contracts.js"
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

describe("fresh v12 supervisor source-only admission", () => {
  it("selects the exact one-pair route and full conservative clock", () => {
    expect(accounting.isLeanSupervisorRetestMode("v12-1")).toBe(true)
    expect(accounting.isLeanSupervisorRetestMode("v12-2")).toBe(false)
    const e = accounting.LEAN_SUPERVISOR_RETEST_V12_EXTENSION
    expect(e).toMatchObject({ priorElapsedMs: 108000000, startedAtMs: 1791455941097, elapsedMs: 136800000, charged: 34, excludedIdleMs: 0, maximumDiagnostics: 1, maximumBaselines: 1, reserveMs: 1860000 })
    expect(accounting.leanRetryRootElapsedFloorV8(e.startedAtMs + 99, e)).toBe(108000099)
    expect(accounting.leanCorrectionRoutePaths("diagnostic", "v12-1").request).toBe(".strategy-lab/lean-correction-supervisor-diagnostic-request-20261008-v12-1.json")
    for (const route of ["diagnostic", "baseline"] as const) for (const verb of ["prepare", "run", "verify", "verify-terminal"]) {
      const paths = accounting.leanCorrectionRoutePaths(route, "v12-1")
      expect(correction.parseLeanCorrectionCommand([`${verb}-supervisor-${route}-v12-1`, "--request", paths.request]).supervisor).toBe("v12-1")
      expect(() => correction.parseLeanCorrectionCommand([`${verb}-supervisor-${route}-v12-2`, "--request", paths.request])).toThrow()
    }
  })
  it("the actual semantic root excludes exactly five downstream review and authorization fields", () => {
    const r = (n: number) => labRoot("v12-synthetic-only", n)
    const draft = { schemaVersion: "lean-correction-supervisor-request-v12", route: "diagnostic", sourceRoot: r(1), candidateRoots: [r(2)], helperPath: "test-owned-helper.mts", helperBytesRoot: r(3), authorizationRoot: null, dataReviewPath: "pending", dataReviewRoot: null, helperReviewPath: "pending", helperReviewRoot: null }
    const finalized = { ...draft, authorizationRoot: r(4), dataReviewPath: "actual-data-review", dataReviewRoot: r(5), helperReviewPath: "actual-helper-review", helperReviewRoot: r(6) }
    expect(correction.leanCorrectionRequestDataRoot(finalized as never)).toBe(correction.leanCorrectionRequestDataRoot(draft as never))
    for (const changed of [{ helperBytesRoot: r(7) }, { sourceRoot: r(8) }, { route: "baseline" }, { candidateRoots: [r(9)] }]) expect(correction.leanCorrectionRequestDataRoot({ ...draft, ...changed } as never)).not.toBe(correction.leanCorrectionRequestDataRoot(draft as never))
  })
  it("admits exact v12 allocations through the real schedule, writable, capacity and reopen consumers", () => {
    const r = (n: number) => labRoot("v12-allocation-synthetic-only", n), e = accounting.LEAN_SUPERVISOR_RETEST_V12_EXTENSION
    for (const route of ["diagnostic", "baseline"] as const) {
      const body = { schemaVersion: "lean-correction-predecessor-v1" as const, chargedMatches: route === "diagnostic" ? 34 : 35, elapsedUpperBoundMs: 108000100, allocatedDiskBytes: e.physicalFloorBytes, historicalPeakDiskBytes: "unknown" as const, historicalPeakRssBytes: "unknown" as const, historyRoot: r(1), survivors: Array.from({length:661},(_,n)=>({identity:`.strategy-lab/v12-test-only-synthetic-${n}`,allocatedBytes:4096})) }
      const input = { sourceRoot:r(2), reviewRoot:r(3), coldRoot:LEAN_COLD_REUSE_HISTORY.coldRoot, planRoot:e.planRoot, candidateRoots:[r(4),r(5)], requestRoots:Array.from({length:route === "diagnostic"?1:36},(_,n)=>r(100+n)), seed:LEAN_COLD_REUSE_HISTORY.seed, route, reuseGrantRoot:r(6), supervisorDecisionRoot:e.approvalRoot, acceptedCheckRoot:route === "diagnostic"?null:r(7), requestBytesRoot:r(8), dataReviewRoot:r(9), setupAccountingRoot:r(10), predecessor:{...body,root:labRoot(body.schemaVersion,body)}, startupPolicyRoot:accounting.LEAN_STARTUP_POLICY_V5.root, timeboxExtension:e, attemptOrdinal:1 as const, priorClosureRoot:r(11), continuationRoot:r(12), acceptedReaderCloseRoot:route === "diagnostic"?null:r(13) }
      const a = accounting.createLeanSupervisorCorrectionAllocation(input,8)
      expect(accounting.leanSupervisorAllocationMode(accounting.admitLeanAllocation(JSON.parse(JSON.stringify(a))))).toBe("v12-1")
      expect(accounting.leanCapsForAllocation(a)).toEqual(accounting.LEAN_SUPERVISOR_RETEST_V12_CAPS)
      expect(accounting.leanWritablePaths(a)).toContain(".strategy-lab/lean-retest-envelope-setup-20261008-v12-1.json")
      expect(a.slots).toHaveLength(route === "diagnostic"?1:36)
      for (const change of [{attemptOrdinal:2 as const},{timeboxExtension:accounting.LEAN_TWO_PAIR_V11_EXTENSION},{priorClosureRoot:null},{continuationRoot:null}]) expect(()=>accounting.createLeanSupervisorCorrectionAllocation({...input,...change},8)).toThrow()
      expect(()=>correction.assertLeanCorrectionResources({elapsedMs:e.elapsedMs-e.reserveMs,charged:body.chargedMatches,physicalBytes:e.physicalFloorBytes,childRss:1,parentRss:1,freeBytes:accounting.LEAN_CAPS.totalBytes,availableMemoryBytes:2000000000},a)).toThrow()
    }
  })
  it("authenticates one own accepted full check plus actual FINAL per call, with no cached or duplicate audit", () => {
    const r = (n:number)=>labRoot("v12-synthetic-final",n), e = accounting.LEAN_SUPERVISOR_RETEST_V12_EXTENSION
    const closure = {timeboxExtension:e, attemptOrdinal:1, closureClass:"accepted", finalReaderClose:true, acceptedCheckAbsent:false,resultAbsent:false,currentCharges:1,cumulativeCharged:35,checkRoot:r(1),checkBytesRoot:r(2),allocationRoot:r(3),sourceRoot:r(4),requestBytesRoot:r(5),head:"a".repeat(40),readerCloseMs:e.startedAtMs+100,root:r(6)}
    const audit = vi.spyOn(retained,"authenticateLeanRetryClosureV8").mockReturnValue(closure as never), duplicate = vi.spyOn(retained,"authenticateLeanSupervisorDiagnosticCheck").mockImplementation(()=>{throw Error("DUPLICATE_AUDIT")})
    try {
      expect(correction.authenticateLeanSupervisorRetestAcceptedJoinV12("v12-1").accepted.root).toBe(r(1))
      expect(audit).toHaveBeenCalledTimes(1);expect(duplicate).not.toHaveBeenCalled()
      correction.authenticateLeanSupervisorRetestAcceptedJoinV12("v12-1");expect(audit).toHaveBeenCalledTimes(2)
      for (const changed of [{timeboxExtension:accounting.LEAN_TWO_PAIR_V11_EXTENSION},{finalReaderClose:false},{closureClass:"refused"},{attemptOrdinal:2},{checkBytesRoot:null},{cumulativeCharged:34}]) {
        audit.mockReturnValue({...closure,...changed} as never)
        expect(()=>correction.authenticateLeanSupervisorRetestAcceptedJoinV12("v12-1")).toThrow()
      }
    } finally {audit.mockRestore();duplicate.mockRestore()}
  })
  it("rejects forged historical raw joins without an old ordinary reader or current manifest", () => {
    expect(()=>retained.validateLeanSupervisorRetestHistoricalCustodyV12(new Map())).toThrow()
    const fake = new Map(Object.keys(retained.LEAN_SUPERVISOR_RETEST_V12_HISTORY_PINS).map(path=>[path,new Uint8Array([0])]))
    expect(()=>retained.validateLeanSupervisorRetestHistoricalCustodyV12(fake)).toThrow()
    expect(()=>retained.validateLeanSupervisorRetestHistoricalCustodyV12(fake,["fabricated-accepted-check"])).toThrow()
  })
  it("the actual authorization consumer binds MAIN, independent reviewer, helper and final canonical bytes", () => {
    const r=(n:number)=>labRoot("v12-byte-custody-only",n), mode="v12-1" as const, route="diagnostic" as const, e=accounting.LEAN_SUPERVISOR_RETEST_V12_EXTENSION
    const request=correction.createLeanSupervisorRetestRequestDraftV12(mode,route,{sourceRoot:r(1),reviewRoot:r(2),dataReviewRoot:r(3),helperReviewRoot:r(4),helperPath:correction.leanSupervisorRetestDocumentsV12(route).helper,helperBytesRoot:r(5),setupAccountingRoot:r(6),reuseGrantRoot:r(7),authorizationRoot:r(8),priorClosureRoot:r(9),continuationRoot:r(10),acceptedCheckRoot:null,acceptedReaderCloseRoot:null})
    const body={schemaVersion:"lean-supervisor-retest-execution-authorization-v12",timeboxExtension:e,approved:true,executionAuthorized:true,route,attemptOrdinal:1,sourceRoot:request.sourceRoot,approvalRoot:e.approvalRoot,planRoot:e.planRoot,policyRoot:e.root,requestDataRoot:correction.leanCorrectionRequestDataRoot(request),helperPath:request.helperPath,helperBytesRoot:request.helperBytesRoot,helperReviewRoot:request.helperReviewRoot,authorAgent:"/root",reviewerAgent:"/root/synthetic_independent_reviewer"}
    const authorization={...body,root:labRoot(body.schemaVersion,body)}, finalized={...request,authorizationRoot:accounting.leanBytesRoot(accounting.leanCanonicalBytes(authorization))}
    expect(()=>correction.validateLeanSupervisorRetestAuthorizationV12(authorization,finalized,route)).not.toThrow()
    for(const mutation of [{authorAgent:"/root/pretend_main"},{reviewerAgent:"/root"},{helperBytesRoot:r(11)},{helperReviewRoot:r(12)},{requestDataRoot:r(13)},{timeboxExtension:accounting.LEAN_TWO_PAIR_V11_EXTENSION},{rawError:"PRIVATE"}]) {
      const changed={...body,...mutation}, v={...changed,root:labRoot(body.schemaVersion,changed)}
      expect(()=>correction.validateLeanSupervisorRetestAuthorizationV12(v,{...finalized,authorizationRoot:accounting.leanBytesRoot(accounting.leanCanonicalBytes(v))},route)).toThrow()
    }
    expect(()=>correction.validateLeanSupervisorRetestAuthorizationV12(authorization,{...finalized,dataReviewRoot:r(14)},route)).not.toThrow() // excluded downstream DATA is checked by finalized review bytes, not this semantic authorization
    expect(()=>correction.validateLeanSupervisorRetestAuthorizationV12(authorization,{...finalized,helperReviewRoot:r(14)},route)).toThrow()
    expect(()=>correction.validateLeanSupervisorRetestAuthorizationV12({...authorization,root:r(15)},finalized,route)).toThrow()
  })
  it("finalized downstream review bytes stay strict even though review roots are excluded from the semantic input", () => {
    const original = process.cwd(), directory = mkdtempSync(join(tmpdir(), "v12-finalized-review-only-"))
    const phase = ".planning/phases/265-serious-current-rules-league-and-development-red-team", path = `${phase}/test-owned-finalized-review.md`
    const bytes = Buffer.from("---\nstatus: clean\n---\nsynthetic test-owned reviewed bytes\n"), finalizedRoot = accounting.leanBytesRoot(bytes)
    try {
      process.chdir(directory); mkdirSync(phase, { recursive: true })
      writeFileSync(path, Buffer.concat([bytes, Buffer.from("changed after finalization\n")]))
      // This invokes the actual consumer and fails at its canonical byte-custody gate,
      // before any source-manifest read. No actual report destination is involved.
      expect(()=>correction.authenticateLeanCorrectionReview(path, finalizedRoot, labRoot("v12-review-test", 1), null, undefined, "v12-1", accounting.LEAN_SUPERVISOR_RETEST_V12_EXTENSION)).toThrow("LEAN_CORRECTION_REVIEW")
    } finally { process.chdir(original); rmSync(directory, { recursive: true, force: true }) }
  })
})
