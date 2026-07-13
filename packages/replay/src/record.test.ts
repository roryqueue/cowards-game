import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { MATCH_KERNEL, type StrategyRuntime } from "@cowards/engine"
import type { SoldierBrainInput, StrategyInput } from "@cowards/spec"
import { describe, expect, it } from "vitest"
import { recordChronicleFromExecution } from "./record.js"

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
    runtime,
    maxPhases: 1,
  })

const metadata = {
  schemaVersion: "chronicle-v1.4" as const,
  semanticTupleId: MATCH_KERNEL.tupleId,
  semanticTuple: MATCH_KERNEL.tuple,
}

describe("recordChronicleFromExecution", () => {
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
      runtime: {
        ...runtime,
        selectActivations: () => ({
          ok: false as const,
          systemFailure: { code: "SPAWN_FAILED", retryable: true },
        }),
      },
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
