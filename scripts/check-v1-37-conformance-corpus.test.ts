/// <reference types="node" />

import { createHash } from "node:crypto"
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { describe, expect, it } from "vitest"
// eslint-disable-next-line no-restricted-imports -- repo-root checker test exercises the exact golden source contract.
import {
  V1_37_CONFORMANCE_ACTIVE_REGISTRY,
  V1_37_CONFORMANCE_CORPUS_ROOT,
  computeV137ConformanceCorpusRoot,
  type V137ConformanceCorpus,
  type V137ConformanceRegistry,
} from "../packages/golden/src/v1-37-conformance-corpus.js"
// eslint-disable-next-line no-restricted-imports -- checker tests the independent literal approval pin.
import { V1_37_CONFORMANCE_CORPUS_REVIEWED_PIN } from "../packages/golden/src/v1-37-conformance-corpus-pin.js"
import {
  assertV137ConformanceCheckArgs,
  checkCommittedV137ConformanceCorpus,
} from "./check-v1-37-conformance-corpus.js"

const sha256 = (value: Uint8Array | string): string =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`
const renderJson = (value: unknown): string =>
  `${JSON.stringify(value, null, 2)}\n`

describe("v1.37 committed corpus checker", () => {
  it("checks exact committed bytes and root without writing", () => {
    const paths = [
      "packages/golden/src/fixtures/v1-37-conformance-corpus/registry.json",
      V1_37_CONFORMANCE_ACTIVE_REGISTRY.path,
      V1_37_CONFORMANCE_CORPUS_REVIEWED_PIN.independentReviewPath,
    ]
    const before = paths.map((filePath) => sha256(readFileSync(filePath)))
    expect(checkCommittedV137ConformanceCorpus()).toEqual([])
    expect(paths.map((filePath) => sha256(readFileSync(filePath)))).toEqual(
      before,
    )
    expect(before).toEqual([
      V1_37_CONFORMANCE_CORPUS_REVIEWED_PIN.registryFileSha256,
      V1_37_CONFORMANCE_CORPUS_REVIEWED_PIN.corpusFileSha256,
      V1_37_CONFORMANCE_CORPUS_REVIEWED_PIN.independentReviewFileSha256,
    ])
  })

  it("rejects coordinated corpus and registry mutation against the reviewed pin", () => {
    const root = mkdtempSync(path.join(tmpdir(), "cowards-v137-pin-check-"))
    try {
      const registryPath = path.join(
        root,
        "packages/golden/src/fixtures/v1-37-conformance-corpus/registry.json",
      )
      const corpusPath = path.join(root, V1_37_CONFORMANCE_ACTIVE_REGISTRY.path)
      mkdirSync(path.dirname(registryPath), { recursive: true })
      mkdirSync(path.dirname(corpusPath), { recursive: true })
      const corpus = JSON.parse(
        readFileSync(V1_37_CONFORMANCE_ACTIVE_REGISTRY.path, "utf8"),
      ) as V137ConformanceCorpus
      corpus.cases[0]!.expectation.reasonCode = "REVIEWED_PIN_MUTATION"
      corpus.corpusRootSha256 = computeV137ConformanceCorpusRoot(corpus)
      const corpusBytes = renderJson(corpus)
      const registry: V137ConformanceRegistry = {
        ...V1_37_CONFORMANCE_ACTIVE_REGISTRY,
        corpusRootSha256: corpus.corpusRootSha256,
        corpusFileSha256: sha256(corpusBytes),
      }
      writeFileSync(corpusPath, corpusBytes)
      writeFileSync(registryPath, renderJson(registry))

      const errors = checkCommittedV137ConformanceCorpus({ root })
      expect(errors).toContain(
        "active registry exact bytes do not match reviewed pin",
      )
      expect(errors).toContain(
        "active corpus exact bytes do not match reviewed pin",
      )
      expect(errors).toContain(
        `active corpus root mismatch: expected ${V1_37_CONFORMANCE_CORPUS_ROOT}, got ${corpus.corpusRootSha256}`,
      )
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
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
