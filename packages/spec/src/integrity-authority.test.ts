import { Buffer } from "node:buffer"
import { spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import {
  CANONICAL_AUTHORITY_DOMAINS,
  CANONICAL_AUTHORITY_REGISTRY,
  CANONICAL_COMPATIBILITY_TUPLES,
  CANONICAL_COMPATIBILITY_TUPLE_IDENTITY_PROFILES,
  CANDIDATE_RUNTIME_V117_SEMANTIC_TUPLE,
  CANDIDATE_RUNTIME_V117_SEMANTIC_TUPLE_ID,
  CANDIDATE_RUNTIME_V117_SEMANTIC_TUPLE_RECORD,
  CANDIDATE_RUNTIME_V119_SEMANTIC_TUPLE,
  CANDIDATE_RUNTIME_V119_SEMANTIC_TUPLE_ID,
  CANDIDATE_RUNTIME_V119_SEMANTIC_TUPLE_RECORD,
  CURRENT_CANONICAL_COMPATIBILITY_TUPLE_ID,
  CURRENT_CANONICAL_COMPATIBILITY_TUPLE_RECORD,
  HISTORICAL_RUNTIME_V114_SEMANTIC_TUPLE_ID,
  REGISTERED_CANONICAL_COMPATIBILITY_TUPLES,
  VERSIONED_RUNTIME_V114_SEMANTIC_TUPLE_RECORD,
  VERSIONED_RUNTIME_V117_SEMANTIC_TUPLE_RECORD,
  VERSIONED_RUNTIME_V119_SEMANTIC_TUPLE_RECORD,
  assertCanonicalAuthorityRegistry,
  classifyCanonicalCompatibilityTupleIdAgainstCurrent,
  encodeCanonicalCompatibilityTuple,
  hashCanonicalCompatibilityTuple,
  prepareCanonicalCompatibilityTupleRecord,
  resolveCandidateRuntimeV117SemanticTuple,
  resolveCandidateRuntimeV119SemanticTuple,
  resolveCanonicalCompatibilityTuple,
  resolveHistoricalRuntimeV114SemanticTuple,
  resolveRegisteredCanonicalCompatibilityTuple,
  type CanonicalCompatibilityTuple,
} from "./integrity-authority.js"
import {
  CANDIDATE_CANONICAL_COMPATIBILITY_TUPLE_KEY_V1_19,
  CURRENT_CANONICAL_COMPATIBILITY_TUPLE_KEY,
  STRATEGY_RUNTIME_ABI_VERSION,
  STRATEGY_RUNTIME_ABI_VERSION_V1_19,
} from "./versions.js"
import {
  CURRENT_SEMANTIC_AUTHORITY_SOURCE,
  type CurrentSemanticAuthoritySource,
} from "./current-semantic-authority-source.js"
import {
  CURRENT_SEMANTIC_ARENA_CATALOG_VERSION,
  CURRENT_SEMANTIC_AUTHORITY_GENERATED,
  CURRENT_SEMANTIC_AUTHORITY_KEY,
  CURRENT_SEMANTIC_AUTHORITY_OUTPUT_SHA256,
  CURRENT_SEMANTIC_AUTHORITY_SOURCE_SHA256,
  CURRENT_SEMANTIC_CONFORMANCE_CERTIFICATE_VERSION,
  CURRENT_SEMANTIC_RUNTIME_ABI_VERSION,
  CURRENT_SEMANTIC_SET_POLICY_VERSION,
  CURRENT_SEMANTIC_TUPLE,
  CURRENT_SEMANTIC_TUPLE_ID,
  resolveCurrentSemanticAuthoritySelection,
} from "./current-semantic-authority-generated.js"

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
)
const authorityArtifactPath =
  "packages/spec/artifacts/v1.37-integrity-authority.json"
const hashVectorsArtifactPath =
  "packages/spec/artifacts/v1.37-integrity-authority-hash-vectors.json"
const successorAuthorityArtifactPath =
  "packages/spec/artifacts/v1.37-integrity-authority-v1.17.json"
const successorHashVectorsArtifactPath =
  "packages/spec/artifacts/v1.37-integrity-authority-v1.17-hash-vectors.json"

const cloneTuple = (
  tuple: CanonicalCompatibilityTuple,
): CanonicalCompatibilityTuple => ({ ...tuple })

