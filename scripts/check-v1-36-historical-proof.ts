#!/usr/bin/env -S pnpm exec tsx
import { createHash } from "node:crypto"
import { execFileSync, spawnSync } from "node:child_process"
import {
  chmodSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

const defaultRepoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
)
const defaultManifestPath =
  ".planning/artifacts/v1.37-v1.36-historical-proof-dispatch.json"
const pinnedTagObject = "10177daad80cd0bcbecaaae51f46da5f7f08c6ea"
const pinnedCommit = "38f4a83db9298502c12db44cd66d026878803d20"

const requiredArtifacts = [
  ".planning/artifacts/v1.36-competition-surface-inventory.json",
  ".planning/artifacts/v1.36-competition-surface-inventory.md",
  ".planning/artifacts/v1.36-competition-service-proof.json",
  ".planning/artifacts/v1.36-competition-service-proof.md",
  ".planning/artifacts/v1.36-governance-boundary-proof.json",
  ".planning/artifacts/v1.36-governance-boundary-proof.md",
  ".planning/artifacts/v1.36-final-proof.json",
  ".planning/artifacts/v1.36-final-proof.md",
] as const
const requiredSources = [
  "scripts/evaluate-v1-36-competition-policy.ts",
  "scripts/evaluate-v1-36-competition-policy.test.ts",
  "scripts/evaluate-v1-36-service-proof.ts",
  "scripts/evaluate-v1-36-service-proof.test.ts",
  "scripts/evaluate-v1-36-competition-boundaries.ts",
  "scripts/evaluate-v1-36-competition-boundaries.test.ts",
  "scripts/evaluate-v1-36-final-proof.ts",
  "scripts/evaluate-v1-36-final-proof.test.ts",
  "apps/web/e2e/v1-36-competition-service-proof.spec.ts",
  "packages/spec/src/competition-policy-v1-36.ts",
  "scripts/check-boundary-monitors.ts",
] as const

export interface V136HistoricalBlobPin {
  path: string
  blob: string
  sha256: string
  bytes: number
}

export interface V136HistoricalProofDispatch {
  schemaVersion: "v1.37-v1.36-historical-proof-dispatch-v1"
  milestone: "v1.37"
  historicalVersion: "v1.36"
  tag: {
    name: "v1.36"
    object: string
    peeledCommit: string
    type: "annotated"
  }
  validation: {
    mode: "archived-export-read-only"
    evaluationInstant: string
    writeModesForbidden: true
  }
  artifacts: readonly V136HistoricalBlobPin[]
  sources: readonly V136HistoricalBlobPin[]
}

export type V136HistoricalProofFindingCode =
  | "MANIFEST_INVALID"
  | "ENTRY_SET_MISMATCH"
  | "TAG_OBJECT_MISMATCH"
  | "PEELED_COMMIT_MISMATCH"
  | "ARCHIVED_BLOB_MISMATCH"
  | "WORKING_ARTIFACT_MISSING"
  | "WORKING_ARTIFACT_MISMATCH"
  | "ARCHIVED_VALIDATOR_FAILED"
  | "ARCHIVED_VALIDATOR_TIMEOUT"
  | "ARCHIVED_VALIDATOR_WRITE_ATTEMPT"

export interface V136HistoricalProofFinding {
  code: V136HistoricalProofFindingCode
  path?: string
}

export interface V136HistoricalProofResult {
  findings: readonly V136HistoricalProofFinding[]
  artifactCount: number
  sourceCount: number
  archivedValidators: readonly string[]
}

export interface CheckV136HistoricalProofOptions {
  repoRoot?: string
  workingRoot?: string
  manifest?: unknown
  executeArchivedValidators?: boolean
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value)
const sha256 = (bytes: Uint8Array): string =>
  createHash("sha256").update(bytes).digest("hex")
const exactSet = (actual: readonly string[], expected: readonly string[]): boolean =>
  actual.length === expected.length &&
  [...actual].sort().every((entry, index) => entry === [...expected].sort()[index])

