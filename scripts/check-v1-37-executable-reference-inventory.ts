#!/usr/bin/env -S pnpm exec tsx
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import ts from "typescript"

const defaultRepoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
)

export const V137_REFERENCE_MODES = [
  "baseline",
  "recorder-migrated",
  "replay-core-ready",
  "replay-fixtures-ready",
  "runtime-service-ready",
  "persistence-ready",
  "activation-callers-ready",
  "activation-ready",
  "current",
] as const

export type V137ReferenceMode = (typeof V137_REFERENCE_MODES)[number]
export type V137TrackedSymbol = "buildChronicleFromMatch" | "resolveActivation"
export type V137ReferenceOwner =
  | "257-10"
  | "257-13"
  | "257-14"
  | "257-15"
  | "257-16"
  | "257-18"
  | "257-19"
export type V137ReferenceRole =
  | "call"
  | "definition"
  | "export"
  | "import"
  | "property"
  | "reference"
  | "type"

export interface V137ExecutableReference {
  path: string
  symbol: V137TrackedSymbol
  role: V137ReferenceRole
  owner: V137ReferenceOwner | null
  line: number
}

export interface V137NonExecutableMention {
  path: string
  symbol: V137TrackedSymbol
  kind: "comment" | "string"
  line: number
}

export type V137ReferenceFindingCode =
  | "BASELINE_REFERENCE_DRIFT"
  | "MIGRATION_STAGE_INCOMPLETE"
  | "UNOWNED_EXECUTABLE_REFERENCE"

export interface V137ReferenceFinding {
  code: V137ReferenceFindingCode
  path: string
  detail: string
}

export interface V137ReferenceAnalysis {
  references: readonly V137ExecutableReference[]
  nonExecutableMentions: readonly V137NonExecutableMention[]
  findings: readonly V137ReferenceFinding[]
}

const trackedSymbols = new Set<V137TrackedSymbol>([
  "buildChronicleFromMatch",
  "resolveActivation",
])

const negativeMonitorPaths = new Set([
  "scripts/check-v1-37-executable-reference-inventory.ts",
  "scripts/check-v1-37-executable-reference-inventory.test.ts",
  "scripts/check-v1-37-integrity-boundaries.ts",
  "scripts/check-v1-37-integrity-boundaries.test.ts",
  "scripts/check-v1-37-worker-retirement.ts",
])

const ownerPaths: Readonly<Record<V137ReferenceOwner, ReadonlySet<string>>> = {
  "257-10": new Set([
    "apps/worker/src/runner.test.ts",
    "apps/worker/src/runner.ts",
    "packages/golden/src/parity.test.ts",
    "packages/runtime-js/src/integration.test.ts",
    "packages/test-utils/src/replay-scenarios.ts",
    "scripts/generate-go-parity-fixtures.ts",
  ]),
  "257-13": new Set([
    "packages/replay/src/reconstruct.ts",
    "packages/replay/src/replay-transition.ts",
    "packages/replay/src/semantic-integrity.test.ts",
    "packages/replay/src/validate.test.ts",
    "packages/replay/src/validate.ts",
  ]),
  "257-14": new Set([
    "packages/replay/src/determinism.test.ts",
    "packages/replay/src/grammar.test.ts",
    "packages/replay/src/integration.test.ts",
    "packages/replay/src/reconstruct.test.ts",
    "packages/replay/src/snapshot-boundaries.test.ts",
  ]),
  "257-15": new Set([
    "apps/runtime-service/src/counted-safety.test.ts",
    "apps/runtime-service/src/execute-match.test.ts",
    "apps/runtime-service/src/semantic-integrity.test.ts",
    "packages/replay/src/build.test.ts",
  ]),
  "257-16": new Set([
    "packages/persistence/src/complete-match.test.ts",
    "packages/persistence/src/complete-match.ts",
  ]),
  "257-18": new Set([
    ".planning/artifacts/v2.0-core-rules-audit/reproduce-core-rule-gaps.ts",
    "packages/engine/src/activation.test.ts",
    "packages/engine/src/backstab.test.ts",
    "packages/engine/src/fixtures/v1-4-compatibility.ts",
    "packages/engine/src/lifecycle-repairs.test.ts",
    "packages/engine/src/movement.test.ts",
    "packages/engine/src/public-surface.test.ts",
  ]),
  "257-19": new Set([
    "apps/runtime-service/src/execute-match.ts",
    "packages/engine/src/activation.ts",
    "packages/replay/src/build.ts",
  ]),
}

