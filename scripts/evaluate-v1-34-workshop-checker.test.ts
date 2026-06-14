import { describe, expect, it } from "vitest"
import { evaluateV134WorkshopChecker } from "./evaluate-v1-34-workshop-checker.js"

describe("v1.34 Workshop checker proof", () => {
  it("validates all four Workshop checker paths through runtime-service", async () => {
    const proof = await evaluateV134WorkshopChecker()

    expect(proof.results.map((result) => result.sourceFormat).sort()).toEqual([
      "python",
      "rust",
      "typescript",
      "zig",
    ])
    expect(
      proof.results
        .filter(
          (result) =>
            result.sourceFormat === "typescript" ||
            result.sourceFormat === "python",
        )
        .every((result) => result.status === "ready"),
    ).toBe(true)
    expect(
      proof.results
        .filter(
          (result) =>
            result.sourceFormat === "rust" || result.sourceFormat === "zig",
        )
        .every(
          (result) =>
            result.status === "ready" ||
            result.status === "toolchain_unavailable",
        ),
    ).toBe(true)
    expect(proof.unavailableProbe.status).toBe("runtime_service_unavailable")
  }, 90_000)
})
