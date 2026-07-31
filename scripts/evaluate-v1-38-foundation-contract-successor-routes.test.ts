import { execFileSync, spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
} from "vitest"
import { encodeCanonicalJson, type JsonValue } from "@cowards/spec"
import {
  V138_CURRENT_MATRIX_CHILD_PROTOCOL_MAX_BYTES,
  V138_CURRENT_MATRIX_CHILD_PROTOCOL_SCHEMA,
  classifyV138CurrentMatrixChildFailure,
  decodeV138CurrentMatrixChildProtocolResult,
} from "./lib/v1-38-current-matrix-child-protocol.js"
import {
  V138_PLAN_262_22_FRESH_DESTINATIONS,
  V138_PLAN_262_25_FRESH_DESTINATIONS,
  V138_SUCCESSOR_AUTHORIZED_SOURCE_PATHS_V4,
  checkV138Plan26221AuthorizationV3PostLive,
} from "./lib/v1-38-successor-source-seal.js"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const sourceA3 = "7ec7bae62fac9344bed9919b6e5095f9451c7eea"
const sourceB3 = "1387813e9f7262ac0c5916635addee9cdb96354b"
let syntheticRoot = ""

const canonicalManifest = (value: unknown): string => {
  const encoded = encodeCanonicalJson(value as JsonValue, {
    context: "canonical-manifest",
  })
  if (!encoded.ok) throw new TypeError("test canonical manifest invalid")
  return `${Buffer.from(encoded.bytes).toString("utf8")}\n`
}

const resetSyntheticRepository = (): void => {
  execFileSync("git", ["reset", "--hard", "-q", "HEAD"], {
    cwd: syntheticRoot,
  })
  execFileSync("git", ["clean", "-fdx", "-q"], { cwd: syntheticRoot })
}

beforeAll(() => {
  syntheticRoot = mkdtempSync(path.join(tmpdir(), "cowards-successor-routes-"))
  execFileSync("git", ["clone", "-q", "--no-hardlinks", repoRoot, syntheticRoot])
})

afterAll(() => {
  if (syntheticRoot !== "") rmSync(syntheticRoot, { recursive: true, force: true })
})

describe.sequential("v1.38 successor temporal checkers", () => {
  it("keeps the strict pre-live v3 checker strict after route artifacts exist", () => {
    expect(() => execFileSync(process.execPath, [
      "--import", "tsx", "scripts/lib/v1-38-successor-source-seal.ts",
      "--check-plan-262-21-authorization-v3",
      "--authorization", ".planning/artifacts/v1.38-plan-262-21-authorization-v3.json",
      "--seal", ".planning/artifacts/v1.38-successor-source-seal-v3.json",
      "--review", ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-21-REVIEW.md",
      "--review-fix", ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-21-REVIEW-FIX.md",
      "--source-a3", sourceA3,
      "--source-b3", sourceB3,
    ], { cwd: repoRoot, stdio: "pipe" })).toThrow()
  })

  it("accepts the exact terminal-selected calibration-stopped v3 row", () => {
    expect(checkV138Plan26221AuthorizationV3PostLive({
      repoRoot,
      sourceA3,
      sourceB3,
    })).toMatchObject({
      disposition: "calibration_stopped",
      chargedCalibrationAttemptCount: 8,
      chargedReproductionAttemptCount: 0,
      acceptedCellCount: 0,
    })
  })

  it.each([
    [V138_PLAN_262_22_FRESH_DESTINATIONS[0], "V138_ROUTE_3_CONTEXT_REQUIRED"],
    [V138_PLAN_262_22_FRESH_DESTINATIONS[2], "V138_ROUTE_3_CALIBRATION_REQUIRED"],
    [V138_PLAN_262_22_FRESH_DESTINATIONS[3], "V138_ROUTE_3_REPRODUCTION_MUST_BE_ABSENT"],
  ] as const)("reports route/path-scoped post-live errors for %s", (repoPath, code) => {
    resetSyntheticRepository()
    const target = path.resolve(syntheticRoot, repoPath)
    if (existsSync(target)) rmSync(target)
    else {
      mkdirSync(path.dirname(target), { recursive: true })
      writeFileSync(target, "{}\n")
    }
    expect(() => checkV138Plan26221AuthorizationV3PostLive({
      repoRoot: syntheticRoot,
      sourceA3,
      sourceB3,
    })).toThrow(code)
  })
})

