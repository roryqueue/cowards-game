import { readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

const repoRoot = path.resolve(import.meta.dirname, "..")
const readJson = (repoPath: string) => JSON.parse(
  readFileSync(path.join(repoRoot, repoPath), "utf8"),
) as Record<string, unknown>

describe("Plan 262-117 authoritative readiness consumer", () => {
  it("requires an additive owner because live-v10 binds v1 while supplement-v3 binds v2", () => {
    const v1 = readJson(".planning/artifacts/v1.38-plan-262-114-live-v10-custody-review-payload-v1.json")
    const v2 = readJson(".planning/artifacts/v1.38-plan-262-114-live-v10-custody-review-payload-v2.json")
    const supplement = readJson(".planning/artifacts/v1.38-successor-source-seal-v13-executable-custody-supplement-v3.json")
    const liveV10 = readFileSync(
      path.join(repoRoot, "scripts/run-v1-38-bounded-retry-envelope-v3-live-v10.ts"),
      "utf8",
    )

    expect(supplement.plan114PayloadRoot).toBe(v2.payloadRoot)
    expect(supplement.plan114PayloadRoot).not.toBe(v1.payloadRoot)
    expect(liveV10).toContain("v1.38-plan-262-114-live-v10-custody-review-payload-v1.json")

    expect(() => readFileSync(
      path.join(repoRoot, "scripts/run-v1-38-bounded-retry-envelope-v3-live-v11.ts"),
    )).not.toThrow()
  })
})
