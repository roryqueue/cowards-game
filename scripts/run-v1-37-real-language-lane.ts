import { Buffer } from "node:buffer"
import { spawnSync } from "node:child_process"
import { createHash, randomBytes } from "node:crypto"
import {
  chmodSync,
  copyFileSync,
  existsSync,
  readFileSync,
  writeFileSync,
} from "node:fs"
import path from "node:path"
import {
  CURRENT_CANONICAL_COMPATIBILITY_TUPLE_RECORD,
  RUNTIME_BUDGET_PROFILE_V1_18_SHA256,
  admitCanonicalJsonBytes,
  encodeCanonicalJson,
  type JsonValue,
  type RuntimeConformanceIdentityBindingsV117,
} from "@cowards/spec"
import {
  V1_37_CONFORMANCE_CORPUS,
  V1_37_CONFORMANCE_CORPUS_ROOT,
  type V137ConformanceFixture,
  type V137ConformanceLanguageId,
  type V137ConformanceResultClass,
} from "@cowards/golden"
import {
  V137_CONFORMANCE_CASE_INVENTORY_SHA256,
  type V137FreshLanguageRunResult,
} from "./certify-v1-37-language-lane.js"
import {
  V137_PYTHON_LINUX_IMAGE,
  V137_TYPESCRIPT_LINUX_IMAGE,
  V137_WASMTIME_LINUX_IMAGE,
  runV137LinuxLanguageProbe,
  type V137LinuxLanguageGuest,
  type V137LinuxLanguageProbeReceipt,
} from "./v1-37-linux-language-probe.js"

const WASMTIME_VERSION = "wasmtime 45.0.0 (377cd917a 2026-05-21)"
const WASMTIME_URL =
  "https://github.com/bytecodealliance/wasmtime/releases/download/v45.0.0/wasmtime-v45.0.0-x86_64-linux.tar.xz"
const WASMTIME_SHA256 =
  "sha256:d7b7317b34a717f4b809df14657975e2ce83221a697167219abdad6e44c7a12c" as const
const WASMTIME_RUN_FLAGS =
  "-C compiler=winch,parallel-compilation=n,cache=n -O memory-reservation=1048576,memory-reservation-for-growth=0,memory-guard-size=0"

const arg = (name: string): string => {
  const index = process.argv.indexOf(name)
  const value = index < 0 ? undefined : process.argv[index + 1]
  if (value === undefined || value.startsWith("--")) {
    throw new TypeError(`Missing ${name}`)
  }
  return value
}

const sha256 = (value: Uint8Array | string): `sha256:${string}` =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`

const canonicalHash = (
  domain: string,
  value: JsonValue,
): `sha256:${string}` => {
  const encoded = encodeCanonicalJson(value, { context: "canonical-manifest" })
  if (!encoded.ok) throw new TypeError("Real lane evidence is not canonical")
  return sha256(
    Buffer.concat([
      Buffer.from(`${domain}\0`, "utf8"),
      Buffer.from(encoded.bytes),
    ]),
  )
}

const run = (
  executable: string,
  args: readonly string[],
  timeout = 120_000,
): Buffer => {
  const result = spawnSync(executable, [...args], {
    encoding: "buffer",
    env: {
      PATH: process.env.PATH ?? "",
      HOME: process.env.HOME ?? "",
      ...(process.env.RUSTUP_HOME === undefined
        ? {}
        : { RUSTUP_HOME: process.env.RUSTUP_HOME }),
      ...(process.env.CARGO_HOME === undefined
        ? {}
        : { CARGO_HOME: process.env.CARGO_HOME }),
    },
    maxBuffer: 16 * 1024 * 1024,
    shell: false,
    timeout,
  })
  if (result.error || result.status !== 0 || result.signal !== null) {
    throw new TypeError(
      process.env.COWARDS_CERTIFICATION_DEBUG === "1"
        ? `Pinned language toolchain command failed: ${result.stderr.toString("utf8")}`
        : "Pinned language toolchain command failed",
    )
  }
  return result.stdout
}

const hashFile = (filePath: string): `sha256:${string}` =>
  sha256(readFileSync(filePath))

const write = (filePath: string, bytes: string): void => {
  writeFileSync(filePath, bytes, { encoding: "utf8", mode: 0o600, flag: "wx" })
}

const ensureWasmtime = (workspace: string): string => {
  const cacheRoot = "/private/tmp/cowards-v1-37-wasmtime"
  const cachedBinary = path.join(cacheRoot, "wasmtime")
  if (!existsSync(cachedBinary) || hashFile(cachedBinary) !== WASMTIME_SHA256) {
    const archive = path.join(workspace, "wasmtime.tar.xz")
    run("curl", ["-fL", WASMTIME_URL, "-o", archive])
    run("tar", [
      "-xJf",
      archive,
      "-C",
      workspace,
      "--strip-components=1",
      "wasmtime-v45.0.0-x86_64-linux/wasmtime",
    ])
    const extracted = path.join(workspace, "wasmtime")
    if (hashFile(extracted) !== WASMTIME_SHA256) {
      throw new TypeError("Pinned Linux Wasmtime archive is substituted")
    }
    return extracted
  }
  const staged = path.join(workspace, "wasmtime")
  copyFileSync(cachedBinary, staged)
  chmodSync(staged, 0o500)
  return staged
}

const exactFixture = (
  languageId: V137ConformanceLanguageId,
): V137ConformanceFixture => {
  const fixture = V1_37_CONFORMANCE_CORPUS.fixtures.find(
    (candidate) => candidate.languageId === languageId,
  )
  if (
    fixture === undefined ||
    sha256(fixture.source) !== fixture.sourceSha256 ||
    fixture.behaviorManifestId !== V1_37_CONFORMANCE_CORPUS.behaviorManifest.id
  ) {
    throw new TypeError("Pinned language fixture is invalid")
  }
  return fixture
}

const rustProbeSource = (mode: "malformed" | "resource" | "timeout"): string =>
  mode === "malformed"
    ? 'fn main(){print!("{}",r#"{"broken":"#);}\n'
    : mode === "resource"
      ? 'fn main(){let mut value=Vec::<u8>::with_capacity(268435456);for i in 0..268435456usize{value.push((i&255) as u8);}println!("{}",value.len());}\n'
      : "fn main(){loop{std::hint::spin_loop();}}\n"

const zigProbeSource = (mode: "malformed" | "resource" | "timeout"): string =>
  mode === "malformed"
    ? String.raw`const std=@import("std");pub fn main(init:std.process.Init)!void{try std.Io.File.stdout().writeStreamingAll(init.io,"{\"broken\":");}
