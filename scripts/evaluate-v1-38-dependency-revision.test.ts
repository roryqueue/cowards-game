import { createHash } from "node:crypto"
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
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
  analyzeV138LocalSealCarriers,
  analyzeV138ProtectedHistory,
  buildV138PlanSupersessionManifest,
  evaluateV138PhasePlanIndexTransition,
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
  it("accepts the canonical privacy seam and closed local-seal private storage identifiers", () => {
    const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
    const source = readFileSync(path.join(repoRoot, "scripts/lib/v1-38-local-seal.ts"), "utf8")
    expect(analyzeV138DependencyRevisionSources({ "scripts/lib/v1-38-local-seal.ts": source })
      .filter((finding) => finding.code === "PRIVATE_DATA_EXPOSURE")).toEqual([])
  })

  it("detects executable private-data carriers across AST projection shapes", () => {
    const seeds = [
      "const publicReceipt = { StrategyMemory: privateState.value }",
      "interface PublicReceipt { SoldierMemory: string }",
      "const alias = privateState.objectivePayload; const publicOutput = { alias }",
      "const publicReceipt = { [\"privateKey\"]: keyMaterial }",
      "const publicReceipt = { nested: { rawDiagnostics: diagnosticState } }",
      "const publicReceipt = { safeName: privateState.preimage }",
      "const { secret: alias } = privateState; const publicProjection = { alias }",
    ]
    for (const [index, source] of seeds.entries()) {
      expect(analyzeV138DependencyRevisionSources({ [`scripts/privacy-seed-${index}.ts`]: source })
        .map((finding) => finding.code)).toContain("PRIVATE_DATA_EXPOSURE")
    }
  })

  it("ignores privacy vocabulary in comments and descriptive string literals", () => {
    const source = [
      "// StrategyMemory must never enter public output.",
      "const description = \"SoldierMemory objectivePayload privateKey secret preimage rawDiagnostics\"",
      "const publicReceipt = { description: \"StrategyMemory is forbidden\" }",
    ].join("\n")
    expect(analyzeV138DependencyRevisionSources({ "scripts/privacy-description.ts": source })
      .filter((finding) => finding.code === "PRIVATE_DATA_EXPOSURE")).toEqual([])
  })

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
      "262-34", "262-35", "262-36", "262-37", "262-38", "262-39", "262-42",
      "262-44", "262-45", "262-46", "262-47", "262-48",
    ])
    expect(manifest.archivedCheckpoint).toEqual({
      planId: "262-40",
      originalExecutablePath: ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-40-PLAN.md",
      archivalPath: ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/archived/262-40-HISTORICAL.md",
      sha256: "sha256:e745ba878fcd0090a968762f314c787dae86896d27f2bc8a72498d684ed39231",
      replacementPlan: "262-42",
      resumable: false,
    })
    expect(manifest.dormantActivation).toMatchObject({
      planId: "262-41",
      path: ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/dormant/262-41-ACTIVATION-CONTRACT.md",
      sha256: "sha256:5d42af52835c2bbd8eaba1868d50bde1384d143f7f8822b6a9e725bac1075641",
      executable: false,
      requiresFutureLiteralAdmit03Pass: true,
    })
    expect(manifest.archivedSentinel).toEqual({
      planId: "262-43",
      originalExecutablePath: ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-43-PLAN.md",
      archivalPath: ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/archived/262-43-HISTORICAL.md",
      sha256: "sha256:aad6ed06fc7e1fc0a0643d9ece8a9e85611d836212516c3284541a153c581239",
      truthfulUnderFormerContract: true,
      resumable: false,
      futureReplacementPlans: ["262-44", "262-45", "262-46", "262-47", "262-48"],
    })
    expect(manifest.protectedTerminalHistory).toEqual({
      plan26242SummarySha256: "sha256:297aacff196884d5cbdd5e97dfc69c596055359ac6cf55a91f2ef7ac2555808b",
      terminalDispositionSha256: "sha256:ac612457eacefd5333d4d179027cf1f48a6235dbb47fb4c0a259b81132a73f15",
      terminalDispositionRoot: "sha256:2eff8d9ee93fa4259537a981e8a2ce08a83b82863c595da7ee4cb30c24b4327e",
    })
    expect(manifest.successorContract).toEqual({
      researchInputSha256: "sha256:a268ebfa78d1ab26e0dc5958b33af032e75ba41208e5cfb333982336a8331ad4",
      assuranceClass: "single_operator_local_seal_v1",
      operatorRole: "repository_operator",
      localSealMechanics: "pending",
      independentEvidenceVerification: "pending",
      admit03: "blocked",
      seal01: "pending",
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

  it("accepts exactly the six declared Phase 262 lifecycle index states", () => {
    const states = [
      ["pre_49", 37, ["262-47", "262-48", "262-49", "262-50"], false, false, false],
      ["post_49_pre_50", 38, ["262-47", "262-48", "262-50"], false, false, false],
      ["post_50_pass", 39, ["262-47", "262-48"], false, false, true],
      ["post_47", 40, ["262-48"], false, false, true],
      ["post_48", 41, [], false, false, true],
      ["plan_50_fail", 38, ["262-47", "262-48", "262-50"], true, true, false],
    ] as const
    for (const [lifecycle, summaryCount, incomplete, failArtifactCanonical, failReviewCanonical, summary26250Present] of states) {
      expect(evaluateV138PhasePlanIndexTransition({
        lifecycle,
        planCount: 41,
        summaryCount,
        incomplete,
        failArtifactCanonical,
        failReviewCanonical,
        summary26250Present,
      })).toEqual({ planCount: 41, summaryCount, incomplete })
    }
  })

  it("rejects one-input-at-a-time lifecycle drift and compensating counts", () => {
    const exact = {
      lifecycle: "pre_49",
      planCount: 41,
      summaryCount: 37,
      incomplete: ["262-47", "262-48", "262-49", "262-50"],
      failArtifactCanonical: false,
      failReviewCanonical: false,
      summary26250Present: false,
    } as const
    for (const mutation of [
      { ...exact, planCount: 42 },
      { ...exact, summaryCount: 38 },
      { ...exact, incomplete: ["262-47", "262-48", "262-50", "262-49"] },
      { ...exact, incomplete: ["262-47", "262-48", "262-50"] },
      { ...exact, failArtifactCanonical: true },
      { ...exact, failReviewCanonical: true },
      { ...exact, summary26250Present: true },
      { ...exact, planCount: 42, summaryCount: 38 },
      { ...exact, waiver: true },
    ]) expect(() => evaluateV138PhasePlanIndexTransition(mutation as never))
      .toThrow("V138_PHASE_PLAN_INDEX_TRANSITION_INVALID")

    expect(() => evaluateV138PhasePlanIndexTransition({
      lifecycle: "plan_50_fail",
      planCount: 41,
      summaryCount: 38,
      incomplete: ["262-47", "262-48", "262-50"],
      failArtifactCanonical: false,
      failReviewCanonical: true,
      summary26250Present: false,
    })).toThrow("V138_PHASE_PLAN_INDEX_TRANSITION_INVALID")
  })

  it("requires all active carriers to agree on the reduced assurance and denied authority", () => {
    const valid = Object.fromEntries([
      "activation", "requirements", "context", "roadmap", "summary", "research", "seed", "state",
    ].map((name) => [name, [
      "single_operator_local_seal_v1",
      "named repository operator",
      "no independent custody or separate permissioning claim",
      "ADMIT-03 remains blocked",
      "SEAL-01 remains pending",
      "candidate search Phase 263 formation holdout opening public activation production remain unauthorized",
    ].join("\n")]))
    expect(analyzeV138LocalSealCarriers(valid)).toEqual([])

    for (const missing of [
      "single_operator_local_seal_v1",
      "repository operator",
      "independent custody",
      "ADMIT-03",
      "SEAL-01",
      "Phase 263",
      "production",
    ]) {
      const mutated = { ...valid, activation: valid.activation!.replace(missing, "removed") }
      expect(analyzeV138LocalSealCarriers(mutated).map((finding) => finding.code))
        .toContain("LOCAL_SEAL_CONTRACT_DRIFT")
    }
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
