import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

import {
  buildV138PreFormationProtocolPolicy,
  canonicalizeV138OpeningCluster,
  evaluateV138Classifiers,
  renderV138PreFormationProtocolPolicy,
} from "./lib/v1-38-classifiers.js"
import {
  analyzeV138PreFormationContainment,
  buildV138PreFormationContainmentPolicy,
  renderV138PreFormationContainmentPolicy,
} from "./lib/v1-38-containment.js"

const HASH_A = `sha256:${"a".repeat(64)}` as const
const HASH_B = `sha256:${"b".repeat(64)}` as const
const HASH_C = `sha256:${"c".repeat(64)}` as const
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const fileHash = (repoPath: string) =>
  `sha256:${createHash("sha256").update(readFileSync(path.join(repoRoot, repoPath))).digest("hex")}` as const

const opening = () => ({
  schemaVersion: "v1.38-synthetic-opening-projection-v1",
  board: { width: 12, height: 12 },
  entrants: [
    {
      opaqueId: "opaque-red",
      soldiers: [
        { opaqueId: "red-2", sourceOrder: 1, x: 3, y: 1, facing: "DOWN", actions: ["MOVE", "PUSH"] },
        { opaqueId: "red-1", sourceOrder: 0, x: 2, y: 0, facing: "DOWN", actions: ["ADVANCE", "TURN_LEFT"] },
      ],
    },
    {
      opaqueId: "opaque-blue",
      soldiers: [
        { opaqueId: "blue-1", sourceOrder: 0, x: 9, y: 11, facing: "UP", actions: ["ADVANCE", "TURN_RIGHT"] },
        { opaqueId: "blue-2", sourceOrder: 1, x: 8, y: 10, facing: "UP", actions: ["MOVE", "PUSH"] },
      ],
    },
  ],
}) as const

const horizontalReflection = () => ({
  ...opening(),
  entrants: opening().entrants.map((entrant) => ({
    ...entrant,
    opaqueId: `renamed-${entrant.opaqueId}`,
    soldiers: [...entrant.soldiers].reverse().map((soldier) => ({
      ...soldier,
      opaqueId: `obfuscated-${soldier.opaqueId}`,
      sourceOrder: 99 - soldier.sourceOrder,
      x: 11 - soldier.x,
      facing: soldier.facing,
      actions: soldier.actions.map((action) =>
        action === "TURN_LEFT" ? "TURN_RIGHT" : action === "TURN_RIGHT" ? "TURN_LEFT" : action),
    })),
  })),
})

const entrantSwapRotation = () => ({
  ...opening(),
  entrants: [...opening().entrants].reverse().map((entrant) => ({
    ...entrant,
    opaqueId: `swap-${entrant.opaqueId}`,
    soldiers: entrant.soldiers.map((soldier) => ({
      ...soldier,
      opaqueId: `swap-${soldier.opaqueId}`,
      x: 11 - soldier.x,
      y: 11 - soldier.y,
      facing: soldier.facing === "UP" ? "DOWN" : "UP",
      actions: soldier.actions.map((action) =>
        action === "TURN_LEFT" ? "TURN_RIGHT" : action === "TURN_RIGHT" ? "TURN_LEFT" : action),
    })),
  })),
})

const classifierInput = () => ({
  schemaVersion: "v1.38-synthetic-classifier-evidence-v1",
  eligibleCellInventoryRoot: HASH_A,
  implementationRoot: HASH_B,
  expectedCellIds: ["cell-a", "cell-b", "cell-c", "cell-d"],
  observations: [
    { cellId: "cell-a", replicationId: "seed-1", openingCluster: "cluster-a", feasibleOpeningChoices: 4, openingChoiceCounts: [1, 1, 1, 1], convoy: false, reserveHoarding: false, persistentTurtle: false, stoneShield: false, interaction: true, inactive: false, draw: false, matchLength: 70, responseGap: 0.1, pureWorstCase: 0.55, sideGap: 0, initiativeGap: 0, opaqueIdGap: 0, soldierOrderGap: 0, sourceOrderGap: 0 },
    { cellId: "cell-b", replicationId: "seed-1", openingCluster: "cluster-b", feasibleOpeningChoices: 4, openingChoiceCounts: [1, 1, 1, 1], convoy: false, reserveHoarding: false, persistentTurtle: false, stoneShield: false, interaction: true, inactive: false, draw: false, matchLength: 80, responseGap: 0.12, pureWorstCase: 0.52, sideGap: 0.01, initiativeGap: 0.01, opaqueIdGap: 0, soldierOrderGap: 0, sourceOrderGap: 0 },
    { cellId: "cell-c", replicationId: "seed-2", openingCluster: "cluster-a", feasibleOpeningChoices: 4, openingChoiceCounts: [1, 1, 1, 1], convoy: false, reserveHoarding: false, persistentTurtle: false, stoneShield: false, interaction: true, inactive: false, draw: false, matchLength: 75, responseGap: 0.08, pureWorstCase: 0.58, sideGap: 0, initiativeGap: 0.01, opaqueIdGap: 0, soldierOrderGap: 0, sourceOrderGap: 0 },
    { cellId: "cell-d", replicationId: "seed-2", openingCluster: "cluster-b", feasibleOpeningChoices: 4, openingChoiceCounts: [1, 1, 1, 1], convoy: false, reserveHoarding: false, persistentTurtle: false, stoneShield: false, interaction: true, inactive: false, draw: true, matchLength: 90, responseGap: 0.1, pureWorstCase: 0.5, sideGap: 0.01, initiativeGap: 0, opaqueIdGap: 0, soldierOrderGap: 0, sourceOrderGap: 0 },
  ],
}) as const

