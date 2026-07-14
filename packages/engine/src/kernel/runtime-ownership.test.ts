import { createHash } from "node:crypto"
import { describe, expect, it } from "vitest"
import {
  RUNTIME_INVOCATION_V1_17_PLAYER_VIOLATIONS,
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

const traceFor = (
  request: KernelEffectRequest,
  overrides: Partial<RuntimeInvocationTraceV117> = {},
): RuntimeInvocationTraceV117 => ({
  requestId: "runtime-request:phase-258",
  invocationId: `invocation:${request.requestId}`,
  kernelRequestId: request.requestId,
  method: request.kind,
  requestSha256: `sha256:${"1".repeat(64)}`,
  budgetProfileSha256: `sha256:${"2".repeat(64)}`,
  inputSha256: `sha256:${"3".repeat(64)}`,
  retryIdentitySha256: `sha256:${"4".repeat(64)}`,
  safeCodes: [],
  ...overrides,
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

describe("Phase 258 successor runtime ownership", () => {
  it("normalizes a v1.17 success only at the driver seam", () => {
    const state = withPrivateMemory()
    const soldier = state.soldiers.find(
      (candidate) => candidate.ownerPlayerId === state.players[0].id,
    )
    if (!soldier) throw new Error("missing fixture soldier")

    const execution = MATCH_KERNEL.runActivationFromState({
      state,
      soldierId: soldier.id,
      runtime: {
        selectActivations(
          _input: StrategyInput,
          request?: RuntimeRequestFor<"selectActivations">,
        ): RuntimeInvocationResultV117<StrategyResult> {
          if (!request) throw new Error("driver omitted kernel request")
          return {
            kind: "success",
            value: { activationOrders: [], strategyMemory: null },
            trace: traceFor(request),
          }
        },
        runSoldierBrain(
          _input: SoldierBrainInput,
          request?: RuntimeRequestFor<"soldierBrain">,
        ): RuntimeInvocationResultV117<SoldierBrainResult> {
          if (!request) throw new Error("driver omitted kernel request")
          return {
            kind: "success",
            value: {
              action: { type: "TURN_TO_STONE" },
              soldierMemory: { committedOnlyAfterValidation: true },
            },
            trace: traceFor(request),
          }
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

      const execution = MATCH_KERNEL.runActivationFromState({
        state,
        soldierId: soldier.id,
        runtime: {
          selectActivations() {
            throw new Error("selection is unreachable in activation mode")
          },
          runSoldierBrain(
            input: SoldierBrainInput,
            request?: RuntimeRequestFor<"soldierBrain">,
          ): RuntimeInvocationResultV117<SoldierBrainResult> {
            if (!request) throw new Error("driver omitted kernel request")
            observations.push(globalThis.structuredClone(input))
            return {
              kind: "player_violation",
              violation:
                RUNTIME_INVOCATION_V1_17_PLAYER_VIOLATIONS.INVALID_OUTPUT,
              trace: traceFor(request, { safeCodes: [caseName.toUpperCase().replaceAll("-", "_")] }),
            }
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

      const execution = MATCH_KERNEL.runActivationFromState({
        state,
        soldierId: soldier.id,
        runtime: {
          selectActivations() {
            throw new Error("selection is unreachable in activation mode")
          },
          runSoldierBrain(
            input: SoldierBrainInput,
            request?: RuntimeRequestFor<"soldierBrain">,
          ): RuntimeInvocationResultV117<SoldierBrainResult> {
            if (!request) throw new Error("driver omitted kernel request")
            observations.push(globalThis.structuredClone(input))
            ;(input.soldierMemory as Record<string, unknown>).attemptMutation =
              "must-not-reach-gameplay"
            return {
              kind: "system_failure",
              failure: { code, publicMessage: "Runtime system failure.", retryable },
              trace: traceFor(request),
            }
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

    const execution = MATCH_KERNEL.runActivationFromState({
      state,
      soldierId: soldier.id,
      runtime: {
        selectActivations() {
          throw new Error("selection is unreachable in activation mode")
        },
        runSoldierBrain(
          _input: SoldierBrainInput,
          request?: RuntimeRequestFor<"soldierBrain">,
        ): RuntimeInvocationResultV117<SoldierBrainResult> {
          if (!request) throw new Error("driver omitted kernel request")
          return {
            kind: "player_violation",
            violation:
              RUNTIME_INVOCATION_V1_17_PLAYER_VIOLATIONS.INVALID_OUTPUT,
            trace: traceFor(request, {
              kernelRequestId: `${request.requestId}:forged`,
            }),
          }
        },
      },
    })

    expect(execution).toMatchObject({
      kind: "failure",
      transitions: [],
      failure: {
        classification: "system_failure",
        code: "RUNTIME_RESPONSE_BINDING_MISMATCH",
      },
      unchangedState: state,
    })
    expect(JSON.stringify(execution)).not.toContain("RUNTIME_VIOLATION")
  })
})
