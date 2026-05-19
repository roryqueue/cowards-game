# Phase 16 UI Spec: Exhibition Queue and Entry

**Status:** Ready

## Screens

- Create exhibition page: preset selector, owned revision multi-select, create button.
- Status/result page loading state: accepted, queued, running, complete, degraded, failed.

## Design Contract

- Operational tool, not marketing page.
- Preserve dense scan-friendly controls.
- Revision rows should show label, short hash, validity, and source size.
- The 2-8 selection rule should be enforced inline before submit.

## States

- Anonymous: prompt to sign in before creating exhibitions.
- Signed in with no account revisions: prompt to save a revision to account.
- Invalid selection: explain count/duplicate/ownership/compatibility issue.
- Submitted: redirect to status/result page.

