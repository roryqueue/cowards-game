import { Buffer } from "node:buffer"
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { spawnSync } from "node:child_process"
import { describe, expect, it } from "vitest"
import {
  IMMUTABLE_RUNTIME_SERVICE_V116_DIGESTS,
  RUNTIME_ABI_ACTIVATION_COMMIT,
  RUNTIME_ABI_ACTIVATION_MANIFEST_PATH,
  RUNTIME_ABI_DERIVED_VALIDATION_OUTPUTS,
  RUNTIME_ABI_PHASE258_BASELINE_COMMIT,
  RUNTIME_ABI_PHASE258_PLAN_PATHS,
  RUNTIME_ABI_PREPARED_LIFECYCLE_CONSUMERS,
  RUNTIME_ABI_TEST_RECEIPT_PATH,
  buildRuntimeAbiActivationManifest,
  collectPhase258GitChangedPaths,
  collectPhase258InventoryPaths,
  expandPhase258InventoryPaths,
  parsePlanFilesModified,
  parseRuntimeAbiActivationManifest,
  parseRuntimeAbiActivationAllowlist,
  runtimeAbiActivationDiffArguments,
  verifyPhase258AuthoritativeRegularFiles,
  verifyPhase258GitClosureAncestry,
  verifyPhase258PlanFilesMatchGit,
  verifyPhase258PlanInventoryMatchesGit,
  verifyRuntimeAbiActivationNameStatus,
  verifyImmutableRuntimeServiceV116Digests,
} from "./check-v1-37-runtime-abi-manifest-closure.js"

const readJson = (path: string): unknown =>
  JSON.parse(readFileSync(path, "utf8")) as unknown

