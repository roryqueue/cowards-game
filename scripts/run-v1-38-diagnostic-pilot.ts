import { createHash, createPublicKey, randomBytes, verify as verifySignature } from "node:crypto"
import { spawn, spawnSync, type ChildProcess } from "node:child_process"
import { closeSync, constants, existsSync, fstatSync, fsyncSync, lstatSync, mkdirSync, openSync, readFileSync, readdirSync, renameSync, statfsSync, writeSync } from "node:fs"
import { join, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { performance } from "node:perf_hooks"
import { createFactoryRepository } from "../packages/strategy-lab/src/factory/repository.js"
import {
  DIAGNOSTIC_PILOT_ARTIFACT_CEILING,
  DIAGNOSTIC_PILOT_PHASE264_STORE,
  DIAGNOSTIC_PILOT_STORE,
  admitDiagnosticPilotAllocation,
  admitDiagnosticPilotCell,
  admitDiagnosticPilotStart,
  createDiagnosticPilotAllocation,
  createDiagnosticPilotCell,
  createDiagnosticPilotStart,
  createDiagnosticPilotTerminal,
  createDiagnosticPilotTerminalV2,
  createDiagnosticPilotStageCheckpoint,
  createDiagnosticPilotFailureDiagnosis,
  admitDiagnosticPilotTerminalV2,
  admitDiagnosticPilotTerminal,
  createDiagnosticPilotLifetimeGrant,
  diagnosticPilotContainerIdentity,
  openDiagnosticPilotLedger,
  readDiagnosticPilotAssessedPair,
  reopenDiagnosticPilotLedger,
  reopenProspectiveDiagnosticPilotLedger,
  safeDiagnosticPilotCause,
  type DiagnosticPilotAllocation,
  type DiagnosticPilotCell,
  type DiagnosticPilotOldEvidenceBaseline,
} from "../packages/strategy-lab/src/league/diagnostic-pilot.js"
import { labRoot, type LabRoot } from "../packages/strategy-lab/src/contracts.js"
import { closeDiagnosticPilotIssuedProvider, issueDiagnosticPilotProviderFromFactoryCandidate, runDiagnosticPilotCell, type FactorySupervisedRuntimeHost } from "../packages/strategy-lab/src/league/connected-runner.js"
import { createFactorySupervisedRuntime } from "./lib/v1-38-factory-supervised-runtime.js"
import { CANONICAL_ARENA_CATALOG_V1_37, admitCanonicalJsonValue } from "@cowards/spec"
import { leaguePlayerId } from "../packages/strategy-lab/src/league/matrix.js"
import type { LabMatchExecution } from "../packages/strategy-lab/src/runtime-bridge.js"
import type { DiagnosticPilotLedger, DiagnosticPilotStart } from "../packages/strategy-lab/src/league/diagnostic-pilot.js"
import { MEMORY_PRESSURE_Q_REQUEST, parseMemoryPressureQ } from "./lib/v1-38-darwin-headroom.js"

const fail = (code: string): never => { throw new TypeError(`DIAGNOSTIC_PILOT_CLI_${code}`) }
const sha = (bytes: Uint8Array | string): LabRoot => `sha256:${createHash("sha256").update(bytes).digest("hex")}`
const root = (value: unknown): value is LabRoot => typeof value === "string" && /^sha256:[0-9a-f]{64}$/u.test(value)
const exact = (value: unknown, keys: readonly string[]): value is Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value) && Object.keys(value).sort().join("\0") === [...keys].sort().join("\0")
const GATE_PATH = ".planning/phases/265-serious-current-rules-league-and-development-red-team/265-08-PILOT-GATE.json"
const REVIEW_PATH = ".planning/phases/265-serious-current-rules-league-and-development-red-team/265-08-PILOT-SOURCE-REVIEW.md"
const SUMMARY_PATH = ".planning/phases/265-serious-current-rules-league-and-development-red-team/265-08-SUMMARY.md"
const REVIEWER_PUBLIC_KEY_PEM = "-----BEGIN PUBLIC KEY-----\nMCowBQYDK2VwAyEAcpzAUH2RHdz8JHphGFB4FVxFn96nGLNf6ug7jpxuoms=\n-----END PUBLIC KEY-----"
const ALLOCATION_PATH = ".planning/artifacts/v1.38-phase-265-diagnostic-pilot-allocation.json"
const RESULT_PATH = ".planning/artifacts/v1.38-phase-265-diagnostic-pilot-result.json"
const PINNED_V1_SOURCE_COMMIT = "a2e34fe0e959356fa76b293c97584c909677ce82"
const PINNED_V1_GATE_ROOT = "sha256:a6848166b539d9885aed10825a1c3f36731b7fc32474abf0dea2a38eef5e5a76"
const PINNED_V1_SOURCE_ROOT = "sha256:86d157dd8ca42de29a55e966e223263f9bf96eac21afa531489fe7d82c543059"
const PINNED_V1_ALLOCATION_ROOT = "sha256:8d642cdc20c4e0ff718a78bf0a38b4fe06cc4a3f4a8cee26969d86ad96bd49bc"
const PINNED_V1_RESULT_ROOT = "sha256:af7aa261ebc7cd38cf893ea24c7b6c7a7986999125fe6a0eea853d893277f732"
const PINNED_V1_BASELINE: DiagnosticPilotOldEvidenceBaseline = Object.freeze({ oldAllocationV2: "sha256:23ce066bb245814b995632712ceb101a4e60490654c6bc98557f0d39ea0541a4", oldAllocationUnversioned: "sha256:17a3a7b9ea45ad2c6b1bbe2f335810e499bf0f592d596aae2662beb148cdda96", oldResult: "sha256:c7475bbe9858d5179e176f636280042bb4d545e2f38482cbf03bf55e3f7da969", oldLeagueTree: "sha256:54c59d1bf2c86c826fd6bd5a4d07e2ac3677be2176ee5a3ae37babed3e21ae26", oldFactoryTree: "sha256:42c367d887f561827ecc3e2a28221fb02e094b3a3ff6dbc7e5fe16ef32392605" })
const REPAIR_GATE_PATH = ".planning/phases/265-serious-current-rules-league-and-development-red-team/265-10-SOURCE-GATE.json"
const REPAIR_REVIEW_PATH = ".planning/phases/265-serious-current-rules-league-and-development-red-team/265-10-SOURCE-REVIEW.md"
const REPAIR_AUTHOR_ID = "/root/execute_265_10"
const REPAIR_REVIEWER_PUBLIC_KEY_PEM = "-----BEGIN PUBLIC KEY-----\nMCowBQYDK2VwAyEAUxpql4iRtDPzNKhsUEwxR1VCNydjKE82epOJ7GuFutY=\n-----END PUBLIC KEY-----"
const OLD_EVIDENCE_PATHS = Object.freeze({
  oldAllocationV2: ".planning/artifacts/v1.38-phase-265-allocation-v2.json",
  oldAllocationUnversioned: ".planning/artifacts/v1.38-phase-265-allocation.json",
  oldResult: ".planning/artifacts/v1.38-phase-265-run-result.json",
  oldLeagueTree: ".strategy-lab/league-265-current-rules-20260922",
  oldFactoryTree: ".strategy-lab/factory-265-current-rules-20260922",
})
const readNoFollowFile = (path: string, maxBytes: number): Buffer => {
  const fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW)
  try { const stat = fstatSync(fd); if (!stat.isFile() || stat.nlink !== 1 || stat.size < 1 || stat.size > maxBytes) return fail("NOFOLLOW_FILE"); return readFileSync(fd) } finally { closeSync(fd) }
}

export const hashDiagnosticPilotOldTree = (directory: string): LabRoot => {
  const entries: { path: string; mode: number; sha256: LabRoot | null }[] = []
  const walk = (path: string, relative: string): void => {
    const stat = lstatSync(path)
    if (stat.isSymbolicLink()) return fail("OLD_TREE_LINK")
    if (stat.isDirectory()) {
      entries.push({ path: relative, mode: stat.mode & 0o7777, sha256: null })
      const children = readdirSync(path).sort()
      for (const name of children) { if (name === "." || name === ".." || name.includes("/") || name.includes("\\")) return fail("OLD_TREE_NAME"); walk(join(path, name), relative === "." ? name : `${relative}/${name}`) }
    } else if (stat.isFile() && stat.nlink === 1) entries.push({ path: relative, mode: stat.mode & 0o7777, sha256: sha(readNoFollowFile(path, 268_435_456)) })
    else return fail("OLD_TREE_TYPE")
    if (entries.length > 1_000_000) return fail("OLD_TREE_COUNT")
  }
  walk(directory, ".")
  entries.sort((left, right) => left.path < right.path ? -1 : left.path > right.path ? 1 : 0)
  return labRoot("diagnostic-pilot-old-evidence-tree-v1", entries)
}
export const readDiagnosticPilotOldEvidenceBaseline = (paths: typeof OLD_EVIDENCE_PATHS = OLD_EVIDENCE_PATHS): DiagnosticPilotOldEvidenceBaseline => Object.freeze({
  oldAllocationV2: sha(readNoFollowFile(paths.oldAllocationV2, 262_144)), oldAllocationUnversioned: sha(readNoFollowFile(paths.oldAllocationUnversioned, 262_144)), oldResult: sha(readNoFollowFile(paths.oldResult, 262_144)),
  oldLeagueTree: hashDiagnosticPilotOldTree(paths.oldLeagueTree), oldFactoryTree: hashDiagnosticPilotOldTree(paths.oldFactoryTree),
})
const verifyDiagnosticPilotOldEvidenceBaseline = (allocation: DiagnosticPilotAllocation): void => {
  if (JSON.stringify(readDiagnosticPilotOldEvidenceBaseline()) !== JSON.stringify(allocation.oldEvidenceBaseline)) return fail("OLD_EVIDENCE_DRIFT")
}
const syncDirectory = (path: string): void => { const fd = openSync(path, constants.O_RDONLY); try { fsyncSync(fd) } finally { closeSync(fd) } }
const durableCreate = (path: string, value: unknown): void => {
  const bytes = Buffer.from(JSON.stringify(value), "utf8")
  if (bytes.length < 1 || bytes.length > 262_144) return fail("DURABLE_RECORD_CAP")
  const fd = openSync(path, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY | constants.O_NOFOLLOW, 0o600)
  try { let offset = 0; while (offset < bytes.length) offset += writeSync(fd, bytes, offset, bytes.length - offset); fsyncSync(fd) } finally { closeSync(fd) }
  syncDirectory(resolve(path, ".."))
}
const readExactAllocation = (path: string, gate: DiagnosticPilotSourceGate): DiagnosticPilotAllocation => {
  if (resolve(path) !== resolve(ALLOCATION_PATH)) return fail("ALLOCATION_PATH")
  const stat = lstatSync(path)
  if (!stat.isFile() || stat.nlink !== 1 || stat.size < 1 || stat.size > 262_144) return fail("ALLOCATION_FILE")
  const allocation = admitDiagnosticPilotAllocation(JSON.parse(readNoFollowFile(path, 262_144).toString("utf8")))
  if (allocation.sourceClosureRoot !== gate.sourceClosureRoot || allocation.implementationRoot !== gate.sourceClosureRoot || allocation.gateRoot !== gate.root) return fail("ALLOCATION_GATE")
  return allocation
}
const parsePilotPaths = (args: readonly string[], required: readonly string[]) => {
  if (args.length !== required.length * 2 || args.some((value, index) => index % 2 === 0 && value !== `--${required[index / 2]}`)) return fail("ARGUMENTS")
  const values = Object.fromEntries(required.map((key, index) => [key, args[index * 2 + 1]])) as Record<string, string>
  for (const [key, expected] of Object.entries({ allocation: ALLOCATION_PATH, result: RESULT_PATH, repository: DIAGNOSTIC_PILOT_STORE, "factory-repository": DIAGNOSTIC_PILOT_PHASE264_STORE })) if (values[key] && resolve(values[key]) !== resolve(expected)) return fail("PATH_SCOPE")
  if (values.gate && resolve(values.gate) !== resolve(GATE_PATH)) return fail("GATE_PATH")
  return values
}
const requireCompletedDiagnosticPilotSourcePlan = (): void => {
  const summary = readNoFollowFile(SUMMARY_PATH, 262_144).toString("utf8")
  if (!/^---\n[\s\S]*?\nstatus: complete\n[\s\S]*?\n---\n/u.test(summary)) return fail("SOURCE_PLAN_INCOMPLETE")
}
export const DIAGNOSTIC_PILOT_SOURCE_FILES = Object.freeze([
  "packages/strategy-lab/src/league/diagnostic-pilot.ts",
  "packages/strategy-lab/src/league/diagnostic-pilot.test.ts",
  "packages/strategy-lab/src/league/connected-runner.ts",
  "scripts/lib/v1-38-factory-supervised-runtime.ts",
  "scripts/lib/v1-38-planner-supervised-runtime.ts",
  "scripts/run-v1-38-diagnostic-pilot.ts",
  "scripts/run-v1-38-diagnostic-pilot.test.ts",
  "scripts/check-v1-38-diagnostic-pilot-boundaries.ts",
  "pnpm-lock.yaml",
  ".github/workflows/ci.yml",
])

