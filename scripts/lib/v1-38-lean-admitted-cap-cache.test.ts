/** Inert allocation metadata only: no stores, readers, provider or Match dispatch. */
import { describe, expect, it, vi } from "vitest"
import { execFileSync } from "node:child_process"
import { freezeLabValue, labRoot } from "../../packages/strategy-lab/src/contracts.js"
import * as lean from "../../packages/strategy-lab/src/league/lean-experiment.js"

const work = vi.hoisted(() => ({ hashes: 0, freezes: 0 }))
vi.mock("../../packages/strategy-lab/src/contracts.js", async original => {
  const actual = await original<typeof import("../../packages/strategy-lab/src/contracts.js")>()
  return {
    ...actual,
    labRoot: (...args: Parameters<typeof actual.labRoot>) => { work.hashes++; return actual.labRoot(...args) },
    freezeLabValue: <T>(value: T) => { work.freezes++; return actual.freezeLabValue(value) },
  }
})

const r = (label: string) => labRoot("inert-admitted-cap-cache-fixture", label)
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const counts = () => ({ ...work })
const deeplyFrozen = (value: unknown): boolean => value === null || typeof value !== "object" || Object.isFrozen(value) && Object.values(value).every(deeplyFrozen)
const fixtureInput = (version: 2 | 3 | 4 | 5 | 6 | 7 | 8, extended = false, route: "diagnostic" | "baseline" = "diagnostic") => {
  const floor = version === 8 ? extended ? lean.LEAN_RETRY_V8_TIMEBOX_EXTENSION.priorElapsedMs : lean.LEAN_RETRY_V8_CARRY.priorElapsedMs : version === 7 ? 41_943_494 : version === 6 ? 36_151_532 : version === 5 ? 26_634_447 : version === 4 ? 20_471_046 : version === 3 ? 10_888_046 : 5_282_046
  const charged = version === 8 ? 29 : version === 7 ? 28 : version === 6 ? 24 : version === 5 ? 23 : version === 4 ? 12 : 11
  const prior = { schemaVersion: "lean-correction-predecessor-v1" as const, chargedMatches: charged + (route === "baseline" ? 1 : 0), elapsedUpperBoundMs: floor, allocatedDiskBytes: 12_894_208, historicalPeakDiskBytes: "unknown" as const, historicalPeakRssBytes: "unknown" as const, historyRoot: r("history"), survivors: [{ identity: ".strategy-lab/inert-cache-fixture", allocatedBytes: 4096 }] }
  return {
    sourceRoot: r("source"), reviewRoot: r("review"), coldRoot: r("cold"),
    planRoot: version === 8 ? lean.LEAN_RETRY_V8_PLAN_ROOT : version === 7 ? lean.LEAN_REPLAY_V7_SUPPLEMENT_ROOT : version === 6 ? lean.LEAN_REPLAY_V6_SUPPLEMENT_ROOT : version === 5 ? lean.LEAN_STARTUP_SUPPLEMENT_ROOT : r("plan"),
    supervisorDecisionRoot: version === 8 ? lean.LEAN_RETRY_V8_APPROVAL_ROOT : version === 7 ? lean.LEAN_REPLAY_V7_APPROVAL_ROOT : version === 6 ? lean.LEAN_REPLAY_V6_APPROVAL_ROOT : version === 5 ? lean.LEAN_STARTUP_APPROVAL_ROOT : r("decision"),
    candidateRoots: [r("a"), r("b")], requestRoots: Array.from({ length: route === "baseline" ? 36 : 1 }, (_, i) => r(`request-${i}`)), seed: "inert-cache", route, reuseGrantRoot: r("reuse"), acceptedCheckRoot: route === "diagnostic" ? null : r("accepted"), requestBytesRoot: r("bytes"), dataReviewRoot: r("data"), setupAccountingRoot: r("setup"), predecessor: { ...prior, root: labRoot(prior.schemaVersion, prior) },
    ...(version >= 5 ? { startupPolicyRoot: lean.LEAN_STARTUP_POLICY_V5.root } : {}),
    ...(version === 8 ? { attemptOrdinal: 1 as const, priorClosureRoot: null, continuationRoot: null, acceptedReaderCloseRoot: route === "diagnostic" ? null : r("reader-close") } : {}),
    ...(extended ? { timeboxExtension: lean.LEAN_RETRY_V8_TIMEBOX_EXTENSION } : {}),
  }
}
const fixture = (extended = false, route: "diagnostic" | "baseline" = "diagnostic") => lean.createLeanSupervisorCorrectionAllocation(fixtureInput(8, extended, route), 8)

