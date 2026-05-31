import {
  createHash,
  createHmac,
  randomUUID,
  timingSafeEqual,
} from "node:crypto"
import {
  buildStrategyRevision,
  validateStrategySource,
  type StrategyRevisionValidationReport,
} from "@cowards/runtime-js"
import { validatePythonStrategySource } from "@cowards/runtime-python/validation"
import {
  describeStrategyRuntimeProductSemantics,
  getSupportedStrategyLanguageRecord,
  STRATEGY_RUNTIME_ABI_VERSION,
} from "@cowards/spec"
import type {
  MatchId,
  MatchSetId,
  PlayerId,
  RuntimeViolationType,
  StrategyId,
  StrategyRevision,
  StrategyRevisionValidationCode,
  StrategyRevisionId,
  StrategyArtifactSourceFormat,
  StrategyRuntimeProductSemantics,
} from "@cowards/spec"
import type { Pool } from "pg"
import { withTransaction } from "./db.js"
import { createMatchSetService } from "./matchset-service.js"
import { generatePresetMatrix } from "./matchset-service.js"
import {
  listMatchStatusesForSet,
  type MatchSetMatchSummary,
  refreshMatchSetStatus,
} from "./matchset-status.js"
import { getMatchSetPreset, type MatchSetPresetId } from "./presets.js"
import { createRepositories } from "./repositories.js"
import {
  listAdvancedStrategies,
  type AdvancedStrategySummary,
} from "./advanced-strategies.js"
import {
  listStarterStrategies,
  type StarterStrategySummary,
} from "./starter-strategies.js"
import type { MatchSetScore } from "./scoring.js"
import {
  cautiousSource,
  createDevelopmentSeedData,
  recklessSource,
} from "./seed.js"
import type { MatchSetStatus } from "./schema.js"

export const WORKSHOP_USER_ID = "user:local"
export const WORKSHOP_STRATEGY_ID = "strategy:local-workshop" as StrategyId
export const WORKSHOP_PLAYER_ID = "player:workshop-local" as PlayerId
export const WORKSHOP_MATCH_SET_PREFIX = "match-set:workshop:"

export class WorkshopInputError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "WorkshopInputError"
  }
}

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

export const sentinelSource = `
export default {
  selectActivations(input) {
    return {
      activationOrders: input.mySoldiers
        .filter((soldier) => soldier.status === "ACTIVE")
        .slice(0, input.activationCount)
        .map((soldier) => ({ soldierId: soldier.id, objective: { hold: true } })),
      strategyMemory: input.strategyMemory
    }
  },
  soldierBrain(input) {
    const forward = input.self.facing ?? "UP"
    return {
      action: input.cycleIndex === 0
        ? { type: "TURN", direction: forward }
        : { type: "TURN_TO_STONE" },
      soldierMemory: input.soldierMemory
    }
  }
}
`.trim()

export const pythonTacticalStarterSource = `
def select_activations(input):
    active = [soldier for soldier in input["mySoldiers"] if soldier["status"] == "ACTIVE"]
    orders = []
    for soldier in active[: input["activationCount"]]:
        orders.append({"soldierId": soldier["id"], "objective": {"stance": "probe"}})
    return {
        "activationOrders": orders,
        "strategyMemory": input["strategyMemory"],
    }


def soldier_brain(input):
    enemy = None
    for cell in input["awarenessGrid"]["cells"]:
        if cell["contents"] == "ENEMY_ACTIVE":
            enemy = cell
            break
    if enemy is not None:
        if enemy["dy"] < 0:
            direction = "UP"
        elif enemy["dy"] > 0:
            direction = "DOWN"
        elif enemy["dx"] > 0:
            direction = "RIGHT"
        elif enemy["dx"] < 0:
            direction = "LEFT"
        else:
            direction = input["self"]["facing"] or "UP"
        action = {"type": "TURN", "direction": direction}
    elif input["cycleIndex"] == 0:
        action = {"type": "MOVE", "direction": input["self"]["facing"] or "UP"}
    else:
        action = {"type": "TURN_TO_STONE"}
    return {
        "action": action,
        "soldierMemory": input["soldierMemory"],
    }
`.trim()

export const rustWasiTacticalStarterSource = `
use std::io::{self, Read};

fn first_active_soldier_id(input: &str) -> Option<&str> {
    let soldiers_start = input.find("\\"mySoldiers\\":[")?;
    let soldiers = &input[soldiers_start..];
    let id_start = soldiers.find("\\"id\\":\\"")? + "\\"id\\":\\"".len();
    let after_id = &soldiers[id_start..];
    let id_end = after_id.find('"')?;
    Some(&after_id[..id_end])
}

fn main() {
    let mut input = String::new();
    let _ = io::stdin().read_to_string(&mut input);
    if input.contains("\\"methodName\\":\\"soldierBrain\\"") {
        println!(r#"{{"ok":true,"abiVersion":"strategy-runtime-abi-v1.14","value":{{"action":{{"type":"TURN_TO_STONE"}},"soldierMemory":null}}}}"#);
    } else if let Some(soldier_id) = first_active_soldier_id(&input) {
        println!(
            r#"{{"ok":true,"abiVersion":"strategy-runtime-abi-v1.14","value":{{"activationOrders":[{{"soldierId":"{}","objective":{{"stance":"stone"}}}}],"strategyMemory":null}}}}"#,
            soldier_id
        );
    } else {
        println!(r#"{{"ok":true,"abiVersion":"strategy-runtime-abi-v1.14","value":{{"activationOrders":[],"strategyMemory":null}}}}"#);
    }
}
`.trim()

