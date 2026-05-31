import { describe, expect, it } from "vitest"
import {
  runtimeExhibitionStatusLabel,
  sourceFormatExhibitionLabel,
  sourceFormatRuntimeCue,
  sourceFormatShortLabel,
} from "./runtime-labels.js"

describe("runtime language labels", () => {
  it("derives language labels from the supported language registry", () => {
    expect(
      runtimeExhibitionStatusLabel({
        languageId: "python",
        languageLabel: "Python",
        countedPlayLabel: "Counted eligible",
      }),
    ).toBe("Python · Counted eligible")
    expect(sourceFormatExhibitionLabel("python")).toBeNull()
    expect(sourceFormatShortLabel("python")).toBe("PY")
    expect(sourceFormatRuntimeCue("python")).toBeNull()
    expect(sourceFormatExhibitionLabel("rust")).toBeNull()
    expect(sourceFormatShortLabel("rust")).toBe("Rust")
    expect(sourceFormatShortLabel("zig")).toBe("Zig")
    expect(sourceFormatRuntimeCue("rust")).toBeNull()
    expect(sourceFormatRuntimeCue("zig")).toBeNull()
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
