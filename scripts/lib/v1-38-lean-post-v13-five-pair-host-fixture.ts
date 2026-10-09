/** Sanitized NON-AUTHORIZING source fixture. No operator history is read.
 * Its custom raw pins deliberately cannot pass the production authenticator. */
import { labRoot } from "../../packages/strategy-lab/src/contracts.js"
import { leanBytesRoot, leanCanonicalBytes } from "../../packages/strategy-lab/src/league/lean-experiment.js"

export const createLeanPostV13HostHistoryFixtureV14 = () => {
  const root = (label: string) => labRoot("HOST-nonauthorizing-five-pair-metadata", label)
  const seal = (body: Record<string, unknown>) => ({ ...body, root: labRoot(String(body.schemaVersion), body) })
  const sourceRoot = "sha256:e7d8bf583b09828a34f5cd79d81cb0220242b093dd26e6026b30705347d5b442", allocationRoot = "sha256:5edd320e53cba57dcbf38f0a4fa170e5f5be5527f932735264c2121ec9a9cd81", head = "5b01e62eec1554f68dce6f80dd24d41646dc50d8"
  const verification = seal({ schemaVersion: "HOST-nonauthorizing-terminal-verification", accepted: false, authorizing: false, finalReaderClose: false, resultAbsent: true, checkAbsent: true, route: "baseline", currentCharges: 0, cumulativeCharged: 35, entryHead: head, sourceRoot, allocationRoot, closedAtMs: 1791496635485, cumulativeElapsedMs: 148694388 })
  const verificationBytes = leanCanonicalBytes(verification)
  const carry = seal({ schemaVersion: "HOST-nonauthorizing-terminal-carry", outcome: "entered_without_result", accepted: false, authorizing: false, route: "baseline", currentCharges: 0, cumulativeCharged: 35, entryHead: head, sourceRoot, allocationRoot, resultBytesRoot: null, closedAtMs: 1791496635485, cumulativeElapsedMs: 148694388, allocatedDiskBytes: 22777856, verificationRoot: verification.root, verificationBytesRoot: leanBytesRoot(verificationBytes), closureRoot: verification.root, requestBytesRoot: root("opaque-request"), entryBytesRoot: root("opaque-entry"), survivors: Array.from({ length: 774 }, (_, n) => ({ identity: `.strategy-lab/HOST-opaque-history-${n}`, allocatedBytes: 0 })) })
  const carryBytes = leanCanonicalBytes(carry)
  const hold = seal({ schemaVersion: "HOST-nonauthorizing-terminal-hold", head, sourceRoot, mode: "v13-1", route: "baseline", carryRoot: carry.root, carryBytesRoot: leanBytesRoot(carryBytes), verificationRoot: verification.root, verificationBytesRoot: leanBytesRoot(verificationBytes), requestBytesRoot: root("opaque-request"), entryBytesRoot: root("opaque-entry") })
  const records = [verification, carry, hold], raw = [verificationBytes, carryBytes, leanCanonicalBytes(hold)]
  const pins = records.map((record, n) => ({ path: `.strategy-lab/HOST-nonauthorizing-metadata-${n}.json`, root: record.root, bytesRoot: leanBytesRoot(raw[n]!) }))
  return { pins, bytes: new Map(pins.map((pin, n) => [pin.path, raw[n]!])) }
}
