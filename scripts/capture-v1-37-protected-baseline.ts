#!/usr/bin/env -S pnpm exec tsx
import { Buffer } from "node:buffer"
import { spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  writeFileSync,
} from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
// eslint-disable-next-line no-restricted-imports -- This repository proof needs canonical manifest hashing before package build.
import { encodeCanonicalJson } from "../packages/spec/src/canonical-json-encode.js"

export const V137_PROTECTED_PATHS = Object.freeze([
  ".planning/config.json",
  "CowardsGameSpec_Full_Consolidated_v1.md",
] as const)

export const V137_PROTECTED_BASELINE_PATH =
  ".planning/artifacts/v1.37-protected-working-tree-baseline.json" as const

type ProtectedPath = (typeof V137_PROTECTED_PATHS)[number]

interface ProtectedDiffEvidence {
  readonly command:
    | "git diff --binary --no-ext-diff -- <path>"
    | "git diff --binary --no-ext-diff --cached -- <path>"
  readonly byteLength: number
  readonly sha256: `sha256:${string}`
  readonly bytesBase64: string
}

interface ProtectedPathBaseline {
  readonly path: ProtectedPath
  readonly raw: Readonly<{
    exists: true
    byteLength: number
    sha256: `sha256:${string}`
    mode: string
  }>
  readonly head: Readonly<
    | {
        exists: true
        blobId: string
        mode: string
      }
    | {
        exists: false
        blobId: null
        mode: null
      }
  >
  readonly unstagedDiff: ProtectedDiffEvidence
  readonly stagedDiff: ProtectedDiffEvidence
  readonly porcelainStatus: string
}

interface V137ProtectedBaselineUnsigned {
  readonly schemaVersion: "v1.37-protected-working-tree-baseline-v1"
  readonly milestone: "v1.37"
  readonly capturePolicy: Readonly<{
    protectedPaths: typeof V137_PROTECTED_PATHS
    rawBytesStored: false
    rawBytesBoundBy: "sha256-byte-length-and-mode"
    headIdentity: "git-blob-id-and-mode-or-absence"
    diffBytes: "exact-binary-unstaged-and-cached-diff-bytes-with-sha256-and-length"
    existingDirt: "accepted-only-when-byte-identical-to-phase-start"
    writePolicy: "write-once-identical-only"
  }>
  readonly paths: readonly ProtectedPathBaseline[]
}

export interface V137ProtectedBaseline extends V137ProtectedBaselineUnsigned {
  readonly baselineSha256: `sha256:${string}`
}

interface CaptureOptions {
  readonly observedRepoRoot: string
  readonly protectedPaths?: readonly string[]
}

interface ArtifactOptions extends CaptureOptions {
  readonly artifactPath: string
}

const sha256 = (bytes: Uint8Array | string): `sha256:${string}` =>
  `sha256:${createHash("sha256").update(bytes).digest("hex")}`

const canonicalBytes = (value: unknown): Uint8Array => {
  const encoded = encodeCanonicalJson(
    value as Parameters<typeof encodeCanonicalJson>[0],
    {
      context: "canonical-manifest",
    },
  )
  if (!encoded.ok) {
    throw new TypeError(
      `Protected baseline canonical JSON failed: ${encoded.error.code}`,
    )
  }
  return encoded.bytes
}

const baselineSelfHash = (
  baseline: V137ProtectedBaselineUnsigned,
): `sha256:${string}` => sha256(canonicalBytes(baseline))

const exactProtectedInventory = (
  protectedPaths: readonly string[] = V137_PROTECTED_PATHS,
): typeof V137_PROTECTED_PATHS => {
  if (
    protectedPaths.length !== V137_PROTECTED_PATHS.length ||
    protectedPaths.some(
      (protectedPath, index) => protectedPath !== V137_PROTECTED_PATHS[index],
    )
  ) {
    throw new TypeError(
      "Protected baseline requires the exact protected path inventory.",
    )
  }
  return V137_PROTECTED_PATHS
}

type GitResult = Readonly<{
  status: number
  stdout: Buffer
  stderr: Buffer
}>

