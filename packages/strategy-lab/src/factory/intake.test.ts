import { afterEach, describe, expect, it } from "vitest"
import { createHash } from "node:crypto"
import { mkdtempSync, realpathSync, readdirSync, readFileSync, renameSync, rmSync, unlinkSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { labRoot } from "../contracts.js"
import { factoryOraclePacketFixture } from "./contracts.js"
import { deriveFactoryOraclePacketRoot } from "./identity.js"
import { createFactoryRepository, publishFactoryArtifact, publishFactoryAttemptTerminal, readFactoryArtifact, recordFactoryAttemptStart, resumeFactoryAttemptInventory } from "./repository.js"
import { createFactoryAttemptStart, createFactoryAttemptTerminal } from "./ledger.js"
import { admitQuarantinedIntakePacket, deriveIntakeProvenanceRoot, type IntakeProvenance, type QuarantinedIntakePacket } from "./intake.js"
import { admitFrozenIntakeProtocol, blockedIntakeConfiguration, deriveFrozenIntakeProtocolRoot, deriveIntakeAuthorizationRoot, type FrozenIntakeProtocol } from "./intake-protocol.js"

const root = (letter: string) => `sha256:${letter.repeat(64)}` as `sha256:${string}`
const dirs: string[] = []
const protocol = (overrides: Partial<FrozenIntakeProtocol> = {}): FrozenIntakeProtocol => {
  const draft = {
    schemaVersion: "frozen-intake-protocol-v1" as const, privacy: "private_offline" as const, root: root("0"), authorization: root("0"),
    participantId: "participant-alpha", reviewerIds: ["reviewer-one", "reviewer-two"], participantAuthorizationRoot: root("a"), reviewerAuthorizationRoot: root("b"),
    disclosure: "source-and-provenance" as const, submissionLimit: 8, timeLimitMinutes: 30, reviewerLimit: 8, reviewerReuseLimit: 3, conflictsDeclared: true as const,
    conflictPolicy: "reject-on-conflict" as const, confidentiality: "private_offline" as const, provenanceRequired: true as const, provenancePolicy: "complete-explicit-deterministic" as const,
    validationRequired: true as const, validationPolicy: "common-hostile-admission" as const, acceptanceBudget: 3, acceptancePolicy: "accept-only-reviewed-source" as const,
    dispositionPolicy: "retain-all-terminal-outcomes" as const, ...overrides,
  }
  const authorized = { ...draft, authorization: deriveIntakeAuthorizationRoot(draft) }
  return admitFrozenIntakeProtocol({ ...authorized, root: deriveFrozenIntakeProtocolRoot(authorized) })
}
const source = new TextEncoder().encode("export default { selectActivations() { return { activationOrders: [], strategyMemory: {} } }, soldierBrain() { return { action: { type: 'TURN_TO_STONE' }, soldierMemory: {} } } }")
const sourceRoot = `sha256:${createHash("sha256").update(source).digest("hex")}` as `sha256:${string}`
const packet = (suffix = "", sourceBytes = source): ReturnType<typeof factoryOraclePacketFixture> => {
  const fixture = factoryOraclePacketFixture()
  const sourceIdentity = `sha256:${createHash("sha256").update(sourceBytes).digest("hex")}` as `sha256:${string}`
  const value = { ...fixture, source: { ...fixture.source, root: sourceIdentity, sha256: sourceIdentity, byteLength: sourceBytes.byteLength }, doctrineFamily: suffix ? `fixture-doctrine-${suffix}` : fixture.doctrineFamily }
  return { ...value, root: deriveFactoryOraclePacketRoot(value) }
}
const provenance = (p: FrozenIntakeProtocol, packetValue: ReturnType<typeof packet>, reviewerId = "reviewer-one"): IntakeProvenance => {
  const value = {
    schemaVersion: "intake-provenance-v1" as const, root: root("0"), participantId: p.participantId, reviewerId,
    packetRoot: packetValue.root, sourceRoot: packetValue.source.root, builderRoot: packetValue.build.buildRoot, toolchainRoot: packetValue.build.toolchainRoot, dependencyRoot: root("e"), runtimeRoot: packetValue.nativeLane.runtimeProfileRoot,
    sourceKind: "explicit-deterministic" as const, execution: "data-only" as const, liveAgent: false as const, complete: true as const,
  }
  return { ...value, root: deriveIntakeProvenanceRoot(value) }
}
const repository = () => {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), "factory-intake-test-"))); dirs.push(dir)
  return createFactoryRepository(dir)
}
const input = (p = protocol(), packetValue = packet(), overrides: Partial<QuarantinedIntakePacket> = {}): QuarantinedIntakePacket => ({
  protocol: p, packet: packetValue, sourceBytes: new Uint8Array(source), provenance: provenance(p, packetValue), participantId: p.participantId,
  reviewerId: "reviewer-one", elapsedMinutes: 1, conflictFree: true, reviewDisposition: "accept", ...overrides,
})
afterEach(() => { for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true }) })

