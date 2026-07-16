import { createHash } from "node:crypto"
import { execFileSync } from "node:child_process"
import { readFileSync } from "node:fs"
import type {
  Chronicle,
  ChronicleEvent,
  FullBoardSnapshot,
} from "@cowards/spec"
import {
  HISTORICAL_RUNTIME_V114_SEMANTIC_TUPLE,
  HISTORICAL_RUNTIME_V114_SEMANTIC_TUPLE_ID,
} from "@cowards/spec"
import { describe, expect, it } from "vitest"
import {
  resolveReplayCompatibilityIdentity,
  validateChronicle,
} from "./validate.js"
import { validateHistoricalV14Grammar } from "./historical-v1-4-grammar.js"
import {
  applyHistoricalV14Transition,
  interpretHistoricalV14Transitions,
  type HistoricalV14ReplayState,
} from "./historical-v1-4-transition.js"

const historicalVersions = Object.freeze({
  spec: "cowards-rules-v1.4",
  engine: "0.1.4",
  runtimeJs: "0.1.0",
  chronicle: "chronicle-v1.4",
  strategyRevision: "0.1.4",
  arenaVariant: "0.1.0",
})

const activationContext = Object.freeze({
  phaseNumber: 1,
  roundNumber: 1 as const,
  activationId: "1:1:0",
  activationIndex: 0,
  actingPlayerId: "bottom",
  soldierId: "mover",
})

const historicalEvents = (): ChronicleEvent[] => [
  {
    type: "MATCH_STARTED",
    sequence: 0,
    context: {},
    privacy: "public",
    payload: { matchId: "historical-v1.4-vector", seed: "v1.4-seed" },
  },
  {
    type: "ROUND_STARTED",
    sequence: 1,
    context: { phaseNumber: 1, roundNumber: 1 },
    privacy: "public",
    payload: { roundNumber: 1 },
  },
  {
    type: "STRATEGY_EVALUATED",
    sequence: 2,
    context: {
      phaseNumber: 1,
      roundNumber: 1,
      actingPlayerId: "bottom",
    },
    privacy: "owner",
    payload: { playerId: "bottom" },
  },
  {
    type: "ACTIVATION_STARTED",
    sequence: 3,
    context: activationContext,
    privacy: "public",
    payload: { soldierId: "mover" },
  },
  {
    type: "CYCLE_STARTED",
    sequence: 4,
    context: { ...activationContext, cycleIndex: 0 },
    privacy: "public",
    payload: { soldierId: "mover", cycleIndex: 0 },
  },
  {
    type: "AWARENESS_GRID_OBSERVED",
    sequence: 5,
    context: { ...activationContext, cycleIndex: 0 },
    privacy: "owner",
    payload: { soldierId: "mover", cycleIndex: 0 },
  },
  {
    type: "ACTION_EMITTED",
    sequence: 6,
    context: { ...activationContext, cycleIndex: 0 },
    privacy: "owner",
    payload: {
      soldierId: "mover",
      action: { type: "MOVE", direction: "RIGHT" },
    },
  },
  {
    type: "PUSH_ATTEMPTED",
    sequence: 7,
    context: { ...activationContext, cycleIndex: 0 },
    privacy: "public",
    payload: { soldierId: "mover", targetSoldierId: "target" },
  },
  {
    type: "PUSH_RESOLVED",
    sequence: 8,
    context: { ...activationContext, cycleIndex: 0 },
    privacy: "public",
    payload: {
      soldierId: "mover",
      targetSoldierId: "target",
      pushedOffBoard: false,
    },
  },
  {
    type: "MOVE_ADVANCED",
    sequence: 9,
    context: { ...activationContext, cycleIndex: 0 },
    privacy: "public",
    payload: { soldierId: "mover", direction: "RIGHT" },
  },
  {
    type: "BACKSTAB_RESOLVED",
    sequence: 10,
    context: { ...activationContext, cycleIndex: 0 },
    privacy: "public",
    payload: {
      boundary: "activation-end",
      pairs: [{ attackerId: "mover", victimId: "victim" }],
    },
  },
  {
    type: "SOLDIER_STONED",
    sequence: 11,
    context: { ...activationContext, cycleIndex: 0 },
    privacy: "public",
    payload: { soldierId: "victim", reason: "BACKSTAB" },
  },
  {
    type: "CYCLE_ENDED",
    sequence: 12,
    context: { ...activationContext, cycleIndex: 0 },
    privacy: "public",
    payload: { soldierId: "mover", cycleIndex: 0 },
  },
  {
    type: "ACTIVATION_ENDED",
    sequence: 13,
    context: activationContext,
    privacy: "public",
    payload: { soldierId: "mover", reason: "MATCH_ENDED" },
  },
  {
    type: "MATCH_ENDED",
    sequence: 14,
    context: {},
    privacy: "public",
    payload: { type: "DRAW" },
  },
]

