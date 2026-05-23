---
status: complete
phase: 077
key_files:
  created:
    - apps/web/lib/public-go-read-client.ts
    - apps/web/lib/public-go-read-client.test.ts
    - apps/web/lib/public-service-adapter.test.ts
  modified:
    - apps/web/lib/public-service-adapter.ts
---

# Summary

Implemented a route-scoped switch contract and Go client for the public Strategy
read. The switch defaults to TypeScript, requires an explicit Go flag and URL
when selected, and fails closed without TypeScript fallback.
