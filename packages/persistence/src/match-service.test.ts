import { describe, expect, it } from "vitest"
import {
  REVISION_CONTENT_COLUMNS,
  assertCanUpdateStrategyRevisionContent,
} from "./repositories.js"
import {
  createMatchJobId,
  validateCreateMatchInput,
  type CreateMatchInput,
} from "./match-service.js"
import { DEFAULT_MAX_JOB_ATTEMPTS } from "./schema.js"

const matchInput: CreateMatchInput = {
  id: "match:test:001",
  bottomStrategyRevisionId: "strategy-revision:bottom",
  topStrategyRevisionId: "strategy-revision:top",
  arenaVariantId: "arena:smoke:v1",
  seed: "seed:test:001",
  bottomPlayerId: "player:bottom",
  topPlayerId: "player:top",
}

describe("match creation contracts", () => {
  it("requires seed and explicit locked side assignment inputs", () => {
    expect(() => validateCreateMatchInput(matchInput)).not.toThrow()
    expect(() =>
      validateCreateMatchInput({ ...matchInput, seed: "" }),
    ).toThrow("Match seed is required")
    expect(matchInput.bottomStrategyRevisionId).toBe(
      "strategy-revision:bottom",
    )
    expect(matchInput.topStrategyRevisionId).toBe("strategy-revision:top")
    expect(matchInput.bottomPlayerId).toBe("player:bottom")
    expect(matchInput.topPlayerId).toBe("player:top")
  })

  it("uses the fixed Phase 5 retry count for queued jobs", () => {
    expect(DEFAULT_MAX_JOB_ATTEMPTS).toBe(3)
    expect(createMatchJobId("match:test:001")).toBe(
      "match-job:match:test:001",
    )
  })

  it("blocks locked_at StrategyRevision content mutations", () => {
    expect(REVISION_CONTENT_COLUMNS).toContain("source")
    expect(() =>
      assertCanUpdateStrategyRevisionContent({
        lockedAt: new Date(),
        changedColumns: ["metadata"],
      }),
    ).not.toThrow()
    expect(() =>
      assertCanUpdateStrategyRevisionContent({
        lockedAt: new Date(),
        changedColumns: ["source"],
      }),
    ).toThrow("Cannot update locked StrategyRevision content column: source")
  })
})
