import { Buffer } from "node:buffer"
import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import {
  IMMUTABLE_RUNTIME_SERVICE_V116_DIGESTS,
  RUNTIME_ABI_ACTIVATION_COMMIT,
  RUNTIME_ABI_ACTIVATION_MANIFEST_PATH,
  RUNTIME_ABI_DERIVED_VALIDATION_OUTPUTS,
  RUNTIME_ABI_PREPARED_LIFECYCLE_CONSUMERS,
  RUNTIME_ABI_TEST_RECEIPT_PATH,
  collectPhase258InventoryPaths,
  parsePlanFilesModified,
  parseRuntimeAbiActivationManifest,
  parseRuntimeAbiActivationAllowlist,
  runtimeAbiActivationDiffArguments,
  verifyRuntimeAbiActivationNameStatus,
  verifyImmutableRuntimeServiceV116Digests,
} from "./check-v1-37-runtime-abi-manifest-closure.js"

const readJson = (path: string): unknown =>
  JSON.parse(readFileSync(path, "utf8")) as unknown

describe("Phase 258 runtime ABI activation closure", () => {
  it("prepares a path/operation allowlist without premature final hashes", () => {
    const allowlist = readJson(
      "packages/spec/artifacts/runtime-abi-v1.17-activation-allowlist.json",
    )
    expect(allowlist).toMatchObject({
      schemaVersion: "runtime-abi-v1.17-activation-allowlist-v1",
      activationPlan: "258-14",
    })
    expect(JSON.stringify(allowlist)).not.toMatch(/sha256|hash/iu)
  })

  it("derives a sorted, cycle-free final inventory from all fourteen plans", () => {
    expect(
      parsePlanFilesModified(
        "---\nfiles_modified:\n  - z.ts\n  - a.ts\nautonomous: true\n---\n",
      ),
    ).toEqual(["z.ts", "a.ts"])
    const paths = collectPhase258InventoryPaths()
    expect(paths).toEqual([...paths].sort())
    expect(paths).toContain(RUNTIME_ABI_TEST_RECEIPT_PATH)
    expect(paths).toContain(
      "scripts/check-v1-37-runtime-abi-manifest-closure.ts",
    )
    expect(paths).toContain("scripts/evaluate-v1-37-runtime-abi.ts")
    expect(paths).not.toContain(RUNTIME_ABI_ACTIVATION_MANIFEST_PATH)
    for (const path of RUNTIME_ABI_DERIVED_VALIDATION_OUTPUTS) {
      expect(paths).not.toContain(path)
    }
    expect(() => parsePlanFilesModified("files_modified:\nautonomous: true"))
      .toThrow(/empty or duplicated/iu)
  })

  it("rejects partial or differently committed postactivation manifests", () => {
    const minimal = {
      schemaVersion: "runtime-abi-v1.17-activation-manifest-v1",
      activationPlan: "258-14",
      activationCommit: RUNTIME_ABI_ACTIVATION_COMMIT,
      activationDiff: [],
      current: {},
      posture: {},
      evidenceAuthority: {},
      testReceipt: {},
      inventoryPolicy: {},
      phase258Inventory: [],
    }
    expect(() => parseRuntimeAbiActivationManifest(minimal)).toThrow(/malformed/iu)
    expect(() =>
      parseRuntimeAbiActivationManifest({
        ...minimal,
        activationCommit: "a".repeat(40),
      }),
    ).toThrow(/malformed/iu)
  })

  it("keeps every v1.17 current/default consumer in the atomic allowlist", () => {
    const allowlist = readJson(
      "packages/spec/artifacts/runtime-abi-v1.17-activation-allowlist.json",
    ) as { operations?: Array<{ path?: string }> }
    const paths = new Set(
      allowlist.operations?.map(({ path }) => path).filter(Boolean),
    )
    for (const path of [
      "packages/spec/src/versions.ts",
      "packages/spec/src/runtime.ts",
      "packages/engine/src/kernel/types.ts",
      "packages/engine/src/types.ts",
      "packages/replay/src/validate.ts",
      "packages/spec/artifacts/v1.37-current-event-coverage.json",
      ".planning/artifacts/v1.37-typescript-backend-runtime-selection-overlay.json",
      ".planning/artifacts/v1.37-typescript-surface-runtime-selection-overlay.json",
      "apps/runtime-service/src/server.ts",
      "apps/go-backend/orchestrator.go",
      "apps/go-backend/completion.go",
      "packages/persistence/src/complete-match.ts",
    ]) {
      expect(paths.has(path), path).toBe(true)
    }
    expect(RUNTIME_ABI_PREPARED_LIFECYCLE_CONSUMERS).toContain(
      "scripts/check-boundary-monitors.ts",
    )
    const boundarySource = readFileSync(
      "scripts/check-boundary-monitors.ts",
      "utf8",
    )
    expect(boundarySource).toContain(
      "CURRENT_CANONICAL_COMPATIBILITY_TUPLE_RECORD.tuple.runtimeAbi",
    )
    expect(boundarySource).not.toMatch(
      /STRATEGY_RUNTIME_ABI_VERSION\s*!==\s*["']strategy-runtime-abi-v1\.14["']/u,
    )
  })

  it("enforces the exact staged and recorded-commit activation name-status set", () => {
    const allowlist = parseRuntimeAbiActivationAllowlist(
      readJson(
        "packages/spec/artifacts/runtime-abi-v1.17-activation-allowlist.json",
      ),
    )
    const exact = allowlist.operations
      .map(
        ({ path, operation }) =>
          `${operation === "create" ? "A" : "M"}\t${path}`,
      )
      .join("\n")
    expect(() =>
      verifyRuntimeAbiActivationNameStatus(allowlist, exact),
    ).not.toThrow()
    expect(runtimeAbiActivationDiffArguments({ mode: "staged" })).toEqual([
      "diff",
      "--cached",
      "--name-status",
      "--no-renames",
    ])
    const activationCommit = RUNTIME_ABI_ACTIVATION_COMMIT
    expect(
      runtimeAbiActivationDiffArguments({
        mode: "committed",
        activationCommit,
      }),
    ).toEqual([
      "diff",
      "--name-status",
      "--no-renames",
      `${activationCommit}^`,
      activationCommit,
    ])
    expect(() =>
      runtimeAbiActivationDiffArguments({ mode: "committed" }),
    ).toThrow(/explicit 40-character activation commit/iu)

    const lines = exact.split("\n")
    const maliciousDiffs = [
      lines.slice(1).join("\n"),
      `${exact}\nM\tscripts/arbitrary-extra.ts`,
      [`A\t${allowlist.operations[0]!.path}`, ...lines.slice(1)].join("\n"),
      [`D\t${allowlist.operations[0]!.path}`, ...lines.slice(1)].join("\n"),
      `R100\t${allowlist.operations[0]!.path}\tscripts/renamed.ts\n${lines
        .slice(1)
        .join("\n")}`,
    ]
    for (const nameStatus of maliciousDiffs) {
      expect(() =>
        verifyRuntimeAbiActivationNameStatus(allowlist, nameStatus),
      ).toThrow(/activation diff/iu)
    }
  })

  it("pins exact v1.16 bytes and rejects a one-byte historical mutation", () => {
    expect(Object.keys(IMMUTABLE_RUNTIME_SERVICE_V116_DIGESTS)).toHaveLength(6)
    expect(() => verifyImmutableRuntimeServiceV116Digests()).not.toThrow()
    const mutatedPath =
      "packages/spec/artifacts/runtime-execution-service-request.v1.16.json"
    expect(() =>
      verifyImmutableRuntimeServiceV116Digests((path) => {
        const bytes = readFileSync(path)
        if (path !== mutatedPath) return bytes
        const mutated = Buffer.from(bytes)
        mutated[0] = mutated[0]! ^ 1
        return mutated
      }),
    ).toThrow(/Immutable v1\.16 digest changed/u)
  })
})
