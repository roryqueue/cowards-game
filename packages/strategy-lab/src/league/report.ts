import { admitCanonicalJsonBytes, admitCanonicalJsonValue } from "@cowards/spec"
import { exactLabKeys, freezeLabValue, labRoot, type LabRoot } from "../contracts.js"
import {
  CompletePayoffSnapshotSchema,
  createLeagueReportDescriptor,
  LeagueMixtureSchema,
  LeaguePortfolioSchema,
  LeagueReportDescriptorSchema,
  LeagueSolverManifestSchema,
  LeagueSolverOutputSchema,
  type LeagueReportDescriptor,
} from "./contracts.js"
import { publishLeagueArtifact, readLeagueArtifact, type LeagueRepository, type ReopenedLeagueEvidence } from "./repository.js"

const ROOT = /^sha256:[0-9a-f]{64}$/u
const CAP = 262144
const fail = (code: string): never => { throw new TypeError(`LEAGUE_REPORT_${code}`) }
const isRoot = (value: unknown): value is LabRoot => typeof value === "string" && ROOT.test(value)
const exact = (value: unknown, keys: readonly string[]): value is Record<string, unknown> => exactLabKeys(value, keys)
const projectionKeys = ["population", "conditions", "semanticArenas", "oracleFamilies", "policyRoots", "tupleRoot", "runtimeRoot", "allocationLedger", "iterationCurves", "payoffMatrix", "distributions", "bestResponseGraph", "pureWorstCases", "responseGaps", "attempts"]
const banned = /(?:source|memory|objective|prompt|context|raw.?trace|runtime.?diagnostic|holdout|formation|public|deploy(?:ment)?|strategyrevision)/iu
const claimBanned = /(?:nash|optimal(?:ity)?|solved|exact exploitability|permanent balance|meta-free)/iu

const auditProjection = (value: unknown, path = "projection"): void => {
  if (value === null || typeof value === "boolean" || typeof value === "number") return
  if (typeof value === "string") {
    if (/(?:^|\.)(?:claim|claims)$/u.test(path) && claimBanned.test(value)) fail("CLAIM")
    return
  }
  if (Array.isArray(value)) { value.forEach((entry, ordinal) => auditProjection(entry, `${path}[${ordinal}]`)); return }
  if (typeof value !== "object") return fail("PROJECTION")
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (banned.test(key)) fail("PROJECTION_DENIED")
    auditProjection(entry, `${path}.${key}`)
  }
}

const admitReopen = (value: unknown, expectedCells: number): Readonly<ReopenedLeagueEvidence> => {
  if (!value || typeof value !== "object" || (value as { issued?: unknown }).issued !== false || !Array.isArray((value as { records?: unknown }).records) || !Array.isArray((value as { remnants?: unknown }).remnants)) return fail("REOPEN")
  const reopened = value as ReopenedLeagueEvidence
  if (reopened.remnants.length || reopened.records.length !== expectedCells || reopened.records.some((record) =>
    record.terminalProvenance !== "persisted" || record.terminal.disposition !== "success" || record.terminal.processValidity !== "process_valid" || record.terminal.cellRoot !== record.start.cellRoot)) return fail("REOPEN_INCOMPLETE")
  if (new Set(reopened.records.map((record) => record.start.root)).size !== reopened.records.length) return fail("REOPEN_INCOMPLETE")
  return reopened
}

export interface PublishedLeagueReport {
  readonly descriptor: LeagueReportDescriptor
  readonly reportRoot: LabRoot
}

