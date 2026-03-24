# Diplomatic Dinner with a Murder

## High Concept

A single-player narrative intrigue game set during a luxurious 1930s diplomatic dinner.

The player interacts with multiple characters through a messenger-style interface, navigating hidden agendas, incomplete information, and conflicting goals.

Through dialogue, manipulation, and alliances, the player attempts to achieve their personal objective before a sudden and unexpected death disrupts the evening.

---

## Player Experience

The game does not impose a single playstyle.

The player is free to:
- unravel the intrigue,
- manipulate others,
- build alliances,
- or simply survive the situation.

The experience is driven by player choice.

---

## Scope (v1 Prototype)

- Single round (Day 1)
- Duration: 10 minutes (real-time, no pause)
- Ends with a character’s death (identity depends on player actions)
- Fully playable with:
  - 3 player roles
  - ~8 NPC characters
  - personal chats + group chat + shared room

The system must support extension to multiple days (Day 2, Day 3).

---

## Player Roles

The player selects one specific character at the start.

Available roles:
- Ambassador
- Industrialist
- Secret Agent (disguised as servant)

Each role has:
- unique goals
- unique starting knowledge
- unique dialogue options

---

## Narrative Structure

### Setup
- Intro slides explaining the situation
- Followed by a short personal briefing

### Core Situation
Characters gather to discuss international tensions and negotiations.

Each character:
- has their own agenda
- possesses partial information
- may cooperate, deceive, or manipulate

### Ending (v1)
At the end of the round:
- a character is found dead
- the cause is unknown
- the event is sudden and unresolved (cliffhanger)

---

## Core Systems

### 1. Dialogue System

- Messenger-style interface
- Player selects from 3 dialogue options per turn
- Each option = one message
- Dialogues are structured (branching nodes)

Dialogue availability depends on:
- trust level
- known information
- previous choices

NPCs may:
- cooperate
- evade
- lie
- refuse to continue the conversation

---

### 2. Trust System

Each NPC has a trust value toward the player.

Trust is affected by:
- dialogue tone
- promises kept or broken
- revealed or hidden information

Low trust may result in:
- blocked dialogue paths
- refusal to talk

---

### 3. Knowledge System

Each player has:

- Facts (confirmed information)
- Rumors (uncertain information)
- Promises (agreements made)

Knowledge affects:
- available dialogue options
- ability to unlock new paths

---

### 4. Event System

The round is structured by timed events:

- Start (0:00)
- Mid events (e.g. telegram, tension escalation)
- Final event (10:00): death

Events:
- unlock new dialogues
- change character behavior
- shift available information

---

## Dialogue Model (Hybrid)

The game uses a hybrid system:

- Core structure is scripted (logic, branching, conditions)
- AI may optionally rephrase dialogue for style and variation

AI must NOT:
- change facts
- alter logic
- introduce new story elements

---

## Characters

- ~8 characters total
- Each has:
  - name, role, affiliation
  - personality and negotiation style
  - goals and secrets
  - unique behavior patterns

All characters are important to the network of interactions.

---

## UI / UX

### Main Interface

Messenger-style layout (inspired by iMessage, stylized for 1930s luxury):

- Chat list (characters + groups)
- Active chat window
- Dialogue choices (3 buttons)
- Bottom menu (always visible):
  - Dialogues
  - Knowledge
  - Settings

### Features

- Works on desktop and mobile
- Real-time countdown (no pause)
- Message timestamps
- Unread indicators
- Character portraits + roles

---

## Tone & Setting

- Inspired by 1930s Europe
- Real-world countries (no direct historical references)
- Elegant intrigue, no graphic violence
- Focus on diplomacy, secrets, and social manipulation

---

## Win & Outcome (v1)

- No full win resolution in v1
- The round ends with a death event
- Player outcome is implicit:
  - what they learned
  - alliances formed
  - secrets uncovered

Future versions will include:
- multi-level endings
- full resolution across multiple days

---

## Technical Goals

- Web-based (GitHub Pages compatible)
- Structured JSON-driven content
- Expandable architecture for:
  - more days
  - more dialogue branches
  - additional characters

---

## Success Criteria (v1)

- The game feels engaging and playable
- The player understands the system
- The player wants to continue (future days)
- The project works as a strong portfolio piece