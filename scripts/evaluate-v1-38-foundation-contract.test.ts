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
  enumerateV138CurrentMatrix,
  type V138CurrentMatrixAttempt,
} from "./lib/v1-38-current-matrix-reproduction.js"

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
)

const clone = <T>(value: T): T =>
  JSON.parse(JSON.stringify(value)) as T

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
    const second = evaluateV138FoundationAdmission(
      clone(exactInput),
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
        nested(draft, "semanticAuthority").tupleId =
          `sha256:${"0".repeat(64)}`
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
        nested(draft, "correctionLineage").implementationCommit =
          "0".repeat(40)
      },
    ],
  ] as const)(
    "admission stops for %s",
    (_label, reason, applyMutation) => {
      const result = evaluateV138FoundationAdmission(
        mutate(exactInput, applyMutation),
      )

      expect(result).toMatchObject({
        status: "stopped_integrity_foundation",
        reason,
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
      attempts.map(({ leftDefinitionId, rightDefinitionId }) =>
        `${leftDefinitionId}\0${rightDefinitionId}`,
      ),
    )

    expect(inventory.schemaVersion).toBe(
      "v1.38-current-matrix-inventory-v1",
    )
    expect(inventory.fixturePurpose).toBe("regression_throughput_only")
    expect(inventory.definitions).toHaveLength(10)
    expect(unorderedPairs).toHaveLength(45)
    expect(inventory.arenas.map(({ historicalLabel }) => historicalLabel)).toEqual([
      "Smoke",
      "Standard Cross",
      "Open Field",
    ])
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
    expect(new Set(inventory.arenas.map(({ semanticGeometryHash }) => semanticGeometryHash)))
      .toHaveLength(2)
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
              initialInitiativeEntrantKey:
                attempt.initialInitiativeEntrantId,
            },
          },
          strategies: {
            bottom: {
              metadata: {
                tags: expect.arrayContaining([
                  "regression_throughput_only",
                ]),
              },
            },
            top: {
              metadata: {
                tags: expect.arrayContaining([
                  "regression_throughput_only",
                ]),
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
})
