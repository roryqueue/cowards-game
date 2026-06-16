#!/usr/bin/env -S pnpm exec tsx
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import {
  assertCompetitionPolicyV136PublicLeakSafe,
  COMPETITION_POLICY_V1_36_AUTHORITY_OWNERS,
  COMPETITION_POLICY_V1_36_FORBIDDEN_CLAIMS,
  COMPETITION_POLICY_V1_36_ID,
  COMPETITION_POLICY_V1_36_POSTURE,
  COMPETITION_POLICY_V1_36_PRIVACY_EXCLUSIONS,
} from "../packages/spec/src/competition-policy-v1-36.js"

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
)

export const schemaVersion = "v1.36-competition-surface-inventory" as const
export const milestone = "v1.36" as const
export const sourcePolicy = COMPETITION_POLICY_V1_36_ID
export const generatedAt = "2026-06-15" as const
export const generatedBy =
  "scripts/evaluate-v1-36-competition-policy.ts" as const

export type V136CompetitionSurfaceGroup =
  | "routes"
  | "spec-dtos"
  | "persistence"
  | "go-backend"
  | "web-pages"
  | "ui-copy"
  | "docs"
  | "monitors"
  | "proof-scripts"
  | "proof-artifacts"
  | "tests"
  | "fixtures"
  | "snapshots"

export type V136CompetitionDisposition =
  | "lock-now"
  | "fix-in-250"
  | "fix-in-251"
  | "fix-in-252"
  | "fix-in-253"
  | "fix-in-254"
  | "prove-in-255"
  | "future/defer"

export type V136CompetitionDataClass =
  | "public"
  | "session"
  | "owner-private"
  | "internal-private"
  | "operator-private"
  | "artifact-private"

export type V136CompetitionRequirementId =
  | "POST-01"
  | "POST-02"
  | "POST-03"
  | "POST-04"
  | "POST-05"

export type V136CompetitionAuthorityOwner =
  keyof typeof COMPETITION_POLICY_V1_36_AUTHORITY_OWNERS

export interface V136CompetitionSurfaceRow {
  id: string
  surfaceGroup: V136CompetitionSurfaceGroup
  references: readonly string[]
  owner: string
  authorityOwner: V136CompetitionAuthorityOwner
  dataClass: V136CompetitionDataClass
  countedBehavior: string
  replayEvidenceRequirement: string
  privacyRisk: string
  postureLabelRequired: boolean
  requiredPostureCopy: string
  requiredResetNoDurableCopy: string
  affectedRequirements: readonly V136CompetitionRequirementId[]
  disposition: V136CompetitionDisposition
  notes: string
}

export interface V136CompetitionSourceCoverageAuditEntry {
  command: string
  result: string
  coveredSurfaceGroups: readonly {
    group: V136CompetitionSurfaceGroup
    status: "COVERED"
    rowIds: readonly string[]
  }[]
}

export interface V136CompetitionSurfaceInventory {
  schemaVersion: typeof schemaVersion
  milestone: typeof milestone
  sourcePolicy: typeof sourcePolicy
  generatedBy: typeof generatedBy
  generatedAt: typeof generatedAt
  artifactPaths: typeof artifactPaths
  requiredSurfaceGroups: readonly V136CompetitionSurfaceGroup[]
  allowedSurfaceGroups: readonly V136CompetitionSurfaceGroup[]
  allowedDispositions: readonly V136CompetitionDisposition[]
  allowedDataClasses: readonly V136CompetitionDataClass[]
  allowedRequirementIds: readonly V136CompetitionRequirementId[]
  requiredPostureCopy: typeof COMPETITION_POLICY_V1_36_POSTURE.publicLabel
  requiredResetNoDurableCopy: string
  forbiddenClaimCategories: readonly string[]
  forbiddenClaimExamples: readonly string[]
  privateMarkers: readonly string[]
  globalPolicies: {
    executiveSummary: string
    scope: readonly string[]
    nonGoals: readonly string[]
  }
  sourceCoverageAudit: readonly V136CompetitionSourceCoverageAuditEntry[]
  surfaces: readonly V136CompetitionSurfaceRow[]
  rows: readonly V136CompetitionSurfaceRow[]
}

export interface GenerateV136CompetitionSurfaceInventoryOptions {
  repoRoot?: string
  rows?: readonly V136CompetitionSurfaceRow[]
  scanRoots?: readonly string[]
  suppressions?: readonly V136CompetitionPolicyScanSuppression[]
  includeDefaultSuppressions?: boolean
}

export interface V136CompetitionPolicyScanSuppression {
  path: string
  category: string
  matchedPhrase: string
  rationale: string
  owner: string
  expiry: string
}

export interface V136CompetitionPolicyScanFinding {
  path: string
  category: string
  message: string
  matchedPhrase: string
}

export interface V136CompetitionPolicyScannedFile {
  path: string
}

export interface V136CompetitionPolicyScanResult {
  scannedRoots: readonly string[]
  scannedFiles: readonly V136CompetitionPolicyScannedFile[]
  findings: readonly V136CompetitionPolicyScanFinding[]
  invalidSuppressions: readonly string[]
}

export const requiredSurfaceGroups = [
  "routes",
  "spec-dtos",
  "persistence",
  "go-backend",
  "web-pages",
  "ui-copy",
  "docs",
  "monitors",
  "proof-scripts",
  "proof-artifacts",
  "tests",
  "fixtures",
  "snapshots",
] as const satisfies readonly V136CompetitionSurfaceGroup[]

export const allowedSurfaceGroups = [
  ...requiredSurfaceGroups,
] as const satisfies readonly V136CompetitionSurfaceGroup[]

export const allowedDispositions = [
  "lock-now",
  "fix-in-250",
  "fix-in-251",
  "fix-in-252",
  "fix-in-253",
  "fix-in-254",
  "prove-in-255",
  "future/defer",
] as const satisfies readonly V136CompetitionDisposition[]

export const allowedDataClasses = [
  "public",
  "session",
  "owner-private",
  "internal-private",
  "operator-private",
  "artifact-private",
] as const satisfies readonly V136CompetitionDataClass[]

export const allowedRequirementIds = [
  "POST-01",
  "POST-02",
  "POST-03",
  "POST-04",
  "POST-05",
] as const satisfies readonly V136CompetitionRequirementId[]

export const artifactPaths = {
  json: ".planning/artifacts/v1.36-competition-surface-inventory.json",
  markdown: ".planning/artifacts/v1.36-competition-surface-inventory.md",
} as const

export const defaultScanRoots = [
  ".planning",
  "packages",
  "apps",
  "scripts",
] as const

export const scanFileExtensions = [
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".md",
  ".mdx",
  ".json",
  ".jsonl",
  ".txt",
  ".go",
  ".yaml",
  ".yml",
  ".snap",
  ".html",
] as const

const requiredResetNoDurableCopy =
  "resettable Season-scoped standings; no durable permanent rating promise" as const

const privateMarkers = [
  ...COMPETITION_POLICY_V1_36_PRIVACY_EXCLUSIONS,
  "Strategy source",
  "raw diagnostics",
  "objective payload",
] as const

const forbiddenClaimCategorySet = new Set(
  COMPETITION_POLICY_V1_36_FORBIDDEN_CLAIMS.map((claim) => claim.category),
)

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

const forbiddenClaimPatterns = COMPETITION_POLICY_V1_36_FORBIDDEN_CLAIMS.map(
  (claim) => ({
    category: claim.category,
    examples: claim.examples,
    pattern: new RegExp(
      `\\b(?:forbidden\\s+)?${escapeRegExp(claim.category)}\\b|${claim.examples
        .map(escapeRegExp)
        .join("|")}`,
      "i",
    ),
  }),
)

const privateMarkerPatterns = privateMarkers.map((marker) => ({
  marker,
  pattern: new RegExp(
    `\\b(?:exposes?|includes?|returns?|publishes?|leaks?|shows?)\\b[^.\\n]{0,100}\\b${escapeRegExp(
      marker,
    ).replaceAll("\\ ", "\\s+")}\\b`,
    "i",
  ),
}))

