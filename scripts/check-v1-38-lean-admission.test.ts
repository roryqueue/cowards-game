import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import {
  LEAN_ARTIFACT_PATHS,
  LEAN_EXECUTABLE_CLOSURE_PATHS,
  assertLeanStatus,
  checkLeanReadiness,
  checkLeanSourceReview,
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

  it("uses the one canonical Plan 150-152 path map and full minimum closure", () => {
    expect(LEAN_ARTIFACT_PATHS.terminal).toBe(".planning/artifacts/v1.38-lean-runner-terminal.json")
    expect(LEAN_ARTIFACT_PATHS.readiness).toBe(".planning/artifacts/v1.38-lean-runner-readiness-v1.json")
    expect(LEAN_ARTIFACT_PATHS.adjudication).toBe(".planning/artifacts/v1.38-lean-runner-adjudication-v1.json")
    expect(LEAN_EXECUTABLE_CLOSURE_PATHS).toContain("apps/runtime-service/src/execute-match.ts")
    expect(LEAN_EXECUTABLE_CLOSURE_PATHS).toContain("packages/engine/src/kernel/driver.ts")
    expect(LEAN_EXECUTABLE_CLOSURE_PATHS).toContain("packages/spec/src/runtime-execution-service-v1-18.ts")
    expect(LEAN_EXECUTABLE_CLOSURE_PATHS).toContain("packages/persistence/src/starter-strategies.ts")
  })

  it("requires literal-zero non-authorizing review before readiness", () => {
    const manifest = renderLeanManifest(process.cwd(), process.env.LEAN_TEST_SOURCE_COMMIT ?? "HEAD")
    const review = {
      schemaVersion: "v1.38-lean-runner-source-review-v1",
      sourceCommit: manifest.source.commit,
      manifestRoot: "sha256:" + "a".repeat(64),
      findingCount: 0,
      findings: [],
      admitsExecution: false,
      authority: manifest.authority,
    }
    expect(() => checkLeanSourceReview(manifest, review)).not.toThrow()
    expect(() => checkLeanSourceReview(manifest, { ...review, findingCount: 1 })).toThrow()
    expect(() => checkLeanReadiness(manifest, review, {
      schemaVersion: "v1.38-lean-runner-readiness-v1",
      sourceCommit: manifest.source.commit,
      findingCount: 0,
      plan151Eligible: true,
      liveInvocationLimit: 1,
      liveInvocationsConsumed: 0,
      correctiveRerunAuthorized: false,
      authority: manifest.authority,
    })).not.toThrow()
  })
})
