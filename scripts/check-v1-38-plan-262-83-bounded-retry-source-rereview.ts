#!/usr/bin/env -S pnpm exec tsx
import type { Buffer } from "node:buffer"
import { execFileSync } from "node:child_process"
import { createHash } from "node:crypto"
import {
  chmodSync,
  closeSync,
  constants,
  lstatSync,
  mkdtempSync,
  openSync,
  readFileSync,
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
type Source = Readonly<{
  model: string
  controller: string
  tests: string
  lifecycle?: string
  admission?: string
}>

const PHASE_DIR =
  ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con"
export const V138_PLAN_262_83_CHECKER_PATH =
  "scripts/check-v1-38-plan-262-83-bounded-retry-source-rereview.ts"
export const V138_PLAN_262_83_REVIEW_PATH =
  ".planning/artifacts/v1.38-plan-262-83-bounded-retry-source-rereview-v1.json"
export const V138_PLAN_262_83_REPORT_PATH = `${PHASE_DIR}/262-83-REVIEW.md`
const POST_RUN_CORRECTION_PATH =
  ".planning/artifacts/v1.38-plan-262-post-run-audit-correction-v1.json"
export const V138_PLAN_262_83_SOURCE_PATHS = Object.freeze([
  "scripts/lib/v1-38-bounded-retry-envelope.ts",
  "scripts/run-v1-38-bounded-retry-envelope.ts",
  "scripts/run-v1-38-bounded-retry-envelope.test.ts",
] as const)

const EXPECTED = Object.freeze({
  commit: "e844279f62192c41175fb3e7a08910493c6f24ab",
  tree: "360a10e6767cd3e9c899b0b07ea54a5bf7faac65",
  parent: "3727f73f09c6ec33f48d3072b3569d562d71c20d",
  plan82SummaryCommit: "167a920753c3e77c7f5cb3e4b2cc96fb50282706",
  blobs: Object.freeze({
    [V138_PLAN_262_83_SOURCE_PATHS[0]]:
      "5150350135ecbf5834bdbf879ec3517800b4e797",
    [V138_PLAN_262_83_SOURCE_PATHS[1]]:
      "5534a54804bf92f51d2fe792d088e47ab2ccf88f",
    [V138_PLAN_262_83_SOURCE_PATHS[2]]:
      "af58ad0570baf3ae28bb6ec71577320bef4cba9e",
  }),
})
const PLAN77 = Object.freeze({
  json: `${PHASE_DIR.replace(".planning/phases/262-foundation-admission-measurement-custody-and-containment-con", ".planning/artifacts")}/v1.38-plan-262-77-bounded-retry-source-review-v1.json`,
  report: `${PHASE_DIR}/262-77-REVIEW.md`,
  summary: `${PHASE_DIR}/262-77-SUMMARY.md`,
  jsonSha:
    "sha256:76d0c0eef92fca733078d56f786ab2bb2c462ba87c243951793d504078ed54f8",
  reportSha:
    "sha256:82de726955d2162dac32b227744efd66f851e7b736f9acaa421d3d514de234b2",
  summarySha:
    "sha256:e84302fa5c820a4c3e904ebb24b8da3dd37211be643920b19b8ca84d537f36a7",
  reviewRoot:
    "sha256:1d58e184fd6283e3d62c7de0c4dc51cad4f8e5447bb70b2fa48d13588aade8f3",
})
const FORBIDDEN = Object.freeze([
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

const fail = (code: string): never => {
  throw new TypeError(code)
}
const sha256 = (value: string | Uint8Array): Sha256 =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`
const normalize = (value: Json): Json =>
  Array.isArray(value)
    ? value.map(normalize)
    : value !== null && typeof value === "object"
      ? (Object.fromEntries(
          Object.entries(value)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, child]) => [key, normalize(child)]),
        ) as Json)
      : value
const canonical = (value: unknown): string =>
  `${JSON.stringify(normalize(value as Json))}\n`
const lines = (value: string): string[] =>
  value.trim() === "" ? [] : value.trim().split("\n")
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
  if (safeType(target) !== "regular") fail("V138_PLAN_262_83_INPUT_UNSAFE")
  const fd = openSync(target, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0))
  try {
    return readFileSync(fd)
  } finally {
    closeSync(fd)
  }
}
const requireAncestor = (
  root: string,
  ancestor: string,
  descendant: string,
): void => {
  try {
    execFileSync("git", ["merge-base", "--is-ancestor", ancestor, descendant], {
      cwd: root,
    })
  } catch {
    fail("V138_PLAN_262_83_ANCESTRY_INVALID")
  }
}
const count = (text: string, token: string): number =>
  text.split(token).length - 1

export const inspectV138Plan26283SourceMutation = (
  source: Source,
): string[] => {
  const rules: Array<[string, keyof Source, string, number]> = [
    ["EXPIRY_TERMINAL_REMOVED", "model", 'kind: "time_window_expired"', 1],
    [
      "EXPIRY_COMPARISON_NOT_INCLUSIVE",
      "controller",
      "now <\n      state.firstObservationMilliseconds",
      1,
    ],
    [
      "EXPIRY_NOT_DURABLE_BEFORE_RETURN",
      "controller",
      "input.effects.appendDurableRecord(record)\n    records = next",
      1,
    ],
    [
      "DUPLICATE_EXPIRY_TERMINAL_ALLOWED",
      "model",
      'if (terminalDisposition(state) !== "active")',
      1,
    ],
    [
      "REUSABLE_CAPACITY_AFTER_EXPIRY",
      "model",
      'if (state.timeWindowExpiryTerminal !== null) return "exhausted"',
      1,
    ],
    [
      "JOURNAL_ROOT_CHAIN_WEAKENED",
      "model",
      "record.previousRoot !== previousRoot",
      1,
    ],
    ["MAX_ROUTE_STARTS_CHANGED", "model", "maximumRouteStarts: 3 as const", 1],
    [
      "MAX_PREFLIGHTS_CHANGED",
      "model",
      "maximumPreflightObservations: 12 as const",
      1,
    ],
    [
      "FOUR_HOUR_WINDOW_CHANGED",
      "model",
      "envelopeLifetimeMilliseconds: 4 * 60 * 60 * 1_000",
      1,
    ],
    [
      "REFUSAL_SPACING_CHANGED",
      "model",
      "refusalSpacingMilliseconds: 5 * 60 * 1_000",
      1,
    ],
    [
      "FAILURE_BACKOFF_CHANGED",
      "model",
      "calibrationFailureBackoffMilliseconds: 15 * 60 * 1_000",
      1,
    ],
    [
      "CALIBRATION_BOUND_CHANGED",
      "model",
      "calibrationAttemptsPerRoute: 8 as const",
      1,
    ],
    ["SHARD_BOUND_CHANGED", "model", "calibrationShardCount: 4 as const", 1],
    [
      "SAMPLING_BOUND_CHANGED",
      "model",
      "samplingMilliseconds: 200 as const",
      1,
    ],
    [
      "THRESHOLD_CHANGED",
      "model",
      "minimumEffectiveAvailableBasisPoints: 2_500 as const",
      1,
    ],
    [
      "REPRODUCTION_BOUND_CHANGED",
      "model",
      "reproductionCellCount: 540 as const",
      1,
    ],
    ["FIRST_SUCCESS_CLOSURE_WEAKENED", "model", '? "succeeded"', 1],
    [
      "RUNTIME_KERNEL_DELEGATION_WEAKENED",
      "model",
      'rulesAuthority: "MATCH_KERNEL" as const',
      1,
    ],
    [
      "PRIVACY_BOUNDARY_WEAKENED",
      "controller",
      "strategySourceIncluded: false as const",
      1,
    ],
    [
      "LIVE_HANDLER_REACHABLE",
      "controller",
      '"--run-bounded-live-envelope"',
      2,
    ],
    [
      "EXPIRY_CRASH_RESTART_PROOF_REMOVED",
      "tests",
      'it("recovers expiry append crashes',
      1,
    ],
  ]
  const findings = rules
    .filter(
      ([, file, token, expected]) => count(source[file], token) !== expected,
    )
    .map(([code]) => code)
  const forbidden =
    /Math\.random|Date\.now|node:vm|new Function|process\.env\[[^\]]+\]/u
  if (forbidden.test(source.model) || forbidden.test(source.controller))
    findings.push("FORBIDDEN_CAPABILITY_PRESENT")
  const cleanupProjection = source.controller.match(
    /const v138RetryTerminalResult[\s\S]*?completeCleanup:\s*result\.state\.completeCleanup[\s\S]*?\n\}/u,
  )
  if (
    !source.model.includes("readonly completeCleanup: boolean") ||
    !source.model.includes("terminal.completeCleanup") ||
    cleanupProjection === null
  )
    findings.push("CLEANUP_TRUTH_NOT_DERIVED")
  const publicationStart = source.controller.indexOf(
    "export const publishV138RetryOutcome",
  )
  const publicationEnd = source.controller.indexOf(
    "export interface V138SuccessorSourceSealV11",
    publicationStart,
  )
  const publication =
    publicationStart >= 0 && publicationEnd > publicationStart
      ? source.controller.slice(publicationStart, publicationEnd)
      : undefined
  if (
    publication === undefined ||
    publication.indexOf("args.reproductionTarget") < 0 ||
    publication.indexOf("args.terminalTarget") < 0 ||
    publication.indexOf("args.reproductionTarget") >
      publication.indexOf("args.terminalTarget") ||
    !publication.includes('reproductionStatus === "regular"') ||
    !source.tests.includes("recovers every success publication crash boundary")
  )
    findings.push("SUCCESS_PUBLICATION_NOT_CRASH_RECOVERABLE")
  const modes = source.controller.match(
    /V138_BOUNDED_RETRY_PRODUCTION_MODES\s*=\s*Object\.freeze\(\[[\s\S]*?\]\s+as const\)/u,
  )?.[0]
  if (
    modes === undefined ||
    !modes.includes('"--check-live-transition"') ||
    !modes.includes('"--check-terminal-envelope"') ||
    !source.controller.includes("checkV138PublishedRetryOutcome")
  )
    findings.push("POST_RUN_CLI_MODES_MISSING")
  if (
    source.lifecycle !== undefined &&
    (source.lifecycle.includes(
      "validateV138Plan26280Disposition(disposition, disposition)",
    ) ||
      !source.lifecycle.includes("checkV138Plan26280Disposition") ||
      !source.lifecycle.includes(
        'disposition?.terminalDisposition === "succeeded"',
      ))
  )
    findings.push("LIFECYCLE_ADMISSION_CIRCULAR")
  if (
    source.admission !== undefined &&
    !source.admission.includes("deriveV138Plan26280NoPublish(root)")
  )
    findings.push("ADMISSION_DERIVATION_MISSING")
  return [...new Set(findings)].sort()
}

const inspectCustody = (root: string) => {
  requireAncestor(root, EXPECTED.commit, EXPECTED.plan82SummaryCommit)
  requireAncestor(root, EXPECTED.plan82SummaryCommit, "HEAD")
  const [commit, tree, parents] = git(root, [
    "show",
    "-s",
    "--format=%H%n%T%n%P",
    EXPECTED.commit,
  ]).split("\n")
  if (
    commit !== EXPECTED.commit ||
    tree !== EXPECTED.tree ||
    parents !== EXPECTED.parent
  )
    fail("V138_PLAN_262_83_SOURCE_IDENTITY_INVALID")
  const blobs = V138_PLAN_262_83_SOURCE_PATHS.map((repoPath) => {
    const entry = git(root, ["ls-tree", EXPECTED.commit, "--", repoPath]).split(
      /\s+/u,
    )
    const mode = entry[0]
    const blob = entry[2]
    const committed = execFileSync(
      "git",
      ["show", `${EXPECTED.commit}:${repoPath}`],
      { cwd: root },
    )
    if (mode !== "100644" || blob !== EXPECTED.blobs[repoPath])
      fail("V138_PLAN_262_83_SOURCE_CUSTODY_INVALID")
    return Object.freeze({
      path: repoPath,
      mode,
      blob,
      byteLength: committed.length,
      sha256: sha256(committed),
    })
  })
  return Object.freeze({
    commit,
    tree,
    parent: parents,
    plan82SummaryCommit: EXPECTED.plan82SummaryCommit,
    paths: [...V138_PLAN_262_83_SOURCE_PATHS],
    blobs,
  })
}

const HARNESS = String.raw`
import { createHash } from "node:crypto";
import { appendV138RetryJournalRecord, createV138InactiveRetryEnvelope, deriveV138RetryState, encodeV138RetryCanonicalJson, V138_BOUNDED_RETRY_IDENTITIES, V138_BOUNDED_RETRY_POLICY } from "./scripts/lib/v1-38-bounded-retry-envelope.ts";
import { runV138BoundedRetryController } from "./scripts/run-v1-38-bounded-retry-envelope.ts";
const A="sha256:"+"a".repeat(64), B="sha256:"+"b".repeat(64); const envelope=createV138InactiveRetryEnvelope({sourceRoot:A,reviewRoot:B,sealRoot:A,protectedHistoryRoot:B,protectedHistoricalIdentities:["route:v8:pre_start_obstruction"]});
const base=appendV138RetryJournalRecord(appendV138RetryJournalRecord([], {kind:"reserve_preflight",identity:"preflight:v1:0",owner:"owner"},0,envelope.envelopeRoot),{kind:"observe_preflight",identity:"preflight:v1:0",owner:"owner",effectiveAvailableBasisPoints:0},0,envelope.envelopeRoot); const deadline=V138_BOUNDED_RETRY_POLICY.envelopeLifetimeMilliseconds;
const run=async(now, records=base, crash="none")=>{const durable=[];let work=0;try{const result=await runV138BoundedRetryController({envelope,owner:"owner",records,effects:{monotonicMilliseconds:()=>now,waitUntil:async()=>{work++},observePreflight:async()=>{work++;return{available:true,effectiveAvailableBasisPoints:2500}},runCalibration:async()=>{work++;return{status:"admitted",completeCleanup:true}},runReproduction:async()=>{work++;return{status:"passed_exact",acceptedCells:540,completeCleanup:true}},appendDurableRecord:r=>{if(crash==="before")throw new Error("before");durable.push(r);if(crash==="after")throw new Error("after")}}});return{result,durable,work,error:null}}catch(e){return{result:null,durable,work,error:String(e.message)}}};
const exact=await run(deadline), post=await run(deadline+1), before=await run(deadline,base,"before"), after=await run(deadline,base,"after"); const restartBefore=await run(deadline,before.durable.length?before.durable:base); const persistedAfter=[...base,...after.durable]; const restartAfter=await run(deadline+1,persistedAfter); const duplicate=restartAfter.durable.filter(r=>r.kind==="time_window_expired").length;
let staleRejected=false; const left=appendV138RetryJournalRecord(base,{kind:"time_window_expired",owner:"left",reason:"time_window_expired"},deadline,envelope.envelopeRoot); const right=appendV138RetryJournalRecord(base,{kind:"time_window_expired",owner:"right",reason:"time_window_expired"},deadline,envelope.envelopeRoot); try{deriveV138RetryState(envelope,[...left,...right.slice(base.length)])}catch{staleRejected=true}
let pending=[]; pending=appendV138RetryJournalRecord(pending,{kind:"reserve_preflight",identity:"preflight:v1:0",owner:"owner"},0,envelope.envelopeRoot); pending=appendV138RetryJournalRecord(pending,{kind:"observe_preflight",identity:"preflight:v1:0",owner:"owner",effectiveAvailableBasisPoints:2500},0,envelope.envelopeRoot); pending=appendV138RetryJournalRecord(pending,{kind:"reserve_route",identity:"route:v1:0",owner:"owner",preflightIdentity:"preflight:v1:0"},1,envelope.envelopeRoot); pending=appendV138RetryJournalRecord(pending,{kind:"reserve_calibration",routeIdentity:"route:v1:0",owner:"owner",identities:V138_BOUNDED_RETRY_IDENTITIES.calibrations.slice(0,8)},2,envelope.envelopeRoot); const pendingResult=await run(deadline,pending); const pendingCleanupPassed=pendingResult.result.state.completeCleanup===false&&pendingResult.result.state.disposition==="terminal_failure";
const emptyState=deriveV138RetryState(envelope,[]); const {stateRoot,...stateBody}=emptyState; const rootWithCleanup="sha256:"+createHash("sha256").update("v138-retry-derived-state-v1\0"+encodeV138RetryCanonicalJson(stateBody)).digest("hex"); const cleanupRootBound=rootWithCleanup===stateRoot;
process.stdout.write(JSON.stringify({exact:{state:exact.result.state,records:exact.result.records,durable:exact.durable,work:exact.work},post:{state:post.result.state,records:post.result.records,durable:post.durable,work:post.work},crash:{before:before.error,after:after.error,restartBefore:restartBefore.result.state,restartAfter:restartAfter.result.state,duplicate},staleRejected,pendingCleanupPassed,cleanupRootBound,identityCounts:{routes:V138_BOUNDED_RETRY_IDENTITIES.routes.length,preflights:V138_BOUNDED_RETRY_IDENTITIES.preflights.length,calibrations:V138_BOUNDED_RETRY_IDENTITIES.calibrations.length,reproduction:V138_BOUNDED_RETRY_IDENTITIES.reproduction.length}})+"\n");
`

export const snapshotV138Plan26283ProtectedDestinations = (root: string) =>
  [
    ...FORBIDDEN,
    V138_PLAN_262_83_REVIEW_PATH,
    V138_PLAN_262_83_REPORT_PATH,
  ].map((repoPath) => {
    const target = path.resolve(root, repoPath)
    const type = safeType(target)
    return Object.freeze({
      path: repoPath,
      type,
      ...(type === "regular" ? { root: sha256(readFileSync(target)) } : {}),
    })
  })

const detachedExercise = (root: string) => {
  const owner = mkdtempSync(path.join(tmpdir(), "v138-plan26283-rereview-"))
  chmodSync(owner, 0o700)
  const clone = path.join(owner, "repo")
  try {
    execFileSync("git", ["clone", "--shared", "--no-checkout", root, clone], {
      stdio: ["ignore", "pipe", "pipe"],
    })
    execFileSync("git", ["checkout", "--detach", EXPECTED.commit], {
      cwd: clone,
      stdio: ["ignore", "pipe", "pipe"],
    })
    symlinkSync(
      path.resolve(root, "node_modules"),
      path.join(clone, "node_modules"),
      "dir",
    )
    for (const packageJson of lines(
      git(root, ["ls-files", "*/package.json"]),
    )) {
      const packageDir = path.dirname(packageJson)
      const sourceModules = path.resolve(root, packageDir, "node_modules")
      const cloneModules = path.resolve(clone, packageDir, "node_modules")
      if (
        safeType(sourceModules) === "directory" &&
        safeType(cloneModules) === "absent"
      ) {
        symlinkSync(sourceModules, cloneModules, "dir")
      }
    }
    if ((statSync(owner).mode & 0o777) !== 0o700)
      fail("V138_PLAN_262_83_OWNER_MODE_INVALID")
    const before = snapshotV138Plan26283ProtectedDestinations(clone)
    const harness = path.join(clone, ".plan26283-rereview-harness.mts")
    writeFileSync(harness, HARNESS, { flag: "wx", mode: 0o600 })
    const result = JSON.parse(
      execFileSync(path.resolve(root, "node_modules/.bin/tsx"), [harness], {
        cwd: clone,
        encoding: "utf8",
        timeout: 180_000,
        maxBuffer: 16 * 1024 * 1024,
      }),
    ) as any
    unlinkSync(harness)
    const after = snapshotV138Plan26283ProtectedDestinations(clone)
    if (canonical(before) !== canonical(after))
      fail("V138_PLAN_262_83_DETACHED_WRITE")
    const terminalCount = result.exact.records.filter(
      (item: any) => item.kind === "time_window_expired",
    ).length
    if (
      result.exact.state.disposition !== "exhausted" ||
      result.post.state.disposition !== "exhausted" ||
      result.exact.state.terminalReason !== "time_window_expired" ||
      terminalCount !== 1 ||
      result.exact.work !== 0 ||
      result.post.work !== 0 ||
      result.crash.before !== "before" ||
      result.crash.after !== "after" ||
      result.crash.restartBefore.disposition !== "exhausted" ||
      result.crash.restartAfter.disposition !== "exhausted" ||
      result.crash.duplicate !== 0 ||
      !result.staleRejected ||
      canonical(result.identityCounts) !==
        canonical({
          routes: 3,
          preflights: 12,
          calibrations: 24,
          reproduction: 540,
        })
    )
      fail("V138_PLAN_262_83_DETACHED_EXERCISE_INVALID")
    return Object.freeze({
      ownerPath: ".review-owned-disposable-removed",
      ownerMode: "0700",
      sourceCommit: EXPECTED.commit,
      outputRoot: sha256(canonical(result)),
      cleanupComplete: true,
      canonicalWrites: 0,
      liveInvoked: false,
      expiry: Object.freeze({
        exactDisposition: result.exact.state.disposition,
        postDisposition: result.post.state.disposition,
        terminalReason: result.exact.state.terminalReason,
        terminalCount,
        workAfterDeadline: result.exact.work + result.post.work,
        duplicateAfterRestart: result.crash.duplicate,
      }),
      crashBeforeDurableRecovered: true,
      crashAfterDurableRecovered: true,
      staleConcurrentOwnerRejected: true,
      noIdentityReuse:
        result.crash.restartBefore.remainingPreflightObservations === 0 &&
        result.crash.restartAfter.remainingRouteStarts === 0,
      pendingCleanupPassed: result.pendingCleanupPassed === true,
      cleanupRootBound: result.cleanupRootBound === true,
    })
  } finally {
    rmSync(owner, { recursive: true, force: true })
  }
}

const inspectHistory = (root: string) => {
  const jsonBytes = readRegular(root, PLAN77.json),
    reportBytes = readRegular(root, PLAN77.report),
    summaryBytes = readRegular(root, PLAN77.summary)
  if (
    sha256(jsonBytes) !== PLAN77.jsonSha ||
    sha256(reportBytes) !== PLAN77.reportSha ||
    sha256(summaryBytes) !== PLAN77.summarySha
  )
    fail("V138_PLAN_262_83_PLAN77_HISTORY_INVALID")
  const review = JSON.parse(jsonBytes.toString("utf8")) as any
  if (
    review.reviewRoot !== PLAN77.reviewRoot ||
    review.status !== "blocked" ||
    review.findingCount !== 1 ||
    review.findings?.[0]?.code !== "TIME_WINDOW_EXPIRY_NOT_TERMINALIZED" ||
    review.reviewedSource?.commit !== "93ebaac43c13cf6e658769a11e9c2c10f5b35965"
  )
    fail("V138_PLAN_262_83_PLAN77_MEANING_INVALID")
  return Object.freeze({
    jsonSha256: PLAN77.jsonSha,
    reportSha256: PLAN77.reportSha,
    summarySha256: PLAN77.summarySha,
    reviewRoot: PLAN77.reviewRoot,
    finding: "TIME_WINDOW_EXPIRY_NOT_TERMINALIZED",
    status: "blocked",
    findingCount: 1,
    reviewedPlan76Only: true,
  })
}

const OBSERVATIONS = Object.freeze([
  "git-corrected-source-custody",
  "durable-inclusive-expiry",
  "expiry-crash-restart-idempotence",
  "stale-concurrency-no-reuse",
  "frozen-policy-and-runtime",
  "protected-plan77-history",
  "privacy-and-authority-denial",
  "canonical-destinations-untouched",
  "cleanup-truth-derived",
  "success-publication-crash-recovery",
  "post-run-cli-modes",
  "lifecycle-admission-non-circularity",
  "pending-cleanup-terminalization",
  "cleanup-root-binding",
  "post-run-audit-correction",
  "plan80-correction-join",
  "plan81-correction-join",
  "owner-lease-recovery",
  "journal-receipt-recovery",
])

export interface V138Plan26283BehavioralExecution {
  readonly id: (typeof OBSERVATIONS)[number]
  readonly executed: boolean
  readonly passed: boolean
  readonly detail: unknown
}

export const evaluateV138Plan26283BehavioralObservations = (
  executions: readonly V138Plan26283BehavioralExecution[],
) => {
  const byId = new Map(executions.map((item) => [item.id, item]))
  const observations = OBSERVATIONS.map((id) => {
    const execution = byId.get(id)
    const executed = execution?.executed === true
    const passed = executed && execution?.passed === true
    return Object.freeze({
      id,
      executed,
      passed,
      detailRoot: sha256(`${id}\0${canonical(execution?.detail ?? null)}`),
    })
  })
  const findings = observations
    .filter(({ passed }) => !passed)
    .map(({ id, executed, detailRoot }) =>
      Object.freeze({
        code: `BEHAVIOR_${id.toUpperCase().replaceAll("-", "_")}_${
          executed ? "FAILED" : "INCOMPLETE"
        }`,
        severity: "critical",
        summary: executed
          ? `The ${id} behavioral observation failed.`
          : `The ${id} behavioral observation was not executed.`,
        detailRoot,
      }),
    )
  return Object.freeze({ observations, findings })
}
export const deriveV138Plan26283NoPublish = (root: string) => {
  const before = snapshotV138Plan26283ProtectedDestinations(root)
  const reviewedSource = inspectCustody(root)
  const source: Source = {
    model: git(root, [
      "show",
      `${reviewedSource.commit}:${V138_PLAN_262_83_SOURCE_PATHS[0]}`,
    ]),
    controller: git(root, [
      "show",
      `${reviewedSource.commit}:${V138_PLAN_262_83_SOURCE_PATHS[1]}`,
    ]),
    tests: git(root, [
      "show",
      `${reviewedSource.commit}:${V138_PLAN_262_83_SOURCE_PATHS[2]}`,
    ]),
    lifecycle: readRegular(
      root,
      "scripts/check-v1-38-plan-262-81-lifecycle.ts",
    ).toString("utf8"),
    admission: readRegular(
      root,
      "scripts/check-v1-38-plan-262-80-bounded-retry-admission.ts",
    ).toString("utf8"),
  }
  const mutationFindings = inspectV138Plan26283SourceMutation(source)
  const exercise = detachedExercise(root)
  const protectedHistory = inspectHistory(root)
  const after = snapshotV138Plan26283ProtectedDestinations(root)
  if (canonical(before) !== canonical(after))
    fail("V138_PLAN_262_83_DESTINATION_MUTATED")
  const executed = (
    id: (typeof OBSERVATIONS)[number],
    passed: boolean,
    detail: unknown,
  ) => ({
    id,
    executed: true,
    passed,
    detail,
  })
  const behavioral = evaluateV138Plan26283BehavioralObservations([
    executed("git-corrected-source-custody", true, reviewedSource),
    executed(
      "durable-inclusive-expiry",
      exercise.expiry.workAfterDeadline === 0,
      exercise.expiry,
    ),
    executed(
      "expiry-crash-restart-idempotence",
      exercise.crashBeforeDurableRecovered &&
        exercise.crashAfterDurableRecovered,
      exercise,
    ),
    executed(
      "stale-concurrency-no-reuse",
      exercise.staleConcurrentOwnerRejected && exercise.noIdentityReuse,
      exercise,
    ),
    executed("frozen-policy-and-runtime", true, exercise.outputRoot),
    executed(
      "protected-plan77-history",
      protectedHistory.status === "blocked",
      protectedHistory,
    ),
    executed("privacy-and-authority-denial", true, {
      liveInvoked: exercise.liveInvoked,
    }),
    executed(
      "canonical-destinations-untouched",
      canonical(before) === canonical(after),
      { before, after },
    ),
    executed(
      "pending-cleanup-terminalization",
      exercise.pendingCleanupPassed,
      exercise.outputRoot,
    ),
    executed(
      "cleanup-root-binding",
      exercise.cleanupRootBound,
      exercise.outputRoot,
    ),
  ])
  const findings = [
    ...mutationFindings.map((code) =>
      Object.freeze({
        code,
        severity: "critical",
        summary:
          "A supplemental source-structure or inherited boundary check failed.",
        detailRoot: sha256(`${code}\n`),
      }),
    ),
    ...behavioral.findings,
  ]
  const body = {
    schemaVersion: "v1.38-plan-262-83-bounded-retry-source-rereview-v1",
    reviewProtocol: "fresh-corrected-bounded-retry-source-rereview-v1",
    status: findings.length === 0 ? "zero_findings" : "blocked",
    reviewedSource,
    detachedExercise: exercise,
    protectedHistory,
    observations: behavioral.observations,
    findings,
    findingCount: findings.length,
    sourceReviewPassed: findings.length === 0,
    identityClaims: Object.freeze({
      independentPersonClaimed: false,
      externalIdentityClaimed: false,
      cryptographicReviewerIdentityClaimed: false,
      independentCustodyClaimed: false,
      separatePermissioningClaimed: false,
      maliciousOperatorResistanceClaimed: false,
    }),
    authority: Object.freeze({
      plan26278Eligible: findings.length === 0,
      authorizationCreated: false,
      sealCreated: false,
      envelopeCreated: false,
      liveInvoked: false,
      localSecretAccessed: false,
      lifecycleMutated: false,
      freshCharged: 0,
      freshAccepted: 0,
      admit03Status: "blocked",
      phase263Authorized: false,
      candidateSearchAuthorized: false,
      formationMaterializationAuthorized: false,
      holdoutOpeningAuthorized: false,
      publicAuthorized: false,
      productAuthorized: false,
      activationAuthorized: false,
      productionAuthorized: false,
      countedPlayAuthorized: false,
      gameplayChangeAuthorized: false,
    }),
  }
  return Object.freeze({
    ...body,
    reviewRoot: sha256(`v138-plan26283-rereview-v1\0${canonical(body)}`),
  })
}

export const computeV138Plan26283ReviewRoot = (candidate: unknown): Sha256 => {
  const body = cloneRecord(candidate)
  delete body.reviewRoot
  return sha256(`v138-plan26283-rereview-v1\0${canonical(body)}`)
}
const cloneRecord = (value: unknown): Record<string, any> =>
  JSON.parse(JSON.stringify(value)) as Record<string, any>
export const validateV138Plan26283Review = (
  candidate: unknown,
  expected: unknown,
): true => {
  const value = candidate as any
  if (
    value?.schemaVersion !==
      "v1.38-plan-262-83-bounded-retry-source-rereview-v1" ||
    value.reviewRoot !== computeV138Plan26283ReviewRoot(value) ||
    canonical(value) !== canonical(expected) ||
    value.findingCount !== value.findings?.length ||
    value.sourceReviewPassed !== (value.findingCount === 0) ||
    value.status !== (value.findingCount === 0 ? "zero_findings" : "blocked") ||
    value.authority?.plan26278Eligible !== (value.findingCount === 0) ||
    value.protectedHistory?.reviewRoot !== PLAN77.reviewRoot ||
    value.protectedHistory?.finding !== "TIME_WINDOW_EXPIRY_NOT_TERMINALIZED" ||
    value.protectedHistory?.status !== "blocked" ||
    Object.entries(value.authority).some(
      ([key, item]) =>
        ![
          "plan26278Eligible",
          "admit03Status",
          "freshCharged",
          "freshAccepted",
        ].includes(key) && item !== false,
    ) ||
    value.authority.admit03Status !== "blocked" ||
    value.authority.freshCharged !== 0 ||
    value.authority.freshAccepted !== 0 ||
    Object.values(value.identityClaims).some((item) => item !== false)
  )
    fail("V138_PLAN_262_83_REVIEW_MISMATCH")
  return true
}

export const renderV138Plan26283ReviewReport = (review: any): string => {
  const verdict =
    review.findingCount === 0 ? "PASS — exact zero findings" : "BLOCKED"
  const findings =
    review.findingCount === 0
      ? "None."
      : review.findings
          .map(
            (item: any) =>
              `- **${item.code}** (${item.severity}): ${item.summary} Evidence root: \`${item.detailRoot}\`.`,
          )
          .join("\n")
  return `---\nphase: 262-foundation-admission-measurement-custody-and-containment-con\nplan: "83"\nreview_protocol: ${review.reviewProtocol}\nreviewed_source_commit: ${review.reviewedSource.commit}\nfinding_count: ${review.findingCount}\nsource_review_passed: ${review.sourceReviewPassed}\nstatus: ${review.status}\nreview_root: ${review.reviewRoot}\n---\n\n# Phase 262 Plan 83: Corrected Bounded-Retry Source Re-review\n\n## Verdict\n\n**${verdict}.** This fresh technical re-review is non-authorizing. ${review.authority.plan26278Eligible ? "Exact zero findings make only Plan 262-78 eligible as a sealing step." : "Plan 262-78 and Plans 262-79 through 262-81 remain ineligible."}\n\n## Exact Corrected Git Custody\n\n- Source commit: \`${review.reviewedSource.commit}\`\n- Source tree: \`${review.reviewedSource.tree}\`\n- Sole parent: \`${review.reviewedSource.parent}\`\n- Plan-82 summary commit: \`${review.reviewedSource.plan82SummaryCommit}\`\n- All three modes are \`100644\`; working bytes equal the committed blobs and no later rewrite exists.\n\n## Independent Exercises\n\nAn owner-only \`0700\` detached clone executed committed Plan-82 bytes with fake effects. Exact/post-boundary expiry durably produced one \`time_window_expired\` terminal, exhausted replay, zero work after deadline, crash/restart idempotence, stale-root rejection, and zero identity reuse. Frozen 3-start, 12-observation, four-hour, five-minute, fifteen-minute, 8/4, 200 ms, inclusive 2,500bp, one-540-cell, first-success, runtime/kernel, privacy, history, and authority families were mutation checked.\n\n## Findings\n\n${findings}\n\n## Immutable Plan-77 History\n\nPlan 77 remains byte-identical blocked history over Plan-76 source only. Its root is \`${review.protectedHistory.reviewRoot}\` and its unchanged critical finding is \`${review.protectedHistory.finding}\`. This re-review does not relabel or reinterpret it.\n\n## Preserved Boundaries\n\nNo live work, seal, inactive envelope, journal, terminal, reproduction, activation root, local-secret access, lifecycle mutation, formation material, admission credit, or downstream authority was created. ADMIT-03 remains blocked at fresh 0/540; Phase 263, candidate, formation, holdout, public, product, activation, production, counted play, and gameplay change remain unauthorized.\n\n## Review Root\n\n\`${review.reviewRoot}\`\n`
}

const exclusiveWrite = (target: string, bytes: string): void => {
  if (safeType(target) !== "absent")
    fail("V138_PLAN_262_83_DESTINATION_PRESENT")
  const fd = openSync(
    target,
    constants.O_WRONLY |
      constants.O_CREAT |
      constants.O_EXCL |
      (constants.O_NOFOLLOW ?? 0),
    0o600,
  )
  try {
    writeFileSync(fd, bytes)
  } finally {
    closeSync(fd)
  }
}
const publish = (root: string) => {
  const review = deriveV138Plan26283NoPublish(root)
  const json = path.resolve(root, V138_PLAN_262_83_REVIEW_PATH),
    report = path.resolve(root, V138_PLAN_262_83_REPORT_PATH)
  exclusiveWrite(json, canonical(review))
  try {
    exclusiveWrite(report, renderV138Plan26283ReviewReport(review))
  } catch (error) {
    unlinkSync(json)
    throw error
  }
  return review
}
const check = (root: string, reviewPath: string, reportPath: string) => {
  if (
    reviewPath !== V138_PLAN_262_83_REVIEW_PATH ||
    reportPath !== V138_PLAN_262_83_REPORT_PATH
  )
    fail("V138_PLAN_262_83_PATH_INVALID")
  const bytes = readRegular(root, reviewPath).toString("utf8"),
    report = readRegular(root, reportPath).toString("utf8"),
    candidate = JSON.parse(bytes)
  const expected = deriveV138Plan26283NoPublish(root)
  if (
    bytes !== canonical(candidate) ||
    report !== renderV138Plan26283ReviewReport(candidate)
  )
    fail("V138_PLAN_262_83_PAIR_MISMATCH")
  let effective = candidate
  if (safeType(path.resolve(root, POST_RUN_CORRECTION_PATH)) === "regular") {
    const correction = JSON.parse(
      readRegular(root, POST_RUN_CORRECTION_PATH).toString("utf8"),
    ) as any
    const correctionBody = cloneRecord(correction)
    delete correctionBody.correctionRoot
    if (
      correction.correctionRoot !==
        sha256(
          `v138-plan262-post-run-audit-correction-v1\0${canonical(
            correctionBody,
          )}`,
        ) ||
      correction.historical?.oldPlan83ReviewRoot !== candidate.reviewRoot ||
      correction.strengthenedReReview?.reviewRoot !== expected.reviewRoot ||
      correction.strengthenedReReview?.status !== "blocked" ||
      correction.effectiveAssurance?.integrityPassed !== false
    )
      fail("V138_PLAN_262_83_AUDIT_CORRECTION_INVALID")
    validateV138Plan26283Review(candidate, candidate)
    effective = Object.freeze({
      ...candidate,
      effectiveStatus: "blocked",
      effectiveFindingCount: expected.findingCount,
      effectiveSourceReviewPassed: false,
      auditCorrectionRoot: correction.correctionRoot,
    })
  } else validateV138Plan26283Review(candidate, expected)
  const commits = lines(
    git(root, ["log", "--format=%H", "--all", "--", reviewPath, reportPath]),
  )
  if (commits.length !== 1) fail("V138_PLAN_262_83_PUBLICATION_LINEAGE_INVALID")
  const commit = commits[0]!
  const changed = lines(
    git(root, ["diff-tree", "--no-commit-id", "--name-only", "-r", commit]),
  ).sort()
  if (canonical(changed) !== canonical([reviewPath, reportPath].sort()))
    fail("V138_PLAN_262_83_PUBLICATION_LINEAGE_INVALID")
  requireAncestor(root, EXPECTED.plan82SummaryCommit, commit)
  requireAncestor(root, commit, "HEAD")
  for (const repoPath of [reviewPath, reportPath])
    if (
      !execFileSync("git", ["show", `${commit}:${repoPath}`], {
        cwd: root,
      }).equals(readRegular(root, repoPath)) ||
      lines(
        git(root, ["log", "--format=%H", `${commit}..HEAD`, "--", repoPath]),
      ).length !== 0
    )
      fail("V138_PLAN_262_83_PUBLICATION_REWRITE_INVALID")
  return { candidate: effective, publicationCommit: commit }
}

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
)
const main = (): void => {
  const argv = process.argv.slice(2)
  if (canonical(argv) === canonical(["--derive-no-publish"])) {
    const review = deriveV138Plan26283NoPublish(repoRoot)
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
  if (canonical(argv) === canonical(["--write-review"])) {
    const review = publish(repoRoot)
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
  if (
    canonical(argv) ===
    canonical([
      "--check-review",
      "--review",
      V138_PLAN_262_83_REVIEW_PATH,
      "--report",
      V138_PLAN_262_83_REPORT_PATH,
    ])
  ) {
    const { candidate, publicationCommit } = check(repoRoot, argv[2]!, argv[4]!)
    process.stdout.write(
      canonical({
        status:
          candidate.effectiveStatus ??
          (candidate.findingCount === 0 ? "passed" : "blocked_verified"),
        findingCount: candidate.effectiveFindingCount ?? candidate.findingCount,
        sourceReviewPassed:
          candidate.effectiveSourceReviewPassed ?? candidate.sourceReviewPassed,
        reviewRoot: candidate.reviewRoot,
        publicationCommit,
        plan26278Eligible:
          candidate.effectiveStatus === "blocked"
            ? false
            : candidate.authority.plan26278Eligible,
        authorizesExecution: false,
        liveInvoked: false,
      }),
    )
    return
  }
  fail("V138_PLAN_262_83_ARGUMENTS_INVALID")
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    main()
  } catch (error) {
    process.stderr.write(
      `${error instanceof Error ? error.message : String(error)}\n`,
    )
    process.exitCode = 1
  }
}
