# Phase 265 prospective private host-receipt decision

Status: proposed, awaiting human decision; NOT approved or applied.
2026-10-02. Existing Plan265-07 supplement, not another numbered plan or route.

Later decision2026-10-02: human answered “approved” to the five-second private
host response allowance with one-second guest execution unchanged. See
265-PROSPECTIVE-HOST-RECEIPT-APPROVAL-20261002.md. The original proposal/status
below is history; implementation/source review/gates remain required.

## Evidence and smallest proposed change

V11 is closed process-invalid. Its unique retained reader72861 returned
issued=false, requirementsComplete=false with allocation69b5cd84/headf572bd4f.
Four charged terminal records were observed: three successes and one system
failure. The failure's finite private diagnostic is stream_exchange/wait_timeout
in soldierBrain ordinal172. No guest-timeout cause is proven.

Read-only source diagnosis shows the host response wait starts before the
broker's equal1000ms deadline. The host can therefore abandon the exchange
before the broker finishes enforcing the guest limit and returning a receipt.
Increasing only the enclosing Match lifetime cannot fix this deadline coupling.

Recommend authorizing a prospective private host response-receipt deadline of
exactly5000ms, separate from the unchanged1000ms guest execution deadline.
This grants time for protocol response delivery and supervision; it does not
grant the Strategy five seconds of execution. Keep the approved600000ms
per-Match limit and every other setup/cleanup, overall-run, CPU, memory,
invocation, Match, attempt, accounting, retention, capacity, gameplay, privacy,
holdout and formation bound unchanged. This is a bounded proposal, not a
prediction of league completion or evidence that5000ms will suffice.

## Implementation after approval only

Use the existing GSD Plan07 research/checked supplement/execute/review-fix/
validate/verify cycle. Audit both host wait and broker cancellation/receipt
paths; preserve the1000ms guest enforcement and distinguish a trustworthy
guest-timeout result from an ambiguous transport/system failure. A host wait
failure must not become a Strategy failure by assumption. Add injected tests
for receipt arriving after1000ms but before5000ms, exact host ceiling, unchanged
guest ceiling, ambiguous failure, cleanup and legacy/version isolation.

Bind the new bound to a distinct prospective private policy and independently
reviewed fixed source. Never alter historical policies/artifacts or public/
production/default paths. No new live work until applicable source gates pass,
fresh immutable allocation is committed, new private store is checked, and
fresh passing same-process capacity exists. Standing same-scope route approval
then applies; no repeat route literal. V11 is never resumed/retried/recredited.

The league still must complete and freeze under current rules before formation.
Private holdout stays unopened; no public, counted or production authority.
