import { afterEach, describe, expect, it, vi } from "vitest"
import { mkdtempSync, realpathSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { createHash } from "node:crypto"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { labRoot, type LabRoot } from "../contracts.js"
import { createLeagueCellTerminal } from "./contracts.js"
import {
  createLeagueRepository,
  publishLeagueArtifact,
  publishLeagueArtifactDependencies,
  readLeagueArtifact,
  recordLeagueCellStart,
  publishLeagueCellTerminal,
  reopenLeagueEvidence,
  type LeagueCellStart,
} from "./repository.js"

// Delegate real I/O; only bounded temporary-store tests enable observation or
// throw at a selected fsync. This establishes syscall order/fail-closed return,
// not a claim about simulated hardware power-loss persistence.
const syncProbe = vi.hoisted(() => ({ active: false, events: [] as string[], failAt: 0 }))
vi.mock("node:fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs")>()
  return {
    ...actual,
    fsyncSync(fd: number) {
      if (syncProbe.active) {
        syncProbe.events.push(actual.fstatSync(fd).isDirectory() ? "directory" : "file")
        if (syncProbe.failAt === syncProbe.events.length) throw Error("injected fsync failure")
      }
      return actual.fsyncSync(fd)
    },
  }
})

const directories: string[] = []
const root = (name: string): LabRoot => labRoot("league-repository-test-v1", name)
const artifactDigest = (bytes: Uint8Array): string => createHash("sha256").update(bytes).digest("hex")
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

afterEach(() => { syncProbe.active = false; syncProbe.events = []; syncProbe.failAt = 0; for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true }) })

