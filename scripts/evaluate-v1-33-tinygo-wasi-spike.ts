#!/usr/bin/env -S pnpm exec tsx
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { execFileSync, spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import path from "node:path"
import { tmpdir } from "node:os"
import { fileURLToPath } from "node:url"
import {
  STRATEGY_RUNTIME_ABI_VERSION,
  StrategyRuntimeResponseEnvelopeSchema,
} from "../packages/spec/src/index.ts"
import {
  listWasmImports,
  validateWasmWasiImports,
  wasmWasiRuntimeMetadata,
} from "../packages/runtime-wasm-wasi/src/index.ts"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, "..")
const checkMode = process.argv.includes("--check")
const artifactDir = path.join(repoRoot, ".planning/artifacts")
const evidenceJsonPath = path.join(
  artifactDir,
  "v1.33-tinygo-wasi-spike-evidence.json",
)
const evidenceMarkdownPath = path.join(
  artifactDir,
  "v1.33-tinygo-wasi-spike-evidence.md",
)

type TinyGoSpikeStatus = "built" | "toolchain-unavailable" | "compile-failed"

interface TinyGoSpikeEvidence {
  schemaVersion: "tinygo-wasi-spike-v1.33"
  status: TinyGoSpikeStatus
  recommendation: "defer"
  productionEnabled: false
  countedEligibilityEnabled: false
  toolchain: {
    tinygoAvailable: boolean
    tinygoVersion: string | null
    target: "wasi"
  }
  artifact: {
    hash: string | null
    bytes: number | null
    imports: string[]
    importAudit: string
  }
  abiAttempt: {
    profile: "WASI Preview 1"
    envelope: "stdin/stdout JSON"
    result: string
  }
  measurements: {
    compileMs: number | null
    startupLatencyMs: number | null
    perCallLatencyMs: number | null
    deterministicRepeatedExecution: "not-run" | "pass" | "fail" | "blocked"
    invalidOutputBehavior: "not-run" | "pass" | "fail" | "blocked"
    timeoutTrapBehavior: "not-run" | "pass" | "fail" | "blocked"
  }
  publicSafe: true
  failureTaxonomy: string[]
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

const commandExists = (command: string): boolean =>
  spawnSync("sh", ["-lc", `command -v ${command}`], {
    stdio: "ignore",
  }).status === 0

const tinyGoSource = `package main

import (
  "bufio"
  "fmt"
  "io"
  "os"
  "strings"
)

func main() {
  inputBytes, _ := io.ReadAll(bufio.NewReader(os.Stdin))
  input := string(inputBytes)
  if strings.Contains(input, "\\"forceTimeout\\":true") {
    for {
    }
  }
  if strings.Contains(input, "\\"forceInvalidOutput\\":true") {
    fmt.Println("{\\"bad\\":true}")
    return
  }
  if strings.Contains(input, "\\"methodName\\":\\"soldierBrain\\"") {
    fmt.Println("{\\"ok\\":true,\\"abiVersion\\":\\"strategy-runtime-abi-v1.14\\",\\"value\\":{\\"action\\":{\\"type\\":\\"TURN_TO_STONE\\"},\\"soldierMemory\\":null}}")
    return
  }
  fmt.Println("{\\"ok\\":true,\\"abiVersion\\":\\"strategy-runtime-abi-v1.14\\",\\"value\\":{\\"activationOrders\\":[],\\"strategyMemory\\":null}}")
}
`

let wasmtimeRunCounter = 0

const runWasmtime = (
  artifact: Buffer,
  input: Record<string, unknown>,
  timeoutMs: number,
): {
  durationMs: number
  ok: boolean
  stdout: string
  stderr: string
  timedOut: boolean
} => {
  const wasmtime = execFileSync("sh", ["-lc", "command -v wasmtime"], {
    encoding: "utf8",
  }).trim()
  wasmtimeRunCounter += 1
  const workDir = path.join(
    tmpdir(),
    `cowards-tinygo-wasmtime-${process.pid}-${wasmtimeRunCounter}`,
  )
  mkdirSync(workDir, { recursive: true })
  const artifactPath = path.join(workDir, "strategy.wasm")
  writeFileSync(artifactPath, artifact)
  const started = performance.now()
  try {
    const result = spawnSync(
      wasmtime,
      [
        "run",
        "-W",
        "fuel=10000000",
        "-W",
        `timeout=${timeoutMs}ms`,
        "-W",
        "max-memory-size=67108864",
        "-W",
        "max-wasm-stack=1048576",
        "-W",
        "trap-on-grow-failure=y",
        artifactPath,
      ],
      {
        input: JSON.stringify(input),
        encoding: "utf8",
        env: {},
        shell: false,
        timeout: timeoutMs + 500,
        maxBuffer: 64 * 1024,
      },
    )
    const durationMs = Math.round(performance.now() - started)
    const stderr = result.stderr ?? ""
    return {
      durationMs,
      ok: !result.error && result.status === 0,
      stdout: result.stdout ?? "",
      stderr,
      timedOut:
        result.error?.message.includes("ETIMEDOUT") === true ||
        result.error?.name === "TimeoutError" ||
        stderr.includes("interrupt") ||
        stderr.includes("timeout"),
    }
  } finally {
    rmSync(workDir, { force: true, recursive: true })
  }
}

const runtimeInput = (methodName: "selectActivations" | "soldierBrain") => ({
  abiVersion: STRATEGY_RUNTIME_ABI_VERSION,
  methodName,
  runtime: wasmWasiRuntimeMetadata("rust"),
  source: {
    hash: createHash("sha256").update(tinyGoSource).digest("hex"),
    bytes: Buffer.byteLength(tinyGoSource),
    entrypoint: "_start",
  },
  input: {},
})

const responseOk = (stdout: string): boolean => {
  try {
    const parsed = StrategyRuntimeResponseEnvelopeSchema.safeParse(
      JSON.parse(stdout),
    )
    return parsed.success && parsed.data.ok === true
  } catch {
    return false
  }
}

const unavailableEvidence = (): TinyGoSpikeEvidence => ({
  schemaVersion: "tinygo-wasi-spike-v1.33",
  status: "toolchain-unavailable",
  recommendation: "defer",
  productionEnabled: false,
  countedEligibilityEnabled: false,
  toolchain: {
    tinygoAvailable: false,
    tinygoVersion: null,
    target: "wasi",
  },
  artifact: {
    hash: null,
    bytes: null,
    imports: [],
    importAudit:
      "TinyGo was not installed locally, so no import table could be audited.",
  },
  abiAttempt: {
    profile: "WASI Preview 1",
    envelope: "stdin/stdout JSON",
    result:
      "Blocked before compile. Install TinyGo and rerun pnpm tinygo-wasi:spike to evaluate ABI execution.",
  },
  measurements: {
    compileMs: null,
    startupLatencyMs: null,
    perCallLatencyMs: null,
    deterministicRepeatedExecution: "blocked",
    invalidOutputBehavior: "blocked",
    timeoutTrapBehavior: "blocked",
  },
  publicSafe: true,
  failureTaxonomy: ["toolchain-unavailable", "no-production-promotion"],
})

const runTinyGoSpike = (): TinyGoSpikeEvidence => {
  if (!commandExists("tinygo")) {
    return unavailableEvidence()
  }

  const workDir = path.join(tmpdir(), `cowards-tinygo-spike-${process.pid}`)
  mkdirSync(workDir, { recursive: true })
  const sourcePath = path.join(workDir, "main.go")
  const wasmPath = path.join(workDir, "strategy.wasm")
  writeFileSync(sourcePath, tinyGoSource)
  const tinygoVersion = execFileSync("tinygo", ["version"], {
    encoding: "utf8",
  }).trim()
  const started = performance.now()
  const compile = spawnSync(
    "tinygo",
    ["build", "-target=wasi", "-o", wasmPath, sourcePath],
    { encoding: "utf8" },
  )
  const compileMs = Math.round(performance.now() - started)
  if (compile.status !== 0 || !existsSync(wasmPath)) {
    rmSync(workDir, { force: true, recursive: true })
    return {
      ...unavailableEvidence(),
      status: "compile-failed",
      toolchain: {
        tinygoAvailable: true,
        tinygoVersion,
        target: "wasi",
      },
      abiAttempt: {
        profile: "WASI Preview 1",
        envelope: "stdin/stdout JSON",
        result:
          "TinyGo compile failed before runtime execution; stderr redacted to keep toolchain paths out of public evidence.",
      },
      measurements: {
        ...unavailableEvidence().measurements,
        compileMs,
      },
      failureTaxonomy: ["compile-failed", "no-production-promotion"],
    }
  }

  const artifact = readFileSync(wasmPath)
  const hash = createHash("sha256").update(artifact).digest("hex")
  const imports = (() => {
    try {
      return listWasmImports(artifact).map(
        (entry) => `${entry.module}.${entry.name}`,
      )
    } catch {
      return ["import-table-unparseable"]
    }
  })()
  const importErrors = validateWasmWasiImports(artifact)
  const importAudit =
    importErrors.length === 0
      ? "Artifact import table is parseable and uses only the current Preview 1 stdin/stdout allowlist."
      : `Artifact import table is parseable but includes ${importErrors.length} forbidden or unsupported imports for the current production WASM/WASI allowlist.`
  const wasmtimeAvailable = commandExists("wasmtime")
  const runtimeRuns = wasmtimeAvailable
    ? [
        runWasmtime(artifact, runtimeInput("selectActivations"), 1_000),
        runWasmtime(artifact, runtimeInput("soldierBrain"), 1_000),
        runWasmtime(artifact, runtimeInput("soldierBrain"), 1_000),
      ]
    : []
  const runtimePass =
    runtimeRuns.length === 3 &&
    runtimeRuns.every((run) => responseOk(run.stdout))
  const deterministicRepeatedExecution =
    !wasmtimeAvailable || runtimeRuns.length < 3
      ? "blocked"
      : runtimePass &&
          runtimeRuns[1]?.stdout.trim() === runtimeRuns[2]?.stdout.trim()
        ? "pass"
        : "fail"
  const invalidOutputRun = wasmtimeAvailable
    ? runWasmtime(
        artifact,
        { ...runtimeInput("soldierBrain"), forceInvalidOutput: true },
        1_000,
      )
    : null
  const invalidOutputBehavior =
    invalidOutputRun === null
      ? "blocked"
      : invalidOutputRun.ok && !responseOk(invalidOutputRun.stdout)
        ? "pass"
        : "fail"
  const timeoutRun = wasmtimeAvailable
    ? runWasmtime(
        artifact,
        { ...runtimeInput("soldierBrain"), forceTimeout: true },
        250,
      )
    : null
  const timeoutTrapBehavior =
    timeoutRun === null
      ? "blocked"
      : timeoutRun.timedOut || !timeoutRun.ok
        ? "pass"
        : "fail"
  const startupLatencyMs =
    runtimeRuns.length > 0 ? (runtimeRuns[0]?.durationMs ?? null) : null
  const perCallLatencyMs =
    runtimeRuns.length > 0
      ? Math.round(
          runtimeRuns.reduce((sum, run) => sum + run.durationMs, 0) /
            runtimeRuns.length,
        )
      : null
  rmSync(workDir, { force: true, recursive: true })
  return {
    schemaVersion: "tinygo-wasi-spike-v1.33",
    status: "built",
    recommendation: "defer",
    productionEnabled: false,
    countedEligibilityEnabled: false,
    toolchain: {
      tinygoAvailable: true,
      tinygoVersion,
      target: "wasi",
    },
    artifact: {
      hash,
      bytes: artifact.byteLength,
      imports,
      importAudit,
    },
    abiAttempt: {
      profile: "WASI Preview 1",
      envelope: "stdin/stdout JSON",
      result: runtimePass
        ? "Minimal stdin/stdout JSON program compiled and executed through Wasmtime for selectActivations and soldierBrain."
        : "Minimal stdin/stdout JSON program compiled, but Wasmtime execution did not complete the full runtime proof.",
    },
    measurements: {
      compileMs,
      startupLatencyMs,
      perCallLatencyMs,
      deterministicRepeatedExecution,
      invalidOutputBehavior,
      timeoutTrapBehavior,
    },
    publicSafe: true,
    failureTaxonomy: [
      ...(wasmtimeAvailable ? [] : ["wasmtime-unavailable"]),
      ...(importErrors.length === 0 ? [] : ["forbidden-imports"]),
      ...(runtimePass ? [] : ["runtime-proof-incomplete"]),
      ...(invalidOutputBehavior === "pass" ? [] : ["invalid-output-gap"]),
      ...(timeoutTrapBehavior === "pass" ? [] : ["timeout-gap"]),
      "no-production-promotion",
    ],
  }
}

const toMarkdown = (
  evidence: TinyGoSpikeEvidence,
): string => `# v1.33 TinyGo WASM/WASI Spike Evidence

- Status: ${evidence.status}
- Recommendation: ${evidence.recommendation}
- Production enabled: ${evidence.productionEnabled}
- Counted eligibility enabled: ${evidence.countedEligibilityEnabled}
- TinyGo available: ${evidence.toolchain.tinygoAvailable}
- TinyGo version: ${evidence.toolchain.tinygoVersion ?? "not installed"}
- Target: ${evidence.toolchain.target}
- Artifact hash: ${evidence.artifact.hash ?? "not built"}
- Artifact bytes: ${evidence.artifact.bytes ?? "not built"}
- Import audit: ${evidence.artifact.importAudit}
- ABI attempt: ${evidence.abiAttempt.profile}, ${evidence.abiAttempt.envelope}
- ABI result: ${evidence.abiAttempt.result}
- Compile ms: ${evidence.measurements.compileMs ?? "not run"}
- Startup latency ms: ${evidence.measurements.startupLatencyMs ?? "not run"}
- Per-call latency ms: ${evidence.measurements.perCallLatencyMs ?? "not run"}
- Determinism: ${evidence.measurements.deterministicRepeatedExecution}
- Invalid output behavior: ${evidence.measurements.invalidOutputBehavior}
- Timeout/trap behavior: ${evidence.measurements.timeoutTrapBehavior}
- Failure taxonomy: ${evidence.failureTaxonomy.join(", ")}

TinyGo remains spike-only. This evidence intentionally does not add TinyGo to
supported Strategy languages, counted eligibility, production labels, or public
entry flows.
`

const evidenceForCheck = (
  evidence: TinyGoSpikeEvidence,
): TinyGoSpikeEvidence => ({
  ...evidence,
  artifact: {
    ...evidence.artifact,
    hash: evidence.artifact.hash === null ? null : "<volatile-build-hash>",
  },
  measurements: {
    ...evidence.measurements,
    compileMs: evidence.measurements.compileMs === null ? null : 0,
    startupLatencyMs:
      evidence.measurements.startupLatencyMs === null ? null : 0,
    perCallLatencyMs:
      evidence.measurements.perCallLatencyMs === null ? null : 0,
  },
})

const markdownForCheck = (markdownText: string): string =>
  markdownText
    .replace(/- Artifact hash: .+/g, "- Artifact hash: <volatile-build-hash>")
    .replace(/- Compile ms: .+/g, "- Compile ms: <volatile-duration>")
    .replace(
      /- Startup latency ms: .+/g,
      "- Startup latency ms: <volatile-duration>",
    )
    .replace(
      /- Per-call latency ms: .+/g,
      "- Per-call latency ms: <volatile-duration>",
    )

const jsonForCheck = (jsonText: string): string =>
  serialize(evidenceForCheck(JSON.parse(jsonText) as TinyGoSpikeEvidence))

const evidence = runTinyGoSpike()
const json = serialize(evidence)
const markdown = toMarkdown(evidence)

if (checkMode) {
  const currentJson = existsSync(evidenceJsonPath)
    ? readFileSync(evidenceJsonPath, "utf8")
    : ""
  const currentMarkdown = existsSync(evidenceMarkdownPath)
    ? readFileSync(evidenceMarkdownPath, "utf8")
    : ""
  if (
    jsonForCheck(currentJson) !== jsonForCheck(json) ||
    markdownForCheck(currentMarkdown) !== markdownForCheck(markdown)
  ) {
    throw new Error(
      "TinyGo spike evidence is out of date. Run pnpm tinygo-wasi:spike.",
    )
  }
} else {
  mkdirSync(artifactDir, { recursive: true })
  writeFileSync(evidenceJsonPath, json)
  writeFileSync(evidenceMarkdownPath, markdown)
}

console.log(
  `TinyGo WASM/WASI spike ${evidence.status}; recommendation=${evidence.recommendation}`,
)
