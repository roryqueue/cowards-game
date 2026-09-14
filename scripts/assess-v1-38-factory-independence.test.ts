import { mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { decideFactoryIndependence, factoryWorkloadResourceViolations, readRetainedFactoryLedger, verifyRetainedFactoryAssessment } from "./assess-v1-38-factory-independence.js"
import { NUMERIC_DIMENSIONS, type NumericComparison, type NumericControlTable } from "../packages/strategy-lab/src/factory/numeric-calibration.js"
import { createFactoryRepository, recordFactoryAttemptStart, publishFactoryAttemptTerminal, resumeFactoryAttemptInventory } from "../packages/strategy-lab/src/factory/repository.js"
import { createFactoryAttemptStart, createFactoryAttemptTerminal } from "../packages/strategy-lab/src/factory/ledger.js"
import { labRoot } from "../packages/strategy-lab/src/contracts.js"
const directories:string[]=[]
afterEach(() => { for(const directory of directories.splice(0)) rmSync(directory,{recursive:true,force:true}) })
const store=()=>{const directory=realpathSync(mkdtempSync(join(tmpdir(),"factory-assessor-test-")));directories.push(directory);return createFactoryRepository(directory)}
const score = (n: number): NumericComparison => ({ dimensions: Object.fromEntries(NUMERIC_DIMENSIONS.map((key) => [key, {score:n,informativeCount:4}])) as NumericComparison["dimensions"], informativeDimensions:6, weightedMean:n })
const controls: NumericControlTable = { "S01/S02":score(.9), "S03/S04":score(.95), "S05/S06":score(.9), "S01/S07":score(.7), "S01/S08":score(.3), "S11/S12":score(.7) }
const edges = {"S01/S03":score(.1),"S01/S05":score(.2),"S03/S05":score(.25)}
describe("finite factory independence decision", () => {
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
