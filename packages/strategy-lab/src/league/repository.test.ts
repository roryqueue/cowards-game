import { afterEach, describe, expect, it } from "vitest"
import { mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs"
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
const repository = () => {
  const directory = realpathSync(mkdtempSync(join(tmpdir(), "league-test-")))
  directories.push(directory)
  return createLeagueRepository(directory)
}
const start = (): LeagueCellStart => ({
  root: labRoot("league-cell-start-v1", { cellRoot: root("cell"), allocationRoot: root("allocation") }),
  cellRoot: root("cell"),
  allocationRoot: root("allocation"),
})
const terminal = (charged: LeagueCellStart, disposition: "success" | "system_failure" = "system_failure") =>
  createLeagueCellTerminal({
    cellRoot: charged.cellRoot,
    disposition,
    processValidity: disposition === "success" ? "process_valid" : "process_invalid",
    evidenceRoot: root(`evidence:${disposition}`),
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
    expect(() => publishLeagueCellTerminal(repo, charged, terminal(charged, "success"))).toThrow("LEAGUE_REPOSITORY_OVERWRITE")
    expect(() => publishLeagueCellTerminal(repo, { ...charged, root: root("other-start") }, terminal(charged))).toThrow()
  })

  it("reopens bounded root-only records and terminalizes an uncertain start as charged process failure", () => {
    const repo = repository(), closed = start(), uncertain = { ...start(), root: root("uncertain-start"), cellRoot: root("uncertain-cell") }
    recordLeagueCellStart(repo, closed)
    publishLeagueCellTerminal(repo, closed, terminal(closed))
    recordLeagueCellStart(repo, uncertain)
    const reopened = reopenLeagueEvidence(repo, { maxBytes: 64 * 1024, maxRecords: 8 })
    expect(reopened.issued).toBe(false)
    expect(reopened.records).toHaveLength(2)
    expect(reopened.records.find((record) => record.start.root === uncertain.root)?.terminal).toMatchObject({ disposition: "system_failure", processValidity: "process_invalid" })
    expect(JSON.stringify(reopened)).not.toContain("source")
    expect(JSON.stringify(reopened)).not.toContain("memory")
    expect(() => reopenLeagueEvidence(repo, { maxBytes: 1, maxRecords: 8 })).toThrow("LEAGUE_REPOSITORY_READ_LIMIT")
  })
})
