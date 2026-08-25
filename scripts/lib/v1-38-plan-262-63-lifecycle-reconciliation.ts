import { createHash } from "node:crypto"
import { execFileSync } from "node:child_process"
import { existsSync, lstatSync, readFileSync } from "node:fs"
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

const phaseDirectory = path.dirname(V138_262_63_PLAN)
const forbidden = Object.freeze([
  ".planning/artifacts/v1.38-plan-262-62-source-completeness-review-v3.json",
  `${phaseDirectory}/262-62-REVIEW.md`,
  `${phaseDirectory}/262-62-SUMMARY.md`,
  ".planning/artifacts/v1.38-plan-262-56-authorization-v9.json",
  ".planning/artifacts/v1.38-successor-source-seal-v9.json",
] as const)

const sha256 = (bytes: Uint8Array): string => createHash("sha256").update(bytes).digest("hex")
const git = (root: string, args: readonly string[]) => execFileSync("git", [...args], {
  cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024,
}).trim()
const files = (root: string, pattern: string) => git(root, ["ls-files", pattern])
  .split("\n").filter(Boolean).sort()
const fail = (code: string): never => { throw new TypeError(code) }
const regular = (root: string, repoPath: string): Buffer => {
  const target = path.resolve(root, repoPath)
  const stat = lstatSync(target)
  if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1) fail("V138_262_63_PATH_INVALID")
  return readFileSync(target)
}
const identity = (root: string, repoPath: string) => {
  const bytes = regular(root, repoPath)
  return { path: repoPath, blob: git(root, ["rev-parse", `HEAD:${repoPath}`]), sha256: sha256(bytes) }
}
const planMeta = (bytes: Buffer) => {
  const text = bytes.toString("utf8")
  const frontmatter = text.match(/^---\n([\s\S]*?)\n---/u)?.[1] ?? ""
  return { plan: /^plan:\s*["']?([0-9]+)/mu.exec(frontmatter)?.[1],
    wave: /^wave:\s*(\d+)/mu.exec(frontmatter)?.[1],
    depends: /^depends_on:\s*\[([^\]]*)\]/mu.exec(frontmatter)?.[1]
      ?.split(",").map(value => value.replaceAll(/["'\s]/gu, "")).filter(Boolean) ?? [] }
}

export type V138LifecycleState = "plan_262_63_pending" | "plan_262_63_summary_committed"

/** Read-only finite-state reconciliation; no route, runtime, or writer capability exists here. */
export const inspectV138Plan26263Lifecycle = (root: string): Readonly<{
  state: V138LifecycleState; activePlans: number; summaries: number; archive: ReturnType<typeof identity>
}> => {
  if (existsSync(path.resolve(root, V138_262_62_ACTIVE))) fail("V138_262_63_PLAN_62_REVIVED")
  const archive = identity(root, V138_262_62_ARCHIVE)
  if (archive.sha256 !== V138_262_62_ARCHIVE_SHA256) fail("V138_262_63_PLAN_62_ARCHIVE_INVALID")
  if (forbidden.some(repoPath => existsSync(path.resolve(root, repoPath))))
    fail("V138_262_63_FORBIDDEN_DESTINATION_PRESENT")
  const plans = files(root, `${phaseDirectory}/262-*-PLAN.md`)
  const summaries = files(root, `${phaseDirectory}/262-*-SUMMARY.md`)
  if (!plans.includes(V138_262_63_PLAN) || plans.length !== 48) fail("V138_262_63_PLAN_INVENTORY_INVALID")
  const meta = planMeta(regular(root, V138_262_63_PLAN))
  if (meta.plan !== "63" || meta.wave !== "45" || JSON.stringify(meta.depends) !== JSON.stringify(["262-61"]))
    fail("V138_262_63_PLAN_METADATA_INVALID")
  const hasSummary = summaries.includes(V138_262_63_SUMMARY)
  if (summaries.length !== (hasSummary ? 45 : 44)) fail("V138_262_63_SUMMARY_INVENTORY_INVALID")
  if (hasSummary) {
    const summary = identity(root, V138_262_63_SUMMARY)
    const changed = git(root, ["diff-tree", "--no-commit-id", "--name-only", "-r", "--no-renames",
      git(root, ["log", "-1", "--format=%H", "--", V138_262_63_SUMMARY])]).split("\n").filter(Boolean)
    if (changed.length !== 1 || changed[0] !== V138_262_63_SUMMARY || summary.blob.length !== 40)
      fail("V138_262_63_SUMMARY_CARRIER_INVALID")
  }
  return Object.freeze({ state: hasSummary ? "plan_262_63_summary_committed" : "plan_262_63_pending",
    activePlans: plans.length, summaries: summaries.length, archive })
}