/** Publish only a complete, root-qualified aggregate projection. No source or execution authority enters the report. */
export const publishLeagueReport = (input: {
  readonly repository: LeagueRepository
  readonly snapshot: unknown
  readonly solverManifest: unknown
  readonly solver: unknown
  readonly mixture: unknown
  readonly portfolio: unknown
  readonly redTeamRoot: LabRoot
  readonly finalistDispositionRoot: LabRoot
  readonly reopen: unknown
  readonly projection: unknown
}): Readonly<PublishedLeagueReport> => {
  if (!input.repository || !isRoot(input.redTeamRoot) || !isRoot(input.finalistDispositionRoot)) return fail("INPUT")
  const snapshot = CompletePayoffSnapshotSchema.parse(input.snapshot)
  const manifest = LeagueSolverManifestSchema.parse(input.solverManifest)
  const solver = LeagueSolverOutputSchema.parse(input.solver)
  const mixture = LeagueMixtureSchema.parse(input.mixture)
  const portfolio = LeaguePortfolioSchema.parse(input.portfolio)
  if (manifest.snapshotRoot !== snapshot.root || solver.manifestRoot !== manifest.root || solver.snapshotRoot !== snapshot.root || mixture.snapshotRoot !== snapshot.root || mixture.solverOutputRoot !== solver.root || portfolio.mixtureRoot !== mixture.root) return fail("GRAPH_STALE")
  const reopened = admitReopen(input.reopen, snapshot.expectedCellCount)
  auditProjection(input.projection)
  const arraySections = projectionKeys.filter((key) => !["population", "tupleRoot", "runtimeRoot", "policyRoots"].includes(key))
  if (!exact(input.projection, projectionKeys)) return fail("PROJECTION")
  const projection = input.projection
  if (projection.population === null || typeof projection.population !== "object" || Array.isArray(projection.population) || !isRoot(projection.tupleRoot) || !isRoot(projection.runtimeRoot) || !Array.isArray(projection.policyRoots) || !projection.policyRoots.every(isRoot) || projection.policyRoots.length < 1 || arraySections.some((key) => !Array.isArray(projection[key]))) return fail("PROJECTION")
  const report = {
    schemaVersion: "league-private-report-v1" as const,
    privacy: "private_offline" as const,
    snapshotRoot: snapshot.root,
    solverManifestRoot: manifest.root,
    solverOutputRoot: solver.root,
    mixtureRoot: mixture.root,
    portfolioRoot: portfolio.root,
    redTeamRoot: input.redTeamRoot,
    finalistDispositionRoot: input.finalistDispositionRoot,
    reopenedRecordRoots: reopened.records.map((record) => record.start.root).sort(),
    projection,
  }
  const encoded = admitCanonicalJsonValue(report, { profile: "canonical-manifest" })
  if (!encoded.ok || encoded.canonicalByteLength < 1 || encoded.canonicalByteLength > CAP) return fail("REPORT_BYTES")
  const reportRoot = publishLeagueArtifact(input.repository, encoded.canonicalBytes)
  const descriptor = createLeagueReportDescriptor({ snapshotRoot: snapshot.root, solverOutputRoot: solver.root, redTeamRoot: input.redTeamRoot, portfolioRoot: portfolio.root, finalistDispositionRoot: input.finalistDispositionRoot, reportChunkRoots: [reportRoot] })
  return freezeLabValue({ descriptor, reportRoot }) as PublishedLeagueReport
}

export interface ReopenedLeagueReport {
  readonly issued: false
  readonly descriptor: LeagueReportDescriptor
  readonly chunks: readonly Readonly<{ root: LabRoot; report: Readonly<Record<string, unknown>> }>[]
}

/** Bounded reopening reads immutable aggregate chunks only; it neither renews execution nor repairs retained records. */
export const reopenLeagueReport = (input: { readonly repository: LeagueRepository; readonly descriptor: unknown; readonly maxBytes: number; readonly maxRecords: number }): Readonly<ReopenedLeagueReport> => {
  if (!input.repository || !Number.isSafeInteger(input.maxBytes) || !Number.isSafeInteger(input.maxRecords) || input.maxBytes < 1 || input.maxRecords < 1) return fail("READ_LIMITS")
  const descriptor = LeagueReportDescriptorSchema.parse(input.descriptor)
  if (descriptor.reportChunkRoots.length > input.maxRecords) return fail("READ_LIMIT")
  let bytes = 0
  const chunks = descriptor.reportChunkRoots.map((root) => {
    const raw = readLeagueArtifact(input.repository, root)
    bytes += raw.byteLength
    if (bytes > input.maxBytes) return fail("READ_LIMIT")
    const parsed = admitCanonicalJsonBytes(raw, { profile: "canonical-manifest", operation: "require-canonical" })
    if (!parsed.ok || !exact(parsed.value, ["schemaVersion", "privacy", "snapshotRoot", "solverManifestRoot", "solverOutputRoot", "mixtureRoot", "portfolioRoot", "redTeamRoot", "finalistDispositionRoot", "reopenedRecordRoots", "projection"])) return fail("CHUNK")
    const report = parsed.value
    if (report.schemaVersion !== "league-private-report-v1" || report.privacy !== "private_offline" || report.snapshotRoot !== descriptor.snapshotRoot || report.solverOutputRoot !== descriptor.solverOutputRoot || report.redTeamRoot !== descriptor.redTeamRoot || report.portfolioRoot !== descriptor.portfolioRoot || report.finalistDispositionRoot !== descriptor.finalistDispositionRoot) return fail("CHUNK_BINDING")
    auditProjection(report.projection)
    return freezeLabValue({ root, report: freezeLabValue(report) })
  })
  return freezeLabValue({ issued: false as const, descriptor, chunks }) as ReopenedLeagueReport
}
