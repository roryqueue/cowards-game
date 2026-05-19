import { Buffer } from "node:buffer"
import {
  createHash,
  randomBytes,
  randomUUID,
  scrypt,
  timingSafeEqual,
  type ScryptOptions,
} from "node:crypto"
import type { UserId } from "@cowards/spec"
import type { Pool } from "pg"

export const SESSION_DURATION_DAYS = 30
export const MIN_PASSWORD_LENGTH = 12

const deriveScryptKey = (
  password: string,
  salt: string,
  keyLength: number,
  options: ScryptOptions,
): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    scrypt(password, salt, keyLength, options, (error, key) => {
      if (error) {
        reject(error)
        return
      }
      resolve(key)
    })
  })

export class AuthInputError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "AuthInputError"
  }
}

export interface PublicUserAccount {
  id: UserId
  username: string
  handle: string
  displayName: string
  createdAt: string
}

export interface SessionRecord {
  id: string
  userId: UserId
  expiresAt: string
  revokedAt?: string | undefined
  createdAt: string
}

export interface AuthenticatedSession {
  session: SessionRecord
  user: PublicUserAccount
}

export const normalizeUsername = (username: string): string =>
  username.trim().toLowerCase()

export const normalizeHandle = (handle: string): string =>
  handle.trim().replace(/^@/, "").toLowerCase()

export const assertValidUsername = (username: string): void => {
  if (!/^[a-z0-9][a-z0-9_-]{2,31}$/.test(username)) {
    throw new AuthInputError(
      "Username must be 3-32 lowercase letters, numbers, underscores, or hyphens.",
    )
  }
}

export const assertValidHandle = (handle: string): void => {
  if (!/^[a-z0-9][a-z0-9_-]{2,31}$/.test(handle)) {
    throw new AuthInputError(
      "Handle must be 3-32 lowercase letters, numbers, underscores, or hyphens.",
    )
  }
}

export const assertPasswordMeetsPolicy = (password: string): void => {
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new AuthInputError(
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
    )
  }
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    throw new AuthInputError("Password must include letters and numbers.")
  }
}

export const createPasswordHash = async (password: string): Promise<string> => {
  assertPasswordMeetsPolicy(password)
  const salt = randomBytes(16).toString("base64url")
  const key = await deriveScryptKey(password, salt, 64, {
    N: 16384,
    r: 8,
    p: 1,
    maxmem: 64 * 1024 * 1024,
  })
  return `scrypt$16384$8$1$${salt}$${key.toString("base64url")}`
}

export const verifyPasswordHash = async (
  password: string,
  encodedHash: string,
): Promise<boolean> => {
  const [scheme, nRaw, rRaw, pRaw, salt, expectedRaw] = encodedHash.split("$")
  if (scheme !== "scrypt" || !nRaw || !rRaw || !pRaw || !salt || !expectedRaw) {
    return false
  }

  const expected = Buffer.from(expectedRaw, "base64url")
  const actual = await deriveScryptKey(password, salt, expected.length, {
    N: Number(nRaw),
    r: Number(rRaw),
    p: Number(pRaw),
    maxmem: 64 * 1024 * 1024,
  })

  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

export const createSessionToken = (): string =>
  randomBytes(32).toString("base64url")

export const hashSessionToken = (token: string): string =>
  createHash("sha256").update(token, "utf8").digest("hex")

export const sessionExpiresAt = (
  now: Date = new Date(),
  durationDays = SESSION_DURATION_DAYS,
): Date => new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000)

const mapPublicUser = (row: {
  id: UserId
  username: string
  handle: string
  display_name: string
  created_at: Date
}): PublicUserAccount => ({
  id: row.id,
  username: row.username,
  handle: row.handle,
  displayName: row.display_name,
  createdAt: row.created_at.toISOString(),
})

const mapSession = (row: {
  id: string
  user_id: UserId
  expires_at: Date
  revoked_at: Date | null
  created_at: Date
}): SessionRecord => ({
  id: row.id,
  userId: row.user_id,
  expiresAt: row.expires_at.toISOString(),
  ...(row.revoked_at ? { revokedAt: row.revoked_at.toISOString() } : {}),
  createdAt: row.created_at.toISOString(),
})

