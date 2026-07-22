import { Buffer } from "node:buffer"
import { createHash } from "node:crypto"
import {
  closeSync,
  constants,
  existsSync,
  fsyncSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
  writeSync,
} from "node:fs"
import path from "node:path"
// eslint-disable-next-line no-restricted-imports -- Release tooling reuses the canonical public-output privacy seam directly.
import { assertPublicOutputLeakSafe } from "../../packages/spec/src/public-output-privacy.js"

const SHA256 = /^sha256:[0-9a-f]{64}$/u
const SAFE_CLASS = /^(?:command-receipt|service-trace|rollback-trace|privacy-scan)$/u
const ACTOR_CLASSES = new Set([
  "collector",
  "checker",
  "release",
  "retention-worker",
])
const POLICY_RELATIVE_PATH =
  ".planning/artifacts/v1.37-restricted-evidence-policy.json"

export const V137_RESTRICTED_EVIDENCE_ACCESS_LOG_RELATIVE_PATH =
  "access/v1.37.ndjson" as const

export type V137RestrictedEvidenceClass =
  | "command-receipt"
  | "service-trace"
  | "rollback-trace"
  | "privacy-scan"

export type V137RestrictedEvidenceActorClass =
  | "collector"
  | "checker"
  | "release"
  | "retention-worker"

export type V137PublicRestrictedEvidenceRef = Readonly<{
  schemaVersion: "v1.37-restricted-evidence-ref-v1"
  sha256: `sha256:${string}`
  class: V137RestrictedEvidenceClass
  attestationSha256: `sha256:${string}`
  retentionClass: "certificate-plus-audit-window"
  availabilityPosture: "available" | "policy-deleted"
}>

export type V137RestrictedEvidenceRecord = Readonly<{
  reference: V137PublicRestrictedEvidenceRef
  byteLength: number
  latestBoundCertificateValidUntil: string
  deleteEligibleAt: string
}>

export type V137RestrictedEvidencePolicy = Readonly<{
  schemaVersion: "v1.37-restricted-evidence-policy-v1"
  milestone: "v1.37"
  retentionClass: "certificate-plus-audit-window"
  postCertificateValidityCalendarDays: 90
  releaseObjectPosture: "present-and-digest-valid"
  permanentAttestationPosture: "valid-after-policy-deletion"
  accessLog: Readonly<{
    schemaVersion: "v1.37-restricted-evidence-access-log-v1"
    appendOnly: true
    eventClasses: readonly [
      "write",
      "read",
      "verify",
      "release-check",
      "delete-authorized",
      "delete-completed",
    ]
  }>
  deletion: Readonly<{
    eligibility: "latest-bound-certificate-validity-plus-90-calendar-days"
    explicitOperationRequired: true
    writeRecordRequired: true
    objectDigestRequiredBeforeDeletion: true
    attestationDigestRequiredBeforeDeletion: true
    authorizedAndCompletedEventsRequired: true
  }>
}>

type Attestation = Readonly<{
  schemaVersion: "v1.37-restricted-evidence-attestation-v1"
  sha256: `sha256:${string}`
  class: V137RestrictedEvidenceClass
  byteLength: number
  retentionClass: "certificate-plus-audit-window"
  latestBoundCertificateValidUntil: string
  deleteEligibleAt: string
}>

const POLICY_KEYS = [
  "schemaVersion",
  "milestone",
  "retentionClass",
  "postCertificateValidityCalendarDays",
  "releaseObjectPosture",
  "permanentAttestationPosture",
  "accessLog",
  "deletion",
] as const
const REF_KEYS = [
  "schemaVersion",
  "sha256",
  "class",
  "attestationSha256",
  "retentionClass",
  "availabilityPosture",
] as const
const RECORD_KEYS = [
  "reference",
  "byteLength",
  "latestBoundCertificateValidUntil",
  "deleteEligibleAt",
] as const
const ATTESTATION_KEYS = [
  "schemaVersion",
  "sha256",
  "class",
  "byteLength",
  "retentionClass",
  "latestBoundCertificateValidUntil",
  "deleteEligibleAt",
] as const