const authoritativeRows = [
  {
    id: "competition-index-route",
    surfaceGroup: "routes",
    references: ["apps/web/app/competitions/page.tsx"],
    owner: "Web public competition route",
    authorityOwner: "webProjection",
    dataClass: "public",
    countedBehavior:
      "Lists public competition entry points and must not imply permanent ranking.",
    replayEvidenceRequirement:
      "Links only to public-safe competition, result, and replay evidence.",
    privacyRisk:
      "Public route must keep entrant-private and runtime-private details excluded.",
    postureLabelRequired: true,
    requiredPostureCopy: COMPETITION_POLICY_V1_36_POSTURE.publicLabel,
    requiredResetNoDurableCopy,
    affectedRequirements: ["POST-01", "POST-02", "POST-04"],
    disposition: "fix-in-254",
    notes:
      "Phase 254 owns rendering policy-backed trust copy on the competition index.",
  },
  {
    id: "competition-detail-route",
    surfaceGroup: "routes",
    references: ["apps/web/app/competitions/[competitionId]/page.tsx"],
    owner: "Web competition detail route",
    authorityOwner: "webProjection",
    dataClass: "public",
    countedBehavior:
      "Shows public competition status, public MatchSet links, and future Season context.",
    replayEvidenceRequirement:
      "Must explain whether replay evidence is available for public result rows.",
    privacyRisk:
      "Detail route cannot expose private entry diagnostics or operator-only context.",
    postureLabelRequired: true,
    requiredPostureCopy: COMPETITION_POLICY_V1_36_POSTURE.publicLabel,
    requiredResetNoDurableCopy,
    affectedRequirements: ["POST-01", "POST-02", "POST-04"],
    disposition: "fix-in-254",
    notes:
      "Public detail copy is inventoried here; redesign belongs to Phase 254.",
  },
  {
    id: "competition-entry-route",
    surfaceGroup: "routes",
    references: ["apps/web/app/competitions/[competitionId]/enter/page.tsx"],
    owner: "Signed-in competition entry route",
    authorityOwner: "webProjection",
    dataClass: "session",
    countedBehavior:
      "Entry page displays eligibility state but must not own eligibility truth.",
    replayEvidenceRequirement:
      "Entry copy should describe later result evidence expectations only.",
    privacyRisk:
      "Entry remediation must remain coarse and public-safe for the signed-in player.",
    postureLabelRequired: true,
    requiredPostureCopy: COMPETITION_POLICY_V1_36_POSTURE.publicLabel,
    requiredResetNoDurableCopy,
    affectedRequirements: ["POST-01", "POST-02", "POST-04"],
    disposition: "fix-in-250",
    notes:
      "Phase 250 owns counted entry gates and one-active-revision behavior.",
  },
  {
    id: "ladder-season-route",
    surfaceGroup: "web-pages",
    references: ["apps/web/app/ladder/[seasonId]/page.tsx"],
    owner: "Web Season and standings page",
    authorityOwner: "webProjection",
    dataClass: "public",
    countedBehavior:
      "Displays Season standings and MatchSet evidence from public projections.",
    replayEvidenceRequirement:
      "Included standings rows must link to public result or replay evidence where available.",
    privacyRisk:
      "Public standings must avoid private runtime, dispute, and recovery internals.",
    postureLabelRequired: true,
    requiredPostureCopy: COMPETITION_POLICY_V1_36_POSTURE.publicLabel,
    requiredResetNoDurableCopy,
    affectedRequirements: ["POST-01", "POST-02", "POST-04"],
    disposition: "fix-in-251",
    notes:
      "Phase 251 owns lifecycle copy; Phase 252 owns standings recompute semantics.",
  },
  {
    id: "player-public-route",
    surfaceGroup: "web-pages",
    references: ["apps/web/app/players/[handle]/page.tsx"],
    owner: "Web public player page",
    authorityOwner: "webProjection",
    dataClass: "public",
    countedBehavior:
      "Must distinguish counted trial evidence from exhibition and study evidence.",
    replayEvidenceRequirement:
      "Player evidence links should point to public result and replay records only.",
    privacyRisk:
      "Public player history must not reveal private Strategy details.",
    postureLabelRequired: true,
    requiredPostureCopy: COMPETITION_POLICY_V1_36_POSTURE.publicLabel,
    requiredResetNoDurableCopy,
    affectedRequirements: ["POST-01", "POST-02", "POST-04"],
    disposition: "fix-in-254",
    notes:
      "Player trust projections are deferred to Phase 254 public UX work.",
  },
  {
    id: "strategy-public-route",
    surfaceGroup: "web-pages",
    references: ["apps/web/app/strategies/[strategyId]/page.tsx"],
    owner: "Web public Strategy page",
    authorityOwner: "webProjection",
    dataClass: "public",
    countedBehavior:
      "Must label counted trial evidence separately from exhibition or learning evidence.",
    replayEvidenceRequirement:
      "Strategy evidence must link to public result/replay rows without private payloads.",
    privacyRisk:
      "Public Strategy page must not expose source or memory payloads.",
    postureLabelRequired: true,
    requiredPostureCopy: COMPETITION_POLICY_V1_36_POSTURE.publicLabel,
    requiredResetNoDurableCopy,
    affectedRequirements: ["POST-01", "POST-02", "POST-04"],
    disposition: "fix-in-254",
    notes:
      "Phase 254 owns public Strategy trust copy and projections.",
  },
  {
    id: "replay-public-route",
    surfaceGroup: "web-pages",
    references: ["apps/web/app/matches/[matchId]/replay/page.tsx"],
    owner: "Web public replay page",
    authorityOwner: "webProjection",
    dataClass: "public",
    countedBehavior:
      "Replay page shows public Chronicle evidence and counted-state explanation.",
    replayEvidenceRequirement:
      "Replay board must remain public-safe and plausible in final proof.",
    privacyRisk:
      "Replay output must omit memory, objective, and private runtime internals.",
    postureLabelRequired: true,
    requiredPostureCopy: COMPETITION_POLICY_V1_36_POSTURE.publicLabel,
    requiredResetNoDurableCopy,
    affectedRequirements: ["POST-01", "POST-02", "POST-04"],
    disposition: "fix-in-254",
    notes:
      "Phase 255 proves board realism; this plan only inventories the surface.",
  },
  {
    id: "matchset-result-view-model",
    surfaceGroup: "spec-dtos",
    references: ["apps/web/app/matchsets/result-view-model.ts"],
    owner: "Web result view model adapter",
    authorityOwner: "webProjection",
    dataClass: "public",
    countedBehavior:
      "Projects public result states for UI rendering without owning scoring truth.",
    replayEvidenceRequirement:
      "Must preserve public replay evidence availability and absence states.",
    privacyRisk:
      "Result view model must stay public projection only.",
    postureLabelRequired: true,
    requiredPostureCopy: COMPETITION_POLICY_V1_36_POSTURE.publicLabel,
    requiredResetNoDurableCopy,
    affectedRequirements: ["POST-01", "POST-02", "POST-04"],
    disposition: "fix-in-252",
    notes:
      "Phase 252 owns counted-state classifier and standings recompute inputs.",
  },
  {
    id: "competition-spec-contract",
    surfaceGroup: "spec-dtos",
    references: ["packages/spec/src/competition.ts"],
    owner: "Spec competition DTOs",
    authorityOwner: "specContract",
    dataClass: "public",
    countedBehavior:
      "Existing competition DTOs provide the baseline public vocabulary.",
    replayEvidenceRequirement:
      "Spec DTOs must continue to expose only public replay evidence fields.",
    privacyRisk:
      "DTO expansion must preserve public-output privacy exclusions.",
    postureLabelRequired: false,
    requiredPostureCopy: "",
    requiredResetNoDurableCopy: "",
    affectedRequirements: ["POST-03", "POST-04"],
    disposition: "lock-now",
    notes:
      "Phase 249 locks policy vocabulary without changing existing DTO behavior.",
  },
  {
    id: "competition-policy-v136-spec",
    surfaceGroup: "spec-dtos",
    references: ["packages/spec/src/competition-policy-v1-36.ts"],
    owner: "Spec competition-policy-v1.36 contract",
    authorityOwner: "specContract",
    dataClass: "public",
    countedBehavior:
      "Defines public beta posture, forbidden claims, owners, and projection vocabulary.",
    replayEvidenceRequirement:
      "Defines policy labels consumed by later proof and monitor scripts.",
    privacyRisk:
      "Public policy payload must pass the spec leak-safe assertion.",
    postureLabelRequired: true,
    requiredPostureCopy: COMPETITION_POLICY_V1_36_POSTURE.publicLabel,
    requiredResetNoDurableCopy,
    affectedRequirements: ["POST-01", "POST-02", "POST-03", "POST-04"],
    disposition: "lock-now",
    notes:
      "This row binds the generated inventory to competition-policy-v1.36.",
  },
  {
    id: "public-discovery-spec",
    surfaceGroup: "spec-dtos",
    references: ["packages/spec/src/public-discovery.ts"],
    owner: "Spec public discovery DTOs",
    authorityOwner: "specContract",
    dataClass: "public",
    countedBehavior:
      "Public discovery cards can surface competition evidence links later.",
    replayEvidenceRequirement:
      "Discovery records must only reference public evidence routes.",
    privacyRisk:
      "Discovery DTOs must retain private-field exclusions.",
    postureLabelRequired: false,
    requiredPostureCopy: "",
    requiredResetNoDurableCopy: "",
    affectedRequirements: ["POST-04"],
    disposition: "fix-in-254",
    notes:
      "Phase 254 owns public discovery trust projection changes if needed.",
  },
  {
    id: "public-output-privacy-spec",
    surfaceGroup: "spec-dtos",
    references: ["packages/spec/src/public-output-privacy.ts"],
    owner: "Spec public-output privacy guard",
    authorityOwner: "specContract",
    dataClass: "public",
    countedBehavior:
      "Privacy guard provides the baseline public/default leak checks.",
    replayEvidenceRequirement:
      "Replay and result DTOs must remain compatible with the public leak guard.",
    privacyRisk:
      "Privacy marker drift would undercut public competition trust.",
    postureLabelRequired: false,
    requiredPostureCopy: "",
    requiredResetNoDurableCopy: "",
    affectedRequirements: ["POST-02", "POST-04", "POST-05"],
    disposition: "lock-now",
    notes:
      "The evaluator uses the existing leak-safe guard through the policy module.",
  },
  {
    id: "competition-persistence-entry",
    surfaceGroup: "persistence",
    references: ["packages/persistence/src/competition.ts"],
    owner: "Persistence competition entry helpers",
    authorityOwner: "persistence",
    dataClass: "session",
    countedBehavior:
      "Existing exhibition and competition creation helpers are inventory inputs.",
    replayEvidenceRequirement:
      "Later phases must bind counted entries to immutable public evidence.",
    privacyRisk:
      "Persistence errors must remain public-safe when projected to players.",
    postureLabelRequired: false,
    requiredPostureCopy: "",
    requiredResetNoDurableCopy: "",
    affectedRequirements: ["POST-04"],
    disposition: "fix-in-250",
    notes:
      "Phase 250 owns counted entry eligibility and same-user separation.",
  },
  {
    id: "ladder-persistence-season",
    surfaceGroup: "persistence",
    references: ["packages/persistence/src/ladder.ts"],
    owner: "Persistence trial ladder helpers",
    authorityOwner: "persistence",
    dataClass: "session",
    countedBehavior:
      "Current trial ladder policy informs Season and entry hardening.",
    replayEvidenceRequirement:
      "Season standings must eventually recompute from replay-backed evidence.",
    privacyRisk:
      "Eligibility categories must avoid private provider details.",
    postureLabelRequired: false,
    requiredPostureCopy: "",
    requiredResetNoDurableCopy: "",
    affectedRequirements: ["POST-04"],
    disposition: "fix-in-251",
    notes:
      "Phase 251 owns Season lifecycle and scheduling policy.",
  },
  {
    id: "governance-persistence",
    surfaceGroup: "persistence",
    references: ["packages/persistence/src/governance.ts"],
    owner: "Persistence governance helpers",
    authorityOwner: "persistence",
    dataClass: "operator-private",
    countedBehavior:
      "Current governance state is inventoried for later public-safe projections.",
    replayEvidenceRequirement:
      "Governance state must explain standings impact without exposing private records.",
    privacyRisk:
      "Operator notes and dispute internals stay private by default.",
    postureLabelRequired: false,
    requiredPostureCopy: "",
    requiredResetNoDurableCopy: "",
    affectedRequirements: ["POST-04"],
    disposition: "fix-in-253",
    notes:
      "Phase 253 owns governance workflow and public-safe explanation behavior.",
  },
  {
    id: "scoring-persistence",
    surfaceGroup: "persistence",
    references: ["packages/persistence/src/scoring.ts"],
    owner: "Persistence scoring helpers",
    authorityOwner: "persistence",
    dataClass: "internal-private",
    countedBehavior:
      "Scoring helpers are inputs to future deterministic standings recompute.",
    replayEvidenceRequirement:
      "Counted scoring must be traceable to canonical complete MatchSet evidence.",
    privacyRisk:
      "Scoring internals must not become public manual rank truth.",
    postureLabelRequired: false,
    requiredPostureCopy: "",
    requiredResetNoDurableCopy: "",
    affectedRequirements: ["POST-04"],
    disposition: "fix-in-252",
    notes:
      "Phase 252 owns counted-state classifier and standings recomputation.",
  },
  {
    id: "matchset-status-persistence",
    surfaceGroup: "persistence",
    references: ["packages/persistence/src/matchset-status.ts"],
    owner: "Persistence MatchSet status helpers",
    authorityOwner: "persistence",
    dataClass: "internal-private",
    countedBehavior:
      "MatchSet status is a future input to counted/non-counted classification.",
    replayEvidenceRequirement:
      "Status projections must preserve evidence availability and failure states.",
    privacyRisk:
      "Status outputs must not leak raw runtime failure details publicly.",
    postureLabelRequired: false,
    requiredPostureCopy: "",
    requiredResetNoDurableCopy: "",
    affectedRequirements: ["POST-04"],
    disposition: "fix-in-252",
    notes:
      "Phase 252 owns public counted-state semantics and recompute use.",
  },
  {
    id: "go-provider-readiness",
    surfaceGroup: "go-backend",
    references: ["apps/go-backend/provider_readiness.go"],
    owner: "Go provider readiness projection",
    authorityOwner: "goBackendOrchestration",
    dataClass: "session",
    countedBehavior:
      "Provider readiness evidence gates counted entry in later work.",
    replayEvidenceRequirement:
      "Readiness proof must be current before counted MatchSet scheduling.",
    privacyRisk:
      "Go readiness output must remain coarse and remediation-oriented.",
    postureLabelRequired: false,
    requiredPostureCopy: "",
    requiredResetNoDurableCopy: "",
    affectedRequirements: ["POST-04"],
    disposition: "fix-in-250",
    notes:
      "Phase 250 consumes v1.35 provider-proof and readiness evidence.",
  },
  {
    id: "go-matchset-status",
    surfaceGroup: "go-backend",
    references: ["apps/go-backend/matchset_status.go"],
    owner: "Go MatchSet status refresh",
    authorityOwner: "goBackendOrchestration",
    dataClass: "internal-private",
    countedBehavior:
      "Go status refresh feeds later public counted-state projections.",
    replayEvidenceRequirement:
      "Completed evidence must stay canonical before standing effects apply.",
    privacyRisk:
      "System failure internals must stay behind public-safe categories.",
    postureLabelRequired: false,
    requiredPostureCopy: "",
    requiredResetNoDurableCopy: "",
    affectedRequirements: ["POST-04"],
    disposition: "fix-in-252",
    notes:
      "Phase 252 owns public counted-state classifier integration.",
  },
  {
    id: "go-scoring",
    surfaceGroup: "go-backend",
    references: ["apps/go-backend/scoring.go"],
    owner: "Go scoring refresh",
    authorityOwner: "goBackendOrchestration",
    dataClass: "internal-private",
    countedBehavior:
      "Go scoring refresh is inventory input for standings recompute.",
    replayEvidenceRequirement:
      "Scoring must be backed by complete public MatchSet evidence.",
    privacyRisk:
      "Scoring output must not become unrecomputable manual truth.",
    postureLabelRequired: false,
    requiredPostureCopy: "",
    requiredResetNoDurableCopy: "",
    affectedRequirements: ["POST-04"],
    disposition: "fix-in-252",
    notes:
      "Phase 252 owns recompute rules; this plan records the surface only.",
  },
  {
    id: "public-trust-copy",
    surfaceGroup: "ui-copy",
    references: [
      "apps/web/app/competitions/[competitionId]/page.tsx",
      "apps/web/app/ladder/[seasonId]/page.tsx",
      "apps/web/app/matchsets/result-view-model.ts",
    ],
    owner: "Web public competition copy",
    authorityOwner: "webProjection",
    dataClass: "public",
    countedBehavior:
      "Copy must explain trial counted status without promising durable outcomes.",
    replayEvidenceRequirement:
      "Copy should distinguish evidence available, unavailable, and held states.",
    privacyRisk:
      "Copy must avoid raw diagnostic and private runtime overclaims.",
    postureLabelRequired: true,
    requiredPostureCopy: COMPETITION_POLICY_V1_36_POSTURE.publicLabel,
    requiredResetNoDurableCopy,
    affectedRequirements: ["POST-01", "POST-02", "POST-04"],
    disposition: "fix-in-254",
    notes:
      "Phase 254 owns final public trust copy across visible surfaces.",
  },
  {
    id: "phase-249-policy-docs",
    surfaceGroup: "docs",
    references: [
      ".planning/phases/249-competition-surface-inventory-and-policy-lock/249-CONTEXT.md",
      ".planning/phases/249-competition-surface-inventory-and-policy-lock/249-RESEARCH.md",
      ".planning/phases/249-competition-surface-inventory-and-policy-lock/249-VALIDATION.md",
      ".planning/phases/249-competition-surface-inventory-and-policy-lock/249-PATTERNS.md",
      ".planning/phases/249-competition-surface-inventory-and-policy-lock/249-01-SUMMARY.md",
    ],
    owner: "Phase 249 planning artifacts",
    authorityOwner: "staticMonitorProof",
    dataClass: "public",
    countedBehavior:
      "Planning docs lock decisions D-01 through D-16 for downstream phases.",
    replayEvidenceRequirement:
      "Docs state proof requirements without performing service-backed proof.",
    privacyRisk:
      "Planning artifacts must stay sanitized and product-boundary safe.",
    postureLabelRequired: true,
    requiredPostureCopy: COMPETITION_POLICY_V1_36_POSTURE.publicLabel,
    requiredResetNoDurableCopy,
    affectedRequirements: ["POST-01", "POST-02", "POST-03", "POST-04"],
    disposition: "lock-now",
    notes:
      "This row records the approved policy and inventory decisions consumed here.",
  },
  {
    id: "boundary-monitor-entrypoint",
    surfaceGroup: "monitors",
    references: ["scripts/check-boundary-monitors.ts"],
    owner: "Boundary monitor hub",
    authorityOwner: "staticMonitorProof",
    dataClass: "public",
    countedBehavior:
      "Monitor hub will later enforce posture-copy and forbidden-claim drift.",
    replayEvidenceRequirement:
      "Monitor output should prove generated artifacts remain current.",
    privacyRisk:
      "Monitor diagnostics should report categories and paths, not private payloads.",
    postureLabelRequired: false,
    requiredPostureCopy: "",
    requiredResetNoDurableCopy: "",
    affectedRequirements: ["POST-04", "POST-05"],
    disposition: "prove-in-255",
    notes:
      "Phase 249-03 wires this evaluator into the monitor chain.",
  },
  {
    id: "competition-inventory-evaluator",
    surfaceGroup: "proof-scripts",
    references: ["scripts/evaluate-v1-36-competition-policy.ts"],
    owner: "Phase 249 inventory evaluator",
    authorityOwner: "staticMonitorProof",
    dataClass: "internal-private",
    countedBehavior:
      "Generates, validates, writes, and checks inventory artifacts.",
    replayEvidenceRequirement:
      "Artifacts must be deterministic and synchronized from the typed row source.",
    privacyRisk:
      "Evaluator must not perform network, database, Strategy execution, or product writes.",
    postureLabelRequired: false,
    requiredPostureCopy: "",
    requiredResetNoDurableCopy: "",
    affectedRequirements: ["POST-04"],
    disposition: "lock-now",
    notes:
      "This script is static policy evidence, not Phase 250-255 behavior.",
  },
  {
    id: "v135-boundary-inventory-baseline",
    surfaceGroup: "proof-artifacts",
    references: [
      ".planning/artifacts/v1.35-boundary-surface-inventory.md",
      ".planning/artifacts/v1.35-boundary-surface-inventory.json",
    ],
    owner: "v1.35 boundary inventory baseline",
    authorityOwner: "staticMonitorProof",
    dataClass: "artifact-private",
    countedBehavior:
      "Provides archived runtime/account/privacy constraints consumed by v1.36.",
    replayEvidenceRequirement:
      "Baseline evidence informs later proof requirements only.",
    privacyRisk:
      "Historical proof artifacts must stay sanitized for planning use.",
    postureLabelRequired: false,
    requiredPostureCopy: "",
    requiredResetNoDurableCopy: "",
    affectedRequirements: ["POST-04"],
    disposition: "lock-now",
    notes:
      "v1.35 artifacts are baseline evidence; no behavior is reimplemented here.",
  },
  {
    id: "competition-inventory-tests",
    surfaceGroup: "tests",
    references: ["scripts/evaluate-v1-36-competition-policy.test.ts"],
    owner: "Vitest inventory tests",
    authorityOwner: "staticMonitorProof",
    dataClass: "public",
    countedBehavior:
      "Tests pin row schema, disposition, posture, privacy, and artifact sync.",
    replayEvidenceRequirement:
      "Temp-root tests verify artifact generation and drift detection.",
    privacyRisk:
      "Test fixtures must remain public-safe and synthetic.",
    postureLabelRequired: false,
    requiredPostureCopy: "",
    requiredResetNoDurableCopy: "",
    affectedRequirements: ["POST-01", "POST-02", "POST-03", "POST-04"],
    disposition: "lock-now",
    notes:
      "POST-01 POST-02 POST-03 POST-04 evaluator coverage.",
  },
  {
    id: "competition-copy-fixtures",
    surfaceGroup: "fixtures",
    references: ["apps/web/app/matchsets/result-view-model.ts"],
    owner: "Public competition fixture copy",
    authorityOwner: "webProjection",
    dataClass: "public",
    countedBehavior:
      "Fixtures containing result copy must use trial and resettable posture labels.",
    replayEvidenceRequirement:
      "Fixtures must preserve public replay evidence availability states.",
    privacyRisk:
      "Fixture payloads must stay public projection only.",
    postureLabelRequired: true,
    requiredPostureCopy: COMPETITION_POLICY_V1_36_POSTURE.publicLabel,
    requiredResetNoDurableCopy,
    affectedRequirements: ["POST-01", "POST-02", "POST-04"],
    disposition: "fix-in-254",
    notes:
      "Fixture copy enforcement is completed by the Phase 249-03 monitor.",
  },
  {
    id: "competition-copy-snapshots",
    surfaceGroup: "snapshots",
    references: [
      "apps/web/app/players/[handle]/page.tsx",
      "apps/web/app/strategies/[strategyId]/page.tsx",
      "apps/web/app/matches/[matchId]/replay/page.tsx",
    ],
    owner: "Public competition copy snapshots",
    authorityOwner: "webProjection",
    dataClass: "public",
    countedBehavior:
      "Snapshots must distinguish trial standings evidence from exhibition evidence.",
    replayEvidenceRequirement:
      "Snapshot rows should preserve public evidence and no-evidence states.",
    privacyRisk:
      "Snapshots must not contain private runtime, dispute, or recovery payloads.",
    postureLabelRequired: true,
    requiredPostureCopy: COMPETITION_POLICY_V1_36_POSTURE.publicLabel,
    requiredResetNoDurableCopy,
    affectedRequirements: ["POST-01", "POST-02", "POST-04"],
    disposition: "fix-in-254",
    notes:
      "Phase 249-03 monitors relevant snapshots after artifacts are generated.",
  },
] as const satisfies readonly V136CompetitionSurfaceRow[]

