import { createHash } from "node:crypto"
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
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
import {
  V138_DEPENDENCY_REVISION_TOOLING_DEPENDENCY,
  analyzeV138DependencyRevisionPaths,
  analyzeV138DependencyRevisionSources,
  analyzeV138ProtectedHistory,
  buildV138PlanSupersessionManifest,
  renderV138PlanSupersessionManifest,
} from "./check-v1-38-dependency-revision-boundaries.js"

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

describe("Phase 262 dependency-revision supersession boundaries", () => {
  it("renders the exact active, historical, and dormant graph deterministically", () => {
    const manifest = buildV138PlanSupersessionManifest()
    expect(manifest.historicalPlans.map((entry) => [entry.planId, entry.sha256]))
      .toEqual([
        ["262-03", "sha256:d25cf4eede098232cc0b9022eed71da2867582f36e5bbc7c2a3f13d8681745b3"],
        ["262-04", "sha256:7b9fbfef375f2439246740b26fa3c8c1d45baaf54f23ff884ea364fa53effc68"],
        ["262-05", "sha256:53e027d767e2a753adc0c1d2d577cb367bd7f7808ff453d29b3e5aa6203dbcf3"],
        ["262-06", "sha256:7f07cc1f2baf300b4d4dc9200799eabbfb390a96ac7daef26905c9973ddc06b0"],
        ["262-07", "sha256:5c86c379a31e8bd7706c857666d31edc974600242e0e0ef5f78934151f23704d"],
      ])
    expect(manifest.activePlans.map((entry) => entry.planId)).toEqual([
      "262-34", "262-35", "262-36", "262-37", "262-38", "262-39", "262-40",
    ])
    expect(manifest.dormantActivation).toMatchObject({
      planId: "262-41",
      path: ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/dormant/262-41-ACTIVATION-CONTRACT.md",
      sha256: "sha256:5d42af52835c2bbd8eaba1868d50bde1384d143f7f8822b6a9e725bac1075641",
      executable: false,
      requiresFutureLiteralAdmit03Pass: true,
    })
    expect(renderV138PlanSupersessionManifest(manifest))
      .toBe(renderV138PlanSupersessionManifest(buildV138PlanSupersessionManifest()))
    expect(manifest.authority).toEqual({
      matrixAdmissionStatus: "blocked",
      downstreamAuthority: "denied",
      candidateSearchAuthorized: false,
      phase263Authorized: false,
      formationMaterializationAuthorized: false,
      productionAuthorized: false,
    })
  })

  it("detects seeded protected-history edits and deletions", () => {
    const root = mkdtempSync(path.join(tmpdir(), "v138-dependency-history-"))
    mkdirSync(path.join(root, "history"), { recursive: true })
    const expectedBytes = "immutable\n"
    writeFileSync(path.join(root, "history", "kept.md"), expectedBytes)
    const expected = [{
      path: "history/kept.md",
      sha256: `sha256:${createHash("sha256").update(expectedBytes).digest("hex")}`,
    }] as const
    expect(analyzeV138ProtectedHistory(root, expected)).toEqual([])
    writeFileSync(path.join(root, "history", "kept.md"), "edited\n")
    expect(analyzeV138ProtectedHistory(root, expected).map((finding) => finding.code))
      .toEqual(["PROTECTED_HISTORY_DRIFT"])
    expect(readFileSync(path.join(root, "history", "kept.md"), "utf8")).toBe("edited\n")
    expect(analyzeV138ProtectedHistory(root, [{
      path: "history/deleted.md",
      sha256: expected[0]!.sha256,
    }]).map((finding) => finding.code)).toEqual(["PROTECTED_HISTORY_MISSING"])
  })

  it("detects every seeded authority, privacy, live-work, and formation bypass", () => {
    const fixtures = [
      ["ROUTE5_REUSE", 'import { executeV138ParallelMatrix } from "./lib/v1-38-current-matrix-reproduction.js"'],
      ["AUTHORITY_WRITER", "export const writeFoundationActivationRoot = () => undefined"],
      ["LIVE_WORK_COMMAND", 'spawnSync("pnpm", ["v1.38:matrix:run"])'],
      ["CANDIDATE_FORMATION_SURFACE", "export const materializeFormationState = () => ({})"],
      ["PRODUCT_PUBLIC_IMPORT", 'import { createMatch } from "../packages/persistence/src/match-service.js"'],
      ["PRIVATE_DATA_EXPOSURE", 'const publicReceipt = { privateKey: "secret" }'],
      ["MUTABLE_ALIAS", 'const policyPath = "latest/policy.json"'],
    ] as const
    for (const [code, source] of fixtures) {
      expect(analyzeV138DependencyRevisionSources({ "scripts/seed.ts": source })
        .map((finding) => finding.code)).toContain(code)
    }
    expect(analyzeV138DependencyRevisionPaths([
      ".planning/artifacts/formations/current-edge/state.json",
    ]).map((finding) => finding.code)).toEqual(["CANDIDATE_FORMATION_SURFACE"])
  })

  it("keeps the frozen replay issue separately attributed without substitution", () => {
    expect(V138_DEPENDENCY_REVISION_TOOLING_DEPENDENCY).toEqual({
      tooling_dependency: "frozen_replay_commit_unreachable",
      frozenCommit: "4fab0afc058232f37ba11506b5d04a1d59b2f4e0",
      disposition: "unresolved_external_to_plan_262_34",
      substitutionAllowed: false,
      replayManifestMutationAllowed: false,
    })
  })
})
