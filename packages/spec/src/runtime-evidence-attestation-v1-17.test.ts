import { describe, expect, it } from "vitest"
import {
  RUNTIME_EVIDENCE_EDGE_SCHEMA_V1_17,
  RUNTIME_EVIDENCE_GRAPH_NODE_KINDS_V1_17,
  RUNTIME_EVIDENCE_GRAPH_PROFILE_V1_17,
  RUNTIME_EVIDENCE_GRAPH_SCHEMA_VERSION_V1_17,
  RUNTIME_EVIDENCE_REQUIRED_EXACT_PINS_V1_17,
} from "./runtime-evidence-v1-17.js"

describe("runtime evidence v1.17 frozen contract", () => {
  it("freezes fifteen identity domains and the complete twenty-six-edge schema", () => {
    expect(RUNTIME_EVIDENCE_GRAPH_SCHEMA_VERSION_V1_17).toBe(
      "runtime-evidence-graph-v1.17",
    )
    expect(RUNTIME_EVIDENCE_GRAPH_PROFILE_V1_17).toBe(
      "runtime-identity-evidence-dag-v1",
    )
    expect(RUNTIME_EVIDENCE_GRAPH_NODE_KINDS_V1_17).toHaveLength(15)
    expect(new Set(RUNTIME_EVIDENCE_GRAPH_NODE_KINDS_V1_17).size).toBe(15)
    expect(RUNTIME_EVIDENCE_EDGE_SCHEMA_V1_17).toHaveLength(26)
    expect(new Set(RUNTIME_EVIDENCE_EDGE_SCHEMA_V1_17.map((edge) => edge.kind)).size).toBe(26)
    expect(RUNTIME_EVIDENCE_EDGE_SCHEMA_V1_17).toContainEqual({
      from: "evidenceBundle",
      to: "artifactManifest",
      kind: "evidence-binds-manifest",
    })
    expect(RUNTIME_EVIDENCE_EDGE_SCHEMA_V1_17).toContainEqual({
      from: "artifactManifest",
      to: "originalSource",
      kind: "manifest-binds-original",
    })
  })

  it("freezes the ten exact executable pins in ABI order", () => {
    expect(RUNTIME_EVIDENCE_REQUIRED_EXACT_PINS_V1_17).toEqual([
      "runtimeExecutableDigest",
      "reportedVersion",
      "targetAbi",
      "compilerFlags",
      "adapterBuildDigest",
      "standardLibraryOrSysrootDigest",
      "containmentPolicyId",
      "budgetProfileSha256",
      "canonicalJsonProfileId",
      "behaviorSettingsHash",
    ])
  })

  it("exports deeply immutable schema constants", () => {
    expect(Object.isFrozen(RUNTIME_EVIDENCE_GRAPH_NODE_KINDS_V1_17)).toBe(true)
    expect(Object.isFrozen(RUNTIME_EVIDENCE_EDGE_SCHEMA_V1_17)).toBe(true)
    expect(
      RUNTIME_EVIDENCE_EDGE_SCHEMA_V1_17.every((edge) => Object.isFrozen(edge)),
    ).toBe(true)
  })
})
