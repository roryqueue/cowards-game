#!/usr/bin/env -S pnpm exec tsx
import { createHash } from "node:crypto"
import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { assertPublicOutputLeakSafe } from "@cowards/spec"
import { checkV137ReleaseBoundaries } from "./check-v1-37-release-boundaries.js"
import {
  checkV137BrowserProof,
  type V137BrowserProofReceipt,
} from "./run-v1-37-browser-proof.js"
import {
  checkV137IntegratedServiceProof,
  type V137IntegratedServiceReceipt,
} from "./run-v1-37-integrated-service-proof.js"
import {
  checkV137RollbackProof,
  type V137RollbackProofReceipt,
} from "./run-v1-37-rollback-proof.js"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const SHA = /^sha256:[0-9a-f]{64}$/u
const requirements = ["PROOF-01", "PROOF-02", "PROOF-03", "PROOF-04", "PROOF-05", "PROOF-06"] as const
const decisions = Array.from({ length: 12 }, (_, index) => `D-${String(index + 1).padStart(2, "0")}`) as readonly string[]

export const V137_INTEGRATED_PROOF_ARTIFACT_PATHS = Object.freeze({
  json: ".planning/artifacts/v1.37-integrated-service-proof.json",
  markdown: ".planning/artifacts/v1.37-integrated-service-proof.md",
})

export interface V137IntegratedProof {
  schemaVersion: "v1.37-integrated-service-proof-v1"
  milestone: "v1.37"
  phase: 261
  status: "passed-functional-containment-attested-non-counted"
  requirements: readonly { id: string; status: "proved" }[]
  decisions: readonly { id: string; status: "closed" }[]
  inputRootSha256: `sha256:${string}`
  service: { status: string; laneCount: 4; runCount: 12; scenarioCount: 23; chronicle: "passed"; proofDataHandoffDigest: `sha256:${string}` }
  lanes: readonly { language: "typescript" | "python" | "rust" | "zig"; functionalConformance: "passed"; containmentEvidence: "attested"; counted: false; limitationCode: "proof-local-identity-non-counted" }[]
  rollback: { status: "passed"; scenarioCount: 17; aggregateRootSha256: `sha256:${string}`; historicalDispatches: readonly ["v1.4", "v1.17", "v1.36"] }
  browser: { status: "passed"; topology: "live-web-fixture-complement"; liveBackendData: false; serviceReceiptBound: true; fixtureComplement: true; projects: readonly ["desktop", "mobile"]; board: "nonblank-contained-in-bounds-terminal-consistent"; limitation: "fixture-backed-browser-rendering-complements-separate-real-service-execution" }
  limitations: readonly ["proof-local-containment-is-non-counted", "browser-is-fixture-backed-not-live-backend-data"]
}

const hash = (value: string | Uint8Array): `sha256:${string}` => `sha256:${createHash("sha256").update(value).digest("hex")}`
const canonical = (value: unknown): string => `${JSON.stringify(value)}\n`
const fail = (code: string): never => { throw new TypeError(code) }
const exactKeys = (value: unknown, keys: readonly string[]): boolean => value !== null && typeof value === "object" && !Array.isArray(value) && JSON.stringify(Object.keys(value).sort()) === JSON.stringify([...keys].sort())
const inputPaths = [
  "scripts/evaluate-v1-37-integrated-service-proof.ts",
  "scripts/evaluate-v1-37-integrated-service-proof.test.ts",
  "scripts/run-v1-37-integrated-service-proof.ts",
  "scripts/run-v1-37-rollback-proof.ts",
  "scripts/run-v1-37-browser-proof.ts",
  "scripts/check-v1-37-release-boundaries.ts",
  "package.json",
] as const

export const computeV137IntegratedProofInputRoot = (repoRoot: string): `sha256:${string}` =>
  hash(canonical(inputPaths
    .map((file) => ({
      path: file,
      sha256: hash(readFileSync(path.join(repoRoot, file))),
    }))
    .sort((a, b) => a.path.localeCompare(b.path))))

