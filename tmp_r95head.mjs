import fs from 'fs';

const j = JSON.parse(fs.readFileSync('tmp_ne_land.geojson', 'utf8'));
const rawRings = [];
for (const f of j.features) {
  const g = f.geometry;
  if (g.type === 'Polygon') rawRings.push(...g.coordinates);
  else if (g.type === 'MultiPolygon') for (const p of g.coordinates) rawRings.push(...p);
}

const ring = rawRings[95].map(p => [p[0], p[1]]);
console.log('r95 first 90 vertices:');
for (let i = 0; i < 90; i++) console.log(`  [${i}] ${ring[i][0].toFixed(3)}, ${ring[i][1].toFixed(3)}`);
