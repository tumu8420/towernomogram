/* TowerNomogram — app.js
 * Author: Chengwan Wu.
 * Single-page static app. Vanilla JavaScript, no dependencies.
 *
 * CALCULATION MODEL — simplified educational estimates ONLY.
 * This model is written from first principles (textbook cantilever-beam
 * theory) for this project. It is NOT a design, certification or
 * construction model. See README.md for the full assumption list.
 *
 * Geometry
 * --------
 * - The tower is a tapered circular steel tube, hub height H.
 * - Base diameter D_base is an input. Top diameter is assumed
 *   D_top = 0.55 * D_base (a typical onshore taper; see README).
 * - Wall thickness at the base t_base is an input. Top thickness is
 *   assumed t_top = 0.70 * t_base. Both vary linearly with height.
 * - Average diameter D_avg = (D_base + D_top) / 2.
 * - Average thickness t_avg = (t_base + t_top) / 2.
 *
 * Tower mass
 * ----------
 * Thin-walled circular shell, area A = pi * D_avg * t_avg.
 *   V_shell = A * H
 *   M_shell = rho_steel * V_shell, rho_steel = 7850 kg/m^3
 *   M_tower = 1.08 * M_shell
 * The 1.08 factor is a flat allowance for flanges and internals.
 *
 * Second moment of area (hollow circle)
 * --------------------------------------
 *   I(D, t) = (pi / 64) * (D^4 - (D - 2t)^4)
 * I_base uses (D_base, t_base). I_eff is evaluated at one-third height
 * from the base, where D and t are linearly interpolated. Using the
 * one-third-height section (rather than the average section) gives a
 * stiffness closer to that of a tapered cantilever; it still
 * underestimates a detailed tapered-beam / FEA result and is
 * documented as an approximation in the README.
 *
 * First natural frequency (cantilever, first bending mode)
 * --------------------------------------------------------
 *   k_eq  = 3 * E * I_eff / H^3        (tip stiffness of a cantilever)
 *   m_eq  = M_top + 0.24 * M_tower     (Rayleigh effective mass: the tip
 *                                        mass plus ~24% of the distributed
 *                                        tower mass for the first mode)
 *   f1    = (1 / 2*pi) * sqrt(k_eq / m_eq),  E = 210 GPa.
 *
 * Tip deflection (steady thrust, rated / operating wind)
 * ------------------------------------------------------
 * Wind class sets a reference speed Vref (IEC: I 50.0, II 42.5,
 * III 37.5 m/s). A characteristic operating wind speed is used as a
 * transparent educational proxy: V_op = 0.28 * Vref (about 10-14 m/s).
 * This is NOT a code load case.
 *   A_rotor = pi * D_rotor^2 / 4
 *   T       = 0.5 * rho_air * A_rotor * Ct * V_op^2,
 *             rho_air = 1.225 kg/m^3, Ct = 0.8 (constant, at rated wind)
 *   delta   = T * H^3 / (3 * E * I_eff)
 * No dynamics, damping, gust factor or aeroelastic effects are included.
 *
 * Slenderness ratio
 * -----------------
 *   lambda = H / D_base
 *
 * Base bending stress (supplementary, simplified)
 * -----------------------------------------------
 *   M_base = T * H
 *   sigma  = M_base * (D_base / 2) / I_base
 *   utilisation = sigma / (fy / 1.1), fy from the steel grade.
 * This is a static, first-order stress only. It ignores buckling,
 * fatigue, local shell buckling, dynamics and all code load cases.
 */
'use strict';

var RHO_STEEL = 7850;      // kg/m^3
var E_STEEL = 210e9;       // Pa
var RHO_AIR = 1.225;       // kg/m^3
var CT = 0.8;              // thrust coefficient at rated wind (constant)
var FLANGE_ALLOWANCE = 1.08;
var TOP_DIA_RATIO = 0.55;  // D_top = 0.55 * D_base
var TOP_THICK_RATIO = 0.70;// t_top = 0.70 * t_base
var MODAL_MASS_FACTOR = 0.24;
var GAMMA_M = 1.1;         // partial factor used only in the utilisation check

var FY = { S355: 355e6, S420: 420e6, S460: 460e6 }; // Pa
var VREF = { I: 50.0, II: 42.5, III: 37.5 };       // m/s

