import { execFile, execFileSync } from "node:child_process"
import { cpSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { promisify } from "node:util"
import { fileURLToPath } from "node:url"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import {
  authenticateV138Plan136ProspectiveV7BatchForReview,
  buildV138Plan136ProspectiveV7ForReview,
  checkV138Plan136SourceOnlyForReview,
  rootV138Plan136CarrierForReview,
  rootV138Plan136PayloadForReview,
  shaV138Plan136PayloadForReview,
} from "./check-v1-38-plan-262-136-live-v13-custody-v7.js"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const OWNERS: string[] = []
let BASE: ReturnType<typeof buildV138Plan136ProspectiveV7ForReview>
const clone = <T>(value: T): T => structuredClone(value)
const owner = (): string => { const value = mkdtempSync(path.join(tmpdir(), "v138-plan136-test-")); OWNERS.push(value); return value }
afterAll(() => { for (const value of OWNERS) rmSync(value, { recursive: true, force: true }) })
beforeAll(() => { BASE = buildV138Plan136ProspectiveV7ForReview(ROOT) }, 240_000)

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
  for (const relative of [
    "node_modules", "packages/runtime-wasm-wasi/node_modules", "packages/test-utils/node_modules",
    "packages/map-configs/node_modules", "packages/runtime-python/node_modules",
    "packages/runtime-supervisor/node_modules", "packages/spec/node_modules", "packages/golden/node_modules",
    "packages/runtime-js/node_modules", "packages/persistence/node_modules", "packages/replay/node_modules",
    "packages/service/node_modules", "packages/engine/node_modules", "apps/runtime-service/node_modules",
    "apps/web/node_modules", "apps/worker/node_modules",
  ]) symlinkSync(path.join(ROOT, relative), path.join(destination, relative), "dir")
  return destination
}
const execFileAsync = promisify(execFile)
const freshProcess = async (root: string): Promise<string> => (await execFileAsync(process.execPath, [
  "--import", "tsx", path.join(ROOT, "scripts/check-v1-38-plan-262-136-live-v13-custody-v7.ts"),
  "--emit-prospective", root,
], { cwd: ROOT, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 })).stdout
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
    expect(BASE.payload.plan137Eligible).toBe(true)
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

  it("emits byte-identical prospective evidence from fresh processes and distinct roots", async () => {
    const left = cloneRepository(); const right = cloneRepository()
    const [first, second] = await Promise.all([freshProcess(left), freshProcess(right)])
    expect(second).toBe(first)
    const evidence = JSON.parse(first)
    expect(evidence.payload.observations).toHaveLength(6)
    scanPrivacy(evidence)
  }, 240_000)

  it("uses strict normalized repository-relative native-source identifiers", () => {
    for (const observation of BASE.payload.observations) {
      expect(observation.disposableLocalNativeSourcePaths).toEqual([
        "custody/native-sources/source.ts", "custody/native-sources/test.ts",
      ])
      for (const value of observation.disposableLocalNativeSourcePaths) {
        expect(path.posix.isAbsolute(value)).toBe(false)
        expect(value).not.toContain("\\")
        expect(value.split("/")).not.toContain("..")
      }
    }
    scanPrivacy(BASE)
  }, 240_000)

  it("rejects exhaustive schema, root, authority, counter, and link mutations in one fresh batch", () => {
    const hostile: unknown[] = []
    for (const section of ["payload", "carrier"] as const) {
      for (const key of Object.keys(BASE[section])) {
        const evidence = clone(BASE) as any; delete evidence[section][key]
        hostile.push(evidence)
      }
      const evidence = clone(BASE) as any; evidence[section].unexpected = false
      hostile.push(evidence)
    }
    const mutations: Array<(value: any) => void> = [
      (value) => { delete value.payload.counters.acceptedCells },
      (value) => { value.payload.counters.routeStartsConsumed = 1 },
      (value) => { delete value.payload.observations[0].mode },
      (value) => { value.payload.observations[0].disposableLocalNativeSourcePaths[0] = "/tmp/source.ts" },
      (value) => { value.payload.observations[0].disposableLocalNativeSourcePaths[0] = "../source.ts" },
      (value) => { value.payload.observations[0].disposableLocalGitObjectRoot = `sha256:${"1".repeat(64)}` },
      (value) => { value.payload.observations[0].disposableLocalNativeSourcesRoot = `sha256:${"2".repeat(64)}` },
      (value) => { value.payload.observations[0].disposableLocalExecutionClosureRoot = `sha256:${"3".repeat(64)}` },
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
      const evidence = clone(BASE) as any; mutate(evidence); repairPayload(evidence); repairCarrier(evidence)
      hostile.push(evidence)
    }
    const contradictory = clone(BASE) as any
    contradictory.carrier.authorizesExecution = true; repairCarrier(contradictory)
    hostile.push(contradictory)
    const results = authenticateV138Plan136ProspectiveV7BatchForReview([BASE, ...hostile], ROOT)
    expect(results[0]).toEqual({ accepted: true })
    scanPrivacy(results[0])
    expect(results.slice(1).every((result) => !result.accepted && /V138_PLAN136_/u.test(result.code ?? "")))
      .toBe(true)
    expect(results.at(-1)?.code).toBe("V138_PLAN136_CARRIER_SEMANTICS_INVALID")
  }, 240_000)
})
