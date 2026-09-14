import { describe, expect, it } from "vitest"
import { createNumericObservationFromVerifiedCell } from "./v1-38-factory-observations.js"
import { compareNumericEvidence } from "../packages/strategy-lab/src/factory/numeric-calibration.js"

const records = [
  { kind: "receipt", ordinal: 0, value: { privacy: "private_offline" } },
  { kind: "execution", ordinal: 0, value: { kind: "completed", privacy: "private_offline", resultMetadata: {} } },
  { kind: "result-state", ordinal: 0, value: { outcome: { type: "DRAW" }, phaseNumber: 1, privateState: { objective: "omit" } } },
  { kind: "result-event", ordinal: 0, value: { type: "SOLDIER_STONED", sequence: 4, payload: { reason: "TURN_TO_STONE", soldierId: "opaque-a" }, privatePayload: { objective: "omit" } } },
  { kind: "transition", ordinal: 0, value: { transitionKind: "runtime_resume", classification: "success", coordinates: { phaseNumber: 1, roundNumber: 1 }, events: [{ type: "SOLDIER_STONED", sequence: 4, payload: { reason: "TURN_TO_STONE", soldierId: "opaque-a" }, privatePayload: { objective: "omit" } }], beforeState: { phaseNumber: 1 }, afterState: { phaseNumber: 1 }, terminalStatus: null } },
  { kind: "trace", ordinal: 0, value: { method: "soldierBrain", ordinal: 0, classification: "success", requestProjection: { self: { id: "opaque-a", status: "ACTIVE", position: { x: 2, y: 3 } }, awarenessGrid: { cells: [] }, cycleIndex: 0, maxCycles: 3, hasAdvancedThisActivation: false }, decisionProjection: { action: { type: "TURN_TO_STONE" } } } },
  { kind: "trace", ordinal: 1, value: { method: "soldierBrain", ordinal: 1, classification: "success", requestProjection: { self: { id: "opaque-b", status: "STONE", position: { x: 3, y: 3 } }, awarenessGrid: { cells: [] }, cycleIndex: 1, maxCycles: 3, hasAdvancedThisActivation: true }, decisionProjection: { action: { type: "TURN_TO_STONE" } } } },
] as const

