# v1.13 Pitfalls Research: Go Backend Ownership Cutover

**Milestone:** v1.13 Go Backend Ownership Cutover
**Researched:** 2026-05-23

## Major Pitfalls

1. **Fixture confidence mistaken for production ownership**
   - Prevention: every promoted route needs live DB-backed Go evidence and TypeScript-service parity comparison.

2. **Silent TypeScript fallback hides cutover failure**
   - Prevention: Go-selected routes fail closed; rollback is explicit owner/config change or code revert.

3. **Private source/session data leaks through diagnostics**
   - Prevention: scan raw Go responses, web HTML, topology JSON, monitor output, logs, and artifacts for forbidden keys and values.

4. **Mutation cutover crosses Strategy execution boundaries**
   - Prevention: Strategy Revision save/fork may persist source and metadata, but no Strategy code executes in web/API or Go.

5. **Session mutation diverges from TypeScript auth semantics**
   - Prevention: prove password hashing, session token hashing, cookie behavior, revoke behavior, unauthorized behavior, and public-safe error parity before making Go primary.

6. **Exhibition creation accidentally becomes orchestration ownership**
   - Prevention: Go may create MatchSet/job records only if TypeScript worker ownership of claiming/completion/execution remains explicit and tested.

7. **Boundary monitors still assume v1.12 single-route ownership**
   - Prevention: update route ownership manifests, topology checks, and monitors before broad cutover evidence is accepted.

8. **Report-only boundary debt masks incomplete ownership**
   - Prevention: keep `strict_offenses=0`, prevent report-only count growth above 29, and classify every remaining offense after the cutover.