const ownerForPath = (repoPath: string): V137ReferenceOwner | null => {
  const matches = (
    Object.entries(ownerPaths) as Array<
      [V137ReferenceOwner, ReadonlySet<string>]
    >
  ).filter(([, paths]) => paths.has(repoPath))
  return matches.length === 1 ? matches[0]![0] : null
}

const normalized = (value: string): string => value.split(path.sep).join("/")

const lineOf = (file: ts.SourceFile, node: ts.Node): number =>
  file.getLineAndCharacterOfPosition(node.getStart(file)).line + 1

const isInString = (node: ts.Node): boolean => {
  let current: ts.Node | undefined = node.parent
  while (current) {
    if (
      ts.isStringLiteral(current) ||
      ts.isNoSubstitutionTemplateLiteral(current) ||
      ts.isTemplateHead(current) ||
      ts.isTemplateMiddle(current) ||
      ts.isTemplateTail(current)
    ) {
      return true
    }
    current = current.parent
  }
  return false
}

const roleOf = (node: ts.Identifier): V137ReferenceRole => {
  const parent = node.parent
  if (
    ts.isImportSpecifier(parent) ||
    ts.isImportClause(parent) ||
    ts.isNamespaceImport(parent) ||
    ts.isImportEqualsDeclaration(parent)
  ) {
    return "import"
  }
  if (ts.isExportSpecifier(parent)) return "export"
  if (
    (ts.isVariableDeclaration(parent) ||
      ts.isFunctionDeclaration(parent) ||
      ts.isClassDeclaration(parent)) &&
    parent.name === node
  ) {
    return "definition"
  }
  if (ts.isCallExpression(parent) && parent.expression === node) {
    return "call"
  }
  if (
    ts.isPropertyAccessExpression(parent) &&
    parent.name === node &&
    ts.isCallExpression(parent.parent) &&
    parent.parent.expression === parent
  ) {
    return "call"
  }
  if (
    ts.isTypeReferenceNode(parent) ||
    ts.isTypeQueryNode(parent) ||
    ts.isTypeAliasDeclaration(parent)
  ) {
    return "type"
  }
  if (
    (ts.isPropertySignature(parent) ||
      ts.isPropertyDeclaration(parent) ||
      ts.isPropertyAssignment(parent) ||
      ts.isShorthandPropertyAssignment(parent) ||
      ts.isMethodDeclaration(parent) ||
      ts.isPropertyAccessExpression(parent)) &&
    parent.name === node
  ) {
    return "property"
  }
  return "reference"
}

const commentMentions = (
  repoPath: string,
  source: string,
): readonly V137NonExecutableMention[] => {
  const mentions: V137NonExecutableMention[] = []
  const ranges = [
    ...(ts.getLeadingCommentRanges(source, 0) ?? []),
    ...[...source.matchAll(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/gu)].map((match) => ({
      pos: match.index,
      end: match.index + match[0].length,
    })),
  ]
  const seen = new Set<string>()
  for (const range of ranges) {
    const text = source.slice(range.pos, range.end)
    for (const symbol of trackedSymbols) {
      if (!new RegExp(`\\b${symbol}\\b`, "u").test(text)) continue
      const line = source.slice(0, range.pos).split("\n").length
      const key = `${repoPath}:${symbol}:${line}`
      if (seen.has(key)) continue
      seen.add(key)
      mentions.push({ path: repoPath, symbol, kind: "comment", line })
    }
  }
  return mentions
}

