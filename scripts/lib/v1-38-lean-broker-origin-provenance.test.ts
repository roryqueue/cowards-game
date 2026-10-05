import { Buffer } from "node:buffer"
import { describe, expect, it } from "vitest"
import { SubprocessSystemFailure } from "../../packages/runtime-js/src/subprocess-ipc.js"
import { createLeanContainerMatchSession, isLeanPrivateFailureOrigin, LEAN_CONTAINER_BROKER_SOURCE, type LeanContainerMatchTransport, type LeanCorrectionOriginMetadata } from "./v1-38-lean-container-match-session.js"

// Only trusted in-process synthetic control/stream fixtures. No native broker,
// Worker, provider, Strategy evaluation, Match or saved-evidence reader runs.
type RequestFrame = { requestId: number; correctionOrigin?: { requestOrdinal: number; requestRoot: string }; payloadBase64: string; timeoutMilliseconds: number }
const receipt = (frame: RequestFrame): LeanCorrectionOriginMetadata => ({
  schemaVersion: "v1.38-lean-correction-origin-v1", ...frame.correctionOrigin!,
  transportMethod: "docker_exec_stream", brokerMode: "legacy", brokerBranch: "legacy_deadline",
  signalBufferState: "not_done", waitDisposition: "timed_out", workerLifecycle: "unknown",
  transportSignal: "broker_synthetic_sigkill", terminationDisposition: "worker_terminate_completed", elapsedBucket: "unknown",
})
const fixture = (optIn: boolean, mutate: (value: Record<string, unknown>, frame: RequestFrame, prior?: RequestFrame) => void = () => {}, prefixSuccess = false) => {
  const frames: RequestFrame[] = [], observed: LeanCorrectionOriginMetadata[] = []
  let exists = false, closes = 0, selectedSource = ""
  const clean = (stdout = "") => ({ status: 0, signal: null, stdout: Buffer.from(stdout), stderr: Buffer.alloc(0) })
  const transport: LeanContainerMatchTransport = (_command, args) => {
    if (args[0] === "inspect") return exists ? clean("synthetic-owner\n") : { ...clean(), status: 1, stderr: Buffer.from("Error: No such object: synthetic-broker-origin\n") }
    if (args[0] === "create") exists = true
    if (args[0] === "rm") exists = false
    return clean("synthetic-id\n")
  }
  const session = createLeanContainerMatchSession({
    matchId: "synthetic-broker-origin", containerName: "synthetic-broker-origin", ownershipLabel: "synthetic-owner", image: "synthetic-image", infrastructureProfile: "closeout", transport,
    ...(optIn ? { correctionOriginObserver: { observe: (value: LeanCorrectionOriginMetadata) => observed.push(value) } } : {}),
    streamFactory: (_command, args) => {
      selectedSource = args.at(-1)!
      return { exchange(raw, config) {
        const frame = JSON.parse(raw) as RequestFrame, prior = frames.at(-1); frames.push(frame)
        expect(frame.timeoutMilliseconds).toBe(1000); expect(config.timeoutMilliseconds).toBe(1000)
        if (prefixSuccess && frames.length === 1) return Buffer.from(JSON.stringify({ requestId: frame.requestId, status: 0, signal: null, stdoutBase64: Buffer.from(JSON.stringify({ ok: true, value: [] })).toString("base64"), stderrBase64: "" }) + "\n")
        const response: Record<string, unknown> = { requestId: frame.requestId, status: null, signal: "SIGKILL", stdoutBase64: "", stderrBase64: "", ...(optIn ? { correctionOrigin: receipt(frame) } : {}) }
        mutate(response, frame, prior)
        return Buffer.from(JSON.stringify(response) + "\n")
      }, close() { closes++; return clean() } }
    },
  })
  const invoke = (methodName: "selectActivations" | "soldierBrain" = "selectActivations") => session.adapter.execute({ source: "inert synthetic bytes", methodName, input: {}, timeoutMs: 1000 })
  const capture = (methodName?: "selectActivations" | "soldierBrain") => { try { invoke(methodName) } catch (error) { return error }; throw Error("expected synthetic rejection") }
  return { session, frames, observed, invoke, capture, get closes() { return closes }, get selectedSource() { return selectedSource } }
}

