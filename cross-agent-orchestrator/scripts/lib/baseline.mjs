// Capture the actual workspace: base commit, branch, staged vs unstaged changes,
// untracked files and content hashes. A branch name or HEAD alone is not a baseline.
// Nothing here stages, stashes, resets or commits.
import fs from "node:fs";
import path from "node:path";
import { git, sha256, sha256File, tryGit } from "./util.mjs";

function worktreeHash(root, rel) {
  const abs = path.join(root, rel);
  let st;
  try {
    st = fs.lstatSync(abs);
  } catch (error) {
    if (error.code === "ENOENT") return { state: "deleted" };
    throw error;
  }
  if (st.isSymbolicLink()) return { state: "symlink", sha256: sha256(fs.readlinkSync(abs)), mode: "120000" };
  if (st.isDirectory()) return { state: "directory" }; // e.g. nested repo / submodule
  return { state: "file", sha256: sha256File(abs), mode: (st.mode & 0o111) !== 0 ? "100755" : "100644", bytes: st.size };
}

function excluded(rel, excludes) {
  return excludes.some((ex) => rel === ex || rel.startsWith(`${ex}/`));
}

/** Parse `git status --porcelain=v2 -z --untracked-files=all`. */
function parseStatus(raw) {
  const out = [];
  const parts = raw.split("\0");
  for (let i = 0; i < parts.length; i += 1) {
    const rec = parts[i];
    if (!rec) continue;
    const kind = rec[0];
    if (kind === "1") {
      const f = rec.split(" ");
      out.push({ path: f.slice(8).join(" "), xy: f[1], head_oid: f[6], index_oid: f[7], mode_index: f[4], mode_worktree: f[5] });
    } else if (kind === "2") {
      const f = rec.split(" ");
      out.push({ path: f.slice(9).join(" "), xy: f[1], head_oid: f[6], index_oid: f[7], mode_index: f[4], mode_worktree: f[5], renamed_from: parts[i + 1] });
      i += 1;
    } else if (kind === "u") {
      const f = rec.split(" ");
      out.push({ path: f.slice(10).join(" "), xy: f[1], unmerged: true });
    } else if (kind === "?") {
      out.push({ path: rec.slice(2), xy: "??", untracked: true });
    }
  }
  return out;
}

export function isGitRepo(root) {
  return tryGit(root, ["rev-parse", "--is-inside-work-tree"]) === "true";
}

export function gitIdentity(root) {
  return {
    toplevel: tryGit(root, ["rev-parse", "--show-toplevel"]),
    common_dir: tryGit(root, ["rev-parse", "--path-format=absolute", "--git-common-dir"]),
    git_dir: tryGit(root, ["rev-parse", "--path-format=absolute", "--git-dir"]),
  };
}

function captureGit(root, excludes) {
  const head = tryGit(root, ["rev-parse", "--verify", "-q", "HEAD"]);
  const branch = tryGit(root, ["symbolic-ref", "-q", "--short", "HEAD"]);
  const raw = git(root, ["status", "--porcelain=v2", "-z", "--untracked-files=all", "--ignore-submodules=none"]);
  const entries = [];
  for (const e of parseStatus(raw)) {
    if (excluded(e.path, excludes)) continue;
    const staged = !e.untracked && e.xy[0] !== ".";
    const unstaged = e.untracked || e.xy[1] !== ".";
    entries.push({
      path: e.path,
      xy: e.xy,
      staged,
      unstaged,
      untracked: Boolean(e.untracked),
      unmerged: Boolean(e.unmerged),
      renamed_from: e.renamed_from ?? null,
      index_oid: e.index_oid ?? null,
      worktree: worktreeHash(root, e.path),
    });
  }
  entries.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  return { kind: "git", head, branch, detached: head !== null && branch === null, entries };
}

function captureSnapshot(root, excludes) {
  const entries = [];
  const walk = (dir) => {
    for (const ent of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
      const rel = dir ? `${dir}/${ent.name}` : ent.name;
      if (excluded(rel, excludes) || ent.name === ".git") continue;
      if (ent.isDirectory()) walk(rel);
      else entries.push({ path: rel, worktree: worktreeHash(root, rel) });
    }
  };
  walk("");
  entries.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  return { kind: "snapshot", head: null, branch: null, detached: false, entries };
}

/**
 * Returns a manifest plus a fingerprint over (kind, head, entries). The artifact
 * root is excluded so writing the checkpoint does not change the candidate.
 */
export function captureBaseline(root, { excludes = [] } = {}) {
  const manifest = isGitRepo(root) ? captureGit(root, excludes) : captureSnapshot(root, excludes);
  const fingerprint = sha256(JSON.stringify({ kind: manifest.kind, head: manifest.head, entries: manifest.entries }));
  return { ...manifest, fingerprint, captured_at: new Date().toISOString() };
}

/** Explain how two manifests differ; used for drift detection before takeover and acceptance. */
export function diffBaselines(before, after) {
  const drift = [];
  if (before.kind !== after.kind) drift.push({ kind: "workspace_kind", before: before.kind, after: after.kind });
  if (before.head !== after.head) drift.push({ kind: "head", before: before.head, after: after.head });
  if ((before.branch ?? null) !== (after.branch ?? null)) drift.push({ kind: "branch", before: before.branch, after: after.branch });
  const a = new Map(before.entries.map((e) => [e.path, e]));
  const b = new Map(after.entries.map((e) => [e.path, e]));
  for (const [p, e] of a) {
    if (!b.has(p)) drift.push({ kind: "path_clean_or_removed", path: p });
    else if (JSON.stringify(e) !== JSON.stringify(b.get(p))) drift.push({ kind: "path_changed", path: p });
  }
  for (const p of b.keys()) if (!a.has(p)) drift.push({ kind: "path_new_change", path: p });
  return drift;
}

export function changedPaths(before, after) {
  return [...new Set(diffBaselines(before, after).filter((d) => d.path).map((d) => d.path))].sort();
}
