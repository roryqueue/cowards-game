import { execFileSync, spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import {
  observeV138Plan112LiveV9Custody,
} from "./check-v1-38-plan-262-112-live-v9-custody-v1.js"

type Sha = `sha256:${string}`
export type V138Plan112V2Finding = Readonly<{
  code: string
  severity: "critical" | "warning"
  detail: string
}>
type ModeResult = Readonly<{
  modeNames: readonly string[]
  actualModesPassed: number
  producerCalls: 0
  liveInvoked: false
  freshCharged: 0
  freshAccepted: 0
  observations: readonly Readonly<{ mode: string; status: string; root: Sha }>[]
  findings: readonly V138Plan112V2Finding[]
  observationRoot: Sha
}>

const PHASE = ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con"
const V2_PATHS = Object.freeze({
  payload: ".planning/artifacts/v1.38-plan-262-112-live-v9-custody-review-payload-v2.json",
  review: `${PHASE}/262-112-REVIEW-FIX.md`,
  carrier: ".planning/artifacts/v1.38-plan-262-112-live-v9-custody-review-carrier-v2.json",
})
const V1_PUBLICATION = "29d4cf5c942d63fd767f658ec2506a5764ff19fa"
const SUPPLEMENT = ".planning/artifacts/v1.38-successor-source-seal-v13-executable-custody-supplement-v2.json"
const sha = (value: string | Uint8Array): Sha =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`
const canonical = (value: unknown): string => {
  const normalize = (item: unknown): unknown => Array.isArray(item)
    ? item.map(normalize)
    : item !== null && typeof item === "object"
      ? Object.fromEntries(Object.entries(item as Record<string, unknown>)
          .sort(([a], [b]) => a.localeCompare(b)).map(([key, child]) => [key, normalize(child)]))
      : item
  return `${JSON.stringify(normalize(value))}\n`
}
const fail = (code: string): never => { throw new TypeError(code) }
const rootCache = new Map<string, ReturnType<typeof observeV138Plan112LiveV9Custody>>()
const foundation = (root: string) => {
  const resolved = path.resolve(root)
  const cached = rootCache.get(resolved)
  if (cached) return cached
  const observed = observeV138Plan112LiveV9Custody(resolved)
  const payloadKeys = [
    "actualModesPassed", "authorizesExecution", "checkoutPaths", "correctedCarrierRoot",
    "correctedPayloadRoot", "correctedPublicationCommit", "correctedReviewRoot",
    "downstreamAuthority", "findingCodes", "findingCount", "findingRoot", "freshAccepted",
    "freshCharged", "fullExecutionClosureRoot", "installedClosureRoot", "liveInvoked",
    "nativeSourcesRoot", "nodeSha256", "pairCommit", "pathnameLaunchReplacementResistanceClaimed",
    "payloadRoot", "plan109Eligible", "plan93StopCommit", "plan93StopSha256",
    "pnpmDistributionSha256", "portableClosureRoot", "producerIncapableObservations",
    "protectedHistoryRoot", "rawByteManifestRoot", "recursiveDependencyCount",
    "recursiveDependencyRoot", "retryEnvelopeRoot", "reviewedSourceCommit",
    "reviewedSourceParent", "reviewedSourceTree", "reviewStatus", "schemaVersion", "sourceSealRoot",
  ].sort()
  if (canonical(Object.keys(observed.payload).sort()) !== canonical(payloadKeys) ||
      observed.payload.findingCount !== 0 || observed.payload.actualModesPassed !== 6 ||
      observed.payload.producerIncapableObservations !== 1 || observed.payload.liveInvoked !== false ||
      observed.payload.freshCharged !== 0 || observed.payload.freshAccepted !== 0 ||
      observed.payload.plan109Eligible !== true || observed.payload.authorizesExecution !== false ||
      observed.payload.downstreamAuthority !== "denied")
    fail("V138_PLAN112_V2_FOUNDATION_SEMANTICS_INVALID")
  rootCache.set(resolved, observed)
  return observed
}

const run = (executable: string, args: readonly string[], cwd: string, home: string): string =>
  execFileSync(executable, args as string[], {
    cwd,
    encoding: "utf8",
    env: {
      PATH: process.env.PATH ?? "/usr/bin:/bin",
      HOME: home,
      LANG: "C",
      LC_ALL: "C",
    },
    stdio: ["ignore", "pipe", "pipe"],
  }).trim()
const modeObservation = (mode: string, status: string, value: unknown) => Object.freeze({
  mode,
  status,
  root: sha(`v138-plan-262-112-v2-mode-observation-v1\0${canonical(value)}`),
})

export const executeV138Plan112V2DisposableModes = (repoRootInput: string): ModeResult => {
  const repoRoot = path.resolve(repoRootInput)
  const base = foundation(repoRoot)
  const owner = mkdtempSync(path.join(tmpdir(), "v138-plan112-v2-"))
  const clone = path.join(owner, "repo")
  let worktreeAdded = false
  try {
    run("/usr/bin/git", ["worktree", "add", "--quiet", "--detach", clone, "HEAD"], repoRoot, owner)
    worktreeAdded = true
    symlinkSync(path.join(repoRoot, "node_modules"), path.join(clone, "node_modules"), "dir")
    for (const workspace of [
      "apps/runtime-service", "apps/web", "apps/worker", "packages/engine",
      "packages/golden", "packages/map-configs", "packages/persistence", "packages/replay",
      "packages/runtime-js", "packages/runtime-python", "packages/runtime-supervisor",
      "packages/runtime-wasm-wasi", "packages/service", "packages/spec", "packages/test-utils",
    ]) {
      const sourceModules = path.join(repoRoot, workspace, "node_modules")
      if (!existsSync(sourceModules)) continue
      const destinationModules = path.join(clone, workspace, "node_modules")
      mkdirSync(path.dirname(destinationModules), { recursive: true })
      symlinkSync(sourceModules, destinationModules, "dir")
    }
    const tsx = path.join(clone, "node_modules", ".bin", "tsx")
    const live = "scripts/run-v1-38-bounded-retry-envelope-v3-live-v9.ts"
    const observations: Array<ReturnType<typeof modeObservation>> = []
    const findings: V138Plan112V2Finding[] = []
    const parseCli = (mode: string, expectedStatus: string, findingCode: string) => {
      const result = spawnSync(tsx, [live, mode], {
        cwd: clone,
        encoding: "utf8",
        env: { PATH: process.env.PATH ?? "/usr/bin:/bin", HOME: owner, LANG: "C", LC_ALL: "C" },
        stdio: ["ignore", "pipe", "pipe"],
      })
      if (result.error || result.status === null) fail(`V138_PLAN112_V2_MODE_PROCESS_INTEGRITY:${mode}`)
      if (result.status !== 0) {
        const detail = result.stderr.trim() || `exit:${String(result.status)}`
        findings.push({ code: findingCode, severity: "critical", detail })
        observations.push(modeObservation(mode, "failed", { detail }))
        return undefined
      }
      const value = JSON.parse(result.stdout.trim()) as Record<string, unknown>
      if (value.status !== expectedStatus) {
        findings.push({ code: findingCode, severity: "critical", detail: `status:${String(value.status)}` })
        observations.push(modeObservation(mode, "failed", value))
        return undefined
      }
      observations.push(modeObservation(mode, expectedStatus, value))
      return value
    }
    const source = parseCli("--check-source-only", "source_only_checked", "MODE_SOURCE_ONLY_FAILED")
    if (source !== undefined && (source.liveInvoked !== false ||
        source.freshCharged !== 0 || source.freshAccepted !== 0))
      fail("V138_PLAN112_V2_SOURCE_MODE_INVALID")
    const prospective = parseCli("--check-prospective-custody", "prospective_custody_checked", "MODE_PROSPECTIVE_CUSTODY_FAILED")
    if (prospective !== undefined && (
        prospective.producerWouldInvoke !== true || prospective.liveInvoked !== false))
      fail("V138_PLAN112_V2_PROSPECTIVE_MODE_INVALID")

    const { supplementRoot: _oldRoot, plan112PublicationCommit: _oldCommit, ...supplementRest } = base.supplement
    const supplementBody = { ...supplementRest, plan112PublicationCommit: V1_PUBLICATION }
    const supplement = {
      ...supplementBody,
      supplementRoot: sha(`v138-successor-source-seal-v13-executable-custody-supplement-v2\0${canonical(supplementBody)}`),
    }
    writeFileSync(path.join(clone, SUPPLEMENT), canonical(supplement), { mode: 0o644, flag: "wx" })
    run("/usr/bin/git", ["add", "--", SUPPLEMENT], clone, owner)
    run("/usr/bin/git", ["-c", "user.name=Plan 112 V2", "-c", "user.email=plan112-v2@example.invalid", "commit", "--quiet", "-m", "disposable supplement"], clone, owner)
    const post = parseCli("--check-post-run-custody", "post_run_custody_checked", "MODE_POST_NO_EFFECT_FAILED")
    if (post !== undefined && post.liveInvoked !== false) fail("V138_PLAN112_V2_POST_MODE_INVALID")

    const runnerPath = path.join(clone, ".plan112-v2-mode-runner.ts")
    const runValueMode = (expression: string) => {
      const code = `import * as subject from './scripts/run-v1-38-bounded-retry-envelope-v3-live-v9.ts'; const value=${expression}; process.stdout.write(JSON.stringify(value));`
      writeFileSync(runnerPath, code, { mode: 0o600 })
      const value = JSON.parse(run(tsx, [runnerPath], clone, owner)) as Record<string, unknown>
      rmSync(runnerPath, { force: true })
      return value
    }
    const evalMode = (mode: string, expression: string, expectedStatus: string) => {
      const value = runValueMode(expression)
      if (value.status !== expectedStatus || value.downstreamAuthority !== "denied")
        fail(`V138_PLAN112_V2_VALUE_MODE_INVALID:${mode}`)
      observations.push(modeObservation(mode, expectedStatus, value))
    }
    evalMode("post_non_pass_value",
      "subject.checkV138LiveV9PostRunOutputCustodyForReview({journalPresent:true,privateDirectoryPresent:true,terminalPresent:true,lockPresent:false,reproductionPresent:false,adjudicationOrDownstreamPresent:false,outcome:{disposition:'exhausted',journalRoot:'sha256:'+'1'.repeat(64),stateRoot:'sha256:'+'2'.repeat(64),completeCleanup:true,reproductionPresent:false,downstreamAuthority:'denied'}})",
      "bounded_terminal")
    evalMode("post_success_value",
      "subject.checkV138LiveV9PostRunOutputCustodyForReview({journalPresent:true,privateDirectoryPresent:true,terminalPresent:true,lockPresent:false,reproductionPresent:true,adjudicationOrDownstreamPresent:false,outcome:{disposition:'succeeded',journalRoot:'sha256:'+'1'.repeat(64),stateRoot:'sha256:'+'2'.repeat(64),completeCleanup:true,reproductionPresent:true,downstreamAuthority:'denied'}})",
      "bounded_success")
    const reproductionExpression = `(()=>{const body={schemaVersion:'v1.38-current-matrix-reproduction-v17',status:'passed_exact',admittedCalibrationRoot:'sha256:'+'3'.repeat(64),chargedAttemptCount:540,acceptedCellCount:540,completeCleanup:true,executionRoot:'sha256:'+'4'.repeat(64),runtimeRoute:'v1.18/v1.19/MATCH_KERNEL',samplingMilliseconds:200,partialAcceptedEvidenceReusable:false,privacyProjection:{strategySourceIncluded:false,strategyMemoryIncluded:false,soldierMemoryIncluded:false,objectivePayloadIncluded:false,rawDiagnosticsIncluded:false},phase263PlanningAuthorized:false,candidateSearchAuthorized:false,formationMaterializationAuthorized:false,holdoutOpeningAuthorized:false,publicAuthorized:false,productAuthorized:false,productionAuthorized:false};const receiptRoot=subject.computeV138LiveV9ReproductionV17ReceiptRoot(body);const artifact={...body,receiptRoot};const journalRecords=[{kind:'finish_calibration',routeIdentity:'route:v3:0',owner:'owner',status:'admitted',completeCleanup:true,supervisionRoot:body.admittedCalibrationRoot},{kind:'finish_reproduction',routeIdentity:'route:v3:0',owner:'owner',status:'passed_exact',acceptedCells:540,completeCleanup:true,reproductionRoot:receiptRoot,recordRoot:'sha256:'+'5'.repeat(64)}];return subject.checkV138LiveV9ReproductionV17ForReview({artifact,journalRecords,outcome:{disposition:'succeeded',journalRoot:'sha256:'+'5'.repeat(64),stateRoot:'sha256:'+'6'.repeat(64),completeCleanup:true,reproductionPresent:true,downstreamAuthority:'denied'}})})()`
    const reproduction = runValueMode(`(()=>{const value=${reproductionExpression};return {...value,status:'exact_reproduction'}})()`)
    if (reproduction.acceptedCellCount !== 540 || reproduction.downstreamAuthority !== "denied")
      fail("V138_PLAN112_V2_REPRODUCTION_MODE_INVALID")
    observations.push(modeObservation("exact_reproduction_value", "exact_reproduction", reproduction))
    const modeNames = [
      "source_only_cli", "prospective_custody_cli", "post_no_effect_cli",
      "post_non_pass_value", "post_success_value", "exact_reproduction_value",
    ] as const
    const normalized = observations.map((item, index) => ({ ...item, mode: modeNames[index]! }))
    if (normalized.length !== 6) fail("V138_PLAN112_V2_MODE_COUNT_INVALID")
    return Object.freeze({
      modeNames, actualModesPassed: 6 - findings.length, producerCalls: 0, liveInvoked: false,
      freshCharged: 0, freshAccepted: 0, observations: Object.freeze(normalized),
      findings: Object.freeze([...findings].sort((a, b) => a.code.localeCompare(b.code))),
      observationRoot: sha(`v138-plan-262-112-v2-observations-v1\0${canonical(normalized)}`),
    })
  } finally {
    if (worktreeAdded) {
      try { run("/usr/bin/git", ["worktree", "remove", "--force", clone], repoRoot, owner) }
      catch { /* best-effort cleanup after the primary observation result */ }
    }
    rmSync(owner, { recursive: true, force: true })
  }
}

const findingRoot = (findings: readonly V138Plan112V2Finding[]) =>
  sha(`v138-plan-262-112-v2-findings-v1\0${canonical(findings)}`)
const payloadRoot = (body: Record<string, unknown>) =>
  sha(`v138-plan-262-112-live-v9-custody-review-payload-v2\0${canonical(body)}`)
const reviewRoot = (body: Record<string, unknown>) =>
  sha(`v138-plan-262-112-live-v9-custody-review-v2\0${canonical(body)}`)
const carrierRoot = (body: Record<string, unknown>) =>
  sha(`v138-plan-262-112-live-v9-custody-review-carrier-v2\0${canonical(body)}`)

export const renderV138Plan112V2EvidenceForReview = (
  repoRoot: string,
  inputFindings: readonly V138Plan112V2Finding[],
  modes?: ModeResult,
) => {
  const base = foundation(repoRoot)
  const findings = [...inputFindings].sort((a, b) =>
    `${a.code}\0${a.detail}`.localeCompare(`${b.code}\0${b.detail}`))
  const zero = findings.length === 0
  if (zero && modes === undefined) fail("V138_PLAN112_V2_ZERO_REQUIRES_EXECUTED_MODES")
  const fRoot = findingRoot(findings)
  const body = {
    schemaVersion: "v1.38-plan-262-112-live-v9-custody-review-payload-v2",
    supersedesPublicationCommit: V1_PUBLICATION,
    reviewedSourceCommit: base.payload.reviewedSourceCommit,
    reviewedSourceTree: base.payload.reviewedSourceTree,
    reviewedSourceParent: base.payload.reviewedSourceParent,
    fullExecutionClosureRoot: base.payload.fullExecutionClosureRoot,
    correctedPublicationCommit: base.payload.correctedPublicationCommit,
    correctedPayloadRoot: base.payload.correctedPayloadRoot,
    correctedReviewRoot: base.payload.correctedReviewRoot,
    correctedCarrierRoot: base.payload.correctedCarrierRoot,
    pairCommit: base.payload.pairCommit,
    sourceSealRoot: base.payload.sourceSealRoot,
    retryEnvelopeRoot: base.payload.retryEnvelopeRoot,
    protectedHistoryRoot: base.payload.protectedHistoryRoot,
    findingCount: findings.length,
    findingRoot: fRoot,
    findingCodes: findings.map(({ code }) => code),
    reviewStatus: zero ? "zero_findings" : "blocked",
    actualModesPassed: modes?.actualModesPassed ?? 0,
    observationRoot: modes?.observationRoot ?? null,
    producerIncapableObservations: modes?.actualModesPassed ?? 0,
    producerCalls: 0,
    liveInvoked: false,
    freshCharged: 0,
    freshAccepted: 0,
    plan109Eligible: zero && modes?.actualModesPassed === 6,
    authorizesExecution: false,
    downstreamAuthority: "denied",
  }
  const payload = Object.freeze({ ...body, payloadRoot: payloadRoot(body) })
  const rBody = {
    payloadRoot: payload.payloadRoot, findingRoot: fRoot, findingCount: findings.length,
    reviewStatus: payload.reviewStatus, actualModesPassed: payload.actualModesPassed,
    plan109Eligible: payload.plan109Eligible, authorizesExecution: false,
    downstreamAuthority: "denied",
  }
  const rRoot = reviewRoot(rBody)
  const verdict = zero ? "ZERO FINDINGS" : "BLOCKED"
  const reviewBytes = Buffer.from(`---\nphase: 262-foundation-admission-measurement-custody-and-containment-con\nplan: "112"\nreview_type: corrected_executed_live_v9_custody_v2\nstatus: ${payload.reviewStatus}\nfinding_count: ${findings.length}\nreview_root: ${rRoot}\nreviewed: 2026-08-28\n---\n\n# Phase 262 Plan 112 Corrected Executed Review\n\n## Verdict\n\n**${verdict}.** ${zero ? "All six producer-incapable observations passed." : `Finding codes: ${payload.findingCodes.join(", ")}.`}\n\n- Source commit: \`${payload.reviewedSourceCommit}\`\n- Full closure: \`${payload.fullExecutionClosureRoot}\`\n- Actual modes: ${payload.actualModesPassed}/6\n- Observation root: \`${String(payload.observationRoot)}\`\n- Finding root: \`${fRoot}\`\n- Payload root: \`${payload.payloadRoot}\`\n- Review root: \`${rRoot}\`\n\nPlan 109 eligibility: ${String(payload.plan109Eligible)}. This review authorizes no execution, supplement, route, capacity, reset, candidate, formation, holdout, public, product, production, counted play, gameplay change, archive, tag, or Phase 263 action. Downstream authority remains denied.\n`)
  const carrierBody = {
    schemaVersion: "v1.38-plan-262-112-live-v9-custody-review-carrier-v2",
    payloadPath: V2_PATHS.payload, reviewPath: V2_PATHS.review,
    payloadMode: "100644", reviewMode: "100644", carrierMode: "100644",
    payloadRoot: payload.payloadRoot, reviewRoot: rRoot,
    payloadSha256: sha(Buffer.from(canonical(payload))), reviewSha256: sha(reviewBytes),
    findingCount: findings.length, findingRoot: fRoot,
    plan109Eligible: payload.plan109Eligible, authorizesExecution: false,
    downstreamAuthority: "denied",
  }
  return Object.freeze({ payload, reviewBytes, reviewRoot: rRoot,
    carrier: Object.freeze({ ...carrierBody, carrierRoot: carrierRoot(carrierBody) }) })
}

