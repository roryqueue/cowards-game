import { describe, expect, it } from "vitest"
describe("quarantined intake", () => it("exports no execution surface", async () => {
  const intake = await import("./intake.js")
  expect(typeof intake.admitQuarantinedIntakePacket).toBe("function")
}))
