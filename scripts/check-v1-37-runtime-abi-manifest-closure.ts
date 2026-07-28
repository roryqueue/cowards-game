import { createHash } from "node:crypto"
import { spawnSync } from "node:child_process"
import {
  existsSync,
  lstatSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs"
import { isAbsolute, posix, relative, resolve } from "node:path"
// eslint-disable-next-line no-restricted-imports -- This repository gate verifies the source-owned tuple without a built workspace package.
import {
  CURRENT_CANONICAL_COMPATIBILITY_TUPLE_RECORD,
  CURRENT_RUNTIME_EXECUTION_SERVICE_VERSION,
  CURRENT_RUNTIME_SEMANTIC_RECEIPT_SCHEMA_VERSION,
  STRATEGY_RUNTIME_ABI_VERSION,
} from "../packages/spec/src/index.js"

export const RUNTIME_ABI_ACTIVATION_ALLOWLIST_PATH =
  "packages/spec/artifacts/runtime-abi-v1.17-activation-allowlist.json"
export const RUNTIME_ABI_ACTIVATION_MANIFEST_PATH =
  "packages/spec/artifacts/runtime-abi-v1.17-activation-manifest.json"
export const RUNTIME_ABI_TEST_RECEIPT_PATH =
  "packages/spec/artifacts/runtime-abi-v1.17-test-receipt.json"
export const RUNTIME_ABI_ACTIVATION_COMMIT =
  "ba05038f5d9b232afa1cb6c24eef1079524ffcc8"
export const RUNTIME_ABI_PHASE258_BASELINE_COMMIT =
  "4b633f2f1fc7e01a9bc12a0245982069b100c3bf"
export const RUNTIME_ABI_PHASE258_INTERLEAVED_COMMITS = Object.freeze([
  "5aff16be897ec34cfa6a104c890a8eb520a8d7e5",
  "becf9929da14aec8bffde4b36be95492cb949db1",
  "4d488ed897f90eaf4bf3cb691ae00a0c57998b17",
  "7098750bcdbb4418e96945a7baca737c7a193344",
  "5bddb034e7239e8f32a7061174d275cfef393848",
] as const)
export const RUNTIME_ABI_PHASE258_PLAN_DIRECTORY =
  ".planning/phases/258-canonical-json-failure-semantics-and-artifact-identity"
export const RUNTIME_ABI_PHASE258_PLAN_PATHS = Object.freeze(
  Array.from(
    { length: 14 },
    (_, index) =>
      `${RUNTIME_ABI_PHASE258_PLAN_DIRECTORY}/258-${String(index + 1).padStart(2, "0")}-PLAN.md`,
  ),
)

const RUNTIME_ABI_PHASE258_DECLARATION_ONLY_PATHS = Object.freeze([
  "apps/go-backend/runtime_service_client_test.go",
  "apps/web/app/api/account/revisions/save/route.ts",
  "apps/web/app/workshop/workshop-client.tsx",
  "packages/runtime-js/src/subprocess-ipc.ts",
  "packages/runtime-python/src/python_validation_host.py",
  "packages/spec/src/runtime-execution-service.ts",
  "scripts/evaluate-runtime-sandbox.ts",
] as const)

const RUNTIME_ABI_PHASE259_DIRECTORY =
  ".planning/phases/259-executable-four-language-and-chronicle-conformance"
const RUNTIME_ABI_PHASE258_INTERLEAVED_COMMIT_PATHS: Readonly<
  Record<string, readonly string[]>
> = Object.freeze({
  "5aff16be897ec34cfa6a104c890a8eb520a8d7e5": Object.freeze([
    `${RUNTIME_ABI_PHASE259_DIRECTORY}/259-RESEARCH.md`,
  ]),
  "becf9929da14aec8bffde4b36be95492cb949db1": Object.freeze([
    `${RUNTIME_ABI_PHASE259_DIRECTORY}/259-RESEARCH.md`,
  ]),
  "4d488ed897f90eaf4bf3cb691ae00a0c57998b17": Object.freeze([
    `${RUNTIME_ABI_PHASE259_DIRECTORY}/259-VALIDATION.md`,
  ]),
  "7098750bcdbb4418e96945a7baca737c7a193344": Object.freeze([
    `${RUNTIME_ABI_PHASE259_DIRECTORY}/259-PATTERNS.md`,
  ]),
  "5bddb034e7239e8f32a7061174d275cfef393848": Object.freeze([
    ".planning/ROADMAP.md",
    ".planning/STATE.md",
    ...Array.from(
      { length: 31 },
      (_, index) =>
        `${RUNTIME_ABI_PHASE259_DIRECTORY}/259-${String(index + 1).padStart(2, "0")}-PLAN.md`,
    ),
    `${RUNTIME_ABI_PHASE259_DIRECTORY}/259-PATTERNS.md`,
    `${RUNTIME_ABI_PHASE259_DIRECTORY}/259-RESEARCH.md`,
    `${RUNTIME_ABI_PHASE259_DIRECTORY}/259-VALIDATION.md`,
  ]),
})

export const RUNTIME_ABI_DERIVED_VALIDATION_OUTPUTS = Object.freeze([
  ".planning/artifacts/v1.37-runtime-abi-validation.md",
  "docs/verification.md",
  "packages/spec/artifacts/runtime-abi-v1.17-validation.json",
] as const)

export type RuntimeAbiManifestDigest = Readonly<{
  path: string
  sha256: string
}>

export type RuntimeAbiActivationManifest = Readonly<{
  schemaVersion: "runtime-abi-v1.17-activation-manifest-v1"
  activationPlan: "258-14"
  activationCommit: string
  activationDiff: readonly (AllowlistOperation & { readonly sha256: string })[]
  current: Readonly<{
    canonicalJson: "canonical-json-v1.1"
    runtimeAbi: "strategy-runtime-abi-v1.17"
    runtimeService: "runtime-execution-service-v1.17"
    semanticReceipt: "runtime-semantic-receipt-v1.17"
    semanticTuple: typeof CURRENT_CANONICAL_COMPATIBILITY_TUPLE_RECORD
  }>
  posture: Readonly<{
    countedEligibleLaneIds: readonly string[]
    productionTrustedProducers: readonly never[]
    certificationOwner: "Phase 259"
  }>
  evidenceAuthority: Readonly<{
    fixture: RuntimeAbiManifestDigest
    nodeCount: 15
    edgeCount: 26
    orderedPinCount: 10
    rootNodeId: "node:evidenceBundle"
  }>
  testReceipt: RuntimeAbiManifestDigest
  inventoryPolicy: Readonly<{
    source: "Pinned Phase 258 git closure cross-checked against PLAN files_modified plus exact PLAN bytes and the postactivation test receipt"
    baselineCommit: typeof RUNTIME_ABI_PHASE258_BASELINE_COMMIT
    closureHeadCommit: string
    activationCommit: typeof RUNTIME_ABI_ACTIVATION_COMMIT
    excludedInterleavedCommits: typeof RUNTIME_ABI_PHASE258_INTERLEAVED_COMMITS
    planFileCount: 14
    declarationOnlyPaths: typeof RUNTIME_ABI_PHASE258_DECLARATION_ONLY_PATHS
    excludedSelf: typeof RUNTIME_ABI_ACTIVATION_MANIFEST_PATH
    derivedValidationOutputs: typeof RUNTIME_ABI_DERIVED_VALIDATION_OUTPUTS
    validationDependency: "validation-consumes-manifest"
  }>
  phase258Inventory: readonly RuntimeAbiManifestDigest[]
}>

export type AllowlistOperation = Readonly<{
  path: string
  operation: "create" | "update"
}>

export type RuntimeAbiActivationAllowlist = Readonly<{
  schemaVersion: "runtime-abi-v1.17-activation-allowlist-v1"
  activationPlan: "258-14"
  operations: readonly AllowlistOperation[]
}>

export type RuntimeAbiActivationDiffMode = "none" | "staged" | "committed"

export const RUNTIME_ABI_PREPARED_LIFECYCLE_CONSUMERS = Object.freeze([
  "scripts/check-boundary-monitors.ts",
  "scripts/generate-v1-37-event-coverage.ts",
] as const)

const readJson = (path: string): unknown =>
  JSON.parse(readFileSync(path, "utf8")) as unknown

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value)

