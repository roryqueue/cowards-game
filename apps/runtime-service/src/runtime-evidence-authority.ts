import { createPublicKey, verify, type KeyObject } from "node:crypto"
import {
  closeSync,
  fstatSync,
  fsyncSync,
  mkdirSync,
  openSync,
  readFileSync,
  renameSync,
  rmdirSync,
  unlinkSync,
  writeFileSync,
} from "node:fs"
import { dirname } from "node:path"
import {
  CANONICAL_COMPATIBILITY_TUPLES,
  RUNTIME_EVIDENCE_AUTHORITY_BOOTSTRAP_SCHEMA_VERSION,
  RUNTIME_EVIDENCE_AUTHORITY_LIMITS,
  RUNTIME_EVIDENCE_AUTHORITY_TRUST_DOMAINS,
  RuntimeEvidenceAuthorityBundleError,
  assertRuntimeEvidenceAuthorityAnchorInstalled,
  evaluateRuntimeEvidenceAuthorityAntiRollback,
  inspectRuntimeEvidenceAuthorityBundle,
  parseRuntimeEvidenceAuthorityHighWaterRecord,
  type RuntimeEvidenceAuthorityHighWaterRecord,
  type RuntimeEvidenceAuthorityPayload,
} from "@cowards/spec"

export const RUNTIME_EVIDENCE_AUTHORITY_PUBLIC_KEY_SCHEMA_VERSION =
  "v1.37-runtime-evidence-authority-public-key-v1" as const

const PUBLIC_KEY_LIMIT_BYTES = 16 * 1024
const HIGH_WATER_LIMIT_BYTES = 4 * 1024
const HASH = /^sha256:[0-9a-f]{64}$/u
const GENERATION = /^(?:0|[1-9][0-9]{0,15})$/u
const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder("utf-8", { fatal: true })

export class RuntimeEvidenceAuthorityLoadError extends Error {
  constructor(readonly code: string) {
    super("Runtime evidence authority is unavailable.")
    this.name = "RuntimeEvidenceAuthorityLoadError"
  }
}

type OpenFlags = "r" | "wx"

export interface RuntimeEvidenceAuthorityFileSystem {
  openFile(path: string, flags: OpenFlags, mode?: number): number
  statFileDescriptor(descriptor: number): {
    size: number
    isFile(): boolean
  }
  readFileDescriptor(descriptor: number): Uint8Array
  writeFileDescriptor(descriptor: number, bytes: Uint8Array): void
  syncFileDescriptor(descriptor: number): void
  closeFileDescriptor(descriptor: number): void
  renameFile(from: string, to: string): void
  removeFile(path: string): void
  openDirectory(path: string): number
  syncDirectory(descriptor: number): void
  closeDirectory(descriptor: number): void
  makeLock(path: string): void
  removeLock(path: string): void
}

export const createNodeRuntimeEvidenceAuthorityFileSystem =
  (): RuntimeEvidenceAuthorityFileSystem => ({
    openFile: (path, flags, mode) => openSync(path, flags, mode),
    statFileDescriptor: (descriptor) => fstatSync(descriptor),
    readFileDescriptor: (descriptor) => readFileSync(descriptor),
    writeFileDescriptor: (descriptor, bytes) =>
      writeFileSync(descriptor, bytes),
    syncFileDescriptor: (descriptor) => fsyncSync(descriptor),
    closeFileDescriptor: (descriptor) => closeSync(descriptor),
    renameFile: (from, to) => renameSync(from, to),
    removeFile: (path) => unlinkSync(path),
    openDirectory: (path) => openSync(path, "r"),
    syncDirectory: (descriptor) => fsyncSync(descriptor),
    closeDirectory: (descriptor) => closeSync(descriptor),
    makeLock: (path) => mkdirSync(path, { mode: 0o700 }),
    removeLock: (path) => rmdirSync(path),
  })

export interface RuntimeEvidenceAuthorityLoaderConfig {
  bundlePath: string
  publicKeyPath: string
  highWaterPath: string
  minimumRegistryGeneration: string
  minimumBundleHash: string
  bootstrap: boolean
  expectedTrustDomain: string
  evaluationInstant(): string
  fileSystem?: RuntimeEvidenceAuthorityFileSystem | undefined
}

