import { expect, it } from "vitest"
import { mkdtempSync, realpathSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { parseLeanCommand, leanSourceManifest } from "./run-v1-38-lean-experiment.js"
import { claimLeanRuntimeAuthority, issueLeanRuntimeAuthority, deriveLeanCandidateRuntime } from "./lib/v1-38-lean-experiment-authority.js"
import { factoryCandidateFixture, factoryOraclePacketFixture, factoryProposalFromPacket, factoryValidationFixture } from "../packages/strategy-lab/src/factory/contracts.js"
import { deriveFactoryOraclePacketRoot } from "../packages/strategy-lab/src/factory/identity.js"
import { createFactoryRepository, publishFactoryArtifact } from "../packages/strategy-lab/src/factory/repository.js"
import { leanBytesRoot, leanCanonicalBytes } from "../packages/strategy-lab/src/league/lean-experiment.js"
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
const candidateFixture = (directory: string, name: string) => {
  const factoryRepository = createFactoryRepository(join(directory, name))
  const sourceBytes = new TextEncoder().encode(`// ${name}\nexport default { selectActivations(input) { return { activationOrders: [], strategyMemory: {} }; }, soldierBrain() { return { action: { type: 'TURN_TO_STONE' }, soldierMemory: {} }; } }`)
  const sourceRoot = leanBytesRoot(sourceBytes), base = factoryOraclePacketFixture()
  const draft = { ...base, source: { ...base.source, root: sourceRoot, sha256: sourceRoot, byteLength: sourceBytes.byteLength } }, packet = { ...draft, root: deriveFactoryOraclePacketRoot(draft) }
  const proposal = factoryProposalFromPacket(packet), validation = factoryValidationFixture(proposal), candidate = factoryCandidateFixture(proposal, validation, labRoot("receipt", name))
  const body = { schemaVersion: "factory-candidate-publication-v1", privacy: "private_offline", candidate, independenceReceipt: { root: labRoot("independence", name) }, supervisionReceiptRoot: candidate.supervisionReceiptRoot, independenceStatus: "unresolved" }
  return { candidate, factoryRepository, candidatePublicationArtifactRoot: publishFactoryArtifact(factoryRepository, leanCanonicalBytes({ ...body, root: labRoot("factory-candidate-publication-v1", body) })), sourceArtifactRoot: publishFactoryArtifact(factoryRepository, sourceBytes), packetArtifactRoot: publishFactoryArtifact(factoryRepository, leanCanonicalBytes(packet)), proposalArtifactRoot: publishFactoryArtifact(factoryRepository, leanCanonicalBytes(proposal)), validationArtifactRoot: publishFactoryArtifact(factoryRepository, leanCanonicalBytes(validation)) }
}
it("requires allocated source closure, rejects a different valid candidate and binds ordered claims", () => {
  const p = realpathSync(mkdtempSync(join(tmpdir(), "lean-authority-"))), pin = labRoot("authority-test", 1)
  try {
    const fixtures = [candidateFixture(p, "a"), candidateFixture(p, "b")].sort((a,b) => a.candidate.root.localeCompare(b.candidate.root)), allocated = fixtures[0]!, other = fixtures[1]!
    const a = createLeanAllocation({ sourceRoot: pin, reviewRoot: pin, candidateRoots: fixtures.map(f => f.candidate.root), seed: "authority-test" }), l = createLeanLedger(join(p, "store"), a)
    const c = chargeLeanSlot(l, a.slots[0]!, { freeBytes: 20e9, availableMemoryBytes: 2e9 })
    const runtime = deriveLeanCandidateRuntime(allocated).runtime
    const b = { budgetRoot: a.root, attemptRoot: c.root, matchId: `lean-${c.root.slice(7, 31)}`, seat: "bottom" as const, containerName: `lean-${c.root.slice(7, 25)}-bottom`, ownershipLabel: `lean-${a.root.slice(7, 25)}`, runtime }
    expect(() => issueLeanRuntimeAuthority(l, { ...c, root: pin }, allocated, b)).toThrow("AUTHORITY")
    expect(() => issueLeanRuntimeAuthority(l, c, allocated, { ...b, runtime: deriveLeanCandidateRuntime(other).runtime })).toThrow("AUTHORITY")
    expect(() => issueLeanRuntimeAuthority(l, c, other, { ...b, runtime: deriveLeanCandidateRuntime(other).runtime })).toThrow("AUTHORITY")
    const h = issueLeanRuntimeAuthority(l, c, allocated, b)
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
