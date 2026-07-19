import { describe, expect, it } from "vitest"
import {
  SoldierBrainInputSchema,
  type SoldierBrainInput,
  type StrategyInput,
} from "@cowards/spec"
import type { StrategyRuntime } from "../types.js"
import {
  CANDIDATE_KERNEL_V117_SEMANTIC_TUPLE,
  CANDIDATE_KERNEL_V117_SEMANTIC_TUPLE_ID,
  type KernelSoldierBrainRequest,
} from "../kernel/types.js"
import {
  adaptHistoricalRuntimeForCurrentKernel,
  adaptRuntimeForCurrentKernel,
} from "./current-kernel-runtime.js"

const fixtureAwarenessCells = (x: number, y: number) =>
  Array.from({ length: 25 }, (_, index) => {
    const dx = (index % 5) - 2
    const dy = Math.floor(index / 5) - 2
    return {
      dx,
      dy,
      absoluteX: x + dx,
      absoluteY: y + dy,
      contents:
        dx === 0 && dy === 0
          ? ("FRIENDLY_ACTIVE" as const)
          : ("EMPTY" as const),
    }
  })

const soldierBrainInput: SoldierBrainInput = {
  ...SoldierBrainInputSchema.parse({
    self: {
      id: "soldier:historical-timeout",
      ownerPlayerId: "bottom",
      status: "ACTIVE",
      position: { x: 1, y: 1 },
      facing: "UP",
      lastSuccessfulMoveDirection: null,
    },
    awarenessGrid: { cells: fixtureAwarenessCells(1, 1) },
    cycleIndex: 0,
    maxCycles: 12,
    hasAdvancedThisActivation: false,
    soldierMemory: {},
  }),
  objective: null,
}

const request: KernelSoldierBrainRequest = {
  kind: "soldierBrain",
  requestId: "kernel-request:historical-timeout",
  semanticTupleId: CANDIDATE_KERNEL_V117_SEMANTIC_TUPLE_ID,
  coordinates: {
    phaseNumber: 1,
    roundNumber: 1,
    activationId: "1:1:0",
    activationIndex: 0,
    actingPlayerId: "bottom",
    soldierId: soldierBrainInput.self.id,
    stage: "soldier_effect",
    cycleIndex: 0,
    ordinal: 0,
  },
  input: soldierBrainInput,
}

const legacyTimeoutRuntime: StrategyRuntime = {
  selectActivations(_input: StrategyInput) {
    throw new Error("selection is not used by this adapter regression")
  },
  runSoldierBrain() {
    return {
      ok: false,
      violation: {
        type: "TIMEOUT",
        message: "Historical player-owned resource exhaustion.",
      },
    }
  },
}

describe("current-kernel runtime test support", () => {
  it("keeps default TIMEOUT system-owned and historical attested TIMEOUT player-owned", () => {
    const current = adaptRuntimeForCurrentKernel(
      legacyTimeoutRuntime,
    ).runSoldierBrain(soldierBrainInput, request)
    expect(current).toMatchObject({
      kind: "v1_17_bound",
      request: {
        semanticTuple: CANDIDATE_KERNEL_V117_SEMANTIC_TUPLE,
      },
      outcome: {
        kind: "system_failure",
        failure: { code: "TIMEOUT" },
      },
    })

    const historical = adaptHistoricalRuntimeForCurrentKernel(
      legacyTimeoutRuntime,
    ).runSoldierBrain(soldierBrainInput, request)
    expect(historical).toMatchObject({
      kind: "v1_17_bound",
      outcome: {
        kind: "player_violation",
        violation: { code: "RESOURCE_EXHAUSTION" },
      },
    })
  })
})
