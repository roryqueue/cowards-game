import { execFileSync } from "node:child_process"
import { createHash } from "node:crypto"
import { closeSync, constants, existsSync, fsyncSync, openSync, readFileSync, unlinkSync, writeSync } from "node:fs"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import ts from "typescript"
import { LEAN_AUTHORITY_FALSE, buildLeanSchedule, createLeanManifest, currentFormationIsRealistic, deriveAndValidateLeanTerminal, hashLeanValue, reduceLeanExecutions, validateLeanManifest, type LeanManifest, type LeanTerminal } from "./lib/v1-38-lean-runner-feasibility.js"
import {
  LEAN_CONTAINER_ADAPTER_ID,
  LEAN_CONTAINER_CONTROLS,
  LEAN_CONTAINER_IMAGE,
  LEAN_CONTAINER_METHOD_CEILINGS,
  LEAN_CONTAINER_STARTUP_CLEANUP_MARGIN_MS,
  LEAN_CELL_DEADLINE_MS,
  runActualLeanContainerPreflight,
  type LeanContainerPreflightEvidence,
} from "./run-v1-38-lean-runner-feasibility.js"

export const LEAN_ARTIFACT_PATHS = Object.freeze({
  manifest: ".planning/artifacts/v1.38-lean-runner-manifest.json",
  sourceReview: ".planning/artifacts/v1.38-lean-runner-source-review-v3.json",
  readiness: ".planning/artifacts/v1.38-lean-runner-readiness-v3.json",
  invocation: ".planning/artifacts/v1.38-lean-runner-invocation-v1.json",
  terminal: ".planning/artifacts/v1.38-lean-runner-terminal.json",
  adjudication: ".planning/artifacts/v1.38-lean-runner-adjudication-v1.json",
  eligibility: ".planning/artifacts/v1.38-phase-262-lean-eligibility-v1.json",
} as const)
export const LEAN_DIAGNOSTIC_CUSTODY_PATH = ".planning/artifacts/v1.38-lean-runner-diagnostic-custody-v1.json" as const
export const LEAN_CORRECTIVE_CHILD_OWNERSHIP_PATH = ".v138-lean-corrective-child-ownership.json" as const
export const LEAN_CORRECTIVE_V1_ARTIFACT_PATHS = Object.freeze({
  manifest: ".planning/artifacts/v1.38-lean-runner-corrective-source-manifest-v1.json",
  sourceReview: ".planning/artifacts/v1.38-lean-runner-corrective-source-review-v1.json",
  readiness: ".planning/artifacts/v1.38-lean-runner-corrective-readiness-v1.json",
} as const)
export const LEAN_CORRECTIVE_V2_ARTIFACT_PATHS = Object.freeze({
  manifest: ".planning/artifacts/v1.38-lean-runner-corrective-source-manifest-v2.json",
  sourceReview: ".planning/artifacts/v1.38-lean-runner-corrective-source-review-v2.json",
  readiness: ".planning/artifacts/v1.38-lean-runner-corrective-readiness-v2.json",
} as const)
export const LEAN_CORRECTIVE_V3_ARTIFACT_PATHS = Object.freeze({
  manifest: ".planning/artifacts/v1.38-lean-runner-corrective-source-manifest-v3.json",
  sourceReview: ".planning/artifacts/v1.38-lean-runner-corrective-source-review-v3.json",
  readiness: ".planning/artifacts/v1.38-lean-runner-corrective-readiness-v3.json",
} as const)
export const LEAN_CORRECTIVE_V4_ARTIFACT_PATHS = Object.freeze({
  manifest: ".planning/artifacts/v1.38-lean-runner-corrective-source-manifest-v4.json",
  sourceReview: ".planning/artifacts/v1.38-lean-runner-corrective-source-review-v4.json",
  readiness: ".planning/artifacts/v1.38-lean-runner-corrective-readiness-v4.json",
} as const)
export const LEAN_CORRECTIVE_V5_ARTIFACT_PATHS = Object.freeze({
  manifest: ".planning/artifacts/v1.38-lean-runner-corrective-source-manifest-v5.json",
  sourceReview: ".planning/artifacts/v1.38-lean-runner-corrective-source-review-v5.json",
  readiness: ".planning/artifacts/v1.38-lean-runner-corrective-readiness-v5.json",
} as const)
export const LEAN_CORRECTIVE_V6_ARTIFACT_PATHS = Object.freeze({
  manifest: ".planning/artifacts/v1.38-lean-runner-corrective-source-manifest-v6.json",
  sourceReview: ".planning/artifacts/v1.38-lean-runner-corrective-source-review-v6.json",
  readiness: ".planning/artifacts/v1.38-lean-runner-corrective-readiness-v6.json",
} as const)
export const LEAN_CORRECTIVE_ARTIFACT_PATHS = Object.freeze({
  ...LEAN_CORRECTIVE_V6_ARTIFACT_PATHS,
  invocation: ".planning/artifacts/v1.38-lean-runner-corrective-invocation-v2.json",
  terminal: ".planning/artifacts/v1.38-lean-runner-corrective-terminal-v2.json",
  adjudication: ".planning/artifacts/v1.38-lean-runner-corrective-adjudication-v2.json",
  eligibility: ".planning/artifacts/v1.38-phase-262-lean-corrective-eligibility-v2.json",
} as const)
export const LEAN_DIRECT_ARTIFACT_PATHS = Object.freeze({
  authorization: ".planning/artifacts/v1.38-lean-runner-direct-authorization-v1.json",
  review: ".planning/artifacts/v1.38-lean-runner-direct-validity-review-v1.json",
  invocation: ".planning/artifacts/v1.38-lean-runner-direct-invocation-v1.json",
  terminal: ".planning/artifacts/v1.38-lean-runner-direct-terminal-v1.json",
  adjudication: ".planning/artifacts/v1.38-lean-runner-direct-adjudication-v1.json",
  eligibility: ".planning/artifacts/v1.38-phase-262-lean-direct-eligibility-v1.json",
} as const)
export const LEAN_DIRECT_V2_ARTIFACT_PATHS = Object.freeze({
  preflight: ".planning/artifacts/v1.38-lean-runner-container-preflight-v1.json",
  authorization: ".planning/artifacts/v1.38-lean-runner-direct-authorization-v2.json",
  review: ".planning/artifacts/v1.38-lean-runner-direct-validity-review-v2.json",
  invocation: ".planning/artifacts/v1.38-lean-runner-direct-invocation-v2.json",
  terminal: ".planning/artifacts/v1.38-lean-runner-direct-terminal-v2.json",
  adjudication: ".planning/artifacts/v1.38-lean-runner-direct-adjudication-v2.json",
  eligibility: ".planning/artifacts/v1.38-phase-262-lean-direct-eligibility-v2.json",
} as const)
export const LEAN_DIRECT_V3_ARTIFACT_PATHS = Object.freeze({
  preflight: ".planning/artifacts/v1.38-lean-runner-direct-container-preflight-v2.json",
  authorization: ".planning/artifacts/v1.38-lean-runner-direct-authorization-v3.json",
  review: ".planning/artifacts/v1.38-lean-runner-direct-validity-review-v3.json",
  invocation: ".planning/artifacts/v1.38-lean-runner-direct-invocation-v3.json",
  terminal: ".planning/artifacts/v1.38-lean-runner-direct-terminal-v3.json",
  adjudication: ".planning/artifacts/v1.38-lean-runner-direct-adjudication-v3.json",
  eligibility: ".planning/artifacts/v1.38-phase-262-lean-direct-eligibility-v3.json",
} as const)
export const LEAN_DIRECT_V4_ARTIFACT_PATHS = Object.freeze({
  preflight: ".planning/artifacts/v1.38-lean-runner-direct-container-preflight-v3.json",
  authorization: ".planning/artifacts/v1.38-lean-runner-direct-authorization-v4.json",
  review: ".planning/artifacts/v1.38-lean-runner-direct-validity-review-v4.json",
  invocation: ".planning/artifacts/v1.38-lean-runner-direct-invocation-v4.json",
  terminal: ".planning/artifacts/v1.38-lean-runner-direct-terminal-v4.json",
  adjudication: ".planning/artifacts/v1.38-lean-runner-direct-adjudication-v4.json",
  eligibility: ".planning/artifacts/v1.38-phase-262-lean-direct-eligibility-v4.json",
} as const)
export const LEAN_DIRECT_V5_ARTIFACT_PATHS = Object.freeze({
  preflight: ".planning/artifacts/v1.38-lean-runner-direct-container-preflight-v4.json",
  authorization: ".planning/artifacts/v1.38-lean-runner-direct-authorization-v5.json",
  review: ".planning/artifacts/v1.38-lean-runner-direct-validity-review-v5.json",
  invocation: ".planning/artifacts/v1.38-lean-runner-direct-invocation-v5.json",
  terminal: ".planning/artifacts/v1.38-lean-runner-direct-terminal-v5.json",
  adjudication: ".planning/artifacts/v1.38-lean-runner-direct-adjudication-v5.json",
  eligibility: ".planning/artifacts/v1.38-phase-262-lean-direct-eligibility-v5.json",
} as const)
export const LEAN_DIRECT_V6_ARTIFACT_PATHS = Object.freeze({
  preflight: ".planning/artifacts/v1.38-lean-runner-direct-container-preflight-v5.json",
  authorization: ".planning/artifacts/v1.38-lean-runner-direct-authorization-v6.json",
  review: ".planning/artifacts/v1.38-lean-runner-direct-validity-review-v6.json",
  invocation: ".planning/artifacts/v1.38-lean-runner-direct-invocation-v6.json",
  terminal: ".planning/artifacts/v1.38-lean-runner-direct-terminal-v6.json",
  adjudication: ".planning/artifacts/v1.38-lean-runner-direct-adjudication-v6.json",
  eligibility: ".planning/artifacts/v1.38-phase-262-lean-direct-eligibility-v6.json",
} as const)
export const LEAN_DIRECT_V7_ARTIFACT_PATHS = Object.freeze({
  preflight: ".planning/artifacts/v1.38-lean-runner-direct-container-preflight-v6.json",
  authorization: ".planning/artifacts/v1.38-lean-runner-direct-authorization-v7.json",
  review: ".planning/artifacts/v1.38-lean-runner-direct-validity-review-v7.json",
  invocation: ".planning/artifacts/v1.38-lean-runner-direct-invocation-v7.json",
  terminal: ".planning/artifacts/v1.38-lean-runner-direct-terminal-v7.json",
  adjudication: ".planning/artifacts/v1.38-lean-runner-direct-adjudication-v7.json",
  eligibility: ".planning/artifacts/v1.38-phase-262-lean-direct-eligibility-v7.json",
} as const)
export const LEAN_DIRECT_V8_ARTIFACT_PATHS = Object.freeze({
  preflight: ".planning/artifacts/v1.38-lean-runner-direct-container-preflight-v7.json",
  authorization: ".planning/artifacts/v1.38-lean-runner-direct-authorization-v8.json",
  review: ".planning/artifacts/v1.38-lean-runner-direct-validity-review-v8.json",
  invocation: ".planning/artifacts/v1.38-lean-runner-direct-invocation-v8.json",
  terminal: ".planning/artifacts/v1.38-lean-runner-direct-terminal-v8.json",
  adjudication: ".planning/artifacts/v1.38-lean-runner-direct-adjudication-v8.json",
  eligibility: ".planning/artifacts/v1.38-phase-262-lean-direct-eligibility-v8.json",
} as const)
export const LEAN_DIRECT_V9_ARTIFACT_PATHS = Object.freeze({
  preflight: ".planning/artifacts/v1.38-lean-runner-direct-container-preflight-v8.json",
  authorization: ".planning/artifacts/v1.38-lean-runner-direct-authorization-v9.json",
  review: ".planning/artifacts/v1.38-lean-runner-direct-validity-review-v9.json",
  invocation: ".planning/artifacts/v1.38-lean-runner-direct-invocation-v9.json",
  terminal: ".planning/artifacts/v1.38-lean-runner-direct-terminal-v9.json",
  adjudication: ".planning/artifacts/v1.38-lean-runner-direct-adjudication-v9.json",
  eligibility: ".planning/artifacts/v1.38-phase-262-lean-direct-eligibility-v9.json",
} as const)
export const LEAN_FIRST_INVOCATION_SHA256 = "40725af9f20ae945c19e1a60995e1eac2c51d00ac60453a8ffe42287368f4fa8" as const
export const LEAN_FIRST_TERMINAL_SHA256 = "87adadc50d720c3a7f68be57d26caeab2f001102113060f88d6a96f419bdb2bd" as const
export const LEAN_FIRST_INVOCATION_BLOB = "948a858103a28ad13f2b8497f1cd00d58cd6c2ba" as const
export const LEAN_FIRST_TERMINAL_BLOB = "0a776fd1ec3d967cc063d1ddb8261f4be65c98ac" as const
export const LEAN_FIRST_EVIDENCE_COMMIT = "d8e96b619cde4650a81757789757b88e1833b76e" as const
export const LEAN_HISTORICAL_SOURCE_REVIEW_PATH = ".planning/artifacts/v1.38-lean-runner-source-review-v1.json" as const
export const LEAN_HISTORICAL_SOURCE_REVIEW_SHA256 = "d8fc684745713dacf08e6d09a5c9ea451d145a36006b159bf21e97adbfa4768d" as const
export const LEAN_HISTORICAL_SOURCE_REVIEW_V2_PATH = ".planning/artifacts/v1.38-lean-runner-source-review-v2.json" as const
export const LEAN_HISTORICAL_SOURCE_REVIEW_V2_SHA256 = "1c46efb6bf504982c46304c381705a570687388fbf7bbfc717edf358bd49045b" as const
export const LEAN_HISTORICAL_READINESS_V2_PATH = ".planning/artifacts/v1.38-lean-runner-readiness-v2.json" as const

export const LEAN_MANIFEST_PATH = LEAN_ARTIFACT_PATHS.manifest
export const LEAN_INVOCATION_PATH = LEAN_ARTIFACT_PATHS.invocation
export const LEAN_TERMINAL_PATH = LEAN_ARTIFACT_PATHS.terminal
export const LEAN_READINESS_PATH = LEAN_ARTIFACT_PATHS.readiness
export const LEAN_ADJUDICATION_PATH = LEAN_ARTIFACT_PATHS.adjudication

/** Recursive Git-tree closure: every descendant under runtime/rules owners is bound. */
export const LEAN_EXECUTABLE_CLOSURE_PATHS = Object.freeze([
  "scripts/lib/v1-38-lean-runner-feasibility.ts",
  "scripts/lib/v1-38-lean-runner-feasibility.test.ts",
  "scripts/run-v1-38-lean-runner-feasibility.ts",
  "scripts/run-v1-38-lean-runner-feasibility.test.ts",
  "scripts/check-v1-38-lean-admission.ts",
  "scripts/check-v1-38-lean-admission.test.ts",
  "apps/runtime-service/src",
  "packages/engine/src",
  "packages/persistence/src",
  "packages/replay/src",
  "packages/runtime-js/src",
  "packages/runtime-python/src",
  "packages/runtime-supervisor/src",
  "packages/runtime-wasm-wasi/src",
  "packages/spec/src",
  "apps/runtime-service/package.json",
  "packages/engine/package.json",
  "packages/persistence/package.json",
  "packages/replay/package.json",
  "packages/runtime-js/package.json",
  "packages/runtime-python/package.json",
  "packages/runtime-supervisor/package.json",
  "packages/runtime-wasm-wasi/package.json",
  "packages/spec/package.json",
  "package.json",
  "pnpm-lock.yaml",
  "tsconfig.json",
] as const)
export const LEAN_SOURCE_PATHS = LEAN_EXECUTABLE_CLOSURE_PATHS
export const LEAN_DIRECT_V4_EXECUTABLE_CLOSURE_PATHS = Object.freeze([
  ...LEAN_EXECUTABLE_CLOSURE_PATHS,
  "scripts/lib/v1-38-lean-container-match-session.ts",
  "scripts/lib/v1-38-lean-container-match-session.test.ts",
] as const)

export interface LeanSourceReview {
  readonly schemaVersion: "v1.38-lean-runner-source-review-v3"
  readonly sourceCommit: string
  readonly manifestRoot: `sha256:${string}`
  readonly findingCount: number
  readonly findings: readonly unknown[]
  readonly admitsExecution: false
  readonly authority: typeof LEAN_AUTHORITY_FALSE
}
export interface LeanReviewFinding {
  readonly id: string
  readonly severity: "critical" | "warning"
  readonly status: "open"
  readonly summary: string
}
export interface LeanReadiness {
  readonly schemaVersion: "v1.38-lean-runner-readiness-v3"
  readonly sourceCommit: string
  readonly manifestRoot: `sha256:${string}`
  readonly sourceReviewRoot: `sha256:${string}`
  readonly findingCount: 0
  readonly plan151Eligible: true
  readonly liveInvocationLimit: 1
  readonly liveInvocationsConsumed: 0
  readonly correctiveRerunAuthorized: false
  readonly authority: typeof LEAN_AUTHORITY_FALSE
}
export interface LeanInvocation {
  readonly schemaVersion: "v1.38-lean-runner-invocation-v1"
  readonly sourceCommit: string
  readonly manifestRoot: `sha256:${string}`
  readonly sourceReviewRoot: `sha256:${string}`
  readonly readinessRoot: `sha256:${string}`
  readonly childCapabilityRoot: `sha256:${string}`
  readonly claimClass: "fixture_feasibility_only"
  readonly liveInvocationOrdinal: 1
  readonly authority: typeof LEAN_AUTHORITY_FALSE
}
export interface LeanTerminalArtifact extends Omit<LeanInvocation, "schemaVersion" | "liveInvocationOrdinal" | "claimClass"> {
  readonly schemaVersion: "v1.38-lean-runner-terminal-v1"
  readonly invocationRoot: `sha256:${string}`
  readonly privacy: "safe_aggregate_only"
  readonly terminal: LeanTerminal
}
export interface LeanAdjudication {
  readonly schemaVersion: "v1.38-lean-runner-adjudication-v1"
  readonly terminalRoot: `sha256:${string}`
  readonly reviewedResult: LeanTerminal["result"]
  readonly findingCount: 0
  readonly findings: readonly []
  readonly admitsEligibility: boolean
  readonly authority: typeof LEAN_AUTHORITY_FALSE
}
export interface LeanEligibility {
  readonly schemaVersion: "v1.38-phase-262-lean-eligibility-v1"
  readonly adjudicationRoot: `sha256:${string}`
  readonly admit03: "satisfied_under_revised_contract" | "blocked"
  readonly phase262Complete: boolean
  readonly phase263PlanningEligible: boolean
  readonly phase263ExecutionEligible: boolean
  readonly authority: Readonly<Record<keyof typeof LEAN_AUTHORITY_FALSE, boolean>>
}
export interface LeanDiagnosticCustody {
  readonly schemaVersion: "v1.38-lean-runner-diagnostic-custody-v1"
  readonly claimClass: "diagnostic_inadmissibility_only"
  readonly diagnosticExecutions: 6
  readonly observationBasis: "operator_session_observation"
  readonly rawEvidencePresent: false
  readonly independentlyVerifiable: false
  readonly persisted: false
  readonly liveInvocation: false
  readonly charged: false
  readonly evidenceAdmissible: false
  readonly formationMaterialized: false
  readonly authority: typeof LEAN_AUTHORITY_FALSE
}
export interface LeanDirectAuthorization {
  readonly schemaVersion: "v1.38-lean-runner-direct-authorization-v1"
  readonly claimClass: "fixture_feasibility_only"
  readonly source: LeanManifest["source"]
  readonly plan172Review: {
    readonly path: typeof LEAN_CORRECTIVE_V6_ARTIFACT_PATHS.sourceReview
    readonly root: `sha256:${string}`
    readonly findingCount: 5
    readonly findings: readonly {
      readonly id: "CR-V6-01" | "CR-V6-02" | "CR-V6-03" | "CR-V6-04" | "WR-V6-01"
      readonly severity: "critical" | "warning"
      readonly status: "open"
      readonly disposition: "certification_only_nonblocking_under_D_34L_1"
    }[]
  }
  readonly immutableHistory: {
    readonly firstInvocationRoot: `sha256:${string}`
    readonly firstTerminalRoot: `sha256:${string}`
    readonly firstAdjudicationRoot: `sha256:${string}`
    readonly diagnosisCustodyRoot: `sha256:${string}`
    readonly arenaAliasFixCommit: string
    readonly terrainProjectionFixCommit: string
  }
  readonly selectedTuple: LeanManifest["selectedTuple"]
  readonly fixtures: LeanManifest["fixtures"]
  readonly arenas: readonly {
    readonly declaredArenaId: string
    readonly executionArenaId: string
    readonly semanticGeometryHash: `sha256:${string}`
  }[]
  readonly schedule: {
    readonly root: `sha256:${string}`
    readonly uniqueCells: 12
    readonly passes: readonly ["A", "B"]
    readonly chargedMatches: 24
    readonly sides: readonly ["starter_bottom", "starter_top"]
    readonly initiativeParities: readonly ["bottom", "top"]
  }
  readonly formation: LeanManifest["formation"]
  readonly runtimeLimitsRoot: `sha256:${string}`
  readonly normalization: LeanManifest["normalization"]
  readonly deadlineMilliseconds: 900000
  readonly privacy: "safe_aggregate_only"
  readonly historicalFullMatrix: LeanManifest["historicalFullMatrix"]
  readonly successorLockCount: 36
  readonly invocations: {
    readonly allowed: 1
    readonly consumed: 0
    readonly recoveryAuthorized: false
    readonly partialReuseAuthorized: false
    readonly relaunchAuthorized: false
  }
  readonly freshEffects: Readonly<Record<"reviewPresent" | "invocationPresent" | "terminalPresent" | "adjudicationPresent" | "eligibilityPresent", false>>
  readonly authority: typeof LEAN_AUTHORITY_FALSE
}

export const LEAN_DIRECT_VALIDITY_CATEGORIES = Object.freeze([
  "source_or_dirty_byte_drift",
  "multiple_launch",
  "tuple_or_schedule_drift",
  "supervised_runtime_escape",
  "partial_interrupted_or_unclean_evidence",
  "private_data_disclosure",
  "non_pass_authority",
] as const)
export interface LeanDirectValidityReview {
  readonly schemaVersion: "v1.38-lean-runner-direct-validity-review-v1"
  readonly authorizationRoot: `sha256:${string}`
  readonly sourceCommit: string
  readonly sourceTree: string
  readonly categories: readonly {
    readonly category: typeof LEAN_DIRECT_VALIDITY_CATEGORIES[number]
    readonly status: "pass" | "finding"
    readonly evidence: string
  }[]
  readonly blockingFindingCount: number
  readonly certificationOnlyHistory: LeanDirectAuthorization["plan172Review"]["findings"]
  readonly admitsPlan175: boolean
  readonly authority: typeof LEAN_AUTHORITY_FALSE
}
export interface LeanDirectInvocation {
  readonly schemaVersion: "v1.38-lean-runner-direct-invocation-v1"
  readonly authorizationRoot: `sha256:${string}`
  readonly validityReviewRoot: `sha256:${string}`
  readonly sourceCommit: string
  readonly childCapabilityRoot: `sha256:${string}`
  readonly claimClass: "fixture_feasibility_only"
  readonly invocationOrdinal: 1
  readonly authority: typeof LEAN_AUTHORITY_FALSE
}
export interface LeanDirectTerminalArtifact {
  readonly schemaVersion: "v1.38-lean-runner-direct-terminal-v1"
  readonly authorizationRoot: `sha256:${string}`
  readonly validityReviewRoot: `sha256:${string}`
  readonly sourceCommit: string
  readonly childCapabilityRoot: `sha256:${string}`
  readonly invocationRoot: `sha256:${string}`
  readonly privacy: "safe_aggregate_only"
  readonly terminal: LeanTerminal
  readonly authority: typeof LEAN_AUTHORITY_FALSE
}
export interface LeanDirectAdjudication {
  readonly schemaVersion: "v1.38-lean-runner-direct-adjudication-v1"
  readonly invocationRoot: `sha256:${string}`
  readonly terminalRoot: `sha256:${string}` | null
  readonly reviewedResult: LeanTerminal["result"]
  readonly markerOnly: boolean
  readonly opportunityConsumed: true
  readonly findingCount: 0
  readonly findings: readonly []
  readonly admitsEligibility: boolean
  readonly authority: typeof LEAN_AUTHORITY_FALSE
}
export interface LeanDirectEligibility {
  readonly schemaVersion: "v1.38-phase-262-lean-direct-eligibility-v1"
  readonly adjudicationRoot: `sha256:${string}`
  readonly admit03: "satisfied_under_revised_contract" | "blocked"
  readonly phase262Complete: boolean
  readonly phase263PlanningEligible: boolean
  readonly phase263ExecutionEligible: boolean
  readonly authority: Readonly<Record<keyof typeof LEAN_AUTHORITY_FALSE, boolean>>
}
export interface LeanContainerPreflightArtifact {
  readonly schemaVersion: "v1.38-lean-runner-container-preflight-v1"
  readonly sourceCommit: string
  readonly sourceTree: string
  readonly executableClosureRoot: `sha256:${string}`
  readonly preflight: LeanContainerPreflightEvidence
  readonly consuming: false
  readonly matchInvocations: 0
  readonly authority: typeof LEAN_AUTHORITY_FALSE
}
export interface LeanDirectAuthorizationV2 extends Omit<LeanDirectAuthorization, "schemaVersion"> {
  readonly schemaVersion: "v1.38-lean-runner-direct-authorization-v2"
  readonly containerPreflight: {
    readonly path: typeof LEAN_DIRECT_V2_ARTIFACT_PATHS.preflight
    readonly root: `sha256:${string}`
  }
  readonly runtimeBoundary: {
    readonly registryAdapterId: "runtime-js-container-subprocess"
    readonly serviceAdapterId: typeof LEAN_CONTAINER_ADAPTER_ID
    readonly image: typeof LEAN_CONTAINER_IMAGE
    readonly controlsRoot: `sha256:${string}`
    readonly methodCeilings: typeof LEAN_CONTAINER_METHOD_CEILINGS
    readonly startupCleanupMarginMilliseconds: typeof LEAN_CONTAINER_STARTUP_CLEANUP_MARGIN_MS
    readonly cellDeadlineMilliseconds: typeof LEAN_CELL_DEADLINE_MS
    readonly outerDeadlineMilliseconds: 900000
  }
  readonly plan174History: {
    readonly authorizationPath: typeof LEAN_DIRECT_ARTIFACT_PATHS.authorization
    readonly authorizationRoot: `sha256:${string}`
    readonly reviewPath: typeof LEAN_DIRECT_ARTIFACT_PATHS.review
    readonly reviewRoot: `sha256:${string}`
    readonly status: "denied_preserved"
    readonly resolvedByNewSource: readonly ["CR-01", "CR-02"]
  }
}
export interface LeanDirectValidityReviewV2 {
  readonly schemaVersion: "v1.38-lean-runner-direct-validity-review-v2"
  readonly authorizationRoot: `sha256:${string}`
  readonly preflightRoot: `sha256:${string}`
  readonly sourceCommit: string
  readonly sourceTree: string
  readonly categories: LeanDirectValidityReview["categories"]
  readonly blockingFindingCount: number
  readonly certificationOnlyHistory: LeanDirectAuthorization["plan172Review"]["findings"]
  readonly admitsPlan179: boolean
  readonly authority: typeof LEAN_AUTHORITY_FALSE
}
export interface LeanDirectInvocationV2 {
  readonly schemaVersion: "v1.38-lean-runner-direct-invocation-v2"
  readonly authorizationRoot: `sha256:${string}`
  readonly validityReviewRoot: `sha256:${string}`
  readonly preflightRoot: `sha256:${string}`
  readonly sourceCommit: string
  readonly childCapabilityRoot: `sha256:${string}`
  readonly claimClass: "fixture_feasibility_only"
  readonly invocationOrdinal: 1
  readonly authority: typeof LEAN_AUTHORITY_FALSE
}
export interface LeanDirectTerminalArtifactV2 extends Omit<LeanDirectInvocationV2, "schemaVersion" | "claimClass" | "invocationOrdinal"> {
  readonly schemaVersion: "v1.38-lean-runner-direct-terminal-v2"
  readonly invocationRoot: `sha256:${string}`
  readonly privacy: "safe_aggregate_only"
  readonly terminal: LeanTerminal
}
export type LeanContainerPreflightOutcomeV2 = LeanContainerPreflightEvidence | {
  readonly status: "non_pass"
  readonly reasonCode: "container_preflight_refused"
}
export interface LeanContainerPreflightArtifactV2 {
  readonly schemaVersion: "v1.38-lean-runner-direct-container-preflight-v2"
  readonly sourceCommit: string
  readonly sourceTree: string
  readonly executableClosureRoot: `sha256:${string}`
  readonly preflight: LeanContainerPreflightOutcomeV2
  readonly consuming: false
  readonly preflightInvocations: 1
  readonly matchInvocations: 0
  readonly authority: typeof LEAN_AUTHORITY_FALSE
}
export interface LeanDirectAuthorizationV3 extends Omit<LeanDirectAuthorizationV2, "schemaVersion" | "containerPreflight"> {
  readonly schemaVersion: "v1.38-lean-runner-direct-authorization-v3"
  readonly containerPreflight: {
    readonly path: typeof LEAN_DIRECT_V3_ARTIFACT_PATHS.preflight
    readonly root: `sha256:${string}`
  }
  readonly plan178History: {
    readonly preflightPath: ".planning/artifacts/v1.38-lean-runner-direct-container-preflight-v1.json"
    readonly preflightSha256: `sha256:${string}`
    readonly reviewPath: ".planning/artifacts/v1.38-lean-runner-direct-validity-review-v2.json"
    readonly reviewSha256: `sha256:${string}`
    readonly status: "non_pass_preserved"
  }
}
export interface LeanDirectValidityReviewV3 {
  readonly schemaVersion: "v1.38-lean-runner-direct-validity-review-v3"
  readonly authorizationRoot: `sha256:${string}` | null
  readonly preflightRoot: `sha256:${string}`
  readonly sourceCommit: string
  readonly sourceTree: string
  readonly categories: LeanDirectValidityReview["categories"]
  readonly blockingFindingCount: number
  readonly certificationOnlyHistory: LeanDirectAuthorization["plan172Review"]["findings"]
  readonly admitsPlan175: boolean
  readonly authority: typeof LEAN_AUTHORITY_FALSE
}
export interface LeanDirectInvocationV3 {
  readonly schemaVersion: "v1.38-lean-runner-direct-invocation-v3"
  readonly authorizationRoot: `sha256:${string}`
  readonly validityReviewRoot: `sha256:${string}`
  readonly preflightRoot: `sha256:${string}`
  readonly sourceCommit: string
  readonly childCapabilityRoot: `sha256:${string}`
  readonly claimClass: "fixture_feasibility_only"
  readonly invocationOrdinal: 1
  readonly authority: typeof LEAN_AUTHORITY_FALSE
}
export interface LeanDirectTerminalArtifactV3 extends Omit<LeanDirectInvocationV3, "schemaVersion" | "claimClass" | "invocationOrdinal"> {
  readonly schemaVersion: "v1.38-lean-runner-direct-terminal-v3"
  readonly invocationRoot: `sha256:${string}`
  readonly privacy: "safe_aggregate_only"
  readonly terminal: LeanTerminal
}
export interface LeanContainerPreflightArtifactV3 {
  readonly schemaVersion: "v1.38-lean-runner-direct-container-preflight-v3"
  readonly sourceCommit: string
  readonly sourceTree: string
  readonly executableClosureRoot: `sha256:${string}`
  readonly preflight: LeanContainerPreflightOutcomeV2
  readonly consuming: false
  readonly preflightInvocations: 1
  readonly matchInvocations: 0
  readonly authority: typeof LEAN_AUTHORITY_FALSE
}
export interface LeanDirectAuthorizationV4 extends Omit<LeanDirectAuthorizationV3, "schemaVersion" | "containerPreflight"> {
  readonly schemaVersion: "v1.38-lean-runner-direct-authorization-v4"
  readonly containerPreflight: {
    readonly path: typeof LEAN_DIRECT_V4_ARTIFACT_PATHS.preflight
    readonly root: `sha256:${string}`
  }
  readonly plan180History: {
    readonly preflightPath: typeof LEAN_DIRECT_V3_ARTIFACT_PATHS.preflight
    readonly preflightSha256: `sha256:${string}`
    readonly reviewPath: typeof LEAN_DIRECT_V3_ARTIFACT_PATHS.review
    readonly reviewSha256: `sha256:${string}`
    readonly status: "non_pass_preserved"
  }
}
export interface LeanDirectValidityReviewV4 {
  readonly schemaVersion: "v1.38-lean-runner-direct-validity-review-v4"
  readonly authorizationRoot: `sha256:${string}` | null
  readonly preflightRoot: `sha256:${string}`
  readonly sourceCommit: string
  readonly sourceTree: string
  readonly categories: LeanDirectValidityReview["categories"]
  readonly blockingFindingCount: number
  readonly certificationOnlyHistory: LeanDirectAuthorization["plan172Review"]["findings"]
  readonly admitsPlan175: boolean
  readonly authority: typeof LEAN_AUTHORITY_FALSE
}
export interface LeanDirectInvocationV4 {
  readonly schemaVersion: "v1.38-lean-runner-direct-invocation-v4"
  readonly authorizationRoot: `sha256:${string}`
  readonly validityReviewRoot: `sha256:${string}`
  readonly preflightRoot: `sha256:${string}`
  readonly sourceCommit: string
  readonly childCapabilityRoot: `sha256:${string}`
  readonly claimClass: "fixture_feasibility_only"
  readonly invocationOrdinal: 1
  readonly authority: typeof LEAN_AUTHORITY_FALSE
}
export interface LeanDirectTerminalArtifactV4 extends Omit<LeanDirectInvocationV4, "schemaVersion" | "claimClass" | "invocationOrdinal"> {
  readonly schemaVersion: "v1.38-lean-runner-direct-terminal-v4"
  readonly invocationRoot: `sha256:${string}`
  readonly privacy: "safe_aggregate_only"
  readonly terminal: LeanTerminal
}
export interface LeanContainerPreflightArtifactV4 extends Omit<LeanContainerPreflightArtifactV3, "schemaVersion"> {
  readonly schemaVersion: "v1.38-lean-runner-direct-container-preflight-v4"
}
export interface LeanDirectAuthorizationV5 extends Omit<LeanDirectAuthorizationV4, "schemaVersion" | "containerPreflight"> {
  readonly schemaVersion: "v1.38-lean-runner-direct-authorization-v5"
  readonly containerPreflight: { readonly path: typeof LEAN_DIRECT_V5_ARTIFACT_PATHS.preflight; readonly root: `sha256:${string}` }
  readonly plan182History: {
    readonly preflightPath: typeof LEAN_DIRECT_V4_ARTIFACT_PATHS.preflight
    readonly preflightSha256: `sha256:${string}`
    readonly reviewPath: typeof LEAN_DIRECT_V4_ARTIFACT_PATHS.review
    readonly reviewSha256: `sha256:${string}`
    readonly status: "non_pass_preserved"
  }
}
export interface LeanDirectValidityReviewV5 extends Omit<LeanDirectValidityReviewV4, "schemaVersion"> {
  readonly schemaVersion: "v1.38-lean-runner-direct-validity-review-v5"
}
export interface LeanDirectInvocationV5 extends Omit<LeanDirectInvocationV4, "schemaVersion"> {
  readonly schemaVersion: "v1.38-lean-runner-direct-invocation-v5"
}
export interface LeanDirectTerminalArtifactV5 extends Omit<LeanDirectInvocationV5, "schemaVersion" | "claimClass" | "invocationOrdinal"> {
  readonly schemaVersion: "v1.38-lean-runner-direct-terminal-v5"
  readonly invocationRoot: `sha256:${string}`
  readonly privacy: "safe_aggregate_only"
  readonly terminal: LeanTerminal
}
export interface LeanContainerPreflightArtifactV5 extends Omit<LeanContainerPreflightArtifactV4, "schemaVersion"> { readonly schemaVersion: "v1.38-lean-runner-direct-container-preflight-v5" }
export interface LeanDirectAuthorizationV6 extends Omit<LeanDirectAuthorizationV5, "schemaVersion" | "containerPreflight"> {
  readonly schemaVersion: "v1.38-lean-runner-direct-authorization-v6"
  readonly containerPreflight: { readonly path: typeof LEAN_DIRECT_V6_ARTIFACT_PATHS.preflight; readonly root: `sha256:${string}` }
  readonly plan184History: { readonly preflightPath: typeof LEAN_DIRECT_V5_ARTIFACT_PATHS.preflight; readonly preflightSha256: `sha256:${string}`; readonly reviewPath: typeof LEAN_DIRECT_V5_ARTIFACT_PATHS.review; readonly reviewSha256: `sha256:${string}`; readonly status: "non_pass_preserved" }
}
export interface LeanDirectValidityReviewV6 extends Omit<LeanDirectValidityReviewV5, "schemaVersion"> { readonly schemaVersion: "v1.38-lean-runner-direct-validity-review-v6" }
export interface LeanDirectInvocationV6 extends Omit<LeanDirectInvocationV5, "schemaVersion"> { readonly schemaVersion: "v1.38-lean-runner-direct-invocation-v6" }
export interface LeanDirectTerminalArtifactV6 extends Omit<LeanDirectInvocationV6, "schemaVersion" | "claimClass" | "invocationOrdinal"> { readonly schemaVersion: "v1.38-lean-runner-direct-terminal-v6"; readonly invocationRoot: `sha256:${string}`; readonly privacy: "safe_aggregate_only"; readonly terminal: LeanTerminal }
export type LeanContainerPreflightReasonCode =
  | "docker_unavailable"
  | "image_inspect_invalid"
  | "adapter_drift"
  | "fixture_artifact_missing"
  | "probe_failed"
  | "cleanup_incomplete"
  | "evaluation_refused"
  | "unexpected_failure"
export type LeanContainerPreflightOutcomeV4 = LeanContainerPreflightEvidence | { readonly status: "non_pass"; readonly reasonCode: LeanContainerPreflightReasonCode }
export interface LeanContainerPreflightArtifactV6 extends Omit<LeanContainerPreflightArtifactV5, "schemaVersion" | "preflight"> { readonly schemaVersion: "v1.38-lean-runner-direct-container-preflight-v6"; readonly preflight: LeanContainerPreflightOutcomeV4 }
export interface LeanDirectAuthorizationV7 extends Omit<LeanDirectAuthorizationV6, "schemaVersion" | "containerPreflight"> {
  readonly schemaVersion: "v1.38-lean-runner-direct-authorization-v7"
  readonly containerPreflight: { readonly path: typeof LEAN_DIRECT_V7_ARTIFACT_PATHS.preflight; readonly root: `sha256:${string}` }
  readonly plan186History: { readonly preflightPath: typeof LEAN_DIRECT_V6_ARTIFACT_PATHS.preflight; readonly preflightSha256: `sha256:${string}`; readonly reviewPath: typeof LEAN_DIRECT_V6_ARTIFACT_PATHS.review; readonly reviewSha256: `sha256:${string}`; readonly status: "non_pass_preserved" }
}
export interface LeanDirectValidityReviewV7 extends Omit<LeanDirectValidityReviewV6, "schemaVersion"> { readonly schemaVersion: "v1.38-lean-runner-direct-validity-review-v7" }
export interface LeanDirectInvocationV7 extends Omit<LeanDirectInvocationV6, "schemaVersion"> { readonly schemaVersion: "v1.38-lean-runner-direct-invocation-v7" }
export interface LeanDirectTerminalArtifactV7 extends Omit<LeanDirectInvocationV7, "schemaVersion" | "claimClass" | "invocationOrdinal"> { readonly schemaVersion: "v1.38-lean-runner-direct-terminal-v7"; readonly invocationRoot: `sha256:${string}`; readonly privacy: "safe_aggregate_only"; readonly terminal: LeanTerminal }
export interface LeanContainerPreflightArtifactV7 extends Omit<LeanContainerPreflightArtifactV6, "schemaVersion"> { readonly schemaVersion: "v1.38-lean-runner-direct-container-preflight-v7" }
export interface LeanDirectAuthorizationV8 extends Omit<LeanDirectAuthorizationV7, "schemaVersion" | "containerPreflight"> {
  readonly schemaVersion: "v1.38-lean-runner-direct-authorization-v8"
  readonly containerPreflight: { readonly path: typeof LEAN_DIRECT_V8_ARTIFACT_PATHS.preflight; readonly root: `sha256:${string}` }
  readonly plan188History: { readonly preflightPath: typeof LEAN_DIRECT_V7_ARTIFACT_PATHS.preflight; readonly preflightSha256: `sha256:${string}`; readonly reviewPath: typeof LEAN_DIRECT_V7_ARTIFACT_PATHS.review; readonly reviewSha256: `sha256:${string}`; readonly diagnosisPath: string; readonly diagnosisSha256: `sha256:${string}`; readonly status: "non_pass_preserved" }
}
export interface LeanDirectValidityReviewV8 extends Omit<LeanDirectValidityReviewV7, "schemaVersion"> { readonly schemaVersion: "v1.38-lean-runner-direct-validity-review-v8" }
export interface LeanDirectInvocationV8 extends Omit<LeanDirectInvocationV7, "schemaVersion"> { readonly schemaVersion: "v1.38-lean-runner-direct-invocation-v8" }
export interface LeanDirectTerminalArtifactV8 extends Omit<LeanDirectInvocationV8, "schemaVersion" | "claimClass" | "invocationOrdinal"> { readonly schemaVersion: "v1.38-lean-runner-direct-terminal-v8"; readonly invocationRoot: `sha256:${string}`; readonly privacy: "safe_aggregate_only"; readonly terminal: LeanTerminal }
export interface LeanContainerPreflightArtifactV8 extends Omit<LeanContainerPreflightArtifactV7, "schemaVersion"> { readonly schemaVersion: "v1.38-lean-runner-direct-container-preflight-v8" }
export interface LeanDirectAuthorizationV9 extends Omit<LeanDirectAuthorizationV8, "schemaVersion" | "containerPreflight"> {
  readonly schemaVersion: "v1.38-lean-runner-direct-authorization-v9"
  readonly containerPreflight: { readonly path: typeof LEAN_DIRECT_V9_ARTIFACT_PATHS.preflight; readonly root: `sha256:${string}` }
  readonly plan190History: { readonly preflightPath: typeof LEAN_DIRECT_V8_ARTIFACT_PATHS.preflight; readonly preflightSha256: `sha256:${string}`; readonly reviewPath: typeof LEAN_DIRECT_V8_ARTIFACT_PATHS.review; readonly reviewSha256: `sha256:${string}`; readonly status: "non_pass_preserved" }
}
export interface LeanDirectValidityReviewV9 extends Omit<LeanDirectValidityReviewV8, "schemaVersion"> { readonly schemaVersion: "v1.38-lean-runner-direct-validity-review-v9" }
export interface LeanDirectInvocationV9 extends Omit<LeanDirectInvocationV8, "schemaVersion"> { readonly schemaVersion: "v1.38-lean-runner-direct-invocation-v9" }
export interface LeanDirectTerminalArtifactV9 extends Omit<LeanDirectInvocationV9, "schemaVersion" | "claimClass" | "invocationOrdinal"> { readonly schemaVersion: "v1.38-lean-runner-direct-terminal-v9"; readonly invocationRoot: `sha256:${string}`; readonly privacy: "safe_aggregate_only"; readonly terminal: LeanTerminal }
export interface LeanCorrectiveSourceReview {
  readonly schemaVersion: "v1.38-lean-runner-corrective-source-review-v1"
  readonly sourceCommit: string
  readonly manifestRoot: `sha256:${string}`
  readonly findingCount: number
  readonly findings: readonly LeanReviewFinding[]
  readonly admitsExecution: false
  readonly authority: typeof LEAN_AUTHORITY_FALSE
}
export interface LeanCorrectiveReadiness {
  readonly schemaVersion: "v1.38-lean-runner-corrective-readiness-v3" | "v1.38-lean-runner-corrective-readiness-v4" | "v1.38-lean-runner-corrective-readiness-v5" | "v1.38-lean-runner-corrective-readiness-v6"
  readonly sourceCommit: string
  readonly manifestRoot: `sha256:${string}`
  readonly sourceReviewRoot: `sha256:${string}`
  readonly findingCount: 0
  readonly plan158Eligible: true
  readonly correctiveInvocationLimit: 1
  readonly correctiveInvocationsConsumed: 0
  readonly recoveryOnlyLimit: 1
  readonly authority: typeof LEAN_AUTHORITY_FALSE
}
export interface LeanCorrectiveManifestV4 extends Omit<LeanManifest, "schemaVersion"> {
  readonly schemaVersion: "v1.38-lean-runner-corrective-source-manifest-v4"
  readonly plan165Summary: { readonly commit: string, readonly blob: string, readonly contentRoot: `sha256:${string}` }
  readonly predecessorRoots: {
    readonly failedManifestV1Root: `sha256:${string}`
    readonly failedReviewV1Root: `sha256:${string}`
    readonly failedManifestV2Root: `sha256:${string}`
    readonly failedReviewV2Root: `sha256:${string}`
    readonly failedManifestV3Root: `sha256:${string}`
    readonly failedReviewV3Root: `sha256:${string}`
    readonly firstInvocationRoot: `sha256:${string}`
    readonly firstTerminalRoot: `sha256:${string}`
    readonly diagnosticCustodyRoot: `sha256:${string}`
  }
  readonly successorLockCount: 36
  readonly freshCorrectiveEffects: LeanCorrectiveFreshEffects
}
export interface LeanCorrectiveFreshEffects {
  readonly readinessV4Present: boolean
  readonly invocationV2Present: boolean
  readonly terminalV2Present: boolean
  readonly adjudicationV2Present: boolean
  readonly eligibilityV2Present: boolean
  readonly childOwnershipPresent: boolean
}
export interface LeanCorrectiveSourceReviewV4 {
  readonly schemaVersion: "v1.38-lean-runner-corrective-source-review-v4"
  readonly sourceCommit: string
  readonly sourceTree: string
  readonly manifestRoot: `sha256:${string}`
  readonly findingCount: number
  readonly findings: readonly LeanReviewFinding[]
  readonly admitsExecution: false
  readonly authority: typeof LEAN_AUTHORITY_FALSE
}
export interface LeanCorrectiveFreshEffectsV5 {
  readonly readinessV5Present: boolean
  readonly invocationV2Present: boolean
  readonly terminalV2Present: boolean
  readonly adjudicationV2Present: boolean
  readonly eligibilityV2Present: boolean
  readonly childOwnershipPresent: boolean
}
export interface LeanCorrectiveManifestV5 extends Omit<LeanManifest, "schemaVersion"> {
  readonly schemaVersion: "v1.38-lean-runner-corrective-source-manifest-v5"
  readonly plan165Summary: { readonly commit: string, readonly blob: string, readonly contentRoot: `sha256:${string}` }
  readonly predecessorRoots: LeanCorrectiveManifestV4["predecessorRoots"] & {
    readonly failedManifestV4Root: `sha256:${string}`
    readonly failedReviewV4Root: `sha256:${string}`
  }
  readonly successorLockCount: 36
  readonly freshCorrectiveEffects: LeanCorrectiveFreshEffectsV5
}
export interface LeanCorrectiveSourceReviewV5 {
  readonly schemaVersion: "v1.38-lean-runner-corrective-source-review-v5"
  readonly sourceCommit: string
  readonly sourceTree: string
  readonly manifestRoot: `sha256:${string}`
  readonly findingCount: number
  readonly findings: readonly LeanReviewFinding[]
  readonly admitsExecution: false
  readonly authority: typeof LEAN_AUTHORITY_FALSE
}
export interface LeanCorrectiveFreshEffectsV6 {
  readonly readinessV6Present: boolean
  readonly invocationV2Present: boolean
  readonly terminalV2Present: boolean
  readonly adjudicationV2Present: boolean
  readonly eligibilityV2Present: boolean
  readonly childOwnershipPresent: boolean
}
export interface LeanCorrectiveManifestV6 extends Omit<LeanManifest, "schemaVersion"> {
  readonly schemaVersion: "v1.38-lean-runner-corrective-source-manifest-v6"
  readonly plan169Summary: { readonly commit: string, readonly blob: string, readonly contentRoot: `sha256:${string}` }
  readonly predecessorRoots: LeanCorrectiveManifestV5["predecessorRoots"] & {
    readonly failedManifestV5Root: `sha256:${string}`
    readonly failedReviewV5Root: `sha256:${string}`
  }
  readonly successorLockCount: 36
  readonly freshCorrectiveEffects: LeanCorrectiveFreshEffectsV6
}
export interface LeanCorrectiveSourceReviewV6 {
  readonly schemaVersion: "v1.38-lean-runner-corrective-source-review-v6"
  readonly sourceCommit: string
  readonly sourceTree: string
  readonly manifestRoot: `sha256:${string}`
  readonly findingCount: number
  readonly findings: readonly LeanReviewFinding[]
  readonly admitsExecution: false
  readonly authority: typeof LEAN_AUTHORITY_FALSE
}
export interface LeanCorrectiveManifestV3 extends Omit<LeanManifest, "schemaVersion"> {
  readonly schemaVersion: "v1.38-lean-runner-corrective-source-manifest-v3"
  readonly predecessorRoots: {
    readonly failedManifestV1Root: `sha256:${string}`
    readonly failedReviewV1Root: `sha256:${string}`
    readonly failedManifestV2Root: `sha256:${string}`
    readonly failedReviewV2Root: `sha256:${string}`
    readonly firstInvocationRoot: `sha256:${string}`
    readonly firstTerminalRoot: `sha256:${string}`
    readonly diagnosticCustodyRoot: `sha256:${string}`
  }
  readonly successorLockCount: 36
  readonly freshCorrectiveEffects: {
    readonly readinessV3Present: false
    readonly invocationV2Present: false
    readonly terminalV2Present: false
    readonly adjudicationV2Present: false
    readonly eligibilityV2Present: false
    readonly childOwnershipPresent: false
  }
}
export interface LeanCorrectiveSourceReviewV3 {
  readonly schemaVersion: "v1.38-lean-runner-corrective-source-review-v3"
  readonly sourceCommit: string
  readonly sourceTree: string
  readonly manifestRoot: `sha256:${string}`
  readonly findingCount: number
  readonly findings: readonly LeanReviewFinding[]
  readonly admitsExecution: false
  readonly authority: typeof LEAN_AUTHORITY_FALSE
}
export interface LeanCorrectiveInterruptionTombstone extends Omit<LeanCorrectiveInvocation, "schemaVersion" | "correctiveInvocationOrdinal" | "claimClass"> {
  readonly schemaVersion: "v1.38-lean-runner-corrective-interruption-tombstone-v1"
  readonly invocationRoot: `sha256:${string}`
  readonly result: "invalid"
  readonly recoveryTerminalized: true
  readonly chargedMatches: 0
  readonly successfulMatches: 0
  readonly completeCleanup: true
  readonly formationMaterialized: false
  readonly privacy: "safe_aggregate_only"
}
export interface LeanCorrectiveInvocation {
  readonly schemaVersion: "v1.38-lean-runner-corrective-invocation-v2"
  readonly sourceCommit: string
  readonly manifestRoot: `sha256:${string}`
  readonly sourceReviewRoot: `sha256:${string}`
  readonly readinessRoot: `sha256:${string}`
  readonly firstInvocationRoot: `sha256:${string}`
  readonly firstTerminalRoot: `sha256:${string}`
  readonly diagnosticCustodyRoot: `sha256:${string}`
  readonly childCapabilityRoot: `sha256:${string}`
  readonly claimClass: "fixture_feasibility_only"
  readonly correctiveInvocationOrdinal: 1
  readonly authority: typeof LEAN_AUTHORITY_FALSE
}
export interface LeanCorrectiveTerminalArtifact extends Omit<LeanCorrectiveInvocation, "schemaVersion" | "correctiveInvocationOrdinal" | "claimClass"> {
  readonly schemaVersion: "v1.38-lean-runner-corrective-terminal-v2"
  readonly invocationRoot: `sha256:${string}`
  readonly privacy: "safe_aggregate_only"
  readonly recoveryTerminalized: boolean
  readonly terminal: LeanTerminal
}
export interface LeanCorrectiveChildOwnership {
  readonly schemaVersion: "v1.38-lean-corrective-child-ownership-v1"
  readonly invocationRoot: `sha256:${string}`
  readonly childPid: number
  readonly processGroupId: number
  readonly selector: "--execute-reviewed-cell"
  readonly token: string
  readonly commandArguments: readonly ["--execute-reviewed-cell", string]
}
export interface LeanCorrectiveOrphanRecoveryDependencies {
  readonly expectedInvocationRoot: `sha256:${string}`
  readonly commandForPid: (pid: number) => string | undefined
  readonly processGroupForPid: (pid: number) => number | undefined
  readonly signalProcessGroup: (processGroupId: number, signal: "SIGTERM" | "SIGKILL") => void
  readonly processIsAlive: (pid: number) => boolean
  readonly wait: (milliseconds: number) => Promise<void>
}

const git = (repoRoot: string, args: readonly string[]): string => execFileSync("git", args, { cwd: repoRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim()
const isObject = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value)
const isSha = (value: unknown): value is `sha256:${string}` => typeof value === "string" && /^sha256:[0-9a-f]{64}$/u.test(value)
const isOid = (value: unknown): value is string => typeof value === "string" && /^[0-9a-f]{40}$/u.test(value)
const exactKeys = (value: Record<string, unknown>, keys: readonly string[]): boolean => Object.keys(value).sort().join("\0") === [...keys].sort().join("\0")
const exactFalseAuthority = (value: unknown): boolean => isObject(value) && Object.keys(value).sort().join("\0") === Object.keys(LEAN_AUTHORITY_FALSE).sort().join("\0") && Object.values(value).every((flag) => flag === false)
const exactEligibilityAuthority = (value: unknown, passed: boolean): boolean => isObject(value) && Object.keys(value).sort().join("\0") === Object.keys(LEAN_AUTHORITY_FALSE).sort().join("\0") && Object.entries(value).every(([key, flag]) => flag === (passed && (key === "phase263PlanningAuthorized" || key === "phase263ExecutionAuthorized")))
const assertPrivacySafe = (value: unknown): void => {
  const serialized = JSON.stringify(value)
  if (/strategy(?:Source|Memory)|soldierMemory|objectivePayload|diagnostics|stderr|privateKey|\/Users\/|\/private\/tmp\/|[A-Za-z]:\\/iu.test(serialized)) throw new TypeError("LEAN_PRIVATE_DATA_FORBIDDEN")
}
const readJson = (repoRoot: string, artifactPath: string): unknown => JSON.parse(readFileSync(path.resolve(repoRoot, artifactPath), "utf8"))

export const validateLeanDiagnosticCustody = (value: unknown): LeanDiagnosticCustody => {
  const keys = ["schemaVersion", "claimClass", "diagnosticExecutions", "observationBasis", "rawEvidencePresent", "independentlyVerifiable", "persisted", "liveInvocation", "charged", "evidenceAdmissible", "formationMaterialized", "authority"]
  if (
    !isObject(value) || !exactKeys(value, keys) ||
    value.schemaVersion !== "v1.38-lean-runner-diagnostic-custody-v1" ||
    value.claimClass !== "diagnostic_inadmissibility_only" || value.diagnosticExecutions !== 6 ||
    value.observationBasis !== "operator_session_observation" || value.rawEvidencePresent !== false ||
    value.independentlyVerifiable !== false || value.persisted !== false || value.liveInvocation !== false ||
    value.charged !== false || value.evidenceAdmissible !== false || value.formationMaterialized !== false ||
    !exactFalseAuthority(value.authority)
  ) throw new TypeError("LEAN_DIAGNOSTIC_CUSTODY_INVALID")
  assertPrivacySafe(value)
  return globalThis.structuredClone(value) as unknown as LeanDiagnosticCustody
}

const sha256File = (target: string): string => createHash("sha256").update(readFileSync(target)).digest("hex")
export const checkLeanFirstEvidenceCustody = (repoRoot: string): void => {
  for (const [artifactPath, sha, blob] of [
    [LEAN_ARTIFACT_PATHS.invocation, LEAN_FIRST_INVOCATION_SHA256, LEAN_FIRST_INVOCATION_BLOB],
    [LEAN_ARTIFACT_PATHS.terminal, LEAN_FIRST_TERMINAL_SHA256, LEAN_FIRST_TERMINAL_BLOB],
  ] as const) {
    const target = path.resolve(repoRoot, artifactPath)
    if (sha256File(target) !== sha || git(repoRoot, ["hash-object", artifactPath]) !== blob || git(repoRoot, ["rev-parse", `${LEAN_FIRST_EVIDENCE_COMMIT}:${artifactPath}`]) !== blob) throw new TypeError("LEAN_FIRST_EVIDENCE_DRIFT")
  }
}

const assertCorrectiveFreshDestinationsAbsent = (repoRoot: string, allowed: readonly string[] = []): void => {
  for (const artifactPath of Object.values(LEAN_CORRECTIVE_ARTIFACT_PATHS)) {
    if (!allowed.includes(artifactPath) && existsSync(path.resolve(repoRoot, artifactPath))) throw new TypeError(`LEAN_CORRECTIVE_DESTINATION_EXISTS:${artifactPath}`)
  }
}
export const assertLeanCorrectiveFreshEffectsAbsent = (invocationPresent: boolean, terminalPresent: boolean): void => {
  if (invocationPresent) throw new TypeError("LEAN_CORRECTIVE_INVOCATION_EXISTS")
  if (terminalPresent) throw new TypeError("LEAN_CORRECTIVE_TERMINAL_EXISTS")
}
const assertSuccessorLockInventory = (repoRoot: string): void => {
  const lines = git(repoRoot, ["status", "--short", "--untracked-files=all"]).split("\n").filter((line) => /^\?\? \.v138-successor-[0-9a-f]{64}\.lock$/u.test(line))
  if (lines.length !== 36 || new Set(lines).size !== 36) throw new TypeError("LEAN_SUCCESSOR_LOCK_INVENTORY_DRIFT")
}

export const checkLeanCorrectiveRecoveryOnlyStructure = (
  runnerSource: string,
  checkerSource?: string,
  importedSources: Readonly<Record<string, string>> = {},
): void => {
  const checker = checkerSource ?? readFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), "check-v1-38-lean-admission.ts"), "utf8")
  const moduleSources = new Map<string, string>([
    ["runner", runnerSource],
    ["checker", checker],
    ["./lib/v1-38-lean-runner-feasibility.js", readFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), "lib/v1-38-lean-runner-feasibility.ts"), "utf8")],
    ...Object.entries(importedSources),
  ])
  type FunctionNode = ts.FunctionDeclaration | ts.FunctionExpression | ts.ArrowFunction
  type FunctionTarget = { readonly moduleId: string, readonly node: FunctionNode, readonly identity: string }
  type ImportBinding = { readonly specifier: string, readonly imported: string, readonly namespace: boolean, readonly external: boolean }
  type ModuleIndex = {
    readonly sourceFile: ts.SourceFile
    readonly functions: Map<string, FunctionTarget>
    readonly aliases: Map<string, string>
    readonly imports: Map<string, ImportBinding>
    readonly reexports: Map<string, ImportBinding>
    readonly bindings: Map<string, { readonly kind: "function" | "alias" | "import" | "namespace" | "reexport" | "value", readonly identity: string }>
  }
  type CallbackBinding = FunctionTarget | ReadonlyMap<string, FunctionTarget>
  type ProvenValue =
    | { readonly kind: "string", readonly value: string }
    | { readonly kind: "number", readonly value: number }
    | { readonly kind: "array", readonly values: readonly ProvenValue[] }
    | { readonly kind: "object", readonly entries: Readonly<Record<string, ProvenValue>> }
    | { readonly kind: "symbol", readonly value: string }
    | { readonly kind: "unknown" }
  type PendingTarget = {
    readonly target: FunctionTarget
    readonly bindings: ReadonlyMap<string, CallbackBinding>
    readonly values: ReadonlyMap<string, ProvenValue>
  }

  const forbiddenNames = new Set([
    "fork", "spawn", "spawnSync", "createExclusiveLeanInvocationMarker", "buildLeanSchedule",
    "buildCanonicalLeanRequest", "createCandidateInitialGameState", "createCandidateInitialGameStateV119",
    "executePrepared", "executePreparedRuntimeServiceRequestV118", "runLeanFeasibilityInjected",
    "createSupervisedLeanExecutionDependencies", "prepareLeanCorrectiveInvocation",
  ])
  const inertBareCalls = new Set([
    "Boolean", "Number", "String", "BigInt", "structuredClone", "setTimeout", "clearTimeout",
  ])
  const inertImportedCalls = new Set([
    "createHash", "closeSync", "existsSync", "fsyncSync", "openSync", "readFileSync", "unlinkSync", "writeSync",
    "fileURLToPath", "pathToFileURL", "encodeCanonicalJson",
  ])
  const inertMemberCalls = new Set([
    "Array.isArray", "JSON.parse", "JSON.stringify", "Number.isSafeInteger", "Object.entries", "Object.keys", "Object.values",
    "Buffer.from", "globalThis.structuredClone", "path.dirname", "path.resolve",
  ])
  const inertPrototypeMethods = new Set([
    "add", "at", "digest", "every", "filter", "get", "has", "includes", "indexOf", "join", "map", "set", "slice", "some", "sort",
    "split", "startsWith", "test", "toString", "trim", "update",
  ])
  const scriptKind = ts.ScriptKind.TS
  const indexes = new Map<string, ModuleIndex>()

  const normalizeRelative = (fromModule: string, specifier: string): string => {
    if (!specifier.startsWith(".")) throw new TypeError(`LEAN_CORRECTIVE_RECOVERY_EXTERNAL_MODULE:${specifier}`)
    if (fromModule === "runner" && /check-v1-38-lean-admission\.js$/u.test(specifier)) return "checker"
    const directCandidates = [specifier, specifier.replace(/\.js$/u, ".ts")]
    for (const candidate of directCandidates) if (moduleSources.has(candidate)) return candidate
    const base = fromModule === "runner" || fromModule === "checker" ? "." : path.posix.dirname(fromModule)
    const normalized = path.posix.normalize(path.posix.join(base, specifier))
    const rooted = normalized.startsWith(".") ? normalized : `./${normalized}`
    for (const candidate of [rooted, rooted.replace(/\.js$/u, ".ts"), rooted.replace(/\.ts$/u, ".js")]) {
      if (moduleSources.has(candidate)) return candidate
    }
    throw new TypeError(`LEAN_CORRECTIVE_RECOVERY_UNRESOLVED_CALL:${fromModule}:${specifier}`)
  }

  for (const [moduleId, source] of moduleSources) {
    const sourceFile = ts.createSourceFile(moduleId, source, ts.ScriptTarget.Latest, true, scriptKind)
    const parseDiagnostics = (sourceFile as ts.SourceFile & { readonly parseDiagnostics?: readonly ts.Diagnostic[] }).parseDiagnostics ?? []
    if (parseDiagnostics.length > 0) throw new TypeError(`LEAN_CORRECTIVE_RECOVERY_PARSE_ERROR:${moduleId}`)
    const index: ModuleIndex = { sourceFile, functions: new Map(), aliases: new Map(), imports: new Map(), reexports: new Map(), bindings: new Map() }
    const registerBinding = (name: string, kind: ModuleIndex["bindings"] extends Map<string, infer T> ? T extends { kind: infer K } ? K : never : never, node: ts.Node): void => {
      if (index.bindings.has(name)) throw new TypeError(`LEAN_CORRECTIVE_RECOVERY_AMBIGUOUS_BINDING:${moduleId}:${name}`)
      index.bindings.set(name, { kind, identity: `${moduleId}:${kind}:${name}:${node.pos}:${node.end}` })
    }
    const recordFunction = (name: string, node: FunctionNode): void => {
      registerBinding(name, "function", node)
      index.functions.set(name, { moduleId, node, identity: `${moduleId}:${name}:${node.pos}:${node.end}` })
    }
    for (const statement of sourceFile.statements) {
      if (ts.isFunctionDeclaration(statement)) {
        if (statement.name !== undefined) recordFunction(statement.name.text, statement)
        if (statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.DefaultKeyword) === true) {
          registerBinding("default", "function", statement)
          index.functions.set("default", { moduleId, node: statement, identity: `${moduleId}:default:${statement.pos}:${statement.end}` })
        }
      }
      else if (ts.isVariableStatement(statement)) {
        for (const declaration of statement.declarationList.declarations) {
          if (!ts.isIdentifier(declaration.name) || declaration.initializer === undefined) continue
          if (ts.isArrowFunction(declaration.initializer) || ts.isFunctionExpression(declaration.initializer)) recordFunction(declaration.name.text, declaration.initializer)
          else if (ts.isIdentifier(declaration.initializer)) {
            registerBinding(declaration.name.text, "alias", declaration)
            index.aliases.set(declaration.name.text, declaration.initializer.text)
          } else registerBinding(declaration.name.text, "value", declaration)
        }
      } else if (ts.isImportDeclaration(statement)) {
        if (!ts.isStringLiteral(statement.moduleSpecifier)) throw new TypeError(`LEAN_CORRECTIVE_RECOVERY_DYNAMIC_IMPORT:${moduleId}`)
        const specifier = statement.moduleSpecifier.text
        const clause = statement.importClause
        if (clause === undefined) continue
        const external = !specifier.startsWith(".")
        if (clause.name !== undefined) {
          registerBinding(clause.name.text, "import", clause.name)
          index.imports.set(clause.name.text, { specifier, imported: "default", namespace: false, external })
        }
        if (clause.namedBindings !== undefined && ts.isNamespaceImport(clause.namedBindings)) {
          registerBinding(clause.namedBindings.name.text, "namespace", clause.namedBindings)
          index.imports.set(clause.namedBindings.name.text, { specifier, imported: "*", namespace: true, external })
        }
        if (clause.namedBindings !== undefined && ts.isNamedImports(clause.namedBindings)) {
          for (const element of clause.namedBindings.elements) {
            registerBinding(element.name.text, "import", element)
            index.imports.set(element.name.text, { specifier, imported: element.propertyName?.text ?? element.name.text, namespace: false, external })
          }
        }
      } else if (ts.isExportDeclaration(statement) && statement.exportClause !== undefined && ts.isNamedExports(statement.exportClause) && statement.moduleSpecifier !== undefined && ts.isStringLiteral(statement.moduleSpecifier)) {
        const specifier = statement.moduleSpecifier.text
        for (const element of statement.exportClause.elements) {
          registerBinding(element.name.text, "reexport", element)
          index.reexports.set(element.name.text, { specifier, imported: element.propertyName?.text ?? element.name.text, namespace: false, external: !specifier.startsWith(".") })
        }
      } else if (ts.isExportAssignment(statement) && !statement.isExportEquals && (ts.isArrowFunction(statement.expression) || ts.isFunctionExpression(statement.expression))) {
        recordFunction("default", statement.expression)
      }
    }
    for (const statement of sourceFile.statements) {
      if (!ts.isExpressionStatement(statement) || !ts.isBinaryExpression(statement.expression) || !ts.isIdentifier(statement.expression.left)) continue
      if (statement.expression.operatorToken.kind >= ts.SyntaxKind.FirstAssignment && statement.expression.operatorToken.kind <= ts.SyntaxKind.LastAssignment && index.bindings.has(statement.expression.left.text)) throw new TypeError(`LEAN_CORRECTIVE_RECOVERY_REBINDING:${moduleId}:${statement.expression.left.text}`)
    }
    indexes.set(moduleId, index)
  }

  const resolveFunction = (moduleId: string, name: string, trail = new Set<string>()): FunctionTarget | undefined => {
    const key = `${moduleId}:${name}`
    if (trail.has(key)) throw new TypeError(`LEAN_CORRECTIVE_RECOVERY_AMBIGUOUS_BINDING:${key}`)
    trail.add(key)
    const index = indexes.get(moduleId)
    if (index === undefined) throw new TypeError(`LEAN_CORRECTIVE_RECOVERY_UNRESOLVED_CALL:${moduleId}`)
    const direct = index.functions.get(name)
    if (direct !== undefined) return direct
    const alias = index.aliases.get(name)
    if (alias !== undefined) return resolveFunction(moduleId, alias, trail)
    const binding = index.imports.get(name) ?? index.reexports.get(name)
    if (binding === undefined || binding.namespace) return undefined
    if (binding.external) return undefined
    return resolveFunction(normalizeRelative(moduleId, binding.specifier), binding.imported, trail)
  }

  const targetForInline = (moduleId: string, node: ts.ArrowFunction | ts.FunctionExpression): FunctionTarget => ({
    moduleId, node, identity: `${moduleId}:inline:${node.pos}:${node.end}`,
  })
  const unknownValue: ProvenValue = { kind: "unknown" }
  const localInitializer = (target: FunctionTarget, name: string): ts.Expression | undefined => {
    let initializer: ts.Expression | undefined
    const scan = (node: ts.Node): void => {
      if (node !== target.node.body && (ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node) || ts.isArrowFunction(node))) return
      if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === name && node.initializer !== undefined) {
        if (initializer !== undefined) {
          const securityBinding = (value: ts.Expression): boolean => ts.isArrowFunction(value) || ts.isFunctionExpression(value) || ts.isIdentifier(value) || ts.isObjectLiteralExpression(value)
          if (securityBinding(initializer) || securityBinding(node.initializer)) throw new TypeError(`LEAN_CORRECTIVE_RECOVERY_AMBIGUOUS_BINDING:${target.moduleId}:${name}`)
          return
        }
        initializer = node.initializer
      }
      ts.forEachChild(node, scan)
    }
    scan(target.node.body)
    return initializer
  }
  const topLevelInitializer = (moduleId: string, name: string): ts.Expression | undefined => {
    const sourceFile = indexes.get(moduleId)!.sourceFile
    for (const statement of sourceFile.statements) {
      if (!ts.isVariableStatement(statement)) continue
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name) && declaration.name.text === name) return declaration.initializer
      }
    }
    return undefined
  }
  const proveValue = (
    expression: ts.Expression,
    current: PendingTarget,
    sourceFile: ts.SourceFile,
    trail = new Set<string>(),
  ): ProvenValue => {
    if (ts.isParenthesizedExpression(expression) || ts.isAsExpression(expression) || ts.isTypeAssertionExpression(expression)) return proveValue(expression.expression, current, sourceFile, trail)
    if (ts.isStringLiteral(expression) || ts.isNoSubstitutionTemplateLiteral(expression)) return { kind: "string", value: expression.text }
    if (ts.isNumericLiteral(expression)) return { kind: "number", value: Number(expression.text) }
    if (ts.isPrefixUnaryExpression(expression) && expression.operator === ts.SyntaxKind.MinusToken) {
      const operand = proveValue(expression.operand, current, sourceFile, trail)
      if (operand.kind === "number") return { kind: "number", value: -operand.value }
      if (operand.kind === "symbol") return { kind: "symbol", value: `-${operand.value}` }
      return unknownValue
    }
    if (ts.isArrayLiteralExpression(expression)) {
      const values: ProvenValue[] = []
      for (const element of expression.elements) {
        if (ts.isSpreadElement(element)) {
          const spread = proveValue(element.expression, current, sourceFile, trail)
          if (spread.kind !== "array") return unknownValue
          values.push(...spread.values)
        } else values.push(proveValue(element, current, sourceFile, trail))
      }
      return { kind: "array", values }
    }
    if (ts.isObjectLiteralExpression(expression)) {
      const entries: Record<string, ProvenValue> = {}
      for (const property of expression.properties) {
        if (!ts.isPropertyAssignment(property) || (!ts.isIdentifier(property.name) && !ts.isStringLiteral(property.name))) return unknownValue
        entries[property.name.text] = proveValue(property.initializer, current, sourceFile, trail)
      }
      return { kind: "object", entries }
    }
    if (ts.isIdentifier(expression)) {
      const bound = current.values.get(expression.text)
      if (bound !== undefined) return bound
      const key = `${current.target.identity}:${expression.text}`
      if (trail.has(key)) throw new TypeError(`LEAN_CORRECTIVE_RECOVERY_AMBIGUOUS_BINDING:${expression.text}`)
      const nextTrail = new Set(trail); nextTrail.add(key)
      const initializer = localInitializer(current.target, expression.text)
      if (initializer !== undefined) return proveValue(initializer, current, sourceFile, nextTrail)
      if (current.target.node.parameters.some((parameter) => ts.isIdentifier(parameter.name) && parameter.name.text === expression.text)) return { kind: "symbol", value: `${current.target.identity}#${expression.text}` }
      const topLevel = topLevelInitializer(current.target.moduleId, expression.text)
      if (topLevel !== undefined) return proveValue(topLevel, current, sourceFile, nextTrail)
      return { kind: "symbol", value: `${current.target.moduleId}#${expression.text}` }
    }
    if (ts.isTemplateExpression(expression)) {
      const parts = [expression.head.text]
      for (const span of expression.templateSpans) {
        const value = proveValue(span.expression, current, sourceFile, trail)
        if (value.kind === "unknown" || value.kind === "array" || value.kind === "object") return unknownValue
        parts.push(`\${${value.kind}:${String(value.value)}}`, span.literal.text)
      }
      return { kind: "string", value: parts.join("") }
    }
    if (ts.isCallExpression(expression) && ts.isIdentifier(expression.expression) && expression.expression.text === "String" && expression.arguments.length === 1) {
      const value = proveValue(expression.arguments[0]!, current, sourceFile, trail)
      if (value.kind === "number" || value.kind === "string") return { kind: "string", value: String(value.value) }
      if (value.kind === "symbol") return { kind: "symbol", value: `String(${value.value})` }
    }
    if (ts.isCallExpression(expression) && ts.isPropertyAccessExpression(expression.expression) && expression.expression.getText(sourceFile) === "Object.freeze" && expression.arguments.length === 1) return proveValue(expression.arguments[0]!, current, sourceFile, trail)
    if (ts.isPropertyAccessExpression(expression)) return { kind: "symbol", value: expression.getText(sourceFile) }
    return unknownValue
  }
  const bindArguments = (target: FunctionTarget, args: readonly ts.Expression[], caller: PendingTarget): { readonly callbacks: ReadonlyMap<string, CallbackBinding>, readonly values: ReadonlyMap<string, ProvenValue> } => {
    const bindings = new Map<string, CallbackBinding>()
    const values = new Map<string, ProvenValue>()
    const callerSource = indexes.get(caller.target.moduleId)!.sourceFile
    target.node.parameters.forEach((parameter, index) => {
      if (!ts.isIdentifier(parameter.name)) return
      const argument = args[index]
      if (argument === undefined) return
      values.set(parameter.name.text, proveValue(argument, caller, callerSource))
      if (ts.isArrowFunction(argument) || ts.isFunctionExpression(argument)) bindings.set(parameter.name.text, targetForInline(caller.target.moduleId, argument))
      else if (ts.isObjectLiteralExpression(argument)) {
        const callbacks = new Map<string, FunctionTarget>()
        for (const property of argument.properties) {
          if (ts.isShorthandPropertyAssignment(property)) {
            const resolved = resolveFunction(caller.target.moduleId, property.name.text)
            if (resolved !== undefined) callbacks.set(property.name.text, resolved)
            continue
          }
          if (!ts.isPropertyAssignment(property) || (!ts.isIdentifier(property.name) && !ts.isStringLiteral(property.name))) continue
          if (ts.isArrowFunction(property.initializer) || ts.isFunctionExpression(property.initializer)) callbacks.set(property.name.text, targetForInline(caller.target.moduleId, property.initializer))
          else if (ts.isIdentifier(property.initializer)) {
            const resolved = resolveFunction(caller.target.moduleId, property.initializer.text)
            if (resolved !== undefined) callbacks.set(property.name.text, resolved)
          }
        }
        bindings.set(parameter.name.text, callbacks)
      }
    })
    return { callbacks: bindings, values }
  }

  const pending: PendingTarget[] = []
  const queue = (target: FunctionTarget, bindings: ReadonlyMap<string, CallbackBinding> = new Map(), values: ReadonlyMap<string, ProvenValue> = new Map()): void => { pending.push({ target, bindings, values }) }
  const helper = resolveFunction("runner", "runLeanCorrectiveRecoveryOnlyInjected")
  if (helper === undefined) throw new TypeError("LEAN_CORRECTIVE_RECOVERY_STRUCTURE_MISSING")
  for (const name of ["recoverLeanCorrectiveOrphan", "terminalizeLeanCorrectiveInterruption", "checkLeanCorrectiveRecoveryTerminal"]) {
    const target = resolveFunction("checker", name)
    if (target === undefined) throw new TypeError(`LEAN_CORRECTIVE_RECOVERY_STRUCTURE_MISSING:${name}`)
    queue(target)
  }
  const runnerIndex = indexes.get("runner")!
  let selectorFound = false
  const findSelector = (node: ts.Node): void => {
    if (ts.isIfStatement(node) && node.expression.getText(runnerIndex.sourceFile).includes("LEAN_CORRECTIVE_RECOVERY_ONLY_SELECTOR")) {
      selectorFound = true
      const synthetic: FunctionTarget = {
        moduleId: "runner",
        node: ts.factory.createArrowFunction(undefined, undefined, [], undefined, undefined, node.thenStatement),
        identity: `runner:recovery-selector:${node.pos}:${node.end}`,
      }
      Object.defineProperty(synthetic.node, "pos", { value: node.thenStatement.pos })
      Object.defineProperty(synthetic.node, "end", { value: node.thenStatement.end })
      queue(synthetic)
      return
    }
    ts.forEachChild(node, findSelector)
  }
  findSelector(runnerIndex.sourceFile)
  if (!selectorFound) throw new TypeError("LEAN_CORRECTIVE_RECOVERY_STRUCTURE_MISSING")

  const inspected = new Set<string>()
  const callText = (expression: ts.Expression, sourceFile: ts.SourceFile): string => expression.getText(sourceFile)
  const resolveLexicalFunction = (current: FunctionTarget, name: string, trail = new Set<string>()): FunctionTarget | undefined => {
    if (trail.has(name)) throw new TypeError(`LEAN_CORRECTIVE_RECOVERY_AMBIGUOUS_BINDING:${name}`)
    trail.add(name)
    let found: FunctionTarget | undefined
    let alias: string | undefined
    const scan = (node: ts.Node): void => {
      if (node !== current.node.body && (ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node) || ts.isArrowFunction(node))) return
      if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === name && node.initializer !== undefined) {
        if (found !== undefined || alias !== undefined) throw new TypeError(`LEAN_CORRECTIVE_RECOVERY_AMBIGUOUS_BINDING:${name}`)
        if (ts.isArrowFunction(node.initializer) || ts.isFunctionExpression(node.initializer)) found = targetForInline(current.moduleId, node.initializer)
        else if (ts.isIdentifier(node.initializer)) alias = node.initializer.text
      }
      ts.forEachChild(node, scan)
    }
    scan(current.node.body)
    if (found !== undefined) return found
    return alias === undefined ? undefined : resolveLexicalFunction(current, alias, trail)
  }
  const queueCall = (target: FunctionTarget, call: ts.CallExpression, current: PendingTarget): void => {
    const bound = bindArguments(target, call.arguments, current)
    queue(target, bound.callbacks, bound.values)
  }
  const normalizeSyntax = (node: ts.Node, sourceFile: ts.SourceFile): string => node.getText(sourceFile).replace(/\s+/gu, "").replace(/,([}\]])/gu, "$1")
  const provenArrayStrings = (value: ProvenValue): readonly string[] | undefined => {
    if (value.kind !== "array") return undefined
    const strings: string[] = []
    for (const entry of value.values) {
      if (entry.kind !== "string") return undefined
      strings.push(entry.value)
    }
    return strings
  }
  const assertGitVector = (argv: ProvenValue): void => {
    if (argv.kind !== "array" || argv.values.length === 0 || argv.values.some((value) => value.kind === "unknown" || value.kind === "array" || value.kind === "object")) throw new TypeError(`LEAN_CORRECTIVE_RECOVERY_EXEC_POLICY:${JSON.stringify(argv)}`)
    const args = argv.values
    const stringAt = (index: number): string | undefined => args[index]?.kind === "string" ? args[index].value : undefined
    const exact = (...expected: readonly string[]): boolean => args.length === expected.length && expected.every((value, index) => stringAt(index) === value)
    const valid =
      (stringAt(0) === "hash-object" && args.length === 2) ||
      (stringAt(0) === "rev-parse" && args.length === 2) ||
      exact("status", "--short", "--untracked-files=all") ||
      (stringAt(0) === "diff" && stringAt(1) === "--quiet" && args.length >= 5 && stringAt(3) === "--") ||
      (stringAt(0) === "merge-base" && stringAt(1) === "--is-ancestor" && args.length === 3) ||
      (stringAt(0) === "show" && stringAt(1) === "-s" && stringAt(2) === "--format=%T" && args.length === 4) ||
      exact("ls-files")
    if (!valid) throw new TypeError(`LEAN_CORRECTIVE_RECOVERY_EXEC_POLICY:${JSON.stringify(argv)}`)
  }
  const assertExecFileSyncPolicy = (call: ts.CallExpression, current: PendingTarget, sourceFile: ts.SourceFile): void => {
    const [command, argv, options] = call.arguments
    if (call.arguments.length !== 3 || command === undefined || argv === undefined || options === undefined || !ts.isStringLiteral(command) || !ts.isObjectLiteralExpression(options)) throw new TypeError(`LEAN_CORRECTIVE_RECOVERY_EXEC_POLICY:${call.getText(sourceFile)}`)
    const optionSyntax = normalizeSyntax(options, sourceFile)
    if (command.text === "git") {
      assertGitVector(proveValue(argv, current, sourceFile))
      const wrapper = current.target.identity.includes(":git:") && optionSyntax === '{cwd:repoRoot,encoding:"utf8",stdio:["ignore","pipe","pipe"]}'
      const direct = [":assertLeanCorrectiveTrackedBytes:", ":checkLeanManifest:"].some((name) => current.target.identity.includes(name)) && optionSyntax === '{cwd:repoRoot,stdio:"ignore"}'
      if (!wrapper && !direct) throw new TypeError(`LEAN_CORRECTIVE_RECOVERY_EXEC_POLICY:${call.getText(sourceFile)}`)
      return
    }
    if (command.text === "ps") {
      const proven = proveValue(argv, current, sourceFile)
      const args = proven.kind === "array" ? proven.values : undefined
      const stringAt = (index: number): string | undefined => args?.[index]?.kind === "string" ? args[index].value : undefined
      const validArgs = args !== undefined && (
        (args.length === 2 && stringAt(0) === "-axo" && stringAt(1) === "command=") ||
        (args.length === 4 && stringAt(0) === "-p" && args[1]?.kind === "symbol" && stringAt(2) === "-o" && ["command=", "pgid="].includes(stringAt(3) ?? ""))
      )
      if (!validArgs || optionSyntax !== '{encoding:"utf8"}') throw new TypeError(`LEAN_CORRECTIVE_RECOVERY_EXEC_POLICY:${call.getText(sourceFile)}`)
      return
    }
    throw new TypeError(`LEAN_CORRECTIVE_RECOVERY_EXEC_POLICY:${call.getText(sourceFile)}`)
  }
  const assertProcessKillPolicy = (call: ts.CallExpression, current: PendingTarget, sourceFile: ts.SourceFile): void => {
    if (call.arguments.length !== 2) throw new TypeError("LEAN_CORRECTIVE_RECOVERY_SIGNAL_POLICY")
    const [pidValue, signalValue] = call.arguments.map((argument) => proveValue(argument, current, sourceFile))
    const validProbe = current.target.identity.includes(":processIsAlive:") && pidValue?.kind === "symbol" && signalValue?.kind === "number" && signalValue.value === 0
    const validGroupSignal = current.target.identity.includes(":inline:") && pidValue?.kind === "symbol" && pidValue.value.startsWith("-") && signalValue?.kind === "string" && ["SIGTERM", "SIGKILL"].includes(signalValue.value)
    if (!validProbe && !validGroupSignal) throw new TypeError("LEAN_CORRECTIVE_RECOVERY_SIGNAL_POLICY")
  }
  const exactImportedCapabilities = new Map<string, ReadonlySet<string>>([
    ["node:crypto", new Set(["createHash"])],
    ["node:fs", new Set(["closeSync", "existsSync", "fsyncSync", "openSync", "readFileSync", "unlinkSync", "writeSync"])],
    ["node:url", new Set(["fileURLToPath", "pathToFileURL"])],
    ["@cowards/spec", new Set(["encodeCanonicalJson"])],
  ])
  const isLexicallyDeclared = (target: FunctionTarget, name: string): boolean => {
    if (target.node.parameters.some((parameter) => ts.isIdentifier(parameter.name) && parameter.name.text === name)) return true
    return localInitializer(target, name) !== undefined
  }
  const inspectCall = (call: ts.CallExpression, current: PendingTarget, sourceFile: ts.SourceFile): void => {
    if (call.expression.kind === ts.SyntaxKind.ImportKeyword) throw new TypeError("LEAN_CORRECTIVE_RECOVERY_DYNAMIC_IMPORT")
    if (ts.isElementAccessExpression(call.expression)) throw new TypeError("LEAN_CORRECTIVE_RECOVERY_COMPUTED_CALL")
    if (ts.isIdentifier(call.expression)) {
      const name = call.expression.text
      if (forbiddenNames.has(name)) throw new TypeError("LEAN_CORRECTIVE_RECOVERY_LAUNCH_CAPABILITY")
      const callback = current.bindings.get(name)
      if (callback !== undefined) {
        if (callback instanceof Map) throw new TypeError(`LEAN_CORRECTIVE_RECOVERY_UNRESOLVED_CALL:${name}`)
        queueCall(callback, call, current); return
      }
      const lexical = resolveLexicalFunction(current.target, name)
      if (lexical !== undefined) { queueCall(lexical, call, current); return }
      const local = resolveFunction(current.target.moduleId, name)
      if (local !== undefined) {
        if (name === "git") {
          if (call.arguments.length !== 2) throw new TypeError("LEAN_CORRECTIVE_RECOVERY_EXEC_POLICY")
          assertGitVector(proveValue(call.arguments[1]!, current, sourceFile))
        }
        queueCall(local, call, current); return
      }
      const imported = indexes.get(current.target.moduleId)!.imports.get(name)
      if (imported !== undefined) {
        if (!imported.external) {
          const resolved = resolveFunction(normalizeRelative(current.target.moduleId, imported.specifier), imported.imported)
          if (resolved === undefined) throw new TypeError(`LEAN_CORRECTIVE_RECOVERY_UNRESOLVED_CALL:${name}`)
          queueCall(resolved, call, current); return
        }
        if (name === "execFileSync" && imported.specifier === "node:child_process" && imported.imported === "execFileSync") { assertExecFileSyncPolicy(call, current, sourceFile); return }
        if (name === "unlinkSync" && imported.specifier === "node:fs" && imported.imported === "unlinkSync") {
          if (call.arguments.length !== 1 || !current.target.identity.includes(":clearLeanCorrectiveChildOwnership:") || normalizeSyntax(call.arguments[0]!, sourceFile) !== "target") throw new TypeError("LEAN_CORRECTIVE_RECOVERY_CAPABILITY_POLICY")
          const target = localInitializer(current.target, "target")
          if (target === undefined || normalizeSyntax(target, sourceFile) !== "path.resolve(repoRoot,LEAN_CORRECTIVE_CHILD_OWNERSHIP_PATH)") throw new TypeError("LEAN_CORRECTIVE_RECOVERY_CAPABILITY_POLICY")
          return
        }
        if (inertImportedCalls.has(name) && exactImportedCapabilities.get(imported.specifier)?.has(imported.imported) === true) return
        throw new TypeError(`LEAN_CORRECTIVE_RECOVERY_EXTERNAL_CALL:${name}`)
      }
      if (inertBareCalls.has(name) && !isLexicallyDeclared(current.target, name) && !indexes.get(current.target.moduleId)!.bindings.has(name)) return
      throw new TypeError(`LEAN_CORRECTIVE_RECOVERY_UNRESOLVED_CALL:${name}`)
    }
    if (!ts.isPropertyAccessExpression(call.expression)) throw new TypeError("LEAN_CORRECTIVE_RECOVERY_UNRESOLVED_CALL")
    const receiver = call.expression.expression
    const property = call.expression.name.text
    if (forbiddenNames.has(property) || property === "send") throw new TypeError("LEAN_CORRECTIVE_RECOVERY_LAUNCH_CAPABILITY")
    if (ts.isIdentifier(receiver)) {
      const callbackOwner = current.bindings.get(receiver.text)
      if (callbackOwner instanceof Map) {
        const callback = callbackOwner.get(property)
        if (callback === undefined) throw new TypeError(`LEAN_CORRECTIVE_RECOVERY_UNRESOLVED_CALL:${receiver.text}.${property}`)
        queueCall(callback, call, current); return
      }
      const imported = indexes.get(current.target.moduleId)!.imports.get(receiver.text)
      if (imported?.namespace === true) {
        if (imported.external) {
          const key = `${receiver.text}.${property}`
          if (inertMemberCalls.has(key)) return
          throw new TypeError(`LEAN_CORRECTIVE_RECOVERY_EXTERNAL_CALL:${key}`)
        }
        const resolved = resolveFunction(normalizeRelative(current.target.moduleId, imported.specifier), property)
        if (resolved === undefined) throw new TypeError(`LEAN_CORRECTIVE_RECOVERY_UNRESOLVED_CALL:${property}`)
        queueCall(resolved, call, current); return
      }
      if (imported?.external === true && imported.namespace === false) {
        if (imported.specifier === "node:path" && imported.imported === "default" && ["dirname", "resolve"].includes(property)) return
        throw new TypeError(`LEAN_CORRECTIVE_RECOVERY_EXTERNAL_CALL:${receiver.text}.${property}`)
      }
      if (receiver.text === "checker") {
        const resolved = resolveFunction("checker", property)
        if (resolved === undefined) throw new TypeError(`LEAN_CORRECTIVE_RECOVERY_UNRESOLVED_CALL:${property}`)
        queueCall(resolved, call, current); return
      }
      const exact = `${receiver.text}.${property}`
      if (exact === "process.kill" && !isLexicallyDeclared(current.target, "process") && !indexes.get(current.target.moduleId)!.bindings.has("process")) { assertProcessKillPolicy(call, current, sourceFile); return }
      if (inertMemberCalls.has(exact) && !isLexicallyDeclared(current.target, receiver.text) && !indexes.get(current.target.moduleId)!.bindings.has(receiver.text)) return
      if (inertPrototypeMethods.has(property)) {
        const initializer = localInitializer(current.target, receiver.text)
        if (initializer !== undefined && ts.isObjectLiteralExpression(initializer)) throw new TypeError(`LEAN_CORRECTIVE_RECOVERY_UNRESOLVED_CALL:${exact}`)
        return
      }
    }
    if (inertPrototypeMethods.has(property) && !ts.isObjectLiteralExpression(receiver)) return
    throw new TypeError(`LEAN_CORRECTIVE_RECOVERY_UNRESOLVED_CALL:${callText(call.expression, sourceFile)}`)
  }

  while (pending.length > 0) {
    const current = pending.pop()!
    const bindingIdentity = [...current.bindings.entries()].map(([name, binding]) => `${name}:${binding instanceof Map ? [...binding.keys()].sort().join(",") : binding.identity}`).sort().join("|")
    const valueIdentity = [...current.values.entries()].map(([name, value]) => `${name}:${JSON.stringify(value)}`).sort().join("|")
    const identity = `${current.target.identity}:${bindingIdentity}:${valueIdentity}`
    if (inspected.has(identity)) continue
    inspected.add(identity)
    const index = indexes.get(current.target.moduleId)!
    const body = current.target.node.body
    const visit = (node: ts.Node): void => {
      if (node !== body && (ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node) || ts.isArrowFunction(node))) return
      if (ts.isBinaryExpression(node) && node.operatorToken.kind >= ts.SyntaxKind.FirstAssignment && node.operatorToken.kind <= ts.SyntaxKind.LastAssignment && ts.isIdentifier(node.left)) {
        const topBinding = index.bindings.get(node.left.text)
        const initializer = localInitializer(current.target, node.left.text)
        const capabilityBinding = topBinding !== undefined && topBinding.kind !== "value"
        const callableLocal = initializer !== undefined && (ts.isArrowFunction(initializer) || ts.isFunctionExpression(initializer) || ts.isIdentifier(initializer))
        if (capabilityBinding || callableLocal || forbiddenNames.has(node.left.text) || inertBareCalls.has(node.left.text) || inertImportedCalls.has(node.left.text)) throw new TypeError(`LEAN_CORRECTIVE_RECOVERY_REBINDING:${current.target.moduleId}:${node.left.text}`)
      }
      if (ts.isNewExpression(node)) {
        const callee = node.expression.getText(index.sourceFile)
        if (!["Map", "Promise", "Set", "TypeError"].includes(callee)) throw new TypeError(`LEAN_CORRECTIVE_RECOVERY_NEW_EXPRESSION:${callee}`)
        if (isLexicallyDeclared(current.target, callee) || index.bindings.has(callee)) throw new TypeError(`LEAN_CORRECTIVE_RECOVERY_AMBIGUOUS_BINDING:${current.target.moduleId}:${callee}`)
      }
      if (ts.isCallExpression(node)) inspectCall(node, current, index.sourceFile)
      ts.forEachChild(node, visit)
    }
    visit(body)
  }
}

export const checkLeanCorrectiveSourceOnly = (repoRoot: string): void => {
  checkLeanFirstEvidenceCustody(repoRoot)
  validateLeanDiagnosticCustody(readJson(repoRoot, LEAN_DIAGNOSTIC_CUSTODY_PATH))
  assertCorrectiveFreshDestinationsAbsent(repoRoot)
  assertSuccessorLockInventory(repoRoot)
  const schedule = buildLeanSchedule()
  if (schedule.length !== 24 || new Set(schedule.map(({ chargedIdentity }) => chargedIdentity)).size !== 24 || new Set(schedule.map(({ baseCellId }) => baseCellId)).size !== 12) throw new TypeError("LEAN_CORRECTIVE_SCHEDULE_DRIFT")
  for (const cell of schedule) {
    if (cell.arenaId === "arena:open-field:v1" && cell.executionArenaId !== "arena:smoke:v1") throw new TypeError("LEAN_CORRECTIVE_ALIAS_DRIFT")
    if (cell.semanticGeometryHash !== cell.executionSemanticGeometryHash) throw new TypeError("LEAN_CORRECTIVE_GEOMETRY_DRIFT")
  }
}

export const checkHistoricalLeanSourceReviewBytes = (bytes: Uint8Array): void => {
  if (createHash("sha256").update(bytes).digest("hex") !== LEAN_HISTORICAL_SOURCE_REVIEW_SHA256) throw new TypeError("LEAN_HISTORICAL_SOURCE_REVIEW_DRIFT")
}
export const checkHistoricalLeanSourceReviewV2Bytes = (bytes: Uint8Array): void => {
  if (createHash("sha256").update(bytes).digest("hex") !== LEAN_HISTORICAL_SOURCE_REVIEW_V2_SHA256) throw new TypeError("LEAN_HISTORICAL_SOURCE_REVIEW_V2_DRIFT")
}
const checkHistoricalLeanReviewHistory = (repoRoot: string): void => {
  checkHistoricalLeanSourceReviewBytes(readFileSync(path.resolve(repoRoot, LEAN_HISTORICAL_SOURCE_REVIEW_PATH)))
  checkHistoricalLeanSourceReviewV2Bytes(readFileSync(path.resolve(repoRoot, LEAN_HISTORICAL_SOURCE_REVIEW_V2_PATH)))
  if (existsSync(path.resolve(repoRoot, LEAN_HISTORICAL_READINESS_V2_PATH))) throw new TypeError("LEAN_HISTORICAL_READINESS_V2_MUST_REMAIN_ABSENT")
}

export const assertLeanStatus = (status: string, allowedUntracked: readonly string[] = []): void => {
  const invalid = status.split("\n").filter(Boolean).filter((line) => !(line.startsWith("?? ") && (/^\.v138-successor-[0-9a-f]{64}\.lock$/u.test(line.slice(3)) || allowedUntracked.includes(line.slice(3)))))
  if (invalid.length > 0) throw new TypeError(`LEAN_WORKTREE_DIRTY:${invalid.join(",")}`)
}
export const assertLeanCorrectiveAdmissionStatus = (status: string, allowedOperationalPaths: readonly string[]): void => {
  assertLeanStatus(status, allowedOperationalPaths)
}
const assertLeanCorrectiveTrackedBytes = (repoRoot: string, sourceCommit: string): void => {
  try {
    execFileSync("git", ["diff", "--quiet", sourceCommit, "--", ...LEAN_EXECUTABLE_CLOSURE_PATHS], {
      cwd: repoRoot,
      stdio: "ignore",
    })
  } catch {
    throw new TypeError("LEAN_CORRECTIVE_TRACKED_BYTES_DRIFT")
  }
}
const resolveCommit = (repoRoot: string, ref: string): string => {
  const commit = git(repoRoot, ["rev-parse", `${ref}^{commit}`])
  if (!isOid(commit)) throw new TypeError("LEAN_SOURCE_COMMIT_INVALID")
  return commit
}
export const renderLeanManifest = (repoRoot: string, sourceRef: string): LeanManifest => {
  const commit = resolveCommit(repoRoot, sourceRef)
  const tree = git(repoRoot, ["show", "-s", "--format=%T", commit])
  const executableBlobs = Object.fromEntries(LEAN_EXECUTABLE_CLOSURE_PATHS.map((sourcePath) => [sourcePath, git(repoRoot, ["rev-parse", `${commit}:${sourcePath}`])]))
  return createLeanManifest({ commit, tree, executableBlobs })
}
export const checkLeanManifest = (repoRoot: string, rawManifest: unknown): LeanManifest => {
  const manifest = validateLeanManifest(rawManifest)
  checkHistoricalLeanReviewHistory(repoRoot)
  execFileSync("git", ["merge-base", "--is-ancestor", manifest.source.commit, "HEAD"], { cwd: repoRoot, stdio: "ignore" })
  const paths = Object.keys(manifest.source.executableBlobs)
  if (paths.length !== LEAN_EXECUTABLE_CLOSURE_PATHS.length || paths.some((entry) => !LEAN_EXECUTABLE_CLOSURE_PATHS.includes(entry as never))) throw new TypeError("LEAN_EXECUTABLE_CLOSURE_DRIFT")
  for (const sourcePath of LEAN_EXECUTABLE_CLOSURE_PATHS) {
    const expectedOid = manifest.source.executableBlobs[sourcePath]
    if (git(repoRoot, ["rev-parse", `${manifest.source.commit}:${sourcePath}`]) !== expectedOid || git(repoRoot, ["rev-parse", `HEAD:${sourcePath}`]) !== expectedOid) throw new TypeError(`LEAN_SOURCE_BLOB_DRIFT:${sourcePath}`)
  }
  if (JSON.stringify(renderLeanManifest(repoRoot, manifest.source.commit)) !== JSON.stringify(manifest)) throw new TypeError("LEAN_MANIFEST_DRIFT")
  return manifest
}

export const checkLeanSourceReview = (manifest: LeanManifest, value: unknown): LeanSourceReview => {
  assertPrivacySafe(value)
  const findingValid = (finding: unknown): boolean => isObject(finding) && exactKeys(finding, ["id", "severity", "status", "summary"]) && typeof finding.id === "string" && finding.id.trim().length > 0 && ["critical", "warning"].includes(String(finding.severity)) && finding.status === "open" && typeof finding.summary === "string" && finding.summary.length > 0
  const findingIds = isObject(value) && Array.isArray(value.findings) ? value.findings.map((finding) => isObject(finding) ? finding.id : undefined) : []
  if (!isObject(value) || !exactKeys(value, ["schemaVersion", "sourceCommit", "manifestRoot", "findingCount", "findings", "admitsExecution", "authority"]) || value.schemaVersion !== "v1.38-lean-runner-source-review-v3" || value.sourceCommit !== manifest.source.commit || value.manifestRoot !== hashLeanValue(manifest) || !Number.isSafeInteger(value.findingCount) || (value.findingCount as number) < 0 || !Array.isArray(value.findings) || value.findings.length !== value.findingCount || !value.findings.every(findingValid) || new Set(findingIds).size !== findingIds.length || value.admitsExecution !== false || !exactFalseAuthority(value.authority)) throw new TypeError("LEAN_SOURCE_REVIEW_INVALID")
  return globalThis.structuredClone(value) as unknown as LeanSourceReview
}
export const renderLeanSourceReviewV3 = (
  manifest: LeanManifest,
  findings: readonly LeanReviewFinding[],
): LeanSourceReview => checkLeanSourceReview(manifest, {
  schemaVersion: "v1.38-lean-runner-source-review-v3",
  sourceCommit: manifest.source.commit,
  manifestRoot: hashLeanValue(manifest),
  findingCount: findings.length,
  findings,
  admitsExecution: false,
  authority: LEAN_AUTHORITY_FALSE,
})
export const checkLeanReadiness = (manifest: LeanManifest, reviewValue: unknown, value: unknown): LeanReadiness => {
  assertPrivacySafe(value)
  const review = checkLeanSourceReview(manifest, reviewValue)
  if (review.findingCount !== 0 || !isObject(value) || !exactKeys(value, ["schemaVersion", "sourceCommit", "manifestRoot", "sourceReviewRoot", "findingCount", "plan151Eligible", "liveInvocationLimit", "liveInvocationsConsumed", "correctiveRerunAuthorized", "authority"]) || value.schemaVersion !== "v1.38-lean-runner-readiness-v3" || value.sourceCommit !== manifest.source.commit || value.manifestRoot !== hashLeanValue(manifest) || value.sourceReviewRoot !== hashLeanValue(review) || value.findingCount !== 0 || value.plan151Eligible !== true || value.liveInvocationLimit !== 1 || value.liveInvocationsConsumed !== 0 || value.correctiveRerunAuthorized !== false || !exactFalseAuthority(value.authority)) throw new TypeError("LEAN_READINESS_INVALID")
  return globalThis.structuredClone(value) as unknown as LeanReadiness
}
export const renderLeanReadinessV3 = (manifest: LeanManifest, reviewValue: unknown): LeanReadiness => {
  const review = checkLeanSourceReview(manifest, reviewValue)
  return checkLeanReadiness(manifest, review, {
    schemaVersion: "v1.38-lean-runner-readiness-v3",
    sourceCommit: manifest.source.commit,
    manifestRoot: hashLeanValue(manifest),
    sourceReviewRoot: hashLeanValue(review),
    findingCount: 0,
    plan151Eligible: true,
    liveInvocationLimit: 1,
    liveInvocationsConsumed: 0,
    correctiveRerunAuthorized: false,
    authority: LEAN_AUTHORITY_FALSE,
  })
}
export const checkLeanReviewOutcome = (
  manifest: LeanManifest,
  reviewValue: unknown,
  readinessValue: unknown | undefined,
): LeanReadiness | undefined => {
  const review = checkLeanSourceReview(manifest, reviewValue)
  if (review.findingCount !== 0) {
    if (readinessValue !== undefined) throw new TypeError("LEAN_READINESS_FOR_NONZERO_REVIEW")
    return undefined
  }
  if (readinessValue === undefined) throw new TypeError("LEAN_LITERAL_ZERO_READINESS_MISSING")
  return checkLeanReadiness(manifest, review, readinessValue)
}

export const renderLeanCorrectiveManifest = renderLeanManifest
export const checkLeanCorrectiveManifest = checkLeanManifest
export const checkLeanCorrectiveSourceReview = (manifest: LeanManifest, value: unknown): LeanCorrectiveSourceReview => {
  assertPrivacySafe(value)
  const findingValid = (finding: unknown): boolean => isObject(finding) && exactKeys(finding, ["id", "severity", "status", "summary"]) && typeof finding.id === "string" && finding.id.trim().length > 0 && ["critical", "warning"].includes(String(finding.severity)) && finding.status === "open" && typeof finding.summary === "string" && finding.summary.length > 0
  const ids = isObject(value) && Array.isArray(value.findings) ? value.findings.map((finding) => isObject(finding) ? finding.id : undefined) : []
  if (!isObject(value) || !exactKeys(value, ["schemaVersion", "sourceCommit", "manifestRoot", "findingCount", "findings", "admitsExecution", "authority"]) || value.schemaVersion !== "v1.38-lean-runner-corrective-source-review-v1" || value.sourceCommit !== manifest.source.commit || value.manifestRoot !== hashLeanValue(manifest) || !Number.isSafeInteger(value.findingCount) || (value.findingCount as number) < 0 || !Array.isArray(value.findings) || value.findings.length !== value.findingCount || !value.findings.every(findingValid) || new Set(ids).size !== ids.length || value.admitsExecution !== false || !exactFalseAuthority(value.authority)) throw new TypeError("LEAN_CORRECTIVE_SOURCE_REVIEW_INVALID")
  return globalThis.structuredClone(value) as unknown as LeanCorrectiveSourceReview
}
export const renderLeanCorrectiveSourceReview = (manifest: LeanManifest, findings: readonly LeanReviewFinding[]): LeanCorrectiveSourceReview => checkLeanCorrectiveSourceReview(manifest, {
  schemaVersion: "v1.38-lean-runner-corrective-source-review-v1",
  sourceCommit: manifest.source.commit,
  manifestRoot: hashLeanValue(manifest),
  findingCount: findings.length,
  findings,
  admitsExecution: false,
  authority: LEAN_AUTHORITY_FALSE,
})
export const checkLeanCorrectiveReadiness = (manifest: LeanManifest, reviewValue: unknown, value: unknown): LeanCorrectiveReadiness => {
  const review = checkLeanCorrectiveSourceReview(manifest, reviewValue)
  if (review.findingCount !== 0 || !isObject(value) || !exactKeys(value, ["schemaVersion", "sourceCommit", "manifestRoot", "sourceReviewRoot", "findingCount", "plan158Eligible", "correctiveInvocationLimit", "correctiveInvocationsConsumed", "recoveryOnlyLimit", "authority"]) || value.schemaVersion !== "v1.38-lean-runner-corrective-readiness-v1" || value.sourceCommit !== manifest.source.commit || value.manifestRoot !== hashLeanValue(manifest) || value.sourceReviewRoot !== hashLeanValue(review) || value.findingCount !== 0 || value.plan158Eligible !== true || value.correctiveInvocationLimit !== 1 || value.correctiveInvocationsConsumed !== 0 || value.recoveryOnlyLimit !== 1 || !exactFalseAuthority(value.authority)) throw new TypeError("LEAN_CORRECTIVE_READINESS_INVALID")
  return globalThis.structuredClone(value) as unknown as LeanCorrectiveReadiness
}
export const renderLeanCorrectiveReadiness = (manifest: LeanManifest, reviewValue: unknown): LeanCorrectiveReadiness => {
  const review = checkLeanCorrectiveSourceReview(manifest, reviewValue)
  return checkLeanCorrectiveReadiness(manifest, review, {
    schemaVersion: "v1.38-lean-runner-corrective-readiness-v1",
    sourceCommit: manifest.source.commit,
    manifestRoot: hashLeanValue(manifest),
    sourceReviewRoot: hashLeanValue(review),
    findingCount: 0,
    plan158Eligible: true,
    correctiveInvocationLimit: 1,
    correctiveInvocationsConsumed: 0,
    recoveryOnlyLimit: 1,
    authority: LEAN_AUTHORITY_FALSE,
  })
}

type LeanCorrectiveManifestV2 = Record<string, unknown> & { source: { commit: string, tree: string, executableBlobs: Record<string, string> } }
const LEAN_CORRECTIVE_MANIFEST_V2_ROOT = "sha256:5d8f3b23909ec16674de960fb630185cffa1da4c31cea60e844787e08cc901c3" as const
const LEAN_CORRECTIVE_MANIFEST_V2_COMMIT = "1e9e77db1b77b640d411196402782d89d74747c8" as const
const LEAN_CORRECTIVE_MANIFEST_V2_BLOB = "357514663e17f0dfa24ad8d5d260ca7488c8f0cf" as const
export const checkLeanCorrectiveManifestV2 = (repoRoot: string, value: unknown): LeanCorrectiveManifestV2 => {
  assertPrivacySafe(value)
  const topKeys = ["schemaVersion", "claimClass", "source", "reviewClosure", "immutableRoots", "selectedTuple", "fixtures", "arenas", "formation", "scheduleRoot", "runtimeLimitsRoot", "normalization", "deadlineMilliseconds", "historicalFullMatrix", "freshCorrectiveEffects", "successorLockCount", "formationMaterialized", "authority"]
  if (!isObject(value) || !exactKeys(value, topKeys) || value.schemaVersion !== "v1.38-lean-runner-corrective-source-manifest-v2" || value.claimClass !== "fixture_feasibility_only" || !isObject(value.source) || !exactKeys(value.source, ["commit", "tree", "executableBlobs"]) || !isOid(value.source.commit) || !isOid(value.source.tree) || !isObject(value.source.executableBlobs)) throw new TypeError("LEAN_CORRECTIVE_MANIFEST_V2_INVALID")
  if (hashLeanValue(value) !== LEAN_CORRECTIVE_MANIFEST_V2_ROOT || git(repoRoot, ["rev-parse", `${LEAN_CORRECTIVE_MANIFEST_V2_COMMIT}:${LEAN_CORRECTIVE_V2_ARTIFACT_PATHS.manifest}`]) !== LEAN_CORRECTIVE_MANIFEST_V2_BLOB || git(repoRoot, ["hash-object", LEAN_CORRECTIVE_V2_ARTIFACT_PATHS.manifest]) !== LEAN_CORRECTIVE_MANIFEST_V2_BLOB) throw new TypeError("LEAN_CORRECTIVE_MANIFEST_V2_EXACT_DRIFT")
  const blobs = value.source.executableBlobs
  if (!exactKeys(blobs, LEAN_EXECUTABLE_CLOSURE_PATHS) || git(repoRoot, ["show", "-s", "--format=%T", value.source.commit]) !== value.source.tree) throw new TypeError("LEAN_CORRECTIVE_MANIFEST_V2_SOURCE_DRIFT")
  for (const sourcePath of LEAN_EXECUTABLE_CLOSURE_PATHS) if (git(repoRoot, ["rev-parse", `${value.source.commit}:${sourcePath}`]) !== blobs[sourcePath]) throw new TypeError("LEAN_CORRECTIVE_MANIFEST_V2_SOURCE_DRIFT")
  if (!isObject(value.reviewClosure) || !exactKeys(value.reviewClosure, ["plan163SummaryCommit", "plan163SummaryBlob", "plan157ReviewBlob", "failedManifestV1Root", "failedReviewV1Root", "closedFindingIds"]) || value.reviewClosure.plan163SummaryCommit !== "243fffaf1e9df33306d733fe3d07ed9dcf496038" || value.reviewClosure.plan163SummaryBlob !== git(repoRoot, ["rev-parse", "243fffaf1e9df33306d733fe3d07ed9dcf496038:.planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-163-SUMMARY.md"]) || value.reviewClosure.plan157ReviewBlob !== git(repoRoot, ["rev-parse", "HEAD:.planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-157-REVIEW.md"]) || value.reviewClosure.failedManifestV1Root !== hashLeanValue(readJson(repoRoot, LEAN_CORRECTIVE_V1_ARTIFACT_PATHS.manifest)) || value.reviewClosure.failedReviewV1Root !== hashLeanValue(readJson(repoRoot, LEAN_CORRECTIVE_V1_ARTIFACT_PATHS.sourceReview))) throw new TypeError("LEAN_CORRECTIVE_MANIFEST_V2_REVIEW_DRIFT")
  if (!isObject(value.immutableRoots) || !exactKeys(value.immutableRoots, ["d34lContractRoot", "firstInvocationRoot", "firstTerminalRoot", "diagnosticCustodyRoot"]) || value.immutableRoots.firstInvocationRoot !== hashLeanValue(readJson(repoRoot, LEAN_ARTIFACT_PATHS.invocation)) || value.immutableRoots.firstTerminalRoot !== hashLeanValue(readJson(repoRoot, LEAN_ARTIFACT_PATHS.terminal)) || value.immutableRoots.diagnosticCustodyRoot !== hashLeanValue(readJson(repoRoot, LEAN_DIAGNOSTIC_CUSTODY_PATH))) throw new TypeError("LEAN_CORRECTIVE_MANIFEST_V2_ROOT_DRIFT")
  if (!isObject(value.freshCorrectiveEffects) || !exactKeys(value.freshCorrectiveEffects, ["readinessV2Present", "invocationV2Present", "terminalV2Present", "adjudicationV2Present", "eligibilityV2Present", "childOwnershipPresent"]) || Object.values(value.freshCorrectiveEffects).some((present) => present !== false) || value.successorLockCount !== 36 || value.formationMaterialized !== false || !exactFalseAuthority(value.authority)) throw new TypeError("LEAN_CORRECTIVE_MANIFEST_V2_EFFECT_DRIFT")
  assertSuccessorLockInventory(repoRoot)
  return globalThis.structuredClone(value) as LeanCorrectiveManifestV2
}
export const checkLeanCorrectiveSourceReviewV2 = (manifest: LeanCorrectiveManifestV2, value: unknown): LeanCorrectiveSourceReviewV3 => {
  assertPrivacySafe(value)
  const findingValid = (finding: unknown): boolean => isObject(finding) && exactKeys(finding, ["id", "severity", "status", "summary"]) && typeof finding.id === "string" && ["critical", "warning"].includes(String(finding.severity)) && finding.status === "open" && typeof finding.summary === "string" && finding.summary.length > 0
  if (!isObject(value) || !exactKeys(value, ["schemaVersion", "sourceCommit", "sourceTree", "manifestRoot", "findingCount", "findings", "plan157FindingDisposition", "verification", "admitsExecution", "authority"]) || value.schemaVersion !== "v1.38-lean-runner-corrective-source-review-v2" || value.sourceCommit !== manifest.source.commit || value.sourceTree !== manifest.source.tree || value.manifestRoot !== hashLeanValue(manifest) || !Number.isSafeInteger(value.findingCount) || (value.findingCount as number) <= 0 || !Array.isArray(value.findings) || value.findings.length !== value.findingCount || !value.findings.every(findingValid) || value.admitsExecution !== false || !exactFalseAuthority(value.authority)) throw new TypeError("LEAN_CORRECTIVE_SOURCE_REVIEW_V2_INVALID")
  return globalThis.structuredClone(value) as unknown as LeanCorrectiveSourceReviewV3
}
export const checkLeanCorrectiveReviewOutcomeV2 = (manifest: LeanCorrectiveManifestV2, reviewValue: unknown, readinessValue: unknown | undefined): undefined => {
  const review = checkLeanCorrectiveSourceReviewV2(manifest, reviewValue)
  if (review.findingCount === 0) throw new TypeError("LEAN_CORRECTIVE_V2_HISTORY_MUST_FAIL")
  if (readinessValue !== undefined) throw new TypeError("LEAN_CORRECTIVE_READINESS_FOR_NONZERO_REVIEW")
  return undefined
}

export const renderLeanCorrectiveManifestV3 = (repoRoot: string, sourceRef: string): LeanCorrectiveManifestV3 => {
  const base = renderLeanManifest(repoRoot, sourceRef)
  const manifest = {
    ...base,
    schemaVersion: "v1.38-lean-runner-corrective-source-manifest-v3",
    predecessorRoots: {
      failedManifestV1Root: hashLeanValue(readJson(repoRoot, LEAN_CORRECTIVE_V1_ARTIFACT_PATHS.manifest)),
      failedReviewV1Root: hashLeanValue(readJson(repoRoot, LEAN_CORRECTIVE_V1_ARTIFACT_PATHS.sourceReview)),
      failedManifestV2Root: hashLeanValue(readJson(repoRoot, LEAN_CORRECTIVE_V2_ARTIFACT_PATHS.manifest)),
      failedReviewV2Root: hashLeanValue(readJson(repoRoot, LEAN_CORRECTIVE_V2_ARTIFACT_PATHS.sourceReview)),
      firstInvocationRoot: hashLeanValue(readJson(repoRoot, LEAN_ARTIFACT_PATHS.invocation)),
      firstTerminalRoot: hashLeanValue(readJson(repoRoot, LEAN_ARTIFACT_PATHS.terminal)),
      diagnosticCustodyRoot: hashLeanValue(readJson(repoRoot, LEAN_DIAGNOSTIC_CUSTODY_PATH)),
    },
    successorLockCount: 36,
    freshCorrectiveEffects: {
      readinessV3Present: false, invocationV2Present: false, terminalV2Present: false,
      adjudicationV2Present: false, eligibilityV2Present: false, childOwnershipPresent: false,
    },
  } as LeanCorrectiveManifestV3
  return manifest
}
export const checkLeanCorrectiveManifestV3 = (repoRoot: string, value: unknown): LeanCorrectiveManifestV3 => {
  assertPrivacySafe(value)
  if (!isObject(value) || value.schemaVersion !== "v1.38-lean-runner-corrective-source-manifest-v3" || !isObject(value.source) || !isOid(value.source.commit)) throw new TypeError("LEAN_CORRECTIVE_MANIFEST_V3_INVALID")
  const expected = renderLeanCorrectiveManifestV3(repoRoot, value.source.commit)
  if (JSON.stringify(value) !== JSON.stringify(expected)) throw new TypeError("LEAN_CORRECTIVE_MANIFEST_V3_DRIFT")
  assertSuccessorLockInventory(repoRoot)
  return globalThis.structuredClone(value) as unknown as LeanCorrectiveManifestV3
}
export const renderLeanCorrectiveSourceReviewV3 = (manifest: LeanCorrectiveManifestV3, findings: readonly LeanReviewFinding[]): LeanCorrectiveSourceReviewV3 => checkLeanCorrectiveSourceReviewV3(manifest, {
  schemaVersion: "v1.38-lean-runner-corrective-source-review-v3", sourceCommit: manifest.source.commit,
  sourceTree: manifest.source.tree, manifestRoot: hashLeanValue(manifest), findingCount: findings.length,
  findings, admitsExecution: false, authority: LEAN_AUTHORITY_FALSE,
})
export const checkLeanCorrectiveSourceReviewV3 = (manifest: LeanCorrectiveManifestV3, value: unknown): LeanCorrectiveSourceReviewV3 => {
  assertPrivacySafe(value)
  const validFinding = (finding: unknown): boolean => isObject(finding) && exactKeys(finding, ["id", "severity", "status", "summary"]) && typeof finding.id === "string" && finding.id.length > 0 && ["critical", "warning"].includes(String(finding.severity)) && finding.status === "open" && typeof finding.summary === "string" && finding.summary.length > 0
  if (!isObject(value) || !exactKeys(value, ["schemaVersion", "sourceCommit", "sourceTree", "manifestRoot", "findingCount", "findings", "admitsExecution", "authority"]) || value.schemaVersion !== "v1.38-lean-runner-corrective-source-review-v3" || value.sourceCommit !== manifest.source.commit || value.sourceTree !== manifest.source.tree || value.manifestRoot !== hashLeanValue(manifest) || !Number.isSafeInteger(value.findingCount) || (value.findingCount as number) < 0 || !Array.isArray(value.findings) || value.findings.length !== value.findingCount || !value.findings.every(validFinding) || new Set(value.findings.map((finding) => (finding as Record<string, unknown>).id)).size !== value.findings.length || value.admitsExecution !== false || !exactFalseAuthority(value.authority)) throw new TypeError("LEAN_CORRECTIVE_SOURCE_REVIEW_V3_INVALID")
  return globalThis.structuredClone(value) as unknown as LeanCorrectiveSourceReviewV3
}
export const checkLeanCorrectiveReadinessV3 = (manifest: LeanCorrectiveManifestV3, reviewValue: unknown, value: unknown): LeanCorrectiveReadiness => {
  const review = checkLeanCorrectiveSourceReviewV3(manifest, reviewValue)
  if (review.findingCount !== 0 || !isObject(value) || !exactKeys(value, ["schemaVersion", "sourceCommit", "manifestRoot", "sourceReviewRoot", "findingCount", "plan158Eligible", "correctiveInvocationLimit", "correctiveInvocationsConsumed", "recoveryOnlyLimit", "authority"]) || value.schemaVersion !== "v1.38-lean-runner-corrective-readiness-v3" || value.sourceCommit !== manifest.source.commit || value.manifestRoot !== hashLeanValue(manifest) || value.sourceReviewRoot !== hashLeanValue(review) || value.findingCount !== 0 || value.plan158Eligible !== true || value.correctiveInvocationLimit !== 1 || value.correctiveInvocationsConsumed !== 0 || value.recoveryOnlyLimit !== 1 || !exactFalseAuthority(value.authority)) throw new TypeError("LEAN_CORRECTIVE_READINESS_V3_INVALID")
  return globalThis.structuredClone(value) as unknown as LeanCorrectiveReadiness
}
export const renderLeanCorrectiveReadinessV3 = (manifest: LeanCorrectiveManifestV3, reviewValue: unknown): LeanCorrectiveReadiness => {
  const review = checkLeanCorrectiveSourceReviewV3(manifest, reviewValue)
  return checkLeanCorrectiveReadinessV3(manifest, review, { schemaVersion: "v1.38-lean-runner-corrective-readiness-v3", sourceCommit: manifest.source.commit, manifestRoot: hashLeanValue(manifest), sourceReviewRoot: hashLeanValue(review), findingCount: 0, plan158Eligible: true, correctiveInvocationLimit: 1, correctiveInvocationsConsumed: 0, recoveryOnlyLimit: 1, authority: LEAN_AUTHORITY_FALSE })
}

const PLAN165_SUMMARY_PATH = ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-165-SUMMARY.md" as const
const PLAN165_SUMMARY_COMMIT = "18251a883e77b3a7b0845074faae4d8365ab84d5" as const
const PLAN165_SUMMARY_BLOB = "96fecf67546c3c5b9eaa0a72901fbe3f6978b3c4" as const
const PLAN165_SUMMARY_ROOT = "sha256:4407a2284cfd1086bb67b7de497424156983a6dedec9684f288069e1ea8788c4" as const
export const deriveLeanCorrectiveFreshEffects = (repoRoot: string): LeanCorrectiveFreshEffects => ({
  readinessV4Present: existsSync(path.resolve(repoRoot, LEAN_CORRECTIVE_V4_ARTIFACT_PATHS.readiness)),
  invocationV2Present: existsSync(path.resolve(repoRoot, LEAN_CORRECTIVE_ARTIFACT_PATHS.invocation)),
  terminalV2Present: existsSync(path.resolve(repoRoot, LEAN_CORRECTIVE_ARTIFACT_PATHS.terminal)),
  adjudicationV2Present: existsSync(path.resolve(repoRoot, LEAN_CORRECTIVE_ARTIFACT_PATHS.adjudication)),
  eligibilityV2Present: existsSync(path.resolve(repoRoot, LEAN_CORRECTIVE_ARTIFACT_PATHS.eligibility)),
  childOwnershipPresent: existsSync(path.resolve(repoRoot, LEAN_CORRECTIVE_CHILD_OWNERSHIP_PATH)),
})
const noCorrectiveFreshEffects = (effects: LeanCorrectiveFreshEffects): boolean => Object.values(effects).every((present) => present === false)
const buildLeanCorrectiveManifestV4 = (repoRoot: string, sourceRef: string, effects: LeanCorrectiveFreshEffects): LeanCorrectiveManifestV4 => {
  if (git(repoRoot, ["rev-parse", `${PLAN165_SUMMARY_COMMIT}:${PLAN165_SUMMARY_PATH}`]) !== PLAN165_SUMMARY_BLOB || git(repoRoot, ["rev-parse", `HEAD:${PLAN165_SUMMARY_PATH}`]) !== PLAN165_SUMMARY_BLOB || `sha256:${sha256File(path.resolve(repoRoot, PLAN165_SUMMARY_PATH))}` !== PLAN165_SUMMARY_ROOT) throw new TypeError("LEAN_PLAN165_SUMMARY_DRIFT")
  const base = renderLeanManifest(repoRoot, sourceRef)
  return {
    ...base,
    schemaVersion: "v1.38-lean-runner-corrective-source-manifest-v4",
    plan165Summary: { commit: PLAN165_SUMMARY_COMMIT, blob: PLAN165_SUMMARY_BLOB, contentRoot: PLAN165_SUMMARY_ROOT },
    predecessorRoots: {
      failedManifestV1Root: hashLeanValue(readJson(repoRoot, LEAN_CORRECTIVE_V1_ARTIFACT_PATHS.manifest)),
      failedReviewV1Root: hashLeanValue(readJson(repoRoot, LEAN_CORRECTIVE_V1_ARTIFACT_PATHS.sourceReview)),
      failedManifestV2Root: hashLeanValue(checkLeanCorrectiveManifestV2(repoRoot, readJson(repoRoot, LEAN_CORRECTIVE_V2_ARTIFACT_PATHS.manifest))),
      failedReviewV2Root: hashLeanValue(readJson(repoRoot, LEAN_CORRECTIVE_V2_ARTIFACT_PATHS.sourceReview)),
      failedManifestV3Root: hashLeanValue(readJson(repoRoot, LEAN_CORRECTIVE_V3_ARTIFACT_PATHS.manifest)),
      failedReviewV3Root: hashLeanValue(readJson(repoRoot, LEAN_CORRECTIVE_V3_ARTIFACT_PATHS.sourceReview)),
      firstInvocationRoot: hashLeanValue(readJson(repoRoot, LEAN_ARTIFACT_PATHS.invocation)),
      firstTerminalRoot: hashLeanValue(readJson(repoRoot, LEAN_ARTIFACT_PATHS.terminal)),
      diagnosticCustodyRoot: hashLeanValue(readJson(repoRoot, LEAN_DIAGNOSTIC_CUSTODY_PATH)),
    },
    successorLockCount: 36,
    freshCorrectiveEffects: effects,
  }
}
export const renderLeanCorrectiveManifestV4 = (repoRoot: string, sourceRef: string): LeanCorrectiveManifestV4 => {
  const effects = deriveLeanCorrectiveFreshEffects(repoRoot)
  if (!noCorrectiveFreshEffects(effects)) throw new TypeError("LEAN_CORRECTIVE_MANIFEST_V4_EFFECT_PRESENT")
  return buildLeanCorrectiveManifestV4(repoRoot, sourceRef, effects)
}
export const checkLeanCorrectiveManifestV4 = (repoRoot: string, value: unknown): LeanCorrectiveManifestV4 => {
  assertPrivacySafe(value)
  if (!isObject(value) || value.schemaVersion !== "v1.38-lean-runner-corrective-source-manifest-v4" || !isObject(value.source) || !isOid(value.source.commit)) throw new TypeError("LEAN_CORRECTIVE_MANIFEST_V4_INVALID")
  const expected = renderLeanCorrectiveManifestV4(repoRoot, value.source.commit)
  if (JSON.stringify(value) !== JSON.stringify(expected)) throw new TypeError("LEAN_CORRECTIVE_MANIFEST_V4_DRIFT")
  assertSuccessorLockInventory(repoRoot)
  return globalThis.structuredClone(value) as unknown as LeanCorrectiveManifestV4
}
const checkRecordedLeanCorrectiveManifestV4 = (repoRoot: string, value: unknown): LeanCorrectiveManifestV4 => {
  if (!isObject(value) || value.schemaVersion !== "v1.38-lean-runner-corrective-source-manifest-v4" || !isObject(value.source) || !isOid(value.source.commit)) throw new TypeError("LEAN_CORRECTIVE_MANIFEST_V4_INVALID")
  const expected = buildLeanCorrectiveManifestV4(repoRoot, value.source.commit, {
    readinessV4Present: false, invocationV2Present: false, terminalV2Present: false,
    adjudicationV2Present: false, eligibilityV2Present: false, childOwnershipPresent: false,
  })
  if (JSON.stringify(value) !== JSON.stringify(expected)) throw new TypeError("LEAN_CORRECTIVE_MANIFEST_V4_DRIFT")
  return globalThis.structuredClone(value) as unknown as LeanCorrectiveManifestV4
}
export const checkLeanCorrectiveSourceReviewV4 = (manifest: LeanCorrectiveManifestV4, value: unknown): LeanCorrectiveSourceReviewV4 => {
  assertPrivacySafe(value)
  const validFinding = (finding: unknown): boolean => isObject(finding) && exactKeys(finding, ["id", "severity", "status", "summary"]) && typeof finding.id === "string" && finding.id.length > 0 && ["critical", "warning"].includes(String(finding.severity)) && finding.status === "open" && typeof finding.summary === "string" && finding.summary.length > 0
  if (!isObject(value) || !exactKeys(value, ["schemaVersion", "sourceCommit", "sourceTree", "manifestRoot", "findingCount", "findings", "admitsExecution", "authority"]) || value.schemaVersion !== "v1.38-lean-runner-corrective-source-review-v4" || value.sourceCommit !== manifest.source.commit || value.sourceTree !== manifest.source.tree || value.manifestRoot !== hashLeanValue(manifest) || !Number.isSafeInteger(value.findingCount) || (value.findingCount as number) < 0 || !Array.isArray(value.findings) || value.findings.length !== value.findingCount || !value.findings.every(validFinding) || new Set(value.findings.map((finding) => (finding as Record<string, unknown>).id)).size !== value.findings.length || value.admitsExecution !== false || !exactFalseAuthority(value.authority)) throw new TypeError("LEAN_CORRECTIVE_SOURCE_REVIEW_V4_INVALID")
  return globalThis.structuredClone(value) as unknown as LeanCorrectiveSourceReviewV4
}
export const renderLeanCorrectiveSourceReviewV4 = (manifest: LeanCorrectiveManifestV4, findings: readonly LeanReviewFinding[]): LeanCorrectiveSourceReviewV4 => checkLeanCorrectiveSourceReviewV4(manifest, {
  schemaVersion: "v1.38-lean-runner-corrective-source-review-v4", sourceCommit: manifest.source.commit,
  sourceTree: manifest.source.tree, manifestRoot: hashLeanValue(manifest), findingCount: findings.length,
  findings, admitsExecution: false, authority: LEAN_AUTHORITY_FALSE,
})
export const checkLeanCorrectiveReadinessV4 = (manifest: LeanCorrectiveManifestV4, reviewValue: unknown, value: unknown): LeanCorrectiveReadiness => {
  const review = checkLeanCorrectiveSourceReviewV4(manifest, reviewValue)
  if (review.findingCount !== 0 || !isObject(value) || !exactKeys(value, ["schemaVersion", "sourceCommit", "manifestRoot", "sourceReviewRoot", "findingCount", "plan158Eligible", "correctiveInvocationLimit", "correctiveInvocationsConsumed", "recoveryOnlyLimit", "authority"]) || value.schemaVersion !== "v1.38-lean-runner-corrective-readiness-v4" || value.sourceCommit !== manifest.source.commit || value.manifestRoot !== hashLeanValue(manifest) || value.sourceReviewRoot !== hashLeanValue(review) || value.findingCount !== 0 || value.plan158Eligible !== true || value.correctiveInvocationLimit !== 1 || value.correctiveInvocationsConsumed !== 0 || value.recoveryOnlyLimit !== 1 || !exactFalseAuthority(value.authority)) throw new TypeError("LEAN_CORRECTIVE_READINESS_V4_INVALID")
  return globalThis.structuredClone(value) as unknown as LeanCorrectiveReadiness
}
export const renderLeanCorrectiveReadinessV4 = (manifest: LeanCorrectiveManifestV4, reviewValue: unknown): LeanCorrectiveReadiness => {
  const review = checkLeanCorrectiveSourceReviewV4(manifest, reviewValue)
  return checkLeanCorrectiveReadinessV4(manifest, review, { schemaVersion: "v1.38-lean-runner-corrective-readiness-v4", sourceCommit: manifest.source.commit, manifestRoot: hashLeanValue(manifest), sourceReviewRoot: hashLeanValue(review), findingCount: 0, plan158Eligible: true, correctiveInvocationLimit: 1, correctiveInvocationsConsumed: 0, recoveryOnlyLimit: 1, authority: LEAN_AUTHORITY_FALSE })
}
export const deriveLeanCorrectiveFreshEffectsV5 = (repoRoot: string): LeanCorrectiveFreshEffectsV5 => ({
  readinessV5Present: existsSync(path.resolve(repoRoot, LEAN_CORRECTIVE_V5_ARTIFACT_PATHS.readiness)),
  invocationV2Present: existsSync(path.resolve(repoRoot, LEAN_CORRECTIVE_ARTIFACT_PATHS.invocation)),
  terminalV2Present: existsSync(path.resolve(repoRoot, LEAN_CORRECTIVE_ARTIFACT_PATHS.terminal)),
  adjudicationV2Present: existsSync(path.resolve(repoRoot, LEAN_CORRECTIVE_ARTIFACT_PATHS.adjudication)),
  eligibilityV2Present: existsSync(path.resolve(repoRoot, LEAN_CORRECTIVE_ARTIFACT_PATHS.eligibility)),
  childOwnershipPresent: existsSync(path.resolve(repoRoot, LEAN_CORRECTIVE_CHILD_OWNERSHIP_PATH)),
})
const noCorrectiveFreshEffectsV5 = (effects: LeanCorrectiveFreshEffectsV5): boolean => Object.values(effects).every((present) => present === false)
const buildLeanCorrectiveManifestV5 = (repoRoot: string, sourceRef: string, effects: LeanCorrectiveFreshEffectsV5): LeanCorrectiveManifestV5 => {
  if (git(repoRoot, ["rev-parse", `${PLAN165_SUMMARY_COMMIT}:${PLAN165_SUMMARY_PATH}`]) !== PLAN165_SUMMARY_BLOB || git(repoRoot, ["rev-parse", `HEAD:${PLAN165_SUMMARY_PATH}`]) !== PLAN165_SUMMARY_BLOB || `sha256:${sha256File(path.resolve(repoRoot, PLAN165_SUMMARY_PATH))}` !== PLAN165_SUMMARY_ROOT) throw new TypeError("LEAN_PLAN165_SUMMARY_DRIFT")
  const base = renderLeanManifest(repoRoot, sourceRef)
  return {
    ...base,
    schemaVersion: "v1.38-lean-runner-corrective-source-manifest-v5",
    plan165Summary: { commit: PLAN165_SUMMARY_COMMIT, blob: PLAN165_SUMMARY_BLOB, contentRoot: PLAN165_SUMMARY_ROOT },
    predecessorRoots: {
      failedManifestV1Root: hashLeanValue(readJson(repoRoot, LEAN_CORRECTIVE_V1_ARTIFACT_PATHS.manifest)),
      failedReviewV1Root: hashLeanValue(readJson(repoRoot, LEAN_CORRECTIVE_V1_ARTIFACT_PATHS.sourceReview)),
      failedManifestV2Root: hashLeanValue(checkLeanCorrectiveManifestV2(repoRoot, readJson(repoRoot, LEAN_CORRECTIVE_V2_ARTIFACT_PATHS.manifest))),
      failedReviewV2Root: hashLeanValue(readJson(repoRoot, LEAN_CORRECTIVE_V2_ARTIFACT_PATHS.sourceReview)),
      failedManifestV3Root: hashLeanValue(readJson(repoRoot, LEAN_CORRECTIVE_V3_ARTIFACT_PATHS.manifest)),
      failedReviewV3Root: hashLeanValue(readJson(repoRoot, LEAN_CORRECTIVE_V3_ARTIFACT_PATHS.sourceReview)),
      failedManifestV4Root: hashLeanValue(readJson(repoRoot, LEAN_CORRECTIVE_V4_ARTIFACT_PATHS.manifest)),
      failedReviewV4Root: hashLeanValue(readJson(repoRoot, LEAN_CORRECTIVE_V4_ARTIFACT_PATHS.sourceReview)),
      firstInvocationRoot: hashLeanValue(readJson(repoRoot, LEAN_ARTIFACT_PATHS.invocation)),
      firstTerminalRoot: hashLeanValue(readJson(repoRoot, LEAN_ARTIFACT_PATHS.terminal)),
      diagnosticCustodyRoot: hashLeanValue(readJson(repoRoot, LEAN_DIAGNOSTIC_CUSTODY_PATH)),
    },
    successorLockCount: 36,
    freshCorrectiveEffects: effects,
  }
}
export const renderLeanCorrectiveManifestV5 = (repoRoot: string, sourceRef: string): LeanCorrectiveManifestV5 => {
  const effects = deriveLeanCorrectiveFreshEffectsV5(repoRoot)
  if (!noCorrectiveFreshEffectsV5(effects)) throw new TypeError("LEAN_CORRECTIVE_MANIFEST_V5_EFFECT_PRESENT")
  return buildLeanCorrectiveManifestV5(repoRoot, sourceRef, effects)
}
export const checkLeanCorrectiveManifestV5 = (repoRoot: string, value: unknown): LeanCorrectiveManifestV5 => {
  assertPrivacySafe(value)
  if (!isObject(value) || value.schemaVersion !== "v1.38-lean-runner-corrective-source-manifest-v5" || !isObject(value.source) || !isOid(value.source.commit)) throw new TypeError("LEAN_CORRECTIVE_MANIFEST_V5_INVALID")
  const expected = renderLeanCorrectiveManifestV5(repoRoot, value.source.commit)
  if (JSON.stringify(value) !== JSON.stringify(expected)) throw new TypeError("LEAN_CORRECTIVE_MANIFEST_V5_DRIFT")
  assertSuccessorLockInventory(repoRoot)
  return globalThis.structuredClone(value) as unknown as LeanCorrectiveManifestV5
}
const checkRecordedLeanCorrectiveManifestV5 = (repoRoot: string, value: unknown): LeanCorrectiveManifestV5 => {
  if (!isObject(value) || value.schemaVersion !== "v1.38-lean-runner-corrective-source-manifest-v5" || !isObject(value.source) || !isOid(value.source.commit)) throw new TypeError("LEAN_CORRECTIVE_MANIFEST_V5_INVALID")
  const expected = buildLeanCorrectiveManifestV5(repoRoot, value.source.commit, {
    readinessV5Present: false, invocationV2Present: false, terminalV2Present: false,
    adjudicationV2Present: false, eligibilityV2Present: false, childOwnershipPresent: false,
  })
  if (JSON.stringify(value) !== JSON.stringify(expected)) throw new TypeError("LEAN_CORRECTIVE_MANIFEST_V5_DRIFT")
  return globalThis.structuredClone(value) as unknown as LeanCorrectiveManifestV5
}
export const checkLeanCorrectiveSourceReviewV5 = (manifest: LeanCorrectiveManifestV5, value: unknown): LeanCorrectiveSourceReviewV5 => {
  assertPrivacySafe(value)
  const validFinding = (finding: unknown): boolean => isObject(finding) && exactKeys(finding, ["id", "severity", "status", "summary"]) && typeof finding.id === "string" && finding.id.length > 0 && ["critical", "warning"].includes(String(finding.severity)) && finding.status === "open" && typeof finding.summary === "string" && finding.summary.length > 0
  if (!isObject(value) || !exactKeys(value, ["schemaVersion", "sourceCommit", "sourceTree", "manifestRoot", "findingCount", "findings", "admitsExecution", "authority"]) || value.schemaVersion !== "v1.38-lean-runner-corrective-source-review-v5" || value.sourceCommit !== manifest.source.commit || value.sourceTree !== manifest.source.tree || value.manifestRoot !== hashLeanValue(manifest) || !Number.isSafeInteger(value.findingCount) || (value.findingCount as number) < 0 || !Array.isArray(value.findings) || value.findings.length !== value.findingCount || !value.findings.every(validFinding) || new Set(value.findings.map((finding) => (finding as Record<string, unknown>).id)).size !== value.findings.length || value.admitsExecution !== false || !exactFalseAuthority(value.authority)) throw new TypeError("LEAN_CORRECTIVE_SOURCE_REVIEW_V5_INVALID")
  return globalThis.structuredClone(value) as unknown as LeanCorrectiveSourceReviewV5
}
export const renderLeanCorrectiveSourceReviewV5 = (manifest: LeanCorrectiveManifestV5, findings: readonly LeanReviewFinding[]): LeanCorrectiveSourceReviewV5 => checkLeanCorrectiveSourceReviewV5(manifest, {
  schemaVersion: "v1.38-lean-runner-corrective-source-review-v5", sourceCommit: manifest.source.commit,
  sourceTree: manifest.source.tree, manifestRoot: hashLeanValue(manifest), findingCount: findings.length,
  findings, admitsExecution: false, authority: LEAN_AUTHORITY_FALSE,
})
export const checkLeanCorrectiveReadinessV5 = (manifest: LeanCorrectiveManifestV5, reviewValue: unknown, value: unknown): LeanCorrectiveReadiness => {
  const review = checkLeanCorrectiveSourceReviewV5(manifest, reviewValue)
  if (review.findingCount !== 0 || !isObject(value) || !exactKeys(value, ["schemaVersion", "sourceCommit", "manifestRoot", "sourceReviewRoot", "findingCount", "plan158Eligible", "correctiveInvocationLimit", "correctiveInvocationsConsumed", "recoveryOnlyLimit", "authority"]) || value.schemaVersion !== "v1.38-lean-runner-corrective-readiness-v5" || value.sourceCommit !== manifest.source.commit || value.manifestRoot !== hashLeanValue(manifest) || value.sourceReviewRoot !== hashLeanValue(review) || value.findingCount !== 0 || value.plan158Eligible !== true || value.correctiveInvocationLimit !== 1 || value.correctiveInvocationsConsumed !== 0 || value.recoveryOnlyLimit !== 1 || !exactFalseAuthority(value.authority)) throw new TypeError("LEAN_CORRECTIVE_READINESS_V5_INVALID")
  return globalThis.structuredClone(value) as unknown as LeanCorrectiveReadiness
}
export const renderLeanCorrectiveReadinessV5 = (manifest: LeanCorrectiveManifestV5, reviewValue: unknown): LeanCorrectiveReadiness => {
  const review = checkLeanCorrectiveSourceReviewV5(manifest, reviewValue)
  return checkLeanCorrectiveReadinessV5(manifest, review, { schemaVersion: "v1.38-lean-runner-corrective-readiness-v5", sourceCommit: manifest.source.commit, manifestRoot: hashLeanValue(manifest), sourceReviewRoot: hashLeanValue(review), findingCount: 0, plan158Eligible: true, correctiveInvocationLimit: 1, correctiveInvocationsConsumed: 0, recoveryOnlyLimit: 1, authority: LEAN_AUTHORITY_FALSE })
}
export const checkLeanCorrectiveReviewOutcomeV5 = (manifest: LeanCorrectiveManifestV5, reviewValue: unknown, readinessValue: unknown): LeanCorrectiveReadiness | undefined => {
  const review = checkLeanCorrectiveSourceReviewV5(manifest, reviewValue)
  if (review.findingCount !== 0) {
    if (readinessValue !== undefined) throw new TypeError("LEAN_CORRECTIVE_NONZERO_REVIEW_V5_READINESS_FORBIDDEN")
    return undefined
  }
  if (readinessValue === undefined) throw new TypeError("LEAN_CORRECTIVE_ZERO_REVIEW_V5_READINESS_REQUIRED")
  return checkLeanCorrectiveReadinessV5(manifest, review, readinessValue)
}
const PLAN169_SUMMARY_PATH = ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-169-SUMMARY.md" as const
const PLAN169_SUMMARY_COMMIT = "c33111d565cd7ebfb824270d67a71f71e536539a" as const
const PLAN169_SUMMARY_BLOB = "8b4bab02e1e3262e32d0c5efcde9c58f509073ef" as const
const PLAN169_SUMMARY_ROOT = "sha256:b24af58afb224715eb2e40bedef0150f761e1b7b04687c9346e256e77b79a65b" as const
export const deriveLeanCorrectiveFreshEffectsV6 = (repoRoot: string): LeanCorrectiveFreshEffectsV6 => ({
  readinessV6Present: existsSync(path.resolve(repoRoot, LEAN_CORRECTIVE_V6_ARTIFACT_PATHS.readiness)),
  invocationV2Present: existsSync(path.resolve(repoRoot, LEAN_CORRECTIVE_ARTIFACT_PATHS.invocation)),
  terminalV2Present: existsSync(path.resolve(repoRoot, LEAN_CORRECTIVE_ARTIFACT_PATHS.terminal)),
  adjudicationV2Present: existsSync(path.resolve(repoRoot, LEAN_CORRECTIVE_ARTIFACT_PATHS.adjudication)),
  eligibilityV2Present: existsSync(path.resolve(repoRoot, LEAN_CORRECTIVE_ARTIFACT_PATHS.eligibility)),
  childOwnershipPresent: existsSync(path.resolve(repoRoot, LEAN_CORRECTIVE_CHILD_OWNERSHIP_PATH)),
})
const noCorrectiveFreshEffectsV6 = (effects: LeanCorrectiveFreshEffectsV6): boolean => Object.values(effects).every((present) => present === false)
const assertPlan169Summary = (repoRoot: string): void => {
  if (
    git(repoRoot, ["rev-parse", `${PLAN169_SUMMARY_COMMIT}:${PLAN169_SUMMARY_PATH}`]) !== PLAN169_SUMMARY_BLOB ||
    git(repoRoot, ["rev-parse", `HEAD:${PLAN169_SUMMARY_PATH}`]) !== PLAN169_SUMMARY_BLOB ||
    `sha256:${sha256File(path.resolve(repoRoot, PLAN169_SUMMARY_PATH))}` !== PLAN169_SUMMARY_ROOT
  ) throw new TypeError("LEAN_PLAN169_SUMMARY_DRIFT")
}
const buildLeanCorrectiveManifestV6 = (repoRoot: string, sourceRef: string, effects: LeanCorrectiveFreshEffectsV6): LeanCorrectiveManifestV6 => {
  assertPlan169Summary(repoRoot)
  const failedManifestV5 = checkRecordedLeanCorrectiveManifestV5(repoRoot, readJson(repoRoot, LEAN_CORRECTIVE_V5_ARTIFACT_PATHS.manifest))
  const failedReviewV5 = checkLeanCorrectiveSourceReviewV5(failedManifestV5, readJson(repoRoot, LEAN_CORRECTIVE_V5_ARTIFACT_PATHS.sourceReview))
  if (failedReviewV5.findingCount !== 4 || failedReviewV5.findings.map(({ id }) => id).join("\0") !== ["CR-170-01", "CR-170-02", "CR-170-03", "WR-170-01"].join("\0")) throw new TypeError("LEAN_CORRECTIVE_FAILED_V5_REVIEW_DRIFT")
  const base = renderLeanManifest(repoRoot, sourceRef)
  return {
    ...base,
    schemaVersion: "v1.38-lean-runner-corrective-source-manifest-v6",
    plan169Summary: { commit: PLAN169_SUMMARY_COMMIT, blob: PLAN169_SUMMARY_BLOB, contentRoot: PLAN169_SUMMARY_ROOT },
    predecessorRoots: {
      ...failedManifestV5.predecessorRoots,
      failedManifestV5Root: hashLeanValue(failedManifestV5),
      failedReviewV5Root: hashLeanValue(failedReviewV5),
    },
    successorLockCount: 36,
    freshCorrectiveEffects: effects,
  }
}
export const renderLeanCorrectiveManifestV6 = (repoRoot: string, sourceRef: string): LeanCorrectiveManifestV6 => {
  const effects = deriveLeanCorrectiveFreshEffectsV6(repoRoot)
  if (!noCorrectiveFreshEffectsV6(effects)) throw new TypeError("LEAN_CORRECTIVE_MANIFEST_V6_EFFECT_PRESENT")
  return buildLeanCorrectiveManifestV6(repoRoot, sourceRef, effects)
}
export const checkLeanCorrectiveManifestV6 = (repoRoot: string, value: unknown): LeanCorrectiveManifestV6 => {
  assertPrivacySafe(value)
  if (!isObject(value) || value.schemaVersion !== "v1.38-lean-runner-corrective-source-manifest-v6" || !isObject(value.source) || !isOid(value.source.commit)) throw new TypeError("LEAN_CORRECTIVE_MANIFEST_V6_INVALID")
  const expected = renderLeanCorrectiveManifestV6(repoRoot, value.source.commit)
  if (JSON.stringify(value) !== JSON.stringify(expected)) throw new TypeError("LEAN_CORRECTIVE_MANIFEST_V6_DRIFT")
  assertSuccessorLockInventory(repoRoot)
  return globalThis.structuredClone(value) as unknown as LeanCorrectiveManifestV6
}
const checkRecordedLeanCorrectiveManifestV6 = (repoRoot: string, value: unknown): LeanCorrectiveManifestV6 => {
  if (!isObject(value) || value.schemaVersion !== "v1.38-lean-runner-corrective-source-manifest-v6" || !isObject(value.source) || !isOid(value.source.commit)) throw new TypeError("LEAN_CORRECTIVE_MANIFEST_V6_INVALID")
  const expected = buildLeanCorrectiveManifestV6(repoRoot, value.source.commit, {
    readinessV6Present: false, invocationV2Present: false, terminalV2Present: false,
    adjudicationV2Present: false, eligibilityV2Present: false, childOwnershipPresent: false,
  })
  if (JSON.stringify(value) !== JSON.stringify(expected)) throw new TypeError("LEAN_CORRECTIVE_MANIFEST_V6_DRIFT")
  return globalThis.structuredClone(value) as unknown as LeanCorrectiveManifestV6
}
export const checkLeanCorrectiveSourceReviewV6 = (manifest: LeanCorrectiveManifestV6, value: unknown): LeanCorrectiveSourceReviewV6 => {
  assertPrivacySafe(value)
  const validFinding = (finding: unknown): boolean => isObject(finding) && exactKeys(finding, ["id", "severity", "status", "summary"]) && typeof finding.id === "string" && finding.id.length > 0 && ["critical", "warning"].includes(String(finding.severity)) && finding.status === "open" && typeof finding.summary === "string" && finding.summary.length > 0
  if (!isObject(value) || !exactKeys(value, ["schemaVersion", "sourceCommit", "sourceTree", "manifestRoot", "findingCount", "findings", "admitsExecution", "authority"]) || value.schemaVersion !== "v1.38-lean-runner-corrective-source-review-v6" || value.sourceCommit !== manifest.source.commit || value.sourceTree !== manifest.source.tree || value.manifestRoot !== hashLeanValue(manifest) || !Number.isSafeInteger(value.findingCount) || (value.findingCount as number) < 0 || !Array.isArray(value.findings) || value.findings.length !== value.findingCount || !value.findings.every(validFinding) || new Set(value.findings.map((finding) => (finding as Record<string, unknown>).id)).size !== value.findings.length || value.admitsExecution !== false || !exactFalseAuthority(value.authority)) throw new TypeError("LEAN_CORRECTIVE_SOURCE_REVIEW_V6_INVALID")
  return globalThis.structuredClone(value) as unknown as LeanCorrectiveSourceReviewV6
}
export const renderLeanCorrectiveSourceReviewV6 = (manifest: LeanCorrectiveManifestV6, findings: readonly LeanReviewFinding[]): LeanCorrectiveSourceReviewV6 => checkLeanCorrectiveSourceReviewV6(manifest, {
  schemaVersion: "v1.38-lean-runner-corrective-source-review-v6", sourceCommit: manifest.source.commit,
  sourceTree: manifest.source.tree, manifestRoot: hashLeanValue(manifest), findingCount: findings.length,
  findings, admitsExecution: false, authority: LEAN_AUTHORITY_FALSE,
})
export const checkLeanCorrectiveReadinessV6 = (manifest: LeanCorrectiveManifestV6, reviewValue: unknown, value: unknown): LeanCorrectiveReadiness => {
  const review = checkLeanCorrectiveSourceReviewV6(manifest, reviewValue)
  if (review.findingCount !== 0 || !isObject(value) || !exactKeys(value, ["schemaVersion", "sourceCommit", "manifestRoot", "sourceReviewRoot", "findingCount", "plan158Eligible", "correctiveInvocationLimit", "correctiveInvocationsConsumed", "recoveryOnlyLimit", "authority"]) || value.schemaVersion !== "v1.38-lean-runner-corrective-readiness-v6" || value.sourceCommit !== manifest.source.commit || value.manifestRoot !== hashLeanValue(manifest) || value.sourceReviewRoot !== hashLeanValue(review) || value.findingCount !== 0 || value.plan158Eligible !== true || value.correctiveInvocationLimit !== 1 || value.correctiveInvocationsConsumed !== 0 || value.recoveryOnlyLimit !== 1 || !exactFalseAuthority(value.authority)) throw new TypeError("LEAN_CORRECTIVE_READINESS_V6_INVALID")
  return globalThis.structuredClone(value) as unknown as LeanCorrectiveReadiness
}
export const renderLeanCorrectiveReadinessV6 = (manifest: LeanCorrectiveManifestV6, reviewValue: unknown): LeanCorrectiveReadiness => {
  const review = checkLeanCorrectiveSourceReviewV6(manifest, reviewValue)
  return checkLeanCorrectiveReadinessV6(manifest, review, { schemaVersion: "v1.38-lean-runner-corrective-readiness-v6", sourceCommit: manifest.source.commit, manifestRoot: hashLeanValue(manifest), sourceReviewRoot: hashLeanValue(review), findingCount: 0, plan158Eligible: true, correctiveInvocationLimit: 1, correctiveInvocationsConsumed: 0, recoveryOnlyLimit: 1, authority: LEAN_AUTHORITY_FALSE })
}
export const checkLeanCorrectiveReviewOutcomeV6 = (manifest: LeanCorrectiveManifestV6, reviewValue: unknown, readinessValue: unknown): LeanCorrectiveReadiness | undefined => {
  const review = checkLeanCorrectiveSourceReviewV6(manifest, reviewValue)
  if (review.findingCount !== 0) {
    if (readinessValue !== undefined) throw new TypeError("LEAN_CORRECTIVE_NONZERO_REVIEW_V6_READINESS_FORBIDDEN")
    return undefined
  }
  if (readinessValue === undefined) throw new TypeError("LEAN_CORRECTIVE_ZERO_REVIEW_V6_READINESS_REQUIRED")
  return checkLeanCorrectiveReadinessV6(manifest, review, readinessValue)
}
export const checkLeanCorrectiveSourceOnlyV6 = (repoRoot: string): void => {
  checkLeanFirstEvidenceCustody(repoRoot)
  validateLeanDiagnosticCustody(readJson(repoRoot, LEAN_DIAGNOSTIC_CUSTODY_PATH))
  assertPlan169Summary(repoRoot)
  const failedManifest = checkRecordedLeanCorrectiveManifestV5(repoRoot, readJson(repoRoot, LEAN_CORRECTIVE_V5_ARTIFACT_PATHS.manifest))
  if (checkLeanCorrectiveReviewOutcomeV5(failedManifest, readJson(repoRoot, LEAN_CORRECTIVE_V5_ARTIFACT_PATHS.sourceReview), undefined) !== undefined) throw new TypeError("LEAN_CORRECTIVE_FAILED_V5_REVIEW_DRIFT")
  for (const artifactPath of Object.values(LEAN_CORRECTIVE_V6_ARTIFACT_PATHS)) if (existsSync(path.resolve(repoRoot, artifactPath))) throw new TypeError(`LEAN_CORRECTIVE_V6_DESTINATION_EXISTS:${artifactPath}`)
  if (!noCorrectiveFreshEffectsV6(deriveLeanCorrectiveFreshEffectsV6(repoRoot))) throw new TypeError("LEAN_CORRECTIVE_V6_EFFECT_PRESENT")
  assertSuccessorLockInventory(repoRoot)
}

const PLAN172_REVIEW_SHA256 = "54a33fb359f4aa0851da82cd9d8ff6f6aa04d1d905b8467e36b096c21432113c" as const
const DIRECT_FIX_COMMITS = Object.freeze({
  arenaAliasFixCommit: "e33c70b5d7888f3b1275f09c7558b3d6d052b26b",
  terrainProjectionFixCommit: "40599f1aa8d8b3fa55622e2b016d28cc0b6a9077",
} as const)
const directEffectState = Object.freeze({
  reviewPresent: false,
  invocationPresent: false,
  terminalPresent: false,
  adjudicationPresent: false,
  eligibilityPresent: false,
} as const)
const plan172Findings = (repoRoot: string): LeanDirectAuthorization["plan172Review"]["findings"] => {
  const target = path.resolve(repoRoot, LEAN_CORRECTIVE_V6_ARTIFACT_PATHS.sourceReview)
  if (sha256File(target) !== PLAN172_REVIEW_SHA256) throw new TypeError("LEAN_DIRECT_PLAN172_REVIEW_DRIFT")
  const raw = readJson(repoRoot, LEAN_CORRECTIVE_V6_ARTIFACT_PATHS.sourceReview)
  if (!isObject(raw) || raw.schemaVersion !== "v1.38-lean-runner-corrective-source-review-v6" || raw.findingCount !== 5 || !Array.isArray(raw.findings)) throw new TypeError("LEAN_DIRECT_PLAN172_REVIEW_INVALID")
  const expected = [
    ["CR-V6-01", "critical"], ["CR-V6-02", "critical"], ["CR-V6-03", "critical"],
    ["CR-V6-04", "critical"], ["WR-V6-01", "warning"],
  ] as const
  return raw.findings.map((finding, index) => {
    if (!isObject(finding) || finding.id !== expected[index]?.[0] || finding.severity !== expected[index]?.[1] || finding.status !== "open") throw new TypeError("LEAN_DIRECT_PLAN172_FINDING_DRIFT")
    return {
      id: finding.id,
      severity: finding.severity,
      status: finding.status,
      disposition: "certification_only_nonblocking_under_D_34L_1",
    } as LeanDirectAuthorization["plan172Review"]["findings"][number]
  })
}
const buildLeanDirectAuthorization = (repoRoot: string, sourceRef: string): LeanDirectAuthorization => {
  const manifest = renderLeanManifest(repoRoot, sourceRef)
  const schedule = buildLeanSchedule()
  const arenaMap = [...new Map(schedule.map((cell) => [cell.arenaId, {
    declaredArenaId: cell.arenaId,
    executionArenaId: cell.executionArenaId,
    semanticGeometryHash: cell.semanticGeometryHash,
  }])).values()]
  return {
    schemaVersion: "v1.38-lean-runner-direct-authorization-v1",
    claimClass: "fixture_feasibility_only",
    source: manifest.source,
    plan172Review: {
      path: LEAN_CORRECTIVE_V6_ARTIFACT_PATHS.sourceReview,
      root: `sha256:${PLAN172_REVIEW_SHA256}`,
      findingCount: 5,
      findings: plan172Findings(repoRoot),
    },
    immutableHistory: {
      firstInvocationRoot: hashLeanValue(readJson(repoRoot, LEAN_ARTIFACT_PATHS.invocation)),
      firstTerminalRoot: hashLeanValue(readJson(repoRoot, LEAN_ARTIFACT_PATHS.terminal)),
      firstAdjudicationRoot: hashLeanValue(readJson(repoRoot, LEAN_ARTIFACT_PATHS.adjudication)),
      diagnosisCustodyRoot: hashLeanValue(validateLeanDiagnosticCustody(readJson(repoRoot, LEAN_DIAGNOSTIC_CUSTODY_PATH))),
      ...DIRECT_FIX_COMMITS,
    },
    selectedTuple: manifest.selectedTuple,
    fixtures: manifest.fixtures,
    arenas: arenaMap,
    schedule: {
      root: manifest.scheduleRoot,
      uniqueCells: 12,
      passes: ["A", "B"],
      chargedMatches: 24,
      sides: ["starter_bottom", "starter_top"],
      initiativeParities: ["bottom", "top"],
    },
    formation: manifest.formation,
    runtimeLimitsRoot: manifest.runtimeLimitsRoot,
    normalization: manifest.normalization,
    deadlineMilliseconds: 900000,
    privacy: "safe_aggregate_only",
    historicalFullMatrix: manifest.historicalFullMatrix,
    successorLockCount: 36,
    invocations: { allowed: 1, consumed: 0, recoveryAuthorized: false, partialReuseAuthorized: false, relaunchAuthorized: false },
    freshEffects: directEffectState,
    authority: LEAN_AUTHORITY_FALSE,
  }
}
export const renderLeanDirectAuthorization = (repoRoot: string, sourceRef: string): LeanDirectAuthorization => {
  for (const artifactPath of Object.values(LEAN_DIRECT_ARTIFACT_PATHS)) if (existsSync(path.resolve(repoRoot, artifactPath))) throw new TypeError(`LEAN_DIRECT_DESTINATION_EXISTS:${artifactPath}`)
  assertSuccessorLockInventory(repoRoot)
  return buildLeanDirectAuthorization(repoRoot, sourceRef)
}
export const validateLeanDirectAuthorization = (repoRoot: string, value: unknown): LeanDirectAuthorization => {
  assertPrivacySafe(value)
  if (!isObject(value) || !exactKeys(value, ["schemaVersion", "claimClass", "source", "plan172Review", "immutableHistory", "selectedTuple", "fixtures", "arenas", "schedule", "formation", "runtimeLimitsRoot", "normalization", "deadlineMilliseconds", "privacy", "historicalFullMatrix", "successorLockCount", "invocations", "freshEffects", "authority"]) || value.schemaVersion !== "v1.38-lean-runner-direct-authorization-v1" || !isObject(value.source) || !isOid(value.source.commit)) throw new TypeError("LEAN_DIRECT_AUTHORIZATION_INVALID")
  const expected = buildLeanDirectAuthorization(repoRoot, value.source.commit)
  if (JSON.stringify(value) !== JSON.stringify(expected)) throw new TypeError("LEAN_DIRECT_AUTHORIZATION_DRIFT")
  return globalThis.structuredClone(value) as unknown as LeanDirectAuthorization
}
export const checkLeanDirectAuthorization = (repoRoot: string, value: unknown): LeanDirectAuthorization => {
  const authorization = validateLeanDirectAuthorization(repoRoot, value)
  checkLeanManifest(repoRoot, renderLeanManifest(repoRoot, authorization.source.commit))
  assertLeanCorrectiveTrackedBytes(repoRoot, authorization.source.commit)
  assertSuccessorLockInventory(repoRoot)
  return authorization
}
export const writeLeanDirectAuthorization = (repoRoot: string, sourceRef: string): LeanDirectAuthorization => {
  const authorization = renderLeanDirectAuthorization(repoRoot, sourceRef)
  writeExclusiveDurable(path.resolve(repoRoot, LEAN_DIRECT_ARTIFACT_PATHS.authorization), authorization)
  return authorization
}
export const checkLeanDirectSourceOnly = (repoRoot: string): void => {
  checkLeanFirstEvidenceCustody(repoRoot)
  validateLeanDiagnosticCustody(readJson(repoRoot, LEAN_DIAGNOSTIC_CUSTODY_PATH))
  plan172Findings(repoRoot)
  for (const commit of Object.values(DIRECT_FIX_COMMITS)) execFileSync("git", ["cat-file", "-e", `${commit}^{commit}`], { cwd: repoRoot, stdio: "ignore" })
  for (const artifactPath of Object.values(LEAN_DIRECT_ARTIFACT_PATHS)) if (existsSync(path.resolve(repoRoot, artifactPath))) throw new TypeError(`LEAN_DIRECT_DESTINATION_EXISTS:${artifactPath}`)
  const schedule = buildLeanSchedule()
  if (schedule.length !== 24 || new Set(schedule.map(({ baseCellId }) => baseCellId)).size !== 12 || new Set(schedule.map(({ chargedIdentity }) => chargedIdentity)).size !== 24) throw new TypeError("LEAN_DIRECT_SCHEDULE_DRIFT")
  assertSuccessorLockInventory(repoRoot)
}

const LEAN_DIRECT_V1_AUTHORIZATION_ROOT = "sha256:3c546e446e8f5fb9f062676d88ebf18b58ccf2070c6d9faa636fe8312634c04c" as const
const LEAN_DIRECT_V1_REVIEW_ROOT = "sha256:8c0b81a777ec5b5513a4afbf582906f7d19a12e8102b1e1688d12e39f453d073" as const
const LEAN_PLAN177_RUNNABLE_PATHS = Object.freeze([
  "scripts/lib/v1-38-lean-container-match-session.ts",
  "scripts/lib/v1-38-lean-container-match-session.test.ts",
  "scripts/run-v1-38-lean-runner-feasibility.ts",
  "scripts/run-v1-38-lean-runner-feasibility.test.ts",
  "scripts/check-v1-38-lean-admission.ts",
  "scripts/check-v1-38-lean-admission.test.ts",
] as const)

export const validateLeanDirectV2ExplicitSourceRef = (value: string | undefined): string => {
  if (value === undefined || value === "HEAD" || !/^[0-9a-f]{40}$/u.test(value)) throw new TypeError("LEAN_DIRECT_V2_EXPLICIT_SOURCE_REQUIRED")
  return value
}
export const commitTouchesLeanRunnableSource = (paths: readonly string[]): boolean =>
  paths.some((candidate) => LEAN_PLAN177_RUNNABLE_PATHS.includes(candidate as typeof LEAN_PLAN177_RUNNABLE_PATHS[number]))

const assertDeniedDirectV1History = (repoRoot: string): void => {
  const authorization = readJson(repoRoot, LEAN_DIRECT_ARTIFACT_PATHS.authorization)
  const review = readJson(repoRoot, LEAN_DIRECT_ARTIFACT_PATHS.review)
  if (hashLeanValue(authorization) !== LEAN_DIRECT_V1_AUTHORIZATION_ROOT || hashLeanValue(review) !== LEAN_DIRECT_V1_REVIEW_ROOT) throw new TypeError("LEAN_DIRECT_V1_HISTORY_DRIFT")
  if (!isObject(authorization) || authorization.schemaVersion !== "v1.38-lean-runner-direct-authorization-v1" || !isObject(review) || review.schemaVersion !== "v1.38-lean-runner-direct-validity-review-v1" || review.admitsPlan175 !== false || review.blockingFindingCount !== 2) throw new TypeError("LEAN_DIRECT_V1_HISTORY_REINTERPRETED")
}

const resolveLeanDirectV2Source = (repoRoot: string, explicitRef: string, rejectCurrentHead: boolean): LeanManifest["source"] => {
  const requested = validateLeanDirectV2ExplicitSourceRef(explicitRef)
  const commit = git(repoRoot, ["rev-parse", `${requested}^{commit}`])
  if (commit !== requested) throw new TypeError("LEAN_DIRECT_V2_SOURCE_OID_DRIFT")
  const head = git(repoRoot, ["rev-parse", "HEAD^{commit}"])
  if (rejectCurrentHead && commit === head) throw new TypeError("LEAN_DIRECT_V2_SOURCE_IS_CURRENT_HEAD")
  try { execFileSync("git", ["merge-base", "--is-ancestor", commit, head], { cwd: repoRoot, stdio: "ignore" }) } catch { throw new TypeError("LEAN_DIRECT_V2_SOURCE_NOT_ANCESTOR") }
  const changedPaths = git(repoRoot, ["diff-tree", "--root", "--no-commit-id", "--name-only", "-r", commit]).split("\n").filter(Boolean)
  if (!commitTouchesLeanRunnableSource(changedPaths)) throw new TypeError("LEAN_DIRECT_V2_SOURCE_DOCUMENTATION_ONLY")
  const source = renderLeanManifest(repoRoot, commit).source
  for (const [sourcePath, oid] of Object.entries(source.executableBlobs)) {
    if (git(repoRoot, ["rev-parse", `HEAD:${sourcePath}`]) !== oid) throw new TypeError(`LEAN_DIRECT_V2_SOURCE_CLOSURE_DRIFT:${sourcePath}`)
  }
  return source
}

const resolveLeanDirectV4Source = (repoRoot: string, explicitRef: string, rejectCurrentHead: boolean): LeanManifest["source"] => {
  const requested = validateLeanDirectV2ExplicitSourceRef(explicitRef)
  const commit = git(repoRoot, ["rev-parse", `${requested}^{commit}`])
  if (commit !== requested) throw new TypeError("LEAN_DIRECT_V4_SOURCE_OID_DRIFT")
  const head = git(repoRoot, ["rev-parse", "HEAD^{commit}"])
  if (rejectCurrentHead && commit === head) throw new TypeError("LEAN_DIRECT_V4_SOURCE_IS_CURRENT_HEAD")
  try { execFileSync("git", ["merge-base", "--is-ancestor", commit, head], { cwd: repoRoot, stdio: "ignore" }) } catch { throw new TypeError("LEAN_DIRECT_V4_SOURCE_NOT_ANCESTOR") }
  const changedPaths = git(repoRoot, ["diff-tree", "--root", "--no-commit-id", "--name-only", "-r", commit]).split("\n").filter(Boolean)
  if (!commitTouchesLeanRunnableSource(changedPaths)) throw new TypeError("LEAN_DIRECT_V4_SOURCE_DOCUMENTATION_ONLY")
  const source: LeanManifest["source"] = {
    commit,
    tree: git(repoRoot, ["show", "-s", "--format=%T", commit]),
    executableBlobs: Object.fromEntries(LEAN_DIRECT_V4_EXECUTABLE_CLOSURE_PATHS.map((sourcePath) => [sourcePath, git(repoRoot, ["rev-parse", `${commit}:${sourcePath}`])])),
  }
  for (const [sourcePath, oid] of Object.entries(source.executableBlobs)) {
    if (git(repoRoot, ["rev-parse", `HEAD:${sourcePath}`]) !== oid) throw new TypeError(`LEAN_DIRECT_V4_SOURCE_CLOSURE_DRIFT:${sourcePath}`)
  }
  return source
}

const assertLeanDirectV4TrackedBytes = (repoRoot: string, sourceCommit: string): void => {
  try {
    execFileSync("git", ["diff", "--quiet", sourceCommit, "--", ...LEAN_DIRECT_V4_EXECUTABLE_CLOSURE_PATHS], { cwd: repoRoot, stdio: "ignore" })
  } catch { throw new TypeError("LEAN_DIRECT_V4_TRACKED_BYTES_DRIFT") }
}

const validateLeanContainerPreflightEvidence = (value: unknown): LeanContainerPreflightEvidence => {
  if (!isObject(value) || !exactKeys(value, ["status", "dockerServerVersion", "imageReference", "adapterId", "controlsRoot", "sampleCount", "sampleRoot", "methodCeilings", "startupCleanupMarginMilliseconds", "projectedCellMilliseconds", "projectedRunMilliseconds", "cellDeadlineMilliseconds", "outerDeadlineMilliseconds"]) || value.status !== "pass" || value.imageReference !== LEAN_CONTAINER_IMAGE || value.adapterId !== LEAN_CONTAINER_ADAPTER_ID || value.controlsRoot !== hashLeanValue(LEAN_CONTAINER_CONTROLS) || JSON.stringify(value.methodCeilings) !== JSON.stringify(LEAN_CONTAINER_METHOD_CEILINGS) || value.startupCleanupMarginMilliseconds !== LEAN_CONTAINER_STARTUP_CLEANUP_MARGIN_MS || value.cellDeadlineMilliseconds !== LEAN_CELL_DEADLINE_MS || value.outerDeadlineMilliseconds !== 900000 || !Number.isSafeInteger(value.sampleCount) || (value.sampleCount as number) < 4 || !isSha(value.sampleRoot) || !Number.isFinite(value.projectedCellMilliseconds) || !Number.isFinite(value.projectedRunMilliseconds) || (value.projectedCellMilliseconds as number) > LEAN_CELL_DEADLINE_MS || (value.projectedRunMilliseconds as number) > 900000 || typeof value.dockerServerVersion !== "string") throw new TypeError("LEAN_DIRECT_V2_PREFLIGHT_INVALID")
  return globalThis.structuredClone(value) as unknown as LeanContainerPreflightEvidence
}

export const renderLeanContainerPreflightArtifact = (repoRoot: string, explicitSourceRef: string, evidence: unknown): LeanContainerPreflightArtifact => {
  const source = resolveLeanDirectV2Source(repoRoot, explicitSourceRef, true)
  return {
    schemaVersion: "v1.38-lean-runner-container-preflight-v1",
    sourceCommit: source.commit,
    sourceTree: source.tree,
    executableClosureRoot: hashLeanValue(source.executableBlobs),
    preflight: validateLeanContainerPreflightEvidence(evidence),
    consuming: false,
    matchInvocations: 0,
    authority: LEAN_AUTHORITY_FALSE,
  }
}
export const validateLeanContainerPreflightArtifact = (repoRoot: string, value: unknown): LeanContainerPreflightArtifact => {
  assertPrivacySafe(value)
  if (!isObject(value) || !exactKeys(value, ["schemaVersion", "sourceCommit", "sourceTree", "executableClosureRoot", "preflight", "consuming", "matchInvocations", "authority"]) || value.schemaVersion !== "v1.38-lean-runner-container-preflight-v1" || !isOid(value.sourceCommit) || !isOid(value.sourceTree) || !isSha(value.executableClosureRoot) || value.consuming !== false || value.matchInvocations !== 0 || !exactFalseAuthority(value.authority)) throw new TypeError("LEAN_DIRECT_V2_PREFLIGHT_INVALID")
  const expected = renderLeanContainerPreflightArtifact(repoRoot, value.sourceCommit, value.preflight)
  if (JSON.stringify(value) !== JSON.stringify(expected)) throw new TypeError("LEAN_DIRECT_V2_PREFLIGHT_DRIFT")
  return globalThis.structuredClone(value) as unknown as LeanContainerPreflightArtifact
}
export const writeLeanContainerPreflightArtifact = (repoRoot: string, explicitSourceRef: string, evidence: unknown): LeanContainerPreflightArtifact => {
  const artifact = renderLeanContainerPreflightArtifact(repoRoot, explicitSourceRef, evidence)
  writeExclusiveDurable(path.resolve(repoRoot, LEAN_DIRECT_V2_ARTIFACT_PATHS.preflight), artifact)
  return artifact
}

const buildLeanDirectAuthorizationV2 = (repoRoot: string, explicitSourceRef: string, preflight: LeanContainerPreflightArtifact): LeanDirectAuthorizationV2 => {
  const source = resolveLeanDirectV2Source(repoRoot, explicitSourceRef, true)
  if (preflight.sourceCommit !== source.commit || preflight.sourceTree !== source.tree || preflight.executableClosureRoot !== hashLeanValue(source.executableBlobs)) throw new TypeError("LEAN_DIRECT_V2_PREFLIGHT_SOURCE_DRIFT")
  const base = buildLeanDirectAuthorization(repoRoot, source.commit)
  return {
    ...base,
    schemaVersion: "v1.38-lean-runner-direct-authorization-v2",
    source,
    containerPreflight: { path: LEAN_DIRECT_V2_ARTIFACT_PATHS.preflight, root: hashLeanValue(preflight) },
    runtimeBoundary: {
      registryAdapterId: "runtime-js-container-subprocess",
      serviceAdapterId: LEAN_CONTAINER_ADAPTER_ID,
      image: LEAN_CONTAINER_IMAGE,
      controlsRoot: hashLeanValue(LEAN_CONTAINER_CONTROLS),
      methodCeilings: LEAN_CONTAINER_METHOD_CEILINGS,
      startupCleanupMarginMilliseconds: LEAN_CONTAINER_STARTUP_CLEANUP_MARGIN_MS,
      cellDeadlineMilliseconds: LEAN_CELL_DEADLINE_MS,
      outerDeadlineMilliseconds: 900000,
    },
    plan174History: {
      authorizationPath: LEAN_DIRECT_ARTIFACT_PATHS.authorization,
      authorizationRoot: LEAN_DIRECT_V1_AUTHORIZATION_ROOT,
      reviewPath: LEAN_DIRECT_ARTIFACT_PATHS.review,
      reviewRoot: LEAN_DIRECT_V1_REVIEW_ROOT,
      status: "denied_preserved",
      resolvedByNewSource: ["CR-01", "CR-02"],
    },
  }
}
export const renderLeanDirectAuthorizationV2 = (repoRoot: string, explicitSourceRef: string): LeanDirectAuthorizationV2 => {
  assertDeniedDirectV1History(repoRoot)
  if (!existsSync(path.resolve(repoRoot, LEAN_DIRECT_V2_ARTIFACT_PATHS.preflight))) throw new TypeError("LEAN_DIRECT_V2_PREFLIGHT_REQUIRED")
  for (const artifactPath of Object.values(LEAN_DIRECT_V2_ARTIFACT_PATHS).filter((candidate) => candidate !== LEAN_DIRECT_V2_ARTIFACT_PATHS.preflight)) if (existsSync(path.resolve(repoRoot, artifactPath))) throw new TypeError(`LEAN_DIRECT_V2_DESTINATION_EXISTS:${artifactPath}`)
  return buildLeanDirectAuthorizationV2(repoRoot, explicitSourceRef, validateLeanContainerPreflightArtifact(repoRoot, readJson(repoRoot, LEAN_DIRECT_V2_ARTIFACT_PATHS.preflight)))
}
export const validateLeanDirectAuthorizationV2 = (repoRoot: string, value: unknown): LeanDirectAuthorizationV2 => {
  assertPrivacySafe(value)
  if (!isObject(value) || value.schemaVersion !== "v1.38-lean-runner-direct-authorization-v2" || !isObject(value.source) || !isOid(value.source.commit)) throw new TypeError("LEAN_DIRECT_V2_AUTHORIZATION_INVALID")
  const preflight = validateLeanContainerPreflightArtifact(repoRoot, readJson(repoRoot, LEAN_DIRECT_V2_ARTIFACT_PATHS.preflight))
  const expected = buildLeanDirectAuthorizationV2(repoRoot, value.source.commit, preflight)
  if (JSON.stringify(value) !== JSON.stringify(expected)) throw new TypeError("LEAN_DIRECT_V2_AUTHORIZATION_DRIFT")
  return globalThis.structuredClone(value) as unknown as LeanDirectAuthorizationV2
}
export const writeLeanDirectAuthorizationV2 = (repoRoot: string, explicitSourceRef: string): LeanDirectAuthorizationV2 => {
  const authorization = renderLeanDirectAuthorizationV2(repoRoot, validateLeanDirectV2ExplicitSourceRef(explicitSourceRef))
  writeExclusiveDurable(path.resolve(repoRoot, LEAN_DIRECT_V2_ARTIFACT_PATHS.authorization), authorization)
  return authorization
}

export const checkLeanDirectContainerSourceOnlyV2 = (repoRoot: string): void => {
  assertLeanStatus(git(repoRoot, ["status", "--short", "--untracked-files=all"]))
  checkLeanFirstEvidenceCustody(repoRoot)
  assertDeniedDirectV1History(repoRoot)
  for (const artifactPath of Object.values(LEAN_DIRECT_V2_ARTIFACT_PATHS).filter((candidate) => candidate !== LEAN_DIRECT_V2_ARTIFACT_PATHS.review)) if (existsSync(path.resolve(repoRoot, artifactPath))) throw new TypeError(`LEAN_DIRECT_V2_DESTINATION_EXISTS:${artifactPath}`)
  const latest = git(repoRoot, ["log", "-1", "--format=%H", "--", ...LEAN_PLAN177_RUNNABLE_PATHS])
  const source = resolveLeanDirectV2Source(repoRoot, latest, false)
  if (source.commit !== latest) throw new TypeError("LEAN_DIRECT_V2_SOURCE_DRIFT")
  assertSuccessorLockInventory(repoRoot)
}
export const checkLeanDirectValidityReview = (authorization: LeanDirectAuthorization, value: unknown): LeanDirectValidityReview => {
  assertPrivacySafe(value)
  if (!isObject(value) || !exactKeys(value, ["schemaVersion", "authorizationRoot", "sourceCommit", "sourceTree", "categories", "blockingFindingCount", "certificationOnlyHistory", "admitsPlan175", "authority"]) || value.schemaVersion !== "v1.38-lean-runner-direct-validity-review-v1" || value.authorizationRoot !== hashLeanValue(authorization) || value.sourceCommit !== authorization.source.commit || value.sourceTree !== authorization.source.tree || !Array.isArray(value.categories) || value.categories.length !== LEAN_DIRECT_VALIDITY_CATEGORIES.length || !Number.isSafeInteger(value.blockingFindingCount) || (value.blockingFindingCount as number) < 0 || JSON.stringify(value.certificationOnlyHistory) !== JSON.stringify(authorization.plan172Review.findings) || !exactFalseAuthority(value.authority)) throw new TypeError("LEAN_DIRECT_VALIDITY_REVIEW_INVALID")
  const categories = value.categories as unknown[]
  for (const [index, expected] of LEAN_DIRECT_VALIDITY_CATEGORIES.entries()) {
    const item = categories[index]
    if (!isObject(item) || !exactKeys(item, ["category", "status", "evidence"]) || item.category !== expected || !["pass", "finding"].includes(String(item.status)) || typeof item.evidence !== "string" || item.evidence.length === 0) throw new TypeError("LEAN_DIRECT_VALIDITY_REVIEW_INVALID")
  }
  const count = categories.filter((item) => isObject(item) && item.status === "finding").length
  if (value.blockingFindingCount !== count || value.admitsPlan175 !== (count === 0)) throw new TypeError("LEAN_DIRECT_VALIDITY_REVIEW_INVALID")
  return globalThis.structuredClone(value) as unknown as LeanDirectValidityReview
}
export const loadAndCheckLeanDirectReviewedReady = (repoRoot: string, allowedOperationalPaths: readonly string[] = []): { authorization: LeanDirectAuthorization, review: LeanDirectValidityReview } => {
  assertLeanStatus(git(repoRoot, ["status", "--short", "--untracked-files=all"]), allowedOperationalPaths)
  for (const artifactPath of [LEAN_DIRECT_ARTIFACT_PATHS.invocation, LEAN_DIRECT_ARTIFACT_PATHS.terminal, LEAN_DIRECT_ARTIFACT_PATHS.adjudication, LEAN_DIRECT_ARTIFACT_PATHS.eligibility]) {
    if (!allowedOperationalPaths.includes(artifactPath) && existsSync(path.resolve(repoRoot, artifactPath))) throw new TypeError(`LEAN_DIRECT_EFFECT_EXISTS:${artifactPath}`)
  }
  const authorization = checkLeanDirectAuthorization(repoRoot, readJson(repoRoot, LEAN_DIRECT_ARTIFACT_PATHS.authorization))
  const review = checkLeanDirectValidityReview(authorization, readJson(repoRoot, LEAN_DIRECT_ARTIFACT_PATHS.review))
  if (!review.admitsPlan175 || review.blockingFindingCount !== 0) throw new TypeError("LEAN_DIRECT_PLAN175_NOT_ADMITTED")
  return { authorization, review }
}
export const checkLeanDirectAuthorizationV2 = (repoRoot: string, value: unknown): LeanDirectAuthorizationV2 => {
  const authorization = validateLeanDirectAuthorizationV2(repoRoot, value)
  assertLeanCorrectiveTrackedBytes(repoRoot, authorization.source.commit)
  assertDeniedDirectV1History(repoRoot)
  assertSuccessorLockInventory(repoRoot)
  return authorization
}
export const checkLeanDirectValidityReviewV2 = (authorization: LeanDirectAuthorizationV2, value: unknown): LeanDirectValidityReviewV2 => {
  assertPrivacySafe(value)
  if (!isObject(value) || !exactKeys(value, ["schemaVersion", "authorizationRoot", "preflightRoot", "sourceCommit", "sourceTree", "categories", "blockingFindingCount", "certificationOnlyHistory", "admitsPlan179", "authority"]) || value.schemaVersion !== "v1.38-lean-runner-direct-validity-review-v2" || value.authorizationRoot !== hashLeanValue(authorization) || value.preflightRoot !== authorization.containerPreflight.root || value.sourceCommit !== authorization.source.commit || value.sourceTree !== authorization.source.tree || !Array.isArray(value.categories) || value.categories.length !== LEAN_DIRECT_VALIDITY_CATEGORIES.length || !Number.isSafeInteger(value.blockingFindingCount) || JSON.stringify(value.certificationOnlyHistory) !== JSON.stringify(authorization.plan172Review.findings) || !exactFalseAuthority(value.authority)) throw new TypeError("LEAN_DIRECT_V2_REVIEW_INVALID")
  for (const [index, expected] of LEAN_DIRECT_VALIDITY_CATEGORIES.entries()) {
    const item = value.categories[index]
    if (!isObject(item) || !exactKeys(item, ["category", "status", "evidence"]) || item.category !== expected || !["pass", "finding"].includes(String(item.status)) || typeof item.evidence !== "string" || item.evidence.length === 0) throw new TypeError("LEAN_DIRECT_V2_REVIEW_INVALID")
  }
  const findings = value.categories.filter((item) => isObject(item) && item.status === "finding").length
  if (value.blockingFindingCount !== findings || value.admitsPlan179 !== (findings === 0)) throw new TypeError("LEAN_DIRECT_V2_REVIEW_INVALID")
  return globalThis.structuredClone(value) as unknown as LeanDirectValidityReviewV2
}
export const loadAndCheckLeanDirectReviewedReadyV2 = (repoRoot: string, allowedOperationalPaths: readonly string[] = []): { authorization: LeanDirectAuthorizationV2, review: LeanDirectValidityReviewV2, preflight: LeanContainerPreflightArtifact } => {
  assertLeanStatus(git(repoRoot, ["status", "--short", "--untracked-files=all"]), allowedOperationalPaths)
  for (const artifactPath of [LEAN_DIRECT_V2_ARTIFACT_PATHS.invocation, LEAN_DIRECT_V2_ARTIFACT_PATHS.terminal, LEAN_DIRECT_V2_ARTIFACT_PATHS.adjudication, LEAN_DIRECT_V2_ARTIFACT_PATHS.eligibility]) if (!allowedOperationalPaths.includes(artifactPath) && existsSync(path.resolve(repoRoot, artifactPath))) throw new TypeError(`LEAN_DIRECT_V2_EFFECT_EXISTS:${artifactPath}`)
  const preflight = validateLeanContainerPreflightArtifact(repoRoot, readJson(repoRoot, LEAN_DIRECT_V2_ARTIFACT_PATHS.preflight))
  const authorization = checkLeanDirectAuthorizationV2(repoRoot, readJson(repoRoot, LEAN_DIRECT_V2_ARTIFACT_PATHS.authorization))
  const review = checkLeanDirectValidityReviewV2(authorization, readJson(repoRoot, LEAN_DIRECT_V2_ARTIFACT_PATHS.review))
  if (!review.admitsPlan179 || review.blockingFindingCount !== 0) throw new TypeError("LEAN_DIRECT_V2_PLAN179_NOT_ADMITTED")
  return { authorization, review, preflight }
}
export const createLeanDirectInvocationV2 = (authorization: LeanDirectAuthorizationV2, review: LeanDirectValidityReviewV2, childCapabilityRoot: `sha256:${string}`): LeanDirectInvocationV2 => ({
  schemaVersion: "v1.38-lean-runner-direct-invocation-v2",
  authorizationRoot: hashLeanValue(authorization), validityReviewRoot: hashLeanValue(review),
  preflightRoot: authorization.containerPreflight.root, sourceCommit: authorization.source.commit,
  childCapabilityRoot, claimClass: "fixture_feasibility_only", invocationOrdinal: 1,
  authority: LEAN_AUTHORITY_FALSE,
})
const validateLeanDirectInvocationV2 = (repoRoot: string, value: unknown): LeanDirectInvocationV2 => {
  const { authorization, review } = loadAndCheckLeanDirectReviewedReadyV2(repoRoot, [LEAN_DIRECT_V2_ARTIFACT_PATHS.invocation])
  if (!isObject(value) || JSON.stringify(value) !== JSON.stringify(createLeanDirectInvocationV2(authorization, review, value.childCapabilityRoot as `sha256:${string}`)) || !isSha(value.childCapabilityRoot)) throw new TypeError("LEAN_DIRECT_V2_INVOCATION_INVALID")
  return globalThis.structuredClone(value) as unknown as LeanDirectInvocationV2
}
export const createLeanDirectTerminalArtifactV2 = (invocation: LeanDirectInvocationV2, terminal: LeanTerminal): LeanDirectTerminalArtifactV2 => ({
  schemaVersion: "v1.38-lean-runner-direct-terminal-v2",
  authorizationRoot: invocation.authorizationRoot, validityReviewRoot: invocation.validityReviewRoot,
  preflightRoot: invocation.preflightRoot, sourceCommit: invocation.sourceCommit,
  childCapabilityRoot: invocation.childCapabilityRoot, invocationRoot: hashLeanValue(invocation),
  privacy: "safe_aggregate_only", terminal: deriveAndValidateLeanTerminal(terminal), authority: LEAN_AUTHORITY_FALSE,
})
export const createExclusiveLeanDirectTerminalV2 = (repoRoot: string, terminal: LeanDirectTerminalArtifactV2): void =>
  writeExclusiveDurable(path.resolve(repoRoot, LEAN_DIRECT_V2_ARTIFACT_PATHS.terminal), terminal)
export const checkLeanDirectPostRunV2 = (repoRoot: string): { invocation: LeanDirectInvocationV2, terminal?: LeanDirectTerminalArtifactV2, markerOnly: boolean } => {
  const invocation = validateLeanDirectInvocationV2(repoRoot, readJson(repoRoot, LEAN_DIRECT_V2_ARTIFACT_PATHS.invocation))
  if (!existsSync(path.resolve(repoRoot, LEAN_DIRECT_V2_ARTIFACT_PATHS.terminal))) return { invocation, markerOnly: true }
  const value = readJson(repoRoot, LEAN_DIRECT_V2_ARTIFACT_PATHS.terminal)
  const expectedPrefix = createLeanDirectTerminalArtifactV2(invocation, (value as LeanDirectTerminalArtifactV2).terminal)
  if (JSON.stringify(value) !== JSON.stringify(expectedPrefix)) throw new TypeError("LEAN_DIRECT_V2_TERMINAL_INVALID")
  return { invocation, terminal: value as LeanDirectTerminalArtifactV2, markerOnly: false }
}
export const checkLeanDirectAdjudicationV2 = (repoRoot: string): void => {
  const { invocation, terminal, markerOnly } = checkLeanDirectPostRunV2(repoRoot)
  const adjudication = readJson(repoRoot, LEAN_DIRECT_V2_ARTIFACT_PATHS.adjudication)
  const result = markerOnly ? "invalid" : deriveAndValidateLeanTerminal(terminal!.terminal).result
  if (!isObject(adjudication) || adjudication.schemaVersion !== "v1.38-lean-runner-direct-adjudication-v2" || adjudication.invocationRoot !== hashLeanValue(invocation) || adjudication.terminalRoot !== (terminal === undefined ? null : hashLeanValue(terminal)) || adjudication.reviewedResult !== result || adjudication.markerOnly !== markerOnly || adjudication.opportunityConsumed !== true || adjudication.admitsEligibility !== (result === "pass") || !exactFalseAuthority(adjudication.authority)) throw new TypeError("LEAN_DIRECT_V2_ADJUDICATION_INVALID")
  const eligibility = readJson(repoRoot, LEAN_DIRECT_V2_ARTIFACT_PATHS.eligibility)
  const passed = result === "pass"
  if (!isObject(eligibility) || eligibility.schemaVersion !== "v1.38-phase-262-lean-direct-eligibility-v2" || eligibility.adjudicationRoot !== hashLeanValue(adjudication) || eligibility.admit03 !== (passed ? "satisfied_under_revised_contract" : "blocked") || eligibility.phase262Complete !== passed || eligibility.phase263PlanningEligible !== passed || eligibility.phase263ExecutionEligible !== passed) throw new TypeError("LEAN_DIRECT_V2_ELIGIBILITY_INVALID")
}

const LEAN_DIRECT_PLAN178_PREFLIGHT_PATH = ".planning/artifacts/v1.38-lean-runner-direct-container-preflight-v1.json" as const
const LEAN_DIRECT_PLAN178_REVIEW_PATH = ".planning/artifacts/v1.38-lean-runner-direct-validity-review-v2.json" as const
const LEAN_DIRECT_PLAN178_PREFLIGHT_SHA256 = "f7a22597fd6661fdc4d060ae5c9447c2b33b3c63c685c3a93eec89f7cfd55953" as const
const LEAN_DIRECT_PLAN178_REVIEW_SHA256 = "e2a8bc1071d9344db43d11df3aac3c01597967f7a278a191525a4ad763fe8acb" as const

const assertLeanDirectPlan178History = (repoRoot: string): void => {
  if (sha256File(path.resolve(repoRoot, LEAN_DIRECT_PLAN178_PREFLIGHT_PATH)) !== LEAN_DIRECT_PLAN178_PREFLIGHT_SHA256 || sha256File(path.resolve(repoRoot, LEAN_DIRECT_PLAN178_REVIEW_PATH)) !== LEAN_DIRECT_PLAN178_REVIEW_SHA256) throw new TypeError("LEAN_DIRECT_PLAN178_HISTORY_DRIFT")
  const preflight = readJson(repoRoot, LEAN_DIRECT_PLAN178_PREFLIGHT_PATH)
  const review = readJson(repoRoot, LEAN_DIRECT_PLAN178_REVIEW_PATH)
  if (!isObject(preflight) || preflight.status !== "non_pass" || preflight.matchInvocations !== 0 || !exactFalseAuthority(preflight.authority) || !isObject(review) || review.admitsPlan175 !== false || review.blockingFindingCount !== 1 || !exactFalseAuthority(review.authority)) throw new TypeError("LEAN_DIRECT_PLAN178_HISTORY_REINTERPRETED")
}

const assertLeanDirectV3PathsAreFresh = (): void => {
  const historical = [...Object.values(LEAN_DIRECT_ARTIFACT_PATHS), ...Object.values(LEAN_DIRECT_V2_ARTIFACT_PATHS), LEAN_DIRECT_PLAN178_PREFLIGHT_PATH, LEAN_DIRECT_PLAN178_REVIEW_PATH]
  const fresh = Object.values(LEAN_DIRECT_V3_ARTIFACT_PATHS)
  if (new Set(fresh).size !== fresh.length || fresh.some((candidate) => historical.includes(candidate as never))) throw new TypeError("LEAN_DIRECT_V3_PATH_ALIAS")
}

export const validateLeanContainerPreflightOutcomeV2 = (value: unknown): LeanContainerPreflightOutcomeV2 => {
  if (isObject(value) && value.status === "non_pass") {
    if (!exactKeys(value, ["status", "reasonCode"]) || value.reasonCode !== "container_preflight_refused") throw new TypeError("LEAN_DIRECT_V3_PREFLIGHT_OUTCOME_INVALID")
    return globalThis.structuredClone(value) as LeanContainerPreflightOutcomeV2
  }
  return validateLeanContainerPreflightEvidence(value)
}

const buildLeanContainerPreflightArtifactV2 = (repoRoot: string, explicitSourceRef: string, outcome: unknown): LeanContainerPreflightArtifactV2 => {
  const source = resolveLeanDirectV2Source(repoRoot, explicitSourceRef, true)
  return {
    schemaVersion: "v1.38-lean-runner-direct-container-preflight-v2",
    sourceCommit: source.commit,
    sourceTree: source.tree,
    executableClosureRoot: hashLeanValue(source.executableBlobs),
    preflight: validateLeanContainerPreflightOutcomeV2(outcome),
    consuming: false,
    preflightInvocations: 1,
    matchInvocations: 0,
    authority: LEAN_AUTHORITY_FALSE,
  }
}

export const renderLeanContainerPreflightArtifactV2 = (repoRoot: string, explicitSourceRef: string, outcome: unknown): LeanContainerPreflightArtifactV2 => {
  assertLeanDirectPlan178History(repoRoot)
  assertLeanDirectV3PathsAreFresh()
  return buildLeanContainerPreflightArtifactV2(repoRoot, explicitSourceRef, outcome)
}

export const validateLeanContainerPreflightArtifactV2 = (repoRoot: string, value: unknown): LeanContainerPreflightArtifactV2 => {
  assertPrivacySafe(value)
  if (!isObject(value) || !exactKeys(value, ["schemaVersion", "sourceCommit", "sourceTree", "executableClosureRoot", "preflight", "consuming", "preflightInvocations", "matchInvocations", "authority"]) || value.schemaVersion !== "v1.38-lean-runner-direct-container-preflight-v2" || !isOid(value.sourceCommit) || !isOid(value.sourceTree) || !isSha(value.executableClosureRoot) || value.consuming !== false || value.preflightInvocations !== 1 || value.matchInvocations !== 0 || !exactFalseAuthority(value.authority)) throw new TypeError("LEAN_DIRECT_V3_PREFLIGHT_INVALID")
  const expected = buildLeanContainerPreflightArtifactV2(repoRoot, value.sourceCommit, value.preflight)
  if (JSON.stringify(value) !== JSON.stringify(expected)) throw new TypeError("LEAN_DIRECT_V3_PREFLIGHT_DRIFT")
  return globalThis.structuredClone(value) as unknown as LeanContainerPreflightArtifactV2
}

export const writeLeanContainerPreflightArtifactV2 = (repoRoot: string, explicitSourceRef: string): LeanContainerPreflightArtifactV2 => {
  assertLeanStatus(git(repoRoot, ["status", "--short", "--untracked-files=all"]))
  assertLeanDirectPlan178History(repoRoot)
  assertLeanDirectV3PathsAreFresh()
  for (const artifactPath of Object.values(LEAN_DIRECT_V3_ARTIFACT_PATHS)) if (existsSync(path.resolve(repoRoot, artifactPath))) throw new TypeError(`LEAN_DIRECT_V3_DESTINATION_EXISTS:${artifactPath}`)
  const sourceRef = validateLeanDirectV2ExplicitSourceRef(explicitSourceRef)
  const source = resolveLeanDirectV2Source(repoRoot, sourceRef, true)
  assertLeanCorrectiveTrackedBytes(repoRoot, source.commit)
  assertSuccessorLockInventory(repoRoot)
  let outcome: LeanContainerPreflightOutcomeV2
  try {
    outcome = runActualLeanContainerPreflight()
  } catch {
    outcome = { status: "non_pass", reasonCode: "container_preflight_refused" }
  }
  const artifact = renderLeanContainerPreflightArtifactV2(repoRoot, sourceRef, outcome)
  writeExclusiveDurable(path.resolve(repoRoot, LEAN_DIRECT_V3_ARTIFACT_PATHS.preflight), artifact)
  return artifact
}

const buildLeanDirectAuthorizationV3 = (repoRoot: string, explicitSourceRef: string, preflight: LeanContainerPreflightArtifactV2): LeanDirectAuthorizationV3 => {
  if (preflight.preflight.status !== "pass") throw new TypeError("LEAN_DIRECT_V3_PREFLIGHT_NOT_PASS")
  const source = resolveLeanDirectV2Source(repoRoot, explicitSourceRef, true)
  if (preflight.sourceCommit !== source.commit || preflight.sourceTree !== source.tree || preflight.executableClosureRoot !== hashLeanValue(source.executableBlobs)) throw new TypeError("LEAN_DIRECT_V3_PREFLIGHT_SOURCE_DRIFT")
  const base = buildLeanDirectAuthorization(repoRoot, source.commit)
  return {
    ...base,
    schemaVersion: "v1.38-lean-runner-direct-authorization-v3",
    source,
    containerPreflight: { path: LEAN_DIRECT_V3_ARTIFACT_PATHS.preflight, root: hashLeanValue(preflight) },
    runtimeBoundary: {
      registryAdapterId: "runtime-js-container-subprocess",
      serviceAdapterId: LEAN_CONTAINER_ADAPTER_ID,
      image: LEAN_CONTAINER_IMAGE,
      controlsRoot: hashLeanValue(LEAN_CONTAINER_CONTROLS),
      methodCeilings: LEAN_CONTAINER_METHOD_CEILINGS,
      startupCleanupMarginMilliseconds: LEAN_CONTAINER_STARTUP_CLEANUP_MARGIN_MS,
      cellDeadlineMilliseconds: LEAN_CELL_DEADLINE_MS,
      outerDeadlineMilliseconds: 900000,
    },
    plan174History: {
      authorizationPath: LEAN_DIRECT_ARTIFACT_PATHS.authorization,
      authorizationRoot: LEAN_DIRECT_V1_AUTHORIZATION_ROOT,
      reviewPath: LEAN_DIRECT_ARTIFACT_PATHS.review,
      reviewRoot: LEAN_DIRECT_V1_REVIEW_ROOT,
      status: "denied_preserved",
      resolvedByNewSource: ["CR-01", "CR-02"],
    },
    plan178History: {
      preflightPath: LEAN_DIRECT_PLAN178_PREFLIGHT_PATH,
      preflightSha256: `sha256:${LEAN_DIRECT_PLAN178_PREFLIGHT_SHA256}`,
      reviewPath: LEAN_DIRECT_PLAN178_REVIEW_PATH,
      reviewSha256: `sha256:${LEAN_DIRECT_PLAN178_REVIEW_SHA256}`,
      status: "non_pass_preserved",
    },
  }
}

export const renderLeanDirectAuthorizationV3 = (repoRoot: string, explicitSourceRef: string): LeanDirectAuthorizationV3 => {
  assertLeanDirectPlan178History(repoRoot)
  const preflight = validateLeanContainerPreflightArtifactV2(repoRoot, readJson(repoRoot, LEAN_DIRECT_V3_ARTIFACT_PATHS.preflight))
  for (const artifactPath of Object.values(LEAN_DIRECT_V3_ARTIFACT_PATHS).filter((candidate) => candidate !== LEAN_DIRECT_V3_ARTIFACT_PATHS.preflight)) if (existsSync(path.resolve(repoRoot, artifactPath))) throw new TypeError(`LEAN_DIRECT_V3_DESTINATION_EXISTS:${artifactPath}`)
  return buildLeanDirectAuthorizationV3(repoRoot, validateLeanDirectV2ExplicitSourceRef(explicitSourceRef), preflight)
}

export const validateLeanDirectAuthorizationV3 = (repoRoot: string, value: unknown): LeanDirectAuthorizationV3 => {
  assertPrivacySafe(value)
  if (!isObject(value) || value.schemaVersion !== "v1.38-lean-runner-direct-authorization-v3" || !isObject(value.source) || !isOid(value.source.commit)) throw new TypeError("LEAN_DIRECT_V3_AUTHORIZATION_INVALID")
  const preflight = validateLeanContainerPreflightArtifactV2(repoRoot, readJson(repoRoot, LEAN_DIRECT_V3_ARTIFACT_PATHS.preflight))
  const expected = buildLeanDirectAuthorizationV3(repoRoot, value.source.commit, preflight)
  if (JSON.stringify(value) !== JSON.stringify(expected)) throw new TypeError("LEAN_DIRECT_V3_AUTHORIZATION_DRIFT")
  return globalThis.structuredClone(value) as unknown as LeanDirectAuthorizationV3
}

export const checkLeanDirectAuthorizationV3 = (repoRoot: string, value: unknown): LeanDirectAuthorizationV3 => {
  const authorization = validateLeanDirectAuthorizationV3(repoRoot, value)
  assertLeanCorrectiveTrackedBytes(repoRoot, authorization.source.commit)
  assertLeanDirectPlan178History(repoRoot)
  assertSuccessorLockInventory(repoRoot)
  return authorization
}

export const writeLeanDirectAuthorizationV3 = (repoRoot: string, explicitSourceRef: string): LeanDirectAuthorizationV3 => {
  const authorization = renderLeanDirectAuthorizationV3(repoRoot, explicitSourceRef)
  writeExclusiveDurable(path.resolve(repoRoot, LEAN_DIRECT_V3_ARTIFACT_PATHS.authorization), authorization)
  return authorization
}

export const checkLeanDirectContainerSourceOnlyV3 = (repoRoot: string): void => {
  assertLeanStatus(git(repoRoot, ["status", "--short", "--untracked-files=all"]))
  checkLeanFirstEvidenceCustody(repoRoot)
  assertDeniedDirectV1History(repoRoot)
  assertLeanDirectPlan178History(repoRoot)
  assertLeanDirectV3PathsAreFresh()
  for (const artifactPath of Object.values(LEAN_DIRECT_V2_ARTIFACT_PATHS).filter((candidate) => candidate !== LEAN_DIRECT_V2_ARTIFACT_PATHS.review)) if (existsSync(path.resolve(repoRoot, artifactPath))) throw new TypeError(`LEAN_DIRECT_V2_DESTINATION_EXISTS:${artifactPath}`)
  for (const artifactPath of Object.values(LEAN_DIRECT_V3_ARTIFACT_PATHS)) if (existsSync(path.resolve(repoRoot, artifactPath))) throw new TypeError(`LEAN_DIRECT_V3_DESTINATION_EXISTS:${artifactPath}`)
  const latest = git(repoRoot, ["log", "-1", "--format=%H", "--", ...LEAN_PLAN177_RUNNABLE_PATHS])
  const source = resolveLeanDirectV2Source(repoRoot, latest, false)
  if (source.commit !== latest) throw new TypeError("LEAN_DIRECT_V3_SOURCE_DRIFT")
  assertSuccessorLockInventory(repoRoot)
}

export const checkLeanDirectValidityReviewV3 = (repoRoot: string, value: unknown): LeanDirectValidityReviewV3 => {
  assertPrivacySafe(value)
  const preflight = validateLeanContainerPreflightArtifactV2(repoRoot, readJson(repoRoot, LEAN_DIRECT_V3_ARTIFACT_PATHS.preflight))
  const authorizationPresent = existsSync(path.resolve(repoRoot, LEAN_DIRECT_V3_ARTIFACT_PATHS.authorization))
  const authorization = authorizationPresent ? checkLeanDirectAuthorizationV3(repoRoot, readJson(repoRoot, LEAN_DIRECT_V3_ARTIFACT_PATHS.authorization)) : undefined
  if (!isObject(value) || !exactKeys(value, ["schemaVersion", "authorizationRoot", "preflightRoot", "sourceCommit", "sourceTree", "categories", "blockingFindingCount", "certificationOnlyHistory", "admitsPlan175", "authority"]) || value.schemaVersion !== "v1.38-lean-runner-direct-validity-review-v3" || value.authorizationRoot !== (authorization === undefined ? null : hashLeanValue(authorization)) || value.preflightRoot !== hashLeanValue(preflight) || value.sourceCommit !== preflight.sourceCommit || value.sourceTree !== preflight.sourceTree || !Array.isArray(value.categories) || value.categories.length !== LEAN_DIRECT_VALIDITY_CATEGORIES.length || !Number.isSafeInteger(value.blockingFindingCount) || (value.blockingFindingCount as number) < 0 || JSON.stringify(value.certificationOnlyHistory) !== JSON.stringify(plan172Findings(repoRoot)) || !exactFalseAuthority(value.authority)) throw new TypeError("LEAN_DIRECT_V3_REVIEW_INVALID")
  for (const [index, expected] of LEAN_DIRECT_VALIDITY_CATEGORIES.entries()) {
    const item = value.categories[index]
    if (!isObject(item) || !exactKeys(item, ["category", "status", "evidence"]) || item.category !== expected || !["pass", "finding"].includes(String(item.status)) || typeof item.evidence !== "string" || item.evidence.length === 0) throw new TypeError("LEAN_DIRECT_V3_REVIEW_INVALID")
  }
  const findings = value.categories.filter((item) => isObject(item) && item.status === "finding").length
  const admitted = preflight.preflight.status === "pass" && authorization !== undefined && findings === 0
  if (value.blockingFindingCount !== findings || value.admitsPlan175 !== admitted) throw new TypeError("LEAN_DIRECT_V3_REVIEW_INVALID")
  return globalThis.structuredClone(value) as unknown as LeanDirectValidityReviewV3
}

export const loadAndCheckLeanDirectReviewedReadyV3 = (repoRoot: string, allowedOperationalPaths: readonly string[] = []): { authorization: LeanDirectAuthorizationV3, review: LeanDirectValidityReviewV3, preflight: LeanContainerPreflightArtifactV2 } => {
  assertLeanStatus(git(repoRoot, ["status", "--short", "--untracked-files=all"]), allowedOperationalPaths)
  for (const artifactPath of [LEAN_DIRECT_V3_ARTIFACT_PATHS.invocation, LEAN_DIRECT_V3_ARTIFACT_PATHS.terminal, LEAN_DIRECT_V3_ARTIFACT_PATHS.adjudication, LEAN_DIRECT_V3_ARTIFACT_PATHS.eligibility]) if (!allowedOperationalPaths.includes(artifactPath) && existsSync(path.resolve(repoRoot, artifactPath))) throw new TypeError(`LEAN_DIRECT_V3_EFFECT_EXISTS:${artifactPath}`)
  const preflight = validateLeanContainerPreflightArtifactV2(repoRoot, readJson(repoRoot, LEAN_DIRECT_V3_ARTIFACT_PATHS.preflight))
  if (preflight.preflight.status !== "pass") throw new TypeError("LEAN_DIRECT_V3_PREFLIGHT_NOT_PASS")
  const authorization = checkLeanDirectAuthorizationV3(repoRoot, readJson(repoRoot, LEAN_DIRECT_V3_ARTIFACT_PATHS.authorization))
  const review = checkLeanDirectValidityReviewV3(repoRoot, readJson(repoRoot, LEAN_DIRECT_V3_ARTIFACT_PATHS.review))
  if (!review.admitsPlan175 || review.blockingFindingCount !== 0) throw new TypeError("LEAN_DIRECT_V3_PLAN175_NOT_ADMITTED")
  return { authorization, review, preflight }
}

export const createLeanDirectInvocationV3 = (authorization: LeanDirectAuthorizationV3, review: LeanDirectValidityReviewV3, childCapabilityRoot: `sha256:${string}`): LeanDirectInvocationV3 => ({
  schemaVersion: "v1.38-lean-runner-direct-invocation-v3",
  authorizationRoot: hashLeanValue(authorization), validityReviewRoot: hashLeanValue(review),
  preflightRoot: authorization.containerPreflight.root, sourceCommit: authorization.source.commit,
  childCapabilityRoot, claimClass: "fixture_feasibility_only", invocationOrdinal: 1,
  authority: LEAN_AUTHORITY_FALSE,
})

const validateLeanDirectInvocationV3 = (repoRoot: string, value: unknown): LeanDirectInvocationV3 => {
  const { authorization, review } = loadAndCheckLeanDirectReviewedReadyV3(repoRoot, [LEAN_DIRECT_V3_ARTIFACT_PATHS.invocation])
  if (!isObject(value) || !isSha(value.childCapabilityRoot) || JSON.stringify(value) !== JSON.stringify(createLeanDirectInvocationV3(authorization, review, value.childCapabilityRoot))) throw new TypeError("LEAN_DIRECT_V3_INVOCATION_INVALID")
  return globalThis.structuredClone(value) as unknown as LeanDirectInvocationV3
}

export const createLeanDirectTerminalArtifactV3 = (invocation: LeanDirectInvocationV3, terminal: LeanTerminal): LeanDirectTerminalArtifactV3 => ({
  schemaVersion: "v1.38-lean-runner-direct-terminal-v3",
  authorizationRoot: invocation.authorizationRoot, validityReviewRoot: invocation.validityReviewRoot,
  preflightRoot: invocation.preflightRoot, sourceCommit: invocation.sourceCommit,
  childCapabilityRoot: invocation.childCapabilityRoot, invocationRoot: hashLeanValue(invocation),
  privacy: "safe_aggregate_only", terminal: deriveAndValidateLeanTerminal(terminal), authority: LEAN_AUTHORITY_FALSE,
})

export const createExclusiveLeanDirectTerminalV3 = (repoRoot: string, terminal: LeanDirectTerminalArtifactV3): void =>
  writeExclusiveDurable(path.resolve(repoRoot, LEAN_DIRECT_V3_ARTIFACT_PATHS.terminal), terminal)

export const checkLeanDirectPostRunV3 = (repoRoot: string): { invocation: LeanDirectInvocationV3, terminal?: LeanDirectTerminalArtifactV3, markerOnly: boolean } => {
  const invocation = validateLeanDirectInvocationV3(repoRoot, readJson(repoRoot, LEAN_DIRECT_V3_ARTIFACT_PATHS.invocation))
  if (!existsSync(path.resolve(repoRoot, LEAN_DIRECT_V3_ARTIFACT_PATHS.terminal))) return { invocation, markerOnly: true }
  const value = readJson(repoRoot, LEAN_DIRECT_V3_ARTIFACT_PATHS.terminal)
  const expected = createLeanDirectTerminalArtifactV3(invocation, (value as LeanDirectTerminalArtifactV3).terminal)
  if (JSON.stringify(value) !== JSON.stringify(expected)) throw new TypeError("LEAN_DIRECT_V3_TERMINAL_INVALID")
  return { invocation, terminal: value as LeanDirectTerminalArtifactV3, markerOnly: false }
}

export const checkLeanDirectAdjudicationV3 = (repoRoot: string): void => {
  const { invocation, terminal, markerOnly } = checkLeanDirectPostRunV3(repoRoot)
  const adjudication = readJson(repoRoot, LEAN_DIRECT_V3_ARTIFACT_PATHS.adjudication)
  const result = markerOnly ? "invalid" : deriveAndValidateLeanTerminal(terminal!.terminal).result
  if (!isObject(adjudication) || adjudication.schemaVersion !== "v1.38-lean-runner-direct-adjudication-v3" || adjudication.invocationRoot !== hashLeanValue(invocation) || adjudication.terminalRoot !== (terminal === undefined ? null : hashLeanValue(terminal)) || adjudication.reviewedResult !== result || adjudication.markerOnly !== markerOnly || adjudication.opportunityConsumed !== true || adjudication.admitsEligibility !== (result === "pass") || !exactFalseAuthority(adjudication.authority)) throw new TypeError("LEAN_DIRECT_V3_ADJUDICATION_INVALID")
  const eligibility = readJson(repoRoot, LEAN_DIRECT_V3_ARTIFACT_PATHS.eligibility)
  const passed = result === "pass"
  if (!isObject(eligibility) || eligibility.schemaVersion !== "v1.38-phase-262-lean-direct-eligibility-v3" || eligibility.adjudicationRoot !== hashLeanValue(adjudication) || eligibility.admit03 !== (passed ? "satisfied_under_revised_contract" : "blocked") || eligibility.phase262Complete !== passed || eligibility.phase263PlanningEligible !== passed || eligibility.phase263ExecutionEligible !== passed || !exactEligibilityAuthority(eligibility.authority, passed)) throw new TypeError("LEAN_DIRECT_V3_ELIGIBILITY_INVALID")
}

const LEAN_DIRECT_PLAN180_PREFLIGHT_SHA256 = "5fe36a5dfc5c2dac388b532af36faeab0683e0ead716ddb0a6a9da2fa1a5536b" as const
const LEAN_DIRECT_PLAN180_REVIEW_SHA256 = "19b4e0b1bdd53b9cf69cfd22282e677204abf0aec839dc749e5e3d4eba794eca" as const

const assertLeanDirectPlan180History = (repoRoot: string): void => {
  if (
    sha256File(path.resolve(repoRoot, LEAN_DIRECT_V3_ARTIFACT_PATHS.preflight)) !== LEAN_DIRECT_PLAN180_PREFLIGHT_SHA256 ||
    sha256File(path.resolve(repoRoot, LEAN_DIRECT_V3_ARTIFACT_PATHS.review)) !== LEAN_DIRECT_PLAN180_REVIEW_SHA256
  ) throw new TypeError("LEAN_DIRECT_PLAN180_HISTORY_DRIFT")
  const preflight = readJson(repoRoot, LEAN_DIRECT_V3_ARTIFACT_PATHS.preflight)
  const review = readJson(repoRoot, LEAN_DIRECT_V3_ARTIFACT_PATHS.review)
  if (
    !isObject(preflight) || !isObject(preflight.preflight) || preflight.preflight.status !== "non_pass" || preflight.matchInvocations !== 0 || !exactFalseAuthority(preflight.authority) ||
    !isObject(review) || review.admitsPlan175 !== false || review.blockingFindingCount !== 1 || !exactFalseAuthority(review.authority)
  ) throw new TypeError("LEAN_DIRECT_PLAN180_HISTORY_REINTERPRETED")
  for (const artifactPath of Object.values(LEAN_DIRECT_V3_ARTIFACT_PATHS).filter((candidate) => ![LEAN_DIRECT_V3_ARTIFACT_PATHS.preflight, LEAN_DIRECT_V3_ARTIFACT_PATHS.review].includes(candidate))) {
    if (existsSync(path.resolve(repoRoot, artifactPath))) throw new TypeError(`LEAN_DIRECT_PLAN180_HISTORY_EFFECT:${artifactPath}`)
  }
}

const assertLeanDirectV4PathsAreFresh = (): void => {
  const historical = [
    ...Object.values(LEAN_DIRECT_ARTIFACT_PATHS),
    ...Object.values(LEAN_DIRECT_V2_ARTIFACT_PATHS),
    ...Object.values(LEAN_DIRECT_V3_ARTIFACT_PATHS),
    LEAN_DIRECT_PLAN178_PREFLIGHT_PATH,
    LEAN_DIRECT_PLAN178_REVIEW_PATH,
  ]
  const fresh = Object.values(LEAN_DIRECT_V4_ARTIFACT_PATHS)
  if (new Set(fresh).size !== fresh.length || fresh.some((candidate) => historical.includes(candidate as never))) throw new TypeError("LEAN_DIRECT_V4_PATH_ALIAS")
}

const validateLeanContainerSessionPreflightEvidence = (value: unknown): LeanContainerPreflightEvidence => {
  const keys = [
    "status", "dockerServerVersion", "imageReference", "adapterId", "controlsRoot",
    "sampleCount", "sampleRoot", "lifecycleSampleCount", "lifecycleSampleRoot",
    "lifecycleMaximumMilliseconds", "methodCeilings", "startupCleanupMarginMilliseconds",
    "projectedCellMilliseconds", "projectedRunMilliseconds", "cellDeadlineMilliseconds",
    "outerDeadlineMilliseconds",
  ]
  if (
    !isObject(value) || !exactKeys(value, keys) || value.status !== "pass" ||
    value.imageReference !== LEAN_CONTAINER_IMAGE || value.adapterId !== LEAN_CONTAINER_ADAPTER_ID ||
    value.controlsRoot !== hashLeanValue(LEAN_CONTAINER_CONTROLS) ||
    JSON.stringify(value.methodCeilings) !== JSON.stringify(LEAN_CONTAINER_METHOD_CEILINGS) ||
    value.startupCleanupMarginMilliseconds !== LEAN_CONTAINER_STARTUP_CLEANUP_MARGIN_MS ||
    value.cellDeadlineMilliseconds !== LEAN_CELL_DEADLINE_MS || value.outerDeadlineMilliseconds !== 900000 ||
    !Number.isSafeInteger(value.sampleCount) || (value.sampleCount as number) < 4 || !isSha(value.sampleRoot) ||
    !Number.isSafeInteger(value.lifecycleSampleCount) || (value.lifecycleSampleCount as number) < 1 || !isSha(value.lifecycleSampleRoot) ||
    !Number.isFinite(value.lifecycleMaximumMilliseconds) || (value.lifecycleMaximumMilliseconds as number) < 0 ||
    !Number.isFinite(value.projectedCellMilliseconds) || !Number.isFinite(value.projectedRunMilliseconds) ||
    (value.projectedCellMilliseconds as number) > LEAN_CELL_DEADLINE_MS || (value.projectedRunMilliseconds as number) > 900000 ||
    typeof value.dockerServerVersion !== "string"
  ) throw new TypeError("LEAN_DIRECT_V4_PREFLIGHT_INVALID")
  return globalThis.structuredClone(value) as unknown as LeanContainerPreflightEvidence
}

export const validateLeanContainerPreflightOutcomeV3 = (value: unknown): LeanContainerPreflightOutcomeV2 => {
  if (isObject(value) && value.status === "non_pass") {
    if (!exactKeys(value, ["status", "reasonCode"]) || value.reasonCode !== "container_preflight_refused") throw new TypeError("LEAN_DIRECT_V4_PREFLIGHT_OUTCOME_INVALID")
    return globalThis.structuredClone(value) as LeanContainerPreflightOutcomeV2
  }
  return validateLeanContainerSessionPreflightEvidence(value)
}

const buildLeanContainerPreflightArtifactV3 = (repoRoot: string, explicitSourceRef: string, outcome: unknown): LeanContainerPreflightArtifactV3 => {
  const source = resolveLeanDirectV4Source(repoRoot, explicitSourceRef, true)
  return {
    schemaVersion: "v1.38-lean-runner-direct-container-preflight-v3",
    sourceCommit: source.commit,
    sourceTree: source.tree,
    executableClosureRoot: hashLeanValue(source.executableBlobs),
    preflight: validateLeanContainerPreflightOutcomeV3(outcome),
    consuming: false,
    preflightInvocations: 1,
    matchInvocations: 0,
    authority: LEAN_AUTHORITY_FALSE,
  }
}

export const renderLeanContainerPreflightArtifactV3 = (repoRoot: string, explicitSourceRef: string, outcome: unknown): LeanContainerPreflightArtifactV3 => {
  assertLeanDirectPlan178History(repoRoot)
  assertLeanDirectPlan180History(repoRoot)
  assertLeanDirectV4PathsAreFresh()
  return buildLeanContainerPreflightArtifactV3(repoRoot, explicitSourceRef, outcome)
}

export const validateLeanContainerPreflightArtifactV3 = (repoRoot: string, value: unknown): LeanContainerPreflightArtifactV3 => {
  assertPrivacySafe(value)
  if (!isObject(value) || !exactKeys(value, ["schemaVersion", "sourceCommit", "sourceTree", "executableClosureRoot", "preflight", "consuming", "preflightInvocations", "matchInvocations", "authority"]) || value.schemaVersion !== "v1.38-lean-runner-direct-container-preflight-v3" || !isOid(value.sourceCommit) || !isOid(value.sourceTree) || !isSha(value.executableClosureRoot) || value.consuming !== false || value.preflightInvocations !== 1 || value.matchInvocations !== 0 || !exactFalseAuthority(value.authority)) throw new TypeError("LEAN_DIRECT_V4_PREFLIGHT_INVALID")
  const expected = buildLeanContainerPreflightArtifactV3(repoRoot, value.sourceCommit, value.preflight)
  if (JSON.stringify(value) !== JSON.stringify(expected)) throw new TypeError("LEAN_DIRECT_V4_PREFLIGHT_DRIFT")
  return globalThis.structuredClone(value) as unknown as LeanContainerPreflightArtifactV3
}

export const writeLeanContainerPreflightArtifactV3 = (repoRoot: string, explicitSourceRef: string): LeanContainerPreflightArtifactV3 => {
  assertLeanStatus(git(repoRoot, ["status", "--short", "--untracked-files=all"]))
  assertLeanDirectPlan178History(repoRoot)
  assertLeanDirectPlan180History(repoRoot)
  assertLeanDirectV4PathsAreFresh()
  for (const artifactPath of Object.values(LEAN_DIRECT_V4_ARTIFACT_PATHS)) if (existsSync(path.resolve(repoRoot, artifactPath))) throw new TypeError(`LEAN_DIRECT_V4_DESTINATION_EXISTS:${artifactPath}`)
  const sourceRef = validateLeanDirectV2ExplicitSourceRef(explicitSourceRef)
  const source = resolveLeanDirectV4Source(repoRoot, sourceRef, true)
  assertLeanDirectV4TrackedBytes(repoRoot, source.commit)
  assertSuccessorLockInventory(repoRoot)
  let outcome: LeanContainerPreflightOutcomeV2
  try { outcome = runActualLeanContainerPreflight() }
  catch { outcome = { status: "non_pass", reasonCode: "container_preflight_refused" } }
  const artifact = renderLeanContainerPreflightArtifactV3(repoRoot, sourceRef, outcome)
  writeExclusiveDurable(path.resolve(repoRoot, LEAN_DIRECT_V4_ARTIFACT_PATHS.preflight), artifact)
  return artifact
}

const buildLeanDirectAuthorizationV4 = (repoRoot: string, explicitSourceRef: string, preflight: LeanContainerPreflightArtifactV3): LeanDirectAuthorizationV4 => {
  if (preflight.preflight.status !== "pass") throw new TypeError("LEAN_DIRECT_V4_PREFLIGHT_NOT_PASS")
  const source = resolveLeanDirectV4Source(repoRoot, explicitSourceRef, true)
  if (preflight.sourceCommit !== source.commit || preflight.sourceTree !== source.tree || preflight.executableClosureRoot !== hashLeanValue(source.executableBlobs)) throw new TypeError("LEAN_DIRECT_V4_PREFLIGHT_SOURCE_DRIFT")
  const base = buildLeanDirectAuthorization(repoRoot, source.commit)
  return {
    ...base,
    schemaVersion: "v1.38-lean-runner-direct-authorization-v4",
    source,
    containerPreflight: { path: LEAN_DIRECT_V4_ARTIFACT_PATHS.preflight, root: hashLeanValue(preflight) },
    runtimeBoundary: {
      registryAdapterId: "runtime-js-container-subprocess",
      serviceAdapterId: LEAN_CONTAINER_ADAPTER_ID,
      image: LEAN_CONTAINER_IMAGE,
      controlsRoot: hashLeanValue(LEAN_CONTAINER_CONTROLS),
      methodCeilings: LEAN_CONTAINER_METHOD_CEILINGS,
      startupCleanupMarginMilliseconds: LEAN_CONTAINER_STARTUP_CLEANUP_MARGIN_MS,
      cellDeadlineMilliseconds: LEAN_CELL_DEADLINE_MS,
      outerDeadlineMilliseconds: 900000,
    },
    plan174History: {
      authorizationPath: LEAN_DIRECT_ARTIFACT_PATHS.authorization,
      authorizationRoot: LEAN_DIRECT_V1_AUTHORIZATION_ROOT,
      reviewPath: LEAN_DIRECT_ARTIFACT_PATHS.review,
      reviewRoot: LEAN_DIRECT_V1_REVIEW_ROOT,
      status: "denied_preserved",
      resolvedByNewSource: ["CR-01", "CR-02"],
    },
    plan178History: {
      preflightPath: LEAN_DIRECT_PLAN178_PREFLIGHT_PATH,
      preflightSha256: `sha256:${LEAN_DIRECT_PLAN178_PREFLIGHT_SHA256}`,
      reviewPath: LEAN_DIRECT_PLAN178_REVIEW_PATH,
      reviewSha256: `sha256:${LEAN_DIRECT_PLAN178_REVIEW_SHA256}`,
      status: "non_pass_preserved",
    },
    plan180History: {
      preflightPath: LEAN_DIRECT_V3_ARTIFACT_PATHS.preflight,
      preflightSha256: `sha256:${LEAN_DIRECT_PLAN180_PREFLIGHT_SHA256}`,
      reviewPath: LEAN_DIRECT_V3_ARTIFACT_PATHS.review,
      reviewSha256: `sha256:${LEAN_DIRECT_PLAN180_REVIEW_SHA256}`,
      status: "non_pass_preserved",
    },
  }
}

export const renderLeanDirectAuthorizationV4 = (repoRoot: string, explicitSourceRef: string): LeanDirectAuthorizationV4 => {
  assertLeanDirectPlan180History(repoRoot)
  const preflight = validateLeanContainerPreflightArtifactV3(repoRoot, readJson(repoRoot, LEAN_DIRECT_V4_ARTIFACT_PATHS.preflight))
  for (const artifactPath of Object.values(LEAN_DIRECT_V4_ARTIFACT_PATHS).filter((candidate) => candidate !== LEAN_DIRECT_V4_ARTIFACT_PATHS.preflight)) if (existsSync(path.resolve(repoRoot, artifactPath))) throw new TypeError(`LEAN_DIRECT_V4_DESTINATION_EXISTS:${artifactPath}`)
  return buildLeanDirectAuthorizationV4(repoRoot, validateLeanDirectV2ExplicitSourceRef(explicitSourceRef), preflight)
}

export const validateLeanDirectAuthorizationV4 = (repoRoot: string, value: unknown): LeanDirectAuthorizationV4 => {
  assertPrivacySafe(value)
  if (!isObject(value) || value.schemaVersion !== "v1.38-lean-runner-direct-authorization-v4" || !isObject(value.source) || !isOid(value.source.commit)) throw new TypeError("LEAN_DIRECT_V4_AUTHORIZATION_INVALID")
  const preflight = validateLeanContainerPreflightArtifactV3(repoRoot, readJson(repoRoot, LEAN_DIRECT_V4_ARTIFACT_PATHS.preflight))
  const expected = buildLeanDirectAuthorizationV4(repoRoot, value.source.commit, preflight)
  if (JSON.stringify(value) !== JSON.stringify(expected)) throw new TypeError("LEAN_DIRECT_V4_AUTHORIZATION_DRIFT")
  return globalThis.structuredClone(value) as unknown as LeanDirectAuthorizationV4
}

export const checkLeanDirectAuthorizationV4 = (repoRoot: string, value: unknown): LeanDirectAuthorizationV4 => {
  const authorization = validateLeanDirectAuthorizationV4(repoRoot, value)
  assertLeanDirectV4TrackedBytes(repoRoot, authorization.source.commit)
  assertLeanDirectPlan180History(repoRoot)
  assertSuccessorLockInventory(repoRoot)
  return authorization
}

export const writeLeanDirectAuthorizationV4 = (repoRoot: string, explicitSourceRef: string): LeanDirectAuthorizationV4 => {
  const authorization = renderLeanDirectAuthorizationV4(repoRoot, explicitSourceRef)
  writeExclusiveDurable(path.resolve(repoRoot, LEAN_DIRECT_V4_ARTIFACT_PATHS.authorization), authorization)
  return authorization
}

export const checkLeanDirectContainerSourceOnlyV4 = (repoRoot: string): void => {
  assertLeanStatus(git(repoRoot, ["status", "--short", "--untracked-files=all"]))
  checkLeanFirstEvidenceCustody(repoRoot)
  assertDeniedDirectV1History(repoRoot)
  assertLeanDirectPlan178History(repoRoot)
  assertLeanDirectPlan180History(repoRoot)
  assertLeanDirectV4PathsAreFresh()
  for (const artifactPath of Object.values(LEAN_DIRECT_V4_ARTIFACT_PATHS)) if (existsSync(path.resolve(repoRoot, artifactPath))) throw new TypeError(`LEAN_DIRECT_V4_DESTINATION_EXISTS:${artifactPath}`)
  const latest = git(repoRoot, ["log", "-1", "--format=%H", "--", ...LEAN_PLAN177_RUNNABLE_PATHS])
  const source = resolveLeanDirectV4Source(repoRoot, latest, false)
  if (source.commit !== latest) throw new TypeError("LEAN_DIRECT_V4_SOURCE_DRIFT")
  assertLeanDirectV4TrackedBytes(repoRoot, source.commit)
  assertSuccessorLockInventory(repoRoot)
}

export const checkLeanDirectValidityReviewV4 = (repoRoot: string, value: unknown): LeanDirectValidityReviewV4 => {
  assertPrivacySafe(value)
  const preflight = validateLeanContainerPreflightArtifactV3(repoRoot, readJson(repoRoot, LEAN_DIRECT_V4_ARTIFACT_PATHS.preflight))
  const authorizationPresent = existsSync(path.resolve(repoRoot, LEAN_DIRECT_V4_ARTIFACT_PATHS.authorization))
  const authorization = authorizationPresent ? checkLeanDirectAuthorizationV4(repoRoot, readJson(repoRoot, LEAN_DIRECT_V4_ARTIFACT_PATHS.authorization)) : undefined
  if (!isObject(value) || !exactKeys(value, ["schemaVersion", "authorizationRoot", "preflightRoot", "sourceCommit", "sourceTree", "categories", "blockingFindingCount", "certificationOnlyHistory", "admitsPlan175", "authority"]) || value.schemaVersion !== "v1.38-lean-runner-direct-validity-review-v4" || value.authorizationRoot !== (authorization === undefined ? null : hashLeanValue(authorization)) || value.preflightRoot !== hashLeanValue(preflight) || value.sourceCommit !== preflight.sourceCommit || value.sourceTree !== preflight.sourceTree || !Array.isArray(value.categories) || value.categories.length !== LEAN_DIRECT_VALIDITY_CATEGORIES.length || !Number.isSafeInteger(value.blockingFindingCount) || (value.blockingFindingCount as number) < 0 || JSON.stringify(value.certificationOnlyHistory) !== JSON.stringify(plan172Findings(repoRoot)) || !exactFalseAuthority(value.authority)) throw new TypeError("LEAN_DIRECT_V4_REVIEW_INVALID")
  for (const [index, expected] of LEAN_DIRECT_VALIDITY_CATEGORIES.entries()) {
    const item = value.categories[index]
    if (!isObject(item) || !exactKeys(item, ["category", "status", "evidence"]) || item.category !== expected || !["pass", "finding"].includes(String(item.status)) || typeof item.evidence !== "string" || item.evidence.length === 0) throw new TypeError("LEAN_DIRECT_V4_REVIEW_INVALID")
  }
  const findings = value.categories.filter((item) => isObject(item) && item.status === "finding").length
  const admitted = preflight.preflight.status === "pass" && authorization !== undefined && findings === 0
  if (value.blockingFindingCount !== findings || value.admitsPlan175 !== admitted) throw new TypeError("LEAN_DIRECT_V4_REVIEW_INVALID")
  return globalThis.structuredClone(value) as unknown as LeanDirectValidityReviewV4
}

export const loadAndCheckLeanDirectReviewedReadyV4 = (repoRoot: string, allowedOperationalPaths: readonly string[] = []): { authorization: LeanDirectAuthorizationV4; review: LeanDirectValidityReviewV4; preflight: LeanContainerPreflightArtifactV3 } => {
  assertLeanStatus(git(repoRoot, ["status", "--short", "--untracked-files=all"]), allowedOperationalPaths)
  for (const artifactPath of [LEAN_DIRECT_V4_ARTIFACT_PATHS.invocation, LEAN_DIRECT_V4_ARTIFACT_PATHS.terminal, LEAN_DIRECT_V4_ARTIFACT_PATHS.adjudication, LEAN_DIRECT_V4_ARTIFACT_PATHS.eligibility]) if (!allowedOperationalPaths.includes(artifactPath) && existsSync(path.resolve(repoRoot, artifactPath))) throw new TypeError(`LEAN_DIRECT_V4_EFFECT_EXISTS:${artifactPath}`)
  const preflight = validateLeanContainerPreflightArtifactV3(repoRoot, readJson(repoRoot, LEAN_DIRECT_V4_ARTIFACT_PATHS.preflight))
  if (preflight.preflight.status !== "pass") throw new TypeError("LEAN_DIRECT_V4_PREFLIGHT_NOT_PASS")
  const authorization = checkLeanDirectAuthorizationV4(repoRoot, readJson(repoRoot, LEAN_DIRECT_V4_ARTIFACT_PATHS.authorization))
  const review = checkLeanDirectValidityReviewV4(repoRoot, readJson(repoRoot, LEAN_DIRECT_V4_ARTIFACT_PATHS.review))
  if (!review.admitsPlan175 || review.blockingFindingCount !== 0) throw new TypeError("LEAN_DIRECT_V4_PLAN175_NOT_ADMITTED")
  return { authorization, review, preflight }
}

export const checkLeanDirectReviewDispositionV4 = (repoRoot: string): LeanDirectValidityReviewV4 => {
  assertLeanStatus(git(repoRoot, ["status", "--short", "--untracked-files=all"]), [LEAN_DIRECT_V4_ARTIFACT_PATHS.review])
  const review = checkLeanDirectValidityReviewV4(repoRoot, readJson(repoRoot, LEAN_DIRECT_V4_ARTIFACT_PATHS.review))
  if (review.admitsPlan175) {
    loadAndCheckLeanDirectReviewedReadyV4(repoRoot)
  } else {
    for (const artifactPath of [LEAN_DIRECT_V4_ARTIFACT_PATHS.invocation, LEAN_DIRECT_V4_ARTIFACT_PATHS.terminal, LEAN_DIRECT_V4_ARTIFACT_PATHS.adjudication, LEAN_DIRECT_V4_ARTIFACT_PATHS.eligibility]) if (existsSync(path.resolve(repoRoot, artifactPath))) throw new TypeError(`LEAN_DIRECT_V4_DENIED_EFFECT:${artifactPath}`)
    if (Object.values(review.authority).some(Boolean)) throw new TypeError("LEAN_DIRECT_V4_DENIED_AUTHORITY")
  }
  return review
}

export const createLeanDirectInvocationV4 = (authorization: LeanDirectAuthorizationV4, review: LeanDirectValidityReviewV4, childCapabilityRoot: `sha256:${string}`): LeanDirectInvocationV4 => ({
  schemaVersion: "v1.38-lean-runner-direct-invocation-v4",
  authorizationRoot: hashLeanValue(authorization), validityReviewRoot: hashLeanValue(review),
  preflightRoot: authorization.containerPreflight.root, sourceCommit: authorization.source.commit,
  childCapabilityRoot, claimClass: "fixture_feasibility_only", invocationOrdinal: 1,
  authority: LEAN_AUTHORITY_FALSE,
})

const validateLeanDirectInvocationV4 = (repoRoot: string, value: unknown): LeanDirectInvocationV4 => {
  const { authorization, review } = loadAndCheckLeanDirectReviewedReadyV4(repoRoot, [LEAN_DIRECT_V4_ARTIFACT_PATHS.invocation])
  if (!isObject(value) || !isSha(value.childCapabilityRoot) || JSON.stringify(value) !== JSON.stringify(createLeanDirectInvocationV4(authorization, review, value.childCapabilityRoot))) throw new TypeError("LEAN_DIRECT_V4_INVOCATION_INVALID")
  return globalThis.structuredClone(value) as unknown as LeanDirectInvocationV4
}

export const createLeanDirectTerminalArtifactV4 = (invocation: LeanDirectInvocationV4, terminal: LeanTerminal): LeanDirectTerminalArtifactV4 => ({
  schemaVersion: "v1.38-lean-runner-direct-terminal-v4",
  authorizationRoot: invocation.authorizationRoot, validityReviewRoot: invocation.validityReviewRoot,
  preflightRoot: invocation.preflightRoot, sourceCommit: invocation.sourceCommit,
  childCapabilityRoot: invocation.childCapabilityRoot, invocationRoot: hashLeanValue(invocation),
  privacy: "safe_aggregate_only", terminal: deriveAndValidateLeanTerminal(terminal), authority: LEAN_AUTHORITY_FALSE,
})

export const createExclusiveLeanDirectTerminalV4 = (repoRoot: string, terminal: LeanDirectTerminalArtifactV4): void =>
  writeExclusiveDurable(path.resolve(repoRoot, LEAN_DIRECT_V4_ARTIFACT_PATHS.terminal), terminal)

export const checkLeanDirectPostRunV4 = (repoRoot: string): { invocation: LeanDirectInvocationV4; terminal?: LeanDirectTerminalArtifactV4; markerOnly: boolean } => {
  const invocation = validateLeanDirectInvocationV4(repoRoot, readJson(repoRoot, LEAN_DIRECT_V4_ARTIFACT_PATHS.invocation))
  if (!existsSync(path.resolve(repoRoot, LEAN_DIRECT_V4_ARTIFACT_PATHS.terminal))) return { invocation, markerOnly: true }
  const value = readJson(repoRoot, LEAN_DIRECT_V4_ARTIFACT_PATHS.terminal)
  const expected = createLeanDirectTerminalArtifactV4(invocation, (value as LeanDirectTerminalArtifactV4).terminal)
  if (JSON.stringify(value) !== JSON.stringify(expected)) throw new TypeError("LEAN_DIRECT_V4_TERMINAL_INVALID")
  return { invocation, terminal: value as LeanDirectTerminalArtifactV4, markerOnly: false }
}

export const checkLeanDirectAdjudicationV4 = (repoRoot: string): void => {
  const { invocation, terminal, markerOnly } = checkLeanDirectPostRunV4(repoRoot)
  const adjudication = readJson(repoRoot, LEAN_DIRECT_V4_ARTIFACT_PATHS.adjudication)
  const result = markerOnly ? "invalid" : deriveAndValidateLeanTerminal(terminal!.terminal).result
  if (!isObject(adjudication) || adjudication.schemaVersion !== "v1.38-lean-runner-direct-adjudication-v4" || adjudication.invocationRoot !== hashLeanValue(invocation) || adjudication.terminalRoot !== (terminal === undefined ? null : hashLeanValue(terminal)) || adjudication.reviewedResult !== result || adjudication.markerOnly !== markerOnly || adjudication.opportunityConsumed !== true || adjudication.admitsEligibility !== (result === "pass") || !exactFalseAuthority(adjudication.authority)) throw new TypeError("LEAN_DIRECT_V4_ADJUDICATION_INVALID")
  const eligibility = readJson(repoRoot, LEAN_DIRECT_V4_ARTIFACT_PATHS.eligibility)
  const passed = result === "pass"
  if (!isObject(eligibility) || eligibility.schemaVersion !== "v1.38-phase-262-lean-direct-eligibility-v4" || eligibility.adjudicationRoot !== hashLeanValue(adjudication) || eligibility.admit03 !== (passed ? "satisfied_under_revised_contract" : "blocked") || eligibility.phase262Complete !== passed || eligibility.phase263PlanningEligible !== passed || eligibility.phase263ExecutionEligible !== passed || !exactEligibilityAuthority(eligibility.authority, passed)) throw new TypeError("LEAN_DIRECT_V4_ELIGIBILITY_INVALID")
}

const LEAN_DIRECT_PLAN182_PREFLIGHT_SHA256 = "e9a344ba4e091038fefa30ba91158fd3a41b0a65b1ad4241ede8e04060348fc5" as const
const LEAN_DIRECT_PLAN182_REVIEW_SHA256 = "491ddd1ba78da1fa83084816e10eaa4599b87bdde3915b987d293cf0ea7b502c" as const

const assertLeanDirectPlan182History = (repoRoot: string): void => {
  if (
    sha256File(path.resolve(repoRoot, LEAN_DIRECT_V4_ARTIFACT_PATHS.preflight)) !== LEAN_DIRECT_PLAN182_PREFLIGHT_SHA256 ||
    sha256File(path.resolve(repoRoot, LEAN_DIRECT_V4_ARTIFACT_PATHS.review)) !== LEAN_DIRECT_PLAN182_REVIEW_SHA256
  ) throw new TypeError("LEAN_DIRECT_PLAN182_HISTORY_DRIFT")
  const preflight = readJson(repoRoot, LEAN_DIRECT_V4_ARTIFACT_PATHS.preflight)
  const review = readJson(repoRoot, LEAN_DIRECT_V4_ARTIFACT_PATHS.review)
  if (!isObject(preflight) || !isObject(preflight.preflight) || preflight.preflight.status !== "non_pass" || preflight.matchInvocations !== 0 || !exactFalseAuthority(preflight.authority) || !isObject(review) || review.admitsPlan175 !== false || review.blockingFindingCount !== 2 || !exactFalseAuthority(review.authority)) throw new TypeError("LEAN_DIRECT_PLAN182_HISTORY_REINTERPRETED")
  for (const artifactPath of [LEAN_DIRECT_V4_ARTIFACT_PATHS.authorization, LEAN_DIRECT_V4_ARTIFACT_PATHS.invocation, LEAN_DIRECT_V4_ARTIFACT_PATHS.terminal, LEAN_DIRECT_V4_ARTIFACT_PATHS.adjudication, LEAN_DIRECT_V4_ARTIFACT_PATHS.eligibility]) if (existsSync(path.resolve(repoRoot, artifactPath))) throw new TypeError(`LEAN_DIRECT_PLAN182_HISTORY_EFFECT:${artifactPath}`)
}

const assertLeanDirectV5PathsAreFresh = (): void => {
  const historical = [...Object.values(LEAN_DIRECT_ARTIFACT_PATHS), ...Object.values(LEAN_DIRECT_V2_ARTIFACT_PATHS), ...Object.values(LEAN_DIRECT_V3_ARTIFACT_PATHS), ...Object.values(LEAN_DIRECT_V4_ARTIFACT_PATHS)]
  const fresh = Object.values(LEAN_DIRECT_V5_ARTIFACT_PATHS)
  if (new Set(fresh).size !== fresh.length || fresh.some((candidate) => historical.includes(candidate as never))) throw new TypeError("LEAN_DIRECT_V5_PATH_ALIAS")
}

const resolveLeanDirectV5Source = (repoRoot: string, explicitRef: string, rejectCurrentHead: boolean): LeanManifest["source"] => {
  const source = resolveLeanDirectV4Source(repoRoot, explicitRef, rejectCurrentHead)
  return source
}
const assertLeanDirectV5TrackedBytes = (repoRoot: string, sourceCommit: string): void => {
  try { execFileSync("git", ["diff", "--quiet", sourceCommit, "--", ...LEAN_DIRECT_V4_EXECUTABLE_CLOSURE_PATHS], { cwd: repoRoot, stdio: "ignore" }) }
  catch { throw new TypeError("LEAN_DIRECT_V5_TRACKED_BYTES_DRIFT") }
}

const buildLeanContainerPreflightArtifactV4 = (repoRoot: string, explicitSourceRef: string, outcome: unknown): LeanContainerPreflightArtifactV4 => {
  const source = resolveLeanDirectV5Source(repoRoot, explicitSourceRef, true)
  return {
    schemaVersion: "v1.38-lean-runner-direct-container-preflight-v4",
    sourceCommit: source.commit, sourceTree: source.tree,
    executableClosureRoot: hashLeanValue(source.executableBlobs),
    preflight: validateLeanContainerPreflightOutcomeV3(outcome), consuming: false,
    preflightInvocations: 1, matchInvocations: 0, authority: LEAN_AUTHORITY_FALSE,
  }
}
export const renderLeanContainerPreflightArtifactV4 = (repoRoot: string, explicitSourceRef: string, outcome: unknown): LeanContainerPreflightArtifactV4 => {
  assertLeanDirectPlan182History(repoRoot); assertLeanDirectV5PathsAreFresh()
  return buildLeanContainerPreflightArtifactV4(repoRoot, explicitSourceRef, outcome)
}
export const validateLeanContainerPreflightArtifactV4 = (repoRoot: string, value: unknown): LeanContainerPreflightArtifactV4 => {
  assertPrivacySafe(value)
  if (!isObject(value) || !exactKeys(value, ["schemaVersion", "sourceCommit", "sourceTree", "executableClosureRoot", "preflight", "consuming", "preflightInvocations", "matchInvocations", "authority"]) || value.schemaVersion !== "v1.38-lean-runner-direct-container-preflight-v4" || !isOid(value.sourceCommit) || !isOid(value.sourceTree) || !isSha(value.executableClosureRoot) || value.consuming !== false || value.preflightInvocations !== 1 || value.matchInvocations !== 0 || !exactFalseAuthority(value.authority)) throw new TypeError("LEAN_DIRECT_V5_PREFLIGHT_INVALID")
  const expected = buildLeanContainerPreflightArtifactV4(repoRoot, value.sourceCommit, value.preflight)
  if (JSON.stringify(value) !== JSON.stringify(expected)) throw new TypeError("LEAN_DIRECT_V5_PREFLIGHT_DRIFT")
  return globalThis.structuredClone(value) as unknown as LeanContainerPreflightArtifactV4
}
export const writeLeanContainerPreflightArtifactV4 = (repoRoot: string, explicitSourceRef: string): LeanContainerPreflightArtifactV4 => {
  assertLeanStatus(git(repoRoot, ["status", "--short", "--untracked-files=all"])); assertLeanDirectPlan182History(repoRoot); assertLeanDirectV5PathsAreFresh()
  for (const artifactPath of Object.values(LEAN_DIRECT_V5_ARTIFACT_PATHS)) if (existsSync(path.resolve(repoRoot, artifactPath))) throw new TypeError(`LEAN_DIRECT_V5_DESTINATION_EXISTS:${artifactPath}`)
  const sourceRef = validateLeanDirectV2ExplicitSourceRef(explicitSourceRef)
  const source = resolveLeanDirectV5Source(repoRoot, sourceRef, true)
  assertLeanDirectV5TrackedBytes(repoRoot, source.commit); assertSuccessorLockInventory(repoRoot)
  let outcome: LeanContainerPreflightOutcomeV2
  try { outcome = runActualLeanContainerPreflight() } catch { outcome = { status: "non_pass", reasonCode: "container_preflight_refused" } }
  const artifact = renderLeanContainerPreflightArtifactV4(repoRoot, sourceRef, outcome)
  writeExclusiveDurable(path.resolve(repoRoot, LEAN_DIRECT_V5_ARTIFACT_PATHS.preflight), artifact)
  return artifact
}

const buildLeanDirectAuthorizationV5 = (repoRoot: string, explicitSourceRef: string, preflight: LeanContainerPreflightArtifactV4): LeanDirectAuthorizationV5 => {
  if (preflight.preflight.status !== "pass") throw new TypeError("LEAN_DIRECT_V5_PREFLIGHT_NOT_PASS")
  const source = resolveLeanDirectV5Source(repoRoot, explicitSourceRef, true)
  if (preflight.sourceCommit !== source.commit || preflight.sourceTree !== source.tree || preflight.executableClosureRoot !== hashLeanValue(source.executableBlobs)) throw new TypeError("LEAN_DIRECT_V5_PREFLIGHT_SOURCE_DRIFT")
  const base = buildLeanDirectAuthorization(repoRoot, source.commit)
  return {
    ...base, schemaVersion: "v1.38-lean-runner-direct-authorization-v5", source,
    containerPreflight: { path: LEAN_DIRECT_V5_ARTIFACT_PATHS.preflight, root: hashLeanValue(preflight) },
    runtimeBoundary: { registryAdapterId: "runtime-js-container-subprocess", serviceAdapterId: LEAN_CONTAINER_ADAPTER_ID, image: LEAN_CONTAINER_IMAGE, controlsRoot: hashLeanValue(LEAN_CONTAINER_CONTROLS), methodCeilings: LEAN_CONTAINER_METHOD_CEILINGS, startupCleanupMarginMilliseconds: LEAN_CONTAINER_STARTUP_CLEANUP_MARGIN_MS, cellDeadlineMilliseconds: LEAN_CELL_DEADLINE_MS, outerDeadlineMilliseconds: 900000 },
    plan174History: { authorizationPath: LEAN_DIRECT_ARTIFACT_PATHS.authorization, authorizationRoot: LEAN_DIRECT_V1_AUTHORIZATION_ROOT, reviewPath: LEAN_DIRECT_ARTIFACT_PATHS.review, reviewRoot: LEAN_DIRECT_V1_REVIEW_ROOT, status: "denied_preserved", resolvedByNewSource: ["CR-01", "CR-02"] },
    plan178History: { preflightPath: LEAN_DIRECT_PLAN178_PREFLIGHT_PATH, preflightSha256: `sha256:${LEAN_DIRECT_PLAN178_PREFLIGHT_SHA256}`, reviewPath: LEAN_DIRECT_PLAN178_REVIEW_PATH, reviewSha256: `sha256:${LEAN_DIRECT_PLAN178_REVIEW_SHA256}`, status: "non_pass_preserved" },
    plan180History: { preflightPath: LEAN_DIRECT_V3_ARTIFACT_PATHS.preflight, preflightSha256: `sha256:${LEAN_DIRECT_PLAN180_PREFLIGHT_SHA256}`, reviewPath: LEAN_DIRECT_V3_ARTIFACT_PATHS.review, reviewSha256: `sha256:${LEAN_DIRECT_PLAN180_REVIEW_SHA256}`, status: "non_pass_preserved" },
    plan182History: { preflightPath: LEAN_DIRECT_V4_ARTIFACT_PATHS.preflight, preflightSha256: `sha256:${LEAN_DIRECT_PLAN182_PREFLIGHT_SHA256}`, reviewPath: LEAN_DIRECT_V4_ARTIFACT_PATHS.review, reviewSha256: `sha256:${LEAN_DIRECT_PLAN182_REVIEW_SHA256}`, status: "non_pass_preserved" },
  }
}
export const renderLeanDirectAuthorizationV5 = (repoRoot: string, explicitSourceRef: string): LeanDirectAuthorizationV5 => {
  assertLeanDirectPlan182History(repoRoot)
  const preflight = validateLeanContainerPreflightArtifactV4(repoRoot, readJson(repoRoot, LEAN_DIRECT_V5_ARTIFACT_PATHS.preflight))
  for (const artifactPath of Object.values(LEAN_DIRECT_V5_ARTIFACT_PATHS).filter((candidate) => candidate !== LEAN_DIRECT_V5_ARTIFACT_PATHS.preflight)) if (existsSync(path.resolve(repoRoot, artifactPath))) throw new TypeError(`LEAN_DIRECT_V5_DESTINATION_EXISTS:${artifactPath}`)
  return buildLeanDirectAuthorizationV5(repoRoot, validateLeanDirectV2ExplicitSourceRef(explicitSourceRef), preflight)
}
export const validateLeanDirectAuthorizationV5 = (repoRoot: string, value: unknown): LeanDirectAuthorizationV5 => {
  assertPrivacySafe(value)
  if (!isObject(value) || value.schemaVersion !== "v1.38-lean-runner-direct-authorization-v5" || !isObject(value.source) || !isOid(value.source.commit)) throw new TypeError("LEAN_DIRECT_V5_AUTHORIZATION_INVALID")
  const expected = buildLeanDirectAuthorizationV5(repoRoot, value.source.commit, validateLeanContainerPreflightArtifactV4(repoRoot, readJson(repoRoot, LEAN_DIRECT_V5_ARTIFACT_PATHS.preflight)))
  if (JSON.stringify(value) !== JSON.stringify(expected)) throw new TypeError("LEAN_DIRECT_V5_AUTHORIZATION_DRIFT")
  return globalThis.structuredClone(value) as unknown as LeanDirectAuthorizationV5
}
export const checkLeanDirectAuthorizationV5 = (repoRoot: string, value: unknown): LeanDirectAuthorizationV5 => {
  const authorization = validateLeanDirectAuthorizationV5(repoRoot, value); assertLeanDirectV5TrackedBytes(repoRoot, authorization.source.commit); assertLeanDirectPlan182History(repoRoot); assertSuccessorLockInventory(repoRoot); return authorization
}
export const writeLeanDirectAuthorizationV5 = (repoRoot: string, explicitSourceRef: string): LeanDirectAuthorizationV5 => {
  const authorization = renderLeanDirectAuthorizationV5(repoRoot, explicitSourceRef); writeExclusiveDurable(path.resolve(repoRoot, LEAN_DIRECT_V5_ARTIFACT_PATHS.authorization), authorization); return authorization
}
export const checkLeanDirectContainerSourceOnlyV5 = (repoRoot: string): void => {
  assertLeanStatus(git(repoRoot, ["status", "--short", "--untracked-files=all"])); checkLeanFirstEvidenceCustody(repoRoot); assertDeniedDirectV1History(repoRoot); assertLeanDirectPlan178History(repoRoot); assertLeanDirectPlan180History(repoRoot); assertLeanDirectPlan182History(repoRoot); assertLeanDirectV5PathsAreFresh()
  for (const artifactPath of Object.values(LEAN_DIRECT_V5_ARTIFACT_PATHS)) if (existsSync(path.resolve(repoRoot, artifactPath))) throw new TypeError(`LEAN_DIRECT_V5_DESTINATION_EXISTS:${artifactPath}`)
  const latest = git(repoRoot, ["log", "-1", "--format=%H", "--", ...LEAN_PLAN177_RUNNABLE_PATHS])
  const source = resolveLeanDirectV5Source(repoRoot, latest, false)
  if (source.commit !== latest) throw new TypeError("LEAN_DIRECT_V5_SOURCE_DRIFT")
  assertLeanDirectV5TrackedBytes(repoRoot, source.commit); assertSuccessorLockInventory(repoRoot)
}
export const checkLeanDirectValidityReviewV5 = (repoRoot: string, value: unknown): LeanDirectValidityReviewV5 => {
  assertPrivacySafe(value)
  const preflight = validateLeanContainerPreflightArtifactV4(repoRoot, readJson(repoRoot, LEAN_DIRECT_V5_ARTIFACT_PATHS.preflight))
  const authorizationPresent = existsSync(path.resolve(repoRoot, LEAN_DIRECT_V5_ARTIFACT_PATHS.authorization))
  const authorization = authorizationPresent ? checkLeanDirectAuthorizationV5(repoRoot, readJson(repoRoot, LEAN_DIRECT_V5_ARTIFACT_PATHS.authorization)) : undefined
  if (!isObject(value) || !exactKeys(value, ["schemaVersion", "authorizationRoot", "preflightRoot", "sourceCommit", "sourceTree", "categories", "blockingFindingCount", "certificationOnlyHistory", "admitsPlan175", "authority"]) || value.schemaVersion !== "v1.38-lean-runner-direct-validity-review-v5" || value.authorizationRoot !== (authorization === undefined ? null : hashLeanValue(authorization)) || value.preflightRoot !== hashLeanValue(preflight) || value.sourceCommit !== preflight.sourceCommit || value.sourceTree !== preflight.sourceTree || !Array.isArray(value.categories) || value.categories.length !== LEAN_DIRECT_VALIDITY_CATEGORIES.length || !Number.isSafeInteger(value.blockingFindingCount) || (value.blockingFindingCount as number) < 0 || JSON.stringify(value.certificationOnlyHistory) !== JSON.stringify(plan172Findings(repoRoot)) || !exactFalseAuthority(value.authority)) throw new TypeError("LEAN_DIRECT_V5_REVIEW_INVALID")
  for (const [index, expected] of LEAN_DIRECT_VALIDITY_CATEGORIES.entries()) { const item = value.categories[index]; if (!isObject(item) || !exactKeys(item, ["category", "status", "evidence"]) || item.category !== expected || !["pass", "finding"].includes(String(item.status)) || typeof item.evidence !== "string" || item.evidence.length === 0) throw new TypeError("LEAN_DIRECT_V5_REVIEW_INVALID") }
  const findings = value.categories.filter((item) => isObject(item) && item.status === "finding").length
  const admitted = preflight.preflight.status === "pass" && authorization !== undefined && findings === 0
  if (value.blockingFindingCount !== findings || value.admitsPlan175 !== admitted) throw new TypeError("LEAN_DIRECT_V5_REVIEW_INVALID")
  return globalThis.structuredClone(value) as unknown as LeanDirectValidityReviewV5
}
export const loadAndCheckLeanDirectReviewedReadyV5 = (repoRoot: string, allowedOperationalPaths: readonly string[] = []): { authorization: LeanDirectAuthorizationV5; review: LeanDirectValidityReviewV5; preflight: LeanContainerPreflightArtifactV4 } => {
  assertLeanStatus(git(repoRoot, ["status", "--short", "--untracked-files=all"]), allowedOperationalPaths)
  for (const artifactPath of [LEAN_DIRECT_V5_ARTIFACT_PATHS.invocation, LEAN_DIRECT_V5_ARTIFACT_PATHS.terminal, LEAN_DIRECT_V5_ARTIFACT_PATHS.adjudication, LEAN_DIRECT_V5_ARTIFACT_PATHS.eligibility]) if (!allowedOperationalPaths.includes(artifactPath) && existsSync(path.resolve(repoRoot, artifactPath))) throw new TypeError(`LEAN_DIRECT_V5_EFFECT_EXISTS:${artifactPath}`)
  const preflight = validateLeanContainerPreflightArtifactV4(repoRoot, readJson(repoRoot, LEAN_DIRECT_V5_ARTIFACT_PATHS.preflight)); if (preflight.preflight.status !== "pass") throw new TypeError("LEAN_DIRECT_V5_PREFLIGHT_NOT_PASS")
  const authorization = checkLeanDirectAuthorizationV5(repoRoot, readJson(repoRoot, LEAN_DIRECT_V5_ARTIFACT_PATHS.authorization)); const review = checkLeanDirectValidityReviewV5(repoRoot, readJson(repoRoot, LEAN_DIRECT_V5_ARTIFACT_PATHS.review)); if (!review.admitsPlan175 || review.blockingFindingCount !== 0) throw new TypeError("LEAN_DIRECT_V5_PLAN175_NOT_ADMITTED"); return { authorization, review, preflight }
}
export const checkLeanDirectReviewDispositionV5 = (repoRoot: string): LeanDirectValidityReviewV5 => {
  assertLeanStatus(git(repoRoot, ["status", "--short", "--untracked-files=all"]), [LEAN_DIRECT_V5_ARTIFACT_PATHS.review])
  const review = checkLeanDirectValidityReviewV5(repoRoot, readJson(repoRoot, LEAN_DIRECT_V5_ARTIFACT_PATHS.review))
  if (review.admitsPlan175) loadAndCheckLeanDirectReviewedReadyV5(repoRoot)
  else { for (const artifactPath of [LEAN_DIRECT_V5_ARTIFACT_PATHS.invocation, LEAN_DIRECT_V5_ARTIFACT_PATHS.terminal, LEAN_DIRECT_V5_ARTIFACT_PATHS.adjudication, LEAN_DIRECT_V5_ARTIFACT_PATHS.eligibility]) if (existsSync(path.resolve(repoRoot, artifactPath))) throw new TypeError(`LEAN_DIRECT_V5_DENIED_EFFECT:${artifactPath}`); if (Object.values(review.authority).some(Boolean)) throw new TypeError("LEAN_DIRECT_V5_DENIED_AUTHORITY") }
  return review
}
export const createLeanDirectInvocationV5 = (authorization: LeanDirectAuthorizationV5, review: LeanDirectValidityReviewV5, childCapabilityRoot: `sha256:${string}`): LeanDirectInvocationV5 => ({ schemaVersion: "v1.38-lean-runner-direct-invocation-v5", authorizationRoot: hashLeanValue(authorization), validityReviewRoot: hashLeanValue(review), preflightRoot: authorization.containerPreflight.root, sourceCommit: authorization.source.commit, childCapabilityRoot, claimClass: "fixture_feasibility_only", invocationOrdinal: 1, authority: LEAN_AUTHORITY_FALSE })
const validateLeanDirectInvocationV5 = (repoRoot: string, value: unknown): LeanDirectInvocationV5 => { const { authorization, review } = loadAndCheckLeanDirectReviewedReadyV5(repoRoot, [LEAN_DIRECT_V5_ARTIFACT_PATHS.invocation]); if (!isObject(value) || !isSha(value.childCapabilityRoot) || JSON.stringify(value) !== JSON.stringify(createLeanDirectInvocationV5(authorization, review, value.childCapabilityRoot))) throw new TypeError("LEAN_DIRECT_V5_INVOCATION_INVALID"); return globalThis.structuredClone(value) as unknown as LeanDirectInvocationV5 }
export const createLeanDirectTerminalArtifactV5 = (invocation: LeanDirectInvocationV5, terminal: LeanTerminal): LeanDirectTerminalArtifactV5 => ({ schemaVersion: "v1.38-lean-runner-direct-terminal-v5", authorizationRoot: invocation.authorizationRoot, validityReviewRoot: invocation.validityReviewRoot, preflightRoot: invocation.preflightRoot, sourceCommit: invocation.sourceCommit, childCapabilityRoot: invocation.childCapabilityRoot, invocationRoot: hashLeanValue(invocation), privacy: "safe_aggregate_only", terminal: deriveAndValidateLeanTerminal(terminal), authority: LEAN_AUTHORITY_FALSE })
export const createExclusiveLeanDirectTerminalV5 = (repoRoot: string, terminal: LeanDirectTerminalArtifactV5): void => writeExclusiveDurable(path.resolve(repoRoot, LEAN_DIRECT_V5_ARTIFACT_PATHS.terminal), terminal)
export const checkLeanDirectPostRunV5 = (repoRoot: string): { invocation: LeanDirectInvocationV5; terminal?: LeanDirectTerminalArtifactV5; markerOnly: boolean } => { const invocation = validateLeanDirectInvocationV5(repoRoot, readJson(repoRoot, LEAN_DIRECT_V5_ARTIFACT_PATHS.invocation)); if (!existsSync(path.resolve(repoRoot, LEAN_DIRECT_V5_ARTIFACT_PATHS.terminal))) return { invocation, markerOnly: true }; const value = readJson(repoRoot, LEAN_DIRECT_V5_ARTIFACT_PATHS.terminal); const expected = createLeanDirectTerminalArtifactV5(invocation, (value as LeanDirectTerminalArtifactV5).terminal); if (JSON.stringify(value) !== JSON.stringify(expected)) throw new TypeError("LEAN_DIRECT_V5_TERMINAL_INVALID"); return { invocation, terminal: value as LeanDirectTerminalArtifactV5, markerOnly: false } }
export const checkLeanDirectAdjudicationV5 = (repoRoot: string): void => { const { invocation, terminal, markerOnly } = checkLeanDirectPostRunV5(repoRoot); const adjudication = readJson(repoRoot, LEAN_DIRECT_V5_ARTIFACT_PATHS.adjudication); const result = markerOnly ? "invalid" : deriveAndValidateLeanTerminal(terminal!.terminal).result; if (!isObject(adjudication) || adjudication.schemaVersion !== "v1.38-lean-runner-direct-adjudication-v5" || adjudication.invocationRoot !== hashLeanValue(invocation) || adjudication.terminalRoot !== (terminal === undefined ? null : hashLeanValue(terminal)) || adjudication.reviewedResult !== result || adjudication.markerOnly !== markerOnly || adjudication.opportunityConsumed !== true || adjudication.admitsEligibility !== (result === "pass") || !exactFalseAuthority(adjudication.authority)) throw new TypeError("LEAN_DIRECT_V5_ADJUDICATION_INVALID"); const eligibility = readJson(repoRoot, LEAN_DIRECT_V5_ARTIFACT_PATHS.eligibility); const passed = result === "pass"; if (!isObject(eligibility) || eligibility.schemaVersion !== "v1.38-phase-262-lean-direct-eligibility-v5" || eligibility.adjudicationRoot !== hashLeanValue(adjudication) || eligibility.admit03 !== (passed ? "satisfied_under_revised_contract" : "blocked") || eligibility.phase262Complete !== passed || eligibility.phase263PlanningEligible !== passed || eligibility.phase263ExecutionEligible !== passed || !exactEligibilityAuthority(eligibility.authority, passed)) throw new TypeError("LEAN_DIRECT_V5_ELIGIBILITY_INVALID") }

const LEAN_DIRECT_PLAN184_PREFLIGHT_SHA256 = "19122ee63a6d529e201120b5daa69d5d2635cbf820afe90be1836a2095404b80" as const
const LEAN_DIRECT_PLAN184_REVIEW_SHA256 = "c38ce94a83abbfde786c7e152b2dc341c5ae09ba5969bf39ad1575910ab5be68" as const
const assertLeanDirectPlan184History = (repoRoot: string): void => {
  if (sha256File(path.resolve(repoRoot, LEAN_DIRECT_V5_ARTIFACT_PATHS.preflight)) !== LEAN_DIRECT_PLAN184_PREFLIGHT_SHA256 || sha256File(path.resolve(repoRoot, LEAN_DIRECT_V5_ARTIFACT_PATHS.review)) !== LEAN_DIRECT_PLAN184_REVIEW_SHA256) throw new TypeError("LEAN_DIRECT_PLAN184_HISTORY_DRIFT")
  const preflight = readJson(repoRoot, LEAN_DIRECT_V5_ARTIFACT_PATHS.preflight); const review = readJson(repoRoot, LEAN_DIRECT_V5_ARTIFACT_PATHS.review)
  if (!isObject(preflight) || !isObject(preflight.preflight) || preflight.preflight.status !== "non_pass" || preflight.matchInvocations !== 0 || !exactFalseAuthority(preflight.authority) || !isObject(review) || review.admitsPlan175 !== false || review.blockingFindingCount !== 1 || !exactFalseAuthority(review.authority)) throw new TypeError("LEAN_DIRECT_PLAN184_HISTORY_REINTERPRETED")
  for (const artifactPath of [LEAN_DIRECT_V5_ARTIFACT_PATHS.authorization, LEAN_DIRECT_V5_ARTIFACT_PATHS.invocation, LEAN_DIRECT_V5_ARTIFACT_PATHS.terminal, LEAN_DIRECT_V5_ARTIFACT_PATHS.adjudication, LEAN_DIRECT_V5_ARTIFACT_PATHS.eligibility]) if (existsSync(path.resolve(repoRoot, artifactPath))) throw new TypeError(`LEAN_DIRECT_PLAN184_HISTORY_EFFECT:${artifactPath}`)
}
const assertLeanDirectV6PathsAreFresh = (): void => {
  const historical = [...Object.values(LEAN_DIRECT_ARTIFACT_PATHS), ...Object.values(LEAN_DIRECT_V2_ARTIFACT_PATHS), ...Object.values(LEAN_DIRECT_V3_ARTIFACT_PATHS), ...Object.values(LEAN_DIRECT_V4_ARTIFACT_PATHS), ...Object.values(LEAN_DIRECT_V5_ARTIFACT_PATHS)]
  const fresh = Object.values(LEAN_DIRECT_V6_ARTIFACT_PATHS)
  if (new Set(fresh).size !== fresh.length || fresh.some((candidate) => historical.includes(candidate as never))) throw new TypeError("LEAN_DIRECT_V6_PATH_ALIAS")
}
const assertLeanPersistentStreamSource = (repoRoot: string, sourceCommit: string): void => {
  const source = git(repoRoot, ["show", `${sourceCommit}:scripts/lib/v1-38-lean-container-match-session.ts`])
  for (const token of ["LeanContainerPersistentStreamFactory", "requestId", "STREAM_FRAME_LIMIT_BYTES", "exactAbsent", '["exec", "-i", containerId', "state = \"poisoned\""]) if (!source.includes(token)) throw new TypeError("LEAN_DIRECT_V6_STREAM_INVARIANT_MISSING")
  if (source.includes('transport(dockerPath, ["exec"')) throw new TypeError("LEAN_DIRECT_V6_PER_METHOD_DOCKER_EXEC")
}
const assertLeanDirectV6TrackedBytes = (repoRoot: string, sourceCommit: string): void => {
  try { execFileSync("git", ["diff", "--quiet", sourceCommit, "--", ...LEAN_DIRECT_V4_EXECUTABLE_CLOSURE_PATHS], { cwd: repoRoot, stdio: "ignore" }) } catch { throw new TypeError("LEAN_DIRECT_V6_TRACKED_BYTES_DRIFT") }
  assertLeanPersistentStreamSource(repoRoot, sourceCommit)
}
const buildLeanContainerPreflightArtifactV5 = (repoRoot: string, explicitSourceRef: string, outcome: unknown): LeanContainerPreflightArtifactV5 => {
  const source = resolveLeanDirectV5Source(repoRoot, explicitSourceRef, true)
  return { schemaVersion: "v1.38-lean-runner-direct-container-preflight-v5", sourceCommit: source.commit, sourceTree: source.tree, executableClosureRoot: hashLeanValue(source.executableBlobs), preflight: validateLeanContainerPreflightOutcomeV3(outcome), consuming: false, preflightInvocations: 1, matchInvocations: 0, authority: LEAN_AUTHORITY_FALSE }
}
export const renderLeanContainerPreflightArtifactV5 = (repoRoot: string, explicitSourceRef: string, outcome: unknown): LeanContainerPreflightArtifactV5 => { assertLeanDirectPlan184History(repoRoot); assertLeanDirectV6PathsAreFresh(); return buildLeanContainerPreflightArtifactV5(repoRoot, explicitSourceRef, outcome) }
export const validateLeanContainerPreflightArtifactV5 = (repoRoot: string, value: unknown): LeanContainerPreflightArtifactV5 => {
  assertPrivacySafe(value)
  if (!isObject(value) || !exactKeys(value, ["schemaVersion", "sourceCommit", "sourceTree", "executableClosureRoot", "preflight", "consuming", "preflightInvocations", "matchInvocations", "authority"]) || value.schemaVersion !== "v1.38-lean-runner-direct-container-preflight-v5" || !isOid(value.sourceCommit) || !isOid(value.sourceTree) || !isSha(value.executableClosureRoot) || value.consuming !== false || value.preflightInvocations !== 1 || value.matchInvocations !== 0 || !exactFalseAuthority(value.authority)) throw new TypeError("LEAN_DIRECT_V6_PREFLIGHT_INVALID")
  const expected = buildLeanContainerPreflightArtifactV5(repoRoot, value.sourceCommit, value.preflight); if (JSON.stringify(value) !== JSON.stringify(expected)) throw new TypeError("LEAN_DIRECT_V6_PREFLIGHT_DRIFT")
  return globalThis.structuredClone(value) as unknown as LeanContainerPreflightArtifactV5
}
export const writeLeanContainerPreflightArtifactV5 = (repoRoot: string, explicitSourceRef: string): LeanContainerPreflightArtifactV5 => {
  assertLeanStatus(git(repoRoot, ["status", "--short", "--untracked-files=all"])); assertLeanDirectPlan184History(repoRoot); assertLeanDirectV6PathsAreFresh()
  for (const artifactPath of Object.values(LEAN_DIRECT_V6_ARTIFACT_PATHS)) if (existsSync(path.resolve(repoRoot, artifactPath))) throw new TypeError(`LEAN_DIRECT_V6_DESTINATION_EXISTS:${artifactPath}`)
  const sourceRef = validateLeanDirectV2ExplicitSourceRef(explicitSourceRef); const source = resolveLeanDirectV5Source(repoRoot, sourceRef, true); assertLeanDirectV6TrackedBytes(repoRoot, source.commit); assertSuccessorLockInventory(repoRoot)
  let outcome: LeanContainerPreflightOutcomeV2; try { outcome = runActualLeanContainerPreflight() } catch { outcome = { status: "non_pass", reasonCode: "container_preflight_refused" } }
  const artifact = renderLeanContainerPreflightArtifactV5(repoRoot, sourceRef, outcome); writeExclusiveDurable(path.resolve(repoRoot, LEAN_DIRECT_V6_ARTIFACT_PATHS.preflight), artifact); return artifact
}
const buildLeanDirectAuthorizationV6 = (repoRoot: string, explicitSourceRef: string, preflight: LeanContainerPreflightArtifactV5): LeanDirectAuthorizationV6 => {
  if (preflight.preflight.status !== "pass") throw new TypeError("LEAN_DIRECT_V6_PREFLIGHT_NOT_PASS")
  const source = resolveLeanDirectV5Source(repoRoot, explicitSourceRef, true); if (preflight.sourceCommit !== source.commit || preflight.sourceTree !== source.tree || preflight.executableClosureRoot !== hashLeanValue(source.executableBlobs)) throw new TypeError("LEAN_DIRECT_V6_PREFLIGHT_SOURCE_DRIFT")
  const base = buildLeanDirectAuthorization(repoRoot, source.commit)
  return { ...base, schemaVersion: "v1.38-lean-runner-direct-authorization-v6", source, containerPreflight: { path: LEAN_DIRECT_V6_ARTIFACT_PATHS.preflight, root: hashLeanValue(preflight) }, runtimeBoundary: { registryAdapterId: "runtime-js-container-subprocess", serviceAdapterId: LEAN_CONTAINER_ADAPTER_ID, image: LEAN_CONTAINER_IMAGE, controlsRoot: hashLeanValue(LEAN_CONTAINER_CONTROLS), methodCeilings: LEAN_CONTAINER_METHOD_CEILINGS, startupCleanupMarginMilliseconds: LEAN_CONTAINER_STARTUP_CLEANUP_MARGIN_MS, cellDeadlineMilliseconds: LEAN_CELL_DEADLINE_MS, outerDeadlineMilliseconds: 900000 }, plan174History: { authorizationPath: LEAN_DIRECT_ARTIFACT_PATHS.authorization, authorizationRoot: LEAN_DIRECT_V1_AUTHORIZATION_ROOT, reviewPath: LEAN_DIRECT_ARTIFACT_PATHS.review, reviewRoot: LEAN_DIRECT_V1_REVIEW_ROOT, status: "denied_preserved", resolvedByNewSource: ["CR-01", "CR-02"] }, plan178History: { preflightPath: LEAN_DIRECT_PLAN178_PREFLIGHT_PATH, preflightSha256: `sha256:${LEAN_DIRECT_PLAN178_PREFLIGHT_SHA256}`, reviewPath: LEAN_DIRECT_PLAN178_REVIEW_PATH, reviewSha256: `sha256:${LEAN_DIRECT_PLAN178_REVIEW_SHA256}`, status: "non_pass_preserved" }, plan180History: { preflightPath: LEAN_DIRECT_V3_ARTIFACT_PATHS.preflight, preflightSha256: `sha256:${LEAN_DIRECT_PLAN180_PREFLIGHT_SHA256}`, reviewPath: LEAN_DIRECT_V3_ARTIFACT_PATHS.review, reviewSha256: `sha256:${LEAN_DIRECT_PLAN180_REVIEW_SHA256}`, status: "non_pass_preserved" }, plan182History: { preflightPath: LEAN_DIRECT_V4_ARTIFACT_PATHS.preflight, preflightSha256: `sha256:${LEAN_DIRECT_PLAN182_PREFLIGHT_SHA256}`, reviewPath: LEAN_DIRECT_V4_ARTIFACT_PATHS.review, reviewSha256: `sha256:${LEAN_DIRECT_PLAN182_REVIEW_SHA256}`, status: "non_pass_preserved" }, plan184History: { preflightPath: LEAN_DIRECT_V5_ARTIFACT_PATHS.preflight, preflightSha256: `sha256:${LEAN_DIRECT_PLAN184_PREFLIGHT_SHA256}`, reviewPath: LEAN_DIRECT_V5_ARTIFACT_PATHS.review, reviewSha256: `sha256:${LEAN_DIRECT_PLAN184_REVIEW_SHA256}`, status: "non_pass_preserved" } }
}
export const renderLeanDirectAuthorizationV6 = (repoRoot: string, explicitSourceRef: string): LeanDirectAuthorizationV6 => { assertLeanDirectPlan184History(repoRoot); const preflight = validateLeanContainerPreflightArtifactV5(repoRoot, readJson(repoRoot, LEAN_DIRECT_V6_ARTIFACT_PATHS.preflight)); for (const artifactPath of Object.values(LEAN_DIRECT_V6_ARTIFACT_PATHS).filter((candidate) => candidate !== LEAN_DIRECT_V6_ARTIFACT_PATHS.preflight)) if (existsSync(path.resolve(repoRoot, artifactPath))) throw new TypeError(`LEAN_DIRECT_V6_DESTINATION_EXISTS:${artifactPath}`); return buildLeanDirectAuthorizationV6(repoRoot, validateLeanDirectV2ExplicitSourceRef(explicitSourceRef), preflight) }
export const validateLeanDirectAuthorizationV6 = (repoRoot: string, value: unknown): LeanDirectAuthorizationV6 => { assertPrivacySafe(value); if (!isObject(value) || value.schemaVersion !== "v1.38-lean-runner-direct-authorization-v6" || !isObject(value.source) || !isOid(value.source.commit)) throw new TypeError("LEAN_DIRECT_V6_AUTHORIZATION_INVALID"); const expected = buildLeanDirectAuthorizationV6(repoRoot, value.source.commit, validateLeanContainerPreflightArtifactV5(repoRoot, readJson(repoRoot, LEAN_DIRECT_V6_ARTIFACT_PATHS.preflight))); if (JSON.stringify(value) !== JSON.stringify(expected)) throw new TypeError("LEAN_DIRECT_V6_AUTHORIZATION_DRIFT"); return globalThis.structuredClone(value) as unknown as LeanDirectAuthorizationV6 }
export const checkLeanDirectAuthorizationV6 = (repoRoot: string, value: unknown): LeanDirectAuthorizationV6 => { const authorization = validateLeanDirectAuthorizationV6(repoRoot, value); assertLeanDirectV6TrackedBytes(repoRoot, authorization.source.commit); assertLeanDirectPlan184History(repoRoot); assertSuccessorLockInventory(repoRoot); return authorization }
export const writeLeanDirectAuthorizationV6 = (repoRoot: string, explicitSourceRef: string): LeanDirectAuthorizationV6 => { const authorization = renderLeanDirectAuthorizationV6(repoRoot, explicitSourceRef); writeExclusiveDurable(path.resolve(repoRoot, LEAN_DIRECT_V6_ARTIFACT_PATHS.authorization), authorization); return authorization }
export const checkLeanDirectContainerStreamSourceOnlyV6 = (repoRoot: string): void => {
  assertLeanStatus(git(repoRoot, ["status", "--short", "--untracked-files=all"])); checkLeanFirstEvidenceCustody(repoRoot); assertDeniedDirectV1History(repoRoot); assertLeanDirectPlan178History(repoRoot); assertLeanDirectPlan180History(repoRoot); assertLeanDirectPlan182History(repoRoot); assertLeanDirectPlan184History(repoRoot); assertLeanDirectV6PathsAreFresh()
  for (const artifactPath of Object.values(LEAN_DIRECT_V6_ARTIFACT_PATHS)) if (existsSync(path.resolve(repoRoot, artifactPath))) throw new TypeError(`LEAN_DIRECT_V6_DESTINATION_EXISTS:${artifactPath}`)
  const latest = git(repoRoot, ["log", "-1", "--format=%H", "--", ...LEAN_PLAN177_RUNNABLE_PATHS]); const source = resolveLeanDirectV5Source(repoRoot, latest, false); if (source.commit !== latest) throw new TypeError("LEAN_DIRECT_V6_SOURCE_DRIFT"); assertLeanDirectV6TrackedBytes(repoRoot, source.commit); assertSuccessorLockInventory(repoRoot)
}
export const checkLeanDirectValidityReviewV6 = (repoRoot: string, value: unknown): LeanDirectValidityReviewV6 => {
  assertPrivacySafe(value); const preflight = validateLeanContainerPreflightArtifactV5(repoRoot, readJson(repoRoot, LEAN_DIRECT_V6_ARTIFACT_PATHS.preflight)); const authorizationPresent = existsSync(path.resolve(repoRoot, LEAN_DIRECT_V6_ARTIFACT_PATHS.authorization)); const authorization = authorizationPresent ? checkLeanDirectAuthorizationV6(repoRoot, readJson(repoRoot, LEAN_DIRECT_V6_ARTIFACT_PATHS.authorization)) : undefined
  if (!isObject(value) || !exactKeys(value, ["schemaVersion", "authorizationRoot", "preflightRoot", "sourceCommit", "sourceTree", "categories", "blockingFindingCount", "certificationOnlyHistory", "admitsPlan175", "authority"]) || value.schemaVersion !== "v1.38-lean-runner-direct-validity-review-v6" || value.authorizationRoot !== (authorization === undefined ? null : hashLeanValue(authorization)) || value.preflightRoot !== hashLeanValue(preflight) || value.sourceCommit !== preflight.sourceCommit || value.sourceTree !== preflight.sourceTree || !Array.isArray(value.categories) || value.categories.length !== LEAN_DIRECT_VALIDITY_CATEGORIES.length || !Number.isSafeInteger(value.blockingFindingCount) || (value.blockingFindingCount as number) < 0 || JSON.stringify(value.certificationOnlyHistory) !== JSON.stringify(plan172Findings(repoRoot)) || !exactFalseAuthority(value.authority)) throw new TypeError("LEAN_DIRECT_V6_REVIEW_INVALID")
  for (const [index, expected] of LEAN_DIRECT_VALIDITY_CATEGORIES.entries()) { const item = value.categories[index]; if (!isObject(item) || !exactKeys(item, ["category", "status", "evidence"]) || item.category !== expected || !["pass", "finding"].includes(String(item.status)) || typeof item.evidence !== "string" || item.evidence.length === 0) throw new TypeError("LEAN_DIRECT_V6_REVIEW_INVALID") }
  const findings = value.categories.filter((item) => isObject(item) && item.status === "finding").length; const admitted = preflight.preflight.status === "pass" && authorization !== undefined && findings === 0; if (value.blockingFindingCount !== findings || value.admitsPlan175 !== admitted) throw new TypeError("LEAN_DIRECT_V6_REVIEW_INVALID"); return globalThis.structuredClone(value) as unknown as LeanDirectValidityReviewV6
}
export const loadAndCheckLeanDirectReviewedReadyV6 = (repoRoot: string, allowedOperationalPaths: readonly string[] = []): { authorization: LeanDirectAuthorizationV6; review: LeanDirectValidityReviewV6; preflight: LeanContainerPreflightArtifactV5 } => { assertLeanStatus(git(repoRoot, ["status", "--short", "--untracked-files=all"]), allowedOperationalPaths); for (const artifactPath of [LEAN_DIRECT_V6_ARTIFACT_PATHS.invocation, LEAN_DIRECT_V6_ARTIFACT_PATHS.terminal, LEAN_DIRECT_V6_ARTIFACT_PATHS.adjudication, LEAN_DIRECT_V6_ARTIFACT_PATHS.eligibility]) if (!allowedOperationalPaths.includes(artifactPath) && existsSync(path.resolve(repoRoot, artifactPath))) throw new TypeError(`LEAN_DIRECT_V6_EFFECT_EXISTS:${artifactPath}`); const preflight = validateLeanContainerPreflightArtifactV5(repoRoot, readJson(repoRoot, LEAN_DIRECT_V6_ARTIFACT_PATHS.preflight)); if (preflight.preflight.status !== "pass") throw new TypeError("LEAN_DIRECT_V6_PREFLIGHT_NOT_PASS"); const authorization = checkLeanDirectAuthorizationV6(repoRoot, readJson(repoRoot, LEAN_DIRECT_V6_ARTIFACT_PATHS.authorization)); const review = checkLeanDirectValidityReviewV6(repoRoot, readJson(repoRoot, LEAN_DIRECT_V6_ARTIFACT_PATHS.review)); if (!review.admitsPlan175 || review.blockingFindingCount !== 0) throw new TypeError("LEAN_DIRECT_V6_PLAN175_NOT_ADMITTED"); return { authorization, review, preflight } }
export const checkLeanDirectReviewDispositionV6 = (repoRoot: string): LeanDirectValidityReviewV6 => { assertLeanStatus(git(repoRoot, ["status", "--short", "--untracked-files=all"]), [LEAN_DIRECT_V6_ARTIFACT_PATHS.review]); const review = checkLeanDirectValidityReviewV6(repoRoot, readJson(repoRoot, LEAN_DIRECT_V6_ARTIFACT_PATHS.review)); if (review.admitsPlan175) loadAndCheckLeanDirectReviewedReadyV6(repoRoot); else { for (const artifactPath of [LEAN_DIRECT_V6_ARTIFACT_PATHS.invocation, LEAN_DIRECT_V6_ARTIFACT_PATHS.terminal, LEAN_DIRECT_V6_ARTIFACT_PATHS.adjudication, LEAN_DIRECT_V6_ARTIFACT_PATHS.eligibility]) if (existsSync(path.resolve(repoRoot, artifactPath))) throw new TypeError(`LEAN_DIRECT_V6_DENIED_EFFECT:${artifactPath}`); if (Object.values(review.authority).some(Boolean)) throw new TypeError("LEAN_DIRECT_V6_DENIED_AUTHORITY") }; return review }
export const createLeanDirectInvocationV6 = (authorization: LeanDirectAuthorizationV6, review: LeanDirectValidityReviewV6, childCapabilityRoot: `sha256:${string}`): LeanDirectInvocationV6 => ({ schemaVersion: "v1.38-lean-runner-direct-invocation-v6", authorizationRoot: hashLeanValue(authorization), validityReviewRoot: hashLeanValue(review), preflightRoot: authorization.containerPreflight.root, sourceCommit: authorization.source.commit, childCapabilityRoot, claimClass: "fixture_feasibility_only", invocationOrdinal: 1, authority: LEAN_AUTHORITY_FALSE })
const validateLeanDirectInvocationV6 = (repoRoot: string, value: unknown): LeanDirectInvocationV6 => { const { authorization, review } = loadAndCheckLeanDirectReviewedReadyV6(repoRoot, [LEAN_DIRECT_V6_ARTIFACT_PATHS.invocation]); if (!isObject(value) || !isSha(value.childCapabilityRoot) || JSON.stringify(value) !== JSON.stringify(createLeanDirectInvocationV6(authorization, review, value.childCapabilityRoot))) throw new TypeError("LEAN_DIRECT_V6_INVOCATION_INVALID"); return globalThis.structuredClone(value) as unknown as LeanDirectInvocationV6 }
export const createLeanDirectTerminalArtifactV6 = (invocation: LeanDirectInvocationV6, terminal: LeanTerminal): LeanDirectTerminalArtifactV6 => ({ schemaVersion: "v1.38-lean-runner-direct-terminal-v6", authorizationRoot: invocation.authorizationRoot, validityReviewRoot: invocation.validityReviewRoot, preflightRoot: invocation.preflightRoot, sourceCommit: invocation.sourceCommit, childCapabilityRoot: invocation.childCapabilityRoot, invocationRoot: hashLeanValue(invocation), privacy: "safe_aggregate_only", terminal: deriveAndValidateLeanTerminal(terminal), authority: LEAN_AUTHORITY_FALSE })
export const createExclusiveLeanDirectTerminalV6 = (repoRoot: string, terminal: LeanDirectTerminalArtifactV6): void => writeExclusiveDurable(path.resolve(repoRoot, LEAN_DIRECT_V6_ARTIFACT_PATHS.terminal), terminal)
export const checkLeanDirectPostRunV6 = (repoRoot: string): { invocation: LeanDirectInvocationV6; terminal?: LeanDirectTerminalArtifactV6; markerOnly: boolean } => { const invocation = validateLeanDirectInvocationV6(repoRoot, readJson(repoRoot, LEAN_DIRECT_V6_ARTIFACT_PATHS.invocation)); if (!existsSync(path.resolve(repoRoot, LEAN_DIRECT_V6_ARTIFACT_PATHS.terminal))) return { invocation, markerOnly: true }; const value = readJson(repoRoot, LEAN_DIRECT_V6_ARTIFACT_PATHS.terminal); const expected = createLeanDirectTerminalArtifactV6(invocation, (value as LeanDirectTerminalArtifactV6).terminal); if (JSON.stringify(value) !== JSON.stringify(expected)) throw new TypeError("LEAN_DIRECT_V6_TERMINAL_INVALID"); return { invocation, terminal: value as LeanDirectTerminalArtifactV6, markerOnly: false } }
export const checkLeanDirectAdjudicationV6 = (repoRoot: string): void => { const { invocation, terminal, markerOnly } = checkLeanDirectPostRunV6(repoRoot); const adjudication = readJson(repoRoot, LEAN_DIRECT_V6_ARTIFACT_PATHS.adjudication); const result = markerOnly ? "invalid" : deriveAndValidateLeanTerminal(terminal!.terminal).result; if (!isObject(adjudication) || adjudication.schemaVersion !== "v1.38-lean-runner-direct-adjudication-v6" || adjudication.invocationRoot !== hashLeanValue(invocation) || adjudication.terminalRoot !== (terminal === undefined ? null : hashLeanValue(terminal)) || adjudication.reviewedResult !== result || adjudication.markerOnly !== markerOnly || adjudication.opportunityConsumed !== true || adjudication.admitsEligibility !== (result === "pass") || !exactFalseAuthority(adjudication.authority)) throw new TypeError("LEAN_DIRECT_V6_ADJUDICATION_INVALID"); const eligibility = readJson(repoRoot, LEAN_DIRECT_V6_ARTIFACT_PATHS.eligibility); const passed = result === "pass"; if (!isObject(eligibility) || eligibility.schemaVersion !== "v1.38-phase-262-lean-direct-eligibility-v6" || eligibility.adjudicationRoot !== hashLeanValue(adjudication) || eligibility.admit03 !== (passed ? "satisfied_under_revised_contract" : "blocked") || eligibility.phase262Complete !== passed || eligibility.phase263PlanningEligible !== passed || eligibility.phase263ExecutionEligible !== passed || !exactEligibilityAuthority(eligibility.authority, passed)) throw new TypeError("LEAN_DIRECT_V6_ELIGIBILITY_INVALID") }

const LEAN_PLAN185_RUNNABLE_COMMIT = "ae4fd480197393d1c7d27dbc43878d3b31e36b25" as const
const LEAN_PLAN185_RUNNABLE_TREE = "0c402d3f1eaab766325948d1925ef0aafa1fd7b7" as const
const LEAN_PLAN185_CORRECTED_CLOSURE_ROOT = "sha256:007eb34c12041eb535f0ff4b5999e8b894fa105fff421fb64dd5045822ac93ae" as const
const LEAN_PLAN185_STALE_CLOSURE_ROOT = "sha256:1e187745221a31d67d1d284b3e4abb0cc83d231b85b89910b99c3e31244c30fa" as const
const LEAN_DIRECT_PLAN186_PREFLIGHT_SHA256 = "346bfd6fe86acd3b7bbddf11d83300c7051648b397c036565322908ae243a6e8" as const
const LEAN_DIRECT_PLAN186_REVIEW_SHA256 = "69ae56c16e8edfa488e172ee34dfd2332b1c2a5b809a866f9d091b57dc8a0658" as const

const PREFLIGHT_REASON_CODES = Object.freeze([
  "docker_unavailable", "image_inspect_invalid", "adapter_drift", "fixture_artifact_missing",
  "probe_failed", "cleanup_incomplete", "evaluation_refused", "unexpected_failure",
] as const)

export const classifyLeanContainerPreflightFailure = (error: unknown): LeanContainerPreflightReasonCode => {
  const code = error instanceof Error ? error.message : ""
  if (code === "LEAN_CONTAINER_PREFLIGHT_DOCKER_UNAVAILABLE") return "docker_unavailable"
  if (code === "LEAN_CONTAINER_PREFLIGHT_IMAGE_INSPECT_INVALID" || code === "LEAN_CONTAINER_PREFLIGHT_IMAGE_DRIFT") return "image_inspect_invalid"
  if (code === "LEAN_CONTAINER_PREFLIGHT_ADAPTER_DRIFT" || code === "LEAN_CONTAINER_PREFLIGHT_ISOLATION_DRIFT") return "adapter_drift"
  if (code === "LEAN_CONTAINER_PREFLIGHT_ARTIFACT_MISSING" || code === "LEAN_CONTAINER_FIXTURE_ARTIFACT_MISSING") return "fixture_artifact_missing"
  if (code === "LEAN_CONTAINER_PREFLIGHT_PROBE_FAILED" || code.startsWith("LEAN_CONTAINER_SESSION_")) return "probe_failed"
  if (code === "LEAN_CONTAINER_PREFLIGHT_LIFECYCLE_FAILED" || code.includes("CLEANUP_INCOMPLETE") || code.includes("ORPHAN")) return "cleanup_incomplete"
  if (code.startsWith("LEAN_CONTAINER_PREFLIGHT_")) return "evaluation_refused"
  return "unexpected_failure"
}

export const validateLeanContainerPreflightOutcomeV4 = (value: unknown): LeanContainerPreflightOutcomeV4 => {
  if (isObject(value) && value.status === "non_pass") {
    if (!exactKeys(value, ["status", "reasonCode"]) || !PREFLIGHT_REASON_CODES.includes(value.reasonCode as LeanContainerPreflightReasonCode)) throw new TypeError("LEAN_DIRECT_V7_PREFLIGHT_OUTCOME_INVALID")
    return globalThis.structuredClone(value) as LeanContainerPreflightOutcomeV4
  }
  return validateLeanContainerSessionPreflightEvidence(value)
}

export const checkLeanPlan185ClosureCorrection = (repoRoot: string, summaryOverride?: string): void => {
  const source: LeanManifest["source"] = {
    commit: git(repoRoot, ["rev-parse", `${LEAN_PLAN185_RUNNABLE_COMMIT}^{commit}`]),
    tree: git(repoRoot, ["show", "-s", "--format=%T", LEAN_PLAN185_RUNNABLE_COMMIT]),
    executableBlobs: Object.fromEntries(LEAN_DIRECT_V4_EXECUTABLE_CLOSURE_PATHS.map((sourcePath) => [sourcePath, git(repoRoot, ["rev-parse", `${LEAN_PLAN185_RUNNABLE_COMMIT}:${sourcePath}`])])),
  }
  if (source.tree !== LEAN_PLAN185_RUNNABLE_TREE || Object.keys(source.executableBlobs).length !== 29 || hashLeanValue(source.executableBlobs) !== LEAN_PLAN185_CORRECTED_CLOSURE_ROOT) throw new TypeError("LEAN_PLAN185_EXACT_CLOSURE_DRIFT")
  const summary = summaryOverride ?? readFileSync(path.resolve(repoRoot, ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-185-SUMMARY.md"), "utf8")
  for (const token of [LEAN_PLAN185_RUNNABLE_COMMIT, "29-path", LEAN_PLAN185_CORRECTED_CLOSURE_ROOT, LEAN_PLAN185_STALE_CLOSURE_ROOT, "stale", "superseded"]) if (!summary.includes(token)) throw new TypeError("LEAN_PLAN185_CLOSURE_CORRECTION_MISSING")
}

const assertLeanDirectPlan186History = (repoRoot: string): void => {
  if (sha256File(path.resolve(repoRoot, LEAN_DIRECT_V6_ARTIFACT_PATHS.preflight)) !== LEAN_DIRECT_PLAN186_PREFLIGHT_SHA256 || sha256File(path.resolve(repoRoot, LEAN_DIRECT_V6_ARTIFACT_PATHS.review)) !== LEAN_DIRECT_PLAN186_REVIEW_SHA256) throw new TypeError("LEAN_DIRECT_PLAN186_HISTORY_DRIFT")
  const preflight = readJson(repoRoot, LEAN_DIRECT_V6_ARTIFACT_PATHS.preflight); const review = readJson(repoRoot, LEAN_DIRECT_V6_ARTIFACT_PATHS.review)
  if (!isObject(preflight) || !isObject(preflight.preflight) || preflight.preflight.status !== "non_pass" || preflight.matchInvocations !== 0 || !exactFalseAuthority(preflight.authority) || !isObject(review) || review.admitsPlan175 !== false || review.blockingFindingCount !== 1 || !exactFalseAuthority(review.authority)) throw new TypeError("LEAN_DIRECT_PLAN186_HISTORY_REINTERPRETED")
  for (const artifactPath of [LEAN_DIRECT_V6_ARTIFACT_PATHS.authorization, LEAN_DIRECT_V6_ARTIFACT_PATHS.invocation, LEAN_DIRECT_V6_ARTIFACT_PATHS.terminal, LEAN_DIRECT_V6_ARTIFACT_PATHS.adjudication, LEAN_DIRECT_V6_ARTIFACT_PATHS.eligibility]) if (existsSync(path.resolve(repoRoot, artifactPath))) throw new TypeError(`LEAN_DIRECT_PLAN186_HISTORY_EFFECT:${artifactPath}`)
}

const assertLeanDirectV7PathsAreFresh = (): void => {
  const historical = [...Object.values(LEAN_DIRECT_ARTIFACT_PATHS), ...Object.values(LEAN_DIRECT_V2_ARTIFACT_PATHS), ...Object.values(LEAN_DIRECT_V3_ARTIFACT_PATHS), ...Object.values(LEAN_DIRECT_V4_ARTIFACT_PATHS), ...Object.values(LEAN_DIRECT_V5_ARTIFACT_PATHS), ...Object.values(LEAN_DIRECT_V6_ARTIFACT_PATHS)]
  const fresh = Object.values(LEAN_DIRECT_V7_ARTIFACT_PATHS)
  if (new Set(fresh).size !== fresh.length || fresh.some((candidate) => historical.includes(candidate as never))) throw new TypeError("LEAN_DIRECT_V7_PATH_ALIAS")
}

const resolveLeanDirectV7Source = (repoRoot: string, explicitRef: string, rejectCurrentHead: boolean): LeanManifest["source"] => resolveLeanDirectV5Source(repoRoot, explicitRef, rejectCurrentHead)
const assertLeanDirectV7TrackedBytes = (repoRoot: string, sourceCommit: string): void => {
  try { execFileSync("git", ["diff", "--quiet", sourceCommit, "--", ...LEAN_DIRECT_V4_EXECUTABLE_CLOSURE_PATHS], { cwd: repoRoot, stdio: "ignore" }) } catch { throw new TypeError("LEAN_DIRECT_V7_TRACKED_BYTES_DRIFT") }
  assertLeanPersistentStreamSource(repoRoot, sourceCommit)
}

const buildLeanContainerPreflightArtifactV6 = (repoRoot: string, explicitSourceRef: string, outcome: unknown): LeanContainerPreflightArtifactV6 => {
  const source = resolveLeanDirectV7Source(repoRoot, explicitSourceRef, true)
  return { schemaVersion: "v1.38-lean-runner-direct-container-preflight-v6", sourceCommit: source.commit, sourceTree: source.tree, executableClosureRoot: hashLeanValue(source.executableBlobs), preflight: validateLeanContainerPreflightOutcomeV4(outcome), consuming: false, preflightInvocations: 1, matchInvocations: 0, authority: LEAN_AUTHORITY_FALSE }
}
export const renderLeanContainerPreflightArtifactV6 = (repoRoot: string, explicitSourceRef: string, outcome: unknown): LeanContainerPreflightArtifactV6 => { assertLeanDirectPlan186History(repoRoot); checkLeanPlan185ClosureCorrection(repoRoot); assertLeanDirectV7PathsAreFresh(); return buildLeanContainerPreflightArtifactV6(repoRoot, explicitSourceRef, outcome) }
export const validateLeanContainerPreflightArtifactV6 = (repoRoot: string, value: unknown): LeanContainerPreflightArtifactV6 => {
  assertPrivacySafe(value)
  if (!isObject(value) || !exactKeys(value, ["schemaVersion", "sourceCommit", "sourceTree", "executableClosureRoot", "preflight", "consuming", "preflightInvocations", "matchInvocations", "authority"]) || value.schemaVersion !== "v1.38-lean-runner-direct-container-preflight-v6" || !isOid(value.sourceCommit) || !isOid(value.sourceTree) || !isSha(value.executableClosureRoot) || value.consuming !== false || value.preflightInvocations !== 1 || value.matchInvocations !== 0 || !exactFalseAuthority(value.authority)) throw new TypeError("LEAN_DIRECT_V7_PREFLIGHT_INVALID")
  const expected = buildLeanContainerPreflightArtifactV6(repoRoot, value.sourceCommit, value.preflight); if (JSON.stringify(value) !== JSON.stringify(expected)) throw new TypeError("LEAN_DIRECT_V7_PREFLIGHT_DRIFT")
  return globalThis.structuredClone(value) as unknown as LeanContainerPreflightArtifactV6
}
export const writeLeanContainerPreflightArtifactV6 = (repoRoot: string, explicitSourceRef: string): LeanContainerPreflightArtifactV6 => {
  assertLeanStatus(git(repoRoot, ["status", "--short", "--untracked-files=all"])); assertLeanDirectPlan186History(repoRoot); checkLeanPlan185ClosureCorrection(repoRoot); assertLeanDirectV7PathsAreFresh()
  for (const artifactPath of Object.values(LEAN_DIRECT_V7_ARTIFACT_PATHS)) if (existsSync(path.resolve(repoRoot, artifactPath))) throw new TypeError(`LEAN_DIRECT_V7_DESTINATION_EXISTS:${artifactPath}`)
  const sourceRef = validateLeanDirectV2ExplicitSourceRef(explicitSourceRef); const source = resolveLeanDirectV7Source(repoRoot, sourceRef, true); assertLeanDirectV7TrackedBytes(repoRoot, source.commit); assertSuccessorLockInventory(repoRoot)
  let outcome: LeanContainerPreflightOutcomeV4
  try { outcome = runActualLeanContainerPreflight() } catch (error) { outcome = { status: "non_pass", reasonCode: classifyLeanContainerPreflightFailure(error) } }
  const artifact = renderLeanContainerPreflightArtifactV6(repoRoot, sourceRef, outcome); writeExclusiveDurable(path.resolve(repoRoot, LEAN_DIRECT_V7_ARTIFACT_PATHS.preflight), artifact); return artifact
}

const buildLeanDirectAuthorizationV7 = (repoRoot: string, explicitSourceRef: string, preflight: LeanContainerPreflightArtifactV6): LeanDirectAuthorizationV7 => {
  if (preflight.preflight.status !== "pass") throw new TypeError("LEAN_DIRECT_V7_PREFLIGHT_NOT_PASS")
  const source = resolveLeanDirectV7Source(repoRoot, explicitSourceRef, true); if (preflight.sourceCommit !== source.commit || preflight.sourceTree !== source.tree || preflight.executableClosureRoot !== hashLeanValue(source.executableBlobs)) throw new TypeError("LEAN_DIRECT_V7_PREFLIGHT_SOURCE_DRIFT")
  const base = buildLeanDirectAuthorization(repoRoot, source.commit)
  return { ...base, schemaVersion: "v1.38-lean-runner-direct-authorization-v7", source, containerPreflight: { path: LEAN_DIRECT_V7_ARTIFACT_PATHS.preflight, root: hashLeanValue(preflight) }, runtimeBoundary: { registryAdapterId: "runtime-js-container-subprocess", serviceAdapterId: LEAN_CONTAINER_ADAPTER_ID, image: LEAN_CONTAINER_IMAGE, controlsRoot: hashLeanValue(LEAN_CONTAINER_CONTROLS), methodCeilings: LEAN_CONTAINER_METHOD_CEILINGS, startupCleanupMarginMilliseconds: LEAN_CONTAINER_STARTUP_CLEANUP_MARGIN_MS, cellDeadlineMilliseconds: LEAN_CELL_DEADLINE_MS, outerDeadlineMilliseconds: 900000 }, plan174History: { authorizationPath: LEAN_DIRECT_ARTIFACT_PATHS.authorization, authorizationRoot: LEAN_DIRECT_V1_AUTHORIZATION_ROOT, reviewPath: LEAN_DIRECT_ARTIFACT_PATHS.review, reviewRoot: LEAN_DIRECT_V1_REVIEW_ROOT, status: "denied_preserved", resolvedByNewSource: ["CR-01", "CR-02"] }, plan178History: { preflightPath: LEAN_DIRECT_PLAN178_PREFLIGHT_PATH, preflightSha256: `sha256:${LEAN_DIRECT_PLAN178_PREFLIGHT_SHA256}`, reviewPath: LEAN_DIRECT_PLAN178_REVIEW_PATH, reviewSha256: `sha256:${LEAN_DIRECT_PLAN178_REVIEW_SHA256}`, status: "non_pass_preserved" }, plan180History: { preflightPath: LEAN_DIRECT_V3_ARTIFACT_PATHS.preflight, preflightSha256: `sha256:${LEAN_DIRECT_PLAN180_PREFLIGHT_SHA256}`, reviewPath: LEAN_DIRECT_V3_ARTIFACT_PATHS.review, reviewSha256: `sha256:${LEAN_DIRECT_PLAN180_REVIEW_SHA256}`, status: "non_pass_preserved" }, plan182History: { preflightPath: LEAN_DIRECT_V4_ARTIFACT_PATHS.preflight, preflightSha256: `sha256:${LEAN_DIRECT_PLAN182_PREFLIGHT_SHA256}`, reviewPath: LEAN_DIRECT_V4_ARTIFACT_PATHS.review, reviewSha256: `sha256:${LEAN_DIRECT_PLAN182_REVIEW_SHA256}`, status: "non_pass_preserved" }, plan184History: { preflightPath: LEAN_DIRECT_V5_ARTIFACT_PATHS.preflight, preflightSha256: `sha256:${LEAN_DIRECT_PLAN184_PREFLIGHT_SHA256}`, reviewPath: LEAN_DIRECT_V5_ARTIFACT_PATHS.review, reviewSha256: `sha256:${LEAN_DIRECT_PLAN184_REVIEW_SHA256}`, status: "non_pass_preserved" }, plan186History: { preflightPath: LEAN_DIRECT_V6_ARTIFACT_PATHS.preflight, preflightSha256: `sha256:${LEAN_DIRECT_PLAN186_PREFLIGHT_SHA256}`, reviewPath: LEAN_DIRECT_V6_ARTIFACT_PATHS.review, reviewSha256: `sha256:${LEAN_DIRECT_PLAN186_REVIEW_SHA256}`, status: "non_pass_preserved" } }
}
export const renderLeanDirectAuthorizationV7 = (repoRoot: string, explicitSourceRef: string): LeanDirectAuthorizationV7 => { assertLeanDirectPlan186History(repoRoot); checkLeanPlan185ClosureCorrection(repoRoot); const preflight = validateLeanContainerPreflightArtifactV6(repoRoot, readJson(repoRoot, LEAN_DIRECT_V7_ARTIFACT_PATHS.preflight)); for (const artifactPath of Object.values(LEAN_DIRECT_V7_ARTIFACT_PATHS).filter((candidate) => candidate !== LEAN_DIRECT_V7_ARTIFACT_PATHS.preflight)) if (existsSync(path.resolve(repoRoot, artifactPath))) throw new TypeError(`LEAN_DIRECT_V7_DESTINATION_EXISTS:${artifactPath}`); return buildLeanDirectAuthorizationV7(repoRoot, validateLeanDirectV2ExplicitSourceRef(explicitSourceRef), preflight) }
export const validateLeanDirectAuthorizationV7 = (repoRoot: string, value: unknown): LeanDirectAuthorizationV7 => { assertPrivacySafe(value); if (!isObject(value) || value.schemaVersion !== "v1.38-lean-runner-direct-authorization-v7" || !isObject(value.source) || !isOid(value.source.commit)) throw new TypeError("LEAN_DIRECT_V7_AUTHORIZATION_INVALID"); const expected = buildLeanDirectAuthorizationV7(repoRoot, value.source.commit, validateLeanContainerPreflightArtifactV6(repoRoot, readJson(repoRoot, LEAN_DIRECT_V7_ARTIFACT_PATHS.preflight))); if (JSON.stringify(value) !== JSON.stringify(expected)) throw new TypeError("LEAN_DIRECT_V7_AUTHORIZATION_DRIFT"); return globalThis.structuredClone(value) as unknown as LeanDirectAuthorizationV7 }
export const checkLeanDirectAuthorizationV7 = (repoRoot: string, value: unknown): LeanDirectAuthorizationV7 => { const authorization = validateLeanDirectAuthorizationV7(repoRoot, value); assertLeanDirectV7TrackedBytes(repoRoot, authorization.source.commit); assertLeanDirectPlan186History(repoRoot); checkLeanPlan185ClosureCorrection(repoRoot); assertSuccessorLockInventory(repoRoot); return authorization }
export const writeLeanDirectAuthorizationV7 = (repoRoot: string, explicitSourceRef: string): LeanDirectAuthorizationV7 => { const authorization = renderLeanDirectAuthorizationV7(repoRoot, explicitSourceRef); writeExclusiveDurable(path.resolve(repoRoot, LEAN_DIRECT_V7_ARTIFACT_PATHS.authorization), authorization); return authorization }
export const checkLeanDirectPreflightReferenceSourceOnlyV7 = (repoRoot: string): void => {
  assertLeanStatus(git(repoRoot, ["status", "--short", "--untracked-files=all"])); checkLeanFirstEvidenceCustody(repoRoot); assertDeniedDirectV1History(repoRoot); assertLeanDirectPlan178History(repoRoot); assertLeanDirectPlan180History(repoRoot); assertLeanDirectPlan182History(repoRoot); assertLeanDirectPlan184History(repoRoot); assertLeanDirectPlan186History(repoRoot); checkLeanPlan185ClosureCorrection(repoRoot); assertLeanDirectV7PathsAreFresh()
  for (const artifactPath of Object.values(LEAN_DIRECT_V7_ARTIFACT_PATHS)) if (existsSync(path.resolve(repoRoot, artifactPath))) throw new TypeError(`LEAN_DIRECT_V7_DESTINATION_EXISTS:${artifactPath}`)
  const latest = git(repoRoot, ["log", "-1", "--format=%H", "--", ...LEAN_PLAN177_RUNNABLE_PATHS]); const source = resolveLeanDirectV7Source(repoRoot, latest, false); if (source.commit !== latest || Object.keys(source.executableBlobs).length !== 29) throw new TypeError("LEAN_DIRECT_V7_SOURCE_DRIFT"); assertLeanDirectV7TrackedBytes(repoRoot, source.commit); assertSuccessorLockInventory(repoRoot)
}
export const checkLeanDirectValidityReviewV7 = (repoRoot: string, value: unknown): LeanDirectValidityReviewV7 => {
  assertPrivacySafe(value); const preflight = validateLeanContainerPreflightArtifactV6(repoRoot, readJson(repoRoot, LEAN_DIRECT_V7_ARTIFACT_PATHS.preflight)); const authorizationPresent = existsSync(path.resolve(repoRoot, LEAN_DIRECT_V7_ARTIFACT_PATHS.authorization)); const authorization = authorizationPresent ? checkLeanDirectAuthorizationV7(repoRoot, readJson(repoRoot, LEAN_DIRECT_V7_ARTIFACT_PATHS.authorization)) : undefined
  if (!isObject(value) || !exactKeys(value, ["schemaVersion", "authorizationRoot", "preflightRoot", "sourceCommit", "sourceTree", "categories", "blockingFindingCount", "certificationOnlyHistory", "admitsPlan175", "authority"]) || value.schemaVersion !== "v1.38-lean-runner-direct-validity-review-v7" || value.authorizationRoot !== (authorization === undefined ? null : hashLeanValue(authorization)) || value.preflightRoot !== hashLeanValue(preflight) || value.sourceCommit !== preflight.sourceCommit || value.sourceTree !== preflight.sourceTree || !Array.isArray(value.categories) || value.categories.length !== LEAN_DIRECT_VALIDITY_CATEGORIES.length || !Number.isSafeInteger(value.blockingFindingCount) || (value.blockingFindingCount as number) < 0 || JSON.stringify(value.certificationOnlyHistory) !== JSON.stringify(plan172Findings(repoRoot)) || !exactFalseAuthority(value.authority)) throw new TypeError("LEAN_DIRECT_V7_REVIEW_INVALID")
  for (const [index, expected] of LEAN_DIRECT_VALIDITY_CATEGORIES.entries()) { const item = value.categories[index]; if (!isObject(item) || !exactKeys(item, ["category", "status", "evidence"]) || item.category !== expected || !["pass", "finding"].includes(String(item.status)) || typeof item.evidence !== "string" || item.evidence.length === 0) throw new TypeError("LEAN_DIRECT_V7_REVIEW_INVALID") }
  const findings = value.categories.filter((item) => isObject(item) && item.status === "finding").length; const admitted = preflight.preflight.status === "pass" && authorization !== undefined && findings === 0; if (value.blockingFindingCount !== findings || value.admitsPlan175 !== admitted) throw new TypeError("LEAN_DIRECT_V7_REVIEW_INVALID"); return globalThis.structuredClone(value) as unknown as LeanDirectValidityReviewV7
}
export const loadAndCheckLeanDirectReviewedReadyV7 = (repoRoot: string, allowedOperationalPaths: readonly string[] = []): { authorization: LeanDirectAuthorizationV7; review: LeanDirectValidityReviewV7; preflight: LeanContainerPreflightArtifactV6 } => { assertLeanStatus(git(repoRoot, ["status", "--short", "--untracked-files=all"]), allowedOperationalPaths); for (const artifactPath of [LEAN_DIRECT_V7_ARTIFACT_PATHS.invocation, LEAN_DIRECT_V7_ARTIFACT_PATHS.terminal, LEAN_DIRECT_V7_ARTIFACT_PATHS.adjudication, LEAN_DIRECT_V7_ARTIFACT_PATHS.eligibility]) if (!allowedOperationalPaths.includes(artifactPath) && existsSync(path.resolve(repoRoot, artifactPath))) throw new TypeError(`LEAN_DIRECT_V7_EFFECT_EXISTS:${artifactPath}`); const preflight = validateLeanContainerPreflightArtifactV6(repoRoot, readJson(repoRoot, LEAN_DIRECT_V7_ARTIFACT_PATHS.preflight)); if (preflight.preflight.status !== "pass") throw new TypeError("LEAN_DIRECT_V7_PREFLIGHT_NOT_PASS"); const authorization = checkLeanDirectAuthorizationV7(repoRoot, readJson(repoRoot, LEAN_DIRECT_V7_ARTIFACT_PATHS.authorization)); const review = checkLeanDirectValidityReviewV7(repoRoot, readJson(repoRoot, LEAN_DIRECT_V7_ARTIFACT_PATHS.review)); if (!review.admitsPlan175 || review.blockingFindingCount !== 0) throw new TypeError("LEAN_DIRECT_V7_PLAN175_NOT_ADMITTED"); return { authorization, review, preflight } }
export const checkLeanDirectReviewDispositionV7 = (repoRoot: string): LeanDirectValidityReviewV7 => { assertLeanStatus(git(repoRoot, ["status", "--short", "--untracked-files=all"]), [LEAN_DIRECT_V7_ARTIFACT_PATHS.review]); const review = checkLeanDirectValidityReviewV7(repoRoot, readJson(repoRoot, LEAN_DIRECT_V7_ARTIFACT_PATHS.review)); if (review.admitsPlan175) loadAndCheckLeanDirectReviewedReadyV7(repoRoot); else { for (const artifactPath of [LEAN_DIRECT_V7_ARTIFACT_PATHS.invocation, LEAN_DIRECT_V7_ARTIFACT_PATHS.terminal, LEAN_DIRECT_V7_ARTIFACT_PATHS.adjudication, LEAN_DIRECT_V7_ARTIFACT_PATHS.eligibility]) if (existsSync(path.resolve(repoRoot, artifactPath))) throw new TypeError(`LEAN_DIRECT_V7_DENIED_EFFECT:${artifactPath}`); if (Object.values(review.authority).some(Boolean)) throw new TypeError("LEAN_DIRECT_V7_DENIED_AUTHORITY") }; return review }
export const createLeanDirectInvocationV7 = (authorization: LeanDirectAuthorizationV7, review: LeanDirectValidityReviewV7, childCapabilityRoot: `sha256:${string}`): LeanDirectInvocationV7 => ({ schemaVersion: "v1.38-lean-runner-direct-invocation-v7", authorizationRoot: hashLeanValue(authorization), validityReviewRoot: hashLeanValue(review), preflightRoot: authorization.containerPreflight.root, sourceCommit: authorization.source.commit, childCapabilityRoot, claimClass: "fixture_feasibility_only", invocationOrdinal: 1, authority: LEAN_AUTHORITY_FALSE })
const validateLeanDirectInvocationV7 = (repoRoot: string, value: unknown): LeanDirectInvocationV7 => { const { authorization, review } = loadAndCheckLeanDirectReviewedReadyV7(repoRoot, [LEAN_DIRECT_V7_ARTIFACT_PATHS.invocation]); if (!isObject(value) || !isSha(value.childCapabilityRoot) || JSON.stringify(value) !== JSON.stringify(createLeanDirectInvocationV7(authorization, review, value.childCapabilityRoot))) throw new TypeError("LEAN_DIRECT_V7_INVOCATION_INVALID"); return globalThis.structuredClone(value) as unknown as LeanDirectInvocationV7 }
export const createLeanDirectTerminalArtifactV7 = (invocation: LeanDirectInvocationV7, terminal: LeanTerminal): LeanDirectTerminalArtifactV7 => ({ schemaVersion: "v1.38-lean-runner-direct-terminal-v7", authorizationRoot: invocation.authorizationRoot, validityReviewRoot: invocation.validityReviewRoot, preflightRoot: invocation.preflightRoot, sourceCommit: invocation.sourceCommit, childCapabilityRoot: invocation.childCapabilityRoot, invocationRoot: hashLeanValue(invocation), privacy: "safe_aggregate_only", terminal: deriveAndValidateLeanTerminal(terminal), authority: LEAN_AUTHORITY_FALSE })
export const createExclusiveLeanDirectTerminalV7 = (repoRoot: string, terminal: LeanDirectTerminalArtifactV7): void => writeExclusiveDurable(path.resolve(repoRoot, LEAN_DIRECT_V7_ARTIFACT_PATHS.terminal), terminal)
export const checkLeanDirectPostRunV7 = (repoRoot: string): { invocation: LeanDirectInvocationV7; terminal?: LeanDirectTerminalArtifactV7; markerOnly: boolean } => { const invocation = validateLeanDirectInvocationV7(repoRoot, readJson(repoRoot, LEAN_DIRECT_V7_ARTIFACT_PATHS.invocation)); if (!existsSync(path.resolve(repoRoot, LEAN_DIRECT_V7_ARTIFACT_PATHS.terminal))) return { invocation, markerOnly: true }; const value = readJson(repoRoot, LEAN_DIRECT_V7_ARTIFACT_PATHS.terminal); const expected = createLeanDirectTerminalArtifactV7(invocation, (value as LeanDirectTerminalArtifactV7).terminal); if (JSON.stringify(value) !== JSON.stringify(expected)) throw new TypeError("LEAN_DIRECT_V7_TERMINAL_INVALID"); return { invocation, terminal: value as LeanDirectTerminalArtifactV7, markerOnly: false } }
export const checkLeanDirectAdjudicationV7 = (repoRoot: string): void => { const { invocation, terminal, markerOnly } = checkLeanDirectPostRunV7(repoRoot); const adjudication = readJson(repoRoot, LEAN_DIRECT_V7_ARTIFACT_PATHS.adjudication); const result = markerOnly ? "invalid" : deriveAndValidateLeanTerminal(terminal!.terminal).result; if (!isObject(adjudication) || adjudication.schemaVersion !== "v1.38-lean-runner-direct-adjudication-v7" || adjudication.invocationRoot !== hashLeanValue(invocation) || adjudication.terminalRoot !== (terminal === undefined ? null : hashLeanValue(terminal)) || adjudication.reviewedResult !== result || adjudication.markerOnly !== markerOnly || adjudication.opportunityConsumed !== true || adjudication.admitsEligibility !== (result === "pass") || !exactFalseAuthority(adjudication.authority)) throw new TypeError("LEAN_DIRECT_V7_ADJUDICATION_INVALID"); const eligibility = readJson(repoRoot, LEAN_DIRECT_V7_ARTIFACT_PATHS.eligibility); const passed = result === "pass"; if (!isObject(eligibility) || eligibility.schemaVersion !== "v1.38-phase-262-lean-direct-eligibility-v7" || eligibility.adjudicationRoot !== hashLeanValue(adjudication) || eligibility.admit03 !== (passed ? "satisfied_under_revised_contract" : "blocked") || eligibility.phase262Complete !== passed || eligibility.phase263PlanningEligible !== passed || eligibility.phase263ExecutionEligible !== passed || !exactEligibilityAuthority(eligibility.authority, passed)) throw new TypeError("LEAN_DIRECT_V7_ELIGIBILITY_INVALID") }

const LEAN_DIRECT_PLAN188_PREFLIGHT_SHA256 = "6e06e16526066cbd068793e56a0ec82f8422a09d28c37ed6630821ac241558a8" as const
const LEAN_DIRECT_PLAN188_REVIEW_SHA256 = "17e13e3fe67c34eb29c76392f3f1a3efc3f7734ef98a5f403f29737900bd0fcb" as const
const LEAN_DIRECT_PLAN188_DIAGNOSIS_PATH = ".planning/debug/phase-262-probe-failed.md" as const
const LEAN_DIRECT_PLAN188_DIAGNOSIS_SHA256 = "21e67546e150d45c54686a59edc3444af45fd07a2c66f64a1818b3620268ec8b" as const

const assertLeanDirectPlan188History = (repoRoot: string): void => {
  if (sha256File(path.resolve(repoRoot, LEAN_DIRECT_V7_ARTIFACT_PATHS.preflight)) !== LEAN_DIRECT_PLAN188_PREFLIGHT_SHA256 || sha256File(path.resolve(repoRoot, LEAN_DIRECT_V7_ARTIFACT_PATHS.review)) !== LEAN_DIRECT_PLAN188_REVIEW_SHA256 || sha256File(path.resolve(repoRoot, LEAN_DIRECT_PLAN188_DIAGNOSIS_PATH)) !== LEAN_DIRECT_PLAN188_DIAGNOSIS_SHA256) throw new TypeError("LEAN_DIRECT_PLAN188_HISTORY_DRIFT")
  const preflight = readJson(repoRoot, LEAN_DIRECT_V7_ARTIFACT_PATHS.preflight); const review = readJson(repoRoot, LEAN_DIRECT_V7_ARTIFACT_PATHS.review)
  if (!isObject(preflight) || !isObject(preflight.preflight) || preflight.preflight.status !== "non_pass" || preflight.matchInvocations !== 0 || !exactFalseAuthority(preflight.authority) || !isObject(review) || review.admitsPlan175 !== false || review.blockingFindingCount !== 0 || !exactFalseAuthority(review.authority)) throw new TypeError("LEAN_DIRECT_PLAN188_HISTORY_REINTERPRETED")
  for (const artifactPath of [LEAN_DIRECT_V7_ARTIFACT_PATHS.authorization, LEAN_DIRECT_V7_ARTIFACT_PATHS.invocation, LEAN_DIRECT_V7_ARTIFACT_PATHS.terminal, LEAN_DIRECT_V7_ARTIFACT_PATHS.adjudication, LEAN_DIRECT_V7_ARTIFACT_PATHS.eligibility]) if (existsSync(path.resolve(repoRoot, artifactPath))) throw new TypeError(`LEAN_DIRECT_PLAN188_HISTORY_EFFECT:${artifactPath}`)
}

const assertLeanDirectV8PathsAreFresh = (): void => {
  const historical = [...Object.values(LEAN_DIRECT_ARTIFACT_PATHS), ...Object.values(LEAN_DIRECT_V2_ARTIFACT_PATHS), ...Object.values(LEAN_DIRECT_V3_ARTIFACT_PATHS), ...Object.values(LEAN_DIRECT_V4_ARTIFACT_PATHS), ...Object.values(LEAN_DIRECT_V5_ARTIFACT_PATHS), ...Object.values(LEAN_DIRECT_V6_ARTIFACT_PATHS), ...Object.values(LEAN_DIRECT_V7_ARTIFACT_PATHS)]
  const fresh = Object.values(LEAN_DIRECT_V8_ARTIFACT_PATHS)
  if (new Set(fresh).size !== fresh.length || fresh.some((candidate) => historical.includes(candidate as never))) throw new TypeError("LEAN_DIRECT_V8_PATH_ALIAS")
}

const resolveLeanDirectV8Source = (repoRoot: string, explicitRef: string, rejectCurrentHead: boolean): LeanManifest["source"] => resolveLeanDirectV7Source(repoRoot, explicitRef, rejectCurrentHead)
const assertLeanDirectV8ExactAbsenceSource = (repoRoot: string, sourceCommit: string): void => {
  const source = git(repoRoot, ["show", `${sourceCommit}:scripts/lib/v1-38-lean-container-match-session.ts`])
  const tests = git(repoRoot, ["show", `${sourceCommit}:scripts/lib/v1-38-lean-container-match-session.test.ts`])
  const predicate = source.match(/const exactAbsent[\s\S]*?\n\)/u)?.[0] ?? ""
  const required = ["result.error === undefined", "result.signal === null", "result.status === 1", "result.stdout.byteLength === 0", "Error: No such object:", "result.stdout.equals(Buffer.from(\"\\n\", \"utf8\"))", "error: no such object:"]
  if (required.some((token) => !predicate.includes(token)) || /\.trim\(|toLowerCase|toUpperCase|\s\+/u.test(predicate)) throw new TypeError("LEAN_DIRECT_V8_EXACT_ABSENCE_SOURCE_DRIFT")
  for (const token of ["accepts the exact %s absence tuple before create and after removal", "rejects Docker 29.4 %s near misses before create", "rejects Docker 29.4 %s near misses after removal"]) if (!tests.includes(token)) throw new TypeError("LEAN_DIRECT_V8_EXACT_ABSENCE_TEST_DRIFT")
}
const assertLeanDirectV8TrackedBytes = (repoRoot: string, sourceCommit: string): void => {
  try { execFileSync("git", ["diff", "--quiet", sourceCommit, "--", ...LEAN_DIRECT_V4_EXECUTABLE_CLOSURE_PATHS], { cwd: repoRoot, stdio: "ignore" }) } catch { throw new TypeError("LEAN_DIRECT_V8_TRACKED_BYTES_DRIFT") }
  assertLeanPersistentStreamSource(repoRoot, sourceCommit); assertLeanDirectV8ExactAbsenceSource(repoRoot, sourceCommit)
}

const buildLeanContainerPreflightArtifactV7 = (repoRoot: string, explicitSourceRef: string, outcome: unknown): LeanContainerPreflightArtifactV7 => {
  const source = resolveLeanDirectV8Source(repoRoot, explicitSourceRef, true)
  return { schemaVersion: "v1.38-lean-runner-direct-container-preflight-v7", sourceCommit: source.commit, sourceTree: source.tree, executableClosureRoot: hashLeanValue(source.executableBlobs), preflight: validateLeanContainerPreflightOutcomeV4(outcome), consuming: false, preflightInvocations: 1, matchInvocations: 0, authority: LEAN_AUTHORITY_FALSE }
}
export const renderLeanContainerPreflightArtifactV7 = (repoRoot: string, explicitSourceRef: string, outcome: unknown): LeanContainerPreflightArtifactV7 => { assertLeanDirectPlan188History(repoRoot); assertLeanDirectV8PathsAreFresh(); return buildLeanContainerPreflightArtifactV7(repoRoot, explicitSourceRef, outcome) }
export const validateLeanContainerPreflightArtifactV7 = (repoRoot: string, value: unknown): LeanContainerPreflightArtifactV7 => {
  assertPrivacySafe(value)
  if (!isObject(value) || !exactKeys(value, ["schemaVersion", "sourceCommit", "sourceTree", "executableClosureRoot", "preflight", "consuming", "preflightInvocations", "matchInvocations", "authority"]) || value.schemaVersion !== "v1.38-lean-runner-direct-container-preflight-v7" || !isOid(value.sourceCommit) || !isOid(value.sourceTree) || !isSha(value.executableClosureRoot) || value.consuming !== false || value.preflightInvocations !== 1 || value.matchInvocations !== 0 || !exactFalseAuthority(value.authority)) throw new TypeError("LEAN_DIRECT_V8_PREFLIGHT_INVALID")
  const expected = buildLeanContainerPreflightArtifactV7(repoRoot, value.sourceCommit, value.preflight); if (JSON.stringify(value) !== JSON.stringify(expected)) throw new TypeError("LEAN_DIRECT_V8_PREFLIGHT_DRIFT")
  return globalThis.structuredClone(value) as unknown as LeanContainerPreflightArtifactV7
}
export const writeLeanContainerPreflightArtifactV7 = (repoRoot: string, explicitSourceRef: string): LeanContainerPreflightArtifactV7 => {
  assertLeanStatus(git(repoRoot, ["status", "--short", "--untracked-files=all"])); assertLeanDirectPlan188History(repoRoot); assertLeanDirectV8PathsAreFresh()
  for (const artifactPath of Object.values(LEAN_DIRECT_V8_ARTIFACT_PATHS)) if (existsSync(path.resolve(repoRoot, artifactPath))) throw new TypeError(`LEAN_DIRECT_V8_DESTINATION_EXISTS:${artifactPath}`)
  const sourceRef = validateLeanDirectV2ExplicitSourceRef(explicitSourceRef); const source = resolveLeanDirectV8Source(repoRoot, sourceRef, true); assertLeanDirectV8TrackedBytes(repoRoot, source.commit); assertSuccessorLockInventory(repoRoot)
  let outcome: LeanContainerPreflightOutcomeV4
  try { outcome = runActualLeanContainerPreflight() } catch (error) { outcome = { status: "non_pass", reasonCode: classifyLeanContainerPreflightFailure(error) } }
  const artifact = renderLeanContainerPreflightArtifactV7(repoRoot, sourceRef, outcome); writeExclusiveDurable(path.resolve(repoRoot, LEAN_DIRECT_V8_ARTIFACT_PATHS.preflight), artifact); return artifact
}

const buildLeanDirectAuthorizationV8 = (repoRoot: string, explicitSourceRef: string, preflight: LeanContainerPreflightArtifactV7): LeanDirectAuthorizationV8 => {
  if (preflight.preflight.status !== "pass") throw new TypeError("LEAN_DIRECT_V8_PREFLIGHT_NOT_PASS")
  const source = resolveLeanDirectV8Source(repoRoot, explicitSourceRef, true); if (preflight.sourceCommit !== source.commit || preflight.sourceTree !== source.tree || preflight.executableClosureRoot !== hashLeanValue(source.executableBlobs)) throw new TypeError("LEAN_DIRECT_V8_PREFLIGHT_SOURCE_DRIFT")
  const base = buildLeanDirectAuthorization(repoRoot, source.commit)
  return { ...base, schemaVersion: "v1.38-lean-runner-direct-authorization-v8", source, containerPreflight: { path: LEAN_DIRECT_V8_ARTIFACT_PATHS.preflight, root: hashLeanValue(preflight) }, runtimeBoundary: { registryAdapterId: "runtime-js-container-subprocess", serviceAdapterId: LEAN_CONTAINER_ADAPTER_ID, image: LEAN_CONTAINER_IMAGE, controlsRoot: hashLeanValue(LEAN_CONTAINER_CONTROLS), methodCeilings: LEAN_CONTAINER_METHOD_CEILINGS, startupCleanupMarginMilliseconds: LEAN_CONTAINER_STARTUP_CLEANUP_MARGIN_MS, cellDeadlineMilliseconds: LEAN_CELL_DEADLINE_MS, outerDeadlineMilliseconds: 900000 }, plan174History: { authorizationPath: LEAN_DIRECT_ARTIFACT_PATHS.authorization, authorizationRoot: LEAN_DIRECT_V1_AUTHORIZATION_ROOT, reviewPath: LEAN_DIRECT_ARTIFACT_PATHS.review, reviewRoot: LEAN_DIRECT_V1_REVIEW_ROOT, status: "denied_preserved", resolvedByNewSource: ["CR-01", "CR-02"] }, plan178History: { preflightPath: LEAN_DIRECT_PLAN178_PREFLIGHT_PATH, preflightSha256: `sha256:${LEAN_DIRECT_PLAN178_PREFLIGHT_SHA256}`, reviewPath: LEAN_DIRECT_PLAN178_REVIEW_PATH, reviewSha256: `sha256:${LEAN_DIRECT_PLAN178_REVIEW_SHA256}`, status: "non_pass_preserved" }, plan180History: { preflightPath: LEAN_DIRECT_V3_ARTIFACT_PATHS.preflight, preflightSha256: `sha256:${LEAN_DIRECT_PLAN180_PREFLIGHT_SHA256}`, reviewPath: LEAN_DIRECT_V3_ARTIFACT_PATHS.review, reviewSha256: `sha256:${LEAN_DIRECT_PLAN180_REVIEW_SHA256}`, status: "non_pass_preserved" }, plan182History: { preflightPath: LEAN_DIRECT_V4_ARTIFACT_PATHS.preflight, preflightSha256: `sha256:${LEAN_DIRECT_PLAN182_PREFLIGHT_SHA256}`, reviewPath: LEAN_DIRECT_V4_ARTIFACT_PATHS.review, reviewSha256: `sha256:${LEAN_DIRECT_PLAN182_REVIEW_SHA256}`, status: "non_pass_preserved" }, plan184History: { preflightPath: LEAN_DIRECT_V5_ARTIFACT_PATHS.preflight, preflightSha256: `sha256:${LEAN_DIRECT_PLAN184_PREFLIGHT_SHA256}`, reviewPath: LEAN_DIRECT_V5_ARTIFACT_PATHS.review, reviewSha256: `sha256:${LEAN_DIRECT_PLAN184_REVIEW_SHA256}`, status: "non_pass_preserved" }, plan186History: { preflightPath: LEAN_DIRECT_V6_ARTIFACT_PATHS.preflight, preflightSha256: `sha256:${LEAN_DIRECT_PLAN186_PREFLIGHT_SHA256}`, reviewPath: LEAN_DIRECT_V6_ARTIFACT_PATHS.review, reviewSha256: `sha256:${LEAN_DIRECT_PLAN186_REVIEW_SHA256}`, status: "non_pass_preserved" }, plan188History: { preflightPath: LEAN_DIRECT_V7_ARTIFACT_PATHS.preflight, preflightSha256: `sha256:${LEAN_DIRECT_PLAN188_PREFLIGHT_SHA256}`, reviewPath: LEAN_DIRECT_V7_ARTIFACT_PATHS.review, reviewSha256: `sha256:${LEAN_DIRECT_PLAN188_REVIEW_SHA256}`, diagnosisPath: LEAN_DIRECT_PLAN188_DIAGNOSIS_PATH, diagnosisSha256: `sha256:${LEAN_DIRECT_PLAN188_DIAGNOSIS_SHA256}`, status: "non_pass_preserved" } }
}
export const renderLeanDirectAuthorizationV8 = (repoRoot: string, explicitSourceRef: string): LeanDirectAuthorizationV8 => { assertLeanDirectPlan188History(repoRoot); const preflight = validateLeanContainerPreflightArtifactV7(repoRoot, readJson(repoRoot, LEAN_DIRECT_V8_ARTIFACT_PATHS.preflight)); for (const artifactPath of Object.values(LEAN_DIRECT_V8_ARTIFACT_PATHS).filter((candidate) => candidate !== LEAN_DIRECT_V8_ARTIFACT_PATHS.preflight)) if (existsSync(path.resolve(repoRoot, artifactPath))) throw new TypeError(`LEAN_DIRECT_V8_DESTINATION_EXISTS:${artifactPath}`); return buildLeanDirectAuthorizationV8(repoRoot, validateLeanDirectV2ExplicitSourceRef(explicitSourceRef), preflight) }
export const validateLeanDirectAuthorizationV8 = (repoRoot: string, value: unknown): LeanDirectAuthorizationV8 => { assertPrivacySafe(value); if (!isObject(value) || value.schemaVersion !== "v1.38-lean-runner-direct-authorization-v8" || !isObject(value.source) || !isOid(value.source.commit)) throw new TypeError("LEAN_DIRECT_V8_AUTHORIZATION_INVALID"); const expected = buildLeanDirectAuthorizationV8(repoRoot, value.source.commit, validateLeanContainerPreflightArtifactV7(repoRoot, readJson(repoRoot, LEAN_DIRECT_V8_ARTIFACT_PATHS.preflight))); if (JSON.stringify(value) !== JSON.stringify(expected)) throw new TypeError("LEAN_DIRECT_V8_AUTHORIZATION_DRIFT"); return globalThis.structuredClone(value) as unknown as LeanDirectAuthorizationV8 }
export const checkLeanDirectAuthorizationV8 = (repoRoot: string, value: unknown): LeanDirectAuthorizationV8 => { const authorization = validateLeanDirectAuthorizationV8(repoRoot, value); assertLeanDirectV8TrackedBytes(repoRoot, authorization.source.commit); assertLeanDirectPlan188History(repoRoot); assertSuccessorLockInventory(repoRoot); return authorization }
export const writeLeanDirectAuthorizationV8 = (repoRoot: string, explicitSourceRef: string): LeanDirectAuthorizationV8 => { const authorization = renderLeanDirectAuthorizationV8(repoRoot, explicitSourceRef); writeExclusiveDurable(path.resolve(repoRoot, LEAN_DIRECT_V8_ARTIFACT_PATHS.authorization), authorization); return authorization }
export const checkLeanDirectExactAbsenceSourceOnlyV8 = (repoRoot: string): void => {
  assertLeanStatus(git(repoRoot, ["status", "--short", "--untracked-files=all"])); checkLeanFirstEvidenceCustody(repoRoot); assertDeniedDirectV1History(repoRoot); assertLeanDirectPlan178History(repoRoot); assertLeanDirectPlan180History(repoRoot); assertLeanDirectPlan182History(repoRoot); assertLeanDirectPlan184History(repoRoot); assertLeanDirectPlan186History(repoRoot); assertLeanDirectPlan188History(repoRoot); assertLeanDirectV8PathsAreFresh()
  for (const artifactPath of Object.values(LEAN_DIRECT_V8_ARTIFACT_PATHS)) if (existsSync(path.resolve(repoRoot, artifactPath))) throw new TypeError(`LEAN_DIRECT_V8_DESTINATION_EXISTS:${artifactPath}`)
  const latest = git(repoRoot, ["log", "-1", "--format=%H", "--", ...LEAN_PLAN177_RUNNABLE_PATHS]); const source = resolveLeanDirectV8Source(repoRoot, latest, false); if (source.commit !== latest || Object.keys(source.executableBlobs).length !== 29) throw new TypeError("LEAN_DIRECT_V8_SOURCE_DRIFT"); assertLeanDirectV8TrackedBytes(repoRoot, source.commit); assertSuccessorLockInventory(repoRoot)
}
export const checkLeanDirectValidityReviewV8 = (repoRoot: string, value: unknown): LeanDirectValidityReviewV8 => {
  assertPrivacySafe(value); const preflight = validateLeanContainerPreflightArtifactV7(repoRoot, readJson(repoRoot, LEAN_DIRECT_V8_ARTIFACT_PATHS.preflight)); const authorizationPresent = existsSync(path.resolve(repoRoot, LEAN_DIRECT_V8_ARTIFACT_PATHS.authorization)); const authorization = authorizationPresent ? checkLeanDirectAuthorizationV8(repoRoot, readJson(repoRoot, LEAN_DIRECT_V8_ARTIFACT_PATHS.authorization)) : undefined
  if (!isObject(value) || !exactKeys(value, ["schemaVersion", "authorizationRoot", "preflightRoot", "sourceCommit", "sourceTree", "categories", "blockingFindingCount", "certificationOnlyHistory", "admitsPlan175", "authority"]) || value.schemaVersion !== "v1.38-lean-runner-direct-validity-review-v8" || value.authorizationRoot !== (authorization === undefined ? null : hashLeanValue(authorization)) || value.preflightRoot !== hashLeanValue(preflight) || value.sourceCommit !== preflight.sourceCommit || value.sourceTree !== preflight.sourceTree || !Array.isArray(value.categories) || value.categories.length !== LEAN_DIRECT_VALIDITY_CATEGORIES.length || !Number.isSafeInteger(value.blockingFindingCount) || (value.blockingFindingCount as number) < 0 || JSON.stringify(value.certificationOnlyHistory) !== JSON.stringify(plan172Findings(repoRoot)) || !exactFalseAuthority(value.authority)) throw new TypeError("LEAN_DIRECT_V8_REVIEW_INVALID")
  for (const [index, expected] of LEAN_DIRECT_VALIDITY_CATEGORIES.entries()) { const item = value.categories[index]; if (!isObject(item) || !exactKeys(item, ["category", "status", "evidence"]) || item.category !== expected || !["pass", "finding"].includes(String(item.status)) || typeof item.evidence !== "string" || item.evidence.length === 0) throw new TypeError("LEAN_DIRECT_V8_REVIEW_INVALID") }
  const findings = value.categories.filter((item) => isObject(item) && item.status === "finding").length; const admitted = preflight.preflight.status === "pass" && authorization !== undefined && findings === 0; if (value.blockingFindingCount !== findings || value.admitsPlan175 !== admitted) throw new TypeError("LEAN_DIRECT_V8_REVIEW_INVALID"); return globalThis.structuredClone(value) as unknown as LeanDirectValidityReviewV8
}
export const loadAndCheckLeanDirectReviewedReadyV8 = (repoRoot: string, allowedOperationalPaths: readonly string[] = []): { authorization: LeanDirectAuthorizationV8; review: LeanDirectValidityReviewV8; preflight: LeanContainerPreflightArtifactV7 } => { assertLeanStatus(git(repoRoot, ["status", "--short", "--untracked-files=all"]), allowedOperationalPaths); for (const artifactPath of [LEAN_DIRECT_V8_ARTIFACT_PATHS.invocation, LEAN_DIRECT_V8_ARTIFACT_PATHS.terminal, LEAN_DIRECT_V8_ARTIFACT_PATHS.adjudication, LEAN_DIRECT_V8_ARTIFACT_PATHS.eligibility]) if (!allowedOperationalPaths.includes(artifactPath) && existsSync(path.resolve(repoRoot, artifactPath))) throw new TypeError(`LEAN_DIRECT_V8_EFFECT_EXISTS:${artifactPath}`); const preflight = validateLeanContainerPreflightArtifactV7(repoRoot, readJson(repoRoot, LEAN_DIRECT_V8_ARTIFACT_PATHS.preflight)); if (preflight.preflight.status !== "pass") throw new TypeError("LEAN_DIRECT_V8_PREFLIGHT_NOT_PASS"); const authorization = checkLeanDirectAuthorizationV8(repoRoot, readJson(repoRoot, LEAN_DIRECT_V8_ARTIFACT_PATHS.authorization)); const review = checkLeanDirectValidityReviewV8(repoRoot, readJson(repoRoot, LEAN_DIRECT_V8_ARTIFACT_PATHS.review)); if (!review.admitsPlan175 || review.blockingFindingCount !== 0) throw new TypeError("LEAN_DIRECT_V8_PLAN175_NOT_ADMITTED"); return { authorization, review, preflight } }
export const checkLeanDirectReviewDispositionV8 = (repoRoot: string): LeanDirectValidityReviewV8 => { assertLeanStatus(git(repoRoot, ["status", "--short", "--untracked-files=all"]), [LEAN_DIRECT_V8_ARTIFACT_PATHS.review]); const review = checkLeanDirectValidityReviewV8(repoRoot, readJson(repoRoot, LEAN_DIRECT_V8_ARTIFACT_PATHS.review)); if (review.admitsPlan175) loadAndCheckLeanDirectReviewedReadyV8(repoRoot); else { for (const artifactPath of [LEAN_DIRECT_V8_ARTIFACT_PATHS.invocation, LEAN_DIRECT_V8_ARTIFACT_PATHS.terminal, LEAN_DIRECT_V8_ARTIFACT_PATHS.adjudication, LEAN_DIRECT_V8_ARTIFACT_PATHS.eligibility]) if (existsSync(path.resolve(repoRoot, artifactPath))) throw new TypeError(`LEAN_DIRECT_V8_DENIED_EFFECT:${artifactPath}`); if (Object.values(review.authority).some(Boolean)) throw new TypeError("LEAN_DIRECT_V8_DENIED_AUTHORITY") }; return review }
export const createLeanDirectInvocationV8 = (authorization: LeanDirectAuthorizationV8, review: LeanDirectValidityReviewV8, childCapabilityRoot: `sha256:${string}`): LeanDirectInvocationV8 => ({ schemaVersion: "v1.38-lean-runner-direct-invocation-v8", authorizationRoot: hashLeanValue(authorization), validityReviewRoot: hashLeanValue(review), preflightRoot: authorization.containerPreflight.root, sourceCommit: authorization.source.commit, childCapabilityRoot, claimClass: "fixture_feasibility_only", invocationOrdinal: 1, authority: LEAN_AUTHORITY_FALSE })
const validateLeanDirectInvocationV8 = (repoRoot: string, value: unknown): LeanDirectInvocationV8 => { const { authorization, review } = loadAndCheckLeanDirectReviewedReadyV8(repoRoot, [LEAN_DIRECT_V8_ARTIFACT_PATHS.invocation]); if (!isObject(value) || !isSha(value.childCapabilityRoot) || JSON.stringify(value) !== JSON.stringify(createLeanDirectInvocationV8(authorization, review, value.childCapabilityRoot))) throw new TypeError("LEAN_DIRECT_V8_INVOCATION_INVALID"); return globalThis.structuredClone(value) as unknown as LeanDirectInvocationV8 }
export const createLeanDirectTerminalArtifactV8 = (invocation: LeanDirectInvocationV8, terminal: LeanTerminal): LeanDirectTerminalArtifactV8 => ({ schemaVersion: "v1.38-lean-runner-direct-terminal-v8", authorizationRoot: invocation.authorizationRoot, validityReviewRoot: invocation.validityReviewRoot, preflightRoot: invocation.preflightRoot, sourceCommit: invocation.sourceCommit, childCapabilityRoot: invocation.childCapabilityRoot, invocationRoot: hashLeanValue(invocation), privacy: "safe_aggregate_only", terminal: deriveAndValidateLeanTerminal(terminal), authority: LEAN_AUTHORITY_FALSE })
export const createExclusiveLeanDirectTerminalV8 = (repoRoot: string, terminal: LeanDirectTerminalArtifactV8): void => writeExclusiveDurable(path.resolve(repoRoot, LEAN_DIRECT_V8_ARTIFACT_PATHS.terminal), terminal)
export const checkLeanDirectPostRunV8 = (repoRoot: string): { invocation: LeanDirectInvocationV8; terminal?: LeanDirectTerminalArtifactV8; markerOnly: boolean } => { const invocation = validateLeanDirectInvocationV8(repoRoot, readJson(repoRoot, LEAN_DIRECT_V8_ARTIFACT_PATHS.invocation)); if (!existsSync(path.resolve(repoRoot, LEAN_DIRECT_V8_ARTIFACT_PATHS.terminal))) return { invocation, markerOnly: true }; const value = readJson(repoRoot, LEAN_DIRECT_V8_ARTIFACT_PATHS.terminal); const expected = createLeanDirectTerminalArtifactV8(invocation, (value as LeanDirectTerminalArtifactV8).terminal); if (JSON.stringify(value) !== JSON.stringify(expected)) throw new TypeError("LEAN_DIRECT_V8_TERMINAL_INVALID"); return { invocation, terminal: value as LeanDirectTerminalArtifactV8, markerOnly: false } }
export const checkLeanDirectAdjudicationV8 = (repoRoot: string): void => { const { invocation, terminal, markerOnly } = checkLeanDirectPostRunV8(repoRoot); const adjudication = readJson(repoRoot, LEAN_DIRECT_V8_ARTIFACT_PATHS.adjudication); const result = markerOnly ? "invalid" : deriveAndValidateLeanTerminal(terminal!.terminal).result; if (!isObject(adjudication) || adjudication.schemaVersion !== "v1.38-lean-runner-direct-adjudication-v8" || adjudication.invocationRoot !== hashLeanValue(invocation) || adjudication.terminalRoot !== (terminal === undefined ? null : hashLeanValue(terminal)) || adjudication.reviewedResult !== result || adjudication.markerOnly !== markerOnly || adjudication.opportunityConsumed !== true || adjudication.admitsEligibility !== (result === "pass") || !exactFalseAuthority(adjudication.authority)) throw new TypeError("LEAN_DIRECT_V8_ADJUDICATION_INVALID"); const eligibility = readJson(repoRoot, LEAN_DIRECT_V8_ARTIFACT_PATHS.eligibility); const passed = result === "pass"; if (!isObject(eligibility) || eligibility.schemaVersion !== "v1.38-phase-262-lean-direct-eligibility-v8" || eligibility.adjudicationRoot !== hashLeanValue(adjudication) || eligibility.admit03 !== (passed ? "satisfied_under_revised_contract" : "blocked") || eligibility.phase262Complete !== passed || eligibility.phase263PlanningEligible !== passed || eligibility.phase263ExecutionEligible !== passed || !exactEligibilityAuthority(eligibility.authority, passed)) throw new TypeError("LEAN_DIRECT_V8_ELIGIBILITY_INVALID") }

const LEAN_DIRECT_PLAN190_PREFLIGHT_SHA256 = "ca686cec3cbd3ff5017e3f28a5f7f4bf9d781563ccc7175e499ab63ac3986424" as const
const LEAN_DIRECT_PLAN190_REVIEW_SHA256 = "4c1baf3d3e2d2dd34331ab92062418001bcbd098b4e9c1dc38cf5540f3dd489a" as const
const assertLeanDirectPlan190History = (repoRoot: string): void => {
  if (sha256File(path.resolve(repoRoot, LEAN_DIRECT_V8_ARTIFACT_PATHS.preflight)) !== LEAN_DIRECT_PLAN190_PREFLIGHT_SHA256 || sha256File(path.resolve(repoRoot, LEAN_DIRECT_V8_ARTIFACT_PATHS.review)) !== LEAN_DIRECT_PLAN190_REVIEW_SHA256) throw new TypeError("LEAN_DIRECT_PLAN190_HISTORY_DRIFT")
  const preflight = readJson(repoRoot, LEAN_DIRECT_V8_ARTIFACT_PATHS.preflight); const review = readJson(repoRoot, LEAN_DIRECT_V8_ARTIFACT_PATHS.review)
  if (!isObject(preflight) || !isObject(preflight.preflight) || preflight.preflight.status !== "non_pass" || preflight.matchInvocations !== 0 || !exactFalseAuthority(preflight.authority) || !isObject(review) || review.admitsPlan175 !== false || review.blockingFindingCount !== 0 || !exactFalseAuthority(review.authority)) throw new TypeError("LEAN_DIRECT_PLAN190_HISTORY_REINTERPRETED")
  for (const artifactPath of [LEAN_DIRECT_V8_ARTIFACT_PATHS.authorization, LEAN_DIRECT_V8_ARTIFACT_PATHS.invocation, LEAN_DIRECT_V8_ARTIFACT_PATHS.terminal, LEAN_DIRECT_V8_ARTIFACT_PATHS.adjudication, LEAN_DIRECT_V8_ARTIFACT_PATHS.eligibility]) if (existsSync(path.resolve(repoRoot, artifactPath))) throw new TypeError(`LEAN_DIRECT_PLAN190_HISTORY_EFFECT:${artifactPath}`)
}
const assertLeanDirectV9PathsAreFresh = (): void => {
  const historical = [...Object.values(LEAN_DIRECT_ARTIFACT_PATHS), ...Object.values(LEAN_DIRECT_V2_ARTIFACT_PATHS), ...Object.values(LEAN_DIRECT_V3_ARTIFACT_PATHS), ...Object.values(LEAN_DIRECT_V4_ARTIFACT_PATHS), ...Object.values(LEAN_DIRECT_V5_ARTIFACT_PATHS), ...Object.values(LEAN_DIRECT_V6_ARTIFACT_PATHS), ...Object.values(LEAN_DIRECT_V7_ARTIFACT_PATHS), ...Object.values(LEAN_DIRECT_V8_ARTIFACT_PATHS)]
  const fresh = Object.values(LEAN_DIRECT_V9_ARTIFACT_PATHS)
  if (new Set(fresh).size !== fresh.length || fresh.some((candidate) => historical.includes(candidate as never))) throw new TypeError("LEAN_DIRECT_V9_PATH_ALIAS")
}
const resolveLeanDirectV9Source = (repoRoot: string, explicitRef: string, rejectCurrentHead: boolean): LeanManifest["source"] => resolveLeanDirectV8Source(repoRoot, explicitRef, rejectCurrentHead)
const assertLeanDirectGuestWorkerSource = (repoRoot: string, sourceCommit: string): void => {
  const source = git(repoRoot, ["show", `${sourceCommit}:scripts/lib/v1-38-lean-container-match-session.ts`])
  const tests = git(repoRoot, ["show", `${sourceCommit}:scripts/lib/v1-38-lean-container-match-session.test.ts`])
  const broker = source.match(/export const LEAN_CONTAINER_BROKER_SOURCE = `[\s\S]*?\n`\n\nconst STREAM_WORKER_SOURCE/u)?.[0] ?? ""
  const required = ['from "node:worker_threads"', "new Worker(", "env: {}", "execArgv: []", "resourceLimits:", "await terminate(worker", "receiveMessageOnPort", "queue=queue.then", "requestId:q.requestId"]
  if (required.some((token) => !broker.includes(token)) || broker.includes("node:child_process") || broker.includes("spawnSync") || broker.includes("transport(dockerPath") || broker.includes("fallback")) throw new TypeError("LEAN_DIRECT_V9_GUEST_WORKER_SOURCE_DRIFT")
  for (const token of ["fresh stateless Workers", "forbidden-capability failures and kills timed-out Workers", "keeps broker requests serialized and correlates each terminal frame"]) if (!tests.includes(token)) throw new TypeError("LEAN_DIRECT_V9_GUEST_WORKER_TEST_DRIFT")
}
const assertLeanDirectV9TrackedBytes = (repoRoot: string, sourceCommit: string): void => {
  try { execFileSync("git", ["diff", "--quiet", sourceCommit, "--", ...LEAN_DIRECT_V4_EXECUTABLE_CLOSURE_PATHS], { cwd: repoRoot, stdio: "ignore" }) } catch { throw new TypeError("LEAN_DIRECT_V9_TRACKED_BYTES_DRIFT") }
  assertLeanPersistentStreamSource(repoRoot, sourceCommit); assertLeanDirectV8ExactAbsenceSource(repoRoot, sourceCommit); assertLeanDirectGuestWorkerSource(repoRoot, sourceCommit)
}
const buildLeanContainerPreflightArtifactV8 = (repoRoot: string, explicitSourceRef: string, outcome: unknown): LeanContainerPreflightArtifactV8 => {
  const source = resolveLeanDirectV9Source(repoRoot, explicitSourceRef, true)
  return { schemaVersion: "v1.38-lean-runner-direct-container-preflight-v8", sourceCommit: source.commit, sourceTree: source.tree, executableClosureRoot: hashLeanValue(source.executableBlobs), preflight: validateLeanContainerPreflightOutcomeV4(outcome), consuming: false, preflightInvocations: 1, matchInvocations: 0, authority: LEAN_AUTHORITY_FALSE }
}
export const renderLeanContainerPreflightArtifactV8 = (repoRoot: string, explicitSourceRef: string, outcome: unknown): LeanContainerPreflightArtifactV8 => { assertLeanDirectPlan190History(repoRoot); assertLeanDirectV9PathsAreFresh(); return buildLeanContainerPreflightArtifactV8(repoRoot, explicitSourceRef, outcome) }
export const validateLeanContainerPreflightArtifactV8 = (repoRoot: string, value: unknown): LeanContainerPreflightArtifactV8 => {
  assertPrivacySafe(value)
  if (!isObject(value) || !exactKeys(value, ["schemaVersion", "sourceCommit", "sourceTree", "executableClosureRoot", "preflight", "consuming", "preflightInvocations", "matchInvocations", "authority"]) || value.schemaVersion !== "v1.38-lean-runner-direct-container-preflight-v8" || !isOid(value.sourceCommit) || !isOid(value.sourceTree) || !isSha(value.executableClosureRoot) || value.consuming !== false || value.preflightInvocations !== 1 || value.matchInvocations !== 0 || !exactFalseAuthority(value.authority)) throw new TypeError("LEAN_DIRECT_V9_PREFLIGHT_INVALID")
  const expected = buildLeanContainerPreflightArtifactV8(repoRoot, value.sourceCommit, value.preflight); if (JSON.stringify(value) !== JSON.stringify(expected)) throw new TypeError("LEAN_DIRECT_V9_PREFLIGHT_DRIFT")
  return globalThis.structuredClone(value) as unknown as LeanContainerPreflightArtifactV8
}
export const writeLeanContainerPreflightArtifactV8 = (repoRoot: string, explicitSourceRef: string): LeanContainerPreflightArtifactV8 => {
  assertLeanStatus(git(repoRoot, ["status", "--short", "--untracked-files=all"])); assertLeanDirectPlan190History(repoRoot); assertLeanDirectV9PathsAreFresh()
  for (const artifactPath of Object.values(LEAN_DIRECT_V9_ARTIFACT_PATHS)) if (existsSync(path.resolve(repoRoot, artifactPath))) throw new TypeError(`LEAN_DIRECT_V9_DESTINATION_EXISTS:${artifactPath}`)
  const sourceRef = validateLeanDirectV2ExplicitSourceRef(explicitSourceRef); const source = resolveLeanDirectV9Source(repoRoot, sourceRef, true); assertLeanDirectV9TrackedBytes(repoRoot, source.commit); assertSuccessorLockInventory(repoRoot)
  let outcome: LeanContainerPreflightOutcomeV4; try { outcome = runActualLeanContainerPreflight() } catch (error) { outcome = { status: "non_pass", reasonCode: classifyLeanContainerPreflightFailure(error) } }
  const artifact = renderLeanContainerPreflightArtifactV8(repoRoot, sourceRef, outcome); writeExclusiveDurable(path.resolve(repoRoot, LEAN_DIRECT_V9_ARTIFACT_PATHS.preflight), artifact); return artifact
}
const buildLeanDirectAuthorizationV9 = (repoRoot: string, explicitSourceRef: string, preflight: LeanContainerPreflightArtifactV8): LeanDirectAuthorizationV9 => {
  if (preflight.preflight.status !== "pass") throw new TypeError("LEAN_DIRECT_V9_PREFLIGHT_NOT_PASS")
  const source = resolveLeanDirectV9Source(repoRoot, explicitSourceRef, true); if (preflight.sourceCommit !== source.commit || preflight.sourceTree !== source.tree || preflight.executableClosureRoot !== hashLeanValue(source.executableBlobs)) throw new TypeError("LEAN_DIRECT_V9_PREFLIGHT_SOURCE_DRIFT")
  const base = buildLeanDirectAuthorizationV8(repoRoot, source.commit, { ...preflight, schemaVersion: "v1.38-lean-runner-direct-container-preflight-v7" } as LeanContainerPreflightArtifactV7)
  return { ...base, schemaVersion: "v1.38-lean-runner-direct-authorization-v9", source, containerPreflight: { path: LEAN_DIRECT_V9_ARTIFACT_PATHS.preflight, root: hashLeanValue(preflight) }, plan190History: { preflightPath: LEAN_DIRECT_V8_ARTIFACT_PATHS.preflight, preflightSha256: `sha256:${LEAN_DIRECT_PLAN190_PREFLIGHT_SHA256}`, reviewPath: LEAN_DIRECT_V8_ARTIFACT_PATHS.review, reviewSha256: `sha256:${LEAN_DIRECT_PLAN190_REVIEW_SHA256}`, status: "non_pass_preserved" } }
}
export const renderLeanDirectAuthorizationV9 = (repoRoot: string, explicitSourceRef: string): LeanDirectAuthorizationV9 => { assertLeanDirectPlan190History(repoRoot); const preflight = validateLeanContainerPreflightArtifactV8(repoRoot, readJson(repoRoot, LEAN_DIRECT_V9_ARTIFACT_PATHS.preflight)); for (const artifactPath of Object.values(LEAN_DIRECT_V9_ARTIFACT_PATHS).filter((candidate) => candidate !== LEAN_DIRECT_V9_ARTIFACT_PATHS.preflight)) if (existsSync(path.resolve(repoRoot, artifactPath))) throw new TypeError(`LEAN_DIRECT_V9_DESTINATION_EXISTS:${artifactPath}`); return buildLeanDirectAuthorizationV9(repoRoot, validateLeanDirectV2ExplicitSourceRef(explicitSourceRef), preflight) }
export const validateLeanDirectAuthorizationV9 = (repoRoot: string, value: unknown): LeanDirectAuthorizationV9 => { assertPrivacySafe(value); if (!isObject(value) || value.schemaVersion !== "v1.38-lean-runner-direct-authorization-v9" || !isObject(value.source) || !isOid(value.source.commit)) throw new TypeError("LEAN_DIRECT_V9_AUTHORIZATION_INVALID"); const expected = buildLeanDirectAuthorizationV9(repoRoot, value.source.commit, validateLeanContainerPreflightArtifactV8(repoRoot, readJson(repoRoot, LEAN_DIRECT_V9_ARTIFACT_PATHS.preflight))); if (JSON.stringify(value) !== JSON.stringify(expected)) throw new TypeError("LEAN_DIRECT_V9_AUTHORIZATION_DRIFT"); return globalThis.structuredClone(value) as unknown as LeanDirectAuthorizationV9 }
export const checkLeanDirectAuthorizationV9 = (repoRoot: string, value: unknown): LeanDirectAuthorizationV9 => { const authorization = validateLeanDirectAuthorizationV9(repoRoot, value); assertLeanDirectV9TrackedBytes(repoRoot, authorization.source.commit); assertLeanDirectPlan190History(repoRoot); assertSuccessorLockInventory(repoRoot); return authorization }
export const writeLeanDirectAuthorizationV9 = (repoRoot: string, explicitSourceRef: string): LeanDirectAuthorizationV9 => { const authorization = renderLeanDirectAuthorizationV9(repoRoot, explicitSourceRef); writeExclusiveDurable(path.resolve(repoRoot, LEAN_DIRECT_V9_ARTIFACT_PATHS.authorization), authorization); return authorization }
export const checkLeanDirectGuestWorkerSourceOnlyV9 = (repoRoot: string): void => {
  assertLeanStatus(git(repoRoot, ["status", "--short", "--untracked-files=all"])); checkLeanFirstEvidenceCustody(repoRoot); assertDeniedDirectV1History(repoRoot); assertLeanDirectPlan178History(repoRoot); assertLeanDirectPlan180History(repoRoot); assertLeanDirectPlan182History(repoRoot); assertLeanDirectPlan184History(repoRoot); assertLeanDirectPlan186History(repoRoot); assertLeanDirectPlan190History(repoRoot); assertLeanDirectV9PathsAreFresh()
  for (const artifactPath of Object.values(LEAN_DIRECT_V9_ARTIFACT_PATHS)) if (existsSync(path.resolve(repoRoot, artifactPath))) throw new TypeError(`LEAN_DIRECT_V9_DESTINATION_EXISTS:${artifactPath}`)
  const latest = git(repoRoot, ["log", "-1", "--format=%H", "--", ...LEAN_PLAN177_RUNNABLE_PATHS]); const source = resolveLeanDirectV9Source(repoRoot, latest, false); if (source.commit !== latest || Object.keys(source.executableBlobs).length !== 29) throw new TypeError("LEAN_DIRECT_V9_SOURCE_DRIFT"); assertLeanDirectV9TrackedBytes(repoRoot, source.commit); assertSuccessorLockInventory(repoRoot)
}
export const checkLeanDirectValidityReviewV9 = (repoRoot: string, value: unknown): LeanDirectValidityReviewV9 => {
  assertPrivacySafe(value); const preflight = validateLeanContainerPreflightArtifactV8(repoRoot, readJson(repoRoot, LEAN_DIRECT_V9_ARTIFACT_PATHS.preflight)); const authorizationPresent = existsSync(path.resolve(repoRoot, LEAN_DIRECT_V9_ARTIFACT_PATHS.authorization)); const authorization = authorizationPresent ? checkLeanDirectAuthorizationV9(repoRoot, readJson(repoRoot, LEAN_DIRECT_V9_ARTIFACT_PATHS.authorization)) : undefined
  if (!isObject(value) || !exactKeys(value, ["schemaVersion", "authorizationRoot", "preflightRoot", "sourceCommit", "sourceTree", "categories", "blockingFindingCount", "certificationOnlyHistory", "admitsPlan175", "authority"]) || value.schemaVersion !== "v1.38-lean-runner-direct-validity-review-v9" || value.authorizationRoot !== (authorization === undefined ? null : hashLeanValue(authorization)) || value.preflightRoot !== hashLeanValue(preflight) || value.sourceCommit !== preflight.sourceCommit || value.sourceTree !== preflight.sourceTree || !Array.isArray(value.categories) || value.categories.length !== LEAN_DIRECT_VALIDITY_CATEGORIES.length || !Number.isSafeInteger(value.blockingFindingCount) || (value.blockingFindingCount as number) < 0 || JSON.stringify(value.certificationOnlyHistory) !== JSON.stringify(plan172Findings(repoRoot)) || !exactFalseAuthority(value.authority)) throw new TypeError("LEAN_DIRECT_V9_REVIEW_INVALID")
  for (const [index, category] of LEAN_DIRECT_VALIDITY_CATEGORIES.entries()) { const item = value.categories[index]; if (!isObject(item) || !exactKeys(item, ["category", "status", "evidence"]) || item.category !== category || !["pass", "finding"].includes(String(item.status)) || typeof item.evidence !== "string" || item.evidence.length === 0) throw new TypeError("LEAN_DIRECT_V9_REVIEW_INVALID") }
  const findings = value.categories.filter((item) => isObject(item) && item.status === "finding").length; const admitted = preflight.preflight.status === "pass" && authorization !== undefined && findings === 0; if (value.blockingFindingCount !== findings || value.admitsPlan175 !== admitted) throw new TypeError("LEAN_DIRECT_V9_REVIEW_INVALID"); return globalThis.structuredClone(value) as unknown as LeanDirectValidityReviewV9
}
export const loadAndCheckLeanDirectReviewedReadyV9 = (repoRoot: string, allowedOperationalPaths: readonly string[] = []): { authorization: LeanDirectAuthorizationV9; review: LeanDirectValidityReviewV9; preflight: LeanContainerPreflightArtifactV8 } => { assertLeanStatus(git(repoRoot, ["status", "--short", "--untracked-files=all"]), allowedOperationalPaths); for (const artifactPath of [LEAN_DIRECT_V9_ARTIFACT_PATHS.invocation, LEAN_DIRECT_V9_ARTIFACT_PATHS.terminal, LEAN_DIRECT_V9_ARTIFACT_PATHS.adjudication, LEAN_DIRECT_V9_ARTIFACT_PATHS.eligibility]) if (!allowedOperationalPaths.includes(artifactPath) && existsSync(path.resolve(repoRoot, artifactPath))) throw new TypeError(`LEAN_DIRECT_V9_EFFECT_EXISTS:${artifactPath}`); const preflight = validateLeanContainerPreflightArtifactV8(repoRoot, readJson(repoRoot, LEAN_DIRECT_V9_ARTIFACT_PATHS.preflight)); if (preflight.preflight.status !== "pass") throw new TypeError("LEAN_DIRECT_V9_PREFLIGHT_NOT_PASS"); const authorization = checkLeanDirectAuthorizationV9(repoRoot, readJson(repoRoot, LEAN_DIRECT_V9_ARTIFACT_PATHS.authorization)); const review = checkLeanDirectValidityReviewV9(repoRoot, readJson(repoRoot, LEAN_DIRECT_V9_ARTIFACT_PATHS.review)); if (!review.admitsPlan175 || review.blockingFindingCount !== 0) throw new TypeError("LEAN_DIRECT_V9_PLAN175_NOT_ADMITTED"); return { authorization, review, preflight } }
export const checkLeanDirectReviewDispositionV9 = (repoRoot: string): LeanDirectValidityReviewV9 => { assertLeanStatus(git(repoRoot, ["status", "--short", "--untracked-files=all"]), [LEAN_DIRECT_V9_ARTIFACT_PATHS.review]); const review = checkLeanDirectValidityReviewV9(repoRoot, readJson(repoRoot, LEAN_DIRECT_V9_ARTIFACT_PATHS.review)); if (review.admitsPlan175) loadAndCheckLeanDirectReviewedReadyV9(repoRoot); else { for (const artifactPath of [LEAN_DIRECT_V9_ARTIFACT_PATHS.invocation, LEAN_DIRECT_V9_ARTIFACT_PATHS.terminal, LEAN_DIRECT_V9_ARTIFACT_PATHS.adjudication, LEAN_DIRECT_V9_ARTIFACT_PATHS.eligibility]) if (existsSync(path.resolve(repoRoot, artifactPath))) throw new TypeError(`LEAN_DIRECT_V9_DENIED_EFFECT:${artifactPath}`); if (Object.values(review.authority).some(Boolean)) throw new TypeError("LEAN_DIRECT_V9_DENIED_AUTHORITY") }; return review }
export const createLeanDirectInvocationV9 = (authorization: LeanDirectAuthorizationV9, review: LeanDirectValidityReviewV9, childCapabilityRoot: `sha256:${string}`): LeanDirectInvocationV9 => ({ schemaVersion: "v1.38-lean-runner-direct-invocation-v9", authorizationRoot: hashLeanValue(authorization), validityReviewRoot: hashLeanValue(review), preflightRoot: authorization.containerPreflight.root, sourceCommit: authorization.source.commit, childCapabilityRoot, claimClass: "fixture_feasibility_only", invocationOrdinal: 1, authority: LEAN_AUTHORITY_FALSE })
const validateLeanDirectInvocationV9 = (repoRoot: string, value: unknown): LeanDirectInvocationV9 => { const { authorization, review } = loadAndCheckLeanDirectReviewedReadyV9(repoRoot, [LEAN_DIRECT_V9_ARTIFACT_PATHS.invocation]); if (!isObject(value) || !isSha(value.childCapabilityRoot) || JSON.stringify(value) !== JSON.stringify(createLeanDirectInvocationV9(authorization, review, value.childCapabilityRoot))) throw new TypeError("LEAN_DIRECT_V9_INVOCATION_INVALID"); return globalThis.structuredClone(value) as unknown as LeanDirectInvocationV9 }
export const createLeanDirectTerminalArtifactV9 = (invocation: LeanDirectInvocationV9, terminal: LeanTerminal): LeanDirectTerminalArtifactV9 => ({ schemaVersion: "v1.38-lean-runner-direct-terminal-v9", authorizationRoot: invocation.authorizationRoot, validityReviewRoot: invocation.validityReviewRoot, preflightRoot: invocation.preflightRoot, sourceCommit: invocation.sourceCommit, childCapabilityRoot: invocation.childCapabilityRoot, invocationRoot: hashLeanValue(invocation), privacy: "safe_aggregate_only", terminal: deriveAndValidateLeanTerminal(terminal), authority: LEAN_AUTHORITY_FALSE })
export const createExclusiveLeanDirectTerminalV9 = (repoRoot: string, terminal: LeanDirectTerminalArtifactV9): void => writeExclusiveDurable(path.resolve(repoRoot, LEAN_DIRECT_V9_ARTIFACT_PATHS.terminal), terminal)
export const checkLeanDirectPostRunV9 = (repoRoot: string): { invocation: LeanDirectInvocationV9; terminal?: LeanDirectTerminalArtifactV9; markerOnly: boolean } => { const invocation = validateLeanDirectInvocationV9(repoRoot, readJson(repoRoot, LEAN_DIRECT_V9_ARTIFACT_PATHS.invocation)); if (!existsSync(path.resolve(repoRoot, LEAN_DIRECT_V9_ARTIFACT_PATHS.terminal))) return { invocation, markerOnly: true }; const value = readJson(repoRoot, LEAN_DIRECT_V9_ARTIFACT_PATHS.terminal); const expected = createLeanDirectTerminalArtifactV9(invocation, (value as LeanDirectTerminalArtifactV9).terminal); if (JSON.stringify(value) !== JSON.stringify(expected)) throw new TypeError("LEAN_DIRECT_V9_TERMINAL_INVALID"); return { invocation, terminal: value as LeanDirectTerminalArtifactV9, markerOnly: false } }
export const checkLeanDirectAdjudicationV9 = (repoRoot: string): void => { const { invocation, terminal, markerOnly } = checkLeanDirectPostRunV9(repoRoot); const adjudication = readJson(repoRoot, LEAN_DIRECT_V9_ARTIFACT_PATHS.adjudication); const result = markerOnly ? "invalid" : deriveAndValidateLeanTerminal(terminal!.terminal).result; if (!isObject(adjudication) || adjudication.schemaVersion !== "v1.38-lean-runner-direct-adjudication-v9" || adjudication.invocationRoot !== hashLeanValue(invocation) || adjudication.terminalRoot !== (terminal === undefined ? null : hashLeanValue(terminal)) || adjudication.reviewedResult !== result || adjudication.markerOnly !== markerOnly || adjudication.opportunityConsumed !== true || adjudication.admitsEligibility !== (result === "pass") || !exactFalseAuthority(adjudication.authority)) throw new TypeError("LEAN_DIRECT_V9_ADJUDICATION_INVALID"); const eligibility = readJson(repoRoot, LEAN_DIRECT_V9_ARTIFACT_PATHS.eligibility); const passed = result === "pass"; if (!isObject(eligibility) || eligibility.schemaVersion !== "v1.38-phase-262-lean-direct-eligibility-v9" || eligibility.adjudicationRoot !== hashLeanValue(adjudication) || eligibility.admit03 !== (passed ? "satisfied_under_revised_contract" : "blocked") || eligibility.phase262Complete !== passed || eligibility.phase263PlanningEligible !== passed || eligibility.phase263ExecutionEligible !== passed || !exactEligibilityAuthority(eligibility.authority, passed)) throw new TypeError("LEAN_DIRECT_V9_ELIGIBILITY_INVALID") }
export const loadAndCheckLeanCorrectiveReady = (
  repoRoot: string,
  allowedOperationalPaths: readonly string[] = [],
): LeanCorrectiveReadiness => {
  assertLeanCorrectiveAdmissionStatus(
    git(repoRoot, ["status", "--short", "--untracked-files=all"]),
    allowedOperationalPaths,
  )
  checkLeanFirstEvidenceCustody(repoRoot)
  validateLeanDiagnosticCustody(readJson(repoRoot, LEAN_DIAGNOSTIC_CUSTODY_PATH))
  assertSuccessorLockInventory(repoRoot)
  const manifest = checkRecordedLeanCorrectiveManifestV6(repoRoot, readJson(repoRoot, LEAN_CORRECTIVE_V6_ARTIFACT_PATHS.manifest))
  const readiness = checkLeanCorrectiveReadinessV6(manifest, readJson(repoRoot, LEAN_CORRECTIVE_V6_ARTIFACT_PATHS.sourceReview), readJson(repoRoot, LEAN_CORRECTIVE_V6_ARTIFACT_PATHS.readiness))
  assertLeanCorrectiveTrackedBytes(repoRoot, readiness.sourceCommit)
  return readiness
}
const loadAndCheckLeanCorrectiveRecoveryLineage = (
  repoRoot: string,
  allowedOperationalPaths: readonly string[],
): { manifest: LeanCorrectiveManifestV6, readiness: LeanCorrectiveReadiness } => {
  assertLeanCorrectiveAdmissionStatus(git(repoRoot, ["status", "--short", "--untracked-files=all"]), allowedOperationalPaths)
  checkLeanFirstEvidenceCustody(repoRoot)
  validateLeanDiagnosticCustody(readJson(repoRoot, LEAN_DIAGNOSTIC_CUSTODY_PATH))
  assertSuccessorLockInventory(repoRoot)
  for (const artifactPath of Object.values(LEAN_CORRECTIVE_V6_ARTIFACT_PATHS)) {
    if (git(repoRoot, ["hash-object", artifactPath]) !== git(repoRoot, ["rev-parse", `HEAD:${artifactPath}`])) throw new TypeError("LEAN_CORRECTIVE_RECOVERY_LINEAGE_DRIFT")
  }
  const manifestValue = readJson(repoRoot, LEAN_CORRECTIVE_V6_ARTIFACT_PATHS.manifest)
  if (!isObject(manifestValue) || manifestValue.schemaVersion !== "v1.38-lean-runner-corrective-source-manifest-v6" || !isObject(manifestValue.source) || !isOid(manifestValue.source.commit) || !isOid(manifestValue.source.tree) || !isObject(manifestValue.plan169Summary) || JSON.stringify(manifestValue.plan169Summary) !== JSON.stringify({ commit: PLAN169_SUMMARY_COMMIT, blob: PLAN169_SUMMARY_BLOB, contentRoot: PLAN169_SUMMARY_ROOT }) || !isObject(manifestValue.freshCorrectiveEffects) || !noCorrectiveFreshEffectsV6(manifestValue.freshCorrectiveEffects as unknown as LeanCorrectiveFreshEffectsV6) || !exactFalseAuthority(manifestValue.authority)) throw new TypeError("LEAN_CORRECTIVE_RECOVERY_LINEAGE_INVALID")
  const manifest = globalThis.structuredClone(manifestValue) as unknown as LeanCorrectiveManifestV6
  const readiness = checkLeanCorrectiveReadinessV6(manifest, readJson(repoRoot, LEAN_CORRECTIVE_V6_ARTIFACT_PATHS.sourceReview), readJson(repoRoot, LEAN_CORRECTIVE_V6_ARTIFACT_PATHS.readiness))
  assertLeanCorrectiveTrackedBytes(repoRoot, readiness.sourceCommit)
  return { manifest, readiness }
}

export const createLeanCorrectiveInvocation = (readiness: LeanCorrectiveReadiness, childCapabilityRoot: `sha256:${string}`, diagnosticCustody: LeanDiagnosticCustody, firstInvocation: unknown, firstTerminal: unknown): LeanCorrectiveInvocation => validateLeanCorrectiveInvocation({
  schemaVersion: "v1.38-lean-runner-corrective-invocation-v2",
  sourceCommit: readiness.sourceCommit,
  manifestRoot: readiness.manifestRoot,
  sourceReviewRoot: readiness.sourceReviewRoot,
  readinessRoot: hashLeanValue(readiness),
  firstInvocationRoot: hashLeanValue(firstInvocation),
  firstTerminalRoot: hashLeanValue(firstTerminal),
  diagnosticCustodyRoot: hashLeanValue(diagnosticCustody),
  childCapabilityRoot,
  claimClass: "fixture_feasibility_only",
  correctiveInvocationOrdinal: 1,
  authority: LEAN_AUTHORITY_FALSE,
})
export const prepareLeanCorrectiveInvocation = (repoRoot: string, childCapabilityRoot: `sha256:${string}`): LeanCorrectiveInvocation => {
  assertLeanCorrectiveFreshEffectsAbsent(
    existsSync(path.resolve(repoRoot, LEAN_CORRECTIVE_ARTIFACT_PATHS.invocation)),
    existsSync(path.resolve(repoRoot, LEAN_CORRECTIVE_ARTIFACT_PATHS.terminal)),
  )
  return createLeanCorrectiveInvocation(
    loadAndCheckLeanCorrectiveReady(repoRoot),
    childCapabilityRoot,
    validateLeanDiagnosticCustody(readJson(repoRoot, LEAN_DIAGNOSTIC_CUSTODY_PATH)),
    readJson(repoRoot, LEAN_ARTIFACT_PATHS.invocation),
    readJson(repoRoot, LEAN_ARTIFACT_PATHS.terminal),
  )
}
export const checkLeanCorrectiveLaunchAdmission = (repoRoot: string): LeanCorrectiveReadiness => {
  const marker = LEAN_CORRECTIVE_ARTIFACT_PATHS.invocation
  const terminal = LEAN_CORRECTIVE_ARTIFACT_PATHS.terminal
  if (!existsSync(path.resolve(repoRoot, marker))) throw new TypeError("LEAN_CORRECTIVE_MARKER_REQUIRED")
  if (existsSync(path.resolve(repoRoot, terminal))) throw new TypeError("LEAN_CORRECTIVE_TERMINAL_EXISTS")
  return loadAndCheckLeanCorrectiveReady(repoRoot, [marker])
}
export const validateLeanCorrectiveInvocation = (value: unknown): LeanCorrectiveInvocation => {
  const keys = ["schemaVersion", "sourceCommit", "manifestRoot", "sourceReviewRoot", "readinessRoot", "firstInvocationRoot", "firstTerminalRoot", "diagnosticCustodyRoot", "childCapabilityRoot", "claimClass", "correctiveInvocationOrdinal", "authority"]
  if (!isObject(value) || !exactKeys(value, keys) || value.schemaVersion !== "v1.38-lean-runner-corrective-invocation-v2" || !isOid(value.sourceCommit) || ![value.manifestRoot, value.sourceReviewRoot, value.readinessRoot, value.firstInvocationRoot, value.firstTerminalRoot, value.diagnosticCustodyRoot, value.childCapabilityRoot].every(isSha) || value.claimClass !== "fixture_feasibility_only" || value.correctiveInvocationOrdinal !== 1 || !exactFalseAuthority(value.authority)) throw new TypeError("LEAN_CORRECTIVE_INVOCATION_INVALID")
  return globalThis.structuredClone(value) as unknown as LeanCorrectiveInvocation
}
export const validateLeanCorrectiveInvocationLineage = (repoRoot: string, readiness: LeanCorrectiveReadiness, value: unknown): LeanCorrectiveInvocation => {
  const invocation = validateLeanCorrectiveInvocation(value)
  const custody = validateLeanDiagnosticCustody(readJson(repoRoot, LEAN_DIAGNOSTIC_CUSTODY_PATH))
  const firstInvocation = readJson(repoRoot, LEAN_ARTIFACT_PATHS.invocation)
  const firstTerminal = readJson(repoRoot, LEAN_ARTIFACT_PATHS.terminal)
  if (invocation.sourceCommit !== readiness.sourceCommit || invocation.manifestRoot !== readiness.manifestRoot || invocation.sourceReviewRoot !== readiness.sourceReviewRoot || invocation.readinessRoot !== hashLeanValue(readiness) || invocation.firstInvocationRoot !== hashLeanValue(firstInvocation) || invocation.firstTerminalRoot !== hashLeanValue(firstTerminal) || invocation.diagnosticCustodyRoot !== hashLeanValue(custody)) throw new TypeError("LEAN_CORRECTIVE_INVOCATION_LINEAGE_MISMATCH")
  return invocation
}

const assertForbiddenScopeAbsent = (repoRoot: string, allowed: readonly string[]): void => {
  for (const artifactPath of Object.values(LEAN_ARTIFACT_PATHS)) if (!allowed.includes(artifactPath) && existsSync(path.resolve(repoRoot, artifactPath))) throw new TypeError(`LEAN_FORBIDDEN_ARTIFACT:${artifactPath}`)
  const forbidden = git(repoRoot, ["ls-files"]).split("\n").filter((file) => /v1\.38-(?:full-inward|edge-anchored-bracket|formation-profile|sealed-holdout|candidate-search)/u.test(file))
  if (forbidden.length > 0) throw new TypeError(`LEAN_FORBIDDEN_SCOPE:${forbidden.join(",")}`)
}
export const checkLeanSourcePreconditions = (repoRoot: string): void => {
  assertLeanStatus(git(repoRoot, ["status", "--short", "--untracked-files=all"]))
  assertForbiddenScopeAbsent(repoRoot, [LEAN_ARTIFACT_PATHS.manifest])
}
export const loadAndCheckLeanReviewedReady = (
  repoRoot: string,
  allowedUntracked: readonly string[] = [],
  allowedArtifacts: readonly string[] = [LEAN_ARTIFACT_PATHS.manifest, LEAN_ARTIFACT_PATHS.sourceReview, LEAN_ARTIFACT_PATHS.readiness],
): LeanReadiness => {
  assertLeanStatus(git(repoRoot, ["status", "--short", "--untracked-files=all"]), allowedUntracked)
  assertForbiddenScopeAbsent(repoRoot, allowedArtifacts)
  const manifest = checkLeanManifest(repoRoot, readJson(repoRoot, LEAN_ARTIFACT_PATHS.manifest))
  return checkLeanReadiness(manifest, readJson(repoRoot, LEAN_ARTIFACT_PATHS.sourceReview), readJson(repoRoot, LEAN_ARTIFACT_PATHS.readiness))
}

const checkTerminalValue = (value: unknown): LeanTerminal => deriveAndValidateLeanTerminal(value)

export const createLeanInterruptedTerminal = (): LeanTerminal => reduceLeanExecutions(
  buildLeanSchedule().map((cell, ordinal) => ({
    ...cell,
    classification: "unlaunched" as const,
    cleanupComplete: true,
    orphanedChild: false,
    boardRealism: currentFormationIsRealistic(cell),
    integrityValid: ordinal !== 0,
  })),
)

export const createLeanInvocation = (readiness: LeanReadiness, childCapabilityRoot: `sha256:${string}`): LeanInvocation => validateLeanInvocation({
  schemaVersion: "v1.38-lean-runner-invocation-v1",
  sourceCommit: readiness.sourceCommit,
  manifestRoot: readiness.manifestRoot,
  sourceReviewRoot: readiness.sourceReviewRoot,
  readinessRoot: hashLeanValue(readiness),
  childCapabilityRoot,
  claimClass: "fixture_feasibility_only",
  liveInvocationOrdinal: 1,
  authority: LEAN_AUTHORITY_FALSE,
})

export const validateLeanInvocation = (value: unknown): LeanInvocation => {
  assertPrivacySafe(value)
  if (!isObject(value) || !exactKeys(value, ["schemaVersion", "sourceCommit", "manifestRoot", "sourceReviewRoot", "readinessRoot", "childCapabilityRoot", "claimClass", "liveInvocationOrdinal", "authority"]) || value.schemaVersion !== "v1.38-lean-runner-invocation-v1" || !isOid(value.sourceCommit) || !isSha(value.manifestRoot) || !isSha(value.sourceReviewRoot) || !isSha(value.readinessRoot) || !isSha(value.childCapabilityRoot) || value.claimClass !== "fixture_feasibility_only" || value.liveInvocationOrdinal !== 1 || !exactFalseAuthority(value.authority)) throw new TypeError("LEAN_INVOCATION_INVALID")
  return globalThis.structuredClone(value) as unknown as LeanInvocation
}

export const validateLeanInvocationLineage = (readiness: LeanReadiness, value: unknown): LeanInvocation => {
  const invocation = validateLeanInvocation(value)
  if (
    invocation.sourceCommit !== readiness.sourceCommit ||
    invocation.manifestRoot !== readiness.manifestRoot ||
    invocation.sourceReviewRoot !== readiness.sourceReviewRoot ||
    invocation.readinessRoot !== hashLeanValue(readiness)
  ) throw new TypeError("LEAN_INVOCATION_LINEAGE_MISMATCH")
  return invocation
}

export const createLeanDirectInvocation = (
  authorization: LeanDirectAuthorization,
  review: LeanDirectValidityReview,
  childCapabilityRoot: `sha256:${string}`,
): LeanDirectInvocation => validateLeanDirectInvocation(authorization, review, {
  schemaVersion: "v1.38-lean-runner-direct-invocation-v1",
  authorizationRoot: hashLeanValue(authorization),
  validityReviewRoot: hashLeanValue(review),
  sourceCommit: authorization.source.commit,
  childCapabilityRoot,
  claimClass: "fixture_feasibility_only",
  invocationOrdinal: 1,
  authority: LEAN_AUTHORITY_FALSE,
})
export const validateLeanDirectInvocation = (authorization: LeanDirectAuthorization, review: LeanDirectValidityReview, value: unknown): LeanDirectInvocation => {
  assertPrivacySafe(value)
  if (!isObject(value) || !exactKeys(value, ["schemaVersion", "authorizationRoot", "validityReviewRoot", "sourceCommit", "childCapabilityRoot", "claimClass", "invocationOrdinal", "authority"]) || value.schemaVersion !== "v1.38-lean-runner-direct-invocation-v1" || value.authorizationRoot !== hashLeanValue(authorization) || value.validityReviewRoot !== hashLeanValue(review) || value.sourceCommit !== authorization.source.commit || !isSha(value.childCapabilityRoot) || value.claimClass !== "fixture_feasibility_only" || value.invocationOrdinal !== 1 || !exactFalseAuthority(value.authority)) throw new TypeError("LEAN_DIRECT_INVOCATION_INVALID")
  return globalThis.structuredClone(value) as unknown as LeanDirectInvocation
}
export const createLeanDirectTerminalArtifact = (invocation: LeanDirectInvocation, terminal: LeanTerminal): LeanDirectTerminalArtifact => validateLeanDirectTerminalArtifact({
  schemaVersion: "v1.38-lean-runner-direct-terminal-v1",
  authorizationRoot: invocation.authorizationRoot,
  validityReviewRoot: invocation.validityReviewRoot,
  sourceCommit: invocation.sourceCommit,
  childCapabilityRoot: invocation.childCapabilityRoot,
  invocationRoot: hashLeanValue(invocation),
  privacy: "safe_aggregate_only",
  terminal,
  authority: LEAN_AUTHORITY_FALSE,
}, invocation)
export const validateLeanDirectTerminalArtifact = (value: unknown, invocation: LeanDirectInvocation): LeanDirectTerminalArtifact => {
  assertPrivacySafe(value)
  if (!isObject(value) || !exactKeys(value, ["schemaVersion", "authorizationRoot", "validityReviewRoot", "sourceCommit", "childCapabilityRoot", "invocationRoot", "privacy", "terminal", "authority"]) || value.schemaVersion !== "v1.38-lean-runner-direct-terminal-v1" || value.authorizationRoot !== invocation.authorizationRoot || value.validityReviewRoot !== invocation.validityReviewRoot || value.sourceCommit !== invocation.sourceCommit || value.childCapabilityRoot !== invocation.childCapabilityRoot || value.invocationRoot !== hashLeanValue(invocation) || value.privacy !== "safe_aggregate_only" || !exactFalseAuthority(value.authority)) throw new TypeError("LEAN_DIRECT_TERMINAL_INVALID")
  return { ...(globalThis.structuredClone(value) as Omit<LeanDirectTerminalArtifact, "terminal">), terminal: checkTerminalValue(value.terminal) }
}
export const createExclusiveLeanDirectTerminal = (repoRoot: string, terminal: LeanDirectTerminalArtifact): void => writeExclusiveDurable(path.resolve(repoRoot, LEAN_DIRECT_ARTIFACT_PATHS.terminal), terminal)
export const checkLeanDirectPostRun = (repoRoot: string, laterPaths: readonly string[] = []): { invocation: LeanDirectInvocation, terminal?: LeanDirectTerminalArtifact, markerOnly: boolean } => {
  const terminalPresent = existsSync(path.resolve(repoRoot, LEAN_DIRECT_ARTIFACT_PATHS.terminal))
  const allowed = [LEAN_DIRECT_ARTIFACT_PATHS.invocation, ...(terminalPresent ? [LEAN_DIRECT_ARTIFACT_PATHS.terminal] : []), ...laterPaths]
  const { authorization, review } = loadAndCheckLeanDirectReviewedReady(repoRoot, allowed)
  const invocation = validateLeanDirectInvocation(authorization, review, readJson(repoRoot, LEAN_DIRECT_ARTIFACT_PATHS.invocation))
  assertNoLeanChildProcess()
  if (!terminalPresent) return { invocation, markerOnly: true }
  const terminal = validateLeanDirectTerminalArtifact(readJson(repoRoot, LEAN_DIRECT_ARTIFACT_PATHS.terminal), invocation)
  if (!terminal.terminal.completeCleanup) throw new TypeError("LEAN_DIRECT_CLEANUP_INCOMPLETE")
  return { invocation, terminal, markerOnly: false }
}
export const validateLeanDirectAdjudication = (
  value: unknown,
  invocation: LeanDirectInvocation,
  terminal?: LeanDirectTerminalArtifact,
): LeanDirectAdjudication => {
  assertPrivacySafe(value)
  const markerOnly = terminal === undefined
  const result = markerOnly ? "invalid" : deriveAndValidateLeanTerminal(terminal.terminal).result
  if (!isObject(value) || !exactKeys(value, ["schemaVersion", "invocationRoot", "terminalRoot", "reviewedResult", "markerOnly", "opportunityConsumed", "findingCount", "findings", "admitsEligibility", "authority"]) || value.schemaVersion !== "v1.38-lean-runner-direct-adjudication-v1" || value.invocationRoot !== hashLeanValue(invocation) || value.terminalRoot !== (terminal === undefined ? null : hashLeanValue(terminal)) || value.reviewedResult !== result || value.markerOnly !== markerOnly || value.opportunityConsumed !== true || value.findingCount !== 0 || !Array.isArray(value.findings) || value.findings.length !== 0 || value.admitsEligibility !== (result === "pass") || !exactFalseAuthority(value.authority)) throw new TypeError("LEAN_DIRECT_ADJUDICATION_INVALID")
  return globalThis.structuredClone(value) as unknown as LeanDirectAdjudication
}
export const validateLeanDirectEligibility = (value: unknown, adjudication: LeanDirectAdjudication): LeanDirectEligibility => {
  const passed = adjudication.reviewedResult === "pass" && adjudication.admitsEligibility
  if (!isObject(value) || !exactKeys(value, ["schemaVersion", "adjudicationRoot", "admit03", "phase262Complete", "phase263PlanningEligible", "phase263ExecutionEligible", "authority"]) || value.schemaVersion !== "v1.38-phase-262-lean-direct-eligibility-v1" || value.adjudicationRoot !== hashLeanValue(adjudication) || value.admit03 !== (passed ? "satisfied_under_revised_contract" : "blocked") || value.phase262Complete !== passed || value.phase263PlanningEligible !== passed || value.phase263ExecutionEligible !== passed || !exactEligibilityAuthority(value.authority, passed)) throw new TypeError("LEAN_DIRECT_ELIGIBILITY_INVALID")
  return globalThis.structuredClone(value) as unknown as LeanDirectEligibility
}
export const checkLeanDirectAdjudication = (repoRoot: string): LeanDirectEligibility => {
  const branch = checkLeanDirectPostRun(repoRoot, [LEAN_DIRECT_ARTIFACT_PATHS.adjudication, LEAN_DIRECT_ARTIFACT_PATHS.eligibility])
  const adjudication = validateLeanDirectAdjudication(readJson(repoRoot, LEAN_DIRECT_ARTIFACT_PATHS.adjudication), branch.invocation, branch.terminal)
  return validateLeanDirectEligibility(readJson(repoRoot, LEAN_DIRECT_ARTIFACT_PATHS.eligibility), adjudication)
}

export const loadAndCheckLeanChildInvocation = (repoRoot: string, capability: string, ownershipToken?: string): LeanInvocation | LeanCorrectiveInvocation | LeanDirectInvocation | LeanDirectInvocationV3 | LeanDirectInvocationV4 => {
  if (existsSync(path.resolve(repoRoot, LEAN_DIRECT_V4_ARTIFACT_PATHS.invocation))) {
    if (ownershipToken !== undefined || existsSync(path.resolve(repoRoot, LEAN_DIRECT_V4_ARTIFACT_PATHS.terminal))) throw new TypeError("LEAN_DIRECT_V4_CHILD_ADMISSION_INVALID")
    const invocation = validateLeanDirectInvocationV4(repoRoot, readJson(repoRoot, LEAN_DIRECT_V4_ARTIFACT_PATHS.invocation))
    if (invocation.childCapabilityRoot !== hashLeanValue(capability)) throw new TypeError("LEAN_CHILD_CAPABILITY_MISMATCH")
    return invocation
  }
  if (existsSync(path.resolve(repoRoot, LEAN_DIRECT_V3_ARTIFACT_PATHS.invocation))) {
    if (ownershipToken !== undefined || existsSync(path.resolve(repoRoot, LEAN_DIRECT_V3_ARTIFACT_PATHS.terminal))) throw new TypeError("LEAN_DIRECT_V3_CHILD_ADMISSION_INVALID")
    const invocation = validateLeanDirectInvocationV3(repoRoot, readJson(repoRoot, LEAN_DIRECT_V3_ARTIFACT_PATHS.invocation))
    if (invocation.childCapabilityRoot !== hashLeanValue(capability)) throw new TypeError("LEAN_CHILD_CAPABILITY_MISMATCH")
    return invocation
  }
  if (existsSync(path.resolve(repoRoot, LEAN_DIRECT_ARTIFACT_PATHS.invocation))) {
    if (ownershipToken !== undefined || existsSync(path.resolve(repoRoot, LEAN_DIRECT_ARTIFACT_PATHS.terminal))) throw new TypeError("LEAN_DIRECT_CHILD_ADMISSION_INVALID")
    const { authorization, review } = loadAndCheckLeanDirectReviewedReady(repoRoot, [LEAN_DIRECT_ARTIFACT_PATHS.invocation])
    const invocation = validateLeanDirectInvocation(authorization, review, readJson(repoRoot, LEAN_DIRECT_ARTIFACT_PATHS.invocation))
    if (invocation.childCapabilityRoot !== hashLeanValue(capability)) throw new TypeError("LEAN_CHILD_CAPABILITY_MISMATCH")
    return invocation
  }
  if (existsSync(path.resolve(repoRoot, LEAN_CORRECTIVE_ARTIFACT_PATHS.invocation))) {
    if (existsSync(path.resolve(repoRoot, LEAN_CORRECTIVE_ARTIFACT_PATHS.terminal))) throw new TypeError("LEAN_CORRECTIVE_TERMINAL_EXISTS")
    const readiness = loadAndCheckLeanCorrectiveReady(repoRoot, [LEAN_CORRECTIVE_ARTIFACT_PATHS.invocation, LEAN_CORRECTIVE_CHILD_OWNERSHIP_PATH])
    const invocation = validateLeanCorrectiveInvocationLineage(repoRoot, readiness, readJson(repoRoot, LEAN_CORRECTIVE_ARTIFACT_PATHS.invocation))
    if (invocation.childCapabilityRoot !== hashLeanValue(capability)) throw new TypeError("LEAN_CHILD_CAPABILITY_MISMATCH")
    const ownership = validateLeanCorrectiveChildOwnership(readJson(repoRoot, LEAN_CORRECTIVE_CHILD_OWNERSHIP_PATH))
    if (
      ownershipToken === undefined || ownership.token !== ownershipToken ||
      ownership.invocationRoot !== hashLeanValue(invocation) || ownership.childPid !== process.pid ||
      process.argv[2] !== ownership.selector || process.argv[3] !== ownership.token
    ) throw new TypeError("LEAN_CORRECTIVE_CHILD_IDENTITY_MISMATCH")
    return invocation
  }
  const readiness = loadAndCheckLeanReviewedReady(
    repoRoot,
    [LEAN_ARTIFACT_PATHS.invocation],
    [LEAN_ARTIFACT_PATHS.manifest, LEAN_ARTIFACT_PATHS.sourceReview, LEAN_ARTIFACT_PATHS.readiness, LEAN_ARTIFACT_PATHS.invocation],
  )
  const invocation = validateLeanInvocationLineage(readiness, readJson(repoRoot, LEAN_ARTIFACT_PATHS.invocation))
  if (invocation.childCapabilityRoot !== hashLeanValue(capability)) throw new TypeError("LEAN_CHILD_CAPABILITY_MISMATCH")
  return invocation
}

export const createLeanTerminalArtifact = (invocation: LeanInvocation, terminal: LeanTerminal): LeanTerminalArtifact => validateLeanTerminalArtifact({
  schemaVersion: "v1.38-lean-runner-terminal-v1",
  sourceCommit: invocation.sourceCommit,
  manifestRoot: invocation.manifestRoot,
  sourceReviewRoot: invocation.sourceReviewRoot,
  readinessRoot: invocation.readinessRoot,
  childCapabilityRoot: invocation.childCapabilityRoot,
  invocationRoot: hashLeanValue(invocation),
  privacy: "safe_aggregate_only",
  terminal,
  authority: LEAN_AUTHORITY_FALSE,
}, invocation)

export const validateLeanTerminalArtifact = (value: unknown, invocationValue: unknown): LeanTerminalArtifact => {
  assertPrivacySafe(value)
  const invocation = validateLeanInvocation(invocationValue)
  if (!isObject(value) || !exactKeys(value, ["schemaVersion", "sourceCommit", "manifestRoot", "sourceReviewRoot", "readinessRoot", "childCapabilityRoot", "invocationRoot", "privacy", "terminal", "authority"]) || value.schemaVersion !== "v1.38-lean-runner-terminal-v1" || value.sourceCommit !== invocation.sourceCommit || value.manifestRoot !== invocation.manifestRoot || value.sourceReviewRoot !== invocation.sourceReviewRoot || value.readinessRoot !== invocation.readinessRoot || value.childCapabilityRoot !== invocation.childCapabilityRoot || value.invocationRoot !== hashLeanValue(invocation) || value.privacy !== "safe_aggregate_only" || !exactFalseAuthority(value.authority)) throw new TypeError("LEAN_TERMINAL_ARTIFACT_INVALID")
  return { ...(globalThis.structuredClone(value) as Omit<LeanTerminalArtifact, "terminal">), terminal: checkTerminalValue(value.terminal) }
}

export const createLeanCorrectiveTerminalArtifact = (invocation: LeanCorrectiveInvocation, terminal: LeanTerminal, recoveryTerminalized = false): LeanCorrectiveTerminalArtifact => validateLeanCorrectiveTerminalArtifact({
  schemaVersion: "v1.38-lean-runner-corrective-terminal-v2",
  sourceCommit: invocation.sourceCommit,
  manifestRoot: invocation.manifestRoot,
  sourceReviewRoot: invocation.sourceReviewRoot,
  readinessRoot: invocation.readinessRoot,
  firstInvocationRoot: invocation.firstInvocationRoot,
  firstTerminalRoot: invocation.firstTerminalRoot,
  diagnosticCustodyRoot: invocation.diagnosticCustodyRoot,
  childCapabilityRoot: invocation.childCapabilityRoot,
  invocationRoot: hashLeanValue(invocation),
  privacy: "safe_aggregate_only",
  recoveryTerminalized,
  terminal,
  authority: LEAN_AUTHORITY_FALSE,
}, invocation)
export const validateLeanCorrectiveTerminalArtifact = (value: unknown, invocationValue: unknown): LeanCorrectiveTerminalArtifact => {
  const invocation = validateLeanCorrectiveInvocation(invocationValue)
  const keys = ["schemaVersion", "sourceCommit", "manifestRoot", "sourceReviewRoot", "readinessRoot", "firstInvocationRoot", "firstTerminalRoot", "diagnosticCustodyRoot", "childCapabilityRoot", "invocationRoot", "privacy", "recoveryTerminalized", "terminal", "authority"]
  if (!isObject(value) || !exactKeys(value, keys) || value.schemaVersion !== "v1.38-lean-runner-corrective-terminal-v2" || value.sourceCommit !== invocation.sourceCommit || value.manifestRoot !== invocation.manifestRoot || value.sourceReviewRoot !== invocation.sourceReviewRoot || value.readinessRoot !== invocation.readinessRoot || value.firstInvocationRoot !== invocation.firstInvocationRoot || value.firstTerminalRoot !== invocation.firstTerminalRoot || value.diagnosticCustodyRoot !== invocation.diagnosticCustodyRoot || value.childCapabilityRoot !== invocation.childCapabilityRoot || value.invocationRoot !== hashLeanValue(invocation) || value.privacy !== "safe_aggregate_only" || typeof value.recoveryTerminalized !== "boolean" || !exactFalseAuthority(value.authority)) throw new TypeError("LEAN_CORRECTIVE_TERMINAL_INVALID")
  const terminal = checkTerminalValue(value.terminal)
  if (value.recoveryTerminalized && terminal.result !== "invalid") throw new TypeError("LEAN_CORRECTIVE_RECOVERY_TERMINAL_INVALID")
  return { ...(globalThis.structuredClone(value) as Omit<LeanCorrectiveTerminalArtifact, "terminal">), terminal }
}

export const createLeanCorrectiveInterruptionTombstone = (invocation: LeanCorrectiveInvocation): LeanCorrectiveInterruptionTombstone => validateLeanCorrectiveInterruptionTombstone({
  schemaVersion: "v1.38-lean-runner-corrective-interruption-tombstone-v1",
  sourceCommit: invocation.sourceCommit,
  manifestRoot: invocation.manifestRoot,
  sourceReviewRoot: invocation.sourceReviewRoot,
  readinessRoot: invocation.readinessRoot,
  firstInvocationRoot: invocation.firstInvocationRoot,
  firstTerminalRoot: invocation.firstTerminalRoot,
  diagnosticCustodyRoot: invocation.diagnosticCustodyRoot,
  childCapabilityRoot: invocation.childCapabilityRoot,
  invocationRoot: hashLeanValue(invocation),
  result: "invalid",
  recoveryTerminalized: true,
  chargedMatches: 0,
  successfulMatches: 0,
  completeCleanup: true,
  formationMaterialized: false,
  privacy: "safe_aggregate_only",
  authority: LEAN_AUTHORITY_FALSE,
}, invocation)
export const validateLeanCorrectiveInterruptionTombstone = (value: unknown, invocationValue: unknown): LeanCorrectiveInterruptionTombstone => {
  assertPrivacySafe(value)
  const invocation = validateLeanCorrectiveInvocation(invocationValue)
  const keys = ["schemaVersion", "sourceCommit", "manifestRoot", "sourceReviewRoot", "readinessRoot", "firstInvocationRoot", "firstTerminalRoot", "diagnosticCustodyRoot", "childCapabilityRoot", "invocationRoot", "result", "recoveryTerminalized", "chargedMatches", "successfulMatches", "completeCleanup", "formationMaterialized", "privacy", "authority"]
  if (!isObject(value) || !exactKeys(value, keys) || value.schemaVersion !== "v1.38-lean-runner-corrective-interruption-tombstone-v1" || value.sourceCommit !== invocation.sourceCommit || value.manifestRoot !== invocation.manifestRoot || value.sourceReviewRoot !== invocation.sourceReviewRoot || value.readinessRoot !== invocation.readinessRoot || value.firstInvocationRoot !== invocation.firstInvocationRoot || value.firstTerminalRoot !== invocation.firstTerminalRoot || value.diagnosticCustodyRoot !== invocation.diagnosticCustodyRoot || value.childCapabilityRoot !== invocation.childCapabilityRoot || value.invocationRoot !== hashLeanValue(invocation) || value.result !== "invalid" || value.recoveryTerminalized !== true || value.chargedMatches !== 0 || value.successfulMatches !== 0 || value.completeCleanup !== true || value.formationMaterialized !== false || value.privacy !== "safe_aggregate_only" || !exactFalseAuthority(value.authority)) throw new TypeError("LEAN_CORRECTIVE_INTERRUPTION_TOMBSTONE_INVALID")
  return globalThis.structuredClone(value) as unknown as LeanCorrectiveInterruptionTombstone
}

export const validateLeanAdjudication = (value: unknown, terminalValue: unknown): LeanAdjudication => {
  assertPrivacySafe(value)
  if (!isObject(terminalValue)) throw new TypeError("LEAN_ADJUDICATION_INVALID")
  const terminal = terminalValue as unknown as LeanTerminalArtifact
  const rederived = checkTerminalValue(terminal.terminal)
  if (!isObject(value) || !exactKeys(value, ["schemaVersion", "terminalRoot", "reviewedResult", "findingCount", "findings", "admitsEligibility", "authority"]) || value.schemaVersion !== "v1.38-lean-runner-adjudication-v1" || value.terminalRoot !== hashLeanValue(terminal) || value.reviewedResult !== rederived.result || value.findingCount !== 0 || !Array.isArray(value.findings) || value.findings.length !== 0 || value.admitsEligibility !== (rederived.result === "pass") || !exactFalseAuthority(value.authority)) throw new TypeError("LEAN_ADJUDICATION_INVALID")
  return globalThis.structuredClone(value) as unknown as LeanAdjudication
}

export const validateLeanEligibility = (value: unknown, adjudicationValue: unknown): LeanEligibility => {
  assertPrivacySafe(value)
  if (!isObject(adjudicationValue)) throw new TypeError("LEAN_ELIGIBILITY_INVALID")
  const adjudication = adjudicationValue as unknown as LeanAdjudication
  const passed = adjudication.reviewedResult === "pass" && adjudication.admitsEligibility
  if (!isObject(value) || !exactKeys(value, ["schemaVersion", "adjudicationRoot", "admit03", "phase262Complete", "phase263PlanningEligible", "phase263ExecutionEligible", "authority"]) || value.schemaVersion !== "v1.38-phase-262-lean-eligibility-v1" || value.adjudicationRoot !== hashLeanValue(adjudication) || value.admit03 !== (passed ? "satisfied_under_revised_contract" : "blocked") || value.phase262Complete !== passed || value.phase263PlanningEligible !== passed || value.phase263ExecutionEligible !== passed || !exactEligibilityAuthority(value.authority, passed)) throw new TypeError("LEAN_ELIGIBILITY_INVALID")
  return globalThis.structuredClone(value) as unknown as LeanEligibility
}

const TRACKING_MARKERS = Object.freeze({
  ".planning/ROADMAP.md": { marker: "phase-262-lean-roadmap-tracking", surface: "roadmap" },
  ".planning/STATE.md": { marker: "phase-262-lean-state-tracking", surface: "state" },
  ".planning/v1.38-CURRENT-STATUS.md": { marker: "phase-262-lean-current-status-tracking", surface: "current_status" },
  ".planning/v1.38-v1.38-MILESTONE-AUDIT.md": { marker: "phase-262-lean-milestone-audit-tracking", surface: "milestone_audit" },
} as const)
type StructuredTrackingPath = keyof typeof TRACKING_MARKERS
type TrackingPath = StructuredTrackingPath | ".planning/REQUIREMENTS.md"
interface LeanTrackingCarrier {
  readonly schemaVersion: "v1.38-phase-262-lean-final-tracking-v1"
  readonly surface: (typeof TRACKING_MARKERS)[StructuredTrackingPath]["surface"]
  readonly admit03: LeanEligibility["admit03"]
  readonly phase262Complete: boolean
  readonly phase263PlanningEligible: boolean
  readonly phase263ExecutionEligible: boolean
  readonly authority: LeanEligibility["authority"]
}
export const parseLeanTrackingSurface = (
  trackingPath: TrackingPath,
  body: string,
): Pick<LeanEligibility, "admit03"> | LeanTrackingCarrier => {
  if (trackingPath === ".planning/REQUIREMENTS.md") {
    const rows = body.split("\n").filter((line) => /^- \[[ x]\] \*\*ADMIT-03\*\*:/u.test(line))
    if (rows.length !== 1) throw new TypeError("LEAN_TRACKING_AMBIGUOUS:requirements")
    return { admit03: rows[0]!.startsWith("- [x]") ? "satisfied_under_revised_contract" : "blocked" }
  }
  const descriptor = TRACKING_MARKERS[trackingPath]
  const escaped = descriptor.marker.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")
  const matches = [...body.matchAll(new RegExp(`<!-- ${escaped}: (\\{[^\\n]*\\}) -->`, "gu"))]
  if (matches.length !== 1) throw new TypeError(`LEAN_TRACKING_AMBIGUOUS:${descriptor.surface}`)
  let value: unknown
  try { value = JSON.parse(matches[0]![1]!) } catch { throw new TypeError(`LEAN_TRACKING_MALFORMED:${descriptor.surface}`) }
  const keys = ["schemaVersion", "surface", "admit03", "phase262Complete", "phase263PlanningEligible", "phase263ExecutionEligible", "authority"]
  if (!isObject(value) || !exactKeys(value, keys) || value.schemaVersion !== "v1.38-phase-262-lean-final-tracking-v1" || value.surface !== descriptor.surface || !["satisfied_under_revised_contract", "blocked"].includes(String(value.admit03))) throw new TypeError(`LEAN_TRACKING_INVALID:${descriptor.surface}`)
  const passed = value.admit03 === "satisfied_under_revised_contract"
  if (value.phase262Complete !== passed || value.phase263PlanningEligible !== passed || value.phase263ExecutionEligible !== passed || !exactEligibilityAuthority(value.authority, passed)) throw new TypeError(`LEAN_TRACKING_INVALID:${descriptor.surface}`)
  return globalThis.structuredClone(value) as unknown as LeanTrackingCarrier
}
export const renderLeanTrackingCarrier = (
  trackingPath: StructuredTrackingPath,
  eligibility: LeanEligibility,
): string => {
  const descriptor = TRACKING_MARKERS[trackingPath]
  const carrier: LeanTrackingCarrier = {
    schemaVersion: "v1.38-phase-262-lean-final-tracking-v1",
    surface: descriptor.surface,
    admit03: eligibility.admit03,
    phase262Complete: eligibility.phase262Complete,
    phase263PlanningEligible: eligibility.phase263PlanningEligible,
    phase263ExecutionEligible: eligibility.phase263ExecutionEligible,
    authority: eligibility.authority,
  }
  parseLeanTrackingSurface(trackingPath, `<!-- ${descriptor.marker}: ${JSON.stringify(carrier)} -->`)
  return `<!-- ${descriptor.marker}: ${JSON.stringify(carrier)} -->`
}
const writeExclusiveDurable = (target: string, value: unknown): void => {
  let descriptor: number | undefined
  try {
    descriptor = openSync(target, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY | (constants.O_NOFOLLOW ?? 0), 0o600)
    const bytes = Buffer.from(`${JSON.stringify(value)}\n`, "utf8")
    let offset = 0
    while (offset < bytes.length) offset += writeSync(descriptor, bytes, offset)
    fsyncSync(descriptor); closeSync(descriptor); descriptor = undefined
    const parent = openSync(path.dirname(target), constants.O_RDONLY)
    try { fsyncSync(parent) } finally { closeSync(parent) }
  } finally { if (descriptor !== undefined) closeSync(descriptor) }
}
export const createLeanCorrectiveChildOwnership = (
  invocationRoot: string,
  childPid: number,
  processGroupId: number,
  token: string,
): LeanCorrectiveChildOwnership => validateLeanCorrectiveChildOwnership({
  schemaVersion: "v1.38-lean-corrective-child-ownership-v1",
  invocationRoot,
  childPid,
  processGroupId,
  selector: "--execute-reviewed-cell",
  token,
  commandArguments: ["--execute-reviewed-cell", token],
})
export const validateLeanCorrectiveChildOwnership = (value: unknown): LeanCorrectiveChildOwnership => {
  const keys = ["schemaVersion", "invocationRoot", "childPid", "processGroupId", "selector", "token", "commandArguments"]
  if (
    !isObject(value) || !exactKeys(value, keys) ||
    value.schemaVersion !== "v1.38-lean-corrective-child-ownership-v1" || !isSha(value.invocationRoot) ||
    !Number.isSafeInteger(value.childPid) || (value.childPid as number) <= 1 ||
    !Number.isSafeInteger(value.processGroupId) || value.processGroupId !== value.childPid ||
    value.selector !== "--execute-reviewed-cell" || typeof value.token !== "string" || !/^[0-9a-f]{64}$/u.test(value.token) ||
    !Array.isArray(value.commandArguments) || value.commandArguments.length !== 2 ||
    value.commandArguments[0] !== value.selector || value.commandArguments[1] !== value.token
  ) throw new TypeError("LEAN_CORRECTIVE_CHILD_OWNERSHIP_INVALID")
  return globalThis.structuredClone(value) as unknown as LeanCorrectiveChildOwnership
}
export const persistLeanCorrectiveChildOwnership = (
  repoRoot: string,
  invocation: LeanCorrectiveInvocation,
  childPid: number,
  processGroupId: number,
  token: string,
): void => {
  const ownership = createLeanCorrectiveChildOwnership(hashLeanValue(invocation), childPid, processGroupId, token)
  writeExclusiveDurable(path.resolve(repoRoot, LEAN_CORRECTIVE_CHILD_OWNERSHIP_PATH), ownership)
}
export const clearLeanCorrectiveChildOwnership = (repoRoot: string, token: string): void => {
  const target = path.resolve(repoRoot, LEAN_CORRECTIVE_CHILD_OWNERSHIP_PATH)
  const ownership = validateLeanCorrectiveChildOwnership(readJson(repoRoot, LEAN_CORRECTIVE_CHILD_OWNERSHIP_PATH))
  if (ownership.token !== token) throw new TypeError("LEAN_CORRECTIVE_CHILD_IDENTITY_MISMATCH")
  unlinkSync(target)
  const parent = openSync(path.dirname(target), constants.O_RDONLY)
  try { fsyncSync(parent) } finally { closeSync(parent) }
}
const commandMatchesLeanCorrectiveOwnership = (command: string, ownership: LeanCorrectiveChildOwnership): boolean => {
  const words = command.trim().split(/\s+/u)
  const selectorIndex = words.indexOf(ownership.selector)
  return /(?:^|\/)run-v1-38-lean-runner-feasibility\.ts(?:\s|$)/u.test(command) &&
    selectorIndex >= 0 && words[selectorIndex + 1] === ownership.token &&
    words.filter((word) => word === ownership.selector).length === 1 &&
    words.filter((word) => word === ownership.token).length === 1
}
export const recoverLeanCorrectiveOrphanInjected = async (
  ownershipValue: unknown,
  dependencies: LeanCorrectiveOrphanRecoveryDependencies,
): Promise<void> => {
  const ownership = validateLeanCorrectiveChildOwnership(ownershipValue)
  if (ownership.invocationRoot !== dependencies.expectedInvocationRoot) throw new TypeError("LEAN_CORRECTIVE_CHILD_IDENTITY_MISMATCH")
  const command = dependencies.commandForPid(ownership.childPid)
  if (command === undefined || command.trim().length === 0 || !dependencies.processIsAlive(ownership.childPid)) throw new TypeError("LEAN_CORRECTIVE_CHILD_STALE")
  if (dependencies.processGroupForPid(ownership.childPid) !== ownership.processGroupId || !commandMatchesLeanCorrectiveOwnership(command, ownership)) throw new TypeError("LEAN_CORRECTIVE_CHILD_IDENTITY_MISMATCH")
  dependencies.signalProcessGroup(ownership.processGroupId, "SIGTERM")
  for (let attempt = 0; attempt < 20 && dependencies.processIsAlive(ownership.childPid); attempt += 1) await dependencies.wait(50)
  if (dependencies.processIsAlive(ownership.childPid)) {
    dependencies.signalProcessGroup(ownership.processGroupId, "SIGKILL")
    for (let attempt = 0; attempt < 20 && dependencies.processIsAlive(ownership.childPid); attempt += 1) await dependencies.wait(50)
  }
  if (dependencies.processIsAlive(ownership.childPid)) throw new TypeError("LEAN_CORRECTIVE_CHILD_EXIT_UNPROVED")
}
const processIsAlive = (pid: number): boolean => {
  try { process.kill(pid, 0); return true } catch (error) { return (error as NodeJS.ErrnoException).code === "EPERM" }
}
export const recoverLeanCorrectiveOrphan = async (repoRoot: string): Promise<void> => {
  const markerPath = LEAN_CORRECTIVE_ARTIFACT_PATHS.invocation
  const terminalPath = LEAN_CORRECTIVE_ARTIFACT_PATHS.terminal
  if (!existsSync(path.resolve(repoRoot, markerPath))) throw new TypeError("LEAN_CORRECTIVE_MARKER_REQUIRED")
  if (existsSync(path.resolve(repoRoot, terminalPath))) throw new TypeError("LEAN_CORRECTIVE_TERMINAL_EXISTS")
  const { readiness } = loadAndCheckLeanCorrectiveRecoveryLineage(repoRoot, [markerPath, LEAN_CORRECTIVE_CHILD_OWNERSHIP_PATH])
  const invocation = validateLeanCorrectiveInvocationLineage(repoRoot, readiness, readJson(repoRoot, markerPath))
  const ownership = validateLeanCorrectiveChildOwnership(readJson(repoRoot, LEAN_CORRECTIVE_CHILD_OWNERSHIP_PATH))
  await recoverLeanCorrectiveOrphanInjected(ownership, {
    expectedInvocationRoot: hashLeanValue(invocation),
    commandForPid: (pid) => {
      try { return execFileSync("ps", ["-p", String(pid), "-o", "command="], { encoding: "utf8" }).trim() || undefined } catch { return undefined }
    },
    processGroupForPid: (pid) => {
      try {
        const value = Number(execFileSync("ps", ["-p", String(pid), "-o", "pgid="], { encoding: "utf8" }).trim())
        return Number.isSafeInteger(value) && value > 1 ? value : undefined
      } catch { return undefined }
    },
    signalProcessGroup: (processGroupId, signal) => { process.kill(-processGroupId, signal) },
    processIsAlive,
    wait: async (milliseconds) => { await new Promise<void>((resolve) => setTimeout(resolve, milliseconds)) },
  })
  clearLeanCorrectiveChildOwnership(repoRoot, ownership.token)
}
export const assertNoLeanChildProcess = (): void => {
  const commands = execFileSync("ps", ["-axo", "command="], { encoding: "utf8" })
  if (commands.split("\n").some((command) => command.includes("run-v1-38-lean-runner-feasibility") && command.includes("--execute-reviewed-cell"))) throw new TypeError("LEAN_CHILD_STILL_ACTIVE")
}
export const createExclusiveLeanTerminal = (repoRoot: string, terminal: LeanTerminalArtifact): void => writeExclusiveDurable(path.resolve(repoRoot, LEAN_ARTIFACT_PATHS.terminal), terminal)
export const createExclusiveLeanCorrectiveTerminal = (repoRoot: string, terminal: LeanCorrectiveTerminalArtifact | LeanCorrectiveInterruptionTombstone): void => writeExclusiveDurable(path.resolve(repoRoot, LEAN_CORRECTIVE_ARTIFACT_PATHS.terminal), terminal)
export const terminalizeLeanCorrectiveInterruption = (repoRoot: string): void => {
  const markerPath = path.resolve(repoRoot, LEAN_CORRECTIVE_ARTIFACT_PATHS.invocation)
  const terminalPath = path.resolve(repoRoot, LEAN_CORRECTIVE_ARTIFACT_PATHS.terminal)
  if (!existsSync(markerPath)) throw new TypeError("LEAN_CORRECTIVE_MARKER_REQUIRED")
  if (existsSync(terminalPath)) throw new TypeError("LEAN_CORRECTIVE_TERMINAL_EXISTS")
  assertNoLeanChildProcess()
  const { readiness } = loadAndCheckLeanCorrectiveRecoveryLineage(repoRoot, [LEAN_CORRECTIVE_ARTIFACT_PATHS.invocation])
  const invocation = validateLeanCorrectiveInvocationLineage(repoRoot, readiness, readJson(repoRoot, LEAN_CORRECTIVE_ARTIFACT_PATHS.invocation))
  createExclusiveLeanCorrectiveTerminal(repoRoot, createLeanCorrectiveInterruptionTombstone(invocation))
}
export const checkLeanCorrectiveTerminal = (repoRoot: string): LeanCorrectiveTerminalArtifact | LeanCorrectiveInterruptionTombstone => {
  checkLeanFirstEvidenceCustody(repoRoot)
  assertSuccessorLockInventory(repoRoot)
  const readiness = loadAndCheckLeanCorrectiveReady(repoRoot, [LEAN_CORRECTIVE_ARTIFACT_PATHS.invocation, LEAN_CORRECTIVE_ARTIFACT_PATHS.terminal])
  const invocation = validateLeanCorrectiveInvocationLineage(repoRoot, readiness, readJson(repoRoot, LEAN_CORRECTIVE_ARTIFACT_PATHS.invocation))
  const rawTerminal = readJson(repoRoot, LEAN_CORRECTIVE_ARTIFACT_PATHS.terminal)
  const terminal = isObject(rawTerminal) && rawTerminal.schemaVersion === "v1.38-lean-runner-corrective-interruption-tombstone-v1"
    ? validateLeanCorrectiveInterruptionTombstone(rawTerminal, invocation)
    : validateLeanCorrectiveTerminalArtifact(rawTerminal, invocation)
  assertNoLeanChildProcess()
  if (!("terminal" in terminal ? terminal.terminal.completeCleanup : terminal.completeCleanup)) throw new TypeError("LEAN_CORRECTIVE_CLEANUP_INCOMPLETE")
  return terminal
}
export const checkLeanCorrectiveRecoveryTerminal = (repoRoot: string): LeanCorrectiveInterruptionTombstone => {
  const { readiness } = loadAndCheckLeanCorrectiveRecoveryLineage(repoRoot, [LEAN_CORRECTIVE_ARTIFACT_PATHS.invocation, LEAN_CORRECTIVE_ARTIFACT_PATHS.terminal])
  const invocation = validateLeanCorrectiveInvocationLineage(repoRoot, readiness, readJson(repoRoot, LEAN_CORRECTIVE_ARTIFACT_PATHS.invocation))
  const terminal = validateLeanCorrectiveInterruptionTombstone(readJson(repoRoot, LEAN_CORRECTIVE_ARTIFACT_PATHS.terminal), invocation)
  assertNoLeanChildProcess()
  if (!terminal.completeCleanup) throw new TypeError("LEAN_CORRECTIVE_CLEANUP_INCOMPLETE")
  return terminal
}

const main = (): void => {
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
  const selector = process.argv[2]
  if (selector === "--render-manifest") { process.stdout.write(`${JSON.stringify(renderLeanManifest(repoRoot, process.argv[3] ?? "HEAD"), null, 2)}\n`); return }
  if (selector === "--check-manifest") { checkLeanSourcePreconditions(repoRoot); checkLeanManifest(repoRoot, readJson(repoRoot, LEAN_ARTIFACT_PATHS.manifest)) }
  else if (selector === "--check-source-review") {
    assertForbiddenScopeAbsent(repoRoot, [LEAN_ARTIFACT_PATHS.manifest, LEAN_ARTIFACT_PATHS.sourceReview])
    const manifest = checkLeanManifest(repoRoot, readJson(repoRoot, LEAN_ARTIFACT_PATHS.manifest)); checkLeanSourceReview(manifest, readJson(repoRoot, LEAN_ARTIFACT_PATHS.sourceReview))
  } else if (selector === "--check-review-outcome") {
    const readinessPresent = existsSync(path.resolve(repoRoot, LEAN_ARTIFACT_PATHS.readiness))
    assertForbiddenScopeAbsent(repoRoot, [LEAN_ARTIFACT_PATHS.manifest, LEAN_ARTIFACT_PATHS.sourceReview, ...(readinessPresent ? [LEAN_ARTIFACT_PATHS.readiness] : [])])
    const manifest = checkLeanManifest(repoRoot, readJson(repoRoot, LEAN_ARTIFACT_PATHS.manifest))
    checkLeanReviewOutcome(
      manifest,
      readJson(repoRoot, LEAN_ARTIFACT_PATHS.sourceReview),
      readinessPresent ? readJson(repoRoot, LEAN_ARTIFACT_PATHS.readiness) : undefined,
    )
  } else if (selector === "--check-reviewed-ready") { loadAndCheckLeanReviewedReady(repoRoot) }
  else if (selector === "--terminalize-interruption") {
    const readiness = loadAndCheckLeanReviewedReady(
      repoRoot,
      [LEAN_ARTIFACT_PATHS.invocation],
      [LEAN_ARTIFACT_PATHS.manifest, LEAN_ARTIFACT_PATHS.sourceReview, LEAN_ARTIFACT_PATHS.readiness, LEAN_ARTIFACT_PATHS.invocation],
    )
    if (existsSync(path.resolve(repoRoot, LEAN_ARTIFACT_PATHS.terminal))) throw new TypeError("LEAN_TERMINAL_ALREADY_EXISTS")
    assertNoLeanChildProcess()
    const invocation = validateLeanInvocationLineage(readiness, readJson(repoRoot, LEAN_ARTIFACT_PATHS.invocation))
    createExclusiveLeanTerminal(repoRoot, createLeanTerminalArtifact(invocation, createLeanInterruptedTerminal()))
  }
  else if (selector === "--check-terminal" || selector === "--check-post-run") {
    assertForbiddenScopeAbsent(repoRoot, [LEAN_ARTIFACT_PATHS.manifest, LEAN_ARTIFACT_PATHS.sourceReview, LEAN_ARTIFACT_PATHS.readiness, LEAN_ARTIFACT_PATHS.invocation, LEAN_ARTIFACT_PATHS.terminal])
    const readiness = loadAndCheckLeanReviewedReady(
      repoRoot,
      [LEAN_ARTIFACT_PATHS.invocation, LEAN_ARTIFACT_PATHS.terminal],
      [LEAN_ARTIFACT_PATHS.manifest, LEAN_ARTIFACT_PATHS.sourceReview, LEAN_ARTIFACT_PATHS.readiness, LEAN_ARTIFACT_PATHS.invocation, LEAN_ARTIFACT_PATHS.terminal],
    )
    const invocation = validateLeanInvocationLineage(readiness, readJson(repoRoot, LEAN_ARTIFACT_PATHS.invocation))
    const terminal = validateLeanTerminalArtifact(readJson(repoRoot, LEAN_ARTIFACT_PATHS.terminal), invocation)
    if (selector === "--check-post-run") {
      assertNoLeanChildProcess()
      if (!terminal.terminal.completeCleanup) throw new TypeError("LEAN_CLEANUP_INCOMPLETE")
    }
  } else if (selector === "--check-adjudication" || selector === "--check-eligibility") {
    assertForbiddenScopeAbsent(repoRoot, Object.values(LEAN_ARTIFACT_PATHS))
    const readiness = loadAndCheckLeanReviewedReady(
      repoRoot,
      [LEAN_ARTIFACT_PATHS.invocation, LEAN_ARTIFACT_PATHS.terminal, LEAN_ARTIFACT_PATHS.adjudication, LEAN_ARTIFACT_PATHS.eligibility],
      Object.values(LEAN_ARTIFACT_PATHS),
    )
    const invocation = validateLeanInvocationLineage(readiness, readJson(repoRoot, LEAN_ARTIFACT_PATHS.invocation))
    const terminal = validateLeanTerminalArtifact(readJson(repoRoot, LEAN_ARTIFACT_PATHS.terminal), invocation)
    const adjudication = readJson(repoRoot, LEAN_ARTIFACT_PATHS.adjudication)
    const checked = validateLeanAdjudication(adjudication, terminal)
    validateLeanEligibility(readJson(repoRoot, LEAN_ARTIFACT_PATHS.eligibility), checked)
  } else if (selector === "--check-final-tracking") {
    const readiness = loadAndCheckLeanReviewedReady(
      repoRoot,
      [LEAN_ARTIFACT_PATHS.invocation, LEAN_ARTIFACT_PATHS.terminal, LEAN_ARTIFACT_PATHS.adjudication, LEAN_ARTIFACT_PATHS.eligibility],
      Object.values(LEAN_ARTIFACT_PATHS),
    )
    const invocation = validateLeanInvocationLineage(readiness, readJson(repoRoot, LEAN_ARTIFACT_PATHS.invocation))
    const terminal = validateLeanTerminalArtifact(readJson(repoRoot, LEAN_ARTIFACT_PATHS.terminal), invocation)
    const adjudication = validateLeanAdjudication(readJson(repoRoot, LEAN_ARTIFACT_PATHS.adjudication), terminal)
    const eligibility = validateLeanEligibility(readJson(repoRoot, LEAN_ARTIFACT_PATHS.eligibility), adjudication)
    for (const trackingPath of [".planning/REQUIREMENTS.md", ".planning/ROADMAP.md", ".planning/STATE.md", ".planning/v1.38-CURRENT-STATUS.md", ".planning/v1.38-v1.38-MILESTONE-AUDIT.md"]) {
      const body = readFileSync(path.resolve(repoRoot, trackingPath), "utf8")
      const tracking = parseLeanTrackingSurface(trackingPath as TrackingPath, body)
      if (tracking.admit03 !== eligibility.admit03) throw new TypeError(`LEAN_FINAL_TRACKING_DRIFT:${trackingPath}`)
      if (trackingPath !== ".planning/REQUIREMENTS.md" && hashLeanValue(tracking) !== hashLeanValue({
        schemaVersion: "v1.38-phase-262-lean-final-tracking-v1",
        surface: (TRACKING_MARKERS[trackingPath as StructuredTrackingPath]).surface,
        admit03: eligibility.admit03,
        phase262Complete: eligibility.phase262Complete,
        phase263PlanningEligible: eligibility.phase263PlanningEligible,
        phase263ExecutionEligible: eligibility.phase263ExecutionEligible,
        authority: eligibility.authority,
      })) throw new TypeError(`LEAN_FINAL_TRACKING_DRIFT:${trackingPath}`)
    }
  } else if (selector === "--render-direct-authorization-v1") {
    process.stdout.write(`${JSON.stringify(renderLeanDirectAuthorization(repoRoot, process.argv[3] ?? "HEAD"), null, 2)}\n`)
    return
  } else if (selector === "--write-direct-authorization-v1") {
    writeLeanDirectAuthorization(repoRoot, process.argv[3] ?? "HEAD")
  } else if (selector === "--check-direct-source-only") {
    checkLeanDirectSourceOnly(repoRoot)
  } else if (selector === "--check-direct-authorization-v1") {
    assertLeanStatus(git(repoRoot, ["status", "--short", "--untracked-files=all"]))
    checkLeanDirectAuthorization(repoRoot, readJson(repoRoot, LEAN_DIRECT_ARTIFACT_PATHS.authorization))
  } else if (selector === "--check-direct-review-outcome-v1") {
    assertLeanStatus(git(repoRoot, ["status", "--short", "--untracked-files=all"]))
    const authorization = checkLeanDirectAuthorization(repoRoot, readJson(repoRoot, LEAN_DIRECT_ARTIFACT_PATHS.authorization))
    checkLeanDirectValidityReview(authorization, readJson(repoRoot, LEAN_DIRECT_ARTIFACT_PATHS.review))
  } else if (selector === "--check-direct-reviewed-ready-v1") {
    loadAndCheckLeanDirectReviewedReady(repoRoot)
  } else if (selector === "--check-direct-post-run-v1") {
    checkLeanDirectPostRun(repoRoot)
  } else if (selector === "--check-direct-adjudication-v1" || selector === "--check-direct-final-tracking-v1") {
    checkLeanDirectAdjudication(repoRoot)
  } else if (selector === "--check-direct-container-source-only-v2") {
    checkLeanDirectContainerSourceOnlyV2(repoRoot)
  } else if (selector === "--check-direct-container-source-only-v3") {
    checkLeanDirectContainerSourceOnlyV3(repoRoot)
  } else if (selector === "--check-direct-container-session-source-only-v5") {
    checkLeanDirectContainerSourceOnlyV5(repoRoot)
  } else if (selector === "--write-direct-container-preflight-v4") {
    writeLeanContainerPreflightArtifactV4(repoRoot, validateLeanDirectV2ExplicitSourceRef(process.argv[3]))
  } else if (selector === "--check-direct-container-preflight-v4") {
    assertLeanStatus(git(repoRoot, ["status", "--short", "--untracked-files=all"]))
    validateLeanContainerPreflightArtifactV4(repoRoot, readJson(repoRoot, LEAN_DIRECT_V5_ARTIFACT_PATHS.preflight))
  } else if (selector === "--render-direct-authorization-v5") {
    process.stdout.write(`${JSON.stringify(renderLeanDirectAuthorizationV5(repoRoot, validateLeanDirectV2ExplicitSourceRef(process.argv[3])), null, 2)}\n`)
    return
  } else if (selector === "--write-direct-authorization-v5") {
    writeLeanDirectAuthorizationV5(repoRoot, validateLeanDirectV2ExplicitSourceRef(process.argv[3]))
  } else if (selector === "--check-direct-authorization-v5") {
    assertLeanStatus(git(repoRoot, ["status", "--short", "--untracked-files=all"]))
    checkLeanDirectAuthorizationV5(repoRoot, readJson(repoRoot, LEAN_DIRECT_V5_ARTIFACT_PATHS.authorization))
  } else if (selector === "--check-direct-review-disposition-v5") {
    checkLeanDirectReviewDispositionV5(repoRoot)
  } else if (selector === "--check-direct-reviewed-ready-v5") {
    loadAndCheckLeanDirectReviewedReadyV5(repoRoot)
  } else if (selector === "--check-direct-post-run-v5") {
    checkLeanDirectPostRunV5(repoRoot)
  } else if (selector === "--check-direct-adjudication-v5" || selector === "--check-direct-final-tracking-v5") {
    checkLeanDirectAdjudicationV5(repoRoot)
  } else if (selector === "--check-direct-preflight-reference-source-only-v7") {
    checkLeanDirectPreflightReferenceSourceOnlyV7(repoRoot)
  } else if (selector === "--write-direct-container-preflight-v6") {
    writeLeanContainerPreflightArtifactV6(repoRoot, validateLeanDirectV2ExplicitSourceRef(process.argv[3]))
  } else if (selector === "--check-direct-container-preflight-v6") {
    assertLeanStatus(git(repoRoot, ["status", "--short", "--untracked-files=all"])); validateLeanContainerPreflightArtifactV6(repoRoot, readJson(repoRoot, LEAN_DIRECT_V7_ARTIFACT_PATHS.preflight))
  } else if (selector === "--render-direct-authorization-v7") {
    process.stdout.write(`${JSON.stringify(renderLeanDirectAuthorizationV7(repoRoot, validateLeanDirectV2ExplicitSourceRef(process.argv[3])), null, 2)}\n`); return
  } else if (selector === "--write-direct-authorization-v7") {
    writeLeanDirectAuthorizationV7(repoRoot, validateLeanDirectV2ExplicitSourceRef(process.argv[3]))
  } else if (selector === "--check-direct-authorization-v7") {
    assertLeanStatus(git(repoRoot, ["status", "--short", "--untracked-files=all"])); checkLeanDirectAuthorizationV7(repoRoot, readJson(repoRoot, LEAN_DIRECT_V7_ARTIFACT_PATHS.authorization))
  } else if (selector === "--check-direct-review-disposition-v7") {
    checkLeanDirectReviewDispositionV7(repoRoot)
  } else if (selector === "--check-direct-reviewed-ready-v7") {
    loadAndCheckLeanDirectReviewedReadyV7(repoRoot)
  } else if (selector === "--check-direct-post-run-v7") {
    checkLeanDirectPostRunV7(repoRoot)
  } else if (selector === "--check-direct-adjudication-v7" || selector === "--check-direct-final-tracking-v7") {
    checkLeanDirectAdjudicationV7(repoRoot)
  } else if (selector === "--check-direct-exact-absence-source-only-v8") {
    checkLeanDirectExactAbsenceSourceOnlyV8(repoRoot)
  } else if (selector === "--write-direct-container-preflight-v7") {
    writeLeanContainerPreflightArtifactV7(repoRoot, validateLeanDirectV2ExplicitSourceRef(process.argv[3]))
  } else if (selector === "--check-direct-container-preflight-v7") {
    assertLeanStatus(git(repoRoot, ["status", "--short", "--untracked-files=all"])); validateLeanContainerPreflightArtifactV7(repoRoot, readJson(repoRoot, LEAN_DIRECT_V8_ARTIFACT_PATHS.preflight))
  } else if (selector === "--render-direct-authorization-v8") {
    process.stdout.write(`${JSON.stringify(renderLeanDirectAuthorizationV8(repoRoot, validateLeanDirectV2ExplicitSourceRef(process.argv[3])), null, 2)}\n`); return
  } else if (selector === "--write-direct-authorization-v8") {
    writeLeanDirectAuthorizationV8(repoRoot, validateLeanDirectV2ExplicitSourceRef(process.argv[3]))
  } else if (selector === "--check-direct-authorization-v8") {
    assertLeanStatus(git(repoRoot, ["status", "--short", "--untracked-files=all"])); checkLeanDirectAuthorizationV8(repoRoot, readJson(repoRoot, LEAN_DIRECT_V8_ARTIFACT_PATHS.authorization))
  } else if (selector === "--check-direct-review-disposition-v8") {
    checkLeanDirectReviewDispositionV8(repoRoot)
  } else if (selector === "--check-direct-reviewed-ready-v8") {
    loadAndCheckLeanDirectReviewedReadyV8(repoRoot)
  } else if (selector === "--check-direct-post-run-v8") {
    checkLeanDirectPostRunV8(repoRoot)
  } else if (selector === "--check-direct-adjudication-v8" || selector === "--check-direct-final-tracking-v8") {
    checkLeanDirectAdjudicationV8(repoRoot)
  } else if (selector === "--check-direct-guest-worker-source-only-v9") {
    checkLeanDirectGuestWorkerSourceOnlyV9(repoRoot)
  } else if (selector === "--write-direct-container-preflight-v8") {
    writeLeanContainerPreflightArtifactV8(repoRoot, validateLeanDirectV2ExplicitSourceRef(process.argv[3]))
  } else if (selector === "--check-direct-container-preflight-v8") {
    assertLeanStatus(git(repoRoot, ["status", "--short", "--untracked-files=all"])); validateLeanContainerPreflightArtifactV8(repoRoot, readJson(repoRoot, LEAN_DIRECT_V9_ARTIFACT_PATHS.preflight))
  } else if (selector === "--render-direct-authorization-v9") {
    process.stdout.write(`${JSON.stringify(renderLeanDirectAuthorizationV9(repoRoot, validateLeanDirectV2ExplicitSourceRef(process.argv[3])), null, 2)}\n`); return
  } else if (selector === "--write-direct-authorization-v9") {
    writeLeanDirectAuthorizationV9(repoRoot, validateLeanDirectV2ExplicitSourceRef(process.argv[3]))
  } else if (selector === "--check-direct-authorization-v9") {
    assertLeanStatus(git(repoRoot, ["status", "--short", "--untracked-files=all"])); checkLeanDirectAuthorizationV9(repoRoot, readJson(repoRoot, LEAN_DIRECT_V9_ARTIFACT_PATHS.authorization))
  } else if (selector === "--check-direct-review-disposition-v9") {
    checkLeanDirectReviewDispositionV9(repoRoot)
  } else if (selector === "--check-direct-reviewed-ready-v9") {
    loadAndCheckLeanDirectReviewedReadyV9(repoRoot)
  } else if (selector === "--check-direct-post-run-v9") {
    checkLeanDirectPostRunV9(repoRoot)
  } else if (selector === "--check-direct-adjudication-v9" || selector === "--check-direct-final-tracking-v9") {
    checkLeanDirectAdjudicationV9(repoRoot)
  } else if (selector === "--check-direct-container-stream-source-only-v6") {
    checkLeanDirectContainerStreamSourceOnlyV6(repoRoot)
  } else if (selector === "--write-direct-container-preflight-v5") {
    writeLeanContainerPreflightArtifactV5(repoRoot, validateLeanDirectV2ExplicitSourceRef(process.argv[3]))
  } else if (selector === "--check-direct-container-preflight-v5") {
    assertLeanStatus(git(repoRoot, ["status", "--short", "--untracked-files=all"])); validateLeanContainerPreflightArtifactV5(repoRoot, readJson(repoRoot, LEAN_DIRECT_V6_ARTIFACT_PATHS.preflight))
  } else if (selector === "--render-direct-authorization-v6") {
    process.stdout.write(`${JSON.stringify(renderLeanDirectAuthorizationV6(repoRoot, validateLeanDirectV2ExplicitSourceRef(process.argv[3])), null, 2)}\n`); return
  } else if (selector === "--write-direct-authorization-v6") {
    writeLeanDirectAuthorizationV6(repoRoot, validateLeanDirectV2ExplicitSourceRef(process.argv[3]))
  } else if (selector === "--check-direct-authorization-v6") {
    assertLeanStatus(git(repoRoot, ["status", "--short", "--untracked-files=all"])); checkLeanDirectAuthorizationV6(repoRoot, readJson(repoRoot, LEAN_DIRECT_V6_ARTIFACT_PATHS.authorization))
  } else if (selector === "--check-direct-review-disposition-v6") {
    checkLeanDirectReviewDispositionV6(repoRoot)
  } else if (selector === "--check-direct-reviewed-ready-v6") {
    loadAndCheckLeanDirectReviewedReadyV6(repoRoot)
  } else if (selector === "--check-direct-post-run-v6") {
    checkLeanDirectPostRunV6(repoRoot)
  } else if (selector === "--check-direct-adjudication-v6" || selector === "--check-direct-final-tracking-v6") {
    checkLeanDirectAdjudicationV6(repoRoot)
  } else if (selector === "--check-direct-container-session-source-only-v4") {
    checkLeanDirectContainerSourceOnlyV4(repoRoot)
  } else if (selector === "--write-direct-container-preflight-v3") {
    writeLeanContainerPreflightArtifactV3(repoRoot, validateLeanDirectV2ExplicitSourceRef(process.argv[3]))
  } else if (selector === "--check-direct-container-preflight-v3") {
    assertLeanStatus(git(repoRoot, ["status", "--short", "--untracked-files=all"]))
    validateLeanContainerPreflightArtifactV3(repoRoot, readJson(repoRoot, LEAN_DIRECT_V4_ARTIFACT_PATHS.preflight))
  } else if (selector === "--render-direct-authorization-v4") {
    process.stdout.write(`${JSON.stringify(renderLeanDirectAuthorizationV4(repoRoot, validateLeanDirectV2ExplicitSourceRef(process.argv[3])), null, 2)}\n`)
    return
  } else if (selector === "--write-direct-authorization-v4") {
    writeLeanDirectAuthorizationV4(repoRoot, validateLeanDirectV2ExplicitSourceRef(process.argv[3]))
  } else if (selector === "--check-direct-authorization-v4") {
    assertLeanStatus(git(repoRoot, ["status", "--short", "--untracked-files=all"]))
    checkLeanDirectAuthorizationV4(repoRoot, readJson(repoRoot, LEAN_DIRECT_V4_ARTIFACT_PATHS.authorization))
  } else if (selector === "--check-direct-review-disposition-v4") {
    checkLeanDirectReviewDispositionV4(repoRoot)
  } else if (selector === "--check-direct-reviewed-ready-v4") {
    loadAndCheckLeanDirectReviewedReadyV4(repoRoot)
  } else if (selector === "--check-direct-post-run-v4") {
    checkLeanDirectPostRunV4(repoRoot)
  } else if (selector === "--check-direct-adjudication-v4" || selector === "--check-direct-final-tracking-v4") {
    checkLeanDirectAdjudicationV4(repoRoot)
  } else if (selector === "--write-direct-container-preflight-v2") {
    writeLeanContainerPreflightArtifactV2(repoRoot, validateLeanDirectV2ExplicitSourceRef(process.argv[3]))
  } else if (selector === "--check-direct-container-preflight-v2") {
    assertLeanStatus(git(repoRoot, ["status", "--short", "--untracked-files=all"]))
    validateLeanContainerPreflightArtifactV2(repoRoot, readJson(repoRoot, LEAN_DIRECT_V3_ARTIFACT_PATHS.preflight))
  } else if (selector === "--render-direct-authorization-v3") {
    process.stdout.write(`${JSON.stringify(renderLeanDirectAuthorizationV3(repoRoot, validateLeanDirectV2ExplicitSourceRef(process.argv[3])), null, 2)}\n`)
    return
  } else if (selector === "--write-direct-authorization-v3") {
    writeLeanDirectAuthorizationV3(repoRoot, validateLeanDirectV2ExplicitSourceRef(process.argv[3]))
  } else if (selector === "--check-direct-authorization-v3") {
    assertLeanStatus(git(repoRoot, ["status", "--short", "--untracked-files=all"]))
    checkLeanDirectAuthorizationV3(repoRoot, readJson(repoRoot, LEAN_DIRECT_V3_ARTIFACT_PATHS.authorization))
  } else if (selector === "--check-direct-review-outcome-v3") {
    assertLeanStatus(git(repoRoot, ["status", "--short", "--untracked-files=all"]))
    checkLeanDirectValidityReviewV3(repoRoot, readJson(repoRoot, LEAN_DIRECT_V3_ARTIFACT_PATHS.review))
  } else if (selector === "--check-direct-reviewed-ready-v3") {
    loadAndCheckLeanDirectReviewedReadyV3(repoRoot)
  } else if (selector === "--check-direct-post-run-v3") {
    checkLeanDirectPostRunV3(repoRoot)
  } else if (selector === "--check-direct-adjudication-v3" || selector === "--check-direct-final-tracking-v3") {
    checkLeanDirectAdjudicationV3(repoRoot)
  } else if (selector === "--write-direct-container-preflight-v1") {
    const sourceRef = validateLeanDirectV2ExplicitSourceRef(process.argv[3])
    const evidencePath = process.argv[4]
    if (evidencePath === undefined) throw new TypeError("LEAN_DIRECT_V2_PREFLIGHT_EVIDENCE_REQUIRED")
    writeLeanContainerPreflightArtifact(repoRoot, sourceRef, JSON.parse(readFileSync(path.resolve(repoRoot, evidencePath), "utf8")))
  } else if (selector === "--render-direct-authorization-v2") {
    process.stdout.write(`${JSON.stringify(renderLeanDirectAuthorizationV2(repoRoot, validateLeanDirectV2ExplicitSourceRef(process.argv[3])), null, 2)}\n`)
    return
  } else if (selector === "--write-direct-authorization-v2") {
    writeLeanDirectAuthorizationV2(repoRoot, validateLeanDirectV2ExplicitSourceRef(process.argv[3]))
  } else if (selector === "--check-direct-container-preflight-v1") {
    assertLeanStatus(git(repoRoot, ["status", "--short", "--untracked-files=all"]))
    validateLeanContainerPreflightArtifact(repoRoot, readJson(repoRoot, LEAN_DIRECT_V2_ARTIFACT_PATHS.preflight))
  } else if (selector === "--check-direct-authorization-v2") {
    assertLeanStatus(git(repoRoot, ["status", "--short", "--untracked-files=all"]))
    checkLeanDirectAuthorizationV2(repoRoot, readJson(repoRoot, LEAN_DIRECT_V2_ARTIFACT_PATHS.authorization))
  } else if (selector === "--check-direct-review-outcome-v2") {
    assertLeanStatus(git(repoRoot, ["status", "--short", "--untracked-files=all"]))
    const authorization = checkLeanDirectAuthorizationV2(repoRoot, readJson(repoRoot, LEAN_DIRECT_V2_ARTIFACT_PATHS.authorization))
    checkLeanDirectValidityReviewV2(authorization, readJson(repoRoot, LEAN_DIRECT_V2_ARTIFACT_PATHS.review))
  } else if (selector === "--check-direct-reviewed-ready-v2") {
    loadAndCheckLeanDirectReviewedReadyV2(repoRoot)
  } else if (selector === "--check-direct-post-run-v2") {
    checkLeanDirectPostRunV2(repoRoot)
  } else if (selector === "--check-direct-adjudication-v2" || selector === "--check-direct-final-tracking-v2") {
    checkLeanDirectAdjudicationV2(repoRoot)
  } else if (selector === "--render-corrective-manifest") {
    process.stdout.write(`${JSON.stringify(renderLeanCorrectiveManifest(repoRoot, process.argv[3] ?? "HEAD"), null, 2)}\n`)
    return
  } else if (selector === "--check-corrective-source-only") {
    checkLeanCorrectiveSourceOnly(repoRoot)
  } else if (selector === "--check-corrective-recovery-only-structure") {
    checkLeanCorrectiveRecoveryOnlyStructure(
      readFileSync(path.resolve(repoRoot, "scripts/run-v1-38-lean-runner-feasibility.ts"), "utf8"),
      readFileSync(path.resolve(repoRoot, "scripts/check-v1-38-lean-admission.ts"), "utf8"),
    )
  } else if (selector === "--check-corrective-source-review-v2") {
    const manifest = checkLeanCorrectiveManifestV2(repoRoot, readJson(repoRoot, LEAN_CORRECTIVE_V2_ARTIFACT_PATHS.manifest))
    checkLeanCorrectiveReviewOutcomeV2(manifest, readJson(repoRoot, LEAN_CORRECTIVE_V2_ARTIFACT_PATHS.sourceReview), existsSync(path.resolve(repoRoot, LEAN_CORRECTIVE_V2_ARTIFACT_PATHS.readiness)) ? readJson(repoRoot, LEAN_CORRECTIVE_V2_ARTIFACT_PATHS.readiness) : undefined)
  } else if (selector === "--render-corrective-manifest-v3") {
    process.stdout.write(`${JSON.stringify(renderLeanCorrectiveManifestV3(repoRoot, process.argv[3] ?? "HEAD"), null, 2)}\n`)
    return
  } else if (selector === "--check-corrective-manifest-v3") {
    checkLeanCorrectiveManifestV3(repoRoot, readJson(repoRoot, LEAN_CORRECTIVE_V3_ARTIFACT_PATHS.manifest))
  } else if (selector === "--check-corrective-source-review-v3") {
    const manifest = checkLeanCorrectiveManifestV3(repoRoot, readJson(repoRoot, LEAN_CORRECTIVE_V3_ARTIFACT_PATHS.manifest))
    checkLeanCorrectiveSourceReviewV3(manifest, readJson(repoRoot, LEAN_CORRECTIVE_V3_ARTIFACT_PATHS.sourceReview))
  } else if (selector === "--check-corrective-reviewed-ready-v3") {
    throw new TypeError("LEAN_CORRECTIVE_READINESS_V3_RETIRED")
  } else if (selector === "--render-corrective-manifest-v4") {
    process.stdout.write(`${JSON.stringify(renderLeanCorrectiveManifestV4(repoRoot, process.argv[3] ?? "HEAD"), null, 2)}\n`)
    return
  } else if (selector === "--check-corrective-manifest-v4") {
    checkLeanCorrectiveManifestV4(repoRoot, readJson(repoRoot, LEAN_CORRECTIVE_V4_ARTIFACT_PATHS.manifest))
  } else if (selector === "--check-corrective-source-review-v4") {
    const manifest = checkRecordedLeanCorrectiveManifestV4(repoRoot, readJson(repoRoot, LEAN_CORRECTIVE_V4_ARTIFACT_PATHS.manifest))
    checkLeanCorrectiveSourceReviewV4(manifest, readJson(repoRoot, LEAN_CORRECTIVE_V4_ARTIFACT_PATHS.sourceReview))
  } else if (selector === "--check-corrective-reviewed-ready-v4") {
    throw new TypeError("LEAN_CORRECTIVE_READINESS_V4_RETIRED")
  } else if (selector === "--render-corrective-manifest-v5") {
    process.stdout.write(`${JSON.stringify(renderLeanCorrectiveManifestV5(repoRoot, process.argv[3] ?? "HEAD"), null, 2)}\n`)
    return
  } else if (selector === "--check-corrective-manifest-v5") {
    checkLeanCorrectiveManifestV5(repoRoot, readJson(repoRoot, LEAN_CORRECTIVE_V5_ARTIFACT_PATHS.manifest))
  } else if (selector === "--check-corrective-source-review-v5") {
    const manifest = checkRecordedLeanCorrectiveManifestV5(repoRoot, readJson(repoRoot, LEAN_CORRECTIVE_V5_ARTIFACT_PATHS.manifest))
    checkLeanCorrectiveSourceReviewV5(manifest, readJson(repoRoot, LEAN_CORRECTIVE_V5_ARTIFACT_PATHS.sourceReview))
  } else if (selector === "--check-corrective-review-outcome-v5") {
    const manifest = checkRecordedLeanCorrectiveManifestV5(repoRoot, readJson(repoRoot, LEAN_CORRECTIVE_V5_ARTIFACT_PATHS.manifest))
    const readinessPresent = existsSync(path.resolve(repoRoot, LEAN_CORRECTIVE_V5_ARTIFACT_PATHS.readiness))
    checkLeanCorrectiveReviewOutcomeV5(manifest, readJson(repoRoot, LEAN_CORRECTIVE_V5_ARTIFACT_PATHS.sourceReview), readinessPresent ? readJson(repoRoot, LEAN_CORRECTIVE_V5_ARTIFACT_PATHS.readiness) : undefined)
  } else if (selector === "--check-corrective-reviewed-ready-v5") {
    throw new TypeError("LEAN_CORRECTIVE_READINESS_V5_RETIRED")
  } else if (selector === "--render-corrective-manifest-v6") {
    process.stdout.write(`${JSON.stringify(renderLeanCorrectiveManifestV6(repoRoot, process.argv[3] ?? "HEAD"), null, 2)}\n`)
    return
  } else if (selector === "--check-corrective-manifest-v6") {
    checkLeanCorrectiveManifestV6(repoRoot, readJson(repoRoot, LEAN_CORRECTIVE_V6_ARTIFACT_PATHS.manifest))
  } else if (selector === "--check-corrective-source-review-v6") {
    const manifest = checkRecordedLeanCorrectiveManifestV6(repoRoot, readJson(repoRoot, LEAN_CORRECTIVE_V6_ARTIFACT_PATHS.manifest))
    checkLeanCorrectiveSourceReviewV6(manifest, readJson(repoRoot, LEAN_CORRECTIVE_V6_ARTIFACT_PATHS.sourceReview))
  } else if (selector === "--check-corrective-review-outcome-v6") {
    const manifest = checkRecordedLeanCorrectiveManifestV6(repoRoot, readJson(repoRoot, LEAN_CORRECTIVE_V6_ARTIFACT_PATHS.manifest))
    const readinessPresent = existsSync(path.resolve(repoRoot, LEAN_CORRECTIVE_V6_ARTIFACT_PATHS.readiness))
    checkLeanCorrectiveReviewOutcomeV6(manifest, readJson(repoRoot, LEAN_CORRECTIVE_V6_ARTIFACT_PATHS.sourceReview), readinessPresent ? readJson(repoRoot, LEAN_CORRECTIVE_V6_ARTIFACT_PATHS.readiness) : undefined)
  } else if (selector === "--check-corrective-reviewed-ready-v6") {
    loadAndCheckLeanCorrectiveReady(repoRoot)
  } else if (selector === "--check-corrective-source-only-v6") {
    checkLeanCorrectiveSourceOnlyV6(repoRoot)
  } else if (selector === "--check-corrective-source-review") {
    checkLeanFirstEvidenceCustody(repoRoot)
    validateLeanDiagnosticCustody(readJson(repoRoot, LEAN_DIAGNOSTIC_CUSTODY_PATH))
    const manifest = checkLeanCorrectiveManifest(repoRoot, readJson(repoRoot, LEAN_CORRECTIVE_V1_ARTIFACT_PATHS.manifest))
    checkLeanCorrectiveSourceReview(manifest, readJson(repoRoot, LEAN_CORRECTIVE_V1_ARTIFACT_PATHS.sourceReview))
  } else if (selector === "--check-corrective-readiness") {
    throw new TypeError("LEAN_CORRECTIVE_V1_READINESS_RETIRED")
  } else if (selector === "--check-corrective-terminal-or-terminalized-invalid") {
    checkLeanCorrectiveTerminal(repoRoot)
  } else throw new TypeError("LEAN_CHECK_SELECTOR_INVALID")
  process.stdout.write(`${JSON.stringify({ ok: true, selector, liveInvocationCount: 0, authority: LEAN_AUTHORITY_FALSE })}\n`)
}
if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  try { main() } catch (error) { process.stderr.write(`${error instanceof Error ? error.message : "LEAN_CHECK_FAILED"}\n`); process.exitCode = 1 }
}
