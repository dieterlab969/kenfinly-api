
# Subscription Management Feature Specification

## Overview

The Subscription Management feature allows users to track recurring subscriptions, receive renewal reminders, maintain payment history, and manage active or expired subscriptions.

This feature helps users:

* Monitor recurring expenses
* Avoid unexpected auto-renewal charges
* Receive notifications before renewal dates
* Maintain a transparent payment history
* Manage subscriptions through a centralized interface

---

# Business Goals

### Primary Goals

* Increase visibility of recurring expenses
* Reduce missed subscription renewals
* Improve user financial awareness
* Provide proactive reminder notifications
* Create a foundation for future automatic payment integrations

### Success Metrics

* Number of subscriptions created
* Reminder notification engagement rate
* Monthly active subscription tracking usage
* Subscription renewal success rate
* User retention improvement

---

# User Stories

### Create Subscription

As a user, I want to add a subscription so that I can track future recurring payments.

### Edit Subscription

As a user, I want to modify subscription details so that my information remains accurate.

### Delete Subscription

As a user, I want to remove a subscription without permanently losing historical records.

### Receive Reminder

As a user, I want to receive notifications before a renewal date so that I can prepare funds or cancel the service.

### View Payment History

As a user, I want to review previous payments so that I can understand my recurring spending patterns.

---

# Subscription List Screen

## Purpose

Display all subscriptions and allow users to filter, search, and manage subscriptions.

---

## Data Management

The screen maintains two data states:

### Raw Data

Data received directly from API.

```typescript
subscriptionsRaw: Subscription[]
```

### Filtered Data

Data displayed after applying filters and search criteria.

```typescript
subscriptionsFiltered: Subscription[]
```

---

## Features

### Search

Users can search subscriptions by:

* Service Name

Example:

* Netflix
* Spotify
* YouTube Premium

---

### Filter Options

#### Status

* Active
* Expired
* Deleted (Admin/Internal only)

#### Billing Cycle

* Weekly
* Monthly
* Yearly

---

### Sorting

Supported sorting:

* Next Billing Date (Ascending)
* Next Billing Date (Descending)
* Amount (High → Low)
* Amount (Low → High)
* Service Name (A-Z)

---

## Empty State

Display when no subscriptions exist.

**Title**

```text
No subscriptions found
```

**Description**

```text
Create your first subscription to start tracking recurring payments.
```

**CTA**

```text
Add Subscription
```

---

# Add Subscription Screen

## Header

### Back Button

Returns to previous screen without saving changes.

### Screen Title

```text
Add Subscription
```

---

## Main Form

### Service Name

**Type**

Text Input

**Placeholder**

```text
Enter service name (e.g. Netflix, Spotify)
```

**Validation**

* Required
* Maximum 255 characters

---

### Amount

**Type**

Number Input

**Placeholder**

```text
0
```

**Validation**

* Required
* Greater than 0

---

### Currency

**Type**

Dropdown

**Options**

* VND
* USD

Future currencies can be added.

---

### Billing Cycle

**Type**

Dropdown

**Options**

* Weekly
* Monthly
* Yearly

---

### Next Billing Date

**Type**

Date Picker

**Validation**

Required

---

# Reminder Settings Section

## Enable Reminder

**Type**

Toggle Switch

Label:

```text
Remind me before automatic renewal
```

---

## Reminder Advance

Visible only when reminder is enabled.

**Type**

Dropdown

Options:

* 1 day
* 3 days
* 5 days
* 7 days
* 14 days

---

## Notification Channels

### Email

```text
Notify via email
```

### Push Notification

```text
Notify via app notification
```

Users may select one or both channels.

---

# Add Subscription Actions

## Primary Button

```text
Create Subscription
```

### Behavior

Calls:

```http
POST /api/subscriptions
```

### Success

* Show success toast
* Refresh subscription list
* Navigate back

### Failure

Show error message from API.

---

# Edit Subscription Screen

## Navigation Flow

When user taps the Edit icon:

1. Navigate to Edit Subscription screen
2. Pass subscriptionId
3. Fetch latest subscription details
4. Populate form fields

---

## API

### Fetch Subscription Details

```http
GET /api/subscriptions/{id}
```

---

## Editable Fields

### Service Name

Text Input

### Amount

Number Input

### Currency

Dropdown

### Billing Cycle

Dropdown

### Next Billing Date

Date Picker

### Reminder Settings

* Enable Reminder
* Reminder Advance
* Notification Channels

---

## Update Action

### Button Label

```text
Update Subscription
```

### API

```http
PUT /api/subscriptions/{id}
```

### Success

* Show success toast
* Refresh list
* Navigate back

### Failure

Display validation or API errors.

---

# Soft Delete Feature

## Overview

Subscriptions must not be permanently removed from the database.

Soft Delete ensures:

* Historical payment records remain intact
* Users can recover accidentally deleted subscriptions
* Financial reports remain accurate

---

## Delete UI

Located at the bottom of Edit Subscription screen.

### Button Style

* Red outline button
* Warning appearance

Label:

```text
Delete Subscription
```

---

## Confirmation Dialog

Mandatory confirmation before deletion.

### Title

```text
Delete Subscription
```

### Message

```text
Are you sure you want to delete this subscription?

This action cannot be undone.
```

### Actions

```text
Cancel
Delete
```

---

