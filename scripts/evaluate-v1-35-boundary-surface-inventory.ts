#!/usr/bin/env -S pnpm exec tsx
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
)

export const schemaVersion = "v1.35-boundary-surface-inventory" as const
export const milestone = "v1.35" as const
export const generatedAt = "2026-06-14" as const
export const generatedBy =
  "scripts/evaluate-v1-35-boundary-surface-inventory.ts" as const

export type V135BoundarySurfaceGroup =
  | "account-save"
  | "account-source-read"
  | "owner-debug-replay"
  | "workshop-alias"
  | "competition-entry"
  | "go-read-write"
  | "provider-proof"
  | "sandbox-claim"
  | "package-policy"
  | "tinygo-visibility"
  | "privacy-monitor"
  | "evidence-artifact"

export type V135BoundaryDisposition =
  | "fix-now"
  | "quarantine"
  | "deprecate-remove"
  | "document-only"
  | "future"

export type V135RequirementId =
  | "INV-01"
  | "INV-02"
  | "INV-03"
  | "ACCT-01"
  | "ACCT-02"
  | "ACCT-03"
  | "ACCT-04"
  | "ACCT-05"
  | "ENTRY-01"
  | "ENTRY-02"
  | "ENTRY-03"
  | "ENTRY-04"
  | "AUTH-01"
  | "AUTH-02"
  | "PRIV-01"
  | "PRIV-02"
  | "API-01"
  | "API-02"
  | "API-03"
  | "SBOX-01"
  | "SBOX-02"
  | "LABEL-01"
  | "LABEL-02"
  | "PKG-01"
  | "PKG-02"
  | "PKG-03"
  | "PKG-04"
  | "PROOF-01"
  | "PROOF-02"
  | "PROOF-03"
  | "PROOF-04"
  | "PROOF-05"

export interface V135BoundarySurfaceRow {
  id: string
  surfaceGroup: V135BoundarySurfaceGroup
  codeReferences: readonly string[]
  currentOwner: string
  intendedOwner: string
  trustBoundary: string
  dataClass: "public" | "session" | "owner-private" | "internal-private"
  affectedRequirements: readonly V135RequirementId[]
  currentBehavior: string
  disposition: V135BoundaryDisposition
  requiredTestsOrProof: readonly string[]
  privacyRisks: readonly string[]
  downstreamPhase: 244 | 245 | 246 | 247 | 248 | "none"
}

export interface V135BoundarySurfaceInventory {
  schemaVersion: typeof schemaVersion
  milestone: typeof milestone
  generatedBy: typeof generatedBy
  generatedAt: typeof generatedAt
  requiredSurfaceGroups: readonly V135BoundarySurfaceGroup[]
  allowedSurfaceGroups: readonly V135BoundarySurfaceGroup[]
  allowedDispositions: readonly V135BoundaryDisposition[]
  allowedDataClasses: readonly V135BoundarySurfaceRow["dataClass"][]
  allowedDownstreamPhases: readonly V135BoundarySurfaceRow["downstreamPhase"][]
  allowedRequirementIds: readonly V135RequirementId[]
  forbiddenOverclaimPatterns: readonly string[]
  forbiddenPublicDefaultLeakageMarkers: readonly string[]
  globalPolicies: {
    phaseScope: string
    claimCalibration: readonly string[]
    privacyBoundary: readonly string[]
    behaviorHandoff: readonly string[]
  }
  sourceCoverageAudit: readonly V135SourceCoverageAuditEntry[]
  surfaces: readonly V135BoundarySurfaceRow[]
  rows: readonly V135BoundarySurfaceRow[]
}

export interface GenerateV135BoundarySurfaceInventoryOptions {
  repoRoot?: string
  rows?: readonly V135BoundarySurfaceRow[]
}

export interface V135SourceCoverageAuditEntry {
  command: string
  result: string
  coveredSurfaceFamilies: readonly {
    family: V135BoundarySurfaceGroup
    status: "COVERED"
    rowIds: readonly string[]
  }[]
}

export const requiredSurfaceGroups = [
  "account-save",
  "account-source-read",
  "owner-debug-replay",
  "workshop-alias",
  "competition-entry",
  "go-read-write",
  "provider-proof",
  "sandbox-claim",
  "package-policy",
  "tinygo-visibility",
  "privacy-monitor",
] as const satisfies readonly V135BoundarySurfaceGroup[]

export const allowedSurfaceGroups = [
  ...requiredSurfaceGroups,
  "evidence-artifact",
] as const satisfies readonly V135BoundarySurfaceGroup[]

export const allowedDispositions = [
  "fix-now",
  "quarantine",
  "deprecate-remove",
  "document-only",
  "future",
] as const satisfies readonly V135BoundaryDisposition[]

export const allowedDataClasses = [
  "public",
  "session",
  "owner-private",
  "internal-private",
] as const satisfies readonly V135BoundarySurfaceRow["dataClass"][]

export const allowedDownstreamPhases = [
  244,
  245,
  246,
  247,
  248,
  "none",
] as const satisfies readonly V135BoundarySurfaceRow["downstreamPhase"][]

export const allowedRequirementIds = [
  "INV-01",
  "INV-02",
  "INV-03",
  "ACCT-01",
  "ACCT-02",
  "ACCT-03",
  "ACCT-04",
  "ACCT-05",
  "ENTRY-01",
  "ENTRY-02",
  "ENTRY-03",
  "ENTRY-04",
  "AUTH-01",
  "AUTH-02",
  "PRIV-01",
  "PRIV-02",
  "API-01",
  "API-02",
  "API-03",
  "SBOX-01",
  "SBOX-02",
  "LABEL-01",
  "LABEL-02",
  "PKG-01",
  "PKG-02",
  "PKG-03",
  "PKG-04",
  "PROOF-01",
  "PROOF-02",
  "PROOF-03",
  "PROOF-04",
  "PROOF-05",
] as const satisfies readonly V135RequirementId[]

export const artifactPaths = {
  json: ".planning/artifacts/v1.35-boundary-surface-inventory.json",
  markdown: ".planning/artifacts/v1.35-boundary-surface-inventory.md",
} as const

const downstreamRequirementPrefixes = {
  244: ["ACCT-", "ENTRY-"],
  245: ["AUTH-", "PRIV-", "API-"],
  246: ["SBOX-", "LABEL-"],
  247: ["PKG-"],
  248: ["PROOF-"],
} as const satisfies Record<244 | 245 | 246 | 247 | 248, readonly string[]>

const downstreamRequirementLabels = {
  244: "ACCT-* or ENTRY-*",
  245: "AUTH-*, PRIV-*, or API-*",
  246: "SBOX-* or LABEL-*",
  247: "PKG-*",
  248: "PROOF-*",
} as const

const forbiddenOverclaimPatterns = [
  {
    phrase: "production sandbox certification",
    pattern:
      /\b(?:claims?|certifies?|certified|supports?|enables?|promotes?|declares?)\b[^.\n]{0,80}\bproduction sandbox certification\b/i,
  },
  {
    phrase: "TypeScript/Python WASM isolation",
    pattern:
      /\b(?:claims?|certifies?|certified|supports?|enables?|promotes?|declares?)\b[^.\n]{0,80}\bTypeScript\/Python WASM isolation\b/i,
  },
  {
    phrase: "TinyGo production support",
    pattern:
      /\b(?:claims?|certifies?|certified|supports?|enables?|promotes?|declares?)\b[^.\n]{0,80}\bTinyGo production support\b/i,
  },
  {
    phrase: "package ecosystem",
    pattern:
      /\b(?:claims?|certifies?|certified|supports?|enables?|promotes?|declares?)\b[^.\n]{0,80}\bpackage ecosystem(?: support)?\b/i,
  },
  {
    phrase: "rich-package",
    pattern:
      /\b(?:claims?|certifies?|certified|supports?|enables?|promotes?|declares?)\b[^.\n]{0,80}\brich-package(?: support)?\b/i,
  },
  {
    phrase: "host import",
    pattern:
      /\b(?:claims?|certifies?|certified|supports?|enables?|promotes?|declares?)\b[^.\n]{0,80}\bhost import(?: support)?\b/i,
  },
  {
    phrase: "production-supported package mode other than none",
    pattern: /\bpackage mode (?!`?none`?\b)[^.\n]{0,80}\bproduction-supported\b/i,
  },
] as const

