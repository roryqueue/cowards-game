#!/usr/bin/env -S pnpm exec tsx
import { Buffer } from "node:buffer"
import { execFileSync, spawnSync } from "node:child_process"
import { createHash, randomUUID } from "node:crypto"
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import {
  ACTIVATION_SELECTOR_PATHS,
  buildV119SelectorBytes,
} from "./activate-v1-37-observation-v1-19.js"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const SHA256 = /^sha256:[0-9a-f]{64}$/u

export const STALE_SEAM_INVENTORY_PATH =
  ".planning/artifacts/v1.37-observation-v1.19-stale-seam-inventory.json"

export const DECLARED_STALE_SEAM_PATHS = Object.freeze([
  "packages/golden/src/v1-37-conformance-corpus.test.ts",
  "scripts/generate-v1-37-conformance-corpus.test.ts",
  "packages/replay/src/record.test.ts",
  "apps/web/app/matchsets/result-view-model.test.ts",
])

const PROTECTED_PATHS = Object.freeze([
  ".planning/config.json",
  "CowardsGameSpec_Full_Consolidated_v1.md",
])

const GATE_COMMAND = Object.freeze([
  "pnpm",
  "exec",
  "vitest",
  "run",
  ...DECLARED_STALE_SEAM_PATHS,
  "--maxWorkers=1",
  "--no-file-parallelism",
])

export interface ActivationSeamFinding {
  readonly id: string
  readonly classification: "declared-gate-failure" | "undeclared-mutation"
  readonly path: string | null
}

export interface ActivationSeamInventory {
  readonly schemaVersion: "v1.37-observation-v1.19-stale-seam-inventory-v1"
  readonly milestone: "v1.37"
  readonly phase: 260
  readonly plan: 33
  readonly lifecycle: "preactivation-only"
  readonly status: "passed" | "failed"
  readonly simulation: {
    readonly isolation: "disposable-shared-clone"
    readonly mutationPolicy: "exact-five-selector-flip"
    readonly autoFix: false
    readonly allowedMutationPaths: readonly string[]
    readonly selectorPreimage: readonly { path: string; sha256: string }[]
    readonly selectorTarget: readonly { path: string; sha256: string }[]
    readonly cloneDisposed: true
  }
  readonly mainTree: {
    readonly allowedDirtyPaths: readonly string[]
    readonly preStatusSha256: string
    readonly postStatusSha256: string
    readonly protectedBaselineSha256: string
    readonly unchanged: true
  }
  readonly declaredSeams: readonly {
    readonly path: string
    readonly disposition: "historical-v1.17-plus-current-resolver"
  }[]
  readonly gate: {
    readonly id: "declared-stale-seams"
    readonly command: string
    readonly status: "passed" | "failed"
    readonly exitCode: number
    readonly stdoutSha256: string
    readonly stderrSha256: string
  }
  readonly findings: readonly ActivationSeamFinding[]
  readonly findingCount: number
}

export interface ActivationSeamAuditOptions {
  readonly gateRunner?: (cwd: string) => Readonly<{
    exitCode: number
    stdout: Uint8Array
    stderr: Uint8Array
  }>
}

