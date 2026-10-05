// Strict record validation. Unknown keys, wrong types, unknown enums and unknown
// schema versions are errors: a record this runtime cannot fully interpret is not
// silently accepted (fail closed), and template examples are never real records.
import { XaoError } from "./util.mjs";

export const SCHEMA_VERSION = 1;

export const TASK_STATUSES = [
  "planning",
  "ready",
  "working",
  "reviewing",
  "needs_correction",
  "handoff_ready",
  "blocked",
  "blocked_cleanup",
  "complete",
];
export const ROUTE_STATUSES = ["unavailable", "discovered", "static-ready", "runtime-verified"];
export const TRISTATE = ["supported", "unsupported", "unknown"];
export const ROLES = ["lead", "writer", "reviewer", "verifier"];
export const ASSIGNMENT_STATUSES = ["prepared", "running", "ready_for_review", "accepted", "rejected", "failed", "canceled", "blocked_cleanup", "needs_input"];

const T = {
  str: { type: "string" },
  strN: { type: "string", nullable: true },
  int: { type: "int" },
  intN: { type: "int", nullable: true },
  num: { type: "num" },
  numN: { type: "num", nullable: true },
  bool: { type: "bool" },
  boolN: { type: "bool", nullable: true },
  any: { type: "any" },
};
const arr = (items) => ({ type: "array", items });
const obj = (props, opts = {}) => ({ type: "object", props, ...opts });
const en = (values, nullable = false) => ({ type: "enum", values, nullable });
const map = (values) => ({ type: "map", values });

const relPath = { type: "relpath" };
const relPathN = { type: "relpath", nullable: true };

const requirement = obj({
  id: T.str,
  description: T.str,
  kind: en(["check", "review", "human", "device"]),
  satisfied_by_ref: relPathN,
  candidate_fingerprint: T.strN,
});

const assignment = obj({
  assignment_id: T.str,
  role: en(ROLES),
  route_id: T.str,
  status: en(ASSIGNMENT_STATUSES),
  idempotency_key: T.str,
  brief_ref: relPathN,
  owned_paths: arr(T.str),
  baseline_fingerprint: T.strN,
  started_at: T.strN,
  updated_at: T.strN,
  result_ref: relPathN,
  observed_model: T.strN,
  note: T.strN,
});

const resultRecord = obj({
  assignment_id: T.str,
  route_id: T.str,
  candidate_fingerprint: T.str,
  accepted_by_route_id: T.strN,
  evidence_refs: arr(relPath),
  at: T.str,
});

const verification = obj({
  id: T.str,
  kind: en(["check", "review", "human", "device"]),
  name: T.str,
  outcome: en(["pass", "fail", "advisory", "error"]),
  candidate_fingerprint: T.str,
  ref: relPathN,
  at: T.str,
});

export const STATE_SPEC = obj({
  schema_version: { type: "const", value: SCHEMA_VERSION },
  revision: T.int,
  project_id: T.str,
  task_id: T.strN,
  phase_id: T.strN,
  status: en(TASK_STATUSES),
  resume_status: en(TASK_STATUSES, true),
  updated_at: T.str,
  updated_by: T.strN,
  project_policy_ref: relPathN,
  workspace: obj({
    kind: en(["git", "snapshot"]),
    base_commit: T.strN,
    branch: T.strN,
    baseline_fingerprint: T.strN,
    baseline_manifest_ref: relPathN,
    candidate_fingerprint: T.strN,
    candidate_manifest_ref: relPathN,
    preexisting_changes: arr(T.str),
  }),
  ownership: obj({
    fencing_generation: T.int,
    owner_host: T.strN,
    released_for_handoff: T.bool,
    quiescence_evidence_ref: relPathN,
  }),
  roles: obj({
    host_coordinator: T.strN,
    task_lead_route_id: T.strN,
    worker_route_ids: arr(T.str),
    reviewer_route_ids: arr(T.str),
    selection_decision_ref: relPathN,
  }),
  authorization_refs: arr(T.str),
  required_acceptance: arr(requirement),
  active_assignments: arr(assignment),
  accepted_results: arr(resultRecord),
  unreviewed_results: arr(resultRecord),
  decisions_ref: relPathN,
  verification: arr(verification),
  usage_refs: arr(relPath),
  pending_decisions: arr(T.str),
  blockers: arr(T.str),
  next_action: T.strN,
});

export const CAPABILITY_SPEC = obj({
  schema_version: { type: "const", value: SCHEMA_VERSION },
  route_id: T.str,
  host: en(["claude", "codex"]),
  execution_device_id: T.str,
  transport: T.str,
  reachable_from_current_host: T.bool,
  adapter: T.str,
  adapter_version: T.str,
  executable: T.strN,
  executable_version: T.strN,
  profile_fingerprint: T.strN,
  provider: T.strN,
  billing_class: en(["claude-subscription", "chatgpt-subscription", "deepseek-api", "unknown"]),
  requested_model: T.strN,
  observed_model: T.strN,
  tier: en(["frontier", "capable", "economy", "unknown"]),
  roles: arr(en(ROLES)),
  status: en(ROUTE_STATUSES),
  capabilities: map(en(TRISTATE)),
  static_evidence: arr(T.str),
  runtime_evidence: arr(T.str),
  limitations: arr(T.str),
  usage_visibility: T.str,
  last_checked_at: T.str,
});

