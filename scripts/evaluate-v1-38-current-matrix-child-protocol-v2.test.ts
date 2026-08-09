import { Buffer } from "node:buffer"
import { spawnSync, type SpawnSyncReturns } from "node:child_process"
import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import {
  V138_CURRENT_MATRIX_CHILD_INTEGRITY_FAMILIES,
  V138_CURRENT_MATRIX_CHILD_PROTOCOL_V2_MAX_BYTES,
  decodeV138CurrentMatrixChildProtocolV2,
  encodeV138CurrentMatrixChildProtocolV2Ready,
  encodeV138CurrentMatrixChildProtocolV2Terminal,
  reduceV138CurrentMatrixChildProtocolV2Observation,
} from "./lib/v1-38-current-matrix-child-protocol.js"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const fixture = path.resolve(
  repoRoot,
  "scripts/fixtures/v1-38-current-matrix-child-protocol-v2-fixture.ts",
)
type FixtureResult = SpawnSyncReturns<Buffer> & { output: Array<Buffer | null> }
const run = (mode: string): FixtureResult => spawnSync(process.execPath, [
  "--import", "tsx", fixture, mode,
], {
  cwd: repoRoot,
  encoding: null,
  stdio: ["ignore", "pipe", "pipe", "pipe"],
}) as FixtureResult
const controlBytes = (result: FixtureResult): Buffer => result.output[3] ?? Buffer.alloc(0)
const observe = (result: FixtureResult) =>
  reduceV138CurrentMatrixChildProtocolV2Observation({
    spawned: result.error === undefined,
    controlBytes: controlBytes(result),
    stderrBytes: result.stderr,
    exitStatus: result.status,
    signal: result.signal,
    timedOut: false,
  })

describe.sequential("v1.38 current-matrix child protocol v2", () => {
  it("accepts exact ready then success, runtime, or shard terminal frames", () => {
    expect(V138_CURRENT_MATRIX_CHILD_INTEGRITY_FAMILIES).toEqual([
      "CHILD_BOOTSTRAP_FAILED",
      "CHILD_TRANSPORT_FAILED",
      "RUNTIME_EXECUTION_FAILED",
      "SHARD_COORDINATION_FAILED",
    ])
    expect(decodeV138CurrentMatrixChildProtocolV2(Buffer.concat([
      encodeV138CurrentMatrixChildProtocolV2Ready(),
      encodeV138CurrentMatrixChildProtocolV2Terminal("success"),
    ]))).toEqual({ ready: true, terminal: "success" })
    expect(observe(run("success"))).toEqual({ classification: "success" })
    expect(observe(run("runtime-failure"))).toEqual({
      classification: "system_failure",
      code: "RUNTIME_EXECUTION_FAILED",
      retryable: false,
    })
    expect(observe(run("shard-failure"))).toEqual({
      classification: "system_failure",
      code: "SHARD_COORDINATION_FAILED",
      retryable: false,
    })
  })

  it("keeps expected typed runtime-service failures in the result envelope", () => {
    const observed = run("expected-runtime-failure")
    expect(observe(observed)).toEqual({ classification: "success" })
    expect(JSON.parse(observed.stdout.toString("utf8"))).toEqual({
      classification: "system_failure",
      code: "EXECUTION_CAPTURE_MISSING",
      retryable: false,
    })
    expect(controlBytes(observed).toString("utf8")).not.toContain(
      "EXECUTION_CAPTURE_MISSING",
    )
  })

  it("classifies only parent-observed bootstrap and transport failures", () => {
    expect(reduceV138CurrentMatrixChildProtocolV2Observation({
      spawned: false,
      controlBytes: Buffer.alloc(0),
      stderrBytes: Buffer.alloc(0),
      exitStatus: null,
      signal: null,
      timedOut: false,
    })).toEqual({
      classification: "system_failure",
      code: "CHILD_TRANSPORT_FAILED",
      retryable: false,
    })
    for (const mode of ["no-ready"]) {
      expect(observe(run(mode))).toEqual({
        classification: "system_failure",
        code: "CHILD_BOOTSTRAP_FAILED",
        retryable: false,
      })
    }
    for (const mode of [
      "ready-only", "duplicate-ready", "terminal-before-ready",
      "duplicate-terminal", "conflicting-terminal", "unknown-frame",
      "extra-key", "unknown-family", "noncanonical", "malformed-json",
      "invalid-utf8", "oversize", "stderr",
    ]) {
      expect(observe(run(mode)), mode).toEqual({
        classification: "system_failure",
        code: mode === "terminal-before-ready" || mode === "malformed-json" ||
            mode === "invalid-utf8" || mode === "oversize" ||
            mode === "noncanonical"
          ? "CHILD_BOOTSTRAP_FAILED"
          : "CHILD_TRANSPORT_FAILED",
        retryable: false,
      })
    }
  })

  it("bounds and minimizes every captured control frame", () => {
    for (const mode of ["success", "runtime-failure", "shard-failure"]) {
      const observed = run(mode)
      const control = controlBytes(observed)
      expect(control.byteLength).toBeLessThanOrEqual(
        V138_CURRENT_MATRIX_CHILD_PROTOCOL_V2_MAX_BYTES,
      )
      expect(observed.stderr).toHaveLength(0)
      const captured = control.toString("utf8").toLowerCase()
      for (const prohibited of [
        "text", "detail", "status", "signal", "stderr", "source", "memory",
        "objective", "path", "environment", "host", "process", "attempt",
        "token", "database", "strategy", "match", "observation",
      ]) expect(captured).not.toContain(`"${prohibited}`)
    }
  })

  it("keeps the standalone fixture and test outside live and gameplay imports", () => {
    const sources = [fixture, fileURLToPath(import.meta.url)].map((file) =>
      readFileSync(file, "utf8"))
    for (const source of sources) {
      expect(source).not.toMatch(/from ["'][^"']*(?:strategy|match|provider|darwin-headroom|successor-source-seal|runtime-service|database)/iu)
      expect(source).not.toContain([".planning", "artifacts"].join("/"))
    }
  })

  it("wires the production parent to child-emitted control bytes", () => {
    const production = readFileSync(path.resolve(
      repoRoot,
      "scripts/lib/v1-38-current-matrix-reproduction.ts",
    ), "utf8")
    const parentStart = production.indexOf(
      "export function createV138SubprocessShardRunner",
    )
    const childStart = production.indexOf("const runShardCli = (): void =>")
    const parent = production.slice(parentStart, childStart)
    const child = production.slice(childStart, production.indexOf(
      "const v138SuccessorCanonicalBytes",
      childStart,
    ))
    expect(parent).toContain('stdio: ["ignore", "pipe", "pipe", "pipe"]')
    expect(parent).toContain("child.stdio[3]")
    expect(parent).toContain("decodeV138CurrentMatrixChildProtocolV2(")
    expect(parent).toContain("reduceV138CurrentMatrixChildProtocolV2Observation(")
    expect(parent).not.toContain("classifyV138CurrentMatrixChildFailure({")
    expect(child).toContain("encodeV138CurrentMatrixChildProtocolV2Ready()")
    expect(child).toContain('failChild("RUNTIME_EXECUTION_FAILED")')
    expect(child).toContain('failChild("SHARD_COORDINATION_FAILED")')
    expect(child).toContain(
      'encodeV138CurrentMatrixChildProtocolV2Terminal("success")',
    )
    expect(child).not.toContain("catch {\n    process.exitCode = 1")
  })
})