var PRESETS = {
  '2mw': { label: '2 MW', hubHeight: 80, rotorDiameter: 110, ratedPower: 2, topMass: 130, baseDiameter: 4.2, wallThickness: 22, steelGrade: 'S355', windClass: 'II' },
  '4mw': { label: '4 MW', hubHeight: 100, rotorDiameter: 130, ratedPower: 4, topMass: 200, baseDiameter: 5.0, wallThickness: 30, steelGrade: 'S355', windClass: 'II' },
  '6mw': { label: '6 MW', hubHeight: 120, rotorDiameter: 150, ratedPower: 6, topMass: 280, baseDiameter: 5.8, wallThickness: 38, steelGrade: 'S420', windClass: 'II' }
};

var state = {
  hubHeight: 100, rotorDiameter: 130, ratedPower: 4, topMass: 200,
  baseDiameter: 5.0, wallThickness: 30, steelGrade: 'S355', windClass: 'II'
};

var comparison = [];

/* ---------- geometry / section helpers ---------- */

function sectionI(diameter, thickness) {
  var inner = diameter - 2 * thickness;
  if (inner <= 0) { return 0; }
  return (Math.PI / 64) * (Math.pow(diameter, 4) - Math.pow(inner, 4));
}

function taperedValue(baseValue, topValue, fractionFromBase) {
  return baseValue + (topValue - baseValue) * fractionFromBase;
}

/* ---------- core calculation (pure function of inputs) ---------- */

function calculate(inputs) {
  var H = inputs.hubHeight;
  var Dbase = inputs.baseDiameter;
  var tBase = inputs.wallThickness / 1000; // mm -> m
  var Dtop = TOP_DIA_RATIO * Dbase;
  var tTop = TOP_THICK_RATIO * tBase;
  var Davg = (Dbase + Dtop) / 2;
  var tAvg = (tBase + tTop) / 2;

  // Tower mass.
  var areaAvg = Math.PI * Davg * tAvg;
  var massShellKg = RHO_STEEL * areaAvg * H;
  var massKg = FLANGE_ALLOWANCE * massShellKg;
  var massT = massKg / 1000;

  // Stiffness: I at one-third height from the base.
  var D13 = taperedValue(Dbase, Dtop, 1 / 3);
  var t13 = taperedValue(tBase, tTop, 1 / 3);
  var Ieff = sectionI(D13, t13);
  var Ibase = sectionI(Dbase, tBase);
  var EI = E_STEEL * Ieff;

  // First natural frequency.
  var kEq = 3 * EI / Math.pow(H, 3);
  var mEq = inputs.topMass * 1000 + MODAL_MASS_FACTOR * massKg;
  var freqHz = (1 / (2 * Math.PI)) * Math.sqrt(kEq / mEq);

  // Wind / thrust / deflection.
  var vRef = VREF[inputs.windClass];
  var vOp = 0.28 * vRef;
  var areaRotor = Math.PI * Math.pow(inputs.rotorDiameter, 2) / 4;
  var thrustN = 0.5 * RHO_AIR * areaRotor * CT * vOp * vOp;
  var deflectionM = thrustN * Math.pow(H, 3) / (3 * EI);
  var momentNm = thrustN * H;
  var stressPa = Ibase > 0 ? momentNm * (Dbase / 2) / Ibase : 0;
  var fy = FY[inputs.steelGrade] || FY.S355;
  var utilisation = stressPa / (fy / GAMMA_M);

  return {
    massT: massT,
    freqHz: freqHz,
    deflectionM: deflectionM,
    slenderness: H / Dbase,
    areaRotor: areaRotor,
    thrustKN: thrustN / 1000,
    momentMNm: momentNm / 1e6,
    stressMPa: stressPa / 1e6,
    utilisation: utilisation,
    vOp: vOp,
    vRef: vRef,
    Dtop: Dtop,
    Ieff: Ieff
  };
}

/* ---------- formatting ---------- */

function fmt(value, decimals) {
  if (!isFinite(value)) { return '—'; }
  return value.toFixed(decimals);
}

function $(id) { return document.getElementById(id); }

/* ---------- rendering: outputs ---------- */