export const zigWasiTacticalStarterSource = `
const Iovec = extern struct { buf: [*]u8, buf_len: usize };
const Ciovec = extern struct { buf: [*]const u8, buf_len: usize };

extern "wasi_snapshot_preview1" fn fd_read(u32, *const Iovec, usize, *usize) u16;
extern "wasi_snapshot_preview1" fn fd_write(u32, *const Ciovec, usize, *usize) u16;

const StrategyInput = struct {
    bytes: []const u8,

    fn contains(self: StrategyInput, needle: []const u8) bool {
        return containsBytes(self.bytes, needle);
    }

    fn methodIs(self: StrategyInput, method: []const u8) bool {
        return self.contains(method);
    }

    fn firstActiveSoldierId(self: StrategyInput) ?[]const u8 {
        const soldiers_marker = "\\"mySoldiers\\":[";
        const id_marker = "\\"id\\":\\"";
        const soldiers_start = indexOfBytes(self.bytes, soldiers_marker) orelse return null;
        const soldiers = self.bytes[soldiers_start..];
        const id_start_relative = indexOfBytes(soldiers, id_marker) orelse return null;
        const id_start = id_start_relative + id_marker.len;
        const after_id = soldiers[id_start..];
        const id_end = indexOfBytes(after_id, "\\"") orelse return null;
        return after_id[0..id_end];
    }
};

fn containsBytes(haystack: []const u8, needle: []const u8) bool {
    return indexOfBytes(haystack, needle) != null;
}

fn indexOfBytes(haystack: []const u8, needle: []const u8) ?usize {
    if (needle.len == 0) return 0;
    if (haystack.len < needle.len) return null;
    var index: usize = 0;
    while (index <= haystack.len - needle.len) : (index += 1) {
        var matched = true;
        var offset: usize = 0;
        while (offset < needle.len) : (offset += 1) {
            if (haystack[index + offset] != needle[offset]) {
                matched = false;
                break;
            }
        }
        if (matched) return index;
    }
    return null;
}

fn writeAll(bytes: []const u8) void {
    var written: usize = 0;
    var iov = Ciovec{ .buf = bytes.ptr, .buf_len = bytes.len };
    _ = fd_write(1, &iov, 1, &written);
}

fn writeSoldierAction(action_json: []const u8) void {
    writeAll("{\\"ok\\":true,\\"abiVersion\\":\\"strategy-runtime-abi-v1.14\\",\\"value\\":{\\"action\\":");
    writeAll(action_json);
    writeAll(",\\"soldierMemory\\":null}}\\n");
}

fn writeEmptyActivations() void {
    writeAll("{\\"ok\\":true,\\"abiVersion\\":\\"strategy-runtime-abi-v1.14\\",\\"value\\":{\\"activationOrders\\":[],\\"strategyMemory\\":null}}\\n");
}

fn writeActivation(soldier_id: []const u8) void {
    writeAll("{\\"ok\\":true,\\"abiVersion\\":\\"strategy-runtime-abi-v1.14\\",\\"value\\":{\\"activationOrders\\":[{\\"soldierId\\":\\"");
    writeAll(soldier_id);
    writeAll("\\",\\"objective\\":{\\"stance\\":\\"stone\\"}}],\\"strategyMemory\\":null}}\\n");
}

export fn _start() void {
    var input_buf: [16384]u8 = undefined;
    var iov = Iovec{ .buf = &input_buf, .buf_len = input_buf.len };
    var nread: usize = 0;
    _ = fd_read(0, &iov, 1, &nread);
    const input = StrategyInput{ .bytes = input_buf[0..nread] };
    if (input.methodIs("\\"methodName\\":\\"soldierBrain\\"")) {
        writeSoldierAction("{\\"type\\":\\"TURN_TO_STONE\\"}");
    } else if (input.firstActiveSoldierId()) |soldier_id| {
        writeActivation(soldier_id);
    } else {
        writeEmptyActivations();
    }
}
`.trim()

const cautiousOpponentRevision = buildStrategyRevision({
  source: cautiousSource,
  strategyId: "strategy:cautious",
  metadata: { createdBy: WORKSHOP_USER_ID, label: "Cautious" },
})

const recklessOpponentRevision = buildStrategyRevision({
  source: recklessSource,
  strategyId: "strategy:reckless",
  metadata: { createdBy: WORKSHOP_USER_ID, label: "Reckless" },
})

export const WORKSHOP_OPPONENTS = [
  {
    id: "opponent:cautious",
    label: "Cautious",
    strategyId: "strategy:cautious" as StrategyId,
    playerId: "player:opponent:cautious" as PlayerId,
    revisionId: cautiousOpponentRevision.id,
  },
  {
    id: "opponent:reckless",
    label: "Reckless",
    strategyId: "strategy:reckless" as StrategyId,
    playerId: "player:opponent:reckless" as PlayerId,
    revisionId: recklessOpponentRevision.id,
  },
] as const

export interface WorkshopRevisionSummary {
  id: StrategyRevisionId
  strategyId: StrategyId
  label?: string | undefined
  notes?: string | undefined
  createdBy?: string | undefined
  sourceHash: string
  sourceBytes: number
  sourceFormat: StrategyArtifactSourceFormat
  valid: boolean
  validation: StrategyRevisionValidationReport
  metadata: StrategyRevision["metadata"]
  runtimeSemantics: StrategyRuntimeProductSemantics
  createdAt: string
  usedInMatches: number
}

export interface WorkshopPresetSummary {
  id: MatchSetPresetId
  label: string
  matchCount: number
  arenaVariantIds: string[]
  seeds: string[]
  mirrorSides: boolean
}

export interface WorkshopOpponentSummary {
  id: (typeof WORKSHOP_OPPONENTS)[number]["id"]
  label: string
  revisionId: StrategyRevisionId
}

export interface WorkshopTemplateSummary {
  id:
    | "template:cautious"
    | "template:reckless"
    | "template:sentinel"
    | "template:python-tactical"
    | "template:rust-wasi-tactical"
    | "template:zig-wasi-tactical"
  label: string
  sourceFormat: StrategyArtifactSourceFormat
  experimental?: boolean | undefined
  countedPlayEligible?: boolean | undefined
  source: string
  validation: StrategyRevisionValidationReport
}

interface WorkshopSampleBase {
  id: `sample:${string}`
  label: string
  description: string
  categories: string[]
  sourceFormat?: StrategyArtifactSourceFormat | undefined
  source: string
  validation: StrategyRevisionValidationReport
}

export type WorkshopSampleSummary =
  | (WorkshopSampleBase & {
      sampleKind: "starter"
      expectedValidationCode?: undefined
      expectedRuntimeViolationType?: undefined
    })
  | (WorkshopSampleBase & {
      sampleKind: "failure-mode"
      expectedValidationCode?: StrategyRevisionValidationCode | undefined
      expectedRuntimeViolationType?: RuntimeViolationType | undefined
    })

