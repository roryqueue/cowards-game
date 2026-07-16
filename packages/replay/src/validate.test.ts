import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import type {
  Chronicle,
  ChronicleBoundarySnapshot,
  ChronicleEvent,
  ChronicleValidationErrorCode,
  JsonValue,
  SoldierBrainInput,
  StrategyInput,
} from "@cowards/spec"
import {
  CANONICAL_COMPATIBILITY_TUPLES,
  HISTORICAL_RUNTIME_V114_SEMANTIC_TUPLE,
  HISTORICAL_RUNTIME_V114_SEMANTIC_TUPLE_ID,
  ChronicleValidationErrorCodeSchema,
  COMPATIBILITY_VERSIONS,
  createMatchExecutionExactEvidenceV137,
} from "@cowards/spec"
import { describe, expect, it } from "vitest"
import { MATCH_KERNEL, type StrategyRuntime } from "@cowards/engine"
import { adaptRuntimeForCurrentKernel } from "@cowards/engine/test/current-kernel-runtime"
import { createChronicleContentHash } from "./hash.js"
import { projectOwnerChronicle } from "./project.js"
import { recordChronicleFromExecution } from "./record.js"
import {
  migrateChronicle,
  resolveReplayCompatibilityIdentity,
  validateCurrentChronicle,
  validateCurrentChronicleSemantics,
  validateChronicle,
  validateHistoricalV14Chronicle,
  validateReplayInput,
} from "./validate.js"

const asJson = (value: unknown): JsonValue => value as JsonValue

const runtime: StrategyRuntime = {
  selectActivations(input: StrategyInput) {
    return {
      ok: true,
      value: {
        activationOrders: input.mySoldiers
          .filter((soldier) => soldier.status === "ACTIVE")
          .map((soldier) => ({ soldierId: soldier.id })),
        strategyMemory: {},
      },
    }
  },
  runSoldierBrain(_input: SoldierBrainInput) {
    return {
      ok: true,
      value: {
        action: { type: "TURN_TO_STONE" },
        soldierMemory: {},
      },
    }
  },
}

const passiveRuntime: StrategyRuntime = {
  selectActivations() {
    return {
      ok: true,
      value: { activationOrders: [], strategyMemory: {} },
    }
  },
  runSoldierBrain() {
    return {
      ok: true,
      value: {
        action: { type: "TURN", direction: "RIGHT" },
        soldierMemory: {},
      },
    }
  },
}

const playerViolationRuntime: StrategyRuntime = {
  selectActivations(input) {
    return input.mySoldiers[0]?.ownerPlayerId === "bottom"
      ? {
          ok: false,
          violation: {
            type: "INVALID_OUTPUT",
            message: "fixture player violation",
          },
        }
      : {
          ok: true,
          value: { activationOrders: [], strategyMemory: {} },
        }
  },
  runSoldierBrain() {
    return {
      ok: false,
      violation: {
        type: "INVALID_OUTPUT",
        message: "fixture player violation",
      },
    }
  },
}

const createCurrentReplayInput = (
  candidateRuntime: StrategyRuntime = runtime,
  overrides: { readonly matchId?: string; readonly maxPhases?: number } = {},
) => {
  const execution = MATCH_KERNEL.runMatch({
    matchId: overrides.matchId ?? "validation-match",
    seed: "validation-seed",
    arenaVariant: {
      id: "arena",
      name: "Arena",
      initialBounds: { minX: 0, maxX: 11, minY: 0, maxY: 11 },
      terrainStones: [],
    },
    bottomPlayerId: "bottom",
    topPlayerId: "top",
    bottomStrategyRevisionId: "bottom-rev",
    topStrategyRevisionId: "top-rev",
    runtime: adaptRuntimeForCurrentKernel(candidateRuntime),
    ...(overrides.maxPhases === undefined
      ? {}
      : { maxPhases: overrides.maxPhases }),
  })
  const recorded = recordChronicleFromExecution({
    execution,
    metadata: {
      schemaVersion: "chronicle-v1.4",
      semanticTupleId: MATCH_KERNEL.tupleId,
      semanticTuple: MATCH_KERNEL.tuple,
    },
  })
  if (!recorded.ok) throw new Error(recorded.failure.code)
  return {
    profile: "current-exact" as const,
    compatibility: recorded.semanticIdentity,
    chronicle: recorded.chronicle,
    boundaryAnchors: recorded.boundaryAnchors,
    execution,
  }
}

const createChronicle = () => createCurrentReplayInput().chronicle

