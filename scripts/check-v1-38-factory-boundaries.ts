import { readdirSync, readFileSync } from "node:fs"
import { dirname, relative, resolve, posix } from "node:path"
import { fileURLToPath } from "node:url"
import ts from "typescript"
import { checkLabBoundaries, type LabBoundaryViolation } from "./check-v1-38-lab-boundaries.js"

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const sourceFile = /\.[cm]?[jt]sx?$/u
const oracle = (path: string) => /^packages\/strategy-oracle-(?:tactical|teacher|model)\//u.test(path)
const factory = (path: string) => path.startsWith("packages/strategy-lab/src/factory/")
const privatePath = (path: string) => oracle(path) || factory(path)
const testPath = (path: string) => /(?:\.test|\.spec)\.[cm]?[jt]sx?$/u.test(path) || /(?:^|\/)(?:test|__tests__)\//u.test(path)
const production = (path: string) => /^(?:apps|packages)\//u.test(path) && !path.startsWith("packages/strategy-lab/") && !oracle(path) && !/\.test\./u.test(path)
const nonStrategicPackage = /^(?:@cowards\/(?:spec|engine|replay|runtime-js)|node:)/u
const strategic = /(?:^|\/)(?:planner|selector|scoring|search|controller|distill|prompt|response)(?:\/|\.|$)/u
const oracleRoot = (path: string) => path.split("/").slice(0, 2).join("/")
const reviewedAstTool = (path: string) => /^packages\/strategy-oracle-(?:tactical|teacher|model)\/src\/emit\.ts$/u.test(path) || /^packages\/strategy-lab\/src\/factory\/(?:fingerprint|intake)\.ts$/u.test(path)
const narrowPacketFactory = new Set([
  "packages/strategy-lab/src/factory/packet.ts",
  "packages/strategy-lab/src/factory/contracts.ts",
  "packages/strategy-lab/src/factory/identity.ts",
])

const loadFiles = (): Record<string, string> => {
  const files: Record<string, string> = {}
  const ignored = new Set(["node_modules", ".git", ".planning", "dist", ".next", ".turbo", "coverage"])
  const walk = (directory: string) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (entry.isSymbolicLink()) continue
      const path = resolve(directory, entry.name)
      if (entry.isDirectory()) { if (!ignored.has(entry.name)) walk(path); continue }
      if (sourceFile.test(entry.name) || entry.name === "package.json" || /docker|compose|deploy|public|generated/iu.test(entry.name)) files[relative(repositoryRoot, path).replaceAll("\\", "/")] = readFileSync(path, "utf8")
    }
  }
  walk(repositoryRoot)
  return files
}

const candidates = (from: string, specifier: string): readonly string[] => {
  if (specifier === "@cowards/strategy-lab/factory/packet") return ["packages/strategy-lab/src/factory/packet.ts"]
  if (specifier === "@cowards/strategy-lab/factory") return ["packages/strategy-lab/src/factory/index.ts"]
  const oracleMatch = /^@cowards\/(strategy-oracle-(?:tactical|teacher|model))$/u.exec(specifier)
  if (oracleMatch) return [`packages/${oracleMatch[1]}/src/index.ts`]
  if (!specifier.startsWith(".")) return []
  const base = posix.normalize(posix.join(posix.dirname(from), specifier)).replace(/\.[cm]?[jt]sx?$/u, "")
  return [`${base}.ts`, `${base}.tsx`, `${base}.js`, `${base}/index.ts`, `${base}/index.js`]
}

const sourceSpecifiers = (source: string, path: string): readonly (string | undefined)[] => {
  const ast = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true)
  const options: ts.CompilerOptions = { noLib: true, noResolve: true, allowJs: true }
  const host = ts.createCompilerHost(options)
  host.getSourceFile = name => name === path ? ast : undefined
  host.fileExists = name => name === path
  host.readFile = name => name === path ? source : undefined
  const checker = ts.createProgram([path], options, host).getTypeChecker()
  const bindings = new Map<ts.Symbol, ts.Expression>()
  const collect = (node: ts.Node): void => {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
      const symbol = checker.getSymbolAtLocation(node.name); if (symbol) bindings.set(symbol, node.initializer)
    }
    ts.forEachChild(node, collect)
  }
  collect(ast)
  const constant = (node: ts.Expression, depth = 0): string | undefined => {
    if (depth > 8) return undefined
    if (ts.isStringLiteralLike(node)) return node.text
    if (ts.isParenthesizedExpression(node) || ts.isAsExpression(node) || ts.isNonNullExpression(node)) return constant(node.expression, depth + 1)
    if (ts.isIdentifier(node)) { const symbol = checker.getSymbolAtLocation(node); return symbol && bindings.has(symbol) ? constant(bindings.get(symbol)!, depth + 1) : undefined }
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) { const left = constant(node.left, depth + 1), right = constant(node.right, depth + 1); return left === undefined || right === undefined ? undefined : `${left}${right}` }
    return undefined
  }
  const values: (string | undefined)[] = []
  const visit = (node: ts.Node): void => {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier) values.push(constant(node.moduleSpecifier as ts.Expression))
    if (ts.isImportEqualsDeclaration(node) && ts.isExternalModuleReference(node.moduleReference) && node.moduleReference.expression) values.push(constant(node.moduleReference.expression))
    if (ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword || (ts.isIdentifier(node.expression) && node.expression.text === "require") || (ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === "require"))) values.push(node.arguments[0] ? constant(node.arguments[0]) : undefined)
    ts.forEachChild(node, visit)
  }
  visit(ast)
  return values
}

