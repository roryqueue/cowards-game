#!/usr/bin/env -S pnpm exec tsx
import { createHash } from "node:crypto"
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import ts from "typescript"

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
)

export const candidateEventCoverageArtifactPath =
  "packages/spec/artifacts/v1.37-candidate-event-coverage.json" as const
const candidateAuthorityArtifactPath =
  "packages/spec/artifacts/v1.37-kernel-integrity-candidate.json" as const

export const ACTIVE_EVENT_BYTE_BASELINE = {
  "packages/spec/src/types.ts":
    "d32ba8a46f06b3b896d96114c72747e4a9fc61897cfc53a14f77fd2b53d1ae21",
  "packages/spec/src/schemas.ts":
    "43c3f6b08791cafe92b5cd2a6d3f30c1a74c9241dda70e550df8fd11600d91c1",
  "packages/spec/src/versions.ts":
    "98ac9b63482c0a392694551db9a5de2443aa3119f62387316457f03d64341821",
  "packages/spec/src/integrity-authority.ts":
    "11ed27e5646f8f908e2d2b9558a144b28f362ebe395c7a66b58c308953ca83b9",
  "packages/spec/artifacts/v1.37-integrity-authority.json":
    "90bd23acff825349ed80b3df6b8e350ecd91153de44e17c952f5a302c7d3499d",
  "packages/spec/artifacts/v1.37-integrity-authority-hash-vectors.json":
    "cf8ac66719f06c7ebfb4db987524809495be6b6b5a2cbbb75fefbf1c06daafad",
} as const

const ENGINE_PRODUCER_FILES = [
  "packages/engine/src/activation.ts",
  "packages/engine/src/backstab.ts",
  "packages/engine/src/contraction.ts",
  "packages/engine/src/match.ts",
  "packages/engine/src/movement.ts",
  "packages/engine/src/outcome.ts",
] as const

export const CANDIDATE_CONSUMER_SURFACES = [
  {
    name: "chronicle-grammar",
    relativePath: "packages/replay/src/grammar.ts",
    candidateSetSymbol: "V1_37_CANDIDATE_GRAMMAR_EVENT_TYPES",
    resolverSymbol: "resolveGrammarEventContract",
    disposition: "semantic-validator",
  },
  {
    name: "replay-transition",
    relativePath: "packages/replay/src/replay-transition.ts",
    candidateSetSymbol: "V1_37_CANDIDATE_REPLAY_TRANSITION_EVENT_TYPES",
    resolverSymbol: "resolveReplayTransitionEventContract",
    disposition: "state-reconstructor-or-explicit-no-op",
  },
  {
    name: "match-intelligence",
    relativePath: "apps/web/app/match-intelligence.ts",
    candidateSetSymbol: "V1_37_CANDIDATE_MATCH_INTELLIGENCE_EVENT_TYPES",
    resolverSymbol: "resolveMatchIntelligenceEventContract",
    disposition: "annotation-consumer-or-no-special-annotation",
  },
  {
    name: "replay-ready",
    relativePath: "apps/web/app/matches/replay-ready.ts",
    candidateSetSymbol: "V1_37_CANDIDATE_REPLAY_READY_EVENT_TYPES",
    resolverSymbol: "resolveReplayReadyEventContract",
    disposition: "timeline-consumer-or-generic-label",
  },
  {
    name: "replay-board",
    relativePath: "apps/web/app/matches/[matchId]/replay/replay-board-model.ts",
    candidateSetSymbol: "V1_37_CANDIDATE_REPLAY_BOARD_EVENT_TYPES",
    resolverSymbol: "resolveReplayBoardEventContract",
    disposition: "board-consumer-or-no-callout",
  },
] as const

const CANDIDATE_TUPLE_CONST = "V1_37_CANDIDATE_TUPLE_ID" as const
const REMOVED_EVENT = "PUSH_ATTEMPTED" as const

