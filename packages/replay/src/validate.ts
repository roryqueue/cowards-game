import {
  ChronicleSchema,
  COMPATIBILITY_VERSIONS,
  type Chronicle,
  type ChronicleEventType,
  type ChronicleSnapshotKind,
  type ChronicleValidationError,
  type ChronicleValidationResult,
  type JsonValue,
} from "@cowards/spec"
import { createChronicleContentHash } from "./hash.js"

const SUPPORTED_SCHEMA_VERSION = "chronicle-v1"

const REQUIRED_COMPLETED_EVENT_TYPES = [
  "MATCH_STARTED",
  "ROUND_STARTED",
  "STRATEGY_EVALUATED",
  "ACTIVATION_STARTED",
  "AWARENESS_GRID_OBSERVED",
  "ACTION_EMITTED",
  "MATCH_ENDED",
] as const satisfies readonly ChronicleEventType[]

const REQUIRED_COMPLETED_SNAPSHOT_KINDS = [
  "MATCH_START",
  "MATCH_END",
  "TERMINAL",
] as const satisfies readonly ChronicleSnapshotKind[]

const error = (
  code: ChronicleValidationError["code"],
  message: string,
  details: Omit<ChronicleValidationError, "code" | "message"> = {},
): ChronicleValidationError => ({
  code,
  message,
  ...details,
})

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value)

export const migrateChronicle = (
  chronicle: JsonValue,
): Chronicle | ChronicleValidationError => {
  if (!isRecord(chronicle)) {
    return error(
      "UNSUPPORTED_MIGRATION",
      "Chronicle migration requires an object input.",
    )
  }
  if (chronicle.schemaVersion === SUPPORTED_SCHEMA_VERSION) {
    return chronicle as unknown as Chronicle
  }
  return error(
    "UNSUPPORTED_MIGRATION",
    "No Chronicle migrations are supported.",
    {
      expected: SUPPORTED_SCHEMA_VERSION,
      actual:
        typeof chronicle.schemaVersion === "string"
          ? chronicle.schemaVersion
          : "missing",
    },
  )
}

const validateVersion = (chronicle: Chronicle): ChronicleValidationError[] => {
  const errors: ChronicleValidationError[] = []
  if (chronicle.schemaVersion !== SUPPORTED_SCHEMA_VERSION) {
    errors.push(
      error("VERSION_INCOMPATIBLE", "Unsupported Chronicle schema version.", {
        expected: SUPPORTED_SCHEMA_VERSION,
        actual: chronicle.schemaVersion,
      }),
    )
  }

  const versions = chronicle.reproducibility.versions
  const unsupported = Object.entries(COMPATIBILITY_VERSIONS).find(
    ([key, expected]) =>
      versions[key as keyof typeof COMPATIBILITY_VERSIONS] !== expected,
  )
  if (unsupported) {
    const [key, expected] = unsupported
    errors.push(
      error("VERSION_INCOMPATIBLE", `Unsupported ${key} version.`, {
        expected,
        actual: versions[key as keyof typeof COMPATIBILITY_VERSIONS],
      }),
    )
  }
  return errors
}

const validateEventOrder = (
  chronicle: Chronicle,
): ChronicleValidationError[] => {
  const errors: ChronicleValidationError[] = []
  chronicle.events.forEach((event, index) => {
    if (event.sequence !== index) {
      errors.push(
        error(
          "EVENT_ORDER_INVALID",
          "Chronicle event sequences must be contiguous from zero.",
          { sequence: event.sequence, expected: index, actual: event.sequence },
        ),
      )
    }
  })

  const firstMatchStart = chronicle.events.findIndex(
    (event) => event.type === "MATCH_STARTED",
  )
  const firstRoundStart = chronicle.events.findIndex(
    (event) => event.type === "ROUND_STARTED",
  )
  const firstActivationStart = chronicle.events.findIndex(
    (event) => event.type === "ACTIVATION_STARTED",
  )
  const matchEnded = chronicle.events
    .map((event, index) => ({ event, index }))
    .filter(({ event }) => event.type === "MATCH_ENDED")

  if (firstMatchStart !== 0) {
    errors.push(
      error("EVENT_ORDER_INVALID", "Chronicle must start with MATCH_STARTED.", {
        expected: "MATCH_STARTED at sequence 0",
        actual: chronicle.events[0]?.type ?? "missing",
      }),
    )
  }
  if (firstRoundStart >= 0 && firstRoundStart < firstMatchStart) {
    errors.push(
      error(
        "EVENT_ORDER_INVALID",
        "ROUND_STARTED cannot precede MATCH_STARTED.",
        {
          sequence: chronicle.events[firstRoundStart]?.sequence,
        },
      ),
    )
  }
  if (firstActivationStart >= 0 && firstActivationStart < firstRoundStart) {
    errors.push(
      error(
        "EVENT_ORDER_INVALID",
        "ACTIVATION_STARTED cannot precede ROUND_STARTED.",
        { sequence: chronicle.events[firstActivationStart]?.sequence },
      ),
    )
  }
  if (matchEnded.length !== 1) {
    errors.push(
      error(
        "EVENT_ORDER_INVALID",
        "Chronicle must contain exactly one MATCH_ENDED event.",
        {
          expected: 1,
          actual: matchEnded.length,
        },
      ),
    )
  } else if (matchEnded[0]?.index !== chronicle.events.length - 1) {
    errors.push(
      error("EVENT_ORDER_INVALID", "MATCH_ENDED must be the final event.", {
        sequence: matchEnded[0]?.event.sequence,
      }),
    )
  }

  return errors
}

