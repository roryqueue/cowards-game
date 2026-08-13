import { Buffer } from "node:buffer"
import { execFileSync } from "node:child_process"
import { chmodSync, chownSync, mkdirSync, readFileSync, symlinkSync, unlinkSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { mkdtempSync } from "node:fs"
import { afterEach, describe, expect, it, vi } from "vitest"
import {
  armV138LocalSealOpening,
  buildV138LocalSealProtocolArtifact,
  buildV138LocalSealProtocolArtifactV2,
  commitV138LocalSeal,
  consumeV138LocalSealOpening,
  deriveV138LocalSealCheckoutIdentity,
  markV138LocalSealContaminated,
  projectV138LocalSealReceipt,
  retireV138LocalSeal,
  verifyV138LocalSealReceipt,
} from "./lib/v1-38-local-seal.js"

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const ROOT_A = `sha256:${"a".repeat(64)}` as const
const ROOT_B = `sha256:${"b".repeat(64)}` as const
const ROOT_C = `sha256:${"c".repeat(64)}` as const
const roots = {
  currentLeagueFreezeRoot: ROOT_A,
  coldCommonRoot: ROOT_B,
  profileManifestFreezeRoot: ROOT_C,
  preSearchPolicyRoot: "sha256:6ad9134977310215ce6e98171d3586c9ae1853313f912ff6e9af95966607e382" as const,
  metricRoot: ROOT_A,
  classifierRoot: ROOT_B,
  thresholdRoot: ROOT_C,
  opponentRoot: ROOT_A,
  scheduleRoot: ROOT_B,
  finalistRoot: ROOT_C,
  kernelRoot: ROOT_A,
  runtimeRoot: ROOT_B,
  semanticRoot: ROOT_C,
  receiptAllowlistRoot: ROOT_A,
  contaminationPolicyRoot: ROOT_B,
  retirementPolicyRoot: ROOT_C,
}

const request = () => ({
  schemaVersion: "v1.38-local-seal-open-request-v1" as const,
  assuranceClass: "single_operator_local_seal_v1" as const,
  repositoryOperator: "roryquinlan-repository-operator",
  toolMediatedLedger: true as const,
  operatorNoPrematureAccessDeclaration: true as const,
  ...roots,
})

const git = (repoRoot: string, args: readonly string[]): string =>
  execFileSync("git", ["-C", repoRoot, ...args], { encoding: "utf8" }).trim()

const temporaryGitCheckout = () => {
  const repoRoot = mkdtempSync(path.join(tmpdir(), "v138-local-seal-git-"))
  git(repoRoot, ["init", "--quiet"])
  git(repoRoot, ["config", "user.email", "local-seal@example.invalid"])
  git(repoRoot, ["config", "user.name", "Local Seal Test"])
  writeFileSync(path.join(repoRoot, "freeze-carrier.json"), "{\"schemaVersion\":\"fixture-v1\"}\n")
  git(repoRoot, ["add", "freeze-carrier.json"])
  git(repoRoot, ["commit", "--quiet", "-m", "fixture"])
  const checkout = deriveV138LocalSealCheckoutIdentity(repoRoot)
  return { repoRoot, checkout, request: { ...request(), currentLeagueFreezeRoot: checkout.currentLeagueFreezeRoot } }
}

const temporaryStore = (secret = Buffer.alloc(32, 0x5a)) => {
  const storeRoot = mkdtempSync(path.join(tmpdir(), "v138-local-seal-"))
  chmodSync(storeRoot, 0o700)
  const inputRoot = path.join(storeRoot, "input")
  mkdirSync(inputRoot, { mode: 0o700 })
  const secretPath = path.join(inputRoot, "commitment-secret.bin")
  writeFileSync(secretPath, secret, { mode: 0o600 })
  return { storeRoot, inputRoot, secretPath }
}

const commit = (storeRoot: string, faults?: Parameters<typeof commitV138LocalSeal>[1]) =>
  commitV138LocalSeal({ repoRoot: REPO_ROOT, storeRoot, request: request() }, faults)

const projection = () => ({
  schemaVersion: "v1.38-local-seal-safe-receipt-v1" as const,
  status: "synthetic_protocol_passed" as const,
  evaluatedItemCount: 3,
  findingCount: 0,
  aggregateMetrics: { interactionRateBps: 5100, exploitabilityMilli: 125 },
  resultRoot: ROOT_A,
  receiptRoot: ROOT_B,
})

afterEach(() => vi.restoreAllMocks())

describe("v1.38 single-operator local seal", () => {
  it("derives one stable full Git checkout identity and rejects invented or abbreviated roots", () => {
    const fixture = temporaryGitCheckout()
    expect(deriveV138LocalSealCheckoutIdentity(fixture.repoRoot)).toEqual(fixture.checkout)
    expect(fixture.checkout).toMatchObject({
      sourceCommit: expect.stringMatching(/^[0-9a-f]{40}$/u),
      sourceTree: expect.stringMatching(/^[0-9a-f]{40}$/u),
      freezeCarrierIdentity: expect.stringMatching(/^sha256:[0-9a-f]{64}$/u),
      currentLeagueFreezeRoot: expect.stringMatching(/^sha256:[0-9a-f]{64}$/u),
    })

    const invented = temporaryStore()
    expect(() => commitV138LocalSeal({
      repoRoot: fixture.repoRoot,
      storeRoot: invented.storeRoot,
      request: { ...fixture.request, currentLeagueFreezeRoot: ROOT_A },
    })).toThrow("V138_LOCAL_SEAL_FREEZE_IDENTITY_MISMATCH")
    const abbreviated = temporaryStore()
    expect(() => commitV138LocalSeal({
      repoRoot: fixture.repoRoot,
      storeRoot: abbreviated.storeRoot,
      request: { ...fixture.request, currentLeagueFreezeRoot: `sha256:${fixture.checkout.currentLeagueFreezeRoot.slice(7, 47).padEnd(64, "0")}` as const },
    })).toThrow("V138_LOCAL_SEAL_FREEZE_IDENTITY_MISMATCH")
  })

  it.each(["non-git", "staged", "unstaged", "untracked"] as const)(
    "rejects a %s checkout before commitment evidence exists",
    (mutation) => {
      const repoRoot = mutation === "non-git"
        ? mkdtempSync(path.join(tmpdir(), "v138-local-seal-non-git-"))
        : temporaryGitCheckout().repoRoot
      if (mutation === "staged") {
        writeFileSync(path.join(repoRoot, "freeze-carrier.json"), "staged\n")
        git(repoRoot, ["add", "freeze-carrier.json"])
      } else if (mutation === "unstaged") {
        writeFileSync(path.join(repoRoot, "freeze-carrier.json"), "unstaged\n")
      } else if (mutation === "untracked") {
        writeFileSync(path.join(repoRoot, "untracked.txt"), "untracked\n")
      }
      const store = temporaryStore()
      expect(() => commitV138LocalSeal({ repoRoot, storeRoot: store.storeRoot, request: request() }))
        .toThrow(mutation === "non-git" ? "V138_LOCAL_SEAL_GIT_UNAVAILABLE" : "V138_LOCAL_SEAL_CHECKOUT_DIRTY")
      expect(() => readFileSync(path.join(store.storeRoot, "commitment", "record.json"))).toThrow()
    },
  )

  it("rechecks the exact committed HEAD/tree/freeze join when arming and never reaches evaluation after drift", () => {
    for (const mutation of ["head", "tree", "between-stages"] as const) {
      const fixture = temporaryGitCheckout()
      const store = temporaryStore()
      const committed = commitV138LocalSeal({ repoRoot: fixture.repoRoot, storeRoot: store.storeRoot, request: fixture.request })
      if (mutation === "head") {
        writeFileSync(path.join(fixture.repoRoot, "second.txt"), "second\n")
        git(fixture.repoRoot, ["add", "second.txt"])
        git(fixture.repoRoot, ["commit", "--quiet", "-m", "second"])
      } else if (mutation === "tree") {
        writeFileSync(path.join(fixture.repoRoot, "freeze-carrier.json"), "tree-change\n")
        git(fixture.repoRoot, ["add", "freeze-carrier.json"])
        git(fixture.repoRoot, ["commit", "--quiet", "-m", "tree change"])
      } else {
        writeFileSync(path.join(fixture.repoRoot, "untracked-after-commit.txt"), "drift\n")
      }
      expect(() => armV138LocalSealOpening(
        { repoRoot: fixture.repoRoot, storeRoot: store.storeRoot }, fixture.request, committed.commitmentRoot,
      )).toThrow(mutation === "between-stages" ? "V138_LOCAL_SEAL_CHECKOUT_DIRTY" : "V138_LOCAL_SEAL_CHECKOUT_IDENTITY_DRIFT")
      expect(() => consumeV138LocalSealOpening(
        { repoRoot: fixture.repoRoot, storeRoot: store.storeRoot }, fixture.request, () => projection(),
      )).toThrow("V138_LOCAL_SEAL_TERMINAL")
    }
  })

  it("accepts only the exact reduced-assurance request and approved roots", () => {
    const { storeRoot } = temporaryStore()
    const result = commit(storeRoot)
    expect(result).toMatchObject({
      assuranceClass: "single_operator_local_seal_v1",
      repositoryOperator: "roryquinlan-repository-operator",
      independentCustodyClaimed: false,
      maliciousOwnerResistanceClaimed: false,
      downstreamAuthority: "denied",
    })
    expect(result).not.toHaveProperty("storeRoot")
    expect(result).not.toHaveProperty("secret")

    const bad = temporaryStore()
    expect(() => commitV138LocalSeal({
      repoRoot: REPO_ROOT,
      storeRoot: bad.storeRoot,
      request: { ...request(), assuranceClass: "external_custody" } as never,
    })).toThrow("V138_LOCAL_SEAL_REQUEST_INVALID")
  })

  it("reads the fixed secret file once, zero-fills owned buffers, unlinks, and emits no secret/path", () => {
    const secret = Buffer.from("local-seal-secret-material-32-byte")
    const { storeRoot, secretPath } = temporaryStore(secret)
    const fillSpy = vi.spyOn(Buffer.prototype, "fill")
    const result = commit(storeRoot)
    expect(() => readFileSync(secretPath)).toThrow()
    expect(fillSpy).toHaveBeenCalledWith(0)
    expect(JSON.stringify(result)).not.toContain(secret.toString("utf8"))
    expect(JSON.stringify(result)).not.toContain(storeRoot)
  })

  it.each([
    ["group-readable secret", 0o640, "file"],
    ["group-readable root", 0o750, "root"],
    ["group-readable input", 0o750, "input"],
  ] as const)("rejects %s without commitment evidence", (_label, mode, target) => {
    const fixture = temporaryStore()
    chmodSync(target === "file" ? fixture.secretPath : target === "root" ? fixture.storeRoot : fixture.inputRoot, mode)
    expect(() => commit(fixture.storeRoot)).toThrow("V138_LOCAL_SEAL_")
    expect(() => readFileSync(path.join(fixture.storeRoot, "commitment", "record.json"))).toThrow()
  })

  it("rejects symlinks, directories, and bounded-size violations", () => {
    const link = temporaryStore()
    const outside = path.join(link.storeRoot, "outside.bin")
    writeFileSync(outside, Buffer.alloc(32), { mode: 0o600 })
    // replace only the fixture secret; the implementation must never follow it
    unlinkSync(link.secretPath)
    symlinkSync(outside, link.secretPath)
    expect(() => commit(link.storeRoot)).toThrow("V138_LOCAL_SEAL_SECRET_SYMLINK")

    const directory = temporaryStore()
    unlinkSync(directory.secretPath)
    mkdirSync(directory.secretPath, { mode: 0o700 })
    expect(() => commit(directory.storeRoot)).toThrow("V138_LOCAL_SEAL_SECRET_TYPE_INVALID")

    for (const size of [31, 4097]) {
      const fixture = temporaryStore(Buffer.alloc(size))
      expect(() => commit(fixture.storeRoot)).toThrow("V138_LOCAL_SEAL_SECRET_SIZE_INVALID")
    }
  })

  it.skipIf(typeof process.getuid !== "function" || process.getuid() !== 0)("rejects a secret owned by a different uid when fixtureable", () => {
    const fixture = temporaryStore()
    chownSync(fixture.secretPath, 1, 1)
    expect(() => commit(fixture.storeRoot)).toThrow("V138_LOCAL_SEAL_OWNER_INVALID")
  })

  it("fails closed on short read, unlink, or input-directory fsync uncertainty", () => {
    for (const fault of ["shortRead", "unlink", "inputFsync"] as const) {
      const fixture = temporaryStore()
      expect(() => commit(fixture.storeRoot, { [fault]: true })).toThrow(`V138_LOCAL_SEAL_${fault === "shortRead" ? "SECRET_SHORT_READ" : fault === "unlink" ? "SECRET_UNLINK_FAILED" : "INPUT_FSYNC_FAILED"}`)
      expect(() => readFileSync(path.join(fixture.storeRoot, "commitment", "record.json"))).toThrow()
    }
  })

  it("persists open_consumed before launching evaluation and burns crashes without retry", () => {
    const fixture = temporaryStore()
    const committed = commit(fixture.storeRoot)
    armV138LocalSealOpening({ repoRoot: REPO_ROOT, storeRoot: fixture.storeRoot }, request(), committed.commitmentRoot)
    let stateSeen = ""
    expect(() => consumeV138LocalSealOpening(
      { repoRoot: REPO_ROOT, storeRoot: fixture.storeRoot },
      request(),
      () => {
        stateSeen = readFileSync(path.join(fixture.storeRoot, "state", "state.json"), "utf8")
        throw new Error("synthetic callback crash")
      },
    )).toThrow("V138_LOCAL_SEAL_EVALUATION_SYSTEM_FAILURE")
    expect(stateSeen).toContain('"state":"open_consumed"')
    expect(() => consumeV138LocalSealOpening(
      { repoRoot: REPO_ROOT, storeRoot: fixture.storeRoot }, request(), () => projection(),
    )).toThrow("V138_LOCAL_SEAL_TERMINAL")
  })

  it("joins the exact request before accepting projection and receipt verification", () => {
    const fixture = temporaryStore()
    const committed = commit(fixture.storeRoot)
    armV138LocalSealOpening({ repoRoot: REPO_ROOT, storeRoot: fixture.storeRoot }, request(), committed.commitmentRoot)
    const opened = consumeV138LocalSealOpening(
      { repoRoot: REPO_ROOT, storeRoot: fixture.storeRoot }, request(), () => projection(),
    )
    const receipt = projectV138LocalSealReceipt(
      { repoRoot: REPO_ROOT, storeRoot: fixture.storeRoot }, request(), opened.evaluationRoot,
    )
    expect(verifyV138LocalSealReceipt(
      { repoRoot: REPO_ROOT, storeRoot: fixture.storeRoot }, request(), receipt,
    )).toMatchObject({ state: "verified", satisfiesSeal01Mechanics: true, downstreamAuthority: "denied" })
    expect(() => retireV138LocalSeal(
      { repoRoot: REPO_ROOT, storeRoot: fixture.storeRoot }, request(),
    )).not.toThrow()
  })

  it("terminally contaminates mismatched roots and forbidden safe projections", () => {
    const fixture = temporaryStore()
    const committed = commit(fixture.storeRoot)
    expect(() => armV138LocalSealOpening(
      { repoRoot: REPO_ROOT, storeRoot: fixture.storeRoot },
      { ...request(), scheduleRoot: ROOT_C },
      committed.commitmentRoot,
    )).toThrow("V138_LOCAL_SEAL_REQUEST_MISMATCH")
    expect(() => armV138LocalSealOpening(
      { repoRoot: REPO_ROOT, storeRoot: fixture.storeRoot }, request(), committed.commitmentRoot,
    )).toThrow("V138_LOCAL_SEAL_TERMINAL")

    const second = temporaryStore()
    const secondCommit = commit(second.storeRoot)
    armV138LocalSealOpening({ repoRoot: REPO_ROOT, storeRoot: second.storeRoot }, request(), secondCommit.commitmentRoot)
    const opened = consumeV138LocalSealOpening(
      { repoRoot: REPO_ROOT, storeRoot: second.storeRoot }, request(),
      () => ({ ...projection(), strategySource: "PRIVATE_secret" }),
    )
    expect(() => projectV138LocalSealReceipt(
      { repoRoot: REPO_ROOT, storeRoot: second.storeRoot }, request(),
      opened.evaluationRoot,
    )).toThrow("V138_LOCAL_SEAL_SAFE_PROJECTION_INVALID")
  })

  it("detects ledger deletion, reorder, mutation, duplication, and truncation", () => {
    for (const mutation of ["delete", "reorder", "mutate", "duplicate", "truncate"] as const) {
      const fixture = temporaryStore()
      const committed = commit(fixture.storeRoot)
      armV138LocalSealOpening({ repoRoot: REPO_ROOT, storeRoot: fixture.storeRoot }, request(), committed.commitmentRoot)
      const ledgerPath = path.join(fixture.storeRoot, "events", "ledger.ndjson")
      const lines = readFileSync(ledgerPath, "utf8").trimEnd().split("\n")
      const changed = mutation === "delete" ? lines.slice(1)
        : mutation === "reorder" ? [...lines].reverse()
          : mutation === "mutate" ? lines.map((line, index) => index === 0 ? line.replace("committed", "projected") : line)
            : mutation === "duplicate" ? [...lines, lines.at(-1)!]
              : [lines[0]!.slice(0, -2)]
      writeFileSync(ledgerPath, `${changed.join("\n")}\n`, { mode: 0o600 })
      expect(() => consumeV138LocalSealOpening(
        { repoRoot: REPO_ROOT, storeRoot: fixture.storeRoot }, request(), () => projection(),
      )).toThrow("V138_LOCAL_SEAL_LEDGER_INVALID")
    }
  })

  it("supports only explicit contamination and retirement failure transitions", () => {
    const fixture = temporaryStore()
    commit(fixture.storeRoot)
    const contaminated = markV138LocalSealContaminated(
      { repoRoot: REPO_ROOT, storeRoot: fixture.storeRoot }, "operator-declared-contamination",
    )
    expect(contaminated.state).toBe("contaminated")
    expect(retireV138LocalSeal(
      { repoRoot: REPO_ROOT, storeRoot: fixture.storeRoot }, request(),
    ).state).toBe("retired")
  })

  it("exports no generic access surface or inflated assurance vocabulary", async () => {
    const module = await import("./lib/v1-38-local-seal.js")
    for (const name of Object.keys(module)) {
      expect(name).not.toMatch(/read|get|query|list|debug|preimage|secret/ui)
    }
    expect(JSON.stringify(module)).not.toContain("separatelyPermissioned")
    expect(JSON.stringify(module)).not.toContain("independent_custody")
    const cli = readFileSync(path.join(REPO_ROOT, "scripts/evaluate-v1-38-local-seal.ts"), "utf8")
    expect(cli).not.toContain("process.env")
    expect(cli).not.toMatch(/--(?:secret|key|preimage|store-root)/u)
    expect(cli).not.toContain("commitment-secret.bin")
  })

  it("builds a deterministic synthetic-only, non-authorizing protocol artifact", () => {
    const artifact = buildV138LocalSealProtocolArtifact({
      moduleSourceBytes: Buffer.from("synthetic module fixture"),
      testSourceBytes: Buffer.from("synthetic test fixture"),
      cliSourceBytes: Buffer.from("synthetic cli fixture"),
      preSearchPolicyBytes: readFileSync(path.join(REPO_ROOT, ".planning/artifacts/v1.38-pre-search-policy-root.json")),
    })
    expect(artifact).toMatchObject({
      assuranceClass: "single_operator_local_seal_v1",
      realHoldoutMaterialPresent: false,
      satisfiesSeal01Mechanics: true,
      independentCustodyClaimed: false,
      openingConsumptionDurableBeforeEvaluation: true,
      evaluationFailureDisposition: "charged_terminal_system_failure_no_retry",
      downstreamAuthority: "denied",
    })
    expect(JSON.stringify(artifact)).not.toContain(tmpdir())
  })

  it("builds additive protocol v2 evidence without changing the v1 schema", () => {
    const input = {
      moduleSourceBytes: Buffer.from("synthetic module fixture"),
      testSourceBytes: Buffer.from("synthetic test fixture"),
      cliSourceBytes: Buffer.from("synthetic cli fixture"),
      preSearchPolicyBytes: readFileSync(path.join(REPO_ROOT, ".planning/artifacts/v1.38-pre-search-policy-root.json")),
    }
    expect(buildV138LocalSealProtocolArtifact(input).schemaVersion).toBe("v1.38-local-seal-protocol-v1")
    expect(buildV138LocalSealProtocolArtifactV2(input)).toMatchObject({
      schemaVersion: "v1.38-local-seal-protocol-v2",
      cleanCheckoutRequiredAtCommit: true,
      exactCheckoutRecheckRequiredAtArm: true,
      callerProvidedFreezeIdentityAccepted: false,
      satisfiesSeal01: false,
      downstreamAuthority: "denied",
    })
  })
})