export type CandidateEventCoverageFindingCode =
  | "ACTIVE_CONTRACT_BYTE_DRIFT"
  | "CANDIDATE_ARTIFACT_INVALID"
  | "DUPLICATE_CANDIDATE_DECLARATION"
  | "REMOVED_EVENT_POLICY_INVALID"
  | "REMOVED_EVENT_REINTRODUCED"
  | "UNDECLARED_PRODUCER"
  | "UNPRODUCED_EVENT"
  | "MISSING_CONSUMER_DISPOSITION"
  | "STALE_CONSUMER_DISPOSITION"
  | "DUPLICATE_CONSUMER_DISPOSITION"
  | "TUPLE_ROUTE_INVALID"
  | "OLD_CURRENT_BEHAVIOR_MISSING"

export interface CandidateEventCoverageFinding {
  code: CandidateEventCoverageFindingCode
  message: string
  eventType?: string
  relativePath?: string
}

export class CandidateEventCoverageError extends Error {
  readonly findings: CandidateEventCoverageFinding[]

  constructor(findings: CandidateEventCoverageFinding[]) {
    super(
      `Candidate event coverage failed closed:\n${findings
        .map((finding) => `- ${finding.code}: ${finding.message}`)
        .join("\n")}`,
    )
    this.name = "CandidateEventCoverageError"
    this.findings = findings
  }
}

interface CandidateAuthorityArtifact {
  status?: unknown
  candidate?: {
    candidateTupleId?: unknown
    eventVocabulary?: {
      candidateCurrent?: unknown
      removedFromCandidateCurrent?: unknown
    }
  }
}

interface SourceLocation {
  relativePath: string
  line: number
}

interface BuildOptions {
  candidateArtifact?: CandidateAuthorityArtifact
  sourceOverrides?: Readonly<Record<string, string>>
}

const sha256 = (value: string | Uint8Array): string =>
  createHash("sha256").update(value).digest("hex")

const readRepoFile = (
  relativePath: string,
  sourceOverrides: Readonly<Record<string, string>>,
): string =>
  sourceOverrides[relativePath] ??
  readFileSync(path.join(repoRoot, relativePath), "utf8")

const sourceFileFor = (relativePath: string, source: string): ts.SourceFile =>
  ts.createSourceFile(
    relativePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  )

const lineOf = (sourceFile: ts.SourceFile, node: ts.Node): number =>
  sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1

const visit = (node: ts.Node, visitor: (candidate: ts.Node) => void): void => {
  visitor(node)
  ts.forEachChild(node, (child) => visit(child, visitor))
}

const identifierText = (
  node: ts.BindingName | ts.PropertyName,
): string | null =>
  ts.isIdentifier(node) || ts.isStringLiteralLike(node) ? node.text : null

const findVariable = (
  sourceFile: ts.SourceFile,
  symbol: string,
): ts.VariableDeclaration | undefined => {
  let found: ts.VariableDeclaration | undefined
  visit(sourceFile, (node) => {
    if (
      found === undefined &&
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === symbol
    ) {
      found = node
    }
  })
  return found
}

const extractStringSet = (
  sourceFile: ts.SourceFile,
  symbol: string,
): Array<{ eventType: string; line: number }> | null => {
  const declaration = findVariable(sourceFile, symbol)
  const initializer = declaration?.initializer
  if (
    initializer === undefined ||
    !ts.isNewExpression(initializer) ||
    !ts.isIdentifier(initializer.expression) ||
    initializer.expression.text !== "Set" ||
    initializer.arguments?.length !== 1
  ) {
    return null
  }
  const values = initializer.arguments[0]
  if (!ts.isArrayLiteralExpression(values)) return null
  const entries: Array<{ eventType: string; line: number }> = []
  for (const element of values.elements) {
    if (!ts.isStringLiteralLike(element)) return null
    entries.push({ eventType: element.text, line: lineOf(sourceFile, element) })
  }
  return entries
}

const extractStringConstant = (
  sourceFile: ts.SourceFile,
  symbol: string,
): string | null => {
  const initializer = findVariable(sourceFile, symbol)?.initializer
  return initializer && ts.isStringLiteralLike(initializer)
    ? initializer.text
    : null
}

