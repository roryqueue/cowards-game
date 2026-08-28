import { spawnSync } from "node:child_process"
import { describe, expect, it } from "vitest"
import { checkV138SuccessorControllerV2Source, V138_SUCCESSOR_CONTROLLER_V2_CLI, V138_SUCCESSOR_CONTROLLER_V2_OPERATIONS } from "./v1-38-bounded-retry-successor-controller-v2.js"

const run = (mode: string) => spawnSync(process.execPath, ["--import", "tsx", V138_SUCCESSOR_CONTROLLER_V2_CLI, mode], { cwd: process.cwd(), encoding: "utf8" })

describe("CR-01 controller-owned successor mutation closure", () => {
  it("exports only non-writing constants and source checks", async () => {
    const controller = await import("./v1-38-bounded-retry-successor-controller-v2.js")
    const pair = await import("./v1-38-durable-pair-successor-v2.js")
    const lifecycle = await import("./v1-38-restartable-lifecycle-successor-v2.js")
    expect(Object.keys(controller).sort()).toEqual([
      "V138_SUCCESSOR_CONTROLLER_V2_CLI",
      "V138_SUCCESSOR_CONTROLLER_V2_OPERATIONS",
      "checkV138SuccessorControllerV2Source",
    ])
    expect(Object.keys(pair).sort()).toEqual(["deriveV138PairIntentV2"])
    expect(Object.keys(lifecycle).sort()).toEqual(["deriveV138LifecycleIntentV2"])
    for (const keys of [Object.keys(controller), Object.keys(pair), Object.keys(lifecycle)]) {
      expect(keys.join(" ")).not.toMatch(/(?:write|publish|apply|mutate|run|invoke|worker)/iu)
    }
    expect(checkV138SuccessorControllerV2Source(V138_SUCCESSOR_CONTROLLER_V2_CLI)).toBe(true)
  })

  it("runs the complete write protocol only inside its controller-created temporary root", () => {
    const result = run("--synthetic-check")
    expect(result.status).toBe(0)
    const output = JSON.parse(result.stdout) as Record<string, unknown>
    expect(output).toMatchObject({ sourceOnly: true, liveSideEffects: false, acceptedCells: 0, workspaceWrites: false })
    expect(output.operations).toEqual(V138_SUCCESSOR_CONTROLLER_V2_OPERATIONS)
    expect(output.pairMembers).toEqual(['{"authority":false}\n', "# Synthetic non-authorizing review\n"])
    expect(output.lifecycle).toBe("status: synthetic-complete\n")
    expect(output.overlapRaces).toBe(50)
    expect(output.disjointRaces).toBe(100)
    expect(output.crashRecoveries).toBe(10)
    expect(output.writeWindowRecoveries).toBe(2)
    expect(output.directHelperBypassAttempts).toBe(2)
    expect(output.directoryReplacementProtections).toBe(2)
  }, 240_000)

  it.each(["--source-check"])("allows the non-live %s CLI mode", (mode) => {
    const result = run(mode)
    expect(result.status).toBe(0)
    expect(result.stdout).toContain(mode === "--source-check" ? "source_only=true" : '"liveSideEffects":false')
  }, 30_000)

  it.each(["--live", "--production", "--retry", "--reproduction", "--activate", "--unknown"])("fails closed for forbidden CLI mode %s", (mode) => {
    const result = run(mode)
    expect(result.status).not.toBe(0)
    expect(result.stderr).toContain("V138_SUCCESSOR_CONTROLLER_SOURCE_ONLY")
  })
})
