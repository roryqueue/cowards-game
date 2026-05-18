## ISSUES FOUND

**Phase:** 10 - Runtime Isolation Hardening
**Plans checked:** 5
**Status:** BLOCKED
**Checked:** 2026-05-18

### Coverage Summary

| Requirement | Plans | Status |
| --- | --- | --- |
| ISO-01 | 10-01, 10-04, 10-05 | Covered |
| ISO-02 | 10-01, 10-04, 10-05 | Covered |
| ISO-03 | 10-01, 10-05 | Covered |
| ISO-04 | 10-02, 10-05 | Covered |
| ISO-05 | 10-01, 10-02, 10-03, 10-05 | Covered |
| ISO-06 | 10-03, 10-05 | Covered |
| ISO-07 | 10-02, 10-03, 10-04, 10-05 | Covered |

### Decision Coverage

| Decision | Plans | Status |
| --- | --- | --- |
| D-01 | 10-01, 10-02 | Covered |
| D-02 | 10-02, 10-05 | Covered |
| D-03 | 10-01, 10-04 | Covered |
| D-04 | 10-01, 10-04 | Covered |
| D-05 | 10-02 | Covered |
| D-06 | 10-02 | Covered |
| D-07 | 10-02 | Covered |
| D-08 | 10-03, 10-04 | Covered |
| D-09 | 10-02, 10-03, 10-04 | Covered |
| D-10 | 10-02, 10-03, 10-04, 10-05 | Covered |
| D-11 | 10-03 | Covered |
| D-12 | 10-02, 10-03 | Covered |

### Plan Summary

| Plan | Tasks | Files | Wave | Dependency Status | Automated Verify | Status |
| --- | ---: | ---: | ---: | --- | --- | --- |
| 10-01 | 3 | 7 | 1 | Valid | Present | Valid |
| 10-02 | 3 | 5 | 2 | Valid | Present | Valid |
| 10-03 | 3 | 7 | 3 | Valid | Present | Valid |
| 10-04 | 3 | 4 | 4 | Valid | Present | Valid |
| 10-05 | 3 | 2 | 5 | Valid | Present | Valid |

### Blockers

**1. [research_resolution] 10-RESEARCH.md has unresolved open questions**

- Severity: BLOCKER
- File: `.planning/phases/10-runtime-isolation-hardening/10-RESEARCH.md`
- Evidence: The file contains `## Open Questions` without `(RESOLVED)`, and questions 1-3 do not include inline `RESOLVED` markers.
- Affected questions:
  - "Should the opt-in subprocess adapter be exposed by env var, package API, or worker CLI option?"
  - "Can the subprocess harness run with Node `--permission` without creating brittle local/CI friction?"
  - "Should malformed IPC be retryable system failure or adapter system failure that fails the Match immediately?"
- Fix: Update the section to `## Open Questions (RESOLVED)` and mark each question with the selected resolution. The current plan appears to resolve them as worker env/config plus runtime package API, no mandatory Node permission dependency, and retryable typed system failures mapped to existing worker retry policy.

### Structured Issues

```yaml
issues:
  - plan: null
    dimension: research_resolution
    severity: blocker
    description: "10-RESEARCH.md has unresolved open questions; the section is not marked RESOLVED and individual questions lack RESOLVED markers."
    file: ".planning/phases/10-runtime-isolation-hardening/10-RESEARCH.md"
    unresolved_questions:
      - "Should the opt-in subprocess adapter be exposed by env var, package API, or worker CLI option?"
      - "Can the subprocess harness run with Node --permission without creating brittle local/CI friction?"
      - "Should malformed IPC be retryable system failure or adapter system failure that fails the Match immediately?"
    fix_hint: "Mark the Open Questions section resolved and record the selected decisions before executing plans."
```

### Dimension Results

| Dimension | Result | Notes |
| --- | --- | --- |
| Requirement Coverage | PASS | ISO-01 through ISO-07 appear in plan frontmatter and have concrete task coverage. |
| Task Completeness | PASS | Every task has files, action, verify, and done; all verify blocks include automated commands. |
| Dependency Correctness | PASS | Waves 1-5 are acyclic and dependencies point to earlier plans. |
| Key Links Planned | PASS | Runtime adapter, subprocess IPC, worker selection, failure propagation, and boundary audit links are planned. |
| Scope Sanity | PASS | Each plan has 3 tasks and no plan exceeds 7 listed files. |
| Verification Derivation | PASS | Must-have truths are user/developer-observable and backed by artifacts and key links. |
| Context Compliance | PASS | D-01 through D-12 are covered; deferred subprocess/container/WASM default is not planned. |
| Scope Reduction Detection | PASS | No task reduces locked decisions to static, placeholder, or future-only delivery. |
| Architectural Tier Compliance | PASS | Runtime execution stays in `packages/runtime-js` and `apps/worker`; web/API receives only boundary audit coverage. |
| Nyquist Compliance | PASS | `10-VALIDATION.md` exists; every task has automated verification; no watch-mode commands found. |
| Cross-Plan Data Contracts | PASS | System-failure taxonomy flows from subprocess adapter to runtime tests to worker propagation without conflicting transforms. |
| AGENTS.md Compliance | PASS | Plans avoid Node `vm`, preserve worker/runtime execution boundaries, keep engine unchanged, and add required hostile/runtime tests. |
| Research Resolution | FAIL | Open questions remain unresolved in `10-RESEARCH.md`. |
| Pattern Compliance | PASS | Plans load `10-PATTERNS.md` and follow the mapped runtime, worker, spec, and test analogs. |

### Recommendation

Do not execute Phase 10 yet. Resolve the three research questions in `10-RESEARCH.md`, then re-run plan check. No code-plan revision appears necessary unless the selected research resolutions differ from the current plan assumptions.
