import { createHash } from "node:crypto"
import { execFileSync } from "node:child_process"
import { existsSync, lstatSync, readFileSync, readdirSync } from "node:fs"
import path from "node:path"

export const V138_262_62_ARCHIVE =
  ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/archived/262-62-HISTORICAL.md" as const
export const V138_262_62_ACTIVE =
  ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-62-PLAN.md" as const
export const V138_262_63_PLAN =
  ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-63-PLAN.md" as const
export const V138_262_63_SUMMARY =
  ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-63-SUMMARY.md" as const
export const V138_262_62_ARCHIVE_SHA256 =
  "438e139b6710c482b668514091968ee3a31ea575f2d0d002ec0c11473fdbc07a" as const
export const V138_262_61_R3_SOURCE = "ce30642baffafd9bbe9874289af7b3ef4500ac9e" as const
export const V138_262_61_R3_TREE = "e3c8971d20a9264ed65ba46faebd06c1190b08e5" as const
export const V138_262_61_R3_PARENT = "f563e1bdf65d24b620919dec9e8c1d3cb789089f" as const
export const V138_262_61_SUMMARY_CARRIER = "ad5c57c95bf8e2c683d172c1f996feb6b0c50b7f" as const
export const V138_262_61_SUMMARY_BLOB = "adc83dd68ebb91bfe4314e30e2622d098f816331" as const
export const V138_262_62_ARCHIVE_CARRIER = "00187acb8871518a71c072958363598f506da500" as const
export const V138_262_63_PLAN_CARRIER = "903693efeae6a3184ab0d58c3392b2deb9ca4093" as const
export const V138_262_63_SUMMARY_CARRIER = "3a6c02e6df3e26fd3a6883ab7eaae1eabaf80ad6" as const

const phaseDirectory = path.dirname(V138_262_63_PLAN)
const V138_262_61_SUMMARY = `${phaseDirectory}/262-61-SUMMARY.md` as const
const forbidden = Object.freeze([
  ".planning/artifacts/v1.38-plan-262-62-source-completeness-review-v3.json",
  `${phaseDirectory}/262-62-REVIEW.md`,
  `${phaseDirectory}/262-62-SUMMARY.md`,
  ".planning/artifacts/v1.38-plan-262-56-authorization-v9.json",
  ".planning/artifacts/v1.38-successor-source-seal-v9.json",
  ".planning/artifacts/v1.38-plan-262-57-route-start-v1.json",
  ".planning/artifacts/v1.38-current-matrix-headroom-preflight-v11.json",
  ".planning/artifacts/v1.38-current-matrix-calibration-v11.json",
  ".planning/artifacts/v1.38-current-matrix-reproduction-v12.json",
  ".planning/artifacts/v1.38-plan-262-57-preflight-consumption-v1.json",
  ".planning/artifacts/v1.38-plan-262-57-calibration-consumption-v1.json",
  ".planning/artifacts/v1.38-plan-262-57-reproduction-consumption-v1.json",
  ".planning/artifacts/v1.38-plan-262-57-terminal-v1.json",
] as const)

const sha256 = (bytes: Uint8Array): string => createHash("sha256").update(bytes).digest("hex")
const git = (root: string, args: readonly string[]) => execFileSync("git", [...args], {
  cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024,
}).trim()
const files = (root: string, pattern: string) => git(root, ["ls-files", pattern])
  .split("\n").filter(Boolean).sort()
const fail = (code: string): never => { throw new TypeError(code) }
const gitLines = (root: string, args: readonly string[]) => git(root, args).split("\n").filter(Boolean)
const firstParentContains = (root: string, commit: string) =>
  gitLines(root, ["rev-list", "--first-parent", "HEAD"]).includes(commit)
const history = (root: string, repoPath: string) =>
  gitLines(root, ["log", "--first-parent", "--format=%H", "--", repoPath])
const historyIsExactly = (root: string, repoPath: string, commit: string) =>
  JSON.stringify(history(root, repoPath)) === JSON.stringify([commit])
