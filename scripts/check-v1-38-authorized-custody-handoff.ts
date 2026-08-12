#!/usr/bin/env -S pnpm exec tsx
import { readFileSync } from "node:fs"
import {
  buildV138AuthorizedCustodyPublicReference,
  validateV138AuthorizedCustodyHandoff,
  type V138AuthorizedCustodyApproval,
} from "./lib/v1-38-custody.js"

export const renderV138AuthorizedCustodyHandoffReference = (
  input: unknown,
  approval: V138AuthorizedCustodyApproval,
) => {
  const validation = validateV138AuthorizedCustodyHandoff(input, approval)
  return validation.authorized
    ? buildV138AuthorizedCustodyPublicReference(validation.handoff)
    : null
}

const main = (): void => {
  const inputFlag = process.argv.indexOf("--input")
  if (inputFlag < 0 || process.argv[inputFlag + 1] === undefined) {
    throw new TypeError("V138_AUTHORIZED_CUSTODY_INPUT_REQUIRED")
  }
  const input = JSON.parse(readFileSync(process.argv[inputFlag + 1]!, "utf8")) as unknown
  const unavailableApproval: V138AuthorizedCustodyApproval = Object.freeze({
    approvedOpaqueStoreIds: Object.freeze([]),
    approvedOpaqueKeyIds: Object.freeze([]),
    approvedOpaqueCustodianRoleIds: Object.freeze([]),
    approvedOpaqueOpeningActorIds: Object.freeze([]),
    approvedOpaqueOpeningCommandIds: Object.freeze([]),
    approvedOpaqueRetirementAuthorityIds: Object.freeze([]),
    approvedOpaqueTrustIdentityIds: Object.freeze([]),
    verifyAuthenticatedExternalProvenance: () => false,
  })
  const reference = renderV138AuthorizedCustodyHandoffReference(input, unavailableApproval)
  if (reference === null) throw new TypeError("V138_AUTHORIZED_CUSTODY_UNAVAILABLE")
  process.stdout.write(`${JSON.stringify(reference)}\n`)
}

if (process.argv[1]?.endsWith("check-v1-38-authorized-custody-handoff.ts")) main()
