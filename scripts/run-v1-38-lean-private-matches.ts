/** Explicit private HOST two-Match feasibility route. Compact board evidence is
 * NOT a Chronicle, replay reconstruction or engine-semantic certificate. */
import { createHash } from "node:crypto"
import { constants, openSync, closeSync, readSync, writeSync, fsyncSync, fstatSync, lstatSync, readdirSync, realpathSync, mkdirSync, statfsSync } from "node:fs"
import { resolve, dirname, join } from "node:path"
import { pathToFileURL } from "node:url"
import { CANONICAL_ARENA_CATALOG_V1_37, FullBoardSnapshotSchema, BOTTOM_STARTING_POSITIONS, TOP_STARTING_POSITIONS, defaultRuntimeMetadata } from "@cowards/spec"
import { MATCH_KERNEL } from "../packages/engine/src/index.js"
import { canonicalReplayTerrain } from "../packages/replay/src/reconstruct.js"
import { LAB_ADMITTED_ROOTS, exactLabKeys as exactKeys, labRoot, type LabRoot } from "../packages/strategy-lab/src/contracts.js"
import { deriveFactoryOrderedRecordDescriptor } from "../packages/strategy-lab/src/factory/admission.js"
import type { LabMatchExecution, LabRuntimeIdentity } from "../packages/strategy-lab/src/runtime-bridge.js"
import type { LeanCompactMatchRecord } from "../packages/strategy-lab/src/league/lean-experiment.js"
import { leanBytesRoot, leanCanonicalBytes, LEAN_STARTUP_POLICY_V5 } from "../packages/strategy-lab/src/league/lean-experiment.js"
import { buildStrategyRevision } from "../packages/runtime-js/src/revision.js"
import { readLeanBaselineSource } from "./lib/v1-38-lean-baseline-source.js"
import { runLeanPrivateFeasibilityMatch } from "./lib/v1-38-lean-baseline-match.js"
import { runLeanPrivateFeasibilityMatchV2, readLeanPrivateMatchDiagnosticV2 } from "./lib/v1-38-lean-baseline-match.js"
import { readLeanPrivateStartupReceiptV1, bindLeanCorrectionInvocation, leanCorrectionInvocationTransportBinding } from "./lib/v1-38-lean-baseline-match.js"
import { validateLeanStartupOriginV8, type LeanStartupOriginV8 } from "./lib/v1-38-lean-container-match-session.js"
import { SUBPROCESS_SYSTEM_FAILURE_CODES } from "../packages/runtime-js/src/subprocess-ipc.js"
import { isLeanPrivateFailureOrigin, readLeanPrivateMatchGitV2 } from "./lib/v1-38-lean-container-match-session.js"
import * as v2Authority from "./lib/v1-38-lean-experiment-authority.js"
import type { LeanPrivateMatchAllocationV2 } from "./lib/v1-38-lean-experiment-authority.js"
import { checkpointLeanPrivateMatchV1, verifyLeanPrivateMatchResourcesV1 } from "./lib/v1-38-lean-experiment-authority.js"
import { buildLeanStartupWorkerHarnessV8, readLeanPrivateMatchGitV1 } from "./lib/v1-38-lean-container-match-session.js"
import { LEAN_PRIVATE_MATCH_ARTIFACT_V1, LEAN_PRIVATE_MATCH_SOURCE_STORE_V1, LEAN_PRIVATE_MATCH_SEED_V1, LEAN_PRIVATE_MATCH_WINDOW_V1, LEAN_PRIVATE_PROBE_COST_ROOT, inspectLeanPrivateMatchSourceV1, inspectLeanPrivateMatchPrefixV1, authenticateLeanPrivateMatchProbeCarryV1, validateLeanPrivateMatchAllocationV1, readLeanPrivateMatchFileV1, writeLeanPrivateMatchFileV1, authenticateLeanPrivateMatchCommitV1, observeLeanPrivateMatchCapacityV1, observeLeanPrivateMatchResourcesV1, openLeanPrivateMatchAdmissionV1, recordLeanPrivateMatchDebitV1, readLeanPrivateMatchContextV1, closeLeanPrivateMatchDebitV1, type LeanPrivateMatchAllocationV1, type LeanPrivateMatchSourceV1 } from "./lib/v1-38-lean-experiment-authority.js"

const fail = (): never => { throw new TypeError("LEAN_PRIVATE_MATCH_ROUTE") }
const exactLabKeys = (value: unknown, keys: readonly string[]): boolean => exactKeys(value, keys)
const canonical = (value: unknown): Buffer => Buffer.from(leanCanonicalBytes(value))
const equal = (a: unknown, b: unknown): boolean => canonical(a).equals(canonical(b))
const root = (value: unknown): value is LabRoot => typeof value === "string" && /^sha256:[a-f0-9]{64}$/u.test(value)
const integer = (value: unknown, max = Number.MAX_SAFE_INTEGER): value is number => Number.isSafeInteger(value) && Number(value) >= 0 && Number(value) <= max
const json = (path: string, maximum = 65536): Record<string, any> => {
  const bytes = readLeanPrivateMatchFileV1(path, maximum), value = JSON.parse(bytes.toString("utf8")) as Record<string, any>
  if (!bytes.equals(canonical(value))) return fail(); return value
}
const rooted = <T extends { schemaVersion: string }>(body: T) => ({ ...body, root: labRoot(body.schemaVersion, body) })
const checkRoot = (value: Record<string, any>, domain: string): void => { const { root: r, ...body } = value; if (!root(r) || r !== labRoot(domain, body)) return fail() }
const smoke = () => CANONICAL_ARENA_CATALOG_V1_37.arenas.find(a => a.id === "arena:smoke:v1" && a.status === "active") ?? fail()
const player = (a: LeanPrivateMatchAllocationV1 | LeanPrivateMatchAllocationV2, ordinal: number, seat: "bottom" | "top") => `lean-source-${a.sources.find(s => s.role === (seat === "bottom" ? a.slots[ordinal]!.bottomRole : a.slots[ordinal]!.topRole))!.sourceRoot.slice(7)}`

export type LeanPrivateMatchesCommandV1 = Readonly<{ command: "metadata"; sourceStore: string }> | Readonly<{ command: "prepare"; sourceStore: string; sourceHead: string; candidateRawRoot: LabRoot; opponentRawRoot: LabRoot }> | Readonly<{ command: "entry" | "verify"; allocationCommit: string; allocationPath: string; store: string }>
export const parseLeanPrivateMatchesArgsV1 = (argv: readonly string[]): LeanPrivateMatchesCommandV1 => {
  const [command, ...rest] = argv
  if (!["metadata", "prepare", "entry", "verify"].includes(command ?? "") || rest.length % 2) return fail()
  const flags = new Map<string, string>()
  for (let n = 0; n < rest.length; n += 2) { const key = rest[n]!, value = rest[n + 1]!; if (flags.has(key) || !value || value.startsWith("--")) return fail(); flags.set(key, value) }
  const allowed = command === "metadata" ? ["--source-store"] : command === "prepare" ? ["--source-store", "--source-head", "--candidate-raw-root", "--opponent-raw-root"] : ["--allocation-commit", "--allocation-path", "--store"]
  if (flags.size !== allowed.length || [...flags.keys()].some(k => !allowed.includes(k))) return fail()
  const get = (key: string) => flags.get(`--${key}`)!
  if (command === "metadata" || command === "prepare") {
    if (get("source-store") !== LEAN_PRIVATE_MATCH_SOURCE_STORE_V1) return fail()
    if (command === "metadata") return { command, sourceStore: get("source-store") }
    if (!/^[a-f0-9]{40}$/u.test(get("source-head")) || !root(get("candidate-raw-root")) || !root(get("opponent-raw-root"))) return fail()
    return { command, sourceStore: get("source-store"), sourceHead: get("source-head"), candidateRawRoot: get("candidate-raw-root") as LabRoot, opponentRawRoot: get("opponent-raw-root") as LabRoot }
  }
  if (!/^[a-f0-9]{40}$/u.test(get("allocation-commit")) || get("allocation-path") !== LEAN_PRIVATE_MATCH_ARTIFACT_V1 || !/^\.strategy-lab\/lean-private-matches-v1\/[a-f0-9]{64}$/u.test(get("store"))) return fail()
  return { command: command as "entry" | "verify", allocationCommit: get("allocation-commit"), allocationPath: get("allocation-path"), store: get("store") }
}
export const createLeanPrivateMatchAllocationV1 = (input: { sourceHead: string; sources: readonly [LeanPrivateMatchSourceV1, LeanPrivateMatchSourceV1]; sourcePrefix: LeanPrivateMatchAllocationV1["sourcePrefix"]; priorProbeCarry: LeanPrivateMatchAllocationV1["priorProbeCarry"] }): LeanPrivateMatchAllocationV1 => {
  const arenaHash = smoke().semanticGeometryHash, sources = input.sources
  const slots = ([0, 1] as const).map(ordinal => {
    const bottomRole = ordinal === 0 ? "tactical-0" as const : "cold-opponent" as const, topRole = ordinal === 0 ? "cold-opponent" as const : "tactical-0" as const
    const requestRoot = labRoot("lean-private-match-request-v1", { ordinal, seed: LEAN_PRIVATE_MATCH_SEED_V1, arenaHash, bottom: sources.find(s => s.role === bottomRole), top: sources.find(s => s.role === topRole) })
    const body = { ordinal, condition: ordinal === 0 ? 0 as const : 2 as const, bottomRole, topRole, requestRoot }; return { ...body, root: labRoot("lean-private-match-slot-v1", body) }
  }) as unknown as LeanPrivateMatchAllocationV1["slots"]
  return validateLeanPrivateMatchAllocationV1(rooted({ schemaVersion: "lean-private-match-allocation-v1" as const, ...input, matchCount: 2 as const, seed: LEAN_PRIVATE_MATCH_SEED_V1, windowRoot: LEAN_PRIVATE_MATCH_WINDOW_V1.root, costSnapshotRoot: LEAN_PRIVATE_PROBE_COST_ROOT, historicalCharged: 40 as const, slots, arenaHash, catalogRoot: labRoot("lean-private-match-catalog-v1", CANONICAL_ARENA_CATALOG_V1_37), currentStartRoot: LAB_ADMITTED_ROOTS.currentStartRoot, tupleId: MATCH_KERNEL.tupleId, tupleRoot: LAB_ADMITTED_ROOTS.tupleRoot, runtimeLimitsRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot, image: LAB_ADMITTED_ROOTS.image, startupPolicyRoot: LEAN_STARTUP_POLICY_V5.root, harnessRoot: leanBytesRoot(Buffer.from(buildLeanStartupWorkerHarnessV8())), ceilings: { guestMs: 1000, startupMs: 2500, hostMs: 5000, matchMs: 600000 } }))
}
export const prepareLeanPrivateMatchesV1 = (command: Extract<LeanPrivateMatchesCommandV1, { command: "prepare" }>) => {
  if (Date.now() + 1860000 + 1200000 > LEAN_PRIVATE_MATCH_WINDOW_V1.deadlineMs || readLeanPrivateMatchGitV1(["rev-parse", "HEAD"]).toString("utf8").trim() !== command.sourceHead || readLeanPrivateMatchGitV1(["diff", "--name-only", "HEAD", "--", "scripts/run-v1-38-lean-private-matches.ts", "scripts/lib/v1-38-lean-experiment-authority.ts", "scripts/lib/v1-38-lean-baseline-match.ts", "scripts/lib/v1-38-lean-container-match-session.ts"]).length) return fail()
  const metadata = (["tactical-0", "cold-opponent"] as const).map(role => inspectLeanPrivateMatchSourceV1(command.sourceStore, role))
  if (metadata[0]!.rawRoot !== command.candidateRawRoot || metadata[1]!.rawRoot !== command.opponentRawRoot) return fail()
  const sources = metadata.map(m => {
    const s = readLeanBaselineSource(command.sourceStore, m.role), defaults = defaultRuntimeMetadata("typescript")
    const revision = buildStrategyRevision({ source: s.source, runtime: { ...defaults, adapter: { ...defaults.adapter, id: "runtime-js-container-subprocess" } } })
    if (!revision.validation.valid || !revision.metadata.sourceArtifact || s.root !== m.snapshotRoot || s.sourceRoot !== m.sourceRoot) return fail()
    return { ...m, executableRoot: `sha256:${revision.metadata.sourceArtifact.hash}` as LabRoot }
  }) as unknown as readonly [LeanPrivateMatchSourceV1, LeanPrivateMatchSourceV1]
  const a = createLeanPrivateMatchAllocationV1({ sourceHead: command.sourceHead, sources, sourcePrefix: inspectLeanPrivateMatchPrefixV1(command.sourceHead), priorProbeCarry: authenticateLeanPrivateMatchProbeCarryV1() })
  const store = join(".strategy-lab/lean-private-matches-v1", a.root.slice(7)), path = resolve(store), parent = dirname(path)
  try { lstatSync(parent) } catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; mkdirSync(parent, { mode: 0o700 }) }
  if (realpathSync(parent) !== parent || (lstatSync(parent).mode & 0o777) !== 0o700) return fail()
  mkdirSync(path, { mode: 0o700 }); writeLeanPrivateMatchFileV1(join(path, "allocation.json"), canonical(a))
  observeLeanPrivateMatchResourcesV1(path, a, 2)
  // Artifact is versioned and publish-once; Git commit is ROOT's separate gate.
  const artifact = canonical(a), fd = openSync(LEAN_PRIVATE_MATCH_ARTIFACT_V1, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY | constants.O_NOFOLLOW, 0o644)
  try { let offset = 0; while (offset < artifact.length) offset += writeSync(fd, artifact, offset, artifact.length - offset); fsyncSync(fd) } finally { closeSync(fd) }
  const directory = openSync(dirname(LEAN_PRIVATE_MATCH_ARTIFACT_V1), constants.O_RDONLY | constants.O_NOFOLLOW); try { fsyncSync(directory) } finally { closeSync(directory) }
  return { allocationRoot: a.root, sourceHead: a.sourceHead, store, allocationPath: LEAN_PRIVATE_MATCH_ARTIFACT_V1 }
}

