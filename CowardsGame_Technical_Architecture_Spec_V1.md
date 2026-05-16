
# Coward's Game — Technical Architecture Specification (V1)

## 1. Purpose

This document defines the technical architecture for V1 of Coward's Game.

The goals are:

- Create a deterministic, replayable competitive simulation game for the web.
- Support user-authored programmable strategies.
- Ensure the core engine is pure and testable.
- Enable safe execution of untrusted strategy code.
- Maintain a strong local-development experience.
- Keep the architecture extensible for future runtimes, AI tooling, and tournament systems.
- Produce an implementation-friendly specification suitable for autonomous coding systems such as Codex.

This document complements the gameplay and product specification.

---

# 2. High-Level Architecture

The architecture is intentionally separated into distinct boundaries:

```txt
Frontend/UI
    |
    v
Web/API Layer
    |
    v
Job Queue
    |
    v
Worker Runtime
    |
    +--> Strategy Runtime Sandbox
    |
    v
Pure Game Engine
    |
    v
Chronicle / Replay Storage
```

Core principles:

- The game engine is pure and deterministic.
- User strategy code never executes in the main web/API process.
- Match execution is asynchronous.
- Match results are fully replayable.
- Strategy revisions are immutable once submitted.

---

# 3. Technology Stack

## 3.1 Core Stack

| Area | Technology |
|---|---|
| Language | TypeScript |
| Frontend | Next.js + React |
| Backend | Node.js |
| Database | PostgreSQL |
| Validation | Zod |
| Async/Infrastructure | Effect |
| Testing | Vitest + Playwright |
| Package Management | pnpm |
| Monorepo | Turborepo |
| Rendering | Canvas / PixiJS |
| Editor | Monaco |
| Local Containers | Docker Compose |

---

# 4. Monorepo Structure

```txt
/apps
  /web
  /worker

/packages
  /engine
  /runtime-js
  /shared
  /replay
  /map-configs
  /test-utils
```

## 4.1 apps/web

Responsibilities:

- Next.js frontend
- Authentication
- Strategy editing
- MatchSet creation
- Replay viewing
- API routes/server actions

Must NOT:

- Execute user strategy code
- Contain game rule logic

---

## 4.2 apps/worker

Responsibilities:

- Claim match jobs
- Execute strategy runtime sandbox
- Run simulations
- Persist results
- Retry transient failures

Must be independently deployable.

---

## 4.3 packages/engine

The canonical pure game engine.

Requirements:

- No side effects
- No database access
- No network access
- No filesystem access
- No direct clock/time access
- No Math.random usage
- Fully deterministic

Primary contract:

```ts
transition(
  state: GameState,
  input: TurnInput
): GameState
```

---

## 4.4 packages/runtime-js

JavaScript/TypeScript strategy runtime sandbox.

Responsibilities:

- Compile/validate strategy source
- Execute strategies
- Enforce timeouts
- Restrict capabilities
- Validate outputs

This package is the boundary between untrusted user code and trusted engine logic.

---

## 4.5 packages/shared

Shared types, schemas, constants, and DTOs.

Includes:

- Zod schemas
- API contracts
- Replay contracts
- Match definitions
- Runtime message formats

---

## 4.6 packages/replay

Chronicle generation and replay utilities.

Responsibilities:

- Serialize replay artifacts
- Deserialize replay artifacts
- Replay simulation events
- Generate checkpoints
- Validate Chronicle integrity

---

# 5. Core Domain Model

## 5.1 Strategy

A mutable user-owned concept representing a programmable strategy.

Users may continue editing a Strategy over time.

---

## 5.2 StrategyRevision

An immutable executable snapshot of a Strategy.

Once used in a Match or MatchSet, a StrategyRevision must never change.

Each revision stores:

- Source code
- Runtime version
- Engine version compatibility
- Validation results
- Metadata

---

## 5.3 Match

A single deterministic simulation instance.

