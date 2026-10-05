# Claude Code skills

Skills I built for [Claude Code](https://code.claude.com). Each folder is one skill.

| Skill | What it does | How to use |
|---|---|---|
| [roundtable](roundtable/) | Draws a random 5-person review panel from 35 roles to argue about an idea, plan, or project, then decide | `/roundtable <what to review>` |
| [game-dev-partner](game-dev-partner/) | Acts as a full game studio for a solo 2D pixel-art RPG: story, art, sound, systems, and paste-ready requests for Claude Code | Auto-triggers on game work |
| [dnd-campaign-planner](dnd-campaign-planner/) | Plans D&D 2024 sessions as a print-ready document with stat blocks, read-aloud text, and a campaign bible | Auto-triggers on D&D prep |
| [cross-agent-orchestrator](cross-agent-orchestrator/) | Picks the best model for each task across my Claude, ChatGPT, and DeepSeek accounts and coordinates them | Auto-triggers on multi-file builds and in projects with `AGENT-WORKFLOW.md`; or ask to checkpoint, hand off, or continue a project in Codex |

## Install

Copy any skill folder into `~/.claude/skills/`:

```sh
git clone https://github.com/carterterickson/claude-skills
cp -r claude-skills/roundtable ~/.claude/skills/
```

Start a new Claude Code session to load it.
