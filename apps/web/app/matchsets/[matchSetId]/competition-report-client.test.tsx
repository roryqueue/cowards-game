import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"

const source = readFileSync(
  "apps/web/app/matchsets/[matchSetId]/competition-report-client.tsx",
  "utf8",
)

describe("competition report client", () => {
  it("uses bounded typed intake without client-owned dispute authority", () => {
    expect(source).toContain("maxLength={500}")
    expect(source).toContain("disabled={!canDispute}")
    expect(source).toContain("/reports")
    expect(source).not.toContain("reporterUserId")
    expect(source).not.toContain("publicExplanation")
  })

  it("warns against private evidence", () => {
    expect(source).toContain("Do not include credentials")
    expect(source).toContain("recovery evidence")
  })
})
