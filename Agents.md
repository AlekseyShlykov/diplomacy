# Agents.md — Development Rules for Diplomatic Dinner Game

## Project Overview

This is a single-player narrative game based on:
- structured dialogue systems
- asymmetric information
- hidden goals and relationships
- time-based events

The game is fully driven by JSON configuration files.

Core principle:
👉 The logic is defined in JSON, not in code.

---

## Core Architecture Rules

### 1. JSON-first design (CRITICAL)

All game logic MUST come from JSON files:

- characters.json → characters, roles, traits
- relationships.json → trust, alliances, tensions
- knowledge.json → facts, rumors, secrets
- goals.json → win / fail conditions
- events.json → time and progression
- dialogue_map.json → structure of dialogues
- dialogues.*.json → actual text content
- ui.json → UI labels

❗ DO NOT hardcode game logic in JavaScript

---

### 2. Separation of concerns

Strict separation:

- Logic → JSON
- Rendering → UI components
- State → runtime store

---

### 3. No narrative invention in code

The code must NOT:
- invent new story elements
- create new characters
- change relationships
- introduce new goals

All narrative content must come from JSON.

---

## Dialogue System Rules

### 4. Dialogue = state machine

Each dialogue:
- has nodes
- each node has exactly 3 choices
- choices trigger:
  - trust changes
  - flags
  - unlocks

---

### 5. No free text input

Player never types text.

Only predefined choices:
- exactly 3 per step
- always meaningful and distinct

---

### 6. Hidden logic

The system:
- tracks flags internally
- does NOT expose them to player

Player must infer:
- trust
- alliances
- consequences

---

## Event System Rules

### 7. Time-driven system

- Round duration: 600 seconds
- Events triggered by time

Examples:
- telegram
- drinks
- death

---

### 8. Event effects

Events may:
- unlock topics
- change dialogue availability
- modify behavior indirectly

---

## Trust & Relationships

### 9. Trust system

- Range: -2 to +2
- Used to:
  - unlock dialogue
  - block dialogue
  - affect outcomes

---

### 10. Relationships are asymmetric

Character A may trust B differently than B trusts A.

---

## Knowledge System

### 11. Information layers

Each character has:
- facts (true)
- rumors (uncertain)
- secrets (hidden)

---

### 12. Player knowledge

Player knowledge:
- evolves through dialogue
- unlocks new dialogue paths

---

## Murder System (Critical Mechanic)

### 13. Poison system

- Poison is NOT a button
- It is a result of conditions:
  - target isolated
  - trust high enough
  - interaction occurred

---

### 14. Death resolution

At end of round:
- exactly one character dies
- result depends on flags

Possible outcomes:
- correct target
- wrong target
- failure

---

## UI / UX Rules

### 15. Interface

Messenger-style UI:
- chat list
- chat window
- 3 choices per turn
- bottom menu always visible

---

### 16. Platforms

Must work on:
- desktop
- mobile

Responsive design required.

---

### 17. No over-guidance

UI must NOT:
- explain mechanics directly
- show trust numbers
- show flags

---

## Code Structure

### 18. Suggested structure

- /data → JSON files
- /src
  - /components
  - /systems
  - /store
  - /ui

---

### 19. State management

Must include:
- current time
- active flags
- trust levels
- unlocked topics
- player knowledge

---

### 20. Extensibility

The system must support:
- multiple rounds (Day 2, Day 3)
- more characters
- more events

---

## AI Usage Rules (Important)

### 21. AI is optional layer

AI may:
- rephrase dialogue
- add stylistic variation

AI must NOT:
- change logic
- introduce facts
- alter outcomes

---

## Development Priorities

### 22. Order of implementation

1. Basic UI (chat interface)
2. Load JSON data
3. Dialogue system
4. Event timer
5. Trust system
6. Knowledge system
7. Murder logic
8. Polish

---

## Anti-Patterns (DO NOT DO)

- ❌ Hardcoding dialogue in JS
- ❌ Adding hidden mechanics not in JSON
- ❌ Creating random outcomes
- ❌ Making system opaque to developer
- ❌ Breaking separation of data and logic

---

## Success Criteria

The build is successful if:

- Player can:
  - choose a role
  - talk to characters
  - influence trust
  - trigger events
  - reach end of round

- System behaves consistently
- Outcomes depend on player actions
- Experience feels logical but not fully transparent