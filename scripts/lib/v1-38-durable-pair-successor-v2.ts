import { createHash } from "node:crypto"
import { normalizeV138Relative } from "./v1-38-secure-workspace-path-v2.js"

const fail = (code: string): never => { throw new TypeError(code) }
const sha256 = (bytes: string): `sha256:${string}` => `sha256:${createHash("sha256").update(bytes).digest("hex")}`

/** Pure public description used by the controller. This module owns no filesystem capability. */
export interface V138DurablePairV2Member { readonly target: string; readonly bytes: string }
export interface V138DurablePairV2Input {
  readonly transactionId: string
  readonly intentPath: string
  readonly members: readonly [V138DurablePairV2Member, V138DurablePairV2Member]
}

export const deriveV138PairIntentV2 = (
  trustedRootIdentity: Readonly<{ path: string; device: string; inode: string }>,
  input: V138DurablePairV2Input,
): Readonly<{ namespace: string; intentBytes: string; members: readonly [V138DurablePairV2Member, V138DurablePairV2Member] }> => {
  if (!/^[a-z0-9][a-z0-9-]{0,63}$/u.test(input.transactionId)) fail("V138_PAIR_V2_TRANSACTION_INVALID")
  const intentPath = normalizeV138Relative(input.intentPath)
  const members = input.members
    .map((member) => Object.freeze({ target: normalizeV138Relative(member.target), bytes: member.bytes }))
    .sort((left, right) => left.target.localeCompare(right.target)) as [V138DurablePairV2Member, V138DurablePairV2Member]
  if (members[0].target === members[1].target) fail("V138_PAIR_V2_DUPLICATE_TARGET")
  if (members.some(({ target }) => target === intentPath)) fail("V138_PAIR_V2_INTENT_MEMBER_ALIAS")
  const descriptor = Object.freeze({
    schemaVersion: "v1.38-durable-pair-intent-v2" as const,
    trustedRoot: Object.freeze({ ...trustedRootIdentity }),
    transactionId: input.transactionId,
    intentPath,
    members: Object.freeze(members.map(({ target, bytes }) => Object.freeze({ target, sha256: sha256(bytes) }))),
  })
  const intentBytes = `${JSON.stringify(descriptor)}\n`
  return Object.freeze({
    namespace: sha256(`v138-pair-stage-v2\0${intentBytes}`).slice(7),
    intentBytes,
    members: Object.freeze(members),
  })
}
