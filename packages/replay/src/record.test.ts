import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { CANDIDATE_MATCH_KERNEL, type StrategyRuntime } from "@cowards/engine"
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
  CANDIDATE_MATCH_KERNEL.runMatch({
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
  semanticTupleId: CANDIDATE_MATCH_KERNEL.tupleId,
}

describe("recordChronicleFromExecution", () => {
  it("records one completed candidate stream with exact public events and state-hash anchors", () => {
    const execution = run()
    const recorded = recordChronicleFromExecution({ execution, metadata })

    expect(recorded.ok).toBe(true)
    if (!recorded.ok || execution.kind !== "completed") return

    expect(
      recorded.chronicle.events.map(
        ({ type, sequence, context, privacy, payload }) => ({
          type,
          sequence,
          context,
          privacy,
          payload,
        }),
      ),
    ).toEqual(
      execution.result.events.map(
        ({ type, sequence, context, privacy, payload }) => ({
          type,
          sequence,
          context: context ?? {},
          privacy: privacy ?? "public",
          payload,
        }),
      ),
    )
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
    expect(recorded.boundaryAnchors.every(({ stateHash }) =>
      /^sha256:[0-9a-f]{64}$/u.test(stateHash),
    )).toBe(true)
    expect(recorded.finalState).toEqual(execution.result.state)
    expect(recorded.semanticIdentity).toEqual({
      tupleId: CANDIDATE_MATCH_KERNEL.tupleId,
      tuple: CANDIDATE_MATCH_KERNEL.tuple,
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

  it("returns a typed no-Chronicle result for failed execution", () => {
    const execution = CANDIDATE_MATCH_KERNEL.runMatch({
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
    ["result event drift", (execution: ReturnType<typeof run>) => {
      if (execution.kind !== "completed") return execution
      return {
        ...execution,
        result: { ...execution.result, events: execution.result.events.slice(1) },
      }
    }, "RECORDER_EVENT_STREAM_INVALID"],
    ["boundary hash drift", (execution: ReturnType<typeof run>) => {
      if (execution.kind !== "completed") return execution
      return {
        ...execution,
        transitions: execution.transitions.map((transition, index) =>
          index === 0
            ? { ...transition, beforeStateHash: `sha256:${"0".repeat(64)}` }
            : transition,
        ),
      }
    }, "RECORDER_BOUNDARY_INTEGRITY_INVALID"],
    ["semantic identity drift", (execution: ReturnType<typeof run>) => {
      if (execution.kind !== "completed") return execution
      return {
        ...execution,
        transitions: execution.transitions.map((transition, index) =>
          index === 0 ? { ...transition, semanticTupleId: "sha256:wrong" } : transition,
        ),
      }
    }, "RECORDER_SEMANTIC_IDENTITY_INVALID"],
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

    expect(source).not.toMatch(/StrategyRuntime|runMatch|resolveRound|resolveActivation/)
    expect(source).not.toMatch(/kernel\/driver|kernel\/step|\.\/build/)
  })
})
