import { execFileSync, spawn } from "node:child_process"
import {
  chmodSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  renameSync,
  rmSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { describe, expect, it } from "vitest"
import {
  checkV138SupplementV3AdapterSourceOnly,
  checkV138CommittedSupplementV3ForReview,
  V138_SUPPLEMENT_V3_ADAPTER_SELECTORS,
  writeV138SupplementV3ForReview,
} from "./run-v1-38-bounded-retry-envelope-v3-supplement-v3-adapter-v1.js"

const repoRoot = path.resolve(import.meta.dirname, "..")
const supplementPath = ".planning/artifacts/v1.38-successor-source-seal-v13-executable-custody-supplement-v3.json"
const v2PayloadPath = ".planning/artifacts/v1.38-plan-262-114-live-v10-custody-review-payload-v2.json"
const v2ReviewPath = ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-114-REVIEW-v2.md"
const v2CarrierPath = ".planning/artifacts/v1.38-plan-262-114-live-v10-custody-review-carrier-v2.json"
const effectPath = ".planning/artifacts/v1.38-current-matrix-retry-terminal-v3.json"
const finalReviewPath = ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-114-FINAL-CLEAN-REVIEW.md"
const pairPath = ".planning/artifacts/v1.38-plan-262-90-retry-envelope-v3.json"
const git = (root: string, args: readonly string[]): string => execFileSync(
  "/usr/bin/git",
  ["-c", "core.hooksPath=/dev/null", "-c", "commit.gpgSign=false", ...args],
  { cwd: root, encoding: "utf8" },
).trim()
const withWorktree = <T>(run: (root: string) => T): T => {
  const owner = mkdtempSync(path.join(tmpdir(), "v138-plan115-test-"))
  const root = path.join(owner, "repo")
  let added = false
  try {
    execFileSync("/usr/bin/git", ["worktree", "add", "--quiet", "--detach", root, "HEAD"], { cwd: repoRoot })
    added = true
    symlinkSync(path.join(repoRoot, "node_modules"), path.join(root, "node_modules"), "dir")
    git(root, ["config", "user.name", "Plan 262 Supplement Test"])
    git(root, ["config", "user.email", "plan262-supplement@example.invalid"])
    return run(root)
  } finally {
    if (added) {
      try { execFileSync("/usr/bin/git", ["worktree", "remove", "--force", root], { cwd: repoRoot }) }
      catch { /* preserve the primary assertion */ }
    }
    rmSync(owner, { recursive: true, force: true })
  }
}
const withWorktreeAsync = async <T>(run: (root: string) => Promise<T>): Promise<T> => {
  const owner = mkdtempSync(path.join(tmpdir(), "v138-plan115-race-test-"))
  const root = path.join(owner, "repo")
  let added = false
  try {
    execFileSync("/usr/bin/git", ["worktree", "add", "--quiet", "--detach", root, "HEAD"], { cwd: repoRoot })
    added = true
    symlinkSync(path.join(repoRoot, "node_modules"), path.join(root, "node_modules"), "dir")
    for (const repoPath of [
      "scripts/run-v1-38-bounded-retry-envelope-v3-supplement-v3-adapter-v1.ts",
      "scripts/native/v1-38-plan-262-115-exclusive-writer-v1.c",
    ]) writeFileSync(path.join(root, repoPath), readFileSync(path.join(repoRoot, repoPath)))
    return await run(root)
  } finally {
    if (added) {
      try { execFileSync("/usr/bin/git", ["worktree", "remove", "--force", root], { cwd: repoRoot }) }
      catch { /* preserve the primary assertion */ }
    }
    rmSync(owner, { recursive: true, force: true })
  }
}
const waitFor = async (predicate: () => boolean): Promise<void> => {
  for (let attempt = 0; attempt < 5_000; attempt++) {
    if (predicate()) return
    await new Promise((resolve) => setTimeout(resolve, 1))
  }
  throw new Error("Plan115 native barrier timeout")
}
const commitSupplement = (root: string, extraPath?: string): string => {
  git(root, ["add", supplementPath, ...(extraPath === undefined ? [] : [extraPath])])
  git(root, ["commit", "-m", "test: publish supplement v3"])
  return git(root, ["rev-parse", "HEAD"])
}

describe("Plan 262-115 source-only supplement-v3 adapter", () => {
  it("proves the historical Plan-114 and live-v10 CLIs remain unchanged and lack supplement selectors", () => {
    for (const repoPath of [
      "scripts/check-v1-38-plan-262-114-live-v10-custody-v1.ts",
      "scripts/run-v1-38-bounded-retry-envelope-v3-live-v10.ts",
    ]) {
      const source = readFileSync(path.join(repoRoot, repoPath), "utf8")
      expect(source).not.toContain('args[0] === "--write-supplement-v3"')
      expect(source).not.toContain('args[0] === "--check-supplement-v3"')
    }
  })

  it("exposes exactly source, exclusive-write, and committed-check selectors", () => {
    expect(V138_SUPPLEMENT_V3_ADAPTER_SELECTORS).toEqual([
      "--check-source-only",
      "--write-supplement-v3",
      "--check-supplement-v3",
    ])
    const source = readFileSync(path.join(
      repoRoot,
      "scripts/run-v1-38-bounded-retry-envelope-v3-supplement-v3-adapter-v1.ts",
    ), "utf8")
    expect(source).not.toMatch(/check-reviewed-live-ready|run-reviewed-bounded-live-envelope/)
    expect(source).not.toMatch(/runV138V3ProductionLive|runV138ReviewedBoundedLiveEnvelope/)
    expect(source).not.toMatch(/injected|writeOutput|generic-output/)
    expect(source).not.toMatch(/from ["'].+plan-262-114|from ["'].+live-v10/)
  })

  it("independently authenticates authoritative v2, final-clean custody, and exact zero pair", () => {
    expect(checkV138SupplementV3AdapterSourceOnly(repoRoot)).toMatchObject({
      status: "source_only_checked",
      plan114PublicationCommit: "34bc94ec4e348f71e6055a091d60a505cffc0d79",
      plan114PayloadRoot: "sha256:d4ca10f333598968c0f9b9d7729d5193c981f501a8284cdd5626f2f2b5a518ac",
      plan114ReviewRoot: "sha256:f802ac51d79702f1163fd8d5151b2b7384e2d43de1d97f15ddd74f39538a79ee",
      plan114CarrierRoot: "sha256:8ddd2dc65d0601f8c6d027e225c16e8ea81574f197f877dd4f3c1830f5563c26",
      finalCleanReviewCommit: "92415ea08ccddd2c8fae3c8fc922078d14c589c9",
      plan116ReviewEligible: true,
      plan109Eligible: false,
      reviewRequired: true,
      envelopeStatus: "sealed_inactive",
      counters: {
        acceptedCells: 0,
        calibrationIdentitiesCharged: 0,
        preflightObservationsConsumed: 0,
        reproductionIdentitiesCharged: 0,
        routeStartsConsumed: 0,
      },
      createsEnvelope: false,
      createsCapacity: false,
      resetsCounters: false,
      authorizesExecution: false,
      liveInvoked: false,
      freshCharged: 0,
      freshAccepted: 0,
      downstreamAuthority: "denied",
    })
  }, 180_000)

  it("writes once in a disposable worktree and authenticates an exact committed publication twice", () => {
    withWorktree((root) => {
      const written = writeV138SupplementV3ForReview(root)
      expect(written).toMatchObject({
        status: "supplement_v3_written",
        plan116ReviewEligible: true,
        plan109Eligible: false,
        reviewRequired: true,
        downstreamAuthority: "denied",
      })
      expect(readFileSync(path.join(root, supplementPath), "utf8")).toBe(written.canonicalBytes)
      const publicationCommit = commitSupplement(root)
      expect(git(root, ["ls-tree", publicationCommit, "--", supplementPath])).toMatch(/^100644 blob /)
      const first = checkV138CommittedSupplementV3ForReview(root)
      const second = checkV138CommittedSupplementV3ForReview(root)
      expect(first).toEqual(second)
      expect(first).toMatchObject({
        status: "supplement_v3_committed_checked",
        publicationCommit,
        plan116ReviewEligible: true,
        plan109Eligible: false,
        reviewRequired: true,
        counters: {
          acceptedCells: 0,
          calibrationIdentitiesCharged: 0,
          preflightObservationsConsumed: 0,
          reproductionIdentitiesCharged: 0,
          routeStartsConsumed: 0,
        },
        createsEnvelope: false,
        createsCapacity: false,
        resetsCounters: false,
        authorizesExecution: false,
        liveInvoked: false,
        freshCharged: 0,
        freshAccepted: 0,
        downstreamAuthority: "denied",
      })
    })
  }, 180_000)

  it("rejects current-byte, executable-mode, and add-scope publication mutations", () => {
    withWorktree((root) => {
      writeV138SupplementV3ForReview(root)
      commitSupplement(root)
      const canonicalBytes = readFileSync(path.join(root, supplementPath))
      writeFileSync(path.join(root, supplementPath), "{}\n")
      expect(() => checkV138CommittedSupplementV3ForReview(root)).toThrow(/CURRENT_BYTES_INVALID/)
      rmSync(path.join(root, supplementPath))
      symlinkSync("/definitely/missing/supplement-v3.json", path.join(root, supplementPath))
      expect(() => checkV138CommittedSupplementV3ForReview(root)).toThrow(/FILE_UNSAFE/)
      rmSync(path.join(root, supplementPath))
      writeFileSync(path.join(root, supplementPath), canonicalBytes)
      writeFileSync(path.join(root, supplementPath), `${canonicalBytes.toString("utf8").trim()} \n`)
      git(root, ["add", supplementPath])
      git(root, ["commit", "-m", "test: rewrite supplement v3"])
      writeFileSync(path.join(root, supplementPath), canonicalBytes)
      git(root, ["add", supplementPath])
      git(root, ["commit", "-m", "test: restore supplement v3 bytes"])
      expect(() => checkV138CommittedSupplementV3ForReview(root)).toThrow(/SUCCESSOR_REWRITE/)
    })
    withWorktree((root) => {
      writeV138SupplementV3ForReview(root)
      chmodSync(path.join(root, supplementPath), 0o755)
      commitSupplement(root)
      expect(() => checkV138CommittedSupplementV3ForReview(root)).toThrow(/FILE_UNSAFE/)
    })
    withWorktree((root) => {
      writeV138SupplementV3ForReview(root)
      const extra = ".planning/artifacts/plan115-extra.txt"
      writeFileSync(path.join(root, extra), "extra\n")
      commitSupplement(root, extra)
      expect(() => checkV138CommittedSupplementV3ForReview(root)).toThrow(/PUBLICATION_SCOPE_INVALID/)
    })
  }, 180_000)

  it("rejects post-commit executable drift at every current authoritative review path", () => {
    withWorktree((root) => {
      writeV138SupplementV3ForReview(root)
      commitSupplement(root)
      for (const repoPath of [v2PayloadPath, v2ReviewPath, v2CarrierPath, finalReviewPath, supplementPath]) {
        const absolute = path.join(root, repoPath)
        try {
          chmodSync(absolute, 0o755)
          expect(() => checkV138CommittedSupplementV3ForReview(root)).toThrow(/FILE_UNSAFE/)
        } finally {
          chmodSync(absolute, 0o644)
        }
      }
      expect(checkV138CommittedSupplementV3ForReview(root).status)
        .toBe("supplement_v3_committed_checked")
    })
  }, 180_000)

  it("does not escape when the authenticated artifacts parent is swapped for a symlink", async () => {
    await withWorktreeAsync(async (root) => {
      const external = mkdtempSync(path.join(tmpdir(), "v138-plan115-race-external-"))
      const artifacts = path.join(root, ".planning/artifacts")
      const retained = path.join(root, ".planning/artifacts-authenticated")
      const tag = "parent-swap"
      try {
        const script = realpathSync(path.join(root,
          "scripts/run-v1-38-bounded-retry-envelope-v3-supplement-v3-adapter-v1.ts"))
        const child = spawn(process.execPath, [path.join(root, "node_modules/tsx/dist/cli.mjs"), script,
          "--write-supplement-v3"], {
          cwd: root,
          env: { ...process.env, V138_PLAN115_NATIVE_TEST_BARRIER: tag },
          stdio: ["ignore", "ignore", "pipe"],
        })
        let stderr = ""
        let earlyExit: number | null | undefined
        child.stderr.setEncoding("utf8").on("data", (chunk: string) => { stderr += chunk })
        child.once("exit", (code) => { earlyExit = code })
        await waitFor(() => existsSync(path.join(root, `.v138-plan115-ready-${tag}`)) || earlyExit !== undefined)
        if (earlyExit !== undefined) throw new Error(`Plan115 child exited ${String(earlyExit)}: ${stderr}`)
        renameSync(artifacts, retained)
        symlinkSync(external, artifacts, "dir")
        writeFileSync(path.join(root, `.v138-plan115-continue-${tag}`), "continue\n")
        const exitCode = await new Promise<number | null>((resolve) => child.once("exit", resolve))
        expect(exitCode).not.toBe(0)
        expect(stderr).toContain("V138_PLAN115_NATIVE_PARENT_CHANGED")
        expect(readdirSync(external)).toEqual([])
        expect(() => readFileSync(path.join(retained, path.basename(supplementPath)))).toThrow()
      } finally {
        if (existsSync(retained)) {
          try { unlinkSync(artifacts) } catch { /* swap did not install the link */ }
          renameSync(retained, artifacts)
        }
        rmSync(external, { recursive: true, force: true })
      }
    })
  }, 180_000)

  it("fails closed before writing when authoritative v2 is unavailable or effects are present", () => {
    withWorktree((root) => {
      rmSync(path.join(root, v2PayloadPath))
      expect(() => writeV138SupplementV3ForReview(root)).toThrow()
      expect(() => readFileSync(path.join(root, supplementPath))).toThrow()
    })
    withWorktree((root) => {
      writeFileSync(path.join(root, effectPath), "{}\n")
      expect(() => writeV138SupplementV3ForReview(root)).toThrow(/FORBIDDEN_PRESENT/)
      expect(() => readFileSync(path.join(root, supplementPath))).toThrow()
    })
  }, 180_000)

  it("rejects authoritative-v2, final-clean, and sealed-pair current-byte mutations", () => {
    withWorktree((root) => {
      for (const repoPath of [v2PayloadPath, finalReviewPath, pairPath]) {
        const absolute = path.join(root, repoPath)
        const original = readFileSync(absolute)
        writeFileSync(absolute, Buffer.concat([original, Buffer.from("mutation\n")]))
        expect(() => checkV138SupplementV3AdapterSourceOnly(root)).toThrow(/CURRENT_BYTES_INVALID/)
        writeFileSync(absolute, original)
      }
      expect(checkV138SupplementV3AdapterSourceOnly(root).status).toBe("source_only_checked")
    })
  }, 180_000)
})
