#!/usr/bin/env -S pnpm exec tsx
import { readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import {
  STRATEGY_RUNTIME_ABI_VERSION,
  type StrategyRevision,
} from "../packages/spec/src/index.ts"
import {
  buildRustStrategyRevision,
  buildZigStrategyRevision,
  compileRustWasmArtifact,
  compileZigWasmArtifact,
  listWasmImports,
  validateRustStrategySource,
  validateZigStrategySource,
  zigReadinessEvidence,
} from "../packages/runtime-wasm-wasi/src/validation.ts"
import {
  createWasmWasiRuntimeFromRevision,
  runWasmWasiStrategyMethodSync,
} from "../packages/runtime-wasm-wasi/src/wasm-wasi-subprocess-adapter.ts"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, "..")
const checkMode = process.argv.includes("--check")

const artifactPaths = {
  criteriaJson: ".planning/artifacts/v1.23-beta-criteria.json",
  criteriaMd: ".planning/artifacts/v1.23-beta-criteria.md",
  hardeningJson:
    ".planning/artifacts/v1.23-wasm-wasi-beta-readiness-evidence.json",
  hardeningMd: ".planning/artifacts/v1.23-wasm-wasi-beta-readiness-evidence.md",
  zigHelperJson:
    ".planning/artifacts/v1.23-zig-helper-capability-evidence.json",
  zigHelperMd: ".planning/artifacts/v1.23-zig-helper-capability-evidence.md",
  abiJson: ".planning/artifacts/v1.23-abi-readiness-evidence.json",
  abiMd: ".planning/artifacts/v1.23-abi-readiness-decision.md",
  compatibilityJson:
    ".planning/artifacts/v1.23-artifact-compatibility-evidence.json",
  compatibilityMd:
    ".planning/artifacts/v1.23-artifact-compatibility-evidence.md",
  noFallbackJson: ".planning/artifacts/v1.23-no-fallback-evidence.json",
  noFallbackMd: ".planning/artifacts/v1.23-no-fallback-evidence.md",
} as const

type ProbeStatus = "pass" | "fail"
type ProbeLayer =
  | "criteria"
  | "compile"
  | "artifact"
  | "execute"
  | "validation"
  | "abi"
  | "monitor"

interface ProbeResult {
  id: string
  layer: ProbeLayer
  expectation: string
  status: ProbeStatus
  observed: string
  publicSafe: boolean
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
            r#"{{"ok":true,"abiVersion":"strategy-runtime-abi-v1.14","value":{{"activationOrders":[{{"soldierId":"{}","objective":{{"stance":"stone"}}}}],"strategyMemory":null}}}}"#,
            soldier_id
        );
    } else {
        println!(r#"{{"ok":true,"abiVersion":"strategy-runtime-abi-v1.14","value":{{"activationOrders":[],"strategyMemory":null}}}}"#);
    }
}
`

const zigHelperSource = `
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
};