const exactKeys = (value: Record<string, unknown>, expected: readonly string[]): boolean => {
  const actual = Object.keys(value).sort()
  const sortedExpected = [...expected].sort()
  return actual.length === sortedExpected.length && actual.every((key, index) => key === sortedExpected[index])
}

const sha256 = (bytes: Uint8Array | string): `sha256:${string}` =>
  `sha256:${createHash("sha256").update(bytes).digest("hex")}`

const fail = (code: string): never => {
  throw new TypeError(code)
}

const canonicalIso = (value: string): boolean => {
  const date = new Date(value)
  return !Number.isNaN(date.valueOf()) && date.toISOString() === value
}

const addUtcCalendarDays = (value: string, days: number): string => {
  if (!canonicalIso(value)) fail("V137_RESTRICTED_EVIDENCE_RECORD_INVALID")
  const date = new Date(value)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString()
}

const orderedPolicy = (policy: V137RestrictedEvidencePolicy): unknown => ({
  schemaVersion: policy.schemaVersion,
  milestone: policy.milestone,
  retentionClass: policy.retentionClass,
  postCertificateValidityCalendarDays:
    policy.postCertificateValidityCalendarDays,
  releaseObjectPosture: policy.releaseObjectPosture,
  permanentAttestationPosture: policy.permanentAttestationPosture,
  accessLog: {
    schemaVersion: policy.accessLog.schemaVersion,
    appendOnly: policy.accessLog.appendOnly,
    eventClasses: policy.accessLog.eventClasses,
  },
  deletion: {
    eligibility: policy.deletion.eligibility,
    explicitOperationRequired: policy.deletion.explicitOperationRequired,
    writeRecordRequired: policy.deletion.writeRecordRequired,
    objectDigestRequiredBeforeDeletion:
      policy.deletion.objectDigestRequiredBeforeDeletion,
    attestationDigestRequiredBeforeDeletion:
      policy.deletion.attestationDigestRequiredBeforeDeletion,
    authorizedAndCompletedEventsRequired:
      policy.deletion.authorizedAndCompletedEventsRequired,
  },
})

export const renderV137RestrictedEvidencePolicyJson = (
  policy: V137RestrictedEvidencePolicy,
): string => `${JSON.stringify(orderedPolicy(policy), null, 2)}\n`

