# Use Case 002: Promise Betting & Capital Slashing Lifecycle

- **Actor:** Authenticated User
- **Pre-conditions:**
  - User possesses a `halo_points_balance` greater than or equal to the intended collateral wager.

## Main Success Scenario (Creating a Promise):
1. User enters the "Commitment" view and details a tactical personal constraint or spending milestone.
2. User configures a custom HP stake value (e.g., 30 HP).
3. The system checks the user's ledger balances. Upon verification, the targeted amount is immediately subtracted from `halo_points_balance`.
4. A state entity is logged in the `promises` table tagged as `active`.
5. An entry type `promise_lock` is successfully calculated and written to the cryptographic ledger pipeline.

## Alternative Scenario (The Burn / Loss Flow):
1. The user breaks their promise threshold or manually executes a cancellation event ("Kill Promise").
2. The promise record transitions to a state value of `failed`.
3. The ecosystem executes a permanent capital slash, recording a transaction record type `promise_burn` into the ledger logs. These points are officially liquidated from circulation.
