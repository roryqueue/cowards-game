import { readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import {
  analyzeV137CoreRulesAuditBaseline,
  analyzeV137IntegrityBoundaries,
  analyzeV137IntegritySources,
  assertV137IntegrityPublicPayload,
  checkV137CoreRulesAuditBaseline,
} from "./check-v1-37-integrity-boundaries.js"

const expectBypass = (
  repoPath: string,
  source: string,
  expectedCode: string,
): void => {
  const result = analyzeV137IntegritySources({ [repoPath]: source })
  expect(result.findings.map((finding) => finding.code)).toContain(expectedCode)
}

const repositoryContractPaths = [
  "packages/persistence/src/runtime-evidence-import.ts",
  "packages/persistence/src/runtime-evidence-authority-publisher.ts",
  "packages/spec/src/runtime-evidence-authority-bundle.ts",
  "packages/spec/src/runtime-evidence-authority-bundle.test.ts",
  "apps/runtime-service/src/runtime-evidence-authority.ts",
  "apps/runtime-service/src/execute-match.test.ts",
  "apps/runtime-service/src/counted-safety.test.ts",
  "apps/runtime-service/src/four-language-parity.test.ts",
  "apps/go-backend/runtime_evidence_authority.go",
  "apps/go-backend/integrity_creation.go",
] as const

const repositoryContractSources = (): Record<string, string> =>
  Object.fromEntries(
    repositoryContractPaths.map((repoPath) => [
      repoPath,
      readFileSync(path.resolve(process.cwd(), repoPath), "utf8"),
    ]),
  )

const expectRepositoryContractFinding = (
  sources: Readonly<Record<string, string>>,
  repoPath: string,
  code: string,
): void => {
  expect(
    analyzeV137IntegritySources(sources, {
      enforceRepositoryContracts: true,
    }).findings,
  ).toEqual(
    expect.arrayContaining([expect.objectContaining({ path: repoPath, code })]),
  )
}

describe("v1.37 creation inventory and caller bypass monitor", () => {
  it("accounts for the repository creation inventory", () => {
    expect(analyzeV137IntegrityBoundaries().findings).toEqual([])
  })

  it.each([
    [
      "packages/persistence/src/competition.ts",
      "service.createFromMatrix({ id, matches })",
      "CALLER_EVIDENCE_MISSING",
    ],
    [
      "packages/persistence/src/workshop.ts",
      "service.createFromPreset({ id, presetId })",
      "CALLER_EVIDENCE_MISSING",
    ],
    [
      "packages/persistence/src/dev-smoke.ts",
      "service.createFromPreset({ id, presetId, integrityIdentity })",
      "DEV_FIXTURE_BOUNDARY_MISSING",
    ],
    [
      "packages/persistence/src/new-match-writer.ts",
      "service.createFromMatrix({ id, matches, integrityIdentity })",
      "UNRECOGNIZED_CREATION_CALLER",
    ],
  ])("rejects %s independently", (repoPath, source, expectedCode) => {
    expectBypass(repoPath, source, expectedCode)
  })

  it.each([
    "match_sets",
    "match_set_execution_entrants",
    "competition_entrants",
    "matches",
    "match_jobs",
    "chronicles",
  ])("rejects a direct SQL insert into %s", (table) => {
    expectBypass(
      "packages/persistence/src/alternate-writer.ts",
      `pool.query(\`insert into ${table} (id) values ($1)\`)`,
      "UNRECOGNIZED_SQL_WRITER",
    )
  })

  it("rejects a new legacy worker consumer", () => {
    expectBypass(
      "scripts/alternate-demo.ts",
      'import { runWorkerOnce } from "../apps/worker/src/runner.ts"; runWorkerOnce(pool)',
      "UNRECOGNIZED_LEGACY_WORKER_CONSUMER",
    )
  })

  it("keeps the advanced demo explicitly fixture-only and execution-unavailable", () => {
    const source = readFileSync(
      path.resolve(process.cwd(), "scripts/run-v1-5-advanced-demo.ts"),
      "utf8",
    )
    expect(source).not.toContain("runWorkerOnce")
    expect(source).not.toContain("counted_status = 'counted'")
    expect(source).toContain("V15_DEMO_EXECUTION_UNAVAILABLE")
  })

  it.each([
    [
      "packages/spec/src/duplicate-authority.ts",
      "export const CANONICAL_AUTHORITY_REGISTRY = []",
      "DUPLICATE_AUTHORITY_OWNER",
    ],
    [
      "packages/persistence/src/alternate-scheduler.ts",
      "export const scheduleTrialLadderSeason = () => undefined",
      "DUPLICATE_SCHEDULER_AUTHORITY",
    ],
    [
      "apps/web/app/matches/rules.ts",
      'import { resolveAction } from "@cowards/engine"',
      "UI_RULE_AUTHORITY",
    ],
    [
      "packages/runtime-js/src/promote.ts",
      "export const evaluateExecutableLaneEligibility = () => 'counted'",
      "DUPLICATE_ADAPTER_CLASSIFIER",
    ],
    [
      "packages/persistence/src/arena-copy.ts",
      "export const ArenaVariantSchema = {}",
      "DUPLICATE_ARENA_AUTHORITY",
    ],
    [
      "packages/spec/src/static-promotion.ts",
      "export const decision = registry.countedResultsAllowed ? 'counted' : 'disabled'",
      "STATIC_PROMOTION_PATH",
    ],
    [
      "apps/runtime-service/src/partial-tuple.ts",
      "const accepted = input.rules === 'cowards-rules-v1.4'",
      "PARTIAL_TUPLE_ACCEPTANCE",
    ],
    [
      "apps/web/app/api/execute/route.ts",
      "export async function POST() { return executeMatch(request) }",
      "PUBLIC_EXECUTION_ROUTE",
    ],
    [
      "packages/persistence/src/raw-certificate.ts",
      "await client.query('insert into runtime_evidence_certificates values ($1)')",
      "RAW_CERTIFICATE_WRITER",
    ],
    [
      "packages/persistence/src/raw-attestation.ts",
      "await client.query('insert into runtime_evidence_verified_attestations values ($1)')",
      "RAW_CERTIFICATE_WRITER",
    ],
    [
      "packages/persistence/src/fixture-promotion.ts",
      "if (evidence.trustDomain === 'fixture') return 'counted'",
      "FIXTURE_PRODUCTION_PROMOTION",
    ],
    [
      "packages/spec/src/docs-promotion.ts",
      "return gateName.includes('passed') ? 'counted' : 'disabled'",
      "DECLARATION_PROMOTION_PATH",
    ],
    [
      "apps/runtime-service/src/request-body-authority.ts",
      "const authority = request.containmentCertificate",
      "REQUEST_AUTHORITY_BODY",
    ],
  ])(
    "rejects focused integrity bypass in %s",
    (repoPath, source, expectedCode) => {
      expectBypass(repoPath, source, expectedCode)
    },
  )

  it("rejects public payloads containing restricted evidence recursively", () => {
    expect(() =>
      assertV137IntegrityPublicPayload({
        status: "disabled",
        nested: { sourceBytes: "private" },
      }),
    ).toThrow(/sourceBytes/)
    expect(() =>
      assertV137IntegrityPublicPayload({
        status: "disabled",
        message: "/Users/operator/runtime-authority.json",
      }),
    ).toThrow(/host path/)
  })

  it("pins the Phase-257 duplicate-loop and resolveActivation debt exactly", () => {
    const root = process.cwd()
    const sources = Object.fromEntries(
      [
        "packages/engine/src/activation.ts",
        "packages/engine/src/match.ts",
        "packages/replay/src/build.ts",
      ].map((repoPath) => [
        repoPath,
        readFileSync(path.join(root, repoPath), "utf8"),
      ]),
    )
    const current = analyzeV137IntegritySources(sources, {
      enforceKnownDebtFingerprints: true,
    })
    expect(current.findings).toEqual([])

    const mutated = {
      ...sources,
      "packages/engine/src/activation.ts": sources[
        "packages/engine/src/activation.ts"
      ]!.replace(
        "export const resolveActivation =",
        "export const resolveActivationChanged =",
      ),
    }
    expect(
      analyzeV137IntegritySources(mutated, {
        enforceKnownDebtFingerprints: true,
      }).findings.map((finding) => finding.code),
    ).toContain("KNOWN_PHASE_257_DEBT_DRIFT")
  })

  describe("Phase 257 RED structural execution debt", () => {
    it("reports every current execution bypass by stable finding code", () => {
      const sources = Object.fromEntries(
        [
          "packages/engine/src/activation.ts",
          "packages/engine/src/match.ts",
          "packages/replay/src/build.ts",
          "apps/runtime-service/src/execute-match.ts",
        ].map((repoPath) => [
          repoPath,
          readFileSync(path.resolve(process.cwd(), repoPath), "utf8"),
        ]),
      )

      const codes = analyzeV137IntegritySources(sources, {
        enforcePhase257RedContracts: true,
      }).findings.map((finding) => finding.code)

      expect(codes).toEqual(
        expect.arrayContaining([
          "PHASE_257_REPLAY_SCHEDULER",
          "PHASE_257_RUNTIME_REPLAY_EXECUTION",
          "PHASE_257_CONTIGUOUS_ACTIVATION_ENTRY",
        ]),
      )
    })

    it("uses exact executable identifiers and ignores near names", () => {
      const clean = analyzeV137IntegritySources(
        {
          "packages/replay/src/near-names.ts": `
            export const buildChronicleFromMatchResult = () => undefined
            export const resolveRoundSummary = () => undefined
            export const resolveContractionPreview = () => undefined
            export const resolveActivationCycle = () => undefined
            for (let index = 0; index < 1; index += 1) stepMatcher(index)
          `,
        },
        { enforcePhase257RedContracts: true },
      )
      expect(
        clean.findings.filter((finding) =>
          finding.code.startsWith("PHASE_257_"),
        ),
      ).toEqual([])

      const synthetic = analyzeV137IntegritySources(
        {
          "packages/replay/src/alternate-build.ts": `
            export const buildChronicleFromMatch = (state: unknown) => {
              while (state) {
                stepMatch(state, { kind: "advance" })
                state = resolveRound(state)
                state = resolveContraction(state)
              }
              return state
            }
          `,
          "apps/runtime-service/src/alternate-execute.ts": `
            import { buildChronicleFromMatch } from "@cowards/replay"
            export const execute = (input: unknown) => buildChronicleFromMatch(input)
          `,
          "packages/engine/src/alternate-activation.ts": `
            export const resolveActivation = () => undefined
          `,
        },
        { enforcePhase257RedContracts: true },
      )

      expect(synthetic.findings.map((finding) => finding.code)).toEqual(
        expect.arrayContaining([
          "PHASE_257_REPLAY_SCHEDULER",
          "PHASE_257_RUNTIME_REPLAY_EXECUTION",
          "PHASE_257_CONTIGUOUS_ACTIVATION_ENTRY",
          "PHASE_257_DUPLICATE_LIFECYCLE_LOOP",
        ]),
      )
    })

    it("rejects variable-agnostic stepMatch loops outside the kernel driver", () => {
      const result = analyzeV137IntegritySources(
        {
          "packages/replay/src/copied-loop.ts": `
            export const copied = (machine: unknown) => {
              for (let index = 0; index < 3; index += 1) {
                stepMatch(machine, { kind: "advance" })
              }
            }
          `,
        },
        { enforcePhase257RedContracts: true },
      )
      expect(result.findings).toEqual([
        expect.objectContaining({
          code: "PHASE_257_DUPLICATE_LIFECYCLE_LOOP",
          path: "packages/replay/src/copied-loop.ts",
        }),
      ])
    })
  })

  it("pins domain-separated payload-byte authority verification and its negative guards", () => {
    const sources = repositoryContractSources()
    expect(
      analyzeV137IntegritySources(sources, {
        enforceRepositoryContracts: true,
      }).findings,
    ).toEqual([])

    const specPath = "packages/spec/src/runtime-evidence-authority-bundle.ts"
    expectRepositoryContractFinding(
      {
        ...sources,
        [specPath]: sources[specPath]!.replace(
          "textEncoder.encode(RUNTIME_EVIDENCE_AUTHORITY_SIGNATURE_DOMAIN)",
          'textEncoder.encode("removed-signature-domain")',
        ),
      },
      specPath,
      "AUTHORITY_CHAIN_DRIFT",
    )
    expectRepositoryContractFinding(
      {
        ...sources,
        [specPath]: sources[specPath]!.replace(
          "signedMessageBytes: encodeRuntimeEvidenceAuthoritySignatureMessage({",
          "signedMessageBytes: payloadBytes, void ({",
        ),
      },
      specPath,
      "AUTHORITY_CHAIN_DRIFT",
    )

    const runtimePath = "apps/runtime-service/src/runtime-evidence-authority.ts"
    expectRepositoryContractFinding(
      {
        ...sources,
        [runtimePath]: sources[runtimePath]!.replace(
          "publicKeyDescriptor.publicKey,",
          "createPublicKey('removed-pinned-key'),",
        ),
      },
      runtimePath,
      "AUTHORITY_CHAIN_DRIFT",
    )

    const negativePath =
      "packages/spec/src/runtime-evidence-authority-bundle.test.ts"
    expectRepositoryContractFinding(
      {
        ...sources,
        [negativePath]: sources[negativePath]!.replace(
          "relabeledDomain.trustDomain =",
          "removedDomainGuard =",
        ),
      },
      negativePath,
      "AUTHORITY_CHAIN_DRIFT",
    )
  })

  it("pins separate publication-head and installed-publication receipt locks", () => {
    const sources = repositoryContractSources()
    const goPath = "apps/go-backend/integrity_creation.go"

    expectRepositoryContractFinding(
      {
        ...sources,
        [goPath]: sources[goPath]!.replace(
          "where singleton = true\n\t\t for share",
          "where singleton = true",
        ),
      },
      goPath,
      "GO_RECEIPT_AUTHORITY_DRIFT",
    )
    expectRepositoryContractFinding(
      {
        ...sources,
        [goPath]: sources[goPath]!.replace("for share of p", ""),
      },
      goPath,
      "GO_RECEIPT_AUTHORITY_DRIFT",
    )
  })
})

describe("v1.37 core-rules audit baseline", () => {
  const expectedReproduction = {
    noAdvanceLastSoldier: {
      status: "STONE",
      outcome: null,
      matchEndedEvents: 0,
    },
    cycleEndBackstabActor: {
      status: "STONE",
      slotEnded: false,
      terminalReason: null,
    },
    excessMalformedOrder: {
      validOrdersRetained: 0,
      violationEvents: 1,
    },
    deepValidation: "threw:RangeError",
    overlappingArenaAccepted: true,
    legacyBoundaryAccepted: true,
    successfulPushPusherHistory: "RIGHT",
  } as const

  it("matches the exact seven current-HEAD reproductions", () => {
    expect(checkV137CoreRulesAuditBaseline().findings).toEqual([])
  })

  it("rejects semantic drift in any probe", () => {
    const baseline = JSON.parse(
      readFileSync(
        path.resolve(
          process.cwd(),
          ".planning/artifacts/v1.37-core-rules-audit-baseline.json",
        ),
        "utf8",
      ),
    ) as unknown
    const markdown = readFileSync(
      path.resolve(
        process.cwd(),
        ".planning/artifacts/v1.37-core-rules-audit-baseline.md",
      ),
      "utf8",
    )
    const drifted = {
      ...expectedReproduction,
      successfulPushPusherHistory: "LEFT",
    }
    expect(
      analyzeV137CoreRulesAuditBaseline({
        baseline,
        markdown,
        reproduced: drifted,
      }).findings.map((finding) => finding.code),
    ).toContain("AUDIT_OBSERVATION_DRIFT")
  })

  it("rejects restricted data in the persisted baseline", () => {
    const unsafe = {
      schemaVersion: 1,
      implementationHead: "c28015b",
      sourceBytes: "private",
      probes: [],
    }
    expect(
      analyzeV137CoreRulesAuditBaseline({
        baseline: unsafe,
        markdown: "# audit baseline\n",
        reproduced: expectedReproduction,
      }).findings.map((finding) => finding.code),
    ).toContain("AUDIT_PRIVACY_VIOLATION")
  })
})
