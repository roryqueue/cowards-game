import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import {
  ArenaVariantSchema,
  RuntimeExecutionFinalStateSchema,
} from "./schemas.js"
import {
  DEFAULT_SEMANTIC_INTEGRITY_LIMITS,
  SEMANTIC_INTEGRITY_CODE_ORDER,
  SEMANTIC_INTEGRITY_FAMILY_ORDER,
  createSemanticIntegrityResult,
  projectPublicSemanticIntegrityFailure,
  projectRestrictedSemanticIntegrityFailure,
  validateCanonicalArena,
  validateCanonicalGameState,
  validateCanonicalInitialGameState,
  validateCanonicalTransition,
  type CanonicalSemanticGameState,
  type CanonicalSemanticTransition,
  type SemanticIntegrityIssueInput,
} from "./semantic-integrity.js"

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
      throw new Error(
        `append target is not an array: ${mutation.path.join(".")}`,
      )
    }
    target.push(clone(mutation.value))
    return
  }
  cursor[leaf] = clone(mutation.value)
}

const mutatedValue = (vector: SemanticVector): unknown => {
  const value = clone(corpus.valid[vector.scope])
  for (const mutation of vector.mutations ??
    (vector.mutation ? [vector.mutation] : [])) {
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
  it("codes have one explicit family and stable precedence", () => {
    expect(SEMANTIC_INTEGRITY_FAMILY_ORDER).toEqual(corpus.familyOrder)
    const knownCodes = new Set(SEMANTIC_INTEGRITY_CODE_ORDER)
    for (const vector of corpus.vectors) {
      for (const issue of vector.expected) {
        expect(knownCodes.has(issue.code as never), issue.code).toBe(true)
      }
    }
    expect(new Set(SEMANTIC_INTEGRITY_CODE_ORDER).size).toBe(
      SEMANTIC_INTEGRITY_CODE_ORDER.length,
    )
  })

  it("bounds issues, paths, metadata, and truncation deterministically", () => {
    const unbounded = Array.from({ length: 24 }, (_, index) => ({
      code: "POSITION_OUT_OF_BOUNDS" as const,
      path: [
        "soldiers",
        index,
        "position",
        "x".repeat(400),
        "tail-1",
        "tail-2",
        "tail-3",
        "tail-4",
        "tail-5",
      ],
      metadata: {
        side: "bottom" as const,
        actual: "é".repeat(100),
        expected: "inside-bounds",
        count: index,
        rule: "position-admission",
        hostPath: "/Users/private/source.ts",
      },
    })) satisfies SemanticIntegrityIssueInput[]
    const result = createSemanticIntegrityResult(unbounded)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.truncated).toBe(true)
    expect(result.issues).toHaveLength(DEFAULT_SEMANTIC_INTEGRITY_LIMITS.issues)
    for (const issue of result.issues) {
      expect(issue.path.length).toBeLessThanOrEqual(
        DEFAULT_SEMANTIC_INTEGRITY_LIMITS.pathSegments,
      )
      expect(Object.keys(issue.metadata).length).toBeLessThanOrEqual(
        DEFAULT_SEMANTIC_INTEGRITY_LIMITS.metadataEntries,
      )
      expect(issue.metadata).not.toHaveProperty("hostPath")
      expect(Object.isFrozen(issue)).toBe(true)
      expect(Object.isFrozen(issue.path)).toBe(true)
      expect(Object.isFrozen(issue.metadata)).toBe(true)
    }
  })

  it("order is invariant under insertion and locale-sensitive input order", () => {
    const byCode = new Map(
      corpus.vectors.flatMap((vector) =>
        vector.expected.map((issue) => [issue.code, issue] as const),
      ),
    )
    const issues = corpus.multiFault.expectedCodes.map(
      (code) => byCode.get(code)!,
    ) as SemanticIntegrityIssueInput[]
    const forward = createSemanticIntegrityResult(issues)
    const reverse = createSemanticIntegrityResult([...issues].reverse())
    expect(reverse).toEqual(forward)
    expect(forward.ok ? [] : forward.issues.map((issue) => issue.code)).toEqual(
      corpus.multiFault.expectedCodes,
    )
    const samePath = [
      {
        code: "TRANSITION_HASH_MISMATCH" as const,
        path: ["afterStateHash"],
        metadata: { rule: "zeta" },
      },
      {
        code: "TRANSITION_HASH_MISMATCH" as const,
        path: ["afterStateHash"],
        metadata: { rule: "alpha" },
      },
    ]
    expect(createSemanticIntegrityResult(samePath)).toEqual(
      createSemanticIntegrityResult([...samePath].reverse()),
    )
  })

  it("projection separates public category from bounded restricted evidence", () => {
    const result = createSemanticIntegrityResult([
      {
        code: "TRANSITION_HASH_MISMATCH",
        path: ["afterStateHash"],
        metadata: {
          rule: "state-hash",
          actual: "private-but-bounded",
          hostPath: "/Users/private/source.ts",
        },
      } as SemanticIntegrityIssueInput,
    ])
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(projectPublicSemanticIntegrityFailure(result)).toEqual({
      category: "CANONICAL_INTEGRITY_FAILURE",
    })
    const restricted = projectRestrictedSemanticIntegrityFailure(result, {
      transitionKind: "ACTIVATION_SLOT",
      beforeStateHash:
        "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      afterStateHash:
        "sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    })
    expect(Object.keys(restricted)).toEqual([
      "category",
      "ownership",
      "issues",
      "truncated",
      "transitionKind",
      "beforeStateHash",
      "afterStateHash",
    ])
    expect(JSON.stringify(restricted)).not.toContain("/Users/private")
    expect(JSON.stringify(restricted)).not.toContain("hostPath")
  })

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
        expect(ArenaVariantSchema.safeParse(value).success, vector.id).toBe(
          true,
        )
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
        expect(issue.path.length).toBeLessThanOrEqual(
          corpus.limits.pathSegments!,
        )
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

  it("validates every shared semantic vector with exact stable issues", () => {
    for (const vector of corpus.vectors) {
      const value = mutatedValue(vector)
      const result =
        vector.scope === "arena"
          ? validateCanonicalArena(
              value as Parameters<typeof validateCanonicalArena>[0],
            )
          : vector.scope === "transition"
            ? validateCanonicalTransition(value as CanonicalSemanticTransition)
            : vector.id === "arena-start-noncanonical"
              ? validateCanonicalInitialGameState(
                  value as CanonicalSemanticGameState,
                )
              : validateCanonicalGameState(value as CanonicalSemanticGameState)
      expect(result.ok, vector.id).toBe(false)
      if (result.ok) continue
      expect(
        result.issues.map(({ code, path, metadata }) => ({
          code,
          path: [...path],
          metadata: { ...metadata },
        })),
        vector.id,
      ).toEqual(vector.expected)
      expect(result.category).toBe("CANONICAL_INTEGRITY_FAILURE")
      expect(result.ownership).toBe("system_integrity")
    }
  })

  it("admits valid current starts and facing-preserving v1.4 STONE and FALLEN states", () => {
    const arenaBefore = JSON.stringify(corpus.valid.arena)
    const stateBefore = JSON.stringify(corpus.valid.state)
    const transitionBefore = JSON.stringify(corpus.valid.transition)
    expect(validateCanonicalArena(corpus.valid.arena as never)).toMatchObject({
      ok: true,
    })
    expect(
      validateCanonicalInitialGameState(
        corpus.valid.state as CanonicalSemanticGameState,
      ),
    ).toMatchObject({ ok: true })
    expect(
      validateCanonicalTransition(
        corpus.valid.transition as unknown as CanonicalSemanticTransition,
      ),
    ).toMatchObject({ ok: true })

    const stoned = clone(corpus.valid.state) as CanonicalSemanticGameState
    ;(stoned.soldiers[0] as { status: string }).status = "STONE"
    expect(stoned.soldiers[0]?.facing).toBe("UP")
    expect(validateCanonicalGameState(stoned)).toMatchObject({ ok: true })

    const fallen = clone(corpus.valid.state) as CanonicalSemanticGameState
    ;(fallen.soldiers[0] as { status: string; position: unknown }).status =
      "FALLEN"
    ;(fallen.soldiers[0] as { position: unknown }).position = null
    expect(fallen.soldiers[0]?.facing).toBe("UP")
    expect(validateCanonicalGameState(fallen)).toMatchObject({ ok: true })

    expect(JSON.stringify(corpus.valid.arena)).toBe(arenaBefore)
    expect(JSON.stringify(corpus.valid.state)).toBe(stateBefore)
    expect(JSON.stringify(corpus.valid.transition)).toBe(transitionBefore)
  })

  it("allows a causal event prefix only when one final MATCH_ENDED closes the transition", () => {
    const base = clone(
      corpus.valid.transition,
    ) as unknown as CanonicalSemanticTransition
    const causalTerminal = {
      ...base,
      terminal: true,
      events: [
        { type: "SOLDIER_FELL", sequence: 0 },
        { type: "MATCH_ENDED", sequence: 1 },
      ],
      afterStateHash:
        "sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    }
    expect(validateCanonicalTransition(causalTerminal)).toMatchObject({
      ok: true,
    })

    for (const events of [
      [
        { type: "MATCH_ENDED", sequence: 0 },
        { type: "SOLDIER_FELL", sequence: 1 },
      ],
      [
        { type: "MATCH_ENDED", sequence: 0 },
        { type: "MATCH_ENDED", sequence: 1 },
      ],
    ]) {
      const invalid = validateCanonicalTransition({
        ...causalTerminal,
        events,
      })
      expect(invalid.ok).toBe(false)
      if (!invalid.ok) {
        expect(invalid.issues.map((entry) => entry.code)).toContain(
          "TRANSITION_POST_TERMINAL",
        )
      }
    }
  })

  it.each([
    [
      "expanded current bounds",
      (state: CanonicalSemanticGameState) => ({
        ...state,
        bounds: { ...state.bounds, maxX: state.bounds.maxX + 1 },
      }),
      "ARENA_BOUNDS_INVERTED",
    ],
    [
      "terrain authority drift",
      (state: CanonicalSemanticGameState) => ({
        ...state,
        terrainStones: [...state.terrainStones, { x: 1, y: 1 }],
      }),
      "ARENA_TERRAIN_AUTHORITY_MISMATCH",
    ],
    [
      "round quota drift",
      (state: CanonicalSemanticGameState) => ({
        ...state,
        roundNumber: 2 as const,
      }),
      "LIFECYCLE_QUOTA_MISMATCH",
    ],
    [
      "phase/contraction drift",
      (state: CanonicalSemanticGameState) => ({ ...state, phaseNumber: 2 }),
      "ARENA_BOUNDS_INVERTED",
    ],
  ] as const)(
    "rejects %s with a stable semantic code",
    (_name, mutate, code) => {
      const result = validateCanonicalGameState(
        mutate(clone(corpus.valid.state) as CanonicalSemanticGameState),
      )
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.issues.map((entry) => entry.code)).toContain(code)
      }
    },
  )
})
