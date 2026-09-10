import { readdirSync, readFileSync } from "node:fs"
import { dirname, resolve, relative, posix } from "node:path"
import { fileURLToPath } from "node:url"
import ts from "typescript"

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const isLab = (p: string) => p.startsWith("packages/strategy-lab/")
const isTest = (p: string) => /(?:\.test|\.spec)\.[cm]?[jt]sx?$/u.test(p) || /(?:^|\/)(?:test|__tests__|testdata)\//u.test(p) || /_test\.go$/u.test(p)
const production = (p: string) => /^(?:packages|apps)\//u.test(p) && !isLab(p) && !isTest(p)
const labText = /strategy[-_/]lab|private[-_]lab|lab[-_]artifacts|lab[-_]trace|planner-feasibility/iu
const allowedCore = /^(?:packages\/(?:spec|engine|replay|runtime-js)\/)/u
const allowedNode = new Set(["node:crypto", "node:fs", "node:fs/promises", "node:path", "node:url", "node:os", "node:worker_threads", "node:buffer"])
const ignoredDirectories = new Set(["node_modules", ".git", ".planning", "dist", ".next", ".turbo", "coverage", "vendor", "test-results", ".cache"])
const sourceExtension = /\.[cm]?[jt]sx?$/u
const loadFiles = (): Record<string, string> => {
  const files: Record<string, string> = {}
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isSymbolicLink()) continue
      const path = resolve(dir, entry.name)
      if (entry.isDirectory()) { if (!ignoredDirectories.has(entry.name)) walk(path); continue }
      if (sourceExtension.test(entry.name) || /\.(?:json|ya?ml|toml|go|sh)$/u.test(entry.name) || /dockerfile|dockerignore/iu.test(entry.name)) {
        files[relative(repositoryRoot, path).replaceAll("\\", "/")] = readFileSync(path, "utf8")
      }
    }
  }
  walk(repositoryRoot)
  return files
}
export interface LabBoundaryViolation { code: string; file: string }
/** Offline source graph monitor, not a sandbox or a claim about arbitrary runtime-generated code. */
export const checkLabBoundaries = (options: { files?: Readonly<Record<string, string>> } = {}) => {
  const files = options.files ?? loadFiles()
  const violations: LabBoundaryViolation[] = []
  const add = (code: string, file: string) => { if (!violations.some((v) => v.code === code && v.file === file)) violations.push({ code, file }) }
  const graph = new Map<string, Set<string>>()
  const root = "/lab-boundary"
  const key = (p: string) => posix.relative(root, p)
  const directories = new Set<string>(["."])
  for (const file of Object.keys(files)) {
    let directory = posix.dirname(file)
    while (directory !== ".") { directories.add(directory); directory = posix.dirname(directory) }
  }
  const host: ts.ModuleResolutionHost = { fileExists: (p) => files[key(p)] !== undefined, readFile: (p) => files[key(p)], directoryExists: (p) => directories.has(key(p)) }
  const configs = Object.entries(files).filter(([p]) => /(?:^|\/)tsconfig(?:\.[^/]*)?\.json$/u.test(p)).map(([p, source]) => ({ path: p, config: ts.parseConfigFileTextToJson(p, source).config as { compilerOptions?: { paths?: Record<string, string[]>; baseUrl?: string } } | undefined }))
  const resolveEdge = (from: string, specifier: string): string | undefined => {
    const paths: Record<string, string[]> = { "@cowards/*": ["packages/*/src/index.ts"] }
    for (const { path, config } of configs) {
      if (posix.dirname(path) !== "." && !from.startsWith(`${posix.dirname(path)}/`)) continue
      for (const [alias, targets] of Object.entries(config?.compilerOptions?.paths ?? {})) paths[alias] = targets.map((target) => posix.join(posix.dirname(path), config?.compilerOptions?.baseUrl ?? ".", target))
    }
    const resolved = ts.resolveModuleName(specifier, `${root}/${from}`, { moduleResolution: ts.ModuleResolutionKind.Bundler, baseUrl: root, paths, allowJs: true, resolveJsonModule: true }, host).resolvedModule
    return resolved ? key(resolved.resolvedFileName) : undefined
  }
  for (const [path, source] of Object.entries(files)) {
    if (isTest(path)) continue
    const deployment = /(?:^|\/)(?:Dockerfile[^/]*|[^/]*docker[^/]*|compose[^/]*|deploy[^/]*)(?:\/|$)/iu.test(path)
    const generatedOrPublic = /(?:^|\/)(?:artifacts|generated|public)\//u.test(path)
    if ((production(path) || deployment || generatedOrPublic) && !sourceExtension.test(path) && labText.test(source)) add("PRODUCTION_ARTIFACT_EXPOSURE", path)
    if (generatedOrPublic && !sourceExtension.test(path) && /"(?:strategyMemory|soldierMemory|objective|privateTrace|hostPath)"\s*:/u.test(source) && /\/public\//u.test(path)) add("PRIVATE_PUBLIC_PAYLOAD", path)
    if (/dockerfile/iu.test(path) && /(?:COPY|ADD)\s+(?:\[\s*")?\.\/?["\s,]/u.test(source) && !/^packages\/strategy-lab\/?$/mu.test(files[".dockerignore"] ?? "")) add("IMAGE_INCLUDES_LAB", path)
    if (path === "packages/strategy-lab/package.json") {
      const manifest = JSON.parse(source) as { private?: boolean; scripts?: Record<string, string>; dependencies?: Record<string, string> }
      if (manifest.private !== true || manifest.scripts?.build !== undefined) add("LAB_PRODUCTION_BUILD", path)
      for (const dependency of Object.keys(manifest.dependencies ?? {})) if (!/^@cowards\/(?:spec|engine|replay|runtime-js)$/u.test(dependency)) add("CORE_DEPENDENCY_DENIED", path)
    }
    if (!sourceExtension.test(path)) continue
    const ast = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true)
    // Symbol identity preserves lexical scope: a nested same-name declaration
    // cannot overwrite the binding used by an outer import expression.
    const bindingOptions: ts.CompilerOptions = { noLib: true, noResolve: true, allowJs: true, target: ts.ScriptTarget.Latest }
    const bindingHost = ts.createCompilerHost(bindingOptions)
    bindingHost.getSourceFile = name => name === path ? ast : undefined
    bindingHost.fileExists = name => name === path
    bindingHost.readFile = name => name === path ? source : undefined
    const checker = ts.createProgram([path], bindingOptions, bindingHost).getTypeChecker()
    const bindings = new Map<ts.Symbol, ts.Expression[]>()
    const uncertain = new Set<ts.Symbol>()
    const bind = (name: ts.Identifier, value: ts.Expression) => {
      const symbol = checker.getSymbolAtLocation(name)
      if (symbol) bindings.set(symbol, [...(bindings.get(symbol) ?? []), value])
    }
    const collect = (node: ts.Node) => {
      if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) bind(node.name, node.initializer)
      if (ts.isBinaryExpression(node) && ts.isIdentifier(node.left) && node.operatorToken.kind >= ts.SyntaxKind.FirstAssignment && node.operatorToken.kind <= ts.SyntaxKind.LastAssignment) {
        bind(node.left, node.right)
        if (node.operatorToken.kind !== ts.SyntaxKind.EqualsToken) { const symbol = checker.getSymbolAtLocation(node.left); if (symbol) uncertain.add(symbol) }
      }
      ts.forEachChild(node, collect)
    }
    collect(ast)
    const constant = (node: ts.Expression, depth = 0): (string | undefined)[] => {
      if (depth > 8) return [undefined]
      if (ts.isStringLiteralLike(node)) return [node.text]
      if (ts.isParenthesizedExpression(node) || ts.isAsExpression(node) || ts.isNonNullExpression(node)) return constant(node.expression, depth + 1)
      if (ts.isIdentifier(node)) {
        const symbol = checker.getSymbolAtLocation(node), values = symbol && bindings.get(symbol)
        const candidates = values ? values.flatMap(value => constant(value, depth + 1)) : [undefined]
        return symbol && uncertain.has(symbol) ? [...candidates, undefined] : candidates
      }
      if (ts.isConditionalExpression(node)) return [...constant(node.whenTrue, depth + 1), ...constant(node.whenFalse, depth + 1)]
      if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
        const left = constant(node.left, depth + 1), right = constant(node.right, depth + 1)
        if (left.length * right.length > 64) return [undefined]
        return left.flatMap(a => right.map(b => a !== undefined && b !== undefined ? a + b : undefined))
      }
      return [undefined]
    }
    const edges = new Set<string>()
    const inspectEdge = (expression: ts.Expression) => {
      for (const specifier of new Set(constant(expression))) {
      if (specifier === undefined) {
        if (isLab(path) || labText.test(expression.getText(ast)) || labText.test(source)) add("UNRESOLVED_LAB_EDGE", path)
        continue
      }
      const target = resolveEdge(path, specifier)
      if (target) edges.add(target)
      if (production(path) && (labText.test(specifier) || (target && isLab(target)))) add("PRODUCTION_REACHES_LAB", path)
      if (!target && labText.test(specifier) && !isLab(path)) add("UNRESOLVED_LAB_EDGE", path)
      const staticBuildTool = path === "packages/strategy-lab/src/planner/emit.ts" && specifier === "typescript"
      if (isLab(path) && !(target && (isLab(target) || allowedCore.test(target))) && !allowedNode.has(specifier) && !staticBuildTool) add("CORE_DEPENDENCY_DENIED", path)
      }
    }
    const visit = (node: ts.Node) => {
      if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier) inspectEdge(node.moduleSpecifier as ts.Expression)
      if (ts.isImportEqualsDeclaration(node) && ts.isExternalModuleReference(node.moduleReference) && node.moduleReference.expression) inspectEdge(node.moduleReference.expression)
      if (ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword || (ts.isIdentifier(node.expression) && node.expression.text === "require") || (ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === "require"))) {
        if (node.arguments[0]) inspectEdge(node.arguments[0])
      }
      ts.forEachChild(node, visit)
    }
    visit(ast)
    graph.set(path, edges)
  }
  for (const path of graph.keys()) {
    if (!production(path) && !isLab(path)) continue
    const visited = new Set<string>()
    const visit = (current: string) => {
      if (visited.has(current)) return
      visited.add(current)
      if (production(path) && isLab(current)) add("PRODUCTION_REACHES_LAB", path)
      if (isLab(path) && current !== path && !isLab(current) && !allowedCore.test(current)) add("CORE_TRANSITIVE_DEPENDENCY_DENIED", path)
      for (const next of graph.get(current) ?? []) visit(next)
    }
    visit(path)
  }
  violations.sort((a, b) => a.file < b.file ? -1 : a.file > b.file ? 1 : a.code < b.code ? -1 : 1)
  return { ok: violations.length === 0, violations, scannedFiles: Object.keys(files).length }
}

