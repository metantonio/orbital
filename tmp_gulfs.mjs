import fs from 'fs';

function inRing(lon, lat, ring) {
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
function parity(lon, lat, rings) {
  let c = 0;
  for (const r of rings) if (inRing(lon, lat, r)) c++;
  return c % 2;
}

const j = JSON.parse(fs.readFileSync('tmp_ne_land.geojson', 'utf8'));
const rawRings = [];
for (const f of j.features) {
  const g = f.geometry;
  if (g.type === 'Polygon') rawRings.push(...g.coordinates);
  else if (g.type === 'MultiPolygon') for (const p of g.coordinates) rawRings.push(...p);
}
const rings = rawRings.map(r => {
  const f = [];
  for (const p of r.slice(0, r.length - 1)) f.push(p[0], p[1]);
  return f;
});

// [lat, lon, name, expectedLand]
const tests = [
  [62, 19, 'Baltic (Bothnia)', 0],
  [57, 18, 'Baltic proper', 0],
  [56, 2, 'North Sea', 0],
  [27, 52, 'Persian Gulf', 0],
  [20, 37, 'Red Sea', 0],
  [15, 89, 'Bay of Bengal', 0],
  [22, 90, 'Gulf of Khambhat', 0],
  [28, 73, 'Arabian Sea', 0],
  [12, 44, 'Gulf of Aden', 0],
  [32, 17, 'Mediterranean', 0],
  [41, 12, 'Gulf of Lion', 0],
  [44, -4, 'Bay of Biscay', 0],
  [47, -2, 'English Channel', 0],
  [61, -7, 'North Sea (Norway)', 0],
  [58, -82, 'Hudson Bay', 0],
  [63, -172, 'Bering Sea', 0],
  [29, -90, 'Gulf of Mexico', 0],
  [26, 97, 'Gulf of Thailand', 0],
  [68, 40, 'White Sea', 0],
  [64, 31, 'Gulf of Finland', 0],
  [69, 33, 'Kola Bay', 0],
  // land confirmations
  [55, 12, 'Bavaria', 1],
  [40, -4, 'Spain', 1],
  [36, 24, 'Greece', 1],
  [61, 25, 'Sweden', 1],
  [51, -3, 'Wales', 1],
  [64, -22, 'Iceland center', 1],
  [53, 30, 'Ukraine', 1],
  [20, 60, 'Arabia', 1],
  [45, 95, 'Mongolia', 1],
  [35, 118, 'China', 1],
  [20, 105, 'Vietnam', 1],
  [-2, 118, 'Java', 1],
  [6, 100, 'Malay Peninsula', 1],
  [-22, 142, 'Australia inland', 1],
  [60, -110, 'Canada', 1],
  [0, 22, 'Congo', 1],
  [-20, 26, 'S. Africa', 1],
  [50, -55, 'Quebec', 1],
  [39, -105, 'Colorado', 1],
  [-15, -47, 'Amazon', 1],
  [72, -42, 'Greenland', 1],
  [80, -70, 'Greenland north', 1],
  [-70, 0, 'Antarctica', 1],
];
let ok = 0, bad = 0;
for (const [lat, lon, name, want] of tests) {
  const got = parity(lon, lat, rings);
  const good = got === want;
  if (good) ok++; else bad++;
  console.log(`${good ? 'PASS' : 'FAIL'}  ${name.padEnd(22)} lat=${String(lat).padStart(6)} lon=${String(lon).padStart(8)}  expected=${want} got=${got}`);
}
console.log(`\n${ok}/${ok + bad} passed`);
