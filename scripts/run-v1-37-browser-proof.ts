#!/usr/bin/env -S pnpm exec tsx
import { createHash } from "node:crypto"
import { spawnSync } from "node:child_process"
import { constants, closeSync, existsSync, lstatSync, mkdirSync, openSync, readFileSync, realpathSync, renameSync, unlinkSync, writeFileSync } from "node:fs"
import { createServer } from "node:net"
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
  topology: "live-web-fixture-complement"
  liveBackendData: false
  serviceReceiptBound: true
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
    schemaVersion: "v1.37-browser-proof-receipt-v1", status: "passed", topology: "live-web-fixture-complement", liveBackendData: false, serviceReceiptBound: true, projects,
    fixtureComplement: true, proofDataHandoffDigest: digest,
    observations: projects.map((project) => ({ project, status: "passed", network: "live-scanned", document: "scanned", board: "nonblank-contained-in-bounds-terminal-consistent", responseRootSha256: hash(`fixture-${project}`) })),
    browserProofReceiptRef: { schemaVersion: "v1.37-restricted-evidence-ref-v1", sha256: hash("fixture-browser-receipt"), class: "privacy-scan", attestationSha256: hash("fixture-browser-attestation"), retentionClass: "certificate-plus-audit-window", availabilityPosture: "available" },
  }
}

export const validateV137BrowserProofReceipt = (input: unknown): V137BrowserProofReceipt => {
  if (input === null || typeof input !== "object" || Array.isArray(input) || !exactKeys(input as object, ["browserProofReceiptRef", "fixtureComplement", "liveBackendData", "observations", "projects", "proofDataHandoffDigest", "schemaVersion", "serviceReceiptBound", "status", "topology"])) fail("V137_BROWSER_PROOF_RECEIPT_SHAPE")
  const receipt = input as V137BrowserProofReceipt
  if (receipt.schemaVersion !== "v1.37-browser-proof-receipt-v1" || receipt.status !== "passed" || receipt.topology !== "live-web-fixture-complement" || receipt.liveBackendData !== false || receipt.serviceReceiptBound !== true) fail("V137_BROWSER_PROOF_RECEIPT_INVALID")
  if (receipt.projects.length !== 2 || receipt.projects[0] !== "desktop" || receipt.projects[1] !== "mobile" || receipt.observations.length !== 2 || receipt.observations.some((entry, index) => entry.project !== projects[index] || entry.status !== "passed" || entry.network !== "live-scanned" || entry.document !== "scanned" || entry.board !== "nonblank-contained-in-bounds-terminal-consistent" || !SHA.test(entry.responseRootSha256))) fail("V137_BROWSER_PROOF_PROJECTS_INVALID")
  if (!receipt.fixtureComplement) fail("V137_BROWSER_PROOF_FIXTURE_COMPLEMENT_REQUIRED")
  if (!SHA.test(receipt.proofDataHandoffDigest)) fail("V137_BROWSER_PROOF_HANDOFF_INVALID")
  if (!validRef(receipt.browserProofReceiptRef)) fail("V137_BROWSER_PROOF_RECEIPT_REF_INVALID")
  return receipt
}

