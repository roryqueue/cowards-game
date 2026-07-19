import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import path from "node:path"
import { MATCH_KERNEL, type StrategyRuntime } from "@cowards/engine"
import { adaptRuntimeForCurrentKernel } from "@cowards/engine/test/current-kernel-runtime"
import {
  computeRecordedCanonicalOutputHashV137,
  computeRecordedOrderedEventsHashV137,
  computeRecordedTransitionTraceRootV137,
  type RecordedCanonicalTransitionV137,
} from "@cowards/replay"
import { recordCurrentChronicleTestSupport as recordChronicleFromExecution } from "@cowards/replay/test/current-recording"
import {
  CANONICAL_ARENA_CATALOG_V1_37,
  type SoldierBrainInput,
  type StrategyInput,
} from "@cowards/spec"
import { describe, expect, it } from "vitest"
import {
  V1_37_CONFORMANCE_CORPUS,
  V1_37_CONFORMANCE_CORPUS_ROOT,
} from "./v1-37-conformance-corpus.js"
import {
  CanonicalConformanceTraceError,
  compareCanonicalConformanceTrace,
  hashCanonicalConformanceTrace,
  projectCanonicalConformanceTrace,
  type CanonicalConformanceTrace,
  type ProjectCanonicalConformanceTraceInput,
} from "./v1-37-conformance-trace.js"

type DeepMutable<T> = T extends readonly (infer Item)[]
  ? DeepMutable<Item>[]
  : T extends object
    ? { -readonly [Key in keyof T]: DeepMutable<T[Key]> }
    : T

const hash = (character: string): string => `sha256:${character.repeat(64)}`
const traceArena = CANONICAL_ARENA_CATALOG_V1_37.arenas.find(
  ({ id }) => id === "arena:smoke:v1",
)!

