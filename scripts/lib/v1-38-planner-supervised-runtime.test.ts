import { describe, expect, it } from "vitest"
import { createHash } from "node:crypto"
import { defaultRuntimeMetadata } from "@cowards/spec"
import { MATCH_KERNEL } from "../../packages/engine/src/index.js"
import { buildStrategyRevision } from "../../packages/runtime-js/src/revision.js"
import { buildFeasibilityCorpus } from "../../packages/strategy-lab/src/feasibility-protocol.js"
import { labRoot, LAB_ADMITTED_ROOTS } from "../../packages/strategy-lab/src/contracts.js"
import { WORKER_HARNESS_SOURCE } from "../../packages/runtime-js/src/worker-harness.js"
import { createPlannerSupervisedRuntime, closePlannerRuntime } from "./v1-38-planner-supervised-runtime.js"
import type { LeanContainerMatchTransport, LeanContainerPersistentStreamFactory } from "./v1-38-lean-container-match-session.js"
import { buildLeanAuthenticatedHarnessSource } from "./v1-38-lean-container-match-session.js"

const source = "export default { selectActivations(input) { return { activationOrders: [], strategyMemory: input.strategyMemory }; }, soldierBrain(input) { return { action: { type: 'TURN_TO_STONE' }, soldierMemory: input.soldierMemory }; } };"
const runtime = { ...defaultRuntimeMetadata("typescript"), adapter: { ...defaultRuntimeMetadata("typescript").adapter, id: "runtime-js-container-subprocess" } }
const revision = () => buildStrategyRevision({ source, runtime })
const corpus = buildFeasibilityCorpus()
const root = labRoot("synthetic-host-test", 1)
const fixture = (fault?: string) => {
  let exists = false
  const frames: Record<string, any>[] = []
  const calls: readonly string[][] = []
  const transport: LeanContainerMatchTransport = (_command, args) => {
    ;(calls as string[][]).push([...args])
    let status = 0; let stdout = ""; let stderr = ""
    if (args[0] === "inspect") { if (exists) stdout = "owner:phase263-test\n"; else { status = 1; stderr = "Error: No such object: phase263-test\n" } }
    if (args[0] === "create") { exists = true; stdout = "container-id\n" }
    if (args[0] === "rm") exists = false
    return { status, signal: null, stdout: Buffer.from(stdout), stderr: Buffer.from(stderr) }
  }
  const streamFactory: LeanContainerPersistentStreamFactory = () => ({ exchange(frame) {
    const q = JSON.parse(frame); frames.push(q)
    if (fault === "timeout") throw Error("synthetic timeout")
    const r = JSON.parse(Buffer.from(q.payloadBase64, "base64").toString())
    const result = fault === "violation" ? { ok: false, violation: { type: "FORBIDDEN_CAPABILITY", message: "synthetic blocked" } }
      : { ok: true, value: r.methodName === "selectActivations" ? { activationOrders: [], strategyMemory: r.input.strategyMemory } : { action: { type: "TURN_TO_STONE" }, soldierMemory: r.input.soldierMemory } }
    const timing = q.timingBinding && fault !== "missing-timing" ? { binding: { ...q.timingBinding, ...(fault === "forged-timing" ? { inputRoot: "wrong" } : {}) }, durationMs: 2, complete: true } : undefined
    return Buffer.from(JSON.stringify({ requestId: fault === "request" ? 999 : q.requestId, status: 0, signal: null, stdoutBase64: Buffer.from(JSON.stringify(result)).toString("base64"), stderrBase64: "", ...(timing ? { timing } : {}) }) + "\n")
  }, close() { return { status: fault === "cleanup" ? 1 : 0, signal: null, stdout: Buffer.alloc(0), stderr: Buffer.alloc(0) } } })
  return { transport, streamFactory, frames, calls }
}
const options = (fault?: string) => ({ revision: revision(), attemptRoot: root, budgetRoot: root, matchId: "phase263:match", containerName: "phase263-test", ownershipLabel: "owner:phase263-test", image: LAB_ADMITTED_ROOTS.image, ...fixture(fault) })
const request = (method: "selectActivations" | "soldierBrain", id = "kernel:1") => ({ kind: method, requestId: id, semanticTupleId: MATCH_KERNEL.tupleId, coordinates: { phaseNumber: 1, roundNumber: 1, stage: "select_bottom", ordinal: 0 }, input: corpus[method][0]!.input }) as Parameters<ReturnType<typeof createPlannerSupervisedRuntime>["invoke"]>[0]

