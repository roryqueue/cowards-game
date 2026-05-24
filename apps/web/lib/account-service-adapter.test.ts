import { describe, expect, it } from "vitest"
import {
  assertGoAccountForksCanReadBack,
  isGoAccountForksSelected,
} from "./account-service-adapter.js"

describe("account service adapter ownership gates", () => {
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
})
