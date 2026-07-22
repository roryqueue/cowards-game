import { spawnSync } from "node:child_process"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { pathToFileURL } from "node:url"
import { describe, expect, it } from "vitest"

const repoRoot = path.resolve(import.meta.dirname, "..")
const runTsx = (script: string, args: readonly string[], environment: NodeJS.ProcessEnv = {}) =>
  spawnSync("pnpm", ["exec", "tsx", script, ...args], {
    cwd: repoRoot,
    encoding: "utf8",
    env: { ...process.env, ...environment },
  })

const importFromParent = (target: string, args: readonly string[]): ReturnType<typeof runTsx> => {
  const fixtureRoot = mkdtempSync(
    path.join(repoRoot, "scripts", ".v137-cli-dispatch-"),
  )
  try {
    const parent = path.join(fixtureRoot, "parent.ts")
    writeFileSync(
      parent,
      `import ${JSON.stringify(pathToFileURL(path.join(repoRoot, target)).href)}\nprocess.stdout.write("PARENT_IMPORT_OK\\n")\n`,
    )
    return runTsx(parent, args)
  } finally {
    rmSync(fixtureRoot, { recursive: true, force: true })
  }
}

describe("v1.37 CLI dispatch isolation", () => {
  it("dispatches exact tsx script invocations and rejects conflicting modes", () => {
    const evaluator = runTsx("scripts/evaluate-v1-37-integrated-service-proof.ts", ["--check"])
    expect(evaluator.status).toBe(1)
    expect(evaluator.stderr).toContain("V137_INTEGRATED_PROOF_RESTRICTED_ROOT_REQUIRED")

    const service = runTsx(
      "scripts/run-v1-37-integrated-service-proof.ts",
      ["--write", "--check"],
      { COWARDS_V1_37_REQUIRE_INTEGRATED_PROOF: "1" },
    )
    expect(service.status).toBe(1)
    expect(service.stderr).toContain("V137_SERVICE_PROOF_MODE_INVALID")

    const aggregate = runTsx(
      "scripts/evaluate-v1-37-integrated-service-proof.ts",
      ["--write", "--check"],
      { COWARDS_V1_37_RESTRICTED_EVIDENCE_ROOT: tmpdir() },
    )
    expect(aggregate.status).toBe(1)
    expect(aggregate.stderr).toContain("V137_INTEGRATED_PROOF_MODE_INVALID")
  }, 30_000)

  it("never dispatches imported service or evaluator modules from parent argv flags", () => {
    for (const target of [
      "scripts/run-v1-37-integrated-service-proof.ts",
      "scripts/evaluate-v1-37-integrated-service-proof.ts",
    ]) {
      const result = importFromParent(target, ["--write"])
      expect(result.status, result.stderr).toBe(0)
      expect(result.stdout).toContain("PARENT_IMPORT_OK")
      expect(result.stderr).not.toContain("V137_")
    }
  }, 30_000)
})
