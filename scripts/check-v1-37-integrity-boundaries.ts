#!/usr/bin/env -S pnpm exec tsx
import {
  existsSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs"
import { createHash } from "node:crypto"
import { spawnSync } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from "node:url"
import ts from "typescript"
import { checkV137ExecutableReferenceInventory } from "./check-v1-37-executable-reference-inventory.js"
import {
  checkRetainedCandidateEventCoverageProvenance,
  checkV137CurrentEventCoverageArtifact,
} from "./generate-v1-37-event-coverage.js"

const defaultRepoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
)

export type V137IntegrityBoundaryFindingCode =
  | "CALLER_EVIDENCE_MISSING"
  | "CALLER_ENTRANT_SET_MISSING"
  | "CALLER_ORDERED_PAIR_MISSING"
  | "DEV_FIXTURE_BOUNDARY_MISSING"
  | "UNRECOGNIZED_CREATION_CALLER"
  | "UNRECOGNIZED_SQL_WRITER"
  | "UNRECOGNIZED_LEGACY_WORKER_CONSUMER"
  | "DUPLICATE_AUTHORITY_OWNER"
  | "DUPLICATE_SCHEDULER_AUTHORITY"
  | "UI_RULE_AUTHORITY"
  | "DUPLICATE_ADAPTER_CLASSIFIER"
  | "DUPLICATE_ARENA_AUTHORITY"
  | "STATIC_PROMOTION_PATH"
  | "PARTIAL_TUPLE_ACCEPTANCE"
  | "PUBLIC_EXECUTION_ROUTE"
  | "RAW_CERTIFICATE_WRITER"
  | "FIXTURE_PRODUCTION_PROMOTION"
  | "DECLARATION_PROMOTION_PATH"
  | "REQUEST_AUTHORITY_BODY"
  | "AUTHORITY_CHAIN_DRIFT"
  | "RUNTIME_REQUEST_ENVELOPE_DRIFT"
  | "GO_RECEIPT_AUTHORITY_DRIFT"
  | "CURRENT_TRANSITION_AUTHORITY_DRIFT"
  | "CURRENT_STALE_SURFACE"
  | "CURRENT_FORBIDDEN_DEPENDENCY"
  | "CURRENT_EVENT_COVERAGE_DRIFT"
  | "CURRENT_TUPLE_DRIFT"
  | "CURRENT_CANDIDATE_PROVENANCE_DRIFT"
  | "CURRENT_GO_SUCCESS_BINDING_DRIFT"
  | "CURRENT_GO_SEMANTIC_ADMISSION_DRIFT"
  | "CURRENT_PUBLICATION_LANE_SCOPE_DRIFT"
  | "CURRENT_COMPLETION_BINDING_DRIFT"
  | "CURRENT_PUBLIC_LIFECYCLE_ROUTE"
  | "PHASE_257_REPLAY_SCHEDULER"
  | "PHASE_257_RUNTIME_REPLAY_EXECUTION"
  | "PHASE_257_CONTIGUOUS_ACTIVATION_ENTRY"
  | "PHASE_257_DUPLICATE_LIFECYCLE_LOOP"
  | "AUDIT_ARTIFACT_MISSING"
  | "AUDIT_ARTIFACT_INVALID"
  | "AUDIT_METADATA_DRIFT"
  | "AUDIT_OBSERVATION_DRIFT"
  | "AUDIT_MARKDOWN_DRIFT"
  | "AUDIT_PRIVACY_VIOLATION"
  | "AUDIT_REPRODUCTION_FAILED"

export interface V137IntegrityBoundaryFinding {
  code: V137IntegrityBoundaryFindingCode
  path: string
  line: number
  detail: string
}

export interface V137IntegrityBoundaryAnalysis {
  findings: readonly V137IntegrityBoundaryFinding[]
  inventoriedFiles: number
  creationCalls: number
  sqlWriters: number
  legacyWorkerConsumers: number
}

export interface AnalyzeV137IntegritySourcesOptions {
  enforceRepositoryContracts?: boolean
  enforcePhase257CurrentContracts?: boolean
}

const sha256 = (value: string): string =>
  createHash("sha256").update(value).digest("hex")

const normalizedPrivacyKey = (value: string): string =>
  value.replaceAll(/[^a-z0-9]/giu, "").toLowerCase()

const restrictedPublicKeys = new Set(
  [
    "source",
    "sourceBytes",
    "artifactBytes",
    "strategyMemory",
    "soldierMemory",
    "objectivePayload",
    "rawDiagnostics",
    "hostPath",
    "privateKey",
    "certificateBody",
    "attestationBody",
    "securityInternals",
  ].map(normalizedPrivacyKey),
)

export const assertV137IntegrityPublicPayload = (value: unknown): void => {
  const visit = (candidate: unknown, pathParts: readonly string[]): void => {
    if (typeof candidate === "string") {
      if (/\/(?:Users|home)\//u.test(candidate)) {
        throw new Error(
          `public integrity payload contains host path at ${pathParts.join(".")}`,
        )
      }
      if (/BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY/u.test(candidate)) {
        throw new Error(
          `public integrity payload contains private key at ${pathParts.join(".")}`,
        )
      }
      return
    }
    if (Array.isArray(candidate)) {
      candidate.forEach((entry, index) =>
        visit(entry, [...pathParts, String(index)]),
      )
      return
    }
    if (!candidate || typeof candidate !== "object") return
    for (const [key, nested] of Object.entries(candidate)) {
      if (restrictedPublicKeys.has(normalizedPrivacyKey(key))) {
        throw new Error(
          `public integrity payload contains restricted key ${key}`,
        )
      }
      visit(nested, [...pathParts, key])
    }
  }
  visit(value, ["$"])
}

const auditCommand =
  "pnpm exec tsx .planning/artifacts/v2.0-core-rules-audit/reproduce-core-rule-gaps.ts"
const auditJsonPath = ".planning/artifacts/v1.37-core-rules-audit-baseline.json"
const auditMarkdownPath =
  ".planning/artifacts/v1.37-core-rules-audit-baseline.md"
const phase257RedBaselinePath =
  ".planning/artifacts/v1.37-phase-257-red-baseline.json"
const phase257ResultJsonPath =
  ".planning/artifacts/v1.37-phase-257-core-rules-result.json"
const phase257ResultMarkdownPath =
  ".planning/artifacts/v1.37-phase-257-core-rules-result.md"
const PHASE_256_AUDIT_JSON_SHA256 =
  "f069de5950030c59a04b9bf671ff7d149a54461690b766f8fd385a2c4dbb1a0b"
const PHASE_256_AUDIT_MARKDOWN_SHA256 =
  "4ebee5c0be4cdb4b554ce8f56483b8c5a11a3e3630c80e3f30460021ad09bdf2"
const PHASE_257_RED_BASELINE_SHA256 =
  "bd2a7575282ca7df86bf3a6fc2602a9797660b0ab27bdb0f2def203ddba58f0d"
const PHASE_19_ACTIVATION_COMMIT =
  "3642493db803a8f68e3863777cc66dd6609ee93d"
const PHASE_19_REVIEW_CORRECTION_COMMIT =
  "bd38bf249861f90c43c6eee97e2fcfd428fc5e6d"
const PHASE_19_REVIEW_CLOSURE_COMMIT =
  "aefb289bbf1f868253b197679c1febe235cc642d"
const PHASE_19_RECEIPT_REREVIEW_CORRECTION_COMMIT =
  "34491b2d632b351ee8ca4802dc574a27eeb68b1c"
const PHASE_19_RECEIPT_REREVIEW_CLOSURE_COMMIT =
  "f5741fb726828a507d4e7e1dd7dfac4a05902ab9"
const CURRENT_TUPLE_ID =
  "sha256:922a6857fdbc8354b744d6e766bff216f3fee85b5ed381355cb427f5a616b3ae"

const exactAuditObservations = {
  noAdvanceLastSoldier: {
    status: "STONE",
    outcome: null,
    matchEndedEvents: 0,
  },
  cycleEndBackstabActor: {
    status: "STONE",
    slotEnded: false,
    terminalReason: null,
  },
  excessMalformedOrder: {
    validOrdersRetained: 0,
    violationEvents: 1,
  },
  deepValidation: "threw:RangeError",
  overlappingArenaAccepted: true,
  legacyBoundaryAccepted: true,
  successfulPushPusherHistory: "RIGHT",
} as const

const exactAuditProbeMetadata = [
  ["noAdvanceLastSoldier", "reproduced_defect", "257"],
  ["cycleEndBackstabActor", "reproduced_defect", "257"],
  ["excessMalformedOrder", "reproduced_defect", "257"],
  ["deepValidation", "reproduced_defect", "258"],
  ["overlappingArenaAccepted", "reproduced_defect", "257"],
  ["legacyBoundaryAccepted", "reproduced_defect", "259"],
  ["successfulPushPusherHistory", "preserved_v1.4_ruling", "257"],
] as const

const stableJson = (value: unknown): string => JSON.stringify(value)

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value)

