# Coward’s Game — Canonical Specification v1

## 1. Overview

Coward’s Game is a deterministic two-player programmable strategy game.

Players author autonomous Strategies that control Soldiers on a shrinking board.

Victory is achieved through:
- positional control
- directional tactics
- terrain creation
- pushing
- backstabbing
- strategic adaptation

Once a Match begins:
- no human input is allowed
- no live model inference is allowed
- Strategies execute autonomously and deterministically

The game is designed for:
- high emergent complexity
- high AI usefulness
- replay analysis
- tournament play
- robust anti-optimization dynamics

---

## 2. Ubiquitous Language

| Term | Meaning |
|---|---|
| Match | Entire game session |
| Phase | 4-round macrocycle ending in Contraction |
| Round | One activation-count step, from 1 through 4 |
| Activation | One Soldier executing its SoldierBrain |
| Cycle | One SoldierBrain invocation during an Activation |
| Action | One emitted instruction from a SoldierBrain |
| Advance | Successful positional displacement by a Soldier |
| Strategy | Player-authored programmable behavior |
| Strategy Revision | Immutable submitted Strategy version |
| Strategy Build | Authoring session, potentially involving AI Models |
| SoldierBrain | Runtime execution logic for a Soldier |
| Player | Human account/user |
| Model | AI system used during Strategy creation |
| Awareness Grid | Local 5x5 sensory input |
| Awareness Cell | One cell within an Awareness Grid |
| Contraction | Board shrinking event |
| Chronicle | Deterministic replay/event log |
| Obstacle | Any impassable object |
| TerrainStone | Neutral map obstacle |
| Stone Soldier | Former Soldier turned to STONE |
| Interrupted Activation | Activation ended prematurely |
| Exhausted Activation | Activation ended naturally |

Avoid using:
- “piece” when “Soldier” is meant
- “turn” when “Round,” “Activation,” “Cycle,” or “Action” is meant
- “dead” when “STONE” or “FALLEN” is meant
- “move” when “MOVE Action,” “MOVE attempt,” or “Advance” is meant

---

## 3. Core Entities

### Player

A Player is the human account or user.

Players:
- own Strategy Revisions
- participate in Matches and Sets
- may use Models during Strategy Builds
- may have rankings, stats, histories, and published Strategies

### Model

A Model is an AI system used during Strategy creation or analysis.

A Model does not participate directly in Match execution.

A Model may be recorded as metadata on a Strategy Build.

### Strategy

A Strategy is player-authored programmable behavior.

It includes:
- activation selection logic
- SoldierBrain logic
- memory usage
- objective assignment

### Strategy Revision

A Strategy Revision is an immutable version of a Strategy submitted for Match or Set play.

Strategy Revisions must be locked before:
- Match seed reveal
- Arena Variant reveal
- initial initiative reveal

### Soldier

A Soldier is a controllable unit on the board.

A Soldier may be:
- ACTIVE
- STONE
- FALLEN

### Chronicle

A Chronicle is the deterministic replay and event log for a Match.

It must contain enough information to:
- reproduce Match results
- debug Strategy behavior
- inspect Awareness Grids
- explain key events
- analyze outcomes

---

## 4. Match Structure

A Match consists of repeating Phases.

Each Phase contains:

```text
Round 1
Round 2
Round 3
Round 4
Contraction
```

Each Round has an activation count:

| Round | Activation Count Per Player |
|---|---:|
| Round 1 | 1 |
| Round 2 | 2 |
| Round 3 | 3 |
| Round 4 | 4 |

After Round 4, the board contracts inward by one square on all sides.

The Phase cycle repeats until the Match ends.

---

## 5. Board

Initial board size:

```text
12x12
```

Coordinates:

```text
(0,0) = top-left
x increases rightward
y increases downward
```

Directions:

```text
UP    = y - 1
DOWN  = y + 1
LEFT  = x - 1
RIGHT = x + 1
```

