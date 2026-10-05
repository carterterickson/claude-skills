# What a realized design has to answer

A net, not a script. Read the sections matching the topic and work them conversationally.

**Every question here gets an answer in the request.** The skill produces most of them by doing the reading; the designer decides the ones about people and difficulty. *"The convention covers it"* is a reason to generate the answer confidently, not a reason to leave it out — they should be able to read the request and recognize what they pictured, which they can't do from a pointer to a convention.

**Contents:** [Areas](#areas-and-maps) · [People](#people) · [Scenes](#scenes-and-story-beats) · [Encounters](#encounters-and-battles) · [Shops and items](#shops-items-and-rewards) · [Systems](#systems) · [Art and audio](#art-and-audio-asks) · [Always](#always)

---

## Areas and maps

- The internal id (permanent) and the display name (free to change).
- Where a fresh arrival lands, and whether that's somewhere that makes sense to appear.
- **Every exit:** where it goes, where it drops you, and **which direction actually uses it**. An exit that only fires from the wrong direction is a door that visibly exists and does nothing.
- Two-way? What happens coming back?
- The collision shape — what's solid, what's walkable, what's water — and the intended path through.
- **What draws above the player and what draws below.** Anything they should walk *behind*. This is the layer that most often makes a finished area feel wrong.
- Encounter zones: where, what method, what rate, and whether there are safe tiles.
- The level band for the area, and whether it's fixed or scales.
- What changes here with story state, and derived from what.
- **What's here before the player is meant to be here.** Every area needs a too-early state.
- How the player knows where to go next, and what they leave with that they didn't arrive with.

## People

The skill drafts; the designer decides. Everything below is offered as a proposal.

- Id, display name, which sprite, what kind of character, position, facing.
- **Every line verbatim**, with breaks placed where a new text box should start.
- Does the line change with story state? Which condition, and what's the other version?
- For anyone who fights: their class, their team, and how the levels are derived.
- Do they notice the player from a distance, and how far?
- Do they wander? Do they leave? Are they absent under some condition? Do they only appear under one?
- Do they hold something to give? What, and once or repeatably?
- **If the design removes them:** does anything they were the only source of survive?

## Scenes and story beats

- Where it fires — a whole map, a specific character, or a rectangle walked into.
- What must already be true, in the project's state vocabulary.
- The step sequence in order. Reach past dialogue where it helps.
- Does it take control of the player? Does it run only once?
- What state does it set or clear, and what reads that afterward?
- **Can the player hit these out of order, or arrive from an unexpected direction?** What does each look like then?
- If it's a reveal: what was seeded earlier that makes it land? If nothing, that's a design problem upstream — go back.

## Encounters and battles

- The full table, with rarities, for every method in use on that map.
- Does each entry name a family or a specific stage? If the level picks the member, say so.
- Time-of-day or seasonal variation, if the game has it.
- For trainers: class and team. Which parts are authored and which are derived is itself a statement.
- **Levels: from the formula, or a deliberate number?** Deliberate numbers are the designer's.
- Can this fight be won with what's obtainable by this point? Is the counter available yet?
- What happens on a loss?

## Shops, items and rewards

- **Every category the shop system has, including the empty ones.** Three named categories leave the rest as unanswered questions that look like answers.
- Ground items: id, position, category. If ids double as world state, say so.
- Sized to the settlement, stocked appropriately for how far along the player is.
- **The missable test** on anything that matters: is there any path where the player permanently loses access to a one-of-a-kind thing? A single source that stands still is fine; a source that stops existing is the problem.

## Systems

See the systems section in `genre-conventions.md` for the questions to ask before proposing one. For the request itself:

- The rules **including the boring parts** — boundaries, zero, maximum, two effects at once.
- Expressible in the state vocabulary the project already has? If it seems to need something new, check whether it needs the existing thing arranged differently.
- What the player sees, and where.
- How it's introduced, and what happens to a player who ignores it.
- What the minimum real version is.

## Art and audio asks

When a design needs a new asset, the request has to say enough that it comes back usable:

- **Exact dimensions**, and whether it's on the established grid.
- **Which palette**, by name, and whether it's allowed new colors.
- **Frame count and layout** for anything animated, and the frame rate it plays at.
- **What it sits next to**, so the style matches — name an existing asset as the reference.
- **Placeholder or final?** Say so. A placeholder that isn't marked as one never gets replaced.
- For audio: length, whether it loops, where the loop point is, and what it plays over.

## Always

- Every piece of state read or written, where it's set, what depends on it, whether it's one-way.
- **The too-early state** for anything gated.
- Does anything here rename an internal id? Almost always a mistake — display names get fixed instead.
- Is anything being stored that should be derived? Presence, variants and obstacle state are usually recomputed, not saved.
- **What is deliberately not in scope, and why.**
- Does this collide with an open question? Name it and stop rather than answering it.
- What was rejected along the way, and for what reason — so the same argument isn't had next month.
- **How the designer checks it worked**, in plain language, as concrete actions with observable results.
