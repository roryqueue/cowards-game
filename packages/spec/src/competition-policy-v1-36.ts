import { assertPublicOutputLeakSafe } from "./public-output-privacy.js"

export const COMPETITION_POLICY_V1_36_ID = "competition-policy-v1.36" as const

export const COMPETITION_POLICY_V1_36_POSTURE = {
  publicLabel: "public beta trial competition",
  standingsScope: "resettable Season-scoped standings",
  durableRatingPromise: "no durable permanent rating promise",
  completedSeasonLabel:
    "completed Seasons remain resettable public beta trial competition evidence, not durable rating truth",
  archivedSeasonLabel:
    "archived Seasons remain resettable public beta trial competition evidence, not durable rating truth",
} as const

export const COMPETITION_POLICY_V1_36_TRUST_SURFACES = [
  "competition-index",
  "competition-detail",
  "entry",
  "season",
  "standings",
  "result",
  "replay",
  "player",
  "strategy",
  "governance",
  "docs",
  "fixtures",
  "snapshots",
  "proof-artifacts",
  "monitors",
] as const

export type CompetitionPolicyV136TrustSurface =
  (typeof COMPETITION_POLICY_V1_36_TRUST_SURFACES)[number]

export type CompetitionPolicyV136CountedStatePublicProjection =
  | "pending"
  | "counted"
  | "retrying"
  | "degraded_system_failure"
  | "non_counted"
  | "non_competitive"
  | "under_review"
  | "disputed"
  | "invalid"
  | "invalidated"

export const COMPETITION_POLICY_V1_36_COUNTED_STATE_SCOPE =
  "Phase 249 locks public projection vocabulary only; Phase 252 owns final persistence enum mappings." as const

export const COMPETITION_POLICY_V1_36_COUNTED_STATE_PUBLIC_PROJECTIONS = [
  {
    state: "pending",
    publicLabel: "Pending",
    publicMeaning: "MatchSet has not reached a counted result yet.",
    standingEffect: "No standings effect until counted evidence exists.",
  },
  {
    state: "counted",
    publicLabel: "Counted",
    publicMeaning: "Complete public evidence is eligible for trial standings.",
    standingEffect: "Included in resettable Season-scoped standings.",
  },
  {
    state: "retrying",
    publicLabel: "Retrying",
    publicMeaning: "System retry is still attempting to produce public evidence.",
    standingEffect: "No standings effect while retrying.",
  },
  {
    state: "degraded_system_failure",
    publicLabel: "Degraded system failure",
    publicMeaning:
      "A system-side failure prevented normal counted evidence from completing.",
    standingEffect: "Excluded unless a later governance phase resolves it.",
  },
  {
    state: "non_counted",
    publicLabel: "Non-counted",
    publicMeaning: "The MatchSet is public evidence but not standings evidence.",
    standingEffect: "Excluded from counted standings.",
  },
  {
    state: "non_competitive",
    publicLabel: "Non-competitive",
    publicMeaning: "The MatchSet is exhibition, study, or otherwise non-trial.",
    standingEffect: "Excluded from counted standings.",
  },
  {
    state: "under_review",
    publicLabel: "Under review",
    publicMeaning: "A governance review is pending.",
    standingEffect: "Held out of standings until resolved.",
  },
  {
    state: "disputed",
    publicLabel: "Disputed",
    publicMeaning: "A result dispute exists and is represented only coarsely.",
    standingEffect: "Held or excluded according to public governance status.",
  },
  {
    state: "invalid",
    publicLabel: "Invalid",
    publicMeaning: "The result is not valid counted competition evidence.",
    standingEffect: "Excluded from counted standings.",
  },
  {
    state: "invalidated",
    publicLabel: "Invalidated",
    publicMeaning: "A previously available result is no longer counted.",
    standingEffect: "Excluded from counted standings and recompute inputs.",
  },
] as const satisfies readonly {
  state: CompetitionPolicyV136CountedStatePublicProjection
  publicLabel: string
  publicMeaning: string
  standingEffect: string
}[]

export const COMPETITION_POLICY_V1_36_PRIVACY_EXCLUSIONS = [
  "Strategy source",
  "artifact bytes",
  "raw diagnostics",
  "host paths",
  "env values",
  "package paths",
  "tokens",
  "DB details",
  "private runtime internals",
  "StrategyMemory",
  "SoldierMemory",
  "objective payloads",
  "dispute internals",
  "account-recovery payloads",
  "operator-only governance details",
] as const

export type CompetitionPolicyV136ForbiddenClaimCategory =
  | "durable-rating"
  | "production-sandbox"
  | "package-ecosystem"
  | "tinygo-production"
  | "raw-diagnostic"
  | "private-runtime"
  | "mature-staffed-moderation"
  | "rating-refund"
  | "all-time-ranking"

