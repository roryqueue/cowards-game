import { execFileSync } from "node:child_process"
import {
  existsSync,
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
  V138_PLAN_262_104_MODES,
  deriveV138Plan262104SealEnvelopeNoPublish,
  executeV138Plan262104Cli,
  checkV138Plan262104CommittedInactivePair,
  publishV138Plan262104SealedInactivePair,
  resolveV138Plan262103TrioPublication,
} from "./run-v1-38-bounded-retry-envelope-v3-review-v7.js"
import { V138_BOUNDED_RETRY_V3_PATHS } from "./lib/v1-38-bounded-retry-envelope-v3.js"

const repoRoot = path.resolve(import.meta.dirname, "..")
const EXPECTED_PUBLICATION = "2f4fd225ca32b0ac67c2fd09f3036cbbe208725c"
const temporaryRoots: string[] = []
const git = (root: string, args: readonly string[]): string =>
  execFileSync("/usr/bin/git", ["-c", "core.hooksPath=/dev/null", ...args], {
    cwd: root,
    encoding: "utf8",
    env: {
      PATH: "/usr/bin:/bin",
      LANG: "C",
      LC_ALL: "C",
      HOME: root,
      GIT_CONFIG_NOSYSTEM: "1",
      GIT_CONFIG_GLOBAL: "/dev/null",
      GIT_NO_REPLACE_OBJECTS: "1",
    },
  }).trim()

const disposableClone = (): string => {
  const owner = mkdtempSync(path.join(tmpdir(), "v138-plan-262-104-"))
  temporaryRoots.push(owner)
  const clone = path.join(owner, "repo")
  execFileSync(
    "/usr/bin/git",
    ["-c", "core.hooksPath=/dev/null", "clone", "--quiet", "--no-local", repoRoot, clone],
    { env: { PATH: "/usr/bin:/bin", LANG: "C", LC_ALL: "C", HOME: owner } },
  )
  symlinkSync(path.join(repoRoot, "node_modules"), path.join(clone, "node_modules"), "dir")
  git(clone, ["config", "user.name", "Plan 262 Test"])
  git(clone, ["config", "user.email", "plan-262@example.invalid"])
  return clone
}

const commitPair = (clone: string, extraPath?: string): string => {
  const paths = [V138_BOUNDED_RETRY_V3_PATHS.seal, V138_BOUNDED_RETRY_V3_PATHS.envelope]
  if (extraPath !== undefined) {
    writeFileSync(path.join(clone, extraPath), "extra\n")
    paths.push(extraPath)
  }
  git(clone, ["add", "--", ...paths])
  git(clone, ["commit", "-m", "synthetic inactive pair"])
  return git(clone, ["rev-parse", "HEAD"])
}

afterEach(() => {
  for (const root of temporaryRoots.splice(0))
    rmSync(root, { recursive: true, force: true })
})

describe("Plan 262-104 v7 exclusive inactive pair", () => {
  it("delegates publication exactly once with two canonical members", () => {
    const calls: any[] = []
    const artifacts = publishV138Plan262104SealedInactivePair(
      repoRoot,
      ((root: string, input: unknown) => calls.push({ root, input })) as never,
    )
    expect(calls).toHaveLength(1)
    expect(calls[0].root).toBe(repoRoot)
    expect(calls[0].input.members.map((member: any) => member.target)).toEqual([
      V138_BOUNDED_RETRY_V3_PATHS.seal,
      V138_BOUNDED_RETRY_V3_PATHS.envelope,
    ])
    expect(artifacts.seal.schemaVersion).toBe("v1.38-successor-source-seal-v13")
    expect(artifacts.envelope.status).toBe("sealed_inactive")
  }, 180_000)

  it("publishes natively only in a disposable repo and checks the committed direct child", () => {
    if (process.platform !== "darwin") return
    const clone = disposableClone()
    const parent = git(clone, ["rev-parse", "HEAD"])
    const artifacts = publishV138Plan262104SealedInactivePair(clone)
    expect(artifacts.directParentCommit).toBe(parent)
    expect(existsSync(path.join(clone, V138_BOUNDED_RETRY_V3_PATHS.seal))).toBe(true)
    expect(existsSync(path.join(clone, V138_BOUNDED_RETRY_V3_PATHS.envelope))).toBe(true)
    expect(existsSync(path.join(clone, ".planning/artifacts/v1.38-v3-seal-envelope-v7.intent"))).toBe(false)
    const pairCommit = commitPair(clone)
    expect(checkV138Plan262104CommittedInactivePair(clone)).toMatchObject({
      pairCommit,
      directParentCommit: parent,
      envelope: { status: "sealed_inactive", counters: { acceptedCells: 0 } },
    })
    expect(() => publishV138Plan262104SealedInactivePair(clone)).toThrow(
      "V138_PLAN_262_104_DESTINATION_PRESENT",
    )
  }, 180_000)

  it("fails before effects for pre-existing or failed publication", () => {
    const clone = disposableClone()
    writeFileSync(path.join(clone, V138_BOUNDED_RETRY_V3_PATHS.seal), "occupied\n")
    expect(() => publishV138Plan262104SealedInactivePair(clone)).toThrow(
      "V138_PLAN_262_104_DESTINATION_PRESENT",
    )
    rmSync(path.join(clone, V138_BOUNDED_RETRY_V3_PATHS.seal))
    expect(() =>
      publishV138Plan262104SealedInactivePair(clone, (() => {
        throw new Error("forced native failure")
      }) as never),
    ).toThrow("forced native failure")
    expect(existsSync(path.join(clone, V138_BOUNDED_RETRY_V3_PATHS.seal))).toBe(false)
    expect(existsSync(path.join(clone, V138_BOUNDED_RETRY_V3_PATHS.envelope))).toBe(false)
  }, 180_000)

  it("rejects a pair commit that changes any third path", () => {
    if (process.platform !== "darwin") return
    const clone = disposableClone()
    publishV138Plan262104SealedInactivePair(clone)
    commitPair(clone, "synthetic-extra.txt")
    expect(() => checkV138Plan262104CommittedInactivePair(clone)).toThrow(
      "V138_PLAN_262_104_PAIR_DIFF_INVALID",
    )
  }, 180_000)
})

