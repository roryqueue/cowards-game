import { describe, expect, it } from "vitest"
import { CANONICAL_ARENA_CATALOG_V1_37 } from "@cowards/spec"
import { MATCH_KERNEL } from "../../packages/engine/src/index.js"
import { labRoot } from "../../packages/strategy-lab/src/contracts.js"
import type { LabMatchExecution } from "../../packages/strategy-lab/src/runtime-bridge.js"
import type { LeanCompactMatchRecord } from "../../packages/strategy-lab/src/league/lean-experiment.js"
import { collectLeanBaselineMetrics, leanBaselineOpeningCluster } from "./v1-38-lean-baseline-metrics.js"
import { leanBaselineMatchEvidence, leanBaselineSemanticRoot } from "./v1-38-lean-baseline-match.js"
import { compactExecution } from "../run-v1-38-lean-experiment.js"

const prefix = (): LabMatchExecution => {
  const arena = CANONICAL_ARENA_CATALOG_V1_37.arenas.find(a => a.status === "active")!
  const machine = MATCH_KERNEL.createMachineV119({ matchId: "source-only-metric-prefix", seed: "source-only", arenaVariant: arena, bottomPlayerId: "opaque-bottom", topPlayerId: "opaque-top", bottomStrategyRevisionId: "revision-bottom", topStrategyRevisionId: "revision-top", initialInitiativePlayerId: "opaque-bottom" })
  const step = MATCH_KERNEL.stepMatch(machine, { kind: "advance" })
  if (step.kind !== "transition") throw new Error("SOURCE_ONLY_PREFIX")
  return { kind: "completed", privacy: "private_offline", result: { state: step.machine.state, events: [...step.record.events] }, transitions: [step.record], accounting: [] }
}
const compact = (classification: LeanCompactMatchRecord["classification"], cleanupComplete = true): LeanCompactMatchRecord => ({
  classification, cleanupComplete, code: classification === "success" ? "OK" : !cleanupComplete ? "CLEANUP" : classification === "player_violation" ? "PLAYER_VIOLATION" : "SUPERVISOR_FAILURE",
  outcome: classification === "success" ? "DRAW" : null, elapsedMs: 5, invocationCount: 1,
  accountingRoot: labRoot("source-only-accounting", classification), executionRoot: labRoot("source-only-execution", classification), telemetry: { transitions: 1, events: 1 },
})
const withEvents = (execution: LabMatchExecution, eventTypes: readonly { type: string; payload?: unknown; privatePayload?: unknown }[]): LabMatchExecution => {
  if (execution.kind !== "completed") throw new Error("SOURCE_ONLY_PREFIX")
  const base = execution.transitions[0]!
  const events = eventTypes.map((entry, sequence) => ({ type: entry.type, sequence, payload: entry.payload ?? {}, context: { activationId: "fixture-activation" }, ...(entry.privatePayload === undefined ? {} : { privatePayload: entry.privatePayload }) })) as unknown as typeof base.events
  return { ...execution, transitions: [{ ...base, events }], result: { ...execution.result, events: [...events] } }
}