const parsePin = (value: unknown): V136HistoricalBlobPin => {
  if (!isRecord(value)) throw new Error("pin")
  const { path: repoPath, blob, sha256: digest, bytes } = value
  if (
    typeof repoPath !== "string" || repoPath.startsWith("/") || repoPath.includes("..") ||
    typeof blob !== "string" || !/^[0-9a-f]{40}$/u.test(blob) ||
    typeof digest !== "string" || !/^[0-9a-f]{64}$/u.test(digest) ||
    typeof bytes !== "number" || !Number.isSafeInteger(bytes) || bytes < 0
  ) throw new Error("pin")
  return { path: repoPath, blob, sha256: digest, bytes }
}

export const parseV136HistoricalProofDispatch = (
  value: unknown,
): V136HistoricalProofDispatch => {
  if (!isRecord(value) || !isRecord(value.tag) || !isRecord(value.validation)) {
    throw new Error("manifest")
  }
  if (
    value.schemaVersion !== "v1.37-v1.36-historical-proof-dispatch-v1" ||
    value.milestone !== "v1.37" ||
    value.historicalVersion !== "v1.36" ||
    value.tag.name !== "v1.36" ||
    value.tag.type !== "annotated" ||
    typeof value.tag.object !== "string" ||
    typeof value.tag.peeledCommit !== "string" ||
    value.validation.mode !== "archived-export-read-only" ||
    value.validation.writeModesForbidden !== true ||
    typeof value.validation.evaluationInstant !== "string" ||
    !Number.isFinite(Date.parse(value.validation.evaluationInstant)) ||
    !Array.isArray(value.artifacts) ||
    !Array.isArray(value.sources)
  ) throw new Error("manifest")
  return {
    schemaVersion: value.schemaVersion,
    milestone: value.milestone,
    historicalVersion: value.historicalVersion,
    tag: {
      name: value.tag.name,
      object: value.tag.object,
      peeledCommit: value.tag.peeledCommit,
      type: value.tag.type,
    },
    validation: {
      mode: value.validation.mode,
      evaluationInstant: value.validation.evaluationInstant,
      writeModesForbidden: true,
    },
    artifacts: value.artifacts.map(parsePin),
    sources: value.sources.map(parsePin),
  }
}

const gitText = (repoRoot: string, args: readonly string[]): string =>
  execFileSync("git", [...args], { cwd: repoRoot, encoding: "utf8" }).trim()
const gitBytes = (repoRoot: string, args: readonly string[]): Buffer =>
  execFileSync("git", [...args], { cwd: repoRoot, encoding: "buffer" })

const chmodTree = (root: string, writable: boolean): void => {
  if (!existsSync(root)) return
  const visit = (entryPath: string): void => {
    const stat = lstatSync(entryPath)
    if (stat.isSymbolicLink()) return
    if (stat.isDirectory()) {
      if (writable) chmodSync(entryPath, 0o755)
      for (const name of readdirSync(entryPath)) visit(path.join(entryPath, name))
      if (!writable) chmodSync(entryPath, 0o555)
      return
    }
    chmodSync(entryPath, writable ? 0o644 : 0o444)
  }
  visit(root)
}

const linkWorkspaceDependencyTrees = (
  repoRoot: string,
  snapshotRoot: string,
): void => {
  const visit = (relativeDirectory: string): void => {
    const sourceDirectory = path.join(repoRoot, relativeDirectory)
    if (!existsSync(sourceDirectory)) return
    for (const name of readdirSync(sourceDirectory)) {
      if ([".git", ".next", ".planning", "coverage", "dist"].includes(name)) {
        continue
      }
      const relativePath = path.join(relativeDirectory, name)
      const sourcePath = path.join(repoRoot, relativePath)
      if (name === "node_modules" && lstatSync(sourcePath).isDirectory()) {
        const targetPath = path.join(snapshotRoot, relativePath)
        if (existsSync(path.dirname(targetPath)) && !existsSync(targetPath)) {
          symlinkSync(sourcePath, targetPath)
        }
        continue
      }
      if (lstatSync(sourcePath).isDirectory()) visit(relativePath)
    }
  }
  visit("apps")
  visit("packages")
}

