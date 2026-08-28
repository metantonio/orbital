import fs from 'fs';
import zlib from 'zlib';

// ---- load LAND_RINGS ----
const code = fs.readFileSync('tmp_land_rings.js', 'utf8');
const LAND_RINGS = new Function(code + '; return LAND_RINGS;')();

// ---- evenodd point-in-rings test (degrees) ----
function isLand(lon, lat) {
  let inside = false;
  for (const ring of LAND_RINGS) {
    const n = ring.length / 2;
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const xi = ring[i * 2] / 10, yi = ring[i * 2 + 1] / 10;
      const xj = ring[j * 2] / 10, yj = ring[j * 2 + 1] / 10;
      if (((yi > lat) !== (yj > lat)) &&
          lon < (xj - xi) * (lat - yi) / (yj - yi) + xi) inside = !inside;
    }
  }
  return inside;
}

// ---- spot checks: [lat, lon, expectedLand, label] ----
const checks = [
  [18, 2, 1, 'Sahara'], [-10, -55, 1, 'Brazil'], [35, 140, 1, 'Japan'],
  [50, 10, 1, 'Europe'], [-25, 135, 1, 'Australia'], [60, 100, 1, 'Siberia'],
  [-3, -60, 1, 'Amazon'], [20, 78, 1, 'India'], [-33, 18, 1, 'Cape region'],
  [45, -100, 1, 'GreatPlains'], [65, -20, 1, 'Greenland'], [75, -40, 1, 'GreenlandN'],
  [20, -150, 0, 'Pacific'], [0, -30, 0, 'Atlantic'], [-20, 75, 0, 'IndianOcean'],
  [35, 15, 0, 'Mediterranean'], [42, 51, 0, 'Caspian'], [60, -85, 0, 'HudsonBay'],
  [44, -84, 0, 'GreatLakes'], [60, 20, 0, 'Baltic'], [40, 145, 0, 'SeaOfJapan'],
  [55, -60, 0, 'LabradorSea'], [30, 50, 0, 'ArabianSea'], [-19, 47, 1, 'Madagascar'],
  [-45, 170, 1, 'NewZealand'], [72, -40, 1, 'GreenlandCenter'],
  [63, -19, 1, 'Iceland'], [12, -86, 1, 'Panama'], [58, 25, 0, 'GulfOfFinland'],
];
let fail = 0;
for (const [lat, lon, exp, label] of checks) {
  const got = isLand(lon, lat) ? 1 : 0;
  if (got !== exp) { fail++; console.log(`FAIL ${label}: lat=${lat} lon=${lon} expected=${exp} got=${got}`); }
}
console.log('checks: ' + (checks.length - fail) + '/' + checks.length + ' passed');

// ---- render 1024x512 PNG ----
const W = 1024, H = 512;
const raw = Buffer.alloc((W * 4 + 1) * H);
let land = 0;
for (let y = 0; y < H; y++) {
  raw[y * (W * 4 + 1)] = 0; // filter: none
  for (let x = 0; x < W; x++) {
    const lon = (x / W) * 360 - 180;
    const lat = 90 - (y / H) * 180;
    const l = isLand(lon, lat) ? 255 : 0;
    if (l) land++;
    raw[y * (W * 4 + 1) + 1 + x * 4] = l;
    raw[y * (W * 4 + 1) + 2 + x * 4] = l;
    raw[y * (W * 4 + 1) + 3 + x * 4] = l;
    raw[y * (W * 4 + 1) + 4 + x * 4] = 255;
  }
}
console.log('land fraction: ' + (land / (W * H) * 100).toFixed(2) + '% (real ~29.2%)');

// ---- minimal PNG encoder (RGBA8) ----
function crc32(buf) {
  let c, table = crc32.table;
  if (!table) {
    table = crc32.table = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c;
    }
  }
  c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const t = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crc]);
}
const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8; ihdr[9] = 6; // 8-bit RGBA
const png = Buffer.concat([sig, chunk('IHDR', ihdr),
  chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
fs.writeFileSync('tmp_land_render.png', png);
console.log('wrote tmp_land_render.png');
