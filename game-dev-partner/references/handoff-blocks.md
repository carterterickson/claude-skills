# Handoff blocks

Everything that crosses to Claude Code is a block the designer pastes without editing. Four kinds.

**Contents:** [Recon](#1-recon) · [Read / check](#2-read--check) · [Build](#3-build) · [Fix](#4-fix) · [Rules for all four](#rules-that-apply-to-all-four) · [Presenting a block](#presenting-a-block)

---

## Blocks have no length limit

**Write the block as long as it needs to be. Longer is usually better.**

The designer never reads these — that's the whole arrangement. So none of the reasons to be brief apply, and the reason to be exhaustive is the strongest one there is:

> **Every detail the block leaves out is a gap Claude Code fills.** It fills it plausibly, confidently, and with something reasonable that isn't what the designer pictured. That is the single failure this skill exists to prevent, and it happens in exactly the places where a request stopped short.

So when there's a choice between stating something and assuming it's obvious, state it. The line that felt redundant to write is the one that stops a door opening the wrong way.

**Detail means specifics, not volume.** These are different, and padding a block helps nobody:

| More of this | Not this |
|---|---|
| Every coordinate, every facing, every tile | Restating the same instruction three ways |
| Every line of dialogue, verbatim, with its box breaks | A preamble explaining what a request is |
| Every condition, every flag, every value | Telling Claude Code how to write the code |
| The too-early state, the loss state, the second-visit state | Filler that makes it look thorough |
| What happens at the boundaries — zero, maximum, both at once | Repeating the conversation back |
| The exact check, and the question it's really asking | |

**Two things stay bounded, and neither is about length:**

- **One system, one sitting.** That limits *what goes in* the block, not how thoroughly it's described. A tightly-scoped request described exhaustively is the target. A sprawling request described briefly is the failure.
- **Never instruct on implementation.** Files, functions, tests, commits and refactors are Claude Code's. Being exhaustive about the design is not a licence to start writing the code.

**Say so when a block is long.** One line above it — *"this one's long because it has all nine characters' dialogue in it"* — so the designer knows the size is deliberate and not something they need to read.

---

## Universal shape

```
=== [WHAT THIS IS, IN CAPS] ===

[the content]
```

Fenced in a code block in chat so it's one click to copy. Header in caps because it's the first thing Claude Code reads and it sets the mode.

---

## 1. Recon

Sent once, at the start of working with an existing project. Its whole purpose is to make future asking unnecessary — it produces a document the session works from all the way through, and that the project keeps.

```
=== PROJECT BRIEF — READ THE PROJECT, WRITE ONE FILE ===

Don't change any code, data, or assets. The only file you should create
is the one named below.

Write a file called PROJECT-BRIEF.md at the root of this project, then
paste its full contents back to me. It's a working reference for someone
who designs this game but does not read code, so write it for a reader
who knows the game and not the codebase.

Cover, with real measured values rather than recollection:

1. WHAT THIS IS. Engine, language, how it's run, how it's built, roughly
   how large. One paragraph.

2. HOW TO CHANGE THE GAME'S CONTENT. For each of these, the file (or
   files) and the exact shape of one real entry, copied verbatim:
   maps/areas, characters/NPCs, dialogue, creatures/species, items,
   encounter tables, story events or cutscenes, shops. Say which of
   these don't exist yet.

3. THE VOCABULARY. Every field name that appears in that content data,
   what it does, and what values it accepts. This is the part I'll use
   most — be complete rather than brief.

4. HOW STATE WORKS. How the game remembers what the player has done —
   flags, variables, save data. Name the mechanism and show one real
   example of something being set and something being read.

5. WHAT EXISTS RIGHT NOW. Counted, with how you counted: number of
   maps/areas, number of characters, number of creatures, number of
   items, number of story events. List the map names and the creature
   names in full.

6. ART AND AUDIO. Tile size, character sprite dimensions, frame counts,
   where assets live, what naming convention they follow, what's
   placeholder and what's final.

7. THE RULES OF THIS PROJECT. Any conventions in CLAUDE.md, a README,
   or enforced by tooling. Anything a change here has to obey.

8. WHAT'S HALF-DONE. Anything visibly incomplete, stubbed, or marked
   TODO. Be blunt.

Measured numbers with the method. Anything from recall, label it as
recall. If something can't be answered without changing a file, stop
and say which.
```

**Note the header.** This block writes one file, so it can't honestly claim to be read-only. Don't label it that way — a block that says "change nothing" and then asks for a file is contradicting itself in its first two lines, and an instruction that contradicts itself is one Claude Code has to pick a side on. Name the single exception instead.

**Adapt it.** If the designer already said it's a Godot project, don't ask what engine it is. If they've pasted a map file already, drop that from section 2. The block is a template, not a liturgy.

**For a brand-new project there's nothing to recon.** Go straight to the foundation sequence in `orientation.md`.

**Keep it current.** When later build requests change the shape of the data, have them update `PROJECT-BRIEF.md` as part of the same request. A stale brief is worse than none because it's trusted.

---

## 2. Read / check

A fact, a count, or a question the code can answer that neither side can.

The difference that matters: these must be **explicitly read-only**, because a message pasted into a coding agent that's ambiguous about whether to act will sometimes get acted on, and a design conversation should never quietly change the repo.

```
=== READ ONLY — WHAT I NEED FOR THE HARBOR TOWN SESSION ===

Change nothing. This is a read.

1. The `oldport` entry from src/data/maps.js, verbatim.

2. Which flag the intro scene sets when the player is given their first
   creature. The name exactly as written.

3. Whether the oldport grid contains any tall-grass cells, and if so
   roughly where they sit relative to the spawn point. Count them — a
   truncated console read is not a read.

4. Whether the variant system can change tiles on a map built from a
   drawn image rather than from tiles. If the answer is "not as things
   stand," say what it would take rather than how hard it is.

Measured numbers, with how you measured them. Anything from recall, say
so. If any of this can't be answered without changing something, stop
and say which one.
```

### Rules for writing one

**Say read-only at the top and in the first line.** Both — the header gets skimmed.

**Number the asks.** One paste, one numbered reply, in an order that maps back.

**Ask for the shape you want back.** *Verbatim* for a small entry. *Counted, with the method* for anything large. If the honest answer would be enormous, say which part matters — a wholesale file dump is worse for the designer than a targeted excerpt, because they have to carry it back.

**Ask the question the game asks.** Not *is this tile walkable* but *is it reachable by walking from the spawn*. Not *does the exit exist* but *does it fire when you walk into it from the direction the player would come from*. Most bad answers here are true statements about the wrong question.

**Where an answer would change the design, say which way.** *"If variants can't reach a drawn map, the fallback is putting people at the four exits, and I'd rather know before designing four blockers."* That tells Claude Code which part of its answer is load-bearing.

**Invite the answer "your check is wrong."** Sometimes the question is malformed rather than the code being broken. Say so explicitly; it happens constantly and it saves a wasted build.

### When to send one

**Don't block on it.** Emit it, keep designing the version that doesn't depend on the answer, name the alternative.

**Batch.** Questions that arise ten minutes apart go in one block if the session is still going. Three pastes for three facts is exactly the friction this feature removes.

**Weigh the cost.** Some answers take a minute, some take a sitting. If a question is expensive and the design can proceed without it, note it as something to settle before building rather than sending an errand now.

**Don't send one for something already given.** Check the conversation and the brief first.

---

## 3. Build

The main event. Numbered sections, caps headers, one system per request.

```
=== 1. HARBOR TOWN — LAYOUT AND PEOPLE ===

This is the third town and the first one on the water. It should feel
older and more worn than the two before it — the player has just come
off a long route and this is where they get a breath, a shop that
finally sells something useful, and the first hint that the storm plot
is real. Nobody here is hostile.

[THE REALIZED DESIGN — see below]

DO NOT build the lighthouse interior or the boat that leaves from the
pier. Both are the next request and both depend on how this one lands.

This is the first coastal town, so propose the tile layout before
applying it — it sets the pattern for the two that follow.

HOW TO CHECK IT
- Start a new game, get through the intro, and travel north to the
  harbor. You should arrive at the south gate facing north, with the
  water on your right.
- Walk into the shop. It should have healing items and balls in stock,
  and nothing else.
- Talk to the old man at the north end of the dock. He should mention
  the storm. Talk to him again — he should say the same thing.
- Try to walk onto the pier. You should be blocked, and the fisherman
  should say something about it rather than nothing.

Report anything the checks or guards catch, including nothing.
```

### What "realized" means

The test is not *"is this unambiguous."* It's **could the designer read this and recognize the thing they pictured?** That means detail they didn't type, generated by doing the reading they'd otherwise do, and approved by them in the conversation.

**Space and sight.** Where does each thing stand, on which tile, facing which way? What notices the player, and from how far? What draws in front of the player and what draws behind — this is the layer that most often makes a finished area feel wrong despite every element being present. Where does the player arrive?

**Words, verbatim.** Every line of dialogue written out, with the breaks placed deliberately where a new text box should start. Paraphrased dialogue gets rewritten in Claude Code's voice rather than the designer's. Lines drafted in the conversation and approved are fine. Lines invented at write-up time are not.

**Numbers, stated with their source.** A level that comes from a formula says so. A level that's a deliberate choice states the number, because difficulty is the designer's call.

**Conditions, in the project's own state vocabulary.** Every flag or variable read or written, where it's set, what depends on it, whether it's one-way.

**The too-early state.** For anything gated: what the player sees and is told when they arrive before the condition is met. A gate that says nothing is a wall.

**The missable check.** Any design that removes a character, closes a route, or ends a scene, checked against whether something one-of-a-kind can now be permanently lost.

### The line to hold

**Specify what the player experiences and what the data must say. Never specify how the code says it.**

The game's own content vocabulary — field names, flags, tile layers, table shapes — is *design* here, not implementation, because it's the shared language and precision in it is precision about the game. Everything past that is Claude Code's: which functions get written, how it's tested, how it's committed, what to refactor.

One exception: **if a design depends on a mechanism that already exists, name the mechanism.** Not to direct the implementation, but because a design expressed in terms of something already built won't get rebuilt beside it.

### Five things every build block carries

1. **The intent, first.** Two or three sentences on what this is for. It shapes the hundred decisions the request can't enumerate.
2. **A DO NOT, with its reason.** The adjacent thing that would seem natural to build alongside. This is the highest-value line in the whole block.
3. **A proposal demand, if it sets a pattern.** *"Propose the layout before applying it."*
4. **How to check it, in plain language.** Concrete actions with observable results. This is the only way a non-coder verifies anything.
5. **A `WRITE THESE DOWN` section**, whenever the session parked an idea, noticed a problem, made a decision, or raised a question. This is how the framework stays current without ever spending a turn on bookkeeping — see `framework.md` for the wording. A session that produced three parked ideas and shipped a block without them has already lost them.

### Sizing

One system, one sitting. If it can't be finished in a sitting, split it and sequence it — additive parts first, so the pieces that can't break a working game land before the pieces that can. Every request should leave the game playable.

Multiple numbered sections in one block are fine when they're genuinely one sitting's work and they belong together. Four unrelated systems is four requests.

---

## 4. Fix

Something came back wrong, or the designer played it and it isn't right.

```
=== FIX — THE DOCK GUARD BLOCKS THE WRONG DIRECTION ===

Playing it now: walking north onto the pier is blocked as intended, but
walking back south off the pier is also blocked, so once you're past him
you're stuck until you use the menu to warp out.

What should happen: he stops you going north until the storm clears,
and never stops you going south.

Everything else about him is right — his position, his lines, and the
fact that his lines change after the storm. Don't touch those.

Reproduce it first so there's something real to fix, then fix it, then
show me the reproduction failing before and passing after.
```

**Name the bug in the shape it really had.** Not *"the guard's direction check is inverted"* — that's a guess at the cause, and a wrong guess sends Claude Code somewhere useless. Describe what the player did and what happened. Cause is Claude Code's job.

**Say what stays.** The parts not mentioned are the parts most likely to get rewritten by accident.

**Ask for the failure to be reproduced first.** A fix that was never seen failing is a fix that might be fixing nothing.

---

## Rules that apply to all four

**Never reference the conversation.** *"Like we discussed"* and *"the design above"* mean nothing on the other side. Every block is self-contained.

**Never reference a file the designer would have to find.** If the block needs a map's current contents, either it's already pasted in the conversation and goes in verbatim, or the block tells Claude Code to go read it.

**Write in the designer's register, not a spec-document voice.** These are messages from the person who owns the game. *"Nobody here is hostile"* is better than *"NPC hostility parameter: false."*

**Report what the guards catch, including nothing.** A closing line worth having on build and fix blocks — silence about checks is indistinguishable from checks not running.

---

## Presenting a block

Above the block, in plain language and briefly: what it does and — if it's a read — what changes depending on the answer.

Below it, only if useful: what to expect back, and the reminder that whatever comes back can be pasted straight in without trimming.

Don't explain the block line by line, and don't apologize for its length. It's dense on purpose; the summary is what they're approving and the document is how Claude Code receives it. Three or four sentences:

> This places nine people around the harbor with all their lines, puts the shop where you'd expect it coming in from the south, and makes the pier impossible to walk onto until the storm plot starts — with the fisherman saying why, rather than an invisible wall. It doesn't build the lighthouse yet.