const runGit = (
  repoRoot: string,
  args: readonly string[],
  options: Readonly<{ allowFailure?: boolean }> = {},
): GitResult => {
  const result = spawnSync("git", args, {
    cwd: repoRoot,
    encoding: null,
    maxBuffer: 32 * 1024 * 1024,
    env: {
      ...process.env,
      LC_ALL: "C",
      LANG: "C",
      GIT_CONFIG_NOSYSTEM: "1",
    },
  })
  const response = {
    status: result.status ?? 1,
    stdout: Buffer.from(result.stdout ?? []),
    stderr: Buffer.from(result.stderr ?? []),
  }
  if (response.status !== 0 && !options.allowFailure) {
    throw new TypeError(
      `Protected baseline git observation failed: git ${args.join(" ")}`,
    )
  }
  return response
}

const assertRepositoryRoot = (repoRootInput: string): string => {
  const repoRoot = realpathSync(path.resolve(repoRootInput))
  const observed = runGit(repoRoot, ["rev-parse", "--show-toplevel"])
    .stdout.toString("utf8")
    .trim()
  if (realpathSync(path.resolve(observed)) !== repoRoot) {
    throw new TypeError("Protected baseline target is not a repository root.")
  }
  return repoRoot
}

const modeString = (mode: number): string =>
  (mode & 0o7777).toString(8).padStart(4, "0")

const diffEvidence = (
  bytes: Buffer,
  staged: boolean,
): ProtectedDiffEvidence => ({
  command: staged
    ? "git diff --binary --no-ext-diff --cached -- <path>"
    : "git diff --binary --no-ext-diff -- <path>",
  byteLength: bytes.byteLength,
  sha256: sha256(bytes),
  bytesBase64: bytes.toString("base64"),
})

const headEvidence = (
  repoRoot: string,
  protectedPath: ProtectedPath,
): ProtectedPathBaseline["head"] => {
  const object = runGit(
    repoRoot,
    ["rev-parse", "--verify", `HEAD:${protectedPath}`],
    { allowFailure: true },
  )
  if (object.status !== 0) {
    return { exists: false, blobId: null, mode: null }
  }
  const blobId = object.stdout.toString("utf8").trim()
  const tree = runGit(repoRoot, ["ls-tree", "HEAD", "--", protectedPath])
    .stdout.toString("utf8")
    .trim()
  const match = /^([0-7]{6}) blob ([0-9a-f]+)\t(.+)$/u.exec(tree)
  if (
    match === null ||
    match[2] !== blobId ||
    match[3] !== protectedPath ||
    !/^[0-9a-f]{40,64}$/u.test(blobId)
  ) {
    throw new TypeError("Protected baseline HEAD blob identity is malformed.")
  }
  return {
    exists: true,
    blobId,
    mode: match[1]!,
  }
}

const capturePath = (
  repoRoot: string,
  protectedPath: ProtectedPath,
): ProtectedPathBaseline => {
  const absolutePath = path.join(repoRoot, protectedPath)
  if (!existsSync(absolutePath)) {
    throw new TypeError(`Protected path is missing: ${protectedPath}`)
  }
  const stat = lstatSync(absolutePath)
  if (!stat.isFile() || stat.isSymbolicLink()) {
    throw new TypeError(
      `Protected path is not a regular file: ${protectedPath}`,
    )
  }
  const rawBytes = readFileSync(absolutePath)
  const unstaged = runGit(repoRoot, [
    "diff",
    "--abbrev=7",
    "--binary",
    "--no-ext-diff",
    "--",
    protectedPath,
  ]).stdout
  const staged = runGit(repoRoot, [
    "diff",
    "--abbrev=7",
    "--binary",
    "--no-ext-diff",
    "--cached",
    "--",
    protectedPath,
  ]).stdout
  const porcelainStatus = runGit(repoRoot, [
    "status",
    "--porcelain=v1",
    "--untracked-files=all",
    "--",
    protectedPath,
  ]).stdout.toString("utf8")
  return {
    path: protectedPath,
    raw: {
      exists: true,
      byteLength: rawBytes.byteLength,
      sha256: sha256(rawBytes),
      mode: modeString(stat.mode),
    },
    head: headEvidence(repoRoot, protectedPath),
    unstagedDiff: diffEvidence(unstaged, false),
    stagedDiff: diffEvidence(staged, true),
    porcelainStatus,
  }
}

