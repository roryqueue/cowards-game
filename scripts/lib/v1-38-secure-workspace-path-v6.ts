import { createHash } from "node:crypto"
import { spawnSync } from "node:child_process"
import {
  closeSync,
  constants,
  fstatSync,
  lstatSync,
  openSync,
  readFileSync,
  realpathSync,
  writeFileSync,
} from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import {
  compileV138PrivateNativeV2,
  V138_PRIVATE_NATIVE_EXECUTION_ASSURANCE_V2,
} from "./v1-38-private-native-bootstrap-v2.js"

const fail = (code: string): never => {
  throw new TypeError(code)
}
export const sha256V138Secure = (bytes: string | Buffer): `sha256:${string}` =>
  `sha256:${createHash("sha256").update(bytes).digest("hex")}`
export const V138_SECURE_BATCH_PROTOCOL_V6 =
  "retained-required-leaves-parent-generation-absence-revalidation-v2"
export const V138_SECURE_READER_EXECUTION_ASSURANCE_V6 =
  V138_PRIVATE_NATIVE_EXECUTION_ASSURANCE_V2

export const V138_SECURE_MANIFEST_READER_V6_SOURCE = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../native/v1-38-secure-manifest-reader-v6.c",
)
const EXPECTED_READER_SOURCE_SHA256 = "fe1915ef41b134c1a1bae5e1e3df2c26a9ae47a2258b917bd1f1469917abffc1"

const runOneShotReader = (
  descriptor: number,
  input: string,
  testBarrier?: string,
) => {
  const built = compileV138PrivateNativeV2({
    source: V138_SECURE_MANIFEST_READER_V6_SOURCE,
    expectedSourceSha256: EXPECTED_READER_SOURCE_SHA256,
    prefix: "v138-secure-reader-v6-",
  })
  let controlDescriptor: number | undefined
  try {
    controlDescriptor = openSync(
      built.directory,
      constants.O_RDONLY |
        (constants.O_DIRECTORY ?? 0) |
        (constants.O_NOFOLLOW ?? 0),
    )
    if (testBarrier === "replace-reader-executable") {
      let refused = false
      try {
        writeFileSync(built.executable, "replacement", { flag: "w" })
      } catch {
        refused = true
      }
      if (
        !refused ||
        sha256V138Secure(readFileSync(built.executable)).slice(7) !==
          built.executableSha256
      )
        fail("V138_SECURE_READER_SUBSTITUTION_ACCEPTED")
    }
    if (
      sha256V138Secure(readFileSync(built.executable)).slice(7) !==
      built.executableSha256
    )
      fail("V138_SECURE_READER_LAUNCH_DIGEST_MISMATCH")
    return spawnSync(built.executable, [], {
      input,
      encoding: "utf8",
      maxBuffer: 256 * 1024 * 1024,
      stdio: ["pipe", "pipe", "pipe", descriptor, controlDescriptor],
      env: {
        PATH: "/usr/bin:/bin",
        LANG: "C",
        LC_ALL: "C",
        TMPDIR: built.directory,
        ...(testBarrier === undefined || testBarrier === "replace-reader-executable"
          ? {}
          : { V138_READER_TEST_BARRIER: testBarrier }),
      },
    })
  } finally {
    if (controlDescriptor !== undefined) closeSync(controlDescriptor)
    built.cleanup()
  }
}

export const trustedRootV138 = (rootInput: string): string => {
  const root = realpathSync(rootInput)
  const status = lstatSync(root)
  if (!status.isDirectory() || status.isSymbolicLink())
    fail("V138_SECURE_ROOT_INVALID")
  return root
}

const relativeParts = (relative: string): readonly string[] => {
  if (
    path.isAbsolute(relative) ||
    relative === "" ||
    relative.includes("\\") ||
    relative
      .split("/")
      .some((part) => part === "" || part === "." || part === "..")
  )
    fail("V138_SECURE_RELATIVE_PATH_INVALID")
  return Object.freeze(relative.split("/"))
}

export const normalizeV138Relative = (relative: string): string =>
  relativeParts(relative).join("/")

