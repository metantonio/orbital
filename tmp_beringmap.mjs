import fs from 'fs';

const j = JSON.parse(fs.readFileSync('tmp_ne_land.geojson', 'utf8'));
const rawRings = [];
for (const f of j.features) {
  const g = f.geometry;
  if (g.type === 'Polygon') rawRings.push(...g.coordinates);
  else if (g.type === 'MultiPolygon') for (const p of g.coordinates) rawRings.push(...p);
}

function landSegments(ringIdx, lat) {
  const ring = rawRings[ringIdx].map(p => [p[0], p[1]]).slice(0, rawRings[ringIdx].length - 1);
  const n = ring.length;
  const hits = [];
  for (let i = 0, jj = n - 1; i < n; jj = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[jj][0], yj = ring[jj][1];
    if ((yi > lat) !== (yj > lat)) {
      const x = xi + (lat - yi) * (xj - xi) / (yj - yi);
      hits.push(x);
    }
  }
  hits.sort((a, b) => a - b);
  const segs = [];
  let inside = false, start = -180;
  for (const x of hits) {
    if (inside) segs.push(`${start.toFixed(1)}..${x.toFixed(1)}`);
    else start = x;
    inside = !inside;
  }
  if (inside) segs.push(`${start.toFixed(1)}..180`);
  return segs;
}

console.log('--- Bering / Arctic (r95) ---');
for (const lat of [64, 65, 66, 67]) {
  console.log(`lat=${lat}: ${landSegments(95, lat).join(' | ') || '(none)'}`);
}
console.log('--- Caribbean (r95) ---');
for (const lat of [13, 14, 15]) {
  console.log(`lat=${lat}: ${landSegments(95, lat).join(' | ') || '(none)'}`);
}
console.log('--- Patagonia (r95) ---');
for (const lat of [-39, -40, -41]) {
  console.log(`lat=${lat}: ${landSegments(95, lat).join(' | ') || '(none)'}`);
}
console.log('--- Africa / Indian Ocean (r112) ---');
for (const lat of [-8, 0, 10]) {
  console.log(`lat=${lat}: ${landSegments(112, lat).join(' | ') || '(none)'}`);
}
console.log('--- North Sea / Baltic (r112) ---');
for (const lat of [50, 53, 55]) {
  console.log(`lat=${lat}: ${landSegments(112, lat).join(' | ') || '(none)'}`);
}
console.log('--- Sea of Japan / Okhotsk (r112) ---');
for (const lat of [46, 48, 50]) {
  console.log(`lat=${lat}: ${landSegments(112, lat).join(' | ') || '(none)'}`);
}
console.log('--- Kara / Barents (r112) ---');
for (const lat of [64, 66, 68]) {
  console.log(`lat=${lat}: ${landSegments(112, lat).join(' | ') || '(none)'}`);
}
