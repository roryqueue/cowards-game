import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import {
  V138AccountingClosureSchema,
  V138_CANONICAL_STUDY_POLICY,
  V138OpportunityVectorSchema,
  V138StudyPolicySchema,
  buildV138PreSearchStudyPolicy,
  deriveV138AllocationRoot,
  renderV138PreSearchStudyPolicy,
  serializeV138StudyPolicyInput,
  validateV138AccountingClosure,
} from "./lib/v1-38-study-contract.js"

const HASH_A = `sha256:${"a".repeat(64)}` as const
const HASH_B = `sha256:${"b".repeat(64)}` as const
const HASH_C = `sha256:${"c".repeat(64)}` as const

const studyPolicy = () => ({
  schemaVersion: "v1.38-study-policy-v1",
  policyKind: "pre_search_study_policy",
  identityDomain: "cowards-game:v1.38:pre-search-study-policy:v1",
  primaryEstimand: {
    unit: "adapted_metagame_set_score_difference",
    factoryPolicy: "fixed_across_arms",
    adaptation: "separate_per_arm",
    arms: [
      "current_edge_protocol",
      "inward_rank_protocol",
      "bracket_shield_protocol",
    ],
  },
  pairedContrasts: [
    { id: "bracket_vs_current", left: "bracket_shield_protocol", right: "current_edge_protocol" },
    { id: "inward_vs_current", left: "inward_rank_protocol", right: "current_edge_protocol" },
    { id: "bracket_vs_inward", left: "bracket_shield_protocol", right: "inward_rank_protocol" },
  ],
  fixedPolicyTransfer: {
    role: "secondary_screening_only",
    primaryEvidence: false,
    finalistSelectionEligible: false,
  },
  scoring: { win: 1, draw: 0.5, loss: 0 },
  conditions: {
    sides: ["bottom", "top"],
    entrantInitiativeStates: ["entrant_a", "entrant_b"],
    requiresFullCartesianProduct: true,
    seedCarriesFairnessSemantics: false,
  },
  arenas: {
    catalogVersion: "canonical-arena-catalog-v1.37",
    semanticGeometryIdentityDomain: "cowards-game:arena-semantic-geometry:v1",
    designSemanticGeometryHashes: [HASH_A, HASH_B],
    duplicateLabelsDoNotCreateCells: true,
  },
  splits: [
    { split: "development", opponentField: "development_opponents", disclosure: "iterative", selectionUse: "response_search" },
    { split: "validation", opponentField: "validation_opponents", disclosure: "bounded", selectionUse: "eligibility" },
    { split: "probe", opponentField: "independent_probe_opponents", disclosure: "aggregate_only", selectionUse: "robustness_screen" },
    { split: "sealed", opponentField: "sealed_opponents", disclosure: "custodian_only", selectionUse: "post_freeze_evaluation" },
  ],
  matchedRootSeedBlocks: {
    required: true,
    identityDomain: "cowards-game:v1.38:matched-root-seed-block:v1",
    pairingScope: "all_arms_contrasts_conditions_arenas_splits_opponents",
  },
  completeCells: {
    identityFields: [
      "arm", "split", "opponent_field", "arena_semantic_geometry_hash",
      "bottom_entrant", "top_entrant", "initial_initiative_entrant", "root_seed_block",
    ],
    requireUniqueIdentity: true,
    missingDisposition: "stop_incomplete",
    identicalDuplicateDisposition: "charge_and_exclude_duplicate",
    conflictingDuplicateDisposition: "stop_integrity",
  },
  stoppingAndResponseAdmission: {
    stoppingRuleFrozenBeforeCandidateOutput: true,
    responseRequiresProcessValidCompleteCells: true,
    systemFailureAdmissible: false,
    legalInformationViolationAdmissible: false,
    privateDataLeakAdmissible: false,
  },
  selection: {
    finalistEligibility: "complete_validation_and_probe_only",
    finalistMinimum: 3,
    finalistMaximum: 3,
    portfolioSelection: "diverse_pure_strategies",
    robustPureSelection: "maximin_oracle_relative_pure",
    finalistHashesFreezeBeforeSealedAccess: true,
  },
  claims: {
    scope: "oracle_relative_only",
    compositeCannotOverrideHardGate: true,
    forbidden: [
      "exact_exploitability", "nash_equilibrium", "optimality",
      "permanent_balance", "solved_game", "meta_free",
    ],
  },
  forbiddenInputs: [
    "candidate_output", "formation_state", "holdout_preimage",
    "route_5_outcome", "stopped_route_outcome", "runtime_private_data",
  ],
}) as const