describe("v1.37 canonical integrity authority", () => {
  it("registers exactly one distinct owner for every canonical authority domain", () => {
    expect(CANONICAL_AUTHORITY_REGISTRY.map(({ domain }) => domain)).toEqual(
      CANONICAL_AUTHORITY_DOMAINS,
    )
    expect(
      new Set(
        CANONICAL_AUTHORITY_REGISTRY.map(
          ({ packageName, symbol }) => `${packageName}#${symbol}`,
        ),
      ).size,
    ).toBe(CANONICAL_AUTHORITY_DOMAINS.length)
    expect(() =>
      assertCanonicalAuthorityRegistry(CANONICAL_AUTHORITY_REGISTRY),
    ).not.toThrow()
    expect(() =>
      assertCanonicalAuthorityRegistry([
        ...CANONICAL_AUTHORITY_REGISTRY,
        CANONICAL_AUTHORITY_REGISTRY[0]!,
      ]),
    ).toThrow(/duplicate authority domain/i)
    expect(() =>
      assertCanonicalAuthorityRegistry([
        ...CANONICAL_AUTHORITY_REGISTRY.slice(0, -1),
        {
          ...CANONICAL_AUTHORITY_REGISTRY.at(-1)!,
          packageName: CANONICAL_AUTHORITY_REGISTRY[0]!.packageName,
          symbol: CANONICAL_AUTHORITY_REGISTRY[0]!.symbol,
        },
      ]),
    ).toThrow(/duplicate authority owner/i)
  })

  it("encodes exactly six components in fixed order and hashes every mutation differently", () => {
    const registered = CANONICAL_COMPATIBILITY_TUPLES[0]!
    const fields = [
      "rules",
      "engine",
      "runtimeAbi",
      "chronicle",
      "arenaCatalog",
      "setPolicy",
    ] as const

    expect(Object.keys(registered.tuple)).toEqual(fields)
    const encoded = encodeCanonicalCompatibilityTuple(registered.tuple)
    expect(encoded).toBeInstanceOf(Uint8Array)
    expect(new TextDecoder().decode(encoded)).toContain(
      "cowards-game:canonical-compatibility-tuple:v1\0",
    )

    for (const field of fields) {
      const changed = cloneTuple(registered.tuple)
      changed[field] = `${changed[field]}-changed`
      expect(encodeCanonicalCompatibilityTuple(changed)).not.toEqual(encoded)
      expect(hashCanonicalCompatibilityTuple(changed)).not.toBe(
        registered.sha256,
      )
    }
  })

  it("selects the exact current identity-domain tuple without changing v1.14 history", () => {
    const selectedV117 =
      String(STRATEGY_RUNTIME_ABI_VERSION) === "strategy-runtime-abi-v1.17"
    const expectedCurrent = selectedV117
      ? VERSIONED_RUNTIME_V117_SEMANTIC_TUPLE_RECORD
      : VERSIONED_RUNTIME_V114_SEMANTIC_TUPLE_RECORD

    expect(CANONICAL_COMPATIBILITY_TUPLES).toHaveLength(1)
    expect(CURRENT_CANONICAL_COMPATIBILITY_TUPLE_KEY).toBe(
      selectedV117 ? "runtime-v1.17" : "runtime-v1.14",
    )
    expect(CANONICAL_COMPATIBILITY_TUPLES[0]).toEqual(expectedCurrent)
    expect(CURRENT_CANONICAL_COMPATIBILITY_TUPLE_RECORD).toEqual(
      expectedCurrent,
    )
    expect(CURRENT_CANONICAL_COMPATIBILITY_TUPLE_ID).toBe(
      expectedCurrent.tupleId,
    )
    expect(HISTORICAL_RUNTIME_V114_SEMANTIC_TUPLE_ID).toBe(
      "sha256:922a6857fdbc8354b744d6e766bff216f3fee85b5ed381355cb427f5a616b3ae",
    )
    expect(CANDIDATE_RUNTIME_V117_SEMANTIC_TUPLE_ID).toBe(
      "sha256:0d8a04fdfe49e3aa7261728ee51beb0a9049b661aad978277f2892c3a4bc54fe",
    )
    expect(Object.isFrozen(CANDIDATE_RUNTIME_V117_SEMANTIC_TUPLE)).toBe(true)
    expect(
      prepareCanonicalCompatibilityTupleRecord(
        {
          ...VERSIONED_RUNTIME_V114_SEMANTIC_TUPLE_RECORD.tuple,
          runtimeAbi: "strategy-runtime-abi-v1.17",
        },
        CANONICAL_COMPATIBILITY_TUPLE_IDENTITY_PROFILES.successor
          .identityProfile,
      ),
    ).toEqual(CANDIDATE_RUNTIME_V117_SEMANTIC_TUPLE_RECORD)
    expect(
      resolveCanonicalCompatibilityTuple({
        tupleId: CANDIDATE_RUNTIME_V117_SEMANTIC_TUPLE_ID,
        tuple: { ...CANDIDATE_RUNTIME_V117_SEMANTIC_TUPLE },
      }),
    ).toEqual(
      selectedV117 ? VERSIONED_RUNTIME_V117_SEMANTIC_TUPLE_RECORD : undefined,
    )
    expect(
      resolveCandidateRuntimeV117SemanticTuple({
        tupleId: CANDIDATE_RUNTIME_V117_SEMANTIC_TUPLE_ID,
        tuple: { ...CANDIDATE_RUNTIME_V117_SEMANTIC_TUPLE },
      }),
    ).toEqual(VERSIONED_RUNTIME_V117_SEMANTIC_TUPLE_RECORD)

    const engineSource = readFileSync(
      path.join(repoRoot, "packages/engine/src/kernel/types.ts"),
      "utf8",
    )
    expect(engineSource).toContain("CANDIDATE_RUNTIME_V117_SEMANTIC_TUPLE")
    expect(engineSource).not.toContain(
      'runtimeAbi: "strategy-runtime-abi-v1.17"',
    )
  })

  it("selects encodings by explicit record profile and keeps current separate from history", () => {
    const selectedV117 =
      String(STRATEGY_RUNTIME_ABI_VERSION) === "strategy-runtime-abi-v1.17"
    expect(CURRENT_CANONICAL_COMPATIBILITY_TUPLE_ID).toBe(
      selectedV117
        ? CANDIDATE_RUNTIME_V117_SEMANTIC_TUPLE_ID
        : HISTORICAL_RUNTIME_V114_SEMANTIC_TUPLE_ID,
    )
    expect(HISTORICAL_RUNTIME_V114_SEMANTIC_TUPLE_ID).toBe(
      "sha256:922a6857fdbc8354b744d6e766bff216f3fee85b5ed381355cb427f5a616b3ae",
    )
    expect(REGISTERED_CANONICAL_COMPATIBILITY_TUPLES).toEqual([
      VERSIONED_RUNTIME_V114_SEMANTIC_TUPLE_RECORD,
      VERSIONED_RUNTIME_V117_SEMANTIC_TUPLE_RECORD,
    ])
    expect(
      prepareCanonicalCompatibilityTupleRecord(
        { ...CANDIDATE_RUNTIME_V117_SEMANTIC_TUPLE },
        CANONICAL_COMPATIBILITY_TUPLE_IDENTITY_PROFILES.legacy.identityProfile,
      ).tupleId,
    ).toBe(
      "sha256:0a3c2f168cd9d4c7eeb6b22bd438b150e4a3e983c5580b841b0bc41921c242fc",
    )
    const sortedCandidate = Object.fromEntries(
      Object.entries(CANDIDATE_RUNTIME_V117_SEMANTIC_TUPLE).sort(
        ([left], [right]) => left.localeCompare(right),
      ),
    ) as unknown as CanonicalCompatibilityTuple
    expect(
      prepareCanonicalCompatibilityTupleRecord(
        sortedCandidate,
        CANONICAL_COMPATIBILITY_TUPLE_IDENTITY_PROFILES.successor
          .identityProfile,
      ),
    ).toEqual(CANDIDATE_RUNTIME_V117_SEMANTIC_TUPLE_RECORD)
    expect(
      classifyCanonicalCompatibilityTupleIdAgainstCurrent(
        CANDIDATE_RUNTIME_V117_SEMANTIC_TUPLE_ID,
        CANDIDATE_RUNTIME_V117_SEMANTIC_TUPLE_ID,
      ),
    ).toBe("current-exact")
    expect(
      classifyCanonicalCompatibilityTupleIdAgainstCurrent(
        HISTORICAL_RUNTIME_V114_SEMANTIC_TUPLE_ID,
        CANDIDATE_RUNTIME_V117_SEMANTIC_TUPLE_ID,
      ),
    ).toBe("historical-v1.16-exact")
    expect(
      resolveHistoricalRuntimeV114SemanticTuple({
        tupleId: HISTORICAL_RUNTIME_V114_SEMANTIC_TUPLE_ID,
        tuple: { ...VERSIONED_RUNTIME_V114_SEMANTIC_TUPLE_RECORD.tuple },
      }),
    ).toEqual(VERSIONED_RUNTIME_V114_SEMANTIC_TUPLE_RECORD)
    expect(
      resolveHistoricalRuntimeV114SemanticTuple({
        tupleId: CANDIDATE_RUNTIME_V117_SEMANTIC_TUPLE_ID,
        tuple: { ...CANDIDATE_RUNTIME_V117_SEMANTIC_TUPLE },
      }),
    ).toBeUndefined()
    expect(
      classifyCanonicalCompatibilityTupleIdAgainstCurrent(
        `sha256:${"f".repeat(64)}`,
        CANDIDATE_RUNTIME_V117_SEMANTIC_TUPLE_ID,
      ),
    ).toBe("historical-or-unknown")
  })

  it("resolves only an exact registered id and matching complete expansion", () => {
    const registered = CANONICAL_COMPATIBILITY_TUPLES[0]!
    expect(
      resolveCanonicalCompatibilityTuple({
        tupleId: registered.tupleId,
        tuple: cloneTuple(registered.tuple),
      }),
    ).toEqual(registered)

    const invalidSelectors: unknown[] = [
      registered.tupleId,
      { tupleId: registered.tupleId },
      { tuple: cloneTuple(registered.tuple) },
      { tupleId: "latest", tuple: cloneTuple(registered.tuple) },
      { tupleId: "*", tuple: cloneTuple(registered.tuple) },
      {
        tupleId: `${registered.tupleId}..latest`,
        tuple: cloneTuple(registered.tuple),
      },
      {
        tupleId: registered.tupleId,
        tuple: {
          ...registered.tuple,
          rules: `${registered.tuple.rules}-mixed`,
        },
      },
      {
        tupleId: registered.tupleId,
        tuple: { ...registered.tuple, alias: "current" },
      },
      { tupleId: "sha256:unknown", tuple: cloneTuple(registered.tuple) },
    ]
    for (const selector of invalidSelectors) {
      expect(resolveCanonicalCompatibilityTuple(selector)).toBeUndefined()
    }
  })

  it("registers runtime-v1.19 only as an exact inactive six-component candidate", () => {
    expect(CANDIDATE_CANONICAL_COMPATIBILITY_TUPLE_KEY_V1_19).toBe(
      "runtime-v1.19",
    )
    expect(STRATEGY_RUNTIME_ABI_VERSION_V1_19).toBe(
      "strategy-runtime-abi-v1.19",
    )
    expect(CANDIDATE_RUNTIME_V119_SEMANTIC_TUPLE).toEqual({
      rules: "cowards-rules-v1.4",
      engine: "engine-kernel-v1.37-candidate-1",
      runtimeAbi: "strategy-runtime-abi-v1.19",
      chronicle: "chronicle-recorder-current-events-v1.37-candidate-1",
      arenaCatalog: "canonical-arena-catalog-v1.37",
      setPolicy: "canonical-set-policy-v1.37-four-condition-v1",
    })
    expect(CANDIDATE_RUNTIME_V119_SEMANTIC_TUPLE_RECORD).toEqual(
      prepareCanonicalCompatibilityTupleRecord(
        { ...CANDIDATE_RUNTIME_V119_SEMANTIC_TUPLE },
        CANONICAL_COMPATIBILITY_TUPLE_IDENTITY_PROFILES.successor
          .identityProfile,
      ),
    )
    expect(VERSIONED_RUNTIME_V119_SEMANTIC_TUPLE_RECORD).toMatchObject({
      ...CANDIDATE_RUNTIME_V119_SEMANTIC_TUPLE_RECORD,
      identityProfile:
        CANONICAL_COMPATIBILITY_TUPLE_IDENTITY_PROFILES.successor
          .identityProfile,
      encodingId:
        CANONICAL_COMPATIBILITY_TUPLE_IDENTITY_PROFILES.successor.encodingId,
    })
    expect(CANDIDATE_RUNTIME_V119_SEMANTIC_TUPLE_ID).toMatch(
      /^sha256:[0-9a-f]{64}$/u,
    )
    expect(
      resolveCandidateRuntimeV119SemanticTuple({
        tupleId: CANDIDATE_RUNTIME_V119_SEMANTIC_TUPLE_ID,
        tuple: { ...CANDIDATE_RUNTIME_V119_SEMANTIC_TUPLE },
      }),
    ).toEqual(VERSIONED_RUNTIME_V119_SEMANTIC_TUPLE_RECORD)
    expect(
      resolveCanonicalCompatibilityTuple({
        tupleId: CANDIDATE_RUNTIME_V119_SEMANTIC_TUPLE_ID,
        tuple: { ...CANDIDATE_RUNTIME_V119_SEMANTIC_TUPLE },
      }),
    ).toBeUndefined()
    expect(
      resolveRegisteredCanonicalCompatibilityTuple({
        tupleId: CANDIDATE_RUNTIME_V119_SEMANTIC_TUPLE_ID,
        tuple: { ...CANDIDATE_RUNTIME_V119_SEMANTIC_TUPLE },
      }),
    ).toBeUndefined()
  })

  it("rejects every mixed, incomplete, relabeled, and old-certificate candidate selector", () => {
    const exact = {
      tupleId: CANDIDATE_RUNTIME_V119_SEMANTIC_TUPLE_ID,
      tuple: { ...CANDIDATE_RUNTIME_V119_SEMANTIC_TUPLE },
    }
    const invalid: unknown[] = [
      { tupleId: exact.tupleId },
      { tuple: exact.tuple },
      { ...exact, current: true },
      {
        ...exact,
        tuple: { ...exact.tuple, runtimeAbi: "strategy-runtime-abi-v1.18" },
      },
      {
        ...exact,
        tuple: {
          ...exact.tuple,
          arenaCatalog: CANDIDATE_RUNTIME_V117_SEMANTIC_TUPLE.arenaCatalog,
        },
      },
      {
        ...exact,
        tuple: {
          ...exact.tuple,
          setPolicy: CANDIDATE_RUNTIME_V117_SEMANTIC_TUPLE.setPolicy,
        },
      },
      {
        tupleId: CANDIDATE_RUNTIME_V117_SEMANTIC_TUPLE_ID,
        tuple: { ...CANDIDATE_RUNTIME_V117_SEMANTIC_TUPLE },
      },
      {
        tupleId: exact.tupleId,
        tuple: {
          rules: exact.tuple.rules,
          engine: exact.tuple.engine,
          runtimeAbi: exact.tuple.runtimeAbi,
        },
      },
    ]

    for (const selector of invalid) {
      expect(resolveCandidateRuntimeV119SemanticTuple(selector)).toBeUndefined()
    }
  })

  it("keeps every Phase-259 current and released selector exact", () => {
    expect(CURRENT_CANONICAL_COMPATIBILITY_TUPLE_KEY).toBe("runtime-v1.17")
    expect(STRATEGY_RUNTIME_ABI_VERSION).toBe("strategy-runtime-abi-v1.17")
    expect(CURRENT_CANONICAL_COMPATIBILITY_TUPLE_ID).toBe(
      "sha256:0d8a04fdfe49e3aa7261728ee51beb0a9049b661aad978277f2892c3a4bc54fe",
    )
    expect(CURRENT_CANONICAL_COMPATIBILITY_TUPLE_RECORD).toEqual(
      VERSIONED_RUNTIME_V117_SEMANTIC_TUPLE_RECORD,
    )
    expect(CANONICAL_COMPATIBILITY_TUPLES).toEqual([
      VERSIONED_RUNTIME_V117_SEMANTIC_TUPLE_RECORD,
    ])
    expect(REGISTERED_CANONICAL_COMPATIBILITY_TUPLES).toEqual([
      VERSIONED_RUNTIME_V114_SEMANTIC_TUPLE_RECORD,
      VERSIONED_RUNTIME_V117_SEMANTIC_TUPLE_RECORD,
    ])
    expect(
      resolveCandidateRuntimeV119SemanticTuple({
        tupleId: CURRENT_CANONICAL_COMPATIBILITY_TUPLE_ID,
        tuple: { ...CURRENT_CANONICAL_COMPATIBILITY_TUPLE_RECORD.tuple },
      }),
    ).toBeUndefined()
    expect(
      REGISTERED_CANONICAL_COMPATIBILITY_TUPLES.some(
        ({ tuple }) => tuple.runtimeAbi === "strategy-runtime-abi-v1.18",
      ),
    ).toBe(false)
  })

  it("stages one compact Phase-259-valued source and generated projection", () => {
    expect(CURRENT_SEMANTIC_AUTHORITY_SOURCE).toEqual({
      semanticAuthorityKey: "runtime-v1.17",
    })
    expect(Object.keys(CURRENT_SEMANTIC_AUTHORITY_SOURCE)).toEqual([
      "semanticAuthorityKey",
    ])
    expect(Object.isFrozen(CURRENT_SEMANTIC_AUTHORITY_SOURCE)).toBe(true)

    expect(CURRENT_SEMANTIC_AUTHORITY_KEY).toBe("runtime-v1.17")
    expect(CURRENT_SEMANTIC_RUNTIME_ABI_VERSION).toBe(
      "strategy-runtime-abi-v1.17",
    )
    expect(CURRENT_SEMANTIC_TUPLE_ID).toBe(
      "sha256:0d8a04fdfe49e3aa7261728ee51beb0a9049b661aad978277f2892c3a4bc54fe",
    )
    expect(CURRENT_SEMANTIC_TUPLE).toEqual(
      VERSIONED_RUNTIME_V117_SEMANTIC_TUPLE_RECORD.tuple,
    )
    expect(CURRENT_SEMANTIC_ARENA_CATALOG_VERSION).toBe(
      "semantic-arena-catalog-v1.37-candidate-1",
    )
    expect(CURRENT_SEMANTIC_SET_POLICY_VERSION).toBe(
      "canonical-set-policy-v1.4",
    )
    expect(CURRENT_SEMANTIC_CONFORMANCE_CERTIFICATE_VERSION).toBe(
      "runtime-conformance-certificate-v1.17",
    )
    expect(CURRENT_SEMANTIC_AUTHORITY_GENERATED.selection).toEqual({
      semanticAuthorityKey: "runtime-v1.17",
      tupleId: CURRENT_CANONICAL_COMPATIBILITY_TUPLE_ID,
      tuple: { ...CURRENT_CANONICAL_COMPATIBILITY_TUPLE_RECORD.tuple },
      runtimeAbiVersion: "strategy-runtime-abi-v1.17",
      arenaCatalogVersion: "semantic-arena-catalog-v1.37-candidate-1",
      setPolicyVersion: "canonical-set-policy-v1.4",
      conformanceCertificateVersion: "runtime-conformance-certificate-v1.17",
    })
    expect(Object.isFrozen(CURRENT_SEMANTIC_AUTHORITY_GENERATED)).toBe(true)
    expect(Object.isFrozen(CURRENT_SEMANTIC_AUTHORITY_GENERATED.selection)).toBe(
      true,
    )
  })

  it("pins deterministic source and projection roots", () => {
    const sha256 = (value: unknown): string =>
      `sha256:${createHash("sha256").update(JSON.stringify(value)).digest("hex")}`

    expect(CURRENT_SEMANTIC_AUTHORITY_SOURCE_SHA256).toBe(
      sha256(CURRENT_SEMANTIC_AUTHORITY_SOURCE),
    )
    expect(CURRENT_SEMANTIC_AUTHORITY_OUTPUT_SHA256).toBe(
      sha256(CURRENT_SEMANTIC_AUTHORITY_GENERATED.selection),
    )
    expect(CURRENT_SEMANTIC_AUTHORITY_GENERATED).toMatchObject({
      schemaVersion: "current-semantic-authority-generated-v1",
      generatedBy:
        "packages/spec/src/current-semantic-authority-source.ts",
      activationOwner: "Phase-260-Plan-14",
      sourceSha256: CURRENT_SEMANTIC_AUTHORITY_SOURCE_SHA256,
      outputSha256: CURRENT_SEMANTIC_AUTHORITY_OUTPUT_SHA256,
    })
  })

  it("rejects premature, partial, mixed, and relabeled current selection", () => {
    const exact: CurrentSemanticAuthoritySource = {
      semanticAuthorityKey: "runtime-v1.17",
    }
    expect(resolveCurrentSemanticAuthoritySelection(exact)).toEqual(
      CURRENT_SEMANTIC_AUTHORITY_GENERATED.selection,
    )

    const invalid: unknown[] = [
      "runtime-v1.17",
      {},
      { semanticAuthorityKey: "runtime-v1.19" },
      { runtimeAbiVersion: "strategy-runtime-abi-v1.17" },
      { arenaCatalogVersion: "semantic-arena-catalog-v1.37-candidate-1" },
      { setPolicyVersion: "canonical-set-policy-v1.4" },
      {
        conformanceCertificateVersion:
          "runtime-conformance-certificate-v1.17",
      },
      {
        semanticAuthorityKey: "runtime-v1.17",
        runtimeAbiVersion: "strategy-runtime-abi-v1.19",
      },
      {
        semanticAuthorityKey: "runtime-v1.17",
        arenaCatalogVersion: "canonical-arena-catalog-v1.37",
      },
      {
        semanticAuthorityKey: "runtime-v1.17",
        setPolicyVersion: "canonical-set-policy-v1.37-four-condition-v1",
      },
      {
        semanticAuthorityKey: "runtime-v1.17",
        conformanceCertificateVersion:
          "runtime-conformance-certificate-v1.19",
      },
    ]
    for (const selector of invalid) {
      expect(resolveCurrentSemanticAuthoritySelection(selector)).toBeUndefined()
    }
  })

  it("keeps the successor reachable only through explicit candidate lookup", () => {
    expect(
      resolveCurrentSemanticAuthoritySelection({
        semanticAuthorityKey:
          CANDIDATE_CANONICAL_COMPATIBILITY_TUPLE_KEY_V1_19,
      }),
    ).toBeUndefined()
    expect(
      resolveCandidateRuntimeV119SemanticTuple({
        tupleId: CANDIDATE_RUNTIME_V119_SEMANTIC_TUPLE_ID,
        tuple: { ...CANDIDATE_RUNTIME_V119_SEMANTIC_TUPLE },
      }),
    ).toEqual(VERSIONED_RUNTIME_V119_SEMANTIC_TUPLE_RECORD)

    const sourceText = readFileSync(
      path.join(
        repoRoot,
        "packages/spec/src/current-semantic-authority-source.ts",
      ),
      "utf8",
    )
    const generatedText = readFileSync(
      path.join(
        repoRoot,
        "packages/spec/src/current-semantic-authority-generated.ts",
      ),
      "utf8",
    )
    expect(sourceText).not.toContain("runtime-v1.19")
    expect(generatedText).not.toContain("runtime-v1.19")
  })

  it("does not expose writable registry references", () => {
    const ownerBefore = CANONICAL_AUTHORITY_REGISTRY[0]!.symbol
    const registeredBefore = CANONICAL_COMPATIBILITY_TUPLES[0]!

    expect(() => {
      ;(
        CANONICAL_AUTHORITY_REGISTRY as unknown as Array<{ symbol: string }>
      )[0]!.symbol = "mutated"
    }).toThrow()
    expect(() => {
      ;(registeredBefore.tuple as { rules: string }).rules = "mutated"
    }).toThrow()

    const resolved = resolveCanonicalCompatibilityTuple({
      tupleId: registeredBefore.tupleId,
      tuple: cloneTuple(registeredBefore.tuple),
    })!
    expect(() => {
      ;(resolved.tuple as { engine: string }).engine = "mutated"
    }).toThrow()

    expect(CANONICAL_AUTHORITY_REGISTRY[0]!.symbol).toBe(ownerBefore)
    expect(CANONICAL_COMPATIBILITY_TUPLES[0]).toEqual(registeredBefore)
  })

  it("keeps the committed authority manifest byte-identical to deterministic rendering", () => {
    const actual = readFileSync(
      path.join(repoRoot, authorityArtifactPath),
      "utf8",
    )
    const parsed = JSON.parse(actual) as Record<string, unknown>
    expect(actual).toBe(`${JSON.stringify(parsed, null, 2)}\n`)
    expect(parsed).toMatchObject({
      schemaVersion: "v1.37-integrity-authority-v1",
      generatorVersion: "generate-v1-37-integrity-authority-v1",
      generatedBy: "scripts/generate-v1-37-integrity-authority.ts",
    })
    expect(JSON.stringify(parsed)).not.toMatch(
      /provider|toolchain|adapter|artifactBytes|buildIdentity|hostPath|secret/i,
    )
    const checked = spawnSync(
      "pnpm",
      [
        "exec",
        "tsx",
        "scripts/generate-v1-37-integrity-authority.ts",
        "--check",
      ],
      { cwd: repoRoot, encoding: "utf8" },
    )
    expect(checked.status, checked.stderr).toBe(0)
  })

  it("preserves legacy artifact bytes and publishes explicit successor identity profiles", () => {
    const legacyHashes = {
      [authorityArtifactPath]:
        "afa81345bb2d697befa590a07e613649c7b759bb9a471887104c83bfeaea1b1e",
      [hashVectorsArtifactPath]:
        "59c548d29ac905a8834c7b52351abff7a6bc449c6176179c7240bbecea6848b2",
    }
    for (const [relativePath, expected] of Object.entries(legacyHashes)) {
      expect(
        createHash("sha256")
          .update(readFileSync(path.join(repoRoot, relativePath)))
          .digest("hex"),
        relativePath,
      ).toBe(expected)
    }

    const authority = JSON.parse(
      readFileSync(path.join(repoRoot, successorAuthorityArtifactPath), "utf8"),
    ) as {
      schemaVersion: string
      identityProfiles: Array<{ identityProfile: string; encodingId: string }>
      compatibilityTuples: Array<{
        identityProfile: string
        encodingId: string
        tupleId: string
      }>
    }
    expect(authority.schemaVersion).toBe("v1.37-integrity-authority-v2")
    expect(authority.identityProfiles).toEqual(
      expect.arrayContaining([
        expect.objectContaining(
          CANONICAL_COMPATIBILITY_TUPLE_IDENTITY_PROFILES.legacy,
        ),
        expect.objectContaining(
          CANONICAL_COMPATIBILITY_TUPLE_IDENTITY_PROFILES.successor,
        ),
      ]),
    )
    expect(authority.compatibilityTuples).toEqual([
      expect.objectContaining({
        identityProfile:
          CANONICAL_COMPATIBILITY_TUPLE_IDENTITY_PROFILES.legacy
            .identityProfile,
        encodingId:
          CANONICAL_COMPATIBILITY_TUPLE_IDENTITY_PROFILES.legacy.encodingId,
        tupleId: HISTORICAL_RUNTIME_V114_SEMANTIC_TUPLE_ID,
      }),
      expect.objectContaining({
        identityProfile:
          CANONICAL_COMPATIBILITY_TUPLE_IDENTITY_PROFILES.successor
            .identityProfile,
        encodingId:
          CANONICAL_COMPATIBILITY_TUPLE_IDENTITY_PROFILES.successor.encodingId,
        tupleId: CANDIDATE_RUNTIME_V117_SEMANTIC_TUPLE_ID,
      }),
    ])

    const vectors = JSON.parse(
      readFileSync(
        path.join(repoRoot, successorHashVectorsArtifactPath),
        "utf8",
      ),
    ) as { vectors: Array<{ name: string; tupleId: string }> }
    expect(vectors.vectors).toEqual([
      expect.objectContaining({
        name: "registered-v1.14-legacy",
        tupleId: HISTORICAL_RUNTIME_V114_SEMANTIC_TUPLE_ID,
      }),
      expect.objectContaining({
        name: "candidate-v1.17-canonical",
        tupleId: CANDIDATE_RUNTIME_V117_SEMANTIC_TUPLE_ID,
      }),
    ])
  })

  it("publishes directly consumable base and per-component hash vectors", () => {
    const actual = readFileSync(
      path.join(repoRoot, hashVectorsArtifactPath),
      "utf8",
    )
    const parsed = JSON.parse(actual) as {
      vectors: Array<{
        name: string
        tuple: CanonicalCompatibilityTuple
        encodedBytesHex: string
        encodedBytesBase64: string
        sha256: string
        tupleId: string
      }>
    }
    expect(actual).toBe(`${JSON.stringify(parsed, null, 2)}\n`)
    expect(parsed.vectors.map(({ name }) => name)).toEqual([
      "registered-v1.4",
      "rules-mutated",
      "engine-mutated",
      "runtimeAbi-mutated",
      "chronicle-mutated",
      "arenaCatalog-mutated",
      "setPolicy-mutated",
    ])
    for (const vector of parsed.vectors) {
      const encoded = encodeCanonicalCompatibilityTuple(vector.tuple)
      expect(Buffer.from(encoded).toString("hex")).toBe(vector.encodedBytesHex)
      expect(Buffer.from(encoded).toString("base64")).toBe(
        vector.encodedBytesBase64,
      )
      expect(hashCanonicalCompatibilityTuple(vector.tuple)).toBe(vector.sha256)
      expect(vector.tupleId).toBe(`sha256:${vector.sha256}`)
      expect(vector.sha256).toMatch(/^[0-9a-f]{64}$/)
    }
  })
})
