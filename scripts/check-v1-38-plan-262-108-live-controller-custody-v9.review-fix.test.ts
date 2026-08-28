import { execFileSync } from "node:child_process"
import { chmodSync, existsSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { describe, expect, it } from "vitest"
import {
  V138_PLAN_262_108_CORRECTED_PATHS,
  V138_PLAN_262_108_PROTECTED_BRANCHES,
  authenticateV138Plan262108CorrectedTrioCustody,
  buildV138Plan262108CorrectedReview,
  computeV138Plan262108CarrierRootV2,
  computeV138Plan262108PayloadRootV9,
  computeV138Plan262108SupplementRootV2,
  inspectV138Plan262108IndependentProtectedHistory,
  publishV138Plan262108CorrectedReview,
  runV138Plan262108AdversarialMatrix,
} from "./check-v1-38-plan-262-108-live-controller-custody-v9.js"

const repoRoot = path.resolve(import.meta.dirname, "..")
const cloneRepo = (): { owner: string; root: string } => {
  const owner = mkdtempSync(path.join(tmpdir(), "v138-plan-262-108-v9-"))
  const root = path.join(owner, "repo")
  execFileSync("/usr/bin/git", ["clone", "--quiet", "--no-local", repoRoot, root], {
    env: { PATH: "/usr/bin:/bin", LANG: "C", LC_ALL: "C", HOME: owner },
  })
  symlinkSync(path.join(repoRoot, "node_modules"), path.join(root, "node_modules"), "dir")
  return { owner, root }
}
const commit = (root: string, paths: readonly string[], message: string): string => {
  execFileSync("/usr/bin/git", ["add", "--", ...paths], { cwd: root })
  execFileSync(
    "/usr/bin/git",
    ["-c", "user.name=Plan 108 Fix", "-c", "user.email=plan108@example.invalid", "commit", "--quiet", "-m", message],
    { cwd: root },
  )
  return execFileSync("/usr/bin/git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim()
}

describe("Plan 262-108 code-review corrections", () => {
  it("owns critical roots and the complete protected-history contract independently", () => {
    const source = readFileSync(
      path.join(repoRoot, "scripts/check-v1-38-plan-262-108-live-controller-custody-v9.ts"),
      "utf8",
    )
    for (const forbidden of [
      "authenticateV138LiveV8ProtectedHistory",
      "computeV138LiveV8ReviewPayloadRoot",
      "computeV138LiveV8ReviewCarrierRoot",
      "computeV138LiveV8SupplementRoot",
      "V138_LIVE_V8_PROTECTED_BRANCHES",
    ]) expect(source).not.toContain(forbidden)
    expect(computeV138Plan262108PayloadRootV9({ marker: "payload" })).toMatch(/^sha256:[0-9a-f]{64}$/u)
    expect(computeV138Plan262108CarrierRootV2({ marker: "carrier" })).toMatch(/^sha256:[0-9a-f]{64}$/u)
    expect(computeV138Plan262108SupplementRootV2({ marker: "supplement" })).toMatch(/^sha256:[0-9a-f]{64}$/u)
    const history = inspectV138Plan262108IndependentProtectedHistory(repoRoot)
    expect(history.branchCount).toBe(12)
    expect(history.expandedManifestRoot).toMatch(/^sha256:[0-9a-f]{64}$/u)
  }, 180_000)

  it("publishes a deterministic truthful blocked result for review findings", () => {
    const result = buildV138Plan262108CorrectedReview({
      source: {
        sourceCommit: "a".repeat(40), sourceTree: "b".repeat(40), sourceParent: "c".repeat(40),
        checkoutPaths: [], pathCount: 0, rawByteManifestRoot: `sha256:${"1".repeat(64)}`,
        recursiveDependencyRoot: `sha256:${"2".repeat(64)}`, recursiveDependencyCount: 0,
        portableClosureRoot: `sha256:${"3".repeat(64)}`, executionClosureRoot: `sha256:${"4".repeat(64)}`,
        protectedHistoryRoot: `sha256:${"5".repeat(64)}`, expandedProtectedHistoryRoot: `sha256:${"6".repeat(64)}`,
        pathnameLaunchReplacementResistanceClaimed: false,
      },
      observations: { actualModesPassed: 3, syntheticProducerCalls: 0, liveInvoked: false },
      findings: [{ code: "F-TEST-COUNTER-DRIFT", boundary: "counter_drift", detailRoot: `sha256:${"7".repeat(64)}` }],
    })
    expect(result.findingCount).toBe(1)
    expect(result.payload.reviewStatus).toBe("blocked")
    expect(result.review.verdict).toBe("blocked")
    expect(result.plan109Eligible).toBe(false)
    expect(result.reviewBytes.toString("utf8")).toContain("F-TEST-COUNTER-DRIFT")
  })

  it("binds publication commit, blobs, modes, working bytes, and no later rewrite", () => {
    const { owner, root } = cloneRepo()
    try {
      execFileSync("/usr/bin/git", ["checkout", "--quiet", "--detach", "4537f3f6"], { cwd: root })
      const result = publishV138Plan262108CorrectedReview(root)
      const publication = commit(root, Object.values(V138_PLAN_262_108_CORRECTED_PATHS), "publish corrected review")
      expect(authenticateV138Plan262108CorrectedTrioCustody(root, publication).publicationCommit).toBe(publication)
      for (const repoPath of Object.values(V138_PLAN_262_108_CORRECTED_PATHS)) {
        const target = path.join(root, repoPath)
        const bytes = readFileSync(target)
        writeFileSync(target, Buffer.concat([bytes, Buffer.from("dirty\n")]))
        expect(() => authenticateV138Plan262108CorrectedTrioCustody(root, publication), repoPath).toThrow()
        writeFileSync(target, bytes)
        chmodSync(target, 0o755)
        expect(() => authenticateV138Plan262108CorrectedTrioCustody(root, publication), repoPath).toThrow()
        chmodSync(target, 0o644)
      }
      writeFileSync(
        path.join(root, V138_PLAN_262_108_CORRECTED_PATHS.review),
        Buffer.concat([result.reviewBytes, Buffer.from("successor rewrite\n")]),
      )
      commit(root, [V138_PLAN_262_108_CORRECTED_PATHS.review], "rewrite corrected review")
      expect(() => authenticateV138Plan262108CorrectedTrioCustody(root, publication)).toThrow()
    } finally {
      rmSync(owner, { recursive: true, force: true })
    }
  }, 300_000)

  it("executes the complete adversarial and seven-mode CLI matrix without effects", () => {
    const correctedBefore = Object.fromEntries(
      Object.values(V138_PLAN_262_108_CORRECTED_PATHS).map((repoPath) => [
        repoPath,
        existsSync(path.join(repoRoot, repoPath)) ? readFileSync(path.join(repoRoot, repoPath)) : null,
      ]),
    )
    const matrix = runV138Plan262108AdversarialMatrix(repoRoot)
    expect(matrix).toMatchObject({ completed: true, liveInvoked: false, effectCount: 0 })
    expect(matrix.boundaries).toEqual([
      "non_entry_recursive_dependency", "omitted_dependency", "path_substitution", "mode_drift",
      "protected_history_all_branches", "portable_full_root_alias", "review_self_custody",
      "pair_rewrite", "counter_drift", "authority_claim", "forbidden_effect",
    ])
    expect(matrix.protectedPlans).toEqual(V138_PLAN_262_108_PROTECTED_BRANCHES.map(({ plan }) => plan))
    expect(matrix.cliModesPassed).toBe(7)
    for (const repoPath of Object.values(V138_PLAN_262_108_CORRECTED_PATHS))
      expect(existsSync(path.join(repoRoot, repoPath)) ? readFileSync(path.join(repoRoot, repoPath)) : null)
        .toEqual(correctedBefore[repoPath])
  }, 300_000)
})
