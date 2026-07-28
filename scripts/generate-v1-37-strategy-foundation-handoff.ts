#!/usr/bin/env -S pnpm exec tsx
import { createHash } from "node:crypto"
import { existsSync, readFileSync, realpathSync, renameSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import {
  CANONICAL_ARENA_CATALOG_V1_37,
  CANONICAL_SET_CONDITION_ROWS_V1_37,
  CURRENT_SEMANTIC_AUTHORITY_KEY,
  CURRENT_SEMANTIC_TUPLE,
  CURRENT_SEMANTIC_TUPLE_ID,
  RUNTIME_ABI_V1_17,
  RUNTIME_BUDGET_CAPABILITIES_V1_17,
  RUNTIME_EXECUTION_SERVICE_VERSION_V1_18,
  RUNTIME_SEMANTIC_RECEIPT_SCHEMA_VERSION_V1_18,
  SET_CONDITION_POLICY_V1_37,
  assertPublicOutputLeakSafe,
} from "@cowards/spec"
import {
  checkV137MilestoneAuditArtifacts,
  validateV137MilestoneAudit,
} from "./generate-v1-37-milestone-audit.js"
import {
  validateV137PrearchiveProof,
} from "./evaluate-v1-37-prearchive-proof.js"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const SHA = /^sha256:[0-9a-f]{64}$/u
const LANGUAGE_IDS = ["typescript", "python", "rust", "zig"] as const
const canonical = (value: unknown): string => `${JSON.stringify(value)}\n`
const digest = (value: string | Uint8Array): `sha256:${string}` =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`
const fail = (code: string): never => {
  throw new TypeError(code)
}
const exactKeys = (value: unknown, keys: readonly string[]): boolean =>
  value !== null &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  JSON.stringify(Object.keys(value).sort()) === JSON.stringify([...keys].sort())
const asRecord = (value: unknown, code: string): Record<string, unknown> => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) fail(code)
  return value as Record<string, unknown>
}
const stringAt = (value: Record<string, unknown>, key: string, code: string): string => {
  if (typeof value[key] !== "string") fail(code)
  return value[key] as string
}

export const V137_STRATEGY_FOUNDATION_ARTIFACT_PATHS = Object.freeze({
  json: ".planning/artifacts/v1.37-strategy-evaluation-foundation.json",
  markdown: ".planning/artifacts/v1.37-strategy-evaluation-foundation.md",
})

const SOURCE_PATHS = [
  "scripts/generate-v1-37-strategy-foundation-handoff.ts",
  "scripts/generate-v1-37-strategy-foundation-handoff.test.ts",
  "scripts/generate-v1-37-milestone-audit.ts",
  "scripts/evaluate-v1-37-truthful-inputs-set-fairness.ts",
  "package.json",
] as const

type StrategyFoundationLane = {
  languageId: (typeof LANGUAGE_IDS)[number]
  laneId: string
  providerId: string
  toolchainSha256: `sha256:${string}`
  artifactSha256: `sha256:${string}`
  containmentPolicySha256: `sha256:${string}`
  certificateId: string
  certificateSha256: `sha256:${string}`
  functionalConformance: "passed"
  containmentEvidence: "attested"
  freshness: "current-certified"
  counted: false
  limitationCode: "proof-local-identity-non-counted"
}

export interface V137StrategyFoundation {
  schemaVersion: "v1.37-strategy-evaluation-foundation-v1"
  milestone: "v1.37"
  phase: 261
  strategyMilestoneAuthorized: false
  authority: {
    semanticAuthorityKey: "runtime-v1.19"
    tupleId: `sha256:${string}`
    rulesVersion: string
    engineVersion: string
    runtimeAbiVersion: "strategy-runtime-abi-v1.19"
    chronicleVersion: string
    canonicalJsonVersion: "canonical-json-v1.1"
    runtimeServiceVersion: "runtime-execution-service-v1.18"
    receiptVersion: "runtime-semantic-receipt-v1.18"
    budgetContractVersion: "runtime-abi-v1.17-budget-capabilities-v1"
    budgetProfileSha256: `sha256:${string}`
    capabilityContractSha256: `sha256:${string}`
  }
  arenas: {
    catalogVersion: "canonical-arena-catalog-v1.37"
    geometryHashProfile: "arena-semantic-geometry-v1"
    active: Array<{ id: string; semanticGeometryHash: `sha256:${string}` }>
  }
  setPolicy: {
    version: "canonical-set-policy-v1.37-four-condition-v1"
    conditionCount: 4
    conditions: Array<{
      ordinal: 0 | 1 | 2 | 3
      suffix: string
      bottom: "a" | "b"
      top: "a" | "b"
      initialInitiative: "a" | "b"
    }>
    requiresEveryCanonicalCondition: true
    partialMatrixCounts: false
    systemFailureCounts: false
  }
  conformance: {
    corpusVersion: "v3"
    corpusRootSha256: `sha256:${string}`
    traceVersion: "v1.37-observation-trace-v4"
    traceRootSha256: `sha256:${string}`
    certificateVersion: "runtime-conformance-certificate-v1.19"
    laneCount: 4
    certificateCount: 4
    runCount: 12
  }
  lanes: StrategyFoundationLane[]
  limitations: readonly [
    "proof-local-containment-is-non-counted",
    "browser-is-fixture-backed-not-live-backend-data",
    "cycle-start-backstab-simplification-deferred",
    "post-advance-hold-simplification-deferred",
    "experimental-rules-deferred",
  ]
  canonicalCommands: readonly [
    "pnpm v1.37:prearchive-proof:check",
    "pnpm v1.37:milestone-audit:check",
    "pnpm v1.37:strategy-foundation:check",
  ]
  proofBindings: {
    prearchiveProofSha256: `sha256:${string}`
    auditSha256: `sha256:${string}`
    prearchiveInputRootSha256: `sha256:${string}`
    releaseState: "release-ready"
    auditStatus: "release-ready"
    releaseCompletion: false
  }
  sourceBindings: Array<{ path: (typeof SOURCE_PATHS)[number]; sha256: `sha256:${string}` }>
}

const sourceBindings = (repoRoot: string): V137StrategyFoundation["sourceBindings"] =>
  SOURCE_PATHS.map((file) => ({ path: file, sha256: digest(readFileSync(path.join(repoRoot, file))) }))

const readJson = (repoRoot: string, file: string): unknown =>
  JSON.parse(readFileSync(path.join(repoRoot, file), "utf8"))

const buildLane = (
  proofLane: Record<string, unknown>,
  provider: Record<string, unknown>,
  candidate: Record<string, unknown>,
  integrated: Record<string, unknown>,
): StrategyFoundationLane => {
  const identity = asRecord(candidate.identity, "V137_STRATEGY_FOUNDATION_LANE_IDENTITY_INVALID")
  const languageId = stringAt(proofLane, "languageId", "V137_STRATEGY_FOUNDATION_LANE_INVALID")
  const serviceLane = (integrated.lanes as unknown[]).find(
    (lane) => asRecord(lane, "V137_STRATEGY_FOUNDATION_SERVICE_LANE_INVALID").language === languageId,
  )
  const service = asRecord(serviceLane, "V137_STRATEGY_FOUNDATION_SERVICE_LANE_MISSING")
  if (
    languageId !== stringAt(provider, "languageId", "V137_STRATEGY_FOUNDATION_PROVIDER_INVALID") ||
    languageId !== stringAt(identity, "languageId", "V137_STRATEGY_FOUNDATION_IDENTITY_INVALID") ||
    identity.laneId !== proofLane.laneId ||
    service.functionalConformance !== "passed" ||
    service.containmentEvidence !== "attested" ||
    service.counted !== false ||
    service.limitationCode !== "proof-local-identity-non-counted"
  ) fail("V137_STRATEGY_FOUNDATION_LANE_BINDING_INVALID")
  const values = {
    languageId,
    laneId: stringAt(proofLane, "laneId", "V137_STRATEGY_FOUNDATION_LANE_INVALID"),
    providerId: stringAt(provider, "providerId", "V137_STRATEGY_FOUNDATION_PROVIDER_INVALID"),
    toolchainSha256: stringAt(identity, "toolchainSha256", "V137_STRATEGY_FOUNDATION_IDENTITY_INVALID"),
    artifactSha256: stringAt(identity, "artifactSha256", "V137_STRATEGY_FOUNDATION_IDENTITY_INVALID"),
    containmentPolicySha256: stringAt(identity, "containmentPolicySha256", "V137_STRATEGY_FOUNDATION_IDENTITY_INVALID"),
    certificateId: stringAt(proofLane, "certificateId", "V137_STRATEGY_FOUNDATION_LANE_INVALID"),
    certificateSha256: stringAt(proofLane, "certificateSha256", "V137_STRATEGY_FOUNDATION_LANE_INVALID"),
    functionalConformance: "passed",
    containmentEvidence: "attested",
    freshness: "current-certified",
    counted: false,
    limitationCode: "proof-local-identity-non-counted",
  } as const
  if ([values.toolchainSha256, values.artifactSha256, values.containmentPolicySha256, values.certificateSha256].some((value) => !SHA.test(value))) fail("V137_STRATEGY_FOUNDATION_LANE_HASH_INVALID")
  return values as StrategyFoundationLane
}

const fromMachineAuthorities = (
  phase260: Record<string, unknown>,
  prearchive: Record<string, unknown>,
  audit: Record<string, unknown>,
  integrated: Record<string, unknown>,
  revalidation: Record<string, unknown>,
  candidates: Record<string, Record<string, unknown>>,
  bindings: V137StrategyFoundation["sourceBindings"],
): V137StrategyFoundation => {
  const authority = asRecord(phase260.authority, "V137_STRATEGY_FOUNDATION_PHASE260_INVALID")
  const arenas = asRecord(phase260.arenas, "V137_STRATEGY_FOUNDATION_PHASE260_INVALID")
  const fairness = asRecord(phase260.setFairness, "V137_STRATEGY_FOUNDATION_PHASE260_INVALID")
  const conformance = asRecord(phase260.conformance, "V137_STRATEGY_FOUNDATION_PHASE260_INVALID")
  const candidatePinSet = asRecord(revalidation.candidatePinSet, "V137_STRATEGY_FOUNDATION_REVALIDATION_INVALID")
  const providers = candidatePinSet.certificates as unknown[]
  const proofLanes = conformance.lanes as unknown[]
  if (!Array.isArray(providers) || !Array.isArray(proofLanes) || !Array.isArray(integrated.lanes)) fail("V137_STRATEGY_FOUNDATION_LANES_INVALID")
  const active = CANONICAL_ARENA_CATALOG_V1_37.arenas
    .filter((arena) => arena.status === "active" && arena.schedulable)
    .map((arena) => ({ id: arena.id, semanticGeometryHash: arena.semanticGeometryHash }))
  const lanes = LANGUAGE_IDS.map((languageId) => {
    const proofLane = proofLanes.find((lane) => asRecord(lane, "V137_STRATEGY_FOUNDATION_LANE_INVALID").languageId === languageId)
    const provider = providers.find((row) => asRecord(row, "V137_STRATEGY_FOUNDATION_PROVIDER_INVALID").languageId === languageId)
    const candidate = candidates[languageId]
    if (proofLane === undefined || provider === undefined || candidate === undefined) fail("V137_STRATEGY_FOUNDATION_LANE_MISSING")
    return buildLane(asRecord(proofLane, "V137_STRATEGY_FOUNDATION_LANE_INVALID"), asRecord(provider, "V137_STRATEGY_FOUNDATION_PROVIDER_INVALID"), asRecord(candidate.candidatePayload, "V137_STRATEGY_FOUNDATION_CANDIDATE_INVALID"), integrated)
  })
  return validateV137StrategyFoundation({
    schemaVersion: "v1.37-strategy-evaluation-foundation-v1",
    milestone: "v1.37",
    phase: 261,
    strategyMilestoneAuthorized: false,
    authority: {
      semanticAuthorityKey: CURRENT_SEMANTIC_AUTHORITY_KEY,
      tupleId: CURRENT_SEMANTIC_TUPLE_ID,
      rulesVersion: CURRENT_SEMANTIC_TUPLE.rules,
      engineVersion: CURRENT_SEMANTIC_TUPLE.engine,
      runtimeAbiVersion: CURRENT_SEMANTIC_TUPLE.runtimeAbi,
      chronicleVersion: CURRENT_SEMANTIC_TUPLE.chronicle,
      canonicalJsonVersion: RUNTIME_ABI_V1_17.versions.canonicalJson,
      runtimeServiceVersion: RUNTIME_EXECUTION_SERVICE_VERSION_V1_18,
      receiptVersion: RUNTIME_SEMANTIC_RECEIPT_SCHEMA_VERSION_V1_18,
      budgetContractVersion: RUNTIME_BUDGET_CAPABILITIES_V1_17.schemaVersion,
      budgetProfileSha256: RUNTIME_BUDGET_CAPABILITIES_V1_17.budgetProfileSha256,
      capabilityContractSha256: RUNTIME_BUDGET_CAPABILITIES_V1_17.contractDigest,
    },
    arenas: {
      catalogVersion: CANONICAL_ARENA_CATALOG_V1_37.catalogVersion,
      geometryHashProfile: CANONICAL_ARENA_CATALOG_V1_37.geometryHashProfile,
      active,
    },
    setPolicy: {
      version: SET_CONDITION_POLICY_V1_37.version,
      conditionCount: SET_CONDITION_POLICY_V1_37.conditionCount,
      conditions: CANONICAL_SET_CONDITION_ROWS_V1_37.map((row) => ({ ...row })),
      requiresEveryCanonicalCondition: SET_CONDITION_POLICY_V1_37.completion.requiresEveryCanonicalCondition,
      partialMatrixCounts: SET_CONDITION_POLICY_V1_37.completion.partialMatrixCounts,
      systemFailureCounts: SET_CONDITION_POLICY_V1_37.completion.systemFailureIsTerminalEvidence,
    },
    conformance: {
      corpusVersion: stringAt(authority, "corpusVersion", "V137_STRATEGY_FOUNDATION_AUTHORITY_INVALID") as "v3",
      corpusRootSha256: stringAt(authority, "corpusRoot", "V137_STRATEGY_FOUNDATION_AUTHORITY_INVALID") as `sha256:${string}`,
      traceVersion: stringAt(authority, "traceVersion", "V137_STRATEGY_FOUNDATION_AUTHORITY_INVALID") as "v1.37-observation-trace-v4",
      traceRootSha256: stringAt(authority, "traceRoot", "V137_STRATEGY_FOUNDATION_AUTHORITY_INVALID") as `sha256:${string}`,
      certificateVersion: stringAt(authority, "certificateVersion", "V137_STRATEGY_FOUNDATION_AUTHORITY_INVALID") as "runtime-conformance-certificate-v1.19",
      laneCount: conformance.laneCount as 4,
      certificateCount: conformance.certificateCount as 4,
      runCount: conformance.runCount as 12,
    },
    lanes,
    limitations: [
      "proof-local-containment-is-non-counted",
      "browser-is-fixture-backed-not-live-backend-data",
      "cycle-start-backstab-simplification-deferred",
      "post-advance-hold-simplification-deferred",
      "experimental-rules-deferred",
    ],
    canonicalCommands: [
      "pnpm v1.37:prearchive-proof:check",
      "pnpm v1.37:milestone-audit:check",
      "pnpm v1.37:strategy-foundation:check",
    ],
    proofBindings: {
      prearchiveProofSha256: digest(canonical(prearchive)),
      auditSha256: digest(canonical(audit)),
      prearchiveInputRootSha256: stringAt(audit, "prearchiveInputRootSha256", "V137_STRATEGY_FOUNDATION_AUDIT_INVALID") as `sha256:${string}`,
      releaseState: stringAt(prearchive, "releaseState", "V137_STRATEGY_FOUNDATION_PREARCHIVE_INVALID") as "release-ready",
      auditStatus: stringAt(audit, "status", "V137_STRATEGY_FOUNDATION_AUDIT_INVALID") as "release-ready",
      releaseCompletion: asRecord(audit.releaseOperation, "V137_STRATEGY_FOUNDATION_AUDIT_INVALID").completion as false,
    },
    sourceBindings: bindings,
  })
}

export const createV137StrategyFoundationFixture = (): V137StrategyFoundation =>
  fromMachineAuthorities(
    {
      authority: {
        corpusVersion: "v3",
        corpusRoot: "sha256:" + "a".repeat(64),
        traceVersion: "v1.37-observation-trace-v4",
        traceRoot: "sha256:" + "b".repeat(64),
        certificateVersion: "runtime-conformance-certificate-v1.19",
      },
      arenas: {},
      setFairness: {},
      conformance: {
        laneCount: 4,
        certificateCount: 4,
        runCount: 12,
        lanes: LANGUAGE_IDS.map((languageId) => ({
          languageId,
          laneId: `${languageId}-native-supervised-v1.19`,
          certificateId: `certificate:${languageId}`,
          certificateSha256: "sha256:" + "c".repeat(64),
        })),
      },
    },
    { milestone: "v1.37", phase: 261, releaseState: "release-ready" },
    { status: "release-ready", prearchiveInputRootSha256: "sha256:" + "d".repeat(64), releaseOperation: { completion: false } },
    { lanes: LANGUAGE_IDS.map((language) => ({ language, functionalConformance: "passed", containmentEvidence: "attested", counted: false, limitationCode: "proof-local-identity-non-counted" })) },
    { candidatePinSet: { certificates: LANGUAGE_IDS.map((languageId) => ({ languageId, providerId: `strategy-language-provider-${languageId}` })) } },
    Object.fromEntries(LANGUAGE_IDS.map((languageId) => [languageId, { candidatePayload: { identity: { languageId, laneId: `${languageId}-native-supervised-v1.19`, toolchainSha256: "sha256:" + "e".repeat(64), artifactSha256: "sha256:" + "f".repeat(64), containmentPolicySha256: "sha256:" + "0".repeat(64) } } }])),
    SOURCE_PATHS.map((path) => ({ path, sha256: digest(`fixture:${path}`) })),
  )

export const validateV137StrategyFoundation = (value: unknown): V137StrategyFoundation => {
  const keys = ["arenas", "authority", "canonicalCommands", "conformance", "lanes", "limitations", "milestone", "phase", "proofBindings", "schemaVersion", "sourceBindings", "strategyMilestoneAuthorized", "setPolicy"]
  if (!exactKeys(value, keys)) fail("V137_STRATEGY_FOUNDATION_SHAPE")
  const handoff = value as V137StrategyFoundation
  if (handoff.schemaVersion !== "v1.37-strategy-evaluation-foundation-v1" || handoff.milestone !== "v1.37" || handoff.phase !== 261) fail("V137_STRATEGY_FOUNDATION_IDENTITY_INVALID")
  if (handoff.strategyMilestoneAuthorized !== false) fail("V137_STRATEGY_FOUNDATION_AUTHORIZATION_INVALID")
  if (!exactKeys(handoff.authority, ["semanticAuthorityKey", "tupleId", "rulesVersion", "engineVersion", "runtimeAbiVersion", "chronicleVersion", "canonicalJsonVersion", "runtimeServiceVersion", "receiptVersion", "budgetContractVersion", "budgetProfileSha256", "capabilityContractSha256"]) || handoff.authority.semanticAuthorityKey !== "runtime-v1.19" || handoff.authority.runtimeAbiVersion !== "strategy-runtime-abi-v1.19" || handoff.authority.canonicalJsonVersion !== "canonical-json-v1.1" || handoff.authority.runtimeServiceVersion !== "runtime-execution-service-v1.18" || handoff.authority.receiptVersion !== "runtime-semantic-receipt-v1.18" || ![handoff.authority.tupleId, handoff.authority.budgetProfileSha256, handoff.authority.capabilityContractSha256].every((value) => SHA.test(value))) fail("V137_STRATEGY_FOUNDATION_AUTHORITY_INVALID")
  if (!exactKeys(handoff.arenas, ["catalogVersion", "geometryHashProfile", "active"]) || handoff.arenas.catalogVersion !== "canonical-arena-catalog-v1.37" || handoff.arenas.geometryHashProfile !== "arena-semantic-geometry-v1" || !Array.isArray(handoff.arenas.active) || handoff.arenas.active.length !== 2 || handoff.arenas.active.some((arena) => !exactKeys(arena, ["id", "semanticGeometryHash"]) || !SHA.test(arena.semanticGeometryHash))) fail("V137_STRATEGY_FOUNDATION_ARENAS_INVALID")
  if (!exactKeys(handoff.setPolicy, ["version", "conditionCount", "conditions", "requiresEveryCanonicalCondition", "partialMatrixCounts", "systemFailureCounts"]) || handoff.setPolicy.version !== "canonical-set-policy-v1.37-four-condition-v1" || handoff.setPolicy.conditionCount !== 4 || handoff.setPolicy.requiresEveryCanonicalCondition !== true || handoff.setPolicy.partialMatrixCounts !== false || handoff.setPolicy.systemFailureCounts !== false || JSON.stringify(handoff.setPolicy.conditions) !== JSON.stringify(CANONICAL_SET_CONDITION_ROWS_V1_37)) fail("V137_STRATEGY_FOUNDATION_SET_POLICY_INVALID")
  if (!exactKeys(handoff.conformance, ["corpusVersion", "corpusRootSha256", "traceVersion", "traceRootSha256", "certificateVersion", "laneCount", "certificateCount", "runCount"]) || handoff.conformance.corpusVersion !== "v3" || handoff.conformance.traceVersion !== "v1.37-observation-trace-v4" || handoff.conformance.certificateVersion !== "runtime-conformance-certificate-v1.19" || handoff.conformance.laneCount !== 4 || handoff.conformance.certificateCount !== 4 || handoff.conformance.runCount !== 12 || !SHA.test(handoff.conformance.corpusRootSha256) || !SHA.test(handoff.conformance.traceRootSha256)) fail("V137_STRATEGY_FOUNDATION_CONFORMANCE_INVALID")
  if (!Array.isArray(handoff.lanes) || JSON.stringify(handoff.lanes.map((lane) => lane.languageId)) !== JSON.stringify(LANGUAGE_IDS) || handoff.lanes.some((lane) => !exactKeys(lane, ["languageId", "laneId", "providerId", "toolchainSha256", "artifactSha256", "containmentPolicySha256", "certificateId", "certificateSha256", "functionalConformance", "containmentEvidence", "freshness", "counted", "limitationCode"]) || lane.functionalConformance !== "passed" || lane.containmentEvidence !== "attested" || lane.freshness !== "current-certified" || lane.counted !== false || lane.limitationCode !== "proof-local-identity-non-counted" || ![lane.toolchainSha256, lane.artifactSha256, lane.containmentPolicySha256, lane.certificateSha256].every((value) => SHA.test(value)))) fail("V137_STRATEGY_FOUNDATION_LANES_INVALID")
  if (JSON.stringify(handoff.limitations) !== JSON.stringify(["proof-local-containment-is-non-counted", "browser-is-fixture-backed-not-live-backend-data", "cycle-start-backstab-simplification-deferred", "post-advance-hold-simplification-deferred", "experimental-rules-deferred"])) fail("V137_STRATEGY_FOUNDATION_LIMITATIONS_INVALID")
  if (JSON.stringify(handoff.canonicalCommands) !== JSON.stringify(["pnpm v1.37:prearchive-proof:check", "pnpm v1.37:milestone-audit:check", "pnpm v1.37:strategy-foundation:check"])) fail("V137_STRATEGY_FOUNDATION_COMMANDS_INVALID")
  if (!exactKeys(handoff.proofBindings, ["prearchiveProofSha256", "auditSha256", "prearchiveInputRootSha256", "releaseState", "auditStatus", "releaseCompletion"]) || ![handoff.proofBindings.prearchiveProofSha256, handoff.proofBindings.auditSha256, handoff.proofBindings.prearchiveInputRootSha256].every((value) => SHA.test(value)) || handoff.proofBindings.releaseState !== "release-ready" || handoff.proofBindings.auditStatus !== "release-ready" || handoff.proofBindings.releaseCompletion !== false) fail("V137_STRATEGY_FOUNDATION_PROOF_BINDINGS_INVALID")
  if (!Array.isArray(handoff.sourceBindings) || JSON.stringify(handoff.sourceBindings.map((binding) => binding.path)) !== JSON.stringify(SOURCE_PATHS) || handoff.sourceBindings.some((binding) => !SHA.test(binding.sha256))) fail("V137_STRATEGY_FOUNDATION_SOURCE_BINDINGS_INVALID")
  assertPublicOutputLeakSafe(handoff, "v1.37 Strategy foundation")
  return handoff
}

export const generateV137StrategyFoundation = (repoRoot: string): V137StrategyFoundation => {
  const phase260 = asRecord(readJson(repoRoot, ".planning/artifacts/v1.37-truthful-inputs-set-fairness-proof.json"), "V137_STRATEGY_FOUNDATION_PHASE260_INVALID")
  const prearchive = asRecord(validateV137PrearchiveProof(readJson(repoRoot, ".planning/artifacts/v1.37-prearchive-proof.json")), "V137_STRATEGY_FOUNDATION_PREARCHIVE_INVALID")
  const audit = asRecord(validateV137MilestoneAudit(readJson(repoRoot, ".planning/artifacts/v1.37-milestone-audit.json")), "V137_STRATEGY_FOUNDATION_AUDIT_INVALID")
  const integrated = asRecord(readJson(repoRoot, ".planning/artifacts/v1.37-integrated-service-proof.json"), "V137_STRATEGY_FOUNDATION_INTEGRATED_INVALID")
  const revalidation = asRecord(readJson(repoRoot, ".planning/artifacts/v1.37-observation-v1.19-strategy-revision-revalidation.json"), "V137_STRATEGY_FOUNDATION_REVALIDATION_INVALID")
  const candidates = Object.fromEntries(LANGUAGE_IDS.map((languageId) => [languageId, asRecord(readJson(repoRoot, `.planning/artifacts/v1.37-observation-v1.19-language-conformance-${languageId}.json`), "V137_STRATEGY_FOUNDATION_CANDIDATE_INVALID")])) as Record<string, Record<string, unknown>>
  return fromMachineAuthorities(phase260, prearchive, audit, integrated, revalidation, candidates, sourceBindings(repoRoot))
}

export const renderV137StrategyFoundationJson = (handoff: unknown): string => canonical(validateV137StrategyFoundation(handoff))

export const renderV137StrategyFoundationMarkdown = (handoff: unknown): string => {
  const checked = JSON.parse(renderV137StrategyFoundationJson(handoff)) as V137StrategyFoundation
  return `---\nmilestone: v1.37\nstrategy_milestone_authorized: false\nsemantic_authority: ${checked.authority.semanticAuthorityKey}\n---\n# v1.37 Strategy Evaluation Foundation\n\n## Status\n\nThis is a certified factual foundation only. **Separate approval is still required** after the archive/tag check before a serious Strategy milestone may begin.\n\n## Certified Tuple and Runtime Contract\n\n- Tuple: \`${checked.authority.tupleId}\`\n- Rules / engine / ABI / Chronicle: \`${checked.authority.rulesVersion}\` / \`${checked.authority.engineVersion}\` / \`${checked.authority.runtimeAbiVersion}\` / \`${checked.authority.chronicleVersion}\`\n- Canonical JSON / budget / capability / service / receipt: \`${checked.authority.canonicalJsonVersion}\` / \`${checked.authority.budgetProfileSha256}\` / \`${checked.authority.capabilityContractSha256}\` / \`${checked.authority.runtimeServiceVersion}\` / \`${checked.authority.receiptVersion}\`\n\n## Active Arenas and Four-Condition Set Policy\n\n${checked.arenas.active.map((arena) => `- \`${arena.id}\`: \`${arena.semanticGeometryHash}\``).join("\n")}\n\nThe \`${checked.setPolicy.version}\` policy has exactly four canonical conditions and requires the complete matrix; partial matrices and system failures do not count.\n\n## Corpus, Certificates, and Truthful Lanes\n\n- Corpus / trace: \`${checked.conformance.corpusVersion}\` \`${checked.conformance.corpusRootSha256}\`; \`${checked.conformance.traceVersion}\` \`${checked.conformance.traceRootSha256}\`\n- Certificates: \`${checked.conformance.certificateVersion}\`; ${checked.conformance.laneCount} lanes, ${checked.conformance.certificateCount} certificates, ${checked.conformance.runCount} certified runs.\n${checked.lanes.map((lane) => `- \`${lane.languageId}\`: lane \`${lane.laneId}\`, provider \`${lane.providerId}\`, certificate \`${lane.certificateId}\`; counted: \`${lane.counted}\` (${lane.limitationCode}).`).join("\n")}\n\n## Limitations and Deferred Experiments\n\n${checked.limitations.map((limitation) => `- \`${limitation}\``).join("\n")}\n\n## Proof Binding and Commands\n\n- Prearchive proof: \`${checked.proofBindings.prearchiveProofSha256}\`\n- Release-ready audit: \`${checked.proofBindings.auditSha256}\`\n- Release completion: \`${checked.proofBindings.releaseCompletion}\`\n\n${checked.canonicalCommands.map((command) => `\`${command}\``).join("\n")}\n`
}

