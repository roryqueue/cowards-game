#!/usr/bin/env -S pnpm exec tsx
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { createHash } from "node:crypto"
import { spawnSync } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from "node:url"
import ts from "typescript"

const defaultRepoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
)

export type V137IntegrityBoundaryFindingCode =
  | "CALLER_EVIDENCE_MISSING"
  | "CALLER_ENTRANT_SET_MISSING"
  | "CALLER_ORDERED_PAIR_MISSING"
  | "DEV_FIXTURE_BOUNDARY_MISSING"
  | "UNRECOGNIZED_CREATION_CALLER"
  | "UNRECOGNIZED_SQL_WRITER"
  | "UNRECOGNIZED_LEGACY_WORKER_CONSUMER"
  | "DUPLICATE_AUTHORITY_OWNER"
  | "DUPLICATE_SCHEDULER_AUTHORITY"
  | "UI_RULE_AUTHORITY"
  | "DUPLICATE_ADAPTER_CLASSIFIER"
  | "DUPLICATE_ARENA_AUTHORITY"
  | "STATIC_PROMOTION_PATH"
  | "PARTIAL_TUPLE_ACCEPTANCE"
  | "PUBLIC_EXECUTION_ROUTE"
  | "RAW_CERTIFICATE_WRITER"
  | "FIXTURE_PRODUCTION_PROMOTION"
  | "DECLARATION_PROMOTION_PATH"
  | "REQUEST_AUTHORITY_BODY"
  | "AUTHORITY_CHAIN_DRIFT"
  | "RUNTIME_REQUEST_ENVELOPE_DRIFT"
  | "GO_RECEIPT_AUTHORITY_DRIFT"
  | "KNOWN_PHASE_257_DEBT_DRIFT"
  | "AUDIT_ARTIFACT_MISSING"
  | "AUDIT_ARTIFACT_INVALID"
  | "AUDIT_METADATA_DRIFT"
  | "AUDIT_OBSERVATION_DRIFT"
  | "AUDIT_MARKDOWN_DRIFT"
  | "AUDIT_PRIVACY_VIOLATION"
  | "AUDIT_REPRODUCTION_FAILED"

export interface V137IntegrityBoundaryFinding {
  code: V137IntegrityBoundaryFindingCode
  path: string
  line: number
  detail: string
}

export interface V137IntegrityBoundaryAnalysis {
  findings: readonly V137IntegrityBoundaryFinding[]
  inventoriedFiles: number
  creationCalls: number
  sqlWriters: number
  legacyWorkerConsumers: number
}

export interface AnalyzeV137IntegritySourcesOptions {
  enforceRepositoryContracts?: boolean
  enforceKnownDebtFingerprints?: boolean
}

const sha256 = (value: string): string =>
  createHash("sha256").update(value).digest("hex")

const knownPhase257DebtFingerprints = {
  "packages/engine/src/activation.ts#resolveActivation":
    "368d4edf7b6eef40bf741ef2d60eff069ff241ecd552b92f640018be122b1425",
  "packages/engine/src/match.ts#runMatch":
    "d2e1602d5a5525d28ada0947fd40e2b3264c3c900741854aed8f1bf91dcf3036",
  "packages/replay/src/build.ts#buildChronicleFromMatch":
    "ca1547295c8efece5e624b8d39cf2fbe7564f1f715d16c2e9c7ecc3796b6fb4a",
} as const

const restrictedPublicKeys = new Set([
  "source",
  "sourceBytes",
  "artifactBytes",
  "strategyMemory",
  "soldierMemory",
  "objectivePayload",
  "rawDiagnostics",
  "hostPath",
  "privateKey",
  "certificateBody",
  "attestationBody",
  "securityInternals",
])

export const assertV137IntegrityPublicPayload = (value: unknown): void => {
  const visit = (candidate: unknown, pathParts: readonly string[]): void => {
    if (typeof candidate === "string") {
      if (/\/(?:Users|home)\//u.test(candidate)) {
        throw new Error(`public integrity payload contains host path at ${pathParts.join(".")}`)
      }
      if (/BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY/u.test(candidate)) {
        throw new Error(`public integrity payload contains private key at ${pathParts.join(".")}`)
      }
      return
    }
    if (Array.isArray(candidate)) {
      candidate.forEach((entry, index) => visit(entry, [...pathParts, String(index)]))
      return
    }
    if (!candidate || typeof candidate !== "object") return
    for (const [key, nested] of Object.entries(candidate)) {
      if (restrictedPublicKeys.has(key)) {
        throw new Error(`public integrity payload contains restricted key ${key}`)
      }
      visit(nested, [...pathParts, key])
    }
  }
  visit(value, ["$"])
}

