#!/usr/bin/env -S pnpm exec tsx
import { execFileSync } from "node:child_process"
import { Buffer } from "node:buffer"
import { createHash } from "node:crypto"
import {
  existsSync,
  readFileSync,
  realpathSync,
  writeFileSync,
} from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import {
  admitCanonicalJsonValue,
  assertPublicOutputLeakSafe,
  CURRENT_SEMANTIC_AUTHORITY_GENERATED,
  CURRENT_SEMANTIC_AUTHORITY_KEY,
  CURRENT_SEMANTIC_TUPLE,
  CURRENT_SEMANTIC_TUPLE_ID,
  type JsonValue,
} from "@cowards/spec"
// eslint-disable-next-line no-restricted-imports -- The admission gate executes the exact retained audit reproducer rather than copying its authority.
import {
  runV137AuditReproductionGate,
  type V137AuditReproductionReceipt,
} from "../check-v1-37-audit-reproduction.js"
// eslint-disable-next-line no-restricted-imports -- The admission gate invokes the read-only post-tag checker as the independent outer-operation authority.
import {
  checkV137ReleaseTag,
  type V137ReleaseTagResult,
} from "../check-v1-37-release-tag.js"

const SHA256 = /^sha256:[0-9a-f]{64}$/u
const GIT_OBJECT = /^[0-9a-f]{40}$/u
const MAX_INPUT_BYTES = 512 * 1024
const ADMISSION_PATH =
  ".planning/artifacts/v1.38-foundation-admission.json"
const FOUNDATION_PATH =
  ".planning/artifacts/v1.37-strategy-evaluation-foundation.json"
const READINESS_PATH =
  ".planning/artifacts/v1.37-release-readiness.json"
const CORRECTION_PATH =
  ".planning/artifacts/v1.37-post-tag-ui-integration-correction.md"
const ADMISSION_PRODUCING_COMMIT =
  "d3893cc27a967f0b382a14571e274b5451dbdbbd"

/**
 * The persisted admission receipt seals these paths at
 * ADMISSION_PRODUCING_COMMIT. That historical binding must not be rewritten
 * merely because the operational checker advances.
 *
 * Before any authority-producing work runs, the resolver also requires every
 * live byte below to match the blob at the checkout's current HEAD. This is a
 * separate operational-authenticity boundary: the executing gate may advance
 * only as a committed Git object and cannot silently run dirty/substituted
 * bytes while reusing the historical sealed receipt.
 */
const SOURCE_PATHS = [
  "scripts/check-v1-37-audit-reproduction.ts",
  "scripts/check-v1-37-release-tag.ts",
  "scripts/lib/v1-38-foundation-admission.ts",
  "packages/spec/src/current-semantic-authority-source.ts",
  "packages/spec/src/current-semantic-authority-generated.ts",
  FOUNDATION_PATH,
  CORRECTION_PATH,
] as const

/**
 * Operational custody is deliberately broader than the immutable historical
 * admission binding above. The compatibility fixtures are executable inputs
 * to current-matrix admission, so dirty bytes there must fail closed without
 * rewriting the already-persisted v1.38 foundation receipt.
 */
export const V138_FOUNDATION_LIVE_SOURCE_PATHS = [
  ...SOURCE_PATHS,
  "packages/engine/src/compatibility-fixtures.test.ts",
] as const

type Sha256 = `sha256:${string}`

export type V138FoundationAdmissionStopReason =
  | "INPUT_SCHEMA_INVALID"
  | "INPUT_BOUNDS_INVALID"
  | "AUDIT_REPRODUCTION_DRIFT"
  | "ARCHIVE_MISMATCH"
  | "RELEASE_READINESS_DRIFT"
  | "TAG_NOT_ANNOTATED"
  | "TAG_OBJECT_MISMATCH"
  | "POST_TAG_CHECK_FAILED"
  | "SEMANTIC_TUPLE_DRIFT"
  | "RUNTIME_AUTHORITY_STALE"
  | "SOURCE_BINDING_DRIFT"
  | "CORRECTION_LINEAGE_UNEXPLAINED"

