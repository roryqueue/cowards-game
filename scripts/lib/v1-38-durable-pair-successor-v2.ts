import { Buffer } from "node:buffer"
import { createHash } from "node:crypto"
import {
  closeSync,
  constants,
  fsyncSync,
  linkSync,
  lstatSync,
  openSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import {
  readV138RegularNoFollow,
  ensureV138TrustedDirectories,
  normalizeV138Relative,
  resolveV138RelativeNoFollow,
  trustedRootV138,
  withV138ExclusiveDirectoryLock,
} from "./v1-38-secure-workspace-path-v2.js"

const fail = (code: string): never => { throw new TypeError(code) }
const sha256 = (bytes: string | Buffer): `sha256:${string}` => `sha256:${createHash("sha256").update(bytes).digest("hex")}`

export interface V138DurablePairV2Member { readonly target: string; readonly bytes: string }
export const V138_DURABLE_PAIR_V2_CLI = fileURLToPath(import.meta.url)

export const deriveV138PairLockKeyV2 = (
  members: readonly [V138DurablePairV2Member, V138DurablePairV2Member],
): string => {
  const sortedTargets = members.map(({ target }) => normalizeV138Relative(target)).sort()
  if (sortedTargets[0] === sortedTargets[1]) fail("V138_PAIR_V2_DUPLICATE_TARGET")
  return sha256(sortedTargets.join("\0")).slice(7)
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
  const intentRelative = normalizeV138Relative(input.intentPath)
  const sorted = input.members
    .map((member) => ({ ...member, target: normalizeV138Relative(member.target) }))
    .sort((left, right) => left.target.localeCompare(right.target))
  if (sorted[0]!.target === sorted[1]!.target) fail("V138_PAIR_V2_DUPLICATE_TARGET")
  if (sorted.some(({ target }) => target === intentRelative)) fail("V138_PAIR_V2_INTENT_MEMBER_ALIAS")
  const members = sorted.map((member) => {
    const target = resolveV138RelativeNoFollow(root, member.target, "absent-or-regular")
    return { ...member, target, digest: sha256(member.bytes) }
  })
  const intent = resolveV138RelativeNoFollow(root, intentRelative, "absent-or-regular")
  const [, staging] = ensureV138TrustedDirectories(root, [".v138-pair-locks", ".v138-pair-staging"])
  const intentBytes = `${JSON.stringify({
    schemaVersion: "v1.38-durable-pair-intent-v2",
    transactionId: input.transactionId,
    intentPath: intentRelative,
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
  const lockKey = deriveV138PairLockKeyV2(input.members)
  normalizeV138Relative(input.intentPath)
  ensureV138TrustedDirectories(root, [".v138-pair-locks", ".v138-pair-staging"])
  return withV138ExclusiveDirectoryLock(root, ".v138-pair-locks", `${lockKey}.lock`, () => {
    pairWorker({ ...input, trustedRoot: root })
    return Object.freeze({ status: "complete" as const, memberCount: 2 as const })
  })
}

if (process.argv[1] === V138_DURABLE_PAIR_V2_CLI) {
  fail("V138_PAIR_V2_LIBRARY_ONLY")
}
