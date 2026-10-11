import { describe, expect, it, vi } from "vitest"

describe("own V3 genuine authority", () => {
  it.each([{ version: 3, cleanupComplete: true }, { version: 3, cleanupComplete: false }])("uses genuine capacity→entry→durable debit→ordered V8 seats; %s", async ({ version, cleanupComplete }) => {
    const directory = realpathSync(mkdtempSync(join(tmpdir(), "inert-two-match-authority-"))), clock = vi.spyOn(Date, "now").mockReturnValue(Number(version) === 1 ? 1791669996000 : 1791747362000)
    const sourceDirectory = join(directory, "sources"), store = join(directory, "store"), artifact = join(directory, "allocation.json"), prefix = join(directory, "inert.ts")
    try {
      mkdirSync(sourceDirectory, { mode: 0o700 }); mkdirSync(store, { mode: 0o700 }); writeFileSync(prefix, matchFixture.sourceBytes)
      const snapshots = (["tactical-0", "cold-opponent"] as const).map((role, n) => buildLeanBaselineSource({ role, source: emitTacticalSource() + `\n// inert seat ${n}\n`, coldRoot: labRoot("inert-cold", 1), implementationRoot: labRoot("inert-implementation", 1) }))
      for (const snapshot of snapshots) writeFileSync(join(sourceDirectory, `source-${snapshot.role}.json`), leanCanonicalBytes(snapshot), { mode: 0o600 })
      matchFixture.mappings.set(resolve(authority.LEAN_PRIVATE_MATCH_SOURCE_STORE_V1), sourceDirectory)
      matchFixture.mappings.set(resolve("scripts/inert.ts"), prefix)
      matchFixture.mappings.set(resolve(Number(version) === 1 ? authority.LEAN_PRIVATE_MATCH_ARTIFACT_V1 : authority.LEAN_PRIVATE_MATCH_ARTIFACT_V3), artifact)
      matchFixture.active = true
      const metadata = snapshots.map(snapshot => {
        const m = authority.inspectLeanPrivateMatchSourceV1(authority.LEAN_PRIVATE_MATCH_SOURCE_STORE_V1, snapshot.role as "tactical-0" | "cold-opponent"), defaults = defaultRuntimeMetadata("typescript"), revision = buildStrategyRevision({ source: snapshot.source, runtime: { ...defaults, adapter: { ...defaults.adapter, id: "runtime-js-container-subprocess" } } })
        return { ...m, executableRoot: `sha256:${revision.metadata.sourceArtifact!.hash}` as const }
      }) as unknown as import("./v1-38-lean-experiment-authority.js").LeanPrivateMatchAllocationV1["sources"]
      const allocation = Number(version) === 1 ? createLeanPrivateMatchAllocationV1({ sourceHead: matchFixture.sourceHead, sources: metadata, sourcePrefix: authority.inspectLeanPrivateMatchPrefixV1(matchFixture.sourceHead), priorProbeCarry: authority.authenticateLeanPrivateMatchProbeCarryV1() }) : authority.createLeanPrivateMatchAllocationV3({ sourceHead: matchFixture.sourceHead, sources: metadata, sourcePrefix: authority.inspectLeanPrivateMatchPrefixV3(matchFixture.sourceHead), priorProbeCarry: authority.authenticateLeanPrivateMatchProbeCarryV1(), priorMatchCarry: authority.authenticateLeanPrivateMatchCarryV3() })
      matchFixture.allocation = Buffer.from(leanCanonicalBytes(allocation)); writeFileSync(artifact, matchFixture.allocation)
      writeFileSync(join(store, "allocation.json"), matchFixture.allocation, { mode: 0o600 })
      const virtualStore = resolve(Number(version) === 1 ? ".strategy-lab/lean-private-matches-v1" : ".strategy-lab/lean-private-matches-v3", allocation.root.slice(7)); matchFixture.mappings.set(virtualStore, store)
      const capacity = Number(version) === 1 ? authority.observeLeanPrivateMatchCapacityV1(virtualStore, allocation, 2) : authority.observeLeanPrivateMatchCapacityV3(virtualStore, allocation, 1)
      expect(() => JSON.stringify(capacity)).toThrow()
      const open = () => Number(version) === 1 ? authority.openLeanPrivateMatchAdmissionV1({ storePath: virtualStore, allocationCommit: matchFixture.commit, allocationPath: authority.LEAN_PRIVATE_MATCH_ARTIFACT_V1, capacity: capacity as never }) : authority.openLeanPrivateMatchAdmissionV3({ storePath: virtualStore, allocationCommit: matchFixture.commit, allocationPath: authority.LEAN_PRIVATE_MATCH_ARTIFACT_V3, capacity: capacity as never })
      const admission = open()
      expect(open).toThrow()
      const debit = Number(version) === 1 ? authority.recordLeanPrivateMatchDebitV1(admission as never, 0, authority.observeLeanPrivateMatchCapacityV1(virtualStore, allocation, 2)) : authority.recordLeanPrivateMatchDebitV3(admission as never, 0, authority.observeLeanPrivateMatchCapacityV3(virtualStore, allocation, 1))
      const context = Number(version) === 1 ? authority.readLeanPrivateMatchContextV1(admission as never, debit as never) : authority.readLeanPrivateMatchContextV3(admission as never, debit as never)
      const validate = vi.spyOn(sourceModule, "validateLeanBaselineSource"), create = vi.spyOn(runtimeModule, "createFactorySupervisedRuntime")
      try {
        const opposite = Number(version) === 1 ? runLeanPrivateFeasibilityMatchV2 : runLeanPrivateFeasibilityMatch
        await expect(opposite({ admission, debit, bottom: snapshots[0], top: snapshots[1], register() {}, unregister() {} } as never)).rejects.toThrow("LEAN_PRIVATE_MATCH_AUTHORITY")
        expect(validate).not.toHaveBeenCalled(); expect(create).not.toHaveBeenCalled()
      } finally { validate.mockRestore(); create.mockRestore() }
      if (version === 3) { expect(() => authority.readLeanPrivateMatchContextV1(admission as never, debit as never)).toThrow(); expect(() => authority.readLeanPrivateMatchContextV3({ ...admission } as never, debit as never)).toThrow() }
      expect(JSON.parse(readFileSync(join(store, "debit-0.json"), "utf8")).cumulativeCharged).toBe(Number(version) === 1 ? 41 : 43)
      expect(readFileSync(join(store, "ledger.ndjson"), "utf8").trim().split("\n")).toHaveLength(1)
      for (const [n, seat] of (["bottom", "top"] as const).entries()) {
        const snapshot = snapshots[n]!, defaults = defaultRuntimeMetadata("typescript"), revision = buildStrategyRevision({ source: snapshot.source, runtime: { ...defaults, adapter: { ...defaults.adapter, id: "runtime-js-container-subprocess" } } }), approved = authorizeFactorySupervision({ sourceAdmission: admitFactory({ packet: snapshot.packet, proposal: snapshot.proposal, sourceBytes: Buffer.from(snapshot.source) }), validation: snapshot.validation })
        const runtime = prospectiveLeagueRuntimeBinding(approved, { revisionId: revision.id, sourceRoot: snapshot.sourceRoot, executableRoot: `sha256:${revision.metadata.sourceArtifact!.hash}`, tupleId: MATCH_KERNEL.tupleId, tupleRoot: LAB_ADMITTED_ROOTS.tupleRoot, runtimeLimitsRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot, image: LAB_ADMITTED_ROOTS.image }), binding = { seat, runtime, budgetRoot: allocation.root, attemptRoot: context.debitRoot, matchId: `lean-${context.debitRoot.slice(7, 31)}`, containerName: `lean-${context.debitRoot.slice(7, 25)}-${seat}`, ownershipLabel: `lean-${allocation.root.slice(7, 25)}` }
        const issue = () => Number(version) === 1 ? authority.issueLeanPrivateMatchRuntimeAuthorityV1(admission as never, debit as never, snapshot, binding) : authority.issueLeanPrivateMatchRuntimeAuthorityV3(admission as never, debit as never, snapshot, binding)
        const issued = issue()
        expect(() => authority.claimLeanStartupAuthorityV8(issued, binding, "session")).toThrow()
        for (const layer of ["factory", "planner", "session"] as const) expect(authority.claimLeanStartupAuthorityV8(issued, binding, layer).startup.version).toBe(8)
        expect(() => authority.claimLeanStartupAuthorityV8(issued, binding, "session")).toThrow()
        expect(issue).toThrow()
      }
      const body = { schemaVersion: `lean-private-match-terminal-v${version}`, allocationRoot: allocation.root, debitRoot: context.debitRoot, slotRoot: allocation.slots[0].root, evidence: { classification: "success", cleanupComplete, boardEvidenceAvailable: true, fullChronicleVerified: false, lastFrameRoot: labRoot("inert-frame", 1), outcome: "DRAW" } }
      writeFileSync(join(store, "terminal-0.json"), leanCanonicalBytes({ ...body, root: labRoot(body.schemaVersion, body) }), { mode: 0o600 })
      expect(Number(version) === 1 ? authority.closeLeanPrivateMatchDebitV1(admission as never, debit as never) : authority.closeLeanPrivateMatchDebitV3(admission as never, debit as never)).toBe(cleanupComplete)
      if (version === 3) { expect(() => authority.recordLeanPrivateMatchDebitV3(admission as never, 0, capacity as never)).toThrow(); expect(() => authority.readLeanPrivateMatchContextV3(admission as never, debit as never)).toThrow(); return }
      if (admission.schemaVersion !== "lean-private-match-admission-v1") throw new Error("FIXTURE_VERSION")
      const nextCapacity = authority.observeLeanPrivateMatchCapacityV1(virtualStore, allocation, 1)
      if (cleanupComplete) { const next = authority.recordLeanPrivateMatchDebitV1(admission as never, 1, nextCapacity); expect(authority.readLeanPrivateMatchContextV1(admission as never, next).slot.condition).toBe(2) }
      else expect(() => authority.recordLeanPrivateMatchDebitV1(admission, 1, nextCapacity)).toThrow()
    } finally { matchFixture.active = false; matchFixture.mappings.clear(); clock.mockRestore(); rmSync(directory, { recursive: true, force: true }) }
  }, 20000)
})