export interface LeanPrivateBoardV1 {
  matchId: string; phase: string; phaseNumber: number; roundNumber: number; activationCount: number; initiativePlayerId: string
  bounds: ReturnType<typeof FullBoardSnapshotSchema.parse>["bounds"]; soldiers: ReturnType<typeof FullBoardSnapshotSchema.parse>["soldiers"]; terrainStones: ReturnType<typeof FullBoardSnapshotSchema.parse>["terrainStones"]
  outcome: null | { type: "DRAW" } | { type: "WIN"; winnerPlayerId: string }
}
const boardKeys = ["matchId", "phase", "phaseNumber", "roundNumber", "activationCount", "initiativePlayerId", "bounds", "soldiers", "terrainStones", "outcome"]
const soldierKeys = ["id", "ownerPlayerId", "status", "position", "facing", "lastSuccessfulMoveDirection"]
export const projectLeanPrivateBoardV1 = (state: unknown): LeanPrivateBoardV1 => {
  const s = state as Record<string, any>
  if (!s || !Array.isArray(s.soldiers) || !Array.isArray(s.terrainStones)) return fail()
  const board = { matchId: s.matchId, phase: s.phase, phaseNumber: s.phaseNumber, roundNumber: s.roundNumber, activationCount: s.activationCount, initiativePlayerId: s.initiativePlayerId, bounds: { minX: s.bounds?.minX, maxX: s.bounds?.maxX, minY: s.bounds?.minY, maxY: s.bounds?.maxY }, soldiers: s.soldiers.map((v: Record<string, any>) => ({ id: v.id, ownerPlayerId: v.ownerPlayerId, status: v.status, position: v.position === null ? null : { x: v.position?.x, y: v.position?.y }, facing: v.facing, lastSuccessfulMoveDirection: v.lastSuccessfulMoveDirection })).sort((a: { id: string }, b: { id: string }) => a.id.localeCompare(b.id)), terrainStones: canonicalReplayTerrain(s.terrainStones), outcome: s.outcome === null ? null : s.outcome?.type === "DRAW" ? { type: "DRAW" as const } : s.outcome?.type === "WIN" ? { type: "WIN" as const, winnerPlayerId: s.outcome.winnerPlayerId } : fail() }
  validateBoard(board); return board
}
const validateBoard = (value: unknown): LeanPrivateBoardV1 => {
  if (!exactLabKeys(value, boardKeys)) return fail()
  const b = value as unknown as LeanPrivateBoardV1
  if (!exactLabKeys(b.bounds, ["minX", "maxX", "minY", "maxY"]) || !Array.isArray(b.soldiers) || b.soldiers.length !== 16 || b.soldiers.some(s => !exactLabKeys(s, soldierKeys) || s.position !== null && !exactLabKeys(s.position, ["x", "y"])) || !Array.isArray(b.terrainStones) || b.terrainStones.length > 144 || b.terrainStones.some(p => !exactLabKeys(p, ["x", "y"])) || !FullBoardSnapshotSchema.safeParse({ bounds: b.bounds, soldiers: b.soldiers, terrainStones: b.terrainStones }).success || !["ROUND", "CONTRACTION", "COMPLETE"].includes(b.phase) || !integer(b.phaseNumber, 100000) || b.phaseNumber < 1 || !integer(b.roundNumber, 4) || !integer(b.activationCount, 4) || [b.matchId, b.initiativePlayerId, ...b.soldiers.flatMap(s => [s.id, s.ownerPlayerId])].some(s => typeof s !== "string" || !s.length || Buffer.byteLength(s) > 128) || new Set(b.soldiers.map(s => s.id)).size !== 16 || !equal(b.soldiers.map(s => s.id), b.soldiers.map(s => s.id).sort()) || !equal(b.terrainStones, canonicalReplayTerrain(b.terrainStones)) || b.outcome !== null && (b.outcome.type === "DRAW" ? !exactLabKeys(b.outcome, ["type"]) : b.outcome.type !== "WIN" || !exactLabKeys(b.outcome, ["type", "winnerPlayerId"]))) return fail()
  return b
}
type EvidenceBinding = Readonly<{ allocation: LeanPrivateMatchAllocationV1 | LeanPrivateMatchAllocationV2; ordinal: 0 | 1; debitRoot: LabRoot; providerIdentities: readonly LabRuntimeIdentity[] }>
const identityKeys = ["revisionId", "sourceRoot", "executableRoot", "tupleId", "tupleRoot", "image", "harnessRoot", "budgetRoot", "attemptRoot", "runtimeLimitsRoot"]
const extensionKeys = ["nativeLane", "factoryPacketRoot", "factoryProposalRoot", "factoryValidationRoot"]
const projectIdentity = (identity: LabRuntimeIdentity): Record<string, unknown> => {
  const v = identity as unknown as Record<string, unknown>, keys = [...identityKeys, ...extensionKeys.filter(k => k in v)]
  if (!exactLabKeys(v, keys) || extensionKeys.some(k => (k in v) !== ("nativeLane" in v))) return fail()
  return Object.fromEntries(keys.map(key => [key, v[key]]))
}
const checkIdentity = (identity: unknown, binding: EvidenceBinding): void => {
  const v = identity as LabRuntimeIdentity
  projectIdentity(v)
  if (!binding.providerIdentities.some(expected => equal(projectIdentity(expected), v)) || v.budgetRoot !== binding.allocation.root || v.attemptRoot !== binding.debitRoot || v.tupleId !== binding.allocation.tupleId || v.tupleRoot !== binding.allocation.tupleRoot || v.runtimeLimitsRoot !== binding.allocation.runtimeLimitsRoot || v.image !== binding.allocation.image || v.harnessRoot !== binding.allocation.harnessRoot || !binding.allocation.sources.some(s => s.sourceRoot === v.sourceRoot && s.executableRoot === v.executableRoot)) return fail()
  const extended = v as unknown as Record<string, any>, source = binding.allocation.sources.find(s => s.sourceRoot === v.sourceRoot)!
  if (!exactLabKeys(extended, [...identityKeys, ...extensionKeys]) || extended.factoryPacketRoot !== source.packetRoot || extended.factoryProposalRoot !== source.proposalRoot || extended.factoryValidationRoot !== source.validationRoot || !exactLabKeys(extended.nativeLane, ["language", "providerId", "runtimeAbi", "runtimeProfileRoot", "translation"]) || extended.nativeLane.language !== "typescript" || extended.nativeLane.providerId !== "lean-offline-mechanics" || extended.nativeLane.runtimeAbi !== "strategy-runtime-abi-v1.19" || extended.nativeLane.runtimeProfileRoot !== binding.allocation.runtimeLimitsRoot || extended.nativeLane.translation !== "none" || typeof v.revisionId !== "string" || !v.revisionId.length || Buffer.byteLength(v.revisionId) > 128) return fail()
}
const accountingKeys = ["identity", "invocationRoot", "requestId", "method", "inputRoot", "ordinal", "charged", "completed", "outputBytes", "classification"]
const checkAccounting = (rows: readonly Record<string, any>[], binding: EvidenceBinding, success: boolean): void => {
  if (!Array.isArray(rows) || rows.length > 49600 || success && (rows.length === 0 || binding.allocation.sources.some(s => !rows.some(row => row.identity?.sourceRoot === s.sourceRoot)))) return fail()
  const invocations = new Set<string>(), requests = new Set<string>(), ordinals = new Map<string, number>()
  for (const row of rows) {
    if (!exactLabKeys(row, accountingKeys)) return fail(); checkIdentity(row.identity, binding)
    const provider = (row.identity as LabRuntimeIdentity).sourceRoot, expected = ordinals.get(provider) ?? 0
    if (!root(row.invocationRoot) || invocations.has(row.invocationRoot) || typeof row.requestId !== "string" || !/^effect:(?:v1\.(?:17|19):[a-f0-9]{64}|[0-9]+:[a-zA-Z0-9_-]+:(?:selectActivations|soldierBrain):[a-zA-Z0-9:_-]{1,128})$/u.test(row.requestId) || requests.has(row.requestId) || !["selectActivations", "soldierBrain"].includes(row.method) || !root(row.inputRoot) || row.ordinal !== expected || !integer(row.ordinal, 24799) || row.charged !== true || typeof row.completed !== "boolean" || !integer(row.outputBytes, 262144) || !["success", "system_failure", "player_violation"].includes(row.classification) || success && (row.completed !== true || row.classification !== "success")) return fail()
    invocations.add(row.invocationRoot); requests.add(row.requestId); ordinals.set(provider, expected + 1)
  }
}
const stateRoot = (state: LeanPrivateBoardV1 | null) => state === null ? null : labRoot("lean-private-board-state-v1", state)
const frame = (binding: EvidenceBinding, index: number, kind: string, previousFrameRoot: LabRoot | null, before: LeanPrivateBoardV1 | null, after: LeanPrivateBoardV1 | null) => rooted({ schemaVersion: "lean-private-board-row-v1", allocationRoot: binding.allocation.root, debitRoot: binding.debitRoot, slotRoot: binding.allocation.slots[binding.ordinal]!.root, ordinal: binding.ordinal, index, kind, previousFrameRoot, before, beforeRoot: stateRoot(before), after, afterRoot: stateRoot(after) })
// `frameRoot`, not generic `root`, is the exact board-row contract.
const boardFrame = (...args: Parameters<typeof frame>) => { const { root: frameRoot, ...body } = frame(...args); return { ...body, frameRoot } }
const writeAll = (fd: number, bytes: Buffer): void => { let n = 0; while (n < bytes.length) { const wrote = writeSync(fd, bytes, n, bytes.length - n); if (wrote <= 0) return fail(); n += wrote } }
const produceLeanPrivateMatchEvidenceShared = (input: { binding: EvidenceBinding; actual: LabMatchExecution; compact: LeanCompactMatchRecord; semanticRoot: LabRoot | null; streamPath: string; guard: (bytes?: number) => void }) => {
  const { binding, actual, compact } = input
  const accountingRows = actual.accounting.map(a => ({ identity: projectIdentity(a.identity), invocationRoot: a.invocationRoot, requestId: a.requestId, method: a.method, inputRoot: a.inputRoot, ordinal: a.ordinal, charged: a.charged, completed: a.completed, outputBytes: a.outputBytes, classification: a.result.ok ? "success" : "systemFailure" in a.result ? "system_failure" : "player_violation" }))
  checkAccounting(accountingRows, binding, compact.classification === "success")
  const accountingRoot = labRoot("lean-accounting-v1", deriveFactoryOrderedRecordDescriptor("lean-accounting", accountingRows))
  if (accountingRoot !== compact.accountingRoot || compact.invocationCount !== accountingRows.length || compact.telemetry.transitions !== actual.transitions.length || actual.transitions.length > 65536 || compact.classification === "success" && (actual.kind !== "completed" || actual.transitions.length === 0)) return fail()
  const fd = openSync(input.streamPath, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o600), hash = createHash("sha256")
  let streamBytes = 0, rowCount = 0, startBoardRoot: LabRoot | null = null, finalBoardRoot: LabRoot | null = null, lastFrameRoot: LabRoot | null = null, previous: LeanPrivateBoardV1 | null = null
  const write = (kind: string, before: LeanPrivateBoardV1 | null, after: LeanPrivateBoardV1 | null) => {
    const row = boardFrame(binding, rowCount, kind, lastFrameRoot, before, after), bytes = Buffer.concat([canonical(row), Buffer.from("\n")])
    if (bytes.length > 65536 || streamBytes + bytes.length > 67108864) return fail(); input.guard(bytes.length)
    writeAll(fd, bytes); hash.update(bytes); streamBytes += bytes.length; rowCount++; lastFrameRoot = row.frameRoot; finalBoardRoot = row.afterRoot; previous = after
  }
  try {
    if (actual.transitions.length) {
      const start = projectLeanPrivateBoardV1(actual.transitions[0]!.beforeState); startBoardRoot = stateRoot(start); write("start", null, start)
      for (const transition of actual.transitions) { const before = projectLeanPrivateBoardV1(transition.beforeState), after = projectLeanPrivateBoardV1(transition.afterState); if (!equal(previous, before)) return fail(); write("transition", before, after) }
      const terminal = actual.kind === "completed" ? projectLeanPrivateBoardV1(actual.result.state) : previous
      write("terminal", previous, terminal)
    }
    fsyncSync(fd)
  } finally { closeSync(fd) }
  const parent = openSync(dirname(input.streamPath), constants.O_RDONLY | constants.O_NOFOLLOW); try { fsyncSync(parent) } finally { closeSync(parent) }
  const evidence = { boardEvidenceAvailable: rowCount > 0, fullChronicleVerified: false as const, streamRawRoot: `sha256:${hash.digest("hex")}` as LabRoot, streamBytes, rowCount, transitionCount: actual.transitions.length, startBoardRoot, finalBoardRoot, lastFrameRoot, accountingRows, accountingRoot, executionRoot: compact.executionRoot, semanticRoot: input.semanticRoot, classification: compact.classification, code: compact.code, outcome: compact.outcome, cleanupComplete: compact.cleanupComplete, invocationCount: compact.invocationCount, telemetry: compact.telemetry }
  if (canonical(evidence).length > 16777216) return fail(); return evidence
}
const evidenceKeys = ["boardEvidenceAvailable", "fullChronicleVerified", "streamRawRoot", "streamBytes", "rowCount", "transitionCount", "startBoardRoot", "finalBoardRoot", "lastFrameRoot", "accountingRows", "accountingRoot", "executionRoot", "semanticRoot", "classification", "code", "outcome", "cleanupComplete", "invocationCount", "telemetry"]
/** A raw retained prefix is not a completed board chain. No parsing or copying
 * private/error payloads is needed to commit its actual bytes. */
