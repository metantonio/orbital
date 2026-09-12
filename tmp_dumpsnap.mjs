// Vuelca a disco las "fotografías" que genera PlanetSnapshot para cada cuerpo.
import { createRequire } from 'module';
import fs from 'fs';

const require = createRequire('C:/Repositorios/deepseek-harness/package.json');
const { chromium } = require('playwright');

const KEYS = process.argv.slice(2);
if (!KEYS.length) { console.log('keys requeridos'); process.exit(2); }

const browser = await chromium.connectOverCDP('http://127.0.0.1:9333');
const ctx = browser.contexts()[0] || await browser.newContext();
const page = await ctx.newPage();
const logs = [];
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));

await page.goto('http://127.0.0.1:8123/index.html', { waitUntil: 'load', timeout: 60000 });
await page.waitForFunction('!!window.__ORBIT && !!window.__ORBIT.bodies', null, { timeout: 180000 });
await page.evaluate('window.__ORBIT.clock.paused = true');

const report = [];
for (const key of KEYS) {
  const r = await page.evaluate(async (key) => {
    const body = window.__ORBIT.bodies[key] || window.__ORBIT.moons[key];
    let url = null, err = null;
    try { url = window.__DBG.PlanetSnapshot.capture(body, window.__ORBIT); } catch (e) { err = String((e && e.message) || e); }
    let stats = null;
    if (url) {
      const img = new Image();
      await new Promise((res) => { img.onload = res; img.onerror = res; img.src = url; });
      const c = document.createElement('canvas');
      c.width = img.naturalWidth || 1024; c.height = img.naturalHeight || 1024;
      const cx = c.getContext('2d');
      cx.drawImage(img, 0, 0);
      const d = cx.getImageData(0, 0, c.width, c.height).data;
      let sum = 0, mx = 0, bright = 0, n = 0;
      for (let i = 0; i < d.length; i += 4 * 7) {
        const l = (d[i] + d[i + 1] + d[i + 2]) / 3;
        sum += l; if (l > mx) mx = l; if (l > 12) bright++; n++;
      }
      stats = { avg: +(sum / n).toFixed(1), max: Math.round(mx), brightPct: +(100 * bright / n).toFixed(2), dims: c.width + 'x' + c.height };
    }
    return { key, hasUrl: !!url, urlLen: url ? url.length : 0, err, stats, url };
  }, key);

  const url = r.url;
  delete r.url;
  if (url) {
    const b64 = url.split(',')[1];
    if (b64) fs.writeFileSync(`tmp_snap_${key}.jpg`, Buffer.from(b64, 'base64'));
  }
  report.push(r);
}

console.log(JSON.stringify(report, null, 2));
console.log('--- first console msgs ---');
console.log(logs.slice(0, 10).join('\n').slice(0, 3000));
await browser.close();
