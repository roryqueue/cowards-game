import { createHash } from "node:crypto"
import { existsSync, readFileSync } from "node:fs"
import path from "node:path"
import { pathToFileURL } from "node:url"
import { describe, expect, it } from "vitest"
import type * as SubjectModule from "./runtime-abi-v1-17.ts"

const repoRoot = path.resolve(import.meta.dirname, "../../..")
const subjectPath = path.join(import.meta.dirname, "runtime-abi-v1-17.ts")

type Subject = typeof SubjectModule

const subject = async (): Promise<Subject> => {
  expect(
    existsSync(subjectPath),
    "the immutable v1.17 registry must exist after the RED gate",
  ).toBe(true)
  return import(pathToFileURL(subjectPath).href) as Promise<Subject>
}

const fileHash = (relativePath: string): string =>
  createHash("sha256")
    .update(readFileSync(path.join(repoRoot, relativePath)))
    .digest("hex")

const protectedV116Files = {
  "packages/spec/artifacts/runtime-execution-service-response.v1.16.wire.json":
    "9c870d57e0125eb80ab2ba941ecbbede8a9a775f61c0b278abec25c491374d97",
  "packages/spec/src/runtime-execution-service.ts":
    "9a0a0411056d06ce4b426b7749256460369124fa752c6c2f81912b8b0bfb31fc",
  "apps/go-backend/runtime_semantic_receipt.go":
    "36052047a870068ab81ced8c78f3b7f4e8130034a57ee8d16bc3873a50507d1d",
  "apps/go-backend/runtime_service_client.go":
    "9c72e5b0ee3ddfb36a7aec51a5a1ead508b2fae29eace27a73b9fda7d55ce23c",
  "apps/go-backend/runtime_service_client_test.go":
    "4a52986d2a43598c0e9556504459143ab56d94d97b22b2296cf84067927e8185",
  "packages/persistence/migrations/0017_runtime_semantic_receipts.sql":
    "ac19e1d825217dfb72142685eb65e62933cea49541ceb39338235b32d2430a69",
} as const