const publicLeakageMarkers = [
  "raw diagnostics",
  "source",
  "artifact bytes",
  "host paths",
  "env values",
  "package paths",
  "tokens",
  "DB details",
  "private runtime internals",
  "StrategyMemory",
  "SoldierMemory",
  "objective payload",
] as const

const defaultRows = [
  {
    id: "account-save-go-typescript-proof",
    surfaceGroup: "account-save",
    codeReferences: [
      "apps/web/app/api/account/revisions/save/route.ts",
      "apps/web/lib/account-revision-write-boundary.ts",
      "apps/go-backend/live_backend.go#createStrategyRevision",
    ],
    currentOwner: "Web transport plus Go account revision write path",
    intendedOwner:
      "Go account save with runtime-service provider proof for execution-ready revisions",
    trustBoundary: "authenticated account request -> Go persistence write",
    dataClass: "owner-private",
    affectedRequirements: ["INV-01", "INV-02", "ACCT-01", "ACCT-02"],
    currentBehavior:
      "TypeScript account save is inventoried as current drift; Phase 244 owns provider-proof parity before eligibility claims.",
    disposition: "fix-now",
    requiredTestsOrProof: [
      "Phase 244 account-save provider proof tests for TypeScript, Python, Rust, and Zig",
    ],
    privacyRisks: [
      "Strategy source and provider diagnostics must remain owner-private.",
    ],
    downstreamPhase: 244,
  },
  {
    id: "account-source-read-private",
    surfaceGroup: "account-source-read",
    codeReferences: [
      "apps/web/app/api/account/revisions/[revisionId]/source/route.ts",
      "apps/go-backend/live_backend.go#getStrategyRevisionSource",
    ],
    currentOwner: "Web API transport and Go source read",
    intendedOwner: "Server-authorized account source read",
    trustBoundary: "account session -> private no-store source response",
    dataClass: "owner-private",
    affectedRequirements: ["INV-01", "INV-02", "AUTH-02"],
    currentBehavior:
      "Account source read is inventoried as owner-private and session-authorized.",
    disposition: "quarantine",
    requiredTestsOrProof: ["Phase 245 account source authorization tests"],
    privacyRisks: ["Strategy source must remain absent from public output."],
    downstreamPhase: 245,
  },
  {
    id: "owner-debug-replay-request",
    surfaceGroup: "owner-debug-replay",
    codeReferences: [
      "apps/web/app/matches/[matchId]/replay/owner-debug.ts",
      "apps/web/app/matches/server.test.ts",
    ],
    currentOwner: "Replay route owner-debug request parser",
    intendedOwner: "Server-authorized owner-private replay projection",
    trustBoundary: "replay request -> owner/participant authorization",
    dataClass: "owner-private",
    affectedRequirements: ["INV-01", "INV-02", "PRIV-01", "PRIV-02"],
    currentBehavior:
      "Query parameters can request owner view but must not grant private replay evidence.",
    disposition: "fix-now",
    requiredTestsOrProof: [
      "Phase 245 owner-debug authorization and public fallback tests",
    ],
    privacyRisks: ["Owner-debug payloads must remain absent from public replay."],
    downstreamPhase: 245,
  },
  {
    id: "workshop-source-alias",
    surfaceGroup: "workshop-alias",
    codeReferences: [
      "apps/web/app/api/workshop/source/route.ts",
      "apps/web/app/api/workshop/revisions/[revisionId]/source/route.ts",
    ],
    currentOwner: "Legacy Workshop source aliases",
    intendedOwner: "Deprecated, removed, hidden, or migrated Workshop alias policy",
    trustBoundary: "Workshop-local route -> source payload",
    dataClass: "owner-private",
    affectedRequirements: ["INV-01", "INV-02", "API-01", "API-02"],
    currentBehavior:
      "Aliases are inventoried as possible bypasses until Phase 245 locks route-by-route fate.",
    disposition: "deprecate-remove",
    requiredTestsOrProof: ["Phase 245 alias migration or removal tests"],
    privacyRisks: ["Alias routes must not bypass account authorization."],
    downstreamPhase: 245,
  },
  {
    id: "competition-entry-proof",
    surfaceGroup: "competition-entry",
    codeReferences: [
      "apps/go-backend/live_backend.go#createExhibition",
      "packages/persistence/src/competition.ts",
      "packages/persistence/src/ladder.ts",
    ],
    currentOwner: "Go and persistence entry gates",
    intendedOwner: "Provider-proof-backed entry eligibility",
    trustBoundary: "account revision -> entry eligibility",
    dataClass: "session",
    affectedRequirements: ["INV-01", "INV-02", "ENTRY-01", "ENTRY-02"],
    currentBehavior:
      "Entry proof drift is inventoried for Go and persistence parity in Phase 244.",
    disposition: "fix-now",
    requiredTestsOrProof: ["Phase 244 Go and persistence entry parity tests"],
    privacyRisks: ["Entry diagnostics must remain public-safe."],
    downstreamPhase: 244,
  },
  {
    id: "go-read-write-account",
    surfaceGroup: "go-read-write",
    codeReferences: ["apps/go-backend/live_backend.go"],
    currentOwner: "Go selected backend routes",
    intendedOwner: "Go-owned account and public read/write boundary",
    trustBoundary: "HTTP API -> Go backend -> PostgreSQL",
    dataClass: "session",
    affectedRequirements: ["INV-01", "INV-02", "ACCT-03", "ENTRY-03"],
    currentBehavior:
      "Go read/write surfaces are inventoried as the normal backend integration points.",
    disposition: "document-only",
    requiredTestsOrProof: ["Phase 244 Go route and persistence parity proof"],
    privacyRisks: ["Account writes must normalize provider failures safely."],
    downstreamPhase: 244,
  },
  {
    id: "provider-proof-runtime-service",
    surfaceGroup: "provider-proof",
    codeReferences: [
      "apps/runtime-service/src/server.ts",
      "packages/spec/src/workshop-checker.ts",
    ],
    currentOwner: "Runtime-service provider validation",
    intendedOwner: "Runtime-service provider validation",
    trustBoundary: "provider validation request -> proof metadata",
    dataClass: "internal-private",
    affectedRequirements: ["INV-01", "INV-02", "PROOF-01", "PROOF-02"],
    currentBehavior:
      "Provider proof remains runtime evidence and not a certification label.",
    disposition: "document-only",
    requiredTestsOrProof: ["Phase 248 service-backed provider proof"],
    privacyRisks: ["Provider signing material must remain private."],
    downstreamPhase: 248,
  },
  {
    id: "sandbox-claim-contract",
    surfaceGroup: "sandbox-claim",
    codeReferences: [
      "packages/spec/src/runtime.ts",
      ".planning/artifacts/v1.24-production-sandbox-readiness-matrix.md",
    ],
    currentOwner: "Spec runtime labels and readiness artifacts",
    intendedOwner: "Versioned sandbox-readiness contract",
    trustBoundary: "runtime metadata -> public/developer labels",
    dataClass: "public",
    affectedRequirements: ["INV-01", "INV-02", "SBOX-01", "SBOX-02"],
    currentBehavior:
      "Claims must stay calibrated: TypeScript/Python provenance-only, Rust/Zig immutable WASM/WASI Preview 1 artifact-backed, TinyGo spike-only/hidden, and no current lane certified.",
    disposition: "fix-now",
    requiredTestsOrProof: ["Phase 246 claim drift monitor"],
    privacyRisks: ["Public labels must avoid private runtime details."],
    downstreamPhase: 246,
  },
  {
    id: "package-policy-none",
    surfaceGroup: "package-policy",
    codeReferences: [
      "packages/spec/src/runtime.ts",
      "packages/spec/src/workshop-checker.ts",
    ],
    currentOwner: "Spec package policy",
    intendedOwner: "Production package mode none enforcement",
    trustBoundary: "strategy metadata -> validation and entry policy",
    dataClass: "public",
    affectedRequirements: ["INV-01", "INV-02", "PKG-01", "PKG-02"],
    currentBehavior:
      "Current production package policy keeps package mode `none` with no broad dependency enablement.",
    disposition: "fix-now",
    requiredTestsOrProof: ["Phase 247 package mode none monitor"],
    privacyRisks: ["Package diagnostics must omit path-like private details."],
    downstreamPhase: 247,
  },
  {
    id: "tinygo-hidden-spike",
    surfaceGroup: "tinygo-visibility",
    codeReferences: [
      ".planning/artifacts/v1.33-tinygo-wasi-spike-evidence.md",
      "packages/spec/src/runtime.ts",
    ],
    currentOwner: "Runtime evidence artifacts",
    intendedOwner: "TinyGo hidden spike-only policy",
    trustBoundary: "candidate runtime evidence -> production-visible labels",
    dataClass: "public",
    affectedRequirements: ["INV-01", "INV-02", "LABEL-01", "LABEL-02"],
    currentBehavior:
      "TinyGo remains spike-only and hidden from production surfaces.",
    disposition: "document-only",
    requiredTestsOrProof: ["Phase 246 TinyGo visibility monitor"],
    privacyRisks: ["Candidate evidence must not imply production visibility."],
    downstreamPhase: 246,
  },
  {
    id: "privacy-monitor-public-output",
    surfaceGroup: "privacy-monitor",
    codeReferences: [
      "packages/spec/src/public-output-privacy.ts",
      "scripts/check-boundary-monitors.ts",
    ],
    currentOwner: "Spec public-output privacy monitor",
    intendedOwner: "v1.35 public/default privacy proof",
    trustBoundary: "private runtime/account data -> public/default projection",
    dataClass: "public",
    affectedRequirements: ["INV-01", "INV-02", "PROOF-03", "PROOF-04"],
    currentBehavior:
      "Public/default projection rows require privacy proof coverage before Phase 248 closes.",
    disposition: "fix-now",
    requiredTestsOrProof: ["Phase 248 public/default privacy scan"],
    privacyRisks: ["Default outputs must redact private markers."],
    downstreamPhase: 248,
  },
  {
    id: "evidence-artifact-v135-inventory",
    surfaceGroup: "evidence-artifact",
    codeReferences: [
      ".planning/artifacts/v1.35-boundary-surface-inventory.md",
      ".planning/artifacts/v1.35-boundary-surface-inventory.json",
    ],
    currentOwner: "Phase 243 evaluator",
    intendedOwner: "Phase 243 evaluator and downstream monitor consumers",
    trustBoundary: "repo source inventory -> generated planning artifacts",
    dataClass: "internal-private",
    affectedRequirements: ["INV-01", "INV-02", "INV-03"],
    currentBehavior:
      "Inventory artifacts are generated from this deterministic evaluator and checked for stale or desynchronized rows.",
    disposition: "document-only",
    requiredTestsOrProof: [
      "scripts/evaluate-v1-35-boundary-surface-inventory.test.ts",
    ],
    privacyRisks: ["Artifacts must avoid embedding private payload examples."],
    downstreamPhase: "none",
  },
] as const satisfies readonly V135BoundarySurfaceRow[]