const auditCommand =
  "pnpm exec tsx .planning/artifacts/v2.0-core-rules-audit/reproduce-core-rule-gaps.ts"
const auditJsonPath =
  ".planning/artifacts/v1.37-core-rules-audit-baseline.json"
const auditMarkdownPath =
  ".planning/artifacts/v1.37-core-rules-audit-baseline.md"

const exactAuditObservations = {
  noAdvanceLastSoldier: {
    status: "STONE",
    outcome: null,
    matchEndedEvents: 0,
  },
  cycleEndBackstabActor: {
    status: "STONE",
    slotEnded: false,
    terminalReason: null,
  },
  excessMalformedOrder: {
    validOrdersRetained: 0,
    violationEvents: 1,
  },
  deepValidation: "threw:RangeError",
  overlappingArenaAccepted: true,
  legacyBoundaryAccepted: true,
  successfulPushPusherHistory: "RIGHT",
} as const

const exactAuditProbeMetadata = [
  ["noAdvanceLastSoldier", "reproduced_defect", "257"],
  ["cycleEndBackstabActor", "reproduced_defect", "257"],
  ["excessMalformedOrder", "reproduced_defect", "257"],
  ["deepValidation", "reproduced_defect", "258"],
  ["overlappingArenaAccepted", "reproduced_defect", "257"],
  ["legacyBoundaryAccepted", "reproduced_defect", "259"],
  ["successfulPushPusherHistory", "preserved_v1.4_ruling", "257"],
] as const

const stableJson = (value: unknown): string => JSON.stringify(value)

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value)

export const renderV137CoreRulesAuditBaselineMarkdown = (
  baseline: Record<string, unknown>,
): string => {
  const diffBasis = isRecord(baseline.productionSourceDiffBasis)
    ? baseline.productionSourceDiffBasis
    : {}
  const probes = Array.isArray(baseline.probes) ? baseline.probes : []
  const rows = probes
    .filter(isRecord)
    .map(
      (probe) =>
        `| \`${String(probe.id)}\` | \`${String(probe.classification)}\` | ${String(probe.futurePhaseOwner)} | \`${stableJson(probe.observed)}\` |`,
    )
    .join("\n")
  return `# v1.37 Core-Rules Audit Baseline

This is the exact Phase 256 compatibility baseline. Six confirmed defects remain routed to later phases; the successful-push reversal-history result is an immutable v1.4 compatibility ruling. This artifact records observations only and authorizes no gameplay change.

## Reproduction identity

- Command: \`${String(baseline.command)}\`
- Planning baseline commit: \`${String(baseline.planningBaselineCommit)}\`
- Implementation commit: \`${String(baseline.implementationHead)}\`
- Reviewed v1.36 archive commit: \`${String(baseline.reviewedArchiveCommit)}\`
- Production diff: \`${String(diffBasis.changedPathCount)}\` changed paths under \`${String(diffBasis.pathspec)}\`; sorted-path SHA-256 \`${String(diffBasis.changedPathListSha256)}\`

## Exact observations

| Probe | Classification | Future phase owner | Observed value |
|---|---|---:|---|
${rows}

## Guardrails

- Reruns must match all seven semantic observations exactly.
- Transport formatting may be normalized; state, legality, event order, outcome, terminal behavior, and Strategy observation may not.
- The artifacts contain no source or artifact bytes, memories, objectives, credentials, host paths, raw diagnostics, or security internals.
- Any semantic delta requires an explicit compatibility ruling before expected values change.
`
}

export interface AnalyzeV137CoreRulesAuditBaselineInput {
  baseline: unknown
  markdown: string
  reproduced: unknown
}

