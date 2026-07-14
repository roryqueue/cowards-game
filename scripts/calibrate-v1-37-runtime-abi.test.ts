import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs"
import { createHash } from "node:crypto"
import { execFileSync } from "node:child_process"
import { tmpdir } from "node:os"
import path from "node:path"
import { pathToFileURL } from "node:url"
import { afterEach, describe, expect, it } from "vitest"

const repoRoot = path.resolve(import.meta.dirname, "..")
const subjectPath = path.join(repoRoot, "scripts/calibrate-v1-37-runtime-abi.ts")
const manifestRelativePath =
  "packages/spec/artifacts/runtime-abi-v1.17-calibration-inputs.json"
const tempRoots: string[] = []

type Subject = typeof import("./calibrate-v1-37-runtime-abi.ts")

const subject = async (): Promise<Subject> => {
  expect(
    existsSync(subjectPath),
    "calibration implementation must exist after the RED gate",
  ).toBe(true)
  return import(pathToFileURL(subjectPath).href) as Promise<Subject>
}

const sha256 = (bytes: Uint8Array): string =>
  createHash("sha256").update(bytes).digest("hex")

const createTempRepo = (): string => {
  const root = mkdtempSync(path.join(tmpdir(), "cowards-runtime-abi-calibration-"))
  tempRoots.push(root)
  execFileSync("git", ["init", "--quiet"], { cwd: root })
  return root
}

const writeTracked = (root: string, relativePath: string, contents: string): void => {
  const target = path.join(root, relativePath)
  mkdirSync(path.dirname(target), { recursive: true })
  writeFileSync(target, contents)
  execFileSync("git", ["add", "--", relativePath], { cwd: root })
}

const writeManifest = (
  root: string,
  entries: readonly Record<string, unknown>[],
): string => {
  const target = path.join(root, manifestRelativePath)
  mkdirSync(path.dirname(target), { recursive: true })
  writeFileSync(
    target,
    `${JSON.stringify({
      schemaVersion: "runtime-abi-v1.17-calibration-inputs-v1",
      purpose: "test",
      privacy: "internal-build-evidence-no-private-payload-copy",
      denylist: [
        ".git/**",
        "node_modules/**",
        ".next/**",
        "dist/**",
        "coverage/**",
        "tmp/**",
        ".env*",
        ".planning/config.json",
        "CowardsGameSpec_Full_Consolidated_v1.md",
        ".planning/phases/**",
        ".planning/artifacts/v1.37-runtime-abi-calibration.json",
        ".planning/artifacts/v1.37-runtime-abi-calibration.md",
        "packages/spec/artifacts/runtime-abi-v1.17-contract.json",
        "**/*.log",
        "**/logs/**",
        "**/private/**",
      ],
      inputs: entries,
    })}\n`,
  )
  execFileSync("git", ["add", "--", manifestRelativePath], { cwd: root })
  return target
}

const validEntry = (relativePath: string, contents: string) => ({
  path: relativePath,
  sha256: sha256(Buffer.from(contents)),
  byteLength: Buffer.byteLength(contents),
  classification: "current-valid-fixture",
  inclusionReason: "Focused current fixture for the calibration test.",
  expectedLimitDomains: ["canonical-payload"],
})

afterEach(() => {
  for (const root of tempRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true })
  }
})

