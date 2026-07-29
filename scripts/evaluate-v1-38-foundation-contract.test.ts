import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { beforeAll, describe, expect, it } from "vitest"
import { runV137AuditReproductionGate } from "./check-v1-37-audit-reproduction.js"
import {
  evaluateV138FoundationAdmission,
  renderV138FoundationAdmissionReceipt,
  resolveV138FoundationAdmissionInput,
  type V138FoundationAdmissionInput,
} from "./lib/v1-38-foundation-admission.js"
import {
  V138ParallelCalibrationPolicySchema,
  calibrateV138ParallelMatrix,
  deriveV138ParallelCalibrationPolicy,
  deriveV138HistoricalMatrixExpectation,
  enumerateV138CurrentMatrix,
  evaluateV138HistoricalMatrixPredicate,
  executeV138ParallelMatrix,
  isV138ParallelProjectedTotalAdmitted,
  loadV138HistoricalMatrixExpectation,
  planV138MatrixShards,
  projectV138ParallelMatrix,
  reduceV138ParallelMatrixAccounting,
  reduceV138CurrentMatrix,
  renderV138CurrentMatrixReceipt,
  reproduceV138CurrentMatrix,
  validateV138HistoricalMatrixExpectation,
  type V138CurrentMatrixAttempt,
  type V138CurrentMatrixAttemptOutcome,
  type V138HistoricalMatrixObservedAggregate,
  type V138ParallelShardRunner,
} from "./lib/v1-38-current-matrix-reproduction.js"

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
)

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const mutate = (
  input: V138FoundationAdmissionInput,
  change: (draft: Record<string, unknown>) => void,
): unknown => {
  const draft = clone(input) as unknown as Record<string, unknown>
  change(draft)
  return draft
}

const nested = (
  draft: Record<string, unknown>,
  key: string,
): Record<string, unknown> => draft[key] as Record<string, unknown>

describe("v1.38 foundation admission", () => {
  let exactInput: V138FoundationAdmissionInput

  beforeAll(() => {
    exactInput = resolveV138FoundationAdmissionInput(repoRoot)
  }, 60_000)

  it("admission accepts only the resolved immutable v1.37 authority", () => {
    const result = evaluateV138FoundationAdmission(exactInput)

    expect(result).toMatchObject({
      schemaVersion: "v1.38-foundation-admission-v1",
      status: "passed_exact",
      archiveCommit: "e704590df599b49d84745b0e828d5ab0f1d335ad",
      annotatedTagObject: "44d7bb03c175ec3ee2557193c6b190aa44001244",
      semanticAuthorityKey: "runtime-v1.19",
      semanticTupleId:
        "sha256:37c9a07425d454c74859112debcc3ef362d43e80d5767560d9bde28a3c8d5e73",
      postTagProof08: true,
      laterCorrectionChangesGameplay: false,
      auditReproductionRoot: expect.stringMatching(/^sha256:[0-9a-f]{64}$/u),
      runtimeAuthorityRoot: expect.stringMatching(/^sha256:[0-9a-f]{64}$/u),
      sourceBindingsRoot: expect.stringMatching(/^sha256:[0-9a-f]{64}$/u),
      correctionLineageRoot: expect.stringMatching(/^sha256:[0-9a-f]{64}$/u),
      admissionRoot: expect.stringMatching(/^sha256:[0-9a-f]{64}$/u),
    })
    expect(Object.isFrozen(result)).toBe(true)
    expect(JSON.stringify(result)).not.toMatch(
      /Users|StrategyMemory|SoldierMemory|objective|DATABASE_URL|stack|diagnostic/iu,
    )
  })

  it("admission is deterministic and renders a byte-stable public receipt", () => {
    const first = evaluateV138FoundationAdmission(exactInput)
    const second = evaluateV138FoundationAdmission(clone(exactInput))

    expect(second).toEqual(first)
    expect(renderV138FoundationAdmissionReceipt(first)).toBe(
      renderV138FoundationAdmissionReceipt(second),
    )
    expect(renderV138FoundationAdmissionReceipt(first)).toMatch(/\n$/u)
  })

  it("admission audit reproduction does not depend on the tsx CLI IPC server", () => {
    const originalPath = process.env.PATH
    try {
      process.env.PATH = "/v1.38-admission-no-cli-path"
      expect(runV137AuditReproductionGate(repoRoot)).toMatchObject({
        schemaVersion: "v1.37-audit-reproduction-receipt-v1",
        status: "passed-exact",
        hashes: {
          joinSha256: expect.stringMatching(/^sha256:[0-9a-f]{64}$/u),
        },
      })
    } finally {
      process.env.PATH = originalPath
    }
  })

  it("admission stops for missing or extra-keyed authority inputs", () => {
    const { release: _release, ...missing } = exactInput
    const stoppedMissing = evaluateV138FoundationAdmission(missing)
    const stoppedExtra = evaluateV138FoundationAdmission({
      ...exactInput,
      override: true,
    })

    expect(stoppedMissing).toMatchObject({
      status: "stopped_integrity_foundation",
      reason: "INPUT_SCHEMA_INVALID",
    })
    expect(stoppedExtra).toMatchObject({
      status: "stopped_integrity_foundation",
      reason: "INPUT_SCHEMA_INVALID",
    })
  })

  it.each([
    [
      "audit reproduction drift",
      "AUDIT_REPRODUCTION_DRIFT",
      (draft: Record<string, unknown>) => {
        nested(draft, "audit").joinSha256 = `sha256:${"0".repeat(64)}`
      },
    ],
    [
      "archive mismatch",
      "ARCHIVE_MISMATCH",
      (draft: Record<string, unknown>) => {
        nested(draft, "release").archiveCommit = "0".repeat(40)
      },
    ],
    [
      "stale annotated tag",
      "TAG_OBJECT_MISMATCH",
      (draft: Record<string, unknown>) => {
        nested(draft, "release").tagObject = "0".repeat(40)
      },
    ],
    [
      "stale release-readiness evidence",
      "RELEASE_READINESS_DRIFT",
      (draft: Record<string, unknown>) => {
        nested(draft, "release").releaseReadinessSha256 =
          `sha256:${"0".repeat(64)}`
      },
    ],
    [
      "non-annotated tag",
      "TAG_NOT_ANNOTATED",
      (draft: Record<string, unknown>) => {
        nested(draft, "release").tagObjectType = "commit"
      },
    ],
    [
      "missing post-tag result",
      "POST_TAG_CHECK_FAILED",
      (draft: Record<string, unknown>) => {
        nested(nested(draft, "release"), "postTag").proof08 = false
      },
    ],
    [
      "semantic tuple drift",
      "SEMANTIC_TUPLE_DRIFT",
      (draft: Record<string, unknown>) => {
        nested(draft, "semanticAuthority").tupleId = `sha256:${"0".repeat(64)}`
      },
    ],
    [
      "runtime authority drift",
      "RUNTIME_AUTHORITY_STALE",
      (draft: Record<string, unknown>) => {
        nested(draft, "runtimeAuthority").runtimeServiceVersion =
          "runtime-execution-service-v0"
      },
    ],
    [
      "source binding drift",
      "SOURCE_BINDING_DRIFT",
      (draft: Record<string, unknown>) => {
        const bindings = nested(draft, "sources").bindings as Array<
          Record<string, unknown>
        >
        bindings[0]!.sha256 = `sha256:${"0".repeat(64)}`
      },
    ],
    [
      "unexplained correction lineage",
      "CORRECTION_LINEAGE_UNEXPLAINED",
      (draft: Record<string, unknown>) => {
        nested(draft, "correctionLineage").implementationCommit = "0".repeat(40)
      },
    ],
  ] as const)("admission stops for %s", (_label, reason, applyMutation) => {
    const result = evaluateV138FoundationAdmission(
      mutate(exactInput, applyMutation),
    )

    expect(result).toMatchObject({
      status: "stopped_integrity_foundation",
      reason,
    })
  })

  it("admission rejects copied labels, boolean gates, and nested override keys", () => {
    const copiedTuple = {
      semanticAuthorityKey: "runtime-v1.19",
      tupleId:
        "sha256:37c9a07425d454c74859112debcc3ef362d43e80d5767560d9bde28a3c8d5e73",
    }
    const mutations = [
      mutate(exactInput, (draft) => {
        draft.semanticAuthority = copiedTuple
      }),
      mutate(exactInput, (draft) => {
        draft.semanticAuthority = true
      }),
      mutate(exactInput, (draft) => {
        nested(draft, "release").waiver = "approved"
      }),
      mutate(exactInput, (draft) => {
        nested(draft, "correctionLineage").repair = true
      }),
    ]

    for (const mutation of mutations) {
      expect(evaluateV138FoundationAdmission(mutation)).toMatchObject({
        status: "stopped_integrity_foundation",
        reason: "INPUT_SCHEMA_INVALID",
      })
    }
  })

  it("admission rejects inputs beyond the canonical bounded envelope", () => {
    expect(
      evaluateV138FoundationAdmission({
        ...exactInput,
        oversized: "x".repeat(600 * 1024),
      }),
    ).toMatchObject({
      status: "stopped_integrity_foundation",
      reason: "INPUT_BOUNDS_INVALID",
    })
  })

  it("admission stopped results expose no waiver, repair, tag mutation, or root", () => {
    const stopped = evaluateV138FoundationAdmission(
      mutate(exactInput, (draft) => {
        nested(nested(draft, "release"), "postTag").findings = [
          { code: "TAG_TARGET_NOT_EXPECTED_ARCHIVE" },
        ]
      }),
    )
    const serialized = JSON.stringify(stopped)

    expect(stopped).toEqual({
      schemaVersion: "v1.38-foundation-admission-v1",
      status: "stopped_integrity_foundation",
      reason: "POST_TAG_CHECK_FAILED",
      repairAuthorized: false,
      inputDigest: expect.stringMatching(/^sha256:[0-9a-f]{64}$/u),
    })
    expect(serialized).not.toMatch(
      /waiver|override|acceptAnyway|repairCallback|moveTag|admissionRoot|authoritativeRoot/iu,
    )
  })
})

