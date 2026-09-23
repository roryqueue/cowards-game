import { createHash } from "node:crypto"
import { mkdtempSync, mkdirSync, realpathSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { admitCanonicalJsonValue, CANONICAL_ARENA_CATALOG_V1_37 } from "@cowards/spec"
import { LAB_ADMITTED_ROOTS, labRoot, type LabRoot } from "../../packages/strategy-lab/src/contracts.js"
import { LEAGUE_APPROVED_PROSPECTIVE_POLICY } from "../../packages/strategy-lab/src/league/allocation.js"
import { createFactoryRepository, publishFactoryArtifact } from "../../packages/strategy-lab/src/factory/repository.js"
import { preparePhase265Packets } from "./prepare-phase-265-packets.js"
import { buildPhase265Allocation, verifyPhase265HistoricalBasesWithReaderForTest, type Phase265VerifiedBaseManifest } from "./prepare-phase-265-allocation.js"

const dirs: string[] = []
afterEach(() => { for (const path of dirs.splice(0)) rmSync(path, { recursive: true, force: true }) })
const root = (value: string): LabRoot => labRoot("phase265-allocation-test", value)
const encode = (value: unknown) => { const result = admitCanonicalJsonValue(value, { profile: "canonical-manifest" }); if (!result.ok) throw new Error("test canonicalization failed"); return result.canonicalBytes }
const arena = CANONICAL_ARENA_CATALOG_V1_37.arenas.find((candidate) => candidate.status === "active" && candidate.schedulable)!
const arenaVariant = { id: arena.id, name: arena.name, initialBounds: arena.initialBounds, terrainStones: arena.terrainStones }
const setup = () => {
  const parent = mkdtempSync(join(tmpdir(), "phase265-allocation-test-")); dirs.push(parent)
  const responsePath = join(parent, "factory-response"), leaguePath = join(parent, "league-output")
  mkdirSync(responsePath); mkdirSync(leaguePath)
  const responseDirectory = realpathSync(responsePath), leagueDirectory = realpathSync(leaguePath), repository = createFactoryRepository(responseDirectory)
  const dependency = publishFactoryArtifact(repository, encode({ schemaVersion: "injected-disclosure-dependency-v1", value: "build manifest supplied by operator" }))
  const baseManifest: Phase265VerifiedBaseManifest = {
    schemaVersion: "phase265-verified-bases-v1",
    historicalAssessment: {
      artifactRoot: "sha256:25913b26fa81fa15177774fbdcf9c0d1ef244ad13910bc664bfde4ea8c2e43f8",
      assessmentRoot: "sha256:0446fef49598ef425c883774adb23159ade4b1e44f630463a72562777a9ecea1",
      thresholdArtifactRoot: "sha256:f6098c9e14ed868e162a9374557e518678996b619f3f8912fb8723113328fa72",
      producerImplementationRoot: "sha256:5baaeb677327a6102fd3dc719543686b14448122a91a4bca320cd0836cf5040b",
      assessmentImplementationRoot: "sha256:6a6094089e6714def26c427f60dfc0fae15e534cc685ad7a76dc883c4911b97c",
    },
    bases: (["S01", "S03", "S05"] as const).map((sourceSlot) => ({ sourceSlot, publicationArtifactRoot: root(`${sourceSlot}-publication`), candidateAdmissionRoot: root(`${sourceSlot}-admission`), sourceRoot: root(`${sourceSlot}-source`), supervisionArtifactRoot: root(`${sourceSlot}-supervision`) })),
  }
  const schedule = LEAGUE_APPROVED_PROSPECTIVE_POLICY.schedule.flat()
  const roles = schedule.map((producer, index) => ({ jobId: `job-${String(index).padStart(2, "0")}`, producer, authorAgentId: `agent-author-${index}`, reviewerAgentId: `agent-reviewer-${index}` }))
  const dependencies = [dependency]
  const request = (producer: typeof schedule[number], index: number) => {
    const core = {
      split: index < 9 ? "development" : index === 9 ? "validation" : "probe",
      doctrineFamily: `family-${index}`,
      build: { buildRoot: root(`build-${index}`), toolchainRoot: root(`toolchain-${index}`) },
      lineage: { predecessorRoot: root(`parent-${index}`), correctionRoot: null, retryParentRoot: null },
    }
    const provider = { providerId: "operator-registered-oracle", modelId: "deterministic-oracle", modelVersion: "1", settingsRoot: root(`settings-${index}`), promptRoot: root(`prompt-${index}`), contextRoot: root(`context-${index}`) }
    if (producer === "tactical") return { producerIdentity: "emitTacticalFactoryPacket", origin: "tactical-oracle", evidenceClass: "real_producer", producerInput: { ...core, provider: { providerId: "operator-registered-tactical", modelId: "deterministic-tactical", modelVersion: "1", settingsRoot: root(`settings-${index}`), promptRoot: root(`prompt-${index}`), contextRoot: root(`context-${index}`) } } }
    if (producer === "teacher") return { producerIdentity: "emitTeacherFactoryPacket", origin: "teacher-oracle", evidenceClass: "real_producer", producerInput: { searches: [{ canonicalMatch: { matchId: `match-${index}`, seed: `seed-${index}`, arenaVariant, bottomPlayerId: "bottom", topPlayerId: "top", bottomStrategyRevisionId: "bottom-r1", topStrategyRevisionId: "top-r1", initialInitiativePlayerId: "bottom" }, studentPlayerId: "bottom", counterfactual: { opponentHypothesis: "cautious" }, maxDepth: 1, maxNodes: 100 }], request: { ...core, provider } } }
    const sourceMessage = `Operator-supplied frozen authoring request ${index}`
    const stateDirectory = join(parent, `state-${index}`), disclosedDirectory = join(parent, `disclosed-${index}`), existingAuthFile = join(parent, `empty-auth-${index}`)
    writeFileSync(existingAuthFile, "test-only-empty-file", { flag: "wx" })
    const promptRoot = `sha256:${createHash("sha256").update(sourceMessage, "utf8").digest("hex")}`
    return { producerIdentity: "emitModelFactoryPacket", origin: "model-oracle", evidenceClass: "real_producer", producerInput: { authoring: { sourceMessage, codexExecutable: process.execPath, clientVersion: "test-identity", stateDirectory, disclosedDirectory, existingAuthFile, requestedModel: LEAGUE_APPROVED_PROSPECTIVE_POLICY.model, requestedProvider: "operator-selected-provider", path: "/usr/bin:/bin", settingsRoot: root(`model-settings-${index}`), promptRoot, contextRoot: labRoot("league-disclosed-context-v1", { dependencyArtifactRoots: dependencies }) }, request: core } }
  }
  const packetInput = {
    schemaVersion: "phase265-response-packets-v1", repositoryDirectory: responseDirectory,
    jobs: schedule.map((producer, index) => ({ id: `job-${String(index).padStart(2, "0")}`, producerRequest: request(producer, index), participantId: `job-${String(index).padStart(2, "0")}-author`, reviewerId: `job-${String(index).padStart(2, "0")}-reviewer`, disclosure: { sourceAndBuildDisclosed: true, dependencyArtifactRoots: dependencies }, provenance: { priorExposure: "Operator supplied prior-exposure declaration: none.", conflicts: "none", deterministicDataOnly: true }, review: { disposition: "accepted", reviewMilliseconds: 120000 } })),
  }
  const packetSummary = preparePhase265Packets(packetInput, repository)
  const input = { baseManifest, packetSummary, participantRoles: roles, leagueDirectory, responseFactoryDirectory: responseDirectory }
  return { parent, responseDirectory, leagueDirectory, repository, baseManifest, packetSummary, roles, input }
}

describe("Phase 265 allocation builder", () => {
  it("builds the exact empirical 3-base allocation and preflights every retained packet", () => {
    const value = setup()
    const allocation = buildPhase265Allocation(value.input, value.repository)
    expect(allocation.evidenceClass).toBe("empirical")
    expect(allocation.initialCandidatePublicationRoots).toEqual(value.baseManifest.bases.map((base) => base.publicationArtifactRoot).sort())
    expect(allocation.rounds.map((round) => round.jobs.length)).toEqual([3, 3, 3, 2])
    expect(allocation.rounds.flatMap((round) => round.jobs)).toHaveLength(11)
    expect(allocation.participantRoles).toEqual(value.roles)
    expect(allocation.amendment.policy).toEqual(LEAGUE_APPROVED_PROSPECTIVE_POLICY)
    expect(allocation.studyPolicyRoot).toBe(LAB_ADMITTED_ROOTS.studyPolicyRoot)
  })

  it("rejects missing or substituted packet roots, bases, and role identities", () => {
    const value = setup(), goodJobs = (value.packetSummary as { jobs: Array<Record<string, unknown>> }).jobs
    expect(() => buildPhase265Allocation({ ...value.input, packetSummary: { jobs: goodJobs.slice(0, 10) } }, value.repository)).toThrow()
    const substituted = goodJobs.map((job, index) => index === 0 ? { ...job, reviewArtifactRoot: root("absent-review") } : job)
    expect(() => buildPhase265Allocation({ ...value.input, packetSummary: { jobs: substituted } }, value.repository)).toThrow()
    const wrongBase = structuredClone(value.baseManifest) as unknown as { bases: Array<Record<string, unknown>> }; wrongBase.bases[1]!.sourceSlot = "S02"
    expect(() => buildPhase265Allocation({ ...value.input, baseManifest: wrongBase }, value.repository)).toThrow()
    const reusedRole = value.roles.map((role, index) => index === 1 ? { ...role, reviewerAgentId: value.roles[0]!.authorAgentId } : role)
    expect(() => buildPhase265Allocation({ ...value.input, participantRoles: reusedRole }, value.repository)).toThrow()
    const sharedReviewer = value.roles.map((role, index) => index === 1 ? { ...role, reviewerAgentId: value.roles[0]!.reviewerAgentId } : role)
    expect(() => buildPhase265Allocation({ ...value.input, participantRoles: sharedReviewer }, value.repository)).not.toThrow()
  })

  it("authenticates every supplied base against the data-only historical import evidence", () => {
    const value = setup()
    const reader = (_repository: unknown, selection: { initialCandidatePublicationRoots: readonly LabRoot[]; factoryAssessmentArtifactRoots: readonly LabRoot[]; operations: object }) => {
      expect(selection.initialCandidatePublicationRoots).toEqual(value.baseManifest.bases.map((base) => base.publicationArtifactRoot).sort())
      expect(selection.factoryAssessmentArtifactRoots).toEqual([value.baseManifest.historicalAssessment.artifactRoot])
      return value.baseManifest.bases.map((base) => ({
        publicationRoot: base.publicationArtifactRoot,
        admission: { root: base.candidateAdmissionRoot, candidate: { proposal: { source: { root: base.sourceRoot } } }, importEvidence: {
          sourcePhase: 264, publicationArtifactRoot: base.publicationArtifactRoot, supervisionArtifactRoot: base.supervisionArtifactRoot,
          assessmentArtifactRoot: value.baseManifest.historicalAssessment.artifactRoot, assessmentRoot: value.baseManifest.historicalAssessment.assessmentRoot,
          thresholdArtifactRoot: value.baseManifest.historicalAssessment.thresholdArtifactRoot, sourceSlot: base.sourceSlot, qualification: "base_distinct",
        } },
      })) as never
    }
    expect(() => verifyPhase265HistoricalBasesWithReaderForTest(value.baseManifest, value.repository, reader)).not.toThrow()
    const invalidReader = (_repository: unknown, _selection: unknown) => {
      return value.baseManifest.bases.map((base, index) => ({
        publicationRoot: base.publicationArtifactRoot,
        admission: { root: index === 0 ? root("wrong-admission") : base.candidateAdmissionRoot, candidate: { proposal: { source: { root: base.sourceRoot } } }, importEvidence: {
          sourcePhase: 264, publicationArtifactRoot: base.publicationArtifactRoot, supervisionArtifactRoot: base.supervisionArtifactRoot,
          assessmentArtifactRoot: value.baseManifest.historicalAssessment.artifactRoot, assessmentRoot: value.baseManifest.historicalAssessment.assessmentRoot,
          thresholdArtifactRoot: value.baseManifest.historicalAssessment.thresholdArtifactRoot, sourceSlot: base.sourceSlot, qualification: "base_distinct",
        } },
      })) as never
    }
    expect(() => verifyPhase265HistoricalBasesWithReaderForTest(value.baseManifest, value.repository, invalidReader)).toThrow("HISTORICAL_BASE_IDENTITY")
  })
})
