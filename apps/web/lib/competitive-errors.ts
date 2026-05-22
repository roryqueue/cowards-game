export class CompetitiveInputError extends Error {
  readonly status: number
  readonly retryAfterSeconds?: number | undefined

  constructor(
    message: string,
    options: { status?: number; retryAfterSeconds?: number } = {},
  ) {
    super(message)
    this.name = "CompetitiveInputError"
    this.status = options.status ?? 400
    this.retryAfterSeconds = options.retryAfterSeconds
  }
}
