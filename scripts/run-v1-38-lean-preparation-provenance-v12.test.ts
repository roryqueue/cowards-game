import { createHash } from "node:crypto"
import { constants, readFileSync } from "node:fs"
import { join, resolve } from "node:path"
import ts from "typescript"
import { describe, expect, it } from "vitest"

// HOST-only: execute exact trusted repository declarations, never Strategy code.
// Every effect dependency is closed-world synthetic; no production route is read.
const source = readFileSync(new URL("./run-v1-38-lean-correction.ts", import.meta.url), "utf8")
const ast = ts.createSourceFile("correction.ts", source, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS)
const names = ["trustedGuardCodes", "trustedGuardErrors", "leanCorrectionTrustedGuardError", "fail", "publishLeanCorrection", "prepareLeanCorrection"]
const statements = names.map(name => {
  const matches = ast.statements.filter(node => ts.isVariableStatement(node) && node.declarationList.declarations.some(d => ts.isIdentifier(d.name) && d.name.text === name))
  if (matches.length !== 1) throw new Error("HOST_DECLARATION_NOT_UNIQUE")
  return matches[0]!.getText(ast)
})
const compiled = ts.transpileModule(statements.join("\n"), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText
const stages = ["scope", "destination", "request", "predecessor", "allocation", "time_admission", "ledger", "allocation_publication"] as const
type Stage = typeof stages[number]
const sidecarName = "preparation-failure-v12.json"
const hash = (schema: string, value: unknown) => `sha256:${createHash("sha256").update(schema).update(JSON.stringify(value)).digest("hex")}`

function host(mode: string | boolean = "v12-1", route = "diagnostic") {
  const directory = `/synthetic/private/${String(mode)}/${route}`
  const paths = { temp: directory, store: `${directory}/store`, allocation: `${directory}/allocation.json` }
  const events: string[] = [], files = new Map<string, string>(), descriptors = new Map<number, string>()
  const opens: { path: string; flags: number; mode: number | undefined }[] = []
  const allocation = { root: hash("synthetic-allocation", route), slots: [{}] }, ledger = { allocation }
  const carrier = { root: hash("synthetic-admission", { mode, route }), route, mode: "prepare", directory, wallStartMs: 100, monotonicStartNs: "1000000" }
  let failingStage: Stage | undefined, refusal: unknown, publicationFailure: unknown, nextFd = 1, dispatches = 0
  let closedLedger: unknown = undefined, custody: unknown = undefined, capacityCalls = 0
  const step = (stage: Stage) => { if (events.at(-1) !== stage) events.push(stage); if (stage === failingStage) throw refusal }
  const predecessor = { elapsedUpperBoundMs: 10 }
  const request = { sourceRoot: "source", reviewRoot: "review", coldRoot: "cold", planRoot: "plan", candidateRoots: [], requestRoots: [], seed: "synthetic" }
  const dependencies = {
    constants, join, resolve, labRoot: hash,
    leanCanonicalBytes: (value: unknown) => Buffer.from(JSON.stringify(value)),
    leanBytesRoot: (bytes: Uint8Array) => hash("synthetic-bytes", Array.from(bytes)),
    assertLeanPublicationCapacity: (actualLedger: unknown) => { expect(actualLedger).toBe(ledger); capacityCalls++ },
    openSync: (path: string, flags: number, permissions?: number) => {
      opens.push({ path, flags, mode: permissions })
      if (flags & constants.O_CREAT) {
        if (path.endsWith(sidecarName) && publicationFailure !== undefined) throw publicationFailure
        if (files.has(path) && flags & constants.O_EXCL) throw new Error("SYNTHETIC_DUPLICATE")
        files.set(path, "")
      }
      const fd = nextFd++; descriptors.set(fd, path); return fd
    },
    writeLeanAll: (fd: number, bytes: Uint8Array) => { files.set(descriptors.get(fd)!, Buffer.from(bytes).toString("utf8")) },
    fsyncSync: (_fd: number) => {}, closeSync: (fd: number) => { descriptors.delete(fd) },
    leanCorrectionRoutePaths: () => paths,
    processAdmissionClock: () => ({ wallStartMs: 100, monotonicStartNs: "1000000" }),
    admissionClock: () => ({ wallStartMs: 101, monotonicStartNs: "2000000" }),
    beginLeanCorrectionAdmission: (actualRoute: string, admissionMode: string, actualDirectory: string, _clock: unknown, actualMode: unknown) => {
      expect([actualRoute, admissionMode, actualDirectory, actualMode]).toEqual([route, "prepare", directory, mode])
      events.push("admission"); return carrier
    },
    scope: () => step("scope"),
    existsSync: () => { step("destination"); return false },
    readLeanCorrectionRequest: () => { step("request"); return { request, reuse: { grant: { root: "reuse" } } } },
    inspectLeanSupervisorCorrectionPredecessor: () => { step("predecessor"); return predecessor },
    inspectLeanCorrectionPredecessor: () => { step("predecessor"); return predecessor },
    createLeanSupervisorCorrectionAllocation: () => { step("allocation"); return allocation },
    createLeanCorrectionAllocation: () => { step("allocation"); return allocation },
    assertLeanCorrectionAdmissionTime: () => step("time_admission"),
    createLeanLedger: () => { step("ledger"); return ledger },
    closeLeanCorrectionAdmission: (actualCarrier: unknown, actualLedger: unknown) => {
      expect(actualCarrier).toBe(carrier); closedLedger = actualLedger; events.push("close")
    },
    publishLeanRetryAdmissionFailureV8: (...args: unknown[]) => { custody = args; events.push("custody") },
    isLeanSupervisorRetestMode: (v: unknown) => v === "v12-1",
    isLeanRetryMode: (v: unknown) => typeof v === "string" && /^v(?:[89]-[123]|10-1|11-[12]|12-1)$/u.test(v),
    isLeanTwoPairMode: (v: unknown) => v === "v11-1" || v === "v11-2",
    isLeanTwentySixMode: (v: unknown) => v === "v10-1",
    leanRetryOrdinal: () => 1, leanSupervisorVersion: () => 8,
    twentySixReportSnapshots: new Map([[predecessor, []]]),
    runLeanBoundedParent: () => { dispatches++; throw new Error("HOST_DISPATCH_FORBIDDEN") },
  }
  // Refuse allocation publication in the actual publisher's effect boundary.
  const originalOpen = dependencies.openSync
  dependencies.openSync = (path, flags, permissions) => {
    if (path === paths.allocation && flags & constants.O_CREAT) step("allocation_publication")
    return originalOpen(path, flags, permissions)
  }
  const exports: Record<string, any> = {}
  new Function(...Object.keys(dependencies), "exports", compiled)(...Object.values(dependencies), exports)
  const sidecarPath = join(directory, sidecarName)
  return {
    events, files, opens, carrier, ledger, sidecarPath,
    trusted: (code = "LEAN_CORRECTION_WRITABLE_SCOPE") => exports.leanCorrectionTrustedGuardError(code) as Error,
    refuse: (stage: Stage, error: unknown) => { failingStage = stage; refusal = error },
    failPublication: (error: unknown) => { publicationFailure = error },
    prepare: () => exports.prepareLeanCorrection("/synthetic/request.json", route, mode),
    receipt: () => { const bytes = files.get(sidecarPath); expect(bytes).toBeDefined(); return JSON.parse(bytes!) as Record<string, unknown> },
    observation: () => ({ closedLedger, custody, dispatches, capacityCalls, openDescriptors: descriptors.size }),
  }
}

function originalRefusal(h: ReturnType<typeof host>, error: unknown) {
  let caught: unknown
  try { h.prepare() } catch (value) { caught = value }
  expect(caught).toBe(error)
  expect(h.observation()).toMatchObject({ dispatches: 0, openDescriptors: 0, custody: ["v12-1", "prepare", false, null, h.carrier.route] })
  expect(h.events.slice(-2)).toEqual(["close", "custody"])
}

describe("prospective v12 actual preparation failure provenance (synthetic HOST only)", () => {
  it.each(stages)("attributes trusted and unknown refusal at %s without dispatch", stage => {
    for (const trusted of [true, false]) {
      const h = host(), error = trusted ? h.trusted() : new Error("LEAN_CORRECTION_WRITABLE_SCOPE raw payload /private/path")
      h.refuse(stage, error); originalRefusal(h, error)
      const receipt = h.receipt(), { root, ...body } = receipt
      expect(body).toEqual({ schemaVersion: "lean-correction-preparation-failure-v12", issued: false, authorizing: false, startRoot: h.carrier.root, admissionMode: "prepare", supervisorMode: "v12-1", route: "diagnostic", stage, guardCode: trusted ? "LEAN_CORRECTION_WRITABLE_SCOPE" : "unknown" })
      expect(root).toBe(hash(String(body.schemaVersion), body))
      expect(JSON.stringify(receipt)).not.toMatch(/raw payload|private\/path|message|stack|stdio/)
      expect(h.observation().closedLedger).toBe(stage === "allocation_publication" ? h.ledger : null)
      const expected = ["admission", ...stages.slice(0, stages.indexOf(stage) + 1), "close", "custody"]
      expect(h.events).toEqual(expected)
      const opening = h.opens.find(value => value.path === h.sidecarPath)!
      expect(opening.flags & (constants.O_EXCL | constants.O_NOFOLLOW)).toBe(constants.O_EXCL | constants.O_NOFOLLOW)
      expect(opening.mode).toBe(0o600)
      expect(h.observation().capacityCalls).toBe(stage === "allocation_publication" ? 2 : 0)
    }
  })

  it("binds baseline admission and ignores message, getters, proxies, primitives and lookalikes", () => {
    const hostile = new Proxy({}, { get: () => { throw new Error("HOST_ERROR_MUST_NOT_BE_INSPECTED") }, getOwnPropertyDescriptor: () => { throw new Error("HOST_ERROR_MUST_NOT_BE_INSPECTED") } })
    for (const error of [hostile, null, undefined, "LEAN_CORRECTION_WRITABLE_SCOPE", { message: "LEAN_CORRECTION_WRITABLE_SCOPE", code: "LEAN_CORRECTION_WRITABLE_SCOPE" }]) {
      const h = host("v12-1", "baseline"); h.refuse("request", error); originalRefusal(h, error)
      expect(h.receipt()).toMatchObject({ route: "baseline", startRoot: h.carrier.root, guardCode: "unknown" })
    }
    const h = host(), trusted = h.trusted(); trusted.message = "not inspected"
    h.refuse("scope", trusted); originalRefusal(h, trusted)
    expect(h.receipt().guardCode).toBe("LEAN_CORRECTION_WRITABLE_SCOPE")
    const unlisted = host(), error = unlisted.trusted("UNREGISTERED_PRIVATE_DETAIL")
    unlisted.refuse("scope", error); originalRefusal(unlisted, error)
    expect(unlisted.receipt().guardCode).toBe("unknown")
  })

  it.each(["duplicate", "arbitrary"])("does not mask refusal or custody on %s sidecar publication failure", kind => {
    for (const stage of ["scope", "allocation_publication"] as const) {
      const h = host(), error = h.trusted()
      if (kind === "duplicate") h.files.set(h.sidecarPath, "immutable prior synthetic bytes")
      else h.failPublication(new Error("SYNTHETIC_PUBLICATION_FAILURE"))
      h.refuse(stage, error); originalRefusal(h, error)
      expect(h.files.get(h.sidecarPath)).toBe(kind === "duplicate" ? "immutable prior synthetic bytes" : undefined)
      expect(h.observation().closedLedger).toBe(stage === "allocation_publication" ? h.ledger : null)
    }
  })

  it("has no success sidecar and leaves legacy success/refusal behavior unchanged", () => {
    for (const mode of ["v12-1", false, true, "v3", "v4", "v5", "v6", "v7", "v8-1", "v9-1", "v10-1", "v11-1", "v11-2"]) {
      const successful = host(mode)
      expect(successful.prepare()).toEqual({ issued: false, evidenceClass: "preparation_only", route: "diagnostic", allocationRoot: successful.ledger.allocation.root, plannedCells: 1, charged: 0 })
      expect(successful.files.has(successful.sidecarPath)).toBe(false)
      expect(successful.observation()).toMatchObject({ closedLedger: successful.ledger, custody: undefined, dispatches: 0 })
      if (mode === "v12-1") continue
      const refused = host(mode), error = refused.trusted(); refused.refuse("scope", error)
      expect(() => refused.prepare()).toThrow(error)
      expect(refused.files.has(refused.sidecarPath)).toBe(false)
      expect(refused.observation()).toMatchObject({ closedLedger: null, dispatches: 0 })
    }
  })
})
