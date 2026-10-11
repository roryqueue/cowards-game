import { describe, it, expect, vi } from "vitest"
it.each(["available", "absent", "no-diagnostic", "extra-origin-key", "malformed-origin", "wrong-request", "wrong-input", "wrong-method", "wrong-ordinal", "wrong-seat", "wrong-source", "wrong-executable", "wrong-allocation", "wrong-debit", "wrong-harness", "wrong-diagnostic", "unverified", "throw", "throw-then-absent", "success-then-absent", "success-then-fresh", "duplicate-observation", "duplicate-failed-row", "foreign-identity", "uncharged", "consumer-throws", "v1"] as const)("private startup receipt uses current inert V3 invocation: %s", async mode => {
  const r = (n: number) => labRoot("inert-private-startup-receipt", n)
  const executableSource = "INERT_PRIVATE_SENTINEL_NEVER_EXECUTED", requestInput = { private: "INPUT_PRIVATE_SENTINEL" }
  const executableRoot = `sha256:${createHash("sha256").update(executableSource).digest("hex")}` as const
  const harnessRoot = lean.leanBytesRoot(Buffer.from(buildLeanStartupWorkerHarnessV8()))
  const arena = CANONICAL_ARENA_CATALOG_V1_37.arenas.find(a => a.id === "arena:smoke:v1")!
  const snapshots = [0, 1].map(n => ({ role: n === 0 ? "tactical-0" : "cold-opponent", sourceRoot: r(n + 1), root: r(n + 3), source: "SOURCE_PRIVATE_SENTINEL", packet: {}, proposal: {}, validation: {} }))
  const allocation = { root: r(5), seed: authorityModule.LEAN_PRIVATE_MATCH_SEED_V1, harnessRoot, arenaHash: arena.semanticGeometryHash, sources: snapshots.map(s => ({ snapshotRoot: s.root, sourceRoot: s.sourceRoot })) }
  const identities = snapshots.map(s => ({ revisionId: "inert-revision", sourceRoot: s.sourceRoot, executableRoot, budgetRoot: allocation.root, attemptRoot: r(6), harnessRoot, tupleId: MATCH_KERNEL.tupleId, tupleRoot: LAB_ADMITTED_ROOTS.tupleRoot, runtimeLimitsRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot, image: LAB_ADMITTED_ROOTS.image }))
  const evidence = { identity: mode === "foreign-identity" ? { ...identities[0]! } : identities[0]!, invocationRoot: r(7), requestId: `effect:v1.19:${"a".repeat(64)}`, method: "selectActivations", inputRoot: labRoot("runtime-input", requestInput), ordinal: ["success-then-absent", "success-then-fresh", "throw-then-absent"].includes(mode) ? 1 : 0, charged: mode !== "uncharged", completed: false, outputBytes: 0, result: { ok: false, systemFailure: { code: "SUBPROCESS_SIGNAL", retryable: false } } } as any
  let created = 0, callback: ((metadata: any) => void) | undefined, capturedOrigin: any
  const mocks = [
    vi.spyOn(authorityModule, "readLeanPrivateMatchContextV3").mockReturnValue({ allocation, slot: { bottomRole: "tactical-0", topRole: "cold-opponent" }, debitRoot: r(6) } as never),
    vi.spyOn(authorityModule, "readLeanPrivateMatchContextV1").mockReturnValue({ allocation, slot: { bottomRole: "tactical-0", topRole: "cold-opponent" }, debitRoot: r(6) } as never),
    vi.spyOn(authorityModule, "checkpointLeanPrivateMatchV3").mockImplementation(() => {}),
    vi.spyOn(authorityModule, "checkpointLeanPrivateMatchV1").mockImplementation(() => {}),
    vi.spyOn(authorityModule, "issueLeanPrivateMatchRuntimeAuthorityV3").mockReturnValue({} as never),
    vi.spyOn(authorityModule, "issueLeanPrivateMatchRuntimeAuthorityV1").mockReturnValue({} as never),
    vi.spyOn(sourceModule, "validateLeanBaselineSource").mockImplementation(v => v as never),
    vi.spyOn(admissionModule, "admitFactory").mockReturnValue({} as never),
    vi.spyOn(admissionModule, "authorizeFactorySupervision").mockReturnValue({} as never),
    vi.spyOn(revisionModule, "buildStrategyRevision").mockReturnValue({ id: "inert-revision", validation: { valid: true }, metadata: { sourceArtifact: { bytesBase64: Buffer.from(executableSource).toString("base64"), hash: executableRoot.slice(7) } } } as never),
    vi.spyOn(lifetimeModule, "prospectiveLeagueRuntimeBinding").mockReturnValue({} as never),
    vi.spyOn(runtimeModule, "createFactorySupervisedRuntime").mockImplementation(options => {
      const index = created++, identity = identities[index]!
      if (index === 0) callback = options.startupOriginObserver?.observe
      let calls = 0
      return { identity, async invoke() {
        calls++
        if (mode !== "absent" && !(["success-then-absent", "throw-then-absent"].includes(mode) && calls === 2)) {
          const transport = leanCorrectionInvocationTransportBinding({ methodName: "selectActivations", source: executableSource, input: requestInput, outputByteLimit: 262144, requestOrdinal: calls }, "v8")
          capturedOrigin = { schemaVersion: "v1.38-lean-startup-origin-v8", allocationRoot: allocation.root, chargeRoot: r(6), seat: "bottom", policyRoot: lean.LEAN_STARTUP_POLICY_V5.root, harnessRoot, requestOrdinal: calls, requestRoot: transport.requestRoot, method: "selectActivations", inputRoot: transport.inputRoot, sourceRoot: identity.sourceRoot, executableRoot, stage: "startup", branch: "lifecycle_failure", ready: false, go: false, wait: "changed", termination: "completed", unknown: true, constructorDurationBucket: "0_9ms", prefixMilestone: "not_entered", readyPublicationDurationBucket: "unknown", finalAtomicState: "state_0", lifecycleBeforeTermination: "exit_seen", deadlineOutcome: "unknown" }
          const fields = { "wrong-request": "requestRoot", "wrong-input": "inputRoot", "wrong-source": "sourceRoot", "wrong-executable": "executableRoot", "wrong-allocation": "allocationRoot", "wrong-debit": "chargeRoot", "wrong-harness": "harnessRoot" } as Record<string, string>
          if (fields[mode]) capturedOrigin[fields[mode]!] = r(99)
          if (mode === "wrong-seat") capturedOrigin.seat = "top"
          if (mode === "wrong-method") capturedOrigin.method = "soldierBrain"
          if (mode === "wrong-ordinal") capturedOrigin.requestOrdinal = calls + 1
          if (mode === "extra-origin-key") capturedOrigin.rawInput = "PRIVATE_SENTINEL"
          if (mode === "malformed-origin") capturedOrigin.requestOrdinal = Number.NaN
          callback?.(capturedOrigin)
          if (mode === "duplicate-observation") callback?.(capturedOrigin)
        }
        if (mode === "throw" || mode === "throw-then-absent" && calls === 1) throw Error("PRIVATE_THROW_SENTINEL")
        if (["success-then-absent", "success-then-fresh"].includes(mode) && calls === 1) return { ...evidence, ordinal: 0, result: { ok: true, value: {} } }
        return evidence
      }, verify(e: unknown) { return mode !== "unverified" && (e === evidence || ["success-then-absent", "success-then-fresh"].includes(mode)) }, close() { return { cleanupComplete: true, orphanedChild: false } } } as never
    }),
    vi.spyOn(runtimeModule, "getFactoryPrivateDiagnostic").mockImplementation((_p, e) => e === evidence && mode !== "no-diagnostic" ? { stage: "executor", reason: "unknown", identity: evidence.identity, invocationRoot: mode === "wrong-diagnostic" ? r(99) : evidence.invocationRoot, requestId: evidence.requestId, inputRoot: evidence.inputRoot, method: evidence.method, ordinal: evidence.ordinal } as never : undefined),
    vi.spyOn(bridgeModule, "runCanonicalLabMatch").mockImplementation(async options => {
      const provider = Object.values(options.providers)[0]!
      if (["success-then-absent", "success-then-fresh"].includes(mode)) await provider.invoke({ kind: "selectActivations", input: requestInput } as never, {} as never)
      if (mode === "throw-then-absent") { try { await provider.invoke({ kind: "selectActivations", input: requestInput } as never, {} as never) } catch { /* Inert retry proves finally clears the thrown request. */ } }
      await provider.invoke({ kind: "selectActivations", input: requestInput } as never, {} as never)
      return { kind: "failure", privacy: "private_offline", transitions: [], accounting: mode === "duplicate-failed-row" ? [evidence, evidence] : [evidence], unchangedState: null, failure: { classification: "system_failure", code: "LAB_SUPERVISOR_FAILURE" } } as never
    }),
  ]
  try {
    const call = () => (mode === "v1" ? runLeanPrivateFeasibilityMatch : composerModule.runLeanPrivateFeasibilityMatchV3)({ admission: {} as never, debit: {} as never, bottom: snapshots[0] as never, top: snapshots[1] as never, register() {}, unregister() {} })
    if (["unverified", "wrong-diagnostic", "duplicate-failed-row", "foreign-identity"].includes(mode)) { await expect(call()).rejects.toThrow(); return }
    const result = await call()
    if (mode === "consumer-throws") {
      expect(() => composerModule.consumeLeanPrivateStartupReceiptV3(result, () => { throw new Error("INERT_CONSUMER_FAILURE") })).toThrow("INERT_CONSUMER_FAILURE")
      expect(() => composerModule.consumeLeanPrivateStartupReceiptV3(result, () => undefined)).toThrow("LEAN_BASELINE_MATCH")
      return
    }
    const read = (result: object) => {
      try { return composerModule.consumeLeanPrivateStartupReceiptV3(result, (receipt, request) => { if (receipt.availability === "available") expect(request?.input).toEqual(requestInput); return receipt }) }
      catch { return undefined }
    }
    expect(read).toBeTypeOf("function")
    if (mode === "v1") { expect(callback).toBeUndefined(); expect(read(result)).toBeUndefined(); expect(composerModule.readLeanPrivateMatchDiagnosticV3(result)).toBeUndefined(); return }
    expect(callback).toBeTypeOf("function")
    expect(read({ ...result })).toBeUndefined(); expect(read({})).toBeUndefined()
    const receipt = read(result)
    expect(receipt?.availability).toBe(["available", "success-then-fresh"].includes(mode) ? "available" : "unavailable")
    if (["available", "success-then-fresh"].includes(mode)) {
      expect(receipt?.identity).toBe(evidence.identity)
      expect(receipt?.origin).toEqual(capturedOrigin)
      expect(receipt?.invocationBinding).toMatchObject({ requestOrdinal: evidence.ordinal + 1, ordinal: evidence.ordinal, requestId: evidence.requestId, inputRoot: evidence.inputRoot, invocationRoot: evidence.invocationRoot, seat: "bottom" })
    } else expect(receipt).toEqual({ availability: "unavailable", identity: null, origin: null, invocationBinding: null })
    expect(() => callback?.(capturedOrigin)).not.toThrow()
    expect(read(result)).toBeUndefined()
    expect(result).not.toHaveProperty("startupReceipt")
    expect(JSON.stringify(receipt)).not.toMatch(/PRIVATE_SENTINEL|PRIVATE_THROW/)
    if (mode !== "throw" && mode !== "uncharged" && mode !== "no-diagnostic") expect(composerModule.readLeanPrivateMatchDiagnosticV3(result)).toMatchObject({ availability: "available", originAvailability: "available", stage: "executor", reason: "unknown", code: "SUBPROCESS_SIGNAL" })
    if (mode === "no-diagnostic") expect(composerModule.readLeanPrivateMatchDiagnosticV3(result)).toMatchObject({ availability: "available", originAvailability: "unavailable", stage: "unknown", reason: "unknown", code: "SUBPROCESS_SIGNAL" })
  } finally { for (const mock of mocks) mock.mockRestore() }
})
import { CANONICAL_ARENA_CATALOG_V1_37 } from "@cowards/spec"
import { MATCH_KERNEL } from "../../packages/engine/src/index.js"
import { labRoot } from "../../packages/strategy-lab/src/contracts.js"
import { buildPlannerCandidate } from "../../packages/strategy-lab/src/planner/emit.js"
import { emitTacticalSource } from "../../packages/strategy-oracle-tactical/src/emit.js"
import { type LeanSlot } from "../../packages/strategy-lab/src/league/lean-experiment.js"
import { buildLeanBaselineSource } from "./v1-38-lean-baseline-source.js"
import { bindLeanCorrectionInvocation, leanBaselineMatchSeed, leanBaselineScenario, leanBaselineSemanticRoot, leanCorrectionInvocationTransportBinding, runLeanBaselineMatch } from "./v1-38-lean-baseline-match.js"
import type { LabMatchExecution } from "../../packages/strategy-lab/src/runtime-bridge.js"
import * as lean from "../../packages/strategy-lab/src/league/lean-experiment.js"
import * as sourceModule from "./v1-38-lean-baseline-source.js"
import * as admissionModule from "../../packages/strategy-lab/src/factory/admission.js"
import * as revisionModule from "../../packages/runtime-js/src/revision.js"
import * as runtimeModule from "./v1-38-factory-supervised-runtime.js"
import * as authorityModule from "./v1-38-lean-experiment-authority.js"
import * as lifetimeModule from "./v1-38-league-prospective-lifetime.js"
import { LAB_ADMITTED_ROOTS } from "../../packages/strategy-lab/src/contracts.js"
import { createHash } from "node:crypto"
import { encodeSubprocessIpcRequest } from "../../packages/runtime-js/src/subprocess-ipc.js"
import { buildLeanStartupWorkerHarnessV8 } from "./v1-38-lean-container-match-session.js"
import { runLeanPrivateFeasibilityMatch } from "./v1-38-lean-baseline-match.js"
import { runLeanPrivateFeasibilityMatchV2, readLeanPrivateMatchDiagnosticV2 } from "./v1-38-lean-baseline-match.js"
import * as composerModule from "./v1-38-lean-baseline-match.js"
import * as bridgeModule from "../../packages/strategy-lab/src/runtime-bridge.js"

