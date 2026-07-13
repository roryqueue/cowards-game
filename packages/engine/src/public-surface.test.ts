import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import * as enginePublic from "./index.js"

const contiguousActivationKey = ["resolve", "Activation"].join("")

const migratedCallerSources = [
  new URL("./activation.test.ts", import.meta.url),
  new URL("./backstab.test.ts", import.meta.url),
  new URL("./lifecycle-repairs.test.ts", import.meta.url),
  new URL("./movement.test.ts", import.meta.url),
  new URL("./fixtures/v1-4-compatibility.ts", import.meta.url),
  new URL(
    "../../../.planning/artifacts/v2.0-core-rules-audit/reproduce-core-rule-gaps.ts",
    import.meta.url,
  ),
].map((url) => readFileSync(url, "utf8"))

describe("candidate and current engine public surfaces", () => {
  it("exposes the current facade over the sole kernel authority", () => {
    expect(enginePublic.runMatch).not.toBe(
      enginePublic.MATCH_KERNEL.runMatch,
    )
    expect(
      enginePublic[contiguousActivationKey as keyof typeof enginePublic],
    ).toBeUndefined()
  })

  it("keeps the kernel authority free of the retired contiguous helper", () => {
    expect(
      Object.hasOwn(
        enginePublic.MATCH_KERNEL,
        contiguousActivationKey,
      ),
    ).toBe(false)
    expect(Object.keys(enginePublic.MATCH_KERNEL).sort()).toEqual(
      [
        "createActivationMachine",
        "createMachine",
        "runActivationFromState",
        "runMatch",
        "stepMatch",
        "tuple",
        "tupleId",
      ].sort(),
    )
  })

  it("proves migrated callers delegate scheduling instead of copying a Cycle loop", () => {
    const copiedCycleLoop =
      /\b(?:while\s*\(|for\s*\([^\n)]*(?:activation|cycle|slot))/u
    for (const source of migratedCallerSources) {
      expect(source).not.toMatch(copiedCycleLoop)
    }
  })
})
