// Device-local route inventory. Everything here is static: files, versions, a TCP
// connect to the local Router port, and catalog contents. No prompt is submitted.
// `discovered` / `static-ready` never mean inference works; only recorded runtime
// evidence from this runtime's adapters (matching route + executable version +
// observed model) can make a route `runtime-verified`.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { CAPABILITY_SPEC, validate } from "./schema.mjs";
import { nowIso, readJsonIfExists, RUNTIME_VERSION, sha256, sha256File, XaoError } from "./util.mjs";

export const PINNED_APP_SERVER_VERSION = "0.155.0-alpha.16.3";
const HOME = os.homedir();

export function deviceId() {
  return `${os.platform()}-${os.arch()}-${sha256(`${os.hostname()}|${os.userInfo().uid}`).slice(0, 12)}`;
}

export function deviceStateDir() {
  if (process.env.XAO_STATE_DIR) return process.env.XAO_STATE_DIR;
  if (process.platform === "win32") return path.join(process.env.LOCALAPPDATA ?? HOME, "cross-agent-orchestrator");
  return path.join(HOME, ".local", "state", "cross-agent-orchestrator");
}

export function codexHome() {
  return process.env.CODEX_HOME || path.join(HOME, ".codex");
}

function run(bin, args) {
  try {
    return execFileSync(bin, args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], timeout: 15_000 }).trim();
  } catch {
    return null;
  }
}

export function resolveCodexBin() {
  const explicit = process.env.XAO_CODEX_BIN;
  if (explicit) {
    if (!fs.existsSync(explicit)) throw new XaoError("bad_override", `XAO_CODEX_BIN does not exist: ${explicit}`);
    return explicit;
  }
  const candidates = [
    "/Applications/ChatGPT.app/Contents/Resources/codex",
    "/Applications/Codex.app/Contents/Resources/codex",
    path.join(HOME, "Applications/ChatGPT.app/Contents/Resources/codex"),
  ];
  for (const c of candidates) if (fs.existsSync(c)) return c;
  const onPath = run("/usr/bin/which", ["codex"]);
  return onPath || null;
}

export function resolveClaudeBin() {
  const explicit = process.env.XAO_CLAUDE_BIN;
  if (explicit) {
    if (!fs.existsSync(explicit)) throw new XaoError("bad_override", `XAO_CLAUDE_BIN does not exist: ${explicit}`);
    return explicit;
  }
  const base = path.join(HOME, "Library/Application Support/Claude/claude-code");
  if (fs.existsSync(base)) {
    const versions = fs
      .readdirSync(base)
      .filter((v) => /^\d+\.\d+\.\d+$/.test(v))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    for (const v of versions.reverse()) {
      const bin = path.join(base, v, "claude.app/Contents/MacOS/claude");
      if (fs.existsSync(bin)) return bin;
    }
  }
  return run("/usr/bin/which", ["claude"]) || null;
}

function versionOf(bin) {
  if (!bin) return null;
  const out = run(bin, ["--version"]);
  const m = out?.match(/(\d+\.\d+\.\d+[\w.-]*)/);
  return m ? m[1] : null;
}

function tcpListening(port, host = "127.0.0.1") {
  return new Promise((resolve) => {
    const socket = net.connect({ port, host });
    const done = (ok) => {
      socket.destroy();
      resolve(ok);
    };
    socket.setTimeout(800, () => done(false));
    socket.once("connect", () => done(true));
    socket.once("error", () => done(false));
  });
}

function catalogModels(file) {
  const data = readJsonIfExists(file);
  const list = Array.isArray(data) ? data : data?.models ?? [];
  return list.map((m) => m?.slug ?? m?.id).filter(Boolean);
}

