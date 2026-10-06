import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { gzipSync } from "node:zlib"
import { readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import ts from "typescript"
import * as lean from "../packages/strategy-lab/src/league/lean-experiment.js"
import { labRoot } from "../packages/strategy-lab/src/contracts.js"

// No empirical helpers or test suites are imported. Real gzip and canonical
// admission operate exclusively on trusted tiny fixtures created below.
const safety = vi.hoisted(() => ({
  deny: () => { throw new Error("REPLAY_VALIDATION_SYNTHETIC_ONLY") },
  directories: new Set<string>(), descriptors: new Set<number>(),
  inflates: [] as number[], order: [] as string[], parsed: [] as string[],
}))
vi.mock("node:child_process", async original => ({ ...await original<typeof import("node:child_process")>(), spawn: safety.deny, spawnSync: safety.deny, fork: safety.deny, exec: safety.deny, execSync: safety.deny, execFile: safety.deny, execFileSync: safety.deny }))
vi.mock("node:worker_threads", async original => ({ ...await original<typeof import("node:worker_threads")>(), Worker: function() { return safety.deny() } }))
vi.mock("node:zlib", async original => {
  const zlib = await original<typeof import("node:zlib")>()
  return { ...zlib, gunzipSync: (bytes: Uint8Array, options: { maxOutputLength: number }) => { safety.order.push("inflate"); safety.inflates.push(options.maxOutputLength); return zlib.gunzipSync(bytes, options) } }
})
vi.mock("@cowards/spec", async original => {
  const spec = await original<typeof import("@cowards/spec")>()
  return { ...spec, admitCanonicalJsonBytes: (...args: Parameters<typeof spec.admitCanonicalJsonBytes>) => { safety.parsed.push(Buffer.from(args[0]).toString("utf8")); return spec.admitCanonicalJsonBytes(...args) } }
})
vi.mock("node:fs", async original => {
  const fs = await original<typeof import("node:fs")>()
  const { resolve } = await import("node:path")
  const source = resolve("packages/strategy-lab/src/league/lean-experiment.ts")
  const permit = (path: unknown): void => {
    if (path instanceof URL && path.protocol === "file:" && ["scripts", "packages"].some(dir => decodeURIComponent(path.pathname).startsWith(resolve(dir) + "/"))) return
    if (typeof path === "number" && safety.descriptors.has(path)) return
    if (typeof path === "string") {
      const absolute = resolve(path)
      if (absolute === source || absolute.startsWith(resolve("scripts") + "/") || absolute.startsWith(resolve("packages") + "/") || [...safety.directories].some(dir => absolute === dir || absolute.startsWith(dir + "/"))) return
    }
    safety.deny()
  }
  return { ...fs,
    readFileSync: ((path: any, ...args: any[]) => { permit(path); return (fs.readFileSync as any)(path, ...args) }) as typeof fs.readFileSync,
    writeFileSync: ((path: any, ...args: any[]) => { permit(path); return (fs.writeFileSync as any)(path, ...args) }) as typeof fs.writeFileSync,
    lstatSync: ((path: any, ...args: any[]) => { permit(path); return (fs.lstatSync as any)(path, ...args) }) as typeof fs.lstatSync,
    realpathSync: ((path: any, ...args: any[]) => { permit(path); return (fs.realpathSync as any)(path, ...args) }) as typeof fs.realpathSync,
    readdirSync: ((path: any, ...args: any[]) => { permit(path); return (fs.readdirSync as any)(path, ...args) }) as typeof fs.readdirSync,
    statSync: ((path: any, ...args: any[]) => { permit(path); return (fs.statSync as any)(path, ...args) }) as typeof fs.statSync,
    openSync: ((path: any, ...args: any[]) => { permit(path); const fd = (fs.openSync as any)(path, ...args); safety.descriptors.add(fd); return fd }) as typeof fs.openSync,
    closeSync: (fd: number) => { permit(fd); safety.descriptors.delete(fd); return fs.closeSync(fd) },
    statfsSync: safety.deny,
  }
})

const source = () => readFileSync("packages/strategy-lab/src/league/lean-experiment.ts", "utf8")
const validator = (container: lean.LeanReplayContainer, bytes: Uint8Array, maximumBytes?: number): void => {
  const validate = (lean as unknown as { validateLeanReplay: typeof lean.decodeLeanReplay }).validateLeanReplay
  expect(validate, "additive validation-only seam must exist").toBeTypeOf("function")
  expect(validate(container, bytes, maximumBytes)).toBeUndefined()
}
const rawReplay = (plain: Uint8Array | string, frames: number) => {
  const data = Buffer.from(plain), bytes = gzipSync(data)
  const body = { schemaVersion: "lean-sampled-replay-gzip-v1" as const, privacy: "private_offline" as const, codec: "gzip-node-v1" as const, compressedRoot: lean.leanBytesRoot(bytes), uncompressedRoot: lean.leanBytesRoot(data), compressedBytes: bytes.length, uncompressedBytes: data.length, frames }
  return { bytes, container: { ...body, root: labRoot(body.schemaVersion, body) } }
}
const reroot = (container: lean.LeanReplayContainer, patch: Record<string, unknown>): lean.LeanReplayContainer => {
  // Invalid outer roots/unsafe counts must reach metadata admission, not
  // be repaired or rejected early by the trusted fixture's root builder.
  if ("root" in patch || Object.values(patch).some(value => typeof value === "number" && !Number.isSafeInteger(value))) return { ...container, ...patch } as lean.LeanReplayContainer
  const { root: _claimed, ...body } = { ...container, ...patch }
  return { ...body, root: labRoot("lean-sampled-replay-gzip-v1", body) } as lean.LeanReplayContainer
}
const error = (fn: () => unknown): string | undefined => { try { fn(); return undefined } catch (e) { return (e as Error).message } }
const differential = (fixture: ReturnType<typeof rawReplay>, expected?: string, maximumBytes?: number) => {
  const oracle = error(() => lean.decodeLeanReplay(fixture.container, fixture.bytes, maximumBytes))
  expect(oracle).toBe(expected)
  if (oracle) expect(error(() => validator(fixture.container, fixture.bytes, maximumBytes))).toBe(oracle)
  else validator(fixture.container, fixture.bytes, maximumBytes)
}
beforeEach(() => {
  safety.inflates.length = 0; safety.order.length = 0; safety.parsed.length = 0
  // These artificial low values prove guard arithmetic, never host capacity.
  vi.spyOn(process, "memoryUsage").mockImplementation(() => { safety.order.push("guard"); return { rss: 0, heapTotal: 0, heapUsed: 0, external: 0, arrayBuffers: 0 } })
  vi.spyOn(process, "resourceUsage").mockReturnValue({ ...process.resourceUsage(), maxRSS: 0 })
})
afterEach(async () => {
  vi.restoreAllMocks(); expect(safety.descriptors.size).toBe(0)
  const fs = await vi.importActual<typeof import("node:fs")>("node:fs")
  for (const directory of safety.directories) fs.rmSync(directory, { recursive: true, force: true })
  safety.directories.clear()
})

describe("contract", () => {
  it("has an additive void seam and keeps canonical values decoder-equivalent", () => {
    const values = [null, true, false, 0, 12, "escaped\nnewline and λ🙂", [], { a: [1, "é"], z: {} }]
    const fixture = lean.encodeLeanReplay(values)
    expect(lean.decodeLeanReplay(fixture.container, fixture.bytes)).toEqual(values)
    validator(fixture.container, fixture.bytes)
  })
  it.each([["", 0, undefined], ["\n", 1, "LEAN_EXPERIMENT_CANONICAL"], ["1\n\n2\n", 3, "LEAN_EXPERIMENT_CANONICAL"], ["1", 1, "LEAN_EXPERIMENT_REPLAY"], ["1\n", 0, "LEAN_EXPERIMENT_REPLAY"], ["1\n", 2, "LEAN_EXPERIMENT_REPLAY"]] as const)("handles newline/count fixture %j", (plain, count, expected) => differential(rawReplay(plain, count), expected))
  it.each(["schemaVersion", "privacy", "codec", "compressedRoot", "uncompressedRoot", "compressedBytes", "uncompressedBytes", "frames", "root"])("refuses missing %s", key => {
    const fixture = rawReplay("1\n", 1), container = { ...fixture.container } as Record<string, unknown>
    delete container[key]
    differential({ ...fixture, container: container as unknown as lean.LeanReplayContainer }, "LEAN_EXPERIMENT_REPLAY")
  })
  it.each([
    { extra: true }, { schemaVersion: "other" }, { privacy: "public" }, { codec: "plain" },
    { compressedRoot: "bad" }, { uncompressedRoot: "bad" }, { root: "bad" },
    { compressedBytes: -1 }, { uncompressedBytes: 0.5 }, { frames: Number.MAX_SAFE_INTEGER + 1 },
    { compressedBytes: 1 }, { uncompressedBytes: 1 }, { compressedRoot: `sha256:${"0".repeat(64)}` },
    { uncompressedRoot: `sha256:${"0".repeat(64)}` }, { uncompressedBytes: 256_000_001 },
  ])("refuses metadata/hash mutation %j", patch => {
    const fixture = rawReplay("1\n", 1)
    differential({ ...fixture, container: reroot(fixture.container, patch) }, "LEAN_EXPERIMENT_REPLAY")
  })
  it("refuses a well-formed but mismatched envelope root", () => {
    const fixture = rawReplay("1\n", 1)
    differential({ ...fixture, container: { ...fixture.container, root: `sha256:${"0".repeat(64)}` } }, "LEAN_EXPERIMENT_REPLAY")
  })
  it.each([0, 1, 2])("actually parses malformed frame at position %i after fully rehashing", position => {
    for (const malformed of ["{", " 1", '{"z":1,"a":2}', '{"a":1,"a":2}', "9007199254740992", "1e999", "[".repeat(130) + "0" + "]".repeat(130)]) {
      const lines = ["1", "2", "3"]; lines[position] = malformed
      differential(rawReplay(lines.join("\n") + "\n", 3), "LEAN_EXPERIMENT_CANONICAL")
    }
  })
  it.each([[0xff], [0xc3], [0xe2, 0x82], [0xf0, 0x9f, 0x99], [0xc3, 0x28]].map(octets => [octets]))("keeps replacement-round-trip UTF-8 semantics %j", octets => {
    const plain = Buffer.concat([Buffer.from('"'), Buffer.from(octets), Buffer.from('"\n')])
    differential(rawReplay(plain, 1))
  })
  it("checks every multibyte/escaped frame through the existing parser", () => {
    const fixture = rawReplay('"λ🙂"\n"escaped\\nline"\n{"a":1}\n', 3)
    validator(fixture.container, fixture.bytes)
    expect(safety.parsed).toEqual(['"λ🙂"', '"escaped\\nline"', '{"a":1}'])
  })
  it("honors exact-bound/one-over/output-limit and truncated or corrupt gzip", () => {
    const fixture = rawReplay('"12345678"\n', 1)
    differential(fixture, undefined, fixture.container.uncompressedBytes)
    differential(fixture, "LEAN_EXPERIMENT_REPLAY", fixture.container.uncompressedBytes - 1)
    differential(rawReplay("", 0), undefined, 0)
    const bomb = rawReplay('"' + "x".repeat(4096) + '"\n', 1)
    differential({ ...bomb, container: reroot(bomb.container, { uncompressedBytes: 16 }) }, "LEAN_EXPERIMENT_REPLAY_LIMIT", 16)
    for (const bytes of [fixture.bytes.subarray(0, -4), Buffer.from("not gzip")]) {
      differential({ bytes, container: reroot(fixture.container, { compressedBytes: bytes.length, compressedRoot: lean.leanBytesRoot(bytes) }) }, "LEAN_EXPERIMENT_REPLAY_LIMIT")
    }
  })
  it("uses the real 4× guard before gunzip and preserves maxOutputLength", () => {
    const fixture = rawReplay("1\n", 1), guardBase = lean.LEAN_CAPS.scratchBytes - lean.LEAN_EXTERNAL_SCRATCH_RESERVE - fixture.container.uncompressedBytes * 4
    vi.mocked(process.memoryUsage).mockImplementation(() => { safety.order.push("guard"); return { rss: guardBase, heapTotal: 0, heapUsed: 0, external: 0, arrayBuffers: 0 } })
    validator(fixture.container, fixture.bytes, 7)
    expect(safety.order).toEqual(["guard", "inflate"]); expect(safety.inflates).toEqual([7])
    safety.inflates.length = 0
    vi.mocked(process.memoryUsage).mockReturnValue({ rss: guardBase + 1, heapTotal: 0, heapUsed: 0, external: 0, arrayBuffers: 0 })
    differential(fixture, "LEAN_EXPERIMENT_BUFFER_CAP", 7)
    expect(safety.inflates).toEqual([])
    vi.mocked(process.memoryUsage).mockReturnValue({ rss: 0, heapTotal: 0, heapUsed: 0, external: 0, arrayBuffers: 0 })
    vi.mocked(process.resourceUsage).mockReturnValue({ ...process.resourceUsage(), maxRSS: Math.ceil((guardBase + 1) / 1024) })
    differential(fixture, "LEAN_EXPERIMENT_BUFFER_CAP", 7)
  })
  it("byte-pins unchanged decoder, fixed caps/policy and replay guards", () => {
    const text = source(), digest = (a: string, b: string) => lean.leanBytesRoot(Buffer.from(text.slice(text.indexOf(a), text.indexOf(b, text.indexOf(a)))))
    const decoderStart = text.indexOf("export const decodeLeanReplay ="), decoderEnd = text.indexOf("\n}\n", decoderStart) + 3
    expect(lean.leanBytesRoot(Buffer.from(text.slice(decoderStart, decoderEnd)))).toBe("sha256:b2115d6b20d40a213e5d62398c905bfd306e88078f5bfa51b5a145fba0f08b2c")
    expect(digest("export const LEAN_CAPS =", "const fail =")).toBe("sha256:5263de232b1da25075e3ccbe016414011b23a93d1d607b7aacdae38366fe8486")
    expect(digest("const REPLAY_MAX =", "/** Conservative JSON-size")).toBe("sha256:a7a80f3082cce78eed4a19b7a01276a82bb49a7170bd114004d2dd2070327792")
  })
  it("region-scoped AST forbids validator full text/line/frame collections", () => {
    const file = ts.createSourceFile("lean.ts", source(), ts.ScriptTarget.Latest, true)
    const statement = file.statements.find(node => ts.isVariableStatement(node) && node.declarationList.declarations.some(d => ts.isIdentifier(d.name) && d.name.text === "validateLeanReplay"))
    expect(statement).toBeDefined()
    const violations: string[] = []
    const visit = (node: ts.Node): void => {
      if (ts.isArrayLiteralExpression(node) || ts.isNewExpression(node)) violations.push(node.getText(file))
      if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
        if (["split", "map", "push", "reduce", "filter", "fromEntries"].includes(node.expression.name.text)) violations.push(node.getText(file))
        if (node.expression.name.text === "toString" && node.expression.expression.getText(file) === "plain") violations.push("full-payload UTF-8")
      }
      if (ts.isReturnStatement(node) && node.expression && !node.expression.getText(file).startsWith("fail(")) violations.push("returned materialization")
      ts.forEachChild(node, visit)
    }
    if (statement) visit(statement)
    // Metadata arrays used by exact-key/natural checks are allowed; no
    // collection may occur after inflate, where frame retention matters.
    expect(violations.filter(v => !v.startsWith('["schemaVersion"') && !v.startsWith("[container.") && !v.includes(".every("))).toEqual([])
  })
})

