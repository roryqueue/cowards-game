import { execFile, execFileSync } from "node:child_process"
import { chmodSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { promisify } from "node:util"
import { fileURLToPath } from "node:url"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import {
  authenticateV138Plan140ProspectiveV9BatchForReview,
  buildV138Plan140ProspectiveV9ForReview,
  checkV138Plan140EffectPathsAbsentForReview,
  checkV138Plan140SourceOnlyForReview,
  computeV138Plan140StableRecordRootForReview,
  V138_PLAN140_EFFECT_PATHS,
  V138_PLAN140_EXECUTOR,
  V138_PLAN140_NATIVE_IDENTITIES,
} from "./check-v1-38-plan-262-140-live-v13-custody-v9.js"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const OWNERS: string[] = []
const owner = (): string => { const value = mkdtempSync(path.join(tmpdir(), "v138-plan140-test-")); OWNERS.push(value); return value }
const clone = <T>(value: T): T => structuredClone(value)
afterAll(() => { for (const value of OWNERS) rmSync(value, { recursive: true, force: true }) })

const cloneRepository = (): string => {
  const destination = path.join(owner(), "checkout")
  execFileSync("git", ["clone", "--quiet", "--no-local", ROOT, destination])
  for (const relative of ["node_modules", "packages/runtime-wasm-wasi/node_modules",
    "packages/test-utils/node_modules", "packages/map-configs/node_modules",
    "packages/runtime-python/node_modules", "packages/runtime-supervisor/node_modules",
    "packages/spec/node_modules", "packages/golden/node_modules", "packages/runtime-js/node_modules",
    "packages/persistence/node_modules", "packages/replay/node_modules", "packages/service/node_modules",
    "packages/engine/node_modules", "apps/runtime-service/node_modules", "apps/web/node_modules",
    "apps/worker/node_modules"])
    symlinkSync(path.join(ROOT, relative), path.join(destination, relative), "dir")
  return destination
}
const freshProcess = async (root: string): Promise<string> => (await promisify(execFile)(process.execPath,
  ["--import", "tsx", path.join(ROOT, "scripts/check-v1-38-plan-262-140-live-v13-custody-v9.ts"),
    "--emit-prospective", root],
  { cwd: ROOT, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 })).stdout
const scanPrivacy = (value: unknown): void => {
  const serialized = JSON.stringify(value)
  expect(serialized).not.toContain(ROOT); expect(serialized).not.toContain(tmpdir())
  expect(serialized).not.toMatch(/file:\/\//u); expect(serialized).not.toMatch(/[A-Za-z]:[\\/]/u)
  expect(serialized).not.toMatch(/"\/(?:Users|home|private|tmp|var)\//u)
}

let BASE: Awaited<ReturnType<typeof buildV138Plan140ProspectiveV9ForReview>>
beforeAll(async () => { BASE = await buildV138Plan140ProspectiveV9ForReview(ROOT) }, 360_000)

describe("Plan 262-140 authenticated executor custody v9", () => {
  it("pins the exact executor/test, complete closure, two C tuples, and six genuine stable records", () => {
    expect(V138_PLAN140_EXECUTOR).toMatchObject({ commit: "222cecd6c8f633e1cec5ae916f95389f9a5f7876",
      sourceBlob: "28f8500db03bd81c2cbfe17c54f8cc2cf946e807",
      sourceSha256: "sha256:3bd4e8f2e5d994a45fe6a15659442ffe2e7e5b611ecf9205665597ef11fa43dc",
      testBlob: "dcf81600b80a0c07d2145d3c5eac030dab45765c",
      testSha256: "sha256:cfd5f3787184f2b6db033bf2de619b61ac6eeb03aa92f3b201738d8dba592b98" })
    expect(BASE.payload.executorClosure.entries.length).toBeGreaterThan(10)
    expect(BASE.payload.nativeIdentities).toEqual(V138_PLAN140_NATIVE_IDENTITIES)
    expect(BASE.payload.observations).toHaveLength(6)
    expect(new Set(BASE.payload.observations.map((item: any) => item.stableRecordRoot)).size).toBe(6)
    for (const [ordinal, item] of BASE.payload.observations.entries()) {
      expect(item.ordinal).toBe(ordinal); expect(item.producerGuardCount).toBe(0)
      expect(item.stableRecordRoot).toBe(computeV138Plan140StableRecordRootForReview({
        executorClosureRoot: BASE.payload.executorClosure.executorClosureRoot,
        nativeIdentities: V138_PLAN140_NATIVE_IDENTITIES, mode: item.mode, ordinal,
        reducedValue: item.reducedValue, producerGuardCount: 0,
      }))
    }
    expect(BASE.payload.plan141Eligible).toBe(true)
    expect(BASE.payload.plan110Eligible).toBe(false)
    scanPrivacy(BASE)
  })

  it("rejects declarative, forged, omitted, reordered, one-field, and coherently repaired attacks", () => {
    const hostile: any[] = []
    const mutations: Array<(value: any) => void> = [
      (v) => { v.payload.observations = [] },
      (v) => { v.payload.observations.reverse() },
      (v) => { v.payload.observations[0].mode = "--forged" },
      (v) => { v.payload.observations[0].ordinal = 5 },
      (v) => { v.payload.observations[0].producerGuardCount = 1 },
      (v) => { v.payload.observations[0].reducedValue = { forged: true } },
      (v) => { v.payload.observations[0].nativeIdentities.reverse() },
      (v) => { v.payload.observations[0].executorClosureRoot = `sha256:${"1".repeat(64)}` },
      (v) => { v.payload.executorClosure.entries.pop() },
      (v) => { v.payload.executorClosure.entries.reverse() },
      (v) => { v.payload.executorClosure.entries[0].sha256 = `sha256:${"2".repeat(64)}` },
      (v) => { v.payload.mappingDomain = "verified" },
      (v) => { v.payload.plan110Eligible = true },
      (v) => { v.carrier.authorizesExecution = true },
    ]
    for (const mutate of mutations) { const value = clone(BASE) as any; mutate(value); hostile.push(value) }
    const fabricated = clone(BASE) as any
    fabricated.payload.observations = fabricated.payload.observations.map((item: any, ordinal: number) =>
      ({ ...item, stableRecordRoot: `sha256:${String(ordinal).repeat(64)}` }))
    hostile.push(fabricated)
    const results = authenticateV138Plan140ProspectiveV9BatchForReview([BASE, ...hostile], ROOT)
    expect(results[0]).toEqual({ accepted: true })
    expect(results.slice(1).every((item) => !item.accepted && /V138_PLAN140_/u.test(item.code ?? "")))
      .toBe(true)
  })

  it("fails closed for each of eleven occupied destinations, dangling symlinks, and lookup errors", () => {
    expect(V138_PLAN140_EFFECT_PATHS).toHaveLength(11)
    for (const repoPath of V138_PLAN140_EFFECT_PATHS) {
      const root = owner(); const occupied = path.join(root, repoPath)
      mkdirSync(path.dirname(occupied), { recursive: true }); writeFileSync(occupied, "occupied")
      expect(() => checkV138Plan140EffectPathsAbsentForReview(root)).toThrow(/V138_PLAN140_/u)
      rmSync(occupied); symlinkSync(path.join(root, "missing-target"), occupied)
      expect(() => checkV138Plan140EffectPathsAbsentForReview(root)).toThrow(/V138_PLAN140_/u)
    }
    const inaccessible = owner(); const ancestor = path.join(inaccessible, ".planning")
    mkdirSync(ancestor); chmodSync(ancestor, 0o000)
    try { expect(() => checkV138Plan140EffectPathsAbsentForReview(inaccessible)).toThrow(/V138_PLAN140_/u) }
    finally { chmodSync(ancestor, 0o700) }
  })

  it("rejects replacement, graft, shallow, alternate, and local include/config metadata", () => {
    const attacks: Array<(root: string) => void> = [
      (root) => execFileSync("git", ["-C", root, "replace", "HEAD", "HEAD^"]),
      (root) => { const gitDir = execFileSync("git", ["-C", root, "rev-parse", "--git-dir"], { encoding: "utf8" }).trim(); mkdirSync(path.join(root, gitDir, "info"), { recursive: true }); writeFileSync(path.join(root, gitDir, "info/grafts"), "forged\n") },
      (root) => { const gitDir = execFileSync("git", ["-C", root, "rev-parse", "--git-dir"], { encoding: "utf8" }).trim(); writeFileSync(path.join(root, gitDir, "shallow"), `${execFileSync("git", ["-C", root, "rev-parse", "HEAD"], { encoding: "utf8" }).trim()}\n`) },
      (root) => { const objects = execFileSync("git", ["-C", root, "rev-parse", "--git-path", "objects"], { encoding: "utf8" }).trim(); mkdirSync(path.join(root, objects, "info"), { recursive: true }); writeFileSync(path.join(root, objects, "info/alternates"), "/tmp/forged\n") },
      (root) => execFileSync("git", ["-C", root, "config", "--local", "include.path", "/tmp/forged"]),
    ]
    for (const attack of attacks) { const root = cloneRepository(); attack(root); expect(() => checkV138Plan140SourceOnlyForReview(root)).toThrow(/V138_PLAN140_/u) }
  }, 360_000)

  it("is fresh/no-cache and deterministic across distinct roots and processes", async () => {
    const second = await buildV138Plan140ProspectiveV9ForReview(ROOT)
    expect(second).toEqual(BASE); expect(second).not.toBe(BASE)
    const [left, right] = await Promise.all([freshProcess(cloneRepository()), freshProcess(cloneRepository())])
    expect(right).toBe(left); scanPrivacy(JSON.parse(left))
  }, 360_000)
})
