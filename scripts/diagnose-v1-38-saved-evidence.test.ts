import { describe, expect, it, vi } from "vitest"
import {
  assertNoOriginRows,
  diagnoseSavedEvidence,
  type SavedEvidenceDiagnosticDependencies,
} from "./diagnose-v1-38-saved-evidence.js"

const inventory = () => ({
  root: "sha256:input-root",
  fileCount: 3,
  totalBytes: 128,
  custodyOk: true,
})
const loaded = () => ({
  snapshot: { fixture: "synthetic-only" },
  historical: {
    sourceRoot:
      "sha256:1087ef46736e1406bd0febf10755d5ec890f1c388a3a567d45479e251152ccb5",
    heldHead: "b56ce9be6163556d88caa2995f36839fa49c0528",
    allocationRoot:
      "sha256:aff06160f3852f3efd4fdc7a5ecd52b7025eda32c58e82d58e526c090fbd8cf5",
    allocationBytesRoot:
      "sha256:adf7c4567e676abd33516b7e2e1d4b9470be041ebf1724ff7f812b8400d2f0b9",
  },
  currentCheckerSourceRoot:
    "sha256:726ae66ff9f656247af0992a6fbadf48c2b550a41d97b8b69363f10e91262add",
})
const makeDeps = (
  overrides: Partial<SavedEvidenceDiagnosticDependencies> = {},
) => {
  const writes: Array<{ identity: string; result: unknown }> = []
  const deps: SavedEvidenceDiagnosticDependencies = {
    entryExists: () => false,
    inputInventory: inventory,
    loadSnapshot: loaded,
    audit: (_snapshot, guard) => {
      guard()
      return { accepted: true, issued: true, root: "sha256:discard-me" }
    },
    trustedFailureCode: () => null,
    writeExclusive: (identity, result) => {
      writes.push({ identity, result })
    },
    now: () => 1234,
    elapsed: () => 1,
    rssBytes: () => 1024,
    ...overrides,
  }
  return { deps, writes }
}

