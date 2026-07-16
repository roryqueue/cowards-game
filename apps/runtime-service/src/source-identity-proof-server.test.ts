import { once } from "node:events"
import type { AddressInfo } from "node:net"
import { afterEach, describe, expect, it } from "vitest"
import {
  PHASE258_SOURCE_IDENTITY_PROOF_HOST,
  createPhase258SourceIdentityProofRuntimeService,
} from "./source-identity-proof-server.js"

const environment = {
  COWARDS_PHASE258_SOURCE_IDENTITY_E2E_SERVER: "1",
  COWARDS_PROVIDER_VALIDATION_SECRET: "phase258-provider-proof",
  COWARDS_RUNTIME_SERVICE_PRIVATE_ARTIFACT_TOKEN:
    "phase258-private-artifact-proof",
} as const

const servers: ReturnType<
  typeof createPhase258SourceIdentityProofRuntimeService
>[] = []

afterEach(async () => {
  await Promise.all(
    servers.splice(0).map(
      (server) =>
        new Promise<void>((resolve) => server.close(() => resolve())),
    ),
  )
})

describe("Phase 258 source-identity proof-only runtime service", () => {
  it("fails closed unless the guard and both proof secrets are present", () => {
    expect(() =>
      createPhase258SourceIdentityProofRuntimeService({}),
    ).toThrow("guard is disabled")
    expect(() =>
      createPhase258SourceIdentityProofRuntimeService({
        COWARDS_PHASE258_SOURCE_IDENTITY_E2E_SERVER: "1",
      }),
    ).toThrow("COWARDS_PROVIDER_VALIDATION_SECRET")
    expect(() =>
      createPhase258SourceIdentityProofRuntimeService({
        COWARDS_PHASE258_SOURCE_IDENTITY_E2E_SERVER: "1",
        COWARDS_PROVIDER_VALIDATION_SECRET: "present",
      }),
    ).toThrow("COWARDS_RUNTIME_SERVICE_PRIVATE_ARTIFACT_TOKEN")
  })

  it("binds on loopback and exposes validation but never execution", async () => {
    const server = createPhase258SourceIdentityProofRuntimeService(environment)
    servers.push(server)
    server.listen(0, PHASE258_SOURCE_IDENTITY_PROOF_HOST)
    await once(server, "listening")
    const address = server.address() as AddressInfo
    expect(address.address).toBe(PHASE258_SOURCE_IDENTITY_PROOF_HOST)
    const url = `http://${PHASE258_SOURCE_IDENTITY_PROOF_HOST}:${address.port}`

    const health = await fetch(`${url}/health`)
    expect(health.status).toBe(200)
    expect(health.headers.get("x-cowards-proof-only")).toBe(
      "phase258-source-identity",
    )
    await expect(health.json()).resolves.toEqual({
      ok: true,
      service: "phase258-source-identity-validation-proof",
      proofOnly: true,
      executionAvailable: false,
    })

    const source = `export default {
      selectActivations() { return { activationOrders: [], strategyMemory: {} } },
      soldierBrain() { return { action: { type: "TURN_TO_STONE" }, soldierMemory: {} } }
    }`
    const validation = await fetch(`${url}/validate-strategy`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sourceFormat: "typescript", source }),
    })
    expect(validation.status).toBe(200)
    expect(validation.headers.get("x-cowards-proof-only")).toBe(
      "phase258-source-identity",
    )
    await expect(validation.json()).resolves.toMatchObject({
      ok: true,
      kind: "strategyValidation",
      sourceFormat: "typescript",
      provider: { id: "strategy-language-provider-js-ts" },
    })

    const execution = await fetch(`${url}/execute-match`, { method: "POST" })
    expect(execution.status).toBe(404)
    await expect(execution.json()).resolves.toEqual({
      ok: false,
      error: "proof_route_unavailable",
    })
  })
})
