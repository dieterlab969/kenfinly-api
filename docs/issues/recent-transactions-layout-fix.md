# Issue: Recent Transactions Layout Imbalance

**Date:** 2026-06-28
**File:** `resources/js/template/pages/Home.tsx`
**Section:** Recent Transactions card

---

## Problem

The transaction row has an unbalanced two-column structure. The right column contains only the amount (one line), while the left column carries two lines of text (category name + date · wallet name). This makes the rows feel top-heavy on the right and creates visual misalignment.

**Current rendering:**
```
[icon]  Food/Drinks                    -20.000đ
        21/06/2026 · My Wallet
```

The right column has 1 line; the left column has 2 lines — row heights are unequal, producing a "floated" look for the amount.

---

## Root Cause

Line 1041 concatenates date and wallet name into a single subtitle string under the category:
```tsx
{[getTransactionDateLabel(tx), tx.account?.name].filter(Boolean).join(' · ')}
```

The amount (`fmtSignedVND`) is a standalone `<span>` on the right — a single line with no vertical companion.

---

## Solution

Restructure each row into a true two-column layout where **both sides always have two lines of equal visual weight**.

| Left column (left-aligned) | Right column (right-aligned) |
|---|---|
| **Category name** (bold, `#121212`) | **Amount** (bold, color-coded) |
| Wallet name (regular, `#9ca3af`, 12px) | Date (regular, `#9ca3af`, 12px) |

**New rendering:**
```
[icon]  Food/Drinks             -20.000đ
        My Wallet               21/06/2026
```

### CSS Rules
- Left top: `fontWeight: 600`, `fontSize: 14px`, `color: #121212`
- Left bottom: `fontSize: 12px`, `color: #9ca3af`, `marginTop: 2px`
- Right top: `fontWeight: 700`, `fontSize: 14px`, color-coded (`#28a745` income / `#dc3545` expense)
- Right bottom: `fontSize: 12px`, `color: #9ca3af`, `marginTop: 2px`, `textAlign: right` — **mirrors left bottom for perfect symmetry**

---

## Changes Made

### `resources/js/template/pages/Home.tsx`

**Before** (lines ~1034–1050):
```tsx
<div style={{ flex: 1, minWidth: 0 }}>
  <p style={{ fontSize: '14px', fontWeight: 600, color: '#121212', ... }}>
    {tx.category?.name || ...}
  </p>
  <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
    {[getTransactionDateLabel(tx), tx.account?.name].filter(Boolean).join(' · ')}
  </p>
</div>
<span style={{ fontSize: '14px', fontWeight: 700, flexShrink: 0, color: ... }}>
  {fmtSignedVND(signedAmount)}
</span>
```

**After**:
```tsx
{/* Left column — category + wallet */}
<div style={{ flex: 1, minWidth: 0 }}>
  <p style={{ fontSize: '14px', fontWeight: 600, color: '#121212', ... }}>
    {tx.category?.name || ...}
  </p>
  <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
    {tx.account?.name || ''}
  </p>
</div>
{/* Right column — amount + date */}
<div style={{ flexShrink: 0, textAlign: 'right' }}>
  <p style={{ fontSize: '14px', fontWeight: 700, color: ... }}>
    {fmtSignedVND(signedAmount)}
  </p>
  <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
    {getTransactionDateLabel(tx)}
  </p>
</div>
```

---

## Result

Every transaction row now has equal two-line height on both sides, fully resolving the misaligned appearance.
