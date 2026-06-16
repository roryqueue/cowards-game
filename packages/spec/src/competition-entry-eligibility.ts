import { assertPublicOutputLeakSafe } from "./public-output-privacy.js"
import type { StrategyLanguageId } from "./runtime.js"

export const COUNTED_ENTRY_ELIGIBILITY_CONTRACT_ID =
  "counted-entry-eligibility-v1.36" as const

export const COUNTED_ENTRY_ELIGIBILITY_SUPPORTED_LANES = [
  "typescript",
  "python",
  "rust",
  "zig",
] as const satisfies readonly StrategyLanguageId[]

export type CountedEntryEligibilitySupportedLane =
  (typeof COUNTED_ENTRY_ELIGIBILITY_SUPPORTED_LANES)[number]

export const COUNTED_ENTRY_ELIGIBILITY_CATEGORIES = [
  "provider_validated",
  "season_not_open",
  "owner_mismatch",
  "invalid_strategy_revision",
  "mutable_draft",
  "unsupported_source_format",
  "hidden_unsupported_provider",
  "incompatible_runtime_metadata",
  "package_policy_violation",
  "capability_policy_violation",
  "provider_proof_missing",
  "provider_proof_mismatched",
  "provider_proof_stale",
  "runtime_service_unavailable",
  "already_entered_season",
  "replacement_blocked",
] as const

export type CountedEntryEligibilityCategory =
  (typeof COUNTED_ENTRY_ELIGIBILITY_CATEGORIES)[number]

export interface CountedEntryEligibilityPublicCopy {
  category: CountedEntryEligibilityCategory
  publicMessage: string
  remediation: string
}

export interface CountedEntryEligibilityDecision
  extends CountedEntryEligibilityPublicCopy {
  ok: boolean
}

export const COUNTED_ENTRY_ELIGIBILITY_PUBLIC_COPY = {
  provider_validated: {
    category: "provider_validated",
    publicMessage:
      "This Strategy Revision is ready for counted trial entry.",
    remediation: "No action is needed before entering an open counted Season.",
  },
  season_not_open: {
    category: "season_not_open",
    publicMessage: "This counted Season is not open for new entries.",
    remediation:
      "Choose an open counted Season, or use an exhibition path while entries are closed.",
  },
  owner_mismatch: {
    category: "owner_mismatch",
    publicMessage:
      "This Strategy Revision cannot be entered by the signed-in Player.",
    remediation:
      "Select a revision owned by the signed-in account before entering counted competition.",
  },
  invalid_strategy_revision: {
    category: "invalid_strategy_revision",
    publicMessage:
      "This Strategy Revision is not eligible for counted trial entry.",
    remediation:
      "Submit a current revision that passes validation before entering counted competition.",
  },
  mutable_draft: {
    category: "mutable_draft",
    publicMessage:
      "Draft Strategies cannot be entered into counted trial competition.",
    remediation:
      "Submit an immutable Strategy Revision before entering counted competition.",
  },
  unsupported_source_format: {
    category: "unsupported_source_format",
    publicMessage:
      "This Strategy language is not eligible for counted trial entry.",
    remediation:
      "Use TypeScript, Python, Rust, or Zig for counted trial competition.",
  },
  hidden_unsupported_provider: {
    category: "hidden_unsupported_provider",
    publicMessage:
      "This Strategy lane is not eligible for counted trial entry.",
    remediation:
      "Choose a visible supported counted lane: TypeScript, Python, Rust, or Zig.",
  },
  incompatible_runtime_metadata: {
    category: "incompatible_runtime_metadata",
    publicMessage:
      "This revision was prepared with runtime metadata that counted entry cannot accept.",
    remediation:
      "Revalidate or resubmit the revision through the current supported provider path.",
  },
  package_policy_violation: {
    category: "package_policy_violation",
    publicMessage:
      "Counted trial entry only accepts Strategies with package mode none.",
    remediation:
      "Remove package declarations and resubmit under the no-package counted policy.",
  },
  capability_policy_violation: {
    category: "capability_policy_violation",
    publicMessage:
      "Counted trial entry cannot accept revisions that require host capabilities.",
    remediation:
      "Remove unsupported capability requirements and resubmit the revision.",
  },
  provider_proof_missing: {
    category: "provider_proof_missing",
    publicMessage:
      "This revision is missing current provider validation evidence.",
    remediation:
      "Revalidate or resubmit the revision so counted entry can confirm current evidence.",
  },
  provider_proof_mismatched: {
    category: "provider_proof_mismatched",
    publicMessage:
      "This revision's provider validation evidence does not match the current revision record.",
    remediation:
      "Revalidate or resubmit the revision so counted entry sees matching evidence.",
  },
  provider_proof_stale: {
    category: "provider_proof_stale",
    publicMessage:
      "This revision's provider validation evidence is no longer current for counted entry.",
    remediation:
      "Revalidate or resubmit the revision before entering counted competition.",
  },
  runtime_service_unavailable: {
    category: "runtime_service_unavailable",
    publicMessage:
      "Counted trial entry cannot confirm runtime readiness right now.",
    remediation:
      "Try again after readiness checks are available, or use a non-counted exhibition path.",
  },
  already_entered_season: {
    category: "already_entered_season",
    publicMessage:
      "The signed-in Player already has a counted entry for this Season.",
    remediation:
      "Keep the existing counted entry for this Season, or enter a future Season.",
  },
  replacement_blocked: {
    category: "replacement_blocked",
    publicMessage:
      "Counted Season entries cannot be replaced after entry.",
    remediation:
      "Use the existing entry for this Season, enter a future Season, or play an exhibition.",
  },
} as const satisfies Record<
  CountedEntryEligibilityCategory,
  CountedEntryEligibilityPublicCopy