export const validateLabReceipt = (value: unknown) => {
  const fail = (): never => { throw new TypeError("LAB_RECEIPT_INVALID") }
  const exact = (v: unknown, keys: string[]): v is Record<string, unknown> => v !== null && typeof v === "object" && !Array.isArray(v) && Object.keys(v).sort().join("|") === keys.sort().join("|")
  const root = (v: unknown) => typeof v === "string" && /^sha256:[0-9a-f]{64}$/u.test(v)
  if (!exact(value, ["schemaVersion", "status", "counts", "protocolRoot", "semanticRoot", "operationalRoot"]) || value.schemaVersion !== "lab-receipt-v1" || !["not_run", "pass", "non_pass", "invalid"].includes(String(value.status)) || !root(value.protocolRoot) || !(value.semanticRoot === null || root(value.semanticRoot)) || !(value.operationalRoot === null || root(value.operationalRoot))) return fail()
  const counts = value.counts
  if (!exact(counts, ["allocated", "completed", "failed", "unused"]) || counts.allocated !== 24 || !Object.values(counts).every((v) => Number.isSafeInteger(v) && Number(v) >= 0 && Number(v) <= 24) || Number(counts.completed) + Number(counts.failed) + Number(counts.unused) !== 24) return fail()
  if (value.status === "pass" && (counts.completed !== 24 || value.semanticRoot === null || value.operationalRoot === null)) return fail()
  if (value.status === "not_run" && (counts.unused !== 24 || value.semanticRoot !== null || value.operationalRoot !== null)) return fail()
  return structuredClone(value)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = checkLabBoundaries()
  console.log(JSON.stringify(result))
  if (!result.ok) process.exitCode = 1
}