function renderOutputs(result) {
  $('outMass').textContent = fmt(result.massT, 0);
  $('outFreq').textContent = fmt(result.freqHz, 3);
  $('outDefl').textContent = fmt(result.deflectionM, 2);
  $('outSlender').textContent = fmt(result.slenderness, 1);
  $('outArea').textContent = fmt(result.areaRotor, 0) + ' m²';
  $('outThrust').textContent = fmt(result.thrustKN, 0) + ' kN';
  $('outMoment').textContent = fmt(result.momentMNm, 1) + ' MN·m';
  $('outStress').textContent = fmt(result.stressMPa, 0) + ' MPa';
  $('outUtil').textContent = fmt(result.utilisation * 100, 0) + ' %';
  $('outWind').textContent = fmt(result.vOp, 1) + ' m/s (Vref ' + fmt(result.vRef, 1) + ' m/s)';
}

/* ---------- rendering: SVG nomogram ---------- */

function renderNomogram(result) {
  var svg = $('nomogram');
  var W = 760, Hh = 420;
  var padL = 58, padR = 58, padT = 24, padB = 44;
  var plotW = W - padL - padR;
  var plotH = Hh - padT - padB;
  var hMin = 60, hMax = 160;
  var fMax = 0.6;   // Hz, left axis
  var mMax = 600;   // tonnes, right axis

  function x(h) { return padL + ((h - hMin) / (hMax - hMin)) * plotW; }
  function yF(f) { return padT + plotH - (f / fMax) * plotH; }
  function yM(m) { return padT + plotH - (m / mMax) * plotH; }

  var diameters = [];
  [-1, 0, 1].forEach(function (d) {
    var v = Math.round((state.baseDiameter + d) * 10) / 10;
    if (v >= 3 && v <= 7 && diameters.indexOf(v) === -1) { diameters.push(v); }
  });
  diameters.sort(function (a, b) { return a - b; });

  var colours = { freq: ['#0b5e7a', '#c2571b', '#5b4a9e'], mass: '#8a6d00' };
  var parts = [];
  parts.push('<rect x="0" y="0" width="' + W + '" height="' + Hh + '" fill="none"/>');

  // Soft-soft illustrative band, 0.20–0.35 Hz.
  parts.push('<rect class="band" x="' + padL + '" y="' + yF(0.35) + '" width="' + plotW + '" height="' + (yF(0.20) - yF(0.35)) + '" fill="#1d7a4f" fill-opacity="0.10"/>');
  parts.push('<text x="' + (padL + 6) + '" y="' + (yF(0.35) + 14) + '" font-size="11" fill="#1d7a4f">typical soft-soft window 0.20–0.35 Hz (illustrative)</text>');

  // Gridlines and axes.
  [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6].forEach(function (f) {
    parts.push('<line x1="' + padL + '" y1="' + yF(f) + '" x2="' + (padL + plotW) + '" y2="' + yF(f) + '" stroke="#d7dee6" stroke-width="1"/>');
    parts.push('<text x="' + (padL - 6) + '" y="' + (yF(f) + 4) + '" font-size="11" text-anchor="end" fill="#5a6b7d">' + f.toFixed(1) + '</text>');
  });
  [60, 80, 100, 120, 140, 160].forEach(function (h) {
    parts.push('<line x1="' + x(h) + '" y1="' + padT + '" x2="' + x(h) + '" y2="' + (padT + plotH) + '" stroke="#d7dee6" stroke-width="1"/>');
    parts.push('<text x="' + x(h) + '" y="' + (padT + plotH + 18) + '" font-size="11" text-anchor="middle" fill="#5a6b7d">' + h + '</text>');
  });
  parts.push('<text x="' + (padL + plotW / 2) + '" y="' + (Hh - 8) + '" font-size="12" text-anchor="middle" fill="#5a6b7d">Hub height (m)</text>');
  parts.push('<text x="16" y="' + (padT + plotH / 2) + '" font-size="12" text-anchor="middle" fill="#0b5e7a" transform="rotate(-90 16 ' + (padT + plotH / 2) + ')">First natural frequency (Hz)</text>');
  parts.push('<text x="' + (W - 14) + '" y="' + (padT + plotH / 2) + '" font-size="12" text-anchor="middle" fill="#8a6d00" transform="rotate(90 ' + (W - 14) + ' ' + (padT + plotH / 2) + ')">Tower mass (t)</text>');

  // Frequency curves for the three diameters, mass curve for the current diameter.
  diameters.forEach(function (D, i) {
    var pts = [];
    for (var h = hMin; h <= hMax; h += 5) {
      var trial = Object.assign({}, state, { hubHeight: h, baseDiameter: D });
      var r = calculate(trial);
      pts.push(x(h).toFixed(1) + ',' + yF(Math.min(r.freqHz, fMax)).toFixed(1));
    }
    var isCurrent = Math.abs(D - state.baseDiameter) < 0.001;
    parts.push('<polyline class="nomogram-line" points="' + pts.join(' ') + '" fill="none" stroke="' + colours.freq[i % colours.freq.length] + '" stroke-width="' + (isCurrent ? 3.5 : 2) + '" stroke-linejoin="round"/>');
  });
  var massPts = [];
  for (var hm = hMin; hm <= hMax; hm += 5) {
    var rm = calculate(Object.assign({}, state, { hubHeight: hm }));
    massPts.push(x(hm).toFixed(1) + ',' + yM(Math.min(rm.massT, mMax)).toFixed(1));
  }
  parts.push('<polyline class="nomogram-line" points="' + massPts.join(' ') + '" fill="none" stroke="' + colours.mass + '" stroke-width="2" stroke-dasharray="6 4"/>');

  // Current operating point.
  var cx = x(state.hubHeight), cy = yF(Math.min(result.freqHz, fMax));
  parts.push('<line x1="' + cx + '" y1="' + padT + '" x2="' + cx + '" y2="' + (padT + plotH) + '" stroke="#c2571b" stroke-width="1" stroke-dasharray="3 3"/>');
  parts.push('<circle class="nomogram-line" cx="' + cx + '" cy="' + cy + '" r="7" fill="#c2571b" stroke="#ffffff" stroke-width="2"/>');
  parts.push('<text x="' + Math.min(cx + 12, W - 180) + '" y="' + Math.max(cy - 10, padT + 12) + '" font-size="12" font-weight="700" fill="#c2571b">Current: ' + fmt(result.freqHz, 3) + ' Hz, ' + fmt(result.massT, 0) + ' t</text>');

  svg.innerHTML = parts.join('');

  // Legend + curve table.
  var legend = diameters.map(function (D, i) {
    return '— D = ' + D.toFixed(1) + ' m (' + colours.freq[i % colours.freq.length] + ')';
  }).join(' &nbsp; ') + ' &nbsp; - - Tower mass, current D (t, right axis)';
  $('chartLegend').innerHTML = legend;

  var tbody = document.querySelector('#curveTable tbody');
  var rows = diameters.map(function (D) {
    var r = calculate(Object.assign({}, state, { baseDiameter: D }));
    return '<tr><td>' + D.toFixed(1) + '</td><td>' + fmt(r.freqHz, 3) + '</td><td>' + fmt(r.massT, 0) + '</td></tr>';
  }).join('');
  tbody.innerHTML = rows;
}

