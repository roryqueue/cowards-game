import { createHash } from "node:crypto"
import { execFileSync } from "node:child_process"
import { closeSync, constants, existsSync, fsyncSync, linkSync, lstatSync, mkdirSync, openSync, readFileSync, readdirSync, realpathSync, unlinkSync, writeFileSync } from "node:fs"
import { arch, cpus, platform, release } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { performance } from "node:perf_hooks"
import { admitCanonicalJsonBytes, admitCanonicalJsonValue, CANONICAL_ARENA_CATALOG_V1_37, SoldierBrainInputV119Schema, StrategyInputV119Schema, SoldierBrainResultSchema, StrategyResultSchema, type JsonValue, type StrategyRevision, type SoldierBrainInputV119, type StrategyInputV119 } from "@cowards/spec"
import { createInitialGameState, createSoldierBrainInputV119, createStrategyInputV119, MATCH_KERNEL, type GameState } from "../packages/engine/src/index.js"
import { buildPlannerCandidate, mapPlannerMissionCorpus } from "../packages/strategy-lab/src/planner/emit.js"
import { createMission, fallbackMission, MISSION_KINDS } from "../packages/strategy-lab/src/planner/missions.js"
import { buildFeasibilityAllocation, buildFeasibilityCorpus, evaluateFeasibilityTiming, PLANNER_FEASIBILITY_PROTOCOL } from "../packages/strategy-lab/src/feasibility-protocol.js"
import { LAB_ADMITTED_ROOTS, exactLabKeys, freezeLabValue, labRoot, type LabRoot } from "../packages/strategy-lab/src/contracts.js"
import { enumerateLabTasks, type LabAssignment } from "../packages/strategy-lab/src/tasks.js"
import { runLabTasks } from "../packages/strategy-lab/src/runner.js"
import { resumeLabInventory, publishLabTrace, type LabStoredRecord } from "../packages/strategy-lab/src/shards.js"
import { reduceLabRecords } from "../packages/strategy-lab/src/reduce.js"
import { runCanonicalLabMatch, type LabKernelRequest, type LabMatchExecution } from "../packages/strategy-lab/src/runtime-bridge.js"
import { runPlannerBenchmark } from "../packages/strategy-lab/src/benchmark.js"
import { buildStrategyRevision } from "../packages/runtime-js/src/revision.js"
import { validateStrategySource } from "../packages/runtime-js/src/validation.js"
import { buildPlannerBenchmarkObserverHarness, WORKER_HARNESS_SOURCE } from "../packages/runtime-js/src/worker-harness.js"
import { createPlannerSupervisedRuntime, type PlannerSupervisedRuntime } from "./lib/v1-38-planner-supervised-runtime.js"
import { buildLeanAuthenticatedHarnessSource } from "./lib/v1-38-lean-container-match-session.js"
import { findAdvancedStrategy } from "../packages/persistence/src/advanced-strategies.js"
import { plannerExecutableClosure } from "./lib/v1-38-executable-closure.js"
import { RuntimeViolationTypeSchema } from "@cowards/spec"

const REPOSITORY = fileURLToPath(new URL("../",import.meta.url))
const REVIEW = join(REPOSITORY,".planning/phases/263-legal-planner-and-deterministic-runner-feasibility/263-REVIEW.md")
const rawRoot = (value: string | Uint8Array): LabRoot => `sha256:${createHash("sha256").update(value).digest("hex")}`
type Method = "selectActivations" | "soldierBrain"
type Classification = "success" | "source_rejection" | "input_rejection" | "player_violation" | "system_failure"
export interface PlannerValidationCase {
  ordinal: number; root: LabRoot; family: "pair" | "tactic" | "hostile"; method: Method;
  input: unknown; inputRoot: LabRoot; hiddenStateRoot: LabRoot; context: string; pair: number | null;
  source: string | null; expected: { classification: Classification; actionType?: string; direction?: string; missionStatus?: string; selectionId?: string; missionKind?: string };
}
export interface PlannerValidationRecord {
  ordinal: number; caseRoot: LabRoot; inputRoot: LabRoot; classification: Classification; guestCalls: number;
  value: unknown; provenance: "synthetic" | "supervised_container"; cleanupComplete: boolean;
}
const validationState = (index: number) => {
  const state = createInitialGameState({ matchId: `validation-${index}`,seed: `validation-${index}`,arenaVariant: { id: "validation-static",name: "Validation static",initialBounds: { minX: 0,minY: 0,maxX: 11,maxY: 11 },terrainStones: [] },bottomPlayerId: "bottom",topPlayerId: "top",bottomStrategyRevisionId: "candidate",topStrategyRevisionId: "fixture" })
  state.soldiers.forEach(s => { s.status = "FALLEN"; s.position = null })
  const self = state.soldiers[0]!, ally = state.soldiers[1]!, enemy = state.soldiers.find(s => s.ownerPlayerId === "top")!
  Object.assign(self,{ status: "ACTIVE",position: { x: 4,y: 5 },facing: "UP" })
  Object.assign(ally,{ status: "ACTIVE",position: { x: 7,y: 5 },facing: "UP" })
  Object.assign(enemy,{ status: "ACTIVE",position: { x: 5,y: 3 },facing: "UP" })
  return { state,self,ally,enemy }
}

/** Build all expectations before measurement from explicit cases, not candidate output. */
export const buildPlannerValidationInventory = () => {
  const cases: PlannerValidationCase[] = []
  const add = (value: Omit<PlannerValidationCase,"ordinal" | "root" | "inputRoot">) => {
    const entry = { ...value,ordinal: cases.length,inputRoot: labRoot("validation-input",value.input) }
    cases.push({ ...entry,root: labRoot("validation-case",entry) })
  }
  for (let pair = 0; pair < 64; pair++) {
    const method: Method = pair < 32 ? "selectActivations" : "soldierBrain"
    const f = validationState(pair)
    f.self.position = { x: 2+pair%8,y: 3+Math.floor(pair%32/8) }
    f.enemy.position = { x: f.self.position.x+1,y: f.self.position.y-2 }
    f.ally.position = { x: f.self.position.x,y: f.self.position.y+2 }
    f.state.roundNumber = (1+pair%4) as 1 | 2 | 3 | 4; f.state.activationCount = f.state.roundNumber
    const g = structuredClone(f.state)
    g.players[1].strategyMemory = { privateTeacher: `different-${pair}` }
    g.soldiers.find(s => s.id === f.enemy.id)!.soldierMemory = { hiddenOpponentMemory: pair+1 }
    const objective = createMission(MISSION_KINDS[pair%10]!,createStrategyInputV119(f.state,"bottom"),f.self.id) ?? fallbackMission(createStrategyInputV119(f.state,"bottom"),f.self.id)
    const inputs = [f.state,g].map(state => method === "selectActivations" ? createStrategyInputV119(state,"bottom") : createSoldierBrainInputV119(state,f.self.id,pair%12,pair%2 === 0,objective))
    if (labRoot("legal-pair-input",inputs[0]) !== labRoot("legal-pair-input",inputs[1]) || labRoot("private-state",f.state) === labRoot("private-state",g)) throw new TypeError("LAB_PAIR_PROJECTION")
    for (const side of [0,1]) add({ family: "pair",method,input: inputs[side],hiddenStateRoot: labRoot("private-state",side === 0 ? f.state : g),context: pair%32 < 16 ? `fresh-${pair}-${side}` : `reused-${method}`,pair,source: null,expected: { classification: "success" } })
  }
  for (let i = 0; i < 64; i++) {
    const f = validationState(128+i)
    let objective: JsonValue | undefined,advanced = false,cycle = 0
    let expected: PlannerValidationCase["expected"] = { classification: "success" }
    if (i < 16) {
      f.state.roundNumber = 4
      const selected = i%2 === 0 ? f.self : f.ally,immobile = i%2 === 0 ? f.ally : f.self
      selected.position = { x: 0,y: 2+i%8 }; immobile.status = "STONE"
      expected = { classification: "success",selectionId: selected.id,missionKind: "evacuation" }
    } else if (i < 32) {
      const d = (["UP","RIGHT","DOWN","LEFT"] as const)[i%4]!,offset = 2+Math.floor(i/4)
      const v = d === "UP" ? { x: 0,y: -1 } : d === "DOWN" ? { x: 0,y: 1 } : d === "LEFT" ? { x: -1,y: 0 } : { x: 1,y: 0 }
      f.enemy.position = { x: v.x < 0 ? 0 : v.x > 0 ? 11 : offset,y: v.y < 0 ? 0 : v.y > 0 ? 11 : offset }
      f.self.position = { x: f.enemy.position.x-v.x,y: f.enemy.position.y-v.y }; f.self.facing = d; f.enemy.facing = v.x ? "UP" : "RIGHT"
      f.ally.status = "FALLEN"; f.ally.position = null
      expected = { classification: "success",actionType: "MOVE",direction: d }
    } else if (i < 48) {
      objective = createMission("rear-entry",createStrategyInputV119(f.state,"bottom"),f.self.id)!
      f.enemy.status = "FALLEN"; f.enemy.position = null; advanced = true
      expected = { classification: "success",missionStatus: "stale" }
    } else {
      f.enemy.position = { x: 10,y: 9 }; advanced = i%2 === 0; cycle = 11
      objective = fallbackMission(createStrategyInputV119(f.state,"bottom"),f.self.id)
      expected = { classification: "success",actionType: advanced ? "TURN" : "MOVE" }
    }
    add({ family: "tactic",method: i < 16 ? "selectActivations" : "soldierBrain",input: i < 16 ? createStrategyInputV119(f.state,"bottom") : createSoldierBrainInputV119(f.state,f.self.id,cycle,advanced,objective),hiddenStateRoot: labRoot("private-state",f.state),context: `tactic-${i}`,pair: null,source: null,expected })
  }
  for (let i = 0; i < 64; i++) {
    const f = validationState(192+i),group = Math.floor(i/8)
    const method: Method = group === 2 || group === 3 ? "selectActivations" : "soldierBrain"
    let body = "return { action: { type: 'FLY' }, soldierMemory: {} };",classification: Classification = "player_violation"
    if (group === 1) body = `return { action:{type:'TURN_TO_STONE'},soldierMemory:'x'.repeat(${2048+i}) };`
    if (group === 2) body = `return { activationOrders:[],strategyMemory:'x'.repeat(${32768+i}) };`
    if (group === 3) body = `return { activationOrders:[{soldierId:input.mySoldiers[0].id,objective:'x'.repeat(${1024+i})}],strategyMemory:{} };`
    if (group === 4) body = `throw new Error('private-probe-${i}');`
    if (group === 6) { body = "return process.env;"; classification = "source_rejection" }
    const defaultSelect = "return {activationOrders:[],strategyMemory:{}};",defaultBrain = "return {action:{type:'TURN_TO_STONE'},soldierMemory:{}};"
    let source: string | null = `// fixed-probe-${i}\nexport default { selectActivations(input){${method === "selectActivations" ? body : defaultSelect}}, soldierBrain(input){${method === "soldierBrain" ? body : defaultBrain}} };`
    let input: unknown = method === "selectActivations" ? createStrategyInputV119(f.state,"bottom") : createSoldierBrainInputV119(f.state,f.self.id,0,false)
    if (group === 5) { source = null; input = { ...(input as object),hasAdvancedThisActivation: `invalid-${i}` }; classification = "input_rejection" }
    if (group === 7) { source += " ".repeat(65537); classification = "source_rejection" }
    add({ family: "hostile",method,input,hiddenStateRoot: labRoot("private-state",f.state),context: `hostile-${i}`,pair: null,source,expected: { classification } })
  }
  return freezeLabValue({ schemaVersion: "planner-validation-v1",cases,root: labRoot("validation-inventory",cases.map(c => c.root)) })
}

