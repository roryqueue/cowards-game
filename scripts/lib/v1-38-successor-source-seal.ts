import { Buffer } from "node:buffer"
import { createHash } from "node:crypto"
import {
  closeSync,
  constants,
  fstatSync,
  fsyncSync,
  lstatSync,
  openSync,
  readFileSync,
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
  const lockedPackageNames = new Set<string>()
  for (const line of lockText.split("\n")) {
    const match = /^\s{2,6}['"]?\/?((?:@[^/'":\s]+\/)?[^@'":\s/]+)@[^:]+:\s*$/u.exec(
      line,
    )
    if (match !== null) lockedPackageNames.add(match[1]!)
  }
  const tsconfigPaths = sorted(
    [...inventory].filter((repoPath) =>
      /(?:^|\/)tsconfig(?:\.[^/]+)?\.json$/u.test(repoPath)),
  )
  const pathMappings: Array<{
    pattern: string
    targets: string[]
    base: string
    scope: string
  }> = []
  for (const configPath of tsconfigPaths) {
    const parsed = ts.parseConfigFileTextToJson(
      configPath,
      readCommitFile(repoRoot, sourceA, configPath).toString("utf8"),
    )
    if (parsed.error !== undefined) fail("V138_SELECTED_ROUTE_TSCONFIG_INVALID")
    const compilerOptions = (parsed.config?.compilerOptions ?? {}) as {
      baseUrl?: unknown
      paths?: unknown
    }
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
      const baseUrl =
        typeof compilerOptions.baseUrl === "string"
          ? compilerOptions.baseUrl
          : "."
      pathMappings.push({
        pattern,
        targets: targets as string[],
        base: path.posix.normalize(
          path.posix.join(path.posix.dirname(configPath), baseUrl),
        ),
        scope: path.posix.dirname(configPath),
      })
    }
  }
  const resolve = (from: string, specifier: string): string | undefined => {
    if (
      specifier.startsWith("node:") ||
      builtinNames.has(specifier.split("/")[0]!)
    ) return undefined
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
                    subpath.slice(prefix!.length, subpath.length - suffix!.length),
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
  if (!/^[0-9a-f]{40}$/u.test(sourceA)) fail("V138_AUTHORIZATION_SOURCE_A_INVALID")
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
  const expected = Buffer.from(v138Plan26215AuthorizationLiteral(sourceA), "utf8")
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
  ) fail("V138_PLAN_262_15_REVIEW_NOT_CLEAN")
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
  const roots: Array<{ path: string; sha256: Sha256 }> = [{
    path: reviewPath,
    sha256: sha256(reviewBytes),
  }]
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
  ) fail("V138_PLAN_262_15_REVIEW_FIX_RELATION_INVALID")
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
    acceptedCellCountRule: "exactly_zero_or_540",
    runtimeRoute: "v1.18/v1.19/MATCH_KERNEL",
  })

const deriveToolIdentity = (): Readonly<Record<string, JsonValue>> => {
  const toolPath = "/usr/bin/memory_pressure"
  const stat = lstatSync(toolPath)
  if (!stat.isFile() || stat.isSymbolicLink()) {
    fail("V138_SUCCESSOR_SEAL_TOOL_IDENTITY_INVALID")
  }
  const bytes = readFileSync(toolPath)
  return Object.freeze({
    schemaVersion: "v1.38-tool-identity-v1",
    path: toolPath,
    byteLength: bytes.byteLength,
    sha256: sha256(bytes),
    mode: stat.mode,
    uid: stat.uid,
    gid: stat.gid,
    command: "/usr/bin/memory_pressure -Q",
    environment: "LC_ALL=C LANG=C PATH=/usr/bin:/bin:/usr/sbin:/sbin",
  })
}

const deriveHostIdentity = (): Readonly<Record<string, JsonValue>> => {
  if (platform() !== "darwin") {
    fail("V138_SUCCESSOR_SEAL_HOST_IDENTITY_INVALID")
  }
  return Object.freeze({
    schemaVersion: "v1.38-host-identity-v1",
    platform: platform(),
    release: release(),
    architecture: arch(),
  })
}

