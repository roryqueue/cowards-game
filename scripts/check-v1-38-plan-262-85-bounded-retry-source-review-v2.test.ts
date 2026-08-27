import { execFileSync } from "node:child_process"
import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const loadReviewer = async () =>
  import("./check-v1-38-plan-262-85-bounded-retry-source-review-v2.js")

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

describe("Plan 262-85 bounded-retry v2 source review", () => {
  it("derives exact Git custody and a zero-finding non-authorizing review", async () => {
    const reviewer = await loadReviewer()
    const before = reviewer.snapshotV138Plan26285Destinations(process.cwd())
    const review = reviewer.deriveV138Plan26285NoPublish(process.cwd())

    expect(reviewer.snapshotV138Plan26285Destinations(process.cwd())).toEqual(
      before,
    )
    expect(review).toMatchObject({
      status: "zero_findings",
      findingCount: 0,
      sourceReviewPassed: true,
      reviewedSource: {
        commit: "7a829707900d646c943535a82fbc718de93aec95",
        tree: "a9d8b45a3d0d37d07b56d03de3c115ba83220c4d",
        parent: "92b14663c625a29268ac31e8de3ce982d06cc31b",
      },
      decisionJoin: {
        sourceBaseCommit: "9e7087b34f0bd6fa12d8b265f09d4c656eb044b0",
        authorizationCommit: "453a33a10c247fb9c75e969ed4ab63646b16b488",
        authorizationSoleParent:
          "9e7087b34f0bd6fa12d8b265f09d4c656eb044b0",
      },
      detachedExercise: {
        ownerMode: "0700",
        focusedTestsPassed: 81,
        sourceOnlyPassed: true,
        canonicalWrites: 0,
        liveInvoked: false,
      },
      authority: {
        plan26286Eligible: true,
        authorizesExecution: false,
        sealCreated: false,
        envelopeCreated: false,
        liveInvoked: false,
        freshCharged: 0,
        freshAccepted: 0,
        phase263Authorized: false,
        productionAuthorized: false,
        gameplayChangeAuthorized: false,
      },
    })
    expect(review.observations.every((item) => item.passed)).toBe(true)
    expect(Object.values(review.identityClaims).every((value) => !value)).toBe(
      true,
    )
  }, 180_000)

  it("turns every incomplete observation into a critical finding", async () => {
    const reviewer = await loadReviewer()
    const evaluated = reviewer.evaluateV138Plan26285Observations([
      {
        id: "git-custody",
        executed: true,
        passed: true,
        detail: { exact: true },
      },
      {
        id: "detached-fake-effect-proof",
        executed: true,
        passed: false,
        detail: { tests: 80 },
      },
    ])
    expect(evaluated.findings.map((item) => item.code)).toEqual(
      expect.arrayContaining([
        "OBSERVATION_DETACHED_FAKE_EFFECT_PROOF_FAILED",
        "OBSERVATION_DECISION_JOIN_INCOMPLETE",
        "OBSERVATION_CANONICAL_ABSENCE_INCOMPLETE",
      ]),
    )
  })

  it("names every frozen-bound and authority mutation family", async () => {
    const reviewer = await loadReviewer()
    const source = {
      model: readFileSync(reviewer.V138_PLAN_262_85_SOURCE_PATHS[0], "utf8"),
      controller: readFileSync(
        reviewer.V138_PLAN_262_85_SOURCE_PATHS[1],
        "utf8",
      ),
      tests: readFileSync(reviewer.V138_PLAN_262_85_SOURCE_PATHS[2], "utf8"),
    }
    expect(reviewer.inspectV138Plan26285Source(source)).toEqual([])
    for (const [code, file, token, replacement] of reviewer.V138_PLAN_262_85_MUTATIONS) {
      const mutated = { ...source, [file]: source[file].replace(token, replacement) }
      expect(mutated[file], `${code} fixture`).not.toBe(source[file])
      expect(reviewer.inspectV138Plan26285Source(mutated), code).toContain(code)
    }
  })

  it("rejects eligibility, identity, history, and authority tampering", async () => {
    const reviewer = await loadReviewer()
    const review = reviewer.deriveV138Plan26285NoPublish(process.cwd())
    expect(reviewer.validateV138Plan26285Review(review, review)).toBe(true)
    for (const mutate of [
      (value: any) => {
        value.authority.authorizesExecution = true
      },
      (value: any) => {
        value.authority.plan26286Eligible = false
      },
      (value: any) => {
        value.identityClaims.independentCustodyClaimed = true
      },
      (value: any) => {
        value.protectedHistory.correctionRoot = `sha256:${"0".repeat(64)}`
      },
      (value: any) => {
        value.findingCount = 1
      },
    ]) {
      const candidate = clone(review)
      mutate(candidate)
      candidate.reviewRoot = reviewer.computeV138Plan26285ReviewRoot(candidate)
      expect(() =>
        reviewer.validateV138Plan26285Review(candidate, review),
      ).toThrow("V138_PLAN_262_85_REVIEW_MISMATCH")
    }
  }, 180_000)

  it("derive-no-publish creates no canonical review or downstream evidence", async () => {
    const reviewer = await loadReviewer()
    const before = reviewer.snapshotV138Plan26285Destinations(process.cwd())
    const output = JSON.parse(
      execFileSync(
        "pnpm",
        [
          "exec",
          "tsx",
          reviewer.V138_PLAN_262_85_CHECKER_PATH,
          "--derive-no-publish",
        ],
        { encoding: "utf8", timeout: 180_000 },
      ),
    )
    expect(output).toMatchObject({
      status: "zero_findings",
      findingCount: 0,
      plan26286Eligible: true,
      authorizesExecution: false,
      liveInvoked: false,
    })
    expect(reviewer.snapshotV138Plan26285Destinations(process.cwd())).toEqual(
      before,
    )
  }, 180_000)
})
