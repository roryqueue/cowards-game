import { spawnSync } from "node:child_process"
import { describe, expect, it } from "vitest"
import {
  checkV138SuccessorControllerV2Source,
  V138_SUCCESSOR_CONTROLLER_V2,
  V138_SUCCESSOR_CONTROLLER_V2_CLI,
  V138_SUCCESSOR_CONTROLLER_V2_OPERATIONS,
} from "./v1-38-bounded-retry-successor-controller-v2.js"

describe("CR-01 composed source-only successor controller", () => {
  it("wires every successor recovery/publication call site through one route", () => {
    expect(Object.keys(V138_SUCCESSOR_CONTROLLER_V2)).toEqual([
      "recoverAdmittedObservation",
      "completeSemanticEffect",
      "recoverSemanticDecision",
      "publishCanonicalPair",
      "applyLifecycleTransaction",
    ])
    expect(V138_SUCCESSOR_CONTROLLER_V2_OPERATIONS).toHaveLength(5)
    expect(checkV138SuccessorControllerV2Source(V138_SUCCESSOR_CONTROLLER_V2_CLI)).toBe(true)
  })

  it.each(["--source-check", "--synthetic-check"])(
    "allows only the non-live %s CLI mode",
    (mode) => {
      const result = spawnSync(
        process.execPath,
        ["--import", "tsx", V138_SUCCESSOR_CONTROLLER_V2_CLI, mode],
        { cwd: process.cwd(), encoding: "utf8" },
      )
      expect(result.status).toBe(0)
      expect(result.stdout).toContain(mode === "--source-check" ? "source_only=true" : '"liveSideEffects":false')
    },
  )

  it.each(["--live", "--production", "--retry", "--reproduction", "--activate", "--unknown"])(
    "fails closed for forbidden CLI mode %s",
    (mode) => {
      const result = spawnSync(
        process.execPath,
        ["--import", "tsx", V138_SUCCESSOR_CONTROLLER_V2_CLI, mode],
        { cwd: process.cwd(), encoding: "utf8" },
      )
      expect(result.status).not.toBe(0)
      expect(result.stderr).toContain("V138_SUCCESSOR_CONTROLLER_SOURCE_ONLY")
    },
  )
})
