# Phase 11: Doctrine Debugging UX - Pattern Map

**Mapped:** 2026-05-18
**Files analyzed:** 28 source/test files
**Analogs found:** 17 / 19 recommended touch points

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
| --- | --- | --- | --- | --- |
| `apps/web/app/workshop/workshop-client-state.ts` | utility | transform | same file | exact |
| `apps/web/app/workshop/workshop-client.tsx` | component | request-response | same file | exact |
| `packages/runtime-js/src/validation.ts` | utility | transform | same file | exact |
| `packages/persistence/src/workshop.ts` | service/config | CRUD + request-response | same file | exact |
| `packages/persistence/src/matchset-status.ts` | service | CRUD projection | same file | exact |
| `apps/web/app/api/workshop/validate/route.ts` | route | request-response | same file | exact |
| `apps/web/app/api/workshop/tests/route.ts` | route | request-response | same file | exact |
| `apps/web/app/api/workshop/tests/[matchSetId]/route.ts` | route | request-response | same file | exact |
| `apps/web/app/matches/types.ts` | DTO/model | transform | same file | exact |
| `apps/web/app/matches/replay-ready.ts` | utility | projection transform | same file | exact |
| `packages/replay/src/project.ts` | utility | projection transform | same file | exact |
| `packages/spec/src/types.ts` | model/DTO | transform | same file | exact |
| `packages/spec/src/schemas.ts` | model/schema | validation transform | same file | exact |
| `apps/web/app/matches/[matchId]/replay/replay-state.ts` | utility | transform | same file | exact |
| `apps/web/app/matches/[matchId]/replay/replay-client.tsx` | component | event-driven UI state | same file | exact |
| `apps/web/app/matches/[matchId]/replay/owner-debug.ts` | guard/utility | request-response | same file | exact |
| `packages/engine/src/activation.ts` | engine source facts | event-driven | same file | exact |
| `packages/engine/src/movement.ts` | engine source facts | event-driven | same file | exact |
| `packages/test-utils/src/replay-scenarios.ts` | test utility/fixture | batch + event-driven | same file | role-match |

## Pattern Assignments

### Workshop Helper/Copy Decisions

**Apply to:** `apps/web/app/workshop/workshop-client-state.ts`

**Analog:** `apps/web/app/workshop/workshop-client-state.ts`

**Imports pattern** (lines 1-3):
```typescript
import type { StrategyRevisionValidationReport } from "@cowards/spec"
import type { WorkshopRevisionSummary } from "./types.js"
import type { WorkshopTestSummary } from "./types.js"
```

**Small pure helper pattern** (lines 11-31):
```typescript
export const getDraftStatusLabel = (
  state: DraftValidationState,
): "Not checked" | "Checking..." | "Valid draft" | "Invalid draft" => {
  switch (state) {
    case "checking":
      return "Checking..."
    case "valid":
      return "Valid draft"
    case "invalid":
      return "Invalid draft"
    case "not-checked":
      return "Not checked"
  }
}

export const formatValidationIssueHeading = (
  issue: StrategyRevisionValidationReport["errors"][number],
): string => `${issue.severity.toUpperCase()} · ${issue.code}`
```

**Replay availability helper pattern** (lines 113-117):
```typescript
export const getReplayHref = (matchId: string): string =>
  `/matches/${encodeURIComponent(matchId)}/replay`

export const canOpenReplay = (match: WorkshopMatchSummary): boolean =>
  match.status === "complete" && match.hasReplay === true
```

**Outcome/unavailable copy pattern** (lines 126-151):
```typescript
export const formatMatchOutcome = (match: WorkshopMatchSummary): string => {
  if (match.status === "pending") {
    return "Pending"
  }
  if (match.status === "running") {
    return "Running"
  }
  if (match.status === "failed_system" || match.status === "blocked") {
    return "Failed system"
  }
  if (!match.hasReplay) {
    return "Replay unavailable"
  }
  return winner ? `Winner: ${winner}` : "Complete"
}
```

**Guidance:** Add validation/runtime remediation copy as pure exported helpers here. Do not add nested status branching directly in JSX. Add a helper such as `formatValidationIssueGuidance(issue)` and a replay-unavailable helper that distinguishes pending/running/failed/no-Chronicle without changing `canOpenReplay`.

### Workshop Component Rendering

**Apply to:** `apps/web/app/workshop/workshop-client.tsx`

