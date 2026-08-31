import { describe, expect, it } from "vitest"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { readFileSync } from "node:fs"
import {
  inspectV138Plan143Source, inspectV138Plan143Runtime, checkV138Plan143Absence,
  validateV138Plan143Execution, buildV138Plan143Review, authenticateV138Plan143Batch,
  inspectV138Plan143CurrentSource, inspectV138Plan143ProducerBoundary,
  validateV138Plan143EffectValues, V138_PLAN143_EFFECTS,
  validateV138Plan143PublishedContract,
} from "./check-v1-38-plan-262-143-live-v13-custody-review-v10.js"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
describe("Plan143 independently authored custody reviewer", () => {
  it("independently authenticates exact closed Plan142 custody", () => {
    const value = inspectV138Plan143Source(ROOT)
    expect(value.sourceCommit).toBe("61c8ff9e8a28cb51c07d8aa1cacc9524cc83f7f3")
    expect(value.trackingCommit).toBe("7edcac4f5977ea8f006b1369536414c8006e64bd")
    expect(value.plan110Eligible).toBe(false)
  })
  it("independently discovers and pins every semantic runtime implementation byte", () => {
    const value = inspectV138Plan143Runtime(ROOT)
    expect(value.entries).toHaveLength(3931)
    expect(value.semanticRuntimeRoot).toBe("sha256:132282ee554dc0f2ade43cf4917c3049abab6eb64991be6d7daed0776b67754e")
  })
  it("requires descriptor-bound absence of all eleven destinations", () => {
    expect(checkV138Plan143Absence(ROOT)).toBe(true)
  })
  it("never treats fabricated execution or empty batch as evidence", () => {
    expect(() => validateV138Plan143Execution({}, "sha256:" + "0".repeat(64), "sha256:" + "0".repeat(64))).toThrow()
    expect(() => authenticateV138Plan143Batch([], ROOT)).toThrow()
    expect(typeof buildV138Plan143Review).toBe("function")
  })
})

describe("current subject and closed producer boundary", () => {
  it("pins closed144 separately from retained142", () => {
    const current = inspectV138Plan143CurrentSource(ROOT)
    expect(current.consumerSubject.commit).toBe("80936682ec7f1d63f2ea5dfdd87c99ccb97966b7")
    expect(current.consumerSubject.repositoryClosureRoot).toBe("sha256:25d8387b7fc87923c584dc85f6bc4f4856f65e2a76086eb2a615e127229335a8")
    expect(current.historical142.sourceCommit).toBe("61c8ff9e8a28cb51c07d8aa1cacc9524cc83f7f3")
    expect(current.plan110Eligible).toBe(false)
  })
  it("derives the unchanged exact producer guard without importing subject code", () => {
    const source = readFileSync(path.join(ROOT, "scripts/run-v1-38-bounded-retry-envelope-v3-live-v14.ts"), "utf8")
    const guard = inspectV138Plan143ProducerBoundary(source)
    expect(guard.guardTransformRoot).toBe("sha256:b95b2684fbb275039a6325a3c816af05d91bd0c7f24ae557f7d0eac71338ffcd")
    expect(guard.transformedSourceSha256).toBe("sha256:dec762cd839e482ddfd1cdf89de304857e4117d14f09851109d6ee30c20bb154")
    expect(() => inspectV138Plan143ProducerBoundary(source + "\nrunV138V3ProductionLive('bad')")).toThrow()
    expect(() => inspectV138Plan143ProducerBoundary(source.replace("await runV138V3ProductionLive(root", "await Reflect.apply(runV138V3ProductionLive, null, [root"))).toThrow()
  })
})

describe("pure predicate and stage predicate", () => {
  const empty = () => ({ stage: "pre", journalPresent: false, privateDirectoryPresent: false,
    terminalPresent: false, lockPresent: false, reproductionPresent: false, downstreamPresent: Array(6).fill(false), outcome: null })
  it("uses the actual eleven destinations and six denied downstream paths", () => {
    expect(V138_PLAN143_EFFECTS).toHaveLength(11)
    expect(V138_PLAN143_EFFECTS[5]).toBe(".planning/artifacts/v1.38-plan-262-historical-live-receipt-manifest-v3.json")
    expect(validateV138Plan143EffectValues(empty())).toBe(true)
    for (const field of ["journalPresent", "privateDirectoryPresent", "terminalPresent", "lockPresent", "reproductionPresent"]) {
      expect(() => validateV138Plan143EffectValues({ ...empty(), [field]: true })).toThrow()
    }
    for (let i = 0; i < 6; i++) {
      const v = empty(); v.downstreamPresent[i] = true
      expect(() => validateV138Plan143EffectValues(v)).toThrow()
    }
  })
  it("permits only complete branch-valid post values without invoking a producer", () => {
    const v = { ...empty(), stage: "post", journalPresent: true, privateDirectoryPresent: true, terminalPresent: true,
      outcome: { disposition: "exhausted", journalRoot: "sha256:" + "1".repeat(64), stateRoot: "sha256:" + "2".repeat(64),
        completeCleanup: true, reproductionPresent: false, downstreamAuthority: "denied" } }
    expect(validateV138Plan143EffectValues(v)).toBe(true)
    for (const changes of [{ lockPresent: true }, { terminalPresent: false }, { reproductionPresent: true },
      { outcome: { ...v.outcome, completeCleanup: false } }, { outcome: { ...v.outcome, disposition: "active" } }]) {
      expect(() => validateV138Plan143EffectValues({ ...v, ...changes })).toThrow()
    }
    const success = { ...v, reproductionPresent: true, outcome: { ...v.outcome, disposition: "succeeded", reproductionPresent: true } }
    expect(validateV138Plan143EffectValues(success)).toBe(true)
    expect(() => validateV138Plan143EffectValues({ ...success, reproductionPresent: false })).toThrow()
  })
  it("rejects fabricated publications and accessor-bearing input before any effects", () => {
    expect(() => validateV138Plan143PublishedContract({})).toThrow()
    let touched = false
    const input = Object.defineProperty({}, "payload", { enumerable: true, get() { touched = true; return {} } })
    expect(() => validateV138Plan143PublishedContract(input)).toThrow()
    expect(touched).toBe(false)
  })
})
