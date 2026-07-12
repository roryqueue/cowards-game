# Phase 249: Competition Surface Inventory and Policy Lock - Pattern Map

**Mapped:** 2026-06-15
**Files analyzed:** 10 likely new/modified files
**Analogs found:** 10 / 10

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `packages/spec/src/competition-policy-v1-36.ts` | config/model | transform | `packages/spec/src/competition.ts` | role-match |
| `packages/spec/src/index.ts` | config | transform | `packages/spec/src/index.ts` | exact |
| `packages/spec/src/spec.test.ts` | test | transform | `packages/spec/src/spec.test.ts` | exact |
| `scripts/evaluate-v1-36-competition-policy.ts` | utility | file-I/O + batch + transform | `scripts/evaluate-v1-35-boundary-surface-inventory.ts` | exact |
| `scripts/evaluate-v1-36-competition-policy.test.ts` | test | file-I/O + batch | `scripts/evaluate-v1-35-boundary-surface-inventory.test.ts` | exact |
| `scripts/check-boundary-monitors.ts` | utility | batch + static monitor | `scripts/check-boundary-monitors.ts` | exact |
| `scripts/check-boundary-monitors.test.ts` | test | batch + static monitor | `scripts/check-boundary-monitors.test.ts` | exact |
| `package.json` | config | batch | `package.json` | exact |
| `.planning/artifacts/v1.36-competition-surface-inventory.md` | artifact | file-I/O | `.planning/artifacts/v1.35-boundary-surface-inventory.md` | exact |
| `.planning/artifacts/v1.36-competition-surface-inventory.json` | artifact | file-I/O | `.planning/artifacts/v1.35-boundary-surface-inventory.json` | exact |

## Pattern Assignments

### `packages/spec/src/competition-policy-v1-36.ts` (config/model, transform)

**Analog:** `packages/spec/src/competition.ts`

**Imports and privacy guard pattern** (lines 1-13):
```typescript
import type {
  ArenaVariantId,
  JsonValue,
  MatchId,
  MatchSetId,
  StrategyRevisionId,
  UserId,
} from "./types.js"
import type {
  StrategyRuntimeMetadata,
  StrategyRuntimeProductSemantics,
} from "./runtime.js"
import { assertPublicOutputLeakSafe } from "./public-output-privacy.js"
```

**Literal vocabulary pattern** (lines 32-63):
```typescript
export const TRIAL_LADDER_SEASON_STATUSES = [
  "draft",
  "open",
  "scheduling",
  "active",
  "completed",
  "archived",
] as const

export type TrialLadderSeasonStatus =
  (typeof TRIAL_LADDER_SEASON_STATUSES)[number]

export type LadderMatchSetCountedStatus =
  | "pending"
  | "counted"
  | "retrying"
  | "under_review"
  | "invalid"
  | "non_competitive"
  | "non_counted"
```

**Public DTO privacy projection pattern** (lines 90-112):
```typescript
export interface PublicTrialLadderSeasonDto {
  seasonId: string
  slug: string
  name: string
  status: TrialLadderSeasonStatus
  statusLabel: string
  policy: TrialLadderPolicyDto
  entries: TrialLadderEntrySnapshot[]
  standings: PublicStandingDto[]
  matchSets: PublicLadderMatchSetSummaryDto[]
  publication: {
    publicEntries: true
    publicStandings: true
    publicReplayEvidence: true
    privateFieldsExcluded: string[]
  }
}
```

**Leak-safe assertion pattern** (lines 355-357):
```typescript
export const assertPublicMatchSetResultLeakSafe = (value: unknown): void => {
  assertPublicOutputLeakSafe(value, "Public MatchSet result")
}
```

Copy this shape for `COMPETITION_POLICY_V1_36_ID`, public posture labels, reset/no-durable labels, public counted-state projection labels, privacy exclusions, forbidden claim categories/examples, and policy owner constants. Keep counted state public projection only; do not add Phase 252 persistence mappings here.

### `packages/spec/src/index.ts` (config, transform)

**Analog:** `packages/spec/src/index.ts`

**Barrel export pattern** (lines 1-15):
```typescript
export * from "./constants.js"
export * from "./analytics.js"
export * from "./competition.js"
export * from "./fixtures/index.js"
export * from "./match-execution-contract.js"
export * from "./public-output-privacy.js"
export * from "./public-discovery.js"
export * from "./runtime-execution-service.js"
export * from "./runtime.js"
export * from "./schemas.js"
export * from "./service-fixtures.js"
export * from "./service.js"
export * from "./types.js"
export * from "./versions.js"
export * from "./workshop-checker.js"
```

