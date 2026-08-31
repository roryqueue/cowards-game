import { readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import {
  V138_PLAN131_B331_SCOPE,
  assertV138Plan131ExactB331ScopeForReview,
  assertV138Plan131StrictLaterHeadForReview,
  authenticateV138Plan131Plan130SourceForReview,
  authenticateV138Plan131V3InvalidHistoryForReview,
  executeV138Plan131DisposableModesForReview,
  inspectV138Plan131ApprovedLiveSourceForReview,
  renderV138Plan131EvidenceForReview,
} from "./check-v1-38-plan-262-131-live-v13-custody-review-v4.js"

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..")

describe("Plan 262-131 independent live-v13 custody review v4", () => {
  it("authenticates the exact Plan130 subject, closeout, clean review, and source bytes", () => {
    expect(authenticateV138Plan131Plan130SourceForReview(ROOT)).toMatchObject({
      subjectCommit: "6515ea1a2e372a71d9f9d161e395276cf163db76",
      closeoutCommit: "bbbd52496f530ec7edcf3bd6e42baf702945a26b",
      cleanReviewCommit: "a93a545608cd16ca4ccca2b4e571d9b4861762b4",
      sourceBlob: "e500acca54ad3e5feb9d5dcd0cd60843695278f5",
      testBlob: "18152164ef2e7486b2b85f379576f4ea1a2852c1",
    })
    const source = readFileSync(path.join(ROOT,
      "scripts/run-v1-38-bounded-retry-envelope-v3-live-v13.ts"), "utf8")
    expect(inspectV138Plan131ApprovedLiveSourceForReview(source)).toMatchObject({
      producerCallSites: 1,
      producerCalls: 0,
      readinessInvoked: false,
      liveInvoked: false,
    })
    for (const mutation of ["", `${source}\n`, `${source}//mutation\n`, source.replace("type Sha =", "type  Sha =")])
      expect(() => inspectV138Plan131ApprovedLiveSourceForReview(mutation))
        .toThrow("V138_PLAN131_LIVE_SOURCE_BYTES_INVALID")
  })

  it("authenticates exact b331 scope and rejects missing, extra, and changed entries", () => {
    expect(assertV138Plan131ExactB331ScopeForReview(V138_PLAN131_B331_SCOPE))
      .toEqual(V138_PLAN131_B331_SCOPE)
    expect(() => assertV138Plan131ExactB331ScopeForReview(V138_PLAN131_B331_SCOPE.slice(1)))
      .toThrow("V138_PLAN131_B331_SCOPE_INVALID")
    expect(() => assertV138Plan131ExactB331ScopeForReview([...V138_PLAN131_B331_SCOPE, "A\textra"]))
      .toThrow("V138_PLAN131_B331_SCOPE_INVALID")
    expect(() => assertV138Plan131ExactB331ScopeForReview([
      V138_PLAN131_B331_SCOPE[0]!.replace(/^A/u, "M"), ...V138_PLAN131_B331_SCOPE.slice(1),
    ])).toThrow("V138_PLAN131_B331_SCOPE_INVALID")
  })

  it("preserves v3 as process-invalid immutable history and currently ineligible", () => {
    expect(authenticateV138Plan131V3InvalidHistoryForReview(ROOT)).toMatchObject({
      publicationCommit: "65a7a246627a411c45ced95bfb3c0296f0f8e4eb",
      closeoutCommit: "2bbd45f85500b052022c81fda8c1c8a1c6536b1b",
      reviewCommit: "73d1be605aa68a7789c53ce78b20f4922b8b7cec",
      storedPlan110Eligible: true,
      supersededV3Plan110Eligible: false,
      disposition: "process_invalid_false_clean_custody",
    })
  })

  it("derives six genuine disposable observations with a file-backed zero-call guard", () => {
    const modes = executeV138Plan131DisposableModesForReview(ROOT)
    expect(modes).toMatchObject({
      actualModesPassed: 6,
      findings: [],
      producerCalls: 0,
      readinessInvoked: false,
      liveInvoked: false,
      freshCharged: 0,
      freshAccepted: 0,
      authorizesExecution: false,
      downstreamAuthority: "denied",
    })
    expect(modes.observations).toHaveLength(6)
    expect(modes.canonicalBefore).toEqual(modes.canonicalAfter)
    for (const observation of modes.observations) {
      expect(observation.disposableReviewedClosureRoot).toBe(modes.canonicalBefore.reviewedClosureRoot)
      expect(observation.disposableLocalNativeSourcesRoot)
        .not.toBe(modes.canonicalBefore.localNativeSourcesRoot)
      expect(observation.disposableLocalNativeSourcePaths.every((entry: string) =>
        entry.includes("/v138-plan131-mode-") && !entry.startsWith(`${ROOT}/`))).toBe(true)
      expect(observation.producerGuardCount).toBe(0)
    }
  }, 180_000)

  it("grants only Plan110 eligibility on literal zero and requires strict later HEAD", () => {
    const blocked = renderV138Plan131EvidenceForReview(ROOT, [{
      code: "SYNTHETIC_BLOCKER", severity: "critical", subject: "test", detail: "blocked",
    }])
    expect(blocked.payload).toMatchObject({ findingCount: 1, actualModesPassed: 0,
      plan110Eligible: false, supersededV3Plan110Eligible: false, authorizesExecution: false,
      readinessInvoked: false, liveInvoked: false, producerCalls: 0, downstreamAuthority: "denied" })
    expect(() => renderV138Plan131EvidenceForReview(ROOT, [])).toThrow("V138_PLAN131_ZERO_REQUIRES_EXECUTED_MODES")
    expect(() => assertV138Plan131StrictLaterHeadForReview("a".repeat(40), "a".repeat(40), true))
      .toThrow("V138_PLAN131_PUBLICATION_NOT_STRICT_ANCESTOR")
    expect(() => assertV138Plan131StrictLaterHeadForReview("a".repeat(40), "b".repeat(40), false))
      .toThrow("V138_PLAN131_PUBLICATION_NOT_STRICT_ANCESTOR")
    expect(assertV138Plan131StrictLaterHeadForReview("a".repeat(40), "b".repeat(40), true)).toBe(true)
  })
})
