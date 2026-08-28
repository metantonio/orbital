import fs from 'fs';

const j = JSON.parse(fs.readFileSync('tmp_ne_land.geojson', 'utf8'));
const rawRings = [];
for (const f of j.features) {
  const g = f.geometry;
  if (g.type === 'Polygon') rawRings.push(...g.coordinates);
  else if (g.type === 'MultiPolygon') for (const p of g.coordinates) rawRings.push(...p);
}
// ALL rings: points in Sea of Okhotsk / Kuril / Kamchatka region (lon 130-170, lat 40-62)
for (let ri = 0; ri < rawRings.length; ri++) {
  const ring = rawRings[ri].map(p => [p[0], p[1]]).slice(0, rawRings[ri].length - 1);
  const pts = ring.filter(p => p[0] > 130 && p[0] < 170 && p[1] > 40 && p[1] < 62);
  if (!pts.length) continue;
  console.log(`\nring ${ri} (${ring.length} pts):`);
  for (const p of pts) console.log(`  ${p[0].toFixed(2)}, ${p[1].toFixed(2)}`);
}
