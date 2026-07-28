import { Buffer } from "node:buffer"
import { spawnSync } from "node:child_process"
import { createHash, randomBytes } from "node:crypto"
import {
  closeSync,
  constants as fsConstants,
  mkdtempSync,
  openSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import {
  computeDockerEngineSha256V118,
  computeLinuxKernelSha256V118,
  createVerifiedHardenedControllerContextV118,
  type VerifiedHardenedControllerContextV118,
} from "./native-supervisor.js"

export const PINNED_CERTIFICATION_LINUX_IMAGE =
  "alpine@sha256:14358309a308569c32bdc37e2e0e9694be33a9d99e68afb0f5ff33cc1f695dce" as const
export const PINNED_CERTIFICATION_DOCKER_VERSION = "29.4.0" as const
export const PINNED_CERTIFICATION_KERNEL =
  "7.0.5-orbstack-00330-ge3df4e19b0a0-dirty" as const
export const CERTIFICATION_SUPERVISOR_UID = 65532 as const
export const CERTIFICATION_GUEST_NAMESPACE_UID = 65534 as const
export const PINNED_CERTIFICATION_BUSYBOX_SHA256 =
  "sha256:6dcd5f0190e8f4b055c2823b3d97660704b97d70c60cd3d3cf9805922fde1302" as const
const CERTIFICATION_NONCE = "certification-nonce-00000000000000000001" as const
const CERTIFICATION_INVOCATION = `invocation-${CERTIFICATION_NONCE}` as const

const BOOTSTRAP_SCRIPT = [
  'base="/host-cgroup/cowards"',
  'root="$base/$RUN_ID"',
  'mkdir -p "$base"',
  'echo "+cpu +memory +pids" > "$base/cgroup.subtree_control"',
  'test ! -e "$root"',
  'mkdir "$root"',
  'chmod 0700 "$root"',
  'echo "+cpu +memory +pids" > "$root/cgroup.subtree_control"',
  'chown "$SUPERVISOR_UID:$SUPERVISOR_UID" "$root" "$root/cgroup.procs" "$root/cgroup.subtree_control"',
  'test "$(stat -c %a "$root")" = 700',
  'test "$(stat -c %u "$root")" = "$SUPERVISOR_UID"',
  'test "$(cat "$root/cgroup.subtree_control")" = "cpu memory pids"',
  'invocation="$root/$INVOCATION_NAME"',
  'test ! -e "$invocation"',
  'mkdir "$invocation"',
  'chmod 0700 "$invocation"',
  'printf %s "+cpu +memory +pids" > "$invocation/cgroup.subtree_control"',
  'chown "$SUPERVISOR_UID:$SUPERVISOR_UID" "$invocation" "$invocation/cgroup.procs" "$invocation/cgroup.kill"',
  'printf %s "50000 100000" > "$invocation/cpu.max"',
  'printf %s "33554432" > "$invocation/memory.max"',
  'printf %s "16" > "$invocation/pids.max"',
  'if test -f "$invocation/memory.oom.group"; then printf %s 1 > "$invocation/memory.oom.group"; fi',
  'printf %s "$DESCRIPTOR" | sha256sum | cut -d" " -f1',
].join("; ")

const FINALIZER_SCRIPT = [
  'base="/host-cgroup/cowards"',
  'root="$base/$RUN_ID"',
  'invocation="$root/$INVOCATION_NAME"',
  'test -d "$root"',
  'test "$(stat -c %a "$root")" = 700',
  'test "$(stat -c %u "$root")" = "$SUPERVISOR_UID"',
  'test -z "$(cat "$root/cgroup.procs")"',
  'test -d "$invocation"',
  'test "$(stat -c %a "$invocation")" = 700',
  'test "$(stat -c %u "$invocation")" = "$SUPERVISOR_UID"',
  'test -z "$(cat "$invocation/cgroup.procs")"',
  'invocation_foreign="$(find "$invocation" -mindepth 1 -maxdepth 1 -type d -print)"',
  'test -z "$invocation_foreign"',
  'rmdir "$invocation"',
  'foreign="$(find "$root" -mindepth 1 -maxdepth 1 -type d -print)"',
  'test -z "$foreign"',
  'test "$(printf %s "$DESCRIPTOR" | sha256sum | cut -d" " -f1)" = "$DESCRIPTOR_HEX"',
  'rmdir "$root"',
  'rmdir "$base" 2>/dev/null || true',
].join("; ")

export const trustedCleanupScript = (runId: string): string => {
  if (!/^run-[0-9a-f]{24,64}$/u.test(runId) && runId !== "run-safe") {
    throw new TypeError("Certification cleanup run identity is invalid")
  }
  return [
    `root="/host-cgroup/cowards/${runId}"`,
    'if test -d "$root"; then',
    'if test -f "$root/cgroup.kill"; then echo 1 > "$root/cgroup.kill"; fi',
    "deadline=200",
    'while grep -q "^populated 1$" "$root/cgroup.events"; do test "$deadline" -gt 0; deadline=$((deadline-1)); sleep 0.01; done',
    'find "$root" -depth -mindepth 1 -type d -exec rmdir {} \\;',
    'rmdir "$root"',
    "fi",
    'test ! -e "$root"',
  ].join("\n")
}

export interface CertificationContainerInput {
  readonly runId: string
  readonly descriptorSha256: `sha256:${string}`
  readonly repoRoot: string
  readonly binaryPath: string
  readonly seccompPath: string
  readonly inputPath: string
}

const descriptor = (runId: string): string =>
  [
    "cowards-game:linux-certification-delegation:v1.18",
    runId,
    `supervisor-uid=${CERTIFICATION_SUPERVISOR_UID}`,
    `guest-host-uid=${CERTIFICATION_GUEST_NAMESPACE_UID}`,
    "controllers=cpu,memory,pids",
    "mode=0700",
  ].join("\n")

const descriptorSha256 = (value: string): `sha256:${string}` =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`
const bytesSha256 = (value: Uint8Array): `sha256:${string}` =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`

const commonTrustedControllerArgs = (
  input: CertificationContainerInput,
): readonly string[] => [
  "run",
  "--rm",
  "--cgroupns=host",
  "--cap-drop",
  "ALL",
  "--cap-add",
  "SYS_ADMIN",
  "--cap-add",
  "CHOWN",
  "--cap-add",
  "DAC_OVERRIDE",
  "--security-opt",
  "no-new-privileges",
  "--network",
  "none",
  "--read-only",
  "--env",
  `RUN_ID=${input.runId}`,
  "--env",
  `SUPERVISOR_UID=${CERTIFICATION_SUPERVISOR_UID}`,
  "--env",
  `INVOCATION_NAME=${CERTIFICATION_INVOCATION}`,
  "--env",
  `DESCRIPTOR=${descriptor(input.runId)}`,
  "--env",
  `DESCRIPTOR_HEX=${input.descriptorSha256.slice("sha256:".length)}`,
  "--volume",
  "/sys/fs/cgroup:/host-cgroup:rw",
  PINNED_CERTIFICATION_LINUX_IMAGE,
  "/bin/sh",
  "-ceu",
]

export const certificationBootstrapArgs = (
  input: CertificationContainerInput,
): readonly string[] => [
  ...commonTrustedControllerArgs(input),
  BOOTSTRAP_SCRIPT,
]

export const certificationFinalizerArgs = (
  input: CertificationContainerInput,
): readonly string[] => [
  ...commonTrustedControllerArgs(input),
  FINALIZER_SCRIPT,
]

export const certificationMonitorArgs = (
  input: CertificationContainerInput,
): readonly string[] => [
  "run",
  "--detach",
  "--name",
  `cowards-monitor-${input.runId}`,
  "--cgroupns=host",
  `--cgroup-parent=/cowards/${input.runId}`,
  "--user",
  `${CERTIFICATION_SUPERVISOR_UID}:${CERTIFICATION_SUPERVISOR_UID}`,
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
  "/tmp:rw,noexec,nosuid,size=16m",
  "--tmpfs",
  `/run/cowards-control:rw,noexec,nosuid,size=64k,mode=0700,uid=${CERTIFICATION_SUPERVISOR_UID},gid=${CERTIFICATION_SUPERVISOR_UID}`,
  "--memory",
  "64m",
  "--cpus",
  "0.5",
  "--pids-limit",
  "64",
  "--volume",
  `/sys/fs/cgroup/cowards/${input.runId}:/run/cowards-cgroup:rw`,
  "--volume",
  `${input.binaryPath}:/usr/local/bin/cowards-runtime-supervisor:ro`,
  PINNED_CERTIFICATION_LINUX_IMAGE,
  "/usr/local/bin/cowards-runtime-supervisor",
  "monitor",
  "--cgroup-root",
  "/run/cowards-cgroup",
  "--invocation-name",
  CERTIFICATION_INVOCATION,
  "--control-root",
  "/run/cowards-control",
  "--nonce",
  CERTIFICATION_NONCE,
  "--cpu-quota-us",
  "50000",
  "--cpu-period-us",
  "100000",
  "--memory-max-bytes",
  "33554432",
  "--pids-max",
  "16",
  "--supervisor-host-uid",
  String(CERTIFICATION_SUPERVISOR_UID),
  "--guest-host-uid",
  String(CERTIFICATION_GUEST_NAMESPACE_UID),
  "--deadline-ms",
  "10000",
  "--stdout-max",
  "16384",
  "--stderr-max",
  "4096",
  "--payload-max",
  "16384",
  "--request-sha256",
  "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "--process-group-sha256",
  "sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
  "--cancellation-path",
  "/run/cowards-control/cancel",
  "--cancellation-nonce",
  "certification-cancel-nonce-00000000000001",
  "--completion-path",
  "/run/cowards-control/completion",
  "--ready-path",
  "/run/cowards-control/ready",
  "--stdout-path",
  "/run/cowards-control/stdout",
  "--stderr-path",
  "/run/cowards-control/stderr",
]

export const certificationGuestArgs = (
  input: CertificationContainerInput,
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
  "/tmp:rw,noexec,nosuid,size=16m",
  "--pids-limit",
  "16",
  "--env",
  "COWARDS_CERTIFICATION_ENV=CERTIFIED",
  "--volume",
  `${input.inputPath}:/work/input.json:ro`,
  "--workdir",
  "/work",
  PINNED_CERTIFICATION_LINUX_IMAGE,
  "/bin/busybox",
  "sh",
  "-c",
  [
    "id -u",
    'test "$COWARDS_CERTIFICATION_ENV" = CERTIFIED',
    'grep -E "^(CapInh|CapPrm|CapEff|CapBnd|CapAmb|NoNewPrivs)" /proc/self/status',
    'test "$(awk \'/^Uid:/{print $2":"$3":"$4":"$5}\' /proc/self/status)" = "65534:65534:65534:65534"',
    "test \"$(awk '/^Uid:/{print $2}' /proc/1/status)\" = 65534",
    "test ! -e /run/cowards-cgroup",
    "test ! -e /run/cowards-control",
    "(sleep 0.02 &) && wait",
    "echo CONTAINMENT_OK",
    "cat /work/input.json",
  ].join("; "),
]

export interface CertificationDockerInfo {
  readonly OSType: string
  readonly Architecture: string
  readonly CgroupVersion: string
  readonly CgroupDriver: string
  readonly ServerVersion: string
  readonly KernelVersion: string
  readonly SecurityOptions: readonly string[]
}

export const inspectCertificationDockerInfo = (
  value: CertificationDockerInfo,
): Readonly<{
  status: "ready"
  dockerVersion: typeof PINNED_CERTIFICATION_DOCKER_VERSION
  kernelVersion: typeof PINNED_CERTIFICATION_KERNEL
  cgroupDriver: "cgroupfs"
}> => {
  if (
    value.OSType !== "linux" ||
    value.Architecture !== "x86_64" ||
    value.CgroupVersion !== "2" ||
    value.CgroupDriver !== "cgroupfs" ||
    value.ServerVersion !== PINNED_CERTIFICATION_DOCKER_VERSION ||
    value.KernelVersion !== PINNED_CERTIFICATION_KERNEL ||
    JSON.stringify(value.SecurityOptions) !==
      JSON.stringify(["name=seccomp,profile=builtin", "name=cgroupns"])
  ) {
    throw new TypeError(
      "Linux cgroupfs-v2 certification environment is unsupported",
    )
  }
  return Object.freeze({
    status: "ready",
    dockerVersion: PINNED_CERTIFICATION_DOCKER_VERSION,
    kernelVersion: PINNED_CERTIFICATION_KERNEL,
    cgroupDriver: "cgroupfs",
  })
}

export const createCertificationControllerContextV118 = (input: {
  readonly info: CertificationDockerInfo
  readonly descriptorSha256: `sha256:${string}`
  readonly supervisorToolchainSha256: `sha256:${string}`
  readonly cleanupInvocation: (hostNonce: string) => boolean
}): VerifiedHardenedControllerContextV118 => {
  const inspected = inspectCertificationDockerInfo(input.info)
  return createVerifiedHardenedControllerContextV118({
    operatingSystem: "linux",
    cgroupVersion: 2,
    cgroupDriver: inspected.cgroupDriver,
    delegatedControllers: ["cpu", "memory", "pids"],
    kernelVersion: inspected.kernelVersion,
    dockerEngineVersion: inspected.dockerVersion,
    dockerImageDigest: PINNED_CERTIFICATION_LINUX_IMAGE.slice(
      PINNED_CERTIFICATION_LINUX_IMAGE.indexOf("@") + 1,
    ) as `sha256:${string}`,
    supervisorToolchainSha256: input.supervisorToolchainSha256,
    linuxKernelSha256: computeLinuxKernelSha256V118(inspected.kernelVersion),
    dockerEngineSha256: computeDockerEngineSha256V118({
      dockerEngineVersion: inspected.dockerVersion,
      operatingSystem: "linux",
      cgroupVersion: 2,
      cgroupDriver: inspected.cgroupDriver,
      delegatedControllers: ["cpu", "memory", "pids"],
    }),
    cgroupDelegationSha256: input.descriptorSha256,
    supervisorHostUid: CERTIFICATION_SUPERVISOR_UID,
    guestNamespaceUid: CERTIFICATION_GUEST_NAMESPACE_UID,
    delegatedRoot: "/run/cowards-cgroup",
    cancellationRoot: "/run/cowards-control",
    cleanupInvocation: input.cleanupInvocation,
  })
}

const dockerSpawnEnvironment = () => ({
  NODE_ENV: "production" as const,
  PATH: process.env.PATH ?? "",
})

const runDocker = (args: readonly string[], timeout = 30_000): Buffer => {
  const result = spawnSync("docker", args, {
    encoding: "buffer",
    env: dockerSpawnEnvironment(),
    maxBuffer: 1024 * 1024,
    shell: false,
    timeout,
  })
  if (result.error || result.status !== 0 || result.signal !== null) {
    throw new TypeError("Pinned Linux certification container failed")
  }
  return result.stdout
}

const waitForMonitorReady = (
  monitorName: string,
  timeoutMilliseconds: number,
): void => {
  const deadline = Date.now() + timeoutMilliseconds
  while (true) {
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
        env: dockerSpawnEnvironment(),
        shell: false,
        timeout: 1_000,
      },
    )
    if (result.status === 0 && result.stdout.trim() === CERTIFICATION_NONCE) {
      return
    }
    if (Date.now() >= deadline) {
      throw new TypeError("Certification monitor readiness timed out")
    }
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 10)
  }
}