const authoritativeRows = [
  {
    id: "v135-account-save-go-typescript-proof",
    surfaceGroup: "account-save",
    codeReferences: [
      "apps/web/app/api/account/revisions/save/route.ts",
      "apps/web/lib/account-revision-write-boundary.ts",
      "apps/go-backend/live_backend.go#createStrategyRevision",
      "apps/go-backend/runtime_service_client.go#validateStrategy",
    ],
    currentOwner: "Web transport plus Go account revision write path",
    intendedOwner:
      "Go account save with runtime-service provider proof for execution-ready revisions",
    trustBoundary: "authenticated account request -> selected Go backend -> PostgreSQL revision write",
    dataClass: "owner-private",
    affectedRequirements: [
      "INV-01",
      "INV-02",
      "ACCT-01",
      "ACCT-02",
      "ACCT-03",
      "ACCT-04",
      "ACCT-05",
    ],
    currentBehavior:
      "TypeScript account save is inventoried as current local-validation drift while Python/Rust/Zig use runtime-service validation; Phase 244 owns provider-proof parity and fail-closed/non-execution draft behavior.",
    disposition: "fix-now",
    requiredTestsOrProof: [
      "Phase 244 account-save provider proof tests for TypeScript, Python, Rust, and Zig valid, invalid, draft/non-execution, unavailable-runtime, stale/missing/mismatched proof, malformed provider response, package-declared, unsupported-provider, and TinyGo-hidden states.",
    ],
    privacyRisks: [
      "Strategy source, raw diagnostics, artifact bytes, host paths, env values, package paths, tokens, DB details, provider signing material, and private runtime internals must not be public/default output.",
    ],
    downstreamPhase: 244,
  },
  {
    id: "v135-account-source-read-web-go-private",
    surfaceGroup: "account-source-read",
    codeReferences: [
      "apps/web/app/api/account/revisions/[revisionId]/source/route.ts",
      "apps/go-backend/live_backend.go#strategyRevisionSource",
    ],
    currentOwner: "Web API transport and Go account source read route",
    intendedOwner: "Server-authorized account source read with private/no-store response",
    trustBoundary: "account session -> owner-private Strategy source response",
    dataClass: "owner-private",
    affectedRequirements: ["INV-01", "INV-02", "AUTH-02", "PRIV-02"],
    currentBehavior:
      "Account source read is owner-private and session-authorized; Phase 245 must prove no local/no-auth shortcut can authorize it.",
    disposition: "quarantine",
    requiredTestsOrProof: [
      "Phase 245 account source authorization tests and public/default source absence scans.",
    ],
    privacyRisks: [
      "Strategy source is the explicit private payload and must remain absent from public/default replay, result, Strategy, entry, checker, and evidence outputs.",
    ],
    downstreamPhase: 245,
  },
  {
    id: "v135-owner-debug-replay-request-private",
    surfaceGroup: "owner-debug-replay",
    codeReferences: [
      "apps/web/app/matches/[matchId]/replay/owner-debug.ts",
      "apps/web/app/matches/[matchId]/replay/page.tsx",
      "apps/web/app/matches/server.test.ts",
      "apps/web/app/matches/[matchId]/replay/owner-debug.test.ts",
      "apps/web/app/workshop/workshop-client-state.ts#LOCAL_WORKSHOP_PLAYER_ID",
    ],
    currentOwner: "Replay owner-debug parser, server tests, and local Workshop owner-link helper",
    intendedOwner:
      "Server-authorized owner/participant or internal-test owner-private replay projection",
    trustBoundary: "replay query request -> server authorization -> public or owner-private projection",
    dataClass: "owner-private",
    affectedRequirements: [
      "INV-01",
      "INV-02",
      "AUTH-01",
      "PRIV-01",
      "PRIV-02",
    ],
    currentBehavior:
      "ownerDebug/debug query parameters request an owner view but must not grant private replay evidence; player:workshop-local remains an ephemeral Workshop/test identity.",
    disposition: "quarantine",
    requiredTestsOrProof: [
      "Phase 245 owner-debug authorization tests prove query parameters and player:workshop-local cannot authorize persisted account-owned revisions, private source reads, private replay, private analytics, or competition entry.",
    ],
    privacyRisks: [
      "Public/default replay must not expose owner-debug payloads, ownerPrivate projection data, raw Awareness Grids, StrategyMemory, SoldierMemory, objective payload, Strategy source, or raw diagnostics.",
    ],
    downstreamPhase: 245,
  },
  {
    id: "v135-workshop-alias-source-submit-save",
    surfaceGroup: "workshop-alias",
    codeReferences: [
      "apps/web/app/api/workshop/source/route.ts",
      "apps/web/app/api/workshop/revisions/[revisionId]/source/route.ts",
      "apps/web/app/api/workshop/revisions/route.ts",
      "apps/web/app/api/workshop/submit/route.ts",
      "apps/web/app/api/workshop/analytics/profiles/route.ts",
      "apps/web/app/api/workshop/tests/route.ts",
      "scripts/generate-typescript-surface-labels.ts",
    ],
    currentOwner: "Legacy and local Workshop compatibility API routes",
    intendedOwner:
      "Removed, hidden/local-only, migrated, or deprecated-with-tests alias policy",
    trustBoundary: "Workshop-local or compatibility request -> source/submit/save/test/analytics payload",
    dataClass: "owner-private",
    affectedRequirements: [
      "INV-01",
      "INV-02",
      "API-01",
      "API-02",
      "API-03",
      "AUTH-01",
    ],
    currentBehavior:
      "Workshop source, revision source, submit/save, analytics, and tests routes are inventoried as possible bypass surfaces until Phase 245 decides fate route by route.",
    disposition: "deprecate-remove",
    requiredTestsOrProof: [
      "Phase 245 alias migration/removal tests and retained-alias tests proving no provider-proof, account authorization, package policy, TinyGo hiding, or public/default privacy bypass.",
    ],
    privacyRisks: [
      "Aliases must not leak Strategy source, owner-private data, raw diagnostics, artifact bytes, provider internals, host paths, env values, package paths, tokens, DB details, or private runtime internals.",
    ],
    downstreamPhase: 245,
  },
  {
    id: "v135-competition-entry-go-persistence-proof",
    surfaceGroup: "competition-entry",
    codeReferences: [
      "apps/web/app/api/exhibitions/route.ts",
      "apps/web/app/api/ladder/seasons/[seasonId]/entries/route.ts",
      "apps/go-backend/live_backend.go#createExhibition",
      "apps/go-backend/live_backend.go#runtimeAllowsCountedPlay",
      "packages/persistence/src/competition.ts",
      "packages/persistence/src/ladder.ts",
    ],
    currentOwner: "Web entry transport, Go exhibition creation, and persistence competition/ladder gates",
    intendedOwner: "Provider-proof-backed entry eligibility with Go/persistence parity",
    trustBoundary: "saved account revision -> exhibition, competition, or ladder entry",
    dataClass: "session",
    affectedRequirements: [
      "INV-01",
      "INV-02",
      "ENTRY-01",
      "ENTRY-02",
      "ENTRY-03",
      "ENTRY-04",
    ],
    currentBehavior:
      "Go exhibition eligibility is looser for TypeScript provider proof than persistence competition/ladder reference gates; Phase 244 owns parity.",
    disposition: "fix-now",
    requiredTestsOrProof: [
      "Phase 244 Go and persistence eligibility tests for eligible, draft, invalid, stale-proof, missing-proof, mismatched-proof, unsupported-provider, package-declared, unavailable-runtime, and TinyGo cases.",
    ],
    privacyRisks: [
      "Entry diagnostics must remain public-safe and omit raw diagnostics, source, artifact bytes, host paths, env values, package paths, tokens, DB details, and private runtime internals.",
    ],
    downstreamPhase: 244,
  },
  {
    id: "v135-go-read-write-selected-boundaries",
    surfaceGroup: "go-read-write",
    codeReferences: [
      "apps/go-backend/live_backend.go#GET /account/strategy-revisions",
      "apps/go-backend/live_backend.go#POST /account/strategy-revisions",
      "apps/go-backend/live_backend.go#GET /account/strategy-revisions/{strategyRevisionId}/source",
      "apps/go-backend/live_backend.go#POST /matchsets",
      "apps/go-backend/live_backend.go#publicReplayEvidence",
      "apps/go-backend/live_backend.go#publicMatchSetSummary",
      "apps/go-backend/live_backend.go#currentUser",
      "apps/go-backend/main.go#public replay fixture validation",
      "apps/web/lib/public-go-read-client.ts",
    ],
    currentOwner: "Selected Go account, MatchSet, public replay, public summary, and session helper routes",
    intendedOwner: "Go-owned backend reads/writes with web adapters as schema/transport boundaries",
    trustBoundary: "HTTP API -> Go backend -> PostgreSQL/public projection",
    dataClass: "session",
    affectedRequirements: [
      "INV-01",
      "INV-02",
      "ACCT-03",
      "ENTRY-03",
      "AUTH-02",
      "PRIV-02",
      "PROOF-03",
    ],
    currentBehavior:
      "Go selected routes are the normal backend integration points for account revision writes/reads, public MatchSet summaries, public replay evidence, MatchSet creation, and session/owner checks.",
    disposition: "document-only",
    requiredTestsOrProof: [
      "Phase 244 Go route parity proof, Phase 245 owner/session authorization proof, and Phase 248 public-output privacy scans.",
    ],
    privacyRisks: [
      "Go public/default outputs must omit Strategy source, owner-private data, ownerDebug, StrategyMemory, SoldierMemory, objective payload, raw diagnostics, artifact bytes, host paths, env values, package paths, tokens, DB details, and private runtime internals.",
    ],
    downstreamPhase: 248,
  },
  {
    id: "v135-provider-proof-runtime-service-contract",
    surfaceGroup: "provider-proof",
    codeReferences: [
      "apps/go-backend/runtime_service_client.go",
      "apps/runtime-service/src/server.ts",
      "packages/spec/src/workshop-checker.ts",
      "packages/persistence/src/account-revisions.ts",
      "packages/persistence/src/workshop.ts",
      "packages/persistence/src/competition.ts",
      "packages/persistence/src/ladder.ts",
      ".planning/artifacts/v1.34-workshop-checker-contract.md",
      ".planning/artifacts/v1.34-workshop-checker-proof.md",
    ],
    currentOwner: "Runtime-service provider validation, Go client, spec checker contract, and persistence proof helpers",
    intendedOwner: "Runtime-service/provider proof boundary reused by account save, Workshop, entry, and final proof",
    trustBoundary: "hostile Strategy source/artifact validation -> provider metadata/proof -> public-safe projection",
    dataClass: "internal-private",
    affectedRequirements: [
      "INV-01",
      "INV-02",
      "ACCT-01",
      "ACCT-02",
      "ENTRY-01",
      "PROOF-01",
      "PROOF-02",
      "PROOF-03",
    ],
    currentBehavior:
      "Provider proof is runtime evidence and not a sandbox certification label; Go currently lacks TypeScript client parity while runtime-service and persistence references know provider artifact identity.",
    disposition: "fix-now",
    requiredTestsOrProof: [
      "Phase 244 TypeScript Go account-save provider proof integration and Phase 248 service-backed proof for matching source/artifact identity and provider metadata.",
    ],
    privacyRisks: [
      "Provider signing material, provider proof signatures, sourceArtifact bytesBase64, compiled artifact bytesBase64, raw diagnostics, host paths, env values, package paths, tokens, DB details, and private runtime internals are not public/default output.",
    ],
    downstreamPhase: 244,
  },
  {
    id: "v135-sandbox-claim-runtime-labels",
    surfaceGroup: "sandbox-claim",
    codeReferences: [
      "packages/spec/src/runtime.ts",
      "apps/web/app/learn/page.tsx",
      "apps/web/app/matchsets/evidence-copy.ts",
      "scripts/check-boundary-monitors.ts",
      "packages/runtime-js/src/sandbox-evaluation.ts",
      ".planning/artifacts/v1.24-production-sandbox-readiness-matrix.md",
      ".planning/artifacts/v1.24-runtime-abuse-lab-evidence.md",
    ],
    currentOwner: "Spec runtime labels, Learn/evidence copy, sandbox artifacts, and boundary monitors",
    intendedOwner: "Versioned sandbox-readiness/certification contract and fail-loud claim monitor",
    trustBoundary: "runtime evidence and metadata -> public/developer readiness labels",
    dataClass: "public",
    affectedRequirements: [
      "INV-01",
      "INV-02",
      "SBOX-01",
      "SBOX-02",
      "LABEL-01",
      "LABEL-02",
    ],
    currentBehavior:
      "Current labels and artifacts distinguish provenance evidence, immutable WASM/WASI Preview 1 artifact backing, candidate readiness, TinyGo spike-only/hidden posture, and no-certification state.",
    disposition: "fix-now",
    requiredTestsOrProof: [
      "Phase 246 claim contract and monitor reject positive overclaims for production sandbox certification, TypeScript/Python WASM isolation, TinyGo production support, package ecosystem support, rich-package support, host import support, and active direct-export/Component Model/WIT ABI claims.",
    ],
    privacyRisks: [
      "Claim artifacts and monitor output must avoid raw diagnostics, source, host paths, env values, tokens, DB details, package paths, artifact bytes, and private runtime internals.",
    ],
    downstreamPhase: 246,
  },
  {
    id: "v135-package-policy-none-current",
    surfaceGroup: "package-policy",
    codeReferences: [
      "packages/spec/src/runtime.ts",
      "packages/spec/src/workshop-checker.ts",
      "packages/runtime-js/src/validation.ts",
      "packages/runtime-python/src/validation.ts",
      "packages/runtime-wasm-wasi/src/validation.ts",
      "packages/runtime-js/src/revision.ts",
    ],
    currentOwner: "Spec runtime package policy, checker diagnostics, and runtime provider validators",
    intendedOwner: "Production package mode none enforcement plus future package-lane criteria",
    trustBoundary: "Strategy metadata/source/artifact -> validation, compatibility, entry, and public evidence policy",
    dataClass: "public",
    affectedRequirements: [
      "INV-01",
      "INV-02",
      "PKG-01",
      "PKG-02",
      "PKG-03",
      "PKG-04",
      "ENTRY-04",
    ],
    currentBehavior:
      "Current production package policy keeps package mode `none`; diagnostics classify forbidden imports/packages while future rich package work remains documented but disabled.",
    disposition: "fix-now",
    requiredTestsOrProof: [
      "Phase 247 package mode none monitor across account save, Workshop validation/submit, competition entry, runtime registry, compatibility keys, public evidence, and TypeScript/Python/Rust/Zig/TinyGo package diagnostics.",
    ],
    privacyRisks: [
      "Package diagnostics must omit package paths, host paths, env values, tokens, DB details, artifact bytes, raw compiler/runtime output, raw diagnostics, source, and private runtime internals; future criteria must not imply package ecosystem support, rich-package support, or host import support.",
    ],
    downstreamPhase: 247,
  },
  {
    id: "v135-package-policy-future-package-criteria",
    surfaceGroup: "package-policy",
    codeReferences: [
      ".planning/REQUIREMENTS.md#PKG-04",
      ".planning/artifacts/v1.35-v1.36-milestone-prompts.md",
    ],
    currentOwner: "Planning requirements",
    intendedOwner: "Future explicit package-lane milestone",
    trustBoundary: "future package-policy ideas -> current production no-package boundary",
    dataClass: "public",
    affectedRequirements: ["INV-01", "INV-02", "PKG-04"],
    currentBehavior:
      "Future package support criteria are documented without enabling packages in v1.35.",
    disposition: "future",
    requiredTestsOrProof: [
      "Phase 247 records future requirements for reproducible dependency resolution, lockfiles, supply-chain policy, native-code policy, sandboxed build/install, deterministic outputs, cache invalidation, privacy redaction, rollback, and runtime-boundary proof.",
    ],
    privacyRisks: [
      "Future package criteria must not imply current package ecosystem support, rich-package support, or host import support.",
    ],
    downstreamPhase: 247,
  },
  {
    id: "v135-tinygo-visibility-hidden-spike",
    surfaceGroup: "tinygo-visibility",
    codeReferences: [
      ".planning/artifacts/v1.33-tinygo-wasi-spike-evidence.md",
      "scripts/evaluate-v1-33-tinygo-wasi-spike.ts",
      "packages/spec/src/workshop-checker.ts#source formats",
      "packages/spec/src/runtime.ts#supported languages",
      "scripts/check-boundary-monitors.ts#TinyGo",
    ],
    currentOwner: "TinyGo spike artifact, source-format lists, and boundary monitor",
    intendedOwner: "Hidden spike-only TinyGo policy until a future explicit productionization milestone",
    trustBoundary: "candidate TinyGo evidence -> production-visible runtime/source-format labels",
    dataClass: "public",
    affectedRequirements: [
      "INV-01",
      "INV-02",
      "LABEL-01",
      "LABEL-02",
      "API-03",
      "PROOF-04",
    ],
    currentBehavior:
      "TinyGo remains spike-only/hidden, absent from production Workshop/source-format/account/entry/result/replay evidence surfaces, and monitored separately from production languages.",
    disposition: "quarantine",
    requiredTestsOrProof: [
      "Phase 246 monitor rejects TinyGo production support in source-format lists, account/entry support, product labels, result/replay evidence, and public docs.",
    ],
    privacyRisks: [
      "TinyGo spike evidence must not expose host paths, raw diagnostics, artifact bytes, env values, or private runtime internals and must not imply production visibility.",
    ],
    downstreamPhase: 246,
  },
  {
    id: "v135-privacy-monitor-public-default-forbidden",
    surfaceGroup: "privacy-monitor",
    codeReferences: [
      "packages/spec/src/public-output-privacy.ts",
      "packages/spec/src/workshop-checker.ts#privacy exclusions",
      "scripts/check-boundary-monitors.ts",
      "apps/go-backend/main_test.go#public forbidden markers",
      "apps/go-backend/runtime_service_client_test.go#redaction",
      "apps/web/e2e/replay.fixture.spec.ts",
      "apps/web/app/matches/server.test.ts",
      ".planning/artifacts/v1.34-workshop-checker-proof.md",
    ],
    currentOwner: "Spec privacy utilities, boundary monitors, Go/runtime-service/web tests, and v1.34 proof scan",
    intendedOwner: "v1.35 public/default privacy proof and monitor suite",
    trustBoundary: "private runtime/account/Match data -> public/default API, UI, logs, fixtures, and proof artifacts",
    dataClass: "public",
    affectedRequirements: [
      "INV-01",
      "INV-02",
      "PRIV-02",
      "PKG-03",
      "PROOF-03",
      "PROOF-04",
      "PROOF-05",
    ],
    currentBehavior:
      "Existing privacy utilities and tests scan public outputs and proof artifacts; Phase 248 owns expanded v1.35 coverage across corrected account/provider/package/sandbox boundaries.",
    disposition: "fix-now",
    requiredTestsOrProof: [
      "Phase 248 privacy scans cover account source routes, owner-debug replay, public replay/result pages and APIs, Workshop aliases, checker/provider proof responses, package diagnostics, logs/fixtures, and generated proof artifacts for all forbidden private markers.",
    ],
    privacyRisks: [
      "Public/default output must not expose raw diagnostics, Strategy source, artifact bytes, host paths, env values, package paths, tokens, DB details, private runtime internals, StrategyMemory, SoldierMemory, objective payload, owner-debug payloads, raw Awareness Grids, quarantine details, operator action details, or recovery payloads.",
    ],
    downstreamPhase: 248,
  },
  {
    id: "v135-evidence-artifact-prior-baselines",
    surfaceGroup: "evidence-artifact",
    codeReferences: [
      ".planning/artifacts/v1.34-workshop-checker-inventory.md",
      ".planning/artifacts/v1.34-workshop-checker-contract.md",
      ".planning/artifacts/v1.34-workshop-checker-proof.md",
      ".planning/artifacts/v1.32-language-surface-inventory.md",
      ".planning/artifacts/v1.32-four-language-parity-matrix.md",
      ".planning/artifacts/v1.24-production-sandbox-readiness-matrix.md",
      ".planning/artifacts/v1.33-tinygo-wasi-spike-evidence.md",
      ".planning/artifacts/v1.35-boundary-surface-inventory.md",
      ".planning/artifacts/v1.35-boundary-surface-inventory.json",
    ],
    currentOwner: "Prior milestone artifacts plus Phase 243 evaluator output",
    intendedOwner: "Historical baseline and locked v1.35 decision register for Phases 244-248",
    trustBoundary: "static repo evidence -> generated planning artifacts and downstream monitor inputs",
    dataClass: "public",
    affectedRequirements: ["INV-01", "INV-02", "INV-03", "PROOF-05"],
    currentBehavior:
      "Prior artifacts define the v1.34 checker baseline, v1.32 four-language baseline, v1.24 no-certification baseline, and v1.33 TinyGo spike baseline consumed by this deterministic v1.35 inventory.",
    disposition: "document-only",
    requiredTestsOrProof: [
      "Phase 243 evaluator --check keeps JSON/markdown synchronized; Phase 248 final validation records how later work resolves each row.",
    ],
    privacyRisks: [
      "Artifacts must describe source file paths and risk categories only; they must not embed private Strategy source, StrategyMemory, SoldierMemory, objective payload, raw diagnostics, artifact bytes, host paths, env values, package paths, tokens, DB details, or private runtime internals.",
    ],
    downstreamPhase: "none",
  },
] as const satisfies readonly V135BoundarySurfaceRow[]

