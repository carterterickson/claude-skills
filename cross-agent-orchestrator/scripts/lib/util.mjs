import { createHash, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

export const RUNTIME_VERSION = "0.1.0";

export class XaoError extends Error {
  constructor(code, message, details) {
    super(message);
    this.code = code;
    if (details !== undefined) this.details = details;
  }
}

export const sha256 = (data) => createHash("sha256").update(data).digest("hex");
export const newId = (prefix) => `${prefix}-${randomUUID()}`;
export const nowIso = () => new Date().toISOString();

export function sha256File(file) {
  const hash = createHash("sha256");
  const fd = fs.openSync(file, "r");
  try {
    const buf = Buffer.allocUnsafe(1 << 16);
    let n;
    while ((n = fs.readSync(fd, buf, 0, buf.length, null)) > 0) hash.update(buf.subarray(0, n));
  } finally {
    fs.closeSync(fd);
  }
  return hash.digest("hex");
}

export function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

export function readJsonIfExists(file) {
  try {
    return readJson(file);
  } catch (error) {
    if (error.code === "ENOENT") return undefined;
    throw error;
  }
}

/** Write through a sibling temp file, fsync, then rename: readers see old or new, never partial. */
export function atomicWrite(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp-${process.pid}-${Math.random().toString(36).slice(2)}`;
  const fd = fs.openSync(tmp, "wx", 0o600);
  try {
    fs.writeSync(fd, text);
    fs.fsyncSync(fd);
  } finally {
    fs.closeSync(fd);
  }
  fs.renameSync(tmp, file);
}

/**
 * Create `file` only if it does not exist, with its full content visible atomically:
 * write a private temp file, then hard-link it into place (link fails with EEXIST).
 */
export function exclusiveCreate(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.new-${process.pid}-${Math.random().toString(36).slice(2)}`;
  const fd = fs.openSync(tmp, "wx", 0o600);
  try {
    fs.writeSync(fd, text);
    fs.fsyncSync(fd);
  } finally {
    fs.closeSync(fd);
  }
  try {
    fs.linkSync(tmp, file);
  } finally {
    fs.unlinkSync(tmp);
  }
}

export const atomicWriteJson = (file, value) => atomicWrite(file, `${JSON.stringify(value, null, 2)}\n`);

export function processAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error.code === "EPERM";
  }
}

/** Process start time guards against pid reuse. Unknown on failure; never guessed. */
export function processStartTime(pid) {
  if (!processAlive(pid)) return null;
  if (process.platform === "win32") return null;
  try {
    return execFileSync("ps", ["-o", "lstart=", "-p", String(pid)], { encoding: "utf8" }).trim() || null;
  } catch {
    return null;
  }
}

/** True only when the pid is alive and its start time still matches the recorded one. */
export function sameProcessAlive(pid, startTime) {
  if (!processAlive(pid)) return false;
  if (!startTime) return true; // cannot rule out reuse: treat as alive (conservative)
  const current = processStartTime(pid);
  return current === null || current === startTime;
}

function parentPid(pid) {
  try {
    return Number(execFileSync("ps", ["-o", "ppid=", "-p", String(pid)], { encoding: "utf8" }).trim());
  } catch {
    return 0;
  }
}