**Analog:** `apps/web/app/workshop/workshop-client.tsx`

**Imports pattern** (lines 3-25):
```typescript
import { useEffect, useMemo, useState } from "react"
import type { StrategyRevisionValidationReport } from "@cowards/spec"
import { StrategySourceEditor } from "./monaco-editor.js"
import type {
  WorkshopSnapshot,
  WorkshopTemplateSummary,
  WorkshopTestSummary,
} from "./types.js"
import {
  canSubmitRevision,
  canOpenReplay,
  formatMatchOutcome,
  formatValidationIssueHeading,
  getReplayHref,
  getDraftStatusClass,
  getDraftStatusLabel,
} from "./workshop-client-state.js"
```

**Template application pattern** (lines 128-137):
```typescript
const applyTemplate = (template: WorkshopTemplateSummary) => {
  if (isDirty && !window.confirm(replaceDraftCopy)) {
    return
  }
  setSelectedTemplateId(template.id)
  setSource(template.source)
  setValidation(template.validation)
  setValidationSource(template.source)
  setIsDirty(false)
}
```

**Validation rendering pattern** (lines 352-391):
```typescript
<section className="workshop-panel workshop-validation-panel">
  <h2 className="workshop-heading">Validation</h2>
  <p>
    {getDraftStatusLabel(draftState)} ·{" "}
    {validation?.errors.length ?? 0} errors ·{" "}
    {validation?.warnings.length ?? 0} warnings
  </p>
  {validation?.errors.length ? (
    <ul className="validation-list">
      {validation.errors.map((issue, index) => (
        <li className="validation-row" key={`${issue.code}-${index}`}>
          <span className="validation-code">
            {formatValidationIssueHeading(issue)}
          </span>
          {issue.message}
        </li>
      ))}
    </ul>
  ) : null}
</section>
```

**Replay-link rendering pattern** (lines 522-548):
```typescript
{testResult.matches.length ? (
  <div className="workshop-match-list" aria-label="Matches">
    {testResult.matches.map((match) => (
      <div className="workshop-match-row" key={match.matchId}>
        <div className="workshop-match-main">
          <span className="workshop-match-id" title={match.matchId}>
            {match.matchId}
          </span>
          <span className="workshop-muted">
            {match.status} · {formatMatchOutcome(match)}
          </span>
        </div>
        {canOpenReplay(match) ? (
          <a className="workshop-replay-link" href={getReplayHref(match.matchId)}>
            Open replay
          </a>
        ) : (
          <span className="workshop-muted">Replay unavailable</span>
        )}
      </div>
    ))}
  </div>
) : null}
```

**Guidance:** Keep the component as renderer/fetch orchestrator. Pull new copy such as "Replay will appear after the Match completes" into helper functions and pass DTO fields from `WorkshopTestSummary`.

### Validation DTO and Runtime Messaging

**Apply to:** `packages/runtime-js/src/validation.ts`, `packages/spec/src/types.ts`, `packages/spec/src/schemas.ts`

**Analog:** `packages/runtime-js/src/validation.ts`

**Validation issue builder pattern** (lines 108-117):
```typescript
const issue = (
  code: StrategyRevisionValidationCode,
  message: string,
  pattern?: string,
): StrategyRevisionValidationIssue => ({
  code,
  severity: "error",
  message,
  ...(pattern === undefined ? {} : { pattern }),
})
```

**Actionable constraint messages source** (lines 138-176):
```typescript
if (sourceBytes > STRATEGY_SOURCE_BYTES) {
  errors.push(
    issue(
      "SOURCE_TOO_LARGE",
      `Strategy source exceeds ${STRATEGY_SOURCE_BYTES} bytes`,
    ),
  )
}

if (!/\bexport\s+default\b/.test(source)) {
  errors.push(
    issue(
      "MISSING_DEFAULT_EXPORT",
      "Strategy source must contain export default",
    ),
  )
}
```

**Schema contract pattern** from `packages/spec/src/types.ts` (lines 161-177):
```typescript
export type StrategyRevisionValidationCode =
  | "SOURCE_TOO_LARGE"
  | "FORBIDDEN_PATTERN"
  | "MISSING_DEFAULT_EXPORT"
  | "MISSING_SELECT_ACTIVATIONS"
  | "MISSING_SOLDIER_BRAIN"
  | "ASYNC_METHOD_NOT_ALLOWED"
  | "IMPORT_NOT_ALLOWED"
  | "TRANSPILE_FAILED"
  | "ENGINE_INCOMPATIBLE"

export interface StrategyRevisionValidationIssue {
  code: StrategyRevisionValidationCode
  severity: StrategyRevisionValidationSeverity
  message: string
  pattern?: string | undefined
}
```