const safeHandoff = (receipt: V137IntegratedServiceReceipt): `sha256:${string}` => receipt.proofDataHandoffRef.sha256
const project = (service: V137IntegratedServiceReceipt, rollback: V137RollbackProofReceipt, browser: V137BrowserProofReceipt, inputRootSha256: `sha256:${string}`): V137IntegratedProof => ({
  schemaVersion: "v1.37-integrated-service-proof-v1", milestone: "v1.37", phase: 261,
  status: "passed-functional-containment-attested-non-counted",
  requirements: requirements.map((id) => ({ id, status: "proved" })),
  decisions: decisions.map((id) => ({ id, status: "closed" })), inputRootSha256,
  service: { status: service.status, laneCount: 4, runCount: 12, scenarioCount: 23, chronicle: "passed", proofDataHandoffDigest: safeHandoff(service) },
  lanes: service.lanes.map((lane) => ({ language: lane.languageId, functionalConformance: lane.functionalConformance, containmentEvidence: lane.containmentEvidence, counted: lane.counted, limitationCode: lane.limitationCode })),
  rollback: { status: rollback.status, scenarioCount: rollback.scenarios.length, aggregateRootSha256: rollback.aggregateRootSha256, historicalDispatches: ["v1.4", "v1.17", "v1.36"] },
  browser: { status: browser.status, topology: browser.topology, liveBackendData: browser.liveBackendData, serviceReceiptBound: browser.serviceReceiptBound, fixtureComplement: browser.fixtureComplement, projects: [browser.projects[0]!, browser.projects[1]!], board: browser.observations[0]!.board, limitation: "fixture-backed-browser-rendering-complements-separate-real-service-execution" },
  limitations: ["proof-local-containment-is-non-counted", "browser-is-fixture-backed-not-live-backend-data"],
})

export const createV137IntegratedProofFixture = (): V137IntegratedProof => project(
  { status: "passed-functional-containment-attested-non-counted", lanes: ["typescript", "python", "rust", "zig"].map((languageId) => ({ languageId, functionalConformance: "passed", containmentEvidence: "attested", counted: false, limitationCode: "proof-local-identity-non-counted" })), proofDataHandoffRef: { sha256: hash("fixture-handoff") } } as unknown as V137IntegratedServiceReceipt,
  { status: "passed", scenarios: Array.from({ length: 17 }, () => ({})), aggregateRootSha256: hash("fixture-rollback") } as unknown as V137RollbackProofReceipt,
  { status: "passed", topology: "live-web-fixture-complement", liveBackendData: false, serviceReceiptBound: true, fixtureComplement: true, projects: ["desktop", "mobile"], observations: [{ board: "nonblank-contained-in-bounds-terminal-consistent" }] } as unknown as V137BrowserProofReceipt,
  hash("fixture-input"),
)

export const validateV137IntegratedProof = (input: unknown): V137IntegratedProof => {
  const keys = ["browser", "decisions", "inputRootSha256", "lanes", "limitations", "milestone", "phase", "requirements", "rollback", "schemaVersion", "service", "status"]
  if (!exactKeys(input, keys)) fail("V137_INTEGRATED_PROOF_SHAPE")
  const proof = input as V137IntegratedProof
  if (proof.schemaVersion !== "v1.37-integrated-service-proof-v1" || proof.milestone !== "v1.37" || proof.phase !== 261 || proof.status !== "passed-functional-containment-attested-non-counted") fail("V137_INTEGRATED_PROOF_IDENTITY_INVALID")
  if (!SHA.test(proof.inputRootSha256)) fail("V137_INTEGRATED_PROOF_INPUT_ROOT_INVALID")
  if (!Array.isArray(proof.requirements) || JSON.stringify(proof.requirements) !== JSON.stringify(requirements.map((id) => ({ id, status: "proved" })))) fail("V137_INTEGRATED_PROOF_REQUIREMENTS_INVALID")
  if (!Array.isArray(proof.decisions) || JSON.stringify(proof.decisions) !== JSON.stringify(decisions.map((id) => ({ id, status: "closed" })))) fail("V137_INTEGRATED_PROOF_DECISIONS_INVALID")
  if (!Array.isArray(proof.lanes) || proof.lanes.length !== 4 || new Set(proof.lanes.map((lane) => lane.language)).size !== 4 || proof.lanes.some((lane) => lane.functionalConformance !== "passed" || lane.containmentEvidence !== "attested" || lane.counted !== false || lane.limitationCode !== "proof-local-identity-non-counted")) fail("V137_INTEGRATED_PROOF_LANES_INVALID")
  if (proof.service.laneCount !== 4 || proof.service.runCount !== 12 || proof.service.scenarioCount !== 23 || proof.service.chronicle !== "passed" || !SHA.test(proof.service.proofDataHandoffDigest)) fail("V137_INTEGRATED_PROOF_SERVICE_INVALID")
  if (proof.rollback.status !== "passed" || proof.rollback.scenarioCount !== 17 || !SHA.test(proof.rollback.aggregateRootSha256) || JSON.stringify(proof.rollback.historicalDispatches) !== JSON.stringify(["v1.4", "v1.17", "v1.36"])) fail("V137_INTEGRATED_PROOF_ROLLBACK_INVALID")
  if (proof.browser.status !== "passed" || proof.browser.topology !== "live-web-fixture-complement" || proof.browser.liveBackendData !== false || proof.browser.serviceReceiptBound !== true || proof.browser.fixtureComplement !== true || JSON.stringify(proof.browser.projects) !== JSON.stringify(["desktop", "mobile"]) || proof.browser.board !== "nonblank-contained-in-bounds-terminal-consistent" || proof.browser.limitation !== "fixture-backed-browser-rendering-complements-separate-real-service-execution") fail("V137_INTEGRATED_PROOF_BROWSER_LIMITATION_INVALID")
  if (JSON.stringify(proof.limitations) !== JSON.stringify(["proof-local-containment-is-non-counted", "browser-is-fixture-backed-not-live-backend-data"])) fail("V137_INTEGRATED_PROOF_LIMITATIONS_INVALID")
  return proof
}

