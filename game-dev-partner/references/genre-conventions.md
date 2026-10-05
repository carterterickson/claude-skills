# Genre conventions — monster-taming and 2D RPGs

Read before giving pacing, progression, or systems advice, so suggestions are grounded in how the genre actually works rather than in general game-design platitudes.

These are patterns and their reasoning, not rules. A solo project's best moments often come from deliberately breaking one; the failures come from breaking one by accident.

---

## The progression loop

The genre's engine is a tight repeating cycle:

**new area → new creatures and items → a skill or power check → a new capability → a newly reachable area**

Nearly every pacing problem traces back to one link being missing or stretched too thin.

When reviewing a stretch of the game, map it against the loop. A segment where the player crosses two routes and a cave without gaining a creature, an item, a story beat, or a capability is where players stop playing — not because it's bad, but because **nothing changed**.

**Cadence to check against:** something meaningful roughly every 10–20 minutes. Meaningful means one of: a new obtainable creature, a real fight, a story revelation, a new place with its own identity, or a new capability. Optional content doesn't count if it's easy to walk past.

---

## Gating and traversal

Gating exists to control *order*, not to create difficulty.

The genre's classic approach is a **capability gate**: a visible obstacle that a specific earned ability removes. It's strong because the obstacle is visible before it's passable — the player sees the locked thing, remembers it, and comes back. That "I'll come back" moment is a major driver of exploration.

Its historical weakness is well documented: mandatory abilities that clutter a creature's move slots and feel like a tax. The modern fix is decoupling — an item, a key item, a permanent unlock, a companion.

**Checks for any gate:**

- Can the player *see* the obstacle before they can pass it? (Good — creates a return hook.)
- Is it obvious what kind of thing would remove it? (It should be. Mystery here reads as a bug.)
- Does the unlock have a use beyond opening gates? (Otherwise it's a key in a lock wearing a costume.)
- Is there more than one thing to do with it once acquired? (One-use unlocks feel cheap.)
- Can the player pass it one way and be unable to return? (Almost always a bug.)
- **What does the player see and get told when they arrive too early?** A gate that says nothing is a wall.

---

## Boss cadence

The gym-and-badge structure is three things bundled: a **difficulty checkpoint**, a **story chapter marker**, and a **capability dispenser**. That bundling is why it works so well — one event advances all three tracks at once. Any replacement structure should still do all three.

Common chapter shape: a town with a distinct identity, a route or two of building, an optional side area, an escalating story thread, then the boss.

Bosses are typically **themed around one attribute** to teach a lesson — the fight checks whether the player diversified, and the theming telegraphs the answer.

**Personalize the boss.** The strongest ones in the genre are people the player already met somewhere else doing something unrelated. Cheap to write, disproportionately effective.

Level pacing rises steadily with a jump near the end. Under-leveling should be recoverable through play, not grinding. **The test: could a player who fought every trainer on the way, and no more, win this? If not, the numbers are wrong.**

---

## Towns and routes

Towns are the genre's punctuation — services, story, and a breath between challenges. Each should be describable in one sentence. If two towns can't be told apart in memory, one of them isn't doing enough.

Route design:

- Routes teach and test **one thing at a time** — a new mechanic, a new terrain, a new threat.
- Optional branches should be **visible but off-path**, not hidden. Hidden rewards reward wikis; visible-but-inconvenient rewards reward curiosity.
- **Trainer placement is pacing.** Spacing them lets the player heal-check between fights; clustering them makes a gauntlet. Both are valid — choose deliberately.
- **Dead ends always contain something.** An empty dead end teaches the player not to explore.
- Vary route *shape*, not just contents. Three corridors in a row is three of the same route wearing different tiles.

---

## Encounter tables and roster design

- **The player should have a plausible team by mid-game without grinding.** Count what's obtainable before the third boss and check that a reasonable player can build something functional and varied.
- **Rarity is a pacing tool.** A 5% encounter is a hook for players who want it and invisible to those who don't. A 5% encounter that's *required* is a wall.
- **Early availability shapes the whole playthrough.** Most players stick with what they caught first, so the first two hours effectively are the game's team.
- **Coverage exists before it's needed.** If a boss demands a counter, the counter must be obtainable earlier, on a path the player was likely to take.
- **Distinctive beats balanced.** Players remember the odd one.
- A useful default table shape is **eight entries at roughly 4 common / 3 uncommon / 1 rare** per method on a map. It's enough variety to feel alive and few enough to author.

---

## Difficulty

Difficulty in this genre is mostly about **information and preparation**, not execution. The player wins by knowing what's coming and building for it.

- **Telegraph hard fights.** A tough battle walked into blind feels unfair; one the player was warned about feels like a challenge they accepted.
- **A save or heal point before anything hard.**
- **A loss should never cost more than a few minutes.**
- **Scripted losses need to be obviously scripted**, or players will grind for hours trying to win one.
- Difficulty options are cheap to add early and expensive to retrofit. If they're wanted at all, decide before the first boss is authored.

---

## Story delivery in a 2D world

The medium delivers narrative through a small set of channels. When designing a beat, assign it to one:

| Channel | Best for | Weakness |
|---|---|---|
| NPC dialogue | World texture, rumor, foreshadowing | Easy to skip; players don't talk to everyone |
| Triggered cutscene | Plot beats that must land | Removes agency; overused is tedious |
| Map change | Consequence made visible | Only works if the player revisits |
| Battle | Character conflict, escalation | Limited emotional range |
| Item or text description | Lore, optional depth | Entirely opt-in |
| Environmental detail | Tone, atmosphere | Slow; unreliable as sole delivery |

Rules of thumb:

- **Anything the plot depends on needs a channel the player cannot skip.**
- Optional content should reward the player who seeks it without punishing the one who doesn't.
- **A change the player caused should be visible when they return.** This is the cheapest and most consistently underused way to make a world feel responsive.
- **Seed a reveal before it lands.** A twist that wasn't foreshadowed reads as arbitrary. If a beat depends on a reveal and nothing earlier set it up, that's a problem to fix in the earlier area, not in the reveal.

---

## Systems design

Before proposing any new system, run it against these:

- **What decision does this change for the player?** A system that changes no decision is decoration.
- **What already answers this?** New mechanisms built beside existing ones that nearly did the job are the most common source of quiet rot.
- **What are the boring parts?** Boundaries, zero, maximum, two effects at once. Systems break at their edges, and the edges are what the request has to specify.
- **What does the player see, and where?** A system they can't observe can't be reasoned about.
- **How is it introduced, and what happens to a player who ignores it?**
- **Can it be exploited, softlocked, or made degenerate?**
- **What's the minimum version that's still the real thing** — not a stub?

---

## Scope realities for a solo developer

Worth raising honestly whenever scope creeps:

- **Content is the cost, not code.** A new system is a weekend. Forty maps of hand-placed content is months.
- **Every branch multiplies content.** A choice with two outcomes doubles the writing for everything downstream that acknowledges it.
- **The most commonly abandoned point is mid-development** — after the systems are exciting and before the content grind ends. Sequencing so a playable slice exists early is protective.
- **Cut features leave holes.** If something gets cut, the things that referenced it need cutting too. This is what a decisions log is for.
- **The first instance of anything costs ten times the second.** The first town, the first boss, the first item family. Budget accordingly and treat the first one as a pattern-setting exercise.
