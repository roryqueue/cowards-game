import { describe, expect, it } from "vitest"
import { LAB_ADMITTED_ROOTS } from "../contracts.js"
import { createFactoryAttemptStart, createFactoryAttemptTerminal, validateFactoryAttemptLedger } from "./ledger.js"

const r = `sha256:${"a".repeat(64)}` as const
const start = () => createFactoryAttemptStart({ taskRoot: r, budgetRoot: r, candidateRoot: r, authoringMechanism: "automated-oracle", inputRoot: r, resourceAccountingRoot: r, retryParentRoot: null })

describe("charged factory attempt ledger", () => {
  it("charges before work and retains every terminal disposition as unscored private evidence", () => {
    const charged = start()
    for (const disposition of ["accepted", "rejected", "invalid", "duplicate", "legal_but_weak", "retried", "unresolved", "player_violation", "system_failure"] as const) {
      const terminal = createFactoryAttemptTerminal({ startRoot: charged.root, disposition, outputRoot: disposition === "system_failure" ? null : r, validationRoot: r, duplicateEvidenceRoot: r, finalEvidenceRoot: r })
      expect(validateFactoryAttemptLedger(charged, terminal).disposition).toBe(disposition)
      expect(terminal.privacy).toBe("private_offline")
    }
  })

  it("rejects uncharged, mutable, malformed, or semantically incomparable terminal evidence", () => {
    const charged = start()
    const terminal = createFactoryAttemptTerminal({ startRoot: charged.root, disposition: "system_failure", outputRoot: null, validationRoot: r, duplicateEvidenceRoot: r, finalEvidenceRoot: r })
    expect(() => validateFactoryAttemptLedger({ ...charged, budgetRoot: LAB_ADMITTED_ROOTS.currentStartRoot }, terminal)).toThrow()
    expect(() => validateFactoryAttemptLedger(charged, { ...terminal, outputRoot: r })).toThrow()
    expect(() => createFactoryAttemptStart({ taskRoot: r, budgetRoot: r, candidateRoot: r, authoringMechanism: "mutable-latest" as never, inputRoot: r, resourceAccountingRoot: r, retryParentRoot: null })).toThrow()
  })
})
