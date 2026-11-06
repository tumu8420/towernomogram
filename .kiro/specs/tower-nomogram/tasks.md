# TowerNomogram — Tasks

Author: Chengwan Wu · Kiroween 2026, Resurrection category

Status: all tasks below are complete in this prototype. The list is kept
as the implementation record for the spec.

## 1. Scaffolding

- [x] 1.1 Create the project folder with `index.html`, `styles.css`,
      `app.js`, `README.md`, `LICENSE` (MIT, Chengwan Wu, 2026) and the
      `.kiro/` spec/steering documents. No `.gitignore` that excludes
      `.kiro/`.
- [x] 1.2 Confirm the app opens directly from `index.html` with no build
      step and no external dependencies.

## 2. Inputs and presets

- [x] 2.1 Add the eight inputs (hub height, rotor diameter, rated power,
      tower-top mass, base diameter, wall thickness, steel grade, wind
      class) as sliders + numeric fields, kept in sync.
- [x] 2.2 Add 2 MW / 4 MW / 6 MW presets with the values in `README.md`,
      plus a reset-to-4 MW action.
- [x] 2.3 Clamp numeric inputs to their stated ranges on every update.

## 3. Calculation

- [x] 3.1 Implement `calculate(inputs)` as a pure function: tower mass
      (thin-walled tapered shell + 8% allowance), first natural
      frequency (cantilever beam, I at one-third height, Rayleigh
      effective mass), tip deflection (steady thrust at `V_op =
      0.28 × V_ref`), slenderness (`H / D_base`), plus supplementary
      swept area, thrust, base moment, base stress and utilisation.
- [x] 3.2 Document every formula and constant in code comments at the
      top of `app.js` and in `README.md`.
- [x] 3.3 Verify the 4 MW preset by hand: mass ≈ 263 t, f₁ ≈ 0.22 Hz,
      tip deflection ≈ 1.8 m, slenderness 20.0.

## 4. Outputs and chart

- [x] 4.1 Render the four main outputs and the six supplementary values,
      updating live on every input change.
- [x] 4.2 Render the live SVG nomogram (frequency + mass vs hub height,
      three base diameters, current tower marked, soft-soft band,
      companion values table).
- [x] 4.3 Add the prominent safety disclaimer to the UI and to the
      README.

## 5. Compare, export, theme

- [x] 5.1 Comparison table: snapshot the current tower (up to 8 rows),
      clear action, empty-state message.
- [x] 5.2 CSV export with a header row; exports the current tower when
      the table is empty.
- [x] 5.3 Midnight theme toggle with subtle Halloween glow on the
      nomogram lines only; light theme is the readable default; choice
      persists in `localStorage`.

## 6. Verification

- [x] 6.1 `node --check app.js` passes.
- [x] 6.2 Reason through the input/output wiring: every control has a
      `data-field` / `data-number` binding, every output element id
      referenced in `app.js` exists in `index.html`.
- [x] 6.3 List all calculation assumptions explicitly in `README.md`.

## 7. Before submission (not part of this prototype)

- [ ] 7.1 Publish the folder as a public GitHub repo (MIT license) and
      enable GitHub Pages.
- [ ] 7.2 Record a demo video under 3 minutes, public on YouTube,
      showing the app working end to end.
- [ ] 7.3 Write the Devpost submission write-up describing only the Kiro
      steps genuinely performed.
- [ ] 7.4 Request the 4,000 free Kiro credits by Dec 1, 2026, 12:00 PM PT
      (form: https://forms.gle/ykuadfNyNdWdbJfH9) and redeem by Dec 4.
- [ ] 7.5 Submit the project on Devpost before Dec 4, 2026, 2:00 PM PT.
