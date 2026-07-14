import { createHash } from "node:crypto"
import { describe, expect, it } from "vitest"
import {
  RUNTIME_INVOCATION_V1_17_TEST_KEY_ID,
  RUNTIME_INVOCATION_V1_17_PLAYER_VIOLATIONS,
  createAuthenticatedRuntimeInvocationRequestV117,
  serializeRuntimeInvocationRequestV117,
  type AuthenticatedRuntimeInvocationRequestV117,
  type JsonValue,
  type RuntimeInvocationResultV117,
  type RuntimeInvocationTraceV117,
  type SoldierBrainInput,
  type SoldierBrainResult,
  type StrategyInput,
  type StrategyResult,
} from "@cowards/spec"
import { MATCH_KERNEL } from "../index.js"
import type { GameState } from "../types.js"
import type { KernelEffectRequest } from "./types.js"
import type { CandidateBoundRuntimeInvocationV117 } from "./types.js"

const matchInput = {
  matchId: "phase-258-runtime-ownership",
  seed: "phase-258-runtime-ownership-seed",
  arenaVariant: {
    id: "phase-258-runtime-ownership-arena",
    name: "Phase 258 runtime ownership arena",
    initialBounds: { minX: 0, maxX: 11, minY: 0, maxY: 11 },
    terrainStones: [],
  },
  bottomPlayerId: "phase-258-bottom",
  topPlayerId: "phase-258-top",
  bottomStrategyRevisionId: "phase-258-bottom-revision",
  topStrategyRevisionId: "phase-258-top-revision",
}

const sha256 = (value: unknown): string =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex")

const candidateRequestFor = (
  request: KernelEffectRequest,
): AuthenticatedRuntimeInvocationRequestV117 =>
  createAuthenticatedRuntimeInvocationRequestV117(
    {
      requestId: "runtime-request:phase-258",
      invocationId: `invocation:${request.requestId}`,
      kernelRequestId: request.requestId,
      method: request.kind,
      semanticTuple: {
        rules: "cowards-rules-v1.4",
        engine: "engine-kernel-v1.37-candidate-1",
        runtimeAbi: "strategy-runtime-abi-v1.17",
        chronicle: "chronicle-recorder-current-events-v1.37-candidate-1",
        arenaCatalog: "semantic-arena-catalog-v1.37-candidate-1",
        setPolicy: "canonical-set-policy-v1.4",
      },
      sourceIdentity: {
        strategyRevisionId: "strategy-revision:phase-258",
        originalSourceSha256: `sha256:${"a".repeat(64)}`,
        normalizedSourceSha256: `sha256:${"b".repeat(64)}`,
        artifactSha256: `sha256:${"c".repeat(64)}`,
      },
      budget: {
        profileId: "runtime-budget-profile-v1.17-candidate",
        wallMilliseconds: 50,
        computeFuel: 10_000_000,
        memoryBytes: 67_108_864,
        outputBytes: 262_144,
        processLimit: 1,
        matchCumulative: {
          invocationCountMaximum: 260,
          wallMilliseconds: 13_000,
          computeFuel: 2_600_000_000,
          payloadBytes: 68_157_440,
          stdoutBytes: 68_157_440,
          stderrBytes: 17_039_360,
          memoryBytes: 67_108_864,
          accounting:
            "signed-monotonic-per-invocation-deltas-plus-cumulative-total",
          overflow:
            "stop-before-next-invocation-and-classify-by-proven-cause",
        },
      },
      input: { value: request.input as unknown as JsonValue },
      retry: {
        retryId: `retry:${request.requestId}`,
        attempt: 0,
        previousRequestSha256: null,
      },
    },
    {
      keyId: RUNTIME_INVOCATION_V1_17_TEST_KEY_ID,
      secret: "fixture-only:phase-258-engine-binding",
    },
  )

const traceFor = (
  request: KernelEffectRequest,
  overrides: Partial<RuntimeInvocationTraceV117> = {},
): RuntimeInvocationTraceV117 => {
  const candidate = candidateRequestFor(request)
  return {
    requestId: candidate.requestId,
    invocationId: candidate.invocationId,
    kernelRequestId: candidate.kernelRequestId,
    method: candidate.method,
    requestSha256: `sha256:${createHash("sha256")
      .update(serializeRuntimeInvocationRequestV117(candidate))
      .digest("hex")}`,
    budgetProfileSha256: candidate.budget.profileSha256,
    inputSha256: candidate.input.canonicalSha256,
    retryIdentitySha256: candidate.retry.identitySha256,
    safeCodes: [],
    ...overrides,
  }
}

const bindOutcome = <TValue,>(
  request: KernelEffectRequest,
  outcome: RuntimeInvocationResultV117<TValue>,
): CandidateBoundRuntimeInvocationV117<TValue> => ({
  kind: "v1_17_bound",
  request: candidateRequestFor(request),
  outcome,
})