Board bounds are tracked explicitly.

```ts
type BoardBounds = {
  minX: number
  maxX: number
  minY: number
  maxY: number
}
```

Initial bounds:

```ts
{
  minX: 0,
  maxX: 11,
  minY: 0,
  maxY: 11
}
```

A position is inside the current board if:

```ts
x >= minX &&
x <= maxX &&
y >= minY &&
y <= maxY
```

The current board width and height are:

```ts
width = maxX - minX + 1
height = maxY - minY + 1
```

---

## 6. Initial Soldier Setup

Each Player begins with 8 Soldiers.

### Bottom Player

Starting positions:

```text
(2,11)
(3,11)
(4,11)
(5,11)
(6,11)
(7,11)
(8,11)
(9,11)
```

Initial facing:

```text
UP
```

### Top Player

Starting positions:

```text
(2,0)
(3,0)
(4,0)
(5,0)
(6,0)
(7,0)
(8,0)
(9,0)
```

Initial facing:

```text
DOWN
```

---

## 7. Soldier State

```ts
type SoldierStatus =
  | "ACTIVE"
  | "STONE"
  | "FALLEN"
```

```ts
type Direction =
  | "UP"
  | "DOWN"
  | "LEFT"
  | "RIGHT"
```

```ts
type Position = {
  x: number
  y: number
}
```

```ts
type Soldier = {
  id: SoldierId
  ownerPlayerId: PlayerId

  status: SoldierStatus

  position: Position | null

  facing: Direction | null

  lastSuccessfulMoveDirection: Direction | null

  soldierMemory: SoldierMemory
}
```

Rules:
- ACTIVE Soldiers occupy their current square.
- STONE Soldiers occupy their current square.
- FALLEN Soldiers do not occupy any square.
- STONE Soldiers retain facing for replay clarity.
- FALLEN Soldiers may retain last-known position as Chronicle metadata, but do not occupy a board square.

---

## 8. Soldier Status Semantics

### ACTIVE

An ACTIVE Soldier:
- may be selected for Activation
- may MOVE
- may TURN
- may TURN_TO_STONE
- may Backstab
- may be pushed
- may fall

### STONE

A STONE Soldier:
- remains on its board square
- blocks movement
- cannot move
- cannot turn
- cannot Backstab
- cannot be pushed
- cannot be displaced
- cannot be selected for Activation
- does not count as ACTIVE for scoring

A Soldier may become STONE by:
- being Backstabbed
- using Coward’s Way Out
- completing or ending an Activation without Advancing

### FALLEN

A FALLEN Soldier:
- is removed from occupancy
- cannot act
- cannot block
- cannot be selected
- does not count as ACTIVE for scoring

A Soldier may become FALLEN by:
- moving off the board
- being pushed off the board
- being outside bounds after Contraction

---

## 9. TerrainStones and Obstacles

A TerrainStone is a neutral map obstacle.

TerrainStones:
- occupy a square
- block movement
- cannot move
- cannot be pushed
- cannot be Backstabbed
- do not belong to either Player
- do not count for scoring

An Obstacle is anything impassable, including:
- TerrainStone
- Stone Soldier
- occupied ACTIVE Soldier, subject to collision rules
- WALL / off-board square

---

## 10. Strategy Architecture

Each Player submits one immutable Strategy Revision before Match start.

```ts
type Strategy = {
  selectActivations(
    input: StrategyInput
  ): StrategyResult

  soldierBrain(
    input: SoldierBrainInput
  ): SoldierBrainResult
}
```

The Strategy Revision controls:
- which Soldiers activate during a Round
- what objective payload each activated Soldier receives
- how each activated Soldier behaves during its Activation
- StrategyMemory updates
- SoldierMemory updates

Strategies are locked for the duration of a Match.

For ranked Sets, Strategies are locked for the entire Set.

No live editing is permitted during a ranked Match or ranked Set.

