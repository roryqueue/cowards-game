#!/usr/bin/env -S pnpm exec tsx
import { createHash } from "node:crypto"
import { lstatSync, readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const archive = ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/archived/262-62-HISTORICAL.md"
const archiveHash = "438e139b6710c482b668514091968ee3a31ea575f2d0d002ec0c11473fdbc07a"
const historical = [
  [".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-61-SUMMARY.md", "ccd9f3e727d319d76e8459efd149854fd22eec30a38dcb8286f7c05b3f802eb6"],
  [".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-63-SUMMARY.md", "fc0b8d6fe9a9bfbdf7e743289b040b48d9f034a2b07c4f9df8b35557d5eec2ff"],
  [".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-63-CODE-REVIEW.md", "c4bd3900806e964dc1f1a1fdc1e539a33e95acd274a60f2711c7bacb85438756"],
  ["scripts/check-v1-38-plan-262-61-source-completeness-review-v3.ts", "cd736dbf3b496ac929a864178b9974fa4cf762ff26f89073bef3812fc102b8c5"],
] as const
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
  for (const [repoPath, expected] of historical) {
    const current = createHash("sha256").update(readFileSync(path.resolve(root, repoPath))).digest("hex")
    if (current !== expected) throw new TypeError("V138_262_65_HISTORICAL_INPUT_INVALID")
  }
  const present = (repoPath: string) => { try { lstatSync(path.resolve(root, repoPath)); return true } catch (error: unknown) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return false; throw error } }
  if (forbidden.some(present))
    throw new TypeError("V138_262_65_FORBIDDEN_DESTINATION_PRESENT")
  return Object.freeze({ reviewer: "r4_source_only", disposition: "no_canonical_output", admit03: "blocked", freshAccepted: 0, requiredAccepted: 540, authority: "denied" as const })
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.slice(2).join(" ") !== "--check") throw new TypeError("V138_262_65_ARGUMENTS_INVALID")
  process.stdout.write(`${JSON.stringify(checkV138Plan26265R4Source(root))}\n`)
}
