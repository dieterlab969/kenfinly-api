---
name: User Subscriptions vs Platform Subscriptions
description: Two distinct subscription systems that must never be conflated — one for Kenfinly billing, one for user's own service tracking.
---

# Rule
There are two completely separate subscription systems in this codebase. Never use one in place of the other.

| System | Table | Model | Purpose |
|--------|-------|-------|---------|
| Platform billing | `subscriptions` | `Subscription` | Kenfinly plan subscriptions (user pays for Kenfinly) |
| Personal tracker | `user_subscriptions` | `UserSubscription` | User's own recurring services (Netflix, Spotify, etc.) |

**Why:** The existing `subscriptions` table was built for Kenfinly's own payment/license system. The new Subscription Management feature is a personal finance tool — users tracking their own third-party recurring services. Mixing them would corrupt billing data.

**How to apply:** Any feature related to "user tracking their own services" → `user_subscriptions` prefix. Any feature related to "user paying for Kenfinly" → `subscriptions` table.
