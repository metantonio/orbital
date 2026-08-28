import fs from 'fs';

const html = fs.readFileSync('index.html', 'utf8');
const ringsJs = fs.readFileSync('tmp_land_rings.js', 'utf8');

// ---- 1. Insert LAND_RINGS + mask machinery before class TextureFactory ----
const cls = 'class TextureFactory {';
const i = html.indexOf(cls);
if (i < 0) throw new Error('class TextureFactory not found');
const landBlock = ringsJs + '\n' +
  '/* Earth land mask built once from LAND_RINGS: hard coastline (Natural Earth\n' +
  '   110m) plus a wrapped box blur giving a smooth ~10deg shore falloff, so the\n' +
  '   field reads 1.0 inland and decays to 0 offshore with the 0.5 threshold\n' +
  '   sitting exactly on the real coastline. */\n' +
  'let LAND_MASK = null;\n' +
  'function buildLandMask() {\n' +
  '  if (LAND_MASK) return LAND_MASK;\n' +
  '  const W = 2048, H = 1024;\n' +
  '  const canvas = document.createElement("canvas");\n' +
  '  canvas.width = W; canvas.height = H;\n' +
  '  const ctx = canvas.getContext("2d", { willReadFrequently: true });\n' +
  '  ctx.fillStyle = "#000";\n' +
  '  ctx.fillRect(0, 0, W, H);\n' +
  '  ctx.fillStyle = "#fff";\n' +
  '  ctx.beginPath();\n' +
  '  for (const ring of LAND_RINGS) {\n' +
  '    for (let k = 0; k < ring.length; k += 2) {\n' +
  '      const x = (ring[k] / 10 + 180) / 360 * W;\n' +
  '      const y = (90 - ring[k + 1] / 10) / 180 * H;\n' +
  '      if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);\n' +
  '    }\n' +
  '    ctx.closePath();\n' +
  '  }\n' +
  '  ctx.fill("evenodd");\n' +
  '  const img = ctx.getImageData(0, 0, W, H).data;\n' +
  '  const hard = new Float32Array(W * H);\n' +
  '  for (let p = 0; p < hard.length; p++) hard[p] = img[p * 4] / 255;\n' +
  '  const R = 57; // ~10 degrees of longitude at 2048px / 360deg\n' +
  '  const win = 2 * R + 1;\n' +
  '  const hbuf = new Float32Array(W * H);\n' +
  '  for (let y = 0; y < H; y++) {\n' +
  '    const row = y * W;\n' +
  '    let sum = 0;\n' +
  '    for (let x = 0; x < win; x++) sum += hard[row + ((x - R) % W + W) % W];\n' +
  '    for (let x = 0; x < W; x++) {\n' +
  '      hbuf[row + x] = sum / win;\n' +
  '      sum += hard[row + (x + R + 1) % W] - hard[row + (((x - R) % W) + W) % W];\n' +
  '    }\n' +
  '  }\n' +
  '  const vbuf = new Float32Array(W * H);\n' +
  '  for (let x = 0; x < W; x++) {\n' +
  '    let sum = 0;\n' +
  '    for (let y = 0; y <= R; y++) sum += hbuf[y * W + x];\n' +
  '    for (let y = 0; y < H; y++) {\n' +
  '      const lo = y < R ? 0 : y - R;\n' +
  '      const hi = y + R >= H - 1 ? H - 1 : y + R;\n' +
  '      vbuf[y * W + x] = sum / (hi - lo + 1);\n' +
  '      if (y + R + 1 <= H - 1) sum += hbuf[(y + R + 1) * W + x];\n' +
  '      if (y - R + 1 >= 0) sum -= hbuf[(y - R + 1) * W + x];\n' +
  '    }\n' +
  '  }\n' +
  '  const field = new Float32Array(W * H);\n' +
  '  for (let p = 0; p < field.length; p++) field[p] = Math.max(hard[p], vbuf[p]);\n' +
  '  LAND_MASK = { data: field, w: W, h: H };\n' +
  '  return LAND_MASK;\n' +
  '}\n\n';
const html2 = html.slice(0, i) + landBlock + html.slice(i);

// ---- 2. Replace _landField body ----
const startMarker = '  static _landField(u, v) {';
const s = html2.indexOf(startMarker);
if (s < 0) throw new Error('_landField start not found');
const endMarker = '\n  static _earth() {';
const e = html2.indexOf(endMarker, s);
if (e < 0) throw new Error('_landField end not found');

const newField = '  static _landField(u, v) {\n' +
  '    // Continuous land/ocean field in ~[0,1] sampled from the real (Natural\n' +
  '    // Earth 110m) coastline mask: ~0 open ocean, 1 deep continent, smooth\n' +
  '    // ~10deg shore falloff, and a tiny meander term so the shoreline is not\n' +
  '    // perfectly clean. Threshold 0.5 sits on the actual coast.\n' +
  '    const m = TextureFactory._getLandMask();\n' +
  '    const W = m.w, H = m.h;\n' +
  '    const gx = clamp(u, 0, 1) * (W - 1) - 0.5;\n' +
  '    const gy = clamp(v, 0, 1) * (H - 1) - 0.5;\n' +
  '    const x0 = Math.floor(gx), y0 = Math.floor(gy);\n' +
  '    const tx = gx - x0, ty = gy - y0;\n' +
  '    const xr0 = ((x0 % W) + W) % W;\n' +
  '    const xr1 = (xr0 + 1) % W;\n' +
  '    const yr0 = Math.max(0, Math.min(H - 1, y0));\n' +
  '    const yr1 = Math.max(0, Math.min(H - 1, y0 + 1));\n' +
  '    const d = m.data;\n' +
  '    const i00 = d[yr0 * W + xr0], i01 = d[yr0 * W + xr1];\n' +
  '    const i10 = d[yr1 * W + xr0], i11 = d[yr1 * W + xr1];\n' +
  '    let field = i00 + (i01 - i00) * tx + (i10 - i00) * ty + (i00 - i01 - i10 + i11) * tx * ty;\n' +
  '\n' +
  '    // Fine coastline meander: only within ~2deg of the true coast.\n' +
  '    const dist = Math.abs(field - 0.5);\n' +
  '    if (dist < 0.10) {\n' +
  '      const band = 1 - (dist / 0.10) * (dist / 0.10);\n' +
  '      field += (fbm(u * 46 + 3.7, v * 28 + 9.1, 3) - 0.5) * 0.12 * band;\n' +
  '    }\n' +
  '    return field < 0 ? 0 : (field > 1 ? 1 : field);\n' +
  '  }\n' +
  '\n  static _getLandMask() { return buildLandMask(); }\n\n';

const html3 = html2.slice(0, s) + newField + html2.slice(e);
fs.writeFileSync('index.html', html3);
console.log('spliced ok, new size:', Buffer.byteLength(html3));
