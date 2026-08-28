import { execFileSync } from "node:child_process"
import { fileURLToPath } from "node:url"
import {
  readV138WorkspaceBatch,
  sha256V138Secure,
  V138_SECURE_BATCH_PROTOCOL_V6,
  type V138SecureWorkspaceBatch,
} from "./lib/v1-38-secure-workspace-path-v6.js"

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

export const V138_PHASE_262_CORRECTION_V10_PATH =
  ".planning/artifacts/v1.38-phase-262-review-fix-correction-v10.json"
export const V138_PHASE_262_CORRECTION_V10_TRIGGER = freeze({
  commit: "d23c8a9b19dabc0ff24f436ea51fba0827113e63",
  blob: "1859fabb0ed33d8aeaf4453853727e882aea62dc",
  path: ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-REVIEW.md",
  sha256: "sha256:255ae8144a9617d6e785529bb8ea456a141fe7e457bced6e5c02233c3b87004a" as Sha,
})
export const V138_PHASE_262_CORRECTION_V10_EVIDENCE = freeze([
  { path: ".planning/artifacts/v1.38-phase-262-review-fix-correction-v9.json", sha256: "sha256:a25875c3c74a8c635ca92dcb84295b9394b897285eda5681fc9461139a4f040b" },
  { path: ".planning/artifacts/v1.38-phase-262-historical-correction-checkouts-v5.json", sha256: "sha256:d40ac49e2125b66269c5aba7962e7f8afdde9b35732b5921ec9119db524ca98f" },
  { path: ".planning/artifacts/v1.38-plan-262-88-admission-disposition-v2.json", sha256: "sha256:471a8a2014064d40d9156f904e1c738222f3e3330581771fd03e3ffb68373452" },
  { path: ".planning/artifacts/v1.38-phase-262-current-lifecycle-status-v2.json", sha256: "sha256:83383114809c8df28bcad56d3b04ba7ba0ccebfbf4229b5900d272af4e1506a6" },
  { path: "scripts/lib/v1-38-secure-workspace-path-v6.ts", sha256: "sha256:f8a2959c2db6a9a80147f6d1ece13d30d9fec457d90354e711be0a49319e5f49" },
  { path: "scripts/lib/v1-38-secure-workspace-path-v6.test.ts", sha256: "sha256:cde405295a110139b6b2d4fe9b5768b545b75cf529ac8cdd6b12783facc72591" },
  { path: "scripts/native/v1-38-secure-manifest-reader-v6.c", sha256: "sha256:fe1915ef41b134c1a1bae5e1e3df2c26a9ae47a2258b917bd1f1469917abffc1" },
  { path: "scripts/run-v1-38-phase-262-historical-correction-checkouts-v4.ts", sha256: "sha256:44fc957ff03ea53450e1d181fb5fef8be23d9a8c2eb305353fffdee6f944a457" },
  { path: "scripts/run-v1-38-phase-262-historical-correction-checkouts-v4.test.ts", sha256: "sha256:17b58d34e7267c8893ced697faee3001312623f566fe9f38dfbfabd3ef2db73a" },
  { path: "package.json", sha256: "sha256:0da6d11a0a5ce687b4669a2028f14d0e10ba7bd01afb8864b928b9394b64eac2" },
] as readonly Entry[])

