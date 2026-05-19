import { describe, expect, it } from "vitest"
import {
  DEFAULT_LADDER_MINIMUM_ENTRIES,
  DEFAULT_LADDER_TARGET_POD_SIZE,
  trialLadderStatusLabel,
} from "./ladder.js"

describe("trial ladder contracts", () => {
  it("uses resettable beta lifecycle labels without permanent rating language", () => {
    expect(trialLadderStatusLabel("draft")).toBe("Preparing")
    expect(trialLadderStatusLabel("open")).toBe("Open for entries")
    expect(trialLadderStatusLabel("scheduling")).toBe("Scheduling matches")
    expect(trialLadderStatusLabel("active")).toBe("Matches running")
    expect(trialLadderStatusLabel("completed")).toBe("Complete")
    expect(trialLadderStatusLabel("archived")).toBe("Archived")
  })

  it("defaults to four-entry deterministic pods", () => {
    expect(DEFAULT_LADDER_MINIMUM_ENTRIES).toBe(4)
    expect(DEFAULT_LADDER_TARGET_POD_SIZE).toBe(4)
  })
})
