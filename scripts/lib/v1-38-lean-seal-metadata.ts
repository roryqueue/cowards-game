/** Metadata only: never opens a seal store, preimage, secret or evaluation. */
import { constants, openSync, closeSync, readFileSync, lstatSync, realpathSync, fstatSync, existsSync } from "node:fs"
import { execFileSync } from "node:child_process"
import { resolve } from "node:path"
import { labRoot } from "../../packages/strategy-lab/src/contracts.js"
import { leanBytesRoot } from "../../packages/strategy-lab/src/league/lean-experiment.js"

const metadata = (relative: string) => {
  const path = resolve(relative)
  if (!existsSync(path)) return { present: false as const, bytesRoot: null }
  const stat = lstatSync(path)
  if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1 || realpathSync(path) !== path || stat.size > 16384) throw new TypeError("LEAN_SEAL_METADATA")
  const fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW)
  try {
    const bound = fstatSync(fd)
    if (bound.dev !== stat.dev || bound.ino !== stat.ino || bound.size !== stat.size || bound.nlink !== 1) throw new TypeError("LEAN_SEAL_METADATA")
    const bytes = readFileSync(fd)
    if (bytes.length !== stat.size || bytes.length > 16384) throw new TypeError("LEAN_SEAL_METADATA")
    // Hash only these already-public contract bytes. No private store or
    // preimage is located, generated, parsed, evaluated or opened here.
    return { present: true as const, bytesRoot: leanBytesRoot(bytes) }
  } finally { closeSync(fd) }
}
export const inspectLeanSealMetadata = () => {
  const protocol = metadata(".planning/artifacts/v1.38-local-seal-protocol-v2.json")
  const originalPublicReference = metadata(".planning/artifacts/v1.38-local-seal-public-reference.json")
  const checkoutDirty = execFileSync("git", ["status", "--porcelain=v1", "-z", "--untracked-files=normal"], { maxBuffer: 1048576 }).length > 0
  const body = { schemaVersion: "lean-seal-metadata-inventory-v1" as const,
    protocol, originalPublicReference, checkoutDirty,
    originalCompatibleUnopenedSealVerified: false, privateStoreOrPreimageRead: false,
    newExploratorySealCreated: false, reservedHoldoutPerProfile: 4,
    disposition: "holdout_claim_deferred_no_verified_compatible_seal" as const,
    reason: checkoutDirty ? "existing_clean_checkout_seal_prerequisite_not_met" : "compatible_original_seal_and_new_safe_provenance_not_established",
    claims: { absenceOfAllExternalSealsProved: false, originalCommitmentSatisfied: false, holdoutOpened: false },
  }
  return Object.freeze({ ...body, root: labRoot("lean-seal-metadata-inventory-v1", body) })
}
