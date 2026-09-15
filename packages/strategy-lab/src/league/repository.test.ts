import { afterEach, describe, expect, it } from "vitest"
import { mkdtempSync, realpathSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { labRoot, type LabRoot } from "../contracts.js"
import { createLeagueCellTerminal } from "./contracts.js"
import {
  createLeagueRepository,
  publishLeagueArtifact,
  readLeagueArtifact,
  recordLeagueCellStart,
  publishLeagueCellTerminal,
  reopenLeagueEvidence,
  type LeagueCellStart,
} from "./repository.js"

const directories: string[] = []
const root = (name: string): LabRoot => labRoot("league-repository-test-v1", name)
const repository = (onSync?: () => void) => {
  const directory = realpathSync(mkdtempSync(join(tmpdir(), "league-test-")))
  directories.push(directory)
  return createLeagueRepository(directory, onSync ? { syncDirectory: onSync } : {})
}
const directorySnapshot = (directory: string) => readdirSync(directory).sort().map((name) => [name, Buffer.from(readFileSync(join(directory, name))).toString("hex")])
const start = (marker = "cell"): LeagueCellStart => {
  const cellRoot = root(marker), allocationRoot = root("allocation")
  return { root: labRoot("league-cell-start-v1", { cellRoot, allocationRoot }), cellRoot, allocationRoot }
}
const terminal = (charged: LeagueCellStart, marker = "first") =>
  createLeagueCellTerminal({
    cellRoot: charged.cellRoot,
    disposition: "system_failure",
    processValidity: "process_invalid",
    evidenceRoot: root(`evidence:${marker}`),
    projection: null,
  })

afterEach(() => { for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true }) })

describe("immutable private league evidence", () => {
  it("publishes matching bytes idempotently and rejects a descriptor digest mismatch", () => {
    const repo = repository(), bytes = new TextEncoder().encode("root-only league artifact")
    const artifactRoot = publishLeagueArtifact(repo, bytes)
    expect(publishLeagueArtifact(repo, bytes)).toBe(artifactRoot)
    expect(readLeagueArtifact(repo, artifactRoot)).toEqual(bytes)
    writeFileSync(join(repo.directory, `league-artifact-${artifactRoot.slice(7)}.bin`), "tampered")
    expect(() => readLeagueArtifact(repo, artifactRoot)).toThrow("LEAGUE_REPOSITORY_ARTIFACT_DIGEST")
  })

  it("charges before one immutable terminal and rejects terminal overwrite or wrong start binding", () => {
    const repo = repository(), charged = start()
    recordLeagueCellStart(repo, charged)
    publishLeagueCellTerminal(repo, charged, terminal(charged))
    expect(() => publishLeagueCellTerminal(repo, charged, terminal(charged, "replacement"))).toThrow("LEAGUE_REPOSITORY_OVERWRITE")
    expect(() => publishLeagueCellTerminal(repo, { ...charged, root: root("other-start") }, terminal(charged))).toThrow()
  })

  it("reopens normal, uncertain, and partial records without any filesystem mutation", () => {
    let syncCalls = 0
    const repo = repository(() => { syncCalls += 1 }), closed = start(), uncertain = start("uncertain-cell")
    recordLeagueCellStart(repo, closed)
    publishLeagueCellTerminal(repo, closed, terminal(closed))
    recordLeagueCellStart(repo, uncertain)
    const temporary = `league-cell-${uncertain.root.slice(7)}.terminal.json.tmp-00000000-0000-4000-8000-000000000000`
    writeFileSync(join(repo.directory, temporary), "incomplete terminal bytes")
    const before = directorySnapshot(repo.directory)
    syncCalls = 0
    const reopened = reopenLeagueEvidence(repo, { maxBytes: 64 * 1024, maxRecords: 8 })
    expect(reopened.issued).toBe(false)
    expect(reopened.records).toHaveLength(2)
    expect(reopened.records.find((record) => record.start.root === uncertain.root)).toMatchObject({ terminal: { disposition: "system_failure", processValidity: "process_invalid" }, terminalProvenance: "derived_unterminated_start" })
    expect(reopened.remnants).toEqual([{ name: temporary, byteLength: "incomplete terminal bytes".length, disposition: "invalid", persisted: false }])
    expect(directorySnapshot(repo.directory)).toEqual(before)
    expect(syncCalls).toBe(0)
    expect(JSON.stringify(reopened)).not.toContain("source")
    expect(JSON.stringify(reopened)).not.toContain("memory")
    expect(() => reopenLeagueEvidence(repo, { maxBytes: 1, maxRecords: 8 })).toThrow("LEAGUE_REPOSITORY_READ_LIMIT")
    expect(directorySnapshot(repo.directory)).toEqual(before)
    expect(syncCalls).toBe(0)
  })
})
