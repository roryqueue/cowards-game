import { describe, expect, it } from "vitest"
import { validateStrategySource } from "@cowards/runtime-js"
import {
  assertWorkshopRevisionCanBeTested,
  buildWorkshopRevision,
  GET_WORKSHOP_REVISION_SOURCE_SQL,
  getWorkshopTestSummary,
  LIST_WORKSHOP_REVISIONS_SQL,
  listWorkshopOpponents,
  listWorkshopPresets,
  listWorkshopSamples,
  listWorkshopTemplates,
  WORKSHOP_STRATEGY_ID,
  WORKSHOP_MATCH_SET_PREFIX,
  WORKSHOP_OPPONENTS,
  workshopTemplateSource,
} from "./workshop.js"
import { MATCH_SET_STATUSES } from "./schema.js"
import {
  LIST_MATCH_STATUSES_FOR_SET_SQL,
  mapMatchSetMatchSummaryRow,
} from "./matchset-status.js"

describe("Workshop service contracts", () => {
  it("ships valid built-in template and opponent sources", () => {
    expect(validateStrategySource(workshopTemplateSource).valid).toBe(true)

    for (const opponent of WORKSHOP_OPPONENTS) {
      expect(opponent.revisionId).toMatch(/^strategy-revision:/)
    }
  })

  it("summarizes presets without exposing Strategy source", () => {
    expect(listWorkshopPresets()).toEqual([
      expect.objectContaining({
        id: "smoke-v1",
        label: "Smoke",
        matchCount: 1,
      }),
      expect.objectContaining({
        id: "standard-v1",
        label: "Standard",
        matchCount: 8,
      }),
      expect.objectContaining({
        id: "stress-v1",
        label: "Stress",
        matchCount: 24,
      }),
    ])
  })

  it("summarizes opponents without source text", () => {
    expect(listWorkshopOpponents()).toEqual([
      {
        id: "opponent:cautious",
        label: "Cautious",
        revisionId: expect.stringMatching(/^strategy-revision:/),
      },
      {
        id: "opponent:reckless",
        label: "Reckless",
        revisionId: expect.stringMatching(/^strategy-revision:/),
      },
    ])
  })

  it("returns only valid starter templates", () => {
    expect(listWorkshopTemplates().map((template) => template.label)).toEqual([
      "Cautious",
      "Reckless",
      "Sentinel",
    ])
    expect(
      listWorkshopTemplates().every((template) => template.validation.valid),
    ).toBe(true)
  })

  it("returns sample Strategy metadata for every catalog entry", () => {
    for (const sample of listWorkshopSamples()) {
      expect(sample.id).toMatch(/^sample:/)
      expect(sample.label.length).toBeGreaterThan(0)
      expect(sample.description.length).toBeGreaterThan(0)
      expect(sample.description.length).toBeLessThanOrEqual(96)
      expect(sample.categories.length).toBeGreaterThan(0)
      expect(sample.source.length).toBeGreaterThan(0)
      expect(["starter", "failure-mode"]).toContain(sample.sampleKind)
    }
  })

  it("ships valid starter samples for common doctrine mechanics", () => {
    const starters = listWorkshopSamples().filter(
      (sample) => sample.sampleKind === "starter",
    )

    expect(starters.map((sample) => sample.id)).toEqual([
      "sample:basic-advance-turn",
      "sample:push-setup",
      "sample:backstab-setup",
      "sample:stoning-blocking",
    ])
    expect(starters.map((sample) => sample.label)).toEqual([
      "Basic advance and turn",
      "Push setup",
      "Backstab setup",
      "Stone and blocking",
    ])
    expect(starters.map((sample) => sample.categories[0])).toEqual([
      "Movement",
      "Push",
      "Backstab",
      "Stone",
    ])
    expect(starters.every((sample) => sample.validation.valid)).toBe(true)
    expect(
      starters.every((sample) => sample.validation.errors.length === 0),
    ).toBe(true)
    expect(
      starters.every(
        (sample) =>
          sample.expectedValidationCode === undefined &&
          sample.expectedRuntimeViolationType === undefined,
      ),
    ).toBe(true)
  })

  it("ships intentional failure-mode samples with explicit expectations", () => {
    const failureModes = listWorkshopSamples().filter(
      (sample) => sample.sampleKind === "failure-mode",
    )

    expect(failureModes.map((sample) => sample.id)).toEqual([
      "sample:failure-forbidden-clock",
      "sample:failure-runtime-timeout",
      "sample:failure-invalid-output",
      "sample:failure-thrown-exception",
      "sample:failure-do-nothing",
    ])

    for (const sample of failureModes) {
      if (sample.expectedValidationCode) {
        expect(sample.validation.valid).toBe(false)
        expect(sample.validation.errors.map((error) => error.code)).toContain(
          sample.expectedValidationCode,
        )
      }

      if (sample.expectedRuntimeViolationType) {
        expect(sample.validation.valid).toBe(true)
      }
    }

    expect(
      failureModes.find((sample) => sample.id === "sample:failure-do-nothing")
        ?.validation.valid,
    ).toBe(true)
    expect(
      failureModes.find(
        (sample) => sample.id === "sample:failure-runtime-timeout",
      )?.expectedRuntimeViolationType,
    ).toBe("TIMEOUT")
  })

  it("documents runtime failure samples and advertised violation types", () => {
    const runtimeFailureSamples = listWorkshopSamples().filter(
      (sample) => sample.expectedRuntimeViolationType,
    )

    expect(runtimeFailureSamples.map((sample) => sample.id)).toEqual([
      "sample:failure-runtime-timeout",
      "sample:failure-invalid-output",
      "sample:failure-thrown-exception",
    ])

    for (const sample of runtimeFailureSamples) {
      expect(validateStrategySource(sample.source).valid).toBe(true)
      expect(sample.expectedRuntimeViolationType).toMatch(
        /^(TIMEOUT|INVALID_OUTPUT|THROWN_EXCEPTION)$/,
      )
    }
  })

  it("keeps revision history limited to local Workshop revisions", () => {
    expect(LIST_WORKSHOP_REVISIONS_SQL).toContain("strategy_id = $1")
    expect(LIST_WORKSHOP_REVISIONS_SQL).toContain("created_at desc")
    expect(LIST_WORKSHOP_REVISIONS_SQL).toContain(
      "bottom_strategy_revision_id = sr.id",
    )
    expect(LIST_WORKSHOP_REVISIONS_SQL).toContain(
      "top_strategy_revision_id = sr.id",
    )
    expect(GET_WORKSHOP_REVISION_SOURCE_SQL).toContain("strategy_id = $2")
  })

  it("defines safe Workshop test summary vocabulary", () => {
    expect(WORKSHOP_MATCH_SET_PREFIX).toBe("match-set:workshop:")
    expect(listWorkshopPresets()[0]).toMatchObject({
      id: "smoke-v1",
      matchCount: 1,
    })
    expect(MATCH_SET_STATUSES).toEqual([
      "pending",
      "running",
      "complete",
      "failed_system",
      "blocked",
      "degraded",
    ])
  })

  it("maps Match rows with outcome and replay availability", () => {
    expect(LIST_MATCH_STATUSES_FOR_SET_SQL).toContain("left join chronicles")
    expect(LIST_MATCH_STATUSES_FOR_SET_SQL).toContain("winner_player_id")
    expect(
      mapMatchSetMatchSummaryRow({
        match_id: "match:complete",
        status: "complete",
        bottom_player_id: "player:bottom",
        top_player_id: "player:top",
        outcome: { type: "WIN", winnerPlayerId: "player:bottom" },
        winner_player_id: "player:bottom",
        chronicle_match_id: "match:complete",
      }),
    ).toEqual({
      matchId: "match:complete",
      status: "complete",
      bottomPlayerId: "player:bottom",
      topPlayerId: "player:top",
      outcome: { type: "WIN", winnerPlayerId: "player:bottom" },
      winnerPlayerId: "player:bottom",
      hasReplay: true,
    })
    expect(
      mapMatchSetMatchSummaryRow({
        match_id: "match:missing-chronicle",
        status: "complete",
        bottom_player_id: "player:bottom",
        top_player_id: "player:top",
        outcome: { type: "DRAW" },
        winner_player_id: null,
        chronicle_match_id: null,
      }),
    ).toMatchObject({ hasReplay: false })
    expect(
      mapMatchSetMatchSummaryRow({
        match_id: "match:failed",
        status: "failed_system",
        bottom_player_id: "player:bottom",
        top_player_id: "player:top",
        outcome: null,
        winner_player_id: null,
        chronicle_match_id: "match:failed",
      }),
    ).toEqual({
      matchId: "match:failed",
      status: "failed_system",
      bottomPlayerId: "player:bottom",
      topPlayerId: "player:top",
      hasReplay: false,
    })
  })

  it("only allows valid local Workshop revisions into Workshop tests", () => {
    const localRevision = buildWorkshopRevision({
      source: workshopTemplateSource,
    })

    expect(
      assertWorkshopRevisionCanBeTested(localRevision, localRevision.id),
    ).toBe(localRevision)
    expect(() =>
      assertWorkshopRevisionCanBeTested(null, "strategy-revision:missing"),
    ).toThrow("Workshop revision not found")
    expect(() =>
      assertWorkshopRevisionCanBeTested(
        { ...localRevision, strategyId: "strategy:opponent" },
        localRevision.id,
      ),
    ).toThrow("local Workshop revision")
    expect(() =>
      assertWorkshopRevisionCanBeTested(
        {
          ...localRevision,
          strategyId: WORKSHOP_STRATEGY_ID,
          validation: { ...localRevision.validation, valid: false },
        },
        localRevision.id,
      ),
    ).toThrow("valid Strategy revision")
  })

  it("does not expose non-Workshop MatchSets through Workshop status lookup", async () => {
    const pool = {
      query: async () => {
        throw new Error("non-Workshop MatchSet should not be queried")
      },
    } as never

    await expect(
      getWorkshopTestSummary(pool, "match-set:ranked:secret"),
    ).resolves.toBeNull()
  })
})