const sourceCoverageAudit = [
  {
    command: "rg --files apps/web/app/api | sort",
    result:
      "COVERED account, Workshop, exhibition, ladder, replay, and selected public/test route families.",
    coveredSurfaceFamilies: [
      {
        family: "account-save",
        status: "COVERED",
        rowIds: ["v135-account-save-go-typescript-proof"],
      },
      {
        family: "account-source-read",
        status: "COVERED",
        rowIds: ["v135-account-source-read-web-go-private"],
      },
      {
        family: "workshop-alias",
        status: "COVERED",
        rowIds: ["v135-workshop-alias-source-submit-save"],
      },
      {
        family: "competition-entry",
        status: "COVERED",
        rowIds: ["v135-competition-entry-go-persistence-proof"],
      },
      {
        family: "go-read-write",
        status: "COVERED",
        rowIds: ["v135-go-read-write-selected-boundaries"],
      },
    ],
  },
  {
    command:
      'rg -n "createStrategyRevision|getStrategyRevisionSource|createMatchSet|getPublicReplayEvidence|account/revisions|matchset|competition|exhibition|replay|source" apps/go-backend/live_backend.go apps/go-backend/*.go',
    result:
      "COVERED Go account revision save/source, MatchSet/exhibition, public replay evidence, public summary, competition rows, and session/owner helpers.",
    coveredSurfaceFamilies: [
      {
        family: "account-save",
        status: "COVERED",
        rowIds: ["v135-account-save-go-typescript-proof"],
      },
      {
        family: "account-source-read",
        status: "COVERED",
        rowIds: ["v135-account-source-read-web-go-private"],
      },
      {
        family: "competition-entry",
        status: "COVERED",
        rowIds: ["v135-competition-entry-go-persistence-proof"],
      },
      {
        family: "go-read-write",
        status: "COVERED",
        rowIds: ["v135-go-read-write-selected-boundaries"],
      },
      {
        family: "privacy-monitor",
        status: "COVERED",
        rowIds: ["v135-privacy-monitor-public-default-forbidden"],
      },
    ],
  },
  {
    command:
      'rg -n "validate-strategy|providerProof|provider proof|runtime.validateStrategy|sourceArtifact|artifactHash|artifactBytes|COWARDS_PROVIDER_VALIDATION_SECRET" apps packages scripts .planning/artifacts',
    result:
      "COVERED runtime-service /validate-strategy, Go runtime client, provider HMAC proof, source/compiled artifact identity, persistence reference gates, and v1.34 proof artifacts.",
    coveredSurfaceFamilies: [
      {
        family: "provider-proof",
        status: "COVERED",
        rowIds: ["v135-provider-proof-runtime-service-contract"],
      },
      {
        family: "account-save",
        status: "COVERED",
        rowIds: ["v135-account-save-go-typescript-proof"],
      },
      {
        family: "privacy-monitor",
        status: "COVERED",
        rowIds: ["v135-privacy-monitor-public-default-forbidden"],
      },
    ],
  },
  {
    command:
      'rg -n "workshop.*(source|revision|submit|save)|compat|alias" apps/web/app/api apps/web/lib apps packages scripts',
    result:
      "COVERED Workshop source aliases, revision submit/save routes, analytics/test compatibility routes, and compatibility-key surfaces.",
    coveredSurfaceFamilies: [
      {
        family: "workshop-alias",
        status: "COVERED",
        rowIds: ["v135-workshop-alias-source-submit-save"],
      },
      {
        family: "package-policy",
        status: "COVERED",
        rowIds: ["v135-package-policy-none-current"],
      },
    ],
  },
  {
    command:
      'rg -n "player:workshop-local|ownerDebug|owner-debug|owner-private|ownerPrivate|StrategyMemory|SoldierMemory|objectivePayload|Awareness Grid" apps packages scripts .planning/artifacts',
    result:
      "COVERED local Workshop identity, owner-debug request/query handling, owner-private projection tests, Awareness Grid UI, and private-marker scans.",
    coveredSurfaceFamilies: [
      {
        family: "owner-debug-replay",
        status: "COVERED",
        rowIds: ["v135-owner-debug-replay-request-private"],
      },
      {
        family: "privacy-monitor",
        status: "COVERED",
        rowIds: ["v135-privacy-monitor-public-default-forbidden"],
      },
    ],
  },
  {
    command:
      'rg -n "sandbox|certified|certification|provenance-only|WASM isolation|WASI|Preview 1|TinyGo|spike-only|hidden" apps packages scripts .planning/artifacts',
    result:
      "COVERED sandbox/readiness artifacts, Learn/evidence copy, spec runtime labels, WASM/WASI Preview 1 metadata, TinyGo spike evidence, and boundary monitor claim checks.",
    coveredSurfaceFamilies: [
      {
        family: "sandbox-claim",
        status: "COVERED",
        rowIds: ["v135-sandbox-claim-runtime-labels"],
      },
      {
        family: "tinygo-visibility",
        status: "COVERED",
        rowIds: ["v135-tinygo-visibility-hidden-spike"],
      },
    ],
  },
  {
    command:
      'rg -n "package.mode|package mode|packages|dependency|host import|forbidden_import|package_or_dependency|rich package|Cargo|npm|PyPI|Zig package" apps packages scripts .planning/artifacts',
    result:
      "COVERED package mode, checker diagnostic categories, JS/Python/WASM package/import validators, package-path privacy markers, and future package criteria.",
    coveredSurfaceFamilies: [
      {
        family: "package-policy",
        status: "COVERED",
        rowIds: [
          "v135-package-policy-none-current",
          "v135-package-policy-future-package-criteria",
        ],
      },
      {
        family: "privacy-monitor",
        status: "COVERED",
        rowIds: ["v135-privacy-monitor-public-default-forbidden"],
      },
    ],
  },
  {
    command:
      'rg -n "PUBLIC_OUTPUT_FORBIDDEN_FIELDS|assertPublicOutputLeakSafe|raw diagnostics|artifact bytes|host paths|env values|tokens|DB details|private runtime internals|bytesBase64|artifactBytesBase64" apps packages scripts .planning/artifacts',
    result:
      "COVERED public-output privacy contract, boundary monitor scans, workshop checker exclusions, artifact bytes/base64 internals, and Go/runtime-service redaction tests.",
    coveredSurfaceFamilies: [
      {
        family: "privacy-monitor",
        status: "COVERED",
        rowIds: ["v135-privacy-monitor-public-default-forbidden"],
      },
    ],
  },
  {
    command:
      'rg -n "v1\\.34|v1\\.33|v1\\.32|v1\\.24|boundary monitor|boundary:monitors|check-boundary-monitors" .planning/artifacts scripts package.json',
    result:
      "COVERED v1.34 checker, v1.33 TinyGo, v1.32 language parity, v1.24 sandbox/runtime abuse artifacts, and active boundary monitor command chain.",
    coveredSurfaceFamilies: [
      {
        family: "evidence-artifact",
        status: "COVERED",
        rowIds: ["v135-evidence-artifact-prior-baselines"],
      },
      {
        family: "privacy-monitor",
        status: "COVERED",
        rowIds: ["v135-privacy-monitor-public-default-forbidden"],
      },
    ],
  },
] as const satisfies readonly V135SourceCoverageAuditEntry[]

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0