describe("lean per-Match metric receipt, source-only canonical prefixes", () => {
  it("counts observed event causes and first activation without retaining IDs or private payloads", () => {
    const base = prefix()
    if (base.kind !== "completed") throw new Error("SOURCE_ONLY_PREFIX")
    const initialSoldiers = base.transitions[0]!.beforeState.soldiers as Array<{ id: string; ownerPlayerId: string }>
    const actor = initialSoldiers[0]!
    const enemy = initialSoldiers.find(s => s.ownerPlayerId !== actor.ownerPlayerId)!
    const actual = withEvents(base, [
      { type: "ACTIVATION_STARTED" },
      { type: "AWARENESS_GRID_OBSERVED", privatePayload: { awarenessGrid: { cells: [{ contents: "ENEMY_ACTIVE" }] }, objectivePayload: { secret: "PRIVATE_SENTINEL" } } },
      { type: "MOVE_BLOCKED", payload: { reason: "ACTIVE_SOLDIER", soldierId: actor.id, targetSoldierId: enemy.id } },
      { type: "PUSH_RESOLVED", payload: { soldierId: actor.id, targetSoldierId: enemy.id } },
      { type: "SOLDIER_STONED", payload: { reason: "BACKSTAB", soldierId: "opaque-actual" } },
      { type: "SOLDIER_FELL", payload: { reason: "BOARD_CONTRACTION", soldierId: "opaque-actual" } },
      { type: "CONTRACTION_RESOLVED" }, { type: "CYCLE_STARTED" },
    ])
    const receipt = collectLeanBaselineMetrics(actual, compact("success"))
    expect(receipt.source).toBe("actual_canonical_trace")
    expect(receipt.measurements.firstEnemyAwarenessActivation).toBe(1)
    expect(receipt.measurements.firstContactActivation).toBe(1)
    expect(receipt.measurements.firstPushActivation).toBe(1)
    expect(receipt.measurements.firstStoneActivation).toBe(1)
    expect(receipt.measurements.contractionFallCount).toBe(1)
    expect(receipt.measurements.contractionCount).toBe(1)
    expect(receipt.measurements.cycleCount).toBe(1)
    expect(receipt.measurements.terminalActivationCount).toBe(1)
    expect(receipt.missing).toContain("opening_normalized_entropy")
    expect(receipt.missing).toContain("forced_evacuation")
    expect(receipt.missing).toContain("push_and_block_causes")
    expect(receipt.missing).toContain("center_wing_convoy_turtle")
    expect(receipt.formationComparison).toBe("inconclusive")
    expect(JSON.stringify(receipt)).not.toMatch(/PRIVATE_SENTINEL|opaque-actual|objectivePayload|strategyMemory|soldierMemory/i)
  })

  it("records observed no-contact as null, not a fabricated positive or missing trace", () => {
    const receipt = collectLeanBaselineMetrics(prefix(), compact("success"))
    expect(receipt.measurements.firstContactActivation).toBeNull()
    expect(receipt.measurements.pushes).toBe(0)
    expect(receipt.missing).not.toContain("first_contact")
  })

  it("does not count a friendly block as enemy contact and does count a mirrored opaque enemy block", () => {
    const base = prefix()
    if (base.kind !== "completed") throw new Error("SOURCE_ONLY_PREFIX")
    const soldiers = base.transitions[0]!.beforeState.soldiers as Array<{ id: string; ownerPlayerId: string }>
    const actor = soldiers[0]!
    const friendly = soldiers.find(s => s.id !== actor.id && s.ownerPlayerId === actor.ownerPlayerId)!
    const enemy = soldiers.find(s => s.ownerPlayerId !== actor.ownerPlayerId)!
    const start = { type: "ACTIVATION_STARTED" }
    const friendlyOnly = withEvents(base, [start, { type: "MOVE_BLOCKED", payload: { soldierId: actor.id, targetSoldierId: friendly.id, reason: "ACTIVE_SOLDIER" } }])
    expect(collectLeanBaselineMetrics(friendlyOnly, compact("success")).measurements.firstContactActivation).toBeNull()
    const enemyContact = withEvents(base, [start, { type: "MOVE_BLOCKED", payload: { soldierId: actor.id, targetSoldierId: enemy.id, reason: "HEAD_TO_HEAD" } }])
    expect(collectLeanBaselineMetrics(enemyContact, compact("success")).measurements.firstContactActivation).toBe(1)
  })

  it("preserves clean success semantics but denies completed player violation and cleanup failure credit", () => {
    const actual = prefix()
    const good = leanBaselineMatchEvidence(actual, compact("success"), "bottom")
    expect(good.semanticRoot).toBe(leanBaselineSemanticRoot(actual))
    expect(good.trainingHalfPoints).toBe(1)
    for (const failed of [compact("player_violation"), compact("system_failure"), compact("system_failure", false)]) {
      const projected = leanBaselineMatchEvidence(actual, failed, "bottom")
      expect(projected.semanticRoot).toBeNull()
      expect(projected.trainingHalfPoints).toBeNull()
      expect(projected.metrics.source).toBe("unavailable")
      expect(projected.metrics.missing).toHaveLength(18)
    }
    const actualFailure: LabMatchExecution = { kind: "failure", privacy: "private_offline", unchangedState: null, transitions: [], accounting: [], failure: { classification: "system_failure", code: "SOURCE_ONLY_SYSTEM" } }
    expect(leanBaselineMatchEvidence(actualFailure, compact("system_failure"), null).semanticRoot).toBeNull()
  })

  it("derives a completed player violation from synthetic accounting without score or repeat credit", () => {
    const base = prefix()
    if (base.kind !== "completed") throw new Error("SOURCE_ONLY_PREFIX")
    const actual: LabMatchExecution = { ...base, accounting: [{
      identity: { revisionId: "source-only", sourceRoot: labRoot("source-only", 1), executableRoot: labRoot("source-only", 2), tupleId: MATCH_KERNEL.tupleId, tupleRoot: labRoot("source-only", 3), image: "source-only", harnessRoot: labRoot("source-only", 4), budgetRoot: labRoot("source-only", 5), attemptRoot: labRoot("source-only", 6), runtimeLimitsRoot: "source-only" },
      requestId: "source-only", method: "selectActivations", inputRoot: labRoot("source-only", 7), ordinal: 0, invocationRoot: labRoot("source-only", 8), charged: true, completed: true, outputBytes: 0,
      result: { ok: false, violation: { type: "INVALID_OUTPUT", message: "PRIVATE_VIOLATION_SENTINEL" } },
    }] }
    const classified = compactExecution(actual, 1, true, "opaque-bottom")
    expect(classified.classification).toBe("player_violation")
    const evidence = leanBaselineMatchEvidence(actual, classified, "bottom")
    expect(evidence.semanticRoot).toBeNull()
    expect(evidence.trainingHalfPoints).toBeNull()
    expect(evidence.metrics.missing).toHaveLength(18)
    expect(JSON.stringify(evidence.metrics)).not.toContain("PRIVATE_VIOLATION_SENTINEL")
  })

  it("uses existing opening normalization for mirrored, opaque-ID renamed prefixes", () => {
    const original = prefix()
    if (original.kind !== "completed") throw new Error("SOURCE_ONLY_PREFIX")
    const base = original.transitions[0]!
    const initial = structuredClone(base.beforeState) as Record<string, unknown>
    const soldiers = initial.soldiers as Array<Record<string, unknown>>
    const players = initial.players as Array<Record<string, unknown>>
    const oldPlayers = players.map(p => String(p.id))
    for (const [index, p] of players.entries()) p.id = `opaque-renamed-${1 - index}`
    for (const [index, s] of soldiers.entries()) {
      s.id = `opaque-renamed-soldier-${index}`
      s.ownerPlayerId = String(players[oldPlayers.indexOf(String(s.ownerPlayerId))]!.id)
      const pos = s.position as { x: number; y: number } | null
      if (pos) pos.x = 11 - pos.x
      s.facing = s.facing === "LEFT" ? "RIGHT" : s.facing === "RIGHT" ? "LEFT" : s.facing
    }
    const mirrored: LabMatchExecution = { ...original, transitions: [{ ...base, beforeState: initial }] }
    expect(leanBaselineOpeningCluster(original)).toBe(leanBaselineOpeningCluster(mirrored))
  })
})
