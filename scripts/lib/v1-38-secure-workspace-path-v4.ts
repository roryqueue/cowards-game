import { createHash } from "node:crypto"
import { execFileSync, spawnSync } from "node:child_process"
import {
  chmodSync,
  closeSync,
  constants,
  fstatSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  openSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import path from "node:path"
import { tmpdir } from "node:os"
import { fileURLToPath } from "node:url"

const fail = (code: string): never => {
  throw new TypeError(code)
}
export const sha256V138Secure = (bytes: string | Buffer): `sha256:${string}` =>
  `sha256:${createHash("sha256").update(bytes).digest("hex")}`

export const V138_SECURE_MANIFEST_READER_V4_SOURCE = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../native/v1-38-secure-manifest-reader-v4.c",
)
const EXPECTED_READER_SOURCE_SHA256 =
  "1bb0f5258d385619d79d76b350423a2cd146809344f209d5cd2309828e0310a5"
const EXPECTED_CLANG_SHA256 =
  "179301dcb41ea78accc3fa0048a7e6f6710d891945a751a34addd622020c1818"
const EXPECTED_CLANG_CDHASH =
  "1197f9fac4289a81d8e786b033bf8237672cabbc63da85b759bf2ef85ac232ad"
const assertReviewedClang = (): void => {
  const result = spawnSync("/usr/bin/codesign", ["-dv", "--verbose=4", "/usr/bin/clang"], {
    encoding: "utf8",
  })
  const detail = `${result.stdout}${result.stderr}`
  if (result.status !== 0 || !detail.includes(`CandidateCDHashFull sha256=${EXPECTED_CLANG_CDHASH}`) || !detail.includes("Authority=Apple Root CA") || !detail.includes("Platform identifier="))
    fail("V138_SECURE_READER_PLATFORM_COMPILER_IDENTITY_MISMATCH")
  execFileSync("/usr/bin/codesign", ["--verify", "--strict", "/usr/bin/clang"], { stdio: "pipe" })
}
let readerExecutable: string | undefined
const secureReaderExecutable = (): string => {
  if (readerExecutable !== undefined) return readerExecutable
  const directory = mkdtempSync(path.join(tmpdir(), "v138-secure-reader-"))
  let retained = false
  try {
    chmodSync(directory, 0o700)
    const primaryDirectory = path.join(directory, "primary")
    const reproductionDirectory = path.join(directory, "reproduction")
    mkdirSync(primaryDirectory, { mode: 0o700 })
    mkdirSync(reproductionDirectory, { mode: 0o700 })
    const executable = path.join(primaryDirectory, "reader")
    const reproduced = path.join(reproductionDirectory, "reader")
    const capturedSource = path.join(directory, "captured-reader.c")
    const sourceBytes = readFileSync(V138_SECURE_MANIFEST_READER_V4_SOURCE)
    const compilerBytes = readFileSync("/usr/bin/clang")
    if (
      sha256V138Secure(sourceBytes).slice(7) !== EXPECTED_READER_SOURCE_SHA256 ||
      sha256V138Secure(compilerBytes).slice(7) !== EXPECTED_CLANG_SHA256
    )
      fail("V138_SECURE_READER_REVIEWED_IDENTITY_MISMATCH")
    writeFileSync(capturedSource, sourceBytes, { mode: 0o400, flag: "wx" })
    assertReviewedClang()
    for (const output of [executable, reproduced] as const) {
      const compilation = spawnSync(
        "/usr/bin/clang",
        ["-std=c11", "-Wall", "-Wextra", "-Werror", capturedSource, "-o", output],
        {
          encoding: "utf8",
          env: { PATH: "/usr/bin:/bin", LANG: "C", LC_ALL: "C", TMPDIR: directory },
        },
      )
      if (compilation.status !== 0)
        fail(`V138_SECURE_READER_COMPILE_FAILED:${compilation.stderr}`)
    }
    assertReviewedClang()
    if (sha256V138Secure(readFileSync("/usr/bin/clang")).slice(7) !== EXPECTED_CLANG_SHA256)
      fail("V138_SECURE_READER_PLATFORM_COMPILER_CHANGED")
    const executableBytes = readFileSync(executable)
    if (sha256V138Secure(executableBytes) !== sha256V138Secure(readFileSync(reproduced)))
      fail("V138_SECURE_READER_REPRODUCIBLE_OUTPUT_MISMATCH")
    chmodSync(executable, 0o500)
    const status = lstatSync(executable)
    if (!status.isFile() || status.uid !== process.getuid?.() || (status.mode & 0o777) !== 0o500)
      fail("V138_SECURE_READER_OUTPUT_INVALID")
    if (sha256V138Secure(readFileSync(executable)) !== sha256V138Secure(executableBytes))
      fail("V138_SECURE_READER_OUTPUT_CHANGED")
    readerExecutable = executable
    retained = true
    process.once("exit", () => rmSync(directory, { recursive: true, force: true }))
    return executable
  } finally {
    if (!retained) rmSync(directory, { recursive: true, force: true })
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
    const result = spawnSync(secureReaderExecutable(), [], {
      input,
      encoding: "utf8",
      maxBuffer: 256 * 1024 * 1024,
      stdio: ["pipe", "pipe", "pipe", descriptor],
      env: {
        PATH: "/usr/bin:/bin", LANG: "C", LC_ALL: "C",
        ...(testBarrier === undefined ? {} : { V138_READER_TEST_BARRIER: testBarrier }),
      },
    })
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
    for (const line of result.stdout.trimEnd().split("\n")) {
      const [kind, encoded, device, inode] = line.split("\t")
      if (kind === "I") identity = Object.freeze({ device: encoded!, inode: device! })
      else if (kind === "D") ancestors[Buffer.from(encoded!, "hex").toString()] = Object.freeze({ device: device!, inode: inode! })
      else if (kind === "R") bytes[Buffer.from(encoded!, "hex").toString()] = Buffer.from(device!, "hex")
      else if (kind !== "A") fail("V138_SECURE_BATCH_OUTPUT_INVALID")
    }
    if (identity === undefined || normalizedReads.some((item) => bytes[item] === undefined))
      fail("V138_SECURE_BATCH_OUTPUT_INCOMPLETE")
    return Object.freeze({ identity, ancestorIdentities: Object.freeze(ancestors), bytes: Object.freeze(bytes) })
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
    const result = spawnSync(secureReaderExecutable(), [], {
      input: `${kind === "read" ? "R" : "A"}\t${normalized}\n`,
      encoding: "utf8",
      maxBuffer: 256 * 1024 * 1024,
      stdio: ["pipe", "pipe", "pipe", descriptor],
      env: { PATH: "/usr/bin:/bin", LANG: "C", LC_ALL: "C" },
    })
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
      for (const entry of entries)
        if (sha256V138Secure(invoke("read", entry.path)) !== entry.sha256)
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