Add the new policy module as another explicit export, using `.js` extension.

### `packages/spec/src/spec.test.ts` (test, transform)

**Analog:** `packages/spec/src/spec.test.ts`

**Import grouping pattern** (lines 3-21):
```typescript
import { describe, expect, it } from "vitest"
import {
  assertPublicMatchSetResultLeakSafe,
  COMPETITION_PRESET_IDS,
  getCompetitionPreset,
} from "./competition.js"
import { assertPublicOutputLeakSafe } from "./public-output-privacy.js"
```

**Contract and privacy test pattern** (lines 1386-1413):
```typescript
it("defines exhibition presets with public leak-safe result contracts", () => {
  expect(COMPETITION_PRESET_IDS).toEqual([
    "smoke-exhibition-v1",
    "standard-exhibition-v1",
  ])
  expect(getCompetitionPreset("smoke-exhibition-v1")).toMatchObject({
    entrantCount: { min: 2, max: 8 },
    mirroredPairwise: true,
    visibility: "public",
  })
  expect(() =>
    assertPublicMatchSetResultLeakSafe({
      matchSetId: "match-set:public",
      sourceHash: "public-hash",
    }),
  ).not.toThrow()
  expect(() =>
    assertPublicMatchSetResultLeakSafe({
      entrants: [{ source: "private strategy code" }],
    }),
  ).toThrow(/private field/)
})
```

Add a focused `competition-policy-v1.36` test block that asserts the exact public label `public beta trial competition`, resettable Season-scoped semantics, no durable rating promise, forbidden claim categories/examples, privacy exclusions, and leak-safe policy payloads.

### `scripts/evaluate-v1-36-competition-policy.ts` (utility, file-I/O + batch + transform)

**Analog:** `scripts/evaluate-v1-35-boundary-surface-inventory.ts`

**Script imports and repo root pattern** (lines 1-15):
```typescript
#!/usr/bin/env -S pnpm exec tsx
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
)

export const schemaVersion = "v1.35-boundary-surface-inventory" as const
export const milestone = "v1.35" as const
export const generatedBy =
  "scripts/evaluate-v1-35-boundary-surface-inventory.ts" as const
```

**Typed row/inventory pattern** (lines 72-115):
```typescript
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
```

For v1.36, rename fields to competition surface terms: owner, public/private data class, counted behavior, replay evidence requirement, privacy risk, required posture label, required reset/no-durable copy, and one disposition from `lock-now`, `fix-in-250`, `fix-in-251`, `fix-in-252`, `fix-in-253`, `fix-in-254`, `prove-in-255`, or `future/defer`.

**Artifact path pattern** (lines 205-208):
```typescript
export const artifactPaths = {
  json: ".planning/artifacts/v1.35-boundary-surface-inventory.json",
  markdown: ".planning/artifacts/v1.35-boundary-surface-inventory.md",
} as const
```

Use `.planning/artifacts/v1.36-competition-surface-inventory.json` and `.planning/artifacts/v1.36-competition-surface-inventory.md`.

**Forbidden claim pattern** (lines 226-245):
```typescript
const forbiddenOverclaimPatterns = [
  {
    phrase: "production sandbox certification",
    pattern:
      /\b(?:claims?|certifies?|certified|supports?|enables?|promotes?|declares?)\b[^.\n]{0,80}\bproduction sandbox certification\b/i,
  },
  {
    phrase: "TinyGo production support",
    pattern:
      /\b(?:claims?|certifies?|certified|supports?|enables?|promotes?|declares?)\b[^.\n]{0,80}\bTinyGo production support\b/i,
  },
]
```

Extend this category/example approach for durable-rating, all-time ranking, rating refund, mature staffed moderation, production sandbox, package ecosystem, TinyGo production, raw diagnostic, and private-runtime overclaims.

