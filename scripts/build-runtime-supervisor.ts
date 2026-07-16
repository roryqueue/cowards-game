#!/usr/bin/env -S pnpm exec tsx
import { spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import { readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import {
  computeSupervisorToolchainSha256V118,
  NATIVE_SUPERVISOR_MANIFEST_SCHEMA_V118,
  PINNED_RUNTIME_SUPERVISOR_BUILDER_IMAGE,
  PINNED_RUNTIME_SUPERVISOR_CARGO,
  PINNED_RUNTIME_SUPERVISOR_RUSTC,
  PINNED_RUNTIME_SUPERVISOR_TARGET,
  type NativeSupervisorBuildManifestV118,
} from "../packages/runtime-supervisor/src/native-supervisor.js"
import { runLinuxCertificationContainerProbe } from "../packages/runtime-supervisor/src/linux-certification-container.js"

export { PINNED_RUNTIME_SUPERVISOR_BUILDER_IMAGE }

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
)
const nativeRoot = path.join(repoRoot, "packages/runtime-supervisor/native")
const manifestPath = path.join(nativeRoot, "runtime-supervisor-manifest.json")
const binaryPath = path.join(
  nativeRoot,
  "target/release/cowards-runtime-supervisor",
)

const sha256 = (bytes: Uint8Array): `sha256:${string}` =>
  `sha256:${createHash("sha256").update(bytes).digest("hex")}`

export const buildRuntimeSupervisorManifest = (input: {
  readonly sourceBytes: Uint8Array
  readonly cargoLockBytes: Uint8Array
  readonly seccompProfileBytes: Uint8Array
  readonly binaryBytes: Uint8Array
  readonly rustcVersion: string
  readonly cargoVersion: string
}): NativeSupervisorBuildManifestV118 => {
  if (
    input.rustcVersion !== PINNED_RUNTIME_SUPERVISOR_RUSTC ||
    input.cargoVersion !== PINNED_RUNTIME_SUPERVISOR_CARGO
  ) {
    throw new TypeError("Pinned Rust toolchain identity is unavailable")
  }
  const sourceSha256 = sha256(input.sourceBytes)
  const cargoLockSha256 = sha256(input.cargoLockBytes)
  const seccompProfileSha256 = sha256(input.seccompProfileBytes)
  return Object.freeze({
    schemaVersion: NATIVE_SUPERVISOR_MANIFEST_SCHEMA_V118,
    sourceSha256,
    cargoLockSha256,
    seccompProfileSha256,
    builderImage: PINNED_RUNTIME_SUPERVISOR_BUILDER_IMAGE,
    rustcVersion: PINNED_RUNTIME_SUPERVISOR_RUSTC,
    cargoVersion: PINNED_RUNTIME_SUPERVISOR_CARGO,
    target: PINNED_RUNTIME_SUPERVISOR_TARGET,
    operatingSystem: "linux",
    cgroupVersion: 2,
    cgroupDriver: "cgroupfs",
    supervisorHostUid: 65532,
    guestNamespaceUid: 65534,
    delegatedControllers: ["cpu", "memory", "pids"],
    supervisorToolchainSha256: computeSupervisorToolchainSha256V118({
      builderImage: PINNED_RUNTIME_SUPERVISOR_BUILDER_IMAGE,
      rustcVersion: PINNED_RUNTIME_SUPERVISOR_RUSTC,
      cargoVersion: PINNED_RUNTIME_SUPERVISOR_CARGO,
      target: PINNED_RUNTIME_SUPERVISOR_TARGET,
      sourceSha256,
      cargoLockSha256,
      seccompProfileSha256,
    }),
    binarySha256: sha256(input.binaryBytes),
  })
}

export const supervisorBuildDockerArgs = (root: string): readonly string[] => [
  "run",
  "--rm",
  "--network",
  "none",
  "--cap-drop",
  "ALL",
  "--security-opt",
  "no-new-privileges",
  "--read-only",
  "--tmpfs",
  "/tmp:rw,noexec,nosuid,size=256m",
  "--volume",
  `${root}:/work:rw`,
  "--workdir",
  "/work",
  PINNED_RUNTIME_SUPERVISOR_BUILDER_IMAGE,
  "cargo",
  "build",
  "--release",
  "--locked",
  "--manifest-path",
  "packages/runtime-supervisor/native/Cargo.toml",
]

const sourceBytes = (): Uint8Array =>
  Buffer.concat([
    readFileSync(path.join(nativeRoot, "Cargo.toml")),
    readFileSync(path.join(nativeRoot, "src/main.rs")),
  ])

const currentManifest = (): NativeSupervisorBuildManifestV118 =>
  buildRuntimeSupervisorManifest({
    sourceBytes: sourceBytes(),
    cargoLockBytes: readFileSync(path.join(nativeRoot, "Cargo.lock")),
    seccompProfileBytes: readFileSync(
      path.join(nativeRoot, "seccomp/moby-v0.2.1-userns-landlock.json"),
    ),
    binaryBytes: readFileSync(binaryPath),
    rustcVersion: PINNED_RUNTIME_SUPERVISOR_RUSTC,
    cargoVersion: PINNED_RUNTIME_SUPERVISOR_CARGO,
  })

const stable = (value: unknown): string => `${JSON.stringify(value, null, 2)}\n`

const main = (): void => {
  const build = process.argv.includes("--build")
  const buildLinuxContainer = process.argv.includes("--build-linux-container")
  const check = process.argv.includes("--check")
  if (!build && !buildLinuxContainer && !check) {
    throw new TypeError("Use --build, --check, or both")
  }
  if (build || buildLinuxContainer) {
    const result = spawnSync("docker", supervisorBuildDockerArgs(repoRoot), {
      encoding: "utf8",
      env: { PATH: process.env.PATH ?? "" },
      shell: false,
      stdio: "inherit",
      timeout: 120_000,
    })
    if (result.error || result.status !== 0) {
      throw new TypeError("Pinned Linux Rust supervisor build failed")
    }
    writeFileSync(manifestPath, stable(currentManifest()))
  }
  if (buildLinuxContainer) {
    const manifest = currentManifest()
    runLinuxCertificationContainerProbe({
      repoRoot,
      binaryPath,
      seccompPath: path.join(
        nativeRoot,
        "seccomp/moby-v0.2.1-userns-landlock.json",
      ),
      supervisorToolchainSha256: manifest.supervisorToolchainSha256,
    })
  }
  if (check) {
    const expected = stable(currentManifest())
    if (readFileSync(manifestPath, "utf8") !== expected) {
      throw new TypeError("Runtime supervisor manifest is stale")
    }
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
}
