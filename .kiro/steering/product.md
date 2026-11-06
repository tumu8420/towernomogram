# Product Steering — TowerNomogram

Author: Chengwan Wu · Kiroween 2026, Resurrection category

## Product intent

TowerNomogram resurrects a dead technology — the paper nomogram — as a
live web app for onshore wind-turbine towers. The product is a visual,
hands-on way to build intuition for how tower height, diameter, wall
thickness and top mass move tower mass, natural frequency, deflection
and slenderness. It is for learning and preliminary exploration: a
student, a junior engineer, or a curious hackathon visitor should be
able to move a slider and immediately see what changes and by how much.

## Who it is for

- People learning wind-turbine tower behaviour who do not yet have a
  feel for the orders of magnitude involved.
- Engineers doing a first, rough sanity check before opening a proper
  analysis tool.
- Kiroween visitors and judges who want to see a working, honest
  engineering toy — not a black box.

## What good looks like

- **Immediate:** every slider move updates every number and the chart
  with no perceptible delay and no page reload.
- **Honest:** every number is labelled as a simplified estimate; the
  assumptions are one click away in the README and in the code comments;
  nothing looks more precise than it is.
- **Readable:** the default light theme is professional and
  screenshot-friendly. The Halloween midnight theme is a light touch —
  a glow on the nomogram lines — never a gimmick that harms legibility.
- **Small:** three files, no build step, no backend, no external
  dependencies. Anyone can open `index.html` and read the whole app.

## Hard boundaries (do not cross)

1. **Safety first.** The app and README must carry the disclaimer
   prominently: simplified educational / preliminary-exploration tool
   only; NOT for actual structural design, certification, or
   construction; results must be verified by a qualified engineer.
   Never soften this language to make the tool sound more capable.
2. **No fake precision.** Do not add decimal places, confidence
   intervals, or code references that imply the model is design-grade.
   The model ignores dynamics, fatigue, buckling, soil interaction and
   all code load cases — say so.
3. **No scope creep into design.** Do not add member checks, foundation
   design, or "pass/fail" verdicts. A utilisation percentage is shown
   only as a supplementary, simplified stress ratio, not as a pass.
4. **No hidden behaviour.** No network calls, no tracking, no external
   assets. The calculation must be fully visible in `app.js`.
5. **Original work only.** All code in this project is written fresh
   for this hackathon. Do not access, read, clone or copy anything from
   any private repository; do not reuse private code, formulas or data.

## Decisions already made

- Category: Resurrection. The dead technology is the paper nomogram /
  slide rule; the resurrection is the interactive web nomogram.
- Single-page static app, vanilla HTML/CSS/JS, hand-drawn SVG chart.
- Presets are generic onshore reference turbines (2 / 4 / 6 MW), not
  any manufacturer's data.
- Kiro is the development environment for this project (IDE,
  spec-driven development: requirements, design and tasks in `.kiro/`).
- The `/.kiro` directory is part of the public repository by design and
  must never be excluded by a `.gitignore`.

## Open questions (for the entrant, not the prototype)

- Demo video script: which three slider moves best show the
  frequency/mass trade-off in under 3 minutes?
- Whether to add a 1P/3P resonance hint in a later version — only if it
  can be done without implying a design check.
