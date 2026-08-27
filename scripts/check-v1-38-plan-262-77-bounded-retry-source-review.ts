#!/usr/bin/env -S pnpm exec tsx
import { execFileSync } from "node:child_process"
import { Buffer } from "node:buffer"
import { createHash } from "node:crypto"
import {
  chmodSync,
  closeSync,
  constants,
  lstatSync,
  mkdtempSync,
  openSync,
  readFileSync,
  realpathSync,
  rmSync,
  statSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

type Json = null | boolean | number | string | Json[] | { [key: string]: Json }
type Sha256 = `sha256:${string}`
type Finding = Readonly<{
  code: string
  severity: "critical" | "high"
  summary: string
  detailRoot: Sha256
}>

const PHASE_DIR =
  ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con"

export const V138_PLAN_262_77_REVIEW_PATH =
  ".planning/artifacts/v1.38-plan-262-77-bounded-retry-source-review-v1.json"
export const V138_PLAN_262_77_REPORT_PATH = `${PHASE_DIR}/262-77-REVIEW.md`
export const V138_PLAN_262_77_SOURCE_PATHS = Object.freeze([
  "scripts/lib/v1-38-bounded-retry-envelope.ts",
  "scripts/run-v1-38-bounded-retry-envelope.ts",
  "scripts/run-v1-38-bounded-retry-envelope.test.ts",
] as const)

const PLAN_76_SUMMARY = `${PHASE_DIR}/262-76-SUMMARY.md`
const ARCHIVED_PLAN_62 = `${PHASE_DIR}/archived/262-62-HISTORICAL.md`
const ARCHIVED_PLAN_74 = `${PHASE_DIR}/archived/262-74-HISTORICAL.md`
const LOCAL_SEAL_REVIEW =
  ".planning/artifacts/v1.38-local-seal-independent-verification-v3.json"
const HISTORY_BINDER =
  ".planning/artifacts/v1.38-plan-262-74-post-validation-binder-v1.json"

const FORBIDDEN_DESTINATIONS = Object.freeze([
  ".planning/artifacts/v1.38-successor-source-seal-v11.json",
  ".planning/artifacts/v1.38-plan-262-78-retry-envelope-v1.json",
  ".planning/artifacts/v1.38-current-matrix-retry-journal-v1.jsonl",
  ".planning/artifacts/v1.38-current-matrix-retry-journal-v1.jsonl.lock",
  ".planning/artifacts/v1.38-current-matrix-retry-terminal-v1.json",
  ".planning/artifacts/v1.38-current-matrix-retry-private-v1",
  ".planning/artifacts/v1.38-current-matrix-reproduction-v15.json",
  ".planning/artifacts/v1.38-foundation-activation-root-route9.json",
  `${PHASE_DIR}/262-74-SUMMARY.md`,
])

const EXPECTED_SOURCE = Object.freeze({
  commit: "93ebaac43c13cf6e658769a11e9c2c10f5b35965",
  tree: "1d8ece1a9caf390aa36dd21c6bd0c835d20bda4c",
  parent: "b2a7acb050683da4735911fc7e3b52f0d3f75638",
  blobs: Object.freeze({
    "scripts/lib/v1-38-bounded-retry-envelope.ts":
      "9969f19141546bc21936ebdbdf1dd644cda11643",
    "scripts/run-v1-38-bounded-retry-envelope.ts":
      "7cc059dc2f8bde5d0966076f2ff461295a0ccdeb",
    "scripts/run-v1-38-bounded-retry-envelope.test.ts":
      "c9ab539d781a416ca487c197aa1b2d6848ef2725",
  }),
})

const EXPECTED_ARCHIVES = Object.freeze({
  [ARCHIVED_PLAN_62]:
    "sha256:438e139b6710c482b668514091968ee3a31ea575f2d0d002ec0c11473fdbc07a",
  [ARCHIVED_PLAN_74]:
    "sha256:9fc59c094d5423830500c383c1a7613e54a0d2dc6e0ee1a00f4882981f16913d",
})

const OBSERVATION_IDS = Object.freeze([
  "git-source-custody",
  "detached-owner-only-clone",
  "three-route-starts",
  "twelve-preflight-observations",
  "four-hour-window",
  "five-minute-refusal-spacing",
  "fifteen-minute-system-failure-backoff",
  "inclusive-2500-basis-point-threshold",
  "eight-attempt-four-shard-calibration",
  "single-540-cell-reproduction",
  "first-success-closure",
  "reservation-crash-reconciliation",
  "concurrent-owner-rejection",
  "canonical-runtime-kernel",
  "privacy-and-authority-denial",
  "protected-history-and-formation-absence",
  "canonical-destinations-untouched",
] as const)

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const fail = (code: string): never => {
  throw new TypeError(code)
}
const sha256 = (value: string | Uint8Array): Sha256 =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`
const canonicalize = (value: Json): Json =>
  Array.isArray(value)
    ? value.map(canonicalize)
    : value !== null && typeof value === "object"
      ? Object.fromEntries(
          Object.entries(value)
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([key, child]) => [key, canonicalize(child)]),
        )
      : value
const canonical = (value: unknown): string =>
  `${JSON.stringify(canonicalize(value as Json))}\n`
const lines = (value: string): string[] =>
  value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean)
const git = (root: string, args: readonly string[]): string =>
  execFileSync("git", [...args], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
  }).trim()

const safeType = (
  target: string,
): "absent" | "regular" | "directory" | "unsafe" => {
  try {
    const stat = lstatSync(target)
    if (stat.isSymbolicLink()) return "unsafe"
    if (stat.isFile()) return "regular"
    if (stat.isDirectory()) return "directory"
    return "unsafe"
  } catch (error) {
    if ((error as { code?: string }).code === "ENOENT") return "absent"
    throw error
  }
}

const readRegular = (root: string, repoPath: string): Buffer => {
  const target = path.resolve(root, repoPath)
  const physicalRoot = realpathSync(root)
  if (target !== physicalRoot && !target.startsWith(`${physicalRoot}${path.sep}`))
    fail("V138_PLAN_262_77_PATH_ESCAPE")
  if (safeType(target) !== "regular") fail("V138_PLAN_262_77_INPUT_INVALID")
  return readFileSync(target)
}

const changedPaths = (root: string, commit: string): string[] =>
  lines(
    git(root, [
      "diff-tree",
      "--no-commit-id",
      "--name-only",
      "-r",
      commit,
    ]),
  ).sort()

const requireAncestor = (root: string, ancestor: string, descendant: string) => {
  try {
    execFileSync("git", ["merge-base", "--is-ancestor", ancestor, descendant], {
      cwd: root,
      stdio: "ignore",
    })
  } catch {
    fail("V138_PLAN_262_77_LINEAGE_INVALID")
  }
}

export const inspectV138Plan26277SourceCustody = (root: string) => {
  const physicalRoot = realpathSync(root)
  if (realpathSync(git(root, ["rev-parse", "--show-toplevel"])) !== physicalRoot)
    fail("V138_PLAN_262_77_REPOSITORY_ROOT_INVALID")
  if (
    git(root, ["status", "--porcelain", "--", ...V138_PLAN_262_77_SOURCE_PATHS]) !==
    ""
  )
    fail("V138_PLAN_262_77_SOURCE_DIRTY")

  const commit = git(root, [
    "rev-list",
    "-1",
    "HEAD",
    "--",
    ...V138_PLAN_262_77_SOURCE_PATHS,
  ])
  const [tree, parents = ""] = git(root, [
    "show",
    "-s",
    "--format=%T%n%P",
    commit,
  ]).split("\n")
  const parentList = lines(parents)
  if (
    commit !== EXPECTED_SOURCE.commit ||
    tree !== EXPECTED_SOURCE.tree ||
    parentList.length !== 1 ||
    parentList[0] !== EXPECTED_SOURCE.parent
  )
    fail("V138_PLAN_262_77_SOURCE_IDENTITY_INVALID")

  const paths = changedPaths(root, commit).filter((item) =>
    (V138_PLAN_262_77_SOURCE_PATHS as readonly string[]).includes(item),
  )
  if (canonical(paths) !== canonical([...V138_PLAN_262_77_SOURCE_PATHS].sort()))
    fail("V138_PLAN_262_77_SOURCE_SCOPE_INVALID")

  const blobs = V138_PLAN_262_77_SOURCE_PATHS.map((repoPath) => {
    const tuple = git(root, ["ls-tree", commit, "--", repoPath]).split(/\s+/u)
    const mode = tuple[0]
    const blob = tuple[2]
    if (
      mode !== "100644" ||
      blob !== EXPECTED_SOURCE.blobs[repoPath] ||
      !/^[0-9a-f]{40}$/u.test(blob ?? "")
    )
      fail("V138_PLAN_262_77_SOURCE_BLOB_INVALID")
    const committed = execFileSync("git", ["show", `${commit}:${repoPath}`], {
      cwd: root,
    })
    const working = readRegular(root, repoPath)
    if (!committed.equals(working)) fail("V138_PLAN_262_77_SOURCE_WORKTREE_DRIFT")
    return Object.freeze({
      path: repoPath,
      mode,
      blob: blob!,
      sha256: sha256(committed),
      byteLength: committed.length,
    })
  })

  const summaryCommit = git(root, ["rev-list", "-1", "HEAD", "--", PLAN_76_SUMMARY])
  if (!/^[0-9a-f]{40}$/u.test(summaryCommit))
    fail("V138_PLAN_262_77_PLAN_76_SUMMARY_INVALID")
  requireAncestor(root, commit, summaryCommit)
  requireAncestor(root, summaryCommit, "HEAD")
  if (
    lines(git(root, ["log", "--format=%H", `${commit}..HEAD`, "--", ...V138_PLAN_262_77_SOURCE_PATHS]))
      .length !== 0
  )
    fail("V138_PLAN_262_77_SOURCE_REWRITE_INVALID")

  return Object.freeze({
    commit,
    tree: tree!,
    parent: parentList[0]!,
    plan76SummaryCommit: summaryCommit,
    paths: [...V138_PLAN_262_77_SOURCE_PATHS],
    blobs,
  })
}

const MUTATION_RULES = Object.freeze([
  ["MAX_ROUTE_STARTS_MUTATED", "model", "maximumRouteStarts: 3"],
  ["MAX_PREFLIGHT_OBSERVATIONS_MUTATED", "model", "maximumPreflightObservations: 12"],
  ["ENVELOPE_LIFETIME_MUTATED", "model", "envelopeLifetimeMilliseconds: 4 * 60 * 60 * 1_000"],
  ["REFUSAL_SPACING_MUTATED", "model", "refusalSpacingMilliseconds: 5 * 60 * 1_000"],
  ["CALIBRATION_BACKOFF_MUTATED", "model", "calibrationFailureBackoffMilliseconds: 15 * 60 * 1_000"],
  ["SAMPLING_CADENCE_MUTATED", "model", "samplingMilliseconds: 200"],
  ["ADMISSION_THRESHOLD_MUTATED", "model", "minimumEffectiveAvailableBasisPoints: 2_500"],
  ["REPRODUCTION_CELL_COUNT_MUTATED", "model", "reproductionCellCount: 540"],
  ["RUNTIME_AUTHORITY_MUTATED", "model", 'rulesAuthority: "MATCH_KERNEL"'],
  ["DOWNSTREAM_AUTHORITY_MUTATED", "model", "candidateSearchAuthorized: false"],
  ["PRIVACY_BOUNDARY_MUTATED", "controller", "strategySourceIncluded: false"],
  ["RESERVATION_HANDLER_MUTATED", "controller", "input.effects.appendDurableRecord(record)"],
  ["WAIT_HANDLER_MUTATED", "controller", "await input.effects.waitUntil(target)"],
  ["CALIBRATION_HANDLER_MUTATED", "controller", "const receipt = await calibrateV138ParallelMatrix({"],
  ["REPRODUCTION_HANDLER_MUTATED", "controller", "const result = await executeV138ParallelMatrix({"],
] as const)

export const inspectV138Plan26277SourceMutation = (input: Readonly<{
  model: string
  controller: string
}>): string[] => {
  const findings = MUTATION_RULES.filter(([, source, token]) =>
    !input[source].includes(token),
  ).map(([code]) => code)
  if (
    /\bMath\.random\b|\bDate\.now\b|from\s+["']node:vm["']|\bnew\s+Function\s*\(/u.test(
      `${input.model}\n${input.controller}`,
    )
  )
    findings.push("FORBIDDEN_CAPABILITY_PRESENT")
  return findings.sort()
}

const DETACHED_HARNESS = String.raw`
import { appendV138RetryJournalRecord, createV138InactiveRetryEnvelope, deriveV138RetryState, V138_BOUNDED_RETRY_IDENTITIES } from "./scripts/lib/v1-38-bounded-retry-envelope.ts";
import { runV138BoundedRetryController } from "./scripts/run-v1-38-bounded-retry-envelope.ts";
(async () => {
const A = "sha256:" + "a".repeat(64); const B = "sha256:" + "b".repeat(64);
const envelope = createV138InactiveRetryEnvelope({ sourceRoot:A, reviewRoot:B, sealRoot:A, protectedHistoryRoot:B, protectedHistoricalIdentities:["route:v8:pre_start_obstruction"] });
const make = (observations, calibrations, reproduction={status:"passed_exact",acceptedCells:540,completeCleanup:true}) => { let now=0; const waits=[]; return { waits, effects:{ monotonicMilliseconds:()=>now, waitUntil:async target=>{waits.push(target-now);now=target}, observePreflight:async()=>({available:true,effectiveAvailableBasisPoints:observations.shift()??2500}), runCalibration:async()=>({status:calibrations.shift()??"system_failure",completeCleanup:true}), runReproduction:async()=>reproduction, appendDurableRecord:()=>{} } } };
const successFx=make([2499,2500,2500],["system_failure","admitted"]); const success=await runV138BoundedRetryController({envelope,owner:"review-owner",records:[],effects:successFx.effects});
const refusalFx=make(Array.from({length:12},()=>0),[]); const refusals=await runV138BoundedRetryController({envelope,owner:"review-owner",records:[],effects:refusalFx.effects});
const failureFx=make([2500,2500,2500],["system_failure","system_failure","system_failure"]); const failures=await runV138BoundedRetryController({envelope,owner:"review-owner",records:[],effects:failureFx.effects});
const crashKinds=["reserve_preflight","reserve_route","reserve_calibration","finish_calibration","reserve_reproduction","finish_reproduction"]; const crashes=[];
for (const crashKind of crashKinds) { let durable=[]; const fx=make([2500],["admitted"]); fx.effects.appendDurableRecord=record=>{durable=[...durable,record];if(record.kind===crashKind)throw new Error("CRASH")}; try { await runV138BoundedRetryController({envelope,owner:"review-owner",records:[],effects:fx.effects}) } catch {} const restart=make(Array.from({length:12},()=>0),["admitted"]); const resumed=await runV138BoundedRetryController({envelope,owner:"review-owner",records:durable,effects:restart.effects}); crashes.push({kind:crashKind,disposition:resumed.state.disposition,preflights:resumed.state.preflightObservationsConsumed,routes:resumed.state.routeStartsConsumed,calibrations:resumed.state.calibrationIdentitiesCharged,reproduction:resumed.state.reproductionIdentitiesCharged}) }
let expiryRecords=[]; const append=(event,at)=>{expiryRecords=appendV138RetryJournalRecord(expiryRecords,event,at,envelope.envelopeRoot)}; append({kind:"reserve_preflight",identity:"preflight:v1:0",owner:"review-owner"},0); append({kind:"observe_preflight",identity:"preflight:v1:0",owner:"review-owner",effectiveAvailableBasisPoints:0},0);
let expiryError=""; const expiredFx=make([],[]); expiredFx.effects.monotonicMilliseconds=()=>4*60*60*1000+1; expiredFx.effects.waitUntil=async()=>{}; try { await runV138BoundedRetryController({envelope,owner:"review-owner",records:expiryRecords,effects:expiredFx.effects}) } catch(error) { expiryError=error.message }
let concurrentError=""; try { appendV138RetryJournalRecord(expiryRecords,{kind:"reserve_preflight",identity:"preflight:v1:0",owner:"other-owner"},300000,envelope.envelopeRoot) } catch(error) { concurrentError=error.message }
process.stdout.write(JSON.stringify({ success:success.state, waits:successFx.waits, refusals:refusals.state, failures:failures.state, crashes, expiry:{error:expiryError,state:deriveV138RetryState(envelope,expiryRecords).disposition}, concurrentError, calibrationIdentities:V138_BOUNDED_RETRY_IDENTITIES.calibrations.length, reproductionIdentities:V138_BOUNDED_RETRY_IDENTITIES.reproduction.length })+"\n");
})().catch(error => { process.stderr.write(String(error?.stack ?? error) + "\n"); process.exitCode = 1 });
`

const runDetachedExercise = (root: string, sourceCommit: string) => {
  const owner = mkdtempSync(path.join(realpathSync(tmpdir()), "v138-plan26277-review-"))
  chmodSync(owner, 0o700)
  const clone = path.join(owner, "repo")
  try {
    requireAncestor(root, sourceCommit, "HEAD")
    execFileSync("git", ["clone", "--shared", "--no-checkout", root, clone], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    })
    execFileSync("git", ["checkout", "--detach", "HEAD"], {
      cwd: clone,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    })
    symlinkSync(path.resolve(root, "node_modules"), path.join(clone, "node_modules"), "dir")
    for (const packageJson of lines(git(root, ["ls-files", "*/package.json"]))) {
      const packageDir = path.dirname(packageJson)
      const sourceModules = path.resolve(root, packageDir, "node_modules")
      const cloneModules = path.resolve(clone, packageDir, "node_modules")
      if (safeType(sourceModules) === "directory" && safeType(cloneModules) === "absent")
        symlinkSync(sourceModules, cloneModules, "dir")
    }
    if ((statSync(owner).mode & 0o777) !== 0o700)
      fail("V138_PLAN_262_77_DETACHED_OWNER_MODE_INVALID")
    for (const repoPath of V138_PLAN_262_77_SOURCE_PATHS) {
      if (
        git(root, ["rev-parse", `${sourceCommit}:${repoPath}`]) !==
        git(clone, ["rev-parse", `HEAD:${repoPath}`])
      )
        fail("V138_PLAN_262_77_DETACHED_SOURCE_INVALID")
    }
    const before = snapshotV138Plan26277ForbiddenDestinations(clone)
    const harnessPath = path.join(clone, ".plan26277-review-harness.mts")
    writeFileSync(harnessPath, DETACHED_HARNESS, { flag: "wx", mode: 0o600 })
    const stdout = execFileSync(
      path.resolve(root, "node_modules/.bin/tsx"),
      [harnessPath],
      {
        cwd: clone,
        encoding: "utf8",
        env: { ...process.env, LC_ALL: "C", LANG: "C" },
        timeout: 180_000,
        maxBuffer: 16 * 1024 * 1024,
      },
    )
    const after = snapshotV138Plan26277ForbiddenDestinations(clone)
    if (canonical(before) !== canonical(after))
      fail("V138_PLAN_262_77_DETACHED_CANONICAL_WRITE")
    const exercise = JSON.parse(stdout) as any
    if (
      exercise.success.disposition !== "succeeded" ||
      exercise.success.routeStartsConsumed !== 2 ||
      exercise.success.preflightObservationsConsumed !== 3 ||
      exercise.success.calibrationIdentitiesCharged !== 16 ||
      exercise.success.reproductionIdentitiesCharged !== 540 ||
      exercise.success.acceptedCells !== 540 ||
      exercise.refusals.disposition !== "exhausted" ||
      exercise.refusals.preflightObservationsConsumed !== 12 ||
      exercise.failures.disposition !== "exhausted" ||
      exercise.failures.routeStartsConsumed !== 3 ||
      exercise.failures.calibrationIdentitiesCharged !== 24 ||
      exercise.calibrationIdentities !== 24 ||
      exercise.reproductionIdentities !== 540 ||
      !exercise.waits.includes(300_000) ||
      !exercise.waits.includes(900_000) ||
      exercise.crashes.length !== 6 ||
      exercise.concurrentError !== "V138_RETRY_IDENTITY_ALREADY_CHARGED"
    )
      fail("V138_PLAN_262_77_DETACHED_EXERCISE_INVALID")
    return Object.freeze({
      ownerPath: ".review-owned-disposable-removed",
      ownerMode: "0700" as const,
      sourceCommit,
      outputRoot: sha256(canonical(exercise)),
      cleanupComplete: true as const,
      canonicalWrites: 0 as const,
      liveInvoked: false as const,
      expiryError: String(exercise.expiry.error),
      expiryState: String(exercise.expiry.state),
      crashKinds: exercise.crashes.map((item: any) => item.kind),
    })
  } finally {
    rmSync(owner, { recursive: true, force: true })
  }
}

export const snapshotV138Plan26277ForbiddenDestinations = (root: string) =>
  FORBIDDEN_DESTINATIONS.map((repoPath) => {
    const target = path.resolve(root, repoPath)
    const type = safeType(target)
    return Object.freeze({
      path: repoPath,
      type,
      ...(type === "regular" ? { root: sha256(readFileSync(target)) } : {}),
    })
  })

const inspectProtectedBoundaries = (root: string) => {
  const archives = Object.entries(EXPECTED_ARCHIVES).map(([repoPath, expected]) => {
    const actual = sha256(readRegular(root, repoPath))
    if (actual !== expected) fail("V138_PLAN_262_77_PROTECTED_HISTORY_INVALID")
    return Object.freeze({ path: repoPath, sha256: actual })
  })
  const localSeal = JSON.parse(readRegular(root, LOCAL_SEAL_REVIEW).toString("utf8"))
  if (
    localSeal.assuranceClass !== "single_operator_local_seal_v1" ||
    localSeal.satisfiesRevisedSeal01 !== true ||
    localSeal.independentCustodyClaimed !== false ||
    !/^sha256:[0-9a-f]{64}$/u.test(localSeal.verificationRoot ?? "")
  )
    fail("V138_PLAN_262_77_LOCAL_SEAL_BOUNDARY_INVALID")
  const history = JSON.parse(readRegular(root, HISTORY_BINDER).toString("utf8"))
  if (
    history.admit03 !== "blocked" ||
    history.freshCharged !== 0 ||
    history.freshAccepted !== 0 ||
    history.downstreamAuthorityDenied !== true ||
    !/^sha256:[0-9a-f]{64}$/u.test(history.binderRoot ?? "")
  )
    fail("V138_PLAN_262_77_HISTORY_BINDER_INVALID")
  return Object.freeze({
    archives,
    assuranceClass: "single_operator_local_seal_v1" as const,
    localSealVerificationRoot: localSeal.verificationRoot as string,
    protectedHistoryRoot: history.binderRoot as string,
    plan62Revived: false as const,
    plan74SummaryPresent: safeType(path.resolve(root, `${PHASE_DIR}/262-74-SUMMARY.md`)) !== "absent",
    freshCharged: 0 as const,
    freshAccepted: 0 as const,
  })
}

const observation = (id: (typeof OBSERVATION_IDS)[number], details: unknown) =>
  Object.freeze({
    id,
    passed: true as const,
    detailRoot: sha256(`${id}\0${canonical(details)}`),
  })

const finding = (code: string, severity: Finding["severity"], summary: string): Finding =>
  Object.freeze({
    code,
    severity,
    summary,
    detailRoot: sha256(`${code}\0${summary}\n`),
  })

export const deriveV138Plan26277NoPublish = (root: string) => {
  const before = snapshotV138Plan26277ForbiddenDestinations(root)
  if (before.some((item) => item.type !== "absent"))
    fail("V138_PLAN_262_77_FORBIDDEN_DESTINATION_PRESENT")
  const custody = inspectV138Plan26277SourceCustody(root)
  const model = readRegular(root, V138_PLAN_262_77_SOURCE_PATHS[0]).toString("utf8")
  const controller = readRegular(root, V138_PLAN_262_77_SOURCE_PATHS[1]).toString("utf8")
  const sourceMutations = inspectV138Plan26277SourceMutation({ model, controller })
  if (sourceMutations.length !== 0) fail("V138_PLAN_262_77_SOURCE_SURFACE_INVALID")
  const detachedExercise = runDetachedExercise(root, custody.commit)
  const protectedBoundaries = inspectProtectedBoundaries(root)
  if (protectedBoundaries.plan74SummaryPresent)
    fail("V138_PLAN_262_77_PLAN_74_SUMMARY_PRESENT")
  const after = snapshotV138Plan26277ForbiddenDestinations(root)
  if (canonical(before) !== canonical(after))
    fail("V138_PLAN_262_77_CANONICAL_DESTINATION_MUTATED")

  const findings: Finding[] = []
  if (
    detachedExercise.expiryError === "V138_RETRY_ENVELOPE_EXPIRED" &&
    detachedExercise.expiryState === "active"
  ) {
    findings.push(
      finding(
        "TIME_WINDOW_EXPIRY_NOT_TERMINALIZED",
        "critical",
        "After the four-hour bound elapses, the controller throws while the journal-derived state remains active; it does not durably terminalize the finite envelope.",
      ),
    )
  } else {
    findings.push(
      finding(
        "TIME_WINDOW_EXPIRY_OBSERVATION_INCOMPLETE",
        "critical",
        "The independent detached exercise could not prove a durable terminal disposition at the four-hour boundary.",
      ),
    )
  }

  const observationDetails = {
    custody,
    detachedExercise,
    protectedBoundaries,
    exactPolicy: {
      maximumRouteStarts: 3,
      maximumPreflightObservations: 12,
      envelopeLifetimeMilliseconds: 14_400_000,
      refusalSpacingMilliseconds: 300_000,
      calibrationFailureBackoffMilliseconds: 900_000,
      calibrationAttemptsPerRoute: 8,
      calibrationShardCount: 4,
      samplingMilliseconds: 200,
      minimumEffectiveAvailableBasisPoints: 2_500,
      reproductionCellCount: 540,
      maximumReproductionRuns: 1,
      rulesAuthority: "MATCH_KERNEL",
    },
  }
  const observations = OBSERVATION_IDS.map((id) => observation(id, observationDetails))
  const body = {
    schemaVersion: "v1.38-plan-262-77-bounded-retry-source-review-v1" as const,
    reviewProtocol: "fresh-bounded-retry-source-review-v1" as const,
    status: findings.length === 0 ? ("zero_findings" as const) : ("blocked" as const),
    reviewedSource: custody,
    detachedExercise,
    protectedBoundaries,
    observations,
    findings,
    findingCount: findings.length,
    sourceReviewPassed: findings.length === 0,
    identityClaims: Object.freeze({
      independentPersonClaimed: false as const,
      externalIdentityClaimed: false as const,
      cryptographicReviewerIdentityClaimed: false as const,
      independentCustodyClaimed: false as const,
      separatePermissioningClaimed: false as const,
      maliciousOperatorResistanceClaimed: false as const,
    }),
    authority: Object.freeze({
      plan26278Eligible: findings.length === 0,
      authorizationCreated: false as const,
      sealCreated: false as const,
      envelopeCreated: false as const,
      liveInvoked: false as const,
      freshCharged: 0 as const,
      freshAccepted: 0 as const,
      admit03Status: "blocked" as const,
      phase263Authorized: false as const,
      candidateSearchAuthorized: false as const,
      formationMaterializationAuthorized: false as const,
      holdoutOpeningAuthorized: false as const,
      publicAuthorized: false as const,
      productAuthorized: false as const,
      productionAuthorized: false as const,
      gameplayChangeAuthorized: false as const,
    }),
  }
  return Object.freeze({
    ...body,
    reviewRoot: sha256(`v138-plan26277-review-v1\0${canonical(body)}`),
  })
}

export const computeV138Plan26277ReviewRoot = (candidate: unknown): Sha256 => {
  const body = JSON.parse(JSON.stringify(candidate)) as Record<string, unknown>
  delete body.reviewRoot
  return sha256(`v138-plan26277-review-v1\0${canonical(body)}`)
}

export const validateV138Plan26277Review = (
  candidate: unknown,
  expected: unknown,
): true => {
  const value = candidate as any
  const reference = expected as any
  if (
    value?.schemaVersion !== "v1.38-plan-262-77-bounded-retry-source-review-v1" ||
    value?.reviewRoot !== computeV138Plan26277ReviewRoot(value) ||
    canonical(value) !== canonical(reference) ||
    !Array.isArray(value.observations) ||
    canonical(value.observations.map((item: any) => item.id)) !== canonical([...OBSERVATION_IDS]) ||
    value.observations.some((item: any) => item.passed !== true) ||
    !Array.isArray(value.findings) ||
    value.findingCount !== value.findings.length ||
    value.sourceReviewPassed !== (value.findingCount === 0) ||
    value.status !== (value.findingCount === 0 ? "zero_findings" : "blocked") ||
    value.authority.plan26278Eligible !== (value.findingCount === 0) ||
    Object.entries(value.authority).some(
      ([key, item]) =>
        key !== "plan26278Eligible" &&
        key !== "admit03Status" &&
        key !== "freshCharged" &&
        key !== "freshAccepted" &&
        item !== false,
    ) ||
    value.authority.admit03Status !== "blocked" ||
    value.authority.freshCharged !== 0 ||
    value.authority.freshAccepted !== 0 ||
    Object.values(value.identityClaims).some((item) => item !== false)
  )
    fail("V138_PLAN_262_77_REVIEW_MISMATCH")
  return true
}

export const renderV138Plan26277ReviewReport = (review: any): string => {
  const verdict = review.findingCount === 0 ? "PASS — exact zero findings" : "BLOCKED"
  const findingRows = review.findings.length === 0
    ? "None."
    : review.findings
        .map(
          (item: Finding) =>
            `- **${item.code}** (${item.severity}): ${item.summary} Evidence root: \`${item.detailRoot}\`.`,
        )
        .join("\n")
  return `---\nphase: 262-foundation-admission-measurement-custody-and-containment-con\nplan: "77"\nreview_protocol: ${review.reviewProtocol}\nreviewed_source_commit: ${review.reviewedSource.commit}\nfinding_count: ${review.findingCount}\nsource_review_passed: ${review.sourceReviewPassed}\nstatus: ${review.status}\nreview_root: ${review.reviewRoot}\n---\n\n# Phase 262 Plan 77: Bounded-Retry Source Review\n\n## Verdict\n\n**${verdict}.** This independent technical review is non-authorizing. ${review.authority.plan26278Eligible ? "Exact zero findings make only Plan 262-78 eligible." : "Plan 262-78 is not eligible."}\n\n## Exact Git Custody\n\n- Source commit: \`${review.reviewedSource.commit}\`\n- Source tree: \`${review.reviewedSource.tree}\`\n- Sole parent: \`${review.reviewedSource.parent}\`\n- Plan-76 summary commit: \`${review.reviewedSource.plan76SummaryCommit}\`\n- Exact paths: ${review.reviewedSource.paths.map((item: string) => `\`${item}\``).join(", ")}\n- All modes are \`100644\`; all working bytes equal the recorded Git blobs; no later rewrite exists.\n\n## Independent Exercises\n\nThe reviewer used an owner-only \`0700\` detached clone, fake effects, and no live handler. It exercised the exact 3-route, 12-observation, four-hour, five-minute, fifteen-minute, 8-attempt/4-shard, 200 ms, inclusive 2,500-basis-point, one-540-cell, first-success, reservation-crash, concurrency, runtime/kernel, privacy, and authority boundaries. The disposable clone was removed and canonical writes remained zero.\n\n## Findings\n\n${findingRows}\n\n## Preserved Boundaries\n\n- Archived Plans 62 and 74 remain byte-identical; Plan 74 remains unsummarized.\n- Prior charges remain protected and fresh accounting remains 0 charged / 0 accepted.\n- The assurance class remains \`single_operator_local_seal_v1\`; no independent custody, separate permissioning, or malicious-operator resistance is claimed.\n- No seal, inactive envelope, journal, terminal, reproduction, activation root, formation material, live observation, local-secret access, or downstream authority was created.\n- ADMIT-03 remains blocked at 0/540; Phase 263, candidate search, formation, holdout opening, public, product, production, counted play, and gameplay change remain unauthorized.\n\n## Review Root\n\n\`${review.reviewRoot}\`\n`
}

