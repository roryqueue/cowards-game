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
  "apps/web/app/matches/[matchId]/replay/page.tsx",
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
  ["apps/web/app/matches/server.ts", new Set(["@cowards/persistence"])],
  ["apps/web/app/matches/replay-ready.ts", new Set(["@cowards/persistence"])],
  ["apps/web/app/matches/replay-fixture.ts", new Set(["@cowards/persistence"])],
])

const strictAllowedPersistenceSources = new Map<string, ReadonlySet<string>>([
  [
    "apps/web/app/matches/server.ts",
    new Set([
      "@cowards/persistence/db",
      "@cowards/persistence/quarantine-lifecycle",
      "@cowards/persistence/repositories",
    ]),
  ],
  [
    "apps/web/app/matches/replay-ready.ts",
    new Set(["@cowards/persistence/quarantine-lifecycle"]),
  ],
  [
    "apps/web/app/matches/replay-fixture.ts",
    new Set(["@cowards/persistence/quarantine-lifecycle"]),
  ],
])

const forbiddenPatterns = [
  "@cowards/persistence",
  "@cowards/worker",
  "@cowards/runtime-js",
  "@cowards/runtime-python",
  "@cowards/runtime-wasm-wasi",
  "apps/worker",
  "packages/runtime-js",
  "packages/runtime-python",
  "packages/runtime-wasm-wasi",
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
  ownershipOffenses: readonly ServiceBoundaryOffense[]
  exitCode: 0 | 1
}

interface ImportLikeStatement {
  line: number
  source: string | undefined
  text: string
}

const phase260TypeScriptRoots = [
  "apps/web",
  "packages/persistence",
  "packages/replay",
] as const

const phase260ExecutionModules = new Set([
  "@cowards/engine",
  "@cowards/runtime-js",
  "@cowards/runtime-python",
  "@cowards/runtime-wasm-wasi",
])

const phase260ExecutionSymbols = new Set([
  "executeMatch",
  "executeStrategy",
  "evaluateStrategy",
  "invokeStrategy",
  "runMatch",
  "runStrategy",
  "StrategyExecutionAdapter",
])

const phase260HistoricalAuthorityFiles = new Set([
  // Chronicle grammar validates recorded slot facts; it is not a Strategy input
  // producer and remains an exact, separately tested semantic authority.
  "packages/replay/src/grammar.ts",
  "packages/replay/src/historical-v1-4-grammar.ts",
  "packages/replay/src/historical-v1-4-transition.ts",
])

const phase260SeedFairnessLegacyFiles = new Set([
  "packages/persistence/src/competition.ts",
  "packages/persistence/src/matchset-service.ts",
])

const phase260CurrentSelectorFiles = new Set([
  "packages/spec/src/current-semantic-authority-generated.ts",
])

const phase260ArenaAuthorityFiles = new Set([
  "packages/spec/src/arena-catalog-v1-37.ts",
])

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

const walkFilesWithExtensions = (
  repoRoot: string,
  rootRelativePath: string,
  extensions: ReadonlySet<string>,
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
    if (stats.isFile() && extensions.has(path.extname(absolutePath))) {
      files.push(absolutePath)
    }
  }
  visit(root)
  return files.sort((left, right) =>
    toRepoPath(repoRoot, left).localeCompare(toRepoPath(repoRoot, right)),
  )
}

const isPhase260ProductionSource = (repoPath: string): boolean =>
  !repoPath.endsWith(".test.ts") &&
  !repoPath.endsWith(".test.tsx") &&
  !repoPath.endsWith("_test.go")

const offenseAt = (
  sourceFile: ts.SourceFile,
  node: ts.Node,
  repoPath: string,
  pattern: string,
): ServiceBoundaryOffense => ({
  path: repoPath,
  line: sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1,
  pattern,
})

const importSpecifierName = (specifier: ts.ImportSpecifier): string =>
  (specifier.propertyName ?? specifier.name).text

const propertyNameText = (name: ts.PropertyName | ts.BindingName): string | undefined => {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) {
    return name.text
  }
  return undefined
}

const objectProperty = (
  object: ts.ObjectLiteralExpression,
  name: string,
): ts.ObjectLiteralElementLike | undefined =>
  object.properties.find((property) =>
    "name" in property ? propertyNameText(property.name) === name : false,
  )

const containsNumericLiteral = (node: ts.Node): boolean => {
  let found = false
  const visit = (candidate: ts.Node) => {
    if (ts.isNumericLiteral(candidate)) {
      found = true
      return
    }
    ts.forEachChild(candidate, visit)
  }
  visit(node)
  return found
}

