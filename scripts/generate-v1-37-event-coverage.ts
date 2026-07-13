#!/usr/bin/env -S pnpm exec tsx
import { createHash } from "node:crypto"
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import ts from "typescript"
import { CANONICAL_COMPATIBILITY_TUPLES } from "../packages/spec/src/integrity-authority.js"
import { ChronicleEventTypeSchema } from "../packages/spec/src/schemas.js"

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
)

export const candidateEventCoverageArtifactPath =
  "packages/spec/artifacts/v1.37-candidate-event-coverage.json" as const
export const currentEventCoverageArtifactPath =
  "packages/spec/artifacts/v1.37-current-event-coverage.json" as const
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
  "packages/engine/src/kernel/step.ts",
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

export const RETAINED_CANDIDATE_EVENT_ARTIFACT_HASH =
  "84055ef93ed8c73c89bcf19087bbba8904c2f5bc62c1ec1ba8bd10aa632b9f96" as const

export const CURRENT_CONSUMER_SURFACES = [
  {
    name: "chronicle-grammar",
    relativePath: "packages/replay/src/grammar.ts",
    currentSetSymbol: "V1_37_CURRENT_GRAMMAR_EVENT_TYPES",
    tupleSymbol: "V1_37_CURRENT_TUPLE_ID",
    disposition: "semantic-validator",
  },
  {
    name: "replay-transition",
    relativePath: "packages/replay/src/replay-transition.ts",
    currentSetSymbol: "V1_37_CURRENT_REPLAY_TRANSITION_EVENT_TYPES",
    tupleSymbol: "V1_37_CURRENT_TUPLE_ID",
    disposition: "state-reconstructor-or-explicit-no-op",
  },
  {
    name: "match-intelligence",
    relativePath: "apps/web/app/match-intelligence.ts",
    currentSetSymbol: "V1_37_CURRENT_MATCH_INTELLIGENCE_EVENT_TYPES",
    tupleSymbol: "V1_37_CURRENT_TUPLE_ID",
    disposition: "annotation-consumer-or-no-special-annotation",
  },
  {
    name: "replay-ready",
    relativePath: "apps/web/app/matches/replay-ready.ts",
    currentSetSymbol: "V1_37_CURRENT_REPLAY_READY_EVENT_TYPES",
    tupleSymbol: "V1_37_CURRENT_TUPLE_ID",
    disposition: "timeline-consumer-or-generic-label",
  },
  {
    name: "replay-board",
    relativePath: "apps/web/app/matches/[matchId]/replay/replay-board-model.ts",
    currentSetSymbol: "V1_37_CURRENT_REPLAY_BOARD_EVENT_TYPES",
    tupleSymbol: "V1_37_CURRENT_TUPLE_ID",
    disposition: "board-consumer-or-no-callout",
  },
] as const

export type CurrentEventCoverageFindingCode =
  | "CURRENT_TUPLE_INVALID"
  | "CURRENT_VOCABULARY_INVALID"
  | "UNDECLARED_PRODUCER"
  | "UNPRODUCED_EVENT"
  | "MISSING_CONSUMER_DISPOSITION"
  | "STALE_CONSUMER_DISPOSITION"
  | "TUPLE_ROUTE_INVALID"
  | "RETAINED_CANDIDATE_DRIFT"

export interface CurrentEventCoverageFinding {
  readonly code: CurrentEventCoverageFindingCode
  readonly message: string
  readonly eventType?: string | undefined
  readonly relativePath?: string | undefined
}

export class CurrentEventCoverageError extends Error {
  readonly findings: readonly CurrentEventCoverageFinding[]

  constructor(findings: readonly CurrentEventCoverageFinding[]) {
    super(
      `Current event coverage failed closed:\n${findings
        .map((finding) => `- ${finding.code}: ${finding.message}`)
        .join("\n")}`,
    )
    this.name = "CurrentEventCoverageError"
    this.findings = findings
  }
}

interface CurrentBuildOptions {
  readonly sourceOverrides?: Readonly<Record<string, string>>
  readonly currentVocabulary?: readonly string[]
  readonly currentTupleId?: string
}

