# Settings Back-Navigation Fix

**Date:** 2026-06-26
**Status:** Implemented
**Priority:** High — UX regression

---

## 1. Problem Statement

When a user opens the Settings drawer from the Home screen and navigates into a child screen (e.g. Personal Info, Notification Settings), pressing the Back button returns them to the Home screen but the Settings drawer is **closed**. The previous navigation context — drawer open, settings section visible — is completely lost.

### Observed flow (broken)
1. User opens hamburger → Settings drawer slides open (Bootstrap offcanvas `#offcanvasExample`)
2. User selects a Settings item (e.g. "Personal Info")
3. Child page opens (`/PersonalInfo`)
4. User presses Back → `navigate(-1)` → returns to `/Home`
5. ❌ Settings drawer is **closed**; user must re-open it manually

### Expected flow (correct)
1. User opens hamburger → Settings drawer slides open
2. User selects a Settings item
3. Child page opens
4. User presses Back → returns to `/Home`
5. ✅ Settings drawer **re-opens automatically**, restoring the previous context

---

## 2. Root Cause Analysis

### Architecture

| Layer | File | Role |
|---|---|---|
| Router | `resources/js/template/App.tsx` | Flat `BrowserRouter` — all pages as top-level routes |
| Home page | `resources/js/template/pages/Home.tsx` | Renders the Settings drawer (offcanvas) |
| Settings panel | `resources/js/template/components/Setting.tsx` | Rendered inside offcanvas body; contains nav links |
| Back button | `resources/js/template/components/BackBtn.tsx` | Calls `navigate(-1)` |

### Root cause: Two compounding issues

#### Issue 1 — React Router unmounts/remounts the page component

The template uses a flat router: `/Home`, `/PersonalInfo`, `/NotificationSetting`, etc. are all sibling routes. When the user navigates from `/Home` to `/PersonalInfo`, React Router **completely unmounts** the `<Home>` component. When `navigate(-1)` is called, `<Home>` **remounts fresh** — all local React state is reset.

#### Issue 2 — Bootstrap offcanvas state is imperative, not React state

The drawer is a **Bootstrap offcanvas** (`#offcanvasExample`), opened via `data-bs-toggle="offcanvas"` (an HTML attribute processed by Bootstrap JS). Bootstrap manages this drawer's open/closed state **internally** — it is not tracked in any React state variable. On every fresh mount of `<Home>`, Bootstrap initialises the offcanvas in its **default closed state**.

### Chain of causation

```
User on /Home → opens offcanvas (Bootstrap state: open)
  → clicks SettingOption <Link to="/PersonalInfo">
  → React Router navigates → <Home> UNMOUNTS
  → /PersonalInfo renders

User presses BackBtn → navigate(-1)
  → React Router → /Home → <Home> REMOUNTS (fresh)
  → Bootstrap initialises #offcanvasExample → CLOSED (default)
  → User sees Home with drawer closed ❌
```

### Why NOT a routing issue

`navigate(-1)` correctly returns to `/Home` — the URL is right. The problem is purely about **UI state** (the offcanvas open/closed status) not surviving the unmount–remount cycle.

---

## 3. Solution Design

### Approach: sessionStorage state handoff

Store the "return-to-settings" intent in `sessionStorage` **immediately before** navigating to a child page. On `<Home>` mount, read and clear the flag, then programmatically show the offcanvas via Bootstrap's JS API.