const sourceCoverageAudit = [
  {
    command:
      "rg -n \"competition|ladder|player|strategy|replay|matchset\" apps/web/app apps/web/app/matchsets",
    result:
      "COVERED competition index/detail/entry, ladder Season, player, Strategy, replay, and MatchSet result surfaces.",
    coveredSurfaceGroups: [
      {
        group: "routes",
        status: "COVERED",
        rowIds: [
          "competition-index-route",
          "competition-detail-route",
          "competition-entry-route",
        ],
      },
      {
        group: "web-pages",
        status: "COVERED",
        rowIds: [
          "ladder-season-route",
          "player-public-route",
          "strategy-public-route",
          "replay-public-route",
        ],
      },
      {
        group: "ui-copy",
        status: "COVERED",
        rowIds: ["public-trust-copy"],
      },
    ],
  },
  {
    command:
      "rg -n \"competition|public|privacy|policy\" packages/spec/src",
    result:
      "COVERED competition DTOs, competition-policy-v1.36, public discovery, and public-output privacy contracts.",
    coveredSurfaceGroups: [
      {
        group: "spec-dtos",
        status: "COVERED",
        rowIds: [
          "competition-spec-contract",
          "competition-policy-v136-spec",
          "public-discovery-spec",
          "public-output-privacy-spec",
          "matchset-result-view-model",
        ],
      },
    ],
  },
  {
    command:
      "rg -n \"competition|ladder|governance|scoring|matchset\" packages/persistence/src apps/go-backend",
    result:
      "COVERED persistence competition/ladder/governance/scoring/status and Go provider readiness/status/scoring surfaces.",
    coveredSurfaceGroups: [
      {
        group: "persistence",
        status: "COVERED",
        rowIds: [
          "competition-persistence-entry",
          "ladder-persistence-season",
          "governance-persistence",
          "scoring-persistence",
          "matchset-status-persistence",
        ],
      },
      {
        group: "go-backend",
        status: "COVERED",
        rowIds: [
          "go-provider-readiness",
          "go-matchset-status",
          "go-scoring",
        ],
      },
    ],
  },
  {
    command:
      "rg -n \"v1\\.36|public beta trial competition|boundary monitor|fixture|snapshot\" .planning scripts apps packages",
    result:
      "COVERED Phase 249 planning docs, monitors, proof scripts, proof artifacts, tests, fixtures, and snapshots.",
    coveredSurfaceGroups: [
      {
        group: "docs",
        status: "COVERED",
        rowIds: ["phase-249-policy-docs"],
      },
      {
        group: "monitors",
        status: "COVERED",
        rowIds: ["boundary-monitor-entrypoint"],
      },
      {
        group: "proof-scripts",
        status: "COVERED",
        rowIds: ["competition-inventory-evaluator"],
      },
      {
        group: "proof-artifacts",
        status: "COVERED",
        rowIds: ["v135-boundary-inventory-baseline"],
      },
      {
        group: "tests",
        status: "COVERED",
        rowIds: ["competition-inventory-tests"],
      },
      {
        group: "fixtures",
        status: "COVERED",
        rowIds: ["competition-copy-fixtures"],
      },
      {
        group: "snapshots",
        status: "COVERED",
        rowIds: ["competition-copy-snapshots"],
      },
    ],
  },
] as const satisfies readonly V136CompetitionSourceCoverageAuditEntry[]

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0

