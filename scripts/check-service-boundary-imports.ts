#!/usr/bin/env -S pnpm exec tsx
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import ts from "typescript"

export const strictMigratedFiles = [
  "apps/web/app/api/service/health/route.ts",
  "apps/web/app/api/matchsets/[matchSetId]/route.ts",
  "apps/web/app/matchsets/[matchSetId]/page.tsx",
  "apps/web/app/api/replays/[matchId]/metadata/route.ts",
  "apps/web/app/strategies/[strategyId]/page.tsx",
] as const

const forbiddenPatterns = [
  "@cowards/persistence",
  "@cowards/worker",
  "@cowards/runtime-js",
  "@cowards/runtime-python",
  "apps/worker",
  "packages/runtime-js",
  "packages/runtime-python",
  "migrations",
  "runWorkerOnce",
  "StrategyExecutionAdapter",
  "buildStrategyRevision",
] as const

const sourceExtensions = new Set([".ts", ".tsx"])
const excludedDirectories = new Set([
  ".next",
  ".turbo",
  "coverage",
  "dist",
  "node_modules",
  "playwright-report",
  "test-results",
])

export interface ServiceBoundaryOffense {
  path: string
  line: number
  pattern: string
}

export interface AnalyzeServiceBoundaryOptions {
  repoRoot?: string
}

export interface ServiceBoundaryAnalysis {
  strictOffenses: readonly ServiceBoundaryOffense[]
  reportOnlyOffenses: readonly ServiceBoundaryOffense[]
  exitCode: 0 | 1
}

interface ImportLikeStatement {
  line: number
  text: string
}

const toRepoPath = (repoRoot: string, absolutePath: string): string =>
  path.relative(repoRoot, absolutePath).split(path.sep).join("/")

const sourceKindForPath = (repoPath: string): ts.ScriptKind =>
  repoPath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS

const isSourceFile = (absolutePath: string): boolean =>
  sourceExtensions.has(path.extname(absolutePath))

const isExcludedDirectory = (directoryName: string): boolean =>
  excludedDirectories.has(directoryName)

const walkSourceFiles = (
  repoRoot: string,
  rootRelativePath: string,
): readonly string[] => {
  const root = path.join(repoRoot, rootRelativePath)
  if (!existsSync(root)) {
    return []
  }

  const files: string[] = []
  const visit = (absolutePath: string) => {
    const stats = statSync(absolutePath)
    if (stats.isDirectory()) {
      if (isExcludedDirectory(path.basename(absolutePath))) {
        return
      }
      for (const entry of readdirSync(absolutePath)) {
        visit(path.join(absolutePath, entry))
      }
      return
    }

    if (stats.isFile() && isSourceFile(absolutePath)) {
      files.push(absolutePath)
    }
  }

  visit(root)
  return files.sort((left, right) =>
    toRepoPath(repoRoot, left).localeCompare(toRepoPath(repoRoot, right)),
  )
}

const extractImportLikeStatements = (
  repoPath: string,
  sourceText: string,
): readonly ImportLikeStatement[] => {
  const sourceFile = ts.createSourceFile(
    repoPath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    sourceKindForPath(repoPath),
  )

  const statements: ImportLikeStatement[] = []
  for (const statement of sourceFile.statements) {
    if (
      ts.isImportDeclaration(statement) ||
      (ts.isExportDeclaration(statement) && statement.moduleSpecifier)
    ) {
      const { line } = sourceFile.getLineAndCharacterOfPosition(
        statement.getStart(sourceFile),
      )
      statements.push({
        line: line + 1,
        text: statement.getText(sourceFile),
      })
    }
  }
  return statements
}

const matchedPattern = (statement: ImportLikeStatement): string | undefined =>
  forbiddenPatterns.find((pattern) => statement.text.includes(pattern))

const findOffenses = (
  repoRoot: string,
  repoPaths: readonly string[],
): readonly ServiceBoundaryOffense[] =>
  repoPaths
    .flatMap((repoPath) => {
      const absolutePath = path.join(repoRoot, repoPath)
      if (!existsSync(absolutePath)) {
        return []
      }
      const sourceText = readFileSync(absolutePath, "utf8")
      return extractImportLikeStatements(repoPath, sourceText).flatMap(
        (statement) => {
          const pattern = matchedPattern(statement)
          return pattern
            ? [{ path: repoPath, line: statement.line, pattern }]
            : []
        },
      )
    })
    .sort(
      (left, right) =>
        left.path.localeCompare(right.path) ||
        left.line - right.line ||
        left.pattern.localeCompare(right.pattern),
    )

const formatOffense = (
  prefix: "STRICT" | "REPORT",
  offense: ServiceBoundaryOffense,
): string =>
  `${prefix} ${offense.path}:${offense.line} forbidden ${offense.pattern}`

export const analyzeServiceBoundaryImports = (
  options: AnalyzeServiceBoundaryOptions = {},
): ServiceBoundaryAnalysis => {
  const repoRoot = options.repoRoot ?? process.cwd()
  const strictFileSet = new Set<string>(strictMigratedFiles)
  const reportOnlyFiles = walkSourceFiles(repoRoot, "apps/web/app").map(
    (absolutePath) => toRepoPath(repoRoot, absolutePath),
  )
  const strictOffenses = findOffenses(repoRoot, strictMigratedFiles)
  const reportOnlyOffenses = findOffenses(repoRoot, reportOnlyFiles).filter(
    (offense) => !strictFileSet.has(offense.path),
  )

  return {
    strictOffenses,
    reportOnlyOffenses,
    exitCode: strictOffenses.length > 0 ? 1 : 0,
  }
}

export const formatServiceBoundaryAnalysis = (
  analysis: ServiceBoundaryAnalysis,
): string => {
  const lines = [
    ...analysis.strictOffenses.map((offense) =>
      formatOffense("STRICT", offense),
    ),
    ...analysis.reportOnlyOffenses.map((offense) =>
      formatOffense("REPORT", offense),
    ),
    `strict_offenses=${analysis.strictOffenses.length} report_only_offenses=${analysis.reportOnlyOffenses.length}`,
  ]
  return `${lines.join("\n")}\n`
}

const main = (): number => {
  const analysis = analyzeServiceBoundaryImports()
  process.stdout.write(formatServiceBoundaryAnalysis(analysis))
  return analysis.exitCode
}

const currentFile = fileURLToPath(import.meta.url)
const entryFile = process.argv[1] ? path.resolve(process.argv[1]) : undefined

if (entryFile === currentFile) {
  process.exitCode = main()
}
