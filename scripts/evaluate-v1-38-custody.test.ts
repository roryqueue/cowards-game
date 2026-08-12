import { createHash, createHmac } from "node:crypto"
import {
  chmodSync,
  lstatSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { afterEach, describe, expect, it } from "vitest"
import * as custodySurface from "./lib/v1-38-custody.js"
import {
  V138AuthorizedCustodyHandoffSchema,
  createV138CustodyCommitment,
  executeV138CustodyCommand,
  projectV138SafeCustodyReceipt,
  validateV138AuthorizedCustodyHandoff,
} from "./lib/v1-38-custody.js"
import { renderV138AuthorizedCustodyHandoffReference } from "./check-v1-38-authorized-custody-handoff.js"

const HASH_A = `sha256:${"a".repeat(64)}` as const
const HASH_B = `sha256:${"b".repeat(64)}` as const
const HASH_C = `sha256:${"c".repeat(64)}` as const
const PROTOCOL_ROOT =
  "sha256:613012ed8975648e43476cf2b1c365f2f341595b3037be113978414016ba1167" as const
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const roots: string[] = []

const temporaryRoot = (): string => {
  const root = mkdtempSync(path.join(tmpdir(), "cowards-v138-custody-"))
  roots.push(root)
  return root
}

afterEach(() => {
  while (roots.length > 0) rmSync(roots.pop()!, { recursive: true, force: true })
})

const commitmentInput = (storeRoot: string) => ({
  repoRoot,
  storeRoot,
  sealedBytes: Buffer.from("synthetic non-holdout evaluation bytes\n", "utf8"),
  keyedMaterial: Buffer.from("synthetic-test-keyedMaterial-material-32b", "utf8"),
  salt: Buffer.from("synthetic-test-salt-material-32bytes", "utf8"),
  dataClass: "synthetic_non_holdout",
  profileNeutralProtocolRoot: PROTOCOL_ROOT,
  maxSealedBytes: 1_024,
}) as const

const commandOptions = (storeRoot: string) => ({
  repoRoot,
  storeRoot,
  keyedMaterial: commitmentInput(storeRoot).keyedMaterial,
  salt: commitmentInput(storeRoot).salt,
}) as const

const handoff = () => ({
  schemaVersion: "v1.38-authorized-custody-handoff-v1",
  commitment: {
    profile: "hmac-sha-256-secret-salted-v1",
    digest: HASH_A,
    profileNeutralProtocolRoot: PROTOCOL_ROOT,
  },
  controls: {
    opaqueStoreId: "synthetic-test-store-alpha",
    opaqueKeyId: "synthetic-test-key-alpha",
    opaqueCustodianRoleId: "synthetic-test-custodian-alpha",
    separatelyPermissioned: true,
  },
  opening: {
    opaqueActorId: "synthetic-test-opening-alpha",
    opaqueCommandId: "synthetic-test-command-alpha",
    openOrdinal: 1,
    oneOpenOnly: true,
  },
  ledger: {
    accessLedgerRoot: HASH_B,
    queryLedgerRoot: HASH_C,
    appendOnly: true,
    rawQueriesExposed: false,
  },
  safeProjection: {
    schemaId: "bounded-safe-aggregate-v1",
    fieldAllowlistRoot: HASH_A,
    cardinalityMax: 16,
    byteMax: 4_096,
  },
  contamination: {
    responsePolicyId: "terminal-invalidation-v1",
    terminal: true,
    replacementAllowed: false,
  },
  retention: {
    policyId: "bounded-retention-v1",
    opaqueRetirementAuthorityId: "synthetic-test-retirement-alpha",
  },
  lineage: {
    lineageRoot: HASH_B,
    sourceDataExcluded: true,
    trainingDataExcluded: true,
    promptsExcluded: true,
    cachesExcluded: true,
    opponentConstructionExcluded: true,
    scheduleConstructionExcluded: true,
  },
  preSearchPolicy: {
    policyRoot: HASH_C,
    exactBytesSha256: HASH_A,
  },
  provenance: {
    opaqueTrustIdentityId: "synthetic-test-trust-alpha",
    opaqueIssuerIdentityId: "synthetic-test-issuer-alpha",
    envelopeDigest: HASH_B,
    signatureProfile: "approved-external-authentication-v1",
    selfIssued: false,
  },
}) as const

const approval = {
  approvedOpaqueStoreIds: [] as readonly string[],
  approvedOpaqueKeyIds: [] as readonly string[],
  approvedOpaqueCustodianRoleIds: [] as readonly string[],
  approvedOpaqueOpeningActorIds: [] as readonly string[],
  approvedOpaqueOpeningCommandIds: [] as readonly string[],
  approvedOpaqueRetirementAuthorityIds: [] as readonly string[],
  approvedOpaqueTrustIdentityIds: [] as readonly string[],
  verifyAuthenticatedExternalProvenance: () => false,
} as const

describe("Phase 262 closed synthetic custody mechanics", () => {
  it("offers only the closed command surface and creates an outside-repository restricted store", () => {
    expect(Object.keys(custodySurface)).not.toEqual(expect.arrayContaining([
      "read", "query", "get", "readPreimage", "getState",
    ]))
    const storeRoot = path.join(temporaryRoot(), "store")
    const commitment = createV138CustodyCommitment(commitmentInput(storeRoot))
    expect(commitment).toMatchObject({
      schemaVersion: "v1.38-synthetic-custody-commitment-v1",
      profile: "hmac-sha-256-secret-salted-v1",
      profileNeutralProtocolRoot: PROTOCOL_ROOT,
      custodyStatus: "unavailable",
      satisfiesSeal01: false,
    })
    expect(commitment.digest).toBe(
      `sha256:${createHmac("sha256", commitmentInput(storeRoot).keyedMaterial)
        .update("cowards-game:v1.38:synthetic-custody-commitment:v1\0")
        .update(PROTOCOL_ROOT)
        .update("\0")
        .update(commitmentInput(storeRoot).salt)
        .update("\0")
        .update(commitmentInput(storeRoot).sealedBytes)
        .digest("hex")}`,
    )
    expect(lstatSync(storeRoot).mode & 0o777).toBe(0o700)
    expect(lstatSync(path.join(storeRoot, "objects", "sealed.bin")).mode & 0o777).toBe(0o600)
    expect(JSON.stringify(commitment)).not.toContain(storeRoot)
  })

  it("runs one authorized open, bounded projection, verification, contamination, and retirement monotonically", () => {
    const storeRoot = path.join(temporaryRoot(), "store")
    createV138CustodyCommitment(commitmentInput(storeRoot))
    expect(executeV138CustodyCommand(commandOptions(storeRoot), {
      kind: "authorizeOpen", actorId: "synthetic-opening-actor", commandId: "synthetic-open-once",
    }).state).toBe("open_authorized")
    expect(executeV138CustodyCommand(commandOptions(storeRoot), {
      kind: "openOnce", actorId: "synthetic-opening-actor", commandId: "synthetic-open-once",
    }).state).toBe("opened")
    expect(() => executeV138CustodyCommand(commandOptions(storeRoot), {
      kind: "openOnce", actorId: "synthetic-opening-actor", commandId: "synthetic-open-once",
    })).toThrow("V138_CUSTODY_OPEN_ALREADY_CONSUMED")

    const receipt = projectV138SafeCustodyReceipt(commandOptions(storeRoot), {
      schemaVersion: "v1.38-synthetic-safe-receipt-v1",
      aggregateStatus: "synthetic_mechanics_passed",
      evaluatedItemCount: 3,
      findingCount: 0,
      resultRoot: HASH_A,
    })
    expect(receipt).toMatchObject({ custodyStatus: "unavailable", satisfiesSeal01: false })
    expect(JSON.stringify(receipt)).not.toMatch(/keyedMaterial|salt|sealedBytes|private|path|actor|query/iu)
    expect(executeV138CustodyCommand(commandOptions(storeRoot), { kind: "verify" }).state)
      .toBe("verified")
    expect(executeV138CustodyCommand(commandOptions(storeRoot), {
      kind: "markContaminated", reason: "synthetic-unauthorized-query",
    }).state).toBe("contaminated")
    expect(() => projectV138SafeCustodyReceipt(commandOptions(storeRoot), {
      schemaVersion: "v1.38-synthetic-safe-receipt-v1",
      aggregateStatus: "synthetic_mechanics_passed",
      evaluatedItemCount: 3,
      findingCount: 0,
      resultRoot: HASH_A,
    })).toThrow("V138_CUSTODY_TERMINAL")
    expect(executeV138CustodyCommand(commandOptions(storeRoot), { kind: "retire" }).state)
      .toBe("retired")
    expect(() => executeV138CustodyCommand(commandOptions(storeRoot), { kind: "verify" }))
      .toThrow("V138_CUSTODY_TERMINAL")
  })

  it("fails closed on local roots, traversal, symlinks, oversized input, mismatches, and unauthorized transitions", () => {
    expect(() => createV138CustodyCommitment(commitmentInput(path.join(repoRoot, ".synthetic-store"))))
      .toThrow("V138_CUSTODY_ROOT_IN_REPOSITORY")
    const temp = temporaryRoot()
    const target = path.join(temp, "target")
    mkdirSync(target)
    const link = path.join(temp, "link")
    symlinkSync(target, link)
    expect(() => createV138CustodyCommitment(commitmentInput(link)))
      .toThrow("V138_CUSTODY_SYMLINK")

    const oversized = commitmentInput(path.join(temp, "oversized"))
    expect(() => createV138CustodyCommitment({ ...oversized, maxSealedBytes: 4 }))
      .toThrow("V138_CUSTODY_SIZE_LIMIT")

    const storeRoot = path.join(temp, "store")
    createV138CustodyCommitment(commitmentInput(storeRoot))
    expect(() => executeV138CustodyCommand(commandOptions(storeRoot), {
      kind: "openOnce", actorId: "synthetic-opening-actor", commandId: "synthetic-open-once",
    })).toThrow("V138_CUSTODY_OPEN_NOT_AUTHORIZED")
    expect(() => executeV138CustodyCommand({
      ...commandOptions(storeRoot), keyedMaterial: Buffer.from("wrong-synthetic-keyedMaterial-material-32b"),
    }, { kind: "verify" })).toThrow("V138_CUSTODY_COMMITMENT_MISMATCH")

    const events = readFileSync(path.join(storeRoot, "events", "custody.ndjson"), "utf8")
      .trim().split("\n").map((line) => JSON.parse(line) as { outcome: string; code: string })
    expect(events.some((event) => event.outcome === "rejected" && event.code === "V138_CUSTODY_OPEN_NOT_AUTHORIZED"))
      .toBe(true)

    const objectPath = path.join(storeRoot, "objects", "sealed.bin")
    rmSync(objectPath)
    writeFileSync(path.join(temp, "outside"), "outside")
    symlinkSync(path.join(temp, "outside"), objectPath)
    expect(() => executeV138CustodyCommand(commandOptions(storeRoot), { kind: "verify" }))
      .toThrow("V138_CUSTODY_SYMLINK")
    chmodSync(path.join(storeRoot, "events", "custody.ndjson"), 0o600)
  })

  it("terminally contaminates a forbidden safe projection and never permits a diagnostic query", () => {
    const storeRoot = path.join(temporaryRoot(), "store")
    createV138CustodyCommitment(commitmentInput(storeRoot))
    executeV138CustodyCommand(commandOptions(storeRoot), {
      kind: "authorizeOpen", actorId: "synthetic-opening-actor", commandId: "synthetic-open-once",
    })
    expect(() => executeV138CustodyCommand(commandOptions(storeRoot), {
      kind: "openOnce", actorId: "synthetic-other-actor", commandId: "synthetic-open-once",
    })).toThrow("V138_CUSTODY_OPEN_NOT_AUTHORIZED")
    executeV138CustodyCommand(commandOptions(storeRoot), {
      kind: "openOnce", actorId: "synthetic-opening-actor", commandId: "synthetic-open-once",
    })
    expect(() => projectV138SafeCustodyReceipt(commandOptions(storeRoot), {
      schemaVersion: "v1.38-synthetic-safe-receipt-v1",
      aggregateStatus: "synthetic_mechanics_passed",
      evaluatedItemCount: 1,
      findingCount: 0,
      resultRoot: HASH_A,
      rawQuery: "forbidden",
    } as never)).toThrow("V138_CUSTODY_SAFE_PROJECTION_INVALID")
    expect(() => executeV138CustodyCommand(commandOptions(storeRoot), {
      kind: "query",
    } as never)).toThrow("V138_CUSTODY_TERMINAL")
  })
})

describe("Phase 262 authorized custody handoff boundary", () => {
  it("requires every exact field, approved identity, and externally authenticated provenance", () => {
    expect(V138AuthorizedCustodyHandoffSchema.parse(handoff())).toEqual(handoff())
    expect(validateV138AuthorizedCustodyHandoff(handoff(), approval)).toMatchObject({
      authorized: false,
      satisfiesSeal01: false,
    })

    const sections = Object.keys(handoff()) as Array<keyof ReturnType<typeof handoff>>
    for (const section of sections) {
      const { [section]: _removed, ...missing } = handoff()
      expect(() => V138AuthorizedCustodyHandoffSchema.parse(missing))
        .toThrow("V138_AUTHORIZED_CUSTODY_HANDOFF_INVALID")
    }
    for (const mutation of [
      { ...handoff(), waiver: true },
      { ...handoff(), controls: { ...handoff().controls, separatelyPermissioned: false } },
      { ...handoff(), opening: { ...handoff().opening, openOrdinal: 2 } },
      { ...handoff(), ledger: { ...handoff().ledger, rawQueriesExposed: true } },
      { ...handoff(), safeProjection: { ...handoff().safeProjection, byteMax: 0 } },
      { ...handoff(), contamination: { ...handoff().contamination, replacementAllowed: true } },
      { ...handoff(), lineage: { ...handoff().lineage, promptsExcluded: false } },
      { ...handoff(), provenance: { ...handoff().provenance, selfIssued: true } },
    ]) expect(() => V138AuthorizedCustodyHandoffSchema.parse(mutation))
      .toThrow("V138_AUTHORIZED_CUSTODY_HANDOFF_INVALID")
  })

  it("renders only a bounded reference after all approvals and authentication pass", () => {
    expect(renderV138AuthorizedCustodyHandoffReference(handoff(), approval)).toBeNull()
    expect(renderV138AuthorizedCustodyHandoffReference(handoff(), {
      ...approval, approvedOpaqueStoreIds: ["different-store"],
    })).toBeNull()
  })
})
