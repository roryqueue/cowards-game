import { createHash, randomUUID } from "node:crypto"
import { closeSync, constants, fsyncSync, linkSync, lstatSync, openSync, readFileSync, readdirSync, realpathSync, unlinkSync, writeSync } from "node:fs"
import { basename, join, resolve } from "node:path"
import { admitCanonicalJsonBytes, admitCanonicalJsonValue } from "@cowards/spec"
import { freezeLabValue, labRoot, type LabRoot } from "../contracts.js"
import { createLeagueCellTerminal, LeagueCellTerminalSchema, type LeagueCellTerminal } from "./contracts.js"

const CAP = 262144
const ROOT = /^sha256:[0-9a-f]{64}$/u
const fail = (code: string): never => { throw new TypeError(`LEAGUE_REPOSITORY_${code}`) }
const isRoot = (value: unknown): value is LabRoot => typeof value === "string" && ROOT.test(value)
const digest = (value: unknown): string => { if (!isRoot(value)) return fail("ROOT"); return value.slice(7) }
const bytesRoot = (bytes: Uint8Array): LabRoot => `sha256:${createHash("sha256").update(bytes).digest("hex")}` as LabRoot
const safeDirectory = (directory: string): string => {
  const path = resolve(directory)
  if (!basename(path).startsWith("league-") || realpathSync(path) !== path || !lstatSync(path).isDirectory()) return fail("DIRECTORY")
  return path
}
const artifactName = (root: LabRoot) => `league-artifact-${digest(root)}.bin`
const startName = (root: LabRoot) => `league-cell-${digest(root)}.started.json`
const terminalName = (root: LabRoot) => `league-cell-${digest(root)}.terminal.json`
const lstatSafe = (path: string) => { try { return lstatSync(path) } catch { return null } }
const boundedRead = (path: string): Uint8Array => {
  const stat = lstatSync(path)
  if (!stat.isFile() || stat.size < 1 || stat.size > CAP) return fail("FILE")
  return readFileSync(path)
}
const canonicalBytes = (value: unknown): Uint8Array => {
  const encoded = admitCanonicalJsonValue(value, { profile: "canonical-manifest" })
  if (!encoded.ok || encoded.canonicalByteLength < 1 || encoded.canonicalByteLength > CAP) return fail("CANONICAL")
  return encoded.canonicalBytes
}
const parse = (bytes: Uint8Array): unknown => {
  const parsed = admitCanonicalJsonBytes(bytes, { profile: "canonical-manifest", operation: "require-canonical" })
  if (!parsed.ok) return fail("BYTES")
  return parsed.value
}
const syncDirectory = (directory: string) => {
  const descriptor = openSync(safeDirectory(directory), constants.O_RDONLY)
  try { fsyncSync(descriptor) } finally { closeSync(descriptor) }
}

export interface LeagueRepository {
  readonly directory: string
  readonly durability: Readonly<{ syncDirectory(directory: string): void }>
  readonly temporaryName: (target: string) => string
  readonly beforePublication?: (publication: { target: string; byteLength: number; terminal: boolean }) => void
}

/** Root-only durable pre-dispatch evidence. It deliberately contains no source, memory, or objective payload. */
export interface LeagueCellStart {
  readonly root: LabRoot
  readonly cellRoot: LabRoot
  readonly allocationRoot: LabRoot
}

export interface ReopenedLeagueEvidence {
  readonly issued: false
  readonly records: readonly Readonly<{ start: LeagueCellStart; terminal: LeagueCellTerminal; terminalProvenance: "persisted" | "derived_unterminated_start" }>[]
  /** Incomplete publication files are inspection evidence only; reopening never repairs or removes them. */
  readonly remnants: readonly Readonly<{ name: string; byteLength: number; disposition: "invalid"; persisted: false }>[]
}

