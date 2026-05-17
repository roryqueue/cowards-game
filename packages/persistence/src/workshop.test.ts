import { describe, expect, it } from "vitest"
import { validateStrategySource } from "@cowards/runtime-js"
import {
  assertWorkshopRevisionCanBeTested,
  buildWorkshopRevision,
  GET_WORKSHOP_REVISION_SOURCE_SQL,
  LIST_WORKSHOP_REVISIONS_SQL,
  listWorkshopOpponents,
  listWorkshopPresets,
  listWorkshopTemplates,
  WORKSHOP_STRATEGY_ID,
  WORKSHOP_MATCH_SET_PREFIX,
  WORKSHOP_OPPONENTS,
  workshopTemplateSource,
} from "./workshop.js"
import { MATCH_SET_STATUSES } from "./schema.js"

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
})
