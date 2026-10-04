import { describe, expect, it } from "vitest"
import { execFileSync } from "node:child_process"
import { resolve } from "node:path"
import { labRoot } from "../packages/strategy-lab/src/contracts.js"
import { currentBaselineSlotKind } from "../packages/strategy-lab/src/league/lean-experiment.js"
import { assertLeanBaselineWritableScope, deriveLeanBaselineCandidateRoots, deriveLeanBaselineRequestRoots, leanBaselinePair, leanBaselineSourceManifest, parseLeanBaselineCommand } from "./run-v1-38-lean-baseline.js"

const root = (name: string) => labRoot("baseline-cli-test", name)

describe("current-only baseline CLI source contracts", () => {
  it("admits only the prospective prepare/run/retained-reader surface", () => {
    expect(parseLeanBaselineCommand(["prepare-current", "--request", "a"]).mode).toBe("prepare-current")
    expect(parseLeanBaselineCommand(["run-current", "--request", "a"]).mode).toBe("run-current")
    expect(parseLeanBaselineCommand(["verify-retained", "--request", "a"]).mode).toBe("verify-retained")
    for (const command of ["prepare-pilot", "run-pilot", "child-current", "run-current", "verify-retained"]) {
      expect(() => parseLeanBaselineCommand([command, "a"])).toThrow(/LEAN_BASELINE_ARGUMENTS/u)
    }
    expect(() => parseLeanBaselineCommand(["run-current", "--request", "--unsafe"])).toThrow(/LEAN_BASELINE_ARGUMENTS/u)
  })

  it("freezes 36 distinct current intents, not post-training source roots", () => {
    const input = { seed: "baseline-test", coldRoot: root("cold"), planRoot: root("plan"), sourceRoot: root("source") }
    const requestRoots = deriveLeanBaselineRequestRoots(input)
    expect(requestRoots).toHaveLength(36)
    expect(new Set(requestRoots).size).toBe(36)
    expect(deriveLeanBaselineRequestRoots(input)).toEqual(requestRoots)
    expect(deriveLeanBaselineRequestRoots({ ...input, seed: "other" })).not.toEqual(requestRoots)
    expect(deriveLeanBaselineCandidateRoots(input.coldRoot)).toHaveLength(2)
    expect(new Set(deriveLeanBaselineCandidateRoots(input.coldRoot)).size).toBe(2)
    for (let ordinal = 0; ordinal < 36; ordinal++) expect(currentBaselineSlotKind(ordinal).condition).toBe((ordinal < 8 ? ordinal : ordinal < 12 ? ordinal - 8 : ordinal < 20 ? ordinal - 12 : ordinal < 28 ? ordinal - 20 : ordinal < 32 ? ordinal - 28 : ordinal - 32) % 4)
  })

  it("roots the pre-charge byte prefix and frozen pair to each intended slot", () => {
    const slot = { ordinal: 0, condition: 0, arenaHash: root("arena"), requestRoot: root("request"), root: root("slot") }
    const input = { ordinal: 0, slot, priorLedgerBytesRoot: root("ledger"), priorLedgerByteLength: 140, priorCharged: 9, bottom: { role: "initial-tactical", sourceRoot: root("bottom-source"), root: root("bottom-snapshot") }, top: { role: "cold-opponent", sourceRoot: root("top-source"), root: root("top-snapshot") } }
    const pair = leanBaselinePair(input)
    expect(pair.priorCharged).toBe(9)
    expect(pair.priorLedgerByteLength).toBe(140)
    expect(leanBaselinePair(input)).toEqual(pair)
    expect(leanBaselinePair({ ...input, priorLedgerBytesRoot: root("different-prefix") }).root).not.toBe(pair.root)
    expect(leanBaselinePair({ ...input, bottom: { ...input.bottom, sourceRoot: root("different-source") } }).root).not.toBe(pair.root)
  })

  it("binds every new runtime, reader and shell source without mutating the legacy factory manifest", () => {
    const manifest = leanBaselineSourceManifest()
    const paths = new Set(manifest.entries.map(entry => entry.path))
    for (const path of ["scripts/run-v1-38-lean-baseline.ts", "scripts/run-v1-38-lean-baseline.sh", "scripts/lib/v1-38-lean-baseline-pipeline.ts", "scripts/lib/v1-38-lean-baseline-retained.ts", "scripts/lib/v1-38-lean-baseline-match.ts", "scripts/lib/v1-38-lean-experiment-authority.ts", "packages/strategy-lab/src/league/lean-training.ts", "packages/strategy-lab/src/league/lean-experiment.ts"]) expect(paths.has(path)).toBe(true)
    expect(manifest.entries).toEqual([...manifest.entries].sort((a, b) => a.path.localeCompare(b.path)))
  })

  it("requires inherited pre-loader write controls and core suppression", () => {
    const scope = { cacheDisabled: "1", compileDisabled: "1", tempDirectory: resolve(".strategy-lab/lean-baseline-20261004-v1-tmp") }
    expect(() => assertLeanBaselineWritableScope(scope, "0\n")).not.toThrow()
    expect(() => assertLeanBaselineWritableScope({ ...scope, coverage: "/tmp/leak" }, "0")).toThrow(/WRITABLE_SCOPE/u)
    expect(() => assertLeanBaselineWritableScope(scope, "unlimited")).toThrow(/WRITABLE_SCOPE/u)
  })

  it("wrapper reports safe inherited scope without entering preparation or Matches", () => {
    const output = execFileSync("sh", ["scripts/run-v1-38-lean-baseline.sh", "--probe-launch-scope"], { cwd: resolve("."), env: { ...process.env, LEAN_BASELINE_LAUNCH_PROBE: "1", NODE_OPTIONS: "--trace-warnings", NODE_COMPILE_CACHE: "/tmp/leak", NODE_REDIRECT_WARNINGS: "/tmp/leak", NODE_V8_COVERAGE: "/tmp/leak" }, encoding: "utf8", timeout: 10_000 })
    expect(output).toContain("cache=1 compile=1")
    expect(output).toContain("node_options=unset compile_cache=unset warnings=unset coverage=unset core=0")
    expect(output).toContain("lean-baseline-20261004-v1-tmp")
  })
})