describe("runtime ABI v1.17 calibration input boundary", () => {
  it("accepts the committed closed manifest and names its exact hash", async () => {
    const calibration = await subject()
    const manifest = calibration.loadCalibrationInputManifest(repoRoot)
    const raw = readFileSync(path.join(repoRoot, manifestRelativePath))

    expect(manifest.sha256).toBe(sha256(raw))
    expect(manifest.inputs).toHaveLength(13)
    expect(
      manifest.inputs.every((entry) =>
        [
          "current-valid-contract",
          "current-valid-fixture",
          "historical-valid-control",
          "hostile-negative-probe",
        ].includes(entry.classification),
      ),
    ).toBe(true)
  })

  it.each([
    ["missing", "missing-input"],
    ["untracked", "untracked-input"],
    ["hash drift", "hash-mismatch"],
    ["length drift", "length-mismatch"],
    ["unclassified", "invalid-classification"],
  ])("rejects %s entries with a typed code", async (mutation, expectedCode) => {
    const calibration = await subject()
    const root = createTempRepo()
    const file = "fixtures/current.json"
    const contents = '{"ok":true}\n'
    if (mutation !== "missing") writeTracked(root, file, contents)
    const entry: Record<string, unknown> = validEntry(file, contents)
    if (mutation === "untracked") {
      execFileSync("git", ["rm", "--cached", "--quiet", "--", file], { cwd: root })
    }
    if (mutation === "hash drift") entry.sha256 = "0".repeat(64)
    if (mutation === "length drift") entry.byteLength = 1
    if (mutation === "unclassified") entry.classification = "convenient-input"
    writeManifest(root, [entry])

    expect(() => calibration.loadCalibrationInputManifest(root)).toThrow(
      new RegExp(expectedCode),
    )
  })

  it("rejects duplicate, out-of-repository, symlinked, and denylisted inputs", async () => {
    const calibration = await subject()
    const scenarios = ["duplicate", "outside", "symlink", "denylisted"] as const
    for (const scenario of scenarios) {
      const root = createTempRepo()
      const contents = '{"ok":true}\n'
      let file = "fixtures/current.json"
      writeTracked(root, file, contents)
      let entries: Record<string, unknown>[] = [validEntry(file, contents)]
      if (scenario === "duplicate") entries.push(validEntry(file, contents))
      if (scenario === "outside") {
        entries = [{ ...entries[0], path: "../outside.json" }]
      }
      if (scenario === "symlink") {
        const link = "fixtures/link.json"
        symlinkSync("current.json", path.join(root, link))
        execFileSync("git", ["add", "--", link], { cwd: root })
        expect(lstatSync(path.join(root, link)).isSymbolicLink()).toBe(true)
        entries = [validEntry(link, contents)]
      }
      if (scenario === "denylisted") {
        file = ".planning/config.json"
        writeTracked(root, file, contents)
        entries = [validEntry(file, contents)]
      }
      writeManifest(root, entries)

      expect(() => calibration.loadCalibrationInputManifest(root)).toThrow()
    }
  })
})

describe("runtime ABI v1.17 limit probes", () => {
  it("records N-1, N, and N+1 for every frozen ceiling", async () => {
    const calibration = await subject()
    const receipt = calibration.evaluateCalibration(repoRoot)

    for (const [limit, probes] of Object.entries(receipt.probes)) {
      expect(probes.map((probe) => probe.offset), limit).toEqual([-1, 0, 1])
      expect(probes[0]?.result.kind, limit).toBe("accepted")
      expect(probes[1]?.result.kind, limit).toBe("accepted")
      expect(probes[2]?.result.kind, limit).toBe("rejected")
    }
  })

  it("returns typed depth rejection for 3,000 levels instead of RangeError", async () => {
    const calibration = await subject()
    const result = calibration.probeJsonText(
      `${"[".repeat(3_000)}null${"]".repeat(3_000)}`,
      calibration.RUNTIME_ABI_V1_17_CALIBRATION_LIMITS,
    )

    expect(result).toEqual({
      kind: "rejected",
      code: "MAX_DEPTH_EXCEEDED",
      limit: 64,
      observed: 65,
    })
  })

  it("uses only current-valid rows to establish observed maxima", async () => {
    const calibration = await subject()
    const receipt = calibration.evaluateCalibration(repoRoot)

    expect(receipt.maximaSources.every((row) =>
      row.classification === "current-valid-contract" ||
      row.classification === "current-valid-fixture",
    )).toBe(true)
    expect(receipt.historicalControls.length).toBeGreaterThan(0)
    expect(receipt.hostileProbes.length).toBeGreaterThan(0)
  })

  it("renders synchronized JSON and Markdown with explicit byte units", async () => {
    const calibration = await subject()
    const receipt = calibration.evaluateCalibration(repoRoot)
    const json = calibration.renderCalibrationJson(receipt)
    const markdown = calibration.renderCalibrationMarkdown(receipt)

    expect(json).toContain(receipt.inputManifest.sha256)
    expect(markdown).toContain(receipt.inputManifest.sha256)
    for (const unit of [
      "raw-utf8-bytes",
      "canonical-payload-bytes",
      "decoded-string-utf8-bytes",
      "transport-frame-bytes",
    ]) {
      expect(json).toContain(unit)
      expect(markdown).toContain(unit)
    }
  })
})
