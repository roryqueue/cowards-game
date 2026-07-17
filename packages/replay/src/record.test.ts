import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { MATCH_KERNEL, type StrategyRuntime } from "@cowards/engine"
import { adaptRuntimeForCurrentKernel } from "@cowards/engine/test/current-kernel-runtime"
import {
  ARENA_CATALOG_VERSION_V1_37,
  CANONICAL_ARENA_CATALOG_V1_37,
  CANDIDATE_RUNTIME_V119_SEMANTIC_TUPLE_RECORD,
  SET_CONDITION_POLICY_VERSION_V1_37,
  createSetScenarioV137,
  type SoldierBrainInput,
  type StrategyInput,
} from "@cowards/spec"
import { describe, expect, it } from "vitest"
import {
  computeRecordedTransitionTraceRootV137,
  recordChronicleFromExecution,
  validateRecordedTransitionTraceRootsV137,
} from "./record.js"

const runtime: StrategyRuntime = {
  selectActivations(input: StrategyInput) {
    return {
      ok: true,
      value: {
        activationOrders: input.mySoldiers
          .filter((soldier) => soldier.status === "ACTIVE")
          .slice(0, input.activationCount)
          .map((soldier) => ({
            soldierId: soldier.id,
            objective: { ownerPlayerId: soldier.ownerPlayerId },
          })),
        strategyMemory: { round: input.roundNumber },
      },
    }
  },
  runSoldierBrain(input: SoldierBrainInput) {
    return {
      ok: true,
      value: {
        action: { type: "TURN_TO_STONE" as const },
        soldierMemory: { soldierId: input.self.id },
      },
    }
  },
}

const run = () =>
  MATCH_KERNEL.runMatch({
    matchId: "recorder-match",
    seed: "recorder-seed",
    arenaVariant: {
      id: "recorder-arena",
      name: "Recorder Arena",
      initialBounds: { minX: 0, maxX: 11, minY: 0, maxY: 11 },
      terrainStones: [],
    },
    bottomPlayerId: "bottom",
    topPlayerId: "top",
    bottomStrategyRevisionId: "bottom-revision",
    topStrategyRevisionId: "top-revision",
    runtime: adaptRuntimeForCurrentKernel(runtime),
    maxPhases: 1,
  })

const metadata = {
  schemaVersion: "chronicle-v1.4" as const,
  semanticTupleId: MATCH_KERNEL.tupleId,
  semanticTuple: MATCH_KERNEL.tuple,
}

const candidateMetadata = {
  schemaVersion: "chronicle-v1.4" as const,
  semanticTupleId: CANDIDATE_RUNTIME_V119_SEMANTIC_TUPLE_RECORD.tupleId,
  semanticTuple: CANDIDATE_RUNTIME_V119_SEMANTIC_TUPLE_RECORD.tuple,
}

const createCandidateRecordingInput = () => {
  const arena = CANONICAL_ARENA_CATALOG_V1_37.arenas.find(
    ({ id }) => id === "arena:smoke:v1",
  )!
  const scenario = createSetScenarioV137({
    arenaCatalogVersion: ARENA_CATALOG_VERSION_V1_37,
    arenaSemanticGeometryHash: arena.semanticGeometryHash,
    entrantA: { entrantKey: "entrant:bottom", playerId: "bottom" },
    entrantB: { entrantKey: "entrant:top", playerId: "top" },
    baseSeed: "candidate-replay-seed",
  })
  const condition = scenario.conditions[0]!
  const execution = MATCH_KERNEL.runMatchV119({
    matchId: "candidate-replay-match",
    seed: scenario.baseSeed,
    arenaVariant: {
      id: arena.id,
      name: arena.name,
      initialBounds: { ...arena.initialBounds },
      terrainStones: arena.terrainStones.map((position) => ({ ...position })),
    },
    bottomPlayerId: condition.bottomPlayerId,
    topPlayerId: condition.topPlayerId,
    bottomStrategyRevisionId: "bottom-revision",
    topStrategyRevisionId: "top-revision",
    initialInitiativePlayerId: condition.initialInitiativePlayerId,
    runtime,
    maxPhases: 1,
  })
  const candidateMatch = {
    semanticAuthorityKey: "runtime-v1.19" as const,
    matchId: "candidate-replay-match",
    seed: scenario.baseSeed,
    arenaVariantId: arena.id,
    bottomStrategyRevisionId: "bottom-revision",
    topStrategyRevisionId: "top-revision",
    bottomPlayerId: condition.bottomPlayerId,
    topPlayerId: condition.topPlayerId,
    bottomEntrantKey: condition.bottomEntrantKey,
    topEntrantKey: condition.topEntrantKey,
    setPolicyVersion: SET_CONDITION_POLICY_VERSION_V1_37,
    scenarioId: scenario.scenarioId,
    conditionId: condition.conditionId,
    conditionOrdinal: condition.ordinal,
    conditionSuffix: condition.suffix,
    requestIdentity: condition.requestIdentity,
    arenaCatalogVersion: ARENA_CATALOG_VERSION_V1_37,
    arenaSemanticGeometryHash: scenario.arenaSemanticGeometryHash,
    initialInitiativeEntrantKey: condition.initialInitiativeEntrantKey,
    initialInitiativePlayerId: condition.initialInitiativePlayerId,
  }
  return { execution, candidateMatch }
}

