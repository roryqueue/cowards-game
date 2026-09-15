import { createHash } from "node:crypto"
import { mkdtempSync, realpathSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { admitCanonicalJsonValue } from "@cowards/spec"
import { afterEach, describe, expect, it } from "vitest"
import { LAB_ADMITTED_ROOTS, labRoot, type LabRoot } from "../contracts.js"
import { factoryCandidateFixture, factoryOraclePacketFixture, factoryProposalFromPacket, factoryValidationFixture } from "../factory/contracts.js"
import { deriveFactoryOraclePacketRoot } from "../factory/identity.js"
import { createFactoryRepository, publishFactoryArtifact } from "../factory/repository.js"
import type { FactorySupervisionProvider } from "../factory/admission.js"
import { createLeagueCell } from "./contracts.js"
import { issueLeagueProviderFromFactoryCandidate, runLeagueCell, type FactorySupervisedRuntimeHost } from "./connected-runner.js"
import { createLeagueRepository, type LeagueCellStart } from "./repository.js"

const directories: string[] = []
const root = (value: string): LabRoot => labRoot("connected-runner-test-v1", value)
const canonical = (value: unknown) => {
  const admitted = admitCanonicalJsonValue(value, { profile: "canonical-manifest" })
  if (!admitted.ok) throw new Error("fixture canonicalization")
  return admitted.canonicalBytes
}
const temporary = (prefix: string) => {
  const directory = realpathSync(mkdtempSync(join(tmpdir(), prefix)))
  directories.push(directory)
  return directory
}
afterEach(() => { for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true }) })

const fixture = (name: string) => {
  const factoryRepository = createFactoryRepository(temporary("factory-league-test-"))
  const sourceBytes = new TextEncoder().encode(`export default ${JSON.stringify(name)}`)
  const sourceRoot = `sha256:${createHash("sha256").update(sourceBytes).digest("hex")}` as LabRoot
  const base = factoryOraclePacketFixture()
  const draft = { ...base, source: { ...base.source, root: sourceRoot, sha256: sourceRoot, byteLength: sourceBytes.byteLength } }
  const packet = { ...draft, root: deriveFactoryOraclePacketRoot(draft) }
  const proposal = factoryProposalFromPacket(packet), validation = factoryValidationFixture(proposal)
  const candidate = factoryCandidateFixture(proposal, validation, root(`${name}:receipt`))
  const descriptorValue = { schemaVersion: "factory-candidate-publication-v1", privacy: "private_offline", candidate, independenceReceipt: { root: root(`${name}:independence`) }, supervisionReceiptRoot: candidate.supervisionReceiptRoot, independenceStatus: "unresolved" }
  const descriptor = { ...descriptorValue, root: labRoot("factory-candidate-publication-v1", descriptorValue) }
  return {
    factoryRepository, candidate,
    candidatePublicationArtifactRoot: publishFactoryArtifact(factoryRepository, canonical(descriptor)),
    sourceArtifactRoot: publishFactoryArtifact(factoryRepository, sourceBytes),
    packetArtifactRoot: publishFactoryArtifact(factoryRepository, canonical(packet)),
    proposalArtifactRoot: publishFactoryArtifact(factoryRepository, canonical(proposal)),
    validationArtifactRoot: publishFactoryArtifact(factoryRepository, canonical(validation)),
  }
}

const providerHost = (): FactorySupervisedRuntimeHost => ({
  createFactorySupervisedRuntime({ admission, attemptRoot, budgetRoot }) {
    const identity = {
      revisionId: `revision-${admission.sourceRoot.slice(7, 15)}`,
      sourceRoot: admission.sourceRoot,
      executableRoot: root(`executable:${admission.sourceRoot}`),
      tupleId: "candidate-kernel-v1.19",
      tupleRoot: LAB_ADMITTED_ROOTS.tupleRoot,
      image: LAB_ADMITTED_ROOTS.image,
      harnessRoot: root("harness"), budgetRoot, attemptRoot,
      runtimeLimitsRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot,
      nativeLane: admission.nativeLane,
      factoryPacketRoot: admission.packetRoot,
      factoryProposalRoot: admission.proposalRoot,
      factoryValidationRoot: admission.validationRoot,
    }
    return { identity, invoke() { throw new Error("safe injected runtime must not execute source") }, verify() { return false }, close() { return { cleanupComplete: true, orphanedChild: false } } } as FactorySupervisionProvider
  },
})

