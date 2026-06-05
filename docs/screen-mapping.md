# Kenfinly to PayFast Screen Mapping

This matrix maps Kenfinly features to PayFast template screens and recommends whether to reuse, modify, or replace each mapping.

| Kenfinly Feature | Existing Kenfinly Screen / Page | PayFast Candidate Screen(s) | Decision | Notes |
|---|---|---|---|---|
| Public landing / marketing | `LandingPage.jsx`, `AboutPage.jsx`, `BlogPage.jsx`, `BlogPostPage.jsx` | `AboutUs.tsx`, `ContactUs.tsx`, `DataPrivacy.tsx`, `MarketingScreen.tsx` | Modify | Use PayFast content pages as visual shells; replace content with Kenfinly copy and WordPress blog pages remain custom. |
| Authentication | `Login.jsx`, `Register.jsx`, `VerifyEmail.jsx`, `VerificationPending.jsx` | `SignIn.tsx`, `SignUp.tsx`, `ConfirmOtp.tsx`, `ForgetPassword.tsx`, `CreateNewPassword.tsx` | Modify | Reuse form layout but adapt to Kenfinly JWT flow and email verification. |
| Onboarding / KYC | N/A (Kenfinly has lightweight onboarding) | `PersonalInfoSlider.tsx`, `UploadId.tsx`, `CaptureSelfie.tsx`, `Identify.tsx`, `ReasonUsingPayfast.tsx` | Replace / Modify | Use PayFast onboarding patterns only if KYC is added; otherwise keep minimal Kenfinly flow. |
| Dashboard | `halo/HaloDashboard.jsx` | `Home.tsx`, `Activity.tsx`, chart pages (`AreaChart.tsx`, `BarChart.tsx`, `PieChart.tsx`, `LineChart.tsx`) | Modify | Reuse visual card and metric layout; replace data binding with Kenfinly analytics and account summary logic. |
| Profile | `Profile` screens, settings | `PersonalInfo.tsx`, `Security.tsx`, `Language.tsx`, `Currency.tsx`, `NotificationSetting.tsx`, `DeactiveAccount.tsx`, `DeleteAccount.tsx` | Modify | Reuse settings screen structure; preserve Kenfinly profile update API and permission model. |
| Transaction send / receive | `AddTransactionModal.jsx`, `TransactionList` | `SendMoney.tsx`, `SendMoneyContact.tsx`, `SendMoneyReview.tsx`, `SendMoneySuccessful.tsx`, `RequestPayment.tsx`, `RequestMoney*`, `TransferBank*` | Modify | Adapt PayFast transaction flows to Kenfinly multi-account / category / photo upload model. |
| Bill payments | N/A (Kenfinly uses generic transactions) | `PayBills.tsx`, `Electricitybill*`, `Internetbill*`, `Waterbill*`, `BillPaid.tsx` | Reuse | Use these pages as bill payment UX patterns if bill pay is a Kenfinly feature; otherwise map to transaction category flows. |
| QR / code scanning | N/A | `ScanQrCode.tsx`, `QrcodePayment.tsx`, `GenerateQrCode.tsx` | Reuse | Possible enhancement for PayFast-inspired payment methods, not core Kenfinly business logic. |
| Invoice management | N/A / partial Kenfinly billing | `SendInvoice1.tsx`, `SendInvoice2.tsx`, `Invoicing.tsx`, `NewInvoice.tsx`, `OldInvoice.tsx`, `ShareInvoice.tsx`, `MyItem.tsx`, `AddNewItem.tsx` | Modify | These screens can be adapted for Kenfinly invoice-like transaction or merchant flows if needed. |
| Subscription / payments | `PricingPage`, payment methods | `Subscription.tsx`, `AutomaticPayment.tsx`, `Payment.tsx`, `PreapprovedPayment*` | Modify | Reuse templates for subscription checkout and recurring payments, integrate with Kenfinly `/api/payments` APIs. |
| Contact / support | N/A | `ContactUs.tsx`, `Feedback.tsx` | Reuse | Good candidates for Kenfinly support/contact content pages. |
| Security / notifications | `Notification` experience | `Notification.tsx`, `NotificationAllow.tsx`, `NotificationSetting.tsx`, `Security.tsx` | Modify | Reuse UI patterns and replace logic with Kenfinly notification/consent semantics. |
| Settings & utility | `Logo`, company, cookies, language | `Language.tsx`, `Currency.tsx`, `DataPrivacy.tsx`, `AboutUs.tsx`, `MarketingScreen.tsx` | Reuse | Use these pages for settings page shells. |
| Admin management | `AdminDashboard`, role management, settings | None in PayFast | Replace | Build custom Kenfinly admin screens; PayFast offers no admin management equivalent. |
| WordPress CMS | WordPress static pages, posts, menus | None in PayFast | Replace | Keep Kenfinly CMS routes and page rendering outside PayFast template. |
| Saving habit tracker | `SavingHabitTracker.jsx` | None in PayFast | Replace | No equivalent PayFast screen. |
| CSV import / export | import/export features | None in PayFast | Replace | Must preserve Kenfinly backend endpoints and custom UI. |
| Participant / account sharing | Invitation flows, participants list | `InviteFriend.tsx`, `AllContact.tsx` | Modify | Use PayFast invite/contact patterns for reuse, but preserve Kenfinly participant business logic. |
| Payment methods | saved cards, bank details | `BankAndCard.tsx`, `AddNewCard.tsx` | Modify | Good reuse for card/bank management UI if PayFast layout aligns with Kenfinly payment methods. |

## 1. Summary of Mapping Decisions

- Reuse: static content support pages, generic wallet/payment screen patterns, charts, settings pages.
- Modify: authentication, dashboard, profile, transaction send/receive, payment/subscription screens, invite/contact flows.
- Replace: admin panels, WordPress/CMS pages, habit tracker, CSV import/export, deep finance/accounting screens not present in PayFast.
