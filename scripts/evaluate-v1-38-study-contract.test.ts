import { describe, expect, it } from "vitest"
import {
  V138OpportunityVectorSchema,
  V138StudyPolicySchema,
} from "./lib/v1-38-study-contract.js"

const HASH_A = `sha256:${"a".repeat(64)}` as const
const HASH_B = `sha256:${"b".repeat(64)}` as const

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
