/** Negative HOST custody proof only; no fabricated successful diagnostic. */
import { expect, it, vi } from "vitest"
import { mkdtempSync, realpathSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import * as correction from "../run-v1-38-lean-correction.js"
import * as retained from "./v1-38-lean-correction-retained.js"

it("new accepted-join dispatch rejects missing real same-pair custody on every call", () => {
  const directory = realpathSync(mkdtempSync(join(tmpdir(), "v14-custody-host-"))), before = process.cwd()
  const audit = vi.spyOn(retained, "authenticateLeanRetryClosureV8")
  try {
    process.chdir(directory)
    for (let n = 0; n < 3; n++) expect(() => correction.authenticateLeanPostV13FivePairAcceptedJoinV14("v14-1")).toThrow()
    expect(audit).toHaveBeenCalledTimes(3)
    for (const mode of ["v13-1", "v14-0", "v14-6"]) expect(() => correction.authenticateLeanPostV13FivePairAcceptedJoinV14(mode as never)).toThrow()
    expect(audit).toHaveBeenCalledTimes(3)
  } finally { process.chdir(before); audit.mockRestore(); rmSync(directory, { recursive: true, force: true }) }
})

it("legacy request authorities cannot enter the v14 data path or reopen old readers", () => {
  for (const route of ["diagnostic", "baseline"] as const) {
    expect(() => correction.readLeanRemainingRequestV9(".strategy-lab/old-request.json", route, "v14-1")).toThrow("POST_V13_CUSTODY_UNAVAILABLE")
  }
})
