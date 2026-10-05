// Shared task state, ownership and fencing.
//
// Ownership is an O_EXCL lock file per checkout carrying an owner id and a fencing
// generation. Every shared-state write takes a short write mutex, re-reads state,
// checks the caller's owner id and generation against both the lock and the state,
// compares the expected revision, then writes through temp+rename. A revived former
// owner therefore fails its fencing check. Takeover never follows from a timestamp:
// it requires a released lock, or a dead owner process with no live registered
// workers and an explicit reconcile.
import fs from "node:fs";
import path from "node:path";
import { captureBaseline, diffBaselines } from "./baseline.mjs";
import { STATE_SPEC, validate } from "./schema.mjs";
import {
  atomicWrite,
  atomicWriteJson,
  exclusiveCreate,
  newId,
  nowIso,
  processAlive,
  readJson,
  readJsonIfExists,
  sameProcessAlive,
  sha256,
  XaoError,
} from "./util.mjs";

export const TRANSITIONS = {
  planning: ["ready", "working", "blocked", "handoff_ready"],
  ready: ["planning", "working", "blocked", "handoff_ready"],
  working: ["reviewing", "blocked", "blocked_cleanup", "handoff_ready", "planning"],
  reviewing: ["needs_correction", "complete", "working", "blocked", "handoff_ready"],
  needs_correction: ["working", "planning", "blocked", "handoff_ready"],
  handoff_ready: ["planning", "ready", "working", "reviewing", "needs_correction", "blocked"],
  blocked: ["planning", "ready", "working", "reviewing", "needs_correction", "handoff_ready"],
  blocked_cleanup: ["blocked", "working", "reviewing", "handoff_ready"],
  complete: ["planning"],
};

const TERMINAL_ASSIGNMENT = new Set(["ready_for_review", "accepted", "rejected", "failed", "canceled"]);

export function excludesFor(p) {
  return [p.artifactRootRel];
}

export function freshState(p, host) {
  return {
    schema_version: 1,
    revision: 0,
    project_id: p.projectId,
    task_id: null,
    phase_id: null,
    status: "planning",
    resume_status: null,
    updated_at: nowIso(),
    updated_by: host ?? null,
    project_policy_ref: "PROJECT.md",
    workspace: {
      kind: "git",
      base_commit: null,
      branch: null,
      baseline_fingerprint: null,
      baseline_manifest_ref: null,
      candidate_fingerprint: null,
      candidate_manifest_ref: null,
      preexisting_changes: [],
    },
    ownership: { fencing_generation: 0, owner_host: null, released_for_handoff: true, quiescence_evidence_ref: null },
    roles: { host_coordinator: null, task_lead_route_id: null, worker_route_ids: [], reviewer_route_ids: [], selection_decision_ref: null },
    authorization_refs: [],
    required_acceptance: [],
    active_assignments: [],
    accepted_results: [],
    unreviewed_results: [],
    decisions_ref: "decisions.md",
    verification: [],
    usage_refs: [],
    pending_decisions: [],
    blockers: [],
    next_action: null,
  };
}

export function loadState(p) {
  const raw = readJsonIfExists(p.state);
  if (raw === undefined) return null;
  const state = validate(raw, STATE_SPEC, "state.json");
  if (state.project_id !== p.projectId) {
    throw new XaoError("wrong_project", `state.json belongs to ${state.project_id}, pointer says ${p.projectId}. Reconcile before writing.`);
  }
  return state;
}

// ---- write mutex (short-lived; guards read-compare-write) -----------------------

function withWriteMutex(p, fn) {
  fs.mkdirSync(p.local, { recursive: true, mode: 0o700 });
  const deadline = Date.now() + 10_000;
  for (;;) {
    try {
      exclusiveCreate(p.stateLock, JSON.stringify({ pid: process.pid, at: nowIso() }));
      break;
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
      let holder;
      try {
        holder = readJsonIfExists(p.stateLock);
      } catch {
        holder = undefined; // unreadable: treat as held and wait
      }
      if (holder && !processAlive(holder.pid)) {
        // Holder died mid-write; the state file itself is still whole (rename is atomic).
        try {
          fs.unlinkSync(p.stateLock);
        } catch {}
        continue;
      }
      if (Date.now() > deadline) throw new XaoError("state_busy", "Another process holds the state write mutex.");
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 25);
    }
  }
  try {
    return fn();
  } finally {
    try {
      fs.unlinkSync(p.stateLock);
    } catch {}
  }
}

// ---- ownership ----------------------------------------------------------------------

