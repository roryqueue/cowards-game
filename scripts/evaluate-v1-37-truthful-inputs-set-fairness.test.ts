import { describe, expect, it } from "vitest"
import {
  V137_PHASE260_DECISIONS,
  V137_PHASE260_GATE_IDS,
  V137_PHASE260_REQUIREMENTS,
  validateV137TruthfulInputsSetFairnessProof,
  type V137TruthfulInputsSetFairnessProof,
} from "./evaluate-v1-37-truthful-inputs-set-fairness.ts"

const hash = (character: string): `sha256:${string}` =>
  `sha256:${character.repeat(64)}`

const languages = ["typescript", "python", "rust", "zig"] as const

const createProof = (): V137TruthfulInputsSetFairnessProof => ({
  schemaVersion: "v1.37-truthful-inputs-set-fairness-proof-v1",
  milestone: "v1.37",
  phase: 260,
  status: "passed",
  posture: "activated-service-backed-executable-proof",
  requirements: V137_PHASE260_REQUIREMENTS.map((id) => ({
    id,
    status: "proved" as const,
  })),
  decisions: V137_PHASE260_DECISIONS.map((id) => ({
    id,
    status: "proved" as const,
  })),
  inputs: [
    { path: "packages/spec/src/current-semantic-authority-source.ts", sha256: hash("1") },
  ],
  authority: {
    semanticAuthorityKey: "runtime-v1.19",
    tupleId: hash("2"),
    rulesVersion: "cowards-rules-v1.4",
    engineVersion: "engine-kernel-v1.37-candidate-1",
    runtimeAbiVersion: "strategy-runtime-abi-v1.19",
    chronicleVersion: "chronicle-recorder-current-events-v1.37-candidate-1",
    certificateVersion: "runtime-conformance-certificate-v1.19",
    corpusVersion: "v3",
    corpusRoot: hash("3"),
    traceVersion: "v1.37-observation-trace-v4",
    traceRoot: hash("4"),
    workshopVersion: "workshop-contract-v1.19",
    workshopRoot: hash("5"),
    arenaCatalogVersion: "canonical-arena-catalog-v1.37",
    setPolicyVersion: "canonical-set-policy-v1.37-four-condition-v1",
    revisionEvidencePolicy: "strategy-revision-v1.19-revalidation-v1",
  },
  observations: {
    initialInitiativeExplicit: true,
    currentInitiativeExplicit: true,
    relativeInitiativeExplicit: true,
    hasAdvancedThisActivationAuthoritative: true,
    preActionObservation: true,
    mismatchRejected: true,
    failureClassesPreserved: ["success", "player_violation", "system_failure"],
  },
  arenas: {
    catalogVersion: "canonical-arena-catalog-v1.37",
    recordCount: 3,
    activeCount: 2,
    schedulableCount: 2,
    historicalAliasCount: 1,
    activeSemanticGeometryCount: 2,
    duplicateActiveGeometryCount: 0,
    smokeOpenFieldAliasExact: true,
    standardCrossUnchanged: true,
  },
  setFairness: {
    policyVersion: "canonical-set-policy-v1.37-four-condition-v1",
    conditionCount: 4,
    explicitConditionIdentity: true,
    seedCarriesFairnessSemantics: false,
    eachEntrantBottomCount: 2,
    eachEntrantTopCount: 2,
    eachEntrantInitialInitiativeCount: 2,
    cartesianComplete: true,
    atomicCreation: true,
    partialMatrixCounts: false,
    systemFailureCounts: false,
    playerViolationTerminalEvidence: true,
    completionOrderIndependent: true,
    retryIdentityStable: true,
  },
  conformance: {
    laneCount: 4,
    certificateCount: 4,
    runCount: 12,
    allCurrentTupleBound: true,
    noOldEvidenceReuse: true,
    lanes: languages.map((languageId, languageIndex) => ({
      languageId,
      laneId: `lane:${languageId}:v1.19`,
      candidatePayloadSha256: hash(String(languageIndex + 6)),
      certificateId: `certificate:${languageId}`,
      certificateSha256: hash(String(languageIndex + 6)),
      runs: [0, 1, 2].map((runIndex) => ({
        runId: `run:${languageId}:${runIndex}`,
        resultRootSha256: hash("a"),
        evidenceRootSha256: hash(String(languageIndex + 6)),
        status: "passed" as const,
        complete: true as const,
        freshProcess: true as const,
        freshWorkspace: true as const,
        skippedCaseCount: 0 as const,
        unsupportedCaseCount: 0 as const,
        fallbackUsed: false as const,
        syntheticEvidence: false as const,
      })),
    })),
  },
  revisions: {
    inventoryCount: 2,
    inventoryRootSha256: hash("b"),
    eligibleCount: 0,
    nonCountedCount: 2,
    failedClosed: true,
    exactRevisionEvidenceRequired: true,
    crossRevisionSubstitutionRejected: true,
    records: [
      {
        strategyRevisionId: "revision:one",
        dispositionCode: "REVISION_NOT_IMMUTABLE",
        outcome: "non_counted",
        countedEligible: false,
        evidenceBound: false,
      },
      {
        strategyRevisionId: "revision:two",
        dispositionCode: "REVISION_IDENTITY_INVALID",
        outcome: "non_counted",
        countedEligible: false,
        evidenceBound: false,
      },
    ],
  },
  activation: {
    activationId: "activation:phase260:plan14:production",
    state: "active-v1.19-finalized",
    revision: 2,
    activeSelectionRoot: hash("c"),
    parentCommitSha: "1".repeat(40),
    commitSha: "2".repeat(40),
    treeSha: "3".repeat(40),
    proofDigest: hash("d"),
    selectorManifestRoot: hash("e"),
    selectorCount: 5,
    pendingIntent: false,
    compensation: false,
    postactivationPassed: true,
  },
  recovery: {
    productionHistory: ["bootstrap", "prepared", "finalized"],
    rollbackDrillPassed: true,
    preparedFailClosed: true,
    dirtyFilesFailClosed: true,
    committedUnfinalizedRecoverable: true,
    finalizeRetryIdempotent: true,
    exactAbortIdempotent: true,
    compensationBound: true,
  },
  history: {
    validV14GameplayPreserved: true,
    historicalV117Immutable: true,
    transitionAuthorityCount: 1,
    replayReconstructionEquivalent: true,
    noExperimentalRulesActivated: true,
  },
  privacy: {
    publicSafe: true,
    forbiddenFieldCount: 0,
    sourceBytesIncluded: false,
    artifactBytesIncluded: false,
    memoriesIncluded: false,
    objectivesIncluded: false,
    diagnosticsIncluded: false,
    hostDataIncluded: false,
  },
  protectedBaseline: {
    status: "verified",
    protectedPathCount: 2,
    baselineSha256: hash("f"),
  },
  gates: V137_PHASE260_GATE_IDS.map((id) => ({
    id,
    status: "passed" as const,
    command: `pnpm ${id}`,
    exitCode: 0 as const,
    stdoutSha256: hash("1"),
    stderrSha256: hash("0"),
  })),
  limitations: [
    "cycle-start-backstab-simplification-deferred",
    "post-advance-hold-simplification-deferred",
    "experimental-rules-deferred",
  ],
})

