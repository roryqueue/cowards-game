import { createHash } from "node:crypto"
import * as ts from "typescript"
import {
  deriveFactoryOraclePacketRoot,
  FactoryOraclePacketSchema,
  type FactoryOraclePacket,
} from "../../strategy-lab/src/factory/index.js"
import { LAB_ADMITTED_ROOTS, LAB_VERSIONS, type LabRoot } from "../../strategy-lab/src/contracts.js"

const SOURCE_BYTES = new TextEncoder()
const ROOT = /^sha256:[0-9a-f]{64}$/u
const NAME = /^[a-z][a-z0-9-]{0,95}$/u
const sourceRoot = (source: string): LabRoot => `sha256:${createHash("sha256").update(source, "utf8").digest("hex")}` as LabRoot
const fail = (code: string): never => { throw new TypeError(`TACTICAL_${code}`) }

export interface TacticalFactoryRequest {
  split: "development" | "validation" | "probe"
  doctrineFamily: string
  provider: {
    providerId: string
    /** Local deterministic optimizer provenance, not a claim of model participation. */
    modelId: string
    modelVersion: string
    settingsRoot: LabRoot
    promptRoot: LabRoot
    contextRoot: LabRoot
  }
  build: { buildRoot: LabRoot; toolchainRoot: LabRoot }
  lineage: { predecessorRoot: LabRoot; correctionRoot: LabRoot | null; retryParentRoot: LabRoot | null }
}

const sourceModules = (source: string) => {
  const ast = ts.createSourceFile("tactical-source.ts", source, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS)
  const denied = new Set(["eval", "Function", "globalThis", "process", "require", "Date", "fetch", "WebAssembly", "constructor", "__proto__", "prototype", "random"])
  const visit = (node: ts.Node) => {
    if (ts.isImportDeclaration(node) || ts.isImportEqualsDeclaration(node) || ts.isExportDeclaration(node) || ts.isAwaitExpression(node) || node.kind === ts.SyntaxKind.ImportKeyword || node.kind === ts.SyntaxKind.AsyncKeyword || node.kind === ts.SyntaxKind.ThisKeyword) fail("SOURCE_CAPABILITY")
    if (ts.isIdentifier(node) && denied.has(node.text)) fail("SOURCE_CAPABILITY")
    ts.forEachChild(node, visit)
  }
  visit(ast)
  const output = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, removeComments: true },
    reportDiagnostics: true,
  })
  if (output.diagnostics?.some((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error)) fail("SOURCE_TYPESCRIPT")
  return output.outputText.replace(/\r\n?/gu, "\n")
}

/** Static closure checking only; emitted source remains data and is never imported or executed here. */
export const assertTacticalSourceClosure = (source: string): void => {
  if (typeof source !== "string" || source.length === 0 || source.length > 65536) fail("SOURCE_SIZE")
  const compiled = sourceModules(source)
  if (!compiled.includes("export default") || /\b(?:import|eval|Function|require|process|fetch|Date|Math\.random)\b/u.test(compiled)) fail("SOURCE_CLOSURE")
}

/**
 * The leaf's closed student source mirrors the tactical selector's legal-input
 * scoring shape. It contains no dependency on the lab, engine, runtime, or
 * another oracle and is intentionally returned as hostile data only.
 */
