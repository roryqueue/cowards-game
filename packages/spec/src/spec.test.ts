/// <reference types="node" />

import { describe, expect, it } from "vitest"
import {
  ANALYTICS_PROFILE_SCHEMA_VERSION,
  ANALYTICS_RUN_SCHEMA_VERSION,
  ANALYTICS_SUMMARY_SCHEMA_VERSION,
  assertAnalyticsPublicSummaryLeakSafe,
  deriveAnalyticsEvidenceBand,
} from "./analytics.js"
import {
  assertPublicMatchSetResultLeakSafe,
  COMPETITION_PRESET_IDS,
  getCompetitionPreset,
} from "./competition.js"
import {
  assertPublicServiceDtoLeakSafe,
  SERVICE_API_ROUTES,
  SERVICE_API_VERSION,
} from "./service.js"
import { assertPublicOutputLeakSafe } from "./public-output-privacy.js"
import {
  ActionSchema,
  AnalyticsGauntletRunSummarySchema,
  ChronicleSchema,
  PublicLadderPageServiceDtoSchema,
  PublicMatchSetSummaryServiceDtoSchema,
  PublicReplayMetadataServiceDtoSchema,
  PublicStrategyPageServiceDtoSchema,
  RuntimeExecutionServiceRequestSchema,
  RuntimeExecutionServiceResponseSchema,
  RuntimeViolationUserGuidanceSchema,
  RuntimeViolationTypeSchema,
  SoldierInactivityExplanationDtoSchema,
  SoldierInactivityExplanationCauseSchema,
  SoldierSchema,
  StrategyArtifactPublicSummarySchema,
  StrategyArtifactSchema,
  StrategyRevisionValidationReportSchema,
  StrategyRevisionValidationIssueSchema,
  StrategyRevisionSchema,
  WorkshopAnalyticsComparisonServiceDtoSchema,
  WorkshopTestSummaryServiceDtoSchema,
} from "./schemas.js"
import { fixtures } from "./fixtures/index.js"
import {
  defaultRuntimeMetadata,
  describeStrategyRuntimeProductSemantics,
  evaluateStrategyRuntimeCountedEligibility,
  getSupportedStrategyLanguageBySourceFormat,
  getSupportedStrategyLanguageRecord,
  getStrategyLanguageProviderRecord,
  assertNonJsRuntimeGuardrails,
  NON_JS_RUNTIME_PROMOTION_CRITERIA,
  NON_JS_RUNTIME_SUPPORT_POLICY,
  RUNTIME_BROKER_REGISTRY,
  RUNTIME_BROKER_REGISTRY_VERSION,
  STRATEGY_LANGUAGE_PROVIDER_CONTRACT_VERSION,
  STRATEGY_LANGUAGE_PROVIDER_REGISTRY,
  SUPPORTED_STRATEGY_LANGUAGES,
  STRATEGY_RUNTIME_ADAPTER_REGISTRY,
  STRATEGY_RUNTIME_ABI_VERSION,
  STRATEGY_RUNTIME_PRODUCT_VALIDATION_CODES,
  runtimeCompatibilityKey,
  validateStrategyLanguageProviderRuntimeCompatibility,
  validateRuntimeBrokerRegistryMatch,
  validateStrategyRuntimeMetadataPolicy,
} from "./runtime.js"
import {
  RUNTIME_EXECUTION_SERVICE_AUTHORITY_POLICY,
  RUNTIME_EXECUTION_SERVICE_BOUNDARY_CONTRACT,
  RUNTIME_EXECUTION_SERVICE_CURRENT_IMPLEMENTATION,
  RUNTIME_EXECUTION_SERVICE_FAILURE_PRIVACY_POLICY,
  RUNTIME_EXECUTION_SERVICE_TRANSPORT_BINDING,
  RUNTIME_EXECUTION_SERVICE_VERSION,
} from "./runtime-execution-service.js"
import { COMPATIBILITY_VERSIONS } from "./versions.js"
import { STRATEGY_SOURCE_BYTES } from "./constants.js"
import { readFileSync } from "node:fs"
import {
  RUNTIME_VIOLATION_TYPES,
  SOLDIER_INACTIVITY_EXPLANATION_CAUSES,
} from "./types.js"
import type { AnalyticsGauntletRunSummary } from "./analytics.js"

