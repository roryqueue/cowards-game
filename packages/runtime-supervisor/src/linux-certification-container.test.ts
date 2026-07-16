import { describe, expect, it } from "vitest"
import {
  PINNED_CERTIFICATION_LINUX_IMAGE,
  certificationBootstrapArgs,
  certificationFinalizerArgs,
  certificationSupervisorArgs,
  inspectCertificationDockerInfo,
} from "./linux-certification-container.js"

const input = {
  runId: "run-0123456789abcdef01234567",
  descriptorSha256:
    "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  repoRoot: "/repo",
  binaryPath:
    "/repo/packages/runtime-supervisor/native/target/release/cowards-runtime-supervisor",
  seccompPath:
    "/repo/packages/runtime-supervisor/native/seccomp/moby-v0.2.1-userns-landlock.json",
  inputPath: "/tmp/input.json",
} as const

describe("Linux certification container controller", () => {
  it("uses an exact capability-limited bootstrap with no Strategy mount", () => {
    const args = certificationBootstrapArgs(input)
    expect(PINNED_CERTIFICATION_LINUX_IMAGE).toContain("@sha256:")
    expect(args).toEqual(
      expect.arrayContaining([
        "--cgroupns=host",
        "--cap-drop",
        "ALL",
        "--cap-add",
        "SYS_ADMIN",
        "--cap-add",
        "CHOWN",
        "--cap-add",
        "DAC_OVERRIDE",
        "--network",
        "none",
        "--read-only",
        "--security-opt",
        "no-new-privileges",
      ]),
    )
    expect(args.join(" ")).not.toMatch(/strategy|artifact|source/iu)
  })

  it("runs the real supervisor unprivileged with subtree-only cgroup access", () => {
    const args = certificationSupervisorArgs(input)
    expect(args).toEqual(
      expect.arrayContaining([
        "--cgroupns=host",
        "--cgroup-parent=/cowards/run-0123456789abcdef01234567",
        "--user",
        "65532:65532",
        "--cap-drop",
        "ALL",
        "--network",
        "none",
        "--read-only",
        "--security-opt",
        "no-new-privileges",
        "--tmpfs",
        "/tmp:rw,noexec,nosuid,size=16m",
      ]),
    )
    expect(args.join(" ")).toContain(
      "/sys/fs/cgroup/cowards/run-0123456789abcdef01234567:/run/cowards-cgroup:rw",
    )
    expect(args.join(" ")).not.toContain("/sys/fs/cgroup:/run/cowards-cgroup")
    expect(args.join(" ")).not.toContain("--cap-add")
  })

  it("uses the trusted finalizer and rejects Docker identity drift", () => {
    expect(certificationFinalizerArgs(input)).toEqual(
      expect.arrayContaining([
        "--cgroupns=host",
        "--cap-drop",
        "ALL",
        "--cap-add",
        "SYS_ADMIN",
        "--network",
        "none",
      ]),
    )
    expect(
      inspectCertificationDockerInfo({
        OSType: "linux",
        CgroupVersion: "2",
        CgroupDriver: "cgroupfs",
        ServerVersion: "29.4.0",
        KernelVersion: "7.0.5-orbstack-00330-ge3df4e19b0a0-dirty",
      }),
    ).toMatchObject({ status: "ready" })
    expect(() =>
      inspectCertificationDockerInfo({
        OSType: "linux",
        CgroupVersion: "2",
        CgroupDriver: "systemd",
        ServerVersion: "29.4.0",
        KernelVersion: "7.0.5-orbstack-00330-ge3df4e19b0a0-dirty",
      }),
    ).toThrow(/cgroup|unsupported/iu)
  })
})