const writeMonitorControl = (
  monitorName: string,
  fileName: "completion" | "stdout" | "stderr" | "cancel",
  bytes: Uint8Array,
): void => {
  const result = spawnSync(
    "docker",
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
    {
      encoding: "buffer",
      env: dockerSpawnEnvironment(),
      input: bytes,
      maxBuffer: 1024 * 1024,
      shell: false,
      timeout: 5_000,
    },
  )
  if (result.error || result.status !== 0 || result.signal !== null) {
    const logs = spawnSync("docker", ["logs", monitorName], {
      encoding: "utf8",
      env: dockerSpawnEnvironment(),
      shell: false,
      timeout: 2_000,
    })
    throw new TypeError(
      `Certification monitor control write failed: ${result.stderr.toString("utf8").trim()}: ${logs.stdout.trim()} ${logs.stderr.trim()}`,
    )
  }
}

const trustedCleanupArgs = (runId: string): readonly string[] => [
  "run",
  "--rm",
  "--cgroupns=host",
  "--cap-drop",
  "ALL",
  "--cap-add",
  "SYS_ADMIN",
  "--cap-add",
  "CHOWN",
  "--cap-add",
  "DAC_OVERRIDE",
  "--security-opt",
  "no-new-privileges",
  "--network",
  "none",
  "--read-only",
  "--volume",
  "/sys/fs/cgroup:/host-cgroup:rw",
  PINNED_CERTIFICATION_LINUX_IMAGE,
  "/bin/sh",
  "-ceu",
  trustedCleanupScript(runId),
]

