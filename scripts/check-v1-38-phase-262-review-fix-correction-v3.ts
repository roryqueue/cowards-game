import { execFileSync } from "node:child_process"
import { fileURLToPath } from "node:url"
import {
  V138_PHASE_262_PROTECTED_FILES,
  V138_PHASE_262_REMEDIATION_FILES,
} from "./check-v1-38-phase-262-review-fix-correction-v1.js"
import {
  V138_PHASE_262_FORBIDDEN_DESTINATIONS_V2,
  V138_PHASE_262_SUCCESSOR_V2_FILES,
} from "./check-v1-38-phase-262-review-fix-correction-v2.js"
import {
  assertV138AbsentNoFollow,
  authenticateV138ManifestNoFollow,
  readV138RegularNoFollow,
  sha256V138Secure,
  trustedRootV138,
} from "./lib/v1-38-secure-workspace-path-v2.js"

const fail = (code: string): never => { throw new TypeError(code) }
const canonical = (value: unknown): string => {
  const normalize = (item: unknown): unknown => {
    if (Array.isArray(item)) return item.map(normalize)
    if (item !== null && typeof item === "object") return Object.fromEntries(Object.entries(item as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, child]) => [key, normalize(child)]))
    return item
  }
  return `${JSON.stringify(normalize(value))}\n`
}
const manifest = (entries: readonly (readonly [string, string])[]) => entries.map(([path, digest]) => ({ path, sha256: `sha256:${digest}` as const }))

export const V138_PHASE_262_CORRECTION_V3_PATH = ".planning/artifacts/v1.38-phase-262-review-fix-correction-v3.json"
export const V138_PHASE_262_TRIGGER_REVIEW_V3 = Object.freeze({
  commit: "2c99aff9694db4bd2f733da4783fae7cd1bb81e6",
  blob: "6a511fad0d5932a29e7767e701de5f20f6436d81",
  path: ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-REVIEW.md",
  sha256: "sha256:3f37a4742af95714e475117fc51ea782010270a28a21400334324a05d636c3bb" as const,
})

export const V138_PHASE_262_CORRECTION_V1_PROTECTED_MANIFEST = Object.freeze(manifest(V138_PHASE_262_PROTECTED_FILES))
export const V138_PHASE_262_CORRECTION_V1_REMEDIATION_MANIFEST = Object.freeze(manifest(V138_PHASE_262_REMEDIATION_FILES))
export const V138_PHASE_262_SUCCESSOR_V3_FILES = Object.freeze([
  { path: "scripts/lib/v1-38-bounded-retry-successor-controller-v2.ts", sha256: "sha256:273c68dabaece1ef0e60601f9ab24f980589e4ca147efff917daeecd7955c4b1" as const },
  { path: "scripts/lib/v1-38-bounded-retry-successor-controller-v2.test.ts", sha256: "sha256:ec11edeb3433e449fe757b8cdb4123348ea83067c9e1c77b41ee4cf405d8dadc" as const },
  { path: "scripts/lib/v1-38-successor-effect-state-machine-v2.ts", sha256: "sha256:b2aa67394aa7d1b5b3e696b9a58077230666a24174ab08074dbe940043744658" as const },
  { path: "scripts/lib/v1-38-successor-effect-state-machine-v2.test.ts", sha256: "sha256:b7ce4b8500a91881e92dad6bd97dae46f8aaddef076269bf9d55026fed5c1420" as const },
  { path: "scripts/lib/v1-38-durable-pair-successor-v2.ts", sha256: "sha256:80d34cdecaba53a475ce5af3f9c4714c7859d2d6e9761dc78871ca7c69af3e80" as const },
  { path: "scripts/lib/v1-38-durable-pair-successor-v2.test.ts", sha256: "sha256:3085e1192bbd7a2f479ccadd920f073314cd07f8303b4629dd96f427d3420907" as const },
  { path: "scripts/lib/v1-38-restartable-lifecycle-successor-v2.ts", sha256: "sha256:402bb82b7e837557e83d1f107d85ac09f87c5c317d5c96fbff6d3973349c5729" as const },
  { path: "scripts/lib/v1-38-restartable-lifecycle-successor-v2.test.ts", sha256: "sha256:3a390e571a95a6cd8c427adf2099d0d01d62cc7028cee6ddad17b23c9ffdc623" as const },
  { path: "scripts/lib/v1-38-secure-workspace-path-v2.ts", sha256: "sha256:54df25b69d7f6ab136a30970c7b435d9ca2aa0478e60783d7a66374e8b72ff50" as const },
  { path: "scripts/lib/v1-38-secure-workspace-path-v2.test.ts", sha256: "sha256:abc60f364e564d57dbb6c01066e8a97cacfa4f8380ae3817023771a47cf4ce9b" as const },
])

