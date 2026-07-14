import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import {
  RUNTIME_BUDGET_CAPABILITIES_V1_17,
  assertRuntimeBudgetCapabilitiesV117,
} from "../packages/spec/src/runtime-budget-capabilities-v1-17.js"
import {
  buildRuntimeBudgetCapabilitiesV117Artifact,
  checkRuntimeBudgetCapabilitiesV117Artifact,
  renderRuntimeBudgetCapabilitiesV117Artifact,
  runRuntimeBudgetCapabilitiesV117Generator,
  runtimeBudgetCapabilitiesV117ArtifactPath,
} from "./generate-runtime-budget-capabilities-v1-17.js"

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
)

describe("runtime budget capability artifact generator", () => {
  it("builds and checks the exact contract-owned artifact bytes", () => {
    const artifact = buildRuntimeBudgetCapabilitiesV117Artifact()
    expect(artifact).toEqual(RUNTIME_BUDGET_CAPABILITIES_V1_17)
    expect(() => assertRuntimeBudgetCapabilitiesV117(artifact)).not.toThrow()

    const rendered = renderRuntimeBudgetCapabilitiesV117Artifact()
    expect(
      readFileSync(
        path.join(repoRoot, runtimeBudgetCapabilitiesV117ArtifactPath),
        "utf8",
      ),
    ).toBe(rendered)
    expect(checkRuntimeBudgetCapabilitiesV117Artifact()).toEqual([])
  })

  it("fails check mode on stale bytes and never normalizes them", () => {
    const rendered = renderRuntimeBudgetCapabilitiesV117Artifact()
    expect(
      checkRuntimeBudgetCapabilitiesV117Artifact(() => `${rendered} `),
    ).toEqual(["STALE_ARTIFACT_BYTES"])
    expect(
      checkRuntimeBudgetCapabilitiesV117Artifact(() =>
        rendered.replace('"uncertified"', '"certifiable"'),
      ),
    ).toEqual(["STALE_ARTIFACT_BYTES"])
  })

  it("owns deterministic --write and --check modes", () => {
    let persisted = "stale"
    const writes: Array<{ relativePath: string; bytes: string }> = []
    const result = runRuntimeBudgetCapabilitiesV117Generator(
      ["--write", "--check"],
      {
        readArtifact: () => persisted,
        writeArtifact: (relativePath: string, bytes: string) => {
          writes.push({ relativePath, bytes })
          persisted = bytes
        },
      },
    )
    expect(result).toEqual({ wrote: true, checked: true })
    expect(writes).toEqual([
      {
        relativePath: runtimeBudgetCapabilitiesV117ArtifactPath,
        bytes: renderRuntimeBudgetCapabilitiesV117Artifact(),
      },
    ])
    expect(() =>
      runRuntimeBudgetCapabilitiesV117Generator([], {
        readArtifact: () => persisted,
        writeArtifact: () => undefined,
      }),
    ).toThrow(/--write|--check/u)
    expect(() =>
      runRuntimeBudgetCapabilitiesV117Generator(["--latest"], {
        readArtifact: () => persisted,
        writeArtifact: () => undefined,
      }),
    ).toThrow(/unknown/iu)
  })

  it("is independent of local databases, toolchains, time, and environment", () => {
    const generatorSource = readFileSync(
      path.join(
        repoRoot,
        "scripts/generate-runtime-budget-capabilities-v1-17.ts",
      ),
      "utf8",
    )
    const contractSource = readFileSync(
      path.join(
        repoRoot,
        "packages/spec/src/runtime-budget-capabilities-v1-17.ts",
      ),
      "utf8",
    )
    const combined = `${generatorSource}\n${contractSource}`
    expect(combined).not.toMatch(
      /DATABASE_URL|postgres|child_process|spawnSync|execFileSync|process\.env|Date\.now|new Date|Math\.random/iu,
    )
    expect(renderRuntimeBudgetCapabilitiesV117Artifact()).not.toMatch(
      /\/Users\/|C:\\Users\\|token=|StrategyMemory|SoldierMemory|objectivePayload|raw diagnostics/iu,
    )
  })

  it("renders byte-identically across repeated builds", () => {
    const values = Array.from(
      { length: 5 },
      () => renderRuntimeBudgetCapabilitiesV117Artifact(),
    )
    expect(new Set(values).size).toBe(1)
  })
})
