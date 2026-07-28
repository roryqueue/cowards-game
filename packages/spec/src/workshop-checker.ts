import {
  STRATEGY_LANGUAGE_PROVIDER_CONTRACT_VERSION,
  STRATEGY_RUNTIME_ABI_VERSION,
  getSupportedStrategyLanguageBySourceFormat,
  getStrategyLanguageProviderRecord,
  type StrategyLanguageProviderRecord,
} from "./runtime.js"
import type {
  StrategyArtifactSourceFormat,
  StrategyRevisionMetadata,
  StrategyRevisionValidationIssue,
  StrategyRevisionValidationReport,
} from "./types.js"

export const WORKSHOP_CHECKER_CONTRACT_VERSION = "workshop-checker-v1.34"
export const WORKSHOP_CHECKER_VALIDATION_POLICY =
  "workshop-provider-checker-policy-v1.34"

export type WorkshopCheckerSourceFormat = Extract<
  StrategyArtifactSourceFormat,
  "typescript" | "python" | "rust" | "zig"
>

export type WorkshopCheckerStatus =
  | "not_checked"
  | "checking"
  | "ready"
  | "invalid"
  | "stale"
  | "runtime_service_unavailable"
  | "toolchain_unavailable"
  | "system_unavailable"

export type WorkshopCheckerDiagnosticCategory =
  | "source_too_large"
  | "syntax_or_parse"
  | "strategy_api_shape"
  | "forbidden_capability"
  | "forbidden_import"
  | "package_or_dependency"
  | "compile_failed"
  | "artifact_missing"
  | "artifact_stale"
  | "artifact_mismatch"
  | "provenance_missing"
  | "provenance_mismatch"
  | "provenance_unverifiable"
  | "provider_proof_invalid"
  | "runtime_service_unavailable"
  | "toolchain_unavailable"
  | "timeout_or_limit"
  | "invalid_output_schema"
  | "unsupported_provider"
  | "system_unavailable"
  | "no_std_or_helper"

export type WorkshopCheckerDiagnosticActionability =
  | "edit_source"
  | "retry_later"
  | "check_runtime_service"
  | "install_or_configure_toolchain"
  | "contact_operator"
  | "none"

export interface WorkshopCheckerDiagnostic {
  code: string
  category: WorkshopCheckerDiagnosticCategory
  severity: "info" | "warning" | "error"
  actionability: WorkshopCheckerDiagnosticActionability
  message: string
  constraint: string | null
  remediation: string | null
  reference: string | null
  line: number | null
  column: number | null
  publicSafe: true
}

export interface WorkshopCheckerResponse {
  contractVersion: typeof WORKSHOP_CHECKER_CONTRACT_VERSION
  status: WorkshopCheckerStatus
  sourceFormat: WorkshopCheckerSourceFormat
  language: {
    id: WorkshopCheckerSourceFormat
    label: string
    providerId: string
    contractVersion: typeof STRATEGY_LANGUAGE_PROVIDER_CONTRACT_VERSION
  }
  owners: {
    validationOwner: "runtime-service" | "app-local" | "go-backend"
    buildOwner: "runtime-service" | "none"
    executionOwner: "runtime-service"
  }
  source: {
    hash: string
    bytes: number
  }
  artifact: {
    kind: "source-artifact" | "compiled-wasm" | "none"
    format: "transpiled-javascript" | "python-source-bundle" | "wasm" | "none"
    hash: string | null
    bytes: number | null
    state:
      | "not_applicable"
      | "present"
      | "missing"
      | "stale"
      | "mismatched"
      | "invalid"
  }
  provenance: {
    state:
      | "not_required"
      | "valid"
      | "missing"
      | "stale"
      | "mismatched"
      | "unverifiable"
    providerProofState:
      | "not_required"
      | "valid"
      | "missing"
      | "mismatched"
      | "invalid_signature"
  }
  runtimeService: {
    availability: "available" | "unavailable" | "not_required" | "unknown"
    publicReason: string | null
  }
  toolchain: {
    availability: "available" | "unavailable" | "not_required" | "unknown"
    languageToolchain: WorkshopCheckerSourceFormat | null
    publicReason: string | null
  }
  diagnostics: WorkshopCheckerDiagnostic[]
  cacheIdentity: {
    languageId: string
    providerId: string
    sourceHash: string
    sourceBytes: number
    artifactHash: string | null
    artifactBytes: number | null
    providerContractVersion: string
    runtimeAbiVersion: string
    validationPolicy: typeof WORKSHOP_CHECKER_VALIDATION_POLICY
    toolchainKey: string | null
  }
  privacy: {
    publicSafe: true
    redacted: true
    excludedFields: string[]
  }
}

