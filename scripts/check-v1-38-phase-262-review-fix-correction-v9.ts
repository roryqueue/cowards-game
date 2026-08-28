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

export const V138_PHASE_262_CORRECTION_V9_PATH =
  ".planning/artifacts/v1.38-phase-262-review-fix-correction-v9.json"
export const V138_PHASE_262_CORRECTION_V9_TRIGGER = freeze({
  commit: "252f00b817f71af3f09af0bd4c7704ce25ec21a2",
  blob: "4d810a89ae267b4dd96c95d72d7e2a51d240f888",
  path: ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-REVIEW.md",
  sha256: "sha256:511323a555a63f6c7cd801ece0daecf9d192b9f60d3228675c62de7e4e81abfc" as Sha,
})
export const V138_PHASE_262_CORRECTION_V9_EVIDENCE = freeze([
  { path: ".planning/artifacts/v1.38-phase-262-review-fix-correction-v8.json", sha256: "sha256:d0b3adddf5b93bd2032aadb8d3ede64d7eb96642f97f9c3e2806526a57b0dd94" },
  { path: ".planning/artifacts/v1.38-phase-262-historical-correction-checkouts-v4.json", sha256: "sha256:ae160ecefb4a6245669470c0f0d6d98ec78789b86c1557af32f7e903b0763242" },
  { path: ".planning/artifacts/v1.38-plan-262-88-admission-disposition-v2.json", sha256: "sha256:471a8a2014064d40d9156f904e1c738222f3e3330581771fd03e3ffb68373452" },
  { path: ".planning/artifacts/v1.38-phase-262-current-lifecycle-status-v2.json", sha256: "sha256:83383114809c8df28bcad56d3b04ba7ba0ccebfbf4229b5900d272af4e1506a6" },
  { path: "scripts/lib/v1-38-private-native-bootstrap-v2.ts", sha256: "sha256:165bdefcc02fd9448b3f5d778888617f90d16e7e0801bc091726574ecfcfae78" },
  { path: "scripts/lib/v1-38-private-native-bootstrap-v2.test.ts", sha256: "sha256:8a6588f449a8b9e92e1de9685ccd03e8f7cc065d863b73538730280fab1ff4d8" },
  { path: "scripts/lib/v1-38-bounded-retry-successor-controller-v6.ts", sha256: "sha256:158528d7d9ce785a4fb88d72371077a05d7bf2814a0488b8ff8b66a066b4c183" },
  { path: "scripts/lib/v1-38-bounded-retry-successor-controller-v6.test.ts", sha256: "sha256:6425ca6c04df40d85c526459522989a650d4f0991e9a95f7ebce56d03f9a8b68" },
  { path: "scripts/native/v1-38-successor-transaction-helper-v6.c", sha256: "sha256:643d5c7a2bc1e92671c73705965d6f3451946faa60be48b34b044962020d261a" },
  { path: "scripts/lib/v1-38-secure-workspace-path-v6.ts", sha256: "sha256:15f0a21335acd39d5b67b85ddf616f81f5ccd6bf4fd40baa92235549c472f9a1" },
  { path: "scripts/lib/v1-38-secure-workspace-path-v6.test.ts", sha256: "sha256:0c2bda2c0db62c56956b4c649e1908a1bb0fa3532c754448fc2c62682c83ade2" },
  { path: "scripts/native/v1-38-secure-manifest-reader-v6.c", sha256: "sha256:fe1915ef41b134c1a1bae5e1e3df2c26a9ae47a2258b917bd1f1469917abffc1" },
  { path: "scripts/run-v1-38-phase-262-historical-correction-checkouts-v4.ts", sha256: "sha256:408ff042638580a7759f0556344bdce13c8ed07e2e556f029a7a4f7c631e78d8" },
  { path: "scripts/run-v1-38-phase-262-historical-correction-checkouts-v4.test.ts", sha256: "sha256:2156f7cb318022b816615350eb86cbfb0fa4d62ef1c1ab30a003bc77d6ecc5fb" },
  { path: "package.json", sha256: "sha256:847246f2a3a977612655a540425a3e497e88725a3926a0313b17b948b8b74c2f" },
] as readonly Entry[])