const rowSearchText = (row: V136CompetitionSurfaceRow): string =>
  [
    row.countedBehavior,
    row.replayEvidenceRequirement,
    row.privacyRisk,
    row.notes,
  ].join("\n")

export const generateV136CompetitionSurfaceInventory = (
  options: GenerateV136CompetitionSurfaceInventoryOptions = {},
): V136CompetitionSurfaceInventory => {
  const surfaces = options.rows ?? authoritativeRows
  assertCompetitionPolicyV136PublicLeakSafe()
  return {
    schemaVersion,
    milestone,
    sourcePolicy,
    generatedBy,
    generatedAt,
    artifactPaths,
    requiredSurfaceGroups,
    allowedSurfaceGroups,
    allowedDispositions,
    allowedDataClasses,
    allowedRequirementIds,
    requiredPostureCopy: COMPETITION_POLICY_V1_36_POSTURE.publicLabel,
    requiredResetNoDurableCopy,
    forbiddenClaimCategories: COMPETITION_POLICY_V1_36_FORBIDDEN_CLAIMS.map(
      (claim) => claim.category,
    ),
    forbiddenClaimExamples: COMPETITION_POLICY_V1_36_FORBIDDEN_CLAIMS.flatMap(
      (claim) => claim.examples,
    ),
    privateMarkers,
    globalPolicies: {
      executiveSummary:
        "Phase 249 inventories public-trust competition surfaces and assigns each row exactly one downstream disposition before later phases implement entry, Season, standings, governance, UX, or proof behavior.",
      scope: [
        "Lock competition surface ownership, data class, counted behavior, replay evidence requirement, privacy risk, and downstream disposition.",
        "Generate synchronized Markdown and JSON artifacts from one typed source.",
        "Consume competition-policy-v1.36 posture, forbidden claim, owner, and privacy vocabulary.",
      ],
      nonGoals: [
        "No counted entry enforcement, Season lifecycle, standings recompute, governance mutation, page redesign, service-backed proof, game-rule change, Strategy execution, database write, network call, or Node vm security boundary.",
      ],
    },
    sourceCoverageAudit,
    surfaces,
    rows: surfaces,
  }
}

