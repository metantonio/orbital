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

// [lat, lon, name, expectedLand]  -- coordinates double-checked
const land = [
  [24.7, 46.7, 'Riyadh'], [20, 60, 'EmptyQuarter'], [30.04, 31.24, 'Cairo'],
  [-1.3, 36.8, 'Nairobi'], [51.5, -0.12, 'London'], [41.9, 12.5, 'Rome'],
  [55.75, 37.6, 'Moscow'], [39.9, 116.4, 'Beijing'], [35.68, 139.69, 'Tokyo'],
  [28.6, 77.2, 'Delhi'], [-33.87, 151.21, 'Sydney'], [-34.6, -58.4, 'BuenosAires'],
  [-12.05, -77.04, 'Lima'], [19.4, -99.1, 'MexicoCity'], [45.4, -75.7, 'Ottawa'],
  [61.2, -149.9, 'Anchorage'], [64.15, -21.94, 'Reykjavik'], [59.9, 10.75, 'Oslo'],
  [39.9, 32.85, 'Ankara'], [35.7, 51.4, 'Tehran'], [27.7, 85.3, 'Kathmandu'],
  [13.75, 100.5, 'Bangkok'], [1.35, 103.8, 'Singapore'], [-6.2, 106.85, 'Jakarta'],
  [14.6, 121, 'Manila'], [-41.29, 174.78, 'Wellington'], [-34.93, 138.6, 'Adelaide'],
  [-31.95, 115.86, 'Perth'], [-17.8, 31, 'Harare'], [14.7, -17.45, 'Dakar'],
  [-22.56, 17.08, 'Windhoek'], [15.5, 32.5, 'Khartoum'], [15.35, 44.2, 'Sanaa'],
  [53.9, 27.56, 'Minsk'], [41.7, 44.78, 'Tbilisi'], [43.1, 131.9, 'Vladivostok'],
  [47.9, 106.9, 'Ulaanbaatar'], [78.2, 15.63, 'Longyearbyen'], [68.8, -51.2, 'Aasiaat'],
  [27, 87, 'Himalaya'], [62, 60, 'Urals'], [-6, 150, 'NewGuinea'], [72, 150, 'E.Siberia'],
  [-65, 150, 'Antarctica150E'], [-66, 30, 'Antarctica30E'], [76, -19, 'GreenlandN'],
  [58, 12, 'SwedishCoast'],
  [40, 14, 'Sicily?land'], [45, 15, 'Balkans?land'], [38, -9, 'Portugal'],
  [47, -3, 'France'], [52, 5, 'Netherlands'], [49, 2, 'Belgium'], [50, 15, 'Bohemia'],
  [66, 25, 'LaplandFI'], [71, 27, 'FI?land'], [57, 37, 'N.Europe'], [48, -75, 'NewYork'],
  [34, -118, 'LosAngeles'], [25, -100, 'TexasGulf'], [10, -84, 'CaribbeanCoast'],
  [-3, -60, 'Guiana'], [-23, -65, 'Patagonia'], [-45, 70, 'PatagoniaS'],
  [13, 44, 'BabMandeb?land'], [19, 52, 'Oman'], [27, 60, 'GulfOfOman?land'],
];
const ocean = [
  [10, -30, 'MidAtlantic'], [0, 30, 'IndianOcean'], [35, -70, 'N.MidAtlantic'],
  [-45, -140, 'SPacific'], [60, -30, 'NAtlantic'], [25, 65, 'Indian2'],
  [5, -150, 'EPacific'], [-25, 110, 'WestOfAus'], [65, -150, 'BeringSea'],
  [-60, 140, 'SouthernOcean'], [14, -88, 'Caribbean'], [50, -30, 'Natlantic2'],
  [45, -95, 'GulfOfMexico'], [-15, 95, 'Indian3'], [30, 140, 'EChinaSea'],
  [-35, 175, 'PacificEastNZ'], [60, -85, 'HudsonBay'], [43, 33, 'BlackSea'],
  [35, 35, 'Levant'], [40, 15, 'Ionian'], [-40, -70, 'SAtlantic'], [75, -160, 'Arctic'],
  [70, 170, 'E.Sib.Sea'], [-8, 25, 'Indian4'], [16, 122, 'LuzonStrait'],
  [85, 0, 'NorthPoleOcean'], [88, -100, 'LincolnSea'], [25, 37, 'RedSeaMid'],
  [57, 18, 'Baltic'], [62, 19, 'GulfBothnia'],
  [48.5, -3, 'EnglishCh'], [49.5, 0.5, 'Dover'], [51, 2, 'NorthSeaCattegat'],
  [56, 25, 'BalticWide'], [42, 51, 'Caspian'], [54, -70, 'StLawrence'],
  [64, -160, 'Bering'], [12, 145, 'CoralSea'], [48, 135, 'SeaOfJapan'],
  [66, 50, 'KaraSea'], [-55, -55, 'Drake'], [-30, 15, 'SAtlantic2'],
  [72, 30, 'BarentsSea'], [80, 75, 'LaptevSeaN'],
];
let ok = 0, bad = 0;
for (const [lat, lon, name] of land) {
  const got = parity(lon, lat, rings);
  const good = got === 1;
  if (good) ok++; else { bad++; console.log(`FAIL(land)  ${name.padEnd(16)} lat=${lat} lon=${lon} got=${got}`); }
}
for (const [lat, lon, name] of ocean) {
  const got = parity(lon, lat, rings);
  const good = got === 0;
  if (good) ok++; else { bad++; console.log(`FAIL(ocean) ${name.padEnd(16)} lat=${lat} lon=${lon} got=${got}`); }
}
console.log(`\n${ok}/${ok + bad} passed, ${bad} failures`);