const regular = (root: string, repoPath: string): Buffer => {
  const target = path.resolve(root, repoPath)
  const stat = lstatSync(target)
  if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1) fail("V138_262_63_PATH_INVALID")
  return readFileSync(target)
}
const identity = (root: string, repoPath: string) => {
  const bytes = regular(root, repoPath)
  const blob = git(root, ["rev-parse", `HEAD:${repoPath}`])
  if (git(root, ["hash-object", "--no-filters", "--", repoPath]) !== blob)
    fail("V138_262_63_WORKTREE_BLOB_MISMATCH")
  return { path: repoPath, blob, sha256: sha256(bytes) }
}
const inventoryAt = (root: string, commit: string, suffix: "PLAN" | "SUMMARY") =>
  gitLines(root, ["ls-tree", "-r", "--name-only", commit, "--", phaseDirectory])
    .filter(repoPath => new RegExp(`^${phaseDirectory}/262-\\d{2}-${suffix}\\.md$`, "u").test(repoPath))
    .sort()
const cleanAgainstHead = (root: string, paths: string[]) =>
  gitLines(root, ["diff", "--name-only", "HEAD", "--", ...paths]).length === 0
const unchangedSinceArchive = (root: string, paths: string[]) =>
  gitLines(root, ["diff", "--name-only", V138_262_62_ARCHIVE_CARRIER, "HEAD", "--", ...paths]).length === 0