it.each(["available", "absent", "no-diagnostic", "extra-origin-key", "malformed-origin", "wrong-request", "wrong-input", "wrong-method", "wrong-ordinal", "wrong-seat", "wrong-source", "wrong-executable", "wrong-allocation", "wrong-debit", "wrong-harness", "wrong-diagnostic", "unverified", "throw", "throw-then-absent", "success-then-absent", "success-then-fresh", "duplicate-observation", "duplicate-failed-row", "foreign-identity", "uncharged", "v1"] as const)("private startup receipt uses current inert V2 invocation: %s", async mode => {
  const r = (n: number) => labRoot("inert-private-startup-receipt", n)
  const executableSource = "INERT_PRIVATE_SENTINEL_NEVER_EXECUTED", requestInput = { private: "INPUT_PRIVATE_SENTINEL" }
  const executableRoot = `sha256:${createHash("sha256").update(executableSource).digest("hex")}` as const
  const harnessRoot = lean.leanBytesRoot(Buffer.from(buildLeanStartupWorkerHarnessV8()))
  const arena = CANONICAL_ARENA_CATALOG_V1_37.arenas.find(a => a.id === "arena:smoke:v1")!
  const snapshots = [0, 1].map(n => ({ role: n === 0 ? "tactical-0" : "cold-opponent", sourceRoot: r(n + 1), root: r(n + 3), source: "SOURCE_PRIVATE_SENTINEL", packet: {}, proposal: {}, validation: {} }))
  const allocation = { root: r(5), seed: authorityModule.LEAN_PRIVATE_MATCH_SEED_V1, harnessRoot, arenaHash: arena.semanticGeometryHash, sources: snapshots.map(s => ({ snapshotRoot: s.root, sourceRoot: s.sourceRoot })) }
  const identities = snapshots.map(s => ({ revisionId: "inert-revision", sourceRoot: s.sourceRoot, executableRoot, budgetRoot: allocation.root, attemptRoot: r(6), harnessRoot, tupleId: MATCH_KERNEL.tupleId, tupleRoot: LAB_ADMITTED_ROOTS.tupleRoot, runtimeLimitsRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot, image: LAB_ADMITTED_ROOTS.image }))
  const evidence = { identity: mode === "foreign-identity" ? { ...identities[0]! } : identities[0]!, invocationRoot: r(7), requestId: `effect:v1.19:${"a".repeat(64)}`, method: "selectActivations", inputRoot: labRoot("runtime-input", requestInput), ordinal: ["success-then-absent", "success-then-fresh", "throw-then-absent"].includes(mode) ? 1 : 0, charged: mode !== "uncharged", completed: false, outputBytes: 0, result: { ok: false, systemFailure: { code: "SUBPROCESS_SIGNAL", retryable: false } } } as any
  let created = 0, callback: ((metadata: any) => void) | undefined, capturedOrigin: any
  const mocks = [
    vi.spyOn(authorityModule, "readLeanPrivateMatchContextV2").mockReturnValue({ allocation, slot: { bottomRole: "tactical-0", topRole: "cold-opponent" }, debitRoot: r(6) } as never),
    vi.spyOn(authorityModule, "readLeanPrivateMatchContextV1").mockReturnValue({ allocation, slot: { bottomRole: "tactical-0", topRole: "cold-opponent" }, debitRoot: r(6) } as never),
    vi.spyOn(authorityModule, "checkpointLeanPrivateMatchV2").mockImplementation(() => {}),
    vi.spyOn(authorityModule, "checkpointLeanPrivateMatchV1").mockImplementation(() => {}),
    vi.spyOn(authorityModule, "issueLeanPrivateMatchRuntimeAuthorityV2").mockReturnValue({} as never),
    vi.spyOn(authorityModule, "issueLeanPrivateMatchRuntimeAuthorityV1").mockReturnValue({} as never),
    vi.spyOn(sourceModule, "validateLeanBaselineSource").mockImplementation(v => v as never),
    vi.spyOn(admissionModule, "admitFactory").mockReturnValue({} as never),
    vi.spyOn(admissionModule, "authorizeFactorySupervision").mockReturnValue({} as never),
    vi.spyOn(revisionModule, "buildStrategyRevision").mockReturnValue({ id: "inert-revision", validation: { valid: true }, metadata: { sourceArtifact: { bytesBase64: Buffer.from(executableSource).toString("base64"), hash: executableRoot.slice(7) } } } as never),
    vi.spyOn(lifetimeModule, "prospectiveLeagueRuntimeBinding").mockReturnValue({} as never),
    vi.spyOn(runtimeModule, "createFactorySupervisedRuntime").mockImplementation(options => {
      const index = created++, identity = identities[index]!
      if (index === 0) callback = options.startupOriginObserver?.observe
      let calls = 0
      return { identity, async invoke() {
        calls++
        if (mode !== "absent" && !(["success-then-absent", "throw-then-absent"].includes(mode) && calls === 2)) {
          const transport = leanCorrectionInvocationTransportBinding({ methodName: "selectActivations", source: executableSource, input: requestInput, outputByteLimit: 262144, requestOrdinal: calls }, "v8")
          capturedOrigin = { schemaVersion: "v1.38-lean-startup-origin-v8", allocationRoot: allocation.root, chargeRoot: r(6), seat: "bottom", policyRoot: lean.LEAN_STARTUP_POLICY_V5.root, harnessRoot, requestOrdinal: calls, requestRoot: transport.requestRoot, method: "selectActivations", inputRoot: transport.inputRoot, sourceRoot: identity.sourceRoot, executableRoot, stage: "startup", branch: "lifecycle_failure", ready: false, go: false, wait: "changed", termination: "completed", unknown: true, constructorDurationBucket: "0_9ms", prefixMilestone: "not_entered", readyPublicationDurationBucket: "unknown", finalAtomicState: "state_0", lifecycleBeforeTermination: "exit_seen", deadlineOutcome: "unknown" }
          const fields = { "wrong-request": "requestRoot", "wrong-input": "inputRoot", "wrong-source": "sourceRoot", "wrong-executable": "executableRoot", "wrong-allocation": "allocationRoot", "wrong-debit": "chargeRoot", "wrong-harness": "harnessRoot" } as Record<string, string>
          if (fields[mode]) capturedOrigin[fields[mode]!] = r(99)
          if (mode === "wrong-seat") capturedOrigin.seat = "top"
          if (mode === "wrong-method") capturedOrigin.method = "soldierBrain"
          if (mode === "wrong-ordinal") capturedOrigin.requestOrdinal = calls + 1
          if (mode === "extra-origin-key") capturedOrigin.rawInput = "PRIVATE_SENTINEL"
          if (mode === "malformed-origin") capturedOrigin.requestOrdinal = Number.NaN
          callback?.(capturedOrigin)
          if (mode === "duplicate-observation") callback?.(capturedOrigin)
        }
        if (mode === "throw" || mode === "throw-then-absent" && calls === 1) throw Error("PRIVATE_THROW_SENTINEL")
        if (["success-then-absent", "success-then-fresh"].includes(mode) && calls === 1) return { ...evidence, ordinal: 0, result: { ok: true, value: {} } }
        return evidence
      }, verify(e: unknown) { return mode !== "unverified" && (e === evidence || ["success-then-absent", "success-then-fresh"].includes(mode)) }, close() { return { cleanupComplete: true, orphanedChild: false } } } as never
    }),
    vi.spyOn(runtimeModule, "getFactoryPrivateDiagnostic").mockImplementation((_p, e) => e === evidence && mode !== "no-diagnostic" ? { stage: "executor", reason: "unknown", identity: evidence.identity, invocationRoot: mode === "wrong-diagnostic" ? r(99) : evidence.invocationRoot, requestId: evidence.requestId, inputRoot: evidence.inputRoot, method: evidence.method, ordinal: evidence.ordinal } as never : undefined),
    vi.spyOn(bridgeModule, "runCanonicalLabMatch").mockImplementation(async options => {
      const provider = Object.values(options.providers)[0]!
      if (["success-then-absent", "success-then-fresh"].includes(mode)) await provider.invoke({ kind: "selectActivations", input: requestInput } as never, {} as never)
      if (mode === "throw-then-absent") { try { await provider.invoke({ kind: "selectActivations", input: requestInput } as never, {} as never) } catch { /* Inert retry proves finally clears the thrown request. */ } }
      await provider.invoke({ kind: "selectActivations", input: requestInput } as never, {} as never)
      return { kind: "failure", privacy: "private_offline", transitions: [], accounting: mode === "duplicate-failed-row" ? [evidence, evidence] : [evidence], unchangedState: null, failure: { classification: "system_failure", code: "LAB_SUPERVISOR_FAILURE" } } as never
    }),
  ]
  try {
    const call = () => (mode === "v1" ? runLeanPrivateFeasibilityMatch : runLeanPrivateFeasibilityMatchV2)({ admission: {} as never, debit: {} as never, bottom: snapshots[0] as never, top: snapshots[1] as never, register() {}, unregister() {} })
    if (["unverified", "wrong-diagnostic", "duplicate-failed-row", "foreign-identity"].includes(mode)) { await expect(call()).rejects.toThrow(); return }
    const result = await call()
    const read = composerModule.readLeanPrivateStartupReceiptV1
    expect(read).toBeTypeOf("function")
    if (mode === "v1") { expect(callback).toBeUndefined(); expect(read(result)).toBeUndefined(); expect(readLeanPrivateMatchDiagnosticV2(result)).toBeUndefined(); return }
    expect(callback).toBeTypeOf("function")
    expect(read({ ...result })).toBeUndefined(); expect(read({})).toBeUndefined()
    const receipt = read(result)
    expect(receipt?.availability).toBe(["available", "success-then-fresh"].includes(mode) ? "available" : "unavailable")
    if (["available", "success-then-fresh"].includes(mode)) {
      expect(receipt?.identity).toBe(evidence.identity)
      expect(receipt?.origin).toEqual(capturedOrigin)
      expect(receipt?.invocationBinding).toMatchObject({ requestOrdinal: evidence.ordinal + 1, ordinal: evidence.ordinal, requestId: evidence.requestId, inputRoot: evidence.inputRoot, invocationRoot: evidence.invocationRoot, seat: "bottom" })
    } else expect(receipt).toEqual({ availability: "unavailable", identity: null, origin: null, invocationBinding: null })
    expect(() => callback?.(capturedOrigin)).not.toThrow()
    expect(read(result)).toEqual(receipt)
    expect(result).not.toHaveProperty("startupReceipt")
    expect(JSON.stringify(receipt)).not.toMatch(/PRIVATE_SENTINEL|PRIVATE_THROW/)
    if (mode !== "throw" && mode !== "uncharged" && mode !== "no-diagnostic") expect(readLeanPrivateMatchDiagnosticV2(result)).toMatchObject({ availability: "available", originAvailability: "available", stage: "executor", reason: "unknown", code: "SUBPROCESS_SIGNAL" })
    if (mode === "no-diagnostic") expect(readLeanPrivateMatchDiagnosticV2(result)).toMatchObject({ availability: "available", originAvailability: "unavailable", stage: "unknown", reason: "unknown", code: "SUBPROCESS_SIGNAL" })
  } finally { for (const mock of mocks) mock.mockRestore() }
})