describe("planner selected-v1.19 host with injected transport only", () => {
  it("preserves both method outputs and memory through actual selected executor", () => {
    const opts = options(); const host = createPlannerSupervisedRuntime(opts)
    for (const method of ["selectActivations", "soldierBrain"] as const) {
      const e = host.invoke(request(method, `kernel:${method}`), host.identity)
      expect(e.result.ok).toBe(true); expect(e.completed).toBe(true); expect(host.verify(e)).toBe(true)
      expect(host.verify(structuredClone(e))).toBe(false)
    }
    expect(opts.frames).toHaveLength(2)
    expect(opts.frames[0]).toMatchObject({ mode: "legacy", timeoutMilliseconds: 1000, stdoutByteLimit: 262144, stderrByteLimit: 65536 })
    expect(opts.calls.find((a) => a[0] === "create")).toEqual(expect.arrayContaining(["--cpus", "2", "--memory", "256m", "--network", "none"]))
    expect(closePlannerRuntime(host).cleanupComplete).toBe(true)
  })
  it.each(["image", "abi", "source", "limits"])("rejects wrong %s before container creation", (fault) => {
    const opts = options(); const changed = structuredClone(opts.revision)
    if (fault === "abi") changed.runtime.abiVersion = "strategy-runtime-abi-v1.18"
    if (fault === "source") changed.sourceHash = "0".repeat(64)
    if (fault === "limits") changed.runtime.limits.timeoutMs = 50
    expect(() => createPlannerSupervisedRuntime({ ...opts, revision: changed, ...(fault === "image" ? { image: "other" } : {}) })).toThrow()
    expect(opts.calls).toHaveLength(0)
  })
  it.each(["timeout", "request"])("charges %s and poisons subsequent dispatch", (fault) => {
    const opts = options(fault); const host = createPlannerSupervisedRuntime(opts)
    const e = host.invoke(request("selectActivations"), host.identity)
    expect(e).toMatchObject({ charged: true, result: { ok: false, systemFailure: { retryable: false } } })
    expect(() => host.invoke(request("selectActivations", "next"), host.identity)).toThrow()
    expect(opts.frames).toHaveLength(1)
  })
  it("preserves runtime violations, rejects replay and bad input, and records cleanup failure", () => {
    const host = createPlannerSupervisedRuntime(options("violation"))
    const e = host.invoke(request("selectActivations"), host.identity)
    expect(e.result).toMatchObject({ ok: false, violation: { type: "FORBIDDEN_CAPABILITY" } })
    expect(() => host.invoke(request("selectActivations"), host.identity)).toThrow()
    closePlannerRuntime(host)
    const bad = createPlannerSupervisedRuntime(options("cleanup"))
    expect(() => bad.invoke({ ...request("selectActivations"), input: {} } as any, bad.identity)).toThrow()
    expect(closePlannerRuntime(bad).cleanupComplete).toBe(false)
  })
  it.each([undefined, "missing-timing", "forged-timing"])("binds private timing and fails closed on %s", (fault) => {
    const opts = options(fault)
    const host = createPlannerSupervisedRuntime({ ...opts, observerHarness: { source: WORKER_HARNESS_SOURCE, machineRoot: root, expectedRoot: `sha256:${createHash("sha256").update(buildLeanAuthenticatedHarnessSource(WORKER_HARNESS_SOURCE)).digest("hex")}` } })
    const e = host.invoke(request("selectActivations"), host.identity)
    if (fault) { expect(e.result).toMatchObject({ ok: false, systemFailure: {} }); expect(host.timing(e)).toBeUndefined() }
    else {
      const timing = host.timing(e)!
      expect(timing).toMatchObject({ provenance: "synthetic_transport", observation: { durationMs: 2, binding: { invocationRoot: e.invocationRoot } } })
      expect(host.verifyTiming(timing)).toBe(true)
      expect(host.verifyTiming(structuredClone(timing))).toBe(false)
      expect(e.result).not.toHaveProperty("timing")
    }
    closePlannerRuntime(host)
  })
})
