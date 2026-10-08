/** Negative HOST custody proof only; no fabricated successful diagnostic. */
import { expect, it, vi } from "vitest"
import { mkdtempSync, realpathSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import * as correction from "../run-v1-38-lean-correction.js"
import * as retained from "./v1-38-lean-correction-retained.js"
import { labRoot } from "../../packages/strategy-lab/src/contracts.js"
import { LEAN_POST_V13_FIVE_PAIR_V14_EXTENSION as policy } from "../../packages/strategy-lab/src/league/lean-experiment.js"
import { leanFivePairDocumentsV14 } from "./v1-38-lean-post-v13-five-pair.js"

it("constructs exact fresh request drafts and binds immutable setup origin for all five ordinals", () => {
  const root = labRoot("v14-draft-host", 1)
  for (const n of [1, 2, 3, 4, 5] as const) {
    const mode = `v14-${n}` as const, docs = leanFivePairDocumentsV14("diagnostic", mode)
    const setup = correction.createLeanPostV13SetupV14(mode, 1791496635485)
    expect(setup).toMatchObject({ attemptOrdinal: n, startedAtMs: policy.startedAtMs, priorElapsedMs: policy.priorElapsedMs, decisionRoot: policy.approvalRoot })
    const request = correction.createLeanPostV13RequestDraftV14(mode, "diagnostic", { sourceRoot: root, reviewRoot: root, dataReviewRoot: root, helperReviewRoot: root, helperPath: docs.helper, helperBytesRoot: root, setupAccountingRoot: setup.root, reuseGrantRoot: root, authorizationRoot: root, priorClosureRoot: root, continuationRoot: root, acceptedCheckRoot: null, acceptedReaderCloseRoot: null })
    expect(request).toMatchObject({ schemaVersion: "lean-correction-supervisor-request-v14", reviewPath: docs.review, helperPath: docs.helper, attemptOrdinal: n, timeboxExtension: policy })
    expect(correction.leanCorrectionRequestDataRoot(request)).not.toBe(correction.leanCorrectionRequestDataRoot({ ...request, continuationRoot: labRoot("changed-continuation", n) }))
  }
})

it("binds only ROOT-observed finite failed-v13 metadata, not an old ordinary reader", () => {
  const oldReader = vi.spyOn(retained, "authenticateLeanSupervisorDiagnosticCheck")
  try {
    const history = correction.authenticateLeanPostV13HistoricalCustodyV14()
    expect(history.cumulativeCharged).toBe(35)
    expect(history.predecessor.elapsedUpperBoundMs).toBe(148694388)
    expect(history.predecessor.allocatedDiskBytes).toBe(22777856)
    expect(history.predecessor.survivors.length).toBe(774)
    expect(oldReader).not.toHaveBeenCalled()
  } finally { oldReader.mockRestore() }
})

it("new accepted-join dispatch rejects missing real same-pair custody on every call", () => {
  const directory = realpathSync(mkdtempSync(join(tmpdir(), "v14-custody-host-"))), before = process.cwd()
  const audit = vi.spyOn(retained, "authenticateLeanRetryClosureV8")
  try {
    process.chdir(directory)
    for (let n = 0; n < 3; n++) expect(() => correction.authenticateLeanPostV13FivePairAcceptedJoinV14("v14-1")).toThrow()
    expect(audit).toHaveBeenCalledTimes(3)
    for (const mode of ["v13-1", "v14-0", "v14-6"]) expect(() => correction.authenticateLeanPostV13FivePairAcceptedJoinV14(mode as never)).toThrow()
    expect(audit).toHaveBeenCalledTimes(3)
  } finally { process.chdir(before); audit.mockRestore(); rmSync(directory, { recursive: true, force: true }) }
})

it("legacy request authorities cannot enter the v14 data path or reopen old readers", () => {
  for (const route of ["diagnostic", "baseline"] as const) {
    expect(() => correction.readLeanRemainingRequestV9(".strategy-lab/old-request.json", route, "v14-1")).toThrow("POST_V13_CUSTODY_UNAVAILABLE")
  }
})