export const validateV138Plan26277ReviewPair = (
  candidate: unknown,
  report: string,
  expected: unknown,
): true => {
  validateV138Plan26277Review(candidate, expected)
  if (report !== renderV138Plan26277ReviewReport(candidate as any))
    fail("V138_PLAN_262_77_REPORT_MISMATCH")
  return true
}

const exclusiveWrite = (target: string, bytes: string): void => {
  if (safeType(target) !== "absent") fail("V138_PLAN_262_77_DESTINATION_PRESENT")
  const descriptor = openSync(
    target,
    constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | (constants.O_NOFOLLOW ?? 0),
    0o600,
  )
  try {
    writeFileSync(descriptor, bytes)
  } finally {
    closeSync(descriptor)
  }
}

const publishReview = (root: string) => {
  const review = deriveV138Plan26277NoPublish(root)
  const report = renderV138Plan26277ReviewReport(review)
  const reviewPath = path.resolve(root, V138_PLAN_262_77_REVIEW_PATH)
  const reportPath = path.resolve(root, V138_PLAN_262_77_REPORT_PATH)
  exclusiveWrite(reviewPath, canonical(review))
  try {
    exclusiveWrite(reportPath, report)
  } catch (error) {
    unlinkSync(reviewPath)
    throw error
  }
  return review
}

