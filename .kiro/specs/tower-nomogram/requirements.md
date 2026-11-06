# TowerNomogram — Requirements

Author: Chengwan Wu · Kiroween 2026, Resurrection category

## 1. Purpose

Resurrect the paper nomogram as an interactive web app for onshore
wind-turbine towers. A user sets tower parameters and immediately reads
off simplified tower mass, first natural frequency, tip deflection and
slenderness ratio, with a live chart. The app is an educational
exploration tool, not a design tool.

## 2. Functional requirements

- **REQ-01 — Inputs.** The app must accept hub height (60–160 m), rotor
  diameter (80–180 m), rated power (2–8 MW), tower-top mass (80–400 t),
  base diameter (3–7 m), wall thickness at base (10–80 mm), steel grade
  (S355 / S420 / S460) and wind class (IEC I / II / III). Each numeric
  input must have both a slider and a numeric field, kept in sync.
- **REQ-02 — Live outputs.** On any input change the app must recompute
  and display: tower mass estimate (t), first natural frequency (Hz),
  tip-deflection estimate (m), slenderness ratio (H / D_base).
- **REQ-03 — Supplementary outputs.** The app must also display rotor
  swept area, steady thrust at hub, base bending moment, base bending
  stress and stress utilisation, and the operating wind speed used.
- **REQ-04 — Calculation model.** All outputs must come from the
  simplified model documented in `README.md` and in `app.js` comments:
  thin-walled tapered shell for mass; cantilever-beam model with an
  effective second moment of area at one-third height for frequency;
  steady thrust at a characteristic operating wind speed for deflection.
  No hidden or undocumented factors.
- **REQ-05 — Nomogram chart.** A hand-drawn SVG chart (no chart library)
  must update live with the inputs, plotting first natural frequency and
  tower mass versus hub height for three base diameters around the
  current one, with the current tower marked, plus a table of the curve
  values at the current hub height.
- **REQ-06 — Presets.** One-click presets for 2 MW (80 m hub), 4 MW
  (100 m hub) and 6 MW (120 m hub) onshore reference turbines, with the
  values listed in `README.md`.
- **REQ-07 — Compare and export.** The user can snapshot the current
  tower into a comparison table (up to 8 rows) and export the table as
  a CSV file. Exporting with an empty table must export the current
  tower rather than an empty file.
- **REQ-08 — Themes.** A theme toggle must switch between the default
  light theme and a dark "midnight" theme. Midnight mode adds a subtle
  Halloween glow to the nomogram lines only; readability must not be
  harmed in either theme. The choice is remembered in `localStorage`.
- **REQ-09 — Disclaimer.** A prominent safety disclaimer must appear in
  the app UI and in `README.md`: simplified educational /
  preliminary-exploration tool only; NOT for actual structural design,
  certification, or construction; results must be verified by a
  qualified engineer.
- **REQ-10 — Static, dependency-free.** Single-page static app:
  `index.html` + `styles.css` + `app.js`, vanilla HTML/CSS/JS, no build
  step, no backend, no external CDN or runtime dependencies. Opening
  `index.html` directly must work.

## 3. Non-functional requirements

- **REQ-11 — Honesty.** Every number is labelled as a simplified
  estimate. The README must list all calculation assumptions and limits
  explicitly (see `README.md`, "Calculation assumptions").
- **REQ-12 — Input validation.** Numeric inputs are clamped to their
  stated ranges; out-of-range typed values cannot silently leave the
  model's valid envelope.
- **REQ-13 — Accessibility.** Inputs have labels; the chart has a text
  alternative (`aria-label`); the theme toggle reports its state
  (`aria-pressed`).
- **REQ-14 — Repo readiness.** The project folder must contain
  `README.md`, an MIT `LICENSE` (copyright Chengwan Wu, 2026), and the
  `.kiro/` spec and steering documents. `.kiro/` must never be excluded
  by a `.gitignore`.

## 4. Out of scope

- Detailed structural design, code checks, fatigue, buckling, FEA,
  foundation design, or any certification workflow.
- User accounts, saved projects on a server, or any backend.
- Real turbine manufacturer data; presets are generic reference values.

## 5. Acceptance criteria

- Opening `index.html` shows the 4 MW preset results (mass ≈ 263 t,
  f₁ ≈ 0.22 Hz, tip deflection ≈ 1.8 m, slenderness 20.0).
- Changing any slider updates all outputs and the chart immediately.
- Each preset loads its documented values.
- Adding two snapshots and exporting CSV produces a file with a header
  row and two data rows.
- Toggling midnight theme changes the theme and persists on reload.
- `node --check app.js` passes.