export const generateV137IntegratedProof = (repoRoot: string, restrictedRoot: string): V137IntegratedProof => {
  const service = checkV137IntegratedServiceProof(repoRoot, restrictedRoot)
  const rollback = checkV137RollbackProof(repoRoot, restrictedRoot)
  const browser = checkV137BrowserProof(repoRoot, restrictedRoot)
  const boundaries = checkV137ReleaseBoundaries("source-fixture", repoRoot)
  if (boundaries.findings.length > 0) fail("V137_INTEGRATED_PROOF_RELEASE_BOUNDARY_FAILED")
  const proof = project(service, rollback, browser, computeV137IntegratedProofInputRoot(repoRoot))
  return validateV137IntegratedProof(proof)
}

export const renderV137IntegratedProofJson = (proof: unknown): string => {
  const checked = validateV137IntegratedProof(proof)
  assertPublicOutputLeakSafe(checked, "v1.37 integrated service proof")
  return canonical(checked)
}
export const renderV137IntegratedProofMarkdown = (proof: unknown): string => {
  const json = JSON.parse(renderV137IntegratedProofJson(proof)) as V137IntegratedProof
  return `# v1.37 Integrated Service Proof\n\nStatus: \`${json.status}\`\n\n- Requirements: ${json.requirements.map((entry) => entry.id).join(", ")}\n- Service: ${json.service.laneCount} functional lanes, ${json.service.runCount} fresh runs, ${json.service.scenarioCount} scenarios; all lanes are non-counted proof-local containment.\n- Rollback/history: ${json.rollback.scenarioCount} scenarios; immutable dispatches ${json.rollback.historicalDispatches.join(", ")}.\n- Browser: desktop/mobile live-web fixture-backed rendering complement; \`liveBackendData: false\`, \`serviceReceiptBound: true\`.\n- Limitation: browser evidence complements the separate real runtime-service execution receipt and does not claim live backend data.\n`
}

export const writeV137IntegratedProofArtifacts = (repoRoot: string, restrictedRoot: string): V137IntegratedProof => {
  const proof = generateV137IntegratedProof(repoRoot, restrictedRoot)
  for (const [kind, artifact] of Object.entries(V137_INTEGRATED_PROOF_ARTIFACT_PATHS)) {
    const target = path.join(repoRoot, artifact)
    const bytes = kind === "json" ? renderV137IntegratedProofJson(proof) : renderV137IntegratedProofMarkdown(proof)
    const temporary = `${target}.tmp-${process.pid}`
    writeFileSync(temporary, bytes, { flag: "w", mode: 0o644 }); renameSync(temporary, target)
  }
  return proof
}
export const checkV137IntegratedProofArtifacts = (repoRoot: string, restrictedRoot: string): V137IntegratedProof => {
  const proof = generateV137IntegratedProof(repoRoot, restrictedRoot)
  const jsonPath = path.join(repoRoot, V137_INTEGRATED_PROOF_ARTIFACT_PATHS.json)
  const markdownPath = path.join(repoRoot, V137_INTEGRATED_PROOF_ARTIFACT_PATHS.markdown)
  if (!existsSync(jsonPath) || !existsSync(markdownPath)) fail("V137_INTEGRATED_PROOF_ARTIFACT_MISSING")
  if (readFileSync(jsonPath, "utf8") !== renderV137IntegratedProofJson(proof) || readFileSync(markdownPath, "utf8") !== renderV137IntegratedProofMarkdown(proof)) fail("V137_INTEGRATED_PROOF_ARTIFACT_EDITED")
  return proof
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const restrictedRoot = process.env.COWARDS_V1_37_RESTRICTED_EVIDENCE_ROOT
    if (!restrictedRoot) fail("V137_INTEGRATED_PROOF_RESTRICTED_ROOT_REQUIRED")
    const proof = process.argv.includes("--write") ? writeV137IntegratedProofArtifacts(root, restrictedRoot) : process.argv.includes("--check") ? checkV137IntegratedProofArtifacts(root, restrictedRoot) : fail("V137_INTEGRATED_PROOF_MODE_INVALID")
    process.stdout.write(`${JSON.stringify({ status: proof.status, inputRootSha256: proof.inputRootSha256 })}\n`)
  } catch (error) { process.stderr.write(`${error instanceof Error ? error.message : "V137_INTEGRATED_PROOF_FAILED"}\n`); process.exitCode = 1 }
}
