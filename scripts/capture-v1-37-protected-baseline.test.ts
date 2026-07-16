import { execFileSync } from "node:child_process"
import { Buffer } from "node:buffer"
import { createHash } from "node:crypto"
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import {
  V137_PROTECTED_BASELINE_PATH,
  V137_PROTECTED_PATHS,
  captureV137ProtectedBaseline,
  checkV137ProtectedBaseline,
  parseV137ProtectedBaseline,
  renderV137ProtectedBaseline,
  writeV137ProtectedBaseline,
} from "./capture-v1-37-protected-baseline.js"

const roots: string[] = []

afterEach(() => {
  while (roots.length > 0) {
    rmSync(roots.pop()!, { recursive: true, force: true })
  }
})

const git = (root: string, args: readonly string[]): Buffer =>
  execFileSync("git", args, {
    cwd: root,
    env: {
      ...process.env,
      LC_ALL: "C",
      LANG: "C",
      GIT_CONFIG_NOSYSTEM: "1",
    },
  })

const fixture = (): Readonly<{
  root: string
  artifactPath: string
}> => {
  const root = mkdtempSync(path.join(tmpdir(), "cowards-protected-baseline-"))
  roots.push(root)
  mkdirSync(path.join(root, ".planning", "artifacts"), { recursive: true })
  writeFileSync(
    path.join(root, ".planning", "config.json"),
    '{"mode":"yolo","workflow":{"auto_advance":false}}\n',
  )
  writeFileSync(
    path.join(root, "CowardsGameSpec_Full_Consolidated_v1.md"),
    "# Coward's Game\r\n\r\nOriginal bytes.\r\n",
  )
  git(root, ["init", "--quiet"])
  git(root, ["config", "user.email", "tests@example.invalid"])
  git(root, ["config", "user.name", "Cowards Tests"])
  git(root, ["config", "core.filemode", "true"])
  git(root, ["add", "--", ...V137_PROTECTED_PATHS])
  git(root, ["commit", "--quiet", "-m", "fixture"])
  return {
    root,
    artifactPath: path.join(root, V137_PROTECTED_BASELINE_PATH),
  }
}

const sha256 = (bytes: Uint8Array): string =>
  createHash("sha256").update(bytes).digest("hex")