export const validateV136CompetitionSurfaceInventory = (
  inventory: V136CompetitionSurfaceInventory,
): readonly string[] => {
  const errors: string[] = []

  if (inventory.schemaVersion !== schemaVersion) {
    errors.push(`schemaVersion must be ${schemaVersion}`)
  }
  if (inventory.milestone !== milestone) {
    errors.push(`milestone must be ${milestone}`)
  }
  if (inventory.sourcePolicy !== sourcePolicy) {
    errors.push(`sourcePolicy must be ${sourcePolicy}`)
  }
  if (inventory.generatedBy !== generatedBy) {
    errors.push(`generatedBy must be ${generatedBy}`)
  }

  const presentGroups = new Set(inventory.rows.map((row) => row.surfaceGroup))
  for (const group of requiredSurfaceGroups) {
    if (!presentGroups.has(group)) {
      errors.push(`missing required surface group ${group}`)
    }
  }

  const allowedGroups = new Set<V136CompetitionSurfaceGroup>(
    allowedSurfaceGroups,
  )
  const allowedDispositionSet = new Set<V136CompetitionDisposition>(
    allowedDispositions,
  )
  const allowedDataClassSet = new Set<V136CompetitionDataClass>(
    allowedDataClasses,
  )
  const allowedRequirements = new Set<V136CompetitionRequirementId>(
    allowedRequirementIds,
  )
  const allowedAuthorityOwners = new Set(
    Object.keys(
      COMPETITION_POLICY_V1_36_AUTHORITY_OWNERS,
    ) as V136CompetitionAuthorityOwner[],
  )
  const rowIds = new Set<string>()
  const rowGroupReferences = new Set<string>()

  for (const row of inventory.rows) {
    if (!isNonEmptyString(row.id)) {
      errors.push("row missing id")
      continue
    }
    if (rowIds.has(row.id)) {
      errors.push(`duplicate row id ${row.id}`)
    }
    rowIds.add(row.id)

    if (!allowedGroups.has(row.surfaceGroup)) {
      errors.push(`${row.id} has invalid surfaceGroup ${row.surfaceGroup}`)
    }
    if (!isNonEmptyString(row.disposition)) {
      errors.push(`${row.id} missing disposition`)
    } else if (!allowedDispositionSet.has(row.disposition)) {
      errors.push(`${row.id} has invalid disposition ${row.disposition}`)
    }
    if (!allowedDataClassSet.has(row.dataClass)) {
      errors.push(`${row.id} has invalid dataClass ${row.dataClass}`)
    }
    if (!allowedAuthorityOwners.has(row.authorityOwner)) {
      if (!isNonEmptyString(row.authorityOwner)) {
        errors.push(`${row.id} missing authorityOwner`)
      } else {
        errors.push(`${row.id} has invalid authorityOwner ${row.authorityOwner}`)
      }
    }

    const requiredStringFields = [
      "owner",
      "countedBehavior",
      "replayEvidenceRequirement",
      "privacyRisk",
      "notes",
    ] as const
    for (const field of requiredStringFields) {
      if (!isNonEmptyString(row[field])) {
        errors.push(`${row.id} missing ${field}`)
      }
    }
    if (!Array.isArray(row.references) || row.references.length === 0) {
      errors.push(`${row.id} missing references`)
    }
    if (
      !Array.isArray(row.affectedRequirements) ||
      row.affectedRequirements.length === 0
    ) {
      errors.push(`${row.id} missing affectedRequirements`)
    }
    if (typeof row.postureLabelRequired !== "boolean") {
      errors.push(`${row.id} missing postureLabelRequired`)
    }

    for (const reference of row.references) {
      const duplicateKey = `${row.surfaceGroup}:${reference}`
      if (rowGroupReferences.has(duplicateKey)) {
        errors.push(
          `duplicate reference ${reference} in surface group ${row.surfaceGroup}`,
        )
      }
      rowGroupReferences.add(duplicateKey)
    }

    for (const requirement of row.affectedRequirements) {
      if (!allowedRequirements.has(requirement)) {
        errors.push(`${row.id} has unknown requirement ${requirement}`)
      }
    }
    if (!row.affectedRequirements.includes("POST-04")) {
      errors.push(`${row.id} must trace POST-04 inventory coverage`)
    }

    if (row.postureLabelRequired === true) {
      if (row.requiredPostureCopy !== COMPETITION_POLICY_V1_36_POSTURE.publicLabel) {
        errors.push(
          `${row.id} must require exact posture copy ${COMPETITION_POLICY_V1_36_POSTURE.publicLabel}`,
        )
      }
      if (row.requiredResetNoDurableCopy !== requiredResetNoDurableCopy) {
        errors.push(
          `${row.id} must require resettable Season-scoped standings and no durable permanent rating promise copy`,
        )
      }
    } else {
      if (row.requiredPostureCopy !== "" || row.requiredResetNoDurableCopy !== "") {
        errors.push(
          `${row.id} must leave required posture copy blank when postureLabelRequired is false`,
        )
      }
    }

    const text = rowSearchText(row)
    for (const { category, pattern } of forbiddenClaimPatterns) {
      if (pattern.test(text) || forbiddenClaimCategorySet.has(text as never)) {
        errors.push(`${row.id} forbidden claim category: ${category}`)
      }
    }
    for (const { marker, pattern } of privateMarkerPatterns) {
      if (pattern.test(text)) {
        errors.push(`${row.id} forbidden private marker: ${marker}`)
      }
    }
  }

  return errors
}

const markdownEscape = (value: string | boolean | readonly string[]): string => {
  const text = Array.isArray(value) ? value.join(", ") : String(value)
  return text.replaceAll("|", "\\|").replaceAll("\n", " ")
}

const rowsByDisposition = (
  inventory: V136CompetitionSurfaceInventory,
): string =>
  allowedDispositions
    .map((disposition) => {
      const rows = inventory.rows.filter((row) => row.disposition === disposition)
      if (rows.length === 0) {
        return ""
      }
      return `- **${disposition}:** ${rows.map((row) => row.id).join(", ")}`
    })
    .filter(Boolean)
    .join("\n")

export const renderV136CompetitionSurfaceInventoryMarkdown = (
  inventory: V136CompetitionSurfaceInventory,
): string => {
  const errors = validateV136CompetitionSurfaceInventory(inventory)
  if (errors.length > 0) {
    throw new Error(
      `Invalid v1.36 competition surface inventory:\n${errors.join("\n")}`,
    )
  }

  const inventoryRows = inventory.rows
    .map(
      (row) =>
        `| ${markdownEscape(row.id)} | ${markdownEscape(row.surfaceGroup)} | ${markdownEscape(row.references)} | ${markdownEscape(row.owner)} | ${markdownEscape(row.authorityOwner)} | ${markdownEscape(row.dataClass)} | ${markdownEscape(row.countedBehavior)} | ${markdownEscape(row.replayEvidenceRequirement)} | ${markdownEscape(row.privacyRisk)} | ${markdownEscape(row.postureLabelRequired)} | ${markdownEscape(row.requiredPostureCopy)} | ${markdownEscape(row.requiredResetNoDurableCopy)} | ${markdownEscape(row.affectedRequirements)} | ${markdownEscape(row.disposition)} | ${markdownEscape(row.notes)} |`,
    )
    .join("\n")
  const coverageRows = inventory.sourceCoverageAudit
    .flatMap((entry) =>
      entry.coveredSurfaceGroups.map(
        (coverage) =>
          `| \`${markdownEscape(entry.command)}\` | ${markdownEscape(entry.result)} | ${markdownEscape(coverage.group)} | ${coverage.status} | ${markdownEscape(coverage.rowIds)} |`,
      ),
    )
    .join("\n")

  return `# v1.36 Competition Surface Inventory

**Schema:** ${inventory.schemaVersion}
**Milestone:** ${inventory.milestone}
**Source policy:** ${inventory.sourcePolicy}
**Generated by:** ${inventory.generatedBy}
**Generated at:** ${inventory.generatedAt}

## Executive Summary

${inventory.globalPolicies.executiveSummary}

The inventory covers route, code, artifact, docs, copy, monitor, proof, fixture, and snapshot surfaces that affect public competition trust. Each row has one downstream disposition and records owner, authority owner, data class, counted behavior, replay evidence requirement, privacy risk, posture-copy requirement, requirement traceability, and implementation handoff.

## Scope and Non-Goals

${inventory.globalPolicies.scope.map((item) => `- ${item}`).join("\n")}

Non-goals:

${inventory.globalPolicies.nonGoals.map((item) => `- ${item}`).join("\n")}

## Policy Contract Reference

- Source contract: \`${inventory.sourcePolicy}\`
- Required posture copy: **${inventory.requiredPostureCopy}**
- Required reset/no-durable copy: **${inventory.requiredResetNoDurableCopy}**
- Public policy owner: \`${COMPETITION_POLICY_V1_36_AUTHORITY_OWNERS.specContract}\`

## Allowed Dispositions

${inventory.allowedDispositions.map((disposition) => `- \`${disposition}\``).join("\n")}

## Allowed Data Classes

${inventory.allowedDataClasses.map((dataClass) => `- \`${dataClass}\``).join("\n")}

## Required Posture Copy

Rows with \`Posture Label Required\` set to \`true\` must require **public beta trial competition** copy and nearby **resettable Season-scoped standings; no durable permanent rating promise** copy.

## Forbidden Claim Categories

${COMPETITION_POLICY_V1_36_FORBIDDEN_CLAIMS.map(
  (claim) =>
    `- \`${claim.category}\`: ${claim.examples.map((example) => `"${example}"`).join("; ")}`,
).join("\n")}

## Surface Inventory

| ID | Surface Group | References | Owner | Authority Owner | Data Class | Counted Behavior | Replay Evidence Requirement | Privacy Risk | Posture Label Required | Required Posture Copy | Required Reset/No-Durable Copy | Affected Requirements | Disposition | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
${inventoryRows}

## Downstream Handoff

${rowsByDisposition(inventory)}

## Source Coverage Audit

