#!/usr/bin/env -S pnpm exec tsx
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import ts from "typescript"

const defaultRepoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
)

const retiredAssertionName = "assertTypeScriptWorkerEntrypointAllowed"
const retiredEntrypoints = new Set(["runWorkerOnce", "runWorkerLoop"])
const allowedWorkerFunctions = new Set([
  ...retiredEntrypoints,
  retiredAssertionName,
  "assertTypeScriptWorkerJobOwnershipAllowed",
])
const forbiddenExecutionSymbols = new Set([
  "claimNextMatchJob",
  "loadRunMatchInput",
  "createRuntimeFromRevision",
  "buildChronicleFromMatch",
  "completeMatch",
  "recordAttemptFailure",
  "mutateMatchFailure",
  "recordPlayerPenalty",
])
const formerPurposeValues = new Set(["rollback", "test", "parity"])

export type WorkerRetirementFindingCode =
  | "WORKER_SOURCE_MISSING"
  | "STARTUP_RETIREMENT_NOT_FIRST"
  | "RETIREMENT_ASSERTION_NOT_FATAL"
  | "RUN_ONCE_RETIREMENT_NOT_FIRST"
  | "RUN_LOOP_RETIREMENT_NOT_FIRST"
  | "PURPOSE_EXCEPTION_PRESENT"
  | "EXECUTABLE_DEPENDENCY_DEFAULT"
  | "FORBIDDEN_EXECUTION_IMPORT"
  | "DIRECT_LIFECYCLE_CALL"
  | "ALTERNATE_WORKER_ENTRYPOINT"

export interface WorkerRetirementFinding {
  code: WorkerRetirementFindingCode
  path: string
}

export interface AnalyzeWorkerRetirementOptions {
  repoRoot?: string
}

export interface WorkerRetirementAnalysis {
  findings: readonly WorkerRetirementFinding[]
  exitCode: 0 | 1
}

type FunctionLike =
  | ts.ArrowFunction
  | ts.FunctionExpression
  | ts.FunctionDeclaration

const toRepoPath = (repoRoot: string, absolutePath: string): string =>
  path.relative(repoRoot, absolutePath).split(path.sep).join("/")

const sourceFile = (repoPath: string, source: string): ts.SourceFile =>
  ts.createSourceFile(
    repoPath,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  )

const isExported = (node: ts.Node): boolean =>
  ts.canHaveModifiers(node) &&
  ts
    .getModifiers(node)
    ?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword) === true

const functionMap = (file: ts.SourceFile): Map<string, FunctionLike> => {
  const functions = new Map<string, FunctionLike>()
  for (const statement of file.statements) {
    if (ts.isFunctionDeclaration(statement) && statement.name) {
      functions.set(statement.name.text, statement)
      continue
    }
    if (!ts.isVariableStatement(statement)) continue
    for (const declaration of statement.declarationList.declarations) {
      if (
        ts.isIdentifier(declaration.name) &&
        declaration.initializer &&
        (ts.isArrowFunction(declaration.initializer) ||
          ts.isFunctionExpression(declaration.initializer))
      ) {
        functions.set(declaration.name.text, declaration.initializer)
      }
    }
  }
  return functions
}

const exportedFunctionNames = (file: ts.SourceFile): readonly string[] => {
  const names: string[] = []
  for (const statement of file.statements) {
    if (ts.isFunctionDeclaration(statement) && statement.name && isExported(statement)) {
      names.push(statement.name.text)
      continue
    }
    if (!ts.isVariableStatement(statement) || !isExported(statement)) continue
    for (const declaration of statement.declarationList.declarations) {
      if (
        ts.isIdentifier(declaration.name) &&
        declaration.initializer &&
        (ts.isArrowFunction(declaration.initializer) ||
          ts.isFunctionExpression(declaration.initializer))
      ) {
        names.push(declaration.name.text)
      }
    }
  }
  return names
}

const calledName = (expression: ts.Expression): string | undefined => {
  if (!ts.isCallExpression(expression)) return undefined
  if (ts.isIdentifier(expression.expression)) return expression.expression.text
  if (ts.isPropertyAccessExpression(expression.expression)) {
    return expression.expression.name.text
  }
  return undefined
}

