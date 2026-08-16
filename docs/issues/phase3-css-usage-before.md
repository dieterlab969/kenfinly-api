# Phase 3 CSS Usage Report — Before Consolidation

**Generated:** 2026-08-16T08:29:46.391Z
**Command:** `node scripts/report-css-usage.mjs --output docs/issues/phase3-css-usage-before.md`
**Scope:** active TypeScript route application under `resources/js` (test files excluded)

## Current delivery findings

| Asset | Source bytes | Imported by active source | Ownership finding |
| --- | ---: | --- | --- |
| `style.css` | 103400 | Yes — `resources/js/App.tsx` | Mixed shell, public/auth, finance, account, dashboard, and widget overrides |
| `swap.css` | 21658 | Yes — `resources/js/App.tsx` | Full Google-hosted Poppins face set; candidate for token-owned typography |
| `media-query.css` | 2794 | Yes — `resources/js/App.tsx` | Mixed legacy responsive rules; must be checked by selector ownership before removal |
| `all.min.css` | 103009 | No | Font Awesome bundle is not imported by active source |
| `intlTelInput.css` | 25122 | No | No active widget import found; keep route-local only if a widget is reintroduced |

## Section ownership and selector evidence

| Legacy section | Owner | Lines | Bytes | Selectors | Tokens referenced by source | Unmatched token count |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| ------------------------------------------------------------------
Project: PayFast E-Wallet
Author: The_Krishna     
Last change: 03/06/2024
Primary use:  Online Payment App
------------------------------------------------------------------- | account/dashboard feature | 2 | 1 | 0 | 0/0 | 0 |
| ----------------Table of contents Start---------------------------
1.Default CSS
2.Splash screen CSS
3.Onboarding screen CSS
4.Let you screen CSS
5.Sign In screen CSS
6.Sign up screen CSS
7.Verify phone number screen CSS
8.Confirm otp CSS
9.Send money to all screen CSS
10.Pay Bill  CSS 
11.Send quick response2 CSS
12.Language CSS
13.About us CSS
14.Personal info slider CSS
15.Reason for using payfast CSS
16.Finger Print CSS
17.Forget password CSS
18.Notification screen CSS
19.Deactive account CSS
20.Electricity bill 1 Screen
21.Paid screen Screen
22.Faq css
23.Feedback section css
24.Contact us css
25.Notifiaction setting css
26.Setting screen css
27.Send money1 css
28.Send money4 css
29.Send money css
30.Taxes css
31.Marketing css
32.Data privacy css
33.Delete deactivate css
35.Transfer to bank css
36.Invite friend css
37.Logout popup css
38.Personal info css
39.Activity css
40.Delete account css
41.Add new card css
42.Old invoice css
43.Invoice css
44.Tracking css
45.Preapproved-payment1 css
46.Spilt css
47.Transfer-to-bank-success css
48.Line chart css
49.Homescreen css
50.Bottom tabbar css
51.Face recognition css
52.QR code payment css
53.Create new password CSS
54.Keyframe Animation
---------Table of contents End----------------------------------- | shell | 2 | 1 | 0 | 0/0 | 0 |
| ------------------------ [Color codes] ------------------------                  
Background:#ffffff,#7B51F1,#F5F5F5   
Content:#5A5C5E,#121212      
------------------------------------------------------------------- | account/dashboard feature | 2 | 1 | 0 | 0/0 | 0 |
| 0.Theme Variables (Light / Dark) | shell | 8 | 173 | 1 | 0/0 | 0 |
| Extended tokens — used throughout the stylesheet but previously undefined | account/dashboard feature | 12 | 272 | 1 | 1/1 | 0 |
| Extended tokens for dark mode | account/dashboard feature | 6 | 115 | 0 | 0/0 | 0 |
| 1.Default CSS | shell | 243 | 4213 | 143 | 119/126 | 7 |
| 2.Splash CSS | public/auth feature | 32 | 587 | 6 | 5/5 | 0 |
| 3.Onboarding CSS | public/auth feature | 105 | 2158 | 17 | 12/14 | 2 |
| 4.Let you screen CSS | public/auth feature | 159 | 3176 | 22 | 16/16 | 0 |
| 5.Sign In screen CSS | public/auth feature | 71 | 1549 | 14 | 4/14 | 10 |
| 6.Sign up screen CSS | public/auth feature | 11 | 189 | 2 | 1/1 | 0 |
| Auth alert / feedback components | account/dashboard feature | 2 | 1 | 0 | 0/0 | 0 |
| Info (cart-checkout context notice) | account/dashboard feature | 20 | 364 | 2 | 2/2 | 0 |
| Success | account/dashboard feature | 11 | 195 | 1 | 1/1 | 0 |
| Danger (general server errors + SignIn inline error) | account/dashboard feature | 12 | 218 | 1 | 1/1 | 0 |
| Inline per-field validation message | account/dashboard feature | 7 | 87 | 1 | 1/1 | 0 |
| Submit button — invisible click target; parent .form-sign-in-password-btn owns the visual | account/dashboard feature | 13 | 189 | 2 | 1/1 | 0 |
| Column-direction modifier for .mobile-form (single-input rows) | account/dashboard feature | 6 | 62 | 1 | 1/1 | 0 |
| Forgot-password anchor | account/dashboard feature | 6 | 64 | 1 | 0/1 | 1 |
| 7.Verify phone number screen CSS | public/auth feature | 116 | 2439 | 15 | 11/11 | 0 |
| 9.Send money to all screen CSS | finance feature | 139 | 3072 | 28 | 22/22 | 0 |
| 10.Pay Bill  CSS | finance feature | 66 | 1298 | 21 | 20/20 | 0 |
| 11.Send quick response2 CSS | finance feature | 44 | 844 | 4 | 0/4 | 4 |
| 12.Language CSS | account/dashboard feature | 60 | 1468 | 18 | 12/12 | 0 |
| 13.About us CSS | account/dashboard feature | 53 | 1049 | 10 | 10/10 | 0 |
| 14.Personal info slider CSS | account/dashboard feature | 242 | 5200 | 40 | 26/31 | 5 |
| 15.Reason for using payfast CSS | account/dashboard feature | 298 | 6710 | 55 | 25/38 | 13 |
| 16.Finger Print CSS | account/dashboard feature | 106 | 2448 | 15 | 12/15 | 3 |
| 17.Forget password CSS | public/auth feature | 75 | 1642 | 11 | 4/5 | 1 |
| 18.Notification screen CSS | account/dashboard feature | 77 | 1452 | 15 | 12/12 | 0 |
| 19.Deactive account CSS | account/dashboard feature | 25 | 476 | 5 | 3/3 | 0 |
| 20.Electricity bill 1 Screen | finance feature | 93 | 2051 | 13 | 12/12 | 0 |
| 21.Paid screen css | finance feature | 48 | 995 | 4 | 4/4 | 0 |
| 22.Faq css | account/dashboard feature | 49 | 1008 | 6 | 2/4 | 2 |
| .faq-txt1:before {
    content: url(../svg/up-arrow.svg) !important;
} | account/dashboard feature | 11 | 232 | 3 | 2/3 | 1 |
| 23.Feedback css | account/dashboard feature | 21 | 340 | 3 | 1/1 | 0 |
| 24.Contact us css | account/dashboard feature | 18 | 337 | 2 | 2/2 | 0 |
| 25.Notifiaction setting css | account/dashboard feature | 69 | 1576 | 9 | 6/6 | 0 |
| 26.Setting screen css | account/dashboard feature | 100 | 1976 | 16 | 12/13 | 1 |
| 27.Send money1 css | finance feature | 57 | 1259 | 9 | 5/5 | 0 |
| 28.Send money4 css | finance feature | 75 | 1712 | 12 | 9/9 | 0 |
| 29.Send money css | finance feature | 86 | 1798 | 13 | 8/8 | 0 |
| 30.Taxes css | finance feature | 34 | 815 | 7 | 3/3 | 0 |
| 31.Marketing css | account/dashboard feature | 29 | 613 | 4 | 3/3 | 0 |
| 32.Data privacy css | account/dashboard feature | 62 | 1320 | 8 | 0/5 | 5 |
| 33.Delete deactivate css | account/dashboard feature | 11 | 197 | 1 | 1/1 | 0 |
| 34.Send money review css | finance feature | 35 | 665 | 6 | 5/5 | 0 |
| 35.Transfer to bank css | finance feature | 90 | 2194 | 18 | 12/12 | 0 |
| 36.Invite friend css | account/dashboard feature | 56 | 1096 | 9 | 7/7 | 0 |
| 37.Logout popup css | account/dashboard feature | 79 | 1689 | 13 | 13/14 | 1 |
| 38.Personal info css | account/dashboard feature | 63 | 1164 | 9 | 3/5 | 2 |
| 39.Activity css | account/dashboard feature | 77 | 1737 | 10 | 7/7 | 0 |
| 40.Delete account css | account/dashboard feature | 57 | 1138 | 10 | 1/6 | 5 |
| 41.Add new card css | account/dashboard feature | 170 | 3825 | 23 | 9/19 | 10 |
| 42.Old invoice css | finance feature | 96 | 2043 | 16 | 12/12 | 0 |
| 43.Invoice css | finance feature | 34 | 670 | 7 | 3/5 | 2 |
| 44.Tracking css | account/dashboard feature | 51 | 946 | 8 | 6/6 | 0 |
| 45.Preapproved-payment1 css | finance feature | 28 | 575 | 4 | 4/4 | 0 |
| 46.Spilt css | finance feature | 136 | 2659 | 26 | 21/21 | 0 |
| 47.Transfer-to-bank-success css | finance feature | 93 | 2054 | 13 | 9/9 | 0 |
| 48.Line chart css | finance feature | 121 | 2367 | 19 | 18/18 | 0 |
| 49.Homescreen css | account/dashboard feature | 102 | 2123 | 14 | 4/12 | 8 |
| 50.Bottom tabbar css | account/dashboard feature | 92 | 1905 | 17 | 12/12 | 0 |
| 51.Face recognition css | account/dashboard feature | 87 | 1666 | 14 | 11/11 | 0 |
| 52.QR code payment css | finance feature | 165 | 4315 | 20 | 11/11 | 0 |
| 53.Create new password CSS | public/auth feature | 101 | 2415 | 15 | 11/11 | 0 |
| 54.Keyframe Animation | shell | 79 | 1243 | 22 | 8/8 | 0 |
| Idetify Bottom Modal | account/dashboard feature | 27 | 523 | 4 | 2/2 | 0 |

