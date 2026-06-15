#!/usr/bin/env -S pnpm exec tsx
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
)

export const ownershipAliasProofSchemaVersion =
  "v1.35-ownership-alias-proof" as const
export const ownershipAliasProofGeneratedAt = "2026-06-15" as const
export const ownershipAliasProofGeneratedBy =
  "scripts/evaluate-v1-35-ownership-alias-proof.ts" as const

export type V135OwnershipAliasRequirement =
  | "AUTH-01"
  | "AUTH-02"
  | "PRIV-01"
  | "PRIV-02"
  | "API-01"
  | "API-02"
  | "API-03"

export type V135OwnershipAliasEvidenceKind =
  | "account-source-session-owner"
  | "local-workshop-owner-debug-quarantine"
  | "workshop-source-alias-deprecation"
  | "retained-workshop-route-scope"
  | "public-default-privacy"

export interface V135OwnershipAliasEvidenceRow {
  id: string
  kind: V135OwnershipAliasEvidenceKind
  requirements: readonly V135OwnershipAliasRequirement[]
  files: readonly string[]
  commands: readonly string[]
  outcome: string
  limitations: readonly string[]
}

export interface V135OwnershipAliasProof {
  schemaVersion: typeof ownershipAliasProofSchemaVersion
  milestone: "v1.35"
  phase: 245
  generatedAt: typeof ownershipAliasProofGeneratedAt
  generatedBy: typeof ownershipAliasProofGeneratedBy
  requiredRequirements: readonly V135OwnershipAliasRequirement[]
  requiredEvidenceKinds: readonly V135OwnershipAliasEvidenceKind[]
  guardrails: {
    localWorkshopPlayerAuthorizesPrivateReplay: false
    workshopSourceAliasesReturnSource: false
    accountSourceRequiresServerSession: true
    publicDefaultOwnerDebugExcluded: true
  }
  sourceChecks: readonly string[]
  evidence: readonly V135OwnershipAliasEvidenceRow[]
}

export const ownershipAliasArtifactPaths = {
  json: ".planning/artifacts/v1.35-ownership-alias-proof.json",
  markdown: ".planning/artifacts/v1.35-ownership-alias-proof.md",
} as const

export const requiredOwnershipAliasRequirements = [
  "AUTH-01",
  "AUTH-02",
  "PRIV-01",
  "PRIV-02",
  "API-01",
  "API-02",
  "API-03",
] as const satisfies readonly V135OwnershipAliasRequirement[]

export const requiredOwnershipAliasEvidenceKinds = [
  "account-source-session-owner",
  "local-workshop-owner-debug-quarantine",
  "workshop-source-alias-deprecation",
  "retained-workshop-route-scope",
  "public-default-privacy",
] as const satisfies readonly V135OwnershipAliasEvidenceKind[]

const forbiddenArtifactMarkers = [
  "export default {",
  "PRIVATE_STRATEGY_SOURCE",
  "PRIVATE_STRATEGY_MEMORY",
  "PRIVATE_SOLDIER_MEMORY",
  "PRIVATE_OBJECTIVE",
  "PRIVATE_AWARENESS_GRID",
  "bytesBase64",
  "postgres://",
  "mysql://",
  "token=",
  "/Users/",
] as const

const readRepoFile = (repo: string, file: string): string =>
  readFileSync(path.join(repo, file), "utf8")

