import { execFileSync } from "node:child_process"
import { existsSync, readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import {
  LEAN_AUTHORITY_FALSE,
  createLeanManifest,
  validateLeanManifest,
  type LeanManifest,
} from "./lib/v1-38-lean-runner-feasibility.js"
import { syntheticLeanTerminal } from "./run-v1-38-lean-runner-feasibility.js"

export const LEAN_MANIFEST_PATH = ".planning/artifacts/v1.38-lean-runner-manifest.json"
export const LEAN_INVOCATION_PATH = ".planning/artifacts/v1.38-lean-runner-invocation-v1.json"
export const LEAN_TERMINAL_PATH = ".planning/artifacts/v1.38-lean-runner-terminal-v1.json"
export const LEAN_READINESS_PATH = ".planning/artifacts/v1.38-plan-262-150-readiness-v1.json"
export const LEAN_ADJUDICATION_PATH = ".planning/artifacts/v1.38-plan-262-152-adjudication-v1.json"

export const LEAN_SOURCE_PATHS = Object.freeze([
  "scripts/lib/v1-38-lean-runner-feasibility.ts",
  "scripts/lib/v1-38-lean-runner-feasibility.test.ts",
  "scripts/run-v1-38-lean-runner-feasibility.ts",
  "scripts/run-v1-38-lean-runner-feasibility.test.ts",
  "scripts/check-v1-38-lean-admission.ts",
  "scripts/check-v1-38-lean-admission.test.ts",
] as const)

const git = (repoRoot: string, args: readonly string[]): string =>
  execFileSync("git", args, { cwd: repoRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim()

export const assertLeanStatus = (status: string): void => {
  const invalid = status.split("\n").filter(Boolean).filter((line) => {
    const file = line.slice(3)
    return !(line.startsWith("?? ") && /^\.v138-successor-[0-9a-f]{64}\.lock$/u.test(file))
  })
  if (invalid.length > 0) throw new TypeError(`LEAN_WORKTREE_DIRTY:${invalid.join(",")}`)
}

const resolveCommit = (repoRoot: string, ref: string): string => {
  const commit = git(repoRoot, ["rev-parse", `${ref}^{commit}`])
  if (!/^[0-9a-f]{40}$/u.test(commit)) throw new TypeError("LEAN_SOURCE_COMMIT_INVALID")
  return commit
}

export const renderLeanManifest = (repoRoot: string, sourceRef: string): LeanManifest => {
  const commit = resolveCommit(repoRoot, sourceRef)
  const tree = git(repoRoot, ["show", "-s", "--format=%T", commit])
  const executableBlobs = Object.fromEntries(LEAN_SOURCE_PATHS.map((sourcePath) => {
    const oid = git(repoRoot, ["rev-parse", `${commit}:${sourcePath}`])
    return [sourcePath, oid]
  }))
  return createLeanManifest({ commit, tree, executableBlobs })
}

export const checkLeanManifest = (repoRoot: string, rawManifest: unknown): LeanManifest => {
  const manifest = validateLeanManifest(rawManifest)
  execFileSync("git", ["merge-base", "--is-ancestor", manifest.source.commit, "HEAD"], {
    cwd: repoRoot, stdio: "ignore",
  })
  for (const [sourcePath, expectedOid] of Object.entries(manifest.source.executableBlobs)) {
    if (!LEAN_SOURCE_PATHS.includes(sourcePath as (typeof LEAN_SOURCE_PATHS)[number])) {
      throw new TypeError("LEAN_SOURCE_PATH_EXTRA")
    }
    const actualOid = git(repoRoot, ["rev-parse", `${manifest.source.commit}:${sourcePath}`])
    if (actualOid !== expectedOid) throw new TypeError(`LEAN_SOURCE_BLOB_DRIFT:${sourcePath}`)
  }
  if (Object.keys(manifest.source.executableBlobs).length !== LEAN_SOURCE_PATHS.length) {
    throw new TypeError("LEAN_SOURCE_PATH_MISSING")
  }
  const expected = renderLeanManifest(repoRoot, manifest.source.commit)
  if (JSON.stringify(expected) !== JSON.stringify(manifest)) throw new TypeError("LEAN_MANIFEST_DRIFT")
  return manifest
}

const assertNoEffectArtifacts = (repoRoot: string): void => {
  for (const artifactPath of [LEAN_INVOCATION_PATH, LEAN_TERMINAL_PATH, LEAN_READINESS_PATH, LEAN_ADJUDICATION_PATH]) {
    if (existsSync(path.resolve(repoRoot, artifactPath))) {
      throw new TypeError(`LEAN_FORBIDDEN_ARTIFACT:${artifactPath}`)
    }
  }
  const tracked = git(repoRoot, ["ls-files"])
  const forbidden = tracked.split("\n").filter((file) =>
    /v1\.38-(?:full-inward|edge-anchored-bracket|formation-profile|sealed-holdout|candidate-search)/u.test(file),
  )
  if (forbidden.length > 0) throw new TypeError(`LEAN_FORBIDDEN_SCOPE:${forbidden.join(",")}`)
}

export const checkLeanSourcePreconditions = (repoRoot: string): void => {
  assertLeanStatus(git(repoRoot, ["status", "--short", "--untracked-files=all"]))
  assertNoEffectArtifacts(repoRoot)
}

const main = async (): Promise<void> => {
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
  const selector = process.argv[2]
  if (selector === "--render-manifest") {
    process.stdout.write(`${JSON.stringify(renderLeanManifest(repoRoot, process.argv[3] ?? "HEAD"), null, 2)}\n`)
    return
  }
  if (selector === "--check-manifest") {
    checkLeanSourcePreconditions(repoRoot)
    checkLeanManifest(repoRoot, JSON.parse(readFileSync(path.resolve(repoRoot, LEAN_MANIFEST_PATH), "utf8")))
    process.stdout.write(`${JSON.stringify({ ok: true, selector, liveInvocationCount: 0, authority: LEAN_AUTHORITY_FALSE })}\n`)
    return
  }
  if (selector === "--synthetic") {
    process.stdout.write(`${JSON.stringify({ terminal: await syntheticLeanTerminal(), liveInvocationCount: 0 })}\n`)
    return
  }
  throw new TypeError("LEAN_CHECK_SELECTOR_INVALID")
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  void main().catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : "LEAN_CHECK_FAILED"}\n`)
    process.exitCode = 1
  })
}
