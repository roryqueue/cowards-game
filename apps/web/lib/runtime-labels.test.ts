import { describe, expect, it } from "vitest"
import {
  runtimeExhibitionStatusLabel,
  sourceFormatExhibitionLabel,
  sourceFormatRuntimeCue,
  sourceFormatShortLabel,
} from "./runtime-labels.js"

describe("runtime language labels", () => {
  it("derives non-counted language labels from the supported language registry", () => {
    expect(
      runtimeExhibitionStatusLabel({
        languageId: "python",
        languageLabel: "Python",
        countedPlayLabel: "Not counted",
      }),
    ).toBe("Python · non-counted exhibition beta")
    expect(sourceFormatExhibitionLabel("rust")).toBe(
      "Rust · non-counted exhibition beta",
    )
    expect(sourceFormatShortLabel("zig")).toBe("Zig beta")
    expect(sourceFormatRuntimeCue("python")).toContain("Runtime Broker")
  })

  it("keeps TypeScript counted labels neutral", () => {
    expect(
      runtimeExhibitionStatusLabel({
        languageId: "typescript",
        languageLabel: "TypeScript",
        countedPlayLabel: "Counted eligible",
      }),
    ).toBe("TypeScript · Counted eligible")
    expect(sourceFormatExhibitionLabel("typescript")).toBeNull()
    expect(sourceFormatShortLabel("typescript")).toBe("TS")
    expect(sourceFormatRuntimeCue("typescript")).toBeNull()
  })
})