const currentVocabulary = (): readonly string[] =>
  ChronicleEventTypeSchema.options

const retainedCandidateHash = (): string =>
  sha256(
    readFileSync(path.join(repoRoot, candidateEventCoverageArtifactPath)),
  )

export const checkRetainedCandidateEventCoverageProvenance = (): string[] =>
  retainedCandidateHash() === RETAINED_CANDIDATE_EVENT_ARTIFACT_HASH
    ? []
    : [candidateEventCoverageArtifactPath]

export const buildV137CurrentEventCoverage = (
  options: CurrentBuildOptions = {},
) => {
  const findings: CurrentEventCoverageFinding[] = []
  const sourceOverrides = options.sourceOverrides ?? {}
  const tupleId =
    options.currentTupleId ?? CANONICAL_COMPATIBILITY_TUPLES[0]?.tupleId
  if (
    tupleId !==
    "sha256:922a6857fdbc8354b744d6e766bff216f3fee85b5ed381355cb427f5a616b3ae"
  ) {
    findings.push({
      code: "CURRENT_TUPLE_INVALID",
      message: "Current event coverage requires the exact activated tuple.",
    })
  }

  const vocabulary = [...(options.currentVocabulary ?? currentVocabulary())]
  const vocabularySet = new Set(vocabulary)
  if (
    vocabularySet.size !== vocabulary.length ||
    vocabularySet.has(REMOVED_EVENT)
  ) {
    findings.push({
      code: "CURRENT_VOCABULARY_INVALID",
      message: `${REMOVED_EVENT} must be absent and current vocabulary unique.`,
      eventType: REMOVED_EVENT,
    })
  }

  const producers = collectEngineProducers(sourceOverrides)
  for (const [eventType, locations] of producers) {
    if (!vocabularySet.has(eventType)) {
      findings.push({
        code: "UNDECLARED_PRODUCER",
        message: `Engine emits event outside current vocabulary: ${eventType}.`,
        eventType,
        relativePath: locations[0]?.relativePath,
      })
    }
  }
  for (const eventType of vocabulary) {
    if ((producers.get(eventType)?.length ?? 0) === 0) {
      findings.push({
        code: "UNPRODUCED_EVENT",
        message: `Current event has no executable engine producer: ${eventType}.`,
        eventType,
      })
    }
  }

  const consumerLocations = new Map<string, Map<string, SourceLocation>>()
  for (const surface of CURRENT_CONSUMER_SURFACES) {
    const source = readRepoFile(surface.relativePath, sourceOverrides)
    const sourceFile = sourceFileFor(surface.relativePath, source)
    const entries = extractStringSet(sourceFile, surface.currentSetSymbol)
    const byEvent = new Map<string, SourceLocation>()
    if (entries === null) {
      findings.push({
        code: "TUPLE_ROUTE_INVALID",
        message: `${surface.currentSetSymbol} must be an AST-readable Set literal.`,
        relativePath: surface.relativePath,
      })
    } else {
      for (const entry of entries) {
        byEvent.set(entry.eventType, {
          relativePath: surface.relativePath,
          line: entry.line,
        })
        if (!vocabularySet.has(entry.eventType)) {
          findings.push({
            code: "STALE_CONSUMER_DISPOSITION",
            message: `${surface.name} retains non-current ${entry.eventType}.`,
            eventType: entry.eventType,
            relativePath: surface.relativePath,
          })
        }
      }
      for (const eventType of vocabulary) {
        if (!byEvent.has(eventType)) {
          findings.push({
            code: "MISSING_CONSUMER_DISPOSITION",
            message: `${surface.name} has no disposition for ${eventType}.`,
            eventType,
            relativePath: surface.relativePath,
          })
        }
      }
    }
    if (extractStringConstant(sourceFile, surface.tupleSymbol) !== tupleId) {
      findings.push({
        code: "TUPLE_ROUTE_INVALID",
        message: `${surface.name} is not pinned to the exact current tuple.`,
        relativePath: surface.relativePath,
      })
    }
    consumerLocations.set(surface.name, byEvent)
  }

  if (checkRetainedCandidateEventCoverageProvenance().length > 0) {
    findings.push({
      code: "RETAINED_CANDIDATE_DRIFT",
      message: "Retained preactivation event evidence changed bytes.",
      relativePath: candidateEventCoverageArtifactPath,
    })
  }
  if (findings.length > 0) throw new CurrentEventCoverageError(findings)

  return {
    schemaVersion: "v1.37-current-event-coverage-v1" as const,
    generatorVersion: "generate-v1-37-event-coverage-v2" as const,
    generatedBy: "scripts/generate-v1-37-event-coverage.ts" as const,
    status: "current-exact" as const,
    tupleId,
    currentEventVocabulary: vocabulary,
    removedFromCurrent: [REMOVED_EVENT],
    historicalOnly: [REMOVED_EVENT],
    retainedCandidateEvidence: {
      relativePath: candidateEventCoverageArtifactPath,
      sha256: RETAINED_CANDIDATE_EVENT_ARTIFACT_HASH,
      status: "immutable-preactivation-provenance" as const,
    },
    producerFiles: ENGINE_PRODUCER_FILES.map((relativePath) => ({
      relativePath,
      sha256: sha256(readRepoFile(relativePath, sourceOverrides)),
    })),
    consumerSurfaces: CURRENT_CONSUMER_SURFACES.map((surface) => ({
      name: surface.name,
      relativePath: surface.relativePath,
      disposition: surface.disposition,
      sourceSha256: sha256(readRepoFile(surface.relativePath, sourceOverrides)),
    })),
    coverage: vocabulary.map((eventType) => ({
      eventType,
      producers: [...(producers.get(eventType) ?? [])],
      consumerDispositions: CURRENT_CONSUMER_SURFACES.map((surface) => ({
        surface: surface.name,
        disposition: surface.disposition,
        evidence: consumerLocations.get(surface.name)?.get(eventType),
      })),
    })),
  }
}