describe("v1.37 protected working-tree baseline", () => {
  it("captures exact clean raw, HEAD, diff, mode, and status evidence", () => {
    const { root } = fixture()
    const baseline = captureV137ProtectedBaseline({ observedRepoRoot: root })
    expect(baseline.paths.map(({ path: protectedPath }) => protectedPath)).toEqual(
      V137_PROTECTED_PATHS,
    )
    for (const entry of baseline.paths) {
      expect(entry.raw.exists).toBe(true)
      expect(entry.raw.sha256).toMatch(/^sha256:[0-9a-f]{64}$/u)
      expect(entry.raw.byteLength).toBeGreaterThan(0)
      expect(entry.raw.mode).toBe("0644")
      expect(entry.head.exists).toBe(true)
      expect(entry.head.blobId).toMatch(/^[0-9a-f]{40}$/u)
      expect(entry.head.mode).toBe("100644")
      expect(entry.unstagedDiff.byteLength).toBe(0)
      expect(entry.stagedDiff.byteLength).toBe(0)
      expect(entry.porcelainStatus).toBe("")
    }
    expect(parseV137ProtectedBaseline(renderV137ProtectedBaseline(baseline))).toEqual(
      baseline,
    )
  })

  it("accepts identical pre-existing modified, staged, and mixed dirt", () => {
    const states = ["modified", "staged", "mixed"] as const
    for (const state of states) {
      const { root, artifactPath } = fixture()
      const configPath = path.join(root, ".planning", "config.json")
      writeFileSync(configPath, `{"state":"${state}"}\n`)
      if (state !== "modified") {
        git(root, ["add", "--", ".planning/config.json"])
      }
      if (state === "mixed") {
        writeFileSync(configPath, '{"state":"mixed-working"}\n')
      }
      writeV137ProtectedBaseline({
        observedRepoRoot: root,
        artifactPath,
      })
      const checked = checkV137ProtectedBaseline({
        observedRepoRoot: root,
        artifactPath,
      })
      expect(checked.paths[0]!.porcelainStatus).toBe(
        state === "modified" ? " M .planning/config.json\n" : state === "staged"
          ? "M  .planning/config.json\n"
          : "MM .planning/config.json\n",
      )
      if (state === "modified") {
        expect(checked.paths[0]!.unstagedDiff.byteLength).toBeGreaterThan(0)
        expect(checked.paths[0]!.stagedDiff.byteLength).toBe(0)
      } else if (state === "staged") {
        expect(checked.paths[0]!.unstagedDiff.byteLength).toBe(0)
        expect(checked.paths[0]!.stagedDiff.byteLength).toBeGreaterThan(0)
      } else {
        expect(checked.paths[0]!.unstagedDiff.byteLength).toBeGreaterThan(0)
        expect(checked.paths[0]!.stagedDiff.byteLength).toBeGreaterThan(0)
      }
    }
  })

  it("rejects missing files and any protected-path inventory substitution", () => {
    const { root } = fixture()
    rmSync(path.join(root, ".planning", "config.json"))
    expect(() =>
      captureV137ProtectedBaseline({ observedRepoRoot: root }),
    ).toThrow(/protected path is missing/iu)

    expect(() =>
      captureV137ProtectedBaseline({
        observedRepoRoot: root,
        protectedPaths: [
          ...V137_PROTECTED_PATHS,
          "packages/spec/src/index.ts",
        ],
      }),
    ).toThrow(/exact protected path inventory/u)
  })

  it("rejects raw-byte and mode drift without restoring either path", () => {
    const { root, artifactPath } = fixture()
    writeV137ProtectedBaseline({ observedRepoRoot: root, artifactPath })
    const configPath = path.join(root, ".planning", "config.json")
    const original = readFileSync(configPath)
    writeFileSync(configPath, Buffer.concat([original, Buffer.from(" ")]))
    expect(() =>
      checkV137ProtectedBaseline({ observedRepoRoot: root, artifactPath }),
    ).toThrow(/protected working-tree state drifted/iu)
    expect(readFileSync(configPath)).toEqual(
      Buffer.concat([original, Buffer.from(" ")]),
    )

    writeFileSync(configPath, original)
    chmodSync(configPath, 0o600)
    expect(() =>
      checkV137ProtectedBaseline({ observedRepoRoot: root, artifactPath }),
    ).toThrow(/protected working-tree state drifted/iu)
    expect(statSync(configPath).mode & 0o777).toBe(0o600)
  })

  it("detects staged or unstaged diff-only drift even when raw bytes stay fixed", () => {
    const { root, artifactPath } = fixture()
    const configPath = path.join(root, ".planning", "config.json")
    writeFileSync(configPath, '{"index":"B"}\n')
    git(root, ["add", "--", ".planning/config.json"])
    writeFileSync(configPath, '{"working":"C"}\n')
    writeV137ProtectedBaseline({ observedRepoRoot: root, artifactPath })
    const rawBefore = readFileSync(configPath)
    git(root, ["add", "--", ".planning/config.json"])
    expect(readFileSync(configPath)).toEqual(rawBefore)
    expect(() =>
      checkV137ProtectedBaseline({ observedRepoRoot: root, artifactPath }),
    ).toThrow(/protected working-tree state drifted/iu)
  })

  it("is write-once, allows only identical rewrites, and self-hashes the baseline", () => {
    const { root, artifactPath } = fixture()
    const first = writeV137ProtectedBaseline({
      observedRepoRoot: root,
      artifactPath,
    })
    const bytes = readFileSync(artifactPath)
    expect(writeV137ProtectedBaseline({ observedRepoRoot: root, artifactPath })).toEqual(
      first,
    )
    expect(readFileSync(artifactPath)).toEqual(bytes)

    writeFileSync(path.join(root, ".planning", "config.json"), '{"changed":true}\n')
    expect(() =>
      writeV137ProtectedBaseline({ observedRepoRoot: root, artifactPath }),
    ).toThrow(/refusing to overwrite/u)
    expect(readFileSync(artifactPath)).toEqual(bytes)

    const attacked = JSON.parse(bytes.toString("utf8")) as {
      baselineSha256: string
      paths: Array<{ raw: { byteLength: number } }>
    }
    attacked.paths[0]!.raw.byteLength += 1
    writeFileSync(artifactPath, `${JSON.stringify(attacked, null, 2)}\n`)
    expect(() =>
      checkV137ProtectedBaseline({ observedRepoRoot: root, artifactPath }),
    ).toThrow(/self-hash/u)
  })

  it("stores exact binary diff bytes as Base64 with matching hashes and lengths", () => {
    const { root } = fixture()
    writeFileSync(path.join(root, ".planning", "config.json"), '{"changed":true}\n')
    const baseline = captureV137ProtectedBaseline({ observedRepoRoot: root })
    const diff = baseline.paths[0]!.unstagedDiff
    const bytes = Buffer.from(diff.bytesBase64, "base64")
    expect(bytes.byteLength).toBe(diff.byteLength)
    expect(`sha256:${sha256(bytes)}`).toBe(diff.sha256)
    expect(bytes.toString("utf8")).toContain(
      "diff --git a/.planning/config.json b/.planning/config.json",
    )
  })
})