export function readLock(p) {
  return readJsonIfExists(p.lock) ?? null;
}

export function readWorkers(p) {
  return readJsonIfExists(p.workers) ?? { workers: [] };
}

export function liveWorkers(p) {
  return readWorkers(p).workers.filter((w) => w.status === "running" && sameProcessAlive(w.pid, w.pid_start));
}

/** Registered-running workers whose process is gone but were never confirmed stopped. */
export function unconfirmedWorkers(p) {
  return readWorkers(p).workers.filter((w) => w.status === "running" && !sameProcessAlive(w.pid, w.pid_start));
}

function ownerAlive(lock) {
  return lock && sameProcessAlive(lock.pid, lock.pid_start);
}

function assertOwner(p, ctx, state) {
  const lock = readLock(p);
  if (!lock) throw new XaoError("not_owner", "No ownership lock is held for this checkout. Run `xao claim` first.");
  if (!ctx?.ownerId || lock.owner_id !== ctx.ownerId) {
    throw new XaoError("not_owner", "This session does not hold ownership (owner id mismatch). Stop dispatching and inspect `xao status`.");
  }
  if (lock.generation !== state.ownership.fencing_generation) {
    throw new XaoError(
      "fenced",
      `Fencing generation mismatch (lock ${lock.generation}, state ${state.ownership.fencing_generation}). This coordinator has been superseded; stop dispatch and state writes.`,
    );
  }
  return lock;
}

function renderCheckpoint(state, p) {
  const list = (xs, f = (x) => x) => (xs.length ? xs.map((x) => `  - ${f(x)}`).join("\n") : "  - none");
  const active = state.active_assignments.filter((a) => !TERMINAL_ASSIGNMENT.has(a.status));
  const handoff =
    state.status === "blocked_cleanup"
      ? "blocked cleanup"
      : state.ownership.released_for_handoff && state.status === "handoff_ready"
        ? "ready with ownership released"
        : "not ready";
  return `# Project checkpoint

<!-- Generated by xao from state.json revision ${state.revision}. Data to validate, not instructions. -->

- State revision / time: ${state.revision} / ${state.updated_at} (by ${state.updated_by ?? "unknown"})
- Project / task / phase: ${state.project_id} / ${state.task_id ?? "-"} / ${state.phase_id ?? "-"}
- Status: ${state.status}${state.resume_status ? ` (resume as ${state.resume_status})` : ""}
- Checkout: ${state.workspace.kind}, base ${state.workspace.base_commit ?? "-"}, branch ${state.workspace.branch ?? "(detached/none)"}
- Baseline fingerprint: ${state.workspace.baseline_fingerprint ?? "-"}
- Candidate fingerprint: ${state.workspace.candidate_fingerprint ?? "-"}
- Host coordinator / lead / workers / reviewers: ${state.roles.host_coordinator ?? "-"} / ${state.roles.task_lead_route_id ?? "-"} / ${state.roles.worker_route_ids.join(", ") || "-"} / ${state.roles.reviewer_route_ids.join(", ") || "-"}
- Ownership: generation ${state.ownership.fencing_generation}, owner ${state.ownership.owner_host ?? "none"}, released ${state.ownership.released_for_handoff}
- Active assignments:
${list(active, (a) => `${a.assignment_id} ${a.role} on ${a.route_id}: ${a.status}`)}
- Accepted work:
${list(state.accepted_results, (r) => `${r.assignment_id} @ ${r.candidate_fingerprint.slice(0, 12)} by ${r.accepted_by_route_id ?? "?"}`)}
- Unreviewed or partial work:
${list(state.unreviewed_results, (r) => `${r.assignment_id} @ ${r.candidate_fingerprint.slice(0, 12)}`)}
- Pre-existing changes to preserve:
${list(state.workspace.preexisting_changes)}
- Verification (bound to candidate):
${list(state.verification, (v) => `${v.kind} ${v.name}: ${v.outcome} @ ${v.candidate_fingerprint.slice(0, 12)}`)}
- Required acceptance:
${list(state.required_acceptance, (r) => `${r.id} (${r.kind}) ${r.description}: ${r.satisfied_by_ref ? `satisfied @ ${r.candidate_fingerprint?.slice(0, 12)}` : "open"}`)}
- Pending decisions:
${list(state.pending_decisions)}
- Blockers:
${list(state.blockers)}
- Authorization references:
${list(state.authorization_refs)}
- Usage records:
${list(state.usage_refs)}
- Exact next action: ${state.next_action ?? "(not set)"}

Handoff status: ${handoff}.
`;
}