**Validation pattern** (lines 1226-1375):
```typescript
export const validateV135BoundarySurfaceInventory = (
  inventory: V135BoundarySurfaceInventory,
): readonly string[] => {
  const errors: string[] = []

  if (inventory.schemaVersion !== schemaVersion) {
    errors.push(`schemaVersion must be ${schemaVersion}`)
  }

  const presentGroups = new Set(inventory.rows.map((row) => row.surfaceGroup))
  for (const group of requiredGroups) {
    if (!presentGroups.has(group)) {
      errors.push(`missing required surface group ${group}`)
    }
  }

  for (const row of inventory.rows) {
    if (!allowedDispositionSet.has(row.disposition)) {
      errors.push(`${row.id} has invalid disposition ${row.disposition}`)
    }
    const text = rowSearchText(row)
    for (const { phrase, pattern } of forbiddenOverclaimPatterns) {
      if (pattern.test(text)) {
        errors.push(`${row.id} forbidden overclaim: ${phrase}`)
      }
    }
  }

  return errors
}
```

Add row-aware required-copy checks: if a row says posture/reset/no-durable copy is required, validate the exact default posture phrase and reset/no-durable labels in the row's current/required-copy fields or documented source reference.

**Render/check/write/CLI pattern** (lines 1382-1684):
```typescript
export const renderV135BoundarySurfaceInventoryMarkdown = (
  inventory: V135BoundarySurfaceInventory,
): string => {
  const errors = validateV135BoundarySurfaceInventory(inventory)
  if (errors.length > 0) {
    throw new Error(`Invalid v1.35 boundary inventory:\n${errors.join("\n")}`)
  }
  return `# v1.35 Boundary Surface Inventory
...
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

export const checkV135BoundarySurfaceInventoryArtifacts = (
  options: GenerateV135BoundarySurfaceInventoryOptions = {},
): readonly string[] => {
  const expectedJson = renderV135BoundarySurfaceInventoryJson(inventory)
  const expectedMarkdown = renderV135BoundarySurfaceInventoryMarkdown(inventory)
  if (actualJson !== expectedJson) {
    failures.push(`${artifactPaths.json} is stale`)
  }
  return failures
}
```

### `scripts/evaluate-v1-36-competition-policy.test.ts` (test, file-I/O + batch)

**Analog:** `scripts/evaluate-v1-35-boundary-surface-inventory.test.ts`

**Temp repo and imports pattern** (lines 1-35):
```typescript
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import {
  checkV135BoundarySurfaceInventoryArtifacts,
  generateV135BoundarySurfaceInventory,
  validateV135BoundarySurfaceInventory,
  writeV135BoundarySurfaceInventoryArtifacts,
} from "./evaluate-v1-35-boundary-surface-inventory.ts"
```

**Row fixture pattern** (lines 37-118):
```typescript
const baseRows = (): V135BoundarySurfaceRow[] => [
  {
    id: "competition-entry-proof",
    surfaceGroup: "competition-entry",
    codeReferences: ["apps/go-backend/live_backend.go#createExhibition"],
    currentOwner: "Go exhibition entry gate",
    intendedOwner: "Provider-proof-backed entry eligibility",
    trustBoundary: "account revision -> entry eligibility",
    dataClass: "session",
    affectedRequirements: ["INV-01", "INV-02", "ENTRY-01"],
    currentBehavior:
      "Entry gate drift is inventoried for Phase 244 provider proof.",
    disposition: "fix-now",
    requiredTestsOrProof: ["Phase 244 Go and persistence entry parity tests"],
    privacyRisks: ["Entry diagnostics must be public-safe."],
    downstreamPhase: 244,
  },
]
```

**Validator test pattern** (lines 225-323):
```typescript
it("rejects fixtures missing required INV-01 surface groups like account-save", () => {
  const rows = baseRows().filter((row) => row.surfaceGroup !== "account-save")

  expect(
    validateV135BoundarySurfaceInventory(inventoryWithRows(rows)),
  ).toEqual(
    expect.arrayContaining(["missing required surface group account-save"]),
  )
})

it("rejects invalid disposition defer-later with the row ID for INV-02", () => {
  const rows = baseRows()
  rows[0] = { ...rows[0]!, disposition: "defer-later" as never }
  expect(validateV135BoundarySurfaceInventory(inventoryWithRows(rows))).toEqual(
    expect.arrayContaining([
      "account-save-go-typescript-proof has invalid disposition defer-later",
    ]),
  )
})
```

**Claim/leak and artifact drift test pattern** (lines 325-455):
```typescript
it("rejects overclaims: production sandbox certification, TypeScript/Python WASM isolation, TinyGo production support, package ecosystem, rich-package, host import", () => {
  for (const phrase of ["production sandbox certification", "TinyGo production support"]) {
    const rows = baseRows()
    rows[7] = { ...rows[7]!, currentBehavior: `Claims ${phrase}.` }
    expect(validateV135BoundarySurfaceInventory(inventoryWithRows(rows))).toEqual(
      expect.arrayContaining([expect.stringContaining("forbidden overclaim")]),
    )
  }
})

