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
const bbox = rings.map(r => {
  let a = 1e9, b = -1e9, c = 1e9, d = -1e9;
  for (let k = 0; k < r.length; k += 2) {
    if (r[k] < a) a = r[k]; if (r[k] > b) b = r[k];
    if (r[k + 1] < c) c = r[k + 1]; if (r[k + 1] > d) d = r[k + 1];
  }
  return [a, b, c, d];
});

const pts = [
  [0, 30, 'IndianOcean'], [65, -150, 'BeringSea'], [14, -88, 'Caribbean'],
  [-40, -70, 'SAtlantic'], [-8, 25, 'Indian4'], [48.5, -3, 'EnglishCh'],
  [49.5, 0.5, 'Dover'], [51, 2, 'NorthSea'], [56, 25, 'BalticWide'],
  [54, -70, 'StLawrence'], [64, -160, 'Bering'], [48, 135, 'SeaOfJapan'],
  [66, 50, 'KaraSea'],
  // land failures
  [20, 60, 'EmptyQ'], [72, 150, 'ESib'], [-65, 150, 'Ant150'], [-66, 30, 'Ant30'],
  [76, -19, 'GreenN'], [40, 14, 'Sicily'], [38, -9, 'Portugal'], [47, -3, 'France'],
  [-45, -70, 'PatS'],
];
for (const [lat, lon, name] of pts) {
  const hits = [];
  for (let i = 0; i < rings.length; i++) {
    if (inRing(lon, lat, rings[i])) {
      const [a, b, c, d] = bbox[i];
      hits.push(`r${i}[${a.toFixed(0)},${b.toFixed(0)},${c.toFixed(0)},${d.toFixed(0)}]`);
    }
  }
  console.log(`${name.padEnd(13)} lat=${String(lat).padStart(6)} lon=${String(lon).padStart(7)}  n=${hits.length}  ${hits.join(' ')}`);
}