export const analyzeV137CoreRulesAuditBaseline = (
  input: AnalyzeV137CoreRulesAuditBaselineInput,
): V137IntegrityBoundaryAnalysis => {
  const findings: V137IntegrityBoundaryFinding[] = []
  const add = (
    code: V137IntegrityBoundaryFindingCode,
    repoPath: string,
    detail: string,
  ): void => findings.push({ code, path: repoPath, line: 1, detail })
  if (!isRecord(input.baseline)) {
    add("AUDIT_ARTIFACT_INVALID", auditJsonPath, "Audit baseline must be an object.")
    return {
      findings,
      inventoriedFiles: 0,
      creationCalls: 0,
      sqlWriters: 0,
      legacyWorkerConsumers: 0,
    }
  }

  try {
    assertV137IntegrityPublicPayload(input.baseline)
    assertV137IntegrityPublicPayload({ markdown: input.markdown })
  } catch {
    add(
      "AUDIT_PRIVACY_VIOLATION",
      auditJsonPath,
      "Audit artifacts contain restricted public data.",
    )
  }
  if (
    input.baseline.schemaVersion !== "v1.37-core-rules-audit-baseline-v1" ||
    input.baseline.milestone !== "v1.37" ||
    input.baseline.phase !== 256 ||
    input.baseline.command !== auditCommand ||
    input.baseline.planningBaselineCommit !==
      "8e301b2dca407fcceb2b2b02bfe8eba61b02c063" ||
    input.baseline.reviewedArchiveCommit !==
      "38f4a83db9298502c12db44cd66d026878803d20"
  ) {
    add(
      "AUDIT_METADATA_DRIFT",
      auditJsonPath,
      "Audit command, version, phase, or reviewed commit identity drifted.",
    )
  }
  const implementationHead = input.baseline.implementationHead
  const diffBasis = input.baseline.productionSourceDiffBasis
  if (
    typeof implementationHead !== "string" ||
    !/^[0-9a-f]{40}$/u.test(implementationHead) ||
    !isRecord(diffBasis) ||
    diffBasis.baseCommit !== input.baseline.planningBaselineCommit ||
    diffBasis.implementationCommit !== implementationHead ||
    diffBasis.pathspec !== "apps packages scripts" ||
    typeof diffBasis.changedPathCount !== "number" ||
    typeof diffBasis.changedPathListSha256 !== "string" ||
    !/^[0-9a-f]{64}$/u.test(diffBasis.changedPathListSha256)
  ) {
    add(
      "AUDIT_METADATA_DRIFT",
      auditJsonPath,
      "Production-source diff basis is incomplete or inconsistent.",
    )
  }

  const probes = Array.isArray(input.baseline.probes)
    ? input.baseline.probes
    : []
  if (probes.length !== exactAuditProbeMetadata.length) {
    add(
      "AUDIT_OBSERVATION_DRIFT",
      auditJsonPath,
      "Audit baseline must contain exactly seven probes.",
    )
  }
  const reproduced = isRecord(input.reproduced) ? input.reproduced : {}
  exactAuditProbeMetadata.forEach(([id, classification, futurePhaseOwner], index) => {
    const probe = probes[index]
    const observed = exactAuditObservations[id]
    if (
      !isRecord(probe) ||
      probe.id !== id ||
      probe.classification !== classification ||
      probe.futurePhaseOwner !== futurePhaseOwner ||
      stableJson(probe.observed) !== stableJson(observed) ||
      stableJson(reproduced[id]) !== stableJson(observed)
    ) {
      add(
        "AUDIT_OBSERVATION_DRIFT",
        auditJsonPath,
        `Exact approved observation drifted for ${id}.`,
      )
    }
  })
  const summary = input.baseline.summary
  if (
    !isRecord(summary) ||
    summary.probeCount !== 7 ||
    summary.reproducedDefectCount !== 6 ||
    summary.preservedRulingCount !== 1
  ) {
    add(
      "AUDIT_METADATA_DRIFT",
      auditJsonPath,
      "Audit summary counts must remain six defects plus one preserved ruling.",
    )
  }
  if (input.markdown !== renderV137CoreRulesAuditBaselineMarkdown(input.baseline)) {
    add(
      "AUDIT_MARKDOWN_DRIFT",
      auditMarkdownPath,
      "Human-readable audit baseline does not match the machine artifact.",
    )
  }
  return {
    findings,
    inventoriedFiles: 2,
    creationCalls: 0,
    sqlWriters: 0,
    legacyWorkerConsumers: 0,
  }
}

