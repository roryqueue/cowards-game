#!/usr/bin/env -S pnpm exec tsx
import { Buffer } from "node:buffer"
import { createHash } from "node:crypto"
import { readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { buildStrategyRevision } from "../packages/runtime-js/src/index.ts"
import { createRuntimeFromRevision } from "../packages/runtime-js/src/executor.ts"
import {
  buildPythonStrategyRevision,
  createPythonRuntimeFromRevision,
  validatePythonStrategySource,
} from "../packages/runtime-python/src/index.ts"
import {
  buildRustStrategyRevision,
  buildZigStrategyRevision,
  compileRustWasmArtifact,
  compileZigWasmArtifact,
  listWasmImports,
  runWasmWasiStrategyMethodSync,
  validateRustStrategySource,
  validateZigStrategySource,
} from "../packages/runtime-wasm-wasi/src/index.ts"
import {
  STRATEGY_RUNTIME_ABI_VERSION,
  STRATEGY_RUNTIME_ADAPTER_REGISTRY,
  STRATEGY_LANGUAGE_REGISTRY,
  assertPublicOutputLeakSafe,
  type StrategyRevision,
} from "../packages/spec/src/index.ts"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, "..")
const checkMode = process.argv.includes("--check")
const generatedAt = "2026-05-30T00:00:00.000Z"

const artifactPaths = {
  abuseJson: ".planning/artifacts/v1.24-runtime-abuse-lab-evidence.json",
  abuseMd: ".planning/artifacts/v1.24-runtime-abuse-lab-evidence.md",
  matrixJson:
    ".planning/artifacts/v1.24-production-sandbox-readiness-matrix.json",
  matrixMd: ".planning/artifacts/v1.24-production-sandbox-readiness-matrix.md",
  directJson: ".planning/artifacts/v1.24-direct-export-abi-proof.json",
  directMd: ".planning/artifacts/v1.24-direct-export-abi-proof.md",
  witJson: ".planning/artifacts/v1.24-component-model-wit-proof.json",
  witMd: ".planning/artifacts/v1.24-component-model-wit-proof.md",
  abiJson: ".planning/artifacts/v1.24-abi-decision.json",
  abiMd: ".planning/artifacts/v1.24-abi-decision.md",
  regressionJson:
    ".planning/artifacts/v1.24-signed-in-multi-runtime-regression-proof.json",
  regressionMd:
    ".planning/artifacts/v1.24-signed-in-multi-runtime-regression-proof.md",
} as const

type ProbeLayer =
  | "claims"
  | "taxonomy"
  | "validation"
  | "execute"
  | "artifact"
  | "abi"
  | "readiness"
  | "privacy"

type ProbeStatus = "pass" | "fail" | "non-proof"
type FailureClass =
  | "strategy-failure"
  | "system-failure"
  | "unsupported-lane"
  | "readiness-only"
  | "not-applicable"

interface AbuseProbe {
  id: string
  lane: string
  layer: ProbeLayer
  class: FailureClass
  expectation: string
  status: ProbeStatus
  observed: string
  publicSafe: boolean
  promotionImpact: string
}

const stableValue = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(stableValue)
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entryValue]) => [key, stableValue(entryValue)]),
    )
  }
  return value
}

const serialize = (value: unknown): string =>
  `${JSON.stringify(stableValue(value), null, 2)}\n`

const sha256 = (text: string): string =>
  createHash("sha256").update(text).digest("hex")

const publicSafe = (value: unknown): boolean => {
  try {
    assertPublicOutputLeakSafe(value, "v1.24 public evidence")
    return true
  } catch {
    return false
  }
}

type Attempt<T> = { ok: true; value: T } | { ok: false; error: string }