describe("v1.38 current matrix reproduction", () => {
  let attempts: readonly V138CurrentMatrixAttempt[]

  beforeAll(() => {
    attempts = enumerateV138CurrentMatrix(repoRoot).attempts
  })

  it("matrix freezes the exact historical inventory without collapsing duplicate geometry", () => {
    const inventory = enumerateV138CurrentMatrix(repoRoot)
    const unorderedPairs = new Set(
      attempts.map(
        ({ leftDefinitionId, rightDefinitionId }) =>
          `${leftDefinitionId}\0${rightDefinitionId}`,
      ),
    )

    expect(inventory.schemaVersion).toBe("v1.38-current-matrix-inventory-v1")
    expect(inventory.fixturePurpose).toBe("regression_throughput_only")
    expect(inventory.definitions).toHaveLength(10)
    expect(unorderedPairs).toHaveLength(45)
    expect(
      inventory.arenas.map(({ historicalLabel }) => historicalLabel),
    ).toEqual(["Smoke", "Standard Cross", "Open Field"])
    expect(inventory.arenas).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          historicalLabel: "Smoke",
          duplicateGeometryGroup: "empty-v1",
        }),
        expect.objectContaining({
          historicalLabel: "Open Field",
          duplicateGeometryGroup: "empty-v1",
        }),
      ]),
    )
    expect(
      new Set(
        inventory.arenas.map(
          ({ semanticGeometryHash }) => semanticGeometryHash,
        ),
      ),
    ).toHaveLength(2)
    expect(new Set(attempts.map(({ seedLabel }) => seedLabel))).toEqual(
      new Set(["meta-even", "meta-odd"]),
    )
    expect(new Set(attempts.map(({ mirrored }) => mirrored))).toEqual(
      new Set([false, true]),
    )
    expect(attempts).toHaveLength(540)
    expect(new Set(attempts.map(({ attemptId }) => attemptId))).toHaveLength(
      540,
    )
    expect(Object.isFrozen(inventory)).toBe(true)
  })

  it("matrix builds immutable Advanced requests with explicit entrant initiative and selected authority", () => {
    for (const attempt of attempts) {
      expect(attempt.fixturePurpose).toBe("regression_throughput_only")
      expect(attempt.initialInitiativeEntrantId).toBe(
        attempt.seedLabel === "meta-even"
          ? attempt.bottomEntrantId
          : attempt.topEntrantId,
      )
      expect(attempt.request).toMatchObject({
        contractVersion: "runtime-execution-service-v1.18",
        kind: "executeMatch",
        semanticTuple: {
          tupleId:
            "sha256:37c9a07425d454c74859112debcc3ef362d43e80d5767560d9bde28a3c8d5e73",
          components: {
            engine: "engine-kernel-v1.37-candidate-1",
            runtimeAbi: "strategy-runtime-abi-v1.19",
          },
        },
        match: {
          match: {
            initialInitiativePlayerId: attempt.initialInitiativePlayerId,
            candidateMatch: {
              semanticAuthorityKey: "runtime-v1.19",
              initialInitiativeEntrantKey: attempt.initialInitiativeEntrantId,
            },
          },
          strategies: {
            bottom: {
              metadata: {
                tags: expect.arrayContaining(["regression_throughput_only"]),
              },
            },
            top: {
              metadata: {
                tags: expect.arrayContaining(["regression_throughput_only"]),
              },
            },
          },
        },
      })
      expect(Object.isFrozen(attempt)).toBe(true)
    }
  })

  it("matrix source contains no historical loader or alternate transition authority", () => {
    const source = readFileSync(
      path.resolve(
        repoRoot,
        "scripts/lib/v1-38-current-matrix-reproduction.ts",
      ),
      "utf8",
    )

    expect(source).toContain("executePreparedRuntimeServiceRequestV118")
    expect(source).toContain("createPreparedRuntimeServiceDependenciesV118")
    expect(source).not.toMatch(/\bnew\s+Function\b/u)
    expect(source).not.toMatch(/node:vm|from\s+["'][^"']*engine[^"']*["']/u)
    expect(source).not.toMatch(/\brunMatch\s*\(/u)
  })

  it("matrix keeps every failed attempt charged and excludes it from accepted cells", () => {
    const inventory = enumerateV138CurrentMatrix(repoRoot)
    const outcomes: V138CurrentMatrixAttemptOutcome[] = inventory.attempts.map(
      ({ attemptId }, index) => ({
        attemptId,
        classification:
          index === 0
            ? "player_violation"
            : index === 1
              ? "system_failure"
              : "success",
        ...(index === 0
          ? { code: "INVALID_OUTPUT" }
          : index === 1
            ? { code: "EXECUTION_EXCEPTION", retryable: true }
            : { outcome: "draw" as const }),
      }),
    )

    expect(() => reduceV138CurrentMatrix(inventory, outcomes)).toThrow(
      "MATRIX_REPRODUCTION_MISMATCH",
    )
  })

  it.each([
    [
      "missing cell",
      (rows: V138CurrentMatrixAttemptOutcome[]) => rows.slice(1),
    ],
    [
      "duplicate cell",
      (rows: V138CurrentMatrixAttemptOutcome[]) => [...rows, rows[0]!],
    ],
    [
      "conflicting duplicate",
      (rows: V138CurrentMatrixAttemptOutcome[]) => [
        ...rows,
        { ...rows[0]!, outcome: "bottom_win" as const },
      ],
    ],
  ])("matrix rejects %s before sealing a receipt", (_label, mutateRows) => {
    const inventory = enumerateV138CurrentMatrix(repoRoot)
    const allDraws: V138CurrentMatrixAttemptOutcome[] = inventory.attempts.map(
      ({ attemptId }) => ({
        attemptId,
        classification: "success",
        outcome: "draw",
      }),
    )
    expect(() =>
      reduceV138CurrentMatrix(inventory, mutateRows(allDraws)),
    ).toThrow("MATRIX_REPRODUCTION_MISMATCH")
  })

  it("matrix calibrates supervised execution and fails closed when the total resource budget is unsafe", () => {
    const receipt = reproduceV138CurrentMatrix(repoRoot)
    const rendered = renderV138CurrentMatrixReceipt(receipt)

    expect(receipt).toMatchObject({
      schemaVersion: "v1.38-current-matrix-reproduction-v1",
      status: "stopped_process_failure",
      fixturePurpose: "regression_throughput_only",
      reason: "system_failure_resource_pressure",
      declaredAttemptCount: 540,
      acceptedCellCount: 0,
      partialAcceptedEvidenceReusable: false,
      priorFailedRun: {
        classification: "system_failure_resource_pressure",
        hostFreeMemoryPercentAtTermination: 9,
        partialResultsDiscarded: true,
        completedAttemptCount: "unknown",
      },
      resourcePolicy: {
        calibrationAttemptCount: 1,
        maxShardAttempts: 4,
        partialAcceptedEvidenceReusable: false,
      },
      calibration: {
        attemptCount: 1,
        withinTotalRunBudget: false,
        withinShardMemoryBudget: true,
        outcomeClassification: "success",
      },
      chargedAttemptLedgerRoot: expect.stringMatching(/^sha256:[0-9a-f]{64}$/u),
      acceptedCellLedgerRoot: expect.stringMatching(/^sha256:[0-9a-f]{64}$/u),
      receiptRoot: expect.stringMatching(/^sha256:[0-9a-f]{64}$/u),
    })
    expect(Object.isFrozen(receipt)).toBe(true)
    expect(rendered).toMatch(/\n$/u)
    expect(rendered).not.toMatch(
      /StrategyMemory|SoldierMemory|objectivePayload|strategySource|diagnostic|Users|DATABASE_URL/iu,
    )
  }, 600_000)

  it("matrix resource policy uses bounded subprocess shards and publishes no partial accepted cells", () => {
    const source = readFileSync(
      path.resolve(
        repoRoot,
        "scripts/lib/v1-38-current-matrix-reproduction.ts",
      ),
      "utf8",
    )
    expect(source).toContain("process.execPath")
    expect(source).toContain('"--import"')
    expect(source).toContain('"tsx"')
    expect(source).toContain("maxShardAttempts: 4")
    expect(source).toContain("maxShardRssKilobytes")
    expect(source).toContain("acceptedCellsPublished: 0")
    expect(source).toContain("partialAcceptedEvidenceReusable: false")
    expect(source).not.toMatch(/\bnew\s+Function\b|node:vm|\brunMatch\s*\(/u)
  })
})

describe("v1.38 matrix calibration policy", () => {
  it("matrix calibration policy precommits the exact eight-attempt four-shard inventory", () => {
    const inventory = enumerateV138CurrentMatrix(repoRoot)
    const policy = deriveV138ParallelCalibrationPolicy(inventory)

    expect(policy).toMatchObject({
      schemaVersion: "v1.38-parallel-calibration-policy-v1",
      sampleAttemptCount: 8,
      sampleShardCount: 4,
      attemptsPerShard: 2,
      concurrency: 4,
      authoritativeAttemptDenominator: 540,
      marginBasisPoints: 750,
      fixedOverheadMilliseconds: 60_000,
      maxProjectedTotalMilliseconds: 5_400_000,
      aggregationRules: {
        calibrationBatchWall:
          "ceil_parent_monotonic_first_spawn_through_cleanup_barrier_ms",
        perChildRss: "maximum_sample_per_child_kilobytes",
        aggregateChildRss:
          "maximum_tick_sum_of_all_active_children_kilobytes",
        hostHeadroom:
          "minimum_floor_free_over_total_basis_points_across_ticks",
      },
      roundingRules: {
        observedBatchWall: "ceil_integer_milliseconds",
        baseProjection: "ceil_integer_milliseconds",
        margin: "ceil_integer_milliseconds",
        hostHeadroom: "floor_integer_basis_points",
      },
      admissionComparator: "inclusive_less_than_or_equal",
    })
    expect(policy.inventory.attempts).toEqual(
      inventory.attempts.slice(0, 8).map((attempt, index) => ({
        calibrationAttemptId: `calibration:v1:${index}:${attempt.attemptId}`,
        templateAttemptId: attempt.attemptId,
        shardId: `calibration-shard:${Math.floor(index / 2)}`,
        laneId: `lane:${Math.floor(index / 2)}`,
        ordinalInShard: index % 2,
        requestSha256: expect.stringMatching(/^sha256:[0-9a-f]{64}$/u),
      })),
    )
    expect(
      policy.inventory.attempts.map(({ calibrationAttemptId }) =>
        inventory.attempts.some(
          ({ attemptId }) => attemptId === calibrationAttemptId,
        ),
      ),
    ).toEqual(Array(8).fill(false))
    expect(policy.inventory.shards).toEqual([
      {
        shardId: "calibration-shard:0",
        laneId: "lane:0",
        attemptIds: [
          `calibration:v1:0:${inventory.attempts[0]!.attemptId}`,
          `calibration:v1:1:${inventory.attempts[1]!.attemptId}`,
        ],
      },
      {
        shardId: "calibration-shard:1",
        laneId: "lane:1",
        attemptIds: [
          `calibration:v1:2:${inventory.attempts[2]!.attemptId}`,
          `calibration:v1:3:${inventory.attempts[3]!.attemptId}`,
        ],
      },
      {
        shardId: "calibration-shard:2",
        laneId: "lane:2",
        attemptIds: [
          `calibration:v1:4:${inventory.attempts[4]!.attemptId}`,
          `calibration:v1:5:${inventory.attempts[5]!.attemptId}`,
        ],
      },
      {
        shardId: "calibration-shard:3",
        laneId: "lane:3",
        attemptIds: [
          `calibration:v1:6:${inventory.attempts[6]!.attemptId}`,
          `calibration:v1:7:${inventory.attempts[7]!.attemptId}`,
        ],
      },
    ])
    expect(V138ParallelCalibrationPolicySchema.parse(clone(policy))).toEqual(
      policy,
    )
    expect(Object.isFrozen(policy)).toBe(true)
  })

  it.each([
    ["inventory ID", (draft: any) => (draft.inventory.attempts[0].calibrationAttemptId += ":mutated")],
    ["inventory order", (draft: any) => draft.inventory.attempts.reverse()],
    ["inventory count", (draft: any) => draft.inventory.attempts.pop()],
    ["shard assignment", (draft: any) => (draft.inventory.attempts[0].shardId = "calibration-shard:1")],
    ["concurrency", (draft: any) => (draft.concurrency = 3)],
    ["denominator", (draft: any) => (draft.authoritativeAttemptDenominator = 539)],
    ["margin", (draft: any) => (draft.marginBasisPoints = 749)],
    ["fixed overhead", (draft: any) => (draft.fixedOverheadMilliseconds = 59_999)],
    ["projection source", (draft: any) => (draft.projectionSourceRoot = `sha256:${"0".repeat(64)}`)],
    ["aggregation rule", (draft: any) => (draft.aggregationRules.perChildRss = "last_sample")],
    ["rounding rule", (draft: any) => (draft.roundingRules.margin = "floor_integer_milliseconds")],
    ["comparator", (draft: any) => (draft.admissionComparator = "strict_less_than")],
    ["policy root", (draft: any) => (draft.policyRoot = `sha256:${"0".repeat(64)}`)],
  ])("matrix calibration policy rejects mutated %s", (_label, change) => {
    const policy = clone(
      deriveV138ParallelCalibrationPolicy(
        enumerateV138CurrentMatrix(repoRoot),
      ),
    ) as any
    change(policy)
    expect(() => V138ParallelCalibrationPolicySchema.parse(policy)).toThrow(
      "MATRIX_PARALLEL_CALIBRATION_POLICY_INVALID",
    )
  })

  it("matrix calibration policy uses exact integer projection and inclusive admission", () => {
    const policy = deriveV138ParallelCalibrationPolicy(
      enumerateV138CurrentMatrix(repoRoot),
    )
    const projection = projectV138ParallelMatrix(policy, {
      calibrationBatchWallMilliseconds: 10_001,
      childMaxRssKilobytes: [100, 200, 300, 400],
      aggregateChildRssKilobytes: 850,
      minimumHostHeadroomBasisPoints: 2_500,
    })

    expect(projection).toMatchObject({
      calibrationBatchWallMilliseconds: 10_001,
      baseProjectedMilliseconds: 675_068,
      marginMilliseconds: 50_631,
      projectedTotalMilliseconds: 785_699,
      admittedByTime: true,
    })
    expect(isV138ParallelProjectedTotalAdmitted(5_400_000)).toBe(true)
    expect(isV138ParallelProjectedTotalAdmitted(5_400_001)).toBe(false)
  })
})

describe("v1.38 matrix scheduler", () => {
  it("matrix scheduler preallocates stable four-attempt shards without changing requests", () => {
    const inventory = enumerateV138CurrentMatrix(repoRoot)
    const requestBytesBefore = inventory.attempts.map(({ request }) =>
      JSON.stringify(request),
    )
    const plan = planV138MatrixShards(inventory)

    expect(plan.schemaVersion).toBe("v1.38-parallel-matrix-plan-v1")
    expect(plan.maxConcurrentShards).toBe(4)
    expect(plan.shards).toHaveLength(135)
    expect(plan.shards.every(({ attemptIds }) => attemptIds.length === 4)).toBe(
      true,
    )
    expect(plan.shards.flatMap(({ attemptIds }) => attemptIds)).toEqual(
      inventory.attempts.map(({ attemptId }) => attemptId),
    )
    expect(new Set(plan.shards.map(({ shardId }) => shardId))).toHaveLength(135)
    expect(new Set(plan.shards.map(({ laneId }) => laneId))).toEqual(
      new Set(["lane:0", "lane:1", "lane:2", "lane:3"]),
    )
    expect(
      inventory.attempts.map(({ request }) => JSON.stringify(request)),
    ).toEqual(requestBytesBefore)
    expect(Object.isFrozen(plan)).toBe(true)
  })
})

describe("v1.38 matrix accounting", () => {
  const successTerminals = () => {
    const inventory = enumerateV138CurrentMatrix(repoRoot)
    const plan = planV138MatrixShards(inventory)
    return {
      inventory,
      plan,
      terminals: plan.shards.map((shard) => ({
        shardId: shard.shardId,
        laneId: shard.laneId,
        classification: "success" as const,
        elapsedMilliseconds: 100,
        maxRssKilobytes: 200,
        cleanup: {
          gracefulTerminationSent: false,
          forceTerminationSent: false,
          exitAwaited: true,
          orphanProcessIds: [] as number[],
        },
        outcomes: [...shard.attemptIds].reverse().map((attemptId) => ({
          attemptId,
          classification: "success" as const,
          outcome: "draw" as const,
        })),
      })),
    }
  }

  it("matrix accounting is invariant to valid terminal completion order", () => {
    const { inventory, plan, terminals } = successTerminals()
    const forward = reduceV138ParallelMatrixAccounting({
      inventory,
      plan,
      terminals,
    })
    const reversed = reduceV138ParallelMatrixAccounting({
      inventory,
      plan,
      terminals: [...terminals].reverse(),
    })

    expect(reversed).toEqual(forward)
    expect(forward).toMatchObject({
      declaredAttemptCount: 540,
      launchedAttemptCount: 540,
      terminalAttemptCount: 540,
      successfulButUnacceptedCount: 540,
      failedAttemptCount: 0,
      cancelledAttemptCount: 0,
      unlaunchedAttemptCount: 0,
      acceptedCellsPublished: 0,
      partialAcceptedEvidenceReusable: false,
    })
    expect(forward.progressReceipts).toHaveLength(135)
    expect(
      forward.progressReceipts.every(
        ({ acceptedCellsPublished }) => acceptedCellsPublished === 0,
      ),
    ).toBe(true)
  })

  it.each([
    ["missing", (rows: any[]) => rows.slice(1)],
    ["duplicate", (rows: any[]) => [...rows, rows[0]]],
    ["conflicting", (rows: any[]) => [
      ...rows,
      {
        ...rows[0],
        outcomes: [
          {
            ...rows[0].outcomes[0],
            classification: "system_failure",
            code: "CONFLICT",
            retryable: false,
          },
          ...rows[0].outcomes.slice(1),
        ],
      },
    ]],
    ["unknown", (rows: any[]) => [
      {
        ...rows[0],
        outcomes: [
          { ...rows[0].outcomes[0], attemptId: "matrix:unknown" },
          ...rows[0].outcomes.slice(1),
        ],
      },
      ...rows.slice(1),
    ]],
    ["calibration alias", (rows: any[]) => [
      {
        ...rows[0],
        outcomes: [
          {
            ...rows[0].outcomes[0],
            attemptId: `calibration:v1:0:${rows[0].outcomes[0].attemptId}`,
          },
          ...rows[0].outcomes.slice(1),
        ],
      },
      ...rows.slice(1),
    ]],
    ["prior partial alias", (rows: any[]) => [
      {
        ...rows[0],
        outcomes: [
          {
            ...rows[0].outcomes[0],
            attemptId: `prior-partial:${rows[0].outcomes[0].attemptId}`,
          },
          ...rows[0].outcomes.slice(1),
        ],
      },
      ...rows.slice(1),
    ]],
    ["retry alias", (rows: any[]) => [
      {
        ...rows[0],
        outcomes: [
          {
            ...rows[0].outcomes[0],
            attemptId: `retry:1:${rows[0].outcomes[0].attemptId}`,
          },
          ...rows[0].outcomes.slice(1),
        ],
      },
      ...rows.slice(1),
    ]],
  ])("matrix accounting rejects %s terminal identities", (_label, change) => {
    const { inventory, plan, terminals } = successTerminals()
    expect(() =>
      reduceV138ParallelMatrixAccounting({
        inventory,
        plan,
        terminals: change(clone(terminals)),
      }),
    ).toThrow("MATRIX_PARALLEL_ACCOUNTING_INVALID")
  })

  it("matrix accounting charges every failure class and publishes no partial evidence", () => {
    const { inventory, plan, terminals } = successTerminals()
    const mutated = clone(terminals)
    mutated[0] = {
      ...mutated[0]!,
      classification: "failed",
      outcomes: [
        {
          attemptId: mutated[0]!.outcomes[0]!.attemptId,
          classification: "player_violation",
          code: "INVALID_OUTPUT",
        },
        {
          attemptId: mutated[0]!.outcomes[1]!.attemptId,
          classification: "system_failure",
          code: "EXECUTION_EXCEPTION",
          retryable: true,
        },
        {
          attemptId: mutated[0]!.outcomes[2]!.attemptId,
          classification: "timeout",
          code: "RESOURCE_POLICY_SHARD_TIMEOUT",
        },
        {
          attemptId: mutated[0]!.outcomes[3]!.attemptId,
          classification: "cancelled",
          code: "CANCELLED_AFTER_HARD_FAILURE",
        },
      ],
    }
    const accounting = reduceV138ParallelMatrixAccounting({
      inventory,
      plan,
      terminals: mutated,
    })

    expect(accounting).toMatchObject({
      successfulButUnacceptedCount: 536,
      failedAttemptCount: 3,
      cancelledAttemptCount: 1,
      acceptedCellsPublished: 0,
      partialAcceptedEvidenceReusable: false,
    })
    expect(accounting.acceptedCellLedgerRoot).toBe(
      "sha256:4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945",
    )
  })

  it("matrix accounting rejects reordered or mutated allocation plans", () => {
    const { inventory, plan, terminals } = successTerminals()
    const mutatedPlan = clone(plan)
    mutatedPlan.shards.reverse()

    expect(() =>
      reduceV138ParallelMatrixAccounting({
        inventory,
        plan: mutatedPlan,
        terminals,
      }),
    ).toThrow("MATRIX_PARALLEL_ACCOUNTING_INVALID")
  })
})

const successfulInjectedRunner = (input?: {
  childRssKilobytes?: number
  aggregateSamples?: readonly number[]
  hostHeadroomBasisPoints?: number
  elapsedMilliseconds?: number
  onLaunch?: ((active: number) => void) | undefined
  onExit?: ((active: number) => void) | undefined
}): V138ParallelShardRunner => {
  let active = 0
  return {
    async run(shard, control) {
      active += 1
      input?.onLaunch?.(active)
      await Promise.resolve()
      control.onResourceSample({
        childId: `child:${shard.shardId}`,
        childRssKilobytes: input?.childRssKilobytes ?? 100,
        hostTotalMemoryKilobytes: 10_000,
        hostFreeMemoryKilobytes: Math.floor(
          ((input?.hostHeadroomBasisPoints ?? 5_000) * 10_000) / 10_000,
        ),
      })
      for (const sample of input?.aggregateSamples ?? []) {
        control.onResourceSample({
          childId: `child:${shard.shardId}`,
          childRssKilobytes: sample,
          hostTotalMemoryKilobytes: 10_000,
          hostFreeMemoryKilobytes: Math.floor(
            ((input?.hostHeadroomBasisPoints ?? 5_000) * 10_000) / 10_000,
          ),
        })
      }
      await Promise.resolve()
      const cancelled = control.signal.aborted
      active -= 1
      input?.onExit?.(active)
      return {
        shardId: shard.shardId,
        laneId: shard.laneId,
        classification: cancelled ? ("cancelled" as const) : ("success" as const),
        elapsedMilliseconds: input?.elapsedMilliseconds ?? 100,
        maxRssKilobytes: input?.childRssKilobytes ?? 100,
        cleanup: {
          gracefulTerminationSent: cancelled,
          forceTerminationSent: false,
          exitAwaited: true,
          orphanProcessIds: [],
        },
        outcomes: shard.attempts.map(({ executionAttemptId }) =>
          cancelled
            ? {
                attemptId: executionAttemptId,
                classification: "cancelled" as const,
                code: "CANCELLED_AFTER_HARD_FAILURE",
              }
            : {
                attemptId: executionAttemptId,
                classification: "success" as const,
                outcome: "draw" as const,
              },
        ),
      }
    },
  }
}

describe("v1.38 matrix resources", () => {
  it("matrix resources calibrate exactly four concurrent two-attempt shards", async () => {
    const inventory = enumerateV138CurrentMatrix(repoRoot)
    const policy = deriveV138ParallelCalibrationPolicy(inventory)
    let maximumActive = 0
    const calibration = await calibrateV138ParallelMatrix({
      inventory,
      policy,
      runner: successfulInjectedRunner({
        onLaunch: (active) => {
          maximumActive = Math.max(maximumActive, active)
        },
      }),
      hardwareIdentity: {
        operatingSystem: "test-os",
        architecture: "test-arch",
        nodeVersion: "test-node",
        cpuIdentity: "test-cpu",
      },
    })

    expect(maximumActive).toBe(4)
    expect(calibration.policyRoot).toBe(policy.policyRoot)
    expect(calibration.terminalShardCount).toBe(4)
    expect(calibration.attemptCount).toBe(8)
    expect(calibration.projection.admittedByTime).toBe(true)
    expect(calibration.acceptedCellsPublished).toBe(0)
    expect(calibration.partialAcceptedEvidenceReusable).toBe(false)
    expect(
      calibration.terminals.every(({ outcomes }) => outcomes.length === 2),
    ).toBe(true)
  })

  it.each([
    ["per-child exact", 2_097_152, [2_097_152], 2_500, "complete_pending_publication"],
    ["per-child one over", 2_097_153, [2_097_153], 2_500, "stopped_process_failure"],
    ["aggregate exact", 1_048_576, [1_048_576], 2_500, "complete_pending_publication"],
    ["aggregate one over", 1_048_577, [1_048_577], 2_500, "stopped_process_failure"],
    ["headroom exact", 100, [100], 2_500, "complete_pending_publication"],
    ["headroom one below", 100, [100], 2_499, "stopped_process_failure"],
  ] as const)(
    "matrix resources enforce %s",
    async (_label, childRss, aggregateSamples, headroom, expectedStatus) => {
      const inventory = enumerateV138CurrentMatrix(repoRoot)
      const result = await executeV138ParallelMatrix({
        inventory,
        runner: successfulInjectedRunner({
          childRssKilobytes: childRss,
          aggregateSamples,
          hostHeadroomBasisPoints: headroom,
        }),
      })

      expect(result.status).toBe(expectedStatus)
      expect(result.accounting.acceptedCellsPublished).toBe(0)
    },
  )

  it("matrix resources stop on shard and total time limits", async () => {
    const inventory = enumerateV138CurrentMatrix(repoRoot)
    const shardTimeout = await executeV138ParallelMatrix({
      inventory,
      runner: successfulInjectedRunner({ elapsedMilliseconds: 600_001 }),
    })
    let now = 0
    const totalTimeout = await executeV138ParallelMatrix({
      inventory,
      runner: successfulInjectedRunner(),
      clock: {
        monotonicMilliseconds: () => {
          now += 5_400_001
          return now
        },
      },
    })

    expect(shardTimeout).toMatchObject({
      status: "stopped_process_failure",
      reason: "RESOURCE_POLICY_SHARD_TIMEOUT",
    })
    expect(totalTimeout).toMatchObject({
      status: "stopped_process_failure",
      reason: "RESOURCE_POLICY_TOTAL_TIMEOUT",
    })
  })
})

describe("v1.38 matrix cleanup", () => {
  it("matrix cleanup cancels active shards, awaits exits, and leaves later shards unlaunched", async () => {
    const inventory = enumerateV138CurrentMatrix(repoRoot)
    let launched = 0
    let exited = 0
    const runner: V138ParallelShardRunner = {
      async run(shard, control) {
        launched += 1
        await Promise.resolve()
        if (shard.ordinal === 0) {
          return {
            shardId: shard.shardId,
            laneId: shard.laneId,
            classification: "failed",
            elapsedMilliseconds: 10,
            maxRssKilobytes: 100,
            cleanup: {
              gracefulTerminationSent: false,
              forceTerminationSent: false,
              exitAwaited: true,
              orphanProcessIds: [],
            },
            outcomes: shard.attempts.map(({ executionAttemptId }, index) =>
              index === 0
                ? {
                    attemptId: executionAttemptId,
                    classification: "system_failure" as const,
                    code: "SPAWN_FAILED",
                    retryable: false,
                  }
                : {
                    attemptId: executionAttemptId,
                    classification: "cancelled" as const,
                    code: "CANCELLED_AFTER_HARD_FAILURE",
                  },
            ),
          }
        }
        while (!control.signal.aborted) await Promise.resolve()
        exited += 1
        return {
          shardId: shard.shardId,
          laneId: shard.laneId,
          classification: "cancelled",
          elapsedMilliseconds: 10,
          maxRssKilobytes: 100,
          cleanup: {
            gracefulTerminationSent: true,
            forceTerminationSent: true,
            exitAwaited: true,
            orphanProcessIds: [],
          },
          outcomes: shard.attempts.map(({ executionAttemptId }) => ({
            attemptId: executionAttemptId,
            classification: "cancelled" as const,
            code: "CANCELLED_AFTER_HARD_FAILURE",
          })),
        }
      },
    }
    const result = await executeV138ParallelMatrix({ inventory, runner })

    expect(result).toMatchObject({
      status: "stopped_process_failure",
      reason: "SHARD_EXECUTION_FAILED",
      accounting: {
        launchedAttemptCount: 16,
        terminalAttemptCount: 16,
        cancelledAttemptCount: 15,
        unlaunchedAttemptCount: 524,
        acceptedCellsPublished: 0,
      },
    })
    expect(launched).toBe(4)
    expect(exited).toBe(3)
    expect(
      result.terminals.every(
        ({ cleanup }) =>
          cleanup.exitAwaited && cleanup.orphanProcessIds.length === 0,
      ),
    ).toBe(true)
  })
})

describe("v1.38 matrix cancellation", () => {
  it.each(["parent_exception", "parent_interrupt"] as const)(
    "matrix cancellation handles %s with the same fail-closed cleanup",
    async (reason) => {
      const inventory = enumerateV138CurrentMatrix(repoRoot)
      const parent = new AbortController()
      let launched = 0
      const runner: V138ParallelShardRunner = {
        async run(shard, control) {
          launched += 1
          if (launched === 4) parent.abort(reason)
          while (!control.signal.aborted) await Promise.resolve()
          return {
            shardId: shard.shardId,
            laneId: shard.laneId,
            classification: "cancelled",
            elapsedMilliseconds: 1,
            maxRssKilobytes: 1,
            cleanup: {
              gracefulTerminationSent: true,
              forceTerminationSent: false,
              exitAwaited: true,
              orphanProcessIds: [],
            },
            outcomes: shard.attempts.map(({ executionAttemptId }) => ({
              attemptId: executionAttemptId,
              classification: "cancelled" as const,
              code:
                reason === "parent_interrupt"
                  ? "PARENT_INTERRUPT"
                  : "PARENT_EXCEPTION",
            })),
          }
        },
      }
      const result = await executeV138ParallelMatrix({
        inventory,
        runner,
        parentSignal: parent.signal,
      })

      expect(result.status).toBe("stopped_process_failure")
      expect(result.reason).toBe(
        reason === "parent_interrupt" ? "PARENT_INTERRUPT" : "PARENT_EXCEPTION",
      )
      expect(result.accounting.acceptedCellsPublished).toBe(0)
      expect(result.accounting.launchedAttemptCount).toBe(16)
      expect(result.accounting.unlaunchedAttemptCount).toBe(524)
    },
  )

  it("matrix cancellation converts runner exceptions to charged system failure", async () => {
    const inventory = enumerateV138CurrentMatrix(repoRoot)
    const runner: V138ParallelShardRunner = {
      async run() {
        throw new Error("untrusted child output failed to parse")
      },
    }
    const result = await executeV138ParallelMatrix({ inventory, runner })

    expect(result).toMatchObject({
      status: "stopped_process_failure",
      reason: "SHARD_RUNNER_EXCEPTION",
      accounting: {
        failedAttemptCount: 16,
        unlaunchedAttemptCount: 524,
        acceptedCellsPublished: 0,
      },
    })
  })
})

describe("v1.38 matrix expectation", () => {
  it("matrix expectation is reproduced only from immutable v1.37 Git evidence", () => {
    const persisted = loadV138HistoricalMatrixExpectation(repoRoot)
    const derived = deriveV138HistoricalMatrixExpectation(repoRoot)

    expect(derived).toEqual(persisted)
    expect(persisted).toMatchObject({
      schemaVersion: "v1.38-historical-matrix-expectation-v1",
      predicateVersion: "v1.38-historical-matrix-predicate-v1",
      provenance: {
        archiveCommit: "e704590df599b49d84745b0e828d5ab0f1d335ad",
        sourceBlobOid: "ab5c9feae17f28bd4eb8aeff90516a05c9633363",
        sourceSha256:
          "sha256:0313904594dab8b874292a6876e2d7500ed0e362dd6086333282c489b0a21d1d",
        runnerBlobOid: "3de4aa6f2397925d1d0de012cd8e749554455a06",
        runnerSourceSha256:
          "sha256:5eee4d3b9171749ccdcf0faa6378c3aa4442a5f0e17ffb92ff97ded7622ca243",
        derivationSourceRoot: expect.stringMatching(
          /^sha256:(?!0{64})[0-9a-f]{64}$/u,
        ),
      },
      declaredResults: {
        definitionCount: 10,
        unorderedPairCount: 45,
        configuredArenaCount: 3,
        seedParityCount: 2,
        mirroredSides: true,
        totalMatchCount: 540,
        leaders: [
          {
            strategyId: "advanced:stonewall-shear",
            wins: 62,
            losses: 44,
            draws: 2,
          },
          {
            strategyId: "advanced:vanguard-pressure",
            wins: 62,
            losses: 44,
            draws: 2,
          },
        ],
        thirdPlace: {
          strategyId: "advanced:rear-guard-sentinel",
          wins: 57,
          losses: 51,
          draws: 0,
        },
        majorityEdgeCycleCount: 9,
        arenaRecordEquality: {
          leftArenaLabel: "Smoke",
          rightArenaLabel: "Open Field",
          scope: "per_strategy_wins_losses_draws",
        },
      },
      historicalExpectationRoot: expect.stringMatching(
        /^sha256:(?!0{64})[0-9a-f]{64}$/u,
      ),
    })
    expect(Object.isFrozen(persisted)).toBe(true)
  })

  it.each([
    ["source commit", (draft: any) => (draft.provenance.archiveCommit = "0".repeat(40))],
    ["source blob", (draft: any) => (draft.provenance.sourceBlobOid = "0".repeat(40))],
    ["source bytes", (draft: any) => (draft.provenance.sourceSha256 = `sha256:${"0".repeat(64)}`)],
    ["runner blob", (draft: any) => (draft.provenance.runnerBlobOid = "0".repeat(40))],
    ["runner bytes", (draft: any) => (draft.provenance.runnerSourceSha256 = `sha256:${"0".repeat(64)}`)],
    ["derivation code", (draft: any) => (draft.provenance.derivationSourceRoot = `sha256:${"0".repeat(64)}`)],
    ["declared leader", (draft: any) => (draft.declaredResults.leaders[0].wins = 61)],
    ["record denominator", (draft: any) => (draft.declaredResults.thirdPlace.losses = 50)],
    ["cycle count", (draft: any) => (draft.declaredResults.majorityEdgeCycleCount = 8)],
    ["arena equality", (draft: any) => (draft.declaredResults.arenaRecordEquality.rightArenaLabel = "Standard Cross")],
    ["expectation root", (draft: any) => (draft.historicalExpectationRoot = `sha256:${"0".repeat(64)}`)],
    ["extra key", (draft: any) => (draft.observedAggregateRoot = `sha256:${"f".repeat(64)}`)],
    ["missing key", (draft: any) => delete draft.declaredResults.totalMatchCount],
    ["duplicate leader", (draft: any) => draft.declaredResults.leaders.push(draft.declaredResults.leaders[0])],
  ])("matrix expectation rejects mutated %s", (_label, change) => {
    const mutated = clone(loadV138HistoricalMatrixExpectation(repoRoot)) as any
    change(mutated)
    expect(() =>
      validateV138HistoricalMatrixExpectation(repoRoot, mutated),
    ).toThrow("MATRIX_EXPECTATION_INVALID")
  })
})

describe("v1.38 matrix reduction", () => {
  const exactAggregate = (): V138HistoricalMatrixObservedAggregate => {
    const inventory = enumerateV138CurrentMatrix(repoRoot)
    const records = new Map([
      ["advanced:stonewall-shear", [62, 44, 2]],
      ["advanced:vanguard-pressure", [62, 44, 2]],
      ["advanced:rear-guard-sentinel", [57, 51, 0]],
    ])
    return {
      standings: inventory.definitions
        .map(({ id }) => {
          const [wins, losses, draws] = records.get(id) ?? [51, 57, 0]
          const smoke =
            draws === 2
              ? { wins: 21, losses: 14, draws: 1 }
              : {
                  wins: wins / 3,
                  losses: losses / 3,
                  draws: 0,
                }
          const open = { ...smoke }
          const standard = {
            wins: wins - smoke.wins - open.wins,
            losses: losses - smoke.losses - open.losses,
            draws: draws - smoke.draws - open.draws,
          }
          return {
            id,
            wins,
            losses,
            draws,
            winRateBasisPoints: Math.round((wins * 10_000) / 108),
            byHistoricalArena: {
              Smoke: smoke,
              "Standard Cross": standard,
              "Open Field": open,
            },
          }
        })
        .sort(
          (left, right) =>
            right.winRateBasisPoints - left.winRateBasisPoints ||
            left.id.localeCompare(right.id),
        ),
      nonTransitiveCycleCount: 9,
    }
  }

  it("matrix reduction evaluates the complete aggregate against the independent predicate", () => {
    const inventory = enumerateV138CurrentMatrix(repoRoot)
    const aggregate = exactAggregate()
    const result = evaluateV138HistoricalMatrixPredicate(
      repoRoot,
      inventory,
      aggregate,
    )

    expect(result).toEqual({
      matched: true,
      predicateVersion: "v1.38-historical-matrix-predicate-v1",
      historicalExpectationRoot:
        "sha256:758c31a37318edfb1c94cb1d9715ae3cfe49cabdff13d906f155f00cc71abdce",
      sourceBindings: {
        archiveCommit: "e704590df599b49d84745b0e828d5ab0f1d335ad",
        sourceBlobOid: "ab5c9feae17f28bd4eb8aeff90516a05c9633363",
        runnerBlobOid: "3de4aa6f2397925d1d0de012cd8e749554455a06",
        derivationSourceRoot:
          "sha256:a3d0cd5c66f9b8f60b0a2a03e543d0cb602fc359abd45f6dcbcacb71172c88d3",
      },
    })
  })

  it.each([
    ["leader record", (draft: any) => (draft.standings[0].wins = 61)],
    ["record total", (draft: any) => (draft.standings[2].losses = 50)],
    ["cycle count", (draft: any) => (draft.nonTransitiveCycleCount = 8)],
    [
      "Smoke/Open Field equality",
      (draft: any) => (draft.standings[0].byHistoricalArena.Smoke.wins += 1),
    ],
    ["extra standing", (draft: any) => draft.standings.push(draft.standings[0])],
    ["missing standing", (draft: any) => draft.standings.pop()],
    ["extra aggregate key", (draft: any) => (draft.expected = draft)],
  ])("matrix reduction rejects mutated %s", (_label, change) => {
    const aggregate = clone(exactAggregate()) as any
    change(aggregate)
    expect(() =>
      evaluateV138HistoricalMatrixPredicate(
        repoRoot,
        enumerateV138CurrentMatrix(repoRoot),
        aggregate,
      ),
    ).toThrow("MATRIX_REPRODUCTION_MISMATCH")
  })

  it("matrix reduction keeps observed roots separate from the expectation", () => {
    const source = readFileSync(
      path.resolve(
        repoRoot,
        "scripts/lib/v1-38-current-matrix-reproduction.ts",
      ),
      "utf8",
    )
    expect(source).toContain("observedAggregateRoot")
    expect(source).toContain("historicalExpectationRoot")
    expect(source).not.toContain("HISTORICAL_EXPECTED_AGGREGATE_ROOT")
    expect(source).not.toContain(`sha256:${"0".repeat(64)}`)
  })
})
