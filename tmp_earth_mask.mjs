// Build the real-Earth land mask (Natural Earth 50m) for the ORBIT simulation.
// Rasterizes land polygons to a 2048x1024 equirectangular coverage map (8-bit,
// 2x supersampled for soft coastlines) and emits:
//   tmp_earth_mask.png          full-res grayscale PNG (data-URL embed candidate)
//   tmp_earth_mask_preview.png  512x256 preview for visual check
//   tmp_earth_mask_rle.txt      RLE base64 alternative
//   stats + point checks on stdout
import fs from 'fs';
import zlib from 'zlib';

const W = 2048, H = 1024;
const SS = 2;
const W2 = W * SS, H2 = H * SS;

const gj = JSON.parse(fs.readFileSync('tmp_ne_50m_land.geojson', 'utf8'));

// ---------- collect rings ----------
const rings = [];
for (const f of gj.features) {
  const g = f.geometry;
  if (g.type === 'Polygon') g.coordinates.forEach(r => rings.push(r));
  else if (g.type === 'MultiPolygon') g.coordinates.forEach(p => p.forEach(r => rings.push(r)));
}

// ---------- antimeridian-unwrap, clip to map, wrap copies ----------
const segs = []; // {x1,y1,x2,y2,yMin,yMax}
function addSeg(x1, y1, x2, y2) {
  if (x1 === x2 && y1 === y2) return;
  segs.push({ x1, y1, x2, y2, yMin: Math.min(y1, y2), yMax: Math.max(y1, y2) });
}
function emitSeg(x1, y1, x2, y2) {
  // Liang-Barsky clip to x in [0, W2]
  const dx = x2 - x1, dy = y2 - y1;
  let t0 = 0, t1 = 1;
  let ok = true;
  if (dx === 0) { if (x1 < 0 || x1 > W2) return; }
  else {
    const p1 = -dx, q1 = x1;
    const p2 = dx, q2 = W2 - x1;
    if (p1 === 0 && q1 < 0) return;
    if (p2 === 0 && q2 < 0) return;
    if (p1 !== 0) { const r = q1 / p1; if (p1 < 0) { if (r > t1) return; if (r > t0) t0 = r; } else { if (r < t0) return; if (r < t1) t1 = r; } }
    if (p2 !== 0) { const r = q2 / p2; if (p2 < 0) { if (r > t1) return; if (r > t0) t0 = r; } else { if (r < t0) return; if (r < t1) t1 = r; } }
  }
  if (t0 > t1) return;
  const cx1 = x1 + t0 * dx, cy1 = y1 + t0 * dy;
  const cx2 = x1 + t1 * dx, cy2 = y1 + t1 * dy;
  addSeg(cx1, cy1, cx2, cy2);
  // wrapped copy for parts beyond the right edge
  if (x2 > W2 || x1 > W2) {
    const wx1 = x1 - W2, wx2 = x2 - W2;
    if (wx2 < 0 || wx1 < 0) {
      // re-clip shifted segment
      const wdx = wx2 - wx1;
      let wt0 = 0, wt1 = 1;
      if (wdx === 0) { if (wx1 < 0 || wx1 > W2) return; }
      else {
        const p1 = -wdx, q1 = wx1;
        const p2 = wdx, q2 = W2 - wx1;
        if (p1 === 0 && q1 < 0) return;
        if (p2 === 0 && q2 < 0) return;
        if (p1 !== 0) { const r = q1 / p1; if (p1 < 0) { if (r > wt1) return; if (r > wt0) wt0 = r; } else { if (r < wt0) return; if (r < wt1) wt1 = r; } }
        if (p2 !== 0) { const r = q2 / p2; if (p2 < 0) { if (r > wt1) return; if (r > wt0) wt0 = r; } else { if (r < wt0) return; if (r < wt1) wt1 = r; } }
        if (wt0 > wt1) return;
        addSeg(wx1 + wt0 * wdx, y1 + wt0 * dy, wx1 + wt1 * wdx, y1 + wt1 * dy);
      }
    }
  }
}

for (const ring of rings) {
  const pts = [];
  let prevLon = null;
  for (const [lon0, lat] of ring) {
    let lon = lon0;
    if (prevLon !== null) {
      if (lon - prevLon > 180) lon -= 360;
      else if (prevLon - lon > 180) lon += 360;
    }
    prevLon = lon;
    const x = (lon + 180) / 360 * W2;
    const y = (90 - lat) / 180 * H2;
    pts.push([x, y]);
  }
  const n = pts.length;
  for (let i = 0; i < n - 1; i++) emitSeg(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]);
  if (pts[0][0] !== pts[n - 1][0] || pts[0][1] !== pts[n - 1][1]) {
    emitSeg(pts[n - 1][0], pts[n - 1][1], pts[0][0], pts[0][1]);
  }
}
console.log('segments:', segs.length);

// ---------- bucket segments by row ----------
const rows = new Array(H2);
for (let i = 0; i < H2; i++) rows[i] = [];
for (const s of segs) {
  const r0 = Math.max(0, Math.ceil(s.yMin - 0.5));
  const r1 = Math.min(H2 - 1, Math.floor(s.yMax - 0.5));
  const inv = (s.y2 - s.y1) === 0 ? 0 : 1 / (s.y2 - s.y1);
  for (let r = r0; r <= r1; r++) {
    const yScan = r + 0.5;
    if ((s.y1 <= yScan && s.y2 > yScan) || (s.y2 <= yScan && s.y1 > yScan)) {
      const x = s.x1 + (yScan - s.y1) * (s.x2 - s.x1) * inv;
      rows[r].push(x);
    }
  }
}

