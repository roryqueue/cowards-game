import { describe, expect, it } from "vitest"
import { CANONICAL_ARENA_CATALOG_V1_37 } from "./arena-catalog-v1-37.js"
import {
  CANONICAL_SET_CONDITION_ROWS_V1_37,
  SET_CONDITION_POLICY_V1_37,
  createSetScenarioV137,
  evaluateSetScenarioCompletionV137,
  parseSetScenarioV137,
  type SetConditionAttemptEvidenceV137,
  type SetScenarioV137,
} from "./set-condition-policy-v1-37.js"

const clone = <T>(value: T): T => globalThis.structuredClone(value)

const scenarioInput = () => ({
  arenaCatalogVersion: "canonical-arena-catalog-v1.37" as const,
  arenaSemanticGeometryHash:
    CANONICAL_ARENA_CATALOG_V1_37.arenas[0]!.semanticGeometryHash,
  entrantA: { entrantKey: "revision:a", playerId: "player:a" },
  entrantB: { entrantKey: "revision:b", playerId: "player:b" },
  baseSeed: "seed:scenario:001",
})

const terminalEvidence = (
  scenario: SetScenarioV137,
): SetConditionAttemptEvidenceV137[] =>
  scenario.conditions.map((condition, index) => ({
    conditionId: condition.conditionId,
    requestIdentity: condition.requestIdentity,
    attempt: 1,
    result: index === 2 ? "player_violation" : "success",
    retryable: false,
  }))

