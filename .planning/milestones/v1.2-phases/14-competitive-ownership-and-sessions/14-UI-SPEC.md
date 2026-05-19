# Phase 14 UI Spec: Competitive Ownership and Sessions

**Status:** Ready

## Screens

- Sign up: username, handle, optional display name, password, alpha no-recovery notice.
- Sign in: username, password.
- Account status/navigation affordance: signed-in handle and sign out action.
- Workshop/account save affordance: explicit save-to-account action for signed-in users.

## Design Contract

- Keep auth surfaces compact and utilitarian.
- Do not create a marketing or profile page.
- Public identity should emphasize `@handle`; display name is secondary.
- Error messages should be specific but not reveal sensitive auth state beyond normal alpha UX.

## States

- Anonymous: can draft/test locally, sees sign-in prompt for competitive/account save.
- Signed in: can save account-owned revisions and access competition entry.
- Auth errors: duplicate username/handle, invalid password, expired session.