describe.sequential("v1.38 route ordinal 4 additive contracts", () => {
  it("declares only the five reviewed A4 source paths", () => {
    expect(V138_SUCCESSOR_AUTHORIZED_SOURCE_PATHS_V4).toEqual([
      "scripts/evaluate-v1-38-foundation-contract-successor-routes.test.ts",
      "scripts/evaluate-v1-38-foundation-contract.test.ts",
      "scripts/lib/v1-38-current-matrix-child-protocol.ts",
      "scripts/lib/v1-38-current-matrix-reproduction.ts",
      "scripts/lib/v1-38-successor-source-seal.ts",
    ])
  })

  it("precommits fresh route-4 destinations without creating them", () => {
    expect(V138_PLAN_262_25_FRESH_DESTINATIONS).toEqual([
      ".planning/artifacts/v1.38-current-matrix-execution-context-v8.json",
      ".planning/artifacts/v1.38-current-matrix-headroom-preflight-v8.json",
      ".planning/artifacts/v1.38-current-matrix-calibration-v8.json",
      ".planning/artifacts/v1.38-current-matrix-reproduction-v9.json",
      ".planning/artifacts/v1.38-plan-262-25-terminal-v1.json",
      ".planning/artifacts/v1.38-plan-262-25-preflight-consumption-v1.json",
      ".planning/artifacts/v1.38-plan-262-25-calibration-consumption-v1.json",
      ".planning/artifacts/v1.38-plan-262-25-reproduction-consumption-v1.json",
    ])
    for (const repoPath of V138_PLAN_262_25_FRESH_DESTINATIONS) {
      expect(existsSync(path.resolve(repoRoot, repoPath))).toBe(false)
    }
  })
})

describe.sequential("v1.38 child protocol", () => {
  const protocolModule = path.resolve(
    repoRoot,
    "scripts/lib/v1-38-current-matrix-child-protocol.ts",
  )
  const run = (mode: string) => spawnSync(process.execPath, [
    "--import", "tsx", protocolModule, "--protocol-fixture-child", mode,
  ], { cwd: repoRoot, encoding: null })

  it("maps one exact finite failure code through the public-safe handler", () => {
    const message = {
      schemaVersion: V138_CURRENT_MATRIX_CHILD_PROTOCOL_SCHEMA,
      failureCode: "RESOURCE_POLICY_SHARD_FAILED" as const,
    }
    expect(classifyV138CurrentMatrixChildFailure(message)).toEqual({
      classification: "system_failure",
      code: "RESOURCE_POLICY_SHARD_FAILED",
      retryable: false,
    })
    const result = run("valid")
    expect(decodeV138CurrentMatrixChildProtocolResult(result)).toEqual({
      classification: "system_failure",
      code: "RESOURCE_POLICY_SHARD_FAILED",
      retryable: false,
    })
  })

  it.each([
    "malformed-json",
    "malformed-utf8",
    "unknown-key",
    "unknown-code",
    "duplicate-message",
    "oversize",
    "stderr-contamination",
    "nonzero-exit",
  ])("fails closed on protocol fixture mode %s", (mode) => {
    const result = run(mode)
    expect(() => decodeV138CurrentMatrixChildProtocolResult(result)).toThrow()
  })

  it("keeps captured protocol bytes bounded and free of private/runtime/game fields", () => {
    const result = run("valid")
    expect(result.stdout.byteLength).toBeLessThanOrEqual(
      V138_CURRENT_MATRIX_CHILD_PROTOCOL_MAX_BYTES,
    )
    const captured = Buffer.concat([result.stdout, result.stderr])
      .toString("utf8")
      .toLowerCase()
    for (const prohibited of [
      "strategy", "match", "observation", "source", "memory", "objective",
      "environment", "filesystem", "database", "host", "diagnostic",
    ]) expect(captured).not.toContain(prohibited)
  })
})

