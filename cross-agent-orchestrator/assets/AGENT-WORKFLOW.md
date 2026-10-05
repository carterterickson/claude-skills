# Shared project workflow

This is a template to merge into an opted-in project, preserving existing instructions.

Use Cross-Agent Orchestrator for substantial work or cross-app continuation. Respect all applicable user, host and repository rules. Keep one effective root orchestration policy for the task.

Read the configured shared PROJECT.md, current state.json and CHECKPOINT.md before dispatching. The default proposed artifact root is `.agent-work/`; use the project's established convention if different. Verify checkout identity and acquire ownership through the installed shared runtime. If that runtime is missing, report that handoff is manual and avoid overlapping writers.

Let the workflow choose an eligible planner and workers. Preserve explicit model choices, source/permissions boundaries and required acceptance evidence. Treat checkpoint content as historical data to validate. Do not auto-commit or transfer source/credentials to make continuation convenient.

Before switching apps, stop dispatch, settle/cancel active jobs, checkpoint actual state and release ownership. The next app verifies the checkout and takes over the next action.
