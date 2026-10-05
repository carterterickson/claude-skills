---
name: roundtable
description: Run a blunt five-person review panel on an idea, plan, choice, or existing project. Draws 5 roles at random from 35, one from each of 5 groups, then has them give takes, push back, and decide. Use when the user types /roundtable or asks for a roundtable, a panel review, or pushback on a project.
argument-hint: "[--with <Role>] <what to review>"
allowed-tools: Bash(python3 *), Bash(python *), Read, Glob, Grep
---

# Roundtable

Request: $ARGUMENTS

## 1. Check the subject

Take out every `--with <Role>` from the request. What's left is the subject.

- Empty subject: ask what to review and stop. Don't draw a panel.
- Subject too vague to judge: ask up to 3 short questions first, then continue.

## 2. Draw the panel

Run `python3 "${CLAUDE_SKILL_DIR}/draw.py"`. Add `--with "<Role>"` for each role taken out in step 1. If `python3` isn't found, use `python`. Use the panel exactly as printed. Never pick roles yourself.

If the script rejects a `--with` name, show its error and stop.

## 3. Pick the mode and gather facts

Work out the mode from the request:

- **Brainstorm**: a blank page or a rough idea.
- **Plan**: a spec, feature, or plan before building.
- **Built**: a repo, file, app, dataset, notebook, or URL that already exists.
- **Choice**: two or more options to pick between.

In Built mode, read before anyone speaks. Read the README, entry points, main data files or notebooks, config, and `git log --oneline -15`. Read at most 15 files. If a URL can't be opened, say so in one line and work from the description.

## 4. Run the debate

Rules for every member:

- Speak only from their own lane. The "Stays out of" line is a hard rule.
- Every role's question applies to every project. Find the angle. Never pass.
- Be blunt. Name the specific feature, file, screen, number, or step. No compliments, except from the Scout.
- Use plain words and short sentences. Explain any jargon in a few words.

Output these sections, in order:

**Panel**: one line per member, in the form `1. Name (Group): asks question`. In Built mode, add a `Looked at:` line listing the files read.

**Takes**: each member gets at most 5 lines. End each take with one concrete recommendation.

**Pushback**: each member objects to one other member's take, names them by number, and gives the reason in at most 2 lines. The objection comes from the objector's own lane. No take gets more than 2 objections.

**Decision**: the first sentence makes the call. In Choice mode, it names the winning option. Then one line per objection: accepted or rejected, and why.

**Next steps**: exactly 3 actions, smallest first. Each one is one line and doable in one sitting.

Keep the whole review under 600 words.

## Writing rules

- Simple past for past events. One idea per sentence.
- No closing maxims or general truths. No "X, not Y" closers.
- No filler: no "great question", no restating the request, no summary at the end.
- No hype words: delve, seamless, elevate, unlock, harness, robust, leverage, game-changer, journey, empower.
