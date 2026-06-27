# User Stories & Acceptance Criteria

## Epic: Subscription Management & Renewal Automation

### Description

The Subscription Management feature enables users to create, manage, monitor, and automate recurring subscription services. Users can configure renewal reminders, track payment history, and avoid unexpected charges from auto-renewing subscriptions and free trials.

---

# User Story 1: Create a Subscription

## Story

**As a** user,

**I want** to create and save a subscription service,

**So that** I can track recurring expenses and upcoming renewal dates.

---

## Acceptance Criteria

### Scenario 1.1 – Create a Recurring Subscription

**Given**

The user is on the Subscription Management screen.

**When**

The user clicks the “Add Subscription” button and enters:

- Service Name (e.g., Netflix)
- Amount (e.g., 54,000 VND)
- Billing Cycle (Weekly, Monthly, Yearly)
- Next Billing Date
- Reminder Configuration (optional)

**Then**

The system shall:

- Validate all required fields.
- Create a new subscription record.
- Save the subscription successfully.
- Display a success message.
- Display the subscription in the Active tab.
- Refresh the subscription list automatically.

---

### Scenario 1.2 – Required Field Validation

**Given**

The user is creating a subscription.

**When**

One or more required fields are missing.

**Then**

The system shall:

- Prevent submission.
- Highlight invalid fields.
- Display validation messages.

Examples:

Field

Validation Message

Service Name

Service name is required

Amount

Amount must be greater than zero

Billing Date

Next billing date is required

---

### Scenario 1.3 – Invalid Amount

**Given**

The user is creating a subscription.

**When**

The amount is:

- Zero
- Negative
- Non-numeric

**Then**

The system shall reject the request and display an error message.

---

# User Story 2: Edit a Subscription

## Story

**As a** user,

**I want** to edit an existing subscription,

**So that** I can keep my subscription information up to date.

---

## Acceptance Criteria

### Scenario 2.1 – Open Edit Screen

**Given**

The user sees a subscription in the list.

**When**

The user clicks the Edit icon.

**Then**

The system shall:

- Navigate to the Edit Subscription screen.
- Pass the subscription ID.
- Load the latest subscription details from the server.
- Populate all editable fields.

---

### Scenario 2.2 – Update Subscription Successfully

**Given**

The user is editing a subscription.

**When**

The user modifies one or more fields and clicks Update.

**Then**

The system shall:

- Validate inputs.
- Save changes successfully.
- Display a success message.
- Refresh the subscription list.
- Return to the previous screen.

---

### Scenario 2.3 – API Failure During Update

**Given**

The user submits changes.

**When**

The API request fails.

**Then**

The system shall:

- Preserve all user-entered values.
- Display an appropriate error message.
- Allow retry without losing data.

---

# User Story 3: Configure Renewal Reminders

## Story

**As a** user,

**I want** to receive reminder notifications before renewal,

**So that** I can cancel unwanted subscriptions or prepare funds.

---

## Acceptance Criteria

### Scenario 3.1 – Enable Reminder

**Given**

The user is creating or editing a subscription.

**When**

The user enables the reminder toggle.

**Then**

The system shall display:

- Reminder Advance Setting
- Notification Channel Settings

---

### Scenario 3.2 – Configure Reminder Timing

**Given**

Reminder is enabled.

**When**

The user selects:

- 1 day
- 3 days
- 5 days
- 7 days
- 14 days

before renewal.

**Then**

The system shall save the selected value successfully.

---

### Scenario 3.3 – Configure Notification Channels

**Given**

Reminder is enabled.

**When**

The user selects one or more channels:

- Email
- Push Notification

**Then**

The system shall save the configuration successfully.

---

### Scenario 3.4 – Disable Reminder

**Given**

A reminder configuration already exists.

**When**

The user disables reminders.

**Then**

The system shall:

- Stop future reminder notifications.
- Retain historical reminder records for auditing.

---

# User Story 4: Receive Pre-Renewal Reminder

## Story

**As a** user,

**I want** to receive reminders before a subscription renews,

**So that** I can avoid unwanted charges.

---

## Acceptance Criteria

### Scenario 4.1 – Free Trial Reminder

**Given**

The user has:

- Amazon Prime Free Trial
- Expiration Date: July 14, 2026
- Reminder: 1 day before
- Email enabled
- Push Notification enabled

