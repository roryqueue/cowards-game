#!/usr/bin/env -S pnpm exec tsx
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
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
): V137IntegrityBoundaryAnalysis => {
  const analyses = Object.entries(sources)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([repoPath, source]) => analyzeSource(normalized(repoPath), source))
  return {
    findings: analyses.flatMap((analysis) => analysis.findings),
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
  return sources
}

export const analyzeV137IntegrityBoundaries = (
  repoRoot = defaultRepoRoot,
): V137IntegrityBoundaryAnalysis =>
  analyzeV137IntegritySources(collectTypeScriptSources(repoRoot))

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
