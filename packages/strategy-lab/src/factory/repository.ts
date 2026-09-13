import { createHash } from "node:crypto"
import { closeSync, constants, fsyncSync, lstatSync, openSync, readFileSync, readdirSync, realpathSync, unlinkSync, writeSync, linkSync } from "node:fs"
import { basename, join, resolve } from "node:path"
import { admitCanonicalJsonBytes, admitCanonicalJsonValue } from "@cowards/spec"
import { freezeLabValue, type LabRoot } from "../contracts.js"
import { validateFactoryAttemptLedger, validateFactoryAttemptStart, validateFactoryAttemptTerminal, type FactoryAttemptStart, type FactoryAttemptTerminal } from "./ledger.js"

const CAP = 262144
const root = (bytes: Uint8Array): LabRoot => `sha256:${createHash("sha256").update(bytes).digest("hex")}`
const fail = (code: string): never => { throw new TypeError(`FACTORY_REPOSITORY_${code}`) }
const safeDirectory = (directory: string) => { const path = resolve(directory); if (!basename(path).startsWith("factory-") || realpathSync(path) !== path || !lstatSync(path).isDirectory()) return fail("DIRECTORY"); return path }
const artifactName = (id: LabRoot) => `factory-artifact-${id.slice(7)}.bin`
const startName = (id: LabRoot) => `factory-attempt-${id.slice(7)}.started.json`
const terminalName = (id: LabRoot) => `factory-attempt-${id.slice(7)}.terminal.json`
const boundedRead = (path: string) => { if (!lstatSync(path).isFile()) return fail("FILE"); const bytes = readFileSync(path); if (bytes.byteLength > CAP) return fail("CAP"); return bytes }
const canonicalBytes = (value: unknown) => { const encoded = admitCanonicalJsonValue(value, { profile: "canonical-manifest" }); if (!encoded.ok || encoded.canonicalByteLength > CAP) return fail("CANONICAL"); return encoded.canonicalBytes }
const atomic = (directory: string, name: string, bytes: Uint8Array) => {
  const target = join(safeDirectory(directory), name)
  if (lstatSafe(target)) { if (root(boundedRead(target)) !== root(bytes)) return fail("OVERWRITE"); return }
  const temporary = `${target}.tmp`, fd = openSync(temporary, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY | constants.O_NOFOLLOW, 0o600)
  try { let offset = 0; while (offset < bytes.byteLength) offset += writeSync(fd, bytes, offset, bytes.byteLength - offset); fsyncSync(fd) } finally { closeSync(fd) }
  try { linkSync(temporary, target) } finally { unlinkSync(temporary) }
}
const lstatSafe = (path: string) => { try { return lstatSync(path) } catch { return null } }
const parse = (bytes: Uint8Array) => { const parsed = admitCanonicalJsonBytes(bytes, { profile: "canonical-manifest", operation: "require-canonical" }); if (!parsed.ok) return fail("BYTES"); return parsed.value }
export interface FactoryRepository { readonly directory: string }
export const createFactoryRepository = (directory: string): Readonly<FactoryRepository> => freezeLabValue({ directory: safeDirectory(directory) })
export const publishFactoryArtifact = (repository: FactoryRepository, bytes: Uint8Array): LabRoot => { if (!(bytes instanceof Uint8Array) || bytes.byteLength < 1 || bytes.byteLength > CAP) return fail("ARTIFACT"); const id = root(bytes); atomic(repository.directory, artifactName(id), bytes); return id }
export const readFactoryArtifact = (repository: FactoryRepository, id: LabRoot): Uint8Array => { const bytes = boundedRead(join(safeDirectory(repository.directory), artifactName(id))); if (root(bytes) !== id) return fail("ARTIFACT_DIGEST"); return new Uint8Array(bytes) }
export const recordFactoryAttemptStart = (repository: FactoryRepository, start: FactoryAttemptStart): void => { const charged = validateFactoryAttemptStart(start); atomic(repository.directory, startName(charged.root), canonicalBytes(charged)) }
const readStart = (repository: FactoryRepository, id: LabRoot) => validateFactoryAttemptStart(parse(boundedRead(join(safeDirectory(repository.directory), startName(id)))))
export const publishFactoryAttemptTerminal = (repository: FactoryRepository, start: FactoryAttemptStart, terminal: FactoryAttemptTerminal): void => { const charged = readStart(repository, validateFactoryAttemptStart(start).root); const final = validateFactoryAttemptLedger(charged, terminal); atomic(repository.directory, terminalName(charged.root), canonicalBytes(final)) }
export const resumeFactoryAttemptInventory = (repository: FactoryRepository) => {
  const names = readdirSync(safeDirectory(repository.directory)).sort(), started: LabRoot[] = [], completed: LabRoot[] = []
  for (const name of names) {
    if (name.endsWith(".tmp")) continue
    const match = /^factory-attempt-([a-f0-9]{64})\.(started|terminal)\.json$/u.exec(name)
    if (!match) { if (!/^factory-artifact-[a-f0-9]{64}\.bin$/u.test(name)) return fail("UNKNOWN_ARTIFACT"); continue }
    const id = `sha256:${match[1]}` as LabRoot
    if (match[2] === "started") { readStart(repository, id); started.push(id); continue }
    const charged = readStart(repository, id), terminal = validateFactoryAttemptTerminal(parse(boundedRead(join(repository.directory, name))))
    validateFactoryAttemptLedger(charged, terminal); completed.push(id)
  }
  if (new Set(started).size !== started.length || new Set(completed).size !== completed.length || completed.some((id) => !started.includes(id))) return fail("DUPLICATE_OR_UNCHARGED")
  const uncertain = started.filter((id) => !completed.includes(id)); if (uncertain.length) return fail("UNCERTAIN_START_ONLY")
  return freezeLabValue({ completedAttemptRoots: completed, ledgerRoot: `sha256:${createHash("sha256").update(canonicalBytes({ started, completed })).digest("hex")}` as LabRoot })
}
