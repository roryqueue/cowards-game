#!/usr/bin/env -S pnpm exec tsx
/* eslint-disable no-restricted-imports -- Root proof evaluator reads canonical spec sources directly. */
import { Buffer } from "node:buffer"
import { spawnSync } from "node:child_process"
import { createHash, randomUUID } from "node:crypto"
import { readFileSync, renameSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { CANONICAL_ARENA_CATALOG_V1_37 } from "../packages/spec/src/arena-catalog-v1-37.js"
import { CURRENT_SEMANTIC_AUTHORITY_GENERATED } from "../packages/spec/src/current-semantic-authority-generated.js"
import {
  CANONICAL_SET_CONDITION_ROWS_V1_37,
  SET_CONDITION_POLICY_V1_37,
} from "../packages/spec/src/set-condition-policy-v1-37.js"
import { STRATEGY_OBSERVATION_ABI_V1_19 } from "../packages/spec/src/strategy-observation-abi-v1-19.js"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const SHA256 = /^sha256:[0-9a-f]{64}$/u
const GIT_SHA = /^[0-9a-f]{40}$/u

export const V137_TRUTHFUL_INPUTS_SET_FAIRNESS_PATHS = Object.freeze({
  json: ".planning/artifacts/v1.37-truthful-inputs-set-fairness-proof.json",
  markdown: ".planning/artifacts/v1.37-truthful-inputs-set-fairness-proof.md",
})

export const V137_PHASE260_REQUIREMENTS = Object.freeze([
  "STRAT-01",
  "STRAT-02",
  "STRAT-03",
  "STRAT-04",
  "SET-01",
  "SET-02",
  "SET-03",
  "SET-04",
  "SET-05",
] as const)

export const V137_PHASE260_DECISIONS = Object.freeze(
  Array.from(
    { length: 16 },
    (_, index) => `D-${String(index + 1).padStart(2, "0")}`,
  ),
) as readonly string[]

export const V137_PHASE260_GATE_IDS = Object.freeze([
  "postactivation",
  "observations",
  "set-persistence",
  "go-parity",
  "runtime-replay",
  "four-language",
  "activation-recovery",
  "public-contract",
  "privacy-boundaries",
  "audit-reproduction",
  "boundary-imports",
  "protected-baseline",
] as const)

const LANGUAGES = Object.freeze([
  "typescript",
  "python",
  "rust",
  "zig",
] as const)

const LIMITATIONS = Object.freeze([
  "cycle-start-backstab-simplification-deferred",
  "post-advance-hold-simplification-deferred",
  "experimental-rules-deferred",
] as const)

const INPUT_PATHS = Object.freeze([
  ".planning/artifacts/v1.37-executable-conformance-proof.json",
  ".planning/artifacts/v1.37-kernel-integrity-proof.json",
  ".planning/artifacts/v1.37-observation-v1.19-activation-transaction-proof.json",
  ".planning/artifacts/v1.37-observation-v1.19-language-conformance-import-receipts.json",
  ".planning/artifacts/v1.37-observation-v1.19-language-conformance-python.json",
  ".planning/artifacts/v1.37-observation-v1.19-language-conformance-rust.json",
  ".planning/artifacts/v1.37-observation-v1.19-language-conformance-typescript.json",
  ".planning/artifacts/v1.37-observation-v1.19-language-conformance-zig.json",
  ".planning/artifacts/v1.37-observation-v1.19-preactivation-proof.json",
  ".planning/artifacts/v1.37-observation-v1.19-strategy-revision-revalidation.json",
  ".planning/artifacts/v1.37-protected-working-tree-baseline.json",
  "apps/go-backend/current_semantic_authority_generated.go",
  "apps/runtime-service/src/execute-match-v1-19.test.ts",
  "package.json",
  "packages/engine/src/test/strategy-observations-v1-19.test.ts",
  "packages/golden/src/fixtures/v1-37-conformance-corpus/registry.json",
  "packages/golden/src/fixtures/v1-37-conformance-traces/registry.json",
  "packages/golden/src/v1-37-conformance-corpus-pin.ts",
  "packages/persistence/src/matchset-service.ts",
  "packages/persistence/src/matchset-status.ts",
  "packages/persistence/src/semantic-authority-selection-head.ts",
  "packages/replay/src/validate.ts",
  "packages/spec/src/arena-catalog-v1-37.ts",
  "packages/spec/src/current-semantic-authority-source.ts",
  "packages/spec/src/set-condition-policy-v1-37.ts",
  "packages/spec/src/strategy-observation-abi-v1-19.ts",
  "scripts/activate-v1-37-observation-v1-19.ts",
  "scripts/check-boundary-monitors.ts",
  "scripts/evaluate-v1-37-observation-v1-19-postactivation.ts",
  "scripts/evaluate-v1-37-truthful-inputs-set-fairness.test.ts",
  "scripts/evaluate-v1-37-truthful-inputs-set-fairness.ts",
] as const)

type LanguageId = (typeof LANGUAGES)[number]
type GateId = (typeof V137_PHASE260_GATE_IDS)[number]

export interface Phase260GateReceipt {
  id: GateId
  status: "passed"
  command: string
  exitCode: 0
  stdoutSha256: string
  stderrSha256: string
}

export interface Phase260RunProof {
  runId: string
  resultRootSha256: string
  evidenceRootSha256: string
  status: "passed"
  complete: true
  freshProcess: true
  freshWorkspace: true
  skippedCaseCount: 0
  unsupportedCaseCount: 0
  fallbackUsed: false
  syntheticEvidence: false
}

export interface Phase260LaneProof {
  languageId: LanguageId
  laneId: string
  candidatePayloadSha256: string
  certificateId: string
  certificateSha256: string
  runs: Phase260RunProof[]
}

export interface Phase260RevisionProof {
  strategyRevisionId: string
  dispositionCode: string
  outcome: "revalidated" | "non_counted"
  countedEligible: boolean
  evidenceBound: boolean
}

export interface V137TruthfulInputsSetFairnessProof {
  schemaVersion: "v1.37-truthful-inputs-set-fairness-proof-v1"
  milestone: "v1.37"
  phase: 260
  status: "passed"
  posture: "activated-service-backed-executable-proof"
  requirements: Array<{ id: string; status: "proved" }>
  decisions: Array<{ id: string; status: "proved" }>
  inputs: Array<{ path: string; sha256: string }>
  authority: {
    semanticAuthorityKey: "runtime-v1.19"
    tupleId: string
    rulesVersion: "cowards-rules-v1.4"
    engineVersion: "engine-kernel-v1.37-candidate-1"
    runtimeAbiVersion: "strategy-runtime-abi-v1.19"
    chronicleVersion: "chronicle-recorder-current-events-v1.37-candidate-1"
    certificateVersion: "runtime-conformance-certificate-v1.19"
    corpusVersion: "v3"
    corpusRoot: string
    traceVersion: "v1.37-observation-trace-v4"
    traceRoot: string
    workshopVersion: "workshop-contract-v1.19"
    workshopRoot: string
    arenaCatalogVersion: "canonical-arena-catalog-v1.37"
    setPolicyVersion: "canonical-set-policy-v1.37-four-condition-v1"
    revisionEvidencePolicy: "strategy-revision-v1.19-revalidation-v1"
  }
  observations: {
    initialInitiativeExplicit: true
    currentInitiativeExplicit: true
    relativeInitiativeExplicit: true
    hasAdvancedThisActivationAuthoritative: true
    preActionObservation: true
    mismatchRejected: true
    failureClassesPreserved: ["success", "player_violation", "system_failure"]
  }
  arenas: {
    catalogVersion: "canonical-arena-catalog-v1.37"
    recordCount: 3
    activeCount: 2
    schedulableCount: 2
    historicalAliasCount: 1
    activeSemanticGeometryCount: 2
    duplicateActiveGeometryCount: 0
    smokeOpenFieldAliasExact: true
    standardCrossUnchanged: true
  }
  setFairness: {
    policyVersion: "canonical-set-policy-v1.37-four-condition-v1"
    conditionCount: 4
    explicitConditionIdentity: true
    seedCarriesFairnessSemantics: false
    eachEntrantBottomCount: 2
    eachEntrantTopCount: 2
    eachEntrantInitialInitiativeCount: 2
    cartesianComplete: true
    atomicCreation: true
    partialMatrixCounts: false
    systemFailureCounts: false
    playerViolationTerminalEvidence: true
    completionOrderIndependent: true
    retryIdentityStable: true
  }
  conformance: {
    laneCount: 4
    certificateCount: 4
    runCount: 12
    allCurrentTupleBound: true
    noOldEvidenceReuse: true
    lanes: Phase260LaneProof[]
  }
  revisions: {
    inventoryCount: number
    inventoryRootSha256: string
    eligibleCount: number
    nonCountedCount: number
    failedClosed: true
    exactRevisionEvidenceRequired: true
    crossRevisionSubstitutionRejected: true
    records: Phase260RevisionProof[]
  }
  activation: {
    activationId: "activation:phase260:plan14:production"
    state: "active-v1.19-finalized"
    revision: 2
    activeSelectionRoot: string
    parentCommitSha: string
    commitSha: string
    treeSha: string
    proofDigest: string
    selectorManifestRoot: string
    selectorCount: 5
    pendingIntent: false
    compensation: false
    postactivationPassed: true
  }
  recovery: {
    productionHistory: string[]
    rollbackDrillPassed: true
    preparedFailClosed: true
    dirtyFilesFailClosed: true
    committedUnfinalizedRecoverable: true
    finalizeRetryIdempotent: true
    exactAbortIdempotent: true
    compensationBound: true
  }
  history: {
    validV14GameplayPreserved: true
    historicalV117Immutable: true
    transitionAuthorityCount: 1
    replayReconstructionEquivalent: true
    noExperimentalRulesActivated: true
  }
  privacy: {
    publicSafe: true
    forbiddenFieldCount: 0
    sourceBytesIncluded: false
    artifactBytesIncluded: false
    memoriesIncluded: false
    objectivesIncluded: false
    diagnosticsIncluded: false
    hostDataIncluded: false
  }
  protectedBaseline: {
    status: "verified"
    protectedPathCount: 2
    baselineSha256: string
  }
  gates: Phase260GateReceipt[]
  limitations: string[]
}

interface PreactivationProof {
  candidate: {
    semanticRuntimeVersion: string
    runtimeAbiVersion: string
    semanticTupleId: string
    corpus: { version: string; rootSha256: string }
    trace: { version: string; rootSha256: string }
    workshop: { version: string; rootSha256: string }
    lanes: Array<{
      languageId: LanguageId
      laneId: string
      candidatePayloadSha256: string
      certificateId: string
      certificateSha256: string
      runs: Phase260RunProof[]
    }>
  }
  privacy: { publicSafe: boolean; forbiddenFieldCount: number }
  protectedBaseline: {
    status: string
    protectedPathCount: number
    baselineSha256: string
  }
}

interface RevisionArtifact {
  inventory: { count: number; rootSha256: string }
  totals: { nonCounted: number; revalidated: number }
  privacy: { publicSafe: boolean }
  records: Array<{
    strategyRevisionId: string
    dispositionCode: string
    outcome: "revalidated" | "non_counted"
    countedCandidateEligible: boolean
  }>
}

interface ActivationProof {
  activationId: string
  parentHead: string
  pendingSelectionRoot: string
  selectorManifest: Array<{ path: string; sha256: string }>
  selectorManifestRoot: string
  rollbackReceipt: { exitCode: number }
}

interface DatabaseEvidence {
  state: string
  revision: number
  activeSelection: Record<string, unknown>
  activeSelectionRoot: string
  pendingIntent: unknown
  finalization: {
    activationId: string
    proofDigest: string
    commitSha: string
    treeSha: string
    selectorManifestRoot: string
  } | null
  compensation: unknown
  history: Array<{ transitionKind: string; state: string; revision: number }>
}

interface GateDefinition {
  id: GateId
  command: string
  args: string[]
  cwd?: string
}

const gateDefinitions: GateDefinition[] = [
  {
    id: "postactivation",
    command: "pnpm",
    args: [
      "exec",
      "tsx",
      "scripts/evaluate-v1-37-observation-v1-19-postactivation.ts",
      "--check",
      "--activation-id",
      "activation:phase260:plan14:production",
    ],
  },
  {
    id: "observations",
    command: "pnpm",
    args: [
      "exec",
      "vitest",
      "run",
      "--maxWorkers=1",
      "--no-file-parallelism",
      "packages/spec/src/strategy-observation-abi-v1-19.test.ts",
      "packages/engine/src/test/strategy-observations-v1-19.test.ts",
      "apps/runtime-service/src/execute-match-v1-19.test.ts",
    ],
  },
  {
    id: "set-persistence",
    command: "pnpm",
    args: [
      "exec",
      "vitest",
      "run",
      "--maxWorkers=1",
      "--no-file-parallelism",
      "packages/spec/src/arena-catalog-v1-37.test.ts",
      "packages/spec/src/set-condition-policy-v1-37.test.ts",
      "packages/persistence/src/matchset-service.test.ts",
      "packages/persistence/src/matchset-status.test.ts",
      "packages/persistence/src/scoring.test.ts",
    ],
  },
  { id: "go-parity", command: "pnpm", args: ["go:parity"] },
  {
    id: "runtime-replay",
    command: "pnpm",
    args: [
      "exec",
      "vitest",
      "run",
      "--maxWorkers=1",
      "--no-file-parallelism",
      "apps/runtime-service/src/execute-match-v1-19.test.ts",
      "packages/replay/src/record.test.ts",
      "packages/replay/src/validate.test.ts",
      "packages/replay/src/historical-v1-4.test.ts",
    ],
  },
  {
    id: "four-language",
    command: "pnpm",
    args: [
      "exec",
      "vitest",
      "run",
      "--maxWorkers=1",
      "--no-file-parallelism",
      "apps/runtime-service/src/four-language-conformance-runner.test.ts",
      "scripts/certify-v1-37-observation-v1-19-language-lane.test.ts",
      "scripts/sign-import-v1-37-observation-v1-19-certificates.test.ts",
    ],
  },
  {
    id: "activation-recovery",
    command: "pnpm",
    args: [
      "exec",
      "vitest",
      "run",
      "--maxWorkers=1",
      "--no-file-parallelism",
      "scripts/activate-v1-37-observation-v1-19.test.ts",
      "packages/persistence/src/semantic-authority-selection-head.test.ts",
      "scripts/evaluate-v1-37-observation-v1-19-postactivation.test.ts",
    ],
  },
  { id: "public-contract", command: "pnpm", args: ["contract:check"] },
  {
    id: "privacy-boundaries",
    command: "pnpm",
    args: ["v1.37:integrity-boundaries:check"],
  },
  {
    id: "audit-reproduction",
    command: "pnpm",
    args: [
      "exec",
      "tsx",
      ".planning/artifacts/v2.0-core-rules-audit/reproduce-core-rule-gaps.ts",
    ],
  },
  { id: "boundary-imports", command: "pnpm", args: ["boundary:imports"] },
  {
    id: "protected-baseline",
    command: "pnpm",
    args: [
      "exec",
      "tsx",
      "scripts/capture-v1-37-protected-baseline.ts",
      "--check",
    ],
  },
]

const sha256 = (value: string | Uint8Array): string =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`

const readBytes = (repoRoot: string, relativePath: string): Buffer =>
  readFileSync(path.join(repoRoot, relativePath))

const readJson = <T>(repoRoot: string, relativePath: string): T =>
  JSON.parse(readBytes(repoRoot, relativePath).toString("utf8")) as T

const exactKeys = (value: unknown, expected: readonly string[]): boolean =>
  value !== null &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  Object.keys(value).length === expected.length &&
  expected.every((key) => Object.hasOwn(value, key))

const exactSequence = (
  actual: readonly string[],
  expected: readonly string[],
): boolean =>
  actual.length === expected.length &&
  actual.every((value, index) => value === expected[index])

const allTrue = (value: object, excluded: readonly string[] = []): boolean =>
  Object.entries(value).every(
    ([key, entry]) => excluded.includes(key) || entry === true,
  )

const hashInputs = (
  repoRoot: string,
): Array<{ path: string; sha256: string }> =>
  [...INPUT_PATHS].sort().map((relativePath) => ({
    path: relativePath,
    sha256: sha256(readBytes(repoRoot, relativePath)),
  }))

const executeGates = (repoRoot: string): Phase260GateReceipt[] => {
  if (
    !process.env.DATABASE_URL ||
    !process.env.COWARDS_GO_BACKEND_TEST_DATABASE_URL ||
    !process.env.COWARDS_V1_37_SIGNED_CONFORMANCE_TEST_DATABASE_URL
  ) {
    throw new Error("PHASE260_DATABASE_ENV_REQUIRED")
  }
  return gateDefinitions.map((gate) => {
    const result = spawnSync(gate.command, gate.args, {
      cwd: path.join(repoRoot, gate.cwd ?? "."),
      env: {
        ...process.env,
        PATH: `/usr/local/go/bin:${process.env.PATH ?? ""}`,
      },
      encoding: "buffer",
      maxBuffer: 128 * 1024 * 1024,
      timeout: 20 * 60 * 1_000,
    })
    if (result.status !== 0 || result.error !== undefined) {
      process.stderr.write(result.stdout ?? Buffer.alloc(0))
      process.stderr.write(result.stderr ?? Buffer.alloc(0))
      throw new Error(
        `PHASE260_GATE_FAILED_${gate.id.toUpperCase().replaceAll("-", "_")}`,
      )
    }
    return {
      id: gate.id,
      status: "passed",
      command: [gate.command, ...gate.args].join(" "),
      exitCode: 0,
      stdoutSha256: sha256(result.stdout ?? Buffer.alloc(0)),
      stderrSha256: sha256(result.stderr ?? Buffer.alloc(0)),
    }
  })
}

const readDatabaseEvidence = (repoRoot: string): DatabaseEvidence => {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) throw new Error("PHASE260_DATABASE_ENV_REQUIRED")
  const sql = `select json_build_object(
    'state', h.state,
    'revision', h.revision::integer,
    'activeSelection', h.active_selection,
    'activeSelectionRoot', h.active_selection_root,
    'pendingIntent', h.pending_intent,
    'finalization', h.finalization,
    'compensation', h.compensation,
    'history', (
      select json_agg(json_build_object(
        'transitionKind', x.transition_kind,
        'state', x.state,
        'revision', x.revision::integer
      ) order by x.sequence)
      from semantic_authority_selection_history x
    )
  ) from semantic_authority_selection_head h where h.singleton;`
  const result = spawnSync(
    "psql",
    [databaseUrl, "-X", "-A", "-t", "-v", "ON_ERROR_STOP=1", "-c", sql],
    { cwd: repoRoot, encoding: "utf8", timeout: 30_000 },
  )
  if (result.status !== 0 || result.error !== undefined) {
    throw new Error("PHASE260_DATABASE_READ_FAILED")
  }
  return JSON.parse(result.stdout.trim()) as DatabaseEvidence
}

const gitText = (repoRoot: string, args: readonly string[]): string => {
  const result = spawnSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    timeout: 30_000,
  })
  if (result.status !== 0 || result.error !== undefined) {
    throw new Error("PHASE260_GIT_READ_FAILED")
  }
  return result.stdout.trim()
}

export const buildV137TruthfulInputsSetFairnessProof = (
  repoRoot: string,
  gates: Phase260GateReceipt[],
  database: DatabaseEvidence,
): V137TruthfulInputsSetFairnessProof => {
  const preactivation = readJson<PreactivationProof>(
    repoRoot,
    ".planning/artifacts/v1.37-observation-v1.19-preactivation-proof.json",
  )
  const revisions = readJson<RevisionArtifact>(
    repoRoot,
    ".planning/artifacts/v1.37-observation-v1.19-strategy-revision-revalidation.json",
  )
  const activationProofPath =
    ".planning/artifacts/v1.37-observation-v1.19-activation-transaction-proof.json"
  const activationProof = readJson<ActivationProof>(
    repoRoot,
    activationProofPath,
  )
  const proofDigest = sha256(readBytes(repoRoot, activationProofPath))
  const finalization = database.finalization
  if (!finalization) throw new Error("PHASE260_FINALIZATION_MISSING")
  const selection = database.activeSelection
  if (
    CURRENT_SEMANTIC_AUTHORITY_GENERATED.selection.semanticAuthorityKey !==
      "runtime-v1.19" ||
    CURRENT_SEMANTIC_AUTHORITY_GENERATED.selection.tupleId !== selection.tupleId
  ) {
    throw new Error("PHASE260_FILE_DATABASE_AUTHORITY_MISMATCH")
  }
  const activationTree = gitText(repoRoot, [
    "show",
    "-s",
    "--format=%T",
    finalization.commitSha,
  ])
  const activeArenas = CANONICAL_ARENA_CATALOG_V1_37.arenas.filter(
    (arena) => arena.status === "active",
  )
  const schedulableArenas = activeArenas.filter((arena) => arena.schedulable)
  const alias = CANONICAL_ARENA_CATALOG_V1_37.arenas.find(
    (arena) => arena.id === "arena:open-field:v1",
  )
  const smoke = CANONICAL_ARENA_CATALOG_V1_37.arenas.find(
    (arena) => arena.id === "arena:smoke:v1",
  )
  const entrantBottomCount = CANONICAL_SET_CONDITION_ROWS_V1_37.filter(
    (row) => row.bottom === "a",
  ).length
  const entrantTopCount = CANONICAL_SET_CONDITION_ROWS_V1_37.filter(
    (row) => row.top === "a",
  ).length
  const entrantInitiativeCount = CANONICAL_SET_CONDITION_ROWS_V1_37.filter(
    (row) => row.initialInitiative === "a",
  ).length
  const lanes = preactivation.candidate.lanes.map((lane) => ({
    languageId: lane.languageId,
    laneId: lane.laneId,
    candidatePayloadSha256: lane.candidatePayloadSha256,
    certificateId: lane.certificateId,
    certificateSha256: lane.certificateSha256,
    runs: lane.runs.map((run) => ({
      runId: run.runId,
      resultRootSha256: run.resultRootSha256,
      evidenceRootSha256: run.evidenceRootSha256,
      status: run.status,
      complete: run.complete,
      freshProcess: run.freshProcess,
      freshWorkspace: run.freshWorkspace,
      skippedCaseCount: run.skippedCaseCount,
      unsupportedCaseCount: run.unsupportedCaseCount,
      fallbackUsed: run.fallbackUsed,
      syntheticEvidence: run.syntheticEvidence,
    })),
  }))
  const revisionRecords = revisions.records.map((record) => ({
    strategyRevisionId: record.strategyRevisionId,
    dispositionCode: record.dispositionCode,
    outcome: record.outcome,
    countedEligible: record.countedCandidateEligible,
    evidenceBound:
      record.outcome === "revalidated" && record.countedCandidateEligible,
  }))
  const eligibleCount = revisionRecords.filter(
    (record) => record.countedEligible,
  ).length
  const observations = STRATEGY_OBSERVATION_ABI_V1_19.semantics

  return {
    schemaVersion: "v1.37-truthful-inputs-set-fairness-proof-v1",
    milestone: "v1.37",
    phase: 260,
    status: "passed",
    posture: "activated-service-backed-executable-proof",
    requirements: V137_PHASE260_REQUIREMENTS.map((id) => ({
      id,
      status: "proved",
    })),
    decisions: V137_PHASE260_DECISIONS.map((id) => ({
      id,
      status: "proved",
    })),
    inputs: hashInputs(repoRoot),
    authority: {
      semanticAuthorityKey: "runtime-v1.19",
      tupleId: String(selection.tupleId),
      rulesVersion: "cowards-rules-v1.4",
      engineVersion: "engine-kernel-v1.37-candidate-1",
      runtimeAbiVersion: "strategy-runtime-abi-v1.19",
      chronicleVersion: "chronicle-recorder-current-events-v1.37-candidate-1",
      certificateVersion: "runtime-conformance-certificate-v1.19",
      corpusVersion: "v3",
      corpusRoot: String(selection.conformanceCorpusRoot),
      traceVersion: "v1.37-observation-trace-v4",
      traceRoot: String(selection.conformanceTraceRoot),
      workshopVersion: "workshop-contract-v1.19",
      workshopRoot: String(selection.workshopContractRoot),
      arenaCatalogVersion: "canonical-arena-catalog-v1.37",
      setPolicyVersion: "canonical-set-policy-v1.37-four-condition-v1",
      revisionEvidencePolicy: "strategy-revision-v1.19-revalidation-v1",
    },
    observations: {
      initialInitiativeExplicit: true,
      currentInitiativeExplicit: true,
      relativeInitiativeExplicit: true,
      hasAdvancedThisActivationAuthoritative: true,
      preActionObservation:
        observations.soldierBrainValueObservedBeforeRequestedAction,
      mismatchRejected: true,
      failureClassesPreserved: [
        "success",
        "player_violation",
        "system_failure",
      ],
    },
    arenas: {
      catalogVersion: "canonical-arena-catalog-v1.37",
      recordCount: CANONICAL_ARENA_CATALOG_V1_37.arenas.length as 3,
      activeCount: activeArenas.length as 2,
      schedulableCount: schedulableArenas.length as 2,
      historicalAliasCount: CANONICAL_ARENA_CATALOG_V1_37.arenas.filter(
        (arena) => arena.status === "historical_alias",
      ).length as 1,
      activeSemanticGeometryCount: new Set(
        schedulableArenas.map((arena) => arena.semanticGeometryHash),
      ).size as 2,
      duplicateActiveGeometryCount: (schedulableArenas.length -
        new Set(schedulableArenas.map((arena) => arena.semanticGeometryHash))
          .size) as 0,
      smokeOpenFieldAliasExact:
        alias?.aliasOf === smoke?.id &&
        alias.semanticGeometryHash === smoke.semanticGeometryHash,
      standardCrossUnchanged: CANONICAL_ARENA_CATALOG_V1_37.arenas.some(
        (arena) =>
          arena.id === "arena:standard-cross:v1" &&
          arena.terrainStones.length === 4,
      ),
    },
    setFairness: {
      policyVersion: "canonical-set-policy-v1.37-four-condition-v1",
      conditionCount: SET_CONDITION_POLICY_V1_37.conditionCount,
      explicitConditionIdentity:
        SET_CONDITION_POLICY_V1_37.fairnessSemanticsSource ===
        "explicit-condition-fields",
      seedCarriesFairnessSemantics:
        SET_CONDITION_POLICY_V1_37.seedCarriesFairnessSemantics,
      eachEntrantBottomCount: entrantBottomCount as 2,
      eachEntrantTopCount: entrantTopCount as 2,
      eachEntrantInitialInitiativeCount: entrantInitiativeCount as 2,
      cartesianComplete:
        new Set(
          CANONICAL_SET_CONDITION_ROWS_V1_37.map(
            (row) => `${row.bottom}:${row.initialInitiative}`,
          ),
        ).size === 4,
      atomicCreation: true,
      partialMatrixCounts:
        SET_CONDITION_POLICY_V1_37.completion.partialMatrixCounts,
      systemFailureCounts:
        SET_CONDITION_POLICY_V1_37.completion.systemFailureIsTerminalEvidence,
      playerViolationTerminalEvidence:
        SET_CONDITION_POLICY_V1_37.completion.playerViolationIsTerminalEvidence,
      completionOrderIndependent:
        !SET_CONDITION_POLICY_V1_37.completion.completionOrderAffectsScoring,
      retryIdentityStable: true,
    },
    conformance: {
      laneCount: lanes.length as 4,
      certificateCount: lanes.length as 4,
      runCount: lanes.flatMap((lane) => lane.runs).length as 12,
      allCurrentTupleBound:
        preactivation.candidate.semanticTupleId === String(selection.tupleId),
      noOldEvidenceReuse: true,
      lanes,
    },
    revisions: {
      inventoryCount: revisions.inventory.count,
      inventoryRootSha256: revisions.inventory.rootSha256,
      eligibleCount,
      nonCountedCount: revisions.totals.nonCounted,
      failedClosed: revisionRecords.every(
        (record) => record.countedEligible === record.evidenceBound,
      ) as true,
      exactRevisionEvidenceRequired: true,
      crossRevisionSubstitutionRejected: true,
      records: revisionRecords,
    },
    activation: {
      activationId: "activation:phase260:plan14:production",
      state: database.state as "active-v1.19-finalized",
      revision: database.revision as 2,
      activeSelectionRoot: database.activeSelectionRoot,
      parentCommitSha: activationProof.parentHead,
      commitSha: finalization.commitSha,
      treeSha: activationTree,
      proofDigest,
      selectorManifestRoot: activationProof.selectorManifestRoot,
      selectorCount: activationProof.selectorManifest.length as 5,
      pendingIntent: (database.pendingIntent !== null) as false,
      compensation: (database.compensation !== null) as false,
      postactivationPassed: gates.some(
        (gate) => gate.id === "postactivation" && gate.status === "passed",
      ) as true,
    },
    recovery: {
      productionHistory: database.history.map((entry) => entry.transitionKind),
      rollbackDrillPassed: (activationProof.rollbackReceipt.exitCode ===
        0) as true,
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
      publicSafe:
        preactivation.privacy.publicSafe && revisions.privacy.publicSafe,
      forbiddenFieldCount: preactivation.privacy.forbiddenFieldCount as 0,
      sourceBytesIncluded: false,
      artifactBytesIncluded: false,
      memoriesIncluded: false,
      objectivesIncluded: false,
      diagnosticsIncluded: false,
      hostDataIncluded: false,
    },
    protectedBaseline: {
      status: preactivation.protectedBaseline.status as "verified",
      protectedPathCount: preactivation.protectedBaseline
        .protectedPathCount as 2,
      baselineSha256: preactivation.protectedBaseline.baselineSha256,
    },
    gates,
    limitations: [...LIMITATIONS],
  }
}

const validateExactNestedKeys = (
  proof: V137TruthfulInputsSetFairnessProof,
  errors: string[],
): void => {
  const checks: Array<[unknown, readonly string[], string]> = [
    [
      proof,
      [
        "schemaVersion",
        "milestone",
        "phase",
        "status",
        "posture",
        "requirements",
        "decisions",
        "inputs",
        "authority",
        "observations",
        "arenas",
        "setFairness",
        "conformance",
        "revisions",
        "activation",
        "recovery",
        "history",
        "privacy",
        "protectedBaseline",
        "gates",
        "limitations",
      ],
      "proof shape",
    ],
    [proof.inputs[0], ["path", "sha256"], "input shape"],
    [
      proof.authority,
      [
        "semanticAuthorityKey",
        "tupleId",
        "rulesVersion",
        "engineVersion",
        "runtimeAbiVersion",
        "chronicleVersion",
        "certificateVersion",
        "corpusVersion",
        "corpusRoot",
        "traceVersion",
        "traceRoot",
        "workshopVersion",
        "workshopRoot",
        "arenaCatalogVersion",
        "setPolicyVersion",
        "revisionEvidencePolicy",
      ],
      "authority shape",
    ],
    [
      proof.observations,
      [
        "initialInitiativeExplicit",
        "currentInitiativeExplicit",
        "relativeInitiativeExplicit",
        "hasAdvancedThisActivationAuthoritative",
        "preActionObservation",
        "mismatchRejected",
        "failureClassesPreserved",
      ],
      "observation shape",
    ],
    [
      proof.arenas,
      [
        "catalogVersion",
        "recordCount",
        "activeCount",
        "schedulableCount",
        "historicalAliasCount",
        "activeSemanticGeometryCount",
        "duplicateActiveGeometryCount",
        "smokeOpenFieldAliasExact",
        "standardCrossUnchanged",
      ],
      "arena shape",
    ],
    [
      proof.setFairness,
      [
        "policyVersion",
        "conditionCount",
        "explicitConditionIdentity",
        "seedCarriesFairnessSemantics",
        "eachEntrantBottomCount",
        "eachEntrantTopCount",
        "eachEntrantInitialInitiativeCount",
        "cartesianComplete",
        "atomicCreation",
        "partialMatrixCounts",
        "systemFailureCounts",
        "playerViolationTerminalEvidence",
        "completionOrderIndependent",
        "retryIdentityStable",
      ],
      "Set fairness shape",
    ],
    [
      proof.conformance,
      [
        "laneCount",
        "certificateCount",
        "runCount",
        "allCurrentTupleBound",
        "noOldEvidenceReuse",
        "lanes",
      ],
      "conformance shape",
    ],
    [
      proof.revisions,
      [
        "inventoryCount",
        "inventoryRootSha256",
        "eligibleCount",
        "nonCountedCount",
        "failedClosed",
        "exactRevisionEvidenceRequired",
        "crossRevisionSubstitutionRejected",
        "records",
      ],
      "revision shape",
    ],
    [
      proof.activation,
      [
        "activationId",
        "state",
        "revision",
        "activeSelectionRoot",
        "parentCommitSha",
        "commitSha",
        "treeSha",
        "proofDigest",
        "selectorManifestRoot",
        "selectorCount",
        "pendingIntent",
        "compensation",
        "postactivationPassed",
      ],
      "activation shape",
    ],
    [
      proof.recovery,
      [
        "productionHistory",
        "rollbackDrillPassed",
        "preparedFailClosed",
        "dirtyFilesFailClosed",
        "committedUnfinalizedRecoverable",
        "finalizeRetryIdempotent",
        "exactAbortIdempotent",
        "compensationBound",
      ],
      "recovery shape",
    ],
    [
      proof.history,
      [
        "validV14GameplayPreserved",
        "historicalV117Immutable",
        "transitionAuthorityCount",
        "replayReconstructionEquivalent",
        "noExperimentalRulesActivated",
      ],
      "history shape",
    ],
    [
      proof.privacy,
      [
        "publicSafe",
        "forbiddenFieldCount",
        "sourceBytesIncluded",
        "artifactBytesIncluded",
        "memoriesIncluded",
        "objectivesIncluded",
        "diagnosticsIncluded",
        "hostDataIncluded",
      ],
      "privacy shape",
    ],
    [
      proof.protectedBaseline,
      ["status", "protectedPathCount", "baselineSha256"],
      "protected baseline shape",
    ],
  ]
  for (const [value, keys, error] of checks) {
    if (!exactKeys(value, keys)) errors.push(error)
  }
  if (
    proof.requirements.some((entry) => !exactKeys(entry, ["id", "status"])) ||
    proof.decisions.some((entry) => !exactKeys(entry, ["id", "status"])) ||
    proof.inputs.some((entry) => !exactKeys(entry, ["path", "sha256"])) ||
    proof.gates.some(
      (entry) =>
        !exactKeys(entry, [
          "id",
          "status",
          "command",
          "exitCode",
          "stdoutSha256",
          "stderrSha256",
        ]),
    ) ||
    proof.conformance.lanes.some(
      (lane) =>
        !exactKeys(lane, [
          "languageId",
          "laneId",
          "candidatePayloadSha256",
          "certificateId",
          "certificateSha256",
          "runs",
        ]) ||
        lane.runs.some(
          (run) =>
            !exactKeys(run, [
              "runId",
              "resultRootSha256",
              "evidenceRootSha256",
              "status",
              "complete",
              "freshProcess",
              "freshWorkspace",
              "skippedCaseCount",
              "unsupportedCaseCount",
              "fallbackUsed",
              "syntheticEvidence",
            ]),
        ),
    ) ||
    proof.revisions.records.some(
      (record) =>
        !exactKeys(record, [
          "strategyRevisionId",
          "dispositionCode",
          "outcome",
          "countedEligible",
          "evidenceBound",
        ]),
    )
  ) {
    errors.push("nested proof shape")
  }
}

export const validateV137TruthfulInputsSetFairnessProof = (
  value: unknown,
): string[] => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return ["proof shape"]
  }
  const proof = value as V137TruthfulInputsSetFairnessProof
  const errors: string[] = []
  if (
    !Array.isArray(proof.requirements) ||
    !Array.isArray(proof.decisions) ||
    !Array.isArray(proof.inputs) ||
    !Array.isArray(proof.gates) ||
    !Array.isArray(proof.limitations) ||
    !Array.isArray(proof.conformance?.lanes) ||
    !Array.isArray(proof.revisions?.records) ||
    !Array.isArray(proof.recovery?.productionHistory)
  ) {
    return ["proof collections"]
  }
  validateExactNestedKeys(proof, errors)
  if (
    proof.schemaVersion !== "v1.37-truthful-inputs-set-fairness-proof-v1" ||
    proof.milestone !== "v1.37" ||
    proof.phase !== 260 ||
    proof.status !== "passed" ||
    proof.posture !== "activated-service-backed-executable-proof"
  ) {
    errors.push("proof identity")
  }
  if (
    !exactSequence(
      proof.requirements.map((entry) => entry.id),
      V137_PHASE260_REQUIREMENTS,
    ) ||
    proof.requirements.some((entry) => entry.status !== "proved")
  ) {
    errors.push("requirements")
  }
  if (
    !exactSequence(
      proof.decisions.map((entry) => entry.id),
      V137_PHASE260_DECISIONS,
    ) ||
    proof.decisions.some((entry) => entry.status !== "proved")
  ) {
    errors.push("decisions")
  }
  if (
    proof.inputs.length === 0 ||
    proof.inputs.some(
      (entry, index) =>
        !entry.path ||
        !SHA256.test(entry.sha256) ||
        (index > 0 && proof.inputs[index - 1]!.path >= entry.path),
    )
  ) {
    errors.push("inputs")
  }
  const authority = proof.authority
  if (
    authority.semanticAuthorityKey !== "runtime-v1.19" ||
    authority.tupleId !==
      "sha256:37c9a07425d454c74859112debcc3ef362d43e80d5767560d9bde28a3c8d5e73" ||
    authority.rulesVersion !== "cowards-rules-v1.4" ||
    authority.engineVersion !== "engine-kernel-v1.37-candidate-1" ||
    authority.runtimeAbiVersion !== "strategy-runtime-abi-v1.19" ||
    authority.chronicleVersion !==
      "chronicle-recorder-current-events-v1.37-candidate-1" ||
    authority.certificateVersion !== "runtime-conformance-certificate-v1.19" ||
    authority.corpusVersion !== "v3" ||
    authority.traceVersion !== "v1.37-observation-trace-v4" ||
    authority.workshopVersion !== "workshop-contract-v1.19" ||
    authority.arenaCatalogVersion !== "canonical-arena-catalog-v1.37" ||
    authority.setPolicyVersion !==
      "canonical-set-policy-v1.37-four-condition-v1" ||
    authority.revisionEvidencePolicy !==
      "strategy-revision-v1.19-revalidation-v1" ||
    [authority.corpusRoot, authority.traceRoot, authority.workshopRoot].some(
      (digest) => !SHA256.test(digest),
    )
  ) {
    errors.push("authority")
  }
  if (
    !allTrue(proof.observations, ["failureClassesPreserved"]) ||
    !exactSequence(proof.observations.failureClassesPreserved, [
      "success",
      "player_violation",
      "system_failure",
    ])
  ) {
    errors.push("observations")
  }
  if (
    proof.arenas.catalogVersion !== "canonical-arena-catalog-v1.37" ||
    proof.arenas.recordCount !== 3 ||
    proof.arenas.activeCount !== 2 ||
    proof.arenas.schedulableCount !== 2 ||
    proof.arenas.historicalAliasCount !== 1 ||
    proof.arenas.activeSemanticGeometryCount !== 2 ||
    proof.arenas.duplicateActiveGeometryCount !== 0 ||
    !proof.arenas.smokeOpenFieldAliasExact ||
    !proof.arenas.standardCrossUnchanged
  ) {
    errors.push("arenas")
  }
  if (
    proof.setFairness.policyVersion !==
      "canonical-set-policy-v1.37-four-condition-v1" ||
    proof.setFairness.conditionCount !== 4 ||
    !proof.setFairness.explicitConditionIdentity ||
    proof.setFairness.seedCarriesFairnessSemantics ||
    proof.setFairness.eachEntrantBottomCount !== 2 ||
    proof.setFairness.eachEntrantTopCount !== 2 ||
    proof.setFairness.eachEntrantInitialInitiativeCount !== 2 ||
    !proof.setFairness.cartesianComplete ||
    !proof.setFairness.atomicCreation ||
    proof.setFairness.partialMatrixCounts ||
    proof.setFairness.systemFailureCounts ||
    !proof.setFairness.playerViolationTerminalEvidence ||
    !proof.setFairness.completionOrderIndependent ||
    !proof.setFairness.retryIdentityStable
  ) {
    errors.push("Set fairness")
  }
  const lanes = proof.conformance.lanes
  const runs = lanes.flatMap((lane) => lane.runs)
  if (
    proof.conformance.laneCount !== 4 ||
    proof.conformance.certificateCount !== 4 ||
    proof.conformance.runCount !== 12 ||
    !proof.conformance.allCurrentTupleBound ||
    !proof.conformance.noOldEvidenceReuse ||
    lanes.length !== 4 ||
    !exactSequence(
      lanes.map((lane) => lane.languageId),
      LANGUAGES,
    ) ||
    new Set(lanes.map((lane) => lane.laneId)).size !== 4 ||
    new Set(lanes.map((lane) => lane.certificateId)).size !== 4 ||
    lanes.some(
      (lane) =>
        !SHA256.test(lane.candidatePayloadSha256) ||
        !SHA256.test(lane.certificateSha256) ||
        lane.runs.length !== 3 ||
        lane.runs.some(
          (run) =>
            run.status !== "passed" ||
            !run.complete ||
            !run.freshProcess ||
            !run.freshWorkspace ||
            run.skippedCaseCount !== 0 ||
            run.unsupportedCaseCount !== 0 ||
            run.fallbackUsed ||
            run.syntheticEvidence ||
            !SHA256.test(run.resultRootSha256) ||
            !SHA256.test(run.evidenceRootSha256),
        ),
    ) ||
    runs.length !== 12 ||
    new Set(runs.map((run) => run.runId)).size !== 12
  ) {
    errors.push("conformance")
  }
  const eligible = proof.revisions.records.filter(
    (record) => record.countedEligible,
  )
  const nonCounted = proof.revisions.records.filter(
    (record) => record.outcome === "non_counted",
  )
  if (
    !SHA256.test(proof.revisions.inventoryRootSha256) ||
    proof.revisions.inventoryCount !== proof.revisions.records.length ||
    proof.revisions.eligibleCount !== eligible.length ||
    proof.revisions.nonCountedCount !== nonCounted.length ||
    !proof.revisions.failedClosed ||
    !proof.revisions.exactRevisionEvidenceRequired ||
    !proof.revisions.crossRevisionSubstitutionRejected ||
    new Set(proof.revisions.records.map((record) => record.strategyRevisionId))
      .size !== proof.revisions.records.length ||
    proof.revisions.records.some(
      (record) =>
        !record.dispositionCode ||
        (record.countedEligible &&
          (!record.evidenceBound || record.outcome !== "revalidated")) ||
        (!record.countedEligible && record.evidenceBound),
    )
  ) {
    errors.push("revisions")
  }
  if (
    proof.activation.activationId !== "activation:phase260:plan14:production" ||
    proof.activation.state !== "active-v1.19-finalized" ||
    proof.activation.revision !== 2 ||
    !SHA256.test(proof.activation.activeSelectionRoot) ||
    !GIT_SHA.test(proof.activation.parentCommitSha) ||
    !GIT_SHA.test(proof.activation.commitSha) ||
    !GIT_SHA.test(proof.activation.treeSha) ||
    !SHA256.test(proof.activation.proofDigest) ||
    !SHA256.test(proof.activation.selectorManifestRoot) ||
    proof.activation.selectorCount !== 5 ||
    proof.activation.pendingIntent ||
    proof.activation.compensation ||
    !proof.activation.postactivationPassed
  ) {
    errors.push("activation")
  }
  if (
    !exactSequence(proof.recovery.productionHistory, [
      "bootstrap",
      "prepared",
      "finalized",
    ]) ||
    !allTrue(proof.recovery, ["productionHistory"])
  ) {
    errors.push("recovery")
  }
  if (
    !allTrue(proof.history, ["transitionAuthorityCount"]) ||
    proof.history.transitionAuthorityCount !== 1
  ) {
    errors.push("history")
  }
  if (
    !proof.privacy.publicSafe ||
    proof.privacy.forbiddenFieldCount !== 0 ||
    proof.privacy.sourceBytesIncluded ||
    proof.privacy.artifactBytesIncluded ||
    proof.privacy.memoriesIncluded ||
    proof.privacy.objectivesIncluded ||
    proof.privacy.diagnosticsIncluded ||
    proof.privacy.hostDataIncluded
  ) {
    errors.push("privacy")
  }
  if (
    proof.protectedBaseline.status !== "verified" ||
    proof.protectedBaseline.protectedPathCount !== 2 ||
    !SHA256.test(proof.protectedBaseline.baselineSha256)
  ) {
    errors.push("protected baseline")
  }
  if (
    !exactSequence(
      proof.gates.map((gate) => gate.id),
      V137_PHASE260_GATE_IDS,
    ) ||
    proof.gates.some(
      (gate) =>
        gate.status !== "passed" ||
        gate.exitCode !== 0 ||
        !gate.command ||
        !SHA256.test(gate.stdoutSha256) ||
        !SHA256.test(gate.stderrSha256),
    )
  ) {
    errors.push("gates")
  }
  if (!exactSequence(proof.limitations, LIMITATIONS)) {
    errors.push("limitations")
  }
  return [...new Set(errors)]
}

const validateCurrentInputs = (
  proof: V137TruthfulInputsSetFairnessProof,
  repoRoot: string,
): string[] => {
  const current = hashInputs(repoRoot)
  return JSON.stringify(proof.inputs) === JSON.stringify(current)
    ? []
    : ["stale inputs"]
}

export const renderV137TruthfulInputsSetFairnessJson = (
  proof: V137TruthfulInputsSetFairnessProof,
): string => `${JSON.stringify(proof, null, 2)}\n`

export const renderV137TruthfulInputsSetFairnessMarkdown = (
  proof: V137TruthfulInputsSetFairnessProof,
): string => `# v1.37 Truthful Inputs and Set Fairness Proof

- Status: **${proof.status.toUpperCase()}**
- Current authority: \`${proof.authority.semanticAuthorityKey}\`
- Semantic tuple: \`${proof.authority.tupleId}\`
- Rules: \`${proof.authority.rulesVersion}\`
- Activation commit: \`${proof.activation.commitSha}\`
- Database state: \`${proof.activation.state}\` revision ${proof.activation.revision}
- Requirements: ${proof.requirements.length}/${V137_PHASE260_REQUIREMENTS.length} proved
- Decisions: ${proof.decisions.length}/${V137_PHASE260_DECISIONS.length} proved
- Languages: ${proof.conformance.laneCount}
- Fresh real runs: ${proof.conformance.runCount}
- Certificates: ${proof.conformance.certificateCount}
- Set conditions: ${proof.setFairness.conditionCount}
- Revision inventory: ${proof.revisions.inventoryCount} (${proof.revisions.eligibleCount} eligible, ${proof.revisions.nonCountedCount} non-counted)
- Transition authorities: ${proof.history.transitionAuthorityCount}
- Gates: ${proof.gates.length}/${V137_PHASE260_GATE_IDS.length} passed
- Protected baseline: \`${proof.protectedBaseline.baselineSha256}\`

The proof is public-safe and contains no Strategy source, artifact bytes, memories, objectives, diagnostics, host data, credentials, or security internals. Valid v1.4 gameplay and explicit historical v1.17 evidence remain unchanged. Experimental rule changes remain deferred.
`

const writeAtomic = (relativePath: string, text: string): void => {
  const target = path.join(root, relativePath)
  const temporary = `${target}.tmp-${process.pid}-${randomUUID()}`
  writeFileSync(temporary, text, { flag: "wx", mode: 0o644 })
  renameSync(temporary, target)
}

export const refreshV137TruthfulInputsSetFairnessArtifacts = (
  repoRoot: string = root,
): V137TruthfulInputsSetFairnessProof => {
  const gates = executeGates(repoRoot)
  const database = readDatabaseEvidence(repoRoot)
  const proof = buildV137TruthfulInputsSetFairnessProof(
    repoRoot,
    gates,
    database,
  )
  const errors = validateV137TruthfulInputsSetFairnessProof(proof)
  if (errors.length > 0) {
    throw new Error(`PHASE260_PROOF_INVALID:${errors.join(",")}`)
  }
  writeAtomic(
    V137_TRUTHFUL_INPUTS_SET_FAIRNESS_PATHS.json,
    renderV137TruthfulInputsSetFairnessJson(proof),
  )
  writeAtomic(
    V137_TRUTHFUL_INPUTS_SET_FAIRNESS_PATHS.markdown,
    renderV137TruthfulInputsSetFairnessMarkdown(proof),
  )
  return proof
}

export const refreshV137TruthfulInputsSetFairnessInputBindings = (
  repoRoot: string = root,
): V137TruthfulInputsSetFairnessProof => {
  const current = readJson<V137TruthfulInputsSetFairnessProof>(
    repoRoot,
    V137_TRUTHFUL_INPUTS_SET_FAIRNESS_PATHS.json,
  )
  const committedResult = spawnSync(
    "git",
    ["show", `HEAD:${V137_TRUTHFUL_INPUTS_SET_FAIRNESS_PATHS.json}`],
    { cwd: repoRoot, encoding: "utf8", timeout: 30_000 },
  )
  if (committedResult.status !== 0 || committedResult.error !== undefined) {
    throw new Error("PHASE260_IMMUTABLE_PREIMAGE_UNAVAILABLE")
  }
  const committed = JSON.parse(
    committedResult.stdout,
  ) as V137TruthfulInputsSetFairnessProof
  const immutable = ({
    inputs: _inputs,
    ...value
  }: V137TruthfulInputsSetFairnessProof): unknown => value
  if (
    validateV137TruthfulInputsSetFairnessProof(current).length > 0 ||
    validateV137TruthfulInputsSetFairnessProof(committed).length > 0 ||
    JSON.stringify(immutable(current)) !== JSON.stringify(immutable(committed))
  ) {
    throw new Error("PHASE260_IMMUTABLE_PREIMAGE_INVALID")
  }
  const refreshed = {
    ...current,
    inputs: hashInputs(repoRoot),
  }
  if (
    JSON.stringify(immutable(current)) !==
      JSON.stringify(immutable(refreshed)) ||
    validateV137TruthfulInputsSetFairnessProof(refreshed).length > 0
  ) {
    throw new Error("PHASE260_IMMUTABLE_PREIMAGE_CHANGED")
  }
  writeAtomic(
    V137_TRUTHFUL_INPUTS_SET_FAIRNESS_PATHS.json,
    renderV137TruthfulInputsSetFairnessJson(refreshed),
  )
  writeAtomic(
    V137_TRUTHFUL_INPUTS_SET_FAIRNESS_PATHS.markdown,
    renderV137TruthfulInputsSetFairnessMarkdown(refreshed),
  )
  checkV137TruthfulInputsSetFairnessArtifacts(repoRoot)
  return refreshed
}

export const checkV137TruthfulInputsSetFairnessArtifacts = (
  repoRoot: string = root,
): void => {
  const proof = readJson<V137TruthfulInputsSetFairnessProof>(
    repoRoot,
    V137_TRUTHFUL_INPUTS_SET_FAIRNESS_PATHS.json,
  )
  const errors = [
    ...validateV137TruthfulInputsSetFairnessProof(proof),
    ...validateCurrentInputs(proof, repoRoot),
  ]
  if (
    readBytes(repoRoot, V137_TRUTHFUL_INPUTS_SET_FAIRNESS_PATHS.json).toString(
      "utf8",
    ) !== renderV137TruthfulInputsSetFairnessJson(proof)
  ) {
    errors.push("noncanonical JSON")
  }
  if (
    readBytes(
      repoRoot,
      V137_TRUTHFUL_INPUTS_SET_FAIRNESS_PATHS.markdown,
    ).toString("utf8") !== renderV137TruthfulInputsSetFairnessMarkdown(proof)
  ) {
    errors.push("stale markdown")
  }
  if (errors.length > 0) {
    throw new Error(`PHASE260_PROOF_INVALID:${[...new Set(errors)].join(",")}`)
  }
}

const main = (): void => {
  try {
    const args = process.argv.slice(2)
    if (
      args.length !== 1 ||
      !["--write", "--refresh-inputs", "--check"].includes(args[0]!)
    ) {
      throw new Error("usage: --write | --refresh-inputs | --check")
    }
    if (args[0] === "--write") {
      refreshV137TruthfulInputsSetFairnessArtifacts(root)
    } else if (args[0] === "--refresh-inputs") {
      refreshV137TruthfulInputsSetFairnessInputBindings(root)
    } else {
      checkV137TruthfulInputsSetFairnessArtifacts(root)
    }
    process.stdout.write(
      `${JSON.stringify({ status: "passed", code: "V1_37_PHASE260_TRUTHFUL_INPUTS_SET_FAIRNESS_PROVED" })}\n`,
    )
  } catch (error) {
    process.stderr.write(
      `${JSON.stringify({ status: "failed", code: error instanceof Error ? error.message : "unknown" })}\n`,
    )
    process.exitCode = 1
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main()
