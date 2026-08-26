import { describe, expect, it } from "vitest"
import { renderV138Plan26267ReplacementContract } from "./render-v1-38-plan-262-67-replacement-contract.js"
describe("Plan 262-67 replacement contract", () => it("is non-authorizing", () => expect(renderV138Plan26267ReplacementContract()).toMatchObject({ admitsExecution: false, canonicalAuthorizationWritten: false, canonicalSealWritten: false, routeStarted: false, admit03: { status: "blocked", freshAccepted: 0, requiredAccepted: 540 } })))