it("v2 composer refuses forged/cross-version handles before source/provider work and caller diagnostics are unissued", async () => {
  const validate = vi.spyOn(sourceModule, "validateLeanBaselineSource"), create = vi.spyOn(runtimeModule, "createFactorySupervisedRuntime")
  try {
    await expect(runLeanPrivateFeasibilityMatchV2({ admission: { schemaVersion: "lean-private-match-admission-v2" }, debit: { schemaVersion: "lean-private-match-debit-handle-v1" }, bottom: {}, top: {}, register() {}, unregister() {} } as never)).rejects.toThrow("LEAN_PRIVATE_MATCH_AUTHORITY")
    expect(validate).not.toHaveBeenCalled(); expect(create).not.toHaveBeenCalled()
    expect(readLeanPrivateMatchDiagnosticV2({ diagnostic: { code: "SUBPROCESS_SIGNAL" } })).toBeUndefined()
  } finally { validate.mockRestore(); create.mockRestore() }
})

it("private two-Match composer rejects structural admission/debit before source validation or provider creation", async () => {
  const validate = vi.spyOn(sourceModule, "validateLeanBaselineSource"), create = vi.spyOn(runtimeModule, "createFactorySupervisedRuntime")
  try {
    await expect(runLeanPrivateFeasibilityMatch({ admission: { schemaVersion: "lean-private-match-admission-v1" }, debit: { schemaVersion: "lean-private-match-debit-handle-v1" }, bottom: {}, top: {}, register() {}, unregister() {} } as never)).rejects.toThrow("LEAN_PRIVATE_MATCH_AUTHORITY")
    expect(validate).not.toHaveBeenCalled(); expect(create).not.toHaveBeenCalled()
  } finally { validate.mockRestore(); create.mockRestore() }
})