const analyzeFile = (
  repoPath: string,
  source: string,
): Pick<V137ReferenceAnalysis, "references" | "nonExecutableMentions"> => {
  if (negativeMonitorPaths.has(repoPath)) {
    return {
      references: [],
      nonExecutableMentions: [...trackedSymbols]
        .filter((symbol) => source.includes(symbol))
        .map((symbol) => ({ path: repoPath, symbol, kind: "string", line: 1 })),
    }
  }
  const file = ts.createSourceFile(
    repoPath,
    source,
    ts.ScriptTarget.Latest,
    true,
    repoPath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  )
  const references: V137ExecutableReference[] = []
  const nonExecutableMentions: V137NonExecutableMention[] = [
    ...commentMentions(repoPath, source),
  ]
  const visit = (node: ts.Node): void => {
    if (
      (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) &&
      [...trackedSymbols].some((symbol) =>
        new RegExp(`\\b${symbol}\\b`, "u").test(node.text),
      )
    ) {
      for (const symbol of trackedSymbols) {
        if (new RegExp(`\\b${symbol}\\b`, "u").test(node.text)) {
          nonExecutableMentions.push({
            path: repoPath,
            symbol,
            kind: "string",
            line: lineOf(file, node),
          })
        }
      }
      return
    }
    if (
      ts.isIdentifier(node) &&
      trackedSymbols.has(node.text as V137TrackedSymbol) &&
      !isInString(node)
    ) {
      references.push({
        path: repoPath,
        symbol: node.text as V137TrackedSymbol,
        role: roleOf(node),
        owner: ownerForPath(repoPath),
        line: lineOf(file, node),
      })
    }
    ts.forEachChild(node, visit)
  }
  visit(file)
  return { references, nonExecutableMentions }
}

