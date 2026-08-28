import fs from 'fs';

const j = JSON.parse(fs.readFileSync('tmp_ne_land.geojson', 'utf8'));
const rawRings = [];
for (const f of j.features) {
  const g = f.geometry;
  if (g.type === 'Polygon') rawRings.push(...g.coordinates);
  else if (g.type === 'MultiPolygon') for (const p of g.coordinates) rawRings.push(...p);
}
const ring = rawRings[95].map(p => [p[0], p[1]]).slice(0, rawRings[95].length - 1);
console.log('r95 pts:', ring.length);

function dump(name, lonMin, lonMax, latMin, latMax) {
  const pts = ring
    .map((p, i) => ({ p, i }))
    .filter(o => o.p[0] >= lonMin && o.p[0] <= lonMax && o.p[1] >= latMin && o.p[1] <= latMax)
    .sort((a, b) => a.i - b.i);
  console.log(`\n${name}: ${pts.length} points (in ring order)`);
  for (const o of pts) console.log(`  [${o.i}] ${o.p[0].toFixed(3)}, ${o.p[1].toFixed(3)}`);
}

dump('Bering (63-66N, -172..-145W)', -172, -145, 62, 67);
dump('Caribbean (13-16N, -92..-82W)', -92, -82, 12, 17);
dump('Patagonia (-42..-37S, -75..-66W)', -75, -66, -43, -36);