export interface V138FoundationAdmissionInput {
  schemaVersion: "v1.38-foundation-admission-input-v1"
  audit: {
    schemaVersion: "v1.37-audit-reproduction-receipt-v1"
    status: "passed-exact"
    joinSha256: Sha256
    resolvedJoinSha256: Sha256
  }
  release: {
    tagName: "v1.37"
    tagObject: string
    resolvedTagObject: string
    tagObjectType: string
    archiveCommit: string
    resolvedTagTarget: string
    releaseReadinessSha256: Sha256
    resolvedReleaseReadinessSha256: Sha256
    postTag: V137ReleaseTagResult
    postTagResultSha256: Sha256
  }
  semanticAuthority: {
    schemaVersion: "current-semantic-authority-generated-v1"
    semanticAuthorityKey: string
    tupleId: Sha256
    tuple: {
      rules: string
      engine: string
      runtimeAbi: string
      chronicle: string
      arenaCatalog: string
      setPolicy: string
    }
    sourceSha256: Sha256
    outputSha256: Sha256
  }
  runtimeAuthority: {
    foundationSchemaVersion: string
    foundationSha256: Sha256
    rulesVersion: string
    engineVersion: string
    runtimeAbiVersion: string
    chronicleVersion: string
    canonicalJsonVersion: string
    runtimeServiceVersion: string
    receiptVersion: string
    budgetContractVersion: string
    budgetProfileSha256: Sha256
    capabilityContractSha256: Sha256
    arenaCatalogVersion: string
    setPolicyVersion: string
    conformanceCertificateVersion: string
    corpusRootSha256: Sha256
    traceRootSha256: Sha256
    laneEvidenceRoot: Sha256
    runtimeAuthorityRoot: Sha256
  }
  correctionLineage: {
    recordPath: typeof CORRECTION_PATH
    recordSha256: Sha256
    committedRecordSha256: Sha256
    baseArchiveCommit: string
    implementationCommit: string
    implementationParent: string
    recordCommit: string
    recordParent: string
    changesGameplay: false
  }
  sources: {
    bindings: Array<{
      path: (typeof SOURCE_PATHS)[number]
      sha256: Sha256
      expectedSha256: Sha256
    }>
  }
}

export type V138FoundationAdmissionPassed = Readonly<{
  schemaVersion: "v1.38-foundation-admission-v1"
  status: "passed_exact"
  archiveCommit: string
  annotatedTagObject: string
  postTagProof08: true
  postTagResultSha256: Sha256
  auditReproductionRoot: Sha256
  semanticAuthorityKey: string
  semanticTupleId: Sha256
  runtimeAuthorityRoot: Sha256
  sourceBindingsRoot: Sha256
  correctionLineageRoot: Sha256
  laterCorrectionChangesGameplay: false
  admissionRoot: Sha256
}>

export type V138FoundationAdmissionStopped = Readonly<{
  schemaVersion: "v1.38-foundation-admission-v1"
  status: "stopped_integrity_foundation"
  reason: V138FoundationAdmissionStopReason
  repairAuthorized: false
  inputDigest: Sha256
}>

export type V138FoundationAdmissionResult =
  | V138FoundationAdmissionPassed
  | V138FoundationAdmissionStopped

const resolvedAuthorityInputs = new WeakSet<object>()

const deepFreeze = <T>(value: T): Readonly<T> => {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child)
    }
    Object.freeze(value)
  }
  return value
}

