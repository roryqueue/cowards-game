/** HOST-only fixture: public constants/static compilation; no retained reads or Strategy execution. */
import { readFileSync } from "node:fs"
import { expect } from "vitest"
import { labRoot, type LabRoot } from "../../packages/strategy-lab/src/contracts.js"
import { leanBytesRoot, leanCanonicalBytes } from "../../packages/strategy-lab/src/league/lean-experiment.js"
import { buildLeanColdCorpus } from "./v1-38-lean-cold-corpus.js"
import { buildLeanInitialProposals } from "./v1-38-lean-training-adapter.js"
import { buildLeanBaselineSource } from "./v1-38-lean-baseline-source.js"
import { LEAN_COLD_REUSE_HISTORY as HISTORY, type LeanColdReuse } from "./v1-38-lean-baseline-reuse.js"
import { emitTacticalSource } from "../../packages/strategy-oracle-tactical/src/emit.js"
import { buildPlannerCandidate } from "../../packages/strategy-lab/src/planner/emit.js"

export const LEAN_OWNED_HOST_SOURCE = labRoot("precharge-host-source-fixture", 1)
export const createLeanOwnedReuseHostFixture = (): LeanColdReuse => {
  const corpus = buildLeanColdCorpus(HISTORY.seed)
  const proposals = buildLeanInitialProposals({ commonSourceRoot: HISTORY.coldRoot, tacticalInputs: corpus.tacticalInputs, teacherSearchReceipts: corpus.teacherSearchReceipts })
  const sources = [emitTacticalSource(), buildPlannerCandidate().source, ...proposals.tactical.map(p => p.source), proposals.teacher.source].map((source, ordinal) => buildLeanBaselineSource({ role: ["cold-opponent", "probe", "tactical-0", "tactical-1", "tactical-2", "tactical-3", "teacher-0"][ordinal]!, source, coldRoot: HISTORY.coldRoot, implementationRoot: HISTORY.sourceRoot }))
  const publicModule = readFileSync(new URL("./v1-38-lean-baseline-reuse.ts", import.meta.url), "utf8")
  const raw = publicModule.slice(publicModule.indexOf("const RAW ="), publicModule.indexOf("export const LEAN_COLD_REUSE_FILES"))
  const artifactRoots = Object.fromEntries([...raw.matchAll(/"([^"]+)": "(sha256:[0-9a-f]{64})"/gu)].map(match => [match[1]!, match[2] as LabRoot]))
  expect(Object.keys(artifactRoots)).toHaveLength(14)
  for (const [name, value] of [["cold-corpus.json", corpus], ["initial-proposals.json", proposals], ...sources.map(s => [`source-${s.role}.json`, s])] as const) expect(leanBytesRoot(leanCanonicalBytes(value))).toBe(artifactRoots[name as string])
  const body = { schemaVersion: "lean-cold-reuse-grant-v1" as const, privacy: "private_offline" as const, amendmentRoot: HISTORY.amendmentRoot, newSourceRoot: LEAN_OWNED_HOST_SOURCE, seed: HISTORY.seed, coldRoot: HISTORY.coldRoot, corpusRoot: corpus.corpusRoot, proposalSetRoot: proposals.root, artifactRoots,
    sourceBindings: sources.map(s => ({ role: s.role, snapshotRoot: s.root, packetRoot: s.packet.root, proposalRoot: s.proposal.root, validationRoot: s.validation.root, sourceRoot: s.sourceRoot })),
    predecessor: { sourceRoot: HISTORY.sourceRoot, allocationRoot: HISTORY.allocationRoot, resultBytesRoot: artifactRoots["result.json"]!, terminalBytesRoot: artifactRoots["child-terminal.json"]!, chargeBytesRoot: artifactRoots["ledger.ndjson"]!, timeBytesRoot: artifactRoots["time.ndjson"]!, verificationRoot: HISTORY.verificationRoot, chargedMatches: 10 as const, elapsedMs: 3319046 as const, historicalPeakDiskKnown: false as const, historicalPeakRssKnown: false as const },
    opportunity: { tacticalEvaluations: 64 as const, teacherSearchNodes: 64 as const, distillationExamples: 64 as const, responseNodes: 128 as const, totalChannelOperations: 320 as const, spentColdOperations: 192 as const, prospectiveResponseNodes: 128 as const } }
  return { corpus, proposals, sources, grant: { ...body, root: labRoot("lean-cold-reuse-grant-v1", body) } }
}