describe("identity-only admitted v8 cap reuse", () => {
  it("isolates inherited extension pollution and cannot poison a legacy cached cap", () => {
    const moduleUrl = new URL("../../packages/strategy-lab/src/league/lean-experiment.ts", import.meta.url).href
    const source = `
      import * as lean from ${JSON.stringify(moduleUrl)};
      const legacy = lean.createLeanSupervisorCorrectionAllocation(${JSON.stringify(fixtureInput(8))}, 8);
      const extended = lean.createLeanSupervisorCorrectionAllocation(${JSON.stringify(fixtureInput(8, true))}, 8);
      let admitted, during, extendedCap, cloneRefused = false;
      try {
        Object.defineProperty(Object.prototype, "timeboxExtension", { value: { elapsedMs: 72000000 }, configurable: true });
        admitted = lean.admitLeanAllocation(legacy);
        during = lean.leanCapsForAllocation(admitted).elapsedMs;
        extendedCap = lean.leanCapsForAllocation(lean.admitLeanAllocation(extended)).elapsedMs;
        try { lean.leanCapsForAllocation(JSON.parse(JSON.stringify(legacy))); }
        catch (error) { cloneRefused = error.message.includes("LEAN_EXPERIMENT_RETRY_TIMEBOX"); }
      } finally { delete Object.prototype.timeboxExtension; }
      console.log(JSON.stringify({ ownExtension: Object.hasOwn(admitted, "timeboxExtension"), during, after: lean.leanCapsForAllocation(admitted).elapsedMs, extendedCap, cloneRefused }));
    `
    const result = JSON.parse(execFileSync(process.execPath, ["--import", "tsx", "--input-type=module", "-e", source], { encoding: "utf8", timeout: 15_000 }))
    expect(result).toEqual({ ownExtension: false, during: 57_600_000, after: 57_600_000, extendedCap: 72_000_000, cloneRefused: true })
  })

  it("isolates sparse survivor arrays with mutable inherited numeric slots and keeps full admission", () => {
    const moduleUrl = new URL("../../packages/strategy-lab/src/league/lean-experiment.ts", import.meta.url).href
    const contractsUrl = new URL("../../packages/strategy-lab/src/contracts.ts", import.meta.url).href
    const source = `
      import * as lean from ${JSON.stringify(moduleUrl)};
      import { labRoot } from ${JSON.stringify(contractsUrl)};
      const input = ${JSON.stringify(fixtureInput(8, true))};
      const inherited = input.predecessor.survivors[0];
      const survivors = new Array(1);
      const oldIndex = Object.getOwnPropertyDescriptor(Array.prototype, "0");
      const oldLength = Object.getOwnPropertyDescriptor(Array.prototype, "length");
      let initialCap, ownIndex, arrayFrozen, inheritedFrozen, fullRefused = false, capRefused = false;
      try {
        Object.defineProperty(Array.prototype, "0", { value: inherited, writable: true, configurable: true });
        const { root: ignoredRoot, ...prior } = input.predecessor;
        const body = { ...prior, survivors };
        const allocation = lean.createLeanSupervisorCorrectionAllocation({ ...input, predecessor: { ...body, root: labRoot(body.schemaVersion, body) } }, 8);
        const admitted = lean.admitLeanAllocation(allocation);
        initialCap = lean.leanCapsForAllocation(admitted).elapsedMs;
        ownIndex = Object.hasOwn(admitted.predecessor.survivors, "0");
        arrayFrozen = Object.isFrozen(admitted.predecessor.survivors);
        inheritedFrozen = Object.isFrozen(inherited);
        inherited.allocatedBytes += 1;
        try { lean.admitLeanAllocation(admitted); }
        catch (error) { fullRefused = error.message.includes("LEAN_EXPERIMENT_RETRY_PREDECESSOR"); }
        try { lean.leanCapsForAllocation(admitted); }
        catch (error) { capRefused = error.message.includes("LEAN_EXPERIMENT_RETRY_PREDECESSOR"); }
      } finally {
        if (oldIndex) Object.defineProperty(Array.prototype, "0", oldIndex);
        else delete Array.prototype[0];
        Object.defineProperty(Array.prototype, "length", oldLength);
      }
      console.log(JSON.stringify({ initialCap, ownIndex, arrayFrozen, inheritedFrozen, fullRefused, capRefused }));
    `
    const result = JSON.parse(execFileSync(process.execPath, ["--import", "tsx", "--input-type=module", "-e", source], { encoding: "utf8", timeout: 15_000 }))
    expect(result).toEqual({ initialCap: 72_000_000, ownIndex: false, arrayFrozen: true, inheritedFrozen: false, fullRefused: true, capRefused: true })
  })

  it.each([false, true])("repeated admitted diagnostic reads skip reconstruction/hash/freeze (extended=%s)", extended => {
    const input = fixture(extended), admitted = lean.admitLeanAllocation(input)
    expect(admitted).not.toBe(input)
    expect(admitted).toEqual(input)
    expect(deeplyFrozen(admitted)).toBe(true)
    const before = counts()
    for (let i = 0; i < 12; i++) expect(lean.leanCapsForAllocation(admitted)).toBe(extended ? lean.LEAN_RETRY_V8_TIMEBOX_CAPS : lean.LEAN_REPLAY_V7_CAPS)
    expect(counts()).toEqual(before)
  })

  it.each([false, true])("repeated admitted baseline reads retain all resource caps and root (extended=%s)", extended => {
    const input = fixture(extended, "baseline"), admitted = lean.admitLeanAllocation(input)
    const bytes = lean.leanCanonicalBytes(admitted), before = counts()
    for (let i = 0; i < 4; i++) expect(lean.leanCapsForAllocation(admitted)).toEqual({ ...lean.LEAN_CAPS, elapsedMs: extended ? 72_000_000 : 57_600_000 })
    expect(counts()).toEqual(before)
    expect(lean.leanCanonicalBytes(admitted)).toEqual(bytes)
    expect(admitted.root).toBe(input.root)
    expect(deeplyFrozen(admitted)).toBe(true)
  })

  it("never caches the constructor's caller-supplied frozen object", () => {
    const input = fixture(), before = counts()
    lean.leanCapsForAllocation(input)
    const first = counts()
    lean.leanCapsForAllocation(input)
    expect(first.hashes).toBeGreaterThan(before.hashes)
    expect(first.freezes).toBeGreaterThan(before.freezes)
    expect(work.hashes).toBeGreaterThan(first.hashes)
    expect(work.freezes).toBeGreaterThan(first.freezes)
  })

  it.each(["mutable", "shallow-frozen", "deep-frozen"] as const)("a %s clone sharing the admitted root must be fully admitted each time", kind => {
    const admitted = lean.admitLeanAllocation(fixture(true)), copied = clone(admitted)
    const input = kind === "deep-frozen" ? freezeLabValue(copied) : kind === "shallow-frozen" ? Object.freeze(copied) : copied
    const before = counts()
    expect(lean.leanCapsForAllocation(input)).toBe(lean.LEAN_RETRY_V8_TIMEBOX_CAPS)
    const first = counts()
    expect(lean.leanCapsForAllocation(input)).toBe(lean.LEAN_RETRY_V8_TIMEBOX_CAPS)
    expect(first.hashes).toBeGreaterThan(before.hashes)
    expect(work.hashes).toBeGreaterThan(first.hashes)
    const separatelyAdmitted = lean.admitLeanAllocation(input), registered = counts()
    expect(separatelyAdmitted).not.toBe(input)
    expect(separatelyAdmitted).not.toBe(admitted)
    expect(lean.leanCapsForAllocation(separatelyAdmitted)).toBe(lean.LEAN_RETRY_V8_TIMEBOX_CAPS)
    expect(counts()).toEqual(registered)
  })

  it("mutable input edits and frozen counterfeits cannot poison or reuse a registered identity", () => {
    const admitted = lean.admitLeanAllocation(fixture(true)), mutable = clone(admitted)
    expect(lean.leanCapsForAllocation(mutable)).toBe(lean.LEAN_RETRY_V8_TIMEBOX_CAPS)
    for (const counterfeit of [
      { ...mutable, root: r("forged-root") },
      { ...mutable, extra: true },
      { ...mutable, caps: { ...mutable.caps, matches: 301 } },
      { ...mutable, slots: [{ ...mutable.slots[0]!, condition: 99 }] },
      { ...mutable, timeboxExtension: { ...lean.LEAN_RETRY_V8_TIMEBOX_EXTENSION, elapsedMs: 72_000_001 } },
      { ...mutable, timeboxExtension: undefined },
    ]) {
      expect(() => lean.leanCapsForAllocation(counterfeit)).toThrow()
      expect(() => lean.leanCapsForAllocation(freezeLabValue(counterfeit))).toThrow()
      expect(() => lean.admitLeanAllocation(counterfeit)).toThrow()
    }
    Object.assign(mutable, { caps: { ...mutable.caps, scratchBytes: 3_000_000_000 } })
    expect(() => lean.leanCapsForAllocation(mutable)).toThrow()
    const before = counts()
    expect(lean.leanCapsForAllocation(admitted)).toBe(lean.LEAN_RETRY_V8_TIMEBOX_CAPS)
    expect(counts()).toEqual(before)
    expect(() => Object.assign(admitted.slots[0]!, { condition: 99 })).toThrow(TypeError)
    if (!("predecessor" in admitted)) throw new Error("Expected admitted v8 predecessor")
    expect(() => Object.assign(admitted.predecessor.survivors[0]!, { allocatedBytes: 0 })).toThrow(TypeError)
  })

  it("explicit full admission still reconstructs even an already registered identity", () => {
    const admitted = lean.admitLeanAllocation(fixture()), before = counts()
    const again = lean.admitLeanAllocation(admitted)
    expect(again).not.toBe(admitted)
    expect(again).toEqual(admitted)
    expect(work.hashes).toBeGreaterThan(before.hashes)
    expect(work.freezes).toBeGreaterThan(before.freezes)
  })

  it.each([false, true])("frozen accessor-backed survivors cannot cache changing getter results (proxy=%s)", proxied => {
    const input = fixtureInput(8, true)
    let current = input.predecessor.survivors[0]!
    const array: typeof input.predecessor.survivors = []
    Object.defineProperty(array, "0", { enumerable: true, configurable: true, get: () => current })
    const survivors = proxied ? new Proxy(array, {}) : array
    const { root: _root, ...prior } = input.predecessor
    const predecessorBody = { ...prior, survivors }
    const allocation = lean.createLeanSupervisorCorrectionAllocation({ ...input, predecessor: { ...predecessorBody, root: labRoot(prior.schemaVersion, predecessorBody) } }, 8)
    const admitted = lean.admitLeanAllocation(allocation)
    expect(deeplyFrozen(admitted)).toBe(true)
    const before = counts()
    expect(lean.leanCapsForAllocation(admitted)).toBe(lean.LEAN_RETRY_V8_TIMEBOX_CAPS)
    const first = counts()
    current = { ...current, allocatedBytes: current.allocatedBytes + 1 }
    expect(() => lean.admitLeanAllocation(admitted)).toThrow()
    expect(() => lean.leanCapsForAllocation(admitted)).toThrow()
    expect(first.hashes).toBeGreaterThan(before.hashes)
  })

  it.each(["transparent-proxy", "custom-prototype", "nonenumerable-getter"] as const)("fully admitted %s survivor arrays remain outside cache eligibility", kind => {
    const input = fixtureInput(8, true)
    const array = [...input.predecessor.survivors]
    if (kind === "custom-prototype") Object.setPrototypeOf(array, Object.create(Array.prototype))
    if (kind === "nonenumerable-getter") Object.defineProperty(array, "hidden", { configurable: true, get: () => 1 })
    const survivors = kind === "transparent-proxy" ? new Proxy(array, {}) : array
    const { root: _root, ...prior } = input.predecessor
    const predecessorBody = { ...prior, survivors }
    const allocation = lean.createLeanSupervisorCorrectionAllocation({ ...input, predecessor: { ...predecessorBody, root: labRoot(prior.schemaVersion, predecessorBody) } }, 8)
    const admitted = lean.admitLeanAllocation(allocation), before = counts()
    expect(lean.leanCapsForAllocation(admitted)).toBe(lean.LEAN_RETRY_V8_TIMEBOX_CAPS)
    expect(work.hashes).toBeGreaterThan(before.hashes)
    expect(work.freezes).toBeGreaterThan(before.freezes)
    const first = counts()
    expect(lean.leanCapsForAllocation(admitted)).toBe(lean.LEAN_RETRY_V8_TIMEBOX_CAPS)
    expect(work.hashes).toBeGreaterThan(first.hashes)
  })

  it.each(["hidden-cycle", "symbol-cycle", "deep-hidden-graph", "large-hidden-graph"] as const)("%s conservatively skips caching without changing historical admission", kind => {
    const input = fixtureInput(8, true), survivors = [...input.predecessor.survivors]
    if (kind === "hidden-cycle" || kind === "symbol-cycle") Object.defineProperty(survivors, kind === "symbol-cycle" ? Symbol("cycle") : "hidden", { value: survivors })
    else {
      let hidden: unknown = null
      if (kind === "deep-hidden-graph") for (let i = 0; i < 10_000; i++) hidden = Object.freeze({ child: hidden })
      else hidden = Object.freeze(Array.from({ length: 5000 }, () => Object.freeze({ value: 1 })))
      Object.defineProperty(survivors, "hidden", { value: hidden })
    }
    const { root: _root, ...prior } = input.predecessor
    const predecessorBody = { ...prior, survivors }
    const allocation = lean.createLeanSupervisorCorrectionAllocation({ ...input, predecessor: { ...predecessorBody, root: labRoot(prior.schemaVersion, predecessorBody) } }, 8)
    const admitted = lean.admitLeanAllocation(allocation), before = counts()
    expect(lean.leanCapsForAllocation(admitted)).toBe(lean.LEAN_RETRY_V8_TIMEBOX_CAPS)
    expect(work.hashes).toBeGreaterThan(before.hashes)
    const first = counts()
    expect(lean.admitLeanAllocation(admitted)).toEqual(admitted)
    expect(lean.leanCapsForAllocation(admitted)).toBe(lean.LEAN_RETRY_V8_TIMEBOX_CAPS)
    expect(work.hashes).toBeGreaterThan(first.hashes)
  })

  it.each([2, 3, 4, 5, 6, 7] as const)("supervisor v%s keeps its historical cap and full admission behavior", version => {
    const input = lean.createLeanSupervisorCorrectionAllocation(fixtureInput(version), version), admitted = lean.admitLeanAllocation(input)
    const before = counts(), caps = version === 7 ? lean.LEAN_REPLAY_V7_CAPS : version >= 5 ? lean.LEAN_SUPERVISOR_V5_CAPS : lean.LEAN_CAPS
    expect(lean.leanCapsForAllocation(admitted)).toBe(caps)
    expect(work.hashes).toBeGreaterThan(before.hashes)
    expect(() => lean.leanCapsForAllocation({ ...admitted, caps: { ...caps, matches: 301 } })).toThrow()
  })

  it("original v1 allocation retains eight-hour full admission behavior", () => {
    const input = lean.createLeanAllocation({ sourceRoot: r("source"), reviewRoot: r("review"), candidateRoots: [r("a"), r("b")], seed: "inert-cache" })
    const admitted = lean.admitLeanAllocation(input), before = counts()
    expect(lean.leanCapsForAllocation(admitted)).toBe(lean.LEAN_CAPS)
    expect(work.hashes).toBeGreaterThan(before.hashes)
    expect(() => lean.leanCapsForAllocation({ ...admitted, caps: lean.LEAN_RETRY_V8_TIMEBOX_CAPS })).toThrow()
  })
})