const groupedManifest = (
  references: readonly V137ExecutableReference[],
): readonly string[] => {
  const counts = new Map<string, number>()
  for (const reference of references) {
    const key = [
      reference.path,
      reference.symbol,
      reference.role,
      reference.owner ?? "UNOWNED",
    ].join("|")
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return [...counts]
    .map(([key, count]) => `${key}|${count}`)
    .sort((left, right) => (left < right ? -1 : left > right ? 1 : 0))
}

// Phase 257 Plan 11 freezes this list from the post-Plan-03 repository state.
const BASELINE_MANIFEST: readonly string[] = [
  ".planning/artifacts/v2.0-core-rules-audit/reproduce-core-rule-gaps.ts|resolveActivation|call|257-18|1",
  ".planning/artifacts/v2.0-core-rules-audit/reproduce-core-rule-gaps.ts|resolveActivation|import|257-18|1",
  "apps/runtime-service/src/counted-safety.test.ts|buildChronicleFromMatch|import|257-15|1",
  "apps/runtime-service/src/counted-safety.test.ts|buildChronicleFromMatch|property|257-15|3",
  "apps/runtime-service/src/counted-safety.test.ts|buildChronicleFromMatch|reference|257-15|3",
  "apps/runtime-service/src/execute-match.test.ts|buildChronicleFromMatch|property|257-15|2",
  "apps/runtime-service/src/execute-match.ts|buildChronicleFromMatch|call|257-19|1",
  "apps/runtime-service/src/execute-match.ts|buildChronicleFromMatch|import|257-19|1",
  "apps/runtime-service/src/execute-match.ts|buildChronicleFromMatch|property|257-19|2",
  "apps/runtime-service/src/execute-match.ts|buildChronicleFromMatch|type|257-19|2",
  "apps/runtime-service/src/semantic-integrity.test.ts|buildChronicleFromMatch|call|257-15|1",
  "apps/runtime-service/src/semantic-integrity.test.ts|buildChronicleFromMatch|import|257-15|1",
  "apps/runtime-service/src/semantic-integrity.test.ts|buildChronicleFromMatch|property|257-15|1",
  "apps/worker/src/runner.test.ts|buildChronicleFromMatch|property|257-10|1",
  "apps/worker/src/runner.ts|buildChronicleFromMatch|property|257-10|1",
  "packages/engine/src/activation.test.ts|resolveActivation|call|257-18|4",
  "packages/engine/src/activation.test.ts|resolveActivation|import|257-18|1",
  "packages/engine/src/activation.ts|resolveActivation|definition|257-19|1",
  "packages/engine/src/backstab.test.ts|resolveActivation|call|257-18|3",
  "packages/engine/src/backstab.test.ts|resolveActivation|import|257-18|1",
  "packages/engine/src/fixtures/v1-4-compatibility.ts|resolveActivation|call|257-18|2",
  "packages/engine/src/fixtures/v1-4-compatibility.ts|resolveActivation|import|257-18|1",
  "packages/engine/src/lifecycle-repairs.test.ts|resolveActivation|call|257-18|1",
  "packages/engine/src/lifecycle-repairs.test.ts|resolveActivation|import|257-18|1",
  "packages/golden/src/parity.test.ts|buildChronicleFromMatch|call|257-10|3",
  "packages/golden/src/parity.test.ts|buildChronicleFromMatch|import|257-10|1",
  "packages/persistence/src/complete-match.test.ts|buildChronicleFromMatch|call|257-16|1",
  "packages/persistence/src/complete-match.test.ts|buildChronicleFromMatch|import|257-16|1",
  "packages/replay/src/build.test.ts|buildChronicleFromMatch|call|257-15|3",
  "packages/replay/src/build.test.ts|buildChronicleFromMatch|import|257-15|1",
  "packages/replay/src/build.ts|buildChronicleFromMatch|definition|257-19|1",
  "packages/replay/src/determinism.test.ts|buildChronicleFromMatch|call|257-14|1",
  "packages/replay/src/determinism.test.ts|buildChronicleFromMatch|import|257-14|1",
  "packages/replay/src/grammar.test.ts|buildChronicleFromMatch|call|257-14|1",
  "packages/replay/src/grammar.test.ts|buildChronicleFromMatch|import|257-14|1",
  "packages/replay/src/integration.test.ts|buildChronicleFromMatch|call|257-14|1",
  "packages/replay/src/integration.test.ts|buildChronicleFromMatch|import|257-14|1",
  "packages/replay/src/reconstruct.test.ts|buildChronicleFromMatch|call|257-14|1",
  "packages/replay/src/reconstruct.test.ts|buildChronicleFromMatch|import|257-14|1",
  "packages/replay/src/semantic-integrity.test.ts|buildChronicleFromMatch|call|257-13|1",
  "packages/replay/src/semantic-integrity.test.ts|buildChronicleFromMatch|import|257-13|1",
  "packages/replay/src/snapshot-boundaries.test.ts|buildChronicleFromMatch|call|257-14|1",
  "packages/replay/src/snapshot-boundaries.test.ts|buildChronicleFromMatch|import|257-14|1",
  "packages/replay/src/validate.test.ts|buildChronicleFromMatch|call|257-13|1",
  "packages/replay/src/validate.test.ts|buildChronicleFromMatch|import|257-13|1",
  "packages/runtime-js/src/integration.test.ts|buildChronicleFromMatch|call|257-10|1",
  "packages/runtime-js/src/integration.test.ts|buildChronicleFromMatch|import|257-10|1",
  "packages/test-utils/src/replay-scenarios.ts|buildChronicleFromMatch|call|257-10|1",
  "packages/test-utils/src/replay-scenarios.ts|buildChronicleFromMatch|import|257-10|1",
  "scripts/generate-go-parity-fixtures.ts|buildChronicleFromMatch|call|257-10|2",
  "scripts/generate-go-parity-fixtures.ts|buildChronicleFromMatch|import|257-10|1",
]

const absentOwnersByMode: Readonly<
  Partial<Record<V137ReferenceMode, ReadonlySet<V137ReferenceOwner>>>
> = {
  "recorder-migrated": new Set(["257-10"]),
  "replay-core-ready": new Set(["257-10", "257-13"]),
  "replay-fixtures-ready": new Set(["257-10", "257-13", "257-14"]),
  "runtime-service-ready": new Set(["257-10", "257-13", "257-14", "257-15"]),
  "persistence-ready": new Set([
    "257-10",
    "257-13",
    "257-14",
    "257-15",
    "257-16",
  ]),
}

export const analyzeV137ExecutableReferences = (
  sources: Readonly<Record<string, string>>,
  mode: V137ReferenceMode,
  options: { enforceBaseline?: boolean } = {},
): V137ReferenceAnalysis => {
  const scanned = Object.entries(sources)
    .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
    .map(([repoPath, source]) => analyzeFile(normalized(repoPath), source))
  const references = scanned.flatMap((entry) => entry.references)
  const nonExecutableMentions = scanned.flatMap(
    (entry) => entry.nonExecutableMentions,
  )
  const findings: V137ReferenceFinding[] = references
    .filter((reference) => reference.owner === null)
    .map((reference) => ({
      code: "UNOWNED_EXECUTABLE_REFERENCE" as const,
      path: reference.path,
      detail: `${reference.symbol} ${reference.role} at line ${reference.line} has no migration owner`,
    }))

  if (mode === "baseline" && options.enforceBaseline !== false) {
    const actual = groupedManifest(references)
    if (JSON.stringify(actual) !== JSON.stringify(BASELINE_MANIFEST)) {
      findings.push({
        code: "BASELINE_REFERENCE_DRIFT",
        path: "repository",
        detail: `expected ${BASELINE_MANIFEST.length} grouped references, received ${actual.length}`,
      })
    }
  }

  const absentOwners = absentOwnersByMode[mode]
  if (absentOwners) {
    for (const reference of references) {
      if (reference.owner && absentOwners.has(reference.owner)) {
        findings.push({
          code: "MIGRATION_STAGE_INCOMPLETE",
          path: reference.path,
          detail: `${mode} still contains ${reference.symbol} ${reference.role} owned by ${reference.owner}`,
        })
      }
    }
  }
  if (mode === "activation-callers-ready") {
    for (const reference of references) {
      if (
        reference.symbol === "resolveActivation" &&
        reference.owner !== "257-19"
      ) {
        findings.push({
          code: "MIGRATION_STAGE_INCOMPLETE",
          path: reference.path,
          detail: `${mode} permits only the retained Plan 19 resolveActivation definition`,
        })
      }
    }
  }
  if (mode === "activation-ready") {
    for (const reference of references) {
      if (reference.owner !== "257-19" || reference.role !== "definition") {
        findings.push({
          code: "MIGRATION_STAGE_INCOMPLETE",
          path: reference.path,
          detail: `${mode} permits only the two Plan 19 definitions`,
        })
      }
    }
    for (const symbol of trackedSymbols) {
      const definitions = references.filter(
        (reference) =>
          reference.symbol === symbol && reference.role === "definition",
      )
      if (definitions.length !== 1) {
        findings.push({
          code: "MIGRATION_STAGE_INCOMPLETE",
          path: "repository",
          detail: `${mode} requires exactly one retained ${symbol} definition`,
        })
      }
    }
  }
  if (mode === "current" && references.length > 0) {
    findings.push({
      code: "MIGRATION_STAGE_INCOMPLETE",
      path: references[0]!.path,
      detail: `current mode requires zero exact executable references; found ${references.length}`,
    })
  }

  return { references, nonExecutableMentions, findings }
}

const walkSources = (repoRoot: string): Readonly<Record<string, string>> => {
  const sources: Record<string, string> = {}
  const roots = ["apps", "packages", "scripts", ".planning/artifacts"]
  const visit = (absolutePath: string): void => {
    if (!existsSync(absolutePath)) return
    const stat = statSync(absolutePath)
    if (stat.isDirectory()) {
      for (const entry of readdirSync(absolutePath).sort()) {
        if (
          entry === "node_modules" ||
          entry === "dist" ||
          entry === ".next" ||
          entry === "coverage"
        ) {
          continue
        }
        visit(path.join(absolutePath, entry))
      }
      return
    }
    if (!stat.isFile() || !/\.tsx?$/u.test(absolutePath)) return
    const repoPath = normalized(path.relative(repoRoot, absolutePath))
    sources[repoPath] = readFileSync(absolutePath, "utf8")
  }
  roots.forEach((root) => visit(path.join(repoRoot, root)))
  return sources
}

export const checkV137ExecutableReferenceInventory = (
  mode: V137ReferenceMode,
  repoRoot = defaultRepoRoot,
): V137ReferenceAnalysis =>
  analyzeV137ExecutableReferences(walkSources(repoRoot), mode)

const parseMode = (argv: readonly string[]): V137ReferenceMode => {
  const modeArg = argv.find((argument) => argument.startsWith("--"))?.slice(2)
  if (
    !modeArg ||
    !V137_REFERENCE_MODES.includes(modeArg as V137ReferenceMode)
  ) {
    throw new Error(
      `expected one mode: ${V137_REFERENCE_MODES.map((mode) => `--${mode}`).join(", ")}`,
    )
  }
  return modeArg as V137ReferenceMode
}

const isMain =
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (isMain) {
  const mode = parseMode(process.argv.slice(2))
  const result = checkV137ExecutableReferenceInventory(mode)
  if (process.env.V137_REFERENCE_DISCOVER === "1") {
    process.stdout.write(
      `${JSON.stringify(groupedManifest(result.references), null, 2)}\n`,
    )
  } else if (result.findings.length > 0) {
    for (const finding of result.findings) {
      process.stderr.write(
        `${finding.code} ${finding.path}: ${finding.detail}\n`,
      )
    }
    process.exitCode = 1
  } else {
    process.stdout.write(
      `v1.37 executable reference inventory ${mode}: ${result.references.length} exact references, ${result.nonExecutableMentions.length} non-executable mentions\n`,
    )
  }
}
