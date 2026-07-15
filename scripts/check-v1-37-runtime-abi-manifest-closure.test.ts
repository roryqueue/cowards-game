import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

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

  it("does not publish the final post-activation hash manifest early", () => {
    expect(() =>
      readFileSync(
        "packages/spec/artifacts/runtime-abi-v1.17-activation-manifest.json",
      ),
    ).toThrow()
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
      "packages/replay/src/validate.ts",
      "apps/runtime-service/src/server.ts",
      "apps/go-backend/orchestrator.go",
      "apps/go-backend/completion.go",
      "packages/persistence/src/complete-match.ts",
    ]) {
      expect(paths.has(path), path).toBe(true)
    }
  })
})