const createExecutionEvidence = (
  matchId: string,
  status: "exhibition_only" | "counted" = "exhibition_only",
) => {
  const registered = CANONICAL_COMPATIBILITY_TUPLES[0]!
  const entrant = (side: "bottom" | "top") => ({
    entrantKey: `entrant:${side}`,
    strategyRevisionId: `${side}-rev`,
    laneIdentity: {
      providerId: `provider:${side}`,
      languageId: "typescript",
      runtimeId: "runtime:node",
      runtimeVersion: "1.0.0",
      toolchainId: "toolchain:typescript",
      toolchainVersion: "1.0.0",
      adapterId: "adapter:node",
      adapterVersion: "1.0.0",
      policyId: "package-none",
      policyVersion: "1.0.0",
      corpusId: "corpus:v1.37",
      corpusVersion: "1.0.0",
      artifactId: `artifact:${side}`,
      artifactSha256: `${side}:artifact:hash`,
      implementationId: `implementation:${side}`,
      buildId: `build:${side}`,
      semanticTupleId: registered.tupleId,
      semanticTuple: { ...registered.tuple },
    },
    containmentCertificateRef: {
      kind: "containment" as const,
      certificateId: `containment:${side}`,
      certificateVersion: "1.0.0",
      certificateRecordHash: `containment:${side}:hash`,
      registryGeneration: "registry-generation:1",
    },
    ...(status === "counted"
      ? {
          conformanceCertificateRef: {
            kind: "conformance" as const,
            certificateId: `conformance:${side}`,
            certificateVersion: "1.0.0",
            certificateRecordHash: `conformance:${side}:hash`,
            registryGeneration: "registry-generation:1",
          },
        }
      : {}),
    schedulingDecision: {
      status,
      reasonCode:
        status === "counted"
          ? ("EVIDENCE_CURRENT" as const)
          : ("CONFORMANCE_UNVERIFIABLE" as const),
      evaluatedAt: "2026-07-13T00:00:00.000Z",
      freshUntil: "2026-08-13T00:00:00.000Z",
      registryGeneration: "registry-generation:1",
    },
  })
  return createMatchExecutionExactEvidenceV137({
    matchId,
    bottomEntrantKey: "entrant:bottom",
    topEntrantKey: "entrant:top",
    evidenceSnapshot: {
      compatibility: {
        tupleId: registered.tupleId,
        tuple: { ...registered.tuple },
      },
      authorityBundleHash: "authority-bundle-hash:v1",
      registryGeneration: "registry-generation:1",
      entrants: {
        bottom: entrant("bottom"),
        top: entrant("top"),
      },
    },
  })
}

const errorCodes = (value: unknown) => {
  const result = validateChronicle(value)
  return result.ok ? [] : result.errors.map((error) => error.code)
}

const cloneChronicle = (chronicle: Chronicle): Chronicle =>
  JSON.parse(JSON.stringify(chronicle)) as Chronicle

const mutateFirstEvent = (
  chronicle: Chronicle,
  predicate: (event: ChronicleEvent) => boolean,
  mutate: (event: ChronicleEvent) => ChronicleEvent,
): Chronicle => {
  let mutated = false
  return {
    ...chronicle,
    events: chronicle.events.map((event) => {
      if (mutated || !predicate(event)) {
        return event
      }
      mutated = true
      return mutate(event)
    }),
  }
}

const mutateFirstSnapshot = (
  chronicle: Chronicle,
  predicate: (snapshot: ChronicleBoundarySnapshot) => boolean,
  mutate: (snapshot: ChronicleBoundarySnapshot) => ChronicleBoundarySnapshot,
): Chronicle => {
  let mutated = false
  return {
    ...chronicle,
    snapshots: chronicle.snapshots.map((snapshot) => {
      if (mutated || !predicate(snapshot)) {
        return snapshot
      }
      mutated = true
      return mutate(snapshot)
    }),
  }
}

const grammarErrorCodes = [
  "EVENT_WINDOW_INVALID",
  "CONTEXT_MISSING",
  "CONTEXT_MISMATCH",
  "PAYLOAD_INCONSISTENT",
  "SNAPSHOT_BOUNDARY_INVALID",
] as const satisfies readonly ChronicleValidationErrorCode[]

const withHistoricalPushAttempt = (chronicle: Chronicle): Chronicle => {
  const actionIndex = chronicle.events.findIndex(
    ({ type }) => type === "ACTION_EMITTED",
  )
  const action = chronicle.events[actionIndex]!
  const insertionSequence = action.sequence + 1
  return {
    ...chronicle,
    reproducibility: {
      ...chronicle.reproducibility,
      versions: {
        spec: "cowards-rules-v1.4",
        engine: "0.1.4",
        runtimeJs: "0.1.0",
        chronicle: "chronicle-v1.4",
        strategyRevision: "0.1.4",
        arenaVariant: "0.1.0",
      },
    },
    events: [
      ...chronicle.events.slice(0, insertionSequence),
      {
        type: "PUSH_ATTEMPTED",
        sequence: insertionSequence,
        context: { ...action.context },
        privacy: "public",
        payload: {
          soldierId: action.context.soldierId!,
          targetSoldierId: "historical-target",
        },
      },
      ...chronicle.events
        .slice(insertionSequence)
        .map((event) => ({ ...event, sequence: event.sequence + 1 })),
    ],
    snapshots: chronicle.snapshots.map((snapshot) => ({
      ...snapshot,
      sequence:
        snapshot.sequence >= insertionSequence
          ? snapshot.sequence + 1
          : snapshot.sequence,
    })),
  }
}