export const renderV137CoreRulesAuditBaselineMarkdown = (
  baseline: Record<string, unknown>,
): string => {
  const diffBasis = isRecord(baseline.productionSourceDiffBasis)
    ? baseline.productionSourceDiffBasis
    : {}
  const probes = Array.isArray(baseline.probes) ? baseline.probes : []
  const rows = probes
    .filter(isRecord)
    .map(
      (probe) =>
        `| \`${String(probe.id)}\` | \`${String(probe.classification)}\` | ${String(probe.futurePhaseOwner)} | \`${stableJson(probe.observed)}\` |`,
    )
    .join("\n")
  return `# v1.37 Core-Rules Audit Baseline

This is the exact Phase 256 compatibility baseline. Six confirmed defects remain routed to later phases; the successful-push reversal-history result is an immutable v1.4 compatibility ruling. This artifact records observations only and authorizes no gameplay change.

## Reproduction identity

- Command: \`${String(baseline.command)}\`
- Planning baseline commit: \`${String(baseline.planningBaselineCommit)}\`
- Implementation commit: \`${String(baseline.implementationHead)}\`
- Reviewed v1.36 archive commit: \`${String(baseline.reviewedArchiveCommit)}\`
- Production diff: \`${String(diffBasis.changedPathCount)}\` changed paths under \`${String(diffBasis.pathspec)}\`; sorted-path SHA-256 \`${String(diffBasis.changedPathListSha256)}\`

## Exact observations

| Probe | Classification | Future phase owner | Observed value |
|---|---|---:|---|
${rows}

## Guardrails

- Reruns must match all seven semantic observations exactly.
- Transport formatting may be normalized; state, legality, event order, outcome, terminal behavior, and Strategy observation may not.
- The artifacts contain no source or artifact bytes, memories, objectives, credentials, host paths, raw diagnostics, or security internals.
- Any semantic delta requires an explicit compatibility ruling before expected values change.
`
}

export interface AnalyzeV137CoreRulesAuditBaselineInput {
  baseline: unknown
  markdown: string
  reproduced: unknown
}

export const analyzeV137CoreRulesAuditBaseline = (
  input: AnalyzeV137CoreRulesAuditBaselineInput,
): V137IntegrityBoundaryAnalysis => {
  const findings: V137IntegrityBoundaryFinding[] = []
  const add = (
    code: V137IntegrityBoundaryFindingCode,
    repoPath: string,
    detail: string,
  ): void => findings.push({ code, path: repoPath, line: 1, detail })
  if (!isRecord(input.baseline)) {
    add(
      "AUDIT_ARTIFACT_INVALID",
      auditJsonPath,
      "Audit baseline must be an object.",
    )
    return {
      findings,
      inventoriedFiles: 0,
      creationCalls: 0,
      sqlWriters: 0,
      legacyWorkerConsumers: 0,
    }
  }

  try {
    assertV137IntegrityPublicPayload(input.baseline)
    assertV137IntegrityPublicPayload({ markdown: input.markdown })
  } catch {
    add(
      "AUDIT_PRIVACY_VIOLATION",
      auditJsonPath,
      "Audit artifacts contain restricted public data.",
    )
  }
  if (
    input.baseline.schemaVersion !== "v1.37-core-rules-audit-baseline-v1" ||
    input.baseline.milestone !== "v1.37" ||
    input.baseline.phase !== 256 ||
    input.baseline.command !== auditCommand ||
    input.baseline.planningBaselineCommit !==
      "8e301b2dca407fcceb2b2b02bfe8eba61b02c063" ||
    input.baseline.reviewedArchiveCommit !==
      "38f4a83db9298502c12db44cd66d026878803d20"
  ) {
    add(
      "AUDIT_METADATA_DRIFT",
      auditJsonPath,
      "Audit command, version, phase, or reviewed commit identity drifted.",
    )
  }
  const implementationHead = input.baseline.implementationHead
  const diffBasis = input.baseline.productionSourceDiffBasis
  if (
    typeof implementationHead !== "string" ||
    !/^[0-9a-f]{40}$/u.test(implementationHead) ||
    !isRecord(diffBasis) ||
    diffBasis.baseCommit !== input.baseline.planningBaselineCommit ||
    diffBasis.implementationCommit !== implementationHead ||
    diffBasis.pathspec !== "apps packages scripts" ||
    typeof diffBasis.changedPathCount !== "number" ||
    typeof diffBasis.changedPathListSha256 !== "string" ||
    !/^[0-9a-f]{64}$/u.test(diffBasis.changedPathListSha256)
  ) {
    add(
      "AUDIT_METADATA_DRIFT",
      auditJsonPath,
      "Production-source diff basis is incomplete or inconsistent.",
    )
  }

  const probes = Array.isArray(input.baseline.probes)
    ? input.baseline.probes
    : []
  if (probes.length !== exactAuditProbeMetadata.length) {
    add(
      "AUDIT_OBSERVATION_DRIFT",
      auditJsonPath,
      "Audit baseline must contain exactly seven probes.",
    )
  }
  const reproduced = isRecord(input.reproduced) ? input.reproduced : {}
  exactAuditProbeMetadata.forEach(
    ([id, classification, futurePhaseOwner], index) => {
      const probe = probes[index]
      const observed = exactAuditObservations[id]
      if (
        !isRecord(probe) ||
        probe.id !== id ||
        probe.classification !== classification ||
        probe.futurePhaseOwner !== futurePhaseOwner ||
        stableJson(probe.observed) !== stableJson(observed) ||
        stableJson(reproduced[id]) !== stableJson(observed)
      ) {
        add(
          "AUDIT_OBSERVATION_DRIFT",
          auditJsonPath,
          `Exact approved observation drifted for ${id}.`,
        )
      }
    },
  )
  const summary = input.baseline.summary
  if (
    !isRecord(summary) ||
    summary.probeCount !== 7 ||
    summary.reproducedDefectCount !== 6 ||
    summary.preservedRulingCount !== 1
  ) {
    add(
      "AUDIT_METADATA_DRIFT",
      auditJsonPath,
      "Audit summary counts must remain six defects plus one preserved ruling.",
    )
  }
  if (
    input.markdown !== renderV137CoreRulesAuditBaselineMarkdown(input.baseline)
  ) {
    add(
      "AUDIT_MARKDOWN_DRIFT",
      auditMarkdownPath,
      "Human-readable audit baseline does not match the machine artifact.",
    )
  }
  return {
    findings,
    inventoriedFiles: 2,
    creationCalls: 0,
    sqlWriters: 0,
    legacyWorkerConsumers: 0,
  }
}

export const checkV137CoreRulesAuditBaseline = (
  repoRoot = defaultRepoRoot,
): V137IntegrityBoundaryAnalysis => {
  const jsonAbsolute = path.join(repoRoot, auditJsonPath)
  const markdownAbsolute = path.join(repoRoot, auditMarkdownPath)
  const redBaselineAbsolute = path.join(repoRoot, phase257RedBaselinePath)
  if (
    !existsSync(jsonAbsolute) ||
    !existsSync(markdownAbsolute) ||
    !existsSync(redBaselineAbsolute)
  ) {
    return {
      findings: [
        {
          code: "AUDIT_ARTIFACT_MISSING",
          path: !existsSync(jsonAbsolute)
            ? auditJsonPath
            : !existsSync(markdownAbsolute)
              ? auditMarkdownPath
              : phase257RedBaselinePath,
          line: 1,
          detail: "An immutable core-rules audit baseline is missing.",
        },
      ],
      inventoriedFiles: 0,
      creationCalls: 0,
      sqlWriters: 0,
      legacyWorkerConsumers: 0,
    }
  }
  let baseline: unknown
  const baselineJson = readFileSync(jsonAbsolute, "utf8")
  const baselineMarkdown = readFileSync(markdownAbsolute, "utf8")
  const redBaseline = readFileSync(redBaselineAbsolute, "utf8")
  try {
    baseline = JSON.parse(baselineJson) as unknown
  } catch {
    return {
      findings: [
        {
          code: "AUDIT_ARTIFACT_INVALID",
          path: auditJsonPath,
          line: 1,
          detail: "The current-HEAD core-rules audit baseline is invalid JSON.",
        },
      ],
      inventoriedFiles: 1,
      creationCalls: 0,
      sqlWriters: 0,
      legacyWorkerConsumers: 0,
    }
  }
  let analysis = analyzeV137CoreRulesAuditBaseline({
    baseline,
    markdown: baselineMarkdown,
    reproduced: exactAuditObservations,
  })
  const immutableHashFindings: V137IntegrityBoundaryFinding[] = []
  for (const [repoPath, actual, expected] of [
    [auditJsonPath, sha256(baselineJson), PHASE_256_AUDIT_JSON_SHA256],
    [
      auditMarkdownPath,
      sha256(baselineMarkdown),
      PHASE_256_AUDIT_MARKDOWN_SHA256,
    ],
    [
      phase257RedBaselinePath,
      sha256(redBaseline),
      PHASE_257_RED_BASELINE_SHA256,
    ],
  ] as const) {
    if (actual !== expected) {
      immutableHashFindings.push({
        code: "AUDIT_METADATA_DRIFT",
        path: repoPath,
        line: 1,
        detail: "Immutable baseline bytes drifted.",
      })
    }
  }
  analysis = {
    ...analysis,
    findings: [...analysis.findings, ...immutableHashFindings],
    inventoriedFiles: 3,
  }
  if (baselineJson !== `${JSON.stringify(baseline, null, 2)}\n`) {
    analysis = {
      ...analysis,
      findings: [
        ...analysis.findings,
        {
          code: "AUDIT_ARTIFACT_INVALID",
          path: auditJsonPath,
          line: 1,
          detail:
            "The machine audit artifact is not in canonical deterministic formatting.",
        },
      ],
    }
  }
  if (isRecord(baseline) && isRecord(baseline.productionSourceDiffBasis)) {
    const basis = baseline.productionSourceDiffBasis
    const paths = spawnSync(
      "git",
      [
        "diff",
        "--name-only",
        String(basis.baseCommit),
        String(basis.implementationCommit),
        "--",
        "apps",
        "packages",
        "scripts",
      ],
      { cwd: repoRoot, encoding: "utf8", timeout: 10_000 },
    )
    const sortedPaths =
      paths.status === 0
        ? paths.stdout.split("\n").filter(Boolean).sort().join("\n") + "\n"
        : ""
    if (
      paths.status !== 0 ||
      sortedPaths.split("\n").filter(Boolean).length !==
        basis.changedPathCount ||
      sha256(sortedPaths) !== basis.changedPathListSha256
    ) {
      return {
        ...analysis,
        findings: [
          ...analysis.findings,
          {
            code: "AUDIT_METADATA_DRIFT",
            path: auditJsonPath,
            line: 1,
            detail: "Production-source diff basis no longer resolves exactly.",
          },
        ],
      }
    }
  }
  return analysis
}

