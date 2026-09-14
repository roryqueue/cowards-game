import { describe, expect, it } from "vitest"
import { factoryOraclePacketFixture } from "../packages/strategy-lab/src/factory/contracts.js"
import { deriveFactoryControl } from "./v1-38-factory-controls.js"

const source = "export default { selectActivations(input) { return input; }, soldierBrain(input) { return {action:{type:'MOVE'},soldierMemory:input.soldierMemory}; } };"
const base = (origin = "tactical-oracle") => ({ producerIdentity: origin === "tactical-oracle" ? "emitTacticalFactoryPacket" : origin === "teacher-oracle" ? "emitTeacherFactoryPacket" : "emitModelFactoryPacket", origin, evidenceClass: "real_producer", sourceUtf8: source, packet: { ...factoryOraclePacketFixture(), split: "development" }, packetRoot: factoryOraclePacketFixture().root, sourceRoot: factoryOraclePacketFixture().source.root }) as never
const artifactRoot = `sha256:${"a".repeat(64)}` as const

describe("inert, source-backed calibration controls", () => {
  it("binds exact comment bytes, parent, recipe and calibration-only authorship", () => {
    const result = deriveFactoryControl("S02", artifactRoot, base())
    expect(result.source).toBe(`${source}\n// factory-calibration:S02:comment-only\n`)
    expect(result.proof).toMatchObject({ slot: "S02", baseSlot: "S01", baseIngestionArtifactRoot: artifactRoot, baseProducerIdentity: "emitTacticalFactoryPacket", evidenceClass: "calibration_only" })
    expect(result.packet.oracleFamily).toBe("calibration-control")
    expect(result.packet.provider.providerId).toBe("factory-calibration-control")
    expect(deriveFactoryControl("S02", artifactRoot, base()).packet.root).toBe(result.packet.root)
  })
  it("rejects relabeled bases, control-on-control parents and base-slot recipes", () => {
    expect(() => deriveFactoryControl("S04", artifactRoot, base())).toThrow("BASE")
    expect(() => deriveFactoryControl("S01" as never, artifactRoot, base())).toThrow("SLOT")
    expect(() => deriveFactoryControl("S02", artifactRoot, { ...base() as object, evidenceClass: "calibration_only" } as never)).toThrow("BASE")
  })
  it("preserves activation delegation and memory while changing only the selected brain action", () => {
    const x2 = deriveFactoryControl("S07", artifactRoot, base()).source
    expect(x2).toContain("input.self.position !== null && input.self.position.x === 2")
    expect(x2).toContain("...result, action: { type: \"TURN_TO_STONE\" }")
    expect(x2).toContain(".selectActivations(input)")
    const off = deriveFactoryControl("S11", artifactRoot, base("model-oracle")).source
    const on = deriveFactoryControl("S12", artifactRoot, base("model-oracle")).source
    expect(on).toBe(off.replace("const factoryCalibrationGuard = 0", "const factoryCalibrationGuard = 1"))
  })
  it("roundtrips the exact opaque-id/geometry mapping before the unchanged base entrypoint", () => {
    const result = deriveFactoryControl("S06", artifactRoot, base("model-oracle"))
    expect(result.source).toContain("factoryCalibrationMap(factoryCalibrationMap(input))")
    expect(result.proof.claim).toBe("identity-roundtrip-only")
  })
})
