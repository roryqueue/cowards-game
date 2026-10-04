---
phase: 265
scope: append-only provenance correction; no new retained verification
original_report_sha256: ef0d7b3debeecbd76e270eeae0dcca5f6cd431ab3c07f6449083b91c556ce272
producer_session: 91074
verifier_session: null
verifier_chunk_id: 61e48e
verifier_command_exit: 0
verifier_agent: /root/verify_265_15_successor_source
---

# Unique retained verification: provenance erratum

The consumed `265-15-PILOT-RETAINED-VERIFICATION-v1.md` remains byte-identical to the SHA-256 above. Its `verifier_session: 91074` incorrectly names the main pilot producer session. The independent verifier explicitly confirmed its command completed synchronously: chunk `61e48e`, exit 0, wall time 4.557891988 seconds, no session ID.

The exact command was invoked once: `sh scripts/run-v1-38-lean-experiment.sh verify-retained --request .strategy-lab/lean-pilot-request-20261003-v7.json`. No command was rerun to make this correction. This erratum corrects role metadata only; result/evidence/source roots, one charge, zero successes, cumulative 2,168,630ms, the failed feasibility disposition and the final stop are unchanged. It grants no empirical authority and no phase or milestone completion credit.
