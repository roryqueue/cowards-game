import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import * as ts from "typescript"
import {
  deriveFactoryOraclePacketRoot,
  FactoryOraclePacketSchema,
  type FactoryOraclePacket,
} from "../../strategy-lab/src/factory/index.js"
import { LAB_ADMITTED_ROOTS, LAB_VERSIONS, labRoot, type LabRoot } from "../../strategy-lab/src/contracts.js"

const SOURCE_BYTES = new TextEncoder()
const ROOT = /^sha256:[0-9a-f]{64}$/u
const NAME = /^[a-z][a-z0-9-]{0,95}$/u
const sourceRoot = (source: string): LabRoot => `sha256:${createHash("sha256").update(source, "utf8").digest("hex")}` as LabRoot
const fail = (code: string): never => { throw new TypeError(`TACTICAL_${code}`) }

export interface TacticalFactoryRequest {
  split: "development" | "validation" | "probe"
  doctrineFamily: string
  provider: {
    providerId: string
    /** Local deterministic optimizer provenance, not a claim of model participation. */
    modelId: string
    modelVersion: string
    settingsRoot: LabRoot
    promptRoot: LabRoot
    contextRoot: LabRoot
  }
  build: { buildRoot: LabRoot; toolchainRoot: LabRoot }
  lineage: { predecessorRoot: LabRoot; correctionRoot: LabRoot | null; retryParentRoot: LabRoot | null }
}

const TACTICAL_SOURCE_MODULES = ["scoring.ts", "search.ts", "selector.ts"] as const
type TacticalSourceModuleName = typeof TACTICAL_SOURCE_MODULES[number]
export interface TacticalSourceModule { readonly name: TacticalSourceModuleName; readonly source: string }

const validateEmittedSource = (source: string): string => {
  const sourcePath = "tactical-source.js"
  const ast = ts.createSourceFile(sourcePath, source, ts.ScriptTarget.ES2022, true, ts.ScriptKind.JS)
  const denied = new Set(["eval", "Function", "globalThis", "process", "require", "Date", "fetch", "WebAssembly", "constructor", "__proto__", "prototype", "random"])
  const options: ts.CompilerOptions = { allowJs: true, checkJs: true, noLib: true, noResolve: true, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext }
  const host = ts.createCompilerHost(options)
  host.getSourceFile = (name) => name === sourcePath ? ast : undefined
  host.fileExists = (name) => name === sourcePath
  host.readFile = (name) => name === sourcePath ? source : undefined
  const program = ts.createProgram([sourcePath], options, host)
  const checker = program.getTypeChecker()
  const globals = new Set(["Math", "Number", "String", "JSON", "Array", "Object", "Set", "TypeError", "undefined", "null"])
  const visit = (node: ts.Node) => {
    if (ts.isImportDeclaration(node) || ts.isImportEqualsDeclaration(node) || ts.isExportDeclaration(node) || ts.isAwaitExpression(node) || node.kind === ts.SyntaxKind.ImportKeyword || node.kind === ts.SyntaxKind.AsyncKeyword || node.kind === ts.SyntaxKind.ThisKeyword) fail("SOURCE_CAPABILITY")
    if (ts.isIdentifier(node)) {
      if (denied.has(node.text)) fail("SOURCE_CAPABILITY")
      const parent = node.parent
      const propertyName = (ts.isPropertyAccessExpression(parent) && parent.name === node) || ((ts.isPropertyAssignment(parent) || ts.isMethodDeclaration(parent)) && parent.name === node)
      if (!propertyName && !globals.has(node.text) && checker.getSymbolAtLocation(node) === undefined) fail("SOURCE_FREE_IDENTIFIER")
    }
    if (ts.isElementAccessExpression(node) && ts.isStringLiteral(node.argumentExpression) && denied.has(node.argumentExpression.text)) fail("SOURCE_CAPABILITY")
    ts.forEachChild(node, visit)
  }
  if (program.getSyntacticDiagnostics().length > 0) fail("SOURCE_SYNTAX")
  visit(ast)
  const output = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, removeComments: true },
    reportDiagnostics: true,
  })
  if (output.diagnostics?.some((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error)) fail("SOURCE_TYPESCRIPT")
  return output.outputText.replace(/\r\n?/gu, "\n")
}

/** Static closure checking only; emitted source remains data and is never imported or executed here. */
export const assertTacticalSourceClosure = (source: string): void => {
  if (typeof source !== "string" || source.length === 0 || source.length > 65536) fail("SOURCE_SIZE")
  const compiled = validateEmittedSource(source)
  if (!compiled.includes("export default") || /\b(?:import|eval|Function|require|process|fetch|Date|Math\.random)\b/u.test(compiled)) fail("SOURCE_CLOSURE")
}

export const loadTacticalSourceModules = (): readonly TacticalSourceModule[] => TACTICAL_SOURCE_MODULES.map((name) => ({ name, source: readFileSync(new URL(name, import.meta.url), "utf8") }))

const permittedImports: Readonly<Record<TacticalSourceModuleName, readonly string[]>> = {
  "scoring.ts": ["@cowards/spec"],
  "search.ts": ["@cowards/spec", "./scoring.js"],
  "selector.ts": ["@cowards/spec", "./scoring.js", "./search.js"],
}

