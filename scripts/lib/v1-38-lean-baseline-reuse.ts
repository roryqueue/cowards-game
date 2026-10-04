/** Exact, private pre-training reuse admission. No cold/search/emission builders
 * or historical empirical readers are invoked; the outer grant is not a run permit. */
import { constants, openSync, closeSync, readFileSync, lstatSync, realpathSync, fstatSync } from "node:fs"
import { join, resolve } from "node:path"
import { labRoot, exactLabKeys, type LabRoot } from "../../packages/strategy-lab/src/contracts.js"
import { deriveLeanColdCorpusRoot } from "../../packages/strategy-lab/src/league/lean-training.js"
import { leanBytesRoot, leanCanonicalBytes } from "../../packages/strategy-lab/src/league/lean-experiment.js"
import { deriveFactorySourceStructureRoot } from "../../packages/strategy-lab/src/factory/fingerprint.js"
import { projectTeacherSearchToLegalTraining } from "../../packages/strategy-oracle-teacher/src/index.js"
import { TACTICAL_ADAPTATION_PROFILES } from "../../packages/strategy-oracle-tactical/src/index.js"
import { validateLeanBaselineSource, type LeanBaselineSource } from "./v1-38-lean-baseline-source.js"
import type { buildLeanColdCorpus } from "./v1-38-lean-cold-corpus.js"
import type { LeanInitialProposalSet, LeanMechanismProposal } from "./v1-38-lean-training-adapter.js"

