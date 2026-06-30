# Architectural Specification: Halo Point (HP) Cryptographic Ledger

## 1. System Philosophy & Currency Dynamics
Halo Points (HP) represent a user's **Discipline and Credibility Equity**. It is a deflated, scarce gamification currency used as collateral for personal accountability.

## 2. Mathematical Formula (Market-Driven Dynamic Pricing)
The emission of HP is governed by the following mathematical calculation:

$$HP_{Earned} = Base \times Multiplier \times Market\_Factor$$

### Component Rule Matrices:
1. **Base Value:**
   - **Standard Completion (04:00 AM - 10:00 AM):** `Base = 10`
   - **Late Entry (10:01 AM - 23:59 PM):** `Base = 5` (UI Gauge ring opacity/fill is automatically restricted to a maximum of 50%).
2. **Streak Multiplier:**
   - Streak 1–6 days: `Multiplier = 1.0x`
   - Streak 7–14 days: `Multiplier = 1.2x`
   - Streak 15–30 days: `Multiplier = 1.5x` (UI changes color tokens to Neon Cyan)
   - Streak >30 days (God Mode): `Multiplier = 2.0x` (UI renders a golden pulsing streak flame)
3. **Market Factor:**
   - Hardcoded to `1.0` for the current MVP release.
   - **Governance Rule:** This variable can only be altered **once a year (on January 1st)** to adjust to global platform parameters (total user base size, cross-border active markets, and systemic completion success rates).

## 3. Immutable "Fake Blockchain" Ledger Architecture
To prevent local/database level tampering and secure the integrity of the Global Leaderboard, all point adjustments must be recorded inside a cryptographically linked append-only sequential ledger.

### Database Constraints (`halo_point_ledger`):
- `id`: Unsigned BigInt (Primary Key)
- `user_id`: Foreign Key linking to `users.id`
- `transaction_type`: Enum (`welcome_bonus`, `survival_reward`, `promise_lock`, `promise_burn`)
- `amount`: Signed Integer (e.g., +100, +12, -30)
- `previous_hash`: String (64 characters)
- `current_hash`: String (64 characters)

### Cryptographic Chain Validation Logic:
For any given transaction row $N$:
$$\text{current\_hash}_N = \text{SHA-256}(\text{previous\_hash}_N \parallel \text{user\_id} \parallel \text{amount} \parallel \text{transaction\_type} \parallel \text{created\_at})$$

- **Genesis Entry:** For a user's initial record (the `100 HP` Welcome Bonus), the `previous_hash` must be a hardcoded 64-character zero string (`0000000000000000...`).
- **Zero-Tolerance Anti-Tampering Mechanism:** Every load cycle of the dashboard or instantiation of a new financial transaction must trigger a boot service that programmatically recalculates and verifies the user's ledger integrity sequentially.
- If a hash mismatch is detected (indicating database tampering or malicious score injection), the system must abort execution, flag the user column `is_suspended = true`, and terminate the session with a strict JSON structure:

```json
{
  "status": "suspended",
  "message": "Hệ thống phát hiện gian lận kỷ luật - Tài khoản bị phong tỏa"
}
```