const phase260ObservationDerivationPattern = (
  field: string,
  initializer: ts.Expression,
): string | undefined => {
  const text = initializer.getText()
  const derivesFromNonKernelState =
    /\bseed\b|\broundNumber\b\s*%|\bevents?\b|MOVE_ADVANCED|\bpositions?\b|\.includes\s*\(|\.some\s*\(/u.test(
      text,
    )
  return derivesFromNonKernelState
    ? `kernel-observation-derivation:${field}`
    : undefined
}

const analyzePhase260TypeScriptFile = (
  repoPath: string,
  sourceText: string,
): readonly ServiceBoundaryOffense[] => {
  if (
    !isPhase260ProductionSource(repoPath) ||
    phase260HistoricalAuthorityFiles.has(repoPath)
  ) {
    return []
  }

  const sourceFile = ts.createSourceFile(
    repoPath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    sourceKindForPath(repoPath),
  )
  const offenses: ServiceBoundaryOffense[] = []
  const executionNamespaces = new Map<string, string>()

  const recordExecutionSymbol = (node: ts.Node, symbol: string) => {
    if (phase260ExecutionSymbols.has(symbol)) {
      offenses.push(
        offenseAt(
          sourceFile,
          node,
          repoPath,
          `strategy-execution-ownership:${symbol}`,
        ),
      )
    }
  }

  const visit = (node: ts.Node) => {
    if (
      ts.isImportDeclaration(node) &&
      ts.isStringLiteral(node.moduleSpecifier) &&
      phase260ExecutionModules.has(node.moduleSpecifier.text)
    ) {
      const clause = node.importClause
      if (clause?.name && phase260ExecutionSymbols.has(clause.name.text)) {
        recordExecutionSymbol(node, clause.name.text)
      }
      if (clause?.namedBindings && ts.isNamedImports(clause.namedBindings)) {
        for (const specifier of clause.namedBindings.elements) {
          const importedName = importSpecifierName(specifier)
          recordExecutionSymbol(node, importedName)
        }
      }
      if (clause?.namedBindings && ts.isNamespaceImport(clause.namedBindings)) {
        executionNamespaces.set(
          clause.namedBindings.name.text,
          node.moduleSpecifier.text,
        )
      }
    }

    if (
      ts.isExportDeclaration(node) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier) &&
      phase260ExecutionModules.has(node.moduleSpecifier.text) &&
      node.exportClause &&
      ts.isNamedExports(node.exportClause)
    ) {
      for (const specifier of node.exportClause.elements) {
        recordExecutionSymbol(
          node,
          (specifier.propertyName ?? specifier.name).text,
        )
      }
    }

    if (
      ts.isVariableDeclaration(node) &&
      node.initializer &&
      ts.isCallExpression(node.initializer) &&
      node.initializer.arguments.length === 1 &&
      ts.isStringLiteral(node.initializer.arguments[0]!) &&
      phase260ExecutionModules.has(node.initializer.arguments[0]!.text) &&
      ((ts.isIdentifier(node.initializer.expression) &&
        node.initializer.expression.text === "require") ||
        node.initializer.expression.kind === ts.SyntaxKind.ImportKeyword)
    ) {
      if (ts.isIdentifier(node.name)) {
        executionNamespaces.set(node.name.text, node.initializer.arguments[0]!.text)
      } else if (ts.isObjectBindingPattern(node.name)) {
        for (const element of node.name.elements) {
          const importedName = element.propertyName
            ? propertyNameText(element.propertyName)
            : propertyNameText(element.name)
          if (importedName) {
            recordExecutionSymbol(node, importedName)
          }
        }
      }
    }

    if (
      ts.isPropertyAccessExpression(node) &&
      ts.isIdentifier(node.expression) &&
      executionNamespaces.has(node.expression.text)
    ) {
      recordExecutionSymbol(node, node.name.text)
    }

    if (
      ts.isElementAccessExpression(node) &&
      ts.isIdentifier(node.expression) &&
      executionNamespaces.has(node.expression.text) &&
      node.argumentExpression &&
      ts.isStringLiteral(node.argumentExpression)
    ) {
      recordExecutionSymbol(node, node.argumentExpression.text)
    }

    if (ts.isPropertyAssignment(node) || ts.isVariableDeclaration(node)) {
      const field = propertyNameText(node.name)
      if (
        field &&
        [
          "initialInitiativePlayerId",
          "roundInitiativePlayerId",
          "hasAdvancedThisActivation",
        ].includes(field) &&
        node.initializer
      ) {
        const pattern = phase260ObservationDerivationPattern(
          field,
          node.initializer,
        )
        if (pattern) {
          offenses.push(offenseAt(sourceFile, node, repoPath, pattern))
        }
      }
    }

    if (
      ts.isObjectLiteralExpression(node) &&
      !phase260ArenaAuthorityFiles.has(repoPath)
    ) {
      const bounds = objectProperty(node, "initialBounds")
      const terrain = objectProperty(node, "terrainStones")
      if (
        bounds &&
        terrain &&
        containsNumericLiteral(bounds) &&
        (sourceText.includes("runtime-v1.19") ||
          sourceText.includes("canonical-arena-catalog-v1.37"))
      ) {
        offenses.push(
          offenseAt(
            sourceFile,
            node,
            repoPath,
            "handwritten-successor-arena-geometry",
          ),
        )
      }
    }

    ts.forEachChild(node, visit)
  }
  visit(sourceFile)

  if (
    !phase260SeedFairnessLegacyFiles.has(repoPath) &&
    sourceText.includes("runtime-v1.19") &&
    /\bseed\b[^\n;]*(?:endsWith|includes|split|slice|substring)[^\n;]*mirror|\bseed\b[^\n;]*:\s*mirror|\bseed\b[^\n;]*:mirror/u.test(
      sourceText,
    )
  ) {
    const match = /\bseed\b[^\n;]*(?:mirror)/u.exec(sourceText)
    const position = match?.index ?? 0
    offenses.push({
      path: repoPath,
      line: sourceFile.getLineAndCharacterOfPosition(position).line + 1,
      pattern: "set-fairness-from-seed",
    })
  }

  if (
    !phase260CurrentSelectorFiles.has(repoPath) &&
    /\b(?:CURRENT|current|DEFAULT|default)[A-Za-z0-9_]*(?:SEMANTIC|semantic|AUTHORITY|authority|VERSION|version)[A-Za-z0-9_]*\s*=\s*["'](?:runtime-v1\.19|strategy-runtime-abi-v1\.19)["']/u.test(
      sourceText,
    )
  ) {
    const match = /\b(?:CURRENT|current|DEFAULT|default)[A-Za-z0-9_]*/u.exec(
      sourceText,
    )
    offenses.push({
      path: repoPath,
      line: sourceFile.getLineAndCharacterOfPosition(match?.index ?? 0).line + 1,
      pattern: "current-selector-bypass",
    })
  }

  return offenses
}

const analyzePhase260GoFile = (
  repoPath: string,
  sourceText: string,
): readonly ServiceBoundaryOffense[] => {
  if (!isPhase260ProductionSource(repoPath)) {
    return []
  }
  const offenses: ServiceBoundaryOffense[] = []
  const gameplaySymbols = [
    "resolveBackstab",
    "executeStrategy",
    "evaluateStrategy",
    "MOVE_ADVANCED",
  ] as const
  if (sourceText.includes('"runtime-v1.19"')) {
    for (const symbol of gameplaySymbols) {
      const index = sourceText.indexOf(symbol)
      if (index >= 0) {
        offenses.push({
          path: repoPath,
          line: sourceText.slice(0, index).split("\n").length,
          pattern: `go-gameplay-ownership:${symbol}`,
        })
      }
    }
  }
  return offenses
}

const collectPhase260TypeScriptGraph = (
  repoRoot: string,
): readonly string[] => {
  const queue = phase260TypeScriptRoots.flatMap((root) =>
    walkFilesWithExtensions(repoRoot, root, new Set([".ts", ".tsx"]))
      .map((absolutePath) => toRepoPath(repoRoot, absolutePath))
      .filter(isPhase260ProductionSource),
  )
  const seen = new Set<string>()

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
      const localImport = resolveLocalImport(repoRoot, repoPath, statement.source)
      if (localImport && !seen.has(localImport)) {
        queue.push(localImport)
      }
    }
  }

  return [...seen].sort()
}