const initialState = (): GameState =>
  (MATCH_KERNEL.createMachine(matchInput) as { state: GameState }).state

const withPrivateMemory = (): GameState => {
  const state = globalThis.structuredClone(initialState())
  state.players[0].strategyMemory = { retainedStrategy: "bottom" }
  state.players[1].strategyMemory = { retainedStrategy: "top" }
  state.soldiers = state.soldiers.map((soldier, index) => ({
    ...soldier,
    soldierMemory: { retainedSoldier: index },
  }))
  return state
}

type RuntimeRequestFor<TKind extends KernelEffectRequest["kind"]> = Extract<
  KernelEffectRequest,
  { kind: TKind }
>

const soldierEffectFor = (
  state: GameState,
  soldierId: string,
): RuntimeRequestFor<"soldierBrain"> => {
  let machine = MATCH_KERNEL.createActivationMachineV117({ state, soldierId })
  for (let step = 0; step < 20; step += 1) {
    const result = MATCH_KERNEL.stepMatch(machine, { kind: "advance" })
    if (result.kind === "effect") {
      if (result.request.kind !== "soldierBrain") {
        throw new Error("candidate activation yielded wrong effect")
      }
      return result.request
    }
    if (result.kind !== "transition") {
      throw new Error("candidate activation failed before Soldier effect")
    }
    machine = result.machine
  }
  throw new Error("candidate activation did not yield a Soldier effect")
}

