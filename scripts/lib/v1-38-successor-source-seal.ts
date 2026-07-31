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

const runCli = (): void => {
  if (process.argv[1] !== fileURLToPath(import.meta.url)) return
  const repoRoot = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../..",
  )
  const args = process.argv.slice(2)
  if (args[0] === "--render-plan-262-18-authorization-v2") {
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

runCli()