/* ---------- rendering: comparison table + CSV ---------- */

function renderComparison() {
  var tbody = document.querySelector('#compareTable tbody');
  if (comparison.length === 0) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="14">No snapshots yet. Adjust the inputs and press &ldquo;Add current tower to comparison&rdquo;.</td></tr>';
    return;
  }
  tbody.innerHTML = comparison.map(function (row, i) {
    var cells = [i + 1, row.label, row.hubHeight, row.rotorDiameter, row.ratedPower,
      row.topMass, row.baseDiameter.toFixed(1), row.wallThickness, row.steelGrade,
      row.windClass, row.massT.toFixed(0), row.freqHz.toFixed(3),
      row.deflectionM.toFixed(2), row.slenderness.toFixed(1)];
    return '<tr>' + cells.map(function (c) { return '<td>' + c + '</td>'; }).join('') + '</tr>';
  }).join('');
}

function csvCell(value) {
  var s = String(value);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

function exportCsv() {
  var header = ['#', 'Label', 'Hub height (m)', 'Rotor diameter (m)', 'Rated power (MW)',
    'Top mass (t)', 'Base diameter (m)', 'Wall thickness (mm)', 'Steel grade', 'Wind class',
    'Tower mass (t)', 'First natural frequency (Hz)', 'Tip deflection (m)', 'Slenderness (H/D)'];
  var lines = [header.map(csvCell).join(',')];
  comparison.forEach(function (row, i) {
    lines.push([i + 1, row.label, row.hubHeight, row.rotorDiameter, row.ratedPower,
      row.topMass, row.baseDiameter, row.wallThickness, row.steelGrade, row.windClass,
      row.massT.toFixed(1), row.freqHz.toFixed(3), row.deflectionM.toFixed(2),
      row.slenderness.toFixed(1)].map(csvCell).join(','));
  });
  var blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'towernomogram-comparison.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
}

/* ---------- inputs, presets, theme ---------- */

function readInputsFromDom() {
  document.querySelectorAll('[data-field]').forEach(function (el) {
    var field = el.getAttribute('data-field');
    if (el.tagName === 'SELECT') { state[field] = el.value; }
    else { state[field] = parseFloat(el.value); }
  });
  document.querySelectorAll('[data-number]').forEach(function (el) {
    var field = el.getAttribute('data-number');
    el.value = state[field];
  });
}

function syncDomFromState() {
  document.querySelectorAll('[data-field]').forEach(function (el) {
    var field = el.getAttribute('data-field');
    el.value = state[field];
  });
  document.querySelectorAll('[data-number]').forEach(function (el) {
    var field = el.getAttribute('data-number');
    el.value = state[field];
  });
}

function applyPreset(key) {
  var preset = PRESETS[key];
  if (!preset) { return; }
  Object.keys(preset).forEach(function (k) {
    if (k !== 'label') { state[k] = preset[k]; }
  });
  syncDomFromState();
  update();
}

function update() {
  readInputsFromDom();
  // Clamp numeric inputs to their slider ranges so a typed value cannot
  // silently leave the model's valid envelope.
  var limits = {
    hubHeight: [60, 160], rotorDiameter: [80, 180], ratedPower: [2, 8],
    topMass: [80, 400], baseDiameter: [3, 7], wallThickness: [10, 80]
  };
  Object.keys(limits).forEach(function (k) {
    if (isFinite(state[k])) {
      state[k] = Math.min(limits[k][1], Math.max(limits[k][0], state[k]));
    }
  });
  var result = calculate(state);
  renderOutputs(result);
  renderNomogram(result);
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  var btn = $('themeToggle');
  var isMidnight = theme === 'midnight';
  btn.setAttribute('aria-pressed', String(isMidnight));
  btn.innerHTML = isMidnight ? '&#127765; Light theme' : '&#127769; Midnight theme';
  try { localStorage.setItem('towernomogram-theme', theme); } catch (e) { /* storage unavailable; theme still applies for this visit */ }
}

function init() {
  // Theme: honour a saved choice, otherwise light (readable default).
  var savedTheme = 'light';
  try { savedTheme = localStorage.getItem('towernomogram-theme') || 'light'; } catch (e) { /* ignore */ }
  if (savedTheme !== 'midnight') { savedTheme = 'light'; }
  setTheme(savedTheme);
  $('themeToggle').addEventListener('click', function () {
    var next = document.documentElement.getAttribute('data-theme') === 'midnight' ? 'light' : 'midnight';
    setTheme(next);
  });

  // Sliders and numeric inputs stay in sync and re-run the calculation.
  document.querySelectorAll('[data-field]').forEach(function (el) {
    el.addEventListener('input', function () { syncDomFromState(); update(); });
    el.addEventListener('change', function () { syncDomFromState(); update(); });
  });
  document.querySelectorAll('[data-number]').forEach(function (el) {
    el.addEventListener('change', function () {
      var field = el.getAttribute('data-number');
      state[field] = parseFloat(el.value);
      syncDomFromState();
      update();
    });
  });

  // Presets.
  document.querySelectorAll('.preset[data-preset]').forEach(function (btn) {
    btn.addEventListener('click', function () { applyPreset(btn.getAttribute('data-preset')); });
  });
  $('resetBtn').addEventListener('click', function () { applyPreset('4mw'); });

  // Comparison.
  $('addCompareBtn').addEventListener('click', function () {
    var result = calculate(state);
    if (comparison.length >= 8) { comparison.shift(); }
    comparison.push(Object.assign({ label: 'Tower ' + (comparison.length + 1) }, state, result));
    renderComparison();
  });
  $('exportCsvBtn').addEventListener('click', function () {
    if (comparison.length === 0) {
      // Export the current tower on its own so the button is never a dead end.
      var result = calculate(state);
      comparison.push(Object.assign({ label: 'Tower 1 (current)' }, state, result));
      renderComparison();
    }
    exportCsv();
  });
  $('clearCompareBtn').addEventListener('click', function () {
    comparison = [];
    renderComparison();
  });

  renderComparison();
  update();
}

// Expose the pure calculation for testing / reuse in the console.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { calculate: calculate, PRESETS: PRESETS };
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', init);
}