No live Model inference is permitted during Match execution.

---

## 11. Strategy Information Model

At the start of each Round, a Strategy receives full-board visibility.

```ts
type StrategyInput = {
  phaseNumber: number
  roundNumber: number
  activationCount: 1 | 2 | 3 | 4

  board: FullBoardSnapshot

  mySoldiers: SoldierSnapshot[]
  enemySoldiers: SoldierSnapshot[]

  strategyMemory: StrategyMemory
}
```

Strategy may use this information to:
- choose Soldiers for Activation
- assign objectives
- update StrategyMemory
- infer opponent behavior
- reason about contraction risk
- plan formations or sacrifices

StrategyMemory is private to the owning Strategy.

Opponent StrategyMemory is not visible during a Match.

---

## 12. Activation Selection

Strategy returns:

```ts
type StrategyResult = {
  activationOrders: ActivationOrder[]

  strategyMemory: StrategyMemory
}
```

```ts
type ActivationOrder = {
  soldierId: SoldierId

  objective?: JsonValue
}
```

Rules:
- The same Soldier cannot activate twice in the same Round.
- Invalid Soldier selections are skipped.
- STONE Soldiers cannot activate.
- FALLEN Soldiers cannot activate.
- Excess ActivationOrders are ignored.
- Missing ActivationOrders are forfeited.
- Malformed StrategyResult produces no valid activations and logs a violation.

The `objective` payload is passed to the selected SoldierBrain during that Soldier’s Activation.

---

## 13. Round Activation Pattern

Each Round uses an interleaved snake pattern.

If Player A has initiative and Player B acts second:

### Round 1

```text
A B
```

### Round 2

```text
A B B A
```

### Round 3

```text
A B B A A B
```

### Round 4

```text
A B B A A B B A
```

Initial initiative is determined deterministically from the Match seed.

Initiative alternates every Round.

The intent is to reduce first-mover advantage while preserving meaningful initiative.

---

## 14. SoldierBrain Input

Each Activation allows up to 12 Cycles.

TURN and MOVE share the same Cycle budget.

Before every Cycle, SoldierBrain receives a fresh input:

```ts
type SoldierBrainInput = {
  self: SoldierSnapshot

  awarenessGrid: AwarenessGrid5x5

  cycleIndex: number

  maxCycles: 12

  objective?: JsonValue

  soldierMemory: SoldierMemory
}
```

SoldierBrain does not receive full-board state during Activation.

SoldierBrain only receives:
- self snapshot
- local 5x5 Awareness Grid
- objective payload
- SoldierMemory
- cycle metadata

---

## 15. Awareness Grid

The Awareness Grid is a 5x5 local sensor map centered on the active Soldier.

Coordinates:
- `dx`: -2 to +2
- `dy`: -2 to +2

```ts
type AwarenessGrid5x5 = {
  cells: AwarenessCell[]
}
```

```ts
type AwarenessCell = {
  dx: -2 | -1 | 0 | 1 | 2
  dy: -2 | -1 | 0 | 1 | 2

  absoluteX: number
  absoluteY: number

  contents:
    | "EMPTY"
    | "WALL"
    | "FRIENDLY_ACTIVE"
    | "FRIENDLY_STONE"
    | "ENEMY_ACTIVE"
    | "ENEMY_STONE"
    | "TERRAIN_STONE"

  facing?: Direction
}
```

Rules:
- Off-board cells are `WALL`.
- FALLEN Soldiers do not appear.
- ACTIVE Soldiers expose their facing.
- STONE Soldiers expose their facing for replay clarity.
- TerrainStones have no facing.

---

## 16. Actions

```ts
type Action =
  | MoveAction
  | TurnAction
  | TurnToStoneAction
```

### MOVE

```ts
type MoveAction = {
  type: "MOVE"
  direction: Direction
}
```

### TURN

```ts
type TurnAction = {
  type: "TURN"
  direction: Direction
}
```

