# Database Migration Ownership Map

**Generated:** 2026-08-16T07:11:02.981Z
**Source:** `database/migrations` filenames and schema operations

The current migration chain contains **73 migrations**.
Feature ownership is inferred from migration names and should be
confirmed when a feature is actively refactored.

| Migration | Inferred owner | Operation | Tables | Dependencies | Destructive review | Down method |
| --- | --- | --- | --- | --- | --- | --- |
| `0001_01_01_000000_create_users_table.php` | Users | Create | users, password_reset_tokens, sessions | user | Review required | Present |
| `0001_01_01_000001_create_cache_table.php` | Framework infrastructure | Create | cache, cache_locks | None detected | Review required | Present |
| `0001_01_01_000002_create_jobs_table.php` | Framework infrastructure | Create | jobs, job_batches, failed_jobs | None detected | Review required | Present |
| `2025_10_28_053028_create_accounts_table.php` | Accounts / wallets | Create | accounts | user | Review required | Present |
| `2025_10_28_053040_create_categories_table.php` | Other / review required | Create | categories | categories, parent | Review required | Present |
| `2025_10_28_053052_create_transactions_table.php` | Transactions / ledger | Create | transactions | user, account, category | Review required | Present |
| `2025_10_28_133352_create_roles_table.php` | Other / review required | Create | roles | None detected | Review required | Present |
| `2025_10_28_133353_create_user_roles_table.php` | Users | Create | user_roles | users, roles, user, role | Review required | Present |
| `2025_11_08_000000_create_subscription_plans_table.php` | Subscriptions / licensing | Create | subscription_plans | None detected | Review required | Present |
| `2025_11_08_124113_create_languages_table.php` | Internationalization | Create | languages | None detected | Review required | Present |
| `2025_11_08_124114_add_language_preference_to_users_table.php` | Internationalization | Alter | users | languages, language | Review required | Present |
| `2025_11_08_124114_create_translations_table.php` | Internationalization | Create | translations | languages, language | Review required | Present |
| `2025_11_08_181508_create_licenses_table.php` | Subscriptions / licensing | Create | licenses | user | Review required | Present |
| `2025_11_08_181509_create_subscriptions_table.php` | Subscriptions / licensing | Create | subscriptions | subscription_plans, user, plan | Review required | Present |
| `2025_11_08_181510_create_payment_webhooks_table.php` | Payments / commerce | Create | payment_webhooks | None detected | Review required | Present |
| `2025_11_08_181510_create_payments_table.php` | Payments / commerce | Create | payments | user, subscription | Review required | Present |
| `2025_11_08_181511_create_account_participants_table.php` | Accounts / wallets | Create | account_participants | users, account, user, role, invited_by | Review required | Present |
| `2025_11_08_181512_create_invitations_table.php` | Accounts / wallets | Create | invitations | users, account, invited_by, role | Review required | Present |
| `2025_11_09_093030_create_transaction_change_logs_table.php` | Transactions / ledger | Create | transaction_change_logs | transactions, users, transaction, user | Review required | Present |
| `2025_11_09_093030_create_transaction_photos_table.php` | Transactions / ledger | Create | transaction_photos | transactions, users, transaction, uploaded_by | Review required | Present |
| `2025_11_11_072810_create_app_settings_table.php` | Application settings | Create | app_settings | None detected | Review required | Present |
| `2025_11_11_093233_add_email_verification_fields_to_users_table.php` | Identity / preferences | Alter | users | None detected | Review required | Present |
| `2025_11_11_093234_create_email_verifications_table.php` | Identity / preferences | Create | email_verifications | user | Review required | Present |
| `2025_12_17_100000_add_google_tag_manager_to_app_settings.php` | Application settings | Other | Not resolved | None detected | No destructive operation detected | Present |
| `2025_12_17_110000_add_logo_settings_to_app_settings.php` | Application settings | Other | Not resolved | None detected | No destructive operation detected | Present |
| `2025_12_28_100000_create_payment_methods_table.php` | Payments / commerce | Create | payment_methods | user | Review required | Present |
| `2025_12_30_102141_create_payment_gateways_table.php` | Payments / commerce | Create | payment_gateways | None detected | Review required | Present |
| `2025_12_30_102417_create_payment_gateway_credentials_table.php` | Payments / commerce | Create | payment_gateway_credentials | None detected | Review required | Present |
| `2026_01_01_110940_create_waitlists_table.php` | Other / review required | Create | waitlists | None detected | Review required | Present |
| `2026_01_12_210016_create_user_consents_table.php` | Identity / preferences | Create | user_consents | None detected | Review required | Present |
| `2026_01_28_095218_create_habits_table.php` | Saving tracker | Create | habits | user | Review required | Present |
| `2026_01_28_095226_create_habit_trackings_table.php` | Saving tracker | Create | habit_trackings | habit | Review required | Present |
| `2026_01_28_095232_create_achievements_table.php` | Saving tracker | Create | achievements | user, habit | Review required | Present |
| `2026_05_20_230000_add_halo_fields_to_users_table.php` | Halo / productivity | Alter | users | None detected | Review required | Present |
| `2026_05_20_230010_add_halo_fields_to_transactions_table.php` | Transactions / ledger | Alter | transactions | None detected | Review required | Present |
| `2026_05_20_230020_create_attendances_table.php` | Halo / productivity | Create | attendances | transactions, user, reward_transaction | Review required | Present |
| `2026_05_21_000010_create_user_hourly_rate_changes_table.php` | Halo / productivity | Create | user_hourly_rate_changes | user | Review required | Present |
| `2026_05_21_000020_create_commitments_table.php` | Halo / productivity | Create | commitments | user | Review required | Present |
| `2026_05_21_000030_create_ledger_daily_summaries_table.php` | Transactions / ledger | Create | ledger_daily_summaries | user | Review required | Present |
| `2026_06_02_000001_create_halo_histories_table.php` | Halo / productivity | Create | halo_histories | user | Review required | Present |
| `2026_06_12_000001_add_halo_point_fields_to_users_table.php` | Halo / productivity | Alter | users | None detected | Review required | Present |
| `2026_06_12_000002_create_halo_point_ledger_table.php` | Transactions / ledger | Create | halo_point_ledger | user | Review required | Present |
| `2026_06_13_000001_create_user_rate_logs_table.php` | Halo / productivity | Create | user_rate_logs | user | Review required | Present |
| `2026_06_13_000002_create_pomodoro_sessions_table.php` | Halo / productivity | Create | pomodoro_sessions | user | Review required | Present |
| `2026_06_13_000003_create_pomodoro_active_states_table.php` | Halo / productivity | Create | pomodoro_active_states | user | Review required | Present |
| `2026_06_13_000004_add_review_window_to_user_rate_logs_table.php` | Halo / productivity | Alter | user_rate_logs | None detected | Review required | Present |
| `2026_06_17_000001_add_subscription_fields_to_users_table.php` | Subscriptions / licensing | Alter | users | None detected | Review required | Present |
| `2026_06_17_000001_add_user_id_is_system_to_categories_table.php` | Users | Alter | categories | None detected | Review required | Present |
| `2026_06_17_000002_create_payos_payment_orders_table.php` | Payments / commerce | Create | payos_payment_orders | user | Review required | Present |
| `2026_06_17_000003_create_orders_table.php` | Payments / commerce | Create | orders | user | Review required | Present |
| `2026_06_17_180537_add_gateway_to_orders_table.php` | Payments / commerce | Alter | orders | None detected | Review required | Present |
| `2026_06_17_192827_add_country_currency_to_users_table.php` | Currencies | Alter | users | None detected | Review required | Present |
| `2026_06_17_200000_add_exchange_rate_used_to_orders_table.php` | Payments / commerce | Alter | orders | None detected | Review required | Present |
| `2026_06_17_210000_create_shopping_cart_table.php` | Payments / commerce | Create | shopping_cart | None detected | Review required | Present |
| `2026_06_17_210001_add_cart_session_key_to_orders_table.php` | Payments / commerce | Alter | orders | None detected | Review required | Present |
| `2026_06_19_000001_drop_legacy_cart_checkout_tables.php` | Payments / commerce | Other | shopping_cart, payos_payment_orders, orders | None detected | Review required | Present |
| `2026_06_19_000002_create_processed_payments_table.php` | Payments / commerce | Create | processed_payments | None detected | Review required | Present |
| `2026_06_21_000001_add_social_auth_columns_to_users_table.php` | Identity / preferences | Alter | users | None detected | Review required | Present |
| `2026_06_22_000001_add_bank_name_account_type_to_accounts.php` | Accounts / wallets | Alter | accounts | None detected | Review required | Present |
| `2026_06_22_000002_add_indexes_and_restrict_account_fk.php` | Accounts / wallets | Alter | accounts, transactions | None detected | Review required | Present |
| `2026_06_22_000003_add_rtl_and_order_to_languages.php` | Payments / commerce | Alter | languages | None detected | Review required | Present |
| `2026_06_24_000001_add_profile_fields_to_users_table.php` | Identity / preferences | Alter | users | None detected | Review required | Present |
| `2026_06_24_000002_add_address_to_users_table.php` | Users | Alter | users | None detected | Review required | Present |
| `2026_06_25_000001_add_security_settings_to_users_table.php` | Identity / preferences | Alter | users | None detected | Review required | Present |
| `2026_06_25_172223_create_user_preferences_table.php` | Identity / preferences | Create | user_preferences | users, user | Review required | Present |
| `2026_06_25_185540_create_user_notification_settings_table.php` | Identity / preferences | Create | user_notification_settings | users, user | Review required | Present |
| `2026_06_26_210409_add_deletion_fields_to_users_table.php` | Users | Alter | users | None detected | Review required | Present |
| `2026_06_27_000001_create_user_subscriptions_table.php` | Subscriptions / licensing | Create | user_subscriptions | user | Review required | Present |
| `2026_06_27_000002_create_user_subscription_reminders_table.php` | Subscriptions / licensing | Create | user_subscription_reminders | user_subscriptions, user_subscription | Review required | Present |
| `2026_06_27_000003_create_user_payment_histories_table.php` | Payments / commerce | Create | user_payment_histories | user_subscriptions, user_subscription, user | Review required | Present |
| `2026_06_27_162017_add_transfer_fields_to_transactions_table.php` | Transactions / ledger | Alter | transactions | None detected | Review required | Present |
| `2026_06_28_170041_create_currencies_table.php` | Other / review required | Create | currencies | None detected | Review required | Present |
| `2026_06_30_075051_create_summary_category_daily_table.php` | Transactions / ledger | Create | summary_category_daily | None detected | Review required | Present |

## Phase 0 observations

- Duplicate timestamp prefixes detected: `0001_01_01` (3), `2025_10_28` (5), `2025_11_08` (10), `2025_11_09` (2), `2025_11_11` (3), `2025_12_17` (2), `2025_12_30` (2), `2026_01_28` (3), `2026_05_20` (3), `2026_05_21` (3), `2026_06_12` (2), `2026_06_13` (4), `2026_06_17` (9), `2026_06_19` (2), `2026_06_22` (3), `2026_06_24` (2), `2026_06_25` (3), `2026_06_27` (4).
- Existing migrations must remain append-only once they are applied to
  shared or production databases.
- `down()` presence does not guarantee a safe rollback; destructive
  changes and data backfills require explicit review.
- Phase 5 should add migration linting, fresh-install checks, upgrade
  checks, and documented ownership before any baseline/squash decision.