export const checkV137CoreRulesAuditBaseline = (
  repoRoot = defaultRepoRoot,
): V137IntegrityBoundaryAnalysis => {
  const jsonAbsolute = path.join(repoRoot, auditJsonPath)
  const markdownAbsolute = path.join(repoRoot, auditMarkdownPath)
  if (!existsSync(jsonAbsolute) || !existsSync(markdownAbsolute)) {
    return {
      findings: [{
        code: "AUDIT_ARTIFACT_MISSING",
        path: !existsSync(jsonAbsolute) ? auditJsonPath : auditMarkdownPath,
        line: 1,
        detail: "The current-HEAD core-rules audit baseline is missing.",
      }],
      inventoriedFiles: 0,
      creationCalls: 0,
      sqlWriters: 0,
      legacyWorkerConsumers: 0,
    }
  }
  let baseline: unknown
  const baselineJson = readFileSync(jsonAbsolute, "utf8")
  try {
    baseline = JSON.parse(baselineJson) as unknown
  } catch {
    return {
      findings: [{
        code: "AUDIT_ARTIFACT_INVALID",
        path: auditJsonPath,
        line: 1,
        detail: "The current-HEAD core-rules audit baseline is invalid JSON.",
      }],
      inventoriedFiles: 1,
      creationCalls: 0,
      sqlWriters: 0,
      legacyWorkerConsumers: 0,
    }
  }
  const reproduction = spawnSync(
    "pnpm",
    [
      "exec",
      "tsx",
      ".planning/artifacts/v2.0-core-rules-audit/reproduce-core-rule-gaps.ts",
    ],
    { cwd: repoRoot, encoding: "utf8", timeout: 30_000 },
  )
  let reproduced: unknown = undefined
  if (reproduction.status === 0) {
    try {
      reproduced = JSON.parse(reproduction.stdout) as unknown
    } catch {
      reproduced = undefined
    }
  }
  if (reproduced === undefined) {
    return {
      findings: [{
        code: "AUDIT_REPRODUCTION_FAILED",
        path: ".planning/artifacts/v2.0-core-rules-audit/reproduce-core-rule-gaps.ts",
        line: 1,
        detail: "The committed core-rules reproduction did not return valid JSON.",
      }],
      inventoriedFiles: 2,
      creationCalls: 0,
      sqlWriters: 0,
      legacyWorkerConsumers: 0,
    }
  }
  let analysis = analyzeV137CoreRulesAuditBaseline({
    baseline,
    markdown: readFileSync(markdownAbsolute, "utf8"),
    reproduced,
  })
  if (baselineJson !== `${JSON.stringify(baseline, null, 2)}\n`) {
    analysis = {
      ...analysis,
      findings: [...analysis.findings, {
        code: "AUDIT_ARTIFACT_INVALID",
        path: auditJsonPath,
        line: 1,
        detail: "The machine audit artifact is not in canonical deterministic formatting.",
      }],
    }
  }
  if (isRecord(baseline) && isRecord(baseline.productionSourceDiffBasis)) {
    const basis = baseline.productionSourceDiffBasis
    const paths = spawnSync(
      "git",
      [
        "diff",
        "--name-only",
        String(basis.baseCommit),
        String(basis.implementationCommit),
        "--",
        "apps",
        "packages",
        "scripts",
      ],
      { cwd: repoRoot, encoding: "utf8", timeout: 10_000 },
    )
    const sortedPaths = paths.status === 0
      ? paths.stdout.split("\n").filter(Boolean).sort().join("\n") + "\n"
      : ""
    if (
      paths.status !== 0 ||
      sortedPaths.split("\n").filter(Boolean).length !== basis.changedPathCount ||
      sha256(sortedPaths) !== basis.changedPathListSha256
    ) {
      return {
        ...analysis,
        findings: [...analysis.findings, {
          code: "AUDIT_METADATA_DRIFT",
          path: auditJsonPath,
          line: 1,
          detail: "Production-source diff basis no longer resolves exactly.",
        }],
      }
    }
  }
  return analysis
}

const creationNames = new Set([
  "createMatch",
  "createFromPreset",
  "createFromMatrix",
  "insertMatchSetWithMatrixOnClient",
])

const approvedCreationCallers: Readonly<Record<string, readonly string[]>> = {
  createFromMatrix: [
    "packages/persistence/src/competition.ts",
    "scripts/run-v1-5-advanced-demo.ts",
  ],
  createFromPreset: [
    "packages/persistence/src/workshop.ts",
    "packages/persistence/src/dev-smoke.ts",
  ],
  insertMatchSetWithMatrixOnClient: [
    "packages/persistence/src/matchset-service.ts",
    "packages/persistence/src/ladder.ts",
  ],
  createMatch: [],
}

