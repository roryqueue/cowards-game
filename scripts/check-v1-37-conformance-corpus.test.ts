/// <reference types="node" />

import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import {
  V1_37_CONFORMANCE_ACTIVE_REGISTRY,
  V1_37_CONFORMANCE_CORPUS_ROOT,
} from "../packages/golden/src/v1-37-conformance-corpus.js"
import {
  assertV137ConformanceCheckArgs,
  checkCommittedV137ConformanceCorpus,
} from "./check-v1-37-conformance-corpus.js"

const sha256 = (path: string): string =>
  createHash("sha256").update(readFileSync(path)).digest("hex")

describe("v1.37 committed corpus checker", () => {
  it("checks exact committed bytes and root without writing", () => {
    const paths = [
      "packages/golden/src/fixtures/v1-37-conformance-corpus/registry.json",
      V1_37_CONFORMANCE_ACTIVE_REGISTRY.path,
    ]
    const before = paths.map(sha256)
    expect(checkCommittedV137ConformanceCorpus()).toEqual([])
    expect(paths.map(sha256)).toEqual(before)
  })

  it("reports exact root and byte drift", () => {
    expect(
      checkCommittedV137ConformanceCorpus({
        expectedCorpusRootSha256: `sha256:${"f".repeat(64)}`,
      }),
    ).toContain(
      `active corpus root mismatch: expected sha256:${"f".repeat(64)}, got ${V1_37_CONFORMANCE_CORPUS_ROOT}`,
    )
  })

  it("accepts only pure --check mode and rejects overwrite flags", () => {
    expect(assertV137ConformanceCheckArgs(["--check"])).toEqual({
      check: true,
    })
    for (const args of [
      [],
      ["--write"],
      ["--update"],
      ["--check", "--write"],
      ["--check", "--version", "v2"],
    ]) {
      expect(() => assertV137ConformanceCheckArgs(args)).toThrow(
        "READ_ONLY_CHECK_ARGUMENTS",
      )
    }
  })
})