export const evaluatePlannerValidation = (inventory: ReturnType<typeof buildPlannerValidationInventory>,records: readonly PlannerValidationRecord[]) => {
  if (records.length !== 256 || new Set(records.map(r => r.ordinal)).size !== 256) throw new TypeError("LAB_VALIDATION_COVERAGE")
  let valid = true,empirical = true,guestCalls = 0
  for (const [i,c] of inventory.cases.entries()) {
    const r = records[i]!
    if (r.ordinal !== i || r.caseRoot !== c.root || r.inputRoot !== c.inputRoot || !Number.isInteger(r.guestCalls) || r.guestCalls < 0 || r.guestCalls > 1) throw new TypeError("LAB_VALIDATION_BINDING")
    valid = valid && r.cleanupComplete && r.classification === c.expected.classification
    empirical = empirical && r.provenance === "supervised_container"; guestCalls += r.guestCalls
    if (c.expected.classification === "success") {
      valid = valid && r.guestCalls === 1 && (c.method === "selectActivations" ? StrategyResultSchema : SoldierBrainResultSchema).safeParse(r.value).success
      const v = r.value as { action?: { type?: string; direction?: string }; soldierMemory?: { planner?: { missionStatus?: string } }; activationOrders?: { soldierId: string; objective?: { kind?: string } }[] } | null
      if (c.expected.actionType) valid = valid && v?.action?.type === c.expected.actionType
      if (c.expected.direction) valid = valid && v?.action?.direction === c.expected.direction
      if (c.expected.missionStatus) valid = valid && v?.soldierMemory?.planner?.missionStatus === c.expected.missionStatus
      if (c.expected.selectionId) valid = valid && v?.activationOrders?.length === 1 && v.activationOrders[0]?.soldierId === c.expected.selectionId && v.activationOrders[0]?.objective?.kind === c.expected.missionKind
    } else valid = valid && r.guestCalls === (c.expected.classification === "source_rejection" || c.expected.classification === "input_rejection" ? 0 : 1)
  }
  for (let pair = 0; pair < 64; pair++) {
    const a = inventory.cases[pair*2]!,b = inventory.cases[pair*2+1]!
    valid = valid && a.inputRoot === b.inputRoot && a.hiddenStateRoot !== b.hiddenStateRoot && labRoot("pair-output",records[pair*2]!.value) === labRoot("pair-output",records[pair*2+1]!.value)
  }
  return freezeLabValue({ passed: valid && empirical,protocolPassed: valid,empirical,casesCharged: 256,guestCalls,sourceRejected: records.filter(r => r.classification === "source_rejection").length,inputRejected: records.filter(r => r.classification === "input_rejection").length })
}