it("reports missing artifacts, then accepts writes, then reports stale markdown and JSON/markdown row-sync drift", () => {
  const root = createTempRepo()
  expect(checkV135BoundarySurfaceInventoryArtifacts({ repoRoot: root })).toEqual([
    ".planning/artifacts/v1.35-boundary-surface-inventory.json is missing",
    ".planning/artifacts/v1.35-boundary-surface-inventory.md is missing",
  ])
  writeV135BoundarySurfaceInventoryArtifacts({ repoRoot: root })
  expect(checkV135BoundarySurfaceInventoryArtifacts({ repoRoot: root })).toEqual([])
})
```

### `scripts/check-boundary-monitors.ts` (utility, batch + static monitor)

**Analog:** `scripts/check-boundary-monitors.ts`

**Import evaluator check pattern** (lines 21-25):
```typescript
import {
  checkV135BoundarySurfaceInventoryArtifacts,
  type GenerateV135BoundarySurfaceInventoryOptions,
} from "./evaluate-v1-35-boundary-surface-inventory.ts"
import { checkV135AccountProviderEntryProofArtifacts } from "./evaluate-v1-35-account-provider-entry-proof.ts"
```

**Monitor wrapper pattern** (lines 930-938):
```typescript
export const checkV135BoundarySurfaceInventoryMonitor = (
  options: GenerateV135BoundarySurfaceInventoryOptions = {},
): string => {
  const failures = checkV135BoundarySurfaceInventoryArtifacts(options)
  if (failures.length > 0) {
    throw new Error(failures.join("; "))
  }
  return "v1.35 boundary surface inventory artifacts are current"
}
```

**Registration pattern** (lines 5457-5488):
```typescript
export const runBoundaryMonitorChecks = async (): Promise<
  BoundaryMonitorCheck[]
> => [
  await check("contract_drift", "OpenAPI public route artifact", () =>
    checkOpenApiContract(),
  ),
  await check("contract_drift", "v1.35 boundary surface inventory", () =>
    checkV135BoundarySurfaceInventoryMonitor(),
  ),
  await check("contract_drift", "v1.35 account provider entry proof", () =>
    checkV135AccountProviderEntryProofMonitor(),
  ),
]
```

Add a `checkV136CompetitionPolicyMonitor` wrapper and register it as a `contract_drift` or `privacy` monitor before the final `check-boundary-monitors.ts` package command.

### `scripts/check-boundary-monitors.test.ts` (test, batch + static monitor)

**Analog:** `scripts/check-boundary-monitors.test.ts`

**Import pattern** (lines 10-32):
```typescript
import { afterEach, describe, expect, it, vi } from "vitest"
import {
  checkV135BoundarySurfaceInventoryMonitor,
  runBoundaryMonitorChecks,
} from "./check-boundary-monitors.ts"
import {
  generateV135BoundarySurfaceInventory,
  writeV135BoundarySurfaceInventoryArtifacts,
  type V135BoundarySurfaceRow,
} from "./evaluate-v1-35-boundary-surface-inventory.ts"
```

**Package script wiring pattern** (lines 199-241):
```typescript
it("wires v1.35 boundary inventory package scripts into monitor commands", () => {
  const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as {
    scripts: Record<string, string>
  }

  expect(packageJson.scripts["v1.35:boundary-inventory"]).toBe(
    "pnpm exec tsx scripts/evaluate-v1-35-boundary-surface-inventory.ts --write",
  )
  expect(packageJson.scripts["v1.35:boundary-inventory:check"]).toBe(
    "pnpm exec tsx scripts/evaluate-v1-35-boundary-surface-inventory.ts --check",
  )
  expect(packageJson.scripts["boundary:monitors"]).toContain(
    "pnpm v1.35:boundary-inventory:check",
  )
})
```

**Monitor failure pattern** (lines 250-367):
```typescript
it("checks v1.35 boundary inventory artifacts without live dependencies", () => {
  const root = createTempRepo()
  writeV135BoundarySurfaceInventoryArtifacts({ repoRoot: root })
  expect(checkV135BoundarySurfaceInventoryMonitor({ repoRoot: root })).toBe(
    "v1.35 boundary surface inventory artifacts are current",
  )
})

