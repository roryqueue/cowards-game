/* Private fixture-feasibility route; no public or counted-play authority. */
import { fork, execFileSync, spawnSync } from "node:child_process"
import { randomBytes, createHash } from "node:crypto"
import { existsSync, readFileSync, readdirSync } from "node:fs"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { CANONICAL_COMPATIBILITY_TUPLES, CURRENT_SEMANTIC_RUNTIME_ABI_VERSION, DEFAULT_RUNTIME_LIMITS } from "@cowards/spec"
import {
  LEAN_CONTAINER_IMAGE, LEAN_CLOSEOUT_PROFILE,
  LEAN_CONTAINER_METHOD_CEILINGS, LEAN_CONTAINER_STARTUP_CLEANUP_MARGIN_MS,
  createExclusiveLeanInvocationMarker, createSupervisedLeanExecutionDependencies,
  executePreparedLeanCell, runActualLeanContainerPreflight, runLeanFeasibilityInjected,
  deriveLeanContainerName, deriveLeanContainerOwnershipLabel,
  type LeanContainerPreflightInput, type LeanExecutionDependencies,
} from "./run-v1-38-lean-runner-feasibility.js"
import {
  buildLeanSchedule, hashLeanValue, LEAN_CURRENT_FORMATION_ROOT,
  deriveAndValidateLeanTerminal, type LeanTerminal, type LeanCell,
} from "./lib/v1-38-lean-runner-feasibility.js"