export interface PlannerPaths { manifestPath: string; outputDirectory: string }
const canonical = (value: unknown): Uint8Array => { const r = admitCanonicalJsonValue(value,{ profile: "canonical-manifest" }); if (!r.ok) throw new TypeError("LAB_CANONICAL_ARTIFACT"); return r.canonicalBytes }
const parseCanonical = (path: string) => {
  const stat = lstatSync(path); if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 262144) throw new TypeError("LAB_ARTIFACT_FILE")
  const fd = openSync(path,constants.O_RDONLY|constants.O_NOFOLLOW)
  try { const value = admitCanonicalJsonBytes(readFileSync(fd),{ profile: "canonical-manifest",operation: "require-canonical" }); if (!value.ok) throw new TypeError("LAB_ARTIFACT_ENCODING"); return value.value } finally { closeSync(fd) }
}
const exact = (value: unknown, keys: string[]) => { if (!exactLabKeys(value,keys)) throw new TypeError("LAB_RETAINED_SCHEMA"); return value }
const boundedInteger = (value: unknown, max: number) => Number.isSafeInteger(value) && Number(value) >= 0 && Number(value) <= max
const rootValue = (value: unknown) => typeof value === "string" && /^sha256:[a-f0-9]{64}$/.test(value)
export const admitPlannerReceipt = (value: unknown) => {
  const receipt = exact(value,["schemaVersion","status","empirical","reason","casesCharged","casesUnused","validationGuestAttempts","validationGuestCalls","validationUncertainCases","benchmarkCalls","benchmarkCallsUnused","benchmarkGuestCalls","benchmarkUncertainCalls","matchAttemptsCharged","matchAttemptsUnused","matchAttemptsUncertain","cleanupComplete","scientificCells","arenaLabels","geometries","elapsedMs","hostPeakRssKiB","productionAuthorized"])
  for (const [key,limit] of Object.entries({casesCharged:256,casesUnused:256,validationGuestAttempts:232,validationGuestCalls:232,validationUncertainCases:256,benchmarkCalls:2200,benchmarkCallsUnused:2200,benchmarkGuestCalls:2200,benchmarkUncertainCalls:2200,matchAttemptsCharged:24,matchAttemptsUnused:24,matchAttemptsUncertain:24})) if (!boundedInteger(receipt[key],limit)) throw new TypeError("LAB_RECEIPT_COUNTS")
  if (receipt.schemaVersion !== "planner-feasibility-receipt-v1" || !["passed","non_pass"].includes(String(receipt.status)) || typeof receipt.empirical !== "boolean" || typeof receipt.cleanupComplete !== "boolean" || typeof receipt.reason !== "string" || !/^(?:complete|incomplete|LAB_[A-Z_]+)$/.test(receipt.reason) || receipt.productionAuthorized !== false || receipt.scientificCells !== 8 || receipt.arenaLabels !== 3 || receipt.geometries !== 2 || !Number.isFinite(receipt.elapsedMs) || Number(receipt.elapsedMs)<0 || !boundedInteger(receipt.hostPeakRssKiB,Number.MAX_SAFE_INTEGER) || Number(receipt.casesCharged)+Number(receipt.casesUnused)!==256 || Number(receipt.benchmarkCalls)+Number(receipt.benchmarkCallsUnused)!==2200 || Number(receipt.matchAttemptsCharged)+Number(receipt.matchAttemptsUnused)!==24) throw new TypeError("LAB_RECEIPT_SCHEMA")
  return receipt
}
const expectedRuntimeIdentity = (manifest: Manifest,revision: StrategyRevision,id: string,harnessRoot: LabRoot) => ({ revisionId:revision.id,sourceRoot:rawRoot(revision.source),executableRoot:`sha256:${revision.metadata.sourceArtifact!.hash}`,tupleId:MATCH_KERNEL.tupleId,tupleRoot:LAB_ADMITTED_ROOTS.tupleRoot,image:LAB_ADMITTED_ROOTS.image,harnessRoot,budgetRoot:PLANNER_FEASIBILITY_PROTOCOL.budgetRoot,attemptRoot:labRoot("feasibility-host",{manifestRoot:manifest.root,id}),runtimeLimitsRoot:LAB_ADMITTED_ROOTS.runtimeLimitsRoot })
export const admitRetainedRuntime = (value: unknown,identity: ReturnType<typeof expectedRuntimeIdentity>,request: LabKernelRequest,ordinal: number) => {
  const e = exact(value,["identity","requestId","method","inputRoot","ordinal","invocationRoot","charged","completed","outputBytes","result"])
  if (labRoot("identity",e.identity)!==labRoot("identity",identity) || e.ordinal!==ordinal || e.requestId!==request.requestId || e.method!==request.kind || e.inputRoot!==labRoot("runtime-input",request.input) || e.charged!==true || typeof e.completed!=="boolean" || !boundedInteger(e.outputBytes,262144) || !rootValue(e.invocationRoot) || e.invocationRoot!==labRoot("supervised-invocation",{identity,requestId:e.requestId,method:e.method,inputRoot:e.inputRoot,ordinal})) throw new TypeError("LAB_RETAINED_RUNTIME_BINDING")
  const result = e.result as Record<string,unknown>
  if (result?.ok===true) { exact(result,["ok","value"]); const parsed=(request.kind==="selectActivations" ? StrategyResultSchema : SoldierBrainResultSchema).safeParse(result.value); if (!e.completed || !parsed.success || labRoot("result",parsed.data)!==labRoot("result",result.value)) throw new TypeError("LAB_RETAINED_RUNTIME_RESULT") }
  else {
    exact(result,result?.systemFailure===undefined ? ["ok","violation"] : ["ok","violation","systemFailure"])
    const violation = exact(result.violation,["type","message"])
    if (result.ok!==false || !RuntimeViolationTypeSchema.safeParse(violation.type).success || typeof violation.message!=="string") throw new TypeError("LAB_RETAINED_RUNTIME_RESULT")
    if (result.systemFailure!==undefined) { const failure=exact(result.systemFailure,["code","retryable"]); if(typeof failure.code!=="string" || typeof failure.retryable!=="boolean") throw new TypeError("LAB_RETAINED_RUNTIME_RESULT") }
  }
  return value as import("../packages/strategy-lab/src/runtime-bridge.js").LabRuntimeEvidence
}
export const admitRetainedValidationResult = (record: Pick<PlannerValidationRecord,"classification"|"value">,e: import("../packages/strategy-lab/src/runtime-bridge.js").LabRuntimeEvidence) => {
  if(record.classification!==classifyRuntime(e.result) || (e.result.ok ? labRoot("value",record.value)!==labRoot("value",e.result.value) : record.value!==null)) throw new TypeError("LAB_RETAINED_CLASSIFICATION")
}
const publish = (path: string,value: unknown) => {
  const parent = dirname(resolve(path)); if (realpathSync(parent) !== parent) throw new TypeError("LAB_ARTIFACT_PARENT")
  const temporary = `${path}.tmp`,fd = openSync(temporary,constants.O_CREAT|constants.O_EXCL|constants.O_WRONLY|constants.O_NOFOLLOW,0o600)
  try { writeFileSync(fd,canonical(value)); fsyncSync(fd) } finally { closeSync(fd) }
  linkSync(temporary,path); unlinkSync(temporary)
}
const captureEnvironment = () => {
  const git = (...args: string[]) => execFileSync("git",args,{ cwd: REPOSITORY,encoding: "utf8" }).trim()
  return { gitCommit: git("rev-parse","HEAD"),dirtyRoot: rawRoot(git("diff","--binary","HEAD")),lockfileRoot: rawRoot(readFileSync(join(REPOSITORY,"pnpm-lock.yaml"))),node: process.versions.node,v8: process.versions.v8,openssl: process.versions.openssl,platform: platform(),release: release(),arch: arch(),cpuModels: [...new Set(cpus().map(c => c.model))].sort(),logicalCpus: cpus().length }
}
const buildFrozenMaterial = () => {
  const candidate = buildPlannerCandidate(),base = buildFeasibilityCorpus(),corpus = "mappingVersion" in base ? base : mapPlannerMissionCorpus(base),inventory = buildPlannerValidationInventory()
  const advanced = findAdvancedStrategy("advanced:vanguard-pressure")
  if (!advanced) throw new TypeError("LAB_FIXTURE_MISSING")
  if (execFileSync("git",["hash-object","packages/persistence/src/advanced-strategies.ts"],{ cwd: REPOSITORY,encoding: "utf8" }).trim() !== LAB_ADMITTED_ROOTS.fixture.moduleBlob) throw new TypeError("LAB_FIXTURE_SOURCE_DRIFT")
  const fixture = buildStrategyRevision({ source: advanced.source,runtime: candidate.revision.runtime })
  const observerSource = buildPlannerBenchmarkObserverHarness(),harnessRoot = rawRoot(buildLeanAuthenticatedHarnessSource(observerSource))
  const protocolRoot = labRoot("planner-final-protocol",{ protocol: PLANNER_FEASIBILITY_PROTOCOL,corpusRoot: corpus.root,inventoryRoot: inventory.root })
  const graph = enumerateLabTasks({ admittedRoot: labRoot("admission",LAB_ADMITTED_ROOTS),algorithm: "hierarchical-planner-v1",candidateRoot: candidate.sourceRoot,opponentRoot: rawRoot(fixture.source),inputRoot: corpus.root,budgetRoot: PLANNER_FEASIBILITY_PROTOCOL.budgetRoot })
  const implementationPaths = ["scripts/run-v1-38-planner-feasibility.ts","scripts/lib/v1-38-planner-supervised-runtime.ts","scripts/lib/v1-38-lean-container-match-session.ts",...['contracts','feasibility-protocol','planner-corpus','benchmark','runtime-bridge','runner','shards','tasks','identity','reduce','worker'].map(name => `packages/strategy-lab/src/${name}.ts`)]
  const implementationRoot = plannerExecutableClosure(REPOSITORY, implementationPaths).root
  const executionRoot = labRoot("supervised-execution",{ candidate: candidate.sourceRoot,executable: candidate.revision.metadata.sourceArtifact!.hash,fixture: rawRoot(fixture.source),provider: "selected-runtime-v1.19",protocolRoot,harnessRoot,implementationRoot })
  return { candidate,corpus,inventory,fixture,observerSource,harnessRoot,protocolRoot,graph,executionRoot }
}
/** Read-only review binding discovery; no environment secrets or source execution. */
export const inspectPlannerFeasibility = () => {
  const m = buildFrozenMaterial()
  return { sourceRoot: m.candidate.sourceRoot,sourceBytes: m.candidate.sourceBytes,executionRoot: m.executionRoot,protocolRoot: m.protocolRoot,corpusRoot: m.corpus.root,inventoryRoot: m.inventory.root,graphRoot: m.graph.root,harnessRoot: m.harnessRoot,validationCases: 256 }
}
export const preparePlannerFeasibility = (paths: PlannerPaths) => {
  if (existsSync(paths.manifestPath) || existsSync(paths.outputDirectory)) throw new TypeError("LAB_PREPARE_NO_CLOBBER")
  const material = buildFrozenMaterial(),environment = captureEnvironment(),review = readFileSync(REVIEW,"utf8")
  const payload = { schemaVersion: "planner-feasibility-manifest-v1",claimClass: "private_offline",sourceRoot: material.candidate.sourceRoot,fixtureRoot: rawRoot(material.fixture.source),corpusRoot: material.corpus.root,inventoryRoot: material.inventory.root,harnessRoot: material.harnessRoot,protocolRoot: material.protocolRoot,graphRoot: material.graph.root,executionRoot: material.executionRoot,machineRoot: labRoot("machine",environment),environment,reviewRoot: rawRoot(review),reviewedSourceRoot: material.candidate.sourceRoot,outputDirectory: resolve(paths.outputDirectory),budgets: { validationCases: 256,benchmarkCalls: 2200,matchAttempts: 24,matchMethodCalls: 24800,methodCalls: 597656,perMatchMs: 120000,overallMs: 3600000,retries: 0 } }
  const manifest = { ...payload,root: labRoot("feasibility-manifest",payload) }
  mkdirSync(paths.outputDirectory,{ mode: 0o700 }); mkdirSync(join(paths.outputDirectory,"lab-matches"),{ mode: 0o700 }); mkdirSync(join(paths.outputDirectory,"validation"),{ mode: 0o700 })
  mkdirSync(join(paths.outputDirectory,"benchmark"),{ mode: 0o700 })
  for (const c of material.inventory.cases) publish(join(paths.outputDirectory,"validation",`case-${c.ordinal}.json`),c)
  publish(join(paths.outputDirectory,"prepared.json"),{ manifestRoot: manifest.root,sourceRoot: material.candidate.sourceRoot,inventoryRoot: material.inventory.root })
  publish(paths.manifestPath,manifest)
  return manifest
}
type Manifest = ReturnType<typeof preparePlannerFeasibility>
const admitPrepared = (paths: PlannerPaths) => {
  const raw = exact(parseCanonical(paths.manifestPath),["schemaVersion","claimClass","sourceRoot","fixtureRoot","corpusRoot","inventoryRoot","harnessRoot","protocolRoot","graphRoot","executionRoot","machineRoot","environment","reviewRoot","reviewedSourceRoot","outputDirectory","budgets","root"]) as unknown as Manifest
  const env = exact(raw.environment,["gitCommit","dirtyRoot","lockfileRoot","node","v8","openssl","platform","release","arch","cpuModels","logicalCpus"])
  if (!Object.entries(env).filter(([key])=>key!=="cpuModels"&&key!=="logicalCpus").every(([,v])=>typeof v==="string") || !Array.isArray(env.cpuModels) || !env.cpuModels.every(v=>typeof v==="string") || !boundedInteger(env.logicalCpus,100000) || raw.machineRoot!==labRoot("machine",env) || raw.reviewedSourceRoot!==raw.sourceRoot || !rootValue(raw.reviewRoot) || labRoot("budget",raw.budgets)!==labRoot("budget",{validationCases:256,benchmarkCalls:2200,matchAttempts:24,matchMethodCalls:24800,methodCalls:597656,perMatchMs:120000,overallMs:3600000,retries:0})) throw new TypeError("LAB_MANIFEST_SCHEMA")
  const { root,...payload } = raw
  if (root !== labRoot("feasibility-manifest",payload) || raw.schemaVersion !== "planner-feasibility-manifest-v1" || raw.claimClass !== "private_offline" || raw.outputDirectory !== resolve(paths.outputDirectory) || realpathSync(paths.outputDirectory) !== resolve(paths.outputDirectory) || (lstatSync(paths.outputDirectory).mode & 0o077) !== 0) throw new TypeError("LAB_MANIFEST")
  const material = buildFrozenMaterial()
  for (const [actual,expected] of [[raw.sourceRoot,material.candidate.sourceRoot],[raw.fixtureRoot,rawRoot(material.fixture.source)],[raw.corpusRoot,material.corpus.root],[raw.inventoryRoot,material.inventory.root],[raw.harnessRoot,material.harnessRoot],[raw.protocolRoot,material.protocolRoot],[raw.graphRoot,material.graph.root],[raw.executionRoot,material.executionRoot]]) if (actual !== expected) throw new TypeError("LAB_MANIFEST_DRIFT")
  if (labRoot("prepared",parseCanonical(join(paths.outputDirectory,"prepared.json"))) !== labRoot("prepared",{ manifestRoot: raw.root,sourceRoot: raw.sourceRoot,inventoryRoot: raw.inventoryRoot })) throw new TypeError("LAB_PREPARED_BINDING")
  return { manifest: raw,material }
}
export const parsePlannerArguments = (args: readonly string[]) => {
  const modes = args.filter(a => ["--prepare","--run","--verify"].includes(a))
  if (modes.length !== 1 || args.length !== 5) throw new TypeError("LAB_CLI_ARGUMENTS")
  const mode = modes[0]!.slice(2) as "prepare" | "run" | "verify"
  const flags = new Map<string,string>()
  for (let i = 0; i < args.length; i++) { if (args[i] === modes[0]) continue; if (!["--manifest","--output"].includes(args[i]!) || !args[i+1] || args[i+1]!.startsWith("--") || flags.has(args[i]!)) throw new TypeError("LAB_CLI_ARGUMENTS"); flags.set(args[i]!,args[++i]!) }
  if (!flags.has("--manifest") || !flags.has("--output")) throw new TypeError("LAB_CLI_ARGUMENTS")
  return { mode,manifestPath: resolve(flags.get("--manifest")!),outputDirectory: resolve(flags.get("--output")!) }
}

