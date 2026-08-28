import fs from 'fs';
const j = JSON.parse(fs.readFileSync('tmp_ne_land.geojson', 'utf8'));
console.log('type:', j.type, ' features:', j.features.length);
for (const f of j.features) {
  const props = f.properties || {};
  const name = props.ADMIN || props.name || props.NAME || props.shapeName || '?';
  // lat/lon bounds
  let minLon = 1e9, maxLon = -1e9, minLat = 1e9, maxLat = -1e9, np = 0;
  const walk = (c) => {
    for (const p of c) {
      if (typeof p[0] === 'number') {
        np++;
        if (p[0] < minLon) minLon = p[0]; if (p[0] > maxLon) maxLon = p[0];
        if (p[1] < minLat) minLat = p[1]; if (p[1] > maxLat) maxLat = p[1];
      } else walk(p);
    }
  };
  walk(f.geometry.coordinates);
  console.log(
    String(props.$id ?? props.ID ?? '?').padStart(6), String(name).padEnd(24),
    `lon[${minLon.toFixed(1)},${maxLon.toFixed(1)}] lat[${minLat.toFixed(1)},${maxLat.toFixed(1)}] pts=${np}`);
}
