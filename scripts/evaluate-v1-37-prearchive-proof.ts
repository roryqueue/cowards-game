#!/usr/bin/env -S pnpm exec tsx
import { createHash } from "node:crypto"
import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { assertPublicOutputLeakSafe } from "@cowards/spec"
import { runV137AuditReproductionGate } from "./check-v1-37-audit-reproduction.js"
import { checkV137ProtectedBaseline } from "./capture-v1-37-protected-baseline.js"
import { checkV137ReleaseBoundaries } from "./check-v1-37-release-boundaries.js"
import { checkV137ExecutableConformanceArtifacts } from "./evaluate-v1-37-executable-conformance.js"
import { checkV137IntegratedProofArtifacts } from "./evaluate-v1-37-integrated-service-proof.js"
import { checkV137TruthfulInputsSetFairnessArtifacts } from "./evaluate-v1-37-truthful-inputs-set-fairness.js"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const SHA = /^sha256:[0-9a-f]{64}$/u
const canonical = (value: unknown): string => `${JSON.stringify(value)}\n`
const digest = (value: string | Uint8Array): `sha256:${string}` => `sha256:${createHash("sha256").update(value).digest("hex")}`
const fail = (code: string): never => { throw new TypeError(code) }
const exactKeys = (value: unknown, keys: readonly string[]): boolean => value !== null && typeof value === "object" && !Array.isArray(value) && JSON.stringify(Object.keys(value).sort()) === JSON.stringify([...keys].sort())

export const V137_PREARCHIVE_PROOF_ARTIFACT_PATHS = Object.freeze({ json: ".planning/artifacts/v1.37-prearchive-proof.json", markdown: ".planning/artifacts/v1.37-prearchive-proof.md" })
const LOWER_PROOF_IDS = ["kernel-integrity", "executable-conformance", "phase260-authority", "integrated-service", "audit-reproduction", "protected-baseline"] as const
const INPUT_PATHS = [".planning/REQUIREMENTS.md", "scripts/evaluate-v1-37-prearchive-proof.ts", "scripts/evaluate-v1-37-prearchive-proof.test.ts", "scripts/evaluate-v1-37-integrated-service-proof.ts", "scripts/check-v1-37-audit-reproduction.ts", "scripts/check-v1-37-release-boundaries.ts", "scripts/capture-v1-37-protected-baseline.ts", "package.json"] as const

type RequirementRow = { id: string; status: "passed" | "ready_pending"; evidence: string }
type LowerProof = { id: (typeof LOWER_PROOF_IDS)[number]; status: "passed"; sha256: `sha256:${string}` }
export interface V137PrearchiveProof {
  schemaVersion: "v1.37-prearchive-proof-v1"
  milestone: "v1.37"
  phase: 261
  releaseState: "release-ready"
  traceability: { total: 56; inheritedPassed: 48; phaseExecutablePassed: 7; passed: 55; releaseOperationReadyPending: 1 }
  requirements: RequirementRow[]
  lowerProofs: LowerProof[]
  inputRootSha256: `sha256:${string}`
  semantic: { transitionAuthorityCount: 1; unapprovedGameplayChange: false; exactCompatibilityRulingsOnly: true }
  releaseBoundaries: { findings: 0; privacySafe: true }
  limitations: readonly ["proof-local-containment-is-non-counted", "browser-is-fixture-backed-not-live-backend-data"]
  releaseOperation: { requirement: "PROOF-08"; status: "ready_pending"; expectedOperation: "archive-then-annotated-tag-then-independent-post-check"; completion: false }
}

const requirementIds = (source: string): string[] => Array.from(source.matchAll(/\*\*([A-Z]+-\d{2})\*\*:/g), (match) => match[1]!)
const expectedRows = (ids: readonly string[]): RequirementRow[] => ids.map((id) => id === "PROOF-08" ? { id, status: "ready_pending", evidence: "outer-archive-annotated-tag-post-check" } : { id, status: "passed", evidence: id.startsWith("PROOF-") ? "phase261-executable-proof" : "inherited-phase-verification" })
const hashFile = (repoRoot: string, file: string): `sha256:${string}` => digest(readFileSync(path.join(repoRoot, file)))
export const computeV137PrearchiveProofInputRoot = (repoRoot: string): `sha256:${string}` => digest(canonical(INPUT_PATHS.map((file) => ({ path: file, sha256: hashFile(repoRoot, file) }))))

export const createV137PrearchiveProofFixture = (): V137PrearchiveProof => {
  const ids = [...Array.from({ length: 48 }, (_, i) => `INHERITED-${String(i + 1).padStart(2, "0")}`), ...Array.from({ length: 8 }, (_, i) => `PROOF-${String(i + 1).padStart(2, "0")}`)]
  return { schemaVersion: "v1.37-prearchive-proof-v1", milestone: "v1.37", phase: 261, releaseState: "release-ready", traceability: { total: 56, inheritedPassed: 48, phaseExecutablePassed: 7, passed: 55, releaseOperationReadyPending: 1 }, requirements: expectedRows(ids), lowerProofs: LOWER_PROOF_IDS.map((id) => ({ id, status: "passed", sha256: digest(id) })), inputRootSha256: digest("fixture-input"), semantic: { transitionAuthorityCount: 1, unapprovedGameplayChange: false, exactCompatibilityRulingsOnly: true }, releaseBoundaries: { findings: 0, privacySafe: true }, limitations: ["proof-local-containment-is-non-counted", "browser-is-fixture-backed-not-live-backend-data"], releaseOperation: { requirement: "PROOF-08", status: "ready_pending", expectedOperation: "archive-then-annotated-tag-then-independent-post-check", completion: false } }
}

