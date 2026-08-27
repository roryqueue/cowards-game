import { execFileSync, spawnSync } from "node:child_process"
import { existsSync, readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

const loadReviewer = async () => {
  try {
    return await import(
      "./check-v1-38-plan-262-77-bounded-retry-source-review.js"
    )
  } catch {
    throw new Error("[RED:PLAN_262_77_BOUNDED_RETRY_SOURCE_REVIEW]")
  }
}

const cloneValue = <T>(value: T): T =>
  JSON.parse(JSON.stringify(value)) as T

describe("Plan 262-77 bounded-retry source review", () => {
  it("derives exact committed custody and an honest non-authorizing blocked disposition", async () => {
    const reviewer = await loadReviewer()
    const before = reviewer.snapshotV138Plan26277ForbiddenDestinations(
      process.cwd(),
    )
    const review = reviewer.deriveV138Plan26277NoPublish(process.cwd())
    const after = reviewer.snapshotV138Plan26277ForbiddenDestinations(
      process.cwd(),
    )

    expect(review.schemaVersion).toBe(
      "v1.38-plan-262-77-bounded-retry-source-review-v1",
    )
    expect(review.reviewedSource.commit).toBe(
      "93ebaac43c13cf6e658769a11e9c2c10f5b35965",
    )
    expect(review.reviewedSource.tree).toBe(
      "1d8ece1a9caf390aa36dd21c6bd0c835d20bda4c",
    )
    expect(review.reviewedSource.parent).toBe(
      "b2a7acb050683da4735911fc7e3b52f0d3f75638",
    )
    expect(review.reviewedSource.paths).toEqual(
      reviewer.V138_PLAN_262_77_SOURCE_PATHS,
    )
    expect(review.reviewedSource.blobs).toHaveLength(3)
    expect(review.observations.every((item: { passed: boolean }) => item.passed))
      .toBe(true)
    expect(review.findings.map((item: { code: string }) => item.code)).toEqual([
      "TIME_WINDOW_EXPIRY_NOT_TERMINALIZED",
    ])
    expect(review.findingCount).toBe(1)
    expect(review.sourceReviewPassed).toBe(false)
    expect(review.status).toBe("blocked")
    expect(review.authority).toEqual({
      plan26278Eligible: false,
      authorizationCreated: false,
      sealCreated: false,
      envelopeCreated: false,
      liveInvoked: false,
      freshCharged: 0,
      freshAccepted: 0,
      admit03Status: "blocked",
      phase263Authorized: false,
      candidateSearchAuthorized: false,
      formationMaterializationAuthorized: false,
      holdoutOpeningAuthorized: false,
      publicAuthorized: false,
      productAuthorized: false,
      productionAuthorized: false,
      gameplayChangeAuthorized: false,
    })
    expect(review.identityClaims).toEqual({
      independentPersonClaimed: false,
      externalIdentityClaimed: false,
      cryptographicReviewerIdentityClaimed: false,
      independentCustodyClaimed: false,
      separatePermissioningClaimed: false,
      maliciousOperatorResistanceClaimed: false,
    })
    expect(after).toEqual(before)
  }, 180_000)

  it("independently exercises all frozen bounds and crash/restart boundaries in an owner-only detached clone", async () => {
    const reviewer = await loadReviewer()
    const review = reviewer.deriveV138Plan26277NoPublish(process.cwd())
    const ids = review.observations.map((item: { id: string }) => item.id)
    for (const id of [
      "git-source-custody",
      "detached-owner-only-clone",
      "three-route-starts",
      "twelve-preflight-observations",
      "four-hour-window",
      "five-minute-refusal-spacing",
      "fifteen-minute-system-failure-backoff",
      "inclusive-2500-basis-point-threshold",
      "eight-attempt-four-shard-calibration",
      "single-540-cell-reproduction",
      "first-success-closure",
      "reservation-crash-reconciliation",
      "concurrent-owner-rejection",
      "canonical-runtime-kernel",
      "privacy-and-authority-denial",
      "protected-history-and-formation-absence",
      "canonical-destinations-untouched",
    ]) {
      expect(ids, id).toContain(id)
    }
    expect(new Set(ids).size).toBe(ids.length)
    expect(review.detachedExercise.ownerMode).toBe("0700")
    expect(review.detachedExercise.cleanupComplete).toBe(true)
    expect(existsSync(review.detachedExercise.ownerPath)).toBe(false)
    expect(review.detachedExercise.liveInvoked).toBe(false)
  }, 180_000)

  it("turns every protected mutation class into a named finding", async () => {
    const reviewer = await loadReviewer()
    const model = readFileSync(
      "scripts/lib/v1-38-bounded-retry-envelope.ts",
      "utf8",
    )
    const controller = readFileSync(
      "scripts/run-v1-38-bounded-retry-envelope.ts",
      "utf8",
    )
    const mutations: Array<[string, string, string]> = [
      ["MAX_ROUTE_STARTS_MUTATED", model, model.replace("maximumRouteStarts: 3", "maximumRouteStarts: 4")],
      ["MAX_PREFLIGHT_OBSERVATIONS_MUTATED", model, model.replace("maximumPreflightObservations: 12", "maximumPreflightObservations: 13")],
      ["ENVELOPE_LIFETIME_MUTATED", model, model.replace("4 * 60 * 60 * 1_000", "5 * 60 * 60 * 1_000")],
      ["REFUSAL_SPACING_MUTATED", model, model.replace("5 * 60 * 1_000", "4 * 60 * 1_000")],
      ["CALIBRATION_BACKOFF_MUTATED", model, model.replace("15 * 60 * 1_000", "14 * 60 * 1_000")],
      ["SAMPLING_CADENCE_MUTATED", model, model.replace("samplingMilliseconds: 200", "samplingMilliseconds: 201")],
      ["ADMISSION_THRESHOLD_MUTATED", model, model.replace("minimumEffectiveAvailableBasisPoints: 2_500", "minimumEffectiveAvailableBasisPoints: 2_499")],
      ["REPRODUCTION_CELL_COUNT_MUTATED", model, model.replace("reproductionCellCount: 540", "reproductionCellCount: 539")],
      ["RUNTIME_AUTHORITY_MUTATED", model, model.replace('rulesAuthority: "MATCH_KERNEL"', 'rulesAuthority: "COPIED_RULES"')],
      ["PRIVACY_BOUNDARY_MUTATED", controller, controller.replace("strategySourceIncluded: false", "strategySourceIncluded: true")],
      ["DOWNSTREAM_AUTHORITY_MUTATED", model, model.replace("candidateSearchAuthorized: false", "candidateSearchAuthorized: true")],
      ["RESERVATION_HANDLER_MUTATED", controller, controller.replace("appendDurableRecord(record)", "void record")],
      ["WAIT_HANDLER_MUTATED", controller, controller.replace("await input.effects.waitUntil(target)", "void target")],
      ["CALIBRATION_HANDLER_MUTATED", controller, controller.replace("calibrateV138ParallelMatrix({", "Promise.resolve({")],
      ["REPRODUCTION_HANDLER_MUTATED", controller, controller.replace("executeV138ParallelMatrix({", "Promise.resolve({")],
    ]
    for (const [code, original, mutated] of mutations) {
      expect(mutated, code).not.toBe(original)
      expect(
        reviewer.inspectV138Plan26277SourceMutation({
          model: code.includes("HANDLER") || code.includes("PRIVACY")
            ? model
            : mutated,
          controller: code.includes("HANDLER") || code.includes("PRIVACY")
            ? mutated
            : controller,
        }),
        code,
      ).toContain(code)
    }
  })

  it("rejects recomputed-root tampering and renders the blocked result without authority", async () => {
    const reviewer = await loadReviewer()
    const review = reviewer.deriveV138Plan26277NoPublish(process.cwd())
    const report = reviewer.renderV138Plan26277ReviewReport(review)
    expect(report).toContain("BLOCKED")
    expect(report).toContain("TIME_WINDOW_EXPIRY_NOT_TERMINALIZED")
    expect(report).toContain("Plan 262-78 is not eligible")
    expect(report).not.toContain("StrategyMemory")
    expect(
      reviewer.validateV138Plan26277ReviewPair(review, report, review),
    ).toBe(true)

    const mutations: Array<[string, (value: any) => void]> = [
      ["source blob", (value) => { value.reviewedSource.blobs[0].blob = "0".repeat(40) }],
      ["finding omission", (value) => { value.findings = []; value.findingCount = 0 }],
      ["observation omission", (value) => { value.observations.pop() }],
      ["eligibility", (value) => { value.authority.plan26278Eligible = true }],
      ["live claim", (value) => { value.authority.liveInvoked = true }],
      ["custody claim", (value) => { value.identityClaims.independentCustodyClaimed = true }],
    ]
    for (const [name, mutate] of mutations) {
      const candidate: any = cloneValue(review)
      mutate(candidate)
      candidate.reviewRoot = reviewer.computeV138Plan26277ReviewRoot(candidate)
      expect(
        () => reviewer.validateV138Plan26277Review(candidate, review),
        name,
      ).toThrow("V138_PLAN_262_77_REVIEW_MISMATCH")
    }
  }, 180_000)

  it("derive-no-publish is bounded and creates no canonical review pair", async () => {
    const reviewer = await loadReviewer()
    const before = [
      reviewer.V138_PLAN_262_77_REVIEW_PATH,
      reviewer.V138_PLAN_262_77_REPORT_PATH,
    ].map((item) => existsSync(item))
    const result = spawnSync(
      path.resolve("node_modules/.bin/tsx"),
      [
        "scripts/check-v1-38-plan-262-77-bounded-retry-source-review.ts",
        "--derive-no-publish",
      ],
      { cwd: process.cwd(), encoding: "utf8", timeout: 180_000 },
    )
    expect(result.status).toBe(0)
    expect(JSON.parse(result.stdout)).toMatchObject({
      status: "blocked",
      findingCount: 1,
      sourceReviewPassed: false,
      plan26278Eligible: false,
      authorizesExecution: false,
      liveInvoked: false,
    })
    const after = [
      reviewer.V138_PLAN_262_77_REVIEW_PATH,
      reviewer.V138_PLAN_262_77_REPORT_PATH,
    ].map((item) => existsSync(item))
    expect(after).toEqual(before)
  }, 180_000)

  it("the committed review pair checker accepts blocked evidence but no successor eligibility", async () => {
    const reviewer = await loadReviewer()
    if (
      !existsSync(reviewer.V138_PLAN_262_77_REVIEW_PATH) ||
      !existsSync(reviewer.V138_PLAN_262_77_REPORT_PATH)
    ) {
      return
    }
    const result = JSON.parse(
      execFileSync(
        path.resolve("node_modules/.bin/tsx"),
        [
          "scripts/check-v1-38-plan-262-77-bounded-retry-source-review.ts",
          "--check-review",
          "--review",
          reviewer.V138_PLAN_262_77_REVIEW_PATH,
          "--report",
          reviewer.V138_PLAN_262_77_REPORT_PATH,
        ],
        { cwd: process.cwd(), encoding: "utf8" },
      ),
    )
    expect(result).toMatchObject({
      status: "blocked_verified",
      findingCount: 1,
      sourceReviewPassed: false,
      plan26278Eligible: false,
      authorizesExecution: false,
    })
  }, 180_000)
})