const hasHostileExecutionConstruct = (source: string, path: string): boolean => {
  const ast = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true)
  let found = false
  const visit = (node: ts.Node): void => {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && (node.expression.text === "eval" || node.expression.text === "Function")) found = true
    ts.forEachChild(node, visit)
  }
  visit(ast)
  return found
}

export interface FactoryBoundaryViolation extends LabBoundaryViolation {}
/** AST/module-resolution policy monitor; static graph evidence only, never sandbox certification. */
export const checkFactoryBoundaries = (options: { files?: Readonly<Record<string, string>> } = {}) => {
  const files = options.files ?? loadFiles(), violations: FactoryBoundaryViolation[] = [...checkLabBoundaries({ files }).violations]
  const add = (code: string, file: string) => { if (!violations.some(entry => entry.code === code && entry.file === file)) violations.push({ code, file }) }
  const graph = new Map<string, Set<string>>()
  for (const [path, source] of Object.entries(files)) {
    if (testPath(path)) continue
    const edges = new Set<string>()
    if (sourceFile.test(path)) for (const specifier of sourceSpecifiers(source, path)) {
      if (specifier === undefined) { if (privatePath(path)) add("UNRESOLVED_PRIVATE_LOADER", path); continue }
      const targets = candidates(path, specifier), target = targets.find(candidate => files[candidate] !== undefined)
      if (target) edges.add(target)
      if (privatePath(path) && !target && !nonStrategicPackage.test(specifier) && !(specifier === "typescript" && reviewedAstTool(path))) add("UNRESOLVED_PRIVATE_LOADER", path)
      if (oracle(path) && specifier === "@cowards/strategy-lab/factory") add("ORACLE_BROAD_FACTORY_BARREL", path)
    }
    if (privatePath(path) && sourceFile.test(path) && hasHostileExecutionConstruct(source, path)) add("PRIVATE_HOSTILE_EXECUTION", path)
    if (path.endsWith("/package.json")) {
      try {
        const manifest = JSON.parse(source) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string>; exports?: Record<string, string> }
        for (const dependency of Object.keys({ ...manifest.dependencies, ...manifest.devDependencies })) {
          const target = candidates(path, dependency).find(candidate => files[candidate] !== undefined)
          if (target) edges.add(target)
        if (oracle(path) && (/^@cowards\/strategy-oracle-/u.test(dependency) || dependency === "@cowards/strategy-lab/factory")) add("ORACLE_MANIFEST_ROUTE", path)
          if (factory(path) && /^@cowards\/strategy-oracle-/u.test(dependency)) add("FACTORY_MANIFEST_ROUTE", path)
        }
        if (oracle(path) && manifest.exports && Object.values(manifest.exports).some(value => typeof value === "string" && strategic.test(value))) add("ORACLE_STRATEGIC_ENTRYPOINT", path)
      } catch { add("MANIFEST_INVALID", path) }
    }
    graph.set(path, edges)
  }
  for (const origin of graph.keys()) {
    const seen = new Set<string>()
    const visit = (path: string): void => {
      if (seen.has(path)) return
      seen.add(path)
      if (oracle(origin) && path !== origin) {
        if ((oracle(path) && oracleRoot(path) !== oracleRoot(origin)) || path.startsWith("packages/strategy-lab/src/planner/") || (factory(path) && !narrowPacketFactory.has(path))) add("ORACLE_STRATEGIC_ROUTE", origin)
      }
      if (factory(origin) && oracle(path)) add("FACTORY_REACHES_ORACLE", origin)
      if (production(origin) && privatePath(path)) add("PRODUCTION_REACHES_PRIVATE_FACTORY", origin)
      for (const next of graph.get(path) ?? []) visit(next)
    }
    visit(origin)
  }
  violations.sort((left, right) => left.file === right.file ? left.code.localeCompare(right.code) : left.file.localeCompare(right.file))
  return { ok: violations.length === 0, violations, scannedFiles: Object.keys(files).length }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = checkFactoryBoundaries()
  console.log(JSON.stringify(result))
  if (!result.ok) process.exitCode = 1
}
