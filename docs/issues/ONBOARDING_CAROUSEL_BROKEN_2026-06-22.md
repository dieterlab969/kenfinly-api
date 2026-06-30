# Onboarding Carousel — Broken Layout, Missing Dot Navigation & Premature "Get Started" Button

**Date:** 2026-06-22  
**Severity:** High — The Onboarding screen is the very first thing a new user sees. Missing navigation dots and a "Get Started" button visible on slide 1 break the intended UX gate and create a poor first impression.  
**Status:** 🔴 Open / Planned  
**Component:** `resources/js/template/pages/Splashscreen.tsx`  
**Supporting CSS:** `resources/js/template/assets/css/style.css` (lines 340–433)  
**Route:** `/` (root path in `App.tsx`)

---

## 1. Executive Summary

The Onboarding screen is a 3-slide carousel that is supposed to gate the "Get Started" button until the user reaches the final slide. Two critical visual bugs are present in the deployed staging environment:

1. **Dot navigation is invisible** — the three indicator dots that let users see which slide they are on and navigate between slides do not render on screen.
2. **"Get Started" button appears immediately on slide 1** — the button intended only for slide 3 is visible from the start, bypassing the intended 3-slide walkthrough gate.

Both bugs share the same root cause: **the React component relies on Bootstrap carousel CSS classes for visibility logic, but the HTML structure is missing the required Bootstrap `.carousel` wrapper class, and the React-rendered dot buttons lack the `data-bs-target` attribute that the custom CSS selector targets.** This causes Bootstrap's slide-hiding mechanism to fail silently, rendering all three slides at once.

---

## 2. User Story & Expected Behavior

> "When a user visits staging.kenfinly.com, they see a slideshow (Onboarding). The user must view all 3 slides before the 'Get Started' button appears."

| Step | Expected | Actual |
|---|---|---|
| Land on `/` | Slide 1 shown, "Next" button visible, 3 dots visible at bottom | All slides stacked or "Get Started" already visible, no dots |
| Click "Next" | Move to slide 2, dot 2 activates | N/A — layout already broken |
| Click "Next" again | Move to slide 3, "Get Started" button replaces "Next" | N/A |
| Click "Get Started" | Navigate to `/LetYouScreen` | Button navigates correctly but appears too early |

---

## 3. Codebase Context

### 3.1 Component Location

```
resources/js/template/pages/Splashscreen.tsx
```

Registered at `App.tsx` line 148:
```tsx
<Route path="/" element={<Splashscreen />} />
```

### 3.2 Component Structure (Simplified)

```tsx
// State
const [activeSlide, setActiveSlide] = useState(0);

// Rendered HTML
<div className="onboarding-slider">          // ← MISSING: no .carousel class
  <div className="carousel-inner">           // Bootstrap class
    {slides.map((slide, index) => (
      <div className={`carousel-item Onboarding-Screen-1 ${index === activeSlide ? 'active' : ''}`}>
        ...
        <div className="slider-sec-btn next-btn">
          {index < slides.length - 1
            ? <Link onClick={nextSlide}>Next</Link>
            : <Link to="/LetYouScreen">Get started</Link>  // ← Slide 3 only
          }
        </div>
      </div>
    ))}
  </div>

  {/* Dot indicators */}
  <div className="carousel-indicators custom-slider-btn">   // ← Bootstrap class
    {slides.map((_, index) => (
      <button
        onClick={() => goToSlide(index)}
        className={`custom-slider-dots ${index === activeSlide ? 'active' : ''}`}
        // ← MISSING: no data-bs-target attribute
      />
    ))}
  </div>
</div>
```

### 3.3 CSS Imports

`App.tsx` imports Bootstrap via npm package:
```tsx
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
```

Template custom CSS lives in `resources/js/template/assets/css/style.css`.

---

## 4. Root Causes

### 4.1 Missing `.carousel` Wrapper Class (Critical)

Bootstrap's carousel system requires a strict 3-level class hierarchy:

```
.carousel          ← Positioned ancestor; controls overflow; scopes all child CSS
  └── .carousel-inner    ← overflow: hidden
        └── .carousel-item  ← display: none (non-active) / display: block (active)
```