export const writeV137StrategyFoundationArtifacts = (repoRoot: string): V137StrategyFoundation => {
  checkV137MilestoneAuditArtifacts(repoRoot)
  const handoff = generateV137StrategyFoundation(repoRoot)
  for (const [kind, artifact] of Object.entries(V137_STRATEGY_FOUNDATION_ARTIFACT_PATHS)) {
    const target = path.join(repoRoot, artifact)
    const bytes = kind === "json" ? renderV137StrategyFoundationJson(handoff) : renderV137StrategyFoundationMarkdown(handoff)
    const temporary = `${target}.tmp-${process.pid}`
    writeFileSync(temporary, bytes, { flag: "w", mode: 0o644 })
    renameSync(temporary, target)
  }
  return handoff
}

export const checkV137StrategyFoundationArtifacts = (repoRoot: string): V137StrategyFoundation => {
  checkV137MilestoneAuditArtifacts(repoRoot)
  const handoff = generateV137StrategyFoundation(repoRoot)
  for (const [kind, artifact] of Object.entries(V137_STRATEGY_FOUNDATION_ARTIFACT_PATHS)) {
    const target = path.join(repoRoot, artifact)
    if (!existsSync(target)) fail("V137_STRATEGY_FOUNDATION_ARTIFACT_MISSING")
    const expected = kind === "json" ? renderV137StrategyFoundationJson(handoff) : renderV137StrategyFoundationMarkdown(handoff)
    if (readFileSync(target, "utf8") !== expected) fail("V137_STRATEGY_FOUNDATION_ARTIFACT_EDITED")
  }
  return handoff
}

const isDirectRun = (): boolean => {
  const invokedScript = process.argv[1]
  if (!invokedScript) return false
  try { return realpathSync(path.resolve(invokedScript)) === realpathSync(fileURLToPath(import.meta.url)) } catch { return false }
}
if (isDirectRun()) {
  const mode = process.argv.slice(2)
  try {
    const handoff = mode.length === 1 && mode[0] === "--write" ? writeV137StrategyFoundationArtifacts(root) : mode.length === 1 && mode[0] === "--check" ? checkV137StrategyFoundationArtifacts(root) : fail("V137_STRATEGY_FOUNDATION_MODE_INVALID")
    process.stdout.write(`${JSON.stringify({ authorized: handoff.strategyMilestoneAuthorized, lanes: handoff.lanes.length, releaseCompletion: handoff.proofBindings.releaseCompletion })}\n`)
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : "V137_STRATEGY_FOUNDATION_FAILED"}\n`)
    process.exitCode = 1
  }
}
