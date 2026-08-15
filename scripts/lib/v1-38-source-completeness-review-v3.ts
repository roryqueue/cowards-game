import type { JsonValue } from "@cowards/spec"

export const V138_REVIEW_V3_SCHEMA =
  "v1.38-plan-262-62-source-completeness-review-v3" as const

export type V138ReviewV3Document = Readonly<{
  schemaVersion: typeof V138_REVIEW_V3_SCHEMA
  sourceBase9: string
  sourceA9: string
  sourceCustody: Readonly<Record<string, JsonValue>>
  commands: readonly JsonValue[]
  handlerObservations: readonly JsonValue[]
  protectedHistory: Readonly<Record<string, JsonValue>>
  chargeIds: readonly string[]
  priorAuthorizationBytes: readonly JsonValue[]
  snapshots: readonly JsonValue[]
  orderedEvents: readonly JsonValue[]
  cleanup: Readonly<Record<string, JsonValue>>
  publication: Readonly<Record<string, JsonValue>>
  verdict: Readonly<Record<string, JsonValue>>
  identityClaims: Readonly<Record<string, JsonValue>>
  reviewV3Root: string
}>

/** Validator-only boundary. Review derivation and publication belong to Plan 262-62. */
export const validateV138ReviewV3Document = (_value: unknown): V138ReviewV3Document => {
  throw new TypeError("[RED:A9_REVIEW_V3_V9_ROUTE_48_PLAN_CHAIN]")
}
