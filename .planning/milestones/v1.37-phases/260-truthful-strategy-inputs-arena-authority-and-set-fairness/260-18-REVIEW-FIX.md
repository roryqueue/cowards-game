# Phase 260 Plan 18 Review Fix — Workshop Default Ownership

Plan 18 correctly staged and pinned exact v1.19 Workshop examples, but its statement that Plan 14 must rewrite `current-workshop-contract-generated.ts` is superseded.

Plan 29 will make that module a closed two-pin registry whose default is resolved through the compact semantic authority and exact database head. Live current remains the exact Phase-259 Workshop selection during the refactor. The final activation changes only the compact selector and database head; it must not rewrite Workshop candidate pins or example bytes.

This correction is behavior-preserving and retains every Plan-18 candidate, package-free, privacy, and hostile-runtime guarantee.