**Zod mirror pattern** from `packages/spec/src/schemas.ts` (lines 184-201):
```typescript
export const StrategyRevisionValidationCodeSchema = z.enum([
  "SOURCE_TOO_LARGE",
  "FORBIDDEN_PATTERN",
  "MISSING_DEFAULT_EXPORT",
  "MISSING_SELECT_ACTIVATIONS",
  "MISSING_SOLDIER_BRAIN",
  "ASYNC_METHOD_NOT_ALLOWED",
  "IMPORT_NOT_ALLOWED",
  "TRANSPILE_FAILED",
  "ENGINE_INCOMPATIBLE",
])

export const StrategyRevisionValidationIssueSchema = z.object({
  code: StrategyRevisionValidationCodeSchema,
  severity: StrategyRevisionValidationSeveritySchema,
  message: z.string().min(1),
  pattern: z.string().min(1).optional(),
})
```

**Guidance:** If adding a `remediation` or `constraint` field, update `types.ts`, `schemas.ts`, validation generation, and tests together. Prefer structured fields over parsing message text in the UI.

### Sample and Template Strategy Storage

**Apply to:** `packages/persistence/src/workshop.ts`

**Analog:** `packages/persistence/src/workshop.ts`

**Built-in source constants pattern** (lines 45-86):
```typescript
export const workshopTemplateSource = `
export default {
  selectActivations(input) {
    return {
      activationOrders: input.mySoldiers
        .filter((soldier) => soldier.status === "ACTIVE")
        .slice(0, input.activationCount)
        .map((soldier) => ({ soldierId: soldier.id })),
      strategyMemory: input.strategyMemory
    }
  },
  soldierBrain(input) {
    return {
      action: { type: "TURN_TO_STONE" },
      soldierMemory: input.soldierMemory
    }
  }
}
`.trim()
```

**Template DTO pattern** (lines 147-152):
```typescript
export interface WorkshopTemplateSummary {
  id: "template:cautious" | "template:reckless" | "template:sentinel"
  label: string
  source: string
  validation: StrategyRevisionValidationReport
}
```

**Template catalog pattern** (lines 228-247):
```typescript
export const listWorkshopTemplates = (): WorkshopTemplateSummary[] => [
  {
    id: "template:cautious",
    label: "Cautious",
    source: cautiousSource,
    validation: validateStrategySource(cautiousSource),
  },
  {
    id: "template:sentinel",
    label: "Sentinel",
    source: sentinelSource,
    validation: validateStrategySource(sentinelSource),
  },
]
```

**Snapshot propagation pattern** (lines 441-459):
```typescript
export const getWorkshopSnapshot = async (
  pool: Pool,
): Promise<WorkshopSnapshot> => ({
  templateSource: workshopTemplateSource,
  templateValidation: validateWorkshopSource(workshopTemplateSource),
  revisions: await listWorkshopRevisions(pool),
  presets: listWorkshopPresets(),
  opponents: listWorkshopOpponents(),
  templates: listWorkshopTemplates(),
})
```

**Guidance:** Store new teaching/failure samples in this catalog path first. If invalid-output/runtime-violation samples are intentionally invalid, do not make `listWorkshopTemplates().every(...valid)` fail silently; split sample categories or add metadata such as `sampleKind: "valid" | "failure-mode"` and update tests.

### API Route Patterns

**Apply to:** `apps/web/app/api/workshop/**/route.ts`

**Analog:** `apps/web/app/api/workshop/tests/route.ts`

**Request body validation pattern** (lines 10-27):
```typescript
const readLaunchRequest = async (
  request: Request,
): Promise<WorkshopLaunchTestRequest | WorkshopErrorResponse> => {
  const body = (await request.json()) as Record<string, unknown>
  if (
    typeof body.revisionId !== "string" ||
    typeof body.opponentId !== "string" ||
    typeof body.presetId !== "string"
  ) {
    return { error: "revisionId, opponentId, and presetId are required" }
  }

  return {
    revisionId: body.revisionId,
    opponentId: body.opponentId as WorkshopLaunchTestRequest["opponentId"],
    presetId: body.presetId as WorkshopLaunchTestRequest["presetId"],
  }
}
```

