#!/usr/bin/env -S pnpm exec tsx
import { createHash } from "node:crypto"
import { spawnSync } from "node:child_process"
import { existsSync, mkdirSync, openSync, readFileSync, renameSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import {
  createV137RestrictedEvidenceStore,
  v137RestrictedEvidenceObjectRelativePath,
  type V137PublicRestrictedEvidenceRef,
  type V137RestrictedEvidenceRecord,
} from "./lib/v1-37-restricted-evidence-store.js"
import {
  V137_INTEGRATED_SERVICE_PROOF_CONTROL_PATH,
  checkV137IntegratedServiceProof,
} from "./run-v1-37-integrated-service-proof.js"

export const V137_BROWSER_PROOF_CONTROL_PATH = "control/v1.37-browser-proof.json" as const
const SHA = /^sha256:[0-9a-f]{64}$/u
const projects = ["desktop", "mobile"] as const
type Project = (typeof projects)[number]
type Observation = Readonly<{
  project: Project
  status: "passed"
  network: "live-scanned"
  document: "scanned"
  board: "nonblank-contained-in-bounds-terminal-consistent"
  responseRootSha256: `sha256:${string}`
}>

export interface V137BrowserProofReceipt {
  schemaVersion: "v1.37-browser-proof-receipt-v1"
  status: "passed"
  topology: "live-integrated-service"
  projects: readonly Project[]
  fixtureComplement: true
  proofDataHandoffDigest: `sha256:${string}`
  observations: readonly Observation[]
  browserProofReceiptRef: V137PublicRestrictedEvidenceRef
}
interface Control {
  schemaVersion: "v1.37-browser-proof-control-v1"
  inputRootSha256: `sha256:${string}`
  receipt: V137BrowserProofReceipt
  records: readonly V137RestrictedEvidenceRecord[]
}
const hash = (value: Uint8Array | string): `sha256:${string}` =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`
const fail = (code: string): never => { throw new TypeError(code) }
const exactKeys = (value: object, keys: readonly string[]): boolean => {
  const actual = Object.keys(value).sort(); const expected = [...keys].sort()
  return actual.length === expected.length && actual.every((key, index) => key === expected[index])
}
const validRef = (value: unknown): value is V137PublicRestrictedEvidenceRef =>
  value !== null && typeof value === "object" && exactKeys(value as object, ["availabilityPosture", "attestationSha256", "class", "retentionClass", "schemaVersion", "sha256"]) &&
  (value as V137PublicRestrictedEvidenceRef).schemaVersion === "v1.37-restricted-evidence-ref-v1" &&
  (value as V137PublicRestrictedEvidenceRef).class === "privacy-scan" && SHA.test((value as V137PublicRestrictedEvidenceRef).sha256) && SHA.test((value as V137PublicRestrictedEvidenceRef).attestationSha256)

export const createV137BrowserProofReceiptFixture = (): V137BrowserProofReceipt => {
  const digest = hash("v1.37-browser-proof-fixture-handoff")
  return {
    schemaVersion: "v1.37-browser-proof-receipt-v1", status: "passed", topology: "live-integrated-service", projects,
    fixtureComplement: true, proofDataHandoffDigest: digest,
    observations: projects.map((project) => ({ project, status: "passed", network: "live-scanned", document: "scanned", board: "nonblank-contained-in-bounds-terminal-consistent", responseRootSha256: hash(`fixture-${project}`) })),
    browserProofReceiptRef: { schemaVersion: "v1.37-restricted-evidence-ref-v1", sha256: hash("fixture-browser-receipt"), class: "privacy-scan", attestationSha256: hash("fixture-browser-attestation"), retentionClass: "certificate-plus-audit-window", availabilityPosture: "available" },
  }
}

export const validateV137BrowserProofReceipt = (input: unknown): V137BrowserProofReceipt => {
  if (input === null || typeof input !== "object" || Array.isArray(input) || !exactKeys(input as object, ["browserProofReceiptRef", "fixtureComplement", "observations", "projects", "proofDataHandoffDigest", "schemaVersion", "status", "topology"])) fail("V137_BROWSER_PROOF_RECEIPT_SHAPE")
  const receipt = input as V137BrowserProofReceipt
  if (receipt.schemaVersion !== "v1.37-browser-proof-receipt-v1" || receipt.status !== "passed" || receipt.topology !== "live-integrated-service") fail("V137_BROWSER_PROOF_RECEIPT_INVALID")
  if (receipt.projects.length !== 2 || receipt.projects[0] !== "desktop" || receipt.projects[1] !== "mobile" || receipt.observations.length !== 2 || receipt.observations.some((entry, index) => entry.project !== projects[index] || entry.status !== "passed" || entry.network !== "live-scanned" || entry.document !== "scanned" || entry.board !== "nonblank-contained-in-bounds-terminal-consistent" || !SHA.test(entry.responseRootSha256))) fail("V137_BROWSER_PROOF_PROJECTS_INVALID")
  if (!receipt.fixtureComplement) fail("V137_BROWSER_PROOF_FIXTURE_COMPLEMENT_REQUIRED")
  if (!SHA.test(receipt.proofDataHandoffDigest)) fail("V137_BROWSER_PROOF_HANDOFF_INVALID")
  if (!validRef(receipt.browserProofReceiptRef)) fail("V137_BROWSER_PROOF_RECEIPT_REF_INVALID")
  return receipt
}

const inputRoot = (repoRoot: string): `sha256:${string}` => hash([
  "scripts/run-v1-37-browser-proof.ts", "scripts/run-v1-37-browser-proof.test.ts", "apps/web/e2e/v1-37-integrated-service-proof.spec.ts", "package.json",
].map((file) => `${file}:${hash(readFileSync(path.join(repoRoot, file)))}`).join("\n"))
const controlPath = (root: string): string => path.join(root, V137_BROWSER_PROOF_CONTROL_PATH)
const readControl = (root: string): Control => {
  const target = controlPath(root); if (!existsSync(target)) fail("V137_BROWSER_PROOF_CONTROL_MISSING")
  let raw: unknown; try { raw = JSON.parse(readFileSync(target, "utf8")) } catch { fail("V137_BROWSER_PROOF_CONTROL_INVALID") }
  if (raw === null || typeof raw !== "object" || Array.isArray(raw) || !exactKeys(raw as object, ["inputRootSha256", "receipt", "records", "schemaVersion"]) || (raw as Control).schemaVersion !== "v1.37-browser-proof-control-v1") fail("V137_BROWSER_PROOF_CONTROL_INVALID")
  return raw as Control
}
export const checkV137BrowserProof = (repoRoot: string, restrictedRoot: string): V137BrowserProofReceipt => {
  const control = readControl(restrictedRoot)
  if (control.inputRootSha256 !== inputRoot(repoRoot)) fail("V137_BROWSER_PROOF_INPUT_STALE")
  return validateV137BrowserProofReceipt(control.receipt)
}

const writeControl = (root: string, control: Control): void => {
  const target = controlPath(root); mkdirSync(path.dirname(target), { recursive: true, mode: 0o700 }); const temporary = `${target}.${process.pid}.tmp`; writeFileSync(temporary, `${JSON.stringify(control)}\n`, { mode: 0o600, flag: "wx" }); renameSync(temporary, target)
}
export const writeV137BrowserProofFixture = (repoRoot: string, restrictedRoot: string): Control => {
  const receipt = createV137BrowserProofReceiptFixture()
  const control: Control = { schemaVersion: "v1.37-browser-proof-control-v1", inputRootSha256: inputRoot(repoRoot), receipt, records: [] }
  writeControl(restrictedRoot, control); return control
}

const readHandoff = (repoRoot: string, restrictedRoot: string): { digest: `sha256:${string}`; descriptor: unknown } => {
  const service = checkV137IntegratedServiceProof(repoRoot, restrictedRoot)
  const control = JSON.parse(readFileSync(path.join(restrictedRoot, V137_INTEGRATED_SERVICE_PROOF_CONTROL_PATH), "utf8")) as { records: V137RestrictedEvidenceRecord[]; receipt: typeof service }
  const record = control.records.find((entry) => entry.reference.sha256 === service.proofDataHandoffRef.sha256)
  if (!record) fail("V137_BROWSER_PROOF_HANDOFF_MISSING")
  const bytes = readFileSync(path.join(restrictedRoot, v137RestrictedEvidenceObjectRelativePath(record.reference.sha256)))
  if (hash(bytes) !== record.reference.sha256) fail("V137_BROWSER_PROOF_HANDOFF_INVALID")
  const descriptor = JSON.parse(bytes.toString("utf8")) as Record<string, unknown>
  if (typeof descriptor.matchSetId !== "string" || typeof descriptor.replayMatchId !== "string" || typeof descriptor.chronicleId !== "string") fail("V137_BROWSER_PROOF_HANDOFF_INVALID")
  return { digest: hash(bytes), descriptor }
}
const run = (repoRoot: string, args: string[], environment: NodeJS.ProcessEnv): void => {
  const result = spawnSync("pnpm", args, { cwd: repoRoot, env: environment, encoding: "utf8", timeout: 20 * 60_000, shell: false })
  if (result.status !== 0) fail("V137_BROWSER_PROOF_PLAYWRIGHT_FAILED")
}
export const writeV137BrowserProof = (repoRoot: string, rawEnvironment: NodeJS.ProcessEnv = process.env): Control => {
  if (rawEnvironment.COWARDS_V1_37_REQUIRE_INTEGRATED_PROOF !== "1") fail("V137_BROWSER_PROOF_STRICT_FLAG_REQUIRED")
  const restrictedRoot = rawEnvironment.COWARDS_V1_37_RESTRICTED_EVIDENCE_ROOT; if (!restrictedRoot) fail("V137_BROWSER_PROOF_RESTRICTED_ROOT_REQUIRED")
  const handoff = readHandoff(repoRoot, restrictedRoot)
  const handoffPath = path.join(restrictedRoot, "control/v1.37-browser-proof-handoff.json")
  writeFileSync(handoffPath, JSON.stringify(handoff.descriptor), { mode: 0o600, flag: "wx" })
  const observationsPath = path.join(restrictedRoot, "control/v1.37-browser-proof-observations.json")
  run(repoRoot, ["exec", "playwright", "test", "--project=desktop", "--project=mobile", "--workers=1", "v1-37-integrated-service-proof.spec.ts"], { ...rawEnvironment, PLAYWRIGHT_TEST: "1", COWARDS_V1_37_BROWSER_PROOF_HANDOFF_PATH: handoffPath, COWARDS_V1_37_BROWSER_PROOF_OBSERVATIONS_PATH: observationsPath })
  const observations = JSON.parse(readFileSync(observationsPath, "utf8")) as readonly Observation[]
  const store = createV137RestrictedEvidenceStore({ repoRoot, maxObjectBytes: 16 * 1024 * 1024 })
  const record = store.writeEvidence({ bytes: Buffer.from(JSON.stringify({ handoff: handoff.descriptor, observations }), "utf8"), evidenceClass: "privacy-scan", actorClass: "collector", latestBoundCertificateValidUntil: new Date(Date.now() + 30 * 86_400_000).toISOString() })
  const receipt: V137BrowserProofReceipt = { ...createV137BrowserProofReceiptFixture(), proofDataHandoffDigest: handoff.digest, observations, browserProofReceiptRef: record.reference }
  validateV137BrowserProofReceipt(receipt)
  const control: Control = { schemaVersion: "v1.37-browser-proof-control-v1", inputRootSha256: inputRoot(repoRoot), receipt, records: [record] }
  writeControl(restrictedRoot, control); return control
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = path.resolve(import.meta.dirname, ".."); const mode = process.argv[2]
  try { const result = mode === "--write" ? writeV137BrowserProof(root) : mode === "--check" ? checkV137BrowserProof(root, process.env.COWARDS_V1_37_RESTRICTED_EVIDENCE_ROOT ?? "") : fail("V137_BROWSER_PROOF_MODE_INVALID"); process.stdout.write(`${JSON.stringify(mode === "--write" ? { status: result.receipt.status, browserProofReceiptRef: result.receipt.browserProofReceiptRef } : { status: result.status, browserProofReceiptRef: result.browserProofReceiptRef })}\n`) } catch (error) { process.stderr.write(`${error instanceof Error ? error.message : "V137_BROWSER_PROOF_FAILED"}\n`); process.exitCode = 1 }
}
