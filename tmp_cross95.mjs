import fs from 'fs';

function run(j, ringIdx, lat, lon, name) {
  const ring = j.features;
  // rebuild ring from rawRings
}

const j = JSON.parse(fs.readFileSync('tmp_ne_land.geojson', 'utf8'));
const rawRings = [];
for (const f of j.features) {
  const g = f.geometry;
  if (g.type === 'Polygon') rawRings.push(...g.coordinates);
  else if (g.type === 'MultiPolygon') for (const p of g.coordinates) rawRings.push(...p);
}

function crossings(ringIdx, lon, lat) {
  const ring = rawRings[ringIdx].map(p => [p[0], p[1]]).slice(0, rawRings[ringIdx].length - 1);
  const n = ring.length;
  const hits = [];
  for (let i = 0, jj = n - 1; i < n; jj = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[jj][0], yj = ring[jj][1];
    if ((yi > lat) !== (yj > lat)) {
      const x = xi + (lat - yi) * (xj - xi) / (yj - yi);
      if (x > lon) hits.push({ x, xi, yi, xj, yj, i, jj });
    }
  }
  return hits.sort((a, b) => a.x - b.x);
}

for (const [lat, lon, name] of [[65, -150, 'Bering(65,-150)'], [14, -88, 'Caribbean(14,-88)'], [-40, -70, 'Patagonia(-40,-70)']]) {
  const hits = crossings(95, lon, lat);
  console.log(`\n=== r95 ${name}: ${hits.length} east crossings from lon=${lon} at lat=${lat}`);
  for (const h of hits) {
    console.log(`  x=${h.x.toFixed(3)}  edge i=${h.i}(${h.xi.toFixed(2)},${h.yi.toFixed(2)}) -> j=${h.jj}(${h.xj.toFixed(2)},${h.yj.toFixed(2)})`);
  }
  console.log(`  => ${hits.length % 2 ? 'INSIDE' : 'outside'}`);
}
