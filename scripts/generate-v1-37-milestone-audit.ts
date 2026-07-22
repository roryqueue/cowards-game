#!/usr/bin/env -S pnpm exec tsx
import { createHash } from "node:crypto"
import { existsSync, readFileSync, realpathSync, renameSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { assertPublicOutputLeakSafe } from "@cowards/spec"
import {
  checkV137PrearchiveProofArtifacts,
  createV137PrearchiveProofFixture,
  validateV137PrearchiveProof,
  type V137PrearchiveProof,
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

export const V137_MILESTONE_AUDIT_ARTIFACT_PATHS = Object.freeze({
  json: ".planning/artifacts/v1.37-milestone-audit.json",
  markdown: ".planning/v1.37-MILESTONE-AUDIT.md",
})
const SOURCE_PATHS = [
  "scripts/generate-v1-37-milestone-audit.ts",
  "scripts/generate-v1-37-milestone-audit.test.ts",
  "scripts/evaluate-v1-37-prearchive-proof.ts",
  "package.json",
] as const

type AuditRequirement = {
  id: string
  status: "passed" | "ready_pending"
  evidence: string
}
type AuditLowerProof = { id: string; status: "passed"; sha256: `sha256:${string}` }
type AuditSourceBinding = { path: (typeof SOURCE_PATHS)[number]; sha256: `sha256:${string}` }

export interface V137MilestoneAudit {
  schemaVersion: "v1.37-milestone-audit-v1"
  milestone: "v1.37"
  phase: 261
  status: "release-ready"
  traceability: { total: 56; passed: 55; gaps: 0; overrides: 0 }
  requirements: AuditRequirement[]
  lowerProofs: AuditLowerProof[]
  sourceBindings: AuditSourceBinding[]
  prearchiveInputRootSha256: `sha256:${string}`
  semantic: {
    transitionAuthorityCount: 1
    semanticDeltaCount: 0
    historicalCompatibility: "exact-rulings-only"
    gameplayChange: false
  }
  releaseBoundaries: { findings: 0; privacySafe: true }
  limitations: readonly [
    "proof-local-containment-is-non-counted",
    "browser-is-fixture-backed-not-live-backend-data",
  ]
  releaseOperation: {
    requirement: "PROOF-08"
    status: "ready_pending"
    completion: false
    expectedOperation: "archive-then-annotated-tag-then-independent-post-check"
  }
}

const sourceBindings = (repoRoot: string): AuditSourceBinding[] =>
  SOURCE_PATHS.map((file) => ({
    path: file,
    sha256: digest(readFileSync(path.join(repoRoot, file))),
  }))

const fromPrearchive = (
  proof: V137PrearchiveProof,
  bindings: AuditSourceBinding[],
): V137MilestoneAudit =>
  validateV137MilestoneAudit({
    schemaVersion: "v1.37-milestone-audit-v1",
    milestone: proof.milestone,
    phase: proof.phase,
    status: proof.releaseState,
    traceability: {
      total: proof.traceability.total,
      passed: proof.traceability.passed,
      gaps: proof.releaseBoundaries.findings,
      overrides: 0,
    },
    requirements: proof.requirements.map((row) => ({ ...row })),
    lowerProofs: proof.lowerProofs.map((row) => ({ ...row })),
    sourceBindings: bindings,
    prearchiveInputRootSha256: proof.inputRootSha256,
    semantic: {
      transitionAuthorityCount: proof.semantic.transitionAuthorityCount,
      semanticDeltaCount: proof.semantic.unapprovedGameplayChange ? 1 : 0,
      historicalCompatibility: proof.semantic.exactCompatibilityRulingsOnly
        ? "exact-rulings-only"
        : fail("V137_AUDIT_SEMANTIC_SOURCE_INVALID"),
      gameplayChange: proof.semantic.unapprovedGameplayChange,
    },
    releaseBoundaries: { ...proof.releaseBoundaries },
    limitations: proof.limitations,
    releaseOperation: { ...proof.releaseOperation },
  })

export const createV137MilestoneAuditFixture = (): V137MilestoneAudit =>
  fromPrearchive(
    createV137PrearchiveProofFixture(),
    SOURCE_PATHS.map((file) => ({ path: file, sha256: digest(`fixture:${file}`) })),
  )

export const validateV137MilestoneAudit = (value: unknown): V137MilestoneAudit => {
  const keys = ["limitations", "lowerProofs", "milestone", "phase", "prearchiveInputRootSha256", "releaseBoundaries", "releaseOperation", "requirements", "schemaVersion", "semantic", "sourceBindings", "status", "traceability"]
  if (!exactKeys(value, keys)) fail("V137_AUDIT_SHAPE")
  const audit = value as V137MilestoneAudit
  if (audit.schemaVersion !== "v1.37-milestone-audit-v1" || audit.milestone !== "v1.37" || audit.phase !== 261 || audit.status !== "release-ready" || !SHA.test(audit.prearchiveInputRootSha256)) fail("V137_AUDIT_IDENTITY_INVALID")
  if (JSON.stringify(audit.traceability) !== JSON.stringify({ total: 56, passed: 55, gaps: 0, overrides: 0 })) fail("V137_AUDIT_TRACEABILITY_INVALID")
  if (!Array.isArray(audit.requirements) || audit.requirements.length !== 56 || new Set(audit.requirements.map((row) => row.id)).size !== 56 || audit.requirements.filter((row) => row.status === "passed").length !== 55 || JSON.stringify(audit.requirements.at(-1)) !== JSON.stringify({ id: "PROOF-08", status: "ready_pending", evidence: "outer-archive-annotated-tag-post-check" }) || audit.requirements.some((row) => row.id !== "PROOF-08" && row.status !== "passed")) fail("V137_AUDIT_REQUIREMENTS_INVALID")
  if (!Array.isArray(audit.lowerProofs) || audit.lowerProofs.length !== 6 || audit.lowerProofs.some((row) => row.status !== "passed" || !SHA.test(row.sha256))) fail("V137_AUDIT_LOWER_PROOFS_INVALID")
  if (!Array.isArray(audit.sourceBindings) || JSON.stringify(audit.sourceBindings.map((row) => row.path)) !== JSON.stringify(SOURCE_PATHS) || audit.sourceBindings.some((row) => !SHA.test(row.sha256))) fail("V137_AUDIT_SOURCE_BINDINGS_INVALID")
  if (JSON.stringify(audit.semantic) !== JSON.stringify({ transitionAuthorityCount: 1, semanticDeltaCount: 0, historicalCompatibility: "exact-rulings-only", gameplayChange: false })) fail("V137_AUDIT_SEMANTIC_INVALID")
  if (JSON.stringify(audit.releaseBoundaries) !== JSON.stringify({ findings: 0, privacySafe: true })) fail("V137_AUDIT_BOUNDARIES_INVALID")
  if (JSON.stringify(audit.limitations) !== JSON.stringify(["proof-local-containment-is-non-counted", "browser-is-fixture-backed-not-live-backend-data"])) fail("V137_AUDIT_LIMITATIONS_INVALID")
  if (JSON.stringify(audit.releaseOperation) !== JSON.stringify({ requirement: "PROOF-08", status: "ready_pending", expectedOperation: "archive-then-annotated-tag-then-independent-post-check", completion: false })) fail("V137_AUDIT_RELEASE_OPERATION_INVALID")
  assertPublicOutputLeakSafe(audit, "v1.37 milestone audit")
  return audit
}

export const generateV137MilestoneAudit = (repoRoot: string): V137MilestoneAudit =>
  fromPrearchive(
    validateV137PrearchiveProof(
      JSON.parse(readFileSync(path.join(repoRoot, ".planning/artifacts/v1.37-prearchive-proof.json"), "utf8")),
    ),
    sourceBindings(repoRoot),
  )

export const renderV137MilestoneAuditJson = (audit: unknown): string =>
  canonical(validateV137MilestoneAudit(audit))

export const renderV137MilestoneAuditMarkdown = (audit: unknown): string => {
  const checked = JSON.parse(renderV137MilestoneAuditJson(audit)) as V137MilestoneAudit
  const rows = checked.requirements.map((row) => `| ${row.id} | ${row.status} | ${row.evidence} |`).join("\n")
  const proofs = checked.lowerProofs.map((row) => `| ${row.id} | ${row.status} | ${row.sha256} |`).join("\n")
  return `---\nmilestone: v1.37\nstatus: release-ready\ntraceability: 56/56\npassed: 55\npending_requirement: PROOF-08\n---\n# v1.37 Rules Integrity and Strategy Evaluation Foundations Milestone Audit\n\n## Verdict\n\n**RELEASE-READY.** Traceability is complete at 56/56; 55 requirements are passed and PROOF-08 remains \`ready_pending\`. This is not a passed/completed audit.\n\n## Traceability Mapping\n\n| Requirement | Status | Evidence class |\n|---|---|---|\n${rows}\n\n## Evidence Closure\n\n| Proof | Status | Safe digest |\n|---|---|---|\n${proofs}\n\n- Prearchive input root: \`${checked.prearchiveInputRootSha256}\`\n- Source bindings: ${checked.sourceBindings.map((binding) => `\`${binding.path}\` ${binding.sha256}`).join("; ")}\n\n## Transition, Tuple, and History\n\n- One transition owner: ${checked.semantic.transitionAuthorityCount}.\n- Semantic delta count: ${checked.semantic.semanticDeltaCount}; historical compatibility: ${checked.semantic.historicalCompatibility}.\n- **No gameplay change:** ${checked.semantic.gameplayChange === false ? "verified" : "not verified"}.\n\n## Truthful Lane Status\n\nThe lower-proof closure is passed while the retained limitation \`proof-local-containment-is-non-counted\` remains explicit; this audit does not promote any lane to counted status.\n\n## Privacy and Rollback\n\n- Privacy-safe projection: ${checked.releaseBoundaries.privacySafe}; privacy/boundary findings: ${checked.releaseBoundaries.findings}.\n- Rollback evidence is represented only by the passed lower-proof digest; no raw evidence or private preimage is rendered.\n\n## Limitations\n\n${checked.limitations.map((limitation) => `- \`${limitation}\``).join("\n")}\n\n## Release Obligation\n\nPROOF-08 is \`${checked.releaseOperation.status}\`: perform \`${checked.releaseOperation.expectedOperation}\`. The future archive commit and annotated tag identities are intentionally absent and completion is \`${checked.releaseOperation.completion}\`.\n\n## Reproducible Commands\n\n\`pnpm v1.37:prearchive-proof:check\`\n\`pnpm v1.37:milestone-audit:check\`\n`
}