const sha256 = (bytes: Uint8Array): string =>
  createHash("sha256").update(bytes).digest("hex")

const digestPath = (
  path: string,
  readBytes: (path: string) => Uint8Array = (candidate) =>
    readFileSync(candidate),
): RuntimeAbiManifestDigest => ({ path, sha256: sha256(readBytes(path)) })

type RunGit = (
  args: readonly string[],
  options?: { readonly allowFailure?: boolean },
) => Readonly<{ status: number; stdout: string; stderr: string }>

const runGitAt = (repoRoot: string): RunGit => (args, options = {}) => {
  const result = spawnSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
  })
  const status = result.status ?? 1
  const response = {
    status,
    stdout: String(result.stdout ?? ""),
    stderr: String(result.stderr ?? ""),
  }
  if (status !== 0 && !options.allowFailure) {
    throw new TypeError(
      `Phase 258 git closure is unavailable: git ${args.join(" ")}: ${response.stderr.trim()}`,
    )
  }
  return response
}

export const parsePlanFilesModified = (source: string): readonly string[] => {
  const lines = source.split(/\r?\n/u)
  const start = lines.findIndex((line) => line === "files_modified:")
  if (start === -1) {
    throw new TypeError("Phase plan has no files_modified inventory.")
  }
  const paths: string[] = []
  for (const line of lines.slice(start + 1)) {
    if (/^[a-z_]+:/u.test(line)) break
    const match = /^ {2}- (.+)$/u.exec(line)
    if (match?.[1] !== undefined) paths.push(match[1])
  }
  if (paths.length === 0 || new Set(paths).size !== paths.length) {
    throw new TypeError("Phase plan files_modified inventory is empty or duplicated.")
  }
  return paths
}

const normalizedInventoryPath = (candidate: string): string => {
  if (
    candidate.length === 0 ||
    candidate.includes("\\") ||
    isAbsolute(candidate) ||
    posix.normalize(candidate) !== candidate ||
    candidate === "." ||
    candidate.startsWith("../")
  ) {
    throw new TypeError(`Phase inventory path is not normalized: ${candidate}`)
  }
  return candidate
}

export const expandPhase258InventoryPaths = (
  candidates: readonly string[],
  repoRoot: string = process.cwd(),
): readonly string[] => {
  const absoluteRoot = resolve(repoRoot)
  const expand = (candidate: string): readonly string[] => {
    const repoPath = normalizedInventoryPath(candidate)
    const absolutePath = resolve(absoluteRoot, repoPath)
    const relativePath = relative(absoluteRoot, absolutePath)
    if (
      relativePath === "" ||
      relativePath.startsWith("..") ||
      isAbsolute(relativePath)
    ) {
      throw new TypeError(`Phase inventory path escapes repository: ${repoPath}`)
    }
    const stat = lstatSync(absolutePath)
    if (stat.isSymbolicLink()) {
      throw new TypeError(`Phase inventory path is a symlink: ${repoPath}`)
    }
    if (stat.isFile()) return [repoPath]
    if (!stat.isDirectory()) {
      throw new TypeError(`Phase inventory path is not a regular file: ${repoPath}`)
    }
    const entries = readdirSync(absolutePath, { withFileTypes: true })
      .map(({ name }) => name)
      .sort()
    if (entries.length === 0) {
      throw new TypeError(`Phase inventory directory is empty: ${repoPath}`)
    }
    return entries.flatMap((name) => expand(posix.join(repoPath, name)))
  }

  const expanded = candidates.flatMap(expand).sort()
  if (new Set(expanded).size !== expanded.length) {
    throw new TypeError("Phase inventory contains a duplicate expanded path.")
  }
  return expanded
}

const exactSortedStrings = (
  actual: readonly string[],
  expected: readonly string[],
): boolean =>
  actual.length === expected.length &&
  actual.every((value, index) => value === expected[index])

