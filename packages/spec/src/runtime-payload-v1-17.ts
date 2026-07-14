import { z } from "zod"
import {
  admitCanonicalJsonValue,
  type CanonicalJsonBoundaryProfileId,
} from "./canonical-json.js"
import type { JsonValue } from "./types.js"

const addCanonicalJsonIssue = (
  value: JsonValue,
  profile: CanonicalJsonBoundaryProfileId,
  ctx: z.RefinementCtx,
): void => {
  const admitted = admitCanonicalJsonValue(value, { profile })
  if (admitted.ok) return
  ctx.addIssue({
    code: "custom",
    path: [...admitted.error.path],
    message: `canonical-json-v1:${admitted.error.code}`,
  })
}

const canonicalJsonValueV117Schema = (
  profile: CanonicalJsonBoundaryProfileId,
): z.ZodType<JsonValue> =>
  z
    .custom<JsonValue>(() => true)
    .superRefine((value, ctx) => addCanonicalJsonIssue(value, profile, ctx))

export const CanonicalJsonValueV117Schema = canonicalJsonValueV117Schema(
  "host-api-value",
)
export const StrategyMemoryV117Schema = canonicalJsonValueV117Schema(
  "strategy-memory",
)
export const SoldierMemoryV117Schema = canonicalJsonValueV117Schema(
  "soldier-memory",
)
export const ObjectivePayloadV117Schema = canonicalJsonValueV117Schema(
  "objective",
)

const DirectionV117Schema = z.enum(["UP", "DOWN", "LEFT", "RIGHT"])
const ActionV117Schema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("MOVE"),
    direction: DirectionV117Schema,
  }).strict(),
  z.object({
    type: z.literal("TURN"),
    direction: DirectionV117Schema,
  }).strict(),
  z.object({
    type: z.literal("TURN_TO_STONE"),
  }).strict(),
])

export const StrategyResultV117Schema = z
  .object({
    activationOrders: z.array(
      z
        .object({
          soldierId: z.string().min(1),
          objective: ObjectivePayloadV117Schema.optional(),
        })
        .strict(),
    ),
    strategyMemory: StrategyMemoryV117Schema,
  })
  .strict()
  .superRefine((value, ctx) =>
    addCanonicalJsonIssue(
      value as unknown as JsonValue,
      "strategy-payload",
      ctx,
    ),
  )

export const SoldierBrainResultV117Schema = z
  .object({
    action: ActionV117Schema,
    soldierMemory: SoldierMemoryV117Schema,
  })
  .strict()
  .superRefine((value, ctx) =>
    addCanonicalJsonIssue(
      value as unknown as JsonValue,
      "strategy-payload",
      ctx,
    ),
  )
