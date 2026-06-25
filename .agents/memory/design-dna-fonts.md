---
name: Design DNA fonts
description: Which font goes where in the TSX template — Satoshi vs Poppins
---

## Rule
- **Satoshi** — primary font for all UI elements: card titles, body text, form labels, inputs, nav labels, button text
- **Poppins** — reserved for large display figures only: total balance (28px+), hero headings

**Why:** The Design DNA spec calls out Satoshi as the primary brand font. Poppins is only used for its numeric weight at large sizes (the balance hero). Using Poppins in card titles or form inputs breaks visual consistency with the rest of the template.

**How to apply:** In `Home.tsx` inline style map (`S`), `cardTitle.fontFamily` = `'Satoshi, sans-serif'`. Amount input in quick-add modal = `'Satoshi, sans-serif'`. Only the `h1` balance display at the top uses Poppins.
