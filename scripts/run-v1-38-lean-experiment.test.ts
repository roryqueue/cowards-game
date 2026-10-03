import { expect, it } from "vitest"
import { parseLeanCommand, leanSourceManifest } from "./run-v1-38-lean-experiment.js"
import { claimLeanRuntimeAuthority } from "./lib/v1-38-lean-experiment-authority.js"
it("imports inertly and accepts only three explicit private modes", () => {
  expect(parseLeanCommand(["prepare-pilot", "--request", "x.json"])).toEqual({ mode: "prepare-pilot", request: "x.json" })
  expect(() => parseLeanCommand(["run-pilot", "--provider", "forged"])).toThrow()
  expect(() => parseLeanCommand(["production"])).toThrow()
  expect(() => parseLeanCommand(["run-pilot", "--request", "x", "--retry"])).toThrow()
})
it("denies caller-forged runtime authorities before native construction", () => {
  expect(() => claimLeanRuntimeAuthority({ schemaVersion: "lean-runtime-authority-v1" } as never, {} as never, "factory")).toThrow("AUTHORITY")
})
it("binds the entire reviewed implementation including additive native opt-ins", () => {
  const m = leanSourceManifest(); expect(m.entries.some(e => e.path.endsWith("lean-experiment.ts"))).toBe(true)
  expect(m.entries.some(e => e.path.endsWith("v1-38-lean-container-match-session.ts"))).toBe(true)
  expect(m.root).toMatch(/^sha256:/)
})