const fail = (): never => { throw new TypeError("LEAN_COLD_REUSE") }
const isRoot = (value: unknown): value is LabRoot => typeof value === "string" && /^sha256:[0-9a-f]{64}$/u.test(value)
const same = (a: unknown, b: unknown) => labRoot("lean-reuse-equality-v1", a) === labRoot("lean-reuse-equality-v1", b)
const freeze = <T>(value: T): T => {
  if (value && typeof value === "object") { for (const child of Object.values(value)) freeze(child); Object.freeze(value) }
  return value
}
export const LEAN_COLD_REUSE_HISTORY = Object.freeze({
  seed: "lean-current-baseline-20261004-a",
  coldRoot: "sha256:0ddc7020599f151c1d723bedbf960e7c6924dff5e47240214e509846f69d688e" as LabRoot,
  sourceRoot: "sha256:03e2a09d1a79aff27fb1ecfd6a6f52d307aeb5b7303139b6e7a5b3f58a019781" as LabRoot,
  allocationRoot: "sha256:92c856a0e1944fcc429e0c7da2f40851ce8914b66cf8f4e63aa7ba2545aa422f" as LabRoot,
  verificationRoot: "sha256:ace1f5df26e2d1bd9f4895fe76725b207ea0fdc789dce2dd4f63112e22bc4962" as LabRoot,
  amendmentRoot: "sha256:ad8ced715d6d259f0bc4c958ccaae33cfdd1fb3e15220b7f476ab7b231ff68ca" as LabRoot,
})
/** Independently inventoried exact historical bytes, not caller-selected roots. */
const RAW = Object.freeze({
  "allocation.json": "sha256:9726cb9fa5b93c5c46c6c2a835da2c45d8e1fd31f518619cc69ee2ec1d94d894",
  "result.json": "sha256:5aa36738cda28049b60a294ece81518f8cd74e56e05612d9852092fe3c4298ab",
  "child-terminal.json": "sha256:2ea7d61e9c16678ebab08995c82561ff7cc11b3c5e035786c27c3574c7a2d270",
  "ledger.ndjson": "sha256:fdee81b0656bc0def9c814daa9193ec3bb3a6ff33c4f177dcd9ef7ce7f0ec2bb",
  "time.ndjson": "sha256:0f134b9e57245bfa2e3f169170fa2f404a3b99436a790d40e667838d7ac0bd85",
  "cold-corpus.json": "sha256:4a4260e20acf4048e60291b90439ac589ed3c8faabd50d6f601b496e797fe383",
  "initial-proposals.json": "sha256:3811daff3d14f4f30bdad895630146208d56e7e50c5ada0b08397af35d3779cf",
  "source-cold-opponent.json": "sha256:1086a24213ddb18ed209f760ea3f3eacf7c0a7f06e8dc213d4f7ab1123f70f21",
  "source-probe.json": "sha256:8425b7eedf2aa93c879791741bd3915e778f7ab12a9a43130ca3c2b864320f3a",
  "source-tactical-0.json": "sha256:5ac15a0c06866c53129e8cc89b7f3766fc45ac57c64aeaa59d56ac07e52b1d98",
  "source-tactical-1.json": "sha256:d474eb5ba66320adf7467a9d3bb04f3b283580759646598106b5d2ae82360e77",
  "source-tactical-2.json": "sha256:0efb2c5efb04b0697473a9b30656d7d12112e711bec6e64f8fc36ab031fa4834",
  "source-tactical-3.json": "sha256:57968aa33e67dbaba4db2aa41548660b14fd4b14fe568a1cd5fcd20c5e15223d",
  "source-teacher-0.json": "sha256:13e46f39b8d8675cd67addb01e5ea5ff22181afe0e5eadf5008f02cd429be51e",
} satisfies Record<string, LabRoot>)
export const LEAN_COLD_REUSE_FILES = Object.freeze(Object.keys(RAW) as (keyof typeof RAW)[])
const ROLES = Object.freeze(["cold-opponent", "probe", "tactical-0", "tactical-1", "tactical-2", "tactical-3", "teacher-0"])
const OPPORTUNITY = Object.freeze({ tacticalEvaluations: 64, teacherSearchNodes: 64, distillationExamples: 64, responseNodes: 128, totalChannelOperations: 320, spentColdOperations: 192, prospectiveResponseNodes: 128 })
type Corpus = ReturnType<typeof buildLeanColdCorpus>
export interface LeanColdReuseGrant {
  readonly schemaVersion: "lean-cold-reuse-grant-v1"
  readonly privacy: "private_offline"
  readonly amendmentRoot: LabRoot
  readonly newSourceRoot: LabRoot
  readonly seed: string
  readonly coldRoot: LabRoot
  readonly corpusRoot: LabRoot
  readonly proposalSetRoot: LabRoot
  readonly artifactRoots: Readonly<Record<string, LabRoot>>
  readonly sourceBindings: readonly Readonly<{ role: string; snapshotRoot: LabRoot; packetRoot: LabRoot; proposalRoot: LabRoot; validationRoot: LabRoot; sourceRoot: LabRoot }>[]
  readonly predecessor: Readonly<{ sourceRoot: LabRoot; allocationRoot: LabRoot; resultBytesRoot: LabRoot; terminalBytesRoot: LabRoot; chargeBytesRoot: LabRoot; timeBytesRoot: LabRoot; verificationRoot: LabRoot; chargedMatches: 10; elapsedMs: 3319046; historicalPeakDiskKnown: false; historicalPeakRssKnown: false }>
  readonly opportunity: typeof OPPORTUNITY
  readonly root: LabRoot
}
export interface LeanColdReuse {
  readonly grant: LeanColdReuseGrant
  readonly corpus: Corpus
  readonly proposals: LeanInitialProposalSet
  readonly sources: readonly LeanBaselineSource[]
}
const validateInputs = (corpus: Corpus, proposals: LeanInitialProposalSet, sources: readonly LeanBaselineSource[]): void => {
  if (!exactLabKeys(corpus, ["schemaVersion", "seed", "policy", "prefixObservationCounts", "distinctTacticalInputCount", "tacticalInputs", "corpusRoot", "teacherSearchReceipts"]) || corpus.schemaVersion !== "lean-nonlearned-cold-corpus-v1" || corpus.seed !== LEAN_COLD_REUSE_HISTORY.seed || corpus.policy !== "canonical-prefix-turn-left-right-v1" || !same(corpus.prefixObservationCounts, [32, 32]) || deriveLeanColdCorpusRoot(corpus.tacticalInputs) !== corpus.corpusRoot || new Set(corpus.tacticalInputs.map(input => labRoot("runtime-input", input))).size !== corpus.distinctTacticalInputCount) return fail()
  if (!Array.isArray(corpus.teacherSearchReceipts) || corpus.teacherSearchReceipts.length !== 1) return fail()
  const teacher = corpus.teacherSearchReceipts[0]!, records = projectTeacherSearchToLegalTraining(teacher)
  if (teacher.nodesVisited !== 64 || teacher.depthReached > 6 || !records.length || !same(teacher.outcomes.map(row => row.outcomeRoot), teacher.outcomeRoots) || !teacher.outcomeRoots.includes(teacher.selectedOutcomeRoot) || teacher.canonicalTransitionRoot !== teacher.selectedOutcomeRoot || teacher.outcomes.find(row => row.outcomeRoot === teacher.selectedOutcomeRoot)?.template !== teacher.selectedTemplate) return fail()
  for (const row of teacher.outcomes) {
    // The original teacher uses ordered JSON, not labRoot; reproduce only its
    // receipt digest, never the charged canonical search or state transitions.
    const bytes = new TextEncoder().encode(JSON.stringify({ template: row.template, score: row.score, stateRoot: row.stateRoot, terminal: row.terminal }))
    if (leanBytesRoot(bytes) !== row.outcomeRoot) return fail()
  }
  if (!exactLabKeys(proposals, ["schemaVersion", "commonSourceRoot", "frozenTacticalSearchSpaceRoot", "tactical", "teacher", "operations", "teacherReceiptRoots", "teacherSearchNodeRoots", "distillationExampleRoots", "teacherProjectedDistinctLabelCount", "teacherResamplingRoot", "root"]) || proposals.schemaVersion !== "lean-initial-proposals-v1" || proposals.commonSourceRoot !== LEAN_COLD_REUSE_HISTORY.coldRoot || !same(proposals.operations, { tacticalEvaluations: 64, teacherSearchNodes: 64, distillationExamples: 64, maximumTacticalBeam: 4 }) || !Array.isArray(proposals.tactical) || proposals.tactical.length !== 4) return fail()
  const { root: proposalRoot, ...body } = proposals
  if (proposalRoot !== labRoot("lean-initial-proposals-v1", body) || proposals.frozenTacticalSearchSpaceRoot !== labRoot("lean-tactical-search-space-binding-v1", { root: labRoot("lean-tactical-frozen-search-space-v1", TACTICAL_ADAPTATION_PROFILES.map(profile => profile.root)), maximumBeam: 4 })) return fail()
  const receiptRoot = labRoot("lean-canonical-teacher-receipt-v1", teacher)
  const nodeRoots = Array.from({ length: 64 }, (_, ordinal) => labRoot("lean-teacher-search-work-index-v1", { receiptRoot, ordinal }))
  const exampleRoots = Array.from({ length: 64 }, (_, ordinal) => labRoot("lean-teacher-distillation-example-v1", { ordinal, sourceOrdinal: ordinal % records.length, record: records[ordinal % records.length]! }))
  if (!same(proposals.teacherReceiptRoots, [receiptRoot]) || !same(proposals.teacherSearchNodeRoots, nodeRoots) || !same(proposals.distillationExampleRoots, exampleRoots) || proposals.teacherProjectedDistinctLabelCount !== records.length || proposals.teacherResamplingRoot !== labRoot("lean-teacher-legal-label-resampling-v1", { rule: "canonical-order-round-robin-v1", sourceLabelCount: records.length, sampleCount: 64, exampleRoots })) return fail()
  const validateProposal = (candidate: LeanMechanismProposal, mechanism: "tactical" | "teacher", expectedInputs: readonly LabRoot[]) => {
    if (!exactLabKeys(candidate, ["mechanism", "source", "sourceRoot", "structureRoot", "parameterRoot", "decisionRoot", "inputRoots", "root"]) || candidate.mechanism !== mechanism || typeof candidate.source !== "string" || !isRoot(candidate.parameterRoot) || !isRoot(candidate.decisionRoot) || !same(candidate.inputRoots, expectedInputs)) return fail()
    const { root, ...value } = candidate, bytes = new TextEncoder().encode(candidate.source)
    if (!bytes.length || bytes.length > 65536 || candidate.sourceRoot !== leanBytesRoot(bytes) || candidate.structureRoot !== deriveFactorySourceStructureRoot(bytes) || root !== labRoot("lean-mechanism-proposal-v1", value)) return fail()
  }
  for (const candidate of proposals.tactical) validateProposal(candidate, "tactical", corpus.tacticalInputs.map(input => labRoot("runtime-input", input)))
  validateProposal(proposals.teacher, "teacher", Array.from({ length: 64 }, (_, ordinal) => labRoot("runtime-input", records[ordinal % records.length]!.input)))
  if (!Array.isArray(sources) || sources.length !== 7 || !same(sources.map(source => source.role), ROLES)) return fail()
  sources.forEach((raw, ordinal) => {
    const source = validateLeanBaselineSource(raw)
    if (source.coldRoot !== LEAN_COLD_REUSE_HISTORY.coldRoot || source.implementationRoot !== LEAN_COLD_REUSE_HISTORY.sourceRoot || leanBytesRoot(leanCanonicalBytes(source)) !== RAW[`source-${source.role}.json` as keyof typeof RAW]) return fail()
    const proposal = ordinal >= 2 && ordinal < 6 ? proposals.tactical[ordinal - 2] : ordinal === 6 ? proposals.teacher : null
    if (proposal && (proposal.sourceRoot !== source.sourceRoot || proposal.structureRoot !== source.structureRoot || proposal.source !== source.source)) return fail()
  })
}
const grantFor = (newSourceRoot: LabRoot, amendmentRoot: LabRoot, corpus: Corpus, proposals: LeanInitialProposalSet, sources: readonly LeanBaselineSource[]): LeanColdReuseGrant => {
  if (!isRoot(newSourceRoot) || newSourceRoot === LEAN_COLD_REUSE_HISTORY.sourceRoot || amendmentRoot !== LEAN_COLD_REUSE_HISTORY.amendmentRoot) return fail()
  const body = { schemaVersion: "lean-cold-reuse-grant-v1" as const, privacy: "private_offline" as const, amendmentRoot, newSourceRoot, seed: corpus.seed, coldRoot: LEAN_COLD_REUSE_HISTORY.coldRoot, corpusRoot: corpus.corpusRoot, proposalSetRoot: proposals.root, artifactRoots: RAW,
    sourceBindings: sources.map(source => ({ role: source.role, snapshotRoot: source.root, packetRoot: source.packet.root, proposalRoot: source.proposal.root, validationRoot: source.validation.root, sourceRoot: source.sourceRoot })),
    predecessor: { sourceRoot: LEAN_COLD_REUSE_HISTORY.sourceRoot, allocationRoot: LEAN_COLD_REUSE_HISTORY.allocationRoot, resultBytesRoot: RAW["result.json"], terminalBytesRoot: RAW["child-terminal.json"], chargeBytesRoot: RAW["ledger.ndjson"], timeBytesRoot: RAW["time.ndjson"], verificationRoot: LEAN_COLD_REUSE_HISTORY.verificationRoot, chargedMatches: 10 as const, elapsedMs: 3319046 as const, historicalPeakDiskKnown: false as const, historicalPeakRssKnown: false as const }, opportunity: OPPORTUNITY }
  return { ...body, root: labRoot("lean-cold-reuse-grant-v1", body) }
}
/** Pure retained-input validator, also used by the new reader; never generates work. */
export const validateLeanColdReuse = (value: unknown, newSourceRoot: LabRoot): LeanColdReuse => {
  if (!exactLabKeys(value, ["grant", "corpus", "proposals", "sources"])) return fail()
  const v = value as unknown as LeanColdReuse
  if (!v.grant || leanBytesRoot(leanCanonicalBytes(v.corpus)) !== RAW["cold-corpus.json"] || leanBytesRoot(leanCanonicalBytes(v.proposals)) !== RAW["initial-proposals.json"]) return fail()
  validateInputs(v.corpus, v.proposals, v.sources)
  if (!same(v.grant, grantFor(newSourceRoot, v.grant.amendmentRoot, v.corpus, v.proposals, v.sources))) return fail()
  // Own the admitted value so a caller cannot mutate it after validation.
  return freeze(structuredClone(v))
}
export const authenticateLeanColdReuseArtifacts = (input: { artifacts: Readonly<Record<string, Uint8Array>>; newSourceRoot: LabRoot; amendmentRoot: LabRoot }): LeanColdReuse => {
  if (!exactLabKeys(input, ["artifacts", "newSourceRoot", "amendmentRoot"]) || !exactLabKeys(input.artifacts, LEAN_COLD_REUSE_FILES)) return fail()
  const values: Record<string, unknown> = {}
  for (const name of LEAN_COLD_REUSE_FILES) {
    const bytes = input.artifacts[name]
    if (!(bytes instanceof Uint8Array) || !bytes.length || bytes.length > 262144 || leanBytesRoot(bytes) !== RAW[name]) return fail()
    if (name.endsWith(".json")) {
      const value: unknown = JSON.parse(Buffer.from(bytes).toString("utf8"))
      if (leanBytesRoot(leanCanonicalBytes(value)) !== RAW[name]) return fail()
      values[name] = value
    }
  }
  const corpus = values["cold-corpus.json"] as Corpus, proposals = values["initial-proposals.json"] as LeanInitialProposalSet
  const sources = ROLES.map(role => values[`source-${role}.json`] as LeanBaselineSource)
  const allocation = values["allocation.json"] as { root: LabRoot; sourceRoot: LabRoot; coldRoot: LabRoot; seed: string }
  if (allocation.root !== LEAN_COLD_REUSE_HISTORY.allocationRoot || allocation.sourceRoot !== LEAN_COLD_REUSE_HISTORY.sourceRoot || allocation.coldRoot !== LEAN_COLD_REUSE_HISTORY.coldRoot || allocation.seed !== LEAN_COLD_REUSE_HISTORY.seed) return fail()
  return validateLeanColdReuse({ corpus, proposals, sources, grant: grantFor(input.newSourceRoot, input.amendmentRoot, corpus, proposals, sources) }, input.newSourceRoot)
}
const readPrivate = (directory: string, name: string): Uint8Array => {
  const path = join(directory, name), stat = lstatSync(path)
  if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1 || (stat.mode & 0o777) !== 0o600 || stat.uid !== process.getuid?.() || stat.size > 262144 || realpathSync(path) !== path) return fail()
  const fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW)
  try {
    const before = fstatSync(fd)
    if (before.dev !== stat.dev || before.ino !== stat.ino || before.size !== stat.size || before.nlink !== 1 || before.uid !== stat.uid || (before.mode & 0o777) !== 0o600) return fail()
    const bytes = readFileSync(fd), after = fstatSync(fd)
    if (bytes.length !== before.size || after.size !== before.size || after.mtimeMs !== before.mtimeMs || after.ctimeMs !== before.ctimeMs || after.nlink !== 1) return fail()
    return bytes
  } finally { closeSync(fd) }
}
export const authenticateLeanColdReuse = (input: { directory: string; newSourceRoot: LabRoot; amendmentRoot: LabRoot }): LeanColdReuse => {
  if (!exactLabKeys(input, ["directory", "newSourceRoot", "amendmentRoot"])) return fail()
  const directory = resolve(input.directory), stat = lstatSync(directory)
  if (!stat.isDirectory() || stat.isSymbolicLink() || (stat.mode & 0o777) !== 0o700 || stat.uid !== process.getuid?.() || realpathSync(directory) !== directory) return fail()
  const artifacts = Object.fromEntries(LEAN_COLD_REUSE_FILES.map(name => [name, readPrivate(directory, name)]))
  return authenticateLeanColdReuseArtifacts({ artifacts, newSourceRoot: input.newSourceRoot, amendmentRoot: input.amendmentRoot })
}
