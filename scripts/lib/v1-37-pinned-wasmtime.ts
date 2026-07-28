import { spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import {
  chmodSync,
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
} from "node:fs"
import path from "node:path"

export const V137_PINNED_WASMTIME_URL =
  "https://github.com/bytecodealliance/wasmtime/releases/download/v45.0.0/wasmtime-v45.0.0-x86_64-linux.tar.xz"
export const V137_PINNED_WASMTIME_SHA256 =
  "sha256:d7b7317b34a717f4b809df14657975e2ce83221a697167219abdad6e44c7a12c" as const

const sha256File = (filePath: string): `sha256:${string}` =>
  `sha256:${createHash("sha256").update(readFileSync(filePath)).digest("hex")}`

const assertRegularExecutable = (
  filePath: string,
  expectedSha256: `sha256:${string}`,
): boolean => {
  if (!existsSync(filePath)) return false
  const stat = lstatSync(filePath)
  return stat.isFile() && !stat.isSymbolicLink() && sha256File(filePath) === expectedSha256
}

export interface V137PinnedWasmtimeOptions {
  readonly stageDirectory: string
  readonly cacheRoot?: string
  readonly expectedSha256?: `sha256:${string}`
  readonly run?: (executable: string, args: readonly string[]) => void
}

/**
 * Stages the certified Linux Wasmtime binary from a hash-verified, owner-only cache.
 * The returned binary is always a per-proof copy and may safely be removed with its
 * containing proof workspace.
 */
export const stageV137PinnedWasmtime = (
  input: V137PinnedWasmtimeOptions,
): string => {
  const expectedSha256 = input.expectedSha256 ?? V137_PINNED_WASMTIME_SHA256
  const cacheRoot = input.cacheRoot ?? "/private/tmp/cowards-v1-37-wasmtime"
  const cachedBinary = path.join(cacheRoot, "wasmtime")
  const stagedBinary = path.join(input.stageDirectory, "wasmtime")
  const run =
    input.run ??
    ((executable: string, args: readonly string[]) => {
      const result = spawnSync(executable, [...args], {
        encoding: "buffer",
        shell: false,
        timeout: 300_000,
      })
      if (result.error || result.status !== 0 || result.signal !== null) {
        throw new TypeError("V137_PINNED_WASMTIME_ACQUISITION")
      }
    })

  mkdirSync(input.stageDirectory, { recursive: true, mode: 0o700 })
  mkdirSync(cacheRoot, { recursive: true, mode: 0o700 })
  chmodSync(cacheRoot, 0o700)
  if (!assertRegularExecutable(cachedBinary, expectedSha256)) {
    if (existsSync(cachedBinary)) rmSync(cachedBinary, { force: true })
    const archive = path.join(input.stageDirectory, "wasmtime.tar.xz")
    const extracted = path.join(input.stageDirectory, "wasmtime.extracted")
    rmSync(archive, { force: true })
    rmSync(extracted, { force: true })
    run("curl", ["-fL", V137_PINNED_WASMTIME_URL, "-o", archive])
    run("tar", [
      "-xJf",
      archive,
      "-C",
      input.stageDirectory,
      "--strip-components=1",
      "wasmtime-v45.0.0-x86_64-linux/wasmtime",
    ])
    // tar writes the canonical name; move it first so validation has one path.
    renameSync(path.join(input.stageDirectory, "wasmtime"), extracted)
    if (!assertRegularExecutable(extracted, expectedSha256)) {
      rmSync(extracted, { force: true })
      throw new TypeError("V137_PINNED_WASMTIME_IDENTITY")
    }
    const cacheTemporary = path.join(cacheRoot, `wasmtime-${process.pid}.tmp`)
    rmSync(cacheTemporary, { force: true })
    copyFileSync(extracted, cacheTemporary)
    chmodSync(cacheTemporary, 0o500)
    if (!assertRegularExecutable(cacheTemporary, expectedSha256)) {
      rmSync(cacheTemporary, { force: true })
      throw new TypeError("V137_PINNED_WASMTIME_IDENTITY")
    }
    renameSync(cacheTemporary, cachedBinary)
    rmSync(extracted, { force: true })
  }
  if (!assertRegularExecutable(cachedBinary, expectedSha256)) {
    throw new TypeError("V137_PINNED_WASMTIME_IDENTITY")
  }
  rmSync(stagedBinary, { force: true })
  copyFileSync(cachedBinary, stagedBinary)
  chmodSync(stagedBinary, 0o500)
  if (!assertRegularExecutable(stagedBinary, expectedSha256)) {
    rmSync(stagedBinary, { force: true })
    throw new TypeError("V137_PINNED_WASMTIME_IDENTITY")
  }
  return stagedBinary
}
