import { createHash } from "node:crypto"
import { describe, expect, it } from "vitest"
import {
  V137_RELEASE_ARTIFACT_CLASSES,
  V137_RELEASE_REQUIRED_STRICT_ARTIFACTS,
  analyzeV137ReleaseBoundaries,
  createV137ReleaseBoundaryFixture,
  type V137ReleaseBoundaryFindingCode,
  type V137ReleaseBoundaryInput,
} from "./check-v1-37-release-boundaries.ts"

const findingCodes = (input: V137ReleaseBoundaryInput) =>
  analyzeV137ReleaseBoundaries(input).findings.map((finding) => finding.code)

const replace = (
  input: V137ReleaseBoundaryInput,
  replacement: Partial<V137ReleaseBoundaryInput>,
): V137ReleaseBoundaryInput => ({ ...input, ...replacement })

describe("v1.37 release boundaries", () => {
  it("accepts the honest source/fixture posture without future artifacts", () => {
    const input = createV137ReleaseBoundaryFixture("source-fixture")

    expect(analyzeV137ReleaseBoundaries(input)).toEqual({
      mode: "source-fixture",
      findings: [],
      publicArtifactCount: V137_RELEASE_ARTIFACT_CLASSES.length,
      strictArtifactCount: 0,
    })
  })

  it.each([
    ["transition duplication", "transitionAuthorityCount", 2, "RELEASE_TRANSITION_DUPLICATION"],
    ["tuple mixing", "tupleIdentityCount", 2, "RELEASE_TUPLE_MIXING"],
    ["adapter gameplay", "adapterGameplayOwnerCount", 1, "RELEASE_ADAPTER_GAMEPLAY"],
    ["stale evidence", "staleEvidenceCount", 1, "RELEASE_STALE_EVIDENCE"],
    ["event drift", "eventVocabularyDriftCount", 1, "RELEASE_EVENT_DRIFT"],
    ["arena duplication", "duplicateArenaAuthorityCount", 1, "RELEASE_ARENA_DUPLICATION"],
    ["unfair scheduling", "unfairSchedulingCount", 1, "RELEASE_UNFAIR_SCHEDULING"],
  ] as const)("rejects %s", (_label, key, value, expectedCode) => {
    const fixture = createV137ReleaseBoundaryFixture("source-fixture")
    const authority = { ...fixture.authority, [key]: value }

    expect(findingCodes(replace(fixture, { authority }))).toContain(expectedCode)
  })

  it("rejects counted claims independently of functional four-language support", () => {
    const fixture = createV137ReleaseBoundaryFixture("source-fixture")
    const lanes = fixture.lanes.map((lane, index) =>
      index === 0
        ? { ...lane, functionalConformance: "passed" as const, containmentEvidence: "unattested" as const, counted: true }
        : lane,
    )

    expect(findingCodes(replace(fixture, { lanes }))).toContain(
      "RELEASE_UNPROVED_COUNTING",
    )
  })

  it("maps existing integrity findings without copying source-analysis rules", () => {
    const fixture = createV137ReleaseBoundaryFixture("source-fixture")
    const integrityFindings = [
      {
        code: "DUPLICATE_AUTHORITY_OWNER" as const,
        path: "packages/example.ts",
        line: 1,
        detail: "private material must never be forwarded",
      },
    ]

    const result = analyzeV137ReleaseBoundaries(
      replace(fixture, { integrityFindings }),
    )

    expect(result.findings).toContainEqual({
      code: "RELEASE_TRANSITION_DUPLICATION",
      artifactClass: "source",
      artifactId: "integrity-analysis",
    })
    expect(JSON.stringify(result)).not.toContain("packages/example.ts")
    expect(JSON.stringify(result)).not.toContain("private material")
  })

  it.each([
    ["secret", "fixture-secret-9f3c"],
    ["source", "const privateDoctrine = true"],
    ["artifact", "artifact-byte-preimage-4d82"],
    ["memory", "soldier-memory-preimage-72aa"],
    ["objective", "objective-preimage-951e"],
    ["path", "/restricted/evidence/only/27"],
    ["env", "COWARDS_TEST_SECRET=private-value"],
    ["diagnostic", "internal provider panic 06c1"],
    ["restricted-id", "restricted-object-private-38a0"],
  ] as const)("rejects a concrete %s preimage in every public artifact class", (category, value) => {
    for (const artifactClass of V137_RELEASE_ARTIFACT_CLASSES) {
      const fixture = createV137ReleaseBoundaryFixture("source-fixture")
      const publicArtifacts = fixture.publicArtifacts.map((artifact) =>
        artifact.artifactClass === artifactClass
          ? { ...artifact, summary: `safe prefix ${value} safe suffix` }
          : artifact,
      )
      const privatePreimages = [{ category, value }]
      const codes = findingCodes(
        replace(fixture, { publicArtifacts, privatePreimages }),
      )

      expect(codes, artifactClass).toContain("RELEASE_PRIVATE_PREIMAGE")
    }
  })

  it("allows policy prose while rejecting forbidden fields, markers, and extra schema keys", () => {
    const fixture = createV137ReleaseBoundaryFixture("source-fixture")
    const [first, ...rest] = fixture.publicArtifacts
    expect(first).toBeDefined()
    const policyProse = {
      ...first!,
      summary:
        "Policy forbids source, artifact bytes, memories, objectives, diagnostics, host data, credentials, and security internals.",
    }
    expect(
      analyzeV137ReleaseBoundaries(
        replace(fixture, { publicArtifacts: [policyProse, ...rest] }),
      ).findings,
    ).toEqual([])

    for (const mutation of [
      { ...first!, strategyMemory: "redacted" },
      { ...first!, summary: "DATABASE_URL=redacted" },
      { ...first!, extraSafeLookingLabel: true },
    ]) {
      const codes = findingCodes(
        replace(fixture, { publicArtifacts: [mutation, ...rest] }),
      )
      expect(codes).toEqual(
        expect.arrayContaining([
          "RELEASE_PUBLIC_SCHEMA_DRIFT" as V137ReleaseBoundaryFindingCode,
        ]),
      )
    }
  })

  it("requires every public artifact class exactly once", () => {
    const fixture = createV137ReleaseBoundaryFixture("source-fixture")
    const [first, second, ...rest] = fixture.publicArtifacts
    expect(first).toBeDefined()
    expect(second).toBeDefined()
    const duplicatedClass = [
      first!,
      { ...second!, artifactClass: first!.artifactClass },
      ...rest,
    ]

    expect(
      findingCodes(replace(fixture, { publicArtifacts: duplicatedClass })),
    ).toContain("RELEASE_PUBLIC_SCHEMA_DRIFT")
  })

  it("accepts a complete exact strict-release inventory", () => {
    const fixture = createV137ReleaseBoundaryFixture("strict-release")

    expect(analyzeV137ReleaseBoundaries(fixture)).toEqual({
      mode: "strict-release",
      findings: [],
      publicArtifactCount: V137_RELEASE_ARTIFACT_CLASSES.length,
      strictArtifactCount: V137_RELEASE_REQUIRED_STRICT_ARTIFACTS.length,
    })
  })

  it("strict inventory includes the exact event, arena, and Set authorities", () => {
    expect(V137_RELEASE_REQUIRED_STRICT_ARTIFACTS.map(({ id }) => id)).toEqual(
      expect.arrayContaining([
        "current-event-authority",
        "current-arena-authority",
        "current-set-policy-authority",
      ]),
    )
  })

  it.each(V137_RELEASE_REQUIRED_STRICT_ARTIFACTS)(
    "strict release rejects missing $id evidence",
    ({ id }) => {
      const fixture = createV137ReleaseBoundaryFixture("strict-release")
      const strictArtifacts = fixture.strictArtifacts.filter(
        (artifact) => artifact.id !== id,
      )

      expect(findingCodes(replace(fixture, { strictArtifacts }))).toContain(
        "RELEASE_ARTIFACT_MISSING",
      )
    },
  )

  it.each([
    ["stale", { actualSha256: `sha256:${"b".repeat(64)}` }, "RELEASE_ARTIFACT_STALE"],
    ["edited", { canonicalBytes: "edited\n" }, "RELEASE_ARTIFACT_EDITED"],
    ["duplicated", { duplicateCount: 2 }, "RELEASE_ARTIFACT_DUPLICATED"],
    ["identity-mixed", { actualIdentity: "tuple:mixed" }, "RELEASE_IDENTITY_MIXED"],
  ] as const)("strict release rejects a %s artifact", (_label, mutation, code) => {
    const fixture = createV137ReleaseBoundaryFixture("strict-release")
    const [first, ...rest] = fixture.strictArtifacts
    expect(first).toBeDefined()
    const strictArtifacts = [{ ...first!, ...mutation }, ...rest]

    expect(findingCodes(replace(fixture, { strictArtifacts }))).toContain(code)
  })

  it("strict release cannot pass with an empty artifact set", () => {
    const fixture = createV137ReleaseBoundaryFixture("strict-release")

    expect(findingCodes(replace(fixture, { strictArtifacts: [] }))).toContain(
      "RELEASE_ARTIFACT_MISSING",
    )
  })

  it("strict release applies public privacy and concrete-preimage scans to canonical bytes", () => {
    const fixture = createV137ReleaseBoundaryFixture("strict-release")
    const [first, ...rest] = fixture.strictArtifacts
    expect(first).toBeDefined()
    const privateValue = "restricted-browser-handoff-78c2"
    const canonicalBytes = `${JSON.stringify({ status: "pass", note: privateValue })}\n`
    const actualSha256 = `sha256:${createHash("sha256")
      .update(canonicalBytes)
      .digest("hex")}`
    const strictArtifacts = [
      {
        ...first!,
        canonicalBytes,
        actualSha256,
        expectedSha256: actualSha256,
      },
      ...rest,
    ]
    const result = analyzeV137ReleaseBoundaries(
      replace(fixture, {
        strictArtifacts,
        privatePreimages: [{ category: "restricted-id", value: privateValue }],
      }),
    )

    expect(result.findings.map(({ code }) => code)).toContain(
      "RELEASE_PRIVATE_PREIMAGE",
    )
    expect(JSON.stringify(result)).not.toContain(privateValue)
  })

  it("findings never contain concrete private values or diagnostics", () => {
    const fixture = createV137ReleaseBoundaryFixture("source-fixture")
    const privateValue = "restricted-diagnostic-actual-value"
    const publicArtifacts = fixture.publicArtifacts.map((artifact, index) =>
      index === 0 ? { ...artifact, summary: privateValue } : artifact,
    )
    const result = analyzeV137ReleaseBoundaries(
      replace(fixture, {
        publicArtifacts,
        privatePreimages: [{ category: "diagnostic", value: privateValue }],
      }),
    )

    expect(result.findings).not.toHaveLength(0)
    expect(JSON.stringify(result)).not.toContain(privateValue)
  })
})