const writeV2 = (root: string) => {
  const modes = executeV138Plan112V2DisposableModes(root)
  const evidence = renderV138Plan112V2EvidenceForReview(root, modes.findings, modes)
  for (const repoPath of Object.values(V2_PATHS)) {
    const absolute = path.join(root, repoPath)
    if (existsSync(absolute)) fail("V138_PLAN112_V2_PUBLICATION_PRESENT")
  }
  writeFileSync(path.join(root, V2_PATHS.payload), canonical(evidence.payload), { mode: 0o644, flag: "wx" })
  writeFileSync(path.join(root, V2_PATHS.review), evidence.reviewBytes, { mode: 0o644, flag: "wx" })
  writeFileSync(path.join(root, V2_PATHS.carrier), canonical(evidence.carrier), { mode: 0o644, flag: "wx" })
}

const execute = (args: readonly string[]) => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
  if (args.length !== 1) fail("V138_PLAN112_V2_ARGUMENTS_INVALID")
  if (args[0] === "--check-observations") {
    process.stdout.write(`${JSON.stringify(executeV138Plan112V2DisposableModes(root))}\n`); return
  }
  if (args[0] === "--write-review-v2") { writeV2(root); return }
  fail("V138_PLAN112_V2_ARGUMENTS_INVALID")
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try { execute(process.argv.slice(2)) }
  catch (error) { process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`); process.exitCode = 1 }
}