describe("verified factory cell observation adapter", () => {
  it("matches declared condition samples across source slots", () => {
    const input = { sourceUtf8: "export default {}", lineageEdges: [], dependencyEdges: [], records }
    const left = createNumericObservationFromVerifiedCell({ ...input, cell: { key: "S01:block-a:candidate", block: "block-a", candidateSide: "bottom", initialInitiative: "candidate" } })
    const right = createNumericObservationFromVerifiedCell({ ...input, cell: { key: "S02:block-a:candidate", block: "block-a", candidateSide: "bottom", initialInitiative: "candidate" } })
    const comparison = compareNumericEvidence(left.evidence, right.evidence)
    expect(comparison.dimensions.legalInput.score).toBe(1)
    expect(comparison.dimensions.chronicle.score).toBe(1)
    expect(comparison.dimensions.matchup.score).toBe(1)
  })
  it("mirrors top coordinates and separates actual stoning from requested stoning", () => {
    const withoutStoneEvent = records.filter((entry) => entry.kind !== "result-event")
    const value = createNumericObservationFromVerifiedCell({ sourceUtf8: "export default {}", cell: { key: "S01", block: "block-b", candidateSide: "top", initialInitiative: "candidate" }, lineageEdges: [], dependencyEdges: [], records: withoutStoneEvent })
    expect(JSON.stringify(value.evidence.legalInputSamples)).toContain("position.x=9")
    expect(value.facts.nonStoneToStoneCount).toBe(0)
    expect(value.facts.nonStoneToStoneDecisionCount).toBe(1)
  })
  it("drops unknown payload fields even when they lack private-looking names", () => {
    const changed = structuredClone(records) as unknown as any[]
    changed[4].value.unrecognized = "undisclosed-secret"
    changed[5].value.requestProjection.surprise = "undisclosed-secret"
    const value = createNumericObservationFromVerifiedCell({ sourceUtf8: "export default {}", cell: { key: "S01", block: "block-a", candidateSide: "bottom", initialInitiative: "candidate" }, lineageEdges: [], dependencyEdges: [], records: changed as never })
    expect(JSON.stringify(value)).not.toContain("undisclosed-secret")
  })
  it("projects repeated real traces and Chronicle records into numeric samples without private payload", () => {
    const result = createNumericObservationFromVerifiedCell({ sourceUtf8: "export default { soldierBrain() { return { action: { type: 'TURN_TO_STONE' } } } }", cell: { key: "S01:block-a:candidate", block: "block-a", candidateSide: "bottom", initialInitiative: "candidate" }, lineageEdges: [{ label: "parent", from: "tactical-base", to: "s01" }], dependencyEdges: [{ label: "imports", from: "strategy", to: "runtime-abi" }], records })
    expect(Object.keys(result.evidence.legalInputSamples)).toEqual(["block-a:candidate:soldierBrain:0", "block-a:candidate:soldierBrain:1"])
    expect(Object.keys(result.evidence.chronicleSamples).sort()).toEqual(["block-a:candidate:event:0", "block-a:candidate:transition:0"])
    expect(Object.keys(result.evidence.matchupSamples)).toEqual(["block-a:candidate:final-state:0", "block-a:candidate:final-event:0"])
    expect(JSON.stringify(result)).not.toContain("objective")
    expect(JSON.stringify(result)).not.toContain("opaque-a")
    expect(result.facts).toMatchObject({ soldierBrainDecisionCount: 2, turnToStoneCount: 2, nonStoneToStoneCount: 1, allSoldierBrainActionsStone: true })
    expect(result.facts.guardBehaviors).toHaveLength(2)
  })

  it("normalizes opaque ids consistently while preserving actions, direction, position and repeated samples", () => {
    const swapped = structuredClone(records) as unknown as any[]
    swapped[5].value.requestProjection.self.id = "different-1"
    swapped[6].value.requestProjection.self.id = "different-2"
    const base = createNumericObservationFromVerifiedCell({ sourceUtf8: "export default {}", cell: { key: "cell", block: "block-b", candidateSide: "top", initialInitiative: "opponent" }, lineageEdges: [], dependencyEdges: [], records })
    const changed = createNumericObservationFromVerifiedCell({ sourceUtf8: "export default {}", cell: { key: "cell", block: "block-b", candidateSide: "top", initialInitiative: "opponent" }, lineageEdges: [], dependencyEdges: [], records: swapped as never })
    expect(changed.evidence.legalInputSamples).toEqual(base.evidence.legalInputSamples)
    expect(JSON.stringify(base.evidence.legalInputSamples)).toContain("TURN_TO_STONE")
    expect(Object.keys(base.evidence.legalInputSamples)).toHaveLength(2)
  })

  it("rejects empty traces, failed execution and invented record kinds", () => {
    const input = { sourceUtf8: "export default {}", cell: { key: "cell", block: "block-a" as const, candidateSide: "bottom" as const, initialInitiative: "candidate" as const }, lineageEdges: [], dependencyEdges: [], records }
    expect(() => createNumericObservationFromVerifiedCell({ ...input, records: records.filter((record) => record.kind !== "trace") })).toThrow("FACTORY_OBSERVATION_RECORDS")
    expect(() => createNumericObservationFromVerifiedCell({ ...input, records: records.map((record) => record.kind === "execution" ? { ...record, value: { kind: "failure" } } : record) })).toThrow("FACTORY_OBSERVATION_EXECUTION")
    expect(() => createNumericObservationFromVerifiedCell({ ...input, records: [...records, { kind: "invented", ordinal: 0, value: {} }] as never })).toThrow("FACTORY_OBSERVATION_RECORDS")
  })
})