const rowSearchText = (row: V135BoundarySurfaceRow): string =>
  row.currentBehavior

export const generateV135BoundarySurfaceInventory = (
  options: GenerateV135BoundarySurfaceInventoryOptions = {},
): V135BoundarySurfaceInventory => {
  const surfaces = options.rows ?? authoritativeRows
  return {
    schemaVersion,
    milestone,
    generatedBy,
    generatedAt,
    requiredSurfaceGroups,
    allowedSurfaceGroups,
    allowedDispositions,
    allowedDataClasses,
    allowedDownstreamPhases,
    allowedRequirementIds,
    forbiddenOverclaimPatterns: forbiddenOverclaimPatterns.map(
      ({ phrase }) => phrase,
    ),
    forbiddenPublicDefaultLeakageMarkers: publicLeakageMarkers,
    globalPolicies: {
      phaseScope:
        "Phase 243 is inventory/contract/characterization only and must not change account proof, auth, sandbox, package, aliases, labels, runtime execution, or proof gates.",
      claimCalibration: [
        "TypeScript/Python are provenance-only.",
        "Rust/Zig are immutable WASM/WASI Preview 1 artifact-backed.",
        "TinyGo is spike-only/hidden.",
        "no current lane is production sandbox certified by default.",
        "package mode remains `none`.",
        "rich packages/package ecosystems/host imports are not production-supported.",
      ],
      privacyBoundary: [
        "Public/default output must not expose the D-09 forbidden marker set.",
        "Strategy source, StrategyMemory, SoldierMemory, objective payload, raw diagnostics, artifact bytes, host paths, env values, package paths, tokens, DB details, and private runtime internals are forbidden by default.",
      ],
      behaviorHandoff: [
        "Phase 244 owns account/provider proof and entry gate behavior changes.",
        "Phase 245 owns auth, owner-debug, local trust, and alias behavior changes.",
        "Phase 246 owns sandbox claim and runtime label behavior changes.",
        "Phase 247 owns package/dependency policy behavior changes.",
        "Phase 248 owns service-backed proof, privacy scans, and boundary monitors.",
      ],
    },
    sourceCoverageAudit,
    surfaces,
    rows: surfaces,
  }
}