const validateRequiredEvents = (
  chronicle: Chronicle,
): ChronicleValidationError[] => {
  const isCompleted = chronicle.events.some(
    (event) => event.type === "MATCH_ENDED",
  )
  if (!isCompleted) {
    return []
  }
  const present = new Set(chronicle.events.map((event) => event.type))
  return REQUIRED_COMPLETED_EVENT_TYPES.flatMap((type) =>
    present.has(type)
      ? []
      : [
          error(
            "REQUIRED_EVENT_MISSING",
            `Completed Chronicle is missing ${type}.`,
            { expected: type },
          ),
        ],
  )
}

const validateSnapshots = (
  chronicle: Chronicle,
): ChronicleValidationError[] => {
  const present = new Set(chronicle.snapshots.map((snapshot) => snapshot.kind))
  const errors = REQUIRED_COMPLETED_SNAPSHOT_KINDS.flatMap((kind) =>
    present.has(kind)
      ? []
      : [
          error("SNAPSHOT_MISSING", `Chronicle is missing ${kind} snapshot.`, {
            expected: kind,
          }),
        ],
  )

  if (
    chronicle.events.some((event) => event.type === "ROUND_STARTED") &&
    (!present.has("ROUND_START") || !present.has("ROUND_END"))
  ) {
    errors.push(
      error(
        "SNAPSHOT_MISSING",
        "Chronicle with rounds requires ROUND_START and ROUND_END snapshots.",
        { expected: "ROUND_START and ROUND_END" },
      ),
    )
  }
  if (
    chronicle.events.some((event) => event.type === "ACTIVATION_STARTED") &&
    (!present.has("ACTIVATION_START") || !present.has("ACTIVATION_END"))
  ) {
    errors.push(
      error(
        "SNAPSHOT_MISSING",
        "Chronicle with activations requires ACTIVATION_START and ACTIVATION_END snapshots.",
        { expected: "ACTIVATION_START and ACTIVATION_END" },
      ),
    )
  }
  if (
    chronicle.events.some((event) => event.type === "CONTRACTION_RESOLVED") &&
    !present.has("CONTRACTION")
  ) {
    errors.push(
      error(
        "SNAPSHOT_MISSING",
        "Chronicle with Contraction requires a CONTRACTION snapshot.",
        { expected: "CONTRACTION" },
      ),
    )
  }

  const eventSequences = new Set(
    chronicle.events.map((event) => event.sequence),
  )
  for (const snapshot of chronicle.snapshots) {
    if (!eventSequences.has(snapshot.sequence)) {
      errors.push(
        error(
          "SNAPSHOT_MISSING",
          "Chronicle snapshot must reference an existing event sequence.",
          { sequence: snapshot.sequence },
        ),
      )
    }
  }

  return errors
}

const validateHash = (chronicle: Chronicle): ChronicleValidationError[] => {
  if (chronicle.integrity === undefined) {
    return []
  }
  const expected = createChronicleContentHash(chronicle)
  if (
    chronicle.integrity.algorithm !== expected.algorithm ||
    chronicle.integrity.normalizedContentHash !== expected.normalizedContentHash
  ) {
    return [
      error(
        "HASH_MISMATCH",
        "Chronicle content hash does not match integrity metadata.",
        {
          expected: expected as unknown as JsonValue,
          actual: chronicle.integrity as unknown as JsonValue,
        },
      ),
    ]
  }
  return []
}

export const validateChronicle = (
  chronicle: unknown,
): ChronicleValidationResult => {
  if (
    isRecord(chronicle) &&
    chronicle.schemaVersion !== undefined &&
    chronicle.schemaVersion !== SUPPORTED_SCHEMA_VERSION
  ) {
    return {
      ok: false,
      errors: [
        error("VERSION_INCOMPATIBLE", "Unsupported Chronicle schema version.", {
          expected: SUPPORTED_SCHEMA_VERSION,
          actual:
            typeof chronicle.schemaVersion === "string"
              ? chronicle.schemaVersion
              : "invalid",
        }),
      ],
    }
  }

  const parsed = ChronicleSchema.safeParse(chronicle)
  if (!parsed.success) {
    return {
      ok: false,
      errors: [
        error(
          "SCHEMA_INVALID",
          "Chronicle does not match the canonical schema.",
          {
            actual: parsed.error.issues.map((issue) => ({
              path: issue.path.join("."),
              message: issue.message,
            })) as JsonValue,
          },
        ),
      ],
    }
  }

  const parsedChronicle = parsed.data as Chronicle
  const errors = [
    ...validateVersion(parsedChronicle),
    ...validateEventOrder(parsedChronicle),
    ...validateRequiredEvents(parsedChronicle),
    ...validateSnapshots(parsedChronicle),
    ...validateHash(parsedChronicle),
  ]

  return errors.length === 0 ? { ok: true } : { ok: false, errors }
}

export const assertChronicleCompatible = (chronicle: unknown): Chronicle => {
  const result = validateChronicle(chronicle)
  if (!result.ok) {
    throw new Error(
      `Chronicle validation failed: ${result.errors
        .map((validationError) => validationError.code)
        .join(", ")}`,
    )
  }
  return ChronicleSchema.parse(chronicle) as Chronicle
}