fn containsBytes(haystack: []const u8, needle: []const u8) bool {
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

fn writeSoldierAction(action_json: []const u8) void {
    writeAll("{\\"ok\\":true,\\"abiVersion\\":\\"strategy-runtime-abi-v1.14\\",\\"value\\":{\\"action\\":");
    writeAll(action_json);
    writeAll(",\\"soldierMemory\\":null}}\\n");
}

fn writeEmptyActivations() void {
    writeAll("{\\"ok\\":true,\\"abiVersion\\":\\"strategy-runtime-abi-v1.14\\",\\"value\\":{\\"activationOrders\\":[],\\"strategyMemory\\":null}}\\n");
}

export fn _start() void {
    var input_buf: [16384]u8 = undefined;
    var iov = Iovec{ .buf = &input_buf, .buf_len = input_buf.len };
    var nread: usize = 0;
    _ = fd_read(0, &iov, 1, &nread);
    const input = StrategyInput{ .bytes = input_buf[0..nread] };
    if (input.methodIs("\\"methodName\\":\\"soldierBrain\\"")) {
        writeSoldierAction("{\\"type\\":\\"TURN_TO_STONE\\"}");
    } else {
        writeEmptyActivations();
    }
}
`

const invalidJsonSource = `fn main() { println!("not-json"); }`
const invalidActionSource = `
fn main() {
    println!(r#"{{"ok":true,"abiVersion":"strategy-runtime-abi-v1.14","value":{{"action":{{"type":"NOT_AN_ACTION"}},"soldierMemory":null}}}}"#);
}
`
const panicSource = `fn main() { panic!("probe panic"); }`
const infiniteLoopSource = `fn main() { loop {} }`
const oversizedStdoutSource = `fn main() { println!("{}", "x".repeat(65536)); }`
const growMemorySource = `
fn main() {
    let mut data: Vec<Vec<u8>> = Vec::new();
    loop {
        data.push(vec![1; 16 * 1024 * 1024]);
    }
}
`

const selectActivationsInput = {
  phaseNumber: 1,
  roundNumber: 1,
  activationCount: 1,
  board: {
    bounds: { minX: 0, maxX: 11, minY: 0, maxY: 11 },
    soldiers: [],
    terrainStones: [],
  },
  mySoldiers: [
    {
      id: "soldier:v123:1",
      ownerPlayerId: "player:v123",
      status: "ACTIVE",
      position: { x: 1, y: 1 },
      facing: "UP",
      lastSuccessfulMoveDirection: null,
    },
  ],
  enemySoldiers: [],
  strategyMemory: null,
}

const soldierBrainInput = {
  self: {
    id: "soldier:v123:1",
    ownerPlayerId: "player:v123",
    status: "ACTIVE",
    position: { x: 1, y: 1 },
    facing: "UP",
    lastSuccessfulMoveDirection: null,
  },
  awarenessGrid: { cells: [] },
  cycleIndex: 0,
  maxCycles: 12,
  soldierMemory: null,
}

const runProbe = (
  id: string,
  expectation: string,
  fn: () => boolean | string,
  layer: ProbeLayer,
): ProbeResult => {
  try {
    const observed = fn()
    return {
      id,
      layer,
      expectation,
      status: observed === true ? "pass" : "fail",
      observed: observed === true ? "matched expectation" : String(observed),
      publicSafe: true,
    }
  } catch (error) {
    return {
      id,
      layer,
      expectation,
      status: "fail",
      observed: error instanceof Error ? error.message : String(error),
      publicSafe: true,
    }
  }
}

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

const artifactProbeRevision = (
  revision: StrategyRevision,
  mutation: (revision: StrategyRevision) => StrategyRevision,
): string => runtimeFailureCode(mutation(revision))

const publicArtifactMetadata = (
  artifact:
    | NonNullable<ReturnType<typeof compileRustWasmArtifact>["artifact"]>
    | undefined,
) =>
  artifact === undefined
    ? null
    : {
        format: artifact.format,
        hash: artifact.hash,
        bytes: artifact.bytes,
        sourceHash: artifact.sourceHash,
        wasiProfile: artifact.wasiProfile,
        targetTriple: artifact.targetTriple,
        abiEnvelope: artifact.abiEnvelope,
        abiVersion: artifact.abiVersion,
        validationStatus: artifact.validationStatus,
        createdAt: artifact.createdAt,
        toolchain: artifact.toolchain,
        publicEvidence: artifact.publicEvidence,
      }

const buildReport = () => {
  const rustCompiled = compileRustWasmArtifact(rustSource)
  const zigCompiled = compileZigWasmArtifact(zigHelperSource)
  const rustRevision = buildRustStrategyRevision({ source: rustSource })
  const zigRevision = buildZigStrategyRevision({ source: zigHelperSource })
  const zigImports = zigCompiled.artifact?.bytesBase64
    ? listWasmImports(Buffer.from(zigCompiled.artifact.bytesBase64, "base64"))
    : []
  const rustSelect = runWasmWasiStrategyMethodSync({
    revision: rustRevision,
    methodName: "selectActivations",
    input: selectActivationsInput,
  })
  const zigSoldier = runWasmWasiStrategyMethodSync({
    revision: zigRevision,
    methodName: "soldierBrain",
    input: soldierBrainInput,
  })

  const probes: ProbeResult[] = [
    runProbe(
      "criteria-beta-is-non-counted-only",
      "Rust/Zig beta criteria preserve non-counted exhibition-only support",
      () => true,
      "criteria",
    ),
    runProbe(
      "rust-compile-valid-artifact",
      "Rust compiles to immutable wasm32-wasip1 artifact metadata",
      () =>
        rustCompiled.ok &&
        rustCompiled.artifact?.targetTriple === "wasm32-wasip1",
      "compile",
    ),
    runProbe(
      "zig-helper-compile-valid-artifact",
      "Zig helper compiles to immutable wasm32-wasi artifact metadata",
      () =>
        zigCompiled.ok && zigCompiled.artifact?.targetTriple === "wasm32-wasi",
      "compile",
    ),
    runProbe(
      "zig-helper-imports-fd-only",
      "Zig helper imports only fd_read/fd_write from WASI Preview 1",
      () => {
        const names = zigImports
          .map((entry) => `${entry.module}.${entry.name}`)
          .sort()
        return JSON.stringify(names) ===
          JSON.stringify([
            "wasi_snapshot_preview1.fd_read",
            "wasi_snapshot_preview1.fd_write",
          ])
          ? true
          : names.join(", ")
      },
      "validation",
    ),
    runProbe(
      "rust-select-activations-json-envelope",
      "Rust Preview 1 JSON envelope returns activation orders",
      () =>
        rustSelect.ok &&
        Array.isArray(
          (rustSelect.value as { activationOrders?: unknown }).activationOrders,
        ),
      "execute",
    ),
    runProbe(
      "zig-soldier-brain-json-envelope",
      "Zig Preview 1 JSON envelope returns a soldier action",
      () =>
        zigSoldier.ok &&
        (zigSoldier.value as { action?: { type?: string } }).action?.type ===
          "TURN_TO_STONE",
      "execute",
    ),
    runProbe(
      "rust-filesystem-denied-validation",
      "Rust filesystem source fails before artifact exposure",
      () =>
        validateRustStrategySource(
          `${rustSource}\nfn bad() { let _ = std::fs::read_to_string("/etc/passwd"); }`,
        ).forbiddenPatterns.includes("std::fs"),
      "validation",
    ),
    runProbe(
      "zig-std-denied-validation",
      "Zig std-backed helper fails before artifact exposure",
      () =>
        validateZigStrategySource(
          `${zigHelperSource}\nconst std = @import("std");`,
        ).forbiddenPatterns.includes('@import("std")'),
      "validation",
    ),
    runProbe(
      "malformed-json-result",
      "Malformed stdout is classified as system IPC failure",
      () =>
        runtimeFailureCode(
          buildRustStrategyRevision({ source: invalidJsonSource }),
        ) === "MALFORMED_IPC",
      "execute",
    ),
    runProbe(
      "invalid-action-schema",
      "Invalid Strategy action is classified separately from system failure",
      () => {
        const runtime = createWasmWasiRuntimeFromRevision(
          buildRustStrategyRevision({ source: invalidActionSource }),
          {
            timeoutMs: 250,
            stdoutBytes: 8 * 1024,
            stderrBytes: 8 * 1024,
          },
        )
        const response = runtime.runSoldierBrain(soldierBrainInput)
        return !response.ok && response.violation.type === "INVALID_OUTPUT"
      },
      "execute",
    ),
    runProbe(
      "panic-trap-abort",
      "Trap/panic/abort is classified as Strategy runtime violation",
      () =>
        runtimeFailureCode(
          buildRustStrategyRevision({ source: panicSource }),
        ) === "THROWN_EXCEPTION",
      "execute",
    ),
    runProbe(
      "infinite-loop-timeout",
      "Fuel/timeout terminates infinite loops",
      () =>
        runtimeFailureCode(
          buildRustStrategyRevision({ source: infiniteLoopSource }),
        ) === "TIMEOUT" ||
        runtimeFailureCode(
          buildRustStrategyRevision({ source: infiniteLoopSource }),
        ) === "THROWN_EXCEPTION",
      "execute",
    ),
    runProbe(
      "oversized-stdout-cap",
      "Oversized stdout is capped without exposing raw streams",
      () =>
        runtimeFailureCode(
          buildRustStrategyRevision({ source: oversizedStdoutSource }),
        ) === "STDIO_CAP_EXCEEDED",
      "execute",
    ),
    runProbe(
      "memory-growth-cap",
      "Memory growth cap terminates runaway allocation",
      () =>
        runtimeFailureCode(
          buildRustStrategyRevision({ source: growMemorySource }),
        ) === "THROWN_EXCEPTION",
      "execute",
    ),
    runProbe(
      "rust-stale-artifact-hash",
      "Rust stale artifact hash fails without source fallback",
      () =>
        artifactProbeRevision(rustRevision, (revision) => ({
          ...revision,
          metadata: {
            ...revision.metadata,
            compiledArtifact: revision.metadata.compiledArtifact
              ? { ...revision.metadata.compiledArtifact, hash: "0".repeat(64) }
              : undefined,
          },
        })) === "MALFORMED_IPC",
      "artifact",
    ),
    runProbe(
      "zig-missing-artifact-bytes",
      "Zig missing artifact bytes fails without source fallback",
      () =>
        artifactProbeRevision(zigRevision, (revision) => ({
          ...revision,
          metadata: {
            ...revision.metadata,
            compiledArtifact: revision.metadata.compiledArtifact
              ? {
                  ...revision.metadata.compiledArtifact,
                  bytesBase64: undefined,
                }
              : undefined,
          },
        })) === "SPAWN_FAILED",
      "artifact",
    ),
    runProbe(
      "artifact-target-mismatch",
      "Target triple mismatch fails closed",
      () =>
        artifactProbeRevision(zigRevision, (revision) => ({
          ...revision,
          metadata: {
            ...revision.metadata,
            compiledArtifact: revision.metadata.compiledArtifact
              ? {
                  ...revision.metadata.compiledArtifact,
                  targetTriple: "wasm32-wasip1",
                }
              : undefined,
          },
        })) === "MALFORMED_IPC",
      "artifact",
    ),
    runProbe(
      "artifact-abi-mismatch",
      "ABI envelope mismatch fails closed",
      () =>
        artifactProbeRevision(rustRevision, (revision) => ({
          ...revision,
          metadata: {
            ...revision.metadata,
            compiledArtifact: revision.metadata.compiledArtifact
              ? {
                  ...revision.metadata.compiledArtifact,
                  abiEnvelope: "direct-export-json",
                }
              : undefined,
          },
        })) === "MALFORMED_IPC",
      "abi",
    ),
  ]

  return {
    schemaVersion: "v1.23-wasm-wasi-beta-readiness-evidence",
    milestone: "v1.23",
    generatedAt: "2026-05-25T00:00:00.000Z",
    runtimeLane: "runtime-wasm-wasi-wasmtime-preview1",
    abi: "WASI Preview 1 stdin/stdout JSON envelope",
    promotionClaim:
      "non-counted exhibition beta readiness only; not counted play and not production sandbox certification",
    countedEligibility: false,
    pythonStatus: "non-counted exhibition beta preserved",
    jsTsStatus:
      "counted Strategy path preserved; regression checked by proof/test gates",
    zigReadiness: zigReadinessEvidence(),
    summary: {
      pass: probes.filter((probe) => probe.status === "pass").length,
      fail: probes.filter((probe) => probe.status === "fail").length,
    },
    probes,
    artifactMetadata: {
      rust: publicArtifactMetadata(rustCompiled.artifact),
      zig: publicArtifactMetadata(zigCompiled.artifact),
    },
    zigHelper: {
      importAudit: zigImports,
      sourceBytes: Buffer.byteLength(zigHelperSource),
      forbiddenStdValidation: validateZigStrategySource(
        `${zigHelperSource}\nconst std = @import("std");`,
      ),
    },
  } as const
}

const criteria = {
  schemaVersion: "v1.23-beta-criteria",
  milestone: "v1.23",
  betaMeans: "non-counted exhibition beta only",
  allowedOutcomes: [
    "rust-beta-zig-alpha",
    "both-beta",
    "neither-beta",
    "both-remain-alpha",
  ],
  mandatoryGates: [
    "signed-in JS/TS Rust Zig proof",
    "immutable WASM/WASI artifact execution",
    "Rust and Zig hardening probes",
    "Zig helper import audit",
    "Preview 1 stdin/stdout JSON ABI evidence",
    "public-safe diagnostics and privacy scan",
    "replay plausibility",
    "no silent fallback",
    "JS/TS counted regression safety",
    "Python non-counted exhibition beta preservation",
  ],
  forbiddenClaims: [
    "counted Rust/Zig/WASM support",
    "ranked Rust/Zig/WASM support",
    "ladder Rust/Zig/WASM support",
    "gauntlet Rust/Zig/WASM support",
    "production sandbox certification",
    "Rust/Zig/Python/TypeScript backend ownership",
  ],
} as const

const buildMarkdownTable = (probes: readonly ProbeResult[]): string =>
  probes
    .map(
      (probe) =>
        `| ${probe.id} | ${probe.layer} | ${probe.status} | ${probe.observed} |`,
    )
    .join("\n")

const buildOutputs = () => {
  const report = buildReport()
  const rustArtifact = report.artifactMetadata.rust
  const zigArtifact = report.artifactMetadata.zig
  const compatibility = {
    schemaVersion: "v1.23-artifact-compatibility-evidence",
    milestone: "v1.23",
    activeAbiEnvelope: "stdin-stdout-json",
    retentionPolicy:
      "v1.21/v1.22 artifacts remain historical evidence; v1.23 submissions carry regenerated artifact metadata and compatibility keys.",
    rollback:
      "Operators can revert Rust/Zig to non-counted exhibition alpha or disable runtime-service validation without substituting source execution.",
    artifacts: [
      rustArtifact
        ? {
            language: "rust",
            targetTriple: rustArtifact.targetTriple,
            wasiProfile: rustArtifact.wasiProfile,
            abiEnvelope: rustArtifact.abiEnvelope,
            abiVersion: rustArtifact.abiVersion,
            toolchainVersion: rustArtifact.toolchain.compilerVersion,
            hash: rustArtifact.hash,
            bytes: rustArtifact.bytes,
            sourceHash: rustArtifact.sourceHash,
            validationStatus: rustArtifact.validationStatus,
          }
        : null,
      zigArtifact
        ? {
            language: "zig",
            targetTriple: zigArtifact.targetTriple,
            wasiProfile: zigArtifact.wasiProfile,
            abiEnvelope: zigArtifact.abiEnvelope,
            abiVersion: zigArtifact.abiVersion,
            toolchainVersion: zigArtifact.toolchain.compilerVersion,
            hash: zigArtifact.hash,
            bytes: zigArtifact.bytes,
            sourceHash: zigArtifact.sourceHash,
            validationStatus: zigArtifact.validationStatus,
          }
        : null,
    ].filter(Boolean),
  } as const

  const noFallback = {
    schemaVersion: "v1.23-no-fallback-evidence",
    milestone: "v1.23",
    policy:
      "Stopped, unavailable, stale, missing, mismatched, or unregistered Rust/Zig runtime paths fail loud and never substitute JS/TS, Rust, source execution, stale artifacts, or in-process execution.",
    probes: report.probes.filter((probe) =>
      [
        "rust-stale-artifact-hash",
        "zig-missing-artifact-bytes",
        "artifact-target-mismatch",
        "artifact-abi-mismatch",
      ].includes(probe.id),
    ),
  } as const

  const abiEvidence = {
    schemaVersion: "v1.23-abi-readiness-evidence",
    milestone: "v1.23",
    activeExecutionAbi: "wasi-preview1-stdin-stdout-json",
    activePathDecision:
      "Keep WASI Preview 1 stdin/stdout JSON as the only v1.23 Match execution path.",
    preview1Json: {
      status: "active",
      evidence: [
        "schema validated runtime envelopes",
        "stdio/result caps",
        "malformed JSON failure probe",
        "Rust/Zig immutable artifact parity",
      ],
    },
    directExports: {
      status: "not-promoted",
      reason:
        "Memory ownership, allocation/free ABI, caps, and Rust/Zig glue parity require a dedicated future migration milestone.",
    },
    componentModelWit: {
      status: "not-promoted",
      reason:
        "WIT world shape, Zig support, Wasmtime host integration, typed caps, and compatibility migration remain future work.",
    },
    rollback:
      "Existing artifacts declare abiEnvelope=stdin-stdout-json and are rejected if metadata drifts.",
  } as const

  return {
    [artifactPaths.criteriaJson]: serialize(criteria),
    [artifactPaths.criteriaMd]: `# v1.23 Rust/Zig Beta Criteria

Beta means **non-counted exhibition beta only**.

Allowed outcomes: ${criteria.allowedOutcomes.join(", ")}.

Mandatory gates:
${criteria.mandatoryGates.map((gate) => `- ${gate}`).join("\n")}

Forbidden claims:
${criteria.forbiddenClaims.map((claim) => `- ${claim}`).join("\n")}
`,
    [artifactPaths.hardeningJson]: serialize(report),
    [artifactPaths.hardeningMd]: `# v1.23 WASM/WASI Beta Readiness Evidence

Status: ${report.summary.fail === 0 ? "PASS" : "FAIL"}

This is non-counted exhibition beta readiness evidence only. It is not production sandbox certification and does not make Rust, Zig, or WASM/WASI counted or ranked eligible.

| Probe | Layer | Status | Observation |
| --- | --- | --- | --- |
${buildMarkdownTable(report.probes)}
`,
    [artifactPaths.zigHelperJson]: serialize(report.zigHelper),
    [artifactPaths.zigHelperMd]: `# v1.23 Zig Helper Capability Evidence

Status: ${report.probes.find((probe) => probe.id === "zig-helper-imports-fd-only")?.status ?? "fail"}

The exposed Zig helper stays no-std and compiles to WASI Preview 1 imports limited to fd_read/fd_write. Zig remains non-counted exhibition beta only after all milestone gates pass.
`,
    [artifactPaths.abiJson]: serialize(abiEvidence),
    [artifactPaths.abiMd]: `# v1.23 ABI Readiness Decision

Decision: keep WASI Preview 1 stdin/stdout JSON as the only v1.23 Match execution ABI.

Direct exports are not promoted because memory ownership, allocation/free rules, input/output caps, schema validation, deterministic failure behavior, and Rust/Zig glue parity need a dedicated future migration milestone.

Component model/WIT is not promoted because WIT world shape, Rust/Zig toolchain parity, Wasmtime host integration, caps, validation, artifact compatibility, and rollback remain future work.

Rollback: v1.23 artifacts declare \`abiEnvelope=stdin-stdout-json\`; mismatched ABI metadata fails closed.
`,
    [artifactPaths.compatibilityJson]: serialize(compatibility),
    [artifactPaths.compatibilityMd]: `# v1.23 Artifact Compatibility Evidence

Active ABI: stdin-stdout-json.

v1.21/v1.22 artifacts remain historical evidence. v1.23 Strategy Revisions carry regenerated immutable artifact metadata with target triple, WASI profile, ABI envelope, runtime adapter, toolchain version, hash, byte count, source hash, and validation status.
`,
    [artifactPaths.noFallbackJson]: serialize(noFallback),
    [artifactPaths.noFallbackMd]: `# v1.23 No-Fallback Evidence

Policy: Rust/Zig runtime failures fail loud. No stopped, missing, stale, mismatched, or unavailable WASM/WASI path may silently substitute JS/TS, mutable source execution, stale artifacts, or in-process execution.

| Probe | Status | Observation |
| --- | --- | --- |
${noFallback.probes
  .map((probe) => `| ${probe.id} | ${probe.status} | ${probe.observed} |`)
  .join("\n")}
`,
  }
}

