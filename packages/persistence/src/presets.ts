import type { ArenaVariantId } from "@cowards/spec"

export type MatchSetPresetId = "smoke-v1" | "standard-v1" | "stress-v1"

export interface MatchSetPreset {
  id: MatchSetPresetId
  version: "v1"
  arenaVariantIds: ArenaVariantId[]
  seeds: string[]
  mirrorSides: boolean
}

export const MATCH_SET_PRESETS = [
  {
    id: "smoke-v1",
    version: "v1",
    arenaVariantIds: ["arena:smoke:v1"],
    seeds: ["seed:smoke:001"],
    mirrorSides: false,
  },
  {
    id: "standard-v1",
    version: "v1",
    arenaVariantIds: ["arena:smoke:v1", "arena:standard-cross:v1"],
    seeds: ["seed:standard:001", "seed:standard:002"],
    mirrorSides: true,
  },
  {
    id: "stress-v1",
    version: "v1",
    arenaVariantIds: [
      "arena:smoke:v1",
      "arena:standard-cross:v1",
      "arena:open-field:v1",
    ],
    seeds: [
      "seed:stress:001",
      "seed:stress:002",
      "seed:stress:003",
      "seed:stress:004",
    ],
    mirrorSides: true,
  },
] as const satisfies readonly MatchSetPreset[]

export const getMatchSetPreset = (id: MatchSetPresetId): MatchSetPreset => {
  const preset = MATCH_SET_PRESETS.find((candidate) => candidate.id === id)
  if (!preset) {
    throw new Error(`Unknown MatchSet preset: ${id}`)
  }
  return {
    id: preset.id,
    version: preset.version,
    arenaVariantIds: [...preset.arenaVariantIds],
    seeds: [...preset.seeds],
    mirrorSides: preset.mirrorSides,
  }
}