## Interpretation rules

- A matched token is evidence that a class or id is present in active source; it is not proof that every selector variant is rendered on every route.
- Dynamic class construction, third-party markup, and Bootstrap data attributes require visual or route-level checks before deletion.
- Sections containing `.iti__*`, `#ui-datepicker-div`, or `.offcanvas*` are treated as dependency/override candidates, not shell-owned CSS.
- The active app currently imports the entire `style.css`, `swap.css`, and `media-query.css` from `App.tsx`, so all section bytes are in the initial CSS graph.

## Third-party and icon audit

| Dependency | Active usage evidence | Phase 3 action |
| --- | --- | --- |
| Bootstrap CSS | `resources/js/App.tsx` plus Bootstrap utility/data attributes in route pages | Keep one deliberate CSS entry; remove duplicate global JS delivery after route behavior is covered |
| React Bootstrap | `Home.tsx` imports `Offcanvas` | Keep component wrapper; it consumes the single Bootstrap CSS entry rather than shipping another stylesheet |
| Bootstrap JS | `App.tsx`, plus data attributes and direct `Offcanvas` imports in feature pages | Scope behavior to routes/components that need it |
| Font Awesome `all.min.css` | No active import found | Remove from active CSS graph; prefer existing `lucide-react` icons for new work |
| intlTelInput | No active CSS or component import found | Do not load globally; delete only after the widget absence is confirmed by visual checks |
| react-datepicker | `AddNewCard.tsx` imports its package CSS locally | Keep route-local; do not add a global date-picker stylesheet |

## Baseline conclusion

The first consolidation step must move tokens/base rules into a small shell stylesheet and load route-owned style groups through the existing lazy route boundary. Deleting selectors before that split would make ownership and visual regressions difficult to attribute.

