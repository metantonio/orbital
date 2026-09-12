// Sonda 4: ¿el THREE que importo en el evaluate es la MISMA instancia que usa la app?
// Registra todas las llamadas a render (tamaño de canvas) alrededor de capture().
import { createRequire } from 'module';
const require = createRequire('C:/Repositorios/deepseek-harness/package.json');
const { chromium } = require('playwright');

const browser = await chromium.connectOverCDP('http://127.0.0.1:9333');
const ctx = browser.contexts()[0] || await browser.newContext();
const page = await ctx.newPage();
await page.goto('http://127.0.0.1:8123/index.html', { waitUntil: 'load', timeout: 60000 });
await page.waitForFunction('!!window.__ORBIT && !!window.__ORBIT.bodies', null, { timeout: 180000 });
await page.evaluate('window.__ORBIT.clock.paused = true');

const out = await page.evaluate(async () => {
  const THREE = await import('three');
  const s = window.__ORBIT;
  const identity = {
    revision: THREE.REVISION,
    sameScene: s.scene instanceof THREE.Scene,
    sameMesh: s.bodies.mars.mesh instanceof THREE.Mesh,
    sameRenderer: !!s.renderer ? true : 'no-renderer-field',
    sceneCtor: Object.getPrototypeOf(s.scene).constructor.name,
    moduleCount: (window.__three_marks || 0),
  };

  const rec = [];
  const orig = THREE.WebGLRenderer.prototype.render;
  THREE.WebGLRenderer.prototype.render = function (scene, cam) {
    const res = orig.call(this, scene, cam);
    rec.push({
      canvas: this.domElement.width + 'x' + this.domElement.height,
      calls: this.info.render.calls, tris: this.info.render.triangles, points: this.info.render.points,
      objCount: (() => { let n = 0; scene.traverse((o) => { if (o.isMesh || o.isPoints || o.isSprite) n++; }); return n; })(),
      camFov: cam.fov,
    });
    return res;
  };

  const url = window.__DBG.PlanetSnapshot.capture(s.moons.io, s);
  await new Promise((r) => setTimeout(r, 120));
  const offscreen = rec.filter((r) => r.canvas === '1024x1024');
  THREE.WebGLRenderer.prototype.render = orig;

  let imgStats = null;
  if (url) {
    const img = new Image();
    await new Promise((r) => { img.onload = r; img.onerror = r; img.src = url; });
    const c = document.createElement('canvas'); c.width = 64; c.height = 64;
    const cx = c.getContext('2d'); cx.drawImage(img, 0, 0, 64, 64);
    const d = cx.getImageData(0, 0, 64, 64).data;
    let sum = 0, mx = 0; for (let i = 0; i < d.length; i += 4) { const l = (d[i] + d[i + 1] + d[i + 2]) / 3; sum += l; if (l > mx) mx = l; }
    imgStats = { avg: +(sum / (d.length / 4)).toFixed(1), max: Math.round(mx), urlLen: url.length };
  }
  return { identity, offscreen, totalRenders: rec.length, canvasSizes: [...new Set(rec.map((r) => r.canvas))], imgStats };
});

console.log(JSON.stringify(out, null, 2));
