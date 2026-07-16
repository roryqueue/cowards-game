import { Buffer } from "node:buffer"
import { spawn, spawnSync } from "node:child_process"
import { createHash, randomBytes } from "node:crypto"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
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
  'printf %s "$DESCRIPTOR" | sha256sum | cut -d" " -f1',
].join("; ")

const FINALIZER_SCRIPT = [
  'base="/host-cgroup/cowards"',
  'root="$base/$RUN_ID"',
  'test -d "$root"',
  'test "$(stat -c %a "$root")" = 700',
  'test "$(stat -c %u "$root")" = "$SUPERVISOR_UID"',
  'test -z "$(cat "$root/cgroup.procs")"',
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
    `guest-namespace-uid=${CERTIFICATION_GUEST_NAMESPACE_UID}`,
    "controllers=cpu,memory,pids",
    "mode=0700",
  ].join("\n")

const descriptorSha256 = (value: string): `sha256:${string}` =>
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

export const certificationSupervisorArgs = (
  input: CertificationContainerInput,
): readonly string[] => [
  "run",
  "--rm",
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
  "--volume",
  `${input.inputPath}:/work/input.json:ro`,
  "--workdir",
  "/work",
  PINNED_CERTIFICATION_LINUX_IMAGE,
  "/usr/local/bin/cowards-runtime-supervisor",
  "run",
  "--cgroup-root",
  "/run/cowards-cgroup",
  "--nonce",
  "certification-nonce-00000000000000000001",
  "--cpu-quota-us",
  "50000",
  "--cpu-period-us",
  "100000",
  "--memory-max-bytes",
  "33554432",
  "--pids-max",
  "16",
  "--guest-namespace-uid",
  String(CERTIFICATION_GUEST_NAMESPACE_UID),
  "--deadline-ms",
  "2000",
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
  "--expected-executable-sha256",
  PINNED_CERTIFICATION_BUSYBOX_SHA256,
  "--environment-count",
  "1",
  "--environment-0-name",
  "COWARDS_CERTIFICATION_ENV",
  "--environment-0-value",
  "CERTIFIED",
  "--cancellation-path",
  "/run/cowards-control/cancel",
  "--cancellation-nonce",
  "certification-cancel-nonce-00000000000001",
  "--input-path",
  "/work/input.json",
  "--",
  "/bin/busybox",
  "sh",
  "-c",
  [
    "id -u",
    'test "$COWARDS_CERTIFICATION_ENV" = CERTIFIED',
    "touch /run/cowards-control/forged >/dev/null 2>&1 && exit 91 || true",
    'grep -E "^(CapInh|CapPrm|CapEff|CapBnd|CapAmb|NoNewPrivs)" /proc/self/status',
    "test ! -e /run/cowards-cgroup/cgroup.procs",
    "cat /run/cowards-cgroup/cgroup.procs >/dev/null 2>&1 && exit 90 || true",
    "(sleep 0.02 &) && wait",
    "unshare -U -m /bin/sh -c 'test ! -e /run/cowards-cgroup/cgroup.procs'",
    "echo CONTAINMENT_OK",
    "cat",
  ].join("; "),
]