**Error mapping pattern** (lines 29-50):
```typescript
export async function POST(request: Request): Promise<Response> {
  const body = await readLaunchRequest(request)
  if ("error" in body) {
    return Response.json(body, { status: 400 })
  }

  try {
    return Response.json(await workshopServer.launchTest(body), { status: 201 })
  } catch (error) {
    if (isWorkshopInputError(error)) {
      return Response.json(
        { error: error.message } satisfies WorkshopErrorResponse,
        { status: 400 },
      )
    }
    return Response.json(
      { error: "Storage is unavailable; start local services and retry." },
      { status: 503 },
    )
  }
}
```

**Simple validation route pattern** from `apps/web/app/api/workshop/validate/route.ts` (lines 4-15):
```typescript
export async function POST(request: Request): Promise<Response> {
  const body = (await request.json()) as Record<string, unknown>
  if (typeof body.source !== "string") {
    return Response.json(
      { error: "source is required" } satisfies WorkshopErrorResponse,
      { status: 400 },
    )
  }

  return Response.json({
    validation: workshopServer.validateSource(body.source),
  })
}
```

**Guidance:** Keep API routes thin. New debug/sample endpoints should call `workshopServer` or replay server helpers and return typed DTOs, not embed validation or replay logic.

### Replay DTO and Projection Boundary

**Apply to:** `apps/web/app/matches/types.ts`, `apps/web/app/matches/replay-ready.ts`, `packages/replay/src/project.ts`, `packages/spec/src/types.ts`, `packages/spec/src/schemas.ts`

**Analog:** `apps/web/app/matches/types.ts`

**Replay DTO pattern** (lines 23-63):
```typescript
export interface ReplayTimelineEntryDto {
  sequence: number
  type: ChronicleEventType
  round?: number | undefined
  activation?: number | undefined
  cycle?: number | undefined
  label: string
  privacy: "public" | "owner"
  context: ChronicleEventContext
  payload: JsonValue
}

export interface ReplayReadyDto {
  status: "ready"
  mode: ReplayViewMode
  metadata: ReplayMetadataDto
  projection: ChronicleProjection
  timeline: ReplayTimelineEntryDto[]
  states: ReplayStateDto[]
  initialSequence: 0
  ownerPlayerId?: PlayerId | undefined
}
```

**Projection build pattern** from `apps/web/app/matches/replay-ready.ts` (lines 53-70):
```typescript
const buildTimeline = (
  projectedEvents: ChroniclePublicEvent[],
  originalEvents: ChronicleEvent[],
): ReplayTimelineEntryDto[] =>
  projectedEvents.map((event) => {
    const original = originalEvents[event.sequence]
    return {
      sequence: event.sequence,
      type: event.type,
      round: event.context.roundNumber,
      activation: event.context.activationIndex,
      cycle: event.context.cycleIndex,
      label: eventLabel(event),
      privacy: original?.privacy === "owner" ? "owner" : "public",
      context: event.context,
      payload: event.payload,
    }
  })
```

**Public/owner mode gate pattern** from `apps/web/app/matches/replay-ready.ts` (lines 94-137):
```typescript
const mode: ReplayViewMode =
  options.allowOwnerDebug === true &&
  options.mode === "owner" &&
  options.ownerPlayerId
    ? "owner"
    : "public"

const projection =
  mode === "owner"
    ? projectOwnerChronicle(chronicle, options.ownerPlayerId!)
    : projectPublicChronicle(chronicle)

return {
  status: "ready",
  mode,
  metadata,
  projection,
  timeline: buildTimeline(projection.events, chronicle.events),
  states,
  initialSequence: 0,
  ...(mode === "owner" && options.ownerPlayerId
    ? { ownerPlayerId: options.ownerPlayerId }
    : {}),
} satisfies ReplayReadyDto
```

**Guidance:** Add "why did nothing" explanations as DTO fields generated here or in `packages/replay`, using projected events/states plus owner-private refs. React should render `ReplayTimelineEntryDto.debugExplanation` or a sibling owner-debug DTO, not compute rules.

### Owner Debug Privacy Boundary

