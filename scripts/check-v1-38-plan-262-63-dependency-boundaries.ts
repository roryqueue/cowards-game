#!/usr/bin/env -S pnpm exec tsx
import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { inspectV138Plan26263Lifecycle } from "./lib/v1-38-plan-262-63-lifecycle-reconciliation.js"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const files = [".planning/ROADMAP.md", ".planning/STATE.md"] as const
const required = [
  '"proof_status":"plan_262_62_archived_plan_262_63_lifecycle_reconciliation_pending"',
  '"admit_03":"blocked"', '"fresh_accepted":0', '"required_accepted":540',
  '"candidate_search_authorized":false', '"phase263_authorized":false',
  '"formation_materialization_authorized":false', '"holdout_opening_authorized":false',
  '"public_authorized":false', '"production_authorized":false', '"next_action":"262-63"',
] as const

export const checkV138Plan26263DependencyBoundaries = (repoRoot = root) => {
  const lifecycle = inspectV138Plan26263Lifecycle(repoRoot)
  if (lifecycle.state !== "plan_262_63_pending") throw new TypeError("V138_262_63_STATE_NOT_PENDING")
  for (const repoPath of files) {
    const content = readFileSync(path.resolve(repoRoot, repoPath), "utf8")
    if (required.some(value => !content.includes(value)))
      throw new TypeError("V138_262_63_STATUS_DENIAL_INVALID")
  }
  return Object.freeze({ status: "passed", lifecycle, authority: "denied" as const })
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.slice(2).join(" ") !== "--check") throw new TypeError("V138_262_63_ARGUMENTS_INVALID")
  process.stdout.write(`${JSON.stringify(checkV138Plan26263DependencyBoundaries())}\n`)
}