export const captureV137ProtectedBaseline = (
  options: CaptureOptions,
): V137ProtectedBaseline => {
  const repoRoot = assertRepositoryRoot(options.observedRepoRoot)
  const protectedPaths = exactProtectedInventory(options.protectedPaths)
  const unsigned: V137ProtectedBaselineUnsigned = {
    schemaVersion: "v1.37-protected-working-tree-baseline-v1",
    milestone: "v1.37",
    capturePolicy: {
      protectedPaths,
      rawBytesStored: false,
      rawBytesBoundBy: "sha256-byte-length-and-mode",
      headIdentity: "git-blob-id-and-mode-or-absence",
      diffBytes:
        "exact-binary-unstaged-and-cached-diff-bytes-with-sha256-and-length",
      existingDirt: "accepted-only-when-byte-identical-to-phase-start",
      writePolicy: "write-once-identical-only",
    },
    paths: protectedPaths.map((protectedPath) =>
      capturePath(repoRoot, protectedPath),
    ),
  }
  return {
    ...unsigned,
    baselineSha256: baselineSelfHash(unsigned),
  }
}

const exactKeys = (
  value: unknown,
  expected: readonly string[],
): value is Record<string, unknown> =>
  value !== null &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  Object.keys(value).length === expected.length &&
  expected.every((key) => Object.hasOwn(value, key))

const assertDiffEvidence = (
  value: unknown,
  expectedCommand: ProtectedDiffEvidence["command"],
): asserts value is ProtectedDiffEvidence => {
  if (
    !exactKeys(value, ["command", "byteLength", "sha256", "bytesBase64"]) ||
    value.command !== expectedCommand ||
    !Number.isSafeInteger(value.byteLength) ||
    (value.byteLength as number) < 0 ||
    typeof value.sha256 !== "string" ||
    !/^sha256:[0-9a-f]{64}$/u.test(value.sha256) ||
    typeof value.bytesBase64 !== "string"
  ) {
    throw new TypeError("Protected baseline diff evidence is malformed.")
  }
  const bytes = Buffer.from(value.bytesBase64, "base64")
  if (
    bytes.byteLength !== value.byteLength ||
    sha256(bytes) !== value.sha256 ||
    bytes.toString("base64") !== value.bytesBase64
  ) {
    throw new TypeError("Protected baseline diff evidence bytes drifted.")
  }
}

const unsignedProjection = (
  baseline: V137ProtectedBaseline,
): V137ProtectedBaselineUnsigned => ({
  schemaVersion: baseline.schemaVersion,
  milestone: baseline.milestone,
  capturePolicy: baseline.capturePolicy,
  paths: baseline.paths,
})

const orderedDiffEvidence = (
  evidence: ProtectedDiffEvidence,
): ProtectedDiffEvidence => ({
  command: evidence.command,
  byteLength: evidence.byteLength,
  sha256: evidence.sha256,
  bytesBase64: evidence.bytesBase64,
})

const orderedPathBaseline = (
  baseline: ProtectedPathBaseline,
): ProtectedPathBaseline => ({
  path: baseline.path,
  raw: {
    exists: true,
    byteLength: baseline.raw.byteLength,
    sha256: baseline.raw.sha256,
    mode: baseline.raw.mode,
  },
  head: baseline.head.exists
    ? {
        exists: true,
        blobId: baseline.head.blobId,
        mode: baseline.head.mode,
      }
    : {
        exists: false,
        blobId: null,
        mode: null,
      },
  unstagedDiff: orderedDiffEvidence(baseline.unstagedDiff),
  stagedDiff: orderedDiffEvidence(baseline.stagedDiff),
  porcelainStatus: baseline.porcelainStatus,
})

const orderedBaseline = (
  baseline: V137ProtectedBaseline,
): V137ProtectedBaseline => ({
  schemaVersion: baseline.schemaVersion,
  milestone: baseline.milestone,
  capturePolicy: {
    protectedPaths: baseline.capturePolicy.protectedPaths,
    rawBytesStored: baseline.capturePolicy.rawBytesStored,
    rawBytesBoundBy: baseline.capturePolicy.rawBytesBoundBy,
    headIdentity: baseline.capturePolicy.headIdentity,
    diffBytes: baseline.capturePolicy.diffBytes,
    existingDirt: baseline.capturePolicy.existingDirt,
    writePolicy: baseline.capturePolicy.writePolicy,
  },
  paths: baseline.paths.map(orderedPathBaseline),
  baselineSha256: baseline.baselineSha256,
})

