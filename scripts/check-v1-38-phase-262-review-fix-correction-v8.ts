import { execFileSync } from "node:child_process"
import { fileURLToPath } from "node:url"
import {
  readV138WorkspaceBatch,
  sha256V138Secure,
  V138_SECURE_BATCH_PROTOCOL_V5,
  type V138SecureWorkspaceBatch,
} from "./lib/v1-38-secure-workspace-path-v5.js"

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

export const V138_PHASE_262_CORRECTION_V8_PATH =
  ".planning/artifacts/v1.38-phase-262-review-fix-correction-v8.json"
export const V138_PHASE_262_CORRECTION_V8_TRIGGER = freeze({
  commit: "6b9d475b5ac0b6c6e9f7482c870d7fda7eaa12dc",
  blob: "033d22f170e7dee27b9a435b2fa08c8d2905fb2c",
  path: ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-REVIEW.md",
  sha256: "sha256:dcdcbea0e9295e5804baa653c86a188895b3e0fc393c57adb8503897b50dba8c" as Sha,
})
export const V138_PHASE_262_CORRECTION_V8_EVIDENCE = freeze([
  { path: ".planning/artifacts/v1.38-phase-262-review-fix-correction-v7.json", sha256: "sha256:fe850bd950c5fd5dc1abc3613c28cc5d82360053d91574bc446a97c86905ac42" },
  { path: ".planning/artifacts/v1.38-phase-262-historical-correction-checkouts-v3.json", sha256: "sha256:4b3bbf44042e27b5efe6209e8812e5bc9512ed3f55b443d8bcd876fbc37fe2bc" },
  { path: ".planning/artifacts/v1.38-plan-262-88-admission-disposition-v2.json", sha256: "sha256:471a8a2014064d40d9156f904e1c738222f3e3330581771fd03e3ffb68373452" },
  { path: ".planning/artifacts/v1.38-phase-262-current-lifecycle-status-v2.json", sha256: "sha256:83383114809c8df28bcad56d3b04ba7ba0ccebfbf4229b5900d272af4e1506a6" },
  { path: "scripts/lib/v1-38-private-native-bootstrap-v1.ts", sha256: "sha256:d8f75d3b6813e67ac48b95d765393492cc7d89ee4c7119199f322471162ad74b" },
  { path: "scripts/lib/v1-38-private-native-bootstrap-v1.test.ts", sha256: "sha256:8d05a481adad0b51244047c4b7e4a20bc9341c65d0072d370e050ac81983458d" },
  { path: "scripts/lib/v1-38-bounded-retry-successor-controller-v5.ts", sha256: "sha256:c95569aa6ecc4514efda993e9c95c183a9e735588f5d6a501e694064684eabee" },
  { path: "scripts/lib/v1-38-bounded-retry-successor-controller-v5.test.ts", sha256: "sha256:f10d62267328a0470461965d587fcfdc0808f7592c27b02b6ace658368057636" },
  { path: "scripts/native/v1-38-successor-transaction-helper-v5.c", sha256: "sha256:67dfb100b5a9cbd4e357aa81365ceeffc3f267fef9cdb538a6c27c36f9ed8933" },
  { path: "scripts/lib/v1-38-secure-workspace-path-v5.ts", sha256: "sha256:3221bf584ba7a34b291ecd9f1e26256458bcf9542113f3efd024e1536ee01415" },
  { path: "scripts/lib/v1-38-secure-workspace-path-v5.test.ts", sha256: "sha256:004ce47e1c9c5b9e4efb3edf112f8696f73588934d8ffe827b20b21a6b5a12e7" },
  { path: "scripts/native/v1-38-secure-manifest-reader-v5.c", sha256: "sha256:edb022fb7013a09cd87ab9b1fb1c8652e7feb2e6cbbdfcb293b0b735b710038a" },
  { path: "scripts/run-v1-38-phase-262-historical-correction-checkouts-v3.ts", sha256: "sha256:65452076b21e21488911e028b8d5903bdc00cf70b13efd1868b2dda0af7a2e68" },
  { path: "scripts/run-v1-38-phase-262-historical-correction-checkouts-v3.test.ts", sha256: "sha256:b4486b6793036350eaffe8a8163c730b71054edc4770ee4029bc3b6b5e7a148f" },
  { path: "package.json", sha256: "sha256:f2a92bb65548bae2a394471cdaa857567f63795a62483a04f78ab583a1116b72" },
] as readonly Entry[])