describe("Phase 258 runtime ABI activation closure", () => {
  const currentHead = (): string => {
    const result = spawnSync("git", ["rev-parse", "HEAD"], {
      encoding: "utf8",
    })
    if (result.status !== 0) throw new Error("git HEAD unavailable")
    return result.stdout.trim()
  }

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

  it("derives a sorted, cycle-free final inventory from pinned git closure and hashes all fourteen plans", () => {
    expect(
      parsePlanFilesModified(
        "---\nfiles_modified:\n  - z.ts\n  - a.ts\nautonomous: true\n---\n",
      ),
    ).toEqual(["z.ts", "a.ts"])
    const paths = collectPhase258InventoryPaths({ headCommit: currentHead() })
    expect(paths).toEqual([...paths].sort())
    expect(paths).not.toContain(
      "packages/spec/src/fixtures/canonical-json-v1-1-raw",
    )
    expect(paths).toContain(
      "packages/spec/src/fixtures/canonical-json-v1-1-raw/valid-null.raw",
    )
    expect(paths).toContain(RUNTIME_ABI_TEST_RECEIPT_PATH)
    expect(paths).toContain(
      "scripts/check-v1-37-runtime-abi-manifest-closure.ts",
    )
    expect(paths).toContain("scripts/evaluate-v1-37-runtime-abi.ts")
    for (const planPath of RUNTIME_ABI_PHASE258_PLAN_PATHS) {
      expect(paths).toContain(planPath)
    }
    const allowlist = parseRuntimeAbiActivationAllowlist(
      readJson(
        "packages/spec/artifacts/runtime-abi-v1.17-activation-allowlist.json",
      ),
    )
    for (const operation of allowlist.operations) {
      expect(paths, operation.path).toContain(operation.path)
    }
    expect(paths).not.toContain(RUNTIME_ABI_ACTIVATION_MANIFEST_PATH)
    for (const path of RUNTIME_ABI_DERIVED_VALIDATION_OUTPUTS) {
      expect(paths).not.toContain(path)
    }
    expect(() => parsePlanFilesModified("files_modified:\nautonomous: true"))
      .toThrow(/empty or duplicated/iu)
  })

  it("rejects plan inventory removal, unplanned git paths, plan tamper, and wrong ancestry pins", () => {
    const headCommit = currentHead()
    const gitPaths = collectPhase258GitChangedPaths({ headCommit })
    const declaredPaths = expandPhase258InventoryPaths(
      RUNTIME_ABI_PHASE258_PLAN_PATHS.flatMap((planPath) =>
        parsePlanFilesModified(readFileSync(planPath, "utf8")),
      ),
    ).filter(
      (path) =>
        path !== RUNTIME_ABI_ACTIVATION_MANIFEST_PATH &&
        !RUNTIME_ABI_DERIVED_VALIDATION_OUTPUTS.includes(path as never),
    )
    expect(() =>
      verifyPhase258PlanInventoryMatchesGit({
        gitPaths,
        declaredPaths,
      }),
    ).not.toThrow()
    const required = gitPaths.find(
      (path) =>
        ![
          "apps/go-backend/runtime_service_client_test.go",
          "apps/web/app/api/account/revisions/save/route.ts",
          "apps/web/app/workshop/workshop-client.tsx",
          "packages/runtime-js/src/subprocess-ipc.ts",
          "packages/runtime-python/src/python_validation_host.py",
          "packages/spec/src/runtime-execution-service.ts",
          "scripts/evaluate-runtime-sandbox.ts",
        ].includes(path),
    )
    if (required === undefined) throw new Error("required git path missing")
    expect(() =>
      verifyPhase258PlanInventoryMatchesGit({
        gitPaths,
        declaredPaths: declaredPaths.filter((path) => path !== required),
      }),
    ).toThrow(/omitted git path/iu)
    expect(() =>
      verifyPhase258PlanInventoryMatchesGit({
        gitPaths: [...gitPaths, "scripts/fabricated-extra-diff.ts"],
        declaredPaths,
      }),
    ).toThrow(/omitted git path/iu)

    const planSources = new Map(
      RUNTIME_ABI_PHASE258_PLAN_PATHS.map((planPath) => [
        planPath,
        readFileSync(planPath, "utf8"),
      ]),
    )
    const tamperedPath = RUNTIME_ABI_PHASE258_PLAN_PATHS[0]!
    planSources.set(tamperedPath, `${planSources.get(tamperedPath)!}\n# tamper\n`)
    expect(() =>
      verifyPhase258PlanFilesMatchGit({
        headCommit,
        planSources,
      }),
    ).toThrow(/plan bytes do not match closure git/iu)
    expect(() =>
      verifyPhase258GitClosureAncestry({
        baselineCommit: "0".repeat(40),
        headCommit,
      }),
    ).toThrow(/wrong baseline or head/iu)
    expect(() =>
      verifyPhase258GitClosureAncestry({
        baselineCommit: RUNTIME_ABI_PHASE258_BASELINE_COMMIT,
        headCommit: `${RUNTIME_ABI_ACTIVATION_COMMIT.slice(0, 39)}0`,
      }),
    ).toThrow()
  })

  it("expands directories into exact regular files and rejects unsafe filesystem entries", () => {
    const root = mkdtempSync(path.join(tmpdir(), "phase258-inventory-"))
    try {
      mkdirSync(path.join(root, "tree", "nested"), { recursive: true })
      writeFileSync(path.join(root, "tree", "a.txt"), "a")
      writeFileSync(path.join(root, "tree", "nested", "b.txt"), "b")
      expect(expandPhase258InventoryPaths(["tree"], root)).toEqual([
        "tree/a.txt",
        "tree/nested/b.txt",
      ])
      expect(() =>
        expandPhase258InventoryPaths(["tree", "tree/a.txt"], root),
      ).toThrow(/duplicate expanded path/iu)

      mkdirSync(path.join(root, "empty"))
      expect(() => expandPhase258InventoryPaths(["empty"], root)).toThrow(
        /directory is empty/iu,
      )

      symlinkSync("tree/a.txt", path.join(root, "linked.txt"))
      expect(() => expandPhase258InventoryPaths(["linked.txt"], root)).toThrow(
        /symlink/iu,
      )

      if (process.platform !== "win32") {
        const fifoPath = path.join(root, "special")
        const fifo = spawnSync("mkfifo", [fifoPath])
        expect(fifo.status).toBe(0)
        expect(() => expandPhase258InventoryPaths(["special"], root)).toThrow(
          /not a regular file/iu,
        )
        expect(() => expandPhase258InventoryPaths([fifoPath], root)).toThrow(
          /not normalized/iu,
        )
      }

      expect(() => expandPhase258InventoryPaths(["../escape"], root)).toThrow(
        /not normalized|escapes repository/iu,
      )
      expect(() =>
        expandPhase258InventoryPaths(["tree/../tree/a.txt"], root),
      ).toThrow(/not normalized/iu)

      expect(() =>
        verifyPhase258AuthoritativeRegularFiles(["tree"], root),
      ).toThrow(/not a regular file/iu)
      expect(() =>
        verifyPhase258AuthoritativeRegularFiles(["linked.txt"], root),
      ).toThrow(/symlink/iu)
      if (process.platform !== "win32") {
        expect(() =>
          verifyPhase258AuthoritativeRegularFiles(["special"], root),
        ).toThrow(/not a regular file/iu)
      }
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
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

  it("reads the fail-closed counted-lane posture from the canonical policy", () => {
    const manifest = buildRuntimeAbiActivationManifest(undefined, {
      closureHeadCommit: currentHead(),
    })
    expect(manifest.posture).toMatchObject({
      countedEligibleLaneIds: [],
      productionTrustedProducers: [],
      certificationOwner: "Phase 259",
    })
    expect(manifest.inventoryPolicy).toMatchObject({
      baselineCommit: RUNTIME_ABI_PHASE258_BASELINE_COMMIT,
      activationCommit: RUNTIME_ABI_ACTIVATION_COMMIT,
      planFileCount: 14,
    })
    expect(manifest.inventoryPolicy.closureHeadCommit).toMatch(
      /^[0-9a-f]{40}$/u,
    )
    expect(
      manifest.phase258Inventory.filter(({ path }) =>
        RUNTIME_ABI_PHASE258_PLAN_PATHS.includes(path),
      ),
    ).toHaveLength(14)
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