describe("Plan 262-104 v7 historical trio resolution", () => {
  it("exposes exactly four non-live modes", () => {
    expect(V138_PLAN_262_104_MODES).toEqual([
      "--check-source-only",
      "--derive-seal-envelope-no-publish",
      "--publish-sealed-inactive-envelope",
      "--check-sealed-inactive-envelope",
    ])
    expect(V138_PLAN_262_104_MODES.some((mode) => /live|run/u.test(mode))).toBe(false)
  })

  it("resolves the exact historical three-path publication below later HEAD", () => {
    const resolved = resolveV138Plan262103TrioPublication(repoRoot)
    expect(resolved).toMatchObject({
      sourceCommit: "332aae093ef6e26c95a18f21cfd253ccc829ce48",
      publicationCommit: "2f4fd225ca32b0ac67c2fd09f3036cbbe208725c",
      candidate: { mode: "100644", blob: "2d3f995bcd4c0067e3d8c0c2a0120a36bfdc1745" },
      review: { mode: "100644", blob: "680616684dcdc408829923bf9f062a075ddf32f2" },
      carrier: { mode: "100644", blob: "89d1077b12672c4a066cbcba77568e228c0669de" },
    })
    expect(resolved.publicationCommit).not.toBe(resolved.headCommit)
    expect(git(repoRoot, ["merge-base", "--is-ancestor", resolved.sourceCommit, resolved.publicationCommit])).toBe("")
    expect(git(repoRoot, ["merge-base", "--is-ancestor", resolved.publicationCommit, resolved.headCommit])).toBe("")
  })

  it("derives the frozen seal-v13/envelope-v3 pair without publishing", () => {
    const result = deriveV138Plan262104SealEnvelopeNoPublish(repoRoot)
    expect(result.kind).toBe("eligible")
    if (result.kind !== "eligible") return
    expect(result).toMatchObject({
      status: "sealed_inactive_not_published",
      publicationCommit: "2f4fd225ca32b0ac67c2fd09f3036cbbe208725c",
      freshCharged: 0,
      freshAccepted: 0,
      downstreamAuthority: "denied",
    })
    expect(result.seal.schemaVersion).toBe("v1.38-successor-source-seal-v13")
    expect(result.envelope.schemaVersion).toBe("retry-envelope:v3")
    expect(result.envelope.status).toBe("sealed_inactive")
  }, 180_000)

  it("rejects a later rewrite of any protected trio path", () => {
    const clone = disposableClone()
    git(clone, ["config", "user.name", "Plan 262 Test"])
    git(clone, ["config", "user.email", "plan-262@example.invalid"])
    const candidate = ".planning/artifacts/v1.38-plan-262-103-bounded-retry-source-rereview-payload-v6.json"
    const candidateTarget = path.join(clone, candidate)
    writeFileSync(candidateTarget, Buffer.concat([readFileSync(candidateTarget), Buffer.from(" \n")]))
    git(clone, ["commit", "-m", "rewrite protected trio", "--", candidate])
    execFileSync("/usr/bin/git", ["checkout", EXPECTED_PUBLICATION, "--", candidate], {
      cwd: clone,
    })
    expect(() => resolveV138Plan262103TrioPublication(clone)).toThrow(
      "V138_PLAN_262_104_TRIO_REWRITTEN",
    )
  })

  it("rejects malformed and live CLI modes before effects", async () => {
    const outputs: string[] = []
    await expect(
      executeV138Plan262104Cli(["--run-bounded-live-envelope"], {
        repoRoot,
        writeOutput: (value) => outputs.push(value),
      }),
    ).rejects.toThrow("V138_PLAN_262_104_ARGUMENTS_INVALID")
    expect(outputs).toEqual([])
  })
})