export interface DiagnosticPilotSourceGate {
  readonly schemaVersion: "diagnostic-pilot-source-gate-v1"
  readonly sourceFiles: readonly { readonly path: string; readonly sha256: LabRoot }[]
  readonly sourceClosureRoot: LabRoot
  readonly reviewPath: typeof REVIEW_PATH
  readonly reviewSha256: LabRoot
  readonly reviewerId: string
  readonly authorId: string
  readonly actionableFindings: 0
  readonly commands: readonly { readonly command: string; readonly exitCode: 0 }[]
  readonly readerSamplesMilliseconds: readonly number[]
  readonly readerCeilingMilliseconds: number
  readonly capacityVersion: typeof DIAGNOSTIC_PILOT_ARTIFACT_CEILING.version
  readonly watchdogVersion: "diagnostic-pilot-watchdog-v1"
  readonly empiricalAuthority: false
  readonly signatureBase64: string
  readonly root: LabRoot
}
export const diagnosticPilotGateSigningPayload = (gate: Omit<DiagnosticPilotSourceGate, "signatureBase64" | "root">): Uint8Array => Buffer.from(JSON.stringify({ domain: "diagnostic-pilot-source-gate-signature-v1", schemaVersion: gate.schemaVersion, sourceFiles: gate.sourceFiles, sourceClosureRoot: gate.sourceClosureRoot, reviewPath: gate.reviewPath, reviewSha256: gate.reviewSha256, reviewerId: gate.reviewerId, authorId: gate.authorId, actionableFindings: gate.actionableFindings, commands: gate.commands, readerSamplesMilliseconds: gate.readerSamplesMilliseconds, readerCeilingMilliseconds: gate.readerCeilingMilliseconds, capacityVersion: gate.capacityVersion, watchdogVersion: gate.watchdogVersion, empiricalAuthority: gate.empiricalAuthority }), "utf8")
export const diagnosticPilotSourceClosure = (read: (path: string) => Uint8Array = (path) => readNoFollowFile(path, 4_194_304)) => {
  const sourceFiles = DIAGNOSTIC_PILOT_SOURCE_FILES.map((path) => ({ path, sha256: sha(read(path)) }))
  return { sourceFiles, sourceClosureRoot: labRoot("diagnostic-pilot-source-closure-v1", sourceFiles) }
}
export const diagnosticPilotRequiredGateCommands = (): readonly string[] => {
  const ci = readNoFollowFile(".github/workflows/ci.yml", 4_194_304).toString("utf8").split("\n")
  const leagueLine = ci.find((line) => line.includes("vitest run --maxWorkers=1 packages/strategy-lab/src/league/contracts.test.ts"))?.trim()
  if (!leagueLine || (leagueLine.match(/\.test\.ts/gu) ?? []).length !== 29) return fail("CI_29_SUITE_DRIFT")
  return Object.freeze([
    "./node_modules/.bin/vitest run --maxWorkers=1 packages/strategy-lab/src/league/diagnostic-pilot.test.ts packages/strategy-lab/src/league/connected-runner.test.ts scripts/run-v1-38-diagnostic-pilot.test.ts scripts/lib/v1-38-factory-supervised-runtime.test.ts scripts/lib/v1-38-planner-supervised-runtime.test.ts",
    leagueLine,
    "./node_modules/.bin/tsc --noEmit -p packages/strategy-lab/tsconfig.json",
    "./node_modules/.bin/tsc --ignoreConfig --noEmit --target ES2022 --module NodeNext --moduleResolution NodeNext --strict --types node --skipLibCheck scripts/lib/v1-38-factory-supervised-runtime.ts scripts/lib/v1-38-planner-supervised-runtime.ts scripts/run-v1-38-diagnostic-pilot.ts scripts/run-v1-38-diagnostic-pilot.test.ts scripts/check-v1-38-diagnostic-pilot-boundaries.ts",
    "./node_modules/.bin/tsc -b packages/strategy-lab/tsconfig.json --pretty false",
    "./node_modules/.bin/tsx scripts/check-v1-38-serious-league-boundaries.ts",
    "./node_modules/.bin/tsx scripts/check-v1-38-lab-boundaries.ts",
    "./node_modules/.bin/tsx scripts/check-v1-38-factory-boundaries.ts",
    "./node_modules/.bin/tsx scripts/check-v1-38-diagnostic-pilot-boundaries.ts",
    "pnpm exec tsx scripts/check-service-boundary-imports.ts",
    "./node_modules/.bin/vitest run --maxWorkers=1 scripts/check-v1-38-serious-league-boundaries.test.ts scripts/check-v1-38-lab-boundaries.test.ts scripts/check-v1-38-factory-boundaries.test.ts scripts/run-v1-38-diagnostic-pilot.test.ts",
  ])
}
export const checkDiagnosticPilotGate = (options: { readonly gatePath?: string; readonly sourceFiles?: Readonly<Record<string, Uint8Array>>; readonly reviewBytes?: Uint8Array }): DiagnosticPilotSourceGate => {
  const gatePath = options.gatePath ?? GATE_PATH
  const raw = JSON.parse(readNoFollowFile(gatePath, 262_144).toString("utf8")) as unknown
  const keys = ["schemaVersion", "sourceFiles", "sourceClosureRoot", "reviewPath", "reviewSha256", "reviewerId", "authorId", "actionableFindings", "commands", "readerSamplesMilliseconds", "readerCeilingMilliseconds", "capacityVersion", "watchdogVersion", "empiricalAuthority", "signatureBase64", "root"]
  if (!exact(raw, keys) || raw.schemaVersion !== "diagnostic-pilot-source-gate-v1" || raw.reviewPath !== REVIEW_PATH || raw.actionableFindings !== 0 || raw.empiricalAuthority !== false || raw.capacityVersion !== DIAGNOSTIC_PILOT_ARTIFACT_CEILING.version || raw.watchdogVersion !== "diagnostic-pilot-watchdog-v1" || typeof raw.reviewerId !== "string" || typeof raw.authorId !== "string" || raw.reviewerId.length < 2 || raw.authorId.length < 2 || raw.reviewerId === raw.authorId || !root(raw.root)) return fail("GATE_SCHEMA")
  const source = diagnosticPilotSourceClosure((path) => options.sourceFiles === undefined ? readNoFollowFile(path, 4_194_304) : options.sourceFiles[path] ?? fail("GATE_SOURCE_MISSING"))
  if (JSON.stringify(raw.sourceFiles) !== JSON.stringify(source.sourceFiles) || raw.sourceClosureRoot !== source.sourceClosureRoot) return fail("GATE_SOURCE_DRIFT")
  const review = options.reviewBytes ?? readNoFollowFile(REVIEW_PATH, 262_144)
  if (raw.reviewSha256 !== sha(review) || !Buffer.from(review).toString("utf8").includes(source.sourceClosureRoot) || !Buffer.from(review).toString("utf8").includes(`Reviewer: ${raw.reviewerId}`) || !Buffer.from(review).toString("utf8").includes("Actionable findings: 0")) return fail("GATE_REVIEW")
  const required = diagnosticPilotRequiredGateCommands()
  if (!Array.isArray(raw.commands) || raw.commands.length !== required.length || raw.commands.some((entry) => !exact(entry, ["command", "exitCode"]) || typeof entry.command !== "string" || entry.exitCode !== 0) || required.some((command, index) => (raw.commands as { command: string }[])[index]?.command !== command) || !Array.isArray(raw.readerSamplesMilliseconds) || raw.readerSamplesMilliseconds.length < 2 || raw.readerSamplesMilliseconds.some((value) => !Number.isFinite(value) || value <= 0) || typeof raw.readerCeilingMilliseconds !== "number" || raw.readerCeilingMilliseconds < Math.max(...raw.readerSamplesMilliseconds) + 30_000 || raw.readerCeilingMilliseconds > DIAGNOSTIC_PILOT_CELL_MS - DIAGNOSTIC_PILOT_WATCHDOG_RESERVE_MS) return fail("GATE_EVIDENCE")
  const { root: identity, ...body } = raw
  if (identity !== labRoot("diagnostic-pilot-source-gate-v1", body)) return fail("GATE_ROOT")
  if (typeof raw.signatureBase64 !== "string" || !/^[A-Za-z0-9+/]{86}==$/u.test(raw.signatureBase64) || !verifySignature(null, diagnosticPilotGateSigningPayload(raw as unknown as DiagnosticPilotSourceGate), createPublicKey(REVIEWER_PUBLIC_KEY_PEM), Buffer.from(raw.signatureBase64, "base64"))) return fail("GATE_REVIEWER_SIGNATURE")
  return raw as unknown as DiagnosticPilotSourceGate
}

/** Authenticate every historical Git blob before supplying it to the old
 * source gate. Current repaired source is never substituted for Plan 08 bytes. */
