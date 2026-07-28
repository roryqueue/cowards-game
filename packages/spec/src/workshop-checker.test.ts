import { describe, expect, it } from "vitest"
import {
  WORKSHOP_CHECKER_CONTRACT_VERSION,
  categorizeValidationIssue,
  createWorkshopCheckerResponse,
  createWorkshopCheckerUnavailableResponse,
  isWorkshopCheckerSourceFormat,
} from "./workshop-checker.js"
import type {
  StrategyRevisionMetadata,
  StrategyRevisionValidationReport,
} from "./types.js"

const validReport = {
  valid: true,
  errors: [],
  warnings: [],
  sourceBytes: 42,
  forbiddenPatterns: [],
  sourceHash: "hash:source",
  runtimeVersion: "runtime-v1",
  engineCompatibility: {
    spec: "cowards-rules-v1.4",
    engine: "engine-v1",
  },
} satisfies StrategyRevisionValidationReport

describe("workshop checker contract", () => {
  it("accepts only production Workshop checker source formats", () => {
    expect(isWorkshopCheckerSourceFormat("typescript")).toBe(true)
    expect(isWorkshopCheckerSourceFormat("python")).toBe(true)
    expect(isWorkshopCheckerSourceFormat("rust")).toBe(true)
    expect(isWorkshopCheckerSourceFormat("zig")).toBe(true)
    expect(isWorkshopCheckerSourceFormat("tinygo")).toBe(false)
    expect(isWorkshopCheckerSourceFormat("go")).toBe(false)
  })

  it("builds a public-safe provider checker envelope without artifact bytes or proofs", () => {
    const metadata = {
      sourceArtifact: {
        format: "python-source-bundle",
        hash: "hash:artifact",
        bytes: 512,
        bytesBase64: "PRIVATE_ARTIFACT_BYTES",
        sourceHash: "hash:source",
        sourceBytes: 42,
        abiVersion: "strategy-runtime-abi-v1.33",
        validationStatus: "valid",
        createdAt: "2026-06-14T00:00:00.000Z",
        toolchain: {
          language: "python",
          runtime: "python3",
          runtimeVersion: "3.12",
          commandSummary: "python3 provider validation",
          validationPolicy: "python-provider-policy-v1",
        },
        publicEvidence: {
          label: "Python provider source artifact",
          nonCounted: false,
          sandboxClaim: "provenance-only",
        },
      },
      providerValidation: {
        providerId: "strategy-language-provider-python",
        contractVersion: "strategy-language-provider-contract-v1.33",
        sourceHash: "hash:source",
        sourceBytes: 42,
        artifactHash: "hash:artifact",
        artifactBytes: 512,
        proof: "hmac-sha256:secret",
      },
    } satisfies StrategyRevisionMetadata

    const checker = createWorkshopCheckerResponse({
      sourceFormat: "python",
      validation: validReport,
      metadata,
    })

    expect(checker.contractVersion).toBe(WORKSHOP_CHECKER_CONTRACT_VERSION)
    expect(checker.status).toBe("ready")
    expect(checker.language.providerId).toBe(
      "strategy-language-provider-python",
    )
    expect(checker.artifact).toMatchObject({
      kind: "source-artifact",
      format: "python-source-bundle",
      hash: "hash:artifact",
      bytes: 512,
      state: "present",
    })
    expect(JSON.stringify(checker)).not.toContain("PRIVATE_ARTIFACT_BYTES")
    expect(JSON.stringify(checker)).not.toContain("hmac-sha256")
  })

  it("distinguishes language-specific diagnostic categories", () => {
    expect(
      categorizeValidationIssue(
        {
          code: "IMPORT_NOT_ALLOWED",
          severity: "error",
          message: "import os is not allowed",
        },
        "python",
      ),
    ).toBe("forbidden_import")
    expect(
      categorizeValidationIssue(
        {
          code: "TRANSPILE_FAILED",
          severity: "error",
          message: "Rust WASI toolchain unavailable.",
        },
        "rust",
      ),
    ).toBe("toolchain_unavailable")
    expect(
      categorizeValidationIssue(
        {
          code: "FORBIDDEN_PATTERN",
          severity: "error",
          message: "Zig source contains forbidden helper",
          pattern: '@import("std")',
        },
        "zig",
      ),
    ).toBe("no_std_or_helper")
  })

  it("redacts private runtime vocabulary and host details from public diagnostics", () => {
    const checker = createWorkshopCheckerResponse({
      sourceFormat: "typescript",
      validation: {
        ...validReport,
        valid: false,
        errors: [
          {
            code: "MISSING_SELECT_ACTIVATIONS",
            severity: "error",
            message:
              'Return StrategyMemory from File "/Users/alice/game/private.ts" with Bearer abc.def token.',
            constraint: "Do not expose SoldierMemory or objectivePayload.",
            remediation: "Keep objective payload values private.",
          },
        ],
      },
    })

    const serialized = JSON.stringify(checker)
    expect(serialized).not.toContain("StrategyMemory")
    expect(serialized).not.toContain("SoldierMemory")
    expect(serialized).not.toContain("objectivePayload")
    expect(serialized).not.toContain("strategyMemory")
    expect(serialized).not.toContain("soldier_memory")
    expect(serialized).not.toContain("objective_payload")
    expect(serialized).not.toContain("/Users/alice")
    expect(serialized).not.toContain("Bearer abc.def")
    expect(checker.diagnostics[0]?.message).toContain("private strategy memory")
  })

  it("marks provider validation provenance mismatches as mismatched", () => {
    const checker = createWorkshopCheckerResponse({
      sourceFormat: "python",
      validation: validReport,
      metadata: {
        sourceArtifact: {
          format: "python-source-bundle",
          hash: "hash:artifact",
          bytes: 512,
          sourceHash: "hash:source",
          sourceBytes: 42,
          abiVersion: "strategy-runtime-abi-v1.33",
          validationStatus: "valid",
          createdAt: "2026-06-14T00:00:00.000Z",
          toolchain: {
            language: "python",
            runtime: "python3",
            runtimeVersion: "3.12",
            commandSummary: "python3 provider validation",
            validationPolicy: "python-provider-policy-v1",
          },
          publicEvidence: {
            label: "Python provider source artifact",
            nonCounted: false,
            sandboxClaim: "provenance-only",
          },
        },
        providerValidation: {
          providerId: "strategy-language-provider-python",
          contractVersion: "strategy-language-provider-contract-v1.33",
          sourceHash: "stale-source",
          sourceBytes: 42,
          artifactHash: "hash:artifact",
          artifactBytes: 512,
        },
      },
    })

    expect(checker.provenance.state).toBe("mismatched")
    expect(checker.provenance.providerProofState).toBe("mismatched")
  })

  it("does not mark provider provenance valid without a proof value", () => {
    const checker = createWorkshopCheckerResponse({
      sourceFormat: "python",
      validation: validReport,
      metadata: {
        sourceArtifact: {
          format: "python-source-bundle",
          hash: "hash:artifact",
          bytes: 512,
          sourceHash: "hash:source",
          sourceBytes: 42,
          abiVersion: "strategy-runtime-abi-v1.33",
          validationStatus: "valid",
          createdAt: "2026-06-14T00:00:00.000Z",
          toolchain: {
            language: "python",
            runtime: "python3",
            runtimeVersion: "3.12",
            commandSummary: "python3 provider validation",
            validationPolicy: "python-provider-policy-v1",
          },
          publicEvidence: {
            label: "Python provider source artifact",
            nonCounted: false,
            sandboxClaim: "provenance-only",
          },
        },
        providerValidation: {
          providerId: "strategy-language-provider-python",
          contractVersion: "strategy-language-provider-contract-v1.33",
          sourceHash: "hash:source",
          sourceBytes: 42,
          artifactHash: "hash:artifact",
          artifactBytes: 512,
        },
      } as Record<string, unknown>,
    })

    expect(checker.provenance.state).toBe("mismatched")
    expect(checker.provenance.providerProofState).toBe("mismatched")
  })

  it("does not mark provider provenance valid when artifact source identity is stale", () => {
    const checker = createWorkshopCheckerResponse({
      sourceFormat: "python",
      validation: validReport,
      metadata: {
        sourceArtifact: {
          format: "python-source-bundle",
          hash: "hash:artifact",
          bytes: 512,
          sourceHash: "stale-source",
          sourceBytes: 42,
          abiVersion: "strategy-runtime-abi-v1.33",
          validationStatus: "valid",
          createdAt: "2026-06-14T00:00:00.000Z",
          toolchain: {
            language: "python",
            runtime: "python3",
            runtimeVersion: "3.12",
            commandSummary: "python3 provider validation",
            validationPolicy: "python-provider-policy-v1",
          },
          publicEvidence: {
            label: "Python provider source artifact",
            nonCounted: false,
            sandboxClaim: "provenance-only",
          },
        },
        providerValidation: {
          providerId: "strategy-language-provider-python",
          contractVersion: "strategy-language-provider-contract-v1.33",
          sourceHash: "hash:source",
          sourceBytes: 42,
          artifactHash: "hash:artifact",
          artifactBytes: 512,
          proof: "hmac-sha256:secret",
        },
      } satisfies StrategyRevisionMetadata,
    })

    expect(checker.provenance.state).toBe("mismatched")
    expect(checker.provenance.providerProofState).toBe("mismatched")
  })

  it("creates calm unavailable states without marking source valid", () => {
    const checker = createWorkshopCheckerUnavailableResponse({
      sourceFormat: "rust",
      sourceHash: "hash:source",
      sourceBytes: 99,
      status: "toolchain_unavailable",
    })

    expect(checker.status).toBe("toolchain_unavailable")
    expect(checker.toolchain.availability).toBe("unavailable")
    expect(checker.diagnostics[0]?.actionability).toBe(
      "install_or_configure_toolchain",
    )
    expect(checker.diagnostics[0]?.message).toContain(
      "has not been judged invalid",
    )
  })
})
