import { describe, expect, it } from "vitest"
import {
  createV137ReleaseReadinessFixture,
  renderV137ReleaseReadinessJson,
  renderV137ReleaseReadinessMarkdown,
  validateV137ReleaseReadiness,
} from "./evaluate-v1-37-release-readiness.js"

describe("v1.37 non-circular release readiness", () => {
  it("accepts exactly 56 traced requirements with 55 passed and PROOF-08 pending", () => {
    const readiness = createV137ReleaseReadinessFixture()

    expect(validateV137ReleaseReadiness(readiness)).toEqual(readiness)
    expect(readiness.releaseState).toBe("release-ready")
    expect(readiness.traceability).toEqual({
      total: 56,
      passed: 55,
      readyPending: 1,
    })
    expect(readiness.releaseOperation).toEqual({
      requirement: "PROOF-08",
      status: "ready_pending",
      completion: false,
      expectedOperation:
        "archive-then-annotated-tag-then-independent-post-check",
      annotatedTagName: "v1.37",
    })
    expect(readiness.guards).toMatchObject({
      gapCount: 0,
      overrideCount: 0,
      protectedBaseline: "passed",
      localTagAbsent: true,
      strategyMilestoneAuthorized: false,
      evidenceRetentionDays: 90,
    })
    expect(renderV137ReleaseReadinessJson(readiness)).not.toMatch(
      /archiveCommit|tagObject|tagSha|futureGit|postgresql:\/\//i,
    )
    expect(renderV137ReleaseReadinessMarkdown(readiness)).toContain(
      "ready_pending",
    )
  })

  it("rejects premature closure, unsafe authorization, future identities, stale joins, and unsafe output", () => {
    const readiness = createV137ReleaseReadinessFixture()

    expect(() =>
      validateV137ReleaseReadiness({
        ...readiness,
        traceability: { ...readiness.traceability, passed: 56 },
      }),
    ).toThrow("V137_RELEASE_READINESS_TRACEABILITY_INVALID")
    expect(() =>
      validateV137ReleaseReadiness({
        ...readiness,
        releaseOperation: { ...readiness.releaseOperation, status: "passed" },
      }),
    ).toThrow("V137_RELEASE_READINESS_OPERATION_INVALID")
    expect(() =>
      validateV137ReleaseReadiness({
        ...readiness,
        guards: { ...readiness.guards, strategyMilestoneAuthorized: true },
      }),
    ).toThrow("V137_RELEASE_READINESS_GUARDS_INVALID")
    expect(() =>
      validateV137ReleaseReadiness({ ...readiness, archiveCommit: "deadbeef" }),
    ).toThrow("V137_RELEASE_READINESS_SHAPE")
    expect(() =>
      validateV137ReleaseReadiness({
        ...readiness,
        prerequisiteHashes: {
          ...readiness.prerequisiteHashes,
          tupleId: "not-a-hash",
        },
      }),
    ).toThrow("V137_RELEASE_READINESS_HASHES_INVALID")
    expect(() =>
      renderV137ReleaseReadinessJson({
        ...readiness,
        tagMessageFieldSha256: {
          ...readiness.tagMessageFieldSha256,
          semanticTupleId: "postgresql://private",
        },
      }),
    ).toThrow("V137_RELEASE_READINESS_TAG_MESSAGE_INVALID")
  })
})
