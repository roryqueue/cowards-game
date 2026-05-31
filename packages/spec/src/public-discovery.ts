import { z } from "zod"
import { assertPublicOutputLeakSafe } from "./public-output-privacy.js"

export const PUBLIC_DISCOVERY_API_VERSION = "public-discovery-v1"

export const PUBLIC_DISCOVERY_PRIVATE_FIELDS_EXCLUDED = [
  "Strategy source",
  "StrategyMemory",
  "SoldierMemory",
  "objective payloads",
  "raw diagnostics",
  "host paths",
  "env values",
  "tokens",
  "DB details",
  "package paths",
  "private runtime internals",
  "quarantine details",
  "operator action details",
  "recovery payloads",
] as const

const PublicDiscoveryBoundarySchema = z.object({
  apiVersion: z.literal(PUBLIC_DISCOVERY_API_VERSION),
  apiNamespace: z.literal("public-discovery"),
  executionContract: z.literal("not-match-execution-app-v1"),
  privateFieldsExcluded: z.array(z.string().min(1)),
})

export const isSafePublicDiscoveryHref = (href: string): boolean => {
  if (!href.startsWith("/") || href.startsWith("//")) {
    return false
  }
  if (/[\u0000-\u001f\\]/.test(href)) {
    return false
  }
  try {
    const url = new URL(href, "https://cowards-game.local")
    return url.origin === "https://cowards-game.local"
  } catch {
    return false
  }
}

const PublicDiscoveryHrefSchema = z
  .string()
  .min(1)
  .refine(isSafePublicDiscoveryHref, "href must be a safe relative public path")

const PublicDiscoveryLinkSchema = z.object({
  label: z.string().min(1),
  href: PublicDiscoveryHrefSchema,
})

export const PublicDiscoveryMatchSetCardSchema = z.object({
  matchSetId: z.string().min(1),
  title: z.string().min(1),
  status: z.enum([
    "accepted",
    "queued",
    "running",
    "complete",
    "degraded",
    "failed",
    "unavailable",
  ]),
  statusLabel: z.string().min(1),
  evidenceLabel: z.string().min(1),
  resultHref: PublicDiscoveryHrefSchema,
  replayHref: PublicDiscoveryHrefSchema.optional(),
  replayReadyCount: z.number().int().nonnegative(),
  matchCount: z.number().int().nonnegative(),
  entrantLabels: z.array(z.string().min(1)),
  origin: z.enum(["configured-public-read", "fixture-public-read"]),
  presetId: z.string().min(1).optional(),
})

export const PublicDiscoveryCompetitionCardSchema = z.object({
  competitionId: z.string().min(1),
  title: z.string().min(1),
  kind: z.enum(["exhibition", "ladder", "tournament"]),
  status: z.enum([
    "open",
    "queued",
    "running",
    "active",
    "complete",
    "degraded",
    "unavailable",
  ]),
  statusLabel: z.string().min(1),
  href: PublicDiscoveryHrefSchema,
  enterHref: PublicDiscoveryHrefSchema.optional(),
  description: z.string().min(1).optional(),
  entrantCount: z.number().int().nonnegative().optional(),
  matchSetCount: z.number().int().nonnegative().optional(),
  origin: z.enum(["configured-public-read", "competition-preset"]),
})

export const PublicDiscoveryPlayerCardSchema = z.object({
  handle: z.string().min(1),
  displayName: z.string().min(1),
  href: PublicDiscoveryHrefSchema,
  evidenceCount: z.number().int().nonnegative(),
})

export const PublicDiscoveryStrategyCardSchema = z.object({
  strategyId: z.string().min(1),
  title: z.string().min(1),
  authorHandle: z.string().min(1),
  href: PublicDiscoveryHrefSchema,
  evidenceCount: z.number().int().nonnegative(),
})

export const PublicHomeDiscoveryDtoSchema = z.object({
  kind: z.literal("publicHomeDiscovery"),
  boundary: PublicDiscoveryBoundarySchema,
  competitions: z.array(PublicDiscoveryCompetitionCardSchema),
  latestEvidence: z.array(PublicDiscoveryMatchSetCardSchema),
  players: z.array(PublicDiscoveryPlayerCardSchema),
  strategies: z.array(PublicDiscoveryStrategyCardSchema),
  learnLinks: z.array(PublicDiscoveryLinkSchema),
  emptyStates: z.array(z.string().min(1)),
})

export const PublicWatchIndexDtoSchema = z.object({
  kind: z.literal("publicWatchIndex"),
  boundary: PublicDiscoveryBoundarySchema,
  replayReady: z.array(PublicDiscoveryMatchSetCardSchema),
  active: z.array(PublicDiscoveryMatchSetCardSchema),
  degraded: z.array(PublicDiscoveryMatchSetCardSchema),
  emptyStates: z.array(z.string().min(1)),
})

