#!/usr/bin/env python3
"""Draw a roundtable panel: one role from each of 5 different groups.

Roles drawn in the last COOLDOWN reviews sit out. Forced roles (--with) skip
the cooldown and take their group's seat.
"""
import argparse
import json
import random
import sys
from datetime import datetime
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROLES = HERE / "roles.json"
HISTORY = HERE / "history.json"
SEATS = 5
COOLDOWN = 2
HISTORY_KEEP = 50


def key(name):
    return "".join(c for c in name.lower() if c.isalnum())


def load_history():
    try:
        return json.loads(HISTORY.read_text(encoding="utf-8"))
    except (FileNotFoundError, ValueError):
        return []


def save_history(history):
    try:
        HISTORY.write_text(json.dumps(history[-HISTORY_KEEP:], indent=2), encoding="utf-8")
    except OSError as e:
        print(f"(Could not save history: {e})", file=sys.stderr)


def print_role(n, role, group):
    print(f"{n}. {role['name']} ({group['name']})")
    print(f"   Asks: {role['asks']}")
    print(f"   Judges: {role['judges']}")
    print(f"   Stays out of: {role['stays_out_of']}")


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--with", dest="forced", action="append", default=[],
                   help="role to force onto the panel (repeatable)")
    p.add_argument("--seed", type=int, help="reuse a seed to repeat a draw")
    p.add_argument("--no-log", action="store_true", help="don't record this draw")
    p.add_argument("--list", action="store_true", help="print every role and exit")
    args = p.parse_args()

    groups = json.loads(ROLES.read_text(encoding="utf-8"))["groups"]

    if args.list:
        n = 0
        for g in groups:
            print(f"\n{g['name']}: {g['about']}")
            for r in g["roles"]:
                n += 1
                print_role(n, r, g)
        return

    lookup = {key(r["name"]): (g, r) for g in groups for r in g["roles"]}
    forced = {}
    for name in args.forced:
        if key(name) not in lookup:
            names = ", ".join(r["name"] for g in groups for r in g["roles"])
            sys.exit(f"Unknown role: {name}\nRoles: {names}")
        g, r = lookup[key(name)]
        if g["name"] in forced and forced[g["name"]] is not r:
            sys.exit(f"Two forced roles share the {g['name']} group. Pick one.")
        forced[g["name"]] = r
    if len(forced) > SEATS:
        sys.exit(f"At most {SEATS} forced roles.")

    seed = args.seed if args.seed is not None else random.randrange(10**6)
    rng = random.Random(seed)

    history = load_history()
    recent = {key(n) for entry in history[-COOLDOWN:] for n in entry["roles"]}

    open_groups = [g for g in groups if g["name"] not in forced]
    picked = {g["name"] for g in groups if g["name"] in forced}
    picked |= {g["name"] for g in rng.sample(open_groups, SEATS - len(forced))}

    panel = []
    for g in groups:
        if g["name"] not in picked:
            continue
        if g["name"] in forced:
            role = forced[g["name"]]
        else:
            fresh = [r for r in g["roles"] if key(r["name"]) not in recent]
            role = rng.choice(fresh or g["roles"])
        panel.append((g, role))

    skipped = [g["name"] for g in groups if g["name"] not in picked]
    print(f"Roundtable panel (seed {seed})")
    print(f"Sitting out: {', '.join(skipped)}\n")
    for n, (g, r) in enumerate(panel, 1):
        print_role(n, r, g)

    if not args.no_log:
        history.append({
            "date": datetime.now().isoformat(timespec="seconds"),
            "seed": seed,
            "roles": [r["name"] for _, r in panel],
        })
        save_history(history)


if __name__ == "__main__":
    main()