The component uses `.onboarding-slider` as the top-level wrapper without adding `.carousel`. Because Bootstrap's CSS selector for hiding inactive items is:

```css
.carousel-item {
  display: none;
}
.carousel-item.active {
  display: block;
}
```

...this rule is NOT scoped to require a `.carousel` parent — it applies globally to any `.carousel-item`. So this alone should hide non-active slides.

**However**, Bootstrap JS (`bootstrap.bundle.min.js`) IS imported in `App.tsx`. Bootstrap JS scans the DOM on load, finds `.carousel-inner` and `.carousel-item` elements, and may attempt to initialize the carousel or manipulate `display` styles directly — conflicting with React's state-driven class toggling.

### 4.2 CSS Selector Mismatch for Dot Margins (High)

`style.css` line 352:
```css
.onboarding-slider .carousel-indicators [data-bs-target] {
    margin-right: 8px;
    margin-left: 0 !important;
}
```

This selector targets elements with a `data-bs-target` attribute — which is what Bootstrap's own carousel JS generates. The React-rendered dot buttons have **no `data-bs-target` attribute**:

```tsx
<button
    onClick={() => goToSlide(index)}
    className={`custom-slider-dots ${index === activeSlide ? 'active' : ''}`}
    // ← No data-bs-target
/>
```

Result: The margin/spacing CSS rule never matches. Dots may render but without proper spacing or visual treatment.

### 4.3 Dot Color CSS Variables May Be Undefined (Medium)

`style.css` line 360–363:
```css
.custom-slider-dots {
    background: var(--sub-text-color) !important;
    opacity: 0.24;
}
.custom-slider-dots.active {
    background: var(--text-color) !important;
}
```

Both `--sub-text-color` and `--text-color` are CSS custom properties defined in the template's theme. If these variables are not loaded in the current CSS context (e.g., missing `:root` declaration or wrong CSS load order), the dot background defaults to `transparent` — making dots invisible even when they are structurally present in the DOM.

### 4.4 `.slider-sec-btn` is `position: fixed` (High)

`style.css` line 373–380:
```css
.slider-sec-btn {
    position: fixed;
    width: 100%;
    left: 0;
    bottom: 0;
    z-index: 5;
}
```

Each slide owns its own `.slider-sec-btn` div at `position: fixed; bottom: 0`. When a `.carousel-item` is `display: none`, all of its children — including fixed-position descendants — are also hidden. This is correct CSS behavior.

**But** if Bootstrap's `display: none` fails to apply (due to the Bootstrap JS conflict in root cause 4.1), all three `.slider-sec-btn` divs render simultaneously at `position: fixed; bottom: 0`. Because they all occupy the same fixed position, they stack on top of each other. The last one in DOM order — slide 3's "Get Started" — renders on top, making it the only visible button. This is why "Get Started" appears to be present on slide 1.

### 4.5 React vs Bootstrap JS Conflict (Medium)

`App.tsx` globally imports `bootstrap/dist/js/bootstrap.bundle.min.js`. This JS bundle initializes all Bootstrap interactive components (Carousel, Modal, Offcanvas, etc.) on DOM load. When Bootstrap JS encounters `.carousel-inner` and `.carousel-item`, it may:
- Attach its own event listeners that bypass React's synthetic event system
- Directly manipulate `style.display` on `.carousel-item` elements, overriding React's class-based approach
- Reset `activeSlide` back to 0 independently

This creates a race condition between React state updates and Bootstrap JS DOM mutations.

---

## 5. Bug Causation Chain

```
App.tsx imports Bootstrap JS globally
        │
        ▼
Bootstrap JS scans DOM → finds .carousel-inner / .carousel-item
        │
        ├── May reset display styles on .carousel-item
        │
        └── Conflicts with React's className-based activeSlide logic
                        │
                        ▼
        .carousel-item (non-active) fails to get display:none
                        │
                        ├── BUG 1: All 3 slides render simultaneously
                        │         → Dots buried / clipped under stacked slides
                        │
                        └── BUG 2: All 3 .slider-sec-btn (fixed bottom)
                                   render at same position
                                   → Slide 3's "Get Started" wins (last in DOM)
                                   → Visible on slide 1
```

---

## 6. Proposed Fix Strategy

### Recommended: Remove Bootstrap Carousel Dependency Entirely

