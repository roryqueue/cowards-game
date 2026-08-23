import { existsSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const checkerPath = path.join(repoRoot,
  "scripts/check-v1-38-plan-262-61-source-completeness-review-v3.ts")

describe("Plan 262-61 independent exact-A9 reviewer-v3", () => {
  it("has an independently authored reviewer implementation", async () => {
    if (!existsSync(checkerPath)) {
      throw new TypeError("[RED:INDEPENDENT_A9_REVIEWER_V3]")
    }
    const reviewer = await import(
      "./check-v1-38-plan-262-61-source-completeness-review-v3.js")
    expect(reviewer.SOURCE_A9).toBe(
      "c112383a6e23196da0e9f2d4cd2fc72736a4952f")
  })
})
