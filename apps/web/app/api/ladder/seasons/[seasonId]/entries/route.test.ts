import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  getCountedEntryEligibilityPublicCopy,
  type CountedEntryEligibilityCategory,
  type UserId,
} from "@cowards/spec"
import { CompetitiveInputError } from "../../../../../../lib/competitive-errors.js"
import { competitiveErrorResponse } from "../../../../../competitive/http.js"

const mocks = vi.hoisted(() => ({
  enterTrialLadderSeason: vi.fn(),
  getCurrentCompetitiveUser: vi.fn(),
}))

vi.mock("../../../../../competitive/server.js", async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import("../../../../../competitive/server.js")
    >()
  return {
    ...actual,
    competitiveServer: {
      ...actual.competitiveServer,
      enterTrialLadderSeason: mocks.enterTrialLadderSeason,
    },
    getCurrentCompetitiveUser: mocks.getCurrentCompetitiveUser,
  }
})

import { POST } from "./route.js"

const USER = {
  id: "user:route-test" as UserId,
  username: "route-test",
  handle: "route-test",
  displayName: "Route Test",
  createdAt: "2026-07-11T00:00:00.000Z",
}

const request = (body: unknown): Request =>
  new Request("http://test.local/api/ladder/seasons/season:test/entries", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  })

const params = { seasonId: "season:test" }

const publicEligibilityError = (
  category: CountedEntryEligibilityCategory,
  status: number,
): CompetitiveInputError => {
  const eligibility = getCountedEntryEligibilityPublicCopy(category)
  return new CompetitiveInputError(eligibility.publicMessage, {
    status,
    eligibility,
  })
}

describe("POST /api/ladder/seasons/:seasonId/entries", () => {
  beforeEach(() => {
    mocks.enterTrialLadderSeason.mockReset()
    mocks.getCurrentCompetitiveUser.mockReset()
  })

  it("requires a signed-in Player", async () => {
    mocks.getCurrentCompetitiveUser.mockResolvedValue(null)

    const response = await POST(
      request({ revisionId: "strategy-revision:test" }),
      { params },
    )

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({
      error: "Sign in is required.",
    })
    expect(mocks.enterTrialLadderSeason).not.toHaveBeenCalled()
  })

  it("delegates mutation and returns the created entry id", async () => {
    mocks.getCurrentCompetitiveUser.mockResolvedValue(USER)
    mocks.enterTrialLadderSeason.mockResolvedValue({
      entryId: "trial-entry:test",
    })

    const response = await POST(
      request({ revisionId: "strategy-revision:test" }),
      { params },
    )

    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toEqual({
      entryId: "trial-entry:test",
    })
    expect(mocks.enterTrialLadderSeason).toHaveBeenCalledWith(USER, {
      seasonId: "season:test",
      revisionId: "strategy-revision:test",
    })
  })

  it("returns a category-shaped provider eligibility rejection", async () => {
    mocks.getCurrentCompetitiveUser.mockResolvedValue(USER)
    mocks.enterTrialLadderSeason.mockRejectedValue(
      publicEligibilityError("provider_proof_stale", 422),
    )

    const response = await POST(
      request({ revisionId: "strategy-revision:test" }),
      { params },
    )

    expect(response.status).toBe(422)
    await expect(response.json()).resolves.toEqual({
      ok: false,
      eligibility: getCountedEntryEligibilityPublicCopy(
        "provider_proof_stale",
      ),
    })
  })

  it("returns a public owner mismatch without revision ownership details", async () => {
    mocks.getCurrentCompetitiveUser.mockResolvedValue(USER)
    mocks.enterTrialLadderSeason.mockRejectedValue(
      publicEligibilityError("owner_mismatch", 403),
    )

    const response = await POST(
      request({ revisionId: "strategy-revision:another-player" }),
      { params },
    )

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({
      ok: false,
      eligibility: getCountedEntryEligibilityPublicCopy("owner_mismatch"),
    })
  })

  it.each(["already_entered_season", "replacement_blocked"] as const)(
    "returns a conflict for %s",
    async (category) => {
      mocks.getCurrentCompetitiveUser.mockResolvedValue(USER)
      mocks.enterTrialLadderSeason.mockRejectedValue(
        publicEligibilityError(category, 409),
      )

      const response = await POST(
        request({ revisionId: "strategy-revision:test" }),
        { params },
      )

      expect(response.status).toBe(409)
      await expect(response.json()).resolves.toEqual({
        ok: false,
        eligibility: getCountedEntryEligibilityPublicCopy(category),
      })
    },
  )
})

describe("counted entry error projection", () => {
  it("replaces low-level persistence details with canonical public copy", async () => {
    const privateDetails = [
      ["select * from strategy_revisions where source = '", "secret'"].join(
        "",
      ),
      ["trial_ladder_owner_", "unique_idx"].join(""),
      ["provider", "Proof=hmac-secret"].join(""),
      ["artifact", "Bytes=AGFzbQE="].join(""),
      ["strategy", "Source=export default {}"].join(""),
      ["/srv/", "private/runtime/provider.ts"].join(""),
      ["DATABASE_", "URL=postgres://secret"].join(""),
      ["ACCESS_", "TOKEN=secret"].join(""),
    ]
    const eligibility = getCountedEntryEligibilityPublicCopy(
      "provider_proof_mismatched",
    )
    const projectedError = new CompetitiveInputError(
      privateDetails.join(" | "),
      {
        status: 422,
        eligibility,
      },
    )
    const response = competitiveErrorResponse(projectedError)
    const body = await response.json()
    const serialized = JSON.stringify(body)

    expect(response.status).toBe(422)
    expect(body).toEqual({
      ok: false,
      eligibility,
    })
    for (const detail of privateDetails) {
      expect(serialized).not.toContain(detail)
    }
  })

  it("preserves ordinary competitive input responses", async () => {
    const response = competitiveErrorResponse(
      new CompetitiveInputError("Unknown exhibition preset."),
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: "Unknown exhibition preset.",
    })
  })
})
