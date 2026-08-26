export const PLAN_262_67_CHECKPOINT_ROOT = "sha256:f1bc58ff9a4f107c293f1bfba9e7d44d5eda92aac78fbe93f7596889d04f404a" as const

export const createV138Plan26268ReplacementAuthorization = () => Object.freeze({
  schemaVersion: "v1.38-plan-262-68-replacement-authorization-v10-source-only",
  checkpointRoot: PLAN_262_67_CHECKPOINT_ROOT,
  reviewDisposition: "r4_source_only_review_passed_non_authorizing",
  executable: false,
  consumable: false,
  admit03: Object.freeze({ status: "blocked", freshAccepted: 0, requiredAccepted: 540 }),
  frozenBounds: Object.freeze({ headroomSamplingMs: 200, minimumEffectiveAvailableBasisPoints: 2500,
    calibrationAttempts: 8, calibrationShards: 4, conditionalReproductionCells: 540,
    formationMaterialization: false }),
  canonicalAuthorizationWritten: false,
  canonicalSealWritten: false,
  routeStarted: false,
})