const defaultEvidenceRows: readonly V135OwnershipAliasEvidenceRow[] = [
  {
    id: "account-source-server-authorized-owner-route",
    kind: "account-source-session-owner",
    requirements: ["AUTH-01", "AUTH-02", "PRIV-02"],
    files: [
      "apps/web/app/api/account/revisions/[revisionId]/source/route.ts",
      "apps/go-backend/live_backend.go",
      "apps/web/lib/go-backend-service-client.ts",
    ],
    commands: [
      "cd apps/go-backend && go test ./... -run 'Test.*Auth|Test.*Source|Test.*Owner' -count=1",
      "pnpm exec vitest run tests/phase-105-selected-go-route-behavior.test.ts",
    ],
    outcome:
      "Account source reads flow through a current session to Go and Go joins Strategy Revisions against the authenticated owner before returning private no-store source.",
    limitations: [],
  },
  {
    id: "local-workshop-owner-debug-quarantined",
    kind: "local-workshop-owner-debug-quarantine",
    requirements: ["AUTH-01", "PRIV-01", "PRIV-02"],
    files: [
      "apps/web/app/matches/server.ts",
      "apps/web/app/matches/server.test.ts",
      "apps/web/app/workshop/workshop-client-state.ts",
      "apps/web/app/workshop/workshop-client.test.tsx",
      "apps/web/e2e/workshop-to-replay.spec.ts",
    ],
    commands: [
      "pnpm --filter @cowards/web exec vitest run app/matches/server.test.ts app/matches/[matchId]/replay/owner-debug.test.ts app/workshop/workshop-client.test.tsx",
    ],
    outcome:
      "Query parameters can request owner-debug only after server-side authorization, and stale persisted rows using player:workshop-local remain public-only.",
    limitations: [
      "General account-owner private replay for non-Workshop competitions remains future scoped unless a later milestone adds server session to replay pages.",
    ],
  },
  {
    id: "workshop-source-aliases-deprecated-no-source",
    kind: "workshop-source-alias-deprecation",
    requirements: ["API-01", "API-02", "API-03", "PRIV-02"],
    files: [
      "apps/web/app/api/workshop/source/route.ts",
      "apps/web/app/api/workshop/source/route.test.ts",
      "apps/web/app/api/workshop/revisions/[revisionId]/source/route.ts",
      "apps/web/app/api/workshop/revisions/[revisionId]/source/route.test.ts",
    ],
    commands: [
      "pnpm --filter @cowards/web exec vitest run app/api/workshop/source/route.test.ts app/api/workshop/revisions/[revisionId]/source/route.test.ts",
    ],
    outcome:
      "Legacy Workshop source aliases return explicit public-safe 410 migration errors with private no-store cache policy and no Strategy source, revision id, or provider internals.",
    limitations: [],
  },
  {
    id: "retained-workshop-routes-local-only",
    kind: "retained-workshop-route-scope",
    requirements: ["AUTH-01", "API-01", "API-03"],
    files: [
      "apps/web/app/api/workshop/revisions/route.ts",
      "apps/web/app/api/workshop/validate/route.ts",
      "apps/web/app/api/workshop/tests/route.ts",
      "apps/web/app/api/exhibitions/route.ts",
      "apps/web/app/api/ladder/seasons/[seasonId]/entries/route.ts",
    ],
    commands: [
      "pnpm --filter @cowards/web exec vitest run app/api/workshop/revisions/route.test.ts app/api/workshop/validate/route.test.ts",
    ],
    outcome:
      "Retained Workshop submit, validation, test, and analytics routes remain local Workshop surfaces and do not authorize account source, Go exhibitions, ladder entry, or owner-private replay.",
    limitations: [
      "Workshop-local storage still persists source for local Workshop workflows; it is not account ownership or counted competition authority.",
    ],
  },
  {
    id: "public-default-owner-private-redaction",
    kind: "public-default-privacy",
    requirements: ["PRIV-01", "PRIV-02", "API-02", "API-03"],
    files: [
      "apps/web/app/matches/server.test.ts",
      "apps/go-backend/main_test.go",
      "packages/spec/src/public-output-privacy.ts",
      "apps/web/e2e/workshop-to-replay.spec.ts",
    ],
    commands: [
      "pnpm --filter @cowards/web exec vitest run app/matches/server.test.ts",
      "cd apps/go-backend && go test ./... -run TestPublicResponses -count=1",
    ],
    outcome:
      "Public/default replay, metadata, and alias responses omit owner-debug payloads, owner-private projection data, Strategy source, memories, objective payloads, raw Awareness Grids, raw diagnostics, and private runtime internals.",
    limitations: [],
  },
]