export const parseV137ProtectedBaseline = (
  source: string,
): V137ProtectedBaseline => {
  let value: unknown
  try {
    value = JSON.parse(source) as unknown
  } catch {
    throw new TypeError("Protected baseline JSON is malformed.")
  }
  if (
    !exactKeys(value, [
      "schemaVersion",
      "milestone",
      "capturePolicy",
      "paths",
      "baselineSha256",
    ]) ||
    value.schemaVersion !== "v1.37-protected-working-tree-baseline-v1" ||
    value.milestone !== "v1.37" ||
    typeof value.baselineSha256 !== "string" ||
    !/^sha256:[0-9a-f]{64}$/u.test(value.baselineSha256) ||
    !exactKeys(value.capturePolicy, [
      "protectedPaths",
      "rawBytesStored",
      "rawBytesBoundBy",
      "headIdentity",
      "diffBytes",
      "existingDirt",
      "writePolicy",
    ]) ||
    JSON.stringify(value.capturePolicy.protectedPaths) !==
      JSON.stringify(V137_PROTECTED_PATHS) ||
    value.capturePolicy.rawBytesStored !== false ||
    value.capturePolicy.rawBytesBoundBy !== "sha256-byte-length-and-mode" ||
    value.capturePolicy.headIdentity !== "git-blob-id-and-mode-or-absence" ||
    value.capturePolicy.diffBytes !==
      "exact-binary-unstaged-and-cached-diff-bytes-with-sha256-and-length" ||
    value.capturePolicy.existingDirt !==
      "accepted-only-when-byte-identical-to-phase-start" ||
    value.capturePolicy.writePolicy !== "write-once-identical-only" ||
    !Array.isArray(value.paths) ||
    value.paths.length !== V137_PROTECTED_PATHS.length
  ) {
    throw new TypeError("Protected baseline shape is malformed.")
  }

  const paths = value.paths.map((entry, index) => {
    const expectedPath = V137_PROTECTED_PATHS[index]!
    if (
      !exactKeys(entry, [
        "path",
        "raw",
        "head",
        "unstagedDiff",
        "stagedDiff",
        "porcelainStatus",
      ]) ||
      entry.path !== expectedPath ||
      typeof entry.porcelainStatus !== "string" ||
      !exactKeys(entry.raw, ["exists", "byteLength", "sha256", "mode"]) ||
      entry.raw.exists !== true ||
      !Number.isSafeInteger(entry.raw.byteLength) ||
      (entry.raw.byteLength as number) < 0 ||
      typeof entry.raw.sha256 !== "string" ||
      !/^sha256:[0-9a-f]{64}$/u.test(entry.raw.sha256) ||
      typeof entry.raw.mode !== "string" ||
      !/^[0-7]{4}$/u.test(entry.raw.mode) ||
      !exactKeys(entry.head, ["exists", "blobId", "mode"])
    ) {
      throw new TypeError("Protected baseline path evidence is malformed.")
    }
    if (
      entry.head.exists === true
        ? typeof entry.head.blobId !== "string" ||
          !/^[0-9a-f]{40,64}$/u.test(entry.head.blobId) ||
          typeof entry.head.mode !== "string" ||
          !/^[0-7]{6}$/u.test(entry.head.mode)
        : entry.head.exists !== false ||
          entry.head.blobId !== null ||
          entry.head.mode !== null
    ) {
      throw new TypeError("Protected baseline HEAD evidence is malformed.")
    }
    assertDiffEvidence(
      entry.unstagedDiff,
      "git diff --binary --no-ext-diff -- <path>",
    )
    assertDiffEvidence(
      entry.stagedDiff,
      "git diff --binary --no-ext-diff --cached -- <path>",
    )
    return orderedPathBaseline(entry as unknown as ProtectedPathBaseline)
  })

  const baseline = orderedBaseline({
    schemaVersion: value.schemaVersion,
    milestone: value.milestone,
    capturePolicy: {
      protectedPaths: V137_PROTECTED_PATHS,
      rawBytesStored: false,
      rawBytesBoundBy: "sha256-byte-length-and-mode",
      headIdentity: "git-blob-id-and-mode-or-absence",
      diffBytes:
        "exact-binary-unstaged-and-cached-diff-bytes-with-sha256-and-length",
      existingDirt: "accepted-only-when-byte-identical-to-phase-start",
      writePolicy: "write-once-identical-only",
    },
    paths,
    baselineSha256: value.baselineSha256,
  } as V137ProtectedBaseline)
  if (
    baselineSelfHash(unsignedProjection(baseline)) !== baseline.baselineSha256
  ) {
    throw new TypeError("Protected baseline self-hash is invalid.")
  }
  if (renderV137ProtectedBaseline(baseline) !== source) {
    throw new TypeError("Protected baseline JSON bytes are not canonical.")
  }
  return baseline
}

