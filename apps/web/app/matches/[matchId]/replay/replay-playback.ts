export const basePlaybackIntervalMs = 700

export const replaySpeedOptions = [
  { value: "0.5", label: "0.5x", intervalMs: basePlaybackIntervalMs * 2 },
  { value: "1", label: "1x", intervalMs: basePlaybackIntervalMs },
  { value: "2", label: "2x", intervalMs: basePlaybackIntervalMs / 2 },
  { value: "4", label: "4x", intervalMs: basePlaybackIntervalMs / 4 },
  {
    value: "8",
    label: "8x",
    intervalMs: Math.round(basePlaybackIntervalMs / 8),
  },
] as const

export type ReplaySpeedValue = (typeof replaySpeedOptions)[number]["value"]

export const defaultReplaySpeed: ReplaySpeedValue = "2"

export const getPlaybackIntervalMs = (speed: ReplaySpeedValue): number =>
  replaySpeedOptions.find((option) => option.value === speed)?.intervalMs ??
  basePlaybackIntervalMs
