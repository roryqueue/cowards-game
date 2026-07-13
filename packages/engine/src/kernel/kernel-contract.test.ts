import { describe, expect, it } from "vitest"
import { CANONICAL_COMPATIBILITY_TUPLES } from "@cowards/spec"
import * as enginePublic from "../index.js"
import { createFakeRuntime } from "../test/fake-runtime.js"

const MISSING_AUTHORITY_MARKER =
  "[EXPECTED_RED:MISSING_KERNEL_AUTHORITY]" as const

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
} as const

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
  events: readonly Readonly<Record<string, unknown>>[]
  beforeStateHash: string
  afterStateHash: string
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
    CANDIDATE_MATCH_KERNEL?: CandidateMatchKernelAuthority
  }
).CANDIDATE_MATCH_KERNEL

const withoutRuntime = (): Readonly<Record<string, unknown>> => ({
  ...matchInput,
})

const withRuntime = (): Readonly<Record<string, unknown>> => ({
  ...matchInput,
  runtime: createFakeRuntime({ action: { type: "TURN_TO_STONE" } }),
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
  const currentTuple = CANONICAL_COMPATIBILITY_TUPLES[0]!
  expect(record.transitionKind.length).toBeGreaterThan(0)
  expect(record.semanticTupleId).toBe(currentTuple.tupleId)
  expect(record.semanticTuple).toEqual(currentTuple.tuple)
  expect(record.coordinates).toEqual(expect.any(Object))
  expect(record.classification.length).toBeGreaterThan(0)
  expect(record.events).toEqual(expect.any(Array))
  expect(record.beforeStateHash).toMatch(/^sha256:[0-9a-f]{64}$/u)
  expect(record.afterStateHash).toMatch(/^sha256:[0-9a-f]{64}$/u)
  expect(Object.hasOwn(record, "terminalStatus")).toBe(true)
  expect(Object.hasOwn(record, "failureStatus")).toBe(true)
  expectNoPrivateTransitionData(record)
}

describe("Phase 257 canonical Match kernel contract", () => {
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

  it("driver execution is deterministic and returns its identical ordered canonical stream", () => {
    if (candidateAuthority === undefined) return
    const first = candidateAuthority.runMatch(withRuntime())
    const second = candidateAuthority.runMatch(withRuntime())

    expect(first).toEqual(second)
    expect(first.kind).toBe("completed")
    expect(first.transitions.length).toBeGreaterThan(0)
    first.transitions.forEach(expectRecordContract)

    const transitionEvents = first.transitions.flatMap(
      (transition) => transition.events,
    )
    expect(first.result?.events).toEqual(transitionEvents)
    expect(
      transitionEvents.filter((event) => event.type === "MATCH_ENDED"),
    ).toHaveLength(1)
    expectNoPrivateTransitionData(first.transitions)
  })
})
