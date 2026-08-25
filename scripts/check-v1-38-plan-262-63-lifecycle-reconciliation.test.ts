import { execFileSync } from "node:child_process"
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import {
  V138_262_62_ACTIVE,
  V138_262_62_ARCHIVE,
  V138_262_62_ARCHIVE_SHA256,
  inspectV138Plan26263Lifecycle,
} from "./lib/v1-38-plan-262-63-lifecycle-reconciliation.js"

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..")
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
    execFileSync("git", ["add", path.relative(directory, target)], { cwd: directory })
    expect(() => inspectV138Plan26263Lifecycle(directory)).toThrow("V138_262_63_PLAN_INVENTORY_INVALID")
  })
})
