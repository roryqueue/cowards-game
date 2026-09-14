import { createHash } from "node:crypto"
import * as ts from "typescript"
import { labRoot, freezeLabValue, type LabRoot } from "../packages/strategy-lab/src/contracts.js"
import { FactoryOraclePacketSchema } from "../packages/strategy-lab/src/factory/contracts.js"
import { deriveFactoryOraclePacketRoot } from "../packages/strategy-lab/src/factory/identity.js"
import type { FactoryIngestionRecord } from "./ingest-v1-38-factory-packet.js"

export const FACTORY_CONTROL_BASES = Object.freeze({ S02: "S01", S04: "S03", S06: "S05", S07: "S01", S08: "S01", S09: "S03", S10: "S03", S11: "S05", S12: "S05" } as const)
export type FactoryControlSlot = keyof typeof FACTORY_CONTROL_BASES
const expectedOrigins = { S01: "tactical-oracle", S03: "teacher-oracle", S05: "model-oracle" } as const
const expectedProducers = { S01: "emitTacticalFactoryPacket", S03: "emitTeacherFactoryPacket", S05: "emitModelFactoryPacket" } as const
const fail = (code: string): never => { throw new TypeError(`FACTORY_CONTROL_${code}`) }
const hash = (source: string): LabRoot => `sha256:${createHash("sha256").update(source).digest("hex")}`

/** Only parses and rewrites text. No generated code is imported, evaluated or run. */
const transform = (slot: FactoryControlSlot, source: string): string => {
  if (slot === "S02" || slot === "S09") return `${source}\n// factory-calibration:${slot}:comment-only\n`
  const ast = ts.createSourceFile("control-input.ts", source, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS)
  if (ts.transpileModule(source, { reportDiagnostics: true }).diagnostics?.some((entry) => entry.category === ts.DiagnosticCategory.Error)) return fail("SYNTAX")
  const defaults = ast.statements.filter((node): node is ts.ExportAssignment => ts.isExportAssignment(node) && !node.isExportEquals)
  if (defaults.length !== 1 || /\bfactoryCalibration(?:Base|Map|Guard)\b/u.test(source)) return fail("EXPORT")
  const statement = defaults[0]!
  const prefix = source.slice(0, statement.getStart(ast)) + `const factoryCalibrationBase = ${statement.expression.getText(ast)};` + source.slice(statement.end)
  // The opaque mapping is an involution. It is applied twice BEFORE entrypoint
  // delegation; this is an identity control, not an invariance/robustness claim.
  const map = slot === "S06" ? `
const factoryCalibrationMap = (value, key = "") => {
  if (typeof value === "string" && (key === "id" || key === "soldierId")) return value.startsWith("opaque:") ? value.slice(7) : "opaque:" + value;
  if (Array.isArray(value)) return value.map(item => factoryCalibrationMap(item, key));
  if (value !== null && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([name, item]) => [name, key === "position" && (name === "x" || name === "y") && typeof item === "number" ? 11 - item : factoryCalibrationMap(item, name)]));
  return value;
};
` : ""
  const input = slot === "S06" ? "factoryCalibrationMap(factoryCalibrationMap(input))" : "input"
  const guard = slot === "S11" || slot === "S12" ? `\nconst factoryCalibrationGuard = ${slot === "S11" ? 0 : 1};\n` : ""
  const condition = slot === "S07" || slot === "S10" ? "input.self.position !== null && input.self.position.x === 2" : slot === "S08" ? "true" : slot === "S11" || slot === "S12" ? "factoryCalibrationGuard === 1" : "false"
  return `${prefix}\n${map}${guard}export default {
  selectActivations(input) { return factoryCalibrationBase.selectActivations(${input}); },
  soldierBrain(input) { const result = factoryCalibrationBase.soldierBrain(${input}); return ${condition} ? { ...result, action: { type: "TURN_TO_STONE" } } : result; }
};\n`
}

export const deriveFactoryControl = (slot: FactoryControlSlot, baseIngestionArtifactRoot: LabRoot, base: FactoryIngestionRecord) => {
  if (!Object.hasOwn(FACTORY_CONTROL_BASES, slot)) return fail("SLOT")
  const baseSlot = FACTORY_CONTROL_BASES[slot]
  if (base.evidenceClass !== "real_producer" || base.origin !== expectedOrigins[baseSlot] || base.producerIdentity !== expectedProducers[baseSlot] || base.packet.split !== "development") return fail("BASE")
  const source = transform(slot, base.sourceUtf8)
  const proofValue = { schemaVersion: "factory-control-proof-v1" as const, slot, baseSlot, baseIngestionArtifactRoot, basePacketRoot: base.packetRoot, baseSourceRoot: base.sourceRoot, baseProducerIdentity: base.producerIdentity, baseOrigin: base.origin, evidenceClass: "calibration_only" as const, transformVersion: "factory-control-transform-v1", claim: slot === "S06" ? "identity-roundtrip-only" : "prescribed-source-control", sourceRoot: hash(source) }
  const proof = { ...proofValue, root: labRoot("factory-control-proof-v1", proofValue) }
  const provider = { providerId: "factory-calibration-control", modelId: "local-source-transform", modelVersion: "v1", settingsRoot: proof.root, promptRoot: base.packet.provider.promptRoot, contextRoot: base.packet.provider.contextRoot }
  const draft = { ...base.packet, oracleFamily: "calibration-control", doctrineFamily: `calibration-${slot.toLowerCase()}`, provider, source: { root: hash(source), sha256: hash(source), byteLength: new TextEncoder().encode(source).byteLength, encoding: "utf8" as const }, nativeLane: { ...base.packet.nativeLane, providerId: provider.providerId }, lineage: { predecessorRoot: base.packetRoot, correctionRoot: null, retryParentRoot: null } }
  const packet = FactoryOraclePacketSchema.parse({ ...draft, root: deriveFactoryOraclePacketRoot(draft) })
  return freezeLabValue({ source, packet, proof })
}
