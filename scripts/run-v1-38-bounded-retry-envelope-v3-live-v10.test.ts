import { execFileSync } from "node:child_process"
import { mkdirSync, mkdtempSync, rmSync, symlinkSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { describe, expect, it } from "vitest"
import {
  checkV138PathStableCustodyForReview,
  deriveV138PathStableCustody,
  type V138PathStableCustody,
} from "./lib/v1-38-bounded-retry-v3-path-stable-custody-v1.js"
import { authenticateV138RetryV3ExecutionClosure } from "./lib/v1-38-bounded-retry-v3-native-custody-v1.js"

const repoRoot = path.resolve(import.meta.dirname, "..")
const sourceCommit = "a301a06df0e4a3c038cf630f3485f8fb3a879c42"
const sourcePaths = Object.freeze([
  "scripts/lib/v1-38-bounded-retry-envelope-v3.ts",
  "scripts/lib/v1-38-bounded-retry-v3-native-custody-v1.ts",
  "scripts/native/v1-38-bounded-retry-v3-owner-lock-v1.c",
  "scripts/run-v1-38-bounded-retry-envelope-v3.ts",
  "scripts/run-v1-38-bounded-retry-envelope-v3-live-v9.ts",
])
const workspaces = Object.freeze([
  "apps/runtime-service", "apps/web", "apps/worker", "packages/engine",
  "packages/golden", "packages/map-configs", "packages/persistence", "packages/replay",
  "packages/runtime-js", "packages/runtime-python", "packages/runtime-supervisor",
  "packages/runtime-wasm-wasi", "packages/service", "packages/spec", "packages/test-utils",
])

const withLinkedWorktree = <T>(run: (root: string) => T): T => {
  const owner = mkdtempSync(path.join(tmpdir(), "v138-live-v10-test-"))
  const root = path.join(owner, "repo")
  let added = false
  try {
    execFileSync("/usr/bin/git", ["worktree", "add", "--quiet", "--detach", root, "HEAD"], {
      cwd: repoRoot,
      env: { PATH: "/usr/bin:/bin", HOME: owner, LANG: "C", LC_ALL: "C" },
    })
    added = true
    symlinkSync(path.join(repoRoot, "node_modules"), path.join(root, "node_modules"), "dir")
    for (const workspace of workspaces) {
      const source = path.join(repoRoot, workspace, "node_modules")
      try {
        mkdirSync(path.join(root, workspace), { recursive: true })
        symlinkSync(source, path.join(root, workspace, "node_modules"), "dir")
      } catch {
        // Workspace has no installed node_modules projection.
      }
    }
    return run(root)
  } finally {
    if (added) {
      try { execFileSync("/usr/bin/git", ["worktree", "remove", "--force", root], { cwd: repoRoot }) }
      catch { /* preserve the primary assertion */ }
    }
    rmSync(owner, { recursive: true, force: true })
  }
}

describe("Plan 262-113 path-stable custody", () => {
  it("separates the historical path mismatch from a location-stable reviewed root", () => {
    const canonicalHistorical = authenticateV138RetryV3ExecutionClosure(repoRoot, {
      sourceCommit,
      checkoutPaths: sourcePaths,
    })
    const canonical = deriveV138PathStableCustody(repoRoot, { sourceCommit, checkoutPaths: sourcePaths })
    const linked = withLinkedWorktree((root) => ({
      historical: authenticateV138RetryV3ExecutionClosure(root, {
        sourceCommit,
        checkoutPaths: sourcePaths,
      }),
      corrected: deriveV138PathStableCustody(root, { sourceCommit, checkoutPaths: sourcePaths }),
    }))

    expect(linked.historical.nativeSourcesRoot).not.toBe(canonicalHistorical.nativeSourcesRoot)
    expect(linked.historical.executionClosureRoot).not.toBe(canonicalHistorical.executionClosureRoot)
    expect(linked.corrected.reviewedClosureRoot).toBe(canonical.reviewedClosureRoot)
    expect(linked.corrected.pathStableNativeSourcesRoot).toBe(canonical.pathStableNativeSourcesRoot)
    expect(linked.corrected.localExecutionClosureRoot).not.toBe(canonical.localExecutionClosureRoot)
    expect(canonical.pathnameLaunchReplacementResistanceClaimed).toBe(false)
  }, 180_000)

  it("rejects every reviewed and local custody mutation", () => {
    const exact = deriveV138PathStableCustody(repoRoot, { sourceCommit, checkoutPaths: sourcePaths })
    const mutations: Array<[string, V138PathStableCustody]> = [
      ["relative path", { ...exact, checkoutPaths: ["scripts/forged.ts"] }],
      ["mode", { ...exact, checkoutManifestRoot: `sha256:${"1".repeat(64)}` }],
      ["blob", { ...exact, checkoutManifestRoot: `sha256:${"2".repeat(64)}` }],
      ["bytes", { ...exact, checkoutManifestRoot: `sha256:${"3".repeat(64)}` }],
      ["recursive import", { ...exact, recursiveDependencyRoot: `sha256:${"4".repeat(64)}` }],
      ["installed input", { ...exact, installedClosureRoot: `sha256:${"5".repeat(64)}` }],
      ["native source", { ...exact, pathStableNativeSourcesRoot: `sha256:${"6".repeat(64)}` }],
      ["Git executable", { ...exact, gitExecutableSha256: `sha256:${"7".repeat(64)}` }],
      ["hardened arguments", { ...exact, hardenedGitArgumentsRoot: `sha256:${"8".repeat(64)}` }],
      ["local object identity", { ...exact, localExecutionClosureRoot: `sha256:${"9".repeat(64)}` }],
    ]
    for (const [name, candidate] of mutations)
      expect(() => checkV138PathStableCustodyForReview(exact, candidate), name).toThrow()
  }, 180_000)
})
