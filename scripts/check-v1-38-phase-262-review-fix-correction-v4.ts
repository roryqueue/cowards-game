import { execFileSync } from "node:child_process"
import { fileURLToPath } from "node:url"
import { assertV138AbsentNoFollow, authenticateV138ManifestNoFollow, readV138RegularNoFollow, sha256V138Secure, trustedRootV138 } from "./lib/v1-38-secure-workspace-path-v2.js"

const fail = (code: string): never => { throw new TypeError(code) }
const canonical = (value: unknown): string => {
  const normalize = (item: unknown): unknown => {
    if (Array.isArray(item)) return item.map(normalize)
    if (item !== null && typeof item === "object") return Object.fromEntries(Object.entries(item as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, child]) => [key, normalize(child)]))
    return item
  }
  return `${JSON.stringify(normalize(value))}\n`
}
const deepFreeze = <T>(value: T): T => {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child)
    Object.freeze(value)
  }
  return value
}
const exact = (left: unknown, right: unknown, code: string): void => { if (canonical(left) !== canonical(right)) fail(code) }
const rootOf = (value: unknown): `sha256:${string}` => sha256V138Secure(canonical(value))

export const V138_PHASE_262_CORRECTION_V4_PATH = ".planning/artifacts/v1.38-phase-262-review-fix-correction-v4.json"
export const V138_PHASE_262_TRIGGER_REVIEW_V4 = deepFreeze({
  commit: "ca6aaaa8",
  blob: "440dee12da82697a1b8370e93d736244cea3b6c3",
  path: ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-REVIEW.md",
  sha256: "sha256:42304dff575eeb288e83581a36d603d9e3ee2e993c61aad4d2da8da45e52fd13" as const,
})

const PRIOR_CORRECTIONS = deepFreeze([
  { path: ".planning/artifacts/v1.38-phase-262-review-fix-correction-v1.json", sha256: "sha256:e48e1db20dd15110d1dfe7837a192003a77112eae6a6d65f6aa9c3c9e34f9bc6" as const, root: "sha256:2a7e25a324ee1e28e4f7da543634afd29dca87dac12e860fea3c0e6b01650029" as const },
  { path: ".planning/artifacts/v1.38-phase-262-review-fix-correction-v2.json", sha256: "sha256:3765367b73c9fe0a0dcc119ee2db59591c1efc8f4f763bf5ebfc5925ca33cb85" as const, root: "sha256:468054b638d95bc39f0a2f0459f9514a295cfd318748d18d78c039a2f239f526" as const },
  { path: ".planning/artifacts/v1.38-phase-262-review-fix-correction-v3.json", sha256: "sha256:6a585d62405388947ba65b0036fd5bef716bbfe7320390367af5eee86d9390f1" as const, root: "sha256:f13ccf99c2b5c27b25f298d500b5409d7f6cc590fdacda1998cffd34b2bbd55a" as const },
])

/* Literal manifest commitments: count + canonical path-and-digest root. */
const FROZEN_MANIFESTS = deepFreeze({
  v1Protected: { count: 18, root: "sha256:1ad754bf25299519f88d10adec852e962181c591bbd5028d19e744b49c016d58" },
  v1Remediation: { count: 6, root: "sha256:6a9d7f9c50bc9480ed622a1573b872d77e9dcc35d77711e924b8d25270c64aa5" },
  v2Successor: { count: 10, root: "sha256:e3d444966ae5236427cfafe78b0bc22841394e2f73b022fecbb5c56ed4aaba71" },
  v3Successor: { count: 10, root: "sha256:2a01bf8d85ae0a60419b8ad006200278b8f4bd2cd4b798921626c56a305af068" },
  forbidden: { count: 14, root: "sha256:c5a03d69d7ec76982006292e0b2851658bee44557ca4747d9ecbf37c639a8aba" },
} as const)