export const V138_PHASE_262_CORRECTION_V8_AUTHORITY_KEYS = freeze([
  "archiveAuthorized", "candidateSearchAuthorized", "countedPlayAuthorized",
  "formationMaterializationAuthorized", "foundationActivationAuthorized",
  "gameplayChangeAuthorized", "holdoutOpeningAuthorized",
  "phase263ExecutionAuthorized", "phase263PlanningAuthorized",
  "productAuthorized", "productionAuthorized", "publicAuthorized", "tagAuthorized",
])
export const V138_PHASE_262_CORRECTION_V8_FORBIDDEN = freeze([
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
  for (const entry of V138_PHASE_262_CORRECTION_V8_EVIDENCE)
    if (sha256V138Secure(batch.bytes[entry.path]!) !== entry.sha256) fail("V138_CORRECTION_V8_MANIFEST_MISMATCH")
  const prior = freeze(JSON.parse(batch.bytes[V138_PHASE_262_CORRECTION_V8_EVIDENCE[0]!.path]!.toString("utf8")))
  const historical = freeze(JSON.parse(batch.bytes[V138_PHASE_262_CORRECTION_V8_EVIDENCE[1]!.path]!.toString("utf8")))
  const disposition = freeze(JSON.parse(batch.bytes[V138_PHASE_262_CORRECTION_V8_EVIDENCE[2]!.path]!.toString("utf8")))
  const lifecycle = freeze(JSON.parse(batch.bytes[V138_PHASE_262_CORRECTION_V8_EVIDENCE[3]!.path]!.toString("utf8")))
  exactKeys(prior.authority, V138_PHASE_262_CORRECTION_V8_AUTHORITY_KEYS, "V138_CORRECTION_V8_PRIOR_AUTHORITY_SCHEMA_INVALID")
  if (V138_PHASE_262_CORRECTION_V8_AUTHORITY_KEYS.some((key) => prior.authority[key] !== false)) fail("V138_CORRECTION_V8_PRIOR_AUTHORITY_TRUE")
  if (canonical(prior.forbiddenDestinations) !== canonical(V138_PHASE_262_CORRECTION_V8_FORBIDDEN)) fail("V138_CORRECTION_V8_PRIOR_FORBIDDEN_DRIFT")
  if (historical.schemaVersion !== "v1.38-phase-262-historical-correction-checkouts-v3" || historical.results?.length !== 2 || historical.results.some((item: any) => item.status !== "passed" || item.dependencyIsolation !== "exact-signed-toolchain-lockfile-store-integrity-v3")) fail("V138_CORRECTION_V8_HISTORICAL_PROVENANCE_INVALID")
  exactKeys(disposition.authority, V138_PHASE_262_CORRECTION_V8_AUTHORITY_KEYS, "V138_CORRECTION_V8_DISPOSITION_AUTHORITY_SCHEMA_INVALID")
  if (V138_PHASE_262_CORRECTION_V8_AUTHORITY_KEYS.some((key) => disposition.authority[key] !== false)) fail("V138_CORRECTION_V8_DISPOSITION_AUTHORITY_TRUE")
  if (disposition.status !== "non_pass" || disposition.terminalDisposition !== "exhausted" || disposition.counters.freshAccepted !== 0 || disposition.counters.requiredAccepted !== 540) fail("V138_CORRECTION_V8_DISPOSITION_INVALID")
  if (lifecycle.lifecycle.phase262Status !== "incomplete" || lifecycle.lifecycle.plan89VerificationStatus !== "gaps_found" || lifecycle.retryOutcome.freshAccepted !== 0 || lifecycle.retryOutcome.requiredAccepted !== 540) fail("V138_CORRECTION_V8_LIFECYCLE_INVALID")
  const trigger = options.triggeringReviewBytes ?? execFileSync("/usr/bin/git", ["show", `${V138_PHASE_262_CORRECTION_V8_TRIGGER.commit}:${V138_PHASE_262_CORRECTION_V8_TRIGGER.path}`], { cwd: options.historicalGitRoot ?? root, env: { PATH: "/usr/bin:/bin", LANG: "C", LC_ALL: "C" } })
  if (sha256V138Secure(trigger) !== V138_PHASE_262_CORRECTION_V8_TRIGGER.sha256) fail("V138_CORRECTION_V8_TRIGGER_MISMATCH")
  const body = freeze({
    schemaVersion: "v1.38-phase-262-review-fix-correction-v8",
    status: "integrity_non_pass",
    authorityRelationship: "additive_no_predecessor_supersession",
    additiveTo: [
      { path: V138_PHASE_262_CORRECTION_V8_EVIDENCE[0]!.path, root: prior.correctionRoot, sha256: V138_PHASE_262_CORRECTION_V8_EVIDENCE[0]!.sha256 },
    ],
    triggeringReview: { ...V138_PHASE_262_CORRECTION_V8_TRIGGER, immutableCommitQualifiedBlob: true },
    scopedEvidenceSession: {
      protocol: V138_SECURE_BATCH_PROTOCOL_V5,
      identityBinding: batch.snapshotGuarantee,
      ancestorPaths: Object.keys(batch.ancestorIdentities).sort(),
      retainedAncestorCount: Object.keys(batch.ancestorIdentities).length,
      rootIdentityMatchedAncestor: canonical(batch.identity) === canonical(batch.ancestorIdentities[""]),
      hostIdentityPersisted: false,
      allReadsAndAbsencesOneBatch: true,
    },
    reauthenticated: V138_PHASE_262_CORRECTION_V8_EVIDENCE,
    empiricalOutcome: { terminalDisposition: "exhausted", freshAccepted: 0, requiredAccepted: 540, reproductionV16Present: false, outcomeReinterpreted: false },
    remediation: { sourceOnly: true, liveAuthority: false, noLiveExecutionPerformed: true, independentZeroFindingReviewRequired: true },
    forbiddenDestinations: V138_PHASE_262_CORRECTION_V8_FORBIDDEN,
    authority: Object.fromEntries(V138_PHASE_262_CORRECTION_V8_AUTHORITY_KEYS.map((key) => [key, false])),
  })
  return freeze({ ...body, correctionRoot: sha256V138Secure(`v138-phase262-review-fix-correction-v8\0${canonical(body)}`) })
}

const batch = (root: string, includeArtifact: boolean): V138SecureWorkspaceBatch =>
  readV138WorkspaceBatch(root, [
    ...V138_PHASE_262_CORRECTION_V8_EVIDENCE.map(({ path }) => path),
    ...(includeArtifact ? [V138_PHASE_262_CORRECTION_V8_PATH] : []),
  ], V138_PHASE_262_CORRECTION_V8_FORBIDDEN.map(({ path }) => path))

export const deriveV138Phase262ReviewFixCorrectionV8 = (root: string, options: Options = {}): any =>
  deriveFromBatch(batch(root, false), root, options)

export const checkV138Phase262ReviewFixCorrectionV8 = (root: string, options: Options = {}): true => {
  const snapshot = batch(root, true)
  const bytes = snapshot.bytes[V138_PHASE_262_CORRECTION_V8_PATH]!.toString("utf8")
  const candidate = JSON.parse(bytes)
  const expected = deriveFromBatch(snapshot, root, options)
  if (bytes !== canonical(candidate) || canonical(candidate) !== canonical(expected)) fail("V138_CORRECTION_V8_MISMATCH")
  return true
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv[2] === "--derive") process.stdout.write(canonical(deriveV138Phase262ReviewFixCorrectionV8(process.cwd())))
  else if (process.argv[2] === "--check") { checkV138Phase262ReviewFixCorrectionV8(process.cwd()); process.stdout.write("review_fix_correction_v8_valid=true\n") }
  else fail("V138_CORRECTION_V8_COMMAND_INVALID")
}
