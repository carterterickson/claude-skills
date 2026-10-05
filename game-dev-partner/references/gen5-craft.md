# Gen 5 craft — what makes Black/White feel the way it does

Read before any conversation about the visual style, the camera, map structure, battle presentation, seasons, or the level curve.

These are craft facts and the reasoning behind them. The reasoning is the useful part — knowing *why* something works tells you when breaking it is a good idea. Numbers are from the DS originals and are a target to design against, not a rule.

**Contents:** [The specs](#the-specs) · [The 2.5D look](#the-25d-look) · [Battle sprites](#battle-sprites-the-cheapest-big-win) · [Seasons](#seasons) · [Map grammar](#map-grammar) · [Level curve](#the-level-curve) · [Story structure](#story-structure) · [B2W2 systems](#the-b2w2-systems-worth-stealing) · [Text and UI](#text-and-ui) · [What to avoid](#what-gen-5-got-wrong)

---

## The specs

| Thing | Gen 5 value | Why it matters to you |
|---|---|---|
| Screen | 256 × 192 per screen, two screens | A one-screen game should target something in the 320×180–384×216 range and integer-scale it |
| Tile | 16 × 16 px | The right default. Most free asset packs are 16×16, which maximizes what you can use |
| Character height | ~36 px, i.e. ~2.25 tiles | Characters taller than they are wide, occupying more than one tile vertically, is the whole look |
| Walk cycle | 3 unique frames per direction, played 1-2-3-2 | Four directions × 3 frames = 12 cells per character. This is the unit of art cost |
| Battle sprite canvas | 96 × 96 px | |
| Colors per sprite | ~15 + transparency | A hard palette cap is what makes amateur art look coherent — see `art-direction.md` |
| Overworld framerate | 30 fps | Pixel animation *wants* to be choppy. Play walk cycles at 8–12 fps |
| Battles / menus | 60 fps | |
| Map authoring chunk | 32 × 32 tiles | A useful unit for laying out an area |

---

## The 2.5D look

Gen 5's maps are actual low-poly 3D geometry with pixel-art textures, and the characters are flat sprites standing in that space always facing the camera. That's why buildings converge with distance, why Castelia feels tall, and why it doesn't look like Gen 3.

**You almost certainly should not build it that way.** The look mostly comes from two things you can get much more cheaply:

1. **Three-quarter perspective art.** You see the tops of floors *and* the faces of walls. This is an art decision, not an engine one, and it's most of the difference.
2. **A camera that changes per area.** This is the real trick and it's underused. Skyarrow Bridge, Castelia's streets, the desert, Village Bridge — each drops or rotates the camera so the player walks *into* the frame rather than across it. Treat camera angle, distance and pitch as **level data authored per map**, not a global constant. Even in a purely 2D engine, a per-map zoom level and a slight vertical offset buys a surprising amount of this.

If they do want real perspective, the honest cost is that every tile becomes geometry and every asset pack becomes incompatible. Name that before they commit.

---

## Battle sprites: the cheapest big win

Gen 5's creature sprites animate constantly during battle. The structure is worth copying exactly because it's cheap and it's most of why the games feel alive:

- A short **common idle** loop, played three times
- Then one **rare personality animation** — a stretch, a blink, a shake
- Both start and end on the neutral pose, so they cut together seamlessly
- Roughly **10 fps**, frames held ~100 ms
- **Animation slows as HP drops** and under status. Nothing else in the genre communicates "this thing is hurt" so wordlessly
- Built as **puppet animation** — parts translated and rotated rather than redrawn per frame. A non-artist can do this; redrawing 8 frames of a creature by hand, they cannot

The shading in Gen 5's battle sprites is deliberately **flatter** than Gen 4's, to keep motion legible. Flatter is also easier to draw. Take the win.

---

## Seasons

Four seasons cycling **monthly**, so the full cycle runs three times a year. Driven by the real clock.

The engineering detail that makes it feasible: **seasons never change while you're standing outside.** They only flip on a loading transition — leaving a building, crossing between areas. That makes the season a per-map-load constant instead of a live world mutation, which is an order of magnitude less work.

What changes with the season in Gen 5: encounter tables and rates, some creature forms, **which terrain is passable** (fallen leaves opening a route in autumn; puddles freezing into walkable ice in winter; a sewer draining), which NPCs appear, and layered music.

**The craft lesson:** seasons that only recolor the grass feel like a gimmick. Seasons that open a path feel like a world. If a solo project can only afford one seasonal consequence, make it a reachability change on one route — that's the one players remember.

---

## Map grammar

### The region shape

Unova isn't the classic branching tree hanging off a home town. It's a **loop**: the path leaves the starting corner, runs up one side, crosses the top, and comes back down the other side near where it started, with rivers dividing it and **bridges stitching it together**.

> **The Ring Region.** Lay the critical path as a near-closed circuit. Because it returns near the start, late-game backtracking is cheap and the world reads as a *place* rather than a corridor.

### Five repeatable patterns

**1. The bridge as chapter break.** A long, camera-tilted, encounter-free traversal separating story acts. Costs almost nothing mechanically and does enormous pacing work — the player *feels* the region change. The single highest value-per-effort structure in the generation.

**2. The open-field route.** A wide non-corridor area with a weather or terrain gimmick, optional side branches, and its own encounter table. Deliberately contrasted against the corridor routes on either side. Variety in route *shape* matters as much as variety in route contents.

**3. The district city.** Gen 5's biggest city is six named streets meeting at a central plaza, plus five piers. The gym is on its own street, so **finding the gym is itself navigation**. Split a major city into 4–7 named sub-maps hanging off a plaza, put the objective at the end of one branch, and give each other branch services, flavor, and one hidden thing. That turns a city from a menu of buildings into a small level.

**4. One interior does three jobs.** Heal, shop and storage all live in the same building on the same floor. Halves interior authoring cost and players prefer it.

**5. Elevation as spectacle.** Vertical layering — a city of towers, a mountain that twists, a river running under a bridge you can also walk on. Even faked, height is what makes an area memorable.

### The sequel trick, if a project ever gets that far

Black 2/White 2 reused the same region and made it feel new by **rerouting rather than rebuilding**: move the starting point to a new corner, add two new wings, insert two or three new interiors into existing maps, demote the original opening town to post-game, and block one old path. Enormous perceived novelty for modest content cost. Worth knowing as a pattern for expansions, not just sequels.

---

## The level curve

The most useful concrete numbers in this file. Gym aces in Black/White:

| Gym | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | E4 |
|---|---|---|---|---|---|---|---|---|---|
| Ace level | 14 | 20 | 23 | 27 | 31 | 35 | 39 | 43 | 50 |

**Read out of it:** a near-perfectly linear ramp of about **+4 levels per gym**. Party size grows from 2 to 3 at gym 3. The Elite Four sits **+5 above the last gym** and is a **flat wall** — all four the same level — so the player can pick their order.

B2W2 opens slightly lower (13) and ends much higher (51), with a deliberate **+9 jump between gyms 6 and 7** that marks where the story turns. That's the technique: an uneven step in an otherwise even curve is a pacing signal the player feels without noticing.

**The test that matters more than the numbers:** could a player who fought every trainer on the way, and no more, beat this boss? If not, the numbers are wrong. Grinding as a *required* activity is a design failure, not a difficulty setting.

---

## Story structure

Black/White's boldest structural move: **it replaces the champion fight in the main story with the antagonist.** You beat the Elite Four, the villain's castle erupts through the league, and the final two fights are the villain's son and then the villain. The official champion is only fought in the post-game, more than twenty levels higher.

> **Antagonist as final boss.** Route the league's last chamber into the story climax. It costs one map and buys the entire narrative payoff. Keep the "official" champion as a post-game wall at a much higher tier.

The other bold move: **only new creatures until the post-game.** 156 of them, no returning species. The stated reasoning was to level the field so that experienced players couldn't lean on known-good picks, and to make it feel like a brand-new game. It was polarizing at launch and is now widely regarded as the generation's best decision.

**For an original game this is free** — every creature is new by definition. What's worth taking is the discipline underneath it: **the first two hours effectively decide the player's team**, because most players stick with what they caught first. Design early availability with more care than late availability.

---

## The B2W2 systems worth stealing

Each is a self-contained module with a good shape:

**Difficulty modes.** Challenge mode raised trainer levels by +1 early rising to +5 late, gave gym leaders and the Elite Four one extra creature each, and improved their movesets and held items — but **kept stat calculations on the normal-mode level**, so it's a move-access and pressure change rather than raw inflation. That's a smart, cheap design. (What they got wrong: locking it behind owning both versions and two consoles. Ship the modes as selectable.)

**The endless tower.** Ten procedurally-assembled areas, floors growing from a 3×3 grid to 4×4, trainer counts scaling 8 to 24, levels from the high 40s to the 70s. Bag items disabled, held items allowed. A random "gate trainer" per area unlocks the boss room. This is the cheapest post-game content that exists — it's a generator, not authored content.

**The town you build.** Up to eight shops, opened by inviting visitors, ranked 1–10 with visual upgrades at ranks 4 and 8. Excess points above a threshold are discarded, deliberately, to stop hoarding. A good model for any "your own space" system.

**The movie studio.** A scripted battle where you pick dialogue between turns, damage rolls are always maximum, and the opponent follows a script — so it's a *puzzle wearing a fight's clothes*. Three ending tiers, including a "strange" ending for deliberately going off-script that's worth the most points. Worth knowing because it demonstrates reusing the battle engine for something that isn't a battle.

**Medals.** 255 achievements across five categories, awarded on request from an NPC rather than automatically. Cheap to author, and the "go ask for them" framing gives a reason to talk to someone.

**Memory link.** Optional flashback scenes bridging the previous game and this one. If a project ever has a sequel, this is how to reward the returning player without gating the new one.

---

## Text and UI

Design against the geometry rather than trying to match exact original values:

- 256 px wide, ~8 px margins → **~240 px of usable text width**
- A variable-width pixel font averaging ~6 px per glyph → roughly **35–40 characters per line**
- Two lines per box at a 16 px line advance, plus padding → a box about **48–56 px tall**, a quarter of the screen height

Those reproduce the feel regardless of the originals. Gen 5 uses a **proportional (variable-width) pixel font**, which is why its text looks less blocky than Gen 3 — worth knowing, because a fixed-width font is the fastest way to accidentally look two generations older.

Conventions: character-by-character reveal, hold to fast-forward, a blinking arrow at page end, text speed in the options menu. **A blank line inside a dialogue string starts a new text box** in most systems worth building — which means the pacing of a conversation is a design decision that gets written into the string. Write those breaks deliberately.

Gen 5's second screen held a persistent, skinnable dashboard with a handful of large touch targets. A one-screen game's version of that is a toggleable overlay panel — and the lesson is that giving it a *name* and a visual identity is what made it feel like a thing the character owned rather than a menu.

---

## What Gen 5 got wrong

Worth knowing because these are the traps a project imitating it will walk into:

**Linearity.** The most consistent criticism, and the direct cost of the story-forward structure. If the story is on rails, give the player *something* to choose — team, order of optional content, side areas — or the whole middle of the game feels like being led.

**Too small a usable roster.** 156 new creatures felt limited next to earlier games' 200+. For an original project the practical version is: count what's obtainable before the third boss and check that a reasonable player can build a functional, type-varied team without hunting. If they can't, the roster is too thin *where it matters*, regardless of the total.

**Content locked behind hardware.** Difficulty modes needing two cartridges; online features that stopped existing when servers shut down. Anything on the critical path that depends on something outside the game is content that will one day be gone.

**Required traversal abilities that clutter the player's loadout.** The genre's oldest complaint. The modern solution is to decouple traversal from the creature's move slots — an item, a key item, a permanent unlock, a companion. If the project does that, it's the right call and worth saying so.