const archivedHarness = (evaluationInstant: string): string => `
import { checkV136CompetitionPolicyScan, checkV136CompetitionSurfaceInventoryArtifacts, createV136CompetitionPolicyPhase249ScanSuppressions } from "./scripts/evaluate-v1-36-competition-policy.ts"
import { checkV136ServiceProofArtifacts } from "./scripts/evaluate-v1-36-service-proof.ts"
import { checkV136CompetitionBoundaryArtifacts } from "./scripts/evaluate-v1-36-competition-boundaries.ts"
import { checkV136FinalProofArtifacts } from "./scripts/evaluate-v1-36-final-proof.ts"
const repo = process.cwd()
const now = new Date(${JSON.stringify(evaluationInstant)})
const policyOptions = { repoRoot: repo, suppressions: createV136CompetitionPolicyPhase249ScanSuppressions({ repoRoot: repo, includePostureDeferrals: true }) }
const errors = [
  ...checkV136CompetitionSurfaceInventoryArtifacts(policyOptions),
  ...checkV136CompetitionPolicyScan(policyOptions),
  ...checkV136ServiceProofArtifacts(repo, { now, requireServiceProof: true }),
  ...checkV136CompetitionBoundaryArtifacts(repo, { now, requireServiceProof: true }),
  ...checkV136FinalProofArtifacts(repo, { now, requireServiceProof: true, boundaryOptions: { now, requireServiceProof: true } }),
]
process.stdout.write(
  JSON.stringify({ ok: errors.length === 0, errorCount: errors.length }),
  () => process.exit(errors.length === 0 ? 0 : 1),
)
`

const runArchivedValidators = (
  repoRoot: string,
  commit: string,
  evaluationInstant: string,
  artifacts: readonly V136HistoricalBlobPin[],
): "passed" | "failed" | "timeout" | "write-attempt" => {
  const snapshotRoot = mkdtempSync(path.join(tmpdir(), "cowards-v136-archive-"))
  try {
    const archive = execFileSync("git", ["archive", "--format=tar", commit], {
      cwd: repoRoot,
      encoding: "buffer",
      maxBuffer: 64 * 1024 * 1024,
    })
    execFileSync("tar", ["-xf", "-", "-C", snapshotRoot], { input: archive })
    symlinkSync(path.join(repoRoot, "node_modules"), path.join(snapshotRoot, "node_modules"))
    linkWorkspaceDependencyTrees(repoRoot, snapshotRoot)
    const harnessPath = path.join(snapshotRoot, ".gsd-v136-validate.ts")
    writeFileSync(harnessPath, archivedHarness(evaluationInstant), { mode: 0o444 })
    const before = artifacts.map((entry) => {
      const absolutePath = path.join(snapshotRoot, entry.path)
      return { path: entry.path, hash: sha256(readFileSync(absolutePath)), mtimeMs: statSync(absolutePath).mtimeMs }
    })
    chmodTree(snapshotRoot, false)
    const result = spawnSync(
      path.join(repoRoot, "node_modules/.bin/tsx"),
      [".gsd-v136-validate.ts"],
      { cwd: snapshotRoot, encoding: "utf8", timeout: 300_000 },
    )
    const after = artifacts.map((entry) => {
      const absolutePath = path.join(snapshotRoot, entry.path)
      return { path: entry.path, hash: sha256(readFileSync(absolutePath)), mtimeMs: statSync(absolutePath).mtimeMs }
    })
    if (JSON.stringify(before) !== JSON.stringify(after)) return "write-attempt"
    if (result.error?.name === "Error" && result.error.message.includes("ETIMEDOUT")) return "timeout"
    if (result.status !== 0) return "failed"
    try {
      const parsed = JSON.parse(result.stdout) as { ok?: unknown; errorCount?: unknown }
      return parsed.ok === true && parsed.errorCount === 0 ? "passed" : "failed"
    } catch {
      return "failed"
    }
  } finally {
    chmodTree(snapshotRoot, true)
    rmSync(snapshotRoot, { recursive: true, force: true })
  }
}