const retainedStream = (path: string) => {
  try { lstatSync(path) } catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return null; throw error }
  const stat = lstatSync(path)
  if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1 || (stat.mode & 0o777) !== 0o600 || stat.size > 67108864 || realpathSync(path) !== resolve(path) || stat.uid !== process.getuid?.()) return fail()
  const fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW), hash = createHash("sha256"), buffer = Buffer.alloc(8192)
  let bytes = 0
  try {
    const opened = fstatSync(fd); if (opened.ino !== stat.ino || opened.dev !== stat.dev || opened.size !== stat.size) return fail()
    for (;;) { const count = readSync(fd, buffer, 0, buffer.length, null); if (!count) break; hash.update(buffer.subarray(0, count)); bytes += count; if (bytes > 67108864) return fail() }
    const after = fstatSync(fd); if (bytes !== stat.size || after.size !== stat.size || after.ctimeMs !== stat.ctimeMs || after.mtimeMs !== stat.mtimeMs) return fail()
  } finally { closeSync(fd) }
  return { rawRoot: `sha256:${hash.digest("hex")}` as LabRoot, bytes }
}
export const createLeanPrivateMatchFailureV1 = (input: { binding: EvidenceBinding; streamPath: string; result?: Awaited<ReturnType<typeof runLeanPrivateFeasibilityMatch>>; cleanupComplete: boolean | null }) => {
  const result = input.result
  let observed: Record<string, unknown> | null = null
  if (result?.privateActual && result.privateProviderIdentities) {
    if (!root(result.compact.accountingRoot) || !root(result.compact.executionRoot) || !integer(result.compact.invocationCount, 49600) || result.semanticRoot !== null && !root(result.semanticRoot)) return fail()
    let accountingRows: Record<string, unknown>[] | null = null
    try {
      if (result.privateActual.accounting.length > 49600) return fail()
      const rows = result.privateActual.accounting.map(a => ({ identity: projectIdentity(a.identity), invocationRoot: a.invocationRoot, requestId: a.requestId, method: a.method, inputRoot: a.inputRoot, ordinal: a.ordinal, charged: a.charged, completed: a.completed, outputBytes: a.outputBytes, classification: a.result.ok ? "success" : "systemFailure" in a.result ? "system_failure" : "player_violation" }))
      checkAccounting(rows, input.binding, false)
      if (labRoot("lean-accounting-v1", deriveFactoryOrderedRecordDescriptor("lean-accounting", rows)) !== result.compact.accountingRoot || result.compact.invocationCount !== rows.length) return fail()
      if (canonical(rows).length <= 16000000) accountingRows = rows
    } catch { /* Retain actual opaque commitments; row qualification unavailable. */ }
    observed = { accountingRows, accountingRoot: result.compact.accountingRoot, executionRoot: result.compact.executionRoot, semanticRoot: result.semanticRoot, invocationCount: result.compact.invocationCount, telemetry: { transitions: result.compact.telemetry.transitions, events: result.compact.telemetry.events } }
  }
  const partialStream = retainedStream(input.streamPath)
  return { schemaVersion: "lean-private-match-failure-v1", boardEvidenceAvailable: false, fullChronicleVerified: false, classification: "system_failure", code: "CHARGED_ATTEMPT_STOP", outcome: null, cleanupComplete: input.cleanupComplete, observed, partialStream, streamRawRoot: partialStream?.rawRoot ?? null, streamBytes: partialStream?.bytes ?? 0, rowCount: 0 }
}
const verifyFailure = (binding: EvidenceBinding, e: Record<string, any>, streamPath: string) => {
  if (!exactLabKeys(e, ["schemaVersion", "boardEvidenceAvailable", "fullChronicleVerified", "classification", "code", "outcome", "cleanupComplete", "observed", "partialStream", "streamRawRoot", "streamBytes", "rowCount"]) || e.schemaVersion !== "lean-private-match-failure-v1" || e.boardEvidenceAvailable !== false || e.fullChronicleVerified !== false || e.classification !== "system_failure" || e.code !== "CHARGED_ATTEMPT_STOP" || e.outcome !== null || ![null, true, false].includes(e.cleanupComplete) || e.rowCount !== 0 || !equal(e.partialStream, retainedStream(streamPath)) || e.streamRawRoot !== (e.partialStream?.rawRoot ?? null) || e.streamBytes !== (e.partialStream?.bytes ?? 0)) return fail()
  if (e.observed !== null) {
    const o = e.observed
    if (!exactLabKeys(o, ["accountingRows", "accountingRoot", "executionRoot", "semanticRoot", "invocationCount", "telemetry"]) || !root(o.executionRoot) || o.semanticRoot !== null && !root(o.semanticRoot) || !integer(o.invocationCount, 49600) || !exactLabKeys(o.telemetry, ["transitions", "events"]) || !integer(o.telemetry.transitions) || !integer(o.telemetry.events)) return fail()
    if (!root(o.accountingRoot)) return fail()
    if (o.accountingRows !== null) {
      checkAccounting(o.accountingRows, binding, false)
      if (o.invocationCount !== o.accountingRows.length || o.accountingRoot !== labRoot("lean-accounting-v1", deriveFactoryOrderedRecordDescriptor("lean-accounting", o.accountingRows))) return fail()
    }
  }
  for (const identity of binding.providerIdentities) checkIdentity(identity, binding)
  return { verified: true as const, fullChronicleVerified: false as const, finalBoardRoot: null }
}
/** Stop admission, but keep the already reserved closure budget. This does not
 * reuse the exhausted per-Match/success guard or reserve another Match. */
