import { describe, expect, it } from "vitest"
import { transpileStrategySource, validateStrategySource } from "@cowards/runtime-js"
import { validatePythonStrategySource } from "@cowards/runtime-python/validation"
import {
  compileRustWasmArtifact,
  compileZigWasmArtifact,
} from "@cowards/runtime-wasm-wasi"
import {
  WORKSHOP_CONTRACT_V1_19_CANDIDATE,
  type WorkshopContractV119Candidate,
} from "./workshop-contract-v1-19-candidate.js"
import {
  WORKSHOP_CONTRACT_V1_19_CANDIDATE_PIN,
  verifyWorkshopContractV119CandidatePin,
} from "./workshop-contract-v1-19-candidate-pin.js"

const cloneCandidate = (): WorkshopContractV119Candidate =>
  structuredClone(WORKSHOP_CONTRACT_V1_19_CANDIDATE)

describe("Workshop contract v1.19 candidate", () => {
  it("is an immutable, explicit, non-current candidate", () => {
    expect(WORKSHOP_CONTRACT_V1_19_CANDIDATE).toMatchObject({
      schemaVersion: "workshop-contract-v1.19-candidate-v1",
      workshopContractVersion: "workshop-contract-v1.19",
      runtimeAbiVersion: "strategy-runtime-abi-v1.19",
      lifecycle: {
        status: "inactive-candidate",
        active: false,
        current: false,
        activationOwner: "Phase-260-Plan-14",
      },
      semantics: {
        initiative: "kernel-owned-absolute-and-player-relative",
        hasAdvancedThisActivation:
          "pre-action-activation-slot-scoped-observation",
        observationOnly: true,
        addsHoldOrEndActivation: false,
        storedInStrategyOrSoldierMemory: false,
      },
    })
    expect(Object.isFrozen(WORKSHOP_CONTRACT_V1_19_CANDIDATE)).toBe(true)
    expect(Object.isFrozen(WORKSHOP_CONTRACT_V1_19_CANDIDATE.examples)).toBe(
      true,
    )
  })

  it("provides one package-free example for every supported language", () => {
    expect(
      WORKSHOP_CONTRACT_V1_19_CANDIDATE.examples.map(
        ({ language }) => language,
      ),
    ).toEqual(["typescript", "python", "rust", "zig"])

    for (const example of WORKSHOP_CONTRACT_V1_19_CANDIDATE.examples) {
      expect(example.source).toContain("initialInitiativePlayerId")
      expect(example.source).toContain("hasInitialInitiative")
      expect(example.source).toContain("roundInitiativePlayerId")
      expect(example.source).toContain("hasRoundInitiative")
      expect(example.source).toContain("hasAdvancedThisActivation")
      expect(example.source).not.toMatch(
        /\b(?:HOLD|END_ACTIVATION|Date\.now|Math\.random|fetch|node:|npm|pip|cargo add)\b/u,
      )
    }
  })

  it("passes existing hostile-source validation and real compiler gates", () => {
    const byLanguage = Object.fromEntries(
      WORKSHOP_CONTRACT_V1_19_CANDIDATE.examples.map((example) => [
        example.language,
        example.source,
      ]),
    ) as Record<"typescript" | "python" | "rust" | "zig", string>

    expect(validateStrategySource(byLanguage.typescript).valid).toBe(true)
    expect(transpileStrategySource(byLanguage.typescript).ok).toBe(true)
    expect(validatePythonStrategySource(byLanguage.python).valid).toBe(true)

    const rust = compileRustWasmArtifact(byLanguage.rust)
    const zig = compileZigWasmArtifact(byLanguage.zig)
    expect(rust.ok, rust.ok ? undefined : rust.message).toBe(true)
    expect(zig.ok, zig.ok ? undefined : zig.message).toBe(true)
  }, 30_000)

  it("binds the exact four sources and observation semantics in one pin", () => {
    expect(WORKSHOP_CONTRACT_V1_19_CANDIDATE_PIN).toMatchObject({
      schemaVersion: "workshop-contract-v1.19-candidate-pin-v1",
      status: "inactive-candidate",
      workshopContractVersion: "workshop-contract-v1.19",
      runtimeAbiVersion: "strategy-runtime-abi-v1.19",
      activationOwner: "Phase-260-Plan-14",
      exampleSetRootSha256: expect.stringMatching(/^sha256:[a-f0-9]{64}$/u),
      observationSemanticsSha256: expect.stringMatching(
        /^sha256:[a-f0-9]{64}$/u,
      ),
    })
    expect(
      WORKSHOP_CONTRACT_V1_19_CANDIDATE_PIN.examples.map(
        ({ language }) => language,
      ),
    ).toEqual(["typescript", "python", "rust", "zig"])
    expect(
      verifyWorkshopContractV119CandidatePin(
        WORKSHOP_CONTRACT_V1_19_CANDIDATE,
        WORKSHOP_CONTRACT_V1_19_CANDIDATE_PIN,
      ),
    ).toEqual({ ok: true })
  })

  it("rejects source, semantic, version, and activation substitutions", () => {
    const mutations: WorkshopContractV119Candidate[] = []

    const source = cloneCandidate()
    source.examples[0] = { ...source.examples[0]!, source: "substituted" }
    mutations.push(source)

    const semantics = cloneCandidate()
    semantics.semantics.observationOnly = false
    mutations.push(semantics)

    const version = cloneCandidate()
    version.runtimeAbiVersion = "strategy-runtime-abi-v1.17"
    mutations.push(version)

    const activation = cloneCandidate()
    activation.lifecycle.active = true
    mutations.push(activation)

    for (const mutation of mutations) {
      expect(
        verifyWorkshopContractV119CandidatePin(
          mutation,
          WORKSHOP_CONTRACT_V1_19_CANDIDATE_PIN,
        ),
      ).toMatchObject({ ok: false })
    }
  })
})
