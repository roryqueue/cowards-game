import { describe, it, expect } from "vitest"
import { CANONICAL_ARENA_CATALOG_V1_37 } from "@cowards/spec"
import { MATCH_KERNEL } from "../../packages/engine/src/index.js"
import { labRoot } from "../../packages/strategy-lab/src/contracts.js"
import { buildPlannerCandidate } from "../../packages/strategy-lab/src/planner/emit.js"
import { emitTacticalSource } from "../../packages/strategy-oracle-tactical/src/emit.js"
import { type LeanSlot } from "../../packages/strategy-lab/src/league/lean-experiment.js"
import { buildLeanBaselineSource } from "./v1-38-lean-baseline-source.js"
import { bindLeanCorrectionInvocation, leanBaselineMatchSeed, leanBaselineScenario, leanBaselineSemanticRoot, leanCorrectionInvocationTransportBinding } from "./v1-38-lean-baseline-match.js"
import type { LabMatchExecution } from "../../packages/strategy-lab/src/runtime-bridge.js"

describe("current canonical baseline scenario, without provider execution", () => {
  it("preserves arena, source side, initiative and seed in the four exact repeats", () => {
    const input = { coldRoot: labRoot("cold-source-fixture", 1), implementationRoot: labRoot("source-fixture", 1) }
    const bottom = buildLeanBaselineSource({ ...input, role: "initial-tactical", source: emitTacticalSource() })
    const top = buildLeanBaselineSource({ ...input, role: "initial-teacher", source: buildPlannerCandidate().source })
    const arenas = CANONICAL_ARENA_CATALOG_V1_37.arenas.filter(a => a.status === "active").sort((a, b) => a.semanticGeometryHash.localeCompare(b.semanticGeometryHash))
    for (let condition = 0; condition < 4; condition++) {
      const slot: LeanSlot = { ordinal: 8 + condition, condition: condition as 0 | 1 | 2 | 3, arenaHash: arenas[condition < 2 ? 0 : 1]!.semanticGeometryHash, requestRoot: labRoot("source-fixture-request", condition), root: labRoot("source-fixture-slot", condition) }
      const first = leanBaselineScenario({ seed: "source-fixture", slot, bottom, top })
      const repeated = leanBaselineScenario({ seed: "source-fixture", slot: { ...slot, ordinal: 32 + condition }, bottom, top })
      expect(first).toEqual(repeated)
      expect(first.bottomPlayerId).toContain(bottom.sourceRoot.slice(7))
      expect(first.initialInitiativePlayerId).toBe(condition % 2 === 0 ? first.bottomPlayerId : first.topPlayerId)
      const machine = MATCH_KERNEL.createMachineV119({ matchId: "source-only-realism", seed: first.seed, arenaVariant: first.arena, bottomPlayerId: first.bottomPlayerId, topPlayerId: first.topPlayerId, bottomStrategyRevisionId: "source-bottom", topStrategyRevisionId: "source-top", initialInitiativePlayerId: first.initialInitiativePlayerId })
      expect(machine.state.soldiers).toHaveLength(16)
      expect(machine.state.soldiers.every(s => s.position.x >= 0 && s.position.x < 12 && s.position.y >= 0 && s.position.y < 12)).toBe(true)
      expect(new Set(machine.state.soldiers.map(s => s.position.y))).toEqual(new Set([0, 11]))
    }
    expect(leanBaselineMatchSeed("source-fixture", 32)).toBe(leanBaselineMatchSeed("source-fixture", 8))
  })
  it("normalizes actual identity-dependent engine hashes but preserves private memory keys", () => {
    const arena = CANONICAL_ARENA_CATALOG_V1_37.arenas.find(a => a.status === "active")!
    const prefix = (matchId: string): LabMatchExecution => {
      const machine = MATCH_KERNEL.createMachineV119({ matchId, seed: "source-only-seed", arenaVariant: arena, bottomPlayerId: "source-bottom", topPlayerId: "source-top", bottomStrategyRevisionId: "source-bottom-revision", topStrategyRevisionId: "source-top-revision", initialInitiativePlayerId: "source-bottom" })
      const step = MATCH_KERNEL.stepMatch(machine, { kind: "advance" })
      if (step.kind !== "transition") throw new Error("SOURCE_ONLY_PREFIX")
      // A prefix fixture for hashing, not a completed empirical Match.
      return { kind: "completed", privacy: "private_offline", result: { state: step.machine.state, events: [...step.record.events] }, transitions: [step.record], accounting: [] }
    }
    const one = prefix("source-only-first"), two = prefix("source-only-repeat")
    expect(one.transitions[0]?.beforeMachineHash).not.toBe(two.transitions[0]?.beforeMachineHash)
    expect(leanBaselineSemanticRoot(one)).toBe(leanBaselineSemanticRoot(two))
    const changed = structuredClone(two)
    if (changed.kind !== "completed") throw new Error("SOURCE_ONLY_PREFIX")
    changed.result.state.players[0]!.strategyMemory = { matchId: "private-user-key-preserved" }
    expect(leanBaselineSemanticRoot(changed)).not.toBe(leanBaselineSemanticRoot(one))
  })
})

describe("finite correction diagnostic invocation binding", () => {
  it("joins origin to the actual failed invocation and rejects a re-rooted different invocation", () => {
    const root = (letter: string) => `sha256:${letter.repeat(64)}` as const
    const source = "export function selectActivations(){ return [] }"
    const input = { observation: { tick: 7 } }
    const transport = leanCorrectionInvocationTransportBinding({ methodName: "selectActivations", source, input, requestOrdinal: 3 })
    const evidence = {
      identity: { sourceRoot: root("a"), executableRoot: transport.executableRoot },
      requestId: "request-3", method: "selectActivations", inputRoot: transport.inputRoot,
      ordinal: 2, invocationRoot: root("b"), result: { ok: false, systemFailure: { code: "SUBPROCESS_SIGNAL", retryable: false } },
    } as any
    const privateDiagnostic = { stage: "stream_exchange", reason: "wait_timeout", ...evidence } as any
    const origin = {
      schemaVersion: "v1.38-lean-correction-origin-v1", requestOrdinal: 3, requestRoot: transport.requestRoot,
      transportMethod: "docker_exec_stream", brokerMode: "legacy", brokerBranch: "legacy_deadline",
      signalBufferState: "not_done", waitDisposition: "timed_out", workerLifecycle: "unknown",
      transportSignal: "broker_synthetic_sigkill", terminationDisposition: "worker_terminate_completed", elapsedBucket: "unknown",
    } as const
    expect(bindLeanCorrectionInvocation(origin, transport, evidence, privateDiagnostic, "bottom")).toMatchObject({
      requestOrdinal: 3, ordinal: 2, method: "selectActivations", requestRoot: transport.requestRoot,
      payloadRoot: transport.payloadRoot, inputRoot: transport.inputRoot, seat: "bottom", invocationRoot: evidence.invocationRoot,
    })
    expect(() => bindLeanCorrectionInvocation({ ...origin, requestRoot: root("c") }, transport, evidence, privateDiagnostic, "bottom")).toThrow("LEAN_CORRECTION_INVOCATION_JOIN")
    expect(() => bindLeanCorrectionInvocation(origin, { ...transport, method: "soldierBrain" }, evidence, privateDiagnostic, "bottom")).toThrow("LEAN_CORRECTION_INVOCATION_JOIN")
  })
})
