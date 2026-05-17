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
        { PLAYWRIGHT_TEST: "1" },
      ),
    ).toEqual({
      mode: "owner",
      allowOwnerDebug: true,
      ownerPlayerId: "player:bottom",
    })
  })

  it("requires an explicit owner player id", () => {
    expect(
      resolveOwnerDebugReplayOptions(
        { ownerDebug: "1" },
        { PLAYWRIGHT_TEST: "1" },
      ),
    ).toBeUndefined()
  })
})
