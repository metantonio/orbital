import fs from 'fs';

const j = JSON.parse(fs.readFileSync('tmp_ne_land.geojson', 'utf8'));

// Collect rings: [lon, lat] pairs, closed (first==last in GeoJSON)
const rings = [];
for (const f of j.features) {
  const g = f.geometry;
  if (g.type === 'Polygon') rings.push(...g.coordinates);
  else if (g.type === 'MultiPolygon') for (const p of g.coordinates) rings.push(...p);
}

// Douglas-Peucker on a closed ring (simplify the open chain, keep closure)
function perpDist(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(p[0] - a[0], p[1] - a[1]);
  let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const px = a[0] + t * dx, py = a[1] + t * dy;
  return Math.hypot(p[0] - px, p[1] - py);
}

function dpSimplify(points, tol) {
  // points: open chain [p0..pn]; returns kept indices
  const n = points.length - 1;
  const keep = new Uint8Array(n + 1);
  keep[0] = keep[n] = 1;
  const stack = [[0, n]];
  while (stack.length) {
    const [s, e] = stack.pop();
    let maxD = 0, maxI = -1;
    for (let i = s + 1; i < e; i++) {
      const d = perpDist(points[i], points[s], points[e]);
      if (d > maxD) { maxD = d; maxI = i; }
    }
    if (maxD > tol) {
      keep[maxI] = 1;
      stack.push([s, maxI], [maxI, e]);
    }
  }
  const out = [];
  for (let i = 0; i <= n; i++) if (keep[i]) out.push(points[i]);
  return out;
}

const TOL = 0.03; // degrees; 2048px/360deg => 5.69 px/deg, 0.03 deg ~ 0.17 px
const outRings = [];
let totalPts = 0;
for (const r of rings) {
  // GeoJSON ring is closed: r[0] === r[last]. Drop the duplicate, simplify open chain.
  const open = r.slice(0, r.length - 1);
  if (open.length < 3) continue;
  let simplified = dpSimplify(open, TOL);
  if (simplified.length < 3) simplified = [open[0], open[1], open[open.length - 1]];
  // Round to 0.1 deg -> integer units
  const int = simplified.map(p => [Math.round(p[0] * 10), Math.round(p[1] * 10)]);
  // Drop consecutive duplicates
  const dedup = [];
  for (let i = 0; i < int.length; i++) {
    const p = int[i], q = int[(i + 1) % int.length];
    if (i === 0) {
      // first point: compare with last (before appending)
      dedup.push(p);
    } else if (p[0] !== dedup[dedup.length - 1][0] || p[1] !== dedup[dedup.length - 1][1]) {
      dedup.push(p);
    }
  }
  // If first and last identical, drop last (closure implicit)
  if (dedup.length > 1 &&
      dedup[0][0] === dedup[dedup.length - 1][0] &&
      dedup[0][1] === dedup[dedup.length - 1][1]) {
    dedup.pop();
  }
  if (dedup.length < 3) continue;
  const flat = [];
  for (const p of dedup) flat.push(p[0], p[1]);
  outRings.push(flat);
  totalPts += flat.length / 2;
}

// Emit compact JS
let js = '// Real Earth coastlines: Natural Earth 110m land polygons (public domain),\n';
js += '// simplified (Douglas-Peucker 0.03 deg) and stored as integer lon/lat * 10.\n';
js += '// Flat pairs [lon,lat] per ring; evenodd fill handles the Caspian-sea hole.\n';
js += 'const LAND_RINGS = [';
js += outRings.map(r => '[' + r.join(',') + ']').join(',');
js += '];\n';
fs.writeFileSync('tmp_land_rings.js', js);

const buf = Buffer.from(js, 'utf8');
console.log('rings=' + outRings.length + ' pts=' + totalPts + ' bytes=' + buf.length);