it("fails v1.35 boundary inventory monitor on forbidden overclaim patterns", () => {
  const rows = ["production sandbox certification", "TinyGo production support"].map((claim) => ({
    ...generateV135BoundarySurfaceInventory().rows[0]!,
    currentBehavior: `Claims ${claim}.`,
  }))
  for (const row of rows) {
    expect(() =>
      checkV135BoundarySurfaceInventoryMonitor({ rows: [row] }),
    ).toThrow(/forbidden overclaim/)
  }
})
```

**Live chain inclusion pattern** (lines 1107-1137):
```typescript
const checks = await runBoundaryMonitorChecks()
expect(checks.every((check) => check.ok)).toBe(true)
const inventory = checks.find(
  (check) => check.name === "v1.35 boundary surface inventory",
)
expect(inventory).toMatchObject({
  layer: "contract_drift",
  ok: true,
  detail: "v1.35 boundary surface inventory artifacts are current",
})
```

### `package.json` (config, batch)

**Analog:** `package.json`

**Script naming and boundary chain pattern** (lines 30-60):
```json
"v1.35:boundary-inventory": "pnpm exec tsx scripts/evaluate-v1-35-boundary-surface-inventory.ts --write",
"v1.35:boundary-inventory:check": "pnpm exec tsx scripts/evaluate-v1-35-boundary-surface-inventory.ts --check",
"v1.35:final-proof": "pnpm exec tsx scripts/evaluate-v1-35-final-proof.ts --write",
"v1.35:final-proof:check": "pnpm exec tsx scripts/evaluate-v1-35-final-proof.ts --check",
"boundary:monitors": "pnpm contract:check && pnpm contract:lint && pnpm boundary:imports && pnpm typescript-backend:inventory:check && pnpm go:parity && pnpm sandbox:evaluate:check && pnpm wasm-wasi:evaluate:check && pnpm wasm-wasi:beta-evaluate:check && pnpm runtime-abuse:evaluate:check && pnpm match-execution:trust:check && pnpm match-execution:intelligence:check && pnpm public-discovery:check && pnpm topology:check && pnpm v1.35:boundary-inventory:check && pnpm v1.35:account-provider-entry-proof:check && pnpm v1.35:ownership-alias-proof:check && pnpm v1.35:sandbox-readiness-proof:check && pnpm v1.35:package-policy-proof:check && pnpm v1.35:final-proof:check && pnpm exec tsx scripts/check-boundary-monitors.ts"
```

Add `v1.36:competition-policy` and `v1.36:competition-policy:check`, then insert the check command into `boundary:monitors` before `pnpm exec tsx scripts/check-boundary-monitors.ts`.

### `.planning/artifacts/v1.36-competition-surface-inventory.md` (artifact, file-I/O)

**Analog:** `.planning/artifacts/v1.35-boundary-surface-inventory.md`

**Artifact structure pattern** (lines 1-26):
```markdown
# v1.35 Boundary Surface Inventory

**Schema:** v1.35-boundary-surface-inventory
**Milestone:** v1.35
**Generated by:** scripts/evaluate-v1-35-boundary-surface-inventory.ts
**Generated at:** 2026-06-14

## Executive Summary

## Scope and Non-Goals

## Decision Register

- Required surface groups: account-save, account-source-read, owner-debug-replay, workshop-alias, competition-entry, go-read-write, provider-proof, sandbox-claim, package-policy, tinygo-visibility, privacy-monitor
- Allowed dispositions: fix-now, quarantine, deprecate-remove, document-only, future
- Allowed data classes: public, session, owner-private, internal-private
```

**Surface inventory and handoff pattern** (lines 44-69):
```markdown
## Surface Inventory

| ID | Surface Group | Disposition | Downstream Phase | Affected Requirements | Code References | Current Owner | Intended Owner | Trust Boundary | Data Class | Current Behavior | Required Tests Or Proof | Privacy Risks |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

## Downstream Handoff