export const V138_PHASE_262_CORRECTION_V9_AUTHORITY_KEYS = freeze([
  "archiveAuthorized", "candidateSearchAuthorized", "countedPlayAuthorized",
  "formationMaterializationAuthorized", "foundationActivationAuthorized",
  "gameplayChangeAuthorized", "holdoutOpeningAuthorized",
  "phase263ExecutionAuthorized", "phase263PlanningAuthorized",
  "productAuthorized", "productionAuthorized", "publicAuthorized", "tagAuthorized",
])
export const V138_PHASE_262_CORRECTION_V9_FORBIDDEN = freeze([
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
  for (const entry of V138_PHASE_262_CORRECTION_V9_EVIDENCE)
    if (sha256V138Secure(batch.bytes[entry.path]!) !== entry.sha256) fail("V138_CORRECTION_V9_MANIFEST_MISMATCH")
  const prior = freeze(JSON.parse(batch.bytes[V138_PHASE_262_CORRECTION_V9_EVIDENCE[0]!.path]!.toString("utf8")))
  const historical = freeze(JSON.parse(batch.bytes[V138_PHASE_262_CORRECTION_V9_EVIDENCE[1]!.path]!.toString("utf8")))
  const disposition = freeze(JSON.parse(batch.bytes[V138_PHASE_262_CORRECTION_V9_EVIDENCE[2]!.path]!.toString("utf8")))
  const lifecycle = freeze(JSON.parse(batch.bytes[V138_PHASE_262_CORRECTION_V9_EVIDENCE[3]!.path]!.toString("utf8")))
  exactKeys(prior.authority, V138_PHASE_262_CORRECTION_V9_AUTHORITY_KEYS, "V138_CORRECTION_V9_PRIOR_AUTHORITY_SCHEMA_INVALID")
  if (V138_PHASE_262_CORRECTION_V9_AUTHORITY_KEYS.some((key) => prior.authority[key] !== false)) fail("V138_CORRECTION_V9_PRIOR_AUTHORITY_TRUE")
  if (canonical(prior.forbiddenDestinations) !== canonical(V138_PHASE_262_CORRECTION_V9_FORBIDDEN)) fail("V138_CORRECTION_V9_PRIOR_FORBIDDEN_DRIFT")
  if (
    historical.schemaVersion !== "v1.38-phase-262-historical-correction-checkouts-v4" ||
    historical.results?.length !== 2 ||
    historical.results.some(
      (item: any) =>
        item.status !== "passed" ||
        item.dependencyIsolation !==
          "exact-signed-toolchain-lockfile-store-integrity-v4" ||
        item.installedClosureFiles < 1 ||
        item.installedClosurePackages < 1 ||
        item.entryLaunchBinding !==
          "pre-post-entry-and-complete-installed-closure-v4" ||
        item.executionAssurance !==
          "single_operator_local_seal_v1_no_hostile_same_uid" ||
        Object.values(item.gitIsolation ?? {}).some((value) => value !== true),
    )
  )
    fail("V138_CORRECTION_V9_HISTORICAL_PROVENANCE_INVALID")
  exactKeys(disposition.authority, V138_PHASE_262_CORRECTION_V9_AUTHORITY_KEYS, "V138_CORRECTION_V9_DISPOSITION_AUTHORITY_SCHEMA_INVALID")
  if (V138_PHASE_262_CORRECTION_V9_AUTHORITY_KEYS.some((key) => disposition.authority[key] !== false)) fail("V138_CORRECTION_V9_DISPOSITION_AUTHORITY_TRUE")
  if (disposition.status !== "non_pass" || disposition.terminalDisposition !== "exhausted" || disposition.counters.freshAccepted !== 0 || disposition.counters.requiredAccepted !== 540) fail("V138_CORRECTION_V9_DISPOSITION_INVALID")
  if (lifecycle.lifecycle.phase262Status !== "incomplete" || lifecycle.lifecycle.plan89VerificationStatus !== "gaps_found" || lifecycle.retryOutcome.freshAccepted !== 0 || lifecycle.retryOutcome.requiredAccepted !== 540) fail("V138_CORRECTION_V9_LIFECYCLE_INVALID")
  const trigger = options.triggeringReviewBytes ?? execFileSync("/usr/bin/git", ["-c", "core.hooksPath=/dev/null", "show", `${V138_PHASE_262_CORRECTION_V9_TRIGGER.commit}:${V138_PHASE_262_CORRECTION_V9_TRIGGER.path}`], { cwd: options.historicalGitRoot ?? root, env: { PATH: "/usr/bin:/bin", LANG: "C", LC_ALL: "C", GIT_CONFIG_NOSYSTEM: "1", GIT_CONFIG_GLOBAL: "/dev/null", GIT_NO_REPLACE_OBJECTS: "1" } })
  if (sha256V138Secure(trigger) !== V138_PHASE_262_CORRECTION_V9_TRIGGER.sha256) fail("V138_CORRECTION_V9_TRIGGER_MISMATCH")
  const body = freeze({
    schemaVersion: "v1.38-phase-262-review-fix-correction-v9",
    status: "integrity_non_pass",
    authorityRelationship: "additive_no_predecessor_supersession",
    additiveTo: [
      { path: V138_PHASE_262_CORRECTION_V9_EVIDENCE[0]!.path, root: prior.correctionRoot, sha256: V138_PHASE_262_CORRECTION_V9_EVIDENCE[0]!.sha256 },
    ],
    triggeringReview: { ...V138_PHASE_262_CORRECTION_V9_TRIGGER, immutableCommitQualifiedBlob: true },
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
    reauthenticated: V138_PHASE_262_CORRECTION_V9_EVIDENCE,
    empiricalOutcome: { terminalDisposition: "exhausted", freshAccepted: 0, requiredAccepted: 540, reproductionV16Present: false, outcomeReinterpreted: false },
    remediation: {
      sourceOnly: true,
      liveAuthority: false,
      noLiveExecutionPerformed: true,
      independentZeroFindingReviewRequired: true,
      findingsClosed: ["CR-01", "CR-02", "CR-03", "CR-04", "CR-05", "WR-01", "WR-02"],
      nativeExecutionAssurance: "single_operator_local_seal_v1_no_hostile_same_uid",
      pathnameLaunchReplacementResistanceClaimed: false,
      requiredLeafPostFstatAndExactBoundedRead: true,
      installedRuntimeClosureAuthenticated: true,
      gitConfigHooksAndReplacementsDisabled: true,
      retainedRootInodeFlock: true,
      coherentManifestBatch: true,
    },
    forbiddenDestinations: V138_PHASE_262_CORRECTION_V9_FORBIDDEN,
    authority: Object.fromEntries(V138_PHASE_262_CORRECTION_V9_AUTHORITY_KEYS.map((key) => [key, false])),
  })
  return freeze({ ...body, correctionRoot: sha256V138Secure(`v138-phase262-review-fix-correction-v9\0${canonical(body)}`) })
}

const batch = (root: string, includeArtifact: boolean): V138SecureWorkspaceBatch =>
  readV138WorkspaceBatch(root, [
    ...V138_PHASE_262_CORRECTION_V9_EVIDENCE.map(({ path }) => path),
    ...(includeArtifact ? [V138_PHASE_262_CORRECTION_V9_PATH] : []),
  ], V138_PHASE_262_CORRECTION_V9_FORBIDDEN.map(({ path }) => path))

export const deriveV138Phase262ReviewFixCorrectionV9 = (root: string, options: Options = {}): any =>
  deriveFromBatch(batch(root, false), root, options)

export const checkV138Phase262ReviewFixCorrectionV9 = (root: string, options: Options = {}): true => {
  const snapshot = batch(root, true)
  const bytes = snapshot.bytes[V138_PHASE_262_CORRECTION_V9_PATH]!.toString("utf8")
  const candidate = JSON.parse(bytes)
  const expected = deriveFromBatch(snapshot, root, options)
  if (bytes !== canonical(candidate) || canonical(candidate) !== canonical(expected)) fail("V138_CORRECTION_V9_MISMATCH")
  return true
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv[2] === "--derive") process.stdout.write(canonical(deriveV138Phase262ReviewFixCorrectionV9(process.cwd())))
  else if (process.argv[2] === "--check") { checkV138Phase262ReviewFixCorrectionV9(process.cwd()); process.stdout.write("review_fix_correction_v9_valid=true\n") }
  else fail("V138_CORRECTION_V9_COMMAND_INVALID")
}
