// Controller for the EXISTING model-council Claude bridge (official Claude Agent SDK /
// Claude Code CLI, subscription auth). The bridge is invoked unchanged through its
// installed launcher; its preflight, hook handshake, per-call approval, worktree and
// cleanup behaviour are preserved. This wrapper only supplies a role policy for
// permission_request events, a cancel on deadline, and terminal/process evidence.
//
// Known bridge limits (not changed here): committed Git base only, separate retained
// worktree, dirty edits are NOT copied, no resume, no integration, no token counters.
import { spawn } from "node:child_process";
import os from "node:os";
import path from "node:path";
import readline from "node:readline";
import { childEnv, processGroupMembers, XaoError } from "../lib/util.mjs";

// Timers used only in races/grace periods must never keep the process alive.
const sleep = (ms) => new Promise((r) => setTimeout(r, ms).unref());

export function defaultLauncher() {
  const ch = process.env.CODEX_HOME || path.join(os.homedir(), ".codex");
  return path.join(ch, "skills", "model-council", "scripts", "claude_bridge.mjs");
}

const WRITE_TOOLS = new Set(["Write", "Edit", "MultiEdit", "NotebookEdit"]);

/**
 * reviewer: deny every Write/Edit/Bash (bridge worktree-scopes Read/Glob/Grep itself).
 * writer: allow Write/Edit inside owned paths of the bridge worktree; Bash only for an
 * exact allow-listed verification command; everything else denied.
 */
export function bridgePolicy({ role, ownedPaths = [], allowedCommands = [] }) {
  return (event) => {
    let input;
    try {
      input = JSON.parse(event.input);
    } catch {
      return { decision: "deny", reason: "input not parseable" };
    }
    const tool = event.toolName;
    if (role !== "writer") {
      if (WRITE_TOOLS.has(tool) || tool === "Bash") return { decision: "deny", reason: `${role} is read-only` };
      return { decision: "deny", reason: `${role}: ${tool} needs no approval under read-only policy` };
    }
    if (WRITE_TOOLS.has(tool)) {
      const target = input.file_path ?? input.notebook_path ?? input.path;
      if (typeof target !== "string") return { decision: "deny", reason: "no target path" };
      const rel = path.relative(event.worktree, path.resolve(event.worktree, target));
      if (rel.startsWith("..") || path.isAbsolute(rel)) return { decision: "deny", reason: "outside the bridge worktree" };
      if (ownedPaths.length && !ownedPaths.some((o) => rel === o || rel.startsWith(`${o.replace(/\/$/, "")}/`))) {
        return { decision: "deny", reason: `outside owned paths: ${rel}` };
      }
      return { decision: "allow", reason: `in-scope edit ${rel}` };
    }
    if (tool === "Bash") {
      if (typeof input.command === "string" && allowedCommands.includes(input.command.trim())) return { decision: "allow", reason: "allow-listed verification command" };
      return { decision: "deny", reason: "command not on the assignment's verification allow-list" };
    }
    return { decision: "deny", reason: `${tool} not permitted for this assignment` };
  };
}

export async function runBridge({
  launcher = defaultLauncher(),
  nodeBin = process.execPath,
  repo,
  model = "sonnet",
  base,
  role,
  prompt,
  ownedPaths,
  allowedCommands,
  timeoutMs = 25 * 60_000,
  onEvent = () => {},
  env,
  policy,
}) {
  const args = [launcher, "code", "--allow-subscription-usage", "--repo", repo, "--model", model, ...(base ? ["--base", base] : [])];
  const child = spawn(nodeBin, args, { stdio: ["pipe", "pipe", "pipe"], detached: process.platform !== "win32", env: env ?? childEnv(process.env) });
  const decide = policy ?? bridgePolicy({ role, ownedPaths, allowedCommands });
  const answered = new Set();
  const approvals = [];
  const stderr = [];
  let started = null;
  let terminal = null;
  let exited = null;
  const exitPromise = new Promise((resolve) => child.once("exit", (code, signal) => resolve((exited = { code, signal }))));
  child.stderr.on("data", (c) => {
    stderr.push(String(c));
    if (stderr.length > 40) stderr.shift();
  });
  const write = (obj) => {
    if (!child.stdin.destroyed) child.stdin.write(`${JSON.stringify(obj)}\n`);
  };
  const terminalPromise = new Promise((resolve) => {
    const rl = readline.createInterface({ input: child.stdout });
    rl.on("line", (line) => {
      let ev;
      try {
        ev = JSON.parse(line);
      } catch {
        return;
      }
      onEvent(ev);
      if (ev.type === "started") started = ev;
      else if (ev.type === "permission_request") {
        if (answered.has(ev.requestId)) return; // never answer twice
        answered.add(ev.requestId);
        const d = decide(ev);
        approvals.push({ request: ev.requestId, kind: ev.toolName, decision: d.decision, reason: `${d.reason} [${String(ev.display ?? "").slice(0, 200)}]` });
        write({ type: "permission_response", requestId: ev.requestId, decision: d.decision });
      } else if (["completed", "failed", "canceled"].includes(ev.type)) {
        terminal = ev;
        resolve(ev);
      }
    });
    rl.on("close", () => resolve(terminal ?? { type: "failed", code: "stream_closed", message: "bridge stdout closed without a terminal event" }));
  });

  write({ type: "start", prompt });
  let timedOut = false;
  let deadline;
  const timer = new Promise((r) => {
    deadline = setTimeout(() => r("timeout"), timeoutMs);
  });
  const first = await Promise.race([terminalPromise, timer]);
  clearTimeout(deadline);
  if (first === "timeout") {
    timedOut = true;
    write({ type: "cancel" });
    await Promise.race([terminalPromise, sleep(30_000)]);
  }
  // Close stdin after the terminal event and verify the owned process exits.
  try {
    child.stdin.end();
  } catch {}
  await Promise.race([exitPromise, sleep(10_000)]);
  const steps = [];
  if (!exited) {
    try {
      process.kill(process.platform !== "win32" ? -child.pid : child.pid, "SIGTERM");
      steps.push("SIGTERM to owned group");
    } catch {}
    await Promise.race([exitPromise, sleep(5000)]);
  }
  const groupLeft = processGroupMembers(child.pid);
  const observed = started?.capabilities?.model ?? null;
  return {
    started,
    terminal: terminal ?? { type: "failed", code: "no_terminal", message: "no terminal event" },
    timed_out: timedOut,
    requested_model: model,
    observed_model: observed,
    model_mismatch: Boolean(observed && !observed.toLowerCase().includes(model.toLowerCase())),
    approvals,
    cleanup: {
      verified: Boolean(exited) && Array.isArray(groupLeft) && groupLeft.length === 0,
      detail: `bridge ${exited ? `exited (code ${exited.code}, signal ${exited.signal})` : "DID NOT EXIT"}; group ${groupLeft === null ? "not checkable" : groupLeft.length ? `has ${groupLeft.join(",")}` : "empty"}; worktree retained at ${started?.worktree ?? "?"}`,
      steps,
    },
    stderr_tail: stderr.join("").slice(-1500),
    pid: child.pid,
  };
}

export function assertBridgeUsable(env = process.env) {
  const redirect = ["ANTHROPIC_BASE_URL", "ANTHROPIC_API_KEY", "ANTHROPIC_AUTH_TOKEN"].filter((k) => env[k]);
  if (redirect.length) {
    throw new XaoError(
      "bridge_env_redirect",
      `The Claude bridge refuses when ${redirect.join(", ")} is set (e.g. inside Claude Code). It is a Codex-host route; from a Claude host use native subagents.`,
    );
  }
}
