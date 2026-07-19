import { CURRENT_SEMANTIC_AUTHORITY_KEY } from "@cowards/spec"
import {
  ACTIVE_V1_17_SEMANTIC_AUTHORITY_SELECTION,
  ACTIVE_V1_17_SEMANTIC_AUTHORITY_SELECTION_ROOT,
  REVIEWED_V1_19_SEMANTIC_AUTHORITY_SELECTION,
  REVIEWED_V1_19_SEMANTIC_AUTHORITY_SELECTION_ROOT,
} from "./semantic-authority-selection-head.js"

export const TEST_CURRENT_IS_V119 =
  String(CURRENT_SEMANTIC_AUTHORITY_KEY) === "runtime-v1.19"

export const TEST_CURRENT_SEMANTIC_AUTHORITY_SELECTION = TEST_CURRENT_IS_V119
  ? REVIEWED_V1_19_SEMANTIC_AUTHORITY_SELECTION
  : ACTIVE_V1_17_SEMANTIC_AUTHORITY_SELECTION

export const TEST_CURRENT_SEMANTIC_AUTHORITY_SELECTION_ROOT =
  TEST_CURRENT_IS_V119
    ? REVIEWED_V1_19_SEMANTIC_AUTHORITY_SELECTION_ROOT
    : ACTIVE_V1_17_SEMANTIC_AUTHORITY_SELECTION_ROOT

export const TEST_NONCURRENT_SEMANTIC_AUTHORITY_SELECTION = TEST_CURRENT_IS_V119
  ? ACTIVE_V1_17_SEMANTIC_AUTHORITY_SELECTION
  : REVIEWED_V1_19_SEMANTIC_AUTHORITY_SELECTION

export const TEST_NONCURRENT_SEMANTIC_AUTHORITY_SELECTION_ROOT =
  TEST_CURRENT_IS_V119
    ? ACTIVE_V1_17_SEMANTIC_AUTHORITY_SELECTION_ROOT
    : REVIEWED_V1_19_SEMANTIC_AUTHORITY_SELECTION_ROOT

const finalized = {
  activationId: "activation:test-current-authority",
  proofDigest: `sha256:${"1".repeat(64)}`,
  commitSha: "2".repeat(40),
  treeSha: "3".repeat(40),
  selectorManifestRoot: `sha256:${"4".repeat(64)}`,
}

export const TEST_CURRENT_SEMANTIC_AUTHORITY_HEAD = TEST_CURRENT_IS_V119
  ? {
      state: "active-v1.19-finalized",
      revision: "2",
      active_selection: TEST_CURRENT_SEMANTIC_AUTHORITY_SELECTION,
      active_selection_root: TEST_CURRENT_SEMANTIC_AUTHORITY_SELECTION_ROOT,
      pending_intent: null,
      finalization: finalized,
      compensation: null,
    }
  : {
      state: "active-v1.17-bootstrap",
      revision: "0",
      active_selection: TEST_CURRENT_SEMANTIC_AUTHORITY_SELECTION,
      active_selection_root: TEST_CURRENT_SEMANTIC_AUTHORITY_SELECTION_ROOT,
      pending_intent: null,
      finalization: null,
      compensation: null,
    }

export const TEST_NONCURRENT_SEMANTIC_AUTHORITY_HEAD = TEST_CURRENT_IS_V119
  ? {
      state: "active-v1.17-bootstrap",
      revision: "0",
      active_selection: TEST_NONCURRENT_SEMANTIC_AUTHORITY_SELECTION,
      active_selection_root: TEST_NONCURRENT_SEMANTIC_AUTHORITY_SELECTION_ROOT,
      pending_intent: null,
      finalization: null,
      compensation: null,
    }
  : {
      state: "active-v1.19-finalized",
      revision: "2",
      active_selection: TEST_NONCURRENT_SEMANTIC_AUTHORITY_SELECTION,
      active_selection_root: TEST_NONCURRENT_SEMANTIC_AUTHORITY_SELECTION_ROOT,
      pending_intent: null,
      finalization: finalized,
      compensation: null,
    }
