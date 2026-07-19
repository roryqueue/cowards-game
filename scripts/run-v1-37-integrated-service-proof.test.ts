import { readFileSync } from "node:fs"
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { describe, expect, it } from "vitest"
import {
  V137_INTEGRATED_SERVICE_PROOF_CONTROL_PATH,
  assertV137IntegratedServiceTopology,
  cleanupV137OwnedProcesses,
  validateV137IntegratedServiceEnvironment,
} from "./run-v1-37-integrated-service-proof.js"

const repoRoot = path.resolve(import.meta.dirname, "..")

describe("v1.37 integrated service proof preflight topology cleanup", () => {
  it("fails closed unless every explicit DSN, restricted root, and current database head is exact", () => {
    expect(() =>
      validateV137IntegratedServiceEnvironment({}, repoRoot),
    ).toThrow("V137_SERVICE_PROOF_DATABASE_URL_REQUIRED")

    const outside = path.join(tmpdir(), "cowards-v137-proof")
    expect(
      validateV137IntegratedServiceEnvironment(
        {
          DATABASE_URL: "postgresql://proof.invalid/db",
          COWARDS_GO_BACKEND_TEST_DATABASE_URL:
            "postgresql://proof.invalid/db",
          COWARDS_V1_37_SIGNED_CONFORMANCE_TEST_DATABASE_URL:
            "postgresql://proof.invalid/db",
          COWARDS_V1_37_RESTRICTED_EVIDENCE_ROOT: outside,
        },
        repoRoot,
      ),
    ).toMatchObject({ restrictedRoot: outside })

    expect(() =>
      validateV137IntegratedServiceEnvironment(
        {
          DATABASE_URL: "postgresql://proof.invalid/db",
          COWARDS_GO_BACKEND_TEST_DATABASE_URL:
            "postgresql://other.invalid/db",
          COWARDS_V1_37_SIGNED_CONFORMANCE_TEST_DATABASE_URL:
            "postgresql://proof.invalid/db",
          COWARDS_V1_37_RESTRICTED_EVIDENCE_ROOT: outside,
        },
        repoRoot,
      ),
    ).toThrow("V137_SERVICE_PROOF_DSN_MISMATCH")
    expect(() =>
      validateV137IntegratedServiceEnvironment(
        {
          DATABASE_URL: "postgresql://proof.invalid/db",
          COWARDS_GO_BACKEND_TEST_DATABASE_URL:
            "postgresql://proof.invalid/db",
          COWARDS_V1_37_SIGNED_CONFORMANCE_TEST_DATABASE_URL:
            "postgresql://proof.invalid/db",
          COWARDS_V1_37_RESTRICTED_EVIDENCE_ROOT: path.join(
            repoRoot,
            ".proof",
          ),
        },
        repoRoot,
      ),
    ).toThrow("V137_SERVICE_PROOF_RESTRICTED_ROOT_IN_REPOSITORY")

    expect(() =>
      assertV137IntegratedServiceTopology({
        postgres: "healthy",
        redis: "healthy",
        goOwner: "ready",
        runtimeServiceOwner: "ready",
        databaseHead: {
          state: "active-v1.19-finalized",
          revision: 1,
          activeSelectionRoot:
            "sha256:17954660f17c83e60e5d7df0b589cd89cf6b00eba4d4963e2d4bf43bc71c6ea2",
          pendingIntent: false,
          compensation: false,
        },
      }),
    ).toThrow("V137_SERVICE_PROOF_DATABASE_HEAD_MISMATCH")
  })

  it("terminates only processes registered as collector-owned", async () => {
    const signalled: Array<[number, "SIGTERM"]> = []
    await cleanupV137OwnedProcesses(
      [
        { pid: 41001, label: "runtime-service", owned: true },
        { pid: 41002, label: "go-backend", owned: true },
        { pid: 1, label: "unrelated", owned: false },
      ],
      async (pid, signal) => {
        signalled.push([pid, signal])
      },
    )
    expect(signalled).toEqual([
      [41002, "SIGTERM"],
      [41001, "SIGTERM"],
    ])
  })

  it("uses argument arrays, never global teardown, and keeps the control receipt outside Git", async () => {
    const source = readFileSync(
      path.join(repoRoot, "scripts/run-v1-37-integrated-service-proof.ts"),
      "utf8",
    )
    expect(source).toContain("spawn(")
    expect(source).toContain("shell: false")
    expect(source).not.toContain('"services:down"')
    expect(source).not.toContain("docker compose down")
    expect(V137_INTEGRATED_SERVICE_PROOF_CONTROL_PATH).not.toContain(
      ".planning",
    )

    const root = await mkdtemp(path.join(tmpdir(), "v137-proof-layout-"))
    try {
      await mkdir(path.join(root, "manifests"), { recursive: true })
      await writeFile(
        path.join(root, V137_INTEGRATED_SERVICE_PROOF_CONTROL_PATH),
        "{}\n",
      )
      expect(
        await readFile(
          path.join(root, V137_INTEGRATED_SERVICE_PROOF_CONTROL_PATH),
          "utf8",
        ),
      ).toBe("{}\n")
    } finally {
      await rm(root, { recursive: true, force: true })
    }
  })
})