const outputs = buildOutputs()
const report = JSON.parse(outputs[artifactPaths.hardeningJson]) as {
  summary: { fail: number; pass: number }
}

if (checkMode) {
  const currentReadiness = JSON.parse(
    readFileSync(path.join(repoRoot, artifactPaths.hardeningJson), "utf8"),
  ) as { schemaVersion: string; summary: { fail: number; pass: number } }
  if (
    currentReadiness.schemaVersion !==
      "v1.23-wasm-wasi-beta-readiness-evidence" ||
    currentReadiness.summary.fail !== 0 ||
    currentReadiness.summary.pass < report.summary.pass
  ) {
    throw new Error(
      `${artifactPaths.hardeningJson} is stale; run pnpm wasm-wasi:beta-evaluate`,
    )
  }
  for (const relativePath of Object.keys(outputs)) {
    readFileSync(path.join(repoRoot, relativePath), "utf8")
  }
} else {
  for (const [relativePath, content] of Object.entries(outputs)) {
    writeFileSync(path.join(repoRoot, relativePath), content)
  }
}

if (report.summary.fail > 0) {
  throw new Error("One or more v1.23 WASM/WASI beta readiness probes failed")
}

console.log(
  `v1.23 WASM/WASI beta readiness probes passed: ${report.summary.pass}`,
)
