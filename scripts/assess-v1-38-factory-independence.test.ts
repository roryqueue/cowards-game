import { mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { assessFactoryIndependence, decideFactoryIndependence, factoryWorkloadResourceViolations, readRetainedFactoryLedger, verifyRetainedFactoryAssessment, verifyHistoricalFactoryAssessmentForLeague } from "./assess-v1-38-factory-independence.js"
import { readFactoryCanonicalRecord } from "./v1-38-factory-fresh-evidence.js"
import { NUMERIC_DIMENSIONS, type NumericComparison, type NumericControlTable } from "../packages/strategy-lab/src/factory/numeric-calibration.js"
import { createFactoryRepository, recordFactoryAttemptStart, publishFactoryAttemptTerminal, publishFactoryArtifact, resumeFactoryAttemptInventory } from "../packages/strategy-lab/src/factory/repository.js"
import { createFactoryAttemptStart, createFactoryAttemptTerminal } from "../packages/strategy-lab/src/factory/ledger.js"
import { LAB_ADMITTED_ROOTS, labRoot, type LabRoot } from "../packages/strategy-lab/src/contracts.js"
import { admitCanonicalJsonValue } from "@cowards/spec"
import { createFactoryExecutionEvidenceFixture } from "./fixtures/factory-execution-evidence-fixture.js"
import { createFactoryAuthoringAllocation, type FactorySourceSlot } from "./v1-38-factory-allocation.js"
import { FACTORY_CONTROL_BASES, type FactoryControlSlot } from "./v1-38-factory-controls.js"
import { ingestNamedFactoryPacket } from "./ingest-v1-38-factory-packet.js"
import { prepareFreshFactoryCalibration } from "./prepare-v1-38-factory-calibration.js"
import { deriveFixedMechanicsOpponentIdentityRoot } from "./run-v1-38-factory-calibration.js"
import { factoryAssessmentImplementationManifest } from "./v1-38-factory-implementation.js"
const directories:string[]=[]
afterEach(() => { for(const directory of directories.splice(0)) rmSync(directory,{recursive:true,force:true}) })
const store=()=>{const directory=realpathSync(mkdtempSync(join(tmpdir(),"factory-assessor-test-")));directories.push(directory);return createFactoryRepository(directory)}
const score = (n: number): NumericComparison => ({ dimensions: Object.fromEntries(NUMERIC_DIMENSIONS.map((key) => [key, {score:n,informativeCount:4}])) as NumericComparison["dimensions"], informativeDimensions:6, weightedMean:n })
const controls: NumericControlTable = { "S01/S02":score(.9), "S03/S04":score(.95), "S05/S06":score(.9), "S01/S07":score(.7), "S01/S08":score(.3), "S11/S12":score(.7) }
const edges = {"S01/S03":score(.1),"S01/S05":score(.2),"S03/S05":score(.25)}
describe("finite factory independence decision", () => {
  it("reopens a full source-bound but unrun allocation as unresolved, without inventing cells",async()=>{
    const fixture=await createFactoryExecutionEvidenceFixture();directories.push(fixture.repository.directory)
    const {repository}=fixture
    const publish=(value:unknown)=>{const encoded=admitCanonicalJsonValue(value,{profile:"canonical-manifest"});if(!encoded.ok)throw Error("canonical");return publishFactoryArtifact(repository,encoded.canonicalBytes)}
    const slots={} as Record<FactorySourceSlot,LabRoot>
    for(const slot of ["S01","S03","S05"] as const)slots[slot]=publish(fixture.fresh.ingestions[slot])
    for(const slot of Object.keys(FACTORY_CONTROL_BASES) as FactoryControlSlot[]) {
      const result=await ingestNamedFactoryPacket({producerIdentity:"materializeFactoryCalibrationControl",origin:"calibration-control",evidenceClass:"calibration_only",producerInput:{slot,baseIngestionArtifactRoot:slots[FACTORY_CONTROL_BASES[slot]]}},repository)
      if(result.disposition!=="accepted")throw Error("control");slots[slot]=result.artifactRoot
    }
    const protocolBody={schemaVersion:"factory-calibration-protocol-v1",phase:"264",purpose:"development-independence-calibration",split:"development"}
    const protocol={...protocolBody,root:labRoot("factory-calibration-protocol-v1",protocolBody)}
    const prepared=prepareFreshFactoryCalibration({allocation:createFactoryAuthoringAllocation(),slotIngestionArtifactRoots:slots,protocolRoot:protocol.root,protocolArtifactRoot:publish(protocol),studyPolicyRoot:"sha256:e004fed152f38ab7ac5570c7df6c95b59025244f821698eb504263494b9d5a17",measurementPolicyRoot:"sha256:7c0df85ac1dc0f983619fb93066c70ee4cd7eab727e730e8a25bb3f61b9a8e95",opponentIdentityRoot:deriveFixedMechanicsOpponentIdentityRoot(),supervision:{adapterId:"runtime-js-container-subprocess",runtimeAbi:"strategy-runtime-abi-v1.19",image:LAB_ADMITTED_ROOTS.image,runtimeProfileRoot:LAB_ADMITTED_ROOTS.runtimeLimitsRoot}},repository)
    const execution={...fixture.values.executionValue,manifestRoot:prepared.manifest.root}
    const executionEvidenceArtifactRoot=publish({...execution,root:labRoot("factory-calibration-execution-evidence-v1",execution)})
    const input={manifestArtifactRoot:prepared.artifactRoot,executionEvidenceArtifactRoot,ledgerRoot:readRetainedFactoryLedger(repository).ledgerRoot,terminalRoots:[],supervisionArtifactRoots:[],pairingArtifactRoots:[],candidateArtifactRoots:[]}
    const result=assessFactoryIndependence(repository,input)
    expect(result.status).toBe("unresolved");expect(result.reasons).toContain("incomplete_48_cells");expect(result.thresholdArtifactRoot).toBe(null)
    expect(verifyRetainedFactoryAssessment(repository,result.assessmentArtifactRoot!)).toMatchObject({status:"unresolved",assessmentRoot:result.assessmentRoot})
    expect(()=>assessFactoryIndependence(repository,{...input,terminalRoots:[labRoot("fixture","invented")]})).toThrow("TERMINAL_ROOTS")
    // Reopen an explicitly versioned reader correction against immutable old
    // execution evidence. The ordinary (fresh-run) source guard remains strict.
    const current=factoryAssessmentImplementationManifest()
    const oldEntries=current.entries.map(entry=>entry.path==="scripts/assess-v1-38-factory-independence.ts"?{...entry,root:labRoot("fixture","old-reader")}:entry)
    const historical={entries:oldEntries,root:labRoot("factory-reviewed-implementation-v2",oldEntries)}
    const rooted=(schemaVersion:string,value:Record<string,unknown>)=>{const body={schemaVersion,...value};return publish({...body,root:labRoot(schemaVersion,body)})}
    const oldReview=rooted("factory-source-review-v1",{...fixture.values.reviewValue,implementationRoot:historical.root})
    const oldExecution=rooted("factory-calibration-execution-evidence-v1",{...execution,sourceReviewArtifactRoot:oldReview})
    const savedAssessment = readFactoryCanonicalRecord(repository, result.assessmentArtifactRoot!)
    const { root: _savedRoot, ...savedBody } = savedAssessment
    const historicalAssessmentBody = { ...savedBody, implementationRoot: historical.root, executionEvidenceRoot: readFactoryCanonicalRecord(repository, oldExecution).root, input: { ...input, executionEvidenceArtifactRoot: oldExecution, windowTerminalArtifactRoot: null } }
    const historicalAssessment = publish({ ...historicalAssessmentBody, root: labRoot("factory-independence-assessment-v1", historicalAssessmentBody) })
    expect(() => verifyRetainedFactoryAssessment(repository, historicalAssessment)).toThrow("FACTORY_EXECUTION_REVIEW")
    expect(verifyHistoricalFactoryAssessmentForLeague(repository, historicalAssessment)).toMatchObject({ issued: false, status: "unresolved", historicalProducerImplementationRoot: historical.root, historicalAssessmentImplementationRoot: historical.root, currentReaderImplementationRoot: current.root })
    const changedDecision = { ...historicalAssessmentBody, status: "affirmed", reasons: [] }
    expect(() => verifyHistoricalFactoryAssessmentForLeague(repository, publish({ ...changedDecision, root: labRoot("factory-independence-assessment-v1", changedDecision) }))).toThrow("IMPORT_ASSESSMENT_REOPEN")
    const changedMetric = { ...historicalAssessmentBody, completePairs: 24 }
    expect(() => verifyHistoricalFactoryAssessmentForLeague(repository, publish({ ...changedMetric, root: labRoot("factory-independence-assessment-v1", changedMetric) }))).toThrow("IMPORT_ASSESSMENT_REOPEN")
    const correctedInput={...input,executionEvidenceArtifactRoot:oldExecution,windowTerminalArtifactRoot:null}
    const currentReview=rooted("factory-source-review-v1",{...fixture.values.reviewValue,sourceCommit:"b".repeat(40),implementationRoot:current.root,reportArtifactRoot:publishFactoryArtifact(repository,new TextEncoder().encode(`${"b".repeat(40)}\n${current.root}`))})
    const failure=rooted("factory-264-assessment-failure-v1",{sourceCommit:execution.sourceCommit,implementationRoot:historical.root,input:correctedInput,error:"LAB_CANONICAL_VALUE",stage:"positive-control-merged-observation-equality",assessmentArtifactRoot:null,thresholdArtifactRoot:null})
    const correction=rooted("factory-assessment-correction-v1",{reason:"positive-control-observation-equality-envelope",executionEvidenceArtifactRoot:oldExecution,historicalManifestArtifactRoot:publish(historical),assessorReviewArtifactRoot:currentReview,failureArtifactRoot:failure,inputRoot:labRoot("factory-assessment-correction-input-v1",correctedInput)})
    expect(()=>assessFactoryIndependence(repository,correctedInput)).toThrow("FACTORY_EXECUTION_REVIEW")
    const corrected=assessFactoryIndependence(repository,correctedInput,{correctionArtifactRoot:correction})
    expect(corrected.status).toBe("unresolved")
    expect(corrected.reasons).toContain("incomplete_48_cells")
    expect(corrected.thresholdArtifactRoot).toBe(null)
    expect(verifyRetainedFactoryAssessment(repository,corrected.assessmentArtifactRoot!)).toMatchObject({status:"unresolved",assessmentRoot:corrected.assessmentRoot})
  },60000)
  it("rejects actual per-cell overruns even within the outer window",()=>{
    expect(factoryWorkloadResourceViolations(1000,121000,256,120000)).toEqual([])
    expect(factoryWorkloadResourceViolations(1000,121001,256,120000)).toContain("lifetime_exceeded")
    expect(factoryWorkloadResourceViolations(1000,2000,257,120000)).toContain("invocations_exceeded")
  })
  it("affirms only complete controls and all three distinct base edges", () => {
    expect(decideFactoryIndependence(controls,edges,[],0)).toMatchObject({status:"affirmed",reasons:[]})
  })
  it("keeps missing evidence, sharing, correlated bases and incorrect controls unresolved", () => {
    expect(decideFactoryIndependence(controls,edges,["missing_model_authorship"],0).status).toBe("unresolved")
    expect(decideFactoryIndependence(controls,edges,[],1).status).toBe("unresolved")
    expect(decideFactoryIndependence(controls,{...edges,"S01/S03":score(.95)},[],0).status).toBe("unresolved")
    expect(decideFactoryIndependence({...controls,"S01/S08":score(.9)},edges,[],0).status).toBe("unresolved")
    expect(decideFactoryIndependence(controls,{} as never,[],0).status).toBe("unresolved")
  })
  it("reopens real canonical ledger records without recovery or execution", () => {
    const repository=store(), root=labRoot("fixture","fixture")
    const start=createFactoryAttemptStart({taskRoot:root,budgetRoot:root,candidateRoot:root,authoringMechanism:"automated-oracle",inputRoot:root,resourceAccountingRoot:root,retryParentRoot:null})
    recordFactoryAttemptStart(repository,start)
    expect(()=>readRetainedFactoryLedger(repository)).toThrow("UNCERTAIN_START")
    const terminal=createFactoryAttemptTerminal({startRoot:start.root,disposition:"system_failure",outputRoot:null,validationRoot:root,duplicateEvidenceRoot:root,finalEvidenceRoot:root})
    publishFactoryAttemptTerminal(repository,start,terminal)
    expect(readRetainedFactoryLedger(repository)).toEqual({entries:[{start,terminal}],ledgerRoot:resumeFactoryAttemptInventory(repository).ledgerRoot})
    writeFileSync(join(repository.directory,`factory-attempt-${start.root.slice(7)}.terminal.json`),JSON.stringify({...terminal,disposition:"accepted"}))
    expect(()=>readRetainedFactoryLedger(repository)).toThrow()
  })
  it("fails read-only reopening of a missing assessment instead of accepting a root label", () => {
    expect(()=>verifyRetainedFactoryAssessment(store(),labRoot("fixture","absent"))).toThrow()
  })
})
