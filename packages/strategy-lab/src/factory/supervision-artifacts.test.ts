import { createHash } from "node:crypto"
import { mkdtempSync, realpathSync, readdirSync, statSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { admitCanonicalJsonBytes, admitCanonicalJsonValue } from "@cowards/spec"
import { afterEach, describe, expect, it } from "vitest"
import { labRoot, type LabRoot } from "../contracts.js"
import { admitFactory, authorizeFactorySupervision, isIssuedFactorySupervisionReceipt, superviseFactory, type FactoryAdmission, type FactorySupervisionProvider } from "./admission.js"
import { factoryOraclePacketFixture, factoryProposalFromPacket, factoryValidationFixture } from "./contracts.js"
import { deriveFactoryOraclePacketRoot } from "./identity.js"
import { createFactoryRepository, publishFactoryArtifact, readFactoryArtifact } from "./repository.js"
import { publishFactorySupervisionArtifacts, readFactorySupervisionArtifactRecords } from "./supervision-artifacts.js"

const directories: string[] = []
const root = (letter: string): LabRoot => `sha256:${letter.repeat(64)}` as LabRoot
const source = new TextEncoder().encode("fixture source: not executed")
const sourceRoot = `sha256:${createHash("sha256").update(source).digest("hex")}` as LabRoot
const setup = () => {
  const directory = realpathSync(mkdtempSync(join(tmpdir(), "factory-supervision-storage-")))
  directories.push(directory)
  const repository = createFactoryRepository(directory)
  const base = factoryOraclePacketFixture()
  const draft = { ...base, source: { ...base.source, root: sourceRoot, sha256: sourceRoot, byteLength: source.byteLength } }
  const packet = { ...draft, root: deriveFactoryOraclePacketRoot(draft) }
  const proposal = factoryProposalFromPacket(packet)
  const admission = authorizeFactorySupervision({ sourceAdmission: admitFactory({ packet, proposal, sourceBytes: source, repository }), validation: factoryValidationFixture(proposal), repository })
  return { repository, admission }
}
afterEach(() => { for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true }) })

// Injected mechanism evidence only. No candidate source, guest, or Match runs.
const issuedFixture = async (admission: FactoryAdmission, transitions: readonly unknown[], failure = false, completeMetadata = false) => {
  const identity = {
    revisionId: "mechanics-candidate", sourceRoot, executableRoot: sourceRoot, tupleId: "tuple", tupleRoot: root("1"),
    image: "fixture-image", harnessRoot: root("2"), budgetRoot: root("3"), attemptRoot: root("4"), runtimeLimitsRoot: admission.nativeLane.runtimeProfileRoot,
    nativeLane: admission.nativeLane, factoryPacketRoot: admission.packetRoot, factoryProposalRoot: admission.proposalRoot, factoryValidationRoot: admission.validationRoot,
  }
  const provider: FactorySupervisionProvider = {
    identity,
    invoke(request) { return { identity, requestId: request.requestId, method: request.kind, inputRoot: labRoot("runtime-input", request.input), ordinal: 0, invocationRoot: root("5"), charged: true, completed: true, outputBytes: 2, result: { ok: true, value: { activationOrders: [], strategyMemory: { private: "retained-only-in-private-artifacts" } } } } },
    verify() { return true }, close() { return { cleanupComplete: true, orphanedChild: false } },
  }
  const match = { bottomPlayerId: "candidate", topPlayerId: "opponent", ...(completeMetadata ? { matchId: "mechanics-only", seed: "fixture-seed", arenaVariant: "empty", bottomStrategyRevisionId: "mechanics-candidate", topStrategyRevisionId: "mechanics-opponent", initialInitiativePlayerId: "candidate" } : {}) }
  const opponents = completeMetadata ? { opponent: { ...provider, identity: { ...identity, revisionId: "mechanics-opponent", sourceRoot: root("e") } } } : {}
  return superviseFactory(admission, "candidate", { match, providers: { candidate: provider, ...opponents } } as never, async ({ providers }) => {
    const input = { phaseNumber: 1, roundNumber: 1, board: { bounds: {}, soldiers: [], terrainStones: [] }, mySoldiers: [], enemySoldiers: [], activationCount: 1, initialInitiativePlayerId: "candidate", hasInitialInitiative: true, roundInitiativePlayerId: "candidate", hasRoundInitiative: true }
    const evidence = await providers.candidate!.invoke({ kind: "selectActivations", requestId: "fixture:1", semanticTupleId: "tuple", coordinates: {}, input } as never, identity)
    return (failure ? { kind: "failure", privacy: "private_offline", transitions, accounting: [evidence], unchangedState: { fixture: true }, failure: { classification: "system_failure", code: "CLEANUP_INCOMPLETE" } } : { kind: "completed", privacy: "private_offline", transitions, accounting: [evidence], result: { state: { fixture: true }, events: [{ sequence: 1, fixture: true }] } }) as never
  })
}
const limits = { maxBytes: 32 * 1024 * 1024, maxRecords: 10000 }