describe("Coward's Game spec contracts", () => {
  it("exposes generation-ready v1.8 service route metadata and public DTO schemas", () => {
    expect(SERVICE_API_VERSION).toBe("service-api-v1.8")
    expect(SERVICE_API_ROUTES.getPublicStrategyPage).toMatchObject({
      id: "getPublicStrategyPage",
      operationId: "getPublicStrategyPage",
      method: "GET",
      path: "/public/strategies/{strategyId}",
      authScope: "public",
      privacyClass: "public",
    })

    for (const [routeId, route] of Object.entries(SERVICE_API_ROUTES)) {
      expect(route.id).toBe(routeId)
      expect(route.operationId).toBeTruthy()
      expect(route.method).toMatch(/^(GET|POST|DELETE)$/)
      expect(route.path).toMatch(/^\//)
      expect(route.authScope).toBeTruthy()
      expect(route.privacyClass).toBeTruthy()
      expect(route.request).toBeTruthy()
      expect(route.response).toBeTruthy()
      expect(route.error).toBeTruthy()
      expect(route.examples.length).toBeGreaterThan(0)
      expect(route.fixtureRefs.length).toBeGreaterThan(0)
    }

    const publicSchemas = [
      PublicMatchSetSummaryServiceDtoSchema,
      PublicLadderPageServiceDtoSchema,
      PublicReplayMetadataServiceDtoSchema,
      PublicStrategyPageServiceDtoSchema,
    ]
    for (const schema of publicSchemas) {
      expect(typeof schema.parse).toBe("function")
    }
    for (const route of Object.values(SERVICE_API_ROUTES)) {
      if (route.privacyClass === "public") {
        for (const example of route.examples) {
          assertPublicServiceDtoLeakSafe(example)
        }
      }
    }
  })

  it("parses Workshop read service DTOs without private fields", () => {
    const testSummary = WorkshopTestSummaryServiceDtoSchema.parse({
      apiVersion: SERVICE_API_VERSION,
      kind: "workshopTestSummary",
      matchSetId: "match-set:workshop:demo",
      summary: {
        matchSetId: "match-set:workshop:demo",
        status: "complete",
        matchCount: 1,
        matchIds: ["match:demo"],
        matches: [
          {
            matchId: "match:demo",
            status: "complete",
            bottomPlayerId: "player:bottom",
            topPlayerId: "player:top",
            outcome: { type: "DRAW" },
            hasReplay: true,
          },
        ],
        scoring: {
          complete: true,
          degraded: false,
          rankings: [],
        },
      },
    })
    const comparison = WorkshopAnalyticsComparisonServiceDtoSchema.parse({
      apiVersion: SERVICE_API_VERSION,
      kind: "workshopAnalyticsComparison",
      profileId: "analytics-profile:demo",
      comparison: {
        profileId: "analytics-profile:demo",
        baseRunId: "analytics-run:base",
        compareRunId: "analytics-run:compare",
        compatibilityEquivalent: true,
        delta: { wins: 1, losses: -1, draws: 0, points: 3 },
      },
    })

    expect(() => assertPublicServiceDtoLeakSafe(testSummary)).not.toThrow()
    expect(() => assertPublicServiceDtoLeakSafe(comparison)).not.toThrow()
    expect(() =>
      assertPublicServiceDtoLeakSafe({
        ...testSummary,
        summary: {
          ...testSummary.summary,
          ownerDebug: { hidden: true },
        },
      }),
    ).toThrow(/private field/)
  })

  it("public output leak guard catches normalized fields and private markers", () => {
    expect(() =>
      assertPublicOutputLeakSafe({ nested: { StackTrace: "private" } }),
    ).toThrow(/private field/)
    expect(() =>
      assertPublicOutputLeakSafe({ message: "failed with Bearer secret" }),
    ).toThrow(/private marker/)
  })

  it("compatibility versions have exactly the core six keys", () => {
    expect(Object.keys(COMPATIBILITY_VERSIONS)).toEqual([
      "spec",
      "engine",
      "runtimeJs",
      "chronicle",
      "strategyRevision",
      "arenaVariant",
    ])
  })

  it("standard initial Soldiers include 16 Soldiers total", () => {
    expect(fixtures.valid.standardInitialSoldiers).toHaveLength(16)
  })

  it("bottom Soldiers face UP and top Soldiers face DOWN", () => {
    const bottom = fixtures.valid.standardInitialSoldiers.filter(
      (soldier) => soldier.ownerPlayerId === "bottom",
    )
    const top = fixtures.valid.standardInitialSoldiers.filter(
      (soldier) => soldier.ownerPlayerId === "top",
    )

    expect(bottom.every((soldier) => soldier.facing === "UP")).toBe(true)
    expect(top.every((soldier) => soldier.facing === "DOWN")).toBe(true)
  })

  it("ActionSchema accepts MOVE, TURN, and TURN_TO_STONE", () => {
    expect(
      ActionSchema.safeParse({ type: "MOVE", direction: "UP" }).success,
    ).toBe(true)
    expect(
      ActionSchema.safeParse({ type: "TURN", direction: "LEFT" }).success,
    ).toBe(true)
    expect(ActionSchema.safeParse({ type: "TURN_TO_STONE" }).success).toBe(true)
  })

  it("RuntimeViolationTypeSchema accepts only player-caused public violations", () => {
    expect(
      RUNTIME_VIOLATION_TYPES.map((type) =>
        RuntimeViolationTypeSchema.parse(type),
      ),
    ).toEqual([
      "INVALID_OUTPUT",
      "TIMEOUT",
      "THROWN_EXCEPTION",
      "FORBIDDEN_CAPABILITY",
      "OVERSIZED_OUTPUT",
    ])

    for (const infrastructureLabel of [
      "MALFORMED_IPC",
      "SUBPROCESS_EXIT",
      "SUBPROCESS_SIGNAL",
      "SPAWN_FAILED",
      "SYSTEM_FAILURE",
    ]) {
      expect(
        RuntimeViolationTypeSchema.safeParse(infrastructureLabel).success,
      ).toBe(false)
    }
  })

  it("RuntimeViolationUserGuidanceSchema accepts concise public guidance", () => {
    const guidance = {
      label: "Strategy timed out",
      constraint: "Strategy methods must finish within the runtime timeout.",
      remediation: "Simplify the loop or reduce per-Cycle work.",
    }

    expect(RuntimeViolationUserGuidanceSchema.parse(guidance)).toEqual(guidance)
  })

  it("runtime product semantics keep JS, Python, Rust, and Zig counted through providers", () => {
    const jsRuntime = defaultRuntimeMetadata()
    const pythonRuntime = {
      abiVersion: "strategy-runtime-abi-v1.14",
      language: { id: "python", version: "3.9" },
      adapter: {
        id: "runtime-python-subprocess-experimental",
        version: "0.1.0-experimental",
      },
      package: { mode: "none", entrypoint: "default" },
      requiredCapabilities: [],
      limits: jsRuntime.limits,
    }

    expect(evaluateStrategyRuntimeCountedEligibility(jsRuntime)).toEqual({
      ok: true,
      code: null,
      publicMessage: null,
    })
    expect(evaluateStrategyRuntimeCountedEligibility(pythonRuntime)).toEqual({
      ok: true,
      code: null,
      publicMessage: null,
    })
    expect(
      describeStrategyRuntimeProductSemantics(pythonRuntime),
    ).toMatchObject({
      languageLabel: "Python",
      readinessLabel: "Production candidate",
      countedPlayLabel: "Counted eligible",
      experimental: false,
    })
    expect(
      STRATEGY_RUNTIME_ADAPTER_REGISTRY.every(
        (adapter) =>
          adapter.id === "runtime-python-subprocess-experimental" ||
          adapter.isolationPromotionState === "evidence-only",
      ),
    ).toBe(true)
    expect(
      STRATEGY_RUNTIME_ADAPTER_REGISTRY.find(
        (adapter) => adapter.id === "runtime-python-subprocess-experimental",
      ),
    ).toMatchObject({
      enabledForNormalPlay: true,
      countedResultsAllowed: true,
      isolationPromotionState: "evidence-only",
    })
    expect(
      STRATEGY_RUNTIME_ADAPTER_REGISTRY.find(
        (adapter) => adapter.id === "runtime-js-container-subprocess",
      )?.isolationPromotionCriteria,
    ).toEqual(
      expect.arrayContaining([
        "required-container-probes",
        "resource-limits",
        "filesystem-denial",
        "network-denial",
        "image-provenance",
        "deployment-preflight",
        "failure-taxonomy",
        "redacted-diagnostics",
        "local-ergonomics",
      ]),
    )
    const containerRuntime = {
      ...jsRuntime,
      adapter: {
        id: "runtime-js-container-subprocess" as const,
        version: COMPATIBILITY_VERSIONS.runtimeJs,
      },
    }
    expect(evaluateStrategyRuntimeCountedEligibility(containerRuntime)).toEqual(
      {
        ok: false,
        code: "NON_COUNTED_RUNTIME",
        publicMessage:
          "Strategy runtime is experimental and not counted-play eligible.",
      },
    )
    expect(
      describeStrategyRuntimeProductSemantics(containerRuntime),
    ).toMatchObject({
      adapterLabel: "runtime-js container subprocess",
      readinessLabel: "Production candidate",
      countedPlayLabel: "Not counted",
      countedPlayEligible: false,
    })
    expect(() => assertNonJsRuntimeGuardrails()).not.toThrow()
    expect(NON_JS_RUNTIME_SUPPORT_POLICY).toMatchObject({
      status: "partial-production-supported",
      productionSupportedLanguageIds: [
        "javascript",
        "typescript",
        "python",
        "rust",
        "zig",
      ],
      experimentalLanguageIds: [],
      publicLanguagePickerAllowed: true,
    })
    expect(
      NON_JS_RUNTIME_PROMOTION_CRITERIA.map((criterion) => criterion.id),
    ).toEqual(
      expect.arrayContaining([
        "deterministic-language-semantics",
        "production-sandbox",
        "package-policy",
        "workshop-ux-docs",
        "compatibility-keys",
        "counted-eligibility",
        "replay-export-privacy",
        "rollback-policy",
        "deprecation-policy",
      ]),
    )
  })

  it("v1.32 supported language registry is the product semantics source", () => {
    expect(SUPPORTED_STRATEGY_LANGUAGES.map((language) => language.id)).toEqual(
      ["javascript", "typescript", "python", "rust", "zig"],
    )
    for (const language of SUPPORTED_STRATEGY_LANGUAGES) {
      expect(language.supportStatus).toBe("supported")
      expect(language.providerId).toMatch(/^strategy-language-provider-/)
      expect(language.publicLabel).toContain(language.label)
      expect(language.docsReference).toMatch(/^runtime\/languages#/)
      expect(language.examplesReference.length).toBeGreaterThan(0)
      expect(language.deterministicRestrictions.length).toBeGreaterThan(0)
      expect(language.privacyRules.join(" ")).toContain("Public evidence")
      expect(
        STRATEGY_RUNTIME_ADAPTER_REGISTRY.some(
          (adapter) =>
            adapter.id === language.defaultAdapterId &&
            adapter.runtimeTarget === language.runtimeTarget &&
            (adapter.supportedLanguageIds as readonly string[]).includes(
              language.id,
            ),
        ),
      ).toBe(true)
      expect(getSupportedStrategyLanguageRecord(language.id)?.providerId).toBe(
        language.providerId,
      )
      expect(
        getSupportedStrategyLanguageBySourceFormat(language.sourceFormat)?.id,
      ).toBe(language.id)
    }
    expect(
      SUPPORTED_STRATEGY_LANGUAGES.filter(
        (language) => language.countedEligibility === "eligible",
      ).map((language) => language.id),
    ).toEqual(["javascript", "typescript", "python", "rust", "zig"])
    expect(
      SUPPORTED_STRATEGY_LANGUAGES.filter(
        (language) =>
          (language as { countedEligibility: string }).countedEligibility ===
          "pending-evidence",
      ).map((language) => language.id),
    ).toEqual([])
  })

  it("v1.32 strategy language providers declare ABI and boundary posture", () => {
    expect(STRATEGY_LANGUAGE_PROVIDER_CONTRACT_VERSION).toBe(
      "strategy-language-provider-contract-v1.32",
    )
    expect(STRATEGY_LANGUAGE_PROVIDER_REGISTRY).toHaveLength(4)
    for (const language of SUPPORTED_STRATEGY_LANGUAGES) {
      const provider = getStrategyLanguageProviderRecord(language.id)
      expect(provider?.id).toBe(language.providerId)
      expect(provider?.contractVersion).toBe(
        STRATEGY_LANGUAGE_PROVIDER_CONTRACT_VERSION,
      )
      expect(provider?.runtimeAbiVersion).toBe(STRATEGY_RUNTIME_ABI_VERSION)
      expect(provider?.executionOwner).toBe("runtime-service")
      expect(provider?.selectionPolicy).toBe("runtime-broker-registry")
      expect(provider?.failureTaxonomy).toMatchObject({
        strategyFailureKind: "runtimeViolation",
        systemFailureKind: "systemFailure",
        publicDiagnostics: "redacted",
      })
      expect(provider?.boundaryRules).toContain(
        "web-api-go-may-not-execute-strategy-code",
      )
      expect(provider?.migrationNotes.length).toBeGreaterThan(0)
    }
    expect(getStrategyLanguageProviderRecord("rust")?.abiPosture).toBe(
      "wasi-preview1-stdin-stdout-json",
    )
    expect(getStrategyLanguageProviderRecord("zig")?.abiPosture).toBe(
      "wasi-preview1-stdin-stdout-json",
    )
    expect(
      validateStrategyLanguageProviderRuntimeCompatibility(
        defaultRuntimeMetadata("typescript"),
      ),
    ).toEqual([])
    expect(
      validateStrategyLanguageProviderRuntimeCompatibility({
        ...defaultRuntimeMetadata("typescript"),
        adapter: {
          id: "runtime-python-subprocess-experimental",
          version: "0.1.0-experimental",
        },
      }).sort(),
    ).toEqual(
      ["provider-adapter-mismatch", "provider-runtime-target-mismatch"].sort(),
    )
  })

  it("v1.17 runtime broker registry uses exact metadata and promotes Python counted eligibility", () => {
    const jsRuntime = defaultRuntimeMetadata()
    const pythonRuntime = {
      abiVersion: STRATEGY_RUNTIME_ABI_VERSION,
      language: { id: "python", version: "3.9" },
      adapter: {
        id: "runtime-python-subprocess-experimental",
        version: "0.1.0-experimental",
      },
      package: { mode: "none", entrypoint: "module" },
      requiredCapabilities: [],
      limits:
        STRATEGY_RUNTIME_ADAPTER_REGISTRY.find(
          (adapter) => adapter.id === "runtime-python-subprocess-experimental",
        )?.limits ?? jsRuntime.limits,
    }

    expect(RUNTIME_BROKER_REGISTRY_VERSION).toBe(
      "runtime-broker-registry-v1.17",
    )
    expect(RUNTIME_BROKER_REGISTRY).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          languageId: "typescript",
          runtimeTarget: "runtime-js",
          countedResultsAllowed: true,
        }),
        expect.objectContaining({
          languageId: "python",
          runtimeTarget: "runtime-python",
          adapterId: "runtime-python-subprocess-experimental",
          enabledForNormalPlay: true,
          countedResultsAllowed: true,
        }),
        expect.objectContaining({
          languageId: "rust",
          runtimeTarget: "runtime-wasm-wasi",
          adapterId: "runtime-wasm-wasi-wasmtime-preview1",
          enabledForNormalPlay: true,
          countedResultsAllowed: true,
        }),
      ]),
    )
    expect(validateRuntimeBrokerRegistryMatch(pythonRuntime)).toHaveLength(0)
    expect(
      validateRuntimeBrokerRegistryMatch({
        ...pythonRuntime,
        adapter: { ...pythonRuntime.adapter, version: "drifted" },
      }).map((issue) => issue.code),
    ).toContain("INCOMPATIBLE_ADAPTER")
  })

  it("WASM/WASI Rust metadata is counted eligible and artifact-backed", () => {
    const wasmLimits =
      STRATEGY_RUNTIME_ADAPTER_REGISTRY.find(
        (adapter) => adapter.id === "runtime-wasm-wasi-wasmtime-preview1",
      )?.limits ?? defaultRuntimeMetadata().limits
    const rustRuntime = {
      abiVersion: STRATEGY_RUNTIME_ABI_VERSION,
      language: { id: "rust", version: "1.95.0-wasm32-wasip1" },
      adapter: {
        id: "runtime-wasm-wasi-wasmtime-preview1",
        version: "0.1.0-alpha",
      },
      package: { mode: "none", entrypoint: "_start" },
      requiredCapabilities: [],
      limits: wasmLimits,
    }

    expect(validateRuntimeBrokerRegistryMatch(rustRuntime)).toHaveLength(0)
    expect(
      evaluateStrategyRuntimeCountedEligibility(rustRuntime),
    ).toMatchObject({
      ok: true,
    })
    expect(describeStrategyRuntimeProductSemantics(rustRuntime)).toMatchObject({
      languageLabel: "Rust",
      adapterLabel: "WASM/WASI Wasmtime Preview 1",
      countedPlayEligible: true,
      countedPlayLabel: "Counted eligible",
      examplesReference: "examples/rust-wasi-strategy",
    })
  })

  it("runtime policy validation exposes Phase 54 stable issue codes", () => {
    expect(STRATEGY_RUNTIME_PRODUCT_VALIDATION_CODES).toEqual([
      "UNSUPPORTED_LANGUAGE",
      "UNSUPPORTED_PACKAGE_METADATA",
      "INCOMPATIBLE_ADAPTER",
      "ABI_MISMATCH",
      "SOURCE_TOO_LARGE",
      "MEMORY_LIMIT_EXCEEDED",
      "TIMEOUT",
      "FORBIDDEN_CAPABILITY",
      "NON_COUNTED_RUNTIME",
    ])

    const declaredPackageRuntime = {
      ...defaultRuntimeMetadata(),
      package: {
        mode: "declared",
        entrypoint: "default",
        manifestHash: "manifest-hash",
      },
    }
    const issues = validateStrategyRuntimeMetadataPolicy(declaredPackageRuntime)

    expect(issues.map((issue) => issue.code)).toContain(
      "UNSUPPORTED_PACKAGE_METADATA",
    )
  })

  it("SoldierInactivityExplanationCauseSchema accepts every required cause", () => {
    expect(
      SOLDIER_INACTIVITY_EXPLANATION_CAUSES.map((cause) =>
        SoldierInactivityExplanationCauseSchema.parse(cause),
      ),
    ).toEqual([
      "not_selected",
      "invalid_action",
      "blocked_movement",
      "timeout",
      "thrown_exception",
      "stone",
      "fallen",
      "match_ended",
    ])
  })

  it("SoldierInactivityExplanationDtoSchema requires core explanation fields", () => {
    const explanation = {
      soldierId: "bottom-1",
      playerId: "bottom",
      sequence: 7,
      cause: "blocked_movement",
      label: "Move was blocked",
      remediation: "Choose a path that is not occupied or blocked.",
    }

    expect(SoldierInactivityExplanationDtoSchema.parse(explanation)).toEqual(
      explanation,
    )

    for (const field of [
      "soldierId",
      "sequence",
      "cause",
      "label",
      "remediation",
    ] as const) {
      const withoutField = { ...explanation }
      delete withoutField[field]

      expect(
        SoldierInactivityExplanationDtoSchema.safeParse(withoutField).success,
      ).toBe(false)
    }
  })

  it("SoldierInactivityExplanationDtoSchema rejects empty copy and non-JSON details", () => {
    const explanation = {
      soldierId: "bottom-1",
      sequence: 7,
      cause: "invalid_action",
      label: "Invalid action",
      remediation: "Return a valid Action for the active Soldier.",
      details: { reason: "IMMEDIATE_REVERSAL" },
    }

    expect(SoldierInactivityExplanationDtoSchema.parse(explanation)).toEqual(
      explanation,
    )
    expect(
      SoldierInactivityExplanationDtoSchema.safeParse({
        ...explanation,
        label: "",
      }).success,
    ).toBe(false)
    expect(
      SoldierInactivityExplanationDtoSchema.safeParse({
        ...explanation,
        remediation: "",
      }).success,
    ).toBe(false)
    expect(
      SoldierInactivityExplanationDtoSchema.safeParse({
        ...explanation,
        details: { callback: () => "not-json" },
      }).success,
    ).toBe(false)
  })

  it("StrategyRevisionValidationIssueSchema accepts optional guidance fields", () => {
    const issue = {
      code: "MISSING_DEFAULT_EXPORT",
      severity: "error",
      message: "Strategy source must contain export default",
      constraint: "Strategy API requires an export default Strategy object.",
      remediation:
        "Add export default with selectActivations and soldierBrain.",
      reference: "samples/minimal-strategy",
    }

    expect(StrategyRevisionValidationIssueSchema.parse(issue)).toEqual(issue)
  })

  it("StrategyRevisionValidationIssueSchema rejects empty guidance fields", () => {
    const baseIssue = {
      code: "MISSING_DEFAULT_EXPORT",
      severity: "error",
      message: "Strategy source must contain export default",
    }

    expect(
      StrategyRevisionValidationIssueSchema.safeParse({
        ...baseIssue,
        constraint: "",
        remediation: "Add export default.",
      }).success,
    ).toBe(false)
    expect(
      StrategyRevisionValidationIssueSchema.safeParse({
        ...baseIssue,
        constraint: "Strategy API requires export default.",
        remediation: "",
      }).success,
    ).toBe(false)
  })

  it("StrategyRevisionValidationIssueSchema keeps legacy issues valid", () => {
    const issue = {
      code: "MISSING_DEFAULT_EXPORT",
      severity: "error",
      message: "Strategy source must contain export default",
    }

    expect(StrategyRevisionValidationIssueSchema.parse(issue)).toEqual(issue)
  })

  it("ChronicleSchema rejects infrastructure labels in public runtime violation payloads", () => {
    const baseEvent = {
      type: "RUNTIME_VIOLATION",
      sequence: 0,
      context: { phaseNumber: 1 },
      privacy: "public",
      payload: { type: "SYSTEM_FAILURE", playerId: "bottom" },
    }

    expect(
      ChronicleSchema.safeParse({
        schemaVersion: "chronicle-v1",
        reproducibility: {
          matchId: "match-runtime-failure",
          seed: "seed-1",
          arenaVariantId: "arena-standard",
          arenaVariantVersion: "arena-v1",
          strategyRevisionIds: ["strategy-bottom-v1", "strategy-top-v1"],
          versions: COMPATIBILITY_VERSIONS,
        },
        events: [baseEvent],
        snapshots: [],
      }).success,
    ).toBe(false)
  })

  it("at least one invalid fixture fails schema validation", () => {
    expect(
      ActionSchema.safeParse(fixtures.invalid.invalidDirection).success,
    ).toBe(false)
    expect(
      SoldierSchema.safeParse(fixtures.invalid.illegalSoldierStatus).success,
    ).toBe(false)
  })

  it("ChronicleSchema accepts a minimal replay artifact with private owner data", () => {
    const board = {
      bounds: { minX: 0, maxX: 11, minY: 0, maxY: 11 },
      soldiers: [
        {
          id: "bottom-1",
          ownerPlayerId: "bottom",
          status: "ACTIVE",
          position: { x: 5, y: 10 },
          facing: "UP",
          lastSuccessfulMoveDirection: null,
        },
        {
          id: "top-1",
          ownerPlayerId: "top",
          status: "FALLEN",
          position: null,
          facing: null,
          lastSuccessfulMoveDirection: null,
        },
      ],
      terrainStones: [],
    }

    const chronicle = {
      schemaVersion: "chronicle-v1",
      reproducibility: {
        matchId: "match-1",
        seed: "seed-1",
        arenaVariantId: "arena-standard",
        arenaVariantVersion: "arena-v1",
        strategyRevisionIds: ["strategy-bottom-v1", "strategy-top-v1"],
        versions: COMPATIBILITY_VERSIONS,
      },
      events: [
        {
          type: "MATCH_STARTED",
          sequence: 0,
          context: { phaseNumber: 1 },
          privacy: "public",
          payload: { matchId: "match-1" },
        },
        {
          type: "ROUND_STARTED",
          sequence: 1,
          context: { phaseNumber: 1, roundNumber: 1 },
          privacy: "public",
          payload: { roundNumber: 1 },
        },
        {
          type: "ACTIVATION_STARTED",
          sequence: 2,
          context: {
            phaseNumber: 1,
            roundNumber: 1,
            activationId: "activation-1",
            activationIndex: 0,
            actingPlayerId: "bottom",
            soldierId: "bottom-1",
          },
          privacy: "public",
          payload: { soldierId: "bottom-1" },
        },
        {
          type: "AWARENESS_GRID_OBSERVED",
          sequence: 3,
          context: {
            phaseNumber: 1,
            roundNumber: 1,
            activationId: "activation-1",
            activationIndex: 0,
            cycleIndex: 0,
            actingPlayerId: "bottom",
            soldierId: "bottom-1",
          },
          privacy: "owner",
          payload: { soldierId: "bottom-1", cycleIndex: 0 },
          privateRef: "bottom.awareness.3",
        },
        {
          type: "MATCH_ENDED",
          sequence: 4,
          context: { phaseNumber: 1 },
          privacy: "public",
          payload: { type: "WIN", winnerPlayerId: "bottom" },
        },
      ],
      snapshots: [
        {
          kind: "MATCH_START",
          sequence: 0,
          context: { phaseNumber: 1 },
          board,
        },
        {
          kind: "TERMINAL",
          sequence: 4,
          context: { phaseNumber: 1 },
          board,
          outcome: { type: "WIN", winnerPlayerId: "bottom" },
        },
      ],
      private: {
        byPlayerId: {
          bottom: {
            awareness: {
              "bottom.awareness.3": {
                soldierId: "bottom-1",
                cycleIndex: 0,
                grid: "owner-only-grid",
              },
            },
          },
        },
      },
      integrity: {
        algorithm: "sha256",
        normalizedContentHash: "hash-fixture",
      },
    }

    expect(ChronicleSchema.parse(chronicle)).toEqual(chronicle)
  })

  it("StrategyRevisionSchema accepts a valid runtime-js revision artifact", () => {
    const source =
      "export default { selectActivations() {}, soldierBrain() {} }"
    const revision = {
      id: "strategy-revision:abc123",
      strategyId: "strategy-1",
      source,
      sourceHash: "abc123",
      sourceBytes: new TextEncoder().encode(source).length,
      runtime: defaultRuntimeMetadata(),
      engineCompatibility: {
        spec: COMPATIBILITY_VERSIONS.spec,
        engine: COMPATIBILITY_VERSIONS.engine,
      },
      validation: {
        valid: true,
        errors: [],
        warnings: [],
        sourceBytes: new TextEncoder().encode(source).length,
        forbiddenPatterns: [],
        sourceHash: "abc123",
        runtimeVersion: COMPATIBILITY_VERSIONS.runtimeJs,
        engineCompatibility: {
          spec: COMPATIBILITY_VERSIONS.spec,
          engine: COMPATIBILITY_VERSIONS.engine,
        },
      },
      metadata: {
        createdBy: "user:local",
        label: "Opening test",
        notes: "Workshop note",
        tags: ["fixture"],
      },
    }

    expect(StrategyRevisionSchema.parse(revision)).toEqual(revision)
  })

  it("StrategyRevisionSchema requires immutable compiled artifacts for WASM/WASI", () => {
    const source = "fn main() {}"
    const sourceHash = "sha256:rust-source"
    const runtime = {
      abiVersion: STRATEGY_RUNTIME_ABI_VERSION,
      language: { id: "rust", version: "1.95.0-wasm32-wasip1" },
      adapter: {
        id: "runtime-wasm-wasi-wasmtime-preview1",
        version: "0.1.0-alpha",
      },
      package: { mode: "none", entrypoint: "_start" },
      requiredCapabilities: [],
      limits:
        STRATEGY_RUNTIME_ADAPTER_REGISTRY.find(
          (adapter) => adapter.id === "runtime-wasm-wasi-wasmtime-preview1",
        )?.limits ?? defaultRuntimeMetadata().limits,
    }
    const revision = {
      id: "strategy-revision:rust-wasi",
      source,
      sourceHash,
      sourceBytes: new TextEncoder().encode(source).length,
      runtime,
      engineCompatibility: {
        spec: COMPATIBILITY_VERSIONS.spec,
        engine: COMPATIBILITY_VERSIONS.engine,
      },
      validation: {
        valid: true,
        errors: [],
        warnings: [],
        sourceBytes: new TextEncoder().encode(source).length,
        forbiddenPatterns: [],
        sourceHash,
        runtimeVersion: "0.1.0-alpha",
        engineCompatibility: {
          spec: COMPATIBILITY_VERSIONS.spec,
          engine: COMPATIBILITY_VERSIONS.engine,
        },
      },
      metadata: {},
    }

    expect(StrategyRevisionSchema.safeParse(revision).success).toBe(false)
    expect(
      StrategyRevisionSchema.parse({
        ...revision,
        metadata: {
          compiledArtifact: {
            format: "wasm",
            hash: "sha256:artifact",
            bytes: 128,
            bytesBase64: "AGFzbQ==",
            sourceHash,
            wasiProfile: "preview1",
            targetTriple: "wasm32-wasip1",
            abiEnvelope: "stdin-stdout-json",
            abiVersion: STRATEGY_RUNTIME_ABI_VERSION,
            validationStatus: "valid",
            createdAt: "1970-01-01T00:00:00.000Z",
            toolchain: {
              language: "rust",
              compiler: "rustc",
              compilerVersion: "rustc fixture",
              targetTriple: "wasm32-wasip1",
              commandSummary:
                "rustc --target wasm32-wasip1 -O strategy.rs -o strategy.wasm",
            },
            publicEvidence: {
              label: "Rust WASM/WASI counted provider artifact",
              nonCounted: false,
              sandboxClaim: "candidate-readiness-only",
            },
          },
        },
      }).metadata.compiledArtifact?.hash,
    ).toBe("sha256:artifact")
  })

  it("StrategyArtifactSchema accepts built-in forkable artifacts with generic and legacy lineage", () => {
    const source =
      "export default { selectActivations() {}, soldierBrain() {} }"
    const runtime = defaultRuntimeMetadata()
    const sourceHash = "sha256:starter-artifact"
    const compatibilityKey = JSON.stringify(
      runtimeCompatibilityKey({
        runtime,
        sourceHash,
        specVersion: COMPATIBILITY_VERSIONS.spec,
        engineVersion: COMPATIBILITY_VERSIONS.engine,
      }),
    )
    const artifact = {
      id: "strategy-artifact:starter:centerline-bully",
      kind: "starter",
      sourceVisibility: "built-in-forkable",
      forkEligibility: { forkable: true },
      source: {
        text: source,
        hash: sourceHash,
        bytes: new TextEncoder().encode(source).length,
        format: "python",
        entrypoint: "default",
      },
      runtime,
      engineCompatibility: {
        spec: COMPATIBILITY_VERSIONS.spec,
        engine: COMPATIBILITY_VERSIONS.engine,
      },
      validation: {
        valid: true,
        errors: [],
        warnings: [],
        sourceBytes: new TextEncoder().encode(source).length,
        forbiddenPatterns: [],
        sourceHash,
        runtimeVersion: COMPATIBILITY_VERSIONS.runtimeJs,
        engineCompatibility: {
          spec: COMPATIBILITY_VERSIONS.spec,
          engine: COMPATIBILITY_VERSIONS.engine,
        },
      },
      publicMetadata: {
        name: "Centerline Bully",
        description: "Starter Strategy",
        tags: ["Starter"],
        version: "v1.4",
      },
      lineage: {
        starterLineage: {
          starterId: "starter:centerline-bully",
          starterName: "Centerline Bully",
          starterVersion: "v1.4",
          sourceHash,
        },
      },
      immutableEligibility: {
        lockedAt: "2026-05-23T00:00:00.000Z",
        sourceHash,
        validationStatus: "valid",
        countedRuntimeEligible: true,
        runtimeCompatibility: compatibilityKey,
        engineCompatibility: {
          spec: COMPATIBILITY_VERSIONS.spec,
          engine: COMPATIBILITY_VERSIONS.engine,
        },
      },
      behaviorCompatibility: {
        compatibilityKey,
        behaviorSignificantFields: [
          "sourceHash",
          "runtime",
          "engineCompatibility",
        ],
      },
    }

    expect(StrategyArtifactSchema.parse(artifact)).toEqual(artifact)
  })

  it("StrategyArtifactSchema rejects forkable artifacts with broken source invariants", () => {
    const source =
      "export default { selectActivations() {}, soldierBrain() {} }"
    const sourceBytes = new TextEncoder().encode(source).length
    const sourceHash = "sha256:starter-artifact"
    const baseArtifact = {
      id: "strategy-artifact:starter:centerline-bully",
      kind: "starter",
      sourceVisibility: "built-in-forkable",
      forkEligibility: { forkable: true },
      source: {
        text: source,
        hash: sourceHash,
        bytes: sourceBytes,
        format: "typescript",
        entrypoint: "default",
      },
      runtime: defaultRuntimeMetadata(),
      engineCompatibility: {
        spec: COMPATIBILITY_VERSIONS.spec,
        engine: COMPATIBILITY_VERSIONS.engine,
      },
      validation: {
        valid: true,
        errors: [],
        warnings: [],
        sourceBytes,
        forbiddenPatterns: [],
        sourceHash,
        runtimeVersion: COMPATIBILITY_VERSIONS.runtimeJs,
        engineCompatibility: {
          spec: COMPATIBILITY_VERSIONS.spec,
          engine: COMPATIBILITY_VERSIONS.engine,
        },
      },
      publicMetadata: { name: "Centerline Bully" },
      lineage: {},
      behaviorCompatibility: {
        compatibilityKey: "key",
        behaviorSignificantFields: ["sourceHash"],
      },
    }

    expect(
      StrategyArtifactSchema.safeParse({
        ...baseArtifact,
        source: { ...baseArtifact.source, text: undefined },
      }).success,
    ).toBe(false)
    expect(
      StrategyArtifactSchema.safeParse({
        ...baseArtifact,
        source: { ...baseArtifact.source, bytes: sourceBytes + 1 },
      }).success,
    ).toBe(false)
    expect(
      StrategyArtifactSchema.safeParse({
        ...baseArtifact,
        validation: {
          ...baseArtifact.validation,
          sourceHash: "sha256:different",
        },
      }).success,
    ).toBe(false)
  })

  it("StrategyArtifactPublicSummarySchema is source-safe by construction", () => {
    const summary = {
      id: "strategy-artifact:template:cautious",
      kind: "template",
      sourceVisibility: "public-summary-only",
      forkEligibility: {
        forkable: false,
        reason: "summary-only",
      },
      sourceHash: "sha256:template",
      sourceBytes: 256,
      sourceFormat: "typescript",
      runtime: {
        ...defaultRuntimeMetadata(),
        limits: undefined,
      },
      engineCompatibility: {
        spec: COMPATIBILITY_VERSIONS.spec,
        engine: COMPATIBILITY_VERSIONS.engine,
      },
      validationStatus: "valid",
      publicMetadata: { label: "Cautious" },
      lineage: {},
    }
    const { limits: _limits, ...runtime } = defaultRuntimeMetadata()

    expect(
      StrategyArtifactPublicSummarySchema.parse({ ...summary, runtime }),
    ).not.toHaveProperty("source")
    expect(
      StrategyArtifactPublicSummarySchema.safeParse({
        ...summary,
        runtime,
        source: "private",
      }).success,
    ).toBe(false)
    expect(
      StrategyArtifactSchema.safeParse({
        id: "strategy-artifact:account:private",
        kind: "account-revision",
        sourceVisibility: "built-in-forkable",
        forkEligibility: { forkable: true },
        source: {
          text: "export default {}",
          hash: "sha256:private",
          bytes: 17,
          format: "typescript",
          entrypoint: "default",
        },
        runtime: defaultRuntimeMetadata(),
        engineCompatibility: {
          spec: COMPATIBILITY_VERSIONS.spec,
          engine: COMPATIBILITY_VERSIONS.engine,
        },
        validation: {
          valid: true,
          errors: [],
          warnings: [],
          sourceBytes: 17,
          forbiddenPatterns: [],
          sourceHash: "sha256:private",
          runtimeVersion: COMPATIBILITY_VERSIONS.runtimeJs,
          engineCompatibility: {
            spec: COMPATIBILITY_VERSIONS.spec,
            engine: COMPATIBILITY_VERSIONS.engine,
          },
        },
        publicMetadata: {},
        lineage: {},
        behaviorCompatibility: {
          compatibilityKey: "key",
          behaviorSignificantFields: ["sourceHash"],
        },
      }).success,
    ).toBe(false)
  })

  it("StrategyRevisionSchema rejects oversized source", () => {
    const source = "x".repeat(STRATEGY_SOURCE_BYTES + 1)

    expect(
      StrategyRevisionSchema.safeParse({
        id: "strategy-revision:oversized",
        source,
        sourceHash: "oversized",
        sourceBytes: STRATEGY_SOURCE_BYTES + 1,
        runtime: defaultRuntimeMetadata(),
        engineCompatibility: {
          spec: COMPATIBILITY_VERSIONS.spec,
          engine: COMPATIBILITY_VERSIONS.engine,
        },
        validation: {
          valid: true,
          errors: [],
          warnings: [],
          sourceBytes: STRATEGY_SOURCE_BYTES + 1,
          forbiddenPatterns: [],
          sourceHash: "oversized",
          runtimeVersion: COMPATIBILITY_VERSIONS.runtimeJs,
          engineCompatibility: {
            spec: COMPATIBILITY_VERSIONS.spec,
            engine: COMPATIBILITY_VERSIONS.engine,
          },
        },
        metadata: {},
      }).success,
    ).toBe(false)
  })

  it("StrategyRevisionValidationReportSchema accepts oversized-source reports", () => {
    const report = {
      valid: false,
      errors: [
        {
          code: "SOURCE_TOO_LARGE",
          severity: "error",
          message: "Strategy source exceeds 65536 bytes",
          constraint: "Strategy source must stay within the source byte limit.",
          remediation:
            "Remove unused helper code or comments before validating again.",
        },
      ],
      warnings: [],
      sourceBytes: STRATEGY_SOURCE_BYTES + 1,
      forbiddenPatterns: [],
      sourceHash: "oversized",
      runtimeVersion: COMPATIBILITY_VERSIONS.runtimeJs,
      engineCompatibility: {
        spec: COMPATIBILITY_VERSIONS.spec,
        engine: COMPATIBILITY_VERSIONS.engine,
      },
    }

    expect(StrategyRevisionValidationReportSchema.parse(report)).toEqual(report)
  })

  it("StrategyRevisionSchema rejects reports where valid: true has errors", () => {
    const source =
      "export default { selectActivations() {}, soldierBrain() {} }"

    expect(
      StrategyRevisionSchema.safeParse({
        id: "strategy-revision:invalid-report",
        source,
        sourceHash: "invalid-report",
        sourceBytes: new TextEncoder().encode(source).length,
        runtime: defaultRuntimeMetadata(),
        engineCompatibility: {
          spec: COMPATIBILITY_VERSIONS.spec,
          engine: COMPATIBILITY_VERSIONS.engine,
        },
        validation: {
          valid: true,
          errors: [
            {
              code: "MISSING_DEFAULT_EXPORT",
              severity: "error",
              message: "Missing export default",
            },
          ],
          warnings: [],
          sourceBytes: new TextEncoder().encode(source).length,
          forbiddenPatterns: [],
          sourceHash: "invalid-report",
          runtimeVersion: COMPATIBILITY_VERSIONS.runtimeJs,
          engineCompatibility: {
            spec: COMPATIBILITY_VERSIONS.spec,
            engine: COMPATIBILITY_VERSIONS.engine,
          },
        },
        metadata: {},
      }).success,
    ).toBe(false)
  })

  it("defines exhibition presets with public leak-safe result contracts", () => {
    expect(COMPETITION_PRESET_IDS).toEqual([
      "smoke-exhibition-v1",
      "standard-exhibition-v1",
    ])
    expect(getCompetitionPreset("smoke-exhibition-v1")).toMatchObject({
      entrantCount: { min: 2, max: 8 },
      mirroredPairwise: true,
      visibility: "public",
      scoringPolicy: {
        winPoints: 3,
        drawPoints: 1,
        lossPoints: 0,
        strategyFailurePenaltyPoints: -1,
      },
    })
    expect(() =>
      assertPublicMatchSetResultLeakSafe({
        matchSetId: "match-set:public",
        sourceHash: "public-hash",
      }),
    ).not.toThrow()
    expect(() =>
      assertPublicMatchSetResultLeakSafe({
        entrants: [{ source: "private strategy code" }],
      }),
    ).toThrow(/private field/)
  })

  it("defines owner-safe analytics summaries with stable evidence bands", () => {
    expect(
      deriveAnalyticsEvidenceBand({
        counted: true,
        completedCount: 8,
        replayBackedCount: 8,
        totalCount: 8,
        systemFailureCount: 0,
        degraded: false,
        strongEvidenceThreshold: 4,
      }),
    ).toBe("strong")
    expect(
      deriveAnalyticsEvidenceBand({
        counted: true,
        completedCount: 1,
        replayBackedCount: 1,
        totalCount: 1,
        systemFailureCount: 0,
        degraded: false,
        strongEvidenceThreshold: 4,
      }),
    ).toBe("thin")
    expect(
      deriveAnalyticsEvidenceBand({
        counted: true,
        completedCount: 8,
        replayBackedCount: 8,
        totalCount: 8,
        systemFailureCount: 1,
        degraded: false,
        strongEvidenceThreshold: 4,
      }),
    ).toBe("system_failed")

    const summary = {
      summarySchemaVersion: ANALYTICS_SUMMARY_SCHEMA_VERSION,
      profileId: "analytics-profile:demo",
      runId: "analytics-run:demo:2",
      ownerUserId: "user:local",
      lifecycleStatus: "complete",
      compatibility: {
        hash: "compat-hash",
        equivalent: true,
        mismatches: [],
        key: {
          profileSchemaVersion: ANALYTICS_PROFILE_SCHEMA_VERSION,
          candidateRevisionIds: ["revision:sentinel"],
          opponentRevisionIds: ["revision:opponent"],
          presetId: "standard-v1",
          seeds: ["seed:001"],
          mirrorSides: true,
          scoringPolicyVersion: "matchset-scoring-v1",
          ruleVersion: "rules-v1.6",
          chronicleVersion: "chronicle-v1.4",
          runtimeAdapter: "runtime-js",
          runtimeVersion: "runtime-js-v1",
          matrixOrder: ["revision:sentinel|revision:opponent|seed:001"],
        },
      },
      totals: {
        wins: 1,
        losses: 0,
        draws: 0,
        points: 3,
        matchups: 1,
        completedMatches: 1,
        failedMatches: 0,
      },
      matchupRecords: [
        {
          candidate: {
            revisionId: "revision:sentinel",
            label: "Sentinel",
            sourceHash: "hash-sentinel",
            tags: ["Local"],
          },
          opponent: {
            opponentId: "starter:centerline-bully",
            revisionId: "revision:opponent",
            label: "Centerline Bully",
            sourceHash: "hash-opponent",
            tags: ["Starter"],
            tier: "starter",
            archetypeTags: ["pressure"],
          },
          matchSetId: "match-set:analytics:demo",
          matchIds: ["match:demo"],
          wins: 1,
          losses: 0,
          draws: 0,
          points: 3,
          failureCount: 0,
          sideBias: "balanced",
          evidence: {
            band: "strong",
            counted: true,
            completedCount: 1,
            replayBackedCount: 1,
            totalCount: 1,
            failureCount: 0,
            systemFailureCount: 0,
            notes: ["Replay-backed deterministic summary."],
          },
          replayReferences: [
            {
              matchId: "match:demo",
              momentType: "DECISIVE_PUSH",
              sequence: 12,
              label: "Decisive push",
              side: "bottom",
              fallbackState: "available",
              href: "/matches/match%3Ademo/replay?moment=DECISIVE_PUSH&sequence=12",
            },
          ],
        },
      ],
      provenance: {
        matchSetIds: ["match-set:analytics:demo"],
        generatedAt: "2026-05-22T00:00:00.000Z",
        runSchemaVersion: ANALYTICS_RUN_SCHEMA_VERSION,
      },
      privacy: {
        ownerSafe: true,
        publicFieldsExcluded: [
          "strategy code",
          "private strategy state",
          "private soldier state",
          "activation payloads",
        ],
      },
    } satisfies AnalyticsGauntletRunSummary

    expect(AnalyticsGauntletRunSummarySchema.parse(summary)).toEqual(summary)
    expect(() => assertAnalyticsPublicSummaryLeakSafe(summary)).not.toThrow()
    expect(() =>
      assertAnalyticsPublicSummaryLeakSafe({
        matchupRecords: [{ ownerDebug: "private" }],
      }),
    ).toThrow(/private field/)
    expect(() =>
      assertAnalyticsPublicSummaryLeakSafe({
        matchupRecords: [{ Strategy_Memory: "private" }],
      }),
    ).toThrow(/private field/)
    expect(
      AnalyticsGauntletRunSummarySchema.safeParse({
        ...summary,
        metadata: { objective_payload: "private" },
      }).success,
    ).toBe(false)
  })

  it("RuntimeExecutionServiceRequestSchema accepts complete v1.15 Match execution inputs", () => {
    const source =
      "export default { selectActivations() {}, soldierBrain() {} }"
    const sourceBytes = new TextEncoder().encode(source).length
    const revision = (id: string) => ({
      id,
      source,
      sourceHash: `hash:${id}`,
      sourceBytes,
      runtime: defaultRuntimeMetadata(),
      engineCompatibility: {
        spec: COMPATIBILITY_VERSIONS.spec,
        engine: COMPATIBILITY_VERSIONS.engine,
      },
      validation: {
        valid: true,
        errors: [],
        warnings: [],
        sourceBytes,
        forbiddenPatterns: [],
        sourceHash: `hash:${id}`,
        runtimeVersion: COMPATIBILITY_VERSIONS.runtimeJs,
        engineCompatibility: {
          spec: COMPATIBILITY_VERSIONS.spec,
          engine: COMPATIBILITY_VERSIONS.engine,
        },
      },
      metadata: {},
    })
    const request = {
      contractVersion: RUNTIME_EXECUTION_SERVICE_VERSION,
      kind: "executeMatch",
      requestId: "runtime-request:spec",
      match: {
        matchId: "match:runtime-service-spec",
        seed: "seed:runtime-service-spec",
        arenaVariant: fixtures.valid.standardArenaVariant,
        bottomPlayerId: "player:bottom",
        topPlayerId: "player:top",
        bottomStrategyRevisionId: "strategy-revision:bottom",
        topStrategyRevisionId: "strategy-revision:top",
        maxPhases: 2,
      },
      strategies: {
        bottom: revision("strategy-revision:bottom"),
        top: revision("strategy-revision:top"),
      },
      limits: defaultRuntimeMetadata().limits,
    }

    expect(RuntimeExecutionServiceRequestSchema.parse(request)).toEqual(request)
    expect(
      RuntimeExecutionServiceRequestSchema.parse({
        ...request,
        match: {
          ...request.match,
          topStrategyRevisionId: request.match.bottomStrategyRevisionId,
        },
        strategies: {
          ...request.strategies,
          top: request.strategies.bottom,
        },
      }),
    ).toMatchObject({
      match: {
        bottomStrategyRevisionId: "strategy-revision:bottom",
        topStrategyRevisionId: "strategy-revision:bottom",
      },
    })
    expect(
      RuntimeExecutionServiceRequestSchema.safeParse({
        ...request,
        strategies: {
          ...request.strategies,
          bottom: { ...request.strategies.bottom, sourceBytes: 1 },
        },
      }).success,
    ).toBe(false)
    expect(
      RuntimeExecutionServiceRequestSchema.safeParse({
        ...request,
        limits: {
          ...request.limits,
          timeoutMs: request.limits.timeoutMs + 1_000_000,
        },
      }).success,
    ).toBe(false)
  })

  it("RuntimeExecutionServiceResponseSchema accepts success and system-failure envelopes", () => {
    const board = {
      bounds: fixtures.valid.standardArenaVariant.initialBounds,
      soldiers: fixtures.valid.standardInitialSoldiers.map(
        ({ soldierMemory: _soldierMemory, ...soldier }) => soldier,
      ),
      terrainStones: fixtures.valid.standardArenaVariant.terrainStones,
    }
    const chronicle = {
      schemaVersion: "chronicle-v1.4",
      reproducibility: {
        matchId: "match:runtime-service-spec",
        seed: "seed:runtime-service-spec",
        arenaVariantId: fixtures.valid.standardArenaVariant.id,
        arenaVariantVersion: COMPATIBILITY_VERSIONS.arenaVariant,
        strategyRevisionIds: [
          "strategy-revision:bottom",
          "strategy-revision:top",
        ],
        versions: COMPATIBILITY_VERSIONS,
      },
      events: [
        {
          type: "MATCH_STARTED",
          sequence: 0,
          context: {},
          privacy: "public",
          payload: {
            matchId: "match:runtime-service-spec",
            seed: "seed:runtime-service-spec",
          },
        },
      ],
      snapshots: [
        {
          kind: "MATCH_START",
          sequence: 0,
          context: {},
          board,
        },
      ],
    }
    const finalState = {
      matchId: "match:runtime-service-spec",
      seed: "seed:runtime-service-spec",
      versions: COMPATIBILITY_VERSIONS,
      arenaVariant: fixtures.valid.standardArenaVariant,
      players: [
        {
          id: "player:bottom",
          side: "bottom",
          strategyRevisionId: "strategy-revision:bottom",
          strategyMemory: {},
        },
        {
          id: "player:top",
          side: "top",
          strategyRevisionId: "strategy-revision:top",
          strategyMemory: {},
        },
      ],
      phase: "ROUND",
      phaseNumber: 1,
      roundNumber: 1,
      activationCount: 1,
      initiativePlayerId: "player:bottom",
      bounds: fixtures.valid.standardArenaVariant.initialBounds,
      soldiers: fixtures.valid.standardInitialSoldiers,
      terrainStones: [],
    }
    const success = {
      contractVersion: RUNTIME_EXECUTION_SERVICE_VERSION,
      ok: true,
      kind: "executionResult",
      requestId: "runtime-request:spec",
      matchId: "match:runtime-service-spec",
      runtimeAbiVersion: STRATEGY_RUNTIME_ABI_VERSION,
      result: {
        privacy: "internal_runtime_result",
        chronicle,
        finalState,
        runtimeViolationEventCount: 0,
      },
    }
    const systemFailure = {
      contractVersion: RUNTIME_EXECUTION_SERVICE_VERSION,
      ok: false,
      kind: "systemFailure",
      requestId: "runtime-request:spec",
      matchId: "match:runtime-service-spec",
      runtimeAbiVersion: STRATEGY_RUNTIME_ABI_VERSION,
      systemFailure: {
        code: "SOURCE_HASH_MISMATCH",
        message: "Runtime execution request failed source validation.",
        publicMessage: "Runtime execution failed before Match execution.",
        retryable: false,
        diagnostics: {
          reason: "source-hash-mismatch",
          slot: "bottom",
        },
      },
    }

    expect(RuntimeExecutionServiceResponseSchema.parse(success)).toEqual(
      success,
    )
    expect(RuntimeExecutionServiceResponseSchema.parse(systemFailure)).toEqual(
      systemFailure,
    )
  })

  it("publishes the v1.16 Strategy Execution Service / Runtime Broker boundary contract", () => {
    expect(RUNTIME_EXECUTION_SERVICE_VERSION).toBe(
      "runtime-execution-service-v1.15",
    )
    expect(RUNTIME_EXECUTION_SERVICE_BOUNDARY_CONTRACT).toMatchObject({
      publicName: "Strategy Execution Service / Runtime Broker",
      currentImplementationLabel: "isolated JS/TS runtime service",
      contractVersion: "runtime-execution-service-v1.15",
      runtimeAbiVersion: "strategy-runtime-abi-v1.14",
    })
    expect(RUNTIME_EXECUTION_SERVICE_CURRENT_IMPLEMENTATION).toMatchObject({
      label: "isolated JS/TS runtime service",
      role: "current-http-json-binding",
      notBackend: true,
      notFinalRuntimeBroker: true,
    })
    expect(RUNTIME_EXECUTION_SERVICE_TRANSPORT_BINDING).toMatchObject({
      current: "HTTP+JSON",
      transportNeutralContract: true,
      replacementPolicy:
        "Future brokers may front or replace this binding without changing Go orchestration, persistence, scoring, or public evidence ownership.",
    })
    expect(RUNTIME_EXECUTION_SERVICE_AUTHORITY_POLICY.disallowed).toEqual(
      expect.arrayContaining([
        "claim-jobs",
        "complete-matches",
        "persist-chronicles",
        "refresh-matchset-scoring",
        "serve-product-api-routes",
        "read-web-session-state",
        "deliver-public-evidence",
        "fallback-to-retired-typescript-backend",
      ]),
    )
    expect(
      RUNTIME_EXECUTION_SERVICE_FAILURE_PRIVACY_POLICY.privateDenylist,
    ).toEqual(
      expect.arrayContaining([
        "Strategy source",
        "StrategyMemory",
        "SoldierMemory",
        "objective payloads",
        "owner debug",
        "raw Awareness Grid",
        "stack traces",
        "stderr",
        "sessions",
        "tokens",
        "DB DSNs",
        "host paths",
        "private runtime internals",
      ]),
    )
  })

  it("publishes public-safe v1.16 runtime service boundary artifacts covering D-01 through D-18", () => {
    const artifact = JSON.parse(
      readFileSync(
        new URL(
          "../../../.planning/artifacts/v1.16-runtime-service-boundary.json",
          import.meta.url,
        ),
        "utf8",
      ),
    )
    const markdown = readFileSync(
      new URL(
        "../../../.planning/artifacts/v1.16-runtime-service-boundary.md",
        import.meta.url,
      ),
      "utf8",
    )

    for (const key of [
      "strategyExecutionService",
      "currentImplementation",
      "transport",
      "runtimeAbi",
      "authority",
      "submissionArtifactPolicy",
      "failurePrivacy",
      "noFallback",
      "nonPromotion",
    ]) {
      expect(artifact).toHaveProperty(key)
    }

    expect(artifact.strategyExecutionService.publicName).toBe(
      "Strategy Execution Service / Runtime Broker",
    )
    expect(artifact.currentImplementation.label).toBe(
      "isolated JS/TS runtime service",
    )
    expect(artifact.transport.currentBinding).toBe("HTTP+JSON")
    expect(artifact.runtimeAbi).toMatchObject({
      serviceContractVersion: "runtime-execution-service-v1.15",
      strategyRuntimeAbiVersion: "strategy-runtime-abi-v1.14",
      languageSpecificShortcutsAllowed: false,
    })
    expect(artifact.decisionCoverage).toEqual([
      "D-01",
      "D-02",
      "D-03",
      "D-04",
      "D-05",
      "D-06",
      "D-07",
      "D-08",
      "D-09",
      "D-10",
      "D-11",
      "D-12",
      "D-13",
      "D-14",
      "D-15",
      "D-16",
      "D-17",
      "D-18",
    ])
    expect(artifact.nonPromotion).toMatchObject({
      wasmWasiComponentModelPromoted: false,
      nodeWasiAcceptedAsSandbox: false,
      countedNonJsPlayPromoted: false,
      productionSandboxReplacementPromoted: false,
    })

    const publicArtifactText = `${JSON.stringify(artifact)}\n${markdown}`
    for (const forbidden of [
      "StrategyMemory:",
      "SoldierMemory:",
      "objectivePayload:",
      "ownerToken:",
      "sessionSecret:",
      "postgres://",
      "DATABASE_URL",
      "/Users/",
      "runtime private stack",
    ]) {
      expect(publicArtifactText).not.toContain(forbidden)
    }
    expect(markdown).toContain("Strategy Execution Service / Runtime Broker")
    expect(markdown).toContain("isolated JS/TS runtime service")
    expect(markdown).toContain("not a backend")
    expect(markdown).toContain("No deferred idea is promoted in v1.16")
  })
})