describe("Phase 258 successor runtime ownership", () => {
  it("preserves the current v1.14 one-argument mutable runtime call", () => {
    const state = withPrivateMemory()
    const soldier = state.soldiers.find(
      (candidate) => candidate.ownerPlayerId === state.players[0].id,
    )
    if (!soldier) throw new Error("missing fixture soldier")
    soldier.soldierMemory = { n: 0 }
    let callContract: unknown

    const execution = MATCH_KERNEL.runActivationFromState({
      state,
      soldierId: soldier.id,
      runtime: {
        selectActivations() {
          throw new Error("selection is unreachable in activation mode")
        },
        runSoldierBrain(input: SoldierBrainInput) {
          callContract = {
            argumentCount: arguments.length,
            inputFrozen: Object.isFrozen(input),
            memoryFrozen: Object.isFrozen(input.soldierMemory),
          }
          ;(input.soldierMemory as { n: number }).n += 1
          return {
            ok: true as const,
            value: {
              action: { type: "TURN_TO_STONE" as const },
              soldierMemory: input.soldierMemory,
            },
          }
        },
      },
    })

    expect(callContract).toEqual({
      argumentCount: 1,
      inputFrozen: false,
      memoryFrozen: false,
    })
    expect(execution).toMatchObject({ kind: "completed" })
    expect(
      execution.result?.state.soldiers.find(({ id }) => id === soldier.id)
        ?.soldierMemory,
    ).toEqual({ n: 1 })
  })

  it("makes v1.17 effect identity unique to the complete prestate", () => {
    const state = withPrivateMemory()
    const soldier = state.soldiers.find(
      (candidate) => candidate.ownerPlayerId === state.players[0].id,
    )
    if (!soldier) throw new Error("missing fixture soldier")
    const same = globalThis.structuredClone(state)
    const hidden = globalThis.structuredClone(state)
    const hiddenSoldier = hidden.soldiers.find(({ id }) => id !== soldier.id)
    if (!hiddenSoldier) throw new Error("missing hidden fixture soldier")
    hiddenSoldier.soldierMemory = { hiddenPrestate: "different" }
    const initiative = globalThis.structuredClone(state)
    initiative.initiativePlayerId = initiative.players[1].id
    const match = globalThis.structuredClone(state)
    match.matchId = `${match.matchId}:different`

    const request = soldierEffectFor(state, soldier.id)
    const sameRequest = soldierEffectFor(same, soldier.id)
    const hiddenRequest = soldierEffectFor(hidden, soldier.id)
    const initiativeRequest = soldierEffectFor(initiative, soldier.id)
    const matchRequest = soldierEffectFor(match, soldier.id)

    expect(sameRequest.requestId).toBe(request.requestId)
    expect(hiddenRequest.input).toEqual(request.input)
    expect(initiativeRequest.input).toEqual(request.input)
    expect(hiddenRequest.requestId).not.toBe(request.requestId)
    expect(initiativeRequest.requestId).not.toBe(request.requestId)
    expect(matchRequest.requestId).not.toBe(request.requestId)

    const replayed = MATCH_KERNEL.runActivationFromStateV117({
      state: hidden,
      soldierId: soldier.id,
      runtime: {
        selectActivations() {
          throw new Error("selection is unreachable in activation mode")
        },
        runSoldierBrain() {
          return bindOutcome(request, {
            kind: "success",
            value: {
              action: { type: "TURN_TO_STONE" },
              soldierMemory: { replayMustNotCommit: true },
            },
            trace: traceFor(request),
          })
        },
      },
    })

    expect(replayed).toMatchObject({
      kind: "failure",
      transitions: [],
      failure: {
        classification: "system_failure",
        code: "OUTER_FRAME_WRONG_BINDING",
      },
      unchangedState: hidden,
    })
  })

  it("normalizes a v1.17 success only at the driver seam", () => {
    const state = withPrivateMemory()
    const soldier = state.soldiers.find(
      (candidate) => candidate.ownerPlayerId === state.players[0].id,
    )
    if (!soldier) throw new Error("missing fixture soldier")

    const execution = MATCH_KERNEL.runActivationFromStateV117({
      state,
      soldierId: soldier.id,
      runtime: {
        selectActivations(
          _input: StrategyInput,
          request?: RuntimeRequestFor<"selectActivations">,
        ): CandidateBoundRuntimeInvocationV117<StrategyResult> {
          if (!request) throw new Error("driver omitted kernel request")
          return bindOutcome(request, {
            kind: "success",
            value: { activationOrders: [], strategyMemory: null },
            trace: traceFor(request),
          })
        },
        runSoldierBrain(
          _input: SoldierBrainInput,
          request?: RuntimeRequestFor<"soldierBrain">,
        ): CandidateBoundRuntimeInvocationV117<SoldierBrainResult> {
          if (!request) throw new Error("driver omitted kernel request")
          return bindOutcome(request, {
            kind: "success",
            value: {
              action: { type: "TURN_TO_STONE" },
              soldierMemory: { committedOnlyAfterValidation: true },
            },
            trace: traceFor(request),
          })
        },
      },
    })

    expect(execution.kind).toBe("completed")
    if (execution.kind !== "completed" || !execution.result) return
    expect(
      execution.result.state.soldiers.find(({ id }) => id === soldier.id)
        ?.soldierMemory,
    ).toEqual({ committedOnlyAfterValidation: true })
  })

  it.each([
    "valid-prefix-invalid-tail",
    "partial-nested-memory",
    "oversized-nested-memory",
    "illegal-action",
  ] as const)(
    "discards %s proposals and applies only the engine-owned v1.4 consequence",
    (caseName) => {
      const state = withPrivateMemory()
      const soldier = state.soldiers.find(
        (candidate) => candidate.ownerPlayerId === state.players[0].id,
      )
      if (!soldier) throw new Error("missing fixture soldier")
      const beforeMemory = sha256({
        players: state.players.map(({ strategyMemory }) => strategyMemory),
        soldiers: state.soldiers.map(({ soldierMemory }) => soldierMemory),
      })
      const observations: SoldierBrainInput[] = []

      const execution = MATCH_KERNEL.runActivationFromStateV117({
        state,
        soldierId: soldier.id,
        runtime: {
          selectActivations() {
            throw new Error("selection is unreachable in activation mode")
          },
          runSoldierBrain(
            input: SoldierBrainInput,
            request?: RuntimeRequestFor<"soldierBrain">,
          ): CandidateBoundRuntimeInvocationV117<SoldierBrainResult> {
            if (!request) throw new Error("driver omitted kernel request")
            observations.push(globalThis.structuredClone(input))
            return bindOutcome(request, {
              kind: "player_violation",
              violation:
                RUNTIME_INVOCATION_V1_17_PLAYER_VIOLATIONS.INVALID_OUTPUT,
              trace: traceFor(request, { safeCodes: [caseName.toUpperCase().replaceAll("-", "_")] }),
            })
          },
        },
      })

      expect(execution.kind).toBe("completed")
      if (execution.kind !== "completed" || !execution.result) return
      const after = execution.result.state
      const memoryAfter = sha256({
        players: after.players.map(({ strategyMemory }) => strategyMemory),
        soldiers: after.soldiers.map(({ soldierMemory }) => soldierMemory),
      })
      expect(memoryAfter).toBe(beforeMemory)
      expect(observations).toHaveLength(1)
      expect(execution.result.events.map(({ type }) => type)).toEqual([
        "ACTIVATION_STARTED",
        "CYCLE_STARTED",
        "AWARENESS_GRID_OBSERVED",
        "RUNTIME_VIOLATION",
        "SOLDIER_STONED",
        "ACTIVATION_ENDED",
      ])
      expect(
        after.soldiers.find(({ id }) => id === soldier.id)?.status,
      ).toBe("STONE")
    },
  )

  it.each([
    ["adapter-crash", "ADAPTER_CRASH", true],
    ["wrong-binding", "OUTER_FRAME_WRONG_BINDING", false],
  ] as const)(
    "rolls back private state, events, outcome, and observations for %s",
    (_caseName, code, retryable) => {
      const state = withPrivateMemory()
      const soldier = state.soldiers.find(
        (candidate) => candidate.ownerPlayerId === state.players[0].id,
      )
      if (!soldier) throw new Error("missing fixture soldier")
      const before = sha256(state)
      const observations: SoldierBrainInput[] = []

      const execution = MATCH_KERNEL.runActivationFromStateV117({
        state,
        soldierId: soldier.id,
        runtime: {
          selectActivations() {
            throw new Error("selection is unreachable in activation mode")
          },
          runSoldierBrain(
            input: SoldierBrainInput,
            request?: RuntimeRequestFor<"soldierBrain">,
          ): CandidateBoundRuntimeInvocationV117<SoldierBrainResult> {
            if (!request) throw new Error("driver omitted kernel request")
            observations.push(globalThis.structuredClone(input))
            expect(Object.isFrozen(input)).toBe(true)
            expect(Object.isFrozen(input.soldierMemory)).toBe(true)
            expect(() => {
              ;(input.soldierMemory as Record<string, unknown>).attemptMutation =
                "must-not-reach-gameplay"
            }).toThrow()
            return bindOutcome(request, {
              kind: "system_failure",
              failure: { code, publicMessage: "Runtime system failure.", retryable },
              trace: traceFor(request),
            })
          },
        },
      })

      expect(execution).toMatchObject({
        kind: "failure",
        transitions: [],
        failure: {
          classification: "system_failure",
          category: "RUNTIME_SYSTEM_FAILURE",
          code,
          retryable,
        },
      })
      expect(sha256(execution.unchangedState)).toBe(before)
      expect(observations).toHaveLength(1)
      expect(observations[0]?.soldierMemory).not.toHaveProperty(
        "attemptMutation",
      )
    },
  )

  it("rejects a v1.17 response bound to another kernel request without a player penalty", () => {
    const state = withPrivateMemory()
    const soldier = state.soldiers.find(
      (candidate) => candidate.ownerPlayerId === state.players[0].id,
    )
    if (!soldier) throw new Error("missing fixture soldier")

    const execution = MATCH_KERNEL.runActivationFromStateV117({
      state,
      soldierId: soldier.id,
      runtime: {
        selectActivations() {
          throw new Error("selection is unreachable in activation mode")
        },
        runSoldierBrain(
          _input: SoldierBrainInput,
          request?: RuntimeRequestFor<"soldierBrain">,
        ): CandidateBoundRuntimeInvocationV117<SoldierBrainResult> {
          if (!request) throw new Error("driver omitted kernel request")
          return bindOutcome(request, {
            kind: "player_violation",
            violation:
              RUNTIME_INVOCATION_V1_17_PLAYER_VIOLATIONS.INVALID_OUTPUT,
            trace: traceFor(request, {
              kernelRequestId: `${request.requestId}:forged`,
            }),
          })
        },
      },
    })

    expect(execution).toMatchObject({
      kind: "failure",
      transitions: [],
      failure: {
        classification: "system_failure",
        code: "OUTER_FRAME_WRONG_BINDING",
      },
      unchangedState: state,
    })
    expect(JSON.stringify(execution)).not.toContain("RUNTIME_VIOLATION")
  })

  it("rejects a response whose signed input identity belongs to another prestate", () => {
    const state = withPrivateMemory()
    const soldier = state.soldiers.find(
      (candidate) => candidate.ownerPlayerId === state.players[0].id,
    )
    if (!soldier) throw new Error("missing fixture soldier")
    soldier.soldierMemory = { retainedSoldier: "different-prestate" }

    const execution = MATCH_KERNEL.runActivationFromStateV117({
      state,
      soldierId: soldier.id,
      runtime: {
        selectActivations() {
          throw new Error("selection is unreachable in activation mode")
        },
        runSoldierBrain(
          _input: SoldierBrainInput,
          request?: RuntimeRequestFor<"soldierBrain">,
        ): CandidateBoundRuntimeInvocationV117<SoldierBrainResult> {
          if (!request) throw new Error("driver omitted kernel request")
          return bindOutcome(request, {
            kind: "success",
            value: {
              action: { type: "TURN_TO_STONE" },
              soldierMemory: { mustNotCommit: true },
            },
            trace: traceFor(request, {
              inputSha256: `sha256:${"9".repeat(64)}`,
            }),
          })
        },
      },
    })

    expect(execution).toMatchObject({
      kind: "failure",
      transitions: [],
      failure: {
        classification: "system_failure",
        code: "OUTER_FRAME_WRONG_BINDING",
      },
      unchangedState: state,
    })
  })
})
