import { mkdtempSync, realpathSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { admitCanonicalJsonValue } from "@cowards/spec"
import { labRoot } from "../packages/strategy-lab/src/contracts.js"
import { createFactoryRepository, publishFactoryArtifact } from "../packages/strategy-lab/src/factory/repository.js"
import { factoryAssessmentImplementationManifest } from "./v1-38-factory-implementation.js"
import { correctedFactoryExecutionImplementationRoot, factoryAssessmentCorrectionDiff, readFactoryAssessmentCorrection } from "./v1-38-factory-assessment-correction.js"

const directories:string[]=[]
afterEach(()=>{for(const dir of directories.splice(0))rmSync(dir,{recursive:true,force:true})})
const fixture=()=>{
  const directory=realpathSync(mkdtempSync(join(tmpdir(),"factory-correction-test-")));directories.push(directory)
  const repository=createFactoryRepository(directory)
  const publish=(value:unknown)=>{const encoded=admitCanonicalJsonValue(value,{profile:"canonical-manifest"});if(!encoded.ok)throw Error("fixture-canonical");return publishFactoryArtifact(repository,encoded.canonicalBytes)}
  const rooted=(schemaVersion:string,value:Record<string,unknown>)=>{const body={schemaVersion,...value};return publish({...body,root:labRoot(schemaVersion,body)})}
  const current=factoryAssessmentImplementationManifest(), oldEntries=current.entries.map(entry=>entry.path==="scripts/assess-v1-38-factory-independence.ts"?{...entry,root:labRoot("fixture","old-assessor")}:entry)
  const historical={entries:oldEntries,root:labRoot("factory-reviewed-implementation-v2",oldEntries)}
  const review=(sourceCommit:string,implementationRoot:string,extra:Record<string,unknown>={})=>rooted("factory-source-review-v1",{sourceCommit,implementationRoot,reviewerId:"reviewer",authorIds:["author"],status:"passed",unresolvedFindings:0,reportArtifactRoot:publishFactoryArtifact(repository,new TextEncoder().encode(`${sourceCommit}\n${implementationRoot}`)),...extra})
  const oldReview=review("a".repeat(40),historical.root), newReview=review("b".repeat(40),current.root)
  const execution=rooted("factory-calibration-execution-evidence-v1",{sourceCommit:"a".repeat(40),sourceReviewArtifactRoot:oldReview})
  const input={executionEvidenceArtifactRoot:execution,windowTerminalArtifactRoot:null}
  const failureBody={sourceCommit:"a".repeat(40),implementationRoot:historical.root,input,error:"LAB_CANONICAL_VALUE",stage:"positive-control-merged-observation-equality",assessmentArtifactRoot:null,thresholdArtifactRoot:null}
  const body={reason:"positive-control-observation-equality-envelope",executionEvidenceArtifactRoot:execution,historicalManifestArtifactRoot:publish(historical),assessorReviewArtifactRoot:newReview,failureArtifactRoot:rooted("factory-264-assessment-failure-v1",failureBody),inputRoot:labRoot("factory-assessment-correction-input-v1",input)}
  const correction=(extra:Record<string,unknown>={})=>rooted("factory-assessment-correction-v1",{...body,...extra})
  return {repository,publish,rooted,review,current,historical,execution,input,failureBody,body,correction}
}
describe("read-only assessment correction binding",()=>{
  it("permits only explicitly reviewed reader deltas and rejects gameplay, generator, token or threshold changes",()=>{
    const entry=(path:string,version:string)=>({path,root:labRoot("fixture",version)})
    const reader="scripts/assess-v1-38-factory-independence.ts"
    expect(factoryAssessmentCorrectionDiff([entry(reader,"old")],[entry(reader,"new")])).toEqual([reader])
    for(const path of ["packages/engine/src/index.ts","scripts/v1-38-factory-controls.ts","scripts/v1-38-factory-observations.ts","packages/strategy-lab/src/factory/numeric-calibration.ts","scripts/run-v1-38-factory-calibration.ts"])
      expect(()=>factoryAssessmentCorrectionDiff([entry(path,"old")],[entry(path,"new")])).toThrow("EXECUTION_SOURCE_CHANGED")
    expect(()=>factoryAssessmentCorrectionDiff([entry(reader,"old")],[entry(reader,"old")])).toThrow()
    expect(()=>factoryAssessmentCorrectionDiff([entry(reader,"old"),entry(reader,"old")],[entry(reader,"new")])).toThrow("MANIFEST")
    const numeric="packages/strategy-lab/src/factory/numeric-calibration.ts"
    expect(factoryAssessmentCorrectionDiff([entry(numeric,"old")],[entry(numeric,"new")],true)).toEqual([numeric])
    expect(()=>factoryAssessmentCorrectionDiff([entry("scripts/v1-38-factory-observations.ts","old")],[entry("scripts/v1-38-factory-observations.ts","new")],true)).toThrow("EXECUTION_SOURCE_CHANGED")
  })
  it("issues a source- and input-bound context without mutating the old evidence",()=>{
    const f=fixture(), root=f.correction(), context=readFactoryAssessmentCorrection(f.repository,root,f.input)
    expect(correctedFactoryExecutionImplementationRoot(context,f.repository,f.execution,f.current.root)).toBe(f.historical.root)
    expect(Object.isFrozen(context)).toBe(true)
    expect(()=>correctedFactoryExecutionImplementationRoot({...context},f.repository,f.execution,f.current.root)).toThrow("CONTEXT")
    expect(()=>correctedFactoryExecutionImplementationRoot(context,{...f.repository,directory:"/elsewhere"},f.execution,f.current.root)).toThrow("CONTEXT")
    expect(()=>correctedFactoryExecutionImplementationRoot(context,f.repository,labRoot("fixture","other"),f.current.root)).toThrow("CONTEXT")
    expect(()=>correctedFactoryExecutionImplementationRoot(context,f.repository,f.execution,labRoot("fixture","newer-source"))).toThrow("CONTEXT")
    expect(()=>readFactoryAssessmentCorrection(f.repository,root,{...f.input,windowTerminalArtifactRoot:"other"})).toThrow("BINDING")
  })
  it("rejects rerooted historical manifests, stale or self reviews and rewritten failure results",()=>{
    const f=fixture()
    const badManifest=f.publish({...f.historical,root:labRoot("fixture","fake")})
    expect(()=>readFactoryAssessmentCorrection(f.repository,f.correction({historicalManifestArtifactRoot:badManifest}),f.input)).toThrow("HISTORICAL_MANIFEST")
    for(const extra of [{implementationRoot:f.historical.root},{reviewerId:"author"},{unresolvedFindings:1}]){
      const review=f.review("b".repeat(40),f.current.root,extra)
      expect(()=>readFactoryAssessmentCorrection(f.repository,f.correction({assessorReviewArtifactRoot:review}),f.input)).toThrow()
    }
    for(const extra of [{assessmentArtifactRoot:labRoot("fixture","already-assessed")},{error:"different-failure"},{input:{changed:true}}]){
      const failure=f.rooted("factory-264-assessment-failure-v1",{...f.failureBody,...extra})
      expect(()=>readFactoryAssessmentCorrection(f.repository,f.correction({failureArtifactRoot:failure}),f.input)).toThrow("ORIGINAL_FAILURE")
    }
  })
  it("requires immutable first-correction failure and its original reviewed source for the token-domain repair",()=>{
    const f=fixture(), previous=f.correction()
    const failureBody={originalFailureArtifactRoot:f.body.failureArtifactRoot,correctionArtifactRoot:previous,sourceCommit:"b".repeat(40),implementationRoot:f.current.root,error:"NUMERIC_CALIBRATION_EVIDENCE",stage:"source-structure-token-domain",assessmentArtifactRoot:null,thresholdArtifactRoot:null,extraMatches:0,metricOrThresholdChanged:false}
    const failure=f.rooted("factory-264-assessment-correction-failure-v1",failureBody)
    const root=f.correction({reason:"positive-control-map-and-source-token-envelope",priorCorrectionFailureArtifactRoot:failure})
    expect(readFactoryAssessmentCorrection(f.repository,root,f.input).artifactRoot).toBe(root)
    for(const extra of [{extraMatches:1},{sourceCommit:"c".repeat(40)},{originalFailureArtifactRoot:labRoot("fixture","other")}]){
      const bad=f.rooted("factory-264-assessment-correction-failure-v1",{...failureBody,...extra})
      expect(()=>readFactoryAssessmentCorrection(f.repository,f.correction({reason:"positive-control-map-and-source-token-envelope",priorCorrectionFailureArtifactRoot:bad}),f.input)).toThrow()
    }
  })
})