TURN:
- updates facing immediately
- consumes one Cycle
- does not count as an Advance
- does not update lastSuccessfulMoveDirection
- does not reset reversal restrictions
- does not prevent stoning unless the Soldier also Advances during the Activation

A Soldier may TURN any number of times during an Activation, subject to the 12-Cycle limit.

### TURN_TO_STONE

```ts
type TurnToStoneAction = {
  type: "TURN_TO_STONE"
}
```

TURN_TO_STONE is called:

```text
Coward’s Way Out
```

The Soldier immediately becomes STONE.

---

## 17. SoldierBrain Result

```ts
type SoldierBrainResult = {
  action: Action

  soldierMemory: SoldierMemory
}
```

Rules:
- SoldierBrain must return exactly one Action per Cycle.
- SoldierMemory is updated by returning a new SoldierMemory value.
- SoldierMemory is not mutated directly.
- Malformed output interrupts the Activation.
- If the Soldier has not Advanced during that Activation, it becomes STONE at Activation end.

---

## 18. Movement Rules

A MOVE attempts to Advance one square in the requested direction.

If the MOVE successfully Advances:
- Soldier position changes
- Soldier facing updates to MOVE direction
- Soldier lastSuccessfulMoveDirection updates to MOVE direction

If the MOVE does not Advance:
- Activation is interrupted
- Soldier does not immediately become STONE solely because the MOVE failed
- if the Soldier has not Advanced at least once during this Activation, it becomes STONE at Activation end

---

## 19. Immediate Reversal Rule

A Soldier may not MOVE directly opposite its `lastSuccessfulMoveDirection`.

Examples:
- lastSuccessfulMoveDirection = UP → MOVE DOWN is invalid
- lastSuccessfulMoveDirection = DOWN → MOVE UP is invalid
- lastSuccessfulMoveDirection = LEFT → MOVE RIGHT is invalid
- lastSuccessfulMoveDirection = RIGHT → MOVE LEFT is invalid

Rules:
- TURN does not bypass this rule.
- Failed movement does not update reversal history.
- Pushes do not update reversal history.
- Being pushed does not update the pushed Soldier’s reversal history.
- TURN does not reset lastSuccessfulMoveDirection.

---

## 20. Movement Resolution

### Empty Destination

If destination is empty and inside bounds:
- MOVE succeeds
- Soldier Advances into destination

### Off-Board Destination

If destination is outside current bounds:
- Soldier becomes FALLEN
- reason = MOVED_OFF_BOARD
- Activation ends

### TerrainStone Destination

If destination contains a TerrainStone:
- movement is blocked
- Soldier remains in place
- Activation is interrupted

### Stone Soldier Destination

If destination contains a Stone Soldier:
- movement is blocked
- Soldier remains in place
- Activation is interrupted

### Active Soldier Destination

If destination contains an ACTIVE Soldier:
- resolve collision according to orientation rules

---

## 21. Head-to-Head Collision

If the target Soldier faces opposite the MOVE direction:

```text
target.facing === opposite(moveDirection)
```

then:
- mover remains in place
- target remains in place
- Activation is interrupted
- no Backstab occurs
- no push occurs

---

## 22. Side Push

If the target Soldier is approached from the side:
- attempt push

Side approach means:
- target.facing is neither the MOVE direction nor the opposite of the MOVE direction

Pushes are never recursive.

Let:

```text
pushDestination = target.position + moveDirection
```

If pushDestination is empty and inside bounds:
- pushed Soldier moves to pushDestination
- mover Advances into target’s previous square
- pushed Soldier’s facing does not change
- pushed Soldier’s lastSuccessfulMoveDirection does not change

If pushDestination is occupied:
- push is blocked
- target remains in place
- mover remains in place
- Activation is interrupted

If pushDestination is outside bounds:
- pushed Soldier becomes FALLEN
- reason = PUSHED_OFF_BOARD
- mover Advances into target’s previous square

