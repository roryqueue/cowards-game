import { Buffer } from "node:buffer"
import { createHash } from "node:crypto"
import {
  closeSync,
  constants,
  fsyncSync,
  lstatSync,
  openSync,
  readFileSync,
  writeFileSync,
} from "node:fs"
import { execFileSync } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from "node:url"
import ts from "typescript"

type Sha256 = `sha256:${string}`

const sha256 = (value: string | Uint8Array): Sha256 =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`
const canonical = (value: unknown): string => `${JSON.stringify(value)}\n`
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
  const resolved = gitText(repoRoot, [
    "rev-parse",
    "--verify",
    `${value}^{commit}`,
  ])
  if (!/^[0-9a-f]{40}$/u.test(resolved)) fail("V138_SOURCE_COMMIT_INVALID")
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
      values.push(node.moduleSpecifier.text)
    } else if (ts.isImportEqualsDeclaration(node)) {
      if (
        !ts.isExternalModuleReference(node.moduleReference) ||
        node.moduleReference.expression === undefined ||
        !ts.isStringLiteral(node.moduleReference.expression)
      ) {
        fail("V138_SELECTED_ROUTE_NONLITERAL_STATIC_EDGE")
      }
      values.push(node.moduleReference.expression.text)
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
      values.push(node.arguments[0]!.text)
    }
    ts.forEachChild(node, visit)
  }
  visit(file)
  return values
}

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

export const deriveSelectedRouteClosureAtCommit = (
  repoRoot: string,
  sourceAInput: string,
): Readonly<V138SelectedRouteClosure> => {
  const sourceA = fullCommit(repoRoot, sourceAInput)
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
      for (const [key, value] of Object.entries(parsed.exports)) {
        if (typeof value !== "string") {
          fail("V138_SELECTED_ROUTE_EXPORT_CONDITION_AMBIGUOUS")
        }
        exports[key] = value
      }
    } else if (typeof parsed.main === "string") {
      exports["."] = parsed.main
    } else {
      exports["."] = "./src/index.ts"
    }
    return {
      name: parsed.name,
      root: path.posix.dirname(packagePath),
      exports,
    }
  })
  const resolve = (from: string, specifier: string): string | undefined => {
    if (specifier.startsWith("node:")) return undefined
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
      const workspace = packages.find(
        (entry) =>
          specifier === entry.name || specifier.startsWith(`${entry.name}/`),
      )
      if (workspace === undefined) {
        // Node builtins and lock-bound third-party packages do not contribute
        // repository TypeScript source to this closure.
        return undefined
      }
      const subpath =
        specifier === workspace.name
          ? "."
          : `./${specifier.slice(workspace.name.length + 1)}`
      const selected = workspace.exports[subpath]
      if (selected === undefined) {
        fail("V138_SELECTED_ROUTE_PACKAGE_EXPORT_UNRESOLVED")
      }
      bases = [path.posix.join(workspace.root, selected)]
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
  const pending = [...V138_SELECTED_ROUTE_ROOTS]
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
    "tsconfig.json",
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
  return Object.freeze({
    ...identity,
    roots: V138_SELECTED_ROUTE_ROOTS,
    paths: Object.freeze(paths),
    edges: Object.freeze(canonicalEdges.map(Object.freeze)),
    sourceBlobs: Object.freeze(sourceBlobs),
    resolverMetadata: Object.freeze(resolverMetadata),
    closureRoot: sha256(canonical(identity)),
  })
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
): Readonly<V138Plan26215Terminal> => {
  const target = canonicalPath(repoRoot, targetPath, CANONICAL_PATHS.terminal)
  const body = {
    schemaVersion: "v1.38-plan-262-15-terminal-v1" as const,
    disposition,
    authorityExpired: true as const,
    acceptedCellCount: 0 as const,
  }
  const terminal = Object.freeze({
    ...body,
    terminalRoot: sha256(canonical(body)),
  })
  const descriptor = openSync(
    target,
    constants.O_CREAT |
      constants.O_EXCL |
      constants.O_WRONLY |
      (constants.O_NOFOLLOW ?? 0),
    0o600,
  )
  try {
    writeFileSync(descriptor, canonical(terminal), { encoding: "utf8" })
    fsyncSync(descriptor)
  } finally {
    closeSync(descriptor)
  }
  if (readFileSync(target, "utf8") !== canonical(terminal)) {
    fail("V138_PLAN_262_15_TERMINAL_READBACK_FAILED")
  }
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
      candidate.schemaVersion !== "v1.38-plan-262-15-terminal-v1" ||
      (candidate.disposition !== "seal_refused" &&
        candidate.disposition !== "seal_failed") ||
      candidate.authorityExpired !== true ||
      candidate.acceptedCellCount !== 0
    ) {
      fail("V138_PLAN_262_15_TERMINAL_INVALID")
    }
    const { terminalRoot, ...body } = candidate
    if (terminalRoot !== sha256(canonical(body))) {
      fail("V138_PLAN_262_15_TERMINAL_INVALID")
    }
    disposition = candidate.disposition
  }
  regularFile(resolved.review, "required")
  // Review-Fix has canonical optional semantics; its contents are validated by
  // the review checker that records whether fixes occurred.
  regularFile(resolved.reviewFix, "optional")
  regularFile(
    resolved.authorization,
    disposition !== "seal_refused" ? "required" : "absent",
  )
  regularFile(resolved.seal, disposition === "sealed" ? "required" : "absent")
  return disposition
}

const runCli = (): void => {
  if (process.argv[1] !== fileURLToPath(import.meta.url)) return
  const repoRoot = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../..",
  )
  const args = process.argv.slice(2)
  if (args[0] === "--write-plan-262-15-terminal-v1") {
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
    writePlan26215Terminal(repoRoot, args[1]!, args[3])
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
    regularFile(path.resolve(repoRoot, args[6]!), "required")
    regularFile(path.resolve(repoRoot, args[8]!), "optional")
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
    const parsed = JSON.parse(
      regularFile(sealPath, "required")!.toString("utf8"),
    ) as { sourceA?: unknown; selectedRouteClosure?: unknown }
    if (
      typeof parsed.sourceA !== "string" ||
      parsed.selectedRouteClosure === null ||
      typeof parsed.selectedRouteClosure !== "object" ||
      Array.isArray(parsed.selectedRouteClosure)
    ) {
      fail("V138_SUCCESSOR_SEAL_CLOSURE_INVALID")
    }
    const closure = checkSelectedRouteClosureAtCommit(
      repoRoot,
      parsed.sourceA,
      parsed.selectedRouteClosure as V138SelectedRouteClosure,
    )
    process.stdout.write(
      canonical({
        sourceA: closure.sourceA,
        pathCount: closure.paths.length,
        closureRoot: closure.closureRoot,
      }),
    )
  }
}

runCli()
