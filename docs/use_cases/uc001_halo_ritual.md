# Use Case 001: Daily Halo Ritual Compliance Execution

- **Actor:** Authenticated User
- **Pre-conditions:**
  - User session is fully authenticated.
  - The account safety token is verified (`is_suspended = false`).
  - Access code cookie is present (Staging Bypass valid).

## Main Success Scenario (Standard Flow):
1. User hits the Mobile PWA dashboard. Frontend queries `GET /api/v1/status`.
2. Backend confirms no log exists for the current calendar date (00:00:00 - 23:59:59 based on `Asia/Ho_Chi_Minh` local user timezone). Frontend renders the idle "Halo" primary interaction state.
3. User triggers the primary "Halo" touch targets.
4. Frontend immediately updates the button state to `disabled` to prevent asynchronous click racing or double-submitting.
5. The application backend deploys an atomic database latch `Cache::lock('halo_lock_' . $userId, 5)` to strictly enforce an idempotency boundary.
6. The database stores the timestamp inside `halo_logs` as `check_in_time`.
7. The `HaloPointEngine` calculates earnings based on the time framework matrix.
8. A cryptographically chained block is compiled and appended to the `halo_point_ledger`, securely linked to the previous block's SHA-256 footprint.
9. User's visible profile balance cache increments.
10. API resolves with a `200 OK` structure. Frontend unlocks the state, triggering a pulsing green aura glow around the ring component.

## Exception Paths:
- **Condition 5a (Idempotency Collision / Network Lag):** If a concurrent submission hits the system while the lock is active, the database lock rejects the secondary execution thread and throws an HTTP `429 Too Many Requests` API packet without polluting the data layer.
- **Condition 6a (Streak Interruption Event):** A daily cron routine checks the system at 00:05:00 AM. If no transactional ritual footprint exists for the prior calendar window, the system automatically burns down the user tracking metric: `current_streak = 0`.
