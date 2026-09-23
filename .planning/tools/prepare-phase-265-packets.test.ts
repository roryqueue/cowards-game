import { createHash } from "node:crypto"
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, realpathSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { admitCanonicalJsonValue, CANONICAL_ARENA_CATALOG_V1_37 } from "@cowards/spec"
import { createFactoryRepository, publishFactoryArtifact, readFactoryArtifact } from "../../packages/strategy-lab/src/factory/repository.js"
import { labRoot } from "../../packages/strategy-lab/src/contracts.js"
import { LEAGUE_APPROVED_PROSPECTIVE_POLICY } from "../../packages/strategy-lab/src/league/allocation.js"
import { preparePhase265Packets, writePhase265PacketSummaryExclusive } from "./prepare-phase-265-packets.js"

const makeDir = () => { const parent = mkdtempSync(join(tmpdir(), "phase265-packets-")), path = join(parent, "factory-output"); mkdirSync(path); return { parent, path: realpathSync(path) } }
const put = (value: unknown) => { const admitted = admitCanonicalJsonValue(value, { profile: "canonical-manifest" }); if (!admitted.ok) throw new Error("test canonicalization failed"); return admitted.canonicalBytes }
const root = (digit: string) => `sha256:${digit.repeat(64)}`
const schedule = LEAGUE_APPROVED_PROSPECTIVE_POLICY.schedule.flat()
const catalogArena = CANONICAL_ARENA_CATALOG_V1_37.arenas.find((arena) => arena.status === "active" && arena.schedulable)!
const arenaVariant = { id: catalogArena.id, name: catalogArena.name, initialBounds: catalogArena.initialBounds, terrainStones: catalogArena.terrainStones }
const validJob = (id: string, dependency: string, index: number) => {
  const role = schedule[index]!
  const split = index < 9 ? "development" : index === 9 ? "validation" : "probe"
  const request = { split, doctrineFamily: `doctrine-${index}`, build: { buildRoot: root("a"), toolchainRoot: root("b") }, lineage: { predecessorRoot: root("c"), correctionRoot: null, retryParentRoot: null } }
  const provider = { providerId: "local", modelId: "deterministic-search", modelVersion: "1", settingsRoot: root("d"), promptRoot: root("e"), contextRoot: root("f") }
  const sourceMessage = `Current rules, distinct job ${index}.`
  const producerInput = role === "tactical" ? { ...request, provider } : role === "teacher" ? {
    request: { ...request, provider },
    searches: [{ canonicalMatch: { matchId: `test-${index}`, seed: `seed-${index}`, arenaVariant, bottomPlayerId: "bottom", topPlayerId: "top", bottomStrategyRevisionId: "bottom-revision", topStrategyRevisionId: "top-revision", initialInitiativePlayerId: "bottom" }, studentPlayerId: "bottom", counterfactual: { opponentHypothesis: "cautious" }, maxDepth: 2, maxNodes: 50 }],
  } : {
    request,
    authoring: { sourceMessage, codexExecutable: "/test/codex", clientVersion: "0.154.0", stateDirectory: `/test/state-${index}`, disclosedDirectory: `/test/disclosed-${index}`, existingAuthFile: "/test/auth", requestedModel: "gpt-5.6-sol", requestedProvider: "openai", path: `test-${index}`, settingsRoot: root("d"), promptRoot: `sha256:${createHash("sha256").update(sourceMessage).digest("hex")}`, contextRoot: labRoot("league-disclosed-context-v1", { dependencyArtifactRoots: [dependency] }) },
  }
  return ({
  id,
  producerRequest: { producerIdentity: { tactical: "emitTacticalFactoryPacket", teacher: "emitTeacherFactoryPacket", model: "emitModelFactoryPacket" }[role], origin: `${role}-oracle`, evidenceClass: "real_producer", producerInput },
  participantId: `${id}-author`, reviewerId: `${id}-reviewer`,
  disclosure: { sourceAndBuildDisclosed: true, dependencyArtifactRoots: [dependency] },
  provenance: { priorExposure: `Operator-declared prior exposure for ${id}.`, conflicts: "none", deterministicDataOnly: true },
  review: { disposition: "accepted", reviewMilliseconds: 850000 },
  })
}
const inputFor = (repositoryDirectory: string, jobs: readonly unknown[]) => ({ schemaVersion: "phase265-response-packets-v1", repositoryDirectory, jobs })

