#!/usr/bin/env -S pnpm exec tsx
import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { inspectV138Plan26263Lifecycle } from "./lib/v1-38-plan-262-63-lifecycle-reconciliation.js"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const files = [".planning/ROADMAP.md", ".planning/STATE.md"] as const
const proofStatuses = Object.freeze({
  archived_262_62_pre_successor: "plan_262_62_archived_plan_262_63_lifecycle_reconciliation_pending",
  plan_262_63_pending: "plan_262_62_archived_plan_262_63_lifecycle_reconciliation_pending",
  plan_262_63_summary_committed: "plan_262_63_lifecycle_reconciliation_complete_source_review_next",
} as const)
const archivePath = "archived/262-62-HISTORICAL.md"
const archiveHash = "438e139b6710c482b668514091968ee3a31ea575f2d0d002ec0c11473fdbc07a"
type Status = Record<string, unknown>
const status = (content: string): Status => {
  const matches = [...content.matchAll(/^<!-- phase-262-successor-status: (\{.*\}) -->$/gmu)]
  if (matches.length !== 1) throw new TypeError("V138_262_63_STATUS_MARKER_INVALID")
  try { return JSON.parse(matches[0]![1]!) as Status } catch { throw new TypeError("V138_262_63_STATUS_JSON_INVALID") }
}
const equals = (actual: unknown, expected: unknown) => JSON.stringify(actual) === JSON.stringify(expected)
const requiredFalse = [
  "independent_person_claimed", "reviewer_separated", "cryptographic_reviewer_identity_claimed",
  "independent_custody_claimed", "route_started", "candidate_search_authorized", "phase263_authorized",
  "formation_materialization_authorized", "holdout_opening_authorized", "public_authorized",
  "foundation_activation_root_present", "production_authorized",
] as const

export const checkV138Plan26263DependencyBoundaries = (repoRoot = root) => {
  const lifecycle = inspectV138Plan26263Lifecycle(repoRoot)
  const transition = proofStatuses[lifecycle.state]
  for (const repoPath of files) {
    const current = status(readFileSync(path.resolve(repoRoot, repoPath), "utf8"))
    const expectedIncomplete = lifecycle.state === "plan_262_63_summary_committed"
      ? ["262-56", "262-57", "262-48"] : ["262-63", "262-56", "262-57", "262-48"]
    if (current.proof_status !== transition || current.admit_03 !== "blocked" || current.fresh_accepted !== 0 ||
      current.required_accepted !== 540 || (current.review_v3_root ?? current.source_review_v3_root) !== null || current.archived_plan_62 !== archivePath ||
      current.archived_plan_62_sha256 !== archiveHash || current.next_action !==
        (lifecycle.state === "plan_262_63_summary_committed" ? "code-review-262-63" : "262-63") ||
      current.total_plans !== lifecycle.activePlans || current.trustworthy_summaries !== lifecycle.summaries ||
      current.authority_expired !== true || current.no_retry !== true ||
      !equals(current.incomplete, expectedIncomplete) || requiredFalse.some(key => current[key] !== false))
      throw new TypeError("V138_262_63_STATUS_DENIAL_INVALID")
  }
  return Object.freeze({ status: "passed", lifecycle, authority: "denied" as const })
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.slice(2).join(" ") !== "--check") throw new TypeError("V138_262_63_ARGUMENTS_INVALID")
  process.stdout.write(`${JSON.stringify(checkV138Plan26263DependencyBoundaries())}\n`)
}
