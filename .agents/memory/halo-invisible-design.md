---
name: Halo Invisible Design
description: Single-button Halo Ritual redesign — duration logic, auto-close, halo_histories table.
---

## Rule
AttendanceService uses `SECS_FULL=28800` (pre-noon) / `SECS_HALF=14400` (post-noon, capped at midnight) — never a hardcoded `SESSION_HOURS=8`.

**Why:** Spec requires 12:00 PM local-time threshold. Post-noon sessions must cap at both 4h and seconds until midnight so expected_end_at never crosses midnight.

**How to apply:** Any change to session duration must touch `calculateDuration()` in `AttendanceService`. The DB column `halo_histories.max_seconds` stores the allocated duration for that day.

## Key decisions
- `status()` lazily auto-closes expired 'initiated' sessions inline (no background job / Redis needed).
- `halo_histories` is written on auto-close AND on manual `complete()` — upsert is idempotent.
- `HaloSessionResource` returns `start_time` (unix ts) + `duration` (secs) so the frontend runs its countdown independently (zero per-second API calls).
- Frontend `applySession()` is the single state reconciler — called on mount, on start press, and never in the countdown interval.
