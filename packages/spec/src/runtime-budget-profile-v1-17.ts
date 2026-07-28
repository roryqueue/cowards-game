import { encodeCanonicalJson } from "./canonical-json-encode.js"
import {
  RUNTIME_ABI_V1_17,
  hashRuntimeAbiV117Identity,
} from "./runtime-abi-v1-17.js"
import type { JsonValue } from "./types.js"

const encodedBudgetProfile = encodeCanonicalJson(
  RUNTIME_ABI_V1_17.budgets as unknown as JsonValue,
  { context: "canonical-manifest" },
)

if (!encodedBudgetProfile.ok) {
  throw new TypeError(
    `Runtime ABI v1.17 budget profile is not canonical: ${encodedBudgetProfile.error.code}`,
  )
}

/** One domain-framed identity shared by requests, ledgers, and capability proof. */
export const RUNTIME_ABI_V1_17_BUDGET_PROFILE_SHA256 =
  hashRuntimeAbiV117Identity("budgetProfile", [encodedBudgetProfile.bytes])
