// Route selection: eligibility first, then task fit and expected accepted-outcome
// effort. Heuristics are defaults with stated uncertainty, not rankings. Sparse
// outcome records can shift a preference only with >= 3 comparable accepted outcomes.
import { XaoError } from "./util.mjs";

const STATUS_RANK = { unavailable: 0, discovered: 1, "static-ready": 2, "runtime-verified": 3 };
const COST_RANK = { "deepseek-api": 1, "claude-subscription": 2, "chatgpt-subscription": 2, unknown: 3 };

export const TASK_DEFAULTS = { size: "substantial", clarity: "clear", risk: "normal", needs: [], council: false };

function matchesModel(route, wanted) {
  if (!wanted) return false;
  const w = wanted.toLowerCase();
  return [route.requested_model, route.observed_model, route.route_id].some((v) => v && v.toLowerCase().includes(w));
}

function eligible(route, host, role, { allowFirstUse }) {
  const why = [];
  if (route.host !== host) why.push(`not dispatchable from a ${host} host`);
  if (!route.reachable_from_current_host) why.push("not reachable from the current host");
  if (!route.roles.includes(role)) why.push(`not configured for role ${role}`);
  const minStatus = allowFirstUse ? 1 : 2;
  if (STATUS_RANK[route.status] < minStatus) why.push(`status ${route.status}`);
  if (role === "reviewer" && route.adapter !== "host" && route.capabilities.read_only_enforcement !== "supported") {
    why.push("cannot enforce read-only review");
  }
  if ((role === "writer" || role === "reviewer") && route.adapter !== "host" && route.capabilities.disable_delegation === "unsupported") {
    why.push("cannot disable delegation for a leaf");
  }
  return why;
}

function best(routes, { preferCheap }) {
  return [...routes].sort((a, b) => {
    const s = STATUS_RANK[b.status] - STATUS_RANK[a.status];
    if (s !== 0) return s;
    return preferCheap ? COST_RANK[a.billing_class] - COST_RANK[b.billing_class] : 0;
  })[0];
}

function outcomeAdvantage(outcomes, family, routeId) {
  const rel = outcomes.filter((o) => o.task_family === family && o.route_id === routeId);
  if (rel.length < 3) return null;
  const accepted = rel.filter((o) => o.outcome === "completed").length;
  const corrections = rel.reduce((n, o) => n + (o.correction_rounds ?? 0), 0);
  return { n: rel.length, acceptance: accepted / rel.length, mean_corrections: corrections / rel.length };
}

/**
 * @param {object} args
 * @param {"claude"|"codex"} args.host
 * @param {object} args.task  { size: tiny|small|substantial, clarity: clear|ambiguous, risk: normal|high,
 *                              family?, council?, explicit?: {lead?, worker?, reviewer?, single_agent?, required?} }
 * @param {object[]} args.routes capability records from inspectRoutes
 * @param {object[]} [args.outcomes]
 * @param {boolean} [args.allowFirstUse] permit a `discovered` route when its first use is already authorized
 */