const approvedSqlWriters: Readonly<Record<string, readonly string[]>> = {
  match_sets: ["packages/persistence/src/matchset-service.ts"],
  match_set_execution_entrants: [
    "packages/persistence/src/matchset-service.ts",
    "packages/persistence/src/integrity-evidence.ts",
  ],
  competition_entrants: ["packages/persistence/src/matchset-service.ts"],
  matches: [
    "packages/persistence/src/match-service.ts",
    "packages/persistence/src/matchset-service.ts",
  ],
  match_jobs: [
    "packages/persistence/src/match-service.ts",
    "packages/persistence/src/matchset-service.ts",
  ],
  chronicles: ["packages/persistence/src/chronicle-store.ts"],
}

const approvedLegacyWorkerConsumers = new Set([
  "apps/worker/src/runner.ts",
  "scripts/preflight.ts",
  "scripts/run-v1-4-demo-tournament.ts",
])

const normalized = (value: string): string => value.split(path.sep).join("/")

const lineOf = (file: ts.SourceFile, node: ts.Node): number =>
  file.getLineAndCharacterOfPosition(node.getStart(file)).line + 1

const callName = (node: ts.CallExpression): string | undefined => {
  if (ts.isIdentifier(node.expression)) return node.expression.text
  if (ts.isPropertyAccessExpression(node.expression)) {
    return node.expression.name.text
  }
  return undefined
}