export const COMPETITION_POLICY_V1_36_FORBIDDEN_CLAIMS = [
  {
    category: "durable-rating",
    examples: [
      "Coward's Game has durable permanent ratings",
      "trial ladder points are permanent player ratings",
    ],
  },
  {
    category: "production-sandbox",
    examples: [
      "the Strategy sandbox is production certified",
      "all runtime lanes provide production sandbox certification",
    ],
  },
  {
    category: "package-ecosystem",
    examples: [
      "Strategies can use the full npm ecosystem",
      "Python package installs are supported in counted play",
    ],
  },
  {
    category: "tinygo-production",
    examples: [
      "TinyGo is a production Strategy lane",
      "TinyGo entries are eligible for counted competition",
    ],
  },
  {
    category: "raw-diagnostic",
    examples: [
      "public results show raw runtime diagnostics",
      "players can inspect raw provider stderr in public replay",
    ],
  },
  {
    category: "private-runtime",
    examples: [
      "public pages expose private runtime internals",
      "runtime provider secrets are part of public evidence",
    ],
  },
  {
    category: "mature-staffed-moderation",
    examples: [
      "every dispute receives staffed moderation review",
      "appeals have guaranteed human moderator SLAs",
    ],
  },
  {
    category: "rating-refund",
    examples: [
      "invalidated Matches refund permanent rating",
      "governance can repair lost rating points",
    ],
  },
  {
    category: "all-time-ranking",
    examples: [
      "Coward's Game publishes all-time rankings",
      "archived Season rank is official lifetime rank",
    ],
  },
] as const satisfies readonly {
  category: CompetitionPolicyV136ForbiddenClaimCategory
  examples: readonly [string, string, ...string[]]
}[]

export const COMPETITION_POLICY_V1_36_AUTHORITY_OWNERS = {
  specContract:
    "@cowards/spec owns competition-policy-v1.36 vocabulary, schemas, posture labels, privacy exclusions, and forbidden claim taxonomy.",
  goBackendOrchestration:
    "Go/backend owns normal orchestration for competition operations; no Strategy execution moves into Go, web, or API.",
  runtimeServiceProviderBoundary:
    "runtime-service/providers own hostile Strategy validation/build/execution behind the provider boundary.",
  persistence:
    "persistence owns canonical stored evidence, immutable records, and later phase storage mappings.",
  webProjection:
    "web owns rendering public projections only; no game rules, scoring truth, entry truth, or Strategy execution.",
  staticMonitorProof:
    "scripts/monitors own static drift checks, copy checks, privacy scans, and proof artifact guardrails.",
} as const

export const COMPETITION_POLICY_V1_36_PUBLIC_PAYLOAD = {
  id: COMPETITION_POLICY_V1_36_ID,
  posture: COMPETITION_POLICY_V1_36_POSTURE,
  trustSurfaces: COMPETITION_POLICY_V1_36_TRUST_SURFACES,
  countedStateScope: COMPETITION_POLICY_V1_36_COUNTED_STATE_SCOPE,
  countedStatePublicProjections:
    COMPETITION_POLICY_V1_36_COUNTED_STATE_PUBLIC_PROJECTIONS,
  privacyExclusions: COMPETITION_POLICY_V1_36_PRIVACY_EXCLUSIONS,
  forbiddenClaims: COMPETITION_POLICY_V1_36_FORBIDDEN_CLAIMS,
  authorityOwners: COMPETITION_POLICY_V1_36_AUTHORITY_OWNERS,
} as const

const COMPETITION_POLICY_V1_36_FORBIDDEN_PUBLIC_KEYS = new Set([
  "rawDiagnostics",
  "rawDiagnostic",
  "artifactBytes",
  "envValues",
  "dbDetails",
  "databaseDetails",
  "disputeInternals",
  "accountRecoveryPayload",
  "accountRecoveryPayloads",
  "operatorOnlyGovernance",
  "operatorOnlyGovernanceDetails",
])

export const assertCompetitionPolicyV136PublicLeakSafe = (
  value: unknown = COMPETITION_POLICY_V1_36_PUBLIC_PAYLOAD,
): void => {
  assertPublicOutputLeakSafe(value, "competition-policy-v1.36 public payload")

  const visit = (node: unknown, path: string): void => {
    if (Array.isArray(node)) {
      node.forEach((item, index) => visit(item, `${path}[${index}]`))
      return
    }
    if (node === null || typeof node !== "object") {
      return
    }
    for (const [key, entryValue] of Object.entries(
      node as Record<string, unknown>,
    )) {
      if (COMPETITION_POLICY_V1_36_FORBIDDEN_PUBLIC_KEYS.has(key)) {
        throw new Error(
          `competition-policy-v1.36 public payload leaks private competition field: ${path}.${key}`,
        )
      }
      visit(entryValue, `${path}.${key}`)
    }
  }

  visit(value, "$")
}
