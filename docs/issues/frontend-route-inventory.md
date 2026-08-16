# Frontend Route Inventory

**Generated:** 2026-08-16T07:11:02.921Z
**Source:** `resources/js/App.tsx` route declarations and local imports

The current router declares **127 routes**. Ownership and
legacy status below are inventory heuristics for planning; nested guards
and runtime reachability still require route smoke tests.

| Route | Component | Source | Lines | Ownership | Review indicator |
| --- | --- | --- | ---: | --- | --- |
| `/` | `Splashscreen` | `resources/js/pages/Splashscreen.tsx` | 129 | Public/auth | TypeScript route candidate |
| `/AboutUs` | `AboutUs` | `resources/js/pages/AboutUs.tsx` | 89 | Authenticated app | TypeScript route candidate |
| `/Activity` | `Activity` | `resources/js/pages/Activity.tsx` | 482 | Authenticated app | TypeScript route candidate |
| `/AddNewCard` | `AddNewCard` | `resources/js/pages/AddNewCard.tsx` | 143 | Authenticated app | TypeScript route candidate |
| `/AddNewItem` | `AddNewItem` | `resources/js/pages/AddNewItem.tsx` | 79 | Authenticated app | TypeScript route candidate |
| `/AddTaxes` | `AddTaxes` | `resources/js/pages/AddTaxes.tsx` | 49 | Authenticated app | TypeScript route candidate |
| `/AllContact` | `AllContact` | `resources/js/pages/AllContact.tsx` | 220 | Authenticated app | TypeScript route candidate |
| `/analytics` | `Analytics` | `resources/js/pages/Analytics.tsx` | 655 | Authenticated app | TypeScript route candidate |
| `/AreaChart` | `AreaChart` | `resources/js/pages/AreaChart.tsx` | 267 | Authenticated app | TypeScript route candidate |
| `/auth/facebook/success` | `FacebookAuthSuccess` | `resources/js/pages/FacebookAuthSuccess.tsx` | 81 | Public/auth | TypeScript route candidate |
| `/auth/google/success` | `GoogleAuthSuccess` | `resources/js/pages/GoogleAuthSuccess.tsx` | 77 | Public/auth | TypeScript route candidate |
| `/AutomaticPayment` | `AutomaticPayment` | `resources/js/pages/AutomaticPayment.tsx` | 109 | Authenticated app | TypeScript route candidate |
| `/BankAndCard` | `BankAndCard` | `resources/js/pages/BankAndCard.tsx` | 109 | Authenticated app | TypeScript route candidate |
| `/BarChart` | `BarChart` | `resources/js/pages/BarChart.tsx` | 270 | Authenticated app | TypeScript route candidate |
| `/BillPaid` | `BillPaid` | `resources/js/pages/BillPaid.tsx` | 45 | Authenticated app | TypeScript route candidate |
| `/CaptureSelfie` | `CaptureSelfie` | `resources/js/pages/CaptureSelfie.tsx` | 59 | Authenticated app | TypeScript route candidate |
| `/Car1` | `Car1` | `resources/js/pages/Car1.tsx` | 53 | Authenticated app | TypeScript route candidate |
| `/Car2` | `Car2` | `resources/js/pages/Car2.tsx` | 71 | Authenticated app | TypeScript route candidate |
| `/CategoryManagement` | `CategoryManagement` | `resources/js/pages/CategoryManagement.tsx` | 1007 | Authenticated app | TypeScript route candidate |
| `/ConfirmOtp` | `ConfirmOtp` | `resources/js/pages/ConfirmOtp.tsx` | 104 | Authenticated app | TypeScript route candidate |
| `/ContactUs` | `ContactUs` | `resources/js/pages/ContactUs.tsx` | 277 | Authenticated app | TypeScript route candidate |
| `/CreateNewPassword` | `CreateNewPassword` | `resources/js/pages/CreateNewPassword.tsx` | 64 | Authenticated app | TypeScript route candidate |
| `/CreateNewPin` | `CreateNewPin` | `resources/js/pages/CreateNewPin.tsx` | 83 | Authenticated app | TypeScript route candidate |
| `/CreditCard1` | `CreditCard1` | `resources/js/pages/CreditCard1.tsx` | 56 | Authenticated app | TypeScript route candidate |
| `/CreditCard2` | `CreditCard2` | `resources/js/pages/CreditCard2.tsx` | 69 | Authenticated app | TypeScript route candidate |
| `/Currency` | `Currency` | `resources/js/pages/Currency.tsx` | 127 | Authenticated app | TypeScript route candidate |
| `/CustomerScreen` | `CustomerScreen` | `resources/js/pages/CustomerScreen.tsx` | 131 | Authenticated app | TypeScript route candidate |
| `/DataPrivacy` | `DataPrivacy` | `resources/js/pages/DataPrivacy.tsx` | 204 | Authenticated app | TypeScript route candidate |
| `/DeactiveAccount` | `DeactiveAccount` | `resources/js/pages/DeactiveAccount.tsx` | 297 | Authenticated app | TypeScript route candidate |
| `/DeleteAccount` | `DeleteAccount` | `resources/js/pages/DeleteAccount.tsx` | 395 | Authenticated app | TypeScript route candidate |
| `/DeleteDeactivateAccount` | `DeleteDeactivateAccount` | `resources/js/pages/DeleteDeactivateAccount.tsx` | 121 | Authenticated app | TypeScript route candidate |
| `/Electricitybill1` | `Electricitybill1` | `resources/js/pages/Electricitybill1.tsx` | 53 | Authenticated app | TypeScript route candidate |
| `/Electricitybill2` | `Electricitybill2` | `resources/js/pages/Electricitybill2.tsx` | 75 | Authenticated app | TypeScript route candidate |
| `/EmptyNotification` | `EmptyNotification` | `resources/js/pages/EmptyNotification.tsx` | 45 | Authenticated app | TypeScript route candidate |
| `/Ewallet1` | `Ewallet1` | `resources/js/pages/Ewallet1.tsx` | 54 | Authenticated app | TypeScript route candidate |
| `/Ewallet2` | `Ewallet2` | `resources/js/pages/Ewallet2.tsx` | 71 | Authenticated app | TypeScript route candidate |
| `/FaceRecognition` | `FaceRecognition` | `resources/js/pages/FaceRecognition.tsx` | 56 | Authenticated app | TypeScript route candidate |
| `/FaceRecognitionRunning` | `FaceRecognitionRunning` | `resources/js/pages/FaceRecognitionRunning.tsx` | 102 | Authenticated app | TypeScript route candidate |
| `/Faq` | `Faq` | `resources/js/pages/Faq.tsx` | 251 | Authenticated app | TypeScript route candidate |
| `/Feedback` | `Feedback` | `resources/js/pages/Feedback.tsx` | 59 | Authenticated app | TypeScript route candidate |
| `/Fingerprint` | `Fingerprint` | `resources/js/pages/Fingerprint.tsx` | 54 | Authenticated app | TypeScript route candidate |
| `/Food1` | `Food1` | `resources/js/pages/Food1.tsx` | 54 | Authenticated app | TypeScript route candidate |
| `/Food2` | `Food2` | `resources/js/pages/Food2.tsx` | 71 | Authenticated app | TypeScript route candidate |
| `/ForgetPassword` | `ForgetPassword` | `resources/js/pages/ForgetPassword.tsx` | 60 | Authenticated app | TypeScript route candidate |
| `/GenerateQrCode` | `GenerateQrCode` | `resources/js/pages/GenerateQrCode.tsx` | 205 | Authenticated app | TypeScript route candidate |
| `/halo` | `HaloDashboard` | `resources/js/pages/halo/HaloDashboard.jsx` | 596 | Halo | Legacy JSX candidate; verify before migration/removal |
| `/halo/*` | `HaloDashboard` | `resources/js/pages/halo/HaloDashboard.jsx` | 596 | Halo | Legacy JSX candidate; verify before migration/removal |
| `/Health1` | `Health1` | `resources/js/pages/Health1.tsx` | 53 | Authenticated app | TypeScript route candidate |
| `/Health2` | `Health2` | `resources/js/pages/Health2.tsx` | 71 | Authenticated app | TypeScript route candidate |
| `/Home` | `Home` | `resources/js/pages/Home.tsx` | 1406 | Authenticated app | TypeScript route candidate |
| `/Identify` | `Identify` | `resources/js/pages/Identify.tsx` | 129 | Authenticated app | TypeScript route candidate |
| `/Internetbill1` | `Internetbill1` | `resources/js/pages/Internetbill1.tsx` | 64 | Authenticated app | TypeScript route candidate |
| `/Internetbill2` | `Internetbill2` | `resources/js/pages/Internetbill2.tsx` | 78 | Authenticated app | TypeScript route candidate |
| `/InviteFriend` | `InviteFriend` | `resources/js/pages/InviteFriend.tsx` | 181 | Authenticated app | TypeScript route candidate |
| `/Invoicing` | `Invoicing` | `resources/js/pages/Invoicing.tsx` | 544 | Authenticated app | TypeScript route candidate |
| `/Language` | `Language` | `resources/js/pages/Language.tsx` | 64 | Authenticated app | TypeScript route candidate |
| `/LetYouScreen` | `LetYouScreen` | `resources/js/pages/LetYouScreen.tsx` | 67 | Authenticated app | TypeScript route candidate |
| `/LineChart` | `LineChart` | `resources/js/pages/LineChart.tsx` | 268 | Authenticated app | TypeScript route candidate |
| `/MarketingScreen` | `MarketingScreen` | `resources/js/pages/MarketingScreen.tsx` | 201 | Authenticated app | TypeScript route candidate |
| `/Merchant1` | `Merchant1` | `resources/js/pages/Merchant1.tsx` | 53 | Authenticated app | TypeScript route candidate |
| `/Merchant2` | `Merchant2` | `resources/js/pages/Merchant2.tsx` | 71 | Authenticated app | TypeScript route candidate |
| `/Mobile1` | `Mobile1` | `resources/js/pages/Mobile1.tsx` | 53 | Authenticated app | TypeScript route candidate |
| `/Mobile2` | `Mobile2` | `resources/js/pages/Mobile2.tsx` | 72 | Authenticated app | TypeScript route candidate |
| `/Motor1` | `Motor1` | `resources/js/pages/Motor1.tsx` | 53 | Authenticated app | TypeScript route candidate |
| `/Motor2` | `Motor2` | `resources/js/pages/Motor2.tsx` | 71 | Authenticated app | TypeScript route candidate |
| `/MutalFund1` | `MutalFund1` | `resources/js/pages/MutalFund1.tsx` | 53 | Authenticated app | TypeScript route candidate |
| `/MutalFund2` | `MutalFund2` | `resources/js/pages/MutalFund2.tsx` | 71 | Authenticated app | TypeScript route candidate |
| `/MyItem` | `MyItem` | `resources/js/pages/MyItem.tsx` | 138 | Authenticated app | TypeScript route candidate |
| `/NewInvoice` | `NewInvoice` | `resources/js/pages/NewInvoice.tsx` | 179 | Authenticated app | TypeScript route candidate |
| `/Notification` | `Notification` | `resources/js/pages/Notification.tsx` | 110 | Authenticated app | TypeScript route candidate |
| `/NotificationAllow` | `NotificationAllow` | `resources/js/pages/NotificationAllow.tsx` | 47 | Authenticated app | TypeScript route candidate |
| `/NotificationSetting` | `NotificationSetting` | `resources/js/pages/NotificationSetting.tsx` | 295 | Authenticated app | TypeScript route candidate |
| `/OldInvoice` | `OldInvoice` | `resources/js/pages/OldInvoice.tsx` | 106 | Authenticated app | TypeScript route candidate |
| `/PayBills` | `PayBills` | `resources/js/pages/PayBills.tsx` | 180 | Authenticated app | TypeScript route candidate |
| `/Payment` | `Payment` | `resources/js/pages/Payment.tsx` | 121 | Authenticated app | TypeScript route candidate |
| `/PersonalInfo` | `PersonalInfo` | `resources/js/pages/PersonalInfo.tsx` | 774 | Authenticated app | TypeScript route candidate |
| `/PersonalInfoSlider` | `PersonalInfoSlider` | `resources/js/pages/PersonalInfoSlider.tsx` | 269 | Authenticated app | TypeScript route candidate |
| `/PieChart` | `PieChart` | `resources/js/pages/PieChart.tsx` | 272 | Authenticated app | TypeScript route candidate |
| `/PreapprovedPayment1` | `PreapprovedPayment1` | `resources/js/pages/PreapprovedPayment1.tsx` | 155 | Authenticated app | TypeScript route candidate |
| `/PreapprovedPaymentPartial` | `PreapprovedPaymentPartial` | `resources/js/pages/PreapprovedPaymentPartial.tsx` | 50 | Authenticated app | TypeScript route candidate |
| `/PreapprovedPaymentRefund` | `PreapprovedPaymentRefund` | `resources/js/pages/PreapprovedPaymentRefund.tsx` | 41 | Authenticated app | TypeScript route candidate |
| `/QrcodePayment` | `QrcodePayment` | `resources/js/pages/QrcodePayment.tsx` | 74 | Authenticated app | TypeScript route candidate |
| `/ReasonUsingPayfast` | `ReasonUsingPayfast` | `resources/js/pages/ReasonUsingPayfast.tsx` | 74 | Authenticated app | TypeScript route candidate |
| `/RequestMoney1` | `RequestMoney1` | `resources/js/pages/RequestMoney1.tsx` | 92 | Authenticated app | TypeScript route candidate |
| `/RequestMoney3` | `RequestMoney3` | `resources/js/pages/RequestMoney3.tsx` | 44 | Authenticated app | TypeScript route candidate |
| `/RequestMoneyContact` | `RequestMoneyContact` | `resources/js/pages/RequestMoneyContact.tsx` | 215 | Authenticated app | TypeScript route candidate |
| `/RequestPayment` | `RequestPayment` | `resources/js/pages/RequestPayment.tsx` | 90 | Authenticated app | TypeScript route candidate |
| `/SaveAsDraft` | `SaveAsDraft` | `resources/js/pages/SaveAsDraft.tsx` | 540 | Authenticated app | TypeScript route candidate |
| `/ScanQrCode` | `ScanQrCode` | `resources/js/pages/ScanQrCode.tsx` | 80 | Authenticated app | TypeScript route candidate |
| `/Security` | `Security` | `resources/js/pages/Security.tsx` | 717 | Authenticated app | TypeScript route candidate |
| `/SendInvoice1` | `SendInvoice1` | `resources/js/pages/SendInvoice1.tsx` | 50 | Authenticated app | TypeScript route candidate |
| `/SendInvoice2` | `SendInvoice2` | `resources/js/pages/SendInvoice2.tsx` | 47 | Authenticated app | TypeScript route candidate |
| `/SendMoney` | `SendMoney` | `resources/js/pages/SendMoney.tsx` | 100 | Authenticated app | TypeScript route candidate |
| `/SendMoney1` | `SendMoney1` | `resources/js/pages/SendMoney1.tsx` | 67 | Authenticated app | TypeScript route candidate |
| `/SendMoney4` | `SendMoney4` | `resources/js/pages/SendMoney4.tsx` | 89 | Authenticated app | TypeScript route candidate |
| `/SendMoneyContact` | `SendMoneyContact` | `resources/js/pages/SendMoneyContact.tsx` | 215 | Authenticated app | TypeScript route candidate |
| `/SendMoneyReview` | `SendMoneyReview` | `resources/js/pages/SendMoneyReview.tsx` | 84 | Authenticated app | TypeScript route candidate |
| `/SendMoneySuccessful` | `SendMoneySuccessful` | `resources/js/pages/SendMoneySuccessful.tsx` | 44 | Authenticated app | TypeScript route candidate |
| `/ShareInvoice` | `ShareInvoice` | `resources/js/pages/ShareInvoice.tsx` | 196 | Authenticated app | TypeScript route candidate |
| `/SignIn` | `SignIn` | `resources/js/pages/SignIn.tsx` | 385 | Authenticated app | TypeScript route candidate |
| `/SignUp` | `SignUp` | `resources/js/pages/SignUp.tsx` | 382 | Authenticated app | TypeScript route candidate |
| `/SplitBill1` | `SplitBill1` | `resources/js/pages/SplitBill1.tsx` | 50 | Authenticated app | TypeScript route candidate |
| `/SplitBill2` | `SplitBill2` | `resources/js/pages/SplitBill2.tsx` | 236 | Authenticated app | TypeScript route candidate |
| `/SplitBill3` | `SplitBill3` | `resources/js/pages/SplitBill3.tsx` | 137 | Authenticated app | TypeScript route candidate |
| `/SplitBill4` | `SplitBill4` | `resources/js/pages/SplitBill4.tsx` | 144 | Authenticated app | TypeScript route candidate |
| `/SplitBill5` | `SplitBill5` | `resources/js/pages/SplitBill5.tsx` | 66 | Authenticated app | TypeScript route candidate |
| `/SplitBill6` | `SplitBill6` | `resources/js/pages/SplitBill6.tsx` | 65 | Authenticated app | TypeScript route candidate |
| `/SplitBill7` | `SplitBill7` | `resources/js/pages/SplitBill7.tsx` | 204 | Authenticated app | TypeScript route candidate |
| `/Stock1` | `Stock1` | `resources/js/pages/Stock1.tsx` | 53 | Authenticated app | TypeScript route candidate |
| `/Stock2` | `Stock2` | `resources/js/pages/Stock2.tsx` | 71 | Authenticated app | TypeScript route candidate |
| `/Subscription` | `SubscriptionManagement` | `resources/js/pages/SubscriptionManagement.tsx` | 1022 | Authenticated app | TypeScript route candidate |
| `/Tax1` | `Tax1` | `resources/js/pages/Tax1.tsx` | 53 | Authenticated app | TypeScript route candidate |
| `/Tax2` | `Tax2` | `resources/js/pages/Tax2.tsx` | 72 | Authenticated app | TypeScript route candidate |
| `/Taxes` | `Taxes` | `resources/js/pages/Taxes.tsx` | 138 | Authenticated app | TypeScript route candidate |
| `/Television1` | `Television1` | `resources/js/pages/Television1.tsx` | 53 | Authenticated app | TypeScript route candidate |
| `/Television2` | `Television2` | `resources/js/pages/Television2.tsx` | 71 | Authenticated app | TypeScript route candidate |
| `/Tracking1` | `Tracking1` | `resources/js/pages/Tracking1.tsx` | 44 | Authenticated app | TypeScript route candidate |
| `/Tracking2` | `Tracking2` | `resources/js/pages/Tracking2.tsx` | 88 | Authenticated app | TypeScript route candidate |
| `/TransferBank1` | `TransferBank1` | `resources/js/pages/TransferBank1.tsx` | 118 | Authenticated app | TypeScript route candidate |
| `/TransferBank2` | `TransferBank2` | `resources/js/pages/TransferBank2.tsx` | 51 | Authenticated app | TypeScript route candidate |
| `/TransferBankReview` | `TransferBankReview` | `resources/js/pages/TransferBankReview.tsx` | 90 | Authenticated app | TypeScript route candidate |
| `/TransferBankSuccess` | `TransferBankSuccess` | `resources/js/pages/TransferBankSuccess.tsx` | 45 | Authenticated app | TypeScript route candidate |
| `/UploadId` | `UploadId` | `resources/js/pages/UploadId.tsx` | 63 | Authenticated app | TypeScript route candidate |
| `/VerifyPhoneNumber` | `VerifyPhoneNumber` | `resources/js/pages/VerifyPhoneNumber.tsx` | 89 | Authenticated app | TypeScript route candidate |
| `/WalletManagement` | `WalletManagement` | `resources/js/pages/WalletManagement.tsx` | 1417 | Authenticated app | TypeScript route candidate |
| `/Waterbill1` | `Waterbill1` | `resources/js/pages/Waterbill1.tsx` | 62 | Authenticated app | TypeScript route candidate |
| `/Waterbill2` | `Waterbill2` | `resources/js/pages/Waterbill2.tsx` | 78 | Authenticated app | TypeScript route candidate |

## Phase 0 observations

- `App.tsx` is still a single route composition point and currently
  eagerly imports the route components.
- `.jsx` files are marked as review candidates, not automatically dead
  code. Active public/admin flows may still use JSX.
- Phase 1 should split route registration and lazy-load by ownership or
  feature without changing any URL.