export interface VerifiedMountedRuntimeEvidenceAuthority {
  authorityBundleHash: string
  registryGeneration: string
  semanticTupleManifestHash: string
  trustDomain: string
  keyId: string
  payload: Readonly<RuntimeEvidenceAuthorityPayload>
}

export interface RuntimeEvidenceAuthorityLoader {
  load(): Readonly<VerifiedMountedRuntimeEvidenceAuthority>
  current(): Readonly<VerifiedMountedRuntimeEvidenceAuthority> | undefined
}

const exactKeys = (
  value: Record<string, unknown>,
  expected: readonly string[],
): boolean => {
  const keys = Object.keys(value)
  return (
    keys.length === expected.length &&
    expected.every((key) => Object.hasOwn(value, key))
  )
}

const readBoundedDescriptor = (input: {
  fileSystem: RuntimeEvidenceAuthorityFileSystem
  path: string
  limitBytes: number
  invalidCode: string
}): Uint8Array => {
  const descriptor = input.fileSystem.openFile(input.path, "r")
  try {
    const stat = input.fileSystem.statFileDescriptor(descriptor)
    if (!stat.isFile() || stat.size <= 0 || stat.size > input.limitBytes) {
      throw new RuntimeEvidenceAuthorityLoadError(input.invalidCode)
    }
    const bytes = input.fileSystem.readFileDescriptor(descriptor)
    if (bytes.byteLength === 0 || bytes.byteLength > input.limitBytes) {
      throw new RuntimeEvidenceAuthorityLoadError(input.invalidCode)
    }
    return new Uint8Array(bytes)
  } finally {
    input.fileSystem.closeFileDescriptor(descriptor)
  }
}

const parsePublicKeyDescriptor = (
  bytes: Uint8Array,
): { keyId: string; publicKey: KeyObject } => {
  let value: unknown
  try {
    value = JSON.parse(textDecoder.decode(bytes))
  } catch {
    throw new RuntimeEvidenceAuthorityLoadError("PUBLIC_KEY")
  }
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    !exactKeys(value as Record<string, unknown>, [
      "schemaVersion",
      "keyId",
      "algorithm",
      "publicKeyPem",
    ])
  ) {
    throw new RuntimeEvidenceAuthorityLoadError("PUBLIC_KEY")
  }
  const record = value as Record<string, unknown>
  if (
    record.schemaVersion !==
      RUNTIME_EVIDENCE_AUTHORITY_PUBLIC_KEY_SCHEMA_VERSION ||
    record.algorithm !== "Ed25519" ||
    typeof record.keyId !== "string" ||
    record.keyId.length === 0 ||
    typeof record.publicKeyPem !== "string" ||
    record.publicKeyPem.length === 0
  ) {
    throw new RuntimeEvidenceAuthorityLoadError("PUBLIC_KEY")
  }
  try {
    const publicKey = createPublicKey(record.publicKeyPem)
    if (publicKey.asymmetricKeyType !== "ed25519") {
      throw new Error("wrong key type")
    }
    return { keyId: record.keyId, publicKey }
  } catch {
    throw new RuntimeEvidenceAuthorityLoadError("PUBLIC_KEY")
  }
}

const asLoadError = (error: unknown, fallbackCode: string): never => {
  if (error instanceof RuntimeEvidenceAuthorityLoadError) throw error
  if (error instanceof RuntimeEvidenceAuthorityBundleError) {
    throw new RuntimeEvidenceAuthorityLoadError(error.code)
  }
  throw new RuntimeEvidenceAuthorityLoadError(fallbackCode)
}

const isMissingFile = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  (error as { code?: unknown }).code === "ENOENT"

const readHighWater = (
  fileSystem: RuntimeEvidenceAuthorityFileSystem,
  path: string,
): Readonly<RuntimeEvidenceAuthorityHighWaterRecord> | undefined => {
  try {
    return parseRuntimeEvidenceAuthorityHighWaterRecord(
      readBoundedDescriptor({
        fileSystem,
        path,
        limitBytes: HIGH_WATER_LIMIT_BYTES,
        invalidCode: "HIGH_WATER",
      }),
    )
  } catch (error) {
    if (isMissingFile(error)) return undefined
    return asLoadError(error, "HIGH_WATER")
  }
}

let temporarySequence = 0

