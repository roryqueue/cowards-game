import { describe, expect, it } from "vitest"
import {
  ActionSchema,
  ChronicleSchema,
  RuntimeViolationUserGuidanceSchema,
  RuntimeViolationTypeSchema,
  SoldierInactivityExplanationDtoSchema,
  SoldierInactivityExplanationCauseSchema,
  SoldierSchema,
  StrategyRevisionValidationReportSchema,
  StrategyRevisionValidationIssueSchema,
  StrategyRevisionSchema,
} from "./schemas.js"
import { fixtures } from "./fixtures/index.js"
import { COMPATIBILITY_VERSIONS } from "./versions.js"
import { STRATEGY_SOURCE_BYTES } from "./constants.js"
import {
  RUNTIME_VIOLATION_TYPES,
  SOLDIER_INACTIVITY_EXPLANATION_CAUSES,
} from "./types.js"

describe("Coward's Game spec contracts", () => {
  it("compatibility versions have exactly the core six keys", () => {
    expect(Object.keys(COMPATIBILITY_VERSIONS)).toEqual([
      "spec",
      "engine",
      "runtimeJs",
      "chronicle",
      "strategyRevision",
      "arenaVariant",
    ])
  })

  it("standard initial Soldiers include 16 Soldiers total", () => {
    expect(fixtures.valid.standardInitialSoldiers).toHaveLength(16)
  })

  it("bottom Soldiers face UP and top Soldiers face DOWN", () => {
    const bottom = fixtures.valid.standardInitialSoldiers.filter(
      (soldier) => soldier.ownerPlayerId === "bottom",
    )
    const top = fixtures.valid.standardInitialSoldiers.filter(
      (soldier) => soldier.ownerPlayerId === "top",
    )

    expect(bottom.every((soldier) => soldier.facing === "UP")).toBe(true)
    expect(top.every((soldier) => soldier.facing === "DOWN")).toBe(true)
  })

  it("ActionSchema accepts MOVE, TURN, and TURN_TO_STONE", () => {
    expect(
      ActionSchema.safeParse({ type: "MOVE", direction: "UP" }).success,
    ).toBe(true)
    expect(
      ActionSchema.safeParse({ type: "TURN", direction: "LEFT" }).success,
    ).toBe(true)
    expect(ActionSchema.safeParse({ type: "TURN_TO_STONE" }).success).toBe(true)
  })

  it("RuntimeViolationTypeSchema accepts only player-caused public violations", () => {
    expect(
      RUNTIME_VIOLATION_TYPES.map((type) =>
        RuntimeViolationTypeSchema.parse(type),
      ),
    ).toEqual([
      "INVALID_OUTPUT",
      "TIMEOUT",
      "THROWN_EXCEPTION",
      "FORBIDDEN_CAPABILITY",
      "OVERSIZED_OUTPUT",
    ])

    for (const infrastructureLabel of [
      "MALFORMED_IPC",
      "SUBPROCESS_EXIT",
      "SUBPROCESS_SIGNAL",
      "SPAWN_FAILED",
      "SYSTEM_FAILURE",
    ]) {
      expect(
        RuntimeViolationTypeSchema.safeParse(infrastructureLabel).success,
      ).toBe(false)
    }
  })

  it("RuntimeViolationUserGuidanceSchema accepts concise public guidance", () => {
    const guidance = {
      label: "Strategy timed out",
      constraint: "Strategy methods must finish within the runtime timeout.",
      remediation: "Simplify the loop or reduce per-Cycle work.",
    }

    expect(RuntimeViolationUserGuidanceSchema.parse(guidance)).toEqual(guidance)
  })

  it("SoldierInactivityExplanationCauseSchema accepts every required cause", () => {
    expect(
      SOLDIER_INACTIVITY_EXPLANATION_CAUSES.map((cause) =>
        SoldierInactivityExplanationCauseSchema.parse(cause),
      ),
    ).toEqual([
      "not_selected",
      "invalid_action",
      "blocked_movement",
      "timeout",
      "thrown_exception",
      "stone",
      "fallen",
      "match_ended",
    ])
  })

  it("SoldierInactivityExplanationDtoSchema requires core explanation fields", () => {
    const explanation = {
      soldierId: "bottom-1",
      playerId: "bottom",
      sequence: 7,
      cause: "blocked_movement",
      label: "Move was blocked",
      remediation: "Choose a path that is not occupied or blocked.",
    }

    expect(SoldierInactivityExplanationDtoSchema.parse(explanation)).toEqual(
      explanation,
    )

    for (const field of [
      "soldierId",
      "sequence",
      "cause",
      "label",
      "remediation",
    ] as const) {
      const withoutField = { ...explanation }
      delete withoutField[field]

      expect(
        SoldierInactivityExplanationDtoSchema.safeParse(withoutField).success,
      ).toBe(false)
    }
  })

  it("SoldierInactivityExplanationDtoSchema rejects empty copy and non-JSON details", () => {
    const explanation = {
      soldierId: "bottom-1",
      sequence: 7,
      cause: "invalid_action",
      label: "Invalid action",
      remediation: "Return a valid Action for the active Soldier.",
      details: { reason: "IMMEDIATE_REVERSAL" },
    }

    expect(SoldierInactivityExplanationDtoSchema.parse(explanation)).toEqual(
      explanation,
    )
    expect(
      SoldierInactivityExplanationDtoSchema.safeParse({
        ...explanation,
        label: "",
      }).success,
    ).toBe(false)
    expect(
      SoldierInactivityExplanationDtoSchema.safeParse({
        ...explanation,
        remediation: "",
      }).success,
    ).toBe(false)
    expect(
      SoldierInactivityExplanationDtoSchema.safeParse({
        ...explanation,
        details: { callback: () => "not-json" },
      }).success,
    ).toBe(false)
  })

  it("StrategyRevisionValidationIssueSchema accepts optional guidance fields", () => {
    const issue = {
      code: "MISSING_DEFAULT_EXPORT",
      severity: "error",
      message: "Strategy source must contain export default",
      constraint: "Strategy API requires an export default Strategy object.",
      remediation:
        "Add export default with selectActivations and soldierBrain.",
      reference: "samples/minimal-strategy",
    }

    expect(StrategyRevisionValidationIssueSchema.parse(issue)).toEqual(issue)
  })

  it("StrategyRevisionValidationIssueSchema rejects empty guidance fields", () => {
    const baseIssue = {
      code: "MISSING_DEFAULT_EXPORT",
      severity: "error",
      message: "Strategy source must contain export default",
    }

    expect(
      StrategyRevisionValidationIssueSchema.safeParse({
        ...baseIssue,
        constraint: "",
        remediation: "Add export default.",
      }).success,
    ).toBe(false)
    expect(
      StrategyRevisionValidationIssueSchema.safeParse({
        ...baseIssue,
        constraint: "Strategy API requires export default.",
        remediation: "",
      }).success,
    ).toBe(false)
  })

  it("StrategyRevisionValidationIssueSchema keeps legacy issues valid", () => {
    const issue = {
      code: "MISSING_DEFAULT_EXPORT",
      severity: "error",
      message: "Strategy source must contain export default",
    }

    expect(StrategyRevisionValidationIssueSchema.parse(issue)).toEqual(issue)
  })

  it("ChronicleSchema rejects infrastructure labels in public runtime violation payloads", () => {
    const baseEvent = {
      type: "RUNTIME_VIOLATION",
      sequence: 0,
      context: { phaseNumber: 1 },
      privacy: "public",
      payload: { type: "SYSTEM_FAILURE", playerId: "bottom" },
    }

    expect(
      ChronicleSchema.safeParse({
        schemaVersion: "chronicle-v1",
        reproducibility: {
          matchId: "match-runtime-failure",
          seed: "seed-1",
          arenaVariantId: "arena-standard",
          arenaVariantVersion: "arena-v1",
          strategyRevisionIds: ["strategy-bottom-v1", "strategy-top-v1"],
          versions: COMPATIBILITY_VERSIONS,
        },
        events: [baseEvent],
        snapshots: [],
      }).success,
    ).toBe(false)
  })

  it("at least one invalid fixture fails schema validation", () => {
    expect(
      ActionSchema.safeParse(fixtures.invalid.invalidDirection).success,
    ).toBe(false)
    expect(
      SoldierSchema.safeParse(fixtures.invalid.illegalSoldierStatus).success,
    ).toBe(false)
  })

  it("ChronicleSchema accepts a minimal replay artifact with private owner data", () => {
    const board = {
      bounds: { minX: 0, maxX: 11, minY: 0, maxY: 11 },
      soldiers: [
        {
          id: "bottom-1",
          ownerPlayerId: "bottom",
          status: "ACTIVE",
          position: { x: 5, y: 10 },
          facing: "UP",
          lastSuccessfulMoveDirection: null,
        },
        {
          id: "top-1",
          ownerPlayerId: "top",
          status: "FALLEN",
          position: null,
          facing: null,
          lastSuccessfulMoveDirection: null,
        },
      ],
      terrainStones: [],
    }

    const chronicle = {
      schemaVersion: "chronicle-v1",
      reproducibility: {
        matchId: "match-1",
        seed: "seed-1",
        arenaVariantId: "arena-standard",
        arenaVariantVersion: "arena-v1",
        strategyRevisionIds: ["strategy-bottom-v1", "strategy-top-v1"],
        versions: COMPATIBILITY_VERSIONS,
      },
      events: [
        {
          type: "MATCH_STARTED",
          sequence: 0,
          context: { phaseNumber: 1 },
          privacy: "public",
          payload: { matchId: "match-1" },
        },
        {
          type: "ROUND_STARTED",
          sequence: 1,
          context: { phaseNumber: 1, roundNumber: 1 },
          privacy: "public",
          payload: { roundNumber: 1 },
        },
        {
          type: "ACTIVATION_STARTED",
          sequence: 2,
          context: {
            phaseNumber: 1,
            roundNumber: 1,
            activationId: "activation-1",
            activationIndex: 0,
            actingPlayerId: "bottom",
            soldierId: "bottom-1",
          },
          privacy: "public",
          payload: { soldierId: "bottom-1" },
        },
        {
          type: "AWARENESS_GRID_OBSERVED",
          sequence: 3,
          context: {
            phaseNumber: 1,
            roundNumber: 1,
            activationId: "activation-1",
            activationIndex: 0,
            cycleIndex: 0,
            actingPlayerId: "bottom",
            soldierId: "bottom-1",
          },
          privacy: "owner",
          payload: { soldierId: "bottom-1", cycleIndex: 0 },
          privateRef: "bottom.awareness.3",
        },
        {
          type: "MATCH_ENDED",
          sequence: 4,
          context: { phaseNumber: 1 },
          privacy: "public",
          payload: { type: "WIN", winnerPlayerId: "bottom" },
        },
      ],
      snapshots: [
        {
          kind: "MATCH_START",
          sequence: 0,
          context: { phaseNumber: 1 },
          board,
        },
        {
          kind: "TERMINAL",
          sequence: 4,
          context: { phaseNumber: 1 },
          board,
          outcome: { type: "WIN", winnerPlayerId: "bottom" },
        },
      ],
      private: {
        byPlayerId: {
          bottom: {
            awareness: {
              "bottom.awareness.3": {
                soldierId: "bottom-1",
                cycleIndex: 0,
                grid: "owner-only-grid",
              },
            },
          },
        },
      },
      integrity: {
        algorithm: "sha256",
        normalizedContentHash: "hash-fixture",
      },
    }

    expect(ChronicleSchema.parse(chronicle)).toEqual(chronicle)
  })

  it("StrategyRevisionSchema accepts a valid runtime-js revision artifact", () => {
    const source =
      "export default { selectActivations() {}, soldierBrain() {} }"
    const revision = {
      id: "strategy-revision:abc123",
      strategyId: "strategy-1",
      source,
      sourceHash: "abc123",
      sourceBytes: new TextEncoder().encode(source).length,
      runtime: {
        name: "runtime-js",
        version: COMPATIBILITY_VERSIONS.runtimeJs,
      },
      engineCompatibility: {
        spec: COMPATIBILITY_VERSIONS.spec,
        engine: COMPATIBILITY_VERSIONS.engine,
      },
      validation: {
        valid: true,
        errors: [],
        warnings: [],
        sourceBytes: new TextEncoder().encode(source).length,
        forbiddenPatterns: [],
        sourceHash: "abc123",
        runtimeVersion: COMPATIBILITY_VERSIONS.runtimeJs,
        engineCompatibility: {
          spec: COMPATIBILITY_VERSIONS.spec,
          engine: COMPATIBILITY_VERSIONS.engine,
        },
      },
      metadata: {
        createdBy: "user:local",
        label: "Opening test",
        notes: "Workshop note",
        tags: ["fixture"],
      },
    }

    expect(StrategyRevisionSchema.parse(revision)).toEqual(revision)
  })

  it("StrategyRevisionSchema rejects oversized source", () => {
    const source = "x".repeat(STRATEGY_SOURCE_BYTES + 1)

    expect(
      StrategyRevisionSchema.safeParse({
        id: "strategy-revision:oversized",
        source,
        sourceHash: "oversized",
        sourceBytes: STRATEGY_SOURCE_BYTES + 1,
        runtime: {
          name: "runtime-js",
          version: COMPATIBILITY_VERSIONS.runtimeJs,
        },
        engineCompatibility: {
          spec: COMPATIBILITY_VERSIONS.spec,
          engine: COMPATIBILITY_VERSIONS.engine,
        },
        validation: {
          valid: true,
          errors: [],
          warnings: [],
          sourceBytes: STRATEGY_SOURCE_BYTES + 1,
          forbiddenPatterns: [],
          sourceHash: "oversized",
          runtimeVersion: COMPATIBILITY_VERSIONS.runtimeJs,
          engineCompatibility: {
            spec: COMPATIBILITY_VERSIONS.spec,
            engine: COMPATIBILITY_VERSIONS.engine,
          },
        },
        metadata: {},
      }).success,
    ).toBe(false)
  })

  it("StrategyRevisionValidationReportSchema accepts oversized-source reports", () => {
    const report = {
      valid: false,
      errors: [
        {
          code: "SOURCE_TOO_LARGE",
          severity: "error",
          message: "Strategy source exceeds 65536 bytes",
          constraint: "Strategy source must stay within the source byte limit.",
          remediation:
            "Remove unused helper code or comments before validating again.",
        },
      ],
      warnings: [],
      sourceBytes: STRATEGY_SOURCE_BYTES + 1,
      forbiddenPatterns: [],
      sourceHash: "oversized",
      runtimeVersion: COMPATIBILITY_VERSIONS.runtimeJs,
      engineCompatibility: {
        spec: COMPATIBILITY_VERSIONS.spec,
        engine: COMPATIBILITY_VERSIONS.engine,
      },
    }

    expect(StrategyRevisionValidationReportSchema.parse(report)).toEqual(report)
  })

  it("StrategyRevisionSchema rejects reports where valid: true has errors", () => {
    const source =
      "export default { selectActivations() {}, soldierBrain() {} }"

    expect(
      StrategyRevisionSchema.safeParse({
        id: "strategy-revision:invalid-report",
        source,
        sourceHash: "invalid-report",
        sourceBytes: new TextEncoder().encode(source).length,
        runtime: {
          name: "runtime-js",
          version: COMPATIBILITY_VERSIONS.runtimeJs,
        },
        engineCompatibility: {
          spec: COMPATIBILITY_VERSIONS.spec,
          engine: COMPATIBILITY_VERSIONS.engine,
        },
        validation: {
          valid: true,
          errors: [
            {
              code: "MISSING_DEFAULT_EXPORT",
              severity: "error",
              message: "Missing export default",
            },
          ],
          warnings: [],
          sourceBytes: new TextEncoder().encode(source).length,
          forbiddenPatterns: [],
          sourceHash: "invalid-report",
          runtimeVersion: COMPATIBILITY_VERSIONS.runtimeJs,
          engineCompatibility: {
            spec: COMPATIBILITY_VERSIONS.spec,
            engine: COMPATIBILITY_VERSIONS.engine,
          },
        },
        metadata: {},
      }).success,
    ).toBe(false)
  })
})