Pushes may affect friendly or enemy Soldiers.

---

## 23. Backstab

Backstab is position-triggered, not only voluntary-advance-triggered.

A Backstab occurs when:

```text
An ACTIVE Soldier is directly in the behind-square of an enemy ACTIVE Soldier
at a Backstab check boundary.
```

Behind-square is determined by the enemy Soldier’s facing:

```ts
function behindSquare(soldier: Soldier): Position {
  switch (soldier.facing) {
    case "UP":
      return { x: soldier.position.x, y: soldier.position.y + 1 }
    case "DOWN":
      return { x: soldier.position.x, y: soldier.position.y - 1 }
    case "LEFT":
      return { x: soldier.position.x + 1, y: soldier.position.y }
    case "RIGHT":
      return { x: soldier.position.x - 1, y: soldier.position.y }
  }
}
```

Backstab check boundaries:
- at the beginning of every Soldier Activation, before any SoldierBrain Cycle
- at the end of every Soldier Activation, before match-end checks
- after each successful Advance

At activation-start and activation-end boundaries, check all ACTIVE Soldiers on the board.

Successful Backstab:
- enemy Soldier becomes STONE
- enemy Soldier remains in its current square
- attacker remains in the behind-square if still ACTIVE
- attacker does not enter the enemy’s occupied square solely because of Backstab

Multiple Backstabs at the same activation boundary resolve from a simultaneous snapshot, then all unique victims become STONE together.

Mutual Backstab cases stone both Soldiers if both relationships are true in the simultaneous snapshot.

Pushed Soldiers can trigger Backstab by ending behind an enemy Soldier, regardless of how they got there.

Pushes do not update `lastSuccessfulMoveDirection`.

A single Advance or activation boundary may Backstab multiple enemy ACTIVE Soldiers.

STONE Soldiers cannot be Backstabbed.

Friendly Soldiers cannot be Backstabbed.

After Backstab boundary resolution, immediately check match-end conditions.

---

## 24. Coward’s Way Out

A Soldier may voluntarily TURN_TO_STONE during its Activation.

This:
- immediately changes Soldier status to STONE
- leaves the Soldier in its current square
- ends the Activation
- creates a Stone Soldier Obstacle

This may be used strategically for:
- wall creation
- lane blocking
- contraction planning
- sacrifice plays

---

## 25. Activation Completion

An Activation ends when:
- 12 Cycles are completed
- SoldierBrain emits invalid output
- MOVE is invalid
- movement is blocked
- push is blocked
- Soldier FALLS
- Soldier becomes STONE
- sandbox/runtime failure occurs

If a Soldier completes or ends an Activation without successfully Advancing at least once:
- the Soldier becomes STONE

Exception:
- If the Soldier becomes FALLEN during the Activation, it remains FALLEN rather than becoming STONE.

---

## 26. Contraction

After Round 4:
- board contracts inward by 1 square on all sides

Example:

```text
12x12 → 10x10
```

Bounds update as:

```ts
minX += 1
maxX -= 1
minY += 1
maxY -= 1
```

Any ACTIVE or STONE Soldier outside the new bounds becomes FALLEN.

Reason:

```text
BOARD_CONTRACTION
```

TerrainStones outside the new bounds are removed from play.

Contraction order:
1. Round 4 final Activation resolves.
2. Normal win condition is checked.
3. Contraction occurs.
4. Soldiers outside new bounds become FALLEN.
5. Match end conditions are checked.
6. If board is 2x2, final resolution occurs.

Contraction is simple, global, predictable, and inevitable.

Stones do not stop Contraction.

---

## 27. Arena Variants

Matches occur on seeded Arena Variants.

Strategy Revisions lock before:
- seed reveal
- initiative reveal
- Arena Variant reveal

V1 Arena Variants are hand-authored.