const fatalFunction = (
  functions: ReadonlyMap<string, FunctionLike>,
  name: string,
  visiting: ReadonlySet<string> = new Set(),
): boolean => {
  if (visiting.has(name)) return false
  const node = functions.get(name)
  if (!node?.body) return false
  const nextVisiting = new Set(visiting).add(name)

  if (!ts.isBlock(node.body)) {
    const target = calledName(node.body)
    return target ? fatalFunction(functions, target, nextVisiting) : false
  }
  if (node.body.statements.length !== 1) return false
  const statement = node.body.statements[0]!
  if (ts.isThrowStatement(statement)) {
    return (
      statement.expression !== undefined &&
      ts.isNewExpression(statement.expression) &&
      ts.isIdentifier(statement.expression.expression) &&
      statement.expression.expression.text === "TypeScriptWorkerRetiredError"
    )
  }
  const expression = ts.isReturnStatement(statement)
    ? statement.expression
    : ts.isExpressionStatement(statement)
      ? statement.expression
      : undefined
  const target = expression ? calledName(expression) : undefined
  return target ? fatalFunction(functions, target, nextVisiting) : false
}

const firstStatementCalls = (
  node: FunctionLike | undefined,
  expectedName: string,
): boolean => {
  if (!node?.body || !ts.isBlock(node.body)) return false
  const statement = node.body.statements[0]
  if (!statement) return false
  const expression = ts.isReturnStatement(statement)
    ? statement.expression
    : ts.isExpressionStatement(statement)
      ? statement.expression
      : undefined
  return expression ? calledName(expression) === expectedName : false
}

const statementCalls = (
  statement: ts.Statement | undefined,
  expectedName: string,
): boolean => {
  if (!statement || !ts.isExpressionStatement(statement)) return false
  return calledName(statement.expression) === expectedName
}

const hasDefaultDependency = (node: FunctionLike | undefined): boolean =>
  node?.parameters.some((parameter) => parameter.initializer !== undefined) === true

const walkWorkerSources = (repoRoot: string): readonly string[] => {
  const root = path.join(repoRoot, "apps/worker/src")
  if (!existsSync(root)) return []
  const files: string[] = []
  const visit = (absolutePath: string): void => {
    const stat = statSync(absolutePath)
    if (stat.isDirectory()) {
      for (const entry of readdirSync(absolutePath)) {
        visit(path.join(absolutePath, entry))
      }
      return
    }
    if (
      stat.isFile() &&
      absolutePath.endsWith(".ts") &&
      !absolutePath.endsWith(".test.ts")
    ) {
      files.push(absolutePath)
    }
  }
  visit(root)
  return files.sort()
}

