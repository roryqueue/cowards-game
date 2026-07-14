#!/usr/bin/env -S pnpm exec tsx
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
/* eslint-disable-next-line no-restricted-imports -- This generator owns a dedicated unexported spec artifact contract. */
import {
  buildRuntimeBudgetCapabilitiesV117,
  renderRuntimeBudgetCapabilitiesV117,
  type RuntimeBudgetCapabilitiesArtifactV117,
} from "../packages/spec/src/runtime-budget-capabilities-v1-17.js"

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
)

export const runtimeBudgetCapabilitiesV117ArtifactPath =
  "packages/spec/artifacts/runtime-abi-v1.17-budget-capabilities.json" as const

export interface RuntimeBudgetCapabilitiesV117GeneratorIo {
  readonly readArtifact: (relativePath: string) => string
  readonly writeArtifact: (relativePath: string, bytes: string) => void
}

const defaultIo: RuntimeBudgetCapabilitiesV117GeneratorIo = {
  readArtifact: (relativePath) =>
    readFileSync(path.join(repoRoot, relativePath), "utf8"),
  writeArtifact: (relativePath, bytes) => {
    const absolutePath = path.join(repoRoot, relativePath)
    mkdirSync(path.dirname(absolutePath), { recursive: true })
    writeFileSync(absolutePath, bytes)
  },
}

export const buildRuntimeBudgetCapabilitiesV117Artifact =
  (): RuntimeBudgetCapabilitiesArtifactV117 =>
    buildRuntimeBudgetCapabilitiesV117()

export const renderRuntimeBudgetCapabilitiesV117Artifact = (): string =>
  renderRuntimeBudgetCapabilitiesV117(
    buildRuntimeBudgetCapabilitiesV117Artifact(),
  )

export const checkRuntimeBudgetCapabilitiesV117Artifact = (
  readArtifact: RuntimeBudgetCapabilitiesV117GeneratorIo["readArtifact"] = defaultIo.readArtifact,
): readonly string[] => {
  const expected = renderRuntimeBudgetCapabilitiesV117Artifact()
  let actual: string
  try {
    actual = readArtifact(runtimeBudgetCapabilitiesV117ArtifactPath)
  } catch {
    return ["ARTIFACT_MISSING"]
  }
  return actual === expected ? [] : ["STALE_ARTIFACT_BYTES"]
}

export const runRuntimeBudgetCapabilitiesV117Generator = (
  args: readonly string[],
  io: RuntimeBudgetCapabilitiesV117GeneratorIo = defaultIo,
): Readonly<{ wrote: boolean; checked: boolean }> => {
  const allowed = new Set(["--write", "--check"])
  const unknown = args.filter((argument) => !allowed.has(argument))
  if (unknown.length > 0) {
    throw new Error(
      `Unknown runtime capability generator argument: ${unknown[0]}`,
    )
  }
  const write = args.includes("--write")
  const check = args.includes("--check")
  if (!write && !check) {
    throw new Error("Runtime capability generator requires --write or --check")
  }
  if (write) {
    io.writeArtifact(
      runtimeBudgetCapabilitiesV117ArtifactPath,
      renderRuntimeBudgetCapabilitiesV117Artifact(),
    )
  }
  if (check) {
    const findings = checkRuntimeBudgetCapabilitiesV117Artifact(io.readArtifact)
    if (findings.length > 0) {
      throw new Error(
        `Runtime budget capability artifact check failed: ${findings.join(", ")}`,
      )
    }
  }
  return { wrote: write, checked: check }
}

const isMain =
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (isMain) {
  try {
    const result = runRuntimeBudgetCapabilitiesV117Generator(
      process.argv.slice(2),
    )
    console.log(
      `[RUNTIME_BUDGET_CAPABILITIES:v1.17] wrote=${result.wrote} checked=${result.checked}`,
    )
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}
