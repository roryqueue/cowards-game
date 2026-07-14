import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import {
  CANONICAL_JSON_BOUNDARY_PROFILES,
  admitCanonicalJsonBytes,
  admitCanonicalJsonValue,
} from "./canonical-json.js"
import {
  CanonicalJsonValueV117Schema,
  ObjectivePayloadV117Schema,
  SoldierMemoryV117Schema,
  StrategyMemoryV117Schema,
} from "./schemas.js"

const text = (value: string): Uint8Array => new TextEncoder().encode(value)
const repoRoot = path.resolve(import.meta.dirname, "../../..")

describe("successor canonical JSON boundaries", () => {
  it("keeps exact ownership before materialization", () => {
    const duplicate = text('{"memory":1,"memory":2}')
    const player = admitCanonicalJsonBytes(duplicate, {
      profile: "strategy-payload",
    })
    const system = admitCanonicalJsonBytes(duplicate, {
      profile: "authenticated-envelope",
    })

    expect(player).toMatchObject({
      ok: false,
      error: { code: "DUPLICATE_KEY", path: ["memory"], owner: "player_violation" },
    })
    expect(system).toMatchObject({
      ok: false,
      error: { code: "DUPLICATE_KEY", path: ["memory"], owner: "system_failure" },
    })
  })

  it.each([
    ["strategy-memory", 32 * 1024],
    ["soldier-memory", 2 * 1024],
    ["objective", 1024],
  ] as const)("enforces the %s canonical-byte cap at N and N+1", (profile, cap) => {
    const exact = text(`"${"x".repeat(cap - 2)}"`)
    const over = text(`"${"x".repeat(cap - 1)}"`)

    expect(admitCanonicalJsonBytes(exact, { profile }).ok).toBe(true)
    expect(admitCanonicalJsonBytes(over, { profile })).toMatchObject({
      ok: false,
      error: {
        code: "MAX_RAW_UTF8_BYTES_EXCEEDED",
        byteOffset: cap,
        owner: "player_violation",
      },
    })
  })

  it("rejects deep materialized values iteratively without a recursive schema throw", () => {
    let deep: unknown = null
    for (let index = 0; index < 3_000; index += 1) deep = [deep]

    expect(() => admitCanonicalJsonValue(deep, { profile: "strategy-memory" })).not.toThrow()
    expect(admitCanonicalJsonValue(deep, { profile: "strategy-memory" })).toMatchObject({
      ok: false,
      error: { code: "MAX_DEPTH_EXCEEDED", owner: "player_violation" },
    })
    for (const schema of [
      CanonicalJsonValueV117Schema,
      StrategyMemoryV117Schema,
      SoldierMemoryV117Schema,
      ObjectivePayloadV117Schema,
    ]) {
      expect(() => schema.safeParse(deep)).not.toThrow()
      expect(schema.safeParse(deep).success).toBe(false)
    }
  })

  it("never lets lower profiles loosen the frozen global ceilings", () => {
    const global = CANONICAL_JSON_BOUNDARY_PROFILES["authenticated-envelope"].limits
    for (const profile of Object.values(CANONICAL_JSON_BOUNDARY_PROFILES)) {
      for (const name of Object.keys(global) as (keyof typeof global)[]) {
        expect(profile.limits[name], `${profile.id}.${name}`).toBeLessThanOrEqual(
          global[name],
        )
      }
    }
  })

  it("preserves every protected v1.16 proof byte", () => {
    const protectedHashes = {
      "packages/spec/artifacts/runtime-execution-service-response.v1.16.wire.json":
        "9c870d57e0125eb80ab2ba941ecbbede8a9a775f61c0b278abec25c491374d97",
      "packages/spec/src/runtime-execution-service.ts":
        "9a0a0411056d06ce4b426b7749256460369124fa752c6c2f81912b8b0bfb31fc",
      "apps/go-backend/runtime_service_client.go":
        "8fdd3cbc206d2d7e1f77a3603a4f9ea5e664c5ab6f649c87d3e308d99556043f",
    } as const
    for (const [relativePath, expected] of Object.entries(protectedHashes)) {
      expect(
        createHash("sha256")
          .update(readFileSync(path.join(repoRoot, relativePath)))
          .digest("hex"),
      ).toBe(expected)
    }
  })
})