const finalizeResources = (store: string, a: LeanPrivateMatchAllocationV1, debitResources: Record<string, any>) => {
  const wallAtMs = Date.now(), w = LEAN_PRIVATE_MATCH_WINDOW_V1
  let newAllocatedBytes = lstatSync(store).blocks * 512
  for (const name of readdirSync(store)) {
    if (!/^(?:allocation\.json|entry\.json|ledger\.ndjson|result\.json|(?:pair|debit|terminal)-[01]\.json|replay-[01]\.ndjson)$/u.test(name)) return fail()
    const s = lstatSync(join(store, name)); if (!s.isFile() || s.isSymbolicLink() || s.nlink !== 1 || (s.mode & 0o777) !== 0o600 || s.size > (name.startsWith("replay-") ? 67108864 : name.startsWith("terminal-") ? 16777216 : 65536)) return fail()
    newAllocatedBytes += s.blocks * 512
  }
  const parentRssBytes = Math.max(process.memoryUsage().rss, process.resourceUsage().maxRSS * 1024), disk = statfsSync(store)
  const resources = { ...debitResources, wallAtMs, cumulativeElapsedMs: w.carryMs + wallAtMs - w.anchorMs, remainingSlots: 0, newAllocatedBytes, retainedBytesUpperBound: 29970432 + 65536 + a.sourcePrefix.allocatedBytes + newAllocatedBytes + 2 * (67108864 + 16777216) + 262144, parentRssBytes, aggregateMemoryUpperBound: parentRssBytes + 2 * 268435456 + 512000000 + 335544320, availableDiskBytes: disk.bavail * disk.bsize }
  if (resources.aggregateMemoryUpperBound + 16777216 > 3000000000 || process.memoryUsage().arrayBuffers + 16777216 > 2000000000 || !verifyLeanPrivateMatchResourcesV1(a, resources, 0)) return fail()
  return { schemaVersion: "lean-private-match-finalization-v1", priorResourcesRoot: labRoot("lean-private-match-prior-resources-v1", debitResources), observation: resources }
}
const terminalResources = (terminal: Record<string, any>) => {
  if (terminal.evidence?.schemaVersion !== "lean-private-match-failure-v1") return terminal.resources
  if (!exactLabKeys(terminal.resources, ["schemaVersion", "priorResourcesRoot", "observation"]) || terminal.resources.schemaVersion !== "lean-private-match-finalization-v1" || !root(terminal.resources.priorResourcesRoot)) return fail()
  return terminal.resources.observation
}
const checkBoardBinding = (board: LeanPrivateBoardV1, binding: EvidenceBinding, start: boolean): void => {
  const a = binding.allocation, arena = smoke(), bottom = player(a, binding.ordinal, "bottom"), top = player(a, binding.ordinal, "top"), bounds = arena.initialBounds
  if (board.matchId !== `lean-${binding.debitRoot.slice(7, 31)}` || ![bottom, top].includes(board.initiativePlayerId) || board.bounds.minX < bounds.minX || board.bounds.maxX > bounds.maxX || board.bounds.minY < bounds.minY || board.bounds.maxY > bounds.maxY || board.bounds.minX > board.bounds.maxX || board.bounds.minY > board.bounds.maxY) return fail()
  for (const position of [...board.soldiers.flatMap(s => s.position === null ? [] : [s.position]), ...board.terrainStones]) if (position.x < bounds.minX || position.x > bounds.maxX || position.y < bounds.minY || position.y > bounds.maxY) return fail()
  const roster = [...Array.from({ length: 8 }, (_, n) => ({ id: `bottom-soldier-${n + 1}`, owner: bottom })), ...Array.from({ length: 8 }, (_, n) => ({ id: `top-soldier-${n + 1}`, owner: top }))]
  if (roster.some(r => !board.soldiers.some(s => s.id === r.id && s.ownerPlayerId === r.owner))) return fail()
  if (board.outcome?.type === "WIN" && ![bottom, top].includes(board.outcome.winnerPlayerId)) return fail()
  if (start && (!equal(board.bounds, bounds) || !equal(board.terrainStones, canonicalReplayTerrain(arena.terrainStones)) || board.phase !== "ROUND" || board.phaseNumber !== 1 || board.roundNumber !== 1 || board.activationCount !== 1 || board.initiativePlayerId !== bottom || board.outcome !== null || board.soldiers.some(s => s.status !== "ACTIVE" || s.lastSuccessfulMoveDirection !== null || s.facing !== (s.ownerPlayerId === bottom ? "UP" : "DOWN")) || !equal(canonicalReplayTerrain(board.soldiers.filter(s => s.ownerPlayerId === bottom).map(s => s.position!)), canonicalReplayTerrain(BOTTOM_STARTING_POSITIONS)) || !equal(canonicalReplayTerrain(board.soldiers.filter(s => s.ownerPlayerId === top).map(s => s.position!)), canonicalReplayTerrain(TOP_STARTING_POSITIONS)))) return fail()
}
/** O_RDONLY, incremental rows, no provider/engine/compiler/store writes. */
const verifyLeanPrivateMatchEvidenceShared = (input: { binding: EvidenceBinding; evidence: unknown; streamPath: string }): Readonly<{ verified: true; fullChronicleVerified: false; finalBoardRoot: LabRoot | null }> => {
  if (!exactLabKeys(input.evidence, evidenceKeys)) return fail()
  const e = input.evidence as Record<string, any>, success = e.classification === "success"
  if (e.fullChronicleVerified !== false || typeof e.boardEvidenceAvailable !== "boolean" || !root(e.streamRawRoot) || !integer(e.streamBytes, 67108864) || !integer(e.rowCount, 65538) || !integer(e.transitionCount, 65536) || !["success", "system_failure", "player_violation"].includes(e.classification) || !["OK", "CLEANUP", "SUPERVISOR_FAILURE", "PLAYER_VIOLATION"].includes(e.code) || ![null, "DRAW", "bottom", "top"].includes(e.outcome) || typeof e.cleanupComplete !== "boolean" || !integer(e.invocationCount, 49600) || !exactLabKeys(e.telemetry, ["transitions", "events"]) || !integer(e.telemetry.events, 1000000) || e.telemetry.transitions !== e.transitionCount || !root(e.executionRoot) || e.semanticRoot !== null && !root(e.semanticRoot)) return fail()
  checkAccounting(e.accountingRows, input.binding, success)
  if (e.invocationCount !== e.accountingRows.length || e.accountingRoot !== labRoot("lean-accounting-v1", deriveFactoryOrderedRecordDescriptor("lean-accounting", e.accountingRows))) return fail()
  const path = resolve(input.streamPath), stat = lstatSync(path)
  if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1 || (stat.mode & 0o777) !== 0o600 || stat.size !== e.streamBytes || realpathSync(path) !== path || stat.uid !== process.getuid?.()) return fail()
  const fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW), hash = createHash("sha256"), buffer = Buffer.alloc(8192)
  let pending = Buffer.alloc(0), count = 0, lastFrameRoot: LabRoot | null = null, prior: LeanPrivateBoardV1 | null = null, startRoot: LabRoot | null = null
  const inspect = (bytes: Buffer) => {
    if (bytes.length + 1 > 65536) return fail()
    const row = JSON.parse(bytes.toString("utf8")) as Record<string, any>
    if (!bytes.equals(canonical(row)) || !exactLabKeys(row, ["schemaVersion", "allocationRoot", "debitRoot", "slotRoot", "ordinal", "index", "kind", "previousFrameRoot", "before", "beforeRoot", "after", "afterRoot", "frameRoot"])) return fail()
    const { frameRoot: fr, ...body } = row
    if (row.schemaVersion !== "lean-private-board-row-v1" || row.allocationRoot !== input.binding.allocation.root || row.debitRoot !== input.binding.debitRoot || row.slotRoot !== input.binding.allocation.slots[input.binding.ordinal]!.root || row.ordinal !== input.binding.ordinal || row.index !== count || row.previousFrameRoot !== lastFrameRoot || fr !== labRoot(row.schemaVersion, body) || row.kind !== (count === 0 ? "start" : count === e.rowCount - 1 ? "terminal" : "transition")) return fail()
    const before = row.before === null ? null : validateBoard(row.before), after = row.after === null ? null : validateBoard(row.after)
    if (!equal(before, prior) || row.beforeRoot !== stateRoot(before) || row.afterRoot !== stateRoot(after) || !after) return fail()
    checkBoardBinding(after, input.binding, count === 0)
    if (prior && (after.bounds.minX < prior.bounds.minX || after.bounds.maxX > prior.bounds.maxX || after.bounds.minY < prior.bounds.minY || after.bounds.maxY > prior.bounds.maxY)) return fail()
    if (count === 0) startRoot = row.afterRoot
    prior = after; lastFrameRoot = fr; count++
  }
  try {
    const opened = fstatSync(fd); if (opened.dev !== stat.dev || opened.ino !== stat.ino || opened.size !== stat.size || opened.nlink !== 1) return fail()
    for (;;) { const n = readSync(fd, buffer, 0, buffer.length, null); if (!n) break; const chunk = buffer.subarray(0, n); hash.update(chunk); pending = Buffer.concat([pending, chunk]); let end: number; while ((end = pending.indexOf(10)) !== -1) { inspect(pending.subarray(0, end)); pending = pending.subarray(end + 1) }; if (pending.length > 65536) return fail() }
    const after = fstatSync(fd); if (pending.length || after.size !== stat.size || after.ctimeMs !== stat.ctimeMs || after.mtimeMs !== stat.mtimeMs) return fail()
  } finally { closeSync(fd) }
  const final = prior as LeanPrivateBoardV1 | null
  if (e.streamRawRoot !== `sha256:${hash.digest("hex")}` || count !== e.rowCount || e.boardEvidenceAvailable !== (count > 0) || (count ? count !== e.transitionCount + 2 : e.transitionCount !== 0) || e.startBoardRoot !== startRoot || e.finalBoardRoot !== stateRoot(final) || e.lastFrameRoot !== lastFrameRoot || success && (!count || e.transitionCount === 0 || !e.cleanupComplete || e.code !== "OK" || final?.phase !== "COMPLETE" || final.outcome === null || e.outcome === null)) return fail()
  if (success) { const expected = final!.outcome!.type === "DRAW" ? "DRAW" : final!.outcome!.winnerPlayerId === player(input.binding.allocation, input.binding.ordinal, "bottom") ? "bottom" : "top"; if (e.outcome !== expected) return fail() }
  return { verified: true, fullChronicleVerified: false, finalBoardRoot: stateRoot(final) }
}
/** Shared terminal/result anchor checks used by the actual retained reader. */
const verifyLeanPrivateMatchTerminalShared = (input: { binding: EvidenceBinding; terminal: Record<string, any>; resultAnchor: Record<string, any>; streamPath: string }) => {
  const { binding, terminal: t, resultAnchor: anchor } = input
  const version = binding.allocation.schemaVersion === "lean-private-match-allocation-v2" ? "v2" : "v1"
  checkRoot(t, `lean-private-match-terminal-${version}`)
  const failure = t.evidence?.schemaVersion === `lean-private-match-failure-${version}`
  if (!exactLabKeys(t, ["schemaVersion", "allocationRoot", "debitRoot", "slotRoot", "ordinal", "elapsedMs", "resources", "providerIdentities", "evidence", "root"]) || t.schemaVersion !== `lean-private-match-terminal-${version}` || t.allocationRoot !== binding.allocation.root || t.debitRoot !== binding.debitRoot || t.slotRoot !== binding.allocation.slots[binding.ordinal]!.root || t.ordinal !== binding.ordinal || !integer(t.elapsedMs, failure ? 7200000 : 600000) || !equal(t.providerIdentities, binding.providerIdentities) || !exactLabKeys(anchor, ["ordinal", "root", "rawRoot", "streamRawRoot", "rowCount", "streamBytes"]) || anchor.ordinal !== binding.ordinal || anchor.root !== t.root || anchor.rawRoot !== leanBytesRoot(canonical(t)) || anchor.streamRawRoot !== t.evidence?.streamRawRoot || anchor.rowCount !== t.evidence?.rowCount || anchor.streamBytes !== t.evidence?.streamBytes || !(version === "v2" && binding.allocation.schemaVersion === "lean-private-match-allocation-v2" ? v2Authority.verifyLeanPrivateMatchResourcesV2(binding.allocation, terminalResourcesV2(t), 0) : binding.allocation.schemaVersion === "lean-private-match-allocation-v1" && verifyLeanPrivateMatchResourcesV1(binding.allocation, terminalResources(t), failure ? 0 : 1 - binding.ordinal))) return fail()
  if (failure) return version === "v2" ? verifyFailureV2(binding, t.evidence, input.streamPath) : verifyFailure(binding, t.evidence, input.streamPath)
  return version === "v2" ? verifyLeanPrivateMatchEvidenceV2({ binding, evidence: t.evidence, streamPath: input.streamPath }) : verifyLeanPrivateMatchEvidenceShared({ binding, evidence: t.evidence, streamPath: input.streamPath })
}