export const renderV137CurrentEventCoverageArtifact = (
  artifact = buildV137CurrentEventCoverage(),
): string => `${JSON.stringify(artifact, null, 2)}\n`

export const writeV137CurrentEventCoverageArtifact = (): void => {
  const absolutePath = path.join(repoRoot, currentEventCoverageArtifactPath)
  mkdirSync(path.dirname(absolutePath), { recursive: true })
  writeFileSync(
    absolutePath,
    renderV137CurrentEventCoverageArtifact(),
    "utf8",
  )
}

export const checkV137CurrentEventCoverageArtifact = (): string[] => {
  const expected = renderV137CurrentEventCoverageArtifact()
  try {
    return readFileSync(
      path.join(repoRoot, currentEventCoverageArtifactPath),
      "utf8",
    ) === expected
      ? []
      : [currentEventCoverageArtifactPath]
  } catch {
    return [currentEventCoverageArtifactPath]
  }
}

const main = (): void => {
  const args = new Set(process.argv.slice(2))
  try {
    if (args.has("--candidate") && args.has("--check")) {
      const stale = checkRetainedCandidateEventCoverageProvenance()
      if (stale.length > 0) throw new Error("Retained candidate evidence drifted.")
      console.log("v1.37 retained candidate event evidence is byte-exact")
      return
    }
    if (args.has("--current") && args.has("--write")) {
      writeV137CurrentEventCoverageArtifact()
      console.log("v1.37 current event coverage artifact written")
      return
    }
    if (args.has("--current") && args.has("--check")) {
      const stale = checkV137CurrentEventCoverageArtifact()
      if (stale.length > 0) {
        console.error(
          `v1.37 current event coverage is stale: ${stale.join(", ")}`,
        )
        process.exitCode = 1
        return
      }
      console.log("v1.37 current event coverage artifact is current")
      return
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
    return
  }
  console.error(
    "Usage: generate-v1-37-event-coverage.ts --current --write | --current --check | --candidate --check",
  )
  process.exitCode = 1
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main()
}