export const readPinnedDiagnosticPilotV1Source = (): Readonly<Record<string, Uint8Array>> => {
  const commit = spawnSync("git", ["rev-parse", "--verify", `${PINNED_V1_SOURCE_COMMIT}^{commit}`], { encoding: "utf8", maxBuffer: 1024 })
  if (commit.status !== 0 || commit.stderr !== "" || commit.stdout.trim() !== PINNED_V1_SOURCE_COMMIT) return fail("PINNED_COMMIT")
  const files: Record<string, Uint8Array> = {}
  for (const path of DIAGNOSTIC_PILOT_SOURCE_FILES) {
    const object = spawnSync("git", ["rev-parse", `${PINNED_V1_SOURCE_COMMIT}:${path}`], { encoding: "utf8", maxBuffer: 1024 })
    const show = spawnSync("git", ["show", `${PINNED_V1_SOURCE_COMMIT}:${path}`], { encoding: "buffer", maxBuffer: 4_194_304 })
    if (object.status !== 0 || object.stderr !== "" || !/^[0-9a-f]{40,64}\n$/u.test(object.stdout) || show.status !== 0 || show.stderr?.length || !show.stdout || show.stdout.length < 1) return fail("PINNED_BLOB")
    const recomputed = spawnSync("git", ["hash-object", "--stdin"], { input: show.stdout, encoding: "utf8", maxBuffer: 1024 })
    if (recomputed.status !== 0 || recomputed.stderr !== "" || recomputed.stdout !== object.stdout) return fail("PINNED_BLOB_HASH")
    files[path] = show.stdout
  }
  return Object.freeze(files)
}
export const checkDiagnosticPilotHistoricalGate = (): DiagnosticPilotSourceGate => {
  const gate = checkDiagnosticPilotGate({ sourceFiles: readPinnedDiagnosticPilotV1Source() })
  if (gate.root !== PINNED_V1_GATE_ROOT || gate.sourceClosureRoot !== PINNED_V1_SOURCE_ROOT || gate.reviewSha256 !== "sha256:065b4f940a768883951be212eb593e68cbd932c9ba6f202f266b1c2b6b32ae27") return fail("PINNED_GATE")
  return gate
}
export const verifyRetainedDiagnosticPilotV1 = async () => {
  const gate = checkDiagnosticPilotHistoricalGate()
  const allocation = readExactAllocation(ALLOCATION_PATH, gate)
  if (allocation.root !== PINNED_V1_ALLOCATION_ROOT || JSON.stringify(allocation.oldEvidenceBaseline) !== JSON.stringify(PINNED_V1_BASELINE)) return fail("HISTORICAL_ALLOCATION")
  const result = await verifyDiagnosticPilotResult(allocation, RESULT_PATH)
  if (!("root" in result)) return fail("HISTORICAL_ATTEMPT_ONLY")
  if (result.root !== PINNED_V1_RESULT_ROOT) return fail("HISTORICAL_RESULT")
  const fields = { sourceCommit: PINNED_V1_SOURCE_COMMIT, sourceClosureRoot: gate.sourceClosureRoot, gateRoot: gate.root, reviewSha256: gate.reviewSha256, allocationRoot: allocation.root, resultRoot: result.root, oldEvidenceBaseline: allocation.oldEvidenceBaseline, processValidity: result.processValidity, chargedCount: result.chargedCount, slots: result.slots.map((slot) => ({ ordinal: slot.ordinal, status: slot.status })) }
  return { schemaVersion: "diagnostic-pilot-historical-verdict-v1" as const, ...fields, root: labRoot("diagnostic-pilot-historical-verdict-v1", fields) }
}
export const admitDiagnosticPilotHistoricalVerdict = (value: unknown) => {
  if (!exact(value, ["schemaVersion", "sourceCommit", "sourceClosureRoot", "gateRoot", "reviewSha256", "allocationRoot", "resultRoot", "oldEvidenceBaseline", "processValidity", "chargedCount", "slots", "root"]) || value.schemaVersion !== "diagnostic-pilot-historical-verdict-v1" || value.sourceCommit !== PINNED_V1_SOURCE_COMMIT || value.sourceClosureRoot !== PINNED_V1_SOURCE_ROOT || value.gateRoot !== PINNED_V1_GATE_ROOT || value.reviewSha256 !== "sha256:065b4f940a768883951be212eb593e68cbd932c9ba6f202f266b1c2b6b32ae27" || value.allocationRoot !== PINNED_V1_ALLOCATION_ROOT || value.resultRoot !== PINNED_V1_RESULT_ROOT || JSON.stringify(value.oldEvidenceBaseline) !== JSON.stringify(PINNED_V1_BASELINE) || value.processValidity !== "process_invalid" || value.chargedCount !== 1 || !Array.isArray(value.slots) || value.slots.length !== 4 || value.slots.some((slot, index) => !exact(slot, ["ordinal", "status"]) || slot.ordinal !== index || slot.status !== (index === 0 ? "system_failure" : "unused"))) return fail("HISTORICAL_VERDICT")
  const { root: identity, schemaVersion: _schema, ...body } = value
  if (identity !== labRoot("diagnostic-pilot-historical-verdict-v1", body)) return fail("HISTORICAL_VERDICT_ROOT")
  return value
}
export const checkRetainedDiagnosticPilotV1Contract = () => {
  const child = spawnSync(resolve("node_modules/.bin/tsx"), [fileURLToPath(import.meta.url), "verify-retained-v1"], { encoding: "utf8", maxBuffer: 262_144, timeout: 120_000, env: { ...process.env, DIAGNOSTIC_PILOT_SOURCE_ONLY: "1" } })
  if (child.status !== 1 || child.signal !== null || child.error || child.stderr !== "" || !child.stdout?.endsWith("\n") || child.stdout.trim().split("\n").length !== 1) return fail("HISTORICAL_VERIFIER_EXIT")
  return admitDiagnosticPilotHistoricalVerdict(JSON.parse(child.stdout))
}
export const DIAGNOSTIC_PILOT_REPAIR_SOURCE_FILES = Object.freeze([
  "packages/strategy-lab/src/league/diagnostic-pilot.ts",
  "packages/strategy-lab/src/league/diagnostic-pilot.test.ts",
  "packages/strategy-lab/src/league/connected-runner.ts",
  "packages/strategy-lab/src/league/connected-runner.test.ts",
  "scripts/run-v1-38-diagnostic-pilot.ts",
  "scripts/run-v1-38-diagnostic-pilot.test.ts",
  "scripts/check-v1-38-diagnostic-pilot-boundaries.ts",
  "pnpm-lock.yaml",
  ".github/workflows/ci.yml",
])
const repairCanonicalBytes = (value: unknown): Uint8Array => {
  const admitted = admitCanonicalJsonValue(value, { profile: "canonical-manifest" })
  if (!admitted.ok || admitted.canonicalByteLength < 1 || admitted.canonicalByteLength > 262_144) return fail("REPAIR_CANONICAL")
  return admitted.canonicalBytes
}
export const diagnosticPilotRepairSourceClosure = (read: (path: string) => Uint8Array = (path) => readNoFollowFile(path, 4_194_304)) => {
  const sourceFiles = DIAGNOSTIC_PILOT_REPAIR_SOURCE_FILES.map((path) => ({ path, sha256: sha(read(path)) }))
  return { sourceFiles, sourceClosureRoot: labRoot("diagnostic-pilot-repair-source-closure-v1", sourceFiles) }
}
export const diagnosticPilotRepairRequiredCommands = (): readonly string[] => Object.freeze([
  "./node_modules/.bin/vitest run --maxWorkers=1 packages/strategy-lab/src/league/connected-runner.test.ts packages/strategy-lab/src/league/diagnostic-pilot.test.ts scripts/run-v1-38-diagnostic-pilot.test.ts scripts/lib/v1-38-factory-supervised-runtime.test.ts scripts/lib/v1-38-planner-supervised-runtime.test.ts",
  ...diagnosticPilotRequiredGateCommands().slice(1),
  "./node_modules/.bin/tsx scripts/run-v1-38-diagnostic-pilot.ts check-retained-v1-contract",
])
export interface DiagnosticPilotRepairSourceGate {
  readonly schemaVersion: "diagnostic-pilot-repair-source-gate-v1"
  readonly sourceFiles: readonly { readonly path: string; readonly sha256: LabRoot }[]
  readonly sourceClosureRoot: LabRoot
  readonly reviewPath: typeof REPAIR_REVIEW_PATH
  readonly reviewSha256: LabRoot
  readonly reviewerId: string
  readonly authorId: typeof REPAIR_AUTHOR_ID
  readonly actionableFindings: 0
  readonly commands: readonly { readonly command: string; readonly exitCode: 0 }[]
  readonly historicalCompatibility: ReturnType<typeof checkRetainedDiagnosticPilotV1Contract>
  readonly oldEvidenceBaseline: DiagnosticPilotOldEvidenceBaseline
  readonly empiricalAuthority: false
  readonly runAllowed: false
  readonly leagueRequirementsEvidence: false
  readonly freezeAuthorized: false
  readonly formationAuthorized: false
  readonly holdoutAuthorized: false
  readonly counted: false
  readonly public: false
  readonly productionAuthorized: false
  readonly signatureBase64: string
  readonly root: LabRoot
}
export const diagnosticPilotRepairGateSigningPayload = (body: Omit<DiagnosticPilotRepairSourceGate, "signatureBase64" | "root">): Uint8Array => repairCanonicalBytes({ domain: "diagnostic-pilot-repair-source-gate-signature-v1", ...body })
export const diagnosticPilotRepairReviewerFingerprint = (): LabRoot => sha(createPublicKey(REPAIR_REVIEWER_PUBLIC_KEY_PEM).export({ type: "spki", format: "der" }))
export const checkDiagnosticPilotRepairGate = (options: { readonly gatePath?: string; readonly sourceFiles?: Readonly<Record<string, Uint8Array>>; readonly reviewBytes?: Uint8Array } = {}): DiagnosticPilotRepairSourceGate => {
  const path = options.gatePath ?? REPAIR_GATE_PATH
  const raw = JSON.parse(readNoFollowFile(path, 262_144).toString("utf8")) as unknown
  const keys = ["schemaVersion", "sourceFiles", "sourceClosureRoot", "reviewPath", "reviewSha256", "reviewerId", "authorId", "actionableFindings", "commands", "historicalCompatibility", "oldEvidenceBaseline", "empiricalAuthority", "runAllowed", "leagueRequirementsEvidence", "freezeAuthorized", "formationAuthorized", "holdoutAuthorized", "counted", "public", "productionAuthorized", "signatureBase64", "root"]
  if (!exact(raw, keys) || raw.schemaVersion !== "diagnostic-pilot-repair-source-gate-v1" || raw.reviewPath !== REPAIR_REVIEW_PATH || raw.authorId !== REPAIR_AUTHOR_ID || typeof raw.reviewerId !== "string" || raw.reviewerId.length < 2 || raw.reviewerId === raw.authorId || raw.actionableFindings !== 0 || !root(raw.root) || [raw.empiricalAuthority, raw.runAllowed, raw.leagueRequirementsEvidence, raw.freezeAuthorized, raw.formationAuthorized, raw.holdoutAuthorized, raw.counted, raw.public, raw.productionAuthorized].some((flag) => flag !== false)) return fail("REPAIR_GATE_SCHEMA")
  const source = diagnosticPilotRepairSourceClosure((file) => options.sourceFiles === undefined ? readNoFollowFile(file, 4_194_304) : options.sourceFiles[file] ?? fail("REPAIR_SOURCE_MISSING"))
  if (JSON.stringify(raw.sourceFiles) !== JSON.stringify(source.sourceFiles) || raw.sourceClosureRoot !== source.sourceClosureRoot) return fail("REPAIR_SOURCE_DRIFT")
  const review = options.reviewBytes ?? readNoFollowFile(REPAIR_REVIEW_PATH, 262_144)
  const fingerprint = diagnosticPilotRepairReviewerFingerprint()
  const reviewText = Buffer.from(review).toString("utf8")
  if (raw.reviewSha256 !== sha(review) || !reviewText.includes(source.sourceClosureRoot) || !reviewText.includes(`Reviewer: ${raw.reviewerId}`) || !reviewText.includes("Actionable findings: 0") || !reviewText.includes(`Public key fingerprint: ${fingerprint}`)) return fail("REPAIR_REVIEW")
  const required = diagnosticPilotRepairRequiredCommands()
  if (!Array.isArray(raw.commands) || raw.commands.length !== required.length || raw.commands.some((entry, index) => !exact(entry, ["command", "exitCode"]) || entry.command !== required[index] || entry.exitCode !== 0)) return fail("REPAIR_COMMANDS")
  const historical = admitDiagnosticPilotHistoricalVerdict(raw.historicalCompatibility)
  if (JSON.stringify(raw.oldEvidenceBaseline) !== JSON.stringify(PINNED_V1_BASELINE) || JSON.stringify(historical.oldEvidenceBaseline) !== JSON.stringify(raw.oldEvidenceBaseline)) return fail("REPAIR_BASELINE")
  const { root: identity, signatureBase64, ...body } = raw
  if (typeof signatureBase64 !== "string" || !/^[A-Za-z0-9+/]{86}==$/u.test(signatureBase64) || identity !== labRoot("diagnostic-pilot-repair-source-gate-v1", { ...body, signatureBase64 })) return fail("REPAIR_GATE_ROOT")
  if (!verifySignature(null, diagnosticPilotRepairGateSigningPayload(body as Omit<DiagnosticPilotRepairSourceGate, "signatureBase64" | "root">), createPublicKey(REPAIR_REVIEWER_PUBLIC_KEY_PEM), Buffer.from(signatureBase64, "base64"))) return fail("REPAIR_SIGNATURE")
  const fresh = checkRetainedDiagnosticPilotV1Contract()
  if (JSON.stringify(fresh) !== JSON.stringify(historical)) return fail("REPAIR_HISTORICAL_DRIFT")
  return raw as unknown as DiagnosticPilotRepairSourceGate
}

/** The reserve is additive: two providers, each with 2-second stream close,
 * remove and inspect; parent process-group kill, two owned-container checks,
 * separate terminal writer and filesystem uncertainty all have finite slots. */
export const DIAGNOSTIC_PILOT_WATCHDOG_RESERVE_COMPONENTS = Object.freeze({
  providerCount: 2,
  streamCloseMilliseconds: 2_000,
  removeMilliseconds: 2_000,
  inspectBeforeMilliseconds: 2_000,
  inspectAfterMilliseconds: 2_000,
  processGroupKillMilliseconds: 2_000,
  terminalWriterAndFsyncMilliseconds: 5_000,
  schedulerAndFilesystemMarginMilliseconds: 7_000,
})
export const DIAGNOSTIC_PILOT_WATCHDOG_RESERVE_MS = DIAGNOSTIC_PILOT_WATCHDOG_RESERVE_COMPONENTS.providerCount * (DIAGNOSTIC_PILOT_WATCHDOG_RESERVE_COMPONENTS.streamCloseMilliseconds + DIAGNOSTIC_PILOT_WATCHDOG_RESERVE_COMPONENTS.removeMilliseconds + DIAGNOSTIC_PILOT_WATCHDOG_RESERVE_COMPONENTS.inspectBeforeMilliseconds + DIAGNOSTIC_PILOT_WATCHDOG_RESERVE_COMPONENTS.inspectAfterMilliseconds) + DIAGNOSTIC_PILOT_WATCHDOG_RESERVE_COMPONENTS.processGroupKillMilliseconds + DIAGNOSTIC_PILOT_WATCHDOG_RESERVE_COMPONENTS.terminalWriterAndFsyncMilliseconds + DIAGNOSTIC_PILOT_WATCHDOG_RESERVE_COMPONENTS.schedulerAndFilesystemMarginMilliseconds
export const DIAGNOSTIC_PILOT_OVERALL_MS = 1_800_000
export const DIAGNOSTIC_PILOT_CELL_MS = 240_000
export const computeDiagnosticPilotDeadlines = (input: { readonly overallStartedAt: number; readonly cellStartedAt: number }) => {
  if (![input.overallStartedAt, input.cellStartedAt].every(Number.isFinite) || input.cellStartedAt < input.overallStartedAt) return fail("DEADLINE_INPUT")
  const cellHardAt = input.cellStartedAt + DIAGNOSTIC_PILOT_CELL_MS
  const overallHardAt = input.overallStartedAt + DIAGNOSTIC_PILOT_OVERALL_MS
  return Object.freeze({ cellHardAt, overallHardAt, killAt: Math.min(cellHardAt, overallHardAt) - DIAGNOSTIC_PILOT_WATCHDOG_RESERVE_MS })
}
export const canStartDiagnosticPilotCell = (now: number, overallStartedAt: number): boolean => Number.isFinite(now) && Number.isFinite(overallStartedAt) && now >= overallStartedAt && now + DIAGNOSTIC_PILOT_CELL_MS + DIAGNOSTIC_PILOT_WATCHDOG_RESERVE_MS <= overallStartedAt + DIAGNOSTIC_PILOT_OVERALL_MS

export const measureDiagnosticPilotReader = (): number => {
  const began = performance.now()
  readDiagnosticPilotAssessedPair(createFactoryRepository(DIAGNOSTIC_PILOT_PHASE264_STORE))
  return Math.ceil(performance.now() - began)
}

export interface DiagnosticPilotCapacityProbe {
  readonly statfs: () => { readonly bavail: bigint; readonly bsize: bigint; readonly ffree: bigint }
  readonly historicalStoreIsDirectory: () => boolean
  readonly pilotStoreExists: () => boolean
}
const defaultCapacityProbe: DiagnosticPilotCapacityProbe = {
  statfs: () => statfsSync(resolve(".strategy-lab"), { bigint: true }),
  historicalStoreIsDirectory: () => lstatSync(resolve(DIAGNOSTIC_PILOT_PHASE264_STORE)).isDirectory(),
  pilotStoreExists: () => existsSync(resolve(DIAGNOSTIC_PILOT_STORE)),
}
/** Read-only observation only. The worker repeats this after run's clock starts. */
export const preflightDiagnosticPilot = (gate: DiagnosticPilotSourceGate, storeState: "fresh" | "reserved" = "fresh", probe: DiagnosticPilotCapacityProbe = defaultCapacityProbe) => {
  const fileSystem = probe.statfs()
  const availableBytes = fileSystem.bavail * fileSystem.bsize
  const availableInodes = fileSystem.ffree
  const requiredBytes = BigInt(DIAGNOSTIC_PILOT_ARTIFACT_CEILING.maxBytes + DIAGNOSTIC_PILOT_ARTIFACT_CEILING.terminalReserveBytes) * 4n
  const requiredInodes = BigInt(DIAGNOSTIC_PILOT_ARTIFACT_CEILING.maxInodes + DIAGNOSTIC_PILOT_ARTIFACT_CEILING.terminalReserveInodes) * 4n
  if (availableBytes < requiredBytes || availableInodes < requiredInodes) return fail("CAPACITY")
  if (gate.readerCeilingMilliseconds + DIAGNOSTIC_PILOT_CELL_MS + DIAGNOSTIC_PILOT_WATCHDOG_RESERVE_MS > DIAGNOSTIC_PILOT_OVERALL_MS) return fail("FIRST_CELL_INFEASIBLE")
  if (!probe.historicalStoreIsDirectory() || (storeState === "fresh" && probe.pilotStoreExists()) || (storeState === "reserved" && !probe.pilotStoreExists())) return fail("PILOT_STORE_STATE")
  return Object.freeze({ availableBytes: availableBytes.toString(), availableInodes: availableInodes.toString(), requiredBytes: requiredBytes.toString(), requiredInodes: requiredInodes.toString(), consuming: false as const })
}

