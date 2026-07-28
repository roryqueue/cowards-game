import { describe, expect, it } from "vitest"
import { COMPETITION_FAIR_PLAY_POLICY } from "@cowards/spec"

describe("fair-play policy", () => {
  it("states current behavior and explicit limits", () => {
    const copy = JSON.stringify(COMPETITION_FAIR_PLAY_POLICY)
    expect(copy).toContain("Signed-in Players can report")
    expect(copy).toContain("do not guarantee automatic action")
    expect(copy).toContain("response deadline")
  })
})
