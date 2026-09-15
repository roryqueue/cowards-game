import { createHash } from "node:crypto"
import {
  CANONICAL_ARENA_CATALOG_V1_37,
  createSetScenarioV137,
  parseArenaCatalogV137,
  admitCanonicalJsonValue,
  type ArenaCatalogV137,
} from "@cowards/spec"
import { freezeLabValue, labRoot, type LabRoot } from "../contracts.js"
import {
  CompletePayoffSnapshotSchema,
  createCompletePayoffSnapshot,
  createLeagueCell,
  LeagueCandidateAdmissionSchema,
  LeagueCellTerminalSchema,
  LeaguePayoffProjectionSchema,
  LeaguePopulationSchema,
  type CompletePayoffSnapshot,
  type LeagueCandidateAdmission,
  type LeagueCell,
  type LeagueCellTerminal,
} from "./contracts.js"
import { deriveLeagueUnorderedPairRoot } from "./identity.js"

const MAX_CHUNK_BYTES = 262144
const ROOT = /^sha256:[0-9a-f]{64}$/u
const encoder = new TextEncoder()

const fail = (code: string): never => {
  throw new TypeError(`LEAGUE_MATRIX_${code}`)
}

const root = (value: unknown): value is LabRoot =>
  typeof value === "string" && ROOT.test(value)

const canonicalBytes = (value: unknown): Uint8Array => {
  const admitted = admitCanonicalJsonValue(value, { profile: "canonical-manifest" })
  if (!admitted.ok) return fail("CANONICAL_VALUE")
  return admitted.canonicalBytes
}

const hashBytes = (bytes: Uint8Array): LabRoot =>
  `sha256:${createHash("sha256").update(bytes).digest("hex")}` as LabRoot

/** A bounded, content-addressed sequence; descriptors never retain raw cells. */
export interface LeagueCellStreamChunkDescriptor {
  readonly root: LabRoot
  readonly ordinal: number
  readonly previousRoot: LabRoot | null
  readonly bytesRoot: LabRoot
  readonly byteLength: number
}

export interface LeagueCellStreamDescriptor {
  readonly byteLength: number
  readonly chunks: readonly LeagueCellStreamChunkDescriptor[]
}

export const describeLeagueCellStream = (
  records: readonly Uint8Array[],
): Readonly<LeagueCellStreamDescriptor> => {
  let total = 0
  let ordinal = 0
  let previousRoot: LabRoot | null = null
  const chunks: LeagueCellStreamChunkDescriptor[] = []
  let current = new Uint8Array(MAX_CHUNK_BYTES)
  let used = 0
  const flush = () => {
    if (!used) return
    const bytes = current.subarray(0, used)
    const bytesRoot = hashBytes(bytes)
    const value = {
      schemaVersion: "league-cell-stream-chunk-v1",
      ordinal,
      previousRoot,
      bytesRoot,
      byteLength: bytes.byteLength,
    }
    const chunk = freezeLabValue({
      ...value,
      root: labRoot("league-cell-stream-chunk-v1", value),
    }) as LeagueCellStreamChunkDescriptor
    chunks.push(chunk)
    previousRoot = chunk.root
    ordinal += 1
    current = new Uint8Array(MAX_CHUNK_BYTES)
    used = 0
  }
  for (const record of records) {
    if (!(record instanceof Uint8Array) || record.byteLength < 1) fail("STREAM_RECORD")
    total += record.byteLength
    if (!Number.isSafeInteger(total)) fail("STREAM_SIZE")
    let offset = 0
    while (offset < record.byteLength) {
      const count = Math.min(MAX_CHUNK_BYTES - used, record.byteLength - offset)
      current.set(record.subarray(offset, offset + count), used)
      used += count
      offset += count
      if (used === MAX_CHUNK_BYTES) flush()
    }
  }
  flush()
  if (!chunks.length) fail("EMPTY_STREAM")
  return freezeLabValue({ byteLength: total, chunks }) as LeagueCellStreamDescriptor
}

export interface EnumeratedLeagueCell {
  readonly ordinal: number
  readonly cell: Readonly<LeagueCell>
  readonly bottomCandidateRoot: LabRoot
  readonly topCandidateRoot: LabRoot
}