export interface WorkshopTestSummary {
  matchSetId: MatchSetId
  status: MatchSetStatus
  matchCount: number
  matchIds?: MatchId[] | undefined
  matches: MatchSetMatchSummary[]
  scoring: MatchSetScore
}

export interface WorkshopSnapshot {
  templateSource: string
  templateValidation: StrategyRevisionValidationReport
  revisions: WorkshopRevisionSummary[]
  presets: WorkshopPresetSummary[]
  opponents: WorkshopOpponentSummary[]
  templates: WorkshopTemplateSummary[]
  starters: StarterStrategySummary[]
  advancedStrategies: AdvancedStrategySummary[]
  samples: WorkshopSampleSummary[]
}

const presetLabels: Record<MatchSetPresetId, string> = {
  "smoke-v1": "Smoke",
  "standard-v1": "Standard",
  "stress-v1": "Stress",
}

export const LIST_WORKSHOP_REVISIONS_SQL = `
  select
    sr.id,
    sr.strategy_id,
    sr.source_hash,
    sr.source_bytes,
    sr.runtime,
    sr.validation,
    sr.metadata,
    sr.created_at,
    (
      select count(*)::integer
      from matches m
      where m.bottom_strategy_revision_id = sr.id
         or m.top_strategy_revision_id = sr.id
    ) as used_in_matches
  from strategy_revisions sr
  where sr.strategy_id = $1
  order by sr.created_at desc, sr.id desc
`

export const GET_WORKSHOP_REVISION_SOURCE_SQL = `
  select source
  from strategy_revisions
  where id = $1
    and strategy_id = $2
`

export const listWorkshopPresets = (): WorkshopPresetSummary[] =>
  (["smoke-v1", "standard-v1", "stress-v1"] as const).map((presetId) => {
    const preset = getMatchSetPreset(presetId)
    return {
      id: preset.id,
      label: presetLabels[preset.id],
      matchCount:
        preset.arenaVariantIds.length *
        preset.seeds.length *
        (preset.mirrorSides ? 2 : 1),
      arenaVariantIds: preset.arenaVariantIds,
      seeds: preset.seeds,
      mirrorSides: preset.mirrorSides,
    }
  })

export const listWorkshopOpponents = (): WorkshopOpponentSummary[] =>
  WORKSHOP_OPPONENTS.map((opponent) => ({
    id: opponent.id,
    label: opponent.label,
    revisionId: opponent.revisionId,
  }))

export const listWorkshopTemplates = (): WorkshopTemplateSummary[] => [
  {
    id: "template:cautious",
    label: "Cautious",
    sourceFormat: "typescript",
    source: cautiousSource,
    validation: validateStrategySource(cautiousSource),
  },
  {
    id: "template:reckless",
    label: "Reckless",
    sourceFormat: "typescript",
    source: recklessSource,
    validation: validateStrategySource(recklessSource),
  },
  {
    id: "template:sentinel",
    label: "Sentinel",
    sourceFormat: "typescript",
    source: sentinelSource,
    validation: validateStrategySource(sentinelSource),
  },
  {
    id: "template:python-tactical",
    label: "Python tactical starter",
    sourceFormat: "python",
    experimental: false,
    countedPlayEligible: true,
    source: pythonTacticalStarterSource,
    validation: validatePythonStrategySource(pythonTacticalStarterSource),
  },
  {
    id: "template:rust-wasi-tactical",
    label: "Rust WASI tactical starter",
    sourceFormat: "rust",
    experimental: false,
    countedPlayEligible: true,
    source: rustWasiTacticalStarterSource,
    validation: validateWorkshopSource(rustWasiTacticalStarterSource, "rust"),
  },
  {
    id: "template:zig-wasi-tactical",
    label: "Zig WASI tactical starter",
    sourceFormat: "zig",
    experimental: false,
    countedPlayEligible: true,
    source: zigWasiTacticalStarterSource,
    validation: validateWorkshopSource(zigWasiTacticalStarterSource, "zig"),
  },
]

const basicAdvanceTurnSampleSource = `
export default {
  selectActivations(input) {
    return {
      activationOrders: input.mySoldiers
        .filter((soldier) => soldier.status === "ACTIVE")
        .slice(0, input.activationCount)
        .map((soldier) => ({ soldierId: soldier.id, objective: { drill: "advance-turn" } })),
      strategyMemory: input.strategyMemory
    }
  },
  soldierBrain(input) {
    const forward = input.self.facing ?? "UP"
    return {
      action: input.cycleIndex === 0
        ? { type: "MOVE", direction: forward }
        : { type: "TURN", direction: forward },
      soldierMemory: input.soldierMemory
    }
  }
}
`.trim()

const pushSetupSampleSource = `
const directionPriority = ["UP", "RIGHT", "DOWN", "LEFT"]

const firstVisibleEnemyDirection = (grid) => {
  const target = grid.cells.find((cell) => cell.contents === "ENEMY_ACTIVE")
  if (!target) return "UP"
  if (target.dy < 0) return "UP"
  if (target.dx > 0) return "RIGHT"
  if (target.dy > 0) return "DOWN"
  if (target.dx < 0) return "LEFT"
  return directionPriority[0]
}

export default {
  selectActivations(input) {
    return {
      activationOrders: input.mySoldiers
        .filter((soldier) => soldier.status === "ACTIVE")
        .slice(0, input.activationCount)
        .map((soldier) => ({ soldierId: soldier.id, objective: { drill: "push-setup" } })),
      strategyMemory: input.strategyMemory
    }
  },
  soldierBrain(input) {
    const direction = firstVisibleEnemyDirection(input.awarenessGrid)
    return {
      action: input.cycleIndex === 0
        ? { type: "TURN", direction }
        : { type: "MOVE", direction },
      soldierMemory: input.soldierMemory
    }
  }
}
`.trim()

const backstabSetupSampleSource = `
const behindDirection = (self) =>
  self.lastSuccessfulMoveDirection ?? self.facing ?? "UP"

export default {
  selectActivations(input) {
    return {
      activationOrders: input.mySoldiers
        .filter((soldier) => soldier.status === "ACTIVE")
        .slice(0, input.activationCount)
        .map((soldier) => ({
          soldierId: soldier.id,
          objective: { drill: "backstab-setup", lastMove: soldier.lastSuccessfulMoveDirection }
        })),
      strategyMemory: input.strategyMemory
    }
  },
  soldierBrain(input) {
    const direction = behindDirection(input.self)
    return {
      action: input.cycleIndex === 0
        ? { type: "TURN", direction }
        : { type: "MOVE", direction },
      soldierMemory: input.soldierMemory
    }
  }
}
`.trim()