const resolverIsTupleRouted = (
  sourceFile: ts.SourceFile,
  resolverSymbol: string,
  candidateSetSymbol: string,
): boolean => {
  const resolver = findVariable(sourceFile, resolverSymbol)?.initializer
  if (resolver === undefined || !ts.isArrowFunction(resolver)) return false
  const identifiers = new Set<string>()
  const strings = new Set<string>()
  visit(resolver, (node) => {
    if (ts.isIdentifier(node)) identifiers.add(node.text)
    if (ts.isStringLiteralLike(node)) strings.add(node.text)
  })
  return (
    identifiers.has(CANDIDATE_TUPLE_CONST) &&
    identifiers.has(candidateSetSymbol) &&
    strings.has("candidate-current") &&
    strings.has("historical-or-unknown") &&
    strings.has("active-current")
  )
}

const hasExecutableOldCurrentCase = (sourceFile: ts.SourceFile): boolean => {
  let found = false
  visit(sourceFile, (node) => {
    if (found) return
    if (
      ts.isCaseClause(node) &&
      ts.isStringLiteralLike(node.expression) &&
      node.expression.text === REMOVED_EVENT
    ) {
      found = true
      return
    }
    if (ts.isPropertyAssignment(node)) {
      const name = identifierText(node.name)
      if (name === REMOVED_EVENT) found = true
    }
  })
  return found
}

const collectEngineProducers = (
  sourceOverrides: Readonly<Record<string, string>>,
): Map<string, SourceLocation[]> => {
  const producers = new Map<string, SourceLocation[]>()
  for (const relativePath of ENGINE_PRODUCER_FILES) {
    const source = readRepoFile(relativePath, sourceOverrides)
    const sourceFile = sourceFileFor(relativePath, source)
    visit(sourceFile, (node) => {
      if (
        !ts.isCallExpression(node) ||
        !ts.isIdentifier(node.expression) ||
        node.expression.text !== "event" ||
        node.arguments.length === 0
      ) {
        return
      }
      const eventType = node.arguments[0]
      if (!ts.isStringLiteralLike(eventType)) return
      const locations = producers.get(eventType.text) ?? []
      locations.push({
        relativePath,
        line: lineOf(sourceFile, eventType),
      })
      producers.set(eventType.text, locations)
    })
  }
  return producers
}

const parseCandidateArtifact = (
  artifact: CandidateAuthorityArtifact,
  findings: CandidateEventCoverageFinding[],
): {
  candidateTupleId: string
  candidateEventVocabulary: string[]
  removedFromCandidateCurrent: string[]
} | null => {
  const tupleId = artifact.candidate?.candidateTupleId
  const candidateCurrent = artifact.candidate?.eventVocabulary?.candidateCurrent
  const removed =
    artifact.candidate?.eventVocabulary?.removedFromCandidateCurrent
  if (
    artifact.status !== "inactive-candidate" ||
    typeof tupleId !== "string" ||
    !Array.isArray(candidateCurrent) ||
    !candidateCurrent.every((value) => typeof value === "string") ||
    !Array.isArray(removed) ||
    !removed.every((value) => typeof value === "string")
  ) {
    findings.push({
      code: "CANDIDATE_ARTIFACT_INVALID",
      message: "Kernel candidate artifact is not a closed inactive candidate.",
      relativePath: candidateAuthorityArtifactPath,
    })
    return null
  }
  return {
    candidateTupleId: tupleId,
    candidateEventVocabulary: candidateCurrent,
    removedFromCandidateCurrent: removed,
  }
}

