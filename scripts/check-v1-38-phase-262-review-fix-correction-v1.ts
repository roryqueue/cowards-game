import { createHash } from "node:crypto"
import { existsSync, readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const fail = (code: string): never => {
  throw new TypeError(code)
}
const sha256 = (bytes: string | Buffer): `sha256:${string}` =>
  `sha256:${createHash("sha256").update(bytes).digest("hex")}`
const canonical = (value: unknown): string => {
  const normalize = (item: unknown): unknown => {
    if (Array.isArray(item)) return item.map(normalize)
    if (item !== null && typeof item === "object") {
      return Object.fromEntries(
        Object.entries(item as Record<string, unknown>)
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([key, child]) => [key, normalize(child)]),
      )
    }
    return item
  }
  return `${JSON.stringify(normalize(value))}\n`
}

export const V138_PHASE_262_REVIEW_FIX_CORRECTION_PATH =
  ".planning/artifacts/v1.38-phase-262-review-fix-correction-v1.json"

export const V138_PHASE_262_PROTECTED_FILES = Object.freeze([
  ["scripts/lib/v1-38-bounded-retry-envelope-v2.ts", "b153926bd32e7c8fb096385dd60f5987322940ae4ecab9a25da79de5702650d3"],
  ["scripts/run-v1-38-bounded-retry-envelope-v2.ts", "984e9f8750f54bb0003d6746ca69f19b6acc53a187648ddb6a944c6e8bb65793"],
  ["scripts/run-v1-38-bounded-retry-envelope-v2.test.ts", "bd88d0ae4a234922a41613f0c346f4772a421705b929caf1d5cad629ca00a222"],
  ["scripts/check-v1-38-plan-262-85-bounded-retry-source-review-v2.ts", "729c577a6dac967a5054d66e7b283181fea689b70c469902b04f9bfc41d7c988"],
  ["scripts/check-v1-38-plan-262-85-bounded-retry-source-review-v2.test.ts", "8651eb279f03f4060488b9b1d37bc4e91a5fad99d165effa1a8ea1111c33dced"],
  ["scripts/check-v1-38-plan-262-88-bounded-retry-admission-v2.ts", "b4dd2e1b7e3832a0cb35208b1c9fba24285178ab5e47ae4358c07412ea99fcff"],
  ["scripts/check-v1-38-plan-262-88-bounded-retry-admission-v2.test.ts", "65c5138ffb5b48d781a8f4006eb9255436980a17acaae8d774776bfc4fce6cd9"],
  ["scripts/check-v1-38-plan-262-89-lifecycle-v2.ts", "2d377de7025967188514c022ff3c228ea6362bcdb8383351c6df2f399fcf5214"],
  ["scripts/check-v1-38-plan-262-89-lifecycle-v2.test.ts", "7e7bf1807d3ef872099ab8fdcc79997d2e337b2ca006eaacff4d8468669998e1"],
  [".planning/artifacts/v1.38-plan-262-85-bounded-retry-source-review-v2.json", "e9069ac45db512d89929d8fd82828180914e20b9feb5ea6f05358ada083d68ec"],
  [".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-85-REVIEW.md", "d304fcc6c1cf879a4cefc16c96d157f608f251ab05e597bb29bbbee0d0477cd6"],
  [".planning/artifacts/v1.38-successor-source-seal-v12.json", "c9b3c23f87f68249c34ffc76eda06a5785c180f6d65a21ff68bd90fba3087052"],
  [".planning/artifacts/v1.38-plan-262-86-retry-envelope-v2.json", "5a2543b4ee3b8786188fa9a35977ee7dd163c175ceda4406ec74f8494da35dcf"],
  [".planning/artifacts/v1.38-current-matrix-retry-journal-v2.jsonl", "ac7f8eb0b0193b469b31c28c33838bb46f36d6061d6e8577f05ccf71f9283546"],
  [".planning/artifacts/v1.38-current-matrix-retry-terminal-v2.json", "88a99098d3484c8a78526b27f49ad2c2db3f8d36c6e21256482a8f703bb075ea"],
  [".planning/artifacts/v1.38-plan-262-88-admission-disposition-v2.json", "471a8a2014064d40d9156f904e1c738222f3e3330581771fd03e3ffb68373452"],
  [".planning/artifacts/v1.38-plan-262-89-lifecycle-driver-readiness-v2.json", "0862ed0298d84fe73e9eaa76ecd69eb535df3a5d5bc0fce2c29482ef6386e58a"],
  [".planning/artifacts/v1.38-phase-262-current-lifecycle-status-v2.json", "83383114809c8df28bcad56d3b04ba7ba0ccebfbf4229b5900d272af4e1506a6"],
] as const)

export const V138_PHASE_262_REMEDIATION_FILES = Object.freeze([
  ["scripts/lib/v1-38-bounded-retry-integrity-successor-v1.ts", "410db3bc8a515cfee16449811b96e04c2a79f0fc8e62f47e7a35db752e5c84f4"],
  ["scripts/lib/v1-38-bounded-retry-integrity-successor-v1.test.ts", "eaeb1af6e8103bedfe6dd4cd252be269a399cb46440db0207cf2c847fd86e2f6"],
  ["scripts/lib/v1-38-durable-publication-successor-v1.ts", "17ae0edbe0845ab79d2f7ca4a4d41df54e1973541941b674f4efd629b2443a68"],
  ["scripts/lib/v1-38-durable-publication-successor-v1.test.ts", "bee02356de2c42ed69e7f5ef0234e577c41684c61546994a0f85f967fc064169"],
  ["scripts/lib/v1-38-restartable-lifecycle-successor-v1.ts", "9a29a084f6b357f02ca997867fd19a5cd31583990dda34e356657379be5d9ebf"],
  ["scripts/lib/v1-38-restartable-lifecycle-successor-v1.test.ts", "2ce8218c688611950c2f212370b57f960e68d33c9c0f0539dfc8dd749a963781"],
] as const)

