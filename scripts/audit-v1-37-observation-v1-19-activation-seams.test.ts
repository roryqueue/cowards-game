import { Buffer } from "node:buffer"
import { spawnSync } from "node:child_process"
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { ACTIVATION_SELECTOR_PATHS } from "./activate-v1-37-observation-v1-19.js"
import {
  DECLARED_STALE_SEAM_PATHS,
  STALE_SEAM_INVENTORY_PATH,
  auditV137ObservationV119ActivationSeams,
  validateActivationSeamInventory,
  type ActivationSeamInventory,
} from "./audit-v1-37-observation-v1-19-activation-seams.js"

const hash = (character: string): string => `sha256:${character.repeat(64)}`

const inventory = (): ActivationSeamInventory => ({
  schemaVersion: "v1.37-observation-v1.19-stale-seam-inventory-v1",
  milestone: "v1.37",
  phase: 260,
  plan: 33,
  lifecycle: "preactivation-only",
  status: "passed",
  simulation: {
    isolation: "disposable-shared-clone",
    mutationPolicy: "exact-five-selector-flip",
    autoFix: false,
    allowedMutationPaths: [...ACTIVATION_SELECTOR_PATHS].sort(),
    selectorPreimage: [...ACTIVATION_SELECTOR_PATHS]
      .sort()
      .map((path) => ({ path, sha256: hash("1") })),
    selectorTarget: [...ACTIVATION_SELECTOR_PATHS]
      .sort()
      .map((path) => ({ path, sha256: hash("2") })),
    cloneDisposed: true,
  },
  mainTree: {
    allowedDirtyPaths: [
      ".planning/config.json",
      "CowardsGameSpec_Full_Consolidated_v1.md",
    ],
    preStatusSha256: hash("3"),
    postStatusSha256: hash("3"),
    protectedBaselineSha256: hash("4"),
    dependencyPreimageSha256: hash("7"),
    dependencyPostimageSha256: hash("7"),
    unchanged: true,
  },
  declaredSeams: DECLARED_STALE_SEAM_PATHS.map((path) => ({
    path,
    disposition: "historical-v1.17-plus-current-resolver",
  })),
  gate: {
    id: "declared-stale-seams",
    command: [
      "node_modules/.bin/vitest",
      "run",
      ...DECLARED_STALE_SEAM_PATHS,
      "--maxWorkers=1",
      "--no-file-parallelism",
      "--no-cache",
    ].join(" "),
    status: "passed",
    exitCode: 0,
    stdoutSha256: hash("5"),
    stderrSha256: hash("6"),
    dependencyExecution: "already-installed-direct-vitest",
    packageManagerInvoked: false,
    dependencyPreimageSha256: hash("7"),
    dependencyPostimageSha256: hash("7"),
    dependencyTreeUnchanged: true,
  },
  findings: [],
  findingCount: 0,
})

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

