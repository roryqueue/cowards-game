/** Portable NON-AUTHORIZING host fixtures. Never Strategy/Match/provider work. */
import { expect, it } from "vitest"
import { mkdtempSync, realpathSync, readdirSync, rmSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import * as lean from "../packages/strategy-lab/src/league/lean-experiment.js"
import { labRoot } from "../packages/strategy-lab/src/contracts.js"
import * as correction from "./run-v1-38-lean-correction.js"
import { assessLeanPrefixCapacity } from "./run-v1-38-lean-experiment.js"
import { leanResourceWindowDocumentsV15 } from "./lib/v1-38-lean-resource-window-v15.js"

const r = (n: number) => labRoot("NON_AUTHORIZING_v15_HOST", n)
const allocation = () => {
  const b = lean.LEAN_RESOURCE_WINDOW_V15_POLICY, p = { schemaVersion: "lean-correction-predecessor-v1" as const, chargedMatches: 36, elapsedUpperBoundMs: 208771903, allocatedDiskBytes: 24780800, historicalPeakDiskBytes: "unknown" as const, historicalPeakRssBytes: "unknown" as const, historyRoot: r(1), survivors: Array.from({ length: 854 }, (_, n) => ({ identity: `.strategy-lab/NON_AUTHORIZING-history-${n}`, allocatedBytes: 0 })) }
  return lean.createLeanSupervisorCorrectionAllocation({ sourceRoot: r(2), reviewRoot: r(3), coldRoot: r(4), planRoot: b.planRoot, candidateRoots: [r(5), r(6)], requestRoots: [r(7)], seed: "non-authorizing-host", route: "diagnostic", reuseGrantRoot: r(8), supervisorDecisionRoot: b.approvalRoot, acceptedCheckRoot: null, requestBytesRoot: r(9), dataReviewRoot: r(10), setupAccountingRoot: r(11), predecessor: { ...p, root: labRoot(p.schemaVersion, p) }, startupPolicyRoot: lean.LEAN_STARTUP_POLICY_V5.root, timeboxExtension: b, attemptOrdinal: 2, priorClosureRoot: r(12), continuationRoot: r(13), acceptedReaderCloseRoot: null }, 8)
}

it("ROOT authority frontier: finite selected dispatcher refuses absent authentic custody without writes", async () => {
  const before = process.cwd(), directory = realpathSync(mkdtempSync(join(tmpdir(), "lean-v15-inert-")))
  try {
    process.chdir(directory)
    for (const n of [2, 3, 4, 5] as const) for (const route of ["diagnostic", "baseline"] as const) {
      const mode = `v15-${n}` as const, paths = lean.leanCorrectionRoutePaths(route, mode)
      expect(correction.leanCorrectionChildSupervisor(correction.leanCorrectionChildMode(route, mode))).toBe(mode)
      for (const action of ["prepare", "run", "verify", "verify-terminal"]) {
        const args = [`${action}-supervisor-${route}-${mode}`, "--request", paths.request]
        expect(correction.parseLeanCorrectionCommand(args)).toMatchObject({ supervisor: mode, route })
        await expect(correction.leanCorrectionMain(args)).rejects.toThrow()
      }
    }
    expect(readdirSync(directory)).toEqual([])
  } finally { process.chdir(before); rmSync(directory, { recursive: true, force: true }) }
})

it("actual prefix guard accepts approved RAM independently, preserves old ceiling and refuses disk excess", () => {
  const a = allocation(), m = { parentRss: 1000000000, childRss: 1152455680, freeBytes: 15000000000, allocatedBytes: 24780800, elapsedMs: 208771903 }
  expect(assessLeanPrefixCapacity(m, 335544320, a)).toBe(2152455680)
  expect(() => assessLeanPrefixCapacity({ ...m, childRss: m.childRss + 1 }, 335544320, a)).toThrow()
  expect(() => assessLeanPrefixCapacity(m)).toThrow()
  expect(() => assessLeanPrefixCapacity({ ...m, allocatedBytes: 15000000001 }, 335544320, a)).toThrow()
  expect(() => assessLeanPrefixCapacity(m, 0, a)).toThrow()
})

it("finite documents remain route-specific with no caller-chosen helper or report wildcard", () => {
  expect(leanResourceWindowDocumentsV15("baseline", "v15-5").authorization).toContain("RESOURCE-WINDOW-baseline-v15-5-AUTHORIZATION-v1.json")
  const shell = readFileSync("scripts/run-v1-38-lean-correction.sh", "utf8")
  expect(shell).toContain("prepare-supervisor-diagnostic-v15-[2-5]")
  expect(shell).toContain("lean-correction-supervisor-baseline-20261009-v${1##*-v}-tmp")
})