describe("four-condition Set policy v1.37", () => {
  it("freezes the exact canonical condition order", () => {
    expect(SET_CONDITION_POLICY_V1_37).toMatchObject({
      version: "canonical-set-policy-v1.37-four-condition-v1",
      lifecycle: { status: "candidate", active: false },
      conditionCount: 4,
      fairnessSemanticsSource: "explicit-condition-fields",
      seedCarriesFairnessSemantics: false,
    })
    expect(CANONICAL_SET_CONDITION_ROWS_V1_37).toEqual([
      {
        ordinal: 0,
        suffix: "a-bottom-a-first",
        bottom: "a",
        top: "b",
        initialInitiative: "a",
      },
      {
        ordinal: 1,
        suffix: "a-bottom-b-first",
        bottom: "a",
        top: "b",
        initialInitiative: "b",
      },
      {
        ordinal: 2,
        suffix: "a-top-a-first",
        bottom: "b",
        top: "a",
        initialInitiative: "a",
      },
      {
        ordinal: 3,
        suffix: "a-top-b-first",
        bottom: "b",
        top: "a",
        initialInitiative: "b",
      },
    ])
    expect(Object.isFrozen(CANONICAL_SET_CONDITION_ROWS_V1_37)).toBe(true)
  })

  it("creates one stable scenario and four explicit condition identities", () => {
    const first = createSetScenarioV137(scenarioInput())
    const second = createSetScenarioV137(scenarioInput())
    expect(first).toEqual(second)
    expect(first.scenarioId).toMatch(/^set-scenario:sha256:[0-9a-f]{64}$/u)
    expect(first.conditions).toHaveLength(4)
    expect(new Set(first.conditions.map(({ conditionId }) => conditionId)).size)
      .toBe(4)
    expect(first.conditions.map(({ suffix }) => suffix)).toEqual(
      CANONICAL_SET_CONDITION_ROWS_V1_37.map(({ suffix }) => suffix),
    )
    expect(first.conditions.every(({ baseSeed }) => baseSeed === first.baseSeed))
      .toBe(true)
    expect(
      first.conditions.every(
        ({ conditionId, requestIdentity }) =>
          /^set-condition:sha256:[0-9a-f]{64}$/u.test(conditionId) &&
          /^set-request:sha256:[0-9a-f]{64}$/u.test(requestIdentity),
      ),
    ).toBe(true)
  })

  it("proves entrant-level two-per-side and two-per-initiative coverage", () => {
    const scenario = createSetScenarioV137(scenarioInput())
    for (const entrant of [scenario.entrantA, scenario.entrantB]) {
      expect(
        scenario.conditions.filter(
          ({ bottomEntrantKey }) => bottomEntrantKey === entrant.entrantKey,
        ),
      ).toHaveLength(2)
      expect(
        scenario.conditions.filter(
          ({ topEntrantKey }) => topEntrantKey === entrant.entrantKey,
        ),
      ).toHaveLength(2)
      expect(
        scenario.conditions.filter(
          ({ initialInitiativeEntrantKey }) =>
            initialInitiativeEntrantKey === entrant.entrantKey,
        ),
      ).toHaveLength(2)
    }
  })

  it("normalizes condition insertion order without changing identities", () => {
    const scenario = createSetScenarioV137(scenarioInput())
    const permuted = clone(scenario)
    permuted.conditions = [
      permuted.conditions[2]!,
      permuted.conditions[0]!,
      permuted.conditions[3]!,
      permuted.conditions[1]!,
    ]
    expect(parseSetScenarioV137(permuted)).toEqual(scenario)
  })

  it.each([
    [
      "omitted condition",
      (scenario: SetScenarioV137) => scenario.conditions.pop(),
    ],
    [
      "duplicated condition",
      (scenario: SetScenarioV137) => {
        scenario.conditions[3] = clone(scenario.conditions[0]!)
      },
    ],
    [
      "substituted side",
      (scenario: SetScenarioV137) => {
        scenario.conditions[1]!.bottomEntrantKey = scenario.entrantB.entrantKey
      },
    ],
    [
      "reordered semantic ordinal claim",
      (scenario: SetScenarioV137) => {
        scenario.conditions[0]!.ordinal = 3
      },
    ],
    [
      "seed-derived shortcut",
      (scenario: SetScenarioV137) => {
        scenario.conditions[1]!.baseSeed += ":mirror"
      },
    ],
  ] as const)("rejects %s", (_label, mutate) => {
    const scenario = clone(createSetScenarioV137(scenarioInput()))
    mutate(scenario)
    expect(() => parseSetScenarioV137(scenario)).toThrow(
      "SET_SCENARIO_MEMBERSHIP_MISMATCH",
    )
  })

  it("treats player violations as valid terminal evidence independent of completion order", () => {
    const scenario = createSetScenarioV137(scenarioInput())
    const evidence = terminalEvidence(scenario)
    const forward = evaluateSetScenarioCompletionV137(scenario, evidence)
    const reverse = evaluateSetScenarioCompletionV137(
      scenario,
      [...evidence].reverse(),
    )
    expect(forward).toEqual(reverse)
    expect(forward).toEqual({
      status: "complete",
      counted: true,
      terminalConditionIds: scenario.conditions.map(
        ({ conditionId }) => conditionId,
      ),
      unresolvedConditionIds: [],
    })
  })

  it("keeps partial and system-failed matrices non-counted", () => {
    const scenario = createSetScenarioV137(scenarioInput())
    const partial = terminalEvidence(scenario).slice(0, 3)
    expect(evaluateSetScenarioCompletionV137(scenario, partial)).toMatchObject({
      status: "pending",
      counted: false,
      unresolvedConditionIds: [scenario.conditions[3]!.conditionId],
    })

    const retryable = terminalEvidence(scenario)
    retryable[3] = {
      ...retryable[3]!,
      result: "system_failure",
      retryable: true,
    }
    expect(
      evaluateSetScenarioCompletionV137(scenario, retryable),
    ).toMatchObject({ status: "pending", counted: false })

    retryable[3] = { ...retryable[3]!, retryable: false }
    expect(
      evaluateSetScenarioCompletionV137(scenario, retryable),
    ).toMatchObject({ status: "degraded", counted: false })
  })

  it("requires identical request identity for every system retry", () => {
    const scenario = createSetScenarioV137(scenarioInput())
    const condition = scenario.conditions[0]!
    const evidence: SetConditionAttemptEvidenceV137[] = [
      {
        conditionId: condition.conditionId,
        requestIdentity: condition.requestIdentity,
        attempt: 1,
        result: "system_failure",
        retryable: true,
      },
      {
        conditionId: condition.conditionId,
        requestIdentity: `set-request:sha256:${"0".repeat(64)}`,
        attempt: 2,
        result: "success",
        retryable: false,
      },
    ]
    expect(() =>
      evaluateSetScenarioCompletionV137(scenario, evidence),
    ).toThrow("SET_RETRY_IDENTITY_MISMATCH")
  })
})