export const renderV137RestrictedEvidencePolicyMarkdown = (
  policy: V137RestrictedEvidencePolicy,
): string =>
  [
    "# v1.37 Restricted Evidence Policy",
    "",
    `- Schema: \`${policy.schemaVersion}\``,
    `- Milestone: \`${policy.milestone}\``,
    `- Retention class: \`${policy.retentionClass}\``,
    `- Retention deadline: latest bound certificate validity plus ${policy.postCertificateValidityCalendarDays} calendar days`,
    "- Release posture: object and attestation must both be present and digest-valid",
    "- Permanent posture: the safe attestation remains valid after an eligible policy deletion",
    "",
    "## Access evidence",
    "",
    `The restricted access log is append-only under schema \`${policy.accessLog.schemaVersion}\`. It records only the closed event classes ${policy.accessLog.eventClasses.map((event) => `\`${event}\``).join(", ")} inside the restricted store.`,
    "",
    "## Deletion",
    "",
    "Deletion is an explicit operation. It requires the original write record, an expired retention deadline, digest-valid object and attestation bytes, and both authorization and completion events. Deleting a raw preimage never deletes or invalidates its permanent safe attestation.",
    "",
  ].join("\n")

const parsePolicy = (input: unknown): V137RestrictedEvidencePolicy => {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    fail("V137_RESTRICTED_EVIDENCE_POLICY_INVALID")
  }
  const value = input as Record<string, unknown>
  const accessLog = value.accessLog
  const deletion = value.deletion
  if (
    !exactKeys(value, POLICY_KEYS) ||
    accessLog === null ||
    typeof accessLog !== "object" ||
    Array.isArray(accessLog) ||
    deletion === null ||
    typeof deletion !== "object" ||
    Array.isArray(deletion) ||
    !exactKeys(accessLog as Record<string, unknown>, [
      "schemaVersion",
      "appendOnly",
      "eventClasses",
    ]) ||
    !exactKeys(deletion as Record<string, unknown>, [
      "eligibility",
      "explicitOperationRequired",
      "writeRecordRequired",
      "objectDigestRequiredBeforeDeletion",
      "attestationDigestRequiredBeforeDeletion",
      "authorizedAndCompletedEventsRequired",
    ])
  ) {
    fail("V137_RESTRICTED_EVIDENCE_POLICY_INVALID")
  }
  const policy = value as unknown as V137RestrictedEvidencePolicy
  if (
    policy.schemaVersion !== "v1.37-restricted-evidence-policy-v1" ||
    policy.milestone !== "v1.37" ||
    policy.retentionClass !== "certificate-plus-audit-window" ||
    policy.postCertificateValidityCalendarDays !== 90 ||
    policy.releaseObjectPosture !== "present-and-digest-valid" ||
    policy.permanentAttestationPosture !== "valid-after-policy-deletion" ||
    policy.accessLog.schemaVersion !==
      "v1.37-restricted-evidence-access-log-v1" ||
    policy.accessLog.appendOnly !== true ||
    JSON.stringify(policy.accessLog.eventClasses) !==
      JSON.stringify([
        "write",
        "read",
        "verify",
        "release-check",
        "delete-authorized",
        "delete-completed",
      ]) ||
    policy.deletion.eligibility !==
      "latest-bound-certificate-validity-plus-90-calendar-days" ||
    Object.entries(policy.deletion).some(([, setting]) =>
      typeof setting === "boolean" ? setting !== true : false,
    )
  ) {
    fail("V137_RESTRICTED_EVIDENCE_POLICY_INVALID")
  }
  return Object.freeze({
    ...policy,
    accessLog: Object.freeze({
      ...policy.accessLog,
      eventClasses: Object.freeze([...policy.accessLog.eventClasses]) as unknown as V137RestrictedEvidencePolicy["accessLog"]["eventClasses"],
    }),
    deletion: Object.freeze({ ...policy.deletion }),
  })
}

export const loadV137RestrictedEvidencePolicy = (
  repoRoot: string,
): V137RestrictedEvidencePolicy => {
  const source = readFileSync(path.join(repoRoot, POLICY_RELATIVE_PATH), "utf8")
  let parsed: unknown
  try {
    parsed = JSON.parse(source)
  } catch {
    fail("V137_RESTRICTED_EVIDENCE_POLICY_INVALID")
  }
  const policy = parsePolicy(parsed)
  if (source !== renderV137RestrictedEvidencePolicyJson(policy)) {
    fail("V137_RESTRICTED_EVIDENCE_POLICY_NONCANONICAL")
  }
  return policy
}

const digestHex = (digest: string): string => {
  if (!SHA256.test(digest)) fail("V137_RESTRICTED_EVIDENCE_RECORD_INVALID")
  return digest.slice("sha256:".length)
}

export const v137RestrictedEvidenceObjectRelativePath = (
  digest: string,
): string => {
  const hex = digestHex(digest)
  return path.posix.join("objects", hex.slice(0, 2), hex.slice(2, 4), hex)
}

export const v137RestrictedEvidenceAttestationRelativePath = (
  digest: string,
): string => {
  const hex = digestHex(digest)
  return path.posix.join(
    "attestations",
    hex.slice(0, 2),
    hex.slice(2, 4),
    `${hex}.json`,
  )
}

const orderedAttestation = (attestation: Attestation): Attestation => ({
  schemaVersion: attestation.schemaVersion,
  sha256: attestation.sha256,
  class: attestation.class,
  byteLength: attestation.byteLength,
  retentionClass: attestation.retentionClass,
  latestBoundCertificateValidUntil:
    attestation.latestBoundCertificateValidUntil,
  deleteEligibleAt: attestation.deleteEligibleAt,
})

const renderAttestation = (attestation: Attestation): string =>
  `${JSON.stringify(orderedAttestation(attestation))}\n`

const isWithin = (parent: string, candidate: string): boolean =>
  candidate === parent || candidate.startsWith(`${parent}${path.sep}`)

const assertRegularNoSymlink = (absolutePath: string): void => {
  const stat = lstatSync(absolutePath)
  if (stat.isSymbolicLink()) fail("V137_RESTRICTED_EVIDENCE_SYMLINK")
  if (!stat.isFile()) fail("V137_RESTRICTED_EVIDENCE_PATH_INVALID")
}

export const createV137RestrictedEvidenceStore = (options: Readonly<{
  repoRoot: string
  maxObjectBytes: number
}>) => {
  const configuredRoot = process.env.COWARDS_V1_37_RESTRICTED_EVIDENCE_ROOT
  if (configuredRoot === undefined || configuredRoot.length === 0) {
    fail("V137_RESTRICTED_EVIDENCE_ROOT_REQUIRED")
  }
  if (!Number.isSafeInteger(options.maxObjectBytes) || options.maxObjectBytes < 1) {
    fail("V137_RESTRICTED_EVIDENCE_SIZE_LIMIT")
  }
  const repoRoot = path.resolve(options.repoRoot)
  const root = path.resolve(configuredRoot)
  if (isWithin(repoRoot, root)) fail("V137_RESTRICTED_EVIDENCE_ROOT_IN_REPOSITORY")
  if (existsSync(root)) {
    const stat = lstatSync(root)
    if (stat.isSymbolicLink()) fail("V137_RESTRICTED_EVIDENCE_SYMLINK")
    if (!stat.isDirectory()) fail("V137_RESTRICTED_EVIDENCE_PATH_INVALID")
  } else {
    mkdirSync(root, { recursive: true, mode: 0o700 })
  }
  const policy = loadV137RestrictedEvidencePolicy(repoRoot)

  const absolute = (relativePath: string): string => {
    if (path.isAbsolute(relativePath)) fail("V137_RESTRICTED_EVIDENCE_PATH_INVALID")
    const resolved = path.resolve(root, relativePath)
    if (!isWithin(root, resolved)) fail("V137_RESTRICTED_EVIDENCE_PATH_INVALID")
    return resolved
  }

  const ensureDirectory = (absoluteDirectory: string): void => {
    if (!isWithin(root, absoluteDirectory)) {
      fail("V137_RESTRICTED_EVIDENCE_PATH_INVALID")
    }
    const relative = path.relative(root, absoluteDirectory)
    let cursor = root
    for (const segment of relative.split(path.sep).filter(Boolean)) {
      cursor = path.join(cursor, segment)
      if (!existsSync(cursor)) mkdirSync(cursor, { mode: 0o700 })
      const stat = lstatSync(cursor)
      if (stat.isSymbolicLink()) fail("V137_RESTRICTED_EVIDENCE_SYMLINK")
      if (!stat.isDirectory()) fail("V137_RESTRICTED_EVIDENCE_PATH_INVALID")
    }
  }

  const writeExclusive = (relativePath: string, bytes: Uint8Array): void => {
    const target = absolute(relativePath)
    ensureDirectory(path.dirname(target))
    try {
      writeFileSync(target, bytes, { flag: "wx", mode: 0o600 })
    } catch (error) {
      if ((error as { code?: unknown }).code === "EEXIST") {
        if (lstatSync(target).isSymbolicLink()) {
          fail("V137_RESTRICTED_EVIDENCE_SYMLINK")
        }
        fail("V137_RESTRICTED_EVIDENCE_ALREADY_EXISTS")
      }
      throw error
    }
  }

  const boundedRead = (
    relativePath: string,
    missingCode: string,
    limit = options.maxObjectBytes,
  ): Buffer => {
    const target = absolute(relativePath)
    if (!existsSync(target)) fail(missingCode)
    assertRegularNoSymlink(target)
    const stat = lstatSync(target)
    if (stat.size > limit) fail("V137_RESTRICTED_EVIDENCE_SIZE_LIMIT")
    let descriptor: number | undefined
    try {
      descriptor = openSync(
        target,
        constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0),
      )
      const bytes = readFileSync(descriptor)
      if (bytes.byteLength > limit) fail("V137_RESTRICTED_EVIDENCE_SIZE_LIMIT")
      return bytes
    } finally {
      if (descriptor !== undefined) closeSync(descriptor)
    }
  }

  const appendAccess = (
    action:
      | "write"
      | "read"
      | "verify"
      | "release-check"
      | "delete-authorized"
      | "delete-completed",
    record: V137RestrictedEvidenceRecord,
    actorClass: V137RestrictedEvidenceActorClass,
  ): void => {
    if (!ACTOR_CLASSES.has(actorClass)) {
      fail("V137_RESTRICTED_EVIDENCE_ACTOR_INVALID")
    }
    const target = absolute(V137_RESTRICTED_EVIDENCE_ACCESS_LOG_RELATIVE_PATH)
    ensureDirectory(path.dirname(target))
    if (existsSync(target)) assertRegularNoSymlink(target)
    const line = `${JSON.stringify({
      schemaVersion: policy.accessLog.schemaVersion,
      action,
      sha256: record.reference.sha256,
      attestationSha256: record.reference.attestationSha256,
      evidenceClass: record.reference.class,
      actorClass,
      at: new Date().toISOString(),
    })}\n`
    let descriptor: number | undefined
    try {
      descriptor = openSync(
        target,
        constants.O_CREAT |
          constants.O_APPEND |
          constants.O_WRONLY |
          (constants.O_NOFOLLOW ?? 0),
        0o600,
      )
      writeSync(descriptor, line)
      fsyncSync(descriptor)
    } catch (error) {
      if ((error as { code?: unknown }).code === "ELOOP") {
        fail("V137_RESTRICTED_EVIDENCE_SYMLINK")
      }
      throw error
    } finally {
      if (descriptor !== undefined) closeSync(descriptor)
    }
  }

  const parseRecord = (
    input: V137RestrictedEvidenceRecord,
  ): V137RestrictedEvidenceRecord => {
    if (
      input === null ||
      typeof input !== "object" ||
      Array.isArray(input) ||
      !exactKeys(input as unknown as Record<string, unknown>, RECORD_KEYS) ||
      input.reference === null ||
      typeof input.reference !== "object" ||
      !exactKeys(
        input.reference as unknown as Record<string, unknown>,
        REF_KEYS,
      ) ||
      input.reference.schemaVersion !== "v1.37-restricted-evidence-ref-v1" ||
      !SHA256.test(input.reference.sha256) ||
      !SHA256.test(input.reference.attestationSha256) ||
      !SAFE_CLASS.test(input.reference.class) ||
      input.reference.retentionClass !== "certificate-plus-audit-window" ||
      input.reference.availabilityPosture !== "available" ||
      !Number.isSafeInteger(input.byteLength) ||
      input.byteLength < 0 ||
      input.byteLength > options.maxObjectBytes ||
      !canonicalIso(input.latestBoundCertificateValidUntil) ||
      input.deleteEligibleAt !==
        addUtcCalendarDays(
          input.latestBoundCertificateValidUntil,
          policy.postCertificateValidityCalendarDays,
        )
    ) {
      fail("V137_RESTRICTED_EVIDENCE_RECORD_INVALID")
    }
    assertPublicOutputLeakSafe(
      input.reference,
      "v1.37 restricted evidence public reference",
    )
    return input
  }

  const verifyAttestation = (recordInput: V137RestrictedEvidenceRecord): true => {
    const record = parseRecord(recordInput)
    const source = boundedRead(
      v137RestrictedEvidenceAttestationRelativePath(
        record.reference.attestationSha256,
      ),
      "V137_RESTRICTED_EVIDENCE_ATTESTATION_MISSING",
      16 * 1024,
    )
    if (sha256(source) !== record.reference.attestationSha256) {
      fail("V137_RESTRICTED_EVIDENCE_ATTESTATION_DIGEST_MISMATCH")
    }
    let parsed: unknown
    try {
      parsed = JSON.parse(source.toString("utf8"))
    } catch {
      fail("V137_RESTRICTED_EVIDENCE_ATTESTATION_INVALID")
    }
    if (
      parsed === null ||
      typeof parsed !== "object" ||
      Array.isArray(parsed) ||
      !exactKeys(parsed as Record<string, unknown>, ATTESTATION_KEYS)
    ) {
      fail("V137_RESTRICTED_EVIDENCE_ATTESTATION_INVALID")
    }
    const attestation = parsed as Attestation
    if (
      attestation.schemaVersion !==
        "v1.37-restricted-evidence-attestation-v1" ||
      attestation.sha256 !== record.reference.sha256 ||
      attestation.class !== record.reference.class ||
      attestation.byteLength !== record.byteLength ||
      attestation.retentionClass !== record.reference.retentionClass ||
      attestation.latestBoundCertificateValidUntil !==
        record.latestBoundCertificateValidUntil ||
      attestation.deleteEligibleAt !== record.deleteEligibleAt ||
      source.toString("utf8") !== renderAttestation(attestation)
    ) {
      fail("V137_RESTRICTED_EVIDENCE_ATTESTATION_INVALID")
    }
    return true
  }

  const readObject = (recordInput: V137RestrictedEvidenceRecord): Buffer => {
    const record = parseRecord(recordInput)
    const bytes = boundedRead(
      v137RestrictedEvidenceObjectRelativePath(record.reference.sha256),
      "V137_RESTRICTED_EVIDENCE_OBJECT_MISSING",
    )
    if (bytes.byteLength !== record.byteLength || sha256(bytes) !== record.reference.sha256) {
      fail("V137_RESTRICTED_EVIDENCE_DIGEST_MISMATCH")
    }
    return bytes
  }

  const requireWriteRecord = (record: V137RestrictedEvidenceRecord): void => {
    const target = absolute(V137_RESTRICTED_EVIDENCE_ACCESS_LOG_RELATIVE_PATH)
    if (!existsSync(target)) {
      fail("V137_RESTRICTED_EVIDENCE_ACCESS_RECORD_MISSING")
    }
    const source = boundedRead(
      V137_RESTRICTED_EVIDENCE_ACCESS_LOG_RELATIVE_PATH,
      "V137_RESTRICTED_EVIDENCE_ACCESS_RECORD_MISSING",
      8 * 1024 * 1024,
    ).toString("utf8")
    const found = source
      .split("\n")
      .filter(Boolean)
      .some((line) => {
        try {
          const event = JSON.parse(line) as Record<string, unknown>
          return (
            event.schemaVersion === policy.accessLog.schemaVersion &&
            event.action === "write" &&
            event.sha256 === record.reference.sha256 &&
            event.attestationSha256 === record.reference.attestationSha256 &&
            event.evidenceClass === record.reference.class
          )
        } catch {
          return false
        }
      })
    if (!found) fail("V137_RESTRICTED_EVIDENCE_ACCESS_RECORD_MISSING")
  }

  const publicRef = (
    record: V137RestrictedEvidenceRecord,
    availabilityPosture: V137PublicRestrictedEvidenceRef["availabilityPosture"],
  ): V137PublicRestrictedEvidenceRef => {
    const reference = Object.freeze({
      schemaVersion: record.reference.schemaVersion,
      sha256: record.reference.sha256,
      class: record.reference.class,
      attestationSha256: record.reference.attestationSha256,
      retentionClass: record.reference.retentionClass,
      availabilityPosture,
    })
    assertPublicOutputLeakSafe(
      reference,
      "v1.37 restricted evidence public reference",
    )
    return reference
  }

  return Object.freeze({
    writeEvidence(input: Readonly<{
      bytes: Uint8Array
      evidenceClass: V137RestrictedEvidenceClass
      actorClass: V137RestrictedEvidenceActorClass
      latestBoundCertificateValidUntil: string
    }>): V137RestrictedEvidenceRecord {
      if (
        !(input.bytes instanceof Uint8Array) ||
        input.bytes.byteLength > options.maxObjectBytes ||
        input.bytes.byteLength === 0
      ) {
        fail("V137_RESTRICTED_EVIDENCE_SIZE_LIMIT")
      }
      if (!SAFE_CLASS.test(input.evidenceClass)) {
        fail("V137_RESTRICTED_EVIDENCE_CLASS_INVALID")
      }
      if (!ACTOR_CLASSES.has(input.actorClass)) {
        fail("V137_RESTRICTED_EVIDENCE_ACTOR_INVALID")
      }
      const objectSha256 = sha256(input.bytes)
      const deleteEligibleAt = addUtcCalendarDays(
        input.latestBoundCertificateValidUntil,
        policy.postCertificateValidityCalendarDays,
      )
      const attestation: Attestation = Object.freeze({
        schemaVersion: "v1.37-restricted-evidence-attestation-v1",
        sha256: objectSha256,
        class: input.evidenceClass,
        byteLength: input.bytes.byteLength,
        retentionClass: policy.retentionClass,
        latestBoundCertificateValidUntil:
          input.latestBoundCertificateValidUntil,
        deleteEligibleAt,
      })
      const attestationBytes = Buffer.from(renderAttestation(attestation), "utf8")
      const attestationSha256 = sha256(attestationBytes)
      const record: V137RestrictedEvidenceRecord = Object.freeze({
        reference: Object.freeze({
          schemaVersion: "v1.37-restricted-evidence-ref-v1",
          sha256: objectSha256,
          class: input.evidenceClass,
          attestationSha256,
          retentionClass: policy.retentionClass,
          availabilityPosture: "available",
        }),
        byteLength: input.bytes.byteLength,
        latestBoundCertificateValidUntil:
          input.latestBoundCertificateValidUntil,
        deleteEligibleAt,
      })
      parseRecord(record)
      const objectPath = v137RestrictedEvidenceObjectRelativePath(objectSha256)
      const attestationPath = v137RestrictedEvidenceAttestationRelativePath(
        attestationSha256,
      )
      if (existsSync(absolute(objectPath))) {
        const existingObject = boundedRead(
          objectPath,
          "V137_RESTRICTED_EVIDENCE_OBJECT_COLLISION",
        )
        if (!existingObject.equals(Buffer.from(input.bytes))) {
          fail("V137_RESTRICTED_EVIDENCE_OBJECT_COLLISION")
        }
        const existingAttestation = boundedRead(
          attestationPath,
          "V137_RESTRICTED_EVIDENCE_ATTESTATION_COLLISION",
        )
        if (!existingAttestation.equals(attestationBytes)) {
          fail("V137_RESTRICTED_EVIDENCE_ATTESTATION_COLLISION")
        }
        return record
      }
      writeExclusive(
        objectPath,
        input.bytes,
      )
      writeExclusive(
        attestationPath,
        attestationBytes,
      )
      appendAccess("write", record, input.actorClass)
      return record
    },

    readEvidence(
      record: V137RestrictedEvidenceRecord,
      access: Readonly<{ actorClass: V137RestrictedEvidenceActorClass }>,
    ): Buffer {
      const bytes = readObject(record)
      verifyAttestation(record)
      appendAccess("read", record, access.actorClass)
      return bytes
    },

    verifyEvidence(
      record: V137RestrictedEvidenceRecord,
      access: Readonly<{ actorClass: V137RestrictedEvidenceActorClass }>,
    ): true {
      readObject(record)
      verifyAttestation(record)
      appendAccess("verify", record, access.actorClass)
      return true
    },

    requireReleaseEvidence(record: V137RestrictedEvidenceRecord): true {
      parseRecord(record)
      requireWriteRecord(record)
      const relativeObject = v137RestrictedEvidenceObjectRelativePath(
        record.reference.sha256,
      )
      if (!existsSync(absolute(relativeObject))) {
        fail("V137_RESTRICTED_EVIDENCE_RELEASE_OBJECT_MISSING")
      }
      readObject(record)
      verifyAttestation(record)
      appendAccess("release-check", record, "release")
      return true
    },

    deleteEvidenceAfterRetention(
      recordInput: V137RestrictedEvidenceRecord,
      deletion: Readonly<{
        actorClass: "retention-worker"
        now: string
      }>,
    ): V137PublicRestrictedEvidenceRef {
      const record = parseRecord(recordInput)
      if (!canonicalIso(deletion.now)) {
        fail("V137_RESTRICTED_EVIDENCE_RECORD_INVALID")
      }
      if (deletion.now < record.deleteEligibleAt) {
        fail("V137_RESTRICTED_EVIDENCE_RETENTION_ACTIVE")
      }
      requireWriteRecord(record)
      readObject(record)
      verifyAttestation(record)
      appendAccess("delete-authorized", record, deletion.actorClass)
      unlinkSync(
        absolute(
          v137RestrictedEvidenceObjectRelativePath(record.reference.sha256),
        ),
      )
      appendAccess("delete-completed", record, deletion.actorClass)
      return publicRef(record, "policy-deleted")
    },

    verifyPermanentAttestation(record: V137RestrictedEvidenceRecord): true {
      return verifyAttestation(record)
    },
  })
}