describe("v1.37 observation v1.19 activation seam audit", () => {
  it("accepts only the exact five-selector, four-seam, zero-finding contract", () => {
    expect(validateActivationSeamInventory(inventory())).toEqual([])
    expect(ACTIVATION_SELECTOR_PATHS).toHaveLength(5)
    expect(DECLARED_STALE_SEAM_PATHS).toHaveLength(4)
    expect(ACTIVATION_SELECTOR_PATHS).not.toContain(".planning/config.json")
    expect(ACTIVATION_SELECTOR_PATHS).not.toContain(
      "CowardsGameSpec_Full_Consolidated_v1.md",
    )
  })

  it.each([
    [
      "protected mutation",
      (value: ActivationSeamInventory) => {
        ;(value.simulation.allowedMutationPaths as string[]).push(
          ".planning/config.json",
        )
      },
    ],
    [
      "undeclared mutation",
      (value: ActivationSeamInventory) => {
        ;(value.simulation.allowedMutationPaths as string[]).push(
          "packages/spec/src/versions.ts",
        )
      },
    ],
    [
      "main-tree drift",
      (value: ActivationSeamInventory) => {
        ;(value.mainTree as { postStatusSha256: string }).postStatusSha256 =
          hash("9")
      },
    ],
    [
      "auto-fix",
      (value: ActivationSeamInventory) => {
        ;(value.simulation as { autoFix: boolean }).autoFix = true
      },
    ],
    [
      "invalid dependency postimage",
      (value: ActivationSeamInventory) => {
        ;(value.gate as { dependencyPostimageSha256: string })
          .dependencyPostimageSha256 = "not-a-hash"
        ;(value.gate as { dependencyTreeUnchanged: boolean })
          .dependencyTreeUnchanged = false
        ;(value.gate as { status: string }).status = "failed"
      },
    ],
  ])("rejects %s", (_name, mutate) => {
    const value = clone(inventory())
    mutate(value)
    expect(validateActivationSeamInventory(value)).not.toEqual([])
  })

  it("represents a nonzero gate result as a failed inventory, never success", () => {
    const value = clone(inventory())
    ;(value as { status: string }).status = "failed"
    ;(value.gate as { status: string }).status = "failed"
    ;(value.gate as { exitCode: number }).exitCode = 1
    ;(value.findings as unknown as Array<Record<string, unknown>>).push({
      id: "declared-stale-seam-gate-failed",
      classification: "declared-gate-failure",
      path: null,
    })
    ;(value as { findingCount: number }).findingCount = 1
    expect(validateActivationSeamInventory(value)).toEqual([])
    expect(value.status).toBe("failed")
  })

  it("keeps an injected failed gate isolated and dependency-preserving", () => {
    const result = auditV137ObservationV119ActivationSeams(process.cwd(), {
      gateRunner: () => ({
        exitCode: 1,
        stdout: Buffer.from("declared gate output"),
        stderr: Buffer.from("declared gate failed"),
      }),
    })
    expect(result.status).toBe("failed")
    expect(result.findings).toEqual([
      {
        id: "declared-stale-seam-gate-failed",
        classification: "declared-gate-failure",
        path: null,
      },
    ])
    expect(result.gate.dependencyExecution).toBe(
      "already-installed-direct-vitest",
    )
    expect(result.gate.packageManagerInvoked).toBe(false)
    expect(result.gate.dependencyTreeUnchanged).toBe(true)
    expect(result.mainTree.dependencyPreimageSha256).toBe(
      result.mainTree.dependencyPostimageSha256,
    )
    expect(result.simulation.cloneDisposed).toBe(true)
  }, 120_000)

  it("materializes dependency bytes so an injected clone mutation cannot reach the main tree", () => {
    const dependencyPath = "node_modules/vitest/dist/index.js"
    const mainDependencyPath = path.join(process.cwd(), dependencyPath)
    const mainPreimage = readFileSync(mainDependencyPath)
    let cloneMutationObserved = false

    const result = auditV137ObservationV119ActivationSeams(process.cwd(), {
      gateRunner: (cwd) => {
        const cloneDependencyPath = path.join(cwd, dependencyPath)
        writeFileSync(
          cloneDependencyPath,
          Buffer.concat([
            readFileSync(cloneDependencyPath),
            Buffer.from("\n// injected disposable-clone mutation\n"),
          ]),
        )
        cloneMutationObserved =
          !readFileSync(cloneDependencyPath).equals(mainPreimage)
        return {
          exitCode: 0,
          stdout: Buffer.from("dependency mutation attempted"),
          stderr: Buffer.alloc(0),
        }
      },
    })

    expect(cloneMutationObserved).toBe(true)
    expect(readFileSync(mainDependencyPath)).toEqual(mainPreimage)
    expect(result.status).toBe("failed")
    expect(result.gate).toMatchObject({
      status: "failed",
      exitCode: 0,
      dependencyTreeUnchanged: false,
    })
    expect(result.findings).toContainEqual({
      id: "dependency-tree-mutated",
      classification: "undeclared-mutation",
      path: null,
    })
    expect(result.gate.dependencyPreimageSha256).not.toBe(
      result.gate.dependencyPostimageSha256,
    )
    expect(result.mainTree.dependencyPreimageSha256).toBe(
      result.mainTree.dependencyPostimageSha256,
    )
    expect(result.simulation.cloneDisposed).toBe(true)
  }, 120_000)

  it("fails closed when a successful injected gate creates an untracked clone file", () => {
    const undeclaredPath = "packages/spec/src/undeclared-seam-probe.tmp"
    const result = auditV137ObservationV119ActivationSeams(process.cwd(), {
      gateRunner: (cwd) => {
        writeFileSync(path.join(cwd, undeclaredPath), "injected\n")
        return {
          exitCode: 0,
          stdout: Buffer.from("untracked mutation attempted"),
          stderr: Buffer.alloc(0),
        }
      },
    })

    expect(result.status).toBe("failed")
    expect(result.gate).toMatchObject({
      status: "passed",
      exitCode: 0,
      dependencyTreeUnchanged: true,
    })
    expect(result.findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          classification: "undeclared-mutation",
          path: undeclaredPath,
        }),
      ]),
    )
    expect(result.simulation.cloneDisposed).toBe(true)
  }, 120_000)

  it("rejects every auto-fix CLI and leaves the inventory bytes untouched", () => {
    const existed = existsSync(STALE_SEAM_INVENTORY_PATH)
    const before = existed
      ? readFileSync(STALE_SEAM_INVENTORY_PATH)
      : Buffer.alloc(0)
    const result = spawnSync(
      "pnpm",
      [
        "exec",
        "tsx",
        "scripts/audit-v1-37-observation-v1-19-activation-seams.ts",
        "--auto-fix",
      ],
      { cwd: process.cwd(), encoding: "utf8" },
    )
    expect(result.status).not.toBe(0)
    expect(result.stderr).toContain("usage: --write | --check")
    expect(existsSync(STALE_SEAM_INVENTORY_PATH)).toBe(existed)
    if (existed) expect(readFileSync(STALE_SEAM_INVENTORY_PATH)).toEqual(before)
  })

  it("runs the real selector-only simulation in a disposed shared clone", () => {
    const result = auditV137ObservationV119ActivationSeams(process.cwd())
    expect(result.status).toBe("passed")
    expect(result.findings).toEqual([])
    expect(result.findingCount).toBe(0)
    expect(result.simulation.cloneDisposed).toBe(true)
    expect(result.gate.command.startsWith("node_modules/.bin/vitest run")).toBe(
      true,
    )
    expect(result.gate.packageManagerInvoked).toBe(false)
    expect(result.gate.dependencyTreeUnchanged).toBe(true)
    expect(result.mainTree.preStatusSha256).toBe(
      result.mainTree.postStatusSha256,
    )
  }, 120_000)
})
