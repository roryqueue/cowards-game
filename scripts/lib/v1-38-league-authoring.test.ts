import { createHash } from "node:crypto"
import { mkdtempSync, realpathSync, rmSync, writeFileSync, readdirSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { admitCanonicalJsonValue, admitCanonicalJsonBytes } from "@cowards/spec"
import { labRoot, type LabRoot } from "../../packages/strategy-lab/src/contracts.js"
import { allocationFixture } from "../../packages/strategy-lab/src/league/allocation.test.js"
import { createLeagueExecutionAllocation } from "../../packages/strategy-lab/src/league/allocation.js"
import { declareRedTeamAllocation, startRedTeamAttempt } from "../../packages/strategy-lab/src/league/red-team.js"
import { createFactoryRepository, publishFactoryArtifact, readFactoryArtifact } from "../../packages/strategy-lab/src/factory/repository.js"
import { executeLeagueAuthoring, preflightLeagueAuthoring } from "./v1-38-league-authoring.js"
import { FactoryAppServerTurnFailure } from "../v1-38-factory-app-server-transport.js"

const directories: string[] = []
afterEach(() => { for (const path of directories.splice(0)) rmSync(path, { recursive: true, force: true }) })
const root = (value: string) => labRoot("league-author-test", value)
const fixture = (model = false) => {
  const directory = realpathSync(mkdtempSync(join(tmpdir(), "factory-league-author-test-"))); directories.push(directory)
  const repository = createFactoryRepository(directory), put = (value: unknown) => { const result = admitCanonicalJsonValue(value, { profile: "canonical-manifest" }); if (!result.ok) throw new Error("test canonical"); return publishFactoryArtifact(repository, result.canonicalBytes) }
  const input = allocationFixture(), channel = model ? "model" as const : "automated" as const, reservation = { ...input.channels[0]!.perAttempt, modelTokens: model ? 30 : 0, effortMilliseconds: 1000 }, sourceMessage = "Return explicit TypeScript source only."
  const stateDirectory = join(directory, "new-state"), disclosedDirectory = join(directory, "new-disclosed"), existingAuthFile = join(directory, "fixture-auth.json")
  // No credentials; the injected transport only observes the path.
  writeFileSync(existingAuthFile, "{}", { flag: "wx" })
  const request = { producerIdentity: model ? "emitModelFactoryPacket" : "emitTacticalFactoryPacket", origin: model ? "model-oracle" : "tactical-oracle", evidenceClass: "real_producer", producerInput: model ? { authoring: { sourceMessage, codexExecutable: process.execPath, clientVersion: "injected-test", stateDirectory, disclosedDirectory, existingAuthFile, requestedModel: "fixture-model", requestedProvider: "fixture-provider", path: "/usr/bin:/bin", settingsRoot: root("settings"), promptRoot: `sha256:${createHash("sha256").update(sourceMessage).digest("hex")}`, contextRoot: labRoot("league-disclosed-context-v1", { dependencyArtifactRoots: [] }) }, request: {} } : {} }
  const producerRequestArtifactRoot = put(request), disclosureArtifactRoot = put({ participantId: "author", requestArtifactRoot: producerRequestArtifactRoot, sourceAndBuildDisclosed: true, dependencyArtifactRoots: [] }), provenanceArtifactRoot = put({ participantId: "author", priorExposure: "none", conflicts: "none", origin: request.origin, deterministicDataOnly: true }), reviewArtifactRoot = put({ reviewerId: "reviewer", participantId: "author", disclosureArtifactRoot, provenanceArtifactRoot, disposition: "accepted", reviewMilliseconds: 0 })
  const job = { id: "one", channel, operation: model ? "produce" as const : "unfilled" as const, producerRequestArtifactRoot, disclosureArtifactRoot, provenanceArtifactRoot, reviewArtifactRoot, participantId: "author", reviewerId: "reviewer", reservation, retryParentJobId: null }
  const allocation = createLeagueExecutionAllocation({ ...input, opportunities: { ...input.opportunities, attemptedCandidates: model ? 1 : 0, modelAttempts: model ? 1 : 0, modelTokens: reservation.modelTokens }, channels: input.channels.map((row) => row.channel === channel ? { ...row, disposition: "allocated", opportunities: 1, ceilings: reservation, perAttempt: reservation, participants: ["author"], reviewers: ["reviewer"] } : row), rounds: [{ ordinal: 0, acceptedSlots: 0, jobs: [job] }, input.rounds[1]!] })
  const ledger = declareRedTeamAllocation({ phase: 265, evidenceClass: allocation.evidenceClass, authorityRoot: allocation.root, channels: allocation.channels, probes: allocation.probes }), started = startRedTeamAttempt({ ledger, channel, roundRoot: root("round"), candidateRoot: root("target"), participantId: job.participantId, reviewerId: job.reviewerId, disclosureRoot: disclosureArtifactRoot, provenanceRoot: provenanceArtifactRoot, inputRoot: producerRequestArtifactRoot, retryParentRoot: null, reservation })
  return { repository, allocation, jobId: job.id, startArtifactRoot: put(started.starts[0]), stateDirectory, disclosedDirectory, put }
}
describe("prospective league authoring adapter", () => {
  it("retains a charged unfilled opportunity without creating a producer or model process", async () => {
    const input = fixture(), result = await executeLeagueAuthoring(input)
    expect(result).toMatchObject({ disposition: "unfilled", ingestionArtifactRoot: null, modelTokens: 0 })
    expect(readdirSync(input.repository.directory)).not.toContain("new-state")
    expect(preflightLeagueAuthoring(input).job.operation).toBe("unfilled")
  })
  it("retains native failed-turn bytes, observed usage and cleanup under the supplied Phase 265 charge", async () => {
    const input = fixture(true), raw = new TextEncoder().encode('{"jsonrpc":"2.0","method":"turn/failed"}\n')
    let calls = 0
    const result = await executeLeagueAuthoring({ ...input, clock: () => 100, transportFactory: async (options) => { calls++; expect(options.timeoutMs).toBe(1000); expect(options.requestedModel).toBe("fixture-model"); return { threadId: "fixture", reportedModel: "fixture-model", async startTurn() { throw new FactoryAppServerTurnFailure("fixture failure", { rawJsonl: raw, usage: { inputTokens: 2, cachedInputTokens: 0, outputTokens: 1, reasoningOutputTokens: 0, totalTokens: 3 }, reportedModel: "fixture-model", terminalStatus: "failed" }) }, async close() { return "sigterm" } } } })
    expect(calls).toBe(1)
    expect(result).toMatchObject({ disposition: "system_failure", modelTokens: 3, ingestionArtifactRoot: null })
    const retained = admitCanonicalJsonBytes(readFactoryArtifact(input.repository, result.evidenceArtifactRoot), { profile: "canonical-manifest", operation: "require-canonical" })
    expect(retained.ok && retained.value).toMatchObject({ cleanup: "sigterm", startRoot: result.startRoot, allocationRoot: input.allocation.root })
  })
  it("rejects foreign charge and incomplete participant policy before side effects", async () => {
    const input = fixture(true), names = readdirSync(input.repository.directory)
    await expect(executeLeagueAuthoring({ ...input, startArtifactRoot: input.put({ root: root("forged") }) })).rejects.toThrow()
    expect(readdirSync(input.repository.directory)).not.toContain("new-state")
    expect(() => preflightLeagueAuthoring({ ...input, allocation: { ...input.allocation, participantPolicy: {} } })).toThrow()
    expect(names).not.toContain("new-disclosed")
  })
})