describe("Phase 265 packet compiler", () => {
  it("publishes exactly four canonical rooted artifacts for each supplied job", () => {
    const { parent, path } = makeDir()
    try {
      const repository = createFactoryRepository(path), dependency = publishFactoryArtifact(repository, put({ fixture: "operator-retained-input" }))
      const input = inputFor(path, Array.from({ length: 11 }, (_, index) => validJob(`job-${index}`, dependency, index)))
      const result = preparePhase265Packets(input, repository)
      expect(result.jobs).toHaveLength(11)
      for (const entry of result.jobs as Array<Record<string, string>>) {
        const roots = [entry.producerRequestArtifactRoot, entry.disclosureArtifactRoot, entry.provenanceArtifactRoot, entry.reviewArtifactRoot]
        expect(roots.every((root) => readFactoryArtifact(repository, root as never).byteLength > 0)).toBe(true)
        const request = JSON.parse(new TextDecoder().decode(readFactoryArtifact(repository, entry.producerRequestArtifactRoot as never)))
        const disclosure = JSON.parse(new TextDecoder().decode(readFactoryArtifact(repository, entry.disclosureArtifactRoot as never)))
        const provenance = JSON.parse(new TextDecoder().decode(readFactoryArtifact(repository, entry.provenanceArtifactRoot as never)))
        const review = JSON.parse(new TextDecoder().decode(readFactoryArtifact(repository, entry.reviewArtifactRoot as never)))
        expect(Object.keys(request).sort()).toEqual(["evidenceClass", "origin", "producerIdentity", "producerInput"].sort())
        expect(Object.keys(disclosure).sort()).toEqual(["participantId", "requestArtifactRoot", "sourceAndBuildDisclosed", "dependencyArtifactRoots"].sort())
        expect(Object.keys(provenance).sort()).toEqual(["participantId", "priorExposure", "conflicts", "origin", "deterministicDataOnly"].sort())
        expect(Object.keys(review).sort()).toEqual(["reviewerId", "participantId", "disclosureArtifactRoot", "provenanceArtifactRoot", "disposition", "reviewMilliseconds"].sort())
        expect(disclosure.requestArtifactRoot).toBe(entry.producerRequestArtifactRoot)
        expect(disclosure.dependencyArtifactRoots).toEqual([dependency])
        expect(provenance).toMatchObject({ participantId: entry.participantId, conflicts: "none", deterministicDataOnly: true })
        expect(review).toMatchObject({ disposition: "accepted", reviewMilliseconds: 850000, disclosureArtifactRoot: entry.disclosureArtifactRoot, provenanceArtifactRoot: entry.provenanceArtifactRoot })
      }
      expect(readdirSync(path).filter((name) => name.startsWith("factory-artifact-")).length).toBe(45)
    } finally { rmSync(parent, { recursive: true, force: true }) }
  })

  it("rejects identity conflicts, nonaccepted review, missing dependencies, and repository mismatch before publication", () => {
    const { parent, path } = makeDir()
    try {
      const repository = createFactoryRepository(path), absent = `sha256:${"0".repeat(64)}`
      const good = Array.from({ length: 11 }, (_, index) => validJob(`job-${index}`, absent, index))
      for (const changed of [
        good.map((job, index) => index === 0 ? { ...job, reviewerId: job.participantId } : job),
        good.map((job, index) => index === 0 ? { ...job, reviewerId: good[1]!.participantId } : job),
        good.map((job, index) => index === 0 ? { ...job, disclosure: { ...job.disclosure, dependencyArtifactRoots: [] } } : job),
        good.map((job, index) => index === 0 ? { ...job, review: { ...job.review, disposition: "pending" } } : job),
        good.map((job, index) => index === 0 ? { ...job, producerRequest: { ...job.producerRequest, producerIdentity: "emitTeacherFactoryPacket" } } : job),
        good.map((job, index) => index === 0 ? { ...job, producerRequest: { ...job.producerRequest, producerInput: {} } } : job),
        good.map((job, index) => index === 1 ? { ...job, producerRequest: { ...job.producerRequest, producerInput: { ...job.producerRequest.producerInput, searches: [{ ...((job.producerRequest.producerInput as { searches: object[] }).searches[0]!), studentPlayerId: "spectator" }] } } } : job),
      ]) expect(() => preparePhase265Packets(inputFor(path, changed), repository)).toThrow()
      const other = join(parent, "factory-other"); mkdirSync(other)
      expect(() => preparePhase265Packets(inputFor(other, good), repository)).toThrow("REPOSITORY_MISMATCH")
      expect(readdirSync(path).filter((name) => name.startsWith("factory-artifact-")).length).toBe(0)
    } finally { rmSync(parent, { recursive: true, force: true }) }
  })

  it("atomically creates a canonical summary without replacing an existing path", () => {
    const { parent } = makeDir(), output = join(parent, "packet-roots.json"), summary = { jobs: [{ id: "job-0", producerRequestArtifactRoot: `sha256:${"a".repeat(64)}` }] }
    try {
      writePhase265PacketSummaryExclusive(output, summary)
      const bytes = readFileSync(output)
      expect(admitCanonicalJsonValue(JSON.parse(bytes.toString("utf8")), { profile: "canonical-manifest" })).toMatchObject({ ok: true })
      expect(() => writePhase265PacketSummaryExclusive(output, { jobs: [] })).toThrow()
      expect(readFileSync(output)).toEqual(bytes)
    } finally { rmSync(parent, { recursive: true, force: true }) }
  })
})