const rawSha256 = (value: string | Uint8Array): Sha256 =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`

const canonicalBytes = (value: unknown): Uint8Array | undefined => {
  const admitted = admitCanonicalJsonValue(value, {
    profile: "canonical-manifest",
  })
  return admitted.ok ? admitted.canonicalBytes : undefined
}

const canonicalSha256 = (value: unknown): Sha256 | undefined => {
  const bytes = canonicalBytes(value)
  return bytes === undefined ? undefined : rawSha256(bytes)
}

const framedLength = (length: number): Uint8Array => {
  const output = new Uint8Array(8)
  new DataView(output.buffer).setBigUint64(0, BigInt(length), false)
  return output
}

const domainSeparatedRoot = (domain: string, value: unknown): Sha256 => {
  const valueBytes = canonicalBytes(value)
  if (valueBytes === undefined) {
    throw new TypeError("V138_ADMISSION_CANONICAL_ENCODING_INVALID")
  }
  const domainBytes = new TextEncoder().encode(domain)
  return rawSha256(
    Buffer.concat([
      framedLength(domainBytes.byteLength),
      domainBytes,
      framedLength(valueBytes.byteLength),
      valueBytes,
    ]),
  )
}

const exactKeys = (value: unknown, expected: readonly string[]): boolean => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false
  }
  const actual = Object.keys(value).sort()
  const wanted = [...expected].sort()
  return (
    actual.length === wanted.length &&
    actual.every((key, index) => key === wanted[index])
  )
}

const isString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0 && value.length <= 512

const isSha256 = (value: unknown): value is Sha256 =>
  typeof value === "string" && SHA256.test(value)

const isGitObject = (value: unknown): value is string =>
  typeof value === "string" && GIT_OBJECT.test(value)

const safeInputDigest = (value: unknown): Sha256 => {
  const digest = canonicalSha256(value)
  return digest ?? rawSha256("v1.38:invalid-admission-input")
}

const stopped = (
  reason: V138FoundationAdmissionStopReason,
  input: unknown,
): V138FoundationAdmissionStopped =>
  deepFreeze({
    schemaVersion: "v1.38-foundation-admission-v1",
    status: "stopped_integrity_foundation",
    reason,
    repairAuthorized: false,
    inputDigest: safeInputDigest(input),
  })

const inputWithinBounds = (value: unknown): boolean => {
  const bytes = canonicalBytes(value)
  return bytes !== undefined && bytes.byteLength <= MAX_INPUT_BYTES
}

const hasInputShape = (
  value: unknown,
): value is V138FoundationAdmissionInput => {
  if (
    !exactKeys(value, [
      "audit",
      "correctionLineage",
      "release",
      "runtimeAuthority",
      "schemaVersion",
      "semanticAuthority",
      "sources",
    ])
  ) {
    return false
  }
  const input = value as Record<string, unknown>
  if (
    input.schemaVersion !== "v1.38-foundation-admission-input-v1" ||
    !exactKeys(input.audit, [
      "joinSha256",
      "resolvedJoinSha256",
      "schemaVersion",
      "status",
    ]) ||
    !exactKeys(input.release, [
      "archiveCommit",
      "postTag",
      "postTagResultSha256",
      "releaseReadinessSha256",
      "resolvedReleaseReadinessSha256",
      "resolvedTagObject",
      "resolvedTagTarget",
      "tagName",
      "tagObject",
      "tagObjectType",
    ]) ||
    !exactKeys(input.semanticAuthority, [
      "outputSha256",
      "schemaVersion",
      "semanticAuthorityKey",
      "sourceSha256",
      "tuple",
      "tupleId",
    ]) ||
    !exactKeys(
      (input.semanticAuthority as Record<string, unknown>).tuple,
      ["arenaCatalog", "chronicle", "engine", "rules", "runtimeAbi", "setPolicy"],
    ) ||
    !exactKeys(input.runtimeAuthority, [
      "arenaCatalogVersion",
      "budgetContractVersion",
      "budgetProfileSha256",
      "canonicalJsonVersion",
      "capabilityContractSha256",
      "conformanceCertificateVersion",
      "corpusRootSha256",
      "chronicleVersion",
      "engineVersion",
      "foundationSchemaVersion",
      "foundationSha256",
      "laneEvidenceRoot",
      "receiptVersion",
      "rulesVersion",
      "runtimeAbiVersion",
      "runtimeAuthorityRoot",
      "runtimeServiceVersion",
      "setPolicyVersion",
      "traceRootSha256",
    ]) ||
    !exactKeys(input.correctionLineage, [
      "baseArchiveCommit",
      "changesGameplay",
      "committedRecordSha256",
      "implementationCommit",
      "implementationParent",
      "recordCommit",
      "recordParent",
      "recordPath",
      "recordSha256",
    ]) ||
    !exactKeys(input.sources, ["bindings"])
  ) {
    return false
  }

  const typed = value as V138FoundationAdmissionInput
  if (
    typed.audit.schemaVersion !==
      "v1.37-audit-reproduction-receipt-v1" ||
    typed.audit.status !== "passed-exact" ||
    !isSha256(typed.audit.joinSha256) ||
    !isSha256(typed.audit.resolvedJoinSha256) ||
    typed.release.tagName !== "v1.37" ||
    !isGitObject(typed.release.tagObject) ||
    !isGitObject(typed.release.resolvedTagObject) ||
    !isString(typed.release.tagObjectType) ||
    !isGitObject(typed.release.archiveCommit) ||
    !isGitObject(typed.release.resolvedTagTarget) ||
    !isSha256(typed.release.releaseReadinessSha256) ||
    !isSha256(typed.release.resolvedReleaseReadinessSha256) ||
    !isSha256(typed.release.postTagResultSha256) ||
    !exactKeys(typed.release.postTag, [
      "findings",
      "mode",
      "proof08",
    ]) ||
    !Array.isArray(typed.release.postTag.findings) ||
    typed.release.postTag.findings.some(
      (finding) =>
        !exactKeys(finding, finding.path === undefined ? ["code"] : ["code", "path"]) ||
        !isString(finding.code) ||
        (finding.path !== undefined && !isString(finding.path)),
    ) ||
    typed.semanticAuthority.schemaVersion !==
      "current-semantic-authority-generated-v1" ||
    !isString(typed.semanticAuthority.semanticAuthorityKey) ||
    !isSha256(typed.semanticAuthority.tupleId) ||
    !isSha256(typed.semanticAuthority.sourceSha256) ||
    !isSha256(typed.semanticAuthority.outputSha256) ||
    Object.values(typed.semanticAuthority.tuple).some(
      (component) => !isString(component),
    )
  ) {
    return false
  }

  const runtime = typed.runtimeAuthority
  if (
    ![
      runtime.foundationSchemaVersion,
      runtime.rulesVersion,
      runtime.engineVersion,
      runtime.runtimeAbiVersion,
      runtime.chronicleVersion,
      runtime.canonicalJsonVersion,
      runtime.runtimeServiceVersion,
      runtime.receiptVersion,
      runtime.budgetContractVersion,
      runtime.arenaCatalogVersion,
      runtime.setPolicyVersion,
      runtime.conformanceCertificateVersion,
    ].every(isString) ||
    ![
      runtime.foundationSha256,
      runtime.budgetProfileSha256,
      runtime.capabilityContractSha256,
      runtime.corpusRootSha256,
      runtime.traceRootSha256,
      runtime.laneEvidenceRoot,
      runtime.runtimeAuthorityRoot,
    ].every(isSha256)
  ) {
    return false
  }

  const correction = typed.correctionLineage
  if (
    correction.recordPath !== CORRECTION_PATH ||
    !isSha256(correction.recordSha256) ||
    !isSha256(correction.committedRecordSha256) ||
    !isGitObject(correction.baseArchiveCommit) ||
    !isGitObject(correction.implementationCommit) ||
    !isGitObject(correction.implementationParent) ||
    !isGitObject(correction.recordCommit) ||
    !isGitObject(correction.recordParent) ||
    correction.changesGameplay !== false ||
    !Array.isArray(typed.sources.bindings) ||
    typed.sources.bindings.length !== SOURCE_PATHS.length ||
    typed.sources.bindings.some(
      (binding) =>
        !exactKeys(binding, ["expectedSha256", "path", "sha256"]) ||
        !SOURCE_PATHS.includes(binding.path) ||
        !isSha256(binding.sha256) ||
        !isSha256(binding.expectedSha256),
    )
  ) {
    return false
  }

  return true
}

const runtimeAuthorityPayload = (
  runtime: V138FoundationAdmissionInput["runtimeAuthority"],
): JsonValue => ({
  foundationSchemaVersion: runtime.foundationSchemaVersion,
  foundationSha256: runtime.foundationSha256,
  rulesVersion: runtime.rulesVersion,
  engineVersion: runtime.engineVersion,
  runtimeAbiVersion: runtime.runtimeAbiVersion,
  chronicleVersion: runtime.chronicleVersion,
  canonicalJsonVersion: runtime.canonicalJsonVersion,
  runtimeServiceVersion: runtime.runtimeServiceVersion,
  receiptVersion: runtime.receiptVersion,
  budgetContractVersion: runtime.budgetContractVersion,
  budgetProfileSha256: runtime.budgetProfileSha256,
  capabilityContractSha256: runtime.capabilityContractSha256,
  arenaCatalogVersion: runtime.arenaCatalogVersion,
  setPolicyVersion: runtime.setPolicyVersion,
  conformanceCertificateVersion: runtime.conformanceCertificateVersion,
  corpusRootSha256: runtime.corpusRootSha256,
  traceRootSha256: runtime.traceRootSha256,
  laneEvidenceRoot: runtime.laneEvidenceRoot,
})

export const evaluateV138FoundationAdmission = (
  value: unknown,
  trusted: Readonly<V138FoundationAdmissionInput>,
): V138FoundationAdmissionResult => {
  if (
    trusted === null ||
    typeof trusted !== "object" ||
    !resolvedAuthorityInputs.has(trusted)
  ) {
    return stopped("SOURCE_BINDING_DRIFT", value)
  }
  if (!inputWithinBounds(value)) {
    return stopped("INPUT_BOUNDS_INVALID", value)
  }
  if (!hasInputShape(value)) {
    return stopped("INPUT_SCHEMA_INVALID", value)
  }
  const input = value

  if (input.audit.joinSha256 !== input.audit.resolvedJoinSha256) {
    return stopped("AUDIT_REPRODUCTION_DRIFT", input)
  }
  if (
    input.release.archiveCommit !== input.release.resolvedTagTarget ||
    input.release.archiveCommit !==
      input.correctionLineage.baseArchiveCommit
  ) {
    return stopped("ARCHIVE_MISMATCH", input)
  }
  if (input.release.tagObjectType !== "tag") {
    return stopped("TAG_NOT_ANNOTATED", input)
  }
  if (input.release.tagObject !== input.release.resolvedTagObject) {
    return stopped("TAG_OBJECT_MISMATCH", input)
  }
  if (
    input.release.releaseReadinessSha256 !==
    input.release.resolvedReleaseReadinessSha256
  ) {
    return stopped("RELEASE_READINESS_DRIFT", input)
  }
  if (
    input.release.postTag.mode !== "post-tag" ||
    input.release.postTag.proof08 !== true ||
    input.release.postTag.findings.length !== 0 ||
    canonicalSha256(input.release.postTag) !==
      input.release.postTagResultSha256
  ) {
    return stopped("POST_TAG_CHECK_FAILED", input)
  }

  const current = CURRENT_SEMANTIC_AUTHORITY_GENERATED
  if (
    input.semanticAuthority.schemaVersion !== current.schemaVersion ||
    input.semanticAuthority.semanticAuthorityKey !==
      CURRENT_SEMANTIC_AUTHORITY_KEY ||
    input.semanticAuthority.tupleId !== CURRENT_SEMANTIC_TUPLE_ID ||
    input.semanticAuthority.sourceSha256 !== current.sourceSha256 ||
    input.semanticAuthority.outputSha256 !== current.outputSha256 ||
    canonicalSha256(input.semanticAuthority.tuple) !==
      canonicalSha256(CURRENT_SEMANTIC_TUPLE)
  ) {
    return stopped("SEMANTIC_TUPLE_DRIFT", input)
  }

  const runtime = input.runtimeAuthority
  const runtimeRoot = domainSeparatedRoot(
    "cowards-game:v1.38:foundation-runtime-authority:v1",
    runtimeAuthorityPayload(runtime),
  )
  if (
    runtime.runtimeAuthorityRoot !== runtimeRoot ||
    runtime.foundationSchemaVersion !==
      "v1.37-strategy-evaluation-foundation-v1" ||
    runtime.rulesVersion !== CURRENT_SEMANTIC_TUPLE.rules ||
    runtime.engineVersion !== CURRENT_SEMANTIC_TUPLE.engine ||
    runtime.runtimeAbiVersion !== CURRENT_SEMANTIC_TUPLE.runtimeAbi ||
    runtime.chronicleVersion !== CURRENT_SEMANTIC_TUPLE.chronicle ||
    runtime.canonicalJsonVersion !== "canonical-json-v1.1" ||
    runtime.runtimeServiceVersion !== "runtime-execution-service-v1.18" ||
    runtime.receiptVersion !== "runtime-semantic-receipt-v1.18" ||
    runtime.budgetContractVersion !==
      "runtime-abi-v1.17-budget-capabilities-v1" ||
    runtime.arenaCatalogVersion !== CURRENT_SEMANTIC_TUPLE.arenaCatalog ||
    runtime.setPolicyVersion !== CURRENT_SEMANTIC_TUPLE.setPolicy ||
    runtime.conformanceCertificateVersion !==
      current.selection.conformanceCertificateVersion
  ) {
    return stopped("RUNTIME_AUTHORITY_STALE", input)
  }

  if (
    input.sources.bindings.map((binding) => binding.path).join("\0") !==
      SOURCE_PATHS.join("\0") ||
    input.sources.bindings.some(
      (binding) => binding.sha256 !== binding.expectedSha256,
    )
  ) {
    return stopped("SOURCE_BINDING_DRIFT", input)
  }

  const correction = input.correctionLineage
  if (
    correction.recordSha256 !== correction.committedRecordSha256 ||
    correction.implementationParent !== correction.baseArchiveCommit ||
    correction.recordParent !== correction.implementationCommit ||
    correction.changesGameplay !== false
  ) {
    return stopped("CORRECTION_LINEAGE_UNEXPLAINED", input)
  }
  if (canonicalSha256(input) !== canonicalSha256(trusted)) {
    return stopped("SOURCE_BINDING_DRIFT", input)
  }

  const sourceBindingsRoot = domainSeparatedRoot(
    "cowards-game:v1.38:foundation-source-bindings:v1",
    input.sources.bindings.map(({ path: bindingPath, sha256 }) => ({
      path: bindingPath,
      sha256,
    })),
  )
  const correctionLineageRoot = domainSeparatedRoot(
    "cowards-game:v1.38:foundation-correction-lineage:v1",
    correction,
  )
  const components = {
    archiveCommit: input.release.archiveCommit,
    annotatedTagObject: input.release.tagObject,
    postTagResultSha256: input.release.postTagResultSha256,
    auditReproductionRoot: input.audit.joinSha256,
    semanticAuthorityKey: input.semanticAuthority.semanticAuthorityKey,
    semanticTupleId: input.semanticAuthority.tupleId,
    runtimeAuthorityRoot: runtime.runtimeAuthorityRoot,
    sourceBindingsRoot,
    correctionLineageRoot,
  }
  const result: V138FoundationAdmissionPassed = {
    schemaVersion: "v1.38-foundation-admission-v1",
    status: "passed_exact",
    archiveCommit: components.archiveCommit,
    annotatedTagObject: components.annotatedTagObject,
    postTagProof08: true,
    postTagResultSha256: components.postTagResultSha256,
    auditReproductionRoot: components.auditReproductionRoot,
    semanticAuthorityKey: components.semanticAuthorityKey,
    semanticTupleId: components.semanticTupleId,
    runtimeAuthorityRoot: components.runtimeAuthorityRoot,
    sourceBindingsRoot: components.sourceBindingsRoot,
    correctionLineageRoot: components.correctionLineageRoot,
    laterCorrectionChangesGameplay: false,
    admissionRoot: domainSeparatedRoot(
      "cowards-game:v1.38:foundation-admission:v1",
      components,
    ),
  }
  assertPublicOutputLeakSafe(result, "v1.38 foundation admission")
  return deepFreeze(result)
}

const git = (repoRoot: string, args: readonly string[]): string =>
  execFileSync("git", [...args], {
    cwd: repoRoot,
    encoding: "utf8",
    maxBuffer: 2 * 1024 * 1024,
  }).trim()

const gitBlob = (
  repoRoot: string,
  commit: string,
  repoPath: string,
): string =>
  execFileSync("git", ["show", `${commit}:${repoPath}`], {
    cwd: repoRoot,
    encoding: "utf8",
    maxBuffer: 2 * 1024 * 1024,
  })

const gitBlobBytes = (
  repoRoot: string,
  commit: string,
  repoPath: string,
): Buffer =>
  execFileSync("git", ["show", `${commit}:${repoPath}`], {
    cwd: repoRoot,
    maxBuffer: 2 * 1024 * 1024,
  })

export const assertV138FoundationLiveSourceCustody = (
  repoRoot: string,
): void => {
  const producingCommit = git(repoRoot, [
    "rev-parse",
    "--verify",
    "HEAD^{commit}",
  ])
  for (const repoPath of V138_FOUNDATION_LIVE_SOURCE_PATHS) {
    const liveBytes = readFileSync(path.resolve(repoRoot, repoPath))
    const producingBytes = gitBlobBytes(
      repoRoot,
      producingCommit,
      repoPath,
    )
    if (
      liveBytes.byteLength !== producingBytes.byteLength ||
      !Buffer.from(liveBytes).equals(producingBytes)
    ) {
      throw new TypeError("V138_ADMISSION_LIVE_SOURCE_DRIFT")
    }
  }
}

const record = (value: unknown, code: string): Record<string, unknown> => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(code)
  }
  return value as Record<string, unknown>
}

const requiredString = (
  value: Record<string, unknown>,
  key: string,
  code: string,
): string => {
  const candidate = value[key]
  if (!isString(candidate)) throw new TypeError(code)
  return candidate
}

const parseCorrectionAuthority = (
  repoRoot: string,
): V138FoundationAdmissionInput["correctionLineage"] => {
  const recordBytes = readFileSync(path.join(repoRoot, CORRECTION_PATH), "utf8")
  const archiveMatch = recordBytes.match(
    /`([0-9a-f]{40})`\. The independent post-tag checker/u,
  )
  const implementationMatch = recordBytes.match(
    /committed as\s+`([0-9a-f]{8,40})` \(`fix\(web\): preserve fail-closed runtime semantics`\)/u,
  )
  if (archiveMatch?.[1] === undefined || implementationMatch?.[1] === undefined) {
    throw new TypeError("V138_ADMISSION_CORRECTION_RECORD_INVALID")
  }
  const implementationCommit = git(repoRoot, [
    "rev-parse",
    `${implementationMatch[1]}^{commit}`,
  ])
  const recordCommit = git(repoRoot, [
    "log",
    "--format=%H",
    "--diff-filter=A",
    "-1",
    "--",
    CORRECTION_PATH,
  ])
  const implementationParent = git(repoRoot, [
    "rev-parse",
    `${implementationCommit}^`,
  ])
  const recordParent = git(repoRoot, ["rev-parse", `${recordCommit}^`])
  const committedRecordBytes = gitBlob(repoRoot, recordCommit, CORRECTION_PATH)
  return {
    recordPath: CORRECTION_PATH,
    recordSha256: rawSha256(recordBytes),
    committedRecordSha256: rawSha256(committedRecordBytes),
    baseArchiveCommit: archiveMatch[1],
    implementationCommit,
    implementationParent,
    recordCommit,
    recordParent,
    changesGameplay: false,
  }
}

const auditInput = (
  receipt: V137AuditReproductionReceipt,
): V138FoundationAdmissionInput["audit"] => ({
  schemaVersion: receipt.schemaVersion,
  status: receipt.status,
  joinSha256: receipt.hashes.joinSha256,
  resolvedJoinSha256: receipt.hashes.joinSha256,
})

const releaseInput = (
  repoRoot: string,
  correction: V138FoundationAdmissionInput["correctionLineage"],
): V138FoundationAdmissionInput["release"] => {
  const tagObject = git(repoRoot, ["rev-parse", "refs/tags/v1.37"])
  const archiveCommit = git(repoRoot, ["rev-parse", "refs/tags/v1.37^{}"])
  const tagObjectType = git(repoRoot, ["cat-file", "-t", tagObject])
  const readinessBytes = gitBlob(repoRoot, archiveCommit, READINESS_PATH)
  const postTag = checkV137ReleaseTag({
    repoRoot,
    mode: "post-tag",
    expectedArchiveCommit: correction.baseArchiveCommit,
  })
  return {
    tagName: "v1.37",
    tagObject,
    resolvedTagObject: tagObject,
    tagObjectType,
    archiveCommit,
    resolvedTagTarget: archiveCommit,
    releaseReadinessSha256: rawSha256(readinessBytes),
    resolvedReleaseReadinessSha256: rawSha256(readinessBytes),
    postTag,
    postTagResultSha256: canonicalSha256(postTag) as Sha256,
  }
}

const runtimeInput = (
  foundationBytes: string,
): V138FoundationAdmissionInput["runtimeAuthority"] => {
  const foundation = record(
    JSON.parse(foundationBytes),
    "V138_ADMISSION_FOUNDATION_INVALID",
  )
  const authority = record(
    foundation.authority,
    "V138_ADMISSION_FOUNDATION_AUTHORITY_INVALID",
  )
  const arenas = record(
    foundation.arenas,
    "V138_ADMISSION_FOUNDATION_ARENAS_INVALID",
  )
  const setPolicy = record(
    foundation.setPolicy,
    "V138_ADMISSION_FOUNDATION_SET_POLICY_INVALID",
  )
  const conformance = record(
    foundation.conformance,
    "V138_ADMISSION_FOUNDATION_CONFORMANCE_INVALID",
  )
  if (!Array.isArray(foundation.lanes)) {
    throw new TypeError("V138_ADMISSION_FOUNDATION_LANES_INVALID")
  }
  const laneEvidence = foundation.lanes.map((value) => {
    const lane = record(value, "V138_ADMISSION_FOUNDATION_LANE_INVALID")
    return {
      languageId: requiredString(
        lane,
        "languageId",
        "V138_ADMISSION_FOUNDATION_LANE_INVALID",
      ),
      laneId: requiredString(
        lane,
        "laneId",
        "V138_ADMISSION_FOUNDATION_LANE_INVALID",
      ),
      providerId: requiredString(
        lane,
        "providerId",
        "V138_ADMISSION_FOUNDATION_LANE_INVALID",
      ),
      certificateSha256: requiredString(
        lane,
        "certificateSha256",
        "V138_ADMISSION_FOUNDATION_LANE_INVALID",
      ),
      containmentPolicySha256: requiredString(
        lane,
        "containmentPolicySha256",
        "V138_ADMISSION_FOUNDATION_LANE_INVALID",
      ),
      counted: lane.counted,
      freshness: requiredString(
        lane,
        "freshness",
        "V138_ADMISSION_FOUNDATION_LANE_INVALID",
      ),
    }
  })
  const runtime = {
    foundationSchemaVersion: requiredString(
      foundation,
      "schemaVersion",
      "V138_ADMISSION_FOUNDATION_INVALID",
    ),
    foundationSha256: rawSha256(foundationBytes),
    rulesVersion: requiredString(
      authority,
      "rulesVersion",
      "V138_ADMISSION_FOUNDATION_AUTHORITY_INVALID",
    ),
    engineVersion: requiredString(
      authority,
      "engineVersion",
      "V138_ADMISSION_FOUNDATION_AUTHORITY_INVALID",
    ),
    runtimeAbiVersion: requiredString(
      authority,
      "runtimeAbiVersion",
      "V138_ADMISSION_FOUNDATION_AUTHORITY_INVALID",
    ),
    chronicleVersion: requiredString(
      authority,
      "chronicleVersion",
      "V138_ADMISSION_FOUNDATION_AUTHORITY_INVALID",
    ),
    canonicalJsonVersion: requiredString(
      authority,
      "canonicalJsonVersion",
      "V138_ADMISSION_FOUNDATION_AUTHORITY_INVALID",
    ),
    runtimeServiceVersion: requiredString(
      authority,
      "runtimeServiceVersion",
      "V138_ADMISSION_FOUNDATION_AUTHORITY_INVALID",
    ),
    receiptVersion: requiredString(
      authority,
      "receiptVersion",
      "V138_ADMISSION_FOUNDATION_AUTHORITY_INVALID",
    ),
    budgetContractVersion: requiredString(
      authority,
      "budgetContractVersion",
      "V138_ADMISSION_FOUNDATION_AUTHORITY_INVALID",
    ),
    budgetProfileSha256: requiredString(
      authority,
      "budgetProfileSha256",
      "V138_ADMISSION_FOUNDATION_AUTHORITY_INVALID",
    ) as Sha256,
    capabilityContractSha256: requiredString(
      authority,
      "capabilityContractSha256",
      "V138_ADMISSION_FOUNDATION_AUTHORITY_INVALID",
    ) as Sha256,
    arenaCatalogVersion: requiredString(
      arenas,
      "catalogVersion",
      "V138_ADMISSION_FOUNDATION_ARENAS_INVALID",
    ),
    setPolicyVersion: requiredString(
      setPolicy,
      "version",
      "V138_ADMISSION_FOUNDATION_SET_POLICY_INVALID",
    ),
    conformanceCertificateVersion: requiredString(
      conformance,
      "certificateVersion",
      "V138_ADMISSION_FOUNDATION_CONFORMANCE_INVALID",
    ),
    corpusRootSha256: requiredString(
      conformance,
      "corpusRootSha256",
      "V138_ADMISSION_FOUNDATION_CONFORMANCE_INVALID",
    ) as Sha256,
    traceRootSha256: requiredString(
      conformance,
      "traceRootSha256",
      "V138_ADMISSION_FOUNDATION_CONFORMANCE_INVALID",
    ) as Sha256,
    laneEvidenceRoot: domainSeparatedRoot(
      "cowards-game:v1.38:foundation-lane-evidence:v1",
      laneEvidence,
    ),
  }
  return {
    ...runtime,
    runtimeAuthorityRoot: domainSeparatedRoot(
      "cowards-game:v1.38:foundation-runtime-authority:v1",
      runtime,
    ),
  }
}

export const resolveV138FoundationAdmissionInput = (
  repoRoot: string,
): V138FoundationAdmissionInput => {
  const root = path.resolve(repoRoot)
  assertV138FoundationLiveSourceCustody(root)
  const correctionLineage = parseCorrectionAuthority(root)
  const release = releaseInput(root, correctionLineage)
  const foundationBytes = gitBlob(
    root,
    release.archiveCommit,
    FOUNDATION_PATH,
  )
  const runtimeAuthority = runtimeInput(foundationBytes)
  const current = CURRENT_SEMANTIC_AUTHORITY_GENERATED
  const sourceDigests = new Map<string, Sha256>()
  for (const repoPath of SOURCE_PATHS) {
    sourceDigests.set(
      repoPath,
      rawSha256(gitBlob(root, ADMISSION_PRODUCING_COMMIT, repoPath)),
    )
  }

  const input: V138FoundationAdmissionInput = {
    schemaVersion: "v1.38-foundation-admission-input-v1",
    audit: auditInput(runV137AuditReproductionGate(root)),
    release,
    semanticAuthority: {
      schemaVersion: current.schemaVersion,
      semanticAuthorityKey: current.selection.semanticAuthorityKey,
      tupleId: current.selection.tupleId,
      tuple: { ...current.selection.tuple },
      sourceSha256: current.sourceSha256,
      outputSha256: current.outputSha256,
    },
    runtimeAuthority,
    correctionLineage,
    sources: {
      bindings: SOURCE_PATHS.map((repoPath) => {
        const digest = sourceDigests.get(repoPath)
        if (digest === undefined) {
          throw new TypeError("V138_ADMISSION_SOURCE_BINDING_MISSING")
        }
        return {
          path: repoPath,
          sha256: digest,
          expectedSha256: digest,
        }
      }),
    },
  }
  const resolved = deepFreeze(input) as V138FoundationAdmissionInput
  resolvedAuthorityInputs.add(resolved)
  return resolved
}

export const renderV138FoundationAdmissionReceipt = (
  result: V138FoundationAdmissionResult,
): string => {
  if (result.status !== "passed_exact") {
    throw new TypeError(`V138_ADMISSION_STOPPED:${result.reason}`)
  }
  assertPublicOutputLeakSafe(result, "v1.38 foundation admission receipt")
  const bytes = canonicalBytes(result)
  if (bytes === undefined) {
    throw new TypeError("V138_ADMISSION_RECEIPT_ENCODING_INVALID")
  }
  return `${Buffer.from(bytes).toString("utf8")}\n`
}

export const generateV138FoundationAdmissionReceipt = (
  repoRoot: string,
): V138FoundationAdmissionPassed => {
  const trusted = resolveV138FoundationAdmissionInput(repoRoot)
  const result = evaluateV138FoundationAdmission(trusted, trusted)
  if (result.status !== "passed_exact") {
    throw new TypeError(`V138_ADMISSION_STOPPED:${result.reason}`)
  }
  return result
}

export const writeV138FoundationAdmissionReceipt = (
  repoRoot: string,
): V138FoundationAdmissionPassed => {
  const result = generateV138FoundationAdmissionReceipt(repoRoot)
  const target = path.join(repoRoot, ADMISSION_PATH)
  const rendered = renderV138FoundationAdmissionReceipt(result)
  if (existsSync(target)) {
    if (readFileSync(target, "utf8") !== rendered) {
      throw new TypeError("V138_ADMISSION_RECEIPT_CONFLICT")
    }
    return result
  }
  writeFileSync(target, rendered, { flag: "wx", mode: 0o644 })
  return result
}

export const checkV138FoundationAdmissionReceipt = (
  repoRoot: string,
): V138FoundationAdmissionPassed => {
  const result = generateV138FoundationAdmissionReceipt(repoRoot)
  const target = path.join(repoRoot, ADMISSION_PATH)
  if (
    !existsSync(target) ||
    readFileSync(target, "utf8") !==
      renderV138FoundationAdmissionReceipt(result)
  ) {
    throw new TypeError("V138_ADMISSION_RECEIPT_EDITED")
  }
  return result
}

const isDirectRun = (): boolean => {
  try {
    return (
      process.argv[1] !== undefined &&
      realpathSync(path.resolve(process.argv[1])) ===
        realpathSync(fileURLToPath(import.meta.url))
    )
  } catch {
    return false
  }
}

if (isDirectRun()) {
  try {
    const args = process.argv.slice(2)
    const repoRoot = path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      "../..",
    )
    const result =
      args.length === 1 && args[0] === "--write"
        ? writeV138FoundationAdmissionReceipt(repoRoot)
        : args.length === 1 && args[0] === "--check"
          ? checkV138FoundationAdmissionReceipt(repoRoot)
          : (() => {
              throw new TypeError("V138_ADMISSION_MODE_INVALID")
            })()
    process.stdout.write(
      `${JSON.stringify({
        status: result.status,
        admissionRoot: result.admissionRoot,
      })}\n`,
    )
  } catch (error) {
    process.stderr.write(
      `${error instanceof Error ? error.message : "V138_ADMISSION_FAILED"}\n`,
    )
    process.exitCode = 1
  }
}
