import { Buffer } from "node:buffer"
import { createHash, createHmac, timingSafeEqual } from "node:crypto"
import {
  closeSync,
  constants,
  existsSync,
  fsyncSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
  writeSync,
} from "node:fs"
import path from "node:path"
// eslint-disable-next-line no-restricted-imports -- Offline release tooling uses the canonical privacy seam.
import { assertPublicOutputLeakSafe } from "../../packages/spec/src/public-output-privacy.js"
import { encodeCanonicalJson } from "../../packages/spec/src/canonical-json-encode.js"
import { hashCanonicalIdentity } from "../../packages/spec/src/canonical-identity-domains.js"
import type { JsonValue } from "../../packages/spec/src/types.js"

type Sha256 = `sha256:${string}`
type RecordValue = Record<string, unknown>

const SHA256 = /^sha256:[0-9a-f]{64}$/u
const SYNTHETIC_ID = /^synthetic-[a-z0-9][a-z0-9-]{2,95}$/u
const OPAQUE_ID = /^[a-z][a-z0-9-]{2,95}$/u
const COMMITMENT_PATH = "commitment/custody.json"
const OBJECT_PATH = "objects/sealed.bin"
const EVENTS_PATH = "events/custody.ndjson"
const OPEN_AUTHORIZATION_PATH = "authorization/open.json"
const COMMITMENT_DOMAIN = "cowards-game:v1.38:synthetic-custody-commitment:v1"

const isRecord = (value: unknown): value is RecordValue =>
  value !== null && typeof value === "object" && !Array.isArray(value)

const exactKeys = (value: RecordValue, expected: readonly string[]): boolean => {
  const actual = Object.keys(value).sort()
  const wanted = [...expected].sort()
  return actual.length === wanted.length &&
    actual.every((key, index) => key === wanted[index])
}

const deepFreeze = <T>(value: T): Readonly<T> => {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as RecordValue)) deepFreeze(child)
    Object.freeze(value)
  }
  return value
}

