#!/usr/bin/env -S pnpm exec tsx
import { writeFileSync, readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import {
  buildZigStrategyRevision,
  buildRustStrategyRevision,
  compileZigWasmArtifact,
  compileRustWasmArtifact,
  validateRustStrategySource,
  validateZigStrategySource,
  zigReadinessEvidence,
} from "../packages/runtime-wasm-wasi/src/validation.ts"
import {
  createWasmWasiRuntimeFromRevision,
  runWasmWasiStrategyMethodSync,
} from "../packages/runtime-wasm-wasi/src/wasm-wasi-subprocess-adapter.ts"
import type { StrategyRevision } from "../packages/spec/src/index.ts"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, "..")
const checkMode = process.argv.includes("--check")
const artifactPath = path.join(
  repoRoot,
  ".planning/artifacts/v1.22-wasm-wasi-hardening-evidence.json",
)
const markdownPath = path.join(
  repoRoot,
  ".planning/artifacts/v1.22-wasm-wasi-hardening-evidence.md",
)
const zigArtifactPath = path.join(
  repoRoot,
  ".planning/artifacts/v1.22-zig-readiness-evidence.json",
)
const zigMarkdownPath = path.join(
  repoRoot,
  ".planning/artifacts/v1.22-zig-readiness-evidence.md",
)
const abiDecisionPath = path.join(
  repoRoot,
  ".planning/artifacts/v1.22-abi-evolution-decision.md",
)
const promotionDecisionPath = path.join(
  repoRoot,
  ".planning/artifacts/v1.22-promotion-decision.md",
)

type ProbeStatus = "pass" | "fail"
type ProbeLayer = "compile" | "execute" | "artifact" | "preflight"

interface WasmWasiProbeResult {
  id: string
  layer: ProbeLayer
  expectation: string
  status: ProbeStatus
  observed: string
  publicSafe: boolean
}

const stableValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(stableValue)
  }
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
      id: "soldier:rust:1",
      ownerPlayerId: "player:rust",
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
    id: "soldier:rust:1",
    ownerPlayerId: "player:rust",
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
  layer: ProbeLayer = "execute",
): WasmWasiProbeResult => {
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

const validationDenialProbe = (
  id: string,
  source: string,
  pattern: string,
): WasmWasiProbeResult =>
  runProbe(
    id,
    `validation denies ${pattern}`,
    () => {
      const report = validateRustStrategySource(source)
      return !report.valid && report.forbiddenPatterns.includes(pattern)
    },
    "compile",
  )

const runtimeProbe = (
  id: string,
  source: string,
  expectedFailureCode: string,
  options: { timeoutMs?: number; stdoutBytes?: number } = {},
): WasmWasiProbeResult =>
  runProbe(id, `runtime reports ${expectedFailureCode}`, () => {
    const revision = buildRustStrategyRevision({ source })
    const response = runWasmWasiStrategyMethodSync({
      revision,
      methodName: "soldierBrain",
      input: soldierBrainInput,
      timeoutMs: options.timeoutMs ?? 250,
      stdoutBytes: options.stdoutBytes ?? 8 * 1024,
      stderrBytes: 8 * 1024,
    })
    if (response.ok) {
      return `unexpected success`
    }
    const code =
      response.failureKind === "runtimeViolation"
        ? response.violation.code
        : response.systemFailure.code
    return code === expectedFailureCode ? true : `observed ${code}`
  })

const normalizedRuntimeProbe = (
  id: string,
  source: string,
  expectedViolationType: string,
): WasmWasiProbeResult =>
  runProbe(id, `runtime adapter reports ${expectedViolationType}`, () => {
    const revision = buildRustStrategyRevision({ source })
    const runtime = createWasmWasiRuntimeFromRevision(revision, {
      timeoutMs: 250,
      stdoutBytes: 8 * 1024,
      stderrBytes: 8 * 1024,
    })
    const response = runtime.runSoldierBrain(soldierBrainInput)
    if (response.ok) {
      return "unexpected success"
    }
    return response.violation.type === expectedViolationType
      ? true
      : `observed ${response.violation.type}`
  })

const invalidJsonSource = `
fn main() {
    println!("not-json");
}
`

const invalidActionSource = `
fn main() {
    println!(r#"{{"ok":true,"abiVersion":"strategy-runtime-abi-v1.14","value":{{"action":{{"type":"NOT_AN_ACTION"}},"soldierMemory":null}}}}"#);
}
`

const panicSource = `
fn main() {
    panic!("probe panic");
}
`

const infiniteLoopSource = `
fn main() {
    loop {}
}
`

const oversizedStdoutSource = `
fn main() {
    println!("{}", "x".repeat(65536));
}
`

const growMemorySource = `
fn main() {
    let mut data: Vec<Vec<u8>> = Vec::new();
    loop {
        data.push(vec![1; 16 * 1024 * 1024]);
    }
}
`

const buildReport = () => {
  const compiled = compileRustWasmArtifact(rustSource)
  const compiledZig = compileZigWasmArtifact(zigSource)
  const revision = buildRustStrategyRevision({ source: rustSource })
  const zigRevision = compiledZig.ok
    ? buildZigStrategyRevision({ source: zigSource })
    : null
  const selectResponse = runWasmWasiStrategyMethodSync({
    revision,
    methodName: "selectActivations",
    input: selectActivationsInput,
    timeoutMs: 1_000,
    stdoutBytes: 32 * 1024,
    stderrBytes: 32 * 1024,
  })
  const soldierResponse = runWasmWasiStrategyMethodSync({
    revision,
    methodName: "soldierBrain",
    input: soldierBrainInput,
    timeoutMs: 1_000,
    stdoutBytes: 32 * 1024,
    stderrBytes: 32 * 1024,
  })
  const staleHashRevision: StrategyRevision = {
    ...revision,
    metadata: {
      ...revision.metadata,
      compiledArtifact: revision.metadata.compiledArtifact
        ? {
            ...revision.metadata.compiledArtifact,
            hash: "0".repeat(64),
          }
        : undefined,
    },
  }
  const staleHashResponse = runWasmWasiStrategyMethodSync({
    revision: staleHashRevision,
    methodName: "soldierBrain",
    input: soldierBrainInput,
  })
  const zigSoldierResponse =
    zigRevision === null
      ? null
      : runWasmWasiStrategyMethodSync({
          revision: zigRevision,
          methodName: "soldierBrain",
          input: soldierBrainInput,
          timeoutMs: 1_000,
          stdoutBytes: 32 * 1024,
          stderrBytes: 32 * 1024,
        })
  const probes: WasmWasiProbeResult[] = [
    runProbe(
      "rust-compile-valid-artifact",
      "Rust source compiles to wasm32-wasip1 artifact metadata",
      () => compiled.ok && compiled.artifact?.format === "wasm",
      "compile",
    ),
    runProbe(
      "select-activations-json-envelope",
      "WASI Preview 1 stdin/stdout envelope returns activation orders",
      () =>
        selectResponse.ok &&
        Array.isArray(
          (selectResponse.value as { activationOrders?: unknown })
            .activationOrders,
        ),
    ),
    runProbe(
      "soldier-brain-json-envelope",
      "WASI Preview 1 stdin/stdout envelope returns soldier action",
      () =>
        soldierResponse.ok &&
        (soldierResponse.value as { action?: { type?: string } }).action
          ?.type === "TURN_TO_STONE",
    ),
    runProbe(
      "zig-toolchain-path-aware-preflight",
      "Zig binary/version/target preflight uses PATH-aware detection",
      () => {
        const evidence = zigReadinessEvidence()
        return evidence.ok && evidence.compileProof && evidence.runtimeProof
      },
      "preflight",
    ),
    runProbe(
      "zig-compile-valid-artifact",
      "Zig no-std source compiles to wasm32-wasi artifact metadata",
      () =>
        compiledZig.ok &&
        compiledZig.artifact?.format === "wasm" &&
        compiledZig.artifact.targetTriple === "wasm32-wasi",
      "compile",
    ),
    runProbe(
      "zig-soldier-brain-json-envelope",
      "Zig WASI Preview 1 stdin/stdout envelope returns soldier action",
      () =>
        zigSoldierResponse !== null &&
        zigSoldierResponse.ok &&
        (zigSoldierResponse.value as { action?: { type?: string } }).action
          ?.type === "TURN_TO_STONE",
    ),
    runProbe(
      "zig-std-host-capability-denied",
      "Zig std-backed host capability starter is rejected before exposure",
      () => {
        const report = validateZigStrategySource(
          `${zigSource}\nconst std = @import("std");`,
        )
        return (
          !report.valid && report.forbiddenPatterns.includes('@import("std")')
        )
      },
      "compile",
    ),
    validationDenialProbe(
      "filesystem-denied-validation",
      `${rustSource}\nfn bad() { let _ = std::fs::read_to_string("/etc/passwd"); }`,
      "std::fs",
    ),
    validationDenialProbe(
      "network-denied-validation",
      `${rustSource}\nfn bad() { let _ = std::net::TcpStream::connect("127.0.0.1:1"); }`,
      "std::net",
    ),
    validationDenialProbe(
      "clock-denied-validation",
      `${rustSource}\nfn bad() { let _ = std::time::SystemTime::now(); }`,
      "std::time",
    ),
    validationDenialProbe(
      "random-package-denied-validation",
      `${rustSource}\nextern crate rand;`,
      "extern crate",
    ),
    validationDenialProbe(
      "env-token-denied-validation",
      `${rustSource}\nfn bad() { let _ = std::env::var("DATABASE_URL"); }`,
      "env::var",
    ),
    runtimeProbe("malformed-json-result", invalidJsonSource, "MALFORMED_IPC"),
    normalizedRuntimeProbe(
      "invalid-action-schema",
      invalidActionSource,
      "INVALID_OUTPUT",
    ),
    runtimeProbe("panic-trap-abort", panicSource, "THROWN_EXCEPTION"),
    runtimeProbe(
      "infinite-loop-fuel-trap",
      infiniteLoopSource,
      "THROWN_EXCEPTION",
      {
        timeoutMs: 100,
      },
    ),
    runtimeProbe(
      "oversized-stdout",
      oversizedStdoutSource,
      "STDIO_CAP_EXCEEDED",
      { stdoutBytes: 128 },
    ),
    runtimeProbe("memory-growth-cap", growMemorySource, "THROWN_EXCEPTION", {
      timeoutMs: 500,
    }),
    runProbe(
      "stale-artifact-hash",
      "runtime refuses artifact hash mismatch without source fallback",
      () => {
        if (staleHashResponse.ok) {
          return "unexpected success"
        }
        return (
          staleHashResponse.failureKind === "systemFailure" &&
          staleHashResponse.systemFailure.code === "MALFORMED_IPC"
        )
      },
      "artifact",
    ),
  ]

  return {
    schemaVersion: "v1.22-wasm-wasi-hardening-evidence",
    milestone: "v1.22",
    generatedAt: "2026-05-25T00:00:00.000Z",
    runtimeLane: "runtime-wasm-wasi-wasmtime-preview1",
    abi: "WASI Preview 1 stdin/stdout JSON envelope",
    promotionClaim:
      "candidate-readiness evidence only; not production sandbox certification",
    countedEligibility: false,
    sourceLeakCheck:
      "artifact stores private source separately; public evidence records statuses and hashes only",
    summary: {
      pass: probes.filter((probe) => probe.status === "pass").length,
      fail: probes.filter((probe) => probe.status === "fail").length,
    },
    probes,
  } as const
}

const buildMarkdown = (report: ReturnType<typeof buildReport>): string => {
  const rows = report.probes
    .map(
      (probe) =>
        `| ${probe.id} | ${probe.layer} | ${probe.status} | ${probe.observed} |`,
    )
    .join("\n")
  return `# v1.22 WASM/WASI Runtime Hardening Evidence

Status: ${report.summary.fail === 0 ? "PASS" : "FAIL"}

This is candidate-readiness evidence only. It is not production sandbox certification and does not make Rust, Zig, or WASM/WASI counted or ranked eligible.

| Probe | Layer | Status | Observation |
| --- | --- | --- | --- |
${rows}
`
}

const buildZigMarkdown = (
  evidence: ReturnType<typeof zigReadinessEvidence>,
): string => `# v1.22 Zig Readiness Evidence

Status: ${evidence.ok ? "COMPILE/RUNTIME PROOF PASSED, NON-COUNTED ALPHA ONLY" : "UNAVAILABLE"}

Target: ${evidence.target}
Artifact hash: ${evidence.artifactHash ?? "none"}
Resolved path: ${evidence.resolvedPath ?? "none"}

${evidence.message}

Zig remains non-counted exhibition alpha. It must not be counted, ranked, ladder, gauntlet, or production-sandbox promoted in v1.22.
`

const abiDecisionMarkdown = `# v1.22 ABI Evolution Decision

Decision: keep WASI Preview 1 stdin/stdout JSON as the only candidate execution path for v1.22 and defer ABI migration to v1.23+.

Current path: Preview 1 stdin/stdout JSON is plain, schema-validatable, compiler-agnostic, easy to cap, and already preserves the Go/runtime-service ownership boundary.

Direct exports: attractive for lower overhead and simpler stdout parsing, but it requires a stricter memory ABI, string/buffer ownership rules, canonical allocation contracts, and per-language glue. No v1.22 proof is strong enough to move execution to direct exports.

Component model/WIT: best long-term shape for typed host/guest contracts, but toolchain maturity and language support need a separate milestone. It should remain a research candidate, not a hidden runtime path.

Recommendation for v1.23: stay on stdin/stdout JSON unless a dedicated direct-export or component-model proof demonstrates deterministic memory ownership, schema validation, resource caps, and parity for Rust plus Zig without disrupting JS/TS counted play.
`

const promotionDecisionMarkdown = `# v1.22 Promotion Decision

Decision: no Rust, Zig, or WASM/WASI counted, ranked, ladder, gauntlet, or production-sandbox promotion.

Rust remains non-counted exhibition alpha. It continues to compile to immutable WASM/WASI artifacts and execute through runtime-service/Runtime Broker/Wasmtime.

Zig is exposed only as non-counted exhibition alpha when v1.22 readiness evidence shows binary detection, wasm32-wasi artifact compile, Wasmtime execution, and ABI-valid Match behavior. If any proof fails in a target environment, Zig must fail loud and remain unavailable there.

Python remains non-counted exhibition beta. JS/TS remains the counted Strategy path. Go continues to own orchestration, persistence-facing backend behavior, Match lifecycle, scoring, public evidence, retry policy, and promotion decisions.

Sandbox language: v1.22 improves candidate-readiness evidence only. It is not production sandbox certification.
`

const report = buildReport()
const zigEvidence = zigReadinessEvidence()
const zig = {
  schemaVersion: "v1.22-zig-readiness-evidence",
  milestone: "v1.22",
  generatedAt: "2026-05-25T00:00:00.000Z",
  countedPromotionAllowed: false,
  exhibitionAlphaAllowed: zigEvidence.ok,
  evidence: zigEvidence,
} as const
const reportJson = serialize(report)
const reportMarkdown = buildMarkdown(report)
const zigJson = serialize(zig)
const zigMarkdown = buildZigMarkdown(zig.evidence)

if (checkMode) {
  const currentReportJson = readFileSync(artifactPath, "utf8")
  const currentReportMarkdown = readFileSync(markdownPath, "utf8")
  const currentZigJson = readFileSync(zigArtifactPath, "utf8")
  const currentZigMarkdown = readFileSync(zigMarkdownPath, "utf8")
  const currentAbiDecision = readFileSync(abiDecisionPath, "utf8")
  const currentPromotionDecision = readFileSync(promotionDecisionPath, "utf8")
  if (
    currentReportJson !== reportJson ||
    currentReportMarkdown !== reportMarkdown ||
    currentZigJson !== zigJson ||
    currentZigMarkdown !== zigMarkdown ||
    currentAbiDecision !== abiDecisionMarkdown ||
    currentPromotionDecision !== promotionDecisionMarkdown
  ) {
    throw new Error(
      "WASM/WASI evidence artifacts are stale; run pnpm wasm-wasi:evaluate",
    )
  }
} else {
  writeFileSync(artifactPath, reportJson)
  writeFileSync(markdownPath, reportMarkdown)
  writeFileSync(zigArtifactPath, zigJson)
  writeFileSync(zigMarkdownPath, zigMarkdown)
  writeFileSync(abiDecisionPath, abiDecisionMarkdown)
  writeFileSync(promotionDecisionPath, promotionDecisionMarkdown)
}

if (report.summary.fail > 0) {
  throw new Error("One or more WASM/WASI hostile probes failed")
}

console.log(
  `WASM/WASI probes passed: ${report.summary.pass}; Zig readiness: ${zig.evidence.ok ? "detected" : "unavailable"}`,
)
