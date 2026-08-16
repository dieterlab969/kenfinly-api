# Frontend Production Bundle Baseline

**Generated:** 2026-08-16T07:11:31.131Z
**Command:** `npm run baseline:bundle`
**Build:** Vite production build from the current working tree

## Summary

| Measure | Raw | Gzip estimate |
| --- | ---: | ---: |
| All emitted files (159) | 6.32 MiB | 3.97 MiB |
| JavaScript and CSS (3) | 2.44 MiB | 602.63 KiB |

> Gzip values are local estimates from emitted files. They do not include
> transfer headers, CDN compression differences, or browser caching.

## Vite entrypoints

| Source | JavaScript output | CSS output |
| --- | --- | --- |
| `resources/css/app.css` | `assets/app-Bb9yMvo9.css` | — |
| `resources/js/main.tsx` | `assets/main-D0ZHsDtM.js` | `assets/main-CKuzE6gr.css` |

## Largest JavaScript/CSS chunks

| Rank | File | Raw | Gzip estimate |
| ---: | --- | ---: | ---: |
| 1 | `assets/main-D0ZHsDtM.js` | 1.98 MiB | 533.66 KiB |
| 2 | `assets/main-CKuzE6gr.css` | 340.34 KiB | 46.34 KiB |
| 3 | `assets/app-Bb9yMvo9.css` | 135.16 KiB | 22.63 KiB |

## Largest emitted assets

| Rank | File | Raw | Gzip estimate |
| ---: | --- | ---: | ---: |
| 1 | `assets/main-D0ZHsDtM.js` | 1.98 MiB | 533.66 KiB |
| 2 | `assets/logo-qg8T2m6h.png` | 1.33 MiB | 1.33 MiB |
| 3 | `assets/logo-DdEIm5Sw.png` | 652.41 KiB | 651.06 KiB |
| 4 | `assets/logo-m2WRbsJw.svg` | 577.00 KiB | 200.32 KiB |
| 5 | `assets/main-CKuzE6gr.css` | 340.34 KiB | 46.34 KiB |
| 6 | `assets/onboarding3-img-DeQ4Vbmw.png` | 254.93 KiB | 253.43 KiB |
| 7 | `assets/onboarding2-img-CTBFEQ3v.png` | 213.77 KiB | 212.38 KiB |
| 8 | `assets/onboarding1-img-CS2iLfCw.png` | 206.28 KiB | 202.85 KiB |
| 9 | `assets/visa-card-CrQo5-U-.png` | 170.81 KiB | 170.88 KiB |
| 10 | `assets/app-Bb9yMvo9.css` | 135.16 KiB | 22.63 KiB |
| 11 | `assets/scan-code1-YbRzqkUL.png` | 91.08 KiB | 91.13 KiB |
| 12 | `assets/scan-code-0mE6Ry4m.png` | 72.92 KiB | 70.52 KiB |
| 13 | `assets/Satoshi-Medium-DOt9kM-a.ttf` | 72.03 KiB | 34.76 KiB |
| 14 | `assets/scanner-CMJbnoAR.png` | 16.07 KiB | 16.09 KiB |
| 15 | `assets/selfie-overlay-8GxhgW4u.png` | 9.68 KiB | 7.95 KiB |
| 16 | `assets/left-icon-iLaxEWnf.png` | 9.54 KiB | 8.34 KiB |
| 17 | `assets/instrgram-DWHL1LwI.png` | 8.54 KiB | 8.56 KiB |
| 18 | `assets/whatup-B2uyNZfQ.png` | 8.43 KiB | 8.46 KiB |
| 19 | `assets/viber-Cv2NTXRE.png` | 8.16 KiB | 8.18 KiB |
| 20 | `assets/call-me-0dyF94U7.png` | 8.12 KiB | 8.15 KiB |

## Interpretation

- The current build has one main JavaScript entry, so route code is part
  of the initial JavaScript payload until Phase 1 introduces lazy routes.
- This report measures emitted output only. It intentionally does not
  claim that every emitted image is loaded on the first page.
- Re-run this command after each delivery or CSS phase and compare the
  entrypoint and chunk tables with this baseline.

