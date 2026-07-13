import { describe, expect, it } from "vitest"
import {
  CANONICAL_AUTHORITY_DOMAINS,
  CANONICAL_AUTHORITY_REGISTRY,
  CANONICAL_COMPATIBILITY_TUPLES,
  assertCanonicalAuthorityRegistry,
  encodeCanonicalCompatibilityTuple,
  hashCanonicalCompatibilityTuple,
  resolveCanonicalCompatibilityTuple,
  type CanonicalCompatibilityTuple,
} from "./integrity-authority.js"

const cloneTuple = (
  tuple: CanonicalCompatibilityTuple,
): CanonicalCompatibilityTuple => ({ ...tuple })

describe("v1.37 canonical integrity authority", () => {
  it("registers exactly one distinct owner for every canonical authority domain", () => {
    expect(CANONICAL_AUTHORITY_REGISTRY.map(({ domain }) => domain)).toEqual(
      CANONICAL_AUTHORITY_DOMAINS,
    )
    expect(
      new Set(
        CANONICAL_AUTHORITY_REGISTRY.map(
          ({ packageName, symbol }) => `${packageName}#${symbol}`,
        ),
      ).size,
    ).toBe(CANONICAL_AUTHORITY_DOMAINS.length)
    expect(() => assertCanonicalAuthorityRegistry(CANONICAL_AUTHORITY_REGISTRY)).not.toThrow()
    expect(() =>
      assertCanonicalAuthorityRegistry([
        ...CANONICAL_AUTHORITY_REGISTRY,
        CANONICAL_AUTHORITY_REGISTRY[0]!,
      ]),
    ).toThrow(/duplicate authority domain/i)
    expect(() =>
      assertCanonicalAuthorityRegistry([
        ...CANONICAL_AUTHORITY_REGISTRY.slice(0, -1),
        {
          ...CANONICAL_AUTHORITY_REGISTRY.at(-1)!,
          packageName: CANONICAL_AUTHORITY_REGISTRY[0]!.packageName,
          symbol: CANONICAL_AUTHORITY_REGISTRY[0]!.symbol,
        },
      ]),
    ).toThrow(/duplicate authority owner/i)
  })

  it("encodes exactly six components in fixed order and hashes every mutation differently", () => {
    const registered = CANONICAL_COMPATIBILITY_TUPLES[0]!
    const fields = [
      "rules",
      "engine",
      "runtimeAbi",
      "chronicle",
      "arenaCatalog",
      "setPolicy",
    ] as const

    expect(Object.keys(registered.tuple)).toEqual(fields)
    const encoded = encodeCanonicalCompatibilityTuple(registered.tuple)
    expect(encoded).toBeInstanceOf(Uint8Array)
    expect(new TextDecoder().decode(encoded)).toContain(
      "cowards-game:canonical-compatibility-tuple:v1\0",
    )

    for (const field of fields) {
      const changed = cloneTuple(registered.tuple)
      changed[field] = `${changed[field]}-changed`
      expect(encodeCanonicalCompatibilityTuple(changed)).not.toEqual(encoded)
      expect(hashCanonicalCompatibilityTuple(changed)).not.toBe(registered.sha256)
    }
  })

  it("resolves only an exact registered id and matching complete expansion", () => {
    const registered = CANONICAL_COMPATIBILITY_TUPLES[0]!
    expect(
      resolveCanonicalCompatibilityTuple({
        tupleId: registered.tupleId,
        tuple: cloneTuple(registered.tuple),
      }),
    ).toEqual(registered)

    const invalidSelectors: unknown[] = [
      registered.tupleId,
      { tupleId: registered.tupleId },
      { tuple: cloneTuple(registered.tuple) },
      { tupleId: "latest", tuple: cloneTuple(registered.tuple) },
      { tupleId: "*", tuple: cloneTuple(registered.tuple) },
      { tupleId: `${registered.tupleId}..latest`, tuple: cloneTuple(registered.tuple) },
      {
        tupleId: registered.tupleId,
        tuple: { ...registered.tuple, rules: `${registered.tuple.rules}-mixed` },
      },
      {
        tupleId: registered.tupleId,
        tuple: { ...registered.tuple, alias: "current" },
      },
      { tupleId: "sha256:unknown", tuple: cloneTuple(registered.tuple) },
    ]
    for (const selector of invalidSelectors) {
      expect(resolveCanonicalCompatibilityTuple(selector)).toBeUndefined()
    }
  })

  it("does not expose writable registry references", () => {
    const ownerBefore = CANONICAL_AUTHORITY_REGISTRY[0]!.symbol
    const registeredBefore = CANONICAL_COMPATIBILITY_TUPLES[0]!

    expect(() => {
      ;(CANONICAL_AUTHORITY_REGISTRY as unknown as Array<{ symbol: string }>)[0]!.symbol =
        "mutated"
    }).toThrow()
    expect(() => {
      ;(registeredBefore.tuple as { rules: string }).rules = "mutated"
    }).toThrow()

    const resolved = resolveCanonicalCompatibilityTuple({
      tupleId: registeredBefore.tupleId,
      tuple: cloneTuple(registeredBefore.tuple),
    })!
    expect(() => {
      ;(resolved.tuple as { engine: string }).engine = "mutated"
    }).toThrow()

    expect(CANONICAL_AUTHORITY_REGISTRY[0]!.symbol).toBe(ownerBefore)
    expect(CANONICAL_COMPATIBILITY_TUPLES[0]).toEqual(registeredBefore)
  })
})