const requestForValidation = (c: PlannerValidationCase): LabKernelRequest => ({ kind: c.method,semanticTupleId: MATCH_KERNEL.tupleId,requestId: c.root,coordinates: { phaseNumber: 1,roundNumber: 1,stage: c.method === "selectActivations" ? "select_bottom" : "soldier_effect",ordinal: c.ordinal },input: c.input }) as LabKernelRequest
const classifyRuntime = (value: { ok: boolean; systemFailure?: unknown }): Classification => value.ok ? "success" : value.systemFailure ? "system_failure" : "player_violation"
const assertReviewed = (manifest: Manifest) => {
  const review = readFileSync(REVIEW,"utf8")
  // Independent reviewer owns these fields; there is no user approval token.
  if (!/^status:\s*clean\s*$/mu.test(review) || !review.includes(manifest.sourceRoot) || !review.includes(manifest.executionRoot) || rawRoot(review) !== manifest.reviewRoot) throw new TypeError("LAB_REVIEW_NOT_CLEAN_OR_BOUND")
}
const createHost = (material: ReturnType<typeof buildFrozenMaterial>,manifest: Manifest,revision: StrategyRevision,id: string,limit: number,signal: AbortSignal,observer = false,benchmarkLifetimeMs?: number) => createPlannerSupervisedRuntime({ revision,attemptRoot: labRoot("feasibility-host",{ manifestRoot: manifest.root,id }),budgetRoot: PLANNER_FEASIBILITY_PROTOCOL.budgetRoot,matchId: `phase263:${id}`,containerName: `planner-263-${manifest.root.slice(7,19)}-${id}`,ownershipLabel: `owner:planner-263-${manifest.root.slice(7,19)}-${id}`,image: LAB_ADMITTED_ROOTS.image,invocationLimit: limit,signal,...(observer ? { observerHarness: { source: material.observerSource,expectedRoot: material.harnessRoot,machineRoot: manifest.machineRoot }, ...(benchmarkLifetimeMs === undefined ? {} : { benchmarkLifetimeMs }) } : {}) })

/** Own only currently live contexts. Failed cleanup remains owned and cannot be retried or replaced. */
export const createValidationContextOwner = <T extends { close(): { cleanupComplete: boolean; orphanedChild: boolean } }>(cases: readonly { ordinal: number; context: string }[]) => {
  const last = new Map<string,number>()
  for (const c of cases) last.set(c.context,Math.max(last.get(c.context) ?? -1,c.ordinal))
  const owned = new Map<string,{ host: T; closeAttempted: boolean }>(),finished = new Set<string>()
  let clean = true
  const close = (context: string) => {
    const entry = owned.get(context)
    if (!entry || entry.closeAttempted) return
    entry.closeAttempted = true
    try {
      const result = entry.host.close()
      if (result.cleanupComplete && !result.orphanedChild) { owned.delete(context); finished.add(context) }
      else clean = false
    } catch { clean = false }
  }
  return {
    acquire(c: { ordinal: number; context: string },factory: () => T): T {
      if (!clean) throw new TypeError("LAB_VALIDATION_CLEANUP")
      if (!last.has(c.context) || finished.has(c.context)) throw new TypeError("LAB_VALIDATION_CONTEXT")
      const existing = owned.get(c.context)
      if (existing) return existing.host
      if (owned.size >= 2) throw new TypeError("LAB_VALIDATION_HOST_CAP")
      const host = factory(); owned.set(c.context,{ host,closeAttempted: false }); return host
    },
    finishCase(c: { ordinal: number; context: string }): boolean { if (last.get(c.context) === c.ordinal) close(c.context); return clean },
    closeAll(): boolean { for (const context of owned.keys()) close(context); return clean },
    get remainingOwnedContexts() { return owned.size },
  }
}

const runValidation = async (material: ReturnType<typeof buildFrozenMaterial>,manifest: Manifest,output: string,signal: AbortSignal,guard: () => void) => {
  const hosts = createValidationContextOwner<PlannerSupervisedRuntime>(material.inventory.cases),records: PlannerValidationRecord[] = []
  const evidence = new Map<number,unknown>()
  let cleanupComplete = true
  try {
    for (const c of material.inventory.cases) {
      guard()
      publish(join(output,"validation",`charge-${c.ordinal}.json`),{ manifestRoot: manifest.root,caseRoot: c.root,ordinal: c.ordinal })
      let classification: Classification = "system_failure",value: unknown = null,guestCalls = 0
      try {
        const source = c.source ?? material.candidate.source
        const sourceGate = validateStrategySource(source)
        const inputGate = (c.method === "selectActivations" ? StrategyInputV119Schema : SoldierBrainInputV119Schema).safeParse(c.input)
        if (!sourceGate.valid) classification = "source_rejection"
        else if (!inputGate.success) classification = "input_rejection"
        else {
          const revision = c.source === null ? material.candidate.revision : buildStrategyRevision({ source,runtime: material.candidate.revision.runtime })
          const host = hosts.acquire(c,() => createHost(material,manifest,revision,`v-${c.context}`,64,signal))
          if (host.identity.sourceRoot !== rawRoot(source) || host.identity.executableRoot !== `sha256:${revision.metadata.sourceArtifact!.hash}`) throw new TypeError("LAB_VALIDATION_SOURCE")
          guestCalls = 1
          publish(join(output,"validation",`dispatch-${c.ordinal}.json`),{ manifestRoot: manifest.root,ordinal: c.ordinal,caseRoot: c.root })
          const e = await host.invoke(requestForValidation(c),host.identity)
          if (!host.verify(e) || e.requestId !== c.root || e.inputRoot !== labRoot("runtime-input",c.input) || !e.charged || !e.completed) throw new TypeError("LAB_VALIDATION_RUNTIME_BINDING")
          evidence.set(c.ordinal,e); classification = classifyRuntime(e.result); value = e.result.ok ? e.result.value : null
        }
      } catch { classification = "system_failure" }
      finally { if (!hosts.finishCase(c)) cleanupComplete = false }
      records.push({ ordinal: c.ordinal,caseRoot: c.root,inputRoot: c.inputRoot,classification,guestCalls,value,provenance: "supervised_container",cleanupComplete: false })
      if (classification !== c.expected.classification || !cleanupComplete) break
    }
  } finally {
    cleanupComplete = hosts.closeAll()
    for (const record of records) { record.cleanupComplete = cleanupComplete; publish(join(output,"validation",`record-${record.ordinal}.json`),{ record,evidence: evidence.get(record.ordinal) ?? null }) }
  }
  if (records.length !== 256) return { passed: false,protocolPassed: false,empirical: true,casesCharged: records.length,guestCalls: records.reduce((n,r) => n+r.guestCalls,0),unused: 256-records.length,cleanupComplete }
  return { ...evaluatePlannerValidation(material.inventory,records),unused: 0,cleanupComplete }
}

