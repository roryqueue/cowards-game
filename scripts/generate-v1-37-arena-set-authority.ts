#!/usr/bin/env -S pnpm exec tsx
import { createHash } from "node:crypto"
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
/* eslint-disable-next-line no-restricted-imports -- This sole generator must read the exact unexported authority source modules. */
import {
  CANONICAL_ARENA_CATALOG_V1_37,
  parseArenaCatalogV137,
} from "../packages/spec/src/arena-catalog-v1-37.js"
/* eslint-disable-next-line no-restricted-imports -- This sole generator must pin the compact current selector bytes directly. */
import {
  CURRENT_SEMANTIC_AUTHORITY_GENERATED,
  resolveSemanticAuthoritySelection,
  type SemanticAuthoritySelection,
} from "../packages/spec/src/current-semantic-authority-generated.js"
/* eslint-disable-next-line no-restricted-imports -- This sole generator must read the explicit candidate-only tuple record. */
import { CANDIDATE_RUNTIME_V119_SEMANTIC_TUPLE_RECORD } from "../packages/spec/src/integrity-authority.js"
/* eslint-disable-next-line no-restricted-imports -- This sole generator must read the exact unexported authority source modules. */
import {
  CANONICAL_SET_CONDITION_ROWS_V1_37,
  SET_CONDITION_POLICY_V1_37,
} from "../packages/spec/src/set-condition-policy-v1-37.js"

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
)

export const v137ArenaSetAuthorityOutputPaths = [
  "apps/go-backend/arena_set_authority_v1_37_generated.go",
  "apps/go-backend/arena_set_authority_v1_37_generated_test.go",
  "apps/go-backend/current_semantic_authority_generated.go",
] as const

const generatorName = "scripts/generate-v1-37-arena-set-authority.ts"
const candidateKey = "runtime-v1.19" as const

const stableValue = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(stableValue)
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, stableValue(child)]),
    )
  }
  return value
}

const stableJson = (value: unknown): string =>
  JSON.stringify(stableValue(value))
