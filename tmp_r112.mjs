import fs from 'fs';

const j = JSON.parse(fs.readFileSync('tmp_ne_land.geojson', 'utf8'));
const rawRings = [];
for (const f of j.features) {
  const g = f.geometry;
  if (g.type === 'Polygon') rawRings.push(...g.coordinates);
  else if (g.type === 'MultiPolygon') for (const p of g.coordinates) rawRings.push(...p);
}
const ring = rawRings[112].map(p => [p[0], p[1]]).slice(0, rawRings[112].length - 1);
console.log('ring pts:', ring.length);
// points near the equator (|lat| < 8), sorted by lon
const nearEq = ring.filter(p => Math.abs(p[1]) < 8).sort((a, b) => a[0] - b[0]);
console.log('near-equator points (lon, lat):');
for (const p of nearEq) console.log(`  ${p[0].toFixed(3)}, ${p[1].toFixed(3)}`);
// points in North Sea region (50-55N, -5..5E)
const north = ring.filter(p => p[1] > 49 && p[1] < 56 && p[0] > -8 && p[0] < 8).sort((a, b) => a[1] - b[1]);
console.log('North Sea region points (lat 49-56, lon -8..8):');
for (const p of north) console.log(`  ${p[0].toFixed(3)}, ${p[1].toFixed(3)}`);
// points in Arabian Sea (60-75E, 15-30N)
const ar = ring.filter(p => p[0] > 55 && p[0] < 75 && p[1] > 12 && p[1] < 32).sort((a, b) => b[1] - a[1]);
console.log('Arabian region points (lon 55-75, lat 12-32):');
for (const p of ar) console.log(`  ${p[0].toFixed(3)}, ${p[1].toFixed(3)}`);
