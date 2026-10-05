# Select the planner, worker and review

> **Implementation status (runtime 0.1.0).** `xao select` implements the eligibility filter and starting heuristics below.
> Outcome records (`evidence/outcomes/`) can move the lead only with ≥ 3 comparable outcomes and a ≥ 0.25 acceptance gap.
> Accounting follows the rules at the end of this file. `xao usage` never merges billing classes.

This is the proposed shared policy. Selection operates on device-local capability and outcome records; it does not assert which models are currently available.

## Choose a complete route, not just a model name

A route is `(execution device, reachable transport, adapter, executable/version, profile, auth class, requested model, observed model, effort, tools, permission scope)`. A model listed in the Codex desktop app is not automatically exposed through an external CLI. A route available on a Mac is not automatically available on ACE8. Changes to these fields invalidate or narrow earlier evidence.

Candidate families include the user's selected native model, available Codex planning/coding models including Astra when exposed, available Claude models such as Sonnet/Opus, and the existing DeepSeek Flash route. Add other models only when already available and authorized, or after a separate setup decision. Prefer version-pinned evidence; aliases can change. A native Claude Haiku route can be considered for small tasks only if its measured performance and overhead justify it. Do not run a tournament on every request.

## Eligibility comes before cost

1. Honor explicit user role/model/provider choices and any no-delegation instruction. An explicitly required unavailable model produces a blocker, not a hidden substitute.
2. Check reachable dispatch transport, execution identity, provider-sharing scope, auth, actual tool capabilities, permission enforcement, context requirements and access to the correct baseline. Exclude any route that needs a new credential/provider, broader access, or an unsupported tool workaround. The initial adapters are local to the executing host; a verified model on another machine is ineligible until there is an authorized supported transport or an explicit completed handoff to that machine. Do not combine disconnected hosts' capabilities into one fictional route.
3. Exclude unavailable or failed routes. `discovered` or `static-ready` is not live proof. A first useful task can establish runtime evidence only when that use is already authorized and risk is suitably bounded; otherwise leave verification pending.
4. Set the quality floor from the task: required acceptance checks, architecture/security judgment, native-device/browser capabilities, and any human acceptance gate. Do not assign high-risk work solely because a model's price is low.
5. Respect task budgets and observed account limits. Unknown allowance remains unknown. A model limit is not permission to add API billing.

## Compare the eligible candidates

Select on expected **accepted-outcome effort**, including lead planning, worker startup context, implementation, tools, review, likely correction, switching and integration. Raw per-token price is only one input.

Use a simple two-stage decision rather than an invented universal score:

- Meet the quality floor using task evidence, comparable accepted outcomes and conservative judgment.
- Among candidates likely to meet it, prefer lower measured spend/quota pressure and lower expected rework. If differences are poorly evidenced, prefer a verified route with lower switching overhead and state the uncertainty.

Subscription consumption and dollar charges are different axes. Do not convert them to one dollar figure unless the user deliberately supplies an opportunity-cost model, and label that model as an estimate. Existing prepaid access does not imply unlimited capacity or zero usage cost. The default priority is: satisfy required quality, stay within authorized spending and available allowance, then reduce total resource use and delay. The user can change that priority.

## Starting heuristics

| Task | Lead | Worker / review pattern |
| --- | --- | --- |
| Small explanation, inspection or tiny edit | Current host | Do directly; avoid delegation startup |
| Clear substantial feature or refactor | Current capable lead, or another verified lead if there is a concrete fit advantage | Usually one Flash writer; one batched lead review |
| Ambiguous architecture, data migration, security or multi-system behavior | Best evidenced eligible reasoning lead across Codex/Claude | Lead resolves contracts; Flash handles bounded portions; independent targeted review where risk warrants |
| Nuanced implementation with repeated semantic failures on the economical route | Suitable alternative worker, including Claude or native Codex | Reassign only after stopping previous writer and preserving evidence |
| Native UI/browser task | Lead with relevant judgment | Worker must have the required actual environment/tools; a text-only adapter cannot substitute for device testing |
| Requested council or material unresolved alternatives | One decision lead | Normally at most two independent read-only reviewers |

These are defaults, not rankings. No evidence here establishes a permanent winner between Astra, Opus, Sonnet or another Codex model. Expensive lead time should be concentrated at contract and acceptance boundaries; the host does not add a second complete review automatically.

Keep the selected lead stable within a phase. Reconsider at a dependency boundary, explicit user request, quota failure or demonstrated mismatch. Avoid repeated switching on small noisy cost differences. Preserve the same worker for one consolidated correction when the native adapter supports it; count fresh-context overhead when it does not.

## Escalation and council

Escalate after a material review failure indicating deficient judgment, unresolved ambiguity, or consequential reviewer disagreement. A missed line, typo or straightforward failing check normally goes back to the same writer. After one correction cycle, reassess route/scope instead of entering an indefinite retry loop; a further cycle needs a stated task-specific reason.

Independent reviewers receive the same candidate hash, brief and raw evidence before seeing one another's opinions. They return severity, claim, exact evidence and smallest useful correction. Share only material disagreements; each gets at most one rebuttal. The selected lead records its decision and supporting verification. No vote-based acceptance and no recursive debate. If correctness remains unresolved, mark the work incomplete.

Read-only reviewers have enforced tool restrictions where available. The legacy Claude bridge controller denies every Write/Edit/Bash request. Other adapters must implement equivalent restrictions or be ineligible for that reviewer assignment. A natural-language “read only” instruction alone is not a security boundary.

## Learn from work already being done

Keep compact, sanitized outcome records by task family and exact route: scope/complexity, baseline, requested/observed model and effort, acceptance, correction count, escaped defects when known, elapsed time, provider counts, estimated spend, actual charges if supplied, and evidence coverage. Record failures and cancellations, not only successes. Do not include raw private code or prompts in an account-wide scorecard.

Small samples stay provisional. Compare similar task families and account for context/effort/version changes. Do not blame a model for an adapter crash or compare a toy task to a large migration. Update preferences after accepted phases rather than running paid benchmarks by default.

## Accounting rules

- Provider-reported counts, byte/text estimates, costs calculated from dated rates, actual charges and subscription remaining limits have separate fields and provenance.
- Cached input may be a subset of input; never add it twice. Repeated cumulative events need stable IDs and deduplication. Prompt totals across turns are not unique context size.
- The supplied Claude bridge lacks SDK token counters; record them as unavailable until an adapter actually exposes reliable counts. Do not inspect private account transcripts to fill the gap.
- Budget targets are advisory unless the controller can stop at that boundary. Enforce wall-time/request limits where supported; do not promise a hard token/dollar cap from delayed metering. Stop new dispatches when a limit is reached and cancel owned activity where supported.
- Reuse standing authorization for ordinary in-scope routed work. Distinguish it from approval to buy capacity, change providers, run setup probes, or cross a new data-sharing boundary.
