# /roundtable

A Claude Code skill that runs a blunt five-person review panel on any idea, plan, choice, or project.

Each run draws 5 of 35 roles: one role from each of 5 different groups (Users, Builders, Skeptics, Value, Craft, Wildcards). Roles used in the last 2 reviews sit out. The panel gives takes, pushes back on each other, and ends with a decision and 3 next steps.

## Install

Copy this folder to `~/.claude/skills/roundtable/`:

```sh
cp -r roundtable ~/.claude/skills/
```

The draw script needs Python 3. It uses no extra packages.

## Use

```text
/roundtable should I build a fantasy football trade analyzer
/roundtable review this repo
/roundtable --with Statistician my win-probability model
/roundtable Supabase or a CSV file for my stats tracker?
```

## Files

- `roles.json`: the 35 roles. Each role has a name, a question it asks, a lane it judges, and a lane it stays out of. Edit this file to add or change roles.
- `draw.py`: draws the panel. `python3 draw.py --list` prints every role. `--seed N` repeats a draw. `--no-log` skips the history.
- `history.json`: created on first run. Delete it to reset the cooldown.
