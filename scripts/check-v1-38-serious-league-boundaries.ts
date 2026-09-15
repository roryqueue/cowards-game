import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import ts from "typescript"

export interface SeriousLeagueBoundaryViolation {
  readonly path: string
  readonly line: number
  readonly rule: string
}

export interface SeriousLeagueBoundaryResult {
  readonly ok: boolean
  readonly violations: readonly SeriousLeagueBoundaryViolation[]
}

export interface SeriousLeagueBoundaryOptions {
  readonly repoRoot?: string
  readonly files?: Readonly<Record<string, string>>
}

const sourceExtension = /\.(?:[cm]?[jt]sx?)$/u
const privateLeaguePath = (file: string) =>
  file === "packages/strategy-lab/src/index.ts" ||
  file.startsWith("packages/strategy-lab/src/league/") ||
  file === "scripts/run-v1-38-serious-league.ts" ||
  file === "packages/strategy-lab/package.json"
const publicPath = (file: string) =>
  file.startsWith("apps/") ||
  /(?:^|\/)(?:public|generated|deploy|deployment|artifacts)\//u.test(file)

const walk = (repoRoot: string, root: string): Readonly<Record<string, string>> => {
  const output: Record<string, string> = {}
  const visit = (absolute: string) => {
    if (!existsSync(absolute)) return
    const stat = statSync(absolute)
    if (stat.isDirectory()) {
      for (const entry of readdirSync(absolute)) {
        if (["node_modules", "dist", "coverage", ".turbo", ".next"].includes(entry)) continue
        visit(path.join(absolute, entry))
      }
      return
    }
    const relative = path.relative(repoRoot, absolute).split(path.sep).join("/")
    if (sourceExtension.test(relative) || relative.endsWith("package.json")) output[relative] = readFileSync(absolute, "utf8")
  }
  visit(path.join(repoRoot, "packages/strategy-lab/src/league"))
  visit(path.join(repoRoot, "packages/strategy-lab/src/index.ts"))
  visit(path.join(repoRoot, "packages/strategy-lab/package.json"))
  visit(path.join(repoRoot, "scripts/run-v1-38-serious-league.ts"))
  visit(path.join(repoRoot, "apps"))
  return output
}

const lineAt = (sourceFile: ts.SourceFile, node: ts.Node) => sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1
const imports = (sourceFile: ts.SourceFile, visit: (value: string, node: ts.Node) => void) => {
  const walkNode = (node: ts.Node) => {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) visit(node.moduleSpecifier.text, node)
    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
      if (node.arguments.length !== 1 || !ts.isStringLiteral(node.arguments[0]!)) visit("<dynamic>", node)
      else visit(node.arguments[0]!.text, node)
    }
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === "require") {
      if (node.arguments.length !== 1 || !ts.isStringLiteral(node.arguments[0]!)) visit("<dynamic>", node)
      else visit(node.arguments[0]!.text, node)
    }
    ts.forEachChild(node, walkNode)
  }
  walkNode(sourceFile)
}

/** AST/import-graph guard for the private Phase 265 source lane. */
export const checkSeriousLeagueBoundaries = (options: SeriousLeagueBoundaryOptions = {}): SeriousLeagueBoundaryResult => {
  const repoRoot = options.repoRoot ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
  const files = options.files ?? walk(repoRoot, ".")
  const violations: SeriousLeagueBoundaryViolation[] = []
  const add = (file: string, node: ts.Node, sourceFile: ts.SourceFile, rule: string) => violations.push({ path: file, line: lineAt(sourceFile, node), rule })
  for (const [file, text] of Object.entries(files)) {
    if ((!privateLeaguePath(file) && !publicPath(file)) || /\.test\.[cm]?[jt]sx?$/u.test(file)) continue
    if (file.endsWith("package.json")) {
      try {
        const manifest = JSON.parse(text) as { private?: unknown; exports?: unknown }
        if (file === "packages/strategy-lab/package.json" && manifest.private !== true) violations.push({ path: file, line: 1, rule: "league-package-must-stay-private" })
        if (file === "packages/strategy-lab/package.json" && JSON.stringify(manifest.exports).includes("league/")) violations.push({ path: file, line: 1, rule: "no-league-subpath-export" })
      } catch { violations.push({ path: file, line: 1, rule: "manifest-json" }) }
      continue
    }
    if (!sourceExtension.test(file)) continue
    const sourceFile = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
    imports(sourceFile, (specifier, node) => {
      if (privateLeaguePath(file) && specifier === "<dynamic>") add(file, node, sourceFile, "dynamic-loader")
      if (publicPath(file) && (specifier.includes("strategy-lab") || specifier.includes("serious-league") || specifier.includes("/league/"))) add(file, node, sourceFile, "private-league-reachable-from-public-root")
      if (privateLeaguePath(file) && /(?:runtime-js\/src\/revision|strategy-selector|runCanonicalLabMatch)/u.test(specifier)) add(file, node, sourceFile, "direct-strategy-or-match-execution")
    })
    if (privateLeaguePath(file)) {
      const visit = (node: ts.Node) => {
        if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === "eval") add(file, node, sourceFile, "direct-source-execution:eval")
        if (ts.isNewExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === "Function") add(file, node, sourceFile, "direct-source-execution:new-function")
        if (ts.isPropertyAssignment(node) && ts.isIdentifier(node.name) && ["StrategyMemory", "SoldierMemory", "objectivePayload", "holdout", "formation"].includes(node.name.text)) add(file, node, sourceFile, `prohibited-report-payload:${node.name.text}`)
        ts.forEachChild(node, visit)
      }
      visit(sourceFile)
    }
  }
  return { ok: violations.length === 0, violations }
}

const invokedAsScript = process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href
if (invokedAsScript) {
  const result = checkSeriousLeagueBoundaries()
  if (!result.ok) {
    process.stderr.write(`${JSON.stringify(result.violations, null, 2)}\n`)
    process.exitCode = 1
  }
}
