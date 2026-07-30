import { createHash } from "node:crypto"
import {
  appendFileSync,
  existsSync,
  fsyncSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeSync,
} from "node:fs"
import { execFileSync } from "node:child_process"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { beforeAll, describe, expect, it } from "vitest"
import { runV137AuditReproductionGate } from "./check-v1-37-audit-reproduction.js"
import {
  V138_FOUNDATION_LIVE_SOURCE_PATHS,
  evaluateV138FoundationAdmission,
  renderV138FoundationAdmissionReceipt,
  resolveV138FoundationAdmissionInput,
  type V138FoundationAdmissionInput,
} from "./lib/v1-38-foundation-admission.js"
import {
  V138ParallelCalibrationPolicySchema,
  PLAN_262_13_EXECUTION_AUTHORIZATION_LITERAL,
  PLAN_262_12_EXECUTION_AUTHORIZATION_LITERAL,
  buildV138AuthoritativeMatrixV5Receipt,
  buildV138AuthoritativeMatrixV4Receipt,
  buildV138ExecutionContextV4Receipt,
  buildV138HostHeadroomPreflightV4Receipt,
  buildV138HostHeadroomPreflightV3Receipt,
  buildV138ParallelCalibrationV4Receipt,
  buildV138ParallelCalibrationV3Receipt,
  buildV138AuthoritativeMatrixV3Receipt,
  buildV138ParallelCalibrationV2SuccessorReceipt,
  buildV138ParallelCalibrationSuccessorReceipt,
  calibrateV138ParallelMatrix,
  checkV138ExecutionContextV4Receipt,
  checkV138SuccessorV4V5Branch,
  checkV138MatrixDiagnosticV2Receipt,
  checkV138ParallelCalibrationSuccessorReceipt,
  createV138SubprocessShardRunner,
  deriveV138ParallelCalibrationPolicy,
  deriveV138HistoricalMatrixExpectation,
  enumerateV138CurrentMatrix,
  evaluateV138HistoricalMatrixPredicate,
  executeV138ParallelMatrix,
  isV138ParallelProjectedTotalAdmitted,
  loadV138HistoricalMatrixExpectation,
  planV138MatrixShards,
  parseV138SamplerAuthorization,
  parseV138Plan26213ExecutionAuthorization,
  parseV138Plan26212ExecutionAuthorization,
  projectV138ParallelMatrix,
  reduceV138ParallelMatrixAccounting,
  reduceV138CurrentMatrix,
  renderV138CurrentMatrixReceipt,
  sampleV138ChildRss,
  validateV138HistoricalMatrixExpectation,
  writeV138AuthoritativeMatrixV5Receipt,
  writeV138ExecutionContextV4Receipt,
  writeV138HostHeadroomPreflightV4Receipt,
  writeV138ImmutableReceipt,
  writeV138MatrixDiagnosticV2Receipt,
  writeV138ParallelCalibrationV4Receipt,
  type V138CurrentMatrixAttempt,
  type V138CurrentMatrixAttemptOutcome,
  type V138HistoricalMatrixObservedAggregate,
  type V138ParallelShardRunner,
  type V138RssCommandAdapter,
  type V138ProducingGitObjectContract,
  type V138V4V5BranchVerificationContract,
} from "./lib/v1-38-current-matrix-reproduction.js"

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
)

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const currentMatrixArtifactHashes = (): Readonly<Record<string, string>> =>
  Object.freeze(Object.fromEntries(
    readdirSync(path.resolve(repoRoot, ".planning/artifacts"))
      .filter((name) =>
        /^v1\.38-current-matrix-.*\.json$/u.test(name))
      .sort()
      .map((name) => {
        const artifactPath = path.resolve(
          repoRoot,
          ".planning/artifacts",
          name,
        )
        return [
          name,
          createHash("sha256")
            .update(readFileSync(artifactPath))
            .digest("hex"),
        ]
      }),
  ))

const producingGitObjects = (): V138ProducingGitObjectContract => ({
  resolveCommitPath: ({ producingCommit, sourcePath }) => ({
    blob: execFileSync(
      "git",
      ["rev-parse", `${producingCommit}:${sourcePath}`],
      { cwd: repoRoot, encoding: "utf8" },
    ).trim(),
    content: execFileSync(
      "git",
      ["show", `${producingCommit}:${sourcePath}`],
      { cwd: repoRoot },
    ),
  }),
})

const legacyStoppedMatrixReceipt = () =>
  Object.freeze(JSON.parse(
    execFileSync(
      "git",
      [
        "show",
        "724388c3:.planning/artifacts/v1.38-current-matrix-reproduction.json",
      ],
      { cwd: repoRoot, encoding: "utf8" },
    ),
  ))

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
    const result = evaluateV138FoundationAdmission(exactInput, exactInput)

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
    const first = evaluateV138FoundationAdmission(exactInput, exactInput)
    const second = evaluateV138FoundationAdmission(
      clone(exactInput),
      exactInput,
    )

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

  it("admission audit reproduction excludes hostile Node bootstrap hooks", () => {
    const originalNodeOptions = process.env.NODE_OPTIONS
    try {
      process.env.NODE_OPTIONS =
        "--require /v1.38-hostile-preload-must-not-execute.cjs"
      expect(runV137AuditReproductionGate(repoRoot)).toMatchObject({
        schemaVersion: "v1.37-audit-reproduction-receipt-v1",
        status: "passed-exact",
      })
    } finally {
      if (originalNodeOptions === undefined) {
        delete process.env.NODE_OPTIONS
      } else {
        process.env.NODE_OPTIONS = originalNodeOptions
      }
    }
  })

  it("admission stops for missing or extra-keyed authority inputs", () => {
    const { release: _release, ...missing } = exactInput
    const stoppedMissing = evaluateV138FoundationAdmission(missing, exactInput)
    const stoppedExtra = evaluateV138FoundationAdmission({
      ...exactInput,
      override: true,
    }, exactInput)

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
      exactInput,
    )

    expect(result).toMatchObject({
      status: "stopped_integrity_foundation",
      reason,
    })
  })

  it.each([
    [
      "audit actual and resolved hashes",
      (draft: Record<string, unknown>) => {
        const audit = nested(draft, "audit")
        audit.joinSha256 = `sha256:${"1".repeat(64)}`
        audit.resolvedJoinSha256 = audit.joinSha256
      },
    ],
    [
      "annotated tag actual and resolved objects",
      (draft: Record<string, unknown>) => {
        const release = nested(draft, "release")
        release.tagObject = "1".repeat(40)
        release.resolvedTagObject = release.tagObject
      },
    ],
    [
      "release-readiness actual and resolved hashes",
      (draft: Record<string, unknown>) => {
        const release = nested(draft, "release")
        release.releaseReadinessSha256 = `sha256:${"1".repeat(64)}`
        release.resolvedReleaseReadinessSha256 =
          release.releaseReadinessSha256
      },
    ],
    [
      "archive and correction lineage join",
      (draft: Record<string, unknown>) => {
        const release = nested(draft, "release")
        const correction = nested(draft, "correctionLineage")
        release.archiveCommit = "1".repeat(40)
        release.resolvedTagTarget = release.archiveCommit
        correction.baseArchiveCommit = release.archiveCommit
        correction.implementationParent = release.archiveCommit
      },
    ],
    [
      "source actual and expected hashes",
      (draft: Record<string, unknown>) => {
        const bindings = nested(draft, "sources").bindings as Array<
          Record<string, unknown>
        >
        bindings[0]!.sha256 = `sha256:${"1".repeat(64)}`
        bindings[0]!.expectedSha256 = bindings[0]!.sha256
      },
    ],
    [
      "correction record actual and committed hashes",
      (draft: Record<string, unknown>) => {
        const correction = nested(draft, "correctionLineage")
        correction.recordSha256 = `sha256:${"1".repeat(64)}`
        correction.committedRecordSha256 = correction.recordSha256
      },
    ],
  ] as const)(
    "admission rejects paired forgery of %s",
    (_label, applyMutation) => {
      expect(
        evaluateV138FoundationAdmission(
          mutate(exactInput, applyMutation),
          exactInput,
        ),
      ).toMatchObject({
        status: "stopped_integrity_foundation",
        reason: "SOURCE_BINDING_DRIFT",
      })
    },
  )

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
      expect(
        evaluateV138FoundationAdmission(mutation, exactInput),
      ).toMatchObject({
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
      }, exactInput),
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
      exactInput,
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

  it("matrix admission rechecks protected inputs after a prior pass", () => {
    const temporaryRoot = mkdtempSync(
      path.join(tmpdir(), "cowards-v138-admission-drift-"),
    )
    const checkout = path.join(temporaryRoot, "checkout")
    execFileSync(
      "git",
      ["worktree", "add", "--detach", checkout, "HEAD"],
      { cwd: repoRoot },
    )
    try {
      symlinkSync(
        path.resolve(repoRoot, "node_modules"),
        path.resolve(checkout, "node_modules"),
        "dir",
      )
      expect(enumerateV138CurrentMatrix(checkout).attempts).toHaveLength(540)

      appendFileSync(
        path.resolve(
          checkout,
          "packages/engine/src/compatibility-fixtures.test.ts",
        ),
        "\n// Deliberate protected-input drift for admission-cache regression.\n",
      )

      expect(() => enumerateV138CurrentMatrix(checkout)).toThrow(
        "MATRIX_ADMISSION_INVALID",
      )
    } finally {
      execFileSync("git", ["worktree", "remove", "--force", checkout], {
        cwd: repoRoot,
      })
      rmSync(temporaryRoot, { recursive: true, force: true })
    }
  }, 120_000)

  it("admission and matrix enumeration reject every dirty live gate source", () => {
    const temporaryRoot = mkdtempSync(
      path.join(tmpdir(), "cowards-v138-live-gate-drift-"),
    )
    const checkout = path.join(temporaryRoot, "checkout")
    execFileSync(
      "git",
      ["worktree", "add", "--detach", checkout, "HEAD"],
      { cwd: repoRoot },
    )
    try {
      symlinkSync(
        path.resolve(repoRoot, "node_modules"),
        path.resolve(checkout, "node_modules"),
        "dir",
      )
      for (const sourcePath of V138_FOUNDATION_LIVE_SOURCE_PATHS) {
        appendFileSync(
          path.resolve(checkout, sourcePath),
          "\n// Deliberate live-source drift for admission authentication.\n",
        )
        expect(() =>
          resolveV138FoundationAdmissionInput(checkout),
        ).toThrow("V138_ADMISSION_LIVE_SOURCE_DRIFT")
        expect(() => enumerateV138CurrentMatrix(checkout)).toThrow(
          "MATRIX_ADMISSION_INVALID",
        )
        execFileSync("git", ["checkout", "--", sourcePath], {
          cwd: checkout,
        })
      }
    } finally {
      execFileSync("git", ["worktree", "remove", "--force", checkout], {
        cwd: repoRoot,
      })
      rmSync(temporaryRoot, { recursive: true, force: true })
    }
  }, 120_000)

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
    const receipt = legacyStoppedMatrixReceipt()
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

