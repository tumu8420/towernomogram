# TowerNomogram — Resurrecting the Paper Nomogram

**Kiroween 2026 · Resurrection category · Author: Chengwan Wu**

Before spreadsheets and FEA, engineers sized structures with paper nomograms
and slide rules: align two known values on printed scales, read the answer
off a third. They were fast, visual, and wrong in an honest, bounded way —
but they died out because they could not be updated, shared, or checked.

TowerNomogram brings the nomogram back as an interactive web app for onshore
wind-turbine towers. Move a slider, and the tower mass, first natural
frequency, tip deflection, slenderness ratio and the nomogram chart update
live. It is built with Kiro (IDE, spec-driven development).

> **⚠ Safety disclaimer — read first.**
> TowerNomogram is a **simplified educational / preliminary-exploration tool
> only**. It is **NOT** for actual structural design, certification, or
> construction decisions. All results are rough estimates from a simplified
> model and **must be verified with proper engineering analysis by a
> qualified engineer** before any real-world use.

## How to run it

No build step, no backend, no external dependencies.

1. Clone or download this repository.
2. Open `index.html` in any modern browser (double-click it, or serve the
   folder with any static server, e.g. `python3 -m http.server`).
3. Adjust the inputs, try the 2 MW / 4 MW / 6 MW presets, add snapshots to
   the comparison table, and export them as CSV.

To publish it as a static site (for example GitHub Pages), publish the
repository root — `index.html`, `styles.css` and `app.js` are all that the
site needs.

## What it does

Inputs (sliders + numeric fields):

| Input | Range | Default (4 MW) |
|---|---|---|
| Hub height | 60–160 m | 100 m |
| Rotor diameter | 80–180 m | 130 m |
| Rated power | 2–8 MW | 4 MW |
| Tower-top mass (nacelle + rotor) | 80–400 t | 200 t |
| Base diameter | 3–7 m | 5.0 m |
| Wall thickness at base | 10–80 mm | 30 mm |
| Steel grade | S355 / S420 / S460 | S355 |
| Wind class (IEC) | I / II / III | II |

Outputs (simplified educational estimates):

- **Tower mass** (t)
- **First natural frequency** (Hz) — simplified cantilever-beam model
- **Tip deflection at rated / operating wind** (m)
- **Slenderness ratio** (H / D<sub>base</sub>)
- Supplementary: rotor swept area, steady thrust, base bending moment,
  base bending stress, stress utilisation, operating wind speed
- **Interactive SVG nomogram**: first natural frequency and tower mass
  versus hub height, for three base diameters around the current one, with
  the current tower marked. A shaded 0.20–0.35 Hz band shows a typical
  soft-soft frequency window (illustrative only, not a design criterion).
- **Compare table + CSV export**: snapshot up to 8 towers and export them.
- **Midnight theme**: a dark theme toggle. In midnight mode the nomogram
  lines carry a subtle Halloween glow; the default light theme stays
  readable and professional.

Presets (onshore reference turbines):

| Preset | Hub | Rotor | Power | Top mass | Base Ø | Wall | Grade | Wind |
|---|---|---|---|---|---|---|---|---|
| 2 MW | 80 m | 110 m | 2 MW | 130 t | 4.2 m | 22 mm | S355 | II |
| 4 MW | 100 m | 130 m | 4 MW | 200 t | 5.0 m | 30 mm | S355 | II |
| 6 MW | 120 m | 150 m | 6 MW | 280 t | 5.8 m | 38 mm | S420 | II |

## How the calculation works

All formulas are also documented as comments at the top of `app.js`.
Constants: steel density 7850 kg/m³, steel modulus E = 210 GPa,
air density 1.225 kg/m³, thrust coefficient C<sub>t</sub> = 0.8.

**Geometry.** The tower is a tapered circular steel tube. Top diameter is
assumed `D_top = 0.55 × D_base`; top wall thickness is assumed
`t_top = 0.70 × t_base`; both vary linearly with height.