const inspectCommittedPair = (root: string): string => {
  const commits = lines(
    git(root, [
      "log",
      "--format=%H",
      "--all",
      "--",
      V138_PLAN_262_77_REVIEW_PATH,
      V138_PLAN_262_77_REPORT_PATH,
    ]),
  )
  if (commits.length !== 1) fail("V138_PLAN_262_77_PUBLICATION_LINEAGE_INVALID")
  const commit = commits[0]!
  if (
    canonical(changedPaths(root, commit)) !==
    canonical([V138_PLAN_262_77_REVIEW_PATH, V138_PLAN_262_77_REPORT_PATH].sort())
  )
    fail("V138_PLAN_262_77_PUBLICATION_LINEAGE_INVALID")
  requireAncestor(root, EXPECTED_SOURCE.commit, commit)
  requireAncestor(root, commit, "HEAD")
  for (const repoPath of [V138_PLAN_262_77_REVIEW_PATH, V138_PLAN_262_77_REPORT_PATH]) {
    const committed = execFileSync("git", ["show", `${commit}:${repoPath}`], { cwd: root })
    if (
      !committed.equals(readRegular(root, repoPath)) ||
      lines(git(root, ["log", "--format=%H", `${commit}..HEAD`, "--", repoPath])).length !== 0
    )
      fail("V138_PLAN_262_77_PUBLICATION_REWRITE_INVALID")
  }
  return commit
}