export const createAccount = async (
  pool: Pool,
  input: {
    username: string
    password: string
    handle: string
    displayName: string
    userId?: UserId | undefined
  },
): Promise<PublicUserAccount> => {
  const username = normalizeUsername(input.username)
  const handle = normalizeHandle(input.handle)
  assertValidUsername(username)
  assertValidHandle(handle)
  if (input.displayName.trim().length === 0) {
    throw new AuthInputError("Display name is required.")
  }

  const passwordHash = await createPasswordHash(input.password)
  const id = input.userId ?? (`user:${randomUUID()}` as UserId)
  const result = await pool.query<{
    id: UserId
    username: string
    handle: string
    display_name: string
    created_at: Date
  }>(
    `
      insert into users (id, username, handle, display_name, password_hash)
      values ($1, $2, $3, $4, $5)
      returning id, username, handle, display_name, created_at
    `,
    [id, username, handle, input.displayName.trim(), passwordHash],
  )
  return mapPublicUser(result.rows[0]!)
}

export const authenticateAccount = async (
  pool: Pool,
  input: {
    username: string
    password: string
  },
): Promise<PublicUserAccount | null> => {
  const username = normalizeUsername(input.username)
  const result = await pool.query<{
    id: UserId
    username: string
    handle: string
    display_name: string
    password_hash: string
    created_at: Date
  }>(
    `
      select id, username, handle, display_name, password_hash, created_at
      from users
      where lower(username) = $1
        and password_hash is not null
    `,
    [username],
  )
  const row = result.rows[0]
  if (!row || !(await verifyPasswordHash(input.password, row.password_hash))) {
    return null
  }
  return mapPublicUser(row)
}

export const createSession = async (
  pool: Pool,
  input: {
    userId: UserId
    now?: Date | undefined
    metadata?: unknown
  },
): Promise<{ token: string; session: SessionRecord }> => {
  const token = createSessionToken()
  const expiresAt = sessionExpiresAt(input.now)
  const result = await pool.query<{
    id: string
    user_id: UserId
    expires_at: Date
    revoked_at: Date | null
    created_at: Date
  }>(
    `
      insert into user_sessions (id, user_id, token_hash, expires_at, metadata)
      values ($1, $2, $3, $4, $5)
      returning id, user_id, expires_at, revoked_at, created_at
    `,
    [
      `session:${randomUUID()}`,
      input.userId,
      hashSessionToken(token),
      expiresAt,
      input.metadata ?? {},
    ],
  )
  return { token, session: mapSession(result.rows[0]!) }
}

export const getSession = async (
  pool: Pool,
  token: string,
  now: Date = new Date(),
): Promise<AuthenticatedSession | null> => {
  const result = await pool.query<{
    session_id: string
    user_id: UserId
    expires_at: Date
    revoked_at: Date | null
    session_created_at: Date
    username: string
    handle: string
    display_name: string
    user_created_at: Date
  }>(
    `
      select
        s.id as session_id,
        s.user_id,
        s.expires_at,
        s.revoked_at,
        s.created_at as session_created_at,
        u.username,
        u.handle,
        u.display_name,
        u.created_at as user_created_at
      from user_sessions s
      join users u on u.id = s.user_id
      where s.token_hash = $1
        and s.revoked_at is null
        and s.expires_at > $2
    `,
    [hashSessionToken(token), now],
  )
  const row = result.rows[0]
  if (!row) {
    return null
  }
  await pool.query("update user_sessions set last_seen_at = $1 where id = $2", [
    now,
    row.session_id,
  ])
  return {
    session: mapSession({
      id: row.session_id,
      user_id: row.user_id,
      expires_at: row.expires_at,
      revoked_at: row.revoked_at,
      created_at: row.session_created_at,
    }),
    user: mapPublicUser({
      id: row.user_id,
      username: row.username,
      handle: row.handle,
      display_name: row.display_name,
      created_at: row.user_created_at,
    }),
  }
}

export const revokeSession = async (
  pool: Pool,
  token: string,
  now: Date = new Date(),
): Promise<void> => {
  await pool.query(
    `
      update user_sessions
      set revoked_at = coalesce(revoked_at, $1)
      where token_hash = $2
    `,
    [now, hashSessionToken(token)],
  )
}