export const buildV137CandidateEventCoverage = (options: BuildOptions = {}) => {
  const sourceOverrides = options.sourceOverrides ?? {}
  const findings: CandidateEventCoverageFinding[] = []
  for (const [relativePath, expected] of Object.entries(
    ACTIVE_EVENT_BYTE_BASELINE,
  )) {
    const actual = sha256(readFileSync(path.join(repoRoot, relativePath)))
    if (actual !== expected) {
      findings.push({
        code: "ACTIVE_CONTRACT_BYTE_DRIFT",
        message: `${relativePath} changed from the locked active baseline.`,
        relativePath,
      })
    }
  }

  const candidateArtifact =
    options.candidateArtifact ??
    (JSON.parse(
      readRepoFile(candidateAuthorityArtifactPath, sourceOverrides),
    ) as CandidateAuthorityArtifact)
  const candidate = parseCandidateArtifact(candidateArtifact, findings)
  if (candidate === null) throw new CandidateEventCoverageError(findings)

  const candidateSet = new Set(candidate.candidateEventVocabulary)
  if (candidateSet.size !== candidate.candidateEventVocabulary.length) {
    findings.push({
      code: "DUPLICATE_CANDIDATE_DECLARATION",
      message: "Candidate event vocabulary contains duplicate declarations.",
    })
  }
  if (
    candidate.removedFromCandidateCurrent.length !== 1 ||
    candidate.removedFromCandidateCurrent[0] !== REMOVED_EVENT
  ) {
    findings.push({
      code: "REMOVED_EVENT_POLICY_INVALID",
      message: `${REMOVED_EVENT} must be the sole proposed removed current event.`,
      eventType: REMOVED_EVENT,
    })
  }
  if (candidateSet.has(REMOVED_EVENT)) {
    findings.push({
      code: "REMOVED_EVENT_REINTRODUCED",
      message: `${REMOVED_EVENT} cannot be declared in candidate-current vocabulary.`,
      eventType: REMOVED_EVENT,
    })
  }

  const producers = collectEngineProducers(sourceOverrides)
  for (const [eventType, locations] of producers) {
    if (!candidateSet.has(eventType)) {
      findings.push({
        code: "UNDECLARED_PRODUCER",
        message: `Engine emits undeclared candidate event ${eventType}.`,
        eventType,
        relativePath: locations[0]?.relativePath,
      })
    }
  }
  for (const eventType of candidate.candidateEventVocabulary) {
    if ((producers.get(eventType)?.length ?? 0) === 0) {
      findings.push({
        code: "UNPRODUCED_EVENT",
        message: `Candidate event ${eventType} has no executable engine event(...) producer.`,
        eventType,
      })
    }
  }

  const consumerLocations = new Map<string, Map<string, SourceLocation>>()
  for (const surface of CANDIDATE_CONSUMER_SURFACES) {
    const source = readRepoFile(surface.relativePath, sourceOverrides)
    const sourceFile = sourceFileFor(surface.relativePath, source)
    const entries = extractStringSet(sourceFile, surface.candidateSetSymbol)
    const byEvent = new Map<string, SourceLocation>()
    if (entries === null) {
      findings.push({
        code: "TUPLE_ROUTE_INVALID",
        message: `${surface.candidateSetSymbol} is not an AST-readable Set literal.`,
        relativePath: surface.relativePath,
      })
    } else {
      for (const entry of entries) {
        if (byEvent.has(entry.eventType)) {
          findings.push({
            code: "DUPLICATE_CONSUMER_DISPOSITION",
            message: `${surface.name} repeats ${entry.eventType}.`,
            eventType: entry.eventType,
            relativePath: surface.relativePath,
          })
        }
        byEvent.set(entry.eventType, {
          relativePath: surface.relativePath,
          line: entry.line,
        })
        if (!candidateSet.has(entry.eventType)) {
          findings.push({
            code: "STALE_CONSUMER_DISPOSITION",
            message: `${surface.name} declares stale candidate event ${entry.eventType}.`,
            eventType: entry.eventType,
            relativePath: surface.relativePath,
          })
        }
      }
      for (const eventType of candidate.candidateEventVocabulary) {
        if (!byEvent.has(eventType)) {
          findings.push({
            code: "MISSING_CONSUMER_DISPOSITION",
            message: `${surface.name} has no candidate disposition for ${eventType}.`,
            eventType,
            relativePath: surface.relativePath,
          })
        }
      }
    }
    if (
      extractStringConstant(sourceFile, CANDIDATE_TUPLE_CONST) !==
        candidate.candidateTupleId ||
      !resolverIsTupleRouted(
        sourceFile,
        surface.resolverSymbol,
        surface.candidateSetSymbol,
      )
    ) {
      findings.push({
        code: "TUPLE_ROUTE_INVALID",
        message: `${surface.name} does not route the exact candidate tuple through an unknown-safe candidate set.`,
        relativePath: surface.relativePath,
      })
    }
    if (!hasExecutableOldCurrentCase(sourceFile)) {
      findings.push({
        code: "OLD_CURRENT_BEHAVIOR_MISSING",
        message: `${surface.name} no longer has executable old-current handling for ${REMOVED_EVENT}.`,
        eventType: REMOVED_EVENT,
        relativePath: surface.relativePath,
      })
    }
    consumerLocations.set(surface.name, byEvent)
  }

  if (findings.length > 0) throw new CandidateEventCoverageError(findings)

  return {
    schemaVersion: "v1.37-candidate-event-coverage-v1" as const,
    generatorVersion: "generate-v1-37-event-coverage-v1" as const,
    generatedBy: "scripts/generate-v1-37-event-coverage.ts" as const,
    status: "inactive-candidate" as const,
    trustState: "untrusted-non-publishable" as const,
    currentContractClaimed: false as const,
    publicationAllowed: false as const,
    countedExecutionAllowed: false as const,
    activationPlan: "257-19-atomic-current-authority-flip" as const,
    analysisMode: "typescript-ast" as const,
    candidateTupleId: candidate.candidateTupleId,
    candidateEventVocabulary: [...candidate.candidateEventVocabulary],
    removedFromCandidateCurrent: [...candidate.removedFromCandidateCurrent],
    activeEventByteBaseline: { ...ACTIVE_EVENT_BYTE_BASELINE },
    producerFiles: ENGINE_PRODUCER_FILES.map((relativePath) => ({
      relativePath,
      sha256: sha256(readRepoFile(relativePath, sourceOverrides)),
    })),
    consumerSurfaces: CANDIDATE_CONSUMER_SURFACES.map((surface) => ({
      name: surface.name,
      relativePath: surface.relativePath,
      candidateSetSymbol: surface.candidateSetSymbol,
      resolverSymbol: surface.resolverSymbol,
      disposition: surface.disposition,
      sourceSha256: sha256(readRepoFile(surface.relativePath, sourceOverrides)),
      removedEventDisposition: "historical-or-unknown" as const,
      activeTupleDisposition: "active-current" as const,
    })),
    coverage: candidate.candidateEventVocabulary.map((eventType) => ({
      eventType,
      producers: [...(producers.get(eventType) ?? [])],
      consumerDispositions: CANDIDATE_CONSUMER_SURFACES.map((surface) => ({
        surface: surface.name,
        disposition: surface.disposition,
        evidence: consumerLocations.get(surface.name)?.get(eventType)!,
      })),
    })),
  }
}