const SUCCESSOR_V4 = deepFreeze([
  { path: "scripts/lib/v1-38-bounded-retry-successor-controller-v2.ts", sha256: "sha256:a9f2c04d4e3c2a434100cec1fbe2c177152e16ee0437d0a9c7077c7d6e23531f" as const },
  { path: "scripts/lib/v1-38-bounded-retry-successor-controller-v2.test.ts", sha256: "sha256:402cb052206473da4a225213fce56265768c52c230f735e2fb18d7c3a0fa0d64" as const },
  { path: "scripts/lib/v1-38-successor-effect-state-machine-v2.ts", sha256: "sha256:b2aa67394aa7d1b5b3e696b9a58077230666a24174ab08074dbe940043744658" as const },
  { path: "scripts/lib/v1-38-successor-effect-state-machine-v2.test.ts", sha256: "sha256:b7ce4b8500a91881e92dad6bd97dae46f8aaddef076269bf9d55026fed5c1420" as const },
  { path: "scripts/lib/v1-38-durable-pair-successor-v2.ts", sha256: "sha256:e766b879e7669f7dadfdd58f23bdc1567581fd5ae589b53020d0893a554c774c" as const },
  { path: "scripts/lib/v1-38-durable-pair-successor-v2.test.ts", sha256: "sha256:1d8c97aaff031717490793aece79f53a8e75e6f736265ae310b5a9602df6bc43" as const },
  { path: "scripts/lib/v1-38-restartable-lifecycle-successor-v2.ts", sha256: "sha256:41252a7a4847d333d53a7ecb3143a2f00bdfbb357d6eee9c94503d86872b4ebd" as const },
  { path: "scripts/lib/v1-38-restartable-lifecycle-successor-v2.test.ts", sha256: "sha256:0003cb2a8de940ecdd4b76eddc1550ea3f2b0d6591f92eb4a456004da57e9e8e" as const },
  { path: "scripts/lib/v1-38-secure-workspace-path-v2.ts", sha256: "sha256:27a1cbf81dcdc352391d5bf37145db983984e1f5a9e7f77b91bc7e5a904b55f0" as const },
  { path: "scripts/lib/v1-38-secure-workspace-path-v2.test.ts", sha256: "sha256:abc60f364e564d57dbb6c01066e8a97cacfa4f8380ae3817023771a47cf4ce9b" as const },
  { path: "scripts/native/v1-38-successor-transaction-helper-v2.c", sha256: "sha256:bcf9b25c4d43dcafa0bf8aa64b29fd6ad4b0746f3c6b2def0582e9406bfa53af" as const },
])

const validateManifestCommitment = (entries: readonly unknown[], commitment: Readonly<{ count: number; root: string }>, code: string): void => {
  if (entries.length !== commitment.count || rootOf(entries) !== commitment.root) fail(code)
}