it("V3 owns the prospective window and rejects forged/opposite-version capabilities", () => {
  expect(authority.LEAN_PRIVATE_MATCH_WINDOW_V3).toMatchObject({ anchorMs: 1791747362000, deadlineMs: 1791752762000, carryMs: 399420903, capMs: 404820903, reserveMs: 1860000 })
  expect(authority.LEAN_PRIVATE_MATCH_CARRY_V3).toMatchObject({ historicalCharged: 42, retainedAllocatedBytes: 376832, historicalSourceAllocatedBytes: 1830912 })
  expect(() => authority.readLeanPrivateMatchContextV3({} as never, {} as never)).toThrow("LEAN_PRIVATE_MATCH_AUTHORITY")
  expect(() => authority.validateLeanPrivateMatchAllocationV3({ schemaVersion: "lean-private-match-allocation-v2" })).toThrow("LEAN_PRIVATE_MATCH_AUTHORITY")
})

it("one-Match v2 has a disjoint approved window and refuses forged route handles", () => {
  expect(authority.LEAN_PRIVATE_MATCH_WINDOW_V2).toMatchObject({ anchorMs: 1791738781000, deadlineMs: 1791742381000, carryMs: 390839903, capMs: 394439903, reserveMs: 1860000 })
  expect(() => authority.readLeanPrivateMatchContextV2({} as never, {} as never)).toThrow("LEAN_PRIVATE_MATCH_AUTHORITY")
  expect(() => authority.validateLeanPrivateMatchAllocationV2({ schemaVersion: "lean-private-match-allocation-v1" })).toThrow("LEAN_PRIVATE_MATCH_AUTHORITY")
})
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from "node:fs"
import * as childProcess from "node:child_process"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { labRoot } from "../../packages/strategy-lab/src/contracts.js"
import { leanCanonicalBytes } from "../../packages/strategy-lab/src/league/lean-experiment.js"
import { createLeanPrivateProbeScheduleV1, createLeanPrivateProbeScheduleV2, verifyLeanPrivateProbeV2RetainedJoins, verifyLeanPrivateProbeResourcesV2 } from "../run-v1-38-lean-private-probe.js"
const gitFixture = vi.hoisted(() => ({ repository: "" }))
const matchFixture = vi.hoisted(() => ({ mappings: new Map<string, string>(), active: false, sourceHead: "a".repeat(40), commit: "b".repeat(40), allocation: Buffer.alloc(0), sourceBytes: Buffer.from("INERT_SOURCE_PREFIX") }))
vi.mock("node:fs", async importOriginal => {
  const actual = await importOriginal<typeof import("node:fs")>()
  const map = (path: unknown): unknown => { if (typeof path !== "string") return path; for (const [from, to] of matchFixture.mappings) if (path === from || path.startsWith(from + "/")) return to + path.slice(from.length); return path }
  const overrides: Record<string, unknown> = {}
  for (const name of ["openSync", "lstatSync", "readdirSync", "statfsSync"] as const) overrides[name] = (...args: any[]) => (actual[name] as (...a: any[]) => any)(map(args[0]), ...args.slice(1))
  overrides.realpathSync = (path: string) => map(path) === path ? actual.realpathSync(path) : path
  return { ...actual, ...overrides }
})
vi.mock("node:child_process", async importOriginal => {
  const actual = await importOriginal<typeof import("node:child_process")>()
  return { ...actual, execFileSync: ((command: string, args: string[], options: object) => {
    if (matchFixture.active && command === "git") {
      if (args.join(" ") === "rev-parse HEAD") return Buffer.from(matchFixture.commit + "\n")
      if (args[0] === "rev-list" && args.at(-1) === matchFixture.commit) return Buffer.from(`${matchFixture.commit} ${matchFixture.sourceHead}\n`)
      if (args[0] === "show" && [1, 2, 3].some(v => args[1] === `${matchFixture.commit}:.planning/artifacts/v1.38-phase-265-private-match-allocation-v${v}.json`)) return matchFixture.allocation
      if (args[0] === "diff" && args[3] === matchFixture.sourceHead) return Buffer.from("scripts/inert.ts\n")
      if (args[0] === "show" && args[1] === `${matchFixture.sourceHead}:scripts/inert.ts`) return matchFixture.sourceBytes
    }
    const historicalCarryRead = args.some(arg => arg.includes("dd67460e6628aebff6bc35c253adaa2cdfea284e") || arg.includes("8bed800f753235deaea1956d1166080973c9bba0") || arg.includes("c98a6d3f0e78201ad57324ad4d4814710429b452"))
    return actual.execFileSync(command, command === "git" && gitFixture.repository && !historicalCarryRead ? ["-C", gitFixture.repository, ...args] : args, options)
  }) as typeof actual.execFileSync }
})
import * as authority from "./v1-38-lean-experiment-authority.js"
import { createLeanPrivateMatchAllocationV1 } from "../run-v1-38-lean-private-matches.js"
import { buildLeanBaselineSource } from "./v1-38-lean-baseline-source.js"
import { emitTacticalSource } from "../../packages/strategy-oracle-tactical/src/emit.js"
import { admitFactory, authorizeFactorySupervision } from "../../packages/strategy-lab/src/factory/admission.js"
import { buildStrategyRevision } from "../../packages/runtime-js/src/revision.js"
import { defaultRuntimeMetadata } from "@cowards/spec"
import { MATCH_KERNEL } from "../../packages/engine/src/index.js"
import { LAB_ADMITTED_ROOTS } from "../../packages/strategy-lab/src/contracts.js"
import { prospectiveLeagueRuntimeBinding } from "./v1-38-league-prospective-lifetime.js"
import { runLeanPrivateFeasibilityMatch, runLeanPrivateFeasibilityMatchV2 } from "./v1-38-lean-baseline-match.js"
import * as sourceModule from "./v1-38-lean-baseline-source.js"
import * as runtimeModule from "./v1-38-factory-supervised-runtime.js"