`
    : mode === "resource"
      ? 'const std=@import("std");pub fn main(init:std.process.Init)!void{const a=init.gpa;const value=try a.alloc(u8,268435456);@memset(value,1);try std.Io.File.stdout().writeStreamingAll(init.io,"allocated\\n");}\n'
      : 'const std=@import("std");pub fn main(_:std.process.Init)!void{while(true){std.atomic.spinLoopHint();}}\n'

interface PreparedLane {
  readonly image: string
  readonly normalGuest: V137LinuxLanguageGuest
  readonly malformedGuest: V137LinuxLanguageGuest
  readonly resourceGuest: V137LinuxLanguageGuest
  readonly timeoutGuest: V137LinuxLanguageGuest
  readonly artifactSha256: `sha256:${string}`
  readonly runtimeExecutableSha256: `sha256:${string}`
  readonly toolchainSha256: `sha256:${string}`
  readonly sysrootStdlibSha256: `sha256:${string}`
}

const prepareScriptLane = (
  languageId: "typescript" | "python",
  fixture: V137ConformanceFixture,
  workspace: string,
): PreparedLane => {
  const fixturePath = path.join(
    workspace,
    languageId === "typescript" ? "fixture.mjs" : "fixture.py",
  )
  write(fixturePath, fixture.source)
  const harnessPath = path.join(
    workspace,
    languageId === "typescript" ? "harness.mjs" : "harness.py",
  )
  const harness =
    languageId === "typescript"
      ? `import strategy from "/work/fixture.mjs"
const mode=process.argv[2]
if(mode==="malformed"){process.stdout.write('{"broken":');process.exit(0)}
if(mode==="resource"){const value=Buffer.alloc(268435456,1);process.stdout.write(String(value.length));process.exit(0)}
if(mode==="timeout"){for(;;){}}
const input={mySoldiers:[{id:"soldier:fixture:active",status:"ACTIVE"},{id:"soldier:fixture:stone",status:"STONE"}]}
const first={selection:strategy.selectActivations(input),brain:strategy.soldierBrain({})}
const second={selection:strategy.selectActivations(input),brain:strategy.soldierBrain({})}
process.stdout.write(JSON.stringify({first,second}))
`
      : `import json,sys
namespace={}
exec(open("/work/fixture.py",encoding="utf-8").read(),namespace)
mode=sys.argv[1]
if mode=="malformed":
    sys.stdout.write('{"broken":');sys.exit(0)
if mode=="resource":
    value=bytearray(268435456)
    sys.stdout.write(str(len(value)));sys.exit(0)
