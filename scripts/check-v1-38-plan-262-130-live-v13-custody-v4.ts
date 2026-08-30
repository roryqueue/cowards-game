import { execFileSync } from "node:child_process"
import { createHash } from "node:crypto"
import { existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
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
  const custody = deriveV138PathStableCustody(root, {
    sourceCommit: SUBJECT_COMMIT,
    checkoutPaths: CHECKOUT_PATHS,
  })
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
      const disposable = deriveV138PathStableCustody(linked, {
        sourceCommit: SUBJECT_COMMIT,
        checkoutPaths: CHECKOUT_PATHS,
      })
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
  process.stdout.write(`${JSON.stringify({ sourceOnly: true, plan110Eligible: false,
    producerCalls: 0, readinessInvoked: false, liveInvoked: false, freshCharged: 0,
    freshAccepted: 0, authorizesExecution: false, downstreamAuthority: "denied" })}\n`)
}

if (process.argv[1] !== undefined && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  execute(process.argv.slice(2))
