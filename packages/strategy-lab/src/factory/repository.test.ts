import { afterEach, describe, expect, it } from "vitest"
import { existsSync, mkdtempSync, realpathSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { createFactoryAttemptStart, createFactoryAttemptTerminal } from "./ledger.js"
import { createFactoryRepository, publishFactoryArtifact, publishFactoryAttemptTerminal, readFactoryArtifact, recordFactoryAttemptStart, resumeFactoryAttemptInventory } from "./repository.js"

const r = `sha256:${"a".repeat(64)}` as const
const dirs: string[] = []
const repository = () => { const dir = realpathSync(mkdtempSync(join(tmpdir(), "factory-test-"))); dirs.push(dir); return createFactoryRepository(dir) }
const start = () => createFactoryAttemptStart({ taskRoot: r, budgetRoot: r, candidateRoot: r, authoringMechanism: "automated-oracle", inputRoot: r, resourceAccountingRoot: r, retryParentRoot: null })
afterEach(() => { for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true }) })

describe("content-addressed private factory repository", () => {
  it("publishes bytes once, charges before terminal publication, and resumes conservatively", () => {
    const repo = repository(), bytes = new TextEncoder().encode("private-candidate")
    const root = publishFactoryArtifact(repo, bytes)
    expect(readFactoryArtifact(repo, root)).toEqual(bytes)
    expect(publishFactoryArtifact(repo, bytes)).toBe(root)
    const charged = start()
    recordFactoryAttemptStart(repo, charged)
    const terminal = createFactoryAttemptTerminal({ startRoot: charged.root, disposition: "system_failure", outputRoot: null, validationRoot: r, duplicateEvidenceRoot: r, finalEvidenceRoot: r })
    publishFactoryAttemptTerminal(repo, charged, terminal)
    expect(resumeFactoryAttemptInventory(repo).completedAttemptRoots).toEqual([charged.root])
  })

  it("refuses unreadable, start-only, duplicate, and unknown terminal coverage", () => {
    const repo = repository(), charged = start()
    recordFactoryAttemptStart(repo, charged)
    expect(() => resumeFactoryAttemptInventory(repo)).toThrow(/UNCERTAIN/)
    writeFileSync(join(repo.directory, `factory-attempt-${charged.root.slice(7)}.terminal.json`), "bad")
    expect(() => resumeFactoryAttemptInventory(repo)).toThrow()
  })

  it("does not permit validation or supervision work when a charged directory entry cannot be synchronized", () => {
    let directorySynced = false, validationOrSupervisionStarted = false
    const dir = realpathSync(mkdtempSync(join(tmpdir(), "factory-test-")))
    dirs.push(dir)
    const repo = createFactoryRepository(dir, { syncDirectory() { directorySynced = true; throw new Error("directory fsync failed") } })
    expect(() => {
      recordFactoryAttemptStart(repo, start())
      validationOrSupervisionStarted = true
    }).toThrow("directory fsync failed")
    expect(directorySynced).toBe(true)
    expect(validationOrSupervisionStarted).toBe(false)
  })

  it("rejects malformed roots before path construction and refuses a symlink replacement", () => {
    const repo = repository(), bytes = new TextEncoder().encode("private-candidate"), root = publishFactoryArtifact(repo, bytes)
    expect(() => readFactoryArtifact(repo, "sha256:../../../../escaped" as never)).toThrow("FACTORY_REPOSITORY_ROOT")
    const target = join(repo.directory, `factory-artifact-${root.slice(7)}.bin`)
    unlinkSync(target)
    const outside = join(repo.directory, "outside.bin")
    writeFileSync(outside, bytes)
    symlinkSync(outside, target)
    expect(() => readFactoryArtifact(repo, root)).toThrow("FACTORY_REPOSITORY_FILE")
  })

  it("recovers a named interrupted temporary publication without overwriting it or blocking one terminal", () => {
    const repo = repository(), charged = start()
    recordFactoryAttemptStart(repo, charged)
    const stale = join(repo.directory, `factory-attempt-${charged.root.slice(7)}.terminal.json.tmp`)
    writeFileSync(stale, "interrupted-terminal-bytes")
    const terminal = createFactoryAttemptTerminal({ startRoot: charged.root, disposition: "system_failure", outputRoot: null, validationRoot: r, duplicateEvidenceRoot: r, finalEvidenceRoot: r })
    publishFactoryAttemptTerminal(repo, charged, terminal)
    expect(existsSync(stale)).toBe(true)
    expect(resumeFactoryAttemptInventory(repo).completedAttemptRoots).toEqual([charged.root])
    expect(existsSync(stale)).toBe(false)
  })
})