export const deriveV138Phase262ReviewFixCorrectionV4 = (
  rootInput: string,
  options: Readonly<{ triggeringReviewBytes?: Buffer }> = {},
): any => {
  const root = trustedRootV138(rootInput)
  authenticateV138ManifestNoFollow(root, PRIOR_CORRECTIONS.map(({ path, sha256 }) => ({ path, sha256 })))
  authenticateV138ManifestNoFollow(root, SUCCESSOR_V4)
  const [v1, v2, v3] = PRIOR_CORRECTIONS.map(({ path }) => deepFreeze(JSON.parse(readV138RegularNoFollow(root, path).toString("utf8")))) as any[]
  for (const [index, candidate] of [v1, v2, v3].entries()) if (candidate.correctionRoot !== PRIOR_CORRECTIONS[index]!.root) fail("V138_CORRECTION_V4_PRIOR_ROOT_MISMATCH")

  const v1Protected = deepFreeze(v1.protectedFiles)
  const v1Remediation = deepFreeze(v1.remediation?.files)
  const v2Successor = deepFreeze(v2.remediation?.sourceFiles)
  const v3Successor = deepFreeze(v3.remediation?.sourceFiles)
  const forbidden = deepFreeze(v3.forbiddenDestinations)
  validateManifestCommitment(v1Protected, FROZEN_MANIFESTS.v1Protected, "V138_CORRECTION_V4_V1_PROTECTED_MANIFEST_MISMATCH")
  validateManifestCommitment(v1Remediation, FROZEN_MANIFESTS.v1Remediation, "V138_CORRECTION_V4_V1_REMEDIATION_MANIFEST_MISMATCH")
  validateManifestCommitment(v2Successor, FROZEN_MANIFESTS.v2Successor, "V138_CORRECTION_V4_V2_SUCCESSOR_MANIFEST_MISMATCH")
  validateManifestCommitment(v3Successor, FROZEN_MANIFESTS.v3Successor, "V138_CORRECTION_V4_V3_SUCCESSOR_MANIFEST_MISMATCH")
  validateManifestCommitment(forbidden, FROZEN_MANIFESTS.forbidden, "V138_CORRECTION_V4_FORBIDDEN_MANIFEST_MISMATCH")
  exact(v1Protected, v3.reauthenticated?.correctionV1ProtectedEntries, "V138_CORRECTION_V4_V1_PROTECTED_LINEAGE_MISMATCH")
  exact(v1Remediation, v3.reauthenticated?.correctionV1RemediationEntries, "V138_CORRECTION_V4_V1_REMEDIATION_LINEAGE_MISMATCH")
  exact(v2Successor, v3.reauthenticated?.correctionV2SuccessorLineage?.map(({ path, priorSha256 }: any) => ({ path, sha256: priorSha256 })), "V138_CORRECTION_V4_V2_SUCCESSOR_LINEAGE_MISMATCH")
  exact(v3Successor, v3.reauthenticated?.correctionV2SuccessorLineage?.map(({ path, currentSha256 }: any) => ({ path, sha256: currentSha256 })), "V138_CORRECTION_V4_V3_SUCCESSOR_LINEAGE_MISMATCH")
  exact(v2.forbiddenDestinations, forbidden, "V138_CORRECTION_V4_FORBIDDEN_LINEAGE_MISMATCH")
  for (const { path: forbiddenPath } of forbidden) assertV138AbsentNoFollow(root, forbiddenPath)

  const triggerBytes = options.triggeringReviewBytes ?? execFileSync("git", ["show", `${V138_PHASE_262_TRIGGER_REVIEW_V4.commit}:${V138_PHASE_262_TRIGGER_REVIEW_V4.path}`], { cwd: root })
  if (sha256V138Secure(triggerBytes) !== V138_PHASE_262_TRIGGER_REVIEW_V4.sha256) fail("V138_CORRECTION_V4_TRIGGER_REVIEW_MISMATCH")
  if (options.triggeringReviewBytes === undefined) {
    const blob = execFileSync("git", ["rev-parse", `${V138_PHASE_262_TRIGGER_REVIEW_V4.commit}:${V138_PHASE_262_TRIGGER_REVIEW_V4.path}`], { cwd: root, encoding: "utf8" }).trim()
    if (blob !== V138_PHASE_262_TRIGGER_REVIEW_V4.blob) fail("V138_CORRECTION_V4_TRIGGER_BLOB_MISMATCH")
  }
  const disposition = JSON.parse(readV138RegularNoFollow(root, ".planning/artifacts/v1.38-plan-262-88-admission-disposition-v2.json").toString("utf8"))
  if (disposition.status !== "non_pass" || disposition.counters?.freshAccepted !== 0 || disposition.counters?.requiredAccepted !== 540) fail("V138_CORRECTION_V4_EMPIRICAL_JOIN_INVALID")

  const body = {
    schemaVersion: "v1.38-phase-262-review-fix-correction-v4" as const,
    status: "integrity_non_pass" as const,
    supersedesForFutureAuthority: PRIOR_CORRECTIONS[2].path,
    priorCorrections: PRIOR_CORRECTIONS,
    triggeringReview: { ...V138_PHASE_262_TRIGGER_REVIEW_V4, immutableCommitQualifiedBlob: true as const },
    mutableAggregateReview: { path: V138_PHASE_262_TRIGGER_REVIEW_V4.path, observedSha256: sha256V138Secure(readV138RegularNoFollow(root, V138_PHASE_262_TRIGGER_REVIEW_V4.path)), authoritativeTrigger: false as const, replaceableByIndependentRereview: true as const },
    reauthenticated: { manifestCommitments: FROZEN_MANIFESTS, v1Protected, v1Remediation, v2Successor, v3Successor, forbidden },
    remediation: { sourceOnly: true as const, liveAuthority: false as const, independentZeroFindingReviewRequired: true as const, sourceFiles: SUCCESSOR_V4 },
    empiricalOutcome: { terminalDisposition: "exhausted" as const, freshAccepted: 0 as const, requiredAccepted: 540 as const, reproductionV16Present: false as const, outcomeReinterpreted: false as const },
    forbiddenDestinations: forbidden,
    authority: Object.fromEntries(forbidden.map(({ denial }: { denial: string }) => [denial, false])),
  }
  return deepFreeze({ ...body, correctionRoot: sha256V138Secure(`v138-phase262-review-fix-correction-v4\0${canonical(body)}`) })
}

export const checkV138Phase262ReviewFixCorrectionV4 = (rootInput: string): true => {
  const root = trustedRootV138(rootInput)
  const bytes = readV138RegularNoFollow(root, V138_PHASE_262_CORRECTION_V4_PATH).toString("utf8")
  const candidate = JSON.parse(bytes)
  const expected = deriveV138Phase262ReviewFixCorrectionV4(root)
  if (bytes !== canonical(candidate) || canonical(candidate) !== canonical(expected)) fail("V138_CORRECTION_V4_MISMATCH")
  return true
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv[2] === "--derive") process.stdout.write(canonical(deriveV138Phase262ReviewFixCorrectionV4(process.cwd())))
  else if (process.argv[2] === "--check") { checkV138Phase262ReviewFixCorrectionV4(process.cwd()); process.stdout.write("review_fix_correction_v4_valid=true\n") }
  else fail("V138_CORRECTION_V4_COMMAND_INVALID")
}