**Tower mass.** Thin-walled shell, `A = π × D_avg × t_avg`,
`M_shell = 7850 × A × H`, then `M_tower = 1.08 × M_shell`. The 1.08 factor
is a flat allowance for flanges and internals.

**Second moment of area.** Hollow circle,
`I(D, t) = (π/64) × (D⁴ − (D − 2t)⁴)`. `I_base` uses the base section;
`I_eff` is evaluated at one-third height from the base, where diameter and
thickness are linearly interpolated.

**First natural frequency.**
`k_eq = 3 × E × I_eff / H³`,
`m_eq = M_top + 0.24 × M_tower` (Rayleigh effective mass for the first
cantilever mode),
`f₁ = (1/2π) × √(k_eq / m_eq)`.

**Tip deflection.** Wind class sets V<sub>ref</sub> (I 50.0, II 42.5,
III 37.5 m/s). A characteristic operating wind speed is used as a
transparent educational proxy: `V_op = 0.28 × V_ref` (≈10–14 m/s).
`T = ½ × ρ × A_rotor × C_t × V_op²`, then
`δ = T × H³ / (3 × E × I_eff)`.

**Slenderness.** `λ = H / D_base`.

**Base bending stress (supplementary).** `M_base = T × H`,
`σ = M_base × (D_base/2) / I_base`,
utilisation `= σ / (f_y / 1.1)`, with f<sub>y</sub> = 355 / 420 / 460 MPa
for S355 / S420 / S460.

### Worked check (4 MW preset)

H = 100 m, D<sub>base</sub> = 5.0 m, t = 30 mm, top mass 200 t, Class II:
tower mass ≈ 263 t, f₁ ≈ 0.22 Hz, tip deflection ≈ 1.8 m,
slenderness 20.0. These are the values the app shows for the 4 MW preset
(rounded for display); they are order-of-magnitude plausible for a 100 m
onshore tower, which is the point of the tool — a sanity check, not a
design value.

## Calculation assumptions — read these before trusting any number

1. Constant steel properties (E = 210 GPa, ρ = 7850 kg/m³) for all grades;
   grade changes only the yield strength used in the utilisation check.
2. Linear taper in diameter and thickness; no stepped cans, no door
   openings, no local reinforcement.
3. Thin-walled shell formula for mass; the 8% flange/internal allowance
   is a single flat factor, not a parts list.
4. Stiffness from a single section at one-third height — a simplification
   of the true tapered-beam stiffness integral. It underestimates a
   detailed tapered-beam / FEA result and is the largest single source
   of error in the frequency and deflection.
5. First mode only, as an undamped cantilever with a tip mass. No
   soil–structure interaction, no foundation flexibility, no damping,
   no rotor dynamics, no 1P/3P resonance check, no aeroelastic effects.
6. Tip deflection is a steady, first-order thrust deflection at one
   operating wind speed. No gust factor, no dynamic amplification, no
   extreme or fatigue load cases, no load partial factors.
7. Thrust coefficient is held constant at 0.8; in reality it varies
   with wind speed, pitch and rotor control.
8. Stress is a static bending stress at the base only. No buckling
   (global or local shell), no fatigue, no weld detail, no transport
   or erection loads, no code load combinations.
9. Inputs are clamped to the ranges in the table above. Outside those
   ranges the model has not been checked at all.
10. All outputs are rounded for display; the underlying values are
    double-precision JavaScript numbers, which does not make them
    accurate — it only makes them reproducible.

## Project layout

```
index.html          — page structure, inputs, outputs, disclaimer
styles.css          — light default theme + midnight theme
app.js              — state, calculation, SVG nomogram, compare/CSV, theme
README.md           — this file
LICENSE             — MIT License
.kiro/
  specs/tower-nomogram/
    requirements.md — what the app must do
    design.md       — architecture and calculation design
    tasks.md        — implementation task list
  steering/
    product.md      — product intent and boundaries
```

The `/.kiro` directory is part of the repository by design (spec-driven
development). It is intentionally **not** excluded by any `.gitignore`.

## License

MIT License — see `LICENSE`. Copyright (c) 2026 Chengwan Wu.
