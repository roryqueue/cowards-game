import { resolve } from "node:path"
import { pathToFileURL } from "node:url"
import { writePhase265PacketSummaryExclusive } from "./prepare-phase-265-packets.js"

/** Captured from the 2026-09-22 read-only `readLeagueInitialCandidates`
 * historical import: exactly three `base_distinct` Phase 264 slots. The
 * allocation CLI and normal prepare-prospective/run still independently
 * re-authenticate every byte/ledger/assessment before any reservation. */
export const phase265VerifiedBases = Object.freeze({
  schemaVersion: "phase265-verified-bases-v1",
  historicalAssessment: {
    artifactRoot: "sha256:25913b26fa81fa15177774fbdcf9c0d1ef244ad13910bc664bfde4ea8c2e43f8",
    assessmentRoot: "sha256:0446fef49598ef425c883774adb23159ade4b1e44f630463a72562777a9ecea1",
    thresholdArtifactRoot: "sha256:f6098c9e14ed868e162a9374557e518678996b619f3f8912fb8723113328fa72",
    producerImplementationRoot: "sha256:5baaeb677327a6102fd3dc719543686b14448122a91a4bca320cd0836cf5040b",
    assessmentImplementationRoot: "sha256:6a6094089e6714def26c427f60dfc0fae15e534cc685ad7a76dc883c4911b97c",
  },
  bases: [
    { sourceSlot: "S01", publicationArtifactRoot: "sha256:248a48e285a6f15da53ade90b1d8a66200fd35a33c46ce716017209eefd0ea9b", candidateAdmissionRoot: "sha256:850d8c03d00b6dd8791a68403801e55c37fcaf6f6f2f9c31105b782cbf9f26f5", sourceRoot: "sha256:3a49f15d3b0164e25106e44bd27f1e33c11a13bf0bfd6410c85e494dead823e2", supervisionArtifactRoot: "sha256:80d17a2c7beebb758bb14eacd2dc9318d7d7b884363754e67510823bdda9ecf7" },
    { sourceSlot: "S03", publicationArtifactRoot: "sha256:b53b00a5e92f0f696f40b20453a2821596f65be6fdc561d2b8bc44f351cf8de8", candidateAdmissionRoot: "sha256:f5cd002a1cece02fb4f9a63ea1d952354dd57558307be2304326cd806274a774", sourceRoot: "sha256:19126911caf193808c53de111576986e80b26d9c2109dcb3d04edd3344b5e39f", supervisionArtifactRoot: "sha256:de70fc054600a04d26f7278811f8996d666d36a0b51233b19d7535137198abd6" },
    { sourceSlot: "S05", publicationArtifactRoot: "sha256:0d2fe25df865a4648427bacd74b88ec61185ad6ca986d1bfdd15701a7595ecf4", candidateAdmissionRoot: "sha256:e9e351639b971e2bdb6b369c97ee8781100d3d3db619d6fde810d2ca838972ae", sourceRoot: "sha256:919de27fbb855f72ca68cd023b3c10a6c5829dffa3ebad52d395741b79db72b5", supervisionArtifactRoot: "sha256:a0f75e75cee9269d6115f4a2a5702968f2c2e234b7dbe0ea8dbeeac976c38361" },
  ],
})

const outputIndex = process.argv.indexOf("--output")
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  if (outputIndex < 0 || !process.argv[outputIndex + 1]) throw new TypeError("PHASE265_BASES_USAGE: --output <new-path>")
  writePhase265PacketSummaryExclusive(process.argv[outputIndex + 1]!, phase265VerifiedBases)
  process.stdout.write(`${JSON.stringify({ outputPath: resolve(process.argv[outputIndex + 1]!), baseSlots: phase265VerifiedBases.bases.map((base) => base.sourceSlot) })}\n`)
}