```ts
type ArenaVariant = {
  id: ArenaVariantId
  name: string
  initialBounds: BoardBounds
  terrainStones: Position[]
}
```

Rules:
- TerrainStones cannot overlap starting Soldier positions.
- TerrainStones are neutral Obstacles.
- Arena Variants must be deterministic.
- Randomized stone generation is out of scope for v1.

Arena Variants exist to:
- reduce opening overfitting
- encourage robust Strategies
- preserve strategic diversity
- prevent center-control metas from becoming too dominant

---

## 28. Match End Conditions

### Immediate Victory

If one Player has zero ACTIVE Soldiers:
- opponent wins

If both Players have zero ACTIVE Soldiers:
- DRAW

### Final 2x2 Resolution

When the board reaches 2x2, the Match ends immediately after Contraction.

Count ACTIVE Soldiers inside the board.

If one Player has more ACTIVE Soldiers:
- that Player wins

If both Players have equal ACTIVE Soldiers:
- DRAW

STONE Soldiers do not count.

FALLEN Soldiers do not count.

Examples:
- 2 Bottom ACTIVE, 2 Top ACTIVE → DRAW
- 1 Bottom ACTIVE, 1 Top ACTIVE, 2 empty/STONE squares → DRAW
- 2 Bottom ACTIVE, 1 Top ACTIVE, 1 STONE → Bottom wins
- 1 Bottom ACTIVE, 0 Top ACTIVE → Bottom wins

---

## 29. Memory Model

### StrategyMemory

StrategyMemory:
- persists across Rounds
- is globally shared by the Strategy
- is private to owning Strategy
- is JSON-serializable
- has max serialized size of 32KB

StrategyMemory may be used for:
- doctrine state
- opponent modeling
- role assignment
- phase plans
- remembered patterns
- internal maps

### SoldierMemory

SoldierMemory:
- persists across Activations for one Soldier
- is local to that Soldier
- is not directly shared with other Soldiers
- is JSON-serializable
- has max serialized size of 2KB per Soldier

SoldierMemory may be used for:
- local patrol state
- last local observation
- current role state
- tactical mode
- local counters

### Objective Payload

Objective payload:
- passed from Strategy to SoldierBrain through ActivationOrder
- JSON-serializable
- max serialized size of 1KB

Objective payload may describe:
- role
- target
- mode
- anchor position
- tactical instruction

---

## 30. Runtime Constraints

### Source Size

Each Strategy Revision has max source size:

```text
64KB
```

### Execution Limits

Prototype v1 timing limits:
- Strategy evaluation: 50ms
- SoldierBrain Cycle: 10ms
- Full Activation: 100ms

Future competitive play should use deterministic fuel counters or instruction budgets.

### Output Limits

Runtime outputs must respect:
- StrategyMemory size
- SoldierMemory size
- objective payload size
- Chronicle event payload size
- valid Action schema

Malformed or oversized outputs are invalid.

---

## 31. Forbidden Runtime Capabilities

Strategy code may not access:
- network
- filesystem
- environment variables
- secrets
- database
- process APIs
- wall-clock time
- nondeterministic randomness
- eval
- Function constructor
- dynamic imports
- worker spawning
- native modules
- package installation

Any randomness must come from an explicitly provided deterministic seeded RNG, if randomness is allowed at all.

---

## 32. Determinism

A Match must be reproducible from:
- Match seed
- selected Strategy Revisions
- engine version
- Arena Variant
- runtime versions

Given those inputs, the engine must deterministically reproduce:
- every Round
- every Activation
- every Awareness Grid
- every Action
- every Advance
- every Push
- every Backstab
- every Soldier stoning
- every Fall
- every Contraction
- final Match outcome

Strategies may not depend on:
- wall-clock time
- machine-specific behavior
- nondeterministic iteration
- external services
- hidden global state

---

## 33. Chronicle

Every Match produces a deterministic Chronicle.

