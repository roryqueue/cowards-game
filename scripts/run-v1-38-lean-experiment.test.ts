import { expect, it } from "vitest"
import { mkdtempSync, realpathSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { parseLeanCommand, leanSourceManifest } from "./run-v1-38-lean-experiment.js"
import { claimLeanRuntimeAuthority, issueLeanRuntimeAuthority } from "./lib/v1-38-lean-experiment-authority.js"
import { createLeanAllocation, createLeanLedger, chargeLeanSlot } from "../packages/strategy-lab/src/league/lean-experiment.js"
import { labRoot, LAB_ADMITTED_ROOTS } from "../packages/strategy-lab/src/contracts.js"
import { createLeanContainerMatchSession } from "./lib/v1-38-lean-container-match-session.js"
import { admitFactorySupervisorLifetime } from "./lib/v1-38-factory-supervised-runtime.js"
it("imports inertly and accepts only three explicit private modes", () => {
  expect(parseLeanCommand(["prepare-pilot", "--request", "x.json"])).toEqual({ mode: "prepare-pilot", request: "x.json" })
  expect(() => parseLeanCommand(["run-pilot", "--provider", "forged"])).toThrow()
  expect(() => parseLeanCommand(["production"])).toThrow()
  expect(() => parseLeanCommand(["run-pilot", "--request", "x", "--retry"])).toThrow()
})
it("denies caller-forged runtime authorities before native construction", () => {
  expect(() => claimLeanRuntimeAuthority({ schemaVersion: "lean-runtime-authority-v1" } as never, {} as never, "factory")).toThrow("AUTHORITY")
  expect(() => createLeanContainerMatchSession({ leanExperimentAuthority: {} } as never)).toThrow("BINDING")
  expect(admitFactorySupervisorLifetime({} as never)).toBe(120000)
})
it("requires durable charge and binds one ordered claim per factory/planner/session", () => {
  const p = realpathSync(mkdtempSync(join(tmpdir(), "lean-authority-"))), pin = labRoot("authority-test", 1)
  try {
    const a = createLeanAllocation({ sourceRoot: pin, reviewRoot: pin, candidateRoots: [pin, labRoot("authority-test", 2)], seed: "authority-test" }), l = createLeanLedger(join(p, "store"), a)
    const c = chargeLeanSlot(l, a.slots[0]!, { freeBytes: 20e9, availableMemoryBytes: 2e9 })
    const runtime = { revisionId: "test", sourceRoot: pin, executableRoot: pin, tupleId: "test", tupleRoot: LAB_ADMITTED_ROOTS.tupleRoot, runtimeLimitsRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot, image: LAB_ADMITTED_ROOTS.image, factoryAuthorizationRoot: pin, factoryPacketRoot: pin, factoryProposalRoot: pin, factoryValidationRoot: pin }
    const b = { budgetRoot: a.root, attemptRoot: c.root, matchId: `lean-${c.root.slice(7, 31)}`, seat: "bottom" as const, containerName: `lean-${c.root.slice(7, 25)}-bottom`, ownershipLabel: `lean-${a.root.slice(7, 25)}`, runtime }
    expect(() => issueLeanRuntimeAuthority(l, { ...c, root: pin }, pin, b)).toThrow("AUTHORITY")
    const h = issueLeanRuntimeAuthority(l, c, pin, b)
    expect(() => claimLeanRuntimeAuthority(h, b, "planner")).toThrow("AUTHORITY")
    expect(() => claimLeanRuntimeAuthority({ ...h }, b, "factory")).toThrow("AUTHORITY")
    expect(claimLeanRuntimeAuthority(h, b, "factory")).toEqual({ lifetimeMs: 600000, receiptMs: 5000 })
    expect(() => claimLeanRuntimeAuthority(h, b, "factory")).toThrow("AUTHORITY")
    expect(claimLeanRuntimeAuthority(h, b, "planner").lifetimeMs).toBe(600000)
    expect(claimLeanRuntimeAuthority(h, b, "session").receiptMs).toBe(5000)
    expect(() => JSON.stringify(h)).toThrow("AUTHORITY")
  } finally { rmSync(p, { recursive: true, force: true }) }
})
it("binds the entire reviewed implementation including additive native opt-ins", () => {
  const m = leanSourceManifest(); expect(m.entries.some(e => e.path.endsWith("lean-experiment.ts"))).toBe(true)
  expect(m.entries.some(e => e.path.endsWith("v1-38-lean-container-match-session.ts"))).toBe(true)
  expect(m.root).toMatch(/^sha256:/)
})
