import { execFileSync } from "node:child_process"
import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
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
    if (item !== null && typeof item === "object") {
      return Object.fromEntries(Object.entries(item as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, child]) => [key, normalize(child)]))
    }
    return item
  }
  return `${JSON.stringify(normalize(value))}\n`
}

export const V138_PHASE_262_CORRECTION_V2_PATH = ".planning/artifacts/v1.38-phase-262-review-fix-correction-v2.json"
export const V138_PHASE_262_TRIGGER_REVIEW = Object.freeze({
  commit: "c1d9ab6d75d406b83bf1b255be17b25a3d252ca3",
  blob: "8e5002c20443ab287e1a93af723ab505c88c4e3a",
  path: ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-REVIEW.md",
  sha256: "sha256:14ba257ddeb50c08c87fbc4e9b838bb87b168b7c34b0a163efac80deb8d14d1c" as const,
})

export const V138_PHASE_262_SUCCESSOR_V2_FILES = Object.freeze([
  { path: "scripts/lib/v1-38-bounded-retry-successor-controller-v2.ts", sha256: "sha256:865cf9afb95c91a20d067bb320db21f757c5b9927ef5884b7bf957cc803b4293" as const },
  { path: "scripts/lib/v1-38-bounded-retry-successor-controller-v2.test.ts", sha256: "sha256:8c77b46563545d783f651db6c2f9b2eba62eccd1b91e3f678b7b2ab34efe5549" as const },
  { path: "scripts/lib/v1-38-successor-effect-state-machine-v2.ts", sha256: "sha256:b2aa67394aa7d1b5b3e696b9a58077230666a24174ab08074dbe940043744658" as const },
  { path: "scripts/lib/v1-38-successor-effect-state-machine-v2.test.ts", sha256: "sha256:b7ce4b8500a91881e92dad6bd97dae46f8aaddef076269bf9d55026fed5c1420" as const },
  { path: "scripts/lib/v1-38-durable-pair-successor-v2.ts", sha256: "sha256:e553b0b3a5ad345aa16a843c85c3ffbe536f29d9525e33240d54bc91162ba1ae" as const },
  { path: "scripts/lib/v1-38-durable-pair-successor-v2.test.ts", sha256: "sha256:03e334408fabbd12f53efe607a6557767a4ea3e9c7c249f53b554d8cc06eeba3" as const },
  { path: "scripts/lib/v1-38-restartable-lifecycle-successor-v2.ts", sha256: "sha256:1838c81e282a6456eb38c12ea376ac30375a9d86133ce8aa75c174b3d78826df" as const },
  { path: "scripts/lib/v1-38-restartable-lifecycle-successor-v2.test.ts", sha256: "sha256:4320065f38b9330efa8df0b375f37105d75f250b87a55fe162d43b0752c8aef6" as const },
  { path: "scripts/lib/v1-38-secure-workspace-path-v2.ts", sha256: "sha256:7fd52596bf0eb4dfe3da9ff09d7841041396105cd1a64548ba0dd5cfedefcda4" as const },
  { path: "scripts/lib/v1-38-secure-workspace-path-v2.test.ts", sha256: "sha256:abc60f364e564d57dbb6c01066e8a97cacfa4f8380ae3817023771a47cf4ce9b" as const },
])

export const V138_PHASE_262_FORBIDDEN_DESTINATIONS_V2 = Object.freeze([
  { denial: "newRetryEnvelopeAuthorized", path: ".planning/artifacts/v1.38-plan-262-90-retry-envelope-v3.json" },
  { denial: "newRetryJournalAuthorized", path: ".planning/artifacts/v1.38-current-matrix-retry-journal-v3.jsonl" },
  { denial: "newRetryTerminalAuthorized", path: ".planning/artifacts/v1.38-current-matrix-retry-terminal-v3.json" },
  { denial: "reproductionAuthorized", path: ".planning/artifacts/v1.38-current-matrix-reproduction-v16.json" },
  { denial: "activationAuthorized", path: ".planning/artifacts/v1.38-plan-262-route-10-activation-v1.json" },
  { denial: "candidateSearchAuthorized", path: ".planning/artifacts/v1.38-phase-263-candidate-search-authorization-v1.json" },
  { denial: "phase263PlanningAuthorized", path: ".planning/artifacts/v1.38-phase-263-planning-authorization-v1.json" },
  { denial: "phase263ExecutionAuthorized", path: ".planning/artifacts/v1.38-phase-263-execution-authorization-v1.json" },
  { denial: "formationMaterializationAuthorized", path: ".planning/artifacts/v1.38-formation-materialization-authorization-v1.json" },
  { denial: "holdoutOpeningAuthorized", path: ".planning/artifacts/v1.38-holdout-opening-authorization-v1.json" },
  { denial: "publicProductProductionAuthorized", path: ".planning/artifacts/v1.38-public-product-production-authorization-v1.json" },
  { denial: "countedPlayAuthorized", path: ".planning/artifacts/v1.38-counted-play-authorization-v1.json" },
  { denial: "gameplayChangeAuthorized", path: ".planning/artifacts/v1.38-gameplay-change-authorization-v1.json" },
  { denial: "archiveAndTagAuthorized", path: ".planning/artifacts/v1.38-archive-tag-authorization-v1.json" },
])