const runtime: StrategyRuntime = {
  selectActivations(input: StrategyInput) {
    return {
      ok: true,
      value: {
        activationOrders: input.mySoldiers
          .filter(({ status }) => status === "ACTIVE")
          .slice(0, input.activationCount)
          .map(({ id, ownerPlayerId }) => ({
            soldierId: id,
            objective: { ownerPlayerId },
          })),
        strategyMemory: { roundNumber: input.roundNumber },
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

let cachedRecordedFixture: ReturnType<
  typeof recordChronicleFromExecution
> | null = null
let cachedCompactTransitions:
  | readonly RecordedCanonicalTransitionV137[]
  | null = null

const recordedFixture = () => {
  if (cachedRecordedFixture?.ok) return cachedRecordedFixture
  const execution = MATCH_KERNEL.runMatch({
    matchId: "conformance-trace-match",
    seed: "conformance-trace-seed",
    arenaVariant: {
      id: traceArena.id,
      name: traceArena.name,
      initialBounds: { ...traceArena.initialBounds },
      terrainStones: traceArena.terrainStones.map((position) => ({
        ...position,
      })),
    },
    bottomPlayerId: "bottom",
    topPlayerId: "top",
    bottomStrategyRevisionId: "bottom-revision",
    topStrategyRevisionId: "top-revision",
    runtime: adaptRuntimeForCurrentKernel(runtime),
    maxPhases: 1,
  })
  const recorded = recordChronicleFromExecution({
    execution,
    metadata: {
      schemaVersion: "chronicle-v1.4",
      semanticTupleId: MATCH_KERNEL.tupleId,
      semanticTuple: MATCH_KERNEL.tuple,
    },
  })
  if (!recorded.ok) {
    throw new Error(`fixture recording failed: ${recorded.failure.code}`)
  }
  cachedRecordedFixture = recorded
  return recorded
}

const compactTransitions = (): readonly RecordedCanonicalTransitionV137[] => {
  if (cachedCompactTransitions !== null) return cachedCompactTransitions
  const recorded = recordedFixture()
  const terminal = recorded.recordedTransitions.find(
    ({ terminalStatus }) => terminalStatus !== null,
  )!
  const firstEvent = recorded.recordedTransitions[0]!.orderedEvents[0]!
  const terminalEvent = terminal.orderedEvents.find(
    ({ type }) => type === "MATCH_ENDED",
  )!
  const orderedEvents = [
    { ...firstEvent, sequence: 0 },
    { ...terminalEvent, sequence: 1 },
  ]
  const transition: RecordedCanonicalTransitionV137 = {
    ...terminal,
    ordinal: 0,
    coordinates: { ...terminal.coordinates, ordinal: 0 },
    orderedEvents,
    canonicalOutputHash: computeRecordedCanonicalOutputHashV137(orderedEvents),
    orderedEventsHash: computeRecordedOrderedEventsHashV137(orderedEvents),
    accumulatedTraceRoot: hash("0"),
  }
  cachedCompactTransitions = [
    {
      ...transition,
      accumulatedTraceRoot: computeRecordedTransitionTraceRootV137([
        transition,
      ]),
    },
  ]
  return cachedCompactTransitions
}

const rebuildTransitionEvidence = (
  input: DeepMutable<ProjectCanonicalConformanceTraceInput>,
): void => {
  const prefix: DeepMutable<RecordedCanonicalTransitionV137>[] = []
  for (const transition of input.transitions) {
    transition.canonicalOutputHash = computeRecordedCanonicalOutputHashV137(
      transition.orderedEvents,
    )
    transition.orderedEventsHash = computeRecordedOrderedEventsHashV137(
      transition.orderedEvents,
    )
    prefix.push(transition)
    transition.accumulatedTraceRoot =
      computeRecordedTransitionTraceRootV137(prefix)
  }
}

const successfulInput = ({
  fullTrace = false,
}: {
  readonly fullTrace?: boolean
} = {}): ProjectCanonicalConformanceTraceInput => {
  const recorded = recordedFixture()
  const transitions = fullTrace
    ? recorded.recordedTransitions
    : compactTransitions()
  const first = transitions[0]!
  const last = transitions.at(-1)!
  return {
    corpusVersion: V1_37_CONFORMANCE_CORPUS.version,
    corpusRootSha256: V1_37_CONFORMANCE_CORPUS_ROOT,
    caseId: "normative-first-active-turn-to-stone",
    semanticTupleId: recorded.semanticIdentity.tupleId,
    resultClass: "success",
    invocations: [
      {
        ordinal: 0,
        invocationId: "invocation:select:0",
        methodName: "selectActivations",
        resultClass: "success",
        stableCode: null,
        failingBoundary: "complete",
        canonicalPayloadHash: first.canonicalOutputHash,
        strategyMemoryHash: first.strategyMemoryHash,
        soldierMemoryHash: first.soldierMemoryHash,
        objectiveHash: first.objectiveHash,
        beforeObjectiveHash: hash("6"),
        afterObjectiveHash: hash("7"),
        beforeStateHash: first.beforeStateHash,
        afterStateHash: first.afterStateHash,
        beforeMemoryHash: hash("1"),
        afterMemoryHash: hash("2"),
        gameplayMutation: false,
        memoryMutation: true,
        terminalEffectHash: null,
        retryable: false,
      },
      {
        ordinal: 1,
        invocationId: "invocation:brain:1",
        methodName: "soldierBrain",
        resultClass: "success",
        stableCode: null,
        failingBoundary: "complete",
        canonicalPayloadHash: last.canonicalOutputHash,
        strategyMemoryHash: last.strategyMemoryHash,
        soldierMemoryHash: last.soldierMemoryHash,
        objectiveHash: last.objectiveHash,
        beforeObjectiveHash: hash("7"),
        afterObjectiveHash: hash("8"),
        beforeStateHash: last.beforeStateHash,
        afterStateHash: last.afterStateHash,
        beforeMemoryHash: hash("2"),
        afterMemoryHash: hash("3"),
        gameplayMutation: true,
        memoryMutation: true,
        terminalEffectHash: last.terminalHash,
        retryable: false,
      },
    ],
    transitions,
    finalStateHash: last.afterStateHash,
    outcomeHash: hash("4"),
    failure: null,
  }
}

const failureInput = (): ProjectCanonicalConformanceTraceInput => {
  const input = successfulInput()
  return {
    ...input,
    resultClass: "system_failure",
    invocations: [
      {
        ...input.invocations[0]!,
        resultClass: "system_failure",
        stableCode: "TOOLCHAIN_UNAVAILABLE",
        failingBoundary: "preflight",
        canonicalPayloadHash: null,
        gameplayMutation: false,
        memoryMutation: false,
        afterStateHash: input.invocations[0]!.beforeStateHash,
        afterMemoryHash: input.invocations[0]!.beforeMemoryHash,
        afterObjectiveHash: input.invocations[0]!.beforeObjectiveHash,
        terminalEffectHash: null,
        retryable: true,
      },
    ],
    transitions: [],
    finalStateHash: input.invocations[0]!.beforeStateHash,
    outcomeHash: hash("5"),
    failure: {
      resultClass: "system_failure",
      stableCode: "TOOLCHAIN_UNAVAILABLE",
      failingBoundary: "preflight",
      invocationOrdinal: 0,
      transitionOrdinal: null,
      gameplayMutation: false,
      memoryMutation: false,
      terminalEffectHash: null,
      retryable: true,
    },
  }
}

const invocationOwnedPlayerViolationInput =
  (): ProjectCanonicalConformanceTraceInput => {
    const input = successfulInput()
    const invocation = {
      ...input.invocations[0]!,
      resultClass: "player_violation" as const,
      stableCode: "INVALID_OUTPUT",
      failingBoundary: "runtime-contract",
      canonicalPayloadHash: null,
      gameplayMutation: false,
      memoryMutation: false,
      afterStateHash: input.invocations[0]!.beforeStateHash,
      afterMemoryHash: input.invocations[0]!.beforeMemoryHash,
      afterObjectiveHash: input.invocations[0]!.beforeObjectiveHash,
      terminalEffectHash: null,
      retryable: false,
    }
    return {
      ...input,
      resultClass: "player_violation",
      invocations: [invocation],
      transitions: [],
      finalStateHash: invocation.afterStateHash,
      outcomeHash: hash("5"),
      failure: {
        resultClass: "player_violation",
        stableCode: invocation.stableCode,
        failingBoundary: invocation.failingBoundary,
        invocationOrdinal: 0,
        transitionOrdinal: null,
        gameplayMutation: invocation.gameplayMutation,
        memoryMutation: invocation.memoryMutation,
        terminalEffectHash: invocation.terminalEffectHash,
        retryable: invocation.retryable,
      },
    }
  }

const transitionOwnedPlayerViolationInput =
  (): ProjectCanonicalConformanceTraceInput => {
    const input = globalThis.structuredClone(
      successfulInput(),
    ) as DeepMutable<ProjectCanonicalConformanceTraceInput>
    const transition = input.transitions[0]!
    transition.resultClass = "player_violation"
    transition.orderedEvents[0] = {
      type: "RUNTIME_VIOLATION",
      sequence: 0,
      payload: { playerId: "bottom", type: "INVALID_OUTPUT" },
      context: { actingPlayerId: "bottom" },
      privacy: "owner",
      privatePayloadHash: hash("9"),
    }
    input.resultClass = "player_violation"
    input.failure = {
      resultClass: "player_violation",
      stableCode: "INVALID_OUTPUT",
      failingBoundary: transition.kind,
      invocationOrdinal: null,
      transitionOrdinal: 0,
      gameplayMutation:
        transition.beforeStateHash !== transition.afterStateHash,
      memoryMutation: false,
      terminalEffectHash: transition.terminalHash,
      retryable: false,
    }
    rebuildTransitionEvidence(input)
    return input
  }

const twoTransitionSuccessfulInput =
  (): ProjectCanonicalConformanceTraceInput => {
    const input = globalThis.structuredClone(
      successfulInput(),
    ) as DeepMutable<ProjectCanonicalConformanceTraceInput>
    const original = input.transitions[0]!
    const first: DeepMutable<RecordedCanonicalTransitionV137> = {
      ...globalThis.structuredClone(original),
      ordinal: 0,
      coordinates: { ...original.coordinates, ordinal: 0 },
      orderedEvents: [globalThis.structuredClone(original.orderedEvents[0]!)],
      terminalStatus: null,
      terminalHash: null,
    }
    const second: DeepMutable<RecordedCanonicalTransitionV137> = {
      ...globalThis.structuredClone(original),
      ordinal: 1,
      coordinates: { ...original.coordinates, ordinal: 1 },
      orderedEvents: [globalThis.structuredClone(original.orderedEvents[1]!)],
      beforeStateHash: first.afterStateHash,
    }
    input.transitions = [first, second]
    input.finalStateHash = second.afterStateHash
    rebuildTransitionEvidence(input)
    return input
  }

const mutableTrace = (
  trace: CanonicalConformanceTrace,
): DeepMutable<CanonicalConformanceTrace> =>
  globalThis.structuredClone(trace) as DeepMutable<CanonicalConformanceTrace>

const rehash = (
  trace: DeepMutable<CanonicalConformanceTrace>,
  {
    preserveTransitionRoots = false,
  }: { readonly preserveTransitionRoots?: boolean } = {},
): CanonicalConformanceTrace => {
  if (!preserveTransitionRoots) {
    const prefix: DeepMutable<RecordedCanonicalTransitionV137>[] = []
    for (const transition of trace.transitions) {
      prefix.push(transition)
      transition.accumulatedTraceRoot =
        computeRecordedTransitionTraceRootV137(prefix)
    }
  }
  trace.transitionTraceRoot = computeRecordedTransitionTraceRootV137(
    trace.transitions,
  )
  trace.traceRoot = hashCanonicalConformanceTrace(trace)
  return trace as CanonicalConformanceTrace
}

const semanticallyInvalidMutationFields = new Set([
  "semanticTupleId",
  "invocation.ordinal",
  "invocation.resultClass",
  "invocation.stableCode",
  "invocation.retryable",
  "transition.ordinal",
  "transition.semanticTupleId",
  "transition.coordinates",
  "transition.resultClass",
  "transition.canonicalOutputHash",
  "transition.orderedEvents",
  "transition.orderedEventsHash",
  "transition.afterStateHash",
  "transition.terminalStatus",
  "transition.failureStatus",
  "transition.terminalHash",
  "transition.accumulatedTraceRoot",
  "finalStateHash",
  "transitionTraceRoot",
  "failure.resultClass",
  "failure.stableCode",
  "failure.failingBoundary",
  "failure.invocationOrdinal",
  "failure.transitionOrdinal",
  "failure.gameplayMutation",
  "failure.memoryMutation",
  "failure.terminalEffectHash",
  "failure.retryable",
])

const expectDivergence = (
  expected: CanonicalConformanceTrace,
  actual: CanonicalConformanceTrace,
  field: string,
  coordinate: {
    invocationOrdinal?: number
    transitionOrdinal?: number
  } = {},
): void => {
  expect(actual.traceRoot).not.toBe(expected.traceRoot)
  const comparison = compareCanonicalConformanceTrace({ expected, actual })
  const semanticRejection = semanticallyInvalidMutationFields.has(field)
  expect(comparison).toMatchObject({
    status: "diverged",
    disposition: "quarantine",
    divergence: {
      code: "CANONICAL_CONFORMANCE_TRACE_DIVERGENCE",
      caseId: expected.caseId,
      field: semanticRejection ? "traceSemantics" : field,
      invocationOrdinal: semanticRejection
        ? null
        : (coordinate.invocationOrdinal ?? null),
      transitionOrdinal: semanticRejection
        ? null
        : (coordinate.transitionOrdinal ?? null),
    },
  })
  expect(JSON.stringify(comparison)).not.toMatch(
    /SECRET_|sourceBytes|artifactBytes|strategyMemory":|soldierMemory":|objective":|stderr|diagnostics|hostPath/iu,
  )
}

describe("v1.37 canonical conformance trace", () => {
  it("represents a successful raw-envelope admission without gameplay transitions", () => {
    const input = successfulInput()
    const invocation = {
      ...input.invocations[0]!,
      beforeStateHash: hash("a"),
      afterStateHash: hash("a"),
      beforeMemoryHash: hash("b"),
      afterMemoryHash: hash("b"),
      beforeObjectiveHash: hash("c"),
      afterObjectiveHash: hash("c"),
      gameplayMutation: false,
      memoryMutation: false,
    }
    const trace = projectCanonicalConformanceTrace({
      ...input,
      caseId: "boundary-numeric-negative-zero",
      invocations: [invocation],
      transitions: [],
      finalStateHash: invocation.afterStateHash,
      outcomeHash: hash("d"),
    })

    expect(trace.resultClass).toBe("success")
    expect(trace.transitions).toEqual([])
    expect(trace.invocations).toEqual([invocation])
  })

  it("projects one immutable transition-complete hash-only success trace", () => {
    const trace = projectCanonicalConformanceTrace(
      successfulInput({ fullTrace: true }),
    )

    expect(trace).toMatchObject({
      schemaVersion: "v1.37-canonical-conformance-trace-v1",
      corpusVersion: V1_37_CONFORMANCE_CORPUS.version,
      corpusRootSha256: V1_37_CONFORMANCE_CORPUS_ROOT,
      caseId: "normative-first-active-turn-to-stone",
      semanticTupleId: MATCH_KERNEL.tupleId,
      resultClass: "success",
      failure: null,
    })
    expect(trace.transitionTraceRoot).toBe(
      computeRecordedTransitionTraceRootV137(trace.transitions),
    )
    expect(trace.traceRoot).toBe(hashCanonicalConformanceTrace(trace))
    expect(Object.isFrozen(trace)).toBe(true)
    expect(Object.isFrozen(trace.invocations)).toBe(true)
    expect(Object.isFrozen(trace.invocations[0])).toBe(true)
    expect(Object.isFrozen(trace.transitions)).toBe(true)
    expect(Object.isFrozen(trace.transitions[0])).toBe(true)
    expect(
      compareCanonicalConformanceTrace({ expected: trace, actual: trace }),
    ).toEqual({ status: "equal", traceRoot: trace.traceRoot })

    const serialized = JSON.stringify(trace)
    expect(serialized).not.toMatch(
      /SECRET_|sourceBytes|artifactBytes|strategyMemory":|soldierMemory":|objective":|stderr|diagnostics|hostPath/iu,
    )
  })

  it("never reuses a stale root from a merely shallow-frozen caller trace", () => {
    const expected = projectCanonicalConformanceTrace(successfulInput())
    const actual = mutableTrace(expected)
    Object.freeze(actual)

    expect(hashCanonicalConformanceTrace(actual)).toBe(actual.traceRoot)
    actual.invocations[0]!.objectiveHash = hash("f")

    expect(
      compareCanonicalConformanceTrace({
        expected,
        actual: actual as CanonicalConformanceTrace,
      }),
    ).toMatchObject({
      status: "diverged",
      disposition: "quarantine",
      divergence: {
        field: "traceRoot",
      },
    })
  })

  it("suspends a semantically invalid reviewed oracle even after outer rehash", () => {
    const projected = projectCanonicalConformanceTrace(successfulInput())
    for (const mutate of [
      (trace: DeepMutable<CanonicalConformanceTrace>) => {
        trace.transitions[0]!.accumulatedTraceRoot = hash("f")
      },
      (trace: DeepMutable<CanonicalConformanceTrace>) => {
        trace.transitionTraceRoot = hash("f")
      },
    ]) {
      const corrupted = mutableTrace(projected)
      mutate(corrupted)
      corrupted.traceRoot = hashCanonicalConformanceTrace(corrupted)
      expect(
        compareCanonicalConformanceTrace({
          expected: corrupted as CanonicalConformanceTrace,
          actual: corrupted as CanonicalConformanceTrace,
        }),
      ).toMatchObject({
        status: "oracle_suspended",
        disposition: "suspend_oracle",
        code: "REVIEWED_ORACLE_SEMANTICS_INVALID",
        caseId: projected.caseId,
      })
    }

    const invalidActual = mutableTrace(projected)
    invalidActual.transitions[0]!.accumulatedTraceRoot = hash("f")
    invalidActual.traceRoot = hashCanonicalConformanceTrace(invalidActual)
    expect(
      compareCanonicalConformanceTrace({
        expected: projected,
        actual: invalidActual as CanonicalConformanceTrace,
      }),
    ).toMatchObject({
      status: "diverged",
      disposition: "quarantine",
    })

    const structurallyInvalid = {
      ...projected,
      invocations: null,
    } as unknown as CanonicalConformanceTrace
    expect(
      compareCanonicalConformanceTrace({
        expected: projected,
        actual: structurallyInvalid,
      }),
    ).toMatchObject({
      status: "diverged",
      disposition: "quarantine",
      divergence: { field: "traceSemantics" },
    })
  })

  it("quarantines every invalid candidate semantic before hashing it", () => {
    const expected = projectCanonicalConformanceTrace(successfulInput())
    const invalidCandidates: CanonicalConformanceTrace[] = []

    invalidCandidates.push({
      ...expected,
      invocations: null,
    } as unknown as CanonicalConformanceTrace)

    const invalidIdentifier = mutableTrace(expected)
    invalidIdentifier.caseId = "/private/invalid-case"
    invalidCandidates.push(invalidIdentifier as CanonicalConformanceTrace)

    const invalidHash = mutableTrace(expected)
    invalidHash.finalStateHash = "not-a-hash"
    invalidCandidates.push(invalidHash as CanonicalConformanceTrace)

    const invalidOrder = mutableTrace(expected)
    invalidOrder.invocations[0]!.ordinal = 99
    invalidCandidates.push(invalidOrder as CanonicalConformanceTrace)

    const invalidResult = mutableTrace(expected)
    invalidResult.resultClass = "unexpected" as typeof invalidResult.resultClass
    invalidCandidates.push(invalidResult as CanonicalConformanceTrace)

    const invalidEvent = mutableTrace(expected)
    invalidEvent.transitions[0]!.orderedEvents[0]!.privacy = "owner"
    invalidCandidates.push(invalidEvent as CanonicalConformanceTrace)

    const nonJsonEvent = mutableTrace(expected)
    nonJsonEvent.transitions[0]!.orderedEvents[0]!.payload = {
      privateCounter: 1n,
    } as unknown as (typeof nonJsonEvent.transitions)[0]["orderedEvents"][0]["payload"]
    invalidCandidates.push(nonJsonEvent as CanonicalConformanceTrace)

    const invalidTransitionRoot = mutableTrace(expected)
    invalidTransitionRoot.transitions[0]!.accumulatedTraceRoot = hash("f")
    invalidCandidates.push(invalidTransitionRoot as CanonicalConformanceTrace)

    const invalidTransitionIdentity = mutableTrace(expected)
    invalidTransitionIdentity.transitions[0]!.coordinates.stage =
      "host-private-stage"
    invalidCandidates.push(
      invalidTransitionIdentity as CanonicalConformanceTrace,
    )

    for (const actual of invalidCandidates) {
      expect(() =>
        compareCanonicalConformanceTrace({ expected, actual }),
      ).not.toThrow()
      const comparison = compareCanonicalConformanceTrace({ expected, actual })
      expect(comparison).toMatchObject({
        status: "diverged",
        disposition: "quarantine",
        divergence: { field: "traceSemantics" },
      })
      expect(JSON.stringify(comparison)).not.toMatch(
        /privateCounter|private\/invalid-case|host-private-stage/iu,
      )
    }
  })

  it("rejects host-private and private-preimage fields instead of serializing them", () => {
    for (const field of [
      "sourceBytes",
      "artifactBytes",
      "stderr",
      "diagnostics",
      "hostPath",
      "durationMs",
    ]) {
      const input = globalThis.structuredClone(successfulInput()) as unknown as
        | ProjectCanonicalConformanceTraceInput
        | Record<string, unknown>
      ;(input as Record<string, unknown>)[field] = `SECRET_${field}`
      expect(() =>
        projectCanonicalConformanceTrace(
          input as ProjectCanonicalConformanceTraceInput,
        ),
      ).toThrowError(expect.objectContaining({ code: "TRACE_SHAPE_INVALID" }))
    }

    const invocationLeak = globalThis.structuredClone(
      successfulInput(),
    ) as unknown as Record<string, unknown>
    ;(
      invocationLeak.invocations as Array<Record<string, unknown>>
    )[0]!.strategyMemory = { secret: "SECRET_MEMORY_PREIMAGE" }
    expect(() =>
      projectCanonicalConformanceTrace(
        invocationLeak as unknown as ProjectCanonicalConformanceTraceInput,
      ),
    ).toThrowError(expect.objectContaining({ code: "TRACE_SHAPE_INVALID" }))

    const eventLeak = globalThis.structuredClone(
      successfulInput(),
    ) as DeepMutable<ProjectCanonicalConformanceTraceInput>
    ;(
      eventLeak.transitions[0]!.orderedEvents[0] as unknown as Record<
        string,
        unknown
      >
    ).privatePayload = { secret: "SECRET_EVENT_PREIMAGE" }
    expect(() => projectCanonicalConformanceTrace(eventLeak)).toThrowError(
      expect.objectContaining({ code: "TRACE_SHAPE_INVALID" }),
    )

    const nestedPayloadLeak = globalThis.structuredClone(
      successfulInput(),
    ) as DeepMutable<ProjectCanonicalConformanceTraceInput>
    const payload = nestedPayloadLeak.transitions[0]!.orderedEvents[0]!
      .payload as Record<string, unknown>
    payload.strategyMemory = { secret: "SECRET_MEMORY_PREIMAGE" }
    nestedPayloadLeak.transitions[0]!.accumulatedTraceRoot =
      computeRecordedTransitionTraceRootV137(nestedPayloadLeak.transitions)
    expect(() =>
      projectCanonicalConformanceTrace(nestedPayloadLeak),
    ).toThrowError(expect.objectContaining({ code: "TRACE_EVENT_INVALID" }))

    const nestedContextLeak = globalThis.structuredClone(
      successfulInput(),
    ) as DeepMutable<ProjectCanonicalConformanceTraceInput>
    const leakedEvent = nestedContextLeak.transitions[0]!.orderedEvents[0]!
    leakedEvent.context = {
      ...(leakedEvent.context ?? {}),
      hostPath: "/private/SECRET_HOST_PATH",
    } as typeof leakedEvent.context
    nestedContextLeak.transitions[0]!.accumulatedTraceRoot =
      computeRecordedTransitionTraceRootV137(nestedContextLeak.transitions)
    expect(() =>
      projectCanonicalConformanceTrace(nestedContextLeak),
    ).toThrowError(expect.objectContaining({ code: "TRACE_EVENT_INVALID" }))

    const terminalLeak = globalThis.structuredClone(
      successfulInput(),
    ) as DeepMutable<ProjectCanonicalConformanceTraceInput>
    const terminal = terminalLeak.transitions.find(
      ({ terminalStatus }) => terminalStatus !== null,
    )!
    terminal.terminalStatus = {
      type: "DRAW",
      diagnostics: "SECRET_TERMINAL_DIAGNOSTIC",
    } as unknown as typeof terminal.terminalStatus
    expect(() => projectCanonicalConformanceTrace(terminalLeak)).toThrowError(
      expect.objectContaining({ code: "TRACE_RESULT_INVALID" }),
    )
  })

  it("requires exact public and owner-private event commitments", () => {
    const ownerWithoutCommitment = globalThis.structuredClone(
      transitionOwnedPlayerViolationInput(),
    ) as DeepMutable<ProjectCanonicalConformanceTraceInput>
    const ownerEvent = ownerWithoutCommitment.transitions
      .flatMap(({ orderedEvents }) => orderedEvents)
      .find(({ privacy }) => privacy === "owner")!
    ownerEvent.privatePayloadHash = null
    rebuildTransitionEvidence(ownerWithoutCommitment)
    expect(() =>
      projectCanonicalConformanceTrace(ownerWithoutCommitment),
    ).toThrowError(expect.objectContaining({ code: "TRACE_EVENT_INVALID" }))

    const publicWithCommitment = globalThis.structuredClone(
      successfulInput(),
    ) as DeepMutable<ProjectCanonicalConformanceTraceInput>
    const publicEvent = publicWithCommitment.transitions[0]!.orderedEvents.find(
      ({ privacy }) => privacy === "public",
    )!
    publicEvent.privatePayloadHash = hash("f")
    rebuildTransitionEvidence(publicWithCommitment)
    expect(() =>
      projectCanonicalConformanceTrace(publicWithCommitment),
    ).toThrowError(expect.objectContaining({ code: "TRACE_EVENT_INVALID" }))
  })

  it("requires one global event sequence and exact final terminal evidence", () => {
    const discontinuous = globalThis.structuredClone(
      twoTransitionSuccessfulInput(),
    ) as DeepMutable<ProjectCanonicalConformanceTraceInput>
    const laterTransition = discontinuous.transitions.find(
      ({ ordinal, orderedEvents }) => ordinal > 0 && orderedEvents.length > 0,
    )!
    for (const event of laterTransition.orderedEvents) {
      event.sequence += 1
    }
    rebuildTransitionEvidence(discontinuous)
    expect(() => projectCanonicalConformanceTrace(discontinuous)).toThrowError(
      expect.objectContaining({ code: "TRACE_ORDER_INVALID" }),
    )

    const earlyTerminal = globalThis.structuredClone(
      twoTransitionSuccessfulInput(),
    ) as DeepMutable<ProjectCanonicalConformanceTraceInput>
    const terminal = earlyTerminal.transitions.at(-1)!
    earlyTerminal.transitions[0]!.terminalStatus = globalThis.structuredClone(
      terminal.terminalStatus,
    )
    earlyTerminal.transitions[0]!.terminalHash = terminal.terminalHash
    rebuildTransitionEvidence(earlyTerminal)
    expect(() => projectCanonicalConformanceTrace(earlyTerminal)).toThrowError(
      expect.objectContaining({ code: "TRACE_RESULT_INVALID" }),
    )

    const mismatchedTerminalEvent = globalThis.structuredClone(
      successfulInput(),
    ) as DeepMutable<ProjectCanonicalConformanceTraceInput>
    const finalTransition = mismatchedTerminalEvent.transitions.at(-1)!
    const matchEnded = finalTransition.orderedEvents.find(
      ({ type }) => type === "MATCH_ENDED",
    )!
    matchEnded.payload =
      finalTransition.terminalStatus?.type === "DRAW"
        ? { type: "FAILED", reason: "MAX_PHASES_EXCEEDED" }
        : { type: "DRAW" }
    rebuildTransitionEvidence(mismatchedTerminalEvent)
    expect(() =>
      projectCanonicalConformanceTrace(mismatchedTerminalEvent),
    ).toThrowError(expect.objectContaining({ code: "TRACE_RESULT_INVALID" }))

    const eventAfterTerminal = globalThis.structuredClone(
      successfulInput(),
    ) as DeepMutable<ProjectCanonicalConformanceTraceInput>
    const finalEvents = eventAfterTerminal.transitions.at(-1)!.orderedEvents
    finalEvents.push({
      type: "ROUND_STARTED",
      sequence: finalEvents.length,
      payload: { roundNumber: 1 },
      context: {},
      privacy: "public",
      privatePayloadHash: null,
    })
    rebuildTransitionEvidence(eventAfterTerminal)
    expect(() =>
      projectCanonicalConformanceTrace(eventAfterTerminal),
    ).toThrowError(expect.objectContaining({ code: "TRACE_RESULT_INVALID" }))
  })

  it("rejects noncanonical invocation order, transition roots, and tuple identity", () => {
    const reordered = globalThis.structuredClone(
      successfulInput(),
    ) as DeepMutable<ProjectCanonicalConformanceTraceInput>
    reordered.invocations.reverse()
    expect(() => projectCanonicalConformanceTrace(reordered)).toThrowError(
      expect.objectContaining({ code: "TRACE_ORDER_INVALID" }),
    )

    const badRoot = globalThis.structuredClone(
      successfulInput(),
    ) as DeepMutable<ProjectCanonicalConformanceTraceInput>
    badRoot.transitions[0]!.accumulatedTraceRoot = hash("f")
    expect(() => projectCanonicalConformanceTrace(badRoot)).toThrowError(
      expect.objectContaining({ code: "TRACE_TRANSITION_ROOT_INVALID" }),
    )

    const mixedTuple = globalThis.structuredClone(
      successfulInput(),
    ) as DeepMutable<ProjectCanonicalConformanceTraceInput>
    mixedTuple.transitions[0]!.semanticTupleId = "tuple:substituted"
    expect(() => projectCanonicalConformanceTrace(mixedTuple)).toThrowError(
      expect.objectContaining({ code: "TRACE_TRANSITION_IDENTITY_INVALID" }),
    )

    const invalidStage = globalThis.structuredClone(
      successfulInput(),
    ) as DeepMutable<ProjectCanonicalConformanceTraceInput>
    invalidStage.transitions[0]!.coordinates.stage = "private-host-stage"
    expect(() => projectCanonicalConformanceTrace(invalidStage)).toThrowError(
      expect.objectContaining({ code: "TRACE_TRANSITION_IDENTITY_INVALID" }),
    )

    for (const mutate of [
      (transition: DeepMutable<RecordedCanonicalTransitionV137>) => {
        transition.terminalStatus = null
      },
      (transition: DeepMutable<RecordedCanonicalTransitionV137>) => {
        transition.terminalHash = null
      },
      (transition: DeepMutable<RecordedCanonicalTransitionV137>) => {
        transition.terminalStatus = {
          type: "FAILED",
          reason: "/private/diagnostic",
        }
      },
    ]) {
      const terminalMismatch = globalThis.structuredClone(
        successfulInput(),
      ) as DeepMutable<ProjectCanonicalConformanceTraceInput>
      const transition = terminalMismatch.transitions.find(
        ({ terminalStatus }) => terminalStatus !== null,
      )!
      mutate(transition)
      expect(() =>
        projectCanonicalConformanceTrace(terminalMismatch),
      ).toThrowError(expect.objectContaining({ code: "TRACE_RESULT_INVALID" }))
    }
  })

  it("reports the first safe top-level and invocation divergence without values", () => {
    const expected = projectCanonicalConformanceTrace(successfulInput())
    const topLevelMutations: Array<{
      field: string
      mutate: (trace: DeepMutable<CanonicalConformanceTrace>) => void
    }> = [
      {
        field: "corpusVersion",
        mutate: (trace) => {
          trace.corpusVersion = "v999"
        },
      },
      {
        field: "corpusRootSha256",
        mutate: (trace) => {
          trace.corpusRootSha256 = hash("f")
        },
      },
      {
        field: "caseId",
        mutate: (trace) => {
          trace.caseId = "normative-substituted-case"
        },
      },
      {
        field: "semanticTupleId",
        mutate: (trace) => {
          trace.semanticTupleId = "tuple:substituted"
        },
      },
      {
        field: "invocations.length",
        mutate: (trace) => {
          trace.invocations.pop()
        },
      },
    ]
    for (const { field, mutate } of topLevelMutations) {
      const actual = mutableTrace(expected)
      mutate(actual)
      expectDivergence(expected, rehash(actual), field)
    }

    const invocationMutations: Array<{
      field: string
      mutate: (
        invocation: DeepMutable<
          CanonicalConformanceTrace["invocations"][number]
        >,
      ) => void
    }> = [
      {
        field: "invocation.ordinal",
        mutate: (invocation) => {
          invocation.ordinal = 9
        },
      },
      {
        field: "invocation.invocationId",
        mutate: (invocation) => {
          invocation.invocationId = "invocation:substituted"
        },
      },
      {
        field: "invocation.methodName",
        mutate: (invocation) => {
          invocation.methodName = "soldierBrain"
        },
      },
      {
        field: "invocation.resultClass",
        mutate: (invocation) => {
          invocation.resultClass = "player_violation"
        },
      },
      {
        field: "invocation.stableCode",
        mutate: (invocation) => {
          invocation.stableCode = "SUBSTITUTED"
        },
      },
      {
        field: "invocation.failingBoundary",
        mutate: (invocation) => {
          invocation.failingBoundary = "substituted-boundary"
        },
      },
      {
        field: "invocation.canonicalPayloadHash",
        mutate: (invocation) => {
          invocation.canonicalPayloadHash = hash("f")
        },
      },
      {
        field: "invocation.strategyMemoryHash",
        mutate: (invocation) => {
          invocation.strategyMemoryHash = hash("f")
        },
      },
      {
        field: "invocation.soldierMemoryHash",
        mutate: (invocation) => {
          invocation.soldierMemoryHash = hash("f")
        },
      },
      {
        field: "invocation.objectiveHash",
        mutate: (invocation) => {
          invocation.objectiveHash = hash("f")
        },
      },
      {
        field: "invocation.beforeObjectiveHash",
        mutate: (invocation) => {
          invocation.beforeObjectiveHash = hash("f")
        },
      },
      {
        field: "invocation.afterObjectiveHash",
        mutate: (invocation) => {
          invocation.afterObjectiveHash = hash("f")
        },
      },
      {
        field: "invocation.beforeStateHash",
        mutate: (invocation) => {
          invocation.beforeStateHash = hash("f")
        },
      },
      {
        field: "invocation.afterStateHash",
        mutate: (invocation) => {
          invocation.afterStateHash = hash("f")
        },
      },
      {
        field: "invocation.beforeMemoryHash",
        mutate: (invocation) => {
          invocation.beforeMemoryHash = hash("f")
        },
      },
      {
        field: "invocation.afterMemoryHash",
        mutate: (invocation) => {
          invocation.afterMemoryHash = hash("f")
        },
      },
      {
        field: "invocation.gameplayMutation",
        mutate: (invocation) => {
          invocation.gameplayMutation = !invocation.gameplayMutation
        },
      },
      {
        field: "invocation.memoryMutation",
        mutate: (invocation) => {
          invocation.memoryMutation = !invocation.memoryMutation
        },
      },
      {
        field: "invocation.terminalEffectHash",
        mutate: (invocation) => {
          invocation.terminalEffectHash = hash("f")
        },
      },
      {
        field: "invocation.retryable",
        mutate: (invocation) => {
          invocation.retryable = !invocation.retryable
        },
      },
    ]
    for (const { field, mutate } of invocationMutations) {
      const actual = mutableTrace(expected)
      mutate(actual.invocations[0]!)
      expectDivergence(expected, rehash(actual), field, {
        invocationOrdinal: 0,
      })
    }
  })

  it("reports every transition, terminal, final, and root dimension at its first coordinate", () => {
    const expected = projectCanonicalConformanceTrace(successfulInput())
    const terminalIndex = expected.transitions.findIndex(
      ({ terminalStatus }) => terminalStatus !== null,
    )
    const multiEventIndex = expected.transitions.findIndex(
      ({ orderedEvents }) => orderedEvents.length > 1,
    )
    expect(terminalIndex).toBeGreaterThanOrEqual(0)
    expect(multiEventIndex).toBeGreaterThanOrEqual(0)

    const transitionMutations: Array<{
      field: string
      index?: number
      mutate: (
        transition: DeepMutable<
          CanonicalConformanceTrace["transitions"][number]
        >,
      ) => void
    }> = [
      {
        field: "transition.ordinal",
        mutate: (transition) => {
          transition.ordinal = 9
        },
      },
      {
        field: "transition.kind",
        mutate: (transition) => {
          transition.kind = `${transition.kind}:SUBSTITUTED`
        },
      },
      {
        field: "transition.semanticTupleId",
        mutate: (transition) => {
          transition.semanticTupleId = "tuple:substituted"
        },
      },
      {
        field: "transition.coordinates",
        mutate: (transition) => {
          transition.coordinates.stage = `${transition.coordinates.stage}:substituted`
        },
      },
      {
        field: "transition.resultClass",
        mutate: (transition) => {
          transition.resultClass = "player_violation"
        },
      },
      {
        field: "transition.canonicalOutputHash",
        mutate: (transition) => {
          transition.canonicalOutputHash = hash("f")
        },
      },
      {
        field: "transition.strategyMemoryHash",
        mutate: (transition) => {
          transition.strategyMemoryHash = hash("f")
        },
      },
      {
        field: "transition.soldierMemoryHash",
        mutate: (transition) => {
          transition.soldierMemoryHash = hash("f")
        },
      },
      {
        field: "transition.objectiveHash",
        mutate: (transition) => {
          transition.objectiveHash = hash("f")
        },
      },
      {
        field: "transition.orderedEvents",
        index: multiEventIndex,
        mutate: (transition) => {
          transition.orderedEvents.reverse()
        },
      },
      {
        field: "transition.orderedEventsHash",
        mutate: (transition) => {
          transition.orderedEventsHash = hash("f")
        },
      },
      {
        field: "transition.beforeStateHash",
        mutate: (transition) => {
          transition.beforeStateHash = hash("f")
        },
      },
      {
        field: "transition.afterStateHash",
        mutate: (transition) => {
          transition.afterStateHash = hash("f")
        },
      },
      {
        field: "transition.beforeMachineHash",
        mutate: (transition) => {
          transition.beforeMachineHash = hash("f")
        },
      },
      {
        field: "transition.afterMachineHash",
        mutate: (transition) => {
          transition.afterMachineHash = hash("f")
        },
      },
      {
        field: "transition.terminalStatus",
        index: terminalIndex,
        mutate: (transition) => {
          transition.terminalStatus = null
        },
      },
      {
        field: "transition.failureStatus",
        mutate: (transition) => {
          transition.failureStatus = {
            code: "SUBSTITUTED",
          } as unknown as null
        },
      },
      {
        field: "transition.terminalHash",
        index: terminalIndex,
        mutate: (transition) => {
          transition.terminalHash = hash("f")
        },
      },
      {
        field: "transition.accumulatedTraceRoot",
        mutate: (transition) => {
          transition.accumulatedTraceRoot = hash("f")
        },
      },
    ]

    for (const { field, index = 0, mutate } of transitionMutations) {
      const actual = mutableTrace(expected)
      mutate(actual.transitions[index]!)
      expectDivergence(
        expected,
        rehash(actual, {
          preserveTransitionRoots: field === "transition.accumulatedTraceRoot",
        }),
        field,
        {
          transitionOrdinal: index,
        },
      )
    }

    const aggregateMutations: Array<{
      field: string
      mutate: (trace: DeepMutable<CanonicalConformanceTrace>) => void
    }> = [
      {
        field: "transitions.length",
        mutate: (trace) => {
          trace.transitions.pop()
        },
      },
      {
        field: "finalStateHash",
        mutate: (trace) => {
          trace.finalStateHash = hash("f")
        },
      },
      {
        field: "outcomeHash",
        mutate: (trace) => {
          trace.outcomeHash = hash("f")
        },
      },
      {
        field: "transitionTraceRoot",
        mutate: (trace) => {
          trace.transitionTraceRoot = hash("f")
        },
      },
    ]
    for (const { field, mutate } of aggregateMutations) {
      const actual = mutableTrace(expected)
      mutate(actual)
      if (field === "transitionTraceRoot") {
        actual.traceRoot = hashCanonicalConformanceTrace(actual)
        expectDivergence(expected, actual as CanonicalConformanceTrace, field)
      } else {
        expectDivergence(expected, rehash(actual), field)
      }
    }

    const invalidRoot = mutableTrace(expected)
    invalidRoot.traceRoot = hash("f")
    expect(
      compareCanonicalConformanceTrace({
        expected,
        actual: invalidRoot as CanonicalConformanceTrace,
      }),
    ).toMatchObject({
      status: "diverged",
      disposition: "quarantine",
      divergence: { field: "traceRoot" },
    })

    const disputed = mutableTrace(expected)
    disputed.traceRoot = hash("f")
    expect(
      compareCanonicalConformanceTrace({
        expected: disputed as CanonicalConformanceTrace,
        actual: expected,
      }),
    ).toMatchObject({
      status: "oracle_suspended",
      disposition: "suspend_oracle",
      code: "REVIEWED_ORACLE_ROOT_MISMATCH",
      caseId: expected.caseId,
    })
  })

  it("compares every negative failure dimension without messages or private values", () => {
    const expected = projectCanonicalConformanceTrace(failureInput())
    expect(expected.resultClass).toBe("system_failure")
    expect(expected.failure).not.toBeNull()

    const failureMutations: Array<{
      field: string
      mutate: (
        failure: NonNullable<DeepMutable<CanonicalConformanceTrace>["failure"]>,
      ) => void
    }> = [
      {
        field: "failure.resultClass",
        mutate: (failure) => {
          failure.resultClass = "player_violation"
        },
      },
      {
        field: "failure.stableCode",
        mutate: (failure) => {
          failure.stableCode = "SUBSTITUTED"
        },
      },
      {
        field: "failure.failingBoundary",
        mutate: (failure) => {
          failure.failingBoundary = "substituted-boundary"
        },
      },
      {
        field: "failure.invocationOrdinal",
        mutate: (failure) => {
          failure.invocationOrdinal = null
        },
      },
      {
        field: "failure.transitionOrdinal",
        mutate: (failure) => {
          failure.transitionOrdinal = 0
        },
      },
      {
        field: "failure.gameplayMutation",
        mutate: (failure) => {
          failure.gameplayMutation = true
        },
      },
      {
        field: "failure.memoryMutation",
        mutate: (failure) => {
          failure.memoryMutation = true
        },
      },
      {
        field: "failure.terminalEffectHash",
        mutate: (failure) => {
          failure.terminalEffectHash = hash("f")
        },
      },
      {
        field: "failure.retryable",
        mutate: (failure) => {
          failure.retryable = false
        },
      },
    ]

    for (const { field, mutate } of failureMutations) {
      const actual = mutableTrace(expected)
      mutate(actual.failure!)
      expectDivergence(expected, rehash(actual), field, {
        ...(expected.failure!.invocationOrdinal === null
          ? {}
          : { invocationOrdinal: expected.failure!.invocationOrdinal }),
        ...(expected.failure!.transitionOrdinal === null
          ? {}
          : { transitionOrdinal: expected.failure!.transitionOrdinal }),
      })
    }

    const success = projectCanonicalConformanceTrace(successfulInput())
    expectDivergence(success, expected, "resultClass")
  })

  it("rejects mutating or contradictory system-failure evidence", () => {
    const mutations: Array<
      (input: DeepMutable<ProjectCanonicalConformanceTraceInput>) => void
    > = [
      (input) => {
        input.failure!.gameplayMutation = true
      },
      (input) => {
        input.failure!.memoryMutation = true
      },
      (input) => {
        input.failure!.terminalEffectHash = hash("f")
      },
      (input) => {
        input.invocations[0]!.afterStateHash = hash("f")
      },
      (input) => {
        input.invocations[0]!.afterMemoryHash = hash("f")
      },
      (input) => {
        input.invocations[0]!.afterObjectiveHash = hash("f")
      },
      (input) => {
        input.invocations[0]!.resultClass = "success"
        input.invocations[0]!.stableCode = null
        input.invocations[0]!.canonicalPayloadHash = hash("f")
        input.invocations[0]!.retryable = false
      },
      (input) => {
        input.invocations[0]!.stableCode = "DIFFERENT_FAILURE"
      },
      (input) => {
        input.invocations[0]!.failingBoundary = "different-boundary"
      },
      (input) => {
        input.invocations[0]!.retryable = false
      },
    ]

    for (const mutate of mutations) {
      const input = globalThis.structuredClone(
        failureInput(),
      ) as DeepMutable<ProjectCanonicalConformanceTraceInput>
      mutate(input)
      expect(() => projectCanonicalConformanceTrace(input)).toThrowError(
        expect.objectContaining({ code: "TRACE_RESULT_INVALID" }),
      )
    }
  })

  it("requires one uniquely referenced nonmutating system-failure invocation", () => {
    const successWithSystemFailure = globalThis.structuredClone(
      successfulInput(),
    ) as DeepMutable<ProjectCanonicalConformanceTraceInput>
    Object.assign(successWithSystemFailure.invocations[0]!, {
      resultClass: "system_failure",
      stableCode: "TOOLCHAIN_UNAVAILABLE",
      canonicalPayloadHash: null,
      gameplayMutation: false,
      memoryMutation: false,
      afterStateHash: successWithSystemFailure.invocations[0]!.beforeStateHash,
      afterMemoryHash:
        successWithSystemFailure.invocations[0]!.beforeMemoryHash,
      afterObjectiveHash:
        successWithSystemFailure.invocations[0]!.beforeObjectiveHash,
      terminalEffectHash: null,
      retryable: true,
    })
    expect(() =>
      projectCanonicalConformanceTrace(successWithSystemFailure),
    ).toThrowError(expect.objectContaining({ code: "TRACE_RESULT_INVALID" }))

    const nullReference = globalThis.structuredClone(
      failureInput(),
    ) as DeepMutable<ProjectCanonicalConformanceTraceInput>
    nullReference.failure!.invocationOrdinal = null
    expect(() => projectCanonicalConformanceTrace(nullReference)).toThrowError(
      expect.objectContaining({ code: "TRACE_RESULT_INVALID" }),
    )

    const duplicate = globalThis.structuredClone(
      failureInput(),
    ) as DeepMutable<ProjectCanonicalConformanceTraceInput>
    duplicate.invocations.push({
      ...duplicate.invocations[0]!,
      ordinal: 1,
      invocationId: "invocation:failure:duplicate",
    })
    expect(() => projectCanonicalConformanceTrace(duplicate)).toThrowError(
      expect.objectContaining({ code: "TRACE_RESULT_INVALID" }),
    )
  })

  it("requires every player violation to own exact invocation or transition evidence", () => {
    expect(() =>
      projectCanonicalConformanceTrace(invocationOwnedPlayerViolationInput()),
    ).not.toThrow()
    expect(() =>
      projectCanonicalConformanceTrace(transitionOwnedPlayerViolationInput()),
    ).not.toThrow()

    const successWithViolationInvocation = globalThis.structuredClone(
      successfulInput(),
    ) as DeepMutable<ProjectCanonicalConformanceTraceInput>
    Object.assign(successWithViolationInvocation.invocations[0]!, {
      resultClass: "player_violation",
      stableCode: "INVALID_OUTPUT",
      failingBoundary: "runtime-contract",
      canonicalPayloadHash: null,
      gameplayMutation: false,
      memoryMutation: false,
      afterStateHash:
        successWithViolationInvocation.invocations[0]!.beforeStateHash,
      afterMemoryHash:
        successWithViolationInvocation.invocations[0]!.beforeMemoryHash,
      afterObjectiveHash:
        successWithViolationInvocation.invocations[0]!.beforeObjectiveHash,
      terminalEffectHash: null,
      retryable: false,
    })
    expect(() =>
      projectCanonicalConformanceTrace(successWithViolationInvocation),
    ).toThrowError(expect.objectContaining({ code: "TRACE_RESULT_INVALID" }))

    const successWithViolationTransition = globalThis.structuredClone(
      successfulInput(),
    ) as DeepMutable<ProjectCanonicalConformanceTraceInput>
    successWithViolationTransition.transitions[0]!.resultClass =
      "player_violation"
    rebuildTransitionEvidence(successWithViolationTransition)
    expect(() =>
      projectCanonicalConformanceTrace(successWithViolationTransition),
    ).toThrowError(expect.objectContaining({ code: "TRACE_RESULT_INVALID" }))

    const unreferenced = globalThis.structuredClone(
      transitionOwnedPlayerViolationInput(),
    ) as DeepMutable<ProjectCanonicalConformanceTraceInput>
    unreferenced.failure!.transitionOrdinal = null
    expect(() => projectCanonicalConformanceTrace(unreferenced)).toThrowError(
      expect.objectContaining({ code: "TRACE_RESULT_INVALID" }),
    )

    const ambiguousDualOwner = globalThis.structuredClone(
      transitionOwnedPlayerViolationInput(),
    ) as DeepMutable<ProjectCanonicalConformanceTraceInput>
    const failure = ambiguousDualOwner.failure!
    Object.assign(ambiguousDualOwner.invocations[0]!, {
      resultClass: "player_violation",
      stableCode: failure.stableCode,
      failingBoundary: failure.failingBoundary,
      canonicalPayloadHash: null,
      gameplayMutation: failure.gameplayMutation,
      memoryMutation: failure.memoryMutation,
      terminalEffectHash: failure.terminalEffectHash,
      retryable: failure.retryable,
    })
    failure.invocationOrdinal = 0
    expect(() =>
      projectCanonicalConformanceTrace(ambiguousDualOwner),
    ).toThrowError(expect.objectContaining({ code: "TRACE_RESULT_INVALID" }))

    const mutations: Array<
      (input: DeepMutable<ProjectCanonicalConformanceTraceInput>) => void
    > = [
      (input) => {
        input.transitions[0]!.resultClass = "success"
      },
      (input) => {
        input.failure!.stableCode = "TIMEOUT"
      },
      (input) => {
        input.failure!.failingBoundary = "different-boundary"
      },
      (input) => {
        input.failure!.gameplayMutation = !input.failure!.gameplayMutation
      },
      (input) => {
        input.failure!.memoryMutation = true
      },
      (input) => {
        input.failure!.terminalEffectHash = null
      },
      (input) => {
        input.failure!.retryable = true
      },
    ]
    for (const mutate of mutations) {
      const input = globalThis.structuredClone(
        transitionOwnedPlayerViolationInput(),
      ) as DeepMutable<ProjectCanonicalConformanceTraceInput>
      mutate(input)
      rebuildTransitionEvidence(input)
      expect(() => projectCanonicalConformanceTrace(input)).toThrowError(
        expect.objectContaining({ code: "TRACE_RESULT_INVALID" }),
      )
    }
  })

  it("requires continuous transition state and exact final-state ownership", () => {
    const valid = twoTransitionSuccessfulInput()
    expect(() => projectCanonicalConformanceTrace(valid)).not.toThrow()
    expect(() => projectCanonicalConformanceTrace(failureInput())).not.toThrow()
    expect(() =>
      projectCanonicalConformanceTrace(invocationOwnedPlayerViolationInput()),
    ).not.toThrow()

    for (const mutate of [
      (input: DeepMutable<ProjectCanonicalConformanceTraceInput>) => {
        input.transitions[1]!.beforeStateHash = hash("f")
      },
      (input: DeepMutable<ProjectCanonicalConformanceTraceInput>) => {
        input.finalStateHash = hash("f")
      },
    ]) {
      const invalid = globalThis.structuredClone(
        valid,
      ) as DeepMutable<ProjectCanonicalConformanceTraceInput>
      mutate(invalid)
      rebuildTransitionEvidence(invalid)
      expect(() => projectCanonicalConformanceTrace(invalid)).toThrowError(
        expect.objectContaining({ code: "TRACE_RESULT_INVALID" }),
      )
    }

    const projected = projectCanonicalConformanceTrace(valid)
    const corruptedOracle = mutableTrace(projected)
    corruptedOracle.transitions[1]!.beforeStateHash = hash("f")
    rebuildTransitionEvidence(corruptedOracle)
    const selfRehashed = rehash(corruptedOracle)
    expect(
      compareCanonicalConformanceTrace({
        expected: selfRehashed,
        actual: selfRehashed,
      }),
    ).toMatchObject({
      status: "oracle_suspended",
      disposition: "suspend_oracle",
      code: "REVIEWED_ORACLE_SEMANTICS_INVALID",
    })
  })

  it("uses typed stable projector errors", () => {
    const invalid = globalThis.structuredClone(
      successfulInput(),
    ) as DeepMutable<ProjectCanonicalConformanceTraceInput>
    invalid.corpusRootSha256 = "not-a-hash"
    try {
      projectCanonicalConformanceTrace(invalid)
      throw new Error("invalid trace accepted")
    } catch (error) {
      expect(error).toBeInstanceOf(CanonicalConformanceTraceError)
      expect((error as CanonicalConformanceTraceError).code).toBe(
        "TRACE_HASH_INVALID",
      )
    }
  })

  it("exports one read-only corpus and trace contract without golden-writing authority", async () => {
    const entrypoint = await import("./index.js")

    expect(entrypoint).toMatchObject({
      V1_37_CONFORMANCE_CORPUS,
      V1_37_CONFORMANCE_CORPUS_ROOT,
      projectCanonicalConformanceTrace,
      hashCanonicalConformanceTrace,
      compareCanonicalConformanceTrace,
    })
    expect(Object.keys(entrypoint)).not.toEqual(
      expect.arrayContaining([
        "approveGolden",
        "generateGolden",
        "promoteGolden",
        "updateGolden",
        "writeGolden",
        "sourceBytes",
        "artifactBytes",
        "strategyMemory",
        "soldierMemory",
        "objective",
        "diagnostics",
      ]),
    )
  })

  it("binds the active trace oracle to exact independently reviewed immutable evidence", () => {
    const root = path.resolve(import.meta.dirname, "../../..")
    const fixtureRoot = path.join(
      root,
      "packages/golden/src/fixtures/v1-37-conformance-traces",
    )
    const registryBytes = readFileSync(path.join(fixtureRoot, "registry.json"))
    const registry = JSON.parse(registryBytes.toString("utf8"))
    const activeDirectory = path.join(fixtureRoot, registry.activeVersion)
    const manifestBytes = readFileSync(
      path.join(activeDirectory, "manifest.json"),
    )
    const diffBytes = readFileSync(
      path.join(activeDirectory, "semantic-diff.json"),
    )
    const reviewBytes = readFileSync(
      path.join(activeDirectory, "independent-review.json"),
    )
    const dispositionBytes = readFileSync(
      path.join(activeDirectory, "compatibility-disposition.json"),
    )
    const manifest = JSON.parse(manifestBytes.toString("utf8"))
    const diff = JSON.parse(diffBytes.toString("utf8"))
    const review = JSON.parse(reviewBytes.toString("utf8"))
    const disposition = JSON.parse(dispositionBytes.toString("utf8"))
    const historicalManifest = JSON.parse(
      readFileSync(
        path.join(fixtureRoot, "v1.37-conformance-trace-v3", "manifest.json"),
      ).toString("utf8"),
    )
    const digest = (bytes: Uint8Array) =>
      `sha256:${createHash("sha256").update(bytes).digest("hex")}`

    expect(registry).toMatchObject({
      schemaVersion: "v1.37-conformance-trace-registry-v1",
      activeVersion: "v1.37-observation-trace-v4",
      activePath:
        "packages/golden/src/fixtures/v1-37-conformance-traces/v1.37-observation-trace-v4",
      candidateRootSha256: manifest.candidateRootSha256,
      manifestSha256: digest(manifestBytes),
      semanticDiffSha256: digest(diffBytes),
      independentReviewSha256: digest(reviewBytes),
      compatibilityDispositionSha256: digest(dispositionBytes),
      caseCount: 30,
    })
    expect(review).toMatchObject({
      schemaVersion: "v1.37-observation-trace-independent-review-v1",
      candidateVersion: "v1.37-observation-trace-v4",
      status: "approved-inactive-observation-candidate",
      candidateRootSha256: registry.candidateRootSha256,
      caseCount: 30,
    })
    expect(
      Object.values(diff.protectedSurfaces).every(
        (value: unknown) =>
          typeof value === "object" &&
          value !== null &&
          (value as { changeCount?: unknown }).changeCount === 0,
      ),
    ).toBe(true)
    expect(disposition).toMatchObject({
      status: "observation-only-compatible-candidate",
      candidateVersion: "v1.37-observation-trace-v4",
      caseCount: 30,
      approval: null,
    })
    expect(manifest).toMatchObject({
      candidateVersion: "v1.37-observation-trace-v4",
      candidateRootSha256: registry.candidateRootSha256,
      caseCount: 30,
    })
    expect(manifest.cases).toHaveLength(30)

    expect(historicalManifest).toMatchObject({
      candidateVersion: "v1.37-conformance-trace-v3",
      candidateRootSha256:
        "sha256:53ac4a34b8ea3a52b65b566dfb1da94cbc36ce220c590fe46c0bf43489668696",
      caseCount: 16,
    })
    expect(historicalManifest.cases).toHaveLength(16)
  })
})