export const WORKSHOP_CHECKER_PRIVACY_EXCLUDED_FIELDS = [
  "private Strategy source",
  "private strategy memory",
  "private soldier memory",
  "private objectives",
  "raw compiler diagnostics",
  "raw runtime diagnostics",
  "artifact bytes",
  "host paths",
  "environment values",
  "package paths",
  "tokens",
  "database details",
  "private runtime internals",
  "provider signing proof",
] as const

export const isWorkshopCheckerSourceFormat = (
  value: unknown,
): value is WorkshopCheckerSourceFormat =>
  value === "typescript" ||
  value === "python" ||
  value === "rust" ||
  value === "zig"

const artifactFormatForSourceFormat = (
  sourceFormat: WorkshopCheckerSourceFormat,
): WorkshopCheckerResponse["artifact"]["format"] =>
  sourceFormat === "typescript"
    ? "transpiled-javascript"
    : sourceFormat === "python"
      ? "python-source-bundle"
      : "wasm"

const artifactKindForSourceFormat = (
  sourceFormat: WorkshopCheckerSourceFormat,
): WorkshopCheckerResponse["artifact"]["kind"] =>
  sourceFormat === "rust" || sourceFormat === "zig"
    ? "compiled-wasm"
    : "source-artifact"

const defaultProviderId = (
  sourceFormat: WorkshopCheckerSourceFormat,
): string =>
  sourceFormat === "typescript"
    ? "strategy-language-provider-js-ts"
    : sourceFormat === "python"
      ? "strategy-language-provider-python"
      : sourceFormat === "rust"
        ? "strategy-language-provider-rust-wasi"
        : "strategy-language-provider-zig-wasi"

const providerForSourceFormat = (
  sourceFormat: WorkshopCheckerSourceFormat,
): StrategyLanguageProviderRecord | null =>
  getStrategyLanguageProviderRecord(sourceFormat)

const metadataRecord = (
  metadata:
    | StrategyRevisionMetadata
    | Record<string, unknown>
    | null
    | undefined,
): Record<string, unknown> =>
  metadata && typeof metadata === "object"
    ? (metadata as Record<string, unknown>)
    : {}

const objectRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null

const numberValue = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null

const stringValue = (value: unknown): string | null =>
  typeof value === "string" && value.length > 0 ? value : null

const artifactFromMetadata = (
  sourceFormat: WorkshopCheckerSourceFormat,
  metadata:
    | StrategyRevisionMetadata
    | Record<string, unknown>
    | null
    | undefined,
): {
  hash: string | null
  bytes: number | null
  sourceHash: string | null
  sourceBytes: number | null
  toolchainKey: string | null
} => {
  const record = metadataRecord(metadata)
  const artifact = objectRecord(
    sourceFormat === "rust" || sourceFormat === "zig"
      ? record.compiledArtifact
      : record.sourceArtifact,
  )
  if (!artifact) {
    return {
      hash: null,
      bytes: null,
      sourceHash: null,
      sourceBytes: null,
      toolchainKey: null,
    }
  }
  const toolchain = objectRecord(artifact.toolchain)
  return {
    hash: stringValue(artifact.hash),
    bytes: numberValue(artifact.bytes),
    sourceHash: stringValue(artifact.sourceHash),
    sourceBytes: numberValue(artifact.sourceBytes),
    toolchainKey:
      [
        stringValue(toolchain?.language),
        stringValue(toolchain?.compiler),
        stringValue(toolchain?.compilerVersion),
        stringValue(toolchain?.runtime),
        stringValue(toolchain?.runtimeVersion),
        stringValue(toolchain?.targetTriple),
      ]
        .filter(Boolean)
        .join(":") || null,
  }
}