const moduleText = (module: TacticalSourceModule): string => {
  const ast = ts.createSourceFile(module.name, module.source, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS)
  return ast.statements.map((statement) => {
    if (ts.isImportDeclaration(statement)) {
      const specifier = ts.isStringLiteral(statement.moduleSpecifier) ? statement.moduleSpecifier.text : ""
      if (!permittedImports[module.name].includes(specifier) || (specifier === "@cowards/spec" && !statement.importClause?.isTypeOnly)) fail("MODULE_IMPORT")
      return ""
    }
    if (ts.isExportDeclaration(statement) || ts.isExportAssignment(statement)) fail("MODULE_EXPORT")
    return statement.getText(ast).replace(/^export\s+/u, "")
  }).join("\n")
}

/** Static bundling of this leaf's exact authored controller modules; no generated code is run. */
export const compileTacticalSourceModules = (modules: readonly TacticalSourceModule[]): string => {
  if (modules.length !== TACTICAL_SOURCE_MODULES.length || modules.some((module, index) => module.name !== TACTICAL_SOURCE_MODULES[index])) fail("MODULE_MANIFEST")
  const authored = `${modules.map(moduleText).join("\n")}\nexport default { selectActivations(input) { return selectTacticalActivations(input); }, soldierBrain(input) { return runTacticalSoldierBrain(input); } };\n`
  const output = ts.transpileModule(authored, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, removeComments: true },
    reportDiagnostics: true,
  })
  if (output.diagnostics?.some((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error)) fail("SOURCE_TYPESCRIPT")
  const source = output.outputText.replace(/\r\n?/gu, "\n")
  assertTacticalSourceClosure(source)
  return source
}

export interface TacticalSourceManifest {
  readonly schemaVersion: "tactical-source-manifest-v1"
  readonly sourceRoot: LabRoot
  readonly sourceBytes: number
  readonly moduleRoots: readonly Readonly<{ name: TacticalSourceModuleName; root: LabRoot }>[]
  readonly root: LabRoot
}

/** Binds exact authored controller bytes to the compiled candidate source without executing either. */
export const tacticalSourceManifest = (modules: readonly TacticalSourceModule[] = loadTacticalSourceModules()): TacticalSourceManifest => {
  const source = compileTacticalSourceModules(modules)
  const moduleRoots = modules.map((module) => ({ name: module.name, root: sourceRoot(module.source) }))
  const value = { schemaVersion: "tactical-source-manifest-v1" as const, sourceRoot: sourceRoot(source), sourceBytes: SOURCE_BYTES.encode(source).byteLength, moduleRoots }
  return Object.freeze({ ...value, root: labRoot("tactical-source-manifest-v1", value) })
}

/** Emits the exact bundled tactical controller as closed hostile data. */
export const emitTacticalSource = (): string => compileTacticalSourceModules(loadTacticalSourceModules())

const validRoot = (value: unknown): value is LabRoot => typeof value === "string" && ROOT.test(value)
const requestIsValid = (request: TacticalFactoryRequest): void => {
  if (!NAME.test(request.doctrineFamily) || !["development", "validation", "probe"].includes(request.split)) fail("REQUEST")
  const provider = request.provider
  if (!NAME.test(provider.providerId) || typeof provider.modelId !== "string" || provider.modelId.length === 0 || provider.modelId.length > 128 || typeof provider.modelVersion !== "string" || provider.modelVersion.length === 0 || provider.modelVersion.length > 128 || ![provider.settingsRoot, provider.promptRoot, provider.contextRoot].every(validRoot)) fail("PROVENANCE")
  if (![request.build.buildRoot, request.build.toolchainRoot, request.lineage.predecessorRoot].every(validRoot) || ![request.lineage.correctionRoot, request.lineage.retryParentRoot].every((value) => value === null || validRoot(value))) fail("REQUEST")
}

/** Produces a strict root-bound packet as data for later factory admission. */
export const emitTacticalFactoryPacket = (request: TacticalFactoryRequest): FactoryOraclePacket => {
  requestIsValid(request)
  const source = emitTacticalSource()
  const identity = sourceRoot(source)
  const packet = {
    schemaVersion: "factory-oracle-packet-v1" as const,
    privacy: "private_offline" as const,
    root: identity,
    oracleFamily: "tactical-oracle",
    doctrineFamily: request.doctrineFamily,
    source: { root: identity, sha256: identity, byteLength: SOURCE_BYTES.encode(source).byteLength, encoding: "utf8" as const },
    provider: request.provider,
    inheritedAuthority: {
      admittedRoot: LAB_ADMITTED_ROOTS.currentStartRoot,
      sourceClosureRoot: LAB_ADMITTED_ROOTS.sourceClosureRoot,
      compatibilityTupleRoot: LAB_ADMITTED_ROOTS.tupleRoot,
      runtimeProfileRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot,
      runtimeAbi: LAB_VERSIONS.runtimeAbi,
      labSchema: LAB_VERSIONS.schema,
    },
    build: { ...request.build, compatibilityTupleRoot: LAB_ADMITTED_ROOTS.tupleRoot },
    versions: { factory: "factory-v1" as const, algorithm: "tactical-optimizer-v1", schema: "factory-schema-v1" as const },
    nativeLane: { language: "typescript" as const, providerId: request.provider.providerId, runtimeAbi: LAB_VERSIONS.runtimeAbi, runtimeProfileRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot, translation: "none" as const },
    lineage: request.lineage,
    split: request.split,
  }
  return FactoryOraclePacketSchema.parse({ ...packet, root: deriveFactoryOraclePacketRoot(packet) })
}