describe("v1.38 immutable receipt publication", () => {
  it("rejects a partial temporary writer that returns normally", () => {
    const temporaryRoot = mkdtempSync(
      path.join(tmpdir(), "cowards-v138-publication-short-write-"),
    )
    const target = path.join(temporaryRoot, "receipt.json")
    try {
      expect(() =>
        writeV138ImmutableReceipt(
          target,
          { schemaVersion: "test-receipt-v1", status: "complete" },
          {
            writeTemporaryFile: (fileDescriptor, bytes) => {
              writeSync(
                fileDescriptor,
                bytes,
                0,
                Math.max(1, Math.floor(bytes.byteLength / 2)),
              )
            },
          },
        ),
      ).toThrow("MATRIX_SUCCESSOR_TEMPORARY_WRITE_INCOMPLETE")
      expect(existsSync(target)).toBe(false)
      expect(readdirSync(temporaryRoot)).toEqual([])
    } finally {
      rmSync(temporaryRoot, { recursive: true, force: true })
    }
  })

  it("keeps the canonical target absent after a partial temporary write fails", () => {
    const temporaryRoot = mkdtempSync(
      path.join(tmpdir(), "cowards-v138-publication-fault-"),
    )
    const target = path.join(temporaryRoot, "receipt.json")
    try {
      expect(() =>
        writeV138ImmutableReceipt(
          target,
          { schemaVersion: "test-receipt-v1", status: "complete" },
          {
            writeTemporaryFile: (fileDescriptor, bytes) => {
              writeSync(
                fileDescriptor,
                bytes,
                0,
                Math.max(1, Math.floor(bytes.byteLength / 2)),
              )
              expect(existsSync(target)).toBe(false)
              throw new Error("INJECTED_PARTIAL_TEMPORARY_WRITE_FAILURE")
            },
          },
        ),
      ).toThrow("INJECTED_PARTIAL_TEMPORARY_WRITE_FAILURE")
      expect(existsSync(target)).toBe(false)
      expect(readdirSync(temporaryRoot)).toEqual([])
    } finally {
      rmSync(temporaryRoot, { recursive: true, force: true })
    }
  })

  it("allows exactly one complete receipt to win competing publication", () => {
    const temporaryRoot = mkdtempSync(
      path.join(tmpdir(), "cowards-v138-publication-race-"),
    )
    const target = path.join(temporaryRoot, "receipt.json")
    const first = { schemaVersion: "test-receipt-v1", writer: "first" }
    const second = { schemaVersion: "test-receipt-v1", writer: "second" }
    try {
      writeV138ImmutableReceipt(target, first)
      expect(() => writeV138ImmutableReceipt(target, second)).toThrow(
        "MATRIX_SUCCESSOR_TARGET_NOT_FRESH",
      )
      expect(JSON.parse(readFileSync(target, "utf8"))).toEqual(first)
      expect(readdirSync(temporaryRoot)).toEqual(["receipt.json"])
    } finally {
      rmSync(temporaryRoot, { recursive: true, force: true })
    }
  })

  it("cleans and durably records a publication link failure", () => {
    const temporaryRoot = mkdtempSync(
      path.join(tmpdir(), "cowards-v138-publication-link-fault-"),
    )
    const target = path.join(temporaryRoot, "receipt.json")
    const fsyncPhases: string[] = []
    try {
      expect(() =>
        writeV138ImmutableReceipt(
          target,
          { schemaVersion: "test-receipt-v1", status: "complete" },
          {
            linkTemporaryFile: () => {
              throw new Error("INJECTED_PUBLICATION_LINK_FAILURE")
            },
            fsyncDirectory: (directoryDescriptor, phase) => {
              fsyncPhases.push(phase)
              fsyncSync(directoryDescriptor)
            },
          },
        ),
      ).toThrow("INJECTED_PUBLICATION_LINK_FAILURE")
      expect(existsSync(target)).toBe(false)
      expect(readdirSync(temporaryRoot)).toEqual([])
      expect(fsyncPhases).toEqual(["cleanup"])
    } finally {
      rmSync(temporaryRoot, { recursive: true, force: true })
    }
  })

  it("preserves the canonical link when publication fsync is indeterminate", () => {
    const temporaryRoot = mkdtempSync(
      path.join(tmpdir(), "cowards-v138-publication-fsync-fault-"),
    )
    const target = path.join(temporaryRoot, "receipt.json")
    const receipt = {
      schemaVersion: "test-receipt-v1",
      status: "complete",
    }
    const fsyncPhases: string[] = []
    try {
      expect(() =>
        writeV138ImmutableReceipt(target, receipt, {
          fsyncDirectory: (directoryDescriptor, phase) => {
            fsyncPhases.push(phase)
            if (phase === "publication") {
              throw new Error("INJECTED_PUBLICATION_FSYNC_FAILURE")
            }
            fsyncSync(directoryDescriptor)
          },
        }),
      ).toThrow(
        "MATRIX_SUCCESSOR_PUBLICATION_DURABILITY_INDETERMINATE",
      )
      expect(JSON.parse(readFileSync(target, "utf8"))).toEqual(receipt)
      expect(readdirSync(temporaryRoot)).toEqual(["receipt.json"])
      expect(fsyncPhases).toEqual(["publication", "cleanup"])
    } finally {
      rmSync(temporaryRoot, { recursive: true, force: true })
    }
  })

  it("preserves the canonical link and reports temporary unlink failure", () => {
    const temporaryRoot = mkdtempSync(
      path.join(tmpdir(), "cowards-v138-publication-unlink-fault-"),
    )
    const target = path.join(temporaryRoot, "receipt.json")
    const fsyncPhases: string[] = []
    try {
      expect(() =>
        writeV138ImmutableReceipt(
          target,
          { schemaVersion: "test-receipt-v1", status: "complete" },
          {
            fsyncDirectory: (directoryDescriptor, phase) => {
              fsyncPhases.push(phase)
              fsyncSync(directoryDescriptor)
            },
            unlinkTemporaryFile: () => {
              throw new Error("INJECTED_TEMPORARY_UNLINK_FAILURE")
            },
          },
        ),
      ).toThrow("MATRIX_SUCCESSOR_TEMPORARY_CLEANUP_FAILED")
      expect(existsSync(target)).toBe(true)
      expect(readdirSync(temporaryRoot)).toHaveLength(2)
      expect(fsyncPhases).toEqual(["publication"])
    } finally {
      rmSync(temporaryRoot, { recursive: true, force: true })
    }
  })

  it("reports cleanup-fsync failure without removing the canonical link", () => {
    const temporaryRoot = mkdtempSync(
      path.join(tmpdir(), "cowards-v138-cleanup-fsync-fault-"),
    )
    const target = path.join(temporaryRoot, "receipt.json")
    const receipt = {
      schemaVersion: "test-receipt-v1",
      status: "complete",
    }
    const fsyncPhases: string[] = []
    try {
      expect(() =>
        writeV138ImmutableReceipt(target, receipt, {
          fsyncDirectory: (directoryDescriptor, phase) => {
            fsyncPhases.push(phase)
            if (phase === "cleanup") {
              throw new Error("INJECTED_CLEANUP_FSYNC_FAILURE")
            }
            fsyncSync(directoryDescriptor)
          },
        }),
      ).toThrow(
        "MATRIX_SUCCESSOR_CLEANUP_DURABILITY_INDETERMINATE",
      )
      expect(JSON.parse(readFileSync(target, "utf8"))).toEqual(receipt)
      expect(readdirSync(temporaryRoot)).toEqual(["receipt.json"])
      expect(fsyncPhases).toEqual(["publication", "cleanup"])
    } finally {
      rmSync(temporaryRoot, { recursive: true, force: true })
    }
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
  childRssByOrdinal?: readonly number[]
  aggregateSamples?: readonly number[]
  hostHeadroomBasisPoints?: number
  elapsedMilliseconds?: number
  onLaunch?: ((active: number) => void) | undefined
  onExit?: ((active: number) => void) | undefined
}): V138ParallelShardRunner => {
  let active = 0
  return {
    async run(shard, control) {
      const childRssKilobytes =
        input?.childRssByOrdinal?.[shard.ordinal] ??
        input?.childRssKilobytes ??
        100
      active += 1
      input?.onLaunch?.(active)
      await Promise.resolve()
      control.onResourceSample({
        childId: `child:${shard.shardId}`,
        childRssKilobytes,
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
        maxRssKilobytes: childRssKilobytes,
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

const admittedInjectedCalibration = (
  inventory: ReturnType<typeof enumerateV138CurrentMatrix>,
) =>
  calibrateV138ParallelMatrix({
    inventory,
    policy: deriveV138ParallelCalibrationPolicy(inventory),
    runner: successfulInjectedRunner(),
    hardwareIdentity: {
      operatingSystem: "test-os",
      architecture: "test-arch",
      nodeVersion: "test-node",
      cpuIdentity: "test-cpu",
    },
  })

describe("v1.38 matrix real process boundary", () => {
  const adapter = (
    invoke: V138RssCommandAdapter["execFile"],
  ): V138RssCommandAdapter => ({
    adapterId: "test-rss-command-adapter-v1",
    command: "ps",
    args: ["-o", "rss=", "-p", "{pid}"],
    units: "kilobytes",
    execFile: invoke,
  })

  it("matrix sampler denial classifies synchronous and callback permission denial", async () => {
    const denied = Object.assign(new Error("denied"), { code: "EPERM" })
    const synchronous = adapter(() => {
      throw denied
    })
    const callback = adapter((_command, _args, _options, done) => {
      done(denied, "", "")
    })

    await expect(sampleV138ChildRss(123, synchronous)).resolves.toEqual({
      status: "unavailable",
      code: "RESOURCE_SAMPLER_SPAWN_DENIED",
    })
    await expect(sampleV138ChildRss(123, callback)).resolves.toEqual({
      status: "unavailable",
      code: "RESOURCE_SAMPLER_SPAWN_DENIED",
    })
  })

  it.each(["", "0", "-1", "12 13", "12.5", "unknown"])(
    "matrix sampler denial rejects ambiguous RSS output %j",
    async (stdout) => {
      const ambiguous = adapter((_command, _args, _options, done) => {
        done(null, stdout, "")
      })
      await expect(sampleV138ChildRss(123, ambiguous)).resolves.toEqual({
        status: "unavailable",
        code: "RESOURCE_MEASUREMENT_UNAVAILABLE",
      })
    },
  )

  it("matrix real cleanup proof terminates a spawned shard after sampler denial", async () => {
    const inventory = enumerateV138CurrentMatrix(repoRoot)
    const attempt = inventory.attempts[0]!
    const denied = Object.assign(new Error("denied"), { code: "EPERM" })
    const runner = createV138SubprocessShardRunner(repoRoot, {
      rssCommandAdapter: adapter(() => {
        throw denied
      }),
    })
    const terminal = await runner.run(
      {
        kind: "calibration",
        shardId: "diagnostic-test-shard:denied",
        laneId: "diagnostic-test-lane:0",
        ordinal: 0,
        attempts: [{
          executionAttemptId: `diagnostic_test:v2:denied:${attempt.attemptId}`,
          templateAttemptId: attempt.attemptId,
          request: attempt.request,
        }],
      },
      {
        signal: new AbortController().signal,
        onResourceSample: () => undefined,
      },
    )

    expect(terminal).toMatchObject({
      classification: "failed",
      cleanup: {
        exitAwaited: true,
        orphanProcessIds: [],
      },
      outcomes: [{
        classification: "system_failure",
        code: "RESOURCE_SAMPLER_SPAWN_DENIED",
      }],
    })
  }, 60_000)

  it("matrix diagnostic v2 receipt seals exact charged real-boundary evidence", async () => {
    const target = path.resolve(
      "/tmp",
      `v1.38-current-matrix-diagnostic-v2-${process.pid}.json`,
    )
    const receipt = await writeV138MatrixDiagnosticV2Receipt(repoRoot, target)
    expect(checkV138MatrixDiagnosticV2Receipt(repoRoot, clone(receipt))).toEqual(
      receipt,
    )
    expect(receipt).toMatchObject({
      schemaVersion: "v1.38-current-matrix-diagnostic-v2",
      acceptedCellCount: 0,
      partialAcceptedEvidenceReusable: false,
      predecessor: {
        fileSha256:
          "sha256:ac890d84767a09265265b21d80852ff6c63615ea9d4a0cc9fbf549f520f5aeec",
        gitBlob: "166fbe91525623fa99fc7035462c76301f98785d",
        producingCommit: "c5665b756f7e9f3ec1e8c57e5c64ad6f2a136c66",
        receiptRoot:
          "sha256:99187d35b9a14e263be6cc35a6335bdd3957d5fede647345326c8e015891b280",
      },
    })
    const mutated = clone(receipt) as any
    mutated.executedIdentityIds.reverse()
    expect(() =>
      checkV138MatrixDiagnosticV2Receipt(repoRoot, mutated),
    ).toThrow("MATRIX_DIAGNOSTIC_V2_RECEIPT_INVALID")
  }, 180_000)
})

describe("v1.38 matrix sampler authorization", () => {
  it("matrix sampler authorization accepts only the explicit approved policy", () => {
    expect(parseV138SamplerAuthorization("authorized-unsandboxed-ps")).toMatchObject({
      selection: "authorized-unsandboxed-ps",
      permissionBoundary:
        "exact-read-only-ps-rss-and-process-group-orphan-probe",
      policyRoot: expect.stringMatching(/^sha256:[0-9a-f]{64}$/u),
    })
    for (const invalid of [
      "",
      "default",
      "approved",
      "previously-approved",
      "approved-equivalent-sampler",
    ]) {
      expect(() => parseV138SamplerAuthorization(invalid)).toThrow(
        "MATRIX_SAMPLER_AUTHORIZATION_REQUIRED",
      )
    }
  })
})

const terminalPlan26213Snapshot = () => ({
  planId: "262-13" as const,
  agents: [
    {
      agentId: "task-1-helper",
      taskName: "implement_262_13_task1",
      agentType: "worker",
      status: "completed",
    },
  ],
  activePlan26213AgentCount: 0 as const,
  activePlan26213GsdExecutorCount: 0 as const,
  claimScope: "plan_scoped_orchestrator_registry_not_os_global" as const,
})

describe("v1.38 matrix inline execution context v4", () => {
  it("matrix inline execution context v4 binds lean main ownership and terminal plan agents", () => {
    const receipt = buildV138ExecutionContextV4Receipt({
      repoRoot,
      mode: "gsd-pattern-c-inline-main",
      cwd: "/Users/roryquinlan/runtime/cowards-game",
      planAgentSnapshot: terminalPlan26213Snapshot(),
    })

    expect(receipt).toMatchObject({
      schemaVersion: "v1.38-current-matrix-execution-context-v4",
      mode: "gsd-pattern-c-inline-main",
      executionOwner: "lean-main-orchestrator",
      cwd: "/Users/roryquinlan/runtime/cowards-game",
      claimScope: "plan_scoped_orchestrator_registry_not_os_global",
      implementationSource: {
        path: "scripts/lib/v1-38-current-matrix-reproduction.ts",
        currentSha256: expect.stringMatching(/^sha256:[0-9a-f]{64}$/u),
        predecessorSha256:
          "sha256:e9f0bd91000dd4d089e627d9c6b7d93249ba58bd62724fbc413c450ca5c2ae84",
        predecessorGitBlob: "3eb530a64fc899810237d3fdf1b65202e6891627",
        predecessorProducingCommit:
          "02e25166652263fd6187937a1e02d81fb59a590d",
      },
      testSource: {
        path: "scripts/evaluate-v1-38-foundation-contract.test.ts",
        currentSha256: expect.stringMatching(/^sha256:[0-9a-f]{64}$/u),
        predecessorSha256:
          "sha256:dcbe73205d4d49cf5ea7e223a379bf0c64865d4069929499798700a5fc184352",
        predecessorGitBlob: "e76cd133de615d6b7bf89ff91103f76699ee2849",
        predecessorProducingCommit:
          "f27f3165083f8c2cdc7c45b441ec1386191234ac",
      },
      planAgentSnapshot: {
        activePlan26213AgentCount: 0,
        activePlan26213GsdExecutorCount: 0,
      },
    })
    expect(receipt.commandFamily).toEqual([
      "--write-execution-context-v4-receipt",
      "--check-execution-context-v4-receipt",
      "--write-headroom-preflight-v4-receipt",
      "--check-headroom-preflight-v4-receipt",
      "--calibrate-parallel-v4-receipt",
      "--check-calibration-v4-receipt",
      "--write-authoritative-v5-receipt",
      "--check-successor-v4-v5-branch",
    ])
    const sealedReceipt = JSON.parse(readFileSync(
      path.resolve(
        repoRoot,
        ".planning/artifacts/v1.38-current-matrix-execution-context-v4.json",
      ),
      "utf8",
    ))
    expect(
      checkV138ExecutionContextV4Receipt(repoRoot, sealedReceipt),
    ).toEqual(sealedReceipt)

    for (const mutation of [
      { mode: "resident-executor" },
      { executionOwner: "gsd-executor" },
      { cwd: "/tmp/cowards-game" },
      { commandFamily: receipt.commandFamily.slice(1) },
      {
        implementationSource: {
          ...receipt.implementationSource,
          currentSha256: `sha256:${"0".repeat(64)}`,
        },
      },
      { claimScope: "os_global_process_absence" },
      {
        planAgentSnapshot: {
          ...terminalPlan26213Snapshot(),
          activePlan26213AgentCount: 1,
          agents: [
            {
              ...terminalPlan26213Snapshot().agents[0],
              status: "running",
            },
          ],
        },
      },
      {
        planAgentSnapshot: {
          ...terminalPlan26213Snapshot(),
          activePlan26213GsdExecutorCount: 1,
        },
      },
    ]) {
      expect(() =>
        checkV138ExecutionContextV4Receipt(repoRoot, {
          ...sealedReceipt,
          ...mutation,
        }),
      ).toThrow("MATRIX_EXECUTION_CONTEXT_V4_RECEIPT_INVALID")
    }
  })
})

describe("v1.38 matrix historical execution context source evolution", () => {
  it("matrix historical execution context source evolution verifies sealed producing objects after HEAD changes", () => {
    const artifactHashesBefore = currentMatrixArtifactHashes()
    const receipt = JSON.parse(readFileSync(
      path.resolve(
        repoRoot,
        ".planning/artifacts/v1.38-current-matrix-execution-context-v4.json",
      ),
      "utf8",
    ))
    const successorTestBytes = readFileSync(
      path.resolve(
        repoRoot,
        "scripts/evaluate-v1-38-foundation-contract.test.ts",
      ),
    )
    expect(
      `sha256:${createHash("sha256").update(successorTestBytes).digest("hex")}`,
    ).not.toBe(receipt.testSource.currentSha256)

    expect(
      checkV138ExecutionContextV4Receipt(
        repoRoot,
        receipt,
        producingGitObjects(),
      ),
    ).toEqual(receipt)

    const invalidReceiptMutations = [
      {
        implementationSource: {
          ...receipt.implementationSource,
          path: "scripts/lib/not-the-producing-path.ts",
        },
      },
      {
        implementationSource: {
          ...receipt.implementationSource,
          currentSha256: `sha256:${"0".repeat(64)}`,
        },
      },
      {
        testSource: {
          ...receipt.testSource,
          currentSha256: `sha256:${"f".repeat(64)}`,
        },
      },
      { receiptRoot: `sha256:${"1".repeat(64)}` },
    ]
    for (const mutation of invalidReceiptMutations) {
      expect(() =>
        checkV138ExecutionContextV4Receipt(
          repoRoot,
          { ...receipt, ...mutation },
          producingGitObjects(),
        ),
      ).toThrow("MATRIX_EXECUTION_CONTEXT_V4_RECEIPT_INVALID")
    }

    const corruptingResolver = (
      kind: "commit" | "path" | "blob" | "content",
    ): V138ProducingGitObjectContract => ({
      resolveCommitPath: ({ producingCommit, sourcePath }) => {
        const wrongCommit =
          kind === "commit"
            ? "743bce2f"
            : producingCommit
        const wrongPath =
          kind === "path" &&
          sourcePath ===
            "scripts/lib/v1-38-current-matrix-reproduction.ts"
            ? "scripts/evaluate-v1-38-foundation-contract.test.ts"
            : sourcePath
        const resolved = producingGitObjects().resolveCommitPath({
          producingCommit: wrongCommit,
          sourcePath: wrongPath,
        })
        return {
          blob:
            kind === "blob"
              ? "0000000000000000000000000000000000000000"
              : resolved.blob,
          content:
            kind === "content"
              ? Buffer.from("mutated producing content", "utf8")
              : resolved.content,
        }
      },
    })
    for (const kind of ["commit", "path", "blob", "content"] as const) {
      expect(() =>
        checkV138ExecutionContextV4Receipt(
          repoRoot,
          receipt,
          corruptingResolver(kind),
        ),
      ).toThrow("MATRIX_EXECUTION_CONTEXT_V4_RECEIPT_INVALID")
    }
    expect(currentMatrixArtifactHashes()).toEqual(artifactHashesBefore)
  })
})

describe("v1.38 matrix retry authorization v4", () => {
  it("matrix retry authorization v4 accepts only the exact unused single-use lean grant", () => {
    const authorization = parseV138Plan26213ExecutionAuthorization(
      PLAN_262_13_EXECUTION_AUTHORIZATION_LITERAL,
    )
    expect(authorization).toMatchObject({
      planId: "262-13",
      leanOrchestratorOnly: true,
      headroomPreflightCount: 1,
      calibrationSetCount: 1,
      calibrationAttemptCount: 8,
      reproductionMaximumCount: 1,
      reproductionCellCount: 540,
      reproductionConditionalOnCalibrationAdmission: true,
      singleUse: true,
      expiresAtFirstTerminalOutcome: true,
      consumed: false,
      terminalOutcome: null,
    })
    expect(authorization.executionAuthorizationRoot).not.toBe(
      authorization.samplerPolicyRoot,
    )
    expect(authorization.executionAuthorizationRoot).not.toBe(
      "sha256:a903e1e58315aec0751db4e5df99ce8cf31a4b4e92536d0291a25aa31ce484c4",
    )
    for (const invalid of [
      "",
      "default",
      PLAN_262_12_EXECUTION_AUTHORIZATION_LITERAL,
      PLAN_262_13_EXECUTION_AUTHORIZATION_LITERAL.replace(
        "at most one",
        "two",
      ),
      `${PLAN_262_13_EXECUTION_AUTHORIZATION_LITERAL} Retry if needed.`,
    ]) {
      expect(() =>
        parseV138Plan26213ExecutionAuthorization(invalid),
      ).toThrow("MATRIX_PLAN_262_13_EXECUTION_AUTHORIZATION_REQUIRED")
    }
    expect(() =>
      parseV138Plan26213ExecutionAuthorization(
        PLAN_262_13_EXECUTION_AUTHORIZATION_LITERAL,
        { consumed: true, terminalOutcome: null },
      ),
    ).toThrow("MATRIX_PLAN_262_13_EXECUTION_AUTHORIZATION_CONSUMED")
    expect(() =>
      parseV138Plan26213ExecutionAuthorization(
        PLAN_262_13_EXECUTION_AUTHORIZATION_LITERAL,
        {
          consumed: true,
          terminalOutcome: "stopped_process_failure",
        },
      ),
    ).toThrow("MATRIX_PLAN_262_13_EXECUTION_AUTHORIZATION_EXPIRED")
  })
})

describe("v1.38 matrix headroom preflight v4", () => {
  it.each([
    [4_000, 1_000, 2_500, "preflight_admitted"],
    [4_001, 1_000, 2_499, "preflight_refused"],
  ] as const)(
    "matrix headroom preflight v4 preserves exact KiB floor semantics and predecessor custody",
    (total, free, basisPoints, disposition) => {
      const context = buildV138ExecutionContextV4Receipt({
        repoRoot,
        mode: "gsd-pattern-c-inline-main",
        cwd: "/Users/roryquinlan/runtime/cowards-game",
        planAgentSnapshot: terminalPlan26213Snapshot(),
      })
      const authorization = parseV138Plan26213ExecutionAuthorization(
        PLAN_262_13_EXECUTION_AUTHORIZATION_LITERAL,
      )
      const receipt = buildV138HostHeadroomPreflightV4Receipt({
        repoRoot,
        executionContext: context,
        executionAuthorization: authorization,
        hostTotalMemoryKilobytes: total,
        hostFreeMemoryKilobytes: free,
      })
      expect(receipt).toMatchObject({
        schemaVersion: "v1.38-current-matrix-headroom-preflight-v4",
        chargedIdentityId: "preflight:v4:0",
        hostHeadroomBasisPoints: basisPoints,
        requiredHostHeadroomBasisPoints: 2_500,
        disposition,
        executionContextV4ReceiptRoot: context.receiptRoot,
        predecessorRoots: {
          plan26212Preflight: {
            fileSha256:
              "sha256:b432f5640bb23f6ce66d3705f292151fdff8ff09c961b5693e30c25fc5f5420f",
            receiptRoot:
              "sha256:4e52cccbc6384cda9bef1c26c9e4f36d666e26506f760f749b4f0195677cb20d",
            chargedRoot:
              "sha256:8703f882e659a24d29b4e51e6e45a172afc35389b955038d6da83d304ca22de7",
          },
          plan26212Calibration: {
            fileSha256:
              "sha256:29a406e67f7163152c99c07c0f75ed5a0af8840b6c34372668265f2df10bc79d",
            receiptRoot:
              "sha256:911a6bbc700036f9d3916ac9b171b246a676b2b7dd33f24c8b85a8c4dbdb3ffd",
            chargedRoot:
              "sha256:2103fbb3bbc98427fdd81b8435f42e7d8c13ee2d2a995be4da463e02efcb4e35",
          },
        },
      })
    },
  )
})

describe("v1.38 matrix calibration v4 lineage", () => {
  it("matrix calibration v4 lineage charges all eight identities without children below gate", () => {
    const context = buildV138ExecutionContextV4Receipt({
      repoRoot,
      mode: "gsd-pattern-c-inline-main",
      cwd: "/Users/roryquinlan/runtime/cowards-game",
      planAgentSnapshot: terminalPlan26213Snapshot(),
    })
    const authorization = parseV138Plan26213ExecutionAuthorization(
      PLAN_262_13_EXECUTION_AUTHORIZATION_LITERAL,
    )
    const preflight = buildV138HostHeadroomPreflightV4Receipt({
      repoRoot,
      executionContext: context,
      executionAuthorization: authorization,
      hostTotalMemoryKilobytes: 4_001,
      hostFreeMemoryKilobytes: 1_000,
    })
    const receipt = buildV138ParallelCalibrationV4Receipt({
      repoRoot,
      executionContext: context,
      preflight,
      executionAuthorization: authorization,
    })
    expect(receipt).toMatchObject({
      schemaVersion: "v1.38-current-matrix-calibration-v4",
      status: "stopped_process_failure",
      reason: "RESOURCE_POLICY_HOST_HEADROOM",
      calibration: null,
      terminals: [],
      chargedCalibrationAttemptCount: 8,
      acceptedCellCount: 0,
      fullRunLaunched: false,
      executionAuthorization: {
        consumed: true,
        expired: true,
        terminalOutcome: "stopped_process_failure",
      },
    })
    expect(receipt.declaredCalibrationIdentityIds).toHaveLength(8)
    expect(receipt.declaredCalibrationIdentityIds[0]).toMatch(
      /^calibration:v4:0:/u,
    )
    expect(receipt.chargedDispositions).toHaveLength(8)
    expect(receipt.chargedDispositions.every(
      ({ disposition }) =>
        disposition === "unfilled_resource_preflight_refusal",
    )).toBe(true)

    const reorderedPredecessor = clone(preflight)
    reorderedPredecessor.predecessorRoots.orderedChargedLineage.reverse()
    expect(() =>
      buildV138ParallelCalibrationV4Receipt({
        repoRoot,
        executionContext: context,
        preflight: reorderedPredecessor,
        executionAuthorization: authorization,
      }),
    ).toThrow("MATRIX_PREFLIGHT_V4_RECEIPT_INVALID")

    expect(() =>
      buildV138ParallelCalibrationV4Receipt({
        repoRoot,
        executionContext: context,
        preflight,
        executionAuthorization: authorization,
        calibration: {} as never,
      }),
    ).toThrow("MATRIX_CALIBRATION_V4_BRANCH_INVALID")
  })
})

describe("v1.38 matrix authoritative v5 branches", () => {
  it("matrix authoritative v5 branches forbid v5 after a stopped calibration", () => {
    const context = buildV138ExecutionContextV4Receipt({
      repoRoot,
      mode: "gsd-pattern-c-inline-main",
      cwd: "/Users/roryquinlan/runtime/cowards-game",
      planAgentSnapshot: terminalPlan26213Snapshot(),
    })
    const authorization = parseV138Plan26213ExecutionAuthorization(
      PLAN_262_13_EXECUTION_AUTHORIZATION_LITERAL,
    )
    const preflight = buildV138HostHeadroomPreflightV4Receipt({
      repoRoot,
      executionContext: context,
      executionAuthorization: authorization,
      hostTotalMemoryKilobytes: 4_001,
      hostFreeMemoryKilobytes: 1_000,
    })
    const calibration = buildV138ParallelCalibrationV4Receipt({
      repoRoot,
      executionContext: context,
      preflight,
      executionAuthorization: authorization,
    })
    expect(
      checkV138SuccessorV4V5Branch(
        repoRoot,
        { branchSource: "supplied", executionContext: context, preflight },
        calibration,
        undefined,
      ),
    ).toEqual({ calibration, reproduction: null })
    expect(() =>
      checkV138SuccessorV4V5Branch(
        repoRoot,
        { branchSource: "supplied", executionContext: context, preflight },
        calibration,
        {},
      ),
    ).toThrow("MATRIX_STOPPED_CALIBRATION_V5_FORBIDDEN")
  }, 20_000)

  it("matrix authoritative v5 branches verify admitted-preflight calibration failure custody", async () => {
    const inventory = enumerateV138CurrentMatrix(repoRoot)
    const context = buildV138ExecutionContextV4Receipt({
      repoRoot,
      mode: "gsd-pattern-c-inline-main",
      cwd: "/Users/roryquinlan/runtime/cowards-game",
      planAgentSnapshot: terminalPlan26213Snapshot(),
    })
    const authorization = parseV138Plan26213ExecutionAuthorization(
      PLAN_262_13_EXECUTION_AUTHORIZATION_LITERAL,
    )
    const preflight = buildV138HostHeadroomPreflightV4Receipt({
      repoRoot,
      executionContext: context,
      executionAuthorization: authorization,
      hostTotalMemoryKilobytes: 4_000,
      hostFreeMemoryKilobytes: 1_000,
    })
    const failedRunner: V138ParallelShardRunner = {
      async run(shard) {
        return {
          shardId: shard.shardId,
          laneId: shard.laneId,
          classification: "failed",
          elapsedMilliseconds: 1,
          maxRssKilobytes: 1,
          cleanup: {
            gracefulTerminationSent: false,
            forceTerminationSent: false,
            exitAwaited: true,
            orphanProcessIds: [],
          },
          outcomes: shard.attempts.map(({ executionAttemptId }) => ({
            attemptId: executionAttemptId,
            classification: "system_failure" as const,
            code: "INJECTED_CALIBRATION_FAILURE",
            retryable: false,
          })),
        }
      },
    }
    const calibrationEvidence = await calibrateV138ParallelMatrix({
      inventory,
      runner: failedRunner,
      hardwareIdentity: {
        operatingSystem: "test-os",
        architecture: "test-arch",
        nodeVersion: "test-node",
        cpuIdentity: "test-cpu",
      },
      executionIdentityVersion: "v4",
    })
    const calibration = buildV138ParallelCalibrationV4Receipt({
      repoRoot,
      executionContext: context,
      preflight,
      executionAuthorization: authorization,
      calibration: calibrationEvidence,
    })

    expect(calibration).toMatchObject({
      status: "stopped_process_failure",
      acceptedCellCount: 0,
      fullRunLaunched: false,
      partialAcceptedEvidenceReusable: false,
      executionAuthorization: {
        expired: true,
        terminalOutcome: "stopped_process_failure",
      },
    })
    expect(calibration.declaredCalibrationIdentityIds).toHaveLength(8)
    expect(calibration.chargedDispositions).toHaveLength(8)
    expect(
      calibration.chargedDispositions.every(
        ({ disposition }) =>
          disposition === "terminal_calibration_outcome",
      ),
    ).toBe(true)
    expect(
      calibration.terminals.flatMap(({ outcomes }) => outcomes),
    ).toHaveLength(8)
    expect(
      checkV138SuccessorV4V5Branch(
        repoRoot,
        { branchSource: "supplied", executionContext: context, preflight },
        calibration,
        undefined,
      ),
    ).toEqual({ calibration, reproduction: null })
  }, 20_000)

  it("matrix authoritative v5 branches use fresh identities and atomic zero publication on failure", async () => {
    const inventory = enumerateV138CurrentMatrix(repoRoot)
    const context = buildV138ExecutionContextV4Receipt({
      repoRoot,
      mode: "gsd-pattern-c-inline-main",
      cwd: "/Users/roryquinlan/runtime/cowards-game",
      planAgentSnapshot: terminalPlan26213Snapshot(),
    })
    const authorization = parseV138Plan26213ExecutionAuthorization(
      PLAN_262_13_EXECUTION_AUTHORIZATION_LITERAL,
    )
    const preflight = buildV138HostHeadroomPreflightV4Receipt({
      repoRoot,
      executionContext: context,
      executionAuthorization: authorization,
      hostTotalMemoryKilobytes: 4_000,
      hostFreeMemoryKilobytes: 1_000,
    })
    const calibrationEvidence = await calibrateV138ParallelMatrix({
      inventory,
      runner: successfulInjectedRunner(),
      hardwareIdentity: {
        operatingSystem: "test-os",
        architecture: "test-arch",
        nodeVersion: "test-node",
        cpuIdentity: "test-cpu",
      },
      executionIdentityVersion: "v4",
    })
    const calibration = buildV138ParallelCalibrationV4Receipt({
      repoRoot,
      executionContext: context,
      preflight,
      executionAuthorization: authorization,
      calibration: calibrationEvidence,
    })
    expect(() =>
      checkV138SuccessorV4V5Branch(
        repoRoot,
        { branchSource: "supplied", executionContext: context, preflight },
        calibration,
        undefined,
      ),
    ).toThrow("MATRIX_ADMITTED_CALIBRATION_V5_REQUIRED")
    const execution = await executeV138ParallelMatrix({
      inventory,
      calibration: calibrationEvidence,
      runner: successfulInjectedRunner({ hostHeadroomBasisPoints: 1_000 }),
      executionIdentityVersion: "v5",
    })
    const reproduction = buildV138AuthoritativeMatrixV5Receipt({
      repoRoot,
      executionContext: context,
      calibrationV4: calibration,
      execution,
    })
    expect(reproduction).toMatchObject({
      schemaVersion: "v1.38-current-matrix-reproduction-v5",
      status: "stopped_process_failure",
      acceptedCellCount: 0,
      fullRunLaunched: true,
      executionAuthorizationExpired: true,
      calibrationV4ReceiptRoot: calibration.receiptRoot,
    })
    expect(
      reproduction.execution.terminals.flatMap(({ outcomes }) => outcomes)
        .every(({ attemptId }) => attemptId.startsWith("reproduction:v5:")),
    ).toBe(true)
    const duplicateExecution = clone(execution)
    duplicateExecution.terminals[0]!.outcomes[1]!.attemptId =
      duplicateExecution.terminals[0]!.outcomes[0]!.attemptId
    expect(() =>
      buildV138AuthoritativeMatrixV5Receipt({
        repoRoot,
        executionContext: context,
        calibrationV4: calibration,
        execution: duplicateExecution,
      }),
    ).toThrow()
    expect(() =>
      checkV138SuccessorV4V5Branch(
        repoRoot,
        { branchSource: "supplied", executionContext: context, preflight },
        calibration,
        reproduction,
      ),
    ).toThrow("MATRIX_AUTHORITATIVE_V5_NOT_PASSED_EXACT")
  }, 30_000)

  it("matrix authoritative v5 branches reject every predecessor artifact path", async () => {
    expect(() =>
      writeV138ExecutionContextV4Receipt(
        repoRoot,
        path.resolve(
          repoRoot,
          ".planning/artifacts/v1.38-current-matrix-headroom-preflight-v3.json",
        ),
        "gsd-pattern-c-inline-main",
        "/Users/roryquinlan/runtime/cowards-game",
        terminalPlan26213Snapshot(),
      ),
    ).toThrow("MATRIX_SUCCESSOR_TARGET_NOT_FRESH")
    expect(() =>
      writeV138HostHeadroomPreflightV4Receipt(
        repoRoot,
        path.resolve(
          repoRoot,
          ".planning/artifacts/v1.38-current-matrix-headroom-preflight-v3.json",
        ),
        "/not-read",
        "authorize-plan-262-13-lean-single-run",
      ),
    ).toThrow("MATRIX_SUCCESSOR_TARGET_NOT_FRESH")
    await expect(
      writeV138ParallelCalibrationV4Receipt(
        repoRoot,
        path.resolve(
          repoRoot,
          ".planning/artifacts/v1.38-current-matrix-calibration-v3.json",
        ),
        "/not-read",
        "/not-read",
      ),
    ).rejects.toThrow("MATRIX_SUCCESSOR_TARGET_NOT_FRESH")
    await expect(
      writeV138AuthoritativeMatrixV5Receipt(
        repoRoot,
        path.resolve(
          repoRoot,
          ".planning/artifacts/v1.38-current-matrix-reproduction.json",
        ),
        "/not-read",
        "/not-read",
      ),
    ).rejects.toThrow("MATRIX_SUCCESSOR_TARGET_NOT_FRESH")
  })
})

describe("v1.38 matrix authoritative v5 ambient isolation", () => {
  it("matrix authoritative v5 ambient isolation requires explicit persisted or supplied evidence", () => {
    const artifactHashesBefore = currentMatrixArtifactHashes()
    const context = buildV138ExecutionContextV4Receipt({
      repoRoot,
      mode: "gsd-pattern-c-inline-main",
      cwd: "/Users/roryquinlan/runtime/cowards-game",
      planAgentSnapshot: terminalPlan26213Snapshot(),
    })
    const authorization = parseV138Plan26213ExecutionAuthorization(
      PLAN_262_13_EXECUTION_AUTHORIZATION_LITERAL,
    )
    const preflight = buildV138HostHeadroomPreflightV4Receipt({
      repoRoot,
      executionContext: context,
      executionAuthorization: authorization,
      hostTotalMemoryKilobytes: 4_001,
      hostFreeMemoryKilobytes: 1_000,
    })
    const calibration = buildV138ParallelCalibrationV4Receipt({
      repoRoot,
      executionContext: context,
      preflight,
      executionAuthorization: authorization,
    })
    const suppliedBranch: V138V4V5BranchVerificationContract = {
      branchSource: "supplied",
      executionContext: context,
      preflight,
    }
    expect(
      checkV138SuccessorV4V5Branch(
        repoRoot,
        suppliedBranch,
        calibration,
        undefined,
      ),
    ).toEqual({ calibration, reproduction: null })

    const persistedContextPath = path.resolve(
      repoRoot,
      ".planning/artifacts/v1.38-current-matrix-execution-context-v4.json",
    )
    const persistedPreflightPath = path.resolve(
      repoRoot,
      ".planning/artifacts/v1.38-current-matrix-headroom-preflight-v4.json",
    )
    const persistedCalibrationPath = path.resolve(
      repoRoot,
      ".planning/artifacts/v1.38-current-matrix-calibration-v4.json",
    )
    const persistedV5Path = path.resolve(
      repoRoot,
      ".planning/artifacts/v1.38-current-matrix-reproduction-v5.json",
    )
    const persistedCalibration = JSON.parse(
      readFileSync(persistedCalibrationPath, "utf8"),
    )
    const persistedBranch: V138V4V5BranchVerificationContract = {
      branchSource: "persisted",
      executionContextPath: persistedContextPath,
      preflightPath: persistedPreflightPath,
      calibrationPath: persistedCalibrationPath,
      reproductionV5Path: persistedV5Path,
    }
    expect(
      checkV138SuccessorV4V5Branch(
        repoRoot,
        persistedBranch,
        persistedCalibration,
        undefined,
      ),
    ).toEqual({ calibration: persistedCalibration, reproduction: null })

    for (const invalidContract of [
      {
        ...suppliedBranch,
        branchSource: "ambient",
      },
      {
        ...suppliedBranch,
        preflight: JSON.parse(readFileSync(persistedPreflightPath, "utf8")),
      },
      {
        ...persistedBranch,
        calibrationPath: path.resolve(
          repoRoot,
          ".planning/artifacts/v1.38-current-matrix-calibration-v3.json",
        ),
      },
    ]) {
      expect(() =>
        checkV138SuccessorV4V5Branch(
          repoRoot,
          invalidContract as V138V4V5BranchVerificationContract,
          calibration,
          undefined,
        ),
      ).toThrow()
    }
    expect(currentMatrixArtifactHashes()).toEqual(artifactHashesBefore)
  }, 20_000)
})

describe("v1.38 matrix retry authorization v3", () => {
  it("matrix retry authorization v3 accepts only the exact unused single-use grant", () => {
    const authorization = parseV138Plan26212ExecutionAuthorization(
      PLAN_262_12_EXECUTION_AUTHORIZATION_LITERAL,
    )
    expect(authorization).toMatchObject({
      planId: "262-12",
      headroomPreflightCount: 1,
      calibrationSetCount: 1,
      calibrationAttemptCount: 8,
      reproductionCount: 1,
      reproductionCellCount: 540,
      reproductionConditionalOnCalibrationAdmission: true,
      singleUse: true,
      expiresAtFirstTerminalOutcome: true,
      consumed: false,
      terminalOutcome: null,
      samplerPolicyRoot:
        "sha256:cf3104a41dc7e34ec698a2f187fa0f3785d402549af28fdb60d091b2600339d9",
      executionAuthorizationRoot: expect.stringMatching(
        /^sha256:[0-9a-f]{64}$/u,
      ),
    })
    expect(authorization.executionAuthorizationRoot).not.toBe(
      authorization.samplerPolicyRoot,
    )
    for (const invalid of [
      "",
      "authorized",
      "default",
      "previously authorized",
      PLAN_262_12_EXECUTION_AUTHORIZATION_LITERAL.replace("one 540-cell", "two 540-cell"),
      PLAN_262_12_EXECUTION_AUTHORIZATION_LITERAL.replace("Plan 262-12", "Plan 262-11"),
      `${PLAN_262_12_EXECUTION_AUTHORIZATION_LITERAL} Retry if needed.`,
    ]) {
      expect(() =>
        parseV138Plan26212ExecutionAuthorization(invalid),
      ).toThrow("MATRIX_PLAN_262_12_EXECUTION_AUTHORIZATION_REQUIRED")
    }
    expect(() =>
      parseV138Plan26212ExecutionAuthorization(
        PLAN_262_12_EXECUTION_AUTHORIZATION_LITERAL,
        { consumed: true, terminalOutcome: null },
      ),
    ).toThrow("MATRIX_PLAN_262_12_EXECUTION_AUTHORIZATION_CONSUMED")
    expect(() =>
      parseV138Plan26212ExecutionAuthorization(
        PLAN_262_12_EXECUTION_AUTHORIZATION_LITERAL,
        {
          consumed: true,
          terminalOutcome: "stopped_process_failure",
        },
      ),
    ).toThrow("MATRIX_PLAN_262_12_EXECUTION_AUTHORIZATION_EXPIRED")
  })
})

describe("v1.38 matrix headroom preflight v3", () => {
  it.each([
    [4_000, 1_000, 2_500, "preflight_admitted"],
    [4_001, 1_000, 2_499, "preflight_refused"],
  ] as const)(
    "matrix headroom preflight v3 applies exact floor semantics",
    (total, free, basisPoints, disposition) => {
      const authorization = parseV138Plan26212ExecutionAuthorization(
        PLAN_262_12_EXECUTION_AUTHORIZATION_LITERAL,
      )
      const receipt = buildV138HostHeadroomPreflightV3Receipt({
        repoRoot,
        executionAuthorization: authorization,
        hostTotalMemoryKilobytes: total,
        hostFreeMemoryKilobytes: free,
      })
      expect(receipt).toMatchObject({
        schemaVersion: "v1.38-current-matrix-headroom-preflight-v3",
        chargedIdentityId: "preflight:v3:0",
        hostTotalMemoryKilobytes: total,
        hostFreeMemoryKilobytes: free,
        hostHeadroomBasisPoints: basisPoints,
        requiredHostHeadroomBasisPoints: 2_500,
        disposition,
        samplerPolicyRoot: authorization.samplerPolicyRoot,
        executionAuthorizationRoot:
          authorization.executionAuthorizationRoot,
        resourcePolicyRoot:
          "sha256:ba5ea05c5067be4aaf996d3fe67cc7f8d13931b7a19301cc1429f185e72747a7",
      })
    },
  )
})

describe("v1.38 matrix calibration v3 lineage", () => {
  it("matrix calibration v3 lineage charges an admitted eight-attempt successor", async () => {
    const inventory = enumerateV138CurrentMatrix(repoRoot)
    const authorization = parseV138Plan26212ExecutionAuthorization(
      PLAN_262_12_EXECUTION_AUTHORIZATION_LITERAL,
    )
    const preflight = buildV138HostHeadroomPreflightV3Receipt({
      repoRoot,
      executionAuthorization: authorization,
      hostTotalMemoryKilobytes: 4_000,
      hostFreeMemoryKilobytes: 1_000,
    })
    const calibration = await calibrateV138ParallelMatrix({
      inventory,
      runner: successfulInjectedRunner(),
      hardwareIdentity: {
        operatingSystem: "test-os",
        architecture: "test-arch",
        nodeVersion: "test-node",
        cpuIdentity: "test-cpu",
      },
      executionIdentityVersion: "v3",
    })
    const receipt = buildV138ParallelCalibrationV3Receipt({
      repoRoot,
      preflight,
      executionAuthorization: authorization,
      calibration,
    })
    expect(receipt).toMatchObject({
      schemaVersion: "v1.38-current-matrix-calibration-v3",
      status: "calibration_admitted",
      preflightV3ReceiptRoot: preflight.receiptRoot,
      chargedCalibrationAttemptCount: 8,
      acceptedCellCount: 0,
      fullRunLaunched: false,
      executionAuthorization: {
        consumed: true,
        expired: false,
        terminalOutcome: null,
      },
    })
    expect(receipt.declaredCalibrationIdentityIds).toHaveLength(8)
    expect(
      receipt.declaredCalibrationIdentityIds.every((id) =>
        id.startsWith("calibration:v3:"),
      ),
    ).toBe(true)
  })

  it("matrix calibration v3 lineage refuses below threshold without children", () => {
    const authorization = parseV138Plan26212ExecutionAuthorization(
      PLAN_262_12_EXECUTION_AUTHORIZATION_LITERAL,
    )
    const preflight = buildV138HostHeadroomPreflightV3Receipt({
      repoRoot,
      executionAuthorization: authorization,
      hostTotalMemoryKilobytes: 4_001,
      hostFreeMemoryKilobytes: 1_000,
    })
    const receipt = buildV138ParallelCalibrationV3Receipt({
      repoRoot,
      preflight,
      executionAuthorization: authorization,
    })
    expect(receipt).toMatchObject({
      status: "stopped_process_failure",
      reason: "RESOURCE_POLICY_HOST_HEADROOM",
      calibration: null,
      terminals: [],
      acceptedCellCount: 0,
      fullRunLaunched: false,
      executionAuthorization: {
        consumed: true,
        expired: true,
        terminalOutcome: "stopped_process_failure",
      },
    })
    expect(receipt.chargedDispositions).toHaveLength(8)
    expect(
      receipt.chargedDispositions.every(
        ({ disposition }) =>
          disposition === "unfilled_resource_preflight_refusal",
      ),
    ).toBe(true)
  })
})

describe("v1.38 matrix authoritative v4 branches", () => {
  it("matrix authoritative v4 branches require admitted calibration and fresh v4 identities", async () => {
    const inventory = enumerateV138CurrentMatrix(repoRoot)
    const authorization = parseV138Plan26212ExecutionAuthorization(
      PLAN_262_12_EXECUTION_AUTHORIZATION_LITERAL,
    )
    const preflight = buildV138HostHeadroomPreflightV3Receipt({
      repoRoot,
      executionAuthorization: authorization,
      hostTotalMemoryKilobytes: 4_000,
      hostFreeMemoryKilobytes: 1_000,
    })
    const calibration = await calibrateV138ParallelMatrix({
      inventory,
      runner: successfulInjectedRunner(),
      hardwareIdentity: {
        operatingSystem: "test-os",
        architecture: "test-arch",
        nodeVersion: "test-node",
        cpuIdentity: "test-cpu",
      },
      executionIdentityVersion: "v3",
    })
    const calibrationV3 = buildV138ParallelCalibrationV3Receipt({
      repoRoot,
      preflight,
      executionAuthorization: authorization,
      calibration,
    })
    const failedRunner: V138ParallelShardRunner = {
      async run(shard) {
        return {
          shardId: shard.shardId,
          laneId: shard.laneId,
          classification: "failed",
          elapsedMilliseconds: 1,
          maxRssKilobytes: 1,
          cleanup: {
            gracefulTerminationSent: false,
            forceTerminationSent: false,
            exitAwaited: true,
            orphanProcessIds: [],
          },
          outcomes: shard.attempts.map(({ executionAttemptId }) => ({
            attemptId: executionAttemptId,
            classification: "system_failure" as const,
            code: "INJECTED_FAILURE",
            retryable: false,
          })),
        }
      },
    }
    const execution = await executeV138ParallelMatrix({
      inventory,
      calibration,
      runner: failedRunner,
      executionIdentityVersion: "v4",
    })
    const v4 = buildV138AuthoritativeMatrixV4Receipt({
      repoRoot,
      calibrationV3,
      execution,
    })
    expect(v4).toMatchObject({
      schemaVersion: "v1.38-current-matrix-reproduction-v4",
      status: "stopped_process_failure",
      acceptedCellCount: 0,
      fullRunLaunched: true,
      calibrationV3ReceiptRoot: calibrationV3.receiptRoot,
      executionAuthorizationExpired: true,
    })
    expect(
      v4.execution.terminals.flatMap(({ outcomes }) => outcomes).every(
        ({ attemptId }) => attemptId.startsWith("reproduction:v4:"),
      ),
    ).toBe(true)
    expect(calibrationV3.status).toBe("calibration_admitted")
    expect(v4.executionAuthorizationExpired).toBe(true)
  }, 30_000)
})

describe("v1.38 matrix successor lineage", () => {
  it("matrix calibration v2 branches bind diagnostic, authorization, and predecessor", async () => {
    const inventory = enumerateV138CurrentMatrix(repoRoot)
    const diagnostic = checkV138MatrixDiagnosticV2Receipt(
      repoRoot,
      JSON.parse(
        readFileSync(
          path.resolve(
            repoRoot,
            ".planning/artifacts/v1.38-current-matrix-diagnostic-v2.json",
          ),
          "utf8",
        ),
      ),
    )
    const calibration = await calibrateV138ParallelMatrix({
      inventory,
      policy: deriveV138ParallelCalibrationPolicy(inventory),
      runner: successfulInjectedRunner(),
      hardwareIdentity: {
        operatingSystem: "test-os",
        architecture: "test-arch",
        nodeVersion: "test-node",
        cpuIdentity: "test-cpu",
      },
      executionIdentityVersion: "v2",
    })
    const receipt = buildV138ParallelCalibrationV2SuccessorReceipt({
      repoRoot,
      diagnostic,
      authorization: parseV138SamplerAuthorization(
        "authorized-unsandboxed-ps",
      ),
      calibration,
    })

    expect(receipt).toMatchObject({
      status: "calibration_admitted",
      diagnosticV2ReceiptRoot: diagnostic.receiptRoot,
      predecessor: {
        receiptRoot:
          "sha256:99187d35b9a14e263be6cc35a6335bdd3957d5fede647345326c8e015891b280",
      },
      acceptedCellCount: 0,
      fullRunLaunched: false,
    })
    expect(
      receipt.calibration.terminals.flatMap(({ outcomes }) =>
        outcomes.map(({ attemptId }) => attemptId),
      ).every((id) => id.startsWith("calibration:v2:")),
    ).toBe(true)
  })

  it("matrix authoritative v3 receipt preserves zero publication on full-run failure", async () => {
    const inventory = enumerateV138CurrentMatrix(repoRoot)
    const diagnostic = checkV138MatrixDiagnosticV2Receipt(
      repoRoot,
      JSON.parse(
        readFileSync(
          path.resolve(
            repoRoot,
            ".planning/artifacts/v1.38-current-matrix-diagnostic-v2.json",
          ),
          "utf8",
        ),
      ),
    )
    const calibration = await calibrateV138ParallelMatrix({
      inventory,
      runner: successfulInjectedRunner(),
      hardwareIdentity: {
        operatingSystem: "test-os",
        architecture: "test-arch",
        nodeVersion: "test-node",
        cpuIdentity: "test-cpu",
      },
      executionIdentityVersion: "v2",
    })
    const calibrationV2 = buildV138ParallelCalibrationV2SuccessorReceipt({
      repoRoot,
      diagnostic,
      authorization: parseV138SamplerAuthorization(
        "authorized-unsandboxed-ps",
      ),
      calibration,
    })
    const failedRunner: V138ParallelShardRunner = {
      async run(shard) {
        return {
          shardId: shard.shardId,
          laneId: shard.laneId,
          classification: "failed",
          elapsedMilliseconds: 1,
          maxRssKilobytes: 1,
          cleanup: {
            gracefulTerminationSent: false,
            forceTerminationSent: false,
            exitAwaited: true,
            orphanProcessIds: [],
          },
          outcomes: shard.attempts.map(({ executionAttemptId }) => ({
            attemptId: executionAttemptId,
            classification: "system_failure" as const,
            code: "INJECTED_FAILURE",
            retryable: false,
          })),
        }
      },
    }
    const execution = await executeV138ParallelMatrix({
      inventory,
      calibration,
      runner: failedRunner,
      executionIdentityVersion: "v3",
    })
    const receipt = buildV138AuthoritativeMatrixV3Receipt({
      repoRoot,
      calibrationV2,
      execution,
    })

    expect(receipt).toMatchObject({
      status: "stopped_process_failure",
      acceptedCellCount: 0,
      historicalPredicateMatched: false,
      canonicalReceipt: null,
    })
    expect(receipt.execution.canonicalOutcomes).toHaveLength(16)
  }, 30_000)
})

describe("v1.38 matrix calibration receipt branches", () => {
  it("matrix supervised parallel calibration seals an admitted zero-cell successor", async () => {
    const inventory = enumerateV138CurrentMatrix(repoRoot)
    const predecessor = legacyStoppedMatrixReceipt()
    const calibration = await admittedInjectedCalibration(inventory)
    const receipt = buildV138ParallelCalibrationSuccessorReceipt({
      repoRoot,
      inventory,
      predecessor,
      calibration,
    })

    expect(receipt).toMatchObject({
      schemaVersion: "v1.38-current-matrix-reproduction-v2",
      status: "calibration_admitted",
      stage: "parallel_calibration",
      predecessorReceiptRoot: predecessor.receiptRoot,
      acceptedCellCount: 0,
      fullRunLaunched: false,
      partialAcceptedEvidenceReusable: false,
      calibration: {
        status: "admitted",
        attemptCount: 8,
        terminalShardCount: 4,
      },
    })
    expect(
      checkV138ParallelCalibrationSuccessorReceipt(
        repoRoot,
        clone(receipt),
      ),
    ).toEqual(receipt)
  })

  it("matrix calibration receipt branches preserve a stopped calibration with all attempts charged", async () => {
    const inventory = enumerateV138CurrentMatrix(repoRoot)
    const predecessor = legacyStoppedMatrixReceipt()
    const calibration = await calibrateV138ParallelMatrix({
      inventory,
      policy: deriveV138ParallelCalibrationPolicy(inventory),
      runner: successfulInjectedRunner({
        hostHeadroomBasisPoints: 2_499,
      }),
      hardwareIdentity: {
        operatingSystem: "test-os",
        architecture: "test-arch",
        nodeVersion: "test-node",
        cpuIdentity: "test-cpu",
      },
    })
    const receipt = buildV138ParallelCalibrationSuccessorReceipt({
      repoRoot,
      inventory,
      predecessor,
      calibration,
    })

    expect(receipt).toMatchObject({
      status: "stopped_process_failure",
      stage: "parallel_calibration",
      acceptedCellCount: 0,
      fullRunLaunched: false,
      chargedCalibrationAttemptCount: 8,
      calibration: {
        status: "stopped_process_failure",
      },
    })
    const mutated = clone(receipt) as any
    mutated.calibration.projection.projectedTotalMilliseconds += 1
    expect(() =>
      checkV138ParallelCalibrationSuccessorReceipt(repoRoot, mutated),
    ).toThrow("MATRIX_CALIBRATION_RECEIPT_INVALID")
  })
})

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

  it("matrix resources produce byte-identical calibration roots across completion orders", async () => {
    const inventory = enumerateV138CurrentMatrix(repoRoot)
    const policy = deriveV138ParallelCalibrationPolicy(inventory)
    const clock = { monotonicMilliseconds: () => 100 }
    const orderedRunner = (reverse: boolean): V138ParallelShardRunner => ({
      async run(shard, control) {
        const waits = reverse ? shard.ordinal : 3 - shard.ordinal
        for (let index = 0; index < waits; index += 1) {
          await Promise.resolve()
        }
        control.onResourceSample({
          childId: `child:${shard.shardId}`,
          childRssKilobytes: 100 + shard.ordinal,
          hostTotalMemoryKilobytes: 10_000,
          hostFreeMemoryKilobytes: 5_000,
        })
        return {
          shardId: shard.shardId,
          laneId: shard.laneId,
          classification: "success",
          elapsedMilliseconds: 10,
          maxRssKilobytes: 100 + shard.ordinal,
          cleanup: {
            gracefulTerminationSent: false,
            forceTerminationSent: false,
            exitAwaited: true,
            orphanProcessIds: [],
          },
          outcomes: shard.attempts.map(({ executionAttemptId }) => ({
            attemptId: executionAttemptId,
            classification: "success" as const,
            outcome: "draw" as const,
          })),
        }
      },
    })
    const hardwareIdentity = {
      operatingSystem: "test-os",
      architecture: "test-arch",
      nodeVersion: "test-node",
      cpuIdentity: "test-cpu",
    }
    const forward = await calibrateV138ParallelMatrix({
      inventory,
      policy,
      runner: orderedRunner(false),
      hardwareIdentity,
      clock,
    })
    const reverse = await calibrateV138ParallelMatrix({
      inventory,
      policy,
      runner: orderedRunner(true),
      hardwareIdentity,
      clock,
    })

    expect(reverse).toEqual(forward)
    expect(reverse.calibrationRoot).toBe(forward.calibrationRoot)
  })

  it.each([
    ["per-child exact", [2_097_152, 0, 0, 0], 2_500, "complete_pending_publication"],
    ["per-child one over", [2_097_153, 0, 0, 0], 2_500, "stopped_process_failure"],
    ["aggregate exact", [1_048_576, 1_048_576, 1_048_576, 1_048_576], 2_500, "complete_pending_publication"],
    ["aggregate one over", [1_048_577, 1_048_577, 1_048_577, 1_048_577], 2_500, "stopped_process_failure"],
    ["headroom exact", [100, 100, 100, 100], 2_500, "complete_pending_publication"],
    ["headroom one below", [100, 100, 100, 100], 2_499, "stopped_process_failure"],
  ] as const)(
    "matrix resources enforce %s",
    async (_label, childRssByOrdinal, headroom, expectedStatus) => {
      const inventory = enumerateV138CurrentMatrix(repoRoot)
      const calibration = await admittedInjectedCalibration(inventory)
      const result = await executeV138ParallelMatrix({
        inventory,
        calibration,
        runner: successfulInjectedRunner({
          childRssByOrdinal,
          hostHeadroomBasisPoints: headroom,
        }),
      })

      expect(result.status).toBe(expectedStatus)
      expect(result.accounting.acceptedCellsPublished).toBe(0)
    },
  )

  it("matrix resources stop on shard and total time limits", async () => {
    const inventory = enumerateV138CurrentMatrix(repoRoot)
    const calibration = await admittedInjectedCalibration(inventory)
    const shardTimeout = await executeV138ParallelMatrix({
      inventory,
      calibration,
      runner: successfulInjectedRunner({ elapsedMilliseconds: 600_001 }),
    })
    let now = 0
    const totalTimeout = await executeV138ParallelMatrix({
      inventory,
      calibration,
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

  it("matrix resources refuse unavailable measurements", async () => {
    const inventory = enumerateV138CurrentMatrix(repoRoot)
    const calibration = await admittedInjectedCalibration(inventory)
    const runner: V138ParallelShardRunner = {
      async run(shard, control) {
        control.onResourceSample({
          childId: `child:${shard.shardId}`,
          childRssKilobytes: -1,
          hostTotalMemoryKilobytes: 0,
          hostFreeMemoryKilobytes: 0,
        })
        return {
          shardId: shard.shardId,
          laneId: shard.laneId,
          classification: "cancelled",
          elapsedMilliseconds: 1,
          maxRssKilobytes: 0,
          cleanup: {
            gracefulTerminationSent: true,
            forceTerminationSent: false,
            exitAwaited: true,
            orphanProcessIds: [],
          },
          outcomes: shard.attempts.map(({ executionAttemptId }) => ({
            attemptId: executionAttemptId,
            classification: "cancelled" as const,
            code: "RESOURCE_MEASUREMENT_UNAVAILABLE",
          })),
        }
      },
    }
    const result = await executeV138ParallelMatrix({
      inventory,
      calibration,
      runner,
    })

    expect(result).toMatchObject({
      status: "stopped_process_failure",
      reason: "RESOURCE_MEASUREMENT_UNAVAILABLE",
      accounting: { acceptedCellsPublished: 0 },
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
    const calibration = await admittedInjectedCalibration(inventory)
    const result = await executeV138ParallelMatrix({
      inventory,
      calibration,
      runner,
    })

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

  it("matrix cleanup fails closed when any orphan or missing exit proof remains", async () => {
    const inventory = enumerateV138CurrentMatrix(repoRoot)
    const calibration = await admittedInjectedCalibration(inventory)
    const runner: V138ParallelShardRunner = {
      async run(shard) {
        return {
          shardId: shard.shardId,
          laneId: shard.laneId,
          classification: "failed",
          elapsedMilliseconds: 1,
          maxRssKilobytes: 1,
          cleanup: {
            gracefulTerminationSent: true,
            forceTerminationSent: true,
            exitAwaited: false,
            orphanProcessIds: [999_999],
          },
          outcomes: shard.attempts.map(({ executionAttemptId }) => ({
            attemptId: executionAttemptId,
            classification: "system_failure" as const,
            code: "CLEANUP_PROOF_FAILED",
            retryable: false,
          })),
        }
      },
    }
    const result = await executeV138ParallelMatrix({
      inventory,
      calibration,
      runner,
    })

    expect(result).toMatchObject({
      status: "stopped_process_failure",
      reason: "CLEANUP_PROOF_FAILED",
      accounting: {
        acceptedCellsPublished: 0,
        unlaunchedAttemptCount: 524,
      },
    })
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
      const calibration = await admittedInjectedCalibration(inventory)
      const result = await executeV138ParallelMatrix({
        inventory,
        calibration,
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
    const calibration = await admittedInjectedCalibration(inventory)
    const result = await executeV138ParallelMatrix({
      inventory,
      calibration,
      runner,
    })

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