const opportunity = () => ({
  schemaVersion: "v1.38-opportunity-vector-v1",
  identityDomain: "cowards-game:v1.38:opportunity-vector:v1",
  attemptedCandidates: 12,
  acceptedResponseSlots: 6,
  unfilledResponseSlots: 0,
  unfilledDisposition: "burn_and_report",
  responseRounds: 2,
  searchEvaluations: 10_000,
  teacherNodes: 5_000,
  distillationWorkUnits: 1_000,
  matches: 540,
  modelAttempts: 24,
  modelTokens: 1_000_000,
  humanEffortMinutes: 480,
  humanSubmissions: 4,
  replayReviewMinutes: 240,
  cachePolicy: "cold_profile_neutral",
  retryAttempts: 0,
  hardwareClass: "profile-neutral-fixed-class",
  runtimeLimitMs: 5,
  sourceLimitBytes: 65_536,
  objectiveLimitBytes: 16_384,
  strategyMemoryLimitBytes: 16_384,
  soldierMemoryLimitBytes: 4_096,
  outputLimitBytes: 65_536,
}) as const

describe("Phase 262 pre-search study and opportunity contract", () => {
  it("accepts only the complete primary study, paired contrasts, and secondary transfer role", () => {
    expect(V138StudyPolicySchema.parse(studyPolicy())).toEqual(studyPolicy())

    const missingCases = [
      "pairedContrasts",
      "conditions",
      "arenas",
      "splits",
      "matchedRootSeedBlocks",
      "completeCells",
      "selection",
    ] as const
    for (const key of missingCases) {
      const { [key]: _removed, ...missing } = studyPolicy()
      expect(() => V138StudyPolicySchema.parse(missing)).toThrow("V138_STUDY_POLICY_INVALID")
    }

    expect(() => V138StudyPolicySchema.parse({ ...studyPolicy(), waiver: true }))
      .toThrow("V138_STUDY_POLICY_INVALID")
    expect(() => V138StudyPolicySchema.parse({
      ...studyPolicy(),
      fixedPolicyTransfer: { ...studyPolicy().fixedPolicyTransfer, role: "primary" },
    })).toThrow("V138_STUDY_POLICY_INVALID")
  })

  it("requires every semantic condition, split, opponent field, and contrast exactly once", () => {
    const fixture = studyPolicy()
    for (const mutation of [
      { ...fixture, pairedContrasts: fixture.pairedContrasts.slice(0, 2) },
      { ...fixture, conditions: { ...fixture.conditions, sides: ["bottom"] } },
      { ...fixture, arenas: { ...fixture.arenas, designSemanticGeometryHashes: [HASH_A, HASH_A] } },
      { ...fixture, splits: fixture.splits.slice(0, 3) },
      { ...fixture, splits: fixture.splits.map((entry, index) => index === 0 ? { ...entry, opponentField: "" } : entry) },
      { ...fixture, completeCells: { ...fixture.completeCells, requireUniqueIdentity: false } },
    ]) expect(() => V138StudyPolicySchema.parse(mutation)).toThrow("V138_STUDY_POLICY_INVALID")
  })

  it("keeps every opportunity dimension structural, bounded, and non-fungible", () => {
    expect(V138OpportunityVectorSchema.parse(opportunity())).toEqual(opportunity())
    for (const key of [
      "attemptedCandidates", "acceptedResponseSlots", "unfilledResponseSlots",
      "responseRounds", "searchEvaluations", "teacherNodes", "distillationWorkUnits",
      "matches", "modelAttempts", "modelTokens", "humanEffortMinutes",
      "humanSubmissions", "replayReviewMinutes", "cachePolicy", "retryAttempts",
      "hardwareClass", "runtimeLimitMs", "sourceLimitBytes", "objectiveLimitBytes",
      "strategyMemoryLimitBytes", "soldierMemoryLimitBytes", "outputLimitBytes",
    ] as const) {
      const { [key]: _removed, ...missing } = opportunity()
      expect(() => V138OpportunityVectorSchema.parse(missing))
        .toThrow("V138_OPPORTUNITY_VECTOR_INVALID")
    }
    expect(() => V138OpportunityVectorSchema.parse({ ...opportunity(), aggregateCompute: 1 }))
      .toThrow("V138_OPPORTUNITY_VECTOR_INVALID")
    expect(() => V138OpportunityVectorSchema.parse({ ...opportunity(), modelTokens: -1 }))
      .toThrow("V138_OPPORTUNITY_VECTOR_INVALID")
  })
})

