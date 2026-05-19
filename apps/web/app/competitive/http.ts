import {
  COMPETITIVE_SESSION_DAYS,
  CompetitiveInputError,
  SESSION_COOKIE_NAME,
} from "./server.js"

export const sessionCookie = (sessionId: string): string => {
  const maxAge = COMPETITIVE_SESSION_DAYS * 24 * 60 * 60
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : ""
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(
    sessionId,
  )}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`
}

export const clearSessionCookie = (): string =>
  `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`

export const competitiveErrorResponse = (error: unknown): Response => {
  if (error instanceof CompetitiveInputError) {
    const headers =
      error.retryAfterSeconds === undefined
        ? undefined
        : { "Retry-After": String(error.retryAfterSeconds) }
    return Response.json(
      { error: error.message },
      headers === undefined
        ? { status: error.status }
        : { status: error.status, headers },
    )
  }
  return Response.json(
    { error: "Competitive service is unavailable." },
    { status: 503 },
  )
}