export interface PilotDockerControl { readonly command: (args: readonly string[], timeoutMs: number) => Promise<{ status: number | null; stdout: string; stderr: string; signal: string | null; error: boolean }> }
const dockerCommand = (args: readonly string[], timeoutMs: number): ReturnType<PilotDockerControl["command"]> => new Promise((resolveCommand) => {
  const child = spawn("docker", [...args], { env: { PATH: process.env.PATH ?? "" }, stdio: ["ignore", "pipe", "pipe"], shell: false, windowsHide: true })
  let stdout = "", stderr = "", error = false, settled = false
  const timer = setTimeout(() => { if (settled) return; settled = true; error = true; child.kill("SIGKILL"); resolveCommand({ status: null, signal: "SIGKILL", stdout, stderr, error }) }, timeoutMs)
  child.stdout?.on("data", (data: Buffer) => { stdout += data.toString("utf8"); if (stdout.length > 4096) { error = true; child.kill("SIGKILL") } })
  child.stderr?.on("data", (data: Buffer) => { stderr += data.toString("utf8"); if (stderr.length > 4096) { error = true; child.kill("SIGKILL") } })
  child.on("error", () => { error = true })
  child.on("close", (status, signal) => { if (settled) return; settled = true; clearTimeout(timer); resolveCommand({ status, signal, stdout, stderr, error }) })
})
const defaultDocker: PilotDockerControl = { command: dockerCommand }
export const observeDiagnosticPilotHost = async (allocation: DiagnosticPilotAllocation, docker: PilotDockerControl = defaultDocker, memoryProbe: () => ReturnType<typeof parseMemoryPressureQ> = () => {
  const request = MEMORY_PRESSURE_Q_REQUEST
  const result = spawnSync(request.executable, [...request.args], { env: { ...request.env }, stdio: ["ignore", "pipe", "pipe"], shell: false, timeout: request.timeoutMilliseconds, maxBuffer: request.maximumOutputBytes })
  return parseMemoryPressureQ({ stdout: result.stdout, stderr: result.stderr, exitCode: result.status, signal: result.signal, timedOut: (result.error as NodeJS.ErrnoException | undefined)?.code === "ETIMEDOUT" })
}) => {
  const admitted = admitDiagnosticPilotAllocation(allocation)
  const memory = memoryProbe()
  if (!memory.ok || memory.observation.disposition !== "preflight_admitted" || Math.floor(memory.observation.totalBytes * memory.observation.percentage / 100) < 1_073_741_824) return fail("HOST_MEMORY")
  const info = await docker.command(["info", "--format", "{{.NCPU}}|{{.MemTotal}}"], 5_000)
  if (info.error || info.signal !== null || info.status !== 0 || info.stderr !== "" || !/^[0-9]+\|[0-9]+\n?$/u.test(info.stdout)) return fail("DOCKER_DAEMON")
  const [cpus, memoryBytes] = info.stdout.trim().split("|").map(Number)
  if (!Number.isSafeInteger(cpus) || cpus < 2 || !Number.isSafeInteger(memoryBytes) || memoryBytes < 268_435_456) return fail("DOCKER_PROFILE")
  const image = await docker.command(["image", "inspect", "--format", "{{.Id}}|{{.Architecture}}", admitted.image], 5_000)
  if (image.error || image.signal !== null || image.status !== 0 || image.stderr !== "" || !/^sha256:[0-9a-f]{64}\|amd64\n?$/u.test(image.stdout)) return fail("DOCKER_IMAGE")
  for (let ordinal = 0; ordinal < admitted.cells.length; ordinal++) {
    const cell = createDiagnosticPilotCell(admitted, ordinal)
    for (const seat of ["bottom", "top"] as const) {
      const { containerName } = diagnosticPilotContainerIdentity(admitted, cell, seat)
      const inspection = await docker.command(["inspect", "--format", '{{index .Config.Labels "v1.38-lean-owner"}}', containerName], 2_000)
      const absent = !inspection.error && inspection.signal === null && inspection.status === 1 && ((inspection.stdout === "" && inspection.stderr === `Error: No such object: ${containerName}\n`) || (inspection.stdout === "\n" && inspection.stderr === `error: no such object: ${containerName}\n`))
      if (!absent) return fail("DOCKER_NAME_COLLISION")
    }
  }
  return Object.freeze({ memoryBasisPoints: memory.observation.observedBasisPoints, dockerCpus: cpus, dockerMemoryBytes: memoryBytes, imagePresent: true as const, ownedNameCollisions: 0 as const })
}
export const cleanupDiagnosticPilotContainers = async (allocation: DiagnosticPilotAllocation, cell: DiagnosticPilotCell, docker: PilotDockerControl = defaultDocker): Promise<boolean> => {
  const admitted = admitDiagnosticPilotCell(allocation, cell)
  for (const seat of ["bottom", "top"] as const) {
    const { containerName, ownershipLabel } = diagnosticPilotContainerIdentity(allocation, admitted, seat)
    const inspect = async () => docker.command(["inspect", "--format", '{{index .Config.Labels "v1.38-lean-owner"}}', containerName], 2_000)
    const first = await inspect()
    const absent = (row: Awaited<ReturnType<typeof inspect>>) => !row.error && row.signal === null && row.status === 1 && ((row.stdout === "" && row.stderr === `Error: No such object: ${containerName}\n`) || (row.stdout === "\n" && row.stderr === `error: no such object: ${containerName}\n`))
    if (absent(first)) continue
    if (first.error || first.signal !== null || first.status !== 0 || first.stderr !== "" || first.stdout.trim() !== ownershipLabel) return false
    const removed = await docker.command(["rm", "--force", containerName], 2_000)
    if (removed.error || removed.signal !== null || removed.status !== 0 || removed.stderr !== "") return false
    if (!absent(await inspect())) return false
  }
  return true
}
export const verifyDiagnosticPilotContainersAbsent = async (allocation: DiagnosticPilotAllocation, docker: PilotDockerControl = defaultDocker): Promise<boolean> => {
  const inspections: Promise<boolean>[] = []
  for (const [ordinal] of allocation.cells.entries()) {
    const cell = createDiagnosticPilotCell(allocation, ordinal)
    for (const seat of ["bottom", "top"] as const) {
      const { containerName } = diagnosticPilotContainerIdentity(allocation, cell, seat)
      inspections.push(docker.command(["inspect", "--format", '{{index .Config.Labels "v1.38-lean-owner"}}', containerName], 2_000).then((row) => !row.error && row.signal === null && row.status === 1 && ((row.stdout === "" && row.stderr === `Error: No such object: ${containerName}\n`) || (row.stdout === "\n" && row.stderr === `error: no such object: ${containerName}\n`)), () => false))
    }
  }
  return (await Promise.all(inspections)).every(Boolean)
}

/** Bounded private evidence stream. Each canonical JSON row is retained in a
 * hash-checked chunk; no event, accounting row or failed invocation is elided. */
export const retainDiagnosticPilotExecution = (ledger: DiagnosticPilotLedger, start: DiagnosticPilotStart, execution: LabMatchExecution) => {
  if (!ledger.writeEvidence || !ledger.readEvidence || execution.transitions.length > 1_010_000 || execution.accounting.length > 49_600) return fail("EVIDENCE_WRITER")
  let artifactBytes = 0, artifactRecords = 0
  const physical = new Set<LabRoot>()
  const write = (bytes: Uint8Array) => { const identity = ledger.writeEvidence!(start.root, bytes); if (!physical.has(identity)) { physical.add(identity); artifactBytes += bytes.length; artifactRecords++ } return identity }
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value), "utf8")
  const rows = (values: readonly unknown[], rowLimit: number): LabRoot[] => {
    const roots: LabRoot[] = []; let pending: Buffer[] = [], pendingBytes = 0
    const flush = () => { if (pendingBytes) { roots.push(write(Buffer.concat(pending, pendingBytes))); pending = []; pendingBytes = 0 } }
    const append = (bytes: Buffer) => { for (let offset = 0; offset < bytes.length;) { const take = Math.min(131_072 - pendingBytes, bytes.length - offset); pending.push(bytes.subarray(offset, offset + take)); pendingBytes += take; offset += take; if (pendingBytes === 131_072) flush() } }
    for (const value of values) {
      const bytes = encode(value)
      if (bytes.length < 1 || bytes.length > rowLimit) return fail("EVIDENCE_ROW_CAP")
      append(bytes); append(Buffer.from("\n"))
    }
    flush(); return roots
  }
  const transitionRoots = rows(execution.transitions, 8_192)
  const accountingRoots = rows(execution.accounting, 262_144 + 8_192)
  const index = (roots: readonly LabRoot[]) => {
    const pages: LabRoot[] = []
    for (let offset = 0; offset < roots.length; offset += 1_000) pages.push(write(encode({ schemaVersion: "diagnostic-pilot-evidence-index-v1", roots: roots.slice(offset, offset + 1_000) })))
    return pages
  }
  const transitionIndexRoots = index(transitionRoots), accountingIndexRoots = index(accountingRoots)
  // Completed result.events are the transition-event concatenation in
  // runCanonicalLabMatch; retain transitions once, but chunk the final state.
  const outcome = execution.kind === "completed" ? { kind: "completed", privacy: execution.privacy, state: execution.result.state } : { kind: "failure", privacy: execution.privacy, failure: execution.failure, unchangedState: execution.unchangedState }
  const outcomeBytes = encode(outcome)
  if (outcomeBytes.length < 1 || outcomeBytes.length > (execution.kind === "failure" ? DIAGNOSTIC_PILOT_ARTIFACT_CEILING.maxFailureBytes : 1_048_576)) return fail("EVIDENCE_OUTCOME_CAP")
  const outcomeRoots: LabRoot[] = []
  for (let offset = 0; offset < outcomeBytes.length; offset += 131_072) outcomeRoots.push(write(outcomeBytes.subarray(offset, offset + 131_072)))
  const manifestBytes = encode({ schemaVersion: "diagnostic-pilot-execution-manifest-v1", startRoot: start.root, transitionIndexRoots, accountingIndexRoots, transitionChunkCount: transitionRoots.length, accountingChunkCount: accountingRoots.length, outcomeRoots, outcomeByteLength: outcomeBytes.length, transitionCount: execution.transitions.length, accountingCount: execution.accounting.length })
  if (manifestBytes.length > 131_072) return fail("EVIDENCE_MANIFEST_CAP")
  const evidenceRoot = write(manifestBytes)
  return Object.freeze({ evidenceRoot, artifactBytes, artifactRecords })
}
export const verifyRetainedDiagnosticPilotExecution = (ledger: DiagnosticPilotLedger, start: DiagnosticPilotStart, evidenceRoot: LabRoot): Readonly<{ transitionCount: number; accountingCount: number; outputBytes: number; disposition: "success" | "system_failure" | "player_violation"; artifactBytes: number; artifactRecords: number }> => {
  if (!ledger.readEvidence || !root(evidenceRoot)) return fail("EVIDENCE_READER")
  let artifactBytes = 0, artifactRecords = 0
  const referenced = new Set<LabRoot>()
  const read = (identity: LabRoot) => { const bytes = ledger.readEvidence!(start.root, identity); if (!referenced.has(identity)) { referenced.add(identity); artifactBytes += bytes.length; artifactRecords++ } if (artifactBytes > DIAGNOSTIC_PILOT_ARTIFACT_CEILING.maxBytes || artifactRecords > DIAGNOSTIC_PILOT_ARTIFACT_CEILING.maxRecords) return fail("EVIDENCE_READ_CAP"); return bytes }
  const manifest = JSON.parse(Buffer.from(read(evidenceRoot)).toString("utf8")) as unknown
  if (!exact(manifest, ["schemaVersion", "startRoot", "transitionIndexRoots", "accountingIndexRoots", "transitionChunkCount", "accountingChunkCount", "outcomeRoots", "outcomeByteLength", "transitionCount", "accountingCount"]) || manifest.schemaVersion !== "diagnostic-pilot-execution-manifest-v1" || manifest.startRoot !== start.root || !Array.isArray(manifest.transitionIndexRoots) || !Array.isArray(manifest.accountingIndexRoots) || !Array.isArray(manifest.outcomeRoots) || !manifest.transitionIndexRoots.every(root) || !manifest.accountingIndexRoots.every(root) || !manifest.outcomeRoots.every(root) || manifest.outcomeRoots.length < 1 || manifest.outcomeRoots.length > 8 || !Number.isSafeInteger(manifest.transitionChunkCount) || !Number.isSafeInteger(manifest.accountingChunkCount) || !Number.isSafeInteger(manifest.outcomeByteLength) || (manifest.outcomeByteLength as number) < 1 || (manifest.outcomeByteLength as number) > 1_048_576 || !Number.isSafeInteger(manifest.transitionCount) || !Number.isSafeInteger(manifest.accountingCount) || (manifest.transitionCount as number) < 0 || (manifest.transitionCount as number) > 1_010_000 || (manifest.accountingCount as number) < 0 || (manifest.accountingCount as number) > 49_600) return fail("EVIDENCE_MANIFEST")
  const index = (pages: LabRoot[], expected: number): LabRoot[] => {
    const roots: LabRoot[] = []
    if (pages.length > Math.ceil(expected / 1_000)) return fail("EVIDENCE_INDEX_CAP")
    for (const page of pages) {
      const parsed = JSON.parse(Buffer.from(read(page)).toString("utf8")) as unknown
      if (!exact(parsed, ["schemaVersion", "roots"]) || parsed.schemaVersion !== "diagnostic-pilot-evidence-index-v1" || !Array.isArray(parsed.roots) || parsed.roots.length < 1 || parsed.roots.length > 1_000 || !parsed.roots.every(root)) return fail("EVIDENCE_INDEX")
      roots.push(...parsed.roots as LabRoot[])
    }
    if (roots.length !== expected) return fail("EVIDENCE_INDEX_COUNT")
    return roots
  }
  let outputBytes = 0, systemFailure = false, playerViolation = false
  const countRows = (roots: LabRoot[], accountingRows: boolean) => {
    let count = 0, carry = Buffer.alloc(0)
    for (const identity of roots) {
      const data = Buffer.concat([carry, Buffer.from(read(identity))])
      let offset = 0
      for (let at = data.indexOf(10); at >= 0; at = data.indexOf(10, offset)) {
        const line = data.subarray(offset, at)
        if (!line.length) return fail("EVIDENCE_ROW")
        const value = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(line)) as unknown
        if (accountingRows) {
          if (!value || typeof value !== "object" || (value as { charged?: unknown }).charged !== true || !Number.isSafeInteger((value as { outputBytes?: unknown }).outputBytes) || (value as { outputBytes: number }).outputBytes < 0 || (value as { outputBytes: number }).outputBytes > 262_144) return fail("EVIDENCE_ACCOUNTING_ROW")
          outputBytes += (value as { outputBytes: number }).outputBytes
          const result = (value as { result?: unknown }).result
          if (!result || typeof result !== "object" || typeof (result as { ok?: unknown }).ok !== "boolean") return fail("EVIDENCE_ACCOUNTING_RESULT")
          if (!(result as { ok: boolean }).ok) { if ("systemFailure" in result) systemFailure = true; else playerViolation = true }
        }
        count++; offset = at + 1
      }
      carry = data.subarray(offset)
      if (carry.length > 262_144 + 8_192) return fail("EVIDENCE_ROW_CAP")
    }
    if (carry.length) return fail("EVIDENCE_UNTERMINATED_ROW")
    return count
  }
  const transitions = countRows(index(manifest.transitionIndexRoots as LabRoot[], manifest.transitionChunkCount as number), false), accounting = countRows(index(manifest.accountingIndexRoots as LabRoot[], manifest.accountingChunkCount as number), true)
  if (transitions !== manifest.transitionCount || accounting !== manifest.accountingCount) return fail("EVIDENCE_COUNTS")
  const outcomeBytes = Buffer.concat((manifest.outcomeRoots as LabRoot[]).map((identity) => Buffer.from(read(identity))))
  if (outcomeBytes.length !== manifest.outcomeByteLength) return fail("EVIDENCE_OUTCOME_BYTES")
  const outcome = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(outcomeBytes)) as unknown
  if (!outcome || typeof outcome !== "object" || !["completed", "failure"].includes((outcome as { kind: string }).kind) || (outcome as { privacy?: unknown }).privacy !== "private_offline") return fail("EVIDENCE_OUTCOME")
  const prefix = `diagnostic-pilot-${start.root.slice(7)}.evidence-`
  const inventory = ledger.listNames().filter((name) => name.startsWith(prefix))
  if (inventory.length !== referenced.size || inventory.some((name) => { const match = /^diagnostic-pilot-[0-9a-f]{64}\.evidence-([0-9a-f]{64})\.bin$/u.exec(name); return !match || !referenced.has(`sha256:${match[1]}` as LabRoot) })) return fail("EVIDENCE_ORPHAN")
  const disposition = (outcome as { kind: string }).kind === "failure" || systemFailure ? "system_failure" as const : playerViolation ? "player_violation" as const : "success" as const
  return Object.freeze({ transitionCount: transitions, accountingCount: accounting, outputBytes, disposition, artifactBytes, artifactRecords })
}