const installHighWater = (input: {
  fileSystem: RuntimeEvidenceAuthorityFileSystem
  path: string
  record: Readonly<RuntimeEvidenceAuthorityHighWaterRecord>
}): void => {
  const sequence = (temporarySequence += 1)
  const temporaryPath = `${input.path}.tmp-${process.pid}-${sequence}`
  const parentPath = dirname(input.path)
  let descriptor: number | undefined
  let directoryDescriptor: number | undefined
  let renamed = false
  try {
    descriptor = input.fileSystem.openFile(temporaryPath, "wx", 0o600)
    input.fileSystem.writeFileDescriptor(
      descriptor,
      textEncoder.encode(`${JSON.stringify(input.record)}\n`),
    )
    input.fileSystem.syncFileDescriptor(descriptor)
    input.fileSystem.closeFileDescriptor(descriptor)
    descriptor = undefined
    input.fileSystem.renameFile(temporaryPath, input.path)
    renamed = true
    directoryDescriptor = input.fileSystem.openDirectory(parentPath)
    input.fileSystem.syncDirectory(directoryDescriptor)
    input.fileSystem.closeDirectory(directoryDescriptor)
    directoryDescriptor = undefined
  } catch (error) {
    if (descriptor !== undefined) {
      try {
        input.fileSystem.closeFileDescriptor(descriptor)
      } catch {
        // The operation remains failed and no result is accepted.
      }
    }
    if (directoryDescriptor !== undefined) {
      try {
        input.fileSystem.closeDirectory(directoryDescriptor)
      } catch {
        // The operation remains failed and no result is accepted.
      }
    }
    if (!renamed) {
      try {
        input.fileSystem.removeFile(temporaryPath)
      } catch {
        // A failed temporary cleanup cannot turn the install into success.
      }
    }
    return asLoadError(error, "ANCHOR_IO")
  }
}

const requireEnvironmentValue = (
  environment: Record<string, string | undefined>,
  key: string,
): string => {
  const value = environment[key]?.trim()
  if (!value) throw new RuntimeEvidenceAuthorityLoadError("CONFIGURATION")
  return value
}

export const runtimeEvidenceAuthorityConfigFromEnvironment = (
  environment: Record<string, string | undefined> = process.env,
): RuntimeEvidenceAuthorityLoaderConfig => {
  const minimumRegistryGeneration = requireEnvironmentValue(
    environment,
    "COWARDS_RUNTIME_EVIDENCE_AUTHORITY_MIN_GENERATION",
  )
  const minimumBundleHash = requireEnvironmentValue(
    environment,
    "COWARDS_RUNTIME_EVIDENCE_AUTHORITY_MIN_BUNDLE_HASH",
  )
  if (
    !GENERATION.test(minimumRegistryGeneration) ||
    !Number.isSafeInteger(Number(minimumRegistryGeneration)) ||
    !HASH.test(minimumBundleHash)
  ) {
    throw new RuntimeEvidenceAuthorityLoadError("CONFIGURATION")
  }
  const bootstrapValue =
    environment.COWARDS_RUNTIME_EVIDENCE_AUTHORITY_BOOTSTRAP?.trim() ?? "0"
  if (bootstrapValue !== "0" && bootstrapValue !== "1") {
    throw new RuntimeEvidenceAuthorityLoadError("CONFIGURATION")
  }
  return {
    bundlePath: requireEnvironmentValue(
      environment,
      "COWARDS_RUNTIME_EVIDENCE_AUTHORITY_BUNDLE_PATH",
    ),
    publicKeyPath: requireEnvironmentValue(
      environment,
      "COWARDS_RUNTIME_EVIDENCE_AUTHORITY_PUBLIC_KEY_PATH",
    ),
    highWaterPath: requireEnvironmentValue(
      environment,
      "COWARDS_RUNTIME_EVIDENCE_AUTHORITY_HIGH_WATER_PATH",
    ),
    minimumRegistryGeneration,
    minimumBundleHash,
    bootstrap: bootstrapValue === "1",
    expectedTrustDomain: RUNTIME_EVIDENCE_AUTHORITY_TRUST_DOMAINS.production,
    evaluationInstant: () => new Date().toISOString(),
  }
}