const accountingClosure = () => {
  const dispositions = [
    "accepted", "rejected", "invalid", "duplicate_identical", "duplicate_conflicting",
    "player_violation", "system_failure", "retried", "unfilled", "unused",
  ] as const
  const allocationIds = dispositions.map((_, index) => `allocation:${index + 1}`)
  const attempts = dispositions.map((disposition, index) => ({
    allocationId: allocationIds[index]!,
    attemptId: `attempt:${index + 1}`,
    disposition,
    cellIdentity: disposition === "accepted" ? "cell:accepted" : null,
    processValid: disposition === "accepted",
    completeCell: disposition === "accepted",
    runtimeValid: disposition === "accepted",
    systemValid: disposition === "accepted",
    legalInformationValid: disposition === "accepted",
    privacyValid: disposition === "accepted",
    identityJoinProved: disposition === "accepted",
    retryOf: disposition === "retried" ? "attempt:2" : null,
  }))
  return {
    schemaVersion: "v1.38-accounting-closure-v1",
    identityDomain: "cowards-game:v1.38:accounting-closure:v1",
    declaredAllocationCount: allocationIds.length,
    declaredAllocationRoot: deriveV138AllocationRoot(allocationIds),
    allocationIds,
    attempts,
    acceptedCells: [{ cellIdentity: "cell:accepted", attemptId: "attempt:1" }],
  } as const
}