it("[startup-origin-v8] uses the exact V8 request prefix and refuses cross-invocation/source/seat joins", () => {
  const root = (n: number) => labRoot("NON_AUTHORIZING-v8-join", n)
  const request = { methodName: "selectActivations" as const, source: "INERT_NOT_EXECUTED", input: {}, requestOrdinal: 1 }
  const transport = leanCorrectionInvocationTransportBinding(request, "v8" as any)
  const payload = encodeSubprocessIpcRequest({ source: request.source, methodName: request.methodName, input: request.input, outputByteLimit: undefined })
  expect(transport.requestRoot).toBe(`sha256:${createHash("sha256").update("v1.38-lean-startup-v8:1:").update(payload).digest("hex")}`)
  expect(transport.requestRoot).not.toBe(leanCorrectionInvocationTransportBinding(request, "v7").requestRoot)
  const evidence = { identity: { sourceRoot: root(1), executableRoot: transport.executableRoot, budgetRoot: root(2), attemptRoot: root(3), harnessRoot: lean.leanBytesRoot(Buffer.from(buildLeanStartupWorkerHarnessV8())) }, requestId: "inert", method: request.methodName, inputRoot: transport.inputRoot, ordinal: 0, invocationRoot: root(4), result: { ok: false, systemFailure: { code: "SUBPROCESS_SIGNAL", retryable: false } } } as any
  const diagnostic = { stage: "executor", reason: "unknown", ...evidence } as any
  const origin = { schemaVersion: "v1.38-lean-startup-origin-v8", allocationRoot: root(2), chargeRoot: root(3), seat: "bottom", policyRoot: lean.LEAN_STARTUP_POLICY_V5.root, harnessRoot: evidence.identity.harnessRoot, requestOrdinal: 1, requestRoot: transport.requestRoot, method: request.methodName, inputRoot: transport.inputRoot, sourceRoot: root(1), executableRoot: transport.executableRoot, stage: "startup", branch: "lifecycle_failure", ready: false, go: false, wait: "changed", termination: "completed", unknown: true, constructorDurationBucket: "0_9ms", prefixMilestone: "not_entered", readyPublicationDurationBucket: "unknown", finalAtomicState: "state_0", lifecycleBeforeTermination: "exit_seen", deadlineOutcome: "unknown" } as any
  expect(bindLeanCorrectionInvocation(origin, transport, evidence, diagnostic, "bottom").schemaVersion).toBe("v1.38-lean-correction-invocation-binding-v8")
  for (const field of ["sourceRoot", "allocationRoot", "chargeRoot", "harnessRoot", "inputRoot", "executableRoot"]) expect(() => bindLeanCorrectionInvocation({ ...origin, [field]: root(9) }, transport, evidence, diagnostic, "bottom")).toThrow()
  expect(() => bindLeanCorrectionInvocation(origin, transport, evidence, diagnostic, "top")).toThrow()
})