function writeStateFiles(p, state) {
  validate(state, STATE_SPEC, "state.json");
  atomicWriteJson(p.state, state);
  atomicWrite(p.checkpoint, renderCheckpoint(state, p));
}

/**
 * Fenced, revision-checked mutation. `fn` receives a deep copy and returns it.
 */
export function mutateState(p, ctx, fn, { expectedRevision } = {}) {
  return withWriteMutex(p, () => {
    const current = loadState(p);
    if (!current) throw new XaoError("no_state", "No state.json yet. Run `xao claim` to initialise.");
    assertOwner(p, ctx, current);
    if (expectedRevision !== undefined && expectedRevision !== current.revision) {
      throw new XaoError("revision_conflict", `Expected revision ${expectedRevision}, found ${current.revision}. Re-read state first.`);
    }
    const next = fn(structuredClone(current));
    if (next.status !== current.status && !TRANSITIONS[current.status].includes(next.status)) {
      throw new XaoError("illegal_transition", `Illegal transition ${current.status} -> ${next.status}.`);
    }
    next.revision = current.revision + 1;
    next.updated_at = nowIso();
    next.updated_by = ctx.host ?? current.updated_by;
    writeStateFiles(p, next);
    return next;
  });
}

function hostLabel(host) {
  return `${host.kind}${host.sessionId ? `:${host.sessionId.slice(0, 12)}` : ""}@pid${host.pid ?? "?"}`;
}

/**
 * Atomically claim the checkout. Exactly one concurrent claimant wins (O_EXCL).
 * The loser receives the current owner's identity and liveness and must defer.
 */
export function claim(p, host, { taskId } = {}) {
  const live = liveWorkers(p);
  if (live.length > 0) {
    throw new XaoError("workers_alive", "Registered task workers are still running; reconcile or cancel them before taking ownership.", live);
  }
  const unconfirmed = unconfirmedWorkers(p);
  if (unconfirmed.length > 0) {
    throw new XaoError(
      "workers_unconfirmed",
      "A registered worker exited without confirmed cleanup; run `xao reconcile` to inspect it before any new writer starts.",
      unconfirmed,
    );
  }
  return withWriteMutex(p, () => {
    const existingLock = readLock(p);
    if (existingLock) {
      throw new XaoError("owned", "Another coordinator holds this checkout.", {
        owner_id: existingLock.owner_id,
        host: existingLock.host,
        claimed_at: existingLock.claimed_at,
        owner_process_alive: ownerAlive(existingLock),
      });
    }
    let state = loadState(p);
    if (state && !state.ownership.released_for_handoff) {
      throw new XaoError(
        "needs_reconcile",
        "State says the previous owner never released, but no lock exists. Run `xao reconcile` and record what happened before claiming.",
      );
    }
    const fresh = !state;
    if (!state) state = freshState(p, hostLabel(host));
    const generation = state.ownership.fencing_generation + 1;
    const ownerId = newId("own");
    const lock = {
      owner_id: ownerId,
      generation,
      host: hostLabel(host),
      host_kind: host.kind,
      session_id: host.sessionId,
      pid: host.pid,
      pid_start: host.pidStart,
      claimed_at: nowIso(),
    };
    exclusiveCreate(p.lock, JSON.stringify(lock, null, 2)); // the atomic claim
    try {
      return finishClaim(p, state, lock, fresh, taskId);
    } catch (error) {
      fs.unlinkSync(p.lock); // never leave a lock whose state write failed
      throw error;
    }
  });
}