**Why sessionStorage?**
- Survives React component unmounts (unlike useState)
- Scoped to the browser tab (unlike localStorage — won't bleed between tabs)
- No new dependencies, no router changes, no context providers
- Consistent with the existing Bootstrap + React architecture

**Why not React Router location state?**
- `navigate(-1)` (the Back button) does not carry forward any new state — it pops the existing history entry, which has no custom state.
- Would require changing `BackBtn.tsx` to inspect and forward state, which is more invasive.

**Why not a global context/store?**
- Would require wrapping both Home and Setting in a new provider — structural change.
- sessionStorage achieves the same result with two targeted edits.

### Key: `window.bootstrap.Offcanvas`

`App.tsx` already imports `bootstrap/dist/js/bootstrap.bundle.min.js` as a side-effect. This registers `window.bootstrap`. Calling `window.bootstrap.Offcanvas.getOrCreateInstance(el).show()` uses the **same Bootstrap instance** that manages the existing `data-bs-toggle` listeners — avoiding any double-initialisation risk.

---

## 4. Change Plan

### Modified files

| File | Change type | Description |
|---|---|---|
| `resources/js/template/components/Setting.tsx` | Edit | Add `saveNavState()` + `onBeforeNavigate` prop wiring |
| `resources/js/template/pages/Home.tsx` | Edit | Add mount-time sessionStorage check + offcanvas restore |

No new files, no new dependencies, no router changes.

---

### 4.1 `Setting.tsx` changes

#### A. Add `onBeforeNavigate` prop to `SettingOption`
```tsx
interface SettingOptionProps {
  to: string;
  icon: string;
  title: string;
  subtitle?: string;
  onBeforeNavigate?: () => void;   // ← NEW
}
```

#### B. Add click handler to `SettingOption`
```tsx
const handleClick = () => {
  onBeforeNavigate?.();
};
// Pass to <Link onClick={handleClick}>
```

#### C. Add `saveNavState` to `Setting` component
```tsx
const saveNavState = () => {
  try {
    sessionStorage.setItem(
      'kenfinly_settings_return',
      JSON.stringify({ drawerOpen: true })
    );
  } catch { /* quota errors — safe to ignore */ }
};
```

#### D. Wire `onBeforeNavigate` to all SettingOption usages and profile edit link

All 13 `<SettingOption>` calls receive `onBeforeNavigate={saveNavState}`.
The profile edit `<Link to="/PersonalInfo">` gains `onClick={saveNavState}`.

---

### 4.2 `Home.tsx` changes

#### Add mount-time restore effect
```tsx
// ── Restore Settings drawer after back-navigation ───────────────────────
useEffect(() => {
  try {
    const raw = sessionStorage.getItem('kenfinly_settings_return');
    if (!raw) return;
    sessionStorage.removeItem('kenfinly_settings_return');  // consume immediately
    const state = JSON.parse(raw);
    if (!state.drawerOpen) return;
    // Defer 50 ms so Bootstrap can finish initialising its DOM listeners
    const timer = setTimeout(() => {
      const bsOffcanvas = (window as any).bootstrap?.Offcanvas;
      const el = document.getElementById('offcanvasExample');
      if (bsOffcanvas && el) bsOffcanvas.getOrCreateInstance(el).show();
    }, 50);
    return () => clearTimeout(timer);
  } catch { /* silent */ }
}, []);
```

**Why 50 ms?** React commits the DOM synchronously, but Bootstrap's `MutationObserver` and event delegation listeners initialise asynchronously on the next micro-task tick. A 50 ms guard ensures the offcanvas element is fully registered before `.show()` is called.

---

## 5. State Persistence Strategy

| State | Persistence mechanism | Lifetime |
|---|---|---|
| Offcanvas open/closed | `sessionStorage['kenfinly_settings_return']` | One navigation round-trip (consumed on read) |
| Settings accordion open/closed (`isChartOpen`) | sessionStorage (same key, `settingsExpanded` field) | One navigation round-trip |

The key is **consumed immediately on read** (`removeItem` before acting on it). This means:
- If the user navigates forward again from a child page, the state is not double-applied
- If the user uses the browser's native back button (same `navigate(-1)` call), it works identically
- If the user manually types `/Home` in the address bar, no restore happens (correct — they didn't come from Settings)

---

## 6. Hardware Back Button (Android)

React Router v6's `navigate(-1)` responds to `window.history.back()`, which is exactly what Android's hardware back button triggers via the browser's history API. The fix works identically — no additional changes required.

---

## 7. Testing Instructions

### Manual test — Settings drawer restoration
1. Go to `/Home`
2. Tap the hamburger icon → confirm Settings drawer opens
3. Tap any settings item (e.g. "Personal Info")
4. On the child page, tap the Back button (←)
5. **Expect:** Settings drawer re-opens automatically

### Manual test — Drawer does NOT open on fresh Home visit
1. Go to `/Home` directly (type URL or follow a link from a non-settings context)
2. **Expect:** Settings drawer stays closed

### Manual test — Normal back navigation still works
1. Navigate: Home → Activity (bottom nav)
2. Press Back
3. **Expect:** Returns to Activity page; Settings drawer does NOT open

### Manual test — Multiple back presses
1. Open Settings drawer → tap "Personal Info" → tap Back
2. Settings drawer opens. Tap "Security" → tap Back
3. **Expect:** Settings drawer opens again (state saved fresh each time)

---

## 8. Files Modified

| File | Nature of change |
|---|---|
| `resources/js/template/components/Setting.tsx` | Added `onBeforeNavigate` prop, `saveNavState()`, and wired both to all nav links |
| `resources/js/template/pages/Home.tsx` | Added mount-time `useEffect` to restore offcanvas from sessionStorage |