describe("Phase 262 two-ledger accounting and study artifact", () => {
  it("charges every disposition while admitting only unique process-valid complete cells", () => {
    const fixture = accountingClosure()
    expect(V138AccountingClosureSchema.parse(fixture)).toEqual(fixture)
    expect(validateV138AccountingClosure(fixture)).toMatchObject({
      status: "stopped",
      chargedCount: 10,
      acceptedCount: 1,
      reason: "conflicting_duplicate",
    })

    const withoutConflict = {
      ...fixture,
      attempts: fixture.attempts.map((attempt) =>
        attempt.disposition === "duplicate_conflicting"
          ? { ...attempt, disposition: "rejected" as const }
          : attempt),
    }
    expect(validateV138AccountingClosure(withoutConflict)).toMatchObject({
      status: "closed",
      chargedCount: 10,
      acceptedCount: 1,
      reason: null,
    })
  })

  it("fails closed on hidden charges, accepted failures, duplicate cells, and unproved joins", () => {
    const fixture = accountingClosure()
    const clean = {
      ...fixture,
      attempts: fixture.attempts.map((attempt) =>
        attempt.disposition === "duplicate_conflicting"
          ? { ...attempt, disposition: "rejected" as const }
          : attempt),
    }
    const acceptedIndex = clean.attempts.findIndex(({ disposition }) => disposition === "accepted")
    const accepted = clean.attempts[acceptedIndex]!
    for (const mutation of [
      { ...clean, attempts: clean.attempts.slice(0, -1) },
      { ...clean, declaredAllocationCount: clean.declaredAllocationCount - 1 },
      { ...clean, declaredAllocationRoot: HASH_A },
      { ...clean, attempts: clean.attempts.map((entry, index) => index === acceptedIndex ? { ...accepted, systemValid: false } : entry) },
      { ...clean, attempts: clean.attempts.map((entry, index) => index === acceptedIndex ? { ...accepted, identityJoinProved: false } : entry) },
      { ...clean, acceptedCells: [...clean.acceptedCells, clean.acceptedCells[0]!] },
    ]) expect(validateV138AccountingClosure(mutation).status).toBe("stopped")

    expect(() => V138AccountingClosureSchema.parse({ ...clean, route5Outcome: "passed" }))
      .toThrow("V138_ACCOUNTING_CLOSURE_INVALID")
  })

  it("renders a byte-stable ready policy whose roots bind every source and whose authority remains denied", () => {
    const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
    const sourceBytes = readFileSync(path.join(root, "scripts/lib/v1-38-study-contract.ts"))
    const testBytes = readFileSync(path.join(root, "scripts/evaluate-v1-38-study-contract.test.ts"))
    const inputPolicyBytes = serializeV138StudyPolicyInput(studyPolicy())
    const input = {
      studyPolicy: studyPolicy(),
      sourceBytes,
      testBytes,
      inputPolicyBytes,
      generatorBytes: sourceBytes,
    }
    const policy = buildV138PreSearchStudyPolicy(input)
    const rendered = renderV138PreSearchStudyPolicy(policy)
    expect(rendered).toBe(
      renderV138PreSearchStudyPolicy(buildV138PreSearchStudyPolicy(input)),
    )
    const canonicalPolicy = buildV138PreSearchStudyPolicy({
      ...input,
      studyPolicy: V138_CANONICAL_STUDY_POLICY,
      inputPolicyBytes: serializeV138StudyPolicyInput(V138_CANONICAL_STUDY_POLICY),
    })
    expect(readFileSync(
      path.join(root, ".planning/artifacts/v1.38-pre-search-study-policy.json"),
      "utf8",
    )).toBe(renderV138PreSearchStudyPolicy(canonicalPolicy))
    expect(policy).toMatchObject({
      policyStatus: "ready",
      admission: { admit03: "blocked", matrixAdmissionStatus: "blocked" },
      custody: { seal01: "unmet", custodyClaimed: false },
      authority: {
        candidateSearchAuthorized: false,
        phase263Authorized: false,
        formationMaterializationAuthorized: false,
        productionAuthorized: false,
        liveWorkAuthorized: false,
      },
    })
    const sourceMutation = buildV138PreSearchStudyPolicy({
      ...input,
      sourceBytes: Buffer.concat([sourceBytes, Buffer.from("\n// mutation")]),
    })
    const testMutation = buildV138PreSearchStudyPolicy({
      ...input,
      testBytes: Buffer.concat([testBytes, Buffer.from("\n// mutation")]),
    })
    const mutatedStudyPolicy = {
      ...studyPolicy(),
      arenas: {
        ...studyPolicy().arenas,
        designSemanticGeometryHashes: [HASH_A, HASH_C],
      },
    }
    const inputMutation = buildV138PreSearchStudyPolicy({
      ...input,
      studyPolicy: mutatedStudyPolicy,
      inputPolicyBytes: serializeV138StudyPolicyInput(mutatedStudyPolicy),
    })
    expect(new Set([
      policy.policyRoot,
      sourceMutation.policyRoot,
      testMutation.policyRoot,
      inputMutation.policyRoot,
    ]).size).toBe(4)

    for (const forbidden of ["candidateOutput", "profile", "holdout", "route5Outcome"]) {
      expect(() => buildV138PreSearchStudyPolicy({ ...input, [forbidden]: {} } as never))
        .toThrow("V138_PRE_SEARCH_STUDY_POLICY_INPUT_INVALID")
    }
  })
})