**When**

The system date reaches July 13, 2026.

**Then**

The system shall send:

#### Email

Subject:

```text
Your Amazon Prime trial will renew tomorrow

```

Content:

```text
Your Amazon Prime trial will automatically renew tomorrow.

If you do not wish to continue the service, please cancel your subscription before renewal.

```

#### Push Notification

```text
Your Amazon Prime subscription will renew in 1 day.

Cancel now if you do not wish to continue using the service and avoid unexpected charges.

```

---

### Scenario 4.2 – Duplicate Notification Prevention

**Given**

A reminder has already been sent.

**When**

The reminder job runs again.

**Then**

The system shall:

- Not send duplicate reminders.
- Update and verify last\_reminded\_at.

---

# User Story 5: Automatic Subscription Renewal

## Story

**As a** user,

**I want** the system to process subscription renewals automatically,

**So that** I do not need to manually pay recurring subscriptions.

---

## Acceptance Criteria

### Scenario 5.1 – Successful Renewal

**Given**

The user has:

- Netflix Subscription
- Amount: 54,000 VND
- Renewal Date: Today
- Valid Payment Method

**When**

The renewal job executes.

**Then**

The system shall:

1. Process payment.
2. Create a payment history record.
3. Send a payment success notification.
4. Update the next billing date.
5. Keep subscription status as ACTIVE.

Notification Example:

```text
You have been charged 54,000 VND for Netflix.

```

---

### Scenario 5.2 – Failed Renewal

**Given**

The user has:

- Netflix Subscription
- Renewal Date: Today
- Insufficient Balance

**When**

The renewal job executes.

**Then**

The system shall:

1. Mark payment as FAILED.
2. Save failure reason.
3. Create payment history record.
4. Send failure notification.

Notification Example:

```text
Netflix renewal failed due to insufficient funds.

Please update your payment method or add funds and try again.

```

---

### Scenario 5.3 – Billing Date Update

**Given**

A renewal succeeds.

**When**

The subscription billing cycle is:

- Weekly
- Monthly
- Yearly

**Then**

The system shall automatically calculate and store the next billing date.

Examples:

Cycle

Current Date

New Date

Weekly

2026-06-30

2026-07-07

Monthly

2026-06-30

2026-07-30

Yearly

2026-06-30

2027-06-30

---

# User Story 6: Soft Delete Subscription

## Story

**As a** user,

**I want** to remove subscriptions without deleting historical records,

**So that** payment history and audit data remain available.

---

## Acceptance Criteria

### Scenario 6.1 – Delete Subscription

**Given**

The user is viewing an existing subscription.

**When**

The user clicks Delete Subscription.

**Then**

The system shall display a confirmation dialog.

---

### Scenario 6.2 – Confirm Delete

**Given**

The confirmation dialog is displayed.

**When**

The user confirms deletion.

**Then**

The system shall:

- Set is\_deleted = true.
- Mark status as EXPIRED.
- Hide the subscription from Active subscriptions.
- Preserve payment history.
- Display a success message.

---

### Scenario 6.3 – Cancel Delete

**Given**

The confirmation dialog is displayed.

**When**

The user selects Cancel.

**Then**

The system shall:

- Close the dialog.
- Make no database changes.

---

# User Story 7: View Payment History

## Story

**As a** user,

**I want** to review my subscription payment history,

**So that** I can audit recurring expenses.

---

## Acceptance Criteria

### Scenario 7.1 – View Payment Records

**Given**

The subscription contains payment history.

**When**

The user opens the Payment History screen.

**Then**

The system shall display:

- Service Name
- Amount Paid
- Payment Date
- Status
- Transaction Reference

---

### Scenario 7.2 – Failed Payment Details

**Given**

A payment failed.

**When**

The user views the payment record.

**Then**

The system shall display the failure reason.

Example:

```text
Insufficient funds

```

---

# Definition of Done (DoD)

The feature is considered complete when:

- All acceptance criteria pass.
- Backend APIs are implemented.
- Frontend screens are implemented.
- Reminder scheduler is operational.
- Payment history tracking is implemented.
- Soft delete is implemented.
- Unit tests pass.
- Integration tests pass.
- QA sign-off is completed.
- Product Owner approval is completed.