export interface LeagueMatrix {
  readonly populationRoot: LabRoot
  readonly expectedCellCount: number
  readonly semanticGeometryHashes: readonly LabRoot[]
  readonly cells: readonly EnumeratedLeagueCell[]
}

export interface EnumerateLeagueCellsInput {
  readonly population: unknown
  readonly candidateAdmissions: readonly unknown[]
  readonly tupleRoot: LabRoot
  readonly runtimeRoot: LabRoot
  readonly baseSeed: string
  readonly arenaCatalog?: unknown
}

/** Deterministic participant ID is a private condition input, never a score or seed shortcut. */
export const leaguePlayerId = (candidateRoot: LabRoot): string => {
  if (!root(candidateRoot)) return fail("CANDIDATE_ROOT")
  return `league-${candidateRoot.slice("sha256:".length)}`
}

const activeSemanticGeometryHashes = (catalog: ArenaCatalogV137): readonly LabRoot[] => {
  const hashes = catalog.arenas
    .filter((arena) => arena.status === "active" && arena.schedulable)
    .map((arena) => arena.semanticGeometryHash as LabRoot)
    .sort()
  if (hashes.length !== 2 || new Set(hashes).size !== hashes.length) {
    return fail("ACTIVE_SEMANTIC_GEOMETRY_DUPLICATE")
  }
  return hashes
}

const admittedCandidates = (
  populationValue: unknown,
  candidateValues: readonly unknown[],
  tupleRoot: LabRoot,
  runtimeRoot: LabRoot,
): readonly Readonly<LeagueCandidateAdmission>[] => {
  const population = LeaguePopulationSchema.parse(populationValue)
  if (!root(tupleRoot) || !root(runtimeRoot) || !Array.isArray(candidateValues)) {
    return fail("ENUMERATION_INPUT")
  }
  const candidates = candidateValues.map((value) => LeagueCandidateAdmissionSchema.parse(value))
  if (candidates.length !== population.candidateAdmissionRoots.length) {
    return fail("POPULATION_COVERAGE")
  }
  const byAdmissionRoot = [...candidates].sort((left, right) =>
    left.root.localeCompare(right.root),
  )
  if (
    byAdmissionRoot.some(
      (candidate, index) => candidate.root !== population.candidateAdmissionRoots[index],
    ) ||
    new Set(candidates.map((candidate) => candidate.candidate.root)).size !== candidates.length ||
    candidates.some(
      (candidate) =>
        candidate.tupleRoot !== tupleRoot || candidate.runtimeRoot !== runtimeRoot,
    )
  ) {
    return fail("CANDIDATE_POPULATION_JOIN")
  }
  return [...candidates].sort((left, right) =>
    left.candidate.root.localeCompare(right.candidate.root),
  )
}

