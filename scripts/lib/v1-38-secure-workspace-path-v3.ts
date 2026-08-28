import { createHash } from "node:crypto"
import { spawnSync } from "node:child_process"
import {
  chmodSync,
  closeSync,
  constants,
  fstatSync,
  lstatSync,
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

export const V138_SECURE_MANIFEST_READER_V3_SOURCE = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../native/v1-38-secure-manifest-reader-v3.c",
)
const EXPECTED_READER_SOURCE_SHA256 =
  "ffe3cb82853a071b30150ba5d3232183197b334f0016f827fb50b93b93a8452e"
const EXPECTED_CLANG_SHA256 =
  "179301dcb41ea78accc3fa0048a7e6f6710d891945a751a34addd622020c1818"
let readerExecutable: string | undefined
const secureReaderExecutable = (): string => {
  if (readerExecutable !== undefined) return readerExecutable
  const directory = mkdtempSync(path.join(tmpdir(), "v138-secure-reader-"))
  chmodSync(directory, 0o700)
  const executable = path.join(directory, "reader")
  const capturedSource = path.join(directory, "captured-reader.c")
  const sourceBytes = readFileSync(V138_SECURE_MANIFEST_READER_V3_SOURCE)
  const compilerBytes = readFileSync("/usr/bin/clang")
  if (
    sha256V138Secure(sourceBytes).slice(7) !== EXPECTED_READER_SOURCE_SHA256 ||
    sha256V138Secure(compilerBytes).slice(7) !== EXPECTED_CLANG_SHA256
  ) {
    rmSync(directory, { recursive: true, force: true })
    fail("V138_SECURE_READER_REVIEWED_IDENTITY_MISMATCH")
  }
  writeFileSync(capturedSource, sourceBytes, { mode: 0o600, flag: "wx" })
  const compilation = spawnSync(
    "/usr/bin/clang",
    [
      "-std=c11",
      "-Wall",
      "-Wextra",
      "-Werror",
      capturedSource,
      "-o",
      executable,
    ],
    {
      encoding: "utf8",
      env: { PATH: "/usr/bin:/bin", LANG: "C", LC_ALL: "C", TMPDIR: directory },
    },
  )
  if (compilation.status !== 0) {
    rmSync(directory, { recursive: true, force: true })
    fail(`V138_SECURE_READER_COMPILE_FAILED:${compilation.stderr}`)
  }
  chmodSync(executable, 0o700)
  const status = lstatSync(executable)
  if (
    !status.isFile() ||
    status.uid !== process.getuid?.() ||
    (status.mode & 0o777) !== 0o700
  )
    fail("V138_SECURE_READER_OUTPUT_INVALID")
  readerExecutable = executable
  process.once("exit", () =>
    rmSync(directory, { recursive: true, force: true }),
  )
  return executable
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
  read: (relative: string) => Buffer
  assertAbsent: (relative: string) => true
  authenticate: (
    entries: readonly Readonly<{ path: string; sha256: `sha256:${string}` }>[],
  ) => true
}>

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
    const result = spawnSync(secureReaderExecutable(), [kind, normalized], {
      encoding: null,
      maxBuffer: 64 * 1024 * 1024,
      stdio: ["ignore", "pipe", "pipe", descriptor],
      env: { PATH: "/usr/bin:/bin", LANG: "C", LC_ALL: "C" },
    })
    if (result.status !== 0) {
      const detail = result.stderr.toString().trim()
      if (
        detail.includes("V138_READER_PARENT_INVALID") ||
        detail.includes("V138_READER_FILE_INVALID")
      )
        fail("V138_SECURE_SYMLINK_FORBIDDEN")
      if (detail.includes("V138_READER_EXPECTED_ABSENT"))
        fail("V138_SECURE_EXPECTED_ABSENT")
      fail(`V138_SECURE_DESCRIPTOR_${kind.toUpperCase()}_FAILED:${detail}`)
    }
    return result.stdout
  }
  const session: V138SecureWorkspaceSession = Object.freeze({
    identity: Object.freeze({
      device: String(status.dev),
      inode: String(status.ino),
    }),
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