const inputRoot = (repoRoot: string): `sha256:${string}` => hash([
  "scripts/run-v1-37-browser-proof.ts", "scripts/run-v1-37-browser-proof.test.ts", "apps/web/e2e/v1-37-integrated-service-proof.spec.ts", "apps/web/e2e/v1-37-rules-integrity-proof.spec.ts", "package.json",
].map((file) => `${file}:${hash(readFileSync(path.join(repoRoot, file)))}`).join("\n"))
const controlPath = (root: string, relativePath = V137_BROWSER_PROOF_CONTROL_PATH): string => {
  if (path.isAbsolute(relativePath)) fail("V137_BROWSER_PROOF_CONTROL_INVALID")
  const absoluteRoot = path.resolve(root)
  const target = path.resolve(absoluteRoot, relativePath)
  if (!target.startsWith(`${absoluteRoot}${path.sep}`)) fail("V137_BROWSER_PROOF_CONTROL_INVALID")
  if (lstatSync(absoluteRoot).isSymbolicLink()) fail("V137_BROWSER_PROOF_RESTRICTED_SYMLINK")
  let cursor = absoluteRoot
  for (const segment of path.relative(absoluteRoot, target).split(path.sep).filter(Boolean)) {
    cursor = path.join(cursor, segment)
    if (!existsSync(cursor)) break
    if (lstatSync(cursor).isSymbolicLink()) fail("V137_BROWSER_PROOF_RESTRICTED_SYMLINK")
  }
  return target
}
const readControlFile = (root: string, relativePath = V137_BROWSER_PROOF_CONTROL_PATH): Buffer => {
  const target = controlPath(root, relativePath)
  if (!existsSync(target)) fail("V137_BROWSER_PROOF_CONTROL_MISSING")
  if (!lstatSync(target).isFile() || lstatSync(target).isSymbolicLink()) fail("V137_BROWSER_PROOF_CONTROL_INVALID")
  const descriptor = openSync(target, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0))
  try { return readFileSync(descriptor) } finally { closeSync(descriptor) }
}
const ensureControlDirectory = (root: string): string => {
  const directory = controlPath(root, "control")
  if (!existsSync(directory)) mkdirSync(directory, { mode: 0o700 })
  if (!lstatSync(directory).isDirectory() || lstatSync(directory).isSymbolicLink()) fail("V137_BROWSER_PROOF_RESTRICTED_SYMLINK")
  return directory
}
const readControl = (root: string): Control => {
  let raw: unknown; try { raw = JSON.parse(readControlFile(root).toString("utf8")) } catch { fail("V137_BROWSER_PROOF_CONTROL_INVALID") }
  if (raw === null || typeof raw !== "object" || Array.isArray(raw) || !exactKeys(raw as object, ["inputRootSha256", "receipt", "records", "schemaVersion"]) || (raw as Control).schemaVersion !== "v1.37-browser-proof-control-v1") fail("V137_BROWSER_PROOF_CONTROL_INVALID")
  return raw as Control
}
export const checkV137BrowserProof = (repoRoot: string, restrictedRoot: string): V137BrowserProofReceipt => {
  const control = readControl(restrictedRoot)
  if (control.inputRootSha256 !== inputRoot(repoRoot)) fail("V137_BROWSER_PROOF_INPUT_STALE")
  const receipt = validateV137BrowserProofReceipt(control.receipt)
  if (control.records.length !== 1) fail("V137_BROWSER_PROOF_RECORD_INVENTORY_INVALID")
  const record = control.records[0]!
  if (JSON.stringify(record.reference) !== JSON.stringify(receipt.browserProofReceiptRef)) {
    fail("V137_BROWSER_PROOF_RECORD_INVENTORY_INVALID")
  }
  const store = createV137RestrictedEvidenceStore({ repoRoot, maxObjectBytes: 16 * 1024 * 1024 })
  store.requireReleaseEvidence(record)
  if (readHandoff(repoRoot, restrictedRoot).digest !== receipt.proofDataHandoffDigest) {
    fail("V137_BROWSER_PROOF_HANDOFF_INVALID")
  }
  return receipt
}

const writeControl = (root: string, control: Control): void => {
  const target = controlPath(root)
  ensureControlDirectory(root)
  if (existsSync(target) && (!lstatSync(target).isFile() || lstatSync(target).isSymbolicLink())) fail("V137_BROWSER_PROOF_RESTRICTED_SYMLINK")
  const temporary = `${target}.${process.pid}.tmp`; writeFileSync(temporary, `${JSON.stringify(control)}\n`, { mode: 0o600, flag: "wx" }); renameSync(temporary, target)
}
export const writeV137BrowserProofFixture = (repoRoot: string, restrictedRoot: string): Control => {
  const receipt = createV137BrowserProofReceiptFixture()
  const store = createV137RestrictedEvidenceStore({ repoRoot, maxObjectBytes: 16 * 1024 * 1024 })
  const record = store.writeEvidence({ bytes: Buffer.from("fixture-browser-proof", "utf8"), evidenceClass: "privacy-scan", actorClass: "collector", latestBoundCertificateValidUntil: "2099-01-01T00:00:00.000Z" })
  const control: Control = { schemaVersion: "v1.37-browser-proof-control-v1", inputRootSha256: inputRoot(repoRoot), receipt: { ...receipt, browserProofReceiptRef: record.reference }, records: [record] }
  writeControl(restrictedRoot, control); return control
}

const readHandoff = (repoRoot: string, restrictedRoot: string): { digest: `sha256:${string}`; descriptor: { capabilityReceiptDigest: `sha256:${string}` } } => {
  const service = checkV137IntegratedServiceProof(repoRoot, restrictedRoot)
  const control = JSON.parse(readControlFile(restrictedRoot, V137_INTEGRATED_SERVICE_PROOF_CONTROL_PATH).toString("utf8")) as { records: V137RestrictedEvidenceRecord[]; receipt: typeof service }
  const record = control.records.find((entry) => JSON.stringify(entry.reference) === JSON.stringify(service.proofDataHandoffRef))
  if (!record) fail("V137_BROWSER_PROOF_HANDOFF_MISSING")
  const store = createV137RestrictedEvidenceStore({ repoRoot, maxObjectBytes: 64 * 1024 * 1024 })
  const bytes = store.readEvidence(record, { actorClass: "checker" })
  return { digest: hash(bytes), descriptor: { capabilityReceiptDigest: hash(bytes) } }
}
const run = (repoRoot: string, args: string[], environment: NodeJS.ProcessEnv): void => {
  const result = spawnSync("pnpm", args, { cwd: repoRoot, env: environment, encoding: "utf8", timeout: 20 * 60_000, shell: false })
  if (result.status !== 0) {
    if (process.env.COWARDS_CERTIFICATION_DEBUG === "1") {
      process.stderr.write(`${result.stdout.slice(-8_192)}${result.stderr.slice(-8_192)}`)
    }
    fail("V137_BROWSER_PROOF_PLAYWRIGHT_FAILED")
  }
}
const reservePort = async (): Promise<number> =>
  await new Promise((resolve, reject) => {
    const server = createServer()
    server.once("error", reject)
    server.listen(0, "127.0.0.1", () => {
      const address = server.address()
      if (address === null || typeof address === "string") {
        server.close()
        reject(new Error("V137_BROWSER_PROOF_PORT_RESERVATION"))
        return
      }
      server.close((error) => error ? reject(error) : resolve(address.port))
    })
  })
