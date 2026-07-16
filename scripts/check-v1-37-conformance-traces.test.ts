/// <reference types="node" />

import {
  cpSync,
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
// eslint-disable-next-line no-restricted-imports -- repo-root checker test exercises the exact golden source contract.
import {
  V1_37_CONFORMANCE_CORPUS,
  V1_37_CONFORMANCE_CORPUS_ROOT,
} from "../packages/golden/src/v1-37-conformance-corpus.js"
import {
  assertV137ConformanceTraceCheckArgs,
  checkV137ConformanceTraceCandidate,
} from "./check-v1-37-conformance-traces.js"
import { generateV137ConformanceTraceCandidate } from "./generate-v1-37-conformance-traces.js"

const roots: string[] = []
const temporaryRoot = (): string => {
  const root = mkdtempSync(path.join(tmpdir(), "cowards-v137-trace-check-"))
  roots.push(root)
  return root
}
const render = (value: unknown): string => `${JSON.stringify(value, null, 2)}\n`

afterEach(() => {
  while (roots.length > 0) {
    rmSync(roots.pop()!, { recursive: true, force: true })
  }
})

const candidate = (): string => {
  const directory = path.join(temporaryRoot(), "candidate")
  generateV137ConformanceTraceCandidate({
    candidateVersion: "v1.37-conformance-trace-v2",
    candidateDirectory: directory,
  })
  return directory
}

describe("v1.37 conformance trace candidate checker", () => {
  it("is read-only and accepts the complete exact candidate", () => {
    const directory = candidate()
    const before = readFileSync(path.join(directory, "manifest.json"))
    expect(
      checkV137ConformanceTraceCandidate({ candidateDirectory: directory }),
    ).toEqual([])
    expect(readFileSync(path.join(directory, "manifest.json"))).toEqual(before)
    expect(
      assertV137ConformanceTraceCheckArgs([
        `--candidate-dir=${directory}`,
        "--check",
      ]),
    ).toEqual({ candidateDirectory: directory, check: true })
    for (const args of [
      [],
      ["--write"],
      [`--candidate-dir=${directory}`, "--update"],
      [`--candidate-dir=${directory}`, "--check", "--write"],
    ]) {
      expect(() => assertV137ConformanceTraceCheckArgs(args)).toThrow(
        "READ_ONLY_CHECK_ARGUMENTS",
      )
    }
  }, 30_000)

  it("rejects missing, extra, reordered, corpus-substituted, and diff-mutated evidence", () => {
    const mutations: Array<(directory: string) => void> = [
      (directory) => {
        rmSync(
          path.join(
            directory,
            "traces",
            `${V1_37_CONFORMANCE_CORPUS.cases[0]!.id}.json`,
          ),
        )
      },
      (directory) => {
        cpSync(
          path.join(
            directory,
            "traces",
            `${V1_37_CONFORMANCE_CORPUS.cases[0]!.id}.json`,
          ),
          path.join(directory, "traces", "extra-case.json"),
        )
      },
      (directory) => {
        const manifestPath = path.join(directory, "manifest.json")
        const manifest = JSON.parse(readFileSync(manifestPath, "utf8"))
        manifest.cases.reverse()
        writeFileSync(manifestPath, render(manifest))
      },
      (directory) => {
        const manifestPath = path.join(directory, "manifest.json")
        const manifest = JSON.parse(readFileSync(manifestPath, "utf8"))
        manifest.corpusRootSha256 = V1_37_CONFORMANCE_CORPUS_ROOT.replace(
          /.$/u,
          "0",
        )
        writeFileSync(manifestPath, render(manifest))
      },
      (directory) => {
        const diffPath = path.join(directory, "semantic-diff.json")
        const diff = JSON.parse(readFileSync(diffPath, "utf8"))
        diff.candidateRootSha256 = `sha256:${"f".repeat(64)}`
        writeFileSync(diffPath, render(diff))
      },
    ]

    for (const mutate of mutations) {
      const directory = candidate()
      mutate(directory)
      expect(
        checkV137ConformanceTraceCandidate({ candidateDirectory: directory }),
      ).not.toEqual([])
    }
  }, 60_000)

  it("rejects dangling symlink and non-regular trace entries", () => {
    const dangling = candidate()
    const danglingPath = path.join(
      dangling,
      "traces",
      `${V1_37_CONFORMANCE_CORPUS.cases[0]!.id}.json`,
    )
    rmSync(danglingPath)
    symlinkSync(path.join(dangling, "missing.json"), danglingPath)
    expect(
      checkV137ConformanceTraceCandidate({ candidateDirectory: dangling }),
    ).not.toEqual([])

    const nonRegular = candidate()
    const nonRegularPath = path.join(
      nonRegular,
      "traces",
      `${V1_37_CONFORMANCE_CORPUS.cases[0]!.id}.json`,
    )
    rmSync(nonRegularPath)
    mkdirSync(nonRegularPath)
    expect(
      checkV137ConformanceTraceCandidate({ candidateDirectory: nonRegular }),
    ).not.toEqual([])
  }, 60_000)
})
