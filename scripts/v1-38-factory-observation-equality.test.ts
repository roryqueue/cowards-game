import { createHash } from "node:crypto"
import { describe, expect, it } from "vitest"
import { labRoot } from "../packages/strategy-lab/src/contracts.js"
import { equalFactoryObservationMaps, type FactoryObservationMap } from "./v1-38-factory-observation-equality.js"

const root = (value: unknown): string => labRoot("observation-equality-test", value)
const digest = (value: string): string => createHash("sha256").update(value).digest("hex")

describe("factory observation map equality", () => {
  it("matches labRoot equality for small maps while ignoring key order", () => {
    const left: FactoryObservationMap = { S01: ["observe", "advance"], S02: ["stone"] }
    const right: FactoryObservationMap = { S02: ["stone"], S01: ["observe", "advance"] }
    expect(equalFactoryObservationMaps(left, right)).toBe(true)
    expect(root(left)).toBe(root(right))
    expect(equalFactoryObservationMaps(left, { ...right, S02: ["changed"] })).toBe(false)
    expect(root(left)).not.toBe(root({ ...right, S02: ["changed"] }))
  })

  it("compares maps larger than the canonical envelope cap without truncation", () => {
    const left = Object.fromEntries(Array.from({ length: 35_000 }, (_, index) => [`S${index}`, [`token-${String(index).padStart(5, "0")}-${"x".repeat(240)}`]])) as FactoryObservationMap
    const right: FactoryObservationMap = { ...left }
    expect(JSON.stringify(left).length).toBeGreaterThan(262144)
    expect(() => root(left)).toThrow("LAB_CANONICAL_VALUE")
    expect(equalFactoryObservationMaps(left, right)).toBe(true)
    expect(equalFactoryObservationMaps(left, { ...right, S1200: ["token-1200"] })).toBe(false)
    expect(equalFactoryObservationMaps(left, { ...right, S1199: [`token-1199-${"x".repeat(239)}y`] })).toBe(false)
  })

  it("requires exact keys and ordered token arrays", () => {
    const base: FactoryObservationMap = { S01: ["a", "b"], S02: ["c"] }
    expect(equalFactoryObservationMaps(base, { S01: ["a", "b"], S02: ["c"] })).toBe(true)
    expect(equalFactoryObservationMaps(base, { S01: ["a", "b"], S03: ["c"] })).toBe(false)
    expect(equalFactoryObservationMaps(base, { S01: ["a"], S02: ["c"] })).toBe(false)
    expect(equalFactoryObservationMaps(base, { S01: ["b", "a"], S02: ["c"] })).toBe(false)
    expect(equalFactoryObservationMaps(base, { S01: ["a", "b", "b"], S02: ["c"] })).toBe(false)
  })

  it("handles special own keys and does not mutate inputs", () => {
    const left = Object.create(null) as Record<string, readonly string[]>, right = Object.create(null) as Record<string, readonly string[]>
    Object.defineProperty(left, "__proto__", { value: ["safe"], enumerable: true })
    Object.defineProperty(right, "__proto__", { value: ["safe"], enumerable: true })
    left.constructor = ["ctor"]; right.constructor = ["ctor"]
    const leftBefore = structuredClone(left), rightBefore = structuredClone(right)
    expect(equalFactoryObservationMaps(left, right)).toBe(true)
    expect(left).toEqual(leftBefore)
    expect(right).toEqual(rightBefore)
    expect(digest(JSON.stringify(left))).toBe(digest(JSON.stringify(leftBefore)))
  })
})