describe("host-issued connected league runner", () => {
  it("re-admits persisted candidate closures, marks host-issued providers privately, and terminalizes a full-kernel result", async () => {
    const bottom = fixture("bottom"), top = fixture("top"), leagueRepository = createLeagueRepository(temporary("league-runner-test-"))
    const cell = createLeagueCell({ populationRoot: root("population"), pairRoot: root("pair"), entrantCandidateRoot: bottom.candidate.root, opponentCandidateRoot: top.candidate.root, conditionRoot: root("condition"), semanticGeometryHash: root("arena"), tupleRoot: LAB_ADMITTED_ROOTS.tupleRoot, runtimeRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot, requestRoot: root("request") })
    const start: LeagueCellStart = { root: labRoot("league-cell-start-v1", { cellRoot: cell.root, allocationRoot: root("allocation") }), cellRoot: cell.root, allocationRoot: root("allocation") }
    const issue = (value: ReturnType<typeof fixture>) => issueLeagueProviderFromFactoryCandidate({ ...value, host: providerHost(), cell, start, allocationRoot: start.allocationRoot })
    const issuedBottom = issue(bottom), issuedTop = issue(top)
    const result = await runLeagueCell({ repository: leagueRepository, start, cell, bottom: issuedBottom, top: issuedTop, requestRoot: cell.requestRoot, match: { bottomPlayerId: "bottom", topPlayerId: "top", bottomStrategyRevisionId: issuedBottom.identity.revisionId, topStrategyRevisionId: issuedTop.identity.revisionId }, runCanonicalLabMatch: async () => ({ kind: "completed", privacy: "private_offline", transitions: [], accounting: [], result: { state: { fixture: true }, events: [{ type: "MATCH_ENDED", payload: { type: "DRAW" } }] } }) as never })
    expect(result).toMatchObject({ disposition: "success", processValidity: "process_valid", cellRoot: cell.root })
  })

  it("rejects a forged closure or caller-created provider, and preserves cleanup failure as charged non-payoff evidence", async () => {
    const bottom = fixture("bottom"), top = fixture("top"), leagueRepository = createLeagueRepository(temporary("league-runner-test-"))
    const cell = createLeagueCell({ populationRoot: root("population-2"), pairRoot: root("pair-2"), entrantCandidateRoot: bottom.candidate.root, opponentCandidateRoot: top.candidate.root, conditionRoot: root("condition-2"), semanticGeometryHash: root("arena-2"), tupleRoot: LAB_ADMITTED_ROOTS.tupleRoot, runtimeRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot, requestRoot: root("request-2") })
    const start: LeagueCellStart = { root: labRoot("league-cell-start-v1", { cellRoot: cell.root, allocationRoot: root("allocation-2") }), cellRoot: cell.root, allocationRoot: root("allocation-2") }
    expect(() => issueLeagueProviderFromFactoryCandidate({ ...bottom, packetArtifactRoot: bottom.proposalArtifactRoot, host: providerHost(), cell, start, allocationRoot: start.allocationRoot })).toThrow()
    const issue = (value: ReturnType<typeof fixture>) => issueLeagueProviderFromFactoryCandidate({ ...value, host: providerHost(), cell, start, allocationRoot: start.allocationRoot })
    const issuedBottom = issue(bottom), issuedTop = issue(top)
    const result = await runLeagueCell({ repository: leagueRepository, start, cell, bottom: { ...issuedBottom } as never, top: issuedTop, requestRoot: cell.requestRoot, match: { bottomPlayerId: "bottom", topPlayerId: "top", bottomStrategyRevisionId: issuedBottom.identity.revisionId, topStrategyRevisionId: issuedTop.identity.revisionId }, runCanonicalLabMatch: async () => ({ kind: "failure", privacy: "private_offline", transitions: [], accounting: [], unchangedState: null, failure: { classification: "system_failure", code: "LAB_CLEANUP_INCOMPLETE" } }) })
    expect(result).toMatchObject({ disposition: "system_failure", processValidity: "process_invalid" })
  })
})
