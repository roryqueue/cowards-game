import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => {
  const goClient = {
    getAuthSession: vi.fn(),
    createSession: vi.fn(),
    createAccount: vi.fn(),
    revokeSession: vi.fn(),
    listStrategyRevisions: vi.fn(),
    createStrategyRevision: vi.fn(),
    getStrategyRevisionSource: vi.fn(),
    forkStarterStrategy: vi.fn(),
    forkAdvancedStrategy: vi.fn(),
    createMatchSet: vi.fn(),
  }
  return {
    goClient,
    getAccountSessionId: vi.fn(async () => "session:go-selected"),
    requireSelectedGoBackendClient: vi.fn(() => goClient),
    isGoAccountForksSelected: vi.fn(() => true),
    assertGoAccountForksCanReadBack: vi.fn(),
    getCurrentAccountReadUser: vi.fn(),
    listAccountReadRevisions: vi.fn(),
  }
})

vi.mock("../apps/web/lib/account-service-adapter.js", () => ({
  getAccountSessionId: mocks.getAccountSessionId,
  requireSelectedGoBackendClient: mocks.requireSelectedGoBackendClient,
  isGoAccountForksSelected: mocks.isGoAccountForksSelected,
  assertGoAccountForksCanReadBack: mocks.assertGoAccountForksCanReadBack,
}))

vi.mock("../apps/web/lib/account-service-boundary.js", () => ({
  getCurrentAccountReadUser: mocks.getCurrentAccountReadUser,
  listAccountReadRevisions: mocks.listAccountReadRevisions,
}))

import { POST as advancedForkPost } from "../apps/web/app/api/account/advanced-forks/route.js"
import { GET as sourceGet } from "../apps/web/app/api/account/revisions/[revisionId]/source/route.js"
import { POST as saveRevisionPost } from "../apps/web/app/api/account/revisions/save/route.js"
import { POST as starterForkPost } from "../apps/web/app/api/account/starter-forks/route.js"
import { POST as signInPost } from "../apps/web/app/api/auth/sign-in/route.js"
import { POST as signOutPost } from "../apps/web/app/api/auth/sign-out/route.js"
import { POST as signUpPost } from "../apps/web/app/api/auth/sign-up/route.js"
import { POST as exhibitionPost } from "../apps/web/app/api/exhibitions/route.js"

const jsonRequest = (body: unknown): Request =>
  new Request("http://localhost/api/test", {
    method: "POST",
    body: JSON.stringify(body),
  })

const authSessionBody = {
  apiVersion: "service-api-v1.8",
  kind: "authSession",
  user: {
    userId: "user:local",
    handle: "local",
    displayName: "Local Player",
  },
}

const revisionSummary = {
  id: "revision:created",
  strategyId: "strategy:created",
  label: "Created revision",
  sourceHash: "sha256:created",
  sourceBytes: 128,
  valid: true,
  runtimeSemantics: {
    language: "javascript",
    runtimeAdapter: "runtime-js-worker-thread",
    countedPlayEligible: true,
  },
  engineCompatibility: {
    rules: "cowards-rules-v1.4",
    chronicle: "chronicle-v1.4",
  },
  createdAt: "2026-05-24T00:00:00.000Z",
}

