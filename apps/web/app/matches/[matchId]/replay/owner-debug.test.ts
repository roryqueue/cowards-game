import { describe, expect, it } from "vitest"
import {
  isOwnerDebugReplayEnabled,
  resolveOwnerDebugReplayOptions,
} from "./owner-debug.js"

describe("owner debug replay route options", () => {
  it("keeps public replay as the default", () => {
    expect(isOwnerDebugReplayEnabled({})).toBe(false)
    expect(
      resolveOwnerDebugReplayOptions(
        { ownerDebug: "1", ownerPlayerId: "player:bottom" },
        {},
      ),
    ).toBeUndefined()
  })

  it("resolves owner replay only from a gated test or debug environment", () => {
    expect(
      resolveOwnerDebugReplayOptions(
        { ownerDebug: "1", ownerPlayerId: "player:bottom" },
        {
          PLAYWRIGHT_TEST: "1",
          COWARDS_OWNER_DEBUG_REQUESTER_PLAYER_ID: "player:bottom",
        },
      ),
    ).toEqual({
      allowOwnerDebug: true,
      requestedOwnerPlayerId: "player:bottom",
      currentRequesterPlayerId: "player:bottom",
    })
  })

  it("requires a trusted server-side requester identity", () => {
    expect(
      resolveOwnerDebugReplayOptions(
        { ownerDebug: "1", ownerPlayerId: "player:bottom" },
        { PLAYWRIGHT_TEST: "1" },
      ),
    ).toBeUndefined()
    expect(
      resolveOwnerDebugReplayOptions(
        { ownerDebug: "1", ownerPlayerId: "player:bottom" },
        {
          PLAYWRIGHT_TEST: "1",
          COWARDS_OWNER_DEBUG_REQUESTER_PLAYER_ID: "player:intruder",
        },
      ),
    ).toBeUndefined()
  })

  it("requires an explicit owner player id", () => {
    expect(
      resolveOwnerDebugReplayOptions(
        { ownerDebug: "1" },
        { PLAYWRIGHT_TEST: "1" },
      ),
    ).toBeUndefined()
    expect(
      resolveOwnerDebugReplayOptions(
        { ownerDebug: "1", ownerPlayerId: "" },
        { PLAYWRIGHT_TEST: "1" },
      ),
    ).toBeUndefined()
  })

  it("keeps owner debug opt-in even in gated environments", () => {
    expect(
      resolveOwnerDebugReplayOptions(
        { ownerPlayerId: "player:bottom" },
        { PLAYWRIGHT_TEST: "1" },
      ),
    ).toBeUndefined()
    expect(
      resolveOwnerDebugReplayOptions(
        { ownerDebug: "0", ownerPlayerId: "player:bottom" },
        { PLAYWRIGHT_TEST: "1" },
      ),
    ).toBeUndefined()
  })
})