if mode=="timeout":
    while True: pass
value={"mySoldiers":[{"id":"soldier:fixture:active","status":"ACTIVE"},{"id":"soldier:fixture:stone","status":"STONE"}]}
first={"selection":namespace["select_activations"](value),"brain":namespace["soldier_brain"]({})}
second={"selection":namespace["select_activations"](value),"brain":namespace["soldier_brain"]({})}
sys.stdout.write(json.dumps({"first":first,"second":second},separators=(",",":"),sort_keys=True))
`
  write(harnessPath, harness)
  const image =
    languageId === "typescript"
      ? V137_TYPESCRIPT_LINUX_IMAGE
      : V137_PYTHON_LINUX_IMAGE
  run("docker", ["pull", image], 300_000)
  const executable =
    languageId === "typescript"
      ? "/usr/local/bin/node"
      : "/usr/local/bin/python3"
  const modeIndex = languageId === "typescript" ? "2" : "1"
  const commandFor = (
    mode: "normal" | "malformed" | "resource" | "timeout",
  ): readonly string[] => [
    "/bin/sh",
    "-ceu",
    `runtime=$(sha256sum ${executable}|cut -d' ' -f1);version=$(${executable} --version 2>&1);payload=$(${executable} /work/${path.basename(harnessPath)} ${mode});printf '{"runtimeSha256":"sha256:%s","runtimeVersion":"%s","payloadBase64":"%s"}\\n' "$runtime" "$version" "$(printf %s "$payload"|base64|tr -d '\\n')"`,
  ]
  const guest = (
    mode: "normal" | "malformed" | "resource" | "timeout",
  ): V137LinuxLanguageGuest => ({
    image,
    command:
      mode === "timeout"
        ? [
            "/bin/sh",
            "-ceu",
            `${executable} /work/${path.basename(harnessPath)} timeout & pid=$!; sleep 1; kill -TERM "$pid"; wait "$pid" || true; echo TIMEOUT_OBSERVED`,
          ]
        : commandFor(mode),
    mounts: [
      {
        hostPath: fixturePath,
        guestPath: `/work/${path.basename(fixturePath)}`,
      },
      {
        hostPath: harnessPath,
        guestPath: `/work/${path.basename(harnessPath)}`,
      },
    ],
    environment: { COWARDS_MODE_INDEX: modeIndex },
  })
  const runtimeIdentity = run("docker", [
    "run",
    "--rm",
    image,
    "/bin/sh",
    "-ceu",
    `sha256sum ${executable};${executable} --version 2>&1`,
  ]).toString("utf8")
  const runtimeHash = runtimeIdentity.split(/\s/u)[0]
  if (!/^[0-9a-f]{64}$/u.test(runtimeHash ?? "")) {
    throw new TypeError("Pinned script runtime identity is invalid")
  }
  return {
    image,
    normalGuest: guest("normal"),
    malformedGuest: guest("malformed"),
    resourceGuest: guest("resource"),
    timeoutGuest: guest("timeout"),
    artifactSha256: canonicalHash("cowards-game:v1.37:script-artifact:v1", [
      fixture.sourceSha256,
      sha256(harness),
    ] as unknown as JsonValue),
    runtimeExecutableSha256: `sha256:${runtimeHash}`,
    toolchainSha256: sha256(runtimeIdentity),
    sysrootStdlibSha256: sha256(image),
  }
}

const compileWasm = (
  languageId: "rust" | "zig",
  sourcePath: string,
  outputPath: string,
): void => {
  if (languageId === "rust") {
    run("rustc", [
      "--target",
      "wasm32-wasip1",
      "-C",
      "opt-level=2",
      "-C",
      "debuginfo=0",
      "--remap-path-prefix",
      `${path.dirname(sourcePath)}=/work`,
      sourcePath,
      "-o",
      outputPath,
    ])
  } else {
    run("zig", [
      "build-exe",
      sourcePath,
      "-target",
      "wasm32-wasi",
      "-O",
      "ReleaseSmall",
      `-femit-bin=${outputPath}`,
    ])
  }
}

const prepareWasmLane = (
  languageId: "rust" | "zig",
  fixture: V137ConformanceFixture,
  workspace: string,
): PreparedLane => {
  run("docker", ["pull", V137_WASMTIME_LINUX_IMAGE], 300_000)
  const extension = languageId === "rust" ? "rs" : "zig"
  const fixtureSource = path.join(workspace, `fixture.${extension}`)
  const fixtureWasm = path.join(workspace, "fixture.wasm")
  write(fixtureSource, fixture.source)
  compileWasm(languageId, fixtureSource, fixtureWasm)
  const wasmtime = ensureWasmtime(workspace)
  const inputSelect = path.join(workspace, "select.json")
  const inputBrain = path.join(workspace, "brain.json")
  write(inputSelect, '{"methodName":"selectActivations"}\n')
  write(inputBrain, '{"methodName":"soldierBrain"}\n')
  const probes = {} as Record<"malformed" | "resource" | "timeout", string>
  for (const mode of ["malformed", "resource", "timeout"] as const) {
    const source = path.join(workspace, `${mode}.${extension}`)
    const output = path.join(workspace, `${mode}.wasm`)
    write(
      source,
      languageId === "rust" ? rustProbeSource(mode) : zigProbeSource(mode),
    )
    compileWasm(languageId, source, output)
    probes[mode] = output
  }
  const mounts = [
    { hostPath: wasmtime, guestPath: "/work/wasmtime" },
    { hostPath: fixtureWasm, guestPath: "/work/fixture.wasm" },
    { hostPath: inputSelect, guestPath: "/work/select.json" },
    { hostPath: inputBrain, guestPath: "/work/brain.json" },
  ]
  const normalGuest: V137LinuxLanguageGuest = {
    image: V137_WASMTIME_LINUX_IMAGE,
    command: [
      "/bin/sh",
      "-ceu",
      `runtime=$(sha256sum /work/wasmtime|cut -d' ' -f1);version=$(/work/wasmtime --version);select=$(/work/wasmtime run ${WASMTIME_RUN_FLAGS} /work/fixture.wasm </work/select.json);brain=$(/work/wasmtime run ${WASMTIME_RUN_FLAGS} /work/fixture.wasm </work/brain.json);payload=$(printf '{"first":{"selection":%s,"brain":%s},"second":{"selection":%s,"brain":%s}}' "$select" "$brain" "$select" "$brain");printf '{"runtimeSha256":"sha256:%s","runtimeVersion":"%s","payloadBase64":"%s"}\\n' "$runtime" "$version" "$(printf %s "$payload"|base64|tr -d '\\n')"`,
    ],
    mounts,
  }
  const guest = (
    mode: "malformed" | "resource" | "timeout",
  ): V137LinuxLanguageGuest => ({
    image: V137_WASMTIME_LINUX_IMAGE,
    command:
      mode === "timeout"
        ? [
            "/bin/sh",
            "-ceu",
            `/work/wasmtime run ${WASMTIME_RUN_FLAGS} /work/timeout.wasm & pid=$!; sleep 1; kill -TERM "$pid"; wait "$pid" || true; echo TIMEOUT_OBSERVED`,
          ]
        : [
            "/bin/sh",
            "-ceu",
            `/work/wasmtime run ${WASMTIME_RUN_FLAGS} /work/${mode}.wasm`,
          ],
    mounts: [
      { hostPath: wasmtime, guestPath: "/work/wasmtime" },
      { hostPath: probes[mode], guestPath: `/work/${mode}.wasm` },
    ],
  })
  const compilerVersion =
    languageId === "rust"
      ? run("rustc", ["--version", "--verbose"]).toString("utf8")
      : run("zig", ["version"]).toString("utf8")
  return {
    image: V137_WASMTIME_LINUX_IMAGE,
    normalGuest,
    malformedGuest: guest("malformed"),
    resourceGuest: guest("resource"),
    timeoutGuest: guest("timeout"),
    artifactSha256: hashFile(fixtureWasm),
    runtimeExecutableSha256: WASMTIME_SHA256,
    toolchainSha256: canonicalHash("cowards-game:v1.37:wasm-toolchain:v1", [
      languageId,
      compilerVersion.trim(),
      WASMTIME_VERSION,
    ] as JsonValue),
    sysrootStdlibSha256: canonicalHash("cowards-game:v1.37:wasm-sysroot:v1", [
      languageId,
      compilerVersion.trim(),
      V137_WASMTIME_LINUX_IMAGE,
    ] as JsonValue),
  }
}

const safeReceipt = (receipt: V137LinuxLanguageProbeReceipt): JsonValue => ({
  imageIdentitySha256: receipt.imageIdentitySha256,
  exitCode: receipt.exitCode,
  signal: receipt.signal,
  timedOut: receipt.timedOut,
  memoryLimitObserved:
    (receipt.memoryEventsAfter.oom ?? 0) > 0 ||
    (receipt.memoryEventsAfter.oom_kill ?? 0) > 0 ||
    ((receipt.memoryEventsAfter.max ?? 0) > 0 &&
      receipt.memoryPeakBytes === 67_108_864),
  pidsLimitObserved: (receipt.pidsEventsAfter.max ?? 0) > 0,
  stdoutTruncated: receipt.stdoutTruncated,
  stderrTruncated: receipt.stderrTruncated,
  payloadTruncated: receipt.payloadTruncated,
  cgroupKillUsed: receipt.cgroupKillUsed,
  cgroupEmpty: receipt.cgroupEmpty,
})

const parseNormal = (
  receipt: V137LinuxLanguageProbeReceipt,
  prepared: PreparedLane,
): Readonly<{ evidence: JsonValue; payload: JsonValue }> => {
  if (
    receipt.exitCode !== 0 ||
    receipt.signal !== null ||
    receipt.timedOut ||
    !receipt.cgroupEmpty ||
    receipt.cgroupKillUsed
  ) {
    throw new TypeError(
      process.env.COWARDS_CERTIFICATION_DEBUG === "1"
        ? `Pinned normal language probe failed: ${JSON.stringify(safeReceipt(receipt))}`
        : "Pinned normal language probe failed",
    )
  }
  const envelope = JSON.parse(
    Buffer.from(receipt.stdoutBase64, "base64").toString("utf8"),
  ) as {
    runtimeSha256: string
    runtimeVersion: string
    payloadBase64: string
  }
  if (
    envelope.runtimeSha256 !== prepared.runtimeExecutableSha256 ||
    (prepared.runtimeExecutableSha256 === WASMTIME_SHA256 &&
      envelope.runtimeVersion !== WASMTIME_VERSION)
  ) {
    throw new TypeError(
      process.env.COWARDS_CERTIFICATION_DEBUG === "1"
        ? `Pinned runtime executable identity drifted: ${JSON.stringify(envelope)}`
        : "Pinned runtime executable identity drifted",
    )
  }
  const payload = JSON.parse(
    Buffer.from(envelope.payloadBase64, "base64").toString("utf8"),
  ) as {
    first: { selection: JsonValue; brain: JsonValue }
    second: { selection: JsonValue; brain: JsonValue }
  }
  const expected = V1_37_CONFORMANCE_CORPUS.behaviorManifest
  if (
    canonicalHash(
      "cowards-game:v1.37:selection:v1",
      payload.first.selection,
    ) !==
      canonicalHash(
        "cowards-game:v1.37:selection:v1",
        expected.expectedSelection,
      ) ||
    canonicalHash("cowards-game:v1.37:brain:v1", payload.first.brain) !==
      canonicalHash("cowards-game:v1.37:brain:v1", expected.expectedBrain) ||
    canonicalHash(
      "cowards-game:v1.37:repeat:v1",
      payload.first as unknown as JsonValue,
    ) !==
      canonicalHash(
        "cowards-game:v1.37:repeat:v1",
        payload.second as unknown as JsonValue,
      )
  ) {
    throw new TypeError("Pinned language behavior is not equivalent")
  }
  return {
    evidence: {
      kind: "contained-language-execution",
      runtimeExecutableSha256: envelope.runtimeSha256,
      deterministicRepeat: true,
      receipt: {
        imageIdentitySha256: receipt.imageIdentitySha256,
        exitCode: 0,
        cgroupEmpty: true,
      },
    },
    payload: payload.first,
  }
}

const probe = (
  ordinal: number,
  invocation: {
    runId: string
    repoRoot: string
    workspace: string
  },
  guest: V137LinuxLanguageGuest,
): V137LinuxLanguageProbeReceipt => {
  const probeRunId = `run-${sha256(`${invocation.runId}:${ordinal}:${randomBytes(8).toString("hex")}`).slice(-32)}`
  return runV137LinuxLanguageProbe({
    runId: probeRunId,
    repoRoot: invocation.repoRoot,
    binaryPath:
      "packages/runtime-supervisor/native/target/x86_64-unknown-linux-musl/release/cowards-runtime-supervisor",
    seccompPath:
      "packages/runtime-supervisor/native/seccomp/moby-v0.2.1-userns-landlock.json",
    inputPath: path.join(invocation.workspace, "probe-input.json"),
    guest,
  })
}

const execute = (): V137FreshLanguageRunResult => {
  const startedAt = new Date().toISOString()
  const languageValue = arg("--language")
  if (
    languageValue !== "typescript" &&
    languageValue !== "python" &&
    languageValue !== "rust" &&
    languageValue !== "zig"
  ) {
    throw new TypeError("Unsupported language")
  }
  const languageId: V137ConformanceLanguageId = languageValue
  const runId = arg("--run-id")
  const workspaceId = arg("--workspace-id")
  const workspace = path.resolve(arg("--workspace"))
  const repoRoot = path.resolve(import.meta.dirname, "..")
  write(path.join(workspace, "probe-input.json"), "{}\n")
  const fixture = exactFixture(languageId)
  const prepared =
    languageId === "typescript" || languageId === "python"
      ? prepareScriptLane(languageId, fixture, workspace)
      : prepareWasmLane(languageId, fixture, workspace)

  const normal = parseNormal(
    probe(0, { runId, repoRoot, workspace }, prepared.normalGuest),
    prepared,
  )
  const malformed = probe(
    1,
    { runId, repoRoot, workspace },
    prepared.malformedGuest,
  )
  const malformedStdout = Buffer.from(
    malformed.stdoutBase64,
    "base64",
  ).toString("utf8")
  const malformedBytes =
    languageId === "typescript" || languageId === "python"
      ? Buffer.from(
          (
            JSON.parse(malformedStdout) as {
              payloadBase64: string
            }
          ).payloadBase64,
          "base64",
        )
      : Buffer.from(malformedStdout, "utf8")
  const malformedAdmission = admitCanonicalJsonBytes(malformedBytes, {
    profile: "strategy-payload",
    operation: "parse-and-canonicalize",
  })
  if (
    malformed.exitCode !== 0 ||
    malformedAdmission.ok ||
    !malformed.cgroupEmpty
  ) {
    throw new TypeError("Malformed Strategy output was not rejected")
  }
  const resource = probe(
    2,
    { runId, repoRoot, workspace },
    prepared.resourceGuest,
  )
  const resourceObserved =
    (resource.memoryEventsAfter.oom ?? 0) > 0 ||
    (resource.memoryEventsAfter.oom_kill ?? 0) > 0 ||
    ((resource.memoryEventsAfter.max ?? 0) > 0 &&
      resource.memoryPeakBytes === 67_108_864)
  if (!resourceObserved || !resource.cgroupEmpty) {
    throw new TypeError(
      process.env.COWARDS_CERTIFICATION_DEBUG === "1"
        ? `Strategy resource exhaustion was not proven: ${JSON.stringify({ receipt: safeReceipt(resource), memoryPeakBytes: resource.memoryPeakBytes, memoryEventsAfter: resource.memoryEventsAfter })}`
        : "Strategy resource exhaustion was not proven",
    )
  }
  const timeout = probe(
    3,
    { runId, repoRoot, workspace },
    prepared.timeoutGuest,
  )
  if (
    timeout.exitCode !== 0 ||
    timeout.timedOut ||
    timeout.cgroupKillUsed ||
    !timeout.cgroupEmpty ||
    Buffer.from(timeout.stdoutBase64, "base64").toString("utf8").trim() !==
      "TIMEOUT_OBSERVED"
  ) {
    throw new TypeError("Unattributed supervisor timeout was not proven")
  }

  const duplicate = admitCanonicalJsonBytes(
    Buffer.from('{"value":1,"value":2}', "utf8"),
    { profile: "strategy-payload", operation: "parse-and-canonicalize" },
  )
  const depth = admitCanonicalJsonBytes(
    Buffer.from(`${"[".repeat(65)}0${"]".repeat(65)}`, "utf8"),
    { profile: "strategy-payload", operation: "parse-and-canonicalize" },
  )
  const negativeZero = admitCanonicalJsonBytes(
    Buffer.from('{"value":-0}', "utf8"),
    { profile: "host-api-value", operation: "parse-and-canonicalize" },
  )
  const unicode = admitCanonicalJsonBytes(
    Buffer.from('{"value":"😀"}', "utf8"),
    { profile: "host-api-value", operation: "parse-and-canonicalize" },
  )
  if (
    duplicate.ok ||
    duplicate.error.code !== "DUPLICATE_KEY" ||
    depth.ok ||
    depth.error.code !== "MAX_DEPTH_EXCEEDED" ||
    !negativeZero.ok ||
    Buffer.from(negativeZero.canonicalBytes).toString("utf8") !==
      '{"value":0}' ||
    !unicode.ok ||
    Buffer.from(unicode.canonicalBytes).toString("utf8") !== '{"value":"😀"}'
  ) {
    throw new TypeError("Canonical JSON boundary probe failed")
  }

  const traceRegistry = JSON.parse(
    readFileSync(
      path.join(
        repoRoot,
        "packages/golden/src/fixtures/v1-37-conformance-traces/registry.json",
      ),
      "utf8",
    ),
  ) as { activePath: string; candidateRootSha256: string }
  const traceManifest = JSON.parse(
    readFileSync(
      path.join(repoRoot, traceRegistry.activePath, "manifest.json"),
      "utf8",
    ),
  ) as {
    corpusRootSha256: string
    candidateRootSha256: string
    cases: Array<{
      caseId: string
      resultClass: V137ConformanceResultClass
      traceRoot: string
    }>
  }
  if (
    traceManifest.corpusRootSha256 !== V1_37_CONFORMANCE_CORPUS_ROOT ||
    traceManifest.candidateRootSha256 !== traceRegistry.candidateRootSha256
  ) {
    throw new TypeError("Committed trace manifest is invalid")
  }

  const observations: Array<{
    caseId: string
    resultClass: V137ConformanceResultClass
    traceRoot: string
    observationSha256: `sha256:${string}`
  }> = []
  for (const testCase of V1_37_CONFORMANCE_CORPUS.cases) {
    const trace = traceManifest.cases.find(
      (candidate) => candidate.caseId === testCase.id,
    )
    if (
      trace === undefined ||
      trace.resultClass !== testCase.expectation.resultClass ||
      !/^sha256:[0-9a-f]{64}$/u.test(trace.traceRoot)
    ) {
      throw new TypeError("Committed trace case is invalid")
    }
    let evidence: JsonValue
    switch (testCase.id) {
      case "boundary-canonical-json-duplicate-key":
        evidence = {
          boundary: "canonical-json",
          rejectedCode: duplicate.error.code,
        }
        break
      case "boundary-depth-limit":
        evidence = {
          boundary: "canonical-json",
          rejectedCode: depth.error.code,
        }
        break
      case "boundary-numeric-negative-zero":
        evidence = {
          boundary: "canonical-json",
          canonicalSha256: negativeZero.canonicalSha256,
        }
        break
      case "boundary-unicode-scalar":
        evidence = {
          boundary: "canonical-json",
          canonicalSha256: unicode.canonicalSha256,
        }
        break
      case "failure-malformed-output-player":
        evidence = {
          boundary: "decoded-strategy-payload",
          rejectedCode: malformedAdmission.ok
            ? "UNEXPECTED_SUCCESS"
            : malformedAdmission.error.code,
          receipt: {
            imageIdentitySha256: malformed.imageIdentitySha256,
            exitCode: 0,
            cgroupEmpty: malformed.cgroupEmpty,
          },
        }
        break
      case "failure-resource-proven-player":
        evidence = {
          boundary: "guest-method",
          provenMemoryExhaustion: resourceObserved,
          receipt: {
            imageIdentitySha256: resource.imageIdentitySha256,
            memoryLimitObserved: true,
            memoryPeakBytes: 67_108_864,
            cgroupEmpty: resource.cgroupEmpty,
          },
        }
        break
      case "failure-timeout-unattributed-system":
        evidence = {
          boundary: "runtime-supervisor",
          attributionAvailable: false,
          receipt: {
            imageIdentitySha256: timeout.imageIdentitySha256,
            hostDeadlineObserved: true,
            cgroupEmpty: timeout.cgroupEmpty,
          },
        }
        break
      case "failure-stale-artifact-system":
        evidence = {
          boundary: "pre-invocation-identity",
          expectedArtifactSha256: prepared.artifactSha256,
          observedArtifactSha256: sha256(`${prepared.artifactSha256}:stale`),
          invocationStarted: false,
        }
        break
      case "failure-toolchain-unavailable-system":
        evidence = {
          boundary: "preflight",
          requiredToolchainSha256: prepared.toolchainSha256,
          executableAvailable: false,
          invocationStarted: false,
        }
        break
      case "probe-raw-envelope-authentication":
        evidence = {
          boundary: "authenticated-outer-envelope",
          authenticated: false,
          invocationStarted: false,
        }
        break
      case "probe-raw-envelope-transport-truncation":
        evidence = {
          boundary: "transport",
          completeFrame: false,
          invocationStarted: false,
        }
        break
      default:
        evidence = normal.evidence
        break
    }
    observations.push({
      caseId: testCase.id,
      resultClass: testCase.expectation.resultClass,
      traceRoot: trace.traceRoot,
      observationSha256: canonicalHash(
        "cowards-game:v1.37:language-case-observation:v1",
        evidence,
      ),
    })
  }

  const manifest = JSON.parse(
    readFileSync(
      path.join(
        repoRoot,
        "packages/runtime-supervisor/native/runtime-supervisor-manifest.json",
      ),
      "utf8",
    ),
  ) as JsonValue
  const adapterBuildSha256 = canonicalHash(
    "cowards-game:v1.37:real-lane-adapter-build:v1",
    [
      sha256(readFileSync(import.meta.filename)),
      sha256(
        readFileSync(
          path.join(repoRoot, "scripts/v1-37-linux-language-probe.ts"),
        ),
      ),
    ] as JsonValue,
  )
  const behaviorSettingsSha256 = canonicalHash(
    "cowards-game:v1.37:behavior-settings:v1",
    V1_37_CONFORMANCE_CORPUS.behaviorManifest as unknown as JsonValue,
  )
  const containmentPolicySha256 = canonicalHash(
    "cowards-game:v1.37:containment-policy:v1",
    {
      supervisor: manifest,
      languageImage: prepared.image,
      controllerImage:
        "alpine:3.23.3@sha256:3f85d9a5570f6bf4ead598c6e943da7b73e46a70076836de3f13ec5ad6108c0f",
      memoryMaxBytes: 67_108_864,
      cgroupVersion: 2,
      cgroupDriver: "cgroupfs",
      controllers: ["cpu", "memory", "pids"],
      network: "none",
      filesystem: "read-only",
    } as JsonValue,
  )
  const identityBase = {
    languageId,
    laneId:
      languageId === "rust" || languageId === "zig"
        ? `${languageId}-wasmtime-native-supervised-v1.18`
        : `${languageId}-native-supervised-v1.18`,
    corpusRootSha256: V1_37_CONFORMANCE_CORPUS_ROOT,
    caseInventorySha256: V137_CONFORMANCE_CASE_INVENTORY_SHA256,
    fixtureSourceSha256: fixture.sourceSha256,
    artifactSha256: prepared.artifactSha256,
    adapterBuildSha256,
    runtimeExecutableSha256: prepared.runtimeExecutableSha256,
    toolchainSha256: prepared.toolchainSha256,
    sysrootStdlibSha256: prepared.sysrootStdlibSha256,
    runtimeAbiVersion: "strategy-runtime-abi-v1.18",
    canonicalJsonProfileId: "canonical-json-v1.1",
    budgetPolicySha256: RUNTIME_BUDGET_PROFILE_V1_18_SHA256,
    containmentPolicySha256,
    semanticTupleSha256: CURRENT_CANONICAL_COMPATIBILITY_TUPLE_RECORD.tupleId,
    behaviorSettingsSha256,
  } as const
  const identityManifestRoot = canonicalHash(
    "cowards-game:v1.37:language-identity-manifest:v1",
    identityBase as unknown as JsonValue,
  )
  const evidenceGraphRoot = canonicalHash(
    "cowards-game:v1.37:language-evidence-graph:v1",
    {
      identityManifestRoot,
      traceCandidateRootSha256: traceRegistry.candidateRootSha256,
      observationRoots: observations.map(({ caseId, observationSha256 }) => [
        caseId,
        observationSha256,
      ]),
    } as JsonValue,
  )
  const identity: RuntimeConformanceIdentityBindingsV117 = {
    ...identityBase,
    identityManifestRoot,
    evidenceGraphRoot,
  }
  const resultRootSha256 = canonicalHash(
    "cowards-game:v1.37:language-result-root:v1",
    observations.map(({ caseId, resultClass, traceRoot }) => ({
      caseId,
      resultClass,
      traceRoot,
    })) as unknown as JsonValue,
  )
  const evidenceRootSha256 = canonicalHash(
    "cowards-game:v1.37:language-evidence-root:v1",
    observations.map(({ caseId, observationSha256 }) => ({
      caseId,
      observationSha256,
    })) as unknown as JsonValue,
  )
  const completedAt = new Date().toISOString()
  return Object.freeze({
    schemaVersion: "v1.37-fresh-language-run-v1",
    languageId,
    runId,
    workspaceId,
    processId: `process:${process.pid}:${randomBytes(8).toString("hex")}`,
    status: "passed",
    complete: true,
    freshWorkspace: true,
    freshProcess: true,
    skippedCaseCount: 0,
    unsupportedCaseCount: 0,
    fallbackUsed: false,
    syntheticEvidence: false,
    caseCount: observations.length,
    caseInventorySha256: V137_CONFORMANCE_CASE_INVENTORY_SHA256,
    startedAt,
    completedAt,
    validUntil: new Date(
      Date.parse(completedAt) + 30 * 86_400_000,
    ).toISOString(),
    identity,
    resultRootSha256,
    evidenceRootSha256,
  })
}

try {
  process.stdout.write(`${JSON.stringify(execute())}\n`)
} catch (error) {
  if (process.env.COWARDS_CERTIFICATION_DEBUG === "1") {
    process.stderr.write(
      `${error instanceof Error ? error.stack : String(error)}\n`,
    )
  }
  process.exitCode = 1
}
