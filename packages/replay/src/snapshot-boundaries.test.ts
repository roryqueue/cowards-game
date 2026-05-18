import type {
  Chronicle,
  ChronicleBoundarySnapshot,
  ChronicleSnapshotKind,
  SoldierBrainInput,
  StrategyInput,
} from "@cowards/spec"
import { describe, expect, it } from "vitest"
import type { StrategyRuntime } from "@cowards/engine"
import { buildChronicleFromMatch } from "./build.js"
import { validateSnapshotBoundaries } from "./snapshot-boundaries.js"

const turnToStoneRuntime: StrategyRuntime = {
  selectActivations(input: StrategyInput) {
    return {
      ok: true,
      value: {
        activationOrders: input.mySoldiers
          .filter((soldier) => soldier.status === "ACTIVE")
          .map((soldier) => ({ soldierId: soldier.id })),
        strategyMemory: {},
      },
    }
  },
  runSoldierBrain(_input: SoldierBrainInput) {
    return {
      ok: true,
      value: {
        action: { type: "TURN_TO_STONE" },
        soldierMemory: {},
      },
    }
  },
}

const passiveRuntime: StrategyRuntime = {
  selectActivations(_input: StrategyInput) {
    return {
      ok: true,
      value: {
        activationOrders: [],
        strategyMemory: {},
      },
    }
  },
  runSoldierBrain(_input: SoldierBrainInput) {
    return {
      ok: true,
      value: {
        action: { type: "TURN", direction: "RIGHT" },
        soldierMemory: {},
      },
    }
  },
}

const createChronicle = (runtime: StrategyRuntime = turnToStoneRuntime) =>
  buildChronicleFromMatch({
    matchId: "snapshot-boundary-match",
    seed: "snapshot-boundary-seed",
    arenaVariant: {
      id: "arena",
      name: "Arena",
      initialBounds: { minX: 0, maxX: 11, minY: 0, maxY: 11 },
      terrainStones: [],
    },
    bottomPlayerId: "bottom",
    topPlayerId: "top",
    bottomStrategyRevisionId: "bottom-rev",
    topStrategyRevisionId: "top-rev",
    runtime,
    maxPhases: 1,
  }).chronicle

const createContractionChronicle = (): Chronicle => {
  const chronicle = createChronicle(passiveRuntime)
  const contractionSequence = chronicle.events.find(
    (event) => event.type === "CONTRACTION_RESOLVED",
  )?.sequence
  if (contractionSequence === undefined) {
    throw new Error("Missing CONTRACTION_RESOLVED event in test fixture.")
  }
  return mutateFirstSnapshot(chronicle, "CONTRACTION", (snapshot) => ({
    ...snapshot,
    sequence: contractionSequence,
  }))
}

const cloneChronicle = (chronicle: Chronicle): Chronicle =>
  JSON.parse(JSON.stringify(chronicle)) as Chronicle

const snapshotOf = (
  chronicle: Chronicle,
  kind: ChronicleSnapshotKind,
): ChronicleBoundarySnapshot => {
  const snapshot = chronicle.snapshots.find(
    (candidate) => candidate.kind === kind,
  )
  if (snapshot === undefined) {
    throw new Error(`Missing ${kind} snapshot in test fixture.`)
  }
  return snapshot
}

const mutateFirstSnapshot = (
  chronicle: Chronicle,
  kind: ChronicleSnapshotKind,
  mutate: (snapshot: ChronicleBoundarySnapshot) => ChronicleBoundarySnapshot,
): Chronicle => ({
  ...chronicle,
  snapshots: chronicle.snapshots.map((snapshot) =>
    snapshot.kind === kind ? mutate(snapshot) : snapshot,
  ),
})

const errorCodes = (chronicle: Chronicle) =>
  validateSnapshotBoundaries(chronicle).map((error) => error.code)