export const validateV137PrearchiveProof = (value: unknown): V137PrearchiveProof => {
  const keys = ["inputRootSha256", "limitations", "lowerProofs", "milestone", "phase", "releaseBoundaries", "releaseOperation", "releaseState", "requirements", "schemaVersion", "semantic", "traceability"]
  if (!exactKeys(value, keys)) fail("V137_PREARCHIVE_SHAPE")
  const proof = value as V137PrearchiveProof
  if (proof.schemaVersion !== "v1.37-prearchive-proof-v1" || proof.milestone !== "v1.37" || proof.phase !== 261 || proof.releaseState !== "release-ready" || !SHA.test(proof.inputRootSha256)) fail("V137_PREARCHIVE_IDENTITY_INVALID")
  if (JSON.stringify(proof.traceability) !== JSON.stringify({ total: 56, inheritedPassed: 48, phaseExecutablePassed: 7, passed: 55, releaseOperationReadyPending: 1 })) fail("V137_PREARCHIVE_TRACEABILITY_INVALID")
  if (!Array.isArray(proof.requirements) || proof.requirements.length !== 56 || new Set(proof.requirements.map((row) => row.id)).size !== 56 || proof.requirements.filter((row) => row.status === "passed").length !== 55 || JSON.stringify(proof.requirements.at(-1)) !== JSON.stringify({ id: "PROOF-08", status: "ready_pending", evidence: "outer-archive-annotated-tag-post-check" }) || proof.requirements.some((row) => row.id !== "PROOF-08" && row.status !== "passed")) fail("V137_PREARCHIVE_REQUIREMENTS_INVALID")
  if (!Array.isArray(proof.lowerProofs) || JSON.stringify(proof.lowerProofs.map(({ id, status }) => ({ id, status }))) !== JSON.stringify(LOWER_PROOF_IDS.map((id) => ({ id, status: "passed" }))) || proof.lowerProofs.some((entry) => !SHA.test(entry.sha256))) fail("V137_PREARCHIVE_LOWER_PROOFS_INVALID")
  if (proof.semantic.transitionAuthorityCount !== 1 || proof.semantic.unapprovedGameplayChange !== false || proof.semantic.exactCompatibilityRulingsOnly !== true) fail("V137_PREARCHIVE_SEMANTIC_INVALID")
  if (proof.releaseBoundaries.findings !== 0 || proof.releaseBoundaries.privacySafe !== true) fail("V137_PREARCHIVE_BOUNDARIES_INVALID")
  if (JSON.stringify(proof.limitations) !== JSON.stringify(["proof-local-containment-is-non-counted", "browser-is-fixture-backed-not-live-backend-data"])) fail("V137_PREARCHIVE_LIMITATIONS_INVALID")
  if (JSON.stringify(proof.releaseOperation) !== JSON.stringify({ requirement: "PROOF-08", status: "ready_pending", expectedOperation: "archive-then-annotated-tag-then-independent-post-check", completion: false })) fail("V137_PREARCHIVE_RELEASE_OPERATION_INVALID")
  return proof
}

const currentLowerProofs = (repoRoot: string): LowerProof[] => {
  const integrated = checkV137IntegratedProofArtifacts(repoRoot, process.env.COWARDS_V1_37_RESTRICTED_EVIDENCE_ROOT ?? fail("V137_PREARCHIVE_RESTRICTED_ROOT_REQUIRED"))
  const executable = checkV137ExecutableConformanceArtifacts(repoRoot)
  const phase260 = checkV137TruthfulInputsSetFairnessArtifacts(repoRoot)
  const audit = runV137AuditReproductionGate(repoRoot)
  const baseline = checkV137ProtectedBaseline({ observedRepoRoot: repoRoot, artifactPath: path.join(repoRoot, ".planning/artifacts/v1.37-protected-working-tree-baseline.json") })
  const lower: Record<(typeof LOWER_PROOF_IDS)[number], unknown> = { "kernel-integrity": JSON.parse(readFileSync(path.join(repoRoot, ".planning/artifacts/v1.37-kernel-integrity-proof.json"), "utf8")), "executable-conformance": executable, "phase260-authority": phase260, "integrated-service": integrated, "audit-reproduction": audit, "protected-baseline": baseline }
  return LOWER_PROOF_IDS.map((id) => ({ id, status: "passed", sha256: digest(canonical(lower[id])) }))
}

