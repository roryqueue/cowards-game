import { execFileSync } from "node:child_process"
import {
  chmodSync,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import {
  assertV138HistoricalCheckoutBytesV4,
  assertV138HistoricalRepositoryConfigurationSafeV4,
  resolveV138HistoricalToolchainV4,
  runV138Phase262HistoricalCorrectionCheckoutsV4,
  V138_HISTORICAL_GIT_ISOLATION_V4,
} from "./run-v1-38-phase-262-historical-correction-checkouts-v4.js"

const roots: string[] = []
afterEach(() => {
  while (roots.length > 0) rmSync(roots.pop()!, { recursive: true, force: true })
})

describe("CR-05 historical correction toolchain provenance", () => {
  it("resolves exact authenticated Git, Node, pnpm, and corepack identities", () => {
    const tools = resolveV138HistoricalToolchainV4()
    expect(tools.git).toBe("/usr/bin/git")
    expect(tools.gitCdHash).toMatch(/^[0-9a-f]{64}$/u)
    expect(tools.nodeCdHash).toMatch(/^[0-9a-f]{64}$/u)
    expect(tools.pnpmVersion).toBe("11.1.2")
  })

  it("rejects a PATH-prepended pnpm wrapper before any checkout", () => {
    const root = mkdtempSync(path.join(tmpdir(), "v138-pnpm-wrapper-"))
    roots.push(root)
    const wrapper = path.join(root, "pnpm")
    writeFileSync(wrapper, "#!/bin/sh\necho 11.1.2\n")
    chmodSync(wrapper, 0o700)
    expect(() =>
      resolveV138HistoricalToolchainV4(
        `${root}${path.delimiter}${process.env.PATH ?? ""}`,
      ),
    ).toThrow()
  })

  it("rejects a mutated pnpm implementation bundle with the pinned entry unchanged", () => {
    const tools = resolveV138HistoricalToolchainV4()
    const fixture = mkdtempSync(path.join(tmpdir(), "v138-pnpm-dist-mutation-"))
    roots.push(fixture)
    const copiedPackage = path.join(fixture, "pnpm")
    const fakeBin = path.join(fixture, "bin")
    cpSync(tools.pnpmPackageRoot, copiedPackage, { recursive: true })
    mkdirSync(fakeBin)
    symlinkSync(tools.node, path.join(fakeBin, "node"))
    symlinkSync(tools.corepack, path.join(fakeBin, "corepack"))
    symlinkSync(path.join(copiedPackage, "bin/pnpm.mjs"), path.join(fakeBin, "pnpm"))
    writeFileSync(
      path.join(copiedPackage, "dist/pnpm.mjs"),
      `${readFileSync(path.join(copiedPackage, "dist/pnpm.mjs"), "utf8")}\n// mutation\n`,
    )
    expect(() => resolveV138HistoricalToolchainV4(fakeBin)).toThrow(
      "V138_HISTORICAL_PNPM_EXECUTION_CLOSURE_MISMATCH",
    )
  })

  it("does not launch historical child derivations through ambient tsx", () => {
    const source = readFileSync(
      "scripts/run-v1-38-phase-262-historical-correction-checkouts-v4.ts",
      "utf8",
    )
    expect(source).not.toContain('["--import", "tsx"')
    expect(source).toContain("same-process-reviewed-runner-no-ambient-tsx-child-v5")
  })

  it("rejects CRLF-transformed executed bytes and tracked checkout attributes", () => {
    const repository = mkdtempSync(path.join(tmpdir(), "v138-checkout-bytes-repo-"))
    roots.push(repository)
    const git = (args: string[]) =>
      execFileSync("/usr/bin/git", args, {
        cwd: repository,
        env: { PATH: "/usr/bin:/bin", LANG: "C", LC_ALL: "C" },
        encoding: "utf8",
      }).trim()
    git(["init"])
    git(["config", "user.name", "v138-test"])
    git(["config", "user.email", "v138-test@example.invalid"])
    writeFileSync(path.join(repository, "proof.txt"), "line-one\nline-two\n")
    git(["add", "proof.txt"])
    git(["commit", "-m", "raw-bytes"])
    const rawCommit = git(["rev-parse", "HEAD"])
    expect(
      assertV138HistoricalCheckoutBytesV4(repository, repository, rawCommit)
        .files,
    ).toBe(1)
    git(["config", "core.autocrlf", "true"])
    expect(() =>
      assertV138HistoricalRepositoryConfigurationSafeV4(repository),
    ).toThrow("V138_HISTORICAL_REPOSITORY_CONFIG_FORBIDDEN")
    git(["config", "--unset", "core.autocrlf"])
    writeFileSync(path.join(repository, "proof.txt"), "line-one\r\nline-two\r\n")
    expect(() =>
      assertV138HistoricalCheckoutBytesV4(repository, repository, rawCommit),
    ).toThrow("V138_HISTORICAL_CHECKOUT_BYTES_MISMATCH")

    writeFileSync(path.join(repository, "proof.txt"), "line-one\nline-two\n")
    writeFileSync(path.join(repository, ".gitattributes"), "*.txt text eol=crlf\n")
    git(["add", ".gitattributes", "proof.txt"])
    git(["commit", "-m", "checkout-transform"])
    expect(() =>
      assertV138HistoricalCheckoutBytesV4(
        repository,
        repository,
        git(["rev-parse", "HEAD"]),
      ),
    ).toThrow("V138_HISTORICAL_CHECKOUT_ATTRIBUTES_FORBIDDEN")
  })

  it("rejects a mutated Vitest dist entry before execution and ignores hostile global hooks/config", () => {
    const hostile = mkdtempSync(path.join(tmpdir(), "v138-hostile-git-config-"))
    roots.push(hostile)
    const hooks = path.join(hostile, "hooks")
    mkdirSync(hooks)
    const marker = path.join(hostile, "post-checkout-ran")
    const hook = path.join(hooks, "post-checkout")
    writeFileSync(hook, `#!/bin/sh\nprintf ran > '${marker}'\n`)
    chmodSync(hook, 0o700)
    writeFileSync(
      path.join(hostile, ".gitconfig"),
      `[core]\n\thooksPath = ${hooks}\n[alias]\n\trev-parse = status\n`,
    )
    const previousHome = process.env.HOME
    const previousReplace = process.env.GIT_REPLACE_REF_BASE
    process.env.HOME = hostile
    process.env.GIT_REPLACE_REF_BASE = "refs/hostile-replace/"
    try {
      expect(() =>
        runV138Phase262HistoricalCorrectionCheckoutsV4({
          mutateInstalledRunner: true,
        }),
      ).toThrow("V138_HISTORICAL_INSTALLED_CLOSURE_MISMATCH")
      expect(existsSync(marker)).toBe(false)
      const source = readFileSync(
        path.resolve(
          "scripts/run-v1-38-phase-262-historical-correction-checkouts-v4.ts",
        ),
        "utf8",
      )
      expect(source).toContain('GIT_CONFIG_NOSYSTEM: "1"')
      expect(source).toContain('GIT_CONFIG_GLOBAL: "/dev/null"')
      expect(source).toContain('GIT_NO_REPLACE_OBJECTS: "1"')
      expect(source).toContain('"core.hooksPath=/dev/null"')
      expect(V138_HISTORICAL_GIT_ISOLATION_V4).toEqual({
        systemConfigDisabled: true,
        globalConfigDisabled: true,
        isolatedHome: true,
        hooksDisabledPerCommand: true,
        replacementObjectsDisabled: true,
        replacementRefsRejected: true,
        rawCommitAndTreeVerified: true,
        checkoutByteManifestVerified: true,
        checkoutAttributesRejected: true,
        checkoutTransformConfigNeutralized: true,
        checkoutCleanBeforeInstall: true,
      })
    } finally {
      if (previousHome === undefined) delete process.env.HOME
      else process.env.HOME = previousHome
      if (previousReplace === undefined) delete process.env.GIT_REPLACE_REF_BASE
      else process.env.GIT_REPLACE_REF_BASE = previousReplace
    }
  }, 180_000)
})
