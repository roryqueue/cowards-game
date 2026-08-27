import { createHash } from "node:crypto"
import {
  closeSync,
  constants,
  fstatSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  realpathSync,
  rmdirSync,
} from "node:fs"
import path from "node:path"

const fail = (code: string): never => { throw new TypeError(code) }
export const sha256V138Secure = (bytes: string | Buffer): `sha256:${string}` =>
  `sha256:${createHash("sha256").update(bytes).digest("hex")}`

export const trustedRootV138 = (rootInput: string): string => {
  const root = realpathSync(rootInput)
  const status = lstatSync(root)
  if (!status.isDirectory() || status.isSymbolicLink()) fail("V138_SECURE_ROOT_INVALID")
  return root
}

const relativeParts = (relative: string): readonly string[] => {
  if (
    path.isAbsolute(relative) ||
    relative === "" ||
    relative.includes("\\") ||
    relative.split("/").some((part) => part === "" || part === "." || part === "..")
  ) fail("V138_SECURE_RELATIVE_PATH_INVALID")
  return Object.freeze(relative.split("/"))
}

export const normalizeV138Relative = (relative: string): string =>
  relativeParts(relative).join("/")

/**
 * Authenticate every requested internal directory before creating any of
 * them. This two-pass rule prevents a later hostile symlink from causing an
 * earlier lock/staging mutation.
 */
export const ensureV138TrustedDirectories = (
  rootInput: string,
  relatives: readonly string[],
): readonly string[] => {
  const root = trustedRootV138(rootInput)
  const normalized = relatives.map(normalizeV138Relative)
  const missing: string[] = []
  for (const relative of normalized) {
    const target = path.join(root, ...relativeParts(relative))
    try {
      const status = lstatSync(target)
      if (!status.isDirectory() || status.isSymbolicLink()) fail("V138_SECURE_INTERNAL_DIRECTORY_INVALID")
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error
      missing.push(relative)
    }
  }
  for (const relative of missing) {
    const parts = relativeParts(relative)
    let cursor = root
    for (const part of parts) {
      cursor = path.join(cursor, part)
      try {
        mkdirSync(cursor, { mode: 0o700 })
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error
      }
      const status = lstatSync(cursor)
      if (!status.isDirectory() || status.isSymbolicLink()) fail("V138_SECURE_INTERNAL_DIRECTORY_INVALID")
    }
  }
  return Object.freeze(normalized.map((relative) => path.join(root, ...relativeParts(relative))))
}

export const withV138ExclusiveDirectoryLock = <T>(
  rootInput: string,
  lockDirectoryRelative: string,
  lockName: string,
  operation: () => T,
): T => {
  const root = trustedRootV138(rootInput)
  if (!/^[0-9a-f]{64}\.lock$/u.test(lockName)) fail("V138_SECURE_LOCK_NAME_INVALID")
  const [lockDirectory] = ensureV138TrustedDirectories(root, [lockDirectoryRelative])
  const lockPath = path.join(lockDirectory!, lockName)
  const deadline = Date.now() + 10_000
  for (;;) {
    try {
      mkdirSync(lockPath, { mode: 0o700 })
      break
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error
      try {
        const status = lstatSync(lockPath)
        if (!status.isDirectory() || status.isSymbolicLink()) fail("V138_SECURE_LOCK_INVALID")
      } catch (inspectionError) {
        if ((inspectionError as NodeJS.ErrnoException).code === "ENOENT") continue
        throw inspectionError
      }
      if (Date.now() >= deadline) fail("V138_SECURE_LOCK_TIMEOUT")
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 10)
    }
  }
  try {
    const status = lstatSync(lockPath)
    if (!status.isDirectory() || status.isSymbolicLink()) fail("V138_SECURE_LOCK_INVALID")
    return operation()
  } finally {
    rmdirSync(lockPath)
  }
}

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
    relative.split("/").some((part) => part === "" || part === "." || part === "..")
  ) fail("V138_SECURE_RELATIVE_PATH_INVALID")
  const parts = relative.split("/")
  let cursor = root
  for (const [index, part] of parts.entries()) {
    cursor = path.join(cursor, part)
    const isFinal = index === parts.length - 1
    try {
      const status = lstatSync(cursor)
      if (status.isSymbolicLink()) fail("V138_SECURE_SYMLINK_FORBIDDEN")
      if (!isFinal && !status.isDirectory()) fail("V138_SECURE_PARENT_NOT_DIRECTORY")
      if (isFinal && final === "absent") fail("V138_SECURE_EXPECTED_ABSENT")
      if (isFinal && !status.isFile()) fail("V138_SECURE_FINAL_NOT_REGULAR")
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT" || !isFinal || final === "regular") throw error
    }
  }
  const relativeResolved = path.relative(root, cursor)
  if (relativeResolved === "" || relativeResolved.startsWith(`..${path.sep}`) || relativeResolved === "..") fail("V138_SECURE_PATH_ESCAPE")
  return cursor
}

export const readV138RegularNoFollow = (root: string, relative: string): Buffer => {
  const target = resolveV138RelativeNoFollow(root, relative, "regular")
  const before = lstatSync(target)
  const descriptor = openSync(target, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0))
  try {
    const opened = fstatSync(descriptor)
    if (!opened.isFile() || opened.dev !== before.dev || opened.ino !== before.ino) fail("V138_SECURE_OPEN_IDENTITY_MISMATCH")
    return readFileSync(descriptor)
  } finally { closeSync(descriptor) }
}

export const assertV138AbsentNoFollow = (root: string, relative: string): true => {
  resolveV138RelativeNoFollow(root, relative, "absent")
  return true
}

export const authenticateV138ManifestNoFollow = (
  root: string,
  entries: readonly Readonly<{ path: string; sha256: `sha256:${string}` }>[],
): true => {
  for (const entry of entries) {
    if (sha256V138Secure(readV138RegularNoFollow(root, entry.path)) !== entry.sha256) fail("V138_SECURE_MANIFEST_MISMATCH")
  }
  return true
}