describe("bounded private supervision persistence", () => {
  it("rebinds complete matchup metadata through the same receipt identity recipe", async () => {
    const { repository, admission } = setup()
    const receipt = await issuedFixture(admission, [], false, true)
    expect(receipt.matchup).toMatchObject({ status: "verified", side: "bottom", initialInitiative: true })
    const stored = publishFactorySupervisionArtifacts(repository, receipt)
    const reopened = readFactorySupervisionArtifactRecords(repository, stored.artifactRoot, limits)
    expect(reopened.records.find(record => record.kind === "receipt")?.value).toMatchObject({ matchup: receipt.matchup })
    expect(reopened.issued).toBe(false)
  })
  it("round-trips full issued mechanics evidence without minting renewed authority", async () => {
    const { repository, admission } = setup()
    const receipt = await issuedFixture(admission, [{ sequence: 0, fixture: true }])
    const stored = publishFactorySupervisionArtifacts(repository, receipt)
    const reopened = readFactorySupervisionArtifactRecords(repository, stored.artifactRoot, limits)
    expect(reopened.descriptor.receiptRoot).toBe(receipt.root)
    expect(reopened.records.find(record => record.kind === "transition")?.value).toEqual(receipt.execution.transitions[0])
    expect(reopened.records.find(record => record.kind === "accounting")?.value).toEqual(receipt.execution.accounting[0])
    expect(reopened.records.find(record => record.kind === "trace")?.value).toEqual(receipt.traces[0])
    expect(reopened.issued).toBe(false)
    expect(isIssuedFactorySupervisionReceipt(reopened as never)).toBe(false)
    expect(JSON.stringify(stored)).not.toContain("retained-only-in-private-artifacts")
    expect(() => publishFactorySupervisionArtifacts(repository, { ...receipt })).toThrow("UNISSUED_RECEIPT")
    expect(publishFactorySupervisionArtifacts(repository, receipt)).toEqual(stored)
  })

  it("retains aggregate evidence above 8 MiB and individual records above the artifact cap", async () => {
    const { repository, admission } = setup()
    const transitions = Array.from({ length: 1500 }, (_, sequence) => ({ sequence, payload: "private-fixture".repeat(450) }))
    transitions.push({ sequence: 1500, payload: "large-fixture".repeat(40000) })
    const receipt = await issuedFixture(admission, transitions)
    const stored = publishFactorySupervisionArtifacts(repository, receipt)
    expect(stored.byteLength).toBeGreaterThan(8 * 1024 * 1024)
    expect(stored.chunkCount).toBeGreaterThan(32)
    const reopened = readFactorySupervisionArtifactRecords(repository, stored.artifactRoot, limits)
    expect(reopened.records.filter(record => record.kind === "transition").map(record => record.value)).toEqual(transitions)
    expect(readdirSync(repository.directory).every(name => statSync(join(repository.directory, name)).size <= 262144)).toBe(true)
    expect(() => readFactorySupervisionArtifactRecords(repository, stored.artifactRoot, { ...limits, maxBytes: stored.byteLength - 1 })).toThrow("DESCRIPTOR_LIMITS")
  }, 20000) // Disk/canonicalization regression only; no guest/runtime limit changes.

  it("retains system failure state and rejects descriptor claims that disagree with the stored records", async () => {
    const { repository, admission } = setup()
    const receipt = await issuedFixture(admission, [], true)
    const stored = publishFactorySupervisionArtifacts(repository, receipt)
    const reopened = readFactorySupervisionArtifactRecords(repository, stored.artifactRoot, limits)
    expect(reopened.records.find(record => record.kind === "unchanged-state")?.value).toEqual({ fixture: true })
    const { artifactRoot: _artifactRoot, root: _root, ...draft } = stored
    const changed = { ...draft, executionRoot: root("f") }
    const encoded = admitCanonicalJsonValue({ ...changed, root: labRoot("factory-supervision-artifacts-v1", changed) }, { profile: "canonical-manifest" })
    if (!encoded.ok) throw new Error("fixture encoding")
    const forged = publishFactoryArtifact(repository, encoded.canonicalBytes)
    expect(() => readFactorySupervisionArtifactRecords(repository, forged, limits)).toThrow("CONTENT_BINDING")
  })

  it("refuses a truncated or corrupted chunk before presenting archived evidence", async () => {
    const { repository, admission } = setup()
    const stored = publishFactorySupervisionArtifacts(repository, await issuedFixture(admission, []))
    const parsed = admitCanonicalJsonBytes(readFactoryArtifact(repository, stored.tailRoot), { profile: "canonical-manifest", operation: "require-canonical" })
    if (!parsed.ok) throw new Error("fixture chunk")
    const chunk = parsed.value as { bytesRoot: string }
    writeFileSync(join(repository.directory, `factory-artifact-${chunk.bytesRoot.slice(7)}.bin`), "corrupted fixture")
    expect(() => readFactorySupervisionArtifactRecords(repository, stored.artifactRoot, limits)).toThrow("ARTIFACT_DIGEST")
  })
})
