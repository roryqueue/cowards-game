import {
  cpSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { execFileSync } from "node:child_process"
import { describe, expect, it } from "vitest"
import {
  checkV136HistoricalProof,
  parseV136HistoricalProofDispatch,
  type V136HistoricalProofDispatch,
} from "./check-v1-36-historical-proof.js"

const root = process.cwd()
const manifestPath = path.join(
  root,
  ".planning/artifacts/v1.37-v1.36-historical-proof-dispatch.json",
)

const manifest = (): V136HistoricalProofDispatch =>
  parseV136HistoricalProofDispatch(
    JSON.parse(readFileSync(manifestPath, "utf8")) as unknown,
  )

describe("version-pinned v1.36 historical proof", () => {
  it("validates the eight working artifacts only against the annotated release snapshot", async () => {
    const before = manifest().artifacts.map((entry) => ({
      path: entry.path,
      bytes: readFileSync(path.join(root, entry.path)),
      mtimeMs: statSync(path.join(root, entry.path)).mtimeMs,
    }))
    const result = await checkV136HistoricalProof({ repoRoot: root })
    expect(result.findings).toEqual([])
    expect(result.artifactCount).toBe(8)
    expect(result.sourceCount).toBe(11)
    expect(result.archivedValidators).toEqual([
      "competition-policy",
      "service-proof",
      "competition-boundaries",
      "final-proof",
    ])
    for (const entry of before) {
      expect(readFileSync(path.join(root, entry.path))).toEqual(entry.bytes)
      expect(statSync(path.join(root, entry.path)).mtimeMs).toBe(entry.mtimeMs)
    }
  }, 120_000)

  it("does not make v1.36 validity depend on current monitor source", async () => {
    const current = readFileSync(
      path.join(root, "scripts/check-boundary-monitors.ts"),
    )
    const archived = execFileSync(
      "git",
      [
        "show",
        "38f4a83db9298502c12db44cd66d026878803d20:scripts/check-boundary-monitors.ts",
      ],
      { cwd: root },
    )
    expect(current).not.toEqual(archived)
    expect(
      (await checkV136HistoricalProof({
        repoRoot: root,
        executeArchivedValidators: false,
      })).findings,
    ).toEqual([])
  })

  it.each([
    ["tag object", (value: V136HistoricalProofDispatch) => ({
      ...value,
      tag: { ...value.tag, object: "0".repeat(40) },
    })],
    ["source hash", (value: V136HistoricalProofDispatch) => ({
      ...value,
      sources: value.sources.map((entry, index) =>
        index === 0 ? { ...entry, sha256: "0".repeat(64) } : entry,
      ),
    })],
    ["dropped artifact", (value: V136HistoricalProofDispatch) => ({
      ...value,
      artifacts: value.artifacts.slice(1),
    })],
    ["dropped source", (value: V136HistoricalProofDispatch) => ({
      ...value,
      sources: value.sources.slice(1),
    })],
    ["write mode", (value: V136HistoricalProofDispatch) => ({
      ...value,
      validation: { ...value.validation, writeModesForbidden: false },
    })],
  ])("rejects %s tampering", async (_label, mutate) => {
    const result = await checkV136HistoricalProof({
      repoRoot: root,
      manifest: mutate(manifest()),
      executeArchivedValidators: false,
    })
    expect(result.findings.length).toBeGreaterThan(0)
  })

  it("rejects checked-out artifact tampering without rewriting it", async () => {
    const workingRoot = mkdtempSync(path.join(tmpdir(), "cowards-v136-working-"))
    try {
      for (const entry of manifest().artifacts) {
        const target = path.join(workingRoot, entry.path)
        cpSync(path.join(root, entry.path), target, { recursive: false })
      }
      const target = path.join(workingRoot, manifest().artifacts[0]!.path)
      writeFileSync(target, `${readFileSync(target, "utf8")}\nTAMPERED\n`)
      const before = readFileSync(target)
      const result = await checkV136HistoricalProof({
        repoRoot: root,
        workingRoot,
        executeArchivedValidators: false,
      })
      expect(result.findings.map((finding) => finding.code)).toContain(
        "WORKING_ARTIFACT_MISMATCH",
      )
      expect(readFileSync(target)).toEqual(before)
    } finally {
      rmSync(workingRoot, { recursive: true, force: true })
    }
  })
})
