import { readdirSync, readFileSync } from "node:fs"
import { dirname, resolve, relative, posix } from "node:path"
import { fileURLToPath } from "node:url"
import ts from "typescript"

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const isLab = (p: string) => p.startsWith("packages/strategy-lab/")
const isOracle = (p: string) => /^packages\/strategy-oracle-(?:tactical|teacher|model)\//u.test(p)
const isPrivateStrategy = (p: string) => isLab(p) || isOracle(p)
const isTest = (p: string) => /(?:\.test|\.spec)\.[cm]?[jt]sx?$/u.test(p) || /(?:^|\/)(?:test|__tests__|testdata)\//u.test(p) || /_test\.go$/u.test(p)
const production = (p: string) => /^(?:packages|apps)\//u.test(p) && !isPrivateStrategy(p) && !isTest(p)
const labText = /strategy[-_/](?:lab|oracle)|private[-_]lab|lab[-_]artifacts|lab[-_]trace|planner-feasibility/iu
const allowedCore = /^(?:packages\/(?:spec|engine|replay|runtime-js|runtime-supervisor)\/)/u
const allowedNode = new Set(["node:crypto", "node:fs", "node:fs/promises", "node:path", "node:url", "node:os", "node:worker_threads", "node:buffer"])
const ignoredDirectories = new Set(["node_modules", ".git", ".planning", "dist", ".next", ".turbo", "coverage", "vendor", "test-results", ".cache"])
const sourceExtension = /\.[cm]?[jt]sx?$/u
/** Conservative COPY/ADD inspection, not a Dockerfile interpreter. */
const imageCopyUnproven = (source: string, contextExcluded: boolean): boolean => {
  const instructions = source.replace(/^\s*#.*$/gmu, "").replace(/\\\r?\n/gu, " ")
  for (const match of instructions.matchAll(/^\s*(?:ONBUILD\s+)?(?:COPY|ADD)\s+(.+)$/gimu)) {
    if (/^\s*#\s*escape\s*=/gimu.test(source)) return true
    let args = match[1]!.trim(), fromStage = false
    while (args.startsWith("--")) {
      const flag = /^--([a-z-]+)(?:=([^\s]+))?\s+/iu.exec(args)
      if (!flag || (!flag[2] && !["link", "parents", "keep-git-dir", "unpack"].includes(flag[1]!.toLowerCase()))) return true
      if (flag[1]!.toLowerCase() === "from") fromStage = true
      args = args.slice(flag[0].length)
    }
    let operands: string[]
    try {
      const parsed: unknown = args.startsWith("[") ? JSON.parse(args) : args.split(/\s+/u)
      if (!Array.isArray(parsed) || parsed.length < 2 || !parsed.every(p => typeof p === "string")) return true
      operands = parsed
    } catch { return true }
    for (const operand of operands.slice(0, -1)) {
      const path = posix.normalize(operand.replace(/^["']|["']$/gu, "").replace(/^\/+/u, "")).replace(/\/$/u, "")
      const broad = path === "." || path === "packages" || /[*?$[\]]/u.test(path)
      // --from uses another stage/image, not the ignored local build context.
      if (broad && (fromStage || !contextExcluded)) return true
    }
  }
  return false
}
export const loadLabBoundaryFiles = (inventoryRoot = repositoryRoot): Record<string, string> => {
  const files: Record<string, string> = {}
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isSymbolicLink()) continue
      const path = resolve(dir, entry.name)
      if (entry.isDirectory()) {
        // Canonical private experiment evidence is data, not source inventory.
        // Exclude only this root directory; a public/.strategy-lab copy remains
        // visible to the exposure checks, as does any explicit source import.
        if (!ignoredDirectories.has(entry.name) && path !== resolve(inventoryRoot, ".strategy-lab")) walk(path)
        continue
      }
      if (sourceExtension.test(entry.name) || /\.(?:json|ya?ml|toml|go|sh)$/u.test(entry.name) || /dockerfile|dockerignore/iu.test(entry.name)) {
        files[relative(inventoryRoot, path).replaceAll("\\", "/")] = readFileSync(path, "utf8")
      }
    }
  }
  walk(inventoryRoot)
  return files
}
const loadFiles = loadLabBoundaryFiles

export interface LabBoundaryGraph {
  readonly files: Readonly<Record<string, string>>
  readonly graph: ReadonlyMap<string, ReadonlySet<string>>
  readonly unresolved: ReadonlyMap<string, readonly (string | undefined)[]>
  /** Declared package dependencies stay visible to policy without opening package barrels. */
  readonly manifestDependencies: ReadonlyMap<string, readonly string[]>
}
/** Shared AST/module-resolution graph used by the factory policy monitor. */
export const collectLabBoundaryGraph = (options: { files?: Readonly<Record<string, string>> } = {}): LabBoundaryGraph => {
  const files = options.files ?? loadFiles(), graph = new Map<string, Set<string>>(), unresolved = new Map<string, (string | undefined)[]>(), manifestDependencies = new Map<string, readonly string[]>()
  const root = "/lab-boundary", key = (path: string) => posix.relative(root, path), directories = new Set<string>(["."])
  for (const file of Object.keys(files)) { let directory = posix.dirname(file); while (directory !== ".") { directories.add(directory); directory = posix.dirname(directory) } }
  const host: ts.ModuleResolutionHost = { fileExists: path => files[key(path)] !== undefined, readFile: path => files[key(path)], directoryExists: path => directories.has(key(path)) }
  const configs = Object.entries(files).filter(([path]) => /(?:^|\/)tsconfig(?:\.[^/]*)?\.json$/u.test(path)).map(([path, source]) => ({ path, config: ts.parseConfigFileTextToJson(path, source).config as { compilerOptions?: { paths?: Record<string, string[]>; baseUrl?: string } } | undefined }))
  const manifests = new Map<string, { path: string; entries: readonly string[] }>()
  const strings = (value: unknown): string[] => typeof value === "string" ? [value] : value && typeof value === "object" ? Object.values(value as Record<string, unknown>).flatMap(strings) : []
  for (const [path, source] of Object.entries(files)) if (path.endsWith("/package.json")) try { const manifest = JSON.parse(source) as { name?: unknown; main?: unknown; module?: unknown; exports?: unknown }; if (typeof manifest.name === "string") manifests.set(manifest.name, { path, entries: [...new Set([...(typeof manifest.main === "string" ? [manifest.main] : []), ...(typeof manifest.module === "string" ? [manifest.module] : []), ...strings(manifest.exports)])] }) } catch { /* policy checker reports malformed manifests separately */ }
  const resolveSpecifier = (from: string, specifier: string): string[] => {
    const paths: Record<string, string[]> = { "@cowards/*": ["packages/*/src/index.ts"], "@cowards/strategy-lab/factory": ["packages/strategy-lab/src/factory/index.ts"], "@cowards/strategy-lab/factory/packet": ["packages/strategy-lab/src/factory/packet.ts"] }
    for (const { path, config } of configs) {
      if (posix.dirname(path) !== "." && !from.startsWith(`${posix.dirname(path)}/`)) continue
      for (const [alias, targets] of Object.entries(config?.compilerOptions?.paths ?? {})) paths[alias] = targets.map(target => posix.join(posix.dirname(path), config?.compilerOptions?.baseUrl ?? ".", target))
    }
    const resolved = ts.resolveModuleName(specifier, `${root}/${from}`, { moduleResolution: ts.ModuleResolutionKind.Bundler, baseUrl: root, paths, allowJs: true, resolveJsonModule: true }, host).resolvedModule
    if (resolved) return [key(resolved.resolvedFileName)]
    const owner = [...manifests.entries()].find(([name]) => specifier === name || specifier.startsWith(`${name}/`))
    if (!owner) return []
    const [name, manifest] = owner, subpath = specifier.slice(name.length)
    const requested = subpath ? manifest.entries.filter(entry => entry.includes(subpath.slice(1))) : manifest.entries
    return requested.flatMap(entry => {
      const base = posix.join(posix.dirname(manifest.path), entry).replace(/^\.\//u, "")
      return [base, `${base}.ts`, `${base}.js`, `${base}/index.ts`, `${base}/index.js`].filter(candidate => files[candidate] !== undefined)
    })
  }
  for (const [path, source] of Object.entries(files)) {
    const edges = new Set<string>(), missing: (string | undefined)[] = []
    if (sourceExtension.test(path) && !isTest(path)) {
      const ast = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true), options: ts.CompilerOptions = { noLib: true, noResolve: true, allowJs: true, target: ts.ScriptTarget.Latest }, bindingHost = ts.createCompilerHost(options)
      bindingHost.getSourceFile = name => name === path ? ast : undefined; bindingHost.fileExists = name => name === path; bindingHost.readFile = name => name === path ? source : undefined
      const checker = ts.createProgram([path], options, bindingHost).getTypeChecker(), bindings = new Map<ts.Symbol, ts.Expression[]>(), uncertain = new Set<ts.Symbol>()
      const bind = (name: ts.Identifier, value: ts.Expression) => { const symbol = checker.getSymbolAtLocation(name); if (symbol) bindings.set(symbol, [...(bindings.get(symbol) ?? []), value]) }
      const collect = (node: ts.Node): void => { if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) bind(node.name, node.initializer); if (ts.isBinaryExpression(node) && ts.isIdentifier(node.left) && node.operatorToken.kind >= ts.SyntaxKind.FirstAssignment && node.operatorToken.kind <= ts.SyntaxKind.LastAssignment) { bind(node.left, node.right); if (node.operatorToken.kind !== ts.SyntaxKind.EqualsToken) { const symbol = checker.getSymbolAtLocation(node.left); if (symbol) uncertain.add(symbol) } }; ts.forEachChild(node, collect) }
      collect(ast)
      const constant = (node: ts.Expression, depth = 0): (string | undefined)[] => { if (depth > 8) return [undefined]; if (ts.isStringLiteralLike(node)) return [node.text]; if (ts.isParenthesizedExpression(node) || ts.isAsExpression(node) || ts.isNonNullExpression(node)) return constant(node.expression, depth + 1); if (ts.isIdentifier(node)) { const symbol = checker.getSymbolAtLocation(node), values = symbol && bindings.get(symbol), candidates = values ? values.flatMap(value => constant(value, depth + 1)) : [undefined]; return symbol && uncertain.has(symbol) ? [...candidates, undefined] : candidates }; if (ts.isConditionalExpression(node)) return [...constant(node.whenTrue, depth + 1), ...constant(node.whenFalse, depth + 1)]; if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) { const left = constant(node.left, depth + 1), right = constant(node.right, depth + 1); return left.length * right.length > 64 ? [undefined] : left.flatMap(a => right.map(b => a !== undefined && b !== undefined ? a + b : undefined)) }; return [undefined] }
      const inspect = (expression: ts.Expression) => forEach(constant(expression), specifier => { if (specifier === undefined) { missing.push(undefined); return }; const targets = resolveSpecifier(path, specifier); if (targets.length) targets.forEach(target => edges.add(target)); else missing.push(specifier) })
      const forEach = <T>(values: readonly T[], action: (value: T) => void) => values.forEach(action)
      const visit = (node: ts.Node): void => { if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier) inspect(node.moduleSpecifier as ts.Expression); if (ts.isImportEqualsDeclaration(node) && ts.isExternalModuleReference(node.moduleReference) && node.moduleReference.expression) inspect(node.moduleReference.expression); if (ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword || (ts.isIdentifier(node.expression) && node.expression.text === "require") || (ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === "require")) && node.arguments[0]) inspect(node.arguments[0]); ts.forEachChild(node, visit) }
      visit(ast)
    }
    if (path.endsWith("/package.json")) try {
      const manifest = JSON.parse(source) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string>; main?: unknown; module?: unknown; exports?: unknown }
      const dependencies = Object.keys({ ...manifest.dependencies, ...manifest.devDependencies })
      manifestDependencies.set(path, dependencies)
      for (const dependency of dependencies) {
        // A package declaration is metadata, not authorization to traverse a
        // package barrel. Its exact value is retained above for policy checks.
        if (/^@cowards\/(?:spec|engine|replay|runtime-js|strategy-lab)$/u.test(dependency)) continue
        const targets = resolveSpecifier(path, dependency)
        if (targets.length) targets.forEach(target => edges.add(target)); else missing.push(dependency)
      }
      for (const entry of [...(typeof manifest.main === "string" ? [manifest.main] : []), ...(typeof manifest.module === "string" ? [manifest.module] : []), ...strings(manifest.exports)]) { const targets = resolveSpecifier(path, `./${entry.replace(/^\.\//u, "")}`); if (targets.length) targets.forEach(target => edges.add(target)); else missing.push(entry) }
    } catch { missing.push(undefined) }
    graph.set(path, edges); if (missing.length) unresolved.set(path, missing)
  }
  return { files, graph, unresolved, manifestDependencies }
}
export interface LabBoundaryViolation { code: string; file: string }
/** Offline source graph monitor, not a sandbox or a claim about arbitrary runtime-generated code. */
export const checkLabBoundaries = (options: { files?: Readonly<Record<string, string>> } = {}) => {
  const files = options.files ?? loadFiles()
  const sharedGraph = collectLabBoundaryGraph({ files })
  const privateDirectories = new Set(["packages/strategy-lab", ...Object.keys(files).filter(isOracle).map(p => p.split("/").slice(0, 2).join("/"))])
  const imageExclusions = (files[".dockerignore"] ?? "").split(/\r?\n/u).map(line => line.trim().replace(/\/$/u, ""))
  // Repository policy requires literal directory exclusions. Globs are not
  // interpreted as unsafe Docker syntax; they simply do not prove this policy.
  // A negation can re-include a private subtree: refuse ambiguous ignore policy.
  const excludesPrivateImages = !imageExclusions.some(line => line.startsWith("!")) && [...privateDirectories].every(directory => imageExclusions.includes(directory))
  const violations: LabBoundaryViolation[] = []
  const add = (code: string, file: string) => { if (!violations.some((v) => v.code === code && v.file === file)) violations.push({ code, file }) }
  let graph = new Map<string, Set<string>>()
  for (const [path, source] of Object.entries(files)) {
    if (isTest(path)) continue
    const deployment = /(?:^|\/)(?:Dockerfile[^/]*|[^/]*docker[^/]*|compose[^/]*|deploy[^/]*)(?:\/|$)/iu.test(path)
    const generatedOrPublic = /(?:^|\/)(?:artifacts|generated|public)\//u.test(path)
    if ((production(path) || deployment || generatedOrPublic) && path !== ".dockerignore" && !sourceExtension.test(path) && labText.test(source)) add("PRODUCTION_ARTIFACT_EXPOSURE", path)
    if (generatedOrPublic && !sourceExtension.test(path) && /"(?:strategyMemory|soldierMemory|objective|privateTrace|hostPath)"\s*:/u.test(source) && /\/public\//u.test(path)) add("PRIVATE_PUBLIC_PAYLOAD", path)
    if (/dockerfile/iu.test(path) && imageCopyUnproven(source, excludesPrivateImages)) add("IMAGE_INCLUDES_LAB", path)
    if (path === "packages/strategy-lab/package.json") {
      const manifest = JSON.parse(source) as { private?: boolean; scripts?: Record<string, string>; dependencies?: Record<string, string> }
      if (manifest.private !== true || manifest.scripts?.build !== undefined) add("LAB_PRODUCTION_BUILD", path)
      for (const dependency of Object.keys(manifest.dependencies ?? {})) if (!/^@cowards\/(?:spec|engine|replay|runtime-js)$/u.test(dependency)) add("CORE_DEPENDENCY_DENIED", path)
    }
  }
  for (const [path, unresolved] of sharedGraph.unresolved) for (const specifier of unresolved) {
    const staticBuildTool = (path === "packages/strategy-lab/src/planner/emit.ts" || path === "packages/strategy-lab/src/factory/fingerprint.ts" || path === "packages/strategy-lab/src/factory/numeric-calibration.ts") && specifier === "typescript"
    if (specifier === undefined) { if (isLab(path) || labText.test(files[path] ?? "")) add("UNRESOLVED_LAB_EDGE", path); continue }
    if (!isLab(path) && labText.test(specifier)) add("UNRESOLVED_LAB_EDGE", path)
    if (isLab(path) && !allowedNode.has(specifier) && !staticBuildTool) add("CORE_DEPENDENCY_DENIED", path)
  }
  for (const [path, edges] of sharedGraph.graph) if (isLab(path)) for (const target of edges) if (!isLab(target) && !allowedCore.test(target)) add("CORE_DEPENDENCY_DENIED", path)
  // The policy-specific pass above preserves historical violation codes; all
  // reachability decisions consume the single shared lexical resolver.
  graph = new Map([...sharedGraph.graph].map(([path, edges]) => [path, new Set(edges)]))
  for (const path of graph.keys()) {
    if (!production(path) && !isLab(path)) continue
    const visited = new Set<string>()
    const visit = (current: string) => {
      if (visited.has(current)) return
      visited.add(current)
      if (production(path) && isPrivateStrategy(current)) add("PRODUCTION_REACHES_LAB", path)
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
