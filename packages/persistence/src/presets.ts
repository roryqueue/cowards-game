import {
  ARENA_CATALOG_VERSION_V1_37,
  CANONICAL_ARENA_CATALOG_V1_37,
  CURRENT_SEMANTIC_AUTHORITY_KEY,
  SET_CONDITION_POLICY_VERSION_V1_37,
  type ArenaVariantId,
} from "@cowards/spec"
import {
  ACTIVE_V1_17_SEMANTIC_AUTHORITY_SELECTION,
  ACTIVE_V1_17_SEMANTIC_AUTHORITY_SELECTION_ROOT,
  REVIEWED_V1_19_SEMANTIC_AUTHORITY_SELECTION,
  REVIEWED_V1_19_SEMANTIC_AUTHORITY_SELECTION_ROOT,
  type CompleteSemanticAuthoritySelection,
} from "./semantic-authority-selection-head.js"

export type SchedulingSemanticAuthorityKey = "runtime-v1.17" | "runtime-v1.19"

export interface FrozenSchedulingSemanticAuthority {
  selection: Readonly<CompleteSemanticAuthoritySelection>
  selectionRoot: `sha256:${string}`
}

export const resolveSchedulingSemanticAuthority = (
  semanticAuthorityKey: SchedulingSemanticAuthorityKey,
): Readonly<FrozenSchedulingSemanticAuthority> =>
  semanticAuthorityKey === "runtime-v1.19"
    ? Object.freeze({
        selection: REVIEWED_V1_19_SEMANTIC_AUTHORITY_SELECTION,
        selectionRoot: REVIEWED_V1_19_SEMANTIC_AUTHORITY_SELECTION_ROOT,
      })
    : Object.freeze({
        selection: ACTIVE_V1_17_SEMANTIC_AUTHORITY_SELECTION,
        selectionRoot: ACTIVE_V1_17_SEMANTIC_AUTHORITY_SELECTION_ROOT,
      })

export const resolveFileCurrentSchedulingSemanticAuthority =
  (): Readonly<FrozenSchedulingSemanticAuthority> => {
    const key = String(CURRENT_SEMANTIC_AUTHORITY_KEY)
    if (key !== "runtime-v1.17" && key !== "runtime-v1.19") {
      throw new Error("File-current semantic authority is unknown.")
    }
    return resolveSchedulingSemanticAuthority(key)
  }

export type MatchSetPresetId = "smoke-v1" | "standard-v1" | "stress-v1"

export interface MatchSetPreset {
  id: MatchSetPresetId
  version: "v1"
  arenaVariantIds: ArenaVariantId[]
  seeds: string[]
  mirrorSides: boolean
}

export interface MatchSetPresetV119Candidate {
  semanticAuthorityKey: "runtime-v1.19"
  id: MatchSetPresetId
  arenaCatalogVersion: typeof ARENA_CATALOG_VERSION_V1_37
  setPolicyVersion: typeof SET_CONDITION_POLICY_VERSION_V1_37
  arenaVariantIds: ArenaVariantId[]
  baseSeeds: string[]
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

const cloneLegacyPreset = (id: MatchSetPresetId): MatchSetPreset => {
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

const schedulableCandidateArenaIds = new Set(
  CANONICAL_ARENA_CATALOG_V1_37.arenas
    .filter(({ status, schedulable }) => status === "active" && schedulable)
    .map(({ id }) => id),
)

export const MATCH_SET_PRESETS_V1_19_CANDIDATE = MATCH_SET_PRESETS.map(
  (preset): MatchSetPresetV119Candidate => ({
    semanticAuthorityKey: "runtime-v1.19",
    id: preset.id,
    arenaCatalogVersion: ARENA_CATALOG_VERSION_V1_37,
    setPolicyVersion: SET_CONDITION_POLICY_VERSION_V1_37,
    arenaVariantIds: preset.arenaVariantIds.filter((arenaVariantId) =>
      schedulableCandidateArenaIds.has(arenaVariantId),
    ),
    baseSeeds: [...preset.seeds],
  }),
)

export type VersionedMatchSetPreset =
  | MatchSetPreset
  | MatchSetPresetV119Candidate

export const resolveVersionedMatchSetPreset = (input: {
  semanticAuthorityKey: string
  presetId: MatchSetPresetId
}): VersionedMatchSetPreset | undefined => {
  if (String(input.semanticAuthorityKey) === "runtime-v1.17") {
    return cloneLegacyPreset(input.presetId)
  }
  if (String(input.semanticAuthorityKey) !== "runtime-v1.19") {
    return undefined
  }
  const preset = MATCH_SET_PRESETS_V1_19_CANDIDATE.find(
    ({ id }) => id === input.presetId,
  )
  return preset === undefined
    ? undefined
    : {
        semanticAuthorityKey: preset.semanticAuthorityKey,
        id: preset.id,
        arenaCatalogVersion: preset.arenaCatalogVersion,
        setPolicyVersion: preset.setPolicyVersion,
        arenaVariantIds: [...preset.arenaVariantIds],
        baseSeeds: [...preset.baseSeeds],
      }
}

export const getMatchSetPreset = (id: MatchSetPresetId): MatchSetPreset => {
  const preset = resolveVersionedMatchSetPreset({
    semanticAuthorityKey: CURRENT_SEMANTIC_AUTHORITY_KEY,
    presetId: id,
  })
  if (!preset || "semanticAuthorityKey" in preset) {
    throw new Error("Current MatchSet preset selector is not Phase-259 exact.")
  }
  return preset
}