export const CLOSEOUT_PROFILE = LEAN_CLOSEOUT_PROFILE
const selectorPattern = /^--(retry-)?(describe-source|check-source|preflight|run|closeout-child|check-post-run|check-adjudication|check-tracking)$/u
export const resolveCloseoutSelector = (value: string) => {
  const match = selectorPattern.exec(value)
  if (!match) throw new TypeError("CLOSEOUT_SELECTOR")
  return { retry: match[1] !== undefined, selector: `--${match[2]}` }
}
const RETRY = selectorPattern.test(process.argv[2] ?? "") && resolveCloseoutSelector(process.argv[2]!).retry
export const closeoutPaths = (retry: boolean) => Object.freeze(Object.fromEntries([
  "source-review", "preflight-consumption", "preflight", "invocation", "terminal", "adjudication",
].map((name) => [name, `.planning/artifacts/v1.38-lean-closeout-${retry ? "retry-" : ""}${name}.json`]))) as Readonly<Record<string, string>>
export const CLOSEOUT_PATHS = closeoutPaths(RETRY)
export const RETRY_PREDECESSOR_ROOTS = Object.freeze({
  "source-review": "sha256:bdd3b2a5ec5fd05b6de31ee489e2f8e2481ae5dc33ce859de1cc50ce434c7b57",
  "preflight-consumption": "sha256:3c293d441edf72ca57490153c4f9786d41ce6759c247182c3296f233446aa594",
  preflight: "sha256:dd6d1eb77186c65fc56a25575c083496dcbf8a121de896964b3eed1509ce933d",
  adjudication: "sha256:3fc50498e74a69edfc031f919a0ea1ca8f2ca1933f9a7f0ffe5a0a20526a35d2",
})
export const REVIEW_CATEGORIES = ["source_dirty_drift", "multiple_launch", "tuple_schedule_drift", "supervision_escape", "partial_interrupted_unclean", "private_disclosure", "non_pass_authority"] as const
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const sourcePaths = ["scripts", "packages", "apps", "package.json", "pnpm-lock.yaml", "pnpm-workspace.yaml", "tsconfig.json"]
const fail = (code: string): never => { throw new TypeError(`CLOSEOUT_${code}`) }
const exact = (value: unknown, keys: readonly string[]): value is Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value) && Object.keys(value).sort().join() === [...keys].sort().join()
const equal = (a: unknown, b: unknown) => hashLeanValue(a) === hashLeanValue(b)
const git = (...args: string[]) => execFileSync("git", args, { cwd: ROOT, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 }).trim()
const destination = (key: string) => path.join(ROOT, CLOSEOUT_PATHS[key] ?? fail("DESTINATION"))
const read = (key: string): unknown => JSON.parse(readFileSync(destination(key), "utf8"))
export const consumeCloseout = createExclusiveLeanInvocationMarker
const write = (key: string, value: Readonly<Record<string, unknown>>) => consumeCloseout(destination(key), value)
const sha = (bytes: Buffer | string) => `sha256:${createHash("sha256").update(bytes).digest("hex")}`
export const validateRetryPredecessorRoots = (value: unknown) => {
  if (!equal(value, RETRY_PREDECESSOR_ROOTS)) fail("RETRY_PREDECESSOR_DRIFT")
  return RETRY_PREDECESSOR_ROOTS
}
const checkRetryPredecessor = () => {
  const old = closeoutPaths(false)
  const roots = Object.fromEntries(Object.keys(RETRY_PREDECESSOR_ROOTS).map((key) => {
    const file = old[key]!
    if (git("diff", "HEAD", "--", file) !== "" || git("ls-files", "--", file) === "") fail("PREDECESSOR_UNCOMMITTED")
    return [key, sha(readFileSync(path.join(ROOT, file)))]
  }))
  validateRetryPredecessorRoots(roots)
  for (const key of ["invocation", "terminal"]) if (existsSync(path.join(ROOT, old[key]!))) fail("ORIGINAL_OPPORTUNITY_CONSUMED")
}
const fileRoot = (key: string) => sha(readFileSync(destination(key)))
const committed = (key: string): void => {
  if (git("diff", "HEAD", "--", CLOSEOUT_PATHS[key]!) !== "" || git("ls-files", "--", CLOSEOUT_PATHS[key]!) === "") fail("UNCOMMITTED_EVIDENCE")
}
const absent = (...keys: string[]) => { for (const key of keys) if (existsSync(destination(key))) fail("ALREADY_CONSUMED") }
const originalAbsent = () => {
  for (const name of ["corrective-invocation-v2", "corrective-terminal-v2", "direct-invocation-v1", "direct-terminal-v1"]) {
    if (existsSync(path.join(ROOT, `.planning/artifacts/v1.38-lean-runner-${name}.json`))) fail("ORIGINAL_OPPORTUNITY_CONSUMED")
  }
}
export interface CloseoutBinding {
  readonly sourceCommit: string
  readonly sourceTree: string
  readonly closureRoot: string
  readonly historyRoot: string
  readonly locksRoot: string
  readonly scheduleRoot: string
  readonly tupleRoot: string
  readonly runtimeLimitsRoot: string
  readonly requestRoots: readonly string[]
  readonly formationRoot: string
  readonly profile: typeof CLOSEOUT_PROFILE
  readonly image: string
  readonly predecessorRoots?: typeof RETRY_PREDECESSOR_ROOTS
}
const closureAt = (ref: string) => sha(git("ls-tree", "-r", ref, "--", ...sourcePaths))
const tupleRoot = () => hashLeanValue(CANONICAL_COMPATIBILITY_TUPLES.find(({ tuple }) => tuple.runtimeAbi === CURRENT_SEMANTIC_RUNTIME_ABI_VERSION) ?? fail("TUPLE"))
const historyAt = (ref: string) => sha(git("ls-tree", "-r", ref, "--", ".planning/artifacts").split("\n").filter((line) => !line.includes("/v1.38-lean-closeout-")).join("\n"))
const locksRoot = () => {
  const locks = readdirSync(ROOT).filter((name) => /^\.v138-successor-.*\.lock$/u.test(name)).sort()
  if (locks.length !== 36) fail("LOCK_COUNT")
  return hashLeanValue(locks.map((name) => [name, sha(readFileSync(path.join(ROOT, name)))]))
}
export const createCloseoutBinding = (): CloseoutBinding => {
  const sourceCommit = git("rev-parse", "HEAD")
  if (RETRY) checkRetryPredecessor()
  return { sourceCommit, sourceTree: git("rev-parse", "HEAD^{tree}"), closureRoot: closureAt("HEAD"), historyRoot: historyAt("HEAD"), locksRoot: locksRoot(), scheduleRoot: hashLeanValue(buildLeanSchedule()), tupleRoot: tupleRoot(), runtimeLimitsRoot: hashLeanValue(DEFAULT_RUNTIME_LIMITS), requestRoots: buildLeanSchedule().map((cell) => hashLeanValue(cell)), formationRoot: LEAN_CURRENT_FORMATION_ROOT, profile: CLOSEOUT_PROFILE, image: LEAN_CONTAINER_IMAGE, ...(RETRY ? { predecessorRoots: RETRY_PREDECESSOR_ROOTS } : {}) }
}
interface Review { readonly schemaVersion: string; readonly disposition: "pass"; readonly reviewer: string; readonly producer: string; readonly categories: Readonly<Record<string, "pass">>; readonly blockers: 0; readonly binding: CloseoutBinding }
export const validateReview = (value: unknown): Review => {
  if (!exact(value, ["schemaVersion", "disposition", "reviewer", "producer", "categories", "blockers", "binding"]) || value.schemaVersion !== "v1.38-lean-closeout-source-review-v1" || value.disposition !== "pass" || value.blockers !== 0 || typeof value.reviewer !== "string" || value.reviewer.length < 3 || typeof value.producer !== "string" || value.reviewer === value.producer || !exact(value.categories, REVIEW_CATEGORIES) || Object.values(value.categories).some((v) => v !== "pass")) fail("SOURCE_REVIEW")
  const binding = value.binding
  if (!exact(binding, ["sourceCommit", "sourceTree", "closureRoot", "historyRoot", "locksRoot", "scheduleRoot", "tupleRoot", "runtimeLimitsRoot", "requestRoots", "formationRoot", "profile", "image", ...(RETRY ? ["predecessorRoots"] : [])]) || !/^[a-f0-9]{40}$/u.test(String(binding.sourceCommit)) || !equal(binding.profile, CLOSEOUT_PROFILE) || binding.image !== LEAN_CONTAINER_IMAGE || binding.scheduleRoot !== hashLeanValue(buildLeanSchedule()) || binding.tupleRoot !== tupleRoot() || binding.runtimeLimitsRoot !== hashLeanValue(DEFAULT_RUNTIME_LIMITS) || binding.formationRoot !== LEAN_CURRENT_FORMATION_ROOT || !equal(binding.requestRoots, buildLeanSchedule().map((cell) => hashLeanValue(cell)))) fail("BINDING")
  if (RETRY) validateRetryPredecessorRoots(binding.predecessorRoots)
  return value as unknown as Review
}
const authenticate = (allowUncommittedOperational = false): Review => {
  const review = validateReview(read("source-review")); committed("source-review")
  const dirty = git("diff", "HEAD", "--name-only")
  if (dirty && (!allowUncommittedOperational || dirty.split("\n").some((file) => !Object.values(CLOSEOUT_PATHS).includes(file)))) fail("DIRTY_SOURCE")
  const unknown = git("ls-files", "--others", "--exclude-standard").split("\n").filter(Boolean)
  if (unknown.some((file) => !/^\.v138-successor-[a-f0-9]+\.lock$/u.test(file) && !(allowUncommittedOperational && Object.values(CLOSEOUT_PATHS).includes(file)))) fail("UNTRACKED_SOURCE")
  const b = review.binding
  git("merge-base", "--is-ancestor", b.sourceCommit, "HEAD")
  if (b.sourceTree !== git("rev-parse", `${b.sourceCommit}^{tree}`) || b.closureRoot !== closureAt(b.sourceCommit) || b.closureRoot !== closureAt("HEAD") || b.historyRoot !== historyAt("HEAD") || b.historyRoot !== historyAt(b.sourceCommit) || b.locksRoot !== locksRoot()) fail("SOURCE_OR_HISTORY_DRIFT")
  originalAbsent()
  if (RETRY) checkRetryPredecessor()
  return review
}
interface Preflight { readonly schemaVersion: string; readonly bindingRoot: string; readonly status: "pass" | "non_pass"; readonly cleanupComplete: boolean; readonly profile: typeof CLOSEOUT_PROFILE; readonly reason: string; readonly aggregates: Record<string, number> }
const aggregateKeys = ["sampleCount", "successfulSamples", "lifecycleCount", "selectMaximumMilliseconds", "soldierMaximumMilliseconds", "lifecycleMaximumMilliseconds", "projectedCellMilliseconds", "projectedRunMilliseconds"]
export const validateCloseoutPreflight = (value: unknown, bindingRoot: string): Preflight => {
  if (!exact(value, ["schemaVersion", "bindingRoot", "status", "cleanupComplete", "profile", "reason", "aggregates"]) || value.schemaVersion !== "v1.38-lean-closeout-preflight-v1" || value.bindingRoot !== bindingRoot || value.status !== "pass" || value.cleanupComplete !== true || value.reason !== "admitted" || !equal(value.profile, CLOSEOUT_PROFILE) || !exact(value.aggregates, aggregateKeys)) fail("PREFLIGHT_NOT_ADMITTED")
  const a = value.aggregates as Record<string, number>
  if (Object.values(a).some((n) => !Number.isFinite(n) || n < 0) || a.sampleCount !== 12 || a.successfulSamples !== 12 || a.lifecycleCount !== 2 || a.projectedCellMilliseconds! > CLOSEOUT_PROFILE.cellDeadlineMilliseconds || a.projectedRunMilliseconds !== a.projectedCellMilliseconds! * 24 || a.projectedRunMilliseconds > CLOSEOUT_PROFILE.outerDeadlineMilliseconds) fail("PREFLIGHT_AGGREGATES")
  const projection = Math.ceil(LEAN_CONTAINER_STARTUP_CLEANUP_MARGIN_MS + a.lifecycleMaximumMilliseconds! + 2 * (LEAN_CONTAINER_METHOD_CEILINGS.selectActivations * a.selectMaximumMilliseconds! + LEAN_CONTAINER_METHOD_CEILINGS.soldierBrain * a.soldierMaximumMilliseconds!))
  if (projection !== a.projectedCellMilliseconds) fail("PROJECTION_DRIFT")
  return value as unknown as Preflight
}
export const validateCloseoutTerminal = (value: unknown, bindingRoot: string, invocationRoot: string): LeanTerminal => {
  if (!exact(value, ["schemaVersion", "bindingRoot", "invocationRoot", "profile", "scheduleRoot", "terminal"]) || value.schemaVersion !== "v1.38-lean-closeout-terminal-v1" || value.bindingRoot !== bindingRoot || value.invocationRoot !== invocationRoot || !equal(value.profile, CLOSEOUT_PROFILE) || value.scheduleRoot !== hashLeanValue(buildLeanSchedule())) fail("TERMINAL_CUSTODY")
  return deriveAndValidateLeanTerminal(value.terminal)
}
const runPreflight = (): void => {
  const review = authenticate(); absent("preflight-consumption", "preflight", "invocation", "terminal", "adjudication")
  const bindingRoot = hashLeanValue(review.binding)
  write("preflight-consumption", { schemaVersion: "v1.38-lean-closeout-preflight-consumption-v1", bindingRoot, reviewRoot: fileRoot("source-review") })
  let input: LeanContainerPreflightInput | undefined
  let admitted = false
  let reason = "probe_failed"
  try {
    runActualLeanContainerPreflight({ evaluate: (observed) => {
      input = observed
      // The shared evaluator owns all exact image, controls, sample and timing gates.
      return evaluateObserved(observed)
    } }, "closeout")
    admitted = true; reason = "admitted"
  } catch (error) {
    if (error instanceof Error && /^LEAN_CONTAINER_PREFLIGHT_[A-Z_]+$/u.test(error.message)) reason = error.message.replace("LEAN_CONTAINER_PREFLIGHT_", "").toLowerCase()
  }
  const max = (method: string) => Math.max(0, ...(input?.samples.filter((s) => s.method === method).map((s) => s.elapsedMilliseconds) ?? []))
  const lifecycle = Math.max(0, ...(input?.lifecycleSamples.map((s) => s.elapsedMilliseconds) ?? []))
  const projected = Math.ceil(LEAN_CONTAINER_STARTUP_CLEANUP_MARGIN_MS + lifecycle + 2 * (20 * max("selectActivations") + 240 * max("soldierBrain")))
  write("preflight", { schemaVersion: "v1.38-lean-closeout-preflight-v1", bindingRoot, status: admitted ? "pass" : "non_pass", cleanupComplete: input !== undefined && input.lifecycleSamples.length === 2 && input.lifecycleSamples.every((s) => s.cleanupComplete), profile: CLOSEOUT_PROFILE, reason, aggregates: { sampleCount: input?.samples.length ?? 0, successfulSamples: input?.samples.filter((s) => s.ok).length ?? 0, lifecycleCount: input?.lifecycleSamples.length ?? 0, selectMaximumMilliseconds: max("selectActivations"), soldierMaximumMilliseconds: max("soldierBrain"), lifecycleMaximumMilliseconds: lifecycle, projectedCellMilliseconds: projected, projectedRunMilliseconds: projected * 24 } })
  process.stdout.write(`${JSON.stringify({ status: admitted ? "pass" : "non_pass", reason })}\n`)
}
import { evaluateLeanContainerPreflight } from "./run-v1-38-lean-runner-feasibility.js"
const evaluateObserved = (input: LeanContainerPreflightInput) => evaluateLeanContainerPreflight(input, "closeout")
const checkPreflightConsumption = (bindingRoot: string) => {
  committed("preflight"); committed("preflight-consumption")
  const consumption = read("preflight-consumption")
  if (!exact(consumption, ["schemaVersion", "bindingRoot", "reviewRoot"]) || consumption.schemaVersion !== "v1.38-lean-closeout-preflight-consumption-v1" || consumption.bindingRoot !== bindingRoot || consumption.reviewRoot !== fileRoot("source-review")) fail("PREFLIGHT_CONSUMPTION")
}
const checkInvocation = (capability?: string) => {
  const review = authenticate(true)
  const bindingRoot = hashLeanValue(review.binding)
  checkPreflightConsumption(bindingRoot)
  validateCloseoutPreflight(read("preflight"), bindingRoot)
  const invocation = read("invocation")
  if (!exact(invocation, ["schemaVersion", "bindingRoot", "preflightRoot", "capability", "parentPid"]) || invocation.schemaVersion !== "v1.38-lean-closeout-invocation-v1" || invocation.bindingRoot !== bindingRoot || invocation.preflightRoot !== fileRoot("preflight") || !/^[a-f0-9]{64}$/u.test(String(invocation.capability)) || (capability !== undefined && (invocation.capability !== capability || invocation.parentPid !== process.ppid))) fail("INVOCATION_CUSTODY")
  return { review, bindingRoot, invocation }
}
type CleanupTransport = (args: readonly string[]) => { status: number | null; stdout: string; stderr: string; error?: unknown; signal?: unknown }
/** The daemon survives a killed host child. Remove only the exact owned container. */
export const cleanupCloseoutCell = (cell: LeanCell, injectedTransport?: CleanupTransport) => {
  const deadline = performance.now() + 2000
  const transport: CleanupTransport = injectedTransport ?? ((args) => {
    const remaining = Math.floor(deadline - performance.now())
    if (remaining < 1) throw new TypeError("CLOSEOUT_CLEANUP_TIMEOUT")
    return spawnSync("docker", [...args], { encoding: "utf8", timeout: remaining, maxBuffer: 8192, shell: false, env: { PATH: process.env.PATH ?? "" } })
  })
  const matchId = `match:lean:${hashLeanValue(cell.baseCellId).slice("sha256:".length)}`
  const name = deriveLeanContainerName(matchId)
  const owner = deriveLeanContainerOwnershipLabel(matchId)
  const inspect = () => transport(["inspect", "--format", '{{index .Config.Labels "v1.38-lean-owner"}}', name])
  const absent = (r: ReturnType<CleanupTransport>) => !r.error && !r.signal && r.status === 1 && ((r.stdout === "" && r.stderr === `Error: No such object: ${name}\n`) || (r.stdout === "\n" && r.stderr === `error: no such object: ${name}\n`))
  try {
    const first = inspect()
    if (absent(first)) return { cleanupComplete: true, orphanedChild: false }
    if (first.error || first.signal || first.status !== 0 || first.stderr !== "" || first.stdout.trim() !== owner) return { cleanupComplete: false, orphanedChild: true }
    const removed = transport(["rm", "--force", name])
    const clean = !removed.error && !removed.signal && removed.status === 0 && removed.stderr === "" && absent(inspect())
    return { cleanupComplete: clean, orphanedChild: !clean }
  } catch { return { cleanupComplete: false, orphanedChild: true } }
}
export const superviseCloseoutCleanup = (supervisor: LeanExecutionDependencies, cleanup: typeof cleanupCloseoutCell = cleanupCloseoutCell, interruption?: AbortSignal): LeanExecutionDependencies => {
  let activeCell: LeanCell | undefined
  let lastContainer = { cleanupComplete: true, orphanedChild: false }
  return { ...supervisor, deadlineMilliseconds: CLOSEOUT_PROFILE.outerDeadlineMilliseconds, stopOnFailure: true,
    execute: async (cell, signal) => {
      if (interruption?.aborted) return { classification: "cancelled", cleanupComplete: lastContainer.cleanupComplete, orphanedChild: lastContainer.orphanedChild, boardRealism: true, integrityValid: true }
      activeCell = cell
      lastContainer = { cleanupComplete: false, orphanedChild: true }
      const result = await supervisor.execute(cell, signal)
      const container = cleanup(cell)
      lastContainer = container
      activeCell = undefined
      if (interruption?.aborted) return { classification: "cancelled", cleanupComplete: result.cleanupComplete && container.cleanupComplete, orphanedChild: result.orphanedChild || container.orphanedChild, boardRealism: result.boardRealism, integrityValid: result.integrityValid }
      return { ...result, cleanupComplete: result.cleanupComplete && container.cleanupComplete, orphanedChild: result.orphanedChild || container.orphanedChild }
    },
    terminateActive: async () => {
      const host = await supervisor.terminateActive()
      const container = activeCell === undefined ? lastContainer : cleanup(activeCell)
      lastContainer = container
      activeCell = undefined
      return { cleanupComplete: host.cleanupComplete && container.cleanupComplete, orphanedChild: host.orphanedChild || container.orphanedChild }
    },
  }
}
const runMatches = async () => {
  const review = authenticate(); committed("preflight"); committed("preflight-consumption")
  absent("invocation", "terminal", "adjudication")
  const bindingRoot = hashLeanValue(review.binding)
  checkPreflightConsumption(bindingRoot)
  validateCloseoutPreflight(read("preflight"), bindingRoot)
  const capability = randomBytes(32).toString("hex")
  write("invocation", { schemaVersion: "v1.38-lean-closeout-invocation-v1", bindingRoot, preflightRoot: fileRoot("preflight"), capability, parentPid: process.pid })
  checkInvocation()
  const supervisor = createSupervisedLeanExecutionDependencies(capability, {
    cellDeadlineMilliseconds: CLOSEOUT_PROFILE.cellDeadlineMilliseconds,
    spawnChild: () => fork(fileURLToPath(import.meta.url), [RETRY ? "--retry-closeout-child" : "--closeout-child"], { cwd: ROOT, execArgv: ["--import", "tsx"], detached: process.platform !== "win32", stdio: ["ignore", "pipe", "pipe", "ipc"], env: { ...process.env, CLOSEOUT_CAPABILITY: capability } }),
  })
  const interruption = new AbortController()
  const supervised = superviseCloseoutCleanup(supervisor, cleanupCloseoutCell, interruption.signal)
  const interrupt = () => { interruption.abort(); void supervised.terminateActive() }
  process.once("SIGINT", interrupt); process.once("SIGTERM", interrupt)
  let terminal: LeanTerminal
  try { terminal = await runLeanFeasibilityInjected(supervised) }
  finally { process.removeListener("SIGINT", interrupt); process.removeListener("SIGTERM", interrupt) }
  write("terminal", { schemaVersion: "v1.38-lean-closeout-terminal-v1", bindingRoot, invocationRoot: fileRoot("invocation"), profile: CLOSEOUT_PROFILE, scheduleRoot: hashLeanValue(buildLeanSchedule()), terminal })
  process.stdout.write(`${JSON.stringify({ result: terminal.result, counts: terminal.counts, determinism: terminal.determinism, completeCleanup: terminal.completeCleanup })}\n`)
}
const child = () => {
  const capability = process.env.CLOSEOUT_CAPABILITY
  if (!capability || typeof process.send !== "function") fail("CHILD_PARENT")
  checkInvocation(capability); absent("terminal", "adjudication")
  process.once("message", (message: unknown) => {
    void (async () => {
      if (!exact(message, ["kind", "capability", "cell"]) || message.kind !== "execute" || message.capability !== capability) fail("CHILD_PROTOCOL")
      const cell = buildLeanSchedule().find((candidate) => equal(candidate, message.cell))
      if (!cell) fail("CHILD_SCHEDULE")
      const result = await executePreparedLeanCell(cell, "closeout")
      if (!result.cleanupComplete || result.orphanedChild) fail("CHILD_CLEANUP")
      process.send?.({ kind: "result", capability, result }, () => process.disconnect())
    })().catch(() => { process.exitCode = 1; process.disconnect() })
  })
  process.send!({ kind: "ready", capability })
}
const checkPostRun = () => {
  if (!existsSync(destination("invocation"))) {
    const review = authenticate(true)
    checkPreflightConsumption(hashLeanValue(review.binding))
    const preflight = read("preflight")
    if (!exact(preflight, ["schemaVersion", "bindingRoot", "status", "cleanupComplete", "profile", "reason", "aggregates"]) || preflight.schemaVersion !== "v1.38-lean-closeout-preflight-v1" || preflight.bindingRoot !== hashLeanValue(review.binding) || preflight.status !== "non_pass" || !equal(preflight.profile, CLOSEOUT_PROFILE) || typeof preflight.reason !== "string" || !/^[a-z_]+$/u.test(preflight.reason) || !exact(preflight.aggregates, aggregateKeys) || Object.values(preflight.aggregates).some((n) => typeof n !== "number" || !Number.isFinite(n) || n < 0)) fail("PREFLIGHT_TERMINAL")
    absent("terminal")
    return { result: "non_pass" as const, preflightOnly: true }
  }
  const { bindingRoot } = checkInvocation()
  committed("invocation"); committed("terminal")
  return validateCloseoutTerminal(read("terminal"), bindingRoot, fileRoot("invocation"))
}
const checkAdjudication = () => {
  const terminal = checkPostRun(); committed("adjudication")
  const value = read("adjudication")
  if (!exact(value, ["schemaVersion", "reviewer", "producer", "terminalRoot", "result", "admitsPhase263"]) || value.schemaVersion !== "v1.38-lean-closeout-adjudication-v1" || typeof value.reviewer !== "string" || value.reviewer.length < 3 || typeof value.producer !== "string" || value.reviewer === value.producer || value.terminalRoot !== fileRoot("preflightOnly" in terminal ? "preflight" : "terminal") || value.result !== terminal.result || value.admitsPhase263 !== (terminal.result === "pass")) fail("ADJUDICATION")
  return value
}
const main = async () => {
  switch (resolveCloseoutSelector(process.argv[2] ?? "").selector) {
    case "--describe-source": process.stdout.write(`${JSON.stringify(createCloseoutBinding(), null, 2)}\n`); return
    case "--check-source": authenticate(); break
    case "--preflight": runPreflight(); return
    case "--run": await runMatches(); return
    case "--closeout-child": child(); return
    case "--check-post-run": checkPostRun(); break
    case "--check-adjudication": checkAdjudication(); break
    case "--check-tracking": {
      const adjudication = checkAdjudication()
      const requirements = readFileSync(path.join(ROOT, ".planning/REQUIREMENTS.md"), "utf8")
      if (/\[x\][^\n]*ADMIT-03/u.test(requirements) !== adjudication.admitsPhase263) fail("TRACKING")
      break
    }
    default: fail("SELECTOR")
  }
  process.stdout.write("closeout check passed\n")
}
if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) void main().catch(() => { process.stderr.write("CLOSEOUT_REFUSED\n"); process.exitCode = 1 })