describe("recordChronicleFromExecution", () => {
  it("records one exact immutable runtime-v1.19 condition reproducibility envelope", () => {
    const { execution, candidateMatch } = createCandidateRecordingInput()
    const recorded = recordChronicleFromExecution({
      execution,
      metadata: candidateMetadata,
      candidateMatch,
    } as never)

    expect(recorded.ok).toBe(true)
    if (!recorded.ok) return
    expect(recorded).toHaveProperty("candidateReproducibility")
    const candidateReproducibility = (
      recorded as unknown as {
        candidateReproducibility: Record<string, unknown>
      }
    ).candidateReproducibility
    expect(candidateReproducibility).toEqual({
      profile: "candidate-v1.19",
      compatibility: {
        tupleId: CANDIDATE_RUNTIME_V119_SEMANTIC_TUPLE_RECORD.tupleId,
        tuple: CANDIDATE_RUNTIME_V119_SEMANTIC_TUPLE_RECORD.tuple,
      },
      match: candidateMatch,
    })
    expect(Object.isFrozen(candidateReproducibility)).toBe(true)
    expect(Object.isFrozen(candidateReproducibility.compatibility)).toBe(true)
    expect(Object.isFrozen(candidateReproducibility.match)).toBe(true)
    expect(JSON.stringify(candidateReproducibility)).not.toMatch(
      /strategyMemory|soldierMemory|objective|source|artifact|diagnostic/iu,
    )
  })

  it("rejects missing, mixed, and one-field-mutated candidate identities", () => {
    const { execution, candidateMatch } = createCandidateRecordingInput()
    const fields = [
      "scenarioId",
      "conditionId",
      "conditionOrdinal",
      "conditionSuffix",
      "requestIdentity",
      "arenaCatalogVersion",
      "arenaSemanticGeometryHash",
      "bottomEntrantKey",
      "topEntrantKey",
      "initialInitiativeEntrantKey",
      "initialInitiativePlayerId",
    ] as const

    expect(
      recordChronicleFromExecution({
        execution,
        metadata: candidateMetadata,
      }),
    ).toMatchObject({
      ok: false,
      failure: { code: "RECORDER_CANDIDATE_REPRODUCIBILITY_INVALID" },
    })
    expect(
      recordChronicleFromExecution({
        execution: run(),
        metadata,
        candidateMatch,
      } as never),
    ).toMatchObject({
      ok: false,
      failure: { code: "RECORDER_CANDIDATE_REPRODUCIBILITY_INVALID" },
    })

    for (const field of fields) {
      const replacement =
        field === "conditionOrdinal"
          ? 1
          : field === "arenaCatalogVersion"
            ? "catalog:forged"
            : `${String(candidateMatch[field])}:forged`
      expect(
        recordChronicleFromExecution({
          execution,
          metadata: candidateMetadata,
          candidateMatch: { ...candidateMatch, [field]: replacement },
        } as never),
        field,
      ).toMatchObject({
        ok: false,
        failure: { code: "RECORDER_CANDIDATE_REPRODUCIBILITY_INVALID" },
      })
    }
  })

  it("keeps the Phase-259 current recording result and Chronicle shape exact", () => {
    const recorded = recordChronicleFromExecution({ execution: run(), metadata })
    expect(recorded.ok).toBe(true)
    if (!recorded.ok) return

    expect(Object.keys(recorded)).toEqual([
      "ok",
      "chronicle",
      "finalState",
      "semanticIdentity",
      "boundaryAnchors",
      "recordedTransitions",
      "transitionTraceRoot",
    ])
    expect(Object.hasOwn(recorded, "candidateReproducibility")).toBe(false)
    expect(Object.keys(recorded.chronicle.reproducibility)).toEqual([
      "matchId",
      "seed",
      "arenaVariantId",
      "arenaVariantVersion",
      "strategyRevisionIds",
      "versions",
    ])
  })

  it("records one completed candidate stream with exact public events and state-hash anchors", () => {
    const execution = run()
    const recorded = recordChronicleFromExecution({ execution, metadata })

    expect(recorded.ok).toBe(true)
    if (!recorded.ok || execution.kind !== "completed") return

    expect(
      recorded.chronicle.events.map(({ type, sequence, privacy, payload }) => ({
        type,
        sequence,
        privacy,
        payload,
      })),
    ).toEqual(
      execution.result.events.map(({ type, sequence, privacy, payload }) => ({
        type,
        sequence,
        privacy: privacy ?? "public",
        payload,
      })),
    )
    expect(
      recorded.chronicle.events.find(({ type }) => type === "ROUND_STARTED")
        ?.context,
    ).toEqual({ phaseNumber: 1, roundNumber: 1 })
    expect(recorded.chronicle.events.map(({ sequence }) => sequence)).toEqual(
      recorded.chronicle.events.map((_, sequence) => sequence),
    )
    expect(recorded.chronicle.events[0]?.type).toBe("MATCH_STARTED")
    expect(recorded.chronicle.events.at(-1)?.type).toBe("MATCH_ENDED")
    expect(recorded.chronicle.snapshots.map(({ kind }) => kind)).toEqual(
      recorded.boundaryAnchors.map(({ kind }) => kind),
    )
    expect(recorded.boundaryAnchors).toHaveLength(
      recorded.chronicle.snapshots.length,
    )
    expect(
      recorded.boundaryAnchors.every(({ stateHash }) =>
        /^sha256:[0-9a-f]{64}$/u.test(stateHash),
      ),
    ).toBe(true)
    expect(recorded.finalState).toEqual(execution.result.state)
    expect(recorded.semanticIdentity).toEqual({
      tupleId: MATCH_KERNEL.tupleId,
      tuple: MATCH_KERNEL.tuple,
    })
  })

  it("records a transition-complete immutable D-06/D-14 stream with hash-only private evidence", () => {
    const recorded = recordChronicleFromExecution({
      execution: run(),
      metadata,
    })

    expect(recorded.ok).toBe(true)
    if (!recorded.ok) return

    expect(recorded.recordedTransitions.length).toBeGreaterThan(0)
    expect(recorded.transitionTraceRoot).toMatch(/^sha256:[0-9a-f]{64}$/u)
    expect(
      computeRecordedTransitionTraceRootV137(recorded.recordedTransitions),
    ).toBe(recorded.transitionTraceRoot)

    recorded.recordedTransitions.forEach((transition, ordinal) => {
      expect(transition.ordinal).toBe(ordinal)
      expect(transition.kind.length).toBeGreaterThan(0)
      expect(transition.coordinates.ordinal).toBe(ordinal)
      expect(transition.beforeStateHash).toMatch(/^sha256:[0-9a-f]{64}$/u)
      expect(transition.afterStateHash).toMatch(/^sha256:[0-9a-f]{64}$/u)
      expect(transition.orderedEvents.length).toBeGreaterThan(0)
      expect(transition.orderedEventsHash).toMatch(/^sha256:[0-9a-f]{64}$/u)
      expect(transition.canonicalOutputHash).toMatch(/^sha256:[0-9a-f]{64}$/u)
      expect(transition.strategyMemoryHash).toMatch(/^sha256:[0-9a-f]{64}$/u)
      expect(transition.soldierMemoryHash).toMatch(/^sha256:[0-9a-f]{64}$/u)
      expect(transition.objectiveHash).toMatch(/^sha256:[0-9a-f]{64}$/u)
      expect(transition.accumulatedTraceRoot).toMatch(/^sha256:[0-9a-f]{64}$/u)
      expect(Object.isFrozen(transition)).toBe(true)
      expect(Object.isFrozen(transition.coordinates)).toBe(true)
      expect(Object.isFrozen(transition.orderedEvents)).toBe(true)
      expect(
        transition.orderedEvents.every(
          (event) =>
            Object.isFrozen(event) &&
            (event.context === undefined || Object.isFrozen(event.context)),
        ),
      ).toBe(true)
    })

    const serialized = JSON.stringify(recorded.recordedTransitions)
    expect(serialized).not.toContain('"strategyMemory"')
    expect(serialized).not.toContain('"soldierMemory"')
    expect(serialized).not.toContain('"objectivePayload"')
    expect(serialized).not.toContain('"awarenessGrid"')
  })

  it("changes the D-14 root for every one-field and ordering mutation", () => {
    const recorded = recordChronicleFromExecution({
      execution: run(),
      metadata,
    })
    expect(recorded.ok).toBe(true)
    if (!recorded.ok) return

    const original = recorded.recordedTransitions
    const root = recorded.transitionTraceRoot
    const first = original[0]!
    const terminalIndex = original.findIndex(
      ({ terminalStatus }) => terminalStatus !== null,
    )
    const multiEventIndex = original.findIndex(
      ({ orderedEvents }) => orderedEvents.length > 1,
    )
    expect(terminalIndex).toBeGreaterThanOrEqual(0)
    expect(multiEventIndex).toBeGreaterThanOrEqual(0)
    const terminal = original[terminalIndex]!
    const differentHash = `sha256:${"f".repeat(64)}`

    const mutations = [
      original.map((transition, index) =>
        index === 0
          ? { ...transition, kind: `${first.kind}:MUTATED` }
          : transition,
      ),
      original.map((transition, index) =>
        index === 0
          ? {
              ...transition,
              coordinates: {
                ...transition.coordinates,
                stage: `${transition.coordinates.stage}:mutated`,
              },
            }
          : transition,
      ),
      original.map((transition, index) =>
        index === 0
          ? { ...transition, beforeStateHash: differentHash }
          : transition,
      ),
      original.map((transition, index) =>
        index === multiEventIndex
          ? {
              ...transition,
              orderedEvents: [...transition.orderedEvents].reverse(),
            }
          : transition,
      ),
      original.map((transition, index) =>
        index === 0
          ? { ...transition, orderedEventsHash: differentHash }
          : transition,
      ),
      original.map((transition, index) =>
        index === terminalIndex
          ? { ...transition, terminalStatus: null, terminalHash: null }
          : transition,
      ),
      original.slice(1),
      [...original, terminal],
      [...original].reverse(),
    ]

    for (const mutated of mutations) {
      expect(computeRecordedTransitionTraceRootV137(mutated)).not.toBe(root)
    }
  })

  it.each(["first", "middle", "last"] as const)(
    "rejects a mutated %s stored accumulated trace root at its exact ordinal",
    (position) => {
      const recorded = recordChronicleFromExecution({
        execution: run(),
        metadata,
      })
      expect(recorded.ok).toBe(true)
      if (!recorded.ok) return
      const index =
        position === "first"
          ? 0
          : position === "last"
            ? recorded.recordedTransitions.length - 1
            : Math.floor(recorded.recordedTransitions.length / 2)
      const mutated = recorded.recordedTransitions.map((transition, ordinal) =>
        ordinal === index
          ? {
              ...transition,
              accumulatedTraceRoot: `sha256:${"f".repeat(64)}`,
            }
          : transition,
      )

      expect(validateRecordedTransitionTraceRootsV137(mutated)).toMatchObject({
        ok: false,
        code: "RECORDED_TRANSITION_PREFIX_ROOT_MISMATCH",
        transitionIndex: index,
        actualRoot: `sha256:${"f".repeat(64)}`,
      })
    },
  )

  it("stores private payloads only under an explicit owner and exposes only a reference", () => {
    const recorded = recordChronicleFromExecution({
      execution: run(),
      metadata,
    })

    expect(recorded.ok).toBe(true)
    if (!recorded.ok) return
    const privateEvent = recorded.chronicle.events.find(
      ({ privateRef }) => privateRef !== undefined,
    )
    expect(privateEvent?.privateRef).toMatch(/^private:event:\d+$/u)
    const owners = Object.keys(recorded.chronicle.private?.byPlayerId ?? {})
    expect(owners.length).toBeGreaterThan(0)
    expect(owners.every((owner) => owner === "bottom" || owner === "top")).toBe(
      true,
    )
    expect(JSON.stringify(recorded.chronicle.events)).not.toContain(
      "soldierMemory",
    )
    expect(JSON.stringify(recorded.chronicle.events)).not.toContain(
      "strategyMemory",
    )
  })

  it("hashes optional internal private fields through their existing JSON representation", () => {
    const execution = MATCH_KERNEL.runMatch({
      matchId: "optional-private-field-match",
      seed: "optional-private-field-seed",
      arenaVariant: {
        id: "optional-private-field-arena",
        name: "Optional Private Field Arena",
        initialBounds: { minX: 0, maxX: 11, minY: 0, maxY: 11 },
        terrainStones: [],
      },
      bottomPlayerId: "bottom",
      topPlayerId: "top",
      bottomStrategyRevisionId: "bottom-revision",
      topStrategyRevisionId: "top-revision",
      runtime: adaptRuntimeForCurrentKernel({
        ...runtime,
        selectActivations(input) {
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
      }),
    })

    const recorded = recordChronicleFromExecution({ execution, metadata })
    expect(recorded.ok).toBe(true)
    if (!recorded.ok) return
    expect(recorded.transitionTraceRoot).toMatch(/^sha256:[0-9a-f]{64}$/u)
  })

  it.each(["top", "unknown-player"])(
    "rejects private owner relabeling to %s",
    (playerId) => {
      const execution = run()
      if (execution.kind !== "completed") return
      const events = execution.recorderMaterial.events.map((event) =>
        event.type === "STRATEGY_EVALUATED" &&
        event.context?.actingPlayerId === "bottom"
          ? { ...event, privatePayload: { playerId, strategyMemory: {} } }
          : event,
      )
      const recorded = recordChronicleFromExecution({
        execution: {
          ...execution,
          recorderMaterial: { ...execution.recorderMaterial, events },
        },
        metadata,
      })
      expect(recorded).toMatchObject({
        ok: false,
        failure: { code: "RECORDER_PRIVATE_OWNER_INVALID" },
      })
    },
  )

  it("rejects private-memory tampering even when owner labels remain canonical", () => {
    const execution = run()
    if (execution.kind !== "completed") return
    const events = execution.recorderMaterial.events.map((event) =>
      event.type === "STRATEGY_EVALUATED" &&
      event.context?.actingPlayerId === "bottom"
        ? {
            ...event,
            privatePayload: {
              playerId: "bottom",
              strategyMemory: { tampered: true },
            },
          }
        : event,
    )
    const recorded = recordChronicleFromExecution({
      execution: {
        ...execution,
        recorderMaterial: { ...execution.recorderMaterial, events },
      },
      metadata,
    })
    expect(recorded).toMatchObject({
      ok: false,
      failure: { code: "RECORDER_MATERIAL_INVALID" },
    })
  })

  it("returns a typed no-Chronicle result for failed execution", () => {
    const execution = MATCH_KERNEL.runMatch({
      matchId: "failed-recorder-match",
      seed: "failed-recorder-seed",
      arenaVariant: {
        id: "failed-recorder-arena",
        name: "Failed Recorder Arena",
        initialBounds: { minX: 0, maxX: 11, minY: 0, maxY: 11 },
        terrainStones: [],
      },
      bottomPlayerId: "bottom",
      topPlayerId: "top",
      bottomStrategyRevisionId: "bottom-revision",
      topStrategyRevisionId: "top-revision",
      runtime: adaptRuntimeForCurrentKernel({
        ...runtime,
        selectActivations: () => ({
          ok: false as const,
          systemFailure: { code: "SPAWN_FAILED", retryable: true },
        }),
      }),
    })
    const recorded = recordChronicleFromExecution({ execution, metadata })

    expect(recorded).toEqual({
      ok: false,
      failure: {
        classification: "system_failure",
        ownership: "system_integrity",
        code: "RECORDER_EXECUTION_NOT_COMPLETED",
        retryable: false,
      },
    })
    expect(Object.hasOwn(recorded, "chronicle")).toBe(false)
  })

  it.each([
    [
      "result event drift",
      (execution: ReturnType<typeof run>) => {
        if (execution.kind !== "completed") return execution
        return {
          ...execution,
          result: {
            ...execution.result,
            events: execution.result.events.slice(1),
          },
        }
      },
      "RECORDER_EVENT_STREAM_INVALID",
    ],
    [
      "boundary hash drift",
      (execution: ReturnType<typeof run>) => {
        if (execution.kind !== "completed") return execution
        const transitions = execution.transitions.map((transition, index) =>
          index === 0
            ? { ...transition, beforeStateHash: `sha256:${"0".repeat(64)}` }
            : transition,
        )
        return {
          ...execution,
          transitions,
          recorderMaterial: {
            ...execution.recorderMaterial,
            boundaries: transitions,
          },
        }
      },
      "RECORDER_BOUNDARY_INTEGRITY_INVALID",
    ],
    [
      "machine hash drift",
      (execution: ReturnType<typeof run>) => {
        if (execution.kind !== "completed") return execution
        const transitions = execution.transitions.map((transition, index) =>
          index === 0
            ? { ...transition, beforeMachineHash: `sha256:${"0".repeat(64)}` }
            : transition,
        )
        return {
          ...execution,
          transitions,
          recorderMaterial: {
            ...execution.recorderMaterial,
            boundaries: transitions,
          },
        }
      },
      "RECORDER_MATERIAL_INVALID",
    ],
    [
      "activation coordinate drift",
      (execution: ReturnType<typeof run>) => {
        if (execution.kind !== "completed") return execution
        const target = execution.transitions.findIndex(
          ({ coordinates }) => coordinates.activationId !== undefined,
        )
        const transitions = execution.transitions.map((transition, index) =>
          index === target
            ? {
                ...transition,
                coordinates: {
                  ...transition.coordinates,
                  activationId: "forged",
                },
              }
            : transition,
        )
        return {
          ...execution,
          transitions,
          recorderMaterial: {
            ...execution.recorderMaterial,
            boundaries: transitions,
          },
        }
      },
      "RECORDER_BOUNDARY_INTEGRITY_INVALID",
    ],
    [
      "semantic identity drift",
      (execution: ReturnType<typeof run>) => {
        if (execution.kind !== "completed") return execution
        const transitions = execution.transitions.map((transition, index) =>
          index === 0
            ? { ...transition, semanticTupleId: "sha256:wrong" }
            : transition,
        )
        return {
          ...execution,
          transitions,
          recorderMaterial: {
            ...execution.recorderMaterial,
            boundaries: transitions,
          },
        }
      },
      "RECORDER_SEMANTIC_IDENTITY_INVALID",
    ],
  ] as const)("fails closed for %s", (_name, mutate, code) => {
    const recorded = recordChronicleFromExecution({
      execution: mutate(run()) as ReturnType<typeof run>,
      metadata,
    })

    expect(recorded.ok).toBe(false)
    expect(!recorded.ok && recorded.failure.code).toBe(code)
    expect(Object.hasOwn(recorded, "chronicle")).toBe(false)
  })

  it("has no runtime, driver, or scheduling dependency", () => {
    const source = readFileSync(
      fileURLToPath(new URL("./record.ts", import.meta.url)),
      "utf8",
    )

    expect(source).not.toMatch(
      /StrategyRuntime|runMatch|resolveRound|resolveActivation/,
    )
    expect(source).not.toMatch(/kernel\/driver|kernel\/step|\.\/build/)
  })
})
