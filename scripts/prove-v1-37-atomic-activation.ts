import { Buffer } from "node:buffer"
import {
  createHash,
  generateKeyPairSync,
  randomUUID,
  sign,
} from "node:crypto"
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"
import {
  CANONICAL_COMPATIBILITY_TUPLES,
  RUNTIME_EVIDENCE_AUTHORITY_TRUST_DOMAINS,
  hashExecutableLaneIdentity,
  type CanonicalCompatibilityTuple,
} from "../packages/spec/src/index.js"
import type { Pool as PgPool } from "../packages/persistence/node_modules/@types/pg/index.d.ts"
import { migrate } from "../packages/persistence/src/migrations.js"
import {
  installRuntimeEvidenceAuthorityPublication,
  prepareRuntimeEvidenceAuthorityPublication,
} from "../packages/persistence/src/runtime-evidence-authority-publisher.js"
import {
  RUNTIME_EVIDENCE_AUTHORITY_PUBLIC_KEY_SCHEMA_VERSION,
  RuntimeEvidenceAuthorityLoadError,
  createRuntimeEvidenceAuthorityLoader,
} from "../apps/runtime-service/src/runtime-evidence-authority.js"

const EXPECTED_CURRENT_TUPLE_ID =
  "sha256:922a6857fdbc8354b744d6e766bff216f3fee85b5ed381355cb427f5a616b3ae"
const HISTORICAL_V14_TUPLE_ID =
  "sha256:be54eb5317af0a87190433f649f9beef4490493d8c2a8815a323b082651b514c"
const PROOF_INSTANT = "2026-07-13T12:00:00.000Z"
const PROOF_VALID_UNTIL = "2026-07-14T12:00:00.000Z"
const requireFromPersistence = createRequire(
  new URL("../packages/persistence/package.json", import.meta.url),
)
const { Pool } = requireFromPersistence("pg") as {
  Pool: new (config: Record<string, unknown>) => PgPool
}

const historicalV14Tuple: CanonicalCompatibilityTuple = {
  rules: "cowards-rules-v1.4",
  engine: "0.1.4",
  runtimeAbi: "strategy-runtime-abi-v1.14",
  chronicle: "chronicle-v1.4",
  arenaCatalog: "canonical-arena-catalog-v1.4",
  setPolicy: "canonical-set-policy-v1.4",
}