**Apply to:** `packages/replay/src/project.ts`, `apps/web/app/matches/[matchId]/replay/owner-debug.ts`

**Analog:** `packages/replay/src/project.ts`

**Private key denylist pattern** (lines 12-29):
```typescript
const PRIVATE_PAYLOAD_KEYS = new Set([
  "awarenessGrid",
  "byPlayerId",
  "debug",
  "objectivePayload",
  "rawRuntimeDetails",
  "runtimeDetails",
  "soldierMemory",
  "source",
  "strategyMemory",
  "violation",
])
```

**Public sanitization pattern** (lines 42-55):
```typescript
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
```

**Runtime violation public payload pattern** (lines 57-75):
```typescript
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
```

**Owner projection pattern** (lines 103-123):
```typescript
export const projectOwnerChronicle = (
  chronicle: Chronicle,
  playerId: PlayerId,
): ChronicleProjection => {
  const canonical = canonicalChronicle(chronicle)
  const publicProjection = projectPublicChronicle(canonical)
  const ownerData = canonical.private?.byPlayerId[playerId]

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
```

**Opt-in route guard pattern** from `owner-debug.ts` (lines 11-41):
```typescript
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
  return { mode: "owner", allowOwnerDebug: true, ownerPlayerId: ownerPlayerId as PlayerId }
}
```

**Guidance:** Owner explanations may include structured cause codes and user labels, but public projection must not gain Strategy source, StrategyMemory, SoldierMemory, objective payloads, raw Awareness Grid, or raw violation messages. Add public projection tests for every new debug field.

### Replay State Helper and Component Patterns

**Apply to:** `apps/web/app/matches/[matchId]/replay/replay-state.ts`, `apps/web/app/matches/[matchId]/replay/replay-client.tsx`

**Analog:** `apps/web/app/matches/[matchId]/replay/replay-state.ts`

**View-model interfaces pattern** (lines 41-72):
```typescript
export interface SoldierInspector {
  shortLabel: string
  fullId: string
  owner: string
  status: SoldierSnapshot["status"]
  position: string
  facing: string
  lastSuccessfulMoveDirection: string
  recentHistory: SoldierHistoryEntry[]
}

export interface EventInspector {
  type: ReplayTimelineEntryDto["type"]
  sequence: number
  context: string
  payload: JsonValue
  privacyLabel: "Public event" | "Owner-only debug available"
}
```

**Owner debug availability pattern** (lines 286-290):
```typescript
export const canShowOwnerDebug = (data: ReplayPageData): boolean =>
  data.status === "ready" &&
  data.projection.viewer.access === "owner" &&
  data.projection.ownerPrivate !== undefined
```

**Owner-private read pattern** (lines 345-381):
```typescript
export const getOwnerAwarenessGridInspection = (
  data: ReplayReadyDto,
  entry: ReplayTimelineEntryDto,
): OwnerAwarenessGridInspection | null => {
  if (
    !canShowOwnerDebug(data) ||
    entry.type !== "AWARENESS_GRID_OBSERVED" ||
    !data.projection.ownerPrivate
  ) {
    return null
  }

  const ownerData = data.projection.ownerPrivate.data
  if (!isRecord(ownerData)) {
    return null
  }

  const privatePayload = ownerData[`private:event:${entry.sequence}`]
  const payloadGrid = isRecord(privatePayload)
    ? readAwarenessGrid(privatePayload.awarenessGrid)
    : null
  const fallbackGrid = readAwarenessGrid(ownerData.awarenessGrid)
  const cells = payloadGrid ?? fallbackGrid
  return cells ? { soldierId, cycle, cells } : null
}
```

**Component owner-debug toggle pattern** from `replay-client.tsx` (lines 268-310):
```tsx
{ownerDebugAvailable ? (
  <section>
    <label className="replay-debug-toggle">
      <input
        type="checkbox"
        checked={ownerDebugVisible}
        onChange={(event) =>
          setOwnerDebugVisible(event.currentTarget.checked)
        }
      />
      Owner debug
    </label>
    {ownerDebugVisible ? (
      <>
        {awarenessGrid ? (
          <div className="replay-awareness-grid" aria-label="Awareness Grid">
            <p className="replay-label">Awareness Grid</p>
          </div>
        ) : null}
      </>
    ) : null}
  </section>
) : null}
```