const exactPhase257Observations = {
  noAdvanceLastSoldier: {
    status: "STONE",
    outcome: { type: "WIN", winnerPlayerId: "top" },
    matchEndedEvents: 1,
  },
  cycleEndBackstabActor: {
    status: "STONE",
    slotEnded: true,
    terminalReason: "BACKSTABBED",
  },
  excessMalformedOrder: {
    validOrdersRetained: 1,
    violationEvents: 0,
  },
  deepValidation: "threw:RangeError",
  overlappingArenaAccepted: false,
  legacyBoundaryAccepted: true,
  successfulPushPusherHistory: "RIGHT",
} as const

const readJson = (repoRoot: string, repoPath: string): unknown =>
  JSON.parse(readFileSync(path.join(repoRoot, repoPath), "utf8")) as unknown

const fileSha256 = (repoRoot: string, repoPath: string): string =>
  sha256(readFileSync(path.join(repoRoot, repoPath), "utf8"))

const reproduceCurrentAudit = (repoRoot: string): unknown => {
  const reproduction = spawnSync(
    "pnpm",
    [
      "exec",
      "tsx",
      ".planning/artifacts/v2.0-core-rules-audit/reproduce-core-rule-gaps.ts",
    ],
    { cwd: repoRoot, encoding: "utf8", timeout: 30_000 },
  )
  if (reproduction.status !== 0) {
    throw new Error("current audit reproduction failed")
  }
  return JSON.parse(reproduction.stdout) as unknown
}

const commitSourceManifest = (
  repoRoot: string,
  commit: string,
): { pathCount: number; sortedPathListSha256: string } => {
  const paths = spawnSync(
    "git",
    [
      "diff-tree",
      "--no-commit-id",
      "--name-only",
      "-r",
      commit,
    ],
    { cwd: repoRoot, encoding: "utf8", timeout: 10_000 },
  )
  if (paths.status !== 0) throw new Error("source commit is unavailable")
  const sorted = paths.stdout.split("\n").filter(Boolean).sort()
  const framed = `${sorted.join("\n")}\n`
  return {
    pathCount: sorted.length,
    sortedPathListSha256: sha256(framed),
  }
}

export const buildV137Phase257CoreRulesResult = (
  repoRoot = defaultRepoRoot,
): Record<string, unknown> => {
  const baseline = checkV137CoreRulesAuditBaseline(repoRoot)
  if (baseline.findings.length > 0) {
    throw new Error("immutable audit baseline drifted")
  }
  const reproduced = reproduceCurrentAudit(repoRoot)
  if (stableJson(reproduced) !== stableJson(exactPhase257Observations)) {
    throw new Error("current audit observations drifted")
  }
  const inventory = checkV137ExecutableReferenceInventory("current", repoRoot)
  if (inventory.findings.length > 0 || inventory.references.length !== 0) {
    throw new Error("current executable reference inventory is not empty")
  }
  if (
    checkV137CurrentEventCoverageArtifact().length > 0 ||
    checkRetainedCandidateEventCoverageProvenance().length > 0
  ) {
    throw new Error("current event coverage drifted")
  }

  const authorityPath = "packages/spec/artifacts/v1.37-integrity-authority.json"
  const eventCoveragePath =
    "packages/spec/artifacts/v1.37-current-event-coverage.json"
  const candidatePath =
    "packages/spec/artifacts/v1.37-kernel-integrity-candidate.json"
  const receiptContractPath =
    "packages/spec/src/runtime-execution-service.ts"
  const receiptWireGoldenPath =
    "packages/spec/artifacts/runtime-execution-service-response.v1.16.wire.json"
  const receiptMigrationPath =
    "packages/persistence/migrations/0017_runtime_semantic_receipts.sql"
  const receiptContract = readFileSync(
    path.join(repoRoot, receiptContractPath),
    "utf8",
  )
  const receiptMigration = readFileSync(
    path.join(repoRoot, receiptMigrationPath),
    "utf8",
  )
  const receiptWireGolden = readJson(repoRoot, receiptWireGoldenPath)
  const receiptWireGoldenResult =
    isRecord(receiptWireGolden) && isRecord(receiptWireGolden.result)
      ? receiptWireGolden.result
      : undefined
  const receiptWireGoldenClaims =
    isRecord(receiptWireGoldenResult) &&
    isRecord(receiptWireGoldenResult.semanticReceipt)
      ? receiptWireGoldenResult.semanticReceipt
      : undefined
  const authority = readJson(repoRoot, authorityPath)
  const eventCoverage = readJson(repoRoot, eventCoveragePath)
  const candidate = readJson(repoRoot, candidatePath)
  const authorityTuple =
    isRecord(authority) && Array.isArray(authority.compatibilityTuples)
      ? authority.compatibilityTuples[0]
      : undefined
  const candidateRecord =
    isRecord(candidate) && isRecord(candidate.candidate)
      ? candidate.candidate
      : undefined
  if (
    !isRecord(authorityTuple) ||
    authorityTuple.tupleId !== CURRENT_TUPLE_ID ||
    !isRecord(candidateRecord) ||
    candidateRecord.candidateTupleId !== CURRENT_TUPLE_ID ||
    candidateRecord.status !== "inactive-candidate" ||
    !isRecord(eventCoverage) ||
    eventCoverage.status !== "current-exact" ||
    eventCoverage.tupleId !== CURRENT_TUPLE_ID ||
    !Array.isArray(eventCoverage.currentEventVocabulary) ||
    eventCoverage.currentEventVocabulary.includes("PUSH_ATTEMPTED") ||
    stableJson(eventCoverage.historicalOnly) !== stableJson(["PUSH_ATTEMPTED"])
  ) {
    throw new Error("current tuple, event, or candidate provenance drifted")
  }
  if (
    !receiptContract.includes("runtime-execution-service-v1.16") ||
    !receiptContract.includes("runtime-semantic-receipt-v1") ||
    !receiptContract.includes(
      "cowards-game:runtime-semantic-chronicle-json-wire:v1",
    ) ||
    !receiptContract.includes(
      "cowards-game:runtime-semantic-final-state-json-wire:v1",
    ) ||
    !receiptContract.includes(
      "cowards-game:runtime-semantic-outcome-json-wire:v1",
    ) ||
    !receiptMigration.includes("runtime_semantic_receipt") ||
    !receiptMigration.includes("runtime_semantic_receipt_hash") ||
    !isRecord(receiptWireGolden) ||
    receiptWireGolden.contractVersion !== "runtime-execution-service-v1.16" ||
    receiptWireGolden.ok !== true ||
    !isRecord(receiptWireGoldenClaims) ||
    receiptWireGoldenClaims.schemaVersion !== "runtime-semantic-receipt-v1" ||
    typeof receiptWireGoldenClaims.chronicleWireBytesHash !== "string" ||
    typeof receiptWireGoldenClaims.finalStateWireBytesHash !== "string" ||
    typeof receiptWireGoldenClaims.outcomeWireBytesHash !== "string" ||
    typeof receiptWireGoldenClaims.signature !== "string" ||
    !/^hmac-sha256:[0-9a-f]{64}$/u.test(receiptWireGoldenClaims.signature)
  ) {
    throw new Error("v1.16 semantic receipt or migration drifted")
  }

  return {
    schemaVersion: "v1.37-phase-257-core-rules-result-v1",
    milestone: "v1.37",
    phase: 257,
    status: "current-exact",
    generatedAt: "2026-07-13",
    immutableBaselines: {
      phase256Audit: {
        jsonPath: auditJsonPath,
        jsonSha256: PHASE_256_AUDIT_JSON_SHA256,
        markdownPath: auditMarkdownPath,
        markdownSha256: PHASE_256_AUDIT_MARKDOWN_SHA256,
      },
      phase257PreRefactor: {
        path: phase257RedBaselinePath,
        sha256: PHASE_257_RED_BASELINE_SHA256,
      },
    },
    activation: {
      commit: PHASE_19_ACTIVATION_COMMIT,
      sourceManifest: commitSourceManifest(
        repoRoot,
        PHASE_19_ACTIVATION_COMMIT,
      ),
      reviewCorrection: {
        commit: PHASE_19_REVIEW_CORRECTION_COMMIT,
        sourceManifest: commitSourceManifest(
          repoRoot,
          PHASE_19_REVIEW_CORRECTION_COMMIT,
        ),
      },
      reviewClosureCommit: PHASE_19_REVIEW_CLOSURE_COMMIT,
      receiptRereview: {
        correction: {
          commit: PHASE_19_RECEIPT_REREVIEW_CORRECTION_COMMIT,
          sourceManifest: commitSourceManifest(
            repoRoot,
            PHASE_19_RECEIPT_REREVIEW_CORRECTION_COMMIT,
          ),
        },
        closureCommit: PHASE_19_RECEIPT_REREVIEW_CLOSURE_COMMIT,
      },
      tupleId: CURRENT_TUPLE_ID,
      runtimeExecutionContract: "runtime-execution-service-v1.16",
      semanticReceipt: "runtime-semantic-receipt-v1",
      receiptMigration: "0017_runtime_semantic_receipts.sql",
    },
    observations: exactPhase257Observations,
    approvedDelta: {
      semanticRepairs: [
        {
          decision: "D-09",
          probe: "excessMalformedOrder",
          meaning: "cap raw orders before validating the retained prefix",
        },
        {
          decision: "D-10",
          probe: "cycleEndBackstabActor",
          meaning: "close a Cycle-end Backstabbed actor before outcome",
        },
        {
          decision: "D-11",
          probe: "noAdvanceLastSoldier",
          meaning: "close no-Advance removal before immediate outcome",
        },
        {
          decision: "KERN-03",
          probe: "overlappingArenaAccepted",
          meaning: "reject invalid arena occupancy at admission",
        },
      ],
      structuralAndVersion: [
        {
          decision: "D-13",
          meaning:
            "remove contiguous Activation and duplicate scheduler surfaces",
        },
        {
          decision: "D-14",
          meaning: "remove PUSH_ATTEMPTED from current vocabulary only",
        },
        {
          decision: "D-15",
          meaning:
            "activate the exact 922a tuple while preserving historical v1.4",
        },
      ],
      preserved: {
        decision: "D-12",
        probe: "successfulPushPusherHistory",
        observed: "RIGHT",
      },
      deferred: [
        {
          probe: "deepValidation",
          ownerPhase: 258,
          observed: "threw:RangeError",
        },
        {
          probe: "legacyBoundaryAccepted",
          ownerPhase: 259,
          observed: true,
        },
      ],
    },
    evidence: [
      {
        id: "lifecycle-repairs",
        path: "packages/engine/src/kernel/lifecycle-repairs.test.ts",
        sha256: fileSha256(
          repoRoot,
          "packages/engine/src/kernel/lifecycle-repairs.test.ts",
        ),
      },
      {
        id: "v1.4-compatibility",
        path: "packages/engine/src/compatibility-fixtures.test.ts",
        sha256: fileSha256(
          repoRoot,
          "packages/engine/src/compatibility-fixtures.test.ts",
        ),
      },
      {
        id: "current-event-coverage",
        path: eventCoveragePath,
        sha256: fileSha256(repoRoot, eventCoveragePath),
      },
      {
        id: "current-authority",
        path: authorityPath,
        sha256: fileSha256(repoRoot, authorityPath),
      },
      {
        id: "executable-reference-inventory",
        path: "scripts/check-v1-37-executable-reference-inventory.ts",
        sha256: fileSha256(
          repoRoot,
          "scripts/check-v1-37-executable-reference-inventory.ts",
        ),
      },
      {
        id: "go-no-scheduler-ast",
        path: "apps/go-backend/semantic_integrity_test.go",
        sha256: fileSha256(
          repoRoot,
          "apps/go-backend/semantic_integrity_test.go",
        ),
      },
      {
        id: "historical-read-only-dispatch",
        path: ".planning/artifacts/v1.37-v1.36-historical-proof-dispatch.json",
        sha256: fileSha256(
          repoRoot,
          ".planning/artifacts/v1.37-v1.36-historical-proof-dispatch.json",
        ),
      },
      {
        id: "inactive-candidate-provenance",
        path: candidatePath,
        sha256: fileSha256(repoRoot, candidatePath),
      },
      {
        id: "activation-review-closure",
        path: ".planning/phases/257-canonical-transition-kernel-and-v1-4-semantic-integrity/257-19-ACTIVATION-REVIEW-CLOSURE.md",
        sha256: fileSha256(
          repoRoot,
          ".planning/phases/257-canonical-transition-kernel-and-v1-4-semantic-integrity/257-19-ACTIVATION-REVIEW-CLOSURE.md",
        ),
      },
      {
        id: "v1.16-semantic-receipt-contract",
        path: receiptContractPath,
        sha256: fileSha256(repoRoot, receiptContractPath),
      },
      {
        id: "v1.16-typescript-semantic-receipt",
        path: "apps/runtime-service/src/semantic-receipt.ts",
        sha256: fileSha256(
          repoRoot,
          "apps/runtime-service/src/semantic-receipt.ts",
        ),
      },
      {
        id: "v1.16-go-semantic-receipt",
        path: "apps/go-backend/runtime_semantic_receipt.go",
        sha256: fileSha256(
          repoRoot,
          "apps/go-backend/runtime_semantic_receipt.go",
        ),
      },
      {
        id: "v1.16-semantic-receipt-migration",
        path: receiptMigrationPath,
        sha256: fileSha256(repoRoot, receiptMigrationPath),
      },
      {
        id: "v1.16-semantic-receipt-wire-golden",
        path: receiptWireGoldenPath,
        sha256: fileSha256(repoRoot, receiptWireGoldenPath),
      },
    ],
    checks: [
      "phase256-baseline-immutable",
      "phase257-pre-refactor-baseline-immutable",
      "single-transition-authority",
      "stale-reference-inventory-empty",
      "current-event-coverage-closed",
      "exact-current-tuple",
      "inactive-candidate-provenance-immutable",
      "go-no-scheduler-ast",
      "historical-proof-read-only",
      "recursive-public-payload-privacy",
      "activation-review-findings-closed",
      "v1.16-semantic-receipt-bound",
      "v1.16-semantic-receipt-migration-bound",
      "v1.16-semantic-receipt-wire-bytes-bound",
      "v1.16-typescript-go-receipt-golden-bound",
      "receipt-rereview-warnings-closed",
    ],
  }
}