const phase258WorkflowPath = (path: string): boolean =>
  path === ".planning/ROADMAP.md" ||
  path === ".planning/STATE.md" ||
  path.startsWith(`${RUNTIME_ABI_PHASE258_PLAN_DIRECTORY}/`) ||
  path.startsWith(
    ".planning/phases/259-executable-four-language-and-chronicle-conformance/",
  )

const phase258HashCyclePath = (path: string): boolean =>
  path === RUNTIME_ABI_ACTIVATION_MANIFEST_PATH ||
  RUNTIME_ABI_DERIVED_VALIDATION_OUTPUTS.some(
    (candidate) => candidate === path,
  )

const parsePhase258GitNameStatus = (source: string): readonly string[] => {
  const paths: string[] = []
  for (const line of source.split(/\r?\n/u).filter(Boolean)) {
    const fields = line.split("\t")
    if (
      fields.length !== 2 ||
      (fields[0] !== "A" && fields[0] !== "M") ||
      fields[1] === undefined
    ) {
      throw new TypeError(
        `Phase 258 git closure contains a forbidden name-status entry: ${line}`,
      )
    }
    paths.push(normalizedInventoryPath(fields[1]))
  }
  if (paths.length === 0 || new Set(paths).size !== paths.length) {
    throw new TypeError("Phase 258 git closure is empty or duplicated.")
  }
  return paths.sort()
}

const verifyPhase258InterleavedCommit = (
  commit: string,
  runGit: RunGit,
): void => {
  const paths = runGit([
    "diff-tree",
    "--no-commit-id",
    "--name-only",
    "-r",
    commit,
  ])
    .stdout.split(/\r?\n/u)
    .filter(Boolean)
  verifyPhase258ApprovedInterleavedCommitPaths(commit, paths)
}

export const verifyPhase258ApprovedInterleavedCommitPaths = (
  commit: string,
  paths: readonly string[],
): void => {
  const expected = RUNTIME_ABI_PHASE258_INTERLEAVED_COMMIT_PATHS[commit]
  if (
    expected === undefined ||
    !exactSortedStrings([...paths].sort(), [...expected].sort())
  ) {
    throw new TypeError(
      `Pinned interleaved commit escaped its exact planning paths: ${commit}`,
    )
  }
}

export const verifyPhase258LaterPlanningOwnership = (
  records: readonly Readonly<{ commit: string; path: string }>[],
): void => {
  const approved = new Set<string>(RUNTIME_ABI_PHASE258_INTERLEAVED_COMMITS)
  for (const record of records) {
    const path = normalizedInventoryPath(record.path)
    if (
      !/^[0-9a-f]{40}$/u.test(record.commit) ||
      !path.startsWith(`${RUNTIME_ABI_PHASE259_DIRECTORY}/`) ||
      !approved.has(record.commit)
    ) {
      throw new TypeError(
        `Phase 258 git closure contains unowned later-phase planning: ${record.commit} ${path}`,
      )
    }
  }
}

const verifyPhase258LaterPlanningCommitOwnership = (
  baselineCommit: string,
  headCommit: string,
  runGit: RunGit,
): void => {
  const records: Array<{ commit: string; path: string }> = []
  let commit: string | undefined
  for (const line of runGit([
    "log",
    "--first-parent",
    "--format=@@%H",
    "--name-only",
    `${baselineCommit}..${headCommit}`,
    "--",
    `${RUNTIME_ABI_PHASE259_DIRECTORY}/`,
  ]).stdout.split(/\r?\n/u)) {
    if (line.startsWith("@@")) {
      commit = line.slice(2)
      if (!/^[0-9a-f]{40}$/u.test(commit)) {
        throw new TypeError(
          `Phase 258 later-phase planning history is malformed: ${line}`,
        )
      }
      continue
    }
    if (!line) continue
    if (commit === undefined) {
      throw new TypeError(
        `Phase 258 later-phase planning path has no owning commit: ${line}`,
      )
    }
    records.push({ commit, path: line })
  }
  verifyPhase258LaterPlanningOwnership(records)
}

export const verifyPhase258GitClosureAncestry = (options: {
  baselineCommit: string
  headCommit: string
  runGit?: RunGit | undefined
}): void => {
  const { baselineCommit, headCommit } = options
  if (
    baselineCommit !== RUNTIME_ABI_PHASE258_BASELINE_COMMIT ||
    !/^[0-9a-f]{40}$/u.test(headCommit)
  ) {
    throw new TypeError("Phase 258 git closure has the wrong baseline or head.")
  }
  const runGit = options.runGit ?? runGitAt(process.cwd())
  for (const ancestor of [baselineCommit, RUNTIME_ABI_ACTIVATION_COMMIT]) {
    const result = runGit(
      ["merge-base", "--is-ancestor", ancestor, headCommit],
      { allowFailure: true },
    )
    if (result.status !== 0) {
      throw new TypeError(
        `Phase 258 git closure head does not descend from ${ancestor}.`,
      )
    }
  }
  const history = runGit([
    "log",
    "--first-parent",
    "--reverse",
    "--format=%H%x09%s",
    `${baselineCommit}..${headCommit}`,
  ])
    .stdout.split(/\r?\n/u)
    .filter(Boolean)
    .map((line) => {
      const separator = line.indexOf("\t")
      if (separator <= 0) {
        throw new TypeError(`Phase 258 git history entry is malformed: ${line}`)
      }
      return {
        commit: line.slice(0, separator),
        subject: line.slice(separator + 1),
      }
    })
  const commits = history.map(({ commit }) => commit)
  if (commits.at(-1) !== headCommit) {
    throw new TypeError("Phase 258 git closure head is not on first-parent ancestry.")
  }
  const interleaved = new Set<string>(RUNTIME_ABI_PHASE258_INTERLEAVED_COMMITS)
  for (const { commit, subject } of history) {
    if (interleaved.has(commit)) {
      verifyPhase258InterleavedCommit(commit, runGit)
      continue
    }
    if (!/^[a-z]+\(258(?:-\d{2})?\): /u.test(subject)) {
      throw new TypeError(
        `Phase 258 git closure contains an unowned commit: ${commit} ${subject}`,
      )
    }
  }
  verifyPhase258LaterPlanningCommitOwnership(
    baselineCommit,
    headCommit,
    runGit,
  )
}

