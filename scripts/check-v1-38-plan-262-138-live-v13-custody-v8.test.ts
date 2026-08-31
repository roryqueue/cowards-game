import { execFile, execFileSync } from "node:child_process"
import { mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { promisify } from "node:util"
import { fileURLToPath } from "node:url"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import {
  authenticateV138Plan138ProspectiveV8BatchForReview,
  buildV138Plan138ProspectiveV8ForReview,
  checkV138Plan138SourceOnlyForReview,
  rootV138Plan138CarrierForReview,
  rootV138Plan138PayloadForReview,
  shaV138Plan138PayloadForReview,
} from "./check-v1-38-plan-262-138-live-v13-custody-v8.js"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const OWNERS: string[] = []
const clone = <T>(value: T): T => structuredClone(value)
const owner = (): string => {
  const value = mkdtempSync(path.join(tmpdir(), "v138-plan138-test-")); OWNERS.push(value); return value
}
afterAll(() => { for (const value of OWNERS) rmSync(value, { recursive: true, force: true }) })

const IDENTITIES = [
  {
    path: "scripts/native/v1-38-successor-transaction-helper-v6.c", mode: "100644",
    blob: "ca694310a8a99c30d7a4070a415b968d3e341409",
    contentSha256: "sha256:643d5c7a2bc1e92671c73705965d6f3451946faa60be48b34b044962020d261a",
  },
  {
    path: "scripts/native/v1-38-bounded-retry-v3-owner-lock-v1.c", mode: "100644",
    blob: "99da3517ccb8b919759663daf713b4f20337b8b1",
    contentSha256: "sha256:fef25dc7eab2cb372e6cd7549adb8836ab466340bd8a18b5eb748de906aefcea",
  },
] as const
const MODES = ["--check-source-only", "--check-prospective-custody", "--check-post-run-custody",
  "--check-non-pass-value", "--check-bounded-success-value", "--check-exact-reproduction-v17-value"]

let BASE: ReturnType<typeof buildV138Plan138ProspectiveV8ForReview>
beforeAll(() => { BASE = buildV138Plan138ProspectiveV8ForReview(ROOT) }, 300_000)

const repair = (evidence: any): void => {
  evidence.payload.payloadRoot = rootV138Plan138PayloadForReview(evidence.payload)
  evidence.carrier.payloadRoot = evidence.payload.payloadRoot
  evidence.carrier.payloadSha256 = shaV138Plan138PayloadForReview(evidence.payload)
  evidence.carrier.carrierRoot = rootV138Plan138CarrierForReview(evidence.carrier)
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
const freshProcess = async (root: string): Promise<string> => (await promisify(execFile)(process.execPath, [
  "--import", "tsx", path.join(ROOT, "scripts/check-v1-38-plan-262-138-live-v13-custody-v8.ts"),
  "--emit-prospective", root,
], { cwd: ROOT, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 })).stdout
const scanPrivacy = (value: unknown): void => {
  const serialized = JSON.stringify(value)
  expect(serialized).not.toContain(tmpdir()); expect(serialized).not.toContain(ROOT)
  expect(serialized).not.toMatch(/file:\/\//u); expect(serialized).not.toMatch(/[A-Za-z]:[\\/]/u)
  expect(serialized).not.toMatch(/"\/(?:Users|home|private|tmp|var)\//u)
}

describe("Plan 262-138 genuine-to-stable custody mapping v8", () => {
  it("binds each canonical mode and ordinal bijectively to the exact ordered measured C identities", () => {
    expect(BASE.payload.observations).toHaveLength(6)
    for (const [ordinal, observation] of BASE.payload.observations.entries()) {
      expect(observation.mode).toBe(MODES[ordinal])
      expect(observation.ordinal).toBe(ordinal)
      expect(observation.nativeCustodyMapping.mode).toBe(MODES[ordinal])
      expect(observation.nativeCustodyMapping.ordinal).toBe(ordinal)
      expect(observation.nativeCustodyMapping.nativeIdentities).toEqual(IDENTITIES)
      expect(observation.disposableLocalNativeSourcePaths).toEqual(IDENTITIES.map((item) => item.path))
    }
    expect(new Set(BASE.payload.observations.map((item: any) =>
      `${item.nativeCustodyMapping.mode}:${item.nativeCustodyMapping.ordinal}`)).size).toBe(6)
    scanPrivacy(BASE)
  }, 300_000)

  it("rejects substitution, omission, duplication, reordering, digest, genuine-root, and repaired-root attacks", () => {
    const hostile: any[] = []
    const mutations: Array<(value: any) => void> = [
      (value) => { value.payload.observations[0].nativeCustodyMapping.nativeIdentities.reverse() },
      (value) => { value.payload.observations[0].nativeCustodyMapping.nativeIdentities.pop() },
      (value) => { value.payload.observations[0].nativeCustodyMapping.nativeIdentities.push(
        clone(value.payload.observations[0].nativeCustodyMapping.nativeIdentities[0])) },
      (value) => { value.payload.observations[0].nativeCustodyMapping.nativeIdentities[0].path =
        "scripts/check-v1-38-plan-262-132-live-v13-custody-v5.ts" },
      (value) => { value.payload.observations[0].nativeCustodyMapping.nativeIdentities[0].mode = "100755" },
      (value) => { value.payload.observations[0].nativeCustodyMapping.nativeIdentities[0].blob =
        "825772873b7feb81b0ccf19acbb27435b12b6a03" },
      (value) => { value.payload.observations[0].nativeCustodyMapping.nativeIdentities[0].contentSha256 =
        `sha256:${"0".repeat(64)}` },
      (value) => { value.payload.observations[0].nativeCustodyMapping.genuineCustodyDomain =
        "forged-genuine-custody" },
      (value) => { value.payload.observations[0].nativeCustodyMapping.stableNativeIdentitySetRoot =
        `sha256:${"3".repeat(64)}` },
      (value) => { value.payload.observations[0].nativeCustodyMapping.mappingRoot =
        `sha256:${"4".repeat(64)}` },
      (value) => { value.payload.observations[0].disposableLocalNativeSourcesRoot =
        `sha256:${"5".repeat(64)}` },
      (value) => { value.payload.observations[0].disposableLocalExecutionClosureRoot =
        `sha256:${"6".repeat(64)}` },
      (value) => { value.payload.observations[0].observationRoot = `sha256:${"7".repeat(64)}` },
      (value) => { value.payload.observations.reverse() },
      (value) => { value.payload.observationsRoot = `sha256:${"8".repeat(64)}` },
      (value) => { value.payload.plan110Eligible = true },
      (value) => { value.carrier.authorizesExecution = true },
    ]
    for (const mutate of mutations) { const value = clone(BASE) as any; mutate(value); repair(value); hostile.push(value) }
    const results = authenticateV138Plan138ProspectiveV8BatchForReview([BASE, ...hostile], ROOT)
    expect(results[0]).toEqual({ accepted: true })
    expect(results.slice(1).every((result) => !result.accepted && /V138_PLAN138_/u.test(result.code ?? "")))
      .toBe(true)
  }, 300_000)

  it("freshly rejects later root mutation and forbidden effects after successful calls", () => {
    const second = cloneRepository()
    expect(checkV138Plan138SourceOnlyForReview(second).plan139Eligible).toBe(true)
    const native = path.join(second, IDENTITIES[0].path)
    writeFileSync(native, `${readFileSync(native, "utf8")}\n`)
    expect(() => checkV138Plan138SourceOnlyForReview(second)).toThrow(/V138_PLAN138_/u)
    expect(() => checkV138Plan138SourceOnlyForReview(path.join(owner(), "missing")))
      .toThrow(/V138_PLAN138_/u)
  }, 300_000)

  it("emits byte-identical privacy-safe evidence from distinct roots and fresh processes", async () => {
    const [left, right] = await Promise.all([freshProcess(cloneRepository()), freshProcess(cloneRepository())])
    expect(right).toBe(left); scanPrivacy(JSON.parse(left))
  }, 300_000)
})
