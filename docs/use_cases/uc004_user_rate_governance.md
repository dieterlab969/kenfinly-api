# Use Case 004: Semi-Annual Fixed Window Hourly Rate Governance

- **Actor:** Authenticated User
- **Pre-conditions:**
  - User profile is active and fully verified (`is_suspended = false`).
  - The `users` table contains the `hourly_rate` native field.

## 1. User Story
- **US008 (Self-Worth Valuation & Commit):** As a professional tracking financial growth, I want to set my personal `hourly_rate` to calculate my **Expected Income** versus my **Actual Income**, but I must be restricted to modifying this rate maximum TWICE a year within fixed semi-annual review windows so that I am forced to commit to increasing my actual market value before arbitrarily raising my self-valuation.

## 2. Database History Tracking Schema (`user_rate_logs`)
To enforce the bi-annual fixed window constraint without bloating the main users table, create a logs table to track mutations:
- `id`: Unsigned BigInt (Primary Key)
- `user_id`: Foreign Key linking to `users.id`
- `old_rate`: Decimal/Float
- `new_rate`: Decimal/Float
- `allowance_year`: Integer (e.g., 2026)
- `review_window`: Enum (**H1**, **H2**) — representing first half (Jan-Jun) or second half (Jul-Dec) of the year
- `timestamps` (`created_at`, `updated_at`)

## 3. Main Success Scenario (Updating the Hourly Rate):
1. User submits a new rate mutation via `PUT /api/v1/user/hourly-rate` with `hourly_rate` value.
2. Backend determines the current calendar year and current review window (**H1** for Jan-Jun, **H2** for Jul-Dec) based on the user’s timezone context.
3. System queries the `user_rate_logs` table to check if the user has already updated their rate in the current year and review window:
   `SELECT COUNT(*) FROM user_rate_logs WHERE user_id = ? AND allowance_year = ? AND review_window = ?`

4. **Validation Check:**
   - If the count is **0** (user has not updated in this window), the mutation is permitted.
   - The system locks down the transaction thread, logs the old and new valuation into `user_rate_logs` with the current year and review window.
   - The system updates the primary `hourly_rate` directly inside the `users` model.
   - Returns HTTP `200 OK` with the new target metrics.
5. The frontend visualization layer updates the **Expected Income** dynamic graphics ($Hourly\_Rate \times Target\_Hours$).

## 4. Exception Path (Rate Limit Exceeded):
1. If the user has already updated their rate in the current review window (count ≥ 1), the operation is strictly aborted.
2. The API drops execution and dispatches an HTTP `403 Forbidden` JSON structure:
   ```json
    {
    "status": "error",
    "code": "RATE_UPDATE_WINDOW_LOCKED",
    "message": "Bạn đã cập nhật Mức định giá bản thân trong kỳ review này. Lần cập nhật tiếp theo sẽ được mở vào kỳ review tiếp theo."
    }
