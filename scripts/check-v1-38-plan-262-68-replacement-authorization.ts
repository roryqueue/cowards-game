#!/usr/bin/env -S pnpm exec tsx
import { createHash } from "node:crypto"
import { execFileSync } from "node:child_process"
import { lstatSync, readFileSync, realpathSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { types as utilTypes } from "node:util"
import ts from "typescript"
import { createV138Plan26268ReplacementAuthorization, PLAN_262_67_CHECKPOINT_ROOT } from "./lib/v1-38-plan-262-68-replacement-authorization.js"
import { renderV138Plan26267ReplacementContract } from "./render-v1-38-plan-262-67-replacement-contract.js"

const forbidden = [
  ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-62-PLAN.md",
  ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-62-SUMMARY.md",
  ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-62-REVIEW.md",
  ".planning/artifacts/v1.38-plan-262-62-source-completeness-review-v3.json",
  ".planning/artifacts/v1.38-plan-262-56-authorization-v9.json",
  ".planning/artifacts/v1.38-successor-source-seal-v9.json",
  ".planning/artifacts/v1.38-plan-262-57-route-start-v1.json",
  ".planning/artifacts/.v1.38-plan-262-57-route-reservation-v1",
  ".planning/artifacts/.v1.38-plan-262-57-route-reservation-v1/claim.json",
  ".planning/artifacts/v1.38-current-matrix-execution-context-v11.json",
  ".planning/artifacts/v1.38-current-matrix-headroom-preflight-v11.json",
  ".planning/artifacts/v1.38-current-matrix-calibration-v11.json",
  ".planning/artifacts/v1.38-current-matrix-reproduction-v12.json",
  ".planning/artifacts/v1.38-plan-262-57-calibration-consumption-v1.json",
  ".planning/artifacts/v1.38-plan-262-57-preflight-consumption-v1.json",
  ".planning/artifacts/v1.38-plan-262-57-reproduction-consumption-v1.json",
  ".planning/artifacts/v1.38-plan-262-57-pre-start-obstruction-v1.json",
  ".planning/artifacts/v1.38-plan-262-57-terminal-v1.json",
] as const
const historical = [
  ["scripts/render-v1-38-plan-262-67-replacement-contract.ts", "b0fbf478e47bda9adf0d0f980b5d6e7f9ef31d2205fa14f057ed164b9eebd3ef"],
  [".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-67-CHECKPOINT.md", "38482b69f4e21f01963897922e4702ca31468cb58379ac75476ff66c03a06185"],
  [".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-66-REVIEW.md", "24b0e22ba8dc82e059a0418930d6ccfdf22ca8fe7b5175913899cb72c911e1dd"],
  [".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/archived/262-62-HISTORICAL.md", "438e139b6710c482b668514091968ee3a31ea575f2d0d002ec0c11473fdbc07a"],
  ["scripts/check-v1-38-plan-262-65-r4-source.ts", "f39cfa18c6782b5e0385480ffe5016934830de18572e5b0f711006f8165f1ca9"],
  [".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-65-CODE-REVIEW.md", "73d47ff23cf2b5a2e3c268180621e0c83aedba8e4cb2dbc3c3cc8ca0d346ce16"],
] as const
const present = (root: string, repoPath: string) => { try { lstatSync(path.resolve(root, repoPath)); return true } catch (error: unknown) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return false; throw error } }
const assertExactData = (actual: unknown, expected: unknown): void => {
  if (typeof expected !== "object" || expected === null) {
    if (!Object.is(actual, expected)) throw new TypeError("V138_262_68_REPRESENTATION_INVALID")
    return
  }
  if (typeof actual !== "object" || actual === null || utilTypes.isProxy(actual) ||
    Object.getPrototypeOf(actual) !== Object.prototype || !Object.isFrozen(actual))
    throw new TypeError("V138_262_68_REPRESENTATION_INVALID")
  const actualKeys = Reflect.ownKeys(actual); const expectedKeys = Reflect.ownKeys(expected)
  if (actualKeys.some(key => typeof key !== "string") || JSON.stringify(actualKeys) !== JSON.stringify(expectedKeys))
    throw new TypeError("V138_262_68_REPRESENTATION_INVALID")
  const descriptors = Object.getOwnPropertyDescriptors(actual)
  for (const key of expectedKeys as string[]) {
    const descriptor = descriptors[key]
    if (!descriptor || !("value" in descriptor) || descriptor.writable || descriptor.configurable || !descriptor.enumerable)
      throw new TypeError("V138_262_68_REPRESENTATION_INVALID")
    assertExactData(descriptor.value, (expected as Record<string, unknown>)[key])
  }
}

const moduleExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".mts", ".cts"])
const targetModule = "scripts/lib/v1-38-plan-262-68-replacement-authorization.ts"
const permittedModules = new Set([
  targetModule,
  "scripts/check-v1-38-plan-262-68-replacement-authorization.ts",
  "scripts/check-v1-38-plan-262-68-replacement-authorization.test.ts",
])
const resolveLocalModule = (importer: string, specifier: string): string | undefined => {
  if (!specifier.startsWith(".")) return undefined
  const raw = path.posix.normalize(path.posix.join(path.posix.dirname(importer), specifier))
  const withoutRuntimeExtension = raw.replace(/\.(?:[cm]?js)$/u, "")
  for (const candidate of [raw, withoutRuntimeExtension, `${raw}.ts`, `${raw}.tsx`, `${withoutRuntimeExtension}.ts`, `${withoutRuntimeExtension}.tsx`])
    if (candidate === targetModule) return candidate
  return undefined
}
const evaluateStaticString = (expression: ts.Expression, bindings: ReadonlyMap<string, string>): string | undefined => {
  if (ts.isStringLiteralLike(expression) || ts.isNoSubstitutionTemplateLiteral(expression)) return expression.text
  if (ts.isIdentifier(expression)) return bindings.get(expression.text)
  if (ts.isParenthesizedExpression(expression)) return evaluateStaticString(expression.expression, bindings)
  if (ts.isBinaryExpression(expression) && expression.operatorToken.kind === ts.SyntaxKind.PlusToken) {
    const left = evaluateStaticString(expression.left, bindings); const right = evaluateStaticString(expression.right, bindings)
    return left === undefined || right === undefined ? undefined : left + right
  }
  return undefined
}
const assertImportBoundary = (root: string): void => {
  const configPath = ts.findConfigFile(root, ts.sys.fileExists)
  const compilerOptions = configPath
    ? ts.parseJsonConfigFileContent(ts.readConfigFile(configPath, ts.sys.readFile).config, ts.sys, path.dirname(configPath)).options
    : { moduleResolution: ts.ModuleResolutionKind.NodeNext, module: ts.ModuleKind.NodeNext, allowJs: true }
  const tracked = execFileSync("git", ["ls-files", "-z"], { cwd: root, encoding: "utf8" })
    .split("\0").filter(repoPath => moduleExtensions.has(path.extname(repoPath)))
  for (const repoPath of tracked) {
    const text = readFileSync(path.resolve(root, repoPath), "utf8")
    if (text.includes("v1-38-plan-262-68") && text.includes("replacement-authorization") && !permittedModules.has(repoPath))
      throw new TypeError("V138_262_68_IMPORT_BOUNDARY_INVALID")
    const source = ts.createSourceFile(repoPath, text, ts.ScriptTarget.Latest, true,
      repoPath.endsWith("x") ? ts.ScriptKind.TSX : repoPath.endsWith(".js") || repoPath.endsWith(".mjs") || repoPath.endsWith(".cjs") ? ts.ScriptKind.JS : ts.ScriptKind.TS)
    const bindings = new Map<string, string>()
    const collectBindings = (node: ts.Node): void => {
      if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
        const value = evaluateStaticString(node.initializer, bindings)
        if (value !== undefined) bindings.set(node.name.text, value)
      }
      ts.forEachChild(node, collectBindings)
    }
    collectBindings(source)
    const visit = (node: ts.Node): void => {
      let specifier: string | undefined
      if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteralLike(node.moduleSpecifier))
        specifier = node.moduleSpecifier.text
      else if (ts.isImportEqualsDeclaration(node) && ts.isExternalModuleReference(node.moduleReference) && node.moduleReference.expression && ts.isStringLiteralLike(node.moduleReference.expression))
        specifier = node.moduleReference.expression.text
      else if (ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword || ts.isIdentifier(node.expression) && node.expression.text === "require") && node.arguments.length === 1)
        specifier = evaluateStaticString(node.arguments[0]!, bindings)
      if (specifier && !permittedModules.has(repoPath)) {
        const resolved = ts.resolveModuleName(specifier, path.resolve(root, repoPath), compilerOptions, ts.sys).resolvedModule?.resolvedFileName
        const resolvedRepoPath = resolved && path.relative(root, resolved).split(path.sep).join("/")
        if (resolveLocalModule(repoPath, specifier) === targetModule || resolvedRepoPath === targetModule)
          throw new TypeError("V138_262_68_IMPORT_BOUNDARY_INVALID")
      }
      ts.forEachChild(node, visit)
    }
    visit(source)
  }
}

export const checkV138Plan26268ReplacementAuthorization = (root: string, candidate = createV138Plan26268ReplacementAuthorization()) => {
  const repositoryRoot = execFileSync("git", ["rev-parse", "--show-toplevel"], { cwd: root, encoding: "utf8" }).trim()
  if (realpathSync(repositoryRoot) !== realpathSync(root)) throw new TypeError("V138_262_68_REPOSITORY_ROOT_INVALID")
  for (const [repoPath, expected] of historical) {
    const actual = createHash("sha256").update(readFileSync(path.resolve(root, repoPath))).digest("hex")
    if (actual !== expected) throw new TypeError("V138_262_68_HISTORICAL_INPUT_INVALID")
  }
  assertExactData(candidate, createV138Plan26268ReplacementAuthorization())
  const renderedRoot = `sha256:${createHash("sha256").update(JSON.stringify(renderV138Plan26267ReplacementContract())).digest("hex")}`
  if (candidate.checkpointRoot !== PLAN_262_67_CHECKPOINT_ROOT || renderedRoot !== PLAN_262_67_CHECKPOINT_ROOT)
    throw new TypeError("V138_262_68_CHECKPOINT_ROOT_INVALID")
  if (forbidden.some(repoPath => present(root, repoPath))) throw new TypeError("V138_262_68_FORBIDDEN_DESTINATION_PRESENT")
  assertImportBoundary(root)
  return Object.freeze({ status: "passed", authority: "denied" as const, checkpointRoot: candidate.checkpointRoot })
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.slice(2).join(" ") !== "--check") throw new TypeError("V138_262_68_ARGUMENTS_INVALID")
  process.stdout.write(`${JSON.stringify(checkV138Plan26268ReplacementAuthorization(root))}\n`)
}
