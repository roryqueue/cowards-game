import { readFileSync } from "node:fs"
import { buildSoldierInactivityExplanations } from "@cowards/replay"
import { getCanonicalReplayScenario } from "@cowards/test-utils"
import { describe, expect, it } from "vitest"
import { createReplayFixtureData } from "../../replay-fixture.js"

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
    expect(source).toContain('aria-label="Replay speed"')
    expect(source).toContain('useState<ReplaySpeedValue>("2")')
    expect(source).toContain("basePlaybackIntervalMs / 2")
    expect(source).toContain("<ReplayBoard")
  })

  it("offers five playback speeds with 2x as the default", () => {
    expect(source).toContain('label: "0.5x"')
    expect(source).toContain('label: "1x"')
    expect(source).toContain('label: "2x"')
    expect(source).toContain('label: "4x"')
    expect(source).toContain('label: "8x"')
    expect(source).toContain("playbackIntervalMs")
  })

  it("keeps the scrubber wired as the primary timeline control", () => {
    expect(source).toContain('aria-label="Replay timeline"')
    expect(source).toContain(
      "setSelectedIndex(Number(event.currentTarget.value))",
    )
    expect(source).toContain("getTimelineEntryAt(data, selectedIndex)")
  })

  it("shows owner debug only when owner projection data exists", () => {
    expect(source).toContain(
      "const ownerDebugAvailable = canShowOwnerDebug(data)",
    )
    expect(source).toContain("ownerDebugAvailable ?")
    expect(source).toContain("Owner debug")
    expect(source).toContain("Awareness Grid")
    expect(source).toContain("getOwnerAwarenessGridInspection")
    expect(source).toContain("data.projection.ownerPrivate")
  })

  it("omits owner Soldier inactivity explanations from public replay DTOs", () => {
    const data = createReplayFixtureData({ scenarioId: "runtime-failure" })

    expect(data.status).toBe("ready")
    if (data.status !== "ready") {
      return
    }
    expect(data.mode).toBe("public")
    expect(data).not.toHaveProperty("ownerDebug")
  })

  it("adds owner Soldier inactivity explanation DTOs only when owner debug is allowed", () => {
    const requestedOwner = createReplayFixtureData({
      scenarioId: "runtime-failure",
      mode: "owner",
      ownerPlayerId: "bottom",
    })
    const owner = createReplayFixtureData({
      scenarioId: "runtime-failure",
      mode: "owner",
      ownerPlayerId: "bottom",
      allowOwnerDebug: true,
    })

    expect(requestedOwner.status).toBe("ready")
    expect(requestedOwner).not.toHaveProperty("ownerDebug")
    expect(owner.status).toBe("ready")
    if (owner.status !== "ready") {
      return
    }
    expect(
      owner.ownerDebug?.soldierInactivityExplanations.length,
    ).toBeGreaterThan(0)
  })

  it("builds owner Soldier inactivity explanations from the same Chronicle helper", () => {
    const scenario = getCanonicalReplayScenario("runtime-failure")
    const owner = createReplayFixtureData({
      scenarioId: "runtime-failure",
      mode: "owner",
      ownerPlayerId: "bottom",
      allowOwnerDebug: true,
    })

    expect(owner.status).toBe("ready")
    if (owner.status !== "ready") {
      return
    }
    expect(owner.ownerDebug?.soldierInactivityExplanations).toEqual(
      buildSoldierInactivityExplanations({
        chronicle: scenario.chronicle,
        ownerPlayerId: "bottom",
      }),
    )
  })

  it("keeps owner explanations hidden until the owner debug checkbox is enabled", () => {
    const owner = createReplayFixtureData({
      scenarioId: "runtime-failure",
      mode: "owner",
      ownerPlayerId: "bottom",
      allowOwnerDebug: true,
    })

    expect(owner.status).toBe("ready")
    if (owner.status !== "ready") {
      return
    }
    expect(source).toContain("useState(false)")
    expect(source).toContain("ownerDebugVisible ?")
    expect(source).toContain('data-testid="replay-owner-debug-toggle"')
  })

  it("renders selected-Soldier explanation fields from replay-state helpers", () => {
    expect(source).toContain("getSoldierInactivityExplanation")
    expect(source).toContain("Why this Soldier did nothing")
    expect(source).toContain("soldierInactivityExplanation.label")
    expect(source).toContain("soldierInactivityExplanation.remediation")
    expect(source).toContain(
      'data-testid="replay-soldier-inactivity-explanation"',
    )
  })
})