const sha256 = (value: Uint8Array | string): Sha256 =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`

const fail = (code: string): never => {
  throw new TypeError(code)
}

const isWithin = (parent: string, candidate: string): boolean =>
  candidate === parent || candidate.startsWith(`${parent}${path.sep}`)

const assertStoreRoot = (repoRootInput: string, storeRootInput: string): string => {
  if (!path.isAbsolute(storeRootInput)) fail("V138_CUSTODY_ROOT_NOT_ABSOLUTE")
  const repoRoot = path.resolve(repoRootInput)
  const root = path.resolve(storeRootInput)
  if (isWithin(repoRoot, root)) fail("V138_CUSTODY_ROOT_IN_REPOSITORY")
  if (existsSync(root)) {
    const stat = lstatSync(root)
    if (stat.isSymbolicLink()) fail("V138_CUSTODY_SYMLINK")
    if (!stat.isDirectory()) fail("V138_CUSTODY_PATH_INVALID")
    if ((stat.mode & 0o777) !== 0o700) fail("V138_CUSTODY_DIRECTORY_MODE_INVALID")
  } else {
    mkdirSync(root, { recursive: true, mode: 0o700 })
  }
  return root
}

const resolveInside = (root: string, relative: string): string => {
  if (path.isAbsolute(relative) || relative.includes("..")) {
    fail("V138_CUSTODY_PATH_TRAVERSAL")
  }
  const target = path.resolve(root, relative)
  if (!isWithin(root, target)) fail("V138_CUSTODY_PATH_TRAVERSAL")
  return target
}

const ensureRestrictedDirectory = (root: string, relative: string): string => {
  const target = resolveInside(root, relative)
  if (existsSync(target)) {
    const stat = lstatSync(target)
    if (stat.isSymbolicLink()) fail("V138_CUSTODY_SYMLINK")
    if (!stat.isDirectory()) fail("V138_CUSTODY_PATH_INVALID")
    if ((stat.mode & 0o777) !== 0o700) fail("V138_CUSTODY_DIRECTORY_MODE_INVALID")
  } else {
    mkdirSync(target, { recursive: true, mode: 0o700 })
  }
  return target
}

const assertRegularNoFollow = (target: string): void => {
  const stat = lstatSync(target)
  if (stat.isSymbolicLink()) fail("V138_CUSTODY_SYMLINK")
  if (!stat.isFile()) fail("V138_CUSTODY_PATH_INVALID")
  if ((stat.mode & 0o777) !== 0o600) fail("V138_CUSTODY_FILE_MODE_INVALID")
}

const readBoundedNoFollow = (target: string, limit: number): Buffer => {
  assertRegularNoFollow(target)
  let descriptor: number | undefined
  try {
    descriptor = openSync(target, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0))
    const bytes = readFileSync(descriptor)
    if (bytes.byteLength > limit) fail("V138_CUSTODY_SIZE_LIMIT")
    return bytes
  } finally {
    if (descriptor !== undefined) closeSync(descriptor)
  }
}

interface StoredCommitment {
  readonly schemaVersion: "v1.38-synthetic-custody-private-record-v1"
  readonly dataClass: "synthetic_non_holdout"
  readonly profile: "hmac-sha-256-secret-salted-v1"
  readonly digest: Sha256
  readonly sealedBytesSha256: Sha256
  readonly profileNeutralProtocolRoot: Sha256
  readonly byteLength: number
  readonly maxSealedBytes: number
}

const commitmentKeys = [
  "schemaVersion", "dataClass", "profile", "digest", "sealedBytesSha256",
  "profileNeutralProtocolRoot", "byteLength", "maxSealedBytes",
] as const

const renderStoredCommitment = (record: StoredCommitment): string =>
  `${JSON.stringify(record)}\n`

const parseStoredCommitment = (bytes: Buffer): StoredCommitment => {
  let input: unknown
  try {
    input = JSON.parse(bytes.toString("utf8"))
  } catch {
    fail("V138_CUSTODY_COMMITMENT_RECORD_INVALID")
  }
  if (!isRecord(input) || !exactKeys(input, commitmentKeys)) {
    fail("V138_CUSTODY_COMMITMENT_RECORD_INVALID")
  }
  const value = input as RecordValue
  if (
    value.schemaVersion !== "v1.38-synthetic-custody-private-record-v1" ||
    value.dataClass !== "synthetic_non_holdout" ||
    value.profile !== "hmac-sha-256-secret-salted-v1" ||
    typeof value.digest !== "string" || !SHA256.test(value.digest) ||
    typeof value.sealedBytesSha256 !== "string" || !SHA256.test(value.sealedBytesSha256) ||
    typeof value.profileNeutralProtocolRoot !== "string" ||
    !SHA256.test(value.profileNeutralProtocolRoot) ||
    typeof value.byteLength !== "number" || !Number.isSafeInteger(value.byteLength) ||
    value.byteLength < 1 ||
    typeof value.maxSealedBytes !== "number" ||
    !Number.isSafeInteger(value.maxSealedBytes) ||
    value.maxSealedBytes < value.byteLength || value.maxSealedBytes > 1_048_576
  ) fail("V138_CUSTODY_COMMITMENT_RECORD_INVALID")
  const parsed = value as unknown as StoredCommitment
  if (renderStoredCommitment(parsed) !== bytes.toString("utf8")) {
    fail("V138_CUSTODY_COMMITMENT_RECORD_NONCANONICAL")
  }
  return Object.freeze({ ...parsed })
}

const commitmentDigest = (
  keyedMaterial: Uint8Array,
  salt: Uint8Array,
  protocolRoot: Sha256,
  sealedBytes: Uint8Array,
): Sha256 => {
  const digest = createHmac("sha256", keyedMaterial)
    .update(`${COMMITMENT_DOMAIN}\0`)
    .update(protocolRoot)
    .update("\0")
    .update(salt)
    .update("\0")
    .update(sealedBytes)
    .digest("hex")
  return `sha256:${digest}`
}

type CustodyState =
  | "committed"
  | "open_authorized"
  | "opened"
  | "projected"
  | "verified"
  | "contaminated"
  | "retired"

type EventCommand =
  | "commit"
  | "authorizeOpen"
  | "openOnce"
  | "projectSafeReceipt"
  | "verify"
  | "markContaminated"
  | "retire"

interface CustodyEvent {
  readonly schemaVersion: "v1.38-synthetic-custody-event-v1"
  readonly sequence: number
  readonly command: EventCommand
  readonly outcome: "accepted" | "rejected"
  readonly code: string
  readonly state: CustodyState
}

const eventKeys = ["schemaVersion", "sequence", "command", "outcome", "code", "state"] as const

const parseEvents = (root: string): CustodyEvent[] => {
  const target = resolveInside(root, EVENTS_PATH)
  if (!existsSync(target)) return []
  const bytes = readBoundedNoFollow(target, 1_048_576)
  if (bytes.byteLength === 0) fail("V138_CUSTODY_EVENT_LOG_INVALID")
  const text = bytes.toString("utf8")
  if (!text.endsWith("\n")) fail("V138_CUSTODY_EVENT_LOG_INVALID")
  return text.trimEnd().split("\n").map((line, index) => {
    let input: unknown
    try { input = JSON.parse(line) } catch { fail("V138_CUSTODY_EVENT_LOG_INVALID") }
    if (!isRecord(input) || !exactKeys(input, eventKeys) ||
      input.schemaVersion !== "v1.38-synthetic-custody-event-v1" ||
      input.sequence !== index + 1 ||
      !["commit", "authorizeOpen", "openOnce", "projectSafeReceipt", "verify", "markContaminated", "retire"].includes(input.command as string) ||
      !["accepted", "rejected"].includes(input.outcome as string) ||
      typeof input.code !== "string" || input.code.length < 1 || input.code.length > 96 ||
      !["committed", "open_authorized", "opened", "projected", "verified", "contaminated", "retired"].includes(input.state as string)) {
      fail("V138_CUSTODY_EVENT_LOG_INVALID")
    }
    return Object.freeze({ ...(input as unknown as CustodyEvent) })
  })
}

const currentState = (events: readonly CustodyEvent[]): CustodyState => {
  const accepted = events.filter((event) => event.outcome === "accepted")
  if (accepted.length === 0 || accepted[0]?.command !== "commit") {
    fail("V138_CUSTODY_EVENT_LOG_INVALID")
  }
  return events.at(-1)!.state
}

const appendEvent = (
  root: string,
  event: Omit<CustodyEvent, "schemaVersion" | "sequence">,
): void => {
  ensureRestrictedDirectory(root, "events")
  const target = resolveInside(root, EVENTS_PATH)
  if (existsSync(target)) assertRegularNoFollow(target)
  const sequence = parseEvents(root).length + 1
  const line = `${JSON.stringify({
    schemaVersion: "v1.38-synthetic-custody-event-v1",
    sequence,
    ...event,
  })}\n`
  let descriptor: number | undefined
  try {
    descriptor = openSync(
      target,
      constants.O_CREAT | constants.O_APPEND | constants.O_WRONLY |
        (constants.O_NOFOLLOW ?? 0),
      0o600,
    )
    writeSync(descriptor, line)
    fsyncSync(descriptor)
  } finally {
    if (descriptor !== undefined) closeSync(descriptor)
  }
}

const stableFailure = (
  root: string,
  command: EventCommand,
  state: CustodyState,
  error: unknown,
): never => {
  const code = error instanceof Error && /^V138_CUSTODY_[A-Z0-9_]+$/u.test(error.message)
    ? error.message
    : "V138_CUSTODY_COMMAND_INVALID"
  appendEvent(root, { command, outcome: "rejected", code, state })
  return fail(code)
}

const loadPrivateRecord = (root: string): StoredCommitment =>
  parseStoredCommitment(readBoundedNoFollow(
    resolveInside(root, COMMITMENT_PATH),
    4_096,
  ))

export interface V138CustodyCommitmentInput {
  readonly repoRoot: string
  readonly storeRoot: string
  readonly sealedBytes: Uint8Array
  readonly keyedMaterial: Uint8Array
  readonly salt: Uint8Array
  readonly dataClass: "synthetic_non_holdout"
  readonly profileNeutralProtocolRoot: Sha256
  readonly maxSealedBytes: number
}

const commitmentInputKeys = [
  "repoRoot", "storeRoot", "sealedBytes", "keyedMaterial", "salt", "dataClass",
  "profileNeutralProtocolRoot", "maxSealedBytes",
] as const

export const createV138CustodyCommitment = (input: V138CustodyCommitmentInput) => {
  if (!isRecord(input) || !exactKeys(input, commitmentInputKeys) ||
    typeof input.repoRoot !== "string" || typeof input.storeRoot !== "string" ||
    !(input.sealedBytes instanceof Uint8Array) || !(input.keyedMaterial instanceof Uint8Array) ||
    !(input.salt instanceof Uint8Array) || input.dataClass !== "synthetic_non_holdout" ||
    typeof input.profileNeutralProtocolRoot !== "string" ||
    !SHA256.test(input.profileNeutralProtocolRoot) ||
    typeof input.maxSealedBytes !== "number" ||
    !Number.isSafeInteger(input.maxSealedBytes) || input.maxSealedBytes < 1 ||
    input.maxSealedBytes > 1_048_576 || input.keyedMaterial.byteLength < 16 ||
    input.keyedMaterial.byteLength > 4_096 || input.salt.byteLength < 16 ||
    input.salt.byteLength > 4_096) fail("V138_CUSTODY_COMMITMENT_INPUT_INVALID")
  if (input.sealedBytes.byteLength < 1 || input.sealedBytes.byteLength > input.maxSealedBytes) {
    fail("V138_CUSTODY_SIZE_LIMIT")
  }
  const root = assertStoreRoot(input.repoRoot, input.storeRoot)
  ensureRestrictedDirectory(root, "commitment")
  ensureRestrictedDirectory(root, "objects")
  ensureRestrictedDirectory(root, "events")
  ensureRestrictedDirectory(root, "authorization")
  const commitmentTarget = resolveInside(root, COMMITMENT_PATH)
  const objectTarget = resolveInside(root, OBJECT_PATH)
  if (existsSync(commitmentTarget) || existsSync(objectTarget)) {
    const state = existsSync(resolveInside(root, EVENTS_PATH))
      ? currentState(parseEvents(root))
      : "committed"
    stableFailure(root, "commit", state, new TypeError("V138_CUSTODY_COMMIT_ALREADY_EXISTS"))
  }
  const digest = commitmentDigest(
    input.keyedMaterial,
    input.salt,
    input.profileNeutralProtocolRoot,
    input.sealedBytes,
  )
  const record: StoredCommitment = Object.freeze({
    schemaVersion: "v1.38-synthetic-custody-private-record-v1",
    dataClass: "synthetic_non_holdout",
    profile: "hmac-sha-256-secret-salted-v1",
    digest,
    sealedBytesSha256: sha256(input.sealedBytes),
    profileNeutralProtocolRoot: input.profileNeutralProtocolRoot,
    byteLength: input.sealedBytes.byteLength,
    maxSealedBytes: input.maxSealedBytes,
  })
  writeFileSync(objectTarget, input.sealedBytes, { flag: "wx", mode: 0o600 })
  writeFileSync(commitmentTarget, renderStoredCommitment(record), { flag: "wx", mode: 0o600 })
  appendEvent(root, {
    command: "commit", outcome: "accepted", code: "V138_CUSTODY_COMMITTED", state: "committed",
  })
  return deepFreeze({
    schemaVersion: "v1.38-synthetic-custody-commitment-v1" as const,
    profile: record.profile,
    digest,
    profileNeutralProtocolRoot: record.profileNeutralProtocolRoot,
    byteLength: record.byteLength,
    custodyStatus: "unavailable" as const,
    satisfiesSeal01: false as const,
  })
}

export interface V138CustodyCommandOptions {
  readonly repoRoot: string
  readonly storeRoot: string
  readonly keyedMaterial: Uint8Array
  readonly salt: Uint8Array
}

export type V138CustodyCommand =
  | Readonly<{ kind: "authorizeOpen"; actorId: string; commandId: string }>
  | Readonly<{ kind: "openOnce"; actorId: string; commandId: string }>
  | Readonly<{ kind: "verify" }>
  | Readonly<{ kind: "markContaminated"; reason: string }>
  | Readonly<{ kind: "retire" }>

const optionsKeys = ["repoRoot", "storeRoot", "keyedMaterial", "salt"] as const

interface OpenAuthorization {
  readonly schemaVersion: "v1.38-synthetic-open-authorization-v1"
  readonly actorId: string
  readonly commandId: string
  readonly openOrdinal: 1
}

const renderOpenAuthorization = (authorization: OpenAuthorization): string =>
  `${JSON.stringify(authorization)}\n`

const parseOpenAuthorization = (root: string): OpenAuthorization => {
  const bytes = readBoundedNoFollow(resolveInside(root, OPEN_AUTHORIZATION_PATH), 1_024)
  let input: unknown
  try { input = JSON.parse(bytes.toString("utf8")) }
  catch { fail("V138_CUSTODY_OPEN_AUTHORIZATION_INVALID") }
  if (!isRecord(input) || !exactKeys(input, ["schemaVersion", "actorId", "commandId", "openOrdinal"]) ||
    input.schemaVersion !== "v1.38-synthetic-open-authorization-v1" ||
    typeof input.actorId !== "string" || !SYNTHETIC_ID.test(input.actorId) ||
    typeof input.commandId !== "string" || !SYNTHETIC_ID.test(input.commandId) ||
    input.openOrdinal !== 1) fail("V138_CUSTODY_OPEN_AUTHORIZATION_INVALID")
  const parsed = input as unknown as OpenAuthorization
  if (renderOpenAuthorization(parsed) !== bytes.toString("utf8")) {
    fail("V138_CUSTODY_OPEN_AUTHORIZATION_INVALID")
  }
  return Object.freeze({ ...parsed })
}

const validateOptions = (input: V138CustodyCommandOptions): string => {
  if (!isRecord(input) || !exactKeys(input, optionsKeys) ||
    typeof input.repoRoot !== "string" || typeof input.storeRoot !== "string" ||
    !(input.keyedMaterial instanceof Uint8Array) || !(input.salt instanceof Uint8Array) ||
    input.keyedMaterial.byteLength < 16 || input.keyedMaterial.byteLength > 4_096 ||
    input.salt.byteLength < 16 || input.salt.byteLength > 4_096) {
    fail("V138_CUSTODY_COMMAND_OPTIONS_INVALID")
  }
  return assertStoreRoot(input.repoRoot, input.storeRoot)
}

const verifyCommitment = (root: string, options: V138CustodyCommandOptions): StoredCommitment => {
  const record = loadPrivateRecord(root)
  const bytes = readBoundedNoFollow(resolveInside(root, OBJECT_PATH), record.maxSealedBytes)
  if (bytes.byteLength !== record.byteLength || sha256(bytes) !== record.sealedBytesSha256) {
    fail("V138_CUSTODY_CONTENT_MISMATCH")
  }
  const expected = commitmentDigest(
    options.keyedMaterial,
    options.salt,
    record.profileNeutralProtocolRoot,
    bytes,
  )
  const actualBytes = Buffer.from(record.digest.slice("sha256:".length), "hex")
  const expectedBytes = Buffer.from(expected.slice("sha256:".length), "hex")
  if (actualBytes.byteLength !== expectedBytes.byteLength ||
    !timingSafeEqual(actualBytes, expectedBytes)) {
    fail("V138_CUSTODY_COMMITMENT_MISMATCH")
  }
  return record
}

const commandResult = (state: CustodyState, record: StoredCommitment) => deepFreeze({
  schemaVersion: "v1.38-synthetic-custody-command-result-v1" as const,
  state,
  commitmentDigest: record.digest,
  custodyStatus: state === "contaminated" ? "contaminated" as const : "unavailable" as const,
  satisfiesSeal01: false as const,
  candidateSearchAuthorized: false as const,
  phase263Authorized: false as const,
  formationMaterializationAuthorized: false as const,
  productionAuthorized: false as const,
})

export const executeV138CustodyCommand = (
  options: V138CustodyCommandOptions,
  command: V138CustodyCommand,
): ReturnType<typeof commandResult> => {
  const root = validateOptions(options)
  const events = parseEvents(root)
  const state = currentState(events)
  if (!isRecord(command) || typeof command.kind !== "string") {
    return stableFailure(root, "verify", state, new TypeError("V138_CUSTODY_COMMAND_INVALID"))
  }
  const kind = command.kind as EventCommand
  const eventCommand: EventCommand = [
    "authorizeOpen", "openOnce", "verify", "markContaminated", "retire",
  ].includes(kind) ? kind : "verify"
  try {
    if (state === "retired" || (state === "contaminated" && kind !== "retire")) {
      fail("V138_CUSTODY_TERMINAL")
    }
    if (command.kind === "authorizeOpen") {
      if (!exactKeys(command, ["kind", "actorId", "commandId"]) ||
        typeof command.actorId !== "string" || !SYNTHETIC_ID.test(command.actorId) ||
        typeof command.commandId !== "string" || !SYNTHETIC_ID.test(command.commandId)) {
        fail("V138_CUSTODY_OPEN_AUTHORIZATION_INVALID")
      }
      if (state !== "committed") fail("V138_CUSTODY_OPEN_AUTHORIZATION_INVALID")
      const record = verifyCommitment(root, options)
      const authorization: OpenAuthorization = Object.freeze({
        schemaVersion: "v1.38-synthetic-open-authorization-v1",
        actorId: command.actorId,
        commandId: command.commandId,
        openOrdinal: 1,
      })
      writeFileSync(
        resolveInside(root, OPEN_AUTHORIZATION_PATH),
        renderOpenAuthorization(authorization),
        { flag: "wx", mode: 0o600 },
      )
      appendEvent(root, { command: kind, outcome: "accepted", code: "V138_CUSTODY_OPEN_AUTHORIZED", state: "open_authorized" })
      return commandResult("open_authorized", record)
    }
    if (command.kind === "openOnce") {
      if (!exactKeys(command, ["kind", "actorId", "commandId"]) ||
        typeof command.actorId !== "string" || !SYNTHETIC_ID.test(command.actorId) ||
        typeof command.commandId !== "string" || !SYNTHETIC_ID.test(command.commandId)) {
        fail("V138_CUSTODY_OPEN_AUTHORIZATION_INVALID")
      }
      if (events.some((event) => event.command === "openOnce" && event.outcome === "accepted")) {
        fail("V138_CUSTODY_OPEN_ALREADY_CONSUMED")
      }
      if (state !== "open_authorized") fail("V138_CUSTODY_OPEN_NOT_AUTHORIZED")
      const authorization = parseOpenAuthorization(root)
      if (command.actorId !== authorization.actorId || command.commandId !== authorization.commandId) {
        fail("V138_CUSTODY_OPEN_NOT_AUTHORIZED")
      }
      const record = verifyCommitment(root, options)
      appendEvent(root, { command: kind, outcome: "accepted", code: "V138_CUSTODY_OPENED_ONCE", state: "opened" })
      return commandResult("opened", record)
    }
    if (command.kind === "verify") {
      if (!exactKeys(command, ["kind"])) fail("V138_CUSTODY_COMMAND_INVALID")
      const record = verifyCommitment(root, options)
      const nextState: CustodyState = state === "projected" ? "verified" : state
      appendEvent(root, { command: kind, outcome: "accepted", code: "V138_CUSTODY_VERIFIED", state: nextState })
      return commandResult(nextState, record)
    }
    if (command.kind === "markContaminated") {
      if (!exactKeys(command, ["kind", "reason"]) ||
        typeof command.reason !== "string" || !SYNTHETIC_ID.test(command.reason)) {
        fail("V138_CUSTODY_CONTAMINATION_REASON_INVALID")
      }
      const record = loadPrivateRecord(root)
      appendEvent(root, { command: kind, outcome: "accepted", code: "V138_CUSTODY_CONTAMINATED_TERMINAL", state: "contaminated" })
      return commandResult("contaminated", record)
    }
    if (command.kind === "retire") {
      if (!exactKeys(command, ["kind"])) fail("V138_CUSTODY_COMMAND_INVALID")
      if (!(["verified", "contaminated"] as CustodyState[]).includes(state)) {
        fail("V138_CUSTODY_RETIREMENT_NOT_AUTHORIZED")
      }
      const record = verifyCommitment(root, options)
      unlinkSync(resolveInside(root, OBJECT_PATH))
      appendEvent(root, { command: kind, outcome: "accepted", code: "V138_CUSTODY_RETIRED", state: "retired" })
      return commandResult("retired", record)
    }
    return fail("V138_CUSTODY_COMMAND_INVALID")
  } catch (error) {
    return stableFailure(root, eventCommand, state, error)
  }
}

export interface V138SyntheticSafeProjection {
  readonly schemaVersion: "v1.38-synthetic-safe-receipt-v1"
  readonly aggregateStatus: "synthetic_mechanics_passed" | "synthetic_mechanics_failed"
  readonly evaluatedItemCount: number
  readonly findingCount: number
  readonly resultRoot: Sha256
}

const projectionKeys = [
  "schemaVersion", "aggregateStatus", "evaluatedItemCount", "findingCount", "resultRoot",
] as const

export const projectV138SafeCustodyReceipt = (
  options: V138CustodyCommandOptions,
  projection: V138SyntheticSafeProjection,
) => {
  const root = validateOptions(options)
  const state = currentState(parseEvents(root))
  try {
    if (state === "retired" || state === "contaminated") fail("V138_CUSTODY_TERMINAL")
    if (state !== "opened") fail("V138_CUSTODY_PROJECTION_NOT_AUTHORIZED")
    if (!isRecord(projection) || !exactKeys(projection, projectionKeys) ||
      projection.schemaVersion !== "v1.38-synthetic-safe-receipt-v1" ||
      !["synthetic_mechanics_passed", "synthetic_mechanics_failed"].includes(projection.aggregateStatus) ||
      typeof projection.evaluatedItemCount !== "number" ||
      !Number.isSafeInteger(projection.evaluatedItemCount) ||
      projection.evaluatedItemCount < 0 || projection.evaluatedItemCount > 10_000 ||
      typeof projection.findingCount !== "number" ||
      !Number.isSafeInteger(projection.findingCount) || projection.findingCount < 0 ||
      projection.findingCount > projection.evaluatedItemCount ||
      typeof projection.resultRoot !== "string" || !SHA256.test(projection.resultRoot)) {
      fail("V138_CUSTODY_SAFE_PROJECTION_INVALID")
    }
    const record = verifyCommitment(root, options)
    const receipt = deepFreeze({
      schemaVersion: projection.schemaVersion,
      aggregateStatus: projection.aggregateStatus,
      evaluatedItemCount: projection.evaluatedItemCount,
      findingCount: projection.findingCount,
      resultRoot: projection.resultRoot,
      commitmentDigest: record.digest,
      profileNeutralProtocolRoot: record.profileNeutralProtocolRoot,
      openOrdinal: 1 as const,
      custodyStatus: "unavailable" as const,
      satisfiesSeal01: false as const,
    })
    assertPublicOutputLeakSafe(receipt, "v1.38 synthetic custody safe receipt")
    const encoded = Buffer.from(JSON.stringify(receipt), "utf8")
    if (Object.keys(receipt).length > 10 || encoded.byteLength > 4_096) {
      fail("V138_CUSTODY_SAFE_PROJECTION_INVALID")
    }
    appendEvent(root, { command: "projectSafeReceipt", outcome: "accepted", code: "V138_CUSTODY_SAFE_RECEIPT_PROJECTED", state: "projected" })
    return receipt
  } catch (error) {
    const code = error instanceof Error
      ? error.message
      : "V138_CUSTODY_SAFE_PROJECTION_INVALID"
    if (state === "opened" && code === "V138_CUSTODY_SAFE_PROJECTION_INVALID") {
      appendEvent(root, {
        command: "projectSafeReceipt",
        outcome: "rejected",
        code,
        state: "contaminated",
      })
      return fail(code)
    }
    return stableFailure(root, "projectSafeReceipt", state, error)
  }
}

export interface V138AuthorizedCustodyHandoff {
  readonly schemaVersion: "v1.38-authorized-custody-handoff-v1"
  readonly commitment: RecordValue
  readonly controls: RecordValue
  readonly opening: RecordValue
  readonly ledger: RecordValue
  readonly safeProjection: RecordValue
  readonly contamination: RecordValue
  readonly retention: RecordValue
  readonly lineage: RecordValue
  readonly preSearchPolicy: RecordValue
  readonly provenance: RecordValue
}

type ExactSchema<T> = Readonly<{
  parse(input: unknown): Readonly<T>
  safeParse(input: unknown):
    | Readonly<{ success: true; data: Readonly<T> }>
    | Readonly<{ success: false; error: TypeError }>
}>

const requireObject = (parent: RecordValue, key: string, keys: readonly string[]): RecordValue => {
  const value = parent[key]
  if (!isRecord(value) || !exactKeys(value, keys)) throw new TypeError()
  return value
}

const parseAuthorizedHandoff = (input: unknown): V138AuthorizedCustodyHandoff => {
  if (!isRecord(input) || !exactKeys(input, [
    "schemaVersion", "commitment", "controls", "opening", "ledger",
    "safeProjection", "contamination", "retention", "lineage",
    "preSearchPolicy", "provenance",
  ]) || input.schemaVersion !== "v1.38-authorized-custody-handoff-v1") throw new TypeError()
  const commitment = requireObject(input, "commitment", ["profile", "digest", "profileNeutralProtocolRoot"])
  const controls = requireObject(input, "controls", ["opaqueStoreId", "opaqueKeyId", "opaqueCustodianRoleId", "separatelyPermissioned"])
  const opening = requireObject(input, "opening", ["opaqueActorId", "opaqueCommandId", "openOrdinal", "oneOpenOnly"])
  const ledger = requireObject(input, "ledger", ["accessLedgerRoot", "queryLedgerRoot", "appendOnly", "rawQueriesExposed"])
  const safeProjection = requireObject(input, "safeProjection", ["schemaId", "fieldAllowlistRoot", "cardinalityMax", "byteMax"])
  const contamination = requireObject(input, "contamination", ["responsePolicyId", "terminal", "replacementAllowed"])
  const retention = requireObject(input, "retention", ["policyId", "opaqueRetirementAuthorityId"])
  const lineage = requireObject(input, "lineage", [
    "lineageRoot", "sourceDataExcluded", "trainingDataExcluded", "promptsExcluded",
    "cachesExcluded", "opponentConstructionExcluded", "scheduleConstructionExcluded",
  ])
  const preSearchPolicy = requireObject(input, "preSearchPolicy", ["policyRoot", "exactBytesSha256"])
  const provenance = requireObject(input, "provenance", [
    "opaqueTrustIdentityId", "opaqueIssuerIdentityId", "envelopeDigest",
    "signatureProfile", "selfIssued",
  ])
  const hashes = [commitment.digest, commitment.profileNeutralProtocolRoot,
    ledger.accessLedgerRoot, ledger.queryLedgerRoot, safeProjection.fieldAllowlistRoot,
    lineage.lineageRoot, preSearchPolicy.policyRoot, preSearchPolicy.exactBytesSha256,
    provenance.envelopeDigest]
  const identifiers = [controls.opaqueStoreId, controls.opaqueKeyId,
    controls.opaqueCustodianRoleId, opening.opaqueActorId, opening.opaqueCommandId,
    safeProjection.schemaId, contamination.responsePolicyId, retention.policyId,
    retention.opaqueRetirementAuthorityId, provenance.opaqueTrustIdentityId,
    provenance.opaqueIssuerIdentityId]
  if (commitment.profile !== "hmac-sha-256-secret-salted-v1" ||
    !hashes.every((value) => typeof value === "string" && SHA256.test(value)) ||
    !identifiers.every((value) => typeof value === "string" && OPAQUE_ID.test(value)) ||
    controls.separatelyPermissioned !== true || opening.openOrdinal !== 1 ||
    opening.oneOpenOnly !== true || ledger.appendOnly !== true ||
    ledger.rawQueriesExposed !== false || safeProjection.cardinalityMax !== 16 ||
    safeProjection.byteMax !== 4_096 || contamination.terminal !== true ||
    contamination.replacementAllowed !== false ||
    Object.entries(lineage).some(([key, value]) => key !== "lineageRoot" && value !== true) ||
    provenance.signatureProfile !== "approved-external-authentication-v1" ||
    provenance.selfIssued !== false ||
    provenance.opaqueTrustIdentityId === provenance.opaqueIssuerIdentityId) throw new TypeError()
  return input as unknown as V138AuthorizedCustodyHandoff
}

export const V138AuthorizedCustodyHandoffSchema: ExactSchema<V138AuthorizedCustodyHandoff> = Object.freeze({
  parse(input: unknown) {
    try { return deepFreeze(globalThis.structuredClone(parseAuthorizedHandoff(input))) }
    catch { throw new TypeError("V138_AUTHORIZED_CUSTODY_HANDOFF_INVALID") }
  },
  safeParse(input: unknown) {
    try { return Object.freeze({ success: true as const, data: this.parse(input) }) }
    catch { return Object.freeze({ success: false as const, error: new TypeError("V138_AUTHORIZED_CUSTODY_HANDOFF_INVALID") }) }
  },
})

export interface V138AuthorizedCustodyApproval {
  readonly approvedOpaqueStoreIds: readonly string[]
  readonly approvedOpaqueKeyIds: readonly string[]
  readonly approvedOpaqueCustodianRoleIds: readonly string[]
  readonly approvedOpaqueOpeningActorIds: readonly string[]
  readonly approvedOpaqueOpeningCommandIds: readonly string[]
  readonly approvedOpaqueRetirementAuthorityIds: readonly string[]
  readonly approvedOpaqueTrustIdentityIds: readonly string[]
  readonly verifyAuthenticatedExternalProvenance: (
    handoff: Readonly<V138AuthorizedCustodyHandoff>,
  ) => boolean
}

const approvalKeys = [
  "approvedOpaqueStoreIds", "approvedOpaqueKeyIds", "approvedOpaqueCustodianRoleIds",
  "approvedOpaqueOpeningActorIds", "approvedOpaqueOpeningCommandIds",
  "approvedOpaqueRetirementAuthorityIds", "approvedOpaqueTrustIdentityIds",
  "verifyAuthenticatedExternalProvenance",
] as const

export const validateV138AuthorizedCustodyHandoff = (
  input: unknown,
  approval: V138AuthorizedCustodyApproval,
) => {
  const parsed = V138AuthorizedCustodyHandoffSchema.safeParse(input)
  if (!parsed.success || !isRecord(approval) || !exactKeys(approval, approvalKeys) ||
    typeof approval.verifyAuthenticatedExternalProvenance !== "function") {
    return Object.freeze({ authorized: false as const, satisfiesSeal01: false as const, reason: "invalid_or_unverified" as const })
  }
  const handoff = parsed.data
  const controls = handoff.controls as RecordValue
  const opening = handoff.opening as RecordValue
  const retention = handoff.retention as RecordValue
  const provenance = handoff.provenance as RecordValue
  const memberships: Array<[unknown, unknown]> = [
    [approval.approvedOpaqueStoreIds, controls.opaqueStoreId],
    [approval.approvedOpaqueKeyIds, controls.opaqueKeyId],
    [approval.approvedOpaqueCustodianRoleIds, controls.opaqueCustodianRoleId],
    [approval.approvedOpaqueOpeningActorIds, opening.opaqueActorId],
    [approval.approvedOpaqueOpeningCommandIds, opening.opaqueCommandId],
    [approval.approvedOpaqueRetirementAuthorityIds, retention.opaqueRetirementAuthorityId],
    [approval.approvedOpaqueTrustIdentityIds, provenance.opaqueTrustIdentityId],
  ]
  if (memberships.some(([values, value]) => !Array.isArray(values) ||
    values.length === 0 || !values.every((entry) => typeof entry === "string") ||
    typeof value !== "string" || !values.includes(value))) {
    return Object.freeze({ authorized: false as const, satisfiesSeal01: false as const, reason: "control_not_approved" as const })
  }
  let authenticated = false
  try { authenticated = approval.verifyAuthenticatedExternalProvenance(handoff) === true }
  catch { authenticated = false }
  return authenticated
    ? Object.freeze({ authorized: true as const, satisfiesSeal01: true as const, reason: "verified_external_controls" as const, handoff })
    : Object.freeze({ authorized: false as const, satisfiesSeal01: false as const, reason: "external_authentication_failed" as const })
}

export const buildV138AuthorizedCustodyPublicReference = (
  handoff: Readonly<V138AuthorizedCustodyHandoff>,
) => {
  const commitment = handoff.commitment as RecordValue
  const controls = handoff.controls as RecordValue
  const opening = handoff.opening as RecordValue
  const ledger = handoff.ledger as RecordValue
  const safeProjection = handoff.safeProjection as RecordValue
  const contamination = handoff.contamination as RecordValue
  const retention = handoff.retention as RecordValue
  const lineage = handoff.lineage as RecordValue
  const preSearchPolicy = handoff.preSearchPolicy as RecordValue
  const provenance = handoff.provenance as RecordValue
  const reference = deepFreeze({
    schemaVersion: "v1.38-authorized-custody-public-reference-v1" as const,
    commitmentProfile: commitment.profile,
    commitmentDigest: commitment.digest,
    profileNeutralProtocolRoot: commitment.profileNeutralProtocolRoot,
    opaqueStoreId: controls.opaqueStoreId,
    opaqueKeyId: controls.opaqueKeyId,
    opaqueCustodianRoleId: controls.opaqueCustodianRoleId,
    opaqueOpeningActorId: opening.opaqueActorId,
    opaqueOpeningCommandId: opening.opaqueCommandId,
    openOrdinal: opening.openOrdinal,
    accessLedgerRoot: ledger.accessLedgerRoot,
    queryLedgerRoot: ledger.queryLedgerRoot,
    safeProjectionSchemaId: safeProjection.schemaId,
    fieldAllowlistRoot: safeProjection.fieldAllowlistRoot,
    safeProjectionCardinalityMax: safeProjection.cardinalityMax,
    safeProjectionByteMax: safeProjection.byteMax,
    contaminationResponsePolicyId: contamination.responsePolicyId,
    retentionPolicyId: retention.policyId,
    opaqueRetirementAuthorityId: retention.opaqueRetirementAuthorityId,
    lineageRoot: lineage.lineageRoot,
    preSearchPolicyRoot: preSearchPolicy.policyRoot,
    preSearchPolicyExactBytesSha256: preSearchPolicy.exactBytesSha256,
    opaqueTrustIdentityId: provenance.opaqueTrustIdentityId,
    authenticatedEnvelopeDigest: provenance.envelopeDigest,
    custodyStatus: "authorized" as const,
    satisfiesSeal01: true as const,
  })
  assertPublicOutputLeakSafe(reference, "v1.38 authorized custody public reference")
  if (Object.keys(reference).length > 26 || Buffer.byteLength(JSON.stringify(reference)) > 8_192) {
    fail("V138_AUTHORIZED_CUSTODY_REFERENCE_BOUNDS")
  }
  return reference
}

const canonicalBytes = (value: unknown): Uint8Array => {
  const encoded = encodeCanonicalJson(value as JsonValue, {
    context: "canonical-manifest",
  })
  if (encoded.ok === true) return encoded.bytes
  return fail("V138_SYNTHETIC_CUSTODY_RECEIPT_INVALID")
}

const domainRoot = (domain: string, value: unknown): Sha256 =>
  `sha256:${hashCanonicalIdentity("artifactManifest", [
    Buffer.from(domain, "utf8"),
    canonicalBytes(value),
  ])}`

export interface V138SyntheticCustodyMechanicsReceiptInput {
  readonly custodySourceBytes: Uint8Array
  readonly checkerSourceBytes: Uint8Array
  readonly testSourceBytes: Uint8Array
  readonly protocolPolicyBytes: Uint8Array
  readonly containmentPolicyBytes: Uint8Array
}

const receiptInputKeys = [
  "custodySourceBytes", "checkerSourceBytes", "testSourceBytes",
  "protocolPolicyBytes", "containmentPolicyBytes",
] as const

const parsePolicyBytes = (bytes: Uint8Array, errorCode: string): RecordValue => {
  let parsed: unknown
  try { parsed = JSON.parse(Buffer.from(bytes).toString("utf8")) }
  catch { fail(errorCode) }
  if (!isRecord(parsed)) fail(errorCode)
  return parsed as RecordValue
}

const SYNTHETIC_STATE_TRANSITIONS = Object.freeze([
  Object.freeze({ command: "commit", from: "empty", to: "committed" }),
  Object.freeze({ command: "authorizeOpen", from: "committed", to: "open_authorized" }),
  Object.freeze({ command: "openOnce", from: "open_authorized", to: "opened" }),
  Object.freeze({ command: "projectSafeReceipt", from: "opened", to: "projected" }),
  Object.freeze({ command: "verify", from: "projected", to: "verified" }),
  Object.freeze({ command: "markContaminated", from: "non_retired", to: "contaminated" }),
  Object.freeze({ command: "retire", from: "verified_or_contaminated", to: "retired" }),
])

const receiptKeys = [
  "schemaVersion", "evidenceClass", "mechanicsStatus", "custodyStatus",
  "satisfiesSeal01", "bindings", "stateTransitions", "securityMechanics",
  "genuineControls", "authority", "receiptRoot",
] as const

export const buildV138SyntheticCustodyMechanicsReceipt = (
  input: V138SyntheticCustodyMechanicsReceiptInput,
) => {
  if (!isRecord(input) || !exactKeys(input, receiptInputKeys) ||
    !receiptInputKeys.every((key) => input[key] instanceof Uint8Array)) {
    fail("V138_SYNTHETIC_CUSTODY_RECEIPT_INPUT_INVALID")
  }
  const protocol = parsePolicyBytes(input.protocolPolicyBytes, "V138_SYNTHETIC_CUSTODY_PROTOCOL_INVALID")
  const containment = parsePolicyBytes(input.containmentPolicyBytes, "V138_SYNTHETIC_CUSTODY_CONTAINMENT_INVALID")
  const sourceBindings = protocol.sourceBindings
  const containmentAuthority = containment.authority
  if (!isRecord(sourceBindings) ||
    typeof sourceBindings.classifierImplementationRoot !== "string" ||
    !SHA256.test(sourceBindings.classifierImplementationRoot) ||
    containment.schemaVersion !== "v1.38-pre-formation-containment-policy-v1" ||
    containment.status !== "passed_absence" || containment.findingCount !== 0 ||
    !isRecord(containmentAuthority) ||
    Object.values(containmentAuthority).some((value) => value !== false)) {
    fail("V138_SYNTHETIC_CUSTODY_POLICY_BINDING_INVALID")
  }
  const protocolBindings = sourceBindings as RecordValue
  const bindings = deepFreeze({
    custodySourceSha256: sha256(input.custodySourceBytes),
    checkerSourceSha256: sha256(input.checkerSourceBytes),
    testSourceSha256: sha256(input.testSourceBytes),
    commandSchemaRoot: domainRoot("cowards-game:v1.38:synthetic-custody-command-schema:v1", {
      custodySourceSha256: sha256(input.custodySourceBytes),
      commands: SYNTHETIC_STATE_TRANSITIONS.map(({ command }) => command),
    }),
    handoffSchemaRoot: domainRoot("cowards-game:v1.38:authorized-custody-handoff-schema:v1", {
      custodySourceSha256: sha256(input.custodySourceBytes),
      checkerSourceSha256: sha256(input.checkerSourceBytes),
    }),
    protocolPolicySha256: sha256(input.protocolPolicyBytes),
    profileNeutralProtocolRoot: protocolBindings.classifierImplementationRoot,
    containmentPolicySha256: sha256(input.containmentPolicyBytes),
  })
  const frame = deepFreeze({
    schemaVersion: "v1.38-synthetic-custody-mechanics-v1" as const,
    evidenceClass: "synthetic_mechanics_only" as const,
    mechanicsStatus: "passed" as const,
    custodyStatus: "unavailable" as const,
    satisfiesSeal01: false as const,
    bindings,
    stateTransitions: SYNTHETIC_STATE_TRANSITIONS,
    securityMechanics: Object.freeze({
      outsideRepositoryStoreRequired: true as const,
      directoryMode: "0700" as const,
      fileMode: "0600" as const,
      noFollowReads: true as const,
      exclusiveWrites: true as const,
      appendOnlyFsyncedEvents: true as const,
      commitmentProfile: "hmac-sha-256-secret-salted-v1" as const,
      timingSafeLengthCheckedComparison: true as const,
      oneOpenOnly: true as const,
      invalidProjectionContaminatesTerminally: true as const,
      replacementAllowed: false as const,
      diagnosticQueryAllowed: false as const,
    }),
    genuineControls: Object.freeze({
      present: false as const,
      acceptedOnlyByPlan: "262-40" as const,
    }),
    authority: Object.freeze({
      candidateSearchAuthorized: false as const,
      phase263Authorized: false as const,
      formationMaterializationAuthorized: false as const,
      productionAuthorized: false as const,
    }),
  })
  const receipt = deepFreeze({
    ...frame,
    receiptRoot: domainRoot("cowards-game:v1.38:synthetic-custody-mechanics-receipt:v1", frame),
  })
  assertPublicOutputLeakSafe(receipt, "v1.38 synthetic custody mechanics receipt")
  return receipt
}

const validateSyntheticReceipt = (input: unknown): RecordValue => {
  if (!isRecord(input)) fail("V138_SYNTHETIC_CUSTODY_RECEIPT_INVALID")
  const receipt = input as RecordValue
  if (!exactKeys(receipt, receiptKeys) ||
    receipt.schemaVersion !== "v1.38-synthetic-custody-mechanics-v1" ||
    receipt.evidenceClass !== "synthetic_mechanics_only" ||
    receipt.mechanicsStatus !== "passed" || receipt.custodyStatus !== "unavailable" ||
    receipt.satisfiesSeal01 !== false || !isRecord(receipt.bindings) ||
    !Array.isArray(receipt.stateTransitions) ||
    JSON.stringify(receipt.stateTransitions) !== JSON.stringify(SYNTHETIC_STATE_TRANSITIONS) ||
    !isRecord(receipt.securityMechanics) || !exactKeys(receipt.securityMechanics, [
      "outsideRepositoryStoreRequired", "directoryMode", "fileMode", "noFollowReads",
      "exclusiveWrites", "appendOnlyFsyncedEvents", "commitmentProfile",
      "timingSafeLengthCheckedComparison", "oneOpenOnly",
      "invalidProjectionContaminatesTerminally", "replacementAllowed",
      "diagnosticQueryAllowed",
    ]) || Object.entries(receipt.securityMechanics).some(([key, value]) =>
      key === "directoryMode" ? value !== "0700" :
        key === "fileMode" ? value !== "0600" :
          key === "commitmentProfile" ? value !== "hmac-sha-256-secret-salted-v1" :
            key === "replacementAllowed" || key === "diagnosticQueryAllowed" ? value !== false : value !== true) ||
    !isRecord(receipt.genuineControls) ||
    !exactKeys(receipt.genuineControls, ["present", "acceptedOnlyByPlan"]) ||
    receipt.genuineControls.present !== false || receipt.genuineControls.acceptedOnlyByPlan !== "262-40" ||
    !isRecord(receipt.authority) || !exactKeys(receipt.authority, [
      "candidateSearchAuthorized", "phase263Authorized",
      "formationMaterializationAuthorized", "productionAuthorized",
    ]) || Object.values(receipt.authority).some((value) => value !== false) ||
    typeof receipt.receiptRoot !== "string" || !SHA256.test(receipt.receiptRoot)) {
    fail("V138_SYNTHETIC_CUSTODY_RECEIPT_INVALID")
  }
  const { receiptRoot, ...frame } = receipt
  if (receiptRoot !== domainRoot("cowards-game:v1.38:synthetic-custody-mechanics-receipt:v1", frame)) {
    fail("V138_SYNTHETIC_CUSTODY_RECEIPT_INVALID")
  }
  assertPublicOutputLeakSafe(receipt, "v1.38 synthetic custody mechanics receipt")
  return receipt
}

export const renderV138SyntheticCustodyMechanicsReceipt = (input: unknown): string =>
  `${Buffer.from(canonicalBytes(validateSyntheticReceipt(input))).toString("utf8")}\n`
