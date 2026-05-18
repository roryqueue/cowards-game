import type { PlayerId } from "@cowards/spec"
import type { GetMatchReplayOptions } from "../../server.js"

type QueryValue = string | string[] | undefined
type QueryParams = Record<string, QueryValue>
type ReplayEnv = Partial<Record<string, string | undefined>>

const firstValue = (value: QueryValue): string | undefined =>
  Array.isArray(value) ? value[0] : value

export const isOwnerDebugReplayEnabled = (
  env: ReplayEnv = process.env,
): boolean =>
  env.PLAYWRIGHT_TEST === "1" ||
  env.NODE_ENV === "test" ||
  env.COWARDS_ENABLE_OWNER_DEBUG_REPLAY === "1"

export const resolveOwnerDebugReplayOptions = (
  searchParams: QueryParams | undefined,
  env: ReplayEnv = process.env,
): GetMatchReplayOptions | undefined => {
  if (!isOwnerDebugReplayEnabled(env) || !searchParams) {
    return undefined
  }

  const debugMode =
    firstValue(searchParams.ownerDebug) ?? firstValue(searchParams.debug)
  if (debugMode !== "1" && debugMode !== "owner") {
    return undefined
  }

  const ownerPlayerId = firstValue(searchParams.ownerPlayerId)
  if (!ownerPlayerId) {
    return undefined
  }

  return {
    allowOwnerDebug: true,
    requestedOwnerPlayerId: ownerPlayerId as PlayerId,
  }
}
