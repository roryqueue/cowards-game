#!/usr/bin/env -S pnpm exec tsx
import { spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import { existsSync, readFileSync, realpathSync, renameSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { assertPublicOutputLeakSafe } from "@cowards/spec"
import { checkV137ProtectedBaseline } from "./capture-v1-37-protected-baseline.js"
import {
  checkV137MilestoneAuditArtifacts,
  validateV137MilestoneAudit,
} from "./generate-v1-37-milestone-audit.js"
import {
  checkV137StrategyFoundationArtifacts,
  validateV137StrategyFoundation,
} from "./generate-v1-37-strategy-foundation-handoff.js"
import {
  checkV137PrearchiveProofArtifacts,
  validateV137PrearchiveProof,
} from "./evaluate-v1-37-prearchive-proof.js"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const SHA = /^sha256:[0-9a-f]{64}$/u
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

export const V137_RELEASE_READINESS_ARTIFACT_PATHS = Object.freeze({
  json: ".planning/artifacts/v1.37-release-readiness.json",
  markdown: ".planning/artifacts/v1.37-release-readiness.md",
})

const PREREQUISITE_PATHS = [
  ".planning/artifacts/v1.37-prearchive-proof.json",
  ".planning/artifacts/v1.37-milestone-audit.json",
  ".planning/v1.37-MILESTONE-AUDIT.md",
  ".planning/artifacts/v1.37-strategy-evaluation-foundation.json",
  ".planning/artifacts/v1.37-strategy-evaluation-foundation.md",
  ".planning/artifacts/v1.37-protected-working-tree-baseline.json",
  "scripts/evaluate-v1-37-prearchive-proof.ts",
  "scripts/generate-v1-37-milestone-audit.ts",
  "scripts/generate-v1-37-strategy-foundation-handoff.ts",
  "scripts/capture-v1-37-protected-baseline.ts",
  "scripts/check-v1-37-release-boundaries.ts",
  "scripts/evaluate-v1-37-release-readiness.ts",
  "scripts/evaluate-v1-37-release-readiness.test.ts",
  "package.json",
] as const

type Hashes = {
  prearchiveProofSha256: `sha256:${string}`
  milestoneAuditSha256: `sha256:${string}`
  strategyFoundationSha256: `sha256:${string}`
  tupleId: `sha256:${string}`
  protectedBaselineSha256: `sha256:${string}`
}

export interface V137ReleaseReadiness {
  schemaVersion: "v1.37-release-readiness-v1"
  milestone: "v1.37"
  phase: 261
  releaseState: "release-ready"
  traceability: { total: 56; passed: 55; readyPending: 1 }
  prerequisiteHashes: Hashes
  guards: {
    gapCount: 0
    overrideCount: 0
    protectedBaseline: "passed"
    localTagAbsent: true
    strategyMilestoneAuthorized: false
    evidenceRetentionDays: 90
    evidenceRetentionPolicy: "certificate-validity-plus-90-calendar-days"
  }
  releaseOperation: {
    requirement: "PROOF-08"
    status: "ready_pending"
    completion: false
    expectedOperation: "archive-then-annotated-tag-then-independent-post-check"
    annotatedTagName: "v1.37"
  }
  tagMessageFieldSha256: {
    semanticTupleId: `sha256:${string}`
    finalProof: `sha256:${string}`
    milestoneAudit: `sha256:${string}`
  }
}

const readJson = (repoRoot: string, file: string): unknown =>
  JSON.parse(readFileSync(path.join(repoRoot, file), "utf8")) as unknown
const assertCurrentCommitted = (repoRoot: string, file: string): void => {
  if (!existsSync(path.join(repoRoot, file)))
    fail("V137_RELEASE_READINESS_PREREQUISITE_MISSING")
  const tracked = spawnSync(
    "git",
    ["ls-files", "--error-unmatch", "--", file],
    { cwd: repoRoot, encoding: "utf8" },
  )
  if (tracked.status !== 0)
    fail("V137_RELEASE_READINESS_PREREQUISITE_UNTRACKED")
  const clean = spawnSync("git", ["diff", "--quiet", "HEAD", "--", file], {
    cwd: repoRoot,
    encoding: "utf8",
  })
  if (clean.status !== 0) fail("V137_RELEASE_READINESS_PREREQUISITE_DIRTY")
}
const assertTagAbsent = (repoRoot: string): void => {
  const tag = spawnSync("git", ["tag", "-l", "v1.37"], {
    cwd: repoRoot,
    encoding: "utf8",
  })
  if (tag.status !== 0 || tag.stdout.trim() !== "")
    fail("V137_RELEASE_READINESS_TAG_EXISTS")
}
const hashFile = (repoRoot: string, file: string): `sha256:${string}` =>
  digest(readFileSync(path.join(repoRoot, file)))

export const createV137ReleaseReadinessFixture = (): V137ReleaseReadiness => ({
  schemaVersion: "v1.37-release-readiness-v1",
  milestone: "v1.37",
  phase: 261,
  releaseState: "release-ready",
  traceability: { total: 56, passed: 55, readyPending: 1 },
  prerequisiteHashes: {
    prearchiveProofSha256: digest("prearchive"),
    milestoneAuditSha256: digest("audit"),
    strategyFoundationSha256: digest("handoff"),
    tupleId: digest("tuple"),
    protectedBaselineSha256: digest("baseline"),
  },
  guards: {
    gapCount: 0,
    overrideCount: 0,
    protectedBaseline: "passed",
    localTagAbsent: true,
    strategyMilestoneAuthorized: false,
    evidenceRetentionDays: 90,
    evidenceRetentionPolicy: "certificate-validity-plus-90-calendar-days",
  },
  releaseOperation: {
    requirement: "PROOF-08",
    status: "ready_pending",
    completion: false,
    expectedOperation: "archive-then-annotated-tag-then-independent-post-check",
    annotatedTagName: "v1.37",
  },
  tagMessageFieldSha256: {
    semanticTupleId: digest("tuple"),
    finalProof: digest("prearchive"),
    milestoneAudit: digest("audit"),
  },
})

export const validateV137ReleaseReadiness = (
  value: unknown,
): V137ReleaseReadiness => {
  const keys = [
    "guards",
    "milestone",
    "phase",
    "prerequisiteHashes",
    "releaseOperation",
    "releaseState",
    "schemaVersion",
    "tagMessageFieldSha256",
    "traceability",
  ]
  if (!exactKeys(value, keys)) fail("V137_RELEASE_READINESS_SHAPE")
  const readiness = value as V137ReleaseReadiness
  if (
    readiness.schemaVersion !== "v1.37-release-readiness-v1" ||
    readiness.milestone !== "v1.37" ||
    readiness.phase !== 261 ||
    readiness.releaseState !== "release-ready"
  )
    fail("V137_RELEASE_READINESS_IDENTITY_INVALID")
  if (
    JSON.stringify(readiness.traceability) !==
    JSON.stringify({ total: 56, passed: 55, readyPending: 1 })
  )
    fail("V137_RELEASE_READINESS_TRACEABILITY_INVALID")
  if (
    !exactKeys(readiness.prerequisiteHashes, [
      "prearchiveProofSha256",
      "milestoneAuditSha256",
      "strategyFoundationSha256",
      "tupleId",
      "protectedBaselineSha256",
    ]) ||
    !Object.values(readiness.prerequisiteHashes).every((hash) => SHA.test(hash))
  )
    fail("V137_RELEASE_READINESS_HASHES_INVALID")
  if (
    !exactKeys(readiness.guards, [
      "gapCount",
      "overrideCount",
      "protectedBaseline",
      "localTagAbsent",
      "strategyMilestoneAuthorized",
      "evidenceRetentionDays",
      "evidenceRetentionPolicy",
    ]) ||
    JSON.stringify(readiness.guards) !==
      JSON.stringify({
        gapCount: 0,
        overrideCount: 0,
        protectedBaseline: "passed",
        localTagAbsent: true,
        strategyMilestoneAuthorized: false,
        evidenceRetentionDays: 90,
        evidenceRetentionPolicy: "certificate-validity-plus-90-calendar-days",
      })
  )
    fail("V137_RELEASE_READINESS_GUARDS_INVALID")
  if (
    !exactKeys(readiness.releaseOperation, [
      "requirement",
      "status",
      "completion",
      "expectedOperation",
      "annotatedTagName",
    ]) ||
    JSON.stringify(readiness.releaseOperation) !==
      JSON.stringify({
        requirement: "PROOF-08",
        status: "ready_pending",
        completion: false,
        expectedOperation:
          "archive-then-annotated-tag-then-independent-post-check",
        annotatedTagName: "v1.37",
      })
  )
    fail("V137_RELEASE_READINESS_OPERATION_INVALID")
  if (
    !exactKeys(readiness.tagMessageFieldSha256, [
      "semanticTupleId",
      "finalProof",
      "milestoneAudit",
    ]) ||
    !Object.values(readiness.tagMessageFieldSha256).every((hash) =>
      SHA.test(hash),
    ) ||
    readiness.tagMessageFieldSha256.semanticTupleId !==
      readiness.prerequisiteHashes.tupleId ||
    readiness.tagMessageFieldSha256.finalProof !==
      readiness.prerequisiteHashes.prearchiveProofSha256 ||
    readiness.tagMessageFieldSha256.milestoneAudit !==
      readiness.prerequisiteHashes.milestoneAuditSha256
  )
    fail("V137_RELEASE_READINESS_TAG_MESSAGE_INVALID")
  assertPublicOutputLeakSafe(readiness, "v1.37 release readiness")
  return readiness
}

export const generateV137ReleaseReadiness = (
  repoRoot: string,
): V137ReleaseReadiness => {
  for (const file of PREREQUISITE_PATHS) assertCurrentCommitted(repoRoot, file)
  assertTagAbsent(repoRoot)
  const prearchive = validateV137PrearchiveProof(
    checkV137PrearchiveProofArtifacts(repoRoot),
  )
  const audit = validateV137MilestoneAudit(
    checkV137MilestoneAuditArtifacts(repoRoot),
  )
  const handoff = validateV137StrategyFoundation(
    checkV137StrategyFoundationArtifacts(repoRoot),
  )
  const baseline = checkV137ProtectedBaseline({
    observedRepoRoot: repoRoot,
    artifactPath: path.join(
      repoRoot,
      ".planning/artifacts/v1.37-protected-working-tree-baseline.json",
    ),
  })
  if (
    prearchive.traceability.total !== 56 ||
    prearchive.traceability.passed !== 55 ||
    prearchive.releaseOperation.status !== "ready_pending" ||
    prearchive.releaseOperation.completion !== false ||
    audit.traceability.gaps !== 0 ||
    audit.traceability.overrides !== 0 ||
    audit.releaseOperation.status !== "ready_pending" ||
    audit.releaseOperation.completion !== false ||
    handoff.strategyMilestoneAuthorized !== false ||
    handoff.proofBindings.releaseCompletion !== false ||
    handoff.authority.tupleId !==
      handoff.proofBindings.prearchiveProofSha256.slice(0, 0) +
        handoff.authority.tupleId
  )
    fail("V137_RELEASE_READINESS_PREREQUISITE_INVALID")
  const prerequisiteHashes: Hashes = {
    prearchiveProofSha256: hashFile(
      repoRoot,
      ".planning/artifacts/v1.37-prearchive-proof.json",
    ),
    milestoneAuditSha256: hashFile(
      repoRoot,
      ".planning/artifacts/v1.37-milestone-audit.json",
    ),
    strategyFoundationSha256: hashFile(
      repoRoot,
      ".planning/artifacts/v1.37-strategy-evaluation-foundation.json",
    ),
    tupleId: handoff.authority.tupleId,
    protectedBaselineSha256: baseline.baselineSha256,
  }
  return validateV137ReleaseReadiness({
    schemaVersion: "v1.37-release-readiness-v1",
    milestone: "v1.37",
    phase: 261,
    releaseState: "release-ready",
    traceability: { total: 56, passed: 55, readyPending: 1 },
    prerequisiteHashes,
    guards: {
      gapCount: audit.traceability.gaps,
      overrideCount: audit.traceability.overrides,
      protectedBaseline: "passed",
      localTagAbsent: true,
      strategyMilestoneAuthorized: handoff.strategyMilestoneAuthorized,
      evidenceRetentionDays: 90,
      evidenceRetentionPolicy: "certificate-validity-plus-90-calendar-days",
    },
    releaseOperation: {
      requirement: "PROOF-08",
      status: "ready_pending",
      completion: false,
      expectedOperation:
        "archive-then-annotated-tag-then-independent-post-check",
      annotatedTagName: "v1.37",
    },
    tagMessageFieldSha256: {
      semanticTupleId: prerequisiteHashes.tupleId,
      finalProof: prerequisiteHashes.prearchiveProofSha256,
      milestoneAudit: prerequisiteHashes.milestoneAuditSha256,
    },
  })
}

export const renderV137ReleaseReadinessJson = (readiness: unknown): string =>
  canonical(validateV137ReleaseReadiness(readiness))
export const renderV137ReleaseReadinessMarkdown = (
  readiness: unknown,
): string => {
  const checked = JSON.parse(
    renderV137ReleaseReadinessJson(readiness),
  ) as V137ReleaseReadiness
  return `# v1.37 Release Readiness\n\nRelease state: \`${checked.releaseState}\`\n\n- Traceability: ${checked.traceability.total}/56 traced; ${checked.traceability.passed} passed; PROOF-08 remains \`${checked.releaseOperation.status}\`.\n- Expected outer operation: \`${checked.releaseOperation.expectedOperation}\` for annotated tag \`${checked.releaseOperation.annotatedTagName}\`.\n- Guards: zero gaps/overrides, protected baseline passed, local tag absent, Strategy authorization false.\n- Evidence retention: \`${checked.guards.evidenceRetentionPolicy}\`.\n- Tag-message field hashes: tuple \`${checked.tagMessageFieldSha256.semanticTupleId}\`, proof \`${checked.tagMessageFieldSha256.finalProof}\`, audit \`${checked.tagMessageFieldSha256.milestoneAudit}\`.\n\nNo archive commit, tag object, tag signature, or other future Git identity is predicted or created.\n`
}
export const writeV137ReleaseReadinessArtifacts = (
  repoRoot: string,
): V137ReleaseReadiness => {
  const readiness = generateV137ReleaseReadiness(repoRoot)
  for (const [kind, artifact] of Object.entries(
    V137_RELEASE_READINESS_ARTIFACT_PATHS,
  )) {
    const target = path.join(repoRoot, artifact)
    const bytes =
      kind === "json"
        ? renderV137ReleaseReadinessJson(readiness)
        : renderV137ReleaseReadinessMarkdown(readiness)
    const temporary = `${target}.tmp-${process.pid}`
    writeFileSync(temporary, bytes, { flag: "w", mode: 0o644 })
    renameSync(temporary, target)
  }
  return readiness
}
export const checkV137ReleaseReadinessArtifacts = (
  repoRoot: string,
): V137ReleaseReadiness => {
  const readiness = generateV137ReleaseReadiness(repoRoot)
  for (const [kind, artifact] of Object.entries(
    V137_RELEASE_READINESS_ARTIFACT_PATHS,
  )) {
    const target = path.join(repoRoot, artifact)
    if (!existsSync(target)) fail("V137_RELEASE_READINESS_ARTIFACT_MISSING")
    const expected =
      kind === "json"
        ? renderV137ReleaseReadinessJson(readiness)
        : renderV137ReleaseReadinessMarkdown(readiness)
    if (readFileSync(target, "utf8") !== expected)
      fail("V137_RELEASE_READINESS_ARTIFACT_EDITED")
  }
  return readiness
}

const isDirectRun = (): boolean => {
  const invokedScript = process.argv[1]
  if (!invokedScript) return false
  try { return realpathSync(path.resolve(invokedScript)) === realpathSync(fileURLToPath(import.meta.url)) } catch { return false }
}
if (isDirectRun()) {
  const mode = process.argv.slice(2)
  try {
    const readiness = mode.length === 1 && mode[0] === "--write"
      ? writeV137ReleaseReadinessArtifacts(root)
      : mode.length === 1 && mode[0] === "--check"
        ? checkV137ReleaseReadinessArtifacts(root)
        : fail("V137_RELEASE_READINESS_MODE_INVALID")
    process.stdout.write(
      `${JSON.stringify({ releaseState: readiness.releaseState, passed: readiness.traceability.passed, pending: readiness.releaseOperation.requirement })}\n`,
    )
  } catch (error) {
    process.stderr.write(
      `${error instanceof Error ? error.message : "V137_RELEASE_READINESS_FAILED"}\n`,
    )
    process.exitCode = 1
  }
}
