import { execFileSync } from "node:child_process"
import { fileURLToPath } from "node:url"
import {
  readV138WorkspaceBatch,
  sha256V138Secure,
  type V138SecureWorkspaceBatch,
} from "./lib/v1-38-secure-workspace-path-v4.js"

type Sha = `sha256:${string}`
type Entry = Readonly<{ path: string; sha256: Sha }>
const fail = (code: string): never => { throw new TypeError(code) }
const canonical = (value: unknown): string => {
  const normalize = (item: unknown): unknown =>
    Array.isArray(item) ? item.map(normalize) : item !== null && typeof item === "object"
      ? Object.fromEntries(Object.entries(item as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, child]) => [key, normalize(child)]))
      : item
  return `${JSON.stringify(normalize(value))}\n`
}
const freeze = <T>(value: T): T => {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) freeze(child)
    Object.freeze(value)
  }
  return value
}
const exactKeys = (value: unknown, expected: readonly string[], code: string): void => {
  if (value === null || typeof value !== "object" || canonical(Object.keys(value as object).sort()) !== canonical([...expected].sort())) fail(code)
}

export const V138_PHASE_262_CORRECTION_V7_PATH =
  ".planning/artifacts/v1.38-phase-262-review-fix-correction-v7.json"
export const V138_PHASE_262_CORRECTION_V7_TRIGGER = freeze({
  commit: "6bfa0bf46409161e6c9671f84e8e02f944feb233",
  blob: "882eaae2b4f71184c0085459532b875f6c9eb713",
  path: ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-REVIEW.md",
  sha256: "sha256:3815f7667cf9562665746de277c81ed720fea5ac8d43b344914e3de516e758b9" as Sha,
})
export const V138_PHASE_262_CORRECTION_V7_EVIDENCE = freeze([
  { path: ".planning/artifacts/v1.38-phase-262-review-fix-correction-v5.json", sha256: "sha256:414b830e5dec41693fceb2d4b43c33e7c076065d94fcdd6970fa197d6043fcec" },
  { path: ".planning/artifacts/v1.38-phase-262-review-fix-correction-v6.json", sha256: "sha256:28647f46b088a02e5736d03118840a8c0eb3b0dcebe08adb4ed52545f7534ccc" },
  { path: ".planning/artifacts/v1.38-plan-262-88-admission-disposition-v2.json", sha256: "sha256:471a8a2014064d40d9156f904e1c738222f3e3330581771fd03e3ffb68373452" },
  { path: ".planning/artifacts/v1.38-phase-262-current-lifecycle-status-v2.json", sha256: "sha256:83383114809c8df28bcad56d3b04ba7ba0ccebfbf4229b5900d272af4e1506a6" },
  { path: "scripts/lib/v1-38-bounded-retry-successor-controller-v4.ts", sha256: "sha256:78d9b07375e157124447645396375996b1130a093ee584b50f6b8e2df882b365" },
  { path: "scripts/lib/v1-38-bounded-retry-successor-controller-v4.test.ts", sha256: "sha256:fb532ff24bdde8dc1bf69af5e0365508dd7f76d7df74a3a7b945e41b9f1eef0c" },
  { path: "scripts/native/v1-38-successor-transaction-helper-v4.c", sha256: "sha256:7664fe6f95b984164b60d24b4558107b700cfc348786a6a0d3897eeb3eb5124c" },
  { path: "scripts/lib/v1-38-secure-workspace-path-v4.ts", sha256: "sha256:cccb77941427b3ef69c3d0f4c669c92a688a04c9eeba0d6826e746e477206abc" },
  { path: "scripts/lib/v1-38-secure-workspace-path-v4.test.ts", sha256: "sha256:806a846b835d1b3c36c1734023d205307582ae9ccdfd40bf7a31425aff7dfca6" },
  { path: "scripts/native/v1-38-secure-manifest-reader-v4.c", sha256: "sha256:984a7f864f4a15527768ec27e019f6e8527c0767e50660505fef1b76331370c6" },
] as readonly Entry[])