export const renderV137Phase257CoreRulesResultJson = (
  result: Record<string, unknown>,
): string => `${JSON.stringify(result, null, 2)}\n`

export const renderV137Phase257CoreRulesResultMarkdown = (
  result: Record<string, unknown>,
): string => {
  const activation = isRecord(result.activation) ? result.activation : {}
  const reviewCorrection = isRecord(activation.reviewCorrection)
    ? activation.reviewCorrection
    : {}
  const receiptRereview = isRecord(activation.receiptRereview)
    ? activation.receiptRereview
    : {}
  const receiptCorrection = isRecord(receiptRereview.correction)
    ? receiptRereview.correction
    : {}
  const observations = isRecord(result.observations) ? result.observations : {}
  const approvedDelta = isRecord(result.approvedDelta)
    ? result.approvedDelta
    : {}
  const semanticRepairs = Array.isArray(approvedDelta.semanticRepairs)
    ? approvedDelta.semanticRepairs.filter(isRecord)
    : []
  const structural = Array.isArray(approvedDelta.structuralAndVersion)
    ? approvedDelta.structuralAndVersion.filter(isRecord)
    : []
  return `# v1.37 Phase 257 Core-Rules Result

This is the deterministic current result after the Plan 19 atomic activation. It is separate from, and does not rewrite, the immutable Phase 256 and Phase 257 pre-refactor baselines.

## Activation identity

- Commit: \`${String(activation.commit)}\`
- Corrective source commit: \`${String(reviewCorrection.commit)}\`
- Review-closure commit: \`${String(activation.reviewClosureCommit)}\`
- Receipt re-review corrective commit: \`${String(receiptCorrection.commit)}\`
- Receipt re-review closure commit: \`${String(receiptRereview.closureCommit)}\`
- Current tuple: \`${String(activation.tupleId)}\`
- Source manifest: \`${stableJson(activation.sourceManifest)}\`
- Corrective source manifest: \`${stableJson(reviewCorrection.sourceManifest)}\`
- Receipt corrective source manifest: \`${stableJson(receiptCorrection.sourceManifest)}\`
- Runtime contract / receipt / migration: \`${String(activation.runtimeExecutionContract)}\` / \`${String(activation.semanticReceipt)}\` / \`${String(activation.receiptMigration)}\`

## Exact seven-probe result

${Object.entries(observations)
  .map(([id, observed]) => `- \`${id}\`: \`${stableJson(observed)}\``)
  .join("\n")}

## Approved Phase 257 delta

${[...semanticRepairs, ...structural]
  .map((entry) => `- \`${String(entry.decision)}\`: ${String(entry.meaning)}`)
  .join("\n")}
- \`D-12\`: preserved successful-push pusher history \`RIGHT\`.
- Phase 258 remains \`threw:RangeError\`; Phase 259 remains legacy-boundary accepted.

## Guardrails

- The Phase 256 and pre-refactor baseline bytes are immutable.
- The compact probes are bound to lifecycle, compatibility, event, tuple, inventory, Go AST, and historical evidence; they do not independently prove event order.
- The result contains only safe scalar observations, relative paths, and hashes. It contains no raw state, Chronicle/events, source/artifact bytes, memory/objectives, diagnostics, host data, credentials, or security evidence.
`
}

export const analyzeV137Phase257CoreRulesResult = (input: {
  result: unknown
  markdown: string
  expected: Record<string, unknown>
}): V137IntegrityBoundaryAnalysis => {
  const findings: V137IntegrityBoundaryFinding[] = []
  try {
    assertV137IntegrityPublicPayload(input.result)
    assertV137IntegrityPublicPayload({ markdown: input.markdown })
  } catch {
    findings.push({
      code: "AUDIT_PRIVACY_VIOLATION",
      path: phase257ResultJsonPath,
      line: 1,
      detail: "Current result contains restricted public data.",
    })
  }
  if (stableJson(input.result) !== stableJson(input.expected)) {
    findings.push({
      code: "AUDIT_OBSERVATION_DRIFT",
      path: phase257ResultJsonPath,
      line: 1,
      detail: "Current Phase-257 result drifted from executable evidence.",
    })
  }
  if (
    input.markdown !== renderV137Phase257CoreRulesResultMarkdown(input.expected)
  ) {
    findings.push({
      code: "AUDIT_MARKDOWN_DRIFT",
      path: phase257ResultMarkdownPath,
      line: 1,
      detail: "Current result Markdown drifted from the machine result.",
    })
  }
  return {
    findings,
    inventoriedFiles: 2,
    creationCalls: 0,
    sqlWriters: 0,
    legacyWorkerConsumers: 0,
  }
}

export const writeV137Phase257CoreRulesResult = (
  repoRoot = defaultRepoRoot,
): void => {
  const result = buildV137Phase257CoreRulesResult(repoRoot)
  writeFileSync(
    path.join(repoRoot, phase257ResultJsonPath),
    renderV137Phase257CoreRulesResultJson(result),
    "utf8",
  )
  writeFileSync(
    path.join(repoRoot, phase257ResultMarkdownPath),
    renderV137Phase257CoreRulesResultMarkdown(result),
    "utf8",
  )
}

