import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { pathToFileURL } from "node:url"
import { admitCanonicalJsonBytes } from "@cowards/spec"
import { LEAGUE_APPROVED_PROSPECTIVE_POLICY } from "../../packages/strategy-lab/src/league/allocation.js"
import { writePhase265PacketSummaryExclusive } from "./prepare-phase-265-packets.js"

const fail = (code: string): never => { throw new TypeError(`PHASE265_REVIEWED_INPUT_${code}`) }
const exact = (value: unknown, keys: readonly string[]): value is Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value) && Object.keys(value).sort().join() === [...keys].sort().join()

/** Convert a separately recorded review of exact draft bytes into packet input. */
export const preparePhase265ReviewedInput = (draftBytes: Uint8Array, reviewMarkdown: string, repositoryDirectory: string) => {
  const parsed = admitCanonicalJsonBytes(draftBytes, { profile: "canonical-manifest", operation: "require-canonical" })
  if (!parsed.ok || !exact(parsed.value, ["schemaVersion", "privacy", "implementationRoot", "sourceRoot", "toolchainRoot", "responseFactoryDependencyRoot", "jobs"]) || parsed.value.schemaVersion !== "phase265-request-drafts-v1" || !Array.isArray(parsed.value.jobs) || parsed.value.jobs.length !== 11) return fail("DRAFT")
  const digest = createHash("sha256").update(draftBytes).digest("hex")
  const candidates = [...reviewMarkdown.matchAll(/```json\s*([\s\S]*?)\s*```/gu)].map((match) => {
    try { return JSON.parse(match[1]!) as unknown } catch { return null }
  })
  const review = candidates.find((candidate) => exact(candidate, ["draftSha256", "reviewerAgentId", "jobs"]) && candidate.draftSha256 === digest)
  if (!review || !exact(review, ["draftSha256", "reviewerAgentId", "jobs"]) || review.reviewerAgentId !== "/root/265_draft_reviewer" || !Array.isArray(review.jobs) || review.jobs.length !== 11) return fail("REVIEW_OR_HASH")
  const reviewed = review.jobs as unknown[]
  const schedule = LEAGUE_APPROVED_PROSPECTIVE_POLICY.schedule.flat()
  const jobs = parsed.value.jobs.map((raw, index) => {
    if (!exact(raw, ["id", "producerRequest", "disclosure", "provenance"]) || typeof raw.id !== "string") return fail("DRAFT_JOB")
    const row = reviewed[index]
    if (!exact(row, ["id", "disposition", "reviewMilliseconds", "startUtc", "endUtc", "reason"]) || row.id !== raw.id || row.disposition !== "accepted" || typeof row.reason !== "string" || !row.reason.trim() || !Number.isSafeInteger(row.reviewMilliseconds) || Number(row.reviewMilliseconds) <= 0 || Number(row.reviewMilliseconds) > 900_000 || typeof row.startUtc !== "string" || typeof row.endUtc !== "string") return fail("REVIEW_JOB")
    const start = Date.parse(row.startUtc), end = Date.parse(row.endUtc)
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start || Number(row.reviewMilliseconds) > end - start + 1000) return fail("REVIEW_TIME")
    const producer = schedule[index]
    if (!producer || !exact(raw.producerRequest, ["producerIdentity", "origin", "evidenceClass", "producerInput"]) || raw.producerRequest.producerIdentity !== { tactical: "emitTacticalFactoryPacket", teacher: "emitTeacherFactoryPacket", model: "emitModelFactoryPacket" }[producer]) return fail("SCHEDULE")
    return {
      id: raw.id,
      producerRequest: raw.producerRequest,
      participantId: `${raw.id}-author`,
      reviewerId: `${raw.id}-reviewer`,
      disclosure: raw.disclosure,
      provenance: raw.provenance,
      review: { disposition: "accepted", reviewMilliseconds: row.reviewMilliseconds },
    }
  })
  return {
    packetInput: { schemaVersion: "phase265-response-packets-v1", repositoryDirectory, jobs },
    participantRoles: jobs.map((job, index) => ({ jobId: job.id, producer: schedule[index], authorAgentId: "codex:root", reviewerAgentId: "codex:265_draft_reviewer" })),
    draftSha256: digest,
  }
}

const main = () => {
  const arg = (name: string) => { const index = process.argv.indexOf(name); return index < 0 ? undefined : process.argv[index + 1] }
  const draft = arg("--draft"), review = arg("--review"), repository = arg("--repository"), inputOutput = arg("--packet-input-output"), rolesOutput = arg("--roles-output")
  if (!draft || !review || !repository || !inputOutput || !rolesOutput || process.argv.includes("--help")) return fail("USAGE: --draft <canonical-json> --review <markdown> --repository <response-factory-dir> --packet-input-output <new-json> --roles-output <new-json>")
  const result = preparePhase265ReviewedInput(readFileSync(resolve(draft)), readFileSync(resolve(review), "utf8"), resolve(repository))
  writePhase265PacketSummaryExclusive(inputOutput, result.packetInput)
  writePhase265PacketSummaryExclusive(rolesOutput, result.participantRoles)
  process.stdout.write(`${JSON.stringify({ draftSha256: result.draftSha256, packetInputPath: resolve(inputOutput), rolesPath: resolve(rolesOutput) })}\n`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try { main() } catch (error) { process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`); process.exitCode = 1 }
}