**Guidance:** Add `getSoldierInactionExplanation` or similar to `replay-state.ts` only if it consumes DTO explanation fields. If the cause must be derived from events/states, put derivation in `packages/replay` or `apps/web/app/matches/replay-ready.ts`, not inside React rendering.

### Engine-Derived Cause Facts

**Apply to:** `packages/replay` debug derivation and tests; engine code should normally not change for this phase unless event payload facts are missing.

**Analog:** `packages/engine/src/activation.ts`

**Activation selection filtering facts** (lines 55-80):
```typescript
const validOrders = (
  state: GameState,
  playerId: PlayerId,
  orders: Array<{ soldierId: string; objective?: JsonValue | undefined }>,
): ActivationOrder[] => {
  const seen = new Set<string>()
  const activeIds = new Set(
    getActiveSoldiers(state, playerId).map((soldier) => soldier.id),
  )
  const filtered: ActivationOrder[] = []
  for (const order of orders) {
    if (filtered.length >= state.activationCount) {
      break
    }
    if (seen.has(order.soldierId) || !activeIds.has(order.soldierId)) {
      continue
    }
    seen.add(order.soldierId)
    filtered.push(...)
  }
  return filtered
}
```

**Runtime violation/stones fact pattern** (lines 84-119):
```typescript
const applyRuntimeViolation = (
  state: GameState,
  soldier: Soldier,
  violation: RuntimeViolation,
  advanced: boolean,
): TransitionResult => {
  const events = [
    event(
      "RUNTIME_VIOLATION",
      { soldierId: soldier.id, ownerPlayerId: soldier.ownerPlayerId, type: violation.type },
      { privacy: "owner", privatePayload: privateJson({ soldierId: soldier.id, violation }) },
    ),
  ]
  if (advanced || soldier.status === "FALLEN") {
    return { state, events }
  }
  const stoned = { ...soldier, status: "STONE" as const }
  return {
    state: replaceSoldier(state, stoned),
    events: [...events, event("SOLDIER_STONED", { soldierId: soldier.id })],
  }
}
```

**Activation lifecycle facts** (lines 207-227, 230-336):
```typescript
export const resolveActivation = (
  state: GameState,
  runtime: StrategyRuntime,
  soldierId: string,
  objective?: JsonValue,
): TransitionResult => {
  let current = state
  const events = [event("ACTIVATION_STARTED", { soldierId })]
  ...
  if (current.outcome) {
    return { state: current, events }
  }

  let soldier = getSoldier(current, soldierId)
  if (!soldier || soldier.status !== "ACTIVE") {
    return { state: current, events }
  }
  ...
  if (soldier?.status === "ACTIVE" && !advanced) {
    current = replaceSoldier(current, { ...soldier, status: "STONE" })
    events.push(event("SOLDIER_STONED", { soldierId }))
  }
}
```

**Movement blocked facts** from `packages/engine/src/movement.ts` (lines 173-238):
```typescript
if (mover.lastSuccessfulMoveDirection === oppositeDirection(direction)) {
  return {
    state,
    events: [event("MOVE_BLOCKED", { soldierId, reason: "IMMEDIATE_REVERSAL" })],
    advanced: false,
    terminalReason: "INVALID_MOVE",
  }
}
if (getTerrainStoneAt(state, destination)) {
  return {
    state,
    events: [event("MOVE_BLOCKED", { soldierId, reason: "TERRAIN_STONE" })],
    advanced: false,
    terminalReason: "MOVE_BLOCKED",
  }
}
if (occupant.status === "STONE") {
  return {
    state,
    events: [event("MOVE_BLOCKED", { soldierId, reason: "STONE_SOLDIER" })],
    advanced: false,
    terminalReason: "MOVE_BLOCKED",
  }
}
```

**Guidance:** Required cause codes map to existing facts:
- `not_selected`: Strategy selection event exists but no activation order/event for Soldier.
- `invalid_action`: runtime/schema invalid output or `MOVE_BLOCKED` with `IMMEDIATE_REVERSAL`.
- `blocked_movement`: `MOVE_BLOCKED`/`PUSH_BLOCKED` reasons.
- `timeout`: `RUNTIME_VIOLATION` payload type `TIMEOUT`.
- `thrown_exception`: `RUNTIME_VIOLATION` payload type `THROWN_EXCEPTION`.
- `stone`: state/status `STONE` or `SOLDIER_STONED`.
- `fallen`: state/status `FALLEN` or `SOLDIER_FELL`.
- `match_ended`: `MATCH_ENDED` before/at selected sequence.

