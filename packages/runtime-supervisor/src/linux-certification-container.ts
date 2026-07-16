import { Buffer } from "node:buffer"
import { spawnSync } from "node:child_process"
import { createHash, randomBytes } from "node:crypto"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"

export const PINNED_CERTIFICATION_LINUX_IMAGE =
  "alpine@sha256:14358309a308569c32bdc37e2e0e9694be33a9d99e68afb0f5ff33cc1f695dce" as const
export const PINNED_CERTIFICATION_DOCKER_VERSION = "29.4.0" as const
export const PINNED_CERTIFICATION_KERNEL =
  "7.0.5-orbstack-00330-ge3df4e19b0a0-dirty" as const
export const CERTIFICATION_SUPERVISOR_UID = 65532 as const
export const CERTIFICATION_GUEST_NAMESPACE_UID = 65534 as const

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
  "--input-path",
  "/work/input.json",
  "--",
  "/bin/sh",
  "-c",
  [
    "id -u",
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

export const runLinuxCertificationContainerProbe = (input: {
  readonly repoRoot: string
  readonly binaryPath: string
  readonly seccompPath: string
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
  inspectCertificationDockerInfo(
    JSON.parse(info.stdout) as CertificationDockerInfo,
  )
  runDocker(["image", "inspect", PINNED_CERTIFICATION_LINUX_IMAGE])

  const runId = `run-${randomBytes(16).toString("hex")}`
  const descriptorValue = descriptor(runId)
  const descriptorHash = descriptorSha256(descriptorValue)
  const temporary = mkdtempSync(
    path.join(tmpdir(), "cowards-linux-certification-"),
  )
  const inputPath = path.join(temporary, "input.json")
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
    supervisorSucceeded = true
    return Object.freeze({
      status: "passed",
      descriptorSha256: descriptorHash,
      guestNamespaceUid: CERTIFICATION_GUEST_NAMESPACE_UID,
      supervisorHostUid: CERTIFICATION_SUPERVISOR_UID,
      pidsPeak: receipt.pidsPeak,
    })
  } finally {
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
          `root="/host-cgroup/cowards/${runId}"; test ! -f "$root/cgroup.kill" || echo 1 > "$root/cgroup.kill"; find "$root" -mindepth 1 -maxdepth 1 -type d -exec rmdir {} \\; 2>/dev/null || true; rmdir "$root" 2>/dev/null || true; rmdir /host-cgroup/cowards 2>/dev/null || true`,
        ])
      } else {
        runDocker(certificationFinalizerArgs(controllerInput))
      }
    } finally {
      rmSync(temporary, { recursive: true, force: true })
    }
  }
}
