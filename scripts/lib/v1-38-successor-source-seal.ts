import { Buffer } from "node:buffer"
import { createHash, randomBytes } from "node:crypto"
import {
  closeSync,
  constants,
  fstatSync,
  fsyncSync,
  lstatSync,
  linkSync,
  openSync,
  readFileSync,
  readSync,
  realpathSync,
  unlinkSync,
  writeFileSync,
} from "node:fs"
import { execFileSync } from "node:child_process"
import { builtinModules } from "node:module"
import { arch, platform, release } from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import ts from "typescript"
import {
  encodeCanonicalJson,
  hashCanonicalIdentity,
  type JsonValue,
} from "@cowards/spec"
import {
  MEMORY_PRESSURE_Q_REQUEST,
  V138_DARWIN_HEADROOM_METRIC_ID,
  V138_DARWIN_HEADROOM_PARSER_ID,
  V138_DARWIN_HEADROOM_PROVIDER_ID,
  V138_DARWIN_HEADROOM_THRESHOLD_BASIS_POINTS,
} from "./v1-38-darwin-headroom.js"
import {
  checkV138ReviewV3ClaimsAgainstObservations,
  disposeV138DetachedOpenatHelper,
  readV138DetachedFileOpenat,
  V138_PLAN_262_60_CORRECTION_RUN,
  V138_REVIEW_V3_ROUTE_MANIFEST,
  validateV138ReviewV3Document,
} from "./v1-38-source-completeness-review-v3.js"

type Sha256 = `sha256:${string}`

const sha256 = (value: string | Uint8Array): Sha256 =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`
const canonicalBytes = (value: unknown): Uint8Array => {
  const encoded = encodeCanonicalJson(value as JsonValue, {
    context: "canonical-manifest",
  })
  if (encoded.ok === false) fail("V138_CANONICAL_JSON_INVALID")
  return encoded.bytes
}
const canonical = (value: unknown): string =>
  `${Buffer.from(canonicalBytes(value)).toString("utf8")}\n`
type IdentityDomain =
  | "artifactManifest"
  | "containmentPolicy"
  | "evidenceBundle"
  | "budgetProfile"
  | "canonicalJsonProfile"
const identityRoot = (
  domain: IdentityDomain,
  schemaVersion: string,
  value: unknown,
): Sha256 =>
  `sha256:${hashCanonicalIdentity(domain, [
    Buffer.from(schemaVersion, "utf8"),
    canonicalBytes(value),
  ])}`
const fail = (code: string): never => {
  throw new TypeError(code)
}
const normalize = (value: string): string => value.split(path.sep).join("/")
const sorted = <T extends string>(values: Iterable<T>): T[] =>
  [...new Set(values)].sort((left, right) =>
    Buffer.from(left).compare(Buffer.from(right)),
  )

const gitBuffer = (
  repoRoot: string,
  args: readonly string[],
  maxBuffer = 64 * 1024 * 1024,
): Buffer =>
  execFileSync("git", [...args], {
    cwd: repoRoot,
    encoding: "buffer",
    maxBuffer,
    env: { ...process.env, LC_ALL: "C", LANG: "C" },
  })
const gitText = (repoRoot: string, args: readonly string[]): string =>
  gitBuffer(repoRoot, args).toString("utf8").trim()
const gitStatus = (repoRoot: string, args: readonly string[]): number => {
  try { execFileSync("git", [...args], { cwd: repoRoot, stdio: "ignore" }); return 0 }
  catch (error) { return (error as { status?: number }).status ?? 1 }
}
const fullCommit = (repoRoot: string, value: string): string => {
  if (!/^[0-9a-f]{40}$/u.test(value)) fail("V138_SOURCE_COMMIT_INVALID")
  if (gitText(repoRoot, ["cat-file", "-t", value]) !== "commit") {
    fail("V138_SOURCE_COMMIT_INVALID")
  }
  const resolved = gitText(repoRoot, [
    "rev-parse",
    "--verify",
    `${value}^{commit}`,
  ])
  if (resolved !== value) fail("V138_SOURCE_COMMIT_INVALID")
  return resolved
}

export const V138_SUCCESSOR_AUTHORIZED_SOURCE_PATHS = Object.freeze([
  "scripts/evaluate-v1-38-foundation-contract.test.ts",
  "scripts/lib/v1-38-current-matrix-reproduction.ts",
  "scripts/lib/v1-38-darwin-headroom.ts",
  "scripts/lib/v1-38-successor-source-seal.ts",
] as const)

export interface V138SourceCustody {
  readonly sourceBase: string
  readonly sourceA: string
  readonly sourceATree: string
  readonly sourceAParents: readonly string[]
  readonly aggregateChangedPaths: readonly string[]
  readonly lineage: readonly Readonly<{
    commit: string
    tree: string
    parents: readonly string[]
    changedPaths: readonly string[]
  }>[]
  readonly sourceBlobs: readonly Readonly<{
    path: (typeof V138_SUCCESSOR_AUTHORIZED_SOURCE_PATHS)[number]
    blobOid: string
    byteLength: number
    sha256: Sha256
  }>[]
}

export const inspectSourceCustody = (input: {
  readonly repoRoot: string
  readonly sourceBase: string
  readonly sourceA: string
}): Readonly<V138SourceCustody> => {
  const sourceBase = fullCommit(input.repoRoot, input.sourceBase)
  const sourceA = fullCommit(input.repoRoot, input.sourceA)
  try {
    execFileSync("git", ["merge-base", "--is-ancestor", sourceBase, sourceA], {
      cwd: input.repoRoot,
      stdio: "ignore",
    })
  } catch {
    fail("V138_SOURCE_BASE_NOT_ANCESTOR")
  }
  const aggregateChangedPaths = sorted(
    gitText(input.repoRoot, [
      "diff",
      "--name-only",
      "--no-renames",
      sourceBase,
      sourceA,
      "--",
    ])
      .split("\n")
      .filter(Boolean)
      .map(normalize),
  )
  if (
    canonical(aggregateChangedPaths) !==
    canonical(V138_SUCCESSOR_AUTHORIZED_SOURCE_PATHS)
  ) {
    fail("V138_SOURCE_AGGREGATE_DELTA_INVALID")
  }
  const commitRecord = (commit: string) => {
    const fields = gitText(input.repoRoot, [
      "show",
      "-s",
      "--format=%H%n%T%n%P",
      commit,
    ]).split("\n")
    return Object.freeze({
      commit: fields[0]!,
      tree: fields[1]!,
      parents: Object.freeze(fields[2]!.split(" ").filter(Boolean)),
      changedPaths: Object.freeze(
        sorted(
          gitText(input.repoRoot, [
            "diff-tree",
            "--root",
            "--no-commit-id",
            "--name-only",
            "-r",
            "--no-renames",
            commit,
          ])
            .split("\n")
            .filter(Boolean)
            .map(normalize),
        ),
      ),
    })
  }
  const lineage = gitText(input.repoRoot, [
    "rev-list",
    "--reverse",
    "--topo-order",
    `${sourceBase}..${sourceA}`,
  ])
    .split("\n")
    .filter(Boolean)
    .map(commitRecord)
  const authorized = new Set<string>(V138_SUCCESSOR_AUTHORIZED_SOURCE_PATHS)
  for (const record of lineage) {
    if (
      record.changedPaths.length === 0 ||
      record.changedPaths.some((repoPath) => !authorized.has(repoPath))
    ) {
      fail("V138_SOURCE_LINEAGE_PATH_INVALID")
    }
  }
  const sourceBlobs = V138_SUCCESSOR_AUTHORIZED_SOURCE_PATHS.map((repoPath) => {
    const object = `${sourceA}:${repoPath}`
    if (gitText(input.repoRoot, ["cat-file", "-t", object]) !== "blob") {
      fail("V138_SOURCE_BLOB_INVALID")
    }
    const bytes = gitBuffer(input.repoRoot, ["cat-file", "blob", object])
    return Object.freeze({
      path: repoPath,
      blobOid: gitText(input.repoRoot, ["rev-parse", object]),
      byteLength: bytes.byteLength,
      sha256: sha256(bytes),
    })
  })
  const sourceARecord = commitRecord(sourceA)
  return Object.freeze({
    sourceBase,
    sourceA,
    sourceATree: sourceARecord.tree,
    sourceAParents: sourceARecord.parents,
    aggregateChangedPaths: Object.freeze(aggregateChangedPaths),
    lineage: Object.freeze(lineage),
    sourceBlobs: Object.freeze(sourceBlobs),
  })
}

export const checkV138SourceCheckoutAtA = (
  repoRoot: string,
  sourceAInput: string,
): true => {
  const sourceA = fullCommit(repoRoot, sourceAInput)
  try {
    execFileSync(
      "git",
      [
        "diff",
        "--quiet",
        sourceA,
        "--",
        ...V138_SUCCESSOR_AUTHORIZED_SOURCE_PATHS,
      ],
      { cwd: repoRoot, stdio: "ignore" },
    )
  } catch {
    fail("V138_SOURCE_CHECKOUT_DRIFT")
  }
  return true
}

export const V138_SELECTED_ROUTE_ROOTS = Object.freeze([
  "apps/runtime-service/src/execute-match.ts",
  "scripts/lib/v1-38-current-matrix-reproduction.ts",
] as const)

export interface V138SelectedRouteClosure {
  readonly algorithm: "typescript-static-source-closure-v1"
  readonly sourceA: string
  readonly roots: typeof V138_SELECTED_ROUTE_ROOTS
  readonly paths: readonly string[]
  readonly edges: readonly Readonly<{
    from: string
    specifier: string
    to: string
  }>[]
  readonly sourceBlobs: readonly Readonly<{
    path: string
    blobOid: string
    byteLength: number
    sha256: Sha256
  }>[]
  readonly resolverMetadata: readonly Readonly<{
    path: string
    blobOid: string
    byteLength: number
    sha256: Sha256
  }>[]
  readonly closureRoot: Sha256
}

type WorkspacePackage = {
  name: string
  root: string
  exports: Record<string, string>
}

const selectExportTarget = (value: unknown): string => {
  if (typeof value === "string") return value
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    fail("V138_SELECTED_ROUTE_EXPORT_CONDITION_AMBIGUOUS")
  }
  const record = value as Record<string, unknown>
  const selected = ["types", "import", "default"]
    .filter((key) => Object.hasOwn(record, key))
    .map((key) => selectExportTarget(record[key]))
  if (selected.length === 0 || new Set(selected).size !== 1) {
    fail("V138_SELECTED_ROUTE_EXPORT_CONDITION_AMBIGUOUS")
  }
  return selected[0]!
}

const readCommitFile = (
  repoRoot: string,
  sourceA: string,
  repoPath: string,
): Buffer => gitBuffer(repoRoot, ["cat-file", "blob", `${sourceA}:${repoPath}`])

const blobRecord = (repoRoot: string, sourceA: string, repoPath: string) => {
  const bytes = readCommitFile(repoRoot, sourceA, repoPath)
  return Object.freeze({
    path: repoPath,
    blobOid: gitText(repoRoot, ["rev-parse", `${sourceA}:${repoPath}`]),
    byteLength: bytes.byteLength,
    sha256: sha256(bytes),
  })
}

const collectSpecifiers = (repoPath: string, source: string): string[] => {
  const file = ts.createSourceFile(
    repoPath,
    source,
    ts.ScriptTarget.Latest,
    true,
    repoPath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  )
  const values: string[] = []
  const visit = (node: ts.Node): void => {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier !== undefined
    ) {
      if (!ts.isStringLiteral(node.moduleSpecifier)) {
        fail("V138_SELECTED_ROUTE_NONLITERAL_STATIC_EDGE")
      }
      values.push((node.moduleSpecifier as ts.StringLiteral).text)
    } else if (ts.isImportEqualsDeclaration(node)) {
      if (
        !ts.isExternalModuleReference(node.moduleReference) ||
        node.moduleReference.expression === undefined ||
        !ts.isStringLiteral(node.moduleReference.expression)
      ) {
        fail("V138_SELECTED_ROUTE_NONLITERAL_STATIC_EDGE")
      }
      values.push(
        (
          (node.moduleReference as ts.ExternalModuleReference)
            .expression as ts.StringLiteral
        ).text,
      )
    } else if (
      ts.isCallExpression(node) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) &&
          node.expression.text === "require"))
    ) {
      if (
        node.arguments.length !== 1 ||
        !ts.isStringLiteral(node.arguments[0]!)
      ) {
        fail("V138_SELECTED_ROUTE_NONLITERAL_DYNAMIC_EDGE")
      }
      values.push((node.arguments[0] as ts.StringLiteral).text)
    }
    ts.forEachChild(node, visit)
  }
  visit(file)
  return values
}

/**
 * Deterministic compiler-host seam used by mutation tests. It deliberately
 * reuses the production TypeScript parser and requires one exact resolver
 * selection for every parsed static edge; copied closure arrays cannot satisfy
 * this contract.
 */
export const deriveV138StaticSourceEdgesFromSnapshot = (
  repoPath: string,
  source: string,
  resolve: (from: string, specifier: string) => string | undefined,
): readonly Readonly<{ from: string; specifier: string; to: string }>[] =>
  Object.freeze(
    collectSpecifiers(repoPath, source).map((specifier) => {
      const target = resolve(repoPath, specifier)
      if (target === undefined) {
        fail("V138_SELECTED_ROUTE_EDGE_UNRESOLVED")
      }
      return Object.freeze({ from: repoPath, specifier, to: target })
    }),
  )

const candidatePaths = (base: string): string[] => {
  const extension = path.posix.extname(base)
  if (extension === ".js" || extension === ".mjs" || extension === ".cjs") {
    const stem = base.slice(0, -extension.length)
    return [`${stem}.ts`, `${stem}.tsx`]
  }
  if (extension !== "") return [base]
  return [
    `${base}.ts`,
    `${base}.tsx`,
    path.posix.join(base, "index.ts"),
    path.posix.join(base, "index.tsx"),
  ]
}

type YamlMap = Record<string, YamlMap | string>

const parseYamlMapping = (text: string): YamlMap => {
  const root: YamlMap = {}
  const stack: Array<{ indentation: number; value: YamlMap }> = [
    { indentation: -1, value: root },
  ]
  for (const rawLine of text.split("\n")) {
    if (rawLine.trim().length === 0 || rawLine.trimStart().startsWith("#")) {
      continue
    }
    const indentation = rawLine.length - rawLine.trimStart().length
    if (indentation % 2 !== 0) fail("V138_SELECTED_ROUTE_LOCKFILE_INVALID")
    const line = rawLine.trim()
    if (line.startsWith("- ")) continue
    let quoted = false
    let quote = ""
    let separator = -1
    for (let index = 0; index < line.length; index += 1) {
      const character = line[index]!
      if (
        (character === "'" || character === '"') &&
        line[index - 1] !== "\\"
      ) {
        if (!quoted) {
          quoted = true
          quote = character
        } else if (quote === character) {
          quoted = false
        }
      } else if (character === ":" && !quoted) {
        separator = index
        break
      }
    }
    if (separator < 1) fail("V138_SELECTED_ROUTE_LOCKFILE_INVALID")
    let key = line.slice(0, separator).trim()
    if (
      (key.startsWith("'") && key.endsWith("'")) ||
      (key.startsWith('"') && key.endsWith('"'))
    )
      key = key.slice(1, -1)
    if (key.length === 0) fail("V138_SELECTED_ROUTE_LOCKFILE_INVALID")
    while (stack.at(-1)!.indentation >= indentation) stack.pop()
    const parent = stack.at(-1)?.value
    if (parent === undefined || Object.hasOwn(parent, key)) {
      fail("V138_SELECTED_ROUTE_LOCKFILE_INVALID")
    }
    const scalar = line.slice(separator + 1).trim()
    if (scalar.length === 0) {
      const value: YamlMap = {}
      parent[key] = value
      stack.push({ indentation, value })
    } else {
      parent[key] = scalar
    }
  }
  return root
}

const packageNameFromLockKey = (key: string): string => {
  const normalized = key.replace(/^\//u, "")
  if (normalized.startsWith("@")) {
    const separator = normalized.indexOf("@", normalized.indexOf("/") + 1)
    if (separator <= 0) fail("V138_SELECTED_ROUTE_LOCKFILE_INVALID")
    return normalized.slice(0, separator)
  }
  const separator = normalized.indexOf("@")
  if (separator <= 0) fail("V138_SELECTED_ROUTE_LOCKFILE_INVALID")
  return normalized.slice(0, separator)
}

const selectedRouteClosureCache = new Map<
  string,
  Readonly<V138SelectedRouteClosure>
>()

export const deriveSelectedRouteClosureAtCommit = (
  repoRoot: string,
  sourceAInput: string,
): Readonly<V138SelectedRouteClosure> => {
  const sourceA = fullCommit(repoRoot, sourceAInput)
  const cacheKey = `${path.resolve(repoRoot)}\0${sourceA}`
  const cached = selectedRouteClosureCache.get(cacheKey)
  if (cached !== undefined) return cached
  const inventory = new Set(
    gitText(repoRoot, ["ls-tree", "-r", "--name-only", sourceA])
      .split("\n")
      .filter(Boolean)
      .map(normalize),
  )
  const packageJsonPaths = sorted(
    [...inventory].filter((repoPath) =>
      /^(apps|packages)\/[^/]+\/package\.json$/u.test(repoPath),
    ),
  )
  const packages = packageJsonPaths.map((packagePath): WorkspacePackage => {
    const parsed = JSON.parse(
      readCommitFile(repoRoot, sourceA, packagePath).toString("utf8"),
    ) as {
      name?: unknown
      exports?: unknown
      main?: unknown
    }
    if (typeof parsed.name !== "string") {
      fail("V138_SELECTED_ROUTE_PACKAGE_METADATA_INVALID")
    }
    const exports: Record<string, string> = {}
    if (typeof parsed.exports === "string") {
      exports["."] = parsed.exports
    } else if (
      parsed.exports !== null &&
      typeof parsed.exports === "object" &&
      !Array.isArray(parsed.exports)
    ) {
      const entries = Object.entries(parsed.exports)
      if (entries.every(([key]) => !key.startsWith("."))) {
        exports["."] = selectExportTarget(parsed.exports)
      } else {
        for (const [key, value] of entries) {
          exports[key] = selectExportTarget(value)
        }
      }
    } else if (typeof parsed.main === "string") {
      exports["."] = parsed.main
    } else {
      exports["."] = "./src/index.ts"
    }
    return {
      name: parsed.name as string,
      root: path.posix.dirname(packagePath),
      exports,
    }
  })
  if (new Set(packages.map((entry) => entry.name)).size !== packages.length) {
    fail("V138_SELECTED_ROUTE_DUPLICATE_PACKAGE_NAME")
  }
  const builtinNames = new Set(
    builtinModules.flatMap((name) => [name, name.replace(/^node:/u, "")]),
  )
  const lockText = readCommitFile(repoRoot, sourceA, "pnpm-lock.yaml").toString(
    "utf8",
  )
  const lock = parseYamlMapping(lockText)
  const lockedPackageNames = new Set<string>()
  for (const sectionName of ["packages", "snapshots"] as const) {
    const section = lock[sectionName]
    if (section === undefined) continue
    if (typeof section === "string") {
      fail("V138_SELECTED_ROUTE_LOCKFILE_INVALID")
    }
    for (const key of Object.keys(section)) {
      lockedPackageNames.add(packageNameFromLockKey(key))
    }
  }
  const tsconfigPaths = sorted(
    [...inventory].filter((repoPath) =>
      /(?:^|\/)tsconfig(?:\.[^/]+)?\.json$/u.test(repoPath),
    ),
  )
  type CompilerOptionsSnapshot = {
    baseUrl?: unknown
    paths?: unknown
    module?: unknown
    moduleResolution?: unknown
  }
  type ConfigSnapshot = {
    path: string
    extends?: string
    compilerOptions: CompilerOptionsSnapshot
    references: string[]
  }
  const configs = new Map<string, ConfigSnapshot>()
  for (const configPath of tsconfigPaths) {
    const parsed = ts.parseConfigFileTextToJson(
      configPath,
      readCommitFile(repoRoot, sourceA, configPath).toString("utf8"),
    )
    if (
      parsed.error !== undefined ||
      parsed.config === null ||
      typeof parsed.config !== "object"
    )
      fail("V138_SELECTED_ROUTE_TSCONFIG_INVALID")
    const config = parsed.config as Record<string, unknown>
    if (config.extends !== undefined && typeof config.extends !== "string") {
      fail("V138_SELECTED_ROUTE_TSCONFIG_INVALID")
    }
    const compilerOptions = (config.compilerOptions ??
      {}) as CompilerOptionsSnapshot
    if (
      compilerOptions === null ||
      typeof compilerOptions !== "object" ||
      Array.isArray(compilerOptions) ||
      (config.references !== undefined && !Array.isArray(config.references))
    )
      fail("V138_SELECTED_ROUTE_TSCONFIG_INVALID")
    const references = ((config.references ?? []) as unknown[]).map((entry) => {
      if (
        entry === null ||
        typeof entry !== "object" ||
        Array.isArray(entry) ||
        typeof (entry as { path?: unknown }).path !== "string"
      )
        fail("V138_SELECTED_ROUTE_TSCONFIG_INVALID")
      return (entry as { path: string }).path
    })
    configs.set(configPath, {
      path: configPath,
      ...(typeof config.extends === "string"
        ? { extends: config.extends }
        : {}),
      compilerOptions,
      references,
    })
  }
  const resolveConfigPath = (
    from: string,
    target: string,
    relationship: "extends" | "reference" = "extends",
  ): string => {
    if (relationship === "extends" && !target.startsWith(".")) {
      fail("V138_SELECTED_ROUTE_TSCONFIG_EXTENDS_UNPROVEN")
    }
    const base = path.posix.normalize(
      path.posix.join(path.posix.dirname(from), target),
    )
    if (base.startsWith("../") || path.posix.isAbsolute(base)) {
      fail("V138_SELECTED_ROUTE_PATH_ESCAPE")
    }
    const candidates = sorted(
      [
        base.endsWith(".json") ? base : `${base}.json`,
        path.posix.join(base, "tsconfig.json"),
      ].filter((candidate) => configs.has(candidate)),
    )
    if (candidates.length !== 1) {
      fail(
        candidates.length === 0
          ? "V138_SELECTED_ROUTE_TSCONFIG_EXTENDS_UNPROVEN"
          : "V138_SELECTED_ROUTE_TSCONFIG_EXTENDS_AMBIGUOUS",
      )
    }
    return candidates[0]!
  }
  type EffectiveCompilerOptions = {
    baseUrl?: string
    baseUrlDeclaredAt?: string
    paths?: unknown
    pathsDeclaredAt?: string
    pathsBasePath?: string
    module?: unknown
    moduleDeclaredAt?: string
    moduleResolution?: unknown
    moduleResolutionDeclaredAt?: string
  }
  const effectiveConfigs = new Map<string, EffectiveCompilerOptions>()
  const resolveEffective = (
    configPath: string,
    ancestors: readonly string[] = [],
  ): EffectiveCompilerOptions => {
    const cachedOptions = effectiveConfigs.get(configPath)
    if (cachedOptions !== undefined) return cachedOptions
    if (ancestors.includes(configPath)) {
      fail("V138_SELECTED_ROUTE_TSCONFIG_EXTENDS_CYCLE")
    }
    const config = configs.get(configPath)
    if (config === undefined) fail("V138_SELECTED_ROUTE_TSCONFIG_INVALID")
    const parent =
      config.extends === undefined
        ? {}
        : resolveEffective(resolveConfigPath(configPath, config.extends), [
            ...ancestors,
            configPath,
          ])
    const effective: EffectiveCompilerOptions = { ...parent }
    if (config.compilerOptions.baseUrl !== undefined) {
      if (typeof config.compilerOptions.baseUrl !== "string") {
        fail("V138_SELECTED_ROUTE_TSCONFIG_INVALID")
      }
      effective.baseUrl = path.posix.normalize(
        path.posix.join(
          path.posix.dirname(configPath),
          config.compilerOptions.baseUrl,
        ),
      )
      effective.baseUrlDeclaredAt = configPath
    }
    if (config.compilerOptions.paths !== undefined) {
      effective.paths = config.compilerOptions.paths
      effective.pathsDeclaredAt = configPath
      effective.pathsBasePath =
        effective.baseUrl ?? path.posix.dirname(configPath)
    }
    if (config.compilerOptions.module !== undefined) {
      effective.module = config.compilerOptions.module
      effective.moduleDeclaredAt = configPath
    }
    if (config.compilerOptions.moduleResolution !== undefined) {
      effective.moduleResolution = config.compilerOptions.moduleResolution
      effective.moduleResolutionDeclaredAt = configPath
    }
    if (
      effective.paths !== undefined &&
      (effective.paths === null ||
        typeof effective.paths !== "object" ||
        Array.isArray(effective.paths))
    )
      fail("V138_SELECTED_ROUTE_TSCONFIG_INVALID")
    if (
      effective.module !== undefined &&
      effective.module !== "NodeNext" &&
      effective.module !== "Node16"
    )
      fail("V138_SELECTED_ROUTE_TSCONFIG_MODE_UNSUPPORTED")
    if (
      effective.moduleResolution !== undefined &&
      effective.moduleResolution !== "NodeNext" &&
      effective.moduleResolution !== "Node16"
    )
      fail("V138_SELECTED_ROUTE_TSCONFIG_MODE_UNSUPPORTED")
    effectiveConfigs.set(configPath, effective)
    return effective
  }
  for (const config of configs.values()) {
    for (const reference of config.references) {
      resolveConfigPath(config.path, reference, "reference")
    }
    resolveEffective(config.path)
  }
  const pathMappings: Array<{
    pattern: string
    targets: string[]
    base: string
    scope: string
    configPath: string
  }> = []
  for (const configPath of tsconfigPaths) {
    const compilerOptions = resolveEffective(configPath)
    if (
      compilerOptions.paths !== undefined &&
      (compilerOptions.paths === null ||
        typeof compilerOptions.paths !== "object" ||
        Array.isArray(compilerOptions.paths))
    ) {
      fail("V138_SELECTED_ROUTE_TSCONFIG_INVALID")
    }
    for (const [pattern, targets] of Object.entries(
      (compilerOptions.paths ?? {}) as Record<string, unknown>,
    )) {
      if (
        !Array.isArray(targets) ||
        targets.length === 0 ||
        targets.some((target) => typeof target !== "string")
      ) {
        fail("V138_SELECTED_ROUTE_TSCONFIG_INVALID")
      }
      const base =
        compilerOptions.pathsBasePath ??
        path.posix.dirname(compilerOptions.pathsDeclaredAt ?? configPath)
      pathMappings.push({
        pattern,
        targets: targets as string[],
        base,
        scope: path.posix.dirname(configPath),
        configPath,
      })
    }
  }
  const resolve = (from: string, specifier: string): string | undefined => {
    if (
      specifier.startsWith("node:") ||
      builtinNames.has(specifier.split("/")[0]!)
    )
      return undefined
    let bases: string[]
    if (specifier.startsWith(".")) {
      const candidate = path.posix.normalize(
        path.posix.join(path.posix.dirname(from), specifier),
      )
      if (candidate.startsWith("../") || path.posix.isAbsolute(candidate)) {
        fail("V138_SELECTED_ROUTE_PATH_ESCAPE")
      }
      bases = [candidate]
    } else {
      const applicableMappings = pathMappings
        .filter(
          ({ scope }) =>
            scope === "." || from === scope || from.startsWith(`${scope}/`),
        )
        .sort((left, right) => right.scope.length - left.scope.length)
      const nearestScopeLength = applicableMappings[0]?.scope.length
      const aliasBases = applicableMappings
        .filter(({ scope }) => scope.length === nearestScopeLength)
        .flatMap((mapping) => {
          const star = mapping.pattern.indexOf("*")
          const matches =
            star < 0
              ? specifier === mapping.pattern
                ? [""]
                : []
              : specifier.startsWith(mapping.pattern.slice(0, star)) &&
                  specifier.endsWith(mapping.pattern.slice(star + 1))
                ? [
                    specifier.slice(
                      star,
                      specifier.length - mapping.pattern.slice(star + 1).length,
                    ),
                  ]
                : []
          return matches.flatMap((capture) =>
            mapping.targets.map((target) =>
              path.posix.join(mapping.base, target.replace("*", capture)),
            ),
          )
        })
      if (aliasBases.length > 0) {
        bases = aliasBases
      } else {
        const workspace = packages.find(
          (entry) =>
            specifier === entry.name || specifier.startsWith(`${entry.name}/`),
        )
        if (workspace === undefined) {
          const packageName = specifier.startsWith("@")
            ? specifier.split("/").slice(0, 2).join("/")
            : specifier.split("/")[0]!
          if (!lockedPackageNames.has(packageName)) {
            fail("V138_SELECTED_ROUTE_EXTERNAL_UNPROVEN")
          }
          return undefined
        }
        const subpath =
          specifier === workspace.name
            ? "."
            : `./${specifier.slice(workspace.name.length + 1)}`
        let selected = workspace.exports[subpath]
        if (selected === undefined) {
          const patterns = Object.entries(workspace.exports).filter(([key]) =>
            key.includes("*"),
          )
          const matches = patterns.flatMap(([key, target]) => {
            const [prefix, suffix] = key.split("*")
            return subpath.startsWith(prefix!) && subpath.endsWith(suffix!)
              ? [
                  target.replace(
                    "*",
                    subpath.slice(
                      prefix!.length,
                      subpath.length - suffix!.length,
                    ),
                  ),
                ]
              : []
          })
          if (matches.length !== 1) {
            fail("V138_SELECTED_ROUTE_PACKAGE_EXPORT_UNRESOLVED")
          }
          selected = matches[0]
        }
        bases = [path.posix.join(workspace.root, selected)]
      }
    }
    const matches = sorted(
      bases
        .flatMap(candidatePaths)
        .filter((candidate) => inventory.has(candidate)),
    )
    if (matches.length !== 1) {
      fail(
        matches.length === 0
          ? "V138_SELECTED_ROUTE_EDGE_UNRESOLVED"
          : "V138_SELECTED_ROUTE_EDGE_AMBIGUOUS",
      )
    }
    if (!/\.(?:ts|tsx|json)$/u.test(matches[0]!)) {
      fail("V138_SELECTED_ROUTE_EXTENSION_UNSUPPORTED")
    }
    return matches[0]
  }
  const pending: string[] = [...V138_SELECTED_ROUTE_ROOTS]
  const visited = new Set<string>()
  const edges: Array<{ from: string; specifier: string; to: string }> = []
  while (pending.length > 0) {
    const current = pending.shift()!
    if (visited.has(current)) continue
    if (!inventory.has(current)) fail("V138_SELECTED_ROUTE_ROOT_MISSING")
    visited.add(current)
    if (current.endsWith(".json")) continue
    const source = readCommitFile(repoRoot, sourceA, current).toString("utf8")
    for (const specifier of collectSpecifiers(current, source)) {
      const target = resolve(current, specifier)
      if (target === undefined) continue
      edges.push({ from: current, specifier, to: target })
      if (!visited.has(target)) pending.push(target)
    }
  }
  const paths = sorted(visited)
  if (
    !paths.includes("apps/runtime-service/src/semantic-receipt-v1-18-issuer.ts")
  ) {
    fail("V138_SELECTED_ROUTE_SEMANTIC_ISSUER_MISSING")
  }
  const canonicalEdges = [...edges].sort((left, right) =>
    Buffer.from(`${left.from}\0${left.specifier}\0${left.to}`).compare(
      Buffer.from(`${right.from}\0${right.specifier}\0${right.to}`),
    ),
  )
  const resolverPaths = sorted([
    "package.json",
    "pnpm-lock.yaml",
    "pnpm-workspace.yaml",
    ...tsconfigPaths,
    ...packageJsonPaths,
    ...paths
      .map((repoPath) => {
        const parts = repoPath.split("/")
        return `${parts[0]}/${parts[1]}/tsconfig.json`
      })
      .filter((repoPath) => inventory.has(repoPath)),
  ])
  const sourceBlobs = paths.map((repoPath) =>
    blobRecord(repoRoot, sourceA, repoPath),
  )
  const resolverMetadata = resolverPaths.map((repoPath) =>
    blobRecord(repoRoot, sourceA, repoPath),
  )
  const identity = {
    algorithm: "typescript-static-source-closure-v1" as const,
    sourceA,
    roots: V138_SELECTED_ROUTE_ROOTS,
    paths,
    edges: canonicalEdges,
    sourceBlobs,
    resolverMetadata,
  }
  const closure = Object.freeze({
    ...identity,
    roots: V138_SELECTED_ROUTE_ROOTS,
    paths: Object.freeze(paths),
    edges: Object.freeze(canonicalEdges.map((edge) => Object.freeze(edge))),
    sourceBlobs: Object.freeze(sourceBlobs),
    resolverMetadata: Object.freeze(resolverMetadata),
    closureRoot: identityRoot(
      "artifactManifest",
      "v1.38-selected-route-closure-v2",
      identity,
    ),
  })
  selectedRouteClosureCache.set(cacheKey, closure)
  return closure
}

export const checkSelectedRouteClosureAtCommit = (
  repoRoot: string,
  sourceA: string,
  expected: Readonly<V138SelectedRouteClosure>,
): Readonly<V138SelectedRouteClosure> => {
  const actual = deriveSelectedRouteClosureAtCommit(repoRoot, sourceA)
  if (canonical(actual) !== canonical(expected)) {
    fail("V138_SELECTED_ROUTE_CLOSURE_MISMATCH")
  }
  return actual
}

export const checkSelectedRouteEdgeInventory = (
  derived: Readonly<V138SelectedRouteClosure>,
  candidateEdges: readonly V138SelectedRouteClosure["edges"][number][],
): true => {
  if (canonical(candidateEdges) !== canonical(derived.edges)) {
    fail("V138_SELECTED_ROUTE_EDGE_INVENTORY_MISMATCH")
  }
  return true
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value)
const exactKeys = (
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean => {
  const actual = Object.keys(value).sort()
  const expected = [...keys].sort()
  return (
    actual.length === expected.length &&
    actual.every((key, index) => key === expected[index])
  )
}
const isSha256 = (value: unknown): value is Sha256 =>
  typeof value === "string" && /^sha256:[0-9a-f]{64}$/u.test(value)

export const V138_PLAN_262_15_AUTHORIZATION_SCHEMA =
  "v1.38-plan-262-15-authorization-v1" as const
export const V138_SUCCESSOR_SOURCE_SEAL_SCHEMA =
  "v1.38-successor-source-seal-v1" as const
export const V138_PLAN_262_15_OPERATOR =
  "roryquinlan-repository-operator" as const
export const V138_PLAN_262_15_EXPIRY =
  "first_terminal_seal_or_plan_262_16_outcome" as const

export const v138Plan26215AuthorizationLiteral = (sourceA: string): string => {
  if (!/^[0-9a-f]{40}$/u.test(sourceA))
    fail("V138_AUTHORIZATION_SOURCE_A_INVALID")
  return `Authorize Phase 262 Plans 262-15 and 262-16 over independently reviewed source commit ${sourceA} as roryquinlan-repository-operator for exactly one separately committed successor-source seal B, exactly one Pattern C main-orchestrator effective-available-memory headroom-preflight:v5, exactly one calibration:v5 eight-attempt/four-shard allocation, and—only if calibration:v5 is admitted—at most one fresh reproduction:v6 540-cell run, using darwin-memorystatus-effective-available-basis-points-v1 at the unchanged inclusive 2,500-basis-point threshold and every other unchanged frozen policy, resource, lineage, accounting, runtime, semantic, privacy, and formation-absence bound. This authorization is single-use, has no retry, and expires at the first terminal seal or Plan 262-16 outcome.`
}

export interface V138Plan26215Authorization {
  readonly schemaVersion: typeof V138_PLAN_262_15_AUTHORIZATION_SCHEMA
  readonly sourceA: string
  readonly operator: typeof V138_PLAN_262_15_OPERATOR
  readonly literalSha256: Sha256
  readonly sealCount: 1
  readonly preflightCount: 1
  readonly calibrationAttemptCount: 8
  readonly calibrationShardCount: 4
  readonly reproductionMaximumCount: 1
  readonly reproductionCellCount: 540
  readonly singleUse: true
  readonly noRetry: true
  readonly expiresAt: typeof V138_PLAN_262_15_EXPIRY
  readonly authorizationRoot: Sha256
}

const AUTHORIZATION_KEYS = [
  "schemaVersion",
  "sourceA",
  "operator",
  "literalSha256",
  "sealCount",
  "preflightCount",
  "calibrationAttemptCount",
  "calibrationShardCount",
  "reproductionMaximumCount",
  "reproductionCellCount",
  "singleUse",
  "noRetry",
  "expiresAt",
  "authorizationRoot",
] as const

export const buildV138Plan26215Authorization = (
  repoRoot: string,
  sourceAInput: string,
  literalBytes: Uint8Array,
): Readonly<V138Plan26215Authorization> => {
  const sourceA = fullCommit(repoRoot, sourceAInput)
  const expected = Buffer.from(
    v138Plan26215AuthorizationLiteral(sourceA),
    "utf8",
  )
  if (!Buffer.from(literalBytes).equals(expected)) {
    fail("V138_AUTHORIZATION_LITERAL_INVALID")
  }
  const body = {
    schemaVersion: V138_PLAN_262_15_AUTHORIZATION_SCHEMA,
    sourceA,
    operator: V138_PLAN_262_15_OPERATOR,
    literalSha256: sha256(literalBytes),
    sealCount: 1 as const,
    preflightCount: 1 as const,
    calibrationAttemptCount: 8 as const,
    calibrationShardCount: 4 as const,
    reproductionMaximumCount: 1 as const,
    reproductionCellCount: 540 as const,
    singleUse: true as const,
    noRetry: true as const,
    expiresAt: V138_PLAN_262_15_EXPIRY,
  }
  return Object.freeze({
    ...body,
    authorizationRoot: identityRoot(
      "evidenceBundle",
      V138_PLAN_262_15_AUTHORIZATION_SCHEMA,
      body,
    ),
  })
}

export const checkV138Plan26215Authorization = (
  repoRoot: string,
  value: unknown,
  literalBytes?: Uint8Array,
): Readonly<V138Plan26215Authorization> => {
  if (!isRecord(value) || !exactKeys(value, AUTHORIZATION_KEYS)) {
    fail("V138_AUTHORIZATION_SCHEMA_INVALID")
  }
  const candidate = value as unknown as V138Plan26215Authorization
  const expected = buildV138Plan26215Authorization(
    repoRoot,
    candidate.sourceA,
    literalBytes ??
      Buffer.from(v138Plan26215AuthorizationLiteral(candidate.sourceA), "utf8"),
  )
  if (canonical(candidate) !== canonical(expected)) {
    fail("V138_AUTHORIZATION_INVALID")
  }
  return expected
}

export interface V138SuccessorSourceSeal {
  readonly schemaVersion: typeof V138_SUCCESSOR_SOURCE_SEAL_SCHEMA
  readonly sealOrdinal: 1
  readonly canonicalizationId: "canonical-json-v1.1"
  readonly sourceCustody: Readonly<V138SourceCustody>
  readonly selectedRouteClosure: Readonly<V138SelectedRouteClosure>
  readonly reviewRoots: readonly Readonly<{ path: string; sha256: Sha256 }>[]
  readonly protectedEvidence: readonly Readonly<{
    path: string
    blobOid: string
    byteLength: number
    sha256: Sha256
  }>[]
  readonly frozenPolicy: Readonly<Record<string, JsonValue>>
  readonly toolIdentity: Readonly<Record<string, JsonValue>>
  readonly hostIdentity: Readonly<Record<string, JsonValue>>
  readonly formationAbsence: Readonly<Record<string, JsonValue>>
  readonly replacementMetricContract: Readonly<Record<string, JsonValue>>
  readonly authorizationRoot: Sha256
  readonly sealRoot: Sha256
}

const PROTECTED_EVIDENCE_PATHS = Object.freeze([
  ".planning/artifacts/v1.38-current-matrix-calibration-v2.json",
  ".planning/artifacts/v1.38-current-matrix-calibration-v3.json",
  ".planning/artifacts/v1.38-current-matrix-calibration-v4.json",
  ".planning/artifacts/v1.38-current-matrix-diagnostic-v2.json",
  ".planning/artifacts/v1.38-current-matrix-execution-context-v4.json",
  ".planning/artifacts/v1.38-current-matrix-headroom-preflight-v3.json",
  ".planning/artifacts/v1.38-current-matrix-headroom-preflight-v4.json",
  ".planning/artifacts/v1.38-current-matrix-reproduction.json",
  ".planning/artifacts/v1.38-foundation-admission.json",
  ".planning/artifacts/v1.38-historical-matrix-expectation.json",
] as const)

const strictReviewMetadata = (
  bytes: Uint8Array,
): Readonly<{ fixesApplied: boolean; sourceA: string }> => {
  const text = Buffer.from(bytes).toString("utf8")
  const match = /^---\n([\s\S]*?)\n---(?:\n|$)/u.exec(text)
  if (match === null) fail("V138_PLAN_262_15_REVIEW_NOT_CLEAN")
  const values = new Map<string, string>()
  const files: string[] = []
  let parent = ""
  for (const line of match[1]!.split("\n")) {
    if (line.length === 0) continue
    const listItem = /^  - (.+)$/u.exec(line)
    const nested = /^  ([a-z_]+):\s*(.*?)\s*$/u.exec(line)
    const top = /^([a-z_]+):\s*(.*?)\s*$/u.exec(line)
    if (listItem !== null && parent === "files_reviewed_list") {
      files.push(listItem[1]!)
    } else if (nested !== null && parent !== "") {
      const key = `${parent}.${nested[1]}`
      if (values.has(key)) fail("V138_PLAN_262_15_REVIEW_SCHEMA_INVALID")
      values.set(key, nested[2]!)
    } else if (top !== null) {
      parent = top[2] === "" ? top[1]! : ""
      if (values.has(top[1]!)) {
        fail("V138_PLAN_262_15_REVIEW_SCHEMA_INVALID")
      }
      values.set(top[1]!, top[2]!)
    } else {
      fail("V138_PLAN_262_15_REVIEW_SCHEMA_INVALID")
    }
  }
  if (
    values.get("status") !== "clean" ||
    values.get("findings.critical") !== "0" ||
    values.get("findings.warning") !== "0" ||
    values.get("files_reviewed") !== "4" ||
    values.get("source_base") !== "30c0949692017f425795213972482568cdd73f64" ||
    !/^[0-9a-f]{40}$/u.test(values.get("source_a") ?? "") ||
    canonical(sorted(files)) !==
      canonical(sorted(V138_SUCCESSOR_AUTHORIZED_SOURCE_PATHS))
  )
    fail("V138_PLAN_262_15_REVIEW_NOT_CLEAN")
  const fixesValue =
    values.get("fixes_applied") ?? values.get("review_fix_required") ?? "false"
  if (fixesValue !== "true" && fixesValue !== "false") {
    fail("V138_PLAN_262_15_REVIEW_SCHEMA_INVALID")
  }
  return Object.freeze({
    fixesApplied: fixesValue === "true",
    sourceA: values.get("source_a")!,
  })
}

const deriveReviewRoots = (
  repoRoot: string,
  sourceA: string,
): V138SuccessorSourceSeal["reviewRoots"] => {
  const reviewPath =
    ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-15-REVIEW.md"
  const reviewBytes = readFileSync(path.resolve(repoRoot, reviewPath))
  const metadata = strictReviewMetadata(reviewBytes)
  if (metadata.sourceA !== sourceA) {
    fail("V138_PLAN_262_15_REVIEW_SOURCE_JOIN_INVALID")
  }
  const roots: Array<{ path: string; sha256: Sha256 }> = [
    {
      path: reviewPath,
      sha256: sha256(reviewBytes),
    },
  ]
  if (metadata.fixesApplied) {
    const fixPath =
      ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-15-REVIEW-FIX.md"
    const fixBytes = readFileSync(path.resolve(repoRoot, fixPath))
    if (strictFixReportMetadata(fixBytes).finalSourceA !== sourceA) {
      fail("V138_PLAN_262_15_REVIEW_FIX_RELATION_INVALID")
    }
    roots.push({ path: fixPath, sha256: sha256(fixBytes) })
  }
  return Object.freeze(roots.map((root) => Object.freeze(root)))
}

const strictFixReportMetadata = (
  bytes: Uint8Array,
): Readonly<{ finalSourceA: string }> => {
  const text = Buffer.from(bytes).toString("utf8")
  const match = /^---\n([\s\S]*?)\n---(?:\n|$)/u.exec(text)
  if (match === null) fail("V138_PLAN_262_15_REVIEW_FIX_RELATION_INVALID")
  const values = new Map<string, string>()
  for (const line of match[1]!.split("\n")) {
    if (line.length === 0) continue
    const scalar = /^([a-z_]+):\s*(.*?)\s*$/u.exec(line)
    if (scalar === null || values.has(scalar[1]!)) {
      fail("V138_PLAN_262_15_REVIEW_FIX_RELATION_INVALID")
    }
    values.set(scalar[1]!, scalar[2]!)
  }
  if (
    values.get("status") !== "all_fixed" ||
    values.get("skipped") !== "0" ||
    !/^[1-9][0-9]*$/u.test(values.get("fixed") ?? "") ||
    values.get("source_base") !== "30c0949692017f425795213972482568cdd73f64" ||
    !/^[0-9a-f]{40}$/u.test(values.get("final_source_a") ?? "")
  )
    fail("V138_PLAN_262_15_REVIEW_FIX_RELATION_INVALID")
  return Object.freeze({ finalSourceA: values.get("final_source_a")! })
}

const deriveFrozenPolicy = (): Readonly<Record<string, JsonValue>> =>
  Object.freeze({
    schemaVersion: "v1.38-frozen-policy-v1",
    requiredHostHeadroomBasisPoints: 2_500,
    calibrationAttemptCount: 8,
    calibrationShardCount: 4,
    reproductionAttemptCount: 540,
    maximumConcurrency: 4,
    maximumAttemptsPerShard: 4,
    maximumChildRssKilobytes: 2_097_152,
    maximumAggregateChildRssKilobytes: 4_194_304,
    maximumShardMilliseconds: 600_000,
    maximumTotalRunMilliseconds: 5_400_000,
    resourceSampleMilliseconds: 250,
    gracefulTerminationMilliseconds: 2_000,
    forcedTerminationMilliseconds: 2_000,
    acceptedCellCountRule: "exactly_zero_or_540",
    partialAcceptedEvidenceReusable: false,
    noRetry: true,
    runtimeRoute: "v1.18/v1.19/MATCH_KERNEL",
    runtimeServiceVersion: "runtime-execution-service-v1.18",
    runtimeAbiVersion: "strategy-runtime-abi-v1.19",
    matchKernel: "engine-kernel-v1.37-candidate-1",
    requestSchemaVersion: "runtime-execution-service-request-v1.18",
    reducerId: "v1.38-current-matrix-reducer-v1",
    accountingId: "v1.38-parallel-matrix-accounting-v1",
    privacyRule:
      "no_strategy_source_memory_soldier_memory_or_objective_payload",
    cardinalityRule: "8_calibration_attempts_4_shards_then_exactly_540_or_zero",
    hostMetricId: "darwin-memorystatus-effective-available-basis-points-v1",
    hostProviderId: "apple-memory-pressure-q-v1",
    hostParserId: "apple-memory-pressure-q-c-locale-parser-v1",
  })

const deriveReplacementMetricContract = (
  repoRoot: string,
  sourceA: string,
): Readonly<Record<string, JsonValue>> => {
  const command = Object.freeze({
    executable: MEMORY_PRESSURE_Q_REQUEST.executable,
    argv: Object.freeze([...MEMORY_PRESSURE_Q_REQUEST.args]),
    environment: Object.freeze({ ...MEMORY_PRESSURE_Q_REQUEST.env }),
    stdin: MEMORY_PRESSURE_Q_REQUEST.stdin,
    shell: MEMORY_PRESSURE_Q_REQUEST.shell,
    timeoutMilliseconds: MEMORY_PRESSURE_Q_REQUEST.timeoutMilliseconds,
    maximumOutputBytes: MEMORY_PRESSURE_Q_REQUEST.maximumOutputBytes,
  })
  const metric = Object.freeze({
    metricId: V138_DARWIN_HEADROOM_METRIC_ID,
    unit: "basis_points",
    derivation: "memorystatus_whole_percentage_times_100",
    quantization: "xnu_floor_integer_percentage",
  })
  const provider = Object.freeze({
    providerId: V138_DARWIN_HEADROOM_PROVIDER_ID,
    observationCountPerPreflight: 1,
    schedulerObservationMode: "one_shared_observation_per_tick",
  })
  const parser = Object.freeze({
    parserId: V138_DARWIN_HEADROOM_PARSER_ID,
    locale: "C",
    outputGrammar: "memory_pressure_q_two_line_exact_v1",
    diagnosticsRetained: false,
  })
  const threshold = Object.freeze({
    comparator: "inclusive_greater_than_or_equal",
    requiredBasisPoints: V138_DARWIN_HEADROOM_THRESHOLD_BASIS_POINTS,
  })
  const semanticReferences = Object.freeze([
    Object.freeze({
      repository: "apple-oss-distributions/system_cmds",
      commit: "408bba7453608006b89772db185defbac8fe2fd0",
      path: "memory_pressure/memory_pressure.c",
      semanticClaim: "quiet_mode_calls_memorystatus_get_level",
    }),
    Object.freeze({
      repository: "apple-oss-distributions/xnu",
      commit: "f6217f891ac0bb64f3d375211650a4c1ff8ca1ea",
      path: "osfmk/vm/vm_pageout.c",
      semanticClaim: "available_pages_times_100_divided_by_total_pages",
    }),
  ])
  const providerSource = blobRecord(
    repoRoot,
    sourceA,
    "scripts/lib/v1-38-darwin-headroom.ts",
  )
  const domains = Object.freeze({
    commandRoot: identityRoot(
      "containmentPolicy",
      "v1.38-memory-pressure-q-command-v1",
      command,
    ),
    metricRoot: identityRoot(
      "canonicalJsonProfile",
      "v1.38-darwin-headroom-metric-v1",
      metric,
    ),
    providerRoot: identityRoot(
      "artifactManifest",
      "v1.38-darwin-headroom-provider-v1",
      { provider, providerSource },
    ),
    parserRoot: identityRoot(
      "canonicalJsonProfile",
      "v1.38-darwin-headroom-parser-v1",
      parser,
    ),
    thresholdRoot: identityRoot(
      "budgetProfile",
      "v1.38-darwin-headroom-threshold-v1",
      threshold,
    ),
    semanticReferencesRoot: identityRoot(
      "artifactManifest",
      "v1.38-darwin-headroom-semantic-references-v1",
      semanticReferences,
    ),
  })
  const body = {
    schemaVersion: "v1.38-replacement-metric-contract-v1",
    command,
    metric,
    provider,
    parser,
    threshold,
    semanticReferences,
    providerSource,
    domains,
  }
  return Object.freeze({
    ...body,
    contractRoot: identityRoot("containmentPolicy", body.schemaVersion, body),
  })
}

export const checkV138ReplacementMetricContract = (
  repoRoot: string,
  sourceA: string,
  value: unknown,
): Readonly<Record<string, JsonValue>> => {
  const expected = deriveReplacementMetricContract(repoRoot, sourceA)
  if (canonical(value) !== canonical(expected)) {
    fail("V138_REPLACEMENT_METRIC_CONTRACT_INVALID")
  }
  return expected
}

const deriveToolIdentity = (): Readonly<Record<string, JsonValue>> => {
  const toolPath = "/usr/bin/memory_pressure"
  const stat = lstatSync(toolPath)
  if (!stat.isFile() || stat.isSymbolicLink()) {
    fail("V138_SUCCESSOR_SEAL_TOOL_IDENTITY_INVALID")
  }
  const descriptor = openSync(
    toolPath,
    constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0),
  )
  try {
    const opened = fstatSync(descriptor)
    if (!opened.isFile() || opened.dev !== stat.dev || opened.ino !== stat.ino)
      fail("V138_SUCCESSOR_SEAL_TOOL_IDENTITY_INVALID")
    const bytes = readFileSync(descriptor)
    return Object.freeze({
      schemaVersion: "v1.38-tool-identity-v1",
      path: toolPath,
      device: opened.dev,
      inode: opened.ino,
      byteLength: bytes.byteLength,
      sha256: sha256(bytes),
      mode: opened.mode,
      uid: opened.uid,
      gid: opened.gid,
      command: "/usr/bin/memory_pressure -Q",
      environment: "LC_ALL=C LANG=C PATH=/usr/bin:/bin:/usr/sbin:/sbin",
    })
  } finally {
    closeSync(descriptor)
  }
}

export const deriveV138ToolIdentityRoot = (): Sha256 => identityRoot(
  "artifactManifest", "v1.38-tool-identity-observation-v1",
  deriveToolIdentity(),
)

export const deriveV138FormationAbsenceRoot = (
  repoRoot: string,
  sourceA: string,
): Sha256 => identityRoot("artifactManifest",
  "v1.38-formation-absence-observation-v1",
  deriveFormationAbsence(repoRoot, sourceA),
)

const deriveHostIdentity = (): Readonly<Record<string, JsonValue>> => {
  if (platform() !== "darwin") {
    fail("V138_SUCCESSOR_SEAL_HOST_IDENTITY_INVALID")
  }
  const systemVersionPath = "/System/Library/CoreServices/SystemVersion.plist"
  const descriptor = openSync(
    systemVersionPath,
    constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0),
  )
  let systemVersionBytes: Buffer
  let systemVersionStat
  try {
    systemVersionStat = fstatSync(descriptor)
    if (!systemVersionStat.isFile()) {
      fail("V138_SUCCESSOR_SEAL_HOST_IDENTITY_INVALID")
    }
    systemVersionBytes = readFileSync(descriptor)
  } finally {
    closeSync(descriptor)
  }
  const systemVersion = systemVersionBytes.toString("utf8")
  const plistScalar = (key: string): string => {
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")
    const match = new RegExp(
      `<key>\\s*${escaped}\\s*</key>\\s*<string>\\s*([^<]+?)\\s*</string>`,
      "u",
    ).exec(systemVersion)
    if (match === null || match[1]!.trim().length === 0) {
      fail("V138_SUCCESSOR_SEAL_HOST_IDENTITY_INVALID")
    }
    return match[1]!.trim()
  }
  return Object.freeze({
    schemaVersion: "v1.38-host-identity-v1",
    platform: platform(),
    release: release(),
    architecture: arch(),
    productVersion: plistScalar("ProductVersion"),
    productBuildVersion: plistScalar("ProductBuildVersion"),
    darwinKernelIdentity: `${platform()}:${release()}:${arch()}`,
    systemVersionPlist: Object.freeze({
      path: systemVersionPath,
      device: systemVersionStat.dev,
      inode: systemVersionStat.ino,
      byteLength: systemVersionBytes.byteLength,
      sha256: sha256(systemVersionBytes),
    }),
  })
}

export const deriveFormationAbsence = (
  repoRoot: string,
  sourceA: string,
): Readonly<Record<string, JsonValue>> => {
  const inventory = gitText(repoRoot, ["ls-tree", "-r", "--name-only", sourceA])
    .split("\n")
    .filter(Boolean)
    .map(normalize)
  const monitoredPaths = sorted([
    ...inventory.filter((repoPath) =>
      repoPath.startsWith(".planning/artifacts/"),
    ),
    ...V138_SUCCESSOR_AUTHORIZED_SOURCE_PATHS.filter(
      (repoPath) =>
        repoPath !== "scripts/lib/v1-38-successor-source-seal.ts" &&
        repoPath !== "scripts/evaluate-v1-38-foundation-contract.test.ts",
    ),
    "scripts/lib/v1-38-successor-source-seal.ts",
  ])
  const forbiddenNamespace =
    /(?:^|\/)(?:formation(?:s|-profiles?)?|profiles?|candidates?|prompts?|cache|traces?|replays?|results?)(?:\/|$)/iu
  const forbiddenPaths = monitoredPaths.filter(
    (repoPath) =>
      repoPath.startsWith(".planning/artifacts/") &&
      (/(?:^|\/)formation(?:s|-profiles?)?(?:\/|$)/iu.test(repoPath) ||
        (/v1[.-]38/iu.test(repoPath) && forbiddenNamespace.test(repoPath))),
  )
  const executableFormation =
    /\b(?:GameState|createSetScenario|initialState|materializeFormation|formationToGameState|createFormationGameState|buildFormationScenario)\b/u
  const forbiddenContents = monitoredPaths.filter((repoPath) => {
    if (repoPath === "scripts/lib/v1-38-successor-source-seal.ts") return false
    const source = readCommitFile(repoRoot, sourceA, repoPath).toString("utf8")
    if (repoPath.startsWith(".planning/artifacts/")) {
      return /v1[.-]38/iu.test(repoPath) && executableFormation.test(source)
    }
    return (
      /(?:from|import\s*\()\s*["'][^"']*(?:formation|profile|candidate|prompt|cache|trace|replay|result)[^"']*["']/iu.test(
        source,
      ) || executableFormation.test(source)
    )
  })
  if (forbiddenPaths.length !== 0 || forbiddenContents.length !== 0) {
    fail("V138_SUCCESSOR_SEAL_FORMATION_PRESENT")
  }
  const scannedInventory = monitoredPaths.map((repoPath) =>
    blobRecord(repoRoot, sourceA, repoPath),
  )
  const monitorPath = "scripts/lib/v1-38-successor-source-seal.ts"
  const monitorBlob = blobRecord(repoRoot, sourceA, monitorPath)
  return Object.freeze({
    schemaVersion: "v1.38-formation-absence-v1",
    absent: true,
    monitorPath,
    monitorBlob,
    scannedInventory: Object.freeze(scannedInventory),
    scannedRoot: identityRoot(
      "artifactManifest",
      "v1.38-formation-absence-inventory-v1",
      scannedInventory,
    ),
    forbiddenPathCount: 0,
    forbiddenContentCount: 0,
  })
}

const SEAL_KEYS = [
  "schemaVersion",
  "sealOrdinal",
  "canonicalizationId",
  "sourceCustody",
  "selectedRouteClosure",
  "reviewRoots",
  "protectedEvidence",
  "frozenPolicy",
  "toolIdentity",
  "hostIdentity",
  "formationAbsence",
  "replacementMetricContract",
  "authorizationRoot",
  "sealRoot",
] as const

export const buildV138SuccessorSourceSeal = (input: {
  readonly repoRoot: string
  readonly sourceBase: string
  readonly sourceA: string
  readonly authorization: unknown
  readonly reviewRoots: V138SuccessorSourceSeal["reviewRoots"]
  readonly protectedEvidencePaths: readonly string[]
  readonly frozenPolicy: V138SuccessorSourceSeal["frozenPolicy"]
  readonly toolIdentity: V138SuccessorSourceSeal["toolIdentity"]
  readonly hostIdentity: V138SuccessorSourceSeal["hostIdentity"]
  readonly formationAbsence: V138SuccessorSourceSeal["formationAbsence"]
}): Readonly<V138SuccessorSourceSeal> => {
  const authorization = checkV138Plan26215Authorization(
    input.repoRoot,
    input.authorization,
  )
  checkV138SourceCheckoutAtA(input.repoRoot, input.sourceA)
  if (authorization.sourceA !== input.sourceA) {
    fail("V138_SUCCESSOR_SEAL_AUTHORIZATION_JOIN_INVALID")
  }
  const sourceCustody = inspectSourceCustody(input)
  const selectedRouteClosure = deriveSelectedRouteClosureAtCommit(
    input.repoRoot,
    input.sourceA,
  )
  const protectedEvidence = sorted(PROTECTED_EVIDENCE_PATHS).map((repoPath) =>
    blobRecord(input.repoRoot, input.sourceA, repoPath),
  )
  const body = {
    schemaVersion: V138_SUCCESSOR_SOURCE_SEAL_SCHEMA,
    sealOrdinal: 1 as const,
    canonicalizationId: "canonical-json-v1.1" as const,
    sourceCustody,
    selectedRouteClosure,
    reviewRoots: deriveReviewRoots(input.repoRoot, input.sourceA),
    protectedEvidence: Object.freeze(protectedEvidence),
    frozenPolicy: deriveFrozenPolicy(),
    toolIdentity: deriveToolIdentity(),
    hostIdentity: deriveHostIdentity(),
    formationAbsence: deriveFormationAbsence(input.repoRoot, input.sourceA),
    replacementMetricContract: deriveReplacementMetricContract(
      input.repoRoot,
      input.sourceA,
    ),
    authorizationRoot: authorization.authorizationRoot,
  }
  return Object.freeze({
    ...body,
    sealRoot: identityRoot(
      "containmentPolicy",
      V138_SUCCESSOR_SOURCE_SEAL_SCHEMA,
      body,
    ),
  })
}

export const checkV138SuccessorSourceSeal = (
  repoRoot: string,
  value: unknown,
  authorization: unknown,
): Readonly<V138SuccessorSourceSeal> => {
  if (!isRecord(value) || !exactKeys(value, SEAL_KEYS)) {
    fail("V138_SUCCESSOR_SEAL_SCHEMA_INVALID")
  }
  const candidate = value as unknown as V138SuccessorSourceSeal
  const checkedAuthorization = checkV138Plan26215Authorization(
    repoRoot,
    authorization,
  )
  if (
    candidate.schemaVersion !== V138_SUCCESSOR_SOURCE_SEAL_SCHEMA ||
    candidate.sealOrdinal !== 1 ||
    candidate.canonicalizationId !== "canonical-json-v1.1" ||
    candidate.authorizationRoot !== checkedAuthorization.authorizationRoot ||
    !isSha256(candidate.sealRoot)
  ) {
    fail("V138_SUCCESSOR_SEAL_INVALID")
  }
  checkV138SourceCheckoutAtA(repoRoot, candidate.sourceCustody.sourceA)
  const custody = inspectSourceCustody({
    repoRoot,
    sourceBase: candidate.sourceCustody.sourceBase,
    sourceA: candidate.sourceCustody.sourceA,
  })
  const expectedReviewRoots = deriveReviewRoots(
    repoRoot,
    candidate.sourceCustody.sourceA,
  )
  const expectedProtectedEvidence = sorted(PROTECTED_EVIDENCE_PATHS).map(
    (repoPath) =>
      blobRecord(repoRoot, candidate.sourceCustody.sourceA, repoPath),
  )
  if (
    canonical(custody) !== canonical(candidate.sourceCustody) ||
    canonical(candidate.reviewRoots) !== canonical(expectedReviewRoots) ||
    canonical(candidate.protectedEvidence) !==
      canonical(expectedProtectedEvidence) ||
    canonical(candidate.frozenPolicy) !== canonical(deriveFrozenPolicy()) ||
    canonical(candidate.toolIdentity) !== canonical(deriveToolIdentity()) ||
    canonical(candidate.hostIdentity) !== canonical(deriveHostIdentity()) ||
    canonical(candidate.formationAbsence) !==
      canonical(
        deriveFormationAbsence(repoRoot, candidate.sourceCustody.sourceA),
      ) ||
    canonical(
      checkV138ReplacementMetricContract(
        repoRoot,
        candidate.sourceCustody.sourceA,
        candidate.replacementMetricContract,
      ),
    ) !== canonical(candidate.replacementMetricContract)
  ) {
    fail("V138_SUCCESSOR_SEAL_SOURCE_JOIN_INVALID")
  }
  const closure = deriveSelectedRouteClosureAtCommit(
    repoRoot,
    candidate.sourceCustody.sourceA,
  )
  if (canonical(closure) !== canonical(candidate.selectedRouteClosure)) {
    fail("V138_SUCCESSOR_SEAL_SOURCE_JOIN_INVALID")
  }
  for (const record of candidate.protectedEvidence) {
    if (
      canonical(
        blobRecord(repoRoot, candidate.sourceCustody.sourceA, record.path),
      ) !== canonical(record)
    ) {
      fail("V138_SUCCESSOR_SEAL_PROTECTED_EVIDENCE_INVALID")
    }
  }
  const { sealRoot, ...body } = candidate
  if (
    sealRoot !==
    identityRoot("containmentPolicy", V138_SUCCESSOR_SOURCE_SEAL_SCHEMA, body)
  ) {
    fail("V138_SUCCESSOR_SEAL_ROOT_INVALID")
  }
  return candidate
}

export type V138Plan26215Disposition = "seal_refused" | "seal_failed" | "sealed"

const CANONICAL_PATHS = Object.freeze({
  authorization: ".planning/artifacts/v1.38-plan-262-15-authorization-v1.json",
  seal: ".planning/artifacts/v1.38-successor-source-seal-v1.json",
  terminal: ".planning/artifacts/v1.38-plan-262-15-terminal-v1.json",
  review:
    ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-15-REVIEW.md",
  reviewFix:
    ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-15-REVIEW-FIX.md",
})

const checkedSuccessorSealCommits = new Map<
  string,
  Readonly<{
    authorizationBytes: Buffer
    sealBytes: Buffer
    custody: V138SourceBCustody
  }>
>()

export interface V138SourceBCustody {
  readonly schemaVersion: "v1.38-source-b-custody-v1"
  readonly sourceA: string
  readonly sourceB: string
  readonly sourceBTree: string
  readonly sourceBParent: string
  readonly changedPaths: readonly string[]
  readonly blobs: readonly Readonly<{
    path: string
    blobOid: string
    byteLength: number
    sha256: Sha256
  }>[]
  readonly custodyRoot: Sha256
}

export const checkV138SuccessorSealCommit = (input: {
  readonly repoRoot: string
  readonly sourceA: string
  readonly sourceB: string
}): Readonly<V138SourceBCustody> => {
  const sourceA = fullCommit(input.repoRoot, input.sourceA)
  const sourceB = fullCommit(input.repoRoot, input.sourceB)
  const ancestry = gitText(input.repoRoot, [
    "rev-list",
    "--parents",
    "-n",
    "1",
    sourceB,
  ]).split(" ")
  if (
    ancestry.length !== 2 ||
    ancestry[0] !== sourceB ||
    ancestry[1] !== sourceA
  )
    fail("V138_SUCCESSOR_SEAL_B_PARENT_INVALID")
  try {
    execFileSync("git", ["merge-base", "--is-ancestor", sourceA, sourceB], {
      cwd: input.repoRoot,
      stdio: "ignore",
    })
  } catch {
    fail("V138_SUCCESSOR_SEAL_B_NOT_DESCENDANT")
  }
  const changed = sorted(
    gitText(input.repoRoot, [
      "diff-tree",
      "--no-commit-id",
      "--name-only",
      "-r",
      "--no-renames",
      sourceB,
    ])
      .split("\n")
      .filter(Boolean),
  )
  if (
    canonical(changed) !==
    canonical([CANONICAL_PATHS.authorization, CANONICAL_PATHS.seal])
  ) {
    fail("V138_SUCCESSOR_SEAL_B_DELTA_INVALID")
  }
  for (const repoPath of changed) {
    if (
      gitText(input.repoRoot, ["cat-file", "-t", `${sourceB}:${repoPath}`]) !==
      "blob"
    ) {
      fail("V138_SUCCESSOR_SEAL_B_BLOB_INVALID")
    }
  }
  const authorizationBytes = readCommitFile(
    input.repoRoot,
    sourceB,
    CANONICAL_PATHS.authorization,
  )
  const sealBytes = readCommitFile(
    input.repoRoot,
    sourceB,
    CANONICAL_PATHS.seal,
  )
  const blobs = [
    {
      path: CANONICAL_PATHS.authorization,
      blobOid: gitText(input.repoRoot, [
        "rev-parse",
        `${sourceB}:${CANONICAL_PATHS.authorization}`,
      ]),
      byteLength: authorizationBytes.byteLength,
      sha256: sha256(authorizationBytes),
    },
    {
      path: CANONICAL_PATHS.seal,
      blobOid: gitText(input.repoRoot, [
        "rev-parse",
        `${sourceB}:${CANONICAL_PATHS.seal}`,
      ]),
      byteLength: sealBytes.byteLength,
      sha256: sha256(sealBytes),
    },
  ]
  const custodyBody = {
    schemaVersion: "v1.38-source-b-custody-v1" as const,
    sourceA,
    sourceB,
    sourceBTree: gitText(input.repoRoot, ["rev-parse", `${sourceB}^{tree}`]),
    sourceBParent: sourceA,
    changedPaths: Object.freeze([...changed]),
    blobs: Object.freeze(blobs.map((record) => Object.freeze(record))),
  }
  const custody = Object.freeze({
    ...custodyBody,
    custodyRoot: identityRoot(
      "containmentPolicy",
      custodyBody.schemaVersion,
      custodyBody,
    ),
  })
  const workingAuthorizationBytes = regularFile(
    path.resolve(input.repoRoot, CANONICAL_PATHS.authorization),
    "required",
  )!
  const workingSealBytes = regularFile(
    path.resolve(input.repoRoot, CANONICAL_PATHS.seal),
    "required",
  )!
  const cacheKey = `${path.resolve(input.repoRoot)}\0${sourceA}\0${sourceB}`
  const cached = checkedSuccessorSealCommits.get(cacheKey)
  if (cached !== undefined) {
    if (
      !workingAuthorizationBytes.equals(cached.authorizationBytes) ||
      !workingSealBytes.equals(cached.sealBytes)
    )
      fail("V138_SUCCESSOR_SEAL_B_WORKTREE_DRIFT")
    return cached.custody
  }
  if (
    workingAuthorizationBytes.byteLength !== authorizationBytes.byteLength ||
    sha256(workingAuthorizationBytes) !== sha256(authorizationBytes) ||
    !workingAuthorizationBytes.equals(authorizationBytes) ||
    workingSealBytes.byteLength !== sealBytes.byteLength ||
    sha256(workingSealBytes) !== sha256(sealBytes) ||
    !workingSealBytes.equals(sealBytes)
  )
    fail("V138_SUCCESSOR_SEAL_B_WORKTREE_DRIFT")
  const authorization: unknown = JSON.parse(authorizationBytes.toString("utf8"))
  const seal: unknown = JSON.parse(sealBytes.toString("utf8"))
  const checkedAuthorization = checkV138Plan26215Authorization(
    input.repoRoot,
    authorization,
  )
  const checkedSeal = checkV138SuccessorSourceSeal(
    input.repoRoot,
    seal,
    checkedAuthorization,
  )
  if (
    !authorizationBytes.equals(Buffer.from(canonical(checkedAuthorization)))
  ) {
    fail("V138_SUCCESSOR_SEAL_B_AUTHORIZATION_BYTES_INVALID")
  }
  if (!sealBytes.equals(Buffer.from(canonical(checkedSeal)))) {
    fail("V138_SUCCESSOR_SEAL_B_SEAL_BYTES_INVALID")
  }
  if (
    checkedAuthorization.sourceA !== sourceA ||
    checkedSeal.sourceCustody.sourceA !== sourceA
  )
    fail("V138_SUCCESSOR_SEAL_B_BYTES_INVALID")
  try {
    gitText(input.repoRoot, [
      "cat-file",
      "-e",
      `${sourceB}:${CANONICAL_PATHS.terminal}`,
    ])
    fail("V138_SUCCESSOR_SEAL_TERMINAL_PRESENT_AT_B")
  } catch (error) {
    if (error instanceof TypeError) throw error
  }
  try {
    gitText(input.repoRoot, [
      "cat-file",
      "-e",
      `${sourceA}:${CANONICAL_PATHS.seal}`,
    ])
    fail("V138_SUCCESSOR_SEAL_EXISTED_AT_A")
  } catch (error) {
    if (error instanceof TypeError) throw error
  }
  checkedSuccessorSealCommits.set(
    cacheKey,
    Object.freeze({
      authorizationBytes: Buffer.from(authorizationBytes),
      sealBytes: Buffer.from(sealBytes),
      custody,
    }),
  )
  return custody
}

const canonicalPath = (
  repoRoot: string,
  supplied: string,
  expected: string,
): string => {
  const resolved = path.resolve(repoRoot, supplied)
  if (resolved !== path.resolve(repoRoot, expected)) {
    fail("V138_PLAN_262_15_CANONICAL_PATH_REQUIRED")
  }
  validateV138CanonicalParentChain(repoRoot, resolved)
  return resolved
}

export interface V138CanonicalParentChain {
  readonly repoRoot: string
  readonly target: string
  readonly parent: string
  readonly directories: readonly Readonly<{
    path: string
    device: number
    inode: number
    mode: number
  }>[]
}

const inspectNoFollowDirectory = (
  directoryPath: string,
): V138CanonicalParentChain["directories"][number] => {
  try {
    const linked = lstatSync(directoryPath)
    if (!linked.isDirectory() || linked.isSymbolicLink()) {
      fail("V138_CANONICAL_PARENT_CHAIN_INVALID")
    }
    const descriptor = openSync(
      directoryPath,
      constants.O_RDONLY |
        (constants.O_DIRECTORY ?? 0) |
        (constants.O_NOFOLLOW ?? 0),
    )
    try {
      const opened = fstatSync(descriptor)
      if (
        !opened.isDirectory() ||
        opened.dev !== linked.dev ||
        opened.ino !== linked.ino
      ) {
        fail("V138_CANONICAL_PARENT_CHAIN_IDENTITY_INVALID")
      }
      return Object.freeze({
        path: directoryPath,
        device: opened.dev,
        inode: opened.ino,
        mode: opened.mode,
      })
    } finally {
      closeSync(descriptor)
    }
  } catch (error) {
    if (error instanceof TypeError) throw error
    fail("V138_CANONICAL_PARENT_CHAIN_INVALID")
  }
}

export const validateV138CanonicalParentChain = (
  repoRootInput: string,
  targetInput: string,
): Readonly<V138CanonicalParentChain> => {
  const repoRoot = path.resolve(repoRootInput)
  const target = path.resolve(repoRoot, targetInput)
  const relative = path.relative(repoRoot, target)
  if (
    relative.length === 0 ||
    path.isAbsolute(relative) ||
    relative === ".." ||
    relative.startsWith(`..${path.sep}`)
  ) {
    fail("V138_CANONICAL_PATH_OUTSIDE_REPOSITORY")
  }
  const parent = path.dirname(target)
  const parentRelative = path.relative(repoRoot, parent)
  const directories = [repoRoot]
  if (parentRelative.length !== 0) {
    let current = repoRoot
    for (const component of parentRelative.split(path.sep)) {
      if (component.length === 0 || component === "." || component === "..") {
        fail("V138_CANONICAL_PARENT_CHAIN_INVALID")
      }
      current = path.join(current, component)
      directories.push(current)
    }
  }
  const inspected = directories.map(inspectNoFollowDirectory)
  return Object.freeze({
    repoRoot,
    target,
    parent,
    directories: Object.freeze(inspected),
  })
}

export const checkV138CanonicalParentChain = (
  chain: Readonly<V138CanonicalParentChain>,
): true => {
  const checked = validateV138CanonicalParentChain(chain.repoRoot, chain.target)
  if (canonical(checked) !== canonical(chain)) {
    fail("V138_CANONICAL_PARENT_CHAIN_REPLACED")
  }
  return true
}

const regularFile = (
  target: string,
  expectation: "required" | "absent" | "optional",
): Buffer | undefined => {
  try {
    const stat = lstatSync(target)
    if (!stat.isFile() || stat.isSymbolicLink()) {
      fail("V138_PLAN_262_15_ARTIFACT_TYPE_INVALID")
    }
    if (expectation === "absent") {
      fail("V138_PLAN_262_15_ARTIFACT_MUST_BE_ABSENT")
    }
    const descriptor = openSync(
      target,
      constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0),
    )
    try {
      const opened = fstatSync(descriptor)
      if (
        !opened.isFile() ||
        opened.dev !== stat.dev ||
        opened.ino !== stat.ino ||
        opened.size > 16 * 1024 * 1024
      ) {
        fail("V138_PLAN_262_15_ARTIFACT_IDENTITY_INVALID")
      }
      return readFileSync(descriptor)
    } finally {
      closeSync(descriptor)
    }
  } catch (error) {
    if (
      error instanceof TypeError ||
      (error as NodeJS.ErrnoException).code !== "ENOENT"
    ) {
      throw error
    }
    if (expectation === "required") {
      fail("V138_PLAN_262_15_ARTIFACT_REQUIRED")
    }
    return undefined
  }
}

export const readV138RepositoryFileNoFollow = (
  repoRoot: string,
  target: string,
  expectation: "required" | "absent" | "optional",
): Buffer | undefined => {
  const parentChain = validateV138CanonicalParentChain(repoRoot, target)
  try {
    return regularFile(parentChain.target, expectation)
  } finally {
    checkV138CanonicalParentChain(parentChain)
  }
}

type V138ScopedFileCodes = Readonly<{
  required: string
  absent: string
  invalid: string
}>

const regularFileScoped = (
  target: string,
  expectation: "required" | "absent",
  codes: V138ScopedFileCodes,
): Buffer | undefined => {
  try {
    const stat = lstatSync(target)
    if (!stat.isFile() || stat.isSymbolicLink()) fail(codes.invalid)
    if (expectation === "absent") fail(codes.absent)
    const descriptor = openSync(
      target,
      constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0),
    )
    try {
      const opened = fstatSync(descriptor)
      if (!opened.isFile() || opened.dev !== stat.dev ||
        opened.ino !== stat.ino || opened.size > 16 * 1024 * 1024) {
        fail(codes.invalid)
      }
      return readFileSync(descriptor)
    } finally {
      closeSync(descriptor)
    }
  } catch (error) {
    if (error instanceof TypeError ||
      (error as NodeJS.ErrnoException).code !== "ENOENT") throw error
    if (expectation === "required") fail(codes.required)
    return undefined
  }
}

const writeCanonicalExclusive = (
  repoRoot: string,
  target: string,
  value: unknown,
): void => {
  const bytes = Buffer.from(canonical(value), "utf8")
  const parentChain = validateV138CanonicalParentChain(repoRoot, target)
  let published: ReturnType<typeof fstatSync>
  const descriptor = openSync(
    target,
    constants.O_CREAT |
      constants.O_EXCL |
      constants.O_WRONLY |
      (constants.O_NOFOLLOW ?? 0),
    0o600,
  )
  try {
    checkV138CanonicalParentChain(parentChain)
    writeFileSync(descriptor, bytes)
    fsyncSync(descriptor)
    published = fstatSync(descriptor)
    checkV138CanonicalParentChain(parentChain)
  } finally {
    closeSync(descriptor)
  }
  const checkDescriptor = openSync(
    target,
    constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0),
  )
  try {
    checkV138CanonicalParentChain(parentChain)
    const checked = fstatSync(checkDescriptor)
    const checkedBytes = readFileSync(checkDescriptor)
    if (
      checked.dev !== published!.dev ||
      checked.ino !== published!.ino ||
      !checkedBytes.equals(bytes)
    ) {
      fail("V138_PLAN_262_15_READBACK_FAILED")
    }
    checkV138CanonicalParentChain(parentChain)
  } finally {
    closeSync(checkDescriptor)
  }
}

export interface V138CanonicalPublicationV2Options {
  write?: (descriptor: number, bytes: Uint8Array) => void
  fsyncFile?: (descriptor: number) => void
  link?: (temporaryPath: string, targetPath: string) => void
  fsyncDirectory?: (
    descriptor: number,
    phase: "publish" | "cleanup" | "rollback",
  ) => void
  readback?: (descriptor: number) => Buffer
  unlink?: (targetPath: string, kind: "temporary" | "rollback") => void
}

export const writeV138CanonicalExclusiveV2 = (
  repoRoot: string,
  target: string,
  value: unknown,
  options: V138CanonicalPublicationV2Options = {},
): void => {
  const bytes = Buffer.from(canonical(value), "utf8")
  const parentChain = validateV138CanonicalParentChain(repoRoot, target)
  const temporaryPath = path.join(
    path.dirname(target),
    `.${path.basename(target)}.${process.pid}.${randomBytes(16).toString("hex")}.tmp`,
  )
  let descriptor: number | undefined
  let linked = false
  let failure: unknown
  const syncDirectory = (phase: "publish" | "cleanup" | "rollback") => {
    const directoryDescriptor = openSync(path.dirname(target), "r")
    try {
      ;(options.fsyncDirectory ?? ((fd) => fsyncSync(fd)))(
        directoryDescriptor,
        phase,
      )
    } finally {
      closeSync(directoryDescriptor)
    }
  }
  try {
    descriptor = openSync(
      temporaryPath,
      constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY |
        (constants.O_NOFOLLOW ?? 0),
      0o600,
    )
    ;(options.write ?? ((fd, complete) => writeFileSync(fd, complete)))(
      descriptor,
      bytes,
    )
    ;(options.fsyncFile ?? fsyncSync)(descriptor)
    closeSync(descriptor)
    descriptor = undefined
    checkV138CanonicalParentChain(parentChain)
    ;(options.link ?? linkSync)(temporaryPath, target)
    linked = true
    syncDirectory("publish")
    const checkDescriptor = openSync(
      target,
      constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0),
    )
    try {
      const checked = (options.readback ?? readFileSync)(checkDescriptor)
      if (!checked.equals(bytes)) fail("V138_V2_PUBLICATION_READBACK_FAILED")
    } finally {
      closeSync(checkDescriptor)
    }
    checkV138CanonicalParentChain(parentChain)
  } catch (error) {
    failure = error
  } finally {
    if (descriptor !== undefined) {
      try {
        closeSync(descriptor)
      } catch (error) {
        failure ??= error
      }
    }
    let temporaryRemoved = false
    try {
      ;(options.unlink ?? ((candidate) => unlinkSync(candidate)))(
        temporaryPath,
        "temporary",
      )
      temporaryRemoved = true
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") failure ??= error
    }
    if (temporaryRemoved) {
      try {
        syncDirectory("cleanup")
      } catch (error) {
        failure ??= error
      }
    }
  }
  if (failure !== undefined && linked) {
    try {
      ;(options.unlink ?? ((candidate) => unlinkSync(candidate)))(
        target,
        "rollback",
      )
      syncDirectory("rollback")
      // The rollback is not durable evidence unless the originally validated
      // parent chain is still the chain whose directory entry was synced.
      checkV138CanonicalParentChain(parentChain)
      linked = false
    } catch (rollbackError) {
      throw new AggregateError(
        [failure, rollbackError],
        "V138_V2_PUBLICATION_ROLLBACK_INDETERMINATE",
      )
    }
  }
  if (failure !== undefined) throw failure
}

export const writeV138Plan26215Authorization = (
  repoRoot: string,
  targetPath: string,
  sourceA: string,
  literalBytes: Uint8Array,
): Readonly<V138Plan26215Authorization> => {
  const target = canonicalPath(
    repoRoot,
    targetPath,
    CANONICAL_PATHS.authorization,
  )
  const authorization = buildV138Plan26215Authorization(
    repoRoot,
    sourceA,
    literalBytes,
  )
  writeCanonicalExclusive(repoRoot, target, authorization)
  return authorization
}

export const writeV138SuccessorSourceSeal = (
  repoRoot: string,
  targetPath: string,
  seal: unknown,
  authorization: unknown,
): Readonly<V138SuccessorSourceSeal> => {
  const target = canonicalPath(repoRoot, targetPath, CANONICAL_PATHS.seal)
  const checked = checkV138SuccessorSourceSeal(repoRoot, seal, authorization)
  writeCanonicalExclusive(repoRoot, target, checked)
  return checked
}

/*
 * Plan 262-18 successor custody is deliberately a new, parallel contract.
 * The v1 functions above remain byte-semantically frozen because they are
 * still used to verify the expired Plan 262-15/16 route.
 */
export const V138_PLAN_262_18_AUTHORIZATION_SCHEMA =
  "v1.38-plan-262-18-authorization-v2" as const
export const V138_SUCCESSOR_SOURCE_SEAL_V2_SCHEMA =
  "v1.38-successor-source-seal-v2" as const
export const V138_PLAN_262_18_TERMINAL_SCHEMA =
  "v1.38-plan-262-18-terminal-v2" as const
export const V138_PLAN_262_18_EXPIRY =
  "first_seal_refusal_failure_or_plan_262_19_terminal" as const

export const V138_SUCCESSOR_AUTHORIZED_SOURCE_PATHS_V2 = Object.freeze([
  "scripts/evaluate-v1-38-foundation-contract.test.ts",
  "scripts/lib/v1-38-current-matrix-reproduction.ts",
  "scripts/lib/v1-38-successor-source-seal.ts",
] as const)

export const V138_PLAN_262_18_CANONICAL_PATHS = Object.freeze({
  authorization: ".planning/artifacts/v1.38-plan-262-18-authorization-v2.json",
  seal: ".planning/artifacts/v1.38-successor-source-seal-v2.json",
  terminal: ".planning/artifacts/v1.38-plan-262-18-terminal-v2.json",
  review:
    ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-18-REVIEW.md",
  reviewFix:
    ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-18-REVIEW-FIX.md",
  oldAuthorization:
    ".planning/artifacts/v1.38-plan-262-15-authorization-v1.json",
  oldSeal: ".planning/artifacts/v1.38-successor-source-seal-v1.json",
  oldContext:
    ".planning/artifacts/v1.38-current-matrix-execution-context-v5.json",
  oldPreflight:
    ".planning/artifacts/v1.38-current-matrix-headroom-preflight-v5.json",
  oldCalibration:
    ".planning/artifacts/v1.38-current-matrix-calibration-v5.json",
  oldTerminal: ".planning/artifacts/v1.38-plan-262-16-terminal-v1.json",
})

export const V138_PLAN_262_19_FRESH_DESTINATIONS = Object.freeze([
  ".planning/artifacts/v1.38-current-matrix-execution-context-v6.json",
  ".planning/artifacts/v1.38-current-matrix-headroom-preflight-v6.json",
  ".planning/artifacts/v1.38-current-matrix-calibration-v6.json",
  ".planning/artifacts/v1.38-current-matrix-reproduction-v7.json",
  ".planning/artifacts/v1.38-plan-262-19-terminal-v2.json",
  ".planning/artifacts/v1.38-plan-262-19-preflight-consumption-v1.json",
  ".planning/artifacts/v1.38-plan-262-19-calibration-consumption-v1.json",
  ".planning/artifacts/v1.38-plan-262-19-reproduction-consumption-v1.json",
] as const)

const V138_OLD_REPRODUCTION_V6 =
  ".planning/artifacts/v1.38-current-matrix-reproduction-v6.json"
const V138_PREDECESSOR_SOURCE_A = "61d1c470e9a77ffa1f70538cb0c5173f6a792bfa"
const V138_PREDECESSOR_SOURCE_B = "1bfb413192f113ac7949cde676d7b55aea77f4fe"
const V138_PREDECESSOR_AUTHORIZATION_ROOT: Sha256 =
  "sha256:870e317f662d5f869c39c0257dd8e702dd0c8f3c30316bc8fd4c9c0534cc6a00"
const V138_PREDECESSOR_CONTEXT_ROOT: Sha256 =
  "sha256:4a3006c0cd389011f6d7676668bed4cd2b2655958a6dd34901bd79db52dafa2c"
const V138_PREDECESSOR_PREFLIGHT_ROOT: Sha256 =
  "sha256:8b949daede99588f5f3d6bd4cb78147bc19cc3a3d1dc0998ac7308b6fccbdde8"
const V138_PREDECESSOR_CALIBRATION_ROOT: Sha256 =
  "sha256:3c37ae3ef54318de78d2a014bd26b5574ad0bdc530bcccf60456ef70481c1d44"
const V138_PREDECESSOR_TERMINAL_ROOT: Sha256 =
  "sha256:9fa253ddd5ee40d0ef464706172b99425f7ee2dfafd2fe071845daa9bc0a824c"

export const V138_PLAN_262_16_CHARGED_PUBLIC_IDS = Object.freeze(
  Array.from({ length: 8 }, (_, index) => `calibration:v5:${index}`),
)

const V138_PROTECTED_HISTORY_PATHS_V2 = Object.freeze(
  sorted([
    ...PROTECTED_EVIDENCE_PATHS,
    V138_PLAN_262_18_CANONICAL_PATHS.oldAuthorization,
    V138_PLAN_262_18_CANONICAL_PATHS.oldSeal,
    V138_PLAN_262_18_CANONICAL_PATHS.oldContext,
    V138_PLAN_262_18_CANONICAL_PATHS.oldPreflight,
    V138_PLAN_262_18_CANONICAL_PATHS.oldCalibration,
    V138_PLAN_262_18_CANONICAL_PATHS.oldTerminal,
    CANONICAL_PATHS.review,
    CANONICAL_PATHS.reviewFix,
    ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-16-SUMMARY.md",
    ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-17-SUMMARY.md",
    ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-VALIDATION.md",
    ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-VERIFICATION.md",
  ]),
)

export interface V138SourceCustodyA2 {
  readonly schemaVersion: "v1.38-source-a2-custody-v1"
  readonly repairStartHead2: string
  readonly sourceBase2: string
  readonly sourceA2: string
  readonly sourceA2Tree: string
  readonly sourceA2Parents: readonly string[]
  readonly aggregateChangedPaths: readonly string[]
  readonly lineage: readonly Readonly<{
    commit: string
    tree: string
    parents: readonly string[]
    changedPaths: readonly string[]
  }>[]
  readonly sourceBlobs: readonly Readonly<{
    path: (typeof V138_SUCCESSOR_AUTHORIZED_SOURCE_PATHS_V2)[number]
    blobOid: string
    byteLength: number
    sha256: Sha256
  }>[]
  readonly custodyRoot: Sha256
}

const requireAncestor = (
  repoRoot: string,
  ancestor: string,
  descendant: string,
  code: string,
): void => {
  try {
    execFileSync("git", ["merge-base", "--is-ancestor", ancestor, descendant], {
      cwd: repoRoot,
      stdio: "ignore",
    })
  } catch {
    fail(code)
  }
}

export const inspectSourceCustodyA2 = (input: {
  readonly repoRoot: string
  readonly repairStartHead2: string
  readonly sourceBase2: string
  readonly sourceA2: string
}): Readonly<V138SourceCustodyA2> => {
  const repairStartHead2 = fullCommit(input.repoRoot, input.repairStartHead2)
  const sourceBase2 = fullCommit(input.repoRoot, input.sourceBase2)
  const sourceA2 = fullCommit(input.repoRoot, input.sourceA2)
  requireAncestor(
    input.repoRoot,
    repairStartHead2,
    sourceBase2,
    "V138_SOURCE_REPAIR_START_NOT_ANCESTOR",
  )
  requireAncestor(
    input.repoRoot,
    sourceBase2,
    sourceA2,
    "V138_SOURCE_BASE2_NOT_ANCESTOR",
  )
  const aggregateChangedPaths = sorted(
    gitText(input.repoRoot, [
      "diff",
      "--name-only",
      "--no-renames",
      sourceBase2,
      sourceA2,
      "--",
    ])
      .split("\n")
      .filter(Boolean)
      .map(normalize),
  )
  const authorized = new Set<string>(V138_SUCCESSOR_AUTHORIZED_SOURCE_PATHS_V2)
  if (
    aggregateChangedPaths.length === 0 ||
    aggregateChangedPaths.some((repoPath) => !authorized.has(repoPath))
  )
    fail("V138_SOURCE_A2_AGGREGATE_DELTA_INVALID")
  const commitRecord = (commit: string) => {
    const fields = gitText(input.repoRoot, [
      "show",
      "-s",
      "--format=%H%n%T%n%P",
      commit,
    ]).split("\n")
    return Object.freeze({
      commit: fields[0]!,
      tree: fields[1]!,
      parents: Object.freeze(fields[2]!.split(" ").filter(Boolean)),
      changedPaths: Object.freeze(
        sorted(
          gitText(input.repoRoot, [
            "diff-tree",
            "--root",
            "--no-commit-id",
            "--name-only",
            "-r",
            "--no-renames",
            commit,
          ])
            .split("\n")
            .filter(Boolean)
            .map(normalize),
        ),
      ),
    })
  }
  const lineage = gitText(input.repoRoot, [
    "rev-list",
    "--reverse",
    "--topo-order",
    `${sourceBase2}..${sourceA2}`,
  ])
    .split("\n")
    .filter(Boolean)
    .map(commitRecord)
  if (
    lineage.length === 0 ||
    lineage.some(
      (record) =>
        record.changedPaths.length === 0 ||
        record.changedPaths.some((repoPath) => !authorized.has(repoPath)),
    )
  )
    fail("V138_SOURCE_A2_LINEAGE_PATH_INVALID")
  const sourceBlobs = V138_SUCCESSOR_AUTHORIZED_SOURCE_PATHS_V2.map(
    (repoPath) =>
      Object.freeze({
        ...blobRecord(input.repoRoot, sourceA2, repoPath),
        path: repoPath,
      }),
  )
  const sourceA2Record = commitRecord(sourceA2)
  const body = {
    schemaVersion: "v1.38-source-a2-custody-v1" as const,
    repairStartHead2,
    sourceBase2,
    sourceA2,
    sourceA2Tree: sourceA2Record.tree,
    sourceA2Parents: sourceA2Record.parents,
    aggregateChangedPaths: Object.freeze(aggregateChangedPaths),
    lineage: Object.freeze(lineage),
    sourceBlobs: Object.freeze(sourceBlobs),
  }
  return Object.freeze({
    ...body,
    custodyRoot: identityRoot("containmentPolicy", body.schemaVersion, body),
  })
}

export const checkV138SourceCheckoutAtA2 = (
  repoRoot: string,
  sourceA2Input: string,
): true => {
  const sourceA2 = fullCommit(repoRoot, sourceA2Input)
  try {
    execFileSync(
      "git",
      [
        "diff",
        "--quiet",
        sourceA2,
        "--",
        ...V138_SUCCESSOR_AUTHORIZED_SOURCE_PATHS_V2,
      ],
      { cwd: repoRoot, stdio: "ignore" },
    )
  } catch {
    fail("V138_SOURCE_A2_CHECKOUT_DRIFT")
  }
  return true
}

type ReviewMetadataV2 = Readonly<{
  repairStartHead2: string
  sourceBase2: string
  sourceA2: string
  fixesApplied: boolean
}>

const frontmatterScalars = (bytes: Uint8Array, code: string) => {
  const match = /^---\n([\s\S]*?)\n---(?:\n|$)/u.exec(
    Buffer.from(bytes).toString("utf8"),
  )
  const frontmatter = match?.[1]
  if (frontmatter === undefined) throw new TypeError(code)
  const values = new Map<string, string>()
  let parent = ""
  for (const line of frontmatter.split("\n")) {
    const nested = /^  ([a-z0-9_]+):\s*(.*?)\s*$/u.exec(line)
    const scalar = /^([a-z0-9_]+):\s*(.*?)\s*$/u.exec(line)
    if (nested !== null && parent !== "") {
      const key = `${parent}.${nested[1]}`
      if (values.has(key)) fail(code)
      values.set(key, nested[2]!)
    } else if (scalar !== null) {
      if (values.has(scalar[1]!)) fail(code)
      values.set(scalar[1]!, scalar[2]!)
      parent = scalar[2] === "" ? scalar[1]! : ""
    }
  }
  return values
}

const frontmatterList = (
  bytes: Uint8Array,
  listKey: string,
  code: string,
): readonly string[] => {
  const match = /^---\n([\s\S]*?)\n---(?:\n|$)/u.exec(
    Buffer.from(bytes).toString("utf8"),
  )
  const frontmatter = match?.[1]
  if (frontmatter === undefined) throw new TypeError(code)
  const header = `${listKey}:`
  const items: string[] = []
  let found = false
  let collecting = false
  for (const line of frontmatter.split("\n")) {
    if (line === header) {
      if (found) fail(code)
      found = true
      collecting = true
      continue
    }
    if (!collecting) continue
    const item = /^  - (\S(?:.*\S)?)$/u.exec(line)
    if (item !== null) {
      items.push(item[1]!)
      continue
    }
    if (line.length === 0 || /^\S/u.test(line)) {
      collecting = false
      continue
    }
    fail(code)
  }
  if (!found) fail(code)
  return Object.freeze(items)
}

const strictReviewMetadataV2 = (bytes: Uint8Array): ReviewMetadataV2 => {
  const values = frontmatterScalars(bytes, "V138_PLAN_262_18_REVIEW_INVALID")
  const reviewedPaths = frontmatterList(
    bytes,
    "files_reviewed_list",
    "V138_PLAN_262_18_REVIEW_INVALID",
  )
  const repairStartHead2 = values.get("repair_start_head2") ?? ""
  const sourceBase2 = values.get("source_base2") ?? ""
  const sourceA2 = values.get("source_a2") ?? ""
  const fixes = values.get("fixes_applied") ?? ""
  if (
    values.get("plan") !== "18" ||
    values.get("depth") !== "deep" ||
    values.get("status") !== "clean" ||
    values.get("files_reviewed") !== "3" ||
    values.get("findings.critical") !== "0" ||
    values.get("findings.warning") !== "0" ||
    values.get("findings.info") !== "0" ||
    values.get("findings.total") !== "0" ||
    reviewedPaths.length !== V138_SUCCESSOR_AUTHORIZED_SOURCE_PATHS_V2.length ||
    canonical(sorted(reviewedPaths)) !==
      canonical(sorted(V138_SUCCESSOR_AUTHORIZED_SOURCE_PATHS_V2)) ||
    !/^[0-9a-f]{40}$/u.test(repairStartHead2) ||
    !/^[0-9a-f]{40}$/u.test(sourceBase2) ||
    !/^[0-9a-f]{40}$/u.test(sourceA2) ||
    (fixes !== "true" && fixes !== "false")
  )
    fail("V138_PLAN_262_18_REVIEW_NOT_CLEAN")
  return Object.freeze({
    repairStartHead2,
    sourceBase2,
    sourceA2,
    fixesApplied: fixes === "true",
  })
}

const strictFixMetadataV2 = (bytes: Uint8Array, sourceA2: string): void => {
  const values = frontmatterScalars(
    bytes,
    "V138_PLAN_262_18_REVIEW_FIX_INVALID",
  )
  if (
    values.get("status") !== "all_fixed" ||
    values.get("skipped") !== "0" ||
    values.get("final_source_a2") !== sourceA2
  )
    fail("V138_PLAN_262_18_REVIEW_FIX_INVALID")
}

export const checkV138ReviewedSourceA2 = (input: {
  readonly repoRoot: string
  readonly repairStartHead2: string
  readonly sourceBase2: string
  readonly sourceA2: string
  readonly reviewPath: string
  readonly reviewFixPath: string
}): Readonly<V138SourceCustodyA2> => {
  const reviewPath = canonicalPath(
    input.repoRoot,
    input.reviewPath,
    V138_PLAN_262_18_CANONICAL_PATHS.review,
  )
  const reviewFixPath = canonicalPath(
    input.repoRoot,
    input.reviewFixPath,
    V138_PLAN_262_18_CANONICAL_PATHS.reviewFix,
  )
  const metadata = strictReviewMetadataV2(regularFile(reviewPath, "required")!)
  if (
    metadata.repairStartHead2 !== input.repairStartHead2 ||
    metadata.sourceBase2 !== input.sourceBase2 ||
    metadata.sourceA2 !== input.sourceA2
  )
    fail("V138_PLAN_262_18_REVIEW_SOURCE_JOIN_INVALID")
  const fix = regularFile(
    reviewFixPath,
    metadata.fixesApplied ? "required" : "absent",
  )
  if (fix !== undefined) strictFixMetadataV2(fix, input.sourceA2)
  return inspectSourceCustodyA2(input)
}

type V138ProtectedHistoryV2 = Readonly<{
  schemaVersion: "v1.38-protected-stopped-history-v2"
  predecessorSourceA: string
  predecessorSourceB: string
  artifacts: readonly ReturnType<typeof blobRecord>[]
  predecessorRoots: Readonly<{
    authorizationRoot: Sha256
    contextRoot: Sha256
    preflightRoot: Sha256
    calibrationRoot: Sha256
    terminalRoot: Sha256
  }>
  chargedPublicAttemptIds: readonly string[]
  acceptedEvidenceCount: 0
  oldProjectionInterpretation: Readonly<{
    immutable: true
    shardIdIsPhysicalFact: false
    childLaunchedIsPhysicalFact: false
    childLaunchCountIsPhysicalFact: false
  }>
  oldReproductionV6Absent: true
  protectedHistoryRoot: Sha256
}>

const parseCommitJson = (
  repoRoot: string,
  sourceA2: string,
  repoPath: string,
): Record<string, unknown> => {
  const value: unknown = JSON.parse(
    readCommitFile(repoRoot, sourceA2, repoPath).toString("utf8"),
  )
  if (!isRecord(value)) fail("V138_PROTECTED_HISTORY_SCHEMA_INVALID")
  return value as Record<string, unknown>
}

const requireAbsentAtCommit = (
  repoRoot: string,
  commit: string,
  repoPath: string,
  code: string,
): void => {
  try {
    execFileSync("git", ["cat-file", "-e", `${commit}:${repoPath}`], {
      cwd: repoRoot,
      stdio: "ignore",
    })
    fail(code)
  } catch (error) {
    if (error instanceof TypeError) throw error
  }
}

export const deriveV138ProtectedHistoryV2 = (
  repoRoot: string,
  sourceA2Input: string,
): V138ProtectedHistoryV2 => {
  const sourceA2 = fullCommit(repoRoot, sourceA2Input)
  const oldAuthorization = parseCommitJson(
    repoRoot,
    sourceA2,
    V138_PLAN_262_18_CANONICAL_PATHS.oldAuthorization,
  )
  const oldContext = parseCommitJson(
    repoRoot,
    sourceA2,
    V138_PLAN_262_18_CANONICAL_PATHS.oldContext,
  )
  const oldPreflight = parseCommitJson(
    repoRoot,
    sourceA2,
    V138_PLAN_262_18_CANONICAL_PATHS.oldPreflight,
  )
  const oldCalibration = parseCommitJson(
    repoRoot,
    sourceA2,
    V138_PLAN_262_18_CANONICAL_PATHS.oldCalibration,
  )
  const oldTerminal = parseCommitJson(
    repoRoot,
    sourceA2,
    V138_PLAN_262_18_CANONICAL_PATHS.oldTerminal,
  )
  if (
    oldAuthorization.authorizationRoot !==
      V138_PREDECESSOR_AUTHORIZATION_ROOT ||
    oldContext.receiptRoot !== V138_PREDECESSOR_CONTEXT_ROOT ||
    oldPreflight.receiptRoot !== V138_PREDECESSOR_PREFLIGHT_ROOT ||
    oldCalibration.receiptRoot !== V138_PREDECESSOR_CALIBRATION_ROOT ||
    oldTerminal.terminalRoot !== V138_PREDECESSOR_TERMINAL_ROOT ||
    oldCalibration.chargedAttemptCount !== 8 ||
    oldCalibration.acceptedCellCount !== 0 ||
    !Array.isArray(oldCalibration.chargedAttempts) ||
    canonical(
      oldCalibration.chargedAttempts.map((attempt) =>
        isRecord(attempt) ? attempt.attemptId : null,
      ),
    ) !== canonical(V138_PLAN_262_16_CHARGED_PUBLIC_IDS)
  )
    fail("V138_PROTECTED_HISTORY_ROOT_OR_CHARGE_INVALID")
  const oldSeal = parseCommitJson(
    repoRoot,
    sourceA2,
    V138_PLAN_262_18_CANONICAL_PATHS.oldSeal,
  )
  if (
    oldSeal.sourceCustody === null ||
    !isRecord(oldSeal.sourceCustody) ||
    oldSeal.sourceCustody.sourceA !== V138_PREDECESSOR_SOURCE_A
  )
    fail("V138_PROTECTED_HISTORY_SOURCE_A_INVALID")
  const oldContextCustody = oldContext.sourceBCustody
  if (
    oldContext.sourceB !== V138_PREDECESSOR_SOURCE_B ||
    !isRecord(oldContextCustody) ||
    oldContextCustody.sourceA !== V138_PREDECESSOR_SOURCE_A ||
    oldContextCustody.sourceB !== V138_PREDECESSOR_SOURCE_B
  )
    fail("V138_PROTECTED_HISTORY_SOURCE_B_INVALID")
  requireAbsentAtCommit(
    repoRoot,
    sourceA2,
    V138_OLD_REPRODUCTION_V6,
    "V138_OLD_REPRODUCTION_V6_PRESENT",
  )
  const artifacts = V138_PROTECTED_HISTORY_PATHS_V2.map((repoPath) =>
    blobRecord(repoRoot, sourceA2, repoPath),
  )
  const body = {
    schemaVersion: "v1.38-protected-stopped-history-v2" as const,
    predecessorSourceA: V138_PREDECESSOR_SOURCE_A,
    predecessorSourceB: V138_PREDECESSOR_SOURCE_B,
    artifacts: Object.freeze(artifacts),
    predecessorRoots: Object.freeze({
      authorizationRoot: V138_PREDECESSOR_AUTHORIZATION_ROOT,
      contextRoot: V138_PREDECESSOR_CONTEXT_ROOT,
      preflightRoot: V138_PREDECESSOR_PREFLIGHT_ROOT,
      calibrationRoot: V138_PREDECESSOR_CALIBRATION_ROOT,
      terminalRoot: V138_PREDECESSOR_TERMINAL_ROOT,
    }),
    chargedPublicAttemptIds: V138_PLAN_262_16_CHARGED_PUBLIC_IDS,
    acceptedEvidenceCount: 0 as const,
    oldProjectionInterpretation: Object.freeze({
      immutable: true as const,
      shardIdIsPhysicalFact: false as const,
      childLaunchedIsPhysicalFact: false as const,
      childLaunchCountIsPhysicalFact: false as const,
    }),
    oldReproductionV6Absent: true as const,
  }
  return Object.freeze({
    ...body,
    protectedHistoryRoot: identityRoot(
      "evidenceBundle",
      body.schemaVersion,
      body,
    ),
  })
}

const requireFreshDestinations = (
  repoRoot: string,
  expectation: Readonly<{
    authorization: "required" | "absent" | "optional"
    seal: "required" | "absent" | "optional"
    terminal: "required" | "absent" | "optional"
  }>,
): void => {
  regularFile(
    path.resolve(repoRoot, V138_PLAN_262_18_CANONICAL_PATHS.authorization),
    expectation.authorization,
  )
  regularFile(
    path.resolve(repoRoot, V138_PLAN_262_18_CANONICAL_PATHS.seal),
    expectation.seal,
  )
  regularFile(
    path.resolve(repoRoot, V138_PLAN_262_18_CANONICAL_PATHS.terminal),
    expectation.terminal,
  )
  for (const repoPath of V138_PLAN_262_19_FRESH_DESTINATIONS) {
    regularFile(path.resolve(repoRoot, repoPath), "absent")
  }
  regularFile(path.resolve(repoRoot, V138_OLD_REPRODUCTION_V6), "absent")
}

const deriveReviewRootsV2 = (
  repoRoot: string,
  sourceA2: string,
): readonly Readonly<{ path: string; sha256: Sha256 }>[] => {
  const reviewBytes = regularFile(
    path.resolve(repoRoot, V138_PLAN_262_18_CANONICAL_PATHS.review),
    "required",
  )!
  const metadata = strictReviewMetadataV2(reviewBytes)
  if (metadata.sourceA2 !== sourceA2) {
    fail("V138_PLAN_262_18_REVIEW_SOURCE_JOIN_INVALID")
  }
  const roots: Array<{ path: string; sha256: Sha256 }> = [
    {
      path: V138_PLAN_262_18_CANONICAL_PATHS.review,
      sha256: sha256(reviewBytes),
    },
  ]
  const fix = regularFile(
    path.resolve(repoRoot, V138_PLAN_262_18_CANONICAL_PATHS.reviewFix),
    metadata.fixesApplied ? "required" : "absent",
  )
  if (fix !== undefined) {
    strictFixMetadataV2(fix, sourceA2)
    roots.push({
      path: V138_PLAN_262_18_CANONICAL_PATHS.reviewFix,
      sha256: sha256(fix),
    })
  }
  return Object.freeze(roots.map((record) => Object.freeze(record)))
}

export interface V138Plan26218AuthorizationV2 {
  readonly schemaVersion: typeof V138_PLAN_262_18_AUTHORIZATION_SCHEMA
  readonly routeOrdinal: 2
  readonly operator: typeof V138_PLAN_262_15_OPERATOR
  readonly sourceCustody: Readonly<V138SourceCustodyA2>
  readonly selectedRouteClosureRoot: Sha256
  readonly protectedHistoryRoot: Sha256
  readonly predecessorSourceA: string
  readonly predecessorSourceB: string
  readonly predecessorAuthorizationRoot: Sha256
  readonly predecessorContextRoot: Sha256
  readonly predecessorPreflightRoot: Sha256
  readonly predecessorCalibrationRoot: Sha256
  readonly predecessorTerminalRoot: Sha256
  readonly chargedPublicAttemptIds: readonly string[]
  readonly oldReproductionV6Absent: true
  readonly canonicalDestinations: readonly string[]
  readonly frozenPolicyRoot: Sha256
  readonly literalSha256: Sha256
  readonly sealCount: 1
  readonly contextCount: 1
  readonly preflightCount: 1
  readonly calibrationAllocationCount: 1
  readonly calibrationAttemptCount: 8
  readonly calibrationShardCount: 4
  readonly reproductionMaximumCount: 1
  readonly reproductionCellCount: 540
  readonly singleUse: true
  readonly noRetry: true
  readonly noOldAuthorizationReuse: true
  readonly noExecutionBeforeCheckedB2: true
  readonly expiresAt: typeof V138_PLAN_262_18_EXPIRY
  readonly authorizationRoot: Sha256
}

const AUTHORIZATION_V2_KEYS = [
  "schemaVersion",
  "routeOrdinal",
  "operator",
  "sourceCustody",
  "selectedRouteClosureRoot",
  "protectedHistoryRoot",
  "predecessorSourceA",
  "predecessorSourceB",
  "predecessorAuthorizationRoot",
  "predecessorContextRoot",
  "predecessorPreflightRoot",
  "predecessorCalibrationRoot",
  "predecessorTerminalRoot",
  "chargedPublicAttemptIds",
  "oldReproductionV6Absent",
  "canonicalDestinations",
  "frozenPolicyRoot",
  "literalSha256",
  "sealCount",
  "contextCount",
  "preflightCount",
  "calibrationAllocationCount",
  "calibrationAttemptCount",
  "calibrationShardCount",
  "reproductionMaximumCount",
  "reproductionCellCount",
  "singleUse",
  "noRetry",
  "noOldAuthorizationReuse",
  "noExecutionBeforeCheckedB2",
  "expiresAt",
  "authorizationRoot",
] as const

const frozenPolicyRootV2 = (): Sha256 =>
  identityRoot(
    "containmentPolicy",
    "v1.38-frozen-policy-v1",
    deriveFrozenPolicy(),
  )

const plan26218AuthorizedDestinations = (): readonly string[] =>
  Object.freeze([
    V138_PLAN_262_18_CANONICAL_PATHS.authorization,
    V138_PLAN_262_18_CANONICAL_PATHS.seal,
    V138_PLAN_262_18_CANONICAL_PATHS.terminal,
    ...V138_PLAN_262_19_FRESH_DESTINATIONS,
  ])

export const v138Plan26218AuthorizationLiteral = (
  repoRoot: string,
  sourceA2Input: string,
): string => {
  const sourceA2 = fullCommit(repoRoot, sourceA2Input)
  const review = strictReviewMetadataV2(
    regularFile(
      path.resolve(repoRoot, V138_PLAN_262_18_CANONICAL_PATHS.review),
      "required",
    )!,
  )
  if (review.sourceA2 !== sourceA2) {
    fail("V138_PLAN_262_18_REVIEW_SOURCE_JOIN_INVALID")
  }
  const custody = inspectSourceCustodyA2({
    repoRoot,
    repairStartHead2: review.repairStartHead2,
    sourceBase2: review.sourceBase2,
    sourceA2,
  })
  const closure = deriveSelectedRouteClosureAtCommit(repoRoot, sourceA2)
  const history = deriveV138ProtectedHistoryV2(repoRoot, sourceA2)
  return `Authorize Phase 262 Plans 262-18 and 262-19 over independently reviewed source commit ${sourceA2} (tree ${custody.sourceA2Tree}; parents ${custody.sourceA2Parents.join(",")}; sourceBase2 ${custody.sourceBase2}; custody ${custody.custodyRoot}; selected-route ${closure.closureRoot}) as roryquinlan-repository-operator for route ordinal 2: exactly one separately committed direct-child successor-source seal B2, exactly one Pattern C main-orchestrator execution-context:v6, exactly one darwin-memorystatus-effective-available-basis-points-v1 headroom-preflight:v6 at the unchanged inclusive 2,500-basis-point threshold, exactly one calibration:v6 eight-attempt/four-shard allocation, and—only if calibration:v6 is admitted—at most one fresh reproduction:v7 540-cell run. This authority binds canonical destinations ${plan26218AuthorizedDestinations().join(",")}; predecessor A ${V138_PREDECESSOR_SOURCE_A}, predecessor B ${V138_PREDECESSOR_SOURCE_B}, predecessor authorization ${V138_PREDECESSOR_AUTHORIZATION_ROOT}, context ${V138_PREDECESSOR_CONTEXT_ROOT}, preflight ${V138_PREDECESSOR_PREFLIGHT_ROOT}, calibration ${V138_PREDECESSOR_CALIBRATION_ROOT}, terminal ${V138_PREDECESSOR_TERMINAL_ROOT}, protected history ${history.protectedHistoryRoot}, and charged identities ${V138_PLAN_262_16_CHARGED_PUBLIC_IDS.join(",")}; old reproduction:v6 remains absent. Every frozen policy, resource, lineage, accounting, runtime, semantic, privacy, gameplay, and formation-absence bound remains unchanged. This authorization grants no authority to mutate, replace, delete, reinterpret, retry, reuse, or consume Plan 262-15/16 artifacts or old authorization bytes, and grants no execution before B2 is checked. It is single-use, has no retry, and expires at the first seal refusal or failure or any Plan 262-19 terminal outcome.`
}

const deriveV138Plan26218AuthorizationV2 = (
  repoRoot: string,
  sourceA2Input: string,
  literalBytes: Uint8Array,
): Readonly<V138Plan26218AuthorizationV2> => {
  const sourceA2 = fullCommit(repoRoot, sourceA2Input)
  checkV138SourceCheckoutAtA2(repoRoot, sourceA2)
  const literal = Buffer.from(
    v138Plan26218AuthorizationLiteral(repoRoot, sourceA2),
    "utf8",
  )
  if (!Buffer.from(literalBytes).equals(literal)) {
    fail("V138_PLAN_262_18_AUTHORIZATION_LITERAL_INVALID")
  }
  const review = strictReviewMetadataV2(
    regularFile(
      path.resolve(repoRoot, V138_PLAN_262_18_CANONICAL_PATHS.review),
      "required",
    )!,
  )
  const sourceCustody = inspectSourceCustodyA2({
    repoRoot,
    repairStartHead2: review.repairStartHead2,
    sourceBase2: review.sourceBase2,
    sourceA2,
  })
  const closure = deriveSelectedRouteClosureAtCommit(repoRoot, sourceA2)
  const history = deriveV138ProtectedHistoryV2(repoRoot, sourceA2)
  const body = {
    schemaVersion: V138_PLAN_262_18_AUTHORIZATION_SCHEMA,
    routeOrdinal: 2 as const,
    operator: V138_PLAN_262_15_OPERATOR,
    sourceCustody,
    selectedRouteClosureRoot: closure.closureRoot,
    protectedHistoryRoot: history.protectedHistoryRoot,
    predecessorSourceA: V138_PREDECESSOR_SOURCE_A,
    predecessorSourceB: V138_PREDECESSOR_SOURCE_B,
    predecessorAuthorizationRoot: V138_PREDECESSOR_AUTHORIZATION_ROOT,
    predecessorContextRoot: V138_PREDECESSOR_CONTEXT_ROOT,
    predecessorPreflightRoot: V138_PREDECESSOR_PREFLIGHT_ROOT,
    predecessorCalibrationRoot: V138_PREDECESSOR_CALIBRATION_ROOT,
    predecessorTerminalRoot: V138_PREDECESSOR_TERMINAL_ROOT,
    chargedPublicAttemptIds: V138_PLAN_262_16_CHARGED_PUBLIC_IDS,
    oldReproductionV6Absent: true as const,
    canonicalDestinations: plan26218AuthorizedDestinations(),
    frozenPolicyRoot: frozenPolicyRootV2(),
    literalSha256: sha256(literalBytes),
    sealCount: 1 as const,
    contextCount: 1 as const,
    preflightCount: 1 as const,
    calibrationAllocationCount: 1 as const,
    calibrationAttemptCount: 8 as const,
    calibrationShardCount: 4 as const,
    reproductionMaximumCount: 1 as const,
    reproductionCellCount: 540 as const,
    singleUse: true as const,
    noRetry: true as const,
    noOldAuthorizationReuse: true as const,
    noExecutionBeforeCheckedB2: true as const,
    expiresAt: V138_PLAN_262_18_EXPIRY,
  }
  return Object.freeze({
    ...body,
    authorizationRoot: identityRoot(
      "evidenceBundle",
      V138_PLAN_262_18_AUTHORIZATION_SCHEMA,
      body,
    ),
  })
}

export const buildV138Plan26218AuthorizationV2 = (
  repoRoot: string,
  sourceA2Input: string,
  literalBytes: Uint8Array,
): Readonly<V138Plan26218AuthorizationV2> => {
  requireFreshDestinations(repoRoot, {
    authorization: "absent",
    seal: "absent",
    terminal: "absent",
  })
  return deriveV138Plan26218AuthorizationV2(
    repoRoot,
    sourceA2Input,
    literalBytes,
  )
}

export const checkV138Plan26218AuthorizationV2 = (
  repoRoot: string,
  value: unknown,
  literalBytes?: Uint8Array,
): Readonly<V138Plan26218AuthorizationV2> => {
  if (!isRecord(value) || !exactKeys(value, AUTHORIZATION_V2_KEYS)) {
    fail("V138_PLAN_262_18_AUTHORIZATION_SCHEMA_INVALID")
  }
  const candidate = value as unknown as V138Plan26218AuthorizationV2
  const literal =
    literalBytes ??
    Buffer.from(
      v138Plan26218AuthorizationLiteral(
        repoRoot,
        candidate.sourceCustody.sourceA2,
      ),
      "utf8",
    )
  const expected = deriveV138Plan26218AuthorizationV2(
    repoRoot,
    candidate.sourceCustody.sourceA2,
    literal,
  )
  if (canonical(candidate) !== canonical(expected)) {
    fail("V138_PLAN_262_18_AUTHORIZATION_INVALID")
  }
  return expected
}

export interface V138SuccessorSourceSealV2 {
  readonly schemaVersion: typeof V138_SUCCESSOR_SOURCE_SEAL_V2_SCHEMA
  readonly sealOrdinal: 2
  readonly canonicalizationId: "canonical-json-v1.1"
  readonly sourceCustody: Readonly<V138SourceCustodyA2>
  readonly selectedRouteClosure: Readonly<V138SelectedRouteClosure>
  readonly reviewRoots: readonly Readonly<{ path: string; sha256: Sha256 }>[]
  readonly protectedHistory: V138ProtectedHistoryV2
  readonly frozenPolicy: Readonly<Record<string, JsonValue>>
  readonly toolIdentity: Readonly<Record<string, JsonValue>>
  readonly hostIdentity: Readonly<Record<string, JsonValue>>
  readonly formationAbsence: Readonly<Record<string, JsonValue>>
  readonly replacementMetricContract: Readonly<Record<string, JsonValue>>
  readonly canonicalDestinations: readonly string[]
  readonly authorizationRoot: Sha256
  readonly sealRoot: Sha256
}

/**
 * Recheck every byte whose identity the successor seal attributes to A2.
 * This is intentionally a worktree check (not merely a Git-object check) and
 * is used on both sides of every single-use live callback.
 */
export const checkV138SealedWorktreeAtA2 = (
  repoRoot: string,
  seal: Readonly<V138SuccessorSourceSealV2>,
): true => {
  const sourceA2 = seal.sourceCustody.sourceA2
  const records = [
    ...seal.protectedHistory.artifacts,
    ...seal.selectedRouteClosure.sourceBlobs,
    ...seal.selectedRouteClosure.resolverMetadata,
  ]
  const seen = new Map<string, Sha256>()
  for (const record of records) {
    const prior = seen.get(record.path)
    if (prior !== undefined && prior !== record.sha256) {
      fail("V138_SEALED_WORKTREE_IDENTITY_CONFLICT")
    }
    seen.set(record.path, record.sha256)
  }
  for (const [repoPath, expectedRoot] of seen) {
    const working = regularFile(path.resolve(repoRoot, repoPath), "required")!
    const committed = readCommitFile(repoRoot, sourceA2, repoPath)
    if (
      sha256(working) !== expectedRoot ||
      sha256(committed) !== expectedRoot ||
      !working.equals(committed)
    ) {
      fail("V138_SEALED_WORKTREE_DRIFT")
    }
  }
  regularFile(path.resolve(repoRoot, V138_OLD_REPRODUCTION_V6), "absent")
  return true
}

const SEAL_V2_KEYS = [
  "schemaVersion",
  "sealOrdinal",
  "canonicalizationId",
  "sourceCustody",
  "selectedRouteClosure",
  "reviewRoots",
  "protectedHistory",
  "frozenPolicy",
  "toolIdentity",
  "hostIdentity",
  "formationAbsence",
  "replacementMetricContract",
  "canonicalDestinations",
  "authorizationRoot",
  "sealRoot",
] as const

export const buildV138SuccessorSourceSealV2 = (input: {
  readonly repoRoot: string
  readonly authorization: unknown
}): Readonly<V138SuccessorSourceSealV2> => {
  requireFreshDestinations(input.repoRoot, {
    authorization: "required",
    seal: "absent",
    terminal: "absent",
  })
  const authorization = checkV138Plan26218AuthorizationV2(
    input.repoRoot,
    input.authorization,
  )
  const sourceA2 = authorization.sourceCustody.sourceA2
  checkV138SourceCheckoutAtA2(input.repoRoot, sourceA2)
  const body = {
    schemaVersion: V138_SUCCESSOR_SOURCE_SEAL_V2_SCHEMA,
    sealOrdinal: 2 as const,
    canonicalizationId: "canonical-json-v1.1" as const,
    sourceCustody: authorization.sourceCustody,
    selectedRouteClosure: deriveSelectedRouteClosureAtCommit(
      input.repoRoot,
      sourceA2,
    ),
    reviewRoots: deriveReviewRootsV2(input.repoRoot, sourceA2),
    protectedHistory: deriveV138ProtectedHistoryV2(input.repoRoot, sourceA2),
    frozenPolicy: deriveFrozenPolicy(),
    toolIdentity: deriveToolIdentity(),
    hostIdentity: deriveHostIdentity(),
    formationAbsence: deriveFormationAbsence(input.repoRoot, sourceA2),
    replacementMetricContract: deriveReplacementMetricContract(
      input.repoRoot,
      sourceA2,
    ),
    canonicalDestinations: authorization.canonicalDestinations,
    authorizationRoot: authorization.authorizationRoot,
  }
  return Object.freeze({
    ...body,
    sealRoot: identityRoot(
      "containmentPolicy",
      V138_SUCCESSOR_SOURCE_SEAL_V2_SCHEMA,
      body,
    ),
  })
}

export const checkV138SuccessorSourceSealV2 = (
  repoRoot: string,
  value: unknown,
  authorizationValue: unknown,
): Readonly<V138SuccessorSourceSealV2> => {
  if (!isRecord(value) || !exactKeys(value, SEAL_V2_KEYS)) {
    fail("V138_SUCCESSOR_SEAL_V2_SCHEMA_INVALID")
  }
  const candidate = value as unknown as V138SuccessorSourceSealV2
  const authorization = checkV138Plan26218AuthorizationV2(
    repoRoot,
    authorizationValue,
  )
  const sourceA2 = authorization.sourceCustody.sourceA2
  checkV138SourceCheckoutAtA2(repoRoot, sourceA2)
  const { sealRoot, ...body } = candidate
  if (
    candidate.schemaVersion !== V138_SUCCESSOR_SOURCE_SEAL_V2_SCHEMA ||
    candidate.sealOrdinal !== 2 ||
    candidate.canonicalizationId !== "canonical-json-v1.1" ||
    candidate.authorizationRoot !== authorization.authorizationRoot ||
    canonical(candidate.sourceCustody) !==
      canonical(authorization.sourceCustody) ||
    canonical(candidate.selectedRouteClosure) !==
      canonical(deriveSelectedRouteClosureAtCommit(repoRoot, sourceA2)) ||
    canonical(candidate.reviewRoots) !==
      canonical(deriveReviewRootsV2(repoRoot, sourceA2)) ||
    canonical(candidate.protectedHistory) !==
      canonical(deriveV138ProtectedHistoryV2(repoRoot, sourceA2)) ||
    canonical(candidate.frozenPolicy) !== canonical(deriveFrozenPolicy()) ||
    canonical(candidate.toolIdentity) !== canonical(deriveToolIdentity()) ||
    canonical(candidate.hostIdentity) !== canonical(deriveHostIdentity()) ||
    canonical(candidate.formationAbsence) !==
      canonical(deriveFormationAbsence(repoRoot, sourceA2)) ||
    canonical(candidate.replacementMetricContract) !==
      canonical(deriveReplacementMetricContract(repoRoot, sourceA2)) ||
    canonical(candidate.canonicalDestinations) !==
      canonical(authorization.canonicalDestinations) ||
    sealRoot !==
      identityRoot(
        "containmentPolicy",
        V138_SUCCESSOR_SOURCE_SEAL_V2_SCHEMA,
        body,
      )
  )
    fail("V138_SUCCESSOR_SEAL_V2_INVALID")
  return candidate
}

export const writeV138Plan26218AuthorizationV2 = (
  repoRoot: string,
  targetPath: string,
  sourceA2: string,
  literalBytes: Uint8Array,
): Readonly<V138Plan26218AuthorizationV2> => {
  const target = canonicalPath(
    repoRoot,
    targetPath,
    V138_PLAN_262_18_CANONICAL_PATHS.authorization,
  )
  const value = buildV138Plan26218AuthorizationV2(
    repoRoot,
    sourceA2,
    literalBytes,
  )
  writeV138CanonicalExclusiveV2(repoRoot, target, value)
  return value
}

export const writeV138SuccessorSourceSealV2 = (
  repoRoot: string,
  targetPath: string,
  authorizationValue: unknown,
): Readonly<V138SuccessorSourceSealV2> => {
  const target = canonicalPath(
    repoRoot,
    targetPath,
    V138_PLAN_262_18_CANONICAL_PATHS.seal,
  )
  const value = buildV138SuccessorSourceSealV2({
    repoRoot,
    authorization: authorizationValue,
  })
  writeV138CanonicalExclusiveV2(repoRoot, target, value)
  return value
}

export interface V138SourceB2Custody {
  readonly schemaVersion: "v1.38-source-b2-custody-v1"
  readonly sourceA2: string
  readonly sourceB2: string
  readonly sourceB2Tree: string
  readonly sourceB2Parent: string
  readonly changedPaths: readonly string[]
  readonly blobs: readonly ReturnType<typeof blobRecord>[]
  readonly custodyRoot: Sha256
}

export const checkV138SuccessorSealCommitV2 = (input: {
  readonly repoRoot: string
  readonly sourceA2: string
  readonly sourceB2: string
}): Readonly<V138SourceB2Custody> => {
  const sourceA2 = fullCommit(input.repoRoot, input.sourceA2)
  const sourceB2 = fullCommit(input.repoRoot, input.sourceB2)
  const ancestry = gitText(input.repoRoot, [
    "rev-list",
    "--parents",
    "-n",
    "1",
    sourceB2,
  ]).split(" ")
  if (
    ancestry.length !== 2 ||
    ancestry[0] !== sourceB2 ||
    ancestry[1] !== sourceA2
  )
    fail("V138_SUCCESSOR_SEAL_B2_PARENT_INVALID")
  const changedPaths = sorted(
    gitText(input.repoRoot, [
      "diff-tree",
      "--no-commit-id",
      "--name-only",
      "-r",
      "--no-renames",
      sourceB2,
    ])
      .split("\n")
      .filter(Boolean)
      .map(normalize),
  )
  const expectedPaths = sorted([
    V138_PLAN_262_18_CANONICAL_PATHS.authorization,
    V138_PLAN_262_18_CANONICAL_PATHS.seal,
  ])
  if (canonical(changedPaths) !== canonical(expectedPaths)) {
    fail("V138_SUCCESSOR_SEAL_B2_DELTA_INVALID")
  }
  requireAbsentAtCommit(
    input.repoRoot,
    sourceA2,
    V138_PLAN_262_18_CANONICAL_PATHS.authorization,
    "V138_SUCCESSOR_SEAL_V2_EXISTED_AT_A2",
  )
  requireAbsentAtCommit(
    input.repoRoot,
    sourceA2,
    V138_PLAN_262_18_CANONICAL_PATHS.seal,
    "V138_SUCCESSOR_SEAL_V2_EXISTED_AT_A2",
  )
  requireAbsentAtCommit(
    input.repoRoot,
    sourceB2,
    V138_PLAN_262_18_CANONICAL_PATHS.terminal,
    "V138_PLAN_262_18_TERMINAL_PRESENT_AT_B2",
  )
  const blobs = expectedPaths.map((repoPath) =>
    blobRecord(input.repoRoot, sourceB2, repoPath),
  )
  const authorizationBytes = readCommitFile(
    input.repoRoot,
    sourceB2,
    V138_PLAN_262_18_CANONICAL_PATHS.authorization,
  )
  const sealBytes = readCommitFile(
    input.repoRoot,
    sourceB2,
    V138_PLAN_262_18_CANONICAL_PATHS.seal,
  )
  const workingAuthorization = regularFile(
    path.resolve(
      input.repoRoot,
      V138_PLAN_262_18_CANONICAL_PATHS.authorization,
    ),
    "required",
  )!
  const workingSeal = regularFile(
    path.resolve(input.repoRoot, V138_PLAN_262_18_CANONICAL_PATHS.seal),
    "required",
  )!
  if (
    !workingAuthorization.equals(authorizationBytes) ||
    !workingSeal.equals(sealBytes)
  )
    fail("V138_SUCCESSOR_SEAL_B2_WORKTREE_DRIFT")
  const authorization = checkV138Plan26218AuthorizationV2(
    input.repoRoot,
    JSON.parse(authorizationBytes.toString("utf8")),
  )
  const seal = checkV138SuccessorSourceSealV2(
    input.repoRoot,
    JSON.parse(sealBytes.toString("utf8")),
    authorization,
  )
  if (
    authorization.sourceCustody.sourceA2 !== sourceA2 ||
    seal.sourceCustody.sourceA2 !== sourceA2 ||
    !authorizationBytes.equals(Buffer.from(canonical(authorization))) ||
    !sealBytes.equals(Buffer.from(canonical(seal)))
  )
    fail("V138_SUCCESSOR_SEAL_B2_BYTES_INVALID")
  const body = {
    schemaVersion: "v1.38-source-b2-custody-v1" as const,
    sourceA2,
    sourceB2,
    sourceB2Tree: gitText(input.repoRoot, ["rev-parse", `${sourceB2}^{tree}`]),
    sourceB2Parent: sourceA2,
    changedPaths: Object.freeze(changedPaths),
    blobs: Object.freeze(blobs),
  }
  return Object.freeze({
    ...body,
    custodyRoot: identityRoot("containmentPolicy", body.schemaVersion, body),
  })
}

export interface V138Plan26218TerminalV2 {
  readonly schemaVersion: typeof V138_PLAN_262_18_TERMINAL_SCHEMA
  readonly disposition: "seal_refused" | "seal_failed"
  readonly sourceA2: string
  readonly authorityExpired: true
  readonly acceptedCellCount: 0
  readonly terminalRoot: Sha256
}

export const checkV138Plan26218TerminalV2 = (
  repoRoot: string,
  value: unknown,
  sourceA2Input: string,
): Readonly<V138Plan26218TerminalV2> => {
  if (
    !isRecord(value) ||
    !exactKeys(value, [
      "schemaVersion",
      "disposition",
      "sourceA2",
      "authorityExpired",
      "acceptedCellCount",
      "terminalRoot",
    ])
  )
    fail("V138_PLAN_262_18_TERMINAL_INVALID")
  const candidate = value as unknown as V138Plan26218TerminalV2
  const sourceA2 = fullCommit(repoRoot, sourceA2Input)
  const { terminalRoot, ...body } = candidate
  if (
    candidate.schemaVersion !== V138_PLAN_262_18_TERMINAL_SCHEMA ||
    (candidate.disposition !== "seal_refused" &&
      candidate.disposition !== "seal_failed") ||
    candidate.sourceA2 !== sourceA2 ||
    candidate.authorityExpired !== true ||
    candidate.acceptedCellCount !== 0 ||
    terminalRoot !==
      identityRoot(
        "canonicalJsonProfile",
        V138_PLAN_262_18_TERMINAL_SCHEMA,
        body,
      )
  )
    fail("V138_PLAN_262_18_TERMINAL_INVALID")
  return candidate
}

export const writeV138Plan26218TerminalV2 = (
  repoRoot: string,
  targetPath: string,
  disposition: V138Plan26218TerminalV2["disposition"],
  sourceA2Input: string,
): Readonly<V138Plan26218TerminalV2> => {
  const target = canonicalPath(
    repoRoot,
    targetPath,
    V138_PLAN_262_18_CANONICAL_PATHS.terminal,
  )
  requireFreshDestinations(repoRoot, {
    authorization: disposition === "seal_failed" ? "required" : "absent",
    seal: "absent",
    terminal: "absent",
  })
  const sourceA2 = fullCommit(repoRoot, sourceA2Input)
  if (disposition === "seal_failed") {
    const authorization: unknown = JSON.parse(
      regularFile(
        path.resolve(repoRoot, V138_PLAN_262_18_CANONICAL_PATHS.authorization),
        "required",
      )!.toString("utf8"),
    )
    checkV138Plan26218AuthorizationV2(repoRoot, authorization)
  }
  const body = {
    schemaVersion: V138_PLAN_262_18_TERMINAL_SCHEMA,
    disposition,
    sourceA2,
    authorityExpired: true as const,
    acceptedCellCount: 0 as const,
  }
  const terminal = Object.freeze({
    ...body,
    terminalRoot: identityRoot(
      "canonicalJsonProfile",
      V138_PLAN_262_18_TERMINAL_SCHEMA,
      body,
    ),
  })
  writeV138CanonicalExclusiveV2(repoRoot, target, terminal)
  return terminal
}

export type V138Plan26218Disposition = "seal_refused" | "seal_failed" | "sealed"

export const checkV138Plan26218ArtifactBranch = (input: {
  readonly repoRoot: string
  readonly authorizationPath: string
  readonly sealPath: string
  readonly terminalPath: string
  readonly reviewPath: string
  readonly reviewFixPath: string
  readonly oldAuthorizationPath: string
  readonly oldSealPath: string
  readonly oldContextPath: string
  readonly oldPreflightPath: string
  readonly oldCalibrationPath: string
  readonly oldTerminalPath: string
  readonly sourceA2: string
  readonly sourceB2?: string
}): V138Plan26218Disposition => {
  const canonicalArgs: Array<[string, string]> = [
    [input.authorizationPath, V138_PLAN_262_18_CANONICAL_PATHS.authorization],
    [input.sealPath, V138_PLAN_262_18_CANONICAL_PATHS.seal],
    [input.terminalPath, V138_PLAN_262_18_CANONICAL_PATHS.terminal],
    [input.reviewPath, V138_PLAN_262_18_CANONICAL_PATHS.review],
    [input.reviewFixPath, V138_PLAN_262_18_CANONICAL_PATHS.reviewFix],
    [
      input.oldAuthorizationPath,
      V138_PLAN_262_18_CANONICAL_PATHS.oldAuthorization,
    ],
    [input.oldSealPath, V138_PLAN_262_18_CANONICAL_PATHS.oldSeal],
    [input.oldContextPath, V138_PLAN_262_18_CANONICAL_PATHS.oldContext],
    [input.oldPreflightPath, V138_PLAN_262_18_CANONICAL_PATHS.oldPreflight],
    [input.oldCalibrationPath, V138_PLAN_262_18_CANONICAL_PATHS.oldCalibration],
    [input.oldTerminalPath, V138_PLAN_262_18_CANONICAL_PATHS.oldTerminal],
  ]
  for (const [supplied, expected] of canonicalArgs) {
    canonicalPath(input.repoRoot, supplied, expected)
  }
  // Terminal is intentionally the first artifact whose bytes are read.
  const terminalBytes = regularFile(
    path.resolve(input.repoRoot, input.terminalPath),
    "optional",
  )
  let disposition: V138Plan26218Disposition = "sealed"
  if (terminalBytes !== undefined) {
    const terminal = checkV138Plan26218TerminalV2(
      input.repoRoot,
      JSON.parse(terminalBytes.toString("utf8")),
      input.sourceA2,
    )
    disposition = terminal.disposition
  }
  for (const [, repoPath] of canonicalArgs.slice(5)) {
    const workingBytes = regularFile(
      path.resolve(input.repoRoot, repoPath),
      "required",
    )!
    const committedBytes = readCommitFile(
      input.repoRoot,
      input.sourceA2,
      repoPath,
    )
    if (!workingBytes.equals(committedBytes)) {
      fail("V138_PROTECTED_HISTORY_WORKTREE_DRIFT")
    }
  }
  deriveV138ProtectedHistoryV2(input.repoRoot, input.sourceA2)
  checkV138SourceCheckoutAtA2(input.repoRoot, input.sourceA2)
  const review = strictReviewMetadataV2(
    regularFile(path.resolve(input.repoRoot, input.reviewPath), "required")!,
  )
  if (review.sourceA2 !== input.sourceA2) {
    fail("V138_PLAN_262_18_REVIEW_SOURCE_JOIN_INVALID")
  }
  inspectSourceCustodyA2({
    repoRoot: input.repoRoot,
    repairStartHead2: review.repairStartHead2,
    sourceBase2: review.sourceBase2,
    sourceA2: input.sourceA2,
  })
  const fix = regularFile(
    path.resolve(input.repoRoot, input.reviewFixPath),
    review.fixesApplied ? "required" : "absent",
  )
  if (fix !== undefined) strictFixMetadataV2(fix, input.sourceA2)
  const authorizationBytes = regularFile(
    path.resolve(input.repoRoot, input.authorizationPath),
    disposition === "seal_refused" ? "absent" : "required",
  )
  const sealBytes = regularFile(
    path.resolve(input.repoRoot, input.sealPath),
    disposition === "sealed" ? "required" : "absent",
  )
  for (const repoPath of V138_PLAN_262_19_FRESH_DESTINATIONS) {
    regularFile(path.resolve(input.repoRoot, repoPath), "absent")
  }
  regularFile(path.resolve(input.repoRoot, V138_OLD_REPRODUCTION_V6), "absent")
  if (authorizationBytes !== undefined) {
    const authorization = checkV138Plan26218AuthorizationV2(
      input.repoRoot,
      JSON.parse(authorizationBytes.toString("utf8")),
    )
    if (authorization.sourceCustody.sourceA2 !== input.sourceA2) {
      fail("V138_PLAN_262_18_AUTHORIZATION_SOURCE_JOIN_INVALID")
    }
    if (sealBytes !== undefined) {
      checkV138SuccessorSourceSealV2(
        input.repoRoot,
        JSON.parse(sealBytes.toString("utf8")),
        authorization,
      )
    }
  }
  if (disposition === "sealed") {
    if (input.sourceB2 === undefined) {
      fail("V138_SUCCESSOR_SEAL_B2_REQUIRED")
    }
    checkV138SuccessorSealCommitV2({
      repoRoot: input.repoRoot,
      sourceA2: input.sourceA2,
      sourceB2: input.sourceB2!,
    })
  } else if (input.sourceB2 !== undefined) {
    fail("V138_SUCCESSOR_SEAL_B2_FORBIDDEN")
  }
  return disposition
}

/*
 * Plan 262-21 is a third, additive custody generation.  Nothing in this
 * section is used by the archived v1/v2 checkers above.
 */
export const V138_PLAN_262_21_AUTHORIZATION_SCHEMA =
  "v1.38-plan-262-21-authorization-v3" as const
export const V138_SUCCESSOR_SOURCE_SEAL_V3_SCHEMA =
  "v1.38-successor-source-seal-v3" as const
export const V138_SUCCESSOR_AUTHORIZED_SOURCE_PATHS_V3 =
  V138_SUCCESSOR_AUTHORIZED_SOURCE_PATHS_V2
export const V138_PLAN_262_21_CANONICAL_PATHS = Object.freeze({
  authorization:
    ".planning/artifacts/v1.38-plan-262-21-authorization-v3.json",
  seal: ".planning/artifacts/v1.38-successor-source-seal-v3.json",
  review:
    ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-21-REVIEW.md",
  reviewFix:
    ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-21-REVIEW-FIX.md",
})
export const V138_PLAN_262_22_FRESH_DESTINATIONS = Object.freeze([
  ".planning/artifacts/v1.38-current-matrix-execution-context-v7.json",
  ".planning/artifacts/v1.38-current-matrix-headroom-preflight-v7.json",
  ".planning/artifacts/v1.38-current-matrix-calibration-v7.json",
  ".planning/artifacts/v1.38-current-matrix-reproduction-v8.json",
  ".planning/artifacts/v1.38-plan-262-22-terminal-v1.json",
  ".planning/artifacts/v1.38-plan-262-22-preflight-consumption-v1.json",
  ".planning/artifacts/v1.38-plan-262-22-calibration-consumption-v1.json",
  ".planning/artifacts/v1.38-plan-262-22-reproduction-consumption-v1.json",
] as const)

export const checkV138Plan26221PreLiveDestinationAbsence = (
  repoRoot: string,
): true => {
  for (const repoPath of V138_PLAN_262_22_FRESH_DESTINATIONS) {
    regularFile(path.resolve(repoRoot, repoPath), "absent")
  }
  return true
}

export const V138_PLAN_262_24_AUTHORIZATION_SCHEMA =
  "v1.38-plan-262-24-authorization-v4" as const
export const V138_SUCCESSOR_SOURCE_SEAL_V4_SCHEMA =
  "v1.38-successor-source-seal-v4" as const
export const V138_SUCCESSOR_AUTHORIZED_SOURCE_PATHS_V4 = Object.freeze([
  "scripts/evaluate-v1-38-foundation-contract-successor-routes.test.ts",
  "scripts/evaluate-v1-38-foundation-contract.test.ts",
  "scripts/lib/v1-38-current-matrix-child-protocol.ts",
  "scripts/lib/v1-38-current-matrix-reproduction.ts",
  "scripts/lib/v1-38-successor-source-seal.ts",
] as const)
export const V138_PLAN_262_24_CANONICAL_PATHS = Object.freeze({
  authorization:
    ".planning/artifacts/v1.38-plan-262-24-authorization-v4.json",
  seal: ".planning/artifacts/v1.38-successor-source-seal-v4.json",
  review:
    ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-24-REVIEW.md",
  reviewFix:
    ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-24-REVIEW-FIX.md",
})
export const V138_PLAN_262_25_FRESH_DESTINATIONS = Object.freeze([
  ".planning/artifacts/v1.38-current-matrix-execution-context-v8.json",
  ".planning/artifacts/v1.38-current-matrix-headroom-preflight-v8.json",
  ".planning/artifacts/v1.38-current-matrix-calibration-v8.json",
  ".planning/artifacts/v1.38-current-matrix-reproduction-v9.json",
  ".planning/artifacts/v1.38-plan-262-25-terminal-v1.json",
  ".planning/artifacts/v1.38-plan-262-25-preflight-consumption-v1.json",
  ".planning/artifacts/v1.38-plan-262-25-calibration-consumption-v1.json",
  ".planning/artifacts/v1.38-plan-262-25-reproduction-consumption-v1.json",
] as const)

export const V138_PLAN_262_29_AUTHORIZATION_SCHEMA =
  "v1.38-plan-262-29-authorization-v5" as const
export const V138_SUCCESSOR_SOURCE_SEAL_V5_SCHEMA =
  "v1.38-successor-source-seal-v5" as const
export const V138_PLAN_262_28_SOURCE_BASE5 =
  "1cd79971145eff892f49aad928642b0d875fef53" as const
export const V138_REVIEWED_SOURCE_A4 =
  "1be54efec080436ea47ba5be3644ab1ab1686163" as const
export const V138_REVIEWED_SOURCE_B4 =
  "d0e3a2cae3d0849aec7f8b1c783f7ed16c8e2947" as const
export const V138_SUCCESSOR_AUTHORIZED_SOURCE_PATHS_V5 = Object.freeze([
  "scripts/evaluate-v1-38-current-matrix-child-protocol-v2.test.ts",
  "scripts/evaluate-v1-38-foundation-contract-successor-routes.test.ts",
  "scripts/evaluate-v1-38-foundation-contract.test.ts",
  "scripts/lib/v1-38-current-matrix-reproduction.ts",
  "scripts/lib/v1-38-successor-source-seal.ts",
] as const)
export const V138_PLAN_262_29_CANONICAL_PATHS = Object.freeze({
  authorization:
    ".planning/artifacts/v1.38-plan-262-29-authorization-v5.json",
  seal: ".planning/artifacts/v1.38-successor-source-seal-v5.json",
  review:
    ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-28-REVIEW.md",
  reviewFix:
    ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-28-REVIEW-FIX.md",
})
export const V138_PLAN_262_30_FRESH_DESTINATIONS = Object.freeze([
  ".planning/artifacts/v1.38-current-matrix-execution-context-v9.json",
  ".planning/artifacts/v1.38-current-matrix-headroom-preflight-v9.json",
  ".planning/artifacts/v1.38-current-matrix-calibration-v9.json",
  ".planning/artifacts/v1.38-current-matrix-reproduction-v10.json",
  ".planning/artifacts/v1.38-plan-262-30-terminal-v1.json",
  ".planning/artifacts/v1.38-plan-262-30-preflight-consumption-v1.json",
  ".planning/artifacts/v1.38-plan-262-30-calibration-consumption-v1.json",
  ".planning/artifacts/v1.38-plan-262-30-reproduction-consumption-v1.json",
] as const)

export interface V138SourceCustodyA5 {
  readonly schemaVersion: "v1.38-source-a5-custody-v1"
  readonly sourceBase5: string
  readonly sourceA5: string
  readonly sourceA5Tree: string
  readonly sourceA5Parents: readonly string[]
  readonly aggregateChangedPaths: readonly string[]
  readonly lineage: readonly Readonly<{
    commit: string
    tree: string
    parents: readonly string[]
    changedPaths: readonly string[]
  }>[]
  readonly sourceBlobs: readonly ReturnType<typeof blobRecord>[]
  readonly custodyRoot: Sha256
}

export const inspectSourceCustodyA5 = (input: {
  readonly repoRoot: string
  readonly sourceBase5: string
  readonly sourceA5: string
}): Readonly<V138SourceCustodyA5> => {
  const sourceBase5 = fullCommit(input.repoRoot, input.sourceBase5)
  const sourceA5 = fullCommit(input.repoRoot, input.sourceA5)
  if (sourceBase5 !== V138_PLAN_262_28_SOURCE_BASE5) {
    fail("V138_SOURCE_A5_BASE_INVALID")
  }
  requireAncestor(input.repoRoot, V138_REVIEWED_SOURCE_A4,
    V138_REVIEWED_SOURCE_B4, "V138_A4_B4_ANCESTRY_INVALID")
  requireAncestor(input.repoRoot, V138_REVIEWED_SOURCE_B4, sourceBase5,
    "V138_B4_SOURCE_BASE5_ANCESTRY_INVALID")
  requireAncestor(input.repoRoot, sourceBase5, sourceA5,
    "V138_SOURCE_BASE5_NOT_ANCESTOR")
  const commitRecord = (commit: string) => {
    const [oid, tree, parents = ""] = gitText(input.repoRoot, [
      "show", "-s", "--format=%H%n%T%n%P", commit,
    ]).split("\n")
    return Object.freeze({ commit: oid!, tree: tree!,
      parents: Object.freeze(parents.split(" ").filter(Boolean)),
      changedPaths: Object.freeze(sorted(gitText(input.repoRoot, [
        "diff-tree", "--root", "--no-commit-id", "--name-only", "-r",
        "--no-renames", commit,
      ]).split("\n").filter(Boolean).map(normalize))) })
  }
  const aggregateChangedPaths = sorted(gitText(input.repoRoot, ["diff",
    "--name-only", "--no-renames", sourceBase5, sourceA5, "--",
  ]).split("\n").filter(Boolean).map(normalize))
  const lineage = gitText(input.repoRoot, ["rev-list", "--reverse",
    "--topo-order", `${sourceBase5}..${sourceA5}`,
  ]).split("\n").filter(Boolean).map(commitRecord)
  const allowed = new Set<string>(V138_SUCCESSOR_AUTHORIZED_SOURCE_PATHS_V5)
  if (canonical(aggregateChangedPaths) !==
      canonical(sorted(V138_SUCCESSOR_AUTHORIZED_SOURCE_PATHS_V5)) ||
    lineage.length === 0 ||
    lineage.some((entry) => entry.changedPaths.length === 0 ||
      entry.changedPaths.some((repoPath) => !allowed.has(repoPath)))) {
    fail("V138_SOURCE_A5_DELTA_INVALID")
  }
  const sourceRecord = commitRecord(sourceA5)
  const body = { schemaVersion: "v1.38-source-a5-custody-v1" as const,
    sourceBase5, sourceA5, sourceA5Tree: sourceRecord.tree,
    sourceA5Parents: sourceRecord.parents,
    aggregateChangedPaths: Object.freeze(aggregateChangedPaths),
    lineage: Object.freeze(lineage),
    sourceBlobs: Object.freeze(V138_SUCCESSOR_AUTHORIZED_SOURCE_PATHS_V5.map(
      (repoPath) => blobRecord(input.repoRoot, sourceA5, repoPath))),
  }
  return Object.freeze({ ...body, custodyRoot: identityRoot(
    "containmentPolicy", body.schemaVersion, body) })
}

export const V138_PLAN_262_24_REPAIR_START_HEAD4 =
  "7d2b23d2be79b57d1e88e6254169629f61fd9ef0" as const
export const V138_PLAN_262_24_SOURCE_BASE4 =
  "52377f2cf5c019b6a7979f98ab5aa5d625778302" as const
export const V138_REVIEWED_SOURCE_A3 =
  "7ec7bae62fac9344bed9919b6e5095f9451c7eea" as const
export const V138_REVIEWED_SOURCE_B3 =
  "1387813e9f7262ac0c5916635addee9cdb96354b" as const

export interface V138SourceCustodyA4 {
  readonly schemaVersion: "v1.38-source-a4-custody-v1"
  readonly repairStartHead4: string
  readonly sourceBase4: string
  readonly sourceA4: string
  readonly sourceA4Tree: string
  readonly sourceA4Parents: readonly string[]
  readonly aggregateChangedPaths: readonly string[]
  readonly lineage: readonly Readonly<{
    commit: string
    tree: string
    parents: readonly string[]
    changedPaths: readonly string[]
  }>[]
  readonly sourceBlobs: readonly ReturnType<typeof blobRecord>[]
  readonly custodyRoot: Sha256
}

export const inspectSourceCustodyA4 = (input: {
  readonly repoRoot: string
  readonly repairStartHead4: string
  readonly sourceBase4: string
  readonly sourceA4: string
}): Readonly<V138SourceCustodyA4> => {
  const repairStartHead4 = fullCommit(input.repoRoot, input.repairStartHead4)
  const sourceBase4 = fullCommit(input.repoRoot, input.sourceBase4)
  const sourceA4 = fullCommit(input.repoRoot, input.sourceA4)
  if (repairStartHead4 !== V138_PLAN_262_24_REPAIR_START_HEAD4 ||
    sourceBase4 !== V138_PLAN_262_24_SOURCE_BASE4) {
    fail("V138_SOURCE_A4_BASE_INVALID")
  }
  requireAncestor(input.repoRoot, repairStartHead4, sourceBase4,
    "V138_SOURCE_A4_REPAIR_START_NOT_ANCESTOR")
  requireAncestor(input.repoRoot, sourceBase4, sourceA4,
    "V138_SOURCE_BASE4_NOT_ANCESTOR")
  requireAncestor(input.repoRoot, V138_REVIEWED_SOURCE_A3, sourceA4,
    "V138_SOURCE_A3_NOT_ANCESTOR_OF_A4")
  requireAncestor(input.repoRoot, V138_REVIEWED_SOURCE_B3, sourceA4,
    "V138_SOURCE_B3_NOT_ANCESTOR_OF_A4")
  const commitRecord = (commit: string) => {
    const [oid, tree, parents = ""] = gitText(input.repoRoot, [
      "show", "-s", "--format=%H%n%T%n%P", commit,
    ]).split("\n")
    return Object.freeze({ commit: oid!, tree: tree!,
      parents: Object.freeze(parents.split(" ").filter(Boolean)),
      changedPaths: Object.freeze(sorted(gitText(input.repoRoot, [
        "diff-tree", "--root", "--no-commit-id", "--name-only", "-r",
        "--no-renames", commit,
      ]).split("\n").filter(Boolean).map(normalize))) })
  }
  const aggregateChangedPaths = sorted(gitText(input.repoRoot, ["diff",
    "--name-only", "--no-renames", sourceBase4, sourceA4, "--",
  ]).split("\n").filter(Boolean).map(normalize))
  const lineage = gitText(input.repoRoot, ["rev-list", "--reverse",
    "--topo-order", `${sourceBase4}..${sourceA4}`,
  ]).split("\n").filter(Boolean).map(commitRecord)
  const allowed = new Set<string>(V138_SUCCESSOR_AUTHORIZED_SOURCE_PATHS_V4)
  if (aggregateChangedPaths.length === 0 || lineage.length === 0 ||
    aggregateChangedPaths.some((repoPath) => !allowed.has(repoPath)) ||
    lineage.some((entry) => entry.changedPaths.length === 0 ||
      entry.changedPaths.some((repoPath) => !allowed.has(repoPath)))) {
    fail("V138_SOURCE_A4_DELTA_INVALID")
  }
  const sourceRecord = commitRecord(sourceA4)
  const body = { schemaVersion: "v1.38-source-a4-custody-v1" as const,
    repairStartHead4, sourceBase4, sourceA4,
    sourceA4Tree: sourceRecord.tree, sourceA4Parents: sourceRecord.parents,
    aggregateChangedPaths: Object.freeze(aggregateChangedPaths),
    lineage: Object.freeze(lineage),
    sourceBlobs: Object.freeze(V138_SUCCESSOR_AUTHORIZED_SOURCE_PATHS_V4.map(
      (repoPath) => blobRecord(input.repoRoot, sourceA4, repoPath))),
  }
  return Object.freeze({ ...body, custodyRoot: identityRoot(
    "containmentPolicy", body.schemaVersion, body,
  ) })
}

const V138_V7_HISTORY_PRESENT_PATHS = Object.freeze([
  V138_PLAN_262_21_CANONICAL_PATHS.authorization,
  V138_PLAN_262_21_CANONICAL_PATHS.seal,
  V138_PLAN_262_22_FRESH_DESTINATIONS[0],
  V138_PLAN_262_22_FRESH_DESTINATIONS[1],
  V138_PLAN_262_22_FRESH_DESTINATIONS[2],
  V138_PLAN_262_22_FRESH_DESTINATIONS[4],
  V138_PLAN_262_22_FRESH_DESTINATIONS[5],
  V138_PLAN_262_22_FRESH_DESTINATIONS[6],
] as const)

const V138_V7_ROOTS = Object.freeze({
  authorizationRoot:
    "sha256:5df8709af13861851e04a0d757063ea9b2d11dc760e679c8c75d4b47c691caeb" as Sha256,
  sealRoot:
    "sha256:4937825550a33cef58c710b7f897f772442c32a11fbd0923ad4618aa8812f303" as Sha256,
  contextRoot:
    "sha256:0301751245114146dd7b16910ce736c8d5cf502d56ef7c0d466821751c6cb738" as Sha256,
  preflightRoot:
    "sha256:bd069d5949f31d6ee0dcf297dacff71d6b51d0a750ead2ff0542393bc826c561" as Sha256,
  preflightConsumptionRoot:
    "sha256:9c81ea447fbf55b7e7e410d1059e300b371ba278edaf43408626cc1273e2a74d" as Sha256,
  calibrationRoot:
    "sha256:39a69c353a351491c70bf15c1cb583b6d83249c11606c6d280c6d9e71fafc92b" as Sha256,
  calibrationConsumptionRoot:
    "sha256:543568c234694fa7c92623f85ddb6858b4fd72b8da4b1bd7a713cd6a9901dd00" as Sha256,
  terminalRoot:
    "sha256:1a40d1b01e2d121aea73da14a485f400085ed4c3d43b4670f64b5665020c168d" as Sha256,
})

export const deriveV138ProtectedHistoryV4 = (
  repoRoot: string,
  sourceA4Input: string,
) => {
  const sourceA4 = fullCommit(repoRoot, sourceA4Input)
  requireAncestor(repoRoot, V138_REVIEWED_SOURCE_A3, V138_REVIEWED_SOURCE_B3,
    "V138_A3_B3_ANCESTRY_INVALID")
  requireAncestor(repoRoot, V138_REVIEWED_SOURCE_B3, sourceA4,
    "V138_B3_A4_ANCESTRY_INVALID")
  requireAbsentAtCommit(repoRoot, sourceA4,
    V138_PLAN_262_22_FRESH_DESTINATIONS[3],
    "V138_PROTECTED_HISTORY_V4_REPRODUCTION_V8_PRESENT")
  requireAbsentAtCommit(repoRoot, sourceA4,
    V138_PLAN_262_22_FRESH_DESTINATIONS[7],
    "V138_PROTECTED_HISTORY_V4_REPRODUCTION_V8_MARKER_PRESENT")
  const calibration = parseCommitJson(repoRoot, sourceA4,
    V138_PLAN_262_22_FRESH_DESTINATIONS[2])
  const terminal = parseCommitJson(repoRoot, sourceA4,
    V138_PLAN_262_22_FRESH_DESTINATIONS[4])
  const v7 = Object.fromEntries(V138_V7_HISTORY_PRESENT_PATHS.map(
    (repoPath) => [repoPath, parseCommitJson(repoRoot, sourceA4, repoPath)]))
  if (v7[V138_PLAN_262_21_CANONICAL_PATHS.authorization]?.authorizationRoot !==
      V138_V7_ROOTS.authorizationRoot ||
    v7[V138_PLAN_262_21_CANONICAL_PATHS.seal]?.sealRoot !==
      V138_V7_ROOTS.sealRoot ||
    v7[V138_PLAN_262_22_FRESH_DESTINATIONS[0]]?.receiptRoot !==
      V138_V7_ROOTS.contextRoot ||
    v7[V138_PLAN_262_22_FRESH_DESTINATIONS[1]]?.receiptRoot !==
      V138_V7_ROOTS.preflightRoot ||
    v7[V138_PLAN_262_22_FRESH_DESTINATIONS[5]]?.markerRoot !==
      V138_V7_ROOTS.preflightConsumptionRoot ||
    v7[V138_PLAN_262_22_FRESH_DESTINATIONS[2]]?.receiptRoot !==
      V138_V7_ROOTS.calibrationRoot ||
    v7[V138_PLAN_262_22_FRESH_DESTINATIONS[6]]?.markerRoot !==
      V138_V7_ROOTS.calibrationConsumptionRoot ||
    v7[V138_PLAN_262_22_FRESH_DESTINATIONS[4]]?.terminalRoot !==
      V138_V7_ROOTS.terminalRoot) {
    fail("V138_PROTECTED_HISTORY_V4_ROOT_INVALID")
  }
  const expectedV7 = Array.from({ length: 8 }, (_, index) =>
    `calibration:v7:${index}`)
  if (calibration.schemaVersion !== "v1.38-current-matrix-calibration-v7" ||
    !Array.isArray(calibration.attempts) ||
    canonical(calibration.attempts.map((entry) =>
      isRecord(entry) ? entry.publicAttemptId : null)) !== canonical(expectedV7) ||
    terminal.schemaVersion !== "v1.38-plan-262-22-terminal-v1" ||
    terminal.disposition !== "calibration_stopped" ||
    terminal.chargedCalibrationAttemptCount !== 8 ||
    terminal.chargedReproductionAttemptCount !== 0 ||
    terminal.acceptedCellCount !== 0 || terminal.completeCleanup !== true) {
    fail("V138_PROTECTED_HISTORY_V4_TERMINAL_INVALID")
  }
  const v3History = deriveV138ProtectedHistoryV3(repoRoot,
    V138_REVIEWED_SOURCE_A3)
  const priorAuthorizationPaths = [
    ".planning/artifacts/v1.38-plan-262-15-authorization-v1.json",
    V138_PLAN_262_18_CANONICAL_PATHS.authorization,
    V138_PLAN_262_21_CANONICAL_PATHS.authorization,
  ] as const
  const body = {
    schemaVersion: "v1.38-protected-stopped-history-v4" as const,
    sourceA2: V138_REVIEWED_SOURCE_A2,
    sourceB2: V138_REVIEWED_SOURCE_B2,
    sourceA3: V138_REVIEWED_SOURCE_A3,
    sourceB3: V138_REVIEWED_SOURCE_B3,
    v7Roots: V138_V7_ROOTS,
    protectedV3Root: v3History.protectedHistoryRoot,
    artifacts: Object.freeze(V138_V7_HISTORY_PRESENT_PATHS.map((repoPath) =>
      blobRecord(repoRoot, sourceA4, repoPath))),
    priorAuthorizationBytes: Object.freeze(priorAuthorizationPaths.map(
      (repoPath) => blobRecord(repoRoot, sourceA4, repoPath))),
    cumulativeChargedPublicAttemptIds: Object.freeze([
      ...v3History.cumulativeChargedPublicAttemptIds,
      ...expectedV7,
    ]),
    reproductionV8Absent: true as const,
    reproductionV8ConsumptionMarkerAbsent: true as const,
    terminalDisposition: "calibration_stopped" as const,
    acceptedEvidenceCount: 0 as const,
  }
  return Object.freeze({ ...body, protectedHistoryRoot: identityRoot(
    "evidenceBundle", body.schemaVersion, body,
  ) })
}

const V138_V8_HISTORY_PRESENT_PATHS = Object.freeze([
  V138_PLAN_262_24_CANONICAL_PATHS.authorization,
  V138_PLAN_262_24_CANONICAL_PATHS.seal,
  V138_PLAN_262_25_FRESH_DESTINATIONS[0],
  V138_PLAN_262_25_FRESH_DESTINATIONS[1],
  V138_PLAN_262_25_FRESH_DESTINATIONS[2],
  V138_PLAN_262_25_FRESH_DESTINATIONS[4],
  V138_PLAN_262_25_FRESH_DESTINATIONS[5],
  V138_PLAN_262_25_FRESH_DESTINATIONS[6],
] as const)

export const deriveV138ProtectedHistoryV5 = (
  repoRoot: string,
  sourceA5Input: string,
) => {
  const sourceA5 = fullCommit(repoRoot, sourceA5Input)
  requireAncestor(repoRoot, V138_REVIEWED_SOURCE_A4,
    V138_REVIEWED_SOURCE_B4, "V138_A4_B4_ANCESTRY_INVALID")
  requireAncestor(repoRoot, V138_REVIEWED_SOURCE_B4, sourceA5,
    "V138_B4_A5_ANCESTRY_INVALID")
  requireAbsentAtCommit(repoRoot, sourceA5,
    V138_PLAN_262_25_FRESH_DESTINATIONS[3],
    "V138_PROTECTED_HISTORY_V5_REPRODUCTION_V9_PRESENT")
  requireAbsentAtCommit(repoRoot, sourceA5,
    V138_PLAN_262_25_FRESH_DESTINATIONS[7],
    "V138_PROTECTED_HISTORY_V5_REPRODUCTION_V9_MARKER_PRESENT")
  const route4 = Object.fromEntries(V138_V8_HISTORY_PRESENT_PATHS.map(
    (repoPath) => [repoPath, parseCommitJson(repoRoot, sourceA5, repoPath)]))
  const calibration = route4[V138_PLAN_262_25_FRESH_DESTINATIONS[2]]
  const terminal = route4[V138_PLAN_262_25_FRESH_DESTINATIONS[4]]
  const expectedV8 = Array.from({ length: 8 }, (_, index) =>
    `calibration:v8:${index}`)
  if (route4[V138_PLAN_262_24_CANONICAL_PATHS.authorization]
      ?.schemaVersion !== V138_PLAN_262_24_AUTHORIZATION_SCHEMA ||
    route4[V138_PLAN_262_24_CANONICAL_PATHS.seal]?.schemaVersion !==
      V138_SUCCESSOR_SOURCE_SEAL_V4_SCHEMA ||
    calibration?.schemaVersion !== "v1.38-current-matrix-calibration-v8" ||
    !Array.isArray(calibration.attempts) ||
    canonical(calibration.attempts.map((entry) => isRecord(entry)
      ? entry.publicAttemptId : null)) !== canonical(expectedV8) ||
    terminal?.schemaVersion !== "v1.38-plan-262-25-terminal-v1" ||
    terminal.disposition !== "calibration_stopped" ||
    terminal.chargedCalibrationAttemptCount !== 8 ||
    terminal.chargedReproductionAttemptCount !== 0 ||
    terminal.acceptedCellCount !== 0 || terminal.completeCleanup !== true) {
    fail("V138_PROTECTED_HISTORY_V5_TERMINAL_INVALID")
  }
  const v4History = deriveV138ProtectedHistoryV4(repoRoot,
    V138_REVIEWED_SOURCE_A4)
  const priorAuthorizationPaths = [
    ".planning/artifacts/v1.38-plan-262-15-authorization-v1.json",
    V138_PLAN_262_18_CANONICAL_PATHS.authorization,
    V138_PLAN_262_21_CANONICAL_PATHS.authorization,
    V138_PLAN_262_24_CANONICAL_PATHS.authorization,
  ] as const
  const cumulativeChargedPublicAttemptIds = Object.freeze([
    ...v4History.cumulativeChargedPublicAttemptIds,
    ...expectedV8,
  ])
  if (cumulativeChargedPublicAttemptIds.length !== 32 ||
    new Set(cumulativeChargedPublicAttemptIds).size !== 32) {
    fail("V138_PROTECTED_HISTORY_V5_CHARGES_INVALID")
  }
  const body = {
    schemaVersion: "v1.38-protected-stopped-history-v5" as const,
    sourceA2: V138_REVIEWED_SOURCE_A2,
    sourceB2: V138_REVIEWED_SOURCE_B2,
    sourceA3: V138_REVIEWED_SOURCE_A3,
    sourceB3: V138_REVIEWED_SOURCE_B3,
    sourceA4: V138_REVIEWED_SOURCE_A4,
    sourceB4: V138_REVIEWED_SOURCE_B4,
    protectedV4Root: v4History.protectedHistoryRoot,
    artifacts: Object.freeze(V138_V8_HISTORY_PRESENT_PATHS.map((repoPath) =>
      blobRecord(repoRoot, sourceA5, repoPath))),
    priorAuthorizationBytes: Object.freeze(priorAuthorizationPaths.map(
      (repoPath) => blobRecord(repoRoot, sourceA5, repoPath))),
    cumulativeChargedPublicAttemptIds,
    reproductionV9Absent: true as const,
    reproductionV9ConsumptionMarkerAbsent: true as const,
    terminalDisposition: "calibration_stopped" as const,
    acceptedEvidenceCount: 0 as const,
  }
  return Object.freeze({ ...body, protectedHistoryRoot: identityRoot(
    "evidenceBundle", body.schemaVersion, body) })
}

const reviewMetadataV4 = (repoRoot: string, sourceA4: string) => {
  const bytes = regularFile(path.resolve(repoRoot,
    V138_PLAN_262_24_CANONICAL_PATHS.review), "required")!
  const values = frontmatterScalars(bytes, "V138_PLAN_262_24_REVIEW_INVALID")
  const paths = frontmatterList(bytes, "files_reviewed_list",
    "V138_PLAN_262_24_REVIEW_INVALID")
  if (values.get("plan") !== "24" || values.get("depth") !== "deep" ||
    values.get("status") !== "clean" || values.get("files_reviewed") !== "5" ||
    values.get("findings.critical") !== "0" ||
    values.get("findings.high") !== "0" ||
    values.get("findings.medium") !== "0" ||
    values.get("findings.low") !== "0" ||
    values.get("findings.warning") !== "0" ||
    values.get("findings.info") !== "0" ||
    values.get("findings.total") !== "0" ||
    values.get("repair_start_head4") !== V138_PLAN_262_24_REPAIR_START_HEAD4 ||
    values.get("source_base4") !== V138_PLAN_262_24_SOURCE_BASE4 ||
    values.get("source_a4") !== sourceA4 ||
    canonical(sorted(paths)) !== canonical(sorted(
      V138_SUCCESSOR_AUTHORIZED_SOURCE_PATHS_V4))) {
    fail("V138_PLAN_262_24_REVIEW_NOT_CLEAN")
  }
  const fixesApplied = values.get("fixes_applied")
  if (fixesApplied !== "true" && fixesApplied !== "false") {
    fail("V138_PLAN_262_24_REVIEW_NOT_CLEAN")
  }
  const fix = regularFile(path.resolve(repoRoot,
    V138_PLAN_262_24_CANONICAL_PATHS.reviewFix),
  fixesApplied === "true" ? "required" : "absent")
  if (fix !== undefined) {
    const fixValues = frontmatterScalars(fix,
      "V138_PLAN_262_24_REVIEW_FIX_INVALID")
    if (fixValues.get("status") !== "all_fixed" ||
      fixValues.get("skipped") !== "0" ||
      fixValues.get("final_source_a4") !== sourceA4) {
      fail("V138_PLAN_262_24_REVIEW_FIX_INVALID")
    }
  }
  return Object.freeze({ bytes, fix })
}

const plan26224Destinations = () => Object.freeze([
  V138_PLAN_262_24_CANONICAL_PATHS.authorization,
  V138_PLAN_262_24_CANONICAL_PATHS.seal,
  ...V138_PLAN_262_25_FRESH_DESTINATIONS,
])

export const v138Plan26224AuthorizationLiteral = (
  repoRoot: string,
  sourceA4Input: string,
): string => {
  const sourceA4 = fullCommit(repoRoot, sourceA4Input)
  reviewMetadataV4(repoRoot, sourceA4)
  const custody = inspectSourceCustodyA4({ repoRoot,
    repairStartHead4: V138_PLAN_262_24_REPAIR_START_HEAD4,
    sourceBase4: V138_PLAN_262_24_SOURCE_BASE4, sourceA4 })
  const history = deriveV138ProtectedHistoryV4(repoRoot, sourceA4)
  const closure = deriveSelectedRouteClosureAtCommit(repoRoot, sourceA4)
  return `Authorize Phase 262 Plans 262-24 and 262-25 over independently reviewed source commit ${sourceA4} (tree ${custody.sourceA4Tree}; parents ${custody.sourceA4Parents.join(",")}; sourceBase4 ${custody.sourceBase4}; custody ${custody.custodyRoot}; selected-route ${closure.closureRoot}) as roryquinlan-repository-operator for route ordinal 4: exactly one separately committed direct-child successor-source seal B4, exactly one Pattern C main-orchestrator execution-context:v8, exactly one darwin-memorystatus-effective-available-basis-points-v1 headroom-preflight:v8 at the unchanged inclusive 2,500-basis-point threshold, exactly one calibration:v8 eight-attempt/four-shard allocation, and—only if calibration:v8 is admitted—at most one fresh reproduction:v9 540-cell run. This authority binds canonical destinations ${plan26224Destinations().join(",")}; archived A2 ${V138_REVIEWED_SOURCE_A2}, B2 ${V138_REVIEWED_SOURCE_B2}, A3 ${V138_REVIEWED_SOURCE_A3}, B3 ${V138_REVIEWED_SOURCE_B3}, protected history ${history.protectedHistoryRoot}, cumulative charged identities ${history.cumulativeChargedPublicAttemptIds.join(",")}, and every prior authorization byte ${history.priorAuthorizationBytes.map(({ sha256 }) => sha256).join(",")}. Every frozen policy, resource, lineage, accounting, runtime, semantic, privacy, gameplay, and formation-absence bound remains unchanged. This authorization grants no authority to mutate, replace, delete, reinterpret, retry, reuse, or consume any v5/v6/v7 artifact or prior authorization bytes, and grants no execution before B4 is checked. It is single-use, has no retry, and expires at the first seal refusal or failure or any Plan 262-25 terminal outcome.`
}

const deriveAuthorizationV4 = (
  repoRoot: string,
  sourceA4: string,
  literalBytes: Uint8Array,
) => {
  const literal = Buffer.from(v138Plan26224AuthorizationLiteral(
    repoRoot, sourceA4), "utf8")
  if (!literal.equals(Buffer.from(literalBytes))) {
    fail("V138_PLAN_262_24_AUTHORIZATION_LITERAL_INVALID")
  }
  const sourceCustody = inspectSourceCustodyA4({ repoRoot,
    repairStartHead4: V138_PLAN_262_24_REPAIR_START_HEAD4,
    sourceBase4: V138_PLAN_262_24_SOURCE_BASE4, sourceA4 })
  const history = deriveV138ProtectedHistoryV4(repoRoot, sourceA4)
  const body = {
    schemaVersion: V138_PLAN_262_24_AUTHORIZATION_SCHEMA,
    routeOrdinal: 4 as const,
    operator: V138_PLAN_262_15_OPERATOR,
    sourceCustody,
    selectedRouteClosure: deriveSelectedRouteClosureAtCommit(repoRoot,
      sourceA4),
    selectedRouteClosureRoot:
      deriveSelectedRouteClosureAtCommit(repoRoot, sourceA4).closureRoot,
    protectedHistoryRoot: history.protectedHistoryRoot,
    sourceA2: V138_REVIEWED_SOURCE_A2, sourceB2: V138_REVIEWED_SOURCE_B2,
    sourceA3: V138_REVIEWED_SOURCE_A3, sourceB3: V138_REVIEWED_SOURCE_B3,
    cumulativeChargedPublicAttemptIds:
      history.cumulativeChargedPublicAttemptIds,
    priorAuthorizationBytes: history.priorAuthorizationBytes,
    canonicalDestinations: plan26224Destinations(),
    frozenPolicyRoot: frozenPolicyRootV2(),
    literalSha256: sha256(literalBytes),
    sealCount: 1 as const, contextCount: 1 as const,
    preflightCount: 1 as const, calibrationAllocationCount: 1 as const,
    calibrationAttemptCount: 8 as const, calibrationShardCount: 4 as const,
    reproductionMaximumCount: 1 as const, reproductionCellCount: 540 as const,
    singleUse: true as const, noRetry: true as const,
    noPriorAuthorityReuse: true as const,
    noExecutionBeforeCheckedB4: true as const,
    expiresAt: "first_seal_refusal_failure_or_plan_262_25_terminal" as const,
  }
  return Object.freeze({ ...body, authorizationRoot: identityRoot(
    "evidenceBundle", body.schemaVersion, body,
  ) })
}

export const buildV138Plan26224AuthorizationV4 = (
  repoRoot: string,
  sourceA4: string,
  literalBytes: Uint8Array,
) => {
  regularFile(path.resolve(repoRoot,
    V138_PLAN_262_24_CANONICAL_PATHS.authorization), "absent")
  regularFile(path.resolve(repoRoot,
    V138_PLAN_262_24_CANONICAL_PATHS.seal), "absent")
  for (const repoPath of V138_PLAN_262_25_FRESH_DESTINATIONS) {
    regularFile(path.resolve(repoRoot, repoPath), "absent")
  }
  return deriveAuthorizationV4(repoRoot, fullCommit(repoRoot, sourceA4),
    literalBytes)
}

export const checkV138Plan26224AuthorizationV4 = (
  repoRoot: string,
  value: unknown,
  literalBytes?: Uint8Array,
) => {
  if (!isRecord(value) || value.schemaVersion !==
    V138_PLAN_262_24_AUTHORIZATION_SCHEMA || !isRecord(value.sourceCustody) ||
    typeof value.sourceCustody.sourceA4 !== "string") {
    fail("V138_PLAN_262_24_AUTHORIZATION_SCHEMA_INVALID")
  }
  const sourceA4 = value.sourceCustody.sourceA4
  const bytes = literalBytes ?? Buffer.from(v138Plan26224AuthorizationLiteral(
    repoRoot, sourceA4), "utf8")
  const expected = deriveAuthorizationV4(repoRoot, sourceA4, bytes)
  if (canonical(value) !== canonical(expected)) {
    fail("V138_PLAN_262_24_AUTHORIZATION_INVALID")
  }
  return expected
}

export const buildV138SuccessorSourceSealV4 = (input: {
  readonly repoRoot: string
  readonly authorization: unknown
}) => {
  const authorization = checkV138Plan26224AuthorizationV4(
    input.repoRoot, input.authorization)
  const sourceA4 = authorization.sourceCustody.sourceA4
  const review = reviewMetadataV4(input.repoRoot, sourceA4)
  const body = {
    schemaVersion: V138_SUCCESSOR_SOURCE_SEAL_V4_SCHEMA,
    sealOrdinal: 4 as const,
    canonicalizationId: "canonical-json-v1.1" as const,
    sourceCustody: authorization.sourceCustody,
    selectedRouteClosure: authorization.selectedRouteClosure,
    reviewRoots: Object.freeze([
      Object.freeze({ path: V138_PLAN_262_24_CANONICAL_PATHS.review,
        sha256: sha256(review.bytes) }),
      ...(review.fix === undefined ? [] : [Object.freeze({
        path: V138_PLAN_262_24_CANONICAL_PATHS.reviewFix,
        sha256: sha256(review.fix),
      })]),
    ]),
    protectedHistory: deriveV138ProtectedHistoryV4(input.repoRoot, sourceA4),
    frozenPolicy: deriveFrozenPolicy(), toolIdentity: deriveToolIdentity(),
    hostIdentity: deriveHostIdentity(),
    formationAbsence: deriveFormationAbsence(input.repoRoot, sourceA4),
    replacementMetricContract: deriveReplacementMetricContract(
      input.repoRoot, sourceA4),
    canonicalDestinations: authorization.canonicalDestinations,
    authorizationRoot: authorization.authorizationRoot,
  }
  return Object.freeze({ ...body, sealRoot: identityRoot(
    "containmentPolicy", body.schemaVersion, body,
  ) })
}

export const checkV138SuccessorSourceSealV4 = (
  repoRoot: string,
  value: unknown,
  authorizationValue: unknown,
) => {
  if (!isRecord(value) || value.schemaVersion !==
    V138_SUCCESSOR_SOURCE_SEAL_V4_SCHEMA) {
    fail("V138_SUCCESSOR_SEAL_V4_SCHEMA_INVALID")
  }
  const expected = buildV138SuccessorSourceSealV4({ repoRoot,
    authorization: authorizationValue })
  if (canonical(value) !== canonical(expected)) {
    fail("V138_SUCCESSOR_SEAL_V4_INVALID")
  }
  return expected
}

export const checkV138SealedWorktreeAtA4 = (
  repoRoot: string,
  seal: ReturnType<typeof buildV138SuccessorSourceSealV4>,
): true => {
  const sourceA4 = seal.sourceCustody.sourceA4
  const records = [
    ...seal.sourceCustody.sourceBlobs,
    ...seal.protectedHistory.artifacts,
    ...seal.protectedHistory.priorAuthorizationBytes,
    ...seal.selectedRouteClosure.sourceBlobs,
    ...seal.selectedRouteClosure.resolverMetadata,
  ]
  const seen = new Map<string, Sha256>()
  for (const record of records) {
    const prior = seen.get(record.path)
    if (prior !== undefined && prior !== record.sha256) {
      fail("V138_SEALED_WORKTREE_V4_IDENTITY_CONFLICT")
    }
    seen.set(record.path, record.sha256)
  }
  for (const [repoPath, expectedRoot] of seen) {
    const working = regularFile(path.resolve(repoRoot, repoPath), "required")!
    const committed = readCommitFile(repoRoot, sourceA4, repoPath)
    if (sha256(working) !== expectedRoot || sha256(committed) !== expectedRoot ||
      !working.equals(committed)) fail("V138_SEALED_WORKTREE_V4_DRIFT")
  }
  requireAbsentAtCommit(repoRoot, sourceA4,
    V138_PLAN_262_22_FRESH_DESTINATIONS[3],
    "V138_PROTECTED_HISTORY_V4_REPRODUCTION_V8_PRESENT")
  requireAbsentAtCommit(repoRoot, sourceA4,
    V138_PLAN_262_22_FRESH_DESTINATIONS[7],
    "V138_PROTECTED_HISTORY_V4_REPRODUCTION_V8_MARKER_PRESENT")
  regularFile(path.resolve(repoRoot, V138_PLAN_262_22_FRESH_DESTINATIONS[3]),
    "absent")
  regularFile(path.resolve(repoRoot, V138_PLAN_262_22_FRESH_DESTINATIONS[7]),
    "absent")
  return true
}

export const writeV138Plan26224AuthorizationV4 = (
  repoRoot: string, targetPath: string, sourceA4: string,
  literalBytes: Uint8Array,
) => {
  const target = canonicalPath(repoRoot, targetPath,
    V138_PLAN_262_24_CANONICAL_PATHS.authorization)
  const value = buildV138Plan26224AuthorizationV4(repoRoot, sourceA4,
    literalBytes)
  writeV138CanonicalExclusiveV2(repoRoot, target, value)
  return value
}

export const writeV138SuccessorSourceSealV4 = (
  repoRoot: string, targetPath: string, authorization: unknown,
) => {
  const target = canonicalPath(repoRoot, targetPath,
    V138_PLAN_262_24_CANONICAL_PATHS.seal)
  regularFile(target, "absent")
  const value = buildV138SuccessorSourceSealV4({ repoRoot, authorization })
  writeV138CanonicalExclusiveV2(repoRoot, target, value)
  return value
}

export const checkV138SuccessorSealCommitV4 = (input: {
  readonly repoRoot: string
  readonly sourceA4: string
  readonly sourceB4: string
  readonly allowPlan26225Artifacts?: true
}) => {
  const sourceA4 = fullCommit(input.repoRoot, input.sourceA4)
  const sourceB4 = fullCommit(input.repoRoot, input.sourceB4)
  const parents = gitText(input.repoRoot, ["rev-list", "--parents", "-n", "1",
    sourceB4]).split(" ")
  if (parents.length !== 2 || parents[1] !== sourceA4) {
    fail("V138_SUCCESSOR_SEAL_B4_PARENT_INVALID")
  }
  const changedPaths = sorted(gitText(input.repoRoot, ["diff-tree",
    "--no-commit-id", "--name-only", "-r", "--no-renames", sourceB4,
  ]).split("\n").filter(Boolean).map(normalize))
  const expectedPaths = sorted([
    V138_PLAN_262_24_CANONICAL_PATHS.authorization,
    V138_PLAN_262_24_CANONICAL_PATHS.seal,
  ])
  if (canonical(changedPaths) !== canonical(expectedPaths)) {
    fail("V138_SUCCESSOR_SEAL_B4_DELTA_INVALID")
  }
  for (const repoPath of expectedPaths) {
    requireAbsentAtCommit(input.repoRoot, sourceA4, repoPath,
      "V138_SUCCESSOR_SEAL_V4_EXISTED_AT_A4")
    const working = regularFile(path.resolve(input.repoRoot, repoPath),
      "required")!
    const committed = readCommitFile(input.repoRoot, sourceB4, repoPath)
    if (!working.equals(committed)) {
      fail("V138_SUCCESSOR_SEAL_B4_WORKTREE_DRIFT")
    }
  }
  const authorization = checkV138Plan26224AuthorizationV4(input.repoRoot,
    JSON.parse(readCommitFile(input.repoRoot, sourceB4,
      V138_PLAN_262_24_CANONICAL_PATHS.authorization).toString("utf8")))
  const seal = checkV138SuccessorSourceSealV4(input.repoRoot,
    JSON.parse(readCommitFile(input.repoRoot, sourceB4,
      V138_PLAN_262_24_CANONICAL_PATHS.seal).toString("utf8")), authorization)
  checkV138SealedWorktreeAtA4(input.repoRoot, seal)
  if (input.allowPlan26225Artifacts !== true) {
    for (const repoPath of V138_PLAN_262_25_FRESH_DESTINATIONS) {
      regularFile(path.resolve(input.repoRoot, repoPath), "absent")
    }
  }
  const body = { schemaVersion: "v1.38-source-b4-custody-v1" as const,
    sourceA4, sourceB4,
    sourceB4Tree: gitText(input.repoRoot, ["rev-parse", `${sourceB4}^{tree}`]),
    sourceB4Parent: sourceA4, changedPaths: Object.freeze(changedPaths),
    blobs: Object.freeze(expectedPaths.map((repoPath) =>
      blobRecord(input.repoRoot, sourceB4, repoPath))),
    authorizationRoot: authorization.authorizationRoot,
    sealRoot: seal.sealRoot,
  }
  return Object.freeze({ ...body, custodyRoot: identityRoot(
    "containmentPolicy", body.schemaVersion, body,
  ) })
}

const reviewMetadataV5 = (repoRoot: string, sourceA5: string) => {
  const bytes = regularFile(path.resolve(repoRoot,
    V138_PLAN_262_29_CANONICAL_PATHS.review), "required")!
  const values = frontmatterScalars(bytes, "V138_PLAN_262_28_REVIEW_INVALID")
  const paths = frontmatterList(bytes, "files_reviewed_list",
    "V138_PLAN_262_28_REVIEW_INVALID")
  if (values.get("plan") !== "28" || values.get("depth") !== "deep" ||
    values.get("status") !== "clean" || values.get("files_reviewed") !== "5" ||
    values.get("source_base5") !== V138_PLAN_262_28_SOURCE_BASE5 ||
    values.get("source_a5") !== sourceA5 ||
    ["critical", "high", "medium", "low", "warning", "info", "total"]
      .some((key) => values.get(`findings.${key}`) !== "0") ||
    canonical(sorted(paths)) !== canonical(sorted(
      V138_SUCCESSOR_AUTHORIZED_SOURCE_PATHS_V5))) {
    fail("V138_PLAN_262_28_REVIEW_NOT_CLEAN")
  }
  const fixesApplied = values.get("fixes_applied")
  if (fixesApplied !== "true" && fixesApplied !== "false") {
    fail("V138_PLAN_262_28_REVIEW_NOT_CLEAN")
  }
  const fix = regularFile(path.resolve(repoRoot,
    V138_PLAN_262_29_CANONICAL_PATHS.reviewFix),
  fixesApplied === "true" ? "required" : "absent")
  if (fix !== undefined) {
    const fixValues = frontmatterScalars(fix,
      "V138_PLAN_262_28_REVIEW_FIX_INVALID")
    if (fixValues.get("status") !== "all_fixed" ||
      fixValues.get("skipped") !== "0" ||
      fixValues.get("final_source_a5") !== sourceA5) {
      fail("V138_PLAN_262_28_REVIEW_FIX_INVALID")
    }
  }
  return Object.freeze({ bytes, fix })
}

const plan26229Destinations = () => Object.freeze([
  V138_PLAN_262_29_CANONICAL_PATHS.authorization,
  V138_PLAN_262_29_CANONICAL_PATHS.seal,
  ...V138_PLAN_262_30_FRESH_DESTINATIONS,
])

const renderV138Plan26229AuthorizationLiteral = (
  repoRoot: string,
  sourceA5Input: string,
  history: Pick<ReturnType<typeof deriveV138ProtectedHistoryV5>,
    "protectedHistoryRoot" | "cumulativeChargedPublicAttemptIds" |
    "priorAuthorizationBytes">,
): string => {
  const sourceA5 = fullCommit(repoRoot, sourceA5Input)
  const review = reviewMetadataV5(repoRoot, sourceA5)
  const custody = inspectSourceCustodyA5({ repoRoot,
    sourceBase5: V138_PLAN_262_28_SOURCE_BASE5, sourceA5 })
  const closure = deriveSelectedRouteClosureAtCommit(repoRoot, sourceA5)
  const reviewRoots = [sha256(review.bytes),
    ...(review.fix === undefined ? [] : [sha256(review.fix)])]
  return `Authorize Phase 262 Plans 262-29 and 262-30 over independently reviewed source commit ${sourceA5} (tree ${custody.sourceA5Tree}; parents ${custody.sourceA5Parents.join(",")}; sourceBase5 ${custody.sourceBase5}; custody ${custody.custodyRoot}; selected-route ${closure.closureRoot}; review-roots ${reviewRoots.join(",")}) as roryquinlan-repository-operator for route ordinal 5: exactly one separately committed direct-child successor-source seal B5, exactly one Pattern C main-orchestrator execution-context:v9, exactly one darwin-memorystatus-effective-available-basis-points-v1 headroom-preflight:v9 at the unchanged inclusive 2,500-basis-point threshold, exactly one calibration:v9 eight-attempt/four-shard allocation, and—only if calibration:v9 is admitted—at most one fresh reproduction:v10 540-cell run. This authority binds canonical destinations ${plan26229Destinations().join(",")}; archived A2 ${V138_REVIEWED_SOURCE_A2}, B2 ${V138_REVIEWED_SOURCE_B2}, A3 ${V138_REVIEWED_SOURCE_A3}, B3 ${V138_REVIEWED_SOURCE_B3}, A4 ${V138_REVIEWED_SOURCE_A4}, B4 ${V138_REVIEWED_SOURCE_B4}, protected history ${history.protectedHistoryRoot}, cumulative charged identities ${history.cumulativeChargedPublicAttemptIds.join(",")}, and every prior authorization byte ${history.priorAuthorizationBytes.map(({ sha256: root }) => root).join(",")}. Every frozen 200 ms sampling, inclusive 2,500-basis-point gate, eight-attempt/four-shard allocation, conditional 540-cell reproduction, runtime/kernel/historical predicate, lineage, accounting, gameplay, privacy, and formation-absence bound remains unchanged. This authorization grants no authority to mutate, replace, delete, reinterpret, retry, reuse, or consume any v5/v6/v7/v8 artifact or prior authorization bytes, and grants no execution before B5 is checked. It is single-use, has no retry, and expires at the first seal refusal or failure or any Plan 262-30 terminal outcome.`
}

export const v138Plan26229AuthorizationLiteral = (
  repoRoot: string,
  sourceA5Input: string,
): string => renderV138Plan26229AuthorizationLiteral(repoRoot, sourceA5Input,
  deriveV138ProtectedHistoryV5(repoRoot, fullCommit(repoRoot, sourceA5Input)))

const deriveAuthorizationV5 = (repoRoot: string, sourceA5: string,
  literalBytes: Uint8Array) => {
  const literal = Buffer.from(v138Plan26229AuthorizationLiteral(repoRoot,
    sourceA5), "utf8")
  if (!literal.equals(Buffer.from(literalBytes))) {
    fail("V138_PLAN_262_29_AUTHORIZATION_LITERAL_INVALID")
  }
  const sourceCustody = inspectSourceCustodyA5({ repoRoot,
    sourceBase5: V138_PLAN_262_28_SOURCE_BASE5, sourceA5 })
  const history = deriveV138ProtectedHistoryV5(repoRoot, sourceA5)
  const selectedRouteClosure = deriveSelectedRouteClosureAtCommit(repoRoot,
    sourceA5)
  const body = {
    schemaVersion: V138_PLAN_262_29_AUTHORIZATION_SCHEMA,
    routeOrdinal: 5 as const,
    operator: V138_PLAN_262_15_OPERATOR,
    sourceCustody,
    selectedRouteClosure,
    selectedRouteClosureRoot: selectedRouteClosure.closureRoot,
    protectedHistoryRoot: history.protectedHistoryRoot,
    sourceA2: V138_REVIEWED_SOURCE_A2, sourceB2: V138_REVIEWED_SOURCE_B2,
    sourceA3: V138_REVIEWED_SOURCE_A3, sourceB3: V138_REVIEWED_SOURCE_B3,
    sourceA4: V138_REVIEWED_SOURCE_A4, sourceB4: V138_REVIEWED_SOURCE_B4,
    cumulativeChargedPublicAttemptIds:
      history.cumulativeChargedPublicAttemptIds,
    priorAuthorizationBytes: history.priorAuthorizationBytes,
    canonicalDestinations: plan26229Destinations(),
    frozenPolicyRoot: frozenPolicyRootV2(),
    literalSha256: sha256(literalBytes),
    sealCount: 1 as const, contextCount: 1 as const,
    preflightCount: 1 as const, calibrationAllocationCount: 1 as const,
    calibrationAttemptCount: 8 as const, calibrationShardCount: 4 as const,
    reproductionMaximumCount: 1 as const, reproductionCellCount: 540 as const,
    resourceSampleMilliseconds: 200 as const,
    requiredHostHeadroomBasisPoints: 2500 as const,
    singleUse: true as const, noRetry: true as const,
    noPriorAuthorityReuse: true as const,
    noExecutionBeforeCheckedB5: true as const,
    expiresAt: "first_seal_refusal_failure_or_plan_262_30_terminal" as const,
  }
  return Object.freeze({ ...body, authorizationRoot: identityRoot(
    "evidenceBundle", body.schemaVersion, body) })
}

export const buildV138Plan26229AuthorizationV5 = (repoRoot: string,
  sourceA5: string, literalBytes: Uint8Array) => {
  regularFile(path.resolve(repoRoot,
    V138_PLAN_262_29_CANONICAL_PATHS.authorization), "absent")
  regularFile(path.resolve(repoRoot,
    V138_PLAN_262_29_CANONICAL_PATHS.seal), "absent")
  for (const repoPath of V138_PLAN_262_30_FRESH_DESTINATIONS) {
    regularFile(path.resolve(repoRoot, repoPath), "absent")
  }
  return deriveAuthorizationV5(repoRoot, fullCommit(repoRoot, sourceA5),
    literalBytes)
}

export const checkV138Plan26229AuthorizationV5 = (repoRoot: string,
  value: unknown, literalBytes?: Uint8Array) => {
  if (!isRecord(value) || value.schemaVersion !==
    V138_PLAN_262_29_AUTHORIZATION_SCHEMA || !isRecord(value.sourceCustody) ||
    typeof value.sourceCustody.sourceA5 !== "string") {
    fail("V138_PLAN_262_29_AUTHORIZATION_SCHEMA_INVALID")
  }
  const sourceA5 = value.sourceCustody.sourceA5
  const bytes = literalBytes ?? Buffer.from(v138Plan26229AuthorizationLiteral(
    repoRoot, sourceA5), "utf8")
  const expected = deriveAuthorizationV5(repoRoot, sourceA5, bytes)
  if (canonical(value) !== canonical(expected)) {
    fail("V138_PLAN_262_29_AUTHORIZATION_INVALID")
  }
  return expected
}

export const buildV138SuccessorSourceSealV5 = (input: {
  readonly repoRoot: string
  readonly authorization: unknown
}) => {
  const authorization = checkV138Plan26229AuthorizationV5(input.repoRoot,
    input.authorization)
  const sourceA5 = authorization.sourceCustody.sourceA5
  const review = reviewMetadataV5(input.repoRoot, sourceA5)
  const body = {
    schemaVersion: V138_SUCCESSOR_SOURCE_SEAL_V5_SCHEMA,
    sealOrdinal: 5 as const,
    canonicalizationId: "canonical-json-v1.1" as const,
    sourceCustody: authorization.sourceCustody,
    selectedRouteClosure: authorization.selectedRouteClosure,
    reviewRoots: Object.freeze([
      Object.freeze({ path: V138_PLAN_262_29_CANONICAL_PATHS.review,
        sha256: sha256(review.bytes) }),
      ...(review.fix === undefined ? [] : [Object.freeze({
        path: V138_PLAN_262_29_CANONICAL_PATHS.reviewFix,
        sha256: sha256(review.fix) })]),
    ]),
    protectedHistory: deriveV138ProtectedHistoryV5(input.repoRoot, sourceA5),
    frozenPolicy: deriveFrozenPolicy(), toolIdentity: deriveToolIdentity(),
    hostIdentity: deriveHostIdentity(),
    formationAbsence: deriveFormationAbsence(input.repoRoot, sourceA5),
    replacementMetricContract: deriveReplacementMetricContract(
      input.repoRoot, sourceA5),
    canonicalDestinations: authorization.canonicalDestinations,
    authorizationRoot: authorization.authorizationRoot,
  }
  return Object.freeze({ ...body, sealRoot: identityRoot(
    "containmentPolicy", body.schemaVersion, body) })
}

export const checkV138SuccessorSourceSealV5 = (repoRoot: string,
  value: unknown, authorizationValue: unknown) => {
  if (!isRecord(value) || value.schemaVersion !==
    V138_SUCCESSOR_SOURCE_SEAL_V5_SCHEMA) {
    fail("V138_SUCCESSOR_SEAL_V5_SCHEMA_INVALID")
  }
  const expected = buildV138SuccessorSourceSealV5({ repoRoot,
    authorization: authorizationValue })
  if (canonical(value) !== canonical(expected)) {
    fail("V138_SUCCESSOR_SEAL_V5_INVALID")
  }
  return expected
}

export const checkV138SealedWorktreeAtA5 = (repoRoot: string,
  seal: ReturnType<typeof buildV138SuccessorSourceSealV5>): true => {
  const sourceA5 = seal.sourceCustody.sourceA5
  const records = [...seal.sourceCustody.sourceBlobs,
    ...seal.protectedHistory.artifacts,
    ...seal.protectedHistory.priorAuthorizationBytes,
    ...seal.selectedRouteClosure.sourceBlobs,
    ...seal.selectedRouteClosure.resolverMetadata]
  const seen = new Map<string, Sha256>()
  for (const record of records) {
    const prior = seen.get(record.path)
    if (prior !== undefined && prior !== record.sha256) {
      fail("V138_SEALED_WORKTREE_V5_IDENTITY_CONFLICT")
    }
    seen.set(record.path, record.sha256)
  }
  for (const [repoPath, expectedRoot] of seen) {
    const working = regularFile(path.resolve(repoRoot, repoPath), "required")!
    const committed = readCommitFile(repoRoot, sourceA5, repoPath)
    if (sha256(working) !== expectedRoot || sha256(committed) !== expectedRoot ||
      !working.equals(committed)) fail("V138_SEALED_WORKTREE_V5_DRIFT")
  }
  for (const repoPath of [V138_PLAN_262_25_FRESH_DESTINATIONS[3],
    V138_PLAN_262_25_FRESH_DESTINATIONS[7]]) {
    requireAbsentAtCommit(repoRoot, sourceA5, repoPath,
      "V138_PROTECTED_HISTORY_V5_REQUIRED_ABSENCE_INVALID")
    regularFile(path.resolve(repoRoot, repoPath), "absent")
  }
  return true
}

export const writeV138Plan26229AuthorizationV5 = (repoRoot: string,
  targetPath: string, sourceA5: string, literalBytes: Uint8Array) => {
  const target = canonicalPath(repoRoot, targetPath,
    V138_PLAN_262_29_CANONICAL_PATHS.authorization)
  const value = buildV138Plan26229AuthorizationV5(repoRoot, sourceA5,
    literalBytes)
  writeV138CanonicalExclusiveV2(repoRoot, target, value)
  return value
}

export const writeV138SuccessorSourceSealV5 = (repoRoot: string,
  targetPath: string, authorization: unknown) => {
  const target = canonicalPath(repoRoot, targetPath,
    V138_PLAN_262_29_CANONICAL_PATHS.seal)
  regularFile(target, "absent")
  const value = buildV138SuccessorSourceSealV5({ repoRoot, authorization })
  writeV138CanonicalExclusiveV2(repoRoot, target, value)
  return value
}

const V138_RETAINED_PROTECTED_HISTORY_V5 = Object.freeze({
  protectedHistoryRoot:
    "sha256:b34b487cac2fba49603cdf941b405a65f689fc16dabfe7d0f128f185ab202034" as Sha256,
  cumulativeChargedPublicAttemptIds: Object.freeze([5, 6, 7, 8].flatMap(
    (version) => Array.from({ length: 8 }, (_, index) =>
      `calibration:v${version}:${index}`))),
  priorAuthorizationBytes: Object.freeze([
    { path: ".planning/artifacts/v1.38-plan-262-15-authorization-v1.json",
      blobOid: "0183733a18d4bdbf61c46e723373ec8359f2944f", byteLength: 570,
      sha256: "sha256:1e58a293effd7e84e7c88978dd9dda0dd0ef07c3d66e85312f457a4d183c0220" as Sha256 },
    { path: V138_PLAN_262_18_CANONICAL_PATHS.authorization,
      blobOid: "2843f136e5c48513e66ace422b5db826bcd51971", byteLength: 9063,
      sha256: "sha256:514320cce291d5137e6ddf9c2b92ae1941e8f00bf4eb9480d7ea38cc01e0fffa" as Sha256 },
    { path: V138_PLAN_262_21_CANONICAL_PATHS.authorization,
      blobOid: "703513ce15c27bf0ffefe632c9bb8fa2033310a8", byteLength: 6188,
      sha256: "sha256:30c4f8a85678b0e274588be9a038cd59c824ad892b987ca79d1de35806823734" as Sha256 },
    { path: V138_PLAN_262_24_CANONICAL_PATHS.authorization,
      blobOid: "e3f5ff9db66401adfa7d39bbefb94aa9170b7049", byteLength: 172878,
      sha256: "sha256:1b18234f0e2255af852038e153355fa3295f4e7863966803b335285e3da85eea" as Sha256 },
  ]),
})

const checkV138Plan26229AuthorizationV5ExceptProtectedHistory = (
  repoRoot: string, value: unknown, sourceA5: string,
) => {
  if (!isRecord(value) || !isRecord(value.sourceCustody) ||
    !isRecord(value.selectedRouteClosure)) {
    fail("V138_PLAN_262_29_AUTHORIZATION_SCHEMA_INVALID")
  }
  const custody = inspectSourceCustodyA5({ repoRoot,
    sourceBase5: V138_PLAN_262_28_SOURCE_BASE5, sourceA5 })
  const closure = deriveSelectedRouteClosureAtCommit(repoRoot, sourceA5)
  const expectedLiteralSha256 = sha256(Buffer.from(
    renderV138Plan26229AuthorizationLiteral(repoRoot, sourceA5,
      V138_RETAINED_PROTECTED_HISTORY_V5), "utf8"))
  const exactNonHistory: Record<string, unknown> = {
    schemaVersion: V138_PLAN_262_29_AUTHORIZATION_SCHEMA, routeOrdinal: 5,
    operator: V138_PLAN_262_15_OPERATOR, sourceCustody: custody,
    selectedRouteClosure: closure, selectedRouteClosureRoot: closure.closureRoot,
    sourceA2: V138_REVIEWED_SOURCE_A2, sourceB2: V138_REVIEWED_SOURCE_B2,
    sourceA3: V138_REVIEWED_SOURCE_A3, sourceB3: V138_REVIEWED_SOURCE_B3,
    sourceA4: V138_REVIEWED_SOURCE_A4, sourceB4: V138_REVIEWED_SOURCE_B4,
    canonicalDestinations: plan26229Destinations(),
    frozenPolicyRoot: frozenPolicyRootV2(), sealCount: 1, contextCount: 1,
    preflightCount: 1, calibrationAllocationCount: 1,
    calibrationAttemptCount: 8, calibrationShardCount: 4,
    reproductionMaximumCount: 1, reproductionCellCount: 540,
    resourceSampleMilliseconds: 200,
    requiredHostHeadroomBasisPoints: 2500, singleUse: true, noRetry: true,
    noPriorAuthorityReuse: true, noExecutionBeforeCheckedB5: true,
    expiresAt: "first_seal_refusal_failure_or_plan_262_30_terminal",
  }
  for (const [key, expected] of Object.entries(exactNonHistory)) {
    if (canonical(value[key]) !== canonical(expected)) {
      fail("V138_PLAN_262_29_AUTHORIZATION_NON_HISTORY_INVALID")
    }
  }
  const expectedKeys = [...Object.keys(exactNonHistory),
    "protectedHistoryRoot", "cumulativeChargedPublicAttemptIds",
    "priorAuthorizationBytes", "literalSha256", "authorizationRoot"]
  if (canonical(sorted(Object.keys(value))) !==
    canonical(sorted(expectedKeys))) {
    fail("V138_PLAN_262_29_AUTHORIZATION_SCHEMA_INVALID")
  }
  if (value.protectedHistoryRoot !==
      V138_RETAINED_PROTECTED_HISTORY_V5.protectedHistoryRoot ||
    value.literalSha256 !== expectedLiteralSha256 ||
    canonical(value.cumulativeChargedPublicAttemptIds) !== canonical(
      V138_RETAINED_PROTECTED_HISTORY_V5.cumulativeChargedPublicAttemptIds) ||
    canonical(value.priorAuthorizationBytes) !== canonical(
      V138_RETAINED_PROTECTED_HISTORY_V5.priorAuthorizationBytes) ||
    !isSha256(value.authorizationRoot)) {
    fail("V138_PLAN_262_29_AUTHORIZATION_HISTORY_ANCHOR_INVALID")
  }
  const body = { ...value }; delete body.authorizationRoot
  if (value.authorizationRoot !== identityRoot("evidenceBundle",
    V138_PLAN_262_29_AUTHORIZATION_SCHEMA, body)) {
    fail("V138_PLAN_262_29_AUTHORIZATION_HISTORY_ANCHOR_INVALID")
  }
  return value
}

/**
 * Validates only the immutable B5 byte/custody anchor. Unlike the full route
 * checker it deliberately does not re-observe tool identity, protected
 * history, formation absence, or executor ownership, so an independently
 * proven failure of one of those prerequisites can still be terminalized.
 */
const inspectV138SuccessorSealCommitV5AnchorInternal = (input: {
  readonly repoRoot: string; readonly sourceA5: string;
  readonly sourceB5: string; readonly allowProtectedHistoryFailure?: true
}) => {
  const sourceA5 = fullCommit(input.repoRoot, input.sourceA5)
  const sourceB5 = fullCommit(input.repoRoot, input.sourceB5)
  const parents = gitText(input.repoRoot, ["rev-list", "--parents", "-n", "1",
    sourceB5]).split(" ")
  if (parents.length !== 2 || parents[1] !== sourceA5) {
    fail("V138_SUCCESSOR_SEAL_B5_PARENT_INVALID")
  }
  const changedPaths = sorted(gitText(input.repoRoot, ["diff-tree",
    "--no-commit-id", "--name-only", "-r", "--no-renames", sourceB5])
    .split("\n").filter(Boolean).map(normalize))
  const expectedPaths = sorted([V138_PLAN_262_29_CANONICAL_PATHS.authorization,
    V138_PLAN_262_29_CANONICAL_PATHS.seal])
  if (canonical(changedPaths) !== canonical(expectedPaths)) {
    fail("V138_SUCCESSOR_SEAL_B5_DELTA_INVALID")
  }
  for (const repoPath of expectedPaths) {
    requireAbsentAtCommit(input.repoRoot, sourceA5, repoPath,
      "V138_SUCCESSOR_SEAL_V5_EXISTED_AT_A5")
    const working = regularFile(path.resolve(input.repoRoot, repoPath),
      "required")!
    if (!working.equals(readCommitFile(input.repoRoot, sourceB5, repoPath))) {
      fail("V138_SUCCESSOR_SEAL_B5_WORKTREE_DRIFT")
    }
  }
  const authorizationValue = JSON.parse(readCommitFile(input.repoRoot, sourceB5,
    V138_PLAN_262_29_CANONICAL_PATHS.authorization).toString("utf8"))
  const seal = JSON.parse(readCommitFile(input.repoRoot, sourceB5,
    V138_PLAN_262_29_CANONICAL_PATHS.seal).toString("utf8"))
  const authorization = input.allowProtectedHistoryFailure === true ?
    checkV138Plan26229AuthorizationV5ExceptProtectedHistory(input.repoRoot,
      authorizationValue, sourceA5) :
    checkV138Plan26229AuthorizationV5(input.repoRoot, authorizationValue)
  const sealKeys = ["schemaVersion", "sealOrdinal", "canonicalizationId",
    "sourceCustody", "selectedRouteClosure", "reviewRoots",
    "protectedHistory", "frozenPolicy", "toolIdentity", "hostIdentity",
    "formationAbsence", "replacementMetricContract", "canonicalDestinations",
    "authorizationRoot", "sealRoot"]
  if (!isRecord(seal) ||
    canonical(sorted(Object.keys(seal))) !== canonical(sorted(sealKeys)) ||
    seal.schemaVersion !== V138_SUCCESSOR_SOURCE_SEAL_V5_SCHEMA ||
    authorization.sourceCustody.sourceA5 !== sourceA5 ||
    !isRecord(seal.sourceCustody) || !isRecord(seal.selectedRouteClosure) ||
    canonical(seal.sourceCustody) !== canonical(authorization.sourceCustody) ||
    canonical(seal.selectedRouteClosure) !==
      canonical(authorization.selectedRouteClosure) ||
    !isRecord(seal.protectedHistory) ||
    seal.protectedHistory.protectedHistoryRoot !==
      authorization.protectedHistoryRoot ||
    seal.authorizationRoot !== authorization.authorizationRoot) {
    fail("V138_SUCCESSOR_SEAL_V5_ANCHOR_INVALID")
  }
  const sealBody = { ...seal }
  delete sealBody.sealRoot
  const retainedHistory = { ...(seal.protectedHistory as Record<string,
    unknown>) }
  const retainedHistoryRoot = retainedHistory.protectedHistoryRoot
  delete retainedHistory.protectedHistoryRoot
  if (seal.sealRoot !== identityRoot("containmentPolicy",
      V138_SUCCESSOR_SOURCE_SEAL_V5_SCHEMA, sealBody) ||
    retainedHistory.schemaVersion !== "v1.38-protected-stopped-history-v5" ||
    retainedHistoryRoot !== identityRoot("evidenceBundle",
      "v1.38-protected-stopped-history-v5", retainedHistory)) {
    fail("V138_SUCCESSOR_SEAL_V5_ANCHOR_INVALID")
  }
  const body = { schemaVersion: "v1.38-source-b5-anchor-v1" as const,
    sourceA5, sourceB5, sourceB5Tree: gitText(input.repoRoot,
      ["rev-parse", `${sourceB5}^{tree}`]), sourceB5Parent: sourceA5,
    changedPaths: Object.freeze(changedPaths),
    authorizationRoot: authorization.authorizationRoot as Sha256,
    sealRoot: seal.sealRoot as Sha256 }
  return Object.freeze({ ...body, authorization, seal,
    anchorRoot: identityRoot("containmentPolicy", body.schemaVersion, body) })
}

export const inspectV138SuccessorSealCommitV5Anchor = (input: {
  readonly repoRoot: string; readonly sourceA5: string;
  readonly sourceB5: string
}) => inspectV138SuccessorSealCommitV5AnchorInternal(input)

export const inspectV138ProtectedHistoryFailureSealCommitV5Anchor = (input: {
  readonly repoRoot: string; readonly sourceA5: string;
  readonly sourceB5: string
}) => inspectV138SuccessorSealCommitV5AnchorInternal({ ...input,
  allowProtectedHistoryFailure: true })

export const checkV138SuccessorSourceSealV5Except = (
  repoRoot: string,
  sealValue: unknown,
  authorizationValue: unknown,
  omitted: "toolIdentity" | "protectedHistory" | "formationAbsence" | null,
) => {
  const authorizationRecord = isRecord(authorizationValue) ?
    authorizationValue : undefined
  const authorization = omitted === "protectedHistory" ?
    checkV138Plan26229AuthorizationV5ExceptProtectedHistory(repoRoot,
      authorizationValue, authorizationRecord !== undefined &&
        isRecord(authorizationRecord.sourceCustody) ?
        String(authorizationRecord.sourceCustody.sourceA5) : "") :
    checkV138Plan26229AuthorizationV5(repoRoot, authorizationValue)
  if (!isRecord(sealValue)) fail("V138_SUCCESSOR_SEAL_V5_SCHEMA_INVALID")
  if (omitted === null) {
    return checkV138SuccessorSourceSealV5(repoRoot, sealValue, authorization)
  }
  const sourceA5 = authorization.sourceCustody.sourceA5
  const review = reviewMetadataV5(repoRoot, sourceA5)
  const expected: Record<string, unknown> = {
    schemaVersion: V138_SUCCESSOR_SOURCE_SEAL_V5_SCHEMA,
    sealOrdinal: 5 as const,
    canonicalizationId: "canonical-json-v1.1" as const,
    sourceCustody: authorization.sourceCustody,
    selectedRouteClosure: authorization.selectedRouteClosure,
    reviewRoots: Object.freeze([
      Object.freeze({ path: V138_PLAN_262_29_CANONICAL_PATHS.review,
        sha256: sha256(review.bytes) }),
      ...(review.fix === undefined ? [] : [Object.freeze({
        path: V138_PLAN_262_29_CANONICAL_PATHS.reviewFix,
        sha256: sha256(review.fix) })]),
    ]),
    frozenPolicy: deriveFrozenPolicy(),
    hostIdentity: deriveHostIdentity(),
    replacementMetricContract: deriveReplacementMetricContract(repoRoot,
      sourceA5),
    canonicalDestinations: authorization.canonicalDestinations,
    authorizationRoot: authorization.authorizationRoot,
  }
  if (omitted !== "protectedHistory") {
    expected.protectedHistory = deriveV138ProtectedHistoryV5(repoRoot,
      sourceA5)
  }
  if (omitted !== "toolIdentity") expected.toolIdentity = deriveToolIdentity()
  if (omitted !== "formationAbsence") {
    expected.formationAbsence = deriveFormationAbsence(repoRoot, sourceA5)
  }
  const keys = [...Object.keys(expected), omitted, "sealRoot"]
  if (canonical(sorted(Object.keys(sealValue))) !== canonical(sorted(keys))) {
    fail("V138_SUCCESSOR_SEAL_V5_SCHEMA_INVALID")
  }
  for (const key of keys) {
    if (key === omitted || key === "sealRoot") continue
    if (canonical(sealValue[key]) !== canonical(expected[key])) {
      fail("V138_SUCCESSOR_SEAL_V5_NONFAILING_FIELD_INVALID")
    }
  }
  return sealValue
}

export const checkV138SuccessorSealCommitV5 = (input: {
  readonly repoRoot: string
  readonly sourceA5: string
  readonly sourceB5: string
  readonly allowPlan26230Artifacts?: true
}) => {
  const sourceA5 = fullCommit(input.repoRoot, input.sourceA5)
  const sourceB5 = fullCommit(input.repoRoot, input.sourceB5)
  const parents = gitText(input.repoRoot, ["rev-list", "--parents", "-n", "1",
    sourceB5]).split(" ")
  if (parents.length !== 2 || parents[1] !== sourceA5) {
    fail("V138_SUCCESSOR_SEAL_B5_PARENT_INVALID")
  }
  const changedPaths = sorted(gitText(input.repoRoot, ["diff-tree",
    "--no-commit-id", "--name-only", "-r", "--no-renames", sourceB5,
  ]).split("\n").filter(Boolean).map(normalize))
  const expectedPaths = sorted([V138_PLAN_262_29_CANONICAL_PATHS.authorization,
    V138_PLAN_262_29_CANONICAL_PATHS.seal])
  if (canonical(changedPaths) !== canonical(expectedPaths)) {
    fail("V138_SUCCESSOR_SEAL_B5_DELTA_INVALID")
  }
  for (const repoPath of expectedPaths) {
    requireAbsentAtCommit(input.repoRoot, sourceA5, repoPath,
      "V138_SUCCESSOR_SEAL_V5_EXISTED_AT_A5")
    const working = regularFile(path.resolve(input.repoRoot, repoPath),
      "required")!
    if (!working.equals(readCommitFile(input.repoRoot, sourceB5, repoPath))) {
      fail("V138_SUCCESSOR_SEAL_B5_WORKTREE_DRIFT")
    }
  }
  const authorization = checkV138Plan26229AuthorizationV5(input.repoRoot,
    JSON.parse(readCommitFile(input.repoRoot, sourceB5,
      V138_PLAN_262_29_CANONICAL_PATHS.authorization).toString("utf8")))
  const seal = checkV138SuccessorSourceSealV5(input.repoRoot,
    JSON.parse(readCommitFile(input.repoRoot, sourceB5,
      V138_PLAN_262_29_CANONICAL_PATHS.seal).toString("utf8")), authorization)
  checkV138SealedWorktreeAtA5(input.repoRoot, seal)
  if (input.allowPlan26230Artifacts !== true) {
    for (const repoPath of V138_PLAN_262_30_FRESH_DESTINATIONS) {
      regularFile(path.resolve(input.repoRoot, repoPath), "absent")
    }
  }
  const body = { schemaVersion: "v1.38-source-b5-custody-v1" as const,
    sourceA5, sourceB5,
    sourceB5Tree: gitText(input.repoRoot, ["rev-parse", `${sourceB5}^{tree}`]),
    sourceB5Parent: sourceA5, changedPaths: Object.freeze(changedPaths),
    blobs: Object.freeze(expectedPaths.map((repoPath) =>
      blobRecord(input.repoRoot, sourceB5, repoPath))),
    authorizationRoot: authorization.authorizationRoot, sealRoot: seal.sealRoot }
  return Object.freeze({ ...body, custodyRoot: identityRoot(
    "containmentPolicy", body.schemaVersion, body) })
}

export const V138_PLAN_262_47_AUTHORIZATION_SCHEMA =
  "v1.38-plan-262-47-authorization-v6" as const
export const V138_SUCCESSOR_SOURCE_SEAL_V6_SCHEMA =
  "v1.38-successor-source-seal-v6" as const
export const V138_PLAN_262_47_PRE_EXECUTION_SOURCE_FAILURE_SCHEMA =
  "v1.38-plan-262-47-pre-execution-source-failure-v1" as const
export const V138_PLAN_262_47_PRE_EXECUTION_SOURCE_FAILURE_PATH =
  ".planning/artifacts/v1.38-plan-262-47-pre-execution-source-failure-v1.json" as const
const V138_PLAN_262_47_SOURCE_A6 =
  "600c7770867e6090147914dc090780f5b63930ec" as const
const V138_PLAN_262_47_SOURCE_B6 =
  "e2166736c2a1a3f1decbb1d6b3722f87945a47ea" as const
export const V138_PLAN_262_47_CANONICAL_PATHS = Object.freeze({
  authorization:
    ".planning/artifacts/v1.38-plan-262-47-authorization-v6.json",
  seal: ".planning/artifacts/v1.38-successor-source-seal-v6.json",
  localSealVerification:
    ".planning/artifacts/v1.38-local-seal-independent-verification-v3.json",
  localSealReview:
    ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-52-REVIEW.md",
  sourceReview:
    ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-47-REVIEW.md",
})
export const V138_PLAN_262_47_FRESH_DESTINATIONS = Object.freeze([
  ".planning/artifacts/v1.38-current-matrix-execution-context-v10.json",
  ".planning/artifacts/v1.38-current-matrix-headroom-preflight-v10.json",
  ".planning/artifacts/v1.38-current-matrix-calibration-v10.json",
  ".planning/artifacts/v1.38-current-matrix-reproduction-v11.json",
  ".planning/artifacts/v1.38-plan-262-47-terminal-v1.json",
  ".planning/artifacts/v1.38-plan-262-47-preflight-consumption-v1.json",
  ".planning/artifacts/v1.38-plan-262-47-calibration-consumption-v1.json",
  ".planning/artifacts/v1.38-plan-262-47-reproduction-consumption-v1.json",
] as const)
export const V138_PLAN_262_47_SOURCE_PATHS = Object.freeze([
  "scripts/evaluate-v1-38-successor-route.test.ts",
  "scripts/lib/v1-38-current-matrix-reproduction.ts",
  "scripts/lib/v1-38-successor-source-seal.ts",
] as const)

const plan26247Destinations = () => Object.freeze([
  V138_PLAN_262_47_CANONICAL_PATHS.authorization,
  V138_PLAN_262_47_CANONICAL_PATHS.seal,
  ...V138_PLAN_262_47_FRESH_DESTINATIONS,
])

export const inspectV138SourceIdentityA6 = (repoRoot: string,
  sourceInput: string) => {
  let reviewedSourceCommit: string
  try { reviewedSourceCommit = fullCommit(repoRoot, sourceInput) } catch {
    fail("V138_PLAN_262_47_SOURCE_IDENTITY_INVALID")
  }
  const [commit, tree, parents = ""] = gitText(repoRoot, ["show", "-s",
    "--format=%H%n%T%n%P", reviewedSourceCommit]).split("\n")
  const reviewedSourceParents = Object.freeze(parents.split(" ").filter(Boolean))
  if (commit !== reviewedSourceCommit || !/^[0-9a-f]{40}$/u.test(tree!) ||
    reviewedSourceParents.length !== 1 || reviewedSourceParents.some(
      (parent) => !/^[0-9a-f]{40}$/u.test(parent))) {
    fail("V138_PLAN_262_47_SOURCE_IDENTITY_INVALID")
  }
  const reviewedSourceBlobs = Object.freeze(V138_PLAN_262_47_SOURCE_PATHS.map(
    (repoPath) => blobRecord(repoRoot, reviewedSourceCommit, repoPath)))
  return Object.freeze({ reviewedSourceCommit,
    reviewedSourceTree: tree!, reviewedSourceParents, reviewedSourceBlobs })
}

const V138_PLAN_262_47_HISTORY_PATHS = Object.freeze([
  V138_PLAN_262_29_CANONICAL_PATHS.authorization,
  V138_PLAN_262_29_CANONICAL_PATHS.seal,
  V138_PLAN_262_30_FRESH_DESTINATIONS[0],
  V138_PLAN_262_30_FRESH_DESTINATIONS[1],
  V138_PLAN_262_30_FRESH_DESTINATIONS[2],
  V138_PLAN_262_30_FRESH_DESTINATIONS[4],
  V138_PLAN_262_30_FRESH_DESTINATIONS[5],
  V138_PLAN_262_30_FRESH_DESTINATIONS[6],
] as const)

const v138Plan26247HistoryCache = new Map<string, ReturnType<
  typeof deriveV138ProtectedHistoryV6>>()
const v138Plan26247ClosureCache = new Map<string, ReturnType<
  typeof deriveSelectedRouteClosureAtCommit>>()
const plan26247Closure = (repoRoot: string, sourceCommit: string) => {
  const key = `${repoRoot}\0${sourceCommit}`
  const prior = v138Plan26247ClosureCache.get(key)
  if (prior !== undefined) return prior
  const value = deriveSelectedRouteClosureAtCommit(repoRoot, sourceCommit)
  v138Plan26247ClosureCache.set(key, value)
  return value
}

export const deriveV138ProtectedHistoryV6 = (repoRoot: string,
  sourceInput: string, useCache = true) => {
  const source = inspectV138SourceIdentityA6(repoRoot, sourceInput)
  const cacheKey = `${repoRoot}\0${source.reviewedSourceCommit}`
  const cached = v138Plan26247HistoryCache.get(cacheKey)
  if (useCache && cached !== undefined) return cached
  for (const repoPath of [V138_PLAN_262_30_FRESH_DESTINATIONS[3],
    V138_PLAN_262_30_FRESH_DESTINATIONS[7]]) {
    requireAbsentAtCommit(repoRoot, source.reviewedSourceCommit, repoPath,
      "V138_PROTECTED_HISTORY_V6_REPRODUCTION_V10_PRESENT")
    regularFile(path.resolve(repoRoot, repoPath), "absent")
  }
  const terminal = parseCommitJson(repoRoot, source.reviewedSourceCommit,
    V138_PLAN_262_30_FRESH_DESTINATIONS[4])
  const calibration = parseCommitJson(repoRoot, source.reviewedSourceCommit,
    V138_PLAN_262_30_FRESH_DESTINATIONS[2])
  const expectedV9 = Array.from({ length: 8 }, (_, index) =>
    `calibration:v9:${index}`)
  if (terminal?.schemaVersion !== "v1.38-plan-262-30-terminal-v1" ||
    terminal.disposition !== "calibration_stopped" ||
    terminal.authorityExpired !== true || terminal.noRetry !== true ||
    terminal.acceptedCellCount !== 0 || terminal.completeCleanup !== true ||
    calibration?.schemaVersion !== "v1.38-current-matrix-calibration-v9" ||
    !Array.isArray(calibration.attempts) || canonical(calibration.attempts.map(
      (entry) => isRecord(entry) ? entry.publicAttemptId : null)) !==
      canonical(expectedV9)) {
    fail("V138_PROTECTED_HISTORY_V6_TERMINAL_INVALID")
  }
  const prior = [
    ".planning/artifacts/v1.38-plan-262-15-authorization-v1.json",
    V138_PLAN_262_18_CANONICAL_PATHS.authorization,
    V138_PLAN_262_21_CANONICAL_PATHS.authorization,
    V138_PLAN_262_24_CANONICAL_PATHS.authorization,
    V138_PLAN_262_29_CANONICAL_PATHS.authorization,
  ] as const
  const priorHistory = deriveV138ProtectedHistoryV5(repoRoot,
    source.reviewedSourceCommit)
  const cumulativeChargedPublicAttemptIds = Object.freeze([
    ...priorHistory.cumulativeChargedPublicAttemptIds, ...expectedV9,
  ])
  if (cumulativeChargedPublicAttemptIds.length !== 40 ||
    new Set(cumulativeChargedPublicAttemptIds).size !== 40) {
    fail("V138_PROTECTED_HISTORY_V6_CHARGES_INVALID")
  }
  const body = { schemaVersion: "v1.38-protected-stopped-history-v6" as const,
    protectedV5Root: priorHistory.protectedHistoryRoot,
    artifacts: Object.freeze(V138_PLAN_262_47_HISTORY_PATHS.map((repoPath) =>
      blobRecord(repoRoot, source.reviewedSourceCommit, repoPath))),
    priorAuthorizationBytes: Object.freeze(prior.map((repoPath) =>
      blobRecord(repoRoot, source.reviewedSourceCommit, repoPath))),
    cumulativeChargedPublicAttemptIds,
    reproductionV10Absent: true as const,
    reproductionV10ConsumptionMarkerAbsent: true as const,
    terminalDisposition: "calibration_stopped" as const,
    acceptedEvidenceCount: 0 as const,
  }
  const value = Object.freeze({ ...body, protectedHistoryRoot: identityRoot(
    "evidenceBundle", body.schemaVersion, body) })
  if (useCache) v138Plan26247HistoryCache.set(cacheKey, value)
  return value
}

const derivePlan26247LocalSealPrerequisite = (repoRoot: string,
  sourceCommit: string) => {
  const artifactBytes = readCommitFile(repoRoot, sourceCommit,
    V138_PLAN_262_47_CANONICAL_PATHS.localSealVerification)
  const artifact = JSON.parse(artifactBytes.toString("utf8")) as unknown
  const reviewBytes = readCommitFile(repoRoot, sourceCommit,
    V138_PLAN_262_47_CANONICAL_PATHS.localSealReview)
  if (!isRecord(artifact) || artifact.schemaVersion !==
      "v1.38-local-seal-independent-verification-v3" ||
    artifact.satisfiesRevisedSeal01 !== true ||
    artifact.assuranceClass !== "single_operator_local_seal_v1" ||
    artifact.independentCustodyClaimed !== false ||
    artifact.admit03Status !== "blocked" || artifact.findingCount !== 0 ||
    artifact.verificationRoot !==
      "sha256:4385ac8270b649f0876c7846cfc75bdc3682b8526d3ab517736ff27f01ab4b3b") {
    fail("V138_PLAN_262_47_LOCAL_SEAL_PREREQUISITE_INVALID")
  }
  return Object.freeze({ assuranceClass: artifact.assuranceClass,
    independentCustodyClaimed: false as const,
    localSealProtocolRoot: artifact.localSealProtocolRoot as Sha256,
    independentVerificationRoot: artifact.verificationRoot as Sha256,
    artifactSha256: sha256(artifactBytes), reviewSha256: sha256(reviewBytes) })
}

const derivePlan26247SourceReview = (repoRoot: string, sourceCommit: string) => {
  const bytes = readCommitFile(repoRoot, sourceCommit,
    V138_PLAN_262_47_CANONICAL_PATHS.sourceReview)
  const values = frontmatterScalars(bytes, "V138_PLAN_262_47_REVIEW_INVALID")
  const parent = inspectV138SourceIdentityA6(repoRoot, sourceCommit)
    .reviewedSourceParents[0]
  if (values.get("plan") !== "47" || values.get("depth") !== "deep" ||
    values.get("status") !== "clean" || values.get("finding_count") !== "0" ||
    values.get("reviewed_source_commit") !== parent) {
    fail("V138_PLAN_262_47_REVIEW_INVALID")
  }
  return Object.freeze({ path: V138_PLAN_262_47_CANONICAL_PATHS.sourceReview,
    reviewedSourceCommit: parent!, sha256: sha256(bytes) })
}

const derivePlan26247AuthorizationV6 = (repoRoot: string,
  sourceInput: string, literalBytes: Uint8Array) => {
  const source = inspectV138SourceIdentityA6(repoRoot, sourceInput)
  const expectedLiteral = Buffer.from(v138Plan26247AuthorizationLiteral(
    repoRoot, source.reviewedSourceCommit), "utf8")
  if (!expectedLiteral.equals(Buffer.from(literalBytes))) {
    fail("V138_PLAN_262_47_AUTHORIZATION_LITERAL_INVALID")
  }
  const protectedHistory = deriveV138ProtectedHistoryV6(repoRoot,
    source.reviewedSourceCommit)
  const localSeal = derivePlan26247LocalSealPrerequisite(repoRoot,
    source.reviewedSourceCommit)
  const sourceReview = derivePlan26247SourceReview(repoRoot,
    source.reviewedSourceCommit)
  const selectedRouteClosure = plan26247Closure(repoRoot,
    source.reviewedSourceCommit)
  const body = { schemaVersion: V138_PLAN_262_47_AUTHORIZATION_SCHEMA,
    routeOrdinal: 6 as const, operator: V138_PLAN_262_15_OPERATOR,
    ...source, sourceReview, localSeal, preSearchPolicyRoot:
      "sha256:6ad9134977310215ce6e98171d3586c9ae1853313f912ff6e9af95966607e382" as Sha256,
    selectedRouteClosure, selectedRouteClosureRoot: selectedRouteClosure.closureRoot,
    protectedHistory, protectedHistoryRoot:
      protectedHistory.protectedHistoryRoot,
    cumulativeChargedPublicAttemptIds:
      protectedHistory.cumulativeChargedPublicAttemptIds,
    priorAuthorizationBytes: protectedHistory.priorAuthorizationBytes,
    canonicalDestinations: plan26247Destinations(),
    frozenPolicyRoot: frozenPolicyRootV2(), literalSha256: sha256(literalBytes),
    sealCount: 1 as const, contextCount: 1 as const, preflightCount: 1 as const,
    calibrationAllocationCount: 1 as const, calibrationAttemptCount: 8 as const,
    calibrationShardCount: 4 as const, reproductionMaximumCount: 1 as const,
    reproductionCellCount: 540 as const, resourceSampleMilliseconds: 200 as const,
    requiredHostHeadroomBasisPoints: 2500 as const, singleUse: true as const,
    noRetry: true as const, noPriorAuthorityReuse: true as const,
    noExecutionBeforeCheckedB6: true as const,
    candidateSearchAuthorized: false as const,
    formationMaterializationAuthorized: false as const,
    publicAuthorized: false as const, productionAuthorized: false as const,
    expiresAt: "first_seal_refusal_failure_or_plan_262_47_terminal" as const }
  return Object.freeze({ ...body, authorizationRoot: identityRoot(
    "evidenceBundle", body.schemaVersion, body) })
}

export const v138Plan26247AuthorizationLiteral = (repoRoot: string,
  sourceInput: string): string => {
  const source = inspectV138SourceIdentityA6(repoRoot, sourceInput)
  const history = deriveV138ProtectedHistoryV6(repoRoot,
    source.reviewedSourceCommit)
  const localSeal = derivePlan26247LocalSealPrerequisite(repoRoot,
    source.reviewedSourceCommit)
  const sourceReview = derivePlan26247SourceReview(repoRoot,
    source.reviewedSourceCommit)
  const closure = plan26247Closure(repoRoot, source.reviewedSourceCommit)
  return `Authorize Phase 262 Plan 262-47 over independently reviewed source commit ${source.reviewedSourceCommit} (tree ${source.reviewedSourceTree}; parents ${source.reviewedSourceParents.join(",")}; source-review ${sourceReview.sha256}; local-seal ${localSeal.independentVerificationRoot}; local-seal-protocol ${localSeal.localSealProtocolRoot}; assurance ${localSeal.assuranceClass}; independent-custody false; pre-search-policy sha256:6ad9134977310215ce6e98171d3586c9ae1853313f912ff6e9af95966607e382; selected-route ${closure.closureRoot}) as roryquinlan-repository-operator for route ordinal 6: exactly one separately committed direct-child successor-source seal B6, exactly one Pattern C main-orchestrator execution-context:v10, exactly one darwin-memorystatus-effective-available-basis-points-v1 headroom-preflight:v10 at the unchanged inclusive 2,500-basis-point threshold, exactly one calibration:v10 eight-attempt/four-shard allocation, and—only if calibration:v10 is admitted—at most one fresh reproduction:v11 540-cell run. This authority binds canonical destinations ${plan26247Destinations().join(",")}; protected history ${history.protectedHistoryRoot}; cumulative charged identities ${history.cumulativeChargedPublicAttemptIds.join(",")}; and every prior authorization byte ${history.priorAuthorizationBytes.map(({ sha256: root }) => root).join(",")}. Every frozen 200 ms sampling, inclusive 2,500-basis-point gate, eight-attempt/four-shard allocation, conditional 540-cell reproduction, runtime/kernel/historical predicate, lineage, accounting, gameplay, privacy, and formation-absence bound remains unchanged. The local-seal prerequisite grants no matrix authority by itself. This authorization grants no authority to mutate, replace, delete, reinterpret, retry, reuse, or consume any v5/v6/v7/v8/v9 artifact or prior authorization bytes, and grants no candidate, formation, holdout-opening, public, production, or live execution authority before B6 is checked. It is single-use, has no retry, and expires at the first seal refusal or failure or any Plan 262-47 terminal outcome.`
}

export const buildV138Plan26247AuthorizationV6 = (repoRoot: string,
  sourceInput: string, literalBytes: Uint8Array) => {
  for (const repoPath of plan26247Destinations()) {
    regularFile(path.resolve(repoRoot, repoPath), "absent")
  }
  return derivePlan26247AuthorizationV6(repoRoot, sourceInput, literalBytes)
}

export const checkV138Plan26247AuthorizationV6 = (repoRoot: string,
  value: unknown, literalBytes?: Uint8Array) => {
  if (!isRecord(value) || value.schemaVersion !==
      V138_PLAN_262_47_AUTHORIZATION_SCHEMA ||
    typeof value.reviewedSourceCommit !== "string") {
    fail("V138_PLAN_262_47_AUTHORIZATION_SCHEMA_INVALID")
  }
  const bytes = literalBytes ?? Buffer.from(v138Plan26247AuthorizationLiteral(
    repoRoot, value.reviewedSourceCommit), "utf8")
  const expected = derivePlan26247AuthorizationV6(repoRoot,
    value.reviewedSourceCommit, bytes)
  if (canonical(value) !== canonical(expected)) {
    fail("V138_PLAN_262_47_AUTHORIZATION_INVALID")
  }
  for (const record of expected.reviewedSourceBlobs) {
    const committed = readCommitFile(repoRoot, expected.reviewedSourceCommit,
      record.path)
    const working = regularFile(path.resolve(repoRoot, record.path),
      "required")!
    if (sha256(committed) !== record.sha256 ||
      gitText(repoRoot, ["rev-parse", `${expected.reviewedSourceCommit}:${record.path}`]) !==
        record.blobOid || !working.equals(committed)) {
      fail("V138_PLAN_262_47_REVIEWED_SOURCE_BLOB_INVALID")
    }
  }
  return expected
}

export const buildV138SuccessorSourceSealV6 = (repoRoot: string,
  authorizationValue: unknown) => {
  const authorization = checkV138Plan26247AuthorizationV6(repoRoot,
    authorizationValue)
  const body = { schemaVersion: V138_SUCCESSOR_SOURCE_SEAL_V6_SCHEMA,
    sealOrdinal: 6 as const, canonicalizationId: "canonical-json-v1.1" as const,
    sealedSourceCommit: authorization.reviewedSourceCommit,
    sealedSourceTree: authorization.reviewedSourceTree,
    sealedSourceParent: authorization.reviewedSourceParents[0]!,
    reviewedSourceBlobs: authorization.reviewedSourceBlobs,
    localSeal: authorization.localSeal,
    selectedRouteClosure: authorization.selectedRouteClosure,
    protectedHistory: authorization.protectedHistory,
    frozenPolicyRoot: authorization.frozenPolicyRoot,
    canonicalDestinations: authorization.canonicalDestinations,
    authorizationRoot: authorization.authorizationRoot }
  return Object.freeze({ ...body, sealRoot: identityRoot(
    "containmentPolicy", body.schemaVersion, body) })
}

export const checkV138SuccessorSourceSealV6 = (repoRoot: string,
  value: unknown, authorizationValue: unknown) => {
  if (!isRecord(value) || value.schemaVersion !==
      V138_SUCCESSOR_SOURCE_SEAL_V6_SCHEMA) {
    fail("V138_SUCCESSOR_SEAL_V6_SCHEMA_INVALID")
  }
  const expected = buildV138SuccessorSourceSealV6(repoRoot,
    authorizationValue)
  if (canonical(value) !== canonical(expected)) {
    fail("V138_SUCCESSOR_SEAL_V6_INVALID")
  }
  return expected
}

export const writeV138Plan26247AuthorizationV6 = (repoRoot: string,
  targetPath: string, sourceInput: string, literalBytes: Uint8Array) => {
  const target = canonicalPath(repoRoot, targetPath,
    V138_PLAN_262_47_CANONICAL_PATHS.authorization)
  const value = buildV138Plan26247AuthorizationV6(repoRoot, sourceInput,
    literalBytes)
  writeV138CanonicalExclusiveV2(repoRoot, target, value)
  return value
}

export const writeV138SuccessorSourceSealV6 = (repoRoot: string,
  targetPath: string, authorizationValue: unknown) => {
  const target = canonicalPath(repoRoot, targetPath,
    V138_PLAN_262_47_CANONICAL_PATHS.seal)
  regularFile(target, "absent")
  const value = buildV138SuccessorSourceSealV6(repoRoot, authorizationValue)
  writeV138CanonicalExclusiveV2(repoRoot, target, value)
  return value
}

const deriveV138SourceB6 = (repoRoot: string, sourceA6: string) => {
  const candidates = gitText(repoRoot, ["log", "--all", "--format=%H", "--",
    V138_PLAN_262_47_CANONICAL_PATHS.authorization]).split("\n")
    .filter(Boolean).filter((candidate) => {
      const parents = gitText(repoRoot, ["show", "-s", "--format=%P",
        candidate]).split(" ").filter(Boolean)
      if (parents.length !== 1 || parents[0] !== sourceA6) return false
      const changed = sorted(gitText(repoRoot, ["diff-tree", "--no-commit-id",
        "--name-only", "-r", "--no-renames", candidate]).split("\n")
        .filter(Boolean).map(normalize))
      return canonical(changed) === canonical(sorted([
        V138_PLAN_262_47_CANONICAL_PATHS.authorization,
        V138_PLAN_262_47_CANONICAL_PATHS.seal]))
    })
  if (candidates.length !== 1) fail("V138_SUCCESSOR_SEAL_B6_AMBIGUOUS")
  return fullCommit(repoRoot, candidates[0]!)
}

export const checkV138SuccessorSealCommitV6 = (repoRoot: string,
  authorizationValue: unknown, sealValue: unknown,
  allowLiveArtifacts = false) => {
  const authorization = checkV138Plan26247AuthorizationV6(repoRoot,
    authorizationValue)
  const seal = checkV138SuccessorSourceSealV6(repoRoot, sealValue,
    authorization)
  const sourceA6 = authorization.reviewedSourceCommit
  const sourceB6 = deriveV138SourceB6(repoRoot, sourceA6)
  const changedPaths = sorted(gitText(repoRoot, ["diff-tree", "--no-commit-id",
    "--name-only", "-r", "--no-renames", sourceB6]).split("\n")
    .filter(Boolean).map(normalize))
  for (const repoPath of changedPaths) {
    requireAbsentAtCommit(repoRoot, sourceA6, repoPath,
      "V138_SUCCESSOR_SEAL_V6_EXISTED_AT_A6")
    const committed = readCommitFile(repoRoot, sourceB6, repoPath)
    const working = readV138RepositoryFileNoFollow(repoRoot,
      path.resolve(repoRoot, repoPath), "required")!
    if (!committed.equals(working)) {
      fail("V138_SUCCESSOR_SEAL_B6_WORKTREE_DRIFT")
    }
  }
  const committedAuthorization = JSON.parse(readCommitFile(repoRoot, sourceB6,
    V138_PLAN_262_47_CANONICAL_PATHS.authorization).toString("utf8"))
  const committedSeal = JSON.parse(readCommitFile(repoRoot, sourceB6,
    V138_PLAN_262_47_CANONICAL_PATHS.seal).toString("utf8"))
  if (canonical(committedAuthorization) !== canonical(authorization) ||
    canonical(committedSeal) !== canonical(seal)) {
    fail("V138_SUCCESSOR_SEAL_B6_COMMITTED_BYTES_INVALID")
  }
  if (!allowLiveArtifacts) {
    for (const repoPath of V138_PLAN_262_47_FRESH_DESTINATIONS) {
      readV138RepositoryFileNoFollow(repoRoot,
        path.resolve(repoRoot, repoPath), "absent")
    }
  }
  const body = { schemaVersion: "v1.38-source-b6-custody-v1" as const,
    sourceA6, sourceB6, sourceB6Tree: gitText(repoRoot,
      ["rev-parse", `${sourceB6}^{tree}`]), sourceB6Parent: sourceA6,
    changedPaths: Object.freeze(changedPaths),
    authorizationRoot: authorization.authorizationRoot,
    sealRoot: seal.sealRoot }
  return Object.freeze({ ...body, custodyRoot: identityRoot(
    "containmentPolicy", body.schemaVersion, body) })
}

const plan26247CommittedV6 = (repoRoot: string) => {
  const sourceA6 = inspectV138SourceIdentityA6(repoRoot,
    V138_PLAN_262_47_SOURCE_A6)
  const [sourceB6Commit, sourceB6Tree, sourceB6Parent] = gitText(repoRoot,
    ["show", "-s", "--format=%H%n%T%n%P", V138_PLAN_262_47_SOURCE_B6])
    .split("\n")
  const sourceB6ChangedPaths = Object.freeze(sorted(gitText(repoRoot,
    ["diff-tree", "--no-commit-id", "--name-only", "-r", "--no-renames",
      V138_PLAN_262_47_SOURCE_B6]).split("\n").filter(Boolean).map(normalize)))
  const expectedChangedPaths = sorted([
    V138_PLAN_262_47_CANONICAL_PATHS.authorization,
    V138_PLAN_262_47_CANONICAL_PATHS.seal,
  ])
  if (sourceB6Commit !== V138_PLAN_262_47_SOURCE_B6 ||
    !/^[0-9a-f]{40}$/u.test(sourceB6Tree ?? "") ||
    sourceB6Parent !== V138_PLAN_262_47_SOURCE_A6 ||
    canonical(sourceB6ChangedPaths) !== canonical(expectedChangedPaths)) {
    fail("V138_PLAN_262_47_PRE_EXECUTION_SOURCE_CUSTODY_INVALID")
  }
  const sourceB6Blobs = Object.freeze(expectedChangedPaths.map((repoPath) =>
    blobRecord(repoRoot, V138_PLAN_262_47_SOURCE_B6, repoPath)))
  const authorizationBytes = readCommitFile(repoRoot,
    V138_PLAN_262_47_SOURCE_B6,
    V138_PLAN_262_47_CANONICAL_PATHS.authorization)
  const sealBytes = readCommitFile(repoRoot, V138_PLAN_262_47_SOURCE_B6,
    V138_PLAN_262_47_CANONICAL_PATHS.seal)
  const workingAuthorization = readV138RepositoryFileNoFollow(repoRoot,
    path.resolve(repoRoot, V138_PLAN_262_47_CANONICAL_PATHS.authorization),
    "required")!
  const workingSeal = readV138RepositoryFileNoFollow(repoRoot,
    path.resolve(repoRoot, V138_PLAN_262_47_CANONICAL_PATHS.seal),
    "required")!
  if (!authorizationBytes.equals(workingAuthorization) ||
    !sealBytes.equals(workingSeal)) {
    fail("V138_PLAN_262_47_PRE_EXECUTION_SEALED_BYTES_INVALID")
  }
  let authorization: unknown
  let seal: unknown
  try {
    authorization = JSON.parse(authorizationBytes.toString("utf8"))
    seal = JSON.parse(sealBytes.toString("utf8"))
  } catch {
    fail("V138_PLAN_262_47_PRE_EXECUTION_SEALED_BYTES_INVALID")
  }
  if (!isRecord(authorization) || !isRecord(seal) ||
    authorization.schemaVersion !== V138_PLAN_262_47_AUTHORIZATION_SCHEMA ||
    seal.schemaVersion !== V138_SUCCESSOR_SOURCE_SEAL_V6_SCHEMA ||
    authorization.reviewedSourceCommit !== V138_PLAN_262_47_SOURCE_A6 ||
    seal.sealedSourceCommit !== V138_PLAN_262_47_SOURCE_A6 ||
    seal.sealedSourceParent !== sourceA6.reviewedSourceParents[0] ||
    authorization.authorizationRoot !== seal.authorizationRoot ||
    typeof authorization.authorizationRoot !== "string" ||
    typeof seal.sealRoot !== "string") {
    fail("V138_PLAN_262_47_PRE_EXECUTION_SEALED_BYTES_INVALID")
  }
  const { authorizationRoot, ...authorizationBody } = authorization
  const { sealRoot, ...sealBody } = seal
  if (authorizationRoot !== identityRoot("evidenceBundle",
    V138_PLAN_262_47_AUTHORIZATION_SCHEMA, authorizationBody) ||
    sealRoot !== identityRoot("containmentPolicy",
      V138_SUCCESSOR_SOURCE_SEAL_V6_SCHEMA, sealBody)) {
    fail("V138_PLAN_262_47_PRE_EXECUTION_SEALED_ROOT_INVALID")
  }
  return Object.freeze({ sourceA6, sourceB6Commit, sourceB6Tree:
    sourceB6Tree!, sourceB6Parent: sourceB6Parent!, sourceB6ChangedPaths,
  sourceB6Blobs, authorizationBytes, sealBytes, authorization, seal })
}

const buildV138Plan26247PreExecutionSourceFailure = (repoRoot: string) => {
  for (const repoPath of V138_PLAN_262_47_FRESH_DESTINATIONS) {
    readV138RepositoryFileNoFollow(repoRoot,
      path.resolve(repoRoot, repoPath), "absent")
  }
  const committed = plan26247CommittedV6(repoRoot)
  const authorization = committed.authorization
  const seal = committed.seal
  if (!isRecord(authorization) || !isRecord(seal) ||
    !isRecord(authorization.localSeal) ||
    !isRecord(authorization.protectedHistory) ||
    !isRecord(authorization.selectedRouteClosure) ||
    !Array.isArray(authorization.cumulativeChargedPublicAttemptIds) ||
    authorization.cumulativeChargedPublicAttemptIds.length !== 40 ||
    new Set(authorization.cumulativeChargedPublicAttemptIds).size !== 40 ||
    authorization.cumulativeChargedPublicAttemptIds.some(
      (value) => typeof value !== "string")) {
    fail("V138_PLAN_262_47_PRE_EXECUTION_HISTORY_INVALID")
  }
  const predecessorSealBytes = readCommitFile(repoRoot,
    V138_PLAN_262_47_SOURCE_A6, V138_PLAN_262_29_CANONICAL_PATHS.seal)
  const predecessorSeal = JSON.parse(predecessorSealBytes.toString("utf8")) as unknown
  if (!isRecord(predecessorSeal) || !isRecord(predecessorSeal.formationAbsence) ||
    !isRecord(predecessorSeal.replacementMetricContract) ||
    typeof predecessorSeal.sealRoot !== "string" ||
    typeof predecessorSeal.formationAbsence.scannedRoot !== "string" ||
    typeof predecessorSeal.replacementMetricContract.contractRoot !== "string") {
    fail("V138_PLAN_262_47_PRE_EXECUTION_PREDECESSOR_INVALID")
  }
  const sourceReviewBytes = readCommitFile(repoRoot,
    V138_PLAN_262_47_SOURCE_A6,
    V138_PLAN_262_47_CANONICAL_PATHS.sourceReview)
  const review = derivePlan26247SourceReview(repoRoot,
    V138_PLAN_262_47_SOURCE_A6)
  const sourceCustody = Object.freeze({
    sourceA6Tree: committed.sourceA6.reviewedSourceTree,
    sourceA6Parents: committed.sourceA6.reviewedSourceParents,
    sourceA6Blobs: committed.sourceA6.reviewedSourceBlobs,
    sourceB6Tree: committed.sourceB6Tree,
    sourceB6Parent: committed.sourceB6Parent,
    sourceB6ChangedPaths: committed.sourceB6ChangedPaths,
    sourceB6Blobs: committed.sourceB6Blobs,
  })
  const sourceReview = Object.freeze({ path: review.path,
    sha256: sha256(sourceReviewBytes), historicalVerdict: "PASS_zero_findings" as const,
    historicalBytesPreserved: true as const,
    establishesCliSourceCompleteness: false as const })
  const protectedRoots = Object.freeze({
    selectedRouteClosureRoot: authorization.selectedRouteClosureRoot as Sha256,
    gameplayRuntimePrivacyClosureRoot:
      authorization.selectedRouteClosureRoot as Sha256,
    protectedHistoryRoot: authorization.protectedHistoryRoot as Sha256,
    frozenPolicyRoot: authorization.frozenPolicyRoot as Sha256,
    preSearchPolicyRoot: authorization.preSearchPolicyRoot as Sha256,
    localSealProtocolRoot: authorization.localSeal.localSealProtocolRoot as Sha256,
    localSealIndependentVerificationRoot:
      authorization.localSeal.independentVerificationRoot as Sha256,
    predecessorSealV5Root: predecessorSeal.sealRoot as Sha256,
    predecessorSealV5BytesSha256: sha256(predecessorSealBytes),
    formationAbsenceRoot: predecessorSeal.formationAbsence.scannedRoot as Sha256,
    replacementMetricContractRoot:
      predecessorSeal.replacementMetricContract.contractRoot as Sha256,
  })
  const body = {
    schemaVersion: V138_PLAN_262_47_PRE_EXECUTION_SOURCE_FAILURE_SCHEMA,
    reason: "sealed_source_incomplete" as const,
    sourceA6: V138_PLAN_262_47_SOURCE_A6,
    sourceB6: V138_PLAN_262_47_SOURCE_B6,
    sourceCustody,
    authorizationRoot: authorization.authorizationRoot as Sha256,
    sealRoot: seal.sealRoot as Sha256,
    authorizationBytesSha256: sha256(committed.authorizationBytes),
    sealBytesSha256: sha256(committed.sealBytes),
    sourceReview,
    protectedRoots,
    historicalChargedPublicAttemptIds: Object.freeze([
      ...authorization.cumulativeChargedPublicAttemptIds as string[],
    ]),
    historicalChargedAttemptCount: 40 as const,
    freshAttemptLedgerRoot: identityRoot("evidenceBundle",
      "v1.38-plan-262-47-fresh-attempt-ledger-v1", { attempts: [] }),
    freshAcceptedCellLedgerRoot: identityRoot("evidenceBundle",
      "v1.38-plan-262-47-fresh-accepted-cell-ledger-v1", { cells: [] }),
    absentDestinations: V138_PLAN_262_47_FRESH_DESTINATIONS,
    routeStarted: false as const,
    isRouteTerminal: false as const,
    chargedAttemptCount: 0 as const,
    acceptedCellCount: 0 as const,
    requiredAcceptedCellCount: 540 as const,
    authorityExpired: true as const,
    noRetry: true as const,
    satisfiesAdmit03: false as const,
    seal01Status: "passed_reduced_assurance" as const,
    assuranceClass: "single_operator_local_seal_v1" as const,
    independentCustodyClaimed: false as const,
    candidateSearchAuthorized: false as const,
    phase263Authorized: false as const,
    formationMaterializationAuthorized: false as const,
    holdoutOpeningAuthorized: false as const,
    publicAuthorized: false as const,
    activationAuthorized: false as const,
    productionAuthorized: false as const,
  }
  return Object.freeze({ ...body, dispositionRoot: identityRoot(
    "evidenceBundle", body.schemaVersion, body) })
}

export const buildV138Plan26247PreExecutionSourceFailureV1 =
  (repoRoot: string) => buildV138Plan26247PreExecutionSourceFailure(repoRoot)

export const checkV138Plan26247PreExecutionSourceFailureV1 =
  (repoRoot: string, value: unknown) => {
    const expected = buildV138Plan26247PreExecutionSourceFailure(repoRoot)
    if (canonical(value) !== canonical(expected)) {
      fail("V138_PLAN_262_47_PRE_EXECUTION_SOURCE_FAILURE_INVALID")
    }
    return expected
  }

export const writeV138Plan26247PreExecutionSourceFailureV1 =
  (repoRoot: string, targetPath: string) => {
    const target = canonicalPath(repoRoot, targetPath,
      V138_PLAN_262_47_PRE_EXECUTION_SOURCE_FAILURE_PATH)
    regularFile(target, "absent")
    const value = buildV138Plan26247PreExecutionSourceFailure(repoRoot)
    writeV138CanonicalExclusiveV2(repoRoot, target, value)
    return value
  }

// Route 7 is source-only until Plan 262-56 supplies a reviewed A7 and creates
// the two authorization artifacts.  These contracts deliberately contain no
// ambient "latest" lookup and no live operation.
export const V138_PLAN_262_56_AUTHORIZATION_SCHEMA =
  "v1.38-plan-262-56-authorization-v7" as const
export const V138_SUCCESSOR_SOURCE_SEAL_V7_SCHEMA =
  "v1.38-successor-source-seal-v7" as const
export const V138_PLAN_262_56_AUTHORIZATION_V9_SCHEMA =
  "v1.38-plan-262-56-authorization-v9" as const
export const V138_SUCCESSOR_SOURCE_SEAL_V9_SCHEMA =
  "v1.38-successor-source-seal-v9" as const
export const V138_PLAN_262_56_V9_CANONICAL_PATHS = Object.freeze({
  authorization:
    ".planning/artifacts/v1.38-plan-262-56-authorization-v9.json",
  seal: ".planning/artifacts/v1.38-successor-source-seal-v9.json",
  sourceCompletenessReview:
    ".planning/artifacts/v1.38-plan-262-62-source-completeness-review-v3.json",
} as const)
export const V138_PLAN_262_56_OBSOLETE_V7_V8_PATHS = Object.freeze([
  ".planning/artifacts/v1.38-plan-262-56-authorization-v7.json",
  ".planning/artifacts/v1.38-successor-source-seal-v7.json",
  ".planning/artifacts/v1.38-plan-262-56-authorization-v8.json",
  ".planning/artifacts/v1.38-successor-source-seal-v8.json",
] as const)
export const V138_PLAN_262_57_ROUTE_CONTRACT_V9 = Object.freeze({
  schemaVersion: "v1.38-plan-262-57-route-contract-v2" as const,
  routeOrdinal: 7 as const,
  authorizationSchema: V138_PLAN_262_56_AUTHORIZATION_V9_SCHEMA,
  sealSchema: V138_SUCCESSOR_SOURCE_SEAL_V9_SCHEMA,
  sourceCustody: Object.freeze({ sourceBase: "sourceBase9" as const,
    sourceAuthor: "sourceA9" as const, sourceSeal: "sourceB9" as const }),
  executionContextSchema: "v1.38-current-matrix-execution-context-v11" as const,
  preflightSchema: "v1.38-current-matrix-headroom-preflight-v11" as const,
  calibrationSchema: "v1.38-current-matrix-calibration-v11" as const,
  reproductionSchema: "v1.38-current-matrix-reproduction-v12" as const,
  resourceSampleMilliseconds: 200 as const,
  requiredHostHeadroomBasisPoints: 2500 as const,
  calibrationAttemptCount: 8 as const,
  calibrationShardCount: 4 as const,
  reproductionCellCount: 540 as const,
  noRetry: true as const,
} as const)

const V138_PLAN_262_56_V9_AUTHORIZATION_KEYS = Object.freeze([
  "schemaVersion", "routeOrdinal", "executionVersions", "sourceBase9",
  "sourceA9", "sourceA9Paths", "sourceA9Tree", "sourceA9Parent",
  "sourceA9Blobs", "sourceDeletionHistory", "protectedA7", "protectedHistory",
  "reviewV3Input", "toolIdentity", "identityClaims",
  "canonicalDestinations", "futureCustodyPaths", "obsoleteV7PathsAbsent",
  "singleUse", "noRetry", "satisfiesAdmit03", "downstreamAuthority",
  "authorizationRoot",
] as const)

const V138_PLAN_262_56_V9_REVIEW_INPUT_KEYS = Object.freeze([
  "absolutePath", "outsideRepository", "readOnly", "ownerMatchesEffectiveUid",
  "regularFile", "symlinkFree", "linkCount", "inputCommit", "inputBlob",
  "byteLength", "bytesSha256", "reviewV3Root", "preBytesSha256",
  "postBytesSha256", "preNoFollowIdentity", "postNoFollowIdentity",
  "reviewV3Document",
] as const)

/** Side-effect-free exact review-v3 document validation used by authorization-v9. */
export const validateV138ReviewV3DocumentForAuthorization = (value: unknown) =>
  validateV138ReviewV3Document(value)

export interface V138Plan26256ReviewV3Input {
  readonly absolutePath: string
  readonly outsideRepository: true
  readonly readOnly: true
  readonly ownerMatchesEffectiveUid: true
  readonly regularFile: true
  readonly symlinkFree: true
  readonly linkCount: 1
  readonly inputCommit: string
  readonly inputBlob: string
  readonly byteLength: number
  readonly bytesSha256: Sha256
  readonly reviewV3Root: Sha256
  readonly preBytesSha256: Sha256
  readonly postBytesSha256: Sha256
  readonly preNoFollowIdentity: string
  readonly postNoFollowIdentity: string
  readonly reviewV3Document: Readonly<Record<string, unknown>>
}

const checkV138Plan26256ReviewV3Input = (repoRoot: string,
  value: unknown): Readonly<V138Plan26256ReviewV3Input> => {
  if (!isRecord(value) || !exactKeys(value,
    V138_PLAN_262_56_V9_REVIEW_INPUT_KEYS)) {
    fail("V138_PLAN_262_56_REVIEW_V3_INPUT_METADATA_INVALID")
  }
  const candidate = value as Record<string, unknown>
  const physicalRoot = realpathSync(repoRoot)
  const absolutePath = path.resolve(String(candidate.absolutePath))
  if (!path.isAbsolute(String(candidate.absolutePath)) || absolutePath === physicalRoot ||
    absolutePath.startsWith(`${physicalRoot}${path.sep}`) ||
    path.basename(absolutePath) !== path.basename(
      V138_PLAN_262_56_V9_CANONICAL_PATHS.sourceCompletenessReview)) {
    fail("V138_PLAN_262_56_REVIEW_V3_INPUT_DOCUMENT_INVALID")
  }
  const document = validateV138ReviewV3DocumentForAuthorization(
    candidate.reviewV3Document) as Record<string, unknown>
  if (candidate.outsideRepository !== true || candidate.readOnly !== true ||
    candidate.ownerMatchesEffectiveUid !== true || candidate.regularFile !== true ||
    candidate.symlinkFree !== true || candidate.linkCount !== 1 ||
    !/^[0-9a-f]{40}$/u.test(String(candidate.inputCommit)) ||
    !/^[0-9a-f]{40}$/u.test(String(candidate.inputBlob)) ||
    typeof candidate.byteLength !== "number" || candidate.byteLength < 2 ||
    candidate.byteLength > 16 * 1024 * 1024 || !isSha256(candidate.bytesSha256) ||
    candidate.bytesSha256 !== candidate.preBytesSha256 ||
    candidate.bytesSha256 !== candidate.postBytesSha256 ||
    candidate.reviewV3Root !== document.reviewV3Root ||
    typeof candidate.preNoFollowIdentity !== "string" ||
    candidate.preNoFollowIdentity !== candidate.postNoFollowIdentity) {
    fail("V138_PLAN_262_56_REVIEW_V3_INPUT_METADATA_INVALID")
  }
  return Object.freeze(candidate as unknown as V138Plan26256ReviewV3Input)
}

export const V138_PLAN_262_60_V3_SOURCE_PATHS = Object.freeze([
  "scripts/lib/v1-38-source-completeness-review-v3.ts",
  "scripts/lib/v1-38-successor-source-seal.ts",
  "scripts/lib/v1-38-current-matrix-reproduction.ts",
  "scripts/evaluate-v1-38-successor-route.test.ts",
  "scripts/evaluate-v1-38-successor-source-complete.test.ts",
  "scripts/check-v1-38-dependency-revision-boundaries.ts",
] as const)
export const V138_PLAN_262_60_V4_SOURCE_PATHS = Object.freeze([
  "scripts/check-v1-38-dependency-revision-boundaries.ts",
  "scripts/lib/v1-38-source-completeness-review-v3.ts",
  "scripts/lib/v1-38-successor-source-seal.ts",
  "scripts/evaluate-v1-38-successor-route.test.ts",
] as const)
export const V138_PLAN_262_60_SOURCE_PATHS = Object.freeze([
  "scripts/check-v1-38-dependency-revision-boundaries.ts",
  "scripts/lib/v1-38-source-completeness-review-v3.ts",
  "scripts/lib/v1-38-successor-source-seal.ts",
  "scripts/evaluate-v1-38-successor-route.test.ts",
] as const)
const V138_PLAN_262_60_GAP_PATHS = Object.freeze([
  ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-60-REVIEW-FIX.md",
  ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-60-SUMMARY.md",
] as const)
export const V138_PLAN_262_60_DELETION_PATHS = Object.freeze([
  "scripts/check-v1-38-plan-262-58-source-completeness-review-v2.test.ts",
  "scripts/check-v1-38-plan-262-58-source-completeness-review-v2.ts",
] as const)
export const V138_PLAN_262_60_REVIEW_FIX_CHANGED_PATHS =
  V138_PLAN_262_60_SOURCE_PATHS
const V138_PLAN_262_60_DELETION_COMMIT =
  "8c3cab21d7da0d59101480e17a973e0317646622" as const

export const inspectV138SourceA9Custody = (repoRoot: string,
  document: Record<string, any>) => {
  const sourceBase9 = fullCommit(repoRoot, String(document.sourceBase9))
  const sourceA9 = fullCommit(repoRoot, String(document.sourceA9))
  const commits = gitText(repoRoot, ["rev-list", "--first-parent", "--reverse",
    `${sourceBase9}..${sourceA9}`]).split("\n").filter(Boolean)
  const aggregate = new Set<string>()
  let expectedParent = sourceBase9
  for (const commit of commits) {
    const parents = gitText(repoRoot, ["show", "-s", "--format=%P", commit])
      .split(" ").filter(Boolean)
    const changed = sorted(gitText(repoRoot, ["diff-tree", "--no-commit-id",
      "--name-only", "-r", "--no-renames", commit]).split("\n").filter(Boolean))
    const trailer = gitText(repoRoot, ["log", "-1",
      "--format=%(trailers:key=Plan-262-60-Author-Run,valueonly)", commit])
    if (parents.length !== 1 || parents[0] !== expectedParent || changed.length === 0 ||
      changed.some(repoPath => !V138_PLAN_262_60_SOURCE_PATHS.includes(repoPath as never)) ||
      trailer !== V138_PLAN_262_60_CORRECTION_RUN) {
      fail("V138_PLAN_262_56_AUTHORIZATION_V9_CUSTODY_INVALID")
    }
    changed.forEach(repoPath => aggregate.add(repoPath))
    expectedParent = commit
  }
  if (commits.length === 0 || commits.at(-1) !== sourceA9 ||
    canonical(sorted(aggregate)) !== canonical(sorted(
      V138_PLAN_262_60_SOURCE_PATHS))) {
    fail("V138_PLAN_262_56_AUTHORIZATION_V9_CUSTODY_INVALID")
  }
  const inspectPriorLayer = (authorRun: string, paths: readonly string[]) => {
    const layerCommits = gitText(repoRoot, ["log", "--first-parent", "--reverse",
      "--format=%H", sourceBase9,
      `--grep=Plan-262-60-Author-Run: ${authorRun}`])
      .split("\n").filter(Boolean)
    const layerBase = layerCommits.length === 0 ? undefined : gitText(repoRoot,
      ["show", "-s", "--format=%P", layerCommits[0]!])
    const layerTip = layerCommits.at(-1)
    const layerAggregate = new Set<string>()
    let layerParent = layerBase
    for (const commit of layerCommits) {
      const parents = gitText(repoRoot, ["show", "-s", "--format=%P", commit])
        .split(" ").filter(Boolean)
      const changed = sorted(gitText(repoRoot, ["diff-tree", "--no-commit-id",
        "--name-only", "-r", "--no-renames", commit]).split("\n").filter(Boolean))
      const trailer = gitText(repoRoot, ["log", "-1",
        "--format=%(trailers:key=Plan-262-60-Author-Run,valueonly)", commit])
      if (parents.length !== 1 || parents[0] !== layerParent ||
        changed.length === 0 || changed.some(repoPath => !paths.includes(repoPath)) ||
        trailer !== authorRun) {
        fail("V138_PLAN_262_56_AUTHORIZATION_V9_PRIOR_CUSTODY_INVALID")
      }
      changed.forEach(repoPath => layerAggregate.add(repoPath))
      layerParent = commit
    }
    if (layerBase === undefined || layerTip === undefined ||
      canonical(sorted(layerAggregate)) !== canonical(sorted(paths))) {
      fail("V138_PLAN_262_56_AUTHORIZATION_V9_PRIOR_CUSTODY_INVALID")
    }
    return Object.freeze({ authorRun, sourceBase9: layerBase, sourceA9: layerTip,
      paths: Object.freeze([...paths]), commits: Object.freeze(layerCommits) })
  }
  const priorCorrectionLayers = Object.freeze([
    inspectPriorLayer("codex-plan-262-60-a9-review-fix-v3",
      V138_PLAN_262_60_V3_SOURCE_PATHS),
    inspectPriorLayer("codex-plan-262-60-a9-review-fix-v4",
      V138_PLAN_262_60_V4_SOURCE_PATHS),
  ])
  const protectedLayerPaths = sorted(priorCorrectionLayers.flatMap(layer =>
    [...layer.paths]).concat([...V138_PLAN_262_60_SOURCE_PATHS]))
  const inspectGap = (priorTip: string, nextBase: string) => {
    const gapCommits = gitText(repoRoot, ["rev-list", "--first-parent", "--reverse",
      `${priorTip}..${nextBase}`]).split("\n").filter(Boolean)
    const gapAggregate = new Set<string>()
    let gapParent = priorTip
    for (const commit of gapCommits) {
      const parents = gitText(repoRoot, ["show", "-s", "--format=%P", commit])
        .split(" ").filter(Boolean)
      const changed = sorted(gitText(repoRoot, ["diff-tree", "--no-commit-id",
        "--name-only", "-r", "--no-renames", commit]).split("\n").filter(Boolean))
      if (parents.length !== 1 || parents[0] !== gapParent || changed.length === 0 ||
        changed.some(repoPath => !V138_PLAN_262_60_GAP_PATHS.includes(
          repoPath as never))) {
        fail("V138_PLAN_262_56_AUTHORIZATION_V9_LAYER_GAP_INVALID")
      }
      changed.forEach(repoPath => gapAggregate.add(repoPath))
      gapParent = commit
    }
    if (gapParent !== nextBase || gapCommits.length > 0 &&
      canonical(sorted(gapAggregate)) !== canonical(sorted(
        V138_PLAN_262_60_GAP_PATHS))) {
      fail("V138_PLAN_262_56_AUTHORIZATION_V9_LAYER_GAP_INVALID")
    }
    for (const repoPath of protectedLayerPaths) {
      if (gitText(repoRoot, ["ls-tree", priorTip, "--", repoPath]) !==
        gitText(repoRoot, ["ls-tree", nextBase, "--", repoPath])) {
        fail("V138_PLAN_262_56_AUTHORIZATION_V9_LAYER_GAP_INVALID")
      }
    }
    return Object.freeze({ priorTip, nextBase, commits: Object.freeze(gapCommits),
      paths: Object.freeze(sorted(gapAggregate)), protectedPathCount:
        protectedLayerPaths.length })
  }
  const layerGaps = Object.freeze([
    inspectGap(priorCorrectionLayers[0]!.sourceA9,
      priorCorrectionLayers[1]!.sourceBase9),
    inspectGap(priorCorrectionLayers[1]!.sourceA9, sourceBase9),
  ])
  const sourceA9Blobs = Object.freeze(V138_PLAN_262_60_SOURCE_PATHS.map(repoPath => {
    const entry = gitText(repoRoot, ["ls-tree", sourceA9, "--", repoPath])
    if (entry === "") return Object.freeze({ path: repoPath, mode: "deleted" as const,
      blobOid: null, sha256: null, byteLength: 0 })
    const bytes = readCommitFile(repoRoot, sourceA9, repoPath)
    return Object.freeze({ path: repoPath, mode: entry.split(/\s+/u)[0],
      blobOid: gitText(repoRoot, ["rev-parse", `${sourceA9}:${repoPath}`]),
      sha256: sha256(bytes), byteLength: bytes.byteLength })
  }))
  const deletionCommit = fullCommit(repoRoot, V138_PLAN_262_60_DELETION_COMMIT)
  const deletionParents = gitText(repoRoot, ["show", "-s", "--format=%P",
    deletionCommit]).split(" ").filter(Boolean)
  const deletionTree = gitText(repoRoot, ["rev-parse", `${deletionCommit}^{tree}`])
  const deletionTrailer = gitText(repoRoot, ["log", "-1",
    "--format=%(trailers:key=Plan-262-60-Author-Run,valueonly)", deletionCommit])
  const deletionFirstParentCount = gitText(repoRoot, ["rev-list", "--first-parent",
    sourceA9]).split("\n").filter(commit => commit === deletionCommit).length
  if (deletionParents.length !== 1 || deletionTrailer !==
      "codex-plan-262-60-a9-v1" ||
    gitStatus(repoRoot, ["merge-base", "--is-ancestor", deletionCommit,
      sourceBase9]) !== 0 ||
    gitStatus(repoRoot, ["merge-base", "--is-ancestor", deletionCommit,
      sourceA9]) !== 0 || deletionFirstParentCount !== 1) {
    fail("V138_PLAN_262_56_AUTHORIZATION_V9_DELETION_HISTORY_INVALID")
  }
  const deletionHistory = Object.freeze(V138_PLAN_262_60_DELETION_PATHS.map(
    repoPath => {
      const status = gitText(repoRoot, ["diff-tree", "--no-commit-id",
        "--name-status", "-r", "--no-renames", deletionCommit, "--", repoPath])
      if (status !== `D\t${repoPath}` || gitText(repoRoot,
        ["ls-tree", sourceBase9, "--", repoPath]) !== "" || gitText(repoRoot,
        ["ls-tree", sourceA9, "--", repoPath]) !== "") {
        fail("V138_PLAN_262_56_AUTHORIZATION_V9_DELETION_HISTORY_INVALID")
      }
      const priorBytes = readCommitFile(repoRoot, deletionParents[0]!, repoPath)
      return Object.freeze({ path: repoPath, deletionCommit,
        deletionParent: deletionParents[0]!, deletionTree,
        authorRun: "codex-plan-262-60-a9-v1" as const,
        priorBlobOid: gitText(repoRoot, ["rev-parse",
          `${deletionParents[0]}:${repoPath}`]), priorSha256: sha256(priorBytes),
        priorByteLength: priorBytes.byteLength })
    }))
  return Object.freeze({ sourceBase9, sourceA9,
    priorCorrectionLayer: priorCorrectionLayers[0]!, priorCorrectionLayers,
    layerGaps,
    sourceA9Tree: gitText(repoRoot, ["rev-parse", `${sourceA9}^{tree}`]),
    sourceA9Parent: expectedParent === sourceA9 && commits.length > 1 ?
      commits.at(-2)! : sourceBase9,
    sourceA9Paths: V138_PLAN_262_60_SOURCE_PATHS,
    sourceA9Blobs, deletionHistory })
}

const V138_PLAN_262_47_FAILURE_FROZEN = Object.freeze({
  path: ".planning/artifacts/v1.38-plan-262-47-pre-execution-source-failure-v1.json",
  commit: "bc0f95141d475d1d56ecf9d8ce67880f29385ea1",
  blobOid: "f5efc47d0e65cebee250431cded02c3fa41906c0",
  sha256: "sha256:dffa9bf3915895506958aef5bb45d350f70eb7a3c190078e217384c16f3e4a8a",
  byteLength: 5792,
  protectedRoots: Object.freeze({
    formationAbsenceRoot: "sha256:b0ab7d57681b89313fc7bc2406adf1f2aad70e1a7aa431f17c4c8d5850c297a7",
    frozenPolicyRoot: "sha256:2118c59a35298d0ce1d67753b3d000858cccf1c244afae56b07c0e43c194c818",
    gameplayRuntimePrivacyClosureRoot: "sha256:c1e0a6b89a4f0f4eb7f89b7631a7cb25bc55cadf2e010b9b4cde924afe70bcdd",
    localSealIndependentVerificationRoot: "sha256:4385ac8270b649f0876c7846cfc75bdc3682b8526d3ab517736ff27f01ab4b3b",
    localSealProtocolRoot: "sha256:bd4cd1af650f026fd45045d45069eaad0ccd7154140899e314780bb0ec38541a",
    preSearchPolicyRoot: "sha256:6ad9134977310215ce6e98171d3586c9ae1853313f912ff6e9af95966607e382",
    predecessorSealV5BytesSha256: "sha256:0f9a5af1164e7daffc3a3603c01a3376cc4939fab9e668e97f7b7a9b326f0345",
    predecessorSealV5Root: "sha256:2db3689e8071466ff6bcf7898dd038740f8ac8f982fab50efe27f262198dd55e",
    protectedHistoryRoot: "sha256:1e1faa95b73c834a94e77be824a994c6105a78f04aeb0e76a396522692a3ea10",
    replacementMetricContractRoot: "sha256:1250d82cdd114b9dfd6dd0778b5023ae3ccb7f9f71b5d2f8c46bf3b6bf7bad57",
    selectedRouteClosureRoot: "sha256:c1e0a6b89a4f0f4eb7f89b7631a7cb25bc55cadf2e010b9b4cde924afe70bcdd",
  }),
} as const)

export const inspectV138ProtectedHistoryV9 = (repoRoot: string,
  sourceA9: string) => {
  const failurePath = V138_PLAN_262_47_FAILURE_FROZEN.path
  const dispositionPath =
    ".planning/artifacts/v1.38-plan-262-60-review-v2-invalid-disposition-v1.json"
  const failureBytes = readV138RepositoryFileNoFollow(repoRoot,
    path.resolve(repoRoot, failurePath), "required")!
  const frozenFailureBytes = readCommitFile(repoRoot,
    V138_PLAN_262_47_FAILURE_FROZEN.commit, failurePath)
  const sourceFailureBytes = readCommitFile(repoRoot, sourceA9, failurePath)
  const failure = JSON.parse(failureBytes.toString("utf8")) as Record<string, any>
  const authorizationPaths = gitText(repoRoot, ["ls-files", ".planning/artifacts"])
    .split("\n").filter(repoPath => /authorization-v[1-6]\.json$/u.test(repoPath)).sort()
  const expectedCharges = [5, 6, 7, 8, 9].flatMap(version =>
    Array.from({ length: 8 }, (_, index) => `calibration:v${version}:${index}`))
  const frozenAuthorizations = [
    [".planning/artifacts/v1.38-plan-262-15-authorization-v1.json", "0183733a18d4bdbf61c46e723373ec8359f2944f", "sha256:1e58a293effd7e84e7c88978dd9dda0dd0ef07c3d66e85312f457a4d183c0220"],
    [".planning/artifacts/v1.38-plan-262-18-authorization-v2.json", "2843f136e5c48513e66ace422b5db826bcd51971", "sha256:514320cce291d5137e6ddf9c2b92ae1941e8f00bf4eb9480d7ea38cc01e0fffa"],
    [".planning/artifacts/v1.38-plan-262-21-authorization-v3.json", "703513ce15c27bf0ffefe632c9bb8fa2033310a8", "sha256:30c4f8a85678b0e274588be9a038cd59c824ad892b987ca79d1de35806823734"],
    [".planning/artifacts/v1.38-plan-262-24-authorization-v4.json", "e3f5ff9db66401adfa7d39bbefb94aa9170b7049", "sha256:1b18234f0e2255af852038e153355fa3295f4e7863966803b335285e3da85eea"],
    [".planning/artifacts/v1.38-plan-262-29-authorization-v5.json", "57c4d7f2e54901aed04b1b713a5839ef25a946f2", "sha256:e9568f8606901935a403f3f2c4ff1bb0d142169544c469f424c764088eff3456"],
    [".planning/artifacts/v1.38-plan-262-47-authorization-v6.json", "94e512a7f1b2bf04f96e8e4d00a6325fa735f285", "sha256:77af205522666a4e013c19732eec580d7848722e348fe1029eb850263820f428"],
  ] as const
  if (canonical(failure.historicalChargedPublicAttemptIds) !== canonical(expectedCharges) ||
    failure.sourceA6 !== "600c7770867e6090147914dc090780f5b63930ec" ||
    failure.sourceB6 !== "e2166736c2a1a3f1decbb1d6b3722f87945a47ea" ||
    canonical(authorizationPaths) !== canonical(frozenAuthorizations.map(item => item[0])) ||
    !isRecord(failure.protectedRoots) ||
    gitText(repoRoot, ["rev-parse",
      `${V138_PLAN_262_47_FAILURE_FROZEN.commit}:${failurePath}`]) !==
      V138_PLAN_262_47_FAILURE_FROZEN.blobOid ||
    failureBytes.byteLength !== V138_PLAN_262_47_FAILURE_FROZEN.byteLength ||
    sha256(failureBytes) !== V138_PLAN_262_47_FAILURE_FROZEN.sha256 ||
    !failureBytes.equals(frozenFailureBytes) ||
    !sourceFailureBytes.equals(frozenFailureBytes) ||
    canonical(failure.protectedRoots) !== canonical(
      V138_PLAN_262_47_FAILURE_FROZEN.protectedRoots)) {
    fail("V138_PLAN_262_56_AUTHORIZATION_V9_PROTECTED_HISTORY_INVALID")
  }
  const body = { protectedA7: "5f39aba7833030d537c4c2767c369d24c982ed83",
    sourceA6: failure.sourceA6, sourceB6: failure.sourceB6,
    exactChargeIds: Object.freeze([...failure.historicalChargedPublicAttemptIds]),
    priorAuthorizationBytes: Object.freeze(frozenAuthorizations.map(
      ([repoPath, blobOid, digest]) => {
        const bytes = readV138RepositoryFileNoFollow(repoRoot,
          path.resolve(repoRoot, repoPath), "required")!
        if (gitText(repoRoot, ["rev-parse", `HEAD:${repoPath}`]) !== blobOid ||
          sha256(bytes) !== digest || !readCommitFile(repoRoot,
            sourceA9, repoPath).equals(bytes)) {
          fail("V138_PLAN_262_56_AUTHORIZATION_V9_PROTECTED_HISTORY_INVALID")
        }
        return { path: repoPath,
          commit: gitText(repoRoot, ["log", "-1", "--format=%H", sourceA9,
            "--", repoPath]),
          blobOid, sha256: digest, byteLength: bytes.byteLength }
      })),
    protectedRoots: V138_PLAN_262_47_FAILURE_FROZEN.protectedRoots,
    sourceFailureCommit: V138_PLAN_262_47_FAILURE_FROZEN.commit,
    sourceFailureBlobOid: V138_PLAN_262_47_FAILURE_FROZEN.blobOid,
    sourceFailureSha256: sha256(failureBytes),
    reviewV1InvalidDispositionSha256: sha256(readV138RepositoryFileNoFollow(repoRoot,
      path.resolve(repoRoot, dispositionPath), "required")!) }
  return Object.freeze({ ...body, protectedHistoryRoot: identityRoot(
    "evidenceBundle", "v1.38-plan-262-56-protected-history-v9", body) })
}

export const inspectV138Plan26256ReviewV3Input = (repoRoot: string,
  absolutePath: string) => {
  const physicalRoot = realpathSync(repoRoot)
  const resolved = path.resolve(absolutePath)
  if (!path.isAbsolute(absolutePath) || resolved === physicalRoot ||
    resolved.startsWith(`${physicalRoot}${path.sep}`) || path.basename(resolved) !==
      path.basename(V138_PLAN_262_56_V9_CANONICAL_PATHS.sourceCompletenessReview)) {
    fail("V138_PLAN_262_56_REVIEW_V3_INPUT_DOCUMENT_INVALID")
  }
  const snapshot = readV138DetachedFileOpenat(resolved)
  let document: Record<string, any> = {}
  try { document = JSON.parse(snapshot.bytes.toString("utf8")) } catch {
    fail("V138_PLAN_262_56_REVIEW_V3_INPUT_INVALID")
  }
  document = validateV138ReviewV3DocumentForAuthorization(document)
  if (!snapshot.bytes.equals(Buffer.from(canonical(document), "utf8")))
    fail("V138_PLAN_262_56_REVIEW_V3_INPUT_BYTES_INVALID")
  const canonicalReviewPath = V138_PLAN_262_56_V9_CANONICAL_PATHS.sourceCompletenessReview
  const canonicalReportPath =
    ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-62-REVIEW.md"
  const publications = gitText(repoRoot, ["log", "--all", "--format=%H", "--",
    canonicalReviewPath, canonicalReportPath]).split("\n").filter(Boolean)
    .filter(commit => canonical(sorted(gitText(repoRoot, ["diff-tree",
      "--no-commit-id", "--name-only", "-r", "--no-renames", commit])
      .split("\n").filter(Boolean))) === canonical(sorted(
        [canonicalReviewPath, canonicalReportPath])))
  if (publications.length !== 1) fail("V138_PLAN_262_56_REVIEW_V3_INPUT_GIT_INVALID")
  const inputCommit = publications[0]!
  const parents = gitText(repoRoot, ["show", "-s", "--format=%P", inputCommit])
    .split(" ").filter(Boolean)
  const firstParent = gitText(repoRoot, ["rev-list", "--first-parent", "HEAD"])
    .split("\n").filter(Boolean)
  if (parents.length !== 1 || parents[0] !== document.sourceA9 ||
    !firstParent.includes(inputCommit) || gitText(repoRoot, ["log", "--format=%H",
      `${inputCommit}..HEAD`, "--", canonicalReviewPath, canonicalReportPath]) !== "" ||
    !readCommitFile(repoRoot, inputCommit, canonicalReviewPath).equals(snapshot.bytes))
    fail("V138_PLAN_262_56_REVIEW_V3_INPUT_GIT_INVALID")
  const bytesDigest = sha256(snapshot.bytes)
  const derived = { absolutePath: resolved, outsideRepository: true as const,
    readOnly: true as const, ownerMatchesEffectiveUid: true as const,
    regularFile: true as const, symlinkFree: true as const, linkCount: 1 as const,
    inputCommit, inputBlob: gitText(repoRoot, ["rev-parse",
      `${inputCommit}:${canonicalReviewPath}`]),
    byteLength: snapshot.bytes.byteLength, bytesSha256: bytesDigest,
    reviewV3Root: document.reviewV3Root as Sha256, preBytesSha256: bytesDigest,
    postBytesSha256: bytesDigest, preNoFollowIdentity: snapshot.noFollowIdentity,
    postNoFollowIdentity: snapshot.noFollowIdentity, reviewV3Document: document }
  return checkV138Plan26256ReviewV3Input(repoRoot, derived)
}

export const buildV138Plan26256AuthorizationV9 = (input: {
  readonly repoRoot: string
  readonly reviewV3AbsolutePath: string
  readonly expectedToolIdentityRoot?: Sha256
}) => {
  const reviewV3Input = inspectV138Plan26256ReviewV3Input(input.repoRoot,
    input.reviewV3AbsolutePath)
  const source = inspectV138SourceA9Custody(input.repoRoot,
    reviewV3Input.reviewV3Document as Record<string, any>)
  const protectedHistory = inspectV138ProtectedHistoryV9(input.repoRoot,
    source.sourceA9)
  const sourcePaths = V138_PLAN_262_60_SOURCE_PATHS
  if (canonical(source.sourceA9Paths) !== canonical(sourcePaths)) {
    fail("V138_PLAN_262_56_AUTHORIZATION_V9_CUSTODY_INVALID")
  }
  const document = reviewV3Input.reviewV3Document as Record<string, any>
  const publication = { changedPaths: [
    V138_PLAN_262_56_V9_CANONICAL_PATHS.sourceCompletenessReview,
    ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-62-REVIEW.md"] }
  const sourceCustody = { tree: source.sourceA9Tree, parent: source.sourceA9Parent,
    authorRun: V138_PLAN_262_60_CORRECTION_RUN, paths: source.sourceA9Paths,
    blobs: source.sourceA9Blobs, deletionHistory: source.deletionHistory }
  const sourceBaseBlobs = sourcePaths.map(repoPath => {
    const entry = gitText(input.repoRoot, ["ls-tree", source.sourceBase9, "--",
      repoPath])
    if (entry === "") return { path: repoPath, mode: "deleted", blobOid: null,
      sha256: null, byteLength: 0 }
    const bytes = readCommitFile(input.repoRoot, source.sourceBase9, repoPath)
    return { path: repoPath, mode: entry.split(/\s+/u)[0],
      blobOid: gitText(input.repoRoot, ["rev-parse",
        `${source.sourceBase9}:${repoPath}`]), sha256: sha256(bytes),
      byteLength: bytes.byteLength }
  })
  const snapshots = [{ name: "before",
    inventoryRoot: identityRoot("artifactManifest",
      "v1.38-review-v3-source-snapshot-v1", sourceBaseBlobs),
    pathCount: sourceBaseBlobs.length }, { name: "after",
    inventoryRoot: identityRoot("artifactManifest",
      "v1.38-review-v3-source-snapshot-v1", source.sourceA9Blobs),
    pathCount: source.sourceA9Blobs.length }]
  checkV138ReviewV3ClaimsAgainstObservations({ document,
    routeManifest: V138_REVIEW_V3_ROUTE_MANIFEST,
    sourceCustody,
    publication, protectedHistory: { root: protectedHistory.protectedHistoryRoot,
      protectedA8: source.sourceA9,
      protectedRoots: protectedHistory.protectedRoots },
    priorAuthorizationBytes: protectedHistory.priorAuthorizationBytes,
    snapshots })
  const body = {
    schemaVersion: V138_PLAN_262_56_AUTHORIZATION_V9_SCHEMA,
    routeOrdinal: 7 as const,
    executionVersions: Object.freeze({ context: 11 as const, preflight: 11 as const,
      calibration: 11 as const, reproduction: 12 as const }),
    sourceBase9: source.sourceBase9, sourceA9: source.sourceA9,
    sourceA9Paths: sourcePaths, sourceA9Tree: source.sourceA9Tree,
    sourceA9Parent: source.sourceA9Parent,
    sourceA9Blobs: source.sourceA9Blobs,
    sourceDeletionHistory: source.deletionHistory,
    protectedA7: protectedHistory.protectedA7,
    protectedHistory,
    reviewV3Input,
    toolIdentity: Object.freeze({ expectedRoot:
      input.expectedToolIdentityRoot ?? deriveV138ToolIdentityRoot() }),
    identityClaims: Object.freeze({ independentPersonClaimed: false as const,
      reviewerSeparated: false as const, externalIdentityClaimed: false as const,
      cryptographicReviewerIdentityClaimed: false as const,
      independentCustodyClaimed: false as const }),
    canonicalDestinations: V138_PLAN_262_57_ROUTE_DESTINATIONS,
    futureCustodyPaths: Object.freeze([
      V138_PLAN_262_56_V9_CANONICAL_PATHS.authorization,
      V138_PLAN_262_56_V9_CANONICAL_PATHS.seal,
    ]),
    obsoleteV7PathsAbsent: true as const,
    singleUse: true as const, noRetry: true as const,
    satisfiesAdmit03: false as const,
    downstreamAuthority: Object.freeze({ candidateSearch: false,
      phase263: false, formation: false, holdoutOpen: false,
      public: false, production: false }),
  }
  return Object.freeze({ ...body, authorizationRoot: identityRoot(
    "evidenceBundle", body.schemaVersion, body) })
}

export const checkV138Plan26256AuthorizationV9 = (repoRoot: string,
  value: unknown) => {
  if (!isRecord(value) || !exactKeys(value,
    V138_PLAN_262_56_V9_AUTHORIZATION_KEYS)) {
    fail("V138_PLAN_262_56_AUTHORIZATION_V9_SCHEMA_INVALID")
  }
  const candidate = value as Record<string, any>
  if (!isSha256(candidate.toolIdentity?.expectedRoot)) {
    fail("V138_PLAN_262_56_AUTHORIZATION_V9_INVALID")
  }
  const expected = buildV138Plan26256AuthorizationV9({ repoRoot,
    reviewV3AbsolutePath: String(candidate.reviewV3Input?.absolutePath),
    expectedToolIdentityRoot: candidate.toolIdentity.expectedRoot })
  if (canonical(value) !== canonical(expected)) {
    fail("V138_PLAN_262_56_AUTHORIZATION_V9_INVALID")
  }
  return expected
}

export const buildV138SuccessorSourceSealV9 = (input: {
  readonly repoRoot: string
  readonly authorization: unknown
}) => {
  const authorization = checkV138Plan26256AuthorizationV9(input.repoRoot,
    input.authorization)
  const exactPaths = [V138_PLAN_262_56_V9_CANONICAL_PATHS.authorization,
    V138_PLAN_262_56_V9_CANONICAL_PATHS.seal].sort()
  const body = { schemaVersion: V138_SUCCESSOR_SOURCE_SEAL_V9_SCHEMA,
    sourceA9: authorization.sourceA9, changedPaths: Object.freeze(exactPaths),
    authorizationRoot: authorization.authorizationRoot,
    reviewV3Root: authorization.reviewV3Input.reviewV3Root,
    toolIdentity: authorization.toolIdentity,
    futureCustodyPaths: authorization.futureCustodyPaths,
    identityClaims: authorization.identityClaims,
    routeOrdinal: 7 as const, executionVersions: authorization.executionVersions,
    singleUse: true as const, noRetry: true as const }
  return Object.freeze({ ...body, sealRoot: identityRoot("evidenceBundle",
    body.schemaVersion, body) })
}

export const checkV138SuccessorSourceSealV9 = (input: {
  readonly repoRoot: string
  readonly authorization: unknown
  readonly seal: unknown
}) => {
  if (!isRecord(input.seal)) fail("V138_SUCCESSOR_SOURCE_SEAL_V9_INVALID")
  const expected = buildV138SuccessorSourceSealV9({ repoRoot: input.repoRoot,
    authorization: input.authorization })
  if (canonical(input.seal) !== canonical(expected)) {
    fail("V138_SUCCESSOR_SOURCE_SEAL_V9_INVALID")
  }
  return expected
}

export const checkV138SuccessorSealCommitV9 = (input: {
  readonly repoRoot: string
  readonly sourceB9: string
  readonly authorization: unknown
  readonly seal: unknown
  readonly suppliedAuthorizationBytes?: Uint8Array
  readonly suppliedSealBytes?: Uint8Array
}) => {
  const authorization = checkV138Plan26256AuthorizationV9(input.repoRoot,
    input.authorization)
  const seal = checkV138SuccessorSourceSealV9({ repoRoot: input.repoRoot,
    authorization, seal: input.seal })
  const sourceB9 = fullCommit(input.repoRoot, input.sourceB9)
  const parents = gitText(input.repoRoot, ["show", "-s", "--format=%P", sourceB9])
    .split(" ").filter(Boolean)
  const exactPaths = sorted([V138_PLAN_262_56_V9_CANONICAL_PATHS.authorization,
    V138_PLAN_262_56_V9_CANONICAL_PATHS.seal])
  const changedPaths = sorted(gitText(input.repoRoot, ["diff-tree", "--no-commit-id",
    "--name-only", "-r", "--no-renames", sourceB9]).split("\n").filter(Boolean))
  const between = gitText(input.repoRoot, ["rev-list", "--first-parent", "--reverse",
    `${authorization.sourceA9}..${sourceB9}`]).split("\n").filter(Boolean)
  const intervening = between.slice(0, -1)
  if (parents.length !== 1 || canonical(changedPaths) !== canonical(exactPaths) ||
    between.at(-1) !== sourceB9 || intervening.some(commit => gitText(input.repoRoot,
      ["diff-tree", "--no-commit-id", "--name-only", "-r", "--no-renames", commit])
      .split("\n").filter(Boolean).some(repoPath => !repoPath.startsWith(".planning/")))) {
    fail("V138_SUCCESSOR_SOURCE_SEAL_V9_CUSTODY_INVALID")
  }
  const candidates = gitText(input.repoRoot, ["log", "--all", "--format=%H", "--",
    ...exactPaths])
    .split("\n").filter(Boolean).filter(commit => {
      const candidateParents = gitText(input.repoRoot,
        ["show", "-s", "--format=%P", commit]).split(" ").filter(Boolean)
      const candidatePaths = sorted(gitText(input.repoRoot, ["diff-tree",
        "--no-commit-id", "--name-only", "-r", "--no-renames", commit])
        .split("\n").filter(Boolean))
      return candidateParents.length === 1 &&
        gitStatus(input.repoRoot, ["merge-base", "--is-ancestor",
          authorization.sourceA9, commit]) === 0 &&
        canonical(candidatePaths) === canonical(exactPaths)
    })
  const firstParent = gitText(input.repoRoot, ["rev-list", "--first-parent", "HEAD"])
    .split("\n").filter(Boolean)
  if (candidates.length !== 1 || candidates[0] !== sourceB9 ||
    !firstParent.includes(sourceB9) || gitStatus(input.repoRoot,
      ["merge-base", "--is-ancestor", sourceB9, "HEAD"]) !== 0) {
    fail("V138_SUCCESSOR_SOURCE_SEAL_V9_CUSTODY_INVALID")
  }
  const blobs = exactPaths.map(repoPath => {
    if (gitText(input.repoRoot, ["ls-tree", "--name-only", authorization.sourceA9,
      "--", repoPath])) fail("V138_SUCCESSOR_SOURCE_SEAL_V9_NOT_EXCLUSIVE")
    const committed = readCommitFile(input.repoRoot, sourceB9, repoPath)
    const working = readV138RepositoryFileNoFollow(input.repoRoot,
      path.resolve(input.repoRoot, repoPath), "required")!
    const supplied = repoPath === exactPaths[0] ? input.suppliedAuthorizationBytes :
      input.suppliedSealBytes
    if (!committed.equals(working) || (supplied !== undefined &&
      !committed.equals(Buffer.from(supplied)))) fail("V138_SUCCESSOR_SOURCE_SEAL_V9_BYTES_INVALID")
    return Object.freeze({ path: repoPath,
      blobOid: gitText(input.repoRoot, ["rev-parse", `${sourceB9}:${repoPath}`]),
      sha256: sha256(committed) })
  })
  const later = gitText(input.repoRoot, ["log", "--format=%H", `${sourceB9}..HEAD`,
    "--", ...exactPaths]).split("\n").filter(Boolean)
  if (later.length !== 0) fail("V138_SUCCESSOR_SOURCE_SEAL_V9_MODIFIED")
  return Object.freeze({ authorization, seal, sourceB9, sourceB9Parent: parents[0]!,
    sourceB9Tree: gitText(input.repoRoot, ["rev-parse", `${sourceB9}^{tree}`]),
    changedPaths: Object.freeze(changedPaths), blobs: Object.freeze(blobs),
    laterModificationCount: 0 as const })
}

export const writeV138Plan26256AuthorizationV9 = (repoRoot: string,
  targetPath: string, reviewV3AbsolutePath: string) => {
  const target = canonicalPath(repoRoot, targetPath,
    V138_PLAN_262_56_V9_CANONICAL_PATHS.authorization)
  regularFile(target, "absent")
  const value = buildV138Plan26256AuthorizationV9({ repoRoot,
    reviewV3AbsolutePath })
  writeV138CanonicalExclusiveV2(repoRoot, target, value)
  return value
}

export const writeV138SuccessorSourceSealV9 = (repoRoot: string,
  targetPath: string, authorizationValue: unknown) => {
  const target = canonicalPath(repoRoot, targetPath,
    V138_PLAN_262_56_V9_CANONICAL_PATHS.seal)
  regularFile(target, "absent")
  const value = buildV138SuccessorSourceSealV9({ repoRoot,
    authorization: authorizationValue })
  writeV138CanonicalExclusiveV2(repoRoot, target, value)
  return value
}
export const V138_PLAN_262_56_CANONICAL_PATHS =
  V138_PLAN_262_56_V9_CANONICAL_PATHS
export const V138_PLAN_262_57_PRE_START_OBSTRUCTION_PATH =
  ".planning/artifacts/v1.38-plan-262-57-pre-start-obstruction-v1.json" as const
export const V138_PLAN_262_57_ROUTE_DESTINATIONS = Object.freeze([
  ".planning/artifacts/v1.38-plan-262-57-route-start-v1.json",
  ".planning/artifacts/v1.38-current-matrix-headroom-preflight-v11.json",
  ".planning/artifacts/v1.38-current-matrix-calibration-v11.json",
  ".planning/artifacts/v1.38-current-matrix-reproduction-v12.json",
  ".planning/artifacts/v1.38-plan-262-57-terminal-v1.json",
  ".planning/artifacts/v1.38-plan-262-57-calibration-consumption-v1.json",
  ".planning/artifacts/v1.38-plan-262-57-reproduction-consumption-v1.json",
] as const)
export const V138_PLAN_262_57_FRESH_DESTINATIONS = Object.freeze([
  ...V138_PLAN_262_57_ROUTE_DESTINATIONS,
  V138_PLAN_262_57_PRE_START_OBSTRUCTION_PATH,
] as const)

export const V138_PLAN_262_54_SOURCE_BASE7 =
  "be2a7164dbf332f2295114ddaf563ee11013bf5a" as const
export const V138_PLAN_262_54_SOURCE_PATHS = Object.freeze([
  "scripts/evaluate-v1-38-successor-route.test.ts",
  "scripts/evaluate-v1-38-successor-source-complete.test.ts",
  "scripts/lib/v1-38-current-matrix-reproduction.ts",
  "scripts/lib/v1-38-successor-source-seal.ts",
] as const)
export const V138_PLAN_262_55_REVIEW_SCHEMA =
  "v1.38-plan-262-55-source-completeness-review-v1" as const

const V138_PLAN_262_56_AUTHORIZATION_KEYS = Object.freeze([
  "schemaVersion", "routeOrdinal", "operator", "reviewedSourceCommit",
  "reviewedSourceTree", "reviewedSourceParents", "reviewedSourceBlobs",
  "sourceBase7", "sourceA7", "sourceRangeCommits", "sourceRange",
  "aggregateChangedPaths", "implementationAuthorRun",
  "sourceCompletenessReview", "selectedRouteClosure",
  "selectedRouteClosureRoot", "toolIdentity", "formationAbsence",
  "protectedHistory", "protectedHistoryRoot",
  "cumulativeChargedPublicAttemptIds", "priorAuthorizationBytes",
  "preSearchPolicyRoot", "canonicalDestinations", "frozenPolicyRoot",
  "literalSha256", "sealCount", "routeStartCount", "preflightCount",
  "calibrationAllocationCount", "calibrationAttemptCount",
  "calibrationShardCount", "reproductionMaximumCount",
  "reproductionCellCount", "resourceSampleMilliseconds",
  "requiredHostHeadroomBasisPoints", "singleUse", "noRetry",
  "noPriorAuthorizationReusable", "satisfiesAdmit03",
  "downstreamAuthority", "authorizationRoot",
] as const)

export const inspectV138SourceIdentityA7 = (repoRoot: string,
  sourceInput: string) => {
  const sourceBase7 = fullCommit(repoRoot, V138_PLAN_262_54_SOURCE_BASE7)
  const reviewedSourceCommit = fullCommit(repoRoot, sourceInput)
  try {
    gitText(repoRoot, ["merge-base", "--is-ancestor", sourceBase7,
      reviewedSourceCommit])
  } catch { fail("V138_PLAN_262_54_SOURCE_RANGE_INVALID") }
  const commits = gitText(repoRoot, ["rev-list", "--reverse",
    `${sourceBase7}..${reviewedSourceCommit}`]).split("\n").filter(Boolean)
  if (commits.length === 0 || commits.at(-1) !== reviewedSourceCommit) {
    fail("V138_PLAN_262_54_SOURCE_RANGE_INVALID")
  }
  const lineage: Array<Readonly<{ commit: string; tree: string;
    parents: readonly string[]; changedPaths: readonly string[];
    authorRun: string }>> = []
  const aggregate = new Set<string>()
  let expectedParent = sourceBase7
  let expectedAuthorRun: string | undefined
  for (const commit of commits) {
    const [oid, tree, parentsText = ""] = gitText(repoRoot, ["show", "-s",
      "--format=%H%n%T%n%P", commit]).split("\n")
    const parents = parentsText.split(" ").filter(Boolean)
    const changedPaths = sorted(gitText(repoRoot, ["diff-tree",
      "--no-commit-id", "--name-only", "-r", "--no-renames", commit])
      .split("\n").filter(Boolean).map(normalize))
    const authorRuns = gitText(repoRoot, ["show", "-s",
      "--format=%(trailers:key=Plan-262-54-Author-Run,valueonly)", commit])
      .split("\n").map((entry) => entry.trim()).filter(Boolean)
    if (oid !== commit || !/^[0-9a-f]{40}$/u.test(tree!) ||
      parents.length !== 1 || parents[0] !== expectedParent ||
      changedPaths.length === 0 || changedPaths.some((repoPath) =>
        !V138_PLAN_262_54_SOURCE_PATHS.includes(repoPath as never)) ||
      authorRuns.length !== 1) {
      fail("V138_PLAN_262_54_SOURCE_RANGE_INVALID")
    }
    expectedAuthorRun ??= authorRuns[0]
    if (authorRuns[0] !== expectedAuthorRun) {
      fail("V138_PLAN_262_54_AUTHOR_RUN_INVALID")
    }
    changedPaths.forEach((repoPath) => aggregate.add(repoPath))
    lineage.push(Object.freeze({ commit, tree: tree!,
      parents: Object.freeze(parents), changedPaths: Object.freeze(changedPaths),
      authorRun: authorRuns[0]! }))
    expectedParent = commit
  }
  if (canonical(sorted(aggregate)) !==
    canonical(sorted(V138_PLAN_262_54_SOURCE_PATHS))) {
    fail("V138_PLAN_262_54_SOURCE_PATHS_INVALID")
  }
  const final = lineage.at(-1)!
  const reviewedSourceBlobs = Object.freeze(V138_PLAN_262_54_SOURCE_PATHS.map(
    (repoPath) => blobRecord(repoRoot, reviewedSourceCommit, repoPath)))
  return Object.freeze({ sourceBase7, sourceA7: reviewedSourceCommit,
    reviewedSourceCommit, reviewedSourceTree: final.tree,
    reviewedSourceParents: final.parents, reviewedSourceBlobs,
    sourceRangeCommits: Object.freeze(commits),
    sourceRange: Object.freeze(lineage),
    aggregateChangedPaths: Object.freeze(sorted(aggregate)),
    implementationAuthorRun: expectedAuthorRun! })
}

const V138_PLAN_262_55_REVIEW_KEYS = Object.freeze([
  "schemaVersion", "plan", "a7", "a7Tree", "a7Parent", "sourceBase7",
  "sourceRangeCommits", "sourcePaths", "implementationAuthorRun",
  "reviewProtocol", "independentPersonClaimed",
  "cryptographicReviewerIdentityClaimed", "findingCount",
  "sourceCompletenessPassed", "reviewRoot",
] as const)

export const V138_PLAN_262_55_REVIEWER_PROTOCOL =
  "single_operator_procedural_source_review_v1" as const

export const buildV138Plan26255ReviewDocument = (repoRoot: string,
  sourceA7: string) => {
  const source = inspectV138SourceIdentityA7(repoRoot, sourceA7)
  const body = { schemaVersion: V138_PLAN_262_55_REVIEW_SCHEMA,
    plan: "262-55" as const, a7: source.sourceA7,
    a7Tree: source.reviewedSourceTree,
    a7Parent: source.reviewedSourceParents[0]!,
    sourceBase7: source.sourceBase7,
    sourceRangeCommits: source.sourceRangeCommits,
    sourcePaths: V138_PLAN_262_54_SOURCE_PATHS,
    implementationAuthorRun: source.implementationAuthorRun,
    reviewProtocol: V138_PLAN_262_55_REVIEWER_PROTOCOL,
    independentPersonClaimed: false as const,
    cryptographicReviewerIdentityClaimed: false as const,
    findingCount: 0 as const, sourceCompletenessPassed: true as const }
  return Object.freeze({ ...body, reviewRoot: identityRoot("evidenceBundle",
    V138_PLAN_262_55_REVIEW_SCHEMA, body) })
}

const checkV138Plan26255ReviewDocument = (value: unknown,
  source: ReturnType<typeof inspectV138SourceIdentityA7>) => {
  if (!isRecord(value) || !exactKeys(value, V138_PLAN_262_55_REVIEW_KEYS)) {
    fail("V138_PLAN_262_55_REVIEW_INVALID")
  }
  const { reviewRoot, ...body } = value
  if (value.schemaVersion !== V138_PLAN_262_55_REVIEW_SCHEMA ||
    value.plan !== "262-55" || value.a7 !== source.sourceA7 ||
    value.a7Tree !== source.reviewedSourceTree ||
    value.a7Parent !== source.reviewedSourceParents[0] ||
    value.sourceBase7 !== source.sourceBase7 ||
    canonical(value.sourceRangeCommits) !==
      canonical(source.sourceRangeCommits) ||
    canonical(value.sourcePaths) !==
      canonical(V138_PLAN_262_54_SOURCE_PATHS) ||
    value.implementationAuthorRun !== source.implementationAuthorRun ||
    value.reviewProtocol !== V138_PLAN_262_55_REVIEWER_PROTOCOL ||
    value.independentPersonClaimed !== false ||
    value.cryptographicReviewerIdentityClaimed !== false ||
    value.findingCount !== 0 ||
    value.sourceCompletenessPassed !== true || reviewRoot !== identityRoot(
      "evidenceBundle", V138_PLAN_262_55_REVIEW_SCHEMA, body)) {
    fail("V138_PLAN_262_55_REVIEW_INVALID")
  }
  return Object.freeze(value)
}

const v138Plan26255ReviewCache = new Map<string, any>()
const deriveV138Plan26255Review = (repoRoot: string, sourceA7: string) => {
  const cacheKey = `${repoRoot}\0${sourceA7}`
  const cached = v138Plan26255ReviewCache.get(cacheKey)
  if (cached !== undefined) return cached
  const source = inspectV138SourceIdentityA7(repoRoot, sourceA7)
  const candidates = gitText(repoRoot, ["log", "--all", "--format=%H", "--",
    V138_PLAN_262_56_CANONICAL_PATHS.sourceCompletenessReview]).split("\n")
    .filter(Boolean).flatMap((reviewCommit) => {
      if (reviewCommit === source.sourceA7) return []
      try {
        gitText(repoRoot, ["merge-base", "--is-ancestor", source.sourceA7,
          reviewCommit])
        const bytes = readCommitFile(repoRoot, reviewCommit,
          V138_PLAN_262_56_CANONICAL_PATHS.sourceCompletenessReview)
        const document = checkV138Plan26255ReviewDocument(
          JSON.parse(bytes.toString("utf8")), source)
        if (!bytes.equals(Buffer.from(canonical(document), "utf8"))) return []
        return [{ reviewCommit, bytes, document }]
      } catch { return [] }
    })
  if (candidates.length !== 1) fail("V138_PLAN_262_55_REVIEW_CUSTODY_INVALID")
  const candidate = candidates[0]!
  const parents = gitText(repoRoot, ["show", "-s", "--format=%P",
    candidate.reviewCommit]).split(" ").filter(Boolean)
  const changedPaths = sorted(gitText(repoRoot, ["diff-tree",
    "--no-commit-id", "--name-only", "-r", "--no-renames",
    candidate.reviewCommit]).split("\n").filter(Boolean).map(normalize))
  if (parents.length !== 1 || parents[0] !== source.sourceA7 ||
    canonical(changedPaths) !== canonical([
      V138_PLAN_262_56_CANONICAL_PATHS.sourceCompletenessReview])) {
    fail("V138_PLAN_262_55_REVIEWER_SEPARATION_INVALID")
  }
  const reviewTree = gitText(repoRoot, ["rev-parse",
    `${candidate.reviewCommit}^{tree}`])
  const blobOid = gitText(repoRoot, ["rev-parse",
    `${candidate.reviewCommit}:${V138_PLAN_262_56_CANONICAL_PATHS.sourceCompletenessReview}`])
  const proceduralSeparationRoot = identityRoot("containmentPolicy",
    V138_PLAN_262_55_REVIEWER_PROTOCOL, { sourceA7: source.sourceA7,
      reviewCommit: candidate.reviewCommit, reviewTree, reviewParents: parents,
      changedPaths, blobOid, reviewSha256: sha256(candidate.bytes),
      independentPersonClaimed: false,
      cryptographicReviewerIdentityClaimed: false })
  const result = Object.freeze({ path:
    V138_PLAN_262_56_CANONICAL_PATHS.sourceCompletenessReview,
    reviewCommit: candidate.reviewCommit,
    reviewTree,
    reviewParents: Object.freeze(parents),
    blobOid,
    sha256: sha256(candidate.bytes), reviewRoot:
      candidate.document.reviewRoot, reviewProtocol:
      V138_PLAN_262_55_REVIEWER_PROTOCOL, proceduralSeparationRoot,
    independentPersonClaimed: false as const,
    cryptographicReviewerIdentityClaimed: false as const,
    document: candidate.document })
  v138Plan26255ReviewCache.set(cacheKey, result)
  return result
}

export const v138Plan26256AuthorizationLiteral = (repoRoot: string,
  sourceA7: string, reviewValue: unknown): string => {
  const source = inspectV138SourceIdentityA7(repoRoot, sourceA7)
  const review = deriveV138Plan26255Review(repoRoot, source.sourceA7)
  if (canonical(reviewValue) !== canonical(review.document)) {
    fail("V138_PLAN_262_55_REVIEW_INVALID")
  }
  const history = deriveV138ProtectedHistoryV6(repoRoot,
    source.reviewedSourceCommit)
  return [
    "Coward's Game Plan 262-56 exact authorization-v7",
    `reviewed source A7 ${source.reviewedSourceCommit}`,
    `review root ${String(review.reviewRoot)}`,
    "route ordinal 7",
    "one atomic Plan-262-57 route-start receipt binding context:v11 and preflight consumption",
    "one 200 ms preflight with inclusive 2,500-basis-point threshold",
    "one eight-attempt/four-shard calibration:v11",
    "at most one conditional reproduction:v12 540-cell run",
    `protected history ${history.protectedHistoryRoot}`,
    "all forty historical charged identities and all prior authorization bytes remain immutable",
    "single_operator_local_seal_v1 remains reduced assurance",
    "single use; no retry; no prior authorization reusable; no downstream authority",
  ].join("\n")
}

export const buildV138Plan26256AuthorizationV7 = (input: {
  readonly repoRoot: string
  readonly sourceA7: string
  readonly review: unknown
  readonly literalBytes: Uint8Array
}) => {
  const source = inspectV138SourceIdentityA7(input.repoRoot, input.sourceA7)
  const review = deriveV138Plan26255Review(input.repoRoot, source.sourceA7)
  if (canonical(input.review) !== canonical(review.document)) {
    fail("V138_PLAN_262_55_REVIEW_INVALID")
  }
  if (!Buffer.from(v138Plan26256AuthorizationLiteral(input.repoRoot,
    source.reviewedSourceCommit, review.document), "utf8").equals(
      Buffer.from(input.literalBytes))) {
    fail("V138_PLAN_262_56_AUTHORIZATION_LITERAL_INVALID")
  }
  const history = deriveV138ProtectedHistoryV6(input.repoRoot,
    source.reviewedSourceCommit)
  const selectedRouteClosure = plan26247Closure(input.repoRoot,
    source.reviewedSourceCommit)
  const toolIdentity = Object.freeze({ toolIdentityRoot:
    deriveV138ToolIdentityRoot() })
  const formationAbsence = Object.freeze({ scannedRoot:
    deriveV138FormationAbsenceRoot(input.repoRoot,
      source.reviewedSourceCommit) })
  const body = {
    schemaVersion: V138_PLAN_262_56_AUTHORIZATION_SCHEMA,
    routeOrdinal: 7 as const,
    operator: V138_PLAN_262_15_OPERATOR,
    ...source,
    sourceCompletenessReview: review,
    selectedRouteClosure,
    selectedRouteClosureRoot: selectedRouteClosure.closureRoot,
    toolIdentity,
    formationAbsence,
    protectedHistory: history,
    protectedHistoryRoot: history.protectedHistoryRoot,
    cumulativeChargedPublicAttemptIds:
      history.cumulativeChargedPublicAttemptIds,
    priorAuthorizationBytes: history.priorAuthorizationBytes,
    preSearchPolicyRoot:
      "sha256:6ad9134977310215ce6e98171d3586c9ae1853313f912ff6e9af95966607e382" as Sha256,
    canonicalDestinations: V138_PLAN_262_57_ROUTE_DESTINATIONS,
    frozenPolicyRoot: frozenPolicyRootV2(),
    literalSha256: sha256(input.literalBytes),
    sealCount: 1 as const, routeStartCount: 1 as const,
    preflightCount: 1 as const, calibrationAllocationCount: 1 as const,
    calibrationAttemptCount: 8 as const, calibrationShardCount: 4 as const,
    reproductionMaximumCount: 1 as const, reproductionCellCount: 540 as const,
    resourceSampleMilliseconds: 200 as const,
    requiredHostHeadroomBasisPoints: 2500 as const,
    singleUse: true as const, noRetry: true as const,
    noPriorAuthorizationReusable: true as const,
    satisfiesAdmit03: false as const,
    downstreamAuthority: Object.freeze({ candidateSearch: false,
      phase263: false, formation: false, holdoutOpen: false,
      public: false, production: false }),
  }
  return Object.freeze({ ...body, authorizationRoot: identityRoot(
    "evidenceBundle", body.schemaVersion, body) })
}

const v138Plan26256AuthorizationCache = new Map<string, any>()

export const checkV138Plan26256AuthorizationV7 = (repoRoot: string,
  value: unknown) => {
  if (!isRecord(value) || !exactKeys(value, V138_PLAN_262_56_AUTHORIZATION_KEYS)) {
    fail("V138_PLAN_262_56_AUTHORIZATION_SCHEMA_INVALID")
  }
  const candidate = value as Record<string, unknown>
  if (typeof candidate.reviewedSourceCommit !== "string") {
    fail("V138_PLAN_262_56_AUTHORIZATION_INVALID")
  }
  const review = deriveV138Plan26255Review(repoRoot,
    candidate.reviewedSourceCommit)
  const cacheKey = `${repoRoot}\0${candidate.reviewedSourceCommit}`
  let expected = v138Plan26256AuthorizationCache.get(cacheKey)
  if (expected === undefined) {
    const expectedLiteral = Buffer.from(v138Plan26256AuthorizationLiteral(
      repoRoot, candidate.reviewedSourceCommit, review.document), "utf8")
    expected = buildV138Plan26256AuthorizationV7({ repoRoot,
      sourceA7: candidate.reviewedSourceCommit, review: review.document,
      literalBytes: expectedLiteral })
    v138Plan26256AuthorizationCache.set(cacheKey, expected)
  }
  if (canonical(candidate) !== canonical(expected)) {
    fail("V138_PLAN_262_56_AUTHORIZATION_INVALID")
  }
  return expected
}

export type V138SuccessorSealV7ObservationException =
  "toolIdentity" | "protectedHistory" | "formationAbsence"

export const checkV138Plan26256AuthorizationV7Except = (repoRoot: string,
  value: unknown, except: V138SuccessorSealV7ObservationException) => {
  if (!isRecord(value) || !exactKeys(value, V138_PLAN_262_56_AUTHORIZATION_KEYS)) {
    fail("V138_PLAN_262_56_AUTHORIZATION_SCHEMA_INVALID")
  }
  const candidate = value as Record<string, unknown>
  const { authorizationRoot, ...body } = candidate
  if (authorizationRoot !== identityRoot("evidenceBundle",
      V138_PLAN_262_56_AUTHORIZATION_SCHEMA, body) ||
    typeof candidate.reviewedSourceCommit !== "string") {
    fail("V138_PLAN_262_56_AUTHORIZATION_INVALID")
  }
  const review = deriveV138Plan26255Review(repoRoot,
    candidate.reviewedSourceCommit)
  if (except === "protectedHistory") {
    const source = inspectV138SourceIdentityA7(repoRoot,
      candidate.reviewedSourceCommit)
    const history = candidate.protectedHistory
    const closure = plan26247Closure(repoRoot, source.reviewedSourceCommit)
    const stableCandidate = Object.fromEntries(Object.entries(candidate)
      .filter(([key]) => !["authorizationRoot", "protectedHistory",
        "protectedHistoryRoot", "cumulativeChargedPublicAttemptIds",
        "priorAuthorizationBytes", "literalSha256"].includes(key)))
    const stableExpected = {
      schemaVersion: V138_PLAN_262_56_AUTHORIZATION_SCHEMA,
      routeOrdinal: 7, operator: V138_PLAN_262_15_OPERATOR, ...source,
      sourceCompletenessReview: review, selectedRouteClosure: closure,
      selectedRouteClosureRoot: closure.closureRoot,
      toolIdentity: Object.freeze({ toolIdentityRoot:
        deriveV138ToolIdentityRoot() }),
      formationAbsence: Object.freeze({ scannedRoot:
        deriveV138FormationAbsenceRoot(repoRoot,
          source.reviewedSourceCommit) }),
      preSearchPolicyRoot:
        "sha256:6ad9134977310215ce6e98171d3586c9ae1853313f912ff6e9af95966607e382",
      canonicalDestinations: V138_PLAN_262_57_ROUTE_DESTINATIONS,
      frozenPolicyRoot: frozenPolicyRootV2(), sealCount: 1,
      routeStartCount: 1, preflightCount: 1,
      calibrationAllocationCount: 1, calibrationAttemptCount: 8,
      calibrationShardCount: 4, reproductionMaximumCount: 1,
      reproductionCellCount: 540, resourceSampleMilliseconds: 200,
      requiredHostHeadroomBasisPoints: 2500, singleUse: true,
      noRetry: true, noPriorAuthorizationReusable: true,
      satisfiesAdmit03: false, downstreamAuthority: Object.freeze({
        candidateSearch: false, phase263: false, formation: false,
        holdoutOpen: false, public: false, production: false }),
    }
    if (!isRecord(history) || history.protectedHistoryRoot !==
        candidate.protectedHistoryRoot || canonical(
          history.cumulativeChargedPublicAttemptIds) !== canonical(
          candidate.cumulativeChargedPublicAttemptIds) || canonical(
          history.priorAuthorizationBytes) !== canonical(
          candidate.priorAuthorizationBytes) || canonical(
          candidate.sourceCompletenessReview) !== canonical(review) ||
      canonical(stableCandidate) !== canonical(stableExpected)) {
      fail("V138_PLAN_262_56_AUTHORIZATION_INVALID")
    }
    return Object.freeze(candidate)
  }
  const literal = Buffer.from(v138Plan26256AuthorizationLiteral(repoRoot,
    candidate.reviewedSourceCommit, review.document), "utf8")
  const expected = buildV138Plan26256AuthorizationV7({ repoRoot,
    sourceA7: candidate.reviewedSourceCommit, review: review.document,
    literalBytes: literal }) as unknown as Record<string, unknown>
  const omitted = new Set<string>([except, "authorizationRoot"])
  if (except === "protectedHistory") {
    omitted.add("protectedHistoryRoot")
    omitted.add("cumulativeChargedPublicAttemptIds")
    omitted.add("priorAuthorizationBytes")
    omitted.add("literalSha256")
  }
  const stable = (record: Record<string, unknown>) => Object.fromEntries(
    Object.entries(record).filter(([key]) => !omitted.has(key)))
  if (canonical(stable(candidate)) !== canonical(stable(expected))) {
    fail("V138_PLAN_262_56_AUTHORIZATION_INVALID")
  }
  return Object.freeze(candidate)
}

const buildV138SuccessorSourceSealV7FromAuthorization = (
  authorization: Record<string, unknown>) => {
  const body = { schemaVersion: V138_SUCCESSOR_SOURCE_SEAL_V7_SCHEMA,
    routeOrdinal: 7 as const,
    sealedSourceCommit: authorization.reviewedSourceCommit,
    sealedSourceTree: authorization.reviewedSourceTree,
    sealedSourceParents: authorization.reviewedSourceParents,
    authorizationRoot: authorization.authorizationRoot,
    sourceCompletenessReview: authorization.sourceCompletenessReview,
    selectedRouteClosure: authorization.selectedRouteClosure,
    toolIdentity: authorization.toolIdentity,
    formationAbsence: authorization.formationAbsence,
    protectedHistory: authorization.protectedHistory,
    protectedHistoryRoot: authorization.protectedHistoryRoot,
    priorAuthorizationBytes: authorization.priorAuthorizationBytes,
    canonicalDestinations: authorization.canonicalDestinations,
    formationAbsenceBound: true as const,
    runtimeRoute: "v1.18/v1.19/MATCH_KERNEL" as const,
    singleUse: true as const, noRetry: true as const }
  return Object.freeze({ ...body, sealRoot: identityRoot("containmentPolicy",
    body.schemaVersion, body) })
}

export const buildV138SuccessorSourceSealV7 = (repoRoot: string,
  authorizationValue: unknown) => {
  const authorization = checkV138Plan26256AuthorizationV7(repoRoot,
    authorizationValue) as unknown as Record<string, unknown>
  return buildV138SuccessorSourceSealV7FromAuthorization(authorization)
}

export const checkV138SuccessorSourceSealV7 = (repoRoot: string,
  value: unknown, authorizationValue: unknown,
  except?: V138SuccessorSealV7ObservationException) => {
  const authorization = except === undefined ?
    checkV138Plan26256AuthorizationV7(repoRoot, authorizationValue) :
    checkV138Plan26256AuthorizationV7Except(repoRoot, authorizationValue,
      except)
  const expected = buildV138SuccessorSourceSealV7FromAuthorization(
    authorization as unknown as Record<string, unknown>)
  if (canonical(value) !== canonical(expected)) {
    fail("V138_SUCCESSOR_SEAL_V7_INVALID")
  }
  return expected
}

export const checkV138SealedWorktreeAtA7 = (repoRoot: string,
  sealValue: unknown) => {
  if (!isRecord(sealValue) || typeof sealValue.sealedSourceCommit !== "string") {
    fail("V138_SUCCESSOR_SEAL_V7_INVALID")
  }
  const source = inspectV138SourceIdentityA7(repoRoot,
    sealValue.sealedSourceCommit)
  for (const record of source.reviewedSourceBlobs) {
    const committed = readCommitFile(repoRoot, source.sourceA7, record.path)
    const working = readV138RepositoryFileNoFollow(repoRoot,
      path.resolve(repoRoot, record.path), "required")!
    if (!working.equals(committed) || sha256(committed) !== record.sha256 ||
      gitText(repoRoot, ["rev-parse", `${source.sourceA7}:${record.path}`]) !==
        record.blobOid) {
      fail("V138_SUCCESSOR_SEAL_A7_WORKTREE_DRIFT")
    }
  }
  return source
}

export const writeV138Plan26256AuthorizationV7 = (repoRoot: string,
  targetPath: string, sourceA7: string, review: unknown,
  literalBytes: Uint8Array) => {
  void repoRoot; void targetPath; void sourceA7; void review; void literalBytes
  fail("V138_PLAN_262_56_AUTHORIZATION_V7_OBSOLETE")
}

export const writeV138SuccessorSourceSealV7 = (repoRoot: string,
  targetPath: string, authorizationValue: unknown) => {
  void repoRoot; void targetPath; void authorizationValue
  fail("V138_SUCCESSOR_SOURCE_SEAL_V7_OBSOLETE")
}

export const checkV138SuccessorSealCommitV7 = (input: {
  readonly repoRoot: string
  readonly sourceA7: string
  readonly sourceB7: string
  readonly authorizationValue: unknown
  readonly sealValue: unknown
  readonly allowPlan26257Artifacts?: true
  readonly observationException?: V138SuccessorSealV7ObservationException
}) => {
  const sourceA7 = fullCommit(input.repoRoot, input.sourceA7)
  const sourceB7 = fullCommit(input.repoRoot, input.sourceB7)
  const parents = gitText(input.repoRoot, ["show", "-s", "--format=%P",
    sourceB7]).split(" ").filter(Boolean)
  const expectedPaths = sorted([V138_PLAN_262_56_CANONICAL_PATHS.authorization,
    V138_PLAN_262_56_CANONICAL_PATHS.seal])
  const changedPaths = sorted(gitText(input.repoRoot, ["diff-tree",
    "--no-commit-id", "--name-only", "-r", "--no-renames", sourceB7])
    .split("\n").filter(Boolean).map(normalize))
  if (parents.length !== 1 || parents[0] !== sourceA7 ||
    canonical(changedPaths) !== canonical(expectedPaths)) {
    fail("V138_SUCCESSOR_SEAL_B7_CUSTODY_INVALID")
  }
  for (const repoPath of expectedPaths) {
    requireAbsentAtCommit(input.repoRoot, sourceA7, repoPath,
      "V138_SUCCESSOR_SEAL_V7_EXISTED_AT_A7")
  }
  const authorizationBytes = readCommitFile(input.repoRoot, sourceB7,
    V138_PLAN_262_56_CANONICAL_PATHS.authorization)
  const sealBytes = readCommitFile(input.repoRoot, sourceB7,
    V138_PLAN_262_56_CANONICAL_PATHS.seal)
  const authorization = input.observationException === undefined ?
    checkV138Plan26256AuthorizationV7(input.repoRoot,
      JSON.parse(authorizationBytes.toString("utf8"))) :
    checkV138Plan26256AuthorizationV7Except(input.repoRoot,
      JSON.parse(authorizationBytes.toString("utf8")),
      input.observationException)
  const seal = checkV138SuccessorSourceSealV7(input.repoRoot,
    JSON.parse(sealBytes.toString("utf8")), authorization,
    input.observationException)
  if (!authorizationBytes.equals(Buffer.from(canonical(authorization), "utf8")) ||
    !sealBytes.equals(Buffer.from(canonical(seal), "utf8")) ||
    canonical(input.authorizationValue) !== canonical(authorization) ||
    canonical(input.sealValue) !== canonical(seal)) {
    fail("V138_SUCCESSOR_SEAL_B7_COMMITTED_BYTES_INVALID")
  }
  for (const repoPath of expectedPaths) {
    const committed = readCommitFile(input.repoRoot, sourceB7, repoPath)
    const working = readV138RepositoryFileNoFollow(input.repoRoot,
      path.resolve(input.repoRoot, repoPath), "required")!
    if (!working.equals(committed)) {
      fail("V138_SUCCESSOR_SEAL_B7_WORKTREE_DRIFT")
    }
  }
  if (authorization.reviewedSourceCommit !== sourceA7 ||
    seal.sealedSourceCommit !== sourceA7) {
    fail("V138_SUCCESSOR_SEAL_B7_SOURCE_INVALID")
  }
  checkV138SealedWorktreeAtA7(input.repoRoot, seal)
  if (input.allowPlan26257Artifacts !== true) {
    for (const repoPath of V138_PLAN_262_57_FRESH_DESTINATIONS) {
      readV138RepositoryFileNoFollow(input.repoRoot,
        path.resolve(input.repoRoot, repoPath), "absent")
    }
  }
  const body = { schemaVersion: "v1.38-source-b7-custody-v1" as const,
    sourceA7, sourceB7,
    sourceB7Tree: gitText(input.repoRoot, ["rev-parse", `${sourceB7}^{tree}`]),
    sourceB7Parent: sourceA7, changedPaths: Object.freeze(changedPaths),
    blobs: Object.freeze(expectedPaths.map((repoPath) =>
      blobRecord(input.repoRoot, sourceB7, repoPath))),
    authorizationRoot: authorization.authorizationRoot,
    sealRoot: seal.sealRoot }
  return Object.freeze({ ...body, custodyRoot: identityRoot(
    "containmentPolicy", body.schemaVersion, body) })
}

export const deriveV138ProtectedHistoryV7 = (repoRoot: string,
  sourceA7: string) => deriveV138ProtectedHistoryV6(repoRoot, sourceA7, false)

const inspectV138SuccessorSealCommitV7AnchorInternal = (input: {
  readonly repoRoot: string
  readonly sourceA7: string
  readonly sourceB7: string
  readonly observationException?: V138SuccessorSealV7ObservationException
}) => {
  const authorization = JSON.parse(readCommitFile(input.repoRoot,
    input.sourceB7, V138_PLAN_262_56_CANONICAL_PATHS.authorization)
    .toString("utf8"))
  const seal = JSON.parse(readCommitFile(input.repoRoot, input.sourceB7,
    V138_PLAN_262_56_CANONICAL_PATHS.seal).toString("utf8"))
  const custody = checkV138SuccessorSealCommitV7({ ...input,
    authorizationValue: authorization, sealValue: seal,
    allowPlan26257Artifacts: true,
    observationException: input.observationException })
  return Object.freeze({ sourceA7: custody.sourceA7,
    sourceB7: custody.sourceB7, authorization, seal,
    anchorRoot: custody.custodyRoot })
}

export const inspectV138SuccessorSealCommitV7Anchor =
  inspectV138SuccessorSealCommitV7AnchorInternal
export const inspectV138ProtectedHistoryFailureSealCommitV7Anchor =
  inspectV138SuccessorSealCommitV7AnchorInternal

const deriveV138SourceB7 = (repoRoot: string, sourceA7: string) => {
  const candidates = gitText(repoRoot, ["log", "--all", "--format=%H", "--",
    V138_PLAN_262_56_CANONICAL_PATHS.authorization]).split("\n")
    .filter(Boolean).filter((candidate) => {
      const parents = gitText(repoRoot, ["show", "-s", "--format=%P",
        candidate]).split(" ").filter(Boolean)
      if (parents.length !== 1 || parents[0] !== sourceA7) return false
      const changed = sorted(gitText(repoRoot, ["diff-tree", "--no-commit-id",
        "--name-only", "-r", "--no-renames", candidate]).split("\n")
        .filter(Boolean).map(normalize))
      return canonical(changed) === canonical(sorted([
        V138_PLAN_262_56_CANONICAL_PATHS.authorization,
        V138_PLAN_262_56_CANONICAL_PATHS.seal]))
    })
  if (candidates.length !== 1) fail("V138_SUCCESSOR_SEAL_B7_AMBIGUOUS")
  return fullCommit(repoRoot, candidates[0]!)
}

const V138_REVIEWED_SOURCE_A2 = "6db9f79e38340b303d73d6e379c13f667b5eadc9"
const V138_REVIEWED_SOURCE_B2 = "b00af0406b97aa5f0538209d1f31a6e36659e570"
const V138_PLAN_262_21_REPAIR_START =
  "93dfd673afbf5fbbce63d59e1b874f169eaefb7e"
const V138_PLAN_262_21_SOURCE_BASE =
  "89a1fe0026e2573710ec1f2c24339aa66a0b4d53"
const V138_V6_ROOTS = Object.freeze({
  authorizationRoot:
    "sha256:fff99d6cd2745152b4f19311893189fac946900cfca06b2f1b6f4b6a208d4a70" as Sha256,
  sealRoot:
    "sha256:685a7198ecc881365c823333643336c7a473dd532b17690a12a66815b6510dc9" as Sha256,
  contextRoot:
    "sha256:e98e782f243acbf3dc80964ce08f2168516e44ef8257fa72a96f7e7e552671aa" as Sha256,
  preflightRoot:
    "sha256:df76d3e5a29ed56652c08492d4eb178f783970a6e2d0baffe6bda71651b6f956" as Sha256,
  preflightConsumptionRoot:
    "sha256:7702bb26e6cff22427b2d8149f2566e09115aa783d26039e5722a44cf3a26257" as Sha256,
  calibrationRoot:
    "sha256:3d2af132430bd3a460eb06058c97fb19ef82da9108e5235b1ea817b5da2a8c4e" as Sha256,
  calibrationConsumptionRoot:
    "sha256:3fec062f357936f51075ae666647cb7a5c0b1289e8f7458bc9d70e9eddc46e85" as Sha256,
  terminalRoot:
    "sha256:a74e13e25b0bc51ddf5ed5fdaffff1ac6b5eea22de32c1bebab3d70be00e542f" as Sha256,
})
const V138_V6_HISTORY_PATHS = Object.freeze([
  V138_PLAN_262_18_CANONICAL_PATHS.authorization,
  V138_PLAN_262_18_CANONICAL_PATHS.seal,
  ...V138_PLAN_262_19_FRESH_DESTINATIONS.filter(
    (repoPath) =>
      !repoPath.endsWith("reproduction-v7.json") &&
      !repoPath.endsWith("reproduction-consumption-v1.json"),
  ),
] as const)
const V138_V6_REPRODUCTION =
  ".planning/artifacts/v1.38-current-matrix-reproduction-v7.json"
const V138_V6_REPRODUCTION_MARKER =
  ".planning/artifacts/v1.38-plan-262-19-reproduction-consumption-v1.json"

export interface V138SourceCustodyA3 {
  readonly schemaVersion: "v1.38-source-a3-custody-v1"
  readonly repairStartHead3: string
  readonly sourceBase3: string
  readonly sourceA3: string
  readonly sourceA3Tree: string
  readonly sourceA3Parents: readonly string[]
  readonly aggregateChangedPaths: readonly string[]
  readonly lineage: readonly Readonly<{
    commit: string
    tree: string
    parents: readonly string[]
    changedPaths: readonly string[]
  }>[]
  readonly sourceBlobs: readonly ReturnType<typeof blobRecord>[]
  readonly custodyRoot: Sha256
}

export const inspectSourceCustodyA3 = (input: {
  readonly repoRoot: string
  readonly repairStartHead3: string
  readonly sourceBase3: string
  readonly sourceA3: string
}): Readonly<V138SourceCustodyA3> => {
  const repairStartHead3 = fullCommit(input.repoRoot, input.repairStartHead3)
  const sourceBase3 = fullCommit(input.repoRoot, input.sourceBase3)
  const sourceA3 = fullCommit(input.repoRoot, input.sourceA3)
  if (
    repairStartHead3 !== V138_PLAN_262_21_REPAIR_START ||
    sourceBase3 !== V138_PLAN_262_21_SOURCE_BASE
  ) fail("V138_SOURCE_A3_BASE_INVALID")
  requireAncestor(input.repoRoot, repairStartHead3, sourceBase3,
    "V138_SOURCE_A3_REPAIR_START_NOT_ANCESTOR")
  requireAncestor(input.repoRoot, sourceBase3, sourceA3,
    "V138_SOURCE_BASE3_NOT_ANCESTOR")
  requireAncestor(input.repoRoot, V138_REVIEWED_SOURCE_A2, sourceA3,
    "V138_SOURCE_A2_NOT_ANCESTOR_OF_A3")
  requireAncestor(input.repoRoot, V138_REVIEWED_SOURCE_B2, sourceA3,
    "V138_SOURCE_B2_NOT_ANCESTOR_OF_A3")
  const changed = sorted(gitText(input.repoRoot, [
    "diff", "--name-only", "--no-renames", sourceBase3, sourceA3, "--",
  ]).split("\n").filter(Boolean).map(normalize))
  if (
    changed.length === 0 ||
    changed.some((repoPath) =>
      !V138_SUCCESSOR_AUTHORIZED_SOURCE_PATHS_V3.includes(repoPath as never))
  ) fail("V138_SOURCE_A3_AGGREGATE_DELTA_INVALID")
  const record = (commit: string) => {
    const [oid, tree, parents = ""] = gitText(input.repoRoot, [
      "show", "-s", "--format=%H%n%T%n%P", commit,
    ]).split("\n")
    return Object.freeze({
      commit: oid!, tree: tree!,
      parents: Object.freeze(parents.split(" ").filter(Boolean)),
      changedPaths: Object.freeze(sorted(gitText(input.repoRoot, [
        "diff-tree", "--root", "--no-commit-id", "--name-only", "-r",
        "--no-renames", commit,
      ]).split("\n").filter(Boolean).map(normalize))),
    })
  }
  const lineage = gitText(input.repoRoot, [
    "rev-list", "--reverse", "--topo-order", `${sourceBase3}..${sourceA3}`,
  ]).split("\n").filter(Boolean).map(record)
  if (
    lineage.length === 0 || lineage.some((entry) =>
      entry.changedPaths.length === 0 || entry.changedPaths.some((repoPath) =>
        !V138_SUCCESSOR_AUTHORIZED_SOURCE_PATHS_V3.includes(repoPath as never)))
  ) fail("V138_SOURCE_A3_LINEAGE_PATH_INVALID")
  const sourceRecord = record(sourceA3)
  const body = {
    schemaVersion: "v1.38-source-a3-custody-v1" as const,
    repairStartHead3, sourceBase3, sourceA3,
    sourceA3Tree: sourceRecord.tree,
    sourceA3Parents: sourceRecord.parents,
    aggregateChangedPaths: Object.freeze(changed),
    lineage: Object.freeze(lineage),
    sourceBlobs: Object.freeze(V138_SUCCESSOR_AUTHORIZED_SOURCE_PATHS_V3.map(
      (repoPath) => blobRecord(input.repoRoot, sourceA3, repoPath),
    )),
  }
  return Object.freeze({ ...body, custodyRoot: identityRoot(
    "containmentPolicy", body.schemaVersion, body,
  ) })
}

const reviewMetadataV3 = (repoRoot: string, sourceA3: string) => {
  const bytes = regularFile(path.resolve(
    repoRoot, V138_PLAN_262_21_CANONICAL_PATHS.review,
  ), "required")!
  const values = frontmatterScalars(bytes, "V138_PLAN_262_21_REVIEW_INVALID")
  const paths = frontmatterList(bytes, "files_reviewed_list",
    "V138_PLAN_262_21_REVIEW_INVALID")
  if (
    values.get("plan") !== "21" || values.get("depth") !== "deep" ||
    values.get("status") !== "clean" || values.get("files_reviewed") !== "3" ||
    values.get("findings.critical") !== "0" ||
    values.get("findings.warning") !== "0" ||
    values.get("findings.info") !== "0" ||
    values.get("findings.total") !== "0" ||
    values.get("repair_start_head3") !== V138_PLAN_262_21_REPAIR_START ||
    values.get("source_base3") !== V138_PLAN_262_21_SOURCE_BASE ||
    values.get("source_a3") !== sourceA3 ||
    canonical(sorted(paths)) !==
      canonical(sorted(V138_SUCCESSOR_AUTHORIZED_SOURCE_PATHS_V3))
  ) fail("V138_PLAN_262_21_REVIEW_NOT_CLEAN")
  const fixesApplied = values.get("fixes_applied")
  if (fixesApplied !== "true" && fixesApplied !== "false") {
    fail("V138_PLAN_262_21_REVIEW_NOT_CLEAN")
  }
  const fix = regularFile(path.resolve(
    repoRoot, V138_PLAN_262_21_CANONICAL_PATHS.reviewFix,
  ), fixesApplied === "true" ? "required" : "absent")
  if (fix !== undefined) {
    const fixValues = frontmatterScalars(fix,
      "V138_PLAN_262_21_REVIEW_FIX_INVALID")
    if (fixValues.get("status") !== "all_fixed" ||
      fixValues.get("skipped") !== "0" ||
      fixValues.get("final_source_a3") !== sourceA3) {
      fail("V138_PLAN_262_21_REVIEW_FIX_INVALID")
    }
  }
  return Object.freeze({ bytes, fix, fixesApplied: fixesApplied === "true" })
}

export const deriveV138ProtectedHistoryV3 = (
  repoRoot: string,
  sourceA3Input: string,
) => {
  const sourceA3 = fullCommit(repoRoot, sourceA3Input)
  requireAncestor(repoRoot, V138_REVIEWED_SOURCE_A2, V138_REVIEWED_SOURCE_B2,
    "V138_A2_B2_ANCESTRY_INVALID")
  requireAncestor(repoRoot, V138_REVIEWED_SOURCE_B2, sourceA3,
    "V138_B2_A3_ANCESTRY_INVALID")
  const parsed = Object.fromEntries(V138_V6_HISTORY_PATHS.map((repoPath) => [
    repoPath, parseCommitJson(repoRoot, sourceA3, repoPath),
  ]))
  const rootAt = (repoPath: string, key: string): unknown => parsed[repoPath]?.[key]
  if (
    rootAt(V138_PLAN_262_18_CANONICAL_PATHS.authorization, "authorizationRoot") !== V138_V6_ROOTS.authorizationRoot ||
    rootAt(V138_PLAN_262_18_CANONICAL_PATHS.seal, "sealRoot") !== V138_V6_ROOTS.sealRoot ||
    rootAt(V138_PLAN_262_19_FRESH_DESTINATIONS[0], "receiptRoot") !== V138_V6_ROOTS.contextRoot ||
    rootAt(V138_PLAN_262_19_FRESH_DESTINATIONS[1], "receiptRoot") !== V138_V6_ROOTS.preflightRoot ||
    rootAt(V138_PLAN_262_19_FRESH_DESTINATIONS[5], "markerRoot") !== V138_V6_ROOTS.preflightConsumptionRoot ||
    rootAt(V138_PLAN_262_19_FRESH_DESTINATIONS[2], "receiptRoot") !== V138_V6_ROOTS.calibrationRoot ||
    rootAt(V138_PLAN_262_19_FRESH_DESTINATIONS[6], "markerRoot") !== V138_V6_ROOTS.calibrationConsumptionRoot ||
    rootAt(V138_PLAN_262_19_FRESH_DESTINATIONS[4], "terminalRoot") !== V138_V6_ROOTS.terminalRoot
  ) fail("V138_PROTECTED_HISTORY_V3_ROOT_INVALID")
  const calibration = parsed[V138_PLAN_262_19_FRESH_DESTINATIONS[2]]!
  if (!Array.isArray(calibration.chargedAttempts)) {
    fail("V138_PROTECTED_HISTORY_V3_CHARGES_INVALID")
  }
  const v6Charges = (calibration.chargedAttempts as unknown[]).map((entry) =>
    isRecord(entry) ? entry.publicAttemptId : null)
  const expectedV6 = Array.from({ length: 8 }, (_, i) => `calibration:v6:${i}`)
  if (canonical(v6Charges) !== canonical(expectedV6)) {
    fail("V138_PROTECTED_HISTORY_V3_CHARGES_INVALID")
  }
  requireAbsentAtCommit(repoRoot, sourceA3, V138_V6_REPRODUCTION,
    "V138_PROTECTED_HISTORY_V3_REPRODUCTION_PRESENT")
  requireAbsentAtCommit(repoRoot, sourceA3, V138_V6_REPRODUCTION_MARKER,
    "V138_PROTECTED_HISTORY_V3_REPRODUCTION_MARKER_PRESENT")
  const body = {
    schemaVersion: "v1.38-protected-stopped-history-v3" as const,
    sourceA2: V138_REVIEWED_SOURCE_A2,
    sourceB2: V138_REVIEWED_SOURCE_B2,
    v6Roots: V138_V6_ROOTS,
    artifacts: Object.freeze(V138_V6_HISTORY_PATHS.map((repoPath) =>
      blobRecord(repoRoot, sourceA3, repoPath))),
    cumulativeChargedPublicAttemptIds: Object.freeze([
      ...V138_PLAN_262_16_CHARGED_PUBLIC_IDS, ...expectedV6,
    ]),
    reproductionV7Absent: true as const,
    reproductionV7ConsumptionMarkerAbsent: true as const,
    acceptedEvidenceCount: 0 as const,
  }
  return Object.freeze({ ...body, protectedHistoryRoot: identityRoot(
    "evidenceBundle", body.schemaVersion, body,
  ) })
}

const plan26221Destinations = () => Object.freeze([
  V138_PLAN_262_21_CANONICAL_PATHS.authorization,
  V138_PLAN_262_21_CANONICAL_PATHS.seal,
  ...V138_PLAN_262_22_FRESH_DESTINATIONS,
])

export const v138Plan26221AuthorizationLiteral = (
  repoRoot: string,
  sourceA3Input: string,
): string => {
  const sourceA3 = fullCommit(repoRoot, sourceA3Input)
  reviewMetadataV3(repoRoot, sourceA3)
  const custody = inspectSourceCustodyA3({ repoRoot,
    repairStartHead3: V138_PLAN_262_21_REPAIR_START,
    sourceBase3: V138_PLAN_262_21_SOURCE_BASE, sourceA3 })
  const closure = deriveSelectedRouteClosureAtCommit(repoRoot, sourceA3)
  const history = deriveV138ProtectedHistoryV3(repoRoot, sourceA3)
  return `Authorize Phase 262 Plans 262-21 and 262-22 over independently reviewed source commit ${sourceA3} (tree ${custody.sourceA3Tree}; parents ${custody.sourceA3Parents.join(",")}; sourceBase3 ${custody.sourceBase3}; custody ${custody.custodyRoot}; selected-route ${closure.closureRoot}) as roryquinlan-repository-operator for route ordinal 3: exactly one separately committed direct-child successor-source seal B3, exactly one Pattern C main-orchestrator execution-context:v7, exactly one darwin-memorystatus-effective-available-basis-points-v1 headroom-preflight:v7 at the unchanged inclusive 2,500-basis-point threshold, exactly one calibration:v7 eight-attempt/four-shard allocation, and—only if calibration:v7 is admitted—at most one fresh reproduction:v8 540-cell run. This authority binds canonical destinations ${plan26221Destinations().join(",")}; archived A2 ${V138_REVIEWED_SOURCE_A2}, archived B2 ${V138_REVIEWED_SOURCE_B2}, protected v6 roots ${canonical(V138_V6_ROOTS)}, protected history ${history.protectedHistoryRoot}, and cumulative charged identities ${history.cumulativeChargedPublicAttemptIds.join(",")}; reproduction:v7 and its consumption marker remain absent. Every frozen policy, resource, lineage, accounting, runtime, semantic, privacy, gameplay, and formation-absence bound remains unchanged. This authorization grants no authority to mutate, replace, delete, reinterpret, retry, reuse, or consume any v5/v6 artifact or prior authorization bytes, and grants no execution before B3 is checked. It is single-use, has no retry, and expires at the first seal refusal or failure or any Plan 262-22 terminal outcome.`
}

const deriveAuthorizationV3 = (
  repoRoot: string, sourceA3: string, literalBytes: Uint8Array,
) => {
  const literal = Buffer.from(v138Plan26221AuthorizationLiteral(
    repoRoot, sourceA3,
  ), "utf8")
  if (!literal.equals(Buffer.from(literalBytes))) {
    fail("V138_PLAN_262_21_AUTHORIZATION_LITERAL_INVALID")
  }
  const sourceCustody = inspectSourceCustodyA3({ repoRoot,
    repairStartHead3: V138_PLAN_262_21_REPAIR_START,
    sourceBase3: V138_PLAN_262_21_SOURCE_BASE, sourceA3 })
  const history = deriveV138ProtectedHistoryV3(repoRoot, sourceA3)
  const body = {
    schemaVersion: V138_PLAN_262_21_AUTHORIZATION_SCHEMA,
    routeOrdinal: 3 as const,
    operator: V138_PLAN_262_15_OPERATOR,
    sourceCustody,
    selectedRouteClosureRoot:
      deriveSelectedRouteClosureAtCommit(repoRoot, sourceA3).closureRoot,
    protectedHistoryRoot: history.protectedHistoryRoot,
    sourceA2: V138_REVIEWED_SOURCE_A2,
    sourceB2: V138_REVIEWED_SOURCE_B2,
    v6Roots: V138_V6_ROOTS,
    cumulativeChargedPublicAttemptIds: history.cumulativeChargedPublicAttemptIds,
    reproductionV7Absent: true as const,
    reproductionV7ConsumptionMarkerAbsent: true as const,
    canonicalDestinations: plan26221Destinations(),
    frozenPolicyRoot: frozenPolicyRootV2(),
    literalSha256: sha256(literalBytes),
    sealCount: 1 as const, contextCount: 1 as const, preflightCount: 1 as const,
    calibrationAllocationCount: 1 as const, calibrationAttemptCount: 8 as const,
    calibrationShardCount: 4 as const, reproductionMaximumCount: 1 as const,
    reproductionCellCount: 540 as const, singleUse: true as const,
    noRetry: true as const, noPriorAuthorityReuse: true as const,
    noExecutionBeforeCheckedB3: true as const,
    expiresAt: "first_seal_refusal_failure_or_plan_262_22_terminal" as const,
  }
  return Object.freeze({ ...body, authorizationRoot: identityRoot(
    "evidenceBundle", V138_PLAN_262_21_AUTHORIZATION_SCHEMA, body,
  ) })
}

export const buildV138Plan26221AuthorizationV3 = (
  repoRoot: string, sourceA3: string, literalBytes: Uint8Array,
) => {
  regularFile(path.resolve(repoRoot,
    V138_PLAN_262_21_CANONICAL_PATHS.authorization), "absent")
  regularFile(path.resolve(repoRoot,
    V138_PLAN_262_21_CANONICAL_PATHS.seal), "absent")
  for (const repoPath of V138_PLAN_262_22_FRESH_DESTINATIONS) {
    regularFile(path.resolve(repoRoot, repoPath), "absent")
  }
  return deriveAuthorizationV3(repoRoot, fullCommit(repoRoot, sourceA3),
    literalBytes)
}

export const checkV138Plan26221AuthorizationV3 = (
  repoRoot: string, value: unknown, literalBytes?: Uint8Array,
) => {
  if (!isRecord(value) || value.schemaVersion !==
    V138_PLAN_262_21_AUTHORIZATION_SCHEMA || !isRecord(value.sourceCustody) ||
    typeof value.sourceCustody.sourceA3 !== "string") {
    fail("V138_PLAN_262_21_AUTHORIZATION_SCHEMA_INVALID")
  }
  const sourceA3 = (value as { sourceCustody: { sourceA3: string } })
    .sourceCustody.sourceA3
  const bytes = literalBytes ?? Buffer.from(v138Plan26221AuthorizationLiteral(
    repoRoot, sourceA3,
  ), "utf8")
  const expected = deriveAuthorizationV3(repoRoot,
    sourceA3, bytes)
  if (canonical(value) !== canonical(expected)) {
    fail("V138_PLAN_262_21_AUTHORIZATION_INVALID")
  }
  return expected
}

const reviewRootsV3 = (repoRoot: string, sourceA3: string) => {
  const review = reviewMetadataV3(repoRoot, sourceA3)
  return Object.freeze([
    Object.freeze({ path: V138_PLAN_262_21_CANONICAL_PATHS.review,
      sha256: sha256(review.bytes) }),
    ...(review.fix === undefined ? [] : [Object.freeze({
      path: V138_PLAN_262_21_CANONICAL_PATHS.reviewFix,
      sha256: sha256(review.fix),
    })]),
  ])
}

export const buildV138SuccessorSourceSealV3 = (input: {
  readonly repoRoot: string
  readonly authorization: unknown
}) => {
  const authorization = checkV138Plan26221AuthorizationV3(
    input.repoRoot, input.authorization,
  )
  const sourceA3 = authorization.sourceCustody.sourceA3
  const body = {
    schemaVersion: V138_SUCCESSOR_SOURCE_SEAL_V3_SCHEMA,
    sealOrdinal: 3 as const,
    canonicalizationId: "canonical-json-v1.1" as const,
    sourceCustody: authorization.sourceCustody,
    selectedRouteClosure: deriveSelectedRouteClosureAtCommit(
      input.repoRoot, sourceA3,
    ),
    reviewRoots: reviewRootsV3(input.repoRoot, sourceA3),
    protectedHistory: deriveV138ProtectedHistoryV3(input.repoRoot, sourceA3),
    frozenPolicy: deriveFrozenPolicy(), toolIdentity: deriveToolIdentity(),
    hostIdentity: deriveHostIdentity(),
    formationAbsence: deriveFormationAbsence(input.repoRoot, sourceA3),
    replacementMetricContract: deriveReplacementMetricContract(
      input.repoRoot, sourceA3,
    ),
    canonicalDestinations: authorization.canonicalDestinations,
    authorizationRoot: authorization.authorizationRoot,
  }
  return Object.freeze({ ...body, sealRoot: identityRoot(
    "containmentPolicy", V138_SUCCESSOR_SOURCE_SEAL_V3_SCHEMA, body,
  ) })
}

export const checkV138SealedWorktreeAtA3 = (
  repoRoot: string,
  seal: ReturnType<typeof buildV138SuccessorSourceSealV3>,
): true => {
  const sourceA3 = seal.sourceCustody.sourceA3
  const records = [
    ...seal.sourceCustody.sourceBlobs,
    ...seal.protectedHistory.artifacts,
    ...seal.selectedRouteClosure.sourceBlobs,
    ...seal.selectedRouteClosure.resolverMetadata,
  ]
  const seen = new Map<string, Sha256>()
  for (const record of records) {
    const prior = seen.get(record.path)
    if (prior !== undefined && prior !== record.sha256) {
      fail("V138_SEALED_WORKTREE_V3_IDENTITY_CONFLICT")
    }
    seen.set(record.path, record.sha256)
  }
  for (const [repoPath, expectedRoot] of seen) {
    const working = regularFile(path.resolve(repoRoot, repoPath), "required")!
    const committed = readCommitFile(repoRoot, sourceA3, repoPath)
    if (
      sha256(working) !== expectedRoot ||
      sha256(committed) !== expectedRoot ||
      !working.equals(committed)
    ) fail("V138_SEALED_WORKTREE_V3_DRIFT")
  }
  requireAbsentAtCommit(repoRoot, sourceA3, V138_V6_REPRODUCTION,
    "V138_PROTECTED_HISTORY_V3_REPRODUCTION_PRESENT")
  requireAbsentAtCommit(repoRoot, sourceA3, V138_V6_REPRODUCTION_MARKER,
    "V138_PROTECTED_HISTORY_V3_REPRODUCTION_MARKER_PRESENT")
  regularFile(path.resolve(repoRoot, V138_V6_REPRODUCTION), "absent")
  regularFile(path.resolve(repoRoot, V138_V6_REPRODUCTION_MARKER), "absent")
  return true
}

export const checkV138SuccessorSourceSealV3 = (
  repoRoot: string, value: unknown, authorizationValue: unknown,
) => {
  if (!isRecord(value) || value.schemaVersion !==
    V138_SUCCESSOR_SOURCE_SEAL_V3_SCHEMA) {
    fail("V138_SUCCESSOR_SEAL_V3_SCHEMA_INVALID")
  }
  const expected = buildV138SuccessorSourceSealV3({
    repoRoot, authorization: authorizationValue,
  })
  if (canonical(value) !== canonical(expected)) {
    fail("V138_SUCCESSOR_SEAL_V3_INVALID")
  }
  return expected
}

export const writeV138Plan26221AuthorizationV3 = (
  repoRoot: string, targetPath: string, sourceA3: string,
  literalBytes: Uint8Array,
) => {
  const target = canonicalPath(repoRoot, targetPath,
    V138_PLAN_262_21_CANONICAL_PATHS.authorization)
  const value = buildV138Plan26221AuthorizationV3(
    repoRoot, sourceA3, literalBytes,
  )
  writeV138CanonicalExclusiveV2(repoRoot, target, value)
  return value
}

export const writeV138SuccessorSourceSealV3 = (
  repoRoot: string, targetPath: string, authorization: unknown,
) => {
  const target = canonicalPath(repoRoot, targetPath,
    V138_PLAN_262_21_CANONICAL_PATHS.seal)
  regularFile(target, "absent")
  const value = buildV138SuccessorSourceSealV3({ repoRoot, authorization })
  writeV138CanonicalExclusiveV2(repoRoot, target, value)
  return value
}

export const checkV138SuccessorSealCommitV3 = (input: {
  readonly repoRoot: string
  readonly sourceA3: string
  readonly sourceB3: string
}) => {
  const sourceA3 = fullCommit(input.repoRoot, input.sourceA3)
  const sourceB3 = fullCommit(input.repoRoot, input.sourceB3)
  const parents = gitText(input.repoRoot, ["rev-list", "--parents", "-n", "1",
    sourceB3]).split(" ")
  if (parents.length !== 2 || parents[1] !== sourceA3) {
    fail("V138_SUCCESSOR_SEAL_B3_PARENT_INVALID")
  }
  const paths = sorted(gitText(input.repoRoot, ["diff-tree", "--no-commit-id",
    "--name-only", "-r", "--no-renames", sourceB3]).split("\n")
    .filter(Boolean).map(normalize))
  const expected = sorted([V138_PLAN_262_21_CANONICAL_PATHS.authorization,
    V138_PLAN_262_21_CANONICAL_PATHS.seal])
  if (canonical(paths) !== canonical(expected)) {
    fail("V138_SUCCESSOR_SEAL_B3_DELTA_INVALID")
  }
  for (const repoPath of expected) {
    requireAbsentAtCommit(input.repoRoot, sourceA3, repoPath,
      "V138_SUCCESSOR_SEAL_V3_EXISTED_AT_A3")
    if (!regularFile(path.resolve(input.repoRoot, repoPath), "required")!
      .equals(readCommitFile(input.repoRoot, sourceB3, repoPath))) {
      fail("V138_SUCCESSOR_SEAL_B3_WORKTREE_DRIFT")
    }
  }
  const authorization = checkV138Plan26221AuthorizationV3(input.repoRoot,
    JSON.parse(readCommitFile(input.repoRoot, sourceB3, expected[0]!).toString("utf8")))
  const seal = checkV138SuccessorSourceSealV3(input.repoRoot,
    JSON.parse(readCommitFile(input.repoRoot, sourceB3, expected[1]!).toString("utf8")),
    authorization)
  const body = { schemaVersion: "v1.38-source-b3-custody-v1" as const,
    sourceA3, sourceB3,
    sourceB3Tree: gitText(input.repoRoot, ["rev-parse", `${sourceB3}^{tree}`]),
    sourceB3Parent: sourceA3, changedPaths: Object.freeze(paths),
    blobs: Object.freeze(expected.map((repoPath) =>
      blobRecord(input.repoRoot, sourceB3, repoPath))),
    authorizationRoot: authorization.authorizationRoot,
    sealRoot: seal.sealRoot,
  }
  return Object.freeze({ ...body, custodyRoot: identityRoot(
    "containmentPolicy", body.schemaVersion, body,
  ) })
}

type V138Route3Role = "AUTHORIZATION" | "SEAL" | "CONTEXT" | "PREFLIGHT" | "CALIBRATION" |
  "REPRODUCTION" | "TERMINAL" | "PREFLIGHT_MARKER" |
  "CALIBRATION_MARKER" | "REPRODUCTION_MARKER"

const route3FileCodes = (
  role: V138Route3Role,
): V138ScopedFileCodes => Object.freeze({
  required: `V138_ROUTE_3_${role}_REQUIRED`,
  absent: `V138_ROUTE_3_${role}_MUST_BE_ABSENT`,
  invalid: `V138_ROUTE_3_${role}_INVALID`,
})

const parseRoute3Json = (
  bytes: Buffer,
  role: V138Route3Role,
): Record<string, unknown> => {
  try {
    const value: unknown = JSON.parse(bytes.toString("utf8"))
    if (!isRecord(value)) fail(`V138_ROUTE_3_${role}_INVALID`)
    return value
  } catch (error) {
    if (error instanceof TypeError && error.message.startsWith("V138_")) {
      throw error
    }
    return fail(`V138_ROUTE_3_${role}_INVALID`)
  }
}

const route3Root = (
  value: Record<string, unknown>,
  schemaVersion: string,
  rootKey: "receiptRoot" | "markerRoot" | "terminalRoot",
  role: V138Route3Role,
): Sha256 => {
  if (value.schemaVersion !== schemaVersion ||
    typeof value[rootKey] !== "string") {
    fail(`V138_ROUTE_3_${role}_GENERATION_INVALID`)
  }
  const { [rootKey]: root, ...body } = value
  const domain = rootKey === "terminalRoot" || role === "PREFLIGHT"
    ? "canonicalJsonProfile"
    : "evidenceBundle"
  if (root !== identityRoot(domain, schemaVersion, body)) {
    fail(`V138_ROUTE_3_${role}_ROOT_INVALID`)
  }
  return root as Sha256
}

type V138Plan26222AuthoritativeBranchChecker = (
  repoRoot: string,
  sourceA3: string,
  sourceB3: string,
  sealedRoute: Readonly<Record<string, unknown>>,
) => Readonly<Record<string, unknown>>

let authoritativePlan26222BranchChecker:
  V138Plan26222AuthoritativeBranchChecker | undefined

export const registerV138Plan26222AuthoritativeBranchChecker = (
  checker: V138Plan26222AuthoritativeBranchChecker,
): void => {
  authoritativePlan26222BranchChecker = checker
}

export const checkV138Plan26221AuthorizationV3PostLive = (input: {
  readonly repoRoot: string
  readonly sourceA3: string
  readonly sourceB3: string
}) => {
  const terminalPath = V138_PLAN_262_22_FRESH_DESTINATIONS[4]
  // The terminal discriminator is intentionally the first artifact read.
  const terminal = parseRoute3Json(regularFileScoped(
    path.resolve(input.repoRoot, terminalPath),
    "required",
    route3FileCodes("TERMINAL"),
  )!, "TERMINAL")
  const terminalRoot = route3Root(terminal,
    "v1.38-plan-262-22-terminal-v1", "terminalRoot", "TERMINAL")
  const dispositions = ["tool_identity_failed", "protected_history_failed",
    "formation_absence_failed", "pattern_c_ownership_failed",
    "fresh_destination_failed", "consumed_stage_interrupted",
    "preflight_unavailable", "preflight_refused", "calibration_stopped",
    "reproduction_stopped", "reproduction_passed"] as const
  if (typeof terminal.disposition !== "string" ||
    !dispositions.includes(terminal.disposition as never) ||
    terminal.sourceA3 !== input.sourceA3 ||
    terminal.sourceB3 !== input.sourceB3 ||
    terminal.authorityExpired !== true || terminal.noRetry !== true ||
    !isRecord(terminal.artifactRoots) ||
    !isRecord(terminal.consumptionMarkerRoots)) {
    fail("V138_ROUTE_3_TERMINAL_JOIN_INVALID")
  }

  const authorizationBytes = regularFileScoped(path.resolve(input.repoRoot,
    V138_PLAN_262_21_CANONICAL_PATHS.authorization), "required",
  route3FileCodes("AUTHORIZATION"))!
  const sealBytes = regularFileScoped(path.resolve(input.repoRoot,
    V138_PLAN_262_21_CANONICAL_PATHS.seal), "required",
  route3FileCodes("SEAL"))!
  const authorization = parseRoute3Json(authorizationBytes, "AUTHORIZATION")
  const seal = parseRoute3Json(sealBytes, "SEAL")
  const sourceCustody = isRecord(authorization.sourceCustody)
    ? authorization.sourceCustody : undefined
  const authorizationBody = { ...authorization }
  delete authorizationBody.authorizationRoot
  const sealBody = { ...seal }
  delete sealBody.sealRoot
  if (authorization.schemaVersion !== V138_PLAN_262_21_AUTHORIZATION_SCHEMA ||
    authorization.routeOrdinal !== 3 || sourceCustody === undefined ||
    sourceCustody.sourceA3 !== input.sourceA3 ||
    authorization.authorizationRoot !== identityRoot("evidenceBundle",
      V138_PLAN_262_21_AUTHORIZATION_SCHEMA, authorizationBody) ||
    seal.schemaVersion !== V138_SUCCESSOR_SOURCE_SEAL_V3_SCHEMA ||
    seal.authorizationRoot !== authorization.authorizationRoot ||
    !isRecord(seal.sourceCustody) ||
    seal.sourceCustody.sourceA3 !== input.sourceA3 ||
    seal.sealRoot !== identityRoot("containmentPolicy",
      V138_SUCCESSOR_SOURCE_SEAL_V3_SCHEMA, sealBody)) {
    fail("V138_ROUTE_3_AUTHORITY_BYTES_INVALID")
  }
  const parents = gitText(input.repoRoot, ["rev-list", "--parents", "-n", "1",
    input.sourceB3]).split(" ")
  const changedPaths = sorted(gitText(input.repoRoot, ["diff-tree",
    "--no-commit-id", "--name-only", "-r", "--no-renames", input.sourceB3,
  ]).split("\n").filter(Boolean).map(normalize))
  const sealedPaths = sorted([V138_PLAN_262_21_CANONICAL_PATHS.authorization,
    V138_PLAN_262_21_CANONICAL_PATHS.seal])
  if (parents.length !== 2 || parents[1] !== input.sourceA3 ||
    canonical(changedPaths) !== canonical(sealedPaths)) {
    fail("V138_ROUTE_3_B3_CUSTODY_INVALID")
  }
  for (const repoPath of sealedPaths) {
    if (!regularFileScoped(path.resolve(input.repoRoot, repoPath), "required",
      route3FileCodes("TERMINAL"))!.equals(readCommitFile(input.repoRoot,
      input.sourceB3, repoPath))) fail("V138_ROUTE_3_B3_BLOB_INVALID")
  }
  requireAncestor(input.repoRoot, V138_REVIEWED_SOURCE_A2,
    V138_REVIEWED_SOURCE_B2, "V138_ROUTE_3_A2_B2_ANCESTRY_INVALID")
  requireAncestor(input.repoRoot, V138_REVIEWED_SOURCE_B2, input.sourceA3,
    "V138_ROUTE_3_B2_A3_ANCESTRY_INVALID")
  if (authorization.sourceA2 !== V138_REVIEWED_SOURCE_A2 ||
    authorization.sourceB2 !== V138_REVIEWED_SOURCE_B2 ||
    !Array.isArray(authorization.cumulativeChargedPublicAttemptIds) ||
    canonical(authorization.cumulativeChargedPublicAttemptIds) !== canonical([
      ...V138_PLAN_262_16_CHARGED_PUBLIC_IDS,
      ...Array.from({ length: 8 }, (_, index) => `calibration:v6:${index}`),
    ]) || terminal.authorizationRoot !== authorization.authorizationRoot ||
    terminal.sealRoot !== seal.sealRoot) {
    fail("V138_ROUTE_3_TERMINAL_AUTHORITY_JOIN_INVALID")
  }
  const custodyBody = { schemaVersion: "v1.38-source-b3-custody-v1" as const,
    sourceA3: input.sourceA3, sourceB3: input.sourceB3,
    sourceB3Tree: gitText(input.repoRoot, ["rev-parse",
      `${input.sourceB3}^{tree}`]), sourceB3Parent: input.sourceA3,
    changedPaths: Object.freeze(changedPaths),
    blobs: Object.freeze(sealedPaths.map((repoPath) =>
      blobRecord(input.repoRoot, input.sourceB3, repoPath))),
    authorizationRoot: authorization.authorizationRoot as Sha256,
    sealRoot: seal.sealRoot as Sha256 }
  const custody = Object.freeze({ ...custodyBody, custodyRoot: identityRoot(
    "containmentPolicy", custodyBody.schemaVersion, custodyBody) })

  const artifactRoots = terminal.artifactRoots
  const markerRoots = terminal.consumptionMarkerRoots
  const rows = [
    { index: 0, role: "CONTEXT" as const, root: artifactRoots.context,
      schema: "v1.38-current-matrix-execution-context-v7", key: "receiptRoot" as const },
    { index: 1, role: "PREFLIGHT" as const, root: artifactRoots.preflight,
      schema: "v1.38-current-matrix-headroom-preflight-v7", key: "receiptRoot" as const },
    { index: 2, role: "CALIBRATION" as const, root: artifactRoots.calibration,
      schema: "v1.38-current-matrix-calibration-v7", key: "receiptRoot" as const },
    { index: 3, role: "REPRODUCTION" as const, root: artifactRoots.reproduction,
      schema: "v1.38-current-matrix-reproduction-v8", key: "receiptRoot" as const },
    { index: 5, role: "PREFLIGHT_MARKER" as const,
      root: markerRoots.preflight,
      schema: "v1.38-plan-262-22-consumption-v1", key: "markerRoot" as const },
    { index: 6, role: "CALIBRATION_MARKER" as const,
      root: markerRoots.calibration,
      schema: "v1.38-plan-262-22-consumption-v1", key: "markerRoot" as const },
    { index: 7, role: "REPRODUCTION_MARKER" as const,
      root: markerRoots.reproduction,
      schema: "v1.38-plan-262-22-consumption-v1", key: "markerRoot" as const },
  ]
  const parsed = new Map<string, Record<string, unknown>>()
  for (const row of rows) {
    if (row.root !== null && typeof row.root !== "string") {
      fail(`V138_ROUTE_3_${row.role}_ROOT_INVALID`)
    }
    const expectation = row.root === null ? "absent" : "required"
    const bytes = regularFileScoped(path.resolve(input.repoRoot,
      V138_PLAN_262_22_FRESH_DESTINATIONS[row.index]!), expectation,
    route3FileCodes(row.role))
    if (bytes === undefined) continue
    const value = parseRoute3Json(bytes, row.role)
    if (value.sourceA3 !== input.sourceA3 ||
      value.sourceB3 !== input.sourceB3) {
      fail(`V138_ROUTE_3_${row.role}_SOURCE_JOIN_INVALID`)
    }
    if (route3Root(value, row.schema, row.key, row.role) !== row.root) {
      fail(`V138_ROUTE_3_${row.role}_TERMINAL_ROOT_MISMATCH`)
    }
    parsed.set(row.role, value)
  }
  // Semantic authority belongs to the current-matrix implementation. The
  // scoped reads above deliberately run first so missing/replaced paths keep
  // route-local error codes; this final call enforces every receipt, marker,
  // disposition, root, cleanup, charge, privacy, and custody join.
  if (authoritativePlan26222BranchChecker === undefined) {
    fail("V138_ROUTE_3_AUTHORITATIVE_CHECKER_UNAVAILABLE")
  }
  const authoritative = authoritativePlan26222BranchChecker(input.repoRoot,
    input.sourceA3, input.sourceB3, Object.freeze({ custody, authorization,
      seal }))
  if (authoritative.terminalRoot !== terminalRoot ||
    authoritative.disposition !== terminal.disposition) {
    fail("V138_ROUTE_3_TERMINAL_AUTHORITY_JOIN_INVALID")
  }
  return Object.freeze({
    disposition: terminal.disposition,
    terminalRoot,
    chargedCalibrationAttemptCount: terminal.chargedCalibrationAttemptCount,
    chargedReproductionAttemptCount: terminal.chargedReproductionAttemptCount,
    acceptedCellCount: terminal.acceptedCellCount,
    custody,
  })
}

export interface V138Plan26215Terminal {
  readonly schemaVersion: "v1.38-plan-262-15-terminal-v1"
  readonly disposition: "seal_refused" | "seal_failed"
  readonly authorityExpired: true
  readonly acceptedCellCount: 0
  readonly terminalRoot: Sha256
}

export const writePlan26215Terminal = (
  repoRoot: string,
  targetPath: string,
  disposition: V138Plan26215Terminal["disposition"],
  paths: Readonly<{
    authorization: string
    seal: string
    terminal: string
    review: string
    reviewFix: string
  }>,
): Readonly<V138Plan26215Terminal> => {
  const target = canonicalPath(repoRoot, targetPath, CANONICAL_PATHS.terminal)
  const resolved = {
    authorization: canonicalPath(
      repoRoot,
      paths.authorization,
      CANONICAL_PATHS.authorization,
    ),
    seal: canonicalPath(repoRoot, paths.seal, CANONICAL_PATHS.seal),
    terminal: canonicalPath(repoRoot, paths.terminal, CANONICAL_PATHS.terminal),
    review: canonicalPath(repoRoot, paths.review, CANONICAL_PATHS.review),
    reviewFix: canonicalPath(
      repoRoot,
      paths.reviewFix,
      CANONICAL_PATHS.reviewFix,
    ),
  }
  regularFile(resolved.terminal, "absent")
  const reviewMetadata = strictReviewMetadata(
    regularFile(resolved.review, "required")!,
  )
  const reviewFix = regularFile(
    resolved.reviewFix,
    reviewMetadata.fixesApplied ? "required" : "optional",
  )
  if (reviewFix !== undefined) strictFixReportMetadata(reviewFix)
  const authorizationBytes = regularFile(
    resolved.authorization,
    disposition === "seal_failed" ? "required" : "absent",
  )
  regularFile(resolved.seal, "absent")
  if (authorizationBytes !== undefined) {
    checkV138Plan26215Authorization(
      repoRoot,
      JSON.parse(authorizationBytes.toString("utf8")),
    )
  }
  const body = {
    schemaVersion: "v1.38-plan-262-15-terminal-v1" as const,
    disposition,
    authorityExpired: true as const,
    acceptedCellCount: 0 as const,
  }
  const terminal = Object.freeze({
    ...body,
    terminalRoot: identityRoot(
      "canonicalJsonProfile",
      "v1.38-plan-262-15-terminal-v1",
      body,
    ),
  })
  writeCanonicalExclusive(repoRoot, target, terminal)
  return terminal
}

export const checkPlan26215ArtifactBranch = (
  repoRoot: string,
  paths: Readonly<{
    authorization: string
    seal: string
    terminal: string
    review: string
    reviewFix: string
  }>,
): V138Plan26215Disposition => {
  const resolved = {
    authorization: canonicalPath(
      repoRoot,
      paths.authorization,
      CANONICAL_PATHS.authorization,
    ),
    seal: canonicalPath(repoRoot, paths.seal, CANONICAL_PATHS.seal),
    terminal: canonicalPath(repoRoot, paths.terminal, CANONICAL_PATHS.terminal),
    review: canonicalPath(repoRoot, paths.review, CANONICAL_PATHS.review),
    reviewFix: canonicalPath(
      repoRoot,
      paths.reviewFix,
      CANONICAL_PATHS.reviewFix,
    ),
  }
  // The discriminator is intentionally the first artifact read.
  const terminalBytes = regularFile(resolved.terminal, "optional")
  let disposition: V138Plan26215Disposition = "sealed"
  if (terminalBytes !== undefined) {
    let terminal: unknown
    try {
      terminal = JSON.parse(terminalBytes.toString("utf8"))
    } catch {
      fail("V138_PLAN_262_15_TERMINAL_INVALID")
    }
    if (
      terminal === null ||
      typeof terminal !== "object" ||
      Array.isArray(terminal)
    ) {
      fail("V138_PLAN_262_15_TERMINAL_INVALID")
    }
    const candidate = terminal as Record<string, unknown>
    if (
      !exactKeys(candidate, [
        "schemaVersion",
        "disposition",
        "authorityExpired",
        "acceptedCellCount",
        "terminalRoot",
      ]) ||
      candidate.schemaVersion !== "v1.38-plan-262-15-terminal-v1" ||
      (candidate.disposition !== "seal_refused" &&
        candidate.disposition !== "seal_failed") ||
      candidate.authorityExpired !== true ||
      candidate.acceptedCellCount !== 0
    ) {
      fail("V138_PLAN_262_15_TERMINAL_INVALID")
    }
    const { terminalRoot, ...body } = candidate
    if (
      terminalRoot !==
      identityRoot(
        "canonicalJsonProfile",
        "v1.38-plan-262-15-terminal-v1",
        body,
      )
    ) {
      fail("V138_PLAN_262_15_TERMINAL_INVALID")
    }
    disposition = candidate.disposition as V138Plan26215Disposition
  }
  const reviewBytes = regularFile(resolved.review, "required")!
  const fixesRecorded = strictReviewMetadata(reviewBytes).fixesApplied
  const reviewFixBytes = regularFile(
    resolved.reviewFix,
    fixesRecorded ? "required" : "optional",
  )
  if (reviewFixBytes !== undefined) {
    strictFixReportMetadata(reviewFixBytes)
  }
  const authorizationBytes = regularFile(
    resolved.authorization,
    disposition !== "seal_refused" ? "required" : "absent",
  )
  const sealBytes = regularFile(
    resolved.seal,
    disposition === "sealed" ? "required" : "absent",
  )
  if (authorizationBytes !== undefined) {
    let authorization: unknown
    try {
      authorization = JSON.parse(authorizationBytes.toString("utf8"))
    } catch {
      fail("V138_AUTHORIZATION_SCHEMA_INVALID")
    }
    checkV138Plan26215Authorization(repoRoot, authorization)
    if (sealBytes !== undefined) {
      let seal: unknown
      try {
        seal = JSON.parse(sealBytes.toString("utf8"))
      } catch {
        fail("V138_SUCCESSOR_SEAL_SCHEMA_INVALID")
      }
      checkV138SuccessorSourceSeal(repoRoot, seal, authorization)
    }
  }
  return disposition
}

const runCli = async (): Promise<void> => {
  if (process.argv[1] !== fileURLToPath(import.meta.url)) return
  const repoRoot = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../..",
  )
  const args = process.argv.slice(2)
  if (/-v(?:7|8)$/u.test(args[0] ?? "") ||
    /authorization-v(?:7|8)|source-seal-v(?:7|8)/u.test(args[0] ?? "")) {
    fail("V138_PLAN_262_56_V7_V8_CLI_OBSOLETE")
  } else if (args[0] === "--render-plan-262-56-authorization-v9") {
    if (args.length !== 3 || args[1] !== "--review-input-absolute" ||
      !path.isAbsolute(args[2]!)) fail("V138_PLAN_262_56_AUTHORIZATION_V9_CLI_INVALID")
    const value = buildV138Plan26256AuthorizationV9({ repoRoot,
      reviewV3AbsolutePath: args[2]! })
    process.stdout.write(canonical(value))
  } else if (args[0] === "--write-plan-262-56-authorization-v9") {
    if (args.length !== 4 || args[2] !== "--review-input-absolute" ||
      !path.isAbsolute(args[3]!)) fail("V138_PLAN_262_56_AUTHORIZATION_V9_CLI_INVALID")
    writeV138Plan26256AuthorizationV9(repoRoot, args[1]!, args[3]!)
  } else if (args[0] === "--write-successor-source-seal-v9") {
    if (args.length !== 4 || args[2] !== "--authorization") {
      fail("V138_SUCCESSOR_SOURCE_SEAL_V9_CLI_INVALID")
    }
    const authorization = JSON.parse(readV138RepositoryFileNoFollow(repoRoot,
      canonicalPath(repoRoot, args[3]!,
        V138_PLAN_262_56_V9_CANONICAL_PATHS.authorization), "required")!
      .toString("utf8"))
    writeV138SuccessorSourceSealV9(repoRoot, args[1]!, authorization)
  } else if (args[0] === "--check-plan-262-56-authorization-v9") {
    if (args.length !== 7 || args[1] !== "--authorization" ||
      args[3] !== "--seal" || args[5] !== "--source-b9") {
      fail("V138_PLAN_262_56_AUTHORIZATION_V9_CLI_INVALID")
    }
    const authorizationBytes = readV138RepositoryFileNoFollow(repoRoot,
      canonicalPath(repoRoot, args[2]!,
        V138_PLAN_262_56_V9_CANONICAL_PATHS.authorization), "required")!
    const sealBytes = readV138RepositoryFileNoFollow(repoRoot,
      canonicalPath(repoRoot, args[4]!,
        V138_PLAN_262_56_V9_CANONICAL_PATHS.seal), "required")!
    const custody = checkV138SuccessorSealCommitV9({ repoRoot,
      sourceB9: args[6]!, authorization: JSON.parse(authorizationBytes.toString("utf8")),
      seal: JSON.parse(sealBytes.toString("utf8")), suppliedAuthorizationBytes:
      authorizationBytes, suppliedSealBytes: sealBytes })
    process.stdout.write(canonical(custody))
  } else if (args[0] === "--render-plan-262-56-authorization-v7") {
    if (args.length !== 3 || !["--source-a7-from-review",
      "--review-input-absolute"].includes(args[1]!)) {
      fail("V138_PLAN_262_56_AUTHORIZATION_RENDER_CLI_INVALID")
    }
    const reviewBytes = regularFile(path.resolve(args[2]!), "required")!
    const review = JSON.parse(reviewBytes.toString("utf8")) as unknown
    const checked = checkV138Plan26255ReviewProjection(review)
    process.stdout.write(`${v138Plan26256AuthorizationLiteral(repoRoot,
      String(checked.a7), checked)}\n`)
  } else if (args[0] === "--write-plan-262-56-authorization-v7") {
    if (args.length !== 8 || args[2] !== "--source-a7" ||
      args[4] !== "--review-input-absolute" ||
      args[6] !== "--operator-literal") {
      fail("V138_PLAN_262_56_AUTHORIZATION_CLI_INVALID")
    }
    const review = JSON.parse(regularFile(path.resolve(args[5]!), "required")!
      .toString("utf8"))
    writeV138Plan26256AuthorizationV7(repoRoot, args[1]!, args[3]!, review,
      Buffer.from(args[7] ?? "", "utf8"))
  } else if (args[0] === "--write-successor-source-seal-v7") {
    if (args.length !== 4 || args[2] !== "--authorization") {
      fail("V138_SUCCESSOR_SOURCE_SEAL_V7_CLI_INVALID")
    }
    const authorization = JSON.parse(regularFile(canonicalPath(repoRoot,
      args[3]!, V138_PLAN_262_56_CANONICAL_PATHS.authorization), "required")!
      .toString("utf8"))
    writeV138SuccessorSourceSealV7(repoRoot, args[1]!, authorization)
  } else if (args[0] === "--check-plan-262-56-authorization-v7") {
    if (args.length !== 5 || args[1] !== "--authorization" ||
      args[3] !== "--seal") {
      fail("V138_PLAN_262_56_CHECK_CLI_INVALID")
    }
    const authorization = JSON.parse(regularFile(canonicalPath(repoRoot,
      args[2]!, V138_PLAN_262_56_CANONICAL_PATHS.authorization), "required")!
      .toString("utf8"))
    const seal = JSON.parse(regularFile(canonicalPath(repoRoot, args[4]!,
      V138_PLAN_262_56_CANONICAL_PATHS.seal), "required")!.toString("utf8"))
    const checked = checkV138Plan26256AuthorizationV7(repoRoot, authorization)
    const custody = checkV138SuccessorSealCommitV7({ repoRoot,
      sourceA7: String(checked.reviewedSourceCommit),
      sourceB7: deriveV138SourceB7(repoRoot,
        String(checked.reviewedSourceCommit)), authorizationValue: checked,
      sealValue: seal })
    process.stdout.write(`${canonical({ authorizationRoot:
      checked.authorizationRoot, sealRoot: custody.sealRoot, custody })}`)
  } else if (args[0] === "--write-plan-262-47-pre-execution-source-failure-v1") {
    if (args.length !== 1) {
      fail("V138_PLAN_262_47_PRE_EXECUTION_SOURCE_FAILURE_CLI_INVALID")
    }
    const value = writeV138Plan26247PreExecutionSourceFailureV1(repoRoot,
      V138_PLAN_262_47_PRE_EXECUTION_SOURCE_FAILURE_PATH)
    process.stdout.write(`${canonical({ dispositionRoot: value.dispositionRoot,
      reason: value.reason, routeStarted: value.routeStarted,
      chargedAttemptCount: value.chargedAttemptCount,
      acceptedCellCount: value.acceptedCellCount })}`)
  } else if (args[0] === "--check-plan-262-47-pre-execution-source-failure-v1") {
    if (args.length !== 1) {
      fail("V138_PLAN_262_47_PRE_EXECUTION_SOURCE_FAILURE_CLI_INVALID")
    }
    const value = JSON.parse(regularFile(path.resolve(repoRoot,
      V138_PLAN_262_47_PRE_EXECUTION_SOURCE_FAILURE_PATH), "required")!
      .toString("utf8"))
    const checked = checkV138Plan26247PreExecutionSourceFailureV1(repoRoot,
      value)
    process.stdout.write(`${canonical({ dispositionRoot:
      checked.dispositionRoot, reason: checked.reason,
    routeStarted: checked.routeStarted,
    chargedAttemptCount: checked.chargedAttemptCount,
    acceptedCellCount: checked.acceptedCellCount })}`)
  } else if (args[0] === "--render-plan-262-47-authorization-v6") {
    if (args.length !== 3 || args[1] !== "--reviewed-source") {
      fail("V138_PLAN_262_47_AUTHORIZATION_RENDER_CLI_INVALID")
    }
    process.stdout.write(
      `${v138Plan26247AuthorizationLiteral(repoRoot, args[2]!)}\n`,
    )
  } else if (args[0] === "--write-plan-262-47-authorization-v6") {
    if (args.length !== 6 || args[2] !== "--reviewed-source" ||
      args[4] !== "--operator-literal") {
      fail("V138_PLAN_262_47_AUTHORIZATION_CLI_INVALID")
    }
    writeV138Plan26247AuthorizationV6(repoRoot, args[1]!, args[3]!,
      Buffer.from(args[5]!, "utf8"))
  } else if (args[0] === "--write-successor-source-seal-v6") {
    if (args.length !== 4 || args[2] !== "--authorization") {
      fail("V138_SUCCESSOR_SOURCE_SEAL_V6_CLI_INVALID")
    }
    const authorization = JSON.parse(regularFile(canonicalPath(repoRoot,
      args[3]!, V138_PLAN_262_47_CANONICAL_PATHS.authorization), "required")!
      .toString("utf8"))
    writeV138SuccessorSourceSealV6(repoRoot, args[1]!, authorization)
  } else if (args[0] === "--check-plan-262-47-authorization-v6") {
    if (args.length !== 5 || args[1] !== "--authorization" ||
      args[3] !== "--seal") {
      fail("V138_PLAN_262_47_CHECK_CLI_INVALID")
    }
    const authorization = JSON.parse(regularFile(canonicalPath(repoRoot,
      args[2]!, V138_PLAN_262_47_CANONICAL_PATHS.authorization), "required")!
      .toString("utf8"))
    const seal = JSON.parse(regularFile(canonicalPath(repoRoot, args[4]!,
      V138_PLAN_262_47_CANONICAL_PATHS.seal), "required")!.toString("utf8"))
    const custody = checkV138SuccessorSealCommitV6(repoRoot, authorization,
      seal)
    process.stdout.write(`${canonical({ authorizationRoot:
      (authorization as Record<string, unknown>).authorizationRoot,
    sealRoot: (seal as Record<string, unknown>).sealRoot, custody })}`)
  } else if (args[0] === "--render-plan-262-29-authorization-v5") {
    if (args.length !== 3 || args[1] !== "--source-a5") {
      fail("V138_PLAN_262_29_AUTHORIZATION_RENDER_CLI_INVALID")
    }
    process.stdout.write(
      `${v138Plan26229AuthorizationLiteral(repoRoot, args[2]!)}\n`,
    )
  } else if (args[0] === "--write-plan-262-29-authorization-v5") {
    const values = new Map<string, string>()
    for (let index = 2; index < args.length; index += 2) {
      if (args[index] === undefined || args[index + 1] === undefined ||
        values.has(args[index]!)) {
        fail("V138_PLAN_262_29_AUTHORIZATION_CLI_INVALID")
      }
      values.set(args[index]!, args[index + 1]!)
    }
    if (args.length !== 6 || !values.has("--source-a5") ||
      !values.has("--operator-literal")) {
      fail("V138_PLAN_262_29_AUTHORIZATION_CLI_INVALID")
    }
    writeV138Plan26229AuthorizationV5(repoRoot, args[1]!,
      values.get("--source-a5")!,
      Buffer.from(values.get("--operator-literal")!, "utf8"))
  } else if (args[0] === "--write-successor-source-seal-v5") {
    const values = new Map<string, string>()
    for (let index = 2; index < args.length; index += 2) {
      if (args[index] === undefined || args[index + 1] === undefined ||
        values.has(args[index]!)) {
        fail("V138_SUCCESSOR_SOURCE_SEAL_V5_CLI_INVALID")
      }
      values.set(args[index]!, args[index + 1]!)
    }
    if (args.length !== 6 || !values.has("--authorization") ||
      !values.has("--source-a5")) {
      fail("V138_SUCCESSOR_SOURCE_SEAL_V5_CLI_INVALID")
    }
    const authorization = JSON.parse(regularFile(canonicalPath(repoRoot,
      values.get("--authorization")!,
      V138_PLAN_262_29_CANONICAL_PATHS.authorization), "required")!
      .toString("utf8"))
    const checked = checkV138Plan26229AuthorizationV5(repoRoot, authorization)
    if (checked.sourceCustody.sourceA5 !== values.get("--source-a5")) {
      fail("V138_PLAN_262_29_AUTHORIZATION_SOURCE_JOIN_INVALID")
    }
    writeV138SuccessorSourceSealV5(repoRoot, args[1]!, checked)
  } else if (args[0] === "--check-plan-262-29-authorization-v5") {
    const values = new Map<string, string>()
    const expectedNames = new Set(["--authorization", "--seal", "--review",
      "--review-fix", "--source-a5", "--source-b5"])
    for (let index = 1; index < args.length; index += 2) {
      if (args[index] === undefined || args[index + 1] === undefined ||
        values.has(args[index]!) || !expectedNames.has(args[index]!)) {
        fail("V138_PLAN_262_29_CHECK_CLI_INVALID")
      }
      values.set(args[index]!, args[index + 1]!)
    }
    if (values.size !== expectedNames.size) {
      fail("V138_PLAN_262_29_CHECK_CLI_INVALID")
    }
    for (const name of expectedNames) {
      if (!values.has(name)) fail("V138_PLAN_262_29_CHECK_CLI_INVALID")
    }
    canonicalPath(repoRoot, values.get("--review")!,
      V138_PLAN_262_29_CANONICAL_PATHS.review)
    canonicalPath(repoRoot, values.get("--review-fix")!,
      V138_PLAN_262_29_CANONICAL_PATHS.reviewFix)
    const authorization = JSON.parse(regularFile(canonicalPath(repoRoot,
      values.get("--authorization")!,
      V138_PLAN_262_29_CANONICAL_PATHS.authorization), "required")!
      .toString("utf8"))
    const checkedAuthorization = checkV138Plan26229AuthorizationV5(repoRoot,
      authorization)
    const checkedSeal = checkV138SuccessorSourceSealV5(repoRoot,
      JSON.parse(regularFile(canonicalPath(repoRoot, values.get("--seal")!,
        V138_PLAN_262_29_CANONICAL_PATHS.seal), "required")!.toString("utf8")),
      checkedAuthorization)
    const custody = checkV138SuccessorSealCommitV5({ repoRoot,
      sourceA5: values.get("--source-a5")!,
      sourceB5: values.get("--source-b5")! })
    process.stdout.write(canonical({ authorizationRoot:
      checkedAuthorization.authorizationRoot, sealRoot: checkedSeal.sealRoot,
    custody }))
  } else if (args[0] === "--render-plan-262-24-authorization-v4") {
    if (args.length !== 3 || args[1] !== "--source-a4") {
      fail("V138_PLAN_262_24_AUTHORIZATION_RENDER_CLI_INVALID")
    }
    process.stdout.write(
      `${v138Plan26224AuthorizationLiteral(repoRoot, args[2]!)}\n`,
    )
  } else if (args[0] === "--write-plan-262-24-authorization-v4") {
    if (args.length !== 6 || args[2] !== "--literal" ||
      args[4] !== "--source-a4") {
      fail("V138_PLAN_262_24_AUTHORIZATION_CLI_INVALID")
    }
    writeV138Plan26224AuthorizationV4(repoRoot, args[1]!, args[5]!,
      Buffer.from(args[3]!, "utf8"))
  } else if (args[0] === "--write-successor-source-seal-v4") {
    if (args.length !== 4 || args[2] !== "--authorization") {
      fail("V138_SUCCESSOR_SOURCE_SEAL_V4_CLI_INVALID")
    }
    const authorization = JSON.parse(regularFile(canonicalPath(repoRoot,
      args[3]!, V138_PLAN_262_24_CANONICAL_PATHS.authorization), "required")!
      .toString("utf8"))
    writeV138SuccessorSourceSealV4(repoRoot, args[1]!, authorization)
  } else if (args[0] === "--check-plan-262-24-authorization-v4") {
    const values = new Map<string, string>()
    for (let index = 1; index < args.length; index += 2) {
      if (args[index] === undefined || args[index + 1] === undefined ||
        values.has(args[index]!)) fail("V138_PLAN_262_24_CHECK_CLI_INVALID")
      values.set(args[index]!, args[index + 1]!)
    }
    for (const name of ["--authorization", "--seal", "--review",
      "--review-fix", "--source-a4", "--source-b4"]) {
      if (!values.has(name)) fail("V138_PLAN_262_24_CHECK_CLI_INVALID")
    }
    canonicalPath(repoRoot, values.get("--review")!,
      V138_PLAN_262_24_CANONICAL_PATHS.review)
    canonicalPath(repoRoot, values.get("--review-fix")!,
      V138_PLAN_262_24_CANONICAL_PATHS.reviewFix)
    const authorization = JSON.parse(regularFile(canonicalPath(repoRoot,
      values.get("--authorization")!,
      V138_PLAN_262_24_CANONICAL_PATHS.authorization), "required")!
      .toString("utf8"))
    const checkedAuthorization = checkV138Plan26224AuthorizationV4(repoRoot,
      authorization)
    const checkedSeal = checkV138SuccessorSourceSealV4(repoRoot,
      JSON.parse(regularFile(canonicalPath(repoRoot, values.get("--seal")!,
        V138_PLAN_262_24_CANONICAL_PATHS.seal), "required")!.toString("utf8")),
      checkedAuthorization)
    const custody = checkV138SuccessorSealCommitV4({ repoRoot,
      sourceA4: values.get("--source-a4")!,
      sourceB4: values.get("--source-b4")! })
    process.stdout.write(canonical({ authorizationRoot:
      checkedAuthorization.authorizationRoot, sealRoot: checkedSeal.sealRoot,
    custody }))
  } else if (args[0] === "--check-plan-262-21-post-live-v3") {
    // Loading the current-matrix module installs the authoritative semantic
    // branch checker without introducing an eager circular module import.
    await import("./v1-38-current-matrix-reproduction.js")
    const values = new Map<string, string>()
    for (let index = 1; index < args.length; index += 2) {
      if (args[index] === undefined || args[index + 1] === undefined ||
        values.has(args[index]!)) fail("V138_PLAN_262_21_POST_LIVE_CLI_INVALID")
      values.set(args[index]!, args[index + 1]!)
    }
    const sourceA3 = values.get("--source-a3")
    const sourceB3 = values.get("--source-b3")
    if (sourceA3 === undefined || sourceB3 === undefined) {
      fail("V138_PLAN_262_21_POST_LIVE_CLI_INVALID")
    }
    process.stdout.write(canonical(checkV138Plan26221AuthorizationV3PostLive({
      repoRoot, sourceA3, sourceB3,
    })))
  } else if (args[0] === "--check-plan-262-24-authorization-v4-post-live") {
    const values = new Map<string, string>()
    for (let index = 1; index < args.length; index += 2) {
      if (args[index] === undefined || args[index + 1] === undefined ||
        values.has(args[index]!)) {
        fail("V138_PLAN_262_24_POST_LIVE_CLI_INVALID")
      }
      values.set(args[index]!, args[index + 1]!)
    }
    for (const [flag, repoPath] of [["--authorization",
      V138_PLAN_262_24_CANONICAL_PATHS.authorization], ["--seal",
      V138_PLAN_262_24_CANONICAL_PATHS.seal], ["--terminal",
      V138_PLAN_262_25_FRESH_DESTINATIONS[4]]] as const) {
      canonicalPath(repoRoot, values.get(flag) ?? "", repoPath)
    }
    const sourceA4 = values.get("--source-a4")
    const sourceB4 = values.get("--source-b4")
    if (sourceA4 === undefined || sourceB4 === undefined || values.size !== 5) {
      fail("V138_PLAN_262_24_POST_LIVE_CLI_INVALID")
    }
    const reproduction = await import(
      "./v1-38-current-matrix-reproduction.js")
    const terminal = reproduction.checkV138Plan26225TerminalBranch(repoRoot,
      sourceA4, sourceB4)
    process.stdout.write(canonical({ disposition: terminal.disposition,
      terminalRoot: terminal.terminalRoot }))
  } else if (args[0] === "--render-plan-262-21-authorization-v3") {
    if (args.length !== 3 || args[1] !== "--source-a3") {
      fail("V138_PLAN_262_21_AUTHORIZATION_RENDER_CLI_INVALID")
    }
    process.stdout.write(
      `${v138Plan26221AuthorizationLiteral(repoRoot, args[2]!)}\n`,
    )
  } else if (args[0] === "--write-plan-262-21-authorization-v3") {
    if (args.length !== 6 || args[2] !== "--literal" ||
      args[4] !== "--source-a3") {
      fail("V138_PLAN_262_21_AUTHORIZATION_CLI_INVALID")
    }
    writeV138Plan26221AuthorizationV3(repoRoot, args[1]!, args[5]!,
      Buffer.from(args[3]!, "utf8"))
  } else if (args[0] === "--write-successor-source-seal-v3") {
    if (args.length !== 6 || args[2] !== "--authorization" ||
      args[4] !== "--source-a3") {
      fail("V138_SUCCESSOR_SOURCE_SEAL_V3_CLI_INVALID")
    }
    const authorization = JSON.parse(regularFile(canonicalPath(repoRoot,
      args[3]!, V138_PLAN_262_21_CANONICAL_PATHS.authorization),
    "required")!.toString("utf8"))
    const checked = checkV138Plan26221AuthorizationV3(repoRoot, authorization)
    if (checked.sourceCustody.sourceA3 !== args[5]) {
      fail("V138_PLAN_262_21_AUTHORIZATION_SOURCE_JOIN_INVALID")
    }
    writeV138SuccessorSourceSealV3(repoRoot, args[1]!, checked)
  } else if (args[0] === "--check-selected-route-closure-from-seal-v3") {
    if (args.length !== 3 || args[1] !== "--seal") {
      fail("V138_SELECTED_ROUTE_SEAL_V3_CLI_INVALID")
    }
    const authorization = JSON.parse(regularFile(path.resolve(repoRoot,
      V138_PLAN_262_21_CANONICAL_PATHS.authorization), "required")!
      .toString("utf8"))
    const seal = checkV138SuccessorSourceSealV3(repoRoot,
      JSON.parse(regularFile(canonicalPath(repoRoot, args[2]!,
        V138_PLAN_262_21_CANONICAL_PATHS.seal), "required")!
        .toString("utf8")), authorization)
    process.stdout.write(canonical(checkSelectedRouteClosureAtCommit(repoRoot,
      seal.sourceCustody.sourceA3, seal.selectedRouteClosure)))
  } else if (args[0] === "--check-plan-262-21-authorization-v3") {
    const value = (name: string): string => {
      const index = args.indexOf(name)
      if (index < 1 || index + 1 >= args.length) {
        fail("V138_PLAN_262_21_CHECK_CLI_INVALID")
      }
      return args[index + 1]!
    }
    const sourceA3 = value("--source-a3")
    const sourceB3 = value("--source-b3")
    canonicalPath(repoRoot, value("--review"),
      V138_PLAN_262_21_CANONICAL_PATHS.review)
    canonicalPath(repoRoot, value("--review-fix"),
      V138_PLAN_262_21_CANONICAL_PATHS.reviewFix)
    const authorization = JSON.parse(regularFile(canonicalPath(repoRoot,
      value("--authorization"), V138_PLAN_262_21_CANONICAL_PATHS.authorization),
    "required")!.toString("utf8"))
    const checkedAuthorization = checkV138Plan26221AuthorizationV3(repoRoot,
      authorization)
    const seal = JSON.parse(regularFile(canonicalPath(repoRoot, value("--seal"),
      V138_PLAN_262_21_CANONICAL_PATHS.seal), "required")!.toString("utf8"))
    const checkedSeal = checkV138SuccessorSourceSealV3(repoRoot, seal,
      checkedAuthorization)
    const custody = checkV138SuccessorSealCommitV3({ repoRoot, sourceA3,
      sourceB3 })
    checkV138Plan26221PreLiveDestinationAbsence(repoRoot)
    process.stdout.write(canonical({ authorizationRoot:
      checkedAuthorization.authorizationRoot, sealRoot: checkedSeal.sealRoot,
    custody }))
  } else if (args[0] === "--render-plan-262-18-authorization-v2") {
    if (args.length !== 3 || args[1] !== "--source-a2") {
      fail("V138_PLAN_262_18_AUTHORIZATION_RENDER_CLI_INVALID")
    }
    process.stdout.write(
      `${v138Plan26218AuthorizationLiteral(repoRoot, args[2]!)}\n`,
    )
  } else if (args[0] === "--write-plan-262-18-authorization-v2") {
    if (
      args.length !== 6 ||
      args[2] !== "--literal" ||
      args[4] !== "--source-a2"
    )
      fail("V138_PLAN_262_18_AUTHORIZATION_CLI_INVALID")
    writeV138Plan26218AuthorizationV2(
      repoRoot,
      args[1]!,
      args[5]!,
      Buffer.from(args[3]!, "utf8"),
    )
  } else if (args[0] === "--write-successor-source-seal-v2") {
    if (
      args.length !== 6 ||
      args[2] !== "--authorization" ||
      args[4] !== "--source-a2"
    )
      fail("V138_SUCCESSOR_SOURCE_SEAL_V2_CLI_INVALID")
    const authorization: unknown = JSON.parse(
      regularFile(
        canonicalPath(
          repoRoot,
          args[3]!,
          V138_PLAN_262_18_CANONICAL_PATHS.authorization,
        ),
        "required",
      )!.toString("utf8"),
    )
    const checked = checkV138Plan26218AuthorizationV2(repoRoot, authorization)
    if (checked.sourceCustody.sourceA2 !== args[5]) {
      fail("V138_PLAN_262_18_AUTHORIZATION_SOURCE_JOIN_INVALID")
    }
    writeV138SuccessorSourceSealV2(repoRoot, args[1]!, checked)
  } else if (args[0] === "--write-plan-262-18-terminal-v2") {
    if (
      args.length !== 10 ||
      args[2] !== "--disposition" ||
      (args[3] !== "seal_refused" && args[3] !== "seal_failed") ||
      args[4] !== "--authorization" ||
      args[6] !== "--seal" ||
      args[8] !== "--source-a2"
    )
      fail("V138_PLAN_262_18_TERMINAL_CLI_INVALID")
    canonicalPath(
      repoRoot,
      args[5]!,
      V138_PLAN_262_18_CANONICAL_PATHS.authorization,
    )
    canonicalPath(repoRoot, args[7]!, V138_PLAN_262_18_CANONICAL_PATHS.seal)
    writeV138Plan26218TerminalV2(
      repoRoot,
      args[1]!,
      args[3] as V138Plan26218TerminalV2["disposition"],
      args[9]!,
    )
  } else if (args[0] === "--check-reviewed-source-a2") {
    if (
      args.length !== 11 ||
      args[1] !== "--repair-start-head2" ||
      args[3] !== "--source-base2" ||
      args[5] !== "--source-a2" ||
      args[7] !== "--review" ||
      args[9] !== "--review-fix"
    )
      fail("V138_REVIEWED_SOURCE_A2_CLI_INVALID")
    const custody = checkV138ReviewedSourceA2({
      repoRoot,
      repairStartHead2: args[2]!,
      sourceBase2: args[4]!,
      sourceA2: args[6]!,
      reviewPath: args[8]!,
      reviewFixPath: args[10]!,
    })
    process.stdout.write(canonical(custody))
  } else if (args[0] === "--check-selected-route-closure-at-a2") {
    if (args.length !== 3 || args[1] !== "--source-a2") {
      fail("V138_SELECTED_ROUTE_A2_CLI_INVALID")
    }
    process.stdout.write(
      canonical(deriveSelectedRouteClosureAtCommit(repoRoot, args[2]!)),
    )
  } else if (args[0] === "--check-selected-route-closure-from-seal-v2") {
    if (args.length !== 3 || args[1] !== "--seal") {
      fail("V138_SELECTED_ROUTE_SEAL_V2_CLI_INVALID")
    }
    const sealValue: unknown = JSON.parse(
      regularFile(
        canonicalPath(
          repoRoot,
          args[2]!,
          V138_PLAN_262_18_CANONICAL_PATHS.seal,
        ),
        "required",
      )!.toString("utf8"),
    )
    const authorizationValue: unknown = JSON.parse(
      regularFile(
        path.resolve(repoRoot, V138_PLAN_262_18_CANONICAL_PATHS.authorization),
        "required",
      )!.toString("utf8"),
    )
    const seal = checkV138SuccessorSourceSealV2(
      repoRoot,
      sealValue,
      authorizationValue,
    )
    process.stdout.write(
      canonical(
        checkSelectedRouteClosureAtCommit(
          repoRoot,
          seal.sourceCustody.sourceA2,
          seal.selectedRouteClosure,
        ),
      ),
    )
  } else if (args[0] === "--check-plan-262-18-authorization-v2") {
    if (
      args.length !== 27 ||
      args[1] !== "--authorization" ||
      args[3] !== "--seal" ||
      args[5] !== "--terminal" ||
      args[7] !== "--review" ||
      args[9] !== "--review-fix" ||
      args[11] !== "--old-authorization" ||
      args[13] !== "--old-seal" ||
      args[15] !== "--old-context" ||
      args[17] !== "--old-preflight" ||
      args[19] !== "--old-calibration" ||
      args[21] !== "--old-terminal" ||
      args[23] !== "--source-a2" ||
      args[25] !== "--source-b2"
    )
      fail("V138_PLAN_262_18_CHECK_CLI_INVALID")
    const disposition = checkV138Plan26218ArtifactBranch({
      repoRoot,
      authorizationPath: args[2]!,
      sealPath: args[4]!,
      terminalPath: args[6]!,
      reviewPath: args[8]!,
      reviewFixPath: args[10]!,
      oldAuthorizationPath: args[12]!,
      oldSealPath: args[14]!,
      oldContextPath: args[16]!,
      oldPreflightPath: args[18]!,
      oldCalibrationPath: args[20]!,
      oldTerminalPath: args[22]!,
      sourceA2: args[24]!,
      ...(args[26] === "ABSENT" ? {} : { sourceB2: args[26]! }),
    })
    process.stdout.write(canonical({ disposition }))
  } else if (args[0] === "--write-plan-262-15-authorization-v1") {
    if (
      args.length !== 6 ||
      args[2] !== "--source-a" ||
      args[4] !== "--literal-file"
    ) {
      fail("V138_PLAN_262_15_AUTHORIZATION_CLI_INVALID")
    }
    const literalPath = path.resolve(args[5]!)
    const literalStat = lstatSync(literalPath)
    if (!literalStat.isFile() || literalStat.isSymbolicLink()) {
      fail("V138_PLAN_262_15_AUTHORIZATION_LITERAL_INVALID")
    }
    writeV138Plan26215Authorization(
      repoRoot,
      args[1]!,
      args[3]!,
      regularFile(literalPath, "required")!,
    )
  } else if (args[0] === "--write-successor-source-seal-v1") {
    if (
      args.length !== 6 ||
      args[2] !== "--proposed-seal" ||
      args[4] !== "--authorization"
    ) {
      fail("V138_SUCCESSOR_SOURCE_SEAL_CLI_INVALID")
    }
    const proposed = JSON.parse(
      regularFile(path.resolve(args[3]!), "required")!.toString("utf8"),
    )
    const authorization = JSON.parse(
      regularFile(
        canonicalPath(repoRoot, args[5]!, CANONICAL_PATHS.authorization),
        "required",
      )!.toString("utf8"),
    )
    writeV138SuccessorSourceSeal(repoRoot, args[1]!, proposed, authorization)
  } else if (args[0] === "--write-plan-262-15-terminal-v1") {
    if (
      args.length !== 12 ||
      args[2] !== "--disposition" ||
      (args[3] !== "seal_refused" && args[3] !== "seal_failed") ||
      args[4] !== "--authorization" ||
      args[6] !== "--seal" ||
      args[8] !== "--review" ||
      args[10] !== "--review-fix"
    ) {
      fail("V138_PLAN_262_15_TERMINAL_CLI_INVALID")
    }
    canonicalPath(repoRoot, args[5]!, CANONICAL_PATHS.authorization)
    canonicalPath(repoRoot, args[7]!, CANONICAL_PATHS.seal)
    canonicalPath(repoRoot, args[9]!, CANONICAL_PATHS.review)
    canonicalPath(repoRoot, args[11]!, CANONICAL_PATHS.reviewFix)
    writePlan26215Terminal(
      repoRoot,
      args[1]!,
      args[3] as V138Plan26215Terminal["disposition"],
      {
        authorization: args[5]!,
        seal: args[7]!,
        terminal: args[1]!,
        review: args[9]!,
        reviewFix: args[11]!,
      },
    )
  } else if (args[0] === "--check-plan-262-15-authorization-v1") {
    if (
      args.length !== 11 ||
      args[1] !== "--authorization" ||
      args[3] !== "--seal" ||
      args[5] !== "--terminal" ||
      args[7] !== "--review" ||
      args[9] !== "--review-fix"
    ) {
      fail("V138_PLAN_262_15_CHECK_CLI_INVALID")
    }
    const disposition = checkPlan26215ArtifactBranch(repoRoot, {
      authorization: args[2]!,
      seal: args[4]!,
      terminal: args[6]!,
      review: args[8]!,
      reviewFix: args[10]!,
    })
    process.stdout.write(`${canonical({ disposition })}`)
  } else if (args[0] === "--check-reviewed-source-a") {
    if (
      args.length !== 9 ||
      args[1] !== "--source-base" ||
      args[3] !== "--source-a" ||
      args[5] !== "--review" ||
      args[7] !== "--review-fix"
    ) {
      fail("V138_REVIEWED_SOURCE_A_CLI_INVALID")
    }
    canonicalPath(repoRoot, args[6]!, CANONICAL_PATHS.review)
    canonicalPath(repoRoot, args[8]!, CANONICAL_PATHS.reviewFix)
    const reviewBytes = regularFile(
      path.resolve(repoRoot, args[6]!),
      "required",
    )!
    const reviewMetadata = strictReviewMetadata(reviewBytes)
    if (
      args[2] !== "30c0949692017f425795213972482568cdd73f64" ||
      reviewMetadata.sourceA !== args[4]
    ) {
      fail("V138_PLAN_262_15_REVIEW_SOURCE_JOIN_INVALID")
    }
    const reviewFixBytes = regularFile(
      path.resolve(repoRoot, args[8]!),
      reviewMetadata.fixesApplied ? "required" : "absent",
    )
    if (
      reviewFixBytes !== undefined &&
      strictFixReportMetadata(reviewFixBytes).finalSourceA !== args[4]
    )
      fail("V138_PLAN_262_15_REVIEW_FIX_RELATION_INVALID")
    const custody = inspectSourceCustody({
      repoRoot,
      sourceBase: args[2]!,
      sourceA: args[4]!,
    })
    process.stdout.write(
      canonical({
        sourceBase: custody.sourceBase,
        sourceA: custody.sourceA,
        lineageCount: custody.lineage.length,
      }),
    )
  } else if (args[0] === "--check-successor-seal-commit") {
    if (
      args.length !== 5 ||
      args[1] !== "--source-a" ||
      args[3] !== "--source-b"
    )
      fail("V138_SUCCESSOR_SEAL_B_CLI_INVALID")
    checkV138SuccessorSealCommit({
      repoRoot,
      sourceA: args[2]!,
      sourceB: args[4]!,
    })
    process.stdout.write(
      canonical({
        sourceA: args[2],
        sourceB: args[4],
        checked: true,
      }),
    )
  } else if (args[0] === "--check-selected-route-closure-at-a") {
    if (args.length !== 3 || args[1] !== "--source-a") {
      fail("V138_SELECTED_ROUTE_CLI_INVALID")
    }
    const closure = deriveSelectedRouteClosureAtCommit(repoRoot, args[2]!)
    process.stdout.write(
      canonical({
        sourceA: closure.sourceA,
        pathCount: closure.paths.length,
        closureRoot: closure.closureRoot,
      }),
    )
  } else if (args[0] === "--check-selected-route-closure-from-seal") {
    if (args.length !== 3 || args[1] !== "--seal") {
      fail("V138_SELECTED_ROUTE_CLI_INVALID")
    }
    const sealPath = canonicalPath(repoRoot, args[2]!, CANONICAL_PATHS.seal)
    const parsed: unknown = JSON.parse(
      regularFile(sealPath, "required")!.toString("utf8"),
    )
    const authorization: unknown = JSON.parse(
      regularFile(
        canonicalPath(
          repoRoot,
          CANONICAL_PATHS.authorization,
          CANONICAL_PATHS.authorization,
        ),
        "required",
      )!.toString("utf8"),
    )
    const checked = checkV138SuccessorSourceSeal(
      repoRoot,
      parsed,
      authorization,
    )
    const closure = checkSelectedRouteClosureAtCommit(
      repoRoot,
      checked.sourceCustody.sourceA,
      checked.selectedRouteClosure,
    )
    process.stdout.write(
      canonical({
        sourceA: closure.sourceA,
        pathCount: closure.paths.length,
        closureRoot: closure.closureRoot,
      }),
    )
  } else {
    fail("V138_SUCCESSOR_SOURCE_SEAL_CLI_COMMAND_INVALID")
  }
}

void runCli().finally(disposeV138DetachedOpenatHelper)