const historicalPrefix = (root: string) => {
  if (![V138_262_61_R3_SOURCE, V138_262_61_SUMMARY_CARRIER, V138_262_62_ARCHIVE_CARRIER]
    .every(commit => firstParentContains(root, commit))) fail("V138_262_63_HISTORICAL_LINEAGE_INVALID")
  const r3 = gitLines(root, ["show", "-s", "--format=%T%n%P", V138_262_61_R3_SOURCE])
  if (r3[0] !== V138_262_61_R3_TREE || r3[1] !== V138_262_61_R3_PARENT)
    fail("V138_262_63_R3_CUSTODY_INVALID")
  const summary = identity(root, V138_262_61_SUMMARY)
  if (summary.blob !== V138_262_61_SUMMARY_BLOB || !historyIsExactly(root, V138_262_61_SUMMARY, V138_262_61_SUMMARY_CARRIER))
    fail("V138_262_63_R3_SUMMARY_CUSTODY_INVALID")
  if (!historyIsExactly(root, V138_262_62_ARCHIVE, V138_262_62_ARCHIVE_CARRIER))
    fail("V138_262_63_PLAN_62_ARCHIVE_HISTORY_INVALID")
  const historicalPlans = inventoryAt(root, V138_262_62_ARCHIVE_CARRIER, "PLAN")
  const historicalSummaries = inventoryAt(root, V138_262_62_ARCHIVE_CARRIER, "SUMMARY")
  if (historicalPlans.length !== 47 || historicalSummaries.length !== 44 || historicalPlans.includes(V138_262_62_ACTIVE))
    fail("V138_262_63_HISTORICAL_STATE_INVALID")
}
const planMeta = (bytes: Buffer) => {
  const text = bytes.toString("utf8")
  const frontmatter = text.match(/^---\n([\s\S]*?)\n---/u)?.[1] ?? ""
  return { plan: /^plan:\s*["']?([0-9]+)/mu.exec(frontmatter)?.[1],
    wave: /^wave:\s*(\d+)/mu.exec(frontmatter)?.[1],
    depends: /^depends_on:\s*\[([^\]]*)\]/mu.exec(frontmatter)?.[1]
      ?.split(",").map(value => value.replaceAll(/["'\s]/gu, "")).filter(Boolean) ?? [] }
}

export type V138LifecycleState =
  | "archived_262_62_pre_successor"
  | "plan_262_63_pending"
  | "plan_262_63_summary_committed"

/** Read-only finite-state reconciliation; no route, runtime, or writer capability exists here. */
export const inspectV138Plan26263Lifecycle = (root: string): Readonly<{
  state: V138LifecycleState; activePlans: number; summaries: number; archive: ReturnType<typeof identity>
}> => {
  if (sha256(regular(root, V138_262_62_ARCHIVE)) !== V138_262_62_ARCHIVE_SHA256)
    fail("V138_262_63_PLAN_62_ARCHIVE_INVALID")
  historicalPrefix(root)
  if (existsSync(path.resolve(root, V138_262_62_ACTIVE))) fail("V138_262_63_PLAN_62_REVIVED")
  const archive = identity(root, V138_262_62_ARCHIVE)
  if (archive.sha256 !== V138_262_62_ARCHIVE_SHA256) fail("V138_262_63_PLAN_62_ARCHIVE_INVALID")
  if (forbidden.some(repoPath => existsSync(path.resolve(root, repoPath))))
    fail("V138_262_63_FORBIDDEN_DESTINATION_PRESENT")
  const historicalPlans = inventoryAt(root, V138_262_62_ARCHIVE_CARRIER, "PLAN")
  const historicalSummaries = inventoryAt(root, V138_262_62_ARCHIVE_CARRIER, "SUMMARY")
  const plans = files(root, `${phaseDirectory}/262-*-PLAN.md`)
  const summaries = files(root, `${phaseDirectory}/262-*-SUMMARY.md`)
  const disk = readdirSync(path.resolve(root, phaseDirectory)).filter(name => /^262-\d{2}-(?:PLAN|SUMMARY)\.md$/u.test(name))
    .map(name => `${phaseDirectory}/${name}`).sort()
  const verifyInventory = (actual: string[], expected: string[], code: string) => {
    if (JSON.stringify(actual) !== JSON.stringify(expected) || expected.some(repoPath => !existsSync(path.resolve(root, repoPath))))
      fail(code)
    for (const repoPath of expected) regular(root, repoPath)
    if (!cleanAgainstHead(root, expected)) fail("V138_262_63_WORKTREE_BLOB_MISMATCH")
    const predecessors = expected.filter(repoPath => repoPath !== V138_262_63_PLAN && repoPath !== V138_262_63_SUMMARY)
    if (!unchangedSinceArchive(root, predecessors)) fail("V138_262_63_PREDECESSOR_MUTATED")
  }
  if (JSON.stringify(plans) === JSON.stringify(historicalPlans) && JSON.stringify(summaries) === JSON.stringify(historicalSummaries)) {
    verifyInventory(plans, historicalPlans, "V138_262_63_HISTORICAL_PLAN_INVENTORY_INVALID")
    verifyInventory(summaries, historicalSummaries, "V138_262_63_HISTORICAL_SUMMARY_INVENTORY_INVALID")
    if (JSON.stringify(disk) !== JSON.stringify([...historicalPlans, ...historicalSummaries].sort()))
      fail("V138_262_63_UNTRACKED_LIFECYCLE_PATH")
    return Object.freeze({ state: "archived_262_62_pre_successor", activePlans: 47, summaries: 44, archive })
  }
  const expectedPlans = [...historicalPlans, V138_262_63_PLAN].sort()
  const expectedSummaries = summaries.includes(V138_262_63_SUMMARY)
    ? [...historicalSummaries, V138_262_63_SUMMARY].sort() : historicalSummaries
  verifyInventory(plans, expectedPlans, "V138_262_63_PLAN_INVENTORY_INVALID")
  verifyInventory(summaries, expectedSummaries, "V138_262_63_SUMMARY_INVENTORY_INVALID")
  if (JSON.stringify(disk) !== JSON.stringify([...expectedPlans, ...expectedSummaries].sort()))
    fail("V138_262_63_UNTRACKED_LIFECYCLE_PATH")
  if (!plans.includes(V138_262_63_PLAN)) fail("V138_262_63_PLAN_INVENTORY_INVALID")
  if (!historyIsExactly(root, V138_262_63_PLAN, V138_262_63_PLAN_CARRIER))
    fail("V138_262_63_PLAN_HISTORY_INVALID")
  const meta = planMeta(regular(root, V138_262_63_PLAN))
  if (meta.plan !== "63" || meta.wave !== "45" || JSON.stringify(meta.depends) !== JSON.stringify(["262-61"]))
    fail("V138_262_63_PLAN_METADATA_INVALID")
  const hasSummary = summaries.includes(V138_262_63_SUMMARY)
  if (hasSummary) {
    const summary = identity(root, V138_262_63_SUMMARY)
    const changed = gitLines(root, ["diff-tree", "--no-commit-id", "--name-only", "-r", "--no-renames",
      V138_262_63_SUMMARY_CARRIER])
    if (!historyIsExactly(root, V138_262_63_SUMMARY, V138_262_63_SUMMARY_CARRIER) ||
      changed.length !== 1 || changed[0] !== V138_262_63_SUMMARY || summary.blob.length !== 40)
      fail("V138_262_63_SUMMARY_CARRIER_INVALID")
  }
  return Object.freeze({ state: hasSummary ? "plan_262_63_summary_committed" : "plan_262_63_pending",
    activePlans: plans.length, summaries: summaries.length, archive })
}
