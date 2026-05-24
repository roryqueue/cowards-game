export async function GET(): Promise<Response> {
  if (
    process.env.COWARDS_GO_BACKEND_OWNER === "go" ||
    process.env.COWARDS_NO_TYPESCRIPT_BACKEND === "1"
  ) {
    const baseUrl = process.env.COWARDS_GO_BACKEND_URL
    if (!baseUrl) {
      return Response.json(
        { ok: false, service: "go-backend", error: "missing_go_backend_url" },
        { status: 503 },
      )
    }
    const response = await fetch(new URL("/health", baseUrl), {
      headers: { accept: "application/json" },
    })
    const body = (await response.json()) as unknown
    return Response.json(body, { status: response.status })
  }

  return Response.json({
    ok: true,
    service: "cowards-web",
    backendAuthority: "frontend-only",
  })
}