Minimum event types:
- MATCH_STARTED
- ROUND_STARTED
- STRATEGY_EVALUATED
- ACTIVATION_STARTED
- AWARENESS_GRID_OBSERVED
- ACTION_EMITTED
- MOVE_ADVANCED
- MOVE_BLOCKED
- TURN_RESOLVED
- PUSH_ATTEMPTED
- PUSH_RESOLVED
- PUSH_BLOCKED
- BACKSTAB_RESOLVED
- SOLDIER_STONED
- SOLDIER_FELL
- CONTRACTION_RESOLVED
- MATCH_ENDED
- RUNTIME_VIOLATION

Chronicle should support:
- replay
- step-through debugging
- Awareness Grid inspection
- Strategy analysis
- SoldierMemory inspection by owner
- event search
- deterministic verification

Public Chronicles should expose by default:
- board states
- Soldier positions
- Soldier statuses
- Activations
- Actions
- outcomes

Private by default:
- Strategy source code
- StrategyMemory
- SoldierMemory
- internal objective payloads

Players may explicitly publish additional details.

---

## 34. Security Architecture

Recommended package architecture:

```text
cowards-engine
cowards-runtime-js
cowards-spec
cowards-chronicle
cowards-ui
```

The Match engine must remain language-agnostic.

The engine should depend on a language-neutral interface:

```ts
type StrategyRuntime = {
  evaluateStrategy(input: StrategyInput): StrategyResult

  evaluateSoldierBrain(
    input: SoldierBrainInput
  ): SoldierBrainResult
}
```

The engine calls StrategyRuntime.

The engine does not directly execute user code.

User code must be treated as hostile.

Runtime must be isolated from:
- engine internals
- host machine
- secrets
- network
- filesystem
- database

Recommended long-term pipeline:

```text
Strategy Source Code
→ compile/validate
→ sandboxed runtime artifact
→ deterministic StrategyRuntime interface
→ Match Engine
```

Failure behavior:
- If Strategy execution times out, crashes, violates sandbox rules, or emits malformed output:
  - current evaluation is invalid
  - relevant Activation is interrupted
  - if Soldier has not Advanced during that Activation, it becomes STONE
  - violation is logged in Chronicle

---

## 35. Multi-Language Future

V1 may support only one Strategy language, likely JavaScript or TypeScript.

However, the engine must not assume Strategy code is always JavaScript.

Future runtimes may support:
- JavaScript / TypeScript
- Python
- WASM
- restricted DSLs
- visual rule builders
- AI-authored strategy languages

All runtimes must:
- implement the same StrategyRuntime interface
- use JSON-serializable inputs and outputs
- preserve deterministic execution
- obey sandbox restrictions
- enforce runtime limits

WASM/WASI may be a strong long-term path for multi-language support.

---

## 36. Competitive Structures

### Match

A Match is a single deterministic game instance.

A Match includes:
- one Match seed
- one Arena Variant
- one initiative sequence
- one Strategy Revision per Player

A Match produces:
- one winner or DRAW
- one Chronicle

### Set

A Set is a collection of Matches played between the same Players.

Examples:
- Best-of-3
- Best-of-5
- Best-of-7

Each Match within a Set uses:
- a different deterministic seed
- potentially different Arena Variants
- alternating initial initiative

The winner of the Set is the Player who wins the majority of Matches.

### Strategy Lock Within Sets

For ranked competitive play:
- Players select Strategy Revisions before the Set begins.
- Strategy Revisions remain immutable for the entire Set.
- Strategies may not change between Matches within a Set.

This rewards:
- robust doctrine design
- generalizable strategies
- emergent adaptability

rather than:
- live counterpicking
- prompt iteration
- reactive rewriting

### Seed and Arena Reveal Timing

Strategy Revisions lock before:
- Match seeds are revealed
- Arena Variants are revealed
- initiative order is revealed

This prevents overfitting to deterministic conditions.

