import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const source = readFileSync(new URL("./replay-client.tsx", import.meta.url), {
  encoding: "utf8",
})

describe("ReplayClient", () => {
  it("renders the Match start replay shell and playback controls", () => {
    expect(source).toContain("Coward&apos;s Game")
    expect(source).toContain("<h1>Replay</h1>")
    expect(source).toContain("Public view")
    expect(source).toContain('type="range"')
    expect(source).toContain("Step back")
    expect(source).toContain("Play replay")
    expect(source).toContain("Pause replay")
    expect(source).toContain("Step forward")
  })

  it("shows owner debug only when owner projection data exists", () => {
    expect(source).toContain(
      "const ownerDebugAvailable = canShowOwnerDebug(data)",
    )
    expect(source).toContain("ownerDebugAvailable ?")
    expect(source).toContain("Owner debug")
    expect(source).toContain("data.projection.ownerPrivate")
  })
})