const validateStart = (value: unknown): Readonly<LeagueCellStart> => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return fail("START")
  const item = value as Record<string, unknown>
  if (Object.keys(item).sort().join(",") !== "allocationRoot,cellRoot,root" || !isRoot(item.root) || !isRoot(item.cellRoot) || !isRoot(item.allocationRoot)) return fail("START")
  const expected = labRoot("league-cell-start-v1", { cellRoot: item.cellRoot, allocationRoot: item.allocationRoot })
  if (item.root !== expected) return fail("START_ROOT")
  return freezeLabValue({ root: item.root, cellRoot: item.cellRoot, allocationRoot: item.allocationRoot }) as LeagueCellStart
}

const atomic = (repository: LeagueRepository, name: string, bytes: Uint8Array): void => {
  const directory = safeDirectory(repository.directory), target = join(directory, name)
  const existing = lstatSafe(target)
  if (existing) {
    if (!existing.isFile() || bytesRoot(boundedRead(target)) !== bytesRoot(bytes)) return fail("OVERWRITE")
    repository.durability.syncDirectory(directory)
    return
  }
  repository.beforePublication?.({ target, byteLength: bytes.byteLength, terminal: name.endsWith(".terminal.json") })
  const temporary = repository.temporaryName(target)
  if (!temporary.startsWith(`${target}.tmp-`) || basename(temporary) !== temporary.slice(directory.length + 1)) return fail("TEMPORARY")
  const descriptor = openSync(temporary, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY | constants.O_NOFOLLOW, 0o600)
  try { let offset = 0; while (offset < bytes.byteLength) offset += writeSync(descriptor, bytes, offset, bytes.byteLength - offset); fsyncSync(descriptor) } finally { closeSync(descriptor) }
  try { linkSync(temporary, target) } finally { unlinkSync(temporary) }
  repository.durability.syncDirectory(directory)
}

export const createLeagueRepository = (directory: string, options: { readonly syncDirectory?: (directory: string) => void; readonly temporaryName?: (target: string) => string; readonly beforePublication?: LeagueRepository["beforePublication"] } = {}): Readonly<LeagueRepository> =>
  freezeLabValue({ directory: safeDirectory(directory), durability: { syncDirectory: options.syncDirectory ?? syncDirectory }, temporaryName: options.temporaryName ?? ((target) => `${target}.tmp-${randomUUID()}`), ...(options.beforePublication ? { beforePublication: options.beforePublication } : {}) }) as LeagueRepository

/** Raw private artifact identity is content-addressed; safe projections retain only its root. */
export const publishLeagueArtifact = (repository: LeagueRepository, bytes: Uint8Array): LabRoot => {
  if (!(bytes instanceof Uint8Array) || bytes.byteLength < 1 || bytes.byteLength > CAP) return fail("ARTIFACT")
  const root = bytesRoot(bytes); atomic(repository, artifactName(root), bytes); return root
}
export const readLeagueArtifact = (repository: LeagueRepository, root: LabRoot): Uint8Array => {
  const bytes = boundedRead(join(safeDirectory(repository.directory), artifactName(root)))
  if (bytesRoot(bytes) !== root) return fail("ARTIFACT_DIGEST")
  return new Uint8Array(bytes)
}
export const recordLeagueCellStart = (repository: LeagueRepository, start: LeagueCellStart): void => {
  const charged = validateStart(start); atomic(repository, startName(charged.root), canonicalBytes(charged))
}
const readStart = (repository: LeagueRepository, root: LabRoot): Readonly<LeagueCellStart> => validateStart(parse(boundedRead(join(safeDirectory(repository.directory), startName(root)))))
export const publishLeagueCellTerminal = (repository: LeagueRepository, start: LeagueCellStart, terminal: LeagueCellTerminal): void => {
  const charged = readStart(repository, validateStart(start).root)
  const final = LeagueCellTerminalSchema.parse(terminal)
  if (final.cellRoot !== charged.cellRoot) return fail("TERMINAL_BINDING")
  atomic(repository, terminalName(charged.root), canonicalBytes(final))
}

