import { describe, expect, it } from "vitest"
import {
  CURRENT_CANONICAL_COMPATIBILITY_TUPLE_RECORD,
  HISTORICAL_RUNTIME_V114_SEMANTIC_TUPLE,
  HISTORICAL_RUNTIME_V114_SEMANTIC_TUPLE_ID,
  validateCanonicalTransition,
  type CanonicalCompatibilityTuple,
  type CanonicalKernelSemanticTransition,
} from "@cowards/spec"
import * as enginePublic from "../index.js"
import { createFakeRuntime } from "../test/fake-runtime.js"
import { adaptRuntimeForCurrentKernel } from "../test/current-kernel-runtime.js"
import { createInitialGameState } from "../state.js"
import { stepCandidateMatch } from "./step.js"
import {
  appendKernelEventHistory,
  appendKernelRequestIdHistory,
  createKernelEventHistory,
  createKernelRequestIdHistory,
  createTransitionRecord,
  expectedEffectRequestId,
  hashMatchMachine,
  projectMatchMachineForHash,
  validateMachine,
} from "./validate.js"
import {
  CANDIDATE_KERNEL_V117_SEMANTIC_TUPLE,
  CANDIDATE_KERNEL_V117_SEMANTIC_TUPLE_ID,
  type MatchMachine,
} from "./types.js"

const MISSING_AUTHORITY_MARKER =
  "[EXPECTED_RED:MISSING_KERNEL_AUTHORITY]" as const

const EXPECTED_CANDIDATE_TUPLE =
  CURRENT_CANONICAL_COMPATIBILITY_TUPLE_RECORD.tuple satisfies Readonly<CanonicalCompatibilityTuple>

const EXPECTED_CANDIDATE_TUPLE_ID =
  CURRENT_CANONICAL_COMPATIBILITY_TUPLE_RECORD.tupleId

const matchInput = {
  matchId: "phase-257-kernel-contract",
  seed: "phase-257-kernel-contract-seed",
  arenaVariant: {
    id: "phase-257-kernel-arena",
    name: "Phase 257 kernel arena",
    initialBounds: { minX: 0, maxX: 11, minY: 0, maxY: 11 },
    terrainStones: [],
  },
  bottomPlayerId: "phase-257-bottom",
  topPlayerId: "phase-257-top",
  bottomStrategyRevisionId: "phase-257-bottom-revision",
  topStrategyRevisionId: "phase-257-top-revision",
}

type KernelEffectKind = "selectActivations" | "soldierBrain"

interface KernelEffectRequest {
  requestId: string
  kind: KernelEffectKind
  semanticTupleId: string
  coordinates: Readonly<Record<string, unknown>>
  input: Readonly<Record<string, unknown>>
}

type KernelResume =
  | {
      kind: "runtime_resume"
      requestId: string
      effectKind: KernelEffectKind
      classification: "success"
      value: unknown
    }
  | {
      kind: "runtime_resume"
      requestId: string
      effectKind: KernelEffectKind
      classification: "player_violation"
      violation: { type: "INVALID_OUTPUT"; message: string }
    }
  | {
      kind: "runtime_resume"
      requestId: string
      effectKind: KernelEffectKind
      classification: "system_failure"
      failure: { code: string; retryable: boolean }
    }

interface KernelTransitionRecord {
  transitionKind: string
  semanticTupleId: string
  semanticTuple: Readonly<Record<string, string>>
  coordinates: Readonly<Record<string, unknown>>
  classification: string
  events: readonly {
    readonly type: string
    readonly sequence: number
    readonly payload: unknown
    readonly context?: unknown
    readonly privacy?: unknown
  }[]
  beforeState: Readonly<Record<string, unknown>>
  afterState: Readonly<Record<string, unknown>>
  beforeStateHash: string
  afterStateHash: string
  beforeMachineHash: string
  afterMachineHash: string
  terminalStatus: unknown
  failureStatus: unknown
}

