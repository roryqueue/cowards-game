import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { COMPETITION_ACCOUNT_RECOVERY_POLICY } from "@cowards/spec"

describe("account recovery expectations", () => {
  it("is policy-only and makes no recovery or rating repair promise", () => {
    const copy = JSON.stringify(COMPETITION_ACCOUNT_RECOVERY_POLICY)
    const source = readFileSync(
      "apps/web/app/account/recovery/page.tsx",
      "utf8",
    )
    expect(copy).toContain("not available in this public beta")
    expect(copy).toContain("no permanent rating repair is promised")
    expect(source).not.toMatch(/<form|<input|upload/i)
  })
})
