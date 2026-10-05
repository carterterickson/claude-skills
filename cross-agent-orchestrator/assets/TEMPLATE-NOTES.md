# Record examples

The JSON files here are non-executable design examples, not runtime state or completed schemas. `template_only: true` prevents mistaking empty examples for discovered capabilities or accepted work. The implementer must validate required fields, status enums, safe relative evidence paths and legal transitions, then instantiate real records with actual evidence. Remove the template marker only on real validated instances.

`state.example.json` is the portable task record. Keep canonical local paths, process identifiers and ownership-lock implementation in the referenced device-local binding. A fencing number in a file is insufficient without atomic claim/revision checks and worker quiescence.

`capability.example.json` uses explicit unknowns. Suggested status enum: unavailable, discovered, static-ready, runtime-verified. Per-operation capabilities may be supported, unsupported or unknown. Runtime evidence must say which role/capability/host/version it covers; it does not turn every unknown field to supported.

`outcome.example.json` separates evidence and accounting categories. Validate nonnegative finite counts, monotonic cumulative snapshots and event deduplication. Do not total unknown or estimated counts as provider usage, and do not add cached input to input when it is a subset. Store no account identifiers, keys, raw prompts or secrets in these examples' real instances.