const objectPropertyNames = (node: ts.Expression | undefined): Set<string> => {
  if (!node || !ts.isObjectLiteralExpression(node)) return new Set()
  return new Set(
    node.properties.flatMap((property) => {
      if (
        (ts.isPropertyAssignment(property) ||
          ts.isShorthandPropertyAssignment(property) ||
          ts.isMethodDeclaration(property)) &&
        property.name
      ) {
        return [property.name.getText().replaceAll(/["']/g, "")]
      }
      return []
    }),
  )
}

const analyzeSource = (
  repoPath: string,
  source: string,
): Omit<V137IntegrityBoundaryAnalysis, "inventoriedFiles"> => {
  const findings: V137IntegrityBoundaryFinding[] = []
  let creationCalls = 0
  let sqlWriters = 0
  let legacyWorkerConsumers = 0
  const file = ts.createSourceFile(
    repoPath,
    source,
    ts.ScriptTarget.Latest,
    true,
    repoPath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  )
  const add = (
    code: V137IntegrityBoundaryFindingCode,
    node: ts.Node,
    detail: string,
  ): void => {
    findings.push({ code, path: repoPath, line: lineOf(file, node), detail })
  }

  const visit = (node: ts.Node): void => {
    if (ts.isImportDeclaration(node)) {
      const specifier = ts.isStringLiteral(node.moduleSpecifier)
        ? node.moduleSpecifier.text
        : ""
      if (specifier.includes("apps/worker/src/runner")) {
        legacyWorkerConsumers += 1
        if (!approvedLegacyWorkerConsumers.has(repoPath)) {
          add(
            "UNRECOGNIZED_LEGACY_WORKER_CONSUMER",
            node,
            "Legacy TypeScript worker imports require explicit retirement ownership.",
          )
        }
      }
    }
    if (ts.isCallExpression(node)) {
      const name = callName(node)
      if (name === "runWorkerOnce" || name === "runWorkerLoop") {
        legacyWorkerConsumers += 1
        if (!approvedLegacyWorkerConsumers.has(repoPath)) {
          add(
            "UNRECOGNIZED_LEGACY_WORKER_CONSUMER",
            node,
            `Unapproved legacy worker call: ${name}.`,
          )
        }
      }
      if (name && creationNames.has(name)) {
        creationCalls += 1
        if (!(approvedCreationCallers[name] ?? []).includes(repoPath)) {
          add(
            "UNRECOGNIZED_CREATION_CALLER",
            node,
            `Unapproved canonical creation caller: ${name}.`,
          )
        } else if (
          !(
            repoPath === "packages/persistence/src/matchset-service.ts" &&
            name === "insertMatchSetWithMatrixOnClient"
          )
        ) {
          const properties = objectPropertyNames(
            [...node.arguments]
              .reverse()
              .find((argument) => ts.isObjectLiteralExpression(argument)),
          )
          if (!properties.has("integrityIdentity")) {
            add(
              "CALLER_EVIDENCE_MISSING",
              node,
              `${name} must receive an exact integrityIdentity.`,
            )
          }
          if (
            name === "createFromMatrix" &&
            (!source.includes("bottomEntrantKey") ||
              !source.includes("topEntrantKey"))
          ) {
            add(
              "CALLER_ORDERED_PAIR_MISSING",
              node,
              "Matrix callers must wire both ordered execution entrant keys.",
            )
          }
          if (
            name === "createFromMatrix" &&
            source.includes("competitionEntrants") &&
            !source.includes("executionEntrantKey")
          ) {
            add(
              "CALLER_ENTRANT_SET_MISSING",
              node,
              "Competition entrants must identify their execution entrant key.",
            )
          }
          if (
            repoPath === "packages/persistence/src/dev-smoke.ts" &&
            (!source.includes('trustDomain !== "fixture"') ||
              !source.includes("resolveMatchSetExecutionEvidence"))
          ) {
            add(
              "DEV_FIXTURE_BOUNDARY_MISSING",
              node,
              "Development smoke must require explicit fixture-domain authority.",
            )
          }
        }
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(file)

  const declarationNames = new Set<string>()
  for (const statement of file.statements) {
    if (ts.isFunctionDeclaration(statement) && statement.name) {
      declarationNames.add(statement.name.text)
    }
    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name)) declarationNames.add(declaration.name.text)
      }
    }
  }
  const fileNode = file.statements[0] ?? file
  if (
    declarationNames.has("CANONICAL_AUTHORITY_REGISTRY") &&
    repoPath !== "packages/spec/src/integrity-authority.ts"
  ) {
    add("DUPLICATE_AUTHORITY_OWNER", fileNode, "Canonical owner registry may be declared only by @cowards/spec.")
  }
  if (
    declarationNames.has("scheduleTrialLadderSeason") &&
    repoPath !== "packages/persistence/src/ladder.ts"
  ) {
    add("DUPLICATE_SCHEDULER_AUTHORITY", fileNode, "Set scheduling policy has one persistence owner.")
  }
  if (
    repoPath.startsWith("apps/web/") &&
    /(?:from\s+["']@cowards\/engine["']|resolveAction\s*\()/u.test(source)
  ) {
    add("UI_RULE_AUTHORITY", fileNode, "Web code may project rules but may not execute them.")
  }
  if (
    declarationNames.has("evaluateExecutableLaneEligibility") &&
    repoPath !== "packages/spec/src/runtime-evidence.ts"
  ) {
    add("DUPLICATE_ADAPTER_CLASSIFIER", fileNode, "Executable lane classification has one spec owner.")
  }
  if (
    declarationNames.has("ArenaVariantSchema") &&
    repoPath !== "packages/spec/src/schemas.ts"
  ) {
    add("DUPLICATE_ARENA_AUTHORITY", fileNode, "Arena validation has one spec owner.")
  }
  if (/countedResultsAllowed\s*\?\s*["']counted["']/u.test(source)) {
    add("STATIC_PROMOTION_PATH", fileNode, "Descriptive registry flags cannot promote counted execution.")
  }
  if (
    /(?:accepted|eligible|supported)\s*=.*(?:input\.)?(?:rules|engine|runtimeAbi|chronicle|arenaCatalog|setPolicy)\s*===/u.test(source) &&
    !source.includes("resolveCanonicalCompatibilityTuple")
  ) {
    add("PARTIAL_TUPLE_ACCEPTANCE", fileNode, "Compatibility consumers must resolve the complete exact tuple.")
  }
  if (
    /apps\/web\/app\/api\/.+\/route\.tsx?$/u.test(repoPath) &&
    /\b(?:executeMatch|runMatch|runWorkerOnce|runWorkerLoop)\s*\(/u.test(source)
  ) {
    add("PUBLIC_EXECUTION_ROUTE", fileNode, "Public web routes cannot own Strategy or Match execution.")
  }
  if (
    /insert\s+into\s+runtime_evidence_certificates\b/iu.test(source) &&
    repoPath !== "packages/persistence/src/runtime-evidence-import.ts"
  ) {
    add("RAW_CERTIFICATE_WRITER", fileNode, "Certificates may be written only by verified attestation import.")
  }
  if (/trustDomain\s*===?\s*["']fixture["'][\s\S]{0,120}["']counted["']/u.test(source)) {
    add("FIXTURE_PRODUCTION_PROMOTION", fileNode, "Fixture trust cannot grant production counted eligibility.")
  }
  if (/(?:gateName|documentation|docs)[\s\S]{0,100}(?:passed|approved)[\s\S]{0,100}["']counted["']/iu.test(source)) {
    add("DECLARATION_PROMOTION_PATH", fileNode, "Gate names or documentation cannot mint executable evidence.")
  }
  if (/request\.(?:containmentCertificate|conformanceCertificate|certificateBody|attestationBody)\b/u.test(source)) {
    add("REQUEST_AUTHORITY_BODY", fileNode, "Runtime requests may carry references, never authority bodies.")
  }

  const sqlPattern =
    /insert\s+into\s+(match_sets|match_set_execution_entrants|competition_entrants|matches|match_jobs|chronicles)\b/giu
  for (const match of source.matchAll(sqlPattern)) {
    const table = match[1]!.toLowerCase()
    sqlWriters += 1
    if (!(approvedSqlWriters[table] ?? []).includes(repoPath)) {
      const position = match.index ?? 0
      const line = source.slice(0, position).split("\n").length
      findings.push({
        code: "UNRECOGNIZED_SQL_WRITER",
        path: repoPath,
        line,
        detail: `Unapproved direct SQL writer for ${table}.`,
      })
    }
  }

  return { findings, creationCalls, sqlWriters, legacyWorkerConsumers }
}

export const analyzeV137IntegritySources = (
  sources: Readonly<Record<string, string>>,
  options: AnalyzeV137IntegritySourcesOptions = {},
): V137IntegrityBoundaryAnalysis => {
  const analyses = Object.entries(sources)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([repoPath, source]) => analyzeSource(normalized(repoPath), source))
  const findings = analyses.flatMap((analysis) => analysis.findings)
  if (options.enforceKnownDebtFingerprints) {
    for (const [key, expected] of Object.entries(knownPhase257DebtFingerprints)) {
      const separator = key.lastIndexOf("#")
      const repoPath = key.slice(0, separator)
      const symbol = key.slice(separator + 1)
      const source = sources[repoPath]
      const file = source
        ? ts.createSourceFile(repoPath, source, ts.ScriptTarget.Latest, true)
        : undefined
      let declarationText: string | undefined
      if (file) {
        for (const statement of file.statements) {
          if (!ts.isVariableStatement(statement)) continue
          for (const declaration of statement.declarationList.declarations) {
            if (ts.isIdentifier(declaration.name) && declaration.name.text === symbol) {
              declarationText = declaration.getText(file)
            }
          }
        }
      }
      if (!declarationText || sha256(declarationText) !== expected) {
        findings.push({
          code: "KNOWN_PHASE_257_DEBT_DRIFT",
          path: repoPath,
          line: 1,
          detail: `Known Phase-257 debt fingerprint changed for ${symbol}.`,
        })
      }
    }
  }
  if (options.enforceRepositoryContracts) {
    const requireMarkers = (
      repoPath: string,
      markers: readonly string[],
      code: V137IntegrityBoundaryFindingCode,
    ): void => {
      const source = sources[repoPath] ?? ""
      const missing = markers.filter((marker) => !source.includes(marker))
      if (missing.length > 0) {
        findings.push({
          code,
          path: repoPath,
          line: 1,
          detail: `Required integrity markers missing: ${missing.join(", ")}.`,
        })
      }
    }
    requireMarkers(
      "packages/persistence/src/runtime-evidence-import.ts",
      ["importVerifiedRuntimeEvidenceAttestation", "verifyRuntimeEvidenceAttestation(immutableInput)", "Sole application-level certificate writer"],
      "AUTHORITY_CHAIN_DRIFT",
    )
    requireMarkers(
      "packages/persistence/src/runtime-evidence-authority-publisher.ts",
      ["withSerializableTransaction", "verifyImport", "runtime_evidence_authority_publication_sources", "installRuntimeEvidenceAuthorityPublication", "v1.37-runtime-evidence-authority-install-receipt-v1"],
      "AUTHORITY_CHAIN_DRIFT",
    )
    requireMarkers(
      "apps/runtime-service/src/runtime-evidence-authority.ts",
      ["readBoundedDescriptor", "verify(null", "installHighWater", "deploymentPin"],
      "AUTHORITY_CHAIN_DRIFT",
    )
    requireMarkers(
      "apps/go-backend/runtime_evidence_authority.go",
      ["ed25519.Verify", "installRuntimeEvidenceAuthorityHighWater", "MinimumBundleHash"],
      "AUTHORITY_CHAIN_DRIFT",
    )
    requireMarkers(
      "apps/go-backend/integrity_creation.go",
      ["lockInstalledAuthorityReceipt", "for share of h, p", "sourceManifestHash", "sourceSetCount"],
      "GO_RECEIPT_AUTHORITY_DRIFT",
    )
    requireMarkers(
      "apps/runtime-service/src/execute-match.test.ts",
      ["createFixtureRuntimeExecutionEvidenceSnapshot", "createFixtureRuntimeEvidenceAuthorityLoader", "evidenceSnapshot", "fixture-only:untrusted"],
      "RUNTIME_REQUEST_ENVELOPE_DRIFT",
    )
    requireMarkers(
      "apps/runtime-service/src/counted-safety.test.ts",
      ["createFixtureRuntimeExecutionAuthorityContext", "evidenceSnapshot", "authorityLoader", "exhibition_only"],
      "RUNTIME_REQUEST_ENVELOPE_DRIFT",
    )
    requireMarkers(
      "apps/runtime-service/src/four-language-parity.test.ts",
      ["createFixtureRuntimeExecutionEvidenceSnapshot", "createFixtureRuntimeEvidenceAuthorityLoader", "evidenceSnapshot", "fourLanguageGoldenPairs"],
      "RUNTIME_REQUEST_ENVELOPE_DRIFT",
    )
  }
  findings.sort(
    (left, right) =>
      left.path.localeCompare(right.path) ||
      left.line - right.line ||
      left.code.localeCompare(right.code),
  )
  return {
    findings,
    inventoriedFiles: analyses.length,
    creationCalls: analyses.reduce(
      (total, analysis) => total + analysis.creationCalls,
      0,
    ),
    sqlWriters: analyses.reduce(
      (total, analysis) => total + analysis.sqlWriters,
      0,
    ),
    legacyWorkerConsumers: analyses.reduce(
      (total, analysis) => total + analysis.legacyWorkerConsumers,
      0,
    ),
  }
}

const collectTypeScriptSources = (
  repoRoot: string,
): Readonly<Record<string, string>> => {
  const sources: Record<string, string> = {}
  const excludedDirectories = new Set([
    ".git",
    ".next",
    ".planning",
    "coverage",
    "dist",
    "node_modules",
  ])
  const walk = (directory: string): void => {
    if (!existsSync(directory)) return
    for (const name of readdirSync(directory).sort()) {
      if (excludedDirectories.has(name)) continue
      const absolutePath = path.join(directory, name)
      const stat = statSync(absolutePath)
      if (stat.isDirectory()) {
        walk(absolutePath)
        continue
      }
      if (
        !name.match(/\.tsx?$/u) ||
        name.match(/\.(test|spec)\.tsx?$/u) ||
        name.endsWith(".d.ts")
      ) {
        continue
      }
      sources[normalized(path.relative(repoRoot, absolutePath))] = readFileSync(
        absolutePath,
        "utf8",
      )
    }
  }
  for (const root of ["apps", "packages", "scripts"]) {
    walk(path.join(repoRoot, root))
  }
  for (const repoPath of [
    "apps/runtime-service/src/execute-match.test.ts",
    "apps/runtime-service/src/counted-safety.test.ts",
    "apps/runtime-service/src/four-language-parity.test.ts",
    "apps/go-backend/runtime_evidence_authority.go",
    "apps/go-backend/integrity_creation.go",
  ]) {
    const absolutePath = path.join(repoRoot, repoPath)
    if (existsSync(absolutePath)) sources[repoPath] = readFileSync(absolutePath, "utf8")
  }
  return sources
}

export const analyzeV137IntegrityBoundaries = (
  repoRoot = defaultRepoRoot,
): V137IntegrityBoundaryAnalysis => {
  const structural = analyzeV137IntegritySources(collectTypeScriptSources(repoRoot), {
    enforceRepositoryContracts: true,
    enforceKnownDebtFingerprints: true,
  })
  const audit = checkV137CoreRulesAuditBaseline(repoRoot)
  return {
    ...structural,
    findings: [...structural.findings, ...audit.findings],
    inventoriedFiles: structural.inventoriedFiles + audit.inventoriedFiles,
  }
}

const isDirectExecution = (): boolean =>
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (isDirectExecution()) {
  const analysis = analyzeV137IntegrityBoundaries()
  if (analysis.findings.length > 0) {
    for (const finding of analysis.findings) {
      console.error(
        `${finding.code} ${finding.path}:${finding.line} ${finding.detail}`,
      )
    }
    process.exitCode = 1
  } else {
    console.log(
      `v1.37 integrity inventory files=${analysis.inventoriedFiles} creation_calls=${analysis.creationCalls} sql_writers=${analysis.sqlWriters} legacy_worker_consumers=${analysis.legacyWorkerConsumers}`,
    )
  }
}