const observedBridgeOptions = vi.hoisted(() => vi.fn())
vi.mock("../../packages/strategy-lab/src/runtime-bridge.js", async importOriginal => {
  const actual = await importOriginal<typeof import("../../packages/strategy-lab/src/runtime-bridge.js")>()
  // Fault at construction input before any machine/state or Match can exist;
  // use the actual bridge catch and actual host-issued reader, not a fake brand.
  return { ...actual, runCanonicalLabMatch: (options: Parameters<typeof actual.runCanonicalLabMatch>[0]) => { observedBridgeOptions(options); return actual.runCanonicalLabMatch({ ...options, match: new Proxy(options.match, { get() { throw null }, ownKeys() { throw null } }) }) } }
})

it.each(["v15-3", "v15-4"] as const)("policy cache host attribution actual wrapper opts in only admitted %s", async mode => {
  const r = (n: number) => labRoot("non-authorizing-host-wrapper", n), b = lean.leanResourceWindowPolicyForModeV15(mode)
  const p = { schemaVersion: "lean-correction-predecessor-v1" as const, chargedMatches: b.charged, elapsedUpperBoundMs: 228267940, allocatedDiskBytes: 27303936, historicalPeakDiskBytes: "unknown" as const, historicalPeakRssBytes: "unknown" as const, historyRoot: r(1), survivors: Array.from({ length: 970 }, (_, n) => ({ identity: `.strategy-lab/inert-wrapper-${n}`, allocatedBytes: 0 })) }
  const allocation = lean.admitLeanAllocation(lean.createLeanSupervisorCorrectionAllocation({ sourceRoot: r(2), reviewRoot: r(3), coldRoot: r(4), planRoot: b.planRoot, candidateRoots: [r(5), r(6)], requestRoots: [r(7)], seed: "non-authorizing-wrapper", route: "diagnostic", reuseGrantRoot: r(8), supervisorDecisionRoot: b.approvalRoot, acceptedCheckRoot: null, requestBytesRoot: r(9), dataReviewRoot: r(10), setupAccountingRoot: r(11), predecessor: { ...p, root: labRoot(p.schemaVersion, p) }, startupPolicyRoot: lean.LEAN_STARTUP_POLICY_V5.root, timeboxExtension: b, attemptOrdinal: Number(mode.slice(-1)) as 3 | 4, priorClosureRoot: r(12), continuationRoot: r(13), acceptedReaderCloseRoot: null }, 8))
  const bottom = { sourceRoot: r(5), role: "initial-tactical", source: "inert-no-source-execution", packet: {}, proposal: {}, validation: {} } as any
  const top = { ...bottom, sourceRoot: r(6), role: "initial-teacher" }
  const mocks = [
    vi.spyOn(sourceModule, "validateLeanBaselineSource").mockImplementation(v => v as any),
    vi.spyOn(admissionModule, "admitFactory").mockReturnValue({} as any),
    vi.spyOn(admissionModule, "authorizeFactorySupervision").mockReturnValue({} as any),
    vi.spyOn(revisionModule, "buildStrategyRevision").mockReturnValue({ id: "inert-revision", validation: { valid: true }, metadata: { sourceArtifact: { bytesBase64: "", hash: "a".repeat(64) } } } as any),
    vi.spyOn(lifetimeModule, "prospectiveLeagueRuntimeBinding").mockReturnValue({} as any),
    vi.spyOn(authorityModule, "issueLeanCorrectionRuntimeAuthority").mockReturnValue({} as any),
    vi.spyOn(runtimeModule, "createFactorySupervisedRuntime").mockReturnValue({ identity: { revisionId: "inert-revision", tupleId: MATCH_KERNEL.tupleId, tupleRoot: LAB_ADMITTED_ROOTS.tupleRoot, runtimeLimitsRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot, image: LAB_ADMITTED_ROOTS.image }, close: () => ({ cleanupComplete: true, orphanedChild: false }), invoke: () => { throw Error("inert-no-invoke") }, verify: () => false } as any),
  ]
  try {
    observedBridgeOptions.mockClear()
    const charge = { root: r(20) } as any, slot = allocation.slots[0]!
    const result = await runLeanBaselineMatch({ ledger: { allocation } as any, charge, slot, seed: "non-authorizing-wrapper", bottom, top, correction: { reuse: {} as any }, checkpoint: vi.fn(), register: vi.fn(), unregister: vi.fn() })
    expect(result.compact.classification).toBe("system_failure")
    const bridgeOptions = observedBridgeOptions.mock.calls[0]?.[0] as Parameters<typeof import("../../packages/strategy-lab/src/runtime-bridge.js").runCanonicalLabMatch>[0]
    if (mode === "v15-4") {
      expect(result).toHaveProperty("hostFailureV15", expect.objectContaining({ phase: "machine_construction", code: "HOST_THROW", allocationRoot: allocation.root, chargeRoot: charge.root, slotRoot: slot.root }))
      expect(typeof bridgeOptions.hostClockV15).toBe("function")
      expect(Number.isFinite(bridgeOptions.hostClockV15?.())).toBe(true)
    } else {
      expect(result).not.toHaveProperty("hostFailureV15")
      expect(bridgeOptions).not.toHaveProperty("hostBindingV15")
      expect(bridgeOptions).not.toHaveProperty("hostClockV15")
    }
  } finally { for (const mock of mocks) mock.mockRestore() }
})

