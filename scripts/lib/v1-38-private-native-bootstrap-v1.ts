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

const CLANG = "/usr/bin/clang"
const CODESIGN = "/usr/bin/codesign"
const CHFLAGS = "/usr/bin/chflags"
const EXPECTED_CLANG_SHA256 =
  "179301dcb41ea78accc3fa0048a7e6f6710d891945a751a34addd622020c1818"
const EXPECTED_CLANG_CDHASH =
  "1197f9fac4289a81d8e786b033bf8237672cabbc63da85b759bf2ef85ac232ad"
const EXPECTED_PRIVATE_CLANG_SHA256 =
  "0f3c9e0d680215e187a768dcf2e816415051aebc4bdd12f88629b010f754991b"
const EXPECTED_PRIVATE_CLANG_CDHASH =
  "a8c71bffbffb63241abbf068c69ac9395a9b82a831b6dc2930f8c36d3a463af0"

const fail = (code: string): never => {
  throw new TypeError(code)
}
const sha256 = (bytes: Buffer | string): string =>
  createHash("sha256").update(bytes).digest("hex")
const cleanEnvironment = (temporary: string) => ({
  PATH: "/usr/bin:/bin",
  LANG: "C",
  LC_ALL: "C",
  TMPDIR: temporary,
})
const immutable = (file: string): void => {
  execFileSync(CHFLAGS, ["uchg", file], {
    env: cleanEnvironment(path.dirname(file)),
    stdio: "pipe",
  })
}
const mutable = (file: string): void => {
  try {
    execFileSync(CHFLAGS, ["nouchg", file], {
      env: cleanEnvironment(path.dirname(file)),
      stdio: "pipe",
    })
  } catch {
    // Cleanup remains best effort only after the caller has already failed.
  }
}
const assertAppleCompiler = (file: string): void => {
  const result = spawnSync(CODESIGN, ["-dv", "--verbose=4", file], {
    encoding: "utf8",
    env: cleanEnvironment(path.dirname(file)),
  })
  const detail = `${result.stdout}${result.stderr}`
  if (
    result.status !== 0 ||
    !detail.includes(`CandidateCDHashFull sha256=${EXPECTED_CLANG_CDHASH}`) ||
    !detail.includes("Authority=Apple Root CA") ||
    !detail.includes("Platform identifier=")
  )
    fail("V138_PRIVATE_COMPILER_CODESIGN_MISMATCH")
  execFileSync(CODESIGN, ["--verify", "--strict", file], {
    env: cleanEnvironment(path.dirname(file)),
    stdio: "pipe",
  })
}
const signAndAssertPrivateCompiler = (file: string): void => {
  execFileSync(
    CODESIGN,
    [
      "--force",
      "--sign",
      "-",
      "--preserve-metadata=entitlements,requirements,flags,runtime",
      file,
    ],
    { env: cleanEnvironment(path.dirname(file)), stdio: "pipe" },
  )
  const result = spawnSync(CODESIGN, ["-dv", "--verbose=4", file], {
    encoding: "utf8",
    env: cleanEnvironment(path.dirname(file)),
  })
  const detail = `${result.stdout}${result.stderr}`
  if (
    result.status !== 0 ||
    !detail.includes(
      `CandidateCDHashFull sha256=${EXPECTED_PRIVATE_CLANG_CDHASH}`,
    ) ||
    !detail.includes("Signature=adhoc") ||
    sha256(readFileSync(file)) !== EXPECTED_PRIVATE_CLANG_SHA256
  )
    fail("V138_PRIVATE_COMPILER_SIGNED_IDENTITY_MISMATCH")
  execFileSync(CODESIGN, ["--verify", "--strict", file], {
    env: cleanEnvironment(path.dirname(file)),
    stdio: "pipe",
  })
}

export type V138PrivateNative = Readonly<{
  directory: string
  executable: string
  executableSha256: string
  compilerSha256: string
  sourceSha256: string
  cleanup: () => void
}>

/**
 * Copies reviewed compiler bytes from a retained descriptor into a private
 * 0700 directory, authenticates the exact copy, and marks every executable
 * pathname user-immutable before launch. The returned output is likewise
 * digest-bound and immutable until cleanup clears the flag.
 */
export const compileV138PrivateNative = (input: Readonly<{
  source: string
  expectedSourceSha256: string
  prefix: string
  defines?: readonly string[]
  testSubstitution?: boolean
}>): V138PrivateNative => {
  const directory = mkdtempSync(path.join(tmpdir(), input.prefix))
  let compilerDescriptor: number | undefined
  let complete = false
  const compiler = path.join(directory, "clang")
  const source = path.join(directory, "captured.c")
  const primaryDirectory = path.join(directory, "primary")
  const reproductionDirectory = path.join(directory, "reproduction")
  const executable = path.join(primaryDirectory, "native")
  const reproduced = path.join(reproductionDirectory, "native")
  const cleanup = () => {
    for (const file of [compiler, source, executable, reproduced]) mutable(file)
    rmSync(directory, { recursive: true, force: true })
  }
  try {
    chmodSync(directory, 0o700)
    mkdirSync(primaryDirectory, { mode: 0o700 })
    mkdirSync(reproductionDirectory, { mode: 0o700 })
    compilerDescriptor = openSync(
      CLANG,
      constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0),
    )
    const compilerIdentity = fstatSync(compilerDescriptor)
    const compilerPathIdentity = lstatSync(CLANG)
    if (
      !compilerIdentity.isFile() ||
      compilerIdentity.dev !== compilerPathIdentity.dev ||
      compilerIdentity.ino !== compilerPathIdentity.ino
    )
      fail("V138_PRIVATE_COMPILER_DESCRIPTOR_IDENTITY_MISMATCH")
    const compilerBytes = readFileSync(compilerDescriptor)
    if (sha256(compilerBytes) !== EXPECTED_CLANG_SHA256)
      fail("V138_PRIVATE_COMPILER_DIGEST_MISMATCH")
    assertAppleCompiler(CLANG)
    writeFileSync(compiler, compilerBytes, { flag: "wx", mode: 0o500 })
    assertAppleCompiler(compiler)
    if (sha256(readFileSync(compiler)) !== EXPECTED_CLANG_SHA256)
      fail("V138_PRIVATE_COMPILER_COPY_MISMATCH")
    chmodSync(compiler, 0o700)
    signAndAssertPrivateCompiler(compiler)
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
      if (
        !refused ||
        sha256(readFileSync(compiler)) !== EXPECTED_PRIVATE_CLANG_SHA256
      )
        fail("V138_PRIVATE_COMPILER_SUBSTITUTION_ACCEPTED")
    }

    for (const output of [executable, reproduced]) {
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
        { encoding: "utf8", env: cleanEnvironment(directory) },
      )
      if (result.status !== 0)
        fail(
          `V138_PRIVATE_NATIVE_COMPILE_FAILED:${result.status}:${result.signal ?? ""}:${result.error?.message ?? ""}:${result.stderr}`,
        )
      chmodSync(output, 0o500)
    }
    const executableBytes = readFileSync(executable)
    const executableSha256 = sha256(executableBytes)
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
      compilerSha256: EXPECTED_PRIVATE_CLANG_SHA256,
      sourceSha256: input.expectedSourceSha256,
      cleanup,
    })
  } finally {
    if (compilerDescriptor !== undefined) closeSync(compilerDescriptor)
    if (!complete) cleanup()
  }
}
