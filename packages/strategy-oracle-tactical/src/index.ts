export { selectTacticalActivations, runTacticalSoldierBrain } from "./selector.js"
export { expandTacticalSearch, selectTacticalSearchNode } from "./search.js"
export { scoreTacticalAction, scoreTacticalMission } from "./scoring.js"
export type { TacticalMission, TacticalRank } from "./scoring.js"
export type { TacticalSearchNode } from "./search.js"
export {
  assertTacticalSourceClosure,
  compileTacticalSourceModules,
  emitTacticalFactoryPacket,
  emitTacticalSource,
  loadTacticalSourceModules,
  tacticalSourceManifest,
} from "./emit.js"
export type { TacticalFactoryRequest, TacticalSourceManifest, TacticalSourceModule } from "./emit.js"
export { admitTacticalAdaptationCorpus, admitTacticalAdaptationProfile, createTacticalAdaptationCorpus, deriveTacticalAdaptationProfile, TACTICAL_ADAPTATION_PROFILES } from "./adaptation.js"
export type { TacticalAdaptationCorpus, TacticalAdaptationCorpusDraft, TacticalAdaptationObservation, TacticalAdaptationProfile, TacticalAdaptationRow, TacticalAdaptationSelection } from "./adaptation.js"
export { compileProfiledTacticalTemplate } from "./profiled-template.js"
export { emitProfiledTacticalFactoryPacket, emitProfiledTacticalSource } from "./emit-profiled.js"