const analyzePhase260Ownership = (
  repoRoot: string,
): readonly ServiceBoundaryOffense[] => {
  const typeScriptFiles = collectPhase260TypeScriptGraph(repoRoot)
  const goFiles = walkFilesWithExtensions(
    repoRoot,
    "apps/go-backend",
    new Set([".go"]),
  )
  return [
    ...typeScriptFiles.flatMap((repoPath) => {
      const absolutePath = path.join(repoRoot, repoPath)
      return analyzePhase260TypeScriptFile(
        repoPath,
        readFileSync(absolutePath, "utf8"),
      )
    }),
    ...goFiles.flatMap((absolutePath) => {
      const repoPath = toRepoPath(repoRoot, absolutePath)
      return analyzePhase260GoFile(repoPath, readFileSync(absolutePath, "utf8"))
    }),
  ].sort(
    (left, right) =>
      left.path.localeCompare(right.path) ||
      left.line - right.line ||
      left.pattern.localeCompare(right.pattern),
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
          const allowedPersistenceSources =
            options.allowedForbiddenImports
              ?.get(repoPath)
              ?.has("@cowards/persistence") === true
              ? strictAllowedPersistenceSources.get(repoPath)
              : undefined
          if (
            pattern === "@cowards/persistence" &&
            allowedPersistenceSources !== undefined &&
            !allowedPersistenceSources.has(statement.source ?? "")
          ) {
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
          }
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
  const ownershipOffenses = analyzePhase260Ownership(repoRoot)

  return {
    strictOffenses,
    reportOnlyOffenses,
    ownershipOffenses,
    exitCode:
      strictOffenses.length > 0 || ownershipOffenses.length > 0 ? 1 : 0,
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
    ...analysis.ownershipOffenses.map((offense) =>
      formatOffense("STRICT", offense),
    ),
    `strict_offenses=${analysis.strictOffenses.length} ownership_offenses=${analysis.ownershipOffenses.length} report_only_offenses=${analysis.reportOnlyOffenses.length}`,
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
