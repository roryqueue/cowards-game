import { describe, expect, it } from "vitest"
import {
  assertCountedEntryEligibilityPublicLeakSafe,
  COUNTED_ENTRY_ELIGIBILITY_CATEGORIES,
  COUNTED_ENTRY_ELIGIBILITY_PUBLIC_PAYLOAD,
  COUNTED_ENTRY_ELIGIBILITY_SUPPORTED_LANES,
  COUNTED_ENTRY_ELIGIBILITY_PUBLIC_COPY,
  getCountedEntryEligibilityPublicCopy,
  isCountedEntrySupportedLane,
} from "./competition-entry-eligibility.js"

const expectedCategories = [
  "provider_validated",
  "season_not_open",
  "owner_mismatch",
  "invalid_strategy_revision",
  "mutable_draft",
  "unsupported_source_format",
  "hidden_unsupported_provider",
  "incompatible_runtime_metadata",
  "package_policy_violation",
  "capability_policy_violation",
  "provider_proof_missing",
  "provider_proof_mismatched",
  "provider_proof_stale",
  "runtime_service_unavailable",
  "already_entered_season",
  "replacement_blocked",
] as const

const privateMarkerPayloads = [
  { strategySource: "private source text" },
  { artifactBytesBase64: "private compiled data" },
  { rawDiagnostics: "Traceback: private detail" },
  { hostPaths: ["/private/host/path"] },
  { envValues: { DATABASE_URL: "postgres://private" } },
  { packagePaths: ["site-packages/private"] },
  { tokens: ["Bearer private"] },
  { dbDetails: "private datastore detail" },
  { providerSigningMaterial: "private provider key detail" },
  { privateRuntimeInternals: { stderr: "private" } },
  { strategyMemory: { hidden: true } },
  { soldierMemory: { hidden: true } },
  { objectivePayload: { hidden: true } },
  { operatorOnlyData: { hidden: true } },
] as const

const forbiddenPublicPhrases = [
  "Strategy" + " source",
  "artifact" + " bytes",
  "raw" + " diagnostics",
  "host" + " paths",
  "env" + " values",
  "package" + " paths",
  "tokens",
  "DB" + " details",
  "provider" + " signing" + " material",
  "private" + " runtime" + " internals",
  "Strategy" + "Memory",
  "Soldier" + "Memory",
  "objective" + " payload",
  "operator" + "-only",
] as const

describe("counted entry eligibility contract", () => {
  it("ELIG-01/ELIG-02 defines the exact public eligibility category list", () => {
    expect(COUNTED_ENTRY_ELIGIBILITY_CATEGORIES).toEqual(expectedCategories)
  })

  it("ELIG-03 gives every non-success category public message and remediation copy", () => {
    for (const category of expectedCategories) {
      const copy = getCountedEntryEligibilityPublicCopy(category)
      expect(copy.category).toBe(category)

      if (category === "provider_validated") {
        expect(copy.publicMessage).toContain("ready")
        expect(copy.remediation).toContain("No action")
        continue
      }

      expect(copy.publicMessage).toEqual(expect.any(String))
      expect(copy.publicMessage.length).toBeGreaterThan(20)
      expect(copy.remediation).toEqual(expect.any(String))
      expect(copy.remediation.length).toBeGreaterThan(20)
      for (const phrase of forbiddenPublicPhrases) {
        expect(copy.remediation.toLowerCase()).not.toContain(
          phrase.toLowerCase(),
        )
      }
    }

    expect(Object.keys(COUNTED_ENTRY_ELIGIBILITY_PUBLIC_COPY)).toEqual(
      expectedCategories,
    )
  })

  it("D-05/D-06 pins counted trial lanes to TypeScript, Python, Rust, and Zig only", () => {
    expect(COUNTED_ENTRY_ELIGIBILITY_SUPPORTED_LANES).toEqual([
      "typescript",
      "python",
      "rust",
      "zig",
    ])
    expect(isCountedEntrySupportedLane("typescript")).toBe(true)
    expect(isCountedEntrySupportedLane("python")).toBe(true)
    expect(isCountedEntrySupportedLane("rust")).toBe(true)
    expect(isCountedEntrySupportedLane("zig")).toBe(true)
    expect(isCountedEntrySupportedLane("javascript")).toBe(false)
    expect(isCountedEntrySupportedLane("tinygo")).toBe(false)
  })

  it("D-07 keeps the public payload and public copy leak-safe", () => {
    expect(() =>
      assertCountedEntryEligibilityPublicLeakSafe(
        COUNTED_ENTRY_ELIGIBILITY_PUBLIC_PAYLOAD,
      ),
    ).not.toThrow()

    for (const copy of Object.values(COUNTED_ENTRY_ELIGIBILITY_PUBLIC_COPY)) {
      expect(() =>
        assertCountedEntryEligibilityPublicLeakSafe(copy),
      ).not.toThrow()
    }

    const serialized = JSON.stringify(COUNTED_ENTRY_ELIGIBILITY_PUBLIC_PAYLOAD)
    for (const phrase of forbiddenPublicPhrases) {
      expect(serialized.toLowerCase()).not.toContain(phrase.toLowerCase())
    }

    for (const marker of privateMarkerPayloads) {
      expect(() =>
        assertCountedEntryEligibilityPublicLeakSafe(marker),
      ).toThrow(/private|leaks/i)
    }
  })
})