describe("prospective two-Match authority, without execution", () => {
  it.each([{ version: 1, cleanupComplete: true }, { version: 1, cleanupComplete: false }, { version: 2, cleanupComplete: true }, { version: 2, cleanupComplete: false }])("uses genuine capacity→entry→durable debit→ordered V8 seats; %s", async ({ version, cleanupComplete }) => {
    const directory = realpathSync(mkdtempSync(join(tmpdir(), "inert-two-match-authority-"))), clock = vi.spyOn(Date, "now").mockReturnValue(version === 1 ? 1791669996000 : 1791738781000)
    const sourceDirectory = join(directory, "sources"), store = join(directory, "store"), artifact = join(directory, "allocation.json"), prefix = join(directory, "inert.ts")
    try {
      mkdirSync(sourceDirectory, { mode: 0o700 }); mkdirSync(store, { mode: 0o700 }); writeFileSync(prefix, matchFixture.sourceBytes)
      const snapshots = (["tactical-0", "cold-opponent"] as const).map((role, n) => buildLeanBaselineSource({ role, source: emitTacticalSource() + `\n// inert seat ${n}\n`, coldRoot: labRoot("inert-cold", 1), implementationRoot: labRoot("inert-implementation", 1) }))
      for (const snapshot of snapshots) writeFileSync(join(sourceDirectory, `source-${snapshot.role}.json`), leanCanonicalBytes(snapshot), { mode: 0o600 })
      matchFixture.mappings.set(resolve(authority.LEAN_PRIVATE_MATCH_SOURCE_STORE_V1), sourceDirectory)
      matchFixture.mappings.set(resolve("scripts/inert.ts"), prefix)
      matchFixture.mappings.set(resolve(version === 1 ? authority.LEAN_PRIVATE_MATCH_ARTIFACT_V1 : authority.LEAN_PRIVATE_MATCH_ARTIFACT_V2), artifact)
      matchFixture.active = true
      const metadata = snapshots.map(snapshot => {
        const m = authority.inspectLeanPrivateMatchSourceV1(authority.LEAN_PRIVATE_MATCH_SOURCE_STORE_V1, snapshot.role as "tactical-0" | "cold-opponent"), defaults = defaultRuntimeMetadata("typescript"), revision = buildStrategyRevision({ source: snapshot.source, runtime: { ...defaults, adapter: { ...defaults.adapter, id: "runtime-js-container-subprocess" } } })
        return { ...m, executableRoot: `sha256:${revision.metadata.sourceArtifact!.hash}` as const }
      }) as unknown as import("./v1-38-lean-experiment-authority.js").LeanPrivateMatchAllocationV1["sources"]
      const allocation = version === 1 ? createLeanPrivateMatchAllocationV1({ sourceHead: matchFixture.sourceHead, sources: metadata, sourcePrefix: authority.inspectLeanPrivateMatchPrefixV1(matchFixture.sourceHead), priorProbeCarry: authority.authenticateLeanPrivateMatchProbeCarryV1() }) : authority.createLeanPrivateMatchAllocationV2({ sourceHead: matchFixture.sourceHead, sources: metadata, sourcePrefix: authority.inspectLeanPrivateMatchPrefixV2(matchFixture.sourceHead), priorProbeCarry: authority.authenticateLeanPrivateMatchProbeCarryV1(), priorMatchCarry: authority.authenticateLeanPrivateMatchCarryV2() })
      matchFixture.allocation = Buffer.from(leanCanonicalBytes(allocation)); writeFileSync(artifact, matchFixture.allocation)
      writeFileSync(join(store, "allocation.json"), matchFixture.allocation, { mode: 0o600 })
      const virtualStore = resolve(version === 1 ? ".strategy-lab/lean-private-matches-v1" : ".strategy-lab/lean-private-matches-v2", allocation.root.slice(7)); matchFixture.mappings.set(virtualStore, store)
      const capacity = version === 1 ? authority.observeLeanPrivateMatchCapacityV1(virtualStore, allocation, 2) : authority.observeLeanPrivateMatchCapacityV2(virtualStore, allocation, 1)
      expect(() => JSON.stringify(capacity)).toThrow()
      const open = () => version === 1 ? authority.openLeanPrivateMatchAdmissionV1({ storePath: virtualStore, allocationCommit: matchFixture.commit, allocationPath: authority.LEAN_PRIVATE_MATCH_ARTIFACT_V1, capacity: capacity as never }) : authority.openLeanPrivateMatchAdmissionV2({ storePath: virtualStore, allocationCommit: matchFixture.commit, allocationPath: authority.LEAN_PRIVATE_MATCH_ARTIFACT_V2, capacity: capacity as never })
      const admission = open()
      expect(open).toThrow()
      const debit = version === 1 ? authority.recordLeanPrivateMatchDebitV1(admission as never, 0, authority.observeLeanPrivateMatchCapacityV1(virtualStore, allocation, 2)) : authority.recordLeanPrivateMatchDebitV2(admission as never, 0, authority.observeLeanPrivateMatchCapacityV2(virtualStore, allocation, 1))
      const context = version === 1 ? authority.readLeanPrivateMatchContextV1(admission as never, debit as never) : authority.readLeanPrivateMatchContextV2(admission as never, debit as never)
      const validate = vi.spyOn(sourceModule, "validateLeanBaselineSource"), create = vi.spyOn(runtimeModule, "createFactorySupervisedRuntime")
      try {
        const opposite = version === 1 ? runLeanPrivateFeasibilityMatchV2 : runLeanPrivateFeasibilityMatch
        await expect(opposite({ admission, debit, bottom: snapshots[0], top: snapshots[1], register() {}, unregister() {} } as never)).rejects.toThrow("LEAN_PRIVATE_MATCH_AUTHORITY")
        expect(validate).not.toHaveBeenCalled(); expect(create).not.toHaveBeenCalled()
      } finally { validate.mockRestore(); create.mockRestore() }
      if (version === 2) { expect(() => authority.readLeanPrivateMatchContextV1(admission as never, debit as never)).toThrow(); expect(() => authority.readLeanPrivateMatchContextV2({ ...admission } as never, debit as never)).toThrow() }
      expect(JSON.parse(readFileSync(join(store, "debit-0.json"), "utf8")).cumulativeCharged).toBe(version === 1 ? 41 : 42)
      expect(readFileSync(join(store, "ledger.ndjson"), "utf8").trim().split("\n")).toHaveLength(1)
      for (const [n, seat] of (["bottom", "top"] as const).entries()) {
        const snapshot = snapshots[n]!, defaults = defaultRuntimeMetadata("typescript"), revision = buildStrategyRevision({ source: snapshot.source, runtime: { ...defaults, adapter: { ...defaults.adapter, id: "runtime-js-container-subprocess" } } }), approved = authorizeFactorySupervision({ sourceAdmission: admitFactory({ packet: snapshot.packet, proposal: snapshot.proposal, sourceBytes: Buffer.from(snapshot.source) }), validation: snapshot.validation })
        const runtime = prospectiveLeagueRuntimeBinding(approved, { revisionId: revision.id, sourceRoot: snapshot.sourceRoot, executableRoot: `sha256:${revision.metadata.sourceArtifact!.hash}`, tupleId: MATCH_KERNEL.tupleId, tupleRoot: LAB_ADMITTED_ROOTS.tupleRoot, runtimeLimitsRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot, image: LAB_ADMITTED_ROOTS.image }), binding = { seat, runtime, budgetRoot: allocation.root, attemptRoot: context.debitRoot, matchId: `lean-${context.debitRoot.slice(7, 31)}`, containerName: `lean-${context.debitRoot.slice(7, 25)}-${seat}`, ownershipLabel: `lean-${allocation.root.slice(7, 25)}` }
        const issue = () => version === 1 ? authority.issueLeanPrivateMatchRuntimeAuthorityV1(admission as never, debit as never, snapshot, binding) : authority.issueLeanPrivateMatchRuntimeAuthorityV2(admission as never, debit as never, snapshot, binding)
        const issued = issue()
        expect(() => authority.claimLeanStartupAuthorityV8(issued, binding, "session")).toThrow()
        for (const layer of ["factory", "planner", "session"] as const) expect(authority.claimLeanStartupAuthorityV8(issued, binding, layer).startup.version).toBe(8)
        expect(() => authority.claimLeanStartupAuthorityV8(issued, binding, "session")).toThrow()
        expect(issue).toThrow()
      }
      const body = { schemaVersion: `lean-private-match-terminal-v${version}`, allocationRoot: allocation.root, debitRoot: context.debitRoot, slotRoot: allocation.slots[0].root, evidence: { classification: "success", cleanupComplete, boardEvidenceAvailable: true, fullChronicleVerified: false, lastFrameRoot: labRoot("inert-frame", 1), outcome: "DRAW" } }
      writeFileSync(join(store, "terminal-0.json"), leanCanonicalBytes({ ...body, root: labRoot(body.schemaVersion, body) }), { mode: 0o600 })
      expect(version === 1 ? authority.closeLeanPrivateMatchDebitV1(admission as never, debit as never) : authority.closeLeanPrivateMatchDebitV2(admission as never, debit as never)).toBe(cleanupComplete)
      if (version === 2) { expect(() => authority.recordLeanPrivateMatchDebitV2(admission as never, 0, capacity as never)).toThrow(); expect(() => authority.readLeanPrivateMatchContextV2(admission as never, debit as never)).toThrow(); return }
      if (admission.schemaVersion !== "lean-private-match-admission-v1") throw new Error("FIXTURE_VERSION")
      const nextCapacity = authority.observeLeanPrivateMatchCapacityV1(virtualStore, allocation, 1)
      if (cleanupComplete) { const next = authority.recordLeanPrivateMatchDebitV1(admission as never, 1, nextCapacity); expect(authority.readLeanPrivateMatchContextV1(admission as never, next).slot.condition).toBe(2) }
      else expect(() => authority.recordLeanPrivateMatchDebitV1(admission, 1, nextCapacity)).toThrow()
    } finally { matchFixture.active = false; matchFixture.mappings.clear(); clock.mockRestore(); rmSync(directory, { recursive: true, force: true }) }
  })
  it("has dedicated opaque gates and fixed prospective reserves", () => {
    for (const name of ["observeLeanPrivateMatchCapacityV1", "openLeanPrivateMatchAdmissionV1", "recordLeanPrivateMatchDebitV1", "issueLeanPrivateMatchRuntimeAuthorityV1"]) expect((authority as unknown as Record<string, unknown>)[name]).toBeTypeOf("function")
    expect((authority as unknown as Record<string, unknown>).LEAN_PRIVATE_MATCH_WINDOW_V1).toMatchObject({ anchorMs: 1791669996000, deadlineMs: 1791677196000, carryMs: 322054903, capMs: 329254903, reserveMs: 1860000 })
  })
  it("refuses copied admission/debit and old zero-Match handles before filesystem/provider work", () => {
    const fabricated = { schemaVersion: "lean-private-match-admission-v1" } as never, debit = { schemaVersion: "lean-private-match-debit-handle-v1" } as never, capacity = { schemaVersion: "lean-private-match-capacity-v1" } as never
    expect(() => authority.recordLeanPrivateMatchDebitV1(fabricated, 0, capacity)).toThrow("LEAN_PRIVATE_MATCH_AUTHORITY")
    expect(() => authority.recordLeanPrivateMatchDebitV1(fabricated, 1, capacity)).toThrow("LEAN_PRIVATE_MATCH_AUTHORITY")
    expect(() => authority.readLeanPrivateMatchContextV1(fabricated, debit)).toThrow("LEAN_PRIVATE_MATCH_AUTHORITY")
    expect(() => authority.issueLeanPrivateMatchRuntimeAuthorityV1(fabricated, debit, {} as never, {} as never)).toThrow("LEAN_PRIVATE_MATCH_AUTHORITY")
    expect(() => authority.closeLeanPrivateMatchDebitV1(fabricated, debit)).toThrow("LEAN_PRIVATE_MATCH_AUTHORITY")
    expect(() => authority.checkpointLeanPrivateMatchV1(fabricated, debit)).toThrow("LEAN_PRIVATE_MATCH_AUTHORITY")
    expect(() => authority.claimLeanStartupAuthorityV8({ schemaVersion: "lean-runtime-authority-v1", seat: "bottom", runtime: {} } as never, {} as never, "factory")).toThrow("LEAN_RUNTIME_AUTHORITY")
  })
})

