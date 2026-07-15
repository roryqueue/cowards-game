import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import {
  IMMUTABLE_RUNTIME_SERVICE_V116_DIGESTS,
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

  it("pins exact v1.16 bytes and rejects a one-byte historical mutation", () => {
    expect(Object.keys(IMMUTABLE_RUNTIME_SERVICE_V116_DIGESTS)).toHaveLength(6)
    expect(() => verifyImmutableRuntimeServiceV116Digests()).not.toThrow()
    const mutatedPath =
      "packages/spec/artifacts/runtime-execution-service-request.v1.16.json"
    expect(() =>
      verifyImmutableRuntimeServiceV116Digests((path) => {
        const bytes = readFileSync(path)
        return path === mutatedPath
          ? Buffer.concat([bytes.subarray(0, -1), Buffer.from("\n")])
          : bytes
      }),
    ).toThrow(/Immutable v1\.16 digest changed/u)
  })
})