export const enterLeanPrivateMatchesV1 = async (command: Extract<LeanPrivateMatchesCommandV1, { command: "entry" | "verify" }>) => {
  if (command.command !== "entry") return fail()
  const store = resolve(command.store), a = validateLeanPrivateMatchAllocationV1(json(join(store, "allocation.json")))
  const admission = openLeanPrivateMatchAdmissionV1({ storePath: store, allocationCommit: command.allocationCommit, allocationPath: command.allocationPath, capacity: observeLeanPrivateMatchCapacityV1(store, a, 2) })
  const terminals: Array<Record<string, any>> = [], providers = new Set<{ identity?: LabRuntimeIdentity; close(): { cleanupComplete: boolean; orphanedChild: boolean } }>()
  let stopCode: null | "ADMISSION_STOP" | "CHARGED_ATTEMPT_STOP" | "CLEANUP_STOP" = null
  for (const ordinal of [0, 1] as const) {
    const began = performance.now()
    let debit: ReturnType<typeof recordLeanPrivateMatchDebitV1>
    try { debit = recordLeanPrivateMatchDebitV1(admission, ordinal, observeLeanPrivateMatchCapacityV1(store, a, 2 - ordinal)) }
    catch {
      stopCode = "ADMISSION_STOP"
      // A durable append can precede an authority's post-write refusal. Count
      // that actual debit, without inventing a handle or issuing either seat.
      const rows = readLeanPrivateMatchFileV1(join(store, "ledger.ndjson")).toString("utf8").split("\n").filter(Boolean).map(line => JSON.parse(line) as Record<string, any>), charged = rows.at(-1)
      if (charged?.ordinal === ordinal) {
        checkRoot(charged, "lean-private-match-debit-v1")
        if (charged.allocationRoot !== a.root || charged.slotRoot !== a.slots[ordinal].root || !equal(charged, json(join(store, `debit-${ordinal}.json`)))) return fail()
        stopCode = "CHARGED_ATTEMPT_STOP"
        const binding = { allocation: a, ordinal, debitRoot: charged.root as LabRoot, providerIdentities: [] }
        const evidence = createLeanPrivateMatchFailureV1({ binding, streamPath: join(store, `replay-${ordinal}.ndjson`), cleanupComplete: null })
        const terminal = rooted({ schemaVersion: "lean-private-match-terminal-v1", allocationRoot: a.root, debitRoot: charged.root, slotRoot: a.slots[ordinal].root, ordinal, elapsedMs: Math.ceil(performance.now() - began), resources: finalizeResources(store, a, charged.resources), providerIdentities: [], evidence })
        writeLeanPrivateMatchFileV1(join(store, `terminal-${ordinal}.json`), canonical(terminal), 16777216); terminals.push(terminal)
      }
      break
    }
    const context = readLeanPrivateMatchContextV1(admission, debit), slot = a.slots[ordinal]
    const guard = (bytes = 0) => { if (performance.now() - began >= 600000) return fail(); checkpointLeanPrivateMatchV1(admission, debit, bytes) }
    let result: Awaited<ReturnType<typeof runLeanPrivateFeasibilityMatch>> | undefined
    const issuedIdentities: LabRuntimeIdentity[] = [], streamPath = join(store, `replay-${ordinal}.ndjson`)
    let cleanupComplete: boolean | null = null, stopped = false
    try {
      try { result = await runLeanPrivateFeasibilityMatch({ admission, debit, bottom: readLeanBaselineSource(LEAN_PRIVATE_MATCH_SOURCE_STORE_V1, slot.bottomRole), top: readLeanBaselineSource(LEAN_PRIVATE_MATCH_SOURCE_STORE_V1, slot.topRole), register: provider => { providers.add(provider); const identity = (provider as { identity?: LabRuntimeIdentity }).identity; if (identity) issuedIdentities.push(identity) }, unregister: provider => { providers.delete(provider) } }) }
      finally { for (const provider of providers) { try { const closed = provider.close(); if (!closed.cleanupComplete || closed.orphanedChild) cleanupComplete = false } catch { cleanupComplete = false } }; providers.clear() }
      if (!result.privateActual || !result.privateProviderIdentities) return fail()
      cleanupComplete = cleanupComplete === false ? false : result.compact.cleanupComplete
      if (!cleanupComplete) return fail()
      const binding = { allocation: a, ordinal, debitRoot: context.debitRoot, providerIdentities: result.privateProviderIdentities }
      const evidence = produceLeanPrivateMatchEvidenceV1({ binding, actual: result.privateActual, compact: result.compact, semanticRoot: result.semanticRoot, streamPath, guard })
      verifyLeanPrivateMatchEvidenceV1({ binding, evidence, streamPath })
      guard()
      const terminal = rooted({ schemaVersion: "lean-private-match-terminal-v1", allocationRoot: a.root, debitRoot: context.debitRoot, slotRoot: slot.root, ordinal, elapsedMs: Math.ceil(performance.now() - began), resources: observeLeanPrivateMatchResourcesV1(store, a, 1 - ordinal), providerIdentities: binding.providerIdentities.map(projectIdentity), evidence })
      writeLeanPrivateMatchFileV1(join(store, `terminal-${ordinal}.json`), canonical(terminal), 16777216); terminals.push(terminal)
    } catch {
      stopped = true; stopCode = "CHARGED_ATTEMPT_STOP"
      const binding = { allocation: a, ordinal, debitRoot: context.debitRoot, providerIdentities: result?.privateProviderIdentities ?? issuedIdentities }
      const evidence = createLeanPrivateMatchFailureV1({ binding, streamPath, ...(result ? { result } : {}), cleanupComplete })
      const terminal = rooted({ schemaVersion: "lean-private-match-terminal-v1", allocationRoot: a.root, debitRoot: context.debitRoot, slotRoot: slot.root, ordinal, elapsedMs: Math.ceil(performance.now() - began), resources: finalizeResources(store, a, json(join(store, `debit-${ordinal}.json`)).resources), providerIdentities: binding.providerIdentities.map(projectIdentity), evidence })
      writeLeanPrivateMatchFileV1(join(store, `terminal-${ordinal}.json`), canonical(terminal), 16777216); terminals.push(terminal)
    }
    if (stopped) break
    try { if (!closeLeanPrivateMatchDebitV1(admission, debit)) { stopCode = "CLEANUP_STOP"; break } }
    catch { stopCode = "CLEANUP_STOP"; break }
  }
  const ledger = readLeanPrivateMatchFileV1(join(store, "ledger.ndjson")), debits = ledger.toString("utf8").split("\n").filter(Boolean).map(line => JSON.parse(line) as Record<string, any>)
  if (debits.length !== terminals.length || !equal(debits.map(d => d.ordinal), terminals.map(t => t.ordinal))) return fail()
  const result = rooted({ schemaVersion: "lean-private-match-result-v1", allocationRoot: a.root, sourceHead: a.sourceHead, allocationCommit: command.allocationCommit, matchCount: 2, attemptedOrdinals: debits.map(d => d.ordinal), unattemptedOrdinals: [0, 1].filter(n => !debits.some(d => d.ordinal === n)), cumulativeCharged: 40 + debits.length, terminals: terminals.map(t => ({ ordinal: t.ordinal, root: t.root, rawRoot: leanBytesRoot(canonical(t)), streamRawRoot: t.evidence.streamRawRoot, rowCount: t.evidence.rowCount, streamBytes: t.evidence.streamBytes })), stopCode, fullChronicleVerified: false })
  finalizeResources(store, a, debits.at(-1)?.resources ?? json(join(store, "entry.json")).resources)
  writeLeanPrivateMatchFileV1(join(store, "result.json"), canonical(result)); return { resultRoot: result.root, attemptedCount: terminals.length, fullChronicleVerified: false }
}
export const verifyLeanPrivateMatchesStoreV1 = (command: Extract<LeanPrivateMatchesCommandV1, { command: "entry" | "verify" }>) => {
  if (command.command !== "verify") return fail()
  const store = resolve(command.store), directory = lstatSync(store)
  if (!directory.isDirectory() || directory.isSymbolicLink() || (directory.mode & 0o777) !== 0o700 || realpathSync(store) !== store || directory.uid !== process.getuid?.()) return fail()
  const a = validateLeanPrivateMatchAllocationV1(json(join(store, "allocation.json")))
  if (store !== resolve(".strategy-lab/lean-private-matches-v1", a.root.slice(7))) return fail()
  authenticateLeanPrivateMatchCommitV1(a, canonical(a), command.allocationCommit, command.allocationPath)
  for (const s of a.sources) if (!equal({ ...s, executableRoot: null }, inspectLeanPrivateMatchSourceV1(LEAN_PRIVATE_MATCH_SOURCE_STORE_V1, s.role))) return fail()
  if (!equal(a.sourcePrefix, inspectLeanPrivateMatchPrefixV1(a.sourceHead))) return fail()
  if (!equal(a.priorProbeCarry, authenticateLeanPrivateMatchProbeCarryV1())) return fail()
  const entry = json(join(store, "entry.json")), result = json(join(store, "result.json")), ledger = readLeanPrivateMatchFileV1(join(store, "ledger.ndjson")), rows = ledger.toString("utf8").split("\n").filter(Boolean).map(line => JSON.parse(line) as Record<string, any>)
  checkRoot(entry, "lean-private-match-entry-v1"); checkRoot(result, "lean-private-match-result-v1")
  if (!verifyLeanPrivateMatchResourcesV1(a, entry.resources, 2) || Date.now() > LEAN_PRIVATE_MATCH_WINDOW_V1.deadlineMs) return fail()
  if (!exactLabKeys(entry, ["schemaVersion", "allocationRoot", "allocationDigest", "allocationCommit", "sourceHead", "resources", "root"]) || entry.allocationRoot !== a.root || entry.allocationCommit !== command.allocationCommit || entry.sourceHead !== a.sourceHead || entry.allocationDigest !== leanBytesRoot(canonical(a)) || !exactLabKeys(result, ["schemaVersion", "allocationRoot", "sourceHead", "allocationCommit", "matchCount", "attemptedOrdinals", "unattemptedOrdinals", "cumulativeCharged", "terminals", "stopCode", "fullChronicleVerified", "root"]) || result.allocationRoot !== a.root || result.sourceHead !== a.sourceHead || result.allocationCommit !== command.allocationCommit || result.matchCount !== 2 || result.fullChronicleVerified !== false || !([null, "ADMISSION_STOP", "CHARGED_ATTEMPT_STOP", "CLEANUP_STOP"] as unknown[]).includes(result.stopCode) || rows.length > 2 || !equal(result.attemptedOrdinals, rows.map((_, n) => n)) || !equal(result.unattemptedOrdinals, [0, 1].filter(n => n >= rows.length)) || result.cumulativeCharged !== 40 + rows.length || !Array.isArray(result.terminals) || result.terminals.length !== rows.length || !ledger.equals(Buffer.concat(rows.map(r => Buffer.concat([canonical(r), Buffer.from("\n")]))))) return fail()
  let prefix = Buffer.alloc(0), priorSuccess = true
  for (const [ordinal, row] of rows.entries()) {
    const slot = a.slots[ordinal]!, pair = json(join(store, `pair-${ordinal}.json`)), debit = json(join(store, `debit-${ordinal}.json`)), terminal = json(join(store, `terminal-${ordinal}.json`), 16777216), anchor = result.terminals[ordinal]
    checkRoot(pair, "lean-private-match-pair-v1"); checkRoot(debit, "lean-private-match-debit-v1"); checkRoot(terminal, "lean-private-match-terminal-v1")
    const failed = terminal.evidence?.schemaVersion === "lean-private-match-failure-v1"
    const observedResources = terminalResources(terminal)
    if (!verifyLeanPrivateMatchResourcesV1(a, debit.resources, 2 - ordinal) || !verifyLeanPrivateMatchResourcesV1(a, observedResources, failed ? 0 : 1 - ordinal) || observedResources.wallAtMs < debit.resources.wallAtMs || debit.resources.wallAtMs < entry.resources.wallAtMs || failed && terminal.resources.priorResourcesRoot !== labRoot("lean-private-match-prior-resources-v1", debit.resources)) return fail()
    if (!priorSuccess || !equal(row, debit) || !exactLabKeys(pair, ["schemaVersion", "allocationRoot", "slotRoot", "ordinal", "requestRoot", "sources", "priorLedgerBytesRoot", "priorLedgerByteLength", "root"]) || pair.allocationRoot !== a.root || pair.slotRoot !== slot.root || pair.ordinal !== ordinal || pair.requestRoot !== slot.requestRoot || !equal(pair.sources, a.sources) || pair.priorLedgerBytesRoot !== leanBytesRoot(prefix) || pair.priorLedgerByteLength !== prefix.length || !exactLabKeys(debit, ["schemaVersion", "allocationRoot", "slotRoot", "ordinal", "requestRoot", "pairRoot", "cumulativeCharged", "priorLedgerBytesRoot", "priorLedgerByteLength", "resources", "root"]) || debit.allocationRoot !== a.root || debit.slotRoot !== slot.root || debit.ordinal !== ordinal || debit.requestRoot !== slot.requestRoot || debit.pairRoot !== pair.root || debit.cumulativeCharged !== 41 + ordinal || debit.priorLedgerBytesRoot !== leanBytesRoot(prefix) || debit.priorLedgerByteLength !== prefix.length || !exactLabKeys(terminal, ["schemaVersion", "allocationRoot", "debitRoot", "slotRoot", "ordinal", "elapsedMs", "resources", "providerIdentities", "evidence", "root"]) || terminal.allocationRoot !== a.root || terminal.debitRoot !== debit.root || terminal.slotRoot !== slot.root || terminal.ordinal !== ordinal || !integer(terminal.elapsedMs, failed ? 7200000 : 600000) || !Array.isArray(terminal.providerIdentities) || (failed ? terminal.providerIdentities.length > 2 : terminal.providerIdentities.length !== 2) || !exactLabKeys(anchor, ["ordinal", "root", "rawRoot", "streamRawRoot", "rowCount", "streamBytes"]) || anchor.ordinal !== ordinal || anchor.root !== terminal.root || anchor.rawRoot !== leanBytesRoot(canonical(terminal)) || anchor.streamRawRoot !== terminal.evidence.streamRawRoot || anchor.rowCount !== terminal.evidence.rowCount || anchor.streamBytes !== terminal.evidence.streamBytes) return fail()
    verifyLeanPrivateMatchTerminalV1({ binding: { allocation: a, ordinal: ordinal as 0 | 1, debitRoot: debit.root, providerIdentities: terminal.providerIdentities }, terminal, resultAnchor: anchor, streamPath: join(store, `replay-${ordinal}.ndjson`) })
    priorSuccess = terminal.evidence.classification === "success" && terminal.evidence.cleanupComplete === true
    prefix = Buffer.concat([prefix, canonical(row), Buffer.from("\n")])
  }
  const wanted = ["allocation.json", "entry.json", "ledger.ndjson", "result.json", ...rows.flatMap((_, n) => [`pair-${n}.json`, `debit-${n}.json`, `terminal-${n}.json`, ...(json(join(store, `terminal-${n}.json`), 16777216).evidence.streamRawRoot === null ? [] : [`replay-${n}.ndjson`])])].sort()
  if (!equal(readdirSync(store).sort(), wanted)) return fail()
  if (result.stopCode === null && (rows.length !== 2 || !priorSuccess) || result.stopCode === "CHARGED_ATTEMPT_STOP" && priorSuccess) return fail()
  return { verified: true, resultRoot: result.root as LabRoot, attemptedCount: rows.length, stopCode: result.stopCode, fullChronicleVerified: false, feasibilityEstablished: rows.length === 2 && priorSuccess && result.stopCode === null }
}
export const produceLeanPrivateMatchEvidenceV1 = (input: Parameters<typeof produceLeanPrivateMatchEvidenceShared>[0]) => {
  if (input.binding.allocation.schemaVersion !== "lean-private-match-allocation-v1") return fail()
  return produceLeanPrivateMatchEvidenceShared(input)
}
export const verifyLeanPrivateMatchEvidenceV1 = (input: Parameters<typeof verifyLeanPrivateMatchEvidenceShared>[0]) => {
  if (input.binding.allocation.schemaVersion !== "lean-private-match-allocation-v1") return fail()
  return verifyLeanPrivateMatchEvidenceShared(input)
}
export const verifyLeanPrivateMatchTerminalV1 = (input: Parameters<typeof verifyLeanPrivateMatchTerminalShared>[0]) => {
  if (input.binding.allocation.schemaVersion !== "lean-private-match-allocation-v1") return fail()
  return verifyLeanPrivateMatchTerminalShared(input)
}
const diagnosticKeysV2 = ["schemaVersion", "availability", "originAvailability", "stage", "reason", "code", "identity", "invocationRoot", "requestId", "inputRoot", "method", "ordinal"]
const startupReceiptKeysV1 = ["schemaVersion", "availability", "identity", "origin", "invocationBinding"]
const startupInvocationKeysV1 = ["schemaVersion", "method", "requestOrdinal", "requestRoot", "payloadRoot", "inputRoot", "executableRoot", "sourceRoot", "seat", "requestId", "ordinal", "invocationRoot"]
/** Transient private request material only: never serialized, retained, or
 * accepted as an origin/root assertion. Existing transport encoding recomputes
 * commitments which must independently join admitted source and failed rows. */