export const runLinuxCertificationContainerProbe = (input: {
  readonly repoRoot: string
  readonly binaryPath: string
  readonly supervisorBinarySha256: `sha256:${string}`
  readonly seccompPath: string
  readonly supervisorToolchainSha256: `sha256:${string}`
}): Readonly<{
  status: "passed"
  descriptorSha256: `sha256:${string}`
  guestNamespaceUid: 65534
  supervisorHostUid: 65532
  pidsPeak: number
}> => {
  const info = spawnSync("docker", ["info", "--format", "{{json .}}"], {
    encoding: "utf8",
    env: dockerSpawnEnvironment(),
    shell: false,
    timeout: 5_000,
  })
  if (info.error || info.status !== 0) {
    throw new TypeError("Docker Linux certification server is unavailable")
  }
  const dockerInfo = JSON.parse(info.stdout) as CertificationDockerInfo
  inspectCertificationDockerInfo(dockerInfo)
  runDocker(["image", "inspect", PINNED_CERTIFICATION_LINUX_IMAGE])

  const runId = `run-${randomBytes(16).toString("hex")}`
  const descriptorValue = descriptor(runId)
  const descriptorHash = descriptorSha256(descriptorValue)
  createCertificationControllerContextV118({
    info: dockerInfo,
    descriptorSha256: descriptorHash,
    supervisorToolchainSha256: input.supervisorToolchainSha256,
    cleanupInvocation: () => false,
  })
  const temporary = mkdtempSync(
    path.join(tmpdir(), "cowards-linux-certification-"),
  )
  const stagedBinaryPath = path.join(temporary, "cowards-runtime-supervisor")
  let binaryDescriptor: number | undefined
  try {
    binaryDescriptor = openSync(
      input.binaryPath,
      fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW,
    )
    const binaryBytes = readFileSync(binaryDescriptor)
    if (bytesSha256(binaryBytes) !== input.supervisorBinarySha256) {
      throw new TypeError("Certification supervisor binary is substituted")
    }
    writeFileSync(stagedBinaryPath, binaryBytes, {
      flag: "wx",
      mode: 0o500,
    })
  } finally {
    if (binaryDescriptor !== undefined) closeSync(binaryDescriptor)
  }
  const inputPath = path.join(temporary, "input.json")
  writeFileSync(inputPath, "{}\n", { mode: 0o600 })
  const controllerInput: CertificationContainerInput = {
    runId,
    descriptorSha256: descriptorHash,
    repoRoot: input.repoRoot,
    binaryPath: stagedBinaryPath,
    seccompPath: input.seccompPath,
    inputPath,
  }
  const monitorName = `cowards-monitor-${runId}`
  let proof:
    | Readonly<{
        status: "passed"
        descriptorSha256: `sha256:${string}`
        guestNamespaceUid: 65534
        supervisorHostUid: 65532
        pidsPeak: number
      }>
    | undefined
  let primaryFailure: unknown
  try {
    const bootstrap = runDocker(certificationBootstrapArgs(controllerInput))
      .toString("utf8")
      .trim()
    if (bootstrap !== descriptorHash.slice("sha256:".length)) {
      throw new TypeError("Certification delegation descriptor is invalid")
    }
    runDocker(certificationMonitorArgs(controllerInput))
    waitForMonitorReady(monitorName, 10_000)
    const guest = spawnSync("docker", certificationGuestArgs(controllerInput), {
      encoding: "buffer",
      env: dockerSpawnEnvironment(),
      maxBuffer: 1024 * 1024,
      shell: false,
      timeout: 30_000,
    })
    if (guest.error || guest.status !== 0 || guest.signal !== null) {
      throw new TypeError(
        `Certification guest failed: ${guest.stderr.toString("utf8").trim()}`,
      )
    }
    writeMonitorControl(monitorName, "stdout", guest.stdout)
    writeMonitorControl(monitorName, "stderr", guest.stderr)
    writeMonitorControl(
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
    const monitorExit = runDocker(["wait", monitorName]).toString("utf8").trim()
    const monitorLogs = spawnSync("docker", ["logs", monitorName], {
      encoding: "buffer",
      env: dockerSpawnEnvironment(),
      maxBuffer: 1024 * 1024,
      shell: false,
      timeout: 5_000,
    })
    if (monitorLogs.error || monitorLogs.status !== 0) {
      throw new TypeError("Certification monitor logs are unavailable")
    }
    const output = monitorLogs.stdout
    runDocker(["rm", monitorName])
    if (monitorExit !== "0") {
      throw new TypeError(
        `Certification monitor failed: ${monitorLogs.stderr.toString("utf8").trim()}`,
      )
    }
    const receipt = JSON.parse(output.toString("utf8")) as {
      guestNamespaceUid: number
      supervisorHostUid: number
      pidsPeak: number
      stdoutBase64: string
      cgroupKillUsed: boolean
      cgroupEmpty: boolean
      cleanupComplete: boolean
    }
    const guestOutput = Buffer.from(receipt.stdoutBase64, "base64").toString(
      "utf8",
    )
    if (
      receipt.guestNamespaceUid !== CERTIFICATION_GUEST_NAMESPACE_UID ||
      receipt.supervisorHostUid !== CERTIFICATION_SUPERVISOR_UID ||
      receipt.pidsPeak < 2 ||
      receipt.cgroupKillUsed !== false ||
      receipt.cgroupEmpty !== true ||
      receipt.cleanupComplete !== false ||
      !guestOutput.startsWith(`${CERTIFICATION_GUEST_NAMESPACE_UID}\n`) ||
      !guestOutput.includes("CapEff:\t0000000000000000") ||
      !guestOutput.includes("CapBnd:\t0000000000000000") ||
      !guestOutput.includes("NoNewPrivs:\t1") ||
      !guestOutput.includes("CONTAINMENT_OK")
    ) {
      throw new TypeError("Guest namespace or containment proof is invalid")
    }

    proof = Object.freeze({
      status: "passed",
      descriptorSha256: descriptorHash,
      guestNamespaceUid: CERTIFICATION_GUEST_NAMESPACE_UID,
      supervisorHostUid: CERTIFICATION_SUPERVISOR_UID,
      pidsPeak: receipt.pidsPeak,
    })
    if (
      bytesSha256(readFileSync(stagedBinaryPath)) !==
      input.supervisorBinarySha256
    ) {
      throw new TypeError("Certification supervisor binary changed after use")
    }
  } catch (error) {
    primaryFailure = error
  }
  let cleanupFailure: unknown
  try {
    try {
      runDocker(["rm", "--force", monitorName])
    } catch {
      // The successful path already removed the monitor.
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
    if (!finalized) {
      const diagnostic = spawnSync(
        "docker",
        [
          ...commonTrustedControllerArgs(controllerInput),
          [
            `root="/host-cgroup/cowards/${runId}"`,
            'stat -c "mode=%a uid=%u" "$root"',
            'printf "procs="; cat "$root/cgroup.procs"',
            'printf "children="; find "$root" -mindepth 1 -maxdepth 2 -type d -print',
            'printf "subtree="; cat "$root/cgroup.subtree_control"',
          ].join("; "),
        ],
        {
          encoding: "utf8",
          env: dockerSpawnEnvironment(),
          shell: false,
          timeout: 5_000,
        },
      )
      runDocker(trustedCleanupArgs(runId))
      cleanupFailure = new TypeError(
        `Certification finalizer failed after cleanup: ${diagnostic.stdout.trim()} ${diagnostic.stderr.trim()}`,
      )
    }
  } catch (error) {
    cleanupFailure = error
  }
  rmSync(temporary, { recursive: true, force: true })
  if (cleanupFailure !== undefined) throw cleanupFailure
  if (primaryFailure !== undefined) throw primaryFailure
  if (proof === undefined) throw new TypeError("Certification proof missing")
  return proof
}