- **Phase 244:** v135-account-save-go-typescript-proof, v135-competition-entry-go-persistence-proof, v135-provider-proof-runtime-service-contract
- **No downstream behavior phase:** v135-evidence-artifact-prior-baselines
```

For v1.36, include rows for public routes/pages, DTOs, persistence modules, Go paths, UI copy, docs, monitors, proof scripts, artifacts, tests, fixtures, and snapshots. Every row gets exactly one downstream disposition.

### `.planning/artifacts/v1.36-competition-surface-inventory.json` (artifact, file-I/O)

**Analog:** `.planning/artifacts/v1.35-boundary-surface-inventory.json`

Use the JSON emitted by `renderV136CompetitionSurfaceInventoryJson`, not a hand-maintained file. Keep the same top-level convention from the evaluator inventory object: `schemaVersion`, `milestone`, `generatedBy`, allowed taxonomies, global policies, source coverage audit, `surfaces`, and `rows`.

## Shared Patterns

### Public Privacy Guard
**Source:** `packages/spec/src/public-output-privacy.ts` lines 1-110
**Apply to:** `packages/spec/src/competition-policy-v1-36.ts`, evaluator public artifacts, monitor payloads, tests

```typescript
export const PUBLIC_OUTPUT_FORBIDDEN_FIELDS = [
  "source",
  "sourceText",
  "bytesBase64",
  "artifactBytesBase64",
  "strategySource",
  "strategyMemory",
  "soldierMemory",
  "objective",
  "objectivePayload",
] as const

export const assertPublicOutputLeakSafe = (
  value: unknown,
  label = "Public output",
): void => {
  const visit = (node: unknown, path: string): void => {
    if (typeof node === "string") {
      for (const marker of PUBLIC_OUTPUT_FORBIDDEN_MARKERS) {
        if (node.includes(marker)) {
          throw new Error(`${label} leaks private marker at ${path}: ${marker}`)
        }
      }
      return
    }
  }
  visit(value, "$")
}
```

### Public Discovery Schemas
**Source:** `packages/spec/src/public-discovery.ts` lines 1-28, 48-56, 118-180, 251-259
**Apply to:** policy DTO schema decisions and public-safe href/copy rows

```typescript
import { z } from "zod"
import { assertPublicOutputLeakSafe } from "./public-output-privacy.js"

export const PUBLIC_DISCOVERY_API_VERSION = "public-discovery-v1"

const PublicDiscoveryBoundarySchema = z.object({
  apiVersion: z.literal(PUBLIC_DISCOVERY_API_VERSION),
  apiNamespace: z.literal("public-discovery"),
  executionContract: z.literal("not-match-execution-app-v1"),
  privateFieldsExcluded: z.array(z.string().min(1)),
})

export const publicDiscoveryBoundary = (): PublicDiscoveryBoundary => ({
  apiVersion: PUBLIC_DISCOVERY_API_VERSION,
  apiNamespace: "public-discovery",
  executionContract: "not-match-execution-app-v1",
  privateFieldsExcluded: [...PUBLIC_DISCOVERY_PRIVATE_FIELDS_EXCLUDED],
})
```

### Artifact Synchronization
**Source:** `scripts/evaluate-v1-35-boundary-surface-inventory.ts` lines 1560-1655
**Apply to:** v1.36 Markdown/JSON inventory check

```typescript
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
  for (const row of parsed.rows ?? []) {
    const markdownRow = markdownRows.get(row.id)
    if (!markdownRow) {
      failures.push(
        `${artifactPaths.json} and ${artifactPaths.markdown} are desynchronized for ${row.id} row presence`,
      )
    }
  }
  return failures
}
```

### Boundary Monitor Output
**Source:** `scripts/check-boundary-monitors.ts` lines 5598-5617
**Apply to:** v1.36 monitor registration

```typescript
const checks = await runBoundaryMonitorChecks()
console.log("Coward's Game v1.8 boundary monitors")
for (const result of checks) {
  console.log(
    `[${result.ok ? "PASS" : "FAIL"}] [${result.layer}] ${result.name}: ${result.detail}`,
  )
}
return checks.every((result) => result.ok) ? 0 : 1
```

## No Analog Found

All likely Phase 249 files have close analogs in v1.35 inventory/proof tooling or existing spec contracts.

## Metadata

**Analog search scope:** `packages/spec/src`, `scripts`, `package.json`, `.planning/artifacts`, selected `apps/web/app`, `apps/go-backend`, and `packages/persistence/src` references named by Phase 249 context.
**Files scanned:** 50+ candidate files via `rg --files`; 12 close analog files inspected.
**Pattern extraction date:** 2026-06-15

