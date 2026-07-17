import { Buffer } from "node:buffer"
import { createHash } from "node:crypto"
import { describe, expect, it, vi } from "vitest"
import {
  ACTIVATION_PROOF_PATH,
  ACTIVATION_SELECTOR_PATHS,
  ACTIVATION_VALIDATION_GATE_IDS,
  buildV119SelectorBytes,
  type ActivationHead,
  type FileBytes,
  type GateReceipt,
} from "./activate-v1-37-observation-v1-19.js"
import {
  buildExpectedV119SelectorManifest,
  collectV137ObservationV119PostactivationEvidence,
  parseV137ObservationV119PostactivationArgs,
  validateV137ObservationV119PostactivationEvidence,
  type V137ObservationV119PostactivationEvidence,
} from "./evaluate-v1-37-observation-v1-19-postactivation.js"

const hash = (value: string | Uint8Array): `sha256:${string}` =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`
const git = (character: string): string => character.repeat(40)
const ACTIVATION_ID = "activation:phase260:plan31:test"
const PARENT = git("a")
const COMMIT = git("b")
const TREE = git("c")
const NOW = "2026-07-17T12:00:00.000Z"
const ALL_PATHS = [...ACTIVATION_SELECTOR_PATHS, ACTIVATION_PROOF_PATH].sort()

const receipt = (id: string): GateReceipt => ({
  id,
  command: `test:${id}`,
  exitCode: 0,
  stdoutSha256: hash(`stdout:${id}`),
  stderrSha256: hash(`stderr:${id}`),
  completedAt: NOW,
})

const proofObject = () => ({
  schemaVersion: "v1.37-observation-v1.19-activation-proof-v1" as const,
  lifecycle: "pending-precommit" as const,
  activationId: ACTIVATION_ID,
  parentHead: PARENT,
  pendingSelectionRoot:
    "sha256:17954660f17c83e60e5d7df0b589cd89cf6b00eba4d4963e2d4bf43bc71c6ea2",
  selectorManifest: buildExpectedV119SelectorManifest().entries,
  selectorManifestRoot:
    "sha256:552386a32c70a73a82e85fc3be7a4d08d4d71bf78d16757702a8e056540f5a8f" as `sha256:${string}`,
  preimage: ALL_PATHS.map((path) =>
    path === ACTIVATION_PROOF_PATH
      ? { path, state: "absent" as const }
      : { path, state: "present" as const, sha256: hash(`old:${path}`) },
  ),
  proofPreimageRoot: hash("preimage"),
  validationReceipts: ACTIVATION_VALIDATION_GATE_IDS.map(receipt),
  rollbackReceipt: receipt("rollback"),
})

const passing = (): V137ObservationV119PostactivationEvidence => {
  const proof = proofObject()
  // The evaluator recomputes the canonical root; source it from its own builder.
  proof.selectorManifestRoot = buildExpectedV119SelectorManifest().root
  const proofBytes = Buffer.from(`${JSON.stringify(proof, null, 2)}\n`)
  const proofDigest = hash(proofBytes)
  const selectorManifest = buildExpectedV119SelectorManifest()
  return {
    schemaVersion: "v1.37-observation-v1.19-postactivation-evidence-v2",
    activationId: ACTIVATION_ID,
    proof,
    proofDigest,
    head: {
      state: "active-v1.19-finalized",
      revision: 2,
      activeSelectionRoot: proof.pendingSelectionRoot,
      pendingIntent: null,
      finalization: {
        activationId: ACTIVATION_ID,
        proofDigest,
        commitSha: COMMIT,
        treeSha: TREE,
        selectorManifestRoot: selectorManifest.root,
      },
      compensation: null,
    },
    git: {
      headSha: COMMIT,
      parentSha: PARENT,
      treeSha: TREE,
      changedPaths: ALL_PATHS,
      selectorManifest: selectorManifest.entries,
    },
    smokeReceipt: receipt("smoke"),
    protectedBaseline: {
      status: "verified",
      baselineSha256:
        "sha256:c0e1c2a6319f01377df74a2d6e5c493d26382f2882c059116c5ba467e5e81707",
      protectedPathCount: 2,
    },
  }
}

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

describe("v1.37 observation-v1.19 postactivation evaluator", () => {
  it("passes only the finite five-selector, externally finalized activation", () => {
    const evidence = passing()
    expect(validateV137ObservationV119PostactivationEvidence(evidence)).toEqual(
      {
        status: "passed",
        errors: [],
      },
    )
    expect(evidence.proof.selectorManifest).toHaveLength(5)
    expect(
      evidence.proof.selectorManifest.map(({ path }) => path),
    ).not.toContain(ACTIVATION_PROOF_PATH)
    expect(evidence.git.changedPaths).toHaveLength(6)
  })

  it("rejects a mixed selector and proof recursion", () => {
    const mixed = clone(passing())
    mixed.proof.selectorManifest[0]!.sha256 = hash("mixed")
    expect(
      validateV137ObservationV119PostactivationEvidence(mixed).status,
    ).toBe("failed")

    const recursive = clone(passing())
    recursive.proof.selectorManifest.push({
      path: ACTIVATION_PROOF_PATH,
      sha256: hash("recursive"),
    })
    expect(
      validateV137ObservationV119PostactivationEvidence(recursive).errors,
    ).toContain("selector manifest")
  })

  it("rejects a stale or lingering pending intent", () => {
    const pending = clone(passing())
    const mutableHead = pending.head as unknown as {
      state: ActivationHead["state"]
      pendingIntent: ActivationHead["pendingIntent"]
    }
    mutableHead.state = "pending-precommit"
    mutableHead.pendingIntent = {
      direction: "forward",
      activationId: ACTIVATION_ID,
      parentHead: PARENT,
      targetRoot: pending.proof.pendingSelectionRoot,
      selectorManifest: pending.proof.selectorManifest,
      selectorManifestRoot: pending.proof.selectorManifestRoot,
      proofPreimageRoot: pending.proof.proofPreimageRoot,
    }
    expect(
      validateV137ObservationV119PostactivationEvidence(pending).errors,
    ).toContain("final semantic head")
  })

  it("requires every validation, rollback, and smoke receipt", () => {
    const missing = clone(passing())
    missing.proof.validationReceipts.pop()
    expect(
      validateV137ObservationV119PostactivationEvidence(missing).errors,
    ).toContain("validation receipts")

    const rollback = clone(passing())
    rollback.proof.rollbackReceipt = null
    expect(
      validateV137ObservationV119PostactivationEvidence(rollback).errors,
    ).toContain("rollback receipt")

    const smoke = clone(passing())
    ;(smoke.smokeReceipt as unknown as { id: string }).id = "not-smoke"
    expect(
      validateV137ObservationV119PostactivationEvidence(smoke).errors,
    ).toContain("live smoke")
  })

  it("rejects partial restore evidence and recursive evaluator commands", () => {
    const partial = clone(passing())
    partial.proof.preimage.pop()
    expect(
      validateV137ObservationV119PostactivationEvidence(partial).errors,
    ).toContain("six-path preimage")

    const recursive = clone(passing())
    ;(
      recursive.proof.validationReceipts[0]! as unknown as { command: string }
    ).command = "evaluate-v1-37-observation-v1-19-postactivation --check"
    expect(
      validateV137ObservationV119PostactivationEvidence(recursive).errors,
    ).toContain("validation receipts")
  })

  it.each([
    [
      "commit",
      (value: V137ObservationV119PostactivationEvidence) =>
        (value.git.headSha = git("9")),
    ],
    [
      "parent",
      (value: V137ObservationV119PostactivationEvidence) =>
        (value.git.parentSha = git("9")),
    ],
    [
      "tree",
      (value: V137ObservationV119PostactivationEvidence) =>
        (value.git.treeSha = git("9")),
    ],
    [
      "proof",
      (value: V137ObservationV119PostactivationEvidence) =>
        (value.proofDigest = hash("wrong")),
    ],
  ] as const)("rejects a %s binding mismatch", (_name, mutate) => {
    const evidence = clone(passing())
    mutate(evidence)
    expect(
      validateV137ObservationV119PostactivationEvidence(evidence).status,
    ).toBe("failed")
  })

  it("treats compensated v1.17 as a safe blocker, never success", () => {
    const compensated = clone(passing())
    const mutableHead = compensated.head as unknown as {
      state: ActivationHead["state"]
      activeSelectionRoot: string
      compensation: ActivationHead["compensation"]
    }
    mutableHead.state = "active-v1.17-compensated"
    mutableHead.activeSelectionRoot =
      "sha256:fd2cc24a345c0cb94dde9966262f128c663a4430022574729eb4a902177c4b5a"
    mutableHead.compensation = {
      activationId: "compensation:phase260:plan31:test",
      sourceActivationId: ACTIVATION_ID,
      recoveryReceiptDigest: hash("recovery"),
      commitSha: git("d"),
      treeSha: git("e"),
      selectorManifestRoot: hash("restored-selectors"),
    }
    const result =
      validateV137ObservationV119PostactivationEvidence(compensated)
    expect(result.status).toBe("blocked")
    expect(result.errors).toContain("compensated v1.17 safe blocker")
  })

  it("rejects fake recovery and private diagnostic fields", () => {
    const fake = clone(passing())
    ;(
      fake.head as unknown as { compensation: ActivationHead["compensation"] }
    ).compensation = {
      activationId: "compensation:fake",
      sourceActivationId: ACTIVATION_ID,
      recoveryReceiptDigest: hash("fake"),
      commitSha: git("d"),
      treeSha: git("e"),
      selectorManifestRoot: hash("fake"),
    }
    expect(validateV137ObservationV119PostactivationEvidence(fake).status).toBe(
      "failed",
    )

    const privateEvidence = clone(passing()) as unknown as Record<
      string,
      unknown
    >
    privateEvidence.diagnostics = { source: "private" }
    expect(
      validateV137ObservationV119PostactivationEvidence(privateEvidence).errors,
    ).toContain("evidence shape")
  })

  it("collects proof, selector, Git, head, and live smoke from the real coordinator port", async () => {
    const expected = passing()
    const proofBytes = Buffer.from(
      `${JSON.stringify(expected.proof, null, 2)}\n`,
    )
    const selectors = buildV119SelectorBytes()
    const adapter = {
      readHead: vi.fn(async () => expected.head as ActivationHead),
      gitHead: vi.fn(async () => COMMIT),
      gitParent: vi.fn(async () => PARENT),
      gitTree: vi.fn(async () => TREE),
      changedPaths: vi.fn(async () => ALL_PATHS),
      readCommitFile: vi.fn(
        async (_commit: string, filePath: string): Promise<FileBytes> => {
          if (filePath === ACTIVATION_PROOF_PATH)
            return { state: "present", bytes: proofBytes }
          const bytes = selectors.get(filePath)
          return bytes === undefined
            ? { state: "absent" }
            : { state: "present", bytes }
        },
      ),
      runGate: vi.fn(async () => receipt("smoke")),
    }
    const evidence = await collectV137ObservationV119PostactivationEvidence(
      adapter,
      ACTIVATION_ID,
    )
    expect(
      validateV137ObservationV119PostactivationEvidence(evidence).status,
    ).toBe("passed")
    expect(adapter.runGate).toHaveBeenCalledWith("smoke")
  })

  it("supports only explicit read-only checking", () => {
    expect(
      parseV137ObservationV119PostactivationArgs([
        "--check",
        "--activation-id",
        ACTIVATION_ID,
      ]),
    ).toEqual({ activationId: ACTIVATION_ID })
    expect(() =>
      parseV137ObservationV119PostactivationArgs(["--write"]),
    ).toThrow(/read-only/iu)
  })
})