type PrivateStartupRequestV1 = Parameters<typeof leanCorrectionInvocationTransportBinding>[0]
type PrivateStartupValidationV1 = { binding: EvidenceBinding; accounting: LabMatchExecution["accounting"]; trustedRequest?: PrivateStartupRequestV1 }
const unavailableStartupReceiptV1 = () => ({ schemaVersion: "lean-private-startup-receipt-v1" as const, availability: "unavailable" as const, identity: null, origin: null, invocationBinding: null })
const projectStartupOriginV1 = (o: LeanStartupOriginV8) => ({ schemaVersion: o.schemaVersion, allocationRoot: o.allocationRoot, chargeRoot: o.chargeRoot, seat: o.seat, policyRoot: o.policyRoot, harnessRoot: o.harnessRoot, requestOrdinal: o.requestOrdinal, requestRoot: o.requestRoot, method: o.method, inputRoot: o.inputRoot, sourceRoot: o.sourceRoot, executableRoot: o.executableRoot, stage: o.stage, branch: o.branch, ready: o.ready, go: o.go, wait: o.wait, termination: o.termination, unknown: o.unknown, constructorDurationBucket: o.constructorDurationBucket, prefixMilestone: o.prefixMilestone, readyPublicationDurationBucket: o.readyPublicationDurationBucket, finalAtomicState: o.finalAtomicState, lifecycleBeforeTermination: o.lifecycleBeforeTermination, deadlineOutcome: o.deadlineOutcome })
/** Dormant finite validator. No CLI/persistence/reader dispatch calls this API. */
export const verifyLeanPrivateStartupReceiptV1 = (input: PrivateStartupValidationV1 & { value: unknown }): Readonly<{ verified: true }> => {
  const { binding, accounting, value } = input
  if (binding.allocation.schemaVersion !== "lean-private-match-allocation-v2" || binding.ordinal !== 0 || !exactLabKeys(value, startupReceiptKeysV1) || canonical(value).byteLength > 4096 || !Array.isArray(accounting)) return fail()
  v2Authority.validateLeanPrivateMatchAllocationV2(binding.allocation)
  if (binding.providerIdentities.length !== binding.allocation.sources.length || new Set(binding.providerIdentities.map(p => p.sourceRoot)).size !== binding.allocation.sources.length) return fail()
  for (const identity of binding.providerIdentities) checkIdentity(identity, binding)
  const rows = accounting.map(e => ({ identity: projectIdentity(e.identity), invocationRoot: e.invocationRoot, requestId: e.requestId, method: e.method, inputRoot: e.inputRoot, ordinal: e.ordinal, charged: e.charged, completed: e.completed, outputBytes: e.outputBytes, classification: e.result.ok ? "success" : "systemFailure" in e.result ? "system_failure" : "player_violation" }))
  checkAccounting(rows, binding, false)
  const v = value as Record<string, any>
  if (v.schemaVersion !== "lean-private-startup-receipt-v1" || !["available", "unavailable"].includes(v.availability)) return fail()
  if (v.availability === "unavailable") { if (!equal(v, unavailableStartupReceiptV1())) return fail(); return { verified: true } }
  if (!v.identity || !v.origin || !exactLabKeys(v.invocationBinding, startupInvocationKeysV1)) return fail()
  const failed = accounting.filter(e => e.charged && !e.result.ok && "systemFailure" in e.result)
  if (failed.length !== 1) return fail()
  const e = failed[0]!, b = v.invocationBinding
  if (e.result.ok || !("systemFailure" in e.result) || !(SUBPROCESS_SYSTEM_FAILURE_CODES as readonly string[]).includes(e.result.systemFailure.code) || b.schemaVersion !== "v1.38-lean-correction-invocation-binding-v8" || !integer(b.ordinal, 24799) || !integer(b.requestOrdinal, 24800) || b.requestOrdinal !== b.ordinal + 1 || !["bottom", "top"].includes(b.seat)) return fail()
  checkIdentity(v.identity, binding)
  for (const key of ["identity", "invocationRoot", "requestId", "inputRoot", "method", "ordinal"]) if (!equal(key === "identity" ? v.identity : b[key], key === "identity" ? projectIdentity(e.identity) : e[key as keyof typeof e])) return fail()
  for (const key of ["sourceRoot", "executableRoot"]) if (b[key] !== v.identity[key]) return fail()
  const slot = binding.allocation.slots[0], seatRole = b.seat === "bottom" ? slot.bottomRole : slot.topRole
  if (!binding.allocation.sources.some(s => s.role === seatRole && s.sourceRoot === v.identity.sourceRoot && s.executableRoot === v.identity.executableRoot)) return fail()
  const q = input.trustedRequest
  if (!q || !exactLabKeys(q, ["source", "methodName", "input", "outputByteLimit", "requestOrdinal"]) || typeof q.source !== "string" || q.outputByteLimit !== 262144 || q.methodName !== e.method || q.requestOrdinal !== e.ordinal + 1) return fail()
  const transport = leanCorrectionInvocationTransportBinding(q, "v8")
  if (transport.executableRoot !== v.identity.executableRoot || transport.inputRoot !== e.inputRoot || transport.requestRoot !== b.requestRoot || transport.payloadRoot !== b.payloadRoot) return fail()
  const origin = validateLeanStartupOriginV8(v.origin, { allocationRoot: binding.allocation.root, chargeRoot: binding.debitRoot, seat: b.seat, policyRoot: LEAN_STARTUP_POLICY_V5.root, harnessRoot: binding.allocation.harnessRoot, requestOrdinal: transport.requestOrdinal, requestRoot: transport.requestRoot as LabRoot, method: transport.method, inputRoot: transport.inputRoot, sourceRoot: e.identity.sourceRoot, executableRoot: transport.executableRoot })
  // Independent binding reconstruction uses trusted accounting fields, not
  // the old generic diagnostic or caller assertions of issued provenance.
  const diagnostic = { stage: "executor", reason: "unknown", identity: e.identity, invocationRoot: e.invocationRoot, requestId: e.requestId, inputRoot: e.inputRoot, method: e.method, ordinal: e.ordinal } as Parameters<typeof bindLeanCorrectionInvocation>[3]
  if (!equal(bindLeanCorrectionInvocation(origin, transport, e, diagnostic, b.seat), b)) return fail()
  return { verified: true }
}
/** Genuine composer return is the only provenance key; no receipt override. */
export const produceLeanPrivateStartupReceiptV1 = (input: { binding: EvidenceBinding; result: Awaited<ReturnType<typeof runLeanPrivateFeasibilityMatchV2>>; trustedRequest?: PrivateStartupRequestV1 }) => {
  const receipt = readLeanPrivateStartupReceiptV1(input.result)
  if (!receipt || !input.result.privateActual || !input.result.privateProviderIdentities || !equal(input.result.privateProviderIdentities, input.binding.providerIdentities)) return fail()
  const b = receipt.invocationBinding
  const value = receipt.availability === "available" && b ? { schemaVersion: "lean-private-startup-receipt-v1" as const, availability: "available" as const, identity: projectIdentity(receipt.identity), origin: projectStartupOriginV1(receipt.origin), invocationBinding: { schemaVersion: b.schemaVersion, method: b.method, requestOrdinal: b.requestOrdinal, requestRoot: b.requestRoot, payloadRoot: b.payloadRoot, inputRoot: b.inputRoot, executableRoot: b.executableRoot, sourceRoot: b.sourceRoot, seat: b.seat, requestId: b.requestId, ordinal: b.ordinal, invocationRoot: b.invocationRoot } } : unavailableStartupReceiptV1()
  verifyLeanPrivateStartupReceiptV1({ value, binding: input.binding, accounting: input.result.privateActual.accounting, ...(input.trustedRequest ? { trustedRequest: input.trustedRequest } : {}) })
  return value
}
const unavailableDiagnosticV2 = () => ({ schemaVersion: "lean-private-match-diagnostic-v2", availability: "unavailable", originAvailability: "unavailable", stage: "unknown", reason: "unknown", code: "UNKNOWN", identity: null, invocationRoot: null, requestId: null, inputRoot: null, method: null, ordinal: null })
const projectDiagnosticV2 = (returned: object | undefined) => {
  const d = returned && readLeanPrivateMatchDiagnosticV2(returned)
  return d ? { schemaVersion: "lean-private-match-diagnostic-v2", ...d, identity: d.identity && projectIdentity(d.identity) } : unavailableDiagnosticV2()
}
const verifyDiagnosticV2 = (binding: EvidenceBinding, value: unknown, rows: readonly Record<string, any>[]) => {
  if (!exactLabKeys(value, diagnosticKeysV2) || canonical(value).length > 4096) return fail()
  const d = value as Record<string, any>
  if (d.schemaVersion !== "lean-private-match-diagnostic-v2" || !["available", "unavailable"].includes(d.availability) || !["available", "unavailable"].includes(d.originAvailability)) return fail()
  const failed = rows.filter(r => r.charged === true && r.classification === "system_failure")
  if (d.availability === "unavailable") { if (!equal(d, unavailableDiagnosticV2()) || failed.length) return fail(); return }
  if (failed.length !== 1 || !(SUBPROCESS_SYSTEM_FAILURE_CODES as readonly string[]).includes(d.code) || !root(d.invocationRoot) || !root(d.inputRoot) || !integer(d.ordinal, 24799) || typeof d.requestId !== "string" || Buffer.byteLength(d.requestId) > 256 || !["selectActivations", "soldierBrain"].includes(d.method)) return fail()
  checkIdentity(d.identity, binding)
  const row = failed[0]!
  for (const key of ["identity", "invocationRoot", "requestId", "inputRoot", "method", "ordinal"]) if (!equal(d[key], row[key])) return fail()
  if (d.originAvailability === "unavailable" ? d.stage !== "unknown" || d.reason !== "unknown" : !isLeanPrivateFailureOrigin({ stage: d.stage, reason: d.reason })) return fail()
}
export const produceLeanPrivateMatchEvidenceV2 = (input: { binding: EvidenceBinding; result: Awaited<ReturnType<typeof runLeanPrivateFeasibilityMatchV2>>; streamPath: string; guard: (bytes?: number) => void }) => {
  if (input.binding.allocation.schemaVersion !== "lean-private-match-allocation-v2" || !input.result.privateActual || !input.result.privateProviderIdentities || !equal(input.result.privateProviderIdentities, input.binding.providerIdentities) || !readLeanPrivateMatchDiagnosticV2(input.result)) return fail()
  const evidence = produceLeanPrivateMatchEvidenceShared({ binding: input.binding, actual: input.result.privateActual, compact: input.result.compact, semanticRoot: input.result.semanticRoot, streamPath: input.streamPath, guard: input.guard })
  const diagnostic = projectDiagnosticV2(input.result)
  verifyDiagnosticV2(input.binding, diagnostic, evidence.accountingRows)
  return { schemaVersion: "lean-private-match-evidence-v2", ...evidence, diagnostic }
}
export const verifyLeanPrivateMatchEvidenceV2 = (input: Parameters<typeof verifyLeanPrivateMatchEvidenceShared>[0]) => {
  if (input.binding.allocation.schemaVersion !== "lean-private-match-allocation-v2" || !exactLabKeys(input.evidence, ["schemaVersion", ...evidenceKeys, "diagnostic"])) return fail()
  for (const identity of input.binding.providerIdentities) checkIdentity(identity, input.binding)
  const { schemaVersion, diagnostic, ...evidence } = input.evidence as Record<string, any>
  if (schemaVersion !== "lean-private-match-evidence-v2") return fail()
  verifyDiagnosticV2(input.binding, diagnostic, evidence.accountingRows)
  return verifyLeanPrivateMatchEvidenceShared({ ...input, evidence })
}
const createLeanPrivateMatchFailureV2 = (input: Parameters<typeof createLeanPrivateMatchFailureV1>[0]) => {
  if (input.binding.allocation.schemaVersion !== "lean-private-match-allocation-v2") return fail()
  const evidence = createLeanPrivateMatchFailureV1(input), diagnostic = projectDiagnosticV2(input.result)
  const rows = evidence.observed?.accountingRows
  if (!Array.isArray(rows) && diagnostic.availability === "available") return fail()
  verifyDiagnosticV2(input.binding, diagnostic, Array.isArray(rows) ? rows : [])
  return { ...evidence, schemaVersion: "lean-private-match-failure-v2", diagnostic }
}
const verifyFailureV2 = (binding: EvidenceBinding, e: Record<string, any>, streamPath: string) => {
  if (!exactLabKeys(e, ["schemaVersion", "boardEvidenceAvailable", "fullChronicleVerified", "classification", "code", "outcome", "cleanupComplete", "observed", "partialStream", "streamRawRoot", "streamBytes", "rowCount", "diagnostic"]) || e.schemaVersion !== "lean-private-match-failure-v2") return fail()
  const { diagnostic, ...body } = e
  verifyDiagnosticV2(binding, diagnostic, e.observed?.accountingRows ?? [])
  return verifyFailure(binding, { ...body, schemaVersion: "lean-private-match-failure-v1" }, streamPath)
}
const terminalResourcesV2 = (t: Record<string, any>) => {
  if (t.evidence?.schemaVersion !== "lean-private-match-failure-v2") return t.resources
  if (!exactLabKeys(t.resources, ["schemaVersion", "priorResourcesRoot", "observation"]) || t.resources.schemaVersion !== "lean-private-match-finalization-v2" || !root(t.resources.priorResourcesRoot)) return fail()
  return t.resources.observation
}
export const verifyLeanPrivateMatchTerminalV2 = (input: Parameters<typeof verifyLeanPrivateMatchTerminalShared>[0]) => {
  if (input.binding.allocation.schemaVersion !== "lean-private-match-allocation-v2" || input.binding.ordinal !== 0) return fail()
  return verifyLeanPrivateMatchTerminalShared(input)
}
export const parseLeanPrivateMatchesArgsV2 = (argv: readonly string[]): LeanPrivateMatchesCommandV1 => {
  const [raw, ...rest] = argv
  if (!["metadata-v2", "prepare-v2", "entry-v2", "verify-v2"].includes(raw ?? "") || rest.length % 2) return fail()
  const command = raw!.slice(0, -3), flags = new Map<string, string>()
  for (let n = 0; n < rest.length; n += 2) { const k = rest[n]!, v = rest[n + 1]!; if (flags.has(k) || !v || v.startsWith("--")) return fail(); flags.set(k, v) }
  const allowed = command === "metadata" ? ["--source-store"] : command === "prepare" ? ["--source-store", "--source-head", "--candidate-raw-root", "--opponent-raw-root"] : ["--allocation-commit", "--allocation-path", "--store"]
  if (flags.size !== allowed.length || [...flags.keys()].some(k => !allowed.includes(k))) return fail()
  const get = (k: string) => flags.get(`--${k}`)!
  if (command === "metadata" || command === "prepare") {
    if (get("source-store") !== LEAN_PRIVATE_MATCH_SOURCE_STORE_V1) return fail()
    if (command === "metadata") return { command, sourceStore: get("source-store") }
    if (!/^[a-f0-9]{40}$/u.test(get("source-head")) || !root(get("candidate-raw-root")) || !root(get("opponent-raw-root"))) return fail()
    return { command, sourceStore: get("source-store"), sourceHead: get("source-head"), candidateRawRoot: get("candidate-raw-root") as LabRoot, opponentRawRoot: get("opponent-raw-root") as LabRoot }
  }
  if (!/^[a-f0-9]{40}$/u.test(get("allocation-commit")) || get("allocation-path") !== v2Authority.LEAN_PRIVATE_MATCH_ARTIFACT_V2 || !/^\.strategy-lab\/lean-private-matches-v2\/[a-f0-9]{64}$/u.test(get("store"))) return fail()
  return { command: command as "entry" | "verify", allocationCommit: get("allocation-commit"), allocationPath: get("allocation-path"), store: get("store") }
}
export const createLeanPrivateMatchAllocationV2 = v2Authority.createLeanPrivateMatchAllocationV2
export const prepareLeanPrivateMatchesV2 = (command: Extract<LeanPrivateMatchesCommandV1, { command: "prepare" }>) => {
  const owned = ["scripts/run-v1-38-lean-private-matches.ts", "scripts/run-v1-38-lean-private-matches.test.ts", "scripts/lib/v1-38-lean-experiment-authority.ts", "scripts/lib/v1-38-lean-experiment-authority.test.ts", "scripts/lib/v1-38-lean-baseline-match.ts", "scripts/lib/v1-38-lean-baseline-match.test.ts", "scripts/lib/v1-38-lean-container-match-session.ts"]
  if (Date.now() < v2Authority.LEAN_PRIVATE_MATCH_WINDOW_V2.anchorMs || Date.now() + 1860000 + 600000 > v2Authority.LEAN_PRIVATE_MATCH_WINDOW_V2.deadlineMs || readLeanPrivateMatchGitV2(["rev-parse", "HEAD"]).toString("utf8").trim() !== command.sourceHead || readLeanPrivateMatchGitV2(["diff", "--name-only", "HEAD", "--", ...owned]).length) return fail()
  const metadata = (["tactical-0", "cold-opponent"] as const).map(role => inspectLeanPrivateMatchSourceV1(command.sourceStore, role))
  if (metadata[0]!.rawRoot !== command.candidateRawRoot || metadata[1]!.rawRoot !== command.opponentRawRoot) return fail()
  const compile = (m: LeanPrivateMatchSourceV1) => { const s = readLeanBaselineSource(command.sourceStore, m.role), defaults = defaultRuntimeMetadata("typescript"), revision = buildStrategyRevision({ source: s.source, runtime: { ...defaults, adapter: { ...defaults.adapter, id: "runtime-js-container-subprocess" } } }); if (!revision.validation.valid || !revision.metadata.sourceArtifact || s.root !== m.snapshotRoot || s.sourceRoot !== m.sourceRoot) return fail(); return { ...m, executableRoot: `sha256:${revision.metadata.sourceArtifact.hash}` as LabRoot } }
  const a = createLeanPrivateMatchAllocationV2({ sourceHead: command.sourceHead, sources: [compile(metadata[0]!), compile(metadata[1]!)], sourcePrefix: v2Authority.inspectLeanPrivateMatchPrefixV2(command.sourceHead), priorProbeCarry: authenticateLeanPrivateMatchProbeCarryV1(), priorMatchCarry: v2Authority.authenticateLeanPrivateMatchCarryV2() })
  const store = join(".strategy-lab/lean-private-matches-v2", a.root.slice(7)), path = resolve(store), parent = dirname(path)
  try { lstatSync(parent) } catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; mkdirSync(parent, { mode: 0o700 }) }
  if (realpathSync(parent) !== parent || (lstatSync(parent).mode & 0o777) !== 0o700) return fail()
  mkdirSync(path, { mode: 0o700 }); writeLeanPrivateMatchFileV1(join(path, "allocation.json"), canonical(a)); v2Authority.observeLeanPrivateMatchResourcesV2(path, a, 1)
  const artifact = canonical(a), fd = openSync(v2Authority.LEAN_PRIVATE_MATCH_ARTIFACT_V2, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY | constants.O_NOFOLLOW, 0o644)
  try { writeAll(fd, artifact); fsyncSync(fd) } finally { closeSync(fd) }
  const directory = openSync(dirname(v2Authority.LEAN_PRIVATE_MATCH_ARTIFACT_V2), constants.O_RDONLY | constants.O_NOFOLLOW); try { fsyncSync(directory) } finally { closeSync(directory) }
  return { allocationRoot: a.root, sourceHead: a.sourceHead, store, allocationPath: v2Authority.LEAN_PRIVATE_MATCH_ARTIFACT_V2 }
}
const finalizeResourcesV2 = (store: string, a: LeanPrivateMatchAllocationV2, prior: Record<string, any>) => {
  const wallAtMs = Date.now(), w = v2Authority.LEAN_PRIVATE_MATCH_WINDOW_V2
  let newAllocatedBytes = lstatSync(store).blocks * 512
  for (const name of readdirSync(store)) { if (!/^(?:allocation\.json|entry\.json|ledger\.ndjson|result\.json|(?:pair|debit|terminal)-0\.json|replay-0\.ndjson)$/u.test(name)) return fail(); const s = lstatSync(join(store, name)); if (!s.isFile() || s.isSymbolicLink() || s.nlink !== 1 || (s.mode & 0o777) !== 0o600 || s.size > (name === "replay-0.ndjson" ? 67108864 : name === "terminal-0.json" ? 16777216 : 65536)) return fail(); newAllocatedBytes += s.blocks * 512 }
  const parentRssBytes = Math.max(process.memoryUsage().rss, process.resourceUsage().maxRSS * 1024), disk = statfsSync(store)
  const observation = { ...prior, wallAtMs, cumulativeElapsedMs: w.carryMs + wallAtMs - w.anchorMs, remainingSlots: 0, newAllocatedBytes, retainedBytesUpperBound: 29970432 + 65536 + 360448 + a.sourcePrefix.allocatedBytes + newAllocatedBytes + 67108864 + 16777216 + 262144, parentRssBytes, aggregateMemoryUpperBound: parentRssBytes + 2 * 268435456 + 512000000 + 335544320, availableDiskBytes: disk.bavail * disk.bsize }
  if (observation.aggregateMemoryUpperBound + 16777216 > 3000000000 || process.memoryUsage().arrayBuffers + 16777216 > 2000000000 || !v2Authority.verifyLeanPrivateMatchResourcesV2(a, observation, 0)) return fail()
  return { schemaVersion: "lean-private-match-finalization-v2", priorResourcesRoot: labRoot("lean-private-match-prior-resources-v2", prior), observation }
}
export const enterLeanPrivateMatchesV2 = async (command: Extract<LeanPrivateMatchesCommandV1, { command: "entry" | "verify" }>) => {
  if (command.command !== "entry") return fail()
  const store = resolve(command.store), a = v2Authority.validateLeanPrivateMatchAllocationV2(json(join(store, "allocation.json")))
  const admission = v2Authority.openLeanPrivateMatchAdmissionV2({ storePath: store, allocationCommit: command.allocationCommit, allocationPath: command.allocationPath, capacity: v2Authority.observeLeanPrivateMatchCapacityV2(store, a, 1) })
  const began = performance.now(), providers = new Set<Pick<import("../packages/strategy-lab/src/factory/admission.js").FactorySupervisionProvider, "close">>(), identities: LabRuntimeIdentity[] = [], terminals: Record<string, any>[] = []
  let result: Awaited<ReturnType<typeof runLeanPrivateFeasibilityMatchV2>> | undefined, cleanupComplete: boolean | null = null, stopCode: null | "ADMISSION_STOP" | "CHARGED_ATTEMPT_STOP" | "CLEANUP_STOP" = null
  const streamPath = join(store, "replay-0.ndjson")
  let debit: v2Authority.LeanPrivateMatchDebitV2 | undefined
  try { debit = v2Authority.recordLeanPrivateMatchDebitV2(admission, 0, v2Authority.observeLeanPrivateMatchCapacityV2(store, a, 1)) } catch { stopCode = "ADMISSION_STOP" }
  const rows = readLeanPrivateMatchFileV1(join(store, "ledger.ndjson")).toString("utf8").split("\n").filter(Boolean).map(line => JSON.parse(line) as Record<string, any>)
  if (rows.length > 1) return fail()
  const charged = rows[0]
  if (charged) {
    checkRoot(charged, "lean-private-match-debit-v2")
    if (charged.ordinal !== 0 || charged.cumulativeCharged !== 42 || charged.allocationRoot !== a.root || charged.slotRoot !== a.slots[0].root || !equal(charged, json(join(store, "debit-0.json")))) return fail()
    let terminalPublicationStarted = false
    try {
      if (!debit) return fail()
      const context = v2Authority.readLeanPrivateMatchContextV2(admission, debit), guard = (bytes = 0) => { if (performance.now() - began >= 600000) return fail(); v2Authority.checkpointLeanPrivateMatchV2(admission, debit!, bytes) }
      result = await runLeanPrivateFeasibilityMatchV2({ admission, debit, bottom: readLeanBaselineSource(LEAN_PRIVATE_MATCH_SOURCE_STORE_V1, "tactical-0"), top: readLeanBaselineSource(LEAN_PRIVATE_MATCH_SOURCE_STORE_V1, "cold-opponent"), register: p => { providers.add(p); const identity = (p as { identity?: LabRuntimeIdentity }).identity; if (identity) identities.push(identity) }, unregister: p => { providers.delete(p) } })
      cleanupComplete = result.compact.cleanupComplete
      const binding = { allocation: a, ordinal: 0 as const, debitRoot: context.debitRoot, providerIdentities: result.privateProviderIdentities ?? identities }
      const evidence = produceLeanPrivateMatchEvidenceV2({ binding, result, streamPath, guard }); verifyLeanPrivateMatchEvidenceV2({ binding, evidence, streamPath }); guard()
      const terminal = rooted({ schemaVersion: "lean-private-match-terminal-v2", allocationRoot: a.root, debitRoot: charged.root, slotRoot: a.slots[0].root, ordinal: 0, elapsedMs: Math.ceil(performance.now() - began), resources: v2Authority.observeLeanPrivateMatchResourcesV2(store, a, 0), providerIdentities: binding.providerIdentities.map(projectIdentity), evidence })
      terminalPublicationStarted = true
      writeLeanPrivateMatchFileV1(join(store, "terminal-0.json"), canonical(terminal), 16777216); terminals.push(terminal)
      if (!v2Authority.closeLeanPrivateMatchDebitV2(admission, debit)) stopCode = "CLEANUP_STOP"
    } catch {
      // Never retry exclusive terminal creation after publication began. A
      // failed fsync/read-back is uncertain immutable evidence, not absence.
      if (terminalPublicationStarted && terminals.length === 0) return fail()
      stopCode = terminals.length ? "CLEANUP_STOP" : "CHARGED_ATTEMPT_STOP"
      for (const p of providers) { try { const c = p.close(); if (!c.cleanupComplete || c.orphanedChild) cleanupComplete = false } catch { cleanupComplete = false } }; providers.clear()
      if (!terminals.length) {
        const binding = { allocation: a, ordinal: 0 as const, debitRoot: charged.root as LabRoot, providerIdentities: result?.privateProviderIdentities ?? identities }, evidence = createLeanPrivateMatchFailureV2({ binding, streamPath, ...(result ? { result } : {}), cleanupComplete })
        const terminal = rooted({ schemaVersion: "lean-private-match-terminal-v2", allocationRoot: a.root, debitRoot: charged.root, slotRoot: a.slots[0].root, ordinal: 0, elapsedMs: Math.ceil(performance.now() - began), resources: finalizeResourcesV2(store, a, charged.resources), providerIdentities: binding.providerIdentities.map(projectIdentity), evidence })
        writeLeanPrivateMatchFileV1(join(store, "terminal-0.json"), canonical(terminal), 16777216); terminals.push(terminal)
      }
    } finally { for (const p of providers) { try { p.close() } catch { /* Charged failure remains failure. */ } }; providers.clear() }
  }
  if (rows.length !== terminals.length) return fail()
  const retained = rooted({ schemaVersion: "lean-private-match-result-v2", allocationRoot: a.root, sourceHead: a.sourceHead, allocationCommit: command.allocationCommit, matchCount: 1, attemptedOrdinals: rows.map(r => r.ordinal), unattemptedOrdinals: rows.length ? [] : [0], cumulativeCharged: 41 + rows.length, terminals: terminals.map(t => ({ ordinal: 0, root: t.root, rawRoot: leanBytesRoot(canonical(t)), streamRawRoot: t.evidence.streamRawRoot, rowCount: t.evidence.rowCount, streamBytes: t.evidence.streamBytes })), stopCode, fullChronicleVerified: false })
  finalizeResourcesV2(store, a, charged?.resources ?? json(join(store, "entry.json")).resources); writeLeanPrivateMatchFileV1(join(store, "result.json"), canonical(retained))
  return { resultRoot: retained.root, attemptedCount: rows.length, fullChronicleVerified: false }
}
export const verifyLeanPrivateMatchesStoreV2 = (command: Extract<LeanPrivateMatchesCommandV1, { command: "entry" | "verify" }>) => {
  if (command.command !== "verify") return fail()
  const store = resolve(command.store), directory = lstatSync(store)
  if (!directory.isDirectory() || directory.isSymbolicLink() || (directory.mode & 0o777) !== 0o700 || realpathSync(store) !== store || directory.uid !== process.getuid?.()) return fail()
  const a = v2Authority.validateLeanPrivateMatchAllocationV2(json(join(store, "allocation.json")))
  if (store !== resolve(".strategy-lab/lean-private-matches-v2", a.root.slice(7))) return fail()
  v2Authority.authenticateLeanPrivateMatchCommitV2(a, canonical(a), command.allocationCommit, command.allocationPath)
  if (!equal(a.priorMatchCarry, v2Authority.authenticateLeanPrivateMatchCarryV2()) || !equal(a.priorProbeCarry, authenticateLeanPrivateMatchProbeCarryV1()) || !equal(a.sourcePrefix, v2Authority.inspectLeanPrivateMatchPrefixV2(a.sourceHead))) return fail()
  for (const s of a.sources) if (!equal({ ...s, executableRoot: null }, inspectLeanPrivateMatchSourceV1(LEAN_PRIVATE_MATCH_SOURCE_STORE_V1, s.role))) return fail()
  const entry = json(join(store, "entry.json")), result = json(join(store, "result.json")), ledger = readLeanPrivateMatchFileV1(join(store, "ledger.ndjson")), rows = ledger.toString("utf8").split("\n").filter(Boolean).map(line => JSON.parse(line) as Record<string, any>)
  checkRoot(entry, "lean-private-match-entry-v2"); checkRoot(result, "lean-private-match-result-v2")
  if (Date.now() > v2Authority.LEAN_PRIVATE_MATCH_WINDOW_V2.deadlineMs || !exactLabKeys(entry, ["schemaVersion", "allocationRoot", "allocationDigest", "allocationCommit", "sourceHead", "resources", "root"]) || entry.schemaVersion !== "lean-private-match-entry-v2" || entry.allocationRoot !== a.root || entry.allocationDigest !== leanBytesRoot(canonical(a)) || entry.allocationCommit !== command.allocationCommit || entry.sourceHead !== a.sourceHead || !v2Authority.verifyLeanPrivateMatchResourcesV2(a, entry.resources, 1) || !exactLabKeys(result, ["schemaVersion", "allocationRoot", "sourceHead", "allocationCommit", "matchCount", "attemptedOrdinals", "unattemptedOrdinals", "cumulativeCharged", "terminals", "stopCode", "fullChronicleVerified", "root"]) || result.schemaVersion !== "lean-private-match-result-v2" || result.allocationRoot !== a.root || result.sourceHead !== a.sourceHead || result.allocationCommit !== command.allocationCommit || result.matchCount !== 1 || result.fullChronicleVerified !== false || ![null, "ADMISSION_STOP", "CHARGED_ATTEMPT_STOP", "CLEANUP_STOP"].includes(result.stopCode) || rows.length > 1 || !equal(result.attemptedOrdinals, rows.length ? [0] : []) || !equal(result.unattemptedOrdinals, rows.length ? [] : [0]) || result.cumulativeCharged !== 41 + rows.length || !Array.isArray(result.terminals) || result.terminals.length !== rows.length || !ledger.equals(Buffer.concat(rows.map(row => Buffer.concat([canonical(row), Buffer.from("\n")]))))) return fail()
  let success = false
  const wanted = ["allocation.json", "entry.json", "ledger.ndjson", "result.json"]
  if (rows.length) {
    const row = rows[0]!, pair = json(join(store, "pair-0.json")), debit = json(join(store, "debit-0.json")), terminal = json(join(store, "terminal-0.json"), 16777216), slot = a.slots[0]
    checkRoot(pair, "lean-private-match-pair-v2"); checkRoot(debit, "lean-private-match-debit-v2")
    if (!equal(row, debit) || !exactLabKeys(pair, ["schemaVersion", "allocationRoot", "slotRoot", "ordinal", "requestRoot", "sources", "priorLedgerBytesRoot", "priorLedgerByteLength", "root"]) || pair.schemaVersion !== "lean-private-match-pair-v2" || pair.allocationRoot !== a.root || pair.slotRoot !== slot.root || pair.ordinal !== 0 || pair.requestRoot !== slot.requestRoot || !equal(pair.sources, a.sources) || pair.priorLedgerBytesRoot !== leanBytesRoot(Buffer.alloc(0)) || pair.priorLedgerByteLength !== 0 || !exactLabKeys(debit, ["schemaVersion", "allocationRoot", "slotRoot", "ordinal", "requestRoot", "pairRoot", "cumulativeCharged", "priorLedgerBytesRoot", "priorLedgerByteLength", "resources", "root"]) || debit.schemaVersion !== "lean-private-match-debit-v2" || debit.allocationRoot !== a.root || debit.slotRoot !== slot.root || debit.ordinal !== 0 || debit.requestRoot !== slot.requestRoot || debit.pairRoot !== pair.root || debit.cumulativeCharged !== 42 || debit.priorLedgerBytesRoot !== leanBytesRoot(Buffer.alloc(0)) || debit.priorLedgerByteLength !== 0 || !v2Authority.verifyLeanPrivateMatchResourcesV2(a, debit.resources, 1) || debit.resources.wallAtMs < entry.resources.wallAtMs || terminalResourcesV2(terminal).wallAtMs < debit.resources.wallAtMs || terminal.evidence?.schemaVersion === "lean-private-match-failure-v2" && terminal.resources.priorResourcesRoot !== labRoot("lean-private-match-prior-resources-v2", debit.resources) || !Array.isArray(terminal.providerIdentities) || terminal.providerIdentities.length > 2) return fail()
    verifyLeanPrivateMatchTerminalV2({ binding: { allocation: a, ordinal: 0, debitRoot: debit.root, providerIdentities: terminal.providerIdentities }, terminal, resultAnchor: result.terminals[0], streamPath: join(store, "replay-0.ndjson") })
    success = terminal.evidence.classification === "success" && terminal.evidence.cleanupComplete === true
    wanted.push("pair-0.json", "debit-0.json", "terminal-0.json"); if (terminal.evidence.streamRawRoot !== null) wanted.push("replay-0.ndjson")
  }
  if (!equal(readdirSync(store).sort(), wanted.sort()) || result.stopCode === null && (!rows.length || !success) || result.stopCode === "CHARGED_ATTEMPT_STOP" && success) return fail()
  return { verified: true, resultRoot: result.root as LabRoot, attemptedCount: rows.length, stopCode: result.stopCode, fullChronicleVerified: false, feasibilityEstablished: rows.length === 1 && success && result.stopCode === null }
}
const main = async () => {
  const v2 = process.argv[2]?.endsWith("-v2") === true
  const command = v2 ? parseLeanPrivateMatchesArgsV2(process.argv.slice(2)) : parseLeanPrivateMatchesArgsV1(process.argv.slice(2))
  if (v2) { const result = command.command === "metadata" ? { sources: [inspectLeanPrivateMatchSourceV1(command.sourceStore, "tactical-0"), inspectLeanPrivateMatchSourceV1(command.sourceStore, "cold-opponent")] } : command.command === "prepare" ? prepareLeanPrivateMatchesV2(command) : command.command === "entry" ? await enterLeanPrivateMatchesV2(command) : verifyLeanPrivateMatchesStoreV2(command); process.stdout.write(`${JSON.stringify(result)}\n`); return }
  const result = command.command === "metadata" ? { sources: [inspectLeanPrivateMatchSourceV1(command.sourceStore, "tactical-0"), inspectLeanPrivateMatchSourceV1(command.sourceStore, "cold-opponent")] } : command.command === "prepare" ? prepareLeanPrivateMatchesV1(command) : command.command === "entry" ? await enterLeanPrivateMatchesV1(command) : verifyLeanPrivateMatchesStoreV1(command)
  process.stdout.write(`${JSON.stringify(result)}\n`)
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main().catch(() => { process.stderr.write("LEAN_PRIVATE_MATCH_ROUTE\n"); process.exitCode = 1 })