export const collectPhase258GitChangedPaths = (options: {
  baselineCommit?: string | undefined
  headCommit: string
  repoRoot?: string | undefined
  runGit?: RunGit | undefined
}): readonly string[] => {
  const repoRoot = options.repoRoot ?? process.cwd()
  const baselineCommit =
    options.baselineCommit ?? RUNTIME_ABI_PHASE258_BASELINE_COMMIT
  const runGit = options.runGit ?? runGitAt(repoRoot)
  verifyPhase258GitClosureAncestry({
    baselineCommit,
    headCommit: options.headCommit,
    runGit,
  })
  const paths = parsePhase258GitNameStatus(
    runGit([
      "diff",
      "--name-status",
      "--no-renames",
      baselineCommit,
      options.headCommit,
    ]).stdout,
  ).filter((path) => !phase258WorkflowPath(path) && !phase258HashCyclePath(path))
  return verifyPhase258AuthoritativeRegularFiles(paths, repoRoot)
}

export const verifyPhase258AuthoritativeRegularFiles = (
  paths: readonly string[],
  repoRoot: string = process.cwd(),
): readonly string[] => {
  const absoluteRoot = resolve(repoRoot)
  for (const candidate of paths) {
    const path = normalizedInventoryPath(candidate)
    const absolutePath = resolve(absoluteRoot, path)
    const relativePath = relative(absoluteRoot, absolutePath)
    if (
      relativePath === "" ||
      relativePath.startsWith("..") ||
      isAbsolute(relativePath)
    ) {
      throw new TypeError(`Phase 258 authoritative path escapes repository: ${path}`)
    }
    const stat = lstatSync(absolutePath)
    if (stat.isSymbolicLink()) {
      throw new TypeError(`Phase 258 authoritative path is a symlink: ${path}`)
    }
    if (!stat.isFile()) {
      throw new TypeError(
        `Phase 258 authoritative path is not a regular file: ${path}`,
      )
    }
  }
  const sorted = [...paths].sort()
  if (new Set(sorted).size !== sorted.length) {
    throw new TypeError("Phase 258 authoritative paths are duplicated.")
  }
  return sorted
}

const readPhase258ClosureHeadCommit = (): string => {
  const receipt = readJson(RUNTIME_ABI_TEST_RECEIPT_PATH)
  if (
    !isRecord(receipt) ||
    receipt.schemaVersion !== "runtime-abi-v1.17-test-receipt-v2" ||
    !isRecord(receipt.provenance) ||
    !isRecord(receipt.provenance.git) ||
    typeof receipt.provenance.git.executionCommit !== "string"
  ) {
    throw new TypeError(
      "Phase 258 closure requires a provenance-bound v2 test receipt.",
    )
  }
  return receipt.provenance.git.executionCommit
}

const readPhase258PlanSources = (
  repoRoot: string,
): ReadonlyMap<string, string> => {
  const sources = new Map<string, string>()
  for (const path of RUNTIME_ABI_PHASE258_PLAN_PATHS) {
    sources.set(path, readFileSync(resolve(repoRoot, path), "utf8"))
  }
  return sources
}

export const verifyPhase258PlanFilesMatchGit = (options: {
  headCommit: string
  planSources: ReadonlyMap<string, string>
  runGit?: RunGit | undefined
}): void => {
  const runGit = options.runGit ?? runGitAt(process.cwd())
  if (options.planSources.size !== RUNTIME_ABI_PHASE258_PLAN_PATHS.length) {
    throw new TypeError("Phase 258 plan byte set is incomplete.")
  }
  for (const path of RUNTIME_ABI_PHASE258_PLAN_PATHS) {
    const current = options.planSources.get(path)
    const committed = runGit(["show", `${options.headCommit}:${path}`]).stdout
    if (current === undefined || current !== committed) {
      throw new TypeError(`Phase 258 plan bytes do not match closure git: ${path}`)
    }
  }
}

export const verifyPhase258PlanInventoryMatchesGit = (options: {
  gitPaths: readonly string[]
  declaredPaths: readonly string[]
  declarationOnlyPaths?: readonly string[] | undefined
}): void => {
  const git = new Set(options.gitPaths)
  const declared = new Set(
    options.declaredPaths.filter((path) => !phase258HashCyclePath(path)),
  )
  const missing = [...git].filter((path) => !declared.has(path)).sort()
  if (missing.length > 0) {
    throw new TypeError(
      `Phase 258 plan inventory omitted git path: ${missing.join(", ")}`,
    )
  }
  const extra = [...declared].filter((path) => !git.has(path)).sort()
  const expectedExtra = [
    ...(options.declarationOnlyPaths ??
      RUNTIME_ABI_PHASE258_DECLARATION_ONLY_PATHS),
  ].sort()
  if (!exactSortedStrings(extra, expectedExtra)) {
    throw new TypeError(
      `Phase 258 plan inventory does not match git closure: expected declaration-only [${expectedExtra.join(", ")}], received [${extra.join(", ")}].`,
    )
  }
}

