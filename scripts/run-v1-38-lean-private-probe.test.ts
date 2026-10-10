import { afterEach, describe, expect, it, vi } from "vitest"
import { chmodSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { labRoot } from "../packages/strategy-lab/src/contracts.js"
import { leanBytesRoot, leanCanonicalBytes } from "../packages/strategy-lab/src/league/lean-experiment.js"

const mocked = vi.hoisted(() => ({ source: undefined as any, invoke: undefined as any, carry: undefined as any, cleanup: true, calls: 0, issues: 0 }))
vi.mock("./lib/v1-38-lean-baseline-source.js", () => ({ readLeanBaselineSource: () => mocked.source }))
vi.mock("../packages/strategy-lab/src/factory/admission.js", () => ({ admitFactory: () => ({}), authorizeFactorySupervision: () => ({}) }))
vi.mock("./lib/v1-38-lean-experiment-authority.js", () => ({
  LEAN_PRIVATE_PROBE_COST_ROOT: "sha256:6e271d344297f332e858882c9071f0fc47629e72fda3c0371540e3d607306381",
  authenticateLeanPrivateProbeCostV1: () => ({}),
  authenticateLeanPrivateProbeV1CarryV2: () => mocked.carry,
  observeLeanPrivateProbeResourcesV1: () => ({}),
  observeLeanPrivateProbeCapacityV1: () => ({}),
  openLeanPrivateProbeAdmissionV1: () => ({}),
  recordAndIssueLeanPrivateProbeRuntimeAuthorityV1: (_admission: unknown, descriptor: any) => { mocked.issues += 1; return { binding: { executionOwnerId: `probe-owner-${descriptor.ordinal}` } } },
}))
vi.mock("./lib/v1-38-factory-supervised-runtime.js", () => ({ createFactorySupervisedRuntime: () => ({
  identity: { sourceRoot: mocked.source.sourceRoot, executableRoot: mocked.source.executableRoot },
  async invoke(request: any) { mocked.calls += 1; return mocked.invoke(request) },
  verify: () => true,
  close: () => ({ cleanupComplete: mocked.cleanup, orphanedChild: !mocked.cleanup }),
}) }))

import { createLeanPrivateProbeScheduleV1, createLeanPrivateProbeScheduleV2, executeLeanPrivateProbeEntryV1, parseLeanPrivateProbeArgsV1, verifyLeanPrivateProbeResultV1, verifyLeanPrivateProbeResultV2, verifyLeanPrivateProbeV2RetainedJoins } from "./run-v1-38-lean-private-probe.js"

const root = (name: string) => labRoot("test-root", name)
const schedule = () => createLeanPrivateProbeScheduleV1({ sourceHead: "bcb89241c836b1a04c99dd5b48799a69d58c060e", sourceRoot: root("source"), executableRoot: root("executable"), costSnapshotRoot: "sha256:6e271d344297f332e858882c9071f0fc47629e72fda3c0371540e3d607306381" })
const tempStores: string[] = []
afterEach(() => { for (const path of tempStores.splice(0)) rmSync(path, { recursive: true, force: true }); mocked.calls = 0; mocked.issues = 0; mocked.cleanup = true; mocked.invoke = undefined; mocked.source = undefined; mocked.carry = undefined })

describe("lean private probe schedule", () => {
  it("builds four identical legal public ABI observations without invoking a Match", () => {
    const value = schedule()
    expect(value.matchCount).toBe(0)
    expect(value.cases.map(item => item.method)).toEqual(["selectActivations", "selectActivations", "soldierBrain", "soldierBrain"])
    expect(value.cases[0]!.inputRoot).toBe(value.cases[1]!.inputRoot)
    expect(value.cases[2]!.inputRoot).toBe(value.cases[3]!.inputRoot)
    expect(value.ceilings).toEqual({ guestMs: 1000, hostMs: 5000, startupMs: 2500, matchMs: 600000 })
  })

  it("verifies only ordered retained joins and rejects an extra or altered outcome", () => {
    const allocation = schedule()
    const body = {
      schemaVersion: "lean-private-probe-result-v1" as const,
      allocationRoot: allocation.root,
      sourceHead: allocation.sourceHead,
      matchCount: 0 as const,
      attemptedOrdinals: [0],
      outcomes: [{ ordinal: 0, status: "success" as const, cleanupComplete: true, inputRoot: allocation.cases[0]!.inputRoot, requestRoot: allocation.cases[0]!.requestRoot }],
    }
    const result = { ...body, root: labRoot("lean-private-probe-result-v1", body) }
    expect(verifyLeanPrivateProbeResultV1(allocation, result)).toBe(true)
    expect(verifyLeanPrivateProbeResultV1(allocation, { ...result, outcomes: [...body.outcomes, body.outcomes[0]] })).toBe(false)
    expect(verifyLeanPrivateProbeResultV1(allocation, { ...result, matchCount: 1 })).toBe(false)
  })

  it("requires distinct immutable source-store input and exact allocation identity for each CLI mode", () => {
    const allocationPath = ".planning/artifacts/v1.38-phase-265-private-probe-allocation-v1.json"
    const parsed = parseLeanPrivateProbeArgsV1(["entry", "--source-store", "/private/source", "--source-root", root("source"), "--store", "/private/new-store", "--allocation-commit", "bcb89241c836b1a04c99dd5b48799a69d58c060e", "--allocation-path", allocationPath])
    expect(parsed).toMatchObject({ command: "entry", sourceStore: "/private/source", store: "/private/new-store", allocationPath })
    expect(() => parseLeanPrivateProbeArgsV1(["entry", "--source-store", "/private/source", "--source-root", root("source"), "--store", "/private/source", "--allocation-commit", "bcb89241c836b1a04c99dd5b48799a69d58c060e", "--allocation-path", allocationPath])).toThrow()
    expect(() => parseLeanPrivateProbeArgsV1(["verify", "--source-store", "/private/source", "--source-root", root("source"), "--store", "/private/new-store", "--allocation-commit", "bcb89241c836b1a04c99dd5b48799a69d58c060e", "--allocation-path", allocationPath])).toThrow()
    expect(parseLeanPrivateProbeArgsV1(["prepare", "--source-store", "/private/source", "--source-root", root("source"), "--store", "/private/new-store", "--source-head", "bcb89241c836b1a04c99dd5b48799a69d58c060e", "--cost-snapshot-root", "sha256:6e271d344297f332e858882c9071f0fc47629e72fda3c0371540e3d607306381", "--allocation-version", "2"])).toMatchObject({ command: "prepare", allocationVersion: 2 })
  })

  it("joins the one corrected v2 descriptor to immutable v1 cost, result, and debit roots", () => {
    const prior = createLeanPrivateProbeScheduleV1({ sourceHead: "8bed800f753235deaea1956d1166080973c9bba0", sourceRoot: root("prior-source"), executableRoot: root("prior-executable"), costSnapshotRoot: "sha256:6e271d344297f332e858882c9071f0fc47629e72fda3c0371540e3d607306381" })
    const priorCase = prior.cases[0]!
    const carryBody = {
      allocationRoot: "sha256:17ea1073af11097956b919cbe4e5fc06faef624d815a093413bb222505ea7dd7" as const,
      allocationDigest: "sha256:70cfd1476ab3ead999c126235b8b2e7518193e887d75477e1e4132f918f3b565" as const,
      allocationCommit: "dd67460e6628aebff6bc35c253adaa2cdfea284e",
      sourceHead: prior.sourceHead,
      resultRoot: "sha256:90b01860ac40b716854ebf082586793150abf59f8dc7fea161b44f9636353ab4" as const,
      resultDigest: "sha256:52755f198838ce8b1e99b8d9dbf5fdbb10c759b8051583f8d3d778238c6cc9ee" as const,
      debitDigest: "sha256:4b21d070d9f351eb6b8b531d7a0f1eb00197a296ff8632f59380d2c5e1d8c27a" as const,
      debitOffset: 0 as const,
      debitBytes: 436 as const,
      retainedAllocatedBytes: 32768 as const,
      ordinal: 0 as const,
      caseId: "case-0" as const,
      method: "selectActivations" as const,
      inputRoot: priorCase.inputRoot,
      requestRoot: priorCase.requestRoot,
    }
    mocked.carry = { ...carryBody, root: labRoot("lean-private-probe-v1-carry-v2", carryBody) }
    const allocation = createLeanPrivateProbeScheduleV2({ sourceHead: "bcb89241c836b1a04c99dd5b48799a69d58c060e", sourceRoot: root("source"), executableRoot: root("executable"), costSnapshotRoot: "sha256:6e271d344297f332e858882c9071f0fc47629e72fda3c0371540e3d607306381" })
    expect(allocation.cases).toHaveLength(1)
    expect(allocation.cases[0]).toMatchObject({ ordinal: 0, method: "selectActivations", caseId: "case-0", inputRoot: priorCase.inputRoot, requestRoot: priorCase.requestRoot })
    expect(allocation.priorV1Carry.retainedAllocatedBytes).toBe(32768)

    const resultBody = { schemaVersion: "lean-private-probe-result-v1" as const, allocationRoot: allocation.root, sourceHead: allocation.sourceHead, matchCount: 0 as const, attemptedOrdinals: [0], outcomes: [{ ordinal: 0, status: "system_failure" as const, cleanupComplete: false, inputRoot: allocation.cases[0]!.inputRoot, requestRoot: allocation.cases[0]!.requestRoot }] }
    const result = { ...resultBody, root: labRoot("lean-private-probe-result-v1", resultBody) }
    expect(verifyLeanPrivateProbeResultV2(allocation, result)).toBe(true)
    expect(verifyLeanPrivateProbeResultV2(allocation, { ...result, outcomes: [] })).toBe(false)
    const requestBody = { schemaVersion: "lean-private-probe-request-v2", sourceRoot: allocation.sourceRoot, executableRoot: allocation.executableRoot, tupleRoot: allocation.tupleRoot, runtimeLimitsRoot: allocation.runtimeLimitsRoot, caseRoots: allocation.cases.map(item => ({ ordinal: item.ordinal, method: item.method, inputRoot: item.inputRoot, requestRoot: item.requestRoot })) }
    const request = { ...requestBody, root: labRoot("lean-private-probe-request-v2", requestBody) }
    const debit = { schemaVersion: "lean-private-probe-debit-v1", allocationRoot: allocation.root, allocationDigest: leanBytesRoot(leanCanonicalBytes(allocation)), ordinal: 0, caseId: "case-0", requestRoot: allocation.cases[0]!.requestRoot, inputRoot: allocation.cases[0]!.inputRoot }
    expect(verifyLeanPrivateProbeV2RetainedJoins({ allocation, request, result, debitRows: [debit] })).toBe(true)
    expect(verifyLeanPrivateProbeV2RetainedJoins({ allocation, request, result, debitRows: [] })).toBe(false)
    expect(() => createLeanPrivateProbeScheduleV2({ sourceHead: prior.sourceHead, sourceRoot: root("source"), executableRoot: root("executable"), costSnapshotRoot: "sha256:6e271d344297f332e858882c9071f0fc47629e72fda3c0371540e3d607306381" })).toThrow()
  })

  it("rejects arbitrary cost, nested private case data, and continuation after cleanup failure", () => {
    const allocation = schedule()
    expect(() => createLeanPrivateProbeScheduleV1({ ...allocation, costSnapshotRoot: root("arbitrary-cost") })).toThrow()
    const outcomes = allocation.cases.slice(0, 2).map(item => ({ ordinal: item.ordinal, status: "success" as const, cleanupComplete: item.ordinal !== 0, inputRoot: item.inputRoot, requestRoot: item.requestRoot }))
    const body = { schemaVersion: "lean-private-probe-result-v1", allocationRoot: allocation.root, sourceHead: allocation.sourceHead, matchCount: 0, attemptedOrdinals: [0, 1], outcomes }
    expect(verifyLeanPrivateProbeResultV1(allocation, { ...body, root: labRoot("lean-private-probe-result-v1", body) })).toBe(false)
    const changed = { ...allocation, cases: allocation.cases.map(item => ({ ...item, strategyMemory: { private: "must reject" } })) }
    const { root: _root, ...changedBody } = changed
    const nested = { ...changedBody, root: labRoot("lean-private-probe-allocation-v1", changedBody) }
    expect(verifyLeanPrivateProbeResultV1(nested, { ...body, allocationRoot: nested.root })).toBe(false)
  })

  it("uses only inert factory seams, debits once per invocation, and stops after the first failure", async () => {
    const allocation = schedule(), store = realpathSync(mkdtempSync(join(tmpdir(), "private-probe-entry-test-"))); tempStores.push(store); chmodSync(store, 0o700)
    writeFileSync(join(store, "allocation.json"), leanCanonicalBytes(allocation), { mode: 0o600, flag: "wx" })
    mocked.source = { sourceRoot: allocation.sourceRoot, source: "fixture source never executed", packet: {}, proposal: {}, validation: {}, executableRoot: allocation.executableRoot }
    mocked.invoke = () => ({ identity: { sourceRoot: allocation.sourceRoot, executableRoot: allocation.executableRoot }, charged: true, method: "selectActivations", inputRoot: allocation.cases[mocked.calls - 1]!.inputRoot, result: { ok: false, violation: { type: "TIMEOUT" } } })
    const result = await executeLeanPrivateProbeEntryV1({ command: "entry", sourceStore: "/immutable/source-store", sourceRoot: allocation.sourceRoot, store, allocationCommit: "bcb89241c836b1a04c99dd5b48799a69d58c060e", allocationPath: ".planning/artifacts/v1.38-phase-265-private-probe-allocation-v1.json" })
    expect(result.attemptedOrdinals).toEqual([0])
    expect(result.outcomes[0]!.status).toBe("strategy_timeout")
    expect(mocked.issues).toBe(1)
    expect(mocked.calls).toBe(1)
  })

  it("terminalizes missing cleanup as a system failure without retaining runtime payloads", async () => {
    const allocation = schedule(), store = realpathSync(mkdtempSync(join(tmpdir(), "private-probe-cleanup-test-"))); tempStores.push(store); chmodSync(store, 0o700)
    writeFileSync(join(store, "allocation.json"), leanCanonicalBytes(allocation), { mode: 0o600, flag: "wx" })
    mocked.source = { sourceRoot: allocation.sourceRoot, source: "fixture source never executed", packet: {}, proposal: {}, validation: {}, executableRoot: allocation.executableRoot }
    mocked.cleanup = false
    mocked.invoke = () => ({ identity: { sourceRoot: allocation.sourceRoot, executableRoot: allocation.executableRoot }, charged: true, method: "selectActivations", inputRoot: allocation.cases[0]!.inputRoot, result: { ok: true, value: { privatePayload: "must not persist" } }, outputBytes: 3 })
    const result = await executeLeanPrivateProbeEntryV1({ command: "entry", sourceStore: "/immutable/source-store", sourceRoot: allocation.sourceRoot, store, allocationCommit: "bcb89241c836b1a04c99dd5b48799a69d58c060e", allocationPath: ".planning/artifacts/v1.38-phase-265-private-probe-allocation-v1.json" })
    expect(result.outcomes[0]).toMatchObject({ status: "system_failure", cleanupComplete: false })
    const record = JSON.parse(String((await import("node:fs")).readFileSync(join(store, "probe-00.json"), "utf8")))
    expect(JSON.stringify(record)).not.toContain("privatePayload")
  })

  it("makes exactly one default-provider call for each charged successful ordinal", async () => {
    const allocation = schedule(), store = realpathSync(mkdtempSync(join(tmpdir(), "private-probe-success-test-"))); tempStores.push(store); chmodSync(store, 0o700)
    writeFileSync(join(store, "allocation.json"), leanCanonicalBytes(allocation), { mode: 0o600, flag: "wx" })
    mocked.source = { sourceRoot: allocation.sourceRoot, source: "fixture source never executed", packet: {}, proposal: {}, validation: {}, executableRoot: allocation.executableRoot }
    mocked.invoke = (request: any) => {
      const descriptor = allocation.cases[mocked.calls - 1]!
      return { identity: { sourceRoot: allocation.sourceRoot, executableRoot: allocation.executableRoot }, charged: true, method: request.kind, inputRoot: descriptor.inputRoot, result: { ok: true, value: {} }, outputBytes: 2 }
    }
    const result = await executeLeanPrivateProbeEntryV1({ command: "entry", sourceStore: "/immutable/source-store", sourceRoot: allocation.sourceRoot, store, allocationCommit: "bcb89241c836b1a04c99dd5b48799a69d58c060e", allocationPath: ".planning/artifacts/v1.38-phase-265-private-probe-allocation-v1.json" })
    expect(result.attemptedOrdinals).toEqual([0, 1, 2, 3])
    expect(result.outcomes.every(item => item.status === "success" && item.cleanupComplete)).toBe(true)
    expect(mocked.issues).toBe(4)
    expect(mocked.calls).toBe(4)
  })
})