describe("validateSnapshotBoundaries", () => {
  it("accepts legal built Chronicle snapshot boundaries", () => {
    expect(validateSnapshotBoundaries(createChronicle())).toEqual([])
    expect(validateSnapshotBoundaries(createContractionChronicle())).toEqual([])
  })

  it("rejects snapshots that reference missing event sequences", () => {
    const chronicle = createChronicle()
    const missingSequence =
      Math.max(...chronicle.events.map((event) => event.sequence)) + 1

    expect(
      errorCodes(
        mutateFirstSnapshot(chronicle, "ROUND_START", (snapshot) => ({
          ...snapshot,
          sequence: missingSequence,
        })),
      ),
    ).toContain("SNAPSHOT_MISSING")
  })

  it.each([
    ["MATCH_START", "ROUND_STARTED"],
    ["ROUND_START", "MATCH_STARTED"],
    ["ACTIVATION_START", "ROUND_STARTED"],
    ["MATCH_END", "ROUND_STARTED"],
    ["TERMINAL", "ROUND_STARTED"],
  ] as const)(
    "rejects %s snapshots attached to %s events",
    (kind, targetEventType) => {
      const chronicle = createChronicle()
      const targetSequence = chronicle.events.find(
        (event) => event.type === targetEventType,
      )?.sequence

      expect(targetSequence).toBeDefined()
      expect(
        errorCodes(
          mutateFirstSnapshot(chronicle, kind, (snapshot) => ({
            ...snapshot,
            sequence: targetSequence ?? snapshot.sequence,
          })),
        ),
      ).toContain("SNAPSHOT_BOUNDARY_INVALID")
    },
  )

  it("rejects CONTRACTION snapshots attached to non-Contraction events", () => {
    const chronicle = createContractionChronicle()
    expect(snapshotOf(chronicle, "CONTRACTION")).toBeDefined()

    expect(
      errorCodes(
        mutateFirstSnapshot(chronicle, "CONTRACTION", (snapshot) => ({
          ...snapshot,
          sequence: 0,
        })),
      ),
    ).toContain("SNAPSHOT_BOUNDARY_INVALID")
  })

  it("rejects ROUND_END snapshots moved to a mid-Round event with matching Round context", () => {
    const chronicle = createChronicle()
    const roundEnd = snapshotOf(chronicle, "ROUND_END")
    const midRoundSequence = chronicle.events.find(
      (event) =>
        event.sequence < roundEnd.sequence &&
        event.context.phaseNumber === roundEnd.context.phaseNumber &&
        event.context.roundNumber === roundEnd.context.roundNumber &&
        event.type === "STRATEGY_EVALUATED",
    )?.sequence

    expect(midRoundSequence).toBeDefined()
    expect(
      errorCodes(
        mutateFirstSnapshot(chronicle, "ROUND_END", (snapshot) => ({
          ...snapshot,
          sequence: midRoundSequence ?? snapshot.sequence,
        })),
      ),
    ).toContain("SNAPSHOT_BOUNDARY_INVALID")
  })

  it("rejects ACTIVATION_END snapshots moved to a mid-Activation event with matching Activation context", () => {
    const chronicle = createChronicle()
    const activationEnd = snapshotOf(chronicle, "ACTIVATION_END")
    const midActivationSequence = chronicle.events.find(
      (event) =>
        event.sequence < activationEnd.sequence &&
        event.context.activationId === activationEnd.context.activationId &&
        event.context.activationIndex ===
          activationEnd.context.activationIndex &&
        event.context.roundNumber === activationEnd.context.roundNumber &&
        event.context.actingPlayerId === activationEnd.context.actingPlayerId &&
        event.context.soldierId === activationEnd.context.soldierId &&
        event.type === "AWARENESS_GRID_OBSERVED",
    )?.sequence

    expect(midActivationSequence).toBeDefined()
    expect(
      errorCodes(
        mutateFirstSnapshot(chronicle, "ACTIVATION_END", (snapshot) => ({
          ...snapshot,
          sequence: midActivationSequence ?? snapshot.sequence,
        })),
      ),
    ).toContain("SNAPSHOT_BOUNDARY_INVALID")
  })

  it.each(["ROUND_START", "ROUND_END"] as const)(
    "rejects %s snapshots whose Round context contradicts the boundary event",
    (kind) => {
      const chronicle = createChronicle()

      expect(
        errorCodes(
          mutateFirstSnapshot(chronicle, kind, (snapshot) => ({
            ...snapshot,
            context: {
              ...snapshot.context,
              roundNumber: snapshot.context.roundNumber === 1 ? 2 : 1,
            },
          })),
        ),
      ).toContain("CONTEXT_MISMATCH")
    },
  )

  it.each(["ACTIVATION_START", "ACTIVATION_END"] as const)(
    "rejects %s snapshots whose Activation context contradicts the boundary event",
    (kind) => {
      const chronicle = createChronicle()

      expect(
        errorCodes(
          mutateFirstSnapshot(chronicle, kind, (snapshot) => ({
            ...snapshot,
            context: {
              ...snapshot.context,
              actingPlayerId: `${snapshot.context.actingPlayerId}-tampered`,
            },
          })),
        ),
      ).toContain("CONTEXT_MISMATCH")
    },
  )

  it("rejects CONTRACTION snapshots whose Phase context contradicts the boundary event", () => {
    const chronicle = createContractionChronicle()

    expect(
      errorCodes(
        mutateFirstSnapshot(chronicle, "CONTRACTION", (snapshot) => ({
          ...snapshot,
          context: {
            ...snapshot.context,
            phaseNumber: (snapshot.context.phaseNumber ?? 1) + 1,
          },
        })),
      ),
    ).toContain("CONTEXT_MISMATCH")
  })

  it.each(["MATCH_END", "TERMINAL"] as const)(
    "rejects %s snapshots whose outcome contradicts MATCH_ENDED",
    (kind) => {
      const chronicle = cloneChronicle(createChronicle())

      expect(
        errorCodes(
          mutateFirstSnapshot(chronicle, kind, (snapshot) => ({
            ...snapshot,
            outcome: { type: "DRAW" },
          })),
        ),
      ).toContain("CONTEXT_MISMATCH")
    },
  )
})