Each Match records:

- mapConfigId
- seed
- sideAssignment
- strategyRevisionIds
- engineVersion
- runtimeVersion
- Chronicle reference
- outcome

---

## 5.4 MatchSet

A configured suite of Matches between the same StrategyRevisions across multiple map/scenario variants.

A MatchSet varies:

- map configuration
- side assignment
- seed

V1 behavior:

- Each configured map is played once per side assignment.
- Maps are predefined and hand-authored.
- Users cannot create custom maps in V1.

---

## 5.5 Chronicle

The canonical replay artifact.

Chronicles must support:

- Full replayability
- Deterministic re-simulation
- Debugging
- Future replay rendering

Recommended storage model:

```txt
initial state
+ seed
+ strategy revision references
+ event log
+ action log
+ periodic checkpoints
```

---

# 6. Engine Design

## 6.1 Engine Requirements

The engine must be:

- Pure
- Deterministic
- Serializable
- Versioned
- Side-effect free
- Testable

---

## 6.2 Determinism Rules

The following must always hold:

```txt
same engine version
+ same seed
+ same strategy revisions
= same Chronicle
```

Violations are considered engine/runtime bugs.

---

## 6.3 RNG

All randomness must flow through a seeded RNG abstraction.

The engine must never use:

```txt
Math.random
Date.now
system time
```

---

## 6.4 State Mutation

GameState must be treated as immutable.

Mutation-in-place is prohibited.

---

# 7. Strategy Runtime

## 7.1 Runtime Contract

The runtime must expose:

```ts
interface StrategyRuntime {
  validate(source: string): ValidationResult;
  runTurn(input: RuntimeInput): RuntimeOutput;
}
```

This abstraction exists so future runtimes can support:

- JavaScript
- TypeScript
- Python
- WASM
- Other languages

without changing engine behavior.

---

## 7.2 Sandbox Restrictions

Hosted strategies must NOT have access to:

- Network
- Filesystem
- System clock
- Environment variables
- Native modules
- Child processes

---

## 7.3 Runtime Limits

Strategies must be constrained with:

- CPU timeout
- Memory limits where available
- Structured output validation
- Execution isolation

---

## 7.4 Runtime Failure Policy

### Strategy Failure

Examples:

- timeout
- invalid output
- thrown exception

Handling:

```txt
invalid action -> no-op + replay warning
timeout -> no-op turn
repeated timeout -> forfeit match
```

---

### System Failure

Examples:

- worker crash
- infrastructure failure
- transient runtime crash

Handling:

```txt
retry up to 3 times
if retries exhausted -> mark match failed
```

System-failed matches do not count as strategy losses.

---

# 8. Match Execution Flow

```txt
User submits StrategyRevision
    |
Create MatchSet
    |
Enqueue jobs
    |
Worker claims job
    |
Run sandboxed strategies
    |
Advance engine
    |
Generate Chronicle
    |
Persist results
    |
Replay available in UI
```

---

# 9. MatchSet Scoring

Primary ordering:

1. Match wins
2. Cumulative surviving soldiers across all matches
3. Cumulative survival time across all matches

All tie-breakers must be deterministic.

---

# 10. Replay / Chronicle Design

## 10.1 Requirements

Chronicles must support:

- Streaming replay
- Partial replay
- Debugging
- Versioning
- Compression
- Deterministic reconstruction

---

## 10.2 Replay Visibility

Replays may expose:

- observations
- actions
- events

Replays must NOT expose private strategy source code.

---

# 11. Persistence Model

## 11.1 Canonical Store

PostgreSQL is the canonical relational store.

---

## 11.2 Large Replay Storage

Large Chronicle blobs may later move to object storage:

- S3
- R2
- Supabase Storage

---

## 11.3 Primary Entities

```txt
User
Strategy
StrategyRevision
Match
MatchSet
Chronicle
MapConfig
```

---

# 12. Frontend Architecture

## 12.1 Responsibilities

