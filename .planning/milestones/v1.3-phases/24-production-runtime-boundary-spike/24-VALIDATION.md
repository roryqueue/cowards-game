# Phase 24 Validation

## Automated

- `pnpm --filter @cowards/runtime-js test -- container-subprocess-adapter subprocess-adapter`
- `pnpm --filter @cowards/runtime-js test`
- `pnpm --filter @cowards/runtime-js typecheck`
- `pnpm --filter @cowards/worker typecheck`

## Coverage

Container launch arguments, Docker image validation, timeout classification, stdio caps, import-time constructor escape blocking, malformed IPC, and system-failure taxonomy.

