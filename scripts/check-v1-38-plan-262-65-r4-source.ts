#!/usr/bin/env -S pnpm exec tsx
import { createHash } from "node:crypto"
import { existsSync, lstatSync, readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const archive = ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/archived/262-62-HISTORICAL.md"
const archiveHash = "438e139b6710c482b668514091968ee3a31ea575f2d0d002ec0c11473fdbc07a"
const forbidden = [
  ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-62-PLAN.md",
  ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-62-SUMMARY.md",
  ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-62-REVIEW.md",
  ".planning/artifacts/v1.38-plan-262-62-source-completeness-review-v3.json",
  ".planning/artifacts/v1.38-plan-262-56-authorization-v9.json",
  ".planning/artifacts/v1.38-successor-source-seal-v9.json",
  ".planning/artifacts/v1.38-plan-262-57-route-start-v1.json",
  ".planning/artifacts/v1.38-current-matrix-reproduction-v12.json",
] as const

export const checkV138Plan26265R4Source = (root: string) => {
  const target = path.resolve(root, archive)
  const stat = lstatSync(target)
  if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1) throw new TypeError("V138_262_65_ARCHIVE_PATH_INVALID")
  const sha256 = createHash("sha256").update(readFileSync(target)).digest("hex")
  if (sha256 !== archiveHash) throw new TypeError("V138_262_65_ARCHIVE_HASH_INVALID")
  if (forbidden.some(repoPath => existsSync(path.resolve(root, repoPath))))
    throw new TypeError("V138_262_65_FORBIDDEN_DESTINATION_PRESENT")
  return Object.freeze({ reviewer: "r4_source_only", disposition: "no_canonical_output", admit03: "blocked", freshAccepted: 0, requiredAccepted: 540, authority: "denied" as const })
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.slice(2).join(" ") !== "--check") throw new TypeError("V138_262_65_ARGUMENTS_INVALID")
  process.stdout.write(`${JSON.stringify(checkV138Plan26265R4Source(root))}\n`)
}