function finishClaim(p, state, lock, fresh, taskId) {
  {
    const generation = lock.generation;

    // Drift check against the last recorded candidate.
    const current = captureBaseline(p.root, { excludes: excludesFor(p) });
    let drift = [];
    if (state.workspace.candidate_manifest_ref) {
      const prior = readJsonIfExists(path.join(p.art, state.workspace.candidate_manifest_ref));
      if (prior && prior.fingerprint !== current.fingerprint) drift = diffBaselines(prior, current);
      if (!prior) drift = [{ kind: "manifest_missing", ref: state.workspace.candidate_manifest_ref }];
    }
    const next = structuredClone(state);
    next.ownership = { ...next.ownership, fencing_generation: generation, owner_host: lock.host, released_for_handoff: false };
    next.roles.host_coordinator = lock.host;
    if (taskId) next.task_id = taskId;
    if (next.status === "handoff_ready") {
      next.status = next.resume_status ?? "planning";
      next.resume_status = null;
    }
    if (fresh) {
      const ref = saveManifest(p, current);
      Object.assign(next.workspace, {
        kind: current.kind,
        base_commit: current.head,
        branch: current.branch,
        baseline_fingerprint: current.fingerprint,
        baseline_manifest_ref: ref,
        candidate_fingerprint: current.fingerprint,
        candidate_manifest_ref: ref,
        preexisting_changes: current.entries.map((e) => e.path),
      });
    }
    next.blockers = next.blockers.filter((b) => !b.startsWith("drift:"));
    if (drift.length > 0) next.blockers.push(`drift: ${drift.length} change(s) since the last checkpoint; run \`xao reconcile --accept-drift\` after reviewing`);
    next.revision = state.revision + 1;
    next.updated_at = nowIso();
    next.updated_by = lock.host;
    writeStateFiles(p, next);
    return { ownerId: lock.owner_id, generation, state: next, drift };
  }
}

export function saveManifest(p, manifest) {
  const ref = `evidence/manifests/${manifest.fingerprint.slice(0, 16)}.json`;
  const file = path.join(p.art, ref);
  if (!fs.existsSync(file)) atomicWriteJson(file, manifest);
  return ref;
}

/** Recompute the candidate; evidence bound to an older candidate stops counting automatically. */
export function refreshCandidate(p, ctx) {
  const current = captureBaseline(p.root, { excludes: excludesFor(p) });
  const ref = saveManifest(p, current);
  const state = mutateState(p, ctx, (s) => {
    s.workspace.candidate_fingerprint = current.fingerprint;
    s.workspace.candidate_manifest_ref = ref;
    s.workspace.base_commit = s.workspace.base_commit ?? current.head;
    return s;
  });
  return { state, manifest: current };
}

export function release(p, ctx, { nextAction } = {}) {
  const live = liveWorkers(p);
  if (live.length > 0) {
    mutateState(p, ctx, (s) => {
      if (s.status !== "blocked_cleanup" && TRANSITIONS[s.status].includes("blocked_cleanup")) s.status = "blocked_cleanup";
      return s;
    });
    throw new XaoError("workers_alive", "Task-owned workers are still running. Ownership is NOT released; state marked blocked_cleanup where legal.", live);
  }
  const { state: refreshed } = refreshCandidate(p, ctx);
  const running = refreshed.active_assignments.filter((a) => !TERMINAL_ASSIGNMENT.has(a.status));
  if (running.length > 0) {
    throw new XaoError("assignments_open", "Active assignments are not settled; finish, cancel or record them before release.", running.map((a) => a.assignment_id));
  }
  const quiescence = {
    at: nowIso(),
    live_workers: 0,
    unconfirmed_workers: unconfirmedWorkers(p).length,
    candidate_fingerprint: refreshed.workspace.candidate_fingerprint,
  };
  if (quiescence.unconfirmed_workers > 0) {
    throw new XaoError("workers_unconfirmed", "Some registered workers were never confirmed stopped; run `xao reconcile` first.");
  }
  const qref = `evidence/quiescence-${Date.now()}.json`;
  atomicWriteJson(path.join(p.art, qref), quiescence);
  const state = mutateState(p, ctx, (s) => {
    if (s.status !== "handoff_ready") {
      s.resume_status = s.status === "complete" ? null : s.status;
      if (s.status !== "complete") s.status = "handoff_ready";
    }
    s.ownership.released_for_handoff = true;
    s.ownership.owner_host = null;
    s.ownership.quiescence_evidence_ref = qref;
    if (nextAction) s.next_action = nextAction;
    return s;
  });
  withWriteMutex(p, () => {
    const lock = readLock(p);
    if (lock && lock.owner_id === ctx.ownerId) fs.unlinkSync(p.lock);
  });
  return state;
}

/**
 * Inspect ownership problems and, only on explicit request and evidence, clear them.
 * Never kills processes; never infers death from age.
 */