describe("Phase 262 profile-neutral classifiers and protocol", () => {
  it("canonicalizes mirrored, entrant-swapped, renamed, permuted, and obfuscated openings", () => {
    const canonical = canonicalizeV138OpeningCluster(opening())
    expect(canonicalizeV138OpeningCluster(horizontalReflection())).toBe(canonical)
    expect(canonicalizeV138OpeningCluster(entrantSwapRotation())).toBe(canonical)
    expect(canonical).toMatch(/^sha256:[0-9a-f]{64}$/u)
  })

  it("rejects malformed and missing opening projections", () => {
    for (const invalid of [
      { ...opening(), board: { width: 0, height: 12 } },
      { ...opening(), entrants: [opening().entrants[0]] },
      { ...opening(), entrants: [{ ...opening().entrants[0], soldiers: [] }, opening().entrants[1]] },
      { ...opening(), extra: true },
    ]) expect(() => canonicalizeV138OpeningCluster(invalid)).toThrow("V138_OPENING_PROJECTION_INVALID")
  })

  it("evaluates the complete classifier inventory with exact denominators and replication treatment", () => {
    const result = evaluateV138Classifiers(classifierInput())
    expect(result.status).toBe("passed")
    expect(result.classifiers.map((entry) => entry.id)).toEqual([
      "opening_entropy", "scripted_opening", "convoy", "reserve_hoarding",
      "persistent_turtle", "stone_shield", "interaction", "inactivity", "draw",
      "match_length", "response_gap", "pure_worst_case", "confounders",
    ])
    for (const entry of result.classifiers) {
      expect(entry.denominator).toEqual({
        type: "complete_unique_cells",
        eligibleCellInventoryRoot: HASH_A,
        replicationUnit: "matched_root_seed_block",
        replicationTreatment: "mean_of_replication_means",
        missingnessRule: "reject_missing_duplicate_or_conflicting_cells",
        normalizationProfile: "v1.38-profile-neutral-classifier-normalization-v1",
        implementationRoot: HASH_B,
      })
      expect(Number.isFinite(entry.value)).toBe(true)
    }
    expect(result.openingClusters).toEqual([
      { cluster: "cluster-a", count: 2 },
      { cluster: "cluster-b", count: 2 },
    ])
  })

  it("keeps hard rejection logic non-compensating at exact boundaries", () => {
    const input = classifierInput()
    const observations = input.observations.map((entry, index) => ({
      ...entry,
      convoy: index === 0,
      interaction: false,
    }))
    const failed = evaluateV138Classifiers({ ...input, observations })
    expect(failed.status).toBe("rejected")
    expect(failed.failedHardGates).toContain("interaction")
    expect(failed.compositeMayCompensate).toBe(false)
  })

  it("fails closed on missing, duplicate, conflicting, non-finite, and invalid-denominator evidence", () => {
    const base = classifierInput()
    for (const invalid of [
      { ...base, observations: base.observations.slice(1) },
      { ...base, observations: [...base.observations, base.observations[0]] },
      { ...base, observations: [...base.observations, { ...base.observations[0], draw: true }] },
      { ...base, observations: base.observations.map((entry, index) => index === 0 ? { ...entry, matchLength: Number.NaN } : entry) },
      { ...base, expectedCellIds: ["cell-a", "cell-a", "cell-c", "cell-d"] },
      { ...base, candidateOutput: "forbidden" },
    ]) expect(() => evaluateV138Classifiers(invalid)).toThrow("V138_CLASSIFIER_EVIDENCE_INVALID")
  })

  it("is deterministic under bounded permutation fuzz", () => {
    const expected = evaluateV138Classifiers(classifierInput())
    for (let offset = 0; offset < 16; offset += 1) {
      const observations = [...classifierInput().observations]
        .sort((left, right) => ((left.cellId.charCodeAt(5) + offset * 7) % 11) - ((right.cellId.charCodeAt(5) + offset * 7) % 11))
      expect(evaluateV138Classifiers({ ...classifierInput(), observations })).toEqual(expected)
    }
  })

  it("renders exact protocol-only coordinates, procedures, telemetry, gates, and denials", () => {
    const artifact = buildV138PreFormationProtocolPolicy({
      studyPolicyRoot: HASH_A,
      measurementPolicyRoot: HASH_B,
      classifierImplementationRoot: HASH_C,
    })
    expect(artifact.profiles.map((profile) => [profile.id, profile.protocolOnly, profile.materialization])).toEqual([
      ["current_edge_rank", true, "forbidden_before_phase_267"],
      ["full_inward_rank", true, "forbidden_before_phase_267"],
      ["edge_anchored_bracket", true, "forbidden_before_phase_267"],
    ])
    expect(artifact.profiles[0].top).toEqual({ y: [0], x: [2, 3, 4, 5, 6, 7, 8, 9], facing: "DOWN" })
    expect(artifact.profiles[0].bottom).toEqual({ y: [11], x: [2, 3, 4, 5, 6, 7, 8, 9], facing: "UP" })
    expect(artifact.profiles[1].top.y).toEqual([1])
    expect(artifact.profiles[1].bottom.y).toEqual([10])
    expect(artifact.profiles[2].top).toEqual({ y: [0, 1], xByY: { "0": [2, 3, 8, 9], "1": [4, 5, 6, 7] }, facing: "DOWN" })
    expect(artifact.profiles[2].bottom).toEqual({ y: [10, 11], xByY: { "10": [4, 5, 6, 7], "11": [2, 3, 8, 9] }, facing: "UP" })
    expect(artifact.authority).toEqual({
      satisfiesAdmit03: false,
      satisfiesSeal01: false,
      candidateSearchAuthorized: false,
      phase263Authorized: false,
      formationMaterializationAuthorized: false,
      holdoutOpenAuthorized: false,
      liveWorkAuthorized: false,
      productionAuthorized: false,
      publicExposureAuthorized: false,
    })
    expect(artifact.holdoutConstruction.profileConditionedInputs).toBe(0)
    expect(artifact.holdoutConstruction.currentTrainedInputs).toBe(0)
    expect(renderV138PreFormationProtocolPolicy(artifact)).toBe(renderV138PreFormationProtocolPolicy(artifact))
  })
})

