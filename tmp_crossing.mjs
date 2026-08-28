import fs from 'fs';

const j = JSON.parse(fs.readFileSync('tmp_ne_land.geojson', 'utf8'));
const rawRings = [];
for (const f of j.features) {
  const g = f.geometry;
  if (g.type === 'Polygon') rawRings.push(...g.coordinates);
  else if (g.type === 'MultiPolygon') for (const p of g.coordinates) rawRings.push(...p);
}
const ring = rawRings[112].map(p => [p[0], p[1]]).slice(0, rawRings[112].length - 1);
const n = ring.length;

function crossings(lon, lat) {
  const hits = [];
  let parity = 0;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    if ((yi > lat) !== (yj > lat)) {
      const x = xi + (lat - yi) * (xj - xi) / (yj - yi);
      const toggles = lon < x;
      if (Math.abs(x) < 200) hits.push({ x, xi, yi, xj, yj, toggles, i, j });
    }
  }
  return hits;
}

for (const [lat, lon, name] of [[0, 30, 'IndianOcean(0,30)'], [48.5, -3, 'EnglishCh(48.5,-3)'], [56, 25, 'Baltic(56,25)'], [48, 135, 'SeaOfJapan(48,135)']]) {
  const hits = crossings(lon, lat);
  const sorted = hits.sort((a, b) => a.x - b.x);
  let p = 0;
  console.log(`\n=== ${name}: ${hits.length} crossings at lat=${lat}, point lon=${lon}`);
  for (const h of sorted) {
    const active = h.x > lon ? 1 : 0;
    p += active;
    console.log(`  x=${h.x.toFixed(3)} (${active ? 'COUNTS' : 'not '})  edge i=${h.i}(${h.xi.toFixed(2)},${h.yi.toFixed(2)}) -> j=${h.j}(${h.xj.toFixed(2)},${h.yj.toFixed(2)})`);
  }
  console.log(`  parity after ${lat < 0 ? 'south' : 'north'} ray: ${p % 2} => ${p % 2 ? 'INSIDE' : 'outside'}`);
}
