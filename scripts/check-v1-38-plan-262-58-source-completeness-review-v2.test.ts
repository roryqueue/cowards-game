import { createHash } from "node:crypto"
import { execFileSync } from "node:child_process"
import { chmodSync, copyFileSync, mkdtempSync, mkdirSync, realpathSync, rmSync,
  writeFileSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import { encodeCanonicalJson } from "@cowards/spec"
import {
  V138_PLAN_262_56_AUTHORIZATION_SCHEMA,
  V138_PLAN_262_56_AUTHORIZATION_V8_SCHEMA,
  V138_PLAN_262_56_OBSOLETE_V7_PATHS,
  V138_PLAN_262_56_V8_CANONICAL_PATHS,
  V138_SUCCESSOR_SOURCE_SEAL_V7_SCHEMA,
  V138_SUCCESSOR_SOURCE_SEAL_V8_SCHEMA,
  buildV138Plan26256AuthorizationV8,
  buildV138SuccessorSourceSealV8,
  checkV138Plan26256AuthorizationV8,
  checkV138SuccessorSealCommitV8,
  writeV138Plan26256AuthorizationV7,
  writeV138SuccessorSourceSealV7,
} from "./lib/v1-38-successor-source-seal.js"
import {
  V138_PLAN_262_57_DISPOSITIONS,
  V138_ROUTE_7_SOURCE_MANIFEST,
  checkV138Route7SourceCompleteness,
  dispatchV138CurrentMatrixDirectEntry,
} from "./lib/v1-38-current-matrix-reproduction.js"
import {
  V138_PLAN_262_58_SOURCE_PATHS,
  canonicalV138ReviewV2,
  captureV138ReviewV2Execution,
  deriveV138ReviewV2,
  inspectV138SourceIdentityA8,
  sha256V138ReviewV2,
} from "./check-v1-38-plan-262-58-source-completeness-review-v2.js"
import { evaluateV138Plan26258Lifecycle } from
  "./check-v1-38-dependency-revision-boundaries.js"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const git = (cwd: string, args: readonly string[]) => execFileSync("git", [...args],
  { cwd, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }).trim()
const writeCanonical = (target: string, value: unknown) => {
  const encoded = encodeCanonicalJson(value as never, { context: "canonical-manifest" })
  if (!encoded.ok) throw new TypeError("TEST_CANONICAL_INVALID")
  writeFileSync(target, Buffer.concat([Buffer.from(encoded.bytes), Buffer.from("\n")]))
}

describe("Plan 262-58 reviewer-v2 corrective contract", () => {
  it("derives exact sourceBase8/A8 and exact six committed blobs", () => {
    const custody = inspectV138SourceIdentityA8(repoRoot)
    expect(custody.sourceBase8).toBe("5fa635ccebfcef6ff00cd05876401cec4688e64f")
    expect(custody.a8Parents).toEqual([custody.sourceBase8])
    expect(custody.aggregateChangedPaths).toEqual([...V138_PLAN_262_58_SOURCE_PATHS].sort())
    expect(custody.blobs).toHaveLength(6)
    expect(custody.run.every(item => item.authorRun ===
      "codex-reviewfix-262-58-v3-20260815")).toBe(true)
    expect(custody.planningDescendants.every(item => item.paths.every(
      repoPath => repoPath.startsWith(".planning/")))).toBe(true)
  })

  it("reaches every actual production direct-dispatch branch from the manifest", async () => {
    expect(checkV138Route7SourceCompleteness()).toBe(V138_ROUTE_7_SOURCE_MANIFEST)
    const reached: string[] = []
    for (const entry of V138_ROUTE_7_SOURCE_MANIFEST) {
      const result = await dispatchV138CurrentMatrixDirectEntry(entry.command, {
        runShard: () => { throw new TypeError("DECOY_SHARD") },
        runReceipt: () => { reached.push(entry.handler); return entry.handler },
      })
      expect(result).toBe(entry.handler)
    }
    expect(reached).toEqual(V138_ROUTE_7_SOURCE_MANIFEST.map(item => item.handler))
    expect(new Set(reached).size).toBe(reached.length)
    expect(V138_ROUTE_7_SOURCE_MANIFEST.map(item => item.terminalDisposition)
      .filter(Boolean).join("|")).toContain("reproduction_passed")
    expect(new Set(V138_PLAN_262_57_DISPOSITIONS).size)
      .toBe(V138_PLAN_262_57_DISPOSITIONS.length)
    const captured = await captureV138ReviewV2Execution(repoRoot)
    expect(captured.records.map(item => item.reachedHandler)).toEqual(reached)
    expect(captured.events.map(item => item.operation)).toEqual(
      expect.arrayContaining(["lstat", "dispatch", "write", "open", "cleanup"]))
    expect(captured.events.at(-1)).toMatchObject({ operation: "lstat",
      disposition: "ENOENT" })
    expect(captured.before.root).toBe(captured.after.root)
  })

  it("derives all six lifecycle states and rejects every observed-field drift", () => {
    const cases = [
      ["review_v2_pending_42_of_47", 42, ["262-58", "262-59", "262-56", "262-57", "262-48"]],
      ["plan_58_complete_43_of_47", 43, ["262-59", "262-56", "262-57", "262-48"]],
      ["review_v2_complete_44_of_47", 44, ["262-56", "262-57", "262-48"]],
      ["authority_complete_45_of_47", 45, ["262-57", "262-48"]],
      ["route_complete_46_of_47", 46, ["262-48"]],
      ["phase_complete_47_of_47", 47, []],
    ] as const
    for (const [mode, completedPlans, incomplete] of cases) {
      const input = { mode, totalPlans: 47, completedPlans,
        correctiveChain: ["262-58", "262-59", "262-56", "262-57", "262-48"],
        incomplete: [...incomplete], archivedPlan55Active: false,
        reviewV1InvalidDispositionPresent: true, authorizationVersion: 8,
        sealVersion: 8, obsoleteV7Present: false, routeOrdinal: 7,
        executionVersions: [11, 11, 11, 12] }
      expect(evaluateV138Plan26258Lifecycle(input)).toMatchObject({ mode, completedPlans })
      for (const mutation of [
        { ...input, totalPlans: 48 }, { ...input, completedPlans: completedPlans - 1 },
        { ...input, correctiveChain: [...input.correctiveChain, "262-55"] },
        { ...input, incomplete: [...input.incomplete, "262-55"] },
        { ...input, archivedPlan55Active: true },
        { ...input, reviewV1InvalidDispositionPresent: false },
        { ...input, authorizationVersion: 7 }, { ...input, sealVersion: 7 },
        { ...input, obsoleteV7Present: true }, { ...input, routeOrdinal: 6 },
        { ...input, executionVersions: [11, 11, 11, 11] },
      ]) expect(() => evaluateV138Plan26258Lifecycle(mutation as never))
        .toThrow("V138_PLAN_262_58_LIFECYCLE_INVALID")
    }
  })

  it("denies all v7 future writers and keeps historical constants distinct", () => {
    expect(V138_PLAN_262_56_AUTHORIZATION_SCHEMA)
      .toBe("v1.38-plan-262-56-authorization-v7")
    expect(V138_SUCCESSOR_SOURCE_SEAL_V7_SCHEMA)
      .toBe("v1.38-successor-source-seal-v7")
    expect(V138_PLAN_262_56_AUTHORIZATION_SCHEMA)
      .not.toBe(V138_PLAN_262_56_AUTHORIZATION_V8_SCHEMA)
    expect(V138_SUCCESSOR_SOURCE_SEAL_V7_SCHEMA)
      .not.toBe(V138_SUCCESSOR_SOURCE_SEAL_V8_SCHEMA)
    expect(() => writeV138Plan26256AuthorizationV7(repoRoot,
      V138_PLAN_262_56_OBSOLETE_V7_PATHS[0], "0".repeat(40), {}, new Uint8Array()))
      .toThrow("V138_PLAN_262_56_AUTHORIZATION_V7_OBSOLETE")
    expect(() => writeV138SuccessorSourceSealV7(repoRoot,
      V138_PLAN_262_56_OBSOLETE_V7_PATHS[1], {}))
      .toThrow("V138_SUCCESSOR_SOURCE_SEAL_V7_OBSOLETE")
  })

  it("opens a real reviewer-produced detached immutable review and checks canonical B8", async () => {
    const fixture = mkdtempSync(path.join(os.tmpdir(), "cowards-plan-262-58-b8-"))
    const detachedDir = mkdtempSync(path.join(os.tmpdir(), "cowards-review-v2-input-"))
    const reviewBranch = `test-review-${path.basename(fixture)}`
    try {
      git(repoRoot, ["worktree", "add", "--detach", fixture, "HEAD"])
      const custody = inspectV138SourceIdentityA8(fixture)
      const carrierHead = git(fixture, ["rev-parse", "HEAD"])
      git(fixture, ["checkout", "-b", reviewBranch, carrierHead])
      const review = await deriveV138ReviewV2(fixture)
      const reviewTarget = path.resolve(fixture,
        V138_PLAN_262_56_V8_CANONICAL_PATHS.sourceCompletenessReview)
      const reportTarget = path.resolve(fixture,
        ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-59-REVIEW.md")
      writeFileSync(reviewTarget, `${canonicalV138ReviewV2(review)}\n`)
      writeFileSync(reportTarget, "# owned review fixture\n")
      git(fixture, ["add", V138_PLAN_262_56_V8_CANONICAL_PATHS.sourceCompletenessReview,
        ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-59-REVIEW.md"])
      git(fixture, ["-c", "user.name=fixture", "-c", "user.email=fixture@example.invalid",
        "commit", "-m", "test: publish review fixture"])
      const detachedReviewLogical = path.resolve(detachedDir,
        path.basename(V138_PLAN_262_56_V8_CANONICAL_PATHS.sourceCompletenessReview))
      copyFileSync(reviewTarget, detachedReviewLogical)
      chmodSync(detachedReviewLogical, 0o444)
      const detachedReview = realpathSync(detachedReviewLogical)
      const authorization = buildV138Plan26256AuthorizationV8({ repoRoot: fixture,
        reviewV2AbsolutePath: detachedReview })
      expect(checkV138Plan26256AuthorizationV8(fixture, authorization))
        .toEqual(authorization)
      const seal = buildV138SuccessorSourceSealV8({ repoRoot: fixture, authorization })
      const authorizationPath = path.resolve(fixture,
        V138_PLAN_262_56_V8_CANONICAL_PATHS.authorization)
      const sealPath = path.resolve(fixture, V138_PLAN_262_56_V8_CANONICAL_PATHS.seal)
      mkdirSync(path.dirname(authorizationPath), { recursive: true })
      writeCanonical(authorizationPath, authorization)
      writeCanonical(sealPath, seal)
      git(fixture, ["add", V138_PLAN_262_56_V8_CANONICAL_PATHS.authorization,
        V138_PLAN_262_56_V8_CANONICAL_PATHS.seal])
      git(fixture, ["-c", "user.name=fixture", "-c", "user.email=fixture@example.invalid",
        "commit", "-m", "test: exact two-path B8"])
      const sourceB8 = git(fixture, ["rev-parse", "HEAD"])
      const checked = checkV138SuccessorSealCommitV8({ repoRoot: fixture,
        sourceB8, authorization, seal })
      expect(checked).toMatchObject({ sourceB8,
        changedPaths: [V138_PLAN_262_56_V8_CANONICAL_PATHS.authorization,
          V138_PLAN_262_56_V8_CANONICAL_PATHS.seal].sort(),
        laterModificationCount: 0 })
      expect(checked.blobs).toHaveLength(2)
    } finally {
      try { git(repoRoot, ["worktree", "remove", fixture, "--force"]) } catch { /* fixture setup failed */ }
      try { git(repoRoot, ["branch", "-D", reviewBranch]) } catch { /* branch was not created */ }
      rmSync(detachedDir, { recursive: true, force: true })
      rmSync(fixture, { recursive: true, force: true })
    }
  }, 120_000)
})