const providerValidationFromMetadata = (
  metadata:
    | StrategyRevisionMetadata
    | Record<string, unknown>
    | null
    | undefined,
): Record<string, unknown> | null => {
  const providerValidation = metadataRecord(metadata).providerValidation
  return objectRecord(providerValidation)
}

const publicMessageForUnavailable = (
  sourceFormat: WorkshopCheckerSourceFormat,
  type: "runtime-service" | "toolchain" | "system",
): string => {
  const label =
    getSupportedStrategyLanguageBySourceFormat(sourceFormat)?.label ??
    sourceFormat
  if (type === "runtime-service") {
    return `${label} checker could not reach runtime-service. The Strategy has not been judged invalid.`
  }
  if (type === "toolchain") {
    return `${label} checker could not use the required toolchain. The Strategy has not been judged invalid.`
  }
  return `${label} checker could not complete because a system response was unavailable or malformed.`
}

export const categorizeValidationIssue = (
  issue: StrategyRevisionValidationIssue,
  sourceFormat: WorkshopCheckerSourceFormat,
): WorkshopCheckerDiagnosticCategory => {
  if (sourceFormat === "zig") {
    const text = `${issue.message} ${issue.pattern ?? ""}`.toLowerCase()
    if (text.includes('@import("std")') || text.includes("std.")) {
      return "no_std_or_helper"
    }
  }
  const text = `${issue.code} ${issue.message} ${issue.constraint ?? ""} ${
    issue.reference ?? ""
  }`.toLowerCase()
  if (text.includes("toolchain unavailable") || text.includes("unavailable")) {
    return "toolchain_unavailable"
  }
  switch (issue.code) {
    case "SOURCE_TOO_LARGE":
    case "MEMORY_LIMIT_EXCEEDED":
      return "source_too_large"
    case "IMPORT_NOT_ALLOWED":
      return "forbidden_import"
    case "FORBIDDEN_PATTERN":
      return sourceFormat === "rust" || sourceFormat === "zig"
        ? "forbidden_import"
        : "forbidden_capability"
    case "FORBIDDEN_CAPABILITY":
      return "forbidden_capability"
    case "UNSUPPORTED_PACKAGE_METADATA":
      return "package_or_dependency"
    case "TRANSPILE_FAILED":
      return sourceFormat === "typescript" || sourceFormat === "python"
        ? "syntax_or_parse"
        : "compile_failed"
    case "MISSING_DEFAULT_EXPORT":
    case "MISSING_SELECT_ACTIVATIONS":
    case "MISSING_SOLDIER_BRAIN":
    case "ASYNC_METHOD_NOT_ALLOWED":
      return "strategy_api_shape"
    case "TIMEOUT":
      return "timeout_or_limit"
    case "UNSUPPORTED_LANGUAGE":
    case "INCOMPATIBLE_ADAPTER":
    case "NON_COUNTED_RUNTIME":
      return "unsupported_provider"
    case "ABI_MISMATCH":
    case "ENGINE_INCOMPATIBLE":
      return "provenance_mismatch"
    default:
      return "system_unavailable"
  }
}