/** Explicit schema-owned semantic fields. Operational invocation/attempt/container
 * identity remains in full private evidence, never in these comparison roots. */
export const projectPlannerSemanticState = (state: GameState) => ({ versions: state.versions,phase: state.phase,phaseNumber: state.phaseNumber,roundNumber: state.roundNumber,activationCount: state.activationCount,initialInitiativePlayerId: state.initialInitiativePlayerId ?? null,initiativePlayerId: state.initiativePlayerId,bounds: state.bounds,terrainStones: state.terrainStones,players: state.players,soldiers: state.soldiers,outcome: state.outcome ?? null })
const sequenceRoot = (domain: string,values: readonly unknown[]): LabRoot => {
  const hash = createHash("sha256").update(`cowards:planner:${domain}:${values.length}:`)
  for (const value of values) { const bytes = canonical(value); hash.update(`${bytes.length}:`); hash.update(bytes) }
  return `sha256:${hash.digest("hex")}`
}
export const derivePlannerMatchSemantic = (execution: LabMatchExecution,taskRoot: LabRoot) => execution.kind === "completed" ? {
  schemaVersion: "lab-semantic-record-v1" as const,taskRoot,
  classification: execution.accounting.some(e => !e.result.ok) ? "player_violation" as const : "success" as const,
  outcome: execution.result.state.outcome?.type === "WIN" ? execution.result.state.outcome.winnerPlayerId as "bottom" | "top" : "DRAW" as const,
  finalStateRoot: labRoot("planner-final-state",projectPlannerSemanticState(execution.result.state)),
  transitionRoot: sequenceRoot("transitions",execution.transitions.map(t => ({ transitionKind: t.transitionKind,semanticTupleId: t.semanticTupleId,coordinates: t.coordinates,classification: t.classification,events: t.events,beforeState: t.beforeState,afterState: t.afterState,terminalStatus: t.terminalStatus }))),
  runtimeAccountingRoot: sequenceRoot("runtime-accounting",execution.accounting.map(e => ({ method: e.method,inputRoot: e.inputRoot,result: e.result }))),
} : null
const executeMatchAssignment = async (a: LabAssignment,material: ReturnType<typeof buildFrozenMaterial>,manifest: Manifest,output: string,signal: AbortSignal,guard: () => void,owned: Map<string,PlannerSupervisedRuntime[]>) => {
  guard()
  const cell = buildFeasibilityAllocation()[a.attempt.ordinal]!,candidateBottom = cell.candidateSide === "bottom"
  const bottom = candidateBottom ? material.candidate.revision : material.fixture,top = candidateBottom ? material.fixture : material.candidate.revision
  const geometry = CANONICAL_ARENA_CATALOG_V1_37.arenas.find(arena => arena.id === cell.executionArenaId)!
  const started = performance.now()
  const providers: PlannerSupervisedRuntime[] = []
  owned.set(a.attempt.id,providers)
  providers.push(createHost(material,manifest,bottom,`m-${a.attempt.ordinal}-b`,24800,signal))
  providers.push(createHost(material,manifest,top,`m-${a.attempt.ordinal}-t`,24800,signal))
  let calls = 0
  const guarded = providers.map(host => ({ ...host,invoke(request: LabKernelRequest,identity: typeof host.identity) { guard(); if (++calls > 24800 || performance.now()-started >= 120000) throw new TypeError("LAB_MATCH_BOUND"); return host.invoke(request,identity) } }))
  // Alias and repeat slots use exactly the same geometry-owned Match identity,
  // seed, arena and entrant names. Physical attempt/container IDs stay external.
  const execution = await runCanonicalLabMatch({ match: { matchId: `geometry-${cell.geometryCellRoot.slice(7)}`,seed: cell.geometryCellRoot,arenaVariant: geometry,bottomPlayerId: "bottom",topPlayerId: "top",bottomStrategyRevisionId: bottom.id,topStrategyRevisionId: top.id,initialInitiativePlayerId: cell.initiativeSide,maxPhases: 100 },providers: { bottom: guarded[0]!,top: guarded[1]! } })
  owned.delete(a.attempt.id)
  const serialized = Buffer.from(JSON.stringify(execution),"utf8"),trace = publishLabTrace(join(output,"lab-matches"),serialized)
  const semantic = derivePlannerMatchSemantic(execution,a.task.id)
  const record: LabStoredRecord = { attempt: { schemaVersion: "lab-attempt-v1",attemptRoot: a.attempt.id,taskRoot: a.task.id,ordinal: a.attempt.ordinal,invocationCount: calls,...(semantic ? { classification: semantic.classification,semanticRoot: labRoot("semantic-record",semantic) } : { classification: "system_failure" as const,reason: "supervisor_failure" as const }) },semantic,operational: { schemaVersion: "lab-operational-record-v1",attemptRoot: a.attempt.id,machineRoot: manifest.machineRoot,worker: a.worker,shard: a.shard,elapsedMs: performance.now()-started,cleanup: execution.kind === "failure" && execution.failure.code === "LAB_CLEANUP_INCOMPLETE" ? "incomplete" : "complete" },trace }
  return record
}

/** Durable precharges own allocation counts, even when no normal reply exists.
 * Dispatch markers distinguish attempted calls from confirmed returned charges. */
export const readPlannerCharges = (paths: PlannerPaths, manifest: Manifest, material: ReturnType<typeof buildFrozenMaterial>, terminalize = false) => {
  let casesCharged = 0, validationGuestAttempts = 0, validationGuestCalls = 0, validationUncertainCases = 0, benchmarkCalls = 0, benchmarkGuestCalls = 0, benchmarkUncertainCalls = 0
  for (const lane of ["validation", "benchmark"] as const) {
    const cap = lane === "validation" ? 256 : 2200, dir = join(paths.outputDirectory,lane)
    for (const name of readdirSync(dir)) {
      if (name.endsWith(".tmp")) continue
      const match = /^(case|charge|dispatch|record)-(\d+)\.json$/.exec(name)
      if (!match || Number(match[2]) >= cap || String(Number(match[2])) !== match[2] || (lane === "benchmark" && match[1] !== "charge" && match[1] !== "record")) throw new TypeError("LAB_LEDGER_ARTIFACT")
    }
    let gap = false
    for (let i = 0; i < cap; i++) {
      const chargeFile = join(dir,`charge-${i}.json`),recordFile = join(dir,`record-${i}.json`),dispatchFile = join(dir,`dispatch-${i}.json`)
      if (!existsSync(chargeFile)) { gap = true; if (existsSync(recordFile) || existsSync(dispatchFile)) throw new TypeError("LAB_UNCHARGED_RECORD"); continue }
      if (gap) throw new TypeError("LAB_CHARGE_GAP")
      const c = material.inventory.cases[i]
      const method = i < 1100 ? "selectActivations" : "soldierBrain"
      const expected = lane === "validation" ? { manifestRoot: manifest.root,caseRoot: c!.root,ordinal: i } : { manifestRoot: manifest.root,ordinal: i,requestRoot: labRoot("benchmark-request", { kind: method,semanticTupleId: MATCH_KERNEL.tupleId,requestId: labRoot("benchmark-call",{ sourceRoot: manifest.sourceRoot,corpusRoot: manifest.corpusRoot,ordinal: i,method }),coordinates: { phaseNumber: 1,roundNumber: 1,stage: method === "selectActivations" ? "select_bottom" : "soldier_effect",ordinal: i },input: material.corpus[method][i%1100%100]!.input }) }
      if (labRoot("charge",parseCanonical(chargeFile)) !== labRoot("charge",expected)) throw new TypeError("LAB_CHARGE_BINDING")
      if (!existsSync(recordFile) && terminalize) publish(recordFile,lane === "validation" ? { uncertain: true,record: null,evidence: null } : { uncertain: true,evidence: null,timing: null })
      const retained = existsSync(recordFile) ? parseCanonical(recordFile) as Record<string,unknown> : null
      if (retained) {
        exact(retained,lane==="validation" ? (retained.uncertain===true ? ["uncertain","record","evidence"] : ["record","evidence"]) : (retained.uncertain===true ? ["uncertain","evidence","timing"] : ["evidence","timing"]))
        if (retained.uncertain===true && (retained.evidence!==null || (lane==="validation" ? retained.record!==null : retained.timing!==null))) throw new TypeError("LAB_UNCERTAIN_DISPOSITION")
        if (lane==="validation" && retained.uncertain!==true) {
          const record=exact(retained.record,["ordinal","caseRoot","inputRoot","classification","guestCalls","value","provenance","cleanupComplete"])
          if (record.ordinal!==i || record.caseRoot!==c!.root || record.inputRoot!==c!.inputRoot || !["success","source_rejection","input_rejection","player_violation","system_failure"].includes(String(record.classification)) || !["synthetic","supervised_container"].includes(String(record.provenance)) || typeof record.cleanupComplete!=="boolean" || !boundedInteger(record.guestCalls,1) || record.guestCalls!==Number(existsSync(dispatchFile))) throw new TypeError("LAB_VALIDATION_RECORD_SCHEMA")
        }
      }
      const evidence = retained?.evidence as { charged?: boolean } | null
      if (lane === "validation") {
        casesCharged++
        const dispatched = existsSync(dispatchFile)
        if (evidence && !dispatched) throw new TypeError("LAB_UNDISPATCHED_EVIDENCE")
        if (dispatched && labRoot("dispatch",parseCanonical(dispatchFile)) !== labRoot("dispatch",{ manifestRoot: manifest.root,ordinal: i,caseRoot: c!.root })) throw new TypeError("LAB_DISPATCH_BINDING")
        validationGuestAttempts += Number(dispatched)
        validationGuestCalls += Number(evidence?.charged === true)
        validationUncertainCases += Number(!retained || retained.uncertain === true || (dispatched && !evidence))
      } else { benchmarkCalls++; benchmarkGuestCalls += Number(evidence?.charged === true); benchmarkUncertainCalls += Number(!evidence) }
    }
  }
  return { casesCharged,casesUnused: 256-casesCharged,validationGuestAttempts,validationGuestCalls,validationUncertainCases,benchmarkCalls,benchmarkCallsUnused: 2200-benchmarkCalls,benchmarkGuestCalls,benchmarkUncertainCalls }
}
export const readPlannerChargeInventory = (paths: PlannerPaths, terminalize = false) => {
  const { manifest,material } = admitPrepared(paths)
  return readPlannerCharges(paths,manifest,material,terminalize)
}