export const PublicCompetitionIndexDtoSchema = z.object({
  kind: z.literal("publicCompetitionIndex"),
  boundary: PublicDiscoveryBoundarySchema,
  activeCompetitions: z.array(PublicDiscoveryCompetitionCardSchema),
  entryOpportunities: z.array(PublicDiscoveryCompetitionCardSchema),
  completedCompetitions: z.array(PublicDiscoveryCompetitionCardSchema),
  emptyStates: z.array(z.string().min(1)),
})

export const PublicCompetitionDetailDtoSchema = z.object({
  kind: z.literal("publicCompetitionDetail"),
  boundary: PublicDiscoveryBoundarySchema,
  competition: PublicDiscoveryCompetitionCardSchema,
  entrants: z.array(
    z.object({
      entrantId: z.string().min(1),
      label: z.string().min(1),
      ownerHandle: z.string().min(1),
      playerHref: PublicDiscoveryHrefSchema,
      strategyRevisionId: z.string().min(1),
      statusLabel: z.string().min(1),
    }),
  ),
  standings: z.array(
    z.object({
      rank: z.number().int().positive(),
      label: z.string().min(1),
      points: z.number().int(),
      record: z.string().min(1),
    }),
  ),
  matchSets: z.array(PublicDiscoveryMatchSetCardSchema),
  replayCoverage: z.object({
    replayReadyCount: z.number().int().nonnegative(),
    matchCount: z.number().int().nonnegative(),
    label: z.string().min(1),
  }),
  scheduleLabel: z.string().min(1),
})

export const SignedInCompetitionEntryDashboardDtoSchema = z.object({
  kind: z.literal("signedInCompetitionEntryDashboard"),
  boundary: PublicDiscoveryBoundarySchema,
  competition: PublicDiscoveryCompetitionCardSchema,
  signedIn: z.boolean(),
  accountUnavailable: z.boolean(),
  revisionsUnavailable: z.boolean(),
  user: z
    .object({
      handle: z.string().min(1),
      displayName: z.string().min(1),
      accountHref: PublicDiscoveryHrefSchema,
    })
    .nullable(),
  eligibleRevisions: z.array(
    z.object({
      strategyRevisionId: z.string().min(1),
      strategyId: z.string().min(1),
      label: z.string().min(1),
      publicStrategyHref: PublicDiscoveryHrefSchema,
      sourceHash: z.string().min(1),
      sourceBytes: z.number().int().nonnegative(),
      runtimeLabel: z.string().min(1),
      languageId: z.string().min(1),
      languageLabel: z.string().min(1),
      countedPlayLabel: z.string().min(1),
      countedPlayEligible: z.boolean(),
      countedPlayReason: z.string().min(1).nullable(),
      createdAt: z.string().min(1),
    }),
  ),
  ineligibleRevisions: z.array(
    z.object({
      strategyRevisionId: z.string().min(1),
      label: z.string().min(1),
      runtimeLabel: z.string().min(1),
      reason: z.string().min(1),
    }),
  ),
  entryMode: z.enum(["exhibition-preset", "unavailable"]),
  entryHref: PublicDiscoveryHrefSchema.optional(),
})

export type PublicDiscoveryBoundary = z.infer<
  typeof PublicDiscoveryBoundarySchema
>
export type PublicDiscoveryLink = z.infer<typeof PublicDiscoveryLinkSchema>
export type PublicDiscoveryMatchSetCard = z.infer<
  typeof PublicDiscoveryMatchSetCardSchema
>
export type PublicDiscoveryCompetitionCard = z.infer<
  typeof PublicDiscoveryCompetitionCardSchema
>
export type PublicDiscoveryPlayerCard = z.infer<
  typeof PublicDiscoveryPlayerCardSchema
>
export type PublicDiscoveryStrategyCard = z.infer<
  typeof PublicDiscoveryStrategyCardSchema
>
export type PublicHomeDiscoveryDto = z.infer<
  typeof PublicHomeDiscoveryDtoSchema
>
export type PublicWatchIndexDto = z.infer<typeof PublicWatchIndexDtoSchema>
export type PublicCompetitionIndexDto = z.infer<
  typeof PublicCompetitionIndexDtoSchema
>
export type PublicCompetitionDetailDto = z.infer<
  typeof PublicCompetitionDetailDtoSchema
>
export type SignedInCompetitionEntryDashboardDto = z.infer<
  typeof SignedInCompetitionEntryDashboardDtoSchema
>

export const publicDiscoveryBoundary = (): PublicDiscoveryBoundary => ({
  apiVersion: PUBLIC_DISCOVERY_API_VERSION,
  apiNamespace: "public-discovery",
  executionContract: "not-match-execution-app-v1",
  privateFieldsExcluded: [...PUBLIC_DISCOVERY_PRIVATE_FIELDS_EXCLUDED],
})

export const assertPublicDiscoveryDtoLeakSafe = (value: unknown): void =>
  assertPublicOutputLeakSafe(value, "Public discovery DTO")