export const collectPhase258InventoryPaths = (options: {
  repoRoot?: string | undefined
  headCommit?: string | undefined
  runGit?: RunGit | undefined
  planSources?: ReadonlyMap<string, string> | undefined
} = {}): readonly string[] => {
  const repoRoot = options.repoRoot ?? process.cwd()
  const headCommit = options.headCommit ?? readPhase258ClosureHeadCommit()
  const runGit = options.runGit ?? runGitAt(repoRoot)
  const planSources = options.planSources ?? readPhase258PlanSources(repoRoot)
  verifyPhase258PlanFilesMatchGit({ headCommit, planSources, runGit })
  const planCandidates = RUNTIME_ABI_PHASE258_PLAN_PATHS.flatMap((path) => {
    const source = planSources.get(path)
    if (source === undefined) {
      throw new TypeError(`Phase 258 plan source is missing: ${path}`)
    }
    return parsePlanFilesModified(source)
  })
  const excluded = new Set<string>([
    RUNTIME_ABI_ACTIVATION_MANIFEST_PATH,
    ...RUNTIME_ABI_DERIVED_VALIDATION_OUTPUTS,
  ])
  const declaredPaths = expandPhase258InventoryPaths(
    [...new Set(planCandidates)].filter((path) => !excluded.has(path)),
    repoRoot,
  )
  const gitPaths = collectPhase258GitChangedPaths({
    headCommit,
    repoRoot,
    runGit,
  })
  verifyPhase258PlanInventoryMatchesGit({ gitPaths, declaredPaths })
  const paths = verifyPhase258AuthoritativeRegularFiles(
    [
      ...new Set([
        ...gitPaths,
        ...RUNTIME_ABI_PHASE258_PLAN_PATHS,
        RUNTIME_ABI_TEST_RECEIPT_PATH,
      ]),
    ],
    repoRoot,
  )
  if (
    paths.includes(RUNTIME_ABI_ACTIVATION_MANIFEST_PATH) ||
    RUNTIME_ABI_DERIVED_VALIDATION_OUTPUTS.some((path) => paths.includes(path))
  ) {
    throw new TypeError("Activation manifest inventory contains a hash cycle.")
  }
  return paths
}

const readCountedEligibleLaneIds = (): readonly string[] => {
  const value = readJson(
    "packages/spec/artifacts/runtime-abi-v1.17-budget-capabilities.json",
  )
  if (!isRecord(value) || !isRecord(value.policy)) {
    throw new TypeError("Runtime budget capability artifact is malformed.")
  }
  const ids = value.policy.countedEligibleLaneIds
  if (!Array.isArray(ids) || ids.some((entry) => typeof entry !== "string")) {
    throw new TypeError("Counted runtime lane posture is malformed.")
  }
  return Object.freeze([...ids].sort())
}

const verifyExactCurrentRuntimeTuple = (): void => {
  if (
    STRATEGY_RUNTIME_ABI_VERSION !== "strategy-runtime-abi-v1.17" ||
    CURRENT_RUNTIME_EXECUTION_SERVICE_VERSION !==
      "runtime-execution-service-v1.17" ||
    CURRENT_RUNTIME_SEMANTIC_RECEIPT_SCHEMA_VERSION !==
      "runtime-semantic-receipt-v1.17" ||
    CURRENT_CANONICAL_COMPATIBILITY_TUPLE_RECORD.tuple.runtimeAbi !==
      STRATEGY_RUNTIME_ABI_VERSION
  ) {
    throw new TypeError("Current runtime lifecycle tuple is split or stale.")
  }
  const contract = readJson(
    "packages/spec/artifacts/runtime-abi-v1.17-contract.json",
  )
  if (
    !isRecord(contract) ||
    !isRecord(contract.versions) ||
    contract.versions.canonicalJson !== "canonical-json-v1.1" ||
    contract.versions.runtimeAbi !== STRATEGY_RUNTIME_ABI_VERSION ||
    contract.versions.runtimeService !==
      CURRENT_RUNTIME_EXECUTION_SERVICE_VERSION ||
    contract.versions.semanticReceipt !==
      CURRENT_RUNTIME_SEMANTIC_RECEIPT_SCHEMA_VERSION
  ) {
    throw new TypeError("Generated runtime ABI contract is not current.")
  }
}

export const buildRuntimeAbiActivationManifest = (
  readBytes: (path: string) => Uint8Array = (path) => readFileSync(path),
  options: {
    closureHeadCommit?: string | undefined
  } = {},
): RuntimeAbiActivationManifest => {
  verifyExactCurrentRuntimeTuple()
  const allowlist = parseRuntimeAbiActivationAllowlist(
    readJson(RUNTIME_ABI_ACTIVATION_ALLOWLIST_PATH),
  )
  const closureHeadCommit =
    options.closureHeadCommit ?? readPhase258ClosureHeadCommit()
  const inventory = collectPhase258InventoryPaths({ headCommit: closureHeadCommit }).map(
    (path) => digestPath(path, readBytes),
  )
  const inventoryPaths = new Set(inventory.map(({ path }) => path))
  for (const { path } of allowlist.operations) {
    if (!inventoryPaths.has(path)) {
      throw new TypeError(`Activation path is absent from final inventory: ${path}`)
    }
  }
  for (const required of [
    "scripts/check-v1-37-runtime-abi-manifest-closure.ts",
    "scripts/check-v1-37-runtime-abi-manifest-closure.test.ts",
    "scripts/evaluate-v1-37-runtime-abi.ts",
    "scripts/evaluate-v1-37-runtime-abi.test.ts",
    RUNTIME_ABI_TEST_RECEIPT_PATH,
  ]) {
    if (!inventoryPaths.has(required)) {
      throw new TypeError(`Final closure authority is absent from inventory: ${required}`)
    }
  }
  const countedEligibleLaneIds = readCountedEligibleLaneIds()
  if (countedEligibleLaneIds.length !== 0) {
    throw new TypeError("A runtime lane became counted before Phase 259 certification.")
  }
  const fixturePath =
    "packages/spec/artifacts/runtime-successor-authority-v1.17.fixture.json"
  const testReceipt = digestPath(RUNTIME_ABI_TEST_RECEIPT_PATH, readBytes)
  return Object.freeze({
    schemaVersion: "runtime-abi-v1.17-activation-manifest-v1",
    activationPlan: "258-14",
    activationCommit: RUNTIME_ABI_ACTIVATION_COMMIT,
    activationDiff: Object.freeze(
      allowlist.operations.map(({ path, operation }) =>
        Object.freeze({ path, operation, sha256: sha256(readBytes(path)) }),
      ),
    ),
    current: Object.freeze({
      canonicalJson: "canonical-json-v1.1",
      runtimeAbi: STRATEGY_RUNTIME_ABI_VERSION,
      runtimeService: CURRENT_RUNTIME_EXECUTION_SERVICE_VERSION,
      semanticReceipt: CURRENT_RUNTIME_SEMANTIC_RECEIPT_SCHEMA_VERSION,
      semanticTuple: CURRENT_CANONICAL_COMPATIBILITY_TUPLE_RECORD,
    }),
    posture: Object.freeze({
      countedEligibleLaneIds,
      productionTrustedProducers: Object.freeze([]),
      certificationOwner: "Phase 259",
    }),
    evidenceAuthority: Object.freeze({
      fixture: digestPath(fixturePath, readBytes),
      nodeCount: 15,
      edgeCount: 26,
      orderedPinCount: 10,
      rootNodeId: "node:evidenceBundle",
    }),
    testReceipt,
    inventoryPolicy: Object.freeze({
      source:
        "Pinned Phase 258 git closure cross-checked against PLAN files_modified plus exact PLAN bytes and the postactivation test receipt",
      baselineCommit: RUNTIME_ABI_PHASE258_BASELINE_COMMIT,
      closureHeadCommit,
      activationCommit: RUNTIME_ABI_ACTIVATION_COMMIT,
      excludedInterleavedCommits: RUNTIME_ABI_PHASE258_INTERLEAVED_COMMITS,
      planFileCount: 14,
      declarationOnlyPaths: RUNTIME_ABI_PHASE258_DECLARATION_ONLY_PATHS,
      excludedSelf: RUNTIME_ABI_ACTIVATION_MANIFEST_PATH,
      derivedValidationOutputs: RUNTIME_ABI_DERIVED_VALIDATION_OUTPUTS,
      validationDependency: "validation-consumes-manifest",
    }),
    phase258Inventory: Object.freeze(inventory),
  })
}

