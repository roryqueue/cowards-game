export {
  claimNextMatchJob,
  recordAttemptFailure,
  type ClaimedMatchJob,
} from "./jobs.js"
export { completeMatch } from "./complete-match.js"
export { refreshMatchSetStatus } from "./matchset-status.js"
export { createMatchSetService } from "./matchset-service.js"
export {
  createManualExhibitionMatchSet,
  buildPublicMatchSetResultDto,
} from "./competition.js"

export const TYPE_SCRIPT_LIFECYCLE_QUARANTINE = {
  normalBackend: false,
  selectedNormalBackend: false,
  allowedPurposes: ["rollback", "test", "parity"],
  allowedRoles: ["rollback", "test", "parity", "fixture", "deferred"],
  quarantinedFunctions: [
    "claimNextMatchJob",
    "recordAttemptFailure",
    "completeMatch",
    "refreshMatchSetStatus",
    "createMatchSetService",
    "createManualExhibitionMatchSet",
    "buildPublicMatchSetResultDto",
  ],
  importBoundary: "@cowards/persistence/quarantine-lifecycle",
  note: "TypeScript lifecycle persistence is rollback/test/parity support only; Go owns normal Match jobs, completion, Chronicle handoff, MatchSet scoring, exhibition creation, and selected public evidence.",
} as const
