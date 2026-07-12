import { describe, expect, it } from "vitest"
import {
  COMPETITION_ACCOUNT_RECOVERY_POLICY,
  COMPETITION_FAIR_PLAY_POLICY,
  COMPETITION_GOVERNANCE_ACTIONS,
  assertPublicCompetitionGovernanceLeakSafe,
  competitionGovernanceActionPolicy,
  normalizeCompetitionReportDetail,
  projectPublicCompetitionGovernance,
} from "./competition-governance.js"
import { classifyCompetitionCountedState } from "./competition-counted-state.js"

describe("competition governance contract", () => {
  it.each([
    ["under_review", "integrity_review"],
    ["counted", "review_resolved_counted"],
    ["non_counted", "evidence_incomplete"],
    ["non_competitive", "competition_policy"],
    ["invalid", "result_invalid"],
    ["invalidated", "result_invalidated"],
  ] as const)("defines fixed copy for %s", (action, category) => {
    expect(competitionGovernanceActionPolicy(action, category)).toMatchObject({
      publicExplanation: expect.any(String),
    })
  })

  it("rejects invalid combinations and bounds private detail", () => {
    expect(() =>
      competitionGovernanceActionPolicy("counted", "result_invalid"),
    ).toThrow(/not valid/)
    expect(COMPETITION_GOVERNANCE_ACTIONS).toHaveLength(6)
    expect(normalizeCompetitionReportDetail("  concise  ")).toBe("concise")
    expect(() => normalizeCompetitionReportDetail("x".repeat(501))).toThrow(
      /500/,
    )
    expect(() => normalizeCompetitionReportDetail("bad\u0000detail")).toThrow(
      /control/,
    )
  })

  it("projects coarse public state and rejects private keys", () => {
    const countedState = classifyCompetitionCountedState({
      executionStatus: "complete",
      origin: "trial",
      expectedMatchCount: 2,
      chronicleMatchCount: 2,
      scoringAvailable: true,
      reviewState: "disputed",
    })
    const projection = projectPublicCompetitionGovernance({
      countedState,
      reviewState: "disputed",
      changedAt: "2026-07-11T00:00:00.000Z",
      replayAvailable: true,
    })
    expect(projection).toMatchObject({
      status: "disputed",
      replayAvailable: true,
    })
    expect(() =>
      assertPublicCompetitionGovernanceLeakSafe(projection),
    ).not.toThrow()
    expect(() =>
      assertPublicCompetitionGovernanceLeakSafe({ reporterUserId: "private" }),
    ).toThrow(/private/i)
  })

  it("states fair-play and recovery limitations", () => {
    const copy = JSON.stringify({
      fairPlay: COMPETITION_FAIR_PLAY_POLICY,
      recovery: COMPETITION_ACCOUNT_RECOVERY_POLICY,
    })
    expect(copy).toContain("do not guarantee automatic action")
    expect(copy).toContain("not available in this public beta")
    expect(copy).toContain("no permanent rating repair is promised")
  })
})