export const validateV135BoundarySurfaceInventory = (
  inventory: V135BoundarySurfaceInventory,
): readonly string[] => {
  const errors: string[] = []

  if (inventory.schemaVersion !== schemaVersion) {
    errors.push(`schemaVersion must be ${schemaVersion}`)
  }
  if (inventory.milestone !== milestone) {
    errors.push(`milestone must be ${milestone}`)
  }

  const requiredGroups = new Set<V135BoundarySurfaceGroup>(requiredSurfaceGroups)
  const presentGroups = new Set(
    inventory.rows.map((row) => row.surfaceGroup),
  )
  for (const group of requiredGroups) {
    if (!presentGroups.has(group)) {
      errors.push(`missing required surface group ${group}`)
    }
  }

  const allowedGroups = new Set<V135BoundarySurfaceGroup>(allowedSurfaceGroups)
  const allowedDispositionSet =
    new Set<V135BoundaryDisposition>(allowedDispositions)
  const allowedDataClassSet =
    new Set<V135BoundarySurfaceRow["dataClass"]>(allowedDataClasses)
  const allowedPhaseSet =
    new Set<V135BoundarySurfaceRow["downstreamPhase"]>(allowedDownstreamPhases)
  const allowedRequirements = new Set<V135RequirementId>(allowedRequirementIds)
  const rowIds = new Set<string>()
  const rowFamilyCodeRefs = new Set<string>()

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
    if (!allowedDispositionSet.has(row.disposition)) {
      errors.push(`${row.id} has invalid disposition ${row.disposition}`)
    }
    if (!allowedDataClassSet.has(row.dataClass)) {
      errors.push(`${row.id} has invalid dataClass ${row.dataClass}`)
    }
    if (!allowedPhaseSet.has(row.downstreamPhase)) {
      errors.push(`${row.id} has invalid downstreamPhase ${row.downstreamPhase}`)
    }

    const requiredStringFields = [
      "currentOwner",
      "intendedOwner",
      "trustBoundary",
      "currentBehavior",
    ] as const
    for (const field of requiredStringFields) {
      if (!isNonEmptyString(row[field])) {
        errors.push(`${row.id} missing ${field}`)
      }
    }

    const requiredArrayFields = [
      "codeReferences",
      "affectedRequirements",
      "requiredTestsOrProof",
      "privacyRisks",
    ] as const
    for (const field of requiredArrayFields) {
      if (!Array.isArray(row[field]) || row[field].length === 0) {
        errors.push(`${row.id} missing ${field}`)
      }
    }

    for (const codeReference of row.codeReferences) {
      const duplicateKey = `${row.surfaceGroup}:${codeReference}`
      if (rowFamilyCodeRefs.has(duplicateKey)) {
        errors.push(
          `duplicate code reference ${codeReference} in surface group ${row.surfaceGroup}`,
        )
      }
      rowFamilyCodeRefs.add(duplicateKey)
    }

    for (const requirement of row.affectedRequirements) {
      if (!allowedRequirements.has(requirement)) {
        errors.push(`${row.id} has unknown requirement ${requirement}`)
      }
    }

    if (row.downstreamPhase === "none") {
      if (!row.affectedRequirements.some((requirement) => requirement.startsWith("INV-"))) {
        errors.push(`${row.id} downstreamPhase none must include INV traceability`)
      }
    } else {
      const requiredPrefixes = downstreamRequirementPrefixes[row.downstreamPhase]
      const hasDownstreamRequirement = row.affectedRequirements.some(
        (requirement) =>
          requiredPrefixes.some((prefix) => requirement.startsWith(prefix)),
      )
      if (!hasDownstreamRequirement) {
        errors.push(
          `${row.id} downstreamPhase ${row.downstreamPhase} requires ${downstreamRequirementLabels[row.downstreamPhase]} traceability, not only INV IDs`,
        )
      }
    }

    const text = rowSearchText(row)
    for (const { phrase, pattern } of forbiddenOverclaimPatterns) {
      if (pattern.test(text)) {
        errors.push(`${row.id} forbidden overclaim: ${phrase}`)
      }
    }

    if (row.dataClass === "public") {
      for (const marker of publicLeakageMarkers) {
        const leakagePattern = new RegExp(
          `\\b(?:exposes?|includes?|returns?|publishes?|leaks?)\\b[^.\\n]{0,80}\\b${marker.replaceAll(
            " ",
            "\\s+",
          )}\\b`,
          "i",
        )
        if (leakagePattern.test(row.currentBehavior)) {
          errors.push(`${row.id} forbidden public/default leakage: ${marker}`)
        }
      }
    }
  }

  return errors
}