export const createRuntimeEvidenceAuthorityLoader = (
  config: RuntimeEvidenceAuthorityLoaderConfig,
): RuntimeEvidenceAuthorityLoader => {
  const fileSystem =
    config.fileSystem ?? createNodeRuntimeEvidenceAuthorityFileSystem()
  let lastGood: Readonly<VerifiedMountedRuntimeEvidenceAuthority> | undefined
  let anchorUncertain = false

  const load = (): Readonly<VerifiedMountedRuntimeEvidenceAuthority> => {
    if (anchorUncertain) {
      throw new RuntimeEvidenceAuthorityLoadError("ANCHOR_IO")
    }
    try {
      const bundleBytes = readBoundedDescriptor({
        fileSystem,
        path: config.bundlePath,
        limitBytes: RUNTIME_EVIDENCE_AUTHORITY_LIMITS.envelopeBytes,
        invalidCode: "ENVELOPE_LIMIT",
      })
      const publicKeyDescriptor = parsePublicKeyDescriptor(
        readBoundedDescriptor({
          fileSystem,
          path: config.publicKeyPath,
          limitBytes: PUBLIC_KEY_LIMIT_BYTES,
          invalidCode: "PUBLIC_KEY",
        }),
      )
      const inspected = inspectRuntimeEvidenceAuthorityBundle(bundleBytes, {
        expectedTrustDomain: config.expectedTrustDomain,
        evaluationInstant: config.evaluationInstant(),
        trustedKeyIds: [publicKeyDescriptor.keyId],
        verifySignature: ({ signedMessageBytes, signature }) =>
          verify(
            null,
            signedMessageBytes,
            publicKeyDescriptor.publicKey,
            signature,
          ),
      })
      if (
        !CANONICAL_COMPATIBILITY_TUPLES.some(
          (tuple) =>
            tuple.tupleId === inspected.payload.semanticTupleManifestHash,
        )
      ) {
        throw new RuntimeEvidenceAuthorityLoadError("TUPLE_MANIFEST")
      }

      const candidate = {
        registryGeneration: inspected.payload.registryGeneration,
        payloadSha256: inspected.payloadSha256,
      }
      const deploymentPin = {
        schemaVersion: RUNTIME_EVIDENCE_AUTHORITY_BOOTSTRAP_SCHEMA_VERSION,
        minimumRegistryGeneration: config.minimumRegistryGeneration,
        minimumPayloadSha256: config.minimumBundleHash,
      } as const
      const initialDecision = evaluateRuntimeEvidenceAuthorityAntiRollback({
        candidate,
        bootstrapMode: config.bootstrap,
        deploymentPin,
        durableHighWater: readHighWater(fileSystem, config.highWaterPath),
      })

      if (initialDecision.durableInstallRequired) {
        const lockPath = `${config.highWaterPath}.lock`
        let lockAcquired = false
        try {
          fileSystem.makeLock(lockPath)
          lockAcquired = true
          const lockedDecision = evaluateRuntimeEvidenceAuthorityAntiRollback({
            candidate,
            bootstrapMode: config.bootstrap,
            deploymentPin,
            durableHighWater: readHighWater(fileSystem, config.highWaterPath),
          })
          if (lockedDecision.durableInstallRequired) {
            installHighWater({
              fileSystem,
              path: config.highWaterPath,
              record: lockedDecision.nextHighWater,
            })
          }
        } catch (error) {
          anchorUncertain = true
          return asLoadError(error, "ANCHOR_IO")
        } finally {
          if (lockAcquired) {
            try {
              fileSystem.removeLock(lockPath)
            } catch {
              anchorUncertain = true
            }
          }
        }
      }

      const installedDecision = evaluateRuntimeEvidenceAuthorityAntiRollback({
        candidate,
        bootstrapMode: false,
        deploymentPin,
        durableHighWater: readHighWater(fileSystem, config.highWaterPath),
      })
      assertRuntimeEvidenceAuthorityAnchorInstalled(installedDecision)
      if (anchorUncertain) {
        throw new RuntimeEvidenceAuthorityLoadError("ANCHOR_IO")
      }

      const verified = Object.freeze({
        authorityBundleHash: inspected.payloadSha256,
        registryGeneration: inspected.payload.registryGeneration,
        semanticTupleManifestHash: inspected.payload.semanticTupleManifestHash,
        trustDomain: inspected.envelope.trustDomain,
        keyId: inspected.envelope.keyId,
        payload: inspected.payload,
      })
      lastGood = verified
      return verified
    } catch (error) {
      return asLoadError(error, "AUTHORITY_IO")
    }
  }

  return Object.freeze({
    load,
    current: () => lastGood,
  })
}
