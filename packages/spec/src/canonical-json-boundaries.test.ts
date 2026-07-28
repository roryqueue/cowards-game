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
import { RuntimeInvocationResultV117Schema } from "./runtime-invocation-v1-17.js"

const text = (value: string): Uint8Array => new TextEncoder().encode(value)
const repoRoot = path.resolve(import.meta.dirname, "../../..")

describe("successor canonical JSON boundaries", () => {
  it.each([
    ["leading whitespace", " 1", 0],
    ["trailing whitespace", "1 ", 1],
    ["non-shortest decimal", "1.2300", 4],
    ["uppercase signed exponent", "1E+21", 1],
    ["escaped ASCII", '"\\u0061"', 1],
  ] as const)(
    "rejects %s when exact canonical bytes are required",
    (_label, raw, byteOffset) => {
      expect(
        admitCanonicalJsonBytes(text(raw), {
          profile: "strategy-payload",
        }),
      ).toEqual({
        ok: false,
        error: {
          code: "NON_CANONICAL_ENCODING",
          path: [],
          byteOffset,
          owner: "player_violation",
        },
        profile: "strategy-payload",
      })
      expect(
        admitCanonicalJsonBytes(text(raw), {
          profile: "strategy-payload",
          operation: "parse-and-canonicalize",
        }).ok,
      ).toBe(true)
    },
  )

  it("preserves typed key-order precedence and system ownership", () => {
    expect(
      admitCanonicalJsonBytes(text('{"z":1,"a":2}'), {
        profile: "canonical-manifest",
      }),
    ).toMatchObject({
      ok: false,
      error: {
        code: "NON_CANONICAL_KEY_ORDER",
        path: ["a"],
        byteOffset: 7,
        owner: "system_failure",
      },
    })
    expect(
      admitCanonicalJsonBytes(text(" 1"), {
        profile: "authenticated-envelope",
      }),
    ).toMatchObject({
      ok: false,
      error: {
        code: "NON_CANONICAL_ENCODING",
        path: [],
        byteOffset: 0,
        owner: "system_failure",
      },
    })
  })

  it("applies safe-integer bounds to integer lexemes while preserving finite exponent binary64", () => {
    expect(
      admitCanonicalJsonBytes(text("9007199254740992"), {
        profile: "strategy-payload",
        operation: "parse-and-canonicalize",
      }),
    ).toMatchObject({
      ok: false,
      error: {
        code: "NUMBER_OUT_OF_RANGE",
        path: [],
        byteOffset: 0,
        owner: "player_violation",
      },
    })
    for (const raw of ["1e21", "1.7976931348623157e308"]) {
      expect(
        admitCanonicalJsonBytes(text(raw), {
          profile: "strategy-payload",
          operation: "parse-and-canonicalize",
        }).ok,
      ).toBe(true)
    }
  })

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
      error: {
        code: "DUPLICATE_KEY",
        path: ["memory"],
        owner: "player_violation",
      },
    })
    expect(system).toMatchObject({
      ok: false,
      error: {
        code: "DUPLICATE_KEY",
        path: ["memory"],
        owner: "system_failure",
      },
    })
  })

  it.each([
    ["strategy-memory", 32 * 1024],
    ["soldier-memory", 2 * 1024],
    ["objective", 1024],
  ] as const)(
    "enforces the %s canonical-byte cap at N and N+1",
    (profile, cap) => {
      const exact = text(`"${"x".repeat(cap - 2)}"`)
      const over = text(`"${"x".repeat(cap - 1)}"`)

      expect(admitCanonicalJsonBytes(exact, { profile }).ok).toBe(true)
      expect(admitCanonicalJsonBytes(over, { profile })).toMatchObject({
        ok: false,
        error: {
          code: "FIELD_CAP_EXCEEDED",
          byteOffset: cap,
          owner: "player_violation",
        },
      })
    },
  )

  it("rejects deep materialized values iteratively without a recursive schema throw", () => {
    let deep: unknown = null
    for (let index = 0; index < 3_000; index += 1) deep = [deep]

    expect(() =>
      admitCanonicalJsonValue(deep, { profile: "strategy-memory" }),
    ).not.toThrow()
    expect(
      admitCanonicalJsonValue(deep, { profile: "strategy-memory" }),
    ).toMatchObject({
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
    const deepResult = {
      kind: "success",
      value: deep,
      trace: {
        requestId: "request:deep",
        invocationId: "invocation:deep",
        kernelRequestId: "kernel-request:deep",
        method: "selectActivations",
        requestSha256: `sha256:${"1".repeat(64)}`,
        budgetProfileSha256: `sha256:${"2".repeat(64)}`,
        inputSha256: `sha256:${"3".repeat(64)}`,
        retryIdentitySha256: `sha256:${"4".repeat(64)}`,
        safeCodes: [],
      },
    }
    expect(() =>
      RuntimeInvocationResultV117Schema.safeParse(deepResult),
    ).not.toThrow()
    expect(
      RuntimeInvocationResultV117Schema.safeParse(deepResult).success,
    ).toBe(false)
  })

  it.each([
    [
      "selectActivations strategy memory",
      "selectActivations",
      {
        activationOrders: [],
        strategyMemory: "x".repeat(32 * 1024 + 1),
      },
    ],
    [
      "selectActivations objective",
      "selectActivations",
      {
        activationOrders: [
          {
            soldierId: "soldier:1",
            objective: "x".repeat(1024 + 1),
          },
        ],
        strategyMemory: null,
      },
    ],
    [
      "soldierBrain memory",
      "soldierBrain",
      {
        action: { type: "TURN_TO_STONE" },
        soldierMemory: "x".repeat(2 * 1024 + 1),
      },
    ],
  ] as const)(
    "rejects over-cap %s in the authenticated success schema",
    (_label, method, value) => {
      const result = {
        kind: "success",
        value,
        trace: {
          requestId: "request:field-cap",
          invocationId: "invocation:field-cap",
          kernelRequestId: "kernel-request:field-cap",
          method,
          requestSha256: `sha256:${"1".repeat(64)}`,
          budgetProfileSha256: `sha256:${"2".repeat(64)}`,
          inputSha256: `sha256:${"3".repeat(64)}`,
          retryIdentitySha256: `sha256:${"4".repeat(64)}`,
          safeCodes: [],
        },
      }

      expect(RuntimeInvocationResultV117Schema.safeParse(result).success).toBe(
        false,
      )
    },
  )

  it("never lets lower profiles loosen the frozen global ceilings", () => {
    const global =
      CANONICAL_JSON_BOUNDARY_PROFILES["authenticated-envelope"].limits
    for (const profile of Object.values(CANONICAL_JSON_BOUNDARY_PROFILES)) {
      for (const name of Object.keys(global) as (keyof typeof global)[]) {
        expect(
          profile.limits[name],
          `${profile.id}.${name}`,
        ).toBeLessThanOrEqual(global[name])
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
        "9c72e5b0ee3ddfb36a7aec51a5a1ead508b2fae29eace27a73b9fda7d55ce23c",
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
