import { execFileSync } from "node:child_process"
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { afterEach, describe, expect, it } from "vitest"
import {
  V138_262_62_ACTIVE,
  V138_262_62_ARCHIVE,
  V138_262_62_ARCHIVE_SHA256,
  inspectV138Plan26263Lifecycle,
} from "./lib/v1-38-plan-262-63-lifecycle-reconciliation.js"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const disposable: string[] = []
const clone = () => {
  const directory = mkdtempSync(path.join(os.tmpdir(), "plan-262-63-lifecycle-"))
  disposable.push(directory)
  execFileSync("git", ["clone", "--quiet", "--no-hardlinks", root, directory])
  return directory
}
afterEach(() => { while (disposable.length) rmSync(disposable.pop()!, { recursive: true, force: true }) })

describe("Plan 262-63 lifecycle reconciliation", () => {
  it("accepts the committed lifecycle-summary state", () => {
    expect(inspectV138Plan26263Lifecycle(root)).toMatchObject({ state: "plan_262_63_summary_committed",
      activePlans: 48, summaries: 45, archive: { sha256: V138_262_62_ARCHIVE_SHA256 } })
  })

  it("accepts the exact archived pre-successor state", () => {
    const directory = clone()
    execFileSync("git", ["checkout", "--quiet", "--detach", "00187acb8871518a71c072958363598f506da500"], { cwd: directory })
    expect(inspectV138Plan26263Lifecycle(directory)).toMatchObject({ state: "archived_262_62_pre_successor",
      activePlans: 47, summaries: 44, archive: { sha256: V138_262_62_ARCHIVE_SHA256 } })
  })

  it("rejects archive mutation and Plan-262-62 revival", () => {
    const directory = clone()
    writeFileSync(path.join(directory, V138_262_62_ARCHIVE), "mutated\n")
    expect(() => inspectV138Plan26263Lifecycle(directory)).toThrow("V138_262_63_PLAN_62_ARCHIVE_INVALID")
    writeFileSync(path.join(directory, V138_262_62_ARCHIVE), readFileSync(path.join(root, V138_262_62_ARCHIVE)))
    writeFileSync(path.join(directory, V138_262_62_ACTIVE), "---\nplan: 62\nwave: 45\ndepends_on: [262-61]\n---\n")
    expect(() => inspectV138Plan26263Lifecycle(directory)).toThrow("V138_262_63_PLAN_62_REVIVED")
  })

  it("rejects an extra active plan", () => {
    const directory = clone()
    const target = path.join(directory, path.dirname(V138_262_62_ACTIVE), "262-99-PLAN.md")
    writeFileSync(target,
      "---\nplan: 99\nwave: 99\ndepends_on: []\n---\n")
    expect(() => inspectV138Plan26263Lifecycle(directory)).toThrow("V138_262_63_UNTRACKED_LIFECYCLE_PATH")
  })

  it("rejects uncommitted predecessor and summary substitutions", () => {
    const directory = clone()
    const predecessor = path.join(directory, ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-56-PLAN.md")
    writeFileSync(predecessor, `${readFileSync(predecessor, "utf8")}\nmutation\n`)
    expect(() => inspectV138Plan26263Lifecycle(directory)).toThrow("V138_262_63_WORKTREE_BLOB_MISMATCH")
    const summary = path.join(directory, ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-63-SUMMARY.md")
    writeFileSync(predecessor, readFileSync(path.join(root, ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-56-PLAN.md")))
    writeFileSync(summary, "substituted\n")
    expect(() => inspectV138Plan26263Lifecycle(directory)).toThrow("V138_262_63_WORKTREE_BLOB_MISMATCH")
  })

  it("rejects rewrite-then-restore summary history", () => {
    const directory = clone()
    const summary = ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-63-SUMMARY.md"
    const original = readFileSync(path.join(directory, summary), "utf8")
    writeFileSync(path.join(directory, summary), `${original}\nrewrite\n`)
    execFileSync("git", ["add", summary], { cwd: directory })
    execFileSync("git", ["-c", "user.name=Lifecycle Test", "-c", "user.email=lifecycle@example.invalid", "commit", "-m", "rewrite summary"], { cwd: directory })
    writeFileSync(path.join(directory, summary), original)
    execFileSync("git", ["add", summary], { cwd: directory })
    execFileSync("git", ["-c", "user.name=Lifecycle Test", "-c", "user.email=lifecycle@example.invalid", "commit", "-m", "restore summary"], { cwd: directory })
    expect(() => inspectV138Plan26263Lifecycle(directory)).toThrow("V138_262_63_SUMMARY_CARRIER_INVALID")
  })

  it("statically excludes review derivation and execution imports", () => {
    const source = readFileSync(path.join(root, "scripts/lib/v1-38-plan-262-63-lifecycle-reconciliation.ts"), "utf8")
    expect(source).not.toContain('from "./')
    expect(source).not.toContain("deriveV138Plan26261NoPublish")
    expect(source).not.toContain("dispatchV138")
    expect(source).not.toMatch(/from\s+["'][^"']*current-matrix-reproduction/u)
  })
})
