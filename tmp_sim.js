// Faithful copy of the real noise helpers + new land field, for ASCII verification.
function hash2(x, y) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return s - Math.floor(s);
}
function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi), b = hash2(xi + 1, yi);
  const c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1);
  return a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v;
}
function fbm(x, y, oct, lac = 2.0, gain = 0.5) {
  let t = 0, amp = 0.5, f = lac, s = 0;
  for (let k = 0; k < oct; k++) { t += vnoise(x * f, y * f) * amp; s += amp; amp *= gain; f *= lac; }
  return t / s;
}
function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
function mix(c1, c2, t) { return [c1[0] + (c2[0] - c1[0]) * t, c1[1] + (c2[1] - c1[1]) * t, c1[2] + (c2[2] - c1[2]) * t]; }
function _softBox(lon, lat, cx, cy, hx, hy, fade) {
  const d = Math.max(Math.abs(lon - cx) / hx, Math.abs(lat - cy) / hy);
  const t = clamp((d - (1 - fade)) / fade, 0, 1);
  const s = t * t * (3 - 2 * t);
  return 1 - s;
}
function _landField(u, v) {
  const lon = (u - 0.5) * 360, lat = (0.5 - v) * 180;
  let seed = 0;
  const S = (cx, cy, hx, hy, fade) => seed = Math.max(seed, _softBox(lon, lat, cx, cy, hx, hy, fade));
  S(-100, 52, 36, 16, 0.12); S(-118, 46, 11, 13, 0.16); S(-104, 34, 12, 8, 0.16); S(-86, 32, 8, 6, 0.16); S(-92, 22, 11, 7, 0.18);
  S(-70, 6, 12, 12, 0.18); S(-49, -13, 20, 17, 0.16); S(-66, -30, 12, 20, 0.18);
  S(10, 20, 27, 12, 0.16); S(22, -3, 12, 13, 0.18); S(24, -22, 15, 15, 0.18); S(-8, 11, 9, 9, 0.18);
  S(16, 51, 25, 12, 0.16); S(-4, 40, 8, 7, 0.18); S(18, 63, 9, 7, 0.20); S(12, 42, 5, 5, 0.20);
  S(92, 60, 48, 12, 0.14); S(74, 44, 20, 9, 0.18); S(79, 22, 9, 14, 0.18); S(106, 33, 19, 12, 0.16); S(112, 16, 12, 9, 0.18); S(46, 28, 11, 8, 0.18);
  S(133, -25, 15, 9, 0.16);
  S(-42, 72, 12, 9, 0.18);
  seed += (fbm(u * 4.0 + 2.7, v * 3.0 + 6.3, 4) - 0.5) * 0.34;
  seed += (fbm(u * 13.0 + 8.1, v * 9.0 + 2.9, 3) - 0.5) * 0.10;
  return seed;
}

// Render a low-res ASCII world map.
const W = 150, H = 75;
let landPct = 0, overPct = 0;
for (let j = 0; j < H; j++) {
  let line = '';
  for (let i = 0; i < W; i++) {
    const u = (i + 0.5) / W, v = (j + 0.5) / H;
    const f = _landField(u, v);
    const isLand = f > 0.5;
    if (isLand) landPct++; else overPct++;
    // classify roughly: snow/mtn high, desert mid-latitude, forest low
    const lat = (0.5 - v) * 180, absLat = Math.abs(lat);
    let ch = '.', sym = ' ';
    if (isLand) {
      sym = absLat > 66 ? 'T' : (absLat > 20 && absLat < 33 ? 'D' : 'F'); // Tundra / Desert / Forest
      ch = sym;
    } else {
      ch = (f > 0.35 ? ',' : '.'); // shallow-ish vs deep ocean (visual only)
    }
    line += ch;
  }
  const latMark = Math.round((0.5 - (j + 0.5) / H) * 180);
  console.log(`${latMark>0?'+:':':'}${Math.abs(latMark)}° |${line}|`);
}
console.log('-------------------------------------------------------------');
console.log(`Land coverage: ${(100 * landPct / (landPct + overPct)).toFixed(1)}%`);
