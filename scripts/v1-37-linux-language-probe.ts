import { Buffer } from "node:buffer"
import { spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import path from "node:path"
// eslint-disable-next-line no-restricted-imports -- privileged certification orchestration reuses the exact internal pinned-container argument contract.
import {
  CERTIFICATION_GUEST_NAMESPACE_UID,
  CERTIFICATION_SUPERVISOR_UID,
  PINNED_CERTIFICATION_LINUX_IMAGE,
  certificationBootstrapArgs,
  certificationFinalizerArgs,
  certificationMonitorArgs,
  type CertificationContainerInput,
} from "../packages/runtime-supervisor/src/linux-certification-container.js"

export const V137_TYPESCRIPT_LINUX_IMAGE =
  "node:26.0.0-alpine3.23@sha256:eb2ff22e292cafc20a333e889d8993cfb1604d1fe545f13fa86ff1a45534d1d7" as const
export const V137_PYTHON_LINUX_IMAGE =
  "python:3.13.5-alpine3.22@sha256:f1a962d8ffa50b2006b72b4713a09a89e57def2d28ac28a36900bc070a00db61" as const
export const V137_WASMTIME_LINUX_IMAGE =
  "debian:bookworm-slim@sha256:63a496b5d3b99214b39f5ed70eb71a61e590a77979c79cbee4faf991f8c0783e" as const

const CERTIFICATION_NONCE = "certification-nonce-00000000000000000001"
const CERTIFICATION_INVOCATION =
  "invocation-certification-nonce-00000000000000000001"

const descriptor = (runId: string): string =>
  [
    "cowards-game:linux-certification-delegation:v1.18",
    runId,
    `supervisor-uid=${CERTIFICATION_SUPERVISOR_UID}`,
    `guest-host-uid=${CERTIFICATION_GUEST_NAMESPACE_UID}`,
    "controllers=cpu,memory,pids",
    "mode=0700",
  ].join("\n")

const sha256 = (value: Uint8Array | string): `sha256:${string}` =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`

const runDocker = (
  args: readonly string[],
  input?: Uint8Array,
  timeout = 30_000,
): Buffer => {
  const result = spawnSync("docker", [...args], {
    encoding: "buffer",
    env: { PATH: process.env.PATH ?? "" },
    ...(input === undefined ? {} : { input }),
    maxBuffer: 4 * 1024 * 1024,
    shell: false,
    timeout,
  })
  if (result.error || result.status !== 0 || result.signal !== null) {
    throw new TypeError("Pinned language certification container failed")
  }
  return result.stdout
}

const waitForReady = (monitorName: string): void => {
  const deadline = Date.now() + 10_000
  while (Date.now() < deadline) {
    const result = spawnSync(
      "docker",
      [
        "exec",
        "--user",
        `${CERTIFICATION_SUPERVISOR_UID}:${CERTIFICATION_SUPERVISOR_UID}`,
        monitorName,
        "/bin/sh",
        "-ceu",
        "cat /run/cowards-control/ready",
      ],
      {
        encoding: "utf8",
        env: { PATH: process.env.PATH ?? "" },
        shell: false,
        timeout: 1_000,
      },
    )
    if (result.status === 0 && result.stdout.trim() === CERTIFICATION_NONCE) {
      return
    }
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 10)
  }
  throw new TypeError("Pinned language monitor readiness timed out")
}

const writeControl = (
  monitorName: string,
  fileName: "completion" | "stdout" | "stderr",
  bytes: Uint8Array,
): void => {
  runDocker(
    [
      "exec",
      "--interactive",
      "--user",
      `${CERTIFICATION_SUPERVISOR_UID}:${CERTIFICATION_SUPERVISOR_UID}`,
      monitorName,
      "/bin/sh",
      "-ceu",
      fileName === "completion"
        ? "umask 077; cat > /run/cowards-control/completion.tmp; mv /run/cowards-control/completion.tmp /run/cowards-control/completion"
        : `umask 077; cat > /run/cowards-control/${fileName}`,
    ],
    bytes,
    5_000,
  )
}

const monitorIsRunning = (monitorName: string): boolean => {
  const result = spawnSync(
    "docker",
    ["inspect", "--format", "{{.State.Running}}", monitorName],
    {
      encoding: "utf8",
      env: { PATH: process.env.PATH ?? "" },
      shell: false,
      timeout: 1_000,
    },
  )
  return result.status === 0 && result.stdout.trim() === "true"
}

export interface V137LinuxLanguageGuest {
  readonly image: string
  readonly command: readonly string[]
  readonly mounts: readonly {
    readonly hostPath: string
    readonly guestPath: string
  }[]
  readonly environment?: Readonly<Record<string, string>> | undefined
  readonly completionMode?: "report" | "supervisor-timeout" | undefined
}

export interface V137LinuxLanguageProbeReceipt {
  readonly schemaVersion: "v1.37-linux-language-probe-v1"
  readonly runId: string
  readonly descriptorSha256: `sha256:${string}`
  readonly image: string
  readonly imageIdentitySha256: `sha256:${string}`
  readonly exitCode: number | null
  readonly signal: string | null
  readonly timedOut: boolean
  readonly wallElapsedNanoseconds: number
  readonly cpuUsageBeforeMicroseconds: number
  readonly cpuUsageAfterMicroseconds: number
  readonly memoryPeakBytes: number
  readonly memoryEventsAfter: Readonly<Record<string, number>>
  readonly pidsEventsAfter: Readonly<Record<string, number>>
  readonly pidsPeak: number
  readonly stdoutBase64: string
  readonly stderrBase64: string
  readonly stdoutTruncated: boolean
  readonly stderrTruncated: boolean
  readonly payloadTruncated: boolean
  readonly cgroupKillUsed: boolean
  readonly cgroupEmpty: boolean
  readonly cleanupComplete: boolean
}

const guestArgs = (
  input: CertificationContainerInput,
  guest: V137LinuxLanguageGuest,
): readonly string[] => [
  "run",
  "--rm",
  `--cgroup-parent=/cowards/${input.runId}/${CERTIFICATION_INVOCATION}`,
  "--user",
  `${CERTIFICATION_GUEST_NAMESPACE_UID}:${CERTIFICATION_GUEST_NAMESPACE_UID}`,
  "--cap-drop",
  "ALL",
  "--security-opt",
  "no-new-privileges",
  "--security-opt",
  `seccomp=${input.seccompPath}`,
  "--network",
  "none",
  "--read-only",
  "--tmpfs",
  "/tmp:rw,noexec,nosuid,size=32m",
  "--pids-limit",
  "16",
  ...Object.entries(guest.environment ?? {}).flatMap(([name, value]) => [
    "--env",
    `${name}=${value}`,
  ]),
  ...guest.mounts.flatMap(({ hostPath, guestPath }) => [
    "--volume",
    `${path.resolve(hostPath)}:${guestPath}:ro`,
  ]),
  guest.image,
  ...guest.command,
]

const monitorArgs = (input: CertificationContainerInput): readonly string[] => {
  const args = [...certificationMonitorArgs(input)]
  const memoryIndex = args.indexOf("--memory-max-bytes")
  if (memoryIndex < 0 || args[memoryIndex + 1] === undefined) {
    throw new TypeError("Pinned language memory policy is unavailable")
  }
  args[memoryIndex + 1] = "67108864"
  return args
}

const bootstrapArgs = (
  input: CertificationContainerInput,
): readonly string[] => {
  const args = [...certificationBootstrapArgs(input)]
  const scriptIndex = args.length - 1
  const script = args[scriptIndex]
  if (script === undefined || !script.includes("33554432")) {
    throw new TypeError("Pinned language bootstrap policy is unavailable")
  }
  args[scriptIndex] = script.replaceAll("33554432", "67108864")
  return args
}

export const runV137LinuxLanguageProbe = (input: {
  readonly runId: string
  readonly repoRoot: string
  readonly binaryPath: string
  readonly seccompPath: string
  readonly inputPath: string
  readonly guest: V137LinuxLanguageGuest
}): Readonly<V137LinuxLanguageProbeReceipt> => {
  if (!/^run-[0-9a-f]{24,64}$/u.test(input.runId)) {
    throw new TypeError("Pinned language run identity is invalid")
  }
  runDocker(["image", "inspect", PINNED_CERTIFICATION_LINUX_IMAGE])
  runDocker(["image", "inspect", input.guest.image])
  const descriptorValue = descriptor(input.runId)
  const descriptorSha256 = sha256(descriptorValue)
  const controllerInput: CertificationContainerInput = {
    runId: input.runId,
    descriptorSha256,
    repoRoot: path.resolve(input.repoRoot),
    binaryPath: path.resolve(input.repoRoot, input.binaryPath),
    seccompPath: path.resolve(input.repoRoot, input.seccompPath),
    inputPath: path.resolve(input.inputPath),
  }
  const monitorName = `cowards-monitor-${input.runId}`
  let primaryFailure: unknown
  let cleanupFailure: unknown
  let proof: Readonly<V137LinuxLanguageProbeReceipt> | undefined
  try {
    const bootstrap = runDocker(bootstrapArgs(controllerInput))
      .toString("utf8")
      .trim()
    if (bootstrap !== descriptorSha256.slice("sha256:".length)) {
      throw new TypeError("Pinned language delegation is invalid")
    }
    runDocker(monitorArgs(controllerInput))
    waitForReady(monitorName)
    const guest = spawnSync("docker", guestArgs(controllerInput, input.guest), {
      encoding: "buffer",
      env: { PATH: process.env.PATH ?? "" },
      maxBuffer: 4 * 1024 * 1024,
      shell: false,
      timeout: 30_000,
    })
    if (guest.status !== 0) {
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 3_000)
    }
    if (
      input.guest.completionMode !== "supervisor-timeout" &&
      monitorIsRunning(monitorName)
    ) {
      writeControl(monitorName, "stdout", guest.stdout ?? Buffer.alloc(0))
      writeControl(monitorName, "stderr", guest.stderr ?? Buffer.alloc(0))
      writeControl(
        monitorName,
        "completion",
        Buffer.from(
          [
            `nonce=${CERTIFICATION_NONCE}`,
            `exit-code=${guest.status === null ? "null" : String(guest.status)}`,
            `signal=${guest.signal === null ? "null" : guest.signal}`,
            "",
          ].join("\n"),
        ),
      )
    }
    const monitorExit = runDocker(["wait", monitorName]).toString("utf8").trim()
    const logResult = spawnSync("docker", ["logs", monitorName], {
      encoding: "buffer",
      env: { PATH: process.env.PATH ?? "" },
      maxBuffer: 4 * 1024 * 1024,
      shell: false,
      timeout: 5_000,
    })
    if (logResult.error || logResult.status !== 0) {
      throw new TypeError("Pinned language monitor logs are unavailable")
    }
    const logs = logResult.stdout
    runDocker(["rm", monitorName])
    if (monitorExit !== "0") {
      throw new TypeError(
        process.env.COWARDS_CERTIFICATION_DEBUG === "1"
          ? `Pinned language monitor failed: ${logResult.stderr.toString("utf8")}`
          : "Pinned language monitor failed",
      )
    }
    const receipt = JSON.parse(logs.toString("utf8")) as Omit<
      V137LinuxLanguageProbeReceipt,
      | "schemaVersion"
      | "runId"
      | "descriptorSha256"
      | "image"
      | "imageIdentitySha256"
    >
    if (!receipt.cgroupEmpty || receipt.cleanupComplete !== false) {
      throw new TypeError("Pinned language containment is incomplete")
    }
    proof = Object.freeze({
      schemaVersion: "v1.37-linux-language-probe-v1",
      runId: input.runId,
      descriptorSha256,
      image: input.guest.image,
      imageIdentitySha256: sha256(input.guest.image),
      ...receipt,
    })
  } catch (error) {
    primaryFailure = error
  } finally {
    try {
      runDocker(["rm", "--force", monitorName])
    } catch {
      // Successful paths already removed the monitor.
    }
    let finalized = false
    for (let attempt = 0; attempt < 20 && !finalized; attempt += 1) {
      try {
        runDocker(certificationFinalizerArgs(controllerInput))
        finalized = true
      } catch {
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 25)
      }
    }
    if (!finalized)
      cleanupFailure = new TypeError("Pinned language cleanup failed")
  }
  if (primaryFailure !== undefined) throw primaryFailure
  if (cleanupFailure !== undefined) throw cleanupFailure
  if (proof === undefined)
    throw new TypeError("Pinned language proof is missing")
  return proof
}