type KernelStepResult =
  | {
      kind: "transition"
      machine: unknown
      record: KernelTransitionRecord
    }
  | {
      kind: "effect"
      machine: unknown
      request: KernelEffectRequest
    }
  | {
      kind: "completed"
      machine: unknown
      record: KernelTransitionRecord
      result: { state: unknown; events: readonly unknown[] }
    }
  | {
      kind: "failure"
      machine: unknown
      failure: Readonly<Record<string, unknown>>
    }

interface CandidateExecution {
  kind: "completed" | "failure"
  result?: { state: unknown; events: readonly unknown[] }
  transitions: readonly KernelTransitionRecord[]
  failure?: Readonly<Record<string, unknown>>
  unchangedState?: unknown
}

interface CandidateMatchKernelAuthority {
  createMachine(input: Readonly<Record<string, unknown>>): unknown
  stepMatch(
    machine: unknown,
    input: { kind: "advance" } | KernelResume,
  ): KernelStepResult
  runMatch(input: Readonly<Record<string, unknown>>): CandidateExecution
}

const candidateAuthority = (
  enginePublic as unknown as {
    MATCH_KERNEL?: CandidateMatchKernelAuthority
  }
).MATCH_KERNEL

const createDirectMachine = (): MatchMachine => {
  const initialState = createInitialGameState({
    ...matchInput,
    arenaVariant: {
      ...matchInput.arenaVariant,
      terrainStones: [...matchInput.arenaVariant.terrainStones],
    },
  })
  return {
    executionMode: "match",
    state: initialState,
    initialState,
    semanticTuple: {
      tupleId: EXPECTED_CANDIDATE_TUPLE_ID,
      tuple: EXPECTED_CANDIDATE_TUPLE,
    },
    cursor: {
      stage: "match_start",
      ordinal: 0,
      phaseNumber: 1,
      roundNumber: 1,
      cycleLayer: 0,
      slotIndex: 0,
    },
    maxPhases: 100,
    phasesRun: 0,
    selections: { bottom: [], top: [] },
    slots: [],
    fullEvents: [],
    consumedRequestIds: [],
  }
}

const withoutRuntime = (): Readonly<Record<string, unknown>> => ({
  ...matchInput,
})

const withRuntime = (): Readonly<Record<string, unknown>> => ({
  ...matchInput,
  runtime: adaptRuntimeForCurrentKernel(
    createFakeRuntime({ action: { type: "TURN_TO_STONE" } }),
  ),
})

const advanceToEffect = (
  authority: CandidateMatchKernelAuthority,
): Extract<KernelStepResult, { kind: "effect" }> => {
  let machine = authority.createMachine(withoutRuntime())
  for (let index = 0; index < 256; index += 1) {
    const stepped = authority.stepMatch(machine, { kind: "advance" })
    if (stepped.kind === "effect") return stepped
    if (stepped.kind === "failure") {
      throw new Error(
        `kernel failed before first runtime effect: ${JSON.stringify(stepped.failure)}`,
      )
    }
    if (stepped.kind === "completed") {
      throw new Error("kernel completed before yielding a runtime effect")
    }
    machine = stepped.machine
  }
  throw new Error("kernel did not yield a runtime effect within 256 steps")
}

const successResume = (request: KernelEffectRequest): KernelResume => {
  if (request.kind === "selectActivations") {
    const input = request.input as {
      activationCount: number
      mySoldiers: readonly { id: string; status: string }[]
      strategyMemory: unknown
    }
    return {
      kind: "runtime_resume",
      requestId: request.requestId,
      effectKind: request.kind,
      classification: "success",
      value: {
        activationOrders: input.mySoldiers
          .filter((soldier) => soldier.status === "ACTIVE")
          .slice(0, input.activationCount)
          .map((soldier) => ({ soldierId: soldier.id })),
        strategyMemory: input.strategyMemory,
      },
    }
  }

  const input = request.input as { soldierMemory: unknown }
  return {
    kind: "runtime_resume",
    requestId: request.requestId,
    effectKind: request.kind,
    classification: "success",
    value: {
      action: { type: "TURN_TO_STONE" },
      soldierMemory: input.soldierMemory,
    },
  }
}