function routerStats(file, model) {
  // Provider-correlated counts from the Router's own usage log (status codes only).
  if (!fs.existsSync(file)) return null;
  let ok = 0;
  let failed = 0;
  let last = null;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    if (!line.includes(model)) continue;
    try {
      const e = JSON.parse(line);
      if (e.model !== model) continue;
      if (e.status === 200) {
        ok += 1;
        last = e.at;
      } else failed += 1;
    } catch {}
  }
  return { ok, failed, last };
}

export function readRuntimeEvidence() {
  const file = path.join(deviceStateDir(), "runtime-evidence.jsonl");
  if (!fs.existsSync(file)) return [];
  return fs
    .readFileSync(file, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((l) => {
      try {
        return JSON.parse(l);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

export function appendRuntimeEvidence(entry) {
  const dir = deviceStateDir();
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  fs.appendFileSync(path.join(dir, "runtime-evidence.jsonl"), `${JSON.stringify({ ...entry, recorded_at: nowIso() })}\n`, { mode: 0o600 });
}

const CLAUDE_ALIASES = ["sonnet", "opus", "haiku"];

function baseRecord(fields) {
  return {
    schema_version: 1,
    execution_device_id: deviceId(),
    reachable_from_current_host: false,
    adapter_version: RUNTIME_VERSION,
    executable: null,
    executable_version: null,
    profile_fingerprint: null,
    provider: null,
    billing_class: "unknown",
    requested_model: null,
    observed_model: null,
    tier: "unknown",
    roles: [],
    status: "unavailable",
    capabilities: {},
    static_evidence: [],
    runtime_evidence: [],
    limitations: [],
    usage_visibility: "unknown",
    last_checked_at: nowIso(),
    ...fields,
  };
}

/**
 * Build the route table as seen from `currentHost` ("claude" | "codex").
 * Options: { appServerProbe } — result of a sanitized app-server discovery, if run.
 */
export async function inspectRoutes(currentHost, { appServerProbe } = {}) {
  const ch = codexHome();
  const codexBin = resolveCodexBin();
  const codexVersion = versionOf(codexBin);
  const claudeBin = resolveClaudeBin();
  const claudeVersion = versionOf(claudeBin);
  const configFile = path.join(ch, "config.toml");
  const profileFp = fs.existsSync(configFile) ? sha256File(configFile).slice(0, 16) : null;
  const catalogFile = path.join(ch, "codex-router", "merged-models.json");
  const catalog = catalogModels(catalogFile);
  const routerPort = Number(process.env.XAO_ROUTER_PORT ?? 4202);
  const routerUp = await tcpListening(routerPort);
  const flashRole = path.join(ch, "agents", "astra_flash_builder.toml");
  const flashRoleText = fs.existsSync(flashRole) ? fs.readFileSync(flashRole, "utf8") : "";
  const flashModel = flashRoleText.match(/^model\s*=\s*"([^"]+)"/m)?.[1] ?? null;
  const flashNoDelegation = /\[agents\][^[]*enabled\s*=\s*false/m.test(flashRoleText);
  const usageLog = path.join(ch, "codex-router", "usage-events.jsonl");
  const flashStats = flashModel ? routerStats(usageLog, flashModel) : null;
  const bridgeLauncher = path.join(ch, "skills", "model-council", "scripts", "claude_bridge.mjs");
  const evidence = readRuntimeEvidence();
  const probeModels = appServerProbe?.models ?? null;

  const routes = [];
  const withRuntime = (rec) => {
    const hits = evidence.filter(
      (e) =>
        e.route_id === rec.route_id &&
        e.host === rec.host &&
        (e.executable_version ?? null) === (rec.executable_version ?? null) &&
        e.checks?.inference === true &&
        e.checks?.cleanup === true &&
        e.observed_model &&
        (!rec.requested_model || e.model_match === true),
    );
    if (hits.length > 0 && rec.status !== "unavailable") {
      rec.status = "runtime-verified";
      const last = hits.at(-1);
      rec.observed_model = last.observed_model;
      rec.runtime_evidence = hits.map((h) => `${h.recorded_at} ${h.ref ?? ""}`.trim());
      for (const [k, v] of Object.entries(last.checks)) if (v === true && k in rec.capabilities) rec.capabilities[k] = "supported";
    }
    return rec;
  };

  // --- Claude host routes -----------------------------------------------------------
  routes.push(
    withRuntime(
      baseRecord({
        route_id: "claude.host",
        host: "claude",
        transport: "in-process (current Claude Code session)",
        reachable_from_current_host: currentHost === "claude",
        adapter: "host",
        executable: claudeBin,
        executable_version: claudeVersion,
        provider: "anthropic",
        billing_class: "claude-subscription",
        tier: "frontier",
        roles: ["lead", "writer", "reviewer", "verifier"],
        status: currentHost === "claude" ? "runtime-verified" : claudeBin ? "discovered" : "unavailable",
        capabilities: { read_only_enforcement: "unknown", same_session_follow_up: "supported", cancellation: "supported" },
        static_evidence: currentHost === "claude" ? ["this session is the Claude host"] : [],
        usage_visibility: "session usage visible to the user in-app; no per-assignment token counts here",
        limitations: ["the root UI model is whatever the user selected; this runtime never changes it"],
      }),
    ),
  );
  const reviewerAgent = path.join(HOME, ".claude", "agents", "xao-reviewer.md");
  const reviewerAgentOk = fs.existsSync(reviewerAgent);
  for (const alias of CLAUDE_ALIASES) {
    routes.push(
      withRuntime(
        baseRecord({
          route_id: `claude.subagent.${alias}`,
          host: "claude",
          transport: "native Agent tool (host-dispatched)",
          reachable_from_current_host: currentHost === "claude",
          adapter: "claude-native-subagent",
          executable: claudeBin,
          executable_version: claudeVersion,
          provider: "anthropic",
          billing_class: "claude-subscription",
          requested_model: alias,
          tier: alias === "haiku" ? "economy" : alias === "opus" ? "frontier" : "capable",
          roles: alias === "haiku" ? ["verifier"] : ["writer", "reviewer", "lead", "verifier"],
          status: currentHost === "claude" ? "static-ready" : "unavailable",
          capabilities: {
            read_only_enforcement: reviewerAgentOk ? "supported" : "unknown",
            disable_delegation: "supported",
            same_session_follow_up: "supported",
            cancellation: "supported",
            provider_token_counts: "unsupported",
          },
          static_evidence: [
            ...(currentHost === "claude" ? ["Claude Code Agent tool accepts model sonnet|opus|haiku (observed in the 2.1.280 tool schema)"] : []),
            `xao-reviewer agent definition ${reviewerAgentOk ? "installed" : "not installed"} at ${reviewerAgent}`,
          ],
          usage_visibility: "no per-subagent token counts exposed; draws on Claude subscription",
          limitations: [
            "observed model is not reported back by the Agent tool result; record requested alias and mark observed unknown unless the host shows it",
            "read-only enforcement comes from the xao-reviewer agent definition's tool list (installed separately)",
          ],
        }),
      ),
    );
  }

  // --- Claude host -> Codex App Server routes ----------------------------------------
  const appServerModels = [
    { model: "gpt-6-astra", tier: "frontier", roles: ["lead", "reviewer"], billing: "chatgpt-subscription" },
    { model: "gpt-6-sol", tier: "frontier", roles: ["lead", "reviewer"], billing: "chatgpt-subscription" },
    { model: flashModel ?? "deepseek/deepseek-v4.1-flash", tier: "economy", roles: ["writer"], billing: "deepseek-api" },
  ];
  for (const m of appServerModels) {
    const inCatalog = catalog.includes(m.model);
    const listed = probeModels ? probeModels.includes(m.model) : null;
    const versionOk = codexVersion === PINNED_APP_SERVER_VERSION;
    const needsRouter = m.billing === "deepseek-api" || true; // this profile routes every model through the Router
    let status = "unavailable";
    const lim = [];
    if (currentHost === "claude" && codexBin) {
      status = "discovered";
      if (!versionOk) lim.push(`Codex ${codexVersion} differs from the protocol-mapped ${PINNED_APP_SERVER_VERSION}; regenerate schema and rerun offline adapter tests`);
      if (!inCatalog) lim.push("model not present in the Router catalog file");
      if (needsRouter && !routerUp) lim.push(`Router is not listening on 127.0.0.1:${routerPort}`);
      if (listed === false) lim.push("model/list over the app server did not include this model");
      if (appServerProbe && !appServerProbe.controls_confirmed) lim.push("app-server config/read did not confirm delegation/MCP/plugin controls");
      if (versionOk && inCatalog && routerUp && listed === true && appServerProbe?.controls_confirmed) status = "static-ready";
      // Listed in a desktop picker or catalog but not callable through this adapter: ineligible.
      if (listed === false) status = "unavailable";
      if (listed === null) lim.push("app-server model/list not probed yet (run `xao inspect --probe-app-server`; no inference)");
    }
    routes.push(
      withRuntime(
        baseRecord({
          route_id: `claude.codex-app-server.${m.model}`,
          host: "claude",
          transport: "owned stdio subprocess: codex app-server",
          reachable_from_current_host: currentHost === "claude" && Boolean(codexBin),
          adapter: "codex-app-server",
          executable: codexBin,
          executable_version: codexVersion,
          profile_fingerprint: profileFp,
          provider: m.billing === "deepseek-api" ? "deepseek via codex-router" : "openai via codex-router-signed",
          billing_class: m.billing,
          requested_model: m.model,
          tier: m.tier,
          roles: m.roles,
          status,
          capabilities: {
            read_only_enforcement: "supported",
            per_request_approval: "supported",
            same_session_follow_up: "supported",
            disable_delegation: appServerProbe?.controls_confirmed ? "supported" : "unknown",
            cancellation: "supported",
            descendant_cleanup: "unknown",
            provider_token_counts: "supported",
            dirty_snapshot_input: "supported",
            inference: "unknown",
            tools: "unknown",
          },
          static_evidence: [
            codexBin ? `codex ${codexVersion} at ${codexBin}` : "codex binary not found",
            `catalog ${inCatalog ? "contains" : "lacks"} ${m.model}`,
            `router ${routerUp ? "listening" : "not listening"} on ${routerPort}`,
            ...(listed !== null ? [`app-server model/list ${listed ? "includes" : "omits"} ${m.model}`] : []),
          ],
          usage_visibility:
            m.billing === "deepseek-api"
              ? "provider tokens via thread/tokenUsage and Router usage log; DeepSeek API billing (separate from subscriptions)"
              : "provider tokens via thread/tokenUsage; ChatGPT subscription allowance (remaining % only if account/rateLimits is read)",
          limitations: [
            ...lim,
            "external Codex session: desktop-only tools/plugins are disabled for leaf roles; not visible as the same desktop task",
            "operates on the live checkout (workspace-write) or read-only; Codex sandbox is the enforcement boundary, not the process boundary",
          ],
        }),
      ),
    );
  }

  // --- Codex host routes ----------------------------------------------------------------
  routes.push(
    withRuntime(
      baseRecord({
        route_id: "codex.host",
        host: "codex",
        transport: "in-process (current Codex session)",
        reachable_from_current_host: currentHost === "codex",
        adapter: "host",
        executable: codexBin,
        executable_version: codexVersion,
        profile_fingerprint: profileFp,
        provider: "openai via codex-router-signed",
        billing_class: "chatgpt-subscription",
        tier: "frontier",
        roles: ["lead", "writer", "reviewer", "verifier"],
        status: currentHost === "codex" ? "runtime-verified" : codexBin ? "discovered" : "unavailable",
        capabilities: { same_session_follow_up: "supported", cancellation: "supported" },
        static_evidence: currentHost === "codex" ? ["this session is the Codex host"] : [],
        usage_visibility: "ChatGPT subscription; account/rateLimits shows window percentages",
      }),
    ),
  );
  {
    let status = "unavailable";
    const lim = [];
    if (currentHost === "codex") {
      status = flashModel && catalog.includes(flashModel) && routerUp ? "static-ready" : "discovered";
      if (!flashModel) lim.push("astra_flash_builder role not found");
      if (!routerUp) lim.push("Router not listening");
    }
    if (flashStats) lim.push(`Router log: ${flashStats.ok} OK / ${flashStats.failed} non-200 responses for ${flashModel} (last OK ${flashStats.last}); historical, not verified by this runtime`);
    routes.push(
      withRuntime(
        baseRecord({
          route_id: "codex.native.flash",
          host: "codex",
          transport: "native spawn_agent (host-dispatched), role astra_flash_builder",
          reachable_from_current_host: currentHost === "codex",
          adapter: "codex-native-child",
          executable: codexBin,
          executable_version: codexVersion,
          profile_fingerprint: profileFp,
          provider: "deepseek via codex-router",
          billing_class: "deepseek-api",
          requested_model: flashModel,
          tier: "economy",
          roles: ["writer"],
          status,
          capabilities: {
            disable_delegation: flashNoDelegation ? "supported" : "unknown",
            same_session_follow_up: "supported",
            cancellation: "supported",
            provider_token_counts: "supported",
            read_only_enforcement: "unknown",
          },
          static_evidence: [flashModel ? `role pins ${flashModel}` : "no role", `role [agents] enabled=false: ${flashNoDelegation}`],
          usage_visibility: "Router usage log per request (provider-reported); DeepSeek API billing",
          limitations: lim,
        }),
      ),
    );
  }
  {
    const launcherOk = fs.existsSync(bridgeLauncher);
    routes.push(
      withRuntime(
        baseRecord({
          route_id: "codex.claude-bridge.sonnet",
          host: "codex",
          transport: "owned stdio subprocess: model-council claude_bridge.mjs (official SDK/CLI)",
          reachable_from_current_host: currentHost === "codex" && launcherOk,
          adapter: "claude-bridge",
          executable: claudeBin,
          executable_version: claudeVersion,
          provider: "anthropic",
          billing_class: "claude-subscription",
          requested_model: "sonnet",
          tier: "capable",
          roles: ["writer", "reviewer"],
          status: currentHost === "codex" ? (launcherOk && claudeBin ? "static-ready" : "discovered") : "unavailable",
          capabilities: {
            read_only_enforcement: "supported",
            per_request_approval: "supported",
            same_session_follow_up: "unsupported",
            cancellation: "supported",
            descendant_cleanup: "unknown",
            provider_token_counts: "unsupported",
            dirty_snapshot_input: "unsupported",
          },
          static_evidence: [launcherOk ? `launcher ${bridgeLauncher}` : "launcher missing", "bridge doctor must pass in the Codex host environment"],
          usage_visibility: "no SDK token counters; Claude subscription",
          limitations: [
            "committed Git base only, separate retained worktree, no resume, no automatic integration",
            "refuses when ANTHROPIC_BASE_URL/API env is present (e.g. inside Claude Code) — correct, it is a Codex-host route",
            "2026-09-22 bridge note records one live Sonnet turn on an earlier revision; not re-verified by this runtime",
          ],
        }),
      ),
    );
  }

  for (const r of routes) validate(r, CAPABILITY_SPEC, `capability ${r.route_id}`);
  return {
    device: deviceId(),
    host: currentHost,
    checked_at: nowIso(),
    codex: { bin: codexBin, version: codexVersion, pinned_protocol: PINNED_APP_SERVER_VERSION, profile_fingerprint: profileFp },
    claude: { bin: claudeBin, version: claudeVersion },
    router: { listening: routerUp, catalog_models: catalog.length },
    routes,
  };
}