describe("current canonical baseline scenario, without provider execution", () => {
  it("preserves arena, source side, initiative and seed in the four exact repeats", () => {
    const input = { coldRoot: labRoot("cold-source-fixture", 1), implementationRoot: labRoot("source-fixture", 1) }
    const bottom = buildLeanBaselineSource({ ...input, role: "initial-tactical", source: emitTacticalSource() })
    const top = buildLeanBaselineSource({ ...input, role: "initial-teacher", source: buildPlannerCandidate().source })
    const arenas = CANONICAL_ARENA_CATALOG_V1_37.arenas.filter(a => a.status === "active").sort((a, b) => a.semanticGeometryHash.localeCompare(b.semanticGeometryHash))
    for (let condition = 0; condition < 4; condition++) {
      const slot: LeanSlot = { ordinal: 8 + condition, condition: condition as 0 | 1 | 2 | 3, arenaHash: arenas[condition < 2 ? 0 : 1]!.semanticGeometryHash, requestRoot: labRoot("source-fixture-request", condition), root: labRoot("source-fixture-slot", condition) }
      const first = leanBaselineScenario({ seed: "source-fixture", slot, bottom, top })
      const repeated = leanBaselineScenario({ seed: "source-fixture", slot: { ...slot, ordinal: 32 + condition }, bottom, top })
      expect(first).toEqual(repeated)
      expect(first.bottomPlayerId).toContain(bottom.sourceRoot.slice(7))
      expect(first.initialInitiativePlayerId).toBe(condition % 2 === 0 ? first.bottomPlayerId : first.topPlayerId)
      const machine = MATCH_KERNEL.createMachineV119({ matchId: "source-only-realism", seed: first.seed, arenaVariant: first.arena, bottomPlayerId: first.bottomPlayerId, topPlayerId: first.topPlayerId, bottomStrategyRevisionId: "source-bottom", topStrategyRevisionId: "source-top", initialInitiativePlayerId: first.initialInitiativePlayerId })
      expect(machine.state.soldiers).toHaveLength(16)
      expect(machine.state.soldiers.every(s => s.position.x >= 0 && s.position.x < 12 && s.position.y >= 0 && s.position.y < 12)).toBe(true)
      expect(new Set(machine.state.soldiers.map(s => s.position.y))).toEqual(new Set([0, 11]))
    }
    expect(leanBaselineMatchSeed("source-fixture", 32)).toBe(leanBaselineMatchSeed("source-fixture", 8))
  })
  it("normalizes actual identity-dependent engine hashes but preserves private memory keys", () => {
    const arena = CANONICAL_ARENA_CATALOG_V1_37.arenas.find(a => a.status === "active")!
    const prefix = (matchId: string): LabMatchExecution => {
      const machine = MATCH_KERNEL.createMachineV119({ matchId, seed: "source-only-seed", arenaVariant: arena, bottomPlayerId: "source-bottom", topPlayerId: "source-top", bottomStrategyRevisionId: "source-bottom-revision", topStrategyRevisionId: "source-top-revision", initialInitiativePlayerId: "source-bottom" })
      const step = MATCH_KERNEL.stepMatch(machine, { kind: "advance" })
      if (step.kind !== "transition") throw new Error("SOURCE_ONLY_PREFIX")
      // A prefix fixture for hashing, not a completed empirical Match.
      return { kind: "completed", privacy: "private_offline", result: { state: step.machine.state, events: [...step.record.events] }, transitions: [step.record], accounting: [] }
    }
    const one = prefix("source-only-first"), two = prefix("source-only-repeat")
    expect(one.transitions[0]?.beforeMachineHash).not.toBe(two.transitions[0]?.beforeMachineHash)
    expect(leanBaselineSemanticRoot(one)).toBe(leanBaselineSemanticRoot(two))
    const changed = structuredClone(two)
    if (changed.kind !== "completed") throw new Error("SOURCE_ONLY_PREFIX")
    changed.result.state.players[0]!.strategyMemory = { matchId: "private-user-key-preserved" }
    expect(leanBaselineSemanticRoot(changed)).not.toBe(leanBaselineSemanticRoot(one))
  })
})