const expectUnchangedFailure = (
  result: KernelStepResult,
  expectedMachine: unknown,
): void => {
  expect(result.kind).toBe("failure")
  expect(result.machine).toEqual(expectedMachine)
}

const privateKeys = new Set([
  "source",
  "sourceBytes",
  "artifactBytes",
  "strategyMemory",
  "soldierMemory",
  "objective",
  "objectivePayload",
  "rawDiagnostics",
  "diagnostics",
  "hostPath",
  "securityInternals",
])

const expectNoPrivateTransitionData = (value: unknown): void => {
  const visit = (candidate: unknown): void => {
    if (Array.isArray(candidate)) {
      candidate.forEach(visit)
      return
    }
    if (!candidate || typeof candidate !== "object") return
    for (const [key, nested] of Object.entries(candidate)) {
      expect(privateKeys.has(key), `private transition key ${key}`).toBe(false)
      visit(nested)
    }
  }
  visit(value)
}

const expectRecordContract = (record: KernelTransitionRecord): void => {
  expect(record.transitionKind.length).toBeGreaterThan(0)
  expect(record.semanticTupleId).toBe(EXPECTED_CANDIDATE_TUPLE_ID)
  expect(record.semanticTuple).toEqual(EXPECTED_CANDIDATE_TUPLE)
  expect(record.coordinates).toEqual(expect.any(Object))
  expect(record.classification.length).toBeGreaterThan(0)
  expect(record.events).toEqual(expect.any(Array))
  expect(record.beforeStateHash).toMatch(/^sha256:[0-9a-f]{64}$/u)
  expect(record.afterStateHash).toMatch(/^sha256:[0-9a-f]{64}$/u)
  expect(record.beforeMachineHash).toMatch(/^sha256:[0-9a-f]{64}$/u)
  expect(record.afterMachineHash).toMatch(/^sha256:[0-9a-f]{64}$/u)
  expect(Object.hasOwn(record, "terminalStatus")).toBe(true)
  expect(Object.hasOwn(record, "failureStatus")).toBe(true)
  expectNoPrivateTransitionData(record)
}