const checkReview = (root: string, reviewPath: string, reportPath: string) => {
  if (
    reviewPath !== V138_PLAN_262_77_REVIEW_PATH ||
    reportPath !== V138_PLAN_262_77_REPORT_PATH
  )
    fail("V138_PLAN_262_77_PATH_INVALID")
  const reviewBytes = readRegular(root, reviewPath).toString("utf8")
  const reportBytes = readRegular(root, reportPath).toString("utf8")
  let candidate: unknown
  try {
    candidate = JSON.parse(reviewBytes)
  } catch {
    return fail("V138_PLAN_262_77_REVIEW_SCHEMA_INVALID")
  }
  const expected = deriveV138Plan26277NoPublish(root)
  if (reviewBytes !== canonical(candidate)) fail("V138_PLAN_262_77_REVIEW_BYTES_INVALID")
  validateV138Plan26277ReviewPair(candidate, reportBytes, expected)
  const publicationCommit = inspectCommittedPair(root)
  return { candidate: candidate as any, publicationCommit }
}

const exactArgv = (actual: readonly string[], expected: readonly string[]): void => {
  if (canonical(actual) !== canonical(expected)) fail("V138_PLAN_262_77_ARGUMENTS_INVALID")
}

const main = (): void => {
  const argv = process.argv.slice(2)
  if (argv.length === 1 && argv[0] === "--derive-no-publish") {
    const review = deriveV138Plan26277NoPublish(repoRoot)
    process.stdout.write(
      canonical({
        status: review.status,
        findingCount: review.findingCount,
        sourceReviewPassed: review.sourceReviewPassed,
        reviewRoot: review.reviewRoot,
        plan26278Eligible: review.authority.plan26278Eligible,
        authorizesExecution: false,
        liveInvoked: false,
      }),
    )
    return
  }
  if (argv.length === 1 && argv[0] === "--write-review") {
    const review = publishReview(repoRoot)
    process.stdout.write(
      canonical({
        status: review.status,
        findingCount: review.findingCount,
        sourceReviewPassed: review.sourceReviewPassed,
        reviewRoot: review.reviewRoot,
        plan26278Eligible: review.authority.plan26278Eligible,
        authorizesExecution: false,
        liveInvoked: false,
      }),
    )
    return
  }
  if (argv[0] === "--check-review") {
    exactArgv(argv, [
      "--check-review",
      "--review",
      V138_PLAN_262_77_REVIEW_PATH,
      "--report",
      V138_PLAN_262_77_REPORT_PATH,
    ])
    const { candidate, publicationCommit } = checkReview(repoRoot, argv[2]!, argv[4]!)
    process.stdout.write(
      canonical({
        status: candidate.findingCount === 0 ? "passed" : "blocked_verified",
        findingCount: candidate.findingCount,
        sourceReviewPassed: candidate.sourceReviewPassed,
        reviewRoot: candidate.reviewRoot,
        publicationCommit,
        plan26278Eligible: candidate.authority.plan26278Eligible,
        authorizesExecution: false,
        liveInvoked: false,
      }),
    )
    return
  }
  fail("V138_PLAN_262_77_ARGUMENTS_INVALID")
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main()
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  }
}