describe("saved v3 evidence diagnostic source-only boundary", () => {
  it("always discards successful audit authority and emits a non-authorizing safe result", () => {
    const { deps, writes } = makeDeps()
    const result = diagnoseSavedEvidence(deps)
    expect(result).toMatchObject({
      code: "NO_CORE_AUDIT_REFUSAL_REPRODUCED",
      accepted: false,
      issued: false,
      non_authorizing: true,
    })
    expect(result).not.toHaveProperty("root", "sha256:discard-me")
    expect(result).toMatchObject({
      historicalSourceRoot:
        "sha256:1087ef46736e1406bd0febf10755d5ec890f1c388a3a567d45479e251152ccb5",
      historicalHeldHead: "b56ce9be6163556d88caa2995f36839fa49c0528",
      historicalAllocationRoot:
        "sha256:aff06160f3852f3efd4fdc7a5ecd52b7025eda32c58e82d58e526c090fbd8cf5",
      historicalAllocationBytesRoot:
        "sha256:adf7c4567e676abd33516b7e2e1d4b9470be041ebf1724ff7f812b8400d2f0b9",
      currentCheckerSourceRoot:
        "sha256:726ae66ff9f656247af0992a6fbadf48c2b550a41d97b8b69363f10e91262add",
    })
    expect(writes).toHaveLength(2)
    expect(writes.map((write) => write.identity)).toEqual(["entry", "result"])
    expect(JSON.stringify(result)).not.toMatch(/fixture|discard-me/u)
  })

  it("projects only a trusted finite branded failure and otherwise reports UNKNOWN without error text", () => {
    const safe = makeDeps({
      audit: () => {
        throw new Error("synthetic guard")
      },
      trustedFailureCode: () => "LEAN_CORRECTION_RETAINED_INVENTORY",
    })
    expect(diagnoseSavedEvidence(safe.deps)).toMatchObject({
      code: "LEAN_CORRECTION_RETAINED_INVENTORY",
      stage: "audit",
      accepted: false,
      issued: false,
      non_authorizing: true,
    })

    for (const error of [
      new Error("PRIVATE_SOURCE"),
      { message: "OBJECTIVE_SECRET" },
      new Error("STRATEGY_MEMORY_SECRET"),
    ]) {
      const untrusted = makeDeps({
        audit: () => {
          throw error
        },
        trustedFailureCode: () => null,
      })
      const result = diagnoseSavedEvidence(untrusted.deps)
      expect(result).toMatchObject({
        code: "UNKNOWN",
        stage: "audit",
        accepted: false,
        issued: false,
        non_authorizing: true,
      })
      expect(JSON.stringify(result)).not.toMatch(
        /PRIVATE_SOURCE|OBJECTIVE_SECRET|STRATEGY_MEMORY_SECRET/u,
      )
    }
    const forgedProjection = makeDeps({
      audit: () => {
        throw new Error("synthetic")
      },
      trustedFailureCode: () => "PRIVATE_SOURCE",
    })
    expect(diagnoseSavedEvidence(forgedProjection.deps)).toMatchObject({
      code: "UNKNOWN",
      stage: "audit",
      non_authorizing: true,
    })
  })

  it("blocks origin rows before the retained audit can construct a strategy revision", () => {
    expect(() =>
      assertNoOriginRows({ origins: [{ sourceRoot: "synthetic" }] }),
    ).toThrow()
    expect(() => assertNoOriginRows({ origins: [] })).not.toThrow()
  })

  it("keeps current checker provenance distinct and does not run audit on drift", () => {
    const audit = vi.fn()
    const { deps } = makeDeps({
      loadSnapshot: () => ({
        ...loaded(),
        currentCheckerSourceRoot: "sha256:changed-current-source",
      }),
      audit,
    })
    expect(diagnoseSavedEvidence(deps)).toMatchObject({
      code: "CURRENT_READER_PROVENANCE_MISMATCH",
      stage: "current_reader_provenance",
      historicalSourceRoot: loaded().historical.sourceRoot,
      currentCheckerSourceRoot: "sha256:changed-current-source",
      accepted: false,
      issued: false,
      non_authorizing: true,
    })
    expect(audit).not.toHaveBeenCalled()
  })

  it("refuses a repeated identity before inventory, snapshot loading, or audit", () => {
    const inputInventory = vi.fn(inventory),
      loadSnapshot = vi.fn(loaded),
      audit = vi.fn()
    const { deps } = makeDeps({
      entryExists: () => true,
      inputInventory,
      loadSnapshot,
      audit,
    })
    expect(() => diagnoseSavedEvidence(deps)).toThrow()
    expect(inputInventory).not.toHaveBeenCalled()
    expect(loadSnapshot).not.toHaveBeenCalled()
    expect(audit).not.toHaveBeenCalled()
  })

  it("rejects changed input inventory and never publishes a result as accepted", () => {
    const roots = [inventory(), { ...inventory(), root: "sha256:mutated" }]
    let index = 0
    const { deps, writes } = makeDeps({ inputInventory: () => roots[index++]! })
    const result = diagnoseSavedEvidence(deps)
    expect(result).toMatchObject({
      code: "INPUT_MUTATION",
      accepted: false,
      issued: false,
      non_authorizing: true,
    })
    expect(writes.at(-1)?.result).toMatchObject({
      accepted: false,
      issued: false,
      non_authorizing: true,
    })
  })

  it("rechecks input bytes after a loader exception and reports only safe mutation status", () => {
    const roots = [
      inventory(),
      { ...inventory(), root: "sha256:changed-during-load" },
    ]
    let index = 0
    const { deps, writes } = makeDeps({
      inputInventory: () => roots[index++]!,
      loadSnapshot: () => {
        throw new Error("STRATEGY_SOURCE_PRIVATE")
      },
    })
    const result = diagnoseSavedEvidence(deps)
    expect(result).toMatchObject({
      code: "INPUT_MUTATION",
      stage: "snapshot",
      accepted: false,
      issued: false,
      non_authorizing: true,
    })
    expect(JSON.stringify(result)).not.toContain("STRATEGY_SOURCE_PRIVATE")
    expect(writes.at(-1)?.result).toMatchObject({
      accepted: false,
      issued: false,
      non_authorizing: true,
    })
  })
})