/** Inspection derives a failure projection but never materializes, repairs, or refunds a charge. */
const deriveUnterminatedStart = (start: LeagueCellStart): LeagueCellTerminal => {
  return createLeagueCellTerminal({
    cellRoot: start.cellRoot,
    disposition: "system_failure",
    processValidity: "process_invalid",
    evidenceRoot: labRoot("league-unresolved-charge-v1", { startRoot: start.root, allocationRoot: start.allocationRoot }),
    projection: null,
  })
}

/** Bounded inspection is strictly read-only and returns a literal non-authority marker. */
export const reopenLeagueEvidence = (repository: LeagueRepository, limits: { readonly maxBytes: number; readonly maxRecords: number }): Readonly<ReopenedLeagueEvidence> => {
  if (!Number.isSafeInteger(limits.maxBytes) || !Number.isSafeInteger(limits.maxRecords) || limits.maxBytes < 1 || limits.maxRecords < 1) return fail("READ_LIMITS")
  const directory = safeDirectory(repository.directory), starts: LeagueCellStart[] = [], terminals = new Map<LabRoot, LeagueCellTerminal>(), remnants: Array<ReopenedLeagueEvidence["remnants"][number]> = []
  const temporaryPattern = /^league-(?:artifact-[a-f0-9]{64}\.bin|cell-[a-f0-9]{64}\.(?:started|terminal)\.json)\.tmp-[a-f0-9-]{36}$/u
  let bytes = 0
  for (const name of readdirSync(directory).sort()) {
    if (name.includes(".tmp")) {
      const stat = lstatSafe(join(directory, name))
      if (!temporaryPattern.test(name) || !stat?.isFile() || stat.nlink !== 1 || stat.size < 1 || stat.size > CAP) return fail("UNCERTAIN_TEMPORARY")
      bytes += stat.size
      if (bytes > limits.maxBytes) return fail("READ_LIMIT")
      remnants.push(freezeLabValue({ name, byteLength: stat.size, disposition: "invalid" as const, persisted: false as const }) as ReopenedLeagueEvidence["remnants"][number])
      continue
    }
    const match = /^league-cell-([a-f0-9]{64})\.(started|terminal)\.json$/u.exec(name)
    if (!match) { if (!/^league-artifact-[a-f0-9]{64}\.bin$/u.test(name)) return fail("UNKNOWN_ARTIFACT"); continue }
    const raw = boundedRead(join(directory, name)); bytes += raw.byteLength
    if (bytes > limits.maxBytes) return fail("READ_LIMIT")
    const root = `sha256:${match[1]}` as LabRoot
    if (match[2] === "started") { const start = validateStart(parse(raw)); if (start.root !== root) return fail("START_FILE"); starts.push(start); continue }
    const terminal = LeagueCellTerminalSchema.parse(parse(raw)); if (terminals.has(root)) return fail("DUPLICATE_TERMINAL"); terminals.set(root, terminal)
  }
  if (starts.length + remnants.length > limits.maxRecords || new Set(starts.map((start) => start.root)).size !== starts.length || [...terminals.keys()].some((root) => !starts.some((start) => start.root === root))) return fail("INVENTORY")
  const records = starts.sort((left, right) => left.root.localeCompare(right.root)).map((start) => {
    const persisted = terminals.get(start.root)
    const terminal = persisted ?? deriveUnterminatedStart(start)
    if (terminal.cellRoot !== start.cellRoot) return fail("TERMINAL_BINDING")
    return freezeLabValue({ start, terminal, terminalProvenance: persisted ? "persisted" as const : "derived_unterminated_start" as const }) as ReopenedLeagueEvidence["records"][number]
  })
  return freezeLabValue({ issued: false as const, records, remnants }) as ReopenedLeagueEvidence
}