export const parseRuntimeAbiActivationManifest = (
  value: unknown,
): RuntimeAbiActivationManifest => {
  const isDigest = (entry: unknown): entry is RuntimeAbiManifestDigest =>
    isRecord(entry) &&
    Object.keys(entry).sort().join(",") === "path,sha256" &&
    typeof entry.path === "string" &&
    /^[0-9a-f]{64}$/u.test(String(entry.sha256))
  const isActivationDigest = (
    entry: unknown,
  ): entry is AllowlistOperation & { readonly sha256: string } =>
    isRecord(entry) &&
    Object.keys(entry).sort().join(",") === "operation,path,sha256" &&
    typeof entry.path === "string" &&
    (entry.operation === "create" || entry.operation === "update") &&
    /^[0-9a-f]{64}$/u.test(String(entry.sha256))
  if (
    !isRecord(value) ||
    value.schemaVersion !== "runtime-abi-v1.17-activation-manifest-v1" ||
    value.activationPlan !== "258-14" ||
    value.activationCommit !== RUNTIME_ABI_ACTIVATION_COMMIT ||
    !Array.isArray(value.activationDiff) ||
    value.activationDiff.some((entry) => !isActivationDigest(entry)) ||
    !Array.isArray(value.phase258Inventory) ||
    value.phase258Inventory.some((entry) => !isDigest(entry)) ||
    !isRecord(value.current) ||
    value.current.canonicalJson !== "canonical-json-v1.1" ||
    value.current.runtimeAbi !== "strategy-runtime-abi-v1.17" ||
    value.current.runtimeService !== "runtime-execution-service-v1.17" ||
    value.current.semanticReceipt !== "runtime-semantic-receipt-v1.17" ||
    JSON.stringify(value.current.semanticTuple) !==
      JSON.stringify(CURRENT_CANONICAL_COMPATIBILITY_TUPLE_RECORD) ||
    !isRecord(value.posture) ||
    !Array.isArray(value.posture.countedEligibleLaneIds) ||
    value.posture.countedEligibleLaneIds.length !== 0 ||
    !Array.isArray(value.posture.productionTrustedProducers) ||
    value.posture.productionTrustedProducers.length !== 0 ||
    value.posture.certificationOwner !== "Phase 259" ||
    !isRecord(value.evidenceAuthority) ||
    !isDigest(value.evidenceAuthority.fixture) ||
    value.evidenceAuthority.nodeCount !== 15 ||
    value.evidenceAuthority.edgeCount !== 26 ||
    value.evidenceAuthority.orderedPinCount !== 10 ||
    value.evidenceAuthority.rootNodeId !== "node:evidenceBundle" ||
    !isRecord(value.testReceipt) ||
    !isDigest(value.testReceipt) ||
    value.testReceipt.path !== RUNTIME_ABI_TEST_RECEIPT_PATH ||
    !isRecord(value.inventoryPolicy) ||
    value.inventoryPolicy.source !==
      "Pinned Phase 258 git closure cross-checked against PLAN files_modified plus exact PLAN bytes and the postactivation test receipt" ||
    value.inventoryPolicy.baselineCommit !==
      RUNTIME_ABI_PHASE258_BASELINE_COMMIT ||
    typeof value.inventoryPolicy.closureHeadCommit !== "string" ||
    !/^[0-9a-f]{40}$/u.test(value.inventoryPolicy.closureHeadCommit) ||
    value.inventoryPolicy.activationCommit !== RUNTIME_ABI_ACTIVATION_COMMIT ||
    JSON.stringify(value.inventoryPolicy.excludedInterleavedCommits) !==
      JSON.stringify(RUNTIME_ABI_PHASE258_INTERLEAVED_COMMITS) ||
    value.inventoryPolicy.planFileCount !== 14 ||
    JSON.stringify(value.inventoryPolicy.declarationOnlyPaths) !==
      JSON.stringify(RUNTIME_ABI_PHASE258_DECLARATION_ONLY_PATHS) ||
    value.inventoryPolicy.excludedSelf !== RUNTIME_ABI_ACTIVATION_MANIFEST_PATH ||
    value.inventoryPolicy.validationDependency !==
      "validation-consumes-manifest" ||
    JSON.stringify(value.inventoryPolicy.derivedValidationOutputs) !==
      JSON.stringify(RUNTIME_ABI_DERIVED_VALIDATION_OUTPUTS)
  ) {
    throw new TypeError("Runtime ABI activation manifest is malformed.")
  }
  const inventoryPaths = value.phase258Inventory.map(({ path }) => path)
  if (
    new Set(inventoryPaths).size !== inventoryPaths.length ||
    inventoryPaths.join("\n") !== [...inventoryPaths].sort().join("\n") ||
    !inventoryPaths.includes(RUNTIME_ABI_TEST_RECEIPT_PATH) ||
    RUNTIME_ABI_PHASE258_PLAN_PATHS.some(
      (path) => !inventoryPaths.includes(path),
    ) ||
    inventoryPaths.includes(RUNTIME_ABI_ACTIVATION_MANIFEST_PATH) ||
    RUNTIME_ABI_DERIVED_VALIDATION_OUTPUTS.some((path) =>
      inventoryPaths.includes(path),
    )
  ) {
    throw new TypeError("Runtime ABI activation manifest inventory is malformed.")
  }
  return value as RuntimeAbiActivationManifest
}