/** Persist the allocated call even when its deadline guard prevents dispatch. */
export const allocatePlannerBenchmarkCall = (outputDirectory: string,manifestRoot: LabRoot,ordinal: number,request: LabKernelRequest,guard: () => void) => {
  publish(join(outputDirectory,"benchmark",`charge-${ordinal}.json`),{ manifestRoot,ordinal,requestRoot: labRoot("benchmark-request",request) })
  guard()
}
export const retainedBenchmarkPass = (timingPassed: boolean,retained: number,summaryPassed: boolean,cleanupComplete: boolean) => timingPassed && retained===2200 && summaryPassed && cleanupComplete
const verifyRetainedBenchmark = (paths: PlannerPaths,manifest: Manifest,material: ReturnType<typeof buildFrozenMaterial>) => {
  const durations: { selectActivations: number[]; soldierBrain: number[] } = { selectActivations: [],soldierBrain: [] }
  const transportMs:number[]=[],totalMs:number[]=[]
  const expectedAttempt = labRoot("feasibility-host",{ manifestRoot: manifest.root,id: "benchmark" })
  let retained = 0
  for (let i = 0; i < 2200; i++) {
    const file = join(paths.outputDirectory,"benchmark",`record-${i}.json`)
    if (!existsSync(file)) break
    const value = parseCanonical(file) as unknown as { evidence: import("../packages/strategy-lab/src/runtime-bridge.js").LabRuntimeEvidence; timing: import("../packages/strategy-lab/src/benchmark.js").BenchmarkObservation | null }
    if ((value as unknown as { uncertain?: boolean }).uncertain === true) { retained++; continue }
    const e = value.evidence,timing = value.timing,method = i < 1100 ? "selectActivations" : "soldierBrain",entry = material.corpus[method][i%1100%100]!
    const requestId = labRoot("benchmark-call",{ sourceRoot: manifest.sourceRoot,corpusRoot: manifest.corpusRoot,ordinal: i,method })
    const expectedRequest = { kind: method,semanticTupleId: MATCH_KERNEL.tupleId,requestId,coordinates: { phaseNumber: 1,roundNumber: 1,stage: method === "selectActivations" ? "select_bottom" : "soldier_effect",ordinal: i },input: entry.input }
    admitRetainedRuntime(e,expectedRuntimeIdentity(manifest,material.candidate.revision,"benchmark",manifest.harnessRoot),expectedRequest as LabKernelRequest,i)
    if (labRoot("retained-charge",parseCanonical(join(paths.outputDirectory,"benchmark",`charge-${i}.json`))) !== labRoot("retained-charge",{ manifestRoot: manifest.root,ordinal: i,requestRoot: labRoot("benchmark-request",expectedRequest) })) throw new TypeError("LAB_RETAINED_BENCHMARK_CHARGE")
    if (!e || e.ordinal !== i || e.method !== method || e.requestId !== requestId || e.inputRoot !== labRoot("runtime-input",entry.input) || e.identity.sourceRoot !== manifest.sourceRoot || e.identity.executableRoot !== `sha256:${material.candidate.revision.metadata.sourceArtifact!.hash}` || e.identity.harnessRoot !== manifest.harnessRoot || e.identity.attemptRoot !== expectedAttempt || e.identity.tupleId !== MATCH_KERNEL.tupleId || e.identity.runtimeLimitsRoot !== LAB_ADMITTED_ROOTS.runtimeLimitsRoot || !e.charged) throw new TypeError("LAB_RETAINED_BENCHMARK_BINDING")
    retained++
    if (!e.result.ok || !e.completed || !timing) break
    const b = timing.observation.binding
    exact(timing,["observation","runtime","totalMs","transportMs","provenance","machineRoot"])
    exact(timing.observation,["binding","durationMs","complete"])
    exact(b,["invocationRoot","sourceRoot","executableRoot","inputRoot","method","tupleId","harnessRoot","profileRoot"])
    if (timing.observation.complete!==true || !Number.isFinite(timing.totalMs) || timing.totalMs<0 || !Number.isFinite(timing.transportMs) || timing.transportMs<0 || labRoot("timing-runtime",timing.runtime)!==labRoot("timing-runtime",e)) throw new TypeError("LAB_RETAINED_TIMING_BINDING")
    if (timing.provenance !== "supervised_container" || timing.machineRoot !== manifest.machineRoot || b.invocationRoot !== e.invocationRoot || b.sourceRoot !== e.identity.sourceRoot || b.executableRoot !== e.identity.executableRoot || b.inputRoot !== e.inputRoot || b.method !== method || b.harnessRoot !== manifest.harnessRoot || b.profileRoot !== LAB_ADMITTED_ROOTS.runtimeLimitsRoot || b.tupleId !== MATCH_KERNEL.tupleId || !Number.isFinite(timing.observation.durationMs) || timing.observation.durationMs < 0 || timing.observation.durationMs > 1000) throw new TypeError("LAB_RETAINED_TIMING_BINDING")
    if (i%1100 >= 100) durations[method].push(timing.observation.durationMs)
    transportMs.push(timing.transportMs); totalMs.push(timing.totalMs)
  }
  const timing = durations.selectActivations.length === 1000 && durations.soldierBrain.length === 1000 ? evaluateFeasibilityTiming(durations) : null
  const file = join(paths.outputDirectory,"benchmark-result.json")
  let summaryPassed=false,cleanupComplete=false
  const cleanupFile=join(paths.outputDirectory,"benchmark-cleanup.json")
  if (existsSync(cleanupFile)) {
    const cleanup=exact(parseCanonical(cleanupFile),["cleanupComplete","orphanedChild"])
    if(typeof cleanup.cleanupComplete!=="boolean" || typeof cleanup.orphanedChild!=="boolean") throw new TypeError("LAB_BENCHMARK_CLEANUP_SCHEMA")
    cleanupComplete=cleanup.cleanupComplete&&!cleanup.orphanedChild
  }
  if (existsSync(file)) {
    const summary = parseCanonical(file) as unknown as { passed: boolean; charged: number; selectActivationsP99Ms?: number; soldierBrainP99Ms?: number }
    const envelope=summary as unknown as Record<string,unknown>
    exact(summary,"commitment" in envelope ? ["selectActivationsP99Ms","soldierBrainP99Ms","passed","protocolPassed","empirical","charged","measuredPerMethod","warmupsPerMethod","warmupRule","commitment","transportMs","totalMs"] : ["passed","protocolPassed","empirical","charged","cleanupComplete","reason"])
    if(typeof summary.passed!=="boolean" || typeof envelope.protocolPassed!=="boolean" || typeof envelope.empirical!=="boolean" || !boundedInteger(summary.charged,2200)) throw new TypeError("LAB_BENCHMARK_SUMMARY_SCHEMA")
    if ("commitment" in envelope) {
      const identity=expectedRuntimeIdentity(manifest,material.candidate.revision,"benchmark",manifest.harnessRoot)
      const commitment={revisionId:identity.revisionId,corpusRoot:manifest.corpusRoot,sourceRoot:manifest.sourceRoot,executableRoot:identity.executableRoot,harnessRoot:manifest.harnessRoot,profileRoot:LAB_ADMITTED_ROOTS.runtimeLimitsRoot,budgetRoot:PLANNER_FEASIBILITY_PROTOCOL.budgetRoot,attemptRoot:identity.attemptRoot,machineRoot:manifest.machineRoot}
      if(envelope.measuredPerMethod!==1000 || envelope.warmupsPerMethod!==100 || envelope.warmupRule!=="exclude-first-100-per-method-only" || labRoot("commitment",envelope.commitment)!==labRoot("commitment",commitment) || labRoot("transport",envelope.transportMs)!==labRoot("transport",transportMs) || labRoot("total",envelope.totalMs)!==labRoot("total",totalMs)) throw new TypeError("LAB_BENCHMARK_SUMMARY_DERIVATION")
    } else if(typeof envelope.cleanupComplete!=="boolean" || !["admission_rejected","incomplete_or_failed"].includes(String(envelope.reason)) || summary.passed || envelope.protocolPassed || envelope.empirical) throw new TypeError("LAB_BENCHMARK_SUMMARY_SCHEMA")
    summaryPassed=summary.passed && envelope.protocolPassed===true && envelope.empirical===true && (!("cleanupComplete" in envelope) || envelope.cleanupComplete===true)
    if (summary.charged !== retained || (summary.passed && (!timing?.passed || retained !== 2200))) throw new TypeError("LAB_RETAINED_BENCHMARK_DERIVATION")
    if (timing && summary.passed) for (const [key,val] of Object.entries(timing)) if (key !== "passed" && JSON.stringify((summary as unknown as Record<string,unknown>)[key]) !== JSON.stringify(val)) throw new TypeError("LAB_RETAINED_P99_DRIFT")
  }
  return { passed: retainedBenchmarkPass(timing?.passed===true,retained,summaryPassed,cleanupComplete),retained,cleanupComplete }
}

