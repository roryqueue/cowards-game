import type { FactoryCandidate } from "../factory/contracts.js"
import type { LabMatchExecution } from "../runtime-bridge.js"
import type { LabRoot } from "../contracts.js"

export interface LeagueCandidateIssuer {
  verifyCandidate(candidate: FactoryCandidate): boolean
}

export interface LeagueCandidateAdmission {
  readonly root: LabRoot
  readonly candidate: FactoryCandidate
}

export interface LeaguePayoffProjection {
  readonly root: LabRoot
  readonly entrantCandidateRoot: LabRoot
  readonly halfPoints: 0 | 1 | 2
}

export const admitLeagueCandidate = (_issuer: LeagueCandidateIssuer, _value: unknown): LeagueCandidateAdmission => {
  throw new TypeError("LEAGUE_CONTRACT_NOT_IMPLEMENTED")
}

export const projectCanonicalKernelOutcomeToEntrantHalfPoints = (_value: {
  execution: LabMatchExecution
  entrantCandidateRoot: LabRoot
  bottomCandidateRoot: LabRoot
  topCandidateRoot: LabRoot
  bottomPlayerId: string
  topPlayerId: string
  cellRoot: LabRoot
  conditionRoot: LabRoot
  semanticGeometryHash: LabRoot
  resultEventRoot: LabRoot
}): LeaguePayoffProjection => {
  throw new TypeError("LEAGUE_CONTRACT_NOT_IMPLEMENTED")
}
