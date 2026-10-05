# Runtime commands (xao 0.1.0)

`xao` is shorthand for `node <installed skill dir>/scripts/xao.mjs`. Run it from the project directory
(or pass `--project DIR`). JSON goes to stdout. Exit 0 means ok, 2 means refused by policy, 1 means error.

## Files

| Path | Portable? | Contents |
| --- | --- | --- |
| `AGENT-WORKFLOW.md` | yes | opt-in pointer: `artifact-root:` and `project-id:` |
| `<root>/state.json`, `CHECKPOINT.md`, `PROJECT.md`, `decisions.md` | yes (never auto-committed) | validated task state, rendered checkpoint, objective, decision log |
| `<root>/evidence/` | local-only (`.git/info/exclude`) | manifests, briefs, results, protocol logs, outcomes |
| `<root>/local/` | local-only | `owner.lock`, `workers.json`, write mutex |
| `~/.local/state/cross-agent-orchestrator/` | device | `app-server-probe.json`, `runtime-evidence.jsonl` |

`<root>` is `.agent-work`, or `docs/agent-work/cross-agent` when the project already uses `docs/agent-work`.

## Commands

| Command | Purpose |
| --- | --- |
| `enroll [--artifact-root REL] [--objective T]` | Opt a project in. Adds local-only exclusions first; never commits |
| `status` | Read-only view of lock, workers, state and live drift |
| `claim [--task ID]` | Atomic ownership. Prints `owner_id` and the fencing generation; resumes `handoff_ready` |
| `checkpoint --next-action T [--decision T] [--pending T] [--blocker T] [--status S] [--phase P]` | Refresh the candidate fingerprint and save |
| `release [--next-action T]` | Quiesce (no live or unconfirmed workers, no open assignments), record evidence, release |
| `reconcile [...]` | `--accept-drift --reason`, `--release-dead-owner`, `--operator-confirmed-closed --reason`, `--confirm-workers-stopped`, `--clear-cleanup-blocker` |
| `baseline` | Fingerprint of HEAD, staged, unstaged and untracked content |
| `inspect [--probe-app-server] [--full]` | Route inventory. The probe runs initialize, config/read and model/list only, with no prompt |
| `select --size S --clarity C --risk R [--lead M] [--worker M] [--reviewer M] [--single-agent] [--council] [--bounded-portion] [--record]` | Choose routes and record the decision |
| `assign --role R --route ROUTE --objective T [--owned a,b] [--acceptance ..] [--checks ..] [--context ..] [--details T]` | Write a bounded brief |
| `run-codex --assignment ID [--timeout-min N] [--effort E] [--network]` | Claude host → Codex app-server (live use) |
| `run-bridge --assignment ID [--allow-command CMD] [--base SHA]` | Codex host → existing Claude bridge (live use) |
| `dispatch-native --assignment ID` / `record-native --assignment ID --outcome O [--observed-model M] [--summary T]` | Native Agent / spawn_agent / host work |
| `accept --assignment ID --by LEAD_ROUTE [--evidence ref]` / `reject --assignment ID --reason T` | Lead decision bound to the candidate |
| `require --id ID --kind check\|review\|human\|device --description T` / `record-check --name N --outcome pass\|fail\|advisory [--satisfies ID] [--ref PATH]` | Acceptance evidence |
| `complete` | Refused unless everything is bound to the live candidate |
| `usage` | Per-billing-class totals; never merged |

## Worked example (Claude Code host, clear feature)

```text
xao status                                   # enrolled? owner? next_action?
xao claim --task feat-login                  # -> owner_id own-…
xao select --owner-id own-… --size substantial --clarity clear --risk normal --record
#   forecast: planner claude.host; worker claude.codex-app-server.deepseek/deepseek-v4.1-flash
xao require --owner-id own-… --id tests --kind check --description "npm test passes"
xao assign --owner-id own-… --role writer --route claude.codex-app-server.deepseek/deepseek-v4.1-flash \
    --objective "…" --owned src/login,test/login --checks "npm test"
xao run-codex --owner-id own-… --assignment asg-…
# lead reviews the diff (git diff), runs checks itself
xao record-check --owner-id own-… --name "npm test" --outcome pass --satisfies tests
xao accept --owner-id own-… --assignment asg-… --by claude.host
xao complete --owner-id own-…
```

To hand off instead: `xao checkpoint --owner-id own-… --next-action "…"`, then `xao release --owner-id own-…`.
In the other app, the user says "Continue this project with cross-agent-orchestrator", and that app runs
`xao status`, then `xao claim`.

## What the adapters enforce (and what they do not)

- **run-codex** starts `codex app-server` with process-level overrides: delegation off, MCP servers and plugins off,
  web search off, memories off, notify off, network off unless `--network`. It confirms these through `config/read`
  and refuses the thread when they are not confirmed. The sandbox is read-only for lead and reviewer and
  workspace-write for writers, and the server's reported sandbox must match. Approval requests are answered per id:
  command escalations are always declined, and file changes are allowed only for writers inside owned paths.
  A model mismatch at thread start refuses the assignment. A reroute or delegation during the turn is a violation.
  On timeout it sends `turn/interrupt`. Cleanup closes stdin, then sends SIGTERM and SIGKILL to the owned process
  group only, and verifies the group is empty. Writes outside owned paths are detected after the fact and block
  acceptance, but workspace-write cannot prevent them.
- **run-bridge** leaves every bridge guarantee in place and adds the role policy and cleanup evidence.
- Native routes: the runtime cannot call app tools. The host executes the returned instruction and records the result.
  The observed model is whatever the host shows; otherwise it stays unknown.
