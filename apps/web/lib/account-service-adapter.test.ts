import { readFileSync } from "node:fs"
import { describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => {
  const localService = {
    getAuthSession: vi.fn(),
    listStrategyRevisions: vi.fn(),
  }
  return {
    createCowardsLocalService: vi.fn(() => localService),
    createDatabasePool: vi.fn(() => ({ end: vi.fn() })),
    localService,
  }
})

vi.mock("@cowards/service", () => ({
  createCowardsLocalService: mocks.createCowardsLocalService,
}))

vi.mock("@cowards/persistence/db", () => ({
  createDatabasePool: mocks.createDatabasePool,
}))

import {
  assertGoAccountForksCanReadBack,
  createAccountReadService,
  isGoAccountRevisionsSelected,
  isGoAuthSessionSelected,
  isGoExhibitionsSelected,
  isGoAccountForksSelected,
} from "./account-service-adapter.js"

describe("account service adapter ownership gates", () => {
  it("selects all Phase 105 account route families when backend owner is Go", () => {
    const env = { COWARDS_GO_BACKEND_OWNER: "go" }

    expect(isGoAuthSessionSelected(env)).toBe(true)
    expect(isGoAccountRevisionsSelected(env)).toBe(true)
    expect(isGoAccountForksSelected(env)).toBe(true)
    expect(isGoExhibitionsSelected(env)).toBe(true)
  })

  it("selects all Phase 105 account route families in no-TypeScript-backend mode", () => {
    const env = { COWARDS_NO_TYPESCRIPT_BACKEND: "1" }

    expect(isGoAuthSessionSelected(env)).toBe(true)
    expect(isGoAccountRevisionsSelected(env)).toBe(true)
    expect(isGoAccountForksSelected(env)).toBe(true)
    expect(isGoExhibitionsSelected(env)).toBe(true)
  })

  it("selects Go account forks when the backend owner is Go", () => {
    expect(isGoAccountForksSelected({ COWARDS_GO_BACKEND_OWNER: "go" })).toBe(
      true,
    )
  })

  it("fails closed when Go forks are selected without Go revision readback", () => {
    expect(() =>
      assertGoAccountForksCanReadBack({ COWARDS_GO_ACCOUNT_FORKS: "1" }),
    ).toThrow("Go-owned account revision reads")
  })

  it("allows Go forks when revision reads are also Go-owned", () => {
    expect(() =>
      assertGoAccountForksCanReadBack({
        COWARDS_GO_ACCOUNT_FORKS: "1",
        COWARDS_GO_ACCOUNT_REVISIONS: "1",
      }),
    ).not.toThrow()
  })

  it("does not construct the local TypeScript service for selected Go reads", async () => {
    const goClient = {
      getAuthSession: vi.fn(async () => ({
        apiVersion: "service-api-v1.8" as const,
        kind: "authSession" as const,
        user: null,
      })),
      listStrategyRevisions: vi.fn(async () => ({
        apiVersion: "service-api-v1.8" as const,
        kind: "strategyRevisionList" as const,
        revisions: [],
      })),
    }
    const service = createAccountReadService({
      env: { COWARDS_GO_BACKEND_OWNER: "go", COWARDS_GO_BACKEND_URL: "http://go.test" },
      goClient: goClient as never,
    })

    await expect(service.getAuthSession("session-1")).resolves.toMatchObject({
      kind: "authSession",
    })
    await expect(service.listStrategyRevisions("session-1")).resolves.toMatchObject({
      kind: "strategyRevisionList",
    })

    expect(goClient.getAuthSession).toHaveBeenCalledWith("session-1")
    expect(goClient.listStrategyRevisions).toHaveBeenCalledWith("session-1")
    expect(mocks.createCowardsLocalService).not.toHaveBeenCalled()
    expect(mocks.localService.getAuthSession).not.toHaveBeenCalled()
    expect(mocks.localService.listStrategyRevisions).not.toHaveBeenCalled()
  })

  it("fails closed without a Go URL for selected account route families", async () => {
    const service = createAccountReadService({
      env: { COWARDS_GO_BACKEND_OWNER: "go" },
      goClient: null,
    })

    await expect(service.getAuthSession("session-1")).rejects.toThrow(
      "auth/session Go ownership requires COWARDS_GO_BACKEND_URL",
    )
    await expect(service.listStrategyRevisions("session-1")).rejects.toThrow(
      "account revisions Go ownership requires COWARDS_GO_BACKEND_URL",
    )
    expect(() =>
      assertGoAccountForksCanReadBack({
        COWARDS_GO_BACKEND_OWNER: "go",
      }),
    ).not.toThrow()
  })

  it("keeps selected account API adapters free of TypeScript backend imports", () => {
    const selectedFiles = [
      "apps/web/app/api/auth/session/route.ts",
      "apps/web/app/api/auth/sign-in/route.ts",
      "apps/web/app/api/auth/sign-up/route.ts",
      "apps/web/app/api/auth/sign-out/route.ts",
      "apps/web/app/api/account/revisions/route.ts",
      "apps/web/app/api/account/revisions/[revisionId]/source/route.ts",
      "apps/web/app/api/account/starter-forks/route.ts",
      "apps/web/app/api/account/advanced-forks/route.ts",
      "apps/web/app/api/exhibitions/route.ts",
      "apps/web/lib/account-revision-write-boundary.ts",
    ]
    const forbidden = [
      "competitiveServer",
      "getCurrentCompetitiveUser",
      "@cowards/persistence",
      "@cowards/service",
    ]

    for (const file of selectedFiles) {
      const source = readFileSync(file, "utf8")
      for (const token of forbidden) {
        expect(source, `${file} must not contain ${token}`).not.toContain(token)
      }
    }
  })
})
