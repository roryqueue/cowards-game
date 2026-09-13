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
