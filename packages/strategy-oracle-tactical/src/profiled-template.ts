import { admitTacticalAdaptationProfile, type TacticalAdaptationProfile } from "./adaptation.js"

/** This suffix is compiled only with the unchanged, closed historical tactical source. */
export const compileProfiledTacticalTemplate = (input: TacticalAdaptationProfile): string => {
  const profile = admitTacticalAdaptationProfile(input)
  const constants = JSON.stringify({ posture: profile.postureWeights, action: profile.actionWeights })
  return `
const TACTICAL_PROFILE = ${constants};
function tacticalProfileRank(node) {
  return {
    hard: node.rank.hard,
    soft: node.rank.soft + node.selected.reduce((total, mission) => total + TACTICAL_PROFILE.posture[mission.posture], 0),
    key: node.rank.key,
  };
}
function profiledTacticalActivations(input) {
  const nodes = expandTacticalSearch(input);
  const selected = (nodes.length ? [...nodes].sort((left, right) => compareTacticalRanks(tacticalProfileRank(left), tacticalProfileRank(right)))[0].selected : []);
  return {
    activationOrders: selected.map((mission) => ({ soldierId: mission.soldierId, objective: mission })),
    strategyMemory: { tactical: { schemaVersion: "tactical-memory-v1", algorithm: "tactical-beam-v1", selected: selected.map((mission) => mission.soldierId) } },
  };
}
function profiledTacticalSoldierBrain(input) {
  const mission = readableMission(input);
  const action = tacticalActionChoices()
    .map((candidate, ordinal) => {
      const rank = scoreTacticalAction(input, candidate, mission, ordinal);
      return { action: candidate, rank: { hard: rank.hard, soft: rank.soft + TACTICAL_PROFILE.action[candidate.type], key: rank.key } };
    })
    .sort((left, right) => compareTacticalRanks(left.rank, right.rank))[0].action;
  return {
    action,
    soldierMemory: { tactical: { schemaVersion: "tactical-brain-v1", posture: mission?.posture ?? "screen", cycle: input.cycleIndex } },
  };
}
export default { selectActivations(input) { return profiledTacticalActivations(input); }, soldierBrain(input) { return profiledTacticalSoldierBrain(input); } };
`
}
