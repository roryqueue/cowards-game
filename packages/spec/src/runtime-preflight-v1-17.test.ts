import { Buffer } from "node:buffer"
import { createHash, createHmac } from "node:crypto"
import { describe, expect, it } from "vitest"
import { frameCanonicalIdentity } from "./canonical-identity-domains.js"
import { encodeCanonicalJson } from "./canonical-json-encode.js"
import {
  RUNTIME_PREFLIGHT_V1_17_CANDIDATE,
  createAuthenticatedRuntimePreflightReceiptV117,
  createAuthenticatedRuntimePreflightRequestV117,
  createAuthenticatedRuntimePreflightRetryRequestV117,
  createRuntimePreflightBudgetV117,
  createRuntimePreflightObservedEvidenceV117,
  serializeRuntimePreflightReceiptV117,
  serializeRuntimePreflightRequestV117,
  verifyRuntimePreflightReceiptV117,
  verifyRuntimePreflightRequestV117,
  type AuthenticatedRuntimePreflightRequestV117,
  type RuntimePreflightObservedEvidenceInputV117,
  type RuntimePreflightSigningIdentityV117,
} from "./runtime-preflight-v1-17.js"
import {
  createRuntimeAbiV117PreflightLedger,
  debitRuntimeAbiV117Ledger,
} from "./runtime-abi-v1-17.js"
import * as publicRuntime from "./runtime.js"
import type { JsonValue } from "./types.js"

const signingIdentity: RuntimePreflightSigningIdentityV117 = {
  keyId: "fixture-only:runtime-preflight:v1.17",
  secret: "fixture-only:runtime-preflight:v1.17:secret",
}

const hash = (character: string): `sha256:${string}` =>
  `sha256:${character.repeat(64)}`

const canonicalBytes = (value: JsonValue): Uint8Array => {
  const encoded = encodeCanonicalJson(value, {
    context: "authenticated-outer-envelope",
  })
  if (!encoded.ok) throw new Error(encoded.error.code)
  return encoded.bytes
}

const sha256 = (bytes: Uint8Array): `sha256:${string}` =>
  `sha256:${createHash("sha256").update(bytes).digest("hex")}`

const requestInput = () => ({
  requestId: "preflight-request:0001",
  operationId: "preflight-operation:0001",
  profile: "sourceValidation" as const,
  accounting: {
    prestate: createRuntimeAbiV117PreflightLedger("sourceValidation"),
  },
  input: {
    inputId: "strategy-source:revision-0001",
    kind: "source-bytes" as const,
    bytes: new TextEncoder().encode("export default {}\r\n"),
  },
  retryId: "preflight-retry:0001",
  evidenceContext: {
    producer: {
      producerId: "runtime-preflight-service:candidate",
      buildSha256: hash("1"),
    },
    toolchain: {
      toolchainId: "typescript:5.9.3:node:24.4.1",
      runtimeExecutableSha256: hash("2"),
      compilerExecutableSha256: hash("3"),
      sysrootStdlibSha256: hash("4"),
      adapterBuildSha256: hash("5"),
      reportedVersion: "typescript-5.9.3-node-24.4.1",
      targetAbi: "strategy-runtime-abi-v1.17",
    },
    containment: {
      policyId: "runtime-preflight-containment-v1.17",
      policySha256: hash("6"),
      evidenceBundleSha256: hash("7"),
    },
  },
})

const request = (): AuthenticatedRuntimePreflightRequestV117 =>
  createAuthenticatedRuntimePreflightRequestV117(
    requestInput(),
    signingIdentity,
  )

