import { it, expect } from "vitest"
import { inspectLeanSealMetadata } from "./v1-38-lean-seal-metadata.js"
it("records public metadata and honest deferral without opening any private seal", () => {
  const inventory = inspectLeanSealMetadata()
  expect(inventory).toMatchObject({ privateStoreOrPreimageRead: false, newExploratorySealCreated: false, originalCompatibleUnopenedSealVerified: false, reservedHoldoutPerProfile: 4, disposition: "holdout_claim_deferred_no_verified_compatible_seal" })
  expect(inventory.claims.absenceOfAllExternalSealsProved).toBe(false)
  expect(inventory.root).toMatch(/^sha256:/)
  expect(JSON.stringify(inventory)).not.toMatch(/commitment-secret|StrategyMemory|SoldierMemory|evaluation\.json/)
})