### Test Patterns

**Workshop helper tests** from `apps/web/app/workshop/workshop-client.test.tsx` (lines 18-34, 144-179):
```typescript
describe("Strategy Workshop validation helpers", () => {
  it("formats validation rows as ERROR · MISSING_DEFAULT_EXPORT", () => {
    expect(
      formatValidationIssueHeading({
        code: "MISSING_DEFAULT_EXPORT",
        severity: "error",
        message: "Strategy source must contain export default",
      }),
    ).toBe("ERROR · MISSING_DEFAULT_EXPORT")
  })

  it("formats replay handoff rows and blocks failed/system replay links", () => {
    expect(getReplayHref("match:alpha/beta")).toBe(
      "/matches/match%3Aalpha%2Fbeta/replay",
    )
    expect(canOpenReplay({ matchId: "match:complete", status: "complete", hasReplay: true })).toBe(true)
  })
})
```

**Owner debug guard tests** from `apps/web/app/matches/[matchId]/replay/owner-debug.test.ts` (lines 7-38):
```typescript
describe("owner debug replay route options", () => {
  it("keeps public replay as the default", () => {
    expect(isOwnerDebugReplayEnabled({})).toBe(false)
    expect(
      resolveOwnerDebugReplayOptions(
        { ownerDebug: "1", ownerPlayerId: "player:bottom" },
        {},
      ),
    ).toBeUndefined()
  })

  it("requires an explicit owner player id", () => {
    expect(
      resolveOwnerDebugReplayOptions({ ownerDebug: "1" }, { PLAYWRIGHT_TEST: "1" }),
    ).toBeUndefined()
  })
})
```

**Projection privacy tests** from `packages/replay/src/project.test.ts` (lines 285-317, 378-459):
```typescript
it("projects a public Chronicle without private sections or private refs", () => {
  const projection = projectPublicChronicle(createChronicle())
  const serialized = JSON.stringify(projection)

  expect(projection.viewer).toEqual({ access: "public" })
  for (const key of privateKeyNames) {
    expect(serialized).not.toContain(`"${key}"`)
  }
  for (const marker of privateMarkerValues) {
    expect(serialized).not.toContain(marker)
  }
})

it("projects only the requested player's private owner section", () => {
  const bottomProjection = projectOwnerChronicle(chronicle, "bottom")
  const topProjection = projectOwnerChronicle(chronicle, "top")
  expect(bottomSerialized).toContain(playerMarker(PRIVATE_STRATEGY_SOURCE_MARKER, "bottom"))
  expect(bottomSerialized).not.toContain(playerMarker(PRIVATE_STRATEGY_SOURCE_MARKER, "top"))
})
```

**Runtime validation matrix tests** from `packages/runtime-js/src/validation.test.ts` (lines 23-75, 115-125):
```typescript
it.each([
  ["eval(", validSource.replace("return", "eval('1'); return")],
  ["fetch(", validSource.replace("return", "fetch('/x'); return")],
  ["Math.random", validSource.replace("return", "Math.random(); return")],
])("rejects forbidden category: %s", (_label, source) => {
  expectCode(source, "FORBIDDEN_PATTERN")
})

it("accepts a valid minimal strategy", () => {
  const report = validateStrategySource(validSource)
  expect(report.valid).toBe(true)
  expect(report.errors).toEqual([])
})
```

**Sample legality tests** from `packages/test-utils/src/replay-scenarios.legality.test.ts` (lines 316-333, 455-466):
```typescript
describe("[Chronicle validation] canonical replay scenarios", () => {
  it("[Chronicle validation] every canonical scenario validates", () => {
    for (const scenario of getCanonicalReplayScenarios()) {
      validateScenario(scenario)
    }
  })
})

it("[engine legality] runtime-failure scenario keeps violation payload public-safe", () => {
  const event = findEvent(scenario, "RUNTIME_VIOLATION")
  const serializedPayload = JSON.stringify(event.payload)
  expect(event.privacy).toBe("owner")
  expect(serializedPayload).not.toMatch(
    /source|strategyMemory|soldierMemory|objective|message|stack|Deterministic replay scenario/i,
  )
})
```

## Shared Patterns

### DTO Before React

**Source:** `apps/web/app/matches/replay-ready.ts`, `apps/web/app/matches/types.ts`