export const resolveV138RelativeNoFollow = (
  rootInput: string,
  relative: string,
  final: "regular" | "absent-or-regular" | "absent",
): string => {
  const root = trustedRootV138(rootInput)
  if (
    path.isAbsolute(relative) ||
    relative === "" ||
    relative.includes("\\") ||
    relative
      .split("/")
      .some((part) => part === "" || part === "." || part === "..")
  )
    fail("V138_SECURE_RELATIVE_PATH_INVALID")
  const parts = relative.split("/")
  let cursor = root
  for (const [index, part] of parts.entries()) {
    cursor = path.join(cursor, part)
    const isFinal = index === parts.length - 1
    try {
      const status = lstatSync(cursor)
      if (status.isSymbolicLink()) fail("V138_SECURE_SYMLINK_FORBIDDEN")
      if (!isFinal && !status.isDirectory())
        fail("V138_SECURE_PARENT_NOT_DIRECTORY")
      if (isFinal && final === "absent") fail("V138_SECURE_EXPECTED_ABSENT")
      if (isFinal && !status.isFile()) fail("V138_SECURE_FINAL_NOT_REGULAR")
    } catch (error) {
      if (
        (error as NodeJS.ErrnoException).code !== "ENOENT" ||
        !isFinal ||
        final === "regular"
      )
        throw error
    }
  }
  const relativeResolved = path.relative(root, cursor)
  if (
    relativeResolved === "" ||
    relativeResolved.startsWith(`..${path.sep}`) ||
    relativeResolved === ".."
  )
    fail("V138_SECURE_PATH_ESCAPE")
  return cursor
}

export const readV138RegularNoFollow = (
  root: string,
  relative: string,
): Buffer => {
  return withV138SecureWorkspaceSession(root, (session) =>
    session.read(relative),
  )
}

export const assertV138AbsentNoFollow = (
  root: string,
  relative: string,
): true => {
  return withV138SecureWorkspaceSession(root, (session) =>
    session.assertAbsent(relative),
  )
}

export const authenticateV138ManifestNoFollow = (
  root: string,
  entries: readonly Readonly<{ path: string; sha256: `sha256:${string}` }>[],
): true => {
  return withV138SecureWorkspaceSession(root, (session) =>
    session.authenticate(entries),
  )
}

export type V138SecureWorkspaceSession = Readonly<{
  identity: Readonly<{ device: string; inode: string }>
  ancestorIdentities: Readonly<Record<string, Readonly<{ device: string; inode: string }>>>
  read: (relative: string) => Buffer
  assertAbsent: (relative: string) => true
  authenticate: (
    entries: readonly Readonly<{ path: string; sha256: `sha256:${string}` }>[],
  ) => true
}>

export type V138SecureWorkspaceBatch = Readonly<{
  protocol: typeof V138_SECURE_BATCH_PROTOCOL_V6
  barrierControl: "external-private-bootstrap-directory"
  snapshotGuarantee: "required_leaf_exact_generation_and_parent_generation_bound"
  identity: Readonly<{ device: string; inode: string }>
  ancestorIdentities: Readonly<Record<string, Readonly<{ device: string; inode: string }>>>
  bytes: Readonly<Record<string, Buffer>>
}>

