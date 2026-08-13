import { Buffer } from "node:buffer"
import { createHash, createHmac } from "node:crypto"
import { execFileSync } from "node:child_process"
import {
  closeSync,
  constants,
  existsSync,
  fstatSync,
  fsyncSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  readSync,
  realpathSync,
  renameSync,
  unlinkSync,
  writeFileSync,
  writeSync,
} from "node:fs"
import path from "node:path"
// eslint-disable-next-line no-restricted-imports -- Offline integrity tooling uses the canonical privacy seam.
import { assertPublicOutputLeakSafe } from "../../packages/spec/src/public-output-privacy.js"
import { encodeCanonicalJson } from "../../packages/spec/src/canonical-json-encode.js"
import { hashCanonicalIdentity } from "../../packages/spec/src/canonical-identity-domains.js"
import type { JsonValue } from "../../packages/spec/src/types.js"

type Sha256 = `sha256:${string}`
type RecordValue = Record<string, unknown>

const SHA256 = /^sha256:[0-9a-f]{64}$/u
const OPERATOR = /^[a-z][a-z0-9-]{2,95}$/u
const REASON = /^[a-z][a-z0-9-]{2,95}$/u
const SECRET_RELATIVE_PATH = "input/commitment-secret.bin"
const COMMITMENT_PATH = "commitment/record.json"
const EVENT_PATH = "events/ledger.ndjson"
const STATE_PATH = "state/state.json"
const OPEN_REQUEST_PATH = "private/open-request.json"
const EVALUATION_PATH = "private/evaluation.json"
const PROJECTION_PATH = "private/safe-projection.json"
const LOCK_PATH = "state/command.lock"
const GIT_OBJECT = /^[0-9a-f]{40}$/u

const REQUEST_KEYS = Object.freeze([
  "schemaVersion", "assuranceClass", "repositoryOperator", "toolMediatedLedger",
  "operatorNoPrematureAccessDeclaration", "currentLeagueFreezeRoot", "coldCommonRoot",
  "profileManifestFreezeRoot", "preSearchPolicyRoot", "metricRoot", "classifierRoot",
  "thresholdRoot", "opponentRoot", "scheduleRoot", "finalistRoot", "kernelRoot",
  "runtimeRoot", "semanticRoot", "receiptAllowlistRoot", "contaminationPolicyRoot",
  "retirementPolicyRoot",
] as const)

const ROOT_KEYS = Object.freeze(REQUEST_KEYS.slice(5))

const isRecord = (value: unknown): value is RecordValue =>
  value !== null && typeof value === "object" && !Array.isArray(value)

const exactKeys = (value: RecordValue, expected: readonly string[]): boolean => {
  const actual = Object.keys(value).sort()
  const wanted = [...expected].sort()
  return actual.length === wanted.length && actual.every((key, index) => key === wanted[index])
}

const fail = (code: string): never => { throw new TypeError(code) }

const deepFreeze = <T>(value: T): Readonly<T> => {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as RecordValue)) deepFreeze(child)
    Object.freeze(value)
  }
  return value
}

const canonicalBytes = (value: unknown): Buffer => {
  const encoded = encodeCanonicalJson(value as JsonValue, { context: "canonical-manifest" })
  if (!encoded.ok) fail("V138_LOCAL_SEAL_CANONICAL_JSON_INVALID")
  return Buffer.from(encoded.bytes)
}

const domainRoot = (domain: string, value: unknown): Sha256 =>
  `sha256:${hashCanonicalIdentity("artifactManifest", [
    Buffer.from(domain, "utf8"), canonicalBytes(value),
  ])}`

