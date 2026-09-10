import { describe, expect, it } from "vitest"
import { mkdtempSync, rmSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { buildLeanSchedule, hashLeanValue } from "./lib/v1-38-lean-runner-feasibility.js"
import { syntheticLeanTerminal, deriveLeanContainerName, deriveLeanContainerOwnershipLabel, runLeanFeasibilityInjected } from "./run-v1-38-lean-runner-feasibility.js"
import { CLOSEOUT_PROFILE, consumeCloseout, validateCloseoutPreflight, validateCloseoutTerminal, validateReview, cleanupCloseoutCell, superviseCloseoutCleanup, closeoutPaths, resolveCloseoutSelector, validateRetryPredecessorRoots, RETRY_PREDECESSOR_ROOTS } from "./run-v1-38-lean-closeout.js"

describe("approved private closeout", () => {
  it("exposes exactly one separate retry namespace and propagates a closed child selector", () => {
    expect(closeoutPaths(false).preflight).toBe(".planning/artifacts/v1.38-lean-closeout-preflight.json")
    expect(closeoutPaths(true).preflight).toBe(".planning/artifacts/v1.38-lean-closeout-retry-preflight.json")
    expect(resolveCloseoutSelector("--retry-closeout-child")).toEqual({ retry: true, selector: "--closeout-child" })
    for (const selector of ["--retry2-preflight", "--retry-retry-run", "--retry-recover", "--retry-../preflight"]) expect(() => resolveCloseoutSelector(selector)).toThrow()
    const dir = mkdtempSync(path.join(tmpdir(), "closeout-retry-test-"))
    try {
      const original = path.join(dir, "original.json"), retry = path.join(dir, "retry.json")
      consumeCloseout(original, { result: "non_pass" }); const bytes = readFileSync(original)
      consumeCloseout(retry, { result: "new" })
      expect(() => consumeCloseout(retry, { result: "again" })).toThrow()
      expect(readFileSync(original)).toEqual(bytes)
    } finally { rmSync(dir, { recursive: true }) }
  })
  it("binds exact consumed predecessor bytes rather than accepting a rewritten failure", () => {
    expect(validateRetryPredecessorRoots(RETRY_PREDECESSOR_ROOTS)).toEqual(RETRY_PREDECESSOR_ROOTS)
    expect(() => validateRetryPredecessorRoots({ ...RETRY_PREDECESSOR_ROOTS, preflight: "sha256:changed" })).toThrow()
    expect(() => validateRetryPredecessorRoots({ ...RETRY_PREDECESSOR_ROOTS, extra: "unreviewed" })).toThrow()
  })
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
    const valid = { schemaVersion: "v1.38-lean-closeout-preflight-v1", bindingRoot: "sha256:test", status: "pass", cleanupComplete: true, profile: CLOSEOUT_PROFILE, reason: "admitted", aggregates: { sampleCount: 12, successfulSamples: 12, lifecycleCount: 2, selectMaximumMilliseconds: 10, soldierMaximumMilliseconds: 10, lifecycleMaximumMilliseconds: 100, projectedCellMilliseconds: 10300, projectedRunMilliseconds: 247200 } }
    expect(validateCloseoutPreflight(valid, "sha256:test").status).toBe("pass")
    for (const altered of [
      { ...valid, profile: { ...CLOSEOUT_PROFILE, cpus: "4" } },
      { ...valid, status: "non_pass" },
      { ...valid, cleanupComplete: false },
      { ...valid, aggregates: { ...valid.aggregates, successfulSamples: 11 } },
      { ...valid, aggregates: { ...valid.aggregates, projectedCellMilliseconds: 1, projectedRunMilliseconds: 24 } },
    ]) expect(() => validateCloseoutPreflight(altered, "sha256:test")).toThrow()
  })
  it("requires complete independent seven-category review", () => {
    expect(() => validateReview({ categories: ["pass"] })).toThrow()
    expect(() => validateReview({ disposition: "pass", reviewer: "", blockers: 0 })).toThrow()
  })
  it("removes only owned containers and verifies actual absence after host termination", () => {
    const cell = buildLeanSchedule()[0]!
    const matchId = `match:lean:${hashLeanValue(cell.baseCellId).slice("sha256:".length)}`
    const name = deriveLeanContainerName(matchId)
    const calls: readonly string[][] = []
    let n = 0
    const clean = cleanupCloseoutCell(cell, (args) => {
      ;(calls as string[][]).push([...args]); n++
      return n === 1 ? { status: 0, stdout: deriveLeanContainerOwnershipLabel(matchId) + "\n", stderr: "" } : n === 2 ? { status: 0, stdout: name + "\n", stderr: "" } : { status: 1, stdout: "\n", stderr: `error: no such object: ${name}\n` }
    })
    expect(clean.cleanupComplete).toBe(true)
    expect(calls[1]).toEqual(["rm", "--force", name])
    let foreignCalls = 0
    expect(cleanupCloseoutCell(cell, () => { foreignCalls++; return { status: 0, stdout: "foreign\n", stderr: "" } }).cleanupComplete).toBe(false)
    expect(foreignCalls).toBe(1)
  })
  it("timeout or unexpected child exit cannot claim clean daemon cleanup; remaining cells unlaunched", async () => {
    for (const thrown of [false, true]) {
      let cleanupCalls = 0
      const proof = await runLeanFeasibilityInjected(superviseCloseoutCleanup({ now: () => 0, execute: async () => {
        if (thrown) throw Error("child exited")
        return { classification: "timeout", cleanupComplete: true, orphanedChild: false, boardRealism: true, integrityValid: true }
      }, terminateActive: async () => ({ cleanupComplete: true, orphanedChild: false }) }, () => { cleanupCalls++; return { cleanupComplete: false, orphanedChild: true } }))
      expect(proof.completeCleanup).toBe(false)
      expect(proof.result).toBe("invalid")
      expect(proof.counts.unlaunched).toBe(23)
      expect(cleanupCalls).toBeGreaterThan(0)
    }
  })
  it("latches interruption even when the child exits cleanly", async () => {
    const normal = await syntheticLeanTerminal()
    const interruption = new AbortController()
    let launches = 0
    const proof = await runLeanFeasibilityInjected(superviseCloseoutCleanup({ now: () => 0, execute: async () => {
      launches++; interruption.abort(); return normal.evidence[0]!
    }, terminateActive: async () => ({ cleanupComplete: true, orphanedChild: false }) }, () => ({ cleanupComplete: true, orphanedChild: false }), interruption.signal))
    expect(proof.result).not.toBe("pass")
    expect(proof.counts.cancelled).toBe(1)
    expect(proof.counts.unlaunched).toBe(23)
    expect(launches).toBe(1)
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
