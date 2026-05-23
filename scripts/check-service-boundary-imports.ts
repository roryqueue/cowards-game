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
  "apps/web/app/players/[handle]/page.tsx",
  "apps/web/app/ladder/[seasonId]/page.tsx",
  "apps/web/app/account/page.tsx",
  "apps/web/app/api/account/revisions/route.ts",
  "apps/web/app/api/auth/session/route.ts",
  "apps/web/app/exhibitions/new/page.tsx",
  "apps/web/app/workshop/evidence/page.tsx",
  "apps/web/app/api/workshop/tests/[matchSetId]/route.ts",
  "apps/web/app/api/workshop/analytics/profiles/[profileId]/compare/route.ts",
  "apps/web/lib/public-service-boundary.ts",
  "apps/web/lib/account-service-boundary.ts",
  "apps/web/lib/workshop-analytics-service-boundary.ts",
  "apps/web/lib/workshop-read-service-boundary.ts",
] as const

const strictAllowedForbiddenImports = new Map<string, ReadonlySet<string>>([
  ["apps/web/lib/public-service-adapter.ts", new Set(["@cowards/persistence"])],
  [
    "apps/web/lib/account-service-adapter.ts",
    new Set(["@cowards/persistence"]),
  ],
  [
    "apps/web/lib/workshop-analytics-service-adapter.ts",
    new Set(["@cowards/persistence"]),
  ],
  [
    "apps/web/lib/workshop-read-service-adapter.ts",
    new Set(["@cowards/persistence"]),
  ],
])

const forbiddenPatterns = [
  "@cowards/persistence",
  "@cowards/worker",
  "@cowards/runtime-js",
  "@cowards/runtime-python",
  "apps/worker",
  "packages/runtime-js",
  "packages/runtime-python",
  "competitive/server",
  "matches/server",
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
  statementText?: string | undefined
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
  source: string | undefined
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
        source: ts.isStringLiteral(statement.moduleSpecifier)
          ? statement.moduleSpecifier.text
          : undefined,
        text: statement.getText(sourceFile),
      })
    }
  }
  return statements
}

const matchedPattern = (statement: ImportLikeStatement): string | undefined =>
  forbiddenPatterns.find((pattern) => statement.text.includes(pattern))

const resolveSourceFile = (
  repoRoot: string,
  repoPath: string,
): string | undefined => {
  const absolutePath = path.join(repoRoot, repoPath)
  if (existsSync(absolutePath) && isSourceFile(absolutePath)) {
    return toRepoPath(repoRoot, absolutePath)
  }
  const extension = path.extname(repoPath)
  const candidates =
    extension.length > 0
      ? [
          `${repoPath.slice(0, -extension.length)}.ts`,
          `${repoPath.slice(0, -extension.length)}.tsx`,
        ]
      : [
          `${repoPath}.ts`,
          `${repoPath}.tsx`,
          path.join(repoPath, "index.ts"),
          path.join(repoPath, "index.tsx"),
        ]

  return candidates
    .map((candidate) => path.normalize(candidate).split(path.sep).join("/"))
    .find((candidate) => {
      const absoluteCandidate = path.join(repoRoot, candidate)
      return existsSync(absoluteCandidate) && isSourceFile(absoluteCandidate)
    })
}

const resolveLocalImport = (
  repoRoot: string,
  fromRepoPath: string,
  source: string | undefined,
): string | undefined => {
  if (!source?.startsWith(".")) {
    return undefined
  }
  const target = path
    .normalize(path.join(path.dirname(fromRepoPath), source))
    .split(path.sep)
    .join("/")
  return resolveSourceFile(repoRoot, target)
}

const collectStrictFiles = (
  repoRoot: string,
  entryRepoPaths: readonly string[],
): readonly string[] => {
  const seen = new Set<string>()
  const queue = [...entryRepoPaths]

  while (queue.length > 0) {
    const repoPath = queue.shift()!
    if (seen.has(repoPath)) {
      continue
    }
    seen.add(repoPath)

    const absolutePath = path.join(repoRoot, repoPath)
    if (!existsSync(absolutePath)) {
      continue
    }
    const sourceText = readFileSync(absolutePath, "utf8")
    for (const statement of extractImportLikeStatements(repoPath, sourceText)) {
      const localImport = resolveLocalImport(
        repoRoot,
        repoPath,
        statement.source,
      )
      if (localImport && !seen.has(localImport)) {
        queue.push(localImport)
      }
    }
  }

  return [...seen].sort()
}

const findOffenses = (
  repoRoot: string,
  repoPaths: readonly string[],
  options: {
    allowedForbiddenImports?: ReadonlyMap<string, ReadonlySet<string>>
  } = {},
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
          if (
            pattern &&
            options.allowedForbiddenImports?.get(repoPath)?.has(pattern)
          ) {
            return []
          }
          if (!pattern) {
            return []
          }
          const offense: ServiceBoundaryOffense = {
            path: repoPath,
            line: statement.line,
            pattern,
          }
          Object.defineProperty(offense, "statementText", {
            value: statement.text.replace(/\s+/g, " ").trim(),
            enumerable: false,
          })
          return [offense]
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
  const strictFiles = collectStrictFiles(repoRoot, strictMigratedFiles)
  const strictFileSet = new Set<string>(strictFiles)
  const reportOnlyFiles = walkSourceFiles(repoRoot, "apps/web/app").map(
    (absolutePath) => toRepoPath(repoRoot, absolutePath),
  )
  const strictOffenses = findOffenses(repoRoot, strictFiles, {
    allowedForbiddenImports: strictAllowedForbiddenImports,
  })
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