export const runPlannerFeasibility = async (paths: PlannerPaths) => {
  const start = performance.now(),controller = new AbortController()
  const guard = () => { if (controller.signal.aborted || performance.now()-start >= 3600000) { controller.abort(); throw new TypeError("LAB_OVERALL_DEADLINE") } }
  const { manifest,material } = admitPrepared(paths)
  assertReviewed(manifest)
  if (labRoot("machine",captureEnvironment()) !== manifest.machineRoot) throw new TypeError("LAB_MACHINE_OR_SOURCE_DRIFT")
  guard()
  publish(join(paths.outputDirectory,"consumed.json"),{ manifestRoot: manifest.root,executionRoot: manifest.executionRoot })
  const deadline = setTimeout(() => controller.abort(),Math.max(1,3600000-(performance.now()-start)))
  const owned = new Map<string,PlannerSupervisedRuntime[]>()
  const closeAttempted = new WeakSet<PlannerSupervisedRuntime>()
  let ownedCleanupComplete = true
  const closeOwned = (id: string) => {
    let complete = true
    for (const host of owned.get(id) ?? []) {
      if (closeAttempted.has(host)) { complete = false; continue }
      closeAttempted.add(host)
      try { const result = host.close(); if (!result.cleanupComplete || result.orphanedChild) complete = false }
      catch { complete = false }
    }
    if (complete) owned.delete(id)
    else ownedCleanupComplete = false
    return complete
  }
  let validation: Awaited<ReturnType<typeof runValidation>> | null = null,benchmark: Awaited<ReturnType<typeof runPlannerBenchmark>> | null = null,reason = "incomplete",passed = false
  try {
    validation = await runValidation(material,manifest,paths.outputDirectory,controller.signal,guard)
    publish(join(paths.outputDirectory,"validation-result.json"),validation)
    if (!validation.passed) throw new TypeError("LAB_VALIDATION_NON_PASS")
    guard()
    const host = createHost(material,manifest,material.candidate.revision,"benchmark",2200,controller.signal,true,Math.max(0,3600000-(performance.now()-start)))
    const commitment = { revisionId: host.identity.revisionId,corpusRoot: manifest.corpusRoot,sourceRoot: manifest.sourceRoot,executableRoot: host.identity.executableRoot,harnessRoot: manifest.harnessRoot,profileRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot,budgetRoot: PLANNER_FEASIBILITY_PROTOCOL.budgetRoot,attemptRoot: host.identity.attemptRoot,machineRoot: manifest.machineRoot }
    const provider = { ...host,close() {
      let cleanup={cleanupComplete:false,orphanedChild:true}
      try { const result=host.close(); cleanup={cleanupComplete:result.cleanupComplete,orphanedChild:result.orphanedChild}; return result }
      finally { publish(join(paths.outputDirectory,"benchmark-cleanup.json"),cleanup) }
    },invoke(request: LabKernelRequest,identity: typeof host.identity) {
      const ordinal = host.accounting.length
      allocatePlannerBenchmarkCall(paths.outputDirectory,manifest.root,ordinal,request,guard)
      try {
        const e = host.invoke(request,identity)
        publish(join(paths.outputDirectory,"benchmark",`record-${ordinal}.json`),{ evidence: e,timing: host.timing(e) ?? null })
        return e
      } catch (error) {
        const file = join(paths.outputDirectory,"benchmark",`record-${ordinal}.json`)
        if (!existsSync(file)) publish(file,{ uncertain: true,evidence: null,timing: null })
        throw error
      }
    } }
    benchmark = await runPlannerBenchmark({ provider,commitment,corpus: material.corpus })
    publish(join(paths.outputDirectory,"benchmark-result.json"),benchmark)
    if (!benchmark.passed) throw new TypeError("LAB_BENCHMARK_NON_PASS")
    const job = { kind: "supervised" as const,executionRoot: manifest.executionRoot,remainingCleanupMs: () => Math.max(0,3600000-(performance.now()-start)),execute: (a: LabAssignment) => executeMatchAssignment(a,material,manifest,paths.outputDirectory,controller.signal,guard,owned),cancel: (a: LabAssignment) => { if (!closeOwned(a.attempt.id)) throw new TypeError("LAB_CLEANUP_INCOMPLETE") } }
    const base = { directory: join(paths.outputDirectory,"lab-matches"),graph: material.graph,machineRoot: manifest.machineRoot,job }
    for (const batch of [{ ordinals: [0,1,2,3,4,5],workers: 1 as const,shardSize: 1 as const,order: "forward" as const },{ ordinals: [6,7,8,9,10,11],workers: 1 as const,shardSize: 1 as const,order: "forward" as const },{ ordinals: Array.from({ length: 12 },(_,i) => i+12),workers: 2 as const,shardSize: 3 as const,order: "reverse" as const }]) {
      guard()
      const result = await runLabTasks({ ...base,layout: { workers: batch.workers,shardSize: batch.shardSize,order: batch.order },attemptOrdinals: batch.ordinals } as Parameters<typeof runLabTasks>[0])
      if (result.records.some(r => r.attempt.classification !== "success" || r.operational.cleanup !== "complete")) throw new TypeError("LAB_MATCH_NON_PASS")
    }
    const complete = await runLabTasks({ ...base,layout: { workers: 2,shardSize: 3,order: "reverse" } })
    if (complete.dispatched !== 0 || complete.reduction?.status !== "complete") throw new TypeError("LAB_RESUME_OR_REDUCTION")
    publish(join(paths.outputDirectory,"reduction.json"),{ ...complete.reduction,semanticBytes: Buffer.from(complete.reduction.semanticBytes).toString("base64") })
    passed = true; reason = "complete"
  } catch (error) { reason = error instanceof TypeError && /^LAB_[A-Z_]+$/.test(error.message) ? error.message : "LAB_EXECUTION_NON_PASS" }
  finally { controller.abort(); clearTimeout(deadline); for (const id of owned.keys()) closeOwned(id); if (!ownedCleanupComplete) { passed = false; reason = "LAB_CLEANUP_INCOMPLETE" } }
  const inventory = resumeLabInventory(join(paths.outputDirectory,"lab-matches"),material.graph)
  const charges = readPlannerCharges(paths,manifest,material,true)
  const receipt = { schemaVersion: "planner-feasibility-receipt-v1",status: passed ? "passed" : "non_pass",empirical: true,reason,...charges,matchAttemptsCharged: inventory.records.filter(r => r.attempt.classification !== "unused").length+inventory.uncertainAttemptIds.length,matchAttemptsUnused: inventory.pendingAttemptIds.length+inventory.records.filter(r => r.attempt.classification === "unused").length,matchAttemptsUncertain: inventory.uncertainAttemptIds.length,cleanupComplete: ownedCleanupComplete && charges.validationUncertainCases === 0 && charges.benchmarkUncertainCalls === 0 && (validation?.cleanupComplete ?? true) && (benchmark === null || ("cleanupComplete" in benchmark ? benchmark.cleanupComplete : benchmark.passed)),scientificCells: 8,arenaLabels: 3,geometries: 2,elapsedMs: performance.now()-start,hostPeakRssKiB: process.resourceUsage().maxRSS,productionAuthorized: false }
  publish(join(paths.outputDirectory,"receipt.json"),receipt)
  return receipt
}

/** Read-only reproduction: it never constructs a runtime host. Private checksums
 * and regenerated expectations authenticate local retained bytes, not external attestation. */
