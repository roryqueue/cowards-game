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
  requiredSurfaceGroups: readonly V135BoundarySurfaceGroup[]
  allowedSurfaceGroups: readonly V135BoundarySurfaceGroup[]
  allowedDispositions: readonly V135BoundaryDisposition[]
  allowedDataClasses: readonly V135BoundarySurfaceRow["dataClass"][]
  allowedDownstreamPhases: readonly V135BoundarySurfaceRow["downstreamPhase"][]
  allowedRequirementIds: readonly V135RequirementId[]
  rows: readonly V135BoundarySurfaceRow[]
}

export interface GenerateV135BoundarySurfaceInventoryOptions {
  repoRoot?: string
  rows?: readonly V135BoundarySurfaceRow[]
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
    pattern: /\bproduction sandbox certification\b/i,
  },
  {
    phrase: "TypeScript/Python WASM isolation",
    pattern: /\bTypeScript\/Python WASM isolation\b/i,
  },
  {
    phrase: "TinyGo production support",
    pattern: /\bTinyGo production support\b/i,
  },
  {
    phrase: "package ecosystem",
    pattern: /\bpackage ecosystem(?: support)?\b/i,
  },
  {
    phrase: "rich-package",
    pattern: /\brich-package(?: support)?\b/i,
  },
  {
    phrase: "host import",
    pattern: /\bhost import(?: support)?\b/i,
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

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0

const rowSearchText = (row: V135BoundarySurfaceRow): string =>
  [
    row.currentBehavior,
    row.requiredTestsOrProof.join(" "),
    row.privacyRisks.join(" "),
  ].join(" ")

export const generateV135BoundarySurfaceInventory = (
  options: GenerateV135BoundarySurfaceInventoryOptions = {},
): V135BoundarySurfaceInventory => ({
  schemaVersion,
  milestone,
  requiredSurfaceGroups,
  allowedSurfaceGroups,
  allowedDispositions,
  allowedDataClasses,
  allowedDownstreamPhases,
  allowedRequirementIds,
  rows: options.rows ?? defaultRows,
})

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

  const rows = inventory.rows
    .map(
      (row) =>
        `| ${markdownEscape(row.id)} | ${markdownEscape(row.surfaceGroup)} | ${markdownEscape(row.disposition)} | ${markdownEscape(row.downstreamPhase)} | ${markdownEscape(row.affectedRequirements)} | ${markdownEscape(row.codeReferences)} | ${markdownEscape(row.currentOwner)} | ${markdownEscape(row.intendedOwner)} | ${markdownEscape(row.trustBoundary)} | ${markdownEscape(row.dataClass)} | ${markdownEscape(row.currentBehavior)} | ${markdownEscape(row.requiredTestsOrProof)} | ${markdownEscape(row.privacyRisks)} |`,
    )
    .join("\n")

  return `# v1.35 Boundary Surface Inventory

**Schema:** ${inventory.schemaVersion}
**Milestone:** ${inventory.milestone}

## Contract

- Required surface groups: ${inventory.requiredSurfaceGroups.join(", ")}
- Allowed dispositions: ${inventory.allowedDispositions.join(", ")}
- Allowed data classes: ${inventory.allowedDataClasses.join(", ")}
- Allowed downstream phases: ${inventory.allowedDownstreamPhases.join(", ")}
- Allowed requirement IDs: ${inventory.allowedRequirementIds.join(", ")}

## Claim Calibration

- TypeScript/Python are provenance-only.
- Rust/Zig are immutable WASM/WASI Preview 1 artifact-backed.
- TinyGo is spike-only/hidden.
- No current lane is certified by default.
- Package mode \`none\` is the current production policy.

## Surface Matrix

| ID | Surface Group | Disposition | Downstream Phase | Affected Requirements | Code References | Current Owner | Intended Owner | Trust Boundary | Data Class | Current Behavior | Required Tests Or Proof | Privacy Risks |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
${rows}
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
    if (cells.length < 5) {
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
