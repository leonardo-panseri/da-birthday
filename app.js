/* L'Odissea di Da
 * Everything on screen is a pure function of the timeline position `t` (seconds),
 * so the scrubber can jump anywhere. Wall-clock time only drives wobble and puffs.
 * Faces are blobatars (https://blobatar.dev, v2.7.0 vendored in /vendor/blobatar).
 */
(() => {
  'use strict';

  // Loaded by vendor/blobatar/blobatar.global.js (a plain script, so the page
  // also works when index.html is opened straight from disk).
  const { _parts } = window.Blobatar.internal;
  const EXPR = window.Blobatar.expression;

  // ---------------------------------------------------------------------------
  // Things you might want to edit
  // ---------------------------------------------------------------------------
  const CONFIG = {
    from: 'Leo',
    // Each face is a blobatar: `seed` picks the shape (any string works, same
    // string = same creature), `palette` pins the riso colours.
    people: {
      da:     { seed: 'Davide',      palette: { head: '#FFE800', eye: '#3D5588' } },
      family: { seed: 'Famiglia',    palette: { head: '#0078BF', eye: '#FFFDF6' } },
      birgit: { seed: 'birgit.wien', palette: { head: '#FF48B0', eye: '#3D5588' } },
      edo:    { seed: 'Edo',         palette: { head: '#00A95C', eye: '#FFFDF6' } },
    },
    // Road distances used by the odometer.
    km: { bus: 365, airport: 80, bergamo: 55 },
  };

  const END = 100;
  // Timeline seconds per real second. Lower = slower; 0.55 makes the whole story about 3 min.
  const PLAYBACK_SPEED = 0.55;

  // One text on screen at a time. Each chapter starts at `t` (timeline ticks and
  // the date stamp follow it) and shows its caption card during `cap`, next to the
  // vehicle named in `near`. Speech bubbles get their own slots between captions.
  const GIO = 'giovedì 5 nov', VEN = 'venerdì 6 nov', SAB = 'sabato 7 nov';
  const CHAPTERS = [
    { t: 0, cap: [2.8, 5.7], near: 'bus', day: GIO, part: 'pomeriggio', title: 'Nizza',
      text: 'Da sale sul bus con uno zaino e una quantità sospetta di snack.' },
    { t: 7.2, cap: [7.4, 10.4], near: 'bus', day: GIO, part: 'pomeriggio', title: 'Monaco, a passo di bus',
      text: 'Si sfila davanti agli yacht. Nessuno lo invita a bordo. Peggio per loro.' },
    { t: 10.5, cap: [10.6, 13.1], near: 'bus', day: GIO, part: 'pomeriggio', title: 'Ventimiglia',
      text: 'Bentornato in Italia, dove il croissant torna a chiamarsi cornetto.' },
    { t: 14.6, cap: [14.7, 17.6], near: 'bus', day: GIO, part: 'pomeriggio', title: 'Genova',
      text: 'Ciao mare: il bus si arrampica sugli Appennini, un tornante alla volta.' },
    { t: 19.1, cap: [19.2, 22.7], near: 'bus', day: GIO, part: 'pomeriggio', title: 'Pianura Padana',
      text: "All'Autogrill Da indaga ogni panino come un detective. Verdetto vegetariano: pizzetta." },
    { t: 22.8, cap: [22.9, 26.0], near: 'bus', day: GIO, part: 'tardo pomeriggio', title: 'Tangenziale di Milano',
      text: "Tre chilometri in quaranta minuti. Da compone un'opera lirica sul traffico." },
    { t: 28.8, cap: [31.2, 34.7], near: 'sofa', day: GIO, part: 'sera', title: 'Mariano Comense',
      text: 'Casa! La famiglia ha cucinato per tutta la provincia di Como. Rigorosamente vegetariano.' },
    { t: 38.6, cap: [38.7, 42.3], near: 'sofa', day: VEN, part: 'a casa', title: 'Smart working a Mariano',
      text: 'Da lavora per Southwind dal divano di casa. Il pallino su Discord resta verde anche durante il pisolino.' },
    { t: 45.3, cap: [45.4, 49.0], near: 'car', day: VEN, part: 'prima di cena', title: 'Missione Malpensa',
      text: 'Prima di cena Birgit atterra da Vienna. Il taxi di famiglia scalda il motore.' },
    { t: 50.5, cap: [50.6, 53.4], near: 'car', day: VEN, part: 'prima di cena', title: 'Gara verso Malpensa',
      text: "Auto contro aereo. Nessuno ha detto all'aereo che era una gara." },
    { t: 55.8, cap: [58.7, 61.8], near: 'car', day: VEN, part: 'prima di cena', title: 'Birgit è atterrata',
      text: 'Da fa il disinvolto. Ha controllato il volo ogni quattro minuti da pranzo.' },
    { t: 61.9, cap: [62.0, 65.2], near: 'car', day: VEN, part: 'ora di cena', title: 'Di corsa a casa',
      text: 'La cena è in tavola e in famiglia non si aspetta nessuno. Nemmeno chi arriva da Vienna.' },
    { t: 67.3, cap: [67.5, 70.9], near: 'table', day: VEN, part: 'cena', title: 'Tutti a tavola',
      text: "Cena tutti insieme. Da racconta l'odissea in bus per la terza volta, sempre più epica." },
    { t: 76.8, cap: [77.0, 80.2], near: 'table', day: SAB, part: '27 anni!', title: 'Buon compleanno!',
      text: 'Da si sveglia con 27 anni. Nella notte gli è comparso un cappellino da festa.' },
    { t: 83.1, cap: [83.2, 86.0], near: 'bus2', day: SAB, part: '27 anni!', title: 'Destinazione Bergamo',
      text: 'Il festeggiato e Birgit prendono il bus. Prossima fermata: Bergamo.' },
    { t: 86.1, cap: [86.2, 91.5], near: 'scooter', day: SAB, part: '27 anni!', title: 'Intanto, in Val Seriana',
      text: "Il CEO scende da Fiobbio in scooter. Lo chiama «offsite strategico», lo mette in nota spese e ha già pronta una slide sul compleanno di Da." },
    { t: 93.0, cap: [93.1, 96.5], near: 'bus2', day: SAB, part: '27 anni!', title: 'Bergamo',
      text: 'Tutti insieme per il grande giorno. Qualcuno nomina la polenta entro trenta secondi.' },
  ];

  // [from, to, who, text]
  const BUBBLES = [
    [5.9, 7.1, 'da', 'Au revoir, Nizza!'],
    [13.3, 14.5, 'da', 'Buongiorno, Italia!'],
    [17.8, 19.0, 'da', 'Quanti tornanti…'],
    [26.2, 27.4, 'da', 'Dai, muoviti…'],
    [29.0, 30.2, 'da', 'Sono a casa!'],
    [42.5, 43.9, 'family', 'Mangia, che sei sciupato!'],
    [49.2, 50.4, 'family', 'Andiamo!'],
    [55.9, 57.1, 'birgit', 'Servus!'],
    [57.3, 58.5, 'da', 'Finalmente!'],
    [71.1, 72.3, 'family', "Ancora un po'?"],
    [72.5, 73.9, 'da', 'zzz…'],
    [80.4, 81.8, 'da', 'Chi mi ha messo questo cappello?'],
    [82.0, 83.0, 'family', 'Fate i bravi!'],
    [91.7, 92.9, 'edo', 'Arrivo, ho una call alle tre!'],
    [96.7, 97.9, 'edo', 'Auguri, Da!'],
    [98.1, 99.4, 'da', 'Grazie!'],
  ];

  // Blobatar expressions over time: [from, pose]. Poses come from blobatar/expression.
  const MOODS = {
    da: [[0, 'happy'], [7.4, 'smug'], [10.6, 'happy'], [14.7, 'idle'], [17.6, 'sick'], [19.2, 'thinking'],
      [22.9, 'mad'], [28.8, 'happy'], [35, 'sleepy'], [38.5, 'happy'], [39, 'smug'], [42.4, 'shy'],
      [44.4, 'idle'], [50.6, 'thinking'], [54.5, 'surprised'], [56, 'love'], [62, 'happy'], [72.3, 'sleepy'],
      [76.8, 'surprised'], [80.3, 'unsure'], [81.9, 'happy'], [84, 'love'], [87, 'idle'], [92.3, 'happy']],
    birgit: [[0, 'idle'], [50.6, 'smug'], [54.5, 'idle'], [55.8, 'happy'], [57.4, 'love'], [62, 'happy'],
      [67.5, 'love'], [71, 'happy'], [72.6, 'sleepy'], [76.8, 'happy'], [84, 'love'], [87, 'wink'],
      [89, 'idle'], [92.3, 'happy']],
    family: [[0, 'happy'], [35, 'sleepy'], [38.5, 'happy'], [42.4, 'smug'], [44, 'idle'], [49.2, 'mad'],
      [53, 'surprised'], [55.8, 'happy'], [59.9, 'idle'], [67.5, 'happy'], [71, 'love'], [72.6, 'sleepy'],
      [76.8, 'love'], [81.9, 'sad']],
    edo: [[0, 'idle'], [86.2, 'smug'], [91.6, 'happy'], [98, 'wink']],
  };

  // Moments that are not texts or moods.
  const T = {
    hat: 77.2,          // party hat appears on Da
    sleep: [72.3, 76],  // Da falls asleep at the dinner table
    reunion: 93.1,      // confetti in Bergamo
    planeGone: 58.4,    // contrail fades out
  };

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  const $ = (s) => document.querySelector(s);
  const NS = 'http://www.w3.org/2000/svg';
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, u) => a + (b - a) * u;
  const easeInOut = (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
  const easeOutBack = (u) => { const c = 1.9; return 1 + (c + 1) * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2); };
  const pw = (keys, t) => {
    if (t <= keys[0][0]) return keys[0][1];
    for (let i = 0; i < keys.length - 1; i++) {
      const [t0, v0] = keys[i], [t1, v1] = keys[i + 1];
      if (t <= t1) return lerp(v0, v1, (t - t0) / (t1 - t0));
    }
    return keys[keys.length - 1][1];
  };
  const svgEl = (tag, attrs = {}, parent) => {
    const el = document.createElementNS(NS, tag);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(el);
    return el;
  };
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // ---------------------------------------------------------------------------
  // Geography (equirectangular, stretched for latitude 45°)
  // ---------------------------------------------------------------------------
  const K = 300, LON0 = 5.8, LAT0 = 46.4, CX = Math.cos(Math.PI / 4);
  const proj = ([lat, lon]) => [(lon - LON0) * K * CX, (LAT0 - lat) * K];
  const ptsD = (pts, close) => 'M' + pts.map((p) => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join('L') + (close ? 'Z' : '');
  const llD = (lls, close) => ptsD(lls.map(proj), close);

  const PLACES = {
    nice: [43.7102, 7.262], mariano: [45.6977, 9.1813], malpensa: [45.6301, 8.7231],
    bergamo: [45.6983, 9.6773], fiobbio: [45.758, 9.826],
    monaco: [43.7384, 7.4246], ventimiglia: [43.791, 7.608], genova: [44.4056, 8.9463],
    milano: [45.4642, 9.19], como: [45.808, 9.085], torino: [45.0703, 7.6869], savona: [44.309, 8.477],
  };
  const P = Object.fromEntries(Object.entries(PLACES).map(([k, v]) => [k, proj(v)]));

  const COAST = [
    [43.2, 3.5], [43.2, 5.8], [43.1, 5.95], [43.04, 6.15], [43.12, 6.36], [43.18, 6.55], [43.26, 6.68],
    [43.33, 6.7], [43.42, 6.78], [43.5, 6.93], [43.55, 7.02], [43.57, 7.12], [43.66, 7.2], [43.69, 7.27],
    [43.7, 7.32], [43.73, 7.42], [43.77, 7.5], [43.79, 7.6], [43.81, 7.78], [43.88, 8.03], [43.97, 8.15],
    [44.05, 8.22], [44.17, 8.34], [44.3, 8.47], [44.36, 8.58], [44.41, 8.7], [44.43, 8.8], [44.4, 8.94],
    [44.38, 9.05], [44.34, 9.15], [44.3, 9.21], [44.33, 9.23], [44.27, 9.4], [44.17, 9.6], [44.1, 9.82],
    [44.06, 9.92], [43.95, 10.1], [43.87, 10.25], [43.7, 10.28], [43.55, 10.31], [43.4, 10.42],
    [43.25, 10.52], [43.05, 10.52], [42.92, 10.53], [42.6, 10.7], [41.5, 10.9],
  ];
  const SEA = [...COAST, [41.5, 3.5]];

  const LAKES = [
    { w: 9, pts: [[45.76, 8.56], [45.88, 8.56], [45.96, 8.57], [46.05, 8.69], [46.17, 8.8]] },             // Maggiore
    { w: 4, pts: [[45.9, 8.94], [45.96, 8.95], [45.99, 9.01], [46.02, 9.07], [45.99, 9.11]] },              // Lugano
    { w: 6, pts: [[45.81, 9.08], [45.88, 9.13], [45.98, 9.25], [46.07, 9.29], [46.15, 9.37]] },             // Como
    { w: 5, pts: [[45.98, 9.25], [45.92, 9.3], [45.85, 9.39]] },                                            // Lecco arm
    { w: 6, pts: [[45.66, 10.03], [45.75, 10.07], [45.83, 10.08], [45.88, 10.12]] },                        // Iseo
    { w: 12, pts: [[45.47, 10.6], [45.56, 10.63], [45.66, 10.68], [45.76, 10.76], [45.87, 10.84]] },       // Garda
  ];
  const RIVERS = [
    [[44.75, 7.15], [44.95, 7.55], [45.07, 7.7], [45.15, 8.0], [45.13, 8.45], [45.05, 8.8], [45.12, 9.2], [45.05, 9.7], [45.13, 10.02], [45.03, 10.4], [44.98, 10.7], [44.95, 11.4]],
    [[45.75, 8.6], [45.45, 8.8], [45.15, 9.15]],
    [[45.85, 9.4], [45.55, 9.48], [45.12, 9.88]],
  ];
  const BORDERS = [
    [[43.79, 7.53], [43.95, 7.55], [44.15, 7.55], [44.2, 7.25], [44.36, 6.95], [44.5, 6.88], [44.65, 7.05], [44.85, 6.75], [45.05, 6.65], [45.2, 7.05], [45.45, 7.05], [45.65, 6.85], [45.83, 6.85], [45.87, 7.05], [45.92, 7.45], [45.92, 7.87], [46.1, 8.1], [46.25, 8.1], [46.38, 8.45], [46.1, 8.65], [46.0, 8.78], [45.97, 8.88], [45.83, 9.03], [45.98, 9.15], [46.2, 9.25], [46.45, 9.3]],
    [[45.83, 6.85], [46.0, 6.95], [46.25, 6.8], [46.45, 6.85]],
    [[46.45, 9.6], [46.33, 9.95], [46.35, 10.15], [46.6, 10.45]],
  ];
  const MOUNTAINS = [
    [44.15, 7.2, 1], [44.25, 6.9, 1], [44.3, 7.5, 0.9], [44.45, 7.05, 1.1], [44.6, 6.95, 1], [44.7, 7.1, 1.4],
    [44.9, 6.9, 1.1], [45.1, 6.95, 1.1], [45.3, 7.0, 1.2], [45.45, 7.18, 1.1], [45.62, 7.0, 1.2], [45.83, 6.88, 1.7],
    [45.88, 7.25, 1.2], [45.95, 7.58, 1.3], [45.93, 7.87, 1.6], [46.12, 8.22, 1.2], [46.27, 8.42, 1.1],
    [46.3, 8.95, 1.1], [46.22, 9.6, 1.2], [46.32, 9.95, 1.3], [46.16, 10.22, 1.1], [46.33, 10.55, 1.3],
    [46.02, 10.4, 1], [46.15, 9.02, 0.9], [46.05, 9.62, 1], [45.96, 9.86, 1], [46.02, 10.08, 1],
    [46.3, 7.62, 1.2], [46.25, 7.2, 1.1], [46.36, 8.0, 1.2], [44.5, 6.4, 1.1], [44.9, 6.3, 1.2],
    [45.2, 6.5, 1.2], [45.42, 6.4, 1.1], [45.7, 6.5, 1.2], [46.1, 6.5, 1], [44.1, 6.6, 0.9], [43.95, 6.9, 0.8],
    [46.1, 9.5, 0.9], [45.9, 10.3, 0.9], [45.86, 9.6, 0.8],
  ];
  const HILLS = [
    [44.5, 8.8], [44.55, 9.2], [44.45, 9.5], [44.35, 9.8], [44.25, 10.1], [44.15, 10.4], [44.0, 10.6],
    [44.3, 8.25], [44.2, 7.95], [44.6, 9.6], [44.4, 10.3], [44.45, 8.45], [44.65, 9.05], [43.95, 7.7], [44.05, 7.95],
  ];
  const WAVES = [
    [43.55, 7.6], [43.6, 8.2], [43.75, 8.7], [43.5, 9.0], [44.05, 9.3], [43.85, 9.6], [43.3, 9.8], [43.4, 7.3],
    [43.1, 7.0], [43.2, 8.5], [43.0, 8.0], [43.6, 9.9], [42.85, 9.0],
  ];

  const ROUTE_LL = {
    bus: [
      [43.7102, 7.262], [43.735, 7.33], [43.755, 7.43], [43.788, 7.52], [43.803, 7.61], [43.835, 7.78],
      [43.905, 8.02], [44.04, 8.17], [44.19, 8.3], [44.33, 8.45], [44.41, 8.62], [44.46, 8.78],
      [44.46, 8.9], [44.56, 8.94], [44.72, 8.88], [44.89, 8.87], [45.12, 8.97], [45.3, 9.1],
      [45.44, 9.13], [45.52, 9.2], [45.62, 9.21], [45.6977, 9.1813],
    ],
    malpensa: [[45.6977, 9.1813], [45.685, 9.08], [45.66, 8.96], [45.645, 8.8]],
    bergamo: [[45.6977, 9.1813], [45.69, 9.3], [45.672, 9.42], [45.68, 9.55], [45.693, 9.645]],
    edo: [[45.758, 9.826], [45.762, 9.797], [45.745, 9.76], [45.732, 9.735], [45.72, 9.725]],
    plane: [[46.15, 10.7], [45.95, 10.1], [45.78, 9.5], [45.67, 8.95], [45.625, 8.69]],
  };
  ROUTE_LL.back = ROUTE_LL.malpensa.slice().reverse();
  ROUTE_LL.home = [[45.6977, 9.1813], [45.6977, 9.1816]]; // the sofa and the dinner table stay put

  const catmull = (p0, p1, p2, p3, u) => {
    const u2 = u * u, u3 = u2 * u;
    return [0, 1].map((k) => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * u + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * u2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * u3));
  };
  function buildRoute(lls, perSeg = 14) {
    const pts = lls.map(proj);
    const out = [], wp = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || pts[i + 1];
      wp[i] = out.length;
      for (let j = 0; j < perSeg; j++) out.push(catmull(p0, p1, p2, p3, j / perSeg));
    }
    wp[pts.length - 1] = out.length;
    out.push(pts[pts.length - 1]);
    const cum = [0];
    for (let i = 1; i < out.length; i++) cum[i] = cum[i - 1] + Math.hypot(out[i][0] - out[i - 1][0], out[i][1] - out[i - 1][1]);
    const L = cum[cum.length - 1];
    return { pts: out, cum, L, wpFrac: wp.map((k) => cum[k] / L) };
  }
  const ROUTES = Object.fromEntries(Object.entries(ROUTE_LL).map(([k, v]) => [k, buildRoute(v)]));

  // index of the last sample at or before distance d
  function seek(route, f) {
    const d = clamp(f) * route.L, cum = route.cum;
    let lo = 0, hi = cum.length - 1;
    while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (cum[mid] <= d) lo = mid; else hi = mid; }
    const seg = cum[hi] - cum[lo] || 1;
    return { i: lo, u: (d - cum[lo]) / seg };
  }
  function pointAt(route, f) {
    const { i, u } = seek(route, f);
    const a = route.pts[i], b = route.pts[Math.min(i + 1, route.pts.length - 1)];
    return [lerp(a[0], b[0], u), lerp(a[1], b[1], u)];
  }
  function partialD(route, f) {
    if (f <= 0) return '';
    const { i } = seek(route, f);
    return ptsD([...route.pts.slice(0, i + 1), pointAt(route, f)]);
  }

  // ---------------------------------------------------------------------------
  // Cast: vehicles with timed trips
  // ---------------------------------------------------------------------------
  const ACTORS = {
    bus: { kind: 'bus', show: [2.4, 31.2], trips: [
      { route: 'bus', keys: [[7.2, 0], [11.5, 'w4'], [17, 'w12'], [22.7, 'w18'], [26.4, 'w19'], [28.8, 1]] },
    ] },
    sofa: { kind: 'sofa', show: [29.8, 45.4], trips: [{ route: 'home', keys: [[0, 0], [1, 0]] }] },
    table: { kind: 'table', show: [65.8, 83.8], trips: [{ route: 'home', keys: [[0, 0], [1, 0]] }] },
    car: { kind: 'car', show: [44, 67.4], trips: [
      { route: 'malpensa', keys: [[49.2, 0], [54.7, 1]] },
      { route: 'back', keys: [[59.9, 0], [65.9, 1]] },
    ] },
    plane: { kind: 'plane', show: [48.7, 58.4], trips: [
      { route: 'plane', keys: [[48.7, 0], [55.7, 1]] },
    ] },
    scooter: { kind: 'scooter', show: [85.6, 999], trips: [
      { route: 'edo', keys: [[86.2, 0], [92.3, 1]] },
    ] },
    bus2: { kind: 'bus', show: [82.9, 999], trips: [
      { route: 'bergamo', keys: [[83.8, 0], [92.3, 1]] },
    ] },
  };
  for (const a of Object.values(ACTORS)) {
    for (const trip of a.trips) {
      const r = ROUTES[trip.route];
      trip.r = r;
      trip.keys = trip.keys.map(([t, v]) => [t, typeof v === 'string' ? r.wpFrac[+v.slice(1)] : v]);
      const s = r.pts[0], e = r.pts[r.pts.length - 1];
      trip.dir = Math.sign(e[0] - s[0]) || 1;
    }
  }

  function tripFrac(trip, t) {
    const ks = trip.keys, n = ks.length - 1;
    if (t <= ks[0][0]) return ks[0][1];
    if (t >= ks[n][0]) return ks[n][1];
    for (let i = 0; i < n; i++) {
      const [t0, v0] = ks[i], [t1, v1] = ks[i + 1];
      if (t <= t1) {
        let u = (t - t0) / (t1 - t0);
        if (n === 1) u = easeInOut(u);
        else if (i === 0) u = 1 - Math.cos((u * Math.PI) / 2);
        else if (i === n - 1) u = Math.sin((u * Math.PI) / 2);
        return lerp(v0, v1, u);
      }
    }
    return ks[n][1];
  }
  function currentTrip(a, t) {
    let trip = a.trips[0];
    for (const tr of a.trips) if (t >= tr.keys[0][0]) trip = tr;
    return trip;
  }
  function actorPos(a, t) {
    const trip = currentTrip(a, t);
    return pointAt(trip.r, tripFrac(trip, t));
  }

  // Vehicle drawings face right; origin is where the wheels touch the road.
  const WHEEL = (x, y, r) => `<g class="wh" data-x="${x}" data-y="${y}"><circle r="${r}" fill="#3D5588"/><circle r="${r * 0.42}" fill="#FFFDF6"/><rect x="-1.3" y="${-r + 1.5}" width="2.6" height="${2 * r - 3}" fill="#FFFDF6"/></g>`;
  const CAR_PATH = 'M-42,-14v-14q0,-6 6,-6h8l10,-14q2,-3 6,-3h26q4,0 6,3l10,14h6q6,0 6,6v14z';
  const VEH = {
    bus: {
      seats: [[33, -50], [4, -50]], headR: 17, exhaust: [-54, -14],
      svg: `
        <rect x="-52" y="-52" width="104" height="42" rx="10" fill="#3D5588" transform="translate(3 3)"/>
        <rect x="-52" y="-52" width="104" height="42" rx="10" fill="#FF48B0"/>
        <rect x="-52" y="-27" width="104" height="5" fill="#FFE800"/>
        <rect x="-44" y="-46" width="16" height="14" rx="3" fill="#FFFDF6"/>
        <rect x="-24" y="-46" width="16" height="14" rx="3" fill="#FFFDF6"/>
        <rect x="-4" y="-46" width="16" height="14" rx="3" fill="#FFFDF6"/>
        <rect x="18" y="-46" width="29" height="16" rx="4" fill="#0078BF"/>
        <rect x="-52" y="-52" width="104" height="42" rx="10" fill="none" stroke="#3D5588" stroke-width="2.2"/>
        <circle cx="49" cy="-18" r="3" fill="#FFE800" stroke="#3D5588" stroke-width="1.5"/>
        ${WHEEL(-30, -10, 9.5)}${WHEEL(30, -10, 9.5)}`,
    },
    car: {
      seats: [[16, -45], [-2, -56], [-20, -45]], headR: 13, exhaust: [-44, -14],
      svg: `
        <path d="${CAR_PATH}" fill="#3D5588" transform="translate(3 3)"/>
        <path d="${CAR_PATH}" fill="#00A95C"/>
        <path d="M-20,-34l8,-11h11v11z" fill="#FFFDF6"/>
        <path d="M3,-34v-11h12l8,11z" fill="#FFFDF6"/>
        <path d="${CAR_PATH}" fill="none" stroke="#3D5588" stroke-width="2.2" stroke-linejoin="round"/>
        <circle cx="39" cy="-24" r="3" fill="#FFE800" stroke="#3D5588" stroke-width="1.5"/>
        ${WHEEL(-24, -10, 8.5)}${WHEEL(24, -10, 8.5)}`,
    },
    plane: {
      seats: [[32, -36]], headR: 13,
      svg: `
        <path d="M-2,-28L-14,-42h8l16,-12z" fill="#0078BF" stroke="#3D5588" stroke-width="1.6" stroke-linejoin="round"/>
        <path d="M-54,-30L-62,-52h14l12,21z" fill="#FF48B0" stroke="#3D5588" stroke-width="2" stroke-linejoin="round"/>
        <path d="M-60,-21C-60,-29 -54,-32 -44,-32L36,-32C56,-32 66,-26 66,-21C66,-15 56,-10 36,-10L-44,-10C-54,-10 -60,-13 -60,-21Z" fill="#FFFDF6" stroke="#3D5588" stroke-width="2.2"/>
        <rect x="-52" y="-18" width="92" height="3" fill="#FF48B0"/>
        <g fill="#0078BF"><circle cx="-38" cy="-24" r="2.6"/><circle cx="-28" cy="-24" r="2.6"/><circle cx="-18" cy="-24" r="2.6"/><circle cx="-8" cy="-24" r="2.6"/><circle cx="2" cy="-24" r="2.6"/><circle cx="12" cy="-24" r="2.6"/></g>
        <path d="M50,-28q9,0 12,5h-12z" fill="#0078BF"/>
        <path d="M-6,-18L-26,6h14l28,-24z" fill="#0078BF" stroke="#3D5588" stroke-width="2" stroke-linejoin="round"/>`,
    },
    scooter: {
      seats: [[-12, -66]], headR: 15, exhaust: [-32, -12],
      svg: `
        <path d="M-8,-50L18,-44" stroke="#FFE800" stroke-width="6" stroke-linecap="round"/>
        <path d="M-30,-12q0,-18 18,-18h8v14h28l-4,-28h7l7,32q0,6 -6,6h-52q-6,0 -6,-6z" fill="#0078BF" stroke="#3D5588" stroke-width="2" stroke-linejoin="round"/>
        <path d="M17,-46l11,-4" stroke="#3D5588" stroke-width="3.5" stroke-linecap="round"/>
        <rect x="-27" y="-34" width="25" height="6" rx="3" fill="#3D5588"/>
        <rect x="-20" y="-58" width="16" height="26" rx="7" fill="#FFE800" stroke="#3D5588" stroke-width="2"/>
        <circle cx="31" cy="-30" r="3" fill="#FFE800" stroke="#3D5588" stroke-width="1.5"/>
        ${WHEEL(-20, -9, 8.5)}${WHEEL(22, -9, 8.5)}`,
    },
    sofa: {
      seats: [[-24, -48], [4, -52], [30, -48]], headR: 15,
      svg: `
        <rect x="-50" y="-44" width="100" height="26" rx="9" fill="#3D5588" transform="translate(3 3)"/>
        <rect x="-50" y="-44" width="100" height="26" rx="9" fill="#FF48B0" stroke="#3D5588" stroke-width="2"/>
        <rect x="-52" y="-26" width="104" height="16" rx="6" fill="#0078BF" stroke="#3D5588" stroke-width="2"/>
        <rect x="-60" y="-36" width="15" height="28" rx="6" fill="#0078BF" stroke="#3D5588" stroke-width="2"/>
        <rect x="45" y="-36" width="15" height="28" rx="6" fill="#0078BF" stroke="#3D5588" stroke-width="2"/>
        <rect x="-48" y="-9" width="6" height="9" rx="2" fill="#3D5588"/>
        <rect x="42" y="-9" width="6" height="9" rx="2" fill="#3D5588"/>`,
    },
    table: {
      seats: [[-32, -50], [2, -54], [36, -50]], headR: 15,
      svg: `
        <rect x="-46" y="-24" width="6" height="24" rx="2" fill="#3D5588"/>
        <rect x="40" y="-24" width="6" height="24" rx="2" fill="#3D5588"/>
        <path d="M-58,-32H58V-18Q51,-12 44,-18Q37,-12 30,-18Q23,-12 16,-18Q9,-12 2,-18Q-5,-12 -12,-18Q-19,-12 -26,-18Q-33,-12 -40,-18Q-47,-12 -58,-18Z" fill="#FFFDF6" stroke="#3D5588" stroke-width="2" stroke-linejoin="round"/>
        <path d="M-46,-31V-19M-30,-31V-19M-14,-31V-19M2,-31V-19M18,-31V-19M34,-31V-19M50,-31V-19" stroke="#FF48B0" stroke-width="3.5" opacity=".55"/>
        <ellipse cx="-32" cy="-33" rx="10" ry="3" fill="#FFFDF6" stroke="#3D5588" stroke-width="1.6"/>
        <ellipse cx="36" cy="-33" rx="10" ry="3" fill="#FFFDF6" stroke="#3D5588" stroke-width="1.6"/>
        <path d="M-12,-33h22l-3,-7h-16z" fill="#FFE800" stroke="#3D5588" stroke-width="1.6" stroke-linejoin="round"/>`,
    },
  };

  // Who rides what: [from, to, vehicle, seat]. Gaps between rides become hops.
  const RIDES = {
    da: [[2.4, 30.2, 'bus', 0], [31.0, 44.4, 'sofa', 1], [45.2, 66.2, 'car', 1], [67.0, 82.8, 'table', 1], [83.5, 999, 'bus2', 0]],
    family: [[29.8, 44.2, 'sofa', 0], [45.0, 66.0, 'car', 0], [66.8, 83.8, 'table', 0]],
    birgit: [[48.7, 56.2, 'plane', 0], [57.2, 66.4, 'car', 2], [67.2, 83.0, 'table', 2], [83.7, 999, 'bus2', 1]],
    edo: [[85.6, 999, 'scooter', 0]],
  };

  // ---------------------------------------------------------------------------
  // Camera
  // ---------------------------------------------------------------------------
  const CAM = [
    [0, { ll: [44.72, 8.62], z: 1 }],
    [3, { at: 'nice', z: 5 }],
    [7.2, { follow: 'bus', z: 4.2 }],
    [9.7, { follow: 'bus', z: 3 }],
    [17, { follow: 'bus', z: 2.5 }],
    [22.7, { follow: 'bus', z: 3.4 }],
    [26.4, { follow: 'bus', z: 4 }],
    [28.8, { at: 'mariano', z: 5 }],
    [47.6, { at: 'mariano', z: 5 }],
    [51.2, { ll: [45.7, 9.15], z: 2.9 }],
    [53.2, { ll: [45.68, 9.05], z: 2.8 }],
    [54.7, { at: 'malpensa', z: 4.4 }],
    [59, { at: 'malpensa', z: 4.4 }],
    [60.4, { follow: 'car', z: 4.2 }],
    [65.4, { follow: 'car', z: 4.2 }],
    [66.8, { at: 'mariano', z: 5 }],
    [83.6, { at: 'mariano', z: 5 }],
    [86.2, { ll: [45.72, 9.5], z: 2.9 }],
    [90.4, { ll: [45.715, 9.62], z: 3.8 }],
    [93.4, { ll: [45.705, 9.68], z: 5.4 }],
    [END, { ll: [45.705, 9.68], z: 5.8 }],
  ];
  const camTarget = (k, t) => (k.follow ? actorPos(ACTORS[k.follow], t) : k.at ? P[k.at] : proj(k.ll));
  function cameraAt(t) {
    let i = 0;
    while (i < CAM.length - 2 && t >= CAM[i + 1][0]) i++;
    const [ta, a] = CAM[i], [tb, b] = CAM[i + 1];
    const u = easeInOut(clamp((t - ta) / (tb - ta)));
    const pa = camTarget(a, t), pb = camTarget(b, t);
    return { x: lerp(pa[0], pb[0], u), y: lerp(pa[1], pb[1], u), z: Math.exp(lerp(Math.log(a.z), Math.log(b.z), u)) };
  }

  // ---------------------------------------------------------------------------
  // DOM setup
  // ---------------------------------------------------------------------------
  const stage = $('#stage');
  const mapG = $('#map'), labelsG = $('#labels'), actorsG = $('#actors'), headsG = $('#heads'), skyG = $('#sky');
  const washes = { dusk: $('#dusk'), dawn: $('#dawn'), night: $('#night') };

  function buildMap() {
    const g = mapG;
    svgEl('rect', { x: -4000, y: -4000, width: 9000, height: 9000, class: 'land' }, g);
    svgEl('path', { d: llD(SEA, true), class: 'sea' }, g);
    svgEl('path', { d: llD(COAST.slice(1, -2)), class: 'coast-print', transform: 'translate(2.2 1.6)' }, g);
    svgEl('path', { d: llD([[42.75, 9.33], [42.9, 9.33], [43.01, 9.42], [42.98, 9.47], [42.85, 9.49], [42.75, 9.46]], true), class: 'island' }, g);
    svgEl('circle', { cx: proj([43.04, 9.83])[0], cy: proj([43.04, 9.83])[1], r: 3, class: 'island' }, g);
    for (const w of WAVES) {
      const [x, y] = proj(w);
      svgEl('path', { d: `M${x - 7},${y}q3.5,-3.5 7,0t7,0`, class: 'wave' }, g);
    }
    for (const r of RIVERS) svgEl('path', { d: ptsD(buildRoute(r, 8).pts), class: 'river' }, g);
    for (const l of LAKES) svgEl('path', { d: llD(l.pts), class: 'lake', 'stroke-width': l.w }, g);
    for (const b of BORDERS) svgEl('path', { d: llD(b), class: 'border' }, g);
    for (const [lat, lon] of HILLS) {
      const [x, y] = proj([lat, lon]);
      svgEl('path', { d: `M${x - 9},${y}q9,-11 18,0z`, class: 'hill' }, g);
    }
    for (const [lat, lon, s] of MOUNTAINS) {
      const [x, y] = proj([lat, lon]);
      const m = svgEl('g', { transform: `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${s})` }, g);
      svgEl('path', { d: 'M-10,0L0,-15L10,0Z', class: 'mtn-fill' }, m);
      svgEl('path', { d: 'M-3.6,-9.6L0,-15L3.6,-9.6L1.6,-10.8L0,-9L-1.6,-10.8Z', class: 'mtn-snow' }, m);
      svgEl('path', { d: 'M-10,0L0,-15L10,0', class: 'mtn-line', transform: 'translate(1.2 0.9)' }, m);
    }
    for (const k of ['bus', 'malpensa', 'bergamo', 'edo']) {
      ROUTES[k].dots = svgEl('path', { d: ptsD(ROUTES[k].pts), class: 'route-dots' }, g);
    }
  }

  const TRAILS = [
    { actor: 'plane', trip: 0, cls: 'trail-plane', w: 3, dash: [7, 7] },
    { actor: 'bus', trip: 0, cls: 'trail-da', w: 5 },
    { actor: 'car', trip: 0, cls: 'trail-da', w: 5 },
    { actor: 'bus2', trip: 0, cls: 'trail-da', w: 5 },
    { actor: 'scooter', trip: 0, cls: 'trail-edo', w: 5 },
  ];
  function buildTrails() {
    for (const tr of TRAILS) tr.el = svgEl('path', { class: 'trail ' + tr.cls }, mapG);
  }

  const LABELS = [
    { p: 'nice', name: 'Nizza', main: true },
    { p: 'mariano', name: 'Mariano Comense', main: true },
    { p: 'malpensa', name: 'Malpensa', main: true, minZ: 1.8 },
    { p: 'bergamo', name: 'Bergamo', main: true, side: 'above' },
    { p: 'fiobbio', name: 'Fiobbio', main: true, minZ: 2.2 },
    { p: 'monaco', name: 'Monaco', minZ: 2.4 },
    { p: 'ventimiglia', name: 'Ventimiglia', minZ: 1.8 },
    { p: 'savona', name: 'Savona', minZ: 1.6 },
    { p: 'genova', name: 'Genova' },
    { p: 'milano', name: 'Milano' },
    { p: 'como', name: 'Como', minZ: 2.4 },
    { p: 'torino', name: 'Torino' },
  ];
  const REGIONS = [
    { ll: [43.9, 8.85], name: 'Mar Ligure', cls: 'sea-name', rot: -8 },
    { ll: [44.35, 6.35], name: 'Francia', cls: 'country', rot: -6 },
    { ll: [44.75, 8.15], name: 'Italia', cls: 'country', rot: -6 },
    { ll: [46.33, 8.7], name: 'Svizzera', cls: 'country', rot: -4 },
    { ll: [45.22, 8.35], name: 'Pianura Padana', cls: '', rot: -5 },
    { ll: [46.08, 10.75], name: 'Vienna →', cls: 'country', rot: -10 },
  ];
  // Little doodles next to the places that matter. ll = where, off = screen nudge.
  const LANDMARKS = [
    { ll: PLACES.nice, off: [-64, -2], svg: `
      <path d="M2,0C3,-14 1,-26 -2,-38" fill="none" stroke="#3D5588" stroke-width="4" stroke-linecap="round"/>
      <path d="M-2,-38q-14,-6 -22,4q10,-4 22,-4zM-2,-38q-4,-14 -16,-14q8,4 16,14zM-2,-38q6,-14 18,-12q-10,2 -18,12zM-2,-38q14,-4 20,8q-8,-8 -20,-8z" fill="#00A95C" stroke="#3D5588" stroke-width="1.5" stroke-linejoin="round"/>
      <circle cx="-1" cy="-35" r="2.6" fill="#FF48B0"/>` },
    { ll: PLACES.mariano, off: [62, -2], svg: `
      <rect x="-14" y="-22" width="28" height="22" fill="#FFFDF6" stroke="#3D5588" stroke-width="2"/>
      <path d="M-19,-21L0,-38L19,-21Z" fill="#FF48B0" stroke="#3D5588" stroke-width="2" stroke-linejoin="round"/>
      <rect x="-4" y="-12" width="8" height="12" fill="#0078BF"/>
      <path d="M0,-30c-2,-3 -6,-1 -4,2l4,4l4,-4c2,-3 -2,-5 -4,-2z" fill="#FFE800"/>` },
    { ll: PLACES.malpensa, off: [-2, -6], svg: `
      <path d="M-5,0L-3,-30H3L5,0Z" fill="#FFFDF6" stroke="#3D5588" stroke-width="2" stroke-linejoin="round"/>
      <path d="M-11,-30H11L8,-42H-8Z" fill="#0078BF" stroke="#3D5588" stroke-width="2" stroke-linejoin="round"/>
      <path d="M-8,-42H8L5,-46H-5Z" fill="#FF48B0" stroke="#3D5588" stroke-width="2" stroke-linejoin="round"/>` },
    { ll: [45.738, 9.615], off: [0, 0], svg: `
      <path d="M-34,0V-14H-26V-10H-18V-14H-10V-24H-4V-14H4V-10H12V-30H18V-36H24V-30H28V-12H34V0Z" fill="#FFFDF6" stroke="#3D5588" stroke-width="2" stroke-linejoin="round"/>
      <path d="M-10,-24L-7,-32L-4,-24Z" fill="#FF48B0" stroke="#3D5588" stroke-width="1.6" stroke-linejoin="round"/>
      <path d="M12,-36L21,-48L30,-36Z" fill="#FF48B0" stroke="#3D5588" stroke-width="1.6" stroke-linejoin="round"/>
      <path d="M-30,-6h60" stroke="#0078BF" stroke-width="2" stroke-dasharray="3 3"/>` },
  ];

  function buildLabels() {
    for (const m of LANDMARKS) {
      m.p = proj(m.ll);
      m.el = svgEl('g', { class: 'landmark' }, labelsG);
      m.el.innerHTML = m.svg;
    }
    for (const r of REGIONS) {
      r.p = proj(r.ll);
      r.el = svgEl('text', { class: 'region ' + r.cls, 'text-anchor': 'middle' }, labelsG);
      r.el.textContent = r.name;
    }
    for (const l of LABELS) {
      l.el = svgEl('g', { class: 'lbl' + (l.main ? '' : ' minor') }, labelsG);
      svgEl('circle', { class: 'dot', r: l.main ? 5.5 : 3 }, l.el);
      l.tx = svgEl('text', { 'text-anchor': 'middle', y: l.main ? 25 : 18 }, l.el);
      l.tx.textContent = l.name;
    }
  }

  function buildActors() {
    for (const a of Object.values(ACTORS)) {
      const v = VEH[a.kind];
      a.el = svgEl('g', { class: 'actor' }, actorsG);
      a.el.innerHTML = (v.exhaust ? '<g class="puffs"><circle class="puff"/><circle class="puff"/><circle class="puff"/></g>' : '') + v.svg;
      a.wheels = [...a.el.querySelectorAll('.wh')];
      a.puffs = [...a.el.querySelectorAll('.puff')];
    }
  }

  const varStyle = (vars) => Object.entries(vars || {}).map(([k, v]) => `${k}:${v}`).join(';');
  const PEOPLE = {};
  function buildHeads() {
    for (const [id, p] of Object.entries(CONFIG.people)) {
      const g = svgEl('g', { class: 'head' }, headsG);
      const bob = svgEl('g', {}, g);
      // Same structure as blobatar's own framework adapters: the root <g> keeps
      // its children, and only its class plus the <svg>'s custom properties change,
      // so motion.css can morph between expressions.
      const svg = svgEl('svg', { class: 'blob', x: -32, y: -32, width: 64, height: 64, viewBox: '0 0 100 100', overflow: 'visible' }, bob);
      const parts = _parts(p.seed, { animate: 'always', palette: p.palette });
      const root = svgEl('g', { class: parts.cls }, svg);
      root.innerHTML = parts.inner;
      svg.setAttribute('style', varStyle(parts.vars));
      const hat = svgEl('g', { class: 'hat', style: 'display:none' }, bob);
      hat.innerHTML = `
          <path d="M-12,-15L3,-46L13,-12Z" fill="#FFE800" stroke="#3D5588" stroke-width="2.2" stroke-linejoin="round"/>
          <path d="M-7,-25L8,-22M-2,-35L6,-33" stroke="#FF48B0" stroke-width="3" stroke-linecap="round"/>
          <circle cx="3" cy="-46" r="4.5" fill="#FF48B0" stroke="#3D5588" stroke-width="2"/>`;
      PEOPLE[id] = { g, bob, svg, root, hat, seed: p.seed, palette: p.palette, mood: 'idle', phase: Math.random() * 6, rides: RIDES[id] };
    }
    headsG.appendChild(PEOPLE.da.g); // the birthday boy is always in front
  }
  function setMood(pp, name) {
    if (pp.mood === name) return;
    pp.mood = name;
    const parts = _parts(pp.seed, { animate: 'always', palette: pp.palette, expression: EXPR[name] });
    pp.root.setAttribute('class', parts.cls);
    pp.svg.setAttribute('style', varStyle(parts.vars));
  }
  const moodAt = (id, t) => {
    let m = 'idle';
    for (const [mt, name] of MOODS[id] || []) if (t >= mt) m = name;
    return m;
  };

  function buildSky() {
    skyG.innerHTML = '';
    const stars = svgEl('g', { id: 'stars' }, skyG);
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 46; i++) {
      const x = rnd() * vw, y = rnd() * vh * 0.75, r = 1.4 + rnd() * 2.2;
      const s = svgEl('path', { d: `M${x},${y - r * 2}L${x + r * 0.6},${y - r * 0.6}L${x + r * 2},${y}L${x + r * 0.6},${y + r * 0.6}L${x},${y + r * 2}L${x - r * 0.6},${y + r * 0.6}L${x - r * 2},${y}L${x - r * 0.6},${y - r * 0.6}Z`, fill: '#FFE800' }, stars);
      s.dataset.tw = rnd() * 6;
    }
    const moon = svgEl('g', { id: 'moon' }, skyG);
    moon.innerHTML = '<circle r="22" fill="#FFE800" stroke="#3D5588" stroke-width="2.5"/><circle cx="11" cy="-7" r="19" fill="#3D5588"/>';
    const sun = svgEl('g', { id: 'sun' }, skyG);
    let rays = '';
    for (let i = 0; i < 12; i++) rays += `<path d="M0,-30L4,-42L-4,-42Z" transform="rotate(${i * 30})" fill="#FF48B0"/>`;
    sun.innerHTML = `<g class="rays">${rays}</g><circle r="24" fill="#FFE800" stroke="#3D5588" stroke-width="2.5"/><path d="M-9,4q9,9 18,0" fill="none" stroke="#3D5588" stroke-width="2.5" stroke-linecap="round"/><circle cx="-8" cy="-5" r="2.6" fill="#3D5588"/><circle cx="8" cy="-5" r="2.6" fill="#3D5588"/>`;
  }

  const bubbleEls = BUBBLES.map(([t0, t1, who, text]) => {
    const el = document.createElement('div');
    el.className = 'bubble';
    el.textContent = text;
    $('#bubbles').appendChild(el);
    return { t0, t1, who, el };
  });

  // ---------------------------------------------------------------------------
  // Layout
  // ---------------------------------------------------------------------------
  let vw = 0, vh = 0, base = 1, fx = 0, fy = 0, as = 1;
  const ROUTE_BOX = { w: 604, h: 675 };
  function resize() {
    vw = window.innerWidth;
    vh = window.innerHeight;
    stage.setAttribute('viewBox', `0 0 ${vw} ${vh}`);
    for (const r of Object.values(washes)) { r.setAttribute('width', vw); r.setAttribute('height', vh); }
    const narrow = vw < 680;
    const usableH = vh - (narrow ? 200 : 150);
    base = Math.min(vw / (ROUTE_BOX.w * 1.15), usableH / (ROUTE_BOX.h * 1.05));
    fx = vw / 2;
    fy = vh * (narrow ? 0.4 : 0.42);
    controlsH = $('.controls').offsetHeight || 80;
    lastCap = -2; // re-measure the caption card
    as = clamp(Math.min(vw, vh) / 640, 0.7, 1.35);
    conf.resize();
    buildSky();
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  let lastChapter = -1, lastKm = -1, lastCap = -2;
  const capEl = $('#caption');
  const capBox = { w: 300, h: 120 };
  let controlsH = 80;
  const vstate = {};

  function render(t, w) {
    const calm = reduceMotion.matches;
    const cam = cameraAt(t);
    const S = base * cam.z;
    const toScreen = (p) => [fx + (p[0] - cam.x) * S, fy + (p[1] - cam.y) * S];

    mapG.setAttribute('transform', `translate(${fx} ${fy}) scale(${S}) translate(${-cam.x} ${-cam.y})`);

    // routes and trails keep a constant on-screen weight
    for (const k of ['bus', 'malpensa', 'bergamo', 'edo']) {
      const d = ROUTES[k].dots;
      d.setAttribute('stroke-width', 3 / S);
      d.setAttribute('stroke-dasharray', `${0.1 / S} ${9 / S}`);
    }
    for (const tr of TRAILS) {
      const a = ACTORS[tr.actor], trip = a.trips[tr.trip];
      const f = t < trip.keys[0][0] ? 0 : tripFrac(trip, t);
      tr.el.setAttribute('d', partialD(trip.r, f));
      tr.el.setAttribute('stroke-width', tr.w / S);
      if (tr.dash) tr.el.setAttribute('stroke-dasharray', tr.dash.map((v) => v / S).join(' '));
      tr.el.style.opacity = tr.actor === 'plane' ? clamp((T.planeGone - t) / 0.5) : '';
    }

    // labels
    for (const l of LABELS) {
      const [x, y] = toScreen(P[l.p]);
      const show = cam.z >= (l.minZ || 0);
      l.el.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
      l.el.style.display = show ? '' : 'none';
      // at overview zoom Mariano and Bergamo sit close together, so Bergamo's name goes above its dot
      const beside = l.side && cam.z < 1.6;
      if (beside !== l.beside) {
        l.beside = beside;
        l.tx.setAttribute('y', beside ? -12 : 25);
      }
    }
    for (const m of LANDMARKS) {
      const [x, y] = toScreen(m.p);
      const k = as * clamp(cam.z / 3, 0.55, 1);
      m.el.setAttribute('transform', `translate(${(x + m.off[0] * k).toFixed(1)} ${(y + m.off[1] * k).toFixed(1)}) scale(${k.toFixed(3)})`);
      m.el.style.opacity = clamp((cam.z - 1.3) / 0.4);
    }
    for (const r of REGIONS) {
      const [x, y] = toScreen(r.p);
      r.el.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${r.rot})`);
    }

    // sky and washes
    const night = pw([[33.5, 0], [35.5, 0.74], [37.2, 0.74], [39, 0], [44, 0], [47, 0.5], [59.5, 0.55], [62.5, 0.74], [75, 0.74], [77.8, 0]], t);
    washes.night.style.opacity = night;
    washes.dusk.style.opacity = pw([[33, 0], [34.2, 0.3], [35.8, 0], [43.5, 0], [45.8, 0.3], [48.8, 0]], t);
    washes.dawn.style.opacity = pw([[37, 0], [38.5, 0.28], [41, 0], [75.5, 0], [77.3, 0.28], [80.8, 0]], t);
    const starO = clamp((night - 0.4) / 0.2);
    const stars = skyG.querySelector('#stars');
    stars.style.opacity = starO;
    if (starO > 0 && !calm) for (const s of stars.children) s.style.opacity = 0.55 + 0.45 * Math.sin(w * 2.2 + +s.dataset.tw);
    const skyX = vw < 680 ? vw - 52 : vw * 0.74, skyY = vw < 680 ? 118 : 74;
    const moon = skyG.querySelector('#moon');
    const moonO = clamp((night - 0.3) / 0.15);
    moon.setAttribute('transform', `translate(${skyX} ${skyY + (1 - moonO) * 40})`);
    moon.style.opacity = moonO;
    const sunO = pw([[37.3, 0], [38.4, 1], [42, 1], [43.5, 0], [75.8, 0], [77, 1], [81.3, 1], [82.8, 0]], t);
    const sun = skyG.querySelector('#sun');
    sun.setAttribute('transform', `translate(${skyX} ${skyY + (1 - sunO) * 60}) scale(${0.6 + 0.4 * sunO})`);
    sun.style.opacity = sunO;
    if (!calm) sun.querySelector('.rays').setAttribute('transform', `rotate(${(w * 25) % 360})`);

    // vehicles
    for (const [id, a] of Object.entries(ACTORS)) {
      const [s0, s1] = a.show;
      const st = (vstate[id] = vstate[id] || {});
      st.visible = t >= s0 && t <= s1;
      if (!st.visible) { a.el.style.display = 'none'; continue; }
      a.el.style.display = '';
      const pos = actorPos(a, t);
      const p1 = actorPos(a, t - 0.06), p2 = actorPos(a, t + 0.06);
      const dx = p2[0] - p1[0], dy = p2[1] - p1[1];
      const speed = Math.hypot(dx, dy) / 0.12;
      const trip = currentTrip(a, t);
      const flip = Math.abs(dx) > 0.35 * Math.abs(dy) && Math.abs(dx) > 0.02 ? Math.sign(dx) : trip.dir;
      const moving = speed > 0.6;
      let rot = 0;
      if (a.kind === 'plane') {
        rot = moving ? (flip > 0 ? Math.atan2(dy, dx) : Math.atan2(-dy, -dx)) * 180 / Math.PI : 0;
        rot = clamp(rot, -24, 24);
      } else if (moving && !calm) {
        rot = Math.sin(w * 7 + a.kind.length) * 1.6;
      }
      const bounce = moving && !calm && a.kind !== 'plane' ? -Math.abs(Math.sin(w * 13)) * 2.4 : 0;
      const pop = Math.min(easeOutBack(clamp((t - s0) / 0.45)), clamp((s1 - t) / 0.35));
      const sc = as * Math.max(0.001, pop);
      const [sx, sy] = toScreen(pos);
      a.el.setAttribute('transform', `translate(${sx.toFixed(1)} ${(sy + bounce).toFixed(1)}) rotate(${rot.toFixed(2)}) scale(${(flip * sc).toFixed(3)} ${sc.toFixed(3)})`);

      const dist = tripFrac(trip, t) * trip.r.L;
      for (const wh of a.wheels) wh.setAttribute('transform', `translate(${wh.dataset.x} ${wh.dataset.y}) rotate(${(dist * 30) % 360})`);
      a.puffs.forEach((pf, i) => {
        if (!moving || calm) { pf.style.display = 'none'; return; }
        const ph = (w * 1.8 + i / 3) % 1;
        const [ex, ey] = VEH[a.kind].exhaust;
        pf.style.display = '';
        pf.setAttribute('cx', ex - ph * 26);
        pf.setAttribute('cy', ey - ph * 12);
        pf.setAttribute('r', 3 + ph * 6);
        pf.style.opacity = (1 - ph) * 0.9;
      });
      Object.assign(st, { sx, sy: sy + bounce, rot, flip, sc, speed, kind: a.kind });
    }

    // heads
    const headPos = {};
    const seatAt = (veh, seat) => {
      const st = vstate[veh];
      if (!st || !st.visible) return null;
      const v = VEH[st.kind];
      const [lx, ly] = v.seats[seat];
      const x = lx * st.flip * st.sc, y = ly * st.sc;
      const r = (st.rot * Math.PI) / 180;
      return { x: st.sx + x * Math.cos(r) - y * Math.sin(r), y: st.sy + x * Math.sin(r) + y * Math.cos(r), s: (v.headR / 20) * st.sc, speed: st.speed };
    };
    for (const [id, pp] of Object.entries(PEOPLE)) {
      const rides = pp.rides;
      let hp = null;
      for (let i = 0; i < rides.length; i++) {
        const [r0, r1, veh, seat] = rides[i];
        if (t >= r0 && t <= r1) { hp = seatAt(veh, seat); break; }
        const next = rides[i + 1];
        if (next && t > r1 && t < next[0]) {
          const a = seatAt(veh, seat) || seatAt(next[2], next[3]);
          const b = seatAt(next[2], next[3]) || a;
          if (a && b) {
            const u = easeInOut((t - r1) / (next[0] - r1));
            hp = { x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u) - Math.sin(u * Math.PI) * 60 * as, s: lerp(a.s, b.s, u), speed: 0, hop: true };
          }
          break;
        }
      }
      if (!hp) { pp.g.style.display = 'none'; continue; }
      pp.g.style.display = '';
      headPos[id] = hp;
      setMood(pp, moodAt(id, t));
      let ang;
      if (calm) ang = 0;
      else if (hp.hop) ang = Math.sin(w * 20) * 18;
      else ang = Math.sin(w * (hp.speed > 0.6 ? 9 : 2.4) + pp.phase) * (hp.speed > 0.6 ? 7 + Math.min(hp.speed, 40) * 0.25 : 4);
      if (id === 'da' && t > T.sleep[0] && t < T.sleep[1]) ang = 28 + (calm ? 0 : Math.sin(w * 1.5) * 4);
      pp.g.setAttribute('transform', `translate(${hp.x.toFixed(1)} ${hp.y.toFixed(1)}) scale(${hp.s.toFixed(3)})`);
      pp.bob.setAttribute('transform', `rotate(${ang.toFixed(2)} 0 18)`);
      if (id === 'da') {
        const hatS = easeOutBack(clamp((t - T.hat) / 0.5));
        pp.hat.style.display = t > T.hat ? '' : 'none';
        pp.hat.setAttribute('transform', `translate(0 -14) scale(${Math.max(0.001, hatS)}) translate(0 10)`);
        hp.top = t > T.hat ? 48 : 22;
      } else hp.top = 22;
    }

    // speech bubbles
    for (const b of bubbleEls) {
      const hp = headPos[b.who];
      if (!hp || t < b.t0 || t > b.t1) { b.el.style.display = 'none'; continue; }
      const k = Math.min(easeOutBack(clamp((t - b.t0) / 0.3)), clamp((b.t1 - t) / 0.2));
      const x = clamp(hp.x, 90, vw - 90);
      const y = hp.y - hp.top * hp.s - 14;
      b.el.style.display = 'block';
      b.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -100%) scale(${Math.max(0.01, k).toFixed(3)})`;
    }

    // chapter (timeline ticks + date stamp)
    let ci = 0;
    while (ci < CHAPTERS.length - 1 && t >= CHAPTERS[ci + 1].t) ci++;
    if (ci !== lastChapter) setChapter(ci, lastChapter);
    lastChapter = ci;

    // caption card, popping up next to the vehicle it talks about
    const capI = CHAPTERS.findIndex((c) => t >= c.cap[0] && t <= c.cap[1]);
    if (capI !== lastCap) {
      lastCap = capI;
      if (capI >= 0) {
        $('#cap-title').textContent = CHAPTERS[capI].title;
        $('#cap-text').textContent = CHAPTERS[capI].text;
        capBox.w = capEl.offsetWidth;
        capBox.h = capEl.offsetHeight;
      }
    }
    if (capI < 0) capEl.style.visibility = 'hidden';
    else {
      const c = CHAPTERS[capI];
      const st = vstate[c.near];
      const ax = st && st.visible ? st.sx : fx, ay = st && st.visible ? st.sy : fy;
      const { w: cw, h: ch } = capBox;
      const left = clamp(ax - cw / 2, 16, Math.max(16, vw - cw - 16));
      let top = ay + 26 * as;
      const above = top + ch > vh - controlsH - 12;
      if (above) top = Math.max(64, ay - 100 * as - ch);
      const k = Math.min(easeOutBack(clamp((t - c.cap[0]) / 0.35)), clamp((c.cap[1] - t) / 0.25));
      capEl.classList.toggle('is-above', above);
      capEl.style.setProperty('--ax', `${clamp(ax - left, 26, cw - 26).toFixed(0)}px`);
      capEl.style.visibility = 'visible';
      capEl.style.transform = `translate(${left.toFixed(1)}px, ${top.toFixed(1)}px) scale(${Math.max(0.01, k).toFixed(3)})`;
    }

    // odometer
    const car = ACTORS.car.trips;
    const km = Math.round(
      CONFIG.km.bus * tripFrac(ACTORS.bus.trips[0], t) +
      (CONFIG.km.airport / 2) * (tripFrac(car[0], t) + (t < car[1].keys[0][0] ? 0 : tripFrac(car[1], t))) +
      CONFIG.km.bergamo * tripFrac(ACTORS.bus2.trips[0], t),
    );
    if (km !== lastKm) {
      $('#km').innerHTML = String(km).padStart(3, '0').split('').map((d) => `<span>${d}</span>`).join('');
      lastKm = km;
    }

    // scrubber
    if (!scrubbing) scrub.value = t;
    scrub.style.setProperty('--p', `${(t / END) * 100}%`);
  }

  function setChapter(i, prev) {
    const c = CHAPTERS[i];
    const stamp = $('#stamp');
    const stampChanged = $('#stamp-part').textContent !== c.part;
    $('#stamp-day').textContent = c.day;
    $('#stamp-part').textContent = c.part;
    if (prev !== -1 && !reduceMotion.matches) {
      if (stampChanged) { stamp.classList.remove('thump'); void stamp.offsetWidth; stamp.classList.add('thump'); }
    }
    ticks.forEach((tk, k) => tk.classList.toggle('on', k <= i));
  }

  // ---------------------------------------------------------------------------
  // Confetti
  // ---------------------------------------------------------------------------
  const conf = {
    canvas: $('#confetti'), parts: [], dpr: 1,
    resize() {
      this.dpr = Math.min(2, window.devicePixelRatio || 1);
      this.canvas.width = vw * this.dpr;
      this.canvas.height = vh * this.dpr;
      this.ctx = this.canvas.getContext('2d');
    },
    burst(x, y, n, spread = 1) {
      if (reduceMotion.matches) return;
      const cols = ['#FF48B0', '#0078BF', '#00A95C', '#FFE800', '#3D5588'];
      for (let i = 0; i < n; i++) {
        const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2 * spread;
        const v = 6 + Math.random() * 9;
        this.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, w: 6 + Math.random() * 7, h: 4 + Math.random() * 5, c: cols[i % cols.length] });
      }
    },
    step(dt) {
      const ctx = this.ctx;
      if (!ctx) return;
      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      ctx.clearRect(0, 0, vw, vh);
      if (!this.parts.length) return;
      const k = dt * 60;
      this.parts = this.parts.filter((p) => p.y < vh + 30);
      for (const p of this.parts) {
        p.vy += 0.3 * k; p.vx *= Math.pow(0.985, k); p.vy *= Math.pow(0.99, k);
        p.x += p.vx * k; p.y += p.vy * k; p.r += p.vr * k;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.r);
        ctx.scale(1, Math.cos(p.r * 2.3));
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
    },
  };

  // one-shot moments, fired only while playing forward
  const EVENTS = [
    [T.hat + 0.1, () => { const hp = PEOPLE.da; const m = /translate\(([\d.-]+) ([\d.-]+)\)/.exec(hp.g.getAttribute('transform') || ''); if (m) conf.burst(+m[1], +m[2] - 30, 70, 0.8); }],
    [T.reunion, () => { conf.burst(vw * 0.2, vh * 0.75, 90, 0.7); conf.burst(vw * 0.8, vh * 0.75, 90, 0.7); }],
  ];

  // ---------------------------------------------------------------------------
  // Playback
  // ---------------------------------------------------------------------------
  const body = document.body;
  const scrub = $('#scrub');
  const ticksEl = $('#ticks');
  const ticks = CHAPTERS.map((c, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'tick';
    b.style.left = `${(c.t / END) * 100}%`;
    b.setAttribute('aria-label', `Vai a: ${c.title}`);
    b.title = c.title;
    b.addEventListener('click', () => { seekTo(c.t + 0.01); });
    ticksEl.appendChild(b);
    return b;
  });

  let t = 0, playing = false, scrubbing = false, last = null, finaleShown = false;

  function setPlaying(p) {
    playing = p;
    body.classList.toggle('is-playing', p);
    $('#play').setAttribute('aria-label', p ? 'Pausa' : 'Riproduci');
  }
  function seekTo(nt) {
    t = clamp(nt, 0, END);
    if (t < END) hideFinale();
  }
  function start() {
    body.classList.remove('is-intro');
    $('#intro').hidden = true;
    if (t >= END) t = 0;
    hideFinale();
    setPlaying(true);
  }
  function showFinale() {
    if (finaleShown) return;
    finaleShown = true;
    const f = $('#finale');
    f.hidden = false;
    $('#finale-title').focus({ preventScroll: true });
  }
  function hideFinale() {
    if (!finaleShown) return;
    finaleShown = false;
    $('#finale').hidden = true;
  }

  $('#start').addEventListener('click', start);
  $('#play').addEventListener('click', () => {
    if (body.classList.contains('is-intro')) return start();
    if (!playing && t >= END) { t = 0; hideFinale(); }
    setPlaying(!playing);
  });
  $('#replay').addEventListener('click', () => { t = 0; hideFinale(); $('#cake').classList.remove('out'); $('#blow').textContent = 'Spegni le candeline'; setPlaying(true); });
  $('#blow').addEventListener('click', (e) => {
    const cake = $('#cake');
    const out = cake.classList.toggle('out');
    e.currentTarget.textContent = out ? 'Riaccendile' : 'Spegni le candeline';
    if (out) {
      const r = cake.getBoundingClientRect();
      conf.burst(r.left + r.width / 2, r.top + r.height * 0.3, 160, 1.2);
    }
  });

  let wasPlaying = false;
  scrub.addEventListener('pointerdown', () => { scrubbing = true; wasPlaying = playing; setPlaying(false); });
  const endScrub = () => { if (!scrubbing) return; scrubbing = false; if (wasPlaying && t < END) setPlaying(true); };
  scrub.addEventListener('pointerup', endScrub);
  scrub.addEventListener('pointercancel', endScrub);
  scrub.addEventListener('input', () => { seekTo(+scrub.value); });

  document.addEventListener('keydown', (e) => {
    if (e.target.closest && e.target.closest('button, input')) return;
    if (body.classList.contains('is-intro')) return;
    if (e.key === ' ' || e.key === 'k') { e.preventDefault(); $('#play').click(); }
    else if (e.key === 'ArrowRight') { const n = CHAPTERS.find((c) => c.t > t + 0.05); seekTo(n ? n.t + 0.01 : END); }
    else if (e.key === 'ArrowLeft') { const p = [...CHAPTERS].reverse().find((c) => c.t < t - 0.6); seekTo(p ? p.t + 0.01 : 0); }
  });

  function frame(now) {
    const w = now / 1000;
    const dt = last == null ? 0 : Math.min(0.05, (now - last) / 1000);
    last = now;
    if (playing) {
      const prev = t;
      t = Math.min(END, t + dt * PLAYBACK_SPEED);
      for (const [et, fn] of EVENTS) if (prev < et && t >= et) fn();
      if (t >= END) setPlaying(false);
    }
    render(t, w);
    if (t >= END && !scrubbing) showFinale();
    conf.step(dt);
    requestAnimationFrame(frame);
  }

  // ---------------------------------------------------------------------------
  // Boot
  // ---------------------------------------------------------------------------
  $('#sig-name').textContent = CONFIG.from;
  scrub.max = END;

  // Editing aid: warn in the console if two texts overlap or one is too short to read.
  {
    const slots = [
      ...CHAPTERS.map((c) => ({ a: c.cap[0], b: c.cap[1], what: c.title, len: c.title.length + c.text.length })),
      ...BUBBLES.map(([a, b, , text]) => ({ a, b, what: text, len: text.length })),
    ].sort((x, y) => x.a - y.a);
    slots.forEach((x, i) => {
      const next = slots[i + 1];
      if (next && next.a < x.b) console.warn(`Texts overlap: "${x.what}" and "${next.what}"`);
      const need = (1 + x.len / 15) * PLAYBACK_SPEED; // ~15 characters per second
      if (x.b - x.a < need - 0.3) console.warn(`"${x.what}" is on screen ${((x.b - x.a) / PLAYBACK_SPEED).toFixed(1)} s, needs about ${(need / PLAYBACK_SPEED).toFixed(1)} s`);
    });
  }
  buildMap();
  buildTrails();
  buildLabels();
  buildActors();
  buildHeads();
  resize();
  window.addEventListener('resize', resize);

  // #t=33 jumps straight to a moment (handy for checking a scene)
  const m = /t=([\d.]+)/.exec(location.hash);
  if (m) {
    body.classList.remove('is-intro');
    $('#intro').hidden = true;
    t = clamp(+m[1], 0, END);
  }
  requestAnimationFrame(frame);
})();
