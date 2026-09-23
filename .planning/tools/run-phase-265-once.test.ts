import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { phase265RunArguments, runPhase265Once } from "./run-phase-265-once.js"

const runArgs = [
  "run", "--allocation", "/private/allocation.json", "--allocation-root", "sha256:" + "a".repeat(64),
  "--repository", "/private/league", "--factory-repository", "/private/historical",
  "--response-factory-repository", "/private/responses", "--capacity-input", "/private/capacity.json",
  "--result-output", "/private/result.json",
]

describe("Phase 265 once-only result wrapper argument gate", () => {
  it("passes exactly one capacity-input run and strips only its output destination", () => {
    const admitted = phase265RunArguments(runArgs)
    expect(admitted.outputPath).toBe("/private/result.json")
    expect(admitted.forwarded).toEqual(runArgs.slice(0, -2))
    expect(() => phase265RunArguments([...runArgs, "--result-output", "/private/other.json"])).toThrow("ARGUMENTS")
    expect(() => phase265RunArguments(runArgs.map((value) => value === "--capacity-input" ? "--capacity-receipt" : value))).toThrow("ARGUMENTS")
    expect(() => phase265RunArguments(["verify-retained", ...runArgs.slice(1)])).toThrow("ARGUMENTS")
  })

  it("reserves the result before the injected CLI call and cannot run with an existing target", async () => {
    const directory = realpathSync(mkdtempSync(join(tmpdir(), "phase265-run-wrapper-")))
    const outputPath = join(directory, "result.json")
    const args = [...runArgs.slice(0, -1), outputPath]
    for (const name of ["--repository", "--factory-repository", "--response-factory-repository"]) {
      const path = join(directory, name.slice(2))
      mkdirSync(path)
      args[args.indexOf(name) + 1] = path
    }
    let calls = 0
    const run = async (_args: readonly string[]) => { calls++; return JSON.stringify({ processValidity: "process_valid", headRoot: "sha256:" + "a".repeat(64) }) }
    try {
      writeFileSync(outputPath, "preexisting")
      await expect(runPhase265Once(args, run)).rejects.toThrow()
      expect(calls).toBe(0)
      expect(readFileSync(outputPath, "utf8")).toBe("preexisting")
      rmSync(outputPath)
      const inside = [...args]
      inside[inside.length - 1] = join(args[args.indexOf("--factory-repository") + 1]!, "result.json")
      await expect(runPhase265Once(inside, run)).rejects.toThrow("RESULT_INSIDE_REPOSITORY")
      expect(calls).toBe(0)
      const result = await runPhase265Once(args, run)
      expect(calls).toBe(1)
      expect(result.resultPath).toBe(outputPath)
      expect(JSON.parse(readFileSync(outputPath, "utf8"))).toEqual(result.result)
      await expect(runPhase265Once(args, run)).rejects.toThrow()
      expect(calls).toBe(1)
    } finally { rmSync(directory, { recursive: true, force: true }) }
  })
})
