import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import {
  V138_PLAN_262_99_MUTATIONS,
  V138_PLAN_262_99_REPORT_PATH,
  V138_PLAN_262_99_REVIEW_PATH,
  V138_PLAN_262_99_SOURCE_PATHS,
  computeV138Plan26299PortableRoot,
  computeV138Plan26299ReviewRoot,
  deriveV138Plan26299ReviewNoPublish,
  evaluateV138Plan26299Observations,
  inspectV138Plan26299CorrectedSource,
  inspectV138Plan26299ProtectedHistory,
  inspectV138Plan26299Source,
  renderV138Plan26299Report,
  snapshotV138Plan26299Destinations,
  validateV138Plan26299Review,
} from "./check-v1-38-plan-262-99-bounded-retry-source-rereview-v4.js"

const repoRoot = path.resolve(import.meta.dirname, "..")
const sha = (value: string): `sha256:${string}` =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`
const sourceAtHead = () =>
  Object.fromEntries(
    V138_PLAN_262_99_SOURCE_PATHS.map((repoPath) => [
      repoPath,
      readFileSync(path.resolve(repoRoot, repoPath), "utf8"),
    ]),
  )

describe("Plan 262-99 independent source review", () => {
  it("owns only the fresh checker, review, report, and exact Plan-98 source pair", () => {
    expect(V138_PLAN_262_99_REVIEW_PATH).toBe(
      ".planning/artifacts/v1.38-plan-262-99-bounded-retry-source-rereview-v4.json",
    )
    expect(V138_PLAN_262_99_REPORT_PATH).toMatch(/262-99-REVIEW\.md$/u)
    expect(V138_PLAN_262_99_SOURCE_PATHS).toEqual([
      "scripts/run-v1-38-bounded-retry-envelope-v3.ts",
      "scripts/run-v1-38-bounded-retry-envelope-v3.test.ts",
    ])
  })

  it("authenticates the unique final Plan-98 commit and exact two blobs", () => {
    const source = inspectV138Plan26299CorrectedSource(repoRoot)
    expect(source).toMatchObject({
      commit: "702bfa5216e3b0e15b4816ce28c98dbcdee38517",
      tree: "4a4ea89f5392c250d32a39abde0bcf9b98aa079f",
      parent: "266c977a657c04c32a54b2293d01cf6fab1edf10",
      noLaterRewrite: true,
      summaryTrustedAsVerdict: false,
    })
    expect(source.files).toEqual([
      expect.objectContaining({
        path: V138_PLAN_262_99_SOURCE_PATHS[0],
        mode: "100644",
        blob: "d23450e0578969623e6063620688f0f10d75d744",
        byteLength: 75811,
        sha256:
          "sha256:ab5168c8ff252b912033c09655f83924c411e0c22d5319dbc5f741c9501c7bb5",
      }),
      expect.objectContaining({
        path: V138_PLAN_262_99_SOURCE_PATHS[1],
        mode: "100644",
        blob: "9e01cd52f76d04b04a87fa550077e595da2f65a4",
        byteLength: 40084,
        sha256:
          "sha256:dcb37c409d6178f597d64a8628ceb0005d26b3392b46c4acfd1b261b4bd2450e",
      }),
    ])
  })

  it("detects every declared Plan-98 source and test mutation", () => {
    const baseline = sourceAtHead()
    expect(inspectV138Plan26299Source(baseline)).toEqual([])
    expect(V138_PLAN_262_99_MUTATIONS.length).toBeGreaterThanOrEqual(28)
    for (const [code, repoPath, token, replacement] of
      V138_PLAN_262_99_MUTATIONS) {
      const mutated = structuredClone(baseline)
      expect(mutated[repoPath].split(token)).toHaveLength(2)
      mutated[repoPath] = mutated[repoPath].replace(token, replacement)
      expect(inspectV138Plan26299Source(mutated)).toContain(code)
    }
  })

  it("turns every missing or failed detached observation into a critical finding", () => {
    const all = [
      "git_isolation",
      "installed_runtime_closure",
      "executed_checkout_bytes",
      "portable_closure",
      "source_only",
      "destination_absence",
      "cleanup",
    ] as const
    const passed = all.map((id) => ({
      id,
      executed: true,
      passed: true,
      detailRoot: sha(id),
    }))
    expect(evaluateV138Plan26299Observations({ observations: passed })).toEqual(
      [],
    )
    for (const id of all) {
      expect(
        evaluateV138Plan26299Observations({
          observations: passed.filter((item) => item.id !== id),
        }).map((item) => item.code),
      ).toContain(`OBSERVATION_${id.toUpperCase()}_INCOMPLETE`)
      expect(
        evaluateV138Plan26299Observations({
          observations: passed.map((item) =>
            item.id === id ? { ...item, passed: false } : item,
          ),
        }).map((item) => item.code),
      ).toContain(`OBSERVATION_${id.toUpperCase()}_FAILED`)
    }
  })

  it("derives the portable domain without gitObjectRoot or root aliasing", () => {
    const body = {
      schemaVersion: "v1.38-reviewed-execution-closure-v2" as const,
      sourceCommit: "a".repeat(40),
      sourceTree: "b".repeat(40),
      sourceParent: "c".repeat(40),
      checkoutByteManifestRoot: sha("checkout"),
      installedClosureRoot: sha("installed"),
      gitExecutable: "/usr/bin/git" as const,
      gitExecutableSha256: sha("git"),
      gitIsolationRoot: sha("isolation"),
      nodeSha256: sha("node"),
      pnpmDistributionSha256: sha("pnpm"),
      nativeSourcesRoot: sha("native"),
      pathnameLaunchReplacementResistanceClaimed: false as const,
    }
    const root = computeV138Plan26299PortableRoot(body)
    expect(root).toMatch(/^sha256:[0-9a-f]{64}$/u)
    expect(root).not.toBe(body.installedClosureRoot)
    expect(Object.keys(body)).not.toContain("gitObjectRoot")
    expect(
      computeV138Plan26299PortableRoot({
        ...body,
        nodeSha256: sha("changed-node"),
      }),
    ).not.toBe(root)
  })

  it("preserves exact Plan-96/97 history and the failed Plan-92 zero-consumption stop", () => {
    const history = inspectV138Plan26299ProtectedHistory(repoRoot)
    expect(history).toMatchObject({
      historicalResultReinterpreted: false,
      plan96: {
        sourceCommit: "1c1f42b7fcd72d19ded89cca3ddd522090475b29",
      },
      plan97: {
        findingCount: 0,
        sourceReviewPassed: true,
        reviewRoot:
          "sha256:2765f8c028a7c0e089b401898d80f12fa425e993f13255423abb052f22adee90",
      },
    })
  })

  it("derives one deterministic zero-finding or blocked result without publication", () => {
    const before = snapshotV138Plan26299Destinations(repoRoot)
    const first = deriveV138Plan26299ReviewNoPublish(repoRoot)
    const second = deriveV138Plan26299ReviewNoPublish(repoRoot)
    expect(second).toEqual(first)
    expect(first.findingCount).toBe(0)
    expect(first.status).toBe("zero_findings")
    expect(first.sourceReviewPassed).toBe(true)
    expect(first.authority.plan26292Eligible).toBe(true)
    expect(first.failedAttempt).toEqual({
      plan: "262-92",
      stopCode: "V138_RETRY_V3_REVIEWED_EXECUTION_CLOSURE_INVALID",
      status: "integrity_stop",
      canonicalWrites: 0,
      freshCharged: 0,
      freshAccepted: 0,
      localSecretAccessed: false,
      identityConsumed: false,
    })
    expect(first.reviewedExecutionClosure).not.toHaveProperty("gitObjectRoot")
    expect(first.reviewedExecutionClosure.reviewedExecutionClosureRoot).not.toBe(
      first.reviewedExecutionClosure.installedClosureRoot,
    )
    expect(first.execution).not.toHaveProperty("executionClosureRoot")
    expect(first.execution).not.toHaveProperty("detachedExecutionClosureRoot")
    expect(first.execution).not.toHaveProperty("observations")
    expect(snapshotV138Plan26299Destinations(repoRoot)).toEqual(before)
  }, 180_000)

  it("makes every finding block Plan 92 and keeps all broader authority false", () => {
    const baseline = sourceAtHead()
    const [code, repoPath, token, replacement] = V138_PLAN_262_99_MUTATIONS[0]
    baseline[repoPath] = baseline[repoPath].replace(token, replacement)
    const blocked = deriveV138Plan26299ReviewNoPublish(repoRoot, {
      source: baseline,
    })
    expect(blocked.findings.map((item: { code: string }) => item.code)).toContain(
      code,
    )
    expect(blocked.status).toBe("blocked")
    expect(blocked.sourceReviewPassed).toBe(false)
    expect(blocked.authority.plan26292Eligible).toBe(false)
    for (const [key, value] of Object.entries(blocked.authority)) {
      if (["plan26292Eligible", "freshCharged", "freshAccepted"].includes(key))
        continue
      expect(value, key).toBe(false)
    }
  }, 180_000)

  it("validates canonical roots, exact history, eligibility, and deterministic Markdown", () => {
    const review = deriveV138Plan26299ReviewNoPublish(repoRoot)
    expect(review.reviewRoot).toBe(computeV138Plan26299ReviewRoot(review))
    expect(validateV138Plan26299Review(review, review)).toBe(true)
    expect(renderV138Plan26299Report(review)).toContain(
      review.reviewedExecutionClosure.reviewedExecutionClosureRoot,
    )
    for (const mutate of [
      (value: any) => (value.reviewedExecutionClosure.gitObjectRoot = sha("local")),
      (value: any) =>
        (value.reviewedExecutionClosure.reviewedExecutionClosureRoot =
          value.reviewedExecutionClosure.installedClosureRoot),
      (value: any) => (value.protectedHistory.historicalResultReinterpreted = true),
      (value: any) => (value.failedAttempt.freshCharged = 1),
      (value: any) => (value.authority.phase263PlanningAuthorized = true),
      (value: any) => (value.reviewRoot = sha("wrong")),
    ]) {
      const changed = structuredClone(review)
      mutate(changed)
      expect(() => validateV138Plan26299Review(changed, review)).toThrow()
    }
  }, 180_000)

  it("rejects non-canonical pair schema members even when self-consistent", () => {
    const review = deriveV138Plan26299ReviewNoPublish(repoRoot)
    for (const mutate of [
      (value: any) => (value.extra = false),
      (value: any) => (value.authority.extra = false),
      (value: any) => (value.identityClaims.extra = false),
      (value: any) => (value.correctedSource.extra = false),
      (value: any) => (value.protectedHistory.extra = false),
      (value: any) => (value.protectedHistory.plan96.extra = false),
      (value: any) => (value.protectedHistory.plan97.extra = false),
      (value: any) => (value.failedAttempt.extra = false),
      (value: any) => (value.execution.extra = false),
      (value: any) =>
        (value.reviewedExecutionClosure.extraPortableMember = sha("extra")),
    ]) {
      const changed = structuredClone(review)
      mutate(changed)
      changed.reviewRoot = computeV138Plan26299ReviewRoot(changed)
      expect(() => validateV138Plan26299Review(changed, changed)).toThrow(
        "V138_PLAN_262_99_REVIEW_MISMATCH",
      )
    }
  }, 180_000)
})