export const generateV137PrearchiveProof = (repoRoot: string): V137PrearchiveProof => {
  const ids = requirementIds(readFileSync(path.join(repoRoot, ".planning/REQUIREMENTS.md"), "utf8"))
  if (ids.length !== 56 || new Set(ids).size !== 56 || ids.slice(-8).join(",") !== ["PROOF-01", "PROOF-02", "PROOF-03", "PROOF-04", "PROOF-05", "PROOF-06", "PROOF-07", "PROOF-08"].join(",")) fail("V137_PREARCHIVE_REQUIREMENT_SOURCE_INVALID")
  const boundaries = checkV137ReleaseBoundaries("source-fixture", repoRoot)
  if (boundaries.findings.length !== 0) fail("V137_PREARCHIVE_RELEASE_BOUNDARY_FAILED")
  const phase260 = JSON.parse(readFileSync(path.join(repoRoot, ".planning/artifacts/v1.37-truthful-inputs-set-fairness-proof.json"), "utf8")) as { history?: { transitionAuthorityCount?: number }; audit?: { unapprovedGameplayChange?: boolean } }
  if (phase260.history?.transitionAuthorityCount !== 1 || phase260.audit?.unapprovedGameplayChange !== false) fail("V137_PREARCHIVE_SEMANTIC_SOURCE_INVALID")
  return validateV137PrearchiveProof({ schemaVersion: "v1.37-prearchive-proof-v1", milestone: "v1.37", phase: 261, releaseState: "release-ready", traceability: { total: 56, inheritedPassed: 48, phaseExecutablePassed: 7, passed: 55, releaseOperationReadyPending: 1 }, requirements: expectedRows(ids), lowerProofs: currentLowerProofs(repoRoot), inputRootSha256: computeV137PrearchiveProofInputRoot(repoRoot), semantic: { transitionAuthorityCount: 1, unapprovedGameplayChange: false, exactCompatibilityRulingsOnly: true }, releaseBoundaries: { findings: 0, privacySafe: true }, limitations: ["proof-local-containment-is-non-counted", "browser-is-fixture-backed-not-live-backend-data"], releaseOperation: { requirement: "PROOF-08", status: "ready_pending", expectedOperation: "archive-then-annotated-tag-then-independent-post-check", completion: false } })
}
export const renderV137PrearchiveProofJson = (proof: unknown): string => { const checked = validateV137PrearchiveProof(proof); assertPublicOutputLeakSafe(checked, "v1.37 prearchive proof"); return canonical(checked) }
export const renderV137PrearchiveProofMarkdown = (proof: unknown): string => { const checked = JSON.parse(renderV137PrearchiveProofJson(proof)) as V137PrearchiveProof; return `# v1.37 Prearchive Proof\n\nRelease state: \`${checked.releaseState}\`\n\n- Traceability: ${checked.traceability.total}/56 requirements traced; ${checked.traceability.passed} passed.\n- Passed: 48 inherited requirements plus seven executable Phase-261 requirements (PROOF-01 through PROOF-07).\n- Pending outer release operation: PROOF-08 is \`ready_pending\`; archive, annotated tag, and independent post-check have not occurred.\n- Browser limitation remains explicit: fixture-backed browser rendering has \`liveBackendData: false\` and is bound to the separate service receipt.\n` }
export const writeV137PrearchiveProofArtifacts = (repoRoot: string): V137PrearchiveProof => { const proof = generateV137PrearchiveProof(repoRoot); for (const [kind, artifact] of Object.entries(V137_PREARCHIVE_PROOF_ARTIFACT_PATHS)) { const target = path.join(repoRoot, artifact); const bytes = kind === "json" ? renderV137PrearchiveProofJson(proof) : renderV137PrearchiveProofMarkdown(proof); const temporary = `${target}.tmp-${process.pid}`; writeFileSync(temporary, bytes, { flag: "w", mode: 0o644 }); renameSync(temporary, target) }; return proof }
export const checkV137PrearchiveProofArtifacts = (repoRoot: string): V137PrearchiveProof => { const proof = generateV137PrearchiveProof(repoRoot); for (const [kind, artifact] of Object.entries(V137_PREARCHIVE_PROOF_ARTIFACT_PATHS)) { const target = path.join(repoRoot, artifact); if (!existsSync(target)) fail("V137_PREARCHIVE_ARTIFACT_MISSING"); const expected = kind === "json" ? renderV137PrearchiveProofJson(proof) : renderV137PrearchiveProofMarkdown(proof); if (readFileSync(target, "utf8") !== expected) fail("V137_PREARCHIVE_ARTIFACT_EDITED") }; return proof }

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) { try { const proof = process.argv.includes("--write") ? writeV137PrearchiveProofArtifacts(root) : process.argv.includes("--check") ? checkV137PrearchiveProofArtifacts(root) : fail("V137_PREARCHIVE_MODE_INVALID"); process.stdout.write(`${JSON.stringify({ releaseState: proof.releaseState, passed: proof.traceability.passed, pending: proof.releaseOperation.requirement })}\n`) } catch (error) { process.stderr.write(`${error instanceof Error ? error.message : "V137_PREARCHIVE_FAILED"}\n`); process.exitCode = 1 } }
