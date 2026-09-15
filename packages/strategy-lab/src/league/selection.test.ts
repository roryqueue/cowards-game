import { describe, expect, it } from "vitest"
import { labRoot, type LabRoot } from "../contracts.js"
import { createLeagueMixture } from "./contracts.js"
import { deriveLeaguePortfolio, selectRobustPure, type RobustPureGateId } from "./selection.js"

const root = (label: string): LabRoot => labRoot("selection-test-root-v1", { label })
const candidate = (label: string, overrides: Record<string, unknown> = {}) => ({
  candidateAdmissionRoot: root(`candidate:${label}`),
  receipt: {
    schemaVersion: "league-selection-receipt-v1" as const,
    privacy: "private_offline" as const,
    candidateAdmissionRoot: root(`candidate:${label}`),
    structuralFamilyRoot: root(`family:${label}`),
    strategicCoreRoot: root(`core:${label}`),
    lineageRoot: root(`lineage:${label}`),
    dependencyRoot: root(`dependency:${label}`),
    legalInputDecisionRoot: root(`legal-input:${label}`),
    chronicleBehaviorRoot: root(`behavior:${label}`),
    matchupResponseRoot: root(`response:${label}`),
    noveltyRoot: root(`novelty:${label}`),
    cloneDecision: "accepted" as const,
    independence: "independent" as const,
    responseEvidence: "complete" as const,
  },
  ...overrides,
})
const mixture = () => createLeagueMixture({ solverOutputRoot: root("solver"), weightRoot: root("weights"), snapshotRoot: root("snapshot") })
const gates = (failed: readonly RobustPureGateId[] = []) => ([
  "distinct_finalist_count", "consecutive_response_count", "response_set_score", "independent_probe_set_score", "fresh_red_team_set_score",
  "maximin_oracle_relative_pure", "mixture_performance", "strongest_pure_targets", "accepted_counters", "invariance", "legality", "privacy", "runtime", "diversity",
] as const).map((gateId) => ({ gateId, status: failed.includes(gateId) ? "failed" as const : "passed" as const, proofRoot: root(`gate:${gateId}`) }))

describe("receipt-derived portfolio and robust-pure selection", () => {
  it("keeps a diagnostic mixture separate and rejects cosmetic, correlated, incomplete, and cloned diversity evidence", () => {
    const diagnostic = mixture()
    const outcome = deriveLeaguePortfolio({ snapshotRoot: diagnostic.snapshotRoot, mixture: diagnostic, candidates: [
      candidate("a"),
      candidate("b", { receipt: { ...candidate("b").receipt, structuralFamilyRoot: root("family:a") } }),
      candidate("c", { receipt: { ...candidate("c").receipt, independence: "correlated" } }),
      candidate("d", { receipt: { ...candidate("d").receipt, chronicleBehaviorRoot: null } }),
      candidate("e", { receipt: { ...candidate("e").receipt, cloneDecision: "unresolved" } }),
    ] })
    expect(outcome.portfolio.mixtureRoot).toBe(diagnostic.root)
    expect(outcome.portfolio.candidateAdmissionRoots).toEqual([root("candidate:a")])
    expect(outcome.rejections.map((entry) => entry.reason).sort()).toEqual(["clone_decision_incomplete", "correlated_candidate", "missing_behavioral_evidence", "structural_family_duplicate"])
    expect(JSON.stringify(outcome)).not.toContain("sourceHash")
  })

  it("requires every frozen hard-gate proof, including oracle-relative pure maximin, or returns rooted no-finalist evidence", () => {
    const diagnostic = mixture()
    const portfolio = deriveLeaguePortfolio({ snapshotRoot: diagnostic.snapshotRoot, mixture: diagnostic, candidates: [candidate("a"), candidate("b"), candidate("c")] }).portfolio
    const finalist = selectRobustPure({ snapshotRoot: diagnostic.snapshotRoot, mixture: diagnostic, portfolio, candidateAdmissionRoot: root("candidate:a"), gateEvidence: gates() })
    expect(finalist.kind).toBe("robust_pure_finalist")
    expect(finalist.candidateAdmissionRoot).toBe(root("candidate:a"))
    const noFinalist = selectRobustPure({ snapshotRoot: diagnostic.snapshotRoot, mixture: diagnostic, portfolio, candidateAdmissionRoot: root("candidate:a"), gateEvidence: gates(["maximin_oracle_relative_pure"]) })
    expect(noFinalist).toMatchObject({ kind: "no_robust_pure_finalist_found", candidateAdmissionRoot: null })
    expect(noFinalist.gateReceiptRoots).toContain(root("gate:maximin_oracle_relative_pure"))
    expect(() => selectRobustPure({ snapshotRoot: diagnostic.snapshotRoot, mixture: diagnostic, portfolio, candidateAdmissionRoot: root("candidate:a"), gateEvidence: gates().filter((entry) => entry.gateId !== "privacy") })).toThrow("LEAGUE_SELECTION_HARD_GATES")
  })
})
