# Kenfinly - Subscription & License Workflow

**Version**: 1.0  
**Last Updated**: January 03, 2026  
**Target Audience**: New Team Members, Developers, QA Engineers

---

## 1. Subscription Initialization

When a user selects a subscription plan (e.g., **Pro Monthly**), the system performs the following steps:

* A new record is created in the `subscriptions` table with the status set to **`pending`**.
* This record acts as the **master record** for the entire billing cycle.
* The subscription links:

  * `user_id` → the subscribing user
  * `plan_id` → the selected subscription plan

At this stage, **no premium access is granted**. The system is waiting for payment confirmation.

---

## 2. Payment Processing

After subscription initialization, the system waits for a response from the payment gateway:

* The payment gateway processes the transaction.
* Upon **successful payment confirmation**:

  * The subscription status is updated from **`pending` → `active`**.
  * The following fields are set:

    * `start_date` → subscription activation date
    * `end_date` → calculated based on the plan’s billing cycle

Only after this step does the subscription become valid.

---

## 3. License Generation & Assignment

Immediately after the subscription becomes active, the backend triggers the **license creation workflow**.

### 3.1 Unique Key Generation

* A **cryptographically secure**, unique `license_key` is generated.
* This key uniquely represents the user’s entitlement.

### 3.2 License Record Creation

* A new record is created in the `licenses` table.
* The license contains essential metadata such as status and expiration.

### 3.3 License Assignment

* The license is explicitly linked to:

  * `user_id`
  * `subscription_id`

This **dual-linking** ensures that:

* A user can have multiple subscriptions over time.
* Each subscription has its **own independently tracked license**.

### 3.4 License Activation

* The license status is set to **`active`**.
* The `expires_at` timestamp is synchronized with the subscription’s `end_date`.

At this point, the user is fully entitled to access premium features.

---

## 4. Entitlement Verification

Whenever a user attempts to access premium functionality (e.g., **CSV exports** or **advanced charts**), the application validates access by checking the `licenses` table.

A license is considered valid if **all** of the following conditions are met:

* The license status is **`active`**.
* The `expires_at` timestamp is **in the future**.
* The license is linked to the current user’s **active subscription**.

---

## 5. Design Benefits

This architecture provides several key advantages:

* **Clear separation of concerns** between billing (`subscriptions`) and access control (`licenses`).
* **Flexible handling of billing transitions**, such as:

  * Grace periods
  * Plan upgrades or downgrades
  * Payment retries
* Licenses can remain valid even if the underlying subscription is temporarily transitioning.

This approach ensures a robust, scalable, and user-friendly subscription system for Kenfinly.

