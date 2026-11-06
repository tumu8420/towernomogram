# TowerNomogram — Design

Author: Chengwan Wu · Kiroween 2026, Resurrection category

## 1. Architecture

A single-page static web app with three files and no build step:

| File | Responsibility |
|---|---|
| `index.html` | Page structure: header, disclaimer, input controls, output cards, SVG chart container, compare table, how-it-works section, footer. No inline calculation logic. |
| `styles.css` | All styling. Theme is a `data-theme` attribute (`light` / `midnight`) on `<html>`; CSS variables switch the palette. The Halloween glow is a CSS `drop-shadow` filter applied only to `.nomogram-line` in midnight mode. |
| `app.js` | All behaviour: state, the pure `calculate(inputs)` function, DOM wiring, SVG rendering, comparison table, CSV export, theme toggle. |

No framework, no chart library, no network calls. The app works from
`file://` as well as from any static host.

## 2. State and data flow

- One `state` object holds the eight inputs (see `requirements.md` REQ-01).
- Every input event calls `update()`: read the DOM into `state`, clamp
  numeric values to their ranges, call `calculate(state)`, then render
  outputs, the SVG chart and (indirectly) the comparison table.
- `calculate(inputs)` is a pure function — no DOM access — so its results
  are reproducible and testable in isolation (e.g. from Node with the
  `module.exports` guard at the bottom of `app.js`).
- Comparison snapshots are plain objects copied from `state` plus the
  calculated results; at most 8 are kept (oldest dropped first).

## 3. Calculation design

Full formulas are in `README.md` and as comments at the top of `app.js`.
Design decisions and their reasons:

1. **Tapered tube, linear taper.** Real towers taper in steps; a linear
   taper in diameter (`D_top = 0.55 × D_base`) and thickness
   (`t_top = 0.70 × t_base`) is the simplest model that still produces
   plausible mass and stiffness. Both ratios are named constants so a
   reviewer can change them in one place.
2. **Thin-walled mass.** `A = π × D_avg × t_avg` is accurate to a few
   percent for the diameter/thickness ratios here (D/t ≈ 100–200) and
   keeps the mass formula auditable. A flat 1.08 allowance covers flanges
   and internals without pretending to be a parts list.
3. **Stiffness at one-third height.** A cantilever's deflection and
   frequency are dominated by the lower part of the tower, so the
   effective second moment of area is evaluated at one-third height
   rather than at the average section. This is documented as an
   approximation: it is closer than the average section but still
   underestimates a full tapered-beam integration.
4. **Rayleigh effective mass.** `m_eq = M_top + 0.24 × M_tower` is the
   standard first-mode effective mass for a cantilever with a tip mass.
   The 0.24 factor is a named constant (`MODAL_MASS_FACTOR`).
5. **Operating wind speed proxy.** `V_op = 0.28 × V_ref` ties the wind
   class to the thrust estimate in a transparent way (≈10–14 m/s) while
   making clear it is not a code load case. Thrust coefficient is held
   at 0.8. This keeps the deflection estimate order-of-magnitude
   correct without importing a load standard the app does not implement.
6. **Steel grade only affects yield.** Young's modulus and density are
   the same for all structural steels, so grade enters only through the
   utilisation check (`σ / (f_y / 1.1)`). The UI says so next to the
   grade selector, so the grade is never presented as changing mass or
   frequency.
7. **No dynamics.** Damping, gust factors, aeroelasticity, 1P/3P
   resonance and fatigue are deliberately omitted and listed as limits
   in the README. Adding any of them would imply a design-grade model
   the app is not.

## 4. Nomogram chart design

- Hand-built SVG (`viewBox 0 0 760 420`), generated as a string in
  `renderNomogram()` and set via `innerHTML` on the `<svg>` element.
- Left axis: first natural frequency, 0–0.6 Hz. Right axis: tower mass,
  0–600 t. Horizontal axis: hub height, 60–160 m.
- Three frequency curves for base diameters (current − 1 m, current,
  current + 1 m, clamped to 3–7 m); the current diameter's curve is
  thicker. A dashed curve shows tower mass for the current diameter.
- A shaded 0.20–0.35 Hz band is labelled as a typical soft-soft window
  (illustrative only). A dot with crosshair marks the current tower.
- A companion table lists frequency and mass at the current hub height
  for the three diameters, so the chart can be read as numbers as well
  as visually.

## 5. Theming

- Light theme is the default: white panels on a pale grey background,
  dark ink, teal accent — chosen for readability in screenshots and in
  the demo video.
- Midnight theme: dark navy panels, light ink, and the orange/purple
  glow on the nomogram lines only. The glow is deliberately subtle so
  the chart stays legible.
- The toggle stores the choice in `localStorage` under
  `towernomogram-theme`; if storage is unavailable the theme still
  applies for the visit.

## 6. Error handling

- Non-finite calculation results render as "—" rather than `NaN`.
- A zero or negative inner diameter yields `I = 0` and a "—" output
  instead of a crash (unreachable within the clamped input ranges, but
  guarded anyway).
- CSV export with no snapshots exports the current tower, so the button
  is never a dead end.
- Theme storage is wrapped in `try/catch` so a blocked `localStorage`
  does not break the app.

## 7. Alternatives considered

- **Canvas instead of SVG for the chart:** rejected — SVG text stays
  crisp and selectable, and the chart is easier to inspect and to style
  with the theme (including the glow filter).
- **A true three-scale paper nomogram (straight isopleth):** rejected —
  the three quantities here do not share a single straight-line
  construction without specially spaced scales; drawing one would have
  implied a mathematical property the chart does not have. The
  frequency/mass-versus-height chart is honest about what it shows.
- **A build step / bundler:** rejected — the brief requires no build
  step, and three files are small enough to review directly.