describe("runtime ABI v1.17 frozen successor registry", () => {
  it("mints a separate atomic successor without activating or rewriting v1.16", async () => {
    const runtimeAbi = await subject()
    const contract = runtimeAbi.RUNTIME_ABI_V1_17

    expect(contract.versions).toEqual({
      runtimeAbi: "strategy-runtime-abi-v1.17",
      runtimeService: "runtime-execution-service-v1.17",
      semanticReceipt: "runtime-semantic-receipt-v1.17",
      canonicalJson: "canonical-json-v1",
      budget: "runtime-budget-v1",
      identity: "runtime-identity-v1",
    })
    expect(contract.lifecycle).toEqual({
      status: "candidate-only",
      active: false,
      currentRuntimeAbi: "strategy-runtime-abi-v1.14",
      currentRuntimeService: "runtime-execution-service-v1.16",
      currentSemanticReceipt: "runtime-semantic-receipt-v1",
      activationOwner: "Phase-258-Plan-14",
    })
    expect(contract.migration.v116ReadDispatchRetained).toBe(true)
    expect(contract.migration.v116InsertionOrderedWireBytesRetained).toBe(true)
    expect(contract.migration.migration0017RewriteAllowed).toBe(false)
  })

  it("freezes the D-01 through D-04 canonical JSON profile and exact calibrated limits", async () => {
    const { RUNTIME_ABI_V1_17: contract } = await subject()

    expect(contract.canonicalJson).toMatchObject({
      admission: "raw-bytes-before-host-conversion",
      duplicateKeys: "reject-escaped-equivalent-before-object-conversion",
      numbers: {
        model: "finite-ieee-754-binary64",
        safeIntegerMinimum: -9_007_199_254_740_991,
        safeIntegerMaximum: 9_007_199_254_740_991,
        negativeZero: "encode-as-0",
        encoding: "shortest-round-trip-decimal",
      },
      unicode: {
        input: "valid-utf8-and-unicode-scalars",
        normalization: "preserve-no-nfc-or-nfd",
        objectKeyOrder: "lexicographic-unsigned-utf8-bytes",
      },
      ceilings: {
        rawUtf8Bytes: 8_388_608,
        depth: 64,
        nodes: 262_144,
        decodedStringUtf8Bytes: 6_291_456,
        arrayEntries: 65_536,
        objectEntries: 65_536,
      },
    })
    expect(contract.fieldCaps.strategyMemory).toEqual({
      value: 32_768,
      unit: "canonical-payload-bytes",
    })
    expect(contract.fieldCaps.soldierMemory.value).toBe(2_048)
    expect(contract.fieldCaps.objectivePayload.value).toBe(1_024)
  })

  it("makes success, player violation, and system failure mutually exclusive", async () => {
    const runtimeAbi = await subject()

    expect(
      runtimeAbi.isRuntimeAbiV117InvocationResult({
        kind: "success",
        value: { action: { type: "TURN_TO_STONE" }, soldierMemory: {} },
        trace: { requestId: "request:1" },
      }),
    ).toBe(true)
    expect(
      runtimeAbi.isRuntimeAbiV117InvocationResult({
        kind: "player_violation",
        violation: { code: "NON_CANONICAL_PAYLOAD" },
        failure: { code: "HOST_FAILURE" },
        trace: { requestId: "request:1" },
      }),
    ).toBe(false)
    expect(
      runtimeAbi.isRuntimeAbiV117InvocationResult({
        kind: "system_failure",
        failure: { code: "HOST_FAILURE" },
        value: {},
        trace: { requestId: "request:1" },
      }),
    ).toBe(false)
  })

  it("freezes per-method, cumulative Match, and separate preflight budget vectors", async () => {
    const { RUNTIME_ABI_V1_17: contract } = await subject()
    const budgets = contract.budgets

    expect(budgets.signedRequestBindings).toEqual([
      "selectActivations",
      "soldierBrain",
      "matchCumulative",
      "preflightProfile",
      "budgetProfileSha256",
    ])
    expect(budgets.selectActivations.invocationCountMaximum).toBe(20)
    expect(budgets.soldierBrain.invocationCountMaximum).toBe(240)
    expect(budgets.matchCumulative).toMatchObject({
      invocationCountMaximum: 260,
      wallMilliseconds: 13_000,
      computeFuel: 2_600_000_000,
      payloadBytes: 68_157_440,
    })
    for (const method of [budgets.selectActivations, budgets.soldierBrain]) {
      expect(method.vector).toMatchObject({
        wall: { value: 50, unit: "milliseconds" },
        compute: { value: 10_000_000, unit: "instruction-fuel" },
        memory: { value: 67_108_864, unit: "bytes" },
        payload: { value: 262_144, unit: "canonical-payload-bytes" },
        stdout: { value: 262_144, unit: "transport-frame-bytes" },
        stderr: { value: 65_536, unit: "raw-utf8-bytes" },
        process: { processes: 1, threads: 1, children: 0 },
        capabilities: {
          filesystem: "none",
          network: "disabled",
          environment: "empty",
          shell: "disabled",
        },
      })
    }
    expect(budgets.preflight.consumesMatchBudget).toBe(false)
    expect(Object.keys(budgets.preflight.profiles)).toEqual([
      "sourceValidation",
      "compilation",
      "artifactValidation",
      "conformance",
    ])
  })

  it("fails counted certification closed when any equivalent meter or identity pin is missing", async () => {
    const runtimeAbi = await subject()
    const complete = Object.fromEntries(
      runtimeAbi.RUNTIME_ABI_V1_17.budgets.requiredEquivalentMeters.map(
        (meter) => [meter, true],
      ),
    )
    const exactIdentity = Object.fromEntries(
      runtimeAbi.RUNTIME_ABI_V1_17.identity.requiredExecutablePins.map(
        (pin) => [pin, `sha256:${"a".repeat(64)}`],
      ),
    )

    expect(runtimeAbi.assessRuntimeAbiV117Certification(complete, exactIdentity))
      .toEqual({ status: "certifiable", missingMeters: [], missingIdentityPins: [] })
    expect(
      runtimeAbi.assessRuntimeAbiV117Certification(
        { ...complete, compute: false },
        { ...exactIdentity, compilerFlags: "" },
      ),
    ).toEqual({
      status: "uncertified",
      missingMeters: ["compute"],
      missingIdentityPins: ["compilerFlags"],
    })
    expect(
      Object.values(runtimeAbi.RUNTIME_ABI_V1_17.lanePosture).every(
        (lane) => lane.countedCertification === "uncertified",
      ),
    ).toBe(true)
  })

  it("freezes fixed domain tags, length framing, and the public/private identity split", async () => {
    const runtimeAbi = await subject()
    const identity = runtimeAbi.RUNTIME_ABI_V1_17.identity

    expect(Object.keys(identity.domains)).toEqual([
      "originalSource",
      "normalizedSource",
      "normalizationPolicy",
      "artifact",
      "artifactManifest",
      "runtimeExecutable",
      "compilerExecutable",
      "sysrootStdlib",
      "adapterBuild",
      "semanticTuple",
      "containmentPolicy",
      "conformanceCorpus",
      "budgetProfile",
      "canonicalJsonProfile",
      "evidenceBundle",
    ])
    expect(identity.framing).toEqual({
      algorithm: "sha256",
      prefix: "cowards-game:runtime-identity:v1",
      segmentLength: "unsigned-64-bit-big-endian",
      order: "domain-tag-then-ordered-segments",
    })
    expect(
      runtimeAbi.hashRuntimeAbiV117Identity("originalSource", [
        new TextEncoder().encode("abc"),
      ]),
    ).toBe("sha256:3163bf2a551ff5b16867f88fea678eb09891ede5978a24aea2ef122ebe8d4985")
    expect(identity.publicSafeFields).toEqual([
      "sourceRevisionId",
      "normalizedSourceId",
      "artifactId",
      "manifestId",
      "runtimeLaneId",
      "semanticTupleId",
      "policyId",
      "corpusId",
      "evidenceBundleId",
    ])
    expect(identity.privateFields).toContain("originalSourceBytes")
    expect(identity.privateFields).toContain("compilerFlags")
    expect(identity.privateFields).toContain("hostPaths")
  })

  it("covers every locked decision and preserves all protected v1.16 bytes during generation", async () => {
    const before = Object.fromEntries(
      Object.keys(protectedV116Files).map((file) => [file, fileHash(file)]),
    )
    expect(before).toEqual(protectedV116Files)
    const runtimeAbi = await subject()
    const rendered = runtimeAbi.renderRuntimeAbiV117ContractJson()
    const parsed = JSON.parse(rendered)
    const after = Object.fromEntries(
      Object.keys(protectedV116Files).map((file) => [file, fileHash(file)]),
    )

    expect(after).toEqual(before)
    expect(parsed.decisionMap.map((row: { id: string }) => row.id)).toEqual(
      Array.from({ length: 16 }, (_, index) => `D-${String(index + 1).padStart(2, "0")}`),
    )
    expect(parsed.historicalV116.protectedFiles).toEqual(protectedV116Files)
    expect(runtimeAbi.validateRuntimeAbiV117Contract()).toEqual([])
  })
})
