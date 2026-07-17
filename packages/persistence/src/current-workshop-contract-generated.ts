import {
  CURRENT_SEMANTIC_AUTHORITY_KEY,
  resolveSemanticAuthoritySelection,
} from "@cowards/spec"
import { WORKSHOP_CONTRACT_V1_19_CANDIDATE_PIN } from "./workshop-contract-v1-19-candidate-pin.js"

const deepFreeze = <T>(value: T): Readonly<T> => {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child)
    }
    Object.freeze(value)
  }
  return value
}

export const WORKSHOP_CONTRACT_SELECTION_REGISTRY = deepFreeze({
  "runtime-v1.17": {
    semanticAuthorityKey: "runtime-v1.17",
    workshopContractVersion: "workshop-contract-v1.17",
    runtimeAbiVersion: "strategy-runtime-abi-v1.17",
    activationOwner: "Phase-260-Plan-14",
    workshopContractRoot:
      "sha256:1bed9b99ce512da13a3aa37554dc9b279f51dca619280ff3cbd85cc773ce18d3",
    exampleSourceSha256: {
      typescript:
        "sha256:c85f2f2acd3bff9a304aeebb778524173691a031ef470360915d109a202c6b3a",
      python:
        "sha256:0f5964451211ee5e6557907fe52a507b8875bb6d023b490926f74450280b10d0",
      rust: "sha256:b038431f0b88bc324b417c57ec4709e0279558ed006bcb2c87b8d08d0a8035b5",
      zig: "sha256:5f3f02fb40edf2362a86fb821f6e3133c5e6a7b0639696b99b7f18c420b1fa0d",
    },
    validationContract: "phase-259-workshop-hostile-source-validation",
  },
  "runtime-v1.19": {
    semanticAuthorityKey: "runtime-v1.19",
    workshopContractVersion: "workshop-contract-v1.19",
    runtimeAbiVersion: "strategy-runtime-abi-v1.19",
    activationOwner: "Phase-260-Plan-14",
    workshopContractRoot:
      WORKSHOP_CONTRACT_V1_19_CANDIDATE_PIN.exampleSetRootSha256,
    exampleSourceSha256: {
      typescript:
        WORKSHOP_CONTRACT_V1_19_CANDIDATE_PIN.examples[0]!.sourceSha256,
      python: WORKSHOP_CONTRACT_V1_19_CANDIDATE_PIN.examples[1]!.sourceSha256,
      rust: WORKSHOP_CONTRACT_V1_19_CANDIDATE_PIN.examples[2]!.sourceSha256,
      zig: WORKSHOP_CONTRACT_V1_19_CANDIDATE_PIN.examples[3]!.sourceSha256,
    },
    validationContract: "phase-260-workshop-observation-v1.19-validation",
  },
} as const)

export type WorkshopContractCurrentSelection =
  | (typeof WORKSHOP_CONTRACT_SELECTION_REGISTRY)["runtime-v1.17"]
  | (typeof WORKSHOP_CONTRACT_SELECTION_REGISTRY)["runtime-v1.19"]

export const resolveWorkshopContractSelectionForSemanticAuthority = (
  selector: unknown,
): Readonly<WorkshopContractCurrentSelection & { status: "current" }> => {
  const semanticSelection = resolveSemanticAuthoritySelection(selector)
  if (semanticSelection === undefined) {
    throw new Error("Workshop semantic authority selector is invalid.")
  }
  return deepFreeze({
    status: "current" as const,
    ...WORKSHOP_CONTRACT_SELECTION_REGISTRY[
      semanticSelection.semanticAuthorityKey
    ],
  })
}

export const CURRENT_WORKSHOP_CONTRACT_GENERATED = deepFreeze({
  schemaVersion: "current-workshop-contract-generated-v1",
  generatedBy: "Phase-260-Plan-29",
  activationOwner: "Phase-260-Plan-14",
  selection: resolveWorkshopContractSelectionForSemanticAuthority({
    semanticAuthorityKey: CURRENT_SEMANTIC_AUTHORITY_KEY,
  }),
} as const)