const sha256 = (value: string): `sha256:${string}` =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`
const goString = (value: string): string => JSON.stringify(value)

const canonicalEqual = (left: unknown, right: unknown): boolean =>
  stableJson(left) === stableJson(right)

type CandidateTuple = typeof CANDIDATE_RUNTIME_V119_SEMANTIC_TUPLE_RECORD
type ArenaCatalog = typeof CANONICAL_ARENA_CATALOG_V1_37
type SetPolicy = typeof SET_CONDITION_POLICY_V1_37
type ConditionRows = typeof CANONICAL_SET_CONDITION_ROWS_V1_37
type CurrentSelection = SemanticAuthoritySelection

export interface V137ArenaSetAuthoritySourceOverrides {
  readonly candidateTuple?: unknown
  readonly arenaCatalog?: unknown
  readonly setPolicy?: unknown
  readonly conditionRows?: unknown
  readonly currentSelection?: unknown
}

export interface V137ArenaSetAuthoritySource {
  readonly candidateSemanticAuthorityKey: typeof candidateKey
  readonly candidateTuple: CandidateTuple
  readonly arenaCatalog: ArenaCatalog
  readonly setPolicy: SetPolicy
  readonly conditionRows: ConditionRows
  readonly currentSelection: CurrentSelection
}

const assertExactSource = (
  label: string,
  value: unknown,
  expected: unknown,
): void => {
  if (!canonicalEqual(value, expected)) {
    throw new Error(`Invalid ${label}: source differs from the exact authority`)
  }
}

export const buildV137ArenaSetAuthorityArtifacts = (
  overrides: V137ArenaSetAuthoritySourceOverrides = {},
): Readonly<{
  source: V137ArenaSetAuthoritySource
  sourceSha256: `sha256:${string}`
  outputSha256: `sha256:${string}`
  currentSourceSha256: `sha256:${string}`
  currentOutputSha256: `sha256:${string}`
}> => {
  const arenaCatalog = overrides.arenaCatalog ?? CANONICAL_ARENA_CATALOG_V1_37
  try {
    parseArenaCatalogV137(arenaCatalog)
  } catch (error) {
    throw new Error(
      `Invalid arena catalog or order: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
  const candidateTuple =
    overrides.candidateTuple ?? CANDIDATE_RUNTIME_V119_SEMANTIC_TUPLE_RECORD
  const setPolicy = overrides.setPolicy ?? SET_CONDITION_POLICY_V1_37
  const conditionRows =
    overrides.conditionRows ?? CANONICAL_SET_CONDITION_ROWS_V1_37
  const currentSelection =
    overrides.currentSelection ?? CURRENT_SEMANTIC_AUTHORITY_GENERATED.selection

  assertExactSource(
    "candidate tuple",
    candidateTuple,
    CANDIDATE_RUNTIME_V119_SEMANTIC_TUPLE_RECORD,
  )
  assertExactSource("Set policy", setPolicy, SET_CONDITION_POLICY_V1_37)
  assertExactSource(
    "Set condition rows",
    conditionRows,
    CANONICAL_SET_CONDITION_ROWS_V1_37,
  )
  const resolvedCurrent = resolveSemanticAuthoritySelection({
    semanticAuthorityKey: (currentSelection as CurrentSelection)
      .semanticAuthorityKey,
  })
  if (resolvedCurrent === undefined) {
    throw new Error("Current selector is not a closed semantic selection")
  }
  assertExactSource(
    "closed current selection",
    currentSelection,
    resolvedCurrent,
  )

  const source: V137ArenaSetAuthoritySource = {
    candidateSemanticAuthorityKey: candidateKey,
    candidateTuple: candidateTuple as CandidateTuple,
    arenaCatalog: arenaCatalog as ArenaCatalog,
    setPolicy: setPolicy as SetPolicy,
    conditionRows: conditionRows as ConditionRows,
    currentSelection: currentSelection as CurrentSelection,
  }
  const candidateSource = {
    candidateSemanticAuthorityKey: source.candidateSemanticAuthorityKey,
    candidateTuple: source.candidateTuple,
    arenaCatalog: source.arenaCatalog,
    setPolicy: source.setPolicy,
    conditionRows: source.conditionRows,
  }
  return Object.freeze({
    source,
    sourceSha256: sha256(stableJson(candidateSource)),
    outputSha256: sha256(
      stableJson({
        schemaVersion: "go-arena-set-authority-v1.37-generated-v1",
        generatedBy: generatorName,
        candidate: {
          semanticAuthorityKey: source.candidateSemanticAuthorityKey,
          tuple: source.candidateTuple,
          arenaCatalog: source.arenaCatalog,
          setPolicy: source.setPolicy,
          conditionRows: source.conditionRows,
        },
      }),
    ),
    currentSourceSha256: sha256(
      JSON.stringify({
        semanticAuthorityKey: source.currentSelection.semanticAuthorityKey,
      }),
    ),
    currentOutputSha256: sha256(JSON.stringify(source.currentSelection)),
  })
}

