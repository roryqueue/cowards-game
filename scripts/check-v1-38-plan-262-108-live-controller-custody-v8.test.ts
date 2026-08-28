import { execFileSync } from "node:child_process"
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { describe, expect, it } from "vitest"
import {
  V138_PLAN_262_108_MODES,
  V138_PLAN_262_108_PATHS,
  assertV138Plan262108NoCanonicalEffects,
  checkV138Plan262108PublishedReview,
  deriveV138Plan262108ReviewNoPublish,
  executeV138Plan262108Cli,
  inspectV138Plan262108RawCustody,
  inspectV138Plan262108Source,
} from "./check-v1-38-plan-262-108-live-controller-custody-v8.js"

const repoRoot = path.resolve(import.meta.dirname, "..")
const SOURCE_COMMIT = "a964be04a8a0628d4969d2b38b02a31a51120a83"
let derivedReview:
  | ReturnType<typeof deriveV138Plan262108ReviewNoPublish>
  | undefined
const deriveOnce = () =>
  (derivedReview ??= deriveV138Plan262108ReviewNoPublish(repoRoot))

describe("Plan 262-108 independent live-controller custody review", () => {
  it("exposes only the closed review and disposable supplement modes", () => {
    expect(V138_PLAN_262_108_MODES).toEqual([
      "--derive-review-no-publish",
      "--write-review",
      "--check-review",
      "--derive-supplement-no-publish",
      "--publish-disposable-supplement",
      "--check-disposable-supplement",
      "--run-synthetic-no-effect",
    ])
  })

  it("independently derives the exact corrected source and execution closure", () => {
    const source = inspectV138Plan262108Source(repoRoot)
    expect(source).toMatchObject({
      sourceCommit: SOURCE_COMMIT,
      sourceTree: "20772dc04f7ca2b767cc4cc3ac090b54c149e239",
      sourceParent: "b94d48050289707190cfcecffda567fd710c7801",
      pathCount: 5,
      pathnameLaunchReplacementResistanceClaimed: false,
    })
    expect(source.rawByteManifestRoot).toMatch(/^sha256:[0-9a-f]{64}$/u)
    expect(source.portableClosureRoot).toMatch(/^sha256:[0-9a-f]{64}$/u)
    expect(source.executionClosureRoot).toMatch(/^sha256:[0-9a-f]{64}$/u)
    expect(source.portableClosureRoot).not.toBe(source.executionClosureRoot)
  }, 180_000)

  it("runs four actual disposable no-effect modes and derives literal zero", () => {
    const review = deriveOnce()
    expect(review).toMatchObject({
      findingCount: 0,
      findingCodes: [],
      actualModesPassed: 4,
      syntheticProducerCalls: 1,
      liveInvoked: false,
      freshCharged: 0,
      freshAccepted: 0,
      plan109Eligible: true,
      downstreamAuthority: "denied",
    })
    expect(review.actualModes).toEqual({
      sourceOnlyValidation: "passed",
      supplementDerivation: "passed",
      disposableSupplementPublicationCheck: "passed",
      syntheticNoEffectAdapter: "passed",
    })
    expect(review.payload.payloadRoot).toMatch(/^sha256:[0-9a-f]{64}$/u)
    expect(review.reviewRoot).toMatch(/^sha256:[0-9a-f]{64}$/u)
    expect(review.carrier.carrierRoot).toMatch(/^sha256:[0-9a-f]{64}$/u)
    expect(review.supplement.supplementRoot).toMatch(/^sha256:[0-9a-f]{64}$/u)
  }, 180_000)

  it("derivation changes no canonical or live destination", () => {
    const before = assertV138Plan262108NoCanonicalEffects(repoRoot)
    deriveOnce()
    expect(assertV138Plan262108NoCanonicalEffects(repoRoot)).toEqual(before)
  }, 180_000)

  it("rejects dirty bytes for every executed dependency", () => {
    const owner = mkdtempSync(path.join(tmpdir(), "v138-plan-262-108-dirty-"))
    const clone = path.join(owner, "repo")
    try {
      execFileSync(
        "/usr/bin/git",
        ["-c", "core.hooksPath=/dev/null", "clone", "--quiet", "--no-local", repoRoot, clone],
        { env: { PATH: "/usr/bin:/bin", LANG: "C", LC_ALL: "C", HOME: owner } },
      )
      const clean = inspectV138Plan262108RawCustody(clone)
      for (const repoPath of clean.checkoutPaths) {
        const target = path.join(clone, repoPath)
        writeFileSync(target, Buffer.concat([readFileSync(target), Buffer.from("dirty\n")]))
        expect(() => inspectV138Plan262108RawCustody(clone), repoPath).toThrow()
        execFileSync("/usr/bin/git", ["checkout", "--", repoPath], { cwd: clone })
      }
    } finally {
      rmSync(owner, { recursive: true, force: true })
    }
  }, 180_000)

  it("keeps the canonical supplement and every live artifact absent", () => {
    for (const repoPath of V138_PLAN_262_108_PATHS.forbiddenCanonicalDestinations)
      expect(existsSync(path.join(repoRoot, repoPath)), repoPath).toBe(false)
  })

  it("rejects unknown CLI arguments before any publication", async () => {
    await expect(
      executeV138Plan262108Cli(["--unknown"], {
        repoRoot,
        writeOutput: () => undefined,
      }),
    ).rejects.toThrow("V138_PLAN_262_108_ARGUMENTS_INVALID")
  })

  it("fails closed when the canonical review trio is not yet published", () => {
    if (existsSync(path.join(repoRoot, V138_PLAN_262_108_PATHS.payload))) return
    expect(() => checkV138Plan262108PublishedReview(repoRoot)).toThrow()
  })
})