export function selectRoutes({ host, task: rawTask, routes, outcomes = [], allowFirstUse = false }) {
  const task = { ...TASK_DEFAULTS, ...rawTask, explicit: { ...(rawTask?.explicit ?? {}) } };
  const hostRoute = routes.find((r) => r.route_id === `${host}.host`);
  if (!hostRoute) throw new XaoError("no_host_route", `No ${host}.host route in the inventory.`);
  const reasons = [];
  const blockers = [];
  const uncertain = [];
  const excluded = [];
  const opts = { allowFirstUse };

  const pick = (role, wanted, fallbackFilter, preferCheap) => {
    const candidates = [];
    // An explicit user request authorizes that route's first use; it does not waive other checks.
    const roleOpts = wanted ? { ...opts, allowFirstUse: true } : opts;
    for (const r of routes) {
      const why = eligible(r, host, role, roleOpts);
      if (why.length) {
        if (wanted && matchesModel(r, wanted)) excluded.push({ route_id: r.route_id, role, why });
        continue;
      }
      candidates.push(r);
    }
    if (wanted) {
      if (matchesModel(hostRoute, wanted) || wanted === "host") return hostRoute;
      const hit = best(candidates.filter((r) => matchesModel(r, wanted)), { preferCheap });
      if (!hit) {
        blockers.push(`explicitly requested ${role} "${wanted}" has no eligible route from this ${host} host; not substituting`);
        return null;
      }
      return hit;
    }
    return best(candidates.filter(fallbackFilter), { preferCheap }) ?? null;
  };

  // 1. Explicit single-agent / no delegation, or tiny work: stay in the host.
  if (task.explicit.single_agent || task.size === "tiny") {
    reasons.push(task.explicit.single_agent ? "user asked for a single agent" : "tiny task: delegation startup would dominate");
    return finalize({ host, task, lead: hostRoute, workers: [hostRoute], reviewers: [], reasons, blockers, uncertain, excluded });
  }

  // 2. Lead: explicit, else the host root (no switching overhead) unless outcome evidence
  //    shows a comparable external lead does materially better on this task family.
  let lead = task.explicit.lead ? pick("lead", task.explicit.lead) : hostRoute;
  if (!task.explicit.lead) {
    reasons.push("lead = host root: capable, already holds context, no switching overhead");
    if (task.family) {
      const hostAdv = outcomeAdvantage(outcomes, task.family, hostRoute.route_id);
      for (const r of routes.filter((x) => x.roles.includes("lead") && x !== hostRoute && !eligible(x, host, "lead", opts).length)) {
        const adv = outcomeAdvantage(outcomes, task.family, r.route_id);
        if (adv && hostAdv && adv.acceptance - hostAdv.acceptance >= 0.25) {
          lead = r;
          reasons.push(`lead switched to ${r.route_id}: ${adv.n} comparable outcomes, acceptance ${adv.acceptance.toFixed(2)} vs host ${hostAdv.acceptance.toFixed(2)}`);
        }
      }
    }
    if (task.clarity === "ambiguous" || task.risk === "high") {
      uncertain.push("no comparative evidence that another eligible lead beats the host root for this task; host root kept");
    }
  }

  // 3. Worker.
  let workers = [];
  if (task.explicit.worker) {
    const w = pick("writer", task.explicit.worker);
    if (w) workers = [w];
  } else if (task.size === "small") {
    workers = [hostRoute];
    reasons.push("small task: host implements directly");
  } else if (task.risk === "high" && !task.bounded_portion) {
    // Quality floor: price cannot bypass it.
    const capable = pick("writer", null, (r) => r.tier === "frontier" || r.tier === "capable", false);
    workers = [capable && STATUS_RANK[capable.status] >= STATUS_RANK["static-ready"] ? capable : hostRoute];
    reasons.push("high-risk change: writer must meet the capable/frontier floor; economy worker only for explicitly bounded portions");
  } else if (task.clarity === "ambiguous") {
    workers = [hostRoute];
    reasons.push("ambiguous contract: lead resolves the contract before any economy writer is used");
  } else {
    const cheap = pick("writer", null, (r) => r.tier === "economy", true);
    if (cheap) {
      workers = [cheap];
      reasons.push(`clear substantial implementation: economy writer ${cheap.route_id} with one batched lead review`);
      if (cheap.status !== "runtime-verified") uncertain.push(`${cheap.route_id} is ${cheap.status}; first real use must verify observed model, tools and cleanup`);
    } else {
      const fallback = pick("writer", null, (r) => r.tier === "capable", false);
      workers = [fallback ?? hostRoute];
      reasons.push(`no eligible economy writer; using ${(fallback ?? hostRoute).route_id}`);
    }
  }

  // 4. Reviewers: only when risk, council or unresolved correctness warrants; max two;
  //    prefer a different provider family from the writer.
  const reviewers = [];
  if (task.explicit.reviewer) {
    const r = pick("reviewer", task.explicit.reviewer);
    if (r) reviewers.push(r);
  } else if (task.council || task.risk === "high") {
    const writerProvider = workers[0]?.provider ?? "";
    const diverse = pick("reviewer", null, (r) => r !== lead && r.provider !== writerProvider && r.adapter !== "host", false);
    if (diverse) reviewers.push(diverse);
    if (task.council) {
      const second = pick("reviewer", null, (r) => r !== lead && !reviewers.includes(r) && r.adapter !== "host", false);
      if (second) reviewers.push(second);
    }
    if (reviewers.length === 0) uncertain.push("no eligible independent read-only reviewer; lead review only (not independent)");
    else reasons.push(`independent read-only review by ${reviewers.map((r) => r.route_id).join(", ")}`);
  }
  if (workers[0] === lead && lead.adapter === "host" && task.risk === "high" && reviewers.length === 0) {
    uncertain.push("lead also wrote the implementation; self-review is not independent");
  }
  return finalize({ host, task, lead, workers, reviewers, reasons, blockers, uncertain, excluded });
}

function finalize({ host, task, lead, workers, reviewers, reasons, blockers, uncertain, excluded }) {
  const used = [lead, ...workers, ...reviewers].filter(Boolean);
  const unverified = [...new Set(used.filter((r) => r.status !== "runtime-verified").map((r) => `${r.route_id} (${r.status})`))];
  const visibility = [...new Set(used.map((r) => `${r.route_id}: ${r.usage_visibility}`))];
  const billing = [...new Set(used.map((r) => r.billing_class))];
  const decision = {
    host,
    task,
    lead: lead?.route_id ?? null,
    workers: workers.filter(Boolean).map((r) => r.route_id),
    reviewers: reviewers.map((r) => r.route_id),
    reasons,
    uncertainty: uncertain,
    blockers,
    excluded_explicit: excluded,
    unverified_routes: unverified,
    billing_classes: billing,
    usage_visibility: visibility,
  };
  decision.forecast =
    `Host: ${host}; planner: ${decision.lead ?? "BLOCKED"}; worker: ${decision.workers.join(", ") || "BLOCKED"}` +
    `${decision.reviewers.length ? `; reviewers: ${decision.reviewers.join(", ")}` : ""}; reason: ${reasons.join("; ") || "-"}` +
    `; unverified: ${unverified.join(", ") || "none"}; billing: ${billing.join(", ")}` +
    `${blockers.length ? `; BLOCKERS: ${blockers.join("; ")}` : ""}`;
  return decision;
}