describe("strict opt-in synthetic broker signal provenance", () => {
  it.each(["timed_out", "changed_without_completion"] as const)("registers only correlated %s signal on the exact error", waitDisposition => {
    const f = fixture(true, value => { value.correctionOrigin = { ...(value.correctionOrigin as object), waitDisposition } }, true)
    expect(f.invoke()).toEqual({ ok: true, value: [] })
    const error = f.capture("soldierBrain")
    expect(error).toBeInstanceOf(SubprocessSystemFailure); expect(error).toMatchObject({ code: "SUBPROCESS_SIGNAL" })
    const origin = { stage: "executor", reason: waitDisposition === "timed_out" ? "broker_timed_out" : "broker_changed_without_completion" }
    expect(f.session.failureOrigin(error)).toEqual(origin); expect(isLeanPrivateFailureOrigin(origin)).toBe(true)
    expect(Object.isFrozen(f.session.failureOrigin(error))).toBe(true)
    expect(f.session.failureOrigin({ ...(error as object) })).toBeUndefined()
    expect(f.observed).toHaveLength(1); expect(f.observed[0]!.requestOrdinal).toBe(2)
    expect(f.frames[1]!.correctionOrigin!.requestRoot).not.toBe(f.frames[0]!.correctionOrigin!.requestRoot)
    expect(JSON.parse(Buffer.from(f.frames[1]!.payloadBase64, "base64").toString()).methodName).toBe("soldierBrain")
    expect(f.session.close()).toEqual({ cleanupComplete: true, orphanedChild: false }); expect(f.closes).toBe(1)
  })
  it.each(["ordinal", "root", "extra", "missing", "outer-request"])("refuses hostile %s receipt without detailed provenance", fault => {
    const f = fixture(true, (value, frame, prior) => {
      const r = value.correctionOrigin as Record<string, unknown>
      if (fault === "ordinal") r.requestOrdinal = frame.requestId + 1
      if (fault === "root") r.requestRoot = prior!.correctionOrigin!.requestRoot
      if (fault === "extra") r.privatePayload = "PRIVATE_CANARY"
      if (fault === "missing") delete value.correctionOrigin
      if (fault === "outer-request") value.requestId = frame.requestId + 1
    }, true)
    f.invoke(); const error = f.capture("soldierBrain")
    expect(f.observed).toEqual([]); expect(f.session.failureOrigin(error)?.reason ?? "unknown").not.toMatch(/^broker_/)
    expect(f.session.state).toBe("poisoned"); expect(f.session.close().cleanupComplete).toBe(true)
  })
  it.each(["unavailable", "observed-signal", "not-signal", "stderr", "status"])("does not invent synthetic origin for %s", fault => {
    const f = fixture(true, value => {
      const r = value.correctionOrigin as Record<string, unknown>
      if (fault === "unavailable") r.waitDisposition = "unavailable"
      if (fault === "observed-signal") { r.transportSignal = "observed_sigterm"; value.signal = "SIGTERM" }
      if (fault === "not-signal") { value.signal = null; value.status = 70 }
      if (fault === "stderr") value.stderrBase64 = Buffer.from("synthetic stderr").toString("base64")
      if (fault === "status") value.status = 70
    })
    const error = f.capture(); expect(f.session.failureOrigin(error)).toBeUndefined(); expect(f.session.close().cleanupComplete).toBe(true)
    if (fault === "unavailable" || fault === "observed-signal" || fault === "status") expect(error).toMatchObject({ code: "SUBPROCESS_SIGNAL" })
  })
  it("preserves observer-absent source bytes, response acceptance and unknown signal origin", () => {
    const f = fixture(false), error = f.capture()
    expect(f.selectedSource).toBe(LEAN_CONTAINER_BROKER_SOURCE); expect(f.selectedSource).not.toContain("correctionOrigin")
    expect(f.frames[0]).not.toHaveProperty("correctionOrigin"); expect(f.observed).toEqual([])
    expect(error).toMatchObject({ code: "SUBPROCESS_SIGNAL" }); expect(f.session.failureOrigin(error)).toBeUndefined(); f.session.close()
  })
})
