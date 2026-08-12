import { describe, expect, it } from "vitest"
import {
  V138_CURRENT_STOPPED_BRANCH,
  V138_PREDECESSOR_AUTHORITY,
  V138CustodyStatusSchema,
  V138MatrixAdmissionStatusSchema,
  V138PolicyStatusSchema,
  evaluateV138DownstreamAuthority,
  evaluateV138MatrixAdmission,
} from "./lib/v1-38-policy-authority.js"

describe("Phase 262 dependency-revision acceptance", () => {
  it("keeps every capability status closed and exact", () => {
    expect(["pending", "blocked", "ready"].map((value) =>
      V138PolicyStatusSchema.parse(value),
    )).toEqual(["pending", "blocked", "ready"])
    expect(["blocked", "passed"].map((value) =>
      V138MatrixAdmissionStatusSchema.parse(value),
    )).toEqual(["blocked", "passed"])
    expect(["unavailable", "contaminated", "authorized"].map((value) =>
      V138CustodyStatusSchema.parse(value),
    )).toEqual(["unavailable", "contaminated", "authorized"])

    for (const [schema, invalid] of [
      [V138PolicyStatusSchema, [undefined, "pass", "READY", { status: "ready" }]],
      [V138MatrixAdmissionStatusSchema, [undefined, "ready", "passed_exact", { status: "passed" }]],
      [V138CustodyStatusSchema, [undefined, "ready", "approved", { status: "authorized" }]],
    ] as const) {
      for (const value of invalid) expect(() => schema.parse(value)).toThrow()
    }
  })

  it("denies downstream authority for every single non-pass input", () => {
    const passing = {
      policyStatus: "ready",
      matrixAdmissionStatus: "passed",
      custodyStatus: "authorized",
      containmentPassed: true,
      identitiesJoined: true,
    } as const
    expect(evaluateV138DownstreamAuthority(passing)).toBe("granted")

    for (const mutation of [
      { ...passing, policyStatus: "pending" as const },
      { ...passing, policyStatus: "blocked" as const },
      { ...passing, matrixAdmissionStatus: "blocked" as const },
      { ...passing, custodyStatus: "unavailable" as const },
      { ...passing, custodyStatus: "contaminated" as const },
      { ...passing, containmentPassed: false },
      { ...passing, identitiesJoined: false },
    ]) expect(evaluateV138DownstreamAuthority(mutation)).toBe("denied")

    expect(() => evaluateV138DownstreamAuthority({ ...passing, waiver: true } as never))
      .toThrow("V138_DOWNSTREAM_AUTHORITY_INPUT_INVALID")
  })

  it("requires a literal fresh 540/540 reproduction and rejects historical promotion", () => {
    const exact = {
      schemaVersion: "v1.38-matrix-admission-evidence-v1",
      evidenceClass: "fresh_admit_03_reproduction",
      disposition: "reproduction_passed",
      freshCharged: 540,
      freshAccepted: 540,
      integrityFailureCount: 0,
      tupleId: V138_PREDECESSOR_AUTHORITY.selectedTupleId,
      admissionRoot: V138_PREDECESSOR_AUTHORITY.admissionRoot,
      authorityExpired: false,
      noRetry: false,
    } as const
    expect(evaluateV138MatrixAdmission(exact)).toBe("passed")

    for (const mutation of [
      { ...exact, evidenceClass: "a6_diagnostic_success" },
      { ...exact, evidenceClass: "route_5_terminal" },
      { ...exact, evidenceClass: "historical_matrix" },
      { ...exact, evidenceClass: "old_calibration_receipt" },
      { ...exact, evidenceClass: "policy_root" },
      { ...exact, disposition: "calibration_stopped" },
      { ...exact, freshCharged: 0 },
      { ...exact, freshAccepted: 0 },
      { ...exact, integrityFailureCount: 1 },
      { ...exact, tupleId: "sha256:route-5" },
      { ...exact, admissionRoot: "sha256:route-5" },
      { ...exact, authorityExpired: true },
      { ...exact, noRetry: true },
    ]) expect(evaluateV138MatrixAdmission(mutation)).toBe("blocked")
  })

  it("binds immutable predecessor authority and the exact stopped branch", () => {
    expect(V138_PREDECESSOR_AUTHORITY).toEqual({
      archiveCommit: "e704590df599b49d84745b0e828d5ab0f1d335ad",
      selectedTupleId: "sha256:922a6857fdbc8354b744d6e766bff216f3fee85b5ed381355cb427f5a616b3ae",
      admissionRoot: "sha256:eb881964ed2cf8b8cf2d24c35a2d8eb6a744917f2659bef8fd41b6f3c7ab491c",
      joinStatus: "passed_exact",
      failedJoinDisposition: "stopped_integrity_foundation",
    })
    expect(V138_CURRENT_STOPPED_BRANCH).toEqual({
      routeOrdinal: 5,
      disposition: "calibration_stopped",
      freshCharged: 0,
      freshAccepted: 0,
      authorityExpired: true,
      noRetry: true,
      admit03: "blocked",
    })
  })
})