const stoningBlockingSampleSource = `
const hasAdjacentEnemy = (grid) =>
  grid.cells.some((cell) =>
    cell.contents === "ENEMY_ACTIVE" &&
    ((cell.dx === 0 && (cell.dy === -1 || cell.dy === 1)) ||
      (cell.dy === 0 && (cell.dx === -1 || cell.dx === 1)))
  )

export default {
  selectActivations(input) {
    return {
      activationOrders: input.mySoldiers
        .filter((soldier) => soldier.status === "ACTIVE")
        .slice(0, input.activationCount)
        .map((soldier) => ({ soldierId: soldier.id, objective: { drill: "stone-block" } })),
      strategyMemory: input.strategyMemory
    }
  },
  soldierBrain(input) {
    return {
      action: hasAdjacentEnemy(input.awarenessGrid)
        ? { type: "TURN_TO_STONE" }
        : { type: "TURN", direction: input.self.facing ?? "UP" },
      soldierMemory: input.soldierMemory
    }
  }
}
`.trim()

const forbiddenClockSampleSource = `
export default {
  selectActivations(input) {
    Date.now()
    return {
      activationOrders: input.mySoldiers.slice(0, input.activationCount).map((soldier) => ({ soldierId: soldier.id })),
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

const invalidOutputSampleSource = `
export default {
  selectActivations() {
    return { activationOrders: "everyone", strategyMemory: {} }
  },
  soldierBrain() {
    return { action: { type: "DANCE" }, soldierMemory: {} }
  }
}
`.trim()

const thrownExceptionSampleSource = `
export default {
  selectActivations(input) {
    return {
      activationOrders: input.mySoldiers.slice(0, input.activationCount).map((soldier) => ({ soldierId: soldier.id })),
      strategyMemory: input.strategyMemory
    }
  },
  soldierBrain() {
    throw new Error("Intentional sample failure")
  }
}
`.trim()

const runtimeTimeoutSampleSource = `
export default {
  selectActivations(input) {
    return {
      activationOrders: input.mySoldiers.slice(0, input.activationCount).map((soldier) => ({ soldierId: soldier.id })),
      strategyMemory: input.strategyMemory
    }
  },
  soldierBrain() {
    while (true) {}
  }
}
`.trim()

const doNothingSampleSource = `
export default {
  selectActivations(input) {
    return {
      activationOrders: [],
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

const pythonScreenAndStoneSampleSource = `
def select_activations(input):
    active = [soldier for soldier in input["mySoldiers"] if soldier["status"] == "ACTIVE"]
    orders = []
    for soldier in active[: input["activationCount"]]:
        orders.append({"soldierId": soldier["id"], "objective": {"role": "screen"}})
    return {"activationOrders": orders, "strategyMemory": input["strategyMemory"]}


def soldier_brain(input):
    adjacent_enemy = False
    for cell in input["awarenessGrid"]["cells"]:
        if cell["contents"] == "ENEMY_ACTIVE":
            if (cell["dx"] == 0 and (cell["dy"] == -1 or cell["dy"] == 1)) or (
                cell["dy"] == 0 and (cell["dx"] == -1 or cell["dx"] == 1)
            ):
                adjacent_enemy = True
    if adjacent_enemy:
        action = {"type": "TURN_TO_STONE"}
    else:
        action = {"type": "TURN", "direction": input["self"]["facing"] or "UP"}
    return {"action": action, "soldierMemory": input["soldierMemory"]}
`.trim()

const pythonPushPressureSampleSource = `
def direction_to_enemy(cell, fallback):
    if cell["dy"] < 0:
        return "UP"
    if cell["dy"] > 0:
        return "DOWN"
    if cell["dx"] > 0:
        return "RIGHT"
    if cell["dx"] < 0:
        return "LEFT"
    return fallback


def select_activations(input):
    active = [soldier for soldier in input["mySoldiers"] if soldier["status"] == "ACTIVE"]
    orders = []
    for soldier in active[: input["activationCount"]]:
        orders.append({"soldierId": soldier["id"], "objective": {"role": "pressure"}})
    return {"activationOrders": orders, "strategyMemory": input["strategyMemory"]}


def soldier_brain(input):
    direction = input["self"]["facing"] or "UP"
    for cell in input["awarenessGrid"]["cells"]:
        if cell["contents"] == "ENEMY_ACTIVE":
            direction = direction_to_enemy(cell, direction)
            break
    if input["cycleIndex"] == 0:
        action = {"type": "TURN", "direction": direction}
    else:
        action = {"type": "MOVE", "direction": direction}
    return {"action": action, "soldierMemory": input["soldierMemory"]}
`.trim()

const pythonBackstabLaneSampleSource = `
def select_activations(input):
    active = [soldier for soldier in input["mySoldiers"] if soldier["status"] == "ACTIVE"]
    ordered = []
    for soldier in active:
        if soldier["lastSuccessfulMoveDirection"]:
            ordered.append(soldier)
    for soldier in active:
        if not soldier["lastSuccessfulMoveDirection"]:
            ordered.append(soldier)
    return {
        "activationOrders": [
            {"soldierId": soldier["id"], "objective": {"role": "lane", "lastMove": soldier["lastSuccessfulMoveDirection"]}}
            for soldier in ordered[: input["activationCount"]]
        ],
        "strategyMemory": input["strategyMemory"],
    }


def soldier_brain(input):
    direction = input["self"]["lastSuccessfulMoveDirection"] or input["self"]["facing"] or "UP"
    if input["cycleIndex"] == 0:
        action = {"type": "TURN", "direction": direction}
    else:
        action = {"type": "MOVE", "direction": direction}
    return {"action": action, "soldierMemory": input["soldierMemory"]}
`.trim()

const sample = <T extends Omit<WorkshopSampleSummary, "validation">>(
  input: T,
): T & { validation: StrategyRevisionValidationReport } => ({
  ...input,
  validation:
    input.sourceFormat === "python"
      ? validatePythonStrategySource(input.source)
      : input.sourceFormat === "rust" || input.sourceFormat === "zig"
        ? validateWorkshopSource(input.source, input.sourceFormat)
        : validateStrategySource(input.source),
})

export const listWorkshopSamples = (): WorkshopSampleSummary[] => [
  sample({
    id: "sample:basic-advance-turn",
    label: "Basic advance and turn",
    sampleKind: "starter",
    description:
      "Advance when clear, otherwise turn to keep facing useful space.",
    categories: ["Movement"],
    source: basicAdvanceTurnSampleSource,
  }),
  sample({
    id: "sample:push-setup",
    label: "Push setup",
    sampleKind: "starter",
    description: "Demonstrates positioning for Push resolution.",
    categories: ["Push"],
    source: pushSetupSampleSource,
  }),
  sample({
    id: "sample:backstab-setup",
    label: "Backstab setup",
    sampleKind: "starter",
    description: "Shows facing and adjacency needed for Backstab.",
    categories: ["Backstab"],
    source: backstabSetupSampleSource,
  }),
  sample({
    id: "sample:stoning-blocking",
    label: "Stone and blocking",
    sampleKind: "starter",
    description: "Uses STONE to create blocking pressure.",
    categories: ["Stone"],
    source: stoningBlockingSampleSource,
  }),
  sample({
    id: "sample:python-screen-and-stone",
    label: "Python screen and stone",
    sampleKind: "starter",
    description:
      "A constrained Python provider screen that stones adjacent pressure.",
    categories: ["Python", "Stone"],
    sourceFormat: "python",
    source: pythonScreenAndStoneSampleSource,
  }),
  sample({
    id: "sample:python-push-pressure",
    label: "Python push pressure",
    sampleKind: "starter",
    description: "Faces visible threats, then advances to set up Push lanes.",
    categories: ["Python", "Push"],
    sourceFormat: "python",
    source: pythonPushPressureSampleSource,
  }),
  sample({
    id: "sample:python-backstab-lane",
    label: "Python backstab lane",
    sampleKind: "starter",
    description: "Prioritizes movers and keeps lane direction stable.",
    categories: ["Python", "Backstab"],
    sourceFormat: "python",
    source: pythonBackstabLaneSampleSource,
  }),
  sample({
    id: "sample:rust-wasi-stone",
    label: "Rust WASI stone",
    sampleKind: "starter",
    description:
      "A safe Rust WASI sample using the counted provider stdin/stdout JSON envelope.",
    categories: ["Rust", "WASM/WASI"],
    sourceFormat: "rust",
    source: rustWasiTacticalStarterSource,
  }),
  sample({
    id: "sample:zig-wasi-stone",
    label: "Zig WASI stone",
    sampleKind: "starter",
    description:
      "A safe no-std Zig WASI helper sample for the counted provider Preview 1 JSON envelope.",
    categories: ["Zig", "WASM/WASI"],
    sourceFormat: "zig",
    source: zigWasiTacticalStarterSource,
  }),
  sample({
    id: "sample:failure-forbidden-clock",
    label: "Failure: forbidden clock",
    sampleKind: "failure-mode",
    description: "Demonstrates that Strategy source cannot read system time.",
    categories: ["Runtime violation"],
    source: forbiddenClockSampleSource,
    expectedValidationCode: "FORBIDDEN_PATTERN",
  }),
  sample({
    id: "sample:failure-runtime-timeout",
    label: "Failure: runtime timeout",
    sampleKind: "failure-mode",
    description: "Demonstrates a Strategy that exceeds the runtime limit.",
    categories: ["Runtime violation"],
    source: runtimeTimeoutSampleSource,
    expectedRuntimeViolationType: "TIMEOUT",
  }),
  sample({
    id: "sample:failure-invalid-output",
    label: "Failure: invalid output",
    sampleKind: "failure-mode",
    description:
      "Demonstrates runtime rejection of invalid Strategy API output.",
    categories: ["Invalid output"],
    source: invalidOutputSampleSource,
    expectedRuntimeViolationType: "INVALID_OUTPUT",
  }),
  sample({
    id: "sample:failure-thrown-exception",
    label: "Failure: thrown exception",
    sampleKind: "failure-mode",
    description:
      "Demonstrates a SoldierBrain exception becoming a runtime violation.",
    categories: ["Runtime violation"],
    source: thrownExceptionSampleSource,
    expectedRuntimeViolationType: "THROWN_EXCEPTION",
  }),
  sample({
    id: "sample:failure-do-nothing",
    label: "Failure: do nothing",
    sampleKind: "failure-mode",
    description: "Selects no useful Activations so Soldiers remain idle.",
    categories: ["Do nothing"],
    source: doNothingSampleSource,
  }),
]

export const validateWorkshopSource = (
  source: string,
  sourceFormat: StrategyArtifactSourceFormat = "typescript",
): StrategyRevisionValidationReport => {
  if (sourceFormat === "python") {
    return validatePythonStrategySource(source)
  }
  if (sourceFormat === "rust" || sourceFormat === "zig") {
    const sourceBytes = new TextEncoder().encode(source).length
    const sourceHash = createHash("sha256").update(source).digest("hex")
    const label = sourceFormat === "zig" ? "Zig" : "Rust"
    const entrypointOk =
      sourceFormat === "zig"
        ? source.includes("_start")
        : source.includes("fn main")
    const valid =
      source.length > 0 &&
      entrypointOk &&
      !(sourceFormat === "zig" && source.includes('@import("std")')) &&
      !source.includes("include_str!") &&
      !source.includes("include_bytes!")
    return {
      valid,
      errors: valid
        ? []
        : [
            {
              code: "TRANSPILE_FAILED",
              severity: "error",
              message: `${label} WASM/WASI validation requires the runtime-service compile boundary.`,
            },
          ],
      warnings: [],
      sourceBytes,
      forbiddenPatterns: [],
      sourceHash,
      runtimeVersion: "0.1.0-alpha",
      engineCompatibility: {
        spec: "cowards-rules-v1.4",
        engine: "engine-v1",
      },
    }
  }
  return validateStrategySource(source)
}

export const ensureWorkshopSeed = async (pool: Pool): Promise<void> => {
  const seed = createDevelopmentSeedData()
  await withTransaction(pool, async (client) => {
    const repositories = createRepositories(client)

    for (const user of seed.users) {
      await repositories.upsertUser(user)
    }
    await repositories.upsertStrategy({
      id: WORKSHOP_STRATEGY_ID,
      ownerUserId: WORKSHOP_USER_ID,
      name: "Workshop Strategy",
    })
    for (const strategy of seed.strategies) {
      await repositories.upsertStrategy(strategy)
    }
    for (const revision of seed.revisions) {
      await repositories.insertStrategyRevision(revision)
    }
    for (const arena of seed.arenas) {
      await repositories.upsertArenaVariant(arena)
    }
  })
}

export const listWorkshopRevisions = async (
  pool: Pool,
): Promise<WorkshopRevisionSummary[]> => {
  await ensureWorkshopSeed(pool)
  const result = await pool.query<{
    id: StrategyRevisionId
    strategy_id: StrategyId
    source_hash: string
    source_bytes: number
    runtime: StrategyRevision["runtime"]
    validation: StrategyRevisionValidationReport
    metadata: StrategyRevision["metadata"]
    created_at: Date
    used_in_matches: number
  }>(LIST_WORKSHOP_REVISIONS_SQL, [WORKSHOP_STRATEGY_ID])

  return result.rows.map((row) => ({
    id: row.id,
    strategyId: row.strategy_id,
    label: row.metadata.label,
    notes: row.metadata.notes,
    createdBy: row.metadata.createdBy,
    sourceHash: row.source_hash,
    sourceBytes: row.source_bytes,
    sourceFormat:
      getSupportedStrategyLanguageRecord(row.runtime.language.id)
        ?.sourceFormat ?? "typescript",
    valid: row.validation.valid,
    validation: row.validation,
    metadata: row.metadata,
    runtimeSemantics: workshopRuntimeSemantics({
      runtime: row.runtime,
      metadata: row.metadata,
      sourceHash: row.source_hash,
      sourceBytes: row.source_bytes,
      valid: row.validation.valid,
    }),
    createdAt: row.created_at.toISOString(),
    usedInMatches: row.used_in_matches,
  }))
}

const workshopRuntimeSemantics = (revision: {
  runtime: StrategyRevision["runtime"]
  metadata: StrategyRevision["metadata"]
  sourceHash: string
  sourceBytes: number
  valid: boolean
}): StrategyRuntimeProductSemantics => {
  const semantics = describeStrategyRuntimeProductSemantics(revision.runtime)
  const language = getSupportedStrategyLanguageRecord(
    revision.runtime.language.id,
  )
  if (!revision.valid) {
    return {
      ...semantics,
      countedPlayEligible: false,
      countedPlayLabel: "Not counted",
      countedPlayReason: "Invalid Strategy Revision cannot enter counted play.",
    }
  }
  if (language?.runtimeTarget === "runtime-python") {
    return pythonProviderValidationMatches(revision.metadata, {
      sourceHash: revision.sourceHash,
      sourceBytes: revision.sourceBytes,
    })
      ? semantics
      : {
          ...semantics,
          countedPlayEligible: false,
          countedPlayLabel: "Not counted",
          countedPlayReason:
            "Python counted play requires provider-validated revision provenance.",
        }
  }
  if (language?.runtimeTarget === "runtime-wasm-wasi") {
    const artifact = revision.metadata.compiledArtifact
    const providerId =
      revision.runtime.language.id === "zig"
        ? "strategy-language-provider-zig-wasi"
        : "strategy-language-provider-rust-wasi"
    return artifact !== undefined &&
      rustProviderValidationMatches(revision.metadata, {
        providerId,
        sourceHash: revision.sourceHash,
        sourceBytes: revision.sourceBytes,
        artifactHash: artifact.hash,
        artifactBytes: artifact.bytes,
      })
      ? semantics
      : {
          ...semantics,
          countedPlayEligible: false,
          countedPlayLabel: "Not counted",
          countedPlayReason: `${language.label} counted play requires provider-validated artifact provenance.`,
        }
  }
  return semantics
}

export const insertWorkshopRevision = async (
  pool: Pool,
  revision: StrategyRevision,
): Promise<StrategyRevision> => {
  if (revision.strategyId !== WORKSHOP_STRATEGY_ID) {
    throw new Error("Workshop revisions must use the Workshop strategy id")
  }
  await ensureWorkshopSeed(pool)
  await createRepositories(pool).insertStrategyRevision(revision)
  return revision
}

export const getWorkshopRevisionSource = async (
  pool: Pool,
  revisionId: StrategyRevisionId,
): Promise<string | null> => {
  const result = await pool.query<{ source: string }>(
    GET_WORKSHOP_REVISION_SOURCE_SQL,
    [revisionId, WORKSHOP_STRATEGY_ID],
  )
  return result.rows[0]?.source ?? null
}

export const buildWorkshopRevision = (input: {
  source: string
  sourceFormat?: StrategyArtifactSourceFormat | undefined
  runtime?: StrategyRevision["runtime"] | undefined
  validation?: StrategyRevisionValidationReport | undefined
  engineCompatibility?: StrategyRevision["engineCompatibility"] | undefined
  metadata?: StrategyRevision["metadata"] | undefined
  runtimeServiceValidated?: boolean | undefined
  label?: string | undefined
  notes?: string | undefined
}): StrategyRevision => {
  const metadata = {
    createdBy: WORKSHOP_USER_ID,
    ...(input.metadata ?? {}),
    ...(input.label ? { label: input.label } : {}),
    ...(input.notes ? { notes: input.notes } : {}),
    ...(input.sourceFormat === "python"
      ? { tags: ["python", "counted", "provider"] }
      : input.sourceFormat === "rust"
        ? { tags: ["rust", "wasm-wasi", "counted", "provider"] }
        : input.sourceFormat === "zig"
          ? { tags: ["zig", "wasm-wasi", "counted", "provider"] }
          : {}),
  }
  if (input.sourceFormat === "python") {
    const sourceHash = createHash("sha256").update(input.source).digest("hex")
    const sourceBytes = new TextEncoder().encode(input.source).length
    if (
      !input.runtimeServiceValidated ||
      !input.runtime ||
      !input.validation ||
      !input.engineCompatibility ||
      input.validation.sourceHash !== sourceHash ||
      input.validation.sourceBytes !== sourceBytes ||
      !pythonProviderValidationMatches(input.metadata, {
        sourceHash,
        sourceBytes,
      })
    ) {
      throw new WorkshopInputError(
        "Python Workshop revisions require runtime-service provider validation.",
      )
    }
    return {
      id: `strategy-revision:workshop:python:${sourceHash}` as StrategyRevisionId,
      strategyId: WORKSHOP_STRATEGY_ID,
      source: input.source,
      sourceHash,
      sourceBytes,
      runtime: input.runtime,
      engineCompatibility: input.engineCompatibility,
      validation: input.validation,
      metadata,
    }
  }
  if (input.sourceFormat === "rust") {
    const sourceHash = createHash("sha256").update(input.source).digest("hex")
    const sourceBytes = new TextEncoder().encode(input.source).length
    const artifact = input.metadata?.compiledArtifact
    if (
      !input.runtimeServiceValidated ||
      !input.runtime ||
      !input.validation ||
      !input.engineCompatibility ||
      input.runtime.language.id !== "rust" ||
      input.runtime.adapter.id !== "runtime-wasm-wasi-wasmtime-preview1" ||
      input.validation.sourceHash !== sourceHash ||
      input.validation.sourceBytes !== sourceBytes ||
      artifact === undefined ||
      artifact.sourceHash !== sourceHash ||
      artifact.targetTriple !== "wasm32-wasip1" ||
      artifact.wasiProfile !== "preview1" ||
      artifact.abiEnvelope !== "stdin-stdout-json" ||
      artifact.abiVersion !== STRATEGY_RUNTIME_ABI_VERSION ||
      artifact.validationStatus !== "valid" ||
      !rustProviderValidationMatches(input.metadata, {
        sourceHash,
        sourceBytes,
        artifactHash: artifact.hash,
        artifactBytes: artifact.bytes,
      })
    ) {
      throw new WorkshopInputError(
        "Rust Workshop revisions require runtime-service provider validation.",
      )
    }
    return {
      id: `strategy-revision:workshop:rust:${sourceHash}` as StrategyRevisionId,
      strategyId: WORKSHOP_STRATEGY_ID,
      source: input.source,
      sourceHash,
      sourceBytes,
      runtime: input.runtime,
      engineCompatibility: input.engineCompatibility,
      validation: input.validation,
      metadata,
    }
  }
  if (input.sourceFormat === "zig") {
    const sourceHash = createHash("sha256").update(input.source).digest("hex")
    const sourceBytes = new TextEncoder().encode(input.source).length
    const artifact = input.metadata?.compiledArtifact
    if (
      !input.runtimeServiceValidated ||
      !input.runtime ||
      !input.validation ||
      !input.engineCompatibility ||
      input.runtime.language.id !== "zig" ||
      input.runtime.adapter.id !== "runtime-wasm-wasi-wasmtime-preview1" ||
      input.validation.sourceHash !== sourceHash ||
      input.validation.sourceBytes !== sourceBytes ||
      artifact === undefined ||
      artifact.sourceHash !== sourceHash ||
      artifact.targetTriple !== "wasm32-wasi" ||
      artifact.wasiProfile !== "preview1" ||
      artifact.abiEnvelope !== "stdin-stdout-json" ||
      artifact.abiVersion !== STRATEGY_RUNTIME_ABI_VERSION ||
      artifact.validationStatus !== "valid" ||
      !rustProviderValidationMatches(input.metadata, {
        providerId: "strategy-language-provider-zig-wasi",
        sourceHash,
        sourceBytes,
        artifactHash: artifact.hash,
        artifactBytes: artifact.bytes,
      })
    ) {
      throw new WorkshopInputError(
        "Zig Workshop revisions require runtime-service provider validation.",
      )
    }
    return {
      id: `strategy-revision:workshop:zig:${sourceHash}` as StrategyRevisionId,
      strategyId: WORKSHOP_STRATEGY_ID,
      source: input.source,
      sourceHash,
      sourceBytes,
      runtime: input.runtime,
      engineCompatibility: input.engineCompatibility,
      validation: input.validation,
      metadata,
    }
  }
  return buildStrategyRevision({
    source: input.source,
    strategyId: WORKSHOP_STRATEGY_ID,
    metadata,
  })
}

const pythonProviderValidationMatches = (
  metadata: StrategyRevision["metadata"] | undefined,
  source: { sourceHash: string; sourceBytes: number },
): boolean => {
  const validation = metadata?.providerValidation
  if (
    validation?.providerId !== "strategy-language-provider-python" ||
    validation.contractVersion !==
      "strategy-language-provider-contract-v1.32" ||
    validation.sourceHash !== source.sourceHash ||
    validation.sourceBytes !== source.sourceBytes
  ) {
    return false
  }
  const expected = pythonProviderValidationProof({
    providerId: validation.providerId,
    contractVersion: validation.contractVersion,
    sourceHash: source.sourceHash,
    sourceBytes: source.sourceBytes,
  })
  return expected !== null && safeEqual(validation.proof, expected)
}

const rustProviderValidationMatches = (
  metadata: StrategyRevision["metadata"] | undefined,
  source: {
    providerId?: string | undefined
    sourceHash: string
    sourceBytes: number
    artifactHash: string
    artifactBytes: number
  },
): boolean => {
  const validation = metadata?.providerValidation
  if (
    validation?.providerId !==
      (source.providerId ?? "strategy-language-provider-rust-wasi") ||
    validation.contractVersion !==
      "strategy-language-provider-contract-v1.32" ||
    validation.sourceHash !== source.sourceHash ||
    validation.sourceBytes !== source.sourceBytes ||
    validation.artifactHash !== source.artifactHash ||
    validation.artifactBytes !== source.artifactBytes
  ) {
    return false
  }
  const artifact = metadata?.compiledArtifact
  if (
    artifact === undefined ||
    artifact.bytesBase64 === undefined ||
    !artifactBytesMatch({
      bytesBase64: artifact.bytesBase64,
      hash: source.artifactHash,
      bytes: source.artifactBytes,
    })
  ) {
    return false
  }
  const expected = pythonProviderValidationProof({
    providerId: validation.providerId,
    contractVersion: validation.contractVersion,
    sourceHash: source.sourceHash,
    sourceBytes: source.sourceBytes,
    artifactHash: source.artifactHash,
    artifactBytes: source.artifactBytes,
  })
  return expected !== null && safeEqual(validation.proof, expected)
}

const artifactBytesMatch = (artifact: {
  bytesBase64: string
  hash: string
  bytes: number
}): boolean => {
  const bytes = Buffer.from(artifact.bytesBase64, "base64")
  return (
    bytes.byteLength === artifact.bytes &&
    createHash("sha256").update(bytes).digest("hex") === artifact.hash
  )
}

const providerValidationSecret = (): string =>
  process.env.COWARDS_PROVIDER_VALIDATION_SECRET?.trim() ?? ""

const pythonProviderValidationProof = (input: {
  providerId: string
  contractVersion: string
  sourceHash: string
  sourceBytes: number
  artifactHash?: string | undefined
  artifactBytes?: number | undefined
}): string | null => {
  const secret = providerValidationSecret()
  if (!secret) {
    return null
  }
  const payload = [
    input.providerId,
    input.contractVersion,
    input.sourceHash,
    String(input.sourceBytes),
    input.artifactHash ?? "",
    input.artifactBytes === undefined ? "" : String(input.artifactBytes),
  ].join("\n")
  return `hmac-sha256:${createHmac("sha256", secret)
    .update(payload)
    .digest("hex")}`
}

const safeEqual = (left: string, right: string): boolean => {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  )
}

const createWorkshopMatchSetId = (): MatchSetId =>
  `${WORKSHOP_MATCH_SET_PREFIX}${randomUUID()}` as MatchSetId

const findWorkshopOpponent = (
  opponentId: WorkshopOpponentSummary["id"],
): (typeof WORKSHOP_OPPONENTS)[number] => {
  const opponent = WORKSHOP_OPPONENTS.find(
    (candidate) => candidate.id === opponentId,
  )
  if (!opponent) {
    throw new WorkshopInputError(`Unknown Workshop opponent: ${opponentId}`)
  }
  return opponent
}

export const assertWorkshopRevisionCanBeTested = (
  revision: StrategyRevision | null,
  revisionId: StrategyRevisionId,
): StrategyRevision => {
  if (!revision) {
    throw new WorkshopInputError(`Workshop revision not found: ${revisionId}`)
  }
  if (revision.strategyId !== WORKSHOP_STRATEGY_ID) {
    throw new WorkshopInputError(
      "Workshop tests require a local Workshop revision",
    )
  }
  if (!revision.validation.valid) {
    throw new WorkshopInputError(
      "Workshop tests require a valid Strategy revision",
    )
  }
  return revision
}

export const createWorkshopTestMatchSet = async (
  pool: Pool,
  input: {
    revisionId: StrategyRevisionId
    opponentId: WorkshopOpponentSummary["id"]
    presetId: MatchSetPresetId
    matchSetId?: MatchSetId | undefined
  },
): Promise<WorkshopTestSummary & { matchIds: MatchId[] }> => {
  await ensureWorkshopSeed(pool)
  const repositories = createRepositories(pool)
  assertWorkshopRevisionCanBeTested(
    await repositories.getStrategyRevision(input.revisionId),
    input.revisionId,
  )
  const opponent = findWorkshopOpponent(input.opponentId)
  const matchSetId = input.matchSetId ?? createWorkshopMatchSetId()
  const matrix = generatePresetMatrix({
    id: matchSetId,
    presetId: input.presetId,
    bottomStrategyRevisionId: input.revisionId,
    topStrategyRevisionId: opponent.revisionId,
    bottomPlayerId: WORKSHOP_PLAYER_ID,
    topPlayerId: opponent.playerId,
  })
  const created = await createMatchSetService(pool).createFromPreset({
    id: matchSetId,
    presetId: input.presetId,
    bottomStrategyRevisionId: input.revisionId,
    topStrategyRevisionId: opponent.revisionId,
    bottomPlayerId: WORKSHOP_PLAYER_ID,
    topPlayerId: opponent.playerId,
  })
  return {
    matchSetId: created.matchSetId,
    status: "pending",
    matchIds: created.matchIds,
    matchCount: created.matchIds.length,
    matches: matrix.map((match) => ({
      matchId: match.id,
      status: "pending",
      bottomPlayerId: match.bottomPlayerId,
      topPlayerId: match.topPlayerId,
      hasReplay: false,
    })),
    scoring: { complete: false, degraded: false, rankings: [] },
  }
}

export const getWorkshopTestSummary = async (
  pool: Pool,
  matchSetId: MatchSetId,
): Promise<WorkshopTestSummary | null> => {
  if (!matchSetId.startsWith(WORKSHOP_MATCH_SET_PREFIX)) {
    return null
  }
  const matchSet = await createRepositories(pool).getMatchSet(matchSetId)
  if (!matchSet) {
    return null
  }
  const [statusResult, matches] = await Promise.all([
    refreshMatchSetStatus(pool, matchSetId),
    listMatchStatusesForSet(pool, matchSetId),
  ])
  return {
    matchSetId,
    status: statusResult.status,
    matchCount: matches.length,
    matches,
    scoring: statusResult.scoring,
  }
}

export const getWorkshopSnapshot = async (
  pool: Pool,
): Promise<WorkshopSnapshot> => ({
  templateSource: workshopTemplateSource,
  templateValidation: validateWorkshopSource(workshopTemplateSource),
  revisions: await listWorkshopRevisions(pool),
  presets: listWorkshopPresets(),
  opponents: listWorkshopOpponents(),
  templates: listWorkshopTemplates(),
  starters: listStarterStrategies(),
  advancedStrategies: listAdvancedStrategies(),
  samples: listWorkshopSamples(),
})

export const getWorkshopStaticSnapshot = (): WorkshopSnapshot => ({
  templateSource: workshopTemplateSource,
  templateValidation: validateWorkshopSource(workshopTemplateSource),
  revisions: [],
  presets: listWorkshopPresets(),
  opponents: listWorkshopOpponents(),
  templates: listWorkshopTemplates(),
  starters: listStarterStrategies(),
  advancedStrategies: listAdvancedStrategies(),
  samples: listWorkshopSamples(),
})
