import { afterEach, describe, expect, it } from "vitest"
import { createHash } from "node:crypto"
import { mkdtempSync, realpathSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { labRoot } from "../contracts.js"
import { factoryOraclePacketFixture } from "./contracts.js"
import { deriveFactoryOraclePacketRoot } from "./identity.js"
import { createFactoryRepository, resumeFactoryAttemptInventory } from "./repository.js"
import { admitQuarantinedIntakePacket, deriveIntakeProvenanceRoot, type IntakeProvenance, type QuarantinedIntakePacket } from "./intake.js"
import { admitFrozenIntakeProtocol, deriveFrozenIntakeProtocolRoot, deriveIntakeAuthorizationRoot, type FrozenIntakeProtocol } from "./intake-protocol.js"

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
const source = new TextEncoder().encode("export default {}")
const sourceRoot = `sha256:${createHash("sha256").update(source).digest("hex")}` as `sha256:${string}`
const packet = (suffix = ""): ReturnType<typeof factoryOraclePacketFixture> => {
  const fixture = factoryOraclePacketFixture()
  const value = { ...fixture, source: { ...fixture.source, root: sourceRoot, sha256: sourceRoot, byteLength: source.byteLength }, doctrineFamily: suffix ? `fixture-doctrine-${suffix}` : fixture.doctrineFamily }
  return { ...value, root: deriveFactoryOraclePacketRoot(value) }
}
const provenance = (p: FrozenIntakeProtocol, packetValue: ReturnType<typeof packet>, reviewerId = "reviewer-one"): IntakeProvenance => {
  const value = {
    schemaVersion: "intake-provenance-v1" as const, root: root("0"), participantId: p.participantId, reviewerId,
    packetRoot: packetValue.root, sourceRoot: packetValue.source.root, builderRoot: root("c"), toolchainRoot: root("d"), dependencyRoot: root("e"), runtimeRoot: root("f"),
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
  reviewerId: "reviewer-one", elapsedMinutes: 1, conflictFree: true, ...overrides,
})
afterEach(() => { for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true }) })

describe("quarantined intake", () => {
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
    const retry = admitQuarantinedIntakePacket({ ...input(p, packet("retry")), retryParentRoot: invalid.attemptRoot }, repo)
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
    const exhaustedAcceptance = admitQuarantinedIntakePacket(input(p, packet("acceptance"), { reviewerId: "reviewer-two" }), repo)
    expect(first.disposition).toBe("accepted")
    expect(reusedReviewer.disposition).toBe("rejected")
    expect(exhaustedAcceptance.disposition).toBe("rejected")
  })

  it("rejects caller ordinals/unknown fields, NaN or negative elapsed values, and retains the charge", () => {
    const repo = repository(), p = protocol()
    const unknown = admitQuarantinedIntakePacket({ ...input(p), submissionOrdinal: 0 } as never, repo)
    const nan = admitQuarantinedIntakePacket({ ...input(p, packet("nan")), elapsedMinutes: Number.NaN }, repo)
    const negative = admitQuarantinedIntakePacket({ ...input(p, packet("negative")), elapsedMinutes: -1 }, repo)
    expect(unknown.disposition).toBe("invalid")
    expect(nan.disposition).toBe("invalid")
    expect(negative.disposition).toBe("invalid")
    expect(resumeFactoryAttemptInventory(repo).completedAttemptRoots).toHaveLength(3)
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