const PRIOR_CORRECTIONS = Object.freeze([
  { path: ".planning/artifacts/v1.38-phase-262-review-fix-correction-v1.json", sha256: "sha256:e48e1db20dd15110d1dfe7837a192003a77112eae6a6d65f6aa9c3c9e34f9bc6" as const, root: "sha256:2a7e25a324ee1e28e4f7da543634afd29dca87dac12e860fea3c0e6b01650029" as const },
  { path: ".planning/artifacts/v1.38-phase-262-review-fix-correction-v2.json", sha256: "sha256:3765367b73c9fe0a0dcc119ee2db59591c1efc8f4f763bf5ebfc5925ca33cb85" as const, root: "sha256:468054b638d95bc39f0a2f0459f9514a295cfd318748d18d78c039a2f239f526" as const },
])

export const deriveV138Phase262ReviewFixCorrectionV3 = (
  rootInput: string,
  options: Readonly<{ triggeringReviewBytes?: Buffer }> = {},
): any => {
  const root = trustedRootV138(rootInput)
  authenticateV138ManifestNoFollow(root, V138_PHASE_262_CORRECTION_V1_PROTECTED_MANIFEST)
  authenticateV138ManifestNoFollow(root, V138_PHASE_262_CORRECTION_V1_REMEDIATION_MANIFEST)
  authenticateV138ManifestNoFollow(root, PRIOR_CORRECTIONS.map(({ path, sha256 }) => ({ path, sha256 })))
  authenticateV138ManifestNoFollow(root, V138_PHASE_262_SUCCESSOR_V3_FILES)
  for (const { path: forbidden } of V138_PHASE_262_FORBIDDEN_DESTINATIONS_V2) assertV138AbsentNoFollow(root, forbidden)

  const correctionV1 = JSON.parse(readV138RegularNoFollow(root, PRIOR_CORRECTIONS[0].path).toString("utf8"))
  const correctionV2 = JSON.parse(readV138RegularNoFollow(root, PRIOR_CORRECTIONS[1].path).toString("utf8"))
  if (correctionV1.correctionRoot !== PRIOR_CORRECTIONS[0].root || correctionV2.correctionRoot !== PRIOR_CORRECTIONS[1].root) fail("V138_CORRECTION_V3_PRIOR_ROOT_MISMATCH")
  const v2Paths = correctionV2.remediation?.sourceFiles?.map(({ path }: { path: string }) => path)
  if (canonical(v2Paths) !== canonical(V138_PHASE_262_SUCCESSOR_V2_FILES.map(({ path }) => path)) || canonical(v2Paths) !== canonical(V138_PHASE_262_SUCCESSOR_V3_FILES.map(({ path }) => path))) fail("V138_CORRECTION_V3_SUCCESSOR_LINEAGE_MISMATCH")

  const triggerBytes = options.triggeringReviewBytes ?? execFileSync("git", ["show", `${V138_PHASE_262_TRIGGER_REVIEW_V3.commit}:${V138_PHASE_262_TRIGGER_REVIEW_V3.path}`], { cwd: root })
  if (sha256V138Secure(triggerBytes) !== V138_PHASE_262_TRIGGER_REVIEW_V3.sha256) fail("V138_CORRECTION_V3_TRIGGER_REVIEW_MISMATCH")
  if (options.triggeringReviewBytes === undefined) {
    const blob = execFileSync("git", ["rev-parse", `${V138_PHASE_262_TRIGGER_REVIEW_V3.commit}:${V138_PHASE_262_TRIGGER_REVIEW_V3.path}`], { cwd: root, encoding: "utf8" }).trim()
    if (blob !== V138_PHASE_262_TRIGGER_REVIEW_V3.blob) fail("V138_CORRECTION_V3_TRIGGER_BLOB_MISMATCH")
  }
  const disposition = JSON.parse(readV138RegularNoFollow(root, ".planning/artifacts/v1.38-plan-262-88-admission-disposition-v2.json").toString("utf8"))
  if (disposition.status !== "non_pass" || disposition.counters?.freshAccepted !== 0 || disposition.counters?.requiredAccepted !== 540) fail("V138_CORRECTION_V3_EMPIRICAL_JOIN_INVALID")

  const body = {
    schemaVersion: "v1.38-phase-262-review-fix-correction-v3" as const,
    status: "integrity_non_pass" as const,
    supersedesForFutureAuthority: PRIOR_CORRECTIONS[1].path,
    priorCorrections: PRIOR_CORRECTIONS,
    triggeringReview: { ...V138_PHASE_262_TRIGGER_REVIEW_V3, immutableCommitQualifiedBlob: true as const },
    mutableAggregateReview: { path: V138_PHASE_262_TRIGGER_REVIEW_V3.path, observedSha256: sha256V138Secure(readV138RegularNoFollow(root, V138_PHASE_262_TRIGGER_REVIEW_V3.path)), authoritativeTrigger: false as const, replaceableByIndependentRereview: true as const },
    reauthenticated: {
      correctionV1ProtectedEntries: V138_PHASE_262_CORRECTION_V1_PROTECTED_MANIFEST,
      correctionV1RemediationEntries: V138_PHASE_262_CORRECTION_V1_REMEDIATION_MANIFEST,
      correctionV2SuccessorLineage: V138_PHASE_262_SUCCESSOR_V2_FILES.map((entry, index) => ({ path: entry.path, priorSha256: entry.sha256, currentSha256: V138_PHASE_262_SUCCESSOR_V3_FILES[index]!.sha256 })),
    },
    remediation: { sourceOnly: true as const, liveAuthority: false as const, independentZeroFindingReviewRequired: true as const, sourceFiles: V138_PHASE_262_SUCCESSOR_V3_FILES },
    empiricalOutcome: { terminalDisposition: "exhausted" as const, freshAccepted: 0 as const, requiredAccepted: 540 as const, reproductionV16Present: false as const, outcomeReinterpreted: false as const },
    forbiddenDestinations: V138_PHASE_262_FORBIDDEN_DESTINATIONS_V2,
    authority: Object.fromEntries(V138_PHASE_262_FORBIDDEN_DESTINATIONS_V2.map(({ denial }) => [denial, false])),
  }
  return Object.freeze({ ...body, correctionRoot: sha256V138Secure(`v138-phase262-review-fix-correction-v3\0${canonical(body)}`) })
}

export const checkV138Phase262ReviewFixCorrectionV3 = (rootInput: string): true => {
  const root = trustedRootV138(rootInput)
  const bytes = readV138RegularNoFollow(root, V138_PHASE_262_CORRECTION_V3_PATH).toString("utf8")
  const candidate = JSON.parse(bytes)
  const expected = deriveV138Phase262ReviewFixCorrectionV3(root)
  if (bytes !== canonical(candidate) || canonical(candidate) !== canonical(expected)) fail("V138_CORRECTION_V3_MISMATCH")
  return true
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv[2] === "--derive") process.stdout.write(canonical(deriveV138Phase262ReviewFixCorrectionV3(process.cwd())))
  else if (process.argv[2] === "--check") { checkV138Phase262ReviewFixCorrectionV3(process.cwd()); process.stdout.write("review_fix_correction_v3_valid=true\n") }
  else fail("V138_CORRECTION_V3_COMMAND_INVALID")
}
