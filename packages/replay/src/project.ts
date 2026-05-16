import type {
  Chronicle,
  ChronicleEvent,
  ChronicleProjection,
  ChroniclePublicEvent,
  ChronicleViewer,
  JsonValue,
  PlayerId,
} from "@cowards/spec"

const PRIVATE_PAYLOAD_KEYS = new Set([
  "awarenessGrid",
  "exactAwarenessGrid",
  "objective",
  "objectivePayload",
  "rawRuntimeDetails",
  "runtimeDetails",
  "soldierMemory",
  "source",
  "strategyMemory",
  "strategySource",
  "violation",
])

const cloneJson = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const isRecord = (value: JsonValue): value is Record<string, JsonValue> =>
  value !== null && typeof value === "object" && !Array.isArray(value)

const readString = (
  payload: Record<string, JsonValue>,
  key: string,
): string | undefined =>
  typeof payload[key] === "string" ? (payload[key] as string) : undefined

const sanitizeJson = (value: JsonValue): JsonValue => {
  if (Array.isArray(value)) {
    return value.map(sanitizeJson)
  }
  if (!isRecord(value)) {
    return value
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !PRIVATE_PAYLOAD_KEYS.has(key))
      .map(([key, nested]) => [key, sanitizeJson(nested)]),
  )
}

const projectRuntimeViolationPayload = (
  event: ChronicleEvent,
): Record<string, JsonValue> => {
  const payload = isRecord(event.payload) ? event.payload : {}
  const publicPayload: Record<string, JsonValue> = {}
  for (const key of [
    "type",
    "category",
    "playerId",
    "ownerPlayerId",
    "soldierId",
  ]) {
    const value = readString(payload, key)
    if (value !== undefined) {
      publicPayload[key] = value
    }
  }
  return publicPayload
}

const projectEvent = (event: ChronicleEvent): ChroniclePublicEvent => ({
  type: event.type,
  sequence: event.sequence,
  context: cloneJson(event.context),
  payload:
    event.type === "RUNTIME_VIOLATION"
      ? projectRuntimeViolationPayload(event)
      : sanitizeJson(event.payload),
})

export const projectPublicChronicle = (
  chronicle: Chronicle,
): ChronicleProjection => ({
  schemaVersion: chronicle.schemaVersion,
  viewer: { access: "public" },
  reproducibility: cloneJson(chronicle.reproducibility),
  events: chronicle.events.map(projectEvent),
  snapshots: cloneJson(chronicle.snapshots),
  ...(chronicle.integrity === undefined
    ? {}
    : { integrity: cloneJson(chronicle.integrity) }),
})

export const projectOwnerChronicle = (
  chronicle: Chronicle,
  playerId: PlayerId,
): ChronicleProjection => {
  const publicProjection = projectPublicChronicle(chronicle)
  const ownerData = chronicle.private?.byPlayerId[playerId]

  return {
    ...publicProjection,
    viewer: { access: "owner", playerId },
    ...(ownerData === undefined
      ? {}
      : {
          ownerPrivate: {
            playerId,
            data: cloneJson(ownerData),
          },
        }),
  }
}

export const projectChronicle = (
  chronicle: Chronicle,
  viewer: ChronicleViewer,
): ChronicleProjection =>
  viewer.access === "public"
    ? projectPublicChronicle(chronicle)
    : projectOwnerChronicle(chronicle, viewer.playerId)