The frontend provides:

- Strategy editor
- Validation UX
- MatchSet creation
- Replay viewing
- Match history
- Public example strategies

---

## 12.2 Editor

V1 editor features:

- Monaco editor
- Sample strategy templates
- Validate button
- Local test match execution
- Submit revision flow

Future features:

- AI-assisted strategy authoring
- External editor agents
- Multi-language support

---

## 12.3 Rendering

Replay rendering should use Canvas-based rendering.

PixiJS is recommended for scalability and animation flexibility.

---

# 13. AI / Agent Integration

## 13.1 V1 Scope

V1 supports only human-authored submitted strategies.

---

## 13.2 Future Scope

Future editor tooling may support:

```txt
EditorAgentIntegration
```

This refers ONLY to strategy authoring assistance.

Agents are NOT participants in live game execution.

---

# 14. Local Development

Local development is a first-class requirement.

## 14.1 One-Command Startup

The repository must support:

```txt
pnpm dev
```

This should start:

- web app
- worker
- local database
- local queue dependencies

---

## 14.2 Docker Compose

Docker Compose should provide:

- PostgreSQL
- queue infrastructure if needed

---

## 14.3 Seed Data

Local development must include seed scripts for:

- users
- sample strategies
- MatchSets
- maps
- Chronicles

---

## 14.4 Local Sandbox Mode

The strategy runtime must work locally without cloud dependencies.

---

# 15. Deployment Architecture

## 15.1 Core Deployment Shape

Deployments should separate:

```txt
stateless web service
worker service
database
object storage
```

---

## 15.2 Recommended V1 Hosting

Recommended paths:

### Option A

- Vercel (web)
- Railway/Fly/Render (worker + DB)

### Option B

- Render or Railway for everything

---

## 15.3 Environment Configuration

All infrastructure must be configurable via environment variables.

The app must be runnable locally without cloud services.

---

# 16. Testing Strategy

## 16.1 Engine Tests

The engine requires:

- unit tests
- deterministic replay tests
- invariant/property tests

---

## 16.2 Replay Tests

The following invariant must be enforced:

```txt
same seed + same strategy revisions
= same Chronicle
```

---

## 16.3 Runtime Tests

The runtime requires tests for:

- timeout enforcement
- invalid outputs
- sandbox isolation
- deterministic execution

---

## 16.4 End-to-End Tests

Playwright should validate:

- strategy editing
- MatchSet creation
- replay viewing
- local test matches

---

# 17. Observability

Workers must emit:

- match duration
- timeout counts
- invalid action counts
- retry counts
- match failure reasons
- engine errors

Structured logging is required.

---

# 18. Security

## 18.1 Hard Rules

The system must NEVER:

- execute user code in the main API process
- trust runtime outputs without validation
- expose filesystem/network access to strategies
- allow mutable StrategyRevisions

---

## 18.2 Validation

All runtime outputs crossing trust boundaries must be validated with Zod.

---

# 19. Codex Implementation Guidance

## 19.1 Architectural Constraints

Codex implementations should follow:

```txt
Do not place game rules in React components.
Do not mutate GameState in place.
Do not use Math.random inside engine logic.
Do not execute user code inside API request handlers.
Do keep package boundaries strict.
Do write exhaustive tests for transition behavior.
Do keep runtime and engine separated.
```

---

## 19.2 Prioritized Build Order

Recommended implementation order:

1. Pure engine package
2. Runtime sandbox
3. Replay/Chronicle system
4. Worker execution loop
5. Database persistence
6. Frontend/editor
7. Replay viewer
8. MatchSet orchestration

---

# 20. Future Extensibility

The architecture is intentionally designed to support future additions:

- custom maps
- tournaments
- ranked ladders
- multiple runtimes
- WASM runtimes
- AI-assisted strategy editing
- external editor agents
- spectator systems
- replay sharing
- distributed simulation
- advanced matchmaking
