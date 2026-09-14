import { describe, expect, it } from "vitest"
import { decideFactoryIndependence } from "./assess-v1-38-factory-independence.js"
import { NUMERIC_DIMENSIONS, type NumericComparison, type NumericControlTable } from "../packages/strategy-lab/src/factory/numeric-calibration.js"
const score = (n: number): NumericComparison => ({ dimensions: Object.fromEntries(NUMERIC_DIMENSIONS.map((key) => [key, {score:n,informativeCount:4}])) as NumericComparison["dimensions"], informativeDimensions:6, weightedMean:n })
const controls: NumericControlTable = { "S01/S02":score(.9), "S03/S04":score(.95), "S05/S06":score(.9), "S01/S07":score(.7), "S01/S08":score(.3), "S11/S12":score(.7) }
const edges = {"S01/S03":score(.1),"S01/S05":score(.2),"S03/S05":score(.25)}
describe("finite factory independence decision", () => {
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
})