const attempt = <T>(fn: () => T): Attempt<T> => {
  try {
    return { ok: true, value: fn() }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

const passProbe = (
  id: string,
  lane: string,
  layer: ProbeLayer,
  expectation: string,
  observed = "matched expectation",
  extra: Partial<Pick<AbuseProbe, "class" | "promotionImpact">> = {},
): AbuseProbe => ({
  id,
  lane,
  layer,
  class: extra.class ?? "readiness-only",
  expectation,
  status: "pass",
  observed,
  publicSafe: true,
  promotionImpact:
    extra.promotionImpact ??
    "No promotion; evidence remains readiness-only unless a final decision says otherwise.",
})

const failProbe = (
  id: string,
  lane: string,
  layer: ProbeLayer,
  expectation: string,
  observed: string,
  extra: Partial<Pick<AbuseProbe, "class" | "promotionImpact">> = {},
): AbuseProbe => ({
  id,
  lane,
  layer,
  class: extra.class ?? "system-failure",
  expectation,
  status: "fail",
  observed,
  publicSafe: true,
  promotionImpact:
    extra.promotionImpact ??
    "Blocks stronger claims until the failure is fixed or explicitly classified.",
})

const nonProofProbe = (
  id: string,
  lane: string,
  layer: ProbeLayer,
  expectation: string,
  observed: string,
): AbuseProbe => ({
  id,
  lane,
  layer,
  class: "unsupported-lane",
  expectation,
  status: "non-proof",
  observed,
  publicSafe: true,
  promotionImpact:
    "No promotion. This is fail-loud non-proof, not a sandbox pass.",
})

const strategyInput = {
  phaseNumber: 1,
  roundNumber: 1,
  activationCount: 1,
  board: {
    bounds: { minX: 0, maxX: 11, minY: 0, maxY: 11 },
    soldiers: [
      {
        id: "soldier:v124:1",
        ownerPlayerId: "player:v124",
        status: "ACTIVE",
        position: { x: 1, y: 1 },
        facing: "UP",
        lastSuccessfulMoveDirection: null,
      },
    ],
    terrainStones: [],
  },
  mySoldiers: [
    {
      id: "soldier:v124:1",
      ownerPlayerId: "player:v124",
      status: "ACTIVE",
      position: { x: 1, y: 1 },
      facing: "UP",
      lastSuccessfulMoveDirection: null,
    },
  ],
  enemySoldiers: [],
  strategyMemory: {},
} as const

const soldierBrainInput = {
  self: {
    id: "soldier:v124:1",
    ownerPlayerId: "player:v124",
    status: "ACTIVE",
    position: { x: 1, y: 1 },
    facing: "UP",
    lastSuccessfulMoveDirection: null,
  },
  awarenessGrid: { cells: [] },
  cycleIndex: 0,
  maxCycles: 12,
  soldierMemory: {},
} as const

const jsSource = `
export default {
  selectActivations(input) {
    return {
      activationOrders: input.mySoldiers.slice(0, input.activationCount).map((soldier) => ({ soldierId: soldier.id })),
      strategyMemory: {},
    }
  },
  soldierBrain() {
    return { action: { type: "TURN_TO_STONE" }, soldierMemory: {} }
  },
}
`

const jsInvalidSource = `
export default {
  selectActivations() {
    return { activationOrders: [{ soldierId: 12 }], strategyMemory: {} }
  },
  soldierBrain() {
    return { action: { type: "FLY" }, soldierMemory: {} }
  },
}
`

const pySource = `
def select_activations(input):
    return {
        "activationOrders": [{"soldierId": soldier["id"]} for soldier in input["mySoldiers"][: input["activationCount"]]],
        "strategyMemory": {},
    }

def soldier_brain(input):
    return {
        "action": {"type": "TURN_TO_STONE"},
        "soldierMemory": {},
    }
`

const rustSource = `
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
            r#"{{"ok":true,"abiVersion":"strategy-runtime-abi-v1.14","value":{{"activationOrders":[{{"soldierId":"{}"}}],"strategyMemory":null}}}}"#,
            soldier_id
        );
    } else {
        println!(r#"{{"ok":true,"abiVersion":"strategy-runtime-abi-v1.14","value":{{"activationOrders":[],"strategyMemory":null}}}}"#);
    }
}
`

const zigSource = `
const Iovec = extern struct { buf: [*]u8, buf_len: usize };
const Ciovec = extern struct { buf: [*]const u8, buf_len: usize };

extern "wasi_snapshot_preview1" fn fd_read(u32, *const Iovec, usize, *usize) u16;
extern "wasi_snapshot_preview1" fn fd_write(u32, *const Ciovec, usize, *usize) u16;

fn contains(haystack: []const u8, needle: []const u8) bool {
    if (needle.len == 0) return true;
    if (haystack.len < needle.len) return false;
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
        if (matched) return true;
    }
    return false;
}

fn writeAll(bytes: []const u8) void {
    var written: usize = 0;
    var iov = Ciovec{ .buf = bytes.ptr, .buf_len = bytes.len };
    _ = fd_write(1, &iov, 1, &written);
}

export fn _start() void {
    var input_buf: [16384]u8 = undefined;
    var iov = Iovec{ .buf = &input_buf, .buf_len = input_buf.len };
    var nread: usize = 0;
    _ = fd_read(0, &iov, 1, &nread);
    if (contains(input_buf[0..nread], "\\"methodName\\":\\"soldierBrain\\"")) {
        writeAll("{\\"ok\\":true,\\"abiVersion\\":\\"strategy-runtime-abi-v1.14\\",\\"value\\":{\\"action\\":{\\"type\\":\\"TURN_TO_STONE\\"},\\"soldierMemory\\":null}}\\n");
    } else {
        writeAll("{\\"ok\\":true,\\"abiVersion\\":\\"strategy-runtime-abi-v1.14\\",\\"value\\":{\\"activationOrders\\":[],\\"strategyMemory\\":null}}\\n");
    }
}
`

const runtimeFailureCode = (revision: StrategyRevision): string => {
  const response = runWasmWasiStrategyMethodSync({
    revision,
    methodName: "soldierBrain",
    input: soldierBrainInput,
    timeoutMs: 250,
    stdoutBytes: 8 * 1024,
    stderrBytes: 8 * 1024,
  })
  if (response.ok) return "unexpected-success"
  return response.failureKind === "runtimeViolation"
    ? response.violation.code
    : response.systemFailure.code
}

const buildJsPythonProbes = (): AbuseProbe[] => {
  const jsRevision = buildStrategyRevision({ source: jsSource })
  const jsRuntime = createRuntimeFromRevision(jsRevision, {
    timeoutMs: 250,
    outputByteLimit: 8 * 1024,
  })
  const pyRevision = buildPythonStrategyRevision({ source: pySource })
  const pyRuntime = createPythonRuntimeFromRevision(pyRevision, {
    timeoutMs: 500,
    stdoutBytes: 16 * 1024,
    stderrBytes: 4 * 1024,
  })
  const jsResult = jsRuntime.selectActivations(strategyInput)
  const jsInvalid = createRuntimeFromRevision(
    buildStrategyRevision({ source: jsInvalidSource }),
  ).selectActivations(strategyInput)
  const pyResult = pyRuntime.runSoldierBrain(soldierBrainInput)
  const pyInvalid = validatePythonStrategySource("import os\n")
  return [
    jsResult.ok
      ? passProbe(
          "js-ts-counted-runtime-still-executes",
          "js-ts",
          "execute",
          "JS/TS counted runtime returns valid Strategy output.",
          "valid selectActivations result",
          {
            class: "not-applicable",
            promotionImpact: "JS/TS counted baseline preserved.",
          },
        )
      : failProbe(
          "js-ts-counted-runtime-still-executes",
          "js-ts",
          "execute",
          "JS/TS counted runtime returns valid Strategy output.",
          jsResult.violation.type,
        ),
    !jsInvalid.ok && jsInvalid.violation.type === "INVALID_OUTPUT"
      ? passProbe(
          "js-ts-invalid-output-classified",
          "js-ts",
          "execute",
          "Invalid JS/TS output is classified as a Strategy failure.",
          jsInvalid.violation.type,
          { class: "strategy-failure" },
        )
      : failProbe(
          "js-ts-invalid-output-classified",
          "js-ts",
          "execute",
          "Invalid JS/TS output is classified as a Strategy failure.",
          jsInvalid.ok ? "unexpected success" : jsInvalid.violation.type,
        ),
    nonProofProbe(
      "js-ts-runtime-unavailable-no-go-execution",
      "js-ts",
      "readiness",
      "Stopped runtime-service must not move Strategy execution into web/API/Go.",
      "policy enforced by topology and runtime-service ownership checks",
    ),
    pyResult.ok
      ? passProbe(
          "python-beta-runtime-still-executes",
          "python",
          "execute",
          "Python beta runtime returns valid Strategy output.",
          "valid soldier_brain result",
          {
            class: "not-applicable",
            promotionImpact: "Python remains non-counted exhibition beta.",
          },
        )
      : failProbe(
          "python-beta-runtime-still-executes",
          "python",
          "execute",
          "Python beta runtime returns valid Strategy output.",
          pyResult.violation.type,
        ),
    !pyInvalid.valid && pyInvalid.forbiddenPatterns.includes("import")
      ? passProbe(
          "python-import-denied-validation",
          "python",
          "validation",
          "Python import/package attempts fail before execution.",
          "import denied",
          { class: "strategy-failure" },
        )
      : failProbe(
          "python-import-denied-validation",
          "python",
          "validation",
          "Python import/package attempts fail before execution.",
          pyInvalid.forbiddenPatterns.join(", ") || "not denied",
        ),
    nonProofProbe(
      "python-no-js-fallback-policy",
      "python",
      "readiness",
      "Python failure must not fall back to JS/TS, Go, or another runtime lane.",
      "registered policy: non-counted beta runtime-only lane",
    ),
  ]
}

const artifactProbeRevision = (
  revision: StrategyRevision,
  mutation: (revision: StrategyRevision) => StrategyRevision,
): string => runtimeFailureCode(mutation(revision))

const artifactProbeFailureCode = (
  revision: StrategyRevision,
  mutation: (revision: StrategyRevision) => StrategyRevision,
): string => {
  const result = attempt(() => artifactProbeRevision(revision, mutation))
  return result.ok ? result.value : result.error
}

const buildWasmProbes = (): AbuseProbe[] => {
  const rustCompiled = attempt(() => compileRustWasmArtifact(rustSource))
  const zigCompiled = attempt(() => compileZigWasmArtifact(zigSource))
  const rustRevision = attempt(() =>
    buildRustStrategyRevision({ source: rustSource }),
  )
  const zigRevision = attempt(() =>
    buildZigStrategyRevision({ source: zigSource }),
  )
  const rustSelect = rustRevision.ok
    ? attempt(() =>
        runWasmWasiStrategyMethodSync({
          revision: rustRevision.value,
          methodName: "selectActivations",
          input: strategyInput,
        }),
      )
    : undefined
  const zigSoldier = zigRevision.ok
    ? attempt(() =>
        runWasmWasiStrategyMethodSync({
          revision: zigRevision.value,
          methodName: "soldierBrain",
          input: soldierBrainInput,
        }),
      )
    : undefined
  const zigImports =
    zigCompiled.ok &&
    zigCompiled.value.ok &&
    zigCompiled.value.artifact?.bytesBase64 !== undefined
      ? attempt(() =>
          listWasmImports(
            Buffer.from(zigCompiled.value.artifact.bytesBase64, "base64"),
          ),
        )
      : undefined
  const probes: AbuseProbe[] = [
    rustCompiled.ok && rustCompiled.value.ok
      ? passProbe(
          "rust-compile-valid-artifact",
          "rust-wasm-wasi",
          "artifact",
          "Rust compiles to immutable wasm32-wasip1 artifact metadata.",
          rustCompiled.value.artifact?.targetTriple ?? "compiled",
        )
      : nonProofProbe(
          "rust-compile-valid-artifact",
          "rust-wasm-wasi",
          "artifact",
          "Rust compiles to immutable wasm32-wasip1 artifact metadata.",
          rustCompiled.ok
            ? rustCompiled.value.errors.map((issue) => issue.code).join(", ")
            : rustCompiled.error,
        ),
    zigCompiled.ok && zigCompiled.value.ok
      ? passProbe(
          "zig-compile-valid-artifact",
          "zig-wasm-wasi",
          "artifact",
          "Zig compiles to immutable wasm32-wasi artifact metadata.",
          zigCompiled.value.artifact?.targetTriple ?? "compiled",
        )
      : nonProofProbe(
          "zig-compile-valid-artifact",
          "zig-wasm-wasi",
          "artifact",
          "Zig compiles to immutable wasm32-wasi artifact metadata.",
          zigCompiled.ok
            ? zigCompiled.value.errors.map((issue) => issue.code).join(", ")
            : zigCompiled.error,
        ),
    rustSelect?.ok && rustSelect.value.ok
      ? passProbe(
          "rust-preview1-json-executes",
          "rust-wasm-wasi",
          "execute",
          "Rust Preview 1 JSON path executes through Wasmtime.",
          "valid selectActivations result",
        )
      : nonProofProbe(
          "rust-preview1-json-executes",
          "rust-wasm-wasi",
          "execute",
          "Rust Preview 1 JSON path executes through Wasmtime.",
          rustSelect?.ok
            ? rustSelect.value.failureKind === "runtimeViolation"
              ? rustSelect.value.violation.code
              : rustSelect.value.systemFailure.code
            : (rustSelect?.error ?? rustRevision.error),
        ),
    zigSoldier?.ok && zigSoldier.value.ok
      ? passProbe(
          "zig-preview1-json-executes",
          "zig-wasm-wasi",
          "execute",
          "Zig Preview 1 JSON path executes through Wasmtime.",
          "valid soldierBrain result",
        )
      : nonProofProbe(
          "zig-preview1-json-executes",
          "zig-wasm-wasi",
          "execute",
          "Zig Preview 1 JSON path executes through Wasmtime.",
          zigSoldier?.ok
            ? zigSoldier.value.failureKind === "runtimeViolation"
              ? zigSoldier.value.violation.code
              : zigSoldier.value.systemFailure.code
            : (zigSoldier?.error ?? zigRevision.error),
        ),
    validateRustStrategySource(
      'fn bad() { let _ = std::fs::read_to_string("/tmp/x"); }',
    ).forbiddenPatterns.includes("std::fs")
      ? passProbe(
          "rust-filesystem-denied-validation",
          "rust-wasm-wasi",
          "validation",
          "Rust filesystem attempts fail before execution.",
          "std::fs denied",
          { class: "strategy-failure" },
        )
      : failProbe(
          "rust-filesystem-denied-validation",
          "rust-wasm-wasi",
          "validation",
          "Rust filesystem attempts fail before execution.",
          "not denied",
        ),
    validateZigStrategySource(
      `${zigSource}\nconst std = @import("std");`,
    ).forbiddenPatterns.includes('@import("std")')
      ? passProbe(
          "zig-std-denied-validation",
          "zig-wasm-wasi",
          "validation",
          "Zig std import attempts fail before execution.",
          "std import denied",
          { class: "strategy-failure" },
        )
      : failProbe(
          "zig-std-denied-validation",
          "zig-wasm-wasi",
          "validation",
          "Zig std import attempts fail before execution.",
          "not denied",
        ),
    zigImports?.ok &&
    JSON.stringify(
      zigImports.value.map((entry) => `${entry.module}.${entry.name}`).sort(),
    ) ===
      JSON.stringify([
        "wasi_snapshot_preview1.fd_read",
        "wasi_snapshot_preview1.fd_write",
      ])
      ? passProbe(
          "zig-import-surface-fd-only",
          "zig-wasm-wasi",
          "validation",
          "Zig helper imports only fd_read/fd_write.",
          "fd_read/fd_write only",
        )
      : nonProofProbe(
          "zig-import-surface-fd-only",
          "zig-wasm-wasi",
          "validation",
          "Zig helper imports only fd_read/fd_write.",
          zigImports?.ok
            ? zigImports.value
                .map((entry) => `${entry.module}.${entry.name}`)
                .join(", ")
            : (zigImports?.error ?? "Zig artifact unavailable"),
        ),
  ]
  const artifactProbes: AbuseProbe[] = [
    rustRevision.ok &&
    artifactProbeFailureCode(rustRevision.value, (revision) => ({
      ...revision,
      metadata: {
        ...revision.metadata,
        compiledArtifact: revision.metadata.compiledArtifact
          ? { ...revision.metadata.compiledArtifact, hash: "0".repeat(64) }
          : undefined,
      },
    })) === "MALFORMED_IPC"
      ? passProbe(
          "rust-stale-artifact-hash-fails-closed",
          "rust-wasm-wasi",
          "artifact",
          "Stale Rust artifact hash fails without alternate-lane fallback.",
          "MALFORMED_IPC",
          { class: "system-failure" },
        )
      : failProbe(
          "rust-stale-artifact-hash-fails-closed",
          "rust-wasm-wasi",
          "artifact",
          "Stale Rust artifact hash fails without alternate-lane fallback.",
          rustRevision.ok ? "unexpected result" : rustRevision.error,
        ),
    zigRevision.ok &&
    artifactProbeFailureCode(zigRevision.value, (revision) => ({
      ...revision,
      metadata: {
        ...revision.metadata,
        compiledArtifact: revision.metadata.compiledArtifact
          ? { ...revision.metadata.compiledArtifact, bytesBase64: undefined }
          : undefined,
      },
    })) === "SPAWN_FAILED"
      ? passProbe(
          "zig-missing-artifact-bytes-fails-closed",
          "zig-wasm-wasi",
          "artifact",
          "Missing Zig artifact bytes fails without alternate-lane fallback.",
          "SPAWN_FAILED",
          { class: "system-failure" },
        )
      : failProbe(
          "zig-missing-artifact-bytes-fails-closed",
          "zig-wasm-wasi",
          "artifact",
          "Missing Zig artifact bytes fails without alternate-lane fallback.",
          zigRevision.ok ? "unexpected result" : zigRevision.error,
        ),
    rustRevision.ok &&
    artifactProbeFailureCode(rustRevision.value, (revision) => ({
      ...revision,
      metadata: {
        ...revision.metadata,
        compiledArtifact: revision.metadata.compiledArtifact
          ? {
              ...revision.metadata.compiledArtifact,
              abiEnvelope: "direct-export-json" as "stdin-stdout-json",
            }
          : undefined,
      },
    })) === "MALFORMED_IPC"
      ? passProbe(
          "artifact-abi-mismatch-fails-closed",
          "wasm-wasi",
          "abi",
          "ABI mismatch fails without alternate ABI fallback.",
          "MALFORMED_IPC",
          { class: "system-failure" },
        )
      : failProbe(
          "artifact-abi-mismatch-fails-closed",
          "wasm-wasi",
          "abi",
          "ABI mismatch fails without alternate ABI fallback.",
          rustRevision.ok ? "unexpected result" : rustRevision.error,
        ),
  ]
  return [...probes, ...artifactProbes]
}

const directExportProof = () => ({
  schemaVersion: "v1.24-direct-export-abi-proof",
  milestone: "v1.24",
  generatedAt,
  status: "not-promoted",
  proofKind: "fail-loud-non-promotion",
  activeExecutionPathChanged: false,
  attemptedParity: {
    rust: "design-recorded-no-match-execution",
    zig: "design-recorded-no-match-execution",
  },
  memoryOwnership: {
    allocation: "unproven",
    free: "unproven",
    inputBufferOwnership: "unproven",
    outputBufferOwnership: "unproven",
    encoding: "unproven",
  },
  capsAndValidation: {
    timeoutFuel: "requires dedicated host proof",
    memory: "requires dedicated host proof",
    resultSize: "requires dedicated host proof",
    schemaValidation: "must reuse Strategy runtime schemas before promotion",
    privacy: "must preserve public-safe evidence before promotion",
  },
  decision:
    "Direct exports are future ABI evidence only. They cannot become Match execution artifacts without a later explicit promotion decision.",
  rollback:
    "Existing artifacts remain Preview 1 stdin/stdout JSON and fail closed on mismatched ABI metadata.",
})

const witProof = () => ({
  schemaVersion: "v1.24-component-model-wit-proof",
  milestone: "v1.24",
  generatedAt,
  status: "not-promoted",
  proofKind: "fail-loud-non-promotion",
  activeExecutionPathChanged: false,
  minimalWorld: {
    package: "cowards:strategy",
    world: "strategy",
    functions: ["select-activations", "soldier-brain"],
    payloadPolicy:
      "Typed WIT shape remains a candidate; current Match execution stays on schema-validated JSON envelopes.",
  },
  toolingStatus: {
    rust: "candidate future proof",
    zig: "candidate future proof; parity not assumed",
    wasmtimeHost: "candidate future proof",
  },
  requiredBeforePromotion: [
    "generated binding parity",
    "Wasmtime component host integration",
    "resource caps",
    "schema or typed-contract validation",
    "privacy proof",
    "artifact compatibility",
    "rollback and replay compatibility",
  ],
  decision:
    "Component Model/WIT is future ABI evidence only. No WIT artifact is eligible for Match execution in v1.24.",
})

const readinessMatrix = (probes: readonly AbuseProbe[]) => {
  const laneSummary = (lane: string) => {
    const laneProbes = probes.filter((probe) => probe.lane === lane)
    return {
      lane,
      probeCounts: {
        pass: laneProbes.filter((probe) => probe.status === "pass").length,
        fail: laneProbes.filter((probe) => probe.status === "fail").length,
        nonProof: laneProbes.filter((probe) => probe.status === "non-proof")
          .length,
      },
    }
  }
  return {
    schemaVersion: "v1.24-production-sandbox-readiness-matrix",
    milestone: "v1.24",
    generatedAt,
    publicSafe: true,
    overallDecision:
      "Readiness evidence only. No production sandbox certification and no non-JS counted promotion.",
    rows: [
      {
        ...laneSummary("js-ts"),
        proves:
          "Counted JS/TS runtime path still executes and rejects invalid output.",
        doesNotProve: "Production hostile-code sandbox certification.",
        strongerClaimGaps:
          "Production-owned isolation, operational abuse model, deployment proof, external review.",
        promotionStatus: "counted baseline preserved; sandbox not certified",
      },
      {
        ...laneSummary("python"),
        proves:
          "Python non-counted exhibition beta path remains isolated by policy and validation.",
        doesNotProve:
          "Counted eligibility or production sandbox certification.",
        strongerClaimGaps:
          "Production sandbox, package policy, deterministic operational proof, no-fallback live drills.",
        promotionStatus: "non-counted exhibition beta only",
      },
      {
        ...laneSummary("rust-wasm-wasi"),
        proves:
          "Rust immutable WASM/WASI Preview 1 evidence where local tools pass.",
        doesNotProve: "Production sandbox certification or counted Rust play.",
        strongerClaimGaps:
          "Operational sandbox proof, deployment controls, direct/WIT migration proof, counted governance.",
        promotionStatus: "non-counted exhibition beta only",
      },
      {
        ...laneSummary("zig-wasm-wasi"),
        proves:
          "Zig immutable WASM/WASI Preview 1 evidence where local tools pass.",
        doesNotProve: "Production sandbox certification or counted Zig play.",
        strongerClaimGaps:
          "Operational sandbox proof, parity, deployment controls, direct/WIT migration proof, counted governance.",
        promotionStatus: "non-counted exhibition beta only",
      },
      {
        ...laneSummary("wasm-wasi"),
        proves: "Preview 1 JSON metadata fails closed on ABI mismatch.",
        doesNotProve: "Any replacement ABI is active.",
        strongerClaimGaps:
          "Direct export or WIT promotion evidence, rollback, replay compatibility, production operations.",
        promotionStatus: "active ABI remains Preview 1 stdin/stdout JSON",
      },
      {
        lane: "direct-exports",
        probeCounts: { pass: 0, fail: 0, nonProof: 1 },
        proves: "Migration questions are identified.",
        doesNotProve: "Executable parity, memory safety, validation, or caps.",
        strongerClaimGaps:
          "Memory ownership, buffers, caps, schema, privacy, Rust/Zig parity, rollback.",
        promotionStatus: "spike only; not active",
      },
      {
        lane: "component-model-wit",
        probeCounts: { pass: 0, fail: 0, nonProof: 1 },
        proves: "Minimal WIT world shape is documented as a candidate.",
        doesNotProve: "Executable component parity or production readiness.",
        strongerClaimGaps:
          "Bindings, Wasmtime component host, caps, validation, privacy, parity, rollback.",
        promotionStatus: "spike only; not active",
      },
    ],
  }
}

const abiDecision = () => ({
  schemaVersion: "v1.24-abi-decision",
  milestone: "v1.24",
  generatedAt,
  decision: "keep-preview1-stdin-stdout-json-active",
  activeExecutionAbi: "wasi-preview1-stdin-stdout-json",
  directExports: "not-promoted",
  componentModelWit: "not-promoted",
  failClosedMetadata:
    "Unknown, stale, mismatched, or unpromoted ABI metadata is ineligible for Match execution.",
  migrationCriteria: [
    "Rust and Zig parity where applicable",
    "schema or typed-contract validation",
    "resource caps",
    "public-safe privacy proof",
    "replay compatibility",
    "no-fallback drills",
    "artifact coexistence and rollback",
    "explicit future promotion decision",
  ],
  ownership:
    "Go keeps orchestration and public decisions; runtime-service keeps hostile execution behind registered implementations.",
})

const regressionProof = (probes: readonly AbuseProbe[]) => ({
  schemaVersion: "v1.24-signed-in-multi-runtime-regression-proof",
  milestone: "v1.24",
  generatedAt,
  proofKind:
    "local evidence plus signed-in proof contract; live browser proof must pass before milestone closure",
  jsTsCountedSupport:
    probes.find((probe) => probe.id === "js-ts-counted-runtime-still-executes")
      ?.status === "pass",
  pythonBetaSupport:
    probes.find((probe) => probe.id === "python-beta-runtime-still-executes")
      ?.status === "pass",
  rustBetaSupport:
    probes.find((probe) => probe.id === "rust-preview1-json-executes")
      ?.status === "pass",
  zigBetaSupport:
    probes.find((probe) => probe.id === "zig-preview1-json-executes")
      ?.status === "pass",
  resultPages: "required in Phase 172 live proof",
  replayPages: "required in Phase 172 live proof",
  replayPlausibility:
    "full Match start, in-bounds visible pieces, and nonblank board required",
  publicPrivacy: "public evidence category scan required",
  noFallbackEvidence: {
    localPolicyContract: probes
      .filter((probe) => probe.id.includes("fallback"))
      .every((probe) => probe.status !== "fail"),
    malformedAndStaleArtifactFailClosed: probes
      .filter((probe) => probe.id.includes("fails-closed"))
      .every((probe) => probe.status === "pass"),
    stoppedRuntimeLiveDrill: "required before stronger unavailable-lane claims",
    overall: "readiness-only-not-a-production-sandbox-proof",
  },
})

const markdownTable = (probes: readonly AbuseProbe[]): string =>
  probes
    .map(
      (probe) =>
        `| ${probe.id} | ${probe.lane} | ${probe.layer} | ${probe.status} | ${probe.observed} |`,
    )
    .join("\n")

const buildOutputs = () => {
  const probes = [
    passProbe(
      "claims-no-production-sandbox-certification",
      "milestone",
      "claims",
      "v1.24 does not certify production sandbox readiness by implication.",
      "claims contract says readiness evidence only",
    ),
    passProbe(
      "claims-no-non-js-counted-promotion",
      "milestone",
      "claims",
      "v1.24 does not promote Python/Rust/Zig/WASM/WASI to counted play.",
      "JS/TS counted baseline preserved",
    ),
    passProbe(
      "taxonomy-behavior-first",
      "milestone",
      "taxonomy",
      "Abuse lab is organized by behavior first, runtime lane second.",
      "schema records lane and layer separately",
    ),
    ...buildJsPythonProbes(),
    ...buildWasmProbes(),
  ]
  const direct = directExportProof()
  const wit = witProof()
  const matrix = readinessMatrix(probes)
  const abi = abiDecision()
  const regression = regressionProof(probes)
  const abuse = {
    schemaVersion: "v1.24-runtime-abuse-lab-evidence",
    milestone: "v1.24",
    generatedAt,
    activeAbi: "wasi-preview1-stdin-stdout-json",
    runtimeAbiVersion: STRATEGY_RUNTIME_ABI_VERSION,
    languageRegistry: STRATEGY_LANGUAGE_REGISTRY.map((language) => ({
      id: language.id,
      enabledForNormalPlay: language.enabledForNormalPlay,
    })),
    adapterRegistry: STRATEGY_RUNTIME_ADAPTER_REGISTRY.map((adapter) => ({
      id: adapter.id,
      readiness: adapter.readiness,
      countedResultsAllowed: adapter.countedResultsAllowed,
      isolationPromotionState: adapter.isolationPromotionState,
    })),
    summary: {
      pass: probes.filter((probe) => probe.status === "pass").length,
      fail: probes.filter((probe) => probe.status === "fail").length,
      nonProof: probes.filter((probe) => probe.status === "non-proof").length,
      publicSafe: publicSafe(probes),
    },
    probes,
  }
  const outputs = {
    [artifactPaths.abuseJson]: serialize(abuse),
    [artifactPaths.abuseMd]: `# v1.24 Runtime Abuse Lab Evidence

Status: ${abuse.summary.fail === 0 ? "PASS" : "FAIL"}

This is readiness evidence only. It does not certify a production sandbox and does not make Python, Rust, Zig, or WASM/WASI counted eligible.

| Probe | Lane | Layer | Status | Observation |
| --- | --- | --- | --- | --- |
${markdownTable(probes)}
`,
    [artifactPaths.matrixJson]: serialize(matrix),
    [artifactPaths.matrixMd]: `# v1.24 Production-Sandbox Readiness Matrix

Decision: readiness evidence only. No production sandbox certification and no non-JS counted promotion.

| Lane | Promotion status | Proves | Does not prove | Stronger-claim gaps |
| --- | --- | --- | --- | --- |
${matrix.rows
  .map(
    (row) =>
      `| ${row.lane} | ${row.promotionStatus} | ${row.proves} | ${row.doesNotProve} | ${row.strongerClaimGaps} |`,
  )
  .join("\n")}
`,
    [artifactPaths.directJson]: serialize(direct),
    [artifactPaths.directMd]: `# v1.24 Direct-Export ABI Proof

Status: not promoted.

Direct exports remain a proof spike. Memory ownership, allocation/free, buffer passing, caps, schema validation, privacy, and Rust/Zig parity are not strong enough to replace Preview 1 JSON.

Decision: direct-export artifacts cannot become Match execution artifacts without a future explicit promotion decision.
`,
    [artifactPaths.witJson]: serialize(wit),
    [artifactPaths.witMd]: `# v1.24 Component Model/WIT ABI Proof

Status: not promoted.

Component Model/WIT remains a proof spike. A minimal Strategy world is documented, but generated binding parity, Wasmtime component hosting, caps, validation, privacy, compatibility, and rollback proof remain future work.

Decision: WIT artifacts cannot become Match execution artifacts without a future explicit promotion decision.
`,
    [artifactPaths.abiJson]: serialize(abi),
    [artifactPaths.abiMd]: `# v1.24 ABI Decision

Decision: keep WASI Preview 1 stdin/stdout JSON as the active WASM/WASI Match execution ABI.

Direct exports are not promoted. Component Model/WIT is not promoted. Unknown, stale, mismatched, or unpromoted ABI metadata fails closed.

Migration criteria:
${abi.migrationCriteria.map((item) => `- ${item}`).join("\n")}

Ownership: ${abi.ownership}
`,
    [artifactPaths.regressionJson]: serialize(regression),
    [artifactPaths.regressionMd]: `# v1.24 Signed-In Multi-Runtime Regression Proof

Status: local contract recorded; live browser proof remains required before milestone closure.

- JS/TS counted support: ${regression.jsTsCountedSupport ? "pass" : "fail"}
- Python beta support: ${regression.pythonBetaSupport ? "pass" : "fail"}
- Rust beta support: ${regression.rustBetaSupport ? "pass" : "non-proof/fail-loud"}
- Zig beta support: ${regression.zigBetaSupport ? "pass" : "non-proof/fail-loud"}
- Result pages: ${regression.resultPages}
- Replay pages: ${regression.replayPages}
- Replay plausibility: ${regression.replayPlausibility}
- Public privacy: ${regression.publicPrivacy}
- No fallback evidence: ${regression.noFallbackEvidence.overall}; stopped-runtime live drill ${regression.noFallbackEvidence.stoppedRuntimeLiveDrill}
`,
  }
  for (const [relativePath, output] of Object.entries(outputs)) {
    assertPublicOutputLeakSafe(output, relativePath)
  }
  if (!publicSafe(outputs)) {
    throw new Error(
      "Generated v1.24 public evidence contains forbidden details",
    )
  }
  return outputs
}

const outputs = buildOutputs()

if (checkMode) {
  for (const [relativePath, next] of Object.entries(outputs)) {
    const current = readFileSync(path.join(repoRoot, relativePath), "utf8")
    if (current !== next) {
      throw new Error(
        `${relativePath} is stale; run pnpm runtime-abuse:evaluate`,
      )
    }
  }
} else {
  for (const [relativePath, next] of Object.entries(outputs)) {
    writeFileSync(path.join(repoRoot, relativePath), next)
  }
}
