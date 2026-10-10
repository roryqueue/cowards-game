import { describe, expect, it, vi } from "vitest"
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs"
import * as childProcess from "node:child_process"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { labRoot } from "../../packages/strategy-lab/src/contracts.js"
import { leanCanonicalBytes } from "../../packages/strategy-lab/src/league/lean-experiment.js"
import { createLeanPrivateProbeScheduleV1 } from "../run-v1-38-lean-private-probe.js"
const gitFixture = vi.hoisted(() => ({ repository: "" }))
vi.mock("node:child_process", async importOriginal => {
  const actual = await importOriginal<typeof import("node:child_process")>()
  return { ...actual, execFileSync: ((command: string, args: string[], options: object) => actual.execFileSync(command, command === "git" && gitFixture.repository ? ["-C", gitFixture.repository, ...args] : args, options)) as typeof actual.execFileSync }
})
import * as authority from "./v1-38-lean-experiment-authority.js"

describe("private probe authority surface", () => {
  it("exports a distinct admission opener, debit issuer, and ordered claim", () => {
    expect(authority.openLeanPrivateProbeAdmissionV1).toBeTypeOf("function")
    expect(authority.recordAndIssueLeanPrivateProbeRuntimeAuthorityV1).toBeTypeOf("function")
    expect(authority.claimLeanPrivateProbeRuntimeAuthority).toBeTypeOf("function")
  })

  it("does not treat caller-created capability-shaped objects as authority", () => {
    const fabricated = { schemaVersion: "lean-private-probe-runtime-authority-v1" }
    expect(() => authority.claimLeanPrivateProbeRuntimeAuthority(fabricated as never, {} as never, "factory")).toThrow("LEAN_PRIVATE_PROBE_AUTHORITY")
  })
})

describe("actual inert Git/filesystem debit authority", () => {
  it.each(["requestRoot", "inputRoot", "caseId", "extra", "delimiter"])("permanently rejects changed prior %s after actual ordered claims", key => {
    const repository = realpathSync(mkdtempSync(join(tmpdir(), "probe-authority-git-")))
    const git = childProcess.execFileSync.bind(childProcess)
    const runGit = (...args: string[]) => String(git("git", ["-C", repository, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] })).trim()
    try {
      runGit("init", "-q"); runGit("-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit", "--allow-empty", "-qm", "fixture")
      const sourceHead = runGit("rev-parse", "HEAD"), root = (name: string) => labRoot("fixture", name)
      const allocation = createLeanPrivateProbeScheduleV1({ sourceHead, sourceRoot: root("source"), executableRoot: root("executable"), costSnapshotRoot: authority.LEAN_PRIVATE_PROBE_COST_ROOT })
      const allocationPath = ".planning/artifacts/v1.38-phase-265-private-probe-allocation-v1.json"
      mkdirSync(join(repository, ".planning/artifacts"), { recursive: true }); writeFileSync(join(repository, allocationPath), leanCanonicalBytes(allocation))
      runGit("add", allocationPath); runGit("-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit", "-qm", "allocation")
      const allocationCommit = runGit("rev-parse", "HEAD"), store = join(repository, "store")
      mkdirSync(store, { mode: 0o700 }); chmodSync(store, 0o700)
      writeFileSync(join(store, "allocation.json"), leanCanonicalBytes(allocation), { mode: 0o600 }); writeFileSync(join(store, "request.json"), "{}", { mode: 0o600 })
      gitFixture.repository = repository
      try {
        const admission = authority.openLeanPrivateProbeAdmissionV1({ storePath: store, allocationCommit, allocationPath, capacity: authority.observeLeanPrivateProbeCapacityV1(store) })
        writeFileSync(join(store, "entry.json"), "{}", { mode: 0o600 })
        const issued = authority.recordAndIssueLeanPrivateProbeRuntimeAuthorityV1(admission, allocation.cases[0]!, authority.observeLeanPrivateProbeCapacityV1(store))
        expect(() => authority.claimLeanPrivateProbeRuntimeAuthority(issued, issued.binding, "session")).toThrow()
        expect(authority.claimLeanPrivateProbeRuntimeAuthority(issued, issued.binding, "factory")).toBe(issued.binding)
        expect(authority.claimLeanPrivateProbeRuntimeAuthority(issued, issued.binding, "planner")).toBe(issued.binding)
        expect(authority.claimLeanPrivateProbeRuntimeAuthority(issued, issued.binding, "session")).toBe(issued.binding)
        expect(() => authority.claimLeanPrivateProbeRuntimeAuthority(issued, issued.binding, "session")).toThrow()
        writeFileSync(join(store, "probe-00.json"), "{}", { mode: 0o600 })
        const ledger = join(store, "ledger.ndjson"), original = readFileSync(ledger), row = JSON.parse(original.toString("utf8")) as Record<string, unknown>
        row[key] = "changed"
        writeFileSync(ledger, key === "delimiter" ? original.subarray(0, -1) : Buffer.concat([leanCanonicalBytes(row), Buffer.from("\n")]))
        expect(() => authority.recordAndIssueLeanPrivateProbeRuntimeAuthorityV1(admission, allocation.cases[1]!, authority.observeLeanPrivateProbeCapacityV1(store))).toThrow()
        writeFileSync(ledger, original)
        expect(() => authority.recordAndIssueLeanPrivateProbeRuntimeAuthorityV1(admission, allocation.cases[1]!, authority.observeLeanPrivateProbeCapacityV1(store))).toThrow()
      } finally { gitFixture.repository = "" }
    } finally { rmSync(repository, { recursive: true, force: true }) }
  })
})