| Discovery Command | Result | Surface Group | Status | Row IDs |
| --- | --- | --- | --- | --- |
${coverageRows}
`
}

export const renderV136CompetitionSurfaceInventoryJson = (
  inventory: V136CompetitionSurfaceInventory,
): string => {
  const errors = validateV136CompetitionSurfaceInventory(inventory)
  if (errors.length > 0) {
    throw new Error(
      `Invalid v1.36 competition surface inventory:\n${errors.join("\n")}`,
    )
  }
  return `${JSON.stringify(inventory, null, 2)}\n`
}

const parseMarkdownRowSyncFields = (
  markdown: string,
): Map<
  string,
  Pick<
    V136CompetitionSurfaceRow,
    "affectedRequirements" | "disposition" | "postureLabelRequired"
  >
> => {
  const result = new Map<
    string,
    Pick<
      V136CompetitionSurfaceRow,
      "affectedRequirements" | "disposition" | "postureLabelRequired"
    >
  >()
  for (const line of markdown.split("\n")) {
    if (
      !line.startsWith("| ") ||
      line.startsWith("| ---") ||
      line.includes(" Surface Group ")
    ) {
      continue
    }
    const cells = line
      .slice(2, -2)
      .split(" | ")
      .map((cell) => cell.trim())
    if (cells.length < 15) {
      continue
    }
    const [
      id,
      ,
      ,
      ,
      ,
      ,
      ,
      ,
      ,
      postureLabelRequired,
      ,
      ,
      affectedRequirements,
      disposition,
    ] = cells
    if (!id) {
      continue
    }
    result.set(id, {
      affectedRequirements: affectedRequirements
        .split(",")
        .map((requirement) => requirement.trim())
        .filter(Boolean) as V136CompetitionRequirementId[],
      disposition: disposition as V136CompetitionDisposition,
      postureLabelRequired: postureLabelRequired === "true",
    })
  }
  return result
}

const collectArtifactSynchronizationFailures = (
  actualJson: V136CompetitionSurfaceInventory,
  actualMarkdown: string,
): readonly string[] => {
  const failures: string[] = []
  const markdownRows = parseMarkdownRowSyncFields(actualMarkdown)
  if (markdownRows.size === 0) {
    return failures
  }
  for (const row of actualJson.rows) {
    const markdownRow = markdownRows.get(row.id)
    if (!markdownRow) {
      failures.push(
        `${artifactPaths.json} and ${artifactPaths.markdown} are desynchronized for ${row.id} missing row-sync drift`,
      )
      continue
    }
    if (markdownRow.disposition !== row.disposition) {
      failures.push(
        `${artifactPaths.json} and ${artifactPaths.markdown} are desynchronized for ${row.id} disposition row-sync drift`,
      )
    }
    if (markdownRow.postureLabelRequired !== row.postureLabelRequired) {
      failures.push(
        `${artifactPaths.json} and ${artifactPaths.markdown} are desynchronized for ${row.id} postureLabelRequired row-sync drift`,
      )
    }
    if (
      markdownRow.affectedRequirements.join(",") !==
      row.affectedRequirements.join(",")
    ) {
      failures.push(
        `${artifactPaths.json} and ${artifactPaths.markdown} are desynchronized for ${row.id} affectedRequirements row-sync drift`,
      )
    }
  }
  return failures
}

const ignoredPathSegments = new Set([
  "node_modules",
  ".next",
  "dist",
  "build",
  "coverage",
  ".git",
])

const ignoredFileNames = new Set([
  "pnpm-lock.yaml",
  "package-lock.json",
  "yarn.lock",
  "npm-shrinkwrap.json",
])

const ignoredFileExtensions = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".ico",
  ".zip",
  ".gz",
  ".tgz",
  ".tar",
  ".wasm",
  ".pdf",
])

const scanExtensionSet = new Set<string>(scanFileExtensions)

const normalizeScanPath = (value: string): string =>
  value.split(path.sep).join("/").replace(/^\.\//, "")

const hasIgnoredSegment = (relativePath: string): boolean =>
  normalizeScanPath(relativePath)
    .split("/")
    .some((segment) => ignoredPathSegments.has(segment))

const isSupportedTextFile = (relativePath: string): boolean => {
  const normalizedPath = normalizeScanPath(relativePath)
  const fileName = path.basename(normalizedPath)
  if (ignoredFileNames.has(fileName)) {
    return false
  }
  if (/\.(?:test|spec)\.[cm]?[jt]sx?$/.test(fileName)) {
    return false
  }
  if (hasIgnoredSegment(normalizedPath)) {
    return false
  }
  if (
    normalizedPath.startsWith(".planning/milestones/") ||
    normalizedPath.startsWith(".planning/workstreams/") ||
    (normalizedPath.startsWith(".planning/artifacts/") &&
      !normalizedPath.startsWith(
        ".planning/artifacts/v1.36-competition-surface-inventory.",
      ))
  ) {
    return false
  }
  const extension = path.extname(normalizedPath)
  if (ignoredFileExtensions.has(extension)) {
    return false
  }
  return scanExtensionSet.has(extension)
}

const textHasNullByte = (text: string): boolean => text.includes("\u0000")

const discoverFixtureAndSnapshotRoots = (
  root: string,
  baseRoots: readonly string[],
): readonly string[] => {
  const discovered = new Set<string>()
  const visit = (relativeDir: string): void => {
    if (hasIgnoredSegment(relativeDir)) {
      return
    }
    const absoluteDir = path.join(root, relativeDir)
    if (!existsSync(absoluteDir)) {
      return
    }
    const stat = statSync(absoluteDir)
    if (!stat.isDirectory()) {
      return
    }
    const baseName = path.basename(relativeDir)
    if (
      ["fixtures", "__fixtures__", "snapshots", "__snapshots__"].includes(
        baseName,
      )
    ) {
      discovered.add(normalizeScanPath(relativeDir))
    }
    for (const entry of readdirSync(absoluteDir)) {
      visit(path.join(relativeDir, entry))
    }
  }

  for (const baseRoot of baseRoots) {
    visit(baseRoot)
  }
  return [...discovered].sort()
}

const collectTextFiles = (
  root: string,
  roots: readonly string[],
): readonly V136CompetitionPolicyScannedFile[] => {
  const files: V136CompetitionPolicyScannedFile[] = []
  const seen = new Set<string>()
  const visit = (relativePath: string): void => {
    const normalizedPath = normalizeScanPath(relativePath)
    if (seen.has(normalizedPath) || hasIgnoredSegment(normalizedPath)) {
      return
    }
    const absolutePath = path.join(root, normalizedPath)
    if (!existsSync(absolutePath)) {
      return
    }
    const stat = statSync(absolutePath)
    if (stat.isDirectory()) {
      for (const entry of readdirSync(absolutePath)) {
        visit(path.join(normalizedPath, entry))
      }
      return
    }
    seen.add(normalizedPath)
    if (!stat.isFile() || !isSupportedTextFile(normalizedPath)) {
      return
    }
    const text = readFileSync(absolutePath, "utf8")
    if (textHasNullByte(text)) {
      return
    }
    files.push({ path: normalizedPath })
  }

  for (const scanRoot of roots) {
    visit(scanRoot)
  }
  return files.sort((a, b) => a.path.localeCompare(b.path))
}

const forbiddenTextPatterns = [
  {
    category: "durable-rating",
    phrases: [
      "Coward's Game has durable permanent ratings",
      "trial ladder points are permanent player ratings",
      "durable permanent ratings are available",
      "durable permanent rating is available",
      "permanent player ratings are live",
    ],
    patterns: [
      /\b(?:permanent|durable|lifetime)\s+(?:player\s+)?ratings?\b/i,
      /\b(?:ratings?|rankings?)\s+(?:are\s+)?(?:permanent|durable|lifetime)\b/i,
    ],
  },
  {
    category: "all-time-ranking",
    phrases: [
      "Coward's Game publishes all-time rankings",
      "all-time rankings are available",
      "official lifetime rank",
    ],
    patterns: [
      /\ball[-\s]?time\s+(?:rankings?|leaderboards?)\b/i,
      /\b(?:official\s+)?lifetime\s+rank(?:ing)?s?\b/i,
    ],
  },
  {
    category: "rating-refund",
    phrases: [
      "Invalidated Matches refund permanent rating",
      "rating refunds are available",
      "governance can repair lost rating points",
    ],
    patterns: [
      /\b(?:refund|repair|restore|return)s?\s+(?:permanent\s+)?rating\s+points?\b/i,
      /\brating\s+refunds?\b/i,
    ],
  },
  {
    category: "mature-staffed-moderation",
    phrases: [
      "Every dispute receives staffed moderation review",
      "appeals have guaranteed human moderator SLAs",
      "staffed moderation is available",
    ],
    patterns: [
      /\bstaffed\s+moderation\b/i,
      /\bguaranteed\s+human\s+moderator\s+SLAs?\b/i,
      /\bevery\s+dispute\s+receives\s+(?:staffed|human)\s+(?:moderation|review)\b/i,
    ],
  },
  {
    category: "production-sandbox",
    phrases: [
      "All runtime lanes provide production sandbox certification",
      "the Strategy sandbox is production certified",
      "production sandbox certification is available",
    ],
    patterns: [
      /\bproduction\s+sandbox\s+certification\b/i,
      /\bStrategy\s+sandbox\s+is\s+production\s+certified\b/i,
      /\bruntime\s+lanes?\b[^.\n]{0,80}\bproduction\s+(?:certified|sandbox)\b/i,
    ],
  },
  {
    category: "package-ecosystem",
    phrases: [
      "Strategies can use the full npm ecosystem",
      "Python package installs are supported in counted play",
      "package ecosystem support is available",
    ],
    patterns: [
      /\bfull\s+npm\s+ecosystem\b/i,
      /\bpackage\s+ecosystem\s+support\b/i,
      /\b(?:Python|TypeScript|JavaScript|Rust|Zig|TinyGo)\s+package\s+installs?\b[^.\n]{0,80}\b(?:supported|available|eligible)\b/i,
    ],
  },
  {
    category: "tinygo-production",
    phrases: [
      "TinyGo is a production Strategy lane",
      "TinyGo entries are eligible for counted competition",
      "TinyGo production support is available",
    ],
    patterns: [
      /\bTinyGo\b(?!-)[^.\n"`]{0,100}\b(?:production|counted|eligible|supported|public)\b/i,
      /\bproduction\s+TinyGo\b/i,
    ],
  },
  {
    category: "raw-diagnostic",
    phrases: [
      "Public results show raw runtime diagnostics",
      "players can inspect raw provider stderr in public replay",
      "raw diagnostics are public",
    ],
    patterns: [
      /\braw\s+(?:runtime\s+)?diagnostics?\b(?:\s+(?:are|is))?\s+(?:public|shown|visible|available)\b/i,
      /\braw\s+provider\s+stderr\b/i,
    ],
  },
  {
    category: "private-runtime",
    phrases: [
      "Public pages expose private runtime internals",
      "runtime provider secrets are part of public evidence",
      "private runtime internals are public",
    ],
    patterns: [
      /\bprivate\s+runtime\s+internals?\b(?:\s+(?:are|is))?\s+(?:public|shown|visible|available|exposed)\b/i,
      /\bruntime\s+provider\s+secrets?\b(?:\s+\w+){0,8}\s+public\b/i,
    ],
  },
] as const

const privateTextMarkers = [
  ...COMPETITION_POLICY_V1_36_PRIVACY_EXCLUSIONS,
] as const

const privateTextPatterns = privateTextMarkers.map((marker) => ({
  marker,
  pattern: new RegExp(
    `\\bpublic(?:ly)?\\b[^.\\n]{0,60}\\b(?:exposes?|includes?|returns?|publishes?|leaks?|shows?)\\b[^.\\n]{0,100}\\b${escapeRegExp(
      marker,
    ).replaceAll("\\ ", "\\s+")}\\b`,
    "i",
  ),
}))

const negatedPolicyLinePattern =
  /\b(?:must not|do not|does not|not expose|not exposed|never expose|without|excluded|excludes|forbidden|denylist|privacy exclusion|must stay|avoid|omit|omits|but not|fail if|no public|not public|no durable|not durable|no permanent|not permanent|rejects?)\b/i