const deriveFormationAbsence = (
  repoRoot: string,
  sourceA: string,
): Readonly<Record<string, JsonValue>> => {
  const forbidden = gitText(repoRoot, [
    "ls-tree", "-r", "--name-only", sourceA, ".planning/artifacts",
  ])
    .split("\n")
    .filter((repoPath) => /formation.*(?:profile|comparison)|(?:profile|comparison).*formation/iu.test(repoPath))
  if (forbidden.length !== 0) fail("V138_SUCCESSOR_SEAL_FORMATION_PRESENT")
  return Object.freeze({
    schemaVersion: "v1.38-formation-absence-v1",
    absent: true,
    scannedRoot: sha256(canonical(sorted(PROTECTED_EVIDENCE_PATHS))),
    forbiddenPathCount: 0,
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
      canonical(deriveFormationAbsence(repoRoot, candidate.sourceCustody.sourceA))
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
    if (canonical(blobRecord(repoRoot, candidate.sourceCustody.sourceA, record.path)) !== canonical(record)) {
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

export const checkV138SuccessorSealCommit = (input: {
  readonly repoRoot: string
  readonly sourceA: string
  readonly sourceB: string
}): true => {
  const sourceA = fullCommit(input.repoRoot, input.sourceA)
  const sourceB = fullCommit(input.repoRoot, input.sourceB)
  if (
    gitText(input.repoRoot, ["rev-parse", `${sourceB}^`]) !== sourceA
  ) fail("V138_SUCCESSOR_SEAL_B_PARENT_INVALID")
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
    if (gitText(input.repoRoot, ["cat-file", "-t", `${sourceB}:${repoPath}`]) !== "blob") {
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
    !authorizationBytes.equals(Buffer.from(canonical(checkedAuthorization))) ||
    !sealBytes.equals(Buffer.from(canonical(checkedSeal))) ||
    checkedAuthorization.sourceA !== sourceA ||
    checkedSeal.sourceCustody.sourceA !== sourceA
  ) fail("V138_SUCCESSOR_SEAL_B_BYTES_INVALID")
  try {
    gitText(input.repoRoot, [
      "cat-file", "-e", `${sourceB}:${CANONICAL_PATHS.terminal}`,
    ])
    fail("V138_SUCCESSOR_SEAL_TERMINAL_PRESENT_AT_B")
  } catch (error) {
    if (error instanceof TypeError) throw error
  }
  try {
    gitText(input.repoRoot, ["cat-file", "-e", `${sourceA}:${CANONICAL_PATHS.seal}`])
    fail("V138_SUCCESSOR_SEAL_EXISTED_AT_A")
  } catch (error) {
    if (error instanceof TypeError) throw error
  }
  return true
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
  return resolved
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
  target: string,
  value: unknown,
): void => {
  const bytes = Buffer.from(canonical(value), "utf8")
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
    writeFileSync(descriptor, bytes)
    fsyncSync(descriptor)
    published = fstatSync(descriptor)
  } finally {
    closeSync(descriptor)
  }
  const checkDescriptor = openSync(
    target,
    constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0),
  )
  try {
    const checked = fstatSync(checkDescriptor)
    const checkedBytes = readFileSync(checkDescriptor)
    if (
      checked.dev !== published!.dev ||
      checked.ino !== published!.ino ||
      !checkedBytes.equals(bytes)
    ) {
      fail("V138_PLAN_262_15_READBACK_FAILED")
    }
  } finally {
    closeSync(checkDescriptor)
  }
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
  writeCanonicalExclusive(target, authorization)
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
  writeCanonicalExclusive(target, checked)
  return checked
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
    reviewFix: canonicalPath(repoRoot, paths.reviewFix, CANONICAL_PATHS.reviewFix),
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
  writeCanonicalExclusive(target, terminal)
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
  if (
    reviewFixBytes !== undefined
  ) {
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
  if (args[0] === "--write-plan-262-15-authorization-v1") {
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
    if (reviewMetadata.sourceA !== args[4]) {
      fail("V138_PLAN_262_15_REVIEW_SOURCE_JOIN_INVALID")
    }
    const reviewFixBytes = regularFile(
      path.resolve(repoRoot, args[8]!),
      reviewMetadata.fixesApplied ? "required" : "optional",
    )
    if (reviewFixBytes !== undefined) strictFixReportMetadata(reviewFixBytes)
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