export const V138_PHASE_262_CORRECTION_V10_AUTHORITY_KEYS = freeze([
  "archiveAuthorized", "candidateSearchAuthorized", "countedPlayAuthorized",
  "formationMaterializationAuthorized", "foundationActivationAuthorized",
  "gameplayChangeAuthorized", "holdoutOpeningAuthorized",
  "phase263ExecutionAuthorized", "phase263PlanningAuthorized",
  "productAuthorized", "productionAuthorized", "publicAuthorized", "tagAuthorized",
])
export const V138_PHASE_262_CORRECTION_V10_FORBIDDEN = freeze([
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
  for (const entry of V138_PHASE_262_CORRECTION_V10_EVIDENCE)
    if (sha256V138Secure(batch.bytes[entry.path]!) !== entry.sha256) fail("V138_CORRECTION_V10_MANIFEST_MISMATCH")
  const prior = freeze(JSON.parse(batch.bytes[V138_PHASE_262_CORRECTION_V10_EVIDENCE[0]!.path]!.toString("utf8")))
  const historical = freeze(JSON.parse(batch.bytes[V138_PHASE_262_CORRECTION_V10_EVIDENCE[1]!.path]!.toString("utf8")))
  const disposition = freeze(JSON.parse(batch.bytes[V138_PHASE_262_CORRECTION_V10_EVIDENCE[2]!.path]!.toString("utf8")))
  const lifecycle = freeze(JSON.parse(batch.bytes[V138_PHASE_262_CORRECTION_V10_EVIDENCE[3]!.path]!.toString("utf8")))
  exactKeys(prior.authority, V138_PHASE_262_CORRECTION_V10_AUTHORITY_KEYS, "V138_CORRECTION_V10_PRIOR_AUTHORITY_SCHEMA_INVALID")
  if (V138_PHASE_262_CORRECTION_V10_AUTHORITY_KEYS.some((key) => prior.authority[key] !== false)) fail("V138_CORRECTION_V10_PRIOR_AUTHORITY_TRUE")
  if (canonical(prior.forbiddenDestinations) !== canonical(V138_PHASE_262_CORRECTION_V10_FORBIDDEN)) fail("V138_CORRECTION_V10_PRIOR_FORBIDDEN_DRIFT")
  if (
    historical.schemaVersion !== "v1.38-phase-262-historical-correction-checkouts-v5" ||
    historical.results?.length !== 2 ||
    historical.results.some(
      (item: any) =>
        item.status !== "passed" ||
        item.dependencyIsolation !==
          "exact-pnpm-distribution-signed-toolchain-lockfile-store-integrity-v5" ||
        item.pnpmClosureFiles !== 448 ||
        item.checkoutByteManifestFiles < 1 ||
        item.checkoutByteManifestSymlinks < 0 ||
        item.installedClosureFiles < 1 ||
        item.installedClosurePackages < 1 ||
        item.entryLaunchBinding !==
          "same-process-reviewed-runner-no-ambient-tsx-child-v5" ||
        item.executionAssurance !==
          "single_operator_local_seal_v1_no_hostile_same_uid" ||
        Object.values(item.gitIsolation ?? {}).some((value) => value !== true),
    )
  )
    fail("V138_CORRECTION_V10_HISTORICAL_PROVENANCE_INVALID")
  exactKeys(disposition.authority, V138_PHASE_262_CORRECTION_V10_AUTHORITY_KEYS, "V138_CORRECTION_V10_DISPOSITION_AUTHORITY_SCHEMA_INVALID")
  if (V138_PHASE_262_CORRECTION_V10_AUTHORITY_KEYS.some((key) => disposition.authority[key] !== false)) fail("V138_CORRECTION_V10_DISPOSITION_AUTHORITY_TRUE")
  if (disposition.status !== "non_pass" || disposition.terminalDisposition !== "exhausted" || disposition.counters.freshAccepted !== 0 || disposition.counters.requiredAccepted !== 540) fail("V138_CORRECTION_V10_DISPOSITION_INVALID")
  if (lifecycle.lifecycle.phase262Status !== "incomplete" || lifecycle.lifecycle.plan89VerificationStatus !== "gaps_found" || lifecycle.retryOutcome.freshAccepted !== 0 || lifecycle.retryOutcome.requiredAccepted !== 540) fail("V138_CORRECTION_V10_LIFECYCLE_INVALID")
  const trigger = options.triggeringReviewBytes ?? execFileSync("/usr/bin/git", ["-c", "core.hooksPath=/dev/null", "show", `${V138_PHASE_262_CORRECTION_V10_TRIGGER.commit}:${V138_PHASE_262_CORRECTION_V10_TRIGGER.path}`], { cwd: options.historicalGitRoot ?? root, env: { PATH: "/usr/bin:/bin", LANG: "C", LC_ALL: "C", GIT_CONFIG_NOSYSTEM: "1", GIT_CONFIG_GLOBAL: "/dev/null", GIT_NO_REPLACE_OBJECTS: "1" } })
  if (sha256V138Secure(trigger) !== V138_PHASE_262_CORRECTION_V10_TRIGGER.sha256) fail("V138_CORRECTION_V10_TRIGGER_MISMATCH")
  const body = freeze({
    schemaVersion: "v1.38-phase-262-review-fix-correction-v10",
    status: "integrity_non_pass",
    authorityRelationship: "additive_no_predecessor_supersession",
    additiveTo: [
      { path: V138_PHASE_262_CORRECTION_V10_EVIDENCE[0]!.path, root: prior.correctionRoot, sha256: V138_PHASE_262_CORRECTION_V10_EVIDENCE[0]!.sha256 },
    ],
    triggeringReview: { ...V138_PHASE_262_CORRECTION_V10_TRIGGER, immutableCommitQualifiedBlob: true },
    scopedEvidenceSession: {
      protocol: V138_SECURE_BATCH_PROTOCOL_V6,
      identityBinding: batch.snapshotGuarantee,
      ancestorPaths: Object.keys(batch.ancestorIdentities).sort(),
      retainedAncestorCount: Object.keys(batch.ancestorIdentities).length,
      rootIdentityMatchedAncestor: canonical(batch.identity) === canonical(batch.ancestorIdentities[""]),
      hostIdentityPersisted: false,
      allReadsAndAbsencesOneBatch: true,
      barrierControl: batch.barrierControl,
    },
    reauthenticated: V138_PHASE_262_CORRECTION_V10_EVIDENCE,
    empiricalOutcome: { terminalDisposition: "exhausted", freshAccepted: 0, requiredAccepted: 540, reproductionV16Present: false, outcomeReinterpreted: false },
    remediation: {
      sourceOnly: true,
      liveAuthority: false,
      noLiveExecutionPerformed: true,
      independentZeroFindingReviewRequired: true,
      findingsClosed: ["CR-01", "CR-02", "WR-01"],
      nativeExecutionAssurance: "single_operator_local_seal_v1_no_hostile_same_uid",
      pathnameLaunchReplacementResistanceClaimed: false,
      requiredLeafPostFstatAndExactBoundedRead: true,
      installedRuntimeClosureAuthenticated: true,
      gitConfigHooksAndReplacementsDisabled: true,
      retainedRootInodeFlock: true,
      coherentManifestBatch: true,
      retainedRootDescriptorManifestAuthentication: true,
      pnpmDistributionClosureAuthenticated: true,
      ambientTsxChildEliminated: true,
      executedCheckoutBytesBoundToGitBlobs: true,
      checkoutTransformConfigurationRejectedAndNeutralized: true,
    },
    forbiddenDestinations: V138_PHASE_262_CORRECTION_V10_FORBIDDEN,
    authority: Object.fromEntries(V138_PHASE_262_CORRECTION_V10_AUTHORITY_KEYS.map((key) => [key, false])),
  })
  return freeze({ ...body, correctionRoot: sha256V138Secure(`v138-phase262-review-fix-correction-v10\0${canonical(body)}`) })
}

const batch = (root: string, includeArtifact: boolean): V138SecureWorkspaceBatch =>
  readV138WorkspaceBatch(root, [
    ...V138_PHASE_262_CORRECTION_V10_EVIDENCE.map(({ path }) => path),
    ...(includeArtifact ? [V138_PHASE_262_CORRECTION_V10_PATH] : []),
  ], V138_PHASE_262_CORRECTION_V10_FORBIDDEN.map(({ path }) => path))

export const deriveV138Phase262ReviewFixCorrectionV10 = (root: string, options: Options = {}): any =>
  deriveFromBatch(batch(root, false), root, options)

export const checkV138Phase262ReviewFixCorrectionV10 = (root: string, options: Options = {}): true => {
  const snapshot = batch(root, true)
  const bytes = snapshot.bytes[V138_PHASE_262_CORRECTION_V10_PATH]!.toString("utf8")
  const candidate = JSON.parse(bytes)
  const expected = deriveFromBatch(snapshot, root, options)
  if (bytes !== canonical(candidate) || canonical(candidate) !== canonical(expected)) fail("V138_CORRECTION_V10_MISMATCH")
  return true
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv[2] === "--derive") process.stdout.write(canonical(deriveV138Phase262ReviewFixCorrectionV10(process.cwd())))
  else if (process.argv[2] === "--check") { checkV138Phase262ReviewFixCorrectionV10(process.cwd()); process.stdout.write("review_fix_correction_v10_valid=true\n") }
  else fail("V138_CORRECTION_V10_COMMAND_INVALID")
}
