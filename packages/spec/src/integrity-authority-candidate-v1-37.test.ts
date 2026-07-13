import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import {
  CANONICAL_COMPATIBILITY_TUPLES,
  resolveCanonicalCompatibilityTuple,
} from "./integrity-authority.js"
import {
  CURRENT_AUTHORITY_BYTE_BASELINE,
  INACTIVE_V1_37_KERNEL_INTEGRITY_CANDIDATE,
  assertInactiveV137KernelIntegrityCandidate,
  cloneInactiveV137KernelIntegrityCandidate,
} from "./integrity-authority-candidate-v1-37.js"
import {
  COMPATIBILITY_VERSIONS,
  STRATEGY_RUNTIME_ABI_VERSION,
} from "./versions.js"

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
)

const sha256File = (relativePath: string): string =>
  createHash("sha256")
    .update(readFileSync(path.join(repoRoot, relativePath)))
    .digest("hex")

describe("inactive v1.37 kernel integrity candidate", () => {
  it("mints engine-kernel, Chronicle/current-event, and semantic-arena components together", () => {
    const candidate = INACTIVE_V1_37_KERNEL_INTEGRITY_CANDIDATE
    expect(candidate.status).toBe("inactive-candidate")
    expect(candidate.trustState).toBe("untrusted-non-publishable")
    expect(candidate.candidateTuple).toEqual({
      rules: COMPATIBILITY_VERSIONS.spec,
      engine: "engine-kernel-v1.37-candidate-1",
      runtimeAbi: STRATEGY_RUNTIME_ABI_VERSION,
      chronicle: "chronicle-recorder-current-events-v1.37-candidate-1",
      arenaCatalog: "semantic-arena-catalog-v1.37-candidate-1",
      setPolicy: "canonical-set-policy-v1.4",
    })
    expect(candidate.authorityOwners).toMatchObject({
      engineKernel: { packageName: "@cowards/engine", symbol: "runMatch" },
      chronicleRecorder: {
        packageName: "@cowards/replay",
        symbol: "recordCanonicalMatchTransitions",
      },
      currentEventValidator: {
        packageName: "@cowards/replay",
        symbol: "validateCurrentChronicle",
      },
      semanticArenaValidator: {
        packageName: "@cowards/spec",
        symbol: "validateSemanticArena",
      },
    })
    expect(candidate.eventVocabulary.removedFromCandidateCurrent).toEqual([
      "PUSH_ATTEMPTED",
    ])
    expect(candidate.eventVocabulary.candidateCurrent).not.toContain(
      "PUSH_ATTEMPTED",
    )
    expect(JSON.stringify(candidate)).not.toMatch(/HOLD|END_ACTIVATION/u)
  })

  it("cannot resolve as current and is not exported by the spec barrel", () => {
    const candidate = INACTIVE_V1_37_KERNEL_INTEGRITY_CANDIDATE
    expect(
      resolveCanonicalCompatibilityTuple({
        tupleId: candidate.candidateTupleId,
        tuple: candidate.candidateTuple,
      }),
    ).toBeUndefined()
    expect(candidate.candidateTupleId).not.toBe(
      CANONICAL_COMPATIBILITY_TUPLES[0]?.tupleId,
    )
    expect(
      readFileSync(path.join(repoRoot, "packages/spec/src/index.ts"), "utf8"),
    ).not.toContain("integrity-authority-candidate-v1-37")
    expect(Object.values(candidate.activation)).toEqual([
      false,
      false,
      false,
      false,
      false,
      false,
    ])
  })

  it("rejects missing, mixed, duplicate, exported-as-current, and partial activation values", () => {
    const valid = cloneInactiveV137KernelIntegrityCandidate()
    expect(assertInactiveV137KernelIntegrityCandidate(valid)).toEqual(
      INACTIVE_V1_37_KERNEL_INTEGRITY_CANDIDATE,
    )

    const invalid: unknown[] = [
      { ...valid, candidateTupleId: undefined },
      {
        ...valid,
        candidateTuple: {
          ...valid.candidateTuple,
          chronicle: CANONICAL_COMPATIBILITY_TUPLES[0]!.tuple.chronicle,
        },
      },
      {
        ...valid,
        candidateTuple: {
          ...valid.candidateTuple,
          arenaCatalog: valid.candidateTuple.engine,
        },
      },
      { ...valid, status: "current" },
      {
        ...valid,
        activation: { ...valid.activation, currentTuplePointer: true },
      },
      {
        ...valid,
        activation: { ...valid.activation, publication: true },
      },
      {
        ...valid,
        activation: { ...valid.activation, countedExecution: true },
      },
      {
        ...valid,
        candidateTuple: {
          rules: valid.candidateTuple.rules,
          engine: valid.candidateTuple.engine,
        },
      },
    ]

    for (const value of invalid) {
      expect(() => assertInactiveV137KernelIntegrityCandidate(value)).toThrow(
        /inactive v1\.37 kernel integrity candidate/iu,
      )
    }
  })

  it("locks every current version, registry, barrel, and authority artifact byte", () => {
    expect(
      Object.fromEntries(
        Object.keys(CURRENT_AUTHORITY_BYTE_BASELINE).map((relativePath) => [
          relativePath,
          sha256File(relativePath),
        ]),
      ),
    ).toEqual(CURRENT_AUTHORITY_BYTE_BASELINE)
  })
})