const markdownEscape = (value: string | number | readonly string[]): string => {
  const text = Array.isArray(value) ? value.join(", ") : String(value)
  return text.replaceAll("|", "\\|").replaceAll("\n", " ")
}

export const renderV135BoundarySurfaceInventoryMarkdown = (
  inventory: V135BoundarySurfaceInventory,
): string => {
  const errors = validateV135BoundarySurfaceInventory(inventory)
  if (errors.length > 0) {
    throw new Error(`Invalid v1.35 boundary inventory:\n${errors.join("\n")}`)
  }

  const rows = inventory.surfaces
    .map(
      (row) =>
        `| ${markdownEscape(row.id)} | ${markdownEscape(row.surfaceGroup)} | ${markdownEscape(row.disposition)} | ${markdownEscape(row.downstreamPhase)} | ${markdownEscape(row.affectedRequirements)} | ${markdownEscape(row.codeReferences)} | ${markdownEscape(row.currentOwner)} | ${markdownEscape(row.intendedOwner)} | ${markdownEscape(row.trustBoundary)} | ${markdownEscape(row.dataClass)} | ${markdownEscape(row.currentBehavior)} | ${markdownEscape(row.requiredTestsOrProof)} | ${markdownEscape(row.privacyRisks)} |`,
    )
    .join("\n")
  const registerRows = inventory.surfaces
    .map(
      (row) =>
        `| ${markdownEscape(row.id)} | ${markdownEscape(row.disposition)} | Phase ${markdownEscape(row.downstreamPhase)} | ${markdownEscape(row.affectedRequirements)} | ${markdownEscape(row.requiredTestsOrProof)} |`,
    )
    .join("\n")
  const handoffRows = [244, 245, 246, 247, 248, "none"] as const
  const handoff = handoffRows
    .map((phase) => {
      const phaseRows = inventory.surfaces.filter(
        (row) => row.downstreamPhase === phase,
      )
      if (phaseRows.length === 0) {
        return ""
      }
      const label = phase === "none" ? "No downstream behavior phase" : `Phase ${phase}`
      return `- **${label}:** ${phaseRows.map((row) => row.id).join(", ")}`
    })
    .filter(Boolean)
    .join("\n")
  const proofRows = inventory.surfaces
    .map(
      (row) =>
        `| ${markdownEscape(row.id)} | ${markdownEscape(row.requiredTestsOrProof)} | ${markdownEscape(row.privacyRisks)} |`,
    )
    .join("\n")
  const auditRows = inventory.sourceCoverageAudit
    .flatMap((entry) =>
      entry.coveredSurfaceFamilies.map(
        (coverage) =>
          `| \`${markdownEscape(entry.command)}\` | ${markdownEscape(entry.result)} | ${markdownEscape(coverage.family)} | ${coverage.status} | ${markdownEscape(coverage.rowIds)} |`,
      ),
    )
    .join("\n")

  return `# v1.35 Boundary Surface Inventory

**Schema:** ${inventory.schemaVersion}
**Milestone:** ${inventory.milestone}
**Generated by:** ${inventory.generatedBy}
**Generated at:** ${inventory.generatedAt}

## Executive Summary

This is the authoritative v1.35 boundary surface inventory and locked decision register for Phase 243. It covers account save, account-owned source reads, owner-debug/private replay, Workshop compatibility aliases, competition entry, Go read/write surfaces, provider proof, sandbox claims, package/dependency policy, TinyGo visibility, privacy monitors, and prior evidence artifacts before Phases 244-248 change behavior.

## Scope and Non-Goals

${inventory.globalPolicies.phaseScope}

- Phase 243 records current behavior and downstream ownership only.
- Phase 243 must not change account proof, auth, sandbox, package, aliases, labels, runtime execution, or proof gates.
- Serious findings are handed off to Phase 244, Phase 245, Phase 246, Phase 247, or Phase 248 instead of being fixed here.

## Decision Register

- Required surface groups: ${inventory.requiredSurfaceGroups.join(", ")}
- Allowed dispositions: ${inventory.allowedDispositions.join(", ")}
- Allowed data classes: ${inventory.allowedDataClasses.join(", ")}
- Allowed downstream phases: ${inventory.allowedDownstreamPhases.join(", ")}
- Allowed requirement IDs: ${inventory.allowedRequirementIds.join(", ")}

| ID | Disposition | Downstream Phase | Affected Requirements | Required Tests Or Proof |
| --- | --- | --- | --- | --- |
${registerRows}

## Surface Inventory

| ID | Surface Group | Disposition | Downstream Phase | Affected Requirements | Code References | Current Owner | Intended Owner | Trust Boundary | Data Class | Current Behavior | Required Tests Or Proof | Privacy Risks |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
${rows}

## Downstream Handoff

${handoff}

## Privacy and Claim Calibration

- TypeScript/Python are provenance-only.
- Rust/Zig are immutable WASM/WASI Preview 1 artifact-backed.
- TinyGo is spike-only/hidden.
- no current lane is production sandbox certified by default.
- package mode remains \`none\`.
- Rich packages/package ecosystems/host imports are not production-supported.
- Public/default output must not expose the D-09 forbidden marker set: raw diagnostics, Strategy source, artifact bytes, host paths, env values, package paths, tokens, DB details, private runtime internals, StrategyMemory, SoldierMemory, objective payload, owner-debug payloads, raw Awareness Grids, quarantine details, operator action details, or recovery payloads.

Forbidden overclaim guard phrases assigned to later phases: production sandbox certification; TypeScript/Python WASM isolation; TinyGo production support; package ecosystem; rich-package; host import; production-supported package mode other than \`none\`.

## Required Tests and Proof

| ID | Required Tests Or Proof | Privacy Risks |
| --- | --- | --- |
${proofRows}

## Source Coverage Audit

| Discovery Command | Result | Surface Family | Status | Row IDs |
| --- | --- | --- | --- | --- |
${auditRows}
`
}

