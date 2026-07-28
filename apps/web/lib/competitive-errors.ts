import {
  assertCountedEntryEligibilityPublicLeakSafe,
  type CountedEntryEligibilityPublicCopy,
} from "@cowards/spec"

export class CompetitiveInputError extends Error {
  readonly status: number
  readonly retryAfterSeconds?: number | undefined
  readonly eligibility: CountedEntryEligibilityPublicCopy | undefined

  constructor(
    message: string,
    options: {
      status?: number
      retryAfterSeconds?: number
      eligibility?: CountedEntryEligibilityPublicCopy
    } = {},
  ) {
    super(message)
    this.name = "CompetitiveInputError"
    this.status = options.status ?? 400
    this.retryAfterSeconds = options.retryAfterSeconds
    this.eligibility = options.eligibility
    if (this.eligibility) {
      assertCountedEntryEligibilityPublicLeakSafe(this.eligibility)
    }
  }
}