/** A killed worker may have completed durable chunks without reaching its
 * execution manifest. Root the exact surviving inventory in the terminal;
 * an interrupted temporary file remains an invalid start, never a success. */
export const retainDiagnosticPilotPartialEvidence = (ledger: DiagnosticPilotLedger, start: DiagnosticPilotStart) => {
  if (!ledger.readEvidence || !ledger.writeEvidence) return fail("PARTIAL_EVIDENCE_LEDGER")
  const names = ledger.listNames()
  const prefix = `diagnostic-pilot-${start.root.slice(7)}.evidence-`
  const roots: LabRoot[] = []
  let artifactBytes = 0
  for (const name of names) {
    if (!name.startsWith(prefix)) continue
    const match = /^diagnostic-pilot-[0-9a-f]{64}\.evidence-([0-9a-f]{64})\.bin$/u.exec(name)
    if (!match) return fail("PARTIAL_EVIDENCE_UNCERTAIN")
    const identity = `sha256:${match[1]}` as LabRoot
    artifactBytes += ledger.readEvidence(start.root, identity).length
    roots.push(identity)
  }
  if (roots.length === 0) return Object.freeze({ evidenceRoot: null, artifactBytes: 0, artifactRecords: 0 })
  if (new Set(roots).size !== roots.length || roots.length > DIAGNOSTIC_PILOT_ARTIFACT_CEILING.maxRecords - 1) return fail("PARTIAL_EVIDENCE_COUNT")
  const chunkBytes = artifactBytes
  let artifactRecords = roots.length
  const writeIndex = (level: 0 | 1, identities: readonly LabRoot[]): LabRoot[] => {
    const pages: LabRoot[] = []
    for (let offset = 0; offset < identities.length; offset += 1_000) {
      const bytes = Buffer.from(JSON.stringify({ schemaVersion: "diagnostic-pilot-partial-index-v1", level, roots: identities.slice(offset, offset + 1_000) }), "utf8")
      if (bytes.length > 131_072) return fail("PARTIAL_EVIDENCE_INDEX_CAP")
      pages.push(ledger.writeEvidence!(start.root, bytes)); artifactBytes += bytes.length; artifactRecords++
    }
    return pages
  }
  const firstLevel = writeIndex(0, roots)
  const secondLevel = writeIndex(1, firstLevel)
  const descriptor = Buffer.from(JSON.stringify({ schemaVersion: "diagnostic-pilot-partial-evidence-v1", startRoot: start.root, indexRoots: secondLevel, chunkCount: roots.length, chunkBytes }), "utf8")
  if (descriptor.length > 131_072) return fail("PARTIAL_EVIDENCE_DESCRIPTOR")
  const evidenceRoot = ledger.writeEvidence(start.root, descriptor)
  return Object.freeze({ evidenceRoot, artifactBytes: artifactBytes + descriptor.length, artifactRecords: artifactRecords + 1 })
}
export const verifyRetainedDiagnosticPilotPartialEvidence = (ledger: DiagnosticPilotLedger, start: DiagnosticPilotStart, evidenceRoot: LabRoot) => {
  if (!ledger.readEvidence || !root(evidenceRoot)) return fail("PARTIAL_EVIDENCE_READER")
  const descriptorBytes = ledger.readEvidence(start.root, evidenceRoot)
  const descriptor = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(descriptorBytes)) as unknown
  if (!exact(descriptor, ["schemaVersion", "startRoot", "indexRoots", "chunkCount", "chunkBytes"]) || descriptor.schemaVersion !== "diagnostic-pilot-partial-evidence-v1" || descriptor.startRoot !== start.root || !Array.isArray(descriptor.indexRoots) || descriptor.indexRoots.length < 1 || descriptor.indexRoots.length > 4 || !descriptor.indexRoots.every(root) || !Number.isSafeInteger(descriptor.chunkCount) || (descriptor.chunkCount as number) < 1 || (descriptor.chunkCount as number) > DIAGNOSTIC_PILOT_ARTIFACT_CEILING.maxRecords || !Number.isSafeInteger(descriptor.chunkBytes) || (descriptor.chunkBytes as number) < 1) return fail("PARTIAL_EVIDENCE_DESCRIPTOR")
  const referenced = new Set<LabRoot>([evidenceRoot])
  let artifactBytes = descriptorBytes.length
  const readIndex = (level: 0 | 1, identities: readonly LabRoot[]): LabRoot[] => {
    const next: LabRoot[] = []
    for (const identity of identities) {
      if (referenced.has(identity)) return fail("PARTIAL_EVIDENCE_DUPLICATE")
      referenced.add(identity)
      const bytes = ledger.readEvidence!(start.root, identity); artifactBytes += bytes.length
      const page = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)) as unknown
      if (!exact(page, ["schemaVersion", "level", "roots"]) || page.schemaVersion !== "diagnostic-pilot-partial-index-v1" || page.level !== level || !Array.isArray(page.roots) || page.roots.length < 1 || page.roots.length > 1_000 || !page.roots.every(root)) return fail("PARTIAL_EVIDENCE_INDEX")
      next.push(...page.roots as LabRoot[])
    }
    return next
  }
  const firstLevel = readIndex(1, descriptor.indexRoots as LabRoot[])
  const chunks = readIndex(0, firstLevel)
  if (chunks.length !== descriptor.chunkCount) return fail("PARTIAL_EVIDENCE_COUNT")
  let chunkBytes = 0
  for (const identity of chunks) {
    if (referenced.has(identity)) return fail("PARTIAL_EVIDENCE_DUPLICATE")
    referenced.add(identity)
    const bytes = ledger.readEvidence(start.root, identity); chunkBytes += bytes.length; artifactBytes += bytes.length
  }
  if (chunkBytes !== descriptor.chunkBytes) return fail("PARTIAL_EVIDENCE_BYTES")
  const prefix = `diagnostic-pilot-${start.root.slice(7)}.evidence-`
  const inventory = ledger.listNames().filter((name) => name.startsWith(prefix))
  if (inventory.length !== referenced.size || inventory.some((name) => { const match = /^diagnostic-pilot-[0-9a-f]{64}\.evidence-([0-9a-f]{64})\.bin$/u.exec(name); return !match || !referenced.has(`sha256:${match[1]}` as LabRoot) })) return fail("PARTIAL_EVIDENCE_ORPHAN")
  return Object.freeze({ artifactBytes, artifactRecords: referenced.size })
}

export const createDiagnosticPilotAttemptMarker = (allocation: DiagnosticPilotAllocation) => {
  const fields = { schemaVersion: "diagnostic-pilot-attempt-marker-v1" as const, allocationRoot: allocation.root, gateRoot: allocation.gateRoot, oldEvidenceBaseline: allocation.oldEvidenceBaseline, status: "attempted_uncertain" as const, empiricalAuthority: false as const }
  return Object.freeze({ ...fields, root: labRoot("diagnostic-pilot-attempt-marker-v1", fields) })
}
export const reserveDiagnosticPilotAttempt = (path: string, allocation: DiagnosticPilotAllocation): void => durableCreate(path, createDiagnosticPilotAttemptMarker(allocation))
const readDiagnosticPilotAttempt = (path: string, allocation: DiagnosticPilotAllocation) => {
  const actual = JSON.parse(readNoFollowFile(path, 262_144).toString("utf8")) as unknown
  const marker = createDiagnosticPilotAttemptMarker(allocation)
  if (JSON.stringify(actual) !== JSON.stringify(marker)) return fail("ATTEMPT_MARKER")
  return marker
}
export const classifyDiagnosticPilotAttemptMarker = (path: string, allocation: DiagnosticPilotAllocation) => {
  readDiagnosticPilotAttempt(path, allocation)
  return Object.freeze({ status: "attempted_uncertain" as const, processValidity: "process_invalid" as const })
}
export const createDiagnosticPilotResult = (allocation: DiagnosticPilotAllocation, ledger: DiagnosticPilotLedger | null, elapsedMilliseconds: number, watchdogStatus: "safe_no_start" | "process_valid" | "process_invalid", containerAbsence = false) => {
  if (!Number.isSafeInteger(elapsedMilliseconds) || elapsedMilliseconds < 0 || elapsedMilliseconds > DIAGNOSTIC_PILOT_OVERALL_MS || (ledger === null && watchdogStatus === "process_valid")) return fail("RESULT_ELAPSED")
  const state = ledger === null ? null : reopenDiagnosticPilotLedger(ledger, allocation)
  if (state?.retentionUncertain) return fail("RESULT_RETENTION_UNCERTAIN")
  const records = state?.records ?? []
  const slots = allocation.cells.map((_, ordinal) => {
    const entry = records[ordinal]
    if (!entry) return { ordinal, status: "unused" as const, processValidity: null, startRoot: null, terminalRoot: null, evidenceRoot: null, evidenceKind: "none" as const, elapsedMilliseconds: 0, artifactBytes: 0, artifactRecords: 0, artifactInodes: 0, invocationRecords: 0, outputBytes: 0, cleanupComplete: false }
    const terminal = entry.terminal
    let evidence: { artifactBytes: number; artifactRecords: number; accountingCount?: number; outputBytes?: number } | null = null
    let evidenceKind: "complete" | "unordered_partial" | "none" = "none"
    if (terminal?.evidenceRoot) {
      const header = JSON.parse(Buffer.from(ledger!.readEvidence!(entry.start.root, terminal.evidenceRoot)).toString("utf8")) as { schemaVersion?: string }
      if (header.schemaVersion === "diagnostic-pilot-execution-manifest-v1") { evidenceKind = "complete"; evidence = verifyRetainedDiagnosticPilotExecution(ledger!, entry.start, terminal.evidenceRoot) }
      else if (header.schemaVersion === "diagnostic-pilot-partial-evidence-v1") { evidenceKind = "unordered_partial"; evidence = verifyRetainedDiagnosticPilotPartialEvidence(ledger!, entry.start, terminal.evidenceRoot) }
      else return fail("RESULT_EVIDENCE_SCHEMA")
    }
    if (terminal?.disposition === "success" && evidenceKind !== "complete") return fail("RESULT_SUCCESS_EVIDENCE")
    if (terminal && evidenceKind === "complete" && (evidence as ReturnType<typeof verifyRetainedDiagnosticPilotExecution>).disposition !== terminal.disposition) return fail("RESULT_DISPOSITION")
    if (terminal && ((terminal.evidenceRoot === null && (terminal.artifactBytes !== 0 || terminal.artifactRecords !== 0)) || (evidence && (evidence.artifactBytes !== terminal.artifactBytes || evidence.artifactRecords !== terminal.artifactRecords)))) return fail("RESULT_EVIDENCE")
    const retained = ledger!.listNames().filter((name) => name.startsWith(`diagnostic-pilot-${entry.start.root.slice(7)}.evidence-`))
    if (terminal?.evidenceRoot === null && retained.length > 0) return fail("RESULT_UNROOTED_TERMINAL")
    const unrootedBytes = terminal ? 0 : retained.reduce((sum, name) => sum + lstatSync(join(ledger!.directory, name)).size, 0)
    return { ordinal, status: terminal ? terminal.disposition : "start_only" as const, processValidity: entry.processValidity, startRoot: entry.start.root, terminalRoot: terminal?.root ?? null, evidenceRoot: terminal?.evidenceRoot ?? null, evidenceKind: terminal ? evidenceKind : retained.length ? "unrooted_partial" as const : "none" as const, elapsedMilliseconds: terminal?.elapsedMilliseconds ?? 0, artifactBytes: terminal?.artifactBytes ?? unrootedBytes, artifactRecords: terminal?.artifactRecords ?? retained.length, artifactInodes: (terminal?.artifactRecords ?? retained.length) + (terminal ? 2 : 1), invocationRecords: evidence?.accountingCount ?? null, outputBytes: evidence?.outputBytes ?? null, cleanupComplete: terminal?.cleanupComplete ?? false }
  })
  const chargedCount = records.length
  if (slots.some((slot, ordinal) => (ordinal < chargedCount) === (slot.status === "unused"))) return fail("RESULT_PREFIX")
  const allSuccess = chargedCount === 4 && containerAbsence && !state?.retentionUncertain && slots.every((slot) => slot.status === "success" && slot.cleanupComplete)
  if ((watchdogStatus === "process_valid") !== allSuccess || (watchdogStatus === "safe_no_start" && chargedCount !== 0)) return fail("RESULT_WATCHDOG")
  const fields = { schemaVersion: "diagnostic-pilot-result-v1" as const, privacy: "private_offline" as const, evidenceClass: "diagnostic_only" as const, status: chargedCount === 0 ? "prestart_denied" as const : "diagnostic_prefix" as const, processValidity: allSuccess ? "process_valid" as const : "process_invalid" as const, allocationRoot: allocation.root, gateRoot: allocation.gateRoot, oldEvidenceBaseline: allocation.oldEvidenceBaseline, elapsedMilliseconds, chargedCount, containerAbsence, slots, unorderedRetainedFragments: slots.some((slot) => slot.evidenceKind === "unordered_partial" || slot.evidenceKind === "unrooted_partial"), oneGeometryOnly: true as const, leagueRequirementsEvidence: false as const, formationAuthorized: false as const, counted: false as const, public: false as const }
  return Object.freeze({ ...fields, root: labRoot("diagnostic-pilot-result-v1", fields) })
}
const diagnosticPilotResultLedger = (): DiagnosticPilotLedger | null => existsSync(DIAGNOSTIC_PILOT_STORE) ? openDiagnosticPilotLedger(DIAGNOSTIC_PILOT_STORE) : null
const publishDiagnosticPilotResult = async (allocation: DiagnosticPilotAllocation, elapsedMilliseconds: number, watchdogStatus: "safe_no_start" | "process_valid" | "process_invalid"): Promise<void> => {
  readDiagnosticPilotAttempt(RESULT_PATH, allocation)
  verifyDiagnosticPilotOldEvidenceBaseline(allocation)
  const containerAbsence = await verifyDiagnosticPilotContainersAbsent(allocation)
  const value = createDiagnosticPilotResult(allocation, diagnosticPilotResultLedger(), elapsedMilliseconds, watchdogStatus, containerAbsence)
  const temporary = `${RESULT_PATH}.tmp-${randomBytes(16).toString("hex")}`
  durableCreate(temporary, value)
  renameSync(temporary, RESULT_PATH)
  syncDirectory(resolve(RESULT_PATH, ".."))
}
export const verifyDiagnosticPilotResult = async (allocation: DiagnosticPilotAllocation, path: string = RESULT_PATH) => {
  if (resolve(path) !== resolve(RESULT_PATH)) return fail("RESULT_PATH")
  verifyDiagnosticPilotOldEvidenceBaseline(allocation)
  const raw = JSON.parse(readNoFollowFile(path, 262_144).toString("utf8")) as unknown
  if (exact(raw, ["schemaVersion", "allocationRoot", "gateRoot", "oldEvidenceBaseline", "status", "empiricalAuthority", "root"]) && raw.schemaVersion === "diagnostic-pilot-attempt-marker-v1") return classifyDiagnosticPilotAttemptMarker(path, allocation)
  if (!raw || typeof raw !== "object") return fail("RESULT_SCHEMA")
  const actual = raw as ReturnType<typeof createDiagnosticPilotResult>
  const watchdogStatus = actual.processValidity === "process_valid" ? "process_valid" : actual.chargedCount === 0 ? "safe_no_start" : "process_invalid"
  const containerAbsence = await verifyDiagnosticPilotContainersAbsent(allocation)
  const expected = createDiagnosticPilotResult(allocation, diagnosticPilotResultLedger(), actual.elapsedMilliseconds, watchdogStatus, containerAbsence)
  if (JSON.stringify(raw) !== JSON.stringify(expected)) return fail("RESULT_MISMATCH")
  return expected
}