Build replay DTOs from `createReplay(...)`, projections, and Chronicle events before entering `ReplayClient`. React consumes `ReplayReadyDto`, timeline entries, and helper view-models.

### Public Projection Privacy

**Source:** `packages/replay/src/project.ts`, `packages/replay/src/project.test.ts`

Public projection starts from canonical parsed Chronicle, sanitizes payloads recursively, special-cases `RUNTIME_VIOLATION`, and omits full private sections. Owner projection overlays only `private.byPlayerId[playerId]`.

### Thin Next Routes

**Source:** `apps/web/app/api/workshop/**/route.ts`

Routes parse minimal request fields, call `workshopServer`, and return `Response.json(...)` with typed response objects. Storage problems return service-oriented messages rather than stack traces.

### Workshop Samples as Validated Catalog Entries

**Source:** `packages/persistence/src/workshop.ts`, `packages/persistence/src/workshop.test.ts`

Templates are source constants plus `validateStrategySource(...)` in `listWorkshopTemplates()`. Tests currently expect only valid starter templates, so intentional failure-mode examples need explicit metadata or a separate sample list.

### Runtime Failure Taxonomy

**Source:** `packages/spec/src/types.ts`, `packages/runtime-js/src/executor.ts`, `packages/engine/src/activation.ts`

Runtime violations are structured by `RuntimeViolation.type` and only player-caused violations become owner Chronicle events. Do not expose raw violation message details publicly.

## Recommended Files To Touch

| File | Purpose |
| --- | --- |
| `packages/spec/src/types.ts` | Add structured validation guidance fields and/or replay debug cause DTO types if shared beyond web. |
| `packages/spec/src/schemas.ts` | Mirror any shared DTO/schema additions. |
| `packages/runtime-js/src/validation.ts` | Emit actionable Strategy API constraint/remediation metadata. |
| `packages/persistence/src/workshop.ts` | Add valid teaching samples and intentional failure-mode sample metadata/source catalog. |
| `packages/persistence/src/matchset-status.ts` | Extend Match summary with replay-unavailable reason if needed for Workshop copy. |
| `apps/web/app/workshop/types.ts` | Re-export any expanded Workshop DTOs. |
| `apps/web/app/workshop/workshop-client-state.ts` | Add copy/status helpers for validation remediation and replay availability reasons. |
| `apps/web/app/workshop/workshop-client.tsx` | Render new helper outputs and sample metadata. |
| `apps/web/app/api/workshop/validate/route.ts` | Return expanded validation report unchanged from server. |
| `apps/web/app/api/workshop/tests/route.ts` | Keep launch errors typed and terse if DTO changes. |
| `apps/web/app/matches/types.ts` | Add owner-only debug explanation DTO fields for replay. |
| `apps/web/app/matches/replay-ready.ts` | Build explanation DTOs from Chronicle projection/replay states and owner mode. |
| `packages/replay/src/project.ts` | If debug fields live in Chronicle projection, enforce public stripping and owner-only inclusion here. |
| `apps/web/app/matches/[matchId]/replay/replay-state.ts` | Add pure renderer helpers that consume explanation DTOs. |
| `apps/web/app/matches/[matchId]/replay/replay-client.tsx` | Render owner-only explanation overlay behind existing checkbox. |
| `apps/web/app/matches/[matchId]/replay/owner-debug.ts` | Preserve opt-in owner debug gate. |
| `packages/test-utils/src/replay-scenarios.ts` | Reuse runtime-failure/blocking/stoning scenarios as regression inputs where useful. |

## No Analog Found

| File/Concern | Role | Data Flow | Reason |
| --- | --- | --- | --- |
| Structured "why did nothing" explanation DTO | DTO/service | projection transform | Existing owner Awareness Grid debug exists, but no inaction explanation DTO/cause-code mapper exists yet. |
| Intentional invalid/failure-mode Strategy sample catalog | config/service | transform | Workshop templates currently assume valid templates; failure-mode samples need a new metadata convention. |

## Metadata

**Analog search scope:** `apps/web`, `packages/replay`, `packages/runtime-js`, `packages/spec`, `packages/engine`, plus `packages/persistence` and `packages/test-utils` for Workshop sample/replay fixture seams.
**Files scanned:** 90+ via `rg --files` and targeted `rg`.
**Pattern extraction date:** 2026-05-18