export const verifyPlannerFeasibility = (paths: PlannerPaths) => {
  const { manifest,material } = admitPrepared(paths)
  for (const c of material.inventory.cases) if (labRoot("case-file",parseCanonical(join(paths.outputDirectory,"validation",`case-${c.ordinal}.json`))) !== labRoot("case-file",c)) throw new TypeError("LAB_CASE_DRIFT")
  if (!existsSync(join(paths.outputDirectory,"consumed.json"))) return { status: "prepared",executed: false,manifestRoot: manifest.root }
  if (labRoot("consumed",parseCanonical(join(paths.outputDirectory,"consumed.json"))) !== labRoot("consumed",{ manifestRoot: manifest.root,executionRoot: manifest.executionRoot })) throw new TypeError("LAB_CONSUMED_BINDING")
  const records: PlannerValidationRecord[] = []
  const charges = readPlannerCharges(paths,manifest,material)
  const contextOrdinals=new Map<string,number>()
  for (const c of material.inventory.cases) {
    const file = join(paths.outputDirectory,"validation",`record-${c.ordinal}.json`)
    if (!existsSync(file)) break
    const retained = parseCanonical(file) as unknown as { record: PlannerValidationRecord; evidence: { result: { ok: boolean; value?: unknown }; inputRoot: string; identity: { sourceRoot: string }; requestId: string } | null }
    const dispatched=existsSync(join(paths.outputDirectory,"validation",`dispatch-${c.ordinal}.json`))
    const ordinal=contextOrdinals.get(c.context)??0
    if(dispatched) contextOrdinals.set(c.context,ordinal+1)
    if ((retained as unknown as { uncertain?: boolean }).uncertain === true) continue
    if(retained.evidence) {
      const revision=c.source===null ? material.candidate.revision : buildStrategyRevision({source:c.source,runtime:material.candidate.revision.runtime})
      const e=admitRetainedRuntime(retained.evidence,expectedRuntimeIdentity(manifest,revision,`v-${c.context}`,rawRoot(buildLeanAuthenticatedHarnessSource(WORKER_HARNESS_SOURCE))),requestForValidation(c),ordinal)
      admitRetainedValidationResult(retained.record,e)
    } else {
      const sourceValid=validateStrategySource(c.source??material.candidate.source).valid,inputValid=(c.method==="selectActivations"?StrategyInputV119Schema:SoldierBrainInputV119Schema).safeParse(c.input).success
      const classification=!sourceValid?"source_rejection":!inputValid?"input_rejection":"system_failure"
      if(retained.record.classification!==classification || retained.record.value!==null) throw new TypeError("LAB_RETAINED_CLASSIFICATION")
    }
    if (labRoot("retained-charge",parseCanonical(join(paths.outputDirectory,"validation",`charge-${c.ordinal}.json`))) !== labRoot("retained-charge",{ manifestRoot: manifest.root,caseRoot: c.root,ordinal: c.ordinal })) throw new TypeError("LAB_RETAINED_VALIDATION_CHARGE")
    if (retained.record.guestCalls && retained.evidence && (retained.evidence.requestId !== c.root || retained.evidence.inputRoot !== labRoot("runtime-input",c.input) || retained.evidence.identity.sourceRoot !== rawRoot(c.source ?? material.candidate.source))) throw new TypeError("LAB_RETAINED_VALIDATION")
    records.push(retained.record)
  }
  const validation = records.length === 256 ? evaluatePlannerValidation(material.inventory,records) : { passed: false,casesCharged: records.length }
  const benchmark = verifyRetainedBenchmark(paths,manifest,material)
  const matches = resumeLabInventory(join(paths.outputDirectory,"lab-matches"),material.graph)
  const headerPath=join(paths.outputDirectory,"lab-matches","run-binding.json")
  if (existsSync(headerPath)) {
    if(labRoot("run-binding",parseCanonical(headerPath))!==labRoot("run-binding",{schemaVersion:"lab-run-binding-v1",graphRoot:material.graph.root,kind:"supervised",machineRoot:manifest.machineRoot,executionRoot:manifest.executionRoot})) throw new TypeError("LAB_RETAINED_RUN_BINDING")
  } else if(matches.records.length || matches.uncertainAttemptIds.length) throw new TypeError("LAB_RETAINED_RUN_BINDING")
  for (const record of matches.records) {
    if(record.operational.machineRoot!==manifest.machineRoot) throw new TypeError("LAB_RETAINED_MATCH_MACHINE")
    if (record.semantic !== null && record.trace === null) throw new TypeError("LAB_RETAINED_MATCH_TRACE")
    if (record.trace) {
      const bytes = readFileSync(join(paths.outputDirectory,"lab-matches",record.trace.id))
      if (rawRoot(bytes) !== record.trace.root || bytes.length !== record.trace.bytes) throw new TypeError("LAB_RETAINED_TRACE_HASH")
      const execution = JSON.parse(bytes.toString("utf8")) as LabMatchExecution
      exact(execution,execution.kind==="completed"?["kind","privacy","result","transitions","accounting"]:["kind","privacy","transitions","unchangedState","failure","accounting"])
      if(!["completed","failure"].includes(execution.kind) || !Array.isArray(execution.transitions) || !Array.isArray(execution.accounting)) throw new TypeError("LAB_TRACE_SCHEMA")
      if(execution.kind==="completed") exact(execution.result,["state","events"])
      if (execution.privacy !== "private_offline" || execution.transitions.some(t => t.semanticTupleId !== MATCH_KERNEL.tupleId) || labRoot("semantic-rederive",derivePlannerMatchSemantic(execution,record.attempt.taskRoot)) !== labRoot("semantic-rederive",record.semantic)) throw new TypeError("LAB_RETAINED_TRACE_SEMANTICS")
    }
  }
  const reduction = matches.records.length === 24 ? reduceLabRecords(material.graph,matches.records) : null
  if (reduction?.status === "complete") {
    const retained = parseCanonical(join(paths.outputDirectory,"reduction.json")) as unknown as { semanticRoot: string; semanticBytes: string }
    if (retained.semanticRoot !== reduction.semanticRoot || retained.semanticBytes !== Buffer.from(reduction.semanticBytes).toString("base64")) throw new TypeError("LAB_REDUCTION_DRIFT")
  }
  const receiptPath = join(paths.outputDirectory,"receipt.json")
  if (!existsSync(receiptPath)) return { status: "incomplete_non_pass",executed: false,validationCasesRetained: records.length,uncertainMatchAttempts: matches.uncertainAttemptIds.length }
  const receipt = admitPlannerReceipt(parseCanonical(receiptPath))
  const derivedCounts={...charges,matchAttemptsCharged:matches.records.filter(r=>r.attempt.classification!=="unused").length+matches.uncertainAttemptIds.length,matchAttemptsUnused:matches.pendingAttemptIds.length+matches.records.filter(r=>r.attempt.classification==="unused").length,matchAttemptsUncertain:matches.uncertainAttemptIds.length}
  if(Object.entries(derivedCounts).some(([key,value])=>receipt[key]!==value)) throw new TypeError("LAB_RECEIPT_DERIVATION")
  const retainedClean=charges.validationUncertainCases===0&&charges.benchmarkUncertainCalls===0&&matches.uncertainAttemptIds.length===0&&records.every(r=>r.cleanupComplete)&&matches.records.every(r=>r.operational.cleanup==="complete")&&(charges.benchmarkCalls===0||benchmark.cleanupComplete)
  if(receipt.cleanupComplete===true&&!retainedClean) throw new TypeError("LAB_RECEIPT_CLEANUP")
  if(receipt.status==="passed"&&(!receipt.empirical||!receipt.cleanupComplete||records.some(r=>r.provenance!=="supervised_container")||charges.validationGuestCalls!==232||charges.validationUncertainCases!==0||charges.benchmarkUncertainCalls!==0)) throw new TypeError("LAB_RECEIPT_PASS_PREDICATES")
  if (receipt.casesCharged !== charges.casesCharged || receipt.benchmarkCalls !== charges.benchmarkCalls || (receipt.status === "passed" && (!validation.passed || !benchmark.passed || reduction?.status !== "complete" || receipt.benchmarkCalls !== 2200))) throw new TypeError("LAB_RECEIPT_DERIVATION")
  return { status: receipt.status,executed: false,manifestRoot: manifest.root,validationCasesRetained: records.length,semanticRoot: reduction?.semanticRoot ?? null }
}

const main = async () => {
  const options = parsePlannerArguments(process.argv.slice(2))
  const privateRoot = resolve(REPOSITORY,".strategy-lab")
  if (!options.outputDirectory.startsWith(privateRoot+"/")) throw new TypeError("LAB_CLI_PRIVATE_ROOT")
  if (options.mode === "prepare" && !existsSync(privateRoot)) mkdirSync(privateRoot,{ mode: 0o700 })
  const result = options.mode === "prepare" ? preparePlannerFeasibility(options) : options.mode === "verify" ? verifyPlannerFeasibility(options) : await runPlannerFeasibility(options)
  // Explicit safe aggregate output; never stringify manifest/private evidence.
  process.stdout.write(JSON.stringify({ mode: options.mode,status: "status" in result ? result.status : "prepared",productionAuthorized: false })+"\n")
}
if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) void main().catch(() => { process.stderr.write("PLANNER_FEASIBILITY_FAILED\n"); process.exitCode = 1 })
