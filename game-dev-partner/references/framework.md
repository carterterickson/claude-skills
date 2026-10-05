# The framework

Five markdown files in `docs/`. They exist so that the project has a memory the designer doesn't have to maintain, and so that a good idea raised on a Tuesday is still there in March.

**The failure they prevent is drift.** A session raises twelve interesting things and acts on two. The next session starts from those two and raises ten more, acts on two. Six sessions later the game has been steered by whatever happened to be at the bottom of a reply, and nobody chose any of it. Writing the other ten down costs a line each.

**Contents:** [PLAN](#planmd) · [BACKLOG](#backlogmd) · [BUGS](#bugsmd) · [DECISIONS](#decisionsmd) · [OPEN](#openmd) · [Keeping them current](#keeping-them-current) · [Using them in a session](#using-them-in-a-session)

---

## PLAN.md

The spine. What the game is, where it's going, and what's happening now. This is the file to re-read when a session starts, when a decision feels arbitrary, or when the designer says *"wait, why are we doing this?"*

```markdown
# Plan

## What this game is
Two or three sentences. The elevator version, in the designer's words.
If this drifts, everything drifts.

## The shape
Region structure, how many chapters/areas, the arc. A paragraph.

## Milestones
- [x] It runs — character walks around a map
- [x] Core loop works once — a battle happens end to end
- [ ] **Vertical slice** — one town, one route, one boss, real art for that stretch
- [ ] Playable demo — first two hours, polished
- [ ] Content complete

## Now
Harbor town (third town). Layout and people agreed; fishing rod deferred
to its own request.

## Next three
1. The fishing system the harbor hands over
2. Route 4 — the long approach to the harbor, currently a placeholder
3. First pass at the storm plot, which the lighthouse is waiting on
```

**"Now" and "Next three" are the load-bearing parts.** Keep them to that — a plan listing forty things is a backlog wearing a plan's clothes, and it stops being read.

---

## BACKLOG.md

Ideas raised and parked. Every parked item from a session lands here, numbered, with enough context that it still makes sense in three months.

```markdown
# Backlog

Ideas raised and not yet acted on. Numbered so they can be pointed at.

## Open

**B-014 — Seasonal ice on the harbor water.**
Winter freezes the shallows and opens a walking route to the headland.
Raised while designing the harbor, 2026-08-21. Cheap if seasons exist;
a whole system if they don't. Depends on OPEN-003.

**B-015 — Someone in the harbor who is visibly passing through.**
Gone on the next visit. Makes the town feel like it has traffic.
Raised 2026-08-21. One NPC, one flag, an afternoon.

**B-016 — The boarded houses get interiors after the storm.**
Raised 2026-08-21. Blocked by the scene-map limitation (OPEN-004).

## Done
**B-009 — Merge heal, shop and storage into one building.** Built 2026-08-19.

## Dropped
**B-011 — Branching dialogue for the harbormaster.** Dropped 2026-08-20 —
every branch doubles downstream writing and the scene doesn't need it.
```

**Ids are permanent and never reused**, so a conversation can say "do B-014 next" and mean something.

**Dropped items stay, with the reason.** An idea that was considered and rejected is more useful than a blank, because it stops the same idea arriving again next month with the same enthusiasm.

---

## BUGS.md

Things noticed, not yet fixed. The point is that **noticing something doesn't force a detour.**

Mid-session, all sorts of things surface — a reused sprite, a placeholder level band, a door that probably doesn't fire, a line of dialogue with a typo. Chasing each one wrecks the session; ignoring them loses them.

```markdown
# Known issues

**BUG-007 — The harbor sailor and the swimmer two towns back share a body.**
Noticed 2026-08-21 from a build report. Cosmetic. Fixing it means either
repicking from the existing sprites or spending a new character sheet on
him. Worth doing before anyone plays the harbor, not urgent today.

**BUG-008 — Route 2's level band reads [50, 50].**
Noticed 2026-08-21. That's the default, so almost certainly a placeholder
rather than a decision. Would make Route 2 unwinnable if anyone reached it
at the intended point.

**BUG-009 — The pier is walkable before the storm plot starts.**
Noticed 2026-08-21. Fix is queued as the next request.
```

Each entry: **what was seen, when, and what it costs.** Not what causes it — cause is Claude Code's job, and a guess in the file becomes a wrong lead later.

**Surface them in one line, and let the designer choose.** *"Two things went on the bug list — a repeated character sprite and a placeholder level band on Route 2. Neither blocks anything today."* That's the whole mention. Ask before spending a turn on one.

---

## DECISIONS.md

What was decided, when, why, and **what was rejected**. The rejected half is the valuable half.

```markdown
**2026-08-21 — Traversal is item-based, not creature-move-based.**
Players get a set of tools rather than dedicating move slots.
Rejected: the classic move-based approach, because it taxes the team and
the genre has moved away from it. Also rejected: no traversal gating at
all, because the return-to-a-blocked-thing loop drives exploration.

**2026-08-21 — The harbor is built as a drawn scene, not from tiles.**
Chosen so the architecture could be irregular and weathered.
Known cost: flag-driven tile changes can't reach it, so the town cannot
visibly change. See OPEN-004.
```

Write one whenever something was argued about, whenever a choice constrains later work, and whenever the designer overturns an earlier decision. **What survives from an overturned decision is the measurement, not the prohibition** — record the number that was learned, not the ban that was lifted.

---

## OPEN.md

Questions raised and not answered. Each carries the consequence of leaving it open, and, if there is one, the moment it has to be answered by.

```markdown
**OPEN-003 — Does the game have seasons at all?**
Consequence: several backlog items assume it (B-014, B-018). If the answer
is no, they get dropped rather than deferred. Cheap to decide now,
expensive to retrofit once forty maps exist.
**Answer by:** before the second region is laid out.

~~**OPEN-002 — Is the third boss in the harbor or after it?**~~
— **ANSWERED 2026-08-21 by Carter.** After it. The harbor stays a breather
and the tension goes into the lighthouse instead.
```

**Never answered by the skill or by Claude Code.** If a design collides with an open question, name it by id and stop there. If the designer answers one in conversation, strike it through in place with the date — the history of a decision is usually more useful than the decision.

---

## Keeping them current

**Never spend a turn on bookkeeping.** These updates ride along on the end of a build block that was going out anyway:

```
5. WRITE THESE DOWN

Add to docs/BACKLOG.md:
  B-014 — Seasonal ice on the harbor water. Winter freezes the shallows
  and opens a route to the headland. Cheap if seasons exist. Depends on
  OPEN-003.
  B-015 — A visitor in the harbor who is gone on the next visit.

Add to docs/BUGS.md:
  BUG-007 — The harbor sailor and the swimmer in the second town share a
  character sprite. Cosmetic. Noticed 21 August 2026.

Add to docs/DECISIONS.md, dated 21 August 2026: the harbor is a drawn
scene rather than a tiled map, chosen for irregular architecture, with the
known cost that flag-driven tile changes cannot reach it.

Add to docs/OPEN.md as OPEN-004: scene maps cannot change appearance in
response to a flag. Consequence — the harbor cannot show storm damage,
cannot have a seasonal variant, and cannot open a blocked path. Needs
deciding before the storm chapter is built.

If any of these files doesn't exist, create it.
```

**Create them on the first session that needs them**, not as ceremony up front. A new project gets `PLAN.md` in the foundation sequence; the rest appear the first time there's something to put in them.

**Dates come from the actual clock.** Never inferred from a neighboring entry — reading the newest heading and advancing it once is how a dozen documents end up dated into a future that never happened.

---

## Using them in a session

**At the start**, if the framework exists and isn't already in the conversation, ask for it in the same read block as anything else needed. `PLAN.md`, `BACKLOG.md` and `OPEN.md` are small and worth having in full.

**When the designer arrives with no particular topic**, the answer to *"what should I work on?"* is in `PLAN.md`'s "Next three" and the top of `BACKLOG.md`. Offer three, one line each, and let them pick.

**When a session ends**, everything raised and not acted on is already parked — so the handoff paragraph is short:

> Harbor town is designed and the build request is with Claude Code. Three things went on the backlog (B-014 to B-016), two on the bug list, and there's one open question about seasons that'll want answering before the next region. Next up is the fishing rod.
