import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import {
  assertLeanStatus,
  checkLeanManifest,
  renderLeanManifest,
} from "./check-v1-38-lean-admission.js"

const temporary: string[] = []
afterEach(() => temporary.splice(0).forEach((dir) => rmSync(dir, { recursive: true, force: true })))

describe("lean admission custody", () => {
  it("permits only authenticated successor lock residue", () => {
    expect(() => assertLeanStatus(`?? .v138-successor-${"a".repeat(64)}.lock\n`)).not.toThrow()
    expect(() => assertLeanStatus(" M scripts/example.ts\n")).toThrow(/LEAN_WORKTREE_DIRTY/u)
    expect(() => assertLeanStatus("?? unexpected.txt\n")).toThrow(/LEAN_WORKTREE_DIRTY/u)
  })

  it("renders and checks exact committed source without effects", () => {
    const repoRoot = process.cwd()
    const sourceCommit = process.env.LEAN_TEST_SOURCE_COMMIT ?? "HEAD"
    const manifest = renderLeanManifest(repoRoot, sourceCommit)
    expect(manifest.authority.phase263PlanningAuthorized).toBe(false)
    expect(manifest.formationMaterialized).toBe(false)
    expect(() => checkLeanManifest(repoRoot, manifest)).not.toThrow()
    expect(() => checkLeanManifest(repoRoot, { ...manifest, scheduleRoot: `sha256:${"0".repeat(64)}` })).toThrow()
  })

  it("does not create invocation, terminal, readiness, or adjudication artifacts", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "lean-check-")); temporary.push(dir)
    expect(() => renderLeanManifest(dir, "HEAD")).toThrow()
  })
})