## Delete API

```http
DELETE /api/subscriptions/{id}
```

### Backend Behavior

Update:

```sql
is_deleted = true
status = 'EXPIRED'
```

No physical database deletion occurs.

---

# Payment History

## Purpose

Maintain an auditable record of all subscription payments.

---

## Display Information

Each history item includes:

* Service Name
* Amount Paid
* Currency
* Payment Date
* Payment Status
* Transaction Reference

---

## Status Types

### SUCCESS

Payment completed successfully.

### FAILED

Payment failed.

Failure reason should be displayed when available.

Examples:

* Insufficient funds
* Payment gateway unavailable
* Card expired

---

# Notification System

## Reminder Workflow

Daily scheduler runs at:

```text
00:00 Server Time
```

---

## Reminder Logic

Query:

```sql
WHERE
is_enabled = true
AND
(next_billing_date - remind_before_days) = CURRENT_DATE
```

---

## Notification Channels

### Email

Send reminder email.

### Push Notification

Send mobile push notification.

---

## Reminder Message Example

```text
Your Netflix subscription will renew tomorrow.

Amount: 54,000 VND
Renewal Date: June 30, 2026
```

---

# Automatic Renewal Workflow

## Renewal Date Reached

When current date equals:

```text
next_billing_date
```

system attempts payment processing.

---

## Successful Payment

### Actions

1. Charge payment method
2. Create payment history record
3. Send confirmation notification
4. Update next billing date

Example:

Monthly subscription

```text
2026-06-30
→
2026-07-30
```

---

## Failed Payment

### Actions

1. Create FAILED payment history record
2. Save failure reason
3. Send warning notification

Example:

```text
Netflix renewal failed due to insufficient funds.
Please update your payment method.
```

---

# Database Design

## Table: subscriptions

| Column            | Type          | Constraints     | Description           |
| ----------------- | ------------- | --------------- | --------------------- |
| id                | BIGINT / UUID | PK              | Unique ID             |
| user_id           | BIGINT        | FK, Index       | Owner                 |
| service_name      | VARCHAR(255)  | NOT NULL        | Service name          |
| amount            | DECIMAL(12,2) | NOT NULL        | Subscription amount   |
| currency          | VARCHAR(10)   | Default VND     | Currency              |
| billing_cycle     | VARCHAR(50)   | NOT NULL        | WEEKLY/MONTHLY/YEARLY |
| next_billing_date | DATE          | NOT NULL, Index | Next payment date     |
| is_trial          | BOOLEAN       | Default false   | Trial indicator       |
| status            | VARCHAR(50)   | Default ACTIVE  | ACTIVE/EXPIRED        |
| is_deleted        | BOOLEAN       | Default false   | Soft delete flag      |
| created_at        | TIMESTAMP     | Default NOW()   | Creation time         |
| updated_at        | TIMESTAMP     | Default NOW()   | Last update           |

---

## Table: subscription_reminders

| Column             | Type          | Constraints  | Description             |
| ------------------ | ------------- | ------------ | ----------------------- |
| id                 | BIGINT / UUID | PK           | Unique ID               |
| subscription_id    | BIGINT        | FK           | Subscription reference  |
| remind_before_days | INT           | NOT NULL     | Reminder offset         |
| channels           | JSON          | NOT NULL     | EMAIL/PUSH              |
| is_enabled         | BOOLEAN       | Default true | Enable reminder         |
| last_reminded_at   | TIMESTAMP     | NULL         | Last reminder timestamp |

---

## Table: payment_histories

| Column           | Type          | Constraints   | Description            |
| ---------------- | ------------- | ------------- | ---------------------- |
| id               | BIGINT / UUID | PK            | Unique ID              |
| subscription_id  | BIGINT        | FK            | Subscription reference |
| user_id          | BIGINT        | FK, Index     | Owner                  |
| amount_paid      | DECIMAL(12,2) | NOT NULL      | Amount charged         |
| payment_date     | TIMESTAMP     | Default NOW() | Payment timestamp      |
| status           | VARCHAR(50)   | NOT NULL      | SUCCESS/FAILED         |
| failure_reason   | TEXT          | NULL          | Failure details        |
| transaction_code | VARCHAR(100)  | UNIQUE        | Gateway transaction ID |

---

# API Endpoints

## List Subscriptions

```http
GET /api/subscriptions
```

---

## Get Subscription Details

```http
GET /api/subscriptions/{id}
```

---

## Create Subscription

```http
POST /api/subscriptions
```

---

## Update Subscription

```http
PUT /api/subscriptions/{id}
```

---

## Delete Subscription (Soft Delete)

```http
DELETE /api/subscriptions/{id}
```

---

## List Payment History

```http
GET /api/subscriptions/{id}/payment-history
```

---

# Non-Functional Requirements

## Performance

* Subscription list response < 500ms
* Form load response < 300ms
* Reminder job execution scalable to 100,000+ subscriptions

---

## Security

* All endpoints require authentication
* Users may only access their own subscriptions
* Audit logs required for update and delete actions

---

## Future Enhancements

* Multiple reminder schedules
* Subscription categories
* Auto-renewal payment integration
* Subscription analytics dashboard
* Subscription spending forecast
* Subscription sharing for family accounts
* Calendar integration (Google Calendar, Apple Calendar)
* Smart AI recommendations for unused subscriptions