const sha256 = (value: string | Uint8Array): string =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`

const git = (repoRoot: string, args: readonly string[]): Buffer =>
  execFileSync("git", [...args], {
    cwd: repoRoot,
    encoding: "buffer",
    maxBuffer: 64 * 1024 * 1024,
  })

const repositoryStatus = (repoRoot: string): Buffer =>
  git(repoRoot, ["status", "--porcelain=v1", "-z", "--untracked-files=all"])

const statusPaths = (status: Buffer): string[] =>
  status
    .toString("utf8")
    .split("\0")
    .filter(Boolean)
    .map((entry) => entry.slice(3))
    .sort()

const exactArray = (
  left: readonly string[],
  right: readonly string[],
): boolean =>
  left.length === right.length &&
  left.every((value, index) => value === right[index])

const assertMainTreeBoundary = (repoRoot: string): Buffer => {
  const status = repositoryStatus(repoRoot)
  if (!exactArray(statusPaths(status), [...PROTECTED_PATHS].sort())) {
    throw new Error("Activation seam audit main-tree allowlist mismatch")
  }
  const baseline = spawnSync(
    "pnpm",
    ["exec", "tsx", "scripts/capture-v1-37-protected-baseline.ts", "--check"],
    { cwd: repoRoot, encoding: "buffer", maxBuffer: 16 * 1024 * 1024 },
  )
  if (baseline.status !== 0 || baseline.error !== undefined) {
    throw new Error("Activation seam audit protected baseline mismatch")
  }
  return status
}

const discoverNodeModulePaths = (
  sourceRoot: string,
  current: string = sourceRoot,
): string[] => {
  const paths: string[] = []
  for (const entry of readdirSync(current, { withFileTypes: true })) {
    if (entry.name === ".git") continue
    const absolute = path.join(current, entry.name)
    if (entry.name === "node_modules") {
      paths.push(absolute)
      continue
    }
    if (
      entry.isDirectory() &&
      ![".next", ".turbo", "coverage", "dist", "target"].includes(entry.name)
    ) {
      paths.push(...discoverNodeModulePaths(sourceRoot, absolute))
    }
  }
  return paths
}

const linkNodeModules = (sourceRoot: string, cloneRoot: string): void => {
  for (const source of discoverNodeModulePaths(sourceRoot)) {
    const target = path.join(cloneRoot, path.relative(sourceRoot, source))
    mkdirSync(path.dirname(target), { recursive: true })
    symlinkSync(source, target, "junction")
  }
}

const selectorManifest = (
  repoRoot: string,
  target?: ReadonlyMap<string, Uint8Array>,
): Array<{ path: string; sha256: string }> =>
  [...ACTIVATION_SELECTOR_PATHS].sort().map((selectorPath) => ({
    path: selectorPath,
    sha256: sha256(
      target?.get(selectorPath) ??
        readFileSync(path.join(repoRoot, selectorPath)),
    ),
  }))

const defaultGateRunner = (cwd: string) => {
  const [command, ...args] = GATE_COMMAND
  const result = spawnSync(command!, args, {
    cwd,
    env: {
      ...process.env,
      PATH: `/usr/local/go/bin:${process.env.PATH ?? ""}`,
    },
    encoding: "buffer",
    maxBuffer: 128 * 1024 * 1024,
    timeout: 10 * 60 * 1_000,
  })
  return {
    exitCode: result.status ?? 1,
    stdout: result.stdout ?? Buffer.alloc(0),
    stderr: result.stderr ?? Buffer.from(String(result.error ?? "")),
  }
}

export const validateActivationSeamInventory = (value: unknown): string[] => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return ["inventory shape"]
  }
  const inventory = value as ActivationSeamInventory
  const errors: string[] = []
  if (
    inventory.schemaVersion !==
      "v1.37-observation-v1.19-stale-seam-inventory-v1" ||
    inventory.milestone !== "v1.37" ||
    inventory.phase !== 260 ||
    inventory.plan !== 33 ||
    inventory.lifecycle !== "preactivation-only"
  ) {
    errors.push("inventory identity")
  }
  if (
    inventory.simulation?.isolation !== "disposable-shared-clone" ||
    inventory.simulation.mutationPolicy !== "exact-five-selector-flip" ||
    inventory.simulation.autoFix !== false ||
    inventory.simulation.cloneDisposed !== true ||
    !exactArray(
      inventory.simulation.allowedMutationPaths,
      [...ACTIVATION_SELECTOR_PATHS].sort(),
    ) ||
    inventory.simulation.selectorPreimage.length !== 5 ||
    inventory.simulation.selectorTarget.length !== 5 ||
    [
      ...inventory.simulation.selectorPreimage,
      ...inventory.simulation.selectorTarget,
    ].some(
      (entry) =>
        !ACTIVATION_SELECTOR_PATHS.includes(entry.path) ||
        !SHA256.test(entry.sha256),
    )
  ) {
    errors.push("simulation boundary")
  }
  if (
    !exactArray(
      inventory.mainTree?.allowedDirtyPaths ?? [],
      [...PROTECTED_PATHS].sort(),
    ) ||
    inventory.mainTree.preStatusSha256 !==
      inventory.mainTree.postStatusSha256 ||
    inventory.mainTree.unchanged !== true ||
    !SHA256.test(inventory.mainTree.protectedBaselineSha256)
  ) {
    errors.push("main-tree boundary")
  }
  if (
    inventory.declaredSeams?.length !== DECLARED_STALE_SEAM_PATHS.length ||
    inventory.declaredSeams.some(
      (entry, index) =>
        entry.path !== DECLARED_STALE_SEAM_PATHS[index] ||
        entry.disposition !== "historical-v1.17-plus-current-resolver",
    )
  ) {
    errors.push("declared seam inventory")
  }
  if (
    inventory.gate?.id !== "declared-stale-seams" ||
    inventory.gate.command !== GATE_COMMAND.join(" ") ||
    !SHA256.test(inventory.gate.stdoutSha256) ||
    !SHA256.test(inventory.gate.stderrSha256) ||
    inventory.findingCount !== inventory.findings?.length ||
    (inventory.findingCount === 0) !== (inventory.status === "passed") ||
    (inventory.findingCount === 0) !== (inventory.gate.status === "passed") ||
    (inventory.findingCount === 0) !== (inventory.gate.exitCode === 0)
  ) {
    errors.push("gate or findings")
  }
  return errors
}

export const auditV137ObservationV119ActivationSeams = (
  repoRoot: string = root,
  options: ActivationSeamAuditOptions = {},
): ActivationSeamInventory => {
  const mainPreStatus = assertMainTreeBoundary(repoRoot)
  const baseline = JSON.parse(
    readFileSync(
      path.join(
        repoRoot,
        ".planning/artifacts/v1.37-protected-working-tree-baseline.json",
      ),
      "utf8",
    ),
  ) as { baselineSha256: string }
  const target = buildV119SelectorBytes()
  const preimage = selectorManifest(repoRoot)
  const targetManifest = selectorManifest(repoRoot, target)
  const temporaryRoot = path.join(
    tmpdir(),
    `cowards-v1-37-activation-seam-${process.pid}-${randomUUID()}`,
  )
  const cloneRoot = path.join(temporaryRoot, "worktree")
  const findings: ActivationSeamFinding[] = []
  let gate = {
    id: "declared-stale-seams" as const,
    command: GATE_COMMAND.join(" "),
    status: "failed" as "passed" | "failed",
    exitCode: 1,
    stdoutSha256: sha256(Buffer.alloc(0)),
    stderrSha256: sha256(Buffer.alloc(0)),
  }
  try {
    mkdirSync(temporaryRoot, { recursive: true })
    execFileSync(
      "git",
      ["clone", "--quiet", "--shared", "--no-checkout", repoRoot, cloneRoot],
      { cwd: repoRoot },
    )
    git(cloneRoot, ["checkout", "--quiet", "--detach", "HEAD"])
    linkNodeModules(repoRoot, cloneRoot)
    for (const [relativePath, bytes] of target) {
      writeFileSync(path.join(cloneRoot, relativePath), bytes)
    }
    const beforeGatePaths = git(cloneRoot, ["diff", "--name-only", "--"])
      .toString("utf8")
      .trim()
      .split("\n")
      .filter(Boolean)
      .sort()
    if (!exactArray(beforeGatePaths, [...ACTIVATION_SELECTOR_PATHS].sort())) {
      for (const undeclared of beforeGatePaths.filter(
        (entry) => !ACTIVATION_SELECTOR_PATHS.includes(entry),
      )) {
        findings.push({
          id: `undeclared-before-gate:${sha256(undeclared).slice(7, 23)}`,
          classification: "undeclared-mutation",
          path: undeclared,
        })
      }
    }
    const result = (options.gateRunner ?? defaultGateRunner)(cloneRoot)
    gate = {
      ...gate,
      status: result.exitCode === 0 ? "passed" : "failed",
      exitCode: result.exitCode,
      stdoutSha256: sha256(result.stdout),
      stderrSha256: sha256(result.stderr),
    }
    if (result.exitCode !== 0) {
      findings.push({
        id: "declared-stale-seam-gate-failed",
        classification: "declared-gate-failure",
        path: null,
      })
    }
    const afterGatePaths = git(cloneRoot, ["diff", "--name-only", "--"])
      .toString("utf8")
      .trim()
      .split("\n")
      .filter(Boolean)
      .sort()
    for (const undeclared of afterGatePaths.filter(
      (entry) => !ACTIVATION_SELECTOR_PATHS.includes(entry),
    )) {
      findings.push({
        id: `undeclared-after-gate:${sha256(undeclared).slice(7, 23)}`,
        classification: "undeclared-mutation",
        path: undeclared,
      })
    }
    if (!exactArray(afterGatePaths, [...ACTIVATION_SELECTOR_PATHS].sort())) {
      findings.push({
        id: "selector-mutation-inventory-mismatch",
        classification: "undeclared-mutation",
        path: null,
      })
    }
  } finally {
    rmSync(temporaryRoot, { recursive: true, force: true })
  }
  if (existsSync(temporaryRoot)) {
    throw new Error("Activation seam audit clone cleanup failed")
  }
  const mainPostStatus = assertMainTreeBoundary(repoRoot)
  if (!mainPostStatus.equals(mainPreStatus)) {
    throw new Error("Activation seam audit mutated the main worktree")
  }
  const inventory: ActivationSeamInventory = {
    schemaVersion: "v1.37-observation-v1.19-stale-seam-inventory-v1",
    milestone: "v1.37",
    phase: 260,
    plan: 33,
    lifecycle: "preactivation-only",
    status: findings.length === 0 ? "passed" : "failed",
    simulation: {
      isolation: "disposable-shared-clone",
      mutationPolicy: "exact-five-selector-flip",
      autoFix: false,
      allowedMutationPaths: [...ACTIVATION_SELECTOR_PATHS].sort(),
      selectorPreimage: preimage,
      selectorTarget: targetManifest,
      cloneDisposed: true,
    },
    mainTree: {
      allowedDirtyPaths: [...PROTECTED_PATHS].sort(),
      preStatusSha256: sha256(mainPreStatus),
      postStatusSha256: sha256(mainPostStatus),
      protectedBaselineSha256: baseline.baselineSha256,
      unchanged: true,
    },
    declaredSeams: DECLARED_STALE_SEAM_PATHS.map((seamPath) => ({
      path: seamPath,
      disposition: "historical-v1.17-plus-current-resolver" as const,
    })),
    gate,
    findings,
    findingCount: findings.length,
  }
  const errors = validateActivationSeamInventory(inventory)
  if (errors.length > 0) {
    throw new Error(`Activation seam inventory invalid: ${errors.join(", ")}`)
  }
  return inventory
}

const writeAtomic = (
  repoRoot: string,
  inventory: ActivationSeamInventory,
): void => {
  const target = path.join(repoRoot, STALE_SEAM_INVENTORY_PATH)
  const temporary = `${target}.tmp-${process.pid}-${randomUUID()}`
  writeFileSync(temporary, `${JSON.stringify(inventory)}\n`, {
    flag: "wx",
    mode: 0o644,
  })
  renameSync(temporary, target)
}

export const checkActivationSeamInventory = (repoRoot: string = root): void => {
  const actual = auditV137ObservationV119ActivationSeams(repoRoot)
  if (actual.findingCount !== 0) {
    throw new Error("ACTIVATION_STALE_SEAMS_FOUND")
  }
  const expected = Buffer.from(`${JSON.stringify(actual)}\n`)
  if (
    !readFileSync(path.join(repoRoot, STALE_SEAM_INVENTORY_PATH)).equals(
      expected,
    )
  ) {
    throw new Error("ACTIVATION_STALE_SEAM_INVENTORY_STALE")
  }
}

const main = (): void => {
  try {
    const args = process.argv.slice(2)
    if (args.length !== 1 || !["--write", "--check"].includes(args[0]!)) {
      throw new Error("usage: --write | --check")
    }
    const inventory = auditV137ObservationV119ActivationSeams(root)
    if (inventory.findingCount !== 0) {
      process.stderr.write(`${JSON.stringify(inventory)}\n`)
      throw new Error("ACTIVATION_STALE_SEAMS_FOUND")
    }
    if (args[0] === "--write") writeAtomic(root, inventory)
    else {
      const expected = Buffer.from(`${JSON.stringify(inventory)}\n`)
      if (
        !readFileSync(path.join(root, STALE_SEAM_INVENTORY_PATH)).equals(
          expected,
        )
      ) {
        throw new Error("ACTIVATION_STALE_SEAM_INVENTORY_STALE")
      }
    }
    process.stdout.write(
      `${JSON.stringify({ status: "passed", findingCount: 0, autoFix: false })}\n`,
    )
  } catch (error) {
    process.stderr.write(
      `${JSON.stringify({ status: "failed", code: error instanceof Error ? error.message : "unknown" })}\n`,
    )
    process.exitCode = 1
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main()
