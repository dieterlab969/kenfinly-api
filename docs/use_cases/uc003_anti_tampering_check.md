# Use Case 003: Sequential Sổ Cái Ledger Verification Check

- **Actor:** Automated Security Controller System
- **Pre-conditions:**
  - Automatically triggered upon mission-critical system state alterations (Dashboard login, point emissions, pledge commitments).

## Main Success Scenario:
1. The security model retrieves all records from the `halo_point_ledger` matching the active `user_id`, sorted in ascending order by chronological generation.
2. A processing loop reconstructs the expected cryptographic signatures, manually applying SHA-256 algorithms across sequential indices.
3. The compiler validates that calculated indices perfectly reconcile with the values physically preserved within database cells.
4. Upon zero-variance confirmation, authorization is granted, and the API controller dispatches requested resource bundles normally.

## Exception Path (Database Corruption or Unauthorized Mutation):
1. If any hash signature string discrepancies are identified, execution freezes immediately.
2. An absolute user quarantine protocol is deployed: `users.is_suspended` converts to `true`.
3. The system raises an API isolation response payload, forcing the frontend application to drop state layers and block everything with a full-screen lockdown interface layout.
