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

const fail = (code: string): never => {
  throw new TypeError(code)
}
const sha256 = (bytes: string): `sha256:${string}` =>
  `sha256:${createHash("sha256").update(bytes).digest("hex")}`
const canonical = (value: unknown): string => {
  const normalize = (item: unknown): unknown => {
    if (Array.isArray(item)) return item.map(normalize)
    if (item !== null && typeof item === "object") {
      return Object.fromEntries(
        Object.entries(item as Record<string, unknown>)
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([key, child]) => [key, normalize(child)]),
      )
    }
    return item
  }
  return `${JSON.stringify(normalize(value))}\n`
}

const safeType = (target: string): "absent" | "regular" | "unsafe" => {
  try {
    const status = lstatSync(target)
    return status.isFile() && !status.isSymbolicLink() ? "regular" : "unsafe"
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return "absent"
    throw error
  }
}

const assertSafeParent = (target: string): void => {
  const parent = path.dirname(path.resolve(target))
  const status = lstatSync(parent)
  if (!status.isDirectory() || status.isSymbolicLink()) {
    fail("V138_DURABLE_PUBLICATION_PARENT_UNSAFE")
  }
}

const fsyncParent = (target: string): void => {
  const descriptor = openSync(path.dirname(target), constants.O_RDONLY)
  try {
    fsyncSync(descriptor)
  } finally {
    closeSync(descriptor)
  }
}

const writeExclusiveDurable = (target: string, bytes: string): void => {
  const descriptor = openSync(
    target,
    constants.O_WRONLY |
      constants.O_CREAT |
      constants.O_EXCL |
      (constants.O_NOFOLLOW ?? 0),
    0o600,
  )
  try {
    writeFileSync(descriptor, bytes)
    fsyncSync(descriptor)
  } finally {
    closeSync(descriptor)
  }
}

const authenticateExact = (target: string, bytes: string, error: string): void => {
  if (safeType(target) !== "regular" || !readFileSync(target).equals(Buffer.from(bytes))) {
    fail(error)
  }
}

export interface V138DurablePairMember {
  readonly target: string
  readonly bytes: string
}

export type V138DurablePairBoundary =
  | `member:${0 | 1}:stage_fsync`
  | "intent:file_fsync"
  | "intent:parent_fsync"
  | `member:${0 | 1}:publish`
  | `member:${0 | 1}:parent_fsync`

export const V138_DURABLE_PUBLICATION_SUCCESSOR_CLI = fileURLToPath(import.meta.url)

/**
 * Durable two-member transaction for immutable canonical evidence. Existing
 * canonical members are authenticated, never removed or replaced. Missing
 * members are installed by same-filesystem hard-link, whose EEXIST behavior is
 * the no-replace publication primitive.
 */
export const durablyPublishV138Pair = (input: {
  transactionId: string
  intentPath: string
  members: readonly [V138DurablePairMember, V138DurablePairMember]
  crashBoundary?: (boundary: V138DurablePairBoundary) => void
}): Readonly<{ status: "complete"; memberCount: 2 }> => {
  if (!/^[a-z0-9][a-z0-9-]{0,63}$/u.test(input.transactionId)) {
    return fail("V138_DURABLE_PUBLICATION_TRANSACTION_ID_INVALID")
  }
  const intentPath = path.resolve(input.intentPath)
  const members = input.members.map((member, index) => ({
    target: path.resolve(member.target),
    bytes: member.bytes,
    sha256: sha256(member.bytes),
    stage: `${path.resolve(member.target)}.stage-${input.transactionId}-${index}`,
  })) as [
    { target: string; bytes: string; sha256: `sha256:${string}`; stage: string },
    { target: string; bytes: string; sha256: `sha256:${string}`; stage: string },
  ]
  if (members[0].target === members[1].target) {
    return fail("V138_DURABLE_PUBLICATION_DUPLICATE_TARGET")
  }
  assertSafeParent(intentPath)
  for (const member of members) assertSafeParent(member.target)

  // Recheck every canonical target before making any new canonical member.
  // A foreign durable member therefore cannot induce a new half-publication.
  for (const member of members) {
    const type = safeType(member.target)
    if (type === "unsafe") fail("V138_DURABLE_PUBLICATION_CANONICAL_CONFLICT")
    if (type === "regular") {
      authenticateExact(
        member.target,
        member.bytes,
        "V138_DURABLE_PUBLICATION_CANONICAL_CONFLICT",
      )
    }
  }

  for (const [index, member] of members.entries()) {
    const type = safeType(member.stage)
    if (type === "absent") writeExclusiveDurable(member.stage, member.bytes)
    else
      authenticateExact(
        member.stage,
        member.bytes,
        "V138_DURABLE_PUBLICATION_STAGE_MISMATCH",
      )
    input.crashBoundary?.(`member:${index as 0 | 1}:stage_fsync`)
  }

  const intent = canonical({
    schemaVersion: "v1.38-durable-pair-intent-v1",
    transactionId: input.transactionId,
    members: members.map(({ target, stage, sha256: digest, bytes }) => ({
      target,
      stage,
      sha256: digest,
      bytesBase64: Buffer.from(bytes).toString("base64"),
    })),
  })
  const intentType = safeType(intentPath)
  if (intentType === "absent") writeExclusiveDurable(intentPath, intent)
  else
    authenticateExact(
      intentPath,
      intent,
      "V138_DURABLE_PUBLICATION_INTENT_MISMATCH",
    )
  input.crashBoundary?.("intent:file_fsync")
  fsyncParent(intentPath)
  input.crashBoundary?.("intent:parent_fsync")

  for (const [index, member] of members.entries()) {
    const type = safeType(member.target)
    if (type === "absent") {
      try {
        linkSync(member.stage, member.target)
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error
      }
    }
    authenticateExact(
      member.target,
      member.bytes,
      "V138_DURABLE_PUBLICATION_CANONICAL_CONFLICT",
    )
    input.crashBoundary?.(`member:${index as 0 | 1}:publish`)
    fsyncParent(member.target)
    input.crashBoundary?.(`member:${index as 0 | 1}:parent_fsync`)
  }

  for (const member of members) {
    if (safeType(member.stage) === "regular") unlinkSync(member.stage)
  }
  if (safeType(intentPath) === "regular") unlinkSync(intentPath)
  for (const parentTarget of new Set([
    intentPath,
    ...members.map(({ target }) => target),
  ])) {
    fsyncParent(parentTarget)
  }
  return Object.freeze({ status: "complete", memberCount: 2 as const })
}

if (process.argv[2] === "--pair-crash-probe") {
  const payload = process.argv[3]
  const boundary = process.argv[4] as V138DurablePairBoundary | undefined
  if (payload === undefined || boundary === undefined) {
    fail("V138_DURABLE_PUBLICATION_SOURCE_ONLY")
  }
  const parsed = JSON.parse(
    Buffer.from(payload, "base64").toString("utf8"),
  ) as {
    transactionId: string
    intentPath: string
    members: [V138DurablePairMember, V138DurablePairMember]
  }
  durablyPublishV138Pair({
    ...parsed,
    crashBoundary: (current) => {
      if (current === boundary) process.kill(process.pid, "SIGKILL")
    },
  })
  fail("V138_DURABLE_PUBLICATION_CRASH_BOUNDARY_NOT_FOUND")
}