const sha256 = (value: Uint8Array): Sha256 =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`

export interface V138LocalSealCheckoutIdentity {
  readonly sourceCommit: string
  readonly sourceTree: string
  readonly freezeCarrierIdentity: Sha256
  readonly currentLeagueFreezeRoot: Sha256
}

const git = (repoRoot: string, args: readonly string[]): Buffer => {
  try {
    return execFileSync("git", ["-C", repoRoot, ...args], {
      encoding: "buffer",
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 8 * 1024 * 1024,
    })
  } catch {
    return fail("V138_LOCAL_SEAL_GIT_UNAVAILABLE")
  }
}

const deriveCheckoutIdentity = (repoRootInput: string): Readonly<V138LocalSealCheckoutIdentity & { repoRoot: string }> => {
  if (typeof repoRootInput !== "string" || !path.isAbsolute(repoRootInput)) {
    fail("V138_LOCAL_SEAL_GIT_UNAVAILABLE")
  }
  const requestedRoot = realpathSync(path.resolve(repoRootInput))
  const resolvedRoot = git(requestedRoot, ["rev-parse", "--show-toplevel"]).toString("utf8").trim()
  if (!path.isAbsolute(resolvedRoot) || realpathSync(resolvedRoot) !== requestedRoot) {
    fail("V138_LOCAL_SEAL_GIT_ROOT_MISMATCH")
  }
  const sourceCommit = git(resolvedRoot, ["rev-parse", "--verify", "HEAD^{commit}"]).toString("utf8").trim()
  const sourceTree = git(resolvedRoot, ["rev-parse", "--verify", "HEAD^{tree}"]).toString("utf8").trim()
  if (!GIT_OBJECT.test(sourceCommit) || !GIT_OBJECT.test(sourceTree)) fail("V138_LOCAL_SEAL_GIT_IDENTITY_INVALID")
  const dirty = [
    git(resolvedRoot, ["diff", "--cached", "--name-only", "-z"]),
    git(resolvedRoot, ["diff", "--name-only", "-z"]),
    git(resolvedRoot, ["ls-files", "--others", "--exclude-standard", "-z"]),
  ]
  if (dirty.some((bytes) => bytes.byteLength !== 0)) fail("V138_LOCAL_SEAL_CHECKOUT_DIRTY")
  const freezeCarrierIdentity = domainRoot("cowards-game:v1.38:current-league-freeze-carrier:v2", {
    schemaVersion: "v1.38-current-league-freeze-carrier-v2",
    sourceCommit,
    sourceTree,
  })
  const currentLeagueFreezeRoot = domainRoot("cowards-game:v1.38:current-league-freeze:v2", {
    schemaVersion: "v1.38-current-league-freeze-v2",
    sourceCommit,
    sourceTree,
    freezeCarrierIdentity,
  })
  return deepFreeze({ repoRoot: resolvedRoot, sourceCommit, sourceTree, freezeCarrierIdentity, currentLeagueFreezeRoot })
}

export const deriveV138LocalSealCheckoutIdentity = (repoRoot: string): Readonly<V138LocalSealCheckoutIdentity> => {
  const { sourceCommit, sourceTree, freezeCarrierIdentity, currentLeagueFreezeRoot } = deriveCheckoutIdentity(repoRoot)
  return deepFreeze({ sourceCommit, sourceTree, freezeCarrierIdentity, currentLeagueFreezeRoot })
}

const effectiveUid = (): number => {
  if (typeof process.geteuid === "function") return process.geteuid()
  if (typeof process.getuid === "function") return process.getuid()
  return fail("V138_LOCAL_SEAL_UID_UNAVAILABLE")
}

const within = (parent: string, candidate: string): boolean =>
  candidate === parent || candidate.startsWith(`${parent}${path.sep}`)

const assertOwnedDirectory = (target: string): void => {
  const stat = lstatSync(target)
  if (stat.isSymbolicLink()) fail("V138_LOCAL_SEAL_DIRECTORY_SYMLINK")
  if (!stat.isDirectory()) fail("V138_LOCAL_SEAL_DIRECTORY_TYPE_INVALID")
  if (stat.uid !== effectiveUid()) fail("V138_LOCAL_SEAL_OWNER_INVALID")
  if ((stat.mode & 0o777) !== 0o700) fail("V138_LOCAL_SEAL_DIRECTORY_MODE_INVALID")
}

const assertStoreRoot = (repoRootInput: string, storeRootInput: string): string => {
  if (!path.isAbsolute(storeRootInput)) fail("V138_LOCAL_SEAL_ROOT_NOT_ABSOLUTE")
  const repoRoot = path.resolve(repoRootInput)
  const root = path.resolve(storeRootInput)
  if (within(repoRoot, root)) fail("V138_LOCAL_SEAL_ROOT_IN_REPOSITORY")
  if (!existsSync(root)) fail("V138_LOCAL_SEAL_ROOT_MISSING")
  assertOwnedDirectory(root)
  return root
}

const inside = (root: string, relative: string): string => {
  if (path.isAbsolute(relative) || relative.split(path.sep).includes("..")) {
    fail("V138_LOCAL_SEAL_PATH_INVALID")
  }
  const target = path.resolve(root, relative)
  if (!within(root, target)) fail("V138_LOCAL_SEAL_PATH_INVALID")
  return target
}

const ensureDirectory = (root: string, relative: string): string => {
  const target = inside(root, relative)
  if (!existsSync(target)) mkdirSync(target, { mode: 0o700 })
  assertOwnedDirectory(target)
  return target
}

const assertOwnedFile = (target: string): void => {
  const stat = lstatSync(target)
  if (stat.isSymbolicLink()) fail("V138_LOCAL_SEAL_SECRET_SYMLINK")
  if (!stat.isFile()) fail("V138_LOCAL_SEAL_SECRET_TYPE_INVALID")
  if (stat.uid !== effectiveUid()) fail("V138_LOCAL_SEAL_OWNER_INVALID")
  if ((stat.mode & 0o777) !== 0o600) fail("V138_LOCAL_SEAL_FILE_MODE_INVALID")
}

const fsyncDirectory = (target: string): void => {
  let descriptor: number | undefined
  try {
    descriptor = openSync(target, constants.O_RDONLY | (constants.O_DIRECTORY ?? 0) | (constants.O_NOFOLLOW ?? 0))
    fsyncSync(descriptor)
  } finally {
    if (descriptor !== undefined) closeSync(descriptor)
  }
}

const writeExclusiveDurable = (root: string, relative: string, bytes: Uint8Array): void => {
  const parent = ensureDirectory(root, path.dirname(relative))
  const target = inside(root, relative)
  let descriptor: number | undefined
  try {
    descriptor = openSync(target, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY | (constants.O_NOFOLLOW ?? 0), 0o600)
    let offset = 0
    while (offset < bytes.byteLength) offset += writeSync(descriptor, bytes, offset)
    fsyncSync(descriptor)
  } finally {
    if (descriptor !== undefined) closeSync(descriptor)
  }
  fsyncDirectory(parent)
}

const replaceDurable = (root: string, relative: string, bytes: Uint8Array): void => {
  const parent = ensureDirectory(root, path.dirname(relative))
  const target = inside(root, relative)
  const temporary = `${target}.next`
  writeFileSync(temporary, bytes, { flag: "wx", mode: 0o600 })
  let descriptor: number | undefined
  try {
    descriptor = openSync(temporary, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0))
    fsyncSync(descriptor)
  } finally {
    if (descriptor !== undefined) closeSync(descriptor)
  }
  renameSync(temporary, target)
  fsyncDirectory(parent)
}

const readRestricted = (root: string, relative: string, maxBytes = 1_048_576): Buffer => {
  const target = inside(root, relative)
  assertOwnedFile(target)
  const bytes = readFileSync(target)
  if (bytes.byteLength < 1 || bytes.byteLength > maxBytes) fail("V138_LOCAL_SEAL_FILE_SIZE_INVALID")
  return bytes
}

const parseCanonicalRecord = (root: string, relative: string, maxBytes?: number): RecordValue => {
  const bytes = readRestricted(root, relative, maxBytes)
  let parsed: unknown
  try { parsed = JSON.parse(bytes.toString("utf8")) } catch { fail("V138_LOCAL_SEAL_RECORD_INVALID") }
  if (!isRecord(parsed) || `${JSON.stringify(parsed)}\n` !== bytes.toString("utf8")) {
    fail("V138_LOCAL_SEAL_RECORD_INVALID")
  }
  return parsed
}

export interface V138LocalSealOpenRequest {
  readonly schemaVersion: "v1.38-local-seal-open-request-v1"
  readonly assuranceClass: "single_operator_local_seal_v1"
  readonly repositoryOperator: string
  readonly toolMediatedLedger: true
  readonly operatorNoPrematureAccessDeclaration: true
  readonly currentLeagueFreezeRoot: Sha256
  readonly coldCommonRoot: Sha256
  readonly profileManifestFreezeRoot: Sha256
  readonly preSearchPolicyRoot: Sha256
  readonly metricRoot: Sha256
  readonly classifierRoot: Sha256
  readonly thresholdRoot: Sha256
  readonly opponentRoot: Sha256
  readonly scheduleRoot: Sha256
  readonly finalistRoot: Sha256
  readonly kernelRoot: Sha256
  readonly runtimeRoot: Sha256
  readonly semanticRoot: Sha256
  readonly receiptAllowlistRoot: Sha256
  readonly contaminationPolicyRoot: Sha256
  readonly retirementPolicyRoot: Sha256
}

const parseRequest = (input: unknown): Readonly<V138LocalSealOpenRequest> => {
  if (!isRecord(input) || !exactKeys(input, REQUEST_KEYS) ||
    input.schemaVersion !== "v1.38-local-seal-open-request-v1" ||
    input.assuranceClass !== "single_operator_local_seal_v1" ||
    typeof input.repositoryOperator !== "string" || !OPERATOR.test(input.repositoryOperator) ||
    input.toolMediatedLedger !== true || input.operatorNoPrematureAccessDeclaration !== true ||
    ROOT_KEYS.some((key) => typeof input[key] !== "string" || !SHA256.test(input[key] as string))) {
    fail("V138_LOCAL_SEAL_REQUEST_INVALID")
  }
  return deepFreeze({ ...(input as unknown as V138LocalSealOpenRequest) })
}

type SealState = "committed" | "open_armed" | "open_consumed" | "projected" | "verified" | "contaminated" | "retired"
type SealCommand = "commit" | "arm_open" | "consume_open" | "evaluation" | "project" | "verify" | "contaminate" | "retire"

interface LedgerEventCore {
  readonly schemaVersion: "v1.38-local-seal-event-v1"
  readonly sequence: number
  readonly previousEventHash: Sha256 | "genesis"
  readonly command: SealCommand
  readonly outcome: "accepted" | "rejected"
  readonly reason: string
  readonly state: SealState
  readonly requestRoot: Sha256
  readonly resultingStateRoot: Sha256
}

interface LedgerEvent extends LedgerEventCore { readonly eventHash: Sha256 }

const EVENT_KEYS = [
  "schemaVersion", "sequence", "previousEventHash", "command", "outcome", "reason",
  "state", "requestRoot", "resultingStateRoot", "eventHash",
] as const

const stateRoot = (state: SealState, sequence: number, requestRoot: Sha256, commitmentRoot: Sha256): Sha256 =>
  domainRoot("cowards-game:v1.38:local-seal-state:v1", { state, sequence, requestRoot, commitmentRoot })

const eventHash = (event: LedgerEventCore): Sha256 =>
  domainRoot("cowards-game:v1.38:local-seal-event:v1", event)

const renderLine = (event: LedgerEvent): string => `${JSON.stringify(event)}\n`

interface CommitmentRecord {
  readonly schemaVersion: "v1.38-local-seal-private-commitment-v1"
  readonly assuranceClass: "single_operator_local_seal_v1"
  readonly requestRoot: Sha256
  readonly commitmentDigest: Sha256
  readonly commitmentRoot: Sha256
  readonly secretByteLength: number
  readonly secretIngress: "fixed_owner_only_file_v1"
  readonly sourceCommit: string
  readonly sourceTree: string
  readonly freezeCarrierIdentity: Sha256
  readonly currentLeagueFreezeRoot: Sha256
}

const COMMITMENT_KEYS = [
  "schemaVersion", "assuranceClass", "requestRoot", "commitmentDigest", "commitmentRoot",
  "secretByteLength", "secretIngress",
  "sourceCommit", "sourceTree", "freezeCarrierIdentity", "currentLeagueFreezeRoot",
] as const

const loadCommitment = (root: string): Readonly<CommitmentRecord> => {
  const value = parseCanonicalRecord(root, COMMITMENT_PATH, 4096)
  if (!exactKeys(value, COMMITMENT_KEYS) ||
    value.schemaVersion !== "v1.38-local-seal-private-commitment-v1" ||
    value.assuranceClass !== "single_operator_local_seal_v1" ||
    typeof value.requestRoot !== "string" || !SHA256.test(value.requestRoot) ||
    typeof value.commitmentDigest !== "string" || !SHA256.test(value.commitmentDigest) ||
    typeof value.commitmentRoot !== "string" || !SHA256.test(value.commitmentRoot) ||
    typeof value.secretByteLength !== "number" || !Number.isSafeInteger(value.secretByteLength) ||
    value.secretByteLength < 32 || value.secretByteLength > 4096 ||
    value.secretIngress !== "fixed_owner_only_file_v1" ||
    typeof value.sourceCommit !== "string" || !GIT_OBJECT.test(value.sourceCommit) ||
    typeof value.sourceTree !== "string" || !GIT_OBJECT.test(value.sourceTree) ||
    typeof value.freezeCarrierIdentity !== "string" || !SHA256.test(value.freezeCarrierIdentity) ||
    typeof value.currentLeagueFreezeRoot !== "string" || !SHA256.test(value.currentLeagueFreezeRoot)) {
    fail("V138_LOCAL_SEAL_COMMITMENT_INVALID")
  }
  return deepFreeze({ ...(value as unknown as CommitmentRecord) })
}

const loadLedger = (root: string, commitment: CommitmentRecord): readonly LedgerEvent[] => {
  const bytes = readRestricted(root, EVENT_PATH)
  const text = bytes.toString("utf8")
  if (!text.endsWith("\n")) fail("V138_LOCAL_SEAL_LEDGER_INVALID")
  let previous: Sha256 | "genesis" = "genesis"
  let priorState: SealState | undefined
  const events = text.trimEnd().split("\n").map((line, index) => {
    let value: unknown
    try { value = JSON.parse(line) } catch { fail("V138_LOCAL_SEAL_LEDGER_INVALID") }
    if (!isRecord(value) || !exactKeys(value, EVENT_KEYS)) fail("V138_LOCAL_SEAL_LEDGER_INVALID")
    const commands = ["commit", "arm_open", "consume_open", "evaluation", "project", "verify", "contaminate", "retire"]
    const states = ["committed", "open_armed", "open_consumed", "projected", "verified", "contaminated", "retired"]
    if (value.schemaVersion !== "v1.38-local-seal-event-v1" || value.sequence !== index + 1 ||
      value.previousEventHash !== previous || !commands.includes(value.command as string) ||
      !["accepted", "rejected"].includes(value.outcome as string) ||
      typeof value.reason !== "string" || !/^V138_LOCAL_SEAL_[A-Z0-9_]+$/u.test(value.reason) ||
      !states.includes(value.state as string) || value.requestRoot !== commitment.requestRoot ||
      typeof value.resultingStateRoot !== "string" || !SHA256.test(value.resultingStateRoot) ||
      typeof value.eventHash !== "string" || !SHA256.test(value.eventHash)) fail("V138_LOCAL_SEAL_LEDGER_INVALID")
    const core = { ...value } as RecordValue
    delete core.eventHash
    if (eventHash(core as unknown as LedgerEventCore) !== value.eventHash ||
      stateRoot(value.state as SealState, value.sequence as number, commitment.requestRoot, commitment.commitmentRoot) !== value.resultingStateRoot) {
      fail("V138_LOCAL_SEAL_LEDGER_INVALID")
    }
    const state = value.state as SealState
    if (index === 0 && (value.command !== "commit" || state !== "committed")) fail("V138_LOCAL_SEAL_LEDGER_INVALID")
    if (priorState === "retired" || (priorState === "contaminated" && state !== "retired") ||
      (priorState === "open_consumed" && value.command === "consume_open")) fail("V138_LOCAL_SEAL_LEDGER_INVALID")
    previous = value.eventHash as Sha256
    priorState = state
    return deepFreeze({ ...(value as unknown as LedgerEvent) })
  })
  const stored = parseCanonicalRecord(root, STATE_PATH, 4096)
  const last = events.at(-1)
  if (!last || !exactKeys(stored, ["schemaVersion", "state", "eventCount", "ledgerRoot", "requestRoot", "commitmentRoot", "stateRoot", "sourceCommit", "sourceTree", "freezeCarrierIdentity", "currentLeagueFreezeRoot"]) ||
    stored.schemaVersion !== "v1.38-local-seal-state-v1" || stored.state !== last.state ||
    stored.eventCount !== events.length || stored.ledgerRoot !== last.eventHash ||
    stored.requestRoot !== commitment.requestRoot || stored.commitmentRoot !== commitment.commitmentRoot ||
    stored.stateRoot !== last.resultingStateRoot || stored.sourceCommit !== commitment.sourceCommit ||
    stored.sourceTree !== commitment.sourceTree || stored.freezeCarrierIdentity !== commitment.freezeCarrierIdentity ||
    stored.currentLeagueFreezeRoot !== commitment.currentLeagueFreezeRoot) fail("V138_LOCAL_SEAL_LEDGER_INVALID")
  return Object.freeze(events)
}

const stateRecord = (event: LedgerEvent, commitment: CommitmentRecord): RecordValue => ({
  schemaVersion: "v1.38-local-seal-state-v1",
  state: event.state,
  eventCount: event.sequence,
  ledgerRoot: event.eventHash,
  requestRoot: commitment.requestRoot,
  commitmentRoot: commitment.commitmentRoot,
  stateRoot: event.resultingStateRoot,
  sourceCommit: commitment.sourceCommit,
  sourceTree: commitment.sourceTree,
  freezeCarrierIdentity: commitment.freezeCarrierIdentity,
  currentLeagueFreezeRoot: commitment.currentLeagueFreezeRoot,
})

const appendEvent = (root: string, commitment: CommitmentRecord, prior: readonly LedgerEvent[], input: Omit<LedgerEventCore, "schemaVersion" | "sequence" | "previousEventHash" | "requestRoot" | "resultingStateRoot">): LedgerEvent => {
  const sequence = prior.length + 1
  const core: LedgerEventCore = {
    schemaVersion: "v1.38-local-seal-event-v1",
    sequence,
    previousEventHash: prior.at(-1)?.eventHash ?? "genesis",
    command: input.command,
    outcome: input.outcome,
    reason: input.reason,
    state: input.state,
    requestRoot: commitment.requestRoot,
    resultingStateRoot: stateRoot(input.state, sequence, commitment.requestRoot, commitment.commitmentRoot),
  }
  const event = deepFreeze({ ...core, eventHash: eventHash(core) }) as LedgerEvent
  const target = inside(root, EVENT_PATH)
  let descriptor: number | undefined
  try {
    descriptor = openSync(target, constants.O_APPEND | constants.O_WRONLY | (constants.O_NOFOLLOW ?? 0))
    writeSync(descriptor, renderLine(event))
    fsyncSync(descriptor)
  } finally {
    if (descriptor !== undefined) closeSync(descriptor)
  }
  replaceDurable(root, STATE_PATH, Buffer.from(`${JSON.stringify(stateRecord(event, commitment))}\n`))
  return event
}

const withLock = <T>(root: string, action: () => T): T => {
  ensureDirectory(root, "state")
  const lock = inside(root, LOCK_PATH)
  let descriptor: number | undefined
  try {
    descriptor = openSync(lock, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY | (constants.O_NOFOLLOW ?? 0), 0o600)
    fsyncSync(descriptor)
    closeSync(descriptor)
    descriptor = undefined
    fsyncDirectory(path.dirname(lock))
    return action()
  } finally {
    if (descriptor !== undefined) closeSync(descriptor)
    if (existsSync(lock)) {
      unlinkSync(lock)
      fsyncDirectory(path.dirname(lock))
    }
  }
}

const publicStatus = (state: SealState, commitment: CommitmentRecord) => deepFreeze({
  schemaVersion: "v1.38-local-seal-command-result-v1" as const,
  assuranceClass: "single_operator_local_seal_v1" as const,
  state,
  requestRoot: commitment.requestRoot,
  commitmentRoot: commitment.commitmentRoot,
  toolMediatedLedger: true as const,
  independentCustodyClaimed: false as const,
  maliciousOwnerResistanceClaimed: false as const,
  satisfiesSeal01Mechanics: true as const,
  satisfiesSeal01: false as const,
  candidateSearchAuthorized: false as const,
  phase263Authorized: false as const,
  formationMaterializationAuthorized: false as const,
  holdoutOpeningAuthorized: false as const,
  publicAuthorized: false as const,
  productionAuthorized: false as const,
  downstreamAuthority: "denied" as const,
})

const parseOptions = (input: unknown): { repoRoot: string; storeRoot: string } => {
  if (!isRecord(input) || !exactKeys(input, ["repoRoot", "storeRoot"]) ||
    typeof input.repoRoot !== "string" || typeof input.storeRoot !== "string") {
    fail("V138_LOCAL_SEAL_OPTIONS_INVALID")
  }
  return { repoRoot: input.repoRoot, storeRoot: assertStoreRoot(input.repoRoot, input.storeRoot) }
}

export interface V138LocalSealCommitInput {
  readonly repoRoot: string
  readonly storeRoot: string
  readonly request: V138LocalSealOpenRequest
}

export interface V138LocalSealFailureInjection {
  readonly shortRead?: true
  readonly unlink?: true
  readonly inputFsync?: true
}

export const commitV138LocalSeal = (
  input: V138LocalSealCommitInput,
  failureInjection: V138LocalSealFailureInjection = {},
) => {
  if (!isRecord(input) || !exactKeys(input, ["repoRoot", "storeRoot", "request"]) ||
    typeof input.repoRoot !== "string" || typeof input.storeRoot !== "string") {
    fail("V138_LOCAL_SEAL_COMMIT_INPUT_INVALID")
  }
  const request = parseRequest(input.request)
  const checkout = deriveCheckoutIdentity(input.repoRoot)
  if (request.currentLeagueFreezeRoot !== checkout.currentLeagueFreezeRoot) {
    fail("V138_LOCAL_SEAL_FREEZE_IDENTITY_MISMATCH")
  }
  const root = assertStoreRoot(checkout.repoRoot, input.storeRoot)
  const inputRoot = inside(root, "input")
  assertOwnedDirectory(inputRoot)
  const secretPath = inside(root, SECRET_RELATIVE_PATH)
  assertOwnedFile(secretPath)
  if (existsSync(inside(root, COMMITMENT_PATH)) || existsSync(inside(root, EVENT_PATH))) {
    fail("V138_LOCAL_SEAL_COMMITMENT_EXISTS")
  }
  let descriptor: number | undefined
  let secret: Buffer | undefined
  let closeFailure = false
  let commitment: CommitmentRecord | undefined
  try {
    descriptor = openSync(secretPath, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0))
    const before = fstatSync(descriptor)
    if (!before.isFile() || before.uid !== effectiveUid() || (before.mode & 0o777) !== 0o600) {
      fail("V138_LOCAL_SEAL_SECRET_FILE_INVALID")
    }
    if (before.size < 32 || before.size > 4096) fail("V138_LOCAL_SEAL_SECRET_SIZE_INVALID")
    secret = Buffer.alloc(before.size)
    let offset = 0
    while (offset < secret.byteLength) {
      const requested = failureInjection.shortRead === true ? Math.max(0, secret.byteLength - 1 - offset) : secret.byteLength - offset
      if (requested === 0) break
      const count = readSync(descriptor, secret, offset, requested, offset)
      if (count === 0) break
      offset += count
    }
    const after = fstatSync(descriptor)
    if (offset !== secret.byteLength || after.size !== before.size) fail("V138_LOCAL_SEAL_SECRET_SHORT_READ")
    const requestRoot = domainRoot("cowards-game:v1.38:local-seal-open-request:v1", request)
    const commitmentDigest = `sha256:${createHmac("sha256", secret)
      .update("cowards-game:v1.38:local-seal-commitment:v1\0")
      .update(requestRoot)
      .digest("hex")}` as Sha256
    const base = {
      schemaVersion: "v1.38-local-seal-private-commitment-v1" as const,
      assuranceClass: "single_operator_local_seal_v1" as const,
      requestRoot,
      commitmentDigest,
      secretByteLength: secret.byteLength,
      secretIngress: "fixed_owner_only_file_v1" as const,
      sourceCommit: checkout.sourceCommit,
      sourceTree: checkout.sourceTree,
      freezeCarrierIdentity: checkout.freezeCarrierIdentity,
      currentLeagueFreezeRoot: checkout.currentLeagueFreezeRoot,
    }
    commitment = deepFreeze({
      ...base,
      commitmentRoot: domainRoot("cowards-game:v1.38:local-seal-commitment-record:v1", base),
    }) as CommitmentRecord
  } finally {
    if (descriptor !== undefined) {
      try { closeSync(descriptor) } catch { closeFailure = true }
    }
    secret?.fill(0)
  }
  if (closeFailure) fail("V138_LOCAL_SEAL_SECRET_CLOSE_FAILED")
  if (!commitment) fail("V138_LOCAL_SEAL_COMMITMENT_FAILED")
  try {
    if (failureInjection.unlink === true) fail("V138_LOCAL_SEAL_SECRET_UNLINK_FAILED")
    unlinkSync(secretPath)
  } catch (error) {
    if (error instanceof Error && error.message === "V138_LOCAL_SEAL_SECRET_UNLINK_FAILED") throw error
    return fail("V138_LOCAL_SEAL_SECRET_UNLINK_FAILED")
  }
  try {
    if (failureInjection.inputFsync === true) fail("V138_LOCAL_SEAL_INPUT_FSYNC_FAILED")
    fsyncDirectory(inputRoot)
  } catch (error) {
    if (error instanceof Error && error.message === "V138_LOCAL_SEAL_INPUT_FSYNC_FAILED") throw error
    return fail("V138_LOCAL_SEAL_INPUT_FSYNC_FAILED")
  }
  ensureDirectory(root, "commitment")
  ensureDirectory(root, "events")
  ensureDirectory(root, "state")
  ensureDirectory(root, "private")
  writeExclusiveDurable(root, COMMITMENT_PATH, Buffer.from(`${JSON.stringify(commitment)}\n`))
  const core: LedgerEventCore = {
    schemaVersion: "v1.38-local-seal-event-v1",
    sequence: 1,
    previousEventHash: "genesis",
    command: "commit",
    outcome: "accepted",
    reason: "V138_LOCAL_SEAL_COMMITTED",
    state: "committed",
    requestRoot: commitment.requestRoot,
    resultingStateRoot: stateRoot("committed", 1, commitment.requestRoot, commitment.commitmentRoot),
  }
  const event = deepFreeze({ ...core, eventHash: eventHash(core) }) as LedgerEvent
  writeExclusiveDurable(root, EVENT_PATH, Buffer.from(renderLine(event)))
  writeExclusiveDurable(root, STATE_PATH, Buffer.from(`${JSON.stringify(stateRecord(event, commitment))}\n`))
  const result = deepFreeze({
    ...publicStatus("committed", commitment),
    repositoryOperator: request.repositoryOperator,
    operatorNoPrematureAccessDeclaration: true as const,
    assuranceLimitations: Object.freeze([
      "no_independent_or_third_party_custody",
      "no_separate_permissioning_or_non_collusion",
      "no_comprehensive_host_monitoring",
      "no_cryptographic_or_forensic_erasure_proof",
      "no_malicious_owner_resistance",
      "zero_fill_and_unlink_are_best_effort_hygiene_only",
    ]),
  })
  assertPublicOutputLeakSafe(result, "v1.38 local seal commitment")
  return result
}

const assertRequestMatches = (root: string, requestInput: unknown, commitment: CommitmentRecord): Readonly<V138LocalSealOpenRequest> => {
  const request = parseRequest(requestInput)
  const rootValue = domainRoot("cowards-game:v1.38:local-seal-open-request:v1", request)
  if (rootValue !== commitment.requestRoot) fail("V138_LOCAL_SEAL_REQUEST_MISMATCH")
  return request
}

const contaminateAfterFailure = (root: string, commitment: CommitmentRecord, events: readonly LedgerEvent[], command: SealCommand, reason: string): never => {
  if (events.at(-1)?.state !== "retired" && events.at(-1)?.state !== "contaminated") {
    appendEvent(root, commitment, events, { command, outcome: "rejected", reason, state: "contaminated" })
  }
  return fail(reason)
}

export const armV138LocalSealOpening = (optionsInput: unknown, requestInput: unknown, commitmentRoot: Sha256) => {
  const options = parseOptions(optionsInput)
  return withLock(options.storeRoot, () => {
    const commitment = loadCommitment(options.storeRoot)
    const events = loadLedger(options.storeRoot, commitment)
    if (events.at(-1)?.state !== "committed") fail("V138_LOCAL_SEAL_TERMINAL")
    try {
      const request = assertRequestMatches(options.storeRoot, requestInput, commitment)
      if (commitmentRoot !== commitment.commitmentRoot) fail("V138_LOCAL_SEAL_COMMITMENT_MISMATCH")
      const checkout = deriveCheckoutIdentity(options.repoRoot)
      if (checkout.sourceCommit !== commitment.sourceCommit || checkout.sourceTree !== commitment.sourceTree ||
        checkout.freezeCarrierIdentity !== commitment.freezeCarrierIdentity ||
        checkout.currentLeagueFreezeRoot !== commitment.currentLeagueFreezeRoot ||
        request.currentLeagueFreezeRoot !== checkout.currentLeagueFreezeRoot) {
        fail("V138_LOCAL_SEAL_CHECKOUT_IDENTITY_DRIFT")
      }
      writeExclusiveDurable(options.storeRoot, OPEN_REQUEST_PATH, Buffer.from(`${JSON.stringify(request)}\n`))
      appendEvent(options.storeRoot, commitment, events, { command: "arm_open", outcome: "accepted", reason: "V138_LOCAL_SEAL_OPEN_ARMED", state: "open_armed" })
      return publicStatus("open_armed", commitment)
    } catch (error) {
      const reason = error instanceof Error && /^V138_LOCAL_SEAL_[A-Z0-9_]+$/u.test(error.message)
        ? error.message : "V138_LOCAL_SEAL_OPEN_ARM_FAILED"
      return contaminateAfterFailure(options.storeRoot, commitment, events, "arm_open", reason)
    }
  })
}

export const consumeV138LocalSealOpening = <T>(optionsInput: unknown, requestInput: unknown, evaluate: () => T) => {
  const options = parseOptions(optionsInput)
  if (typeof evaluate !== "function") fail("V138_LOCAL_SEAL_EVALUATOR_INVALID")
  return withLock(options.storeRoot, () => {
    const commitment = loadCommitment(options.storeRoot)
    let events = loadLedger(options.storeRoot, commitment)
    if (events.at(-1)?.state !== "open_armed") fail("V138_LOCAL_SEAL_TERMINAL")
    try { assertRequestMatches(options.storeRoot, requestInput, commitment) }
    catch { return contaminateAfterFailure(options.storeRoot, commitment, events, "consume_open", "V138_LOCAL_SEAL_REQUEST_MISMATCH") }
    appendEvent(options.storeRoot, commitment, events, { command: "consume_open", outcome: "accepted", reason: "V138_LOCAL_SEAL_OPEN_CONSUMED", state: "open_consumed" })
    events = loadLedger(options.storeRoot, commitment)
    try {
      const evaluation = evaluate()
      const bytes = canonicalBytes(evaluation)
      if (bytes.byteLength < 1 || bytes.byteLength > 8192) fail("V138_LOCAL_SEAL_EVALUATION_INVALID")
      const evaluationRoot = domainRoot("cowards-game:v1.38:local-seal-evaluation:v1", evaluation)
      writeExclusiveDurable(options.storeRoot, EVALUATION_PATH, Buffer.from(`${JSON.stringify(evaluation)}\n`))
      return deepFreeze({ ...publicStatus("open_consumed", commitment), evaluationRoot })
    } catch {
      return contaminateAfterFailure(options.storeRoot, commitment, events, "evaluation", "V138_LOCAL_SEAL_EVALUATION_SYSTEM_FAILURE")
    }
  })
}

export interface V138LocalSealSafeProjection {
  readonly schemaVersion: "v1.38-local-seal-safe-receipt-v1"
  readonly status: "synthetic_protocol_passed" | "synthetic_protocol_failed" | "evaluation_passed" | "evaluation_failed"
  readonly evaluatedItemCount: number
  readonly findingCount: number
  readonly aggregateMetrics: Readonly<Record<string, number>>
  readonly resultRoot: Sha256
  readonly receiptRoot: Sha256
}

const PROJECTION_KEYS = ["schemaVersion", "status", "evaluatedItemCount", "findingCount", "aggregateMetrics", "resultRoot", "receiptRoot"] as const
const METRIC_KEYS = new Set(["interactionRateBps", "exploitabilityMilli", "scriptedOpeningRateBps", "turtleRateBps"])

const parseProjection = (value: unknown): Readonly<V138LocalSealSafeProjection> => {
  if (!isRecord(value) || !exactKeys(value, PROJECTION_KEYS) ||
    value.schemaVersion !== "v1.38-local-seal-safe-receipt-v1" ||
    !["synthetic_protocol_passed", "synthetic_protocol_failed", "evaluation_passed", "evaluation_failed"].includes(value.status as string) ||
    typeof value.evaluatedItemCount !== "number" || !Number.isSafeInteger(value.evaluatedItemCount) || value.evaluatedItemCount < 0 || value.evaluatedItemCount > 100_000 ||
    typeof value.findingCount !== "number" || !Number.isSafeInteger(value.findingCount) || value.findingCount < 0 || value.findingCount > value.evaluatedItemCount ||
    !isRecord(value.aggregateMetrics) || Object.keys(value.aggregateMetrics).length > 4 ||
    Object.entries(value.aggregateMetrics).some(([key, metric]) => !METRIC_KEYS.has(key) || typeof metric !== "number" || !Number.isSafeInteger(metric) || metric < 0 || metric > 1_000_000) ||
    typeof value.resultRoot !== "string" || !SHA256.test(value.resultRoot) ||
    typeof value.receiptRoot !== "string" || !SHA256.test(value.receiptRoot)) fail("V138_LOCAL_SEAL_SAFE_PROJECTION_INVALID")
  assertPublicOutputLeakSafe(value, "v1.38 local seal projection")
  if (canonicalBytes(value).byteLength > 4096) fail("V138_LOCAL_SEAL_SAFE_PROJECTION_INVALID")
  return deepFreeze({ ...(value as unknown as V138LocalSealSafeProjection) })
}

export const projectV138LocalSealReceipt = (optionsInput: unknown, requestInput: unknown, evaluationRoot: Sha256) => {
  const options = parseOptions(optionsInput)
  return withLock(options.storeRoot, () => {
    const commitment = loadCommitment(options.storeRoot)
    const events = loadLedger(options.storeRoot, commitment)
    if (events.at(-1)?.state !== "open_consumed") fail("V138_LOCAL_SEAL_TERMINAL")
    try {
      assertRequestMatches(options.storeRoot, requestInput, commitment)
      if (typeof evaluationRoot !== "string" || !SHA256.test(evaluationRoot)) fail("V138_LOCAL_SEAL_SAFE_PROJECTION_INVALID")
      const projectionInput = parseCanonicalRecord(options.storeRoot, EVALUATION_PATH, 8192)
      if (domainRoot("cowards-game:v1.38:local-seal-evaluation:v1", projectionInput) !== evaluationRoot) {
        fail("V138_LOCAL_SEAL_SAFE_PROJECTION_INVALID")
      }
      const projection = parseProjection(projectionInput)
      const receipt = deepFreeze({
        ...projection,
        assuranceClass: "single_operator_local_seal_v1" as const,
        requestRoot: commitment.requestRoot,
        commitmentRoot: commitment.commitmentRoot,
        openOrdinal: 1 as const,
        independentCustodyClaimed: false as const,
        maliciousOwnerResistanceClaimed: false as const,
        downstreamAuthority: "denied" as const,
      })
      assertPublicOutputLeakSafe(receipt, "v1.38 local seal safe receipt")
      writeExclusiveDurable(options.storeRoot, PROJECTION_PATH, Buffer.from(`${JSON.stringify(receipt)}\n`))
      appendEvent(options.storeRoot, commitment, events, { command: "project", outcome: "accepted", reason: "V138_LOCAL_SEAL_PROJECTED", state: "projected" })
      return receipt
    } catch {
      return contaminateAfterFailure(options.storeRoot, commitment, events, "project", "V138_LOCAL_SEAL_SAFE_PROJECTION_INVALID")
    }
  })
}

export const verifyV138LocalSealReceipt = (optionsInput: unknown, requestInput: unknown, receiptInput: unknown) => {
  const options = parseOptions(optionsInput)
  return withLock(options.storeRoot, () => {
    const commitment = loadCommitment(options.storeRoot)
    const events = loadLedger(options.storeRoot, commitment)
    if (events.at(-1)?.state !== "projected") fail("V138_LOCAL_SEAL_TERMINAL")
    try {
      assertRequestMatches(options.storeRoot, requestInput, commitment)
      const stored = parseCanonicalRecord(options.storeRoot, PROJECTION_PATH, 8192)
      if (JSON.stringify(stored) !== JSON.stringify(receiptInput)) fail("V138_LOCAL_SEAL_RECEIPT_MISMATCH")
      appendEvent(options.storeRoot, commitment, events, { command: "verify", outcome: "accepted", reason: "V138_LOCAL_SEAL_VERIFIED", state: "verified" })
      return publicStatus("verified", commitment)
    } catch {
      return contaminateAfterFailure(options.storeRoot, commitment, events, "verify", "V138_LOCAL_SEAL_RECEIPT_MISMATCH")
    }
  })
}

export const markV138LocalSealContaminated = (optionsInput: unknown, reason: string) => {
  const options = parseOptions(optionsInput)
  if (typeof reason !== "string" || !REASON.test(reason)) fail("V138_LOCAL_SEAL_CONTAMINATION_REASON_INVALID")
  return withLock(options.storeRoot, () => {
    const commitment = loadCommitment(options.storeRoot)
    const events = loadLedger(options.storeRoot, commitment)
    const state = events.at(-1)?.state
    if (state === "retired" || state === "contaminated") fail("V138_LOCAL_SEAL_TERMINAL")
    appendEvent(options.storeRoot, commitment, events, { command: "contaminate", outcome: "accepted", reason: "V138_LOCAL_SEAL_OPERATOR_CONTAMINATION", state: "contaminated" })
    return publicStatus("contaminated", commitment)
  })
}

export const retireV138LocalSeal = (optionsInput: unknown, requestInput: unknown) => {
  const options = parseOptions(optionsInput)
  return withLock(options.storeRoot, () => {
    const commitment = loadCommitment(options.storeRoot)
    const events = loadLedger(options.storeRoot, commitment)
    const state = events.at(-1)?.state
    if (state !== "verified" && state !== "contaminated") fail("V138_LOCAL_SEAL_RETIREMENT_NOT_AUTHORIZED")
    if (state === "verified") assertRequestMatches(options.storeRoot, requestInput, commitment)
    for (const relative of [OPEN_REQUEST_PATH, EVALUATION_PATH, PROJECTION_PATH]) {
      const target = inside(options.storeRoot, relative)
      if (existsSync(target)) unlinkSync(target)
    }
    fsyncDirectory(inside(options.storeRoot, "private"))
    appendEvent(options.storeRoot, commitment, events, { command: "retire", outcome: "accepted", reason: "V138_LOCAL_SEAL_RETIRED", state: "retired" })
    return publicStatus("retired", commitment)
  })
}

export interface V138LocalSealProtocolArtifactInput {
  readonly moduleSourceBytes: Uint8Array
  readonly testSourceBytes: Uint8Array
  readonly cliSourceBytes: Uint8Array
  readonly preSearchPolicyBytes: Uint8Array
}

export const buildV138LocalSealProtocolArtifact = (input: V138LocalSealProtocolArtifactInput) => {
  if (!isRecord(input) || !exactKeys(input, ["moduleSourceBytes", "testSourceBytes", "cliSourceBytes", "preSearchPolicyBytes"]) ||
    !Object.values(input).every((value) => value instanceof Uint8Array)) fail("V138_LOCAL_SEAL_ARTIFACT_INPUT_INVALID")
  let policy: unknown
  try { policy = JSON.parse(Buffer.from(input.preSearchPolicyBytes).toString("utf8")) }
  catch { fail("V138_LOCAL_SEAL_POLICY_INVALID") }
  if (!isRecord(policy) || policy.policyRoot !== "sha256:6ad9134977310215ce6e98171d3586c9ae1853313f912ff6e9af95966607e382" ||
    policy.rootKind !== "pre_search_policy_root") fail("V138_LOCAL_SEAL_POLICY_INVALID")
  const body = {
    schemaVersion: "v1.38-local-seal-protocol-v1" as const,
    assuranceClass: "single_operator_local_seal_v1" as const,
    repositoryOperator: "roryquinlan-repository-operator" as const,
    toolMediatedLedger: true as const,
    operatorNoPrematureAccessDeclarationRequired: true as const,
    secretIngress: "fixed_owner_only_file_v1" as const,
    secretFileContract: "input/commitment-secret.bin:owner-only-0600:32..4096:read-once:no-follow:unlink-and-parent-fsync-before-evidence" as const,
    lifecycle: Object.freeze(["empty", "committed", "open_armed", "open_consumed", "projected", "verified", "retired"]),
    failureLifecycle: Object.freeze(["contaminated", "retired"]),
    openingConsumptionDurableBeforeEvaluation: true as const,
    evaluationFailureDisposition: "charged_terminal_system_failure_no_retry" as const,
    eventLedger: "fsynced_sha256_hash_chain_with_state_root" as const,
    preSearchPolicyRoot: policy.policyRoot as Sha256,
    moduleSourceSha256: sha256(input.moduleSourceBytes),
    testSourceSha256: sha256(input.testSourceBytes),
    cliSourceSha256: sha256(input.cliSourceBytes),
    realHoldoutMaterialPresent: false as const,
    satisfiesSeal01Mechanics: true as const,
    satisfiesSeal01: false as const,
    independentCustodyClaimed: false as const,
    maliciousOwnerResistanceClaimed: false as const,
    comprehensiveHostMonitoringClaimed: false as const,
    cryptographicErasureClaimed: false as const,
    assuranceLimitations: Object.freeze([
      "owner_can_bypass_or_copy_material_outside_the_tool",
      "filesystem_modes_do_not_create_organizational_separation",
      "tool_ledger_observes_only_tool_mediated_actions",
      "zero_fill_and_unlink_do_not_prove_removal_from_caches_swap_backups_or_copies",
    ]),
    admit03: "blocked" as const,
    seal01: "pending_independent_verification" as const,
    candidateSearchAuthorized: false as const,
    phase263Authorized: false as const,
    formationMaterializationAuthorized: false as const,
    holdoutOpeningAuthorized: false as const,
    publicAuthorized: false as const,
    productionAuthorized: false as const,
    downstreamAuthority: "denied" as const,
  }
  const artifact = deepFreeze({
    ...body,
    protocolRoot: domainRoot("cowards-game:v1.38:local-seal-protocol:v1", body),
  })
  assertPublicOutputLeakSafe(artifact, "v1.38 local seal protocol artifact")
  return artifact
}

export const buildV138LocalSealProtocolArtifactV2 = (input: V138LocalSealProtocolArtifactInput) => {
  if (!isRecord(input) || !exactKeys(input, ["moduleSourceBytes", "testSourceBytes", "cliSourceBytes", "preSearchPolicyBytes"]) ||
    !Object.values(input).every((value) => value instanceof Uint8Array)) fail("V138_LOCAL_SEAL_ARTIFACT_INPUT_INVALID")
  let policy: unknown
  try { policy = JSON.parse(Buffer.from(input.preSearchPolicyBytes).toString("utf8")) }
  catch { fail("V138_LOCAL_SEAL_POLICY_INVALID") }
  if (!isRecord(policy) || policy.policyRoot !== "sha256:6ad9134977310215ce6e98171d3586c9ae1853313f912ff6e9af95966607e382" ||
    policy.rootKind !== "pre_search_policy_root") fail("V138_LOCAL_SEAL_POLICY_INVALID")
  const body = {
    schemaVersion: "v1.38-local-seal-protocol-v2" as const,
    assuranceClass: "single_operator_local_seal_v1" as const,
    repositoryOperator: "roryquinlan-repository-operator" as const,
    toolMediatedLedger: true as const,
    operatorNoPrematureAccessDeclarationRequired: true as const,
    secretIngress: "fixed_owner_only_file_v1" as const,
    secretFileContract: "input/commitment-secret.bin:owner-only-0600:32..4096:read-once:no-follow:unlink-and-parent-fsync-before-evidence" as const,
    cleanCheckoutRequiredAtCommit: true as const,
    exactCheckoutRecheckRequiredAtArm: true as const,
    gitIdentityContract: "full_head_commit_full_head_tree_staged_unstaged_untracked_empty_v1" as const,
    freezeIdentityContract: "domain_separated_full_commit_tree_and_committed_carrier_v2" as const,
    callerProvidedFreezeIdentityAccepted: false as const,
    checkoutIdentityJoinedToCommitmentAndState: true as const,
    openingConsumptionDurableBeforeEvaluation: true as const,
    evaluationFailureDisposition: "charged_terminal_system_failure_no_retry" as const,
    eventLedger: "fsynced_sha256_hash_chain_with_state_root" as const,
    preSearchPolicyRoot: policy.policyRoot as Sha256,
    moduleSourceSha256: sha256(input.moduleSourceBytes),
    testSourceSha256: sha256(input.testSourceBytes),
    cliSourceSha256: sha256(input.cliSourceBytes),
    realHoldoutMaterialPresent: false as const,
    satisfiesSeal01Mechanics: true as const,
    satisfiesSeal01: false as const,
    independentCustodyClaimed: false as const,
    maliciousOwnerResistanceClaimed: false as const,
    admit03: "blocked" as const,
    seal01: "pending_independent_verification" as const,
    candidateSearchAuthorized: false as const,
    phase263Authorized: false as const,
    formationMaterializationAuthorized: false as const,
    holdoutOpeningAuthorized: false as const,
    publicAuthorized: false as const,
    productionAuthorized: false as const,
    downstreamAuthority: "denied" as const,
  }
  const artifact = deepFreeze({
    ...body,
    protocolRoot: domainRoot("cowards-game:v1.38:local-seal-protocol:v2", body),
  })
  assertPublicOutputLeakSafe(artifact, "v1.38 local seal protocol artifact v2")
  return artifact
}