const inspectProductionFile = (
  repoRoot: string,
  absolutePath: string,
): readonly WorkerRetirementFinding[] => {
  const repoPath = toRepoPath(repoRoot, absolutePath)
  const file = sourceFile(repoPath, readFileSync(absolutePath, "utf8"))
  const findings: WorkerRetirementFinding[] = []

  const add = (code: WorkerRetirementFindingCode): void => {
    if (!findings.some((finding) => finding.code === code)) {
      findings.push({ code, path: repoPath })
    }
  }

  for (const name of exportedFunctionNames(file)) {
    if (
      !allowedWorkerFunctions.has(name) &&
      /(worker|match)/i.test(name) &&
      (/^(run|start|execute|process|claim|complete)/i.test(name) ||
        /Worker(?:Loop|Once|Runner)$/.test(name) ||
        /Match(?:Loop|Worker|Runner)$/.test(name))
    ) {
      add("ALTERNATE_WORKER_ENTRYPOINT")
    }
  }

  const visit = (node: ts.Node): void => {
    if (
      (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) &&
      formerPurposeValues.has(node.text)
    ) {
      add("PURPOSE_EXCEPTION_PRESENT")
    }
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      const clause = node.importClause
      if (clause?.namedBindings && ts.isNamedImports(clause.namedBindings)) {
        if (
          clause.namedBindings.elements.some((element) =>
            forbiddenExecutionSymbols.has(
              (element.propertyName ?? element.name).text,
            ),
          )
        ) {
          add("FORBIDDEN_EXECUTION_IMPORT")
        }
      }
    }
    if (ts.isCallExpression(node)) {
      const name = calledName(node)
      if (name && forbiddenExecutionSymbols.has(name)) {
        add("DIRECT_LIFECYCLE_CALL")
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(file)
  return findings
}

export const analyzeWorkerRetirement = (
  options: AnalyzeWorkerRetirementOptions = {},
): WorkerRetirementAnalysis => {
  const repoRoot = options.repoRoot ?? defaultRepoRoot
  const runnerPath = path.join(repoRoot, "apps/worker/src/runner.ts")
  const indexPath = path.join(repoRoot, "apps/worker/src/index.ts")
  const findings: WorkerRetirementFinding[] = []
  const add = (code: WorkerRetirementFindingCode, repoPath: string): void => {
    if (
      !findings.some(
        (finding) => finding.code === code && finding.path === repoPath,
      )
    ) {
      findings.push({ code, path: repoPath })
    }
  }

  if (!existsSync(runnerPath)) {
    add("WORKER_SOURCE_MISSING", "apps/worker/src/runner.ts")
  }
  if (!existsSync(indexPath)) {
    add("WORKER_SOURCE_MISSING", "apps/worker/src/index.ts")
  }

  if (existsSync(runnerPath)) {
    const runner = sourceFile(
      "apps/worker/src/runner.ts",
      readFileSync(runnerPath, "utf8"),
    )
    const functions = functionMap(runner)
    if (!fatalFunction(functions, retiredAssertionName)) {
      add("RETIREMENT_ASSERTION_NOT_FATAL", "apps/worker/src/runner.ts")
    }
    const once = functions.get("runWorkerOnce")
    if (!firstStatementCalls(once, retiredAssertionName)) {
      add("RUN_ONCE_RETIREMENT_NOT_FIRST", "apps/worker/src/runner.ts")
    }
    const loop = functions.get("runWorkerLoop")
    if (!firstStatementCalls(loop, retiredAssertionName)) {
      add("RUN_LOOP_RETIREMENT_NOT_FIRST", "apps/worker/src/runner.ts")
    }
    if (hasDefaultDependency(once) || hasDefaultDependency(loop)) {
      add("EXECUTABLE_DEPENDENCY_DEFAULT", "apps/worker/src/runner.ts")
    }
  }

  if (existsSync(indexPath)) {
    const index = sourceFile(
      "apps/worker/src/index.ts",
      readFileSync(indexPath, "utf8"),
    )
    const firstExecutable = index.statements.find(
      (statement) => !ts.isImportDeclaration(statement),
    )
    const startupCallsRetirement =
      firstExecutable !== undefined && ts.isTryStatement(firstExecutable)
        ? statementCalls(
            firstExecutable.tryBlock.statements[0],
            retiredAssertionName,
          )
        : statementCalls(firstExecutable, retiredAssertionName)
    if (!startupCallsRetirement) {
      add("STARTUP_RETIREMENT_NOT_FIRST", "apps/worker/src/index.ts")
    }
  }

  for (const absolutePath of walkWorkerSources(repoRoot)) {
    for (const finding of inspectProductionFile(repoRoot, absolutePath)) {
      add(finding.code, finding.path)
    }
  }

  findings.sort(
    (left, right) =>
      left.path.localeCompare(right.path) || left.code.localeCompare(right.code),
  )
  return { findings, exitCode: findings.length === 0 ? 0 : 1 }
}

export const formatWorkerRetirementAnalysis = (
  analysis: WorkerRetirementAnalysis,
): string =>
  `${[
    ...analysis.findings.map(
      (finding) => `${finding.code} ${finding.path}`,
    ),
    `worker_retirement_findings=${analysis.findings.length}`,
  ].join("\n")}\n`

const main = (): number => {
  const analysis = analyzeWorkerRetirement()
  process.stdout.write(formatWorkerRetirementAnalysis(analysis))
  return analysis.exitCode
}

const currentFile = fileURLToPath(import.meta.url)
const entryFile = process.argv[1] ? path.resolve(process.argv[1]) : undefined
if (entryFile === currentFile) {
  process.exitCode = main()
}
