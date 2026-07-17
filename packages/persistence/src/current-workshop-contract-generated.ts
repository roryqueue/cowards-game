const deepFreeze = <T>(value: T): Readonly<T> => {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child)
    }
    Object.freeze(value)
  }
  return value
}

export const CURRENT_WORKSHOP_CONTRACT_GENERATED = deepFreeze({
  schemaVersion: "current-workshop-contract-generated-v1",
  generatedBy: "Phase-260-Plan-18",
  activationOwner: "Phase-260-Plan-14",
  selection: {
    status: "current",
    workshopContractVersion: "workshop-contract-v1.17",
    runtimeAbiVersion: "strategy-runtime-abi-v1.17",
    activationOwner: "Phase-260-Plan-14",
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
} as const)
