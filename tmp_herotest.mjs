// Diagnóstico del panel de información (fotografía hero del "magazine").
// Se lanza Chrome con --remote-debugging-port (sin tuberías de stdio) y
// nos conectamos por CDP para evitar el límite del sandbox.
import { createRequire } from 'module';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawn } from 'child_process';

const require = createRequire('C:/Repositorios/deepseek-harness/package.json');
const { chromium } = require('playwright');

const ARG_KEYS = process.argv.slice(2);
const KEYS = ARG_KEYS.length ? ARG_KEYS : ['sun', 'mars', 'earth', 'jupiter', 'saturn', 'venus', 'moon'];
const PORT = 9333;
const PROFILE = fs.mkdtempSync(path.join(os.tmpdir(), 'orbit-prof-'));

const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${PROFILE}`,
  '--no-first-run', '--no-default-browser-check', '--disable-sync',
  '--mute-audio', '--hide-scrollbars', '--window-size=1500,950',
  '--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader',
  '--disable-gpu-sandbox', '--no-sandbox', 'about:blank',
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// espera al endpoint CDP
let ready = false;
for (let i = 0; i < 60 && !ready; i++) {
  try {
    const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
    if (res.ok) ready = true;
  } catch (e) { await sleep(500); }
}
if (!ready) { console.log('CDP no disponible'); chrome.kill('SIGTERM'); process.exit(2); }

const logs = [];
const browser = await chromium.connectOverCDP(`http://127.0.0.1:${PORT}`);
const ctx = browser.contexts()[0] || await browser.newContext({ viewport: { width: 1500, height: 950 } });
const page = await ctx.newPage();
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));

await page.goto('http://127.0.0.1:8123/index.html', { waitUntil: 'load', timeout: 60000 });
await page.waitForFunction('!!window.__ORBIT && !!window.__ORBIT.bodies', null, { timeout: 180000 });
await page.evaluate('window.__ORBIT.clock.paused = true');

const report = [];
for (const key of KEYS) {
  const r = await page.evaluate(async (key) => {
    const s = window.__ORBIT;
    s.selectBody(key);
    await new Promise((res) => setTimeout(res, 1400));
    const img = document.getElementById('magHeroImg');
    const frame = document.getElementById('magHeroFrame');
    const title = document.querySelector('.mag-title');
    let stats = null;
    if (img && img.naturalWidth > 0) {
      const c = document.createElement('canvas');
      c.width = 64; c.height = 48;
      const cx = c.getContext('2d');
      cx.drawImage(img, 0, 0, 64, 48);
      const d = cx.getImageData(0, 0, 64, 48).data;
      let sum = 0, mx = 0;
      for (let i = 0; i < d.length; i += 4) {
        const l = (d[i] + d[i + 1] + d[i + 2]) / 3;
        sum += l; if (l > mx) mx = l;
      }
      stats = { avg: +(sum / (d.length / 4)).toFixed(1), max: mx };
    }
    return {
      key,
      title: title ? title.textContent : null,
      hasImg: !!img,
      srcLen: img ? (img.getAttribute('src') || '').length : 0,
      natural: img ? img.naturalWidth + 'x' + img.naturalHeight : null,
      imgClass: img ? img.className : null,
      frameClass: frame ? frame.className : null,
      stats,
    };
  }, key);
  report.push(r);
  await page.locator('#right').screenshot({ path: `tmp_panel_${key}.png` }).catch((e) => logs.push('[shot] ' + e.message));
}

console.log(JSON.stringify(report, null, 2));
console.log('--- console ---');
console.log(logs.slice(-40).join('\n'));
fs.writeFileSync('tmp_herotest_out.json', JSON.stringify({ report, logs }, null, 2));

await browser.close();
chrome.kill('SIGTERM');
