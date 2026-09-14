import { createHash } from "node:crypto"
import { admitFactory, type FactorySourceAdmission } from "./admission.js"
import { factoryProposalFromPacket, type FactoryOraclePacket } from "./contracts.js"
import { admitFrozenIntakeProtocol, type FrozenIntakeProtocol } from "./intake-protocol.js"
import { createFactoryAttemptStart, createFactoryAttemptTerminal } from "./ledger.js"
import { publishFactoryAttemptTerminal, recordFactoryAttemptStart, type FactoryRepository } from "./repository.js"
import type { LabRoot } from "../contracts.js"
const root = (bytes: Uint8Array): LabRoot => `sha256:${createHash("sha256").update(bytes).digest("hex")}` as LabRoot
export interface QuarantinedIntakePacket { readonly protocol: FrozenIntakeProtocol; readonly packet: FactoryOraclePacket; readonly sourceBytes: Uint8Array; readonly provenanceRoot: LabRoot; readonly submissionOrdinal: number; readonly reviewerOrdinal: number; readonly elapsedMinutes: number; readonly conflictFree: boolean }
/** Charges every packet before validation, then forwards only exact deterministic bytes to common hostile admission. */
export const admitQuarantinedIntakePacket = (input: QuarantinedIntakePacket, repository: FactoryRepository): Readonly<{ disposition: string; attemptRoot: LabRoot; admission?: FactorySourceAdmission }> => {
  const protocol = admitFrozenIntakeProtocol(input.protocol), attempt = createFactoryAttemptStart({ taskRoot: protocol.root, budgetRoot: protocol.authorization, candidateRoot: input.packet.root, authoringMechanism: "external-submission", inputRoot: input.provenanceRoot, resourceAccountingRoot: protocol.root, retryParentRoot: null })
  recordFactoryAttemptStart(repository, attempt)
  let disposition = "rejected", admission: FactorySourceAdmission | undefined
  try { if (input.submissionOrdinal >= protocol.submissionLimit || input.reviewerOrdinal >= protocol.reviewerLimit || input.elapsedMinutes > protocol.timeLimitMinutes || !input.conflictFree || root(input.sourceBytes) !== input.packet.source.root) throw new TypeError("INTAKE_REJECTED"); admission = admitFactory({ packet: input.packet, proposal: factoryProposalFromPacket(input.packet), sourceBytes: input.sourceBytes, repository }); disposition = "accepted" } catch { disposition = "rejected" }
  const terminal = createFactoryAttemptTerminal({ startRoot: attempt.root, disposition: disposition === "accepted" ? "accepted" : "rejected", outputRoot: admission?.proposalRoot ?? input.provenanceRoot, validationRoot: protocol.root, duplicateEvidenceRoot: protocol.root, finalEvidenceRoot: protocol.root })
  publishFactoryAttemptTerminal(repository, attempt, terminal)
  return { disposition, attemptRoot: attempt.root, ...(admission ? { admission } : {}) }
}
