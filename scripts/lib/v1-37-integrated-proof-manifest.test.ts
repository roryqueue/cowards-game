import { describe, expect, it } from "vitest"
import {
  V137_INTEGRATED_PROOF_DECISION_IDS,
  V137_INTEGRATED_PROOF_REQUIREMENT_IDS,
  V137_INTEGRATED_PROOF_SCENARIOS,
  parseV137IntegratedProofManifest,
} from "./v1-37-integrated-proof-manifest.js"

const cloneManifest = (): unknown[] =>
  JSON.parse(JSON.stringify(V137_INTEGRATED_PROOF_SCENARIOS)) as unknown[]

const expectCode = (value: unknown, code: string): void => {
  expect(() => parseV137IntegratedProofManifest(value)).toThrowError(code)
}

describe("v1.37 integrated proof manifest", () => {
  it("freezes the exact ordered mandatory service scenario inventory", () => {
    expect(V137_INTEGRATED_PROOF_SCENARIOS.map(({ id }) => id)).toEqual([
      "lane-typescript-success",
      "lane-python-success",
      "lane-rust-success",
      "lane-zig-success",
      "player-invalid-action",
      "system-timeout-no-mutation",
      "system-crash-no-mutation",
      "system-unavailable-no-mutation",
      "system-transport-no-mutation",
      "system-malformed-no-mutation",
      "system-stale-no-mutation",
      "stale-certificate-rejected",
      "artifact-identity-drift-rejected",
      "toolchain-identity-drift-rejected",
      "containment-identity-drift-rejected",
      "mixed-tuple-rejected",
      "schedule-authority-stale-rejected",
      "execution-authority-stale-rejected",
      "current-chronicle-valid",
      "chronicle-semantic-mutation-rejected",
      "reconstruction-equivalent",
      "historical-v1-4-replay",
      "historical-v1-17-replay",
      "unknown-version-rejected",
      "mixed-version-rejected",
      "four-condition-set-complete",
      "set-atomic-persistence",
      "set-order-independent-completion",
      "set-degraded-no-partial-counting",
      "idempotent-condition-retry",
      "transaction-failure-no-completion",
      "lane-kill-switch",
      "cohort-invalidation-compensation",
      "standings-recompute",
      "runtime-service-version-rollback",
      "mixed-state-rejected",
      "lane-status-truthful",
      "historical-status-public",
      "complete-degraded-results-public",
      "standings-public",
      "replay-public",
      "desktop-board-realism",
      "mobile-board-realism",
      "rendered-privacy",
      "default-network-privacy",
    ])
    expect(V137_INTEGRATED_PROOF_REQUIREMENT_IDS).toEqual([
      "PROOF-01",
      "PROOF-02",
      "PROOF-03",
      "PROOF-04",
      "PROOF-05",
      "PROOF-06",
    ])
    expect(V137_INTEGRATED_PROOF_DECISION_IDS).toEqual([
      "D-01",
      "D-02",
      "D-03",
      "D-04",
      "D-05",
      "D-06",
      "D-07",
      "D-08",
      "D-09",
      "D-10",
      "D-11",
      "D-12",
    ])
    expect(parseV137IntegratedProofManifest(cloneManifest())).toEqual(
      V137_INTEGRATED_PROOF_SCENARIOS,
    )
    expect(Object.isFrozen(V137_INTEGRATED_PROOF_SCENARIOS)).toBe(true)
    expect(
      V137_INTEGRATED_PROOF_SCENARIOS.every(
        (row) =>
          Object.isFrozen(row) &&
          Object.isFrozen(row.requirementIds) &&
          Object.isFrozen(row.decisionIds) &&
          Object.isFrozen(row.topologyParticipants) &&
          Object.isFrozen(row.mutationAssertions),
      ),
    ).toBe(true)
  })

  it("rejects missing, extra, duplicate, and reordered rows", () => {
    const missing = cloneManifest()
    missing.splice(2, 1)
    expectCode(missing, "V137_MANIFEST_MISSING_SCENARIO")

    const extra = cloneManifest()
    extra.push(JSON.parse(JSON.stringify(extra[0])) as unknown)
    expectCode(extra, "V137_MANIFEST_EXTRA_SCENARIO")

    const duplicate = cloneManifest()
    duplicate[1] = JSON.parse(JSON.stringify(duplicate[0])) as unknown
    expectCode(duplicate, "V137_MANIFEST_DUPLICATE_SCENARIO")

    const reordered = cloneManifest()
    ;[reordered[0], reordered[1]] = [reordered[1], reordered[0]]
    expectCode(reordered, "V137_MANIFEST_ORDER_MISMATCH")
  })

  it("rejects skipped or unavailable required scenarios", () => {
    const skipped = cloneManifest() as Array<Record<string, unknown>>
    skipped[0] = { ...skipped[0], requiredDisposition: "skipped" }
    expectCode(skipped, "V137_MANIFEST_REQUIRED_SCENARIO_SKIPPED")

    const unavailable = cloneManifest() as Array<Record<string, unknown>>
    unavailable[0] = { ...unavailable[0], requiredDisposition: "unavailable" }
    expectCode(unavailable, "V137_MANIFEST_REQUIRED_SCENARIO_UNAVAILABLE")
  })

  it("rejects malformed, extra-keyed, or mis-traced rows", () => {
    const malformed = cloneManifest() as Array<Record<string, unknown>>
    malformed[0] = { ...malformed[0], publicLimitationCode: "PRIVATE_secret" }
    expectCode(malformed, "V137_MANIFEST_ROW_MALFORMED")

    const extraKey = cloneManifest() as Array<Record<string, unknown>>
    extraKey[0] = { ...extraKey[0], diagnostics: "hidden" }
    expectCode(extraKey, "V137_MANIFEST_ROW_SHAPE_MISMATCH")

    const requirementDrift = cloneManifest() as Array<Record<string, unknown>>
    requirementDrift[0] = { ...requirementDrift[0], requirementIds: ["PROOF-03"] }
    expectCode(requirementDrift, "V137_MANIFEST_TRACE_MISMATCH")

    const decisionDrift = cloneManifest() as Array<Record<string, unknown>>
    decisionDrift[0] = { ...decisionDrift[0], decisionIds: ["D-03"] }
    expectCode(decisionDrift, "V137_MANIFEST_TRACE_MISMATCH")
  })

  it("rejects participant, result, mutation, evidence, and limitation relabeling", () => {
    for (const [key, replacement] of [
      ["topologyParticipants", ["go-backend"]],
      ["expectedResultClass", "rejected"],
      ["mutationAssertions", ["no-gameplay-mutation"]],
      ["restrictedEvidenceClass", "command-receipt"],
      ["publicLimitationCode", "different-safe-limitation"],
    ] as const) {
      const drifted = cloneManifest() as Array<Record<string, unknown>>
      drifted[0] = {
        ...drifted[0],
        [key]: replacement,
      }
      expectCode(drifted, "V137_MANIFEST_TRACE_MISMATCH")
    }
  })

  it("covers every live PROOF and locked D-01 through D-12 decision exactly as a union", () => {
    const requirements = [
      ...new Set(V137_INTEGRATED_PROOF_SCENARIOS.flatMap((row) => row.requirementIds)),
    ].sort()
    const decisions = [
      ...new Set(V137_INTEGRATED_PROOF_SCENARIOS.flatMap((row) => row.decisionIds)),
    ].sort()
    expect(requirements).toEqual(V137_INTEGRATED_PROOF_REQUIREMENT_IDS)
    expect(decisions).toEqual(V137_INTEGRATED_PROOF_DECISION_IDS)
  })
})
