# Production — milestones, scope, and finishing

The hardest part of a solo game isn't any one skill. It's that the project outlasts the enthusiasm, and there's nobody else to hold the line.

**Contents:** [Milestones](#milestones) · [Scope](#scope-control) · [Cutting](#cutting-things) · [Playtesting](#playtesting-without-testers) · [Decision log](#the-decision-log-and-open-questions) · [Motivation](#motivation-and-pacing-the-human) · [IP guardrails](#the-legal-guardrails)

---

## Milestones

Sequence the whole project so that **a playable thing exists early and stays playable**. The most commonly abandoned point in a project like this is mid-development — after the systems are exciting and before the content grind ends. A playable slice is the thing that gets a designer through that stretch.

**The five milestones worth naming:**

1. **It runs.** A character walks around a map. See the foundation sequence in `orientation.md`.
2. **The core loop works once.** Whatever the game is fundamentally about — a battle, a catch, a collection — happens end to end, badly, with placeholder art. This is the moment the project becomes real.
3. **The vertical slice.** One town, one route, one boss, from a fresh save, with real art and real music for that stretch only. **This is the single most important milestone.** It proves the whole pipeline, it's the thing that can be shown to people, and it's where every wrong assumption surfaces cheaply. Everything after it is repetition of a proven pattern.
4. **The playable demo.** The first two to three hours, polished. This is a shippable artifact — a thing that exists in the world and gets feedback. Getting here matters more than most designers expect.
5. **Content complete, then polish.** Everything exists; nothing is good yet. Budget roughly as much time for polish as it feels like it should take, then double it.

**Push back on any plan that doesn't reach a vertical slice.** A designer building all their systems first and all their content second is a designer who will have eleven systems and no game.

---

## Scope control

**Content is the cost, not code.** A new system is a weekend; forty maps of hand-placed content is months. This inversion catches everyone, because systems feel like the hard part.

Useful numbers to hold when scope is being discussed:

- **The first instance of anything costs ten times the second.** The first town, the first boss, the first creature family. Budget for that, and treat the first one as a pattern-setting exercise — get it right, then replicate.
- **Every branch multiplies content.** A choice with two outcomes doubles the writing for everything downstream that acknowledges it. Two branching choices is four worlds.
- **A creature is not one asset.** It's a design, a battle sprite (animated), possibly an overworld sprite, stats, a movepool, a level curve, evolution logic, a dex entry, and a place in an encounter table. Multiply by the roster size before agreeing to a number.
- **Ten hours of gameplay is roughly eight to twelve towns and fifteen to twenty routes.** Say that out loud when someone describes a region.

**When scope creeps, name it honestly and offer the smaller version that keeps the good part.** Not "that's too big" — *"that's about three weeks. The version that's one weekend keeps the reveal and drops the branching, and I don't think the branching is what you liked about it."*

**The realistic size question, asked early:** how many hours a week, really? Five hours a week is 250 hours a year. A game like this is a multi-thousand-hour project at full scope. That math should shape the design from the start, not arrive as a shock in year two. Say it once, kindly, and then help them build the game that fits.

---

## Cutting things

Cutting is a skill and it needs help, because a solo designer is emotionally attached to everything.

**The test: what does the player lose?** Not what the designer loses. Most cut features cost the player nothing because they never knew about them.

**Cut features leave holes.** If something is cut, everything that referenced it needs cutting too — the NPC who mentioned it, the item that enabled it, the area that was built around it. This is exactly what the decision log is for, and it's why a cut has to be written down rather than just done.

**Prefer shrinking to cutting.** A system with four modes becomes one mode. A region with twelve towns becomes eight. The good part usually survives at a quarter the size.

**Never cut the thing that makes the game distinctive**, even when it's the expensive one. Cut the fourth optional side area first. The distinctive thing is the reason anyone would play it.

---

## Playtesting without testers

A solo designer can't see their own game. They know where everything is, so nothing is confusing to them, and they can't un-know it.

**Watch someone play, silently.** One person, thirty minutes, no help and no explanation, in the same room or over a screen share. **Do not tell them what to do, ever, no matter how painful it is to watch.** This is worth more than any amount of self-review, and thirty minutes of it will produce more real problems than a week of thinking.

**Write down where they hesitate**, not what they say afterward. People are polite about games and accurate about confusion.

**Fresh-save regularly.** Playing from a save file 40 hours in hides everything about the opening. The first two hours are where players are lost and are the least-tested part of every solo project.

**Keep a bug list in the repo** — `docs/BUGS.md` — and add to it as things are noticed, so a play session produces a list rather than one immediate detour. It also means a fix request can batch several things.

**The specific things to test that solo devs never do:** starting a fresh game after a big change; doing things in the wrong order; walking backwards through a gated area; talking to someone twice; losing a fight that was meant to be won; and saving, quitting, and reloading at every point where something changed.

---

## The decision log and open questions

Two files that pay for themselves every month.

**`docs/DECISIONS.md`** — what was decided, when, why, **and what was rejected**. The rejected part is the valuable half: it's what stops the same argument being had in six weeks. Format loosely:

> **2026-08-21 — Traversal is item-based, not creature-move-based.**
> Players get a set of tools rather than dedicating move slots. Rejected: the classic move-based approach, because it taxes the team and the whole genre has moved away from it. Also rejected: no traversal gating at all, because the return-to-a-blocked-thing loop is a big driver of exploration.

**`docs/OPEN.md`** — questions raised and not answered, each with **the consequence of leaving it open** and, if there is one, the moment it must be answered by. Give each an id so a request can reference it.

**The rule that makes this work: an open question is never quietly answered.** Not by the designer in passing, not by this skill, and not by Claude Code filling a gap. If a design collides with an open question, name it and stop. If the designer resolves one in conversation, strike it through in place rather than deleting it, with the date and the answer — the history of a decision is usually more useful than the decision.

**Dates come from the actual clock.** Never inferred from a neighboring entry.

---

## Motivation and pacing the human

Not soft stuff. The project's biggest risk is the designer stopping.

**Ship something small, early, to real people.** A demo, a devlog post, a GIF on social media. External feedback is the fuel that carries a multi-year project, and it can't be manufactured internally.

**Alternate hard weeks with easy ones.** After a system that took three sessions, do a session of placing NPCs and writing dialogue. Visible progress is restorative in a way that architectural progress isn't.

**Notice when the sessions get shorter or the enthusiasm flattens.** Usually the diagnosis is one of three things, and each has a different fix:

- **Stuck on something hard** → break it into a smaller first step, or route around it entirely
- **Bored of the current work** → switch to a different discipline for a session; art after systems, dialogue after data
- **The vision drifted and it's not exciting anymore** → stop building and spend a session on what the game is, which is a legitimate and valuable use of the time

**Don't manufacture enthusiasm.** A solo designer with a large project is better served by *"this stretch has no new mechanic for two hours of play"* than by encouragement. Honest assessment is what makes praise mean something when it comes.

---

## The legal guardrails

For an original game inspired by Pokémon. Not legal advice — this is the observable pattern.

**What actually gets enforced against is assets and names, not mechanics.**

The clearest signal in the whole record: Pokémon Essentials — a fan-game toolkit — was taken down not because it implemented Pokémon-like mechanics but because it **bundled Nintendo's actual sprites, music and tilesets**. The mechanics survived; the assets didn't. Fan games that have been removed (some after years of development and a million downloads) carried the Pokémon name, the species, and ripped assets.

Meanwhile the biggest commercial monster-taming lookalike was sued on **patents only** — no copyright claim, no trademark claim — despite obvious visual similarity and enormous sales. That's the loudest possible signal about where the leverage over an *original* game is believed to lie.

**So, the practical rules:**

1. **Zero Nintendo assets.** No ripped sprites, tiles, music, sound effects, fonts or UI. Not as placeholders, not "just for the prototype." This is also why not to build on Pokémon Essentials.
2. **Zero Nintendo trademarks.** No Pokémon, Poké Ball, Pokédex, Gym Leader, species names, character names, or the type-icon designs. Coin an original vocabulary and be **consistent** — a single stray "Pokéball" in marketing copy undoes the rest. Worth building a glossary early and putting it in `CLAUDE.md`.
3. **Mechanics are the safe ground.** Turn-based type-effectiveness combat, badge gating, a capture-and-collect loop, route and town structure, hidden stats. This is not what gets projects removed.
4. **The one genuinely new risk: patents on the specific capture interaction.** Aiming a ball-shaped projectile at a wild creature, determining capture success, creature joins the party — as a literal UX — is contested territory in a way it wasn't a decade ago. **Design a distinct capture verb.** This is also just better creative practice; the capture moment is the most identity-defining interaction in the genre and copying it exactly wastes the best opportunity the game has.
5. **Don't present it as a Pokémon game.** Not "a Pokémon fan game," no derived logo, no marketing that leans on the trademark. It's a monster-taming or creature-collector RPG.
6. **Asset provenance in writing.** `CREDITS.md` with source, author, license and date for every file. If an engine, template or pack is used, check its license *and* what it bundles.

**Raise this early, once, and without drama** — usually during the first conversation about art sources. A designer who knows the rules at the start builds an original game by default; one who learns them in year three has a catastrophe.