export function reconcile(p, host, opts = {}) {
  const lock = readLock(p);
  const state = loadState(p);
  const live = liveWorkers(p);
  const unconfirmed = unconfirmedWorkers(p);
  const report = {
    lock: lock ? { ...lock, owner_process_alive: ownerAlive(lock) } : null,
    state_revision: state?.revision ?? null,
    state_status: state?.status ?? null,
    released_for_handoff: state?.ownership.released_for_handoff ?? null,
    live_workers: live,
    unconfirmed_workers: unconfirmed,
    actions: [],
  };
  if (opts.confirmWorkersStopped) {
    // Operator/host has verified these pids are gone (they are: sameProcessAlive is false).
    withWriteMutex(p, () => {
      const reg = readWorkers(p);
      for (const w of reg.workers) {
        if (w.status === "running" && !sameProcessAlive(w.pid, w.pid_start)) {
          w.status = "stopped_confirmed";
          w.confirmed_at = nowIso();
          w.confirmed_by = hostLabel(host);
        }
      }
      atomicWriteJson(p.workers, reg);
    });
    report.actions.push("marked exited workers as stopped_confirmed");
  }
  if (opts.releaseDeadOwner || opts.operatorConfirmedClosed) {
    if (live.length > 0) throw new XaoError("workers_alive", "Live task workers exist; stop or quarantine them first.", live);
    if (!lock && state && !state.ownership.released_for_handoff) {
      // Lock vanished; record and allow a new claim.
    } else if (!lock) {
      report.actions.push("nothing to release");
      return report;
    } else if (ownerAlive(lock) && !opts.operatorConfirmedClosed) {
      throw new XaoError(
        "owner_alive",
        "The owner process is still alive. Ask that session to release, or rerun with --operator-confirmed-closed if the user confirms the task is closed there.",
      );
    }
    withWriteMutex(p, () => {
      const s = loadState(p);
      if (s) {
        s.ownership.released_for_handoff = true;
        s.ownership.owner_host = null;
        s.blockers.push(
          `reconciled ownership at ${nowIso()} by ${hostLabel(host)}: ${opts.reason ?? (opts.operatorConfirmedClosed ? "operator confirmed prior session closed" : "owner process dead")}`,
        );
        if (s.status !== "handoff_ready" && TRANSITIONS[s.status].includes("handoff_ready")) {
          s.resume_status = s.status;
          s.status = "handoff_ready";
        }
        s.revision += 1;
        s.updated_at = nowIso();
        s.updated_by = hostLabel(host);
        writeStateFiles(p, s);
      }
      if (fs.existsSync(p.lock)) fs.unlinkSync(p.lock);
    });
    fs.appendFileSync(p.decisions, `- ${nowIso()} ownership reconciled by ${hostLabel(host)}: ${opts.reason ?? "see state blockers"}\n`);
    report.actions.push("released stale ownership (next claim increments the fencing generation)");
  }
  return report;
}

// ---- worker registry (device-local) --------------------------------------------------

export function registerWorker(p, ctx, worker) {
  return withWriteMutex(p, () => {
    const state = loadState(p);
    assertOwner(p, ctx, state);
    const reg = readWorkers(p);
    reg.workers.push({ ...worker, status: "running", registered_at: nowIso(), generation: state.ownership.fencing_generation });
    atomicWriteJson(p.workers, reg);
  });
}

export function finishWorker(p, assignmentId, { cleanupVerified, detail }) {
  return withWriteMutex(p, () => {
    const reg = readWorkers(p);
    for (const w of reg.workers) {
      if (w.assignment_id === assignmentId && w.status === "running") {
        w.status = cleanupVerified ? "stopped_confirmed" : "cleanup_unverified";
        w.finished_at = nowIso();
        w.cleanup_detail = detail;
      }
    }
    atomicWriteJson(p.workers, reg);
  });
}

// ---- acceptance guards ------------------------------------------------------------

/** Complete only with an accepted result and every requirement bound to the live candidate. */
export function completionProblems(p, state) {
  const live = captureBaseline(p.root, { excludes: excludesFor(p) }).fingerprint;
  const problems = [];
  if (state.workspace.candidate_fingerprint !== live) problems.push("candidate changed since it was last recorded; refresh and re-verify affected evidence");
  if (!state.accepted_results.some((r) => r.candidate_fingerprint === live)) problems.push("no lead-accepted result is bound to the current candidate");
  for (const req of state.required_acceptance) {
    if (!req.satisfied_by_ref || req.candidate_fingerprint !== live) problems.push(`requirement ${req.id} (${req.kind}) not satisfied for the current candidate`);
  }
  for (const v of state.verification) {
    if (v.candidate_fingerprint === live && v.outcome === "fail") problems.push(`check ${v.name} failed on the current candidate`);
  }
  if (state.active_assignments.some((a) => !TERMINAL_ASSIGNMENT.has(a.status))) problems.push("active assignments remain");
  return { live, problems };
}

export function stateDigest(state) {
  return sha256(JSON.stringify(state)).slice(0, 16);
}

export { readJson };