const waitForCellPermission = (allocation: DiagnosticPilotAllocation, cell: DiagnosticPilotCell, start: DiagnosticPilotStart, sessionToken: string): Promise<boolean> => new Promise((resolvePermission) => {
  const receive = (message: unknown) => {
    if (!exact(message, ["kind", "ordinal", "allocationRoot", "cellRoot", "startRoot", "sessionToken", "deadlineEpochMilliseconds"]) || message.kind !== "cell-go" || message.ordinal !== cell.ordinal || message.allocationRoot !== allocation.root || message.cellRoot !== cell.root || message.startRoot !== start.root || message.sessionToken !== sessionToken || typeof message.deadlineEpochMilliseconds !== "number" || !Number.isFinite(message.deadlineEpochMilliseconds) || performance.timeOrigin + performance.now() >= message.deadlineEpochMilliseconds) { process.off("message", receive); resolvePermission(false); return }
    process.off("message", receive); resolvePermission(true)
  }
  process.on("message", receive)
})
export interface DiagnosticPilotWorkerExecution {
  readonly disposition: "success" | "system_failure" | "player_violation"
  readonly processValidity: "process_valid" | "process_invalid"
  readonly evidenceRoot: LabRoot | null
  readonly artifactBytes: number
  readonly artifactRecords: number
  readonly cleanupComplete: boolean
}
/** Injected private worker seam. It has no provider/Match constructor of its
 * own; production supplies the existing two issuers and canonical adapter. */
export const runDiagnosticPilotWorkerCell = async <T>(input: {
  readonly allocation: DiagnosticPilotAllocation; readonly cell: DiagnosticPilotCell; readonly start: DiagnosticPilotStart; readonly ledger: DiagnosticPilotLedger
  readonly now: () => number; readonly cellStartedAt: number
  readonly issue: (seat: "bottom" | "top") => T
  readonly execute: (bottom: T, top: T, enteredKernel: () => void, enteredEvidence: () => void) => Promise<DiagnosticPilotWorkerExecution>
  readonly close: (handle: T) => boolean
  readonly cleanup: () => Promise<boolean>
  readonly send: (message: PilotMessage) => boolean
  readonly beforeTerminalWrite?: () => void
  readonly afterTerminalWrite?: () => void
}): Promise<"continue" | "stop"> => {
  const { allocation, cell, start, ledger } = input
  if (!ledger.writeTerminalV2 || !ledger.readTerminalV2 || !ledger.writeStageCheckpoint || !ledger.readStageCheckpoint) return fail("WORKER_V2_LEDGER")
  let bottom: T | null = null, top: T | null = null, completionAttempted = false, publicationAttempted = false, atPublication = false
  let lastWorkStage: "unknown" | "bottom_issuance" | "top_issuance" | "pre_kernel_binding" | "kernel_or_callback" | "first_evidence_write" = "unknown"
  const checkpoint = (ordinal: number) => {
    if (!ledger.writeStageCheckpoint || !ledger.readStageCheckpoint) return fail("STAGE_LEDGER")
    if (ledger.readStageCheckpoint(start.root, ordinal) === null) ledger.writeStageCheckpoint(createDiagnosticPilotStageCheckpoint(start, ordinal, ["bottom_issuance", "top_issuance", "pre_kernel_binding", "kernel_or_callback", "first_evidence_write", "terminal_publication"][ordinal] as Parameters<typeof createDiagnosticPilotStageCheckpoint>[2]))
    if (ordinal < 5) lastWorkStage = ["bottom_issuance", "top_issuance", "pre_kernel_binding", "kernel_or_callback", "first_evidence_write"][ordinal] as typeof lastWorkStage
  }
  const elapsed = () => Math.min(DIAGNOSTIC_PILOT_CELL_MS, Math.max(0, Math.ceil(input.now() - input.cellStartedAt)))
  const reopenedTerminal = () => {
    const raw = ledger.readTerminalV2?.(start.root)
    if (raw === null || raw === undefined) return null
    const terminal = admitDiagnosticPilotTerminalV2(start, raw)
    const state = reopenProspectiveDiagnosticPilotLedger(ledger, allocation)
    const reopened = state.records.find((entry) => entry.start.root === start.root)
    if (!reopened || reopened.terminal?.root !== terminal.root || state.retentionUncertain) return fail("WORKER_CELL_REOPEN")
    if (terminal.evidenceRoot !== null) {
      if (!ledger.readEvidence) return fail("WORKER_EVIDENCE_READER")
      const header = JSON.parse(Buffer.from(ledger.readEvidence(start.root, terminal.evidenceRoot)).toString("utf8")) as { schemaVersion?: string }
      const evidence = header.schemaVersion === "diagnostic-pilot-execution-manifest-v1" ? verifyRetainedDiagnosticPilotExecution(ledger, start, terminal.evidenceRoot) : header.schemaVersion === "diagnostic-pilot-partial-evidence-v1" ? verifyRetainedDiagnosticPilotPartialEvidence(ledger, start, terminal.evidenceRoot) : fail("WORKER_EVIDENCE_SCHEMA")
      if (evidence.artifactBytes !== terminal.artifactBytes || evidence.artifactRecords !== terminal.artifactRecords || "disposition" in evidence && evidence.disposition !== terminal.disposition) return fail("WORKER_EVIDENCE_MISMATCH")
    } else if (ledger.listNames().some((name) => name.startsWith(`diagnostic-pilot-${start.root.slice(7)}.evidence-`))) return fail("WORKER_UNROOTED_EVIDENCE")
    return terminal
  }
  const sendCompletion = (terminal: ReturnType<typeof createDiagnosticPilotTerminalV2>, forceStop = false): "continue" | "stop" => {
    if (completionAttempted) return "stop"
    completionAttempted = true
    if (!input.send({ kind: "cell-complete", ordinal: cell.ordinal })) return "stop"
    if (forceStop || terminal.disposition !== "success" || terminal.processValidity !== "process_valid") { input.send({ kind: "done", status: "process_invalid" }); return "stop" }
    return "continue"
  }
  try {
    checkpoint(0)
    bottom = input.issue("bottom")
    checkpoint(1)
    top = input.issue("top")
    checkpoint(2)
    const result = await input.execute(bottom, top, () => checkpoint(3), () => checkpoint(4))
    const cleaned = await input.cleanup()
    if (elapsed() >= DIAGNOSTIC_PILOT_CELL_MS) return fail("WORKER_CELL_DEADLINE")
    checkpoint(5)
    atPublication = true
    const valid = cleaned && result.cleanupComplete && result.processValidity === "process_valid"
    const terminal = createDiagnosticPilotTerminalV2(start, { disposition: valid ? result.disposition : result.disposition === "success" ? "uncertain" : result.disposition, processValidity: valid ? "process_valid" : "process_invalid", evidenceRoot: result.evidenceRoot, cleanupComplete: cleaned && result.cleanupComplete, elapsedMilliseconds: elapsed(), artifactBytes: result.artifactBytes, artifactRecords: result.artifactRecords, code: !cleaned || !result.cleanupComplete ? "cleanup_incomplete" : result.disposition === "success" && !valid ? "system_failure" : result.disposition === "success" ? "completed" : result.disposition, lastEnteredStage: "terminal_publication", failureStage: "unknown", cause: "unknown_internal" })
    publicationAttempted = true
    input.beforeTerminalWrite?.()
    ledger.writeTerminalV2?.(terminal)
    input.afterTerminalWrite?.()
    const verified = reopenedTerminal()
    if (!verified || verified.root !== terminal.root) return fail("WORKER_CELL_REOPEN")
    return sendCompletion(verified)
  } catch (error) {
    if (completionAttempted) return "stop"
    let closeComplete = true
    for (const handle of [bottom, top]) if (handle !== null) { try { if (!input.close(handle)) closeComplete = false } catch { closeComplete = false } }
    let cleaned = false
    try { cleaned = await input.cleanup() } catch { /* uncertain cleanup remains invalid */ }
    let existing: ReturnType<typeof reopenedTerminal> = null
    try { existing = reopenedTerminal() } catch { return "stop" }
    if (existing) { try { return sendCompletion(existing, true) } catch { return "stop" } }
    try { checkpoint(5) } catch { return "stop" }
    if (publicationAttempted) {
      try { ledger.writeFailureDiagnosis?.(createDiagnosticPilotFailureDiagnosis(start, safeDiagnosticPilotCause(error))) } catch { /* no durable cause can be claimed */ }
      return "stop"
    }
    let partial: ReturnType<typeof retainDiagnosticPilotPartialEvidence>
    try { partial = retainDiagnosticPilotPartialEvidence(ledger, start) } catch { partial = { evidenceRoot: null, artifactBytes: 0, artifactRecords: 0 } }
    const terminal = createDiagnosticPilotTerminalV2(start, { disposition: cleaned && closeComplete ? "system_failure" : "uncertain", processValidity: "process_invalid", evidenceRoot: partial.evidenceRoot, cleanupComplete: cleaned && closeComplete, elapsedMilliseconds: elapsed(), artifactBytes: partial.artifactBytes, artifactRecords: partial.artifactRecords, code: cleaned && closeComplete ? "system_failure" : "cleanup_incomplete", lastEnteredStage: "terminal_publication", failureStage: atPublication ? "terminal_publication" : lastWorkStage, cause: safeDiagnosticPilotCause(error) })
    publicationAttempted = true
    try { ledger.writeTerminalV2?.(terminal) } catch { try { ledger.writeFailureDiagnosis?.(createDiagnosticPilotFailureDiagnosis(start, safeDiagnosticPilotCause(error))) } catch { /* start-only remains invalid */ }; return "stop" }
    try { const verified = reopenedTerminal(); if (verified?.root !== terminal.root) return "stop"; return sendCompletion(verified) } catch { return "stop" }
  }
}
type DiagnosticPilotReconciliationCode = "cell_deadline" | "overall_deadline" | "cleanup_incomplete" | "publication_uncertain"
export const parseDiagnosticPilotTimeoutPayload = (value: unknown): { allocation: DiagnosticPilotAllocation; cell: DiagnosticPilotCell; code: DiagnosticPilotReconciliationCode; elapsedMilliseconds: number } => {
  if (!exact(value, ["allocation", "cell", "code", "elapsedMilliseconds"]) || !["cell_deadline", "overall_deadline", "cleanup_incomplete", "publication_uncertain"].includes(String(value.code)) || !Number.isSafeInteger(value.elapsedMilliseconds) || (value.elapsedMilliseconds as number) < 0 || (value.elapsedMilliseconds as number) > DIAGNOSTIC_PILOT_CELL_MS) return fail("WRITER_INPUT")
  const allocation = admitDiagnosticPilotAllocation(value.allocation)
  return { allocation, cell: admitDiagnosticPilotCell(allocation, value.cell), code: value.code as DiagnosticPilotReconciliationCode, elapsedMilliseconds: value.elapsedMilliseconds as number }
}
export const writeDiagnosticPilotTimeout = (allocation: DiagnosticPilotAllocation, cell: DiagnosticPilotCell, code: DiagnosticPilotReconciliationCode, elapsedMilliseconds: number): "written" | "no_start" | "already_terminal" => {
  const admitted = admitDiagnosticPilotCell(admitDiagnosticPilotAllocation(allocation), cell)
  const start = createDiagnosticPilotStart(allocation, admitted)
  const ledger = openDiagnosticPilotLedger(DIAGNOSTIC_PILOT_STORE)
  if (ledger.readStart(start.root) === null) return "no_start"
  admitDiagnosticPilotStart(allocation, admitted, ledger.readStart(start.root))
  const old = ledger.readTerminal(start.root), next = ledger.readTerminalV2?.(start.root)
  if (old !== null && next !== null) return fail("TIMEOUT_VERSION_MIX")
  if (old !== null) { admitDiagnosticPilotTerminal(start, old); return "already_terminal" }
  if (next !== null && next !== undefined) { admitDiagnosticPilotTerminalV2(start, next); return "already_terminal" }
  if (ledger.readStageCheckpoint?.(start.root, 5) === null) ledger.writeStageCheckpoint?.(createDiagnosticPilotStageCheckpoint(start, 5, "terminal_publication"))
  const partial = retainDiagnosticPilotPartialEvidence(ledger, start)
  ledger.writeTerminalV2?.(createDiagnosticPilotTerminalV2(start, { disposition: code === "cleanup_incomplete" || code === "publication_uncertain" ? "uncertain" : "timeout", processValidity: "process_invalid", evidenceRoot: partial.evidenceRoot, cleanupComplete: code !== "cleanup_incomplete", elapsedMilliseconds, artifactBytes: partial.artifactBytes, artifactRecords: partial.artifactRecords, code, lastEnteredStage: "terminal_publication", failureStage: "terminal_publication", cause: "unknown_internal" }))
  const reopened = reopenProspectiveDiagnosticPilotLedger(ledger, allocation)
  if (reopened.retentionUncertain || reopened.records.find((entry) => entry.start.root === start.root)?.terminal?.code !== code) return fail("TIMEOUT_REOPEN")
  return "written"
}

