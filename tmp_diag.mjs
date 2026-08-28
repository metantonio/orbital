import fs from 'fs';

// ---- PIP ----
function inRing(lon, lat, ring) {
  // ring: flat [lon,lat,...] in degrees, implicitly closed
  let inside = false;
  const n = ring.length / 2;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = ring[i * 2], yi = ring[i * 2 + 1];
    const xj = ring[j * 2], yj = ring[j * 2 + 1];
    if (((yi > lat) !== (yj > lat)) &&
        lon < (xj - xi) * (lat - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
function countRings(lon, lat, rings) {
  let c = 0;
  const hits = [];
  for (let r = 0; r < rings.length; r++) {
    if (inRing(lon, lat, rings[r])) { c++; if (hits.length < 8) hits.push(r); }
  }
  return { c, hits };
}

// ---- raw GeoJSON ----
const j = JSON.parse(fs.readFileSync('tmp_ne_land.geojson', 'utf8'));
const rawRings = [];
for (const f of j.features) {
  const g = f.geometry;
  if (g.type === 'Polygon') rawRings.push(...g.coordinates);
  else if (g.type === 'MultiPolygon') for (const p of g.coordinates) rawRings.push(...p);
}
// flat [lon,lat,...], degrees, closure dropped
const rawFlat = rawRings.map(r => {
  const open = r.slice(0, r.length - 1);
  const f = [];
  for (const p of open) f.push(p[0], p[1]);
  return f;
});

// ---- LAND_RINGS (int*10), flat ----
const code = fs.readFileSync('tmp_land_rings.js', 'utf8');
const LAND_RINGS = new Function(code + '; return LAND_RINGS;')();
const intRings = LAND_RINGS.map(f => f.map(x => x / 10));

const checks = [
  [35, 140, 'Japan'], [-33, 18, 'CapeRegion'], [44, -84, 'GreatLakes'],
  [55, -60, 'LabradorSea'], [63, -19, 'Iceland'], [58, 25, 'GulfOfFinland'],
  [18, 2, 'Sahara'], [-10, -55, 'Brazil'], [50, 10, 'Europe'], [-25, 135, 'Australia'],
  [60, 100, 'Siberia'], [0, -30, 'Atlantic'], [35, 15, 'Mediterranean'],
  [42, 51, 'Caspian'], [-19, 47, 'Madagascar'], [-45, 170, 'NewZealand'],
  [72, -40, 'GreenlandCenter'], [12, -86, 'Panama'],
];

console.log('point            rawCount  rawHits              intCount  intHits');
for (const [lat, lon, label] of checks) {
  const a = countRings(lon, lat, rawFlat);
  const b = countRings(lon, lat, intRings);
  const flag = (a.c % 2) !== (b.c % 2) ? '  <<<' : '';
  console.log(
    `${label.padEnd(16)} lat=${String(lat).padStart(6)} lon=${String(lon).padStart(7)}  ` +
    `${String(a.c).padStart(3)}    [${a.hits.join(',')}]  ${String(b.c).padStart(3)}    [${b.hits.join(',')}]${flag}`);
}

// ring stats
console.log('\nraw rings=' + rawFlat.length + '  int rings=' + intRings.length);
console.log('raw ring pts:', rawFlat.map(r => r.length / 2).join(','));
console.log('int ring pts:', intRings.map(r => r.length / 2).join(','));
