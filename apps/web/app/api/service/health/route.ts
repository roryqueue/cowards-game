export async function GET(): Promise<Response> {
  if (
    process.env.COWARDS_GO_BACKEND_OWNER === "go" ||
    process.env.COWARDS_NO_TYPESCRIPT_BACKEND === "1"
  ) {
    const baseUrl = process.env.COWARDS_GO_BACKEND_URL
    if (!baseUrl) {
      return Response.json(
        {
          ok: false,
          service: "go-backend",
          error: "missing_go_backend_url",
          failureClass: "go_backend_unconfigured",
          publicSafe: true,
        },
        { status: 503 },
      )
    }
    try {
      const response = await fetch(new URL("/health", baseUrl), {
        headers: { accept: "application/json" },
      })
      let body: unknown
      try {
        body = (await response.json()) as unknown
      } catch {
        return Response.json(
          {
            ok: false,
            service: "go-backend",
            error: "go_backend_non_json_health",
            failureClass: "go_backend_non_json",
            publicSafe: true,
          },
          { status: 503 },
        )
      }
      return Response.json(body, { status: response.status })
    } catch {
      return Response.json(
        {
          ok: false,
          service: "go-backend",
          error: "go_backend_unavailable",
          failureClass: "go_backend_unavailable",
          publicSafe: true,
        },
        { status: 503 },
      )
    }
  }

  return Response.json({
    ok: true,
    service: "cowards-web",
    backendAuthority: "frontend-only",
  })
}