const cleanContainmentInput = () => ({
  schemaVersion: "v1.38-pre-formation-containment-input-v1",
  phase266FreezePresent: false,
  phase267MaterializationGateOpen: false,
  allowlistedProtocolPaths: [
    "scripts/lib/v1-38-classifiers.ts",
    ".planning/artifacts/v1.38-pre-formation-protocol-policy.json",
  ],
  sources: {
    "scripts/lib/v1-38-classifiers.ts": "export const protocolOnly = true as const\n",
    "scripts/evaluate-v1-38-classifiers-containment.test.ts": "export const syntheticFixture = Object.freeze({ profileNeutral: true })\n",
  },
  artifacts: {
    ".planning/artifacts/v1.38-pre-formation-protocol-policy.json": {
      schemaVersion: "v1.38-pre-formation-protocol-policy-v1",
      protocolOnly: true,
      materialization: "forbidden_before_phase_267",
      authority: {
        candidateSearchAuthorized: false,
        formationMaterializationAuthorized: false,
        productionAuthorized: false,
        publicExposureAuthorized: false,
      },
    },
  },
}) as const

describe("Phase 262 pre-formation containment", () => {
  it("detects every seeded direct, alias, renamed, filename, namespace, and schema bypass", () => {
    const mutations: Array<[string, unknown, string]> = [
      ["direct engine state", {
        ...cleanContainmentInput(),
        sources: { "scripts/seed.ts": "import { GameState } from '@cowards/engine'\nexport const state: GameState = {} as GameState" },
      }, "FORBIDDEN_ENGINE_STATE"],
      ["aliased constructor", {
        ...cleanContainmentInput(),
        sources: { "scripts/seed.ts": "import { createInitialGameState as allowed } from '@cowards/engine'\nconst renamed = allowed\nrenamed({})" },
      }, "FORBIDDEN_ENGINE_STATE"],
      ["allowed filename executable value", {
        ...cleanContainmentInput(),
        sources: { "scripts/lib/v1-38-classifiers.ts": "const materializedInitialState = { soldiers: [], phase: 'ACTIVE' }\nexport { materializedInitialState }" },
      }, "EXECUTABLE_MATERIALIZATION"],
      ["alternate scheduler", {
        ...cleanContainmentInput(),
        sources: { "scripts/seed.ts": "export function resolveRoundWithProfile() { while (true) break }" },
      }, "ALTERNATE_RULES_OR_SCHEDULER"],
      ["dynamic execution", {
        ...cleanContainmentInput(),
        sources: { "scripts/seed.ts": "const make = Function\nmake('return 1')()" },
      }, "DYNAMIC_CODE"],
      ["node vm", {
        ...cleanContainmentInput(),
        sources: { "scripts/seed.ts": "import vm from 'node:vm'\nvm.runInNewContext('1')" },
      }, "DYNAMIC_CODE"],
      ["strategy execution", {
        ...cleanContainmentInput(),
        sources: { "scripts/seed.ts": "const invoke = executeStrategy\ninvoke(source)" },
      }, "STRATEGY_EXECUTION"],
      ["formation namespace", {
        ...cleanContainmentInput(),
        sources: { "scripts/formations/bracket.ts": "export const protocolOnly = true" },
      }, "FORBIDDEN_NAMESPACE"],
      ["candidate namespace", {
        ...cleanContainmentInput(),
        artifacts: { ".planning/artifacts/candidates/entry.json": { protocolOnly: true } },
      }, "FORBIDDEN_NAMESPACE"],
      ["product import", {
        ...cleanContainmentInput(),
        sources: { "apps/web/seed.ts": "import { protocolOnly } from '../../scripts/lib/v1-38-classifiers'\nvoid protocolOnly" },
      }, "PRODUCT_OR_PUBLIC_REACHABILITY"],
      ["persistence import", {
        ...cleanContainmentInput(),
        sources: { "scripts/seed.ts": "import { db } from '@cowards/persistence'\nvoid db" },
      }, "PRODUCT_OR_PUBLIC_REACHABILITY"],
      ["mutable alias", {
        ...cleanContainmentInput(),
        sources: { "scripts/seed.ts": "export const latestProfile = 'bracket'" },
      }, "MUTABLE_ALIAS"],
      ["schema materialization key", {
        ...cleanContainmentInput(),
        artifacts: { ".planning/artifacts/v1.38-pre-formation-protocol-policy.json": { ...cleanContainmentInput().artifacts[".planning/artifacts/v1.38-pre-formation-protocol-policy.json"], initialState: {} } },
      }, "FORBIDDEN_SCHEMA_KEY"],
      ["private receipt key", {
        ...cleanContainmentInput(),
        artifacts: { ".planning/artifacts/v1.38-pre-formation-protocol-policy.json": { ...cleanContainmentInput().artifacts[".planning/artifacts/v1.38-pre-formation-protocol-policy.json"], StrategyMemory: {} } },
      }, "PRIVATE_RECEIPT_FIELD"],
    ]
    for (const [name, mutation, expectedCode] of mutations) {
      const analysis = analyzeV138PreFormationContainment(mutation)
      expect(analysis.findings.map((finding) => finding.code), name).toContain(expectedCode)
    }
  })

  it("rejects a bypass suite that omits a required seeded class", () => {
    const clean = analyzeV138PreFormationContainment(cleanContainmentInput())
    expect(() => buildV138PreFormationContainmentPolicy({
      protocolPolicyRoot: HASH_A,
      monitorImplementationRoot: HASH_B,
      scannedInventoryRoot: clean.scannedInventoryRoot,
      allowlistRoot: clean.allowlistRoot,
      realTreeAnalysis: clean,
      seededBypassResults: [{ seedId: "direct_engine_state", detectedCode: "FORBIDDEN_ENGINE_STATE" }],
    })).toThrow("V138_CONTAINMENT_POLICY_INPUT_INVALID")
  })

  it("passes only a zero-finding declared tree after every required seeded bypass is detected", () => {
    const analysis = analyzeV138PreFormationContainment(cleanContainmentInput())
    expect(analysis.findings).toEqual([])
    expect(analysis.status).toBe("passed_absence")
    const required = [
      ["direct_engine_state", "FORBIDDEN_ENGINE_STATE"],
      ["aliased_engine_constructor", "FORBIDDEN_ENGINE_STATE"],
      ["allowed_filename_state", "EXECUTABLE_MATERIALIZATION"],
      ["alternate_scheduler", "ALTERNATE_RULES_OR_SCHEDULER"],
      ["dynamic_code", "DYNAMIC_CODE"],
      ["node_vm", "DYNAMIC_CODE"],
      ["strategy_execution", "STRATEGY_EXECUTION"],
      ["forbidden_namespace", "FORBIDDEN_NAMESPACE"],
      ["product_import", "PRODUCT_OR_PUBLIC_REACHABILITY"],
      ["persistence_import", "PRODUCT_OR_PUBLIC_REACHABILITY"],
      ["mutable_alias", "MUTABLE_ALIAS"],
      ["schema_key", "FORBIDDEN_SCHEMA_KEY"],
      ["private_field", "PRIVATE_RECEIPT_FIELD"],
    ].map(([seedId, detectedCode]) => ({ seedId, detectedCode }))
    const policy = buildV138PreFormationContainmentPolicy({
      protocolPolicyRoot: HASH_A,
      monitorImplementationRoot: HASH_B,
      scannedInventoryRoot: analysis.scannedInventoryRoot,
      allowlistRoot: analysis.allowlistRoot,
      realTreeAnalysis: analysis,
      seededBypassResults: required,
    })
    expect(policy.status).toBe("passed_absence")
    expect(policy.denials).toEqual({
      formation: "denied_until_valid_phase_266_freeze_then_phase_267",
      candidate: "denied",
      production: "denied",
      public: "denied",
      persistence: "denied",
      scheduling: "denied",
      replayAndResult: "denied",
    })
    expect(renderV138PreFormationContainmentPolicy(policy)).toBe(renderV138PreFormationContainmentPolicy(policy))
  })

  it("binds a zero-finding real declared inventory and regenerates its committed policy", () => {
    const sourcePaths = [
      "scripts/lib/v1-38-classifiers.ts",
      "scripts/lib/v1-38-containment.ts",
      "scripts/evaluate-v1-38-classifiers-containment.test.ts",
    ]
    const protocolPath = ".planning/artifacts/v1.38-pre-formation-protocol-policy.json"
    const containmentPath = ".planning/artifacts/v1.38-pre-formation-containment-policy.json"
    const sources = Object.fromEntries(sourcePaths.map((repoPath) => [
      repoPath,
      readFileSync(path.join(repoRoot, repoPath), "utf8"),
    ]))
    const protocolBytes = readFileSync(path.join(repoRoot, protocolPath))
    const analysis = analyzeV138PreFormationContainment({
      schemaVersion: "v1.38-pre-formation-containment-input-v1",
      phase266FreezePresent: false,
      phase267MaterializationGateOpen: false,
      allowlistedProtocolPaths: [...sourcePaths, protocolPath],
      sources,
      artifacts: { [protocolPath]: JSON.parse(protocolBytes.toString("utf8")) },
    })
    expect(analysis.status).toBe("passed_absence")
    expect(analysis.findings).toEqual([])
    const seededBypassResults = [
      ["direct_engine_state", "FORBIDDEN_ENGINE_STATE"],
      ["aliased_engine_constructor", "FORBIDDEN_ENGINE_STATE"],
      ["allowed_filename_state", "EXECUTABLE_MATERIALIZATION"],
      ["alternate_scheduler", "ALTERNATE_RULES_OR_SCHEDULER"],
      ["dynamic_code", "DYNAMIC_CODE"],
      ["node_vm", "DYNAMIC_CODE"],
      ["strategy_execution", "STRATEGY_EXECUTION"],
      ["forbidden_namespace", "FORBIDDEN_NAMESPACE"],
      ["product_import", "PRODUCT_OR_PUBLIC_REACHABILITY"],
      ["persistence_import", "PRODUCT_OR_PUBLIC_REACHABILITY"],
      ["mutable_alias", "MUTABLE_ALIAS"],
      ["schema_key", "FORBIDDEN_SCHEMA_KEY"],
      ["private_field", "PRIVATE_RECEIPT_FIELD"],
    ].map(([seedId, detectedCode]) => ({ seedId, detectedCode }))
    const policy = buildV138PreFormationContainmentPolicy({
      protocolPolicyRoot: `sha256:${createHash("sha256").update(protocolBytes).digest("hex")}`,
      monitorImplementationRoot: fileHash("scripts/lib/v1-38-containment.ts"),
      scannedInventoryRoot: analysis.scannedInventoryRoot,
      allowlistRoot: analysis.allowlistRoot,
      realTreeAnalysis: analysis,
      seededBypassResults,
    })
    expect(readFileSync(path.join(repoRoot, containmentPath), "utf8"))
      .toBe(renderV138PreFormationContainmentPolicy(policy))
  })
})