describe("finite correction diagnostic invocation binding", () => {
  it("joins origin to the actual failed invocation and rejects a re-rooted different invocation", () => {
    const root = (letter: string) => `sha256:${letter.repeat(64)}` as const
    const source = "export function selectActivations(){ return [] }"
    const input = { observation: { tick: 7 } }
    const transport = leanCorrectionInvocationTransportBinding({ methodName: "selectActivations", source, input, requestOrdinal: 3 })
    const evidence = {
      identity: { sourceRoot: root("a"), executableRoot: transport.executableRoot },
      requestId: "request-3", method: "selectActivations", inputRoot: transport.inputRoot,
      ordinal: 2, invocationRoot: root("b"), result: { ok: false, systemFailure: { code: "SUBPROCESS_SIGNAL", retryable: false } },
    } as any
    const privateDiagnostic = { stage: "stream_exchange", reason: "wait_timeout", ...evidence } as any
    const origin = {
      schemaVersion: "v1.38-lean-correction-origin-v1", requestOrdinal: 3, requestRoot: transport.requestRoot,
      transportMethod: "docker_exec_stream", brokerMode: "legacy", brokerBranch: "legacy_deadline",
      signalBufferState: "not_done", waitDisposition: "timed_out", workerLifecycle: "unknown",
      transportSignal: "broker_synthetic_sigkill", terminationDisposition: "worker_terminate_completed", elapsedBucket: "unknown",
    } as const
    expect(bindLeanCorrectionInvocation(origin, transport, evidence, privateDiagnostic, "bottom")).toMatchObject({
      requestOrdinal: 3, ordinal: 2, method: "selectActivations", requestRoot: transport.requestRoot,
      payloadRoot: transport.payloadRoot, inputRoot: transport.inputRoot, seat: "bottom", invocationRoot: evidence.invocationRoot,
    })
    expect(() => bindLeanCorrectionInvocation({ ...origin, requestRoot: root("c") }, transport, evidence, privateDiagnostic, "bottom")).toThrow("LEAN_CORRECTION_INVOCATION_JOIN")
    expect(() => bindLeanCorrectionInvocation(origin, { ...transport, method: "soldierBrain" }, evidence, privateDiagnostic, "bottom")).toThrow("LEAN_CORRECTION_INVOCATION_JOIN")
  })
})