export interface CertificationDockerInfo {
  readonly OSType: string
  readonly CgroupVersion: string
  readonly CgroupDriver: string
  readonly ServerVersion: string
  readonly KernelVersion: string
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
    value.CgroupVersion !== "2" ||
    value.CgroupDriver !== "cgroupfs" ||
    value.ServerVersion !== PINNED_CERTIFICATION_DOCKER_VERSION ||
    value.KernelVersion !== PINNED_CERTIFICATION_KERNEL
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

const runDocker = (args: readonly string[], timeout = 30_000): Buffer => {
  const result = spawnSync("docker", args, {
    encoding: "buffer",
    env: { PATH: process.env.PATH ?? "" },
    maxBuffer: 1024 * 1024,
    shell: false,
    timeout,
  })
  if (result.error || result.status !== 0 || result.signal !== null) {
    throw new TypeError("Pinned Linux certification container failed")
  }
  return result.stdout
}

const replaceDockerArgument = (
  args: readonly string[],
  flag: string,
  value: string,
): string[] => {
  const output = [...args]
  const index = output.indexOf(flag)
  if (index < 0 || index + 1 >= output.length) {
    throw new TypeError("Certification argument replacement failed")
  }
  output[index + 1] = value
  return output
}

const replaceSupervisorCommand = (
  args: readonly string[],
  command: readonly string[],
): string[] => {
  const output = [...args]
  const index = output.lastIndexOf("--")
  if (index < 0) throw new TypeError("Certification command boundary missing")
  return [...output.slice(0, index + 1), ...command]
}

const expectDockerFailure = (args: readonly string[]): void => {
  try {
    runDocker(args)
  } catch {
    return
  }
  throw new TypeError("Negative certification probe unexpectedly succeeded")
}

export const runLinuxCertificationContainerProbe = (input: {
  readonly repoRoot: string
  readonly binaryPath: string
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
    env: { PATH: process.env.PATH ?? "" },
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
  const inputPath = path.join(temporary, "input.json")
  const cancelPath = path.join(temporary, "cancel")
  writeFileSync(inputPath, "{}\n", { mode: 0o600 })
  const controllerInput: CertificationContainerInput = {
    runId,
    descriptorSha256: descriptorHash,
    repoRoot: input.repoRoot,
    binaryPath: input.binaryPath,
    seccompPath: input.seccompPath,
    inputPath,
  }
  let supervisorSucceeded = false
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
    const output = runDocker(
      certificationSupervisorArgs(controllerInput),
      60_000,
    )
    const receipt = JSON.parse(output.toString("utf8")) as {
      guestNamespaceUid: number
      supervisorHostUid: number
      pidsPeak: number
      stdoutBase64: string
      cgroupEmpty: boolean
    }
    const guestOutput = Buffer.from(receipt.stdoutBase64, "base64").toString(
      "utf8",
    )
    if (
      receipt.guestNamespaceUid !== CERTIFICATION_GUEST_NAMESPACE_UID ||
      receipt.supervisorHostUid !== CERTIFICATION_SUPERVISOR_UID ||
      receipt.pidsPeak < 2 ||
      receipt.cgroupEmpty !== true ||
      !guestOutput.startsWith(`${CERTIFICATION_GUEST_NAMESPACE_UID}\n`) ||
      !guestOutput.includes("CapEff:\t0000000000000000") ||
      !guestOutput.includes("CapBnd:\t0000000000000000") ||
      !guestOutput.includes("NoNewPrivs:\t1") ||
      !guestOutput.includes("CONTAINMENT_OK")
    ) {
      throw new TypeError("Guest namespace or containment proof is invalid")
    }

    const baseSupervisorArgs = certificationSupervisorArgs(controllerInput)
    const imageIndex = baseSupervisorArgs.indexOf(
      PINNED_CERTIFICATION_LINUX_IMAGE,
    )
    if (imageIndex < 0) throw new TypeError("Certification image missing")
    const timeoutArgs = replaceSupervisorCommand(
      replaceDockerArgument(
        replaceDockerArgument(
          baseSupervisorArgs,
          "--nonce",
          "certification-timeout-nonce-000000000000001",
        ),
        "--deadline-ms",
        "50",
      ),
      ["/bin/busybox", "sh", "-c", "sleep 5"],
    )
    const timeoutReceipt = JSON.parse(
      runDocker(timeoutArgs).toString("utf8"),
    ) as {
      timedOut: boolean
      cgroupKillUsed: boolean
      cgroupEmpty: boolean
      cleanupComplete: boolean
    }
    if (
      !timeoutReceipt.timedOut ||
      !timeoutReceipt.cgroupKillUsed ||
      !timeoutReceipt.cgroupEmpty ||
      !timeoutReceipt.cleanupComplete
    ) {
      throw new TypeError("Timeout cleanup proof is invalid")
    }

    const liveControlPath = path.join(temporary, "live-control")
    const liveCancelPath = path.join(liveControlPath, "cancel")
    mkdirSync(liveControlPath, { mode: 0o777 })
    const liveCancelNonce = "certification-live-cancel-nonce-000000001"
    const controlTmpfsIndex = baseSupervisorArgs.findIndex(
      (value, index) =>
        value === "--tmpfs" &&
        baseSupervisorArgs[index + 1]?.startsWith("/run/cowards-control:"),
    )
    if (controlTmpfsIndex < 0) {
      throw new TypeError("Certification control tmpfs missing")
    }
    const liveBaseSupervisorArgs = [
      ...baseSupervisorArgs.slice(0, controlTmpfsIndex),
      ...baseSupervisorArgs.slice(controlTmpfsIndex + 2),
    ]
    const liveImageIndex = liveBaseSupervisorArgs.indexOf(
      PINNED_CERTIFICATION_LINUX_IMAGE,
    )
    if (liveImageIndex < 0) {
      throw new TypeError("Certification live image missing")
    }
    const liveCancelArgsWithMount = [
      ...liveBaseSupervisorArgs.slice(0, liveImageIndex),
      "--volume",
      `${liveControlPath}:/run/cowards-control:rw`,
      ...liveBaseSupervisorArgs.slice(liveImageIndex),
    ]
    const liveCancelArgs = replaceSupervisorCommand(
      replaceDockerArgument(
        replaceDockerArgument(
          replaceDockerArgument(
            liveCancelArgsWithMount,
            "--nonce",
            "certification-live-cancel-host-nonce-000001",
          ),
          "--cancellation-nonce",
          liveCancelNonce,
        ),
        "--deadline-ms",
        "2000",
      ),
      ["/bin/busybox", "sh", "-c", "sleep 5"],
    )
    const cancellationWriter = spawn(
      process.execPath,
      [
        "-e",
        'const fs=require("node:fs");setTimeout(()=>fs.writeFileSync(process.argv[1],process.argv[2]+"\\n"),500)',
        liveCancelPath,
        liveCancelNonce,
      ],
      { stdio: "ignore" },
    )
    const cancellationReceipt = JSON.parse(
      runDocker(liveCancelArgs).toString("utf8"),
    ) as {
      cancellationRequested: boolean
      cgroupKillUsed: boolean
      cgroupEmpty: boolean
      cleanupComplete: boolean
    }
    cancellationWriter.unref()
    if (
      !cancellationReceipt.cancellationRequested ||
      !cancellationReceipt.cgroupKillUsed ||
      !cancellationReceipt.cgroupEmpty ||
      !cancellationReceipt.cleanupComplete
    ) {
      throw new TypeError("Live cancellation cleanup proof is invalid")
    }

    const substitutedExecutableArgs = replaceDockerArgument(
      replaceDockerArgument(
        baseSupervisorArgs,
        "--nonce",
        "certification-substitution-nonce-0000000001",
      ),
      "--expected-executable-sha256",
      `sha256:${"0".repeat(64)}`,
    )
    expectDockerFailure(substitutedExecutableArgs)

    writeFileSync(cancelPath, "certification-cancel-nonce-00000000000001\n", {
      mode: 0o644,
    })
    const cancelledArgs = replaceDockerArgument(
      [
        ...baseSupervisorArgs.slice(0, imageIndex),
        "--volume",
        `${cancelPath}:/work/cancel:ro`,
        ...baseSupervisorArgs.slice(imageIndex),
      ],
      "--cancellation-path",
      "/work/cancel",
    )
    expectDockerFailure(
      replaceDockerArgument(
        cancelledArgs,
        "--nonce",
        "certification-cancelled-nonce-000000000001",
      ),
    )
    supervisorSucceeded = true
    proof = Object.freeze({
      status: "passed",
      descriptorSha256: descriptorHash,
      guestNamespaceUid: CERTIFICATION_GUEST_NAMESPACE_UID,
      supervisorHostUid: CERTIFICATION_SUPERVISOR_UID,
      pidsPeak: receipt.pidsPeak,
    })
  } catch (error) {
    primaryFailure = error
  }
  let cleanupFailure: unknown
  try {
    if (!supervisorSucceeded) {
      runDocker([
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
      ])
    } else {
      try {
        runDocker(certificationFinalizerArgs(controllerInput))
      } catch {
        runDocker([
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
        ])
        cleanupFailure = new TypeError(
          "Certification finalizer failed after cleanup",
        )
      }
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