>

export const COUNTED_ENTRY_ELIGIBILITY_PUBLIC_PAYLOAD = {
  id: COUNTED_ENTRY_ELIGIBILITY_CONTRACT_ID,
  supportedLanes: COUNTED_ENTRY_ELIGIBILITY_SUPPORTED_LANES,
  categories: COUNTED_ENTRY_ELIGIBILITY_CATEGORIES,
  publicCopy: COUNTED_ENTRY_ELIGIBILITY_PUBLIC_COPY,
  publicOutputPolicy:
    "Eligibility output is coarse public category and remediation copy only.",
} as const

const COUNTED_ENTRY_ELIGIBILITY_SUPPORTED_LANE_SET = new Set<string>(
  COUNTED_ENTRY_ELIGIBILITY_SUPPORTED_LANES,
)

const COUNTED_ENTRY_ELIGIBILITY_FORBIDDEN_PUBLIC_KEYS = new Set([
  "raw" + "Diagnostics",
  "raw" + "Diagnostic",
  "artifact" + "Bytes",
  "artifact" + "BytesBase64",
  "env" + "Values",
  "db" + "Details",
  "data" + "base" + "Details",
  "provider" + "Signing" + "Material",
  "private" + "Runtime" + "Internals",
  "operator" + "OnlyData",
  "operator" + "OnlyGovernance",
  "operator" + "OnlyGovernanceDetails",
])

export const getCountedEntryEligibilityPublicCopy = (
  category: CountedEntryEligibilityCategory,
): CountedEntryEligibilityPublicCopy =>
  COUNTED_ENTRY_ELIGIBILITY_PUBLIC_COPY[category]

export const countedEntryEligibilityDecision = (
  category: CountedEntryEligibilityCategory,
): CountedEntryEligibilityDecision => ({
  ok: category === "provider_validated",
  ...getCountedEntryEligibilityPublicCopy(category),
})

export const isCountedEntrySupportedLane = (
  value: unknown,
): value is CountedEntryEligibilitySupportedLane =>
  typeof value === "string" &&
  COUNTED_ENTRY_ELIGIBILITY_SUPPORTED_LANE_SET.has(value)

export const assertCountedEntryEligibilityPublicLeakSafe = (
  value: unknown = COUNTED_ENTRY_ELIGIBILITY_PUBLIC_PAYLOAD,
): void => {
  assertPublicOutputLeakSafe(value, "counted entry eligibility public payload")

  const visit = (node: unknown, path: string): void => {
    if (Array.isArray(node)) {
      node.forEach((item, index) => visit(item, `${path}[${index}]`))
      return
    }
    if (!node || typeof node !== "object") {
      return
    }
    for (const [key, entryValue] of Object.entries(
      node as Record<string, unknown>,
    )) {
      if (COUNTED_ENTRY_ELIGIBILITY_FORBIDDEN_PUBLIC_KEYS.has(key)) {
        throw new Error(
          `counted entry eligibility public payload leaks private field: ${path}.${key}`,
        )
      }
      visit(entryValue, `${path}.${key}`)
    }
  }

  visit(value, "$")
}
