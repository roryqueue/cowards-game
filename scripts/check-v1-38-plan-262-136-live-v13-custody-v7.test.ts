import { execFileSync } from "node:child_process"
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { afterAll, describe, expect, it } from "vitest"
import {
  authenticateV138Plan136ProspectiveV7ForReview,
  buildV138Plan136ProspectiveV7ForReview,
  checkV138Plan136SourceOnlyForReview,
  rootV138Plan136CarrierForReview,
  rootV138Plan136PayloadForReview,
  shaV138Plan136PayloadForReview,
} from "./check-v1-38-plan-262-136-live-v13-custody-v7.js"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const OWNERS: string[] = []
const clone = <T>(value: T): T => structuredClone(value)
const owner = (): string => { const value = mkdtempSync(path.join(tmpdir(), "v138-plan136-test-")); OWNERS.push(value); return value }
afterAll(() => { for (const value of OWNERS) rmSync(value, { recursive: true, force: true }) })

const repairPayload = (evidence: any): void => {
  evidence.payload.payloadRoot = rootV138Plan136PayloadForReview(evidence.payload)
  evidence.carrier.payloadRoot = evidence.payload.payloadRoot
  evidence.carrier.payloadSha256 = shaV138Plan136PayloadForReview(evidence.payload)
  evidence.carrier.carrierRoot = rootV138Plan136CarrierForReview(evidence.carrier)
}
const repairCarrier = (evidence: any): void => {
  evidence.carrier.carrierRoot = rootV138Plan136CarrierForReview(evidence.carrier)
}
const cloneRepository = (): string => {
  const destination = path.join(owner(), "checkout")
  execFileSync("git", ["clone", "--quiet", "--no-local", ROOT, destination])
  return destination
}
const freshProcess = (root: string): string => execFileSync(process.execPath, [
  "--import", "tsx", path.join(ROOT, "scripts/check-v1-38-plan-262-136-live-v13-custody-v7.ts"),
  "--emit-prospective", root,
], { cwd: ROOT, encoding: "utf8" })
const scanPrivacy = (value: unknown): void => {
  const serialized = JSON.stringify(value)
  expect(serialized).not.toContain(tmpdir())
  expect(serialized).not.toContain(ROOT)
  expect(serialized).not.toMatch(/file:\/\//u)
  expect(serialized).not.toMatch(/[A-Za-z]:[\\/]/u)
  expect(serialized).not.toMatch(/\\\\[^\\]+\\[^\\]+/u)
  expect(serialized).not.toMatch(/(^|["/\\])\.\.([/\\"]|$)/u)
  expect(serialized).not.toMatch(/"\/(?:Users|home|private|tmp|var)\//u)
}

describe("Plan 262-136 source-only custody correction v7", () => {
  it("reauthenticates every supplied root after a successful call", () => {
    expect(checkV138Plan136SourceOnlyForReview(ROOT).plan137Eligible).toBe(true)
    expect(() => checkV138Plan136SourceOnlyForReview(path.join(owner(), "missing")))
      .toThrow(/V138_PLAN136_/u)
    const second = cloneRepository()
    expect(checkV138Plan136SourceOnlyForReview(second).plan137Eligible).toBe(true)
    const protectedPath = path.join(second, "scripts/check-v1-38-plan-262-133-live-v13-custody-review-v5.ts")
    writeFileSync(protectedPath, `${readFileSync(protectedPath, "utf8")}\n`)
    expect(() => checkV138Plan136SourceOnlyForReview(second)).toThrow(/V138_PLAN136_/u)
  }, 240_000)

  it("rejects a forbidden destination materialized after a successful call", () => {
    const second = cloneRepository()
    expect(checkV138Plan136SourceOnlyForReview(second).plan137Eligible).toBe(true)
    const effect = path.join(second, ".planning/artifacts/v1.38-current-matrix-reproduction-v17.json")
    cpSync(path.join(second, "package.json"), effect)
    expect(() => checkV138Plan136SourceOnlyForReview(second))
      .toThrow("V138_PLAN136_EFFECT_PRESENT:.planning/artifacts/v1.38-current-matrix-reproduction-v17.json")
  }, 240_000)

  it("emits byte-identical prospective evidence from fresh processes and distinct roots", () => {
    const left = cloneRepository(); const right = cloneRepository()
    const first = freshProcess(left); const second = freshProcess(right)
    expect(second).toBe(first)
    const evidence = JSON.parse(first)
    expect(evidence.payload.observations).toHaveLength(6)
    scanPrivacy(evidence)
  }, 240_000)

  it("uses strict normalized repository-relative native-source identifiers", () => {
    const base = buildV138Plan136ProspectiveV7ForReview(ROOT)
    for (const observation of base.payload.observations) {
      expect(observation.disposableLocalNativeSourcePaths).toEqual([
        "custody/native-sources/source.ts", "custody/native-sources/test.ts",
      ])
      for (const value of observation.disposableLocalNativeSourcePaths) {
        expect(path.posix.isAbsolute(value)).toBe(false)
        expect(value).not.toContain("\\")
        expect(value.split("/")).not.toContain("..")
      }
    }
    scanPrivacy(base)
    scanPrivacy(authenticateV138Plan136ProspectiveV7ForReview(base))
  }, 240_000)

  it("rejects every missing or extra payload and carrier key", () => {
    const base = buildV138Plan136ProspectiveV7ForReview(ROOT)
    for (const section of ["payload", "carrier"] as const) {
      for (const key of Object.keys(base[section])) {
        const evidence = clone(base) as any; delete evidence[section][key]
        expect(() => authenticateV138Plan136ProspectiveV7ForReview(evidence)).toThrow(/V138_PLAN136_/u)
      }
      const evidence = clone(base) as any; evidence[section].unexpected = false
      expect(() => authenticateV138Plan136ProspectiveV7ForReview(evidence)).toThrow(/V138_PLAN136_/u)
    }
  }, 240_000)

  it("rejects nested schema, root, authority, counter, and link mutations", () => {
    const base = buildV138Plan136ProspectiveV7ForReview(ROOT)
    const mutations: Array<(value: any) => void> = [
      (value) => { delete value.payload.counters.acceptedCells },
      (value) => { value.payload.counters.routeStartsConsumed = 1 },
      (value) => { delete value.payload.observations[0].mode },
      (value) => { value.payload.observations[0].disposableLocalNativeSourcePaths[0] = "/tmp/source.ts" },
      (value) => { value.payload.observations[0].disposableLocalNativeSourcePaths[0] = "../source.ts" },
      (value) => { value.payload.observations[0].mode = "--check-live" },
      (value) => { value.payload.authorizesExecution = true },
      (value) => { value.payload.plan110Eligible = true },
      (value) => { value.payload.plan137Eligible = false },
      (value) => { value.payload.freshAccepted = 540 },
      (value) => { value.payload.subjectCommit = "0".repeat(40) },
      (value) => { value.payload.v5PayloadRoot = `sha256:${"0".repeat(64)}` },
      (value) => { value.carrier.authorizesExecution = true },
      (value) => { value.carrier.plan110Eligible = true },
      (value) => { value.carrier.payloadMode = "100755" },
      (value) => { value.carrier.reviewSha256 = `sha256:${"0".repeat(64)}` },
    ]
    for (const mutate of mutations) {
      const evidence = clone(base) as any; mutate(evidence); repairPayload(evidence); repairCarrier(evidence)
      expect(() => authenticateV138Plan136ProspectiveV7ForReview(evidence)).toThrow(/V138_PLAN136_/u)
    }
  }, 240_000)

  it("does not return sanitized values for contradictory authenticated bytes", () => {
    const base = buildV138Plan136ProspectiveV7ForReview(ROOT) as any
    base.carrier.authorizesExecution = true; repairCarrier(base)
    expect(() => authenticateV138Plan136ProspectiveV7ForReview(base))
      .toThrow("V138_PLAN136_CARRIER_SEMANTICS_INVALID")
  }, 240_000)
})
