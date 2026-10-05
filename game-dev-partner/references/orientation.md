# Orientation

Two branches. Ask which one, then follow it.

**Contents:** [Existing project](#existing-project) · [New project](#new-project) · [Stack](#the-stack-recommendation) · [Foundation sequence](#the-foundation-sequence) · [Repo layout](#repo-layout) · [Git safety](#git-safety-for-someone-who-doesnt-read-code) · [CLAUDE.md](#the-projects-claudemd)

---

## Existing project

Send the recon block from `handoff-blocks.md`. It produces a `PROJECT-BRIEF.md` the whole session works from.

Before sending it, trim it against what's already known. If the designer opened with *"I'm building a Pokémon-like in Godot and here's my map file,"* the block shouldn't ask what engine it is or what a map looks like.

When the brief comes back:

1. **Say back what the project is, in three sentences, in plain language.** *"So: it's a Godot game, you've got six areas built, twelve creatures, and the story stops after the first town. Maps are text files you could read yourself. There's no sound at all yet."* A wrong reading gets caught here in ten seconds instead of an hour later.
2. **Name the two or three things that stood out** — something half-done, something inconsistent, something that will constrain what they want to do next. Not a full audit. Two or three.
3. **Ask what they want to work on**, if they haven't said.

Don't editorialize about code quality. They can't act on it and it isn't the point.

**If the brief reveals something genuinely structural** — content is hardcoded rather than in data files, there's no save system, the art is at three different tile sizes — say it plainly, say what it will cost them later, and propose the smallest fix. Then let them decide when. Don't hijack the session into a refactor they didn't ask for.

---

## New project

Resist the urge to pick an engine in the first message. What the game *is* determines a lot of it, and a fifteen-minute conversation here saves months.

**Ask what already exists before anything else.** "Nothing built" almost never means "nothing exists." Two years in someone's head usually has a doc, a name list, sketches, a folder of sprites, a playlist. Get it into the conversation and design with it rather than beside it — and if it's substantial, the first build block's job is partly to get it *into the project* as `docs/` material rather than leaving it scattered.

Then get to these, conversationally, one or two at a time — not as a form:

- **What's the game?** One or two sentences. If they can't, that's the first thing to work on and it's a good use of the session.
- **What's the smallest version that's still the real thing?** Not the full vision. The slice that proves it.
- **Where do people play it?** Browser link, downloadable app, phone. This is the single biggest input to the stack decision and they'll usually have an instinct.
- **What already exists?** Sketches, notes, a Google Doc of species, art they've bought or drawn, music. Ask, because a designer with three years of notes and a designer starting from a blank page need very different first sessions.
- **How much time, realistically, per week?** Not to judge it — to size everything downstream. Five hours a week and twenty-five hours a week are different games.

Then, and only then, recommend a stack.

**Say the IP guardrail once, in this first session, in two or three sentences.** It never survives being deferred — the project accumulates assets, the vocabulary sets, and by the time it comes up there's something to unpick. It's short: what gets fan projects taken down is assets and names, not mechanics; original creatures and original words are the whole requirement; and the capture verb is worth designing rather than copying. Details in `production.md`. This is not a paragraph to cut when a reply is running long — it's two sentences and it's load-bearing.

---

## The stack recommendation

**Default: Godot 4.x with GDScript.** For a solo designer directing an AI agent on a 2D pixel RPG, it's the right answer for one specific reason worth explaining in plain language:

> Everything in a Godot project is a text file — the scenes, the settings, the scripts, all of it. That means Claude Code can read and change any part of your game directly, and it can run the game and read its own errors without you doing anything. Most other engines keep the project in a format only their own editor can open, so the agent is working blind and you end up being the one clicking around.

Also true and worth mentioning: free forever with no revenue cut, exports to browser and desktop, and there's a large body of 2D RPG example code.

**The honest alternative: a web game in TypeScript** (Phaser, or hand-rolled). Pick this if the game is browser-only and they never want to touch an editor window at all — it's the one option with literally no GUI in the loop, and the agent can test it in a headless browser. The cost is real: you build everything yourself, including menus, saving, and the entire battle system, and the designer has no way to see or nudge the game except by asking the agent.

**Say no to these, briefly, if they come up:**

| They ask about | The short honest answer |
|---|---|
| **Unity** | Good 2D tools, but the project can't run without opening the editor, and the scene files are hostile to editing. That breaks the agent's read-change-run loop, which is the thing making this whole arrangement work. |
| **RPG Maker** | Its saved data is machine-generated and unreadable, and its built-in battle system is a party JRPG, not a monster-catching one. You'd fight it the whole way. |
| **GB Studio** | Lovely tool, wrong target — it makes Game Boy games. Pokémon Red, not Pokémon Black. |
| **Pokémon Essentials** | Built on a 2005 Windows-only tool, hasn't had a release in years, and it was taken down by Nintendo specifically because it bundled Nintendo's assets. Building on it is building on sand. |
| **A decompiled ROM** | That's modifying Nintendo's actual game, not making yours. Different project, different legal position, much harder toolchain. |

**Hold this lightly.** If they've already picked something, work within it completely and don't re-litigate. If they push back, the concern gets stated once in a sentence and then it's the plan. A designer who is excited about their tool and shipping beats a designer using the technically better tool and demoralized.

### Two Godot specifics worth putting in the project's rules on day one

These are the two things that reliably go wrong, and both are cheap to prevent:

1. **Version drift.** Most tutorials and a lot of model training data are Godot 3, and Godot 4 renamed a great deal. Put a line in `CLAUDE.md` naming the exact version in use and telling Claude Code to check the current docs rather than trusting recall.
2. **Run it every time.** *"After every change, run the project and read the errors before reporting done."* This single rule is worth more than any other instruction in the file, because it turns a guess into a verified result.

---

## The foundation sequence

For a new project, don't design content before there's something to put it in. The goal of the first two or three sessions is **a character walking around a map** — the smallest thing that's unmistakably a game.

Sequence it as separate build blocks, one per turn:

1. **Set it up.** Project created, version control started, folder structure, a `CLAUDE.md` with the project's rules, a `PROJECT-BRIEF.md` stub, and `docs/PLAN.md` carrying whatever the designer already had — their notes, creature list, region sketch, names. Ends with: the empty project runs and shows a blank window, and everything that was in their head or in a Google Doc now lives in the project.
2. **A character on a map.** One small hand-made area, one character sprite, four-direction movement, collision. Placeholder art is correct here — use a free pack or colored rectangles. Ends with: they can walk around and bump into things.
3. **Rooms and doors.** A second area and a working transition between them. Ends with: they can walk from one place to another and back.
4. **Talking.** A character standing somewhere who says something in a text box. Ends with: dialogue works.
5. **Remembering.** The state mechanism — whatever the game uses to know what the player has done — plus a save and load. Ends with: something changes after you talk to someone, and it's still changed after you quit and reload.

After step 5 they have an engine for their game, and every content session from then on is adding to it rather than building it.

**Whatever the game's central system is — the battles, the catching, the collection — that's step 6, and it's the first thing worth spending real time designing.** Everything before it is scaffolding and should be built as fast as possible.

### Data-driven, from the first line

The single most important architectural call, and it's really a design call, so it belongs to this skill:

> **Every piece of content lives in an editable data file, not in code.** Species, moves, items, maps, dialogue, encounter tables, shops. A plain-text format the designer could open and read even if they'd never write one.

Put this in the very first build block and in `CLAUDE.md`. The reason to explain: content is where the years go in a game like this. If adding a creature means editing a code file, every single addition is a round trip through Claude Code. If it's a data file, the designer can eventually add fifty of them in an afternoon, and Claude Code's requests get smaller and safer.

---

## Repo layout

Propose something like this early and put it in `CLAUDE.md` so it stays true. The specifics matter less than having it decided:

```
game/
  data/          species, moves, items, maps, dialogue, encounters, shops
  assets/
    sprites/     characters, creatures, effects
    tiles/       tilesets
    ui/          frames, icons, fonts
    audio/
      music/
      sfx/
  src/           the code (Claude Code's territory)
  docs/
    PLAN.md              what the game is, the milestones, what's next
    BACKLOG.md           ideas raised and parked, numbered
    BUGS.md              things noticed, not yet fixed
    DECISIONS.md         what was decided and what was rejected
    OPEN.md              questions not yet answered
    STYLE.md             the art and text style bible
    CREDITS.md           every asset: source, author, license
  CLAUDE.md      the rules of this project
  PROJECT-BRIEF.md  the fact sheet, kept current
```

**Naming convention, decided once:** lowercase with underscores, category first — `char_player_walk.png`, `tile_harbor_ground.png`, `music_harbor.ogg`, `sfx_door_open.wav`. Sorting groups them, and a name that sorts near its siblings is a name you can find.

**`CREDITS.md` from the first asset.** One row per file: path, source URL, author, license, date acquired. Retrofitting this at release time is where projects discover they legally can't ship. Put it in `CLAUDE.md` as a rule: nothing enters `assets/` without a row.

---

## Git safety, for someone who doesn't read code

Version control is the undo button for the whole project. The designer doesn't need to understand it; they need it running and they need to know the one thing to say when something breaks.

**Set it up in the first build block.** Claude Code handles all of it. What's worth explaining to the designer, once:

> Every time Claude Code finishes something, it saves a snapshot of the whole project. If a change ever breaks something, any snapshot can be restored exactly. This is why it's safe to let it make big changes — nothing is ever really lost.

**The block worth having ready.** When something has gone wrong and the designer is stuck, hand this over rather than trying to diagnose it in conversation:

```
=== PUT IT BACK ===

Something's broken and I want to go back rather than debug forward.

Show me the last few save points with what changed in each, in plain
language — no file names, just what happened to the game.

Then wait. I'll tell you which one to go back to.
```

Three project rules worth writing into `CLAUDE.md`:

1. **Commit before anything large.** A change touching many files, save data, or a system that already works gets a snapshot first.
2. **One line of work at a time.** No long-running parallel branches. A solo designer with an agent doesn't need them and can't reason about them.
3. **Small and often beats big and rare.** A snapshot per finished thing, not per session.

**Don't turn on Git LFS unless there's a real reason.** A pixel-art game's assets are small, LFS is sticky once enabled, and the classic failure — the game builds with every image missing — is genuinely confusing to debug. Revisit only if uncompressed audio or video shows up.

---

## The project's CLAUDE.md

This file is how the project stops re-explaining itself. It should exist from the first session and get added to whenever a convention is discovered.

What belongs in it:

- **What the game is**, in two sentences, so Claude Code's judgment calls point the right way.
- **The stack and its exact version.**
- **The hard numbers** — tile size, sprite dimensions, base resolution, palette. Anything that would break code if it drifted.
- **Where content lives**, and the rule that content goes in data files.
- **The naming convention.**
- **Run it and read the errors before reporting done.**
- **Nothing enters `assets/` without a `CREDITS.md` row.**
- **Anything the designer has said twice.** That's the signal it should have been written down the first time.

Adding to it is cheap and belongs on the end of a build block: *"Add [the thing just decided] to CLAUDE.md."*
