import { randomUUID } from "node:crypto"
import { Buffer } from "node:buffer"
import { expect, test, type Page } from "@playwright/test"
import { createDatabasePool } from "@cowards/persistence/db"
import { hashCanonicalIdentity } from "@cowards/spec"

const databaseUrl = process.env.DATABASE_URL
const goBackendUrl = process.env.COWARDS_GO_BACKEND_URL
const sessionCookieName = "cowards_session"

const requiredTopology = (): void => {
  expect(databaseUrl, "DATABASE_URL is required").toBeTruthy()
  expect(goBackendUrl, "COWARDS_GO_BACKEND_URL is required").toBeTruthy()
}

const browserSession = async (page: Page, setCookie: string): Promise<void> => {
  const session = setCookie
    .split(/,(?=\s*[^;,\s]+=)/u)
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${sessionCookieName}=`))
  expect(session, "sign-up must set the account session").toBeTruthy()
  const value = session!.split(";")[0]!.slice(`${sessionCookieName}=`.length)
  await page.context().addCookies([
    {
      name: sessionCookieName,
      value: decodeURIComponent(value),
      domain: "localhost",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    },
  ])
}

test("Workshop save preserves representable LF/no-final-newline source through Go and PostgreSQL", async ({
  page,
}) => {
  test.setTimeout(90_000)
  requiredTopology()
  const pool = createDatabasePool({ connectionString: databaseUrl! })
  const suffix = `${Date.now().toString(36)}-${randomUUID().slice(0, 8)}`
  const username = `v137_source_${suffix}`
  let userId: string | undefined

  try {
    const workshop = await page.request.get("/api/workshop")
    expect(workshop.status(), await workshop.text()).toBe(200)
    const workshopBody = (await workshop.json()) as {
      templateSource: string
      templates: Array<{ source: string }>
    }
    const source =
      workshopBody.templates[0]?.source ?? workshopBody.templateSource
    expect(source.endsWith("\n")).toBe(false)
    expect(source).not.toContain("\r")

    const signup = await page.request.post("/api/auth/sign-up", {
      data: {
        username,
        handle: `v137-${suffix}`,
        displayName: "v1.37 Source Identity Proof",
        password: `v1.37-source-${suffix}`,
      },
    })
    expect(signup.status(), await signup.text()).toBe(201)
    const signupBody = (await signup.json()) as { user: { id: string } }
    userId = signupBody.user.id
    await browserSession(page, signup.headers()["set-cookie"] ?? "")

    await page.goto("/workshop")
    await expect(
      page.getByRole("heading", { name: "Strategy Workshop" }),
    ).toBeVisible({ timeout: 15_000 })
    await page
      .getByLabel("Revision label")
      .fill(`v1.37 source identity ${suffix}`, { timeout: 10_000 })

    await page
      .getByRole("button", { name: "Validate source" })
      .click({ timeout: 10_000 })
    await expect(page.getByText("Valid draft").first()).toBeVisible({
      timeout: 30_000,
    })
    const saveRequestPromise = page.waitForRequest(
      (request) =>
        request.method() === "POST" &&
        new URL(request.url()).pathname === "/api/account/revisions/save",
      { timeout: 30_000 },
    )
    const saveResponsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === "POST" &&
        new URL(response.url()).pathname === "/api/account/revisions/save",
      { timeout: 30_000 },
    )
    await page
      .getByRole("button", { name: "Save to account" })
      .click({ timeout: 10_000 })
    const saveRequest = await saveRequestPromise
    const saveResponse = await saveResponsePromise
    expect((saveRequest.postDataJSON() as { source: string }).source).toBe(
      source,
    )
    expect(saveResponse.status(), await saveResponse.text()).toBe(201)
    await expect(page.getByText("Saved to competitive account")).toBeVisible({
      timeout: 30_000,
    })

    const revision = await pool.query<{
      id: string
      source: string
      source_hex: string
      source_identity_version: string
      original_source_hash: string
      original_source_bytes: number
      normalized_source_hash: string
      normalized_source_bytes: number
      source_normalization_policy: string
      source_line_endings: {
        kind: string
        lf: number
        crlf: number
        cr: number
      }
      source_has_final_newline: boolean
    }>(
      `select sr.id, sr.source, encode(convert_to(sr.source, 'UTF8'), 'hex') source_hex,
              sr.source_identity_version, sr.original_source_hash,
              sr.original_source_bytes, sr.normalized_source_hash,
              sr.normalized_source_bytes, sr.source_normalization_policy,
              sr.source_line_endings, sr.source_has_final_newline
         from strategy_revisions sr
         join strategies s on s.id = sr.strategy_id
        where s.owner_user_id = $1
        order by sr.created_at desc, sr.id desc
        limit 1`,
      [userId],
    )
    expect(revision.rowCount).toBe(1)
    const stored = revision.rows[0]!
    expect(stored).toMatchObject({
      source,
      source_hex: Buffer.from(source, "utf8").toString("hex"),
      source_identity_version: "strategy-source-identity-v2",
      original_source_bytes: Buffer.byteLength(source),
      normalized_source_bytes: Buffer.byteLength(source),
      source_normalization_policy: "source-line-endings-lf-v1.17",
      source_line_endings: { kind: "lf", crlf: 0, cr: 0 },
      source_has_final_newline: false,
    })
    expect(stored.original_source_hash).toBe(
      hashCanonicalIdentity("originalSource", [Buffer.from(source)]),
    )
    expect(stored.normalized_source_hash).toBe(
      hashCanonicalIdentity("normalizedSource", [Buffer.from(source)]),
    )

    const ownerSource = await page.request.get(
      `/api/account/revisions/${encodeURIComponent(stored.id)}/source`,
    )
    expect(ownerSource.status(), await ownerSource.text()).toBe(200)
    expect(ownerSource.headers()["cache-control"]).toBe("private, no-store")
    expect(ownerSource.headers()["content-type"]).toContain("text/plain")
    expect(await ownerSource.text()).toBe(source)

    const mixedSource = `${source}\r\n// phase258-crlf\n// phase258-lf\r// phase258-cr`
    const normalizedMixed = mixedSource.replace(/\r\n?/gu, "\n")
    const mixedSave = await page.request.post("/api/account/revisions/save", {
      data: {
        source: mixedSource,
        sourceFormat: "typescript",
        label: `v1.37 mixed source identity ${suffix}`,
      },
    })
    expect(mixedSave.status(), await mixedSave.text()).toBe(201)
    const mixedBody = (await mixedSave.json()) as { revision: { id: string } }
    const mixed = await pool.query<{
      source: string
      source_hex: string
      original_source_hash: string
      original_source_bytes: number
      normalized_source_hash: string
      normalized_source_bytes: number
      source_line_endings: {
        kind: string
        lf: number
        crlf: number
        cr: number
      }
      source_has_final_newline: boolean
    }>(
      `select source, encode(convert_to(source, 'UTF8'), 'hex') source_hex,
              original_source_hash, original_source_bytes,
              normalized_source_hash, normalized_source_bytes,
              source_line_endings, source_has_final_newline
         from strategy_revisions
        where id = $1`,
      [mixedBody.revision.id],
    )
    expect(mixed.rowCount).toBe(1)
    expect(mixed.rows[0]).toMatchObject({
      source: mixedSource,
      source_hex: Buffer.from(mixedSource).toString("hex"),
      original_source_hash: hashCanonicalIdentity("originalSource", [
        Buffer.from(mixedSource),
      ]),
      original_source_bytes: Buffer.byteLength(mixedSource),
      normalized_source_hash: hashCanonicalIdentity("normalizedSource", [
        Buffer.from(normalizedMixed),
      ]),
      normalized_source_bytes: Buffer.byteLength(normalizedMixed),
      source_line_endings: {
        kind: "mixed",
        lf: (source.match(/\n/gu) ?? []).length + 1,
        crlf: 1,
        cr: 1,
      },
      source_has_final_newline: false,
    })
    const mixedOwnerSource = await page.request.get(
      `/api/account/revisions/${encodeURIComponent(mixedBody.revision.id)}/source`,
    )
    expect(mixedOwnerSource.status(), await mixedOwnerSource.text()).toBe(200)
    expect(await mixedOwnerSource.text()).toBe(mixedSource)
  } finally {
    if (userId) {
      await pool.query(
        "delete from strategy_revisions where strategy_id in (select id from strategies where owner_user_id = $1)",
        [userId],
      )
      await pool.query("delete from strategies where owner_user_id = $1", [
        userId,
      ])
      await pool.query("delete from user_sessions where user_id = $1", [userId])
      await pool.query("delete from users where id = $1", [userId])
    }
    await pool.end()
  }
})
