import { admitCanonicalJsonValue } from "@cowards/spec"
import { freezeLabValue, labRoot, type LabRoot } from "../contracts.js"

const ROOT = /^sha256:[0-9a-f]{64}$/u
const fail = (code: string): never => { throw new TypeError(`INTAKE_${code}`) }
const root = (value: unknown): value is LabRoot => typeof value === "string" && ROOT.test(value)
export interface FrozenIntakeProtocol { readonly schemaVersion: "frozen-intake-protocol-v1"; readonly root: LabRoot; readonly authorization: LabRoot; readonly disclosure: "source-and-provenance"; readonly submissionLimit: number; readonly timeLimitMinutes: number; readonly reviewerLimit: number; readonly reviewerReuseLimit: number; readonly conflictsDeclared: boolean; readonly confidentiality: "private"; readonly provenanceRequired: true; readonly validationRequired: true; readonly acceptanceBudget: number }
export const admitFrozenIntakeProtocol = (value: unknown): Readonly<FrozenIntakeProtocol> => {
  const admitted = admitCanonicalJsonValue(value, { profile: "canonical-manifest" }); if (!admitted.ok || !admitted.value || typeof admitted.value !== "object") return fail("PROTOCOL")
  const p = admitted.value as Record<string, unknown>, keys = ["schemaVersion","root","authorization","disclosure","submissionLimit","timeLimitMinutes","reviewerLimit","reviewerReuseLimit","conflictsDeclared","confidentiality","provenanceRequired","validationRequired","acceptanceBudget"]
  if (Object.keys(p).sort().join("|") !== keys.sort().join("|") || p.schemaVersion !== "frozen-intake-protocol-v1" || !root(p.root) || !root(p.authorization) || p.disclosure !== "source-and-provenance" || p.conflictsDeclared !== true || p.confidentiality !== "private" || p.provenanceRequired !== true || p.validationRequired !== true || ![p.submissionLimit,p.timeLimitMinutes,p.reviewerLimit,p.reviewerReuseLimit,p.acceptanceBudget].every((n) => Number.isSafeInteger(n) && Number(n) > 0) || p.root !== labRoot("frozen-intake-protocol-v1", { ...p, root: undefined })) return fail("PROTOCOL")
  return freezeLabValue(p as unknown as FrozenIntakeProtocol)
}
export const blockedIntakeConfiguration = (reason: "incomplete_protocol" | "unauthorized_participant") => freezeLabValue({ schemaVersion: "intake-blocked-v1" as const, privacy: "private_offline" as const, reason, root: labRoot("intake-blocked-v1", { reason }) })
export const projectIntakeForReviewer = (protocol: FrozenIntakeProtocol, value: { sourceRoot: LabRoot; provenanceRoot: LabRoot; submissionRoot: LabRoot }) => freezeLabValue({ protocolRoot: admitFrozenIntakeProtocol(protocol).root, sourceRoot: value.sourceRoot, provenanceRoot: value.provenanceRoot, submissionRoot: value.submissionRoot })