const syntheticRoot = (name: string) => labRoot("replay-validation-synthetic", name)
const allocation = (version: 0 | 1 | 2 | 3 | 4 | 6, route: "diagnostic" | "baseline" = "diagnostic") => {
  const common = { sourceRoot: syntheticRoot("source"), reviewRoot: syntheticRoot("review"), candidateRoots: [syntheticRoot("a"), syntheticRoot("b")], seed: "synthetic-replay-validation" }
  if (version === 0) return lean.createLeanAllocation(common)
  const predecessorBody = {
    schemaVersion: "lean-correction-predecessor-v1" as const,
    chargedMatches: (version === 6 ? 24 : version === 4 ? 12 : version === 1 ? 10 : 11) + (route === "baseline" ? 1 : 0),
    elapsedUpperBoundMs: version === 6 ? 36_151_532 : version === 4 ? 20_471_046 : version === 3 ? 10_888_046 : 5_282_046,
    allocatedDiskBytes: 10_432_512, historicalPeakDiskBytes: "unknown" as const, historicalPeakRssBytes: "unknown" as const,
    historyRoot: syntheticRoot("history"), survivors: [{ identity: ".strategy-lab/synthetic-replay-validation", allocatedBytes: 4096 }],
  }
  const input = { ...common, coldRoot: syntheticRoot("cold"), planRoot: version === 6 ? lean.LEAN_REPLAY_V6_SUPPLEMENT_ROOT : syntheticRoot("plan"), requestRoots: Array.from({ length: route === "diagnostic" ? 1 : 36 }, (_, i) => syntheticRoot(`request-${i}`)), route, reuseGrantRoot: syntheticRoot("reuse"), predecessor: { ...predecessorBody, root: labRoot(predecessorBody.schemaVersion, predecessorBody) } }
  if (version === 1) return lean.createLeanCorrectionAllocation({ ...input, diagnosisRoot: route === "diagnostic" ? null : syntheticRoot("diagnosis") })
  return lean.createLeanSupervisorCorrectionAllocation({ ...input, supervisorDecisionRoot: version === 6 ? lean.LEAN_REPLAY_V6_APPROVAL_ROOT : syntheticRoot("decision"), acceptedCheckRoot: route === "diagnostic" ? null : syntheticRoot("accepted"), requestBytesRoot: syntheticRoot("request-bytes"), dataReviewRoot: syntheticRoot("data-review"), setupAccountingRoot: syntheticRoot("setup"), ...(version === 6 ? { startupPolicyRoot: lean.LEAN_STARTUP_POLICY_V5.root } : {}) }, version)
}
type SyntheticTerminal = { ordinal: number; failure?: boolean; replay?: ReturnType<typeof rawReplay> | null }
const syntheticLedger = async (a: ReturnType<typeof allocation>, terminals: SyntheticTerminal[] = [{ ordinal: 0 }]) => {
  const fs = await vi.importActual<typeof import("node:fs")>("node:fs")
  const directory = fs.realpathSync(fs.mkdtempSync(join(tmpdir(), "lean-replay-validation-synthetic-")))
  safety.directories.add(directory); fs.chmodSync(directory, 0o700)
  writeFileSync(join(directory, "allocation.json"), lean.leanCanonicalBytes(a))
  const events: unknown[] = [], records = a.slots.map(slot => ({ slotRoot: slot.root, requestRoot: slot.requestRoot, chargeRoot: null as string | null, terminal: null as unknown, status: "unused" }))
  const replayTexts: string[] = []
  for (const spec of terminals) {
    const slot = a.slots[spec.ordinal]!
    const chargeBody = { schemaVersion: "lean-slot-charge-v1" as const, allocationRoot: a.root, slotRoot: slot.root, ordinal: slot.ordinal }
    const charge = { ...chargeBody, root: labRoot(chargeBody.schemaVersion, chargeBody) }
    const record: lean.LeanCompactMatchRecord = { classification: spec.failure ? "system_failure" : "success", code: spec.failure ? "SUPERVISOR_FAILURE" : "OK", outcome: spec.failure ? null : "DRAW", elapsedMs: 1, cleanupComplete: true, invocationCount: 0, accountingRoot: syntheticRoot(`accounting-${slot.ordinal}`), executionRoot: syntheticRoot(`execution-${slot.ordinal}`), telemetry: { transitions: 0, events: 0 } }
    const selected = a.sampleSlotRoots.includes(slot.root) || Boolean(spec.failure)
    const text = `{"frame":"synthetic-${slot.ordinal}-first"}\n{"frame":"synthetic-${slot.ordinal}-last"}\n`
    const replay = spec.replay === undefined ? selected ? rawReplay(text, 2) : null : spec.replay
    if (replay) { writeFileSync(join(directory, `${charge.root.slice(7)}.gz`), replay.bytes); replayTexts.push(text) }
    const terminal = { kind: "terminal", chargeRoot: charge.root, record, replay: replay?.container ?? null }
    events.push({ kind: "charge", charge }, terminal)
    records[slot.ordinal] = { slotRoot: slot.root, requestRoot: slot.requestRoot, chargeRoot: charge.root, terminal, status: record.classification }
  }
  events.push({ kind: "stop", reason: terminals.some(t => t.failure) ? "failure" : "complete" })
  writeFileSync(join(directory, "ledger.ndjson"), Buffer.concat(events.map(event => Buffer.concat([lean.leanCanonicalBytes(event), Buffer.from("\n")]))))
  const previous = "predecessor" in a ? a.predecessor : undefined
  const expected = { schemaVersion: "lean-pilot-verification-v1", issued: false, evidenceClass: "feasibility_only", records, charged: terminals.length + (previous?.chargedMatches ?? 0), elapsedMs: previous?.elapsedUpperBoundMs ?? 0, physicalHighWaterBytes: previous?.allocatedDiskBytes ?? 0, scratchHighWaterBytes: 0, root: labRoot("lean-evidence-v1", { allocationRoot: a.root, events, records }) }
  return { ledger: { directory, allocation: a }, expected, replayTexts }
}
// Observe actual full-payload text materialization, not mocked exports. Metadata
// and ledger decoding remains allowed and is excluded by exact synthetic text.
const observeFullReplayText = (texts: readonly string[]) => {
  const original = Buffer.prototype.toString, hits: string[] = []
  vi.spyOn(Buffer.prototype, "toString").mockImplementation(function(this: Buffer, ...args: Parameters<typeof original>) {
    const text = original.apply(this, args)
    if (texts.includes(text)) hits.push(text)
    return text
  })
  return hits
}
describe("wiring", () => {
  it.each(["diagnostic", "baseline"] as const)("publishes and reads %s v6 snapshots through real consumers under synthetic capacity", async route => {
    const publisher = await import("./lib/v1-38-lean-baseline-source.js")
    const reuseIO = await import("./lib/v1-38-lean-baseline-reuse.js")
    const emitter = await import("../packages/strategy-lab/src/planner/emit.js")
    const a = allocation(6, route), fixture = await syntheticLedger(a, [])
    const snapshot = publisher.buildLeanBaselineSource({ role: "final-response", source: emitter.buildPlannerCandidate().source, coldRoot: a.coldRoot!, implementationRoot: a.sourceRoot })
    vi.spyOn(lean, "assertLeanPublicationCapacity").mockImplementation(() => {})
    vi.spyOn(lean, "readLeanChildEntry").mockReturnValue({ head: "a".repeat(40) } as never)
    const reuse = { grant: { root: a.reuseGrantRoot, coldRoot: a.coldRoot, seed: a.seed }, sources: [snapshot] } as never
    vi.spyOn(reuseIO, "validateLeanColdReuse").mockImplementation((value, sourceRoot) => { if (value !== reuse || sourceRoot !== a.sourceRoot) throw new Error("SYNTHETIC_REUSE"); return reuse })
    if (route === "baseline") publisher.publishLeanBaselineSource(fixture.ledger, snapshot)
    else publisher.publishLeanReusedBaselineSource(fixture.ledger, snapshot, reuse)
    expect(readFileSync(join(fixture.ledger.directory, "source-final-response.json"))).toEqual(Buffer.from(lean.leanCanonicalBytes(snapshot)))
    expect(publisher.readLeanBaselineSource(fixture.ledger.directory, snapshot.role, { allocation: a, head: "a".repeat(40) })).toEqual(snapshot)
    const authority = await import("./lib/v1-38-lean-experiment-authority.js")
    const factory = await import("../packages/strategy-lab/src/factory/admission.js")
    const spec = await import("@cowards/spec"), contracts = await import("../packages/strategy-lab/src/contracts.js")
    const revisionIO = await import("../packages/runtime-js/src/revision.js")
    const lifetime = await import("./lib/v1-38-league-prospective-lifetime.js")
    const slot = a.slots[0]!, chargeBody = { schemaVersion: "lean-slot-charge-v1" as const, allocationRoot: a.root, slotRoot: slot.root, ordinal: 0 }
    const charge = { ...chargeBody, root: labRoot(chargeBody.schemaVersion, chargeBody) }
    const pairBody = { schemaVersion: "lean-baseline-pair-v1", ordinal: 0, slotRoot: slot.root, requestRoot: slot.requestRoot, priorLedgerBytesRoot: lean.leanBytesRoot(Buffer.alloc(0)), priorLedgerByteLength: 0, priorCharged: a.predecessor.chargedMatches, bottomRole: snapshot.role, bottomSourceRoot: snapshot.sourceRoot, bottomSnapshotRoot: snapshot.root, topRole: snapshot.role, topSourceRoot: snapshot.sourceRoot, topSnapshotRoot: snapshot.root }
    writeFileSync(join(fixture.ledger.directory, "pair-0.json"), lean.leanCanonicalBytes({ ...pairBody, root: labRoot(pairBody.schemaVersion, pairBody) }), { mode: 0o600 })
    writeFileSync(join(fixture.ledger.directory, "ledger.ndjson"), Buffer.concat([lean.leanCanonicalBytes({ kind: "charge", charge }), Buffer.from("\n")]))
    const fs = await vi.importActual<typeof import("node:fs")>("node:fs")
    fs.chmodSync(join(fixture.ledger.directory, "ledger.ndjson"), 0o600)
    const admission = factory.authorizeFactorySupervision({ sourceAdmission: factory.admitFactory({ packet: snapshot.packet, proposal: snapshot.proposal, sourceBytes: Buffer.from(snapshot.source) }), validation: snapshot.validation })
    const defaults = spec.defaultRuntimeMetadata("typescript")
    const revision = revisionIO.buildStrategyRevision({ source: snapshot.source, runtime: { ...defaults, adapter: { ...defaults.adapter, id: "runtime-js-container-subprocess" } } })
    const engine = await import("../packages/engine/src/index.js")
    const correctedRuntime = lifetime.prospectiveLeagueRuntimeBinding(admission, { revisionId: revision.id, sourceRoot: snapshot.sourceRoot, executableRoot: `sha256:${revision.metadata.sourceArtifact!.hash}`, tupleId: engine.MATCH_KERNEL.tupleId, tupleRoot: contracts.LAB_ADMITTED_ROOTS.tupleRoot, runtimeLimitsRoot: contracts.LAB_ADMITTED_ROOTS.runtimeLimitsRoot, image: contracts.LAB_ADMITTED_ROOTS.image })
    const binding = { budgetRoot: a.root, attemptRoot: charge.root, matchId: `lean-${charge.root.slice(7, 31)}`, containerName: `lean-${charge.root.slice(7, 25)}-bottom`, ownershipLabel: `lean-${a.root.slice(7, 25)}`, seat: "bottom" as const, runtime: correctedRuntime }
    const token = authority.issueLeanCorrectionRuntimeAuthority(fixture.ledger, charge, snapshot, binding, reuse)
    expect(authority.leanStartupAuthorityDescriptorV5(token)).toMatchObject({ version: 6, allocationRoot: a.root, chargeRoot: charge.root, policyRoot: lean.LEAN_STARTUP_POLICY_V5.root })
    expect(() => authority.claimLeanRuntimeAuthority(token, binding, "planner")).toThrow()
    for (const layer of ["factory", "planner", "session"] as const) expect(authority.claimLeanRuntimeAuthority(token, binding, layer)).toMatchObject({ lifetimeMs: 600000, receiptMs: 5000, startup: { version: 6 } })
    expect(() => authority.claimLeanRuntimeAuthority(token, binding, "session")).toThrow()
    expect(() => publisher.readLeanBaselineSource(fixture.ledger.directory, snapshot.role, { allocation: a, head: "b".repeat(40) })).toThrow()
    const proof = publisher.leanBaselineSourcePublicationBindingV6(a, "b".repeat(40), snapshot.root, snapshot.sourceRoot)
    writeFileSync(join(fixture.ledger.directory, "publication-final-response-v6.json"), lean.leanCanonicalBytes(proof))
    expect(() => publisher.readLeanBaselineSource(fixture.ledger.directory, snapshot.role, { allocation: a, head: "a".repeat(40) })).toThrow()
  })
  it("keeps generic planner/factory constructors unable to acquire startup scalar authority", async () => {
    const factory = await import("./lib/v1-38-factory-supervised-runtime.js"), planner = await import("./lib/v1-38-planner-supervised-runtime.js")
    for (const constructor of [factory.createFactorySupervisedRuntime, planner.createPlannerSupervisedRuntime]) expect(() => constructor({ startupMs: 2500 } as never)).toThrow()
    expect(readFileSync("scripts/lib/v1-38-lean-baseline-pipeline.ts", "utf8")).toContain("freezeSource")
  })
  it("authenticates current v6 setup custody and charges every current-turn millisecond", async () => {
    const correction = await import("./run-v1-38-lean-correction.js")
    const body = { schemaVersion: "lean-replay-setup-witness-v6", approvalRoot: lean.LEAN_REPLAY_V6_APPROVAL_ROOT, supplementRoot: lean.LEAN_REPLAY_V6_SUPPLEMENT_ROOT, policyRoot: lean.LEAN_STARTUP_POLICY_V5.root, priorElapsedMs: lean.LEAN_REPLAY_V6_CARRY.priorElapsedMs, charged: 24, consumedTimeBytesRoot: lean.LEAN_REPLAY_V6_CARRY.timeBytesRoot, segments: [{ startMs: lean.LEAN_REPLAY_V6_CARRY.startedAtMs, closeMs: null }] }
    const witness = { ...body, root: labRoot(body.schemaVersion, body) }
    expect(correction.leanReplayCarryElapsedV6(witness, body.segments[0]!.startMs + 1234)).toBe(36_152_766)
    for (const key of ["approvalRoot", "supplementRoot", "policyRoot", "priorElapsedMs", "charged", "consumedTimeBytesRoot"] as const) {
      const mutated = { ...body, [key]: syntheticRoot("foreign") }
      expect(() => correction.validateLeanReplaySetupWitnessV6({ ...mutated, root: labRoot(body.schemaVersion, mutated) })).toThrow()
    }
  })
  it("joins a v6 reader to the conservative effective close, not raw rounded wall time", async () => {
    const retained = await import("./lib/v1-38-lean-correction-retained.js")
    const startBody = { schemaVersion: "lean-correction-supervisor-admission-v6", route: "diagnostic", mode: "run", parentPid: 1, wallStartMs: 1000, monotonicStartNs: "1000000" }
    const start = { ...startBody, root: labRoot(startBody.schemaVersion, startBody) }
    const allocationRoot = allocation(6).root
    const endBody = { schemaVersion: "lean-correction-supervisor-admission-close-v6", startRoot: start.root, route: "diagnostic", mode: "run", elapsedUpperBoundMs: 1, monotonicObservedNs: "1000001", wallObservedMs: 1000, allocationRoot, ledgerInterval: "correction-run-finalization", importedMs: 1, ledgerCloseMs: 1002 }
    const end = { ...endBody, root: labRoot(endBody.schemaVersion, endBody) }
    const time = { starts: new Map([["pilot-entry", 1000], ["correction-run-finalization", 1001], ["correction-supervisor-diagnostic-v6-verifier", 1003]]), closes: new Map([["pilot-entry", 1001], ["correction-run-finalization", 1002]]), closed: new Set(["pilot-entry", "correction-run-finalization"]) }
    expect(retained.validateLeanFreshSupervisorReaderGap(start, end, allocationRoot, "diagnostic", time, 1003, 6)).toEqual({ runCloseMs: 1002, readerStartMs: 1003, gapMs: 1 })
    expect(() => retained.validateLeanFreshSupervisorReaderGap(start, end, syntheticRoot("foreign"), "diagnostic", time, 1003, 6)).toThrow()
  })
  it("correlates v6 startup origin and publication identity without issuing a provider", async () => {
    const session = await import("./lib/v1-38-lean-container-match-session.js")
    const publisher = await import("./lib/v1-38-lean-baseline-source.js")
    const authority = await import("./lib/v1-38-lean-experiment-authority.js")
    const a = allocation(6)
    const binding = { allocationRoot: a.root, chargeRoot: syntheticRoot("charge"), seat: "bottom" as const, policyRoot: lean.LEAN_STARTUP_POLICY_V5.root, harnessRoot: lean.leanBytesRoot(Buffer.from(session.buildLeanStartupWorkerHarnessV5())), requestOrdinal: 1, requestRoot: syntheticRoot("request"), method: "selectActivations" as const, inputRoot: syntheticRoot("input"), sourceRoot: syntheticRoot("source"), executableRoot: syntheticRoot("executable") }
    const origin = { ...binding, schemaVersion: "v1.38-lean-startup-origin-v6", stage: "receipt", branch: "complete", ready: true, go: true, wait: "changed", termination: "not_required", unknown: false }
    expect(session.validateLeanPrivateCorrectionOrigin(origin)).toEqual(origin)
    expect(() => session.validateLeanStartupOriginV6(origin, { ...binding, allocationRoot: syntheticRoot("foreign") })).toThrow()
    expect(authority.leanStartupAuthorityDescriptorV5({} as never)).toBeUndefined()
    const proof = publisher.leanBaselineSourcePublicationBindingV6(a, "a".repeat(40), syntheticRoot("snapshot"), syntheticRoot("snapshot-source"))
    expect(proof).toMatchObject({ allocationRoot: a.root, sourceRoot: a.sourceRoot, route: "diagnostic", head: "a".repeat(40) })
    expect(() => publisher.leanBaselineSourcePublicationBindingV6({ ...a, sourceRoot: syntheticRoot("foreign") }, "a".repeat(40), syntheticRoot("snapshot"), syntheticRoot("snapshot-source"))).toThrow()
    expect(session.buildLeanContainerBrokerSourceV6().replaceAll("v1.38-lean-startup-origin-v6", "v1.38-lean-startup-origin-v5").replaceAll("v1.38-lean-startup-v6:", "v1.38-lean-startup-v5:")).toBe(session.buildLeanContainerBrokerSourceV5())
  })
  it("parses exact v6 commands, disallows old paths and binds v6 request intent", async () => {
    const correction = await import("./run-v1-38-lean-correction.js")
    for (const route of ["diagnostic", "baseline"] as const) for (const op of ["prepare", "run", "verify"]) {
      const p = lean.leanCorrectionRoutePaths(route, "v6")
      expect(correction.parseLeanCorrectionCommand([`${op}-supervisor-${route}-v6`, "--request", p.request])).toMatchObject({ supervisor: "v6", route })
      expect(() => correction.parseLeanCorrectionCommand([`${op}-supervisor-${route}-v6`, "--request", lean.leanCorrectionRoutePaths(route, "v5").request])).toThrow()
    }
    const input = { route: "diagnostic" as const, seed: "synthetic", sourceRoot: syntheticRoot("source"), coldRoot: syntheticRoot("cold"), planRoot: lean.LEAN_REPLAY_V6_SUPPLEMENT_ROOT }
    expect(correction.deriveLeanSupervisorCorrectionRequestRoots(input, lean.LEAN_REPLAY_V6_APPROVAL_ROOT, "v6")).not.toEqual(correction.deriveLeanSupervisorCorrectionRequestRoots(input, lean.LEAN_STARTUP_APPROVAL_ROOT, "v5"))
    expect(readFileSync("scripts/run-v1-38-lean-correction.sh", "utf8")).toContain("prepare-supervisor-diagnostic-v6")
  })
  it("isolates all v6 paths and keeps the exact finite zero-charge predecessor without a stopped predicate", () => {
    expect(lean.leanSupervisorVersion("v6")).toBe(6)
    for (const route of ["diagnostic", "baseline"] as const) {
      const p = lean.leanCorrectionRoutePaths(route, "v6")
      for (const version of [false, true, "v3", "v4", "v5"] as const) {
        const old = lean.leanCorrectionRoutePaths(route, version)
        for (const key of ["store", "request", "allocation", "check", "temp"] as const) expect(p[key]).not.toBe(old[key])
      }
      expect(lean.leanCapsForAllocation(allocation(6, route))).toEqual(lean.LEAN_SUPERVISOR_V5_CAPS)
    }
    const { allocationRoot, allocationBytesRoot, timeBytesRoot, terminalBytesRoot, charged, closedElapsedMs, readerCloseMs } = lean.LEAN_REPLAY_V6_CARRY
    const finite = { allocationRoot, allocationBytesRoot, timeBytesRoot, terminalBytesRoot, charged, closedElapsedMs, readerCloseMs, ledgerBytesRoot: lean.leanBytesRoot(new Uint8Array()), active: false }
    expect(() => lean.validateLeanReplayV6PredecessorCustody(finite)).not.toThrow()
    for (const key of Object.keys(finite)) expect(() => lean.validateLeanReplayV6PredecessorCustody({ ...finite, [key]: null })).toThrow()
    expect(() => lean.validateLeanReplayV6PredecessorCustody({ ...finite, stopped: true })).toThrow()
  })
  it.each(["diagnostic", "baseline"] as const)("actual strict v6 %s validates every selected replay without full text", async route => {
    const a = allocation(6, route)
    const terminals: SyntheticTerminal[] = route === "diagnostic" ? [{ ordinal: 0 }] : [...a.sampleSlotRoots.map(root => ({ ordinal: a.slots.find(slot => slot.root === root)!.ordinal })), { ordinal: a.slots.find(slot => !a.sampleSlotRoots.includes(slot.root))!.ordinal, failure: true }]
    const fixture = await syntheticLedger(a, terminals), fullText = observeFullReplayText(fixture.replayTexts)
    const evidence = lean.verifyLeanEvidence(fixture.ledger)
    expect(evidence).toEqual(fixture.expected)
    expect(fullText).toEqual([])
    expect(safety.inflates).toHaveLength(terminals.length)
    for (const text of fixture.replayTexts) for (const line of text.trimEnd().split("\n")) expect(safety.parsed.filter(p => p === line)).toHaveLength(1)
    if (route === "baseline") { expect(evidence.records.some(record => record.status === "system_failure")).toBe(true); expect(evidence.records.some(record => record.status === "unused")).toBe(true) }
  })
  it.each([0, 1, 2, 3, 4] as const)("default/legacy version %i keeps the decoder path and exact evidence output", async version => {
    const fixture = await syntheticLedger(allocation(version)), fullText = observeFullReplayText(fixture.replayTexts)
    expect(lean.verifyLeanEvidence(fixture.ledger)).toEqual(fixture.expected)
    expect(fullText).toEqual(fixture.replayTexts)
  })
  it.each(["caps", "approval", "supplement", "policy", "root", "slot", "extra"])("forged v6 %s fails full passed-allocation admission before replay", async kind => {
    const fixture = await syntheticLedger(allocation(6)), original = fixture.ledger.allocation
    const patches: Record<string, unknown> = { caps: { caps: lean.LEAN_CAPS }, approval: { supervisorDecisionRoot: syntheticRoot("foreign") }, supplement: { planRoot: syntheticRoot("foreign") }, policy: { startupPolicyRoot: syntheticRoot("foreign") }, root: { root: syntheticRoot("foreign") }, slot: { sampleSlotRoots: [] }, extra: { unrecognized: true } }
    const forged = { ...fixture.ledger, allocation: { ...original, ...patches[kind] as object } }
    expect(() => lean.verifyLeanEvidence(forged)).toThrow()
    expect(safety.inflates).toEqual([])
  })
  it.each(["lean-correction-supervisor-diagnostic-allocation-v7", "forged-v5", "lean-correction-supervisor-baseline-allocation-v5"])("retained unsupported/mislabeled schema %s refuses before replay", async schemaVersion => {
    const fixture = await syntheticLedger(allocation(6))
    writeFileSync(join(fixture.ledger.directory, "allocation.json"), lean.leanCanonicalBytes({ ...fixture.ledger.allocation, schemaVersion }))
    expect(() => lean.verifyLeanEvidence(fixture.ledger)).toThrow()
    expect(safety.inflates).toEqual([])
  })
  it("an unrecognized passed label never enables validation-only behavior", async () => {
    const fixture = await syntheticLedger(allocation(0)), hits = observeFullReplayText(fixture.replayTexts)
    const a = { ...fixture.ledger.allocation, schemaVersion: "forged-v5" } as unknown as typeof fixture.ledger.allocation
    expect(lean.verifyLeanEvidence({ ...fixture.ledger, allocation: a })).toEqual(fixture.expected)
    expect(hits).toEqual(fixture.replayTexts)
  })
  it.each(["diagnostic", "baseline"] as const)("real v6 %s reader rejects a fully rehashed malformed final frame", async route => {
    const replay = rawReplay('{"frame":"valid"}\n{\n', 2), fixture = await syntheticLedger(allocation(6, route), [{ ordinal: 0, replay }])
    expect(() => lean.verifyLeanEvidence(fixture.ledger)).toThrow("LEAN_EXPERIMENT_CANONICAL")
    expect(safety.parsed).toContain('{"frame":"valid"}'); expect(safety.parsed).toContain("{")
  })
  it("preserves missing sample/failure replay refusal and success nonselection", async () => {
    for (const terminal of [{ ordinal: 0, replay: null }, { ordinal: 1, failure: true, replay: null }]) {
      const fixture = await syntheticLedger(allocation(6, "baseline"), [terminal])
      expect(() => lean.verifyLeanEvidence(fixture.ledger)).toThrow("LEAN_EXPERIMENT_REPLAY_MISSING")
    }
    const a = allocation(6, "baseline"), ordinal = a.slots.find(slot => !a.sampleSlotRoots.includes(slot.root))!.ordinal
    const fixture = await syntheticLedger(a, [{ ordinal }])
    expect(lean.verifyLeanEvidence(fixture.ledger)).toEqual(fixture.expected)
    expect(safety.inflates).toEqual([])
  })
  it("preserves charged-without-terminal and unexpected unselected replay refusal", async () => {
    const a = allocation(6, "baseline"), ordinal = a.slots.find(slot => !a.sampleSlotRoots.includes(slot.root))!.ordinal
    const extra = await syntheticLedger(a, [{ ordinal, replay: rawReplay("1\n", 1) }])
    expect(() => lean.verifyLeanEvidence(extra.ledger)).toThrow("LEAN_EXPERIMENT_REPLAY_MISSING")
    const fixture = await syntheticLedger(allocation(6))
    const text = readFileSync(join(fixture.ledger.directory, "ledger.ndjson"), "utf8")
    writeFileSync(join(fixture.ledger.directory, "ledger.ndjson"), text.split("\n")[0] + "\n")
    expect(() => lean.verifyLeanEvidence(fixture.ledger)).toThrow("LEAN_EXPERIMENT_TERMINAL_MISSING")
    expect(safety.inflates).toEqual([])
  })
  it("refuses any historical/private file path rather than falling back", () => {
    expect(() => readFileSync(".strategy-lab/forbidden-real-replay.gz")).toThrow("SYNTHETIC_ONLY")
    expect(() => readFileSync(".planning/artifacts/forbidden-real-allocation.json")).toThrow("SYNTHETIC_ONLY")
  })
  it("structurally selects only exact v5 schemas after full admission", () => {
    const text = source(), reader = text.slice(text.indexOf("export const verifyLeanEvidence ="), text.indexOf("export interface LeanPilotMeasurement"))
    expect(reader).toContain('ledger.allocation.schemaVersion === "lean-correction-supervisor-diagnostic-allocation-v5"')
    expect(reader).toContain('ledger.allocation.schemaVersion === "lean-correction-supervisor-baseline-allocation-v5"')
    expect(reader).toContain('leanSupervisorAllocationMode(admitLeanAllocation(ledger.allocation)) === "v5"')
    expect(reader).toContain("validateLeanReplay(terminal.replay, bytes)")
    expect(reader).toContain("decodeLeanReplay(terminal.replay, bytes)")
    expect(reader.indexOf("admitLeanAllocation")).toBeLessThan(reader.indexOf("validateLeanReplay"))
  })
  it("denies child process and Worker creation by default", async () => {
    const child = await import("node:child_process"), worker = await import("node:worker_threads")
    for (const method of [child.spawn, child.spawnSync, child.fork, child.exec, child.execSync, child.execFile, child.execFileSync]) expect(() => (method as Function)("denied")).toThrow("SYNTHETIC_ONLY")
    expect(() => new worker.Worker("denied")).toThrow("SYNTHETIC_ONLY")
  })
})