describe("Phase 105 selected Go API route behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireSelectedGoBackendClient.mockReturnValue(mocks.goClient)
    mocks.getAccountSessionId.mockResolvedValue("session:go-selected")
    mocks.isGoAccountForksSelected.mockReturnValue(true)
    mocks.listAccountReadRevisions.mockResolvedValue([revisionSummary])
  })

  it("forwards Go auth cookies for sign-in/sign-up and clears through Go sign-out", async () => {
    mocks.goClient.createSession.mockResolvedValue({
      body: authSessionBody,
      setCookie: "cowards_session=session%3Ago; Path=/; HttpOnly; SameSite=Lax",
    })
    mocks.goClient.createAccount.mockResolvedValue({
      body: authSessionBody,
      setCookie:
        "cowards_session=session%3Anew; Path=/; HttpOnly; SameSite=Lax",
    })
    mocks.goClient.revokeSession.mockResolvedValue(undefined)

    const signIn = await signInPost(
      jsonRequest({ username: "local", password: "secret" }),
    )
    const signUp = await signUpPost(
      jsonRequest({
        username: "new",
        password: "secret",
        handle: "new",
        displayName: "New Player",
      }),
    )
    const signOut = await signOutPost()

    await expect(signIn.json()).resolves.toEqual({
      user: authSessionBody.user,
    })
    expect(signIn.headers.get("set-cookie")).toContain(
      "cowards_session=session%3Ago",
    )
    expect(signUp.status).toBe(201)
    expect(signUp.headers.get("set-cookie")).toContain(
      "cowards_session=session%3Anew",
    )
    await expect(signOut.json()).resolves.toEqual({ ok: true })
    expect(signOut.headers.get("set-cookie")).toContain("Max-Age=0")
    expect(mocks.goClient.revokeSession).toHaveBeenCalledWith(
      "session:go-selected",
    )
  })

  it("returns owner Strategy source as private text from the selected Go client", async () => {
    mocks.goClient.getStrategyRevisionSource.mockResolvedValue({
      apiVersion: "service-api-v1.8",
      kind: "strategyRevisionSource",
      strategyRevisionId: "revision:source",
      source: "export default function strategy() {}",
      sourceHash: "sha256:source",
      sourceBytes: 37,
    })

    const response = await sourceGet(new Request("http://localhost"), {
      params: Promise.resolve({
        revisionId: encodeURIComponent("revision:source"),
      }),
    })

    expect(response.status).toBe(200)
    expect(response.headers.get("content-type")).toBe(
      "text/plain; charset=utf-8",
    )
    expect(response.headers.get("cache-control")).toBe("private, no-store")
    await expect(response.text()).resolves.toBe(
      "export default function strategy() {}",
    )
    expect(mocks.goClient.getStrategyRevisionSource).toHaveBeenCalledWith(
      "session:go-selected",
      "revision:source",
    )
  })

  it("uses Go create/fork results only after the created revision is listable", async () => {
    mocks.goClient.createStrategyRevision.mockResolvedValue({
      apiVersion: "service-api-v1.8",
      kind: "strategyRevisionSubmission",
      strategyRevisionId: "revision:created",
    })
    mocks.goClient.forkStarterStrategy.mockResolvedValue({
      apiVersion: "service-api-v1.8",
      kind: "strategyRevisionSubmission",
      strategyRevisionId: "revision:created",
    })
    mocks.goClient.forkAdvancedStrategy.mockResolvedValue({
      apiVersion: "service-api-v1.8",
      kind: "strategyRevisionSubmission",
      strategyRevisionId: "revision:created",
    })

    const save = await saveRevisionPost(
      jsonRequest({ source: "export default {}", label: "Saved" }),
    )
    const starter = await starterForkPost(
      jsonRequest({ starterId: "starter:guard" }),
    )
    const advanced = await advancedForkPost(
      jsonRequest({ advancedId: "advanced:guard" }),
    )

    for (const response of [save, starter, advanced]) {
      expect(response.status).toBe(201)
      await expect(response.json()).resolves.toMatchObject({
        revision: { id: "revision:created" },
      })
    }
    expect(mocks.goClient.createStrategyRevision).toHaveBeenCalledWith(
      "session:go-selected",
      expect.objectContaining({ source: "export default {}" }),
    )
    expect(mocks.goClient.forkStarterStrategy).toHaveBeenCalledWith(
      "session:go-selected",
      "starter:guard",
    )
    expect(mocks.goClient.forkAdvancedStrategy).toHaveBeenCalledWith(
      "session:go-selected",
      "advanced:guard",
    )
    expect(mocks.assertGoAccountForksCanReadBack).toHaveBeenCalledTimes(2)
    expect(mocks.listAccountReadRevisions).toHaveBeenCalledTimes(3)
  })

  it("creates selected exhibition MatchSets through Go and filters invalid revision ids", async () => {
    mocks.goClient.createMatchSet.mockResolvedValue({
      apiVersion: "service-api-v1.8",
      kind: "createMatchSet",
      matchSetId: "match-set:go-created",
      matchCount: 2,
    })

    const response = await exhibitionPost(
      jsonRequest({
        presetId: "preset:smoke",
        revisionIds: ["revision:one", 42, "revision:two"],
      }),
    )

    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toEqual({
      matchSetId: "match-set:go-created",
      status: "queued",
      matchCount: 2,
    })
    expect(mocks.goClient.createMatchSet).toHaveBeenCalledWith(
      "session:go-selected",
      {
        presetId: "preset:smoke",
        revisionIds: ["revision:one", "revision:two"],
      },
    )
  })
})
