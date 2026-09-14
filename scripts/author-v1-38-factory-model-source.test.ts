import { describe, expect, it } from "vitest"
import { assessAuthoringUsage, buildFactoryAuthorCommand, createFactoryAuthoringAllocation, createIndependentSourceReviewHandoff, FACTORY_SOURCE_RECIPES } from "./author-v1-38-factory-model-source.js"

const root = `sha256:${"a".repeat(64)}` as const
describe("fresh model authoring allocation", () => {
  it("freezes all attempts, controls, limits, and source-only context before output", () => {
    const allocation = createFactoryAuthoringAllocation()
    expect(allocation.attempts).toEqual(["A-01", "A-02", "A-03", "A-04"])
    expect(Object.keys(FACTORY_SOURCE_RECIPES)).toEqual(["S01", "S02", "S03", "S04", "S05", "S06", "S07", "S08", "S09", "S10", "S11", "S12"])
    expect(allocation).toMatchObject({ windowMinutes: 30, perAttemptTokenCeiling: 50_000, totalTokenCeiling: 200_000, workloadCount: 48, workloadWindowMinutes: 90, maxInvocations: 256, maxLifetimeMs: 120_000, perMethodMilliseconds: 1_000, providerTokenCapAvailability: "unavailable", humanExternal: "unused_zero" })
    const command = buildFactoryAuthorCommand(allocation, root, { documentedReadOnlyDefault: true, documentedJson: true, documentedEphemeral: true, documentedIgnoreUserConfig: true })
    expect(command).toMatchObject({ status: "ready", cwd: "disclosed-packet-only", packetRoot: root })
    expect(JSON.stringify(command)).not.toContain(".planning")
  })
  it("fails closed without documented isolation and charges missing or excessive usage", () => {
    const allocation = createFactoryAuthoringAllocation()
    expect(buildFactoryAuthorCommand(allocation, root, { documentedReadOnlyDefault: false, documentedJson: true, documentedEphemeral: true, documentedIgnoreUserConfig: true })).toEqual({ status: "authoring_context_capability_unavailable" })
    expect(assessAuthoringUsage(null)).toBe("charged_terminal_stop")
    expect(assessAuthoringUsage({ inputTokens: 25_000, outputTokens: 25_001, cachedInputTokens: 0, totalTokens: 50_001 })).toBe("charged_terminal_stop")
    expect(assessAuthoringUsage({ inputTokens: 25_000, outputTokens: 25_000, cachedInputTokens: 5_000, totalTokens: 50_000 })).toBe("within_ceiling")
    expect(createIndependentSourceReviewHandoff(allocation)).toMatchObject({ status: "source_ready_for_independent_review", empiricalAction: "not_authorized" })
  })
})
