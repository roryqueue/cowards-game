import { createHash } from "node:crypto"
import { deriveFactoryOraclePacketRoot, FactoryOraclePacketSchema, type FactoryOraclePacket } from "../../strategy-lab/src/factory/packet.js"
import { admitTacticalAdaptationProfile, type TacticalAdaptationProfile } from "./adaptation.js"
import { assertTacticalSourceClosure, emitTacticalFactoryPacket, emitTacticalSource, type TacticalFactoryRequest } from "./emit.js"
import { compileProfiledTacticalTemplate } from "./profiled-template.js"

const sourceRoot = (source: string) => `sha256:${createHash("sha256").update(source, "utf8").digest("hex")}` as const
export const emitProfiledTacticalSource = (profile: TacticalAdaptationProfile): string => {
  const historical = emitTacticalSource()
  const marker = "export default { selectActivations(input)"
  const suffix = historical.lastIndexOf(marker)
  if (suffix < 0 || historical.indexOf(marker) !== suffix) throw new TypeError("TACTICAL_PROFILED_SOURCE_MARKER")
  const output = `${historical.slice(0, suffix)}${compileProfiledTacticalTemplate(profile)}`
  assertTacticalSourceClosure(output)
  return output
}
/** Emits a prospective controller with profile constants; it cannot affect legacy emitter bytes. */
export const emitProfiledTacticalFactoryPacket = (input: Readonly<{ request: TacticalFactoryRequest; profile: TacticalAdaptationProfile }>): FactoryOraclePacket => {
  const profile = admitTacticalAdaptationProfile(input.profile), legacy = emitTacticalFactoryPacket(input.request), sourceUtf8 = emitProfiledTacticalSource(profile), root = sourceRoot(sourceUtf8)
  const packet = { ...legacy, source: { ...legacy.source, root, sha256: root, byteLength: new TextEncoder().encode(sourceUtf8).byteLength } }
  return FactoryOraclePacketSchema.parse({ ...packet, root: deriveFactoryOraclePacketRoot(packet) })
}