const observedEvidenceInput = (
  candidate = request(),
  overrides: Partial<RuntimePreflightObservedEvidenceInputV117> = {},
): RuntimePreflightObservedEvidenceInputV117 => {
  const cumulative = candidate.accounting.prestate.cumulative
  return {
    operationResult: { kind: "valid" },
    attribution: "proven_strategy",
    counters: {
      wallMilliseconds: {
        status: "measured",
        delta: 2,
        cumulative: cumulative.wallMilliseconds + 2,
      },
      computeFuel: {
        status: "measured",
        delta: 3,
        cumulative: cumulative.computeFuel + 3,
      },
      inputBytes: {
        status: "measured",
        delta: candidate.input.byteLength,
        cumulative: cumulative.inputBytes + candidate.input.byteLength,
      },
      outputBytes: {
        status: "measured",
        delta: 5,
        cumulative: cumulative.outputBytes + 5,
      },
      stderrBytes: {
        status: "measured",
        delta: 0,
        cumulative: cumulative.stderrBytes,
      },
    },
    memory: {
      status: "measured",
      peakBytes: 1024,
      cumulativePeakBytes: Math.max(cumulative.memoryBytes, 1024),
    },
    process: {
      status: "verified",
      processes: 1,
      threads: 1,
      children: 0,
    },
    capabilities: {
      status: "verified",
      network: "disabled",
      filesystem: "none",
    },
    accountingEvidence: {
      status: "verified",
      signatureVerified: true,
      monotonic: true,
    },
    ...overrides,
  }
}

const resign = <T extends { authentication: unknown }>(
  envelope: T,
  label: "request" | "receipt",
  identity = signingIdentity,
): T => {
  const { authentication: _authentication, ...unsigned } = envelope
  const input = frameCanonicalIdentity("evidenceBundle", [
    new TextEncoder().encode(`runtime-preflight-v1.17:${label}`),
    canonicalBytes(unsigned as unknown as JsonValue),
  ])
  return {
    ...unsigned,
    authentication: {
      algorithm: "hmac-sha256",
      keyId: identity.keyId,
      signatureInputSha256: sha256(input),
      signature: `hmac-sha256:${createHmac("sha256", identity.secret)
        .update(input)
        .digest("hex")}`,
    },
  } as T
}

const mutateAndResignRequest = (
  candidate: AuthenticatedRuntimePreflightRequestV117,
  mutate: (draft: Record<string, any>) => void,
): Uint8Array => {
  const draft = globalThis.structuredClone(candidate) as Record<string, any>
  mutate(draft)
  return canonicalBytes(
    resign(
      draft as unknown as AuthenticatedRuntimePreflightRequestV117,
      "request",
    ) as unknown as JsonValue,
  )
}

