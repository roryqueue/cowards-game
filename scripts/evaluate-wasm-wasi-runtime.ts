#!/usr/bin/env -S pnpm exec tsx
import { writeFileSync, readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import {
  buildRustStrategyRevision,
  compileRustWasmArtifact,
  validateRustStrategySource,
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
  ".planning/artifacts/v1.21-wasm-wasi-hostile-probe-evidence.json",
)
const markdownPath = path.join(
  repoRoot,
  ".planning/artifacts/v1.21-wasm-wasi-hostile-probe-evidence.md",
)
const zigArtifactPath = path.join(
  repoRoot,
  ".planning/artifacts/v1.21-zig-readiness-evidence.json",
)
const zigMarkdownPath = path.join(
  repoRoot,
  ".planning/artifacts/v1.21-zig-readiness-evidence.md",
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
  const revision = buildRustStrategyRevision({ source: rustSource })
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
    schemaVersion: "v1.21-wasm-wasi-hostile-probe-evidence",
    milestone: "v1.21",
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
  return `# v1.21 WASM/WASI Hostile Probe Evidence

Status: ${report.summary.fail === 0 ? "PASS" : "FAIL"}

This is candidate-readiness evidence only. It is not production sandbox certification and does not make Rust, Zig, or WASM/WASI counted or ranked eligible.

| Probe | Layer | Status | Observation |
| --- | --- | --- | --- |
${rows}
`
}

const buildZigMarkdown = (
  evidence: ReturnType<typeof zigReadinessEvidence>,
): string => `# v1.21 Zig Readiness Evidence

Status: ${evidence.ok ? "TOOLCHAIN DETECTED, NOT PROMOTED" : "UNAVAILABLE"}

Target: ${evidence.target}

${evidence.message}

Zig remains a stretch path. It must not be exposed as working unless the shared compile/artifact/runtime proof passes explicitly.
`

const report = buildReport()
const zig = {
  schemaVersion: "v1.21-zig-readiness-evidence",
  milestone: "v1.21",
  generatedAt: "2026-05-25T00:00:00.000Z",
  promotionAllowed: false,
  evidence: zigReadinessEvidence(),
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
  if (
    currentReportJson !== reportJson ||
    currentReportMarkdown !== reportMarkdown ||
    currentZigJson !== zigJson ||
    currentZigMarkdown !== zigMarkdown
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
}

if (report.summary.fail > 0) {
  throw new Error("One or more WASM/WASI hostile probes failed")
}

console.log(
  `WASM/WASI probes passed: ${report.summary.pass}; Zig readiness: ${zig.evidence.ok ? "detected" : "unavailable"}`,
)
