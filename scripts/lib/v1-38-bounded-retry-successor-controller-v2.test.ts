import { spawnSync } from "node:child_process"
import { mkdirSync, mkdtempSync, readdirSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { describe, expect, it } from "vitest"
import {
  checkV138SuccessorControllerV2Source,
  runV138SyntheticSuccessorProtocolV2,
  V138_SUCCESSOR_CONTROLLER_V2_CLI,
  V138_SUCCESSOR_CONTROLLER_V2_OPERATIONS,
} from "./v1-38-bounded-retry-successor-controller-v2.js"
import { V138_DURABLE_PAIR_V2_CLI } from "./v1-38-durable-pair-successor-v2.js"
import { V138_RESTARTABLE_LIFECYCLE_V2_CLI } from "./v1-38-restartable-lifecycle-successor-v2.js"

describe("CR-01 composed source-only successor controller", () => {
  it("executes every successor operation through one contained synthetic protocol", async () => {
    const root = mkdtempSync(path.join(tmpdir(), "v138-controller-e2e-"))
    try {
      const result = await runV138SyntheticSuccessorProtocolV2(root)
      expect(result.operations).toEqual(V138_SUCCESSOR_CONTROLLER_V2_OPERATIONS)
      expect(result).toMatchObject({ acceptedCells: 0, workspaceWrites: false })
      expect(readdirSync(path.join(root, "artifacts"))).toContain("synthetic-review.json")
      expect(readdirSync(path.join(root, "reviews"))).toContain("synthetic-review.md")
      expect(readdirSync(path.join(root, "planning"))).toContain("status.md")
    } finally { rmSync(root, { recursive: true, force: true }) }
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

  it.each([
    [V138_DURABLE_PAIR_V2_CLI, "--synthetic-pair"],
    [V138_DURABLE_PAIR_V2_CLI, "--pair-worker"],
    [V138_RESTARTABLE_LIFECYCLE_V2_CLI, "--synthetic-lifecycle"],
    [V138_RESTARTABLE_LIFECYCLE_V2_CLI, "--lifecycle-worker"],
  ])("rejects removed write-capable surface %s %s without any write", (cli, mode) => {
    const root = mkdtempSync(path.join(tmpdir(), "v138-controller-cli-denial-"))
    try {
      mkdirSync(path.join(root, "sentinel"))
      const before = readdirSync(root)
      const result = spawnSync(process.execPath, ["--import", "tsx", cli, mode, Buffer.from("{}").toString("base64")], { cwd: process.cwd(), encoding: "utf8" })
      expect(result.status).not.toBe(0)
      expect(result.stderr).toMatch(/V138_(PAIR|LIFECYCLE)_V2_LIBRARY_ONLY/u)
      expect(readdirSync(root)).toEqual(before)
    } finally { rmSync(root, { recursive: true, force: true }) }
  })
})