export const writeV137BrowserProof = async (repoRoot: string, rawEnvironment: NodeJS.ProcessEnv = process.env): Promise<Control> => {
  if (rawEnvironment.COWARDS_V1_37_REQUIRE_INTEGRATED_PROOF !== "1") fail("V137_BROWSER_PROOF_STRICT_FLAG_REQUIRED")
  const restrictedRoot = rawEnvironment.COWARDS_V1_37_RESTRICTED_EVIDENCE_ROOT; if (!restrictedRoot) fail("V137_BROWSER_PROOF_RESTRICTED_ROOT_REQUIRED")
  const store = createV137RestrictedEvidenceStore({ repoRoot, maxObjectBytes: 16 * 1024 * 1024 })
  const handoff = readHandoff(repoRoot, restrictedRoot)
  ensureControlDirectory(restrictedRoot)
  const handoffPath = controlPath(restrictedRoot, `control/v1.37-browser-proof-handoff-${process.pid}.json`)
  writeFileSync(handoffPath, JSON.stringify(handoff.descriptor), { mode: 0o600, flag: "wx" })
  const observationsPath = controlPath(restrictedRoot, `control/v1.37-browser-proof-observations-${process.pid}.json`)
  try {
    const webPort = await reservePort()
    run(repoRoot, ["exec", "playwright", "test", "--project=desktop", "--project=mobile", "--workers=1", "v1-37-integrated-service-proof.spec.ts", "v1-37-rules-integrity-proof.spec.ts"], { ...rawEnvironment, CI: "1", PLAYWRIGHT_TEST: "1", PLAYWRIGHT_BASE_URL: `http://localhost:${webPort}`, COWARDS_V1_37_BROWSER_PROOF_HANDOFF_PATH: handoffPath, COWARDS_V1_37_BROWSER_PROOF_OBSERVATIONS_PATH: observationsPath })
    if (!existsSync(observationsPath)) fail("V137_BROWSER_PROOF_OBSERVATIONS_MISSING")
    const observed = JSON.parse(readFileSync(observationsPath, "utf8")) as { observations: readonly Observation[] }
    const observations = observed.observations
    if (observations.length !== 2) fail("V137_BROWSER_PROOF_OBSERVATIONS_INVALID")
    const record = store.writeEvidence({ bytes: Buffer.from(JSON.stringify({ handoff: handoff.descriptor, limitation: "fixture-backed browser complement; live backend execution is proved by the bound service receipt", observations }), "utf8"), evidenceClass: "privacy-scan", actorClass: "collector", latestBoundCertificateValidUntil: new Date(Date.now() + 30 * 86_400_000).toISOString() })
    const receipt: V137BrowserProofReceipt = { ...createV137BrowserProofReceiptFixture(), proofDataHandoffDigest: handoff.digest, observations, browserProofReceiptRef: record.reference }
    validateV137BrowserProofReceipt(receipt)
    const control: Control = { schemaVersion: "v1.37-browser-proof-control-v1", inputRootSha256: inputRoot(repoRoot), receipt, records: [record] }
    writeControl(restrictedRoot, control)
    return control
  } finally {
    if (existsSync(handoffPath)) unlinkSync(handoffPath)
    if (existsSync(observationsPath)) unlinkSync(observationsPath)
  }
}
const isDirectRun = (): boolean => { try { return !!process.argv[1] && realpathSync(path.resolve(process.argv[1])) === realpathSync(fileURLToPath(import.meta.url)) } catch { return false } }
if (isDirectRun()) {
  const root = path.resolve(import.meta.dirname, ".."); const args = process.argv.slice(2); const mode = args[0]
  if (args.length !== 1 || !["--write", "--check"].includes(mode ?? "")) fail("V137_BROWSER_PROOF_MODE_INVALID")
  void (async () => { try { const result = mode === "--write" ? await writeV137BrowserProof(root) : mode === "--check" ? checkV137BrowserProof(root, process.env.COWARDS_V1_37_RESTRICTED_EVIDENCE_ROOT ?? "") : fail("V137_BROWSER_PROOF_MODE_INVALID"); process.stdout.write(`${JSON.stringify(mode === "--write" ? { status: result.receipt.status, browserProofReceiptRef: result.receipt.browserProofReceiptRef } : { status: result.status, browserProofReceiptRef: result.browserProofReceiptRef })}\n`) } catch (error) { process.stderr.write(`${error instanceof Error ? error.message : "V137_BROWSER_PROOF_FAILED"}\n`); process.exitCode = 1 } })()
}