/** Enumerate exactly four explicit condition rows over each active semantic geometry. */
export const enumerateLeagueCells = (
  input: EnumerateLeagueCellsInput,
): Readonly<LeagueMatrix> => {
  const population = LeaguePopulationSchema.parse(input.population)
  const candidates = admittedCandidates(
    population,
    input.candidateAdmissions,
    input.tupleRoot,
    input.runtimeRoot,
  )
  if (typeof input.baseSeed !== "string" || !input.baseSeed.length) {
    return fail("BASE_SEED")
  }
  const catalog = parseArenaCatalogV137(
    input.arenaCatalog ?? CANONICAL_ARENA_CATALOG_V1_37,
  )
  const semanticGeometryHashes = activeSemanticGeometryHashes(catalog)
  const cells: EnumeratedLeagueCell[] = []
  for (let left = 0; left < candidates.length - 1; left += 1) {
    for (let right = left + 1; right < candidates.length; right += 1) {
      const entrant = candidates[left]!.candidate.root
      const opponent = candidates[right]!.candidate.root
      const pairRoot = deriveLeagueUnorderedPairRoot({
        candidateRoots: [entrant, opponent],
      })
      for (const semanticGeometryHash of semanticGeometryHashes) {
        const scenario = createSetScenarioV137({
          arenaCatalogVersion: catalog.catalogVersion,
          arenaSemanticGeometryHash: semanticGeometryHash,
          entrantA: {
            entrantKey: entrant,
            playerId: leaguePlayerId(entrant),
          },
          entrantB: {
            entrantKey: opponent,
            playerId: leaguePlayerId(opponent),
          },
          baseSeed: input.baseSeed,
        })
        for (const condition of scenario.conditions) {
          const bottomCandidateRoot =
            condition.bottomEntrantKey === entrant ? entrant : opponent
          const topCandidateRoot =
            condition.topEntrantKey === entrant ? entrant : opponent
          const conditionRoot = labRoot("league-condition-v1", {
            scenarioId: scenario.scenarioId,
            conditionId: condition.conditionId,
            requestIdentity: condition.requestIdentity,
            ordinal: condition.ordinal,
          })
          const requestRoot = labRoot("league-request-v1", {
            conditionId: condition.conditionId,
            requestIdentity: condition.requestIdentity,
          })
          cells.push(
            freezeLabValue({
              ordinal: cells.length,
              cell: createLeagueCell({
                populationRoot: population.root,
                pairRoot,
                entrantCandidateRoot: entrant,
                opponentCandidateRoot: opponent,
                conditionRoot,
                semanticGeometryHash,
                tupleRoot: input.tupleRoot,
                runtimeRoot: input.runtimeRoot,
                requestRoot,
              }),
              bottomCandidateRoot,
              topCandidateRoot,
            }) as EnumeratedLeagueCell,
          )
        }
      }
    }
  }
  const expectedCellCount = 8 * ((candidates.length * (candidates.length - 1)) / 2)
  if (cells.length !== expectedCellCount || new Set(cells.map((entry) => entry.cell.root)).size !== cells.length) {
    return fail("CELL_COVERAGE")
  }
  return freezeLabValue({
    populationRoot: population.root,
    expectedCellCount,
    semanticGeometryHashes,
    cells,
  }) as LeagueMatrix
}

export type LeagueSnapshotAdmission =
  | {
      readonly kind: "blocked"
      readonly reasonCodes: readonly string[]
      readonly processEvidence: readonly unknown[]
    }
  | {
      readonly kind: "complete"
      readonly snapshot: Readonly<CompletePayoffSnapshot>
      readonly solverPayoffBytes: Uint8Array
      readonly halfPoints: readonly (0 | 1 | 2)[]
      readonly cellStream: Readonly<LeagueCellStreamDescriptor>
      readonly processEvidence: readonly LeagueCellTerminal[]
    }

const blocked = (reasonCodes: Iterable<string>, processEvidence: readonly unknown[]): LeagueSnapshotAdmission =>
  freezeLabValue({
    kind: "blocked" as const,
    reasonCodes: [...new Set(reasonCodes)].sort(),
    processEvidence: [...processEvidence],
  }) as LeagueSnapshotAdmission

/**
 * Admit one exact terminal for every enumerated cell. Invalid evidence is retained
 * in the blocking disposition; it can never be rewritten into a synthetic payoff.
 */