export const renderV137CandidateEventCoverageArtifact = (
  artifact = buildV137CandidateEventCoverage(),
): string => `${JSON.stringify(artifact, null, 2)}\n`

export const writeV137CandidateEventCoverageArtifact = (): void => {
  const absolutePath = path.join(repoRoot, candidateEventCoverageArtifactPath)
  mkdirSync(path.dirname(absolutePath), { recursive: true })
  writeFileSync(
    absolutePath,
    renderV137CandidateEventCoverageArtifact(),
    "utf8",
  )
}

export const checkV137CandidateEventCoverageArtifact = (): string[] => {
  const expected = renderV137CandidateEventCoverageArtifact()
  let actual: string | undefined
  try {
    actual = readFileSync(
      path.join(repoRoot, candidateEventCoverageArtifactPath),
      "utf8",
    )
  } catch {
    return [candidateEventCoverageArtifactPath]
  }
  return actual === expected ? [] : [candidateEventCoverageArtifactPath]
}

const main = (): void => {
  const args = new Set(process.argv.slice(2))
  if (!args.has("--candidate")) {
    console.error(
      "Candidate mode is required; this generator cannot claim the current contract.",
    )
    process.exitCode = 1
    return
  }
  try {
    if (args.has("--write")) {
      writeV137CandidateEventCoverageArtifact()
      console.log("v1.37 inactive candidate event coverage artifact written")
      return
    }
    if (args.has("--check")) {
      const stale = checkV137CandidateEventCoverageArtifact()
      if (stale.length > 0) {
        console.error(
          `v1.37 candidate event coverage is stale: ${stale.join(", ")}`,
        )
        process.exitCode = 1
        return
      }
      console.log("v1.37 inactive candidate event coverage artifact is current")
      return
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
    return
  }
  console.error(
    "Usage: generate-v1-37-event-coverage.ts --candidate --write | --candidate --check",
  )
  process.exitCode = 1
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main()
}