export const emitTacticalSource = (): string => {
  const source = `
const tacticalDirections = ["UP", "RIGHT", "DOWN", "LEFT"];
const distance = (left, right) => Math.abs(left.x - right.x) + Math.abs(left.y - right.y);
const toward = (from, to, fallback) => {
  const horizontal = to.x - from.x, vertical = to.y - from.y;
  if (Math.abs(horizontal) >= Math.abs(vertical) && horizontal !== 0) return horizontal > 0 ? "RIGHT" : "LEFT";
  if (vertical !== 0) return vertical > 0 ? "DOWN" : "UP";
  return fallback;
};
const selectActivations = (input) => {
  const enemies = input.enemySoldiers.filter((soldier) => soldier.status === "ACTIVE" && soldier.position).sort((left, right) => left.id.localeCompare(right.id));
  const active = input.mySoldiers.filter((soldier) => soldier.status === "ACTIVE" && soldier.position).map((soldier) => {
    const closest = enemies.map((enemy) => ({ enemy, range: distance(soldier.position, enemy.position) })).sort((left, right) => left.range - right.range || left.enemy.id.localeCompare(right.enemy.id))[0];
    const target = closest ? closest.enemy.position : { x: Math.trunc((input.board.bounds.minX + input.board.bounds.maxX) / 2), y: Math.trunc((input.board.bounds.minY + input.board.bounds.maxY) / 2) };
    const facing = toward(soldier.position, target, soldier.facing || "UP");
    const edge = Math.min(soldier.position.x - input.board.bounds.minX, input.board.bounds.maxX - soldier.position.x, soldier.position.y - input.board.bounds.minY, input.board.bounds.maxY - soldier.position.y);
    return { soldier, target, facing, closest, score: edge * 3 - (closest ? closest.range * 4 : 0) + (input.hasRoundInitiative ? 3 : 0) };
  }).sort((left, right) => right.score - left.score || left.soldier.id.localeCompare(right.soldier.id)).slice(0, input.activationCount);
  return { activationOrders: active.map((entry) => ({ soldierId: entry.soldier.id, objective: { schemaVersion: "tactical-mission-v1", soldierId: entry.soldier.id, targetId: entry.closest ? entry.closest.enemy.id : null, goal: entry.target, goalFacing: entry.facing, posture: entry.closest ? "press" : "screen" } })), strategyMemory: { tactical: { schemaVersion: "tactical-memory-v1", algorithm: "tactical-beam-v1", selected: active.map((entry) => entry.soldier.id) } } };
};
const soldierBrain = (input) => {
  const mission = input.objective && input.objective.schemaVersion === "tactical-mission-v1" && input.objective.soldierId === input.self.id ? input.objective : null;
  const choices = tacticalDirections.flatMap((direction) => [{ type: "MOVE", direction }, { type: "TURN", direction }]).concat([{ type: "TURN_TO_STONE" }]);
  const chosen = choices.map((action, ordinal) => {
    const direction = action.type === "TURN_TO_STONE" ? (input.self.facing || "UP") : action.direction;
    const delta = direction === "UP" ? { x: 0, y: -1 } : direction === "DOWN" ? { x: 0, y: 1 } : direction === "LEFT" ? { x: -1, y: 0 } : { x: 1, y: 0 };
    const cell = action.type === "MOVE" ? input.awarenessGrid.cells.find((entry) => entry.dx === delta.x && entry.dy === delta.y) : null;
    const blocked = action.type === "MOVE" && (!cell || ["WALL", "FRIENDLY_ACTIVE", "FRIENDLY_STONE", "TERRAIN_STONE"].includes(cell.contents));
    const next = { x: input.self.position ? input.self.position.x + (action.type === "MOVE" ? delta.x : 0) : 0, y: input.self.position ? input.self.position.y + (action.type === "MOVE" ? delta.y : 0) : 0 };
    const score = (blocked ? -100 : 0) + (action.type === "MOVE" && input.hasAdvancedThisActivation ? -20 : 0) + (cell && cell.contents === "ENEMY_ACTIVE" ? 12 : 0) + (mission && mission.goalFacing === direction ? 6 : 0) - (mission && input.self.position ? distance(next, mission.goal) * 3 : 0) + (action.type === "MOVE" ? 4 : 0);
    return { action, score, ordinal };
  }).sort((left, right) => right.score - left.score || left.ordinal - right.ordinal)[0];
  return { action: chosen.action, soldierMemory: { tactical: { schemaVersion: "tactical-brain-v1", posture: mission ? mission.posture : "screen", cycle: input.cycleIndex } } };
};
export default { selectActivations, soldierBrain };
`
  assertTacticalSourceClosure(source)
  return sourceModules(source)
}

const validRoot = (value: unknown): value is LabRoot => typeof value === "string" && ROOT.test(value)
const requestIsValid = (request: TacticalFactoryRequest): void => {
  if (!NAME.test(request.doctrineFamily) || !["development", "validation", "probe"].includes(request.split)) fail("REQUEST")
  const provider = request.provider
  if (!NAME.test(provider.providerId) || typeof provider.modelId !== "string" || provider.modelId.length === 0 || provider.modelId.length > 128 || typeof provider.modelVersion !== "string" || provider.modelVersion.length === 0 || provider.modelVersion.length > 128 || ![provider.settingsRoot, provider.promptRoot, provider.contextRoot].every(validRoot)) fail("PROVENANCE")
  if (![request.build.buildRoot, request.build.toolchainRoot, request.lineage.predecessorRoot].every(validRoot) || ![request.lineage.correctionRoot, request.lineage.retryParentRoot].every((value) => value === null || validRoot(value))) fail("REQUEST")
}

/** Produces a strict root-bound packet as data for later factory admission. */
export const emitTacticalFactoryPacket = (request: TacticalFactoryRequest): FactoryOraclePacket => {
  requestIsValid(request)
  const source = emitTacticalSource()
  const identity = sourceRoot(source)
  const packet = {
    schemaVersion: "factory-oracle-packet-v1" as const,
    privacy: "private_offline" as const,
    root: identity,
    oracleFamily: "tactical-oracle",
    doctrineFamily: request.doctrineFamily,
    source: { root: identity, sha256: identity, byteLength: SOURCE_BYTES.encode(source).byteLength, encoding: "utf8" as const },
    provider: request.provider,
    inheritedAuthority: {
      admittedRoot: LAB_ADMITTED_ROOTS.currentStartRoot,
      sourceClosureRoot: LAB_ADMITTED_ROOTS.sourceClosureRoot,
      compatibilityTupleRoot: LAB_ADMITTED_ROOTS.tupleRoot,
      runtimeProfileRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot,
      runtimeAbi: LAB_VERSIONS.runtimeAbi,
      labSchema: LAB_VERSIONS.schema,
    },
    build: { ...request.build, compatibilityTupleRoot: LAB_ADMITTED_ROOTS.tupleRoot },
    versions: { factory: "factory-v1" as const, algorithm: "tactical-optimizer-v1", schema: "factory-schema-v1" as const },
    nativeLane: { language: "typescript" as const, providerId: request.provider.providerId, runtimeAbi: LAB_VERSIONS.runtimeAbi, runtimeProfileRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot, translation: "none" as const },
    lineage: request.lineage,
    split: request.split,
  }
  return FactoryOraclePacketSchema.parse({ ...packet, root: deriveFactoryOraclePacketRoot(packet) })
}