const sourceChecks = (repo: string): string[] => {
  const checks: string[] = []
  const accountSource = readRepoFile(
    repo,
    "apps/web/app/api/account/revisions/[revisionId]/source/route.ts",
  )
  if (!accountSource.includes("getAccountSessionId()")) {
    checks.push("account source route must use current account session")
  }
  if (!accountSource.includes('"cache-control": "private, no-store"')) {
    checks.push("account source route must return private no-store")
  }

  const goBackend = readRepoFile(repo, "apps/go-backend/live_backend.go")
  if (!goBackend.includes("where sr.id = $1 and s.owner_user_id = $2")) {
    checks.push(
      "Go source read must join revision ownership by authenticated user",
    )
  }

  for (const file of [
    "apps/web/app/api/workshop/source/route.ts",
    "apps/web/app/api/workshop/revisions/[revisionId]/source/route.ts",
  ]) {
    const text = readRepoFile(repo, file)
    if (!text.includes("status: 410")) {
      checks.push(`${file} must return 410 Gone`)
    }
    if (!text.includes('"cache-control": "private, no-store"')) {
      checks.push(`${file} must return private no-store`)
    }
    if (text.includes("getRevisionSource(") || text.includes("source,")) {
      checks.push(`${file} must not read or return Workshop source`)
    }
  }

  const replayServer = readRepoFile(repo, "apps/web/app/matches/server.ts")
  if (
    !replayServer.includes(
      'LOCAL_WORKSHOP_PLAYER_ID = "player:workshop-local"',
    ) ||
    !replayServer.includes(
      "requestedOwnerPlayerId === LOCAL_WORKSHOP_PLAYER_ID",
    )
  ) {
    checks.push("replay server must quarantine player:workshop-local")
  }

  const workshopState = readRepoFile(
    repo,
    "apps/web/app/workshop/workshop-client-state.ts",
  )
  if (!workshopState.includes("localPlayerId !== LOCAL_WORKSHOP_PLAYER_ID")) {
    checks.push("Workshop UI state must not expose local owner-debug links")
  }
  if (!workshopState.includes("ownerHref: null")) {
    checks.push("Workshop replay availability must keep ownerHref null")
  }

  return checks
}

export const generateV135OwnershipAliasProof = (
  repo: string = repoRoot,
  rows: readonly V135OwnershipAliasEvidenceRow[] = defaultEvidenceRows,
): V135OwnershipAliasProof => ({
  schemaVersion: ownershipAliasProofSchemaVersion,
  milestone: "v1.35",
  phase: 245,
  generatedAt: ownershipAliasProofGeneratedAt,
  generatedBy: ownershipAliasProofGeneratedBy,
  requiredRequirements: requiredOwnershipAliasRequirements,
  requiredEvidenceKinds: requiredOwnershipAliasEvidenceKinds,
  guardrails: {
    localWorkshopPlayerAuthorizesPrivateReplay: false,
    workshopSourceAliasesReturnSource: false,
    accountSourceRequiresServerSession: true,
    publicDefaultOwnerDebugExcluded: true,
  },
  sourceChecks: sourceChecks(repo),
  evidence: rows,
})

export const validateV135OwnershipAliasProof = (
  proof: V135OwnershipAliasProof,
): string[] => {
  const errors: string[] = []
  for (const requirement of proof.requiredRequirements) {
    if (!proof.evidence.some((row) => row.requirements.includes(requirement))) {
      errors.push(`missing requirement ${requirement}`)
    }
  }
  for (const kind of proof.requiredEvidenceKinds) {
    if (!proof.evidence.some((row) => row.kind === kind)) {
      errors.push(`missing evidence kind ${kind}`)
    }
  }
  if (proof.guardrails.localWorkshopPlayerAuthorizesPrivateReplay !== false) {
    errors.push("player:workshop-local must not authorize private replay")
  }
  if (proof.guardrails.workshopSourceAliasesReturnSource !== false) {
    errors.push("Workshop source aliases must not return source")
  }
  errors.push(...proof.sourceChecks)
  const artifactText = JSON.stringify(proof)
  for (const marker of forbiddenArtifactMarkers) {
    if (artifactText.includes(marker)) {
      errors.push(`forbidden private marker ${marker}`)
    }
  }
  return errors
}

const markdownEscape = (value: unknown): string =>
  String(Array.isArray(value) ? value.join("<br>") : value)
    .replaceAll("|", "\\|")
    .replaceAll("\n", "<br>")

export const renderV135OwnershipAliasProofJson = (
  proof: V135OwnershipAliasProof,
): string => `${JSON.stringify(proof, null, 2)}\n`

