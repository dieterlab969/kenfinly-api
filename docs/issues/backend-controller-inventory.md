# Backend Controller Inventory

**Generated:** 2026-08-16T07:11:02.963Z
**Source:** `app/Http/Controllers` plus route-file references

The current backend contains **60 controllers**. The
middleware column identifies the controller family but intentionally
does not flatten nested Laravel route groups; verify the route file when
extracting a controller.

| Controller | Lines | Methods | Route references | Middleware context | Validation | Policy | Side effects | Response shape |
| --- | ---: | --- | --- | --- | --- | --- | --- | --- |
| `Api/TransactionController` | 665 | __construct, index, store, show, update, destroy, addPhoto, deletePhoto, getDashboardData | routes/api.php:6, routes/api.php:17, routes/api.php:120, routes/api.php:132, routes/api.php:133, routes/api.php:156, routes/api.php:157, routes/api.php:158 | API route group; verify inherited middleware | Inline validation | Detected | DB/transaction, Storage/files, Model writes | JSON |
| `Api/WordPressController` | 440 | __construct, posts, post, postBySlug, pages, page, pageBySlug, categories, tags, media, customPostType, customPostTypeItem, customPostTypeBySlug, search, menus, menu, siteInfo, clearCache, testConnection, status, buildQueryParams, formatResponse, validateCustomPostType | routes/api.php:35, routes/api.php:303, routes/api.php:312, routes/api.php:313, routes/api.php:314, routes/api.php:317, routes/api.php:318, routes/api.php:319 | API route group; verify inherited middleware | Inline validation | Not detected | Not detected | JSON |
| `Api/AuthController` | 432 | __construct, register, login, me, config, logout, refresh, respondWithToken, syncLocalizationToUser | routes/api.php:3, routes/api.php:57, routes/api.php:59, routes/api.php:64, routes/api.php:65, routes/api.php:70, routes/api.php:71, routes/api.php:73 | API route group; verify inherited middleware | Inline validation | Not detected | Model writes | JSON |
| `Api/AnalyticsController` | 369 | summary, resolveDateRanges, buildOverview, buildCharts, dateTruncExpr, formatPeriodLabel, buildTopCategories, getSummary, getCategoryBreakdown, getTrends | routes/api.php:13, routes/api.php:39, routes/api.php:75, routes/api.php:202, routes/api.php:203, routes/api.php:204, routes/api.php:206 | API route group; verify inherited middleware | Not detected | Not detected | DB/transaction | JSON, View |
| `Api/PaymentGatewayController` | 314 | __construct, index, store, show, update, destroy, toggleGateway, storeCredential, updateCredential, deleteCredential, verifyCredential, auditLogs | routes/api.php:250, routes/api.php:251, routes/api.php:252, routes/api.php:253, routes/api.php:254, routes/api.php:255, routes/api.php:256 | API route group; verify inherited middleware | Inline validation | Not detected | Model writes | JSON |
| `Api/CsvController` | 271 | export, generateCsvContent, escapeCsvField, import, parseDate | routes/api.php:10, routes/api.php:181, routes/api.php:182 | API route group; verify inherited middleware | Inline validation | Not detected | DB/transaction | JSON |
| `Api/UserSubscriptionController` | 251 | __construct, index, store, show, update, destroy, paymentHistory | routes/api.php:211, routes/api.php:212 | API route group; verify inherited middleware | Inline validation | Not detected | Model writes | JSON |
| `Api/PaymentDashboardController` | 234 | __construct, overview, getTransactionMetrics, getGatewayStatus, getSubscriptionMetrics, getRecentTransactions, getAlerts, getStartDate | routes/api.php:265 | API route group; verify inherited middleware | Not detected | Not detected | DB/transaction | JSON, View |
| `Api/SavingTracker/HabitController` | 217 | index, store, show, update, destroy, stats, overallStats | routes/api.php:216, routes/api.php:220, routes/api.php:221 | API route group; verify inherited middleware | Inline validation | Not detected | Model writes | JSON |
| `Api/AccountController` | 214 | defaultCurrencyForLocale, index, store, show, update, destroy | routes/api.php:7, routes/api.php:107, routes/api.php:108, routes/api.php:153 | API route group; verify inherited middleware | Inline validation | Not detected | Model writes | JSON, Resource |
| `Api/ConsentController` | 205 | store, show, destroy, update | routes/api.php:40, routes/api.php:82, routes/api.php:83, routes/api.php:84 | API route group; verify inherited middleware | Inline validation | Not detected | Model writes | JSON |
| `Api/CategoryController` | 203 | index, store, update, destroy, translateCategory, generateUniqueSlug | routes/api.php:8, routes/api.php:147, routes/api.php:148, routes/api.php:149, routes/api.php:150 | API route group; verify inherited middleware | Inline validation | Detected | Model writes | JSON |
| `Api/WooCommerceWebhookController` | 197 | handle, logIncomingRequest, respond, elapsedMs | routes/api.php:43, routes/api.php:244 | API route group; verify inherited middleware | Not detected | Not detected | Queue/events | JSON |
| `Api/FacebookAuthController` | 194 | redirect, callback, createUserFromFacebook | routes/api.php:70, routes/api.php:71 | API route group; verify inherited middleware | Not detected | Not detected | Model writes | Redirect |
| `Api/UserAccountController` | 190 | deactivate, scheduleDelete, revokeToken | routes/api.php:107, routes/api.php:108 | API route group; verify inherited middleware | Inline validation | Not detected | Model writes | JSON |
| `Api/TransferController` | 187 | transfer | routes/api.php:111 | API route group; verify inherited middleware | Inline validation | Not detected | DB/transaction, Model writes | JSON |
| `Api/ProfileController` | 183 | __construct, show, update, uploadAvatar, formatProfile, resolveAvatarUrl | routes/api.php:19, routes/api.php:164, routes/api.php:165, routes/api.php:166 | API route group; verify inherited middleware | Inline validation | Not detected | Storage/files, Model writes | JSON |
| `Api/SecuritySettingsController` | 179 | show, update, changePassword, changePin, formatSettings | routes/api.php:103, routes/api.php:104, routes/api.php:177, routes/api.php:178 | API route group; verify inherited middleware | Not detected | Not detected | Model writes | JSON |
| `Api/HaloTransactionController` | 169 | __construct, index, store, isDuplicateKeyError | routes/api.php:17, routes/api.php:132, routes/api.php:133 | API route group; verify inherited middleware | Inline validation | Not detected | DB/transaction | JSON, Resource |
| `Api/CurrencyController` | 164 | __construct, index, detect, save, buildPlansPayload | routes/api.php:4, routes/api.php:233, routes/api.php:234, routes/api.php:236 | API route group; verify inherited middleware | Inline validation | Not detected | Model writes | JSON |
| `Api/PaymentController` | 164 | __construct, processPayment, history, show, retry | routes/api.php:11, routes/api.php:185, routes/api.php:186, routes/api.php:187, routes/api.php:188, routes/api.php:189, routes/api.php:190, routes/api.php:191 | API route group; verify inherited middleware | Inline validation | Not detected | Not detected | JSON |
| `Api/GoogleAuthController` | 162 | redirect, callback, createUserFromGoogle | routes/api.php:64, routes/api.php:65 | API route group; verify inherited middleware | Not detected | Not detected | Model writes | JSON, Redirect |
| `BetaAccessPage` | 157 | — | No direct route declaration found | Web/other; verify route middleware | Not detected | Not detected | Not detected | Not detected |
| `BetaAccessVerifyPage` | 157 | — | No direct route declaration found | Web/other; verify route middleware | Not detected | Not detected | Not detected | Not detected |
| `Admin/UserManagementController` | 156 | index, store, show, update, destroy | routes/api.php:24, routes/api.php:269 | Admin route group; verify inherited middleware | Inline validation | Not detected | Model writes | JSON |
| `Admin/CategoryManagementController` | 143 | index, store, show, update, destroy | routes/api.php:26, routes/api.php:271 | Admin route group; verify inherited middleware | Inline validation | Not detected | Model writes | JSON |
| `SitemapController` | 137 | __construct, generate | routes/api.php:300 | Web/other; verify route middleware | Not detected | Not detected | Not detected | JSON |
| `Api/SavingTracker/HabitTrackingController` | 135 | __construct, toggle, getTracking, bulkTrack | routes/api.php:217, routes/api.php:218, routes/api.php:219 | API route group; verify inherited middleware | Inline validation | Not detected | Model writes | JSON |
| `Api/EmailVerificationController` | 129 | __construct, verify, resend, status | routes/api.php:5, routes/api.php:88, routes/api.php:89, routes/api.php:90 | API route group; verify inherited middleware | Inline validation | Not detected | Not detected | JSON |
| `Admin/FaviconManagementController` | 122 | show, update, validateAndProcessImage | routes/api.php:34, routes/api.php:305, routes/api.php:306 | Admin route group; verify inherited middleware | Inline validation | Not detected | Storage/files, Model writes | JSON |
| `Admin/RoleManagementController` | 122 | index, store, show, update, destroy | routes/api.php:25, routes/api.php:270 | Admin route group; verify inherited middleware | Inline validation | Not detected | Model writes | JSON |
| `Admin/LogoManagementController` | 120 | index, upload, delete | routes/api.php:33, routes/api.php:295, routes/api.php:296, routes/api.php:297 | Admin route group; verify inherited middleware | Inline validation | Not detected | Not detected | JSON |
| `Admin/AccountManagementController` | 118 | index, store, show, update, destroy | routes/api.php:23, routes/api.php:268 | Admin route group; verify inherited middleware | Inline validation | Not detected | Model writes | JSON |
| `Admin/LanguageManagementController` | 117 | index, store, show, update, destroy | routes/api.php:27, routes/api.php:272 | Admin route group; verify inherited middleware | Inline validation | Not detected | Model writes | JSON |
| `Admin/LicenseManagementController` | 115 | index, store, show, update, destroy | routes/api.php:28, routes/api.php:273 | Admin route group; verify inherited middleware | Inline validation | Not detected | Model writes | JSON |
| `Api/CommitmentController` | 115 | __construct, index, show, store, complete, kill, authorizeOwner | routes/api.php:15, routes/api.php:140, routes/api.php:141, routes/api.php:142, routes/api.php:143, routes/api.php:144 | API route group; verify inherited middleware | Inline validation | Not detected | Model writes | JSON, Resource |
| `Api/LanguageController` | 111 | index, getTranslations, updateUserLanguage | routes/api.php:9, routes/api.php:93, routes/api.php:94, routes/api.php:161 | API route group; verify inherited middleware | Inline validation | Not detected | Model writes | JSON |
| `Api/ParticipantController` | 108 | invite, acceptInvitation, listParticipants, removeParticipant | routes/api.php:12, routes/api.php:196, routes/api.php:197, routes/api.php:198, routes/api.php:199 | API route group; verify inherited middleware | Inline validation | Not detected | Model writes | JSON |
| `Api/AttendanceController` | 106 | __construct, status, start, complete, kill | routes/api.php:14, routes/api.php:123, routes/api.php:124, routes/api.php:125, routes/api.php:126 | API route group; verify inherited middleware | Inline validation | Not detected | DB/transaction | JSON |
| `Api/UserPreferenceController` | 106 | show, update | routes/api.php:20, routes/api.php:169, routes/api.php:170 | API route group; verify inherited middleware | Inline validation | Not detected | Not detected | JSON |
| `Api/LogoController` | 105 | getLogo, uploadLogo | routes/api.php:37, routes/api.php:41, routes/api.php:55, routes/api.php:58, routes/api.php:117 | API route group; verify inherited middleware | Inline validation | Not detected | Storage/files, Model writes | JSON |
| `Admin/TranslationManagementController` | 103 | index, store, update, destroy | routes/api.php:31, routes/api.php:286, routes/api.php:287, routes/api.php:288, routes/api.php:289 | Admin route group; verify inherited middleware | Inline validation | Not detected | Model writes | JSON |
| `Api/NotificationSettingController` | 100 | show, update | routes/api.php:21, routes/api.php:173, routes/api.php:174 | API route group; verify inherited middleware | Inline validation | Not detected | Not detected | JSON |
| `Admin/CacheManagementController` | 98 | clearApplicationCache, clearConfigCache, clearRouteCache, clearViewCache, clearAllCaches | routes/api.php:30, routes/api.php:280, routes/api.php:281, routes/api.php:282, routes/api.php:283, routes/api.php:284 | Admin route group; verify inherited middleware | Not detected | Not detected | Not detected | JSON |
| `Admin/SettingsManagementController` | 92 | index, update, store, destroy | routes/api.php:29, routes/api.php:275, routes/api.php:276, routes/api.php:277, routes/api.php:278 | Admin route group; verify inherited middleware | Inline validation | Not detected | Model writes | JSON |
| `Api/PomodoroController` | 84 | __construct, start, state, complete | routes/api.php:42, routes/api.php:77, routes/api.php:78, routes/api.php:79 | API route group; verify inherited middleware | Not detected | Not detected | Not detected | JSON |
| `Api/PublicAnalyticsController` | 70 | __construct, getPublicStats | routes/api.php:39, routes/api.php:75 | API route group; verify inherited middleware | Not detected | Not detected | Not detected | JSON |
| `Admin/TransactionManagementController` | 69 | index, show | routes/api.php:32, routes/api.php:291, routes/api.php:292 | Admin route group; verify inherited middleware | Not detected | Not detected | Not detected | JSON |
| `BetaAccessController` | 69 | show, verify, logout | routes/web.php:5, routes/web.php:9, routes/web.php:10, routes/web.php:11 | Web/other; verify route middleware | Inline validation | Not detected | Not detected | Redirect, View |
| `Api/HourlyRateController` | 62 | __construct, update, history | routes/api.php:18, routes/api.php:136, routes/api.php:137 | API route group; verify inherited middleware | Inline validation | Not detected | Model writes | JSON, Resource |
| `Api/SubscriptionController` | 57 | __construct, store | routes/api.php:211, routes/api.php:212, routes/api.php:258 | API route group; verify inherited middleware | Inline validation | Not detected | Not detected | JSON |
| `Api/SavingTracker/AchievementController` | 56 | index, unlocked | routes/api.php:224, routes/api.php:225 | API route group; verify inherited middleware | Not detected | Not detected | Not detected | JSON |
| `Admin/AdminDashboardController` | 46 | index | routes/api.php:22, routes/api.php:266 | Admin route group; verify inherited middleware | Not detected | Not detected | Not detected | JSON |
| `Api/WaitlistController` | 42 | store | routes/api.php:72 | API route group; verify inherited middleware | Inline validation | Not detected | Not detected | JSON |
| `Api/HaloSessionController` | 35 | __construct, current | routes/api.php:16, routes/api.php:129 | API route group; verify inherited middleware | Not detected | Not detected | Not detected | JSON |
| `Api/PublicLogoController` | 35 | index, publicLogoPath | routes/api.php:37, routes/api.php:58 | API route group; verify inherited middleware | Not detected | Not detected | Not detected | JSON |
| `Api/PublicSettingsController` | 31 | getCompanyInfo | routes/api.php:36, routes/api.php:74 | API route group; verify inherited middleware | Not detected | Not detected | Not detected | JSON |
| `Api/SubscriptionPlanController` | 30 | index | routes/api.php:56 | API route group; verify inherited middleware | Not detected | Not detected | Not detected | JSON |
| `BetaAccessTestSuite` | 14 | — | No direct route declaration found | Web/other; verify route middleware | Not detected | Not detected | Not detected | Not detected |
| `Controller` | 13 | — | routes/api.php:3, routes/api.php:4, routes/api.php:5, routes/api.php:6, routes/api.php:7, routes/api.php:8, routes/api.php:9, routes/api.php:10, routes/web.php:5, routes/web.php:9, routes/web.php:10, routes/web.php:11 | Web/other; verify route middleware | Not detected | Not detected | Not detected | Not detected |

## Phase 0 observations

- Controller indicators are source heuristics, not a substitute for
  endpoint-level review.
- The largest extraction candidate is `Api/TransactionController`;
  its responsibilities include CRUD, validation, photo handling,
  change logs, ledger updates, and dashboard reads.
- Phase 4 should migrate one resource family at a time, preserving
  response compatibility and adding policy/service tests before removal
  of controller logic.

