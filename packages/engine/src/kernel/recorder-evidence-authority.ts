import { createHash } from "node:crypto"

const EVIDENCE_RECEIPT_DOMAIN =
  "cowards-game:candidate-execution-evidence-receipt:v1" as const
const issuedEvidence = new WeakMap<object, string>()

const digestEvidence = (evidence: object): string =>
  createHash("sha256")
    .update(`${EVIDENCE_RECEIPT_DOMAIN}\0`, "utf8")
    .update(JSON.stringify(evidence), "utf8")
    .digest("hex")

/** Internal kernel issuer. Not exported through the engine package surface. */
export const issueCandidateExecutionEvidence = <T extends object>(
  evidence: T,
): T => {
  issuedEvidence.set(evidence, digestEvidence(evidence))
  return evidence
}

export const verifyCandidateExecutionEvidence = (
  evidence: unknown,
): evidence is object =>
  typeof evidence === "object" &&
  evidence !== null &&
  issuedEvidence.get(evidence) === digestEvidence(evidence)