const actionabilityForCategory = (
  category: WorkshopCheckerDiagnosticCategory,
): WorkshopCheckerDiagnosticActionability => {
  switch (category) {
    case "runtime_service_unavailable":
      return "check_runtime_service"
    case "toolchain_unavailable":
      return "install_or_configure_toolchain"
    case "system_unavailable":
      return "contact_operator"
    case "timeout_or_limit":
      return "retry_later"
    case "artifact_missing":
    case "artifact_stale":
    case "artifact_mismatch":
    case "provenance_missing":
    case "provenance_mismatch":
    case "provenance_unverifiable":
    case "provider_proof_invalid":
      return "contact_operator"
    default:
      return "edit_source"
  }
}

const sanitizePublicCheckerText = (
  value: string | null | undefined,
): string | null => {
  if (!value) {
    return null
  }
  return value
    .replace(
      /\b(strategyMemory|StrategyMemory|strategy_memory|strategy memory)\b/gi,
      "private strategy memory",
    )
    .replace(
      /\b(soldierMemory|SoldierMemory|soldier_memory|soldier memory)\b/gi,
      "private soldier memory",
    )
    .replace(
      /\b(objectivePayload|objective_payload|objective payload)\b/gi,
      "private objective",
    )
    .replace(/File "[^"]+"/g, "File [redacted]")
    .replace(/\/Users\/[^\s"'`),;]+/g, "[host path]")
    .replace(/postgres(?:ql)?:\/\/[^\s"'`),;]+/gi, "[database]")
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/g, "Bearer [redacted]")
}

const providerValidationMatches = (
  providerValidation: Record<string, unknown> | null,
  input: CreateWorkshopCheckerResponseInput,
  providerId: string,
  providerContractVersion: string,
  artifact: {
    hash: string | null
    bytes: number | null
    sourceHash: string | null
    sourceBytes: number | null
  },
): boolean => {
  const artifactSourceMatches =
    input.sourceFormat === "rust" || input.sourceFormat === "zig"
      ? artifact.sourceHash === input.validation.sourceHash
      : artifact.sourceHash === input.validation.sourceHash &&
        artifact.sourceBytes === input.validation.sourceBytes
  return (
    providerValidation !== null &&
    stringValue(providerValidation.proof) !== null &&
    artifact.hash !== null &&
    artifact.bytes !== null &&
    artifactSourceMatches &&
    stringValue(providerValidation.providerId) === providerId &&
    stringValue(providerValidation.contractVersion) ===
      providerContractVersion &&
    stringValue(providerValidation.sourceHash) ===
      input.validation.sourceHash &&
    numberValue(providerValidation.sourceBytes) ===
      input.validation.sourceBytes &&
    stringValue(providerValidation.artifactHash) === artifact.hash &&
    numberValue(providerValidation.artifactBytes) === artifact.bytes
  )
}

export const normalizeValidationIssueForWorkshopChecker = (
  issue: StrategyRevisionValidationIssue,
  sourceFormat: WorkshopCheckerSourceFormat,
): WorkshopCheckerDiagnostic => {
  const category = categorizeValidationIssue(issue, sourceFormat)
  return {
    code: issue.code,
    category,
    severity: issue.severity,
    actionability: actionabilityForCategory(category),
    message:
      sanitizePublicCheckerText(issue.message) ??
      "Checker diagnostic was unavailable.",
    constraint: sanitizePublicCheckerText(issue.constraint),
    remediation: sanitizePublicCheckerText(issue.remediation),
    reference: sanitizePublicCheckerText(issue.reference),
    line: issue.line ?? null,
    column: issue.column ?? null,
    publicSafe: true,
  }
}

export interface CreateWorkshopCheckerResponseInput {
  sourceFormat: WorkshopCheckerSourceFormat
  validation: StrategyRevisionValidationReport
  metadata?:
    | StrategyRevisionMetadata
    | Record<string, unknown>
    | null
    | undefined
  provider?: {
    id?: string | undefined
    contractVersion?: string | undefined
    runtimeAbiVersion?: string | undefined
    abiPosture?: string | undefined
  } | null
  statusOverride?: WorkshopCheckerStatus | undefined
  runtimeServiceAvailability?: WorkshopCheckerResponse["runtimeService"]["availability"]
  runtimeServicePublicReason?: string | null | undefined
  toolchainAvailability?: WorkshopCheckerResponse["toolchain"]["availability"]
  toolchainPublicReason?: string | null | undefined
}

export const createWorkshopCheckerResponse = (
  input: CreateWorkshopCheckerResponseInput,
): WorkshopCheckerResponse => {
  const provider = providerForSourceFormat(input.sourceFormat)
  const language =
    getSupportedStrategyLanguageBySourceFormat(input.sourceFormat) ?? null
  const providerId =
    input.provider?.id ?? provider?.id ?? defaultProviderId(input.sourceFormat)
  const providerContractVersion =
    input.provider?.contractVersion ??
    provider?.contractVersion ??
    STRATEGY_LANGUAGE_PROVIDER_CONTRACT_VERSION
  const runtimeAbiVersion =
    input.provider?.runtimeAbiVersion ??
    provider?.runtimeAbiVersion ??
    STRATEGY_RUNTIME_ABI_VERSION
  const artifact = artifactFromMetadata(input.sourceFormat, input.metadata)
  const providerValidation = providerValidationFromMetadata(input.metadata)
  const proofMatches = providerValidationMatches(
    providerValidation,
    input,
    providerId,
    providerContractVersion,
    artifact,
  )
  const diagnostics = [
    ...input.validation.errors,
    ...input.validation.warnings,
  ].map((issue) =>
    normalizeValidationIssueForWorkshopChecker(issue, input.sourceFormat),
  )
  const toolchainUnavailable = diagnostics.some(
    (diagnostic) => diagnostic.category === "toolchain_unavailable",
  )
  const status =
    input.statusOverride ??
    (toolchainUnavailable
      ? "toolchain_unavailable"
      : input.validation.valid
        ? "ready"
        : "invalid")
  const artifactRequired = input.sourceFormat !== "typescript"
  const artifactState: WorkshopCheckerResponse["artifact"]["state"] =
    artifact.hash && artifact.bytes
      ? "present"
      : artifactRequired
        ? "missing"
        : "missing"
  const providerProofState: WorkshopCheckerResponse["provenance"]["providerProofState"] =
    proofMatches
      ? "valid"
      : providerValidation
        ? "mismatched"
        : input.validation.valid
          ? "missing"
          : "missing"
  return {
    contractVersion: WORKSHOP_CHECKER_CONTRACT_VERSION,
    status,
    sourceFormat: input.sourceFormat,
    language: {
      id: input.sourceFormat,
      label: language?.label ?? input.sourceFormat,
      providerId,
      contractVersion:
        providerContractVersion as typeof STRATEGY_LANGUAGE_PROVIDER_CONTRACT_VERSION,
    },
    owners: {
      validationOwner: "runtime-service",
      buildOwner: "runtime-service",
      executionOwner: "runtime-service",
    },
    source: {
      hash: input.validation.sourceHash,
      bytes: input.validation.sourceBytes,
    },
    artifact: {
      kind: artifactKindForSourceFormat(input.sourceFormat),
      format: artifactFormatForSourceFormat(input.sourceFormat),
      hash: artifact.hash,
      bytes: artifact.bytes,
      state: artifactState,
    },
    provenance: {
      state: proofMatches
        ? "valid"
        : providerValidation
          ? "mismatched"
          : input.validation.valid
            ? "missing"
            : "missing",
      providerProofState,
    },
    runtimeService: {
      availability: input.runtimeServiceAvailability ?? "available",
      publicReason: input.runtimeServicePublicReason ?? null,
    },
    toolchain: {
      availability:
        input.toolchainAvailability ??
        (toolchainUnavailable
          ? "unavailable"
          : input.sourceFormat === "rust" || input.sourceFormat === "zig"
            ? "available"
            : "not_required"),
      languageToolchain:
        input.sourceFormat === "rust" || input.sourceFormat === "zig"
          ? input.sourceFormat
          : null,
      publicReason:
        input.toolchainPublicReason ??
        (toolchainUnavailable
          ? publicMessageForUnavailable(input.sourceFormat, "toolchain")
          : null),
    },
    diagnostics,
    cacheIdentity: {
      languageId: input.sourceFormat,
      providerId,
      sourceHash: input.validation.sourceHash,
      sourceBytes: input.validation.sourceBytes,
      artifactHash: artifact.hash,
      artifactBytes: artifact.bytes,
      providerContractVersion,
      runtimeAbiVersion,
      validationPolicy: WORKSHOP_CHECKER_VALIDATION_POLICY,
      toolchainKey:
        artifact.toolchainKey ??
        (input.sourceFormat === "rust" || input.sourceFormat === "zig"
          ? `${input.sourceFormat}:unknown`
          : null),
    },
    privacy: {
      publicSafe: true,
      redacted: true,
      excludedFields: [...WORKSHOP_CHECKER_PRIVACY_EXCLUDED_FIELDS],
    },
  }
}

export const createWorkshopCheckerUnavailableResponse = (input: {
  sourceFormat: WorkshopCheckerSourceFormat
  sourceHash: string
  sourceBytes: number
  status: Extract<
    WorkshopCheckerStatus,
    | "runtime_service_unavailable"
    | "toolchain_unavailable"
    | "system_unavailable"
  >
  reason?: string | null | undefined
}): WorkshopCheckerResponse => {
  const issueCategory =
    input.status === "runtime_service_unavailable"
      ? "runtime_service_unavailable"
      : input.status === "toolchain_unavailable"
        ? "toolchain_unavailable"
        : "system_unavailable"
  const validation: StrategyRevisionValidationReport = {
    valid: false,
    errors: [],
    warnings: [],
    sourceBytes: input.sourceBytes,
    forbiddenPatterns: [],
    sourceHash: input.sourceHash,
    runtimeVersion: "runtime-service-unavailable",
    engineCompatibility: {
      spec: "cowards-rules-v1.4",
      engine: "engine-v1",
    },
  }
  const responseInput: CreateWorkshopCheckerResponseInput = {
    sourceFormat: input.sourceFormat,
    validation,
    statusOverride: input.status,
    runtimeServiceAvailability:
      input.status === "runtime_service_unavailable"
        ? "unavailable"
        : input.status === "system_unavailable"
          ? "unknown"
          : "available",
    runtimeServicePublicReason:
      input.status === "runtime_service_unavailable"
        ? (input.reason ??
          publicMessageForUnavailable(input.sourceFormat, "runtime-service"))
        : input.status === "system_unavailable"
          ? (input.reason ??
            publicMessageForUnavailable(input.sourceFormat, "system"))
          : null,
    toolchainPublicReason:
      input.status === "toolchain_unavailable"
        ? (input.reason ??
          publicMessageForUnavailable(input.sourceFormat, "toolchain"))
        : null,
  }
  if (input.status === "toolchain_unavailable") {
    responseInput.toolchainAvailability = "unavailable"
  }
  const checker = createWorkshopCheckerResponse(responseInput)
  return {
    ...checker,
    diagnostics: [
      {
        code: issueCategory.toUpperCase(),
        category: issueCategory,
        severity: "error",
        actionability: actionabilityForCategory(issueCategory),
        message:
          input.reason ??
          publicMessageForUnavailable(
            input.sourceFormat,
            input.status === "runtime_service_unavailable"
              ? "runtime-service"
              : input.status === "toolchain_unavailable"
                ? "toolchain"
                : "system",
          ),
        constraint: null,
        remediation:
          input.status === "runtime_service_unavailable"
            ? "Start runtime-service or retry when the service is available."
            : input.status === "toolchain_unavailable"
              ? `Install or configure the ${input.sourceFormat} provider toolchain, then retry validation.`
              : "Retry after the checker service is healthy.",
        reference: "runtime/languages",
        line: null,
        column: null,
        publicSafe: true,
      },
    ],
  }
}