export const OUTCOME_SPEC = obj({
  schema_version: { type: "const", value: SCHEMA_VERSION },
  event_id: T.str,
  task_id: T.strN,
  assignment_id: T.str,
  task_family: T.strN,
  route_id: T.str,
  role: en(ROLES),
  requested_model: T.strN,
  observed_model: T.strN,
  model_mismatch: T.bool,
  effort: T.strN,
  baseline_fingerprint: T.strN,
  candidate_fingerprint: T.strN,
  outcome: en(["completed", "failed", "canceled", "interrupted", "rejected", "blocked_cleanup", "needs_input", "unverified"]),
  correction_rounds: T.intN,
  elapsed_seconds: T.numN,
  cleanup: obj({ verified: T.bool, detail: T.str }),
  policy_violations: arr(T.str),
  approvals: arr(obj({ request: T.str, kind: T.str, decision: T.str, reason: T.str })),
  usage: obj({
    source: en(["provider-reported", "router-correlated", "estimated", "unavailable"]),
    billing_class: en(["claude-subscription", "chatgpt-subscription", "deepseek-api", "unknown"]),
    aggregation: T.strN,
    provider_input_tokens: T.intN,
    provider_cached_input_tokens: T.intN,
    cached_input_is_subset: T.boolN,
    provider_output_tokens: T.intN,
    provider_reasoning_tokens: T.intN,
    estimated_api_spend_usd: T.numN,
    rate_source_and_date: T.strN,
    actual_charge_usd: T.numN,
    subscription_remaining: T.strN,
    coverage_notes: arr(T.str),
  }),
  at: T.str,
});

function fail(pathLabel, message) {
  return `${pathLabel || "<root>"}: ${message}`;
}

function check(value, spec, pathLabel, errors) {
  if (value === null && spec.nullable) return;
  switch (spec.type) {
    case "any":
      return;
    case "const":
      if (value !== spec.value) errors.push(fail(pathLabel, `expected ${JSON.stringify(spec.value)}, got ${JSON.stringify(value)}`));
      return;
    case "string":
      if (typeof value !== "string") errors.push(fail(pathLabel, "expected string"));
      return;
    case "relpath":
      if (typeof value !== "string" || value === "" || value.startsWith("/") || /^[A-Za-z]:/.test(value) || value.split(/[\\/]/).includes("..")) {
        errors.push(fail(pathLabel, "expected a safe relative path"));
      }
      return;
    case "int":
      if (!Number.isSafeInteger(value) || value < 0) errors.push(fail(pathLabel, "expected a non-negative integer"));
      return;
    case "num":
      if (typeof value !== "number" || !Number.isFinite(value) || value < 0) errors.push(fail(pathLabel, "expected a non-negative finite number"));
      return;
    case "bool":
      if (typeof value !== "boolean") errors.push(fail(pathLabel, "expected boolean"));
      return;
    case "enum":
      if (!spec.values.includes(value)) errors.push(fail(pathLabel, `expected one of ${spec.values.join("|")}, got ${JSON.stringify(value)}`));
      return;
    case "array":
      if (!Array.isArray(value)) {
        errors.push(fail(pathLabel, "expected array"));
        return;
      }
      value.forEach((item, i) => check(item, spec.items, `${pathLabel}[${i}]`, errors));
      return;
    case "map":
      if (typeof value !== "object" || value === null || Array.isArray(value)) {
        errors.push(fail(pathLabel, "expected object map"));
        return;
      }
      for (const [k, v] of Object.entries(value)) check(v, spec.values, `${pathLabel}.${k}`, errors);
      return;
    case "object": {
      if (typeof value !== "object" || value === null || Array.isArray(value)) {
        errors.push(fail(pathLabel, "expected object"));
        return;
      }
      for (const key of Object.keys(value)) {
        if (!(key in spec.props)) errors.push(fail(pathLabel, `unknown field ${JSON.stringify(key)}`));
      }
      for (const [key, sub] of Object.entries(spec.props)) {
        if (!(key in value)) {
          errors.push(fail(pathLabel, `missing field ${JSON.stringify(key)}`));
          continue;
        }
        check(value[key], sub, pathLabel ? `${pathLabel}.${key}` : key, errors);
      }
      return;
    }
    default:
      errors.push(fail(pathLabel, `internal: unknown spec type ${spec.type}`));
  }
}

export function validate(value, spec, label = "record") {
  if (value && typeof value === "object" && value.template_only === true) {
    throw new XaoError("template_record", `${label} is a template example (template_only: true), not a real record.`);
  }
  if (value && typeof value === "object" && "schema_version" in value && value.schema_version !== SCHEMA_VERSION) {
    throw new XaoError(
      "unknown_schema",
      `${label} has schema_version ${JSON.stringify(value.schema_version)}; this runtime understands only ${SCHEMA_VERSION}. Refusing to interpret it.`,
    );
  }
  const errors = [];
  check(value, spec, "", errors);
  if (errors.length > 0) throw new XaoError("invalid_record", `${label} failed validation`, errors.slice(0, 20));
  return value;
}