describe("Phase 260 truthful-input and Set-fairness proof", () => {
  it("accepts one complete exact proof", () => {
    expect(validateV137TruthfulInputsSetFairnessProof(createProof())).toEqual([])
  })

  it("rejects missing, extra, reordered, or false requirement and decision coverage", () => {
    const mutations = [
      (proof: V137TruthfulInputsSetFairnessProof) => proof.requirements.pop(),
      (proof: V137TruthfulInputsSetFairnessProof) => proof.decisions.reverse(),
      (proof: V137TruthfulInputsSetFairnessProof) => {
        proof.requirements[0]!.status = "missing" as "proved"
      },
      (proof: V137TruthfulInputsSetFairnessProof) => {
        ;(proof as unknown as Record<string, unknown>).extra = true
      },
    ]
    for (const mutate of mutations) {
      const proof = createProof()
      mutate(proof)
      expect(validateV137TruthfulInputsSetFairnessProof(proof)).not.toEqual([])
    }
  })

  it("rejects mixed authority, partial fairness, and untruthful observations", () => {
    const mutations = [
      (proof: V137TruthfulInputsSetFairnessProof) => {
        proof.authority.runtimeAbiVersion = "strategy-runtime-abi-v1.17" as "strategy-runtime-abi-v1.19"
      },
      (proof: V137TruthfulInputsSetFairnessProof) => {
        proof.observations.hasAdvancedThisActivationAuthoritative = false
      },
      (proof: V137TruthfulInputsSetFairnessProof) => {
        proof.arenas.duplicateActiveGeometryCount = 1
      },
      (proof: V137TruthfulInputsSetFairnessProof) => {
        proof.setFairness.conditionCount = 3 as 4
      },
      (proof: V137TruthfulInputsSetFairnessProof) => {
        proof.setFairness.seedCarriesFairnessSemantics = true as false
      },
      (proof: V137TruthfulInputsSetFairnessProof) => {
        proof.setFairness.partialMatrixCounts = true as false
      },
    ]
    for (const mutate of mutations) {
      const proof = createProof()
      mutate(proof)
      expect(validateV137TruthfulInputsSetFairnessProof(proof)).not.toEqual([])
    }
  })

  it("rejects incomplete, reused, synthetic, or substituted language evidence", () => {
    const mutations = [
      (proof: V137TruthfulInputsSetFairnessProof) => proof.conformance.lanes.pop(),
      (proof: V137TruthfulInputsSetFairnessProof) => proof.conformance.lanes[0]!.runs.pop(),
      (proof: V137TruthfulInputsSetFairnessProof) => {
        proof.conformance.lanes[0]!.runs[0]!.syntheticEvidence = true as false
      },
      (proof: V137TruthfulInputsSetFairnessProof) => {
        proof.conformance.noOldEvidenceReuse = false
      },
      (proof: V137TruthfulInputsSetFairnessProof) => {
        proof.conformance.lanes[1]!.languageId = "typescript" as "python"
      },
    ]
    for (const mutate of mutations) {
      const proof = createProof()
      mutate(proof)
      expect(validateV137TruthfulInputsSetFairnessProof(proof)).not.toEqual([])
    }
  })

  it("rejects revision eligibility without exact evidence and activation/recovery drift", () => {
    const mutations = [
      (proof: V137TruthfulInputsSetFairnessProof) => {
        proof.revisions.records[0]!.countedEligible = true
      },
      (proof: V137TruthfulInputsSetFairnessProof) => {
        proof.revisions.crossRevisionSubstitutionRejected = false
      },
      (proof: V137TruthfulInputsSetFairnessProof) => {
        proof.activation.pendingIntent = true as false
      },
      (proof: V137TruthfulInputsSetFairnessProof) => {
        proof.activation.selectorCount = 4 as 5
      },
      (proof: V137TruthfulInputsSetFairnessProof) => {
        proof.recovery.productionHistory = ["bootstrap", "finalized"]
      },
      (proof: V137TruthfulInputsSetFairnessProof) => {
        proof.recovery.committedUnfinalizedRecoverable = false
      },
    ]
    for (const mutate of mutations) {
      const proof = createProof()
      mutate(proof)
      expect(validateV137TruthfulInputsSetFairnessProof(proof)).not.toEqual([])
    }
  })

  it("rejects stale hashes, missing gates, history drift, and private material", () => {
    const mutations = [
      (proof: V137TruthfulInputsSetFairnessProof) => {
        proof.inputs[0]!.sha256 = "not-a-hash"
      },
      (proof: V137TruthfulInputsSetFairnessProof) => proof.gates.pop(),
      (proof: V137TruthfulInputsSetFairnessProof) => {
        proof.history.validV14GameplayPreserved = false
      },
      (proof: V137TruthfulInputsSetFairnessProof) => {
        proof.privacy.sourceBytesIncluded = true as false
      },
      (proof: V137TruthfulInputsSetFairnessProof) => {
        ;(proof.gates[0] as unknown as Record<string, unknown>).diagnostics = "private"
      },
    ]
    for (const mutate of mutations) {
      const proof = createProof()
      mutate(proof)
      expect(validateV137TruthfulInputsSetFairnessProof(proof)).not.toEqual([])
    }
  })
})
