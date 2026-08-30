import { execFileSync } from "node:child_process"
import { existsSync, lstatSync, readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

const repoRoot = path.resolve(import.meta.dirname, "..")
const sourcePath = path.join(repoRoot, "scripts/run-v1-38-bounded-retry-envelope-v3-live-v12.ts")
const producerDestinations = [
  ".planning/artifacts/v1.38-current-matrix-retry-terminal-v3.json",
  ".planning/artifacts/v1.38-current-matrix-reproduction-v17.json",
  ".planning/artifacts/v1.38-current-matrix-retry-v3-journal.json",
]

const runExpectingFailure = (script: string, selector: string): string => {
  try {
    execFileSync("pnpm", ["exec", "tsx", script, selector], {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    })
    throw new Error("EXPECTED_FAIL_CLOSED_REJECTION")
  } catch (error) {
    return `${(error as { stderr?: string }).stderr ?? ""}${String(error)}`
  }
}

describe("Plan 262-119 allowed live-v12 successor", () => {
  it("reproduces stale-current v1 rejection before the additive successor exists", () => {
    const liveV11 = runExpectingFailure(
      "scripts/run-v1-38-bounded-retry-envelope-v3-live-v11.ts",
      "--check-reviewed-live-ready",
    )
    const plan118 = runExpectingFailure(
      "scripts/check-v1-38-plan-262-118-live-v11-custody-v1.ts",
      "--check-review",
    )

    expect(liveV11).toContain("V138_PATH_STABLE_CURRENT_ENTRY_INVALID")
    expect(plan118).toContain("V138_PLAN118_SUBJECT_ENTRY_INVALID")
    for (const destination of producerDestinations)
      expect(() => lstatSync(path.join(repoRoot, destination))).toThrow()

    expect(existsSync(sourcePath)).toBe(true)
    expect(readFileSync(sourcePath, "utf8")).toContain("V138_LIVE_V12_MODES")
  }, 120_000)
})
