import path from "node:path"
import { describe, expect, it } from "vitest"
import {
  executeV138Plan112V2DisposableModes,
  renderV138Plan112V2EvidenceForReview,
  type V138Plan112V2Finding,
} from "./check-v1-38-plan-262-112-live-v9-custody-v2.js"

const repoRoot = path.resolve(import.meta.dirname, "..")

describe("Plan 262-112 corrected independent observation", () => {
  it("executes six real producer-incapable live-v9 observations in disposable repositories", () => {
    const result = executeV138Plan112V2DisposableModes(repoRoot)
    expect(result.modeNames).toEqual([
      "source_only_cli",
      "prospective_custody_cli",
      "post_no_effect_cli",
      "post_non_pass_value",
      "post_success_value",
      "exact_reproduction_value",
    ])
    expect(result.actualModesPassed).toBe(3)
    expect(result.findings.map(({ code }) => code)).toEqual([
      "MODE_POST_NO_EFFECT_FAILED",
      "MODE_PROSPECTIVE_CUSTODY_FAILED",
      "MODE_SOURCE_ONLY_FAILED",
    ])
    expect(result.producerCalls).toBe(0)
    expect(result.liveInvoked).toBe(false)
    expect(result.freshCharged).toBe(0)
    expect(result.freshAccepted).toBe(0)
    expect(result.observationRoot).toMatch(/^sha256:[0-9a-f]{64}$/)
  }, 180_000)

  it("renders deterministic blocked evidence with all eligibility and authority denied", () => {
    const findings: readonly V138Plan112V2Finding[] = [
      { code: "MODE_POST_SUCCESS_MISMATCH", severity: "critical", detail: "exact success rejected" },
      { code: "PAIR_COUNTER_DRIFT", severity: "critical", detail: "counter changed" },
    ]
    const first = renderV138Plan112V2EvidenceForReview(repoRoot, findings)
    const second = renderV138Plan112V2EvidenceForReview(repoRoot, [...findings].reverse())
    expect(first.payload).toEqual(second.payload)
    expect(first.reviewBytes.equals(second.reviewBytes)).toBe(true)
    expect(first.carrier).toEqual(second.carrier)
    expect(first.payload).toMatchObject({
      reviewStatus: "blocked",
      findingCount: 2,
      plan109Eligible: false,
      authorizesExecution: false,
      downstreamAuthority: "denied",
    })
    expect(first.reviewBytes.toString("utf8")).toContain("BLOCKED")
  }, 180_000)

  it("rejects mutation classes rather than normalizing them into zero", () => {
    const base: V138Plan112V2Finding = {
      code: "SEMANTIC_MUTATION",
      severity: "critical",
      detail: "payload field changed",
    }
    for (const mutation of [
      { ...base, code: "PUBLICATION_SUBSTITUTION" },
      { ...base, code: "RECURSIVE_DEPENDENCY_OMITTED" },
      { ...base, code: "PROTECTED_HISTORY_DRIFT" },
      { ...base, code: "PAIR_COUNTER_DRIFT" },
      { ...base, code: "AUTHORITY_DRIFT" },
      { ...base, code: "SUPPLEMENT_SUBSTITUTION" },
      { ...base, code: "GENERIC_BYPASS" },
      { ...base, code: "PRODUCER_ERROR_LOST" },
      { ...base, code: "POST_CHECK_DRIFT" },
      { ...base, code: "FORBIDDEN_EFFECT" },
    ]) {
      const rendered = renderV138Plan112V2EvidenceForReview(repoRoot, [mutation])
      expect(rendered.payload.findingCodes).toEqual([mutation.code])
      expect(rendered.payload.plan109Eligible).toBe(false)
    }
  }, 180_000)
})