// ---------- even-odd scanline fill at 2x ----------
const grid2 = new Uint8Array(W2 * H2);
for (let r = 0; r < H2; r++) {
  const xs = rows[r];
  if (xs.length < 2) continue;
  xs.sort((a, b) => a - b);
  const base = r * W2;
  for (let i = 0; i + 1 < xs.length; i += 2) {
    const x0 = xs[i], x1 = xs[i + 1];
    let c0 = Math.max(0, Math.ceil(x0 - 0.5));
    let c1 = Math.min(W2 - 1, Math.floor(x1 - 0.5));
    if (c0 <= c1) for (let c = c0; c <= c1; c++) grid2[base + c] = 1;
  }
}

// ---------- downsample to 2048x1024 coverage ----------
const mask = new Uint8Array(W * H);
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    let n = 0;
    n += grid2[(y * 2) * W2 + x * 2];
    n += grid2[(y * 2) * W2 + x * 2 + 1];
    n += grid2[(y * 2 + 1) * W2 + x * 2];
    n += grid2[(y * 2 + 1) * W2 + x * 2 + 1];
    mask[y * W + x] = (n / 4) * 255;
  }
}

// ---------- stats & point checks ----------
let landPx = 0, fullLand = 0;
for (let i = 0; i < W * H; i++) { if (mask[i] > 0) landPx++; if (mask[i] === 255) fullLand++; }
console.log('land fraction (any):', (landPx / (W * H) * 100).toFixed(2) + '%');
console.log('fully-land pixels:', fullLand);

function sample(lon, lat) {
  const x = Math.min(W - 1, Math.max(0, Math.round((lon + 180) / 360 * (W - 1))));
  const y = Math.min(H - 1, Math.max(0, Math.round((90 - lat) / 180 * (H - 1))));
  return mask[y * W + x];
}
const checks = [
  ['Madrid (land)', 40.42, -3.70, 1],
  ['Gulf of Guinea (ocean)', 0, 0, 0],
  ['Hokkaido, Japan (land)', 43.0, 143.2, 1],
  ['Pacific mid (ocean)', -30, -140, 0],
  ['Greenland (land)', 72, -42, 1],
  ['Hudson Bay (ocean)', 58, -85, 0],
  ['Mediterranean (ocean)', 36, 15, 0],
  ['Arabian Sea (ocean)', 15, 65, 0],
  ['Bering Sea (ocean)', 64, -174, 0],
  ['Chukotka (land)', 66, 176, 1],
  ['Caspian Sea (ocean)', 42, 52, 0],
  ['Black Sea (ocean)', 43, 32, 0],
  ['Sahara (land)', 23, 12, 1],
  ['Antarctica (land)', -72, 0, 1],
  ['Fiji (land)', -17.8, 178.0, 1],
  ['New Zealand (land)', -41.3, 174.8, 1],
  ['Baffin (land)', 60, -68, 1],
  ['Gulf of Mexico (ocean)', 25, -92, 0],
  ['Cape York, Australia (land)', -12, 142.5, 1],
  ['Indonesia, Java (land)', -6.8, 110, 1],
];
for (const [name, lat, lon, expect] of checks) {
  const v = sample(lon, lat);
  const got = v >= 200 ? 'land' : (v <= 55 ? 'ocean' : 'coast');
  const ok = (expect === 1) ? v >= 128 : v <= 127;
  console.log((ok ? 'OK  ' : 'FAIL') + ` ${name}: ${v} -> ${got}`);
}

// ---------- PNG encoder (grayscale 8-bit) ----------
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crc]);
}
function encodePNG(width, height, pixels) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 0;  // color type: grayscale
  const raw = Buffer.alloc((width + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width + 1)] = 0; // filter: none
    pixels.copy(raw, y * (width + 1) + 1, y * width, (y + 1) * width);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

const pngFull = encodePNG(W, H, Buffer.from(mask));
fs.writeFileSync('tmp_earth_mask.png', pngFull);
console.log('tmp_earth_mask.png:', pngFull.length, 'bytes; base64:', Math.ceil(pngFull.length / 3) * 4, 'bytes');

// preview 512x256 (2px box average)
const pw = 512, ph = 256;
const prev = new Uint8Array(pw * ph);
for (let y = 0; y < ph; y++) {
  for (let x = 0; x < pw; x++) {
    let s = 0, n = 0;
    for (let dy = 0; dy < 4; dy++) for (let dx = 0; dx < 4; dx++) { s += mask[(y * 4 + dy) * W + (x * 4 + dx)]; n++; }
    prev[y * pw + x] = s / n;
  }
}
fs.writeFileSync('tmp_earth_mask_preview.png', encodePNG(pw, ph, Buffer.from(prev)));

// ---------- RLE alternative ----------
const rle = [];
for (let y = 0; y < H; y++) {
  const rowBase = y * W;
  let i = 0;
  while (i < W) {
    const v = mask[rowBase + i];
    let j = i + 1;
    while (j < W && mask[rowBase + j] === v) j++;
    const len = j - i;
    if (len <= 255) rle.push(len, v);
    else rle.push(0, (len >> 8) & 0xff, len & 0xff, v);
    i = j;
  }
}
const rleB64 = Buffer.from(rle).toString('base64');
fs.writeFileSync('tmp_earth_mask_rle.txt', rleB64);
console.log('RLE base64:', rleB64.length, 'bytes (raw', rle.length, 'bytes)');
console.log('DONE');