const sha256 = (value: string): string =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`

const assert = (condition: unknown, message: string): asserts condition => {
  if (!condition) throw new Error(`atomic activation proof: ${message}`)
}

export interface AtomicActivationProofOptions {
  write: boolean
  check: boolean
  databaseUrl: string
}

export interface AtomicActivationProofReport {
  schema: string
  tupleId: string
  selectedCertificateIds: readonly string[]
  excludedCertificateIds: readonly string[]
  firstGeneration: string
  secondGeneration: string
  installedHeadGeneration: string
  restartGeneration: string
  rollbackCode: string
  productionReceiptCount: number
  disposable: true
}

export const parseAtomicActivationProofArgs = (
  args: readonly string[],
  environment: Readonly<Record<string, string | undefined>> = process.env,
): AtomicActivationProofOptions => {
  const known = new Set(["--write", "--check"])
  const unknown = args.filter((argument) => !known.has(argument))
  if (unknown.length > 0) {
    throw new Error(`unknown atomic activation proof arguments: ${unknown.join(", ")}`)
  }
  const write = args.includes("--write")
  const check = args.includes("--check")
  if (!write || !check) {
    throw new Error("atomic activation proof requires --write --check")
  }
  const databaseUrl = environment.DATABASE_URL?.trim()
  if (!databaseUrl) {
    throw new Error("atomic activation proof requires DATABASE_URL")
  }
  return { write, check, databaseUrl }
}

interface SemanticIdentity {
  tupleId: string
  tuple: Record<string, unknown>
}

const seedCertificate = async (
  pool: PgPool,
  input: {
    id: string
    suffix: string
    semanticIdentity: SemanticIdentity
  },
): Promise<void> => {
  const rawHash = createHash("sha256")
    .update(`atomic-activation:${input.suffix}`)
    .digest("hex")
  const attestationId = `attestation:atomic:${input.suffix}`
  const lane = {
    providerId: "atomic-proof",
    languageId: "typescript",
    runtimeId: "node",
    runtimeVersion: "24",
    toolchainId: "typescript",
    toolchainVersion: "6",
    adapterId: "json",
    adapterVersion: "1",
    policyId: "atomic-proof-policy",
    policyVersion: "1",
    corpusId: "atomic-proof-corpus",
    corpusVersion: "1",
    artifactId: `atomic-proof-artifact:${input.suffix}`,
    artifactSha256: rawHash,
    implementationId: "atomic-proof-implementation",
    buildId: `atomic-proof-build:${input.suffix}`,
    semanticTupleId: input.semanticIdentity.tupleId,
    semanticTuple: input.semanticIdentity.tuple,
  }
  const laneHash = `sha256:${hashExecutableLaneIdentity(lane)}`
  const common = [
    "passed",
    "containment",
    "atomic-proof-producer",
    "atomic-proof-key",
    RUNTIME_EVIDENCE_AUTHORITY_TRUST_DOMAINS.fixture,
    "runtime-evidence-attestation-v1",
    "atomic-proof-command",
    rawHash,
    "atomic-proof-corpus",
    rawHash,
    "atomic-proof-policy",
    rawHash,
    "node",
    "24",
    "typescript",
    "6",
    "json",
    "1",
    lane.artifactId,
    rawHash,
    laneHash,
    lane.semanticTupleId,
    rawHash,
    rawHash,
    rawHash,
    "runtime-certificate-v1",
    rawHash,
    "atomic-proof-generation",
    lane,
    "2026-07-12T00:00:00.000Z",
    "2026-08-12T00:00:00.000Z",
  ]
  await pool.query(
    `insert into runtime_evidence_verified_attestations
      (id, attestation_sha256, verification_status, certificate_kind,
       producer_id, producer_key_id, trust_domain, schema_version, command_id,
       command_digest, corpus_id, corpus_hash, policy_id, policy_hash,
       runtime_id, runtime_version, toolchain_id, toolchain_version, adapter_id,
       adapter_version, artifact_id, artifact_hash, lane_identity_hash,
       semantic_tuple_id, result_manifest_hash, result_graph_hash,
       original_evidence_hash, derived_certificate_version,
       derived_certificate_record_hash, registry_generation, lane_identity,
       issued_at, valid_until)
     values ($1,$2,${common.map((_, index) => `$${index + 3}`).join(",")})`,
    [attestationId, rawHash, ...common],
  )
  await pool.query(
    `insert into runtime_evidence_certificates
      (id, certificate_kind, certificate_version, certificate_record_hash,
       certificate_status, verified_attestation_id, verified_attestation_status,
       producer_id, schema_version, command_id, command_digest, corpus_id,
       corpus_hash, policy_id, policy_hash, toolchain_id, toolchain_version,
       artifact_id, artifact_hash, lane_identity_hash, lane_identity,
       result_graph_hash, registry_generation, issued_at, fresh_until)
     values ($1,'containment','runtime-certificate-v1',$2,'passed',$3,'passed',
       'atomic-proof-producer','runtime-evidence-attestation-v1',
       'atomic-proof-command',$2,'atomic-proof-corpus',$2,
       'atomic-proof-policy',$2,'typescript','6',$4,$2,$5,$6,$2,
       'atomic-proof-generation','2026-07-12T00:00:00.000Z',
       '2026-08-12T00:00:00.000Z')`,
    [input.id, rawHash, attestationId, lane.artifactId, laneHash, lane],
  )
}

const publicationCounts = async (pool: PgPool) => {
  const result = await pool.query<{
    publications: number
    sources: number
    events: number
    next_generation: string
  }>(`select
    (select count(*)::integer from runtime_evidence_authority_publications) as publications,
    (select count(*)::integer from runtime_evidence_authority_publication_sources) as sources,
    (select count(*)::integer from runtime_evidence_authority_publication_events) as events,
    (select next_generation::text from runtime_evidence_authority_publication_head where singleton = true) as next_generation`)
  return result.rows[0]!
}

const expectLoadCode = (operation: () => unknown, code: string): void => {
  try {
    operation()
  } catch (error) {
    assert(
      error instanceof RuntimeEvidenceAuthorityLoadError && error.code === code,
      `expected loader ${code}, received ${String(error)}`,
    )
    return
  }
  throw new Error(`atomic activation proof: loader unexpectedly accepted ${code}`)
}

export const proveV137AtomicActivation = async (
  options: AtomicActivationProofOptions,
): Promise<AtomicActivationProofReport> => {
  assert(options.write && options.check, "write/check mode is mandatory")
  const current = CANONICAL_COMPATIBILITY_TUPLES[0]
  assert(current !== undefined, "current tuple registry is empty")
  assert(current.tupleId === EXPECTED_CURRENT_TUPLE_ID, "current tuple id drifted")

  const schema = `atomic_activation_${randomUUID().replaceAll("-", "")}`
  const admin = new Pool({ connectionString: options.databaseUrl })
  const directory = await mkdtemp(path.join(tmpdir(), "cowards-atomic-activation-"))
  let pool: PgPool | undefined
  try {
    await admin.query(`create schema ${schema}`)
    pool = new Pool({
      connectionString: options.databaseUrl,
      options: `-c search_path=${schema}`,
      max: 4,
    })
    await migrate(pool)

    const exactCertificateId = "certificate:atomic:exact-current"
    const excludedCertificateIds = [
      "certificate:atomic:historical",
      "certificate:atomic:partial",
      "certificate:atomic:mixed",
    ] as const
    await seedCertificate(pool, {
      id: exactCertificateId,
      suffix: "exact-current",
      semanticIdentity: { tupleId: current.tupleId, tuple: current.tuple },
    })
    await seedCertificate(pool, {
      id: excludedCertificateIds[0],
      suffix: "historical",
      semanticIdentity: {
        tupleId: HISTORICAL_V14_TUPLE_ID,
        tuple: historicalV14Tuple,
      },
    })
    await seedCertificate(pool, {
      id: excludedCertificateIds[1],
      suffix: "partial",
      semanticIdentity: {
        tupleId: current.tupleId,
        tuple: {
          rules: current.tuple.rules,
          engine: current.tuple.engine,
          runtimeAbi: current.tuple.runtimeAbi,
          chronicle: current.tuple.chronicle,
          arenaCatalog: current.tuple.arenaCatalog,
        },
      },
    })
    await seedCertificate(pool, {
      id: excludedCertificateIds[2],
      suffix: "mixed",
      semanticIdentity: {
        tupleId: current.tupleId,
        tuple: { ...current.tuple, engine: historicalV14Tuple.engine },
      },
    })

    const keys = generateKeyPairSync("ed25519")
    const signerKeyId = "atomic-activation-key:v1"
    const publicKeyPem = keys.publicKey
      .export({ type: "spki", format: "pem" })
      .toString()
    const common = {
      bundleVersion: "v1.37-current-atomic-activation-proof-v1",
      issuedAt: PROOF_INSTANT,
      validFrom: PROOF_INSTANT,
      validUntil: PROOF_VALID_UNTIL,
      trustDomain: RUNTIME_EVIDENCE_AUTHORITY_TRUST_DOMAINS.fixture,
      signerKeyId,
      trustedImportAuthorities: [],
      signMessage: (bytes: Uint8Array) => sign(null, bytes, keys.privateKey),
    } as const

    const beforeRejected = await publicationCounts(pool)
    let rejectedCode = ""
    try {
      await prepareRuntimeEvidenceAuthorityPublication(pool, {
        ...common,
        bundleVersion: "v1.37-kernel-integrity-candidate-v1",
      })
    } catch (error) {
      rejectedCode =
        error instanceof Error && "code" in error
          ? String((error as Error & { code: unknown }).code)
          : ""
    }
    assert(rejectedCode === "CLOSED_GRAPH", "retained candidate was publishable")
    assert(
      JSON.stringify(await publicationCounts(pool)) ===
        JSON.stringify(beforeRejected),
      "rejected publication mutated PostgreSQL",
    )

    const first = await prepareRuntimeEvidenceAuthorityPublication(pool, common)
    assert(
      JSON.stringify(first.sourceIds.certificateIds) ===
        JSON.stringify([exactCertificateId]),
      "partial, mixed, or historical certificate entered current publication",
    )
    const targetPath = path.join(directory, "authority.json")
    const publicKeyPath = path.join(directory, "authority-public-key.json")
    const highWaterPath = path.join(directory, "authority-high-water.json")
    await writeFile(
      publicKeyPath,
      `${JSON.stringify({
        schemaVersion: RUNTIME_EVIDENCE_AUTHORITY_PUBLIC_KEY_SCHEMA_VERSION,
        keyId: signerKeyId,
        algorithm: "Ed25519",
        publicKeyPem,
      })}\n`,
      { mode: 0o600 },
    )
    await installRuntimeEvidenceAuthorityPublication(pool, {
      publicationId: first.publicationId,
      targetPath,
      attemptId: "atomic-activation:first",
      evaluationInstant: PROOF_INSTANT,
      expectedTrustDomain: RUNTIME_EVIDENCE_AUTHORITY_TRUST_DOMAINS.fixture,
      signerKeyId,
      publicKeyPem,
    })
    const loaderConfig = {
      bundlePath: targetPath,
      publicKeyPath,
      highWaterPath,
      minimumRegistryGeneration: first.generation,
      minimumBundleHash: first.payloadSha256,
      bootstrap: true,
      expectedTrustDomain: RUNTIME_EVIDENCE_AUTHORITY_TRUST_DOMAINS.fixture,
      evaluationInstant: () => PROOF_INSTANT,
    }
    const firstLoaded = createRuntimeEvidenceAuthorityLoader(loaderConfig).load()
    assert(firstLoaded.registryGeneration === first.generation, "first load drifted")

    const second = await prepareRuntimeEvidenceAuthorityPublication(pool, common)
    await installRuntimeEvidenceAuthorityPublication(pool, {
      publicationId: second.publicationId,
      targetPath,
      attemptId: "atomic-activation:second",
      evaluationInstant: PROOF_INSTANT,
      expectedTrustDomain: RUNTIME_EVIDENCE_AUTHORITY_TRUST_DOMAINS.fixture,
      signerKeyId,
      publicKeyPem,
    })
    const secondLoaded = createRuntimeEvidenceAuthorityLoader({
      ...loaderConfig,
      bootstrap: false,
    }).load()
    assert(
      secondLoaded.registryGeneration === second.generation,
      "new publication did not advance high water",
    )
    const restart = createRuntimeEvidenceAuthorityLoader({
      ...loaderConfig,
      bootstrap: false,
    }).load()
    assert(restart.registryGeneration === second.generation, "restart drifted")

    await writeFile(targetPath, Buffer.from(first.envelopeBytes), { mode: 0o600 })
    let rollbackCode = ""
    try {
      createRuntimeEvidenceAuthorityLoader({
        ...loaderConfig,
        bootstrap: false,
      }).load()
    } catch (error) {
      rollbackCode =
        error instanceof RuntimeEvidenceAuthorityLoadError ? error.code : ""
    }
    assert(rollbackCode === "ROLLBACK", "older bundle survived high-water restart")

    expectLoadCode(
      () =>
        createRuntimeEvidenceAuthorityLoader({
          ...loaderConfig,
          minimumRegistryGeneration: String(Number(second.generation) + 1),
          minimumBundleHash: second.payloadSha256,
          bootstrap: false,
        }).load(),
      "ROLLBACK",
    )
    await writeFile(targetPath, Buffer.from(second.envelopeBytes), { mode: 0o600 })
    expectLoadCode(
      () =>
        createRuntimeEvidenceAuthorityLoader({
          ...loaderConfig,
          minimumRegistryGeneration: second.generation,
          minimumBundleHash: sha256("wrong-deployment-pin"),
          bootstrap: false,
        }).load(),
      "PIN_FORK",
    )

    const installedHead = await pool.query<{ generation: string }>(
      "select generation::text as generation from runtime_evidence_authority_installed_head",
    )
    assert(
      installedHead.rows[0]?.generation === second.generation,
      "installed head did not select the second exact publication",
    )
    const productionReceipts = await pool.query<{ count: number }>(
      `select count(*)::integer as count
         from runtime_evidence_authority_publication_events event
         join runtime_evidence_authority_publications publication
           on publication.id = event.publication_id
        where event.event_kind = 'installed'
          and publication.trust_domain = $1`,
      [RUNTIME_EVIDENCE_AUTHORITY_TRUST_DOMAINS.production],
    )
    const productionReceiptCount = productionReceipts.rows[0]?.count ?? -1
    assert(productionReceiptCount === 0, "proof minted a production receipt")
    assert(
      (await readFile(highWaterPath)).byteLength > 0,
      "high-water record was not durable",
    )

    return {
      schema,
      tupleId: current.tupleId,
      selectedCertificateIds: first.sourceIds.certificateIds,
      excludedCertificateIds,
      firstGeneration: first.generation,
      secondGeneration: second.generation,
      installedHeadGeneration: installedHead.rows[0]!.generation,
      restartGeneration: restart.registryGeneration,
      rollbackCode,
      productionReceiptCount,
      disposable: true,
    }
  } finally {
    await pool?.end()
    await admin.query(`drop schema if exists ${schema} cascade`)
    await admin.end()
    await rm(directory, { recursive: true, force: true })
  }
}

const isMain =
  process.argv[1] !== undefined &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1])

if (isMain) {
  const report = await proveV137AtomicActivation(
    parseAtomicActivationProofArgs(process.argv.slice(2)),
  )
  process.stdout.write(`${JSON.stringify(report)}\n`)
}
