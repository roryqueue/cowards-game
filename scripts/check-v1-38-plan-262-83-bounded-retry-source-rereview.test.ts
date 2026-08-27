import { execFileSync } from "node:child_process"
import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const loadReviewer = async () =>
  import("./check-v1-38-plan-262-83-bounded-retry-source-rereview.js")

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

describe("Plan 262-83 independent bounded-retry source re-review", () => {
  it("re-reviews exact historical bytes and exposes the previously missed semantic findings", async () => {
    const reviewer = await loadReviewer()
    const before = reviewer.snapshotV138Plan26283ProtectedDestinations(
      process.cwd(),
    )
    const review = reviewer.deriveV138Plan26283NoPublish(process.cwd())
    const after = reviewer.snapshotV138Plan26283ProtectedDestinations(
      process.cwd(),
    )

    expect(after).toEqual(before)
    expect(review.status).toBe("blocked")
    expect(review.findingCount).toBeGreaterThan(3)
    expect(review.sourceReviewPassed).toBe(false)
    expect(review.findings.map((item: { code: string }) => item.code)).toEqual(
      expect.arrayContaining([
        "CLEANUP_TRUTH_NOT_DERIVED",
        "POST_RUN_CLI_MODES_MISSING",
        "SUCCESS_PUBLICATION_NOT_CRASH_RECOVERABLE",
        "BEHAVIOR_PENDING_CLEANUP_TERMINALIZATION_FAILED",
        "BEHAVIOR_OWNER_LEASE_RECOVERY_INCOMPLETE",
        "BEHAVIOR_JOURNAL_RECEIPT_RECOVERY_INCOMPLETE",
      ]),
    )
    expect(review.observations).toHaveLength(19)
    expect(
      review.observations.every(
        (item: { executed: boolean; passed: boolean }) =>
          typeof item.executed === "boolean" &&
          typeof item.passed === "boolean",
      ),
    ).toBe(true)
    expect(review.reviewedSource).toMatchObject({
      commit: "e844279f62192c41175fb3e7a08910493c6f24ab",
      tree: "360a10e6767cd3e9c899b0b07ea54a5bf7faac65",
      parent: "3727f73f09c6ec33f48d3072b3569d562d71c20d",
      plan82SummaryCommit: "167a920753c3e77c7f5cb3e4b2cc96fb50282706",
    })
    expect(review.detachedExercise).toMatchObject({
      ownerMode: "0700",
      cleanupComplete: true,
      canonicalWrites: 0,
      liveInvoked: false,
      expiry: {
        exactDisposition: "exhausted",
        postDisposition: "exhausted",
        terminalReason: "time_window_expired",
        terminalCount: 1,
        workAfterDeadline: 0,
        duplicateAfterRestart: 0,
      },
      noIdentityReuse: true,
      staleConcurrentOwnerRejected: true,
    })
    expect(review.protectedHistory).toMatchObject({
      reviewRoot:
        "sha256:1d58e184fd6283e3d62c7de0c4dc51cad4f8e5447bb70b2fa48d13588aade8f3",
      finding: "TIME_WINDOW_EXPIRY_NOT_TERMINALIZED",
      status: "blocked",
      findingCount: 1,
      reviewedPlan76Only: true,
    })
    expect(review.authority).toMatchObject({
      plan26278Eligible: false,
      authorizationCreated: false,
      liveInvoked: false,
      freshCharged: 0,
      freshAccepted: 0,
      admit03Status: "blocked",
      phase263Authorized: false,
      productionAuthorized: false,
      gameplayChangeAuthorized: false,
    })
  }, 15_000)

  it("derives each semantic observation from its own execution and flags incomplete work", async () => {
    const reviewer = await loadReviewer()
    const complete = reviewer.evaluateV138Plan26283BehavioralObservations([
      {
        id: "pending-cleanup-terminalization",
        executed: true,
        passed: false,
        detail: { observed: "clean" },
      },
      {
        id: "cleanup-root-binding",
        executed: true,
        passed: true,
        detail: { rootChanged: true },
      },
    ])
    expect(
      complete.observations.find(
        (item: { id: string }) => item.id === "pending-cleanup-terminalization",
      ),
    ).toMatchObject({ executed: true, passed: false })
    expect(
      complete.observations.find(
        (item: { id: string }) => item.id === "cleanup-root-binding",
      ),
    ).toMatchObject({ executed: true, passed: true })
    expect(
      complete.findings.map((item: { code: string }) => item.code),
    ).toEqual(
      expect.arrayContaining([
        "BEHAVIOR_PENDING_CLEANUP_TERMINALIZATION_FAILED",
        "BEHAVIOR_OWNER_LEASE_RECOVERY_INCOMPLETE",
        "BEHAVIOR_PLAN80_CORRECTION_JOIN_INCOMPLETE",
      ]),
    )
  })

  it("turns every correction and inherited-bound mutation family into a named finding", async () => {
    const reviewer = await loadReviewer()
    const model = readFileSync(
      reviewer.V138_PLAN_262_83_SOURCE_PATHS[0],
      "utf8",
    )
    const controller = readFileSync(
      reviewer.V138_PLAN_262_83_SOURCE_PATHS[1],
      "utf8",
    )
    const tests = readFileSync(
      reviewer.V138_PLAN_262_83_SOURCE_PATHS[2],
      "utf8",
    )
    const cases: Array<[string, string, string]> = [
      [
        "EXPIRY_TERMINAL_REMOVED",
        'kind: "time_window_expired"',
        'kind: "expiry_removed"',
      ],
      [
        "EXPIRY_COMPARISON_NOT_INCLUSIVE",
        "now <\n      state.firstObservationMilliseconds",
        "now <=\n      state.firstObservationMilliseconds",
      ],
      [
        "EXPIRY_NOT_DURABLE_BEFORE_RETURN",
        "input.effects.appendDurableRecord(record)\n    records = next",
        "records = next\n    input.effects.appendDurableRecord(record)",
      ],
      [
        "DUPLICATE_EXPIRY_TERMINAL_ALLOWED",
        'if (terminalDisposition(state) !== "active")',
        "if (false)",
      ],
      [
        "REUSABLE_CAPACITY_AFTER_EXPIRY",
        'if (state.timeWindowExpiryTerminal !== null) return "exhausted"',
        'if (state.timeWindowExpiryTerminal !== null) return "active"',
      ],
      [
        "JOURNAL_ROOT_CHAIN_WEAKENED",
        "record.previousRoot !== previousRoot",
        "false",
      ],
      [
        "MAX_ROUTE_STARTS_CHANGED",
        "maximumRouteStarts: 3 as const",
        "maximumRouteStarts: 4 as const",
      ],
      [
        "MAX_PREFLIGHTS_CHANGED",
        "maximumPreflightObservations: 12 as const",
        "maximumPreflightObservations: 13 as const",
      ],
      [
        "FOUR_HOUR_WINDOW_CHANGED",
        "envelopeLifetimeMilliseconds: 4 * 60 * 60 * 1_000",
        "envelopeLifetimeMilliseconds: 5 * 60 * 60 * 1_000",
      ],
      [
        "REFUSAL_SPACING_CHANGED",
        "refusalSpacingMilliseconds: 5 * 60 * 1_000",
        "refusalSpacingMilliseconds: 4 * 60 * 1_000",
      ],
      [
        "FAILURE_BACKOFF_CHANGED",
        "calibrationFailureBackoffMilliseconds: 15 * 60 * 1_000",
        "calibrationFailureBackoffMilliseconds: 10 * 60 * 1_000",
      ],
      [
        "CALIBRATION_BOUND_CHANGED",
        "calibrationAttemptsPerRoute: 8 as const",
        "calibrationAttemptsPerRoute: 9 as const",
      ],
      [
        "SHARD_BOUND_CHANGED",
        "calibrationShardCount: 4 as const",
        "calibrationShardCount: 5 as const",
      ],
      [
        "SAMPLING_BOUND_CHANGED",
        "samplingMilliseconds: 200 as const",
        "samplingMilliseconds: 201 as const",
      ],
      [
        "THRESHOLD_CHANGED",
        "minimumEffectiveAvailableBasisPoints: 2_500 as const",
        "minimumEffectiveAvailableBasisPoints: 2_501 as const",
      ],
      [
        "REPRODUCTION_BOUND_CHANGED",
        "reproductionCellCount: 540 as const",
        "reproductionCellCount: 539 as const",
      ],
      ["FIRST_SUCCESS_CLOSURE_WEAKENED", '? "succeeded"', '? "active"'],
      [
        "RUNTIME_KERNEL_DELEGATION_WEAKENED",
        'rulesAuthority: "MATCH_KERNEL" as const',
        'rulesAuthority: "COPIED_RULES" as const',
      ],
      [
        "PRIVACY_BOUNDARY_WEAKENED",
        "strategySourceIncluded: false as const",
        "strategySourceIncluded: true as const",
      ],
      [
        "LIVE_HANDLER_REACHABLE",
        '"--run-bounded-live-envelope"',
        '"--run-live-unreviewed"',
      ],
      [
        "EXPIRY_CRASH_RESTART_PROOF_REMOVED",
        'it("recovers expiry append crashes',
        'it.skip("recovers expiry append crashes',
      ],
    ]
    const source = { model, controller, tests }
    expect(reviewer.inspectV138Plan26283SourceMutation(source)).toEqual([])
    for (const [code, original, replacement] of cases) {
      const mutated = { ...source }
      const key = (Object.keys(mutated) as Array<keyof typeof mutated>).find(
        (item) => mutated[item].includes(original),
      )
      expect(key, `${code} fixture`).toBeDefined()
      mutated[key!] = mutated[key!].replace(original, replacement)
      expect(
        reviewer.inspectV138Plan26283SourceMutation(mutated),
        code,
      ).toContain(code)
    }
  })

  it("validates canonical review semantics and rejects authority/history tampering", async () => {
    const reviewer = await loadReviewer()
    const review = reviewer.deriveV138Plan26283NoPublish(process.cwd())
    expect(reviewer.validateV138Plan26283Review(review, review)).toBe(true)
    for (const mutate of [
      (value: any) => {
        value.authority.productionAuthorized = true
      },
      (value: any) => {
        value.authority.plan26278Eligible = true
      },
      (value: any) => {
        value.protectedHistory.finding = "NONE"
      },
      (value: any) => {
        value.findingCount = 1
      },
    ]) {
      const candidate = clone(review)
      mutate(candidate)
      candidate.reviewRoot = reviewer.computeV138Plan26283ReviewRoot(candidate)
      expect(() =>
        reviewer.validateV138Plan26283Review(candidate, review),
      ).toThrow("V138_PLAN_262_83_REVIEW_MISMATCH")
    }
  }, 15_000)

  it("derive-no-publish is bounded and creates no review pair", async () => {
    const reviewer = await loadReviewer()
    const before = reviewer.snapshotV138Plan26283ProtectedDestinations(
      process.cwd(),
    )
    const output = JSON.parse(
      execFileSync(
        "pnpm",
        [
          "exec",
          "tsx",
          reviewer.V138_PLAN_262_83_CHECKER_PATH,
          "--derive-no-publish",
        ],
        { encoding: "utf8" },
      ),
    )
    expect(output).toMatchObject({
      status: "blocked",
      findingCount: 13,
      plan26278Eligible: false,
      authorizesExecution: false,
      liveInvoked: false,
    })
    expect(
      reviewer.snapshotV138Plan26283ProtectedDestinations(process.cwd()),
    ).toEqual(before)
  }, 15_000)

  it("authenticates the immutable historical review through the additive correction", async () => {
    const reviewer = await loadReviewer()
    const output = JSON.parse(
      execFileSync(
        "pnpm",
        [
          "exec",
          "tsx",
          reviewer.V138_PLAN_262_83_CHECKER_PATH,
          "--check-review",
          "--review",
          reviewer.V138_PLAN_262_83_REVIEW_PATH,
          "--report",
          reviewer.V138_PLAN_262_83_REPORT_PATH,
        ],
        { encoding: "utf8" },
      ),
    )
    expect(output).toMatchObject({
      status: "blocked",
      findingCount: 13,
      sourceReviewPassed: false,
      plan26278Eligible: false,
      authorizesExecution: false,
      liveInvoked: false,
    })
  }, 15_000)
})
