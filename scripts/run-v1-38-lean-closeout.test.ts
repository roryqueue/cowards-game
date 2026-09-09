import { describe, expect, it } from "vitest"
import { mkdtempSync, rmSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { buildLeanSchedule, hashLeanValue } from "./lib/v1-38-lean-runner-feasibility.js"
import { syntheticLeanTerminal } from "./run-v1-38-lean-runner-feasibility.js"
import { CLOSEOUT_PROFILE, consumeCloseout, validateCloseoutPreflight, validateCloseoutTerminal, validateReview } from "./run-v1-38-lean-closeout.js"

describe("approved private closeout", () => {
  it("uses the exact approved profile", () => {
    expect(CLOSEOUT_PROFILE).toEqual({ cpus: "2", memory: "256m", cellDeadlineMilliseconds: 120000, outerDeadlineMilliseconds: 3600000 })
  })
  it("consumes exclusively without replacing prior bytes", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "closeout-test-"))
    try {
      const file = path.join(dir, "once.json")
      consumeCloseout(file, { purpose: "test" })
      const before = readFileSync(file)
      expect(() => consumeCloseout(file, { purpose: "replace" })).toThrow()
      expect(readFileSync(file)).toEqual(before)
    } finally { rmSync(dir, { recursive: true }) }
  })
  it("rejects non-pass, cleanup failure, surplus private payload and profile drift", () => {
    for (const value of [{ status: "non_pass" }, { status: "pass", cleanupComplete: false }, { status: "pass", source: "private" }]) {
      expect(() => validateCloseoutPreflight(value, "sha256:test")).toThrow()
    }
  })
  it("requires complete independent seven-category review", () => {
    expect(() => validateReview({ categories: ["pass"] })).toThrow()
    expect(() => validateReview({ disposition: "pass", reviewer: "", blockers: 0 })).toThrow()
  })
  it("rederives complete 24-cell paired proof and rejects changed or surplus evidence", async () => {
    const proof = await syntheticLeanTerminal()
    const envelope = { schemaVersion: "v1.38-lean-closeout-terminal-v1", bindingRoot: "sha256:test", invocationRoot: "sha256:invoke", profile: CLOSEOUT_PROFILE, scheduleRoot: hashLeanValue(buildLeanSchedule()), terminal: proof }
    expect(validateCloseoutTerminal(envelope, "sha256:test", "sha256:invoke").result).toBe("pass")
    expect(() => validateCloseoutTerminal({ ...envelope, privatePayload: "secret" }, "sha256:test", "sha256:invoke")).toThrow()
    expect(() => validateCloseoutTerminal({ ...envelope, terminal: { ...proof, counts: { ...proof.counts, success: 23 } } }, "sha256:test", "sha256:invoke")).toThrow()
    expect(() => validateCloseoutTerminal(envelope, "sha256:drift", "sha256:invoke")).toThrow()
  })
})