describe("Phase 257 canonical Match kernel contract", () => {
  it("keeps the historical consumed-request projection and machine hash byte-identical", () => {
    const historical: MatchMachine = {
      ...createDirectMachine(),
      semanticTuple: {
        tupleId: HISTORICAL_RUNTIME_V114_SEMANTIC_TUPLE_ID,
        tuple: HISTORICAL_RUNTIME_V114_SEMANTIC_TUPLE,
      },
      consumedRequestIds: ["request:z", "request:a"],
    }
    expect(projectMatchMachineForHash(historical).consumedRequestIds).toEqual([
      "request:a",
      "request:z",
    ])
    expect(hashMatchMachine(historical)).toBe(
      "sha256:5385ca95e3173fdb71f60878183adda324245924ac7eff021e43544dd58a0f8d",
    )
  })

  it("binds v1.17 machine hashes to consumed-request content, order, and count", () => {
    const base: MatchMachine = {
      ...createDirectMachine(),
      semanticTuple: {
        tupleId: CANDIDATE_KERNEL_V117_SEMANTIC_TUPLE_ID,
        tuple: CANDIDATE_KERNEL_V117_SEMANTIC_TUPLE,
      },
    }
    const first = appendKernelRequestIdHistory(
      createKernelRequestIdHistory(),
      "request:first",
    )
    const ordered: MatchMachine = {
      ...base,
      consumedRequestIds: appendKernelRequestIdHistory(
        first,
        "request:second",
      ),
    }
    const reordered: MatchMachine = {
      ...base,
      consumedRequestIds: ["request:second", "request:first"],
    }
    const differentContent: MatchMachine = {
      ...base,
      consumedRequestIds: ["request:first", "request:other"],
    }
    const differentCount: MatchMachine = {
      ...base,
      consumedRequestIds: ["request:first"],
    }
    expect(projectMatchMachineForHash(ordered).consumedRequestIds).toMatchObject(
      {
        commitment: expect.stringMatching(/^sha256:[0-9a-f]{64}$/u),
        count: 2,
      },
    )
    expect(
      new Set(
        [ordered, reordered, differentContent, differentCount].map(
          hashMatchMachine,
        ),
      ).size,
    ).toBe(4)

    const after: MatchMachine = {
      ...ordered,
      cursor: { ...ordered.cursor, ordinal: ordered.cursor.ordinal + 1 },
    }
    const input = {
      before: ordered,
      after,
      transitionKind: "COMMITMENT_HASH_FIXTURE",
      classification: "success",
      events: [
        { type: "MATCH_STARTED", sequence: 0, payload: { fixture: true } },
      ],
    } as const
    expect(createTransitionRecord(input)).toEqual(createTransitionRecord(input))
  })

  it("matches content-recomputed v1.17 commitments across growing owned histories", () => {
    let fullEvents = createKernelEventHistory()
    let consumedRequestIds = createKernelRequestIdHistory()
    const checkpoints = new Set([0, 1, 2, 8, 32, 96])

    for (let index = 0; index <= 96; index += 1) {
      const machine: MatchMachine = {
        ...createDirectMachine(),
        semanticTuple: {
          tupleId: CANDIDATE_KERNEL_V117_SEMANTIC_TUPLE_ID,
          tuple: CANDIDATE_KERNEL_V117_SEMANTIC_TUPLE,
        },
        cursor: {
          ...createDirectMachine().cursor,
          stage: "soldier_effect",
          ordinal: index + 3,
          cycleLayer: index % 4,
        },
        fullEvents,
        consumedRequestIds,
      }

      if (checkpoints.has(index)) {
        const suffix = `activation:test:${index}`
        const mutableClone: MatchMachine = {
          ...machine,
          fullEvents: globalThis.structuredClone(machine.fullEvents),
          consumedRequestIds: globalThis.structuredClone(
            machine.consumedRequestIds,
          ),
        }
        expect(expectedEffectRequestId(machine, "soldierBrain", suffix)).toBe(
          expectedEffectRequestId(mutableClone, "soldierBrain", suffix),
        )
      }

      if (index < 96) {
        fullEvents = appendKernelEventHistory(fullEvents, [
          {
            type: "ACTION_EMITTED",
            sequence: index,
            payload: {
              soldierId: `soldier:${index % 6}`,
              action: { type: "TURN", direction: index % 2 ? "LEFT" : "RIGHT" },
            },
            context: {
              activationId: `activation:${Math.floor(index / 4)}`,
              cycleIndex: index % 4,
            },
            privacy: "owner",
            privatePayload: {
              objective: { nested: { index, retained: index % 3 === 0 } },
            },
          },
        ]).fullEvents
        consumedRequestIds = appendKernelRequestIdHistory(
          consumedRequestIds,
          `effect:consumed:${index}`,
        )
      }
    }
  })

  it("never trusts mutable or mutated event history cache inputs", () => {
    const owned = appendKernelEventHistory(createKernelEventHistory(), [
      {
        type: "ACTION_EMITTED",
        sequence: 0,
        payload: { soldierId: "soldier:cache-negative", value: 1 },
        privacy: "owner",
        privatePayload: { secret: { value: "before" } },
      },
    ]).fullEvents
    const base: MatchMachine = {
      ...createDirectMachine(),
      semanticTuple: {
        tupleId: CANDIDATE_KERNEL_V117_SEMANTIC_TUPLE_ID,
        tuple: CANDIDATE_KERNEL_V117_SEMANTIC_TUPLE,
      },
      fullEvents: owned,
    }
    expect(Object.isFrozen(owned)).toBe(true)
    expect(Object.isFrozen(owned[0]?.privatePayload)).toBe(true)

    const mutableEvents = globalThis.structuredClone(owned)
    const mutable: MatchMachine = { ...base, fullEvents: mutableEvents }
    expect(expectedEffectRequestId(base, "selectActivations", "player:bottom")).toBe(
      expectedEffectRequestId(mutable, "selectActivations", "player:bottom"),
    )
    const before = expectedEffectRequestId(
      mutable,
      "selectActivations",
      "player:bottom",
    )
    const privatePayload = mutableEvents[0]?.privatePayload as {
      secret: { value: string }
    }
    privatePayload.secret.value = "after"
    const after = expectedEffectRequestId(
      mutable,
      "selectActivations",
      "player:bottom",
    )
    expect(after).not.toBe(before)

    const secondEvent = {
      ...globalThis.structuredClone(owned[0]!),
      sequence: 1,
      payload: { soldierId: "soldier:cache-negative", value: 2 },
    }
    const ordered: MatchMachine = {
      ...base,
      fullEvents: [globalThis.structuredClone(owned[0]!), secondEvent],
      consumedRequestIds: ["request:first", "request:second"],
    }
    const reorderedEvents: MatchMachine = {
      ...ordered,
      fullEvents: [...ordered.fullEvents].reverse(),
    }
    const reorderedRequests: MatchMachine = {
      ...ordered,
      consumedRequestIds: [...ordered.consumedRequestIds].reverse(),
    }
    const orderedId = expectedEffectRequestId(
      ordered,
      "selectActivations",
      "player:bottom",
    )
    expect(
      expectedEffectRequestId(
        reorderedEvents,
        "selectActivations",
        "player:bottom",
      ),
    ).not.toBe(orderedId)
    expect(
      expectedEffectRequestId(
        reorderedRequests,
        "selectActivations",
        "player:bottom",
      ),
    ).not.toBe(orderedId)

    const differentPrestate: MatchMachine = {
      ...ordered,
      state: {
        ...ordered.state,
        players: ordered.state.players.map((player, index) =>
          index === 0
            ? { ...player, strategyMemory: { proof: "different-prestate" } }
            : player,
        ) as typeof ordered.state.players,
      },
    }
    expect(
      expectedEffectRequestId(
        differentPrestate,
        "selectActivations",
        "player:bottom",
      ),
    ).not.toBe(orderedId)

    const historical: MatchMachine = {
      ...ordered,
      semanticTuple: {
        tupleId: HISTORICAL_RUNTIME_V114_SEMANTIC_TUPLE_ID,
        tuple: HISTORICAL_RUNTIME_V114_SEMANTIC_TUPLE,
      },
    }
    expect(
      expectedEffectRequestId(
        historical,
        "selectActivations",
        "player:bottom",
      ),
    ).toBe(
      `effect:${historical.cursor.ordinal}:${historical.cursor.stage}:selectActivations:player:bottom`,
    )
  })

  it("hashes a finite safe machine projection with cursor and tuple identity", () => {
    const machine = createDirectMachine()
    const hash = hashMatchMachine(machine)
    expect(hash).toMatch(/^sha256:[0-9a-f]{64}$/u)
    expect(hashMatchMachine(machine)).toBe(hash)
    expect(JSON.stringify(projectMatchMachineForHash(machine))).not.toMatch(
      /strategyMemory|soldierMemory|objective|source|artifact|diagnostics|host/u,
    )

    const privateOnly = {
      ...machine,
      state: {
        ...machine.state,
        players: machine.state.players.map((player) => ({
          ...player,
          strategyMemory: { secret: "strategy" },
        })) as unknown as typeof machine.state.players,
        soldiers: machine.state.soldiers.map((soldier) => ({
          ...soldier,
          soldierMemory: { secret: "soldier" },
        })),
      },
    }
    expect(hashMatchMachine(privateOnly)).toBe(hash)

    const nextCursor = {
      ...machine,
      cursor: { ...machine.cursor, ordinal: 1 },
    }
    expect(hashMatchMachine(nextCursor)).not.toBe(hash)

    const record = createTransitionRecord({
      before: machine,
      after: nextCursor,
      transitionKind: "MATCH_STARTED",
      classification: "success",
      events: [
        {
          type: "MATCH_STARTED",
          sequence: 0,
          payload: { matchId: machine.state.matchId },
          privacy: "owner",
          privatePayload: { strategyMemory: { secret: true } },
        },
      ],
    })
    expect(record.events[0]).not.toHaveProperty("privatePayload")
    expect(record.beforeStateHash).toBe(record.afterStateHash)
    expect(record.beforeMachineHash).not.toBe(record.afterMachineHash)
    expectRecordContract(record)
  })

  it("advances exactly one deterministic lifecycle edge without runtime I/O", () => {
    const machine = createDirectMachine()
    const stepped = stepCandidateMatch(machine, { kind: "advance" })
    expect(stepped.kind).toBe("transition")
    if (stepped.kind !== "transition") return
    expect(stepped.record.events.map((entry) => entry.type)).toEqual([
      "MATCH_STARTED",
    ])
    expect(stepped.machine.cursor.stage).toBe("round_start")
    expectRecordContract(stepped.record)
  })

  it("rejects a co-forged semantic tuple before any lifecycle edge", () => {
    const machine = createDirectMachine()
    const forged = {
      ...machine,
      semanticTuple: {
        tupleId: `sha256:${"0".repeat(64)}`,
        tuple: {
          rules: "evil",
          engine: "evil",
          runtimeAbi: "evil",
          chronicle: "evil",
          arenaCatalog: "evil",
          setPolicy: "evil",
        },
      },
    } as MatchMachine
    expect(validateMachine(forged)?.code).toBe("KERNEL_SEMANTIC_TUPLE_INVALID")
    expect(stepCandidateMatch(forged, { kind: "advance" })).toMatchObject({
      kind: "failure",
      failure: { code: "KERNEL_SEMANTIC_TUPLE_INVALID" },
    })
  })

  it("missing-kernel-authority: one driver owns transitions", () => {
    if (candidateAuthority === undefined) {
      throw new Error(MISSING_AUTHORITY_MARKER)
    }
    expect(candidateAuthority.createMachine).toEqual(expect.any(Function))
    expect(candidateAuthority.stepMatch).toEqual(expect.any(Function))
    expect(candidateAuthority.runMatch).toEqual(expect.any(Function))
  })

  it("one step crosses one lifecycle boundary without runtime I/O and records the full safe contract", () => {
    if (candidateAuthority === undefined) return
    const machine = candidateAuthority.createMachine(withoutRuntime())
    const stepped = candidateAuthority.stepMatch(machine, { kind: "advance" })

    expect(stepped.kind).toBe("transition")
    if (stepped.kind !== "transition") return
    expectRecordContract(stepped.record)
    expect(stepped.record.events.length).toBeLessThanOrEqual(1)
  })

  it.each([
    [
      "mismatched",
      (request: KernelEffectRequest) => `${request.requestId}:other`,
      undefined,
    ],
    [
      "wrong-kind",
      (request: KernelEffectRequest) => request.requestId,
      "wrong",
    ],
  ] as const)(
    "rejects a %s runtime resume with unchanged prestate",
    (_caseName, requestId, kindOverride) => {
      if (candidateAuthority === undefined) return
      const yielded = advanceToEffect(candidateAuthority)
      const valid = successResume(yielded.request)
      const invalid = {
        ...valid,
        requestId: requestId(yielded.request),
        ...(kindOverride === undefined
          ? {}
          : {
              effectKind:
                yielded.request.kind === "selectActivations"
                  ? "soldierBrain"
                  : "selectActivations",
            }),
      } as KernelResume

      expectUnchangedFailure(
        candidateAuthority.stepMatch(yielded.machine, invalid),
        yielded.machine,
      )
    },
  )

  it("rejects duplicate and stale resumes after one exact response advances", () => {
    if (candidateAuthority === undefined) return
    const yielded = advanceToEffect(candidateAuthority)
    const resume = successResume(yielded.request)
    const accepted = candidateAuthority.stepMatch(yielded.machine, resume)
    expect(accepted.kind).not.toBe("failure")
    if (accepted.kind === "failure") return

    expectUnchangedFailure(
      candidateAuthority.stepMatch(accepted.machine, resume),
      accepted.machine,
    )
  })

  it("keeps system failure separate from player violation and leaves gameplay unchanged", () => {
    if (candidateAuthority === undefined) return
    const yielded = advanceToEffect(candidateAuthority)
    const systemFailure: KernelResume = {
      kind: "runtime_resume",
      requestId: yielded.request.requestId,
      effectKind: yielded.request.kind,
      classification: "system_failure",
      failure: { code: "TEST_SYSTEM_FAILURE", retryable: true },
    }
    const failed = candidateAuthority.stepMatch(yielded.machine, systemFailure)
    expectUnchangedFailure(failed, yielded.machine)
    if (failed.kind === "failure") {
      expect(failed.failure).toMatchObject({
        classification: "system_failure",
      })
    }

    const playerViolation: KernelResume = {
      kind: "runtime_resume",
      requestId: yielded.request.requestId,
      effectKind: yielded.request.kind,
      classification: "player_violation",
      violation: { type: "INVALID_OUTPUT", message: "contract fixture" },
    }
    const penalized = candidateAuthority.stepMatch(
      yielded.machine,
      playerViolation,
    )
    expect(penalized.kind).not.toBe("failure")
  })

  it(
    "driver execution is deterministic and returns its identical ordered canonical stream",
    () => {
      if (candidateAuthority === undefined) return
      const first = candidateAuthority.runMatch(withRuntime())
      const second = candidateAuthority.runMatch(withRuntime())

      expect(first).toEqual(second)
      expect(first.kind).toBe("completed")
      expect(first.transitions.length).toBeGreaterThan(0)
      first.transitions.forEach((transition) => {
        expectRecordContract(transition)
        expect(
          validateCanonicalTransition(
            transition as unknown as CanonicalKernelSemanticTransition,
          ),
        ).toMatchObject({ ok: true })
      })

      const transitionEvents = first.transitions.flatMap(
        (transition) => transition.events,
      )
      expect(first.result?.events).toEqual(transitionEvents)
      expect(
        transitionEvents.filter((event) => event.type === "MATCH_ENDED"),
      ).toHaveLength(1)
      expectNoPrivateTransitionData(first.transitions)
    },
    15_000,
  )

  it("driver discards every partial record when a runtime system failure occurs", () => {
    if (candidateAuthority === undefined) return
    let selectionCall = 0
    const runtime = adaptRuntimeForCurrentKernel({
      selectActivations: (input: {
        activationCount: number
        mySoldiers: readonly { id: string; status: string }[]
      }) => {
        selectionCall += 1
        return selectionCall === 1
          ? {
              ok: true as const,
              value: {
                activationOrders: input.mySoldiers
                  .filter(({ status }) => status === "ACTIVE")
                  .slice(0, input.activationCount)
                  .map(({ id }) => ({ soldierId: id })),
                strategyMemory: { partialMutationMustRollback: true },
              },
            }
          : {
              ok: false as const,
              systemFailure: {
                code: "ADAPTER_CRASH",
                retryable: true,
              },
            }
      },
      runSoldierBrain: () => ({
        ok: false as const,
        systemFailure: { code: "ADAPTER_CRASH", retryable: true },
      }),
    })
    const initial = candidateAuthority.createMachine(withoutRuntime())
    const result = candidateAuthority.runMatch({ ...matchInput, runtime })
    expect(result).toMatchObject({
      kind: "failure",
      transitions: [],
      failure: {
        classification: "system_failure",
        category: "RUNTIME_SYSTEM_FAILURE",
        code: "ADAPTER_CRASH",
      },
    })
    expect(result.unchangedState).toEqual((initial as { state: unknown }).state)
  })

  it("rolls back after multiple successful Soldier effects before a late host failure", () => {
    if (candidateAuthority === undefined) return
    let soldierCall = 0
    const initial = candidateAuthority.createMachine(withoutRuntime())
    const result = candidateAuthority.runMatch({
      ...matchInput,
      runtime: adaptRuntimeForCurrentKernel({
        selectActivations: (input: {
          activationCount: number
          mySoldiers: readonly { id: string; status: string }[]
          roundNumber: number
        }) => ({
          ok: true,
          value: {
            activationOrders: input.mySoldiers
              .filter(({ status }) => status === "ACTIVE")
              .slice(0, input.activationCount)
              .map(({ id }) => ({ soldierId: id })),
            strategyMemory: { observedRound: input.roundNumber },
          },
        }),
        runSoldierBrain: () => {
          soldierCall += 1
          return soldierCall < 3
            ? {
                ok: true,
                value: {
                  action: { type: "TURN_TO_STONE" },
                  soldierMemory: { completedCall: soldierCall },
                },
              }
            : {
                ok: false,
                systemFailure: {
                  code: "ADAPTER_CRASH",
                  retryable: true,
                },
              }
        },
      }),
    })
    expect(soldierCall).toBe(3)
    expect(result).toMatchObject({
      kind: "failure",
      transitions: [],
      failure: {
        classification: "system_failure",
        category: "RUNTIME_SYSTEM_FAILURE",
        code: "ADAPTER_CRASH",
      },
      unchangedState: (initial as { state: unknown }).state,
    })
  })

  it("separates typed admission rejection from bounded host invocation failure", () => {
    if (candidateAuthority === undefined) return
    const admission = candidateAuthority.runMatch({
      ...withRuntime(),
      arenaVariant: {
        id: "invalid-admission",
        name: "Invalid admission",
        initialBounds: { minX: 0, maxX: 1, minY: 0, maxY: 1 },
        terrainStones: [],
      },
    })
    expect(admission).toMatchObject({
      kind: "failure",
      transitions: [],
      unchangedState: null,
      failure: {
        category: "CANONICAL_INTEGRITY_FAILURE",
        code: "CANDIDATE_MATCH_ADMISSION_FAILED",
      },
    })

    const initial = candidateAuthority.createMachine(withoutRuntime())
    const hostFailure = candidateAuthority.runMatch({
      ...matchInput,
      runtime: adaptRuntimeForCurrentKernel({
        selectActivations: () => {
          throw new Error("private host diagnostic")
        },
        runSoldierBrain: () => {
          throw new Error("private host diagnostic")
        },
      }),
    })
    expect(hostFailure).toMatchObject({
      kind: "failure",
      transitions: [],
      unchangedState: (initial as { state: unknown }).state,
      failure: {
        category: "RUNTIME_SYSTEM_FAILURE",
        code:
          EXPECTED_CANDIDATE_TUPLE.runtimeAbi === "strategy-runtime-abi-v1.17"
            ? "ADAPTER_CRASH"
            : "RUNTIME_INVOCATION_THROWN",
      },
    })
    expect(JSON.stringify(hostFailure)).not.toContain("private host diagnostic")
  })
})
