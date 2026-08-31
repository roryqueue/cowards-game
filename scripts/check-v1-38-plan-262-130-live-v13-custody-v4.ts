import { execFileSync, spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync,
  writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import ts from "typescript"
import {
  checkV138PathStableCustodyForReview,
  computeV138PathStableLocalExecutionClosureRoot,
  deriveV138PathStableCustody,
  type V138PathStableCustody,
} from "./lib/v1-38-bounded-retry-v3-path-stable-custody-v1.js"

type Sha = `sha256:${string}`
const PHASE = ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con"
const SUBJECT_COMMIT = "3882cd5d3ec7a834e1de88254dd0daf955da12aa"
const REVIEW_COMMIT = "73d1be605aa68a7789c53ce78b20f4922b8b7cec"
const REVIEW_TREE = "97fa619c4915b6690441d2e4a08cce52c62777ae"
const REVIEW_PARENT = "86d7f63ad5a963d706bd0d577ce72ce4eff6b9c0"
const REVIEW_BLOB = "4fc9c04dd5b249625d2d326786e53465dc838425"
const REVIEW_SHA256 = "f41d9871c7c5fea9f779ff26f8965c8f45fe16061a62ff8b8f033afb2f2f3b5d"
const REVIEW_PATH = `${PHASE}/262-122-CODE-REVIEW.md`
const B331_COMMIT = "b331baad29053f523233558f66aa2855f2925b2b"
const V3_PUBLICATION_COMMIT = "65a7a246627a411c45ced95bfb3c0296f0f8e4eb"
const V3_PATHS = Object.freeze([
  ".planning/artifacts/v1.38-plan-262-122-live-v13-custody-review-carrier-v3.json",
  ".planning/artifacts/v1.38-plan-262-122-live-v13-custody-review-payload-v3.json",
  `${PHASE}/262-122-REVIEW-v3.md`,
] as const)
const V3_BLOBS = Object.freeze([
  "d9b456a89151c3b9f0e6fa810badc19f89ac66f5",
  "7f68c4fc19b942ddc0e99e207b70751587273cc2",
  "5ea309e2e1d9c3aecf8df7bcd4987bab0ff61f3a",
] as const)
const EFFECT_PATHS = Object.freeze([
  ".planning/artifacts/v1.38-current-matrix-retry-journal-v3.jsonl",
  ".planning/artifacts/v1.38-current-matrix-retry-journal-v3.jsonl.lock",
  ".planning/artifacts/v1.38-current-matrix-retry-private-v3",
  ".planning/artifacts/v1.38-current-matrix-retry-terminal-v3.json",
  ".planning/artifacts/v1.38-current-matrix-reproduction-v17.json",
  ".planning/artifacts/v1.38-plan-262-94-admission-disposition-v3.json",
  ".planning/artifacts/v1.38-plan-262-route-11-activation-v1.json",
  ".planning/artifacts/v1.38-plan-262-95-lifecycle-driver-readiness-v3.json",
])

const CHECKOUT_PATHS = Object.freeze([
  "scripts/lib/v1-38-bounded-retry-envelope-v3.ts",
  "scripts/lib/v1-38-bounded-retry-v3-native-custody-v1.ts",
  "scripts/lib/v1-38-bounded-retry-v3-path-stable-custody-v1.ts",
  "scripts/native/v1-38-bounded-retry-v3-owner-lock-v1.c",
  "scripts/run-v1-38-bounded-retry-envelope-v3.ts",
  "scripts/run-v1-38-bounded-retry-envelope-v3-live-v9.ts",
  "scripts/run-v1-38-bounded-retry-envelope-v3-live-v10.ts",
  "scripts/run-v1-38-bounded-retry-envelope-v3-live-v13.ts",
  "scripts/run-v1-38-bounded-retry-envelope-v3-live-v13.test.ts",
] as const)
const MODES = Object.freeze([
  "--check-source-only",
  "--check-prospective-custody",
  "--check-post-run-custody",
  "--check-non-pass-value",
  "--check-bounded-success-value",
  "--check-exact-reproduction-v17-value",
] as const)
const LOCAL_NATIVE_PATHS = Object.freeze([
  "scripts/native/v1-38-successor-transaction-helper-v6.c",
  "scripts/native/v1-38-bounded-retry-v3-owner-lock-v1.c",
] as const)

export const V138_PLAN130_B331_SCOPE = Object.freeze([
  `A\t${PHASE}/262-120-SUMMARY.md`,
  `A\t${PHASE}/262-93-SUMMARY.md`,
  "M\t.planning/ROADMAP.md",
  "M\t.planning/STATE.md",
  `M\t${PHASE}/262-110-PLAN.md`,
  `M\t${PHASE}/262-122-PLAN.md`,
  `M\t${PHASE}/262-93-PRESTART-INTEGRITY-STOP.md`,
].sort())

const fail = (code: string): never => { throw new TypeError(code) }
const canonical = (value: unknown): string => {
  const normalize = (item: unknown): unknown => Array.isArray(item)
    ? item.map(normalize)
    : item !== null && typeof item === "object"
      ? Object.fromEntries(Object.entries(item as Record<string, unknown>)
          .sort(([a], [b]) => a.localeCompare(b)).map(([key, child]) => [key, normalize(child)]))
      : item
  return `${JSON.stringify(normalize(value))}\n`
}
const sha = (value: string | Uint8Array): Sha =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`
const rooted = (domain: string, value: unknown): Sha => sha(`${domain}\0${canonical(value)}`)
const git = (root: string, args: readonly string[]): string =>
  execFileSync("/usr/bin/git", ["-c", "core.hooksPath=/dev/null", ...args], {
    cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
  }).trim()

export const assertV138Plan130ExactB331ScopeForReview = (
  entries: readonly string[],
): readonly string[] => {
  const actual = [...entries].sort()
  if (canonical(actual) !== canonical(V138_PLAN130_B331_SCOPE))
    fail("V138_PLAN130_B331_SCOPE_INVALID")
  return Object.freeze(actual)
}

export const assertV138Plan130StrictLaterHeadForReview = (
  publicationCommit: string,
  headCommit: string,
  isAncestor: boolean,
): true => {
  if (!/^[0-9a-f]{40}$/u.test(publicationCommit) || !/^[0-9a-f]{40}$/u.test(headCommit) ||
      publicationCommit === headCommit || !isAncestor)
    fail("V138_PLAN130_PUBLICATION_NOT_STRICT_ANCESTOR")
  return true
}

export const computeV138Plan130RootRelativeNativeCustodyForReview = (rootInput: string) => {
  const root = path.resolve(rootInput)
  const paths = LOCAL_NATIVE_PATHS.map((repoPath) => path.join(root, ...repoPath.split("/")))
  const manifest = paths.map((absolute) => [absolute, sha(readFileSync(absolute))] as const)
  return Object.freeze({ paths: Object.freeze(paths), root: sha(canonical(manifest)) })
}

export const inspectV138Plan130BoundarySourceForReview = (source: string) => {
  const sourceFile = ts.createSourceFile("live-v13.ts", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  const producerModule = "./run-v1-38-bounded-retry-envelope-v3.js"
  const producerName = "runV138V3ProductionLive"
  const pinnedSubjectInspectorSha =
    "sha256:2163fcd7a7d985dcc6d7f8033698d2dd7d1be2b77df145ccf592397aea6cf39a"
  const imports = sourceFile.statements.filter((statement): statement is ts.ImportDeclaration =>
    ts.isImportDeclaration(statement) && ts.isStringLiteral(statement.moduleSpecifier) &&
    statement.moduleSpecifier.text === producerModule)
  const bindings = imports.flatMap((statement) => {
    const named = statement.importClause?.namedBindings
    return named !== undefined && ts.isNamedImports(named) ? [...named.elements] : []
  })
  const stringBindings = new Map<string, string>()
  const rootAliases = new Set(["globalThis", "process", "module", "Reflect"])
  const constantString = (node: ts.Expression): string | undefined => {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text
    if (ts.isIdentifier(node)) return stringBindings.get(node.text)
    if (ts.isParenthesizedExpression(node)) return constantString(node.expression)
    if (ts.isAsExpression(node) || ts.isTypeAssertionExpression(node)) return constantString(node.expression)
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
      const left = constantString(node.left)
      const right = constantString(node.right)
      return left === undefined || right === undefined ? undefined : left + right
    }
    if (ts.isTemplateExpression(node)) {
      let value = node.head.text
      for (const span of node.templateSpans) {
        const expression = constantString(span.expression)
        if (expression === undefined) return undefined
        value += expression + span.literal.text
      }
      return value
    }
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) &&
        node.expression.name.text === "join" && ts.isArrayLiteralExpression(node.expression.expression) &&
        node.arguments.length <= 1) {
      const delimiter = node.arguments[0] === undefined ? "," : constantString(node.arguments[0])
      const parts = node.expression.expression.elements.map((element) =>
        ts.isSpreadElement(element) ? undefined : constantString(element as ts.Expression))
      if (delimiter !== undefined && parts.every((part): part is string => part !== undefined))
        return parts.join(delimiter)
    }
    return undefined
  }
  const forbidden = ["constructor", "eval", "Function", "AsyncFunction", "GeneratorFunction",
    "require", "createRequire", "getBuiltinModule", producerName, producerModule]
  let dangerous = 0
  let producerReferences = 0
  let producerCalls = 0
  let ownerCalls = 0
  let acceptedProcessReferences = 0
  const declarations: ts.VariableDeclaration[] = []
  const collectDeclarations = (node: ts.Node): void => {
    if (ts.isVariableDeclaration(node)) declarations.push(node)
    ts.forEachChild(node, collectDeclarations)
  }
  collectDeclarations(sourceFile)
  for (let pass = 0; pass < declarations.length; pass += 1) {
    let changed = false
    for (const declaration of declarations) {
      if (!ts.isIdentifier(declaration.name) || declaration.initializer === undefined) continue
      const value = constantString(declaration.initializer)
      if (value !== undefined && stringBindings.get(declaration.name.text) !== value) {
        stringBindings.set(declaration.name.text, value); changed = true
      }
      if (ts.isIdentifier(declaration.initializer) && rootAliases.has(declaration.initializer.text) &&
          !rootAliases.has(declaration.name.text)) {
        rootAliases.add(declaration.name.text); changed = true
      }
    }
    if (!changed) break
  }
  const sensitiveComputedBase = (node: ts.Expression): boolean => {
    if (ts.isParenthesizedExpression(node) || ts.isAsExpression(node) || ts.isTypeAssertionExpression(node))
      return sensitiveComputedBase(node.expression)
    if (ts.isIdentifier(node)) return rootAliases.has(node.text) || node.text === "process"
    return ts.isPropertyAccessExpression(node) && node.expression.getText(sourceFile) === "process" &&
      node.name.text === "mainModule"
  }
  const exactNumeric = (node: ts.Expression | undefined, value: string): boolean =>
    node !== undefined && ts.isNumericLiteral(node) && node.text === value
  const allowedProcessReference = (node: ts.Identifier): boolean => {
    const argvOrStdout = node.parent
    if (!ts.isPropertyAccessExpression(argvOrStdout) || argvOrStdout.expression !== node) return false
    if (argvOrStdout.name.text === "stdout") {
      const write = argvOrStdout.parent
      return ts.isPropertyAccessExpression(write) && write.expression === argvOrStdout &&
        write.name.text === "write" && ts.isCallExpression(write.parent) && write.parent.expression === write
    }
    if (argvOrStdout.name.text !== "argv") return false
    const use = argvOrStdout.parent
    if (ts.isElementAccessExpression(use) && use.expression === argvOrStdout)
      return exactNumeric(use.argumentExpression, "1")
    return ts.isPropertyAccessExpression(use) && use.expression === argvOrStdout &&
      use.name.text === "slice" && ts.isCallExpression(use.parent) && use.parent.expression === use &&
      use.parent.arguments.length === 1 && exactNumeric(use.parent.arguments[0], "2")
  }
  const forbiddenToken = /(?:^|[^A-Za-z0-9_$])(?:Reflect|globalThis|global|eval|Function|AsyncFunction|GeneratorFunction|constructor|createRequire|getBuiltinModule|require)(?:$|[^A-Za-z0-9_$])/u
  const visit = (node: ts.Node): void => {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) &&
        node.name.text === "inspectV138LiveV13ProductionBoundarySourceForReview") {
      if (sha(node.getText(sourceFile)) !== pinnedSubjectInspectorSha) dangerous += 1
      return
    }
    if (ts.isIdentifier(node) && node.text === "process") {
      if (!allowedProcessReference(node)) dangerous += 1
      else acceptedProcessReferences += 1
    }
    if (ts.isIdentifier(node) && ["Reflect", "globalThis", "global", "eval", "Function",
      "AsyncFunction", "GeneratorFunction", "constructor", "createRequire", "getBuiltinModule",
      "require"].includes(node.text)) dangerous += 1
    if ((ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) &&
        forbiddenToken.test(node.text)) dangerous += 1
    if (ts.isIdentifier(node) && ["eval", "Function", "AsyncFunction", "GeneratorFunction",
      "require", "createRequire", "getBuiltinModule"].includes(node.text)) dangerous += 1
    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) dangerous += 1
    if (ts.isPropertyAccessExpression(node) &&
        (forbidden.includes(node.name.text) ||
          (node.expression.getText(sourceFile) === "import.meta" && node.name.text === "resolve")))
      dangerous += 1
    if (ts.isElementAccessExpression(node) && node.argumentExpression !== undefined) {
      const value = constantString(node.argumentExpression)
      if (sensitiveComputedBase(node.expression) ||
          (value !== undefined && forbidden.some((name) => value.includes(name)))) dangerous += 1
    }
    if (ts.isBinaryExpression(node) || ts.isTemplateExpression(node)) {
      const value = constantString(node as ts.Expression)
      if (value !== undefined && forbidden.some((name) => value.includes(name))) dangerous += 1
    }
    if (ts.isIdentifier(node) && node.text === producerName) producerReferences += 1
    if (ts.isVariableDeclaration(node) && !ts.isIdentifier(node.name) && node.initializer !== undefined &&
        sensitiveComputedBase(node.initializer)) dangerous += 1
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) &&
        node.expression.expression.getText(sourceFile) === "Reflect") dangerous += 1
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) &&
        node.expression.text === producerName) producerCalls += 1
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) &&
        node.expression.text === "runV138ReviewedBoundedLiveEnvelopeV13") ownerCalls += 1
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)
  if (imports.length !== 1 || bindings.length !== 2 ||
      !bindings.some((binding) => binding.name.text === producerName && binding.propertyName === undefined) ||
      producerReferences !== 2 || producerCalls !== 1 || ownerCalls !== 1 ||
      acceptedProcessReferences !== 4 || dangerous !== 0)
    fail("V138_PLAN130_PRODUCTION_BOUNDARY_INVALID")
  return Object.freeze({ producerCallSites: 1 as const, producerCalls: 0 as const,
    readinessInvoked: false as const, liveInvoked: false as const,
    authorizesExecution: false as const, downstreamAuthority: "denied" as const })
}

export const authenticateV138Plan130V3InvalidationForReview = (rootInput: string) => {
  const root = path.resolve(rootInput)
  const scope = git(root, ["diff-tree", "--no-commit-id", "--name-status", "-r", V3_PUBLICATION_COMMIT])
    .split("\n").filter(Boolean).sort()
  if (canonical(scope) !== canonical(V3_PATHS.map((repoPath) => `A\t${repoPath}`).sort()))
    fail("V138_PLAN130_V3_PUBLICATION_SCOPE_INVALID")
  for (const [index, repoPath] of V3_PATHS.entries()) {
    if (git(root, ["ls-tree", V3_PUBLICATION_COMMIT, "--", repoPath]) !==
        `100644 blob ${V3_BLOBS[index]}\t${repoPath}` ||
        git(root, ["log", "--format=%H", `${V3_PUBLICATION_COMMIT}..HEAD`, "--", repoPath]) !== "")
      fail(`V138_PLAN130_V3_BYTES_INVALID:${repoPath}`)
  }
  const payload = JSON.parse(execFileSync("/usr/bin/git", ["show", `${V3_PUBLICATION_COMMIT}:${V3_PATHS[1]}`],
    { cwd: root, encoding: "utf8" })) as Record<string, unknown>
  if (payload.plan110Eligible !== true || payload.findingCount !== 0 || payload.actualModesPassed !== 6)
    fail("V138_PLAN130_V3_STORED_SEMANTICS_INVALID")
  return Object.freeze({ publicationCommit: V3_PUBLICATION_COMMIT, storedPlan110Eligible: true as const,
    currentPlan110Eligible: false as const, disposition: "process_invalid_false_clean_custody" as const })
}

const authenticateCommittedReview = (root: string): void => {
  if (git(root, ["rev-parse", `${REVIEW_COMMIT}^{tree}`]) !== REVIEW_TREE ||
      git(root, ["rev-parse", `${REVIEW_COMMIT}^`]) !== REVIEW_PARENT ||
      git(root, ["ls-tree", REVIEW_COMMIT, "--", REVIEW_PATH]) !==
        `100644 blob ${REVIEW_BLOB}\t${REVIEW_PATH}` ||
      sha(execFileSync("/usr/bin/git", ["cat-file", "blob", `${REVIEW_COMMIT}:${REVIEW_PATH}`],
        { cwd: root })) !== `sha256:${REVIEW_SHA256}`)
    fail("V138_PLAN130_REVIEW_CUSTODY_INVALID")
  execFileSync("/usr/bin/git", ["merge-base", "--is-ancestor", REVIEW_COMMIT, "HEAD"], { cwd: root })
  assertV138Plan130ExactB331ScopeForReview(
    git(root, ["diff-tree", "--no-commit-id", "--name-status", "-r", B331_COMMIT])
      .split("\n").filter(Boolean),
  )
}

const derive = (root: string): V138PathStableCustody => {
  const importedCustody = deriveV138PathStableCustody(root, {
    sourceCommit: SUBJECT_COMMIT,
    checkoutPaths: CHECKOUT_PATHS,
  })
  const native = computeV138Plan130RootRelativeNativeCustodyForReview(root)
  const localBody = {
    reviewedClosureRoot: importedCustody.reviewedClosureRoot,
    localInstalledClosureRoot: importedCustody.localInstalledClosureRoot,
    localGitObjectRoot: importedCustody.localGitObjectRoot,
    localNativeSourcesRoot: native.root,
  }
  const custody = Object.freeze({ ...importedCustody, ...localBody,
    localExecutionClosureRoot: computeV138PathStableLocalExecutionClosureRoot(localBody) })
  checkV138PathStableCustodyForReview(custody, custody)
  return custody
}

const linkDependencies = (sourceRoot: string, linkedRoot: string): void => {
  symlinkSync(path.join(sourceRoot, "node_modules"), path.join(linkedRoot, "node_modules"), "dir")
  for (const workspace of ["apps/runtime-service", "apps/web", "apps/worker", "packages/engine",
    "packages/golden", "packages/map-configs", "packages/persistence", "packages/replay",
    "packages/runtime-js", "packages/runtime-python", "packages/runtime-supervisor",
    "packages/runtime-wasm-wasi", "packages/service", "packages/spec", "packages/test-utils"]) {
    const source = path.join(sourceRoot, workspace, "node_modules")
    if (!existsSync(source)) continue
    const destination = path.join(linkedRoot, workspace, "node_modules")
    mkdirSync(path.dirname(destination), { recursive: true })
    symlinkSync(source, destination, "dir")
  }
}

export const executeV138Plan130ZeroEffectModesForReview = (rootInput: string) => {
  const root = path.resolve(rootInput)
  for (const repoPath of EFFECT_PATHS)
    if (existsSync(path.join(root, ...repoPath.split("/")))) fail(`V138_PLAN130_EFFECT_PRESENT:${repoPath}`)
  const exactSource = readFileSync(path.join(root,
    "scripts/run-v1-38-bounded-retry-envelope-v3-live-v13.ts"), "utf8")
  inspectV138Plan130BoundarySourceForReview(exactSource)
  const owner = mkdtempSync(path.join(tmpdir(), "v138-plan130-zero-effect-"))
  const linked = path.join(owner, "repo")
  const guardPath = path.join(owner, "producer-guard.jsonl")
  let added = false
  try {
    git(root, ["worktree", "add", "--quiet", "--detach", linked, SUBJECT_COMMIT])
    added = true
    linkDependencies(root, linked)
    chmodSync(path.join(linked, ".planning/artifacts/v1.38-successor-source-seal-v13.json"), 0o600)
    chmodSync(path.join(linked, ".planning/artifacts/v1.38-plan-262-90-retry-envelope-v3.json"), 0o600)
    const source = readFileSync(path.join(linked,
      "scripts/run-v1-38-bounded-retry-envelope-v3-live-v13.ts"), "utf8")
    const aliased = source.replace("  runV138V3ProductionLive,\n",
      "  runV138V3ProductionLive as importedRunV138V3ProductionLive,\n")
    const guarded = aliased.replace("type Sha = `sha256:${string}`",
      `import { appendFileSync as appendV138Plan130Guard } from "node:fs"\nconst runV138V3ProductionLive: typeof importedRunV138V3ProductionLive = async (..._args) => { appendV138Plan130Guard(${JSON.stringify(guardPath)}, "invoked\\n", { mode: 0o600 }); throw new Error("V138_PLAN130_PRODUCER_GUARD_TRIPPED") }\n\ntype Sha = \`sha256:\${string}\``)
    if (aliased === source || guarded === aliased) fail("V138_PLAN130_GUARD_INSTRUMENTATION_INVALID")
    const guardedPath = path.join(linked, "scripts/.plan130-live-v13-guarded.ts")
    writeFileSync(guardedPath, guarded, { flag: "wx", mode: 0o600 })
    for (const mode of ["--check-source-only", "--check-prospective-custody"] as const) {
      const result = spawnSync(path.join(linked, "node_modules/.bin/tsx"), [guardedPath, mode], {
        cwd: linked, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
        env: { PATH: `${path.dirname(process.execPath)}:/usr/bin:/bin`, HOME: owner,
          LANG: "C", LC_ALL: "C" },
      })
      if (result.status !== 0 || existsSync(guardPath)) fail(`V138_PLAN130_ZERO_EFFECT_MODE_INVALID:${mode}`)
      for (const repoPath of EFFECT_PATHS)
        if (existsSync(path.join(linked, ...repoPath.split("/"))))
          fail(`V138_PLAN130_EFFECT_CREATED:${mode}:${repoPath}`)
    }
  } finally {
    if (added) git(root, ["worktree", "remove", "--force", linked])
    rmSync(owner, { recursive: true, force: true })
  }
  return Object.freeze({ actualModesPassed: 2 as const, producerGuardCount: 0 as const,
    producerCalls: 0 as const, readinessInvoked: false as const, liveInvoked: false as const,
    freshCharged: 0 as const, freshAccepted: 0 as const, authorizesExecution: false as const,
    downstreamAuthority: "denied" as const })
}

