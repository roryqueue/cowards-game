import { readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import {
  CURRENT_SEMANTIC_AUTHORITY_GENERATED,
  resolveSemanticAuthoritySelection,
} from "@cowards/spec"
import {
  RuntimeServiceConfigError,
  createRuntimeServiceConfig,
  selectedRuntimeServiceContract,
  selectedRuntimeServiceContractForFrozenRequest,
} from "./runtime-config.js"

describe("runtime-service compact current selection", () => {
  const currentKey =
    CURRENT_SEMANTIC_AUTHORITY_GENERATED.selection.semanticAuthorityKey
  const otherSelection = resolveSemanticAuthoritySelection({
    semanticAuthorityKey:
      currentKey === "runtime-v1.17" ? "runtime-v1.19" : "runtime-v1.17",
  })

  it("keeps live configuration on the exact compact selection", () => {
    expect(selectedRuntimeServiceContract()).toEqual(
      currentKey === "runtime-v1.17"
        ? {
            runtimeAbiVersion: "strategy-runtime-abi-v1.17",
            runtimeServiceVersion: "runtime-execution-service-v1.17",
            semanticReceiptVersion: "runtime-semantic-receipt-v1.17",
            canonicalJsonVersion: "canonical-json-v1.1",
          }
        : {
            runtimeAbiVersion: "strategy-runtime-abi-v1.19",
            runtimeServiceVersion: "runtime-execution-service-v1.18",
            semanticReceiptVersion: "runtime-semantic-receipt-v1.19",
            canonicalJsonVersion: "canonical-json-v1.1",
          },
    )

    const config = createRuntimeServiceConfig({
      strategyExecutionAdapter: "worker-thread",
      semanticReceiptSecret: "fixture-secret",
    })
    expect(
      config.resolveContractSelectionForRequest(
        CURRENT_SEMANTIC_AUTHORITY_GENERATED.selection,
      ),
    ).toEqual(config.contractSelection)
  })

  it("resolves an injected exact v1.19 file/request pair without lifecycle inference", () => {
    const candidate = resolveSemanticAuthoritySelection({
      semanticAuthorityKey: "runtime-v1.19",
    })

    expect(
      selectedRuntimeServiceContractForFrozenRequest(candidate, candidate),
    ).toEqual({
      runtimeAbiVersion: "strategy-runtime-abi-v1.19",
      runtimeServiceVersion: "runtime-execution-service-v1.18",
      semanticReceiptVersion: "runtime-semantic-receipt-v1.19",
      canonicalJsonVersion: "canonical-json-v1.1",
    })
  })

  it.each([
    [undefined, CURRENT_SEMANTIC_AUTHORITY_GENERATED.selection],
    [CURRENT_SEMANTIC_AUTHORITY_GENERATED.selection, undefined],
    [
      CURRENT_SEMANTIC_AUTHORITY_GENERATED.selection,
      otherSelection,
    ],
    [
      CURRENT_SEMANTIC_AUTHORITY_GENERATED.selection,
      {
        ...CURRENT_SEMANTIC_AUTHORITY_GENERATED.selection,
        tupleId: `sha256:${"0".repeat(64)}`,
      },
    ],
    [
      CURRENT_SEMANTIC_AUTHORITY_GENERATED.selection,
      { semanticAuthorityKey: "runtime-v1.18" },
    ],
  ])(
    "rejects omitted, stale, mixed, or unknown request selection %#",
    (file, request) => {
      expect(() =>
        selectedRuntimeServiceContractForFrozenRequest(file, request),
      ).toThrow(RuntimeServiceConfigError)
    },
  )

  it("keeps production configuration delegated and database-free", () => {
    const source = readFileSync(
      path.join(import.meta.dirname, "production-runtime-config.ts"),
      "utf8",
    )
    expect(source).toContain("createRuntimeServiceConfig")
    expect(source).toContain("resolveCurrentSemanticAuthoritySelection")
    expect(source).not.toMatch(/from ["'][^"']*(?:persistence|\bpg\b)/u)
    expect(source).not.toMatch(/DATABASE_URL|\.query\(|\.connect\(/u)
  })
})