const historicalChronicle = (): Chronicle => ({
  schemaVersion: "chronicle-v1.4",
  reproducibility: {
    matchId: "historical-v1.4-vector",
    seed: "v1.4-seed",
    arenaVariantId: "historical-arena",
    arenaVariantVersion: "0.1.0",
    strategyRevisionIds: ["bottom-revision", "top-revision"],
    versions: historicalVersions,
  },
  events: historicalEvents(),
  snapshots: [],
})

const initialBoard = (): FullBoardSnapshot => ({
  bounds: { minX: 0, maxX: 4, minY: 0, maxY: 4 },
  terrainStones: [],
  soldiers: [
    {
      id: "mover",
      ownerPlayerId: "bottom",
      status: "ACTIVE",
      position: { x: 1, y: 1 },
      facing: "RIGHT",
      lastSuccessfulMoveDirection: null,
    },
    {
      id: "target",
      ownerPlayerId: "top",
      status: "ACTIVE",
      position: { x: 2, y: 1 },
      facing: "UP",
      lastSuccessfulMoveDirection: null,
    },
    {
      id: "victim",
      ownerPlayerId: "top",
      status: "ACTIVE",
      position: { x: 1, y: 2 },
      facing: "UP",
      lastSuccessfulMoveDirection: null,
    },
  ],
})

const initialState = (): HistoricalV14ReplayState => ({
  board: initialBoard(),
})

const manifestPath =
  "packages/replay/src/fixtures/historical-v1-4-chronicle-manifest.json"

interface HistoricalPin {
  readonly path: string
  readonly blob: string
  readonly sha256: string
  readonly bytes: number
}

interface HistoricalManifest {
  readonly schemaVersion: string
  readonly profile: string
  readonly archive: {
    readonly tag: string
    readonly tagObject: string
    readonly peeledCommit: string
  }
  readonly resolution: {
    readonly original: string
    readonly exactTupleProfile: string
  }
  readonly originalCompatibility: typeof historicalVersions
  readonly authoritativeTuple: {
    readonly tupleId: string
    readonly tuple: typeof HISTORICAL_RUNTIME_V114_SEMANTIC_TUPLE
  }
  readonly fixtures: readonly HistoricalPin[]
  readonly originalSources: readonly HistoricalPin[]
  readonly frozenSources: {
    readonly commit: string
    readonly entries: readonly HistoricalPin[]
  }
  readonly interpretation: {
    readonly vectorId: string
    readonly algorithm: string
    readonly root: string
  }
}

const sha256 = (bytes: Uint8Array): string =>
  createHash("sha256").update(bytes).digest("hex")