const serializeManifest = (manifest: RuntimeAbiActivationManifest): string =>
  `${JSON.stringify(manifest, null, 2)}\n`

export const writeRuntimeAbiActivationManifest = (): RuntimeAbiActivationManifest => {
  const manifest = buildRuntimeAbiActivationManifest()
  writeFileSync(RUNTIME_ABI_ACTIVATION_MANIFEST_PATH, serializeManifest(manifest))
  return manifest
}

export const parseRuntimeAbiActivationAllowlist = (
  value: unknown,
): RuntimeAbiActivationAllowlist => {
  if (
    !isRecord(value) ||
    value.schemaVersion !== "runtime-abi-v1.17-activation-allowlist-v1" ||
    value.activationPlan !== "258-14" ||
    !Array.isArray(value.operations) ||
    value.operations.length === 0
  ) {
    throw new TypeError("Runtime ABI activation allowlist is malformed.")
  }
  const operations = value.operations.map((entry) => {
    if (
      !isRecord(entry) ||
      Object.keys(entry).sort().join(",") !== "operation,path" ||
      typeof entry.path !== "string" ||
      entry.path.startsWith("/") ||
      entry.path.includes("..") ||
      (entry.operation !== "create" && entry.operation !== "update")
    ) {
      throw new TypeError("Runtime ABI activation operation is malformed.")
    }
    return {
      path: entry.path,
      operation: entry.operation as AllowlistOperation["operation"],
    }
  })
  if (new Set(operations.map(({ path }) => path)).size !== operations.length) {
    throw new TypeError("Runtime ABI activation allowlist has duplicate paths.")
  }
  if (/sha256|hash/iu.test(JSON.stringify(value))) {
    throw new TypeError("Preactivation allowlist contains final-byte claims.")
  }
  return {
    schemaVersion: value.schemaVersion,
    activationPlan: value.activationPlan,
    operations,
  }
}

const parseActivationNameStatus = (
  nameStatus: string,
): ReadonlyMap<string, "A" | "M"> => {
  const entries = new Map<string, "A" | "M">()
  for (const line of nameStatus.split(/\r?\n/u).filter((entry) => entry !== "")) {
    const fields = line.split("\t")
    if (
      fields.length !== 2 ||
      (fields[0] !== "A" && fields[0] !== "M") ||
      fields[1] === undefined ||
      fields[1].length === 0 ||
      entries.has(fields[1])
    ) {
      throw new TypeError(`Activation diff contains a forbidden name-status entry: ${line}`)
    }
    entries.set(fields[1], fields[0])
  }
  return entries
}

export const verifyRuntimeAbiActivationNameStatus = (
  allowlist: RuntimeAbiActivationAllowlist,
  nameStatus: string,
): void => {
  const actual = parseActivationNameStatus(nameStatus)
  if (actual.size !== allowlist.operations.length) {
    throw new TypeError(
      `Activation diff is not exact: expected ${String(allowlist.operations.length)} paths, received ${String(actual.size)}.`,
    )
  }
  for (const { path, operation } of allowlist.operations) {
    const expected = operation === "create" ? "A" : "M"
    const received = actual.get(path)
    if (received !== expected) {
      throw new TypeError(
        `Activation diff operation mismatch: ${path} expected=${expected} received=${received ?? "missing"}.`,
      )
    }
  }
  const allowed = new Set(allowlist.operations.map(({ path }) => path))
  for (const path of actual.keys()) {
    if (!allowed.has(path)) {
      throw new TypeError(`Activation diff contains an unallowlisted path: ${path}`)
    }
  }
}

export const runtimeAbiActivationDiffArguments = (options: {
  mode: Exclude<RuntimeAbiActivationDiffMode, "none">
  activationCommit?: string | undefined
}): readonly string[] =>
  options.mode === "staged"
    ? ["diff", "--cached", "--name-status", "--no-renames"]
    : (() => {
        if (!/^[0-9a-f]{40}$/u.test(options.activationCommit ?? "")) {
          throw new TypeError(
            "Committed activation closure requires an explicit 40-character activation commit.",
          )
        }
        return [
          "diff",
          "--name-status",
          "--no-renames",
          `${options.activationCommit!}^`,
          options.activationCommit!,
        ]
      })()

const readRuntimeAbiActivationNameStatus = (options: {
  mode: Exclude<RuntimeAbiActivationDiffMode, "none">
  activationCommit?: string | undefined
}): string => {
  const args = runtimeAbiActivationDiffArguments(options)
  const result = spawnSync("git", args, { encoding: "utf8" })
  if (result.status !== 0) {
    throw new TypeError(
      `Activation diff is unavailable: ${String(result.stderr ?? "").trim()}`,
    )
  }
  return result.stdout
}

export const verifyRuntimeAbiActivationDiff = (
  allowlist: RuntimeAbiActivationAllowlist,
  options: {
    mode: Exclude<RuntimeAbiActivationDiffMode, "none">
    activationCommit?: string | undefined
  },
): void => {
  verifyRuntimeAbiActivationNameStatus(
    allowlist,
    readRuntimeAbiActivationNameStatus(options),
  )
}