const forbiddenSuppressionPhrases = (
  entry: (typeof forbiddenTextPatterns)[number],
): readonly string[] => {
  const phrases = new Set<string>(entry.phrases)
  for (const phrase of entry.phrases) {
    for (const pattern of entry.patterns) {
      const match = phrase.match(pattern)
      if (match?.[0] !== undefined) {
        phrases.add(match[0])
      }
    }
  }
  return [...phrases].sort()
}

const createDefaultSuppressions = (): readonly V136CompetitionPolicyScanSuppression[] => {
  const paths = [
    "packages/spec/src/competition-policy-v1-36.ts",
    "scripts/evaluate-v1-36-competition-policy.ts",
    "scripts/evaluate-v1-36-competition-policy.test.ts",
    "scripts/check-boundary-monitors.test.ts",
    ".planning/artifacts/v1.36-competition-surface-inventory.md",
    ".planning/artifacts/v1.36-competition-surface-inventory.json",
    ".planning/phases/249-competition-surface-inventory-and-policy-lock/249-01-PLAN.md",
    ".planning/phases/249-competition-surface-inventory-and-policy-lock/249-02-PLAN.md",
    ".planning/phases/249-competition-surface-inventory-and-policy-lock/249-03-PLAN.md",
    ".planning/phases/249-competition-surface-inventory-and-policy-lock/249-CONTEXT.md",
    ".planning/phases/249-competition-surface-inventory-and-policy-lock/249-VALIDATION.md",
    ".planning/phases/249-competition-surface-inventory-and-policy-lock/249-RESEARCH.md",
    ".planning/phases/249-competition-surface-inventory-and-policy-lock/249-PATTERNS.md",
    ".planning/phases/249-competition-surface-inventory-and-policy-lock/249-REVIEW.md",
    ".planning/research/ARCHITECTURE.md",
    ".planning/research/FEATURES.md",
    ".planning/research/PITFALLS.md",
    ".planning/research/SUMMARY.md",
    ".planning/research/v1.9-GO-READMODEL.md",
    ".planning/research/v1.9-RUNTIME-ISOLATION.md",
  ]
  const suppressions: V136CompetitionPolicyScanSuppression[] = []
  for (const suppressionPath of paths) {
    for (const entry of forbiddenTextPatterns) {
      for (const matchedPhrase of forbiddenSuppressionPhrases(entry)) {
        suppressions.push({
          path: suppressionPath,
          category: entry.category,
          matchedPhrase,
          rationale:
            "Intentional policy, artifact, or test fixture text documents forbidden examples and monitor calibration without making a product claim.",
          owner: "Phase 249 static monitor",
          expiry: "2026-12-31",
        })
      }
    }
    for (const matchedPhrase of privateTextMarkers) {
      suppressions.push({
        path: suppressionPath,
        category: "private-marker",
        matchedPhrase,
        rationale:
          "Intentional policy, artifact, or test fixture text documents private-marker exclusions without exposing a product payload.",
        owner: "Phase 249 static monitor",
        expiry: "2026-12-31",
      })
    }
  }
  return suppressions
}

const phase249LegacyPolicyCalibrationPaths = [
  ".planning/artifacts/v1.36-competition-surface-inventory.json",
  ".planning/artifacts/v1.36-competition-surface-inventory.md",
  ".planning/MILESTONES.md",
  ".planning/PROJECT.md",
  ".planning/REQUIREMENTS.md",
  ".planning/RETROSPECTIVE.md",
  ".planning/ROADMAP.md",
  ".planning/STATE.md",
  ".planning/phases/249-competition-surface-inventory-and-policy-lock/249-03-PLAN.md",
  ".planning/phases/249-competition-surface-inventory-and-policy-lock/249-DISCUSSION-LOG.md",
  ".planning/phases/249-competition-surface-inventory-and-policy-lock/249-PATTERNS.md",
  ".planning/phases/249-competition-surface-inventory-and-policy-lock/249-RESEARCH.md",
  ".planning/research/ARCHITECTURE.md",
  ".planning/research/FEATURES.md",
  ".planning/research/PITFALLS.md",
  ".planning/research/STACK.md",
  ".planning/research/SUMMARY.md",
  ".planning/research/v1.24-SUMMARY.md",
  ".planning/research/v1.25-SUMMARY.md",
  ".planning/research/v1.33-SUMMARY.md",
  ".planning/research/v1.5-STRATEGY-LIBRARY.md",
  ".planning/research/v1.5-SUMMARY.md",
  "packages/runtime-js/src/sandbox-evaluation.ts",
  "packages/spec/src/runtime.ts",
  "scripts/check-boundary-monitors.ts",
  "scripts/evaluate-v1-36-competition-policy.ts",
  "scripts/evaluate-runtime-sandbox.ts",
  "scripts/evaluate-v1-23-wasm-wasi-beta.ts",
  "scripts/evaluate-v1-24-runtime-abuse-lab.ts",
  "scripts/evaluate-v1-26-match-execution-reliability.ts",
  "scripts/evaluate-v1-28-match-execution-operations.ts",
  "scripts/evaluate-v1-30-match-intelligence-workbench.ts",
  "scripts/evaluate-v1-33-tinygo-wasi-spike.ts",
  "scripts/evaluate-v1-34-workshop-checker.ts",
  "scripts/evaluate-v1-35-account-provider-entry-proof.ts",
  "scripts/evaluate-v1-35-boundary-surface-inventory.ts",
  "scripts/evaluate-v1-35-final-proof.ts",
  "scripts/evaluate-v1-35-package-policy-proof.ts",
  "scripts/evaluate-v1-35-sandbox-readiness-proof.ts",
  "scripts/evaluate-wasm-wasi-runtime.ts",
] as const

const phase249AdditionalCalibrationPhrases: Record<string, readonly string[]> = {
  "durable-rating": [
    "durable rating",
    "durable ratings",
    "permanent rating",
    "permanent ratings",
    "rankings are durable",
  ],
  "all-time-ranking": ["all-time ranking", "all-time rankings"],
  "rating-refund": ["rating refund", "rating refunds"],
  "mature-staffed-moderation": ["staffed moderation"],
  "production-sandbox": [
    "Production sandbox certification",
    "production sandbox certification",
    "runtime lane can claim production sandbox",
    "runtime lanes provide production sandbox",
    "runtime lanes, sandbox readiness evidence, and actual production sandbox",
  ],
  "package-ecosystem": [
    "Package ecosystem support",
    "package ecosystem support",
  ],
  "tinygo-production": [
    "Production TinyGo",
    "TinyGo production",
    "TinyGo production claims, raw diagnostic public claims, and private runtime public",
    "TinyGo production support, ABI migration to direct exports or Component Model/WIT, production",
    "TinyGo remains spike-only and hidden from production",
    "TinyGo spike work should live in evidence/prototype artifacts until a later production",
    "TinyGo is not part of this production",
    "TinyGo leaked into production",
    "TinyGo, draft/non-execution revision, unavailable runtime, same-user counted",
    "TinyGo, invalid provenance, package-policy bypass, same-user counted",
    "TinyGo, invalid provenance, unavailable runtime lane, package-policy violation, same-user counted",
    "TinyGo, with production",
    "TinyGo compile failed before runtime execution; stderr redacted to keep toolchain paths out of public",
    "TinyGo remains a hidden spike-only lane and is absent from public/default production",
  ],
  "raw-diagnostic": ["raw diagnostic public"],
}

const phase249PostureDeferredRows = new Set([
  "competition-index-route",
  "competition-detail-route",
  "competition-entry-route",
  "ladder-season-route",
  "player-public-route",
  "strategy-public-route",
  "replay-public-route",
  "matchset-result-view-model",
  "public-trust-copy",
  "competition-copy-fixtures",
  "competition-copy-snapshots",
])

export const createV136CompetitionPolicyPhase249ScanSuppressions =
  (
    options: { includePostureDeferrals?: boolean } = {},
  ): readonly V136CompetitionPolicyScanSuppression[] => {
    const suppressions: V136CompetitionPolicyScanSuppression[] = []
    for (const suppressionPath of phase249LegacyPolicyCalibrationPaths) {
      for (const entry of forbiddenTextPatterns) {
        const matchedPhrases = new Set([
          ...forbiddenSuppressionPhrases(entry),
          ...(phase249AdditionalCalibrationPhrases[entry.category] ?? []),
        ])
        for (const matchedPhrase of matchedPhrases) {
          suppressions.push({
            path: suppressionPath,
            category: entry.category,
            matchedPhrase,
            rationale:
              "Existing planning/proof artifact documents policy boundaries or historical non-claims; it is not player-facing competition copy.",
            owner: "Phase 249 static monitor",
            expiry: "2026-12-31",
          })
        }
      }
      for (const matchedPhrase of privateTextMarkers) {
        suppressions.push({
          path: suppressionPath,
          category: "private-marker",
          matchedPhrase,
          rationale:
            "Existing planning/proof artifact documents privacy exclusions; it is not player-facing competition copy.",
          owner: "Phase 249 static monitor",
          expiry: "2026-12-31",
        })
      }
    }
    if (options.includePostureDeferrals !== false) {
      for (const row of authoritativeRows) {
        if (!phase249PostureDeferredRows.has(row.id)) {
          continue
        }
        for (const reference of row.references) {
          suppressions.push({
            path: reference,
            category: "required-posture-label",
            matchedPhrase: row.requiredPostureCopy,
            rationale:
              "Phase 249 inventories this public trust surface; Phase 254 or the row disposition phase owns rendering the player-facing posture copy.",
            owner: "Phase 249 static monitor",
            expiry: "2026-12-31",
          })
          suppressions.push({
            path: reference,
            category: "required-reset-no-durable-copy",
            matchedPhrase: row.requiredResetNoDurableCopy,
            rationale:
              "Phase 249 inventories this public trust surface; Phase 254 or the row disposition phase owns rendering reset/no-durable copy.",
            owner: "Phase 249 static monitor",
            expiry: "2026-12-31",
          })
        }
      }
    }
    return suppressions
  }

