# Storyboard mode

For scenes: a moment with movement, positions and dialogue. An introduction, a confrontation, a handover, an arrival. Anything where *who is standing where and what happens next* is the design rather than an afterthought.

**Blocking is what decides whether a scene looks the way the designer pictured it.** The lines can be perfect and the moment still land wrong — because the person delivering them was behind the player, or because the player stood motionless through four boxes of dialogue, or because someone walked off in a direction that made no sense from where they'd been standing. None of that is visible in a list of dialogue. All of it is visible in a panel.

Enter this mode when they say *storyboard*, *block out*, *walk me through the scene* — and offer it when they're describing a moment in prose and the positions are clearly doing work.

---

## The panel

One panel is one moment: a stable arrangement of people, plus what happens to break it. A scene is a handful of panels in order.

```
PANEL 3 — Marisol hands over the two starters

The player is crossing the square when Marisol turns from the water and
stops them.

        x=28 . . . . . x=33
  y=30    .  .  .  .  .  .
  y=31    .  .  P  .  .  .        P  the player, facing right
  y=32    .  .  .  .  M  .        M  Marisol, facing down
  y=33    #  #  #  D  #  #        D  door into the hall

MOVES   Marisol steps two left to 30,32 and turns to face the player.
        The player is held in place until the scene ends.

SAYS    Marisol: "There you are. Your mother said you'd be along."

        Marisol: "Two of them. She was very clear about two — said one
        is a pet and three is a menagerie."

CHANGES From here on the game knows the player has been given their
        starters. Nothing in town starts a wild battle before this.
```

Grid characters are the project's own — whatever its map format uses for wall, floor, water, door. Actors are letters with a legend, which is **storyboard notation only** and never appears in the data. Show just enough of the map to place everyone; six by six is usually plenty.

`SAYS` is written as it will appear, **box by box**, with a blank line between boxes — because a box break is a beat, and beats are pacing. Getting the pauses right in the storyboard is the difference between a line that lands and the same words arriving in a rush.

`CHANGES` is plain language, not field names. Field names are for the request.

---

## Working through a scene

**One panel per stable arrangement.** When someone moves, that's the next panel. Don't panel every line of dialogue.

**Count the panels where the player does nothing but read.** Two in a row is normal. Four is a cutscene the player is watching rather than playing, and the game's opening is the worst possible place for that. If the count is high, find somewhere to give them a step to take, a choice, or a fight.

**Say where the player ends up.** A scene that doesn't state its final position leaves the player standing wherever the last movement happened to drop them.

**Ask what's visible.** Anything the player should walk *behind* is an over-layer decision, and it's a design choice — a canopy, a rooftop, a crowd between the camera and the action.

**Reach past dialogue.** A scene built only out of speech reads flat. The verbs that make a moment feel like something are: someone walks into position, someone turns, the player is moved, a reaction appears over someone's head, the screen shakes, the camera looks somewhere else for a second, the screen is obscured, someone leaves. If the project has these and they're going unused, that's usually because nobody storyboarded — reaching for them is most of the difference between a moment that feels staged and one that feels flat.

**Propose in plain language.** *"The ground shakes and the camera cuts to the headland for a second before coming back"* — not the sequence of function names that produces it.

---

## Converting panels into a request

The mapping should be mechanical, which is the point: the storyboard *is* the design, and the request just says it in the project's own terms.

| In the panel | In the request |
|---|---|
| Where the scene fires | The trigger — a whole map, a specific character, or a rectangle walked into |
| What must already be true | The state condition, in whatever flag vocabulary the project uses |
| Someone walks into position | A move step |
| Someone turns | A facing step |
| The player is moved | A player-move step |
| Someone speaks | A dialogue step, attributed to a speaker |
| A blank line between boxes | A blank line inside the dialogue string |
| The camera looks elsewhere, screen shakes, reaction appears | The corresponding effect steps |
| Something is handed over | A give step |
| Someone exits | A leave step, plus wherever they leave to |
| The world now knows something | A flag being set |
| The scene takes control | The cutscene marker |
| It must never replay | The run-once marker |

Standing positions become each character's coordinates and facing. Who is present when becomes their presence conditions. Whether someone notices the player from a distance becomes their sight range.

Two things to carry through that the panels won't state on their own:

- **The too-early state** for anything the scene gates. A gate that says nothing is a wall.
- **The missable check** on anything the scene hands over. If this is the only source of something and the scene can end without the player getting it, that's a permanent loss.

---

## Changing a scene that already exists

Most storyboarding is revision, not invention, and the request has to say so — otherwise Claude Code adds a second scene beside the first rather than editing it.

Storyboard the scene **as it should end up**, then state the difference:

- **Name the scene by its internal id**, which never changes even when everything the player sees does.
- **Say what it does now, what it should do instead, and what stays.** The parts not mentioned are the parts most likely to get rewritten by accident.
- **Where the change is a fix rather than a preference, name the bug in the shape it really had.** *"He says his goodbye and then keeps talking for another box"* gives the fix something real to verify against.
- **If a panel moves someone who is currently somewhere else, say both positions.** A new coordinate with no old one reads as a new character.

Internal ids are plumbing throughout. A character can be renamed in every line of dialogue and every panel while their id stays the same forever — worth saying once in the request so it doesn't look like an oversight.