describe("candidate v1.17 authenticated preflight contract", () => {
  it("is inactive, exposes no default secret, and binds exact request identities", () => {
    expect(RUNTIME_PREFLIGHT_V1_17_CANDIDATE).toEqual({
      contractVersion: "runtime-preflight-v1.17",
      runtimeAbiVersion: "strategy-runtime-abi-v1.17",
      lifecycle: "inactive-candidate",
      activationPlan: "258-14",
      current: false,
    })
    expect(publicRuntime).not.toHaveProperty(
      "RUNTIME_PREFLIGHT_V1_17_TEST_SECRET",
    )

    const candidate = request()
    const bytes = serializeRuntimePreflightRequestV117(candidate)
    const verified = verifyRuntimePreflightRequestV117(bytes, signingIdentity)
    expect(verified).toMatchObject({ ok: true })
    expect(candidate.budget).toEqual(
      createRuntimePreflightBudgetV117("sourceValidation"),
    )
    expect(candidate.accounting).toMatchObject({
      domain: "preflight",
      prestateRevision: 0,
      prestateCanonicalByteLength: expect.any(Number),
      prestateSha256: expect.stringMatching(/^sha256:[0-9a-f]{64}$/u),
      requestIdentity: expect.stringMatching(/^sha256:[0-9a-f]{64}$/u),
      idempotencyKeySha256: expect.stringMatching(/^sha256:[0-9a-f]{64}$/u),
    })
    expect(candidate.input).toMatchObject({
      inputId: "strategy-source:revision-0001",
      kind: "source-bytes",
      byteLength: 19,
      sha256: expect.stringMatching(/^sha256:[0-9a-f]{64}$/u),
      identitySha256: expect.stringMatching(/^sha256:[0-9a-f]{64}$/u),
    })
    expect(candidate.evidenceContext.producer.identitySha256).toMatch(
      /^sha256:[0-9a-f]{64}$/u,
    )
    expect(candidate.evidenceContext.toolchain.identitySha256).toMatch(
      /^sha256:[0-9a-f]{64}$/u,
    )
    expect(candidate.evidenceContext.containment.identitySha256).toMatch(
      /^sha256:[0-9a-f]{64}$/u,
    )
    expect(Object.isFrozen(candidate)).toBe(true)
    expect(serializeRuntimePreflightRequestV117(candidate)).toEqual(bytes)
  })

  it.each([
    [
      "profile",
      (draft: Record<string, any>) => (draft.profile = "compilation"),
    ],
    [
      "limit",
      (draft: Record<string, any>) =>
        (draft.budget.limits.wallMilliseconds += 1),
    ],
    [
      "prestate",
      (draft: Record<string, any>) =>
        (draft.accounting.prestate.cumulative.wallMilliseconds += 1),
    ],
    ["input", (draft: Record<string, any>) => (draft.input.byteLength += 1)],
    [
      "producer evidence",
      (draft: Record<string, any>) =>
        (draft.evidenceContext.producer.buildSha256 = hash("8")),
    ],
    [
      "toolchain evidence",
      (draft: Record<string, any>) =>
        (draft.evidenceContext.toolchain.adapterBuildSha256 = hash("9")),
    ],
    [
      "containment evidence",
      (draft: Record<string, any>) =>
        (draft.evidenceContext.containment.policySha256 = hash("a")),
    ],
    [
      "operation",
      (draft: Record<string, any>) =>
        (draft.operationId = "preflight-operation:other"),
    ],
    ["retry", (draft: Record<string, any>) => (draft.retry.attempt = 1)],
    [
      "idempotency",
      (draft: Record<string, any>) =>
        (draft.accounting.idempotencyKeySha256 = hash("b")),
    ],
  ])("rejects re-signed %s binding drift before any debit", (_name, mutate) => {
    const candidate = request()
    const verified = verifyRuntimePreflightRequestV117(
      mutateAndResignRequest(candidate, mutate),
      signingIdentity,
    )
    expect(verified).toEqual({
      ok: false,
      disposition: "no_commit",
      failure: { code: "BINDING_MISMATCH" },
    })
    expect(candidate.accounting.prestate.revision).toBe(0)
  })

  it("rejects noncanonical bytes, signature/key drift, and cross-domain replay", () => {
    const candidate = request()
    const bytes = serializeRuntimePreflightRequestV117(candidate)
    expect(
      verifyRuntimePreflightRequestV117(
        Buffer.concat([Buffer.from(" "), Buffer.from(bytes)]),
        signingIdentity,
      ),
    ).toMatchObject({
      ok: false,
      disposition: "no_commit",
      failure: { code: "NON_CANONICAL" },
    })

    const badSignature = globalThis.structuredClone(candidate) as Record<
      string,
      any
    >
    badSignature.authentication.signature = `hmac-sha256:${"0".repeat(64)}`
    expect(
      verifyRuntimePreflightRequestV117(
        canonicalBytes(badSignature as unknown as JsonValue),
        signingIdentity,
      ),
    ).toMatchObject({
      ok: false,
      disposition: "no_commit",
      failure: { code: "AUTHENTICATION_FAILED" },
    })
    expect(
      verifyRuntimePreflightRequestV117(bytes, {
        ...signingIdentity,
        keyId: "fixture-only:wrong-key",
      }),
    ).toMatchObject({
      ok: false,
      disposition: "no_commit",
      failure: { code: "AUTHENTICATION_FAILED" },
    })
    expect(
      verifyRuntimePreflightRequestV117(bytes, {
        keyId: "invalid key id",
        secret: signingIdentity.secret,
      }),
    ).toMatchObject({
      ok: false,
      disposition: "no_commit",
      failure: { code: "AUTHENTICATION_FAILED" },
    })

    const wrongDomain = resign(candidate, "receipt")
    expect(
      verifyRuntimePreflightRequestV117(
        canonicalBytes(wrongDomain as unknown as JsonValue),
        signingIdentity,
      ),
    ).toMatchObject({
      ok: false,
      disposition: "no_commit",
      failure: { code: "AUTHENTICATION_FAILED" },
    })
  })

  it("authenticates observed evidence, accounting debit, poststate, and exact request bytes", () => {
    const candidate = request()
    const evidence = createRuntimePreflightObservedEvidenceV117(
      candidate,
      observedEvidenceInput(candidate),
    )
    const receipt = createAuthenticatedRuntimePreflightReceiptV117(
      candidate,
      evidence,
      signingIdentity,
    )
    const verified = verifyRuntimePreflightReceiptV117(
      serializeRuntimePreflightReceiptV117(receipt),
      candidate,
      signingIdentity,
    )
    expect(verified).toMatchObject({ ok: true })
    expect(receipt).toMatchObject({
      envelopeKind: "runtime-preflight-receipt",
      requestBinding: {
        requestSha256: sha256(serializeRuntimePreflightRequestV117(candidate)),
        operationId: candidate.operationId,
        profile: candidate.profile,
        profileSha256: candidate.budget.profileSha256,
        prestateSha256: candidate.accounting.prestateSha256,
        inputSha256: candidate.input.sha256,
        producerIdentitySha256:
          candidate.evidenceContext.producer.identitySha256,
      },
      evidence: {
        profileSha256: candidate.budget.profileSha256,
        inputSha256: candidate.input.sha256,
        identitySha256: expect.stringMatching(/^sha256:[0-9a-f]{64}$/u),
      },
      accounting: {
        disposition: "commit",
        receipt: {
          domain: "preflight",
          evidenceIdentity: evidence.identitySha256,
        },
        poststate: { revision: 1 },
        poststateSha256: expect.stringMatching(/^sha256:[0-9a-f]{64}$/u),
      },
      outcome: { kind: "success" },
    })
    expect(Object.isFrozen(receipt)).toBe(true)
  })

  it.each([
    [
      "request",
      (draft: Record<string, any>) =>
        (draft.requestBinding.requestSha256 = hash("c")),
    ],
    [
      "evidence",
      (draft: Record<string, any>) => (draft.evidence.inputSha256 = hash("d")),
    ],
    [
      "accounting receipt",
      (draft: Record<string, any>) =>
        (draft.accounting.receipt.counters.wallMilliseconds.delta += 1),
    ],
    [
      "poststate",
      (draft: Record<string, any>) =>
        (draft.accounting.poststate.cumulative.wallMilliseconds += 1),
    ],
  ])("rejects re-signed receipt %s drift", (_name, mutate) => {
    const candidate = request()
    const evidence = createRuntimePreflightObservedEvidenceV117(
      candidate,
      observedEvidenceInput(candidate),
    )
    const receipt = createAuthenticatedRuntimePreflightReceiptV117(
      candidate,
      evidence,
      signingIdentity,
    )
    const draft = globalThis.structuredClone(receipt) as Record<string, any>
    mutate(draft)
    const bytes = canonicalBytes(
      resign(draft as typeof receipt, "receipt") as unknown as JsonValue,
    )
    expect(
      verifyRuntimePreflightReceiptV117(bytes, candidate, signingIdentity),
    ).toEqual({
      ok: false,
      disposition: "no_commit",
      failure: { code: "BINDING_MISMATCH" },
    })
  })

  it("treats receipt signature/key/domain drift as no-commit authentication failure", () => {
    const candidate = request()
    const evidence = createRuntimePreflightObservedEvidenceV117(
      candidate,
      observedEvidenceInput(candidate),
    )
    const receipt = createAuthenticatedRuntimePreflightReceiptV117(
      candidate,
      evidence,
      signingIdentity,
    )
    const badSignature = globalThis.structuredClone(receipt) as Record<
      string,
      any
    >
    badSignature.authentication.signature = `hmac-sha256:${"0".repeat(64)}`
    for (const bytes of [
      canonicalBytes(badSignature as unknown as JsonValue),
      canonicalBytes(resign(receipt, "request") as unknown as JsonValue),
    ]) {
      expect(
        verifyRuntimePreflightReceiptV117(bytes, candidate, signingIdentity),
      ).toMatchObject({
        ok: false,
        disposition: "no_commit",
        failure: { code: "AUTHENTICATION_FAILED" },
      })
    }
    expect(
      verifyRuntimePreflightReceiptV117(
        serializeRuntimePreflightReceiptV117(receipt),
        candidate,
        { ...signingIdentity, keyId: "fixture-only:wrong-key" },
      ),
    ).toMatchObject({
      ok: false,
      disposition: "no_commit",
      failure: { code: "AUTHENTICATION_FAILED" },
    })
  })

  it.each([
    ["host", "host"],
    ["ambiguous", "ambiguous"],
    ["unavailable", "unavailable"],
  ] as const)(
    "keeps %s failure no-commit with the exact unchanged prestate",
    (_name, failureKind) => {
      const candidate = request()
      const input = observedEvidenceInput(
        candidate,
        failureKind === "unavailable"
          ? {
              counters: {
                ...observedEvidenceInput(candidate).counters,
                computeFuel: { status: "unavailable" },
              },
            }
          : { attribution: failureKind },
      )
      const evidence = createRuntimePreflightObservedEvidenceV117(
        candidate,
        input,
      )
      const receipt = createAuthenticatedRuntimePreflightReceiptV117(
        candidate,
        evidence,
        signingIdentity,
      )
      expect(receipt.outcome.kind).toBe("system_failure")
      expect(receipt.accounting.disposition).toBe("no_commit")
      expect(receipt.accounting.poststate).toEqual(
        candidate.accounting.prestate,
      )
      expect(
        verifyRuntimePreflightReceiptV117(
          serializeRuntimePreflightReceiptV117(receipt),
          candidate,
          signingIdentity,
        ),
      ).toMatchObject({ ok: true })
    },
  )

  it("keeps a measured wall timeout system-owned and no-commit", () => {
    const candidate = request()
    const base = observedEvidenceInput(candidate)
    const wallMaximum = candidate.budget.limits.wallMilliseconds
    const evidence = createRuntimePreflightObservedEvidenceV117(candidate, {
      ...base,
      counters: {
        ...base.counters,
        wallMilliseconds: {
          status: "measured",
          delta: wallMaximum + 1,
          cumulative: wallMaximum + 1,
        },
      },
    })
    const receipt = createAuthenticatedRuntimePreflightReceiptV117(
      candidate,
      evidence,
      signingIdentity,
    )
    expect(receipt).toMatchObject({
      outcome: {
        kind: "system_failure",
        code: "STRATEGY_TIMEOUT",
      },
      accounting: {
        disposition: "no_commit",
        poststate: candidate.accounting.prestate,
      },
    })
  })

  it.each([-1, 1])(
    "keeps input-byte accounting drift (%s) no-commit",
    (difference) => {
      const candidate = request()
      const base = observedEvidenceInput(candidate)
      const inputBytes = candidate.input.byteLength + difference
      const evidence = createRuntimePreflightObservedEvidenceV117(candidate, {
        ...base,
        counters: {
          ...base.counters,
          inputBytes: {
            status: "measured",
            delta: inputBytes,
            cumulative:
              candidate.accounting.prestate.cumulative.inputBytes + inputBytes,
          },
        },
      })
      const receipt = createAuthenticatedRuntimePreflightReceiptV117(
        candidate,
        evidence,
        signingIdentity,
      )
      expect(receipt).toMatchObject({
        outcome: {
          kind: "system_failure",
          code: "METER_ACCOUNTING_INCONSISTENT",
        },
        accounting: {
          disposition: "no_commit",
          poststate: candidate.accounting.prestate,
        },
      })
      expect(
        verifyRuntimePreflightReceiptV117(
          serializeRuntimePreflightReceiptV117(receipt),
          candidate,
          signingIdentity,
        ),
      ).toMatchObject({ ok: true })
    },
  )

  it("executes frozen invalid-input and infrastructure ownership", () => {
    const candidate = request()
    const invalidEvidence = createRuntimePreflightObservedEvidenceV117(
      candidate,
      observedEvidenceInput(candidate, {
        operationResult: {
          kind: "invalid_input",
          code: "PREFLIGHT_INPUT_INVALID",
          owner: "submission_violation",
        },
      }),
    )
    const invalid = createAuthenticatedRuntimePreflightReceiptV117(
      candidate,
      invalidEvidence,
      signingIdentity,
    )
    expect(invalid).toMatchObject({
      outcome: {
        kind: "submission_violation",
        code: "PREFLIGHT_INPUT_INVALID",
      },
      accounting: { disposition: "commit", poststate: { revision: 1 } },
    })
    expect(
      debitRuntimeAbiV117Ledger(
        invalid.accounting.poststate,
        invalid.accounting.receipt,
      ),
    ).toMatchObject({
      kind: "success",
      committed: false,
      replayed: true,
      ledger: invalid.accounting.poststate,
    })

    const unavailableEvidence = createRuntimePreflightObservedEvidenceV117(
      candidate,
      observedEvidenceInput(candidate, {
        operationResult: {
          kind: "infrastructure_failure",
          code: "PREFLIGHT_INFRASTRUCTURE_UNAVAILABLE",
          owner: "system_failure",
        },
      }),
    )
    const unavailable = createAuthenticatedRuntimePreflightReceiptV117(
      candidate,
      unavailableEvidence,
      signingIdentity,
    )
    expect(unavailable).toMatchObject({
      outcome: {
        kind: "system_failure",
        code: "PREFLIGHT_INFRASTRUCTURE_UNAVAILABLE",
      },
      accounting: {
        disposition: "no_commit",
        poststate: candidate.accounting.prestate,
      },
    })
  })

  it("rejects operation-result ownership tampering and rebinding", () => {
    const candidate = request()
    expect(() =>
      createRuntimePreflightObservedEvidenceV117(
        candidate,
        observedEvidenceInput(candidate, {
          operationResult: {
            kind: "invalid_input",
            code: "PREFLIGHT_INPUT_INVALID",
            owner: "system_failure",
          } as any,
        }),
      ),
    ).toThrow()

    const evidence = createRuntimePreflightObservedEvidenceV117(
      candidate,
      observedEvidenceInput(candidate, {
        operationResult: {
          kind: "invalid_input",
          code: "PREFLIGHT_INPUT_INVALID",
          owner: "submission_violation",
        },
      }),
    )
    const receipt = createAuthenticatedRuntimePreflightReceiptV117(
      candidate,
      evidence,
      signingIdentity,
    )
    const reboundInput = requestInput()
    reboundInput.input.bytes = new TextEncoder().encode("different bytes")
    const reboundRequest = createAuthenticatedRuntimePreflightRequestV117(
      reboundInput,
      signingIdentity,
    )
    expect(() =>
      createAuthenticatedRuntimePreflightReceiptV117(
        reboundRequest,
        evidence,
        signingIdentity,
      ),
    ).toThrow(/unbound preflight evidence/u)
    const draft = globalThis.structuredClone(receipt) as Record<string, any>
    draft.evidence.operationResult = { kind: "valid" }
    const tampered = canonicalBytes(
      resign(draft as typeof receipt, "receipt") as unknown as JsonValue,
    )
    expect(
      verifyRuntimePreflightReceiptV117(tampered, candidate, signingIdentity),
    ).toEqual({
      ok: false,
      disposition: "no_commit",
      failure: { code: "BINDING_MISMATCH" },
    })
  })

  it("retries from the original signed ledger without refill or double debit", () => {
    const initial = request()
    const unavailableEvidence = createRuntimePreflightObservedEvidenceV117(
      initial,
      observedEvidenceInput(initial, {
        counters: {
          ...observedEvidenceInput(initial).counters,
          computeFuel: { status: "unavailable" },
        },
      }),
    )
    const failed = createAuthenticatedRuntimePreflightReceiptV117(
      initial,
      unavailableEvidence,
      signingIdentity,
    )
    expect(failed.accounting).toMatchObject({
      disposition: "no_commit",
      poststate: { revision: 0 },
    })

    const retry = createAuthenticatedRuntimePreflightRetryRequestV117(
      initial,
      { requestId: "preflight-request:retry-0002" },
      signingIdentity,
    )
    expect(retry).toMatchObject({
      operationId: initial.operationId,
      accounting: {
        prestate: initial.accounting.prestate,
        requestIdentity: initial.accounting.requestIdentity,
        idempotencyKeySha256: initial.accounting.idempotencyKeySha256,
      },
      retry: {
        retryId: initial.retry.retryId,
        attempt: 1,
        previousRequestSha256: sha256(
          serializeRuntimePreflightRequestV117(initial),
        ),
        originalRequestSha256: sha256(
          serializeRuntimePreflightRequestV117(initial),
        ),
      },
    })
    expect(
      verifyRuntimePreflightRequestV117(
        serializeRuntimePreflightRequestV117(retry),
        signingIdentity,
        initial,
      ),
    ).toMatchObject({ ok: true })
    expect(
      verifyRuntimePreflightRequestV117(
        serializeRuntimePreflightRequestV117(retry),
        signingIdentity,
      ),
    ).toMatchObject({
      ok: false,
      disposition: "no_commit",
      failure: { code: "RETRY_BINDING_MISMATCH" },
    })

    const retryEvidence = createRuntimePreflightObservedEvidenceV117(
      retry,
      observedEvidenceInput(retry),
    )
    const succeeded = createAuthenticatedRuntimePreflightReceiptV117(
      retry,
      retryEvidence,
      signingIdentity,
    )
    expect(succeeded.accounting).toMatchObject({
      disposition: "commit",
      poststate: { revision: 1 },
    })

    const replay = debitRuntimeAbiV117Ledger(
      succeeded.accounting.poststate,
      succeeded.accounting.receipt,
    )
    expect(replay).toMatchObject({
      kind: "success",
      committed: false,
      replayed: true,
      ledger: succeeded.accounting.poststate,
    })

    const conflictingEvidence = createRuntimePreflightObservedEvidenceV117(
      retry,
      observedEvidenceInput(retry, {
        counters: {
          ...observedEvidenceInput(retry).counters,
          wallMilliseconds: {
            status: "measured",
            delta: 4,
            cumulative: 4,
          },
        },
      }),
    )
    const conflict = debitRuntimeAbiV117Ledger(
      succeeded.accounting.poststate,
      conflictingEvidence.accountingReceipt,
    )
    expect(conflict).toMatchObject({
      kind: "system_failure",
      committed: false,
      replayed: false,
      failure: { code: "LEDGER_IDENTITY_CONFLICT" },
      ledger: succeeded.accounting.poststate,
    })
  })

  it("changes input and request identity when even one source byte changes", () => {
    const firstInput = requestInput()
    const secondInput = requestInput()
    secondInput.input.bytes = new TextEncoder().encode("export default {}\n")
    const first = createAuthenticatedRuntimePreflightRequestV117(
      firstInput,
      signingIdentity,
    )
    const second = createAuthenticatedRuntimePreflightRequestV117(
      secondInput,
      signingIdentity,
    )
    expect(first.input.sha256).not.toBe(second.input.sha256)
    expect(first.input.identitySha256).not.toBe(second.input.identitySha256)
    expect(first.accounting.requestIdentity).not.toBe(
      second.accounting.requestIdentity,
    )
    expect(first.accounting.idempotencyKeySha256).not.toBe(
      second.accounting.idempotencyKeySha256,
    )
  })
})