export const writeV137MilestoneAuditArtifacts = (repoRoot: string): V137MilestoneAudit => {
  checkV137PrearchiveProofArtifacts(repoRoot)
  const audit = generateV137MilestoneAudit(repoRoot)
  for (const [kind, artifact] of Object.entries(V137_MILESTONE_AUDIT_ARTIFACT_PATHS)) {
    const target = path.join(repoRoot, artifact)
    const bytes = kind === "json" ? renderV137MilestoneAuditJson(audit) : renderV137MilestoneAuditMarkdown(audit)
    const temporary = `${target}.tmp-${process.pid}`
    writeFileSync(temporary, bytes, { flag: "w", mode: 0o644 })
    renameSync(temporary, target)
  }
  return audit
}

export const checkV137MilestoneAuditArtifacts = (repoRoot: string): V137MilestoneAudit => {
  checkV137PrearchiveProofArtifacts(repoRoot)
  const audit = generateV137MilestoneAudit(repoRoot)
  for (const [kind, artifact] of Object.entries(V137_MILESTONE_AUDIT_ARTIFACT_PATHS)) {
    const target = path.join(repoRoot, artifact)
    if (!existsSync(target)) fail("V137_AUDIT_ARTIFACT_MISSING")
    const expected = kind === "json" ? renderV137MilestoneAuditJson(audit) : renderV137MilestoneAuditMarkdown(audit)
    if (readFileSync(target, "utf8") !== expected) fail("V137_AUDIT_ARTIFACT_EDITED")
  }
  return audit
}

const isDirectRun = (): boolean => {
  const invokedScript = process.argv[1]
  if (!invokedScript) return false
  try { return realpathSync(path.resolve(invokedScript)) === realpathSync(fileURLToPath(import.meta.url)) } catch { return false }
}
if (isDirectRun()) {
  const mode = process.argv.slice(2)
  try {
    const audit = mode.length === 1 && mode[0] === "--write" ? writeV137MilestoneAuditArtifacts(root) : mode.length === 1 && mode[0] === "--check" ? checkV137MilestoneAuditArtifacts(root) : fail("V137_AUDIT_MODE_INVALID")
    process.stdout.write(`${JSON.stringify({ status: audit.status, passed: audit.traceability.passed, pending: audit.releaseOperation.requirement })}\n`)
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : "V137_AUDIT_FAILED"}\n`)
    process.exitCode = 1
  }
}
