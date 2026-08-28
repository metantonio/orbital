import fs from 'fs';

const j = JSON.parse(fs.readFileSync('tmp_ne_land.geojson', 'utf8'));
const rawRings = [];
for (const f of j.features) {
  const g = f.geometry;
  if (g.type === 'Polygon') rawRings.push(...g.coordinates);
  else if (g.type === 'MultiPolygon') for (const p of g.coordinates) rawRings.push(...p);
}

// r95 vertices in the Arctic, in ring order, lat >= 62
const ring = rawRings[95].map(p => [p[0], p[1]]);
const arctic = ring
  .map((p, i) => ({ p, i }))
  .filter(o => o.p[1] >= 62 && o.p[0] < -60 && o.p[0] > -175);
console.log(`r95 Arctic vertices (lat>=62, lon -175..-60), in ring order: ${arctic.length}`);
for (const o of arctic) console.log(`  [${o.i}] ${o.p[0].toFixed(3)}, ${o.p[1].toFixed(3)}`);

// and r112 Arctic vertices (Asia side), lat >= 62, lon > 150
const ring112 = rawRings[112].map(p => [p[0], p[1]]);
const arctic2 = ring112
  .map((p, i) => ({ p, i }))
  .filter(o => o.p[1] >= 62 && o.p[0] > 150);
console.log(`\nr112 Arctic vertices (lat>=62, lon>150), in ring order: ${arctic2.length}`);
for (const o of arctic2) console.log(`  [${o.i}] ${o.p[0].toFixed(3)}, ${o.p[1].toFixed(3)}`);
