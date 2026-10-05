# Art direction for someone who can't draw

The goal is not to make them an artist. It's to make them a competent **director** — able to say "the outline is inconsistent here" and "these two packs will never sit together" and to give an artist or an agent a spec that comes back right.

**Contents:** [The three strategies](#the-three-strategies) · [Where to get art](#where-to-get-art) · [The numbers to lock](#the-numbers-to-lock-first) · [Palette](#palette-the-single-highest-leverage-rule) · [Sprites and animation](#sprites-and-animation) · [The over/under problem](#the-overunder-problem) · [UI](#ui-with-nine-slices) · [Pixel-perfect rendering](#pixel-perfect-rendering) · [AI generation](#ai-generation-an-honest-read) · [The style bible](#the-style-bible)

---

## The three strategies

**Placeholder-first (the default).** Build the whole game on a free pack and colored rectangles. The rule that makes it work: **lock the grid and the sprite dimensions on day one, treat everything else as disposable.** If the player is 16 wide on a 16px grid with a collision box at their feet, any art can be swapped in later with zero code changes. Projects that lose months are the ones where art dimensions drifted, because tile size is load-bearing for collision, camera, and UI.

One discipline worth insisting on: **make placeholders ugly on purpose.** Flat magenta, cyan, lime. Pretty placeholders never get replaced, and they hide the fact that no palette has been decided.

**Adopt one coherent pack and design what it supports.** The highest-leverage move for a non-artist, and it inverts the usual process: **let the pack constrain the design.** If the pack has no boats, the game has no boats. A game that ships looking like one artist made it beats a game that never ships because a specific sprite was needed. **The single biggest amateur tell is mixed-source art** — three tile sizes, four palettes, three outline conventions on one screen.

**Commission, selectively.** Only the things a pack can never give: the player character, three to five story characters, boss creatures, the title screen. Keep environments from packs.

Rough 2026 pricing worth quoting honestly: competent freelance pixel artists run **$30–60/hr**; a character with a full four-direction walk cycle is **$80–250**; a cohesive tileset for one biome is **$150–600**. A full custom art package for a small RPG is a four-to-five-figure commitment.

When commissioning: give the artist the **style bible** and **a screenshot of the actual game running**, not a mood board. Ask for the layered source file, not just the PNG, or it can never be recolored. Get work-for-hire or an explicit perpetual commercial license **in writing, in the same thread as payment**.

---

## Where to get art

**Genuinely free and safe (CC0 — no attribution required, commercial fine):**

- **Ninja Adventure Asset Pack** (pixel-boy on itch.io) — the best single free starting point for a top-down RPG. 50+ animated characters, 30+ monsters, 9 bosses, 60+ items, 16×16 tilesets, UI, fonts, **plus 100+ sound effects and 37 music tracks**. One pack that solves art *and* audio in a consistent style, which is worth more than a better pack that doesn't.
- **Kenney** (kenney.nl) — everything is CC0, clean and reliable. The Roguelike/RPG Pack is ~1,700 16×16 assets. Style reads slightly toy-like unless re-paletted.
- **OpenGameArt** — filter to CC0. Large, quality uneven. Find one artist whose work fits and take their whole catalogue for coherence.

**Free with real obligations:**

- **Liberated Pixel Cup (LPC)** — the biggest coherent free top-down RPG art body that exists, and the one people most often get wrong. It's dual-licensed CC-BY-SA and GPL, which means **modified LPC sprites must themselves be released under CC-BY-SA with attribution.** The game can absolutely be sold; the art just can't be held exclusively, and a credits file must ship. The **Universal LPC Spritesheet Character Generator** is the killer tool here — mix and match parts, and it auto-generates a credits file listing every author and license for exactly the parts used. Use that file verbatim. Caveat: LPC's 64×64 frames in a semi-realistic style won't blend with 16×16 packs.
- **Paid itch.io packs** — the mainstream path, usually $2–20. **"Free download" does not mean "free to sell with."** A very popular pack's free tier is non-commercial while its paid tier isn't; this catches people constantly. Read the Terms of Use block on the asset page, screenshot it with the date, and file it.

**Do not use:**

- **RPG Maker community resource sites.** Almost all of it is edits and recolors of the RPG Maker built-in assets, which are licensed only for use inside RPG Maker by license holders. An edit of a restricted asset is still restricted, and the artist had no right to grant broader terms.
- Sprite-rip sites, anything Pokémon/Zelda/Final Fantasy-derived, Google Images. Obvious, but the Gen 5 aesthetic makes the temptation strong and this is exactly what gets enforced against. See `production.md`.

**`CREDITS.md` from the first asset**, one row per file: path, source URL, author, license, date acquired. Retrofitting this at release is where projects discover they legally can't ship. Make it a rule in `CLAUDE.md`: nothing enters `assets/` without a row.

---

## The numbers to lock first

These go in the style bible and in `CLAUDE.md`, because changing them means rewriting code:

| Number | Sensible default | Why |
|---|---|---|
| Tile size | **16 × 16** | What most free packs use, so it maximizes the available pool. 32×32 gives more detail and roughly quadruples the work per tile |
| Character cell | 16×16, 16×24, or 16×32 | Gen 5's ~2.25-tile-tall character is the look. Also state the **feet origin** inside the cell |
| Collision box | ~12 wide × 6 tall, at the feet | Never the sprite bounds. Feet-only collision is what makes movement feel right |
| Base resolution | **384 × 216** or **640 × 360** | 320×180 is very tight once dialogue boxes exist. Rule of thumb: the character height should fit ~13 times vertically |
| Walk animation | 3 unique frames, played 1-2-3-2, at 8–12 fps | The genre standard. 4 directions × 3 frames = 12 cells per character — this is the unit of art cost |
| Sheet layout | Fixed cells, no padding, no margin, origin top-left, row = direction, column = frame | Pick a row order and document it |

**Tie animation frames to distance travelled, not wall-clock time**, or the feet will slide.

**Describe sprite sheets in a metadata file** (frame size, rows, animation names, frame counts, fps) rather than magic numbers in code. That's a rule worth putting in `CLAUDE.md`.

---

## Palette: the single highest-leverage rule

A restricted palette — 16 to 32 colors, drawn from a curated published set — makes mismatched art look like it belongs together, because **color harmony does the work that drawing skill would otherwise have to do.** Every asset sharing the same 32 hues reads as one world even when the linework quality varies.

Concretely: pick a published palette from Lospec — **Endesga 32**, **DB32**, **AAP-64**, or **Sweetie 16** for a tighter retro feel. Write the hex codes into the style bible.

Then **run every acquired asset through a palette-quantization pass.** Re-paletting a purchased pack to the project's palette is roughly an hour's work and it unifies three mismatched packs into one look. This is the trick that makes amateur art projects look intentional, and it's a script Claude Code can write once and run forever.

The palette also governs **UI, effects, and text**, which is where amateur games most often fall apart even when the tiles look fine.

Sub-rules worth deciding at the same time: how many values per material (three — base, shadow, highlight — is standard), what the "black" is (rarely pure black; usually a very dark blue or purple), the UI colors, and the damage-flash color.

---

## Sprites and animation

**Frame counts.** Idle 1–2 (or a 2-frame breathe at ~4 fps). Walk 3–4 per direction. Run 6–8. Attack 4. Hurt 2. Death 6. The main character is worth more frames than anyone else; nobody notices a townsperson's walk cycle.

**Mirroring left/right** saves half the work but flips asymmetric details — a sword always ends up in the same hand. Fine for background characters, wrong for the protagonist.

**Outline style.** Pick one and enforce it; mixing them is instantly visible.

| Style | Character |
|---|---|
| **Full black outline** | Highest readability, most cartoon, most forgiving of weak interior shading. **The right default for a non-artist.** |
| Selective / partial | Outline only where the silhouette needs separating. More sophisticated, harder to keep consistent |
| Colored / darkened | Outline is a darker shade of the adjacent fill. Softer, more 16-bit |
| No outline | Hardest; requires real value control |

Also decide whether the outline sits **inside or outside** the sprite's nominal bounds. Inside keeps sprites on-grid; outside makes a 16×16 character effectively 18×18 and quietly breaks the grid.

**Light direction.** Pick one — top-left or straight-down — and never deviate. Inconsistent light direction is the second-biggest amateur tell after mixed palettes.

**Dithering.** Alternating two colors to fake a third. Easy to overuse, makes work look noisy, and **breaks under any non-integer scaling or filtering**. Use sparingly on large surfaces like sky and water; essentially never on a 16×16 character. A good palette means rarely needing it.

**Perspective.** True top-down (you only see floor tops) versus three-quarter oblique (you see floor tops *and* wall faces, characters face the camera). Gen 5 is three-quarter. **This decision determines whether any given pack is compatible with any other**, so it's the first thing to check before buying anything.

---

## The over/under problem

The player must walk *behind* the top of a tree and *in front of* its trunk. Three approaches, and the right answer is the hybrid:

1. **Split across two tile layers** — a ground+objects layer under the characters, an overhead layer above them. Simple, deterministic, works everywhere, and what most 2D RPGs actually do. Cost: the boundary is fixed, so a very tall tree looks wrong at its exact midpoint.
2. **Y-sorting** — sort sprites by their world Y each frame. Correct for anything free-standing or moving.
3. **Hybrid** — static architecture uses the layer split; everything else Y-sorts.

Say "hybrid" explicitly in the request, because it changes the tilemap data model and Claude Code will otherwise pick one.

**The sort origin must be at the object's feet**, not its center, or tall sprites sort wrong.

---

## UI with nine-slices

A window frame is one small image — say 24×24 — cut into nine regions: four corners that never scale, four edges that tile along one axis, one center that tiles both. One small PNG renders a dialogue box of any size with crisp corners.

**For pixel art the edges must tile, not stretch**, and only in whole multiples, or the pattern smears.

Budget: one nine-slice for dialogue, one for menus, one for tooltips. That's the entire UI chrome for a game like this.

**Fonts:** use a pixel font at its native size, integer-scaled only. Gen 5 uses a **variable-width** pixel font, which is why its text looks less blocky than earlier generations — a fixed-width font is the fastest way to accidentally look two generations older.

---

## Pixel-perfect rendering

The technical details that ruin otherwise-fine art. Worth putting in `CLAUDE.md` because they're easy to get wrong once and never notice:

- **Texture filtering off.** Nearest-neighbor everywhere. Filtering on is why a pixel game looks blurry.
- **Integer scaling only.** Whole multiples — 2×, 3×, 4× — with letterboxing for the remainder. Non-integer scaling makes some pixels two screen-pixels wide and others three, producing the classic shimmering, unevenly chunky look.
- **No sprite rotation, ever.** Rotation destroys the pixel grid.
- **Camera snapping.** If the camera lands on a fractional pixel, the whole tilemap appears to vibrate. Either snap the camera to whole pixels, or use the render-to-a-low-res-viewport-and-offset trick. This is the most common remaining artifact after everything else is right, and it's worth an hour to fix properly.
- **Extrude tileset borders by 1–2 px** and disable mipmaps, or adjacent tiles show 1px seams and fringes at certain camera positions.

**Tools.** **Aseprite ($19.99)** is the standard and worth it even for a non-artist, because of its palette tools and — more importantly — its command-line interface. Claude Code can drive it in a build script to export every source file to a sprite sheet plus a JSON metadata file automatically, which turns the art pipeline into one command. Free alternatives: **Pixelorama** (actively developed, free) and **LibreSprite** (older fork, sporadic maintenance).

**Learning, minimum viable:** saint11's free tutorials and the Lospec tutorial index. About four hours of this is enough to become a good director, which is the actual goal.

---

## AI generation: an honest read

**Verdict: usable for concepting and roughing; not usable as a source of shippable, animated, grid-aligned sprites without a human doing pixel-level cleanup.** A designer with no pixel art skill cannot do that cleanup, which means AI generation doesn't solve their problem — it hands them a different and more frustrating one. **A CC0 pack is strictly better for them.**

Say this plainly if it comes up, with the reasons:

1. **Palette explosion.** A sprite asked for in 16 colors comes back with 200+, because diffusion models produce anti-aliased continuous-tone output that merely *resembles* pixel art at a glance.
2. **Not actually on a grid.** Output is pixel-art-*styled* at high resolution, not authored on a grid. Downsampling destroys detail; leaving it high-res means it isn't pixel art and blurs under scaling.
3. **Style drift between assets** — the killer for an RPG. Two tiles generated ten minutes apart don't tile together; an idle and a walk look like they're from different games.
4. **Animation is unsolved.** Frame-to-frame coherence is where current tools are weakest, and 4 directions × 4 frames × N characters is exactly where the time actually goes.
5. **Tilesets fail hardest.** A tileset needs exact edge continuity across dozens of tiles. Generative models have no concept of "this 16px edge must match that one."

Two non-quality reasons that matter as much:

- **Purely AI-generated output is not copyrightable in the US.** Assets shipped unmodified are assets nobody can be stopped from copying.
- **Steam and itch.io both require disclosure of AI-generated game content.** (Using an AI *coding assistant* is a dev tool and doesn't require disclosure — generated art and music do.) And in the indie pixel-art community specifically, visible AI art is a real marketing liability.

If they use it anyway: generate concept and reference only — mood, color scheme, silhouettes — and build the actual assets from a pack or a commission.

---

## The style bible

One markdown file in `docs/STYLE.md`, decided early, revisited rarely. Paste it into Claude Code's context so it enforces the numbers.

**Hard numbers** (changing these rewrites code): tile size, character cell and feet origin, collision box, base resolution, sheet layout convention, animation frame rates, frame counts per animation, UI nine-slice source size, font.

**Aesthetic rules** (changing these redoes art): the palette with hex codes, values per material, the "black," UI colors; the outline rule and whether it's inside or outside bounds; light direction; perspective and wall height; character proportions and whether faces have visible features at this resolution; the **detail density budget** — *"grass tiles get at most three noise pixels"* is a real, enforceable rule that stops tiles from looking busy when tiled four hundred times; the dithering policy.

**What the game does NOT contain**, explicitly: no lighting or normal maps, no particle-heavy effects, no sprite rotation, no non-integer scaling. Naming the absences prevents them from creeping in one asset at a time.

**A reference sheet:** three to five screenshots from real games being matched, annotated with *why* — not "I like this," but "this is my tile size, this is my outline treatment, this is my UI density."