describe("private probe authority surface", () => {
  it("exports a distinct admission opener, debit issuer, and ordered claim", () => {
    expect(authority.openLeanPrivateProbeAdmissionV1).toBeTypeOf("function")
    expect(authority.recordAndIssueLeanPrivateProbeRuntimeAuthorityV1).toBeTypeOf("function")
    expect(authority.claimLeanPrivateProbeRuntimeAuthority).toBeTypeOf("function")
  })

  it("does not treat caller-created capability-shaped objects as authority", () => {
    const fabricated = { schemaVersion: "lean-private-probe-runtime-authority-v1" }
    expect(() => authority.claimLeanPrivateProbeRuntimeAuthority(fabricated as never, {} as never, "factory")).toThrow("LEAN_PRIVATE_PROBE_AUTHORITY")
  })
})

describe("actual inert Git/filesystem debit authority", () => {
  it("issues and claims a genuine v1 ordinal-1 binding", () => {
    const repository = realpathSync(mkdtempSync(join(tmpdir(), "probe-authority-v1-ordinal-"))), fixtureClock = vi.spyOn(Date, "now").mockReturnValue(1791640699000)
    const git = childProcess.execFileSync.bind(childProcess), runGit = (...args: string[]) => String(git("git", ["-C", repository, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] })).trim()
    try {
      runGit("init", "-q"); runGit("-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit", "--allow-empty", "-qm", "source")
      const sourceHead = runGit("rev-parse", "HEAD"), root = (name: string) => labRoot("fixture-v1-ordinal", name)
      const allocation = createLeanPrivateProbeScheduleV1({ sourceHead, sourceRoot: root("source"), executableRoot: root("executable"), costSnapshotRoot: authority.LEAN_PRIVATE_PROBE_COST_ROOT })
      const allocationPath = ".planning/artifacts/v1.38-phase-265-private-probe-allocation-v1.json"
      mkdirSync(join(repository, ".planning/artifacts"), { recursive: true }); writeFileSync(join(repository, allocationPath), leanCanonicalBytes(allocation)); runGit("add", allocationPath); runGit("-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit", "-qm", "allocation")
      const allocationCommit = runGit("rev-parse", "HEAD"), store = join(repository, "inert-store")
      mkdirSync(store, { mode: 0o700 }); chmodSync(store, 0o700); writeFileSync(join(store, "allocation.json"), leanCanonicalBytes(allocation), { mode: 0o600 }); writeFileSync(join(store, "request.json"), "{}", { mode: 0o600 })
      gitFixture.repository = repository
      try {
        const admission = authority.openLeanPrivateProbeAdmissionV1({ storePath: store, allocationCommit, allocationPath, capacity: authority.observeLeanPrivateProbeCapacityV1(store) })
        writeFileSync(join(store, "entry.json"), "{}", { mode: 0o600 })
        const ordinal0 = authority.recordAndIssueLeanPrivateProbeRuntimeAuthorityV1(admission, allocation.cases[0]!, authority.observeLeanPrivateProbeCapacityV1(store))
        writeFileSync(join(store, "probe-00.json"), "{}", { mode: 0o600 })
        const ordinal1 = authority.recordAndIssueLeanPrivateProbeRuntimeAuthorityV1(admission, allocation.cases[1]!, authority.observeLeanPrivateProbeCapacityV1(store))
        expect(ordinal0.binding.ordinal).toBe(0)
        expect(ordinal1.binding).toMatchObject({ ordinal: 1, executionOwnerId: `probe-${allocation.root.slice(7, 19)}-1`, caseId: allocation.cases[1]!.caseId })
        const factory = authority.claimLeanPrivateProbeRuntimeAuthority(ordinal1, ordinal1.binding, "factory")
        const planner = authority.claimLeanPrivateProbeRuntimeAuthority(ordinal1, ordinal1.binding, "planner")
        const session = authority.claimLeanPrivateProbeRuntimeAuthority(ordinal1, ordinal1.binding, "session")
        expect(factory.startupGrant).toBe(planner.startupGrant); expect(planner.startupGrant).toBe(session.startupGrant)
      } finally { gitFixture.repository = "" }
    } finally { fixtureClock.mockRestore(); rmSync(repository, { recursive: true, force: true }) }
  })
  it("authenticates v1 carry and issues one v2 ordinal-0 debit through the real ordered grant claims", () => {
    const repository = realpathSync(mkdtempSync(join(tmpdir(), "probe-authority-v2-git-")))
    const fixtureClock = vi.spyOn(Date, "now").mockReturnValue(1791667800000)
    const git = childProcess.execFileSync.bind(childProcess)
    const runGit = (...args: string[]) => String(git("git", ["-C", repository, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] })).trim()
    try {
      runGit("init", "-q"); runGit("-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit", "--allow-empty", "-qm", "source")
      const sourceHead = runGit("rev-parse", "HEAD"), root = (name: string) => labRoot("fixture-v2", name)
      const allocation = createLeanPrivateProbeScheduleV2({ sourceHead, sourceRoot: root("source"), executableRoot: root("executable"), costSnapshotRoot: authority.LEAN_PRIVATE_PROBE_COST_ROOT })
      expect(allocation.priorV1Carry).toEqual(authority.authenticateLeanPrivateProbeV1CarryV2())
      expect(allocation.cases).toHaveLength(1); expect(allocation.cases[0]).toMatchObject({ ordinal: 0, method: "selectActivations" })
      const allocationPath = ".planning/artifacts/v1.38-phase-265-private-probe-allocation-v2.json"
      mkdirSync(join(repository, ".planning/artifacts"), { recursive: true }); writeFileSync(join(repository, allocationPath), leanCanonicalBytes(allocation))
      runGit("add", allocationPath); runGit("-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit", "-qm", "allocation")
      const allocationCommit = runGit("rev-parse", "HEAD"), store = join(repository, "inert-store")
      mkdirSync(store, { mode: 0o700 }); chmodSync(store, 0o700)
      writeFileSync(join(store, "allocation.json"), leanCanonicalBytes(allocation), { mode: 0o600 })
      writeFileSync(join(store, "request.json"), "{}", { mode: 0o600 })
      gitFixture.repository = repository
      try {
        const resources = authority.observeLeanPrivateProbeResourcesV2(store, allocation)
        expect(resources).toMatchObject({ windowRoot: authority.LEAN_PRIVATE_PROBE_WINDOW_V2.root, cumulativeElapsedMs: 319858903, sourceAllocatedBytes: 1183744, priorRetainedBytes: 32768 })
        expect(resources.retainedBytesUpperBound).toBe(29970432 + 32768 + 1183744 + resources.newAllocatedBytes + 131072)
        expect(verifyLeanPrivateProbeResourcesV2(allocation, resources)).toBe(true)
        expect(verifyLeanPrivateProbeResourcesV2(allocation, { ...resources, sourceAllocatedBytes: 0 })).toBe(false)
        expect(verifyLeanPrivateProbeResourcesV2(allocation, { ...resources, retainedBytesUpperBound: resources.retainedBytesUpperBound - 1183744 })).toBe(false)
        expect(() => authority.observeLeanPrivateProbeResourcesV1(store)).toThrow()
        const otherAllocation = createLeanPrivateProbeScheduleV2({ sourceHead, sourceRoot: root("other-source"), executableRoot: root("executable"), costSnapshotRoot: authority.LEAN_PRIVATE_PROBE_COST_ROOT })
        expect(() => authority.openLeanPrivateProbeAdmissionV1({ storePath: store, allocationCommit, allocationPath, capacity: authority.observeLeanPrivateProbeCapacityV2(store, otherAllocation) })).toThrow()
        fixtureClock.mockReturnValue(1791640699000)
        const legacyCapacity = authority.observeLeanPrivateProbeCapacityV1(store, allocation.priorV1Carry.retainedAllocatedBytes)
        fixtureClock.mockReturnValue(1791667800000)
        expect(() => authority.openLeanPrivateProbeAdmissionV1({ storePath: store, allocationCommit, allocationPath, capacity: legacyCapacity })).toThrow()
        const forged = { ...allocation, windowRoot: labRoot("forged-window", 0) }
        expect(() => authority.observeLeanPrivateProbeResourcesV2(store, forged)).toThrow()
        fixtureClock.mockReturnValue(1791667800000 + 1740001)
        expect(() => authority.observeLeanPrivateProbeResourcesV2(store, allocation)).toThrow()
        fixtureClock.mockReturnValue(1791667800000 - 1)
        expect(() => authority.observeLeanPrivateProbeResourcesV2(store, allocation)).toThrow()
        fixtureClock.mockReturnValue(1791671400001)
        expect(verifyLeanPrivateProbeResourcesV2(allocation, resources)).toBe(false)
        fixtureClock.mockReturnValue(1791667800000)
        const admission = authority.openLeanPrivateProbeAdmissionV1({ storePath: store, allocationCommit, allocationPath, capacity: authority.observeLeanPrivateProbeCapacityV2(store, allocation) })
        writeFileSync(join(store, "entry.json"), "{}", { mode: 0o600 })
        const issued = authority.recordAndIssueLeanPrivateProbeRuntimeAuthorityV1(admission, allocation.cases[0]!, authority.observeLeanPrivateProbeCapacityV2(store, allocation))
        expect(issued.binding).toMatchObject({ ordinal: 0, method: "selectActivations", executionOwnerId: `probe-${allocation.root.slice(7, 19)}-0`, debitOffset: 0 })
        const factory = authority.claimLeanPrivateProbeRuntimeAuthority(issued, issued.binding, "factory")
        const planner = authority.claimLeanPrivateProbeRuntimeAuthority(issued, issued.binding, "planner")
        const session = authority.claimLeanPrivateProbeRuntimeAuthority(issued, issued.binding, "session")
        expect(factory.startupGrant).toBe(planner.startupGrant); expect(planner.startupGrant).toBe(session.startupGrant)
        const ledger = readFileSync(join(store, "ledger.ndjson"), "utf8")
        expect(ledger.split("\n").filter(Boolean)).toHaveLength(1)
        const debit = JSON.parse(ledger) as Record<string, unknown>
        expect(debit).toMatchObject({ ordinal: 0, caseId: "case-0", allocationRoot: allocation.root, inputRoot: allocation.cases[0]!.inputRoot, requestRoot: allocation.cases[0]!.requestRoot })
        const requestBody = { schemaVersion: "lean-private-probe-request-v2", sourceRoot: allocation.sourceRoot, executableRoot: allocation.executableRoot, tupleRoot: allocation.tupleRoot, runtimeLimitsRoot: allocation.runtimeLimitsRoot, caseRoots: allocation.cases.map(item => ({ ordinal: item.ordinal, method: item.method, inputRoot: item.inputRoot, requestRoot: item.requestRoot })) }
        const request = { ...requestBody, root: labRoot("lean-private-probe-request-v2", requestBody) }
        const resultBody = { schemaVersion: "lean-private-probe-result-v1", allocationRoot: allocation.root, sourceHead: allocation.sourceHead, matchCount: 0, attemptedOrdinals: [0], outcomes: [{ ordinal: 0, status: "system_failure", cleanupComplete: false, inputRoot: allocation.cases[0]!.inputRoot, requestRoot: allocation.cases[0]!.requestRoot }] }
        const result = { ...resultBody, root: labRoot("lean-private-probe-result-v1", resultBody) }
        expect(verifyLeanPrivateProbeV2RetainedJoins({ allocation, request, result, debitRows: [debit] })).toBe(true)
        expect(verifyLeanPrivateProbeV2RetainedJoins({ allocation, request, result, debitRows: [] })).toBe(false)
        expect(readdirSync(store).sort()).toEqual(["allocation.json", "entry.json", "ledger.ndjson", "request.json"])
      } finally { gitFixture.repository = "" }
    } finally { fixtureClock.mockRestore(); rmSync(repository, { recursive: true, force: true }) }
  })
  it.each(["requestRoot", "inputRoot", "caseId", "extra", "delimiter"])("permanently rejects changed prior %s after actual ordered claims", key => {
    const repository = realpathSync(mkdtempSync(join(tmpdir(), "probe-authority-git-")))
    const fixtureClock = vi.spyOn(Date, "now").mockReturnValue(1791640699000)
    const git = childProcess.execFileSync.bind(childProcess)
    const runGit = (...args: string[]) => String(git("git", ["-C", repository, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] })).trim()
    try {
      runGit("init", "-q"); runGit("-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit", "--allow-empty", "-qm", "fixture")
      const sourceHead = runGit("rev-parse", "HEAD"), root = (name: string) => labRoot("fixture", name)
      const allocation = createLeanPrivateProbeScheduleV1({ sourceHead, sourceRoot: root("source"), executableRoot: root("executable"), costSnapshotRoot: authority.LEAN_PRIVATE_PROBE_COST_ROOT })
      const allocationPath = ".planning/artifacts/v1.38-phase-265-private-probe-allocation-v1.json"
      mkdirSync(join(repository, ".planning/artifacts"), { recursive: true }); writeFileSync(join(repository, allocationPath), leanCanonicalBytes(allocation))
      runGit("add", allocationPath); runGit("-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit", "-qm", "allocation")
      const allocationCommit = runGit("rev-parse", "HEAD"), store = join(repository, "store")
      mkdirSync(store, { mode: 0o700 }); chmodSync(store, 0o700)
      writeFileSync(join(store, "allocation.json"), leanCanonicalBytes(allocation), { mode: 0o600 }); writeFileSync(join(store, "request.json"), "{}", { mode: 0o600 })
      gitFixture.repository = repository
      try {
        const admission = authority.openLeanPrivateProbeAdmissionV1({ storePath: store, allocationCommit, allocationPath, capacity: authority.observeLeanPrivateProbeCapacityV1(store) })
        writeFileSync(join(store, "entry.json"), "{}", { mode: 0o600 })
        const issued = authority.recordAndIssueLeanPrivateProbeRuntimeAuthorityV1(admission, allocation.cases[0]!, authority.observeLeanPrivateProbeCapacityV1(store))
        expect(() => authority.claimLeanPrivateProbeRuntimeAuthority(issued, issued.binding, "session")).toThrow()
        const factoryClaim = authority.claimLeanPrivateProbeRuntimeAuthority(issued, issued.binding, "factory")
        const plannerClaim = authority.claimLeanPrivateProbeRuntimeAuthority(issued, issued.binding, "planner")
        const sessionClaim = authority.claimLeanPrivateProbeRuntimeAuthority(issued, issued.binding, "session")
        expect(factoryClaim.binding).toBe(issued.binding); expect(plannerClaim.binding).toBe(issued.binding); expect(sessionClaim.binding).toBe(issued.binding)
        expect(factoryClaim.startupGrant).toBe(plannerClaim.startupGrant); expect(plannerClaim.startupGrant).toBe(sessionClaim.startupGrant)
        expect(() => JSON.stringify(factoryClaim.startupGrant)).toThrow()
        expect(() => authority.claimLeanPrivateProbeRuntimeAuthority(issued, issued.binding, "session")).toThrow()
        writeFileSync(join(store, "probe-00.json"), "{}", { mode: 0o600 })
        const ledger = join(store, "ledger.ndjson"), original = readFileSync(ledger), row = JSON.parse(original.toString("utf8")) as Record<string, unknown>
        row[key] = "changed"
        writeFileSync(ledger, key === "delimiter" ? original.subarray(0, -1) : Buffer.concat([leanCanonicalBytes(row), Buffer.from("\n")]))
        expect(() => authority.recordAndIssueLeanPrivateProbeRuntimeAuthorityV1(admission, allocation.cases[1]!, authority.observeLeanPrivateProbeCapacityV1(store))).toThrow()
        writeFileSync(ledger, original)
        expect(() => authority.recordAndIssueLeanPrivateProbeRuntimeAuthorityV1(admission, allocation.cases[1]!, authority.observeLeanPrivateProbeCapacityV1(store))).toThrow()
      } finally { gitFixture.repository = "" }
    } finally { fixtureClock.mockRestore(); rmSync(repository, { recursive: true, force: true }) }
  })
})
