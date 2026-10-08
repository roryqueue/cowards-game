/** Source-only gates: no empirical reader, provider, allocation or dispatch. */
import { afterEach, describe, expect, it, vi } from "vitest"
import {
  readFileSync,
  mkdtempSync,
  realpathSync,
  writeFileSync,
  appendFileSync,
  unlinkSync,
  rmSync,
} from "node:fs"
import * as fs from "node:fs"
import * as child from "node:child_process"
import { join, resolve } from "node:path"
import { tmpdir } from "node:os"
import {
  leanTwoPairDocumentsV11,
  leanCorrectionSourceManifest,
  authenticateLeanCorrectionReview,
  inventoryLeanTwoPairNoRefundV11,
} from "./run-v1-38-lean-correction.js"
import {
  LEAN_REMAINING_V9_PHASE,
  LEAN_TWO_PAIR_V11_EXTENSION,
  LEAN_TWO_PAIR_V11_REPORT_PATHS,
  leanBytesRoot,
} from "../packages/strategy-lab/src/league/lean-experiment.js"
vi.mock("node:fs", async () => ({
  ...(await vi.importActual<typeof import("node:fs")>("node:fs")),
}))
vi.mock("node:child_process", async () => ({
  ...(await vi.importActual<typeof import("node:child_process")>(
    "node:child_process",
  )),
}))
afterEach(() => vi.restoreAllMocks())

describe("v11 compile-once prospective source gate", () => {
  it("preserves mode-one old review mapping and requires fresh mode-two review v3", () => {
    for (const route of ["diagnostic", "baseline"] as const) {
      expect(leanTwoPairDocumentsV11(route, "v11-1").review).toBe(
        `${LEAN_REMAINING_V9_PHASE}265-16-TWO-PAIR-SOURCE-REVIEW-v2.md`,
      )
      expect(leanTwoPairDocumentsV11(route, "v11-2").review).toBe(
        `${LEAN_REMAINING_V9_PHASE}265-16-TWO-PAIR-SOURCE-REVIEW-v3.md`,
      )
    }
  })
  it("positively inventories every new source gate report without replacing old custody", () => {
    for (const name of [
      "SOURCE-REVIEW-v2",
      "SOURCE-REVIEW-v3",
      "COMPILE-ONCE-RESEARCH-v1",
      "COMPILE-ONCE-PLAN-v1",
      "COMPILE-ONCE-PLAN-CHECK-v1",
      "COMPILE-ONCE-SOURCE-SUMMARY-v1",
      "COMPILE-ONCE-REVIEW-v1",
      "COMPILE-ONCE-VALIDATION-v1",
      "COMPILE-ONCE-SOURCE-VERIFICATION-v1",
    ]) {
      expect(LEAN_TWO_PAIR_V11_REPORT_PATHS).toContain(
        `${LEAN_REMAINING_V9_PHASE}265-16-TWO-PAIR-${name}.md`,
      )
    }
    expect(new Set(LEAN_TWO_PAIR_V11_REPORT_PATHS).size).toBe(
      LEAN_TWO_PAIR_V11_REPORT_PATHS.length,
    )
  })
  it("binds both ordinals to exact source and rejects old review under changed source", () => {
    const one = leanCorrectionSourceManifest(
        "v11-1",
        LEAN_TWO_PAIR_V11_EXTENSION,
      ),
      two = leanCorrectionSourceManifest("v11-2", LEAN_TWO_PAIR_V11_EXTENSION)
    expect(two).toEqual(one)
    expect(one.entries.map((row) => row.path)).toContain(
      "packages/runtime-js/src/revision-compile-once.test.ts",
    )
    expect(one.entries.map((row) => row.path)).toContain(
      "scripts/run-v1-38-lean-compile-once.test.ts",
    )
    const path = leanTwoPairDocumentsV11("diagnostic", "v11-1").review,
      bytes = readFileSync(path)
    expect(() =>
      authenticateLeanCorrectionReview(
        path,
        leanBytesRoot(bytes),
        two.root,
        null,
        undefined,
        "v11-2",
        LEAN_TWO_PAIR_V11_EXTENSION,
      ),
    ).toThrow("REVIEW")
  })
  it("authenticates a fresh manifest and real reviewed commit, rejecting a changed source root", () => {
    const source = leanCorrectionSourceManifest(
      "v11-2",
      LEAN_TWO_PAIR_V11_EXTENSION,
    )
    const path = leanTwoPairDocumentsV11("diagnostic", "v11-2").review
    const commit = child
      .execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" })
      .trim()
    const bytes = Buffer.from(
      `---\nstatus: clean\nsource_root: ${source.root}\nsource_commit: ${commit}\nindependently_reviewed: true\nauthor_agent: /root/execute_v11_compile_once\nreviewer_agent: /root/inert_review\n---\n`,
    )
    const nativeRead = fs.readFileSync
    vi.spyOn(fs, "readFileSync").mockImplementation(((
      file: unknown,
      ...args: unknown[]
    ) =>
      resolve(String(file)) === resolve(path)
        ? bytes
        : Reflect.apply(nativeRead, fs, [
            file,
            ...args,
          ])) as typeof fs.readFileSync)
    const diff = vi
      .spyOn(child, "execFileSync")
      .mockReturnValue(Buffer.alloc(0))
    expect(() =>
      authenticateLeanCorrectionReview(
        path,
        leanBytesRoot(bytes),
        source.root,
        null,
        undefined,
        "v11-2",
        LEAN_TWO_PAIR_V11_EXTENSION,
      ),
    ).not.toThrow()
    expect(diff).toHaveBeenCalledWith(
      "git",
      [
        "diff",
        "--exit-code",
        commit,
        "--",
        ...source.entries.map((row) => row.path),
      ],
      expect.any(Object),
    )
    expect(() =>
      authenticateLeanCorrectionReview(
        path,
        leanBytesRoot(bytes),
        `sha256:${"0".repeat(64)}`,
        null,
        undefined,
        "v11-2",
        LEAN_TWO_PAIR_V11_EXTENSION,
      ),
    ).toThrow("REVIEW")
  })
  it("positively debits new report growth and rejects deletion or shrink without refund", () => {
    const directory = realpathSync(
        mkdtempSync(join(tmpdir(), "compile-once-inventory-")),
      ),
      report = join(directory, "new-source-review-v3.md")
    try {
      const prior = { allocatedDiskBytes: 19427328, survivors: [] }
      writeFileSync(report, "source-only gate", { mode: 0o600 })
      const first = inventoryLeanTwoPairNoRefundV11(prior, [report])
      expect(first.allocatedDiskBytes).toBeGreaterThan(prior.allocatedDiskBytes)
      appendFileSync(report, "growth".repeat(10000))
      const grown = inventoryLeanTwoPairNoRefundV11(first, [report])
      expect(grown.allocatedDiskBytes).toBeGreaterThan(first.allocatedDiskBytes)
      writeFileSync(report, "small")
      expect(() => inventoryLeanTwoPairNoRefundV11(grown, [])).toThrow(
        "PREDECESSOR_DRIFT",
      )
      unlinkSync(report)
      expect(() => inventoryLeanTwoPairNoRefundV11(grown, [])).toThrow()
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })
})