The component is already using React state (`activeSlide`) to manage which slide is visible. The Bootstrap carousel CSS classes (`.carousel-inner`, `.carousel-item`, `.carousel-indicators`) are being used purely for styling, but they introduce Bootstrap JS conflicts and selector mismatches. The cleanest fix is to replace them with React-controlled visibility.

#### 6.1 Replace `.carousel-item` visibility with React inline style

**Before:**
```tsx
<div className={`carousel-item Onboarding-Screen-1 ${index === activeSlide ? 'active' : ''}`}>
```

**After:**
```tsx
<div
    className="Onboarding-Screen-1"
    style={{ display: index === activeSlide ? 'block' : 'none' }}
>
```

This removes the dependency on Bootstrap's `display: none / display: block` cascade entirely. React controls visibility directly — no CSS class toggling, no Bootstrap JS interference.

#### 6.2 Fix dot buttons — add `data-bs-target` or remove the selector dependency

**Option A** — Add `data-bs-target` to match existing CSS selector:
```tsx
<button
    key={index}
    type="button"
    data-bs-target="#onboardingCarousel"
    onClick={() => goToSlide(index)}
    className={`custom-slider-dots ${index === activeSlide ? 'active' : ''}`}
/>
```

**Option B (Recommended)** — Update `style.css` to drop `[data-bs-target]` from the selector:
```css
/* Before */
.onboarding-slider .carousel-indicators [data-bs-target] { ... }

/* After */
.onboarding-slider .carousel-indicators button { ... }
```

#### 6.3 Verify CSS variables are defined

Check that `:root` declarations for `--sub-text-color` and `--text-color` are present in the loaded CSS. If the template's theme CSS is not imported in `App.tsx`, add the import.

#### 6.4 Guard "Get Started" gate correctly

Current logic is already correct in the JSX — slide 3 shows "Get Started", others show "Next". Once the display fix in 6.1 is applied, the gate will work correctly without any additional changes.

---

## 7. Files to Change

| File | Change | Risk |
|---|---|---|
| `resources/js/template/pages/Splashscreen.tsx` | Replace `.carousel-item` class + active toggle with `style={{ display }}` | Low |
| `resources/js/template/assets/css/style.css` | Fix `[data-bs-target]` selector → `button` (line 352) | Low |
| `resources/js/template/assets/css/style.css` | Verify `--sub-text-color` / `--text-color` variables are in `:root` | Low |

---

## 8. Out of Scope

| Item | Reason |
|---|---|
| Removing Bootstrap JS globally from `App.tsx` | Bootstrap JS is used by other components (e.g., `FaceRecognitionRunning.tsx` uses `Offcanvas`). Removing it globally is a separate, higher-risk refactor. |
| Adding swipe/touch gesture support | Not in original spec |
| Auto-advancing slides on a timer | Not in original spec |
| Animating slide transitions | Current CSS already disables transitions (`transition: none !important` on `.onboarding-slider .carousel-item`). Animation is out of scope. |

---

## 9. Testing Checklist

After the fix is applied, verify the following:

- [ ] Slide 1 shows on initial load; slides 2 and 3 are not visible
- [ ] Three dot indicators are visible below the slide content
- [ ] Dot 1 is fully opaque (active state); dots 2 and 3 are semi-transparent
- [ ] Clicking dot 2 navigates to slide 2; dot 1 becomes semi-transparent, dot 2 becomes opaque
- [ ] Clicking dot 3 navigates to slide 3; "Get Started" button appears
- [ ] "Next" button on slide 1 → advances to slide 2
- [ ] "Next" button on slide 2 → advances to slide 3
- [ ] "Get Started" on slide 3 → navigates to `/LetYouScreen`
- [ ] "Get Started" is NOT visible on slides 1 or 2
- [ ] No console errors related to carousel initialization

---

## 10. References

- `resources/js/template/pages/Splashscreen.tsx` — Full component source
- `resources/js/template/assets/css/style.css` lines 340–433 — Onboarding CSS section
- `resources/js/template/App.tsx` lines 1–2 — Bootstrap JS/CSS imports
- Bootstrap 5 Carousel docs: https://getbootstrap.com/docs/5.3/components/carousel/
