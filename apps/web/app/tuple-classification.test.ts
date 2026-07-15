import {
  CANDIDATE_RUNTIME_V117_SEMANTIC_TUPLE_ID,
  CURRENT_CANONICAL_COMPATIBILITY_TUPLE_ID,
} from "@cowards/spec"
import { describe, expect, it } from "vitest"
import { resolveMatchIntelligenceEventContract } from "./match-intelligence.js"
import { resolveReplayBoardEventContract } from "./matches/[matchId]/replay/replay-board-model.js"
import { resolveReplayReadyEventContract } from "./matches/replay-ready.js"

describe("web replay semantic tuple classification", () => {
  it("follows the spec-owned current alias while retaining exact history", () => {
    const successorDisposition =
      CANDIDATE_RUNTIME_V117_SEMANTIC_TUPLE_ID ===
      CURRENT_CANONICAL_COMPATIBILITY_TUPLE_ID
        ? "current-exact"
        : "historical-or-unknown"
    for (const resolve of [
      resolveMatchIntelligenceEventContract,
      resolveReplayReadyEventContract,
      resolveReplayBoardEventContract,
    ]) {
      expect(
        resolve(CURRENT_CANONICAL_COMPATIBILITY_TUPLE_ID, "MATCH_STARTED"),
      ).toBe("current-exact")
      expect(
        resolve(CANDIDATE_RUNTIME_V117_SEMANTIC_TUPLE_ID, "MATCH_STARTED"),
      ).toBe(successorDisposition)
      expect(
        resolve(CURRENT_CANONICAL_COMPATIBILITY_TUPLE_ID, "NOT_CANONICAL"),
      ).toBe("historical-or-unknown")
    }
  })
})
