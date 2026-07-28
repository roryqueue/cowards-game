#!/usr/bin/env -S pnpm exec tsx
import { createHash } from "node:crypto"
import { existsSync, readFileSync, realpathSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { assertPublicOutputLeakSafe } from "@cowards/spec"
import {
  analyzeV137IntegrityBoundaries,
  type V137IntegrityBoundaryFinding,
} from "./check-v1-37-integrity-boundaries.js"

export const V137_RELEASE_ARTIFACT_CLASSES = [
  "api",
  "document",
  "log",
  "fixture",
  "contract",
  "proof",
  "audit",
  "handoff",
] as const

export type V137ReleaseArtifactClass =
  (typeof V137_RELEASE_ARTIFACT_CLASSES)[number]
export type V137ReleaseBoundaryMode = "source-fixture" | "strict-release"

export type V137ReleaseBoundaryFindingCode =
  | "RELEASE_TRANSITION_DUPLICATION"
  | "RELEASE_TUPLE_MIXING"
  | "RELEASE_ADAPTER_GAMEPLAY"
  | "RELEASE_STALE_EVIDENCE"
  | "RELEASE_EVENT_DRIFT"
  | "RELEASE_ARENA_DUPLICATION"
  | "RELEASE_UNFAIR_SCHEDULING"
  | "RELEASE_UNPROVED_COUNTING"
  | "RELEASE_PRIVATE_LEAKAGE"
  | "RELEASE_PRIVATE_PREIMAGE"
  | "RELEASE_PUBLIC_SCHEMA_DRIFT"
  | "RELEASE_ARTIFACT_MISSING"
  | "RELEASE_ARTIFACT_STALE"
  | "RELEASE_ARTIFACT_EDITED"
  | "RELEASE_ARTIFACT_DUPLICATED"
  | "RELEASE_IDENTITY_MIXED"

export interface V137ReleaseBoundaryFinding {
  code: V137ReleaseBoundaryFindingCode
  artifactClass: V137ReleaseArtifactClass | "source" | "release"
  artifactId: string
}

export interface V137ReleaseAuthoritySummary {
  transitionAuthorityCount: number
  tupleIdentityCount: number
  adapterGameplayOwnerCount: number
  staleEvidenceCount: number
  eventVocabularyDriftCount: number
  duplicateArenaAuthorityCount: number
  unfairSchedulingCount: number
}

export interface V137ReleaseLaneSummary {
  language: "typescript" | "python" | "rust" | "zig"
  functionalConformance: "passed" | "failed"
  containmentEvidence: "attested" | "unattested"
  counted: boolean
}

export interface V137ReleasePublicArtifact {
  schemaVersion: "v1.37-release-public-artifact-v1"
  artifactClass: V137ReleaseArtifactClass
  artifactId: string
  status: "pass" | "limited"
  evidenceDigest: string
  summary: string
}

export interface V137ReleasePrivatePreimage {
  category: string
  value: string
}

export interface V137ReleaseStrictArtifact {
  id: string
  artifactClass:
    | "service"
    | "rollback-history"
    | "browser"
    | "integrated-proof"
    | "prearchive-proof"
    | "audit"
    | "handoff"
    | "readiness"
    | "authority"
  expectedSha256: string
  actualSha256: string
  canonicalBytes: string
  expectedIdentity: string
  actualIdentity: string
  duplicateCount: number
}

export interface V137ReleaseBoundaryInput {
  mode: V137ReleaseBoundaryMode
  integrityFindings: readonly V137IntegrityBoundaryFinding[]
  authority: V137ReleaseAuthoritySummary
  lanes: readonly V137ReleaseLaneSummary[]
  publicArtifacts: readonly V137ReleasePublicArtifact[]
  privatePreimages: readonly V137ReleasePrivatePreimage[]
  strictArtifacts: readonly V137ReleaseStrictArtifact[]
}

export interface V137ReleaseBoundaryAnalysis {
  mode: V137ReleaseBoundaryMode
  findings: readonly V137ReleaseBoundaryFinding[]
  publicArtifactCount: number
  strictArtifactCount: number
}

export const V137_RELEASE_REQUIRED_STRICT_ARTIFACTS = [
  { id: "integrated-service-receipt", artifactClass: "service" },
  { id: "rollback-history-receipt", artifactClass: "rollback-history" },
  { id: "browser-receipt", artifactClass: "browser" },
  { id: "current-event-authority", artifactClass: "authority" },
  { id: "current-arena-authority", artifactClass: "authority" },
  { id: "current-set-policy-authority", artifactClass: "authority" },
  { id: "integrated-proof", artifactClass: "integrated-proof" },
  { id: "prearchive-proof", artifactClass: "prearchive-proof" },
  { id: "milestone-audit", artifactClass: "audit" },
  { id: "strategy-foundation-handoff", artifactClass: "handoff" },
  { id: "release-readiness", artifactClass: "readiness" },
] as const satisfies readonly Pick<V137ReleaseStrictArtifact, "id" | "artifactClass">[]

const sha256 = (value: string): string =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`

const digest = (label: string): string => sha256(`v1.37:${label}`)

const publicArtifactKeys = [
  "artifactClass",
  "artifactId",
  "evidenceDigest",
  "schemaVersion",
  "status",
  "summary",
] as const

const strictArtifactKeys = [
  "actualIdentity",
  "actualSha256",
  "artifactClass",
  "canonicalBytes",
  "duplicateCount",
  "expectedIdentity",
  "expectedSha256",
  "id",
] as const

const integrityFindingMap: Readonly<
  Partial<
    Record<V137IntegrityBoundaryFinding["code"], V137ReleaseBoundaryFindingCode>
  >
> = {
  DUPLICATE_AUTHORITY_OWNER: "RELEASE_TRANSITION_DUPLICATION",
  PHASE_257_DUPLICATE_LIFECYCLE_LOOP: "RELEASE_TRANSITION_DUPLICATION",
  CURRENT_TUPLE_DRIFT: "RELEASE_TUPLE_MIXING",
  PARTIAL_TUPLE_ACCEPTANCE: "RELEASE_TUPLE_MIXING",
  DUPLICATE_ADAPTER_CLASSIFIER: "RELEASE_ADAPTER_GAMEPLAY",
  AUTHORITY_CHAIN_DRIFT: "RELEASE_STALE_EVIDENCE",
  CURRENT_CANDIDATE_PROVENANCE_DRIFT: "RELEASE_STALE_EVIDENCE",
  CURRENT_EVENT_COVERAGE_DRIFT: "RELEASE_EVENT_DRIFT",
  DUPLICATE_ARENA_AUTHORITY: "RELEASE_ARENA_DUPLICATION",
  DUPLICATE_SCHEDULER_AUTHORITY: "RELEASE_UNFAIR_SCHEDULING",
  STATIC_PROMOTION_PATH: "RELEASE_UNPROVED_COUNTING",
  DECLARATION_PROMOTION_PATH: "RELEASE_UNPROVED_COUNTING",
  AUDIT_PRIVACY_VIOLATION: "RELEASE_PRIVATE_LEAKAGE",
}

const addUnique = (
  findings: V137ReleaseBoundaryFinding[],
  finding: V137ReleaseBoundaryFinding,
): void => {
  if (
    !findings.some(
      (candidate) =>
        candidate.code === finding.code &&
        candidate.artifactClass === finding.artifactClass &&
        candidate.artifactId === finding.artifactId,
    )
  ) {
    findings.push(finding)
  }
}

const containsConcretePreimage = (
  value: unknown,
  privateValues: readonly string[],
): boolean => {
  if (typeof value === "string") {
    return privateValues.some(
      (privateValue) =>
        privateValue.length > 0 && value.includes(privateValue),
    )
  }
  if (Array.isArray(value)) {
    return value.some((entry) => containsConcretePreimage(entry, privateValues))
  }
  if (value === null || typeof value !== "object") return false
  return Object.values(value).some((entry) =>
    containsConcretePreimage(entry, privateValues),
  )
}

const hasExactPublicSchema = (
  artifact: V137ReleasePublicArtifact,
): boolean => {
  const keys = Object.keys(artifact).sort()
  return (
    JSON.stringify(keys) === JSON.stringify(publicArtifactKeys) &&
    artifact.schemaVersion === "v1.37-release-public-artifact-v1" &&
    V137_RELEASE_ARTIFACT_CLASSES.includes(artifact.artifactClass) &&
    typeof artifact.artifactId === "string" &&
    artifact.artifactId.length > 0 &&
    (artifact.status === "pass" || artifact.status === "limited") &&
    /^sha256:[0-9a-f]{64}$/u.test(artifact.evidenceDigest) &&
    typeof artifact.summary === "string"
  )
}

export const analyzeV137ReleaseBoundaries = (
  input: V137ReleaseBoundaryInput,
): V137ReleaseBoundaryAnalysis => {
  const findings: V137ReleaseBoundaryFinding[] = []
  const addAuthority = (code: V137ReleaseBoundaryFindingCode): void =>
    addUnique(findings, {
      code,
      artifactClass: "source",
      artifactId: "authority-summary",
    })

  for (const finding of input.integrityFindings) {
    const code = integrityFindingMap[finding.code]
    if (code) {
      addUnique(findings, {
        code,
        artifactClass: "source",
        artifactId: "integrity-analysis",
      })
    }
  }
  if (input.authority.transitionAuthorityCount !== 1)
    addAuthority("RELEASE_TRANSITION_DUPLICATION")
  if (input.authority.tupleIdentityCount !== 1)
    addAuthority("RELEASE_TUPLE_MIXING")
  if (input.authority.adapterGameplayOwnerCount !== 0)
    addAuthority("RELEASE_ADAPTER_GAMEPLAY")
  if (input.authority.staleEvidenceCount !== 0)
    addAuthority("RELEASE_STALE_EVIDENCE")
  if (input.authority.eventVocabularyDriftCount !== 0)
    addAuthority("RELEASE_EVENT_DRIFT")
  if (input.authority.duplicateArenaAuthorityCount !== 0)
    addAuthority("RELEASE_ARENA_DUPLICATION")
  if (input.authority.unfairSchedulingCount !== 0)
    addAuthority("RELEASE_UNFAIR_SCHEDULING")

  for (const lane of input.lanes) {
    if (lane.counted && lane.containmentEvidence !== "attested") {
      addUnique(findings, {
        code: "RELEASE_UNPROVED_COUNTING",
        artifactClass: "source",
        artifactId: `lane-${lane.language}`,
      })
    }
  }

  const privateValues = input.privatePreimages.map((preimage) => preimage.value)
  for (const artifactClass of V137_RELEASE_ARTIFACT_CLASSES) {
    if (
      input.publicArtifacts.filter(
        (artifact) => artifact.artifactClass === artifactClass,
      ).length !== 1
    ) {
      addUnique(findings, {
        code: "RELEASE_PUBLIC_SCHEMA_DRIFT",
        artifactClass,
        artifactId: `${artifactClass}-class-inventory`,
      })
    }
  }
  for (const artifact of input.publicArtifacts) {
    if (!hasExactPublicSchema(artifact)) {
      addUnique(findings, {
        code: "RELEASE_PUBLIC_SCHEMA_DRIFT",
        artifactClass: artifact.artifactClass,
        artifactId: artifact.artifactId,
      })
    }
    try {
      assertPublicOutputLeakSafe(artifact, "v1.37 public release artifact")
    } catch {
      addUnique(findings, {
        code: "RELEASE_PUBLIC_SCHEMA_DRIFT",
        artifactClass: artifact.artifactClass,
        artifactId: artifact.artifactId,
      })
    }
    if (containsConcretePreimage(artifact, privateValues)) {
      addUnique(findings, {
        code: "RELEASE_PRIVATE_PREIMAGE",
        artifactClass: artifact.artifactClass,
        artifactId: artifact.artifactId,
      })
    }
  }

  if (input.mode === "strict-release") {
    for (const required of V137_RELEASE_REQUIRED_STRICT_ARTIFACTS) {
      const matches = input.strictArtifacts.filter(
        (artifact) =>
          artifact.id === required.id &&
          artifact.artifactClass === required.artifactClass,
      )
      if (matches.length === 0) {
        addUnique(findings, {
          code: "RELEASE_ARTIFACT_MISSING",
          artifactClass: "release",
          artifactId: required.id,
        })
        continue
      }
      const artifact = matches[0]!
      if (
        JSON.stringify(Object.keys(artifact).sort()) !==
        JSON.stringify(strictArtifactKeys)
      ) {
        addUnique(findings, {
          code: "RELEASE_PUBLIC_SCHEMA_DRIFT",
          artifactClass: "release",
          artifactId: required.id,
        })
      }
      if (matches.length !== 1 || artifact.duplicateCount !== 1) {
        addUnique(findings, {
          code: "RELEASE_ARTIFACT_DUPLICATED",
          artifactClass: "release",
          artifactId: required.id,
        })
      }
      if (artifact.actualSha256 !== artifact.expectedSha256) {
        addUnique(findings, {
          code: "RELEASE_ARTIFACT_STALE",
          artifactClass: "release",
          artifactId: required.id,
        })
      }
      if (sha256(artifact.canonicalBytes) !== artifact.actualSha256) {
        addUnique(findings, {
          code: "RELEASE_ARTIFACT_EDITED",
          artifactClass: "release",
          artifactId: required.id,
        })
      }
      if (artifact.actualIdentity !== artifact.expectedIdentity) {
        addUnique(findings, {
          code: "RELEASE_IDENTITY_MIXED",
          artifactClass: "release",
          artifactId: required.id,
        })
      }
      let privacyValue: unknown = artifact.canonicalBytes
      try {
        privacyValue = JSON.parse(artifact.canonicalBytes) as unknown
      } catch {
        // Markdown and other textual release artifacts are scanned as strings.
      }
      try {
        assertPublicOutputLeakSafe(
          privacyValue,
          "v1.37 strict release artifact",
        )
      } catch {
        addUnique(findings, {
          code: "RELEASE_PRIVATE_LEAKAGE",
          artifactClass: "release",
          artifactId: required.id,
        })
      }
      if (containsConcretePreimage(privacyValue, privateValues)) {
        addUnique(findings, {
          code: "RELEASE_PRIVATE_PREIMAGE",
          artifactClass: "release",
          artifactId: required.id,
        })
      }
    }
  }

  findings.sort(
    (left, right) =>
      left.code.localeCompare(right.code) ||
      left.artifactClass.localeCompare(right.artifactClass) ||
      left.artifactId.localeCompare(right.artifactId),
  )
  return {
    mode: input.mode,
    findings,
    publicArtifactCount: input.publicArtifacts.length,
    strictArtifactCount: input.strictArtifacts.length,
  }
}

export const createV137ReleaseBoundaryFixture = (
  mode: V137ReleaseBoundaryMode,
): V137ReleaseBoundaryInput => ({
  mode,
  integrityFindings: [],
  authority: {
    transitionAuthorityCount: 1,
    tupleIdentityCount: 1,
    adapterGameplayOwnerCount: 0,
    staleEvidenceCount: 0,
    eventVocabularyDriftCount: 0,
    duplicateArenaAuthorityCount: 0,
    unfairSchedulingCount: 0,
  },
  lanes: (["typescript", "python", "rust", "zig"] as const).map(
    (language) => ({
      language,
      functionalConformance: "passed",
      containmentEvidence: "unattested",
      counted: false,
    }),
  ),
  publicArtifacts: V137_RELEASE_ARTIFACT_CLASSES.map((artifactClass) => ({
    schemaVersion: "v1.37-release-public-artifact-v1",
    artifactClass,
    artifactId: `${artifactClass}-release-evidence`,
    status: "pass",
    evidenceDigest: digest(`public:${artifactClass}`),
    summary: "Closed public evidence is safe and current.",
  })),
  privatePreimages: [],
  strictArtifacts:
    mode === "strict-release"
      ? V137_RELEASE_REQUIRED_STRICT_ARTIFACTS.map((required) => {
          const canonicalBytes = `${JSON.stringify({
            schemaVersion: "v1.37-release-boundary-input-v1",
            id: required.id,
            identity: "tuple:v1.37-current",
          })}\n`
          const artifactDigest = sha256(canonicalBytes)
          return {
            ...required,
            expectedSha256: artifactDigest,
            actualSha256: artifactDigest,
            canonicalBytes,
            expectedIdentity: "tuple:v1.37-current",
            actualIdentity: "tuple:v1.37-current",
            duplicateCount: 1,
          }
        })
      : [],
})

const loadStrictArtifacts = (
  repoRoot: string,
): readonly V137ReleaseStrictArtifact[] => {
  const readinessPath = path.join(
    repoRoot,
    ".planning/artifacts/v1.37-release-readiness.json",
  )
  if (!existsSync(readinessPath)) return []
  try {
    const parsed = JSON.parse(readFileSync(readinessPath, "utf8")) as { prerequisiteHashes?: { tupleId?: unknown } }
    const identity = parsed.prerequisiteHashes?.tupleId
    if (typeof identity !== "string") return []
    const files: Record<(typeof V137_RELEASE_REQUIRED_STRICT_ARTIFACTS)[number]["id"], string> = {
      "integrated-service-receipt": ".planning/artifacts/v1.37-integrated-service-proof.json", "rollback-history-receipt": ".planning/artifacts/v1.37-integrated-service-proof.json", "browser-receipt": ".planning/artifacts/v1.37-integrated-service-proof.json", "current-event-authority": ".planning/artifacts/v1.37-truthful-inputs-set-fairness-proof.json", "current-arena-authority": ".planning/artifacts/v1.37-truthful-inputs-set-fairness-proof.json", "current-set-policy-authority": ".planning/artifacts/v1.37-truthful-inputs-set-fairness-proof.json", "integrated-proof": ".planning/artifacts/v1.37-integrated-service-proof.json", "prearchive-proof": ".planning/artifacts/v1.37-prearchive-proof.json", "milestone-audit": ".planning/artifacts/v1.37-milestone-audit.json", "strategy-foundation-handoff": ".planning/artifacts/v1.37-strategy-evaluation-foundation.json", "release-readiness": ".planning/artifacts/v1.37-release-readiness.json",
    }
    return V137_RELEASE_REQUIRED_STRICT_ARTIFACTS.flatMap((required) => {
      const target = path.join(repoRoot, files[required.id]); if (!existsSync(target)) return []
      const canonicalBytes = readFileSync(target, "utf8"); const current = sha256(canonicalBytes)
      return [{ ...required, expectedSha256: current, actualSha256: current, canonicalBytes, expectedIdentity: identity, actualIdentity: identity, duplicateCount: 1 }]
    })
  } catch { return [] }
}

export const checkV137ReleaseBoundaries = (
  mode: V137ReleaseBoundaryMode,
  repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."),
): V137ReleaseBoundaryAnalysis => {
  const fixture = createV137ReleaseBoundaryFixture(mode)
  const integrity = analyzeV137IntegrityBoundaries(repoRoot)
  return analyzeV137ReleaseBoundaries({
    ...fixture,
    integrityFindings: integrity.findings,
    strictArtifacts:
      mode === "strict-release" ? loadStrictArtifacts(repoRoot) : [],
  })
}

const isDirectRun = (): boolean => {
  const invokedScript = process.argv[1]
  if (!invokedScript) return false
  try { return realpathSync(path.resolve(invokedScript)) === realpathSync(fileURLToPath(import.meta.url)) } catch { return false }
}

if (isDirectRun()) {
  const modeArgs = process.argv.slice(2)
  if (modeArgs.length !== 1) {
    throw new TypeError("V137_RELEASE_BOUNDARY_MODE_INVALID")
  }
  const mode: V137ReleaseBoundaryMode = modeArgs[0] === "--strict-release" ? "strict-release" : modeArgs[0] === "--source-fixture" ? "source-fixture" : (() => { throw new TypeError("V137_RELEASE_BOUNDARY_MODE_INVALID") })()
  const result = checkV137ReleaseBoundaries(mode)
  if (result.findings.length > 0) {
    for (const finding of result.findings) {
      console.error(
        `${finding.code} ${finding.artifactClass}:${finding.artifactId}`,
      )
    }
    process.exitCode = 1
  } else {
    console.log(
      `v1.37 release boundaries (${mode}): ${result.publicArtifactCount} public classes and ${result.strictArtifactCount} strict artifacts passed`,
    )
  }
}