export const checkV137Phase257CoreRulesResult = (
  repoRoot = defaultRepoRoot,
): V137IntegrityBoundaryAnalysis => {
  try {
    const expected = buildV137Phase257CoreRulesResult(repoRoot)
    const json = readFileSync(
      path.join(repoRoot, phase257ResultJsonPath),
      "utf8",
    )
    const result = JSON.parse(json) as unknown
    const markdown = readFileSync(
      path.join(repoRoot, phase257ResultMarkdownPath),
      "utf8",
    )
    const analysis = analyzeV137Phase257CoreRulesResult({
      result,
      markdown,
      expected,
    })
    if (json !== renderV137Phase257CoreRulesResultJson(expected)) {
      return {
        ...analysis,
        findings: [
          ...analysis.findings,
          {
            code: "AUDIT_ARTIFACT_INVALID",
            path: phase257ResultJsonPath,
            line: 1,
            detail: "Current result JSON is not canonical exact-key output.",
          },
        ],
      }
    }
    return analysis
  } catch {
    return {
      findings: [
        {
          code: "AUDIT_REPRODUCTION_FAILED",
          path: phase257ResultJsonPath,
          line: 1,
          detail: "Current Phase-257 result could not be reproduced.",
        },
      ],
      inventoriedFiles: 0,
      creationCalls: 0,
      sqlWriters: 0,
      legacyWorkerConsumers: 0,
    }
  }
}

const creationNames = new Set([
  "createMatch",
  "createFromPreset",
  "createFromMatrix",
  "insertMatchSetWithMatrixOnClient",
])

const approvedCreationCallers: Readonly<Record<string, readonly string[]>> = {
  createFromMatrix: [
    "packages/persistence/src/competition.ts",
    "scripts/run-v1-5-advanced-demo.ts",
  ],
  createFromPreset: [
    "packages/persistence/src/workshop.ts",
    "packages/persistence/src/dev-smoke.ts",
  ],
  insertMatchSetWithMatrixOnClient: [
    "packages/persistence/src/matchset-service.ts",
    "packages/persistence/src/ladder.ts",
  ],
  createMatch: [],
}

const approvedSqlWriters: Readonly<Record<string, readonly string[]>> = {
  match_sets: ["packages/persistence/src/matchset-service.ts"],
  match_set_execution_entrants: [
    "packages/persistence/src/matchset-service.ts",
    "packages/persistence/src/integrity-evidence.ts",
  ],
  competition_entrants: ["packages/persistence/src/matchset-service.ts"],
  matches: [
    "packages/persistence/src/match-service.ts",
    "packages/persistence/src/matchset-service.ts",
  ],
  match_jobs: [
    "packages/persistence/src/match-service.ts",
    "packages/persistence/src/matchset-service.ts",
  ],
  chronicles: ["packages/persistence/src/chronicle-store.ts"],
}

const approvedLegacyWorkerConsumers = new Set([
  "apps/worker/src/runner.ts",
  "scripts/preflight.ts",
  "scripts/run-v1-4-demo-tournament.ts",
])

const normalized = (value: string): string => value.split(path.sep).join("/")

const lineOf = (file: ts.SourceFile, node: ts.Node): number =>
  file.getLineAndCharacterOfPosition(node.getStart(file)).line + 1

const callName = (node: ts.CallExpression): string | undefined => {
  if (ts.isIdentifier(node.expression)) return node.expression.text
  if (ts.isPropertyAccessExpression(node.expression)) {
    return node.expression.name.text
  }
  return undefined
}