export const probeRetainedDiagnosticPilotTerminal = (allocation: DiagnosticPilotAllocation, cell: DiagnosticPilotCell): "verified" | "absent" | "uncertain" => {
  try {
    const admitted = admitDiagnosticPilotCell(admitDiagnosticPilotAllocation(allocation), cell)
    const start = createDiagnosticPilotStart(allocation, admitted)
    const ledger = openDiagnosticPilotLedger(DIAGNOSTIC_PILOT_STORE)
    const rawStart = ledger.readStart(start.root)
    if (rawStart === null) return "absent"
    admitDiagnosticPilotStart(allocation, admitted, rawStart)
    const old = ledger.readTerminal(start.root), next = ledger.readTerminalV2?.(start.root)
    if (old !== null && next !== null) return "uncertain"
    if (old === null && (next === null || next === undefined)) return reopenProspectiveDiagnosticPilotLedger(ledger, allocation).retentionUncertain ? "uncertain" : "absent"
    const terminal = old !== null ? admitDiagnosticPilotTerminal(start, old) : admitDiagnosticPilotTerminalV2(start, next)
    if (next !== null && next !== undefined) {
      const state = reopenProspectiveDiagnosticPilotLedger(ledger, allocation)
      if (state.retentionUncertain || state.records.find((entry) => entry.start.root === start.root)?.terminal?.root !== terminal.root) return "uncertain"
    }
    if (terminal.evidenceRoot !== null) {
      if (!ledger.readEvidence) return "uncertain"
      const header = JSON.parse(Buffer.from(ledger.readEvidence(start.root, terminal.evidenceRoot)).toString("utf8")) as { schemaVersion?: string }
      const evidence = header.schemaVersion === "diagnostic-pilot-execution-manifest-v1" ? verifyRetainedDiagnosticPilotExecution(ledger, start, terminal.evidenceRoot) : header.schemaVersion === "diagnostic-pilot-partial-evidence-v1" ? verifyRetainedDiagnosticPilotPartialEvidence(ledger, start, terminal.evidenceRoot) : null
      if (!evidence || evidence.artifactBytes !== terminal.artifactBytes || evidence.artifactRecords !== terminal.artifactRecords || "disposition" in evidence && evidence.disposition !== terminal.disposition) return "uncertain"
    } else if (ledger.listNames().some((name) => name.startsWith(`diagnostic-pilot-${start.root.slice(7)}.evidence-`))) return "uncertain"
    return "verified"
  } catch { return "uncertain" }
}

/** Private worker only: it is never invoked by source-only commands or tests.
 * Parent IPC permission arrives before the first durable byte of a cell. */
const runDiagnosticPilotWorker = async (allocationPath: string): Promise<void> => {
  const sessionToken = process.env.DIAGNOSTIC_PILOT_SESSION_TOKEN
  if (!process.send || !sessionToken || !/^[0-9a-f]{64}$/u.test(sessionToken)) return fail("WORKER_IPC")
  const gate = checkDiagnosticPilotGate({})
  requireCompletedDiagnosticPilotSourcePlan()
  const allocation = readExactAllocation(allocationPath, gate)
  readDiagnosticPilotAttempt(RESULT_PATH, allocation)
  verifyDiagnosticPilotOldEvidenceBaseline(allocation)
  preflightDiagnosticPilot(gate, "fresh")
  await observeDiagnosticPilotHost(allocation)
  const historicalRepository = createFactoryRepository(DIAGNOSTIC_PILOT_PHASE264_STORE)
  const readerStartedAt = performance.now()
  const assessed = readDiagnosticPilotAssessedPair(historicalRepository)
  if (performance.now() - readerStartedAt > gate.readerCeilingMilliseconds) return fail("WORKER_READER_LATENCY")
  mkdirSync(DIAGNOSTIC_PILOT_STORE, { mode: 0o700 })
  syncDirectory(resolve(DIAGNOSTIC_PILOT_STORE, ".."))
  const ledger = openDiagnosticPilotLedger(DIAGNOSTIC_PILOT_STORE)
  const existing = reopenDiagnosticPilotLedger(ledger, allocation)
  if (existing.retentionUncertain || existing.records.length > 0) return fail("WORKER_REUSE_DENIED")
  for (const [ordinal] of allocation.cells.entries()) {
    const cell = createDiagnosticPilotCell(allocation, ordinal), start = createDiagnosticPilotStart(allocation, cell)
    process.send({ kind: "cell-request", allocation, cell } satisfies PilotMessage)
    if (!await waitForCellPermission(allocation, cell, start, sessionToken)) { process.send({ kind: "done", status: "safe_no_start" } satisfies PilotMessage); return }
    const cellStartedAt = performance.now()
    preflightDiagnosticPilot(gate, "reserved")
    await observeDiagnosticPilotHost(allocation)
    ledger.writeStart(start)
    const host: FactorySupervisedRuntimeHost = { createFactorySupervisedRuntime: (request) => {
      if (!request.pilotLifetimeGrant) return fail("WORKER_LIFETIME_GRANT")
      const grant = request.pilotLifetimeGrant
      const { executableRoot: _executableRoot, ...runtimeRequest } = request
      return createFactorySupervisedRuntime({ ...runtimeRequest, matchId: `diagnostic-pilot-${start.root.slice(7, 27)}`, containerName: grant.containerName, ownershipLabel: grant.ownershipLabel, image: allocation.image, invocationLimit: 24_800, factoryLifetimeMs: 240_000 })
    } }
    const byRoot = new Map(assessed.map((entry) => [entry.candidate.root, entry]))
    const response = await runDiagnosticPilotWorkerCell({ ledger, allocation, cell, start, cellStartedAt, now: () => performance.now(),
      issue: (seat) => {
        const candidateRoot = seat === "bottom" ? cell.bottomCandidateRoot : cell.topCandidateRoot
        const candidate = byRoot.get(candidateRoot)
        if (!candidate) return fail("WORKER_CANDIDATE")
        const pilotLifetimeGrant = createDiagnosticPilotLifetimeGrant(ledger, allocation, cell, start, seat)
        return issueDiagnosticPilotProviderFromFactoryCandidate({ host, factoryRepository: historicalRepository, ledger, allocation, cell, start, requestRoot: cell.requestRoot, assessed: candidate, pilotLifetimeGrant })
      },
      execute: async (bottom, top, enteredKernel, enteredEvidence) => {
        const smoke = CANONICAL_ARENA_CATALOG_V1_37.arenas.find((arena) => arena.id === "arena:smoke:v1")
        if (!smoke) return fail("WORKER_SMOKE")
        const match = { matchId: `diagnostic-pilot-${start.root.slice(7, 27)}`, seed: allocation.seed, arenaVariant: smoke, bottomPlayerId: leaguePlayerId(cell.bottomCandidateRoot), topPlayerId: leaguePlayerId(cell.topCandidateRoot), initialInitiativePlayerId: leaguePlayerId(cell.initialInitiativeCandidateRoot), bottomStrategyRevisionId: bottom.identity.revisionId, topStrategyRevisionId: top.identity.revisionId }
        let retained: ReturnType<typeof retainDiagnosticPilotExecution> | null = null
        const result = await runDiagnosticPilotCell({ ledger, allocation, cell, start, requestRoot: cell.requestRoot, bottom, top, match, onKernelEntry: enteredKernel, beforeReturn: (execution) => { enteredEvidence(); retained = retainDiagnosticPilotExecution(ledger, start, execution) } })
        if (!retained) return fail("WORKER_MISSING_EVIDENCE")
        const evidence = retained as ReturnType<typeof retainDiagnosticPilotExecution>
        return { ...result, evidenceRoot: evidence.evidenceRoot, artifactBytes: evidence.artifactBytes, artifactRecords: evidence.artifactRecords }
      },
      close: closeDiagnosticPilotIssuedProvider,
      cleanup: () => cleanupDiagnosticPilotContainers(allocation, cell),
      send: (message) => process.send?.(message) === true,
    })
    if (response === "stop") return
  }
  const final = reopenProspectiveDiagnosticPilotLedger(ledger, allocation)
  if (final.retentionUncertain || final.records.length !== 4 || final.records.some((entry) => entry.terminal?.disposition !== "success" || entry.terminal.processValidity !== "process_valid" || !entry.terminal.evidenceRoot)) return fail("WORKER_FINAL_REOPEN")
  for (const entry of final.records) {
    const evidence = verifyRetainedDiagnosticPilotExecution(ledger, entry.start, entry.terminal!.evidenceRoot!)
    if (evidence.disposition !== entry.terminal!.disposition || evidence.artifactBytes !== entry.terminal!.artifactBytes || evidence.artifactRecords !== entry.terminal!.artifactRecords) return fail("WORKER_FINAL_EVIDENCE")
  }
  process.send({ kind: "done", status: "process_valid" } satisfies PilotMessage)
}

type PilotMessage = { kind: "cell-request"; allocation: DiagnosticPilotAllocation; cell: DiagnosticPilotCell } | { kind: "cell-complete"; ordinal: number } | { kind: "done"; status: "safe_no_start" | "process_valid" | "process_invalid" }
export interface PilotWatchdogHost {
  readonly now: () => number
  readonly spawnWorker: (allocationPath: string, sessionToken: string) => ChildProcess
  readonly cleanup: (allocation: DiagnosticPilotAllocation, cell: DiagnosticPilotCell) => Promise<boolean>
  readonly probeTerminal?: (allocation: DiagnosticPilotAllocation, cell: DiagnosticPilotCell) => Promise<"verified" | "absent" | "uncertain">
  readonly publishTimeout: (allocation: DiagnosticPilotAllocation, cell: DiagnosticPilotCell, code: DiagnosticPilotReconciliationCode, elapsedMilliseconds: number) => Promise<"written" | "no_start" | "already_terminal" | "uncertain">
  readonly killGroup: (child: ChildProcess) => void
}
const defaultHost: PilotWatchdogHost = {
  now: () => performance.now(),
  spawnWorker: (allocationPath, sessionToken) => spawn(process.execPath, [...process.execArgv, fileURLToPath(import.meta.url), "worker", allocationPath], { detached: true, stdio: ["ignore", "ignore", "ignore", "ipc"], env: { PATH: process.env.PATH ?? "", NODE_ENV: "production", DIAGNOSTIC_PILOT_SESSION_TOKEN: sessionToken } }),
  cleanup: (allocation, cell) => cleanupDiagnosticPilotContainers(allocation, cell),
  probeTerminal: (allocation, cell) => new Promise((resolveProbe) => {
    const payload = Buffer.from(JSON.stringify({ allocation, cell }), "utf8").toString("base64")
    const probe = spawn(process.execPath, [...process.execArgv, fileURLToPath(import.meta.url), "terminal-probe", payload], { stdio: ["ignore", "pipe", "ignore"], env: { PATH: process.env.PATH ?? "", NODE_ENV: "production" }, shell: false })
    let output = "", settled = false
    const settle = (result: "verified" | "absent" | "uncertain") => { if (settled) return; settled = true; clearTimeout(timer); resolveProbe(result) }
    const timer = setTimeout(() => { probe.kill("SIGKILL"); settle("uncertain") }, 2_000)
    probe.stdout?.on("data", (bytes: Buffer) => { output += bytes.toString("utf8"); if (output.length > 32) { probe.kill("SIGKILL"); settle("uncertain") } })
    probe.on("error", () => settle("uncertain"))
    probe.on("close", (status) => settle(status === 0 && (output === "verified\n" || output === "absent\n" || output === "uncertain\n") ? output.trim() as "verified" | "absent" | "uncertain" : "uncertain"))
  }),
  publishTimeout: (allocation, cell, code, elapsedMilliseconds) => new Promise((resolvePublication) => {
    const payload = Buffer.from(JSON.stringify({ allocation, cell, code, elapsedMilliseconds }), "utf8").toString("base64")
    const writer = spawn(process.execPath, [...process.execArgv, fileURLToPath(import.meta.url), "terminal-writer", payload], { stdio: ["ignore", "pipe", "ignore"], env: { PATH: process.env.PATH ?? "", NODE_ENV: "production" }, shell: false })
    let output = "", failed = false, settled = false
    const timer = setTimeout(() => { if (settled) return; settled = true; failed = true; writer.kill("SIGKILL"); resolvePublication("uncertain") }, 5_000)
    writer.stdout?.on("data", (bytes: Buffer) => { output += bytes.toString("utf8"); if (output.length > 64) { failed = true; writer.kill("SIGKILL") } })
    writer.on("error", () => { failed = true })
    writer.on("close", (status) => { if (settled) return; settled = true; clearTimeout(timer); resolvePublication(!failed && status === 0 && (output === "written\n" || output === "no_start\n" || output === "already_terminal\n") ? output.trim() as "written" | "no_start" | "already_terminal" : "uncertain") })
  }),
  killGroup: (child) => { if (child.pid !== undefined) { try { process.kill(-child.pid, "SIGKILL") } catch { child.kill("SIGKILL") } } },
}
/** The parent performs no historical reading, Docker sync I/O or fsync. The
 * worker must ask permission before each durable start, so this monotonic cell
 * window begins before any charge or provider issuance. */
