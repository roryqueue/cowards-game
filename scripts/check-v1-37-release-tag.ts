#!/usr/bin/env -S pnpm exec tsx
import { execFileSync, spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import { existsSync, readFileSync, realpathSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const readinessPath = ".planning/artifacts/v1.37-release-readiness.json"
const archivePaths = [
  ".planning/ROADMAP.md", ".planning/REQUIREMENTS.md",
  ".planning/v1.37-MILESTONE-AUDIT.md", ".planning/artifacts/v1.37-prearchive-proof.json",
  ".planning/artifacts/v1.37-milestone-audit.json", ".planning/artifacts/v1.37-strategy-evaluation-foundation.json",
  readinessPath,
] as const
const protectedArchivePaths = [
  "CowardsGameSpec_Full_Consolidated_v1.md",
  ".planning/config.json",
] as const
export type V137ReleaseTagFinding = { code: string; path?: string }
export type V137ReleaseTagResult = { mode: "pretag-archive" | "post-tag"; proof08: boolean; findings: readonly V137ReleaseTagFinding[] }
const sha = (value: Buffer | string) => `sha256:${createHash("sha256").update(value).digest("hex")}`
const git = (repo: string, args: string[]) => execFileSync("git", args, { cwd: repo, encoding: "utf8" }).trim()
const add = (findings: V137ReleaseTagFinding[], code: string, file?: string) => findings.push(file ? { code, path: file } : { code })
const blob = (repo: string, commit: string, file: string): Buffer | undefined => {
  const result = spawnSync("git", ["show", `${commit}:${file}`], { cwd: repo, encoding: "buffer" })
  return result.status === 0 ? result.stdout : undefined
}
const readReadiness = (repo: string, commit: string): Record<string, unknown> | undefined => {
  const bytes = blob(repo, commit, readinessPath); if (!bytes) return undefined
  try { return JSON.parse(bytes.toString("utf8")) as Record<string, unknown> } catch { return undefined }
}
const verifyArchive = (repo: string, commit: string, findings: V137ReleaseTagFinding[]): Record<string, unknown> | undefined => {
  if (!/^[0-9a-f]{40}$/u.test(commit)) { add(findings, "ARCHIVE_COMMIT_INVALID"); return undefined }
  let tree: string; try { tree = git(repo, ["rev-parse", `${commit}^{tree}`]) } catch { add(findings, "ARCHIVE_COMMIT_MISSING"); return undefined }
  if (!tree) { add(findings, "ARCHIVE_COMMIT_MISSING"); return undefined }
  const readiness = readReadiness(repo, commit)
  if (!readiness || readiness.releaseState !== "release-ready" || (readiness.releaseOperation as Record<string, unknown> | undefined)?.completion !== false) add(findings, "READINESS_INVALID")
  for (const file of archivePaths) if (!blob(repo, commit, file)) add(findings, "ARCHIVE_PATH_MISSING", file)
  const hashes = readiness?.archiveBlobSha256 as Record<string, unknown> | undefined
  if (hashes) for (const [file, expected] of Object.entries(hashes)) { const bytes = blob(repo, commit, file); if (!bytes || sha(bytes) !== expected) add(findings, "ARCHIVE_BLOB_MISMATCH", file) }
  // A synthetic fixture may have a root archive commit. A real archive retains
  // history, but root commits have no protected-path delta to inspect.
  try { const changedPaths = git(repo, ["diff-tree", "--root", "--no-commit-id", "--name-only", "-r", commit]).split("\n"); if (changedPaths.some((file) => protectedArchivePaths.includes(file as typeof protectedArchivePaths[number]))) add(findings, "PROTECTED_PATH_INCLUDED") } catch { add(findings, "ARCHIVE_COMMIT_INVALID") }
  return readiness
}
export const checkV137ReleaseTag = (options: { repoRoot?: string; archiveCommit?: string; expectedArchiveCommit?: string; mode?: "pretag-archive" | "post-tag" } = {}): V137ReleaseTagResult => {
  const repo = options.repoRoot ?? root; const mode = options.mode ?? "post-tag"; const findings: V137ReleaseTagFinding[] = []
  let archive = options.archiveCommit
  if (mode === "post-tag") {
    const ref = spawnSync("git", ["for-each-ref", "--format=%(objecttype)|%(objectname)|%(refname)", "refs/tags/v1.37"], { cwd: repo, encoding: "utf8" }).stdout.trim()
    if (!ref) add(findings, "TAG_ABSENT"); else { const [type, object] = ref.split("|"); if (type !== "tag") add(findings, "TAG_NOT_ANNOTATED"); else { try { const target = git(repo, ["rev-parse", "v1.37^{}"]); archive = target; const expected = options.expectedArchiveCommit ?? git(repo, ["rev-parse", "HEAD"]); if (target !== expected) add(findings, "TAG_TARGET_NOT_EXPECTED_ARCHIVE"); const body = git(repo, ["for-each-ref", "--format=%(contents)", "refs/tags/v1.37"]); const readiness = readReadiness(repo, target); const fields = readiness?.tagMessageFieldSha256 as Record<string, unknown> | undefined; if (!fields || !Object.values(fields).every((value) => typeof value === "string" && body.includes(value))) add(findings, "TAG_MESSAGE_MISMATCH"); const signature = spawnSync("git", ["verify-tag", object], { cwd: repo, encoding: "utf8" }); const required = process.env.COWARDS_V1_37_MANAGED_SIGNING_IDENTITY; if (required && signature.status !== 0) add(findings, "TAG_SIGNATURE_REQUIRED"); if (!required && signature.status === 0) add(findings, "TAG_SIGNATURE_UNEXPECTED") } catch { add(findings, "TAG_TARGET_INVALID") } }
    }
  } else {
    if (!archive) add(findings, "ARCHIVE_COMMIT_REQUIRED")
    const tag = spawnSync("git", ["tag", "-l", "v1.37"], { cwd: repo, encoding: "utf8" }).stdout.trim(); if (tag) add(findings, "TAG_PRESENT_PREARCHIVE")
  }
  if (archive) verifyArchive(repo, archive, findings)
  return { mode, proof08: mode === "post-tag" && findings.length === 0, findings }
}
const direct = () => { const args = process.argv.slice(2); const pre = args[0] === "--pretag-archive" && args.length === 2 ? args[1] : undefined; const post = args[0] === "--post-tag-archive" && args.length === 2 ? args[1] : undefined; const valid = (pre && args.length === 2) || (post && args.length === 2) || (!pre && !post && args.length === 0); if (!valid) throw new TypeError("V137_RELEASE_TAG_MODE_INVALID"); const result = checkV137ReleaseTag(pre ? { mode: "pretag-archive", archiveCommit: pre } : post ? { expectedArchiveCommit: post } : {}); if (result.findings.length) throw new TypeError(result.findings.map((finding) => finding.code).join(",")); process.stdout.write(`${JSON.stringify({ mode: result.mode, proof08: result.proof08 })}\n`) }
const isDirectRun = () => { try { return !!process.argv[1] && realpathSync(path.resolve(process.argv[1])) === realpathSync(fileURLToPath(import.meta.url)) } catch { return false } }
if (isDirectRun()) { try { direct() } catch (error) { process.stderr.write(`${error instanceof Error ? error.message : "V137_RELEASE_TAG_FAILED"}\n`); process.exitCode = 1 } }
