import { describe, expect, it } from "vitest"
import {
  basePlaybackIntervalMs,
  defaultReplaySpeed,
  getPlaybackIntervalMs,
  replaySpeedOptions,
} from "./replay-playback.js"

describe("replay playback speeds", () => {
  it("offers five speed options and defaults to twice the previous pace", () => {
    expect(replaySpeedOptions.map((option) => option.label)).toEqual([
      "0.5x",
      "1x",
      "2x",
      "4x",
      "8x",
    ])
    expect(defaultReplaySpeed).toBe("2")
    expect(getPlaybackIntervalMs(defaultReplaySpeed)).toBe(
      basePlaybackIntervalMs / 2,
    )
  })

  it("maps each replay speed to the expected event interval", () => {
    expect(getPlaybackIntervalMs("0.5")).toBe(1400)
    expect(getPlaybackIntervalMs("1")).toBe(700)
    expect(getPlaybackIntervalMs("2")).toBe(350)
    expect(getPlaybackIntervalMs("4")).toBe(175)
    expect(getPlaybackIntervalMs("8")).toBe(88)
  })
})
