import { describe, expect, it } from "vitest"

import {
  checkV138HistoricalLiveReceiptManifest,
  computeV138PostRunAuditCorrectionRoot,
  deriveV138HistoricalLiveReceiptManifest,
  deriveV138PostRunAuditCorrection,
  validateV138PostRunAuditCorrection,
} from "./check-v1-38-plan-262-post-run-audit-correction.js"

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

describe("Phase 262 additive post-run audit correction", () => {
  it("derives the intended private receipt set from exact historical Git blobs", () => {
    const manifest = deriveV138HistoricalLiveReceiptManifest(process.cwd())
    expect(manifest).toMatchObject({
      liveCommit: "b4be9f5f5207c7eb87c6cd0e8f79863d4877cf3b",
      receiptCount: 15,
      empiricalOutcome: {
        terminalDisposition: "exhausted",
        freshAccepted: 0,
        requiredAccepted: 540,
      },
    })
    expect(manifest.receipts).toHaveLength(15)
    expect(
      manifest.receipts.every(
        (receipt: any) =>
          /^[0-9a-f]{40}$/u.test(receipt.gitBlob) &&
          /^sha256:[0-9a-f]{64}$/u.test(receipt.sha256),
      ),
    ).toBe(true)
    expect(checkV138HistoricalLiveReceiptManifest(process.cwd())).toEqual(
      manifest,
    )
  })

  it("binds immutable historical bytes, rejected re-review, fixes, and downgraded trust", () => {
    const correction = deriveV138PostRunAuditCorrection(process.cwd())
    expect(correction).toMatchObject({
      correctionKind: "additive_post_run_assurance_supersession",
      historical: {
        sourceCommit: "e844279f62192c41175fb3e7a08910493c6f24ab",
        sealCommit: "4841357d7aa89b7996f9ce299256f1d8d56a6290",
        liveCommit: "b4be9f5f5207c7eb87c6cd0e8f79863d4877cf3b",
        oldPlan83ReviewRoot:
          "sha256:9518cfcff11ba64029ff74f6e56e0c0448f82b5d0d63500dedf793f7ce85595c",
        oldPlan80DispositionRoot:
          "sha256:5fe2dbf967971c6d69d619e91e8d838f5e6495ded3cc23889cf98f0b42dcccdf",
        privateReceiptCount: 15,
      },
      strengthenedReReview: {
        status: "blocked",
        sourceReviewPassed: false,
      },
      empiricalOutcome: {
        terminalDisposition: "exhausted",
        freshAccepted: 0,
        requiredAccepted: 540,
        preserved: true,
      },
      effectiveAssurance: {
        integrityPassed: false,
        status: "integrity_non_pass",
        supersedesHistoricalCleanConclusion: true,
        historicalBytesMutated: false,
      },
    })
    expect(correction.fixedSourceCommits).toEqual([
      "63ddaf79dbff53357dbdded35d0e5ef85df84a7a",
      "91cffe9227c7a5ace81cb4b9414c6304987828ab",
      "087bab44d369131e49610fa64b675bc987686b09",
      "5f30280cab4167898841f097e0adefe247c59221",
    ])
    expect(Object.values(correction.authority).every((value) => !value)).toBe(
      true,
    )
    expect(validateV138PostRunAuditCorrection(correction, correction)).toBe(
      true,
    )
  }, 15_000)

  it.each([
    (value: any) => {
      value.empiricalOutcome.freshAccepted = 540
    },
    (value: any) => {
      value.effectiveAssurance.integrityPassed = true
    },
    (value: any) => {
      value.historical.journalSha256 = `sha256:${"0".repeat(64)}`
    },
    (value: any) => {
      value.authority.activationAuthorized = true
    },
  ])(
    "rejects correction-chain tampering",
    (mutate) => {
      const expected = deriveV138PostRunAuditCorrection(process.cwd())
      const candidate = clone(expected)
      mutate(candidate)
      candidate.correctionRoot =
        computeV138PostRunAuditCorrectionRoot(candidate)
      expect(() =>
        validateV138PostRunAuditCorrection(candidate, expected),
      ).toThrow("V138_AUDIT_CORRECTION_INVALID")
    },
    15_000,
  )
})
