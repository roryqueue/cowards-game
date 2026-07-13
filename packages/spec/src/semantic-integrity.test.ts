import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import {
  ArenaVariantSchema,
  RuntimeExecutionFinalStateSchema,
} from "./schemas.js"

type Mutation = {
  op: "set" | "append"
  path: Array<string | number>
  value: unknown
}

type SemanticVector = {
  id: string
  scope: "arena" | "state" | "transition"
  mutation?: Mutation
  mutations?: Mutation[]
  expected: Array<{
    code: string
    path: Array<string | number>
    metadata: Record<string, string>
  }>
}

type SemanticCorpus = {
  profile: string
  publicCategory: string
  ownership: string
  limits: Record<string, number>
  familyOrder: string[]
  valid: {
    arena: unknown
    state: unknown
    transition: Record<string, unknown>
  }
  vectors: SemanticVector[]
  multiFault: { vectorIds: string[]; expectedCodes: string[] }
}

const corpusBytes = readFileSync(
  new URL("./fixtures/semantic-integrity-vectors.json", import.meta.url),
  "utf8",
)
const corpus = JSON.parse(corpusBytes) as SemanticCorpus

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const applyMutation = (root: unknown, mutation: Mutation): void => {
  let cursor = root as Record<string | number, unknown>
  for (const segment of mutation.path.slice(0, -1)) {
    cursor = cursor[segment] as Record<string | number, unknown>
  }
  const leaf = mutation.path.at(-1)
  if (leaf === undefined) {
    throw new Error(`empty mutation path for ${JSON.stringify(mutation)}`)
  }
  if (mutation.op === "append") {
    const target = cursor[leaf]
    if (!Array.isArray(target)) {
      throw new Error(`append target is not an array: ${mutation.path.join(".")}`)
    }
    target.push(clone(mutation.value))
    return
  }
  cursor[leaf] = clone(mutation.value)
}

const mutatedValue = (vector: SemanticVector): unknown => {
  const value = clone(corpus.valid[vector.scope])
  for (const mutation of vector.mutations ?? (vector.mutation ? [vector.mutation] : [])) {
    applyMutation(value, mutation)
  }
  return value
}

const assertTransitionShape = (value: unknown): void => {
  expect(value).toMatchObject({
    kind: expect.any(String),
    lifecycle: expect.any(Object),
    events: expect.any(Array),
    beforeStateHash: expect.stringMatching(/^sha256:[0-9a-f]{64}$/u),
    afterStateHash: expect.stringMatching(/^sha256:[0-9a-f]{64}$/u),
    terminal: expect.any(Boolean),
  })
}

describe("semantic integrity shared vectors", () => {
  it("keeps every adversarial value structurally valid and the corpus deterministic", () => {
    expect(corpus.profile).toBe("semantic-integrity-v1")
    expect(corpus.publicCategory).toBe("CANONICAL_INTEGRITY_FAILURE")
    expect(corpus.ownership).toBe("system_integrity")
    expect(corpus.familyOrder).toEqual([
      "TUPLE",
      "ARENA",
      "PLAYER",
      "SOLDIER",
      "POSITION",
      "LIFECYCLE",
      "OUTCOME",
      "TRANSITION",
    ])
    expect(corpusBytes.endsWith("\n")).toBe(true)
    expect(new Set(corpus.vectors.map((vector) => vector.id)).size).toBe(
      corpus.vectors.length,
    )
    expect(corpus.vectors.length).toBeGreaterThanOrEqual(27)

    for (const vector of corpus.vectors) {
      const value = mutatedValue(vector)
      if (vector.scope === "arena") {
        expect(ArenaVariantSchema.safeParse(value).success, vector.id).toBe(true)
      } else if (vector.scope === "state") {
        expect(
          RuntimeExecutionFinalStateSchema.safeParse(value).success,
          vector.id,
        ).toBe(true)
      } else {
        assertTransitionShape(value)
      }
      expect(vector.expected.length, vector.id).toBeGreaterThan(0)
      expect(vector.expected.length).toBeLessThanOrEqual(corpus.limits.issues!)
      for (const issue of vector.expected) {
        expect(issue.path.length).toBeLessThanOrEqual(corpus.limits.pathSegments!)
        expect(Object.keys(issue.metadata).length).toBeLessThanOrEqual(
          corpus.limits.metadataEntries!,
        )
      }
    }

    const byId = new Map(corpus.vectors.map((vector) => [vector.id, vector]))
    const declaredMultiFaultCodes = corpus.multiFault.vectorIds.flatMap(
      (id) => byId.get(id)?.expected.map((issue) => issue.code) ?? [],
    )
    expect(new Set(declaredMultiFaultCodes)).toEqual(
      new Set(corpus.multiFault.expectedCodes),
    )
  })

  it("missing-semantic-contract: shared vectors require validator", () => {
    expect(ArenaVariantSchema.safeParse(mutatedValue(corpus.vectors[2]!)).success).toBe(
      true,
    )
    expect(
      RuntimeExecutionFinalStateSchema.safeParse(
        mutatedValue(corpus.vectors.find((vector) => vector.id === "position-occupancy-duplicate")!),
      ).success,
    ).toBe(true)

    throw new Error("[EXPECTED_RED:MISSING_SEMANTIC_CONTRACT:SPEC]")
  })
})