const PRIOR_FILES = Object.freeze([
  { path: ".planning/artifacts/v1.38-phase-262-review-fix-correction-v1.json", sha256: "sha256:e48e1db20dd15110d1dfe7837a192003a77112eae6a6d65f6aa9c3c9e34f9bc6" as const },
  { path: ".planning/artifacts/v1.38-plan-262-88-admission-disposition-v2.json", sha256: "sha256:471a8a2014064d40d9156f904e1c738222f3e3330581771fd03e3ffb68373452" as const },
])

export const deriveV138Phase262ReviewFixCorrectionV2 = (
  rootInput: string,
  options: Readonly<{ triggeringReviewBytes?: Buffer }> = {},
): any => {
  const root = trustedRootV138(rootInput)
  authenticateV138ManifestNoFollow(root, PRIOR_FILES)
  authenticateV138ManifestNoFollow(root, V138_PHASE_262_SUCCESSOR_V2_FILES)
  for (const { path: forbidden } of V138_PHASE_262_FORBIDDEN_DESTINATIONS_V2) assertV138AbsentNoFollow(root, forbidden)

  const triggerBytes = options.triggeringReviewBytes ?? execFileSync("git", ["show", `${V138_PHASE_262_TRIGGER_REVIEW.commit}:${V138_PHASE_262_TRIGGER_REVIEW.path}`], { cwd: root })
  if (sha256V138Secure(triggerBytes) !== V138_PHASE_262_TRIGGER_REVIEW.sha256) fail("V138_CORRECTION_V2_TRIGGER_REVIEW_MISMATCH")
  if (options.triggeringReviewBytes === undefined) {
    const blob = execFileSync("git", ["rev-parse", `${V138_PHASE_262_TRIGGER_REVIEW.commit}:${V138_PHASE_262_TRIGGER_REVIEW.path}`], { cwd: root, encoding: "utf8" }).trim()
    if (blob !== V138_PHASE_262_TRIGGER_REVIEW.blob) fail("V138_CORRECTION_V2_TRIGGER_BLOB_MISMATCH")
  }

  const disposition = JSON.parse(readV138RegularNoFollow(root, PRIOR_FILES[1].path).toString("utf8"))
  if (disposition.status !== "non_pass" || disposition.counters?.freshAccepted !== 0 || disposition.counters?.requiredAccepted !== 540) fail("V138_CORRECTION_V2_EMPIRICAL_JOIN_INVALID")
  const mutableAggregateBytes = readV138RegularNoFollow(root, V138_PHASE_262_TRIGGER_REVIEW.path)
  const body = {
    schemaVersion: "v1.38-phase-262-review-fix-correction-v2" as const,
    status: "integrity_non_pass" as const,
    supersedesForFutureAuthority: V138_PHASE_262_CORRECTION_V2_PATH.replace("v2", "v1"),
    triggeringReview: { ...V138_PHASE_262_TRIGGER_REVIEW, immutableCommitQualifiedBlob: true as const },
    mutableAggregateReview: {
      path: V138_PHASE_262_TRIGGER_REVIEW.path,
      observedSha256: sha256V138Secure(mutableAggregateBytes),
      authoritativeTrigger: false as const,
      replaceableByIndependentRereview: true as const,
    },
    remediation: {
      sourceOnly: true as const,
      liveSideEffects: false as const,
      independentZeroFindingReviewRequired: true as const,
      sourceFiles: V138_PHASE_262_SUCCESSOR_V2_FILES,
    },
    empiricalOutcome: { terminalDisposition: "exhausted" as const, freshAccepted: 0 as const, requiredAccepted: 540 as const, reproductionV16Present: false as const, outcomeReinterpreted: false as const },
    forbiddenDestinations: V138_PHASE_262_FORBIDDEN_DESTINATIONS_V2,
    authority: Object.fromEntries(V138_PHASE_262_FORBIDDEN_DESTINATIONS_V2.map(({ denial }) => [denial, false])),
  }
  return Object.freeze({ ...body, correctionRoot: sha256V138Secure(`v138-phase262-review-fix-correction-v2\0${canonical(body)}`) })
}

export const checkV138Phase262ReviewFixCorrectionV2 = (rootInput: string): true => {
  const root = trustedRootV138(rootInput)
  const bytes = readV138RegularNoFollow(root, V138_PHASE_262_CORRECTION_V2_PATH).toString("utf8")
  const candidate = JSON.parse(bytes)
  const expected = deriveV138Phase262ReviewFixCorrectionV2(root)
  if (bytes !== canonical(candidate) || canonical(candidate) !== canonical(expected)) fail("V138_CORRECTION_V2_MISMATCH")
  return true
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv[2] === "--derive") process.stdout.write(canonical(deriveV138Phase262ReviewFixCorrectionV2(process.cwd())))
  else if (process.argv[2] === "--check") { checkV138Phase262ReviewFixCorrectionV2(process.cwd()); process.stdout.write("review_fix_correction_v2_valid=true\n") }
  else fail("V138_CORRECTION_V2_COMMAND_INVALID")
}