export const renderV135BoundarySurfaceInventoryJson = (
  inventory: V135BoundarySurfaceInventory,
): string => {
  const errors = validateV135BoundarySurfaceInventory(inventory)
  if (errors.length > 0) {
    throw new Error(`Invalid v1.35 boundary inventory:\n${errors.join("\n")}`)
  }
  return `${JSON.stringify(inventory, null, 2)}\n`
}

const parseMarkdownRowSyncFields = (
  markdown: string,
): Map<string, Pick<V135BoundarySurfaceRow, "affectedRequirements" | "disposition" | "downstreamPhase">> => {
  const result = new Map<
    string,
    Pick<
      V135BoundarySurfaceRow,
      "affectedRequirements" | "disposition" | "downstreamPhase"
    >
  >()
  for (const line of markdown.split("\n")) {
    if (!line.startsWith("| ") || line.startsWith("| ---") || line.includes(" Surface Group ")) {
      continue
    }
    const cells = line
      .slice(2, -2)
      .split(" | ")
      .map((cell) => cell.trim())
    if (cells.length < 13) {
      continue
    }
    const [id, , disposition, downstreamPhaseText, affectedRequirements] = cells
    if (!id) {
      continue
    }
    const downstreamPhase =
      downstreamPhaseText === "none"
        ? "none"
        : (Number(downstreamPhaseText) as 244 | 245 | 246 | 247 | 248)
    result.set(id, {
      affectedRequirements: affectedRequirements
        .split(",")
        .map((requirement) => requirement.trim())
        .filter(Boolean) as V135RequirementId[],
      disposition: disposition as V135BoundaryDisposition,
      downstreamPhase,
    })
  }
  return result
}

const collectArtifactSynchronizationFailures = (
  jsonText: string,
  markdownText: string,
): readonly string[] => {
  const failures: string[] = []
  let parsed: V135BoundarySurfaceInventory
  try {
    parsed = JSON.parse(jsonText) as V135BoundarySurfaceInventory
  } catch {
    return [`${artifactPaths.json} is not valid JSON`]
  }

  const markdownRows = parseMarkdownRowSyncFields(markdownText)
  if (markdownRows.size === 0) {
    return failures
  }
  for (const row of parsed.rows ?? []) {
    const markdownRow = markdownRows.get(row.id)
    if (!markdownRow) {
      failures.push(
        `${artifactPaths.json} and ${artifactPaths.markdown} are desynchronized for ${row.id} row presence`,
      )
      continue
    }
    if (markdownRow.disposition !== row.disposition) {
      failures.push(
        `${artifactPaths.json} and ${artifactPaths.markdown} are desynchronized for ${row.id} disposition`,
      )
    }
    if (markdownRow.downstreamPhase !== row.downstreamPhase) {
      failures.push(
        `${artifactPaths.json} and ${artifactPaths.markdown} are desynchronized for ${row.id} downstreamPhase`,
      )
    }
    if (
      markdownRow.affectedRequirements.join(",") !==
      row.affectedRequirements.join(",")
    ) {
      failures.push(
        `${artifactPaths.json} and ${artifactPaths.markdown} are desynchronized for ${row.id} affectedRequirements`,
      )
    }
  }
  return failures
}

export const writeV135BoundarySurfaceInventoryArtifacts = (
  options: GenerateV135BoundarySurfaceInventoryOptions = {},
): V135BoundarySurfaceInventory => {
  const root = options.repoRoot ?? repoRoot
  const inventory = generateV135BoundarySurfaceInventory(options)
  const jsonPath = path.join(root, artifactPaths.json)
  const markdownPath = path.join(root, artifactPaths.markdown)
  mkdirSync(path.dirname(jsonPath), { recursive: true })
  mkdirSync(path.dirname(markdownPath), { recursive: true })
  writeFileSync(jsonPath, renderV135BoundarySurfaceInventoryJson(inventory))
  writeFileSync(
    markdownPath,
    renderV135BoundarySurfaceInventoryMarkdown(inventory),
  )
  return inventory
}

export const checkV135BoundarySurfaceInventoryArtifacts = (
  options: GenerateV135BoundarySurfaceInventoryOptions = {},
): readonly string[] => {
  const root = options.repoRoot ?? repoRoot
  const inventory = generateV135BoundarySurfaceInventory(options)
  const expectedJson = renderV135BoundarySurfaceInventoryJson(inventory)
  const expectedMarkdown = renderV135BoundarySurfaceInventoryMarkdown(inventory)
  const jsonPath = path.join(root, artifactPaths.json)
  const markdownPath = path.join(root, artifactPaths.markdown)
  const failures: string[] = []

  if (!existsSync(jsonPath)) {
    failures.push(`${artifactPaths.json} is missing`)
  }
  if (!existsSync(markdownPath)) {
    failures.push(`${artifactPaths.markdown} is missing`)
  }
  if (failures.length > 0) {
    return failures
  }

  const actualJson = readFileSync(jsonPath, "utf8")
  const actualMarkdown = readFileSync(markdownPath, "utf8")
  if (actualJson !== expectedJson) {
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

const runCli = () => {
  const args = new Set(process.argv.slice(2))
  if (args.has("--write")) {
    const inventory = writeV135BoundarySurfaceInventoryArtifacts()
    console.log(
      `Wrote ${artifactPaths.json} and ${artifactPaths.markdown} (${inventory.rows.length} rows)`,
    )
    return
  }

  if (args.has("--check")) {
    const failures = checkV135BoundarySurfaceInventoryArtifacts()
    if (failures.length > 0) {
      console.error("v1.35 boundary surface inventory artifacts are stale:")
      for (const failure of failures) {
        console.error(`- ${failure}`)
      }
      process.exitCode = 1
      return
    }
    console.log("v1.35 boundary surface inventory artifacts are current")
    return
  }

  process.stdout.write(
    renderV135BoundarySurfaceInventoryJson(
      generateV135BoundarySurfaceInventory(),
    ),
  )
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCli()
}