export const V138_PHASE_262_CORRECTION_V7_AUTHORITY_KEYS = freeze([
  "archiveAuthorized", "candidateSearchAuthorized", "countedPlayAuthorized",
  "formationMaterializationAuthorized", "foundationActivationAuthorized",
  "gameplayChangeAuthorized", "holdoutOpeningAuthorized",
  "phase263ExecutionAuthorized", "phase263PlanningAuthorized",
  "productAuthorized", "productionAuthorized", "publicAuthorized", "tagAuthorized",
])
export const V138_PHASE_262_CORRECTION_V7_FORBIDDEN = freeze([
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

type Options = Readonly<{ triggeringReviewBytes?: Buffer; historicalGitRoot?: string }>
const deriveFromBatch = (batch: V138SecureWorkspaceBatch, root: string, options: Options): any => {
  for (const entry of V138_PHASE_262_CORRECTION_V7_EVIDENCE)
    if (sha256V138Secure(batch.bytes[entry.path]!) !== entry.sha256) fail("V138_CORRECTION_V7_MANIFEST_MISMATCH")
  const v5 = freeze(JSON.parse(batch.bytes[V138_PHASE_262_CORRECTION_V7_EVIDENCE[0]!.path]!.toString("utf8")))
  const v6 = freeze(JSON.parse(batch.bytes[V138_PHASE_262_CORRECTION_V7_EVIDENCE[1]!.path]!.toString("utf8")))
  const disposition = freeze(JSON.parse(batch.bytes[V138_PHASE_262_CORRECTION_V7_EVIDENCE[2]!.path]!.toString("utf8")))
  const lifecycle = freeze(JSON.parse(batch.bytes[V138_PHASE_262_CORRECTION_V7_EVIDENCE[3]!.path]!.toString("utf8")))
  exactKeys(v5.authority, V138_PHASE_262_CORRECTION_V7_AUTHORITY_KEYS, "V138_CORRECTION_V7_V5_AUTHORITY_SCHEMA_INVALID")
  if (V138_PHASE_262_CORRECTION_V7_AUTHORITY_KEYS.some((key) => v5.authority[key] !== false)) fail("V138_CORRECTION_V7_V5_AUTHORITY_TRUE")
  if (canonical(v5.forbiddenDestinations) !== canonical(V138_PHASE_262_CORRECTION_V7_FORBIDDEN)) fail("V138_CORRECTION_V7_V5_FORBIDDEN_DRIFT")
  exactKeys(disposition.authority, V138_PHASE_262_CORRECTION_V7_AUTHORITY_KEYS, "V138_CORRECTION_V7_DISPOSITION_AUTHORITY_SCHEMA_INVALID")
  if (V138_PHASE_262_CORRECTION_V7_AUTHORITY_KEYS.some((key) => disposition.authority[key] !== false)) fail("V138_CORRECTION_V7_DISPOSITION_AUTHORITY_TRUE")
  if (disposition.status !== "non_pass" || disposition.terminalDisposition !== "exhausted" || disposition.counters.freshAccepted !== 0 || disposition.counters.requiredAccepted !== 540) fail("V138_CORRECTION_V7_DISPOSITION_INVALID")
  if (lifecycle.lifecycle.phase262Status !== "incomplete" || lifecycle.lifecycle.plan89VerificationStatus !== "gaps_found" || lifecycle.retryOutcome.freshAccepted !== 0 || lifecycle.retryOutcome.requiredAccepted !== 540) fail("V138_CORRECTION_V7_LIFECYCLE_INVALID")
  const trigger = options.triggeringReviewBytes ?? execFileSync("git", ["show", `${V138_PHASE_262_CORRECTION_V7_TRIGGER.commit}:${V138_PHASE_262_CORRECTION_V7_TRIGGER.path}`], { cwd: options.historicalGitRoot ?? root })
  if (sha256V138Secure(trigger) !== V138_PHASE_262_CORRECTION_V7_TRIGGER.sha256) fail("V138_CORRECTION_V7_TRIGGER_MISMATCH")
  const body = freeze({
    schemaVersion: "v1.38-phase-262-review-fix-correction-v7",
    status: "integrity_non_pass",
    authorityRelationship: "additive_no_predecessor_supersession",
    additiveTo: [
      { path: V138_PHASE_262_CORRECTION_V7_EVIDENCE[0]!.path, root: v5.correctionRoot, sha256: V138_PHASE_262_CORRECTION_V7_EVIDENCE[0]!.sha256 },
      { path: V138_PHASE_262_CORRECTION_V7_EVIDENCE[1]!.path, root: v6.correctionRoot, sha256: V138_PHASE_262_CORRECTION_V7_EVIDENCE[1]!.sha256 },
    ],
    triggeringReview: { ...V138_PHASE_262_CORRECTION_V7_TRIGGER, immutableCommitQualifiedBlob: true },
    scopedEvidenceSession: {
      protocol: "retained-all-ancestor-descriptor-batch-v1",
      identityBinding: "device-and-inode-retained-until-batch-exit",
      ancestorPaths: Object.keys(batch.ancestorIdentities).sort(),
      retainedAncestorCount: Object.keys(batch.ancestorIdentities).length,
      rootIdentityMatchedAncestor: canonical(batch.identity) === canonical(batch.ancestorIdentities[""]),
      hostIdentityPersisted: false,
      allReadsAndAbsencesOneBatch: true,
    },
    reauthenticated: V138_PHASE_262_CORRECTION_V7_EVIDENCE,
    empiricalOutcome: { terminalDisposition: "exhausted", freshAccepted: 0, requiredAccepted: 540, reproductionV16Present: false, outcomeReinterpreted: false },
    remediation: { sourceOnly: true, liveAuthority: false, noLiveExecutionPerformed: true, independentZeroFindingReviewRequired: true },
    forbiddenDestinations: V138_PHASE_262_CORRECTION_V7_FORBIDDEN,
    authority: Object.fromEntries(V138_PHASE_262_CORRECTION_V7_AUTHORITY_KEYS.map((key) => [key, false])),
  })
  return freeze({ ...body, correctionRoot: sha256V138Secure(`v138-phase262-review-fix-correction-v7\0${canonical(body)}`) })
}

const batch = (root: string, includeArtifact: boolean): V138SecureWorkspaceBatch =>
  readV138WorkspaceBatch(root, [
    ...V138_PHASE_262_CORRECTION_V7_EVIDENCE.map(({ path }) => path),
    ...(includeArtifact ? [V138_PHASE_262_CORRECTION_V7_PATH] : []),
  ], V138_PHASE_262_CORRECTION_V7_FORBIDDEN.map(({ path }) => path))

export const deriveV138Phase262ReviewFixCorrectionV7 = (root: string, options: Options = {}): any =>
  deriveFromBatch(batch(root, false), root, options)

export const checkV138Phase262ReviewFixCorrectionV7 = (root: string, options: Options = {}): true => {
  const snapshot = batch(root, true)
  const bytes = snapshot.bytes[V138_PHASE_262_CORRECTION_V7_PATH]!.toString("utf8")
  const candidate = JSON.parse(bytes)
  const expected = deriveFromBatch(snapshot, root, options)
  if (bytes !== canonical(candidate) || canonical(candidate) !== canonical(expected)) fail("V138_CORRECTION_V7_MISMATCH")
  return true
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv[2] === "--derive") process.stdout.write(canonical(deriveV138Phase262ReviewFixCorrectionV7(process.cwd())))
  else if (process.argv[2] === "--check") { checkV138Phase262ReviewFixCorrectionV7(process.cwd()); process.stdout.write("review_fix_correction_v7_valid=true\n") }
  else fail("V138_CORRECTION_V7_COMMAND_INVALID")
}