export const admitCompletePayoffSnapshot = (
  matrixValue: LeagueMatrix,
  terminalValues: readonly unknown[],
): Readonly<LeagueSnapshotAdmission> => {
  const matrix = matrixValue as LeagueMatrix
  if (
    !matrix ||
    !root(matrix.populationRoot) ||
    !Number.isSafeInteger(matrix.expectedCellCount) ||
    matrix.expectedCellCount < 1 ||
    !Array.isArray(matrix.cells) ||
    matrix.cells.length !== matrix.expectedCellCount
  ) {
    return blocked(["MATRIX_INVALID"], terminalValues)
  }
  const expected = new Map<string, EnumeratedLeagueCell>()
  const reasons = new Set<string>()
  for (const entry of matrix.cells) {
    try {
      if (!Number.isSafeInteger(entry.ordinal) || entry.ordinal < 0) throw new TypeError()
      const cell = entry.cell
      if (
        cell.populationRoot !== matrix.populationRoot ||
        !root(entry.bottomCandidateRoot) ||
        !root(entry.topCandidateRoot) ||
        new Set([entry.bottomCandidateRoot, entry.topCandidateRoot]).size !== 2 ||
        ![entry.bottomCandidateRoot, entry.topCandidateRoot].includes(cell.entrantCandidateRoot) ||
        ![entry.bottomCandidateRoot, entry.topCandidateRoot].includes(cell.opponentCandidateRoot)
      ) {
        throw new TypeError()
      }
      if (expected.has(cell.root)) throw new TypeError()
      expected.set(cell.root, entry)
    } catch {
      reasons.add("MATRIX_CELL_INVALID")
    }
  }
  if (expected.size !== matrix.expectedCellCount) reasons.add("MATRIX_COVERAGE")
  if (terminalValues.length !== matrix.expectedCellCount) reasons.add("TERMINAL_COVERAGE")

  const terminals = new Map<string, LeagueCellTerminal>()
  for (const value of terminalValues) {
    const parsed = LeagueCellTerminalSchema.safeParse(value)
    if (!parsed.success) {
      reasons.add("TERMINAL_INVALID")
      continue
    }
    const terminal = parsed.data
    const entry = expected.get(terminal.cellRoot)
    if (!entry) {
      reasons.add("TERMINAL_STALE")
      continue
    }
    if (terminals.has(terminal.cellRoot)) {
      reasons.add("TERMINAL_DUPLICATE")
      continue
    }
    if (terminal.disposition !== "success" || terminal.processValidity !== "process_valid" || terminal.projection === null) {
      reasons.add("TERMINAL_PROCESS_INVALID")
      continue
    }
    try {
      const projection = LeaguePayoffProjectionSchema.parse(terminal.projection)
      const cell = entry.cell
      if (
        projection.cellRoot !== cell.root ||
        projection.entrantCandidateRoot !== cell.entrantCandidateRoot ||
        projection.conditionRoot !== cell.conditionRoot ||
        projection.semanticGeometryHash !== cell.semanticGeometryHash
      ) {
        throw new TypeError()
      }
      terminals.set(terminal.cellRoot, terminal)
    } catch {
      reasons.add("PROJECTION_JOIN")
    }
  }
  if (terminals.size !== matrix.expectedCellCount) reasons.add("TERMINAL_COVERAGE")
  if (reasons.size) return blocked(reasons, terminalValues)

  const ordered = [...matrix.cells].sort((left, right) => left.ordinal - right.ordinal)
  const projections = ordered.map((entry) => {
    const projection = terminals.get(entry.cell.root)!.projection!
    return {
      entrantCandidateRoot: entry.cell.entrantCandidateRoot,
      opponentCandidateRoot: entry.cell.opponentCandidateRoot,
      projectionRoot: projection.root,
      halfPoints: projection.halfPoints,
    }
  })
  // The solver canonicalizes its transport by entrant/opponent/projection identity,
  // independently of the cell ordinal stream retained below.
  const solverProjections = [...projections].sort((left, right) =>
    `${left.entrantCandidateRoot}:${left.opponentCandidateRoot}:${left.projectionRoot}`.localeCompare(`${right.entrantCandidateRoot}:${right.opponentCandidateRoot}:${right.projectionRoot}`),
  )
  const solverPayoffBytes = canonicalBytes(solverProjections)
  const solverPayoffRoot = labRoot("league-solver-payoffs-v1", solverProjections)
  const cellStream = describeLeagueCellStream(
    ordered.map((entry) => encoder.encode(`${entry.cell.root}\n`)),
  )
  const snapshot = createCompletePayoffSnapshot({
    populationRoot: matrix.populationRoot,
    cellChunkRoots: cellStream.chunks.map((chunk) => chunk.root).sort(),
    solverPayoffRoot,
    expectedCellCount: matrix.expectedCellCount,
    completedCellCount: matrix.expectedCellCount,
  })
  // Typed-array payloads cannot be frozen on this runtime. The rooted records and
  // descriptor are frozen; callers receive the canonical byte transport directly.
  return Object.freeze({
    kind: "complete" as const,
    snapshot: CompletePayoffSnapshotSchema.parse(snapshot),
    solverPayoffBytes,
    halfPoints: projections.map((projection) => projection.halfPoints),
    cellStream,
    processEvidence: ordered.map((entry) => terminals.get(entry.cell.root)!),
  }) as LeagueSnapshotAdmission
}