export const renderV135OwnershipAliasProofMarkdown = (
  proof: V135OwnershipAliasProof,
): string => `# v1.35 Ownership and Workshop Alias Proof

**Generated:** ${proof.generatedAt}  
**Phase:** ${proof.phase}  
**Schema:** ${proof.schemaVersion}

This artifact records the Phase 245 ownership, owner-debug, source-alias, and public-default privacy proof. It intentionally does not enable broad account-owner private replay, production sandbox certification, TinyGo production support, or package ecosystem support.

## Guardrails

| Guardrail | Value |
| --- | --- |
| Local Workshop player authorizes private replay | ${proof.guardrails.localWorkshopPlayerAuthorizesPrivateReplay} |
| Workshop source aliases return source | ${proof.guardrails.workshopSourceAliasesReturnSource} |
| Account source requires server session | ${proof.guardrails.accountSourceRequiresServerSession} |
| Public/default owner-debug excluded | ${proof.guardrails.publicDefaultOwnerDebugExcluded} |

## Source Checks

${proof.sourceChecks.length === 0 ? "- All source checks passed." : proof.sourceChecks.map((check) => `- ${check}`).join("\n")}

## Evidence

| ID | Kind | Requirements | Files | Commands | Outcome | Limitations |
| --- | --- | --- | --- | --- | --- | --- |
${proof.evidence
  .map(
    (row) =>
      `| ${markdownEscape(row.id)} | ${markdownEscape(row.kind)} | ${markdownEscape(row.requirements)} | ${markdownEscape(row.files)} | ${markdownEscape(row.commands)} | ${markdownEscape(row.outcome)} | ${markdownEscape(row.limitations.length ? row.limitations : "None")} |`,
  )
  .join("\n")}
`

export const writeV135OwnershipAliasProofArtifacts = (
  repo: string = repoRoot,
): V135OwnershipAliasProof => {
  const proof = generateV135OwnershipAliasProof(repo)
  const errors = validateV135OwnershipAliasProof(proof)
  if (errors.length) {
    throw new Error(
      `Invalid v1.35 ownership alias proof:\n${errors.join("\n")}`,
    )
  }
  mkdirSync(path.join(repo, ".planning/artifacts"), { recursive: true })
  writeFileSync(
    path.join(repo, ownershipAliasArtifactPaths.json),
    renderV135OwnershipAliasProofJson(proof),
  )
  writeFileSync(
    path.join(repo, ownershipAliasArtifactPaths.markdown),
    renderV135OwnershipAliasProofMarkdown(proof),
  )
  return proof
}

export const checkV135OwnershipAliasProofArtifacts = (
  repo: string = repoRoot,
): string[] => {
  const proof = generateV135OwnershipAliasProof(repo)
  const errors = validateV135OwnershipAliasProof(proof)
  const expectedJson = renderV135OwnershipAliasProofJson(proof)
  const expectedMarkdown = renderV135OwnershipAliasProofMarkdown(proof)
  const jsonPath = path.join(repo, ownershipAliasArtifactPaths.json)
  const markdownPath = path.join(repo, ownershipAliasArtifactPaths.markdown)
  if (
    !existsSync(jsonPath) ||
    readFileSync(jsonPath, "utf8") !== expectedJson
  ) {
    errors.push(`${ownershipAliasArtifactPaths.json} is stale`)
  }
  if (
    !existsSync(markdownPath) ||
    readFileSync(markdownPath, "utf8") !== expectedMarkdown
  ) {
    errors.push(`${ownershipAliasArtifactPaths.markdown} is stale`)
  }
  return errors
}

const main = (): void => {
  const args = new Set(process.argv.slice(2))
  if (args.has("--write")) {
    writeV135OwnershipAliasProofArtifacts()
    console.log("wrote v1.35 ownership alias proof artifacts")
    return
  }
  if (args.has("--check")) {
    const errors = checkV135OwnershipAliasProofArtifacts()
    if (errors.length) {
      console.error("v1.35 ownership alias proof artifacts are stale:")
      for (const error of errors) {
        console.error(`- ${error}`)
      }
      process.exit(1)
    }
    console.log("v1.35 ownership alias proof artifacts are current")
    return
  }
  console.log(
    renderV135OwnershipAliasProofMarkdown(generateV135OwnershipAliasProof()),
  )
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}