export const renderV137ProtectedBaseline = (
  baseline: V137ProtectedBaseline,
): string => `${JSON.stringify(orderedBaseline(baseline), null, 2)}\n`

const baselineDrifted = (
  expected: V137ProtectedBaseline,
  observed: V137ProtectedBaseline,
): boolean =>
  !Buffer.from(canonicalBytes(expected)).equals(
    Buffer.from(canonicalBytes(observed)),
  )

export const writeV137ProtectedBaseline = (
  options: ArtifactOptions,
): V137ProtectedBaseline => {
  const observed = captureV137ProtectedBaseline(options)
  const rendered = renderV137ProtectedBaseline(observed)
  if (existsSync(options.artifactPath)) {
    const existingBytes = readFileSync(options.artifactPath, "utf8")
    const existing = parseV137ProtectedBaseline(existingBytes)
    if (baselineDrifted(existing, observed) || existingBytes !== rendered) {
      throw new TypeError(
        "Protected baseline changed; refusing to overwrite write-once evidence.",
      )
    }
    return existing
  }
  mkdirSync(path.dirname(options.artifactPath), { recursive: true })
  writeFileSync(options.artifactPath, rendered, { flag: "wx", mode: 0o600 })
  return observed
}

export const checkV137ProtectedBaseline = (
  options: ArtifactOptions,
): V137ProtectedBaseline => {
  if (!existsSync(options.artifactPath)) {
    throw new TypeError("Protected baseline artifact is missing.")
  }
  const expected = parseV137ProtectedBaseline(
    readFileSync(options.artifactPath, "utf8"),
  )
  const observed = captureV137ProtectedBaseline(options)
  if (baselineDrifted(expected, observed)) {
    throw new TypeError("Protected working-tree state drifted from baseline.")
  }
  return expected
}

const defaultExecutionRepoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
)

const gitCommonDirectory = (repoRoot: string): string => {
  const reported = runGit(repoRoot, ["rev-parse", "--git-common-dir"])
    .stdout.toString("utf8")
    .trim()
  if (reported.length === 0) {
    throw new TypeError(
      "Protected baseline Git common directory is unavailable.",
    )
  }
  return realpathSync(path.resolve(repoRoot, reported))
}

const defaultObservedRepoRoot = (): string => {
  const executionRoot = assertRepositoryRoot(defaultExecutionRepoRoot)
  const worktrees = runGit(executionRoot, [
    "worktree",
    "list",
    "--porcelain",
  ]).stdout.toString("utf8")
  const listedRoots = Array.from(
    worktrees.matchAll(/^worktree (.+)$/gmu),
    (match) => path.resolve(match[1]!),
  )
  const primaryCandidate = listedRoots[0]
  if (
    primaryCandidate === undefined ||
    !listedRoots.some((listedRoot) => listedRoot === executionRoot)
  ) {
    throw new TypeError("Protected baseline primary worktree is unavailable.")
  }
  const primaryRoot = assertRepositoryRoot(primaryCandidate)
  if (
    gitCommonDirectory(executionRoot) !== gitCommonDirectory(primaryRoot) ||
    (lstatSync(path.join(executionRoot, ".git")).isDirectory() &&
      primaryRoot !== executionRoot)
  ) {
    throw new TypeError(
      "Protected baseline primary worktree does not match the execution repository.",
    )
  }
  return primaryRoot
}

const runCli = (): void => {
  const args = process.argv.slice(2)
  if (args.length !== 1 || (args[0] !== "--write" && args[0] !== "--check")) {
    throw new TypeError(
      "Usage: capture-v1-37-protected-baseline.ts --write|--check",
    )
  }
  const artifactPath = path.join(
    defaultExecutionRepoRoot,
    V137_PROTECTED_BASELINE_PATH,
  )
  const options = {
    observedRepoRoot: defaultObservedRepoRoot(),
    artifactPath,
  }
  const baseline =
    args[0] === "--write"
      ? writeV137ProtectedBaseline(options)
      : checkV137ProtectedBaseline(options)
  process.stdout.write(
    `${JSON.stringify({
      status: args[0] === "--write" ? "captured" : "verified",
      artifact: V137_PROTECTED_BASELINE_PATH,
      protectedPathCount: baseline.paths.length,
      baselineSha256: baseline.baselineSha256,
    })}\n`,
  )
}

if (
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    runCli()
  } catch (error) {
    process.stderr.write(
      `${error instanceof Error ? error.message : "Protected baseline failed."}\n`,
    )
    process.exitCode = 1
  }
}