const verifyPreparedLifecycleConsumers = (
  allowlist: RuntimeAbiActivationAllowlist,
): void => {
  for (const path of RUNTIME_ABI_PREPARED_LIFECYCLE_CONSUMERS) {
    if (!existsSync(path)) {
      throw new TypeError(`Prepared lifecycle consumer is missing: ${path}`)
    }
  }
  const boundarySource = readFileSync(
    "scripts/check-boundary-monitors.ts",
    "utf8",
  )
  if (
    !boundarySource.includes("CURRENT_CANONICAL_COMPATIBILITY_TUPLE_RECORD") ||
    /STRATEGY_RUNTIME_ABI_VERSION\s*!==\s*["']strategy-runtime-abi-v1\.14["']/u.test(
      boundarySource,
    )
  ) {
    throw new TypeError(
      "Boundary monitor is not bound to the spec-owned current lifecycle alias.",
    )
  }
  const eventArtifact =
    "packages/spec/artifacts/v1.37-current-event-coverage.json"
  const operation = allowlist.operations.find(({ path }) => path === eventArtifact)
  if (operation?.operation !== "update") {
    throw new TypeError(
      "Current-event evidence is missing from the exact activation allowlist.",
    )
  }
}

export const IMMUTABLE_RUNTIME_SERVICE_V116_DIGESTS = Object.freeze({
  "packages/spec/src/runtime-execution-service.ts":
    "9a0a0411056d06ce4b426b7749256460369124fa752c6c2f81912b8b0bfb31fc",
  "packages/spec/artifacts/runtime-execution-service-request.v1.16.json":
    "5d04fa4d82eb814bb034ce9b5f1d5c80945e3d4e02c9124ca39a6670e9c0eab5",
  "packages/spec/artifacts/runtime-execution-service-response.v1.16.wire.json":
    "9c870d57e0125eb80ab2ba941ecbbede8a9a775f61c0b278abec25c491374d97",
  "apps/go-backend/runtime_service_client.go":
    "9c72e5b0ee3ddfb36a7aec51a5a1ead508b2fae29eace27a73b9fda7d55ce23c",
  "apps/go-backend/runtime_semantic_receipt.go":
    "36052047a870068ab81ced8c78f3b7f4e8130034a57ee8d16bc3873a50507d1d",
  "packages/persistence/migrations/0017_runtime_semantic_receipts.sql":
    "ac19e1d825217dfb72142685eb65e62933cea49541ceb39338235b32d2430a69",
} as const)

export const verifyImmutableRuntimeServiceV116Digests = (
  readBytes: (path: string) => Uint8Array = (path) => readFileSync(path),
): void => {
  for (const [path, expected] of Object.entries(
    IMMUTABLE_RUNTIME_SERVICE_V116_DIGESTS,
  )) {
    let bytes: Uint8Array
    try {
      bytes = readBytes(path)
    } catch {
      throw new TypeError(`Immutable v1.16 path is unavailable: ${path}`)
    }
    const actual = sha256(bytes)
    if (actual !== expected) {
      throw new TypeError(
        `Immutable v1.16 digest changed: ${path} expected=${expected} actual=${actual}`,
      )
    }
  }
}

export const checkRuntimeAbiManifestClosure = (options: {
  final: boolean
  diffMode?: RuntimeAbiActivationDiffMode | undefined
  activationCommit?: string | undefined
}): void => {
  const allowlist = parseRuntimeAbiActivationAllowlist(
    readJson(RUNTIME_ABI_ACTIVATION_ALLOWLIST_PATH),
  )
  for (const { path, operation } of allowlist.operations) {
    if (operation === "update" && !existsSync(path)) {
      throw new TypeError(`Allowlisted update path is missing: ${path}`)
    }
  }
  verifyPreparedLifecycleConsumers(allowlist)
  verifyImmutableRuntimeServiceV116Digests()
  if (options.final && !existsSync(RUNTIME_ABI_ACTIVATION_MANIFEST_PATH)) {
    throw new TypeError("Final activation manifest is unavailable.")
  }
  const diffMode = options.final ? "committed" : (options.diffMode ?? "none")
  if (diffMode !== "none") {
    verifyRuntimeAbiActivationDiff(allowlist, {
      mode: diffMode,
      activationCommit: options.activationCommit,
    })
  }
  if (options.final) {
    verifyExactCurrentRuntimeTuple()
    const actual = parseRuntimeAbiActivationManifest(
      readJson(RUNTIME_ABI_ACTIVATION_MANIFEST_PATH),
    )
    const expected = buildRuntimeAbiActivationManifest()
    if (serializeManifest(actual) !== serializeManifest(expected)) {
      throw new TypeError(
        "Final activation manifest does not match exact current Phase 258 bytes.",
      )
    }
  }
}

const isMain =
  process.argv[1] !== undefined &&
  import.meta.url === new URL(`file://${process.argv[1]}`).href

if (isMain) {
  const writeFinal = process.argv.includes("--write-final")
  const checkFinal = process.argv.includes("--check") || writeFinal
  const staged = process.argv.includes("--check-staged-activation")
  const committed = process.argv.includes("--check-committed-activation")
  if ([staged, committed, checkFinal].filter(Boolean).length > 1) {
    throw new TypeError("Activation closure accepts exactly one diff mode.")
  }
  const activationCommitArgument = process.argv.find((argument) =>
    argument.startsWith("--activation-commit="),
  )
  const activationCommit = activationCommitArgument?.slice(
    "--activation-commit=".length,
  )
  if (writeFinal) writeRuntimeAbiActivationManifest()
  checkRuntimeAbiManifestClosure({
    final: checkFinal,
    diffMode: staged ? "staged" : committed ? "committed" : "none",
    activationCommit: checkFinal
      ? RUNTIME_ABI_ACTIVATION_COMMIT
      : activationCommit,
  })
  console.log("runtime-abi-v1.17 manifest closure: PASS")
}