export const executeV138Plan130DisposableCustodyForReview = (rootInput: string) => {
  const root = path.resolve(rootInput)
  authenticateCommittedReview(root)
  const canonicalBefore = derive(root)
  const observations: Array<Record<string, unknown>> = []
  for (const [index, mode] of MODES.entries()) {
    const owner = mkdtempSync(path.join(tmpdir(), `v138-plan130-mode-${index}-`))
    const linked = path.join(owner, "repo")
    let added = false
    try {
      git(root, ["worktree", "add", "--quiet", "--detach", linked, SUBJECT_COMMIT])
      added = true
      linkDependencies(root, linked)
      const disposable = derive(linked)
      checkV138PathStableCustodyForReview(disposable, disposable)
      if (disposable.reviewedClosureRoot !== canonicalBefore.reviewedClosureRoot)
        fail(`V138_PLAN130_DISPOSABLE_PORTABLE_CUSTODY_INVALID:${mode}`)
      const localBody = {
        reviewedClosureRoot: disposable.reviewedClosureRoot,
        localInstalledClosureRoot: disposable.localInstalledClosureRoot,
        localGitObjectRoot: disposable.localGitObjectRoot,
        localNativeSourcesRoot: disposable.localNativeSourcesRoot,
      }
      const localExecution = computeV138PathStableLocalExecutionClosureRoot(localBody)
      if (localExecution !== disposable.localExecutionClosureRoot)
        fail(`V138_PLAN130_DISPOSABLE_LOCAL_CUSTODY_INVALID:${mode}`)
      const body = Object.freeze({ mode, status: "custody_checked", producerGuardCount: 0 as const,
        disposableReviewedClosureRoot: disposable.reviewedClosureRoot,
        disposableLocalInstalledClosureRoot: disposable.localInstalledClosureRoot,
        disposableLocalGitObjectRoot: disposable.localGitObjectRoot,
        disposableLocalNativeSourcesRoot: disposable.localNativeSourcesRoot,
        disposableLocalNativeSourcePaths:
          computeV138Plan130RootRelativeNativeCustodyForReview(linked).paths,
        disposableLocalExecutionClosureRoot: localExecution })
      observations.push(Object.freeze({ ...body,
        observationRoot: rooted("v138-plan-262-130-mode-observation-v4", body) }))
    } finally {
      if (added) git(root, ["worktree", "remove", "--force", linked])
      rmSync(owner, { recursive: true, force: true })
    }
  }
  const canonicalAfter = derive(root)
  if (canonical(canonicalAfter) !== canonical(canonicalBefore))
    fail("V138_PLAN130_CANONICAL_CUSTODY_CHANGED")
  return Object.freeze({ actualModesPassed: observations.length, observations: Object.freeze(observations),
    findings: Object.freeze([]), canonicalBefore, canonicalAfter,
    producerCalls: 0 as const, readinessInvoked: false as const, liveInvoked: false as const,
    freshCharged: 0 as const, freshAccepted: 0 as const, authorizesExecution: false as const,
    downstreamAuthority: "denied" as const })
}

const execute = (args: readonly string[]): void => {
  if (args.length !== 1 || args[0] !== "--check-source-only") fail("V138_PLAN130_ARGUMENTS_INVALID")
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
  authenticateCommittedReview(root)
  const v3 = authenticateV138Plan130V3InvalidationForReview(root)
  const modes = executeV138Plan130ZeroEffectModesForReview(root)
  process.stdout.write(`${JSON.stringify({ sourceOnly: true, plan110Eligible: false,
    v3Disposition: v3.disposition, ...modes })}\n`)
}

if (process.argv[1] !== undefined && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  execute(process.argv.slice(2))