const authenticateFiles = (
  root: string,
  entries: readonly (readonly [string, string])[],
  error: string,
) => {
  for (const [relative, expected] of entries) {
    const target = path.join(root, relative)
    if (!existsSync(target) || sha256(readFileSync(target)) !== `sha256:${expected}`) {
      fail(error)
    }
  }
}

export const deriveV138Phase262ReviewFixCorrection = (root: string): any => {
  authenticateFiles(
    root,
    V138_PHASE_262_PROTECTED_FILES,
    "V138_REVIEW_FIX_PROTECTED_BYTES_MISMATCH",
  )
  authenticateFiles(
    root,
    V138_PHASE_262_REMEDIATION_FILES,
    "V138_REVIEW_FIX_SOURCE_MISMATCH",
  )
  const sourceReview = JSON.parse(
    readFileSync(
      path.join(
        root,
        ".planning/artifacts/v1.38-plan-262-85-bounded-retry-source-review-v2.json",
      ),
      "utf8",
    ),
  )
  const disposition = JSON.parse(
    readFileSync(
      path.join(
        root,
        ".planning/artifacts/v1.38-plan-262-88-admission-disposition-v2.json",
      ),
      "utf8",
    ),
  )
  if (
    sourceReview.status !== "zero_findings" ||
    sourceReview.reviewRoot !==
      "sha256:cb2caa67fb06d18ecbd55ade040a80f7c1fa90505cc37b6a7079722c14e9544b" ||
    disposition.status !== "non_pass" ||
    disposition.counters?.freshAccepted !== 0 ||
    disposition.counters?.requiredAccepted !== 540
  ) {
    fail("V138_REVIEW_FIX_HISTORICAL_JOIN_INVALID")
  }
  const body = {
    schemaVersion: "v1.38-phase-262-review-fix-correction-v1" as const,
    status: "integrity_non_pass" as const,
    assuranceClass: "single_operator_local_seal_v1" as const,
    oldSourceReview: {
      path: ".planning/artifacts/v1.38-plan-262-85-bounded-retry-source-review-v2.json",
      reviewRoot: sourceReview.reviewRoot,
      status: "zero_findings" as const,
      futureAuthorityStatus: "superseded" as const,
      historicalBytesMutated: false as const,
    },
    currentReview: {
      path: ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-REVIEW.md",
      sha256: "sha256:f766ece5211d1c83fe2a4f50d35f2834aac5aaa23e83c3959b717919a9246402" as const,
      criticalFindings: 5 as const,
      remediationStatus: "implemented" as const,
      independentRereviewRequired: true as const,
    },
    remediation: {
      sourceOnly: true as const,
      commits: {
        CR01: "0f49e7dddc3601d086d5325fd841d12828d00ba7",
        CR02: "b8083697cb06361dcb9e0d63c3a6d98cbe6a181c",
        CR03: "aed26e9fd38778d0542287de6a65cd56ea26769e",
        CR04: "7dfae25aaf4e6e6536e6286e590e48cf575fba56",
        CR05: "2c7cf54a09426d3f72956aecaae690a37513005d",
      },
      files: V138_PHASE_262_REMEDIATION_FILES.map(([relative, digest]) => ({
        path: relative,
        sha256: `sha256:${digest}`,
      })),
    },
    empiricalOutcome: {
      terminalDisposition: "exhausted" as const,
      freshAccepted: 0 as const,
      requiredAccepted: 540 as const,
      reproductionV16Present: false as const,
      outcomeReinterpreted: false as const,
    },
    authority: {
      newRetryEnvelopeAuthorized: false as const,
      reproductionAuthorized: false as const,
      candidateSearchAuthorized: false as const,
      phase263PlanningAuthorized: false as const,
      phase263ExecutionAuthorized: false as const,
      formationMaterializationAuthorized: false as const,
      holdoutOpeningAuthorized: false as const,
      publicAuthorized: false as const,
      productAuthorized: false as const,
      productionAuthorized: false as const,
      countedPlayAuthorized: false as const,
      gameplayChangeAuthorized: false as const,
      archiveAuthorized: false as const,
      tagAuthorized: false as const,
    },
    protectedFiles: V138_PHASE_262_PROTECTED_FILES.map(([relative, digest]) => ({
      path: relative,
      sha256: `sha256:${digest}`,
    })),
  }
  return Object.freeze({
    ...body,
    correctionRoot: sha256(
      `v138-phase262-review-fix-correction-v1\0${canonical(body)}`,
    ),
  })
}

export const checkV138Phase262ReviewFixCorrection = (root: string): true => {
  const target = path.join(root, V138_PHASE_262_REVIEW_FIX_CORRECTION_PATH)
  const bytes = readFileSync(target, "utf8")
  const candidate = JSON.parse(bytes)
  const expected = deriveV138Phase262ReviewFixCorrection(root)
  if (bytes !== canonical(candidate) || canonical(candidate) !== canonical(expected)) {
    return fail("V138_REVIEW_FIX_CORRECTION_MISMATCH")
  }
  return true
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = process.cwd()
  if (process.argv[2] === "--derive") {
    process.stdout.write(canonical(deriveV138Phase262ReviewFixCorrection(root)))
  } else if (process.argv[2] === "--check") {
    checkV138Phase262ReviewFixCorrection(root)
    process.stdout.write("review_fix_correction_valid=true\n")
  } else {
    fail("V138_REVIEW_FIX_CORRECTION_COMMAND_INVALID")
  }
}
