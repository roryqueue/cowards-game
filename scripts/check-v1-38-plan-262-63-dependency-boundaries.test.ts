import { execFileSync } from "node:child_process"
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { afterEach, describe, expect, it } from "vitest"
import { checkV138Plan26263DependencyBoundaries } from "./check-v1-38-plan-262-63-dependency-boundaries.js"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const disposable: string[] = []
const clone = () => {
  const directory = mkdtempSync(path.join(os.tmpdir(), "plan-262-63-status-"))
  disposable.push(directory)
  execFileSync("git", ["clone", "--quiet", "--no-hardlinks", root, directory])
  return directory
}
afterEach(() => { while (disposable.length) rmSync(disposable.pop()!, { recursive: true, force: true }) })

describe("Plan 262-63 dependency denials", () => {
  it("binds lifecycle reconciliation to all authority denials", () => {
    expect(checkV138Plan26263DependencyBoundaries()).toMatchObject({ status: "passed",
      authority: "denied", lifecycle: { state: "plan_262_63_summary_committed", activePlans: 48, summaries: 45 } })
  })

  it.each([
    ['"production_authorized":false', '"production_authorized":true'],
    ['"route_started":false', '"route_started":true'],
    ['"source_review_v3_root":null', '"source_review_v3_root":"sha256:forged"'],
    ['"archived_plan_62_sha256":"438e139b6710c482b668514091968ee3a31ea575f2d0d002ec0c11473fdbc07a"', '"archived_plan_62_sha256":"forged"'],
    ['"incomplete":["262-56","262-57","262-48"]', '"incomplete":["262-57","262-48"]'],
  ])("rejects a semantic status tamper", (before, after) => {
    const directory = clone()
    const target = path.join(directory, ".planning/STATE.md")
    writeFileSync(target, readFileSync(target, "utf8").replace(before, after))
    expect(() => checkV138Plan26263DependencyBoundaries(directory)).toThrow("V138_262_63_STATUS_DENIAL_INVALID")
  })
})