export const checkV136HistoricalProof = async (
  options: CheckV136HistoricalProofOptions = {},
): Promise<V136HistoricalProofResult> => {
  const repoRoot = options.repoRoot ?? defaultRepoRoot
  const workingRoot = options.workingRoot ?? repoRoot
  let manifest: V136HistoricalProofDispatch
  try {
    manifest = parseV136HistoricalProofDispatch(
      options.manifest ?? JSON.parse(readFileSync(path.join(repoRoot, defaultManifestPath), "utf8")),
    )
  } catch {
    return { findings: [{ code: "MANIFEST_INVALID" }], artifactCount: 0, sourceCount: 0, archivedValidators: [] }
  }
  const findings: V136HistoricalProofFinding[] = []
  if (!exactSet(manifest.artifacts.map((entry) => entry.path), requiredArtifacts) ||
      !exactSet(manifest.sources.map((entry) => entry.path), requiredSources)) {
    findings.push({ code: "ENTRY_SET_MISMATCH" })
  }
  if (manifest.tag.object !== pinnedTagObject ||
      gitText(repoRoot, ["rev-parse", "refs/tags/v1.36"]) !== pinnedTagObject) {
    findings.push({ code: "TAG_OBJECT_MISMATCH" })
  }
  if (manifest.tag.peeledCommit !== pinnedCommit ||
      gitText(repoRoot, ["rev-parse", "v1.36^{}"] ) !== pinnedCommit) {
    findings.push({ code: "PEELED_COMMIT_MISMATCH" })
  }
  for (const entry of [...manifest.artifacts, ...manifest.sources]) {
    try {
      const blob = gitText(repoRoot, ["rev-parse", `${pinnedCommit}:${entry.path}`])
      const bytes = gitBytes(repoRoot, ["cat-file", "blob", blob])
      if (blob !== entry.blob || bytes.length !== entry.bytes || sha256(bytes) !== entry.sha256) {
        findings.push({ code: "ARCHIVED_BLOB_MISMATCH", path: entry.path })
      }
    } catch {
      findings.push({ code: "ARCHIVED_BLOB_MISMATCH", path: entry.path })
    }
  }
  for (const entry of manifest.artifacts) {
    const absolutePath = path.join(workingRoot, entry.path)
    if (!existsSync(absolutePath)) {
      findings.push({ code: "WORKING_ARTIFACT_MISSING", path: entry.path })
      continue
    }
    const bytes = readFileSync(absolutePath)
    if (bytes.length !== entry.bytes || sha256(bytes) !== entry.sha256) {
      findings.push({ code: "WORKING_ARTIFACT_MISMATCH", path: entry.path })
    }
  }
  const validators = ["competition-policy", "service-proof", "competition-boundaries", "final-proof"]
  if (findings.length === 0 && options.executeArchivedValidators !== false) {
    const status = runArchivedValidators(repoRoot, pinnedCommit, manifest.validation.evaluationInstant, manifest.artifacts)
    if (status === "write-attempt") findings.push({ code: "ARCHIVED_VALIDATOR_WRITE_ATTEMPT" })
    if (status === "timeout") findings.push({ code: "ARCHIVED_VALIDATOR_TIMEOUT" })
    if (status === "failed") findings.push({ code: "ARCHIVED_VALIDATOR_FAILED" })
  }
  findings.sort((left, right) => left.code.localeCompare(right.code) || (left.path ?? "").localeCompare(right.path ?? ""))
  return {
    findings,
    artifactCount: manifest.artifacts.length,
    sourceCount: manifest.sources.length,
    archivedValidators: findings.some((finding) => finding.code.startsWith("ARCHIVED_VALIDATOR")) ? [] : validators,
  }
}

const isDirectExecution = (): boolean =>
  process.argv[1] !== undefined && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (isDirectExecution()) {
  checkV136HistoricalProof()
    .then((result) => {
      for (const finding of result.findings) {
        process.stderr.write(`${finding.code}${finding.path ? ` ${finding.path}` : ""}\n`)
      }
      if (result.findings.length === 0) {
        process.stdout.write(`v1.36_historical_proof=passed artifacts=${result.artifactCount} sources=${result.sourceCount}\n`)
      }
      process.exitCode = result.findings.length === 0 ? 0 : 1
    })
    .catch(() => {
      process.stderr.write("ARCHIVED_VALIDATOR_FAILED\n")
      process.exitCode = 1
    })
}
