#!/usr/bin/env -S pnpm exec tsx
import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import {
  PublicCompetitionDetailDtoSchema,
  PublicCompetitionIndexDtoSchema,
  PublicHomeDiscoveryDtoSchema,
  PublicWatchIndexDtoSchema,
  SignedInCompetitionEntryDashboardDtoSchema,
  assertPublicDiscoveryDtoLeakSafe,
  isSafePublicDiscoveryHref,
  publicDiscoveryBoundary,
} from "../packages/spec/src/index.ts"

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
)

const read = (relativePath: string): string =>
  readFileSync(path.join(repoRoot, relativePath), "utf8")

const assertDoesNotContain = (
  label: string,
  value: string,
  forbidden: readonly string[],
): void => {
  for (const marker of forbidden) {
    if (value.includes(marker)) {
      throw new Error(`${label} must not contain ${marker}`)
    }
  }
}

const specIndex = read("packages/spec/src/index.ts")
const discoverySpec = read("packages/spec/src/public-discovery.ts")
const discoveryService = read("apps/web/lib/public-discovery-service.ts")
const discoveryComponents = read("apps/web/app/public-discovery-components.tsx")
const discoveryRoutes = [
  "apps/web/app/page.tsx",
  "apps/web/app/watch/page.tsx",
  "apps/web/app/competitions/page.tsx",
  "apps/web/app/competitions/[competitionId]/page.tsx",
  "apps/web/app/competitions/[competitionId]/enter/page.tsx",
  "apps/web/app/learn/page.tsx",
].map((route) => [route, read(route)] as const)
const executionContract = read("packages/spec/src/match-execution-contract.ts")

if (!specIndex.includes('export * from "./public-discovery.js"')) {
  throw new Error("public discovery DTOs are not exported from @cowards/spec")
}

assertDoesNotContain("public discovery spec", discoverySpec, [
  "StrategyMemory:",
  "SoldierMemory:",
  "objectivePayload",
])

assertDoesNotContain("public discovery web service", discoveryService, [
  "@cowards/runtime-js",
  "@cowards/runtime-python",
  "@cowards/runtime-wasm-wasi",
  "@cowards/persistence",
  "packages/runtime-js",
  "packages/runtime-python",
  "packages/runtime-wasm-wasi",
  "node:vm",
  "executeStrategy",
  "StrategyMemory:",
  "strategyMemory",
  "SoldierMemory:",
  "soldierMemory",
  "objectivePayload",
  "rawDiagnostics",
  "quarantine",
  "operator",
  "recoveryPayload",
])

assertDoesNotContain("public discovery components", discoveryComponents, [
  "@cowards/runtime-js",
  "@cowards/runtime-python",
  "@cowards/runtime-wasm-wasi",
  "packages/runtime-js",
  "packages/runtime-python",
  "packages/runtime-wasm-wasi",
  "node:vm",
  "executeStrategy",
  "StrategyMemory:",
  "strategyMemory",
  "SoldierMemory:",
  "soldierMemory",
  "objectivePayload",
  "rawDiagnostics",
  "privateRuntime",
  "quarantine",
  "operator",
  "recoveryPayload",
])

for (const [route, source] of discoveryRoutes) {
  assertDoesNotContain(route, source, [
    "@cowards/runtime-js",
    "@cowards/runtime-python",
    "@cowards/runtime-wasm-wasi",
    "packages/runtime-js",
    "packages/runtime-python",
    "packages/runtime-wasm-wasi",
    "node:vm",
    "executeStrategy",
    "StrategyMemory:",
    "strategyMemory",
    "SoldierMemory:",
    "soldierMemory",
    "objectivePayload",
    "rawDiagnostics",
    "privateRuntime",
    "quarantine",
    "operatorAction",
    "recoveryPayload",
  ])
}

if (executionContract.includes("publicDiscovery")) {
  throw new Error("match execution contract must not import discovery reads")
}

const boundary = publicDiscoveryBoundary()
if (
  boundary.apiNamespace !== "public-discovery" ||
  boundary.executionContract !== "not-match-execution-app-v1"
) {
  throw new Error("public discovery boundary identity drifted")
}

const home = PublicHomeDiscoveryDtoSchema.parse({
  kind: "publicHomeDiscovery",
  boundary,
  competitions: [],
  latestEvidence: [],
  players: [],
  strategies: [],
  learnLinks: [{ label: "Trust", href: "/learn#trust" }],
  emptyStates: ["No public rows yet."],
})

const watch = PublicWatchIndexDtoSchema.parse({
  kind: "publicWatchIndex",
  boundary,
  replayReady: [],
  active: [],
  degraded: [],
  emptyStates: ["No public rows yet."],
})

const competitionIndex = PublicCompetitionIndexDtoSchema.parse({
  kind: "publicCompetitionIndex",
  boundary,
  activeCompetitions: [],
  entryOpportunities: [],
  completedCompetitions: [],
  emptyStates: ["No public rows yet."],
})

const competition = {
  competitionId: "exhibition:standard-exhibition-v1",
  title: "Standard Exhibition",
  kind: "exhibition",
  status: "open",
  statusLabel: "Open",
  href: "/competitions/exhibition%3Astandard-exhibition-v1",
  enterHref: "/competitions/exhibition%3Astandard-exhibition-v1/enter",
  origin: "competition-preset",
} as const

const detail = PublicCompetitionDetailDtoSchema.parse({
  kind: "publicCompetitionDetail",
  boundary,
  competition,
  entrants: [],
  standings: [],
  matchSets: [],
  replayCoverage: {
    replayReadyCount: 0,
    matchCount: 0,
    label: "No replay coverage yet.",
  },
  scheduleLabel: "On-demand exhibitions.",
})

const entry = SignedInCompetitionEntryDashboardDtoSchema.parse({
  kind: "signedInCompetitionEntryDashboard",
  boundary,
  competition,
  signedIn: false,
  accountUnavailable: false,
  revisionsUnavailable: false,
  user: null,
  eligibleRevisions: [],
  ineligibleRevisions: [],
  entryMode: "exhibition-preset",
  entryHref: "/api/exhibitions",
})

for (const dto of [home, watch, competitionIndex, detail, entry]) {
  assertPublicDiscoveryDtoLeakSafe(dto)
}

for (const unsafeHref of [
  "javascript:alert(1)",
  "https://example.invalid/watch",
  "//example.invalid/watch",
]) {
  if (isSafePublicDiscoveryHref(unsafeHref)) {
    throw new Error(`unsafe discovery href was accepted: ${unsafeHref}`)
  }
}

console.log("public discovery boundary checks passed")
