import { describe, expect, it, vi } from "vitest"
import {
  CURRENT_SEMANTIC_AUTHORITY_GENERATED,
  type JsonValue,
} from "@cowards/spec"
import {
  createCandidateObservationTransportRequestV119,
  type CandidateObservationTransportRequestV119,
} from "@cowards/runtime-js"
import { dispatchRuntimeObservationV119 } from "./execute-match.js"
import { runtimeServiceSemanticSelectionFromEnvironment } from "./production-runtime-config.js"

const strategyInput = {
  phaseNumber: 1,
  roundNumber: 2,
  activationCount: 1,
  board: {
    bounds: { minX: 0, maxX: 11, minY: 0, maxY: 11 },
    soldiers: [],
    terrainStones: [],
  },
  mySoldiers: [],
  enemySoldiers: [],
  strategyMemory: null,
  initialInitiativePlayerId: "player:bottom",
  hasInitialInitiative: true,
  roundInitiativePlayerId: "player:top",
  hasRoundInitiative: false,
} as const

const request = (): CandidateObservationTransportRequestV119 =>
  createCandidateObservationTransportRequestV119({
    method: "selectActivations",
    kernelRequestId: "effect:v1.19:runtime-service",
    semanticTupleId: "tuple:v1.19:candidate",
    entrantPlayerIds: ["player:bottom", "player:top"],
    observingPlayerId: "player:bottom",
    input: strategyInput,
  })

describe("runtime-service v1.19 observation dispatch", () => {
  it("routes an explicit candidate with exact signed bytes and no adapter-derived facts", () => {
    const candidate = request()
    const executeCurrent = vi.fn(() => ({ route: "current" as const }))
    const executeCandidate = vi.fn(({ input, signedInputBytes }) => {
      expect(signedInputBytes).toEqual(candidate.signedInputBytes)
      expect(input).toEqual(strategyInput)
      return {
        kind: "success" as const,
        value: input as unknown as JsonValue,
      }
    })

    expect(
      dispatchRuntimeObservationV119({
        candidateRequest: candidate,
        executeCurrent,
        executeCandidate,
      }),
    ).toMatchObject({ kind: "success", value: strategyInput })
    expect(executeCandidate).toHaveBeenCalledTimes(1)
    expect(executeCurrent).not.toHaveBeenCalled()
  })

  it("rejects mixed or stale binding before provider startup", () => {
    const valid = request()
    const executeCandidate = vi.fn(() => ({
      kind: "success" as const,
      value: null,
    }))
    for (const candidateRequest of [
      { ...valid, semanticAuthorityKey: "runtime-v1.17" as never },
      { ...valid, inputSha256: `sha256:${"0".repeat(64)}` as const },
    ]) {
      expect(
        dispatchRuntimeObservationV119({
          candidateRequest,
          executeCurrent: () => ({ route: "current" as const }),
          executeCandidate,
        }),
      ).toMatchObject({
        kind: "system_failure",
        failure: {
          publicMessage: "Runtime system failure.",
          retryable: false,
        },
      })
    }
    expect(executeCandidate).not.toHaveBeenCalled()
  })

  it("keeps default execution and production configuration on generated Phase 259", () => {
    const executeCurrent = vi.fn(() => ({ route: "phase-259" as const }))
    const executeCandidate = vi.fn()
    expect(
      dispatchRuntimeObservationV119({
        executeCurrent,
        executeCandidate,
      }),
    ).toEqual({ route: "phase-259" })
    expect(executeCurrent).toHaveBeenCalledTimes(1)
    expect(executeCandidate).not.toHaveBeenCalled()

    expect(runtimeServiceSemanticSelectionFromEnvironment()).toEqual(
      CURRENT_SEMANTIC_AUTHORITY_GENERATED.selection,
    )
    expect(
      runtimeServiceSemanticSelectionFromEnvironment().runtimeAbiVersion,
    ).toBe(CURRENT_SEMANTIC_AUTHORITY_GENERATED.selection.runtimeAbiVersion)
  })

  it("preserves provider failure ownership without leaking private input", () => {
    const result = dispatchRuntimeObservationV119({
      candidateRequest: request(),
      executeCurrent: () => ({ route: "current" as const }),
      executeCandidate: () => ({
        kind: "system_failure" as const,
        failure: {
          code: "ADAPTER_CRASH" as const,
          publicMessage: "Runtime system failure." as const,
          retryable: true,
        },
      }),
    })
    expect(result).toEqual({
      kind: "system_failure",
      failure: {
        code: "ADAPTER_CRASH",
        publicMessage: "Runtime system failure.",
        retryable: true,
      },
    })
    expect(JSON.stringify(result)).not.toContain("initialInitiativePlayerId")
    expect(JSON.stringify(result)).not.toContain("player:bottom")
  })
})
