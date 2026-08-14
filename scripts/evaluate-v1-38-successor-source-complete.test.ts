import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { expect, it } from "vitest"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

const ROUTE_7_COMMANDS = Object.freeze([
  "--calibrate-parallel-v11-receipt",
  "--check-plan-262-57-terminal-v1",
  "--write-authoritative-v12-receipt",
  "--write-execution-context-v11-receipt",
  "--write-headroom-preflight-v11-receipt",
  "--write-plan-262-57-route-start-v1",
  "--write-plan-262-57-terminal-v1",
])

const ROUTE_7_EXPORTS = Object.freeze([
  "V138_PLAN_262_57_ROUTE_CONTRACT",
  "V138_ROUTE_7_SOURCE_MANIFEST",
  "buildV138AuthoritativeMatrixV12Receipt",
  "buildV138ExecutionContextV11Receipt",
  "buildV138HostHeadroomPreflightV11Receipt",
  "buildV138ParallelCalibrationV11Receipt",
  "buildV138Plan26257RouteStartV1",
  "buildV138Plan26257TerminalV1",
  "checkV138AuthoritativeMatrixV12Receipt",
  "checkV138ExecutionContextV11Receipt",
  "checkV138HostHeadroomPreflightV11Receipt",
  "checkV138ParallelCalibrationV11Receipt",
  "checkV138Plan26257ConsumptionMarker",
  "checkV138Plan26257RouteStartV1",
  "checkV138Plan26257TerminalBranch",
  "checkV138Plan26257TerminalV1",
  "checkV138Route7SourceCompleteness",
  "writeV138AuthoritativeMatrixV12Receipt",
  "writeV138ExecutionContextV11Receipt",
  "writeV138HostHeadroomPreflightV11Receipt",
  "writeV138ParallelCalibrationV11Receipt",
  "writeV138Plan26257RouteStartV1",
  "writeV138Plan26257TerminalV1",
])

it("PLAN_262_54_RED: route-7 production capability manifest is complete", async () => {
    const module = await import("./lib/v1-38-current-matrix-reproduction.js")
    const source = readFileSync(path.resolve(repoRoot,
      "scripts/lib/v1-38-current-matrix-reproduction.ts"), "utf8")
    const missing = [
      ...ROUTE_7_COMMANDS.filter((command) => !source.includes(`\"${command}\"`))
        .map((command) => `command:${command}`),
      ...ROUTE_7_EXPORTS.filter((name) => !(name in module))
        .map((name) => `export:${name}`),
    ].sort()
    if (missing.length > 0) {
      throw new TypeError(
        `V138_PLAN_262_54_ROUTE_7_CAPABILITY_MISSING\n${missing.join("\n")}`,
      )
    }
    expect(missing).toEqual([])
})
