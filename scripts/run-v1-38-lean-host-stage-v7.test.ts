import { describe, it, expect, vi } from "vitest"
import { runLeanBaselineMatch } from "./lib/v1-38-lean-baseline-match.js"
import { retainLeanMatch } from "../packages/strategy-lab/src/league/lean-experiment.js"
import * as lean from "../packages/strategy-lab/src/league/lean-experiment.js"
import { parseLeanCorrectionCommand } from "./run-v1-38-lean-correction.js"
import { captureLeanHostFailureV7, readLeanTrustedHostFailureStageV7 } from "./lib/v1-38-lean-host-stage-v7.js"
import { isLeanChildFailureReceipt, isLeanChildFailureReceiptV7, publishChildTerminalAfterOptionalReceipt, resolveLeanChildCliTerminal } from "./lib/v1-38-lean-child-cli-terminal.js"

vi.mock("node:child_process", async original => ({ ...await original<typeof import("node:child_process")>(), spawn() { throw new Error("SYNTHETIC_ONLY") }, spawnSync() { throw new Error("SYNTHETIC_ONLY") }, fork() { throw new Error("SYNTHETIC_ONLY") }, execFileSync() { throw new Error("SYNTHETIC_ONLY") } }))
vi.mock("node:worker_threads", async original => ({ ...await original<typeof import("node:worker_threads")>(), Worker: function() { throw new Error("SYNTHETIC_ONLY") } }))

const root = `sha256:${"a".repeat(64)}`
const binding = { route: "diagnostic" as const, allocationRoot: root, chargeRoot: root, slotRoot: root }
const stages = ["match_preparation", "match_composition_postprocessing", "compact_replay_retention_publication", "terminal_result_publication"] as const
describe("additive v7 identity", () => {
  it("has disjoint routes and the exact approved elapsed-only cap delta", () => {
    const v7 = (lean as any).LEAN_REPLAY_V7_ROUTES
    expect(v7).toBeDefined()
    for (const route of ["diagnostic", "baseline"] as const) {
      expect(lean.leanCorrectionRoutePaths(route, "v7" as never)).toBe(v7[route])
      expect(v7[route].store).not.toBe(lean.LEAN_REPLAY_V6_ROUTES[route].store)
      expect(parseLeanCorrectionCommand([`run-supervisor-${route}-v7`, "--request", v7[route].request])).toMatchObject({ supervisor: "v7", route })
      expect(() => parseLeanCorrectionCommand([`run-supervisor-${route}-v7`, "--request", lean.LEAN_REPLAY_V6_ROUTES[route].request])).toThrow()
    }
    expect((lean as any).LEAN_REPLAY_V7_CAPS).toEqual({ ...lean.LEAN_SUPERVISOR_V5_CAPS, elapsedMs: 57_600_000 })
  })
})
describe("v7 host-only stage custody", () => {
  it("captures actual source/scenario preparation before a provider can open", async () => {
    const input = { ledger: { allocation: { schemaVersion: "lean-correction-supervisor-diagnostic-allocation-v7", route: "diagnostic", root } }, charge: { root }, slot: { root }, bottom: {}, top: {} }
    const thrown = await runLeanBaselineMatch(input as never).catch(error => error)
    expect(readLeanTrustedHostFailureStageV7(thrown, binding)).toBe("match_preparation")
  })
  it("captures actual compact admission and never fabricates terminal publication", () => {
    const observed: string[] = []
    expect(() => retainLeanMatch({} as never, {} as never, {} as never, [], (stage, error) => { observed.push(stage); throw captureLeanHostFailureV7(stage, binding, error) })).toThrow()
    expect(observed).toEqual(["compact_replay_retention_publication"])
  })
  it("attempts terminal publication even when optional receipt publication fails", () => {
    const receipt = { type: "lean-child-failure" as const, schemaVersion: "lean-child-failure-v7" as const, ...binding, stage: stages[0], category: "host_boundary_observed" as const }
    expect(publishChildTerminalAfterOptionalReceipt(receipt, () => { throw new Error("write failed") }, uncertain => uncertain)).toBe(true)
    expect(() => publishChildTerminalAfterOptionalReceipt(receipt, () => {}, () => { throw new Error("mandatory terminal failed") })).toThrow("mandatory terminal failed")
  })
  it.each(stages)("classifies the trusted %s catch without reading the thrown object", async stage => {
    const hostile = new Proxy({}, { get() { throw new Error("private getter") } })
    expect(readLeanTrustedHostFailureStageV7(hostile)).toBe("unknown")
    const error = captureLeanHostFailureV7(stage, binding)
    const messages: unknown[] = []
    const child = { connected: true, exitCode: null as number | null, disconnect() { this.connected = false }, send(value: unknown, callback?: (error: Error | null) => void) { messages.push(value); callback?.(null); return true } }
    await resolveLeanChildCliTerminal(Promise.reject(error), child, binding)
    expect(child.exitCode).toBe(1)
    expect(messages).toHaveLength(1)
    expect(isLeanChildFailureReceiptV7(messages[0], binding)).toBe(true)
    expect(isLeanChildFailureReceipt(messages[0])).toBe(false)
    expect(messages[0]).toMatchObject({ stage, category: "host_boundary_observed", ...binding })
    expect(JSON.stringify(messages)).not.toMatch(/private getter|stack|message|source|memory|objective/)
  })
  it("refuses Strategy-controlled brands, cross-charge joins and arbitrary fields", async () => {
    const forged = { stage: stages[0], name: "LeanTrustedHostFailureV7", code: "LEAN_PILOT_FACTORY", stack: "secret" }
    expect(readLeanTrustedHostFailureStageV7(forged)).toBe("unknown")
    const messages: unknown[] = []
    await resolveLeanChildCliTerminal(Promise.reject(forged), { connected: true, disconnect() {}, send(v, cb) { messages.push(v); cb?.(null); return true } }, binding)
    expect(messages[0]).toMatchObject({ stage: "unknown", category: "stage_not_observed" })
    expect(isLeanChildFailureReceiptV7(messages[0], { ...binding, slotRoot: `sha256:${"b".repeat(64)}` })).toBe(false)
    expect(isLeanChildFailureReceiptV7({ ...(messages[0] as object), stack: "secret" }, binding)).toBe(false)
  })
})