export const readV138WorkspaceBatch = (
  rootInput: string,
  reads: readonly string[],
  absent: readonly string[] = [],
  testBarrier?: string,
): V138SecureWorkspaceBatch => {
  const trusted = trustedRootV138(rootInput)
  const descriptor = openSync(trusted, constants.O_RDONLY | (constants.O_DIRECTORY ?? 0) | (constants.O_NOFOLLOW ?? 0))
  try {
    const status = fstatSync(descriptor)
    if (!status.isDirectory()) fail("V138_SECURE_ROOT_INVALID")
    const normalizedReads = [...new Set(reads.map(normalizeV138Relative))].sort()
    const normalizedAbsent = [...new Set(absent.map(normalizeV138Relative))].sort()
    if (normalizedReads.some((item) => normalizedAbsent.includes(item)))
      fail("V138_SECURE_BATCH_CONFLICT")
    const input = [
      ...normalizedReads.map((item) => `R\t${item}\n`),
      ...normalizedAbsent.map((item) => `A\t${item}\n`),
    ].join("")
    const result = runOneShotReader(descriptor, input, testBarrier)
    if (result.status !== 0) {
      const detail = result.stderr.trim()
      if (detail.includes("V138_READER_PARENT_INVALID") || detail.includes("V138_READER_FILE_INVALID"))
        fail("V138_SECURE_SYMLINK_FORBIDDEN")
      if (detail.includes("V138_READER_EXPECTED_ABSENT")) fail("V138_SECURE_EXPECTED_ABSENT")
      fail(`V138_SECURE_DESCRIPTOR_BATCH_FAILED:${detail}`)
    }
    const ancestors: Record<string, Readonly<{ device: string; inode: string }>> = {}
    const bytes: Record<string, Buffer> = {}
    let identity: Readonly<{ device: string; inode: string }> | undefined
    const lines = result.stdout.trimEnd().split("\n")
    if (lines.shift() !== "H\tone-shot-v6")
      fail("V138_SECURE_READER_HANDSHAKE_INVALID")
    for (const line of lines) {
      const [kind, encoded, device, inode] = line.split("\t")
      if (kind === "I") identity = Object.freeze({ device: encoded!, inode: device! })
      else if (kind === "D") ancestors[Buffer.from(encoded!, "hex").toString()] = Object.freeze({ device: device!, inode: inode! })
      else if (kind === "R") bytes[Buffer.from(encoded!, "hex").toString()] = Buffer.from(device!, "hex")
      else if (kind !== "A") fail("V138_SECURE_BATCH_OUTPUT_INVALID")
    }
    if (identity === undefined || normalizedReads.some((item) => bytes[item] === undefined))
      fail("V138_SECURE_BATCH_OUTPUT_INCOMPLETE")
    return Object.freeze({
      protocol: V138_SECURE_BATCH_PROTOCOL_V6,
      barrierControl: "external-private-bootstrap-directory" as const,
      snapshotGuarantee:
        "required_leaf_exact_generation_and_parent_generation_bound" as const,
      identity,
      ancestorIdentities: Object.freeze(ancestors),
      bytes: Object.freeze(bytes),
    })
  } finally {
    closeSync(descriptor)
  }
}

export const withV138SecureWorkspaceSession = <T>(
  rootInput: string,
  operation: (session: V138SecureWorkspaceSession) => T,
): T => {
  const trusted = trustedRootV138(rootInput)
  const descriptor = openSync(
    trusted,
    constants.O_RDONLY |
      (constants.O_DIRECTORY ?? 0) |
      (constants.O_NOFOLLOW ?? 0),
  )
  const status = fstatSync(descriptor)
  if (!status.isDirectory()) {
    closeSync(descriptor)
    fail("V138_SECURE_ROOT_INVALID")
  }
  const invoke = (kind: "read" | "absent", relative: string): Buffer => {
    const normalized = normalizeV138Relative(relative)
    const result = runOneShotReader(
      descriptor,
      `${kind === "read" ? "R" : "A"}\t${normalized}\n`,
    )
    if (result.status !== 0) {
      const detail = result.stderr.trim()
      if (
        detail.includes("V138_READER_PARENT_INVALID") ||
        detail.includes("V138_READER_FILE_INVALID")
      )
        fail("V138_SECURE_SYMLINK_FORBIDDEN")
      if (detail.includes("V138_READER_EXPECTED_ABSENT"))
        fail("V138_SECURE_EXPECTED_ABSENT")
      fail(`V138_SECURE_DESCRIPTOR_${kind.toUpperCase()}_FAILED:${detail}`)
    }
    if (kind === "absent") return Buffer.alloc(0)
    if (!result.stdout.startsWith("H\tone-shot-v6\n"))
      fail("V138_SECURE_READER_HANDSHAKE_INVALID")
    const encoded = Buffer.from(normalized).toString("hex")
    const line = result.stdout.split("\n").find((item) => item.startsWith(`R\t${encoded}\t`))
    if (line === undefined) fail("V138_SECURE_BATCH_OUTPUT_INCOMPLETE")
    return Buffer.from(line.split("\t")[2]!, "hex")
  }
  const session: V138SecureWorkspaceSession = Object.freeze({
    identity: Object.freeze({
      device: String(status.dev),
      inode: String(status.ino),
    }),
    ancestorIdentities: Object.freeze({}),
    read: (relative) => invoke("read", relative),
    assertAbsent: (relative) => {
      invoke("absent", relative)
      return true
    },
    authenticate: (entries) => {
      const snapshot = readV138WorkspaceBatch(
        trusted,
        entries.map(({ path: entryPath }) => entryPath),
      )
      for (const entry of entries)
        if (sha256V138Secure(snapshot.bytes[entry.path]!) !== entry.sha256)
          fail("V138_SECURE_MANIFEST_MISMATCH")
      return true
    },
  })
  try {
    return operation(session)
  } finally {
    closeSync(descriptor)
  }
}