const gitText = (args: readonly string[]): string =>
  execFileSync("git", [...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim()

const gitBytes = (args: readonly string[]): Uint8Array =>
  execFileSync("git", [...args], {
    encoding: "buffer",
    stdio: ["ignore", "pipe", "pipe"],
  })

const readManifest = (): HistoricalManifest =>
  JSON.parse(readFileSync(manifestPath, "utf8")) as HistoricalManifest

const expectedFixturePaths = Object.freeze([
  "packages/replay/src/reconstruct.test.ts",
  "packages/test-utils/src/replay-scenarios.ts",
])

const expectedOriginalSourcePaths = Object.freeze([
  "packages/replay/src/grammar.ts",
  "packages/replay/src/replay-transition.ts",
  "packages/spec/src/schemas.ts",
])

const expectedFrozenSourceCommit =
  "4fab0afc058232f37ba11506b5d04a1d59b2f4e0" as const

const expectedFrozenSourcePins = Object.freeze([
  {
    path: "packages/replay/src/historical-v1-4-grammar.ts",
    blob: "c1262d8fd2d2933244c033829978e33f3f3722b4",
    sha256: "c331055e4aadba3fa01142bf764247c961d1b45483a310a11af5d66ce214d108",
    bytes: 48_793,
  },
  {
    path: "packages/replay/src/historical-v1-4-transition.ts",
    blob: "b520e41d2e722ade8fb688843a62312fbba80d8e",
    sha256: "ff90b9938b9a6c85cafacf1d9b7856af70b4d87234819a50e60ab8666c37b477",
    bytes: 15_032,
  },
] as const satisfies readonly HistoricalPin[])

const expectedFrozenSourcePaths = Object.freeze(
  expectedFrozenSourcePins.map(({ path }) => path),
)

const sameOrderedPaths = (
  pins: readonly HistoricalPin[],
  expected: readonly string[],
): boolean =>
  pins.length === expected.length &&
  pins.every((pin, index) => pin.path === expected[index])

const verifyPins = (
  commit: string,
  pins: readonly HistoricalPin[],
  mismatchCode: string,
): string[] => {
  const findings: string[] = []
  for (const pin of pins) {
    try {
      const blob = gitText(["rev-parse", `${commit}:${pin.path}`])
      const bytes = gitBytes(["cat-file", "blob", blob])
      if (
        blob !== pin.blob ||
        bytes.length !== pin.bytes ||
        sha256(bytes) !== pin.sha256
      ) {
        findings.push(`${mismatchCode}:${pin.path}`)
      }
    } catch {
      findings.push(`${mismatchCode}:${pin.path}`)
    }
  }
  return findings
}

const auditHistoricalManifest = (
  manifest: HistoricalManifest,
): readonly string[] => {
  const findings: string[] = []
  const exactTopLevelKeys = [
    "archive",
    "authoritativeTuple",
    "fixtures",
    "frozenSources",
    "interpretation",
    "originalCompatibility",
    "originalSources",
    "profile",
    "resolution",
    "schemaVersion",
  ]
  if (
    JSON.stringify(Object.keys(manifest).sort()) !==
      JSON.stringify(exactTopLevelKeys) ||
    manifest.schemaVersion !== "historical-v1-4-chronicle-manifest-v1" ||
    manifest.profile !== "historical-v1.4" ||
    manifest.archive.tag !== "v1.4" ||
    manifest.resolution.original !== "unresolved_legacy" ||
    manifest.resolution.exactTupleProfile !== "historical-v1.16" ||
    JSON.stringify(manifest.originalCompatibility) !==
      JSON.stringify(historicalVersions) ||
    manifest.authoritativeTuple.tupleId !==
      HISTORICAL_RUNTIME_V114_SEMANTIC_TUPLE_ID ||
    JSON.stringify(manifest.authoritativeTuple.tuple) !==
      JSON.stringify(HISTORICAL_RUNTIME_V114_SEMANTIC_TUPLE) ||
    manifest.interpretation.vectorId !==
      "historical-v1.4-push-backstab-vector-v1" ||
    manifest.interpretation.algorithm !== "sha256"
  ) {
    findings.push("MANIFEST_INVALID")
  }
  if (
    !sameOrderedPaths(manifest.fixtures, expectedFixturePaths) ||
    !sameOrderedPaths(manifest.originalSources, expectedOriginalSourcePaths) ||
    !sameOrderedPaths(manifest.frozenSources.entries, expectedFrozenSourcePaths)
  ) {
    findings.push("ENTRY_SET_MISMATCH")
  }
  if (manifest.frozenSources.commit !== expectedFrozenSourceCommit) {
    findings.push("FROZEN_SOURCE_COMMIT_MISMATCH")
  }
  if (
    JSON.stringify(manifest.frozenSources.entries) !==
    JSON.stringify(expectedFrozenSourcePins)
  ) {
    findings.push("FROZEN_SOURCE_IDENTITY_MISMATCH")
  }
  if (gitText(["rev-parse", "refs/tags/v1.4"]) !== manifest.archive.tagObject) {
    findings.push("TAG_OBJECT_MISMATCH")
  }
  if (gitText(["rev-parse", "v1.4^{}"]) !== manifest.archive.peeledCommit) {
    findings.push("PEELED_COMMIT_MISMATCH")
  }
  findings.push(
    ...verifyPins(
      manifest.archive.peeledCommit,
      [...manifest.fixtures, ...manifest.originalSources],
      "ARCHIVED_BLOB_MISMATCH",
    ),
    ...verifyPins(
      manifest.frozenSources.commit,
      manifest.frozenSources.entries,
      "FROZEN_SOURCE_MISMATCH",
    ),
  )
  for (const pin of manifest.frozenSources.entries) {
    const working = readFileSync(pin.path)
    if (working.length !== pin.bytes || sha256(working) !== pin.sha256) {
      findings.push(`WORKING_SOURCE_MISMATCH:${pin.path}`)
    }
  }
  const interpreted = interpretHistoricalV14Transitions({
    initialState: initialState(),
    events: historicalEvents(),
  })
  if (
    !interpreted.ok ||
    interpreted.interpretationRoot !== manifest.interpretation.root
  ) {
    findings.push("INTERPRETATION_ROOT_MISMATCH")
  }
  return findings.sort()
}

describe("frozen historical v1.4 interpretation", () => {
  it("accepts original vocabulary, payloads, order, and boundaries", () => {
    expect(validateHistoricalV14Grammar(historicalChronicle())).toEqual([])
    expect(validateChronicle(historicalChronicle())).toMatchObject({
      ok: false,
      errors: [{ code: "SCHEMA_INVALID" }],
    })
  })

  it("rejects literals and boundaries outside the original v1.4 decoder", () => {
    const unknownEvent = historicalChronicle() as unknown as {
      events: Array<Record<string, unknown>>
    }
    unknownEvent.events[7] = {
      ...unknownEvent.events[7],
      type: "CURRENT_ONLY_SENTINEL",
    }
    expect(validateHistoricalV14Grammar(unknownEvent)[0]).toMatchObject({
      code: "SCHEMA_INVALID",
    })

    const unknownBoundary = historicalChronicle() as unknown as {
      events: Array<Record<string, unknown>>
    }
    unknownBoundary.events[10] = {
      ...unknownBoundary.events[10],
      payload: {
        boundary: "current-only-boundary",
        pairs: [{ attackerId: "mover", victimId: "victim" }],
      },
    }
    expect(validateHistoricalV14Grammar(unknownBoundary)[0]).toMatchObject({
      code: "SCHEMA_INVALID",
    })
  })

  it("applies original transition semantics through historical-only symbols", () => {
    let state = initialState()
    for (const event of historicalEvents()) {
      const result = applyHistoricalV14Transition(state, event)
      expect(result).toMatchObject({ ok: true })
      if (!result.ok) throw new Error(result.errors[0]?.code)
      state = result.state
    }

    expect(state).toEqual({
      board: {
        ...initialBoard(),
        soldiers: [
          {
            ...initialBoard().soldiers[0],
            position: { x: 2, y: 1 },
            facing: "RIGHT",
            lastSuccessfulMoveDirection: "RIGHT",
          },
          { ...initialBoard().soldiers[1], position: { x: 3, y: 1 } },
          { ...initialBoard().soldiers[2], status: "STONE" },
        ],
      },
      outcome: { type: "DRAW" },
    })
  })

  it("produces a deterministic order-sensitive interpretation root", () => {
    const interpreted = interpretHistoricalV14Transitions({
      initialState: initialState(),
      events: historicalEvents(),
    })
    expect(interpreted).toMatchObject({
      ok: true,
      interpretationRoot: expect.stringMatching(/^sha256:[0-9a-f]{64}$/u),
    })
    if (!interpreted.ok) throw new Error(interpreted.errors[0]?.code)

    const reordered = historicalEvents()
    ;[reordered[7], reordered[8]] = [reordered[8]!, reordered[7]!]
    const mutation = interpretHistoricalV14Transitions({
      initialState: initialState(),
      events: reordered,
    })
    expect(mutation).toMatchObject({ ok: true })
    if (!mutation.ok) throw new Error(mutation.errors[0]?.code)
    expect(mutation.interpretationRoot).not.toBe(interpreted.interpretationRoot)
  })

  it("keeps original-version resolution typed and byte-preserving", () => {
    const input = {
      profile: "historical-v1.4" as const,
      chronicle: historicalChronicle(),
    }
    const before = JSON.stringify(input)

    expect(resolveReplayCompatibilityIdentity(input)).toEqual({
      status: "historical_original_semantics",
      tupleResolution: "unresolved_legacy",
    })
    expect(JSON.stringify(input)).toBe(before)

    const unknown = {
      profile: "historical-v1.16" as const,
      compatibility: {
        tupleId: "sha256:unknown",
        tuple: {
          rules: "unknown",
          engine: "unknown",
          runtimeAbi: "unknown",
          chronicle: "unknown",
          arenaCatalog: "unknown",
          setPolicy: "unknown",
        },
      },
      chronicle: historicalChronicle(),
    }
    const unknownBefore = JSON.stringify(unknown)
    expect(resolveReplayCompatibilityIdentity(unknown)).toEqual({
      status: "invalid",
      reason: "missing_or_mixed_current_tuple",
    })
    expect(JSON.stringify(unknown)).toBe(unknownBefore)
  })

  it("has no dependency on mutable current grammar or transition helpers", () => {
    for (const file of [
      "packages/replay/src/historical-v1-4-grammar.ts",
      "packages/replay/src/historical-v1-4-transition.ts",
    ]) {
      const source = readFileSync(file, "utf8")
      expect(source).not.toMatch(
        /from\s+["']\.\/(?:grammar|replay-transition|validate|reconstruct)\.js["']/u,
      )
      expect(source).not.toContain("validateChronicleGrammar(")
      expect(source).not.toContain("applyReplayEvent(")
      expect(source).not.toContain("migrateChronicle(")
    }
  })

  it("owns every frozen v1.4 runtime schema and scheduling dependency locally", () => {
    for (const file of [
      "packages/replay/src/historical-v1-4-grammar.ts",
      "packages/replay/src/historical-v1-4-transition.ts",
    ]) {
      const source = readFileSync(file, "utf8")
      const specImports =
        source
          .match(/import[\s\S]*?from\s+["'][^"']+["']/gu)
          ?.filter((statement) => statement.includes('"@cowards/spec"')) ?? []
      expect(
        specImports.every((statement) => /^import\s+type\b/u.test(statement)),
      ).toBe(true)
    }
    const grammar = readFileSync(
      "packages/replay/src/historical-v1-4-grammar.ts",
      "utf8",
    )
    expect(grammar).toContain("HISTORICAL_V14_MAX_ACTIVATION_CYCLES = 12")
    expect(grammar).toContain("1: 1")
    expect(grammar).toContain("2: 2")
    expect(grammar).toContain("3: 3")
    expect(grammar).toContain("4: 4")
  })

  it.each([
    { type: "WIN", winnerPlayerId: "bottom" },
    { type: "DRAW" },
    { type: "FAILED", reason: "MAX_PHASES_EXCEEDED" },
  ] as const)("applies frozen historical $type outcomes", (outcome) => {
    const result = applyHistoricalV14Transition(initialState(), {
      type: "MATCH_ENDED",
      sequence: 0,
      context: {},
      privacy: "public",
      payload: outcome,
    })

    expect(result).toEqual({
      ok: true,
      state: {
        ...initialState(),
        outcome,
      },
    })
  })

  it("pins the strict archived and frozen source identity manifest", () => {
    expect(auditHistoricalManifest(readManifest())).toEqual([])
  })

  it("rejects missing, extra, changed, or relabeled manifest evidence", () => {
    const manifest = readManifest()
    expect(
      auditHistoricalManifest({
        ...manifest,
        fixtures: manifest.fixtures.slice(1),
      }),
    ).toContain("ENTRY_SET_MISMATCH")
    expect(
      auditHistoricalManifest({
        ...manifest,
        originalSources: [
          ...manifest.originalSources,
          { ...manifest.originalSources[0]!, path: "extra-source.ts" },
        ],
      }),
    ).toContain("ENTRY_SET_MISMATCH")
    expect(
      auditHistoricalManifest({
        ...manifest,
        fixtures: manifest.fixtures.map((pin, index) =>
          index === 0 ? { ...pin, sha256: "0".repeat(64) } : pin,
        ),
      }),
    ).toContain(`ARCHIVED_BLOB_MISMATCH:${expectedFixturePaths[0]}`)
    expect(
      auditHistoricalManifest({
        ...manifest,
        frozenSources: {
          ...manifest.frozenSources,
          entries: manifest.frozenSources.entries.map((pin, index) =>
            index === 0 ? { ...pin, bytes: pin.bytes + 1 } : pin,
          ),
        },
      }),
    ).toContain(`FROZEN_SOURCE_MISMATCH:${expectedFrozenSourcePaths[0]}`)
    expect(
      auditHistoricalManifest({
        ...manifest,
        frozenSources: {
          ...manifest.frozenSources,
          commit: manifest.archive.peeledCommit,
        },
      }),
    ).toContain("FROZEN_SOURCE_COMMIT_MISMATCH")
    expect(
      auditHistoricalManifest({
        ...manifest,
        frozenSources: {
          ...manifest.frozenSources,
          entries: manifest.frozenSources.entries.map((pin, index) =>
            index === 0
              ? { ...pin, blob: manifest.originalSources[0]!.blob }
              : pin,
          ),
        },
      }),
    ).toContain("FROZEN_SOURCE_IDENTITY_MISMATCH")
    expect(
      auditHistoricalManifest({
        ...manifest,
        resolution: { ...manifest.resolution, original: "current_exact" },
      }),
    ).toContain("MANIFEST_INVALID")
  })

  it("leaves archived inputs and frozen sources byte-identical after reads", () => {
    const manifest = readManifest()
    const observedPaths = [
      manifestPath,
      ...manifest.frozenSources.entries.map(({ path }) => path),
    ]
    const before = observedPaths.map((path) => ({
      path,
      bytes: readFileSync(path),
    }))
    const archiveBefore = [
      ...manifest.fixtures,
      ...manifest.originalSources,
    ].map((pin) => ({
      path: pin.path,
      bytes: gitBytes(["cat-file", "blob", pin.blob]),
    }))

    expect(validateHistoricalV14Grammar(historicalChronicle())).toEqual([])
    expect(
      interpretHistoricalV14Transitions({
        initialState: initialState(),
        events: historicalEvents(),
      }),
    ).toMatchObject({ ok: true })
    expect(auditHistoricalManifest(manifest)).toEqual([])

    expect(
      observedPaths.map((path) => ({
        path,
        bytes: readFileSync(path),
      })),
    ).toEqual(before)
    expect(
      [...manifest.fixtures, ...manifest.originalSources].map((pin) => ({
        path: pin.path,
        bytes: gitBytes(["cat-file", "blob", pin.blob]),
      })),
    ).toEqual(archiveBefore)
  })
})
