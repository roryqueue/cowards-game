import { createHash } from "node:crypto"
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { assertPublicOutputLeakSafe } from "../../packages/spec/src/public-output-privacy.js"
import {
  V137_RESTRICTED_EVIDENCE_ACCESS_LOG_RELATIVE_PATH,
  createV137RestrictedEvidenceStore,
  loadV137RestrictedEvidencePolicy,
  renderV137RestrictedEvidencePolicyJson,
  renderV137RestrictedEvidencePolicyMarkdown,
  v137RestrictedEvidenceAttestationRelativePath,
  v137RestrictedEvidenceObjectRelativePath,
} from "./v1-37-restricted-evidence-store.js"

const repoRoot = path.resolve(import.meta.dirname, "../..")
const policyJsonPath = path.join(
  repoRoot,
  ".planning/artifacts/v1.37-restricted-evidence-policy.json",
)
const policyMarkdownPath = path.join(
  repoRoot,
  ".planning/artifacts/v1.37-restricted-evidence-policy.md",
)

describe("v1.37 restricted evidence store", () => {
  let temporaryRoot: string
  let evidenceRoot: string
  let originalRoot: string | undefined

  beforeEach(() => {
    temporaryRoot = mkdtempSync(path.join(tmpdir(), "cowards-v137-restricted-"))
    evidenceRoot = path.join(temporaryRoot, "evidence")
    originalRoot = process.env.COWARDS_V1_37_RESTRICTED_EVIDENCE_ROOT
    process.env.COWARDS_V1_37_RESTRICTED_EVIDENCE_ROOT = evidenceRoot
  })

  afterEach(() => {
    if (originalRoot === undefined) {
      delete process.env.COWARDS_V1_37_RESTRICTED_EVIDENCE_ROOT
    } else {
      process.env.COWARDS_V1_37_RESTRICTED_EVIDENCE_ROOT = originalRoot
    }
    rmSync(temporaryRoot, { recursive: true, force: true })
  })

  const createStore = (maxObjectBytes = 1024) =>
    createV137RestrictedEvidenceStore({ repoRoot, maxObjectBytes })

  const writeSample = () =>
    createStore().writeEvidence({
      bytes: Buffer.from("private service trace\n", "utf8"),
      evidenceClass: "service-trace",
      actorClass: "collector",
      latestBoundCertificateValidUntil: "2030-01-31T23:59:59.000Z",
    })

  it("loads synchronized certificate-validity-plus-90-days policy artifacts", () => {
    const policy = loadV137RestrictedEvidencePolicy(repoRoot)
    expect(policy).toMatchObject({
      schemaVersion: "v1.37-restricted-evidence-policy-v1",
      retentionClass: "certificate-plus-audit-window",
      postCertificateValidityCalendarDays: 90,
      releaseObjectPosture: "present-and-digest-valid",
      permanentAttestationPosture: "valid-after-policy-deletion",
    })
    expect(readFileSync(policyJsonPath, "utf8")).toBe(
      renderV137RestrictedEvidencePolicyJson(policy),
    )
    expect(readFileSync(policyMarkdownPath, "utf8")).toBe(
      renderV137RestrictedEvidencePolicyMarkdown(policy),
    )
  })

  it("writes immutable content-addressed evidence and exposes only a safe opaque ref", () => {
    const store = createStore()
    const bytes = Buffer.from("private service trace\n", "utf8")
    const record = store.writeEvidence({
      bytes,
      evidenceClass: "service-trace",
      actorClass: "collector",
      latestBoundCertificateValidUntil: "2030-01-31T23:59:59.000Z",
    })
    const expectedSha = `sha256:${createHash("sha256").update(bytes).digest("hex")}`
    expect(record.reference).toEqual({
      schemaVersion: "v1.37-restricted-evidence-ref-v1",
      sha256: expectedSha,
      class: "service-trace",
      attestationSha256: expect.stringMatching(/^sha256:[0-9a-f]{64}$/u),
      retentionClass: "certificate-plus-audit-window",
      availabilityPosture: "available",
    })
    expect(Object.keys(record.reference)).toEqual([
      "schemaVersion",
      "sha256",
      "class",
      "attestationSha256",
      "retentionClass",
      "availabilityPosture",
    ])
    expect(JSON.stringify(record.reference)).not.toContain(evidenceRoot)
    expect(JSON.stringify(record.reference)).not.toContain("collector")
    assertPublicOutputLeakSafe(record.reference, "restricted evidence public ref")
    expect(
      readFileSync(
        path.join(evidenceRoot, v137RestrictedEvidenceObjectRelativePath(expectedSha)),
      ),
    ).toEqual(bytes)
    expect(() =>
      store.writeEvidence({
        bytes,
        evidenceClass: "service-trace",
        actorClass: "collector",
        latestBoundCertificateValidUntil: "2030-01-31T23:59:59.000Z",
      }),
    ).toThrowError("V137_RESTRICTED_EVIDENCE_ALREADY_EXISTS")
  })

  it("enforces bounded writes and reads and verifies the content digest", () => {
    expect(() =>
      createStore(4).writeEvidence({
        bytes: Buffer.from("12345"),
        evidenceClass: "command-receipt",
        actorClass: "collector",
        latestBoundCertificateValidUntil: "2030-01-31T23:59:59.000Z",
      }),
    ).toThrowError("V137_RESTRICTED_EVIDENCE_SIZE_LIMIT")

    const record = writeSample()
    const store = createStore()
    expect(store.readEvidence(record, { actorClass: "checker" })).toEqual(
      Buffer.from("private service trace\n", "utf8"),
    )
    const objectPath = path.join(
      evidenceRoot,
      v137RestrictedEvidenceObjectRelativePath(record.reference.sha256),
    )
    writeFileSync(objectPath, "tampered", { flag: "w" })
    expect(() => store.readEvidence(record, { actorClass: "checker" })).toThrowError(
      "V137_RESTRICTED_EVIDENCE_DIGEST_MISMATCH",
    )
  })

  it("rejects path-escaping records and symlinked objects without following them", () => {
    const record = writeSample()
    const store = createStore()
    const pathEscape = {
      ...record,
      reference: { ...record.reference, sha256: "sha256:../../outside" },
    }
    expect(() => store.readEvidence(pathEscape, { actorClass: "checker" })).toThrowError(
      "V137_RESTRICTED_EVIDENCE_RECORD_INVALID",
    )

    const objectPath = path.join(
      evidenceRoot,
      v137RestrictedEvidenceObjectRelativePath(record.reference.sha256),
    )
    const outside = path.join(temporaryRoot, "outside")
    writeFileSync(outside, "outside")
    unlinkSync(objectPath)
    symlinkSync(outside, objectPath)
    expect(() => store.readEvidence(record, { actorClass: "checker" })).toThrowError(
      "V137_RESTRICTED_EVIDENCE_SYMLINK",
    )
  })

  it("writes append-only access records and release checks require the write record", () => {
    const record = writeSample()
    const store = createStore()
    store.readEvidence(record, { actorClass: "checker" })
    store.verifyEvidence(record, { actorClass: "release" })
    store.requireReleaseEvidence(record)
    const accessPath = path.join(
      evidenceRoot,
      V137_RESTRICTED_EVIDENCE_ACCESS_LOG_RELATIVE_PATH,
    )
    const events = readFileSync(accessPath, "utf8")
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line) as Record<string, unknown>)
    expect(events.map(({ action }) => action)).toEqual([
      "write",
      "read",
      "verify",
      "release-check",
    ])
    expect(events.every(({ sha256 }) => sha256 === record.reference.sha256)).toBe(true)

    writeFileSync(accessPath, "", { flag: "w" })
    expect(() => store.requireReleaseEvidence(record)).toThrowError(
      "V137_RESTRICTED_EVIDENCE_ACCESS_RECORD_MISSING",
    )
  })

  it("fails strict release when an object or attestation is absent", () => {
    const record = writeSample()
    const store = createStore()
    unlinkSync(
      path.join(
        evidenceRoot,
        v137RestrictedEvidenceObjectRelativePath(record.reference.sha256),
      ),
    )
    expect(() => store.requireReleaseEvidence(record)).toThrowError(
      "V137_RESTRICTED_EVIDENCE_RELEASE_OBJECT_MISSING",
    )

    const second = createStore().writeEvidence({
      bytes: Buffer.from("another trace"),
      evidenceClass: "rollback-trace",
      actorClass: "collector",
      latestBoundCertificateValidUntil: "2030-01-31T23:59:59.000Z",
    })
    unlinkSync(
      path.join(
        evidenceRoot,
        v137RestrictedEvidenceAttestationRelativePath(
          second.reference.attestationSha256,
        ),
      ),
    )
    expect(() => store.requireReleaseEvidence(second)).toThrowError(
      "V137_RESTRICTED_EVIDENCE_ATTESTATION_MISSING",
    )
  })

  it("requires certificate validity plus 90 calendar days before logged deletion", () => {
    const record = writeSample()
    const store = createStore()
    expect(record.deleteEligibleAt).toBe("2030-05-01T23:59:59.000Z")
    expect(() =>
      store.deleteEvidenceAfterRetention(record, {
        actorClass: "retention-worker",
        now: "2030-05-01T23:59:58.999Z",
      }),
    ).toThrowError("V137_RESTRICTED_EVIDENCE_RETENTION_ACTIVE")

    const deletedRef = store.deleteEvidenceAfterRetention(record, {
      actorClass: "retention-worker",
      now: "2030-05-01T23:59:59.000Z",
    })
    expect(deletedRef).toEqual({
      ...record.reference,
      availabilityPosture: "policy-deleted",
    })
    assertPublicOutputLeakSafe(deletedRef, "deleted restricted evidence public ref")
    expect(() => store.readEvidence(record, { actorClass: "checker" })).toThrowError(
      "V137_RESTRICTED_EVIDENCE_OBJECT_MISSING",
    )
    expect(store.verifyPermanentAttestation(record)).toBe(true)

    const accessPath = path.join(
      evidenceRoot,
      V137_RESTRICTED_EVIDENCE_ACCESS_LOG_RELATIVE_PATH,
    )
    const actions = readFileSync(accessPath, "utf8")
      .trim()
      .split("\n")
      .map((line) => (JSON.parse(line) as { action: string }).action)
    expect(actions).toContain("delete-authorized")
    expect(actions.at(-1)).toBe("delete-completed")
  })

  it("rejects a symlinked access log before appending", () => {
    const store = createStore()
    const accessPath = path.join(
      evidenceRoot,
      V137_RESTRICTED_EVIDENCE_ACCESS_LOG_RELATIVE_PATH,
    )
    mkdirSync(path.dirname(accessPath), { recursive: true })
    const outside = path.join(temporaryRoot, "outside-log")
    writeFileSync(outside, "")
    symlinkSync(outside, accessPath)
    expect(() =>
      store.writeEvidence({
        bytes: Buffer.from("trace"),
        evidenceClass: "service-trace",
        actorClass: "collector",
        latestBoundCertificateValidUntil: "2030-01-31T23:59:59.000Z",
      }),
    ).toThrowError("V137_RESTRICTED_EVIDENCE_SYMLINK")
    expect(readFileSync(outside, "utf8")).toBe("")
  })
})
