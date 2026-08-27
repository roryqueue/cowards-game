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
  unlinkSync,
  writeFileSync,
} from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import {
  readV138RegularNoFollow,
  resolveV138RelativeNoFollow,
  trustedRootV138,
} from "./v1-38-secure-workspace-path-v2.js"

const fail = (code: string): never => { throw new TypeError(code) }
const sha256 = (bytes: string | Buffer): `sha256:${string}` => `sha256:${createHash("sha256").update(bytes).digest("hex")}`
const canonical = (value: unknown): string => `${JSON.stringify(value, Object.keys(value as object).sort())}\n`

export interface V138DurablePairV2Member { readonly target: string; readonly bytes: string }
export const V138_DURABLE_PAIR_V2_CLI = fileURLToPath(import.meta.url)

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
  const root = trustedRootV138(input.trustedRoot)
  const sorted = [...input.members].sort((left, right) => left.target.localeCompare(right.target))
  if (sorted[0]!.target === sorted[1]!.target) fail("V138_PAIR_V2_DUPLICATE_TARGET")
  const members = sorted.map((member) => {
    const target = resolveV138RelativeNoFollow(root, member.target, "absent-or-regular")
    return { ...member, target, digest: sha256(member.bytes) }
  })
  const intent = resolveV138RelativeNoFollow(root, input.intentPath, "absent-or-regular")
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
  else if (!readV138RegularNoFollow(root, path.relative(root, intent)).equals(Buffer.from(intentBytes))) fail("V138_PAIR_V2_INTENT_CONFLICT")
  for (const member of members) {
    if (type(member.target) === "regular" && !readV138RegularNoFollow(root, path.relative(root, member.target)).equals(Buffer.from(member.bytes))) {
      fail("V138_PAIR_V2_CANONICAL_CONFLICT")
    }
  }
  const stages = members.map((member, index) => path.join(staging, `${input.transactionId}-${index}-${member.digest.slice(7)}`))
  for (const [index, member] of members.entries()) {
    const stage = stages[index]!
    if (type(stage) === "absent") writeExclusive(stage, member.bytes)
    else if (!readV138RegularNoFollow(root, path.relative(root, stage)).equals(Buffer.from(member.bytes))) fail("V138_PAIR_V2_STAGE_CONFLICT")
  }
  for (const [index, member] of members.entries()) {
    if (type(member.target) === "absent") {
      try { linkSync(stages[index]!, member.target) } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error
      }
    }
    if (!readV138RegularNoFollow(root, path.relative(root, member.target)).equals(Buffer.from(member.bytes))) fail("V138_PAIR_V2_CANONICAL_CONFLICT")
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
  const root = trustedRootV138(input.trustedRoot)
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
