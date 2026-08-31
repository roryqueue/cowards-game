import { createHash } from "node:crypto"
import { execFileSync, spawnSync } from "node:child_process"
import {
  chmodSync,
  closeSync,
  constants,
  fstatSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  openSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"

const CLANG = "/usr/bin/clang",
  CODESIGN = "/usr/bin/codesign",
  CHFLAGS = "/usr/bin/chflags"
const CLANG_SHA =
  "179301dcb41ea78accc3fa0048a7e6f6710d891945a751a34addd622020c1818"
const CLANG_CDHASH =
  "1197f9fac4289a81d8e786b033bf8237672cabbc63da85b759bf2ef85ac232ad"
const PRIVATE_SHA =
  "0f3c9e0d680215e187a768dcf2e816415051aebc4bdd12f88629b010f754991b"
const PRIVATE_CDHASH =
  "a8c71bffbffb63241abbf068c69ac9395a9b82a831b6dc2930f8c36d3a463af0"
const fail = (code: string): never => {
  throw new TypeError(code)
}
const sha256 = (bytes: Buffer | string) =>
  createHash("sha256").update(bytes).digest("hex")
const env = (temporary: string) => ({
  PATH: "/usr/bin:/bin",
  LANG: "C",
  LC_ALL: "C",
  TMPDIR: temporary,
})
const bounded = (temporary: string, timeout: number) => ({
  env: env(temporary),
  stdio: "pipe" as const,
  timeout,
  killSignal: "SIGKILL" as const,
})

export const V138_PRIVATE_NATIVE_EXECUTION_ASSURANCE_V3 = Object.freeze({
  schemaVersion: "v1.38-private-native-execution-assurance-v3" as const,
  assuranceClass: "single_operator_local_seal_v1" as const,
  platform: "darwin" as const,
  descriptorExecutionAvailable: false,
  hostileSameUidConcurrencyExcluded: true,
  pathnameLaunchReplacementResistanceClaimed: false,
  compilerTimeoutMilliseconds: 30_000,
  signingTimeoutMilliseconds: 10_000,
})

const immutable = (file: string) =>
  execFileSync(CHFLAGS, ["uchg", file], bounded(path.dirname(file), 10_000))
const mutable = (file: string) => {
  try {
    execFileSync(CHFLAGS, ["nouchg", file], bounded(path.dirname(file), 10_000))
  } catch {}
}
const assertApple = (file: string): void => {
  const result = spawnSync(CODESIGN, ["-dv", "--verbose=4", file], {
    ...bounded(path.dirname(file), 10_000),
    encoding: "utf8",
  })
  const detail = `${result.stdout}${result.stderr}`
  if (
    result.status !== 0 ||
    !detail.includes(`CandidateCDHashFull sha256=${CLANG_CDHASH}`) ||
    !detail.includes("Authority=Apple Root CA") ||
    !detail.includes("Platform identifier=")
  )
    fail("V138_PRIVATE_COMPILER_CODESIGN_MISMATCH")
  execFileSync(
    CODESIGN,
    ["--verify", "--strict", file],
    bounded(path.dirname(file), 10_000),
  )
}
const signPrivate = (file: string): void => {
  execFileSync(
    CODESIGN,
    [
      "--force",
      "--sign",
      "-",
      "--preserve-metadata=entitlements,requirements,flags,runtime",
      file,
    ],
    bounded(path.dirname(file), 10_000),
  )
  const result = spawnSync(CODESIGN, ["-dv", "--verbose=4", file], {
    ...bounded(path.dirname(file), 10_000),
    encoding: "utf8",
  })
  const detail = `${result.stdout}${result.stderr}`
  if (
    result.status !== 0 ||
    !detail.includes(`CandidateCDHashFull sha256=${PRIVATE_CDHASH}`) ||
    !detail.includes("Signature=adhoc") ||
    sha256(readFileSync(file)) !== PRIVATE_SHA
  )
    fail("V138_PRIVATE_COMPILER_SIGNED_IDENTITY_MISMATCH")
  execFileSync(
    CODESIGN,
    ["--verify", "--strict", file],
    bounded(path.dirname(file), 10_000),
  )
}

export type V138PrivateNativeV3 = Readonly<{
  directory: string
  executable: string
  executableSha256: string
  compilerSha256: string
  sourceSha256: string
  executionAssurance: typeof V138_PRIVATE_NATIVE_EXECUTION_ASSURANCE_V3
  cleanup: () => void
}>
export const compileV138PrivateNativeV3 = (
  input: Readonly<{
    source: string
    expectedSourceSha256: string
    prefix: string
    defines?: readonly string[]
    testSubstitution?: boolean
  }>,
): V138PrivateNativeV3 => {
  const directory = mkdtempSync(path.join(tmpdir(), input.prefix))
  chmodSync(directory, 0o700)
  const compiler = path.join(directory, "clang"),
    source = path.join(directory, "captured.c")
  const primary = path.join(directory, "primary"),
    reproduction = path.join(directory, "reproduction")
  const executable = path.join(primary, "native"),
    reproduced = path.join(reproduction, "native")
  mkdirSync(primary, { mode: 0o700 })
  mkdirSync(reproduction, { mode: 0o700 })
  let compilerDescriptor: number | undefined,
    complete = false
  const cleanup = () => {
    for (const file of [compiler, source, executable, reproduced]) mutable(file)
    rmSync(directory, { recursive: true, force: true })
  }
  try {
    compilerDescriptor = openSync(
      CLANG,
      constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0),
    )
    const held = fstatSync(compilerDescriptor),
      named = lstatSync(CLANG)
    if (!held.isFile() || held.dev !== named.dev || held.ino !== named.ino)
      fail("V138_PRIVATE_COMPILER_DESCRIPTOR_IDENTITY_MISMATCH")
    const bytes = readFileSync(compilerDescriptor)
    if (sha256(bytes) !== CLANG_SHA)
      fail("V138_PRIVATE_COMPILER_DIGEST_MISMATCH")
    assertApple(CLANG)
    writeFileSync(compiler, bytes, { flag: "wx", mode: 0o500 })
    assertApple(compiler)
    if (sha256(readFileSync(compiler)) !== CLANG_SHA)
      fail("V138_PRIVATE_COMPILER_COPY_MISMATCH")
    chmodSync(compiler, 0o700)
    signPrivate(compiler)
    chmodSync(compiler, 0o500)
    immutable(compiler)
    const sourceBytes = readFileSync(input.source)
    if (sha256(sourceBytes) !== input.expectedSourceSha256)
      fail("V138_PRIVATE_NATIVE_SOURCE_MISMATCH")
    writeFileSync(source, sourceBytes, { flag: "wx", mode: 0o400 })
    immutable(source)
    if (input.testSubstitution) {
      let refused = false
      try {
        writeFileSync(compiler, "substitution", { flag: "w" })
      } catch {
        refused = true
      }
      if (!refused || sha256(readFileSync(compiler)) !== PRIVATE_SHA)
        fail("V138_PRIVATE_COMPILER_SUBSTITUTION_ACCEPTED")
    }
    for (const output of [executable, reproduced]) {
      let pre: number | undefined
      try {
        pre = openSync(
          compiler,
          constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0),
        )
        const before = fstatSync(pre),
          namedBefore = lstatSync(compiler)
        if (before.dev !== namedBefore.dev || before.ino !== namedBefore.ino)
          fail("V138_PRIVATE_COMPILER_PRELAUNCH_IDENTITY_MISMATCH")
        const result = spawnSync(
          compiler,
          [
            "-std=c11",
            "-Wall",
            "-Wextra",
            "-Werror",
            ...(input.defines ?? []),
            source,
            "-o",
            output,
          ],
          { ...bounded(directory, 30_000), encoding: "utf8" },
        )
        if (result.status !== 0)
          fail(
            `V138_PRIVATE_NATIVE_COMPILE_FAILED:${result.status}:${result.signal ?? ""}:${result.error?.message ?? ""}:${result.stderr}`,
          )
        const after = lstatSync(compiler)
        if (
          before.dev !== after.dev ||
          before.ino !== after.ino ||
          sha256(readFileSync(compiler)) !== PRIVATE_SHA
        )
          fail("V138_PRIVATE_COMPILER_POSTLAUNCH_IDENTITY_MISMATCH")
      } finally {
        if (pre !== undefined) closeSync(pre)
      }
      chmodSync(output, 0o500)
    }
    const executableSha256 = sha256(readFileSync(executable))
    if (executableSha256 !== sha256(readFileSync(reproduced)))
      fail("V138_PRIVATE_NATIVE_REPRODUCIBILITY_MISMATCH")
    immutable(executable)
    immutable(reproduced)
    if (sha256(readFileSync(executable)) !== executableSha256)
      fail("V138_PRIVATE_NATIVE_OUTPUT_CHANGED")
    complete = true
    return Object.freeze({
      directory,
      executable,
      executableSha256,
      compilerSha256: PRIVATE_SHA,
      sourceSha256: input.expectedSourceSha256,
      executionAssurance: V138_PRIVATE_NATIVE_EXECUTION_ASSURANCE_V3,
      cleanup,
    })
  } finally {
    if (compilerDescriptor !== undefined) closeSync(compilerDescriptor)
    if (!complete) cleanup()
  }
}