export const runDiagnosticPilotWatchdog = (allocationPath: string, host: PilotWatchdogHost = defaultHost, overallStartedAt = host.now()): Promise<"safe_no_start" | "process_valid" | "process_invalid"> => {
  const sessionToken = randomBytes(32).toString("hex")
  const child = host.spawnWorker(allocationPath, sessionToken)
  return new Promise((resolveRun) => {
    let finished = false, reconciling = false, completed = 0, active: { allocation: DiagnosticPilotAllocation; cell: DiagnosticPilotCell; startedAt: number } | null = null
    let timer: NodeJS.Timeout | null = null
    const settle = (status: "safe_no_start" | "process_valid" | "process_invalid") => { if (finished) return; finished = true; if (timer) clearTimeout(timer); resolveRun(status) }
    const reconcile = (code: "cell_deadline" | "overall_deadline" | "publication_uncertain") => {
      if (finished || reconciling) return
      reconciling = true
      try { host.killGroup(child) } catch { /* exact-owner cleanup still runs */ }
      if (!active) { settle(completed === 0 ? "safe_no_start" : "process_invalid"); return }
      const current = active
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => settle("process_invalid"), DIAGNOSTIC_PILOT_WATCHDOG_RESERVE_MS)
      void (async () => {
        let clean = false
        try { clean = await host.cleanup(current.allocation, current.cell) } catch { /* publish uncertain charge */ }
        let probe: "verified" | "absent" | "uncertain" = "absent"
        try { probe = await host.probeTerminal?.(current.allocation, current.cell) ?? "absent" } catch { probe = "uncertain" }
        if (probe !== "absent") { settle("process_invalid"); return }
        let publication: "written" | "no_start" | "already_terminal" | "uncertain" = "uncertain"
        try { publication = await host.publishTimeout(current.allocation, current.cell, clean ? code : "cleanup_incomplete", Math.min(DIAGNOSTIC_PILOT_CELL_MS, Math.max(0, Math.ceil(host.now() - current.startedAt)))) } catch { /* start-only remains invalid */ }
        settle(clean && publication === "no_start" && completed === 0 ? "safe_no_start" : "process_invalid")
      })()
    }
    const arm = (at: number, code: "cell_deadline" | "overall_deadline") => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => reconcile(code), Math.max(0, at - host.now()))
    }
    arm(overallStartedAt + DIAGNOSTIC_PILOT_OVERALL_MS - DIAGNOSTIC_PILOT_WATCHDOG_RESERVE_MS, "overall_deadline")
    child.on("message", (raw: PilotMessage) => {
      if (finished || !raw || typeof raw !== "object") return
      if (raw.kind === "cell-request") {
        try {
          if (active) return fail("OVERLAPPING_CELLS")
          const allocation = admitDiagnosticPilotAllocation(raw.allocation), cell = admitDiagnosticPilotCell(allocation, raw.cell), now = host.now()
          if (cell.ordinal !== completed || !canStartDiagnosticPilotCell(now, overallStartedAt)) { child.send?.({ kind: "stop" }); try { host.killGroup(child) } catch { /* no charge was authorized */ }; settle(completed === 0 ? "safe_no_start" : "process_invalid"); return }
          active = { allocation, cell, startedAt: now }
          const schedule = computeDiagnosticPilotDeadlines({ overallStartedAt, cellStartedAt: now })
          arm(schedule.killAt, schedule.cellHardAt <= schedule.overallHardAt ? "cell_deadline" : "overall_deadline")
          const start = createDiagnosticPilotStart(allocation, cell)
          child.send?.({ kind: "cell-go", ordinal: cell.ordinal, allocationRoot: allocation.root, cellRoot: cell.root, startRoot: start.root, sessionToken, deadlineEpochMilliseconds: performance.timeOrigin + schedule.killAt })
        } catch { if (active) reconcile("publication_uncertain"); else { try { host.killGroup(child) } catch { /* no charged cell */ }; settle("process_invalid") } }
      } else if (raw.kind === "cell-complete") {
        if (!active || raw.ordinal !== active.cell.ordinal) { if (active) reconcile("publication_uncertain"); else { try { host.killGroup(child) } catch { /* no charged cell */ }; settle("process_invalid") }; return }
        completed++
        active = null
        arm(overallStartedAt + DIAGNOSTIC_PILOT_OVERALL_MS - DIAGNOSTIC_PILOT_WATCHDOG_RESERVE_MS, "overall_deadline")
      } else if (raw.kind === "done") {
        if (active) { reconcile("publication_uncertain"); return }
        settle(raw.status === "process_valid" && completed === 4 ? "process_valid" : raw.status === "safe_no_start" && completed === 0 ? "safe_no_start" : "process_invalid")
      }
    })
    child.on("error", () => reconcile("publication_uncertain"))
    child.on("exit", () => { if (!finished) reconcile("publication_uncertain") })
  })
}

const runDiagnosticPilotAuxiliary = (kind: "attempt-writer" | "result-writer", payload: unknown, timeoutMilliseconds: number): Promise<boolean> => new Promise((resolveAuxiliary) => {
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64")
  const child = spawn(process.execPath, [...process.execArgv, fileURLToPath(import.meta.url), kind, encoded], { detached: true, stdio: ["ignore", "pipe", "ignore"], env: { PATH: process.env.PATH ?? "", NODE_ENV: "production" }, shell: false })
  let output = "", settled = false, failed = false
  const settle = (ok: boolean) => { if (settled) return; settled = true; clearTimeout(timer); resolveAuxiliary(ok) }
  const timer = setTimeout(() => { if (child.pid) { try { process.kill(-child.pid, "SIGKILL") } catch { child.kill("SIGKILL") } }; settle(false) }, timeoutMilliseconds)
  child.stdout?.on("data", (bytes: Buffer) => { output += bytes.toString("utf8"); if (output.length > 32) { failed = true; if (child.pid) { try { process.kill(-child.pid, "SIGKILL") } catch { child.kill("SIGKILL") } } } })
  child.on("error", () => { failed = true; settle(false) })
  child.on("close", (status) => settle(!failed && status === 0 && output === "ok\n"))
})

const main = async (args: readonly string[]) => {
  const command = args[0]
  if (command === "check-gate") { const paths = parsePilotPaths(args.slice(1), ["gate"]); checkDiagnosticPilotGate({ gatePath: paths.gate }); process.stdout.write("diagnostic-pilot-gate: pass\n"); return }
  if (command === "check-repair-gate") { if (args.length !== 3 || args[1] !== "--gate" || resolve(args[2]!) !== resolve(REPAIR_GATE_PATH)) return fail("REPAIR_GATE_PATH"); const gate = checkDiagnosticPilotRepairGate({ gatePath: args[2] }); process.stdout.write(JSON.stringify({ root: gate.root, sourceClosureRoot: gate.sourceClosureRoot, empiricalAuthority: false, runAllowed: false }) + "\n"); return }
  if (command === "measure-targeted-reader") { process.stdout.write(JSON.stringify({ elapsedMilliseconds: measureDiagnosticPilotReader(), sourceOnly: true, empiricalAuthority: false }) + "\n"); return }
  if (command === "prepare") { const paths = parsePilotPaths(args.slice(1), ["gate", "allocation", "factory-repository", "repository"]); const gate = checkDiagnosticPilotGate({ gatePath: paths.gate }); requireCompletedDiagnosticPilotSourcePlan(); if (existsSync(paths.repository!) || existsSync(RESULT_PATH)) return fail("PREPARE_PRIOR_STATE"); const allocation = createDiagnosticPilotAllocation({ sourceClosureRoot: gate.sourceClosureRoot, implementationRoot: gate.sourceClosureRoot, gateRoot: gate.root, oldEvidenceBaseline: readDiagnosticPilotOldEvidenceBaseline() }); durableCreate(paths.allocation!, allocation); process.stdout.write(JSON.stringify({ allocationRoot: allocation.root, prepared: true, empiricalAuthority: false }) + "\n"); return }
  if (command === "preflight") { const paths = parsePilotPaths(args.slice(1), ["gate", "allocation", "factory-repository", "repository"]); const gate = checkDiagnosticPilotGate({ gatePath: paths.gate }); requireCompletedDiagnosticPilotSourcePlan(); if (existsSync(RESULT_PATH)) return fail("PREFLIGHT_PRIOR_ATTEMPT"); const allocation = readExactAllocation(paths.allocation!, gate); verifyDiagnosticPilotOldEvidenceBaseline(allocation); const capacity = preflightDiagnosticPilot(gate); const reader = measureDiagnosticPilotReader(); if (reader > gate.readerCeilingMilliseconds) return fail("PREFLIGHT_READER_LATENCY"); const host = await observeDiagnosticPilotHost(allocation); process.stdout.write(JSON.stringify({ capacity, host, readerMilliseconds: reader, consuming: false }) + "\n"); return }
  if (command === "verify-retained") { const paths = parsePilotPaths(args.slice(1), ["gate", "allocation", "result", "repository", "factory-repository"]); const gate = checkDiagnosticPilotGate({ gatePath: paths.gate }); const allocation = readExactAllocation(paths.allocation!, gate); const outcome = await verifyDiagnosticPilotResult(allocation, paths.result); process.stdout.write(JSON.stringify(outcome) + "\n"); if (outcome.processValidity !== "process_valid") process.exitCode = 1; return }
  if (command === "verify-retained-v1") { if (args.length !== 1) return fail("ARGUMENTS"); const verdict = await verifyRetainedDiagnosticPilotV1(); process.stdout.write(JSON.stringify(verdict) + "\n"); process.exitCode = 1; return }
  if (command === "check-retained-v1-contract") { if (args.length !== 1) return fail("ARGUMENTS"); const verdict = checkRetainedDiagnosticPilotV1Contract(); process.stdout.write(JSON.stringify(verdict) + "\n"); return }
  if (command === "run") {
    const overallStartedAt = performance.now()
    const paths = parsePilotPaths(args.slice(1), ["gate", "allocation", "result", "repository", "factory-repository"])
    const attempted = await runDiagnosticPilotAuxiliary("attempt-writer", { gatePath: paths.gate, allocationPath: paths.allocation, resultPath: paths.result }, 10_000)
    if (!attempted) return fail("ATTEMPT_UNCERTAIN")
    const outcome = await runDiagnosticPilotWatchdog(paths.allocation!, defaultHost, overallStartedAt)
    const elapsedMilliseconds = Math.ceil(performance.now() - overallStartedAt)
    if (elapsedMilliseconds >= DIAGNOSTIC_PILOT_OVERALL_MS) return fail("RESULT_DEADLINE")
    const published = await runDiagnosticPilotAuxiliary("result-writer", { gatePath: paths.gate, allocationPath: paths.allocation, resultPath: paths.result, elapsedMilliseconds, watchdogStatus: outcome }, Math.min(5_000, DIAGNOSTIC_PILOT_OVERALL_MS - elapsedMilliseconds))
    if (!published) return fail("RESULT_UNCERTAIN")
    process.stdout.write(`${outcome}\n`); if (outcome !== "process_valid") process.exitCode = 1; return
  }
  if (command === "worker") { if (!args[1]) return fail("WORKER_ALLOCATION_ARGUMENT"); return runDiagnosticPilotWorker(args[1]) }
  if (command === "attempt-writer") { if (!args[1]) return fail("ATTEMPT_WRITER_INPUT"); const payload = JSON.parse(Buffer.from(args[1], "base64").toString("utf8")) as unknown; if (!exact(payload, ["gatePath", "allocationPath", "resultPath"]) || payload.resultPath !== RESULT_PATH || payload.gatePath !== GATE_PATH || payload.allocationPath !== ALLOCATION_PATH) return fail("ATTEMPT_WRITER_INPUT"); const gate = checkDiagnosticPilotGate({ gatePath: payload.gatePath }); requireCompletedDiagnosticPilotSourcePlan(); const allocation = readExactAllocation(payload.allocationPath, gate); reserveDiagnosticPilotAttempt(payload.resultPath, allocation); process.stdout.write("ok\n"); return }
  if (command === "result-writer") { if (!args[1]) return fail("RESULT_WRITER_INPUT"); const payload = JSON.parse(Buffer.from(args[1], "base64").toString("utf8")) as unknown; if (!exact(payload, ["gatePath", "allocationPath", "resultPath", "elapsedMilliseconds", "watchdogStatus"]) || payload.resultPath !== RESULT_PATH || payload.gatePath !== GATE_PATH || payload.allocationPath !== ALLOCATION_PATH || !["safe_no_start", "process_valid", "process_invalid"].includes(String(payload.watchdogStatus))) return fail("RESULT_WRITER_INPUT"); const gate = checkDiagnosticPilotGate({ gatePath: payload.gatePath }); const allocation = readExactAllocation(payload.allocationPath, gate); await publishDiagnosticPilotResult(allocation, payload.elapsedMilliseconds as number, payload.watchdogStatus as "safe_no_start" | "process_valid" | "process_invalid"); process.stdout.write("ok\n"); return }
  if (command === "terminal-writer") { if (!args[1]) return fail("WRITER_INPUT"); const decoded = parseDiagnosticPilotTimeoutPayload(JSON.parse(Buffer.from(args[1], "base64").toString("utf8")) as unknown); const outcome = writeDiagnosticPilotTimeout(decoded.allocation, decoded.cell, decoded.code, decoded.elapsedMilliseconds); process.stdout.write(`${outcome}\n`); return }
  if (command === "terminal-probe") { if (args.length !== 2) return fail("PROBE_INPUT"); const raw = JSON.parse(Buffer.from(args[1]!, "base64").toString("utf8")) as unknown; if (!exact(raw, ["allocation", "cell"])) return fail("PROBE_INPUT"); const allocation = admitDiagnosticPilotAllocation(raw.allocation), cell = admitDiagnosticPilotCell(allocation, raw.cell); process.stdout.write(`${probeRetainedDiagnosticPilotTerminal(allocation, cell)}\n`); return }
  return fail("COMMAND")
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) void main(process.argv.slice(2)).catch((error: unknown) => { process.stderr.write(`${error instanceof Error ? error.message : "DIAGNOSTIC_PILOT_UNKNOWN"}\n`); process.exitCode = 1 })
