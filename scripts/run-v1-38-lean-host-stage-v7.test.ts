import { describe, it, expect } from "vitest"
import { captureLeanHostFailureV7, readLeanTrustedHostFailureStageV7 } from "./lib/v1-38-lean-host-stage-v7.js"
import { isLeanChildFailureReceipt, isLeanChildFailureReceiptV7, resolveLeanChildCliTerminal } from "./lib/v1-38-lean-child-cli-terminal.js"

const root = `sha256:${"a".repeat(64)}`
const binding = { route: "diagnostic" as const, allocationRoot: root, chargeRoot: root, slotRoot: root }
const stages = ["match_preparation", "match_composition_postprocessing", "compact_replay_retention_publication", "terminal_result_publication"] as const
describe("v7 host-only stage custody", () => {
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