---

## 37. Official Match Modes

### Ranked Match

- Single Match
- Locked Strategy Revision

### Ranked Set

- Best-of-N Matches
- Locked Strategy Revision for entire Set

### Workshop Mode

Non-competitive experimentation mode.

Players may:
- modify Strategies between Matches
- inspect Chronicles
- iterate collaboratively with AI Models
- run local simulations
- compare revisions

Workshop Mode is intended for:
- learning
- debugging
- doctrine development
- experimentation

### Future Modes

Out of scope for v1:
- Strategy Loadouts
- AI Benchmark Ladders
- Cooperative Strategy Building
- Campaign/Coaching Mode
- Team Matches
- Spectator Tournaments

---

## 38. Product and UX Principles

The game should feel like:

```text
I designed a doctrine.
```

not:

```text
I clicked units quickly.
```

The player experience should emphasize:
- Strategy creation
- AI-assisted authoring
- simulations
- Chronicles
- replay analysis
- doctrine identity
- emergent behavior

Chronicle-first UX is strongly recommended.

Core UX tools:
- replay speed controls
- step-through debugging
- Soldier inspection
- Awareness Grid inspection
- action/event timeline
- objective visualization
- contraction warnings
- backstab/push/fall emphasis
- simulation comparison tools

The simulation becomes exciting when players can understand intention, not merely observe movement.

---

## 39. Accessibility and Skill Ceiling

The ruleset should remain limited.

The depth should emerge from:
- local rules
- orientation
- contraction
- persistent stone terrain
- pushing
- backstabbing
- hidden Strategies
- arena variation
- deterministic Sets
- memory-constrained autonomous behavior

Low barrier to entry should come from:
- starter doctrines
- templates
- AI-assisted editing
- visual debugging
- example Strategies
- Chronicle explanations

Do not reduce strategic depth by adding many mechanics.

Do not solve accessibility by weakening the rules.

---

## 40. Monetization Principles

If monetized, competitive integrity must be preserved.

Do not monetize:
- stronger Soldiers
- larger memory limits in ranked
- extra runtime privileges
- gameplay advantages
- premium ranked mechanics

Potential acceptable monetization:
- AI-assisted Strategy building
- simulation compute
- Chronicle analysis tools
- replay exports
- cosmetic Soldier themes
- cosmetic Stone styles
- arena skins with identical geometry
- contraction visual effects
- doctrine banners
- strategy identity cosmetics
- spectator/commentary tools

Cosmetics must preserve readability:
- facing direction must remain clear
- ACTIVE / STONE / FALLEN must remain clear
- board occupancy must remain clear
- Contraction must remain clear

---

## 41. Future Features Out of Scope for v1

- ranked ladders
- public tournaments
- best-of-N competitive infrastructure
- randomized arena generation
- multiple language runtimes
- spectator tools
- strategy publishing
- collaborative strategy building
- AI-vs-human benchmarking
- model-vs-model benchmarking
- Chronicle sharing
- visual debugger
- deterministic fuel metering
- reinforcement-learning environments
- Strategy marketplace
- AI-generated commentary
- visual rule builder
- educational/research benchmark harness

---

## 42. Codex / Agent Implementation Guidance

Build the game simulation-first.

Recommended order:
1. `cowards-spec`
2. `cowards-engine`
3. deterministic Chronicle system
4. engine unit tests
5. replay validation tests
6. minimal Chronicle viewer
7. sandboxed JS runtime
8. Strategy editor
9. backend/accounts/match queue

Do not start with:
- multiplayer
- polished graphics
- cosmetics
- ranked ladder
- monetization

The hardest parts are:
- deterministic engine
- replay correctness
- sandboxed execution
- Strategy API clarity
- debugging tools

The engine should be pure, deterministic, and serializable.

Use TypeScript discriminated unions.

Avoid classes unless strongly justified.

Keep rendering/UI separate from simulation.