const withPhase249ScanSuppressions = (
  options: GenerateV136CompetitionSurfaceInventoryOptions = {},
): GenerateV136CompetitionSurfaceInventoryOptions => ({
    ...options,
  suppressions: [
    ...createV136CompetitionPolicyPhase249ScanSuppressions({
      includePostureDeferrals: options.rows === undefined,
    }),
    ...(options.suppressions ?? []),
  ],
})

const currentScanDate = generatedAt

const validateSuppression = (
  suppression: V136CompetitionPolicyScanSuppression,
): string | null => {
  for (const field of [
    "path",
    "category",
    "matchedPhrase",
    "rationale",
    "owner",
    "expiry",
  ] as const) {
    if (!isNonEmptyString(suppression[field])) {
      return `invalid suppression for ${suppression.path || "<missing path>"} ${suppression.category || "<missing category>"} missing ${field}`
    }
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(suppression.expiry)) {
    return `invalid suppression for ${suppression.path} ${suppression.category} has invalid expiry ${suppression.expiry}`
  }
  if (suppression.expiry < currentScanDate) {
    return `invalid suppression for ${suppression.path} ${suppression.category} expired ${suppression.expiry}`
  }
  return null
}

const getSuppressions = (
  options: GenerateV136CompetitionSurfaceInventoryOptions,
): readonly V136CompetitionPolicyScanSuppression[] => [
  ...(options.includeDefaultSuppressions === false
    ? []
    : createDefaultSuppressions()),
  ...(options.suppressions ?? []),
]

const isSuppressed = (
  finding: V136CompetitionPolicyScanFinding,
  suppressions: readonly V136CompetitionPolicyScanSuppression[],
): boolean =>
  suppressions.some(
    (suppression) =>
      normalizeScanPath(suppression.path) === finding.path &&
      suppression.category === finding.category &&
      suppression.matchedPhrase.toLowerCase() ===
        finding.matchedPhrase.toLowerCase(),
  )

const findingToFailure = (
  finding: V136CompetitionPolicyScanFinding,
): string =>
  `${finding.path} ${finding.category}: ${finding.message} (${finding.matchedPhrase})`

export const scanV136CompetitionPolicyTextRoots = (
  options: GenerateV136CompetitionSurfaceInventoryOptions = {},
): V136CompetitionPolicyScanResult => {
  const root = options.repoRoot ?? repoRoot
  const configuredRoots = options.scanRoots ?? defaultScanRoots
  const scannedRoots = [
    ...configuredRoots.map(normalizeScanPath),
    ...discoverFixtureAndSnapshotRoots(root, configuredRoots),
  ]
  const scannedFiles = collectTextFiles(root, scannedRoots)
  const scannedFileSet = new Set(scannedFiles.map((file) => file.path))
  const findings: V136CompetitionPolicyScanFinding[] = []
  const suppressions = getSuppressions(options)
  const invalidSuppressions = suppressions
    .map(validateSuppression)
    .filter((failure): failure is string => failure !== null)
  const validSuppressions =
    invalidSuppressions.length > 0
      ? []
      : suppressions.map((suppression) => ({
          ...suppression,
          path: normalizeScanPath(suppression.path),
        }))

  for (const file of scannedFiles) {
    const text = readFileSync(path.join(root, file.path), "utf8")
    for (const { category, phrases, patterns } of forbiddenTextPatterns) {
      const matchers = [
        ...phrases.map((phrase) => ({
          phrase,
          pattern: new RegExp(escapeRegExp(phrase), "i"),
        })),
        ...patterns.map((pattern) => ({ phrase: "", pattern })),
      ]
      for (const matcher of matchers) {
        for (const line of text.split("\n")) {
          if (negatedPolicyLinePattern.test(line)) {
            continue
          }
          const match = line.match(matcher.pattern)
          if (match !== null) {
            findings.push({
              path: file.path,
              category,
              message: `clear violation for forbidden ${category} claim`,
              matchedPhrase: matcher.phrase || match[0],
            })
            break
          }
        }
      }
    }
    for (const { marker, pattern } of privateTextPatterns) {
      const matchedLine = text
        .split("\n")
        .find((line) => pattern.test(line) && !negatedPolicyLinePattern.test(line))
      if (matchedLine !== undefined) {
        findings.push({
          path: file.path,
          category: "private-marker",
          message: `private marker must not appear in public/default output: ${marker}`,
          matchedPhrase: marker,
        })
      }
    }
  }

  const inventory = generateV136CompetitionSurfaceInventory(options)
  for (const row of inventory.rows) {
    if (!row.postureLabelRequired) {
      continue
    }
    const referenceTexts = row.references
      .map(normalizeScanPath)
      .filter((reference) => scannedFileSet.has(reference))
      .map((reference) => ({
        path: reference,
        text: readFileSync(path.join(root, reference), "utf8"),
      }))
    if (referenceTexts.length === 0) {
      continue
    }
    const hasPosture = referenceTexts.some(({ text }) =>
      text.includes(row.requiredPostureCopy),
    )
    const hasResetNoDurable = referenceTexts.some(({ text }) =>
      text.includes(row.requiredResetNoDurableCopy) ||
      (text.includes(COMPETITION_POLICY_V1_36_POSTURE.standingsScope) &&
        text.includes(COMPETITION_POLICY_V1_36_POSTURE.durableRatingPromise)),
    )
    if (!hasPosture) {
      for (const reference of referenceTexts) {
        findings.push({
          path: reference.path,
          category: "required-posture-label",
          message: `${row.id} missing required posture label`,
          matchedPhrase: row.requiredPostureCopy,
        })
      }
    }
    if (!hasResetNoDurable) {
      for (const reference of referenceTexts) {
        findings.push({
          path: reference.path,
          category: "required-reset-no-durable-copy",
          message: `${row.id} missing required reset/no-durable copy`,
          matchedPhrase: row.requiredResetNoDurableCopy,
        })
      }
    }
  }

  return {
    scannedRoots,
    scannedFiles,
    findings: findings.filter(
      (finding) => !isSuppressed(finding, validSuppressions),
    ),
    invalidSuppressions,
  }
}

export const checkV136CompetitionPolicyScan = (
  options: GenerateV136CompetitionSurfaceInventoryOptions = {},
): readonly string[] => {
  const scan = scanV136CompetitionPolicyTextRoots(options)
  return [
    ...scan.invalidSuppressions,
    ...scan.findings.map(findingToFailure),
  ]
}

export const checkV136CompetitionSurfaceInventoryArtifacts = (
  options: GenerateV136CompetitionSurfaceInventoryOptions = {},
): readonly string[] => {
  const root = options.repoRoot ?? repoRoot
  const inventory = generateV136CompetitionSurfaceInventory(options)
  const expectedJson = renderV136CompetitionSurfaceInventoryJson(inventory)
  const expectedMarkdown = renderV136CompetitionSurfaceInventoryMarkdown(inventory)
  const failures: string[] = []
  const jsonPath = path.join(root, artifactPaths.json)
  const markdownPath = path.join(root, artifactPaths.markdown)

  if (!existsSync(jsonPath)) {
    failures.push(`${artifactPaths.json} is missing`)
  }
  if (!existsSync(markdownPath)) {
    failures.push(`${artifactPaths.markdown} is missing`)
  }
  if (failures.length > 0) {
    return failures
  }

  const actualJsonText = readFileSync(jsonPath, "utf8")
  const actualMarkdown = readFileSync(markdownPath, "utf8")
  let actualJson: V136CompetitionSurfaceInventory | undefined
  try {
    actualJson = JSON.parse(actualJsonText) as V136CompetitionSurfaceInventory
  } catch {
    return [`${artifactPaths.json} is invalid JSON`]
  }

  const validationFailures = validateV136CompetitionSurfaceInventory(actualJson)
  failures.push(
    ...validationFailures.map(
      (failure) => `${artifactPaths.json} is invalid: ${failure}`,
    ),
  )

  if (actualJsonText !== expectedJson) {
    failures.push(`${artifactPaths.json} is stale`)
  }
  if (actualMarkdown !== expectedMarkdown) {
    failures.push(`${artifactPaths.markdown} is stale`)
  }
  failures.push(
    ...collectArtifactSynchronizationFailures(actualJson, actualMarkdown),
  )
  return failures
}

export const writeV136CompetitionSurfaceInventoryArtifacts = (
  options: GenerateV136CompetitionSurfaceInventoryOptions = {},
): void => {
  const root = options.repoRoot ?? repoRoot
  const inventory = generateV136CompetitionSurfaceInventory(options)
  const jsonPath = path.join(root, artifactPaths.json)
  const markdownPath = path.join(root, artifactPaths.markdown)
  mkdirSync(path.dirname(jsonPath), { recursive: true })
  mkdirSync(path.dirname(markdownPath), { recursive: true })
  writeFileSync(jsonPath, renderV136CompetitionSurfaceInventoryJson(inventory))
  writeFileSync(
    markdownPath,
    renderV136CompetitionSurfaceInventoryMarkdown(inventory),
  )
}

const runCli = (): void => {
  const flag = process.argv[2]
  if (flag === "--write") {
    writeV136CompetitionSurfaceInventoryArtifacts()
    console.log(
      `wrote ${artifactPaths.markdown} and ${artifactPaths.json} from ${generatedBy}`,
    )
    return
  }
  if (flag === "--check") {
    const options = withPhase249ScanSuppressions()
    const failures = [
      ...checkV136CompetitionSurfaceInventoryArtifacts(options),
      ...checkV136CompetitionPolicyScan(options),
    ]
    if (failures.length > 0) {
      console.error(failures.join("\n"))
      process.exitCode = 1
      return
    }
    console.log("v1.36 competition policy artifacts are current")
    return
  }
  if (flag === undefined) {
    console.log(
      renderV136CompetitionSurfaceInventoryMarkdown(
        generateV136CompetitionSurfaceInventory(),
      ),
    )
    return
  }
  console.error(`Unknown flag ${flag}. Use --write or --check.`)
  process.exitCode = 1
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCli()
}