const renderCandidateGo = (
  built: ReturnType<typeof buildV137ArenaSetAuthorityArtifacts>,
): string => {
  const { source } = built
  const arenas = source.arenaCatalog.arenas.flatMap((arena) => [
    "\t\t{",
    `\t\t\tID: ${goString(arena.id)},`,
    `\t\t\tVersion: ${goString(arena.version)},`,
    `\t\t\tName: ${goString(arena.name)},`,
    `\t\t\tStatus: ${goString(arena.status)},`,
    `\t\t\tSchedulable: ${arena.schedulable},`,
    `\t\t\tAliasOf: ${goString(arena.aliasOf ?? "")},`,
    `\t\t\tInitialBounds: arenaSetAuthorityV137Bounds{MinX: ${arena.initialBounds.minX}, MaxX: ${arena.initialBounds.maxX}, MinY: ${arena.initialBounds.minY}, MaxY: ${arena.initialBounds.maxY}},`,
    `\t\t\tTerrainStones: []arenaSetAuthorityV137Position{${arena.terrainStones.map(({ x, y }) => `{X: ${x}, Y: ${y}}`).join(", ")}},`,
    '\t\t\tArenaOwnedSetupJSON: "{}",',
    `\t\t\tSemanticGeometryHash: ${goString(arena.semanticGeometryHash)},`,
    "\t\t},",
  ])
  const rows = source.conditionRows.flatMap((row) => [
    "\t\t{",
    `\t\t\tOrdinal: ${row.ordinal},`,
    `\t\t\tSuffix: ${goString(row.suffix)},`,
    `\t\t\tBottom: ${goString(row.bottom)},`,
    `\t\t\tTop: ${goString(row.top)},`,
    `\t\t\tInitialInitiative: ${goString(row.initialInitiative)},`,
    "\t\t},",
  ])
  const tuple = source.candidateTuple.tuple
  const policy = source.setPolicy
  return `${[
    `// Code generated by ${generatorName}; DO NOT EDIT.`,
    "package main",
    "",
    `const arenaSetAuthorityV137SourceSHA256 = ${goString(built.sourceSha256)}`,
    `const arenaSetAuthorityV137OutputSHA256 = ${goString(built.outputSha256)}`,
    "",
    "type arenaSetAuthorityV137Position struct { X, Y int }",
    "type arenaSetAuthorityV137Bounds struct { MinX, MaxX, MinY, MaxY int }",
    "type arenaSetAuthorityV137Arena struct {",
    "\tID string",
    "\tVersion string",
    "\tName string",
    "\tStatus string",
    "\tSchedulable bool",
    "\tAliasOf string",
    "\tInitialBounds arenaSetAuthorityV137Bounds",
    "\tTerrainStones []arenaSetAuthorityV137Position",
    "\tArenaOwnedSetupJSON string",
    "\tSemanticGeometryHash string",
    "}",
    "type arenaSetAuthorityV137ConditionRow struct {",
    "\tOrdinal int",
    "\tSuffix string",
    "\tBottom string",
    "\tTop string",
    "\tInitialInitiative string",
    "}",
    "type arenaSetAuthorityV137Tuple struct {",
    "\tTupleID string",
    "\tRules string",
    "\tEngine string",
    "\tRuntimeABI string",
    "\tChronicle string",
    "\tArenaCatalog string",
    "\tSetPolicy string",
    "}",
    "type arenaSetAuthorityV137Policy struct {",
    "\tSchemaVersion string",
    "\tVersion string",
    "\tLifecycleStatus string",
    "\tActive bool",
    "\tActivationOwner string",
    "\tConditionCount int",
    "\tFairnessSemanticsSource string",
    "\tSeedCarriesFairnessSemantics bool",
    "\tRequiresEveryCanonicalCondition bool",
    "\tPlayerViolationIsTerminalEvidence bool",
    "\tSystemFailureIsTerminalEvidence bool",
    "\tPartialMatrixCounts bool",
    "\tCompletionOrderAffectsScoring bool",
    "}",
    "type arenaSetAuthorityV137Candidate struct {",
    "\tSchemaVersion string",
    "\tSemanticAuthorityKey string",
    "\tTuple arenaSetAuthorityV137Tuple",
    "\tArenaCatalogVersion string",
    "\tGeometryHashProfile string",
    "\tArenas []arenaSetAuthorityV137Arena",
    "\tPolicy arenaSetAuthorityV137Policy",
    "\tConditionRows []arenaSetAuthorityV137ConditionRow",
    "\tSourceSHA256 string",
    "\tOutputSHA256 string",
    "}",
    "",
    "func arenaSetAuthorityV137CandidateBySemanticAuthorityKey(key string) (arenaSetAuthorityV137Candidate, bool) {",
    `\tif key != ${goString(source.candidateSemanticAuthorityKey)} {`,
    "\t\treturn arenaSetAuthorityV137Candidate{}, false",
    "\t}",
    "\treturn arenaSetAuthorityV137Candidate{",
    `\t\tSchemaVersion: ${goString("go-arena-set-authority-v1.37-generated-v1")},`,
    `\t\tSemanticAuthorityKey: ${goString(source.candidateSemanticAuthorityKey)},`,
    "\t\tTuple: arenaSetAuthorityV137Tuple{",
    `\t\t\tTupleID: ${goString(source.candidateTuple.tupleId)},`,
    `\t\t\tRules: ${goString(tuple.rules)},`,
    `\t\t\tEngine: ${goString(tuple.engine)},`,
    `\t\t\tRuntimeABI: ${goString(tuple.runtimeAbi)},`,
    `\t\t\tChronicle: ${goString(tuple.chronicle)},`,
    `\t\t\tArenaCatalog: ${goString(tuple.arenaCatalog)},`,
    `\t\t\tSetPolicy: ${goString(tuple.setPolicy)},`,
    "\t\t},",
    `\t\tArenaCatalogVersion: ${goString(source.arenaCatalog.catalogVersion)},`,
    `\t\tGeometryHashProfile: ${goString(source.arenaCatalog.geometryHashProfile)},`,
    "\t\tArenas: []arenaSetAuthorityV137Arena{",
    ...arenas,
    "\t\t},",
    "\t\tPolicy: arenaSetAuthorityV137Policy{",
    `\t\t\tSchemaVersion: ${goString(policy.schemaVersion)},`,
    `\t\t\tVersion: ${goString(policy.version)},`,
    `\t\t\tLifecycleStatus: ${goString(policy.lifecycle.status)},`,
    `\t\t\tActive: ${policy.lifecycle.active},`,
    `\t\t\tActivationOwner: ${goString(policy.lifecycle.activationOwner)},`,
    `\t\t\tConditionCount: ${policy.conditionCount},`,
    `\t\t\tFairnessSemanticsSource: ${goString(policy.fairnessSemanticsSource)},`,
    `\t\t\tSeedCarriesFairnessSemantics: ${policy.seedCarriesFairnessSemantics},`,
    `\t\t\tRequiresEveryCanonicalCondition: ${policy.completion.requiresEveryCanonicalCondition},`,
    `\t\t\tPlayerViolationIsTerminalEvidence: ${policy.completion.playerViolationIsTerminalEvidence},`,
    `\t\t\tSystemFailureIsTerminalEvidence: ${policy.completion.systemFailureIsTerminalEvidence},`,
    `\t\t\tPartialMatrixCounts: ${policy.completion.partialMatrixCounts},`,
    `\t\t\tCompletionOrderAffectsScoring: ${policy.completion.completionOrderAffectsScoring},`,
    "\t\t},",
    "\t\tConditionRows: []arenaSetAuthorityV137ConditionRow{",
    ...rows,
    "\t\t},",
    "\t\tSourceSHA256: arenaSetAuthorityV137SourceSHA256,",
    "\t\tOutputSHA256: arenaSetAuthorityV137OutputSHA256,",
    "\t}, true",
    "}",
  ].join("\n")}\n`
}

const renderCurrentGo = (
  built: ReturnType<typeof buildV137ArenaSetAuthorityArtifacts>,
): string => {
  const selection = built.source.currentSelection
  return `${[
    `// Code generated by ${generatorName}; DO NOT EDIT.`,
    "package main",
    "",
    "type currentSemanticAuthorityGeneratedSelection struct {",
    "\tSemanticAuthorityKey string",
    "\tTupleID string",
    "\tRules string",
    "\tEngine string",
    "\tRuntimeABI string",
    "\tChronicle string",
    "\tArenaCatalog string",
    "\tSetPolicy string",
    "\tConformanceCertificateVersion string",
    "\tSourceSHA256 string",
    "\tOutputSHA256 string",
    "}",
    "",
    "func currentSemanticAuthorityGenerated() currentSemanticAuthorityGeneratedSelection {",
    "\treturn currentSemanticAuthorityGeneratedSelection{",
    `\t\tSemanticAuthorityKey: ${goString(selection.semanticAuthorityKey)},`,
    `\t\tTupleID: ${goString(selection.tupleId)},`,
    `\t\tRules: ${goString(selection.tuple.rules)},`,
    `\t\tEngine: ${goString(selection.tuple.engine)},`,
    `\t\tRuntimeABI: ${goString(selection.tuple.runtimeAbi)},`,
    `\t\tChronicle: ${goString(selection.tuple.chronicle)},`,
    `\t\tArenaCatalog: ${goString(selection.tuple.arenaCatalog)},`,
    `\t\tSetPolicy: ${goString(selection.tuple.setPolicy)},`,
    `\t\tConformanceCertificateVersion: ${goString(selection.conformanceCertificateVersion)},`,
    `\t\tSourceSHA256: ${goString(built.currentSourceSha256)},`,
    `\t\tOutputSHA256: ${goString(built.currentOutputSha256)},`,
    "\t}",
    "}",
  ].join("\n")}\n`
}

const renderGeneratedTestGo = (
  built: ReturnType<typeof buildV137ArenaSetAuthorityArtifacts>,
): string =>
  `${[
    `// Code generated by ${generatorName}; DO NOT EDIT.`,
    "package main",
    "",
    "import (",
    '\t"os"',
    '\t"reflect"',
    '\t"strings"',
    '\t"testing"',
    ")",
    "",
    "func TestArenaSetAuthorityV137CandidateProjection(t *testing.T) {",
    '\tcandidate, ok := arenaSetAuthorityV137CandidateBySemanticAuthorityKey("runtime-v1.19")',
    '\tif !ok { t.Fatal("explicit v1.19 candidate lookup failed") }',
    `\tif candidate.SourceSHA256 != ${goString(built.sourceSha256)} || candidate.OutputSHA256 != ${goString(built.outputSha256)} { t.Fatal("generated source/output digest drift") }`,
    '\tif candidate.Tuple.RuntimeABI != "strategy-runtime-abi-v1.19" || candidate.Tuple.ArenaCatalog != "canonical-arena-catalog-v1.37" || candidate.Tuple.SetPolicy != "canonical-set-policy-v1.37-four-condition-v1" { t.Fatal("candidate tuple drift") }',
    '\tif len(candidate.Arenas) != 3 || candidate.Arenas[0].ID != "arena:smoke:v1" || candidate.Arenas[1].ID != "arena:standard-cross:v1" || candidate.Arenas[2].ID != "arena:open-field:v1" { t.Fatal("arena catalog membership/order drift") }',
    '\tif candidate.Arenas[0].SemanticGeometryHash != candidate.Arenas[2].SemanticGeometryHash || candidate.Arenas[2].AliasOf != candidate.Arenas[0].ID || candidate.Arenas[2].Schedulable { t.Fatal("arena alias semantics drift") }',
    '\tif len(candidate.ConditionRows) != 4 || candidate.Policy.ConditionCount != 4 || candidate.Policy.Active || candidate.Policy.SeedCarriesFairnessSemantics || candidate.Policy.PartialMatrixCounts || candidate.Policy.SystemFailureIsTerminalEvidence || !candidate.Policy.RequiresEveryCanonicalCondition || !candidate.Policy.PlayerViolationIsTerminalEvidence { t.Fatal("four-condition policy drift") }',
    '\twantSuffixes := []string{"a-bottom-a-first", "a-bottom-b-first", "a-top-a-first", "a-top-b-first"}',
    '\tfor index, row := range candidate.ConditionRows { if row.Ordinal != index || row.Suffix != wantSuffixes[index] { t.Fatal("condition membership/order drift") } }',
    "\tcopyCandidate := candidate",
    '\tcopyCandidate.Arenas[0].ID = "mutated"',
    '\tagain, _ := arenaSetAuthorityV137CandidateBySemanticAuthorityKey("runtime-v1.19")',
    '\tif again.Arenas[0].ID != "arena:smoke:v1" { t.Fatal("candidate lookup shared mutable data") }',
    "}",
    "",
    "func TestArenaSetAuthorityV137LookupIsExplicitAndCurrentIsClosed(t *testing.T) {",
    '\tfor _, key := range []string{"", "runtime-v1.17", "runtime-v1.18", "runtime-v1.20"} { if _, ok := arenaSetAuthorityV137CandidateBySemanticAuthorityKey(key); ok { t.Fatalf("unexpected candidate lookup for %q", key) } }',
    "\tcurrent := currentSemanticAuthorityGenerated()",
    "\tswitch current.SemanticAuthorityKey {",
    '\tcase "runtime-v1.17":',
    '\t\tif current.TupleID != runtimeSuccessorSemanticTupleIDV117 || current.RuntimeABI != "strategy-runtime-abi-v1.17" || current.ArenaCatalog != "semantic-arena-catalog-v1.37-candidate-1" || current.SetPolicy != "canonical-set-policy-v1.4" || current.ConformanceCertificateVersion != "runtime-conformance-certificate-v1.17" || current.SourceSHA256 != "sha256:14296beaf5e79d731dba3de3501dde7239731ce51b0c926bced3d76f5eff29e1" || current.OutputSHA256 != "sha256:bb814addab77fd473103651eb9aac2980ed45770d5147fb54de1f703143b2ce0" { t.Fatalf("invalid v1.17 current selector: %+v", current) }',
    '\tcase "runtime-v1.19":',
    '\t\tif current.TupleID != "sha256:37c9a07425d454c74859112debcc3ef362d43e80d5767560d9bde28a3c8d5e73" || current.RuntimeABI != "strategy-runtime-abi-v1.19" || current.ArenaCatalog != "canonical-arena-catalog-v1.37" || current.SetPolicy != "canonical-set-policy-v1.37-four-condition-v1" || current.ConformanceCertificateVersion != "runtime-conformance-certificate-v1.19" || current.SourceSHA256 != "sha256:110d30db98623cb90f07b473045cf04aca3433fb823964163191a0a8cba64b61" || current.OutputSHA256 != "sha256:15030ee59b81a2bf04667e045344de36d1b11b9834e64f71be05ccf7b73d80d5" { t.Fatalf("invalid v1.19 current selector: %+v", current) }',
    "\tdefault:",
    '\t\tt.Fatalf("unknown current selector: %+v", current)',
    "\t}",
    "}",
    "",
    "func TestArenaSetAuthorityV137GeneratedProductionFilesAreDataOnly(t *testing.T) {",
    '\tfor _, name := range []string{"arena_set_authority_v1_37_generated.go", "current_semantic_authority_generated.go"} {',
    "\t\tbytes, err := os.ReadFile(name); if err != nil { t.Fatal(err) }",
    "\t\tsource := string(bytes)",
    '\t\tif strings.Contains(source, "import ") { t.Fatalf("%s must have no imports", name) }',
    '\t\tfor _, forbidden := range []string{"runMatch(", "executeStrategy", "StrategyRuntime", "recordChronicle", "database/sql", "pgx.", "net/http", "os.ReadFile"} { if strings.Contains(source, forbidden) { t.Fatalf("%s contains semantic/execution owner %q", name, forbidden) } }',
    "\t}",
    '\tfirst, _ := arenaSetAuthorityV137CandidateBySemanticAuthorityKey("runtime-v1.19")',
    '\tsecond, _ := arenaSetAuthorityV137CandidateBySemanticAuthorityKey("runtime-v1.19")',
    '\tif !reflect.DeepEqual(first, second) { t.Fatal("candidate data is nondeterministic") }',
    "}",
  ].join("\n")}\n`

export const renderV137ArenaSetAuthorityArtifacts = (
  overrides: V137ArenaSetAuthoritySourceOverrides = {},
): Readonly<
  Record<(typeof v137ArenaSetAuthorityOutputPaths)[number], string>
> => {
  const built = buildV137ArenaSetAuthorityArtifacts(overrides)
  return Object.freeze({
    [v137ArenaSetAuthorityOutputPaths[0]]: renderCandidateGo(built),
    [v137ArenaSetAuthorityOutputPaths[1]]: renderGeneratedTestGo(built),
    [v137ArenaSetAuthorityOutputPaths[2]]: renderCurrentGo(built),
  })
}

export interface V137ArenaSetAuthorityGeneratorIo {
  readonly readOutput: (relativePath: string) => string
  readonly writeOutput: (relativePath: string, bytes: string) => void
}

const defaultIo: V137ArenaSetAuthorityGeneratorIo = {
  readOutput: (relativePath) =>
    readFileSync(path.join(repoRoot, relativePath), "utf8"),
  writeOutput: (relativePath, bytes) => {
    const absolutePath = path.join(repoRoot, relativePath)
    mkdirSync(path.dirname(absolutePath), { recursive: true })
    writeFileSync(absolutePath, bytes)
  },
}

export const checkV137ArenaSetAuthorityArtifacts = (
  readOutput: V137ArenaSetAuthorityGeneratorIo["readOutput"] = defaultIo.readOutput,
): readonly string[] => {
  const rendered = renderV137ArenaSetAuthorityArtifacts()
  const findings: string[] = []
  for (const relativePath of v137ArenaSetAuthorityOutputPaths) {
    let actual: string
    try {
      actual = readOutput(relativePath)
    } catch {
      findings.push(`MISSING_OUTPUT:${relativePath}`)
      continue
    }
    if (actual !== rendered[relativePath]) {
      findings.push(`STALE_OUTPUT:${relativePath}`)
    }
  }
  return findings
}

export const runV137ArenaSetAuthorityGenerator = (
  args: readonly string[],
  io: V137ArenaSetAuthorityGeneratorIo = defaultIo,
): Readonly<{ wrote: boolean; checked: boolean }> => {
  const allowed = new Set(["--write", "--check"])
  const unknown = args.find((argument) => !allowed.has(argument))
  if (unknown) throw new Error(`Unknown generator argument: ${unknown}`)
  const write = args.includes("--write")
  const check = args.includes("--check")
  if (!write && !check) throw new Error("Generator requires --write or --check")
  if (write) {
    const rendered = renderV137ArenaSetAuthorityArtifacts()
    for (const relativePath of v137ArenaSetAuthorityOutputPaths) {
      io.writeOutput(relativePath, rendered[relativePath])
    }
  }
  if (check) {
    const findings = checkV137ArenaSetAuthorityArtifacts(io.readOutput)
    if (findings.length > 0) {
      throw new Error(
        `Go arena/Set authority check failed: ${findings.join(", ")}`,
      )
    }
  }
  return { wrote: write, checked: check }
}

const isMain =
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (isMain) {
  try {
    const result = runV137ArenaSetAuthorityGenerator(process.argv.slice(2))
    console.log(
      `[ARENA_SET_AUTHORITY:v1.37] wrote=${result.wrote} checked=${result.checked}`,
    )
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}