describe("quarantined intake", () => {
  it("does not invent authority for malformed protocol configuration", () => {
    const repo = repository()
    const result = admitQuarantinedIntakePacket({ protocol: {} } as never, repo)
    expect(result).toMatchObject({ disposition: "blocked_configuration", attemptRoot: null, authorized: false, allocation: "none" })
    if (result.disposition !== "blocked_configuration") throw new Error("expected blocked configuration")
    expect(Object.isFrozen(result)).toBe(true)
    expect(JSON.parse(new TextDecoder().decode(readFactoryArtifact(repo, result.artifactRoot)))).toEqual(blockedIntakeConfiguration("incomplete_protocol"))
    expect(readdirSync(repo.directory).every(name => name.startsWith("factory-artifact-"))).toBe(true)
    expect(resumeFactoryAttemptInventory(repo).completedAttemptRoots).toEqual([])
    const blocked = blockedIntakeConfiguration("incomplete_protocol")
    expect(blocked.authorized).toBe(false)
    expect(blocked.allocation).toBe("none")
  })

  it("forwards explicit deterministic source as data through common admission and retains a root", () => {
    const repo = repository(), result = admitQuarantinedIntakePacket(input(), repo)
    expect(result.disposition).toBe("accepted")
    expect(result.admission?.sourceRoot).toBe(sourceRoot)
    expect(resumeFactoryAttemptInventory(repo).completedAttemptRoots).toHaveLength(1)
  })

  it("charges and retains invalid, incomplete-provenance, conflict, weak, duplicate, and retry outcomes", () => {
    const repo = repository(), p = protocol(), first = input(p)
    const invalid = admitQuarantinedIntakePacket({ ...first, provenance: { ...first.provenance, complete: false } as unknown as IntakeProvenance }, repo)
    const conflict = admitQuarantinedIntakePacket({ ...input(p, packet("conflict")), conflictFree: false }, repo)
    const weak = admitQuarantinedIntakePacket({ ...input(p, packet("weak")), reviewDisposition: "legal_but_weak" }, repo)
    const duplicate = admitQuarantinedIntakePacket({ ...first }, repo)
    const retry = admitQuarantinedIntakePacket({ ...input(p), retryParentRoot: invalid.attemptRoot }, repo)
    expect(invalid.disposition).toBe("invalid")
    expect(conflict.disposition).toBe("rejected")
    expect(weak.disposition).toBe("legal_but_weak")
    expect(duplicate.disposition).toBe("duplicate")
    expect(retry.disposition).toBe("retried")
    expect(resumeFactoryAttemptInventory(repo).completedAttemptRoots).toHaveLength(5)
  })

  it("derives reviewer reuse, acceptance, and time budgets from retained records", () => {
    const repo = repository(), p = protocol({ reviewerReuseLimit: 1, acceptanceBudget: 1, timeLimitMinutes: 2 })
    const first = admitQuarantinedIntakePacket(input(p), repo)
    const reusedReviewer = admitQuarantinedIntakePacket(input(p, packet("reuse")), repo)
    const acceptancePacket = packet("acceptance")
    const exhaustedAcceptance = admitQuarantinedIntakePacket(input(p, acceptancePacket, { reviewerId: "reviewer-two", provenance: provenance(p, acceptancePacket, "reviewer-two") }), repo)
    expect(first.disposition).toBe("accepted")
    expect(reusedReviewer.disposition).toBe("rejected")
    expect(exhaustedAcceptance.disposition).toBe("rejected")
  })

  it("requires an explicit accepted review and binds reviewer/provenance and packet build/runtime roots", () => {
    const repo = repository(), p = protocol(), base = input(p, packet("review"))
    const { reviewDisposition: _reviewDisposition, ...withoutReview } = base
    const missingReview = admitQuarantinedIntakePacket(withoutReview, repo)
    const reviewerPacket = packet("reviewer"), reviewerBase = input(p, reviewerPacket)
    const mismatchedReviewerProvenance = { ...reviewerBase.provenance, reviewerId: "reviewer-two" as const }
    const mismatchedReviewer = admitQuarantinedIntakePacket({ ...reviewerBase, provenance: { ...mismatchedReviewerProvenance, root: deriveIntakeProvenanceRoot(mismatchedReviewerProvenance) } }, repo)
    expect(missingReview.disposition).toBe("rejected")
    expect(mismatchedReviewer.disposition).toBe("invalid")
    for (const field of ["builderRoot", "toolchainRoot", "runtimeRoot"] as const) {
      const candidate = input(p, packet(`cross-${field}`)), changed = { ...candidate.provenance, [field]: root("1") }
      const result = admitQuarantinedIntakePacket({ ...candidate, provenance: { ...changed, root: deriveIntakeProvenanceRoot(changed) } }, repo)
      expect(result.disposition, field).toBe("invalid")
    }
  })

  it("rejects prose or opaque source bytes through non-executing runtime-js validation", () => {
    const repo = repository(), p = protocol(), prose = new TextEncoder().encode("advice only"), prosePacket = packet("prose", prose)
    const result = admitQuarantinedIntakePacket(input(p, prosePacket, { sourceBytes: prose }), repo)
    expect(result.disposition).toBe("invalid")
    const unsupportedBase = input(p, packet("unsupported")), unsupportedValue = { ...unsupportedBase.packet, nativeLane: { ...unsupportedBase.packet.nativeLane, language: "python" as const } }
    const unsupportedPacket = { ...unsupportedValue, root: deriveFactoryOraclePacketRoot(unsupportedValue) }
    const unsupported = admitQuarantinedIntakePacket(input(p, unsupportedPacket, { provenance: provenance(p, unsupportedPacket) }), repo)
    expect(unsupported.disposition).toBe("invalid")
  })

  it("keeps retry lineage within the active protocol and fails closed on missing accounting artifacts", () => {
    const repo = repository(), p = protocol(), first = admitQuarantinedIntakePacket(input(p), repo), other = protocol({ participantId: "participant-beta" })
    const crossProtocolRetry = admitQuarantinedIntakePacket({ ...input(other), retryParentRoot: first.attemptRoot }, repo)
    expect(crossProtocolRetry.disposition).toBe("invalid")
    const artifacts = readdirSync(repo.directory).filter((name) => name.startsWith("factory-artifact-"))
    for (const artifact of artifacts) unlinkSync(join(repo.directory, artifact))
    expect(() => admitQuarantinedIntakePacket(input(p, packet("corrupt")), repo)).toThrow()
  })

  it("rejects renamed starts, orphan terminals and terminals whose root does not bind their start", () => {
    for (const mutation of ["renamed-start", "orphan-terminal", "mismatched-terminal"] as const) {
      const repo = repository()
      const first = admitQuarantinedIntakePacket(input(), repo)
      const names = readdirSync(repo.directory)
      const startName = names.find(name => name.endsWith(".started.json"))!
      const terminalName = names.find(name => name.endsWith(".terminal.json"))!
      if (mutation === "renamed-start") renameSync(join(repo.directory, startName), join(repo.directory, `factory-attempt-${"f".repeat(64)}.started.json`))
      if (mutation === "orphan-terminal") unlinkSync(join(repo.directory, startName))
      if (mutation === "mismatched-terminal") {
        // A separately valid terminal is placed under this start's filename.
        const otherRepo = repository()
        const other = admitQuarantinedIntakePacket(input(protocol(), packet("other")), otherRepo)
        expect(other.attemptRoot).not.toBe(first.attemptRoot)
        const otherName = readdirSync(otherRepo.directory).find(name => name.endsWith(".terminal.json"))!
        writeFileSync(join(repo.directory, terminalName), readFileSync(join(otherRepo.directory, otherName)))
      }
      expect(() => admitQuarantinedIntakePacket(input(protocol(), packet("after-corruption")), repo), mutation).toThrow()
    }
  })

  it("scopes elapsed usage to the active protocol", () => {
    const repo = repository(), firstProtocol = protocol({ timeLimitMinutes: 2, acceptanceBudget: 3 }), otherProtocol = protocol({ participantId: "participant-beta", timeLimitMinutes: 1 })
    expect(admitQuarantinedIntakePacket(input(firstProtocol, packet("p1"), { elapsedMinutes: 1 }), repo).disposition).toBe("accepted")
    expect(admitQuarantinedIntakePacket(input(otherProtocol, packet("p2"), { elapsedMinutes: 1 }), repo).disposition).toBe("accepted")
    expect(admitQuarantinedIntakePacket(input(firstProtocol, packet("p3"), { elapsedMinutes: 1, reviewerId: "reviewer-two", provenance: provenance(firstProtocol, packet("p3"), "reviewer-two") }), repo).disposition).toBe("accepted")
  })

  it("ignores complete automated calibration accounting but never same-protocol intake accounting", () => {
    const repo = repository(), p = protocol()
    const automatedAccounting = publishFactoryArtifact(repo, new TextEncoder().encode("automated-accounting"))
    const automated = createFactoryAttemptStart({ taskRoot: p.root, budgetRoot: root("1"), candidateRoot: root("2"), authoringMechanism: "automated-oracle", inputRoot: root("3"), resourceAccountingRoot: automatedAccounting, retryParentRoot: null })
    recordFactoryAttemptStart(repo, automated)
    const evidence = root("4")
    publishFactoryAttemptTerminal(repo, automated, createFactoryAttemptTerminal({ startRoot: automated.root, disposition: "unresolved", outputRoot: evidence, validationRoot: root("5"), duplicateEvidenceRoot: root("6"), finalEvidenceRoot: root("7") }))
    expect(admitQuarantinedIntakePacket(input(p, packet("mixed")), repo).disposition).toBe("accepted")
  })

  it("rejects caller ordinals/unknown fields, NaN or negative elapsed values, and retains the charge", () => {
    const repo = repository(), p = protocol()
    const unknown = admitQuarantinedIntakePacket({ ...input(p), submissionOrdinal: 0 } as never, repo)
    const nanRepo = repository(), nan = admitQuarantinedIntakePacket({ ...input(p, packet("nan")), elapsedMinutes: Number.NaN }, nanRepo)
    const negativeRepo = repository(), negative = admitQuarantinedIntakePacket({ ...input(p, packet("negative")), elapsedMinutes: -1 }, negativeRepo)
    expect(unknown.disposition).toBe("invalid")
    expect(nan.disposition).toBe("invalid")
    expect(negative.disposition).toBe("invalid")
    expect(resumeFactoryAttemptInventory(repo).completedAttemptRoots).toHaveLength(1)
    expect(() => admitQuarantinedIntakePacket(input(p, packet("after-nan")), nanRepo)).toThrow("INTAKE_ACCOUNTING_UNCERTAIN")
  })

  it("charges malformed retry metadata before rejecting it", () => {
    const repo = repository(), result = admitQuarantinedIntakePacket({ ...input(), retryParentRoot: "not-a-root" } as never, repo)
    expect(result.disposition).toBe("invalid")
    expect(resumeFactoryAttemptInventory(repo).completedAttemptRoots).toHaveLength(1)
  })

  it("does not overwrite a retained attempt or expose gameplay claims", () => {
    const repo = repository(), first = admitQuarantinedIntakePacket(input(), repo), again = admitQuarantinedIntakePacket(input(), repo)
    expect(again.attemptRoot).not.toBe(first.attemptRoot)
    expect(Object.keys(again).sort()).toEqual(["attemptRoot", "disposition"])
    expect((again as Record<string, unknown>).outcome).toBeUndefined()
  })
})