describe("validateChronicle", () => {
  it("keeps current semantic admission acyclic and single-invocation", () => {
    const input = createCurrentReplayInput()
    const validateSource = readFileSync(
      new URL("./validate.ts", import.meta.url),
      "utf8",
    )
    const reconstructSource = readFileSync(
      new URL("./reconstruct.ts", import.meta.url),
      "utf8",
    )

    expect(validateCurrentChronicleSemantics(input)).toEqual(
      validateCurrentChronicle(input),
    )
    expect(validateSource).not.toContain("validateCurrentReplayReconstruction")
    expect(
      validateSource.match(/validateCurrentChronicleSemantics\(/gu) ?? [],
    ).toHaveLength(1)
    expect(
      reconstructSource.match(/validateCurrentChronicleSemantics\(/gu) ?? [],
    ).toHaveLength(1)
    expect(
      validateSource.match(/validateCurrentTransitionPostconditions\(/gu) ?? [],
    ).toHaveLength(1)
    expect(
      reconstructSource.match(/validateCurrentTransitionPostconditions\(/gu) ??
        [],
    ).toHaveLength(1)
  })

  it("routes exact current evidence as current and publishable", () => {
    const input = createCurrentReplayInput()

    expect(validateCurrentChronicle(input)).toEqual({
      ok: true,
      profile: "current-exact",
      publishable: true,
      current: true,
      issues: [],
      truncated: false,
    })
    expect(validateReplayInput(input)).toEqual(validateCurrentChronicle(input))
    expect(
      resolveReplayCompatibilityIdentity({
        profile: "current-exact",
        compatibility: input.compatibility,
        chronicle: input.chronicle,
      }),
    ).toEqual({
      status: "current_exact",
      tupleId: MATCH_KERNEL.tupleId,
    })
  })

  it("accepts a passive empty-selection Match that reaches Contraction without an Activation window", () => {
    const input = createCurrentReplayInput(passiveRuntime, {
      matchId: "validation-passive-contraction",
      maxPhases: 1,
    })
    const eventTypes = input.chronicle.events.map(({ type }) => type)

    expect(eventTypes).toContain("CONTRACTION_RESOLVED")
    expect(eventTypes).not.toContain("ACTIVATION_STARTED")
    expect(eventTypes).not.toContain("AWARENESS_GRID_OBSERVED")
    expect(eventTypes).not.toContain("ACTION_EMITTED")
    expect(validateCurrentChronicle(input)).toEqual({
      ok: true,
      profile: "current-exact",
      publishable: true,
      current: true,
      issues: [],
      truncated: false,
    })
  })

  it("accepts recorder-bound player violations with owner-private evidence", () => {
    const input = createCurrentReplayInput(playerViolationRuntime, {
      matchId: "validation-player-violation",
      maxPhases: 1,
    })

    expect(input.chronicle.events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "RUNTIME_VIOLATION",
          privacy: "owner",
          privateRef: expect.stringMatching(/^private:event:/u),
        }),
      ]),
    )
    expect(validateCurrentChronicle(input)).toEqual({
      ok: true,
      profile: "current-exact",
      publishable: true,
      current: true,
      issues: [],
      truncated: false,
    })
  })

  it("rejects owner-private relabeling before it can leak through owner projection", () => {
    const input = createCurrentReplayInput()
    const bottomPrivate = input.chronicle.private?.byPlayerId.bottom ?? {}
    const topPrivate =
      (input.chronicle.private?.byPlayerId.top as
        | Record<string, JsonValue>
        | undefined) ?? {}
    const [privateRef, privatePayload] = Object.entries(bottomPrivate)[0] ?? []
    expect(privateRef).toBeDefined()
    const relabeled = {
      ...input.chronicle,
      private: {
        byPlayerId: {
          ...(input.chronicle.private?.byPlayerId ?? {}),
          bottom: Object.fromEntries(
            Object.entries(bottomPrivate).filter(([ref]) => ref !== privateRef),
          ),
          top: {
            ...topPrivate,
            [privateRef!]: privatePayload!,
          },
        },
      },
    }
    const forged = {
      ...relabeled,
      integrity: createChronicleContentHash(relabeled),
    }
    expect(JSON.stringify(projectOwnerChronicle(forged, "top"))).toContain(
      privateRef,
    )
    expect(
      validateCurrentChronicle({ ...input, chronicle: forged }),
    ).toMatchObject({
      ok: false,
      issues: [{ code: "CURRENT_EVENT_INVALID" }],
    })
  })

  it("rejects forged event context even when public event identity is unchanged", () => {
    const input = createCurrentReplayInput()
    const events = input.chronicle.events.map((event) =>
      event.type === "MATCH_STARTED"
        ? { ...event, context: { actingPlayerId: "top" } }
        : event,
    )
    expect(
      validateCurrentChronicle({
        ...input,
        chronicle: { ...input.chronicle, events },
      }),
    ).toMatchObject({
      ok: false,
      issues: [{ code: "CURRENT_EVENT_INVALID" }],
    })
  })

  it("rejects swapped and renumbered snapshots and anchors that no longer match recorder order", () => {
    const input = createCurrentReplayInput()
    const snapshots = input.chronicle.snapshots.map((snapshot) =>
      globalThis.structuredClone(snapshot),
    )
    const anchors = input.boundaryAnchors.map((anchor) =>
      globalThis.structuredClone(anchor),
    )
    expect(snapshots.length).toBeGreaterThan(2)
    ;[snapshots[1], snapshots[2]] = [snapshots[2]!, snapshots[1]!]
    ;[anchors[1], anchors[2]] = [anchors[2]!, anchors[1]!]
    const boundaryAnchors = anchors.map((anchor, snapshotIndex) => ({
      ...anchor,
      snapshotIndex,
    }))
    const chronicleWithoutIntegrity = {
      ...input.chronicle,
      snapshots,
      integrity: undefined,
    }
    const chronicle = {
      ...chronicleWithoutIntegrity,
      integrity: createChronicleContentHash(chronicleWithoutIntegrity),
    }

    expect(
      validateCurrentChronicle({
        ...input,
        chronicle,
        boundaryAnchors,
      }),
    ).toMatchObject({
      ok: false,
      issues: [{ code: "CURRENT_BOUNDARY_STATE_INVALID" }],
    })
  })

  it("rejects in-place initiative drift despite recomputed public hashes", () => {
    const input = createCurrentReplayInput()
    if (input.execution.kind !== "completed") throw new Error("not completed")
    const transition = input.execution.transitions[0]!
    const beforeState = transition.beforeState as Record<string, unknown>
    beforeState.initiativePlayerId = "top"
    ;(transition as { beforeStateHash: string }).beforeStateHash =
      `sha256:${createHash("sha256")
        .update("cowards-game:candidate-game-state-projection:v1\0", "utf8")
        .update(JSON.stringify(beforeState), "utf8")
        .digest("hex")}`
    ;(
      input.execution.recorderMaterial as { integrityHash: string }
    ).integrityHash = `sha256:${"f".repeat(64)}`

    expect(validateCurrentChronicle(input)).toMatchObject({
      ok: false,
      issues: [{ code: "CURRENT_BOUNDARY_HASH_INVALID" }],
    })
  })

  it.each([
    "MATCH_STARTED",
    "ROUND_STARTED",
    "STRATEGY_EVALUATED",
    "MATCH_ENDED",
  ] as const)("rejects a candidate missing universal %s evidence", (type) => {
    const input = createCurrentReplayInput()
    const result = validateCurrentChronicle({
      ...input,
      chronicle: {
        ...input.chronicle,
        events: input.chronicle.events.filter((event) => event.type !== type),
      },
    })

    expect(result.ok).toBe(false)
    expect(!result.ok && result.issues.map(({ code }) => code)).toEqual([
      "CURRENT_EVENT_INVALID",
    ])
  })

  it("keeps the legacy PUSH_ATTEMPTED tail only on explicit active and historical routes", () => {
    const input = createCurrentReplayInput()
    const historical = withHistoricalPushAttempt(input.chronicle)

    expect(validateChronicle(historical)).toMatchObject({
      ok: false,
      errors: [{ code: "SCHEMA_INVALID" }],
    })
    expect(validateHistoricalV14Chronicle(historical)).toEqual({ ok: true })
    const candidate = validateCurrentChronicle({
      ...input,
      chronicle: historical,
    })
    expect(candidate.ok).toBe(false)
    expect(!candidate.ok && candidate.issues.map(({ code }) => code)).toEqual([
      "CURRENT_SHAPE_INVALID",
    ])
  })

  it.each([
    "rules",
    "engine",
    "runtimeAbi",
    "chronicle",
    "arenaCatalog",
    "setPolicy",
  ] as const)(
    "rejects candidate %s identity drift with candidate-only codes",
    (field) => {
      const input = createCurrentReplayInput()
      const result = validateCurrentChronicle({
        ...input,
        compatibility: {
          ...input.compatibility,
          tuple: { ...input.compatibility.tuple, [field]: `${field}:wrong` },
        },
      })
      const routed = validateReplayInput({
        ...input,
        compatibility: {
          ...input.compatibility,
          tuple: { ...input.compatibility.tuple, [field]: `${field}:wrong` },
        },
      })

      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.issues.map(({ code }) => code)).toEqual([
        "CURRENT_TUPLE_INVALID",
      ])
      expect(result).toMatchObject({
        category: "CANONICAL_INTEGRITY_FAILURE",
        ownership: "system_integrity",
        current: true,
        publishable: false,
      })
      expect(routed).toEqual(result)
      expect(JSON.stringify(result)).not.toContain("ChronicleValidationError")
    },
  )

  it("rejects the first invalid candidate state with bounded semantic codes", () => {
    const input = createCurrentReplayInput()
    if (input.execution.kind !== "completed") throw new Error("not completed")
    const initialState = globalThis.structuredClone(
      input.execution.recorderMaterial.initialState,
    )
    initialState.arenaVariant.terrainStones.push({ x: 2, y: 11 })
    const execution = {
      ...input.execution,
      recorderMaterial: {
        ...input.execution.recorderMaterial,
        initialState,
      },
    }
    const result = validateCurrentChronicle({ ...input, execution })

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.issues.map(({ code }) => code)).toContain(
      "CURRENT_BOUNDARY_HASH_INVALID",
    )
    expect(result.issues.length).toBeLessThanOrEqual(16)
    expect(result.issues.every(({ path }) => path.length <= 8)).toBe(true)
  })

  it("admits the exact current tuple independent of JSON object key order", () => {
    const input = createCurrentReplayInput()
    const tuple = input.compatibility.tuple
    const reorderedTuple = {
      arenaCatalog: tuple.arenaCatalog,
      chronicle: tuple.chronicle,
      engine: tuple.engine,
      rules: tuple.rules,
      runtimeAbi: tuple.runtimeAbi,
      setPolicy: tuple.setPolicy,
    }
    const reordered = {
      ...input,
      compatibility: {
        tupleId: input.compatibility.tupleId,
        tuple: reorderedTuple,
      },
    }

    expect(validateCurrentChronicle(reordered)).toEqual({
      ok: true,
      profile: "current-exact",
      publishable: true,
      current: true,
      issues: [],
      truncated: false,
    })
    expect(
      resolveReplayCompatibilityIdentity({
        profile: reordered.profile,
        compatibility: reordered.compatibility,
        chronicle: reordered.chronicle,
      }),
    ).toEqual({
      status: "current_exact",
      tupleId: input.compatibility.tupleId,
    })
  })

  it("atomically validates current tuples while preserving explicit historical dispatch", () => {
    const chronicle = createChronicle()
    const registered = CANONICAL_COMPATIBILITY_TUPLES[0]!
    const current = {
      profile: "current-exact" as const,
      compatibility: {
        tupleId: registered.tupleId,
        tuple: { ...registered.tuple },
      },
      chronicle,
    }

    expect(validateReplayInput(current)).toEqual({ ok: true })
    expect(resolveReplayCompatibilityIdentity(current)).toMatchObject({
      status: "current_exact",
      tupleId: registered.tupleId,
    })
    const exhibitionEvidence = createExecutionEvidence(
      chronicle.reproducibility.matchId,
    )
    expect(
      validateReplayInput({
        ...current,
        executionEvidence: exhibitionEvidence,
      }),
    ).toEqual({ ok: true })
    expect(
      validateReplayInput({
        ...current,
        executionEvidence: createExecutionEvidence(
          chronicle.reproducibility.matchId,
          "counted",
        ),
      }),
    ).toEqual({ ok: true })
    expect(
      validateReplayInput({
        ...current,
        executionEvidence: {
          ...exhibitionEvidence,
          evidenceSnapshot: {
            ...exhibitionEvidence.evidenceSnapshot,
            entrants: {
              ...exhibitionEvidence.evidenceSnapshot.entrants,
              bottom: {
                ...exhibitionEvidence.evidenceSnapshot.entrants.bottom,
                schedulingDecision: {
                  ...exhibitionEvidence.evidenceSnapshot.entrants.bottom
                    .schedulingDecision,
                  status: "counted",
                  reasonCode: "EVIDENCE_CURRENT",
                },
              },
            },
          },
        },
      }),
    ).toMatchObject({
      ok: false,
      errors: [expect.objectContaining({ code: "VERSION_INCOMPATIBLE" })],
    })
    expect(
      validateReplayInput({
        ...current,
        executionEvidence: {
          ...exhibitionEvidence,
          matchId: "match:other",
        },
      }),
    ).toMatchObject({
      ok: false,
      errors: [expect.objectContaining({ code: "VERSION_INCOMPATIBLE" })],
    })
    expect(
      validateReplayInput({
        ...current,
        compatibility: {
          ...current.compatibility,
          tuple: { ...current.compatibility.tuple, engine: "engine:latest" },
        },
      }),
    ).toMatchObject({
      ok: false,
      errors: [expect.objectContaining({ code: "VERSION_INCOMPATIBLE" })],
    })
    expect(
      validateReplayInput({ profile: "current-exact", chronicle }),
    ).toMatchObject({
      ok: false,
      errors: [expect.objectContaining({ code: "VERSION_INCOMPATIBLE" })],
    })

    const historicalChronicle = {
      ...chronicle,
      reproducibility: {
        ...chronicle.reproducibility,
        versions: {
          spec: "cowards-rules-v1.4",
          engine: "0.1.4",
          runtimeJs: "0.1.0",
          chronicle: "chronicle-v1.4",
          strategyRevision: "0.1.4",
          arenaVariant: "0.1.0",
        },
      },
    }
    const historical = {
      profile: "historical-v1.4" as const,
      chronicle: historicalChronicle,
    }
    const before = JSON.stringify(historical)
    expect(validateReplayInput(historical)).toEqual({ ok: true })
    expect(validateHistoricalV14Chronicle(historicalChronicle)).toEqual({
      ok: true,
    })
    expect(resolveReplayCompatibilityIdentity(historical)).toEqual({
      status: "historical_original_semantics",
      tupleResolution: "unresolved_legacy",
    })
    expect(JSON.stringify(historical)).toBe(before)

    const historicalV116 = {
      profile: "historical-v1.16" as const,
      compatibility: {
        tupleId: HISTORICAL_RUNTIME_V114_SEMANTIC_TUPLE_ID,
        tuple: { ...HISTORICAL_RUNTIME_V114_SEMANTIC_TUPLE },
      },
      chronicle: historicalChronicle,
    }
    expect(validateReplayInput(historicalV116)).toEqual({ ok: true })
    expect(resolveReplayCompatibilityIdentity(historicalV116)).toEqual({
      status: "historical_v1_16_exact",
      tupleId: HISTORICAL_RUNTIME_V114_SEMANTIC_TUPLE_ID,
      tupleResolution: "resolved_v1.16",
    })
    expect(
      validateReplayInput({
        ...historicalV116,
        compatibility: {
          ...historicalV116.compatibility,
          tuple: {
            ...historicalV116.compatibility.tuple,
            runtimeAbi: "strategy-runtime-abi-v1.17",
          },
        },
      }),
    ).toMatchObject({
      ok: false,
      errors: [expect.objectContaining({ code: "VERSION_INCOMPATIBLE" })],
    })
  })

  it("keeps exact historical-v1.16 admission isolated from mutable current schema and grammar", () => {
    const current = createCurrentReplayInput()
    const historicalChronicle = withHistoricalPushAttempt(current.chronicle)
    const input = {
      profile: "historical-v1.16" as const,
      compatibility: {
        tupleId: HISTORICAL_RUNTIME_V114_SEMANTIC_TUPLE_ID,
        tuple: { ...HISTORICAL_RUNTIME_V114_SEMANTIC_TUPLE },
      },
      chronicle: historicalChronicle,
    }
    const before = JSON.stringify(input)

    expect(validateChronicle(historicalChronicle)).toMatchObject({
      ok: false,
      errors: [{ code: "SCHEMA_INVALID" }],
    })
    expect(validateHistoricalV14Chronicle(historicalChronicle)).toEqual({
      ok: true,
    })
    expect(validateReplayInput(input)).toEqual({ ok: true })
    expect(JSON.stringify(input)).toBe(before)
  })

  it("routes original historical evidence only through the frozen grammar without requiring current snapshots", () => {
    const current = createCurrentReplayInput()
    const historicalChronicle = {
      ...current.chronicle,
      reproducibility: {
        ...current.chronicle.reproducibility,
        versions: {
          spec: "cowards-rules-v1.4",
          engine: "0.1.4",
          runtimeJs: "0.1.0",
          chronicle: "chronicle-v1.4",
          strategyRevision: "0.1.4",
          arenaVariant: "0.1.0",
        },
      },
      snapshots: [],
    }
    const input = {
      profile: "historical-v1.4" as const,
      chronicle: historicalChronicle,
    }
    const before = JSON.stringify(input)

    expect(validateReplayInput(input)).toEqual({ ok: true })
    expect(JSON.stringify(input)).toBe(before)
  })

  it("rejects an unknown current tuple before reading or probing Chronicle bytes", () => {
    const current = createCurrentReplayInput()
    let chronicleReads = 0
    const input = {
      profile: "current-exact" as const,
      compatibility: {
        ...current.compatibility,
        tupleId: `sha256:${"0".repeat(64)}`,
      },
      get chronicle(): Chronicle {
        chronicleReads += 1
        throw new Error("Chronicle parser probing is forbidden.")
      },
    }

    expect(validateReplayInput(input)).toMatchObject({
      ok: false,
      errors: [{ code: "VERSION_INCOMPATIBLE" }],
    })
    expect(chronicleReads).toBe(0)
  })

  it("accepts a valid Chronicle with matching integrity", () => {
    const chronicle = createChronicle()
    const withIntegrity = {
      ...chronicle,
      integrity: createChronicleContentHash(chronicle),
    }

    expect(validateChronicle(withIntegrity)).toEqual({ ok: true })
  })

  it("accepts grammar-specific validation codes in the schema contract", () => {
    for (const code of grammarErrorCodes) {
      expect(ChronicleValidationErrorCodeSchema.parse(code)).toBe(code)
    }
  })

  it("returns typed schema and version errors", () => {
    expect(errorCodes({ schemaVersion: "chronicle-v1" })).toContain(
      "VERSION_INCOMPATIBLE",
    )
    expect(migrateChronicle({ schemaVersion: "chronicle-v1" })).toMatchObject({
      code: "UNSUPPORTED_MIGRATION",
    })
    expect(
      errorCodes({ ...createChronicle(), schemaVersion: "chronicle-v0" }),
    ).toContain("VERSION_INCOMPATIBLE")
    expect(
      migrateChronicle({
        schemaVersion: "chronicle-v0",
        events: [],
      }),
    ).toMatchObject({ code: "UNSUPPORTED_MIGRATION" })
  })

  it("keeps malformed shape diagnostics under SCHEMA_INVALID issue details", () => {
    const result = validateChronicle({ schemaVersion: "chronicle-v1.4" })

    expect(result.ok).toBe(false)
    if (result.ok) {
      return
    }
    expect(result.errors[0]).toMatchObject({
      code: "SCHEMA_INVALID",
      message: "Chronicle does not match the canonical schema.",
    })
    expect(result.errors[0]?.actual).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "reproducibility",
          message: expect.any(String),
        }),
      ]),
    )
  })

  it("returns semantic validation errors during current-version migration", () => {
    const chronicle = createChronicle()

    expect(
      migrateChronicle(
        asJson({
          ...chronicle,
          events: chronicle.events.map((event, index) =>
            index === 1 ? { ...event, sequence: 3 } : event,
          ),
        }),
      ),
    ).toMatchObject({ code: "EVENT_ORDER_INVALID" })
    expect(
      migrateChronicle(
        asJson({
          ...chronicle,
          snapshots: chronicle.snapshots.filter(
            (snapshot) => snapshot.kind !== "TERMINAL",
          ),
        }),
      ),
    ).toMatchObject({ code: "SNAPSHOT_MISSING" })
    expect(
      migrateChronicle(
        asJson({
          ...chronicle,
          integrity: { algorithm: "sha256", normalizedContentHash: "stale" },
        }),
      ),
    ).toMatchObject({ code: "HASH_MISMATCH" })
  })

  it("uses stable validation codes for current-version semantic failures", () => {
    const chronicle = createChronicle()
    const result = validateChronicle({
      ...chronicle,
      events: chronicle.events.map((event, index) =>
        index === 1 ? { ...event, sequence: 3 } : event,
      ),
    })

    expect(result.ok).toBe(false)
    if (result.ok) {
      return
    }
    expect(result.errors[0]).toMatchObject({
      code: "EVENT_ORDER_INVALID",
      message: expect.any(String),
    })
    expect(result.errors[0]?.code).not.toContain("Expected")
  })

  it("rejects corrupted replay-driving event payloads during validation", () => {
    const chronicle = createChronicle()
    const corruptedPayloadCases = [
      {
        type: "MOVE_ADVANCED",
        payload: { soldierId: "bottom-soldier-1" },
      },
      {
        type: "PUSH_RESOLVED",
        payload: { soldierId: "bottom-soldier-1", pushedOffBoard: false },
      },
      {
        type: "SOLDIER_FELL",
        payload: { reason: "MOVED_OFF_BOARD" },
      },
      {
        type: "MATCH_ENDED",
        payload: { type: "WIN" },
      },
    ]

    for (const corrupted of corruptedPayloadCases) {
      expect(
        errorCodes({
          ...chronicle,
          events: [
            {
              ...chronicle.events[0],
              ...corrupted,
            },
            ...chronicle.events.slice(1),
          ],
        }),
      ).toContain("SCHEMA_INVALID")
    }
  })

  it.each(
    Object.keys(COMPATIBILITY_VERSIONS) as Array<
      keyof typeof COMPATIBILITY_VERSIONS
    >,
  )("detects incompatible %s versions", (versionKey) => {
    const chronicle = createChronicle()
    const actual = `${COMPATIBILITY_VERSIONS[versionKey]}-unsupported`

    const result = validateChronicle({
      ...chronicle,
      reproducibility: {
        ...chronicle.reproducibility,
        versions: { ...COMPATIBILITY_VERSIONS, [versionKey]: actual },
      },
    })

    expect(result.ok).toBe(false)
    if (result.ok) {
      return
    }
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        code: "VERSION_INCOMPATIBLE",
        message: `Unsupported ${versionKey} version.`,
        expected: COMPATIBILITY_VERSIONS[versionKey],
        actual,
      }),
    )
  })

  it("keeps current compatibility versions accepted", () => {
    const chronicle = createChronicle()

    expect(
      validateChronicle({
        ...chronicle,
        reproducibility: {
          ...chronicle.reproducibility,
          versions: COMPATIBILITY_VERSIONS,
        },
      }),
    ).toEqual({ ok: true })
  })

  it("detects event order, required event, snapshot, and hash failures", () => {
    const chronicle = createChronicle()
    const withIntegrity = {
      ...chronicle,
      integrity: createChronicleContentHash(chronicle),
    }

    expect(
      errorCodes({
        ...chronicle,
        events: chronicle.events.map((event, index) =>
          index === 1 ? { ...event, sequence: 3 } : event,
        ),
      }),
    ).toContain("EVENT_ORDER_INVALID")

    expect(
      errorCodes({
        ...chronicle,
        events: chronicle.events.filter(
          (event) => event.type !== "ACTION_EMITTED",
        ),
      }),
    ).toContain("REQUIRED_EVENT_MISSING")

    expect(
      errorCodes({
        ...chronicle,
        snapshots: chronicle.snapshots.filter(
          (snapshot) => snapshot.kind !== "TERMINAL",
        ),
      }),
    ).toContain("SNAPSHOT_MISSING")

    expect(
      errorCodes({
        ...withIntegrity,
        events: [
          {
            ...withIntegrity.events[0],
            payload: { matchId: "tampered", seed: "validation-seed" },
          },
          ...withIntegrity.events.slice(1),
        ],
      }),
    ).toContain("HASH_MISMATCH")
  })

  it("requires every Round boundary snapshot instance", () => {
    const chronicle = createChronicle()
    const firstRoundEnd = chronicle.snapshots.findIndex(
      (snapshot) => snapshot.kind === "ROUND_END",
    )

    expect(firstRoundEnd).toBeGreaterThanOrEqual(0)
    expect(
      errorCodes({
        ...chronicle,
        snapshots: chronicle.snapshots.filter(
          (snapshot, index) =>
            snapshot.kind !== "ROUND_END" || index === firstRoundEnd,
        ),
      }),
    ).toContain("SNAPSHOT_MISSING")
  })

  it.each([
    {
      name: "corrupted event order",
      mutate(chronicle: Chronicle): Chronicle {
        return {
          ...chronicle,
          events: chronicle.events.map((event, index) =>
            index === 1 ? { ...event, sequence: 3 } : event,
          ),
        }
      },
      code: "EVENT_ORDER_INVALID",
    },
    {
      name: "event grammar failure",
      mutate(chronicle: Chronicle): Chronicle {
        return mutateFirstEvent(
          cloneChronicle(chronicle),
          (event) => event.type === "ACTION_EMITTED",
          (event) => ({
            ...event,
            context: { ...event.context, cycleIndex: 1 },
          }),
        )
      },
      code: "CONTEXT_MISMATCH",
    },
    {
      name: "snapshot boundary failure",
      mutate(chronicle: Chronicle): Chronicle {
        return mutateFirstSnapshot(
          cloneChronicle(chronicle),
          (snapshot) => snapshot.kind === "ROUND_START",
          (snapshot) => ({ ...snapshot, sequence: 0 }),
        )
      },
      code: "SNAPSHOT_BOUNDARY_INVALID",
    },
    {
      name: "impossible snapshot transition",
      mutate(chronicle: Chronicle): Chronicle {
        return mutateFirstSnapshot(
          cloneChronicle(chronicle),
          (snapshot) => snapshot.kind === "TERMINAL",
          (snapshot) => ({
            ...snapshot,
            board: {
              ...snapshot.board,
              soldiers: snapshot.board.soldiers.map((soldier, index) =>
                index === 0 ? { ...soldier, status: "ACTIVE" } : soldier,
              ),
            },
          }),
        )
      },
      code: "SNAPSHOT_MISMATCH",
    },
    {
      name: "version-incompatible Chronicle",
      mutate(chronicle: Chronicle): Chronicle {
        return {
          ...chronicle,
          reproducibility: {
            ...chronicle.reproducibility,
            versions: {
              ...chronicle.reproducibility.versions,
              engine: `${chronicle.reproducibility.versions.engine}-future`,
            },
          },
        }
      },
      code: "VERSION_INCOMPATIBLE",
    },
  ] as const)(
    "rejects $name through the integrated gate",
    ({ mutate, code }) => {
      expect(errorCodes(mutate(createChronicle()))).toContain(code)
    },
  )
})