const objectPropertyNames = (node: ts.Expression | undefined): Set<string> => {
  if (!node || !ts.isObjectLiteralExpression(node)) return new Set()
  return new Set(
    node.properties.flatMap((property) => {
      if (
        (ts.isPropertyAssignment(property) ||
          ts.isShorthandPropertyAssignment(property) ||
          ts.isMethodDeclaration(property)) &&
        property.name
      ) {
        return [property.name.getText().replaceAll(/["']/g, "")]
      }
      return []
    }),
  )
}

const analyzeSource = (
  repoPath: string,
  source: string,
): Omit<V137IntegrityBoundaryAnalysis, "inventoriedFiles"> => {
  const findings: V137IntegrityBoundaryFinding[] = []
  let creationCalls = 0
  let sqlWriters = 0
  let legacyWorkerConsumers = 0
  const file = ts.createSourceFile(
    repoPath,
    source,
    ts.ScriptTarget.Latest,
    true,
    repoPath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  )
  const add = (
    code: V137IntegrityBoundaryFindingCode,
    node: ts.Node,
    detail: string,
  ): void => {
    findings.push({ code, path: repoPath, line: lineOf(file, node), detail })
  }

  const visit = (node: ts.Node): void => {
    if (ts.isImportDeclaration(node)) {
      const specifier = ts.isStringLiteral(node.moduleSpecifier)
        ? node.moduleSpecifier.text
        : ""
      if (specifier.includes("apps/worker/src/runner")) {
        legacyWorkerConsumers += 1
        if (!approvedLegacyWorkerConsumers.has(repoPath)) {
          add(
            "UNRECOGNIZED_LEGACY_WORKER_CONSUMER",
            node,
            "Legacy TypeScript worker imports require explicit retirement ownership.",
          )
        }
      }
    }
    if (ts.isCallExpression(node)) {
      const name = callName(node)
      if (name === "runWorkerOnce" || name === "runWorkerLoop") {
        legacyWorkerConsumers += 1
        if (!approvedLegacyWorkerConsumers.has(repoPath)) {
          add(
            "UNRECOGNIZED_LEGACY_WORKER_CONSUMER",
            node,
            `Unapproved legacy worker call: ${name}.`,
          )
        }
      }
      if (name && creationNames.has(name)) {
        creationCalls += 1
        if (!(approvedCreationCallers[name] ?? []).includes(repoPath)) {
          add(
            "UNRECOGNIZED_CREATION_CALLER",
            node,
            `Unapproved canonical creation caller: ${name}.`,
          )
        } else if (
          !(
            repoPath === "packages/persistence/src/matchset-service.ts" &&
            name === "insertMatchSetWithMatrixOnClient"
          )
        ) {
          const properties = objectPropertyNames(
            [...node.arguments]
              .reverse()
              .find((argument) => ts.isObjectLiteralExpression(argument)),
          )
          if (!properties.has("integrityIdentity")) {
            add(
              "CALLER_EVIDENCE_MISSING",
              node,
              `${name} must receive an exact integrityIdentity.`,
            )
          }
          if (
            name === "createFromMatrix" &&
            (!source.includes("bottomEntrantKey") ||
              !source.includes("topEntrantKey"))
          ) {
            add(
              "CALLER_ORDERED_PAIR_MISSING",
              node,
              "Matrix callers must wire both ordered execution entrant keys.",
            )
          }
          if (
            name === "createFromMatrix" &&
            source.includes("competitionEntrants") &&
            !source.includes("executionEntrantKey")
          ) {
            add(
              "CALLER_ENTRANT_SET_MISSING",
              node,
              "Competition entrants must identify their execution entrant key.",
            )
          }
          if (
            repoPath === "packages/persistence/src/dev-smoke.ts" &&
            (!source.includes('trustDomain !== "fixture"') ||
              !source.includes("resolveMatchSetExecutionEvidence"))
          ) {
            add(
              "DEV_FIXTURE_BOUNDARY_MISSING",
              node,
              "Development smoke must require explicit fixture-domain authority.",
            )
          }
        }
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(file)

  const declarationNames = new Set<string>()
  for (const statement of file.statements) {
    if (ts.isFunctionDeclaration(statement) && statement.name) {
      declarationNames.add(statement.name.text)
    }
    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name))
          declarationNames.add(declaration.name.text)
      }
    }
  }
  const fileNode = file.statements[0] ?? file
  if (
    declarationNames.has("CANONICAL_AUTHORITY_REGISTRY") &&
    repoPath !== "packages/spec/src/integrity-authority.ts"
  ) {
    add(
      "DUPLICATE_AUTHORITY_OWNER",
      fileNode,
      "Canonical owner registry may be declared only by @cowards/spec.",
    )
  }
  if (
    declarationNames.has("scheduleTrialLadderSeason") &&
    repoPath !== "packages/persistence/src/ladder.ts"
  ) {
    add(
      "DUPLICATE_SCHEDULER_AUTHORITY",
      fileNode,
      "Set scheduling policy has one persistence owner.",
    )
  }
  if (
    repoPath.startsWith("apps/web/") &&
    /(?:from\s+["']@cowards\/engine["']|resolveAction\s*\()/u.test(source)
  ) {
    add(
      "UI_RULE_AUTHORITY",
      fileNode,
      "Web code may project rules but may not execute them.",
    )
  }
  if (
    declarationNames.has("evaluateExecutableLaneEligibility") &&
    repoPath !== "packages/spec/src/runtime-evidence.ts"
  ) {
    add(
      "DUPLICATE_ADAPTER_CLASSIFIER",
      fileNode,
      "Executable lane classification has one spec owner.",
    )
  }
  if (
    declarationNames.has("ArenaVariantSchema") &&
    repoPath !== "packages/spec/src/schemas.ts"
  ) {
    add(
      "DUPLICATE_ARENA_AUTHORITY",
      fileNode,
      "Arena validation has one spec owner.",
    )
  }
  if (/countedResultsAllowed\s*\?\s*["']counted["']/u.test(source)) {
    add(
      "STATIC_PROMOTION_PATH",
      fileNode,
      "Descriptive registry flags cannot promote counted execution.",
    )
  }
  if (
    /(?:accepted|eligible|supported)\s*=.*(?:input\.)?(?:rules|engine|runtimeAbi|chronicle|arenaCatalog|setPolicy)\s*===/u.test(
      source,
    ) &&
    !source.includes("resolveCanonicalCompatibilityTuple")
  ) {
    add(
      "PARTIAL_TUPLE_ACCEPTANCE",
      fileNode,
      "Compatibility consumers must resolve the complete exact tuple.",
    )
  }
  if (
    /apps\/web\/app\/api\/.+\/route\.tsx?$/u.test(repoPath) &&
    /\b(?:executeMatch|runMatch|runWorkerOnce|runWorkerLoop)\s*\(/u.test(source)
  ) {
    add(
      "PUBLIC_EXECUTION_ROUTE",
      fileNode,
      "Public web routes cannot own Strategy or Match execution.",
    )
  }
  if (
    /insert\s+into\s+runtime_evidence_(?:verified_attestations|certificates)\b/iu.test(
      source,
    ) &&
    repoPath !== "packages/persistence/src/runtime-evidence-import.ts" &&
    !(
      repoPath === "scripts/prove-v1-37-atomic-activation.ts" &&
      source.includes("atomic_activation_") &&
      source.includes("RUNTIME_EVIDENCE_AUTHORITY_TRUST_DOMAINS.fixture") &&
      source.includes("productionReceiptCount === 0") &&
      source.includes("drop schema if exists")
    )
  ) {
    add(
      "RAW_CERTIFICATE_WRITER",
      fileNode,
      "Verified attestations and certificates may be written only by verified attestation import.",
    )
  }
  if (
    /trustDomain\s*===?\s*["']fixture["'][\s\S]{0,120}["']counted["']/u.test(
      source,
    )
  ) {
    add(
      "FIXTURE_PRODUCTION_PROMOTION",
      fileNode,
      "Fixture trust cannot grant production counted eligibility.",
    )
  }
  if (
    /(?:gateName|documentation|docs)[\s\S]{0,100}(?:passed|approved)[\s\S]{0,100}["']counted["']/iu.test(
      source,
    )
  ) {
    add(
      "DECLARATION_PROMOTION_PATH",
      fileNode,
      "Gate names or documentation cannot mint executable evidence.",
    )
  }
  if (
    /request\.(?:containmentCertificate|conformanceCertificate|certificateBody|attestationBody)\b/u.test(
      source,
    )
  ) {
    add(
      "REQUEST_AUTHORITY_BODY",
      fileNode,
      "Runtime requests may carry references, never authority bodies.",
    )
  }

  const sqlPattern =
    /insert\s+into\s+(match_sets|match_set_execution_entrants|competition_entrants|matches|match_jobs|chronicles)\b/giu
  for (const match of source.matchAll(sqlPattern)) {
    const table = match[1]!.toLowerCase()
    sqlWriters += 1
    if (!(approvedSqlWriters[table] ?? []).includes(repoPath)) {
      const position = match.index ?? 0
      const line = source.slice(0, position).split("\n").length
      findings.push({
        code: "UNRECOGNIZED_SQL_WRITER",
        path: repoPath,
        line,
        detail: `Unapproved direct SQL writer for ${table}.`,
      })
    }
  }

  return { findings, creationCalls, sqlWriters, legacyWorkerConsumers }
}

const analyzePhase257CurrentSources = (
  sources: Readonly<Record<string, string>>,
): readonly V137IntegrityBoundaryFinding[] => {
  const findings: V137IntegrityBoundaryFinding[] = []
  const add = (
    code: V137IntegrityBoundaryFindingCode,
    repoPath: string,
    sourceFile: ts.SourceFile,
    node: ts.Node,
    detail: string,
  ): void => {
    const line =
      sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line +
      1
    findings.push({ code, path: repoPath, line, detail })
  }

  const productionSchedulerConsumers = new Set<string>()
  const driverPath = "packages/engine/src/kernel/driver.ts"
  const staleSymbols = new Set([
    "resolveActivation",
    "buildChronicleFromMatch",
    "resolveRound",
  ])
  const schedulerRoots = new Set([
    "stepCandidateMatch",
    "stepMatch",
    "runActivationFromState",
  ])
  const forbiddenGameplayImports = new Set([
    "MATCH_KERNEL",
    "buildChronicleFromMatch",
    "resolveAction",
    "resolveActivation",
    "resolveContraction",
    "resolveRound",
    "runActivationFromState",
    "stepCandidateMatch",
    "stepMatch",
  ])

  for (const [repoPath, source] of Object.entries(sources).sort(
    ([left], [right]) => left.localeCompare(right),
  )) {
    const normalizedPath = normalized(repoPath)
    const sourceFile = ts.createSourceFile(
      normalizedPath,
      source,
      ts.ScriptTarget.Latest,
      true,
    )
    const loops: ts.IterationStatement[] = []
    const schedulerAliases = new Set(schedulerRoots)
    const schedulerCalls: ts.CallExpression[] = []
    const allCalls: ts.CallExpression[] = []
    const functions = new Map<string, ts.FunctionLikeDeclaration>()
    const staleSites = new Map<string, ts.Node>()
    const aliasDeclarations: Array<{
      name: string
      initializer: ts.Expression
    }> = []
    const imports: ts.ImportDeclaration[] = []

    const expressionName = (node: ts.Expression): string | undefined => {
      if (ts.isIdentifier(node)) return node.text
      if (ts.isPropertyAccessExpression(node)) return node.name.text
      if (
        ts.isElementAccessExpression(node) &&
        node.argumentExpression !== undefined &&
        (ts.isStringLiteral(node.argumentExpression) ||
          ts.isNoSubstitutionTemplateLiteral(node.argumentExpression))
      ) {
        return node.argumentExpression.text
      }
      return undefined
    }
    const schedulerReference = (node: ts.Expression): boolean => {
      const name = expressionName(node)
      return name !== undefined && schedulerAliases.has(name)
    }

    const visit = (node: ts.Node): void => {
      if (ts.isIdentifier(node) && staleSymbols.has(node.text)) {
        staleSites.set(node.text, staleSites.get(node.text) ?? node)
      }
      if (
        ts.isElementAccessExpression(node) &&
        node.argumentExpression !== undefined &&
        (ts.isStringLiteral(node.argumentExpression) ||
          ts.isNoSubstitutionTemplateLiteral(node.argumentExpression)) &&
        staleSymbols.has(node.argumentExpression.text)
      ) {
        staleSites.set(
          node.argumentExpression.text,
          staleSites.get(node.argumentExpression.text) ?? node,
        )
      }
      if (
        ts.isForStatement(node) ||
        ts.isForInStatement(node) ||
        ts.isForOfStatement(node) ||
        ts.isWhileStatement(node) ||
        ts.isDoStatement(node)
      ) {
        loops.push(node)
      }
      if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) {
        if (node.initializer !== undefined) {
          aliasDeclarations.push({
            name: node.name.text,
            initializer: node.initializer,
          })
        }
      }
      if (ts.isCallExpression(node)) allCalls.push(node)
      if (ts.isImportDeclaration(node)) imports.push(node)
      if (ts.isImportSpecifier(node)) {
        const importedName = node.propertyName?.text ?? node.name.text
        if (schedulerRoots.has(importedName)) {
          schedulerAliases.add(node.name.text)
        }
      }
      if (ts.isFunctionDeclaration(node) && node.name !== undefined) {
        functions.set(node.name.text, node)
      }
      if (
        ts.isVariableDeclaration(node) &&
        ts.isIdentifier(node.name) &&
        node.initializer !== undefined &&
        (ts.isArrowFunction(node.initializer) ||
          ts.isFunctionExpression(node.initializer))
      ) {
        functions.set(node.name.text, node.initializer)
      }
      ts.forEachChild(node, visit)
    }
    visit(sourceFile)

    for (let changed = true; changed; ) {
      changed = false
      for (const declaration of aliasDeclarations) {
        if (
          !schedulerAliases.has(declaration.name) &&
          schedulerReference(declaration.initializer)
        ) {
          schedulerAliases.add(declaration.name)
          changed = true
        }
      }
    }
    for (const call of allCalls) {
      if (schedulerReference(call.expression)) schedulerCalls.push(call)
    }

    for (const [symbol, site] of staleSites) {
      add(
        "CURRENT_STALE_SURFACE",
        normalizedPath,
        sourceFile,
        site,
        `The stale ${symbol} surface remains executable.`,
      )
    }

    const isProduction =
      !normalizedPath.endsWith(".test.ts") &&
      !normalizedPath.endsWith(".test.tsx") &&
      !normalizedPath.endsWith(".spec.ts") &&
      !normalizedPath.endsWith(".spec.tsx")
    if (
      isProduction &&
      normalizedPath !== "packages/engine/src/kernel/step.ts" &&
      source.includes("stepCandidateMatch") &&
      schedulerCalls.length > 0
    ) {
      productionSchedulerConsumers.add(normalizedPath)
    }

    for (const importDeclaration of imports) {
      if (!ts.isStringLiteral(importDeclaration.moduleSpecifier)) continue
      const moduleName = importDeclaration.moduleSpecifier.text
      const importedNames = new Set<string>()
      const clause = importDeclaration.importClause
      if (clause?.name !== undefined) importedNames.add(clause.name.text)
      if (clause?.namedBindings && ts.isNamedImports(clause.namedBindings)) {
        for (const specifier of clause.namedBindings.elements) {
          importedNames.add(specifier.propertyName?.text ?? specifier.name.text)
        }
      }
      const isEngineDependency =
        moduleName === "@cowards/engine" ||
        moduleName.startsWith("@cowards/engine/") ||
        /(?:^|\/)engine(?:\/|$)/u.test(moduleName)
      const isReplayDependency =
        moduleName === "@cowards/replay" ||
        moduleName.startsWith("@cowards/replay/") ||
        /(?:^|\/)replay(?:\/|$)/u.test(moduleName)
      const forbidden = [...importedNames].filter((name) =>
        forbiddenGameplayImports.has(name),
      )
      const violatesReplay =
        normalizedPath.startsWith("packages/replay/") &&
        isEngineDependency &&
        forbidden.length > 0
      const violatesRuntime =
        normalizedPath.startsWith("apps/runtime-service/") &&
        ((isEngineDependency &&
          forbidden.some((name) => name !== "runMatch")) ||
          (isReplayDependency && forbidden.length > 0))
      const violatesPersistence =
        normalizedPath.startsWith("packages/persistence/") &&
        (isEngineDependency || isReplayDependency) &&
        forbidden.length > 0
      if (violatesReplay || violatesRuntime || violatesPersistence) {
        add(
          "CURRENT_FORBIDDEN_DEPENDENCY",
          normalizedPath,
          sourceFile,
          importDeclaration,
          `Forbidden gameplay-authority import: ${forbidden.join(", ")}.`,
        )
      }
    }

    const schedulingFunctions = new Set<string>()
    for (const [name, declaration] of functions) {
      if (
        schedulerCalls.some(
          (call) => call.pos >= declaration.pos && call.end <= declaration.end,
        )
      ) {
        schedulingFunctions.add(name)
      }
    }
    for (let changed = true; changed; ) {
      changed = false
      for (const [name, declaration] of functions) {
        if (schedulingFunctions.has(name)) continue
        const reachesScheduler = allCalls.some(
          (call) =>
            call.pos >= declaration.pos &&
            call.end <= declaration.end &&
            ts.isIdentifier(call.expression) &&
            schedulingFunctions.has(call.expression.text),
        )
        if (reachesScheduler) {
          schedulingFunctions.add(name)
          changed = true
        }
      }
    }
    const repeatedCallIn = (node: ts.Node): boolean =>
      schedulerCalls.some(
        (call) => call.pos >= node.pos && call.end <= node.end,
      ) ||
      allCalls.some(
        (call) =>
          call.pos >= node.pos &&
          call.end <= node.end &&
          ts.isIdentifier(call.expression) &&
          schedulingFunctions.has(call.expression.text),
      )
    const combinatorNames = new Set([
      "forEach",
      "map",
      "flatMap",
      "reduce",
      "reduceRight",
      "some",
      "every",
    ])
    const combinatorSite = allCalls.find(
      (call) =>
        ts.isPropertyAccessExpression(call.expression) &&
        combinatorNames.has(call.expression.name.text) &&
        call.arguments.some(
          (argument) =>
            repeatedCallIn(argument) ||
            (ts.isIdentifier(argument) &&
              schedulingFunctions.has(argument.text)),
        ),
    )
    const recursiveSite = [...functions.entries()].find(
      ([name, declaration]) =>
        schedulingFunctions.has(name) &&
        allCalls.some(
          (call) =>
            call.pos >= declaration.pos &&
            call.end <= declaration.end &&
            ts.isIdentifier(call.expression) &&
            call.expression.text === name,
        ),
    )?.[1]
    const copiedSchedulerSite =
      normalizedPath !== driverPath && isProduction
        ? (loops.find(repeatedCallIn) ?? combinatorSite ?? recursiveSite)
        : undefined
    if (copiedSchedulerSite !== undefined) {
      add(
        "CURRENT_TRANSITION_AUTHORITY_DRIFT",
        normalizedPath,
        sourceFile,
        copiedSchedulerSite,
        "A non-driver lifecycle loop repeatedly advances Match scheduling.",
      )
    }

    if (normalizedPath === driverPath) {
      const driverLoop = loops.find(repeatedCallIn)
      if (driverLoop === undefined || !source.includes("stepCandidateMatch")) {
        add(
          "CURRENT_TRANSITION_AUTHORITY_DRIFT",
          normalizedPath,
          sourceFile,
          sourceFile,
          "The sole kernel driver must repeatedly consume stepCandidateMatch.",
        )
      }
    }
  }

  if (Object.hasOwn(sources, driverPath)) {
    const unexpected = [...productionSchedulerConsumers].filter(
      (repoPath) => repoPath !== driverPath,
    )
    if (
      !productionSchedulerConsumers.has(driverPath) ||
      unexpected.length > 0
    ) {
      findings.push({
        code: "CURRENT_TRANSITION_AUTHORITY_DRIFT",
        path: driverPath,
        line: 1,
        detail:
          unexpected.length === 0
            ? "The kernel driver is not the executable stepCandidateMatch consumer."
            : `Additional production scheduler consumers: ${unexpected.join(", ")}.`,
      })
    }
  }

  const addTextFinding = (
    code: V137IntegrityBoundaryFindingCode,
    repoPath: string,
    needle: string,
    detail: string,
  ): void => {
    const source = sources[repoPath]
    if (source === undefined) return
    const index = source.indexOf(needle)
    findings.push({
      code,
      path: repoPath,
      line: index < 0 ? 1 : source.slice(0, index).split("\n").length,
      detail,
    })
  }

  const goClientPath = "apps/go-backend/runtime_service_client.go"
  const goClient = sources[goClientPath]
  const goOrchestratorPath = "apps/go-backend/orchestrator.go"
  const goOrchestrator = sources[goOrchestratorPath]
  if (
    goClient !== undefined &&
    (/Result\s+map\[string\]any/u.test(goClient) ||
      /response\.Result\s*\[/u.test(goOrchestrator ?? ""))
  ) {
    addTextFinding(
      "CURRENT_GO_SUCCESS_BINDING_DRIFT",
      goClientPath,
      "Result",
      "Go must decode current execution success into an exact typed result and bind Chronicle plus final state before completion.",
    )
  }

  const goSemanticPath = "apps/go-backend/semantic_integrity.go"
  const goSemantic = sources[goSemanticPath]
  if (
    goSemantic !== undefined &&
    /func collectGoTupleIssues[\s\S]{0,2500}?semanticCompatibilityVersions/u.test(
      goSemantic,
    ) &&
    /var semanticCompatibilityVersions[\s\S]{0,400}?"engine":\s*"0\.1\.4"/u.test(
      goSemantic,
    )
  ) {
    addTextFinding(
      "CURRENT_GO_SEMANTIC_ADMISSION_DRIFT",
      goSemanticPath,
      "semanticCompatibilityVersions",
      "Go current semantic admission still accepts the retired pre-activation component tuple.",
    )
  }

  const publisherPath =
    "packages/persistence/src/runtime-evidence-authority-publisher.ts"
  const publisher = sources[publisherPath]
  if (
    publisher !== undefined &&
    (!publisher.includes("selectedLaneIdentityHashes") ||
      !/runtime_evidence_lane_controls[\s\S]{0,500}lane_identity_hash\s*=\s*any/iu.test(
        publisher,
      ))
  ) {
    addTextFinding(
      "CURRENT_PUBLICATION_LANE_SCOPE_DRIFT",
      publisherPath,
      "runtime_evidence_lane_controls",
      "Authority publication controls must be restricted to selected exact-current certificate lane hashes.",
    )
  }

  const runtimeExecutionPath = "apps/runtime-service/src/execute-match.ts"
  const runtimeExecution = sources[runtimeExecutionPath]
  if (
    runtimeExecution !== undefined &&
    (!/reconstructed\.replay\.stateAt\s*\(/u.test(runtimeExecution) ||
      !/recorded\.finalState/u.test(runtimeExecution))
  ) {
    addTextFinding(
      "CURRENT_COMPLETION_BINDING_DRIFT",
      runtimeExecutionPath,
      "reconstructChronicle",
      "A successful TS completion must compare the reconstructed terminal replay state with the recorded canonical final state.",
    )
  }

  const engineIndexPath = "packages/engine/src/index.ts"
  const engineIndex = sources[engineIndexPath]
  if (
    engineIndex !== undefined &&
    /export\s+\*\s+from\s+["']\.\/activation\.js["']/u.test(engineIndex)
  ) {
    addTextFinding(
      "CURRENT_PUBLIC_LIFECYCLE_ROUTE",
      engineIndexPath,
      "activation.js",
      "The package root must not expose resolveActivationSelection or resolveActivationCycle as public lifecycle routes.",
    )
  }
  for (const [repoPath, source] of Object.entries(sources)) {
    if (
      repoPath.startsWith("packages/engine/src/") &&
      !repoPath.startsWith("packages/engine/src/fixtures/") &&
      !repoPath.endsWith(".test.ts") &&
      /\b(?:export\s+)?(?:const|function)\s+(?:resolveActivationSelection|resolveActivationCycle)\b/u.test(
        source,
      )
    ) {
      addTextFinding(
        "CURRENT_PUBLIC_LIFECYCLE_ROUTE",
        repoPath,
        "resolveActivation",
        "Executable historical selection/cycle lifecycle implementations must remain fixture-only.",
      )
    }
  }

  return findings
}

export const analyzeV137IntegritySources = (
  sources: Readonly<Record<string, string>>,
  options: AnalyzeV137IntegritySourcesOptions = {},
): V137IntegrityBoundaryAnalysis => {
  const analyses = Object.entries(sources)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([repoPath, source]) => analyzeSource(normalized(repoPath), source))
  const findings = analyses.flatMap((analysis) => analysis.findings)
  if (options.enforcePhase257CurrentContracts) {
    findings.push(...analyzePhase257CurrentSources(sources))
  }
  if (options.enforceRepositoryContracts) {
    const requireMarkers = (
      repoPath: string,
      markers: readonly string[],
      code: V137IntegrityBoundaryFindingCode,
    ): void => {
      const source = sources[repoPath] ?? ""
      const missing = markers.filter((marker) => !source.includes(marker))
      if (missing.length > 0) {
        findings.push({
          code,
          path: repoPath,
          line: 1,
          detail: `Required integrity markers missing: ${missing.join(", ")}.`,
        })
      }
    }
    const requirePattern = (
      repoPath: string,
      pattern: RegExp,
      expectation: string,
      code: V137IntegrityBoundaryFindingCode,
    ): void => {
      if (!pattern.test(sources[repoPath] ?? "")) {
        findings.push({
          code,
          path: repoPath,
          line: 1,
          detail: `Required integrity protocol missing: ${expectation}.`,
        })
      }
    }
    requireMarkers(
      "packages/persistence/src/runtime-evidence-import.ts",
      [
        "importVerifiedRuntimeEvidenceAttestation",
        "verifyRuntimeEvidenceAttestation(immutableInput)",
        "Sole application-level certificate writer",
      ],
      "AUTHORITY_CHAIN_DRIFT",
    )
    requireMarkers(
      "packages/persistence/src/runtime-evidence-authority-publisher.ts",
      [
        "withSerializableTransaction",
        "verifyImport",
        "runtime_evidence_authority_publication_sources",
        "installRuntimeEvidenceAuthorityPublication",
        "v1.37-runtime-evidence-authority-install-receipt-v1",
      ],
      "AUTHORITY_CHAIN_DRIFT",
    )
    requireMarkers(
      "apps/runtime-service/src/runtime-evidence-authority.ts",
      ["readBoundedDescriptor", "installHighWater", "deploymentPin"],
      "AUTHORITY_CHAIN_DRIFT",
    )
    requirePattern(
      "packages/spec/src/runtime-evidence-authority-bundle.ts",
      /encodeRuntimeEvidenceAuthoritySignatureMessage[\s\S]{0,1800}RUNTIME_EVIDENCE_AUTHORITY_SIGNATURE_DOMAIN[\s\S]{0,800}hashRuntimeEvidenceAuthorityPayload\(input\.payloadBytes\)[\s\S]{0,200}input\.payloadBytes/gu,
      "domain-separated signature framing must bind the payload hash and exact payload bytes",
      "AUTHORITY_CHAIN_DRIFT",
    )
    requirePattern(
      "packages/spec/src/runtime-evidence-authority-bundle.ts",
      /signedMessageBytes:\s*encodeRuntimeEvidenceAuthoritySignatureMessage\([\s\S]{0,500}payloadBytes/gu,
      "bundle inspection must verify the canonical signature message built from exact payload bytes",
      "AUTHORITY_CHAIN_DRIFT",
    )
    requirePattern(
      "apps/runtime-service/src/runtime-evidence-authority.ts",
      /verifySignature:\s*\(\{\s*signedMessageBytes,\s*signature\s*\}\)[\s\S]{0,240}signedMessageBytes[\s\S]{0,160}publicKeyDescriptor\.publicKey[\s\S]{0,160}signature/gu,
      "runtime-service must verify the inspector-provided canonical message bytes with the pinned public key",
      "AUTHORITY_CHAIN_DRIFT",
    )
    requireMarkers(
      "packages/spec/src/runtime-evidence-authority-bundle.test.ts",
      [
        "trustedKeyIds: []",
        "verifySignature: () => false",
        "parsed.payloadSha256 =",
        "relabeledDomain.trustDomain =",
        "relabeledKey.keyId =",
      ],
      "AUTHORITY_CHAIN_DRIFT",
    )
    requireMarkers(
      "apps/go-backend/runtime_evidence_authority.go",
      [
        "ed25519.Verify",
        "installRuntimeEvidenceAuthorityHighWater",
        "MinimumBundleHash",
      ],
      "AUTHORITY_CHAIN_DRIFT",
    )
    requireMarkers(
      "apps/go-backend/integrity_creation.go",
      [
        "lockAuthorityPublicationTransitions",
        "lockInstalledAuthorityReceipt",
        "sourceManifestHash",
        "sourceSetCount",
      ],
      "GO_RECEIPT_AUTHORITY_DRIFT",
    )
    requirePattern(
      "apps/go-backend/integrity_creation.go",
      /func lockAuthorityPublicationTransitions[\s\S]{0,700}runtime_evidence_authority_publication_head[\s\S]{0,220}for share/gu,
      "authority publication transitions require their own shared head lock",
      "GO_RECEIPT_AUTHORITY_DRIFT",
    )
    requirePattern(
      "apps/go-backend/integrity_creation.go",
      /func \(server \*LiveServer\) lockInstalledAuthorityReceipt[\s\S]{0,500}lockAuthorityPublicationTransitions[\s\S]{0,2200}runtime_evidence_authority_installed_head installed_head[\s\S]{0,900}for share of p/gu,
      "installed receipt validation must first lock publication transitions and then lock the selected publication row",
      "GO_RECEIPT_AUTHORITY_DRIFT",
    )
    requireMarkers(
      "apps/runtime-service/src/execute-match.test.ts",
      [
        "createFixtureRuntimeExecutionEvidenceSnapshot",
        "createFixtureRuntimeEvidenceAuthorityLoader",
        "evidenceSnapshot",
        "fixture-only:untrusted",
      ],
      "RUNTIME_REQUEST_ENVELOPE_DRIFT",
    )
    requireMarkers(
      "apps/runtime-service/src/counted-safety.test.ts",
      [
        "createFixtureRuntimeExecutionAuthorityContext",
        "evidenceSnapshot",
        "authorityLoader",
        "exhibition_only",
      ],
      "RUNTIME_REQUEST_ENVELOPE_DRIFT",
    )
    requireMarkers(
      "apps/runtime-service/src/four-language-parity.test.ts",
      [
        "createFixtureRuntimeExecutionEvidenceSnapshot",
        "createFixtureRuntimeEvidenceAuthorityLoader",
        "evidenceSnapshot",
        "fourLanguageGoldenPairs",
      ],
      "RUNTIME_REQUEST_ENVELOPE_DRIFT",
    )
  }
  findings.sort(
    (left, right) =>
      left.path.localeCompare(right.path) ||
      left.line - right.line ||
      left.code.localeCompare(right.code),
  )
  return {
    findings,
    inventoriedFiles: analyses.length,
    creationCalls: analyses.reduce(
      (total, analysis) => total + analysis.creationCalls,
      0,
    ),
    sqlWriters: analyses.reduce(
      (total, analysis) => total + analysis.sqlWriters,
      0,
    ),
    legacyWorkerConsumers: analyses.reduce(
      (total, analysis) => total + analysis.legacyWorkerConsumers,
      0,
    ),
  }
}

const collectTypeScriptSources = (
  repoRoot: string,
): Readonly<Record<string, string>> => {
  const sources: Record<string, string> = {}
  const excludedDirectories = new Set([
    ".git",
    ".next",
    ".planning",
    "coverage",
    "dist",
    "node_modules",
  ])
  const walk = (directory: string): void => {
    if (!existsSync(directory)) return
    for (const name of readdirSync(directory).sort()) {
      if (excludedDirectories.has(name)) continue
      const absolutePath = path.join(directory, name)
      const stat = statSync(absolutePath)
      if (stat.isDirectory()) {
        walk(absolutePath)
        continue
      }
      if (
        !name.match(/\.tsx?$/u) ||
        name.match(/\.(test|spec)\.tsx?$/u) ||
        name.endsWith(".d.ts")
      ) {
        continue
      }
      sources[normalized(path.relative(repoRoot, absolutePath))] = readFileSync(
        absolutePath,
        "utf8",
      )
    }
  }
  for (const root of ["apps", "packages", "scripts"]) {
    walk(path.join(repoRoot, root))
  }
  for (const repoPath of [
    "packages/spec/src/runtime-evidence-authority-bundle.test.ts",
    "apps/runtime-service/src/execute-match.test.ts",
    "apps/runtime-service/src/counted-safety.test.ts",
    "apps/runtime-service/src/four-language-parity.test.ts",
    "apps/go-backend/runtime_evidence_authority.go",
    "apps/go-backend/integrity_creation.go",
    "apps/go-backend/runtime_service_client.go",
    "apps/go-backend/orchestrator.go",
    "apps/go-backend/semantic_integrity.go",
  ]) {
    const absolutePath = path.join(repoRoot, repoPath)
    if (existsSync(absolutePath))
      sources[repoPath] = readFileSync(absolutePath, "utf8")
  }
  return sources
}

export const analyzeV137IntegrityBoundaries = (
  repoRoot = defaultRepoRoot,
): V137IntegrityBoundaryAnalysis => {
  const structural = analyzeV137IntegritySources(
    collectTypeScriptSources(repoRoot),
    {
      enforceRepositoryContracts: true,
      enforcePhase257CurrentContracts: true,
    },
  )
  const audit = checkV137CoreRulesAuditBaseline(repoRoot)
  const currentResult = checkV137Phase257CoreRulesResult(repoRoot)
  return {
    ...structural,
    findings: [
      ...structural.findings,
      ...audit.findings,
      ...currentResult.findings,
    ],
    inventoriedFiles:
      structural.inventoriedFiles +
      audit.inventoriedFiles +
      currentResult.inventoriedFiles,
  }
}

const isDirectExecution = (): boolean =>
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (isDirectExecution()) {
  if (process.argv.includes("--write")) {
    writeV137Phase257CoreRulesResult()
  }
  const analysis = analyzeV137IntegrityBoundaries()
  if (analysis.findings.length > 0) {
    for (const finding of analysis.findings) {
      console.error(
        `${finding.code} ${finding.path}:${finding.line} ${finding.detail}`,
      )
    }
    process.exitCode = 1
  } else {
    console.log(
      `v1.37 integrity inventory files=${analysis.inventoriedFiles} creation_calls=${analysis.creationCalls} sql_writers=${analysis.sqlWriters} legacy_worker_consumers=${analysis.legacyWorkerConsumers}`,
    )
  }
}
