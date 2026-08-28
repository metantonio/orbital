// Inserts the EARTH_LAND_PNG_DATA constant (base64 PNG of the verified land mask)
// into index.html, immediately before `class TextureFactory {`.
import { readFileSync, writeFileSync } from 'fs';

const htmlPath = 'index.html';
const pngPath = 'tmp_earth_mask.png';

const html = readFileSync(htmlPath, 'utf8');
const b64 = readFileSync(pngPath).toString('base64');

const anchor = 'class TextureFactory {';
if (!html.includes(anchor)) throw new Error('anchor not found');
if (html.includes('EARTH_LAND_PNG_DATA')) {
  console.log('EARTH_LAND_PNG_DATA already present; updating in place.');
  const re = /const EARTH_LAND_PNG_DATA = 'data:image\/png;base64,[^']*';/;
  const header = `/* ===========================================================================
   7b. REAL EARTH LAND MASK (Natural Earth 50m coastlines)
   Generated offline from Natural Earth 50m land polygons (see tmp_earth_mask.mjs).
   Equirectangular 2048x1024: u=0 -> lon -180, v=0 -> lat +90. Pixel = coverage 0-255.
   =========================================================================== */
const EARTH_LAND_PNG_DATA = 'data:image/png;base64,${b64}';`;
  writeFileSync(htmlPath, html.replace(re, header));
} else {
  const block = `/* ===========================================================================
   7b. REAL EARTH LAND MASK (Natural Earth 50m coastlines)
   Generated offline from Natural Earth 50m land polygons (see tmp_earth_mask.mjs).
   Equirectangular 2048x1024: u=0 -> lon -180, v=0 -> lat +90. Pixel = coverage 0-255.
   =========================================================================== */
const EARTH_LAND_PNG_DATA = 'data:image/png;base64,${b64}';

class TextureFactory {`;
  writeFileSync(htmlPath, html.replace(anchor, block));
}

const out = readFileSync(htmlPath, 'utf8');
const m = out.match(/data:image\/png;base64,[^']+/);
console.log('OK. Data URL chars:', m ? m[0].length : -1, '| PNG bytes:', readFileSync(pngPath).length, '| b64 chars:', b64.length);
console.log('HTML size now:', out.length);
