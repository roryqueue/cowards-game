import { createHash } from "node:crypto"
import { existsSync, readFileSync, readdirSync, realpathSync } from "node:fs"
import { builtinModules, createRequire } from "node:module"
import { dirname, join, relative, resolve } from "node:path"
import ts from "typescript"

/** Local static executable closure, plus exact installed dependency bytes.
 * Report/manifest artifacts are never dependencies or inputs to this root. */
export const plannerExecutableClosure = (repository: string, entries: readonly string[], readSource = (path: string) => readFileSync(join(repository, path), "utf8")) => {
  const roots = new Map<string, string>(), visited = new Set<string>(), external = new Set<string>()
  const hash = (bytes: string | Buffer) => createHash("sha256").update(bytes).digest("hex")
  const builtins = new Set(builtinModules.map(name => name.replace(/^node:/, "")))
  const addExternal = (entry: string) => {
    let dir = dirname(realpathSync(entry))
    while (!existsSync(join(dir, "package.json"))) { const next = dirname(dir); if (next === dir) throw new TypeError("LAB_CLOSURE_PACKAGE"); dir = next }
    if (external.has(dir)) return
    external.add(dir)
    const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf8")) as { name: string; version: string; dependencies?: Record<string,string> }
    const walk = (folder: string) => {
      for (const item of readdirSync(folder, { withFileTypes: true })) {
        if (item.name === "node_modules" || item.name === ".git") continue
        const path = join(folder, item.name)
        if (item.isDirectory()) walk(path)
        else if (item.isFile() && /\.(?:[cm]?js|json|wasm|node)$/.test(item.name)) roots.set(`dependency:${pkg.name}@${pkg.version}/${relative(dir, path)}`, hash(readFileSync(path)))
        else if (item.isSymbolicLink()) throw new TypeError("LAB_CLOSURE_PACKAGE_SYMLINK")
      }
    }
    walk(dir)
    for (const name of Object.keys(pkg.dependencies ?? {})) addExternal(createRequire(join(dir,"package.json")).resolve(name))
  }
  const localTarget = (from: string, specifier: string) => {
    const base = specifier.startsWith("@cowards/") ? join(repository, "packages", specifier.slice(9), "src/index.ts") : resolve(dirname(join(repository,from)), specifier)
    const candidates = [base.replace(/\.js$/, ".ts"), base, `${base}.ts`, join(base,"index.ts")]
    const target = candidates.find(path => existsSync(path))
    if (!target || !target.startsWith(resolve(repository)+"/")) throw new TypeError("LAB_CLOSURE_UNRESOLVED")
    return relative(repository,target)
  }
  const visit = (path: string) => {
    if (visited.has(path)) return
    visited.add(path)
    if (path.startsWith(".planning/") || /\.test\./.test(path)) throw new TypeError("LAB_CLOSURE_NON_EXECUTABLE")
    const source = readSource(path); roots.set(path,hash(source))
    const ast = ts.createSourceFile(path,source,ts.ScriptTarget.Latest,true)
    const edge = (node: ts.Node) => {
      if (!ts.isStringLiteralLike(node)) throw new TypeError("LAB_CLOSURE_DYNAMIC_IMPORT")
      const name = node.text
      if (builtins.has(name.replace(/^node:/,""))) return
      if (name.startsWith(".") || name.startsWith("@cowards/")) visit(localTarget(path,name))
      else addExternal(createRequire(join(repository,path)).resolve(name))
    }
    const scan = (node: ts.Node) => {
      if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier) edge(node.moduleSpecifier)
      if (ts.isImportEqualsDeclaration(node) && ts.isExternalModuleReference(node.moduleReference) && node.moduleReference.expression) edge(node.moduleReference.expression)
      if (ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword || (ts.isIdentifier(node.expression) && node.expression.text === "require"))) { if (!node.arguments[0]) throw new TypeError("LAB_CLOSURE_DYNAMIC_IMPORT"); edge(node.arguments[0]) }
      ts.forEachChild(node,scan)
    }
    scan(ast)
  }
  for (const entry of entries) visit(entry)
  const files = [...roots].sort(([a],[b]) => a < b ? -1 : a > b ? 1 : 0).map(([path,root]) => ({ path,root }))
  return { root: `sha256:${hash(JSON.stringify(files))}` as const, files }
}
