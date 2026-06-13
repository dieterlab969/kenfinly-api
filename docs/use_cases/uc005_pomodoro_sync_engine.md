# Use Case 005: State-Synced Pomodoro Engine & Access Control Layer (ACL)

- **Actor:** Guest User / Authenticated Registered User
- **Pre-conditions:**
  - For Registered Users, the account must not be suspended (`is_suspended = false`).

## 1. Access Control Layer (ACL) & Role Matrix
To handle granular rights between Guests and Registered Users without complex RBAC overhead, we implement a lightweight Token/Ability-based ACL.

| Role | Database Logging | State Restoration | History Review (Analytics) |
| :--- | :--- | :--- | :--- |
| **Guest** | ❌ No (Local Memory Only) | ❌ No (Lost on refresh) | ❌ No |
| **Registered** | ✅ Yes (Append-only logs) | ✅ Yes (Cross-device Sync) | ✅ Yes (Monthly/Daily stats) |

## 2. Database Schema Design

### A. Table `pomodoro_sessions` (Tracking completed blocks)
Tracks every fully completed 25-minute focus interval.
- `id`: Unsigned BigInt (Primary Key)
- `user_id`: Foreign Key linking to `users.id`
- `started_at`: Timestamp (When the user hit 'Play')
- `completed_at`: Timestamp (When the 25 minutes expired)
- `status`: Enum (`completed`, `interrupted`)
- `timestamps`

### B. Table `pomodoro_active_states` (Cross-device State Restoration)
Stores the single active running timer state per user.
- `user_id`: Foreign Key linking to `users.id` (Unique Key - One active session max)
- `client_timer_started_at`: Timestamp (The exact server time when 'Play' was triggered)
- `duration_seconds`: Integer (Default 1500 for a 25-min session)
- `is_paused`: Boolean (Default false)
- `remaining_seconds`: Integer (Used if paused)
- `updated_at`: Timestamp

## 3. Core Algorithm: Cross-Device State Restoration (The "Time-Gap" Calculation)
To ensure the session restores accurately even if the user closes their browser and opens it on another machine (e.g., from Mac to Galaxy Tab), the system **NEVER** relies on a JavaScript countdown running on the client. It relies entirely on **Server Timestamp Math**.

### Logic Flow (When User hits 'Play'):
1. Frontend dispatches `POST /api/v1/pomodoro/start`.
2. Backend validates ACL. If `Registered`, it inserts/updates the `pomodoro_active_states` table:
   - `client_timer_started_at = NOW()`
   - `duration_seconds = 1500`
   - `is_paused = false`

### Logic Flow (When User restores/opens the app on ANY device):
1. Frontend calls `GET /api/v1/pomodoro/state`.
2. Backend checks if an active row exists for the user. If found:
   - Calculate the Elapsed Time: $$\text{Seconds\_Elapsed} = \text{NOW()} - \text{client\_timer\_started\_at}$$
   - Calculate Remaining Time: $$\text{Remaining} = \text{duration\_seconds} - \text{Seconds\_Elapsed}$$
3. **Branch Conditions:**
   - **Case A ($\text{Remaining} > 0$):** The timer is still running. Backend returns `{"status": "running", "remaining_seconds": Remaining}`. Frontend boots the countdown ticker directly from this value.
   - **Case B ($\text{Remaining} \le 0$):** The session finished while the user was away. Backend automatically:
     1. Deletes the active state row.
     2. Appends a new verified record into `pomodoro_sessions` with `status = 'completed'`.
     3. Returns `{"status": "idle", "completed_trigger": true}`. Frontend triggers the completion sound effect.

## 4. Analytics & Review Endpoint
- **Endpoint:** `GET /api/v1/pomodoro/analytics?range=monthly`
- **Logic:** Queries `pomodoro_sessions` grouping by date to output the exact `x sessions` completed, allowing data visualization of productive output over days, weeks, or months.