function commandOf(pid) {
  try {
    return execFileSync("ps", ["-o", "command=", "-p", String(pid)], { encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

/**
 * Identify the host coordinator session that invoked this CLI. Session ids from the
 * host environment are preferred; the pid is the nearest ancestor that looks like the
 * host executable. Everything here is a hint for liveness, not an authorization.
 */
export function detectHost(explicit) {
  const env = process.env;
  let kind = explicit;
  if (!kind) {
    // Codex markers first: Codex shells inherit their parent's env, so a Codex process
    // started from Claude Code can carry CLAUDECODE as well.
    if (env.XAO_HOST) kind = env.XAO_HOST;
    else if (env.CODEX_THREAD_ID || env.CODEX_SANDBOX || env.CODEX_SESSION_ID) kind = "codex";
    else if (env.CLAUDECODE || env.CLAUDE_CODE_SESSION_ID) kind = "claude";
    else kind = "unknown";
  }
  const sessionId =
    env.XAO_SESSION_ID ||
    (kind === "claude" ? env.CLAUDE_CODE_SESSION_ID : env.CODEX_THREAD_ID || env.CODEX_SESSION_ID) ||
    null;
  let pid = null;
  if (env.XAO_HOST_PID) pid = Number(env.XAO_HOST_PID);
  else if (kind === "claude" && env.CLAUDE_PID) pid = Number(env.CLAUDE_PID);
  else if (process.platform !== "win32") {
    const pattern = kind === "codex" ? /(^|\/)codex(\s|$)/ : kind === "claude" ? /(^|\/)claude(\s|$)/ : null;
    let cursor = process.ppid;
    for (let i = 0; pattern && i < 12 && cursor > 1; i += 1) {
      if (pattern.test(commandOf(cursor))) {
        pid = cursor;
        break;
      }
      cursor = parentPid(cursor);
    }
    if (pid === null) pid = process.ppid;
  }
  return { kind, sessionId, pid, pidStart: pid ? processStartTime(pid) : null };
}

/**
 * Members of a process group: [] when provably empty, pids (or ["unknown"]) when not,
 * null when it cannot be determined. Falls back to kill(-pgid, 0) where `pgrep` is
 * not permitted (e.g. inside a Codex sandbox): ESRCH proves the group is empty.
 */
export function processGroupMembers(pgid) {
  if (process.platform === "win32" || !pgid) return null;
  try {
    const out = execFileSync("pgrep", ["-g", String(pgid)], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    return out ? out.split("\n").map(Number) : [];
  } catch (error) {
    if (error.status === 1) return [];
  }
  try {
    process.kill(-pgid, 0);
    return ["unknown"];
  } catch (error) {
    if (error.code === "ESRCH") return [];
    if (error.code === "EPERM") return ["unknown"];
    return null;
  }
}

/**
 * Environment for any process this runtime starts: host identity and owner hints are
 * removed so a child can never be mistaken for (or act as) the coordinator.
 */
export function childEnv(base = process.env, { leaf = true } = {}) {
  const env = {};
  for (const [k, v] of Object.entries(base)) {
    if (k === "CLAUDECODE" || k === "CLAUDE_PID" || k.startsWith("CLAUDE_CODE_") || k.startsWith("XAO_")) continue;
    if (k === "CODEX_THREAD_ID" || k === "CODEX_SESSION_ID") continue;
    env[k] = v;
  }
  if (leaf) env.XAO_LEAF = "1";
  if (base.XAO_STATE_DIR) env.XAO_STATE_DIR = base.XAO_STATE_DIR; // test isolation only
  return env;
}

export function git(cwd, args, options = {}) {
  return execFileSync("git", args, {
    cwd,
    encoding: options.encoding ?? "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: 256 * 1024 * 1024,
  });
}

export function tryGit(cwd, args) {
  try {
    return git(cwd, args).trim();
  } catch {
    return null;
  }
}

/** Resolve a relative path under root and refuse escapes (.., absolute, symlinked parents). */
export function safeJoin(root, rel) {
  if (typeof rel !== "string" || rel === "" || path.isAbsolute(rel) || rel.split(/[\\/]/).includes("..")) {
    throw new XaoError("unsafe_path", `Refusing unsafe relative path: ${JSON.stringify(rel)}`);
  }
  const resolved = path.resolve(root, rel);
  const realRoot = fs.realpathSync(root);
  let probe = path.dirname(resolved);
  while (!fs.existsSync(probe)) probe = path.dirname(probe);
  const realProbe = fs.realpathSync(probe);
  if (realProbe !== realRoot && !realProbe.startsWith(realRoot + path.sep)) {
    throw new XaoError("unsafe_path", `Path escapes the project root: ${rel}`);
  }
  return resolved;
}