describe("immutable private league evidence", () => {
  it("file-syncs each dependency before the group barrier and separately syncs the descriptor", () => {
    const repo = repository()
    syncProbe.active = true
    publishLeagueArtifactDependencies(repo, [new TextEncoder().encode("one"), new TextEncoder().encode("two")])
    publishLeagueArtifact(repo, new TextEncoder().encode("descriptor"))
    expect(syncProbe.events).toEqual(["file", "file", "directory", "file", "directory"])
  })
  it.each([1, 2, 3, 4, 5])("keeps publication uncredited and charges retained after fsync boundary %i fails", (failAt) => {
    const base = repository(), charged: string[] = []
    const repo = createLeagueRepository(base.directory, { beforePublication({ target }) { charged.push(target) } })
    const dependencies = [new TextEncoder().encode("one"), new TextEncoder().encode("two")], descriptor = new TextEncoder().encode("descriptor")
    syncProbe.active = true; syncProbe.failAt = failAt
    let head: LabRoot | undefined
    expect(() => {
      publishLeagueArtifactDependencies(repo, dependencies)
      head = publishLeagueArtifact(repo, descriptor)
    }).toThrow("injected fsync failure")
    expect(head).toBeUndefined()
    expect(charged).toHaveLength(failAt === 1 ? 1 : failAt <= 3 ? 2 : 3)
    expect(syncProbe.events).toHaveLength(failAt)
    const files = readdirSync(repo.directory)
    expect(files.includes(`league-artifact-${artifactDigest(descriptor)}.bin`)).toBe(failAt === 5)
    // Failed file-sync leaves the existing inspection-only temporary; no repair
    // or refund occurs. The original temporary-name/size guard still applies.
    expect(files.filter((name) => name.includes(".tmp-")).length).toBe([1, 2, 4].includes(failAt) ? 1 : 0)
  })
  it("gates journal writes before publication and leaves idempotent starts uncharged twice", () => {
    const prior = repository(), charged = start(); let calls = 0, stopped = false
    const repo = createLeagueRepository(prior.directory, { beforePublication(value) { calls++; if (stopped && !value.terminal) throw new Error("allocation-exhausted") } })
    recordLeagueCellStart(repo, charged); recordLeagueCellStart(repo, charged)
    expect(calls).toBe(1); stopped = true
    const snapshot = directorySnapshot(repo.directory)
    expect(() => recordLeagueCellStart(repo, start("other"))).toThrow("allocation-exhausted")
    expect(directorySnapshot(repo.directory)).toEqual(snapshot)
    publishLeagueCellTerminal(repo, charged, terminal(charged))
    expect(reopenLeagueEvidence(prior, { maxBytes: 1000000, maxRecords: 1000 }).records[0]!.terminalProvenance).toBe("persisted")
  })
  it("publishes matching bytes idempotently and rejects a descriptor digest mismatch", () => {
    const repo = repository(), bytes = new TextEncoder().encode("root-only league artifact")
    const artifactRoot = publishLeagueArtifact(repo, bytes)
    expect(publishLeagueArtifact(repo, bytes)).toBe(artifactRoot)
    expect(readLeagueArtifact(repo, artifactRoot)).toEqual(bytes)
    writeFileSync(join(repo.directory, `league-artifact-${artifactRoot.slice(7)}.bin`), "tampered")
    expect(() => readLeagueArtifact(repo, artifactRoot)).toThrow("LEAGUE_REPOSITORY_ARTIFACT_DIGEST")
  })

  it("publishes new, mixed and all-existing dependencies behind one real directory barrier", () => {
    const base = repository(), events: string[] = [], charges: string[] = []
    const repo = createLeagueRepository(base.directory, {
      syncDirectory(directory) { events.push("barrier"); base.durability.syncDirectory(directory) },
      beforePublication(value) { charges.push(value.target) },
    })
    const existing = new TextEncoder().encode("already durable"), first = new TextEncoder().encode("dependency one"), second = new TextEncoder().encode("dependency two")
    const existingRoot = publishLeagueArtifact(repo, existing)
    events.length = 0; charges.length = 0
    expect(publishLeagueArtifactDependencies(repo, [first, second])).toEqual([`sha256:${artifactDigest(first)}`, `sha256:${artifactDigest(second)}`])
    expect(events).toEqual(["barrier"]); expect(charges).toHaveLength(2)
    events.length = 0; charges.length = 0
    const third = new TextEncoder().encode("dependency three")
    expect(publishLeagueArtifactDependencies(repo, [existing, third])).toHaveLength(2)
    expect(charges).toHaveLength(1); expect(events).toEqual(["barrier"])
    events.length = 0; charges.length = 0
    expect(publishLeagueArtifactDependencies(repo, [existing, first])).toHaveLength(2)
    expect(charges).toHaveLength(0); expect(events).toEqual(["barrier"])
    events.length = 0
    expect(publishLeagueArtifactDependencies(repo, [])).toEqual([]); expect(events).toEqual([])
    expect(readLeagueArtifact(repo, existingRoot)).toEqual(existing)
  })
  it("rejects malformed dependencies and conflicting existing bytes without a group barrier", () => {
    const base = repository(), barriers: number[] = [], charges: string[] = []
    const repo = createLeagueRepository(base.directory, {
      syncDirectory() { barriers.push(1) },
      beforePublication(value) { charges.push(value.target) },
    })
    const valid = new TextEncoder().encode("published before later failure"), conflicting = new TextEncoder().encode("immutable target")
    const conflictingRoot = publishLeagueArtifact(repo, conflicting)
    writeFileSync(join(repo.directory, `league-artifact-${conflictingRoot.slice(7)}.bin`), "different bytes")
    barriers.length = 0; charges.length = 0
    expect(() => publishLeagueArtifactDependencies(repo, [valid, new Uint8Array()])).toThrow("LEAGUE_REPOSITORY_ARTIFACT")
    expect(barriers).toEqual([]); expect(charges).toHaveLength(1)
    expect(() => publishLeagueArtifactDependencies(repo, [valid, conflicting])).toThrow("LEAGUE_REPOSITORY_OVERWRITE")
    expect(barriers).toEqual([]); expect(charges).toHaveLength(1)
    expect(readdirSync(repo.directory)).toContain(`league-artifact-${artifactDigest(valid)}.bin`)
  })
  it("retains dependency charges and files on pre-publication or dependency-barrier failure", () => {
    const base = repository(), charges: string[] = [], barriers: string[] = []
    const repo = createLeagueRepository(base.directory, {
      syncDirectory() { barriers.push("barrier"); throw new Error("dependency-barrier-failed") },
      beforePublication(value) { charges.push(value.target); if (charges.length === 2) throw new Error("allocation-exhausted") },
    })
    const first = new TextEncoder().encode("first charged dependency"), second = new TextEncoder().encode("second charged dependency")
    let head: readonly LabRoot[] | undefined
    expect(() => { head = publishLeagueArtifactDependencies(repo, [first, second]) }).toThrow("allocation-exhausted")
    expect(head).toBeUndefined(); expect(charges).toHaveLength(2); expect(barriers).toEqual([])
    expect(readdirSync(repo.directory)).toContain(`league-artifact-${artifactDigest(first)}.bin`)
    const barrierRepo = createLeagueRepository(base.directory, {
      syncDirectory() { throw new Error("dependency-barrier-failed") },
      beforePublication(value) { charges.push(value.target) },
    })
    const third = new TextEncoder().encode("third charged dependency")
    expect(() => { head = publishLeagueArtifactDependencies(barrierRepo, [third]) }).toThrow("dependency-barrier-failed")
    expect(head).toBeUndefined(); expect(charges).toHaveLength(3)
    expect(readdirSync(base.directory)).toContain(`league-artifact-${artifactDigest(third)}.bin`)
  })
  it("does not return a descriptor head when its separate final directory barrier fails", () => {
    const base = repository(), charges: string[] = [], barriers: number[] = []
    const dependency = new TextEncoder().encode("durable dependency"), descriptor = new TextEncoder().encode("graph descriptor")
    const repo = createLeagueRepository(base.directory, {
      syncDirectory(directory) { barriers.push(1); if (barriers.length === 2) throw new Error("descriptor-barrier-failed"); base.durability.syncDirectory(directory) },
      beforePublication(value) { charges.push(value.target) },
    })
    publishLeagueArtifactDependencies(repo, [dependency])
    let head: LabRoot | undefined
    expect(() => { head = publishLeagueArtifact(repo, descriptor) }).toThrow("descriptor-barrier-failed")
    expect(head).toBeUndefined(); expect(charges).toHaveLength(2); expect(barriers).toHaveLength(2)
    expect(readdirSync(repo.directory)).toContain(`league-artifact-${artifactDigest(dependency)}.bin`)
    expect(readdirSync(repo.directory)).toContain(`league-artifact-${artifactDigest(descriptor)}.bin`)
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
