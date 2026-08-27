import { Buffer } from "node:buffer"
import { execFileSync } from "node:child_process"
import { createHash } from "node:crypto"
import {
  closeSync,
  constants,
  fsyncSync,
  linkSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  realpathSync,
  unlinkSync,
  writeFileSync,
} from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const fail = (code: string): never => { throw new TypeError(code) }
const sha256 = (bytes: string | Buffer): `sha256:${string}` => `sha256:${createHash("sha256").update(bytes).digest("hex")}`
const canonical = (value: unknown): string => `${JSON.stringify(value, Object.keys(value as object).sort())}\n`

export interface V138DurablePairV2Member { readonly target: string; readonly bytes: string }
export const V138_DURABLE_PAIR_V2_CLI = fileURLToPath(import.meta.url)

const rootAndTarget = (trustedRoot: string, relative: string, allowAbsentFinal: boolean): [string, string] => {
  const root = realpathSync(trustedRoot)
  if (path.isAbsolute(relative) || relative === "" || relative.split(/[\\/]/u).some((part) => part === "" || part === "." || part === "..")) {
    fail("V138_PAIR_V2_PATH_INVALID")
  }
  const parts = relative.split(/[\\/]/u)
  let cursor = root
  for (const [index, part] of parts.entries()) {
    cursor = path.join(cursor, part)
    try {
      const status = lstatSync(cursor)
      if (status.isSymbolicLink()) fail("V138_PAIR_V2_SYMLINK_FORBIDDEN")
      if (index < parts.length - 1 && !status.isDirectory()) fail("V138_PAIR_V2_PARENT_INVALID")
      if (index === parts.length - 1 && !status.isFile()) fail("V138_PAIR_V2_TARGET_INVALID")
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT" || index < parts.length - 1 || !allowAbsentFinal) throw error
    }
  }
  if (path.relative(root, cursor).startsWith("..")) fail("V138_PAIR_V2_PATH_ESCAPE")
  return [root, cursor]
}

const type = (target: string): "absent" | "regular" => {
  try {
    const status = lstatSync(target)
    if (!status.isFile() || status.isSymbolicLink()) fail("V138_PAIR_V2_ENTRY_UNSAFE")
    return "regular"
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return "absent"
    throw error
  }
}
const readNoFollow = (target: string): Buffer => {
  const descriptor = openSync(target, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0))
  try { return readFileSync(descriptor) } finally { closeSync(descriptor) }
}
const writeExclusive = (target: string, bytes: string): void => {
  const descriptor = openSync(target, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | (constants.O_NOFOLLOW ?? 0), 0o600)
  try { writeFileSync(descriptor, bytes); fsyncSync(descriptor) } finally { closeSync(descriptor) }
}
const fsyncParent = (target: string): void => {
  const descriptor = openSync(path.dirname(target), constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0))
  try { fsyncSync(descriptor) } finally { closeSync(descriptor) }
}

const pairWorker = (input: {
  trustedRoot: string
  transactionId: string
  intentPath: string
  members: readonly [V138DurablePairV2Member, V138DurablePairV2Member]
}): void => {
  if (!/^[a-z0-9][a-z0-9-]{0,63}$/u.test(input.transactionId)) fail("V138_PAIR_V2_TRANSACTION_INVALID")
  const root = realpathSync(input.trustedRoot)
  const sorted = [...input.members].sort((left, right) => left.target.localeCompare(right.target))
  if (sorted[0]!.target === sorted[1]!.target) fail("V138_PAIR_V2_DUPLICATE_TARGET")
  const members = sorted.map((member) => {
    const [, target] = rootAndTarget(root, member.target, true)
    return { ...member, target, digest: sha256(member.bytes) }
  })
  const [, intent] = rootAndTarget(root, input.intentPath, true)
  const staging = path.join(root, ".v138-pair-staging")
  mkdirSync(staging, { recursive: true, mode: 0o700 })
  if (lstatSync(staging).isSymbolicLink()) fail("V138_PAIR_V2_STAGING_UNSAFE")
  const intentBytes = `${JSON.stringify({
    schemaVersion: "v1.38-durable-pair-intent-v2",
    transactionId: input.transactionId,
    intentPath: input.intentPath,
    members: members.map(({ target, digest }) => ({ target: path.relative(root, target), sha256: digest })),
  })}\n`

  // The common lock is already held. Authenticate the single intent before
  // staging or publishing either canonical member.
  if (type(intent) === "absent") { writeExclusive(intent, intentBytes); fsyncParent(intent) }
  else if (!readNoFollow(intent).equals(Buffer.from(intentBytes))) fail("V138_PAIR_V2_INTENT_CONFLICT")
  for (const member of members) {
    if (type(member.target) === "regular" && !readNoFollow(member.target).equals(Buffer.from(member.bytes))) {
      fail("V138_PAIR_V2_CANONICAL_CONFLICT")
    }
  }
  const stages = members.map((member, index) => path.join(staging, `${input.transactionId}-${index}-${member.digest.slice(7)}`))
  for (const [index, member] of members.entries()) {
    const stage = stages[index]!
    if (type(stage) === "absent") writeExclusive(stage, member.bytes)
    else if (!readNoFollow(stage).equals(Buffer.from(member.bytes))) fail("V138_PAIR_V2_STAGE_CONFLICT")
  }
  for (const [index, member] of members.entries()) {
    if (type(member.target) === "absent") {
      try { linkSync(stages[index]!, member.target) } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error
      }
    }
    if (!readNoFollow(member.target).equals(Buffer.from(member.bytes))) fail("V138_PAIR_V2_CANONICAL_CONFLICT")
    fsyncParent(member.target)
  }
  for (const stage of stages) if (type(stage) === "regular") unlinkSync(stage)
  if (type(intent) === "regular") unlinkSync(intent)
  fsyncParent(intent)
}

export const durablyPublishV138PairV2 = (input: {
  trustedRoot: string
  transactionId: string
  intentPath: string
  members: readonly [V138DurablePairV2Member, V138DurablePairV2Member]
}): Readonly<{ status: "complete"; memberCount: 2 }> => {
  const root = realpathSync(input.trustedRoot)
  const sortedTargets = input.members.map(({ target }) => target).sort()
  const lockKey = sha256(`${input.intentPath}\0${sortedTargets.join("\0")}`).slice(7)
  const lockDirectory = path.join(root, ".v138-pair-locks")
  mkdirSync(lockDirectory, { recursive: true, mode: 0o700 })
  const lockPath = path.join(lockDirectory, `${lockKey}.lock`)
  execFileSync("/usr/bin/lockf", ["-t", "10", lockPath, process.execPath, "--import", "tsx", V138_DURABLE_PAIR_V2_CLI, "--pair-worker", Buffer.from(JSON.stringify(input)).toString("base64")], { stdio: "pipe" })
  return Object.freeze({ status: "complete", memberCount: 2 })
}

if (process.argv[1] === V138_DURABLE_PAIR_V2_CLI) {
  const payload = process.argv[3]
  if ((process.argv[2] !== "--pair-worker" && process.argv[2] !== "--synthetic-pair") || payload === undefined) fail("V138_PAIR_V2_SOURCE_ONLY")
  const input = JSON.parse(Buffer.from(payload, "base64").toString("utf8"))
  if (process.argv[2] === "--pair-worker") pairWorker(input)
  else durablyPublishV138PairV2(input)
}
