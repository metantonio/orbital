import fs from 'fs';
const j = JSON.parse(fs.readFileSync('tmp_ne_land.geojson', 'utf8'));
const targets = {
  Iceland: [-19, 63], UK: [-2, 53], Japan: [138, 37], Madagascar: [47, -19],
  India: [78, 22], Indonesia: [110, -2], 'S.America': [-60, -15], 'N.America': [-100, 45],
  'Eurasia': [40, 55], 'Africa': [15, 15], 'Greenland': [-40, 72], 'Antarctica': [0, -75],
  'SE Asia': [102, 13], 'Caspian-hole?': [51, 42],
};
for (const f of j.features) {
  let minLon = 1e9, maxLon = -1e9, minLat = 1e9, maxLat = -1e9;
  const walk = (c) => {
    for (const p of c) {
      if (typeof p[0] === 'number') {
        if (p[0] < minLon) minLon = p[0]; if (p[0] > maxLon) maxLon = p[0];
        if (p[1] < minLat) minLat = p[1]; if (p[1] > maxLat) maxLat = p[1];
      } else walk(p);
    }
  };
  walk(f.features ? [] : f.geometry.coordinates);
  for (const [name, [lon, lat]] of Object.entries(targets)) {
    if (lon >= minLon && lon <= maxLon && lat >= minLat && lat <= maxLat) {
      console.log(`${name} -> inside bbox lon[${minLon.toFixed(1)},${maxLon.toFixed(1)}] lat[${minLat.toFixed(1)},${maxLat.toFixed(1)}]`);
    }
  }
}
