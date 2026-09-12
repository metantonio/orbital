// Sonda 3: intercepta THREE.WebGLRenderer.prototype.render para ver qué dibuja
// realmente el renderer offscreen de PlanetSnapshot.
import { createRequire } from 'module';
const require = createRequire('C:/Repositorios/deepseek-harness/package.json');
const { chromium } = require('playwright');

const browser = await chromium.connectOverCDP('http://127.0.0.1:9333');
const ctx = browser.contexts()[0] || await browser.newContext();
const page = await ctx.newPage();
const logs = [];
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text().slice(0, 200)}`));

await page.goto('http://127.0.0.1:8123/index.html', { waitUntil: 'load', timeout: 60000 });
await page.waitForFunction('!!window.__ORBIT && !!window.__ORBIT.bodies', null, { timeout: 180000 });
await page.evaluate('window.__ORBIT.clock.paused = true');

const out = await page.evaluate(async () => {
  const THREE = await import('three');
  const s = window.__ORBIT;

  const rec = [];
  const proto = THREE.WebGLRenderer.prototype;
  const orig = proto.render;
  proto.render = function (scene, cam) {
    const before = this.info.render.frame;
    const res = orig.call(this, scene, cam);
    const w = this.domElement.width, h = this.domElement.height;
    if (w === 1024 && h === 1024) {
      const objs = [];
      scene.traverse((o) => {
        if (o.isMesh || o.isPoints || o.isSprite) {
          objs.push({
            type: o.type, mat: o.material && o.material.type, visible: o.visible,
            layer: o.layers.current, frustumCulled: o.frustumCulled,
            scale: o.getWorldScale(new THREE.Vector3()).toArray().map((v) => +v.toFixed(3)),
            pos: o.getWorldPosition(new THREE.Vector3()).toArray().map((v) => +v.toFixed(3)),
          });
        }
      });
      rec.push({
        canvas: w + 'x' + h, calls: this.info.render.calls, tris: this.info.render.triangles,
        points: this.info.render.points, frame: this.info.render.frame, objs,
        camPos: [cam.position.x, cam.position.y, cam.position.z].map((v) => +v.toFixed(2)),
        camFov: cam.fov, exposure: this.toneMappingExposure, outputCS: this.outputColorSpace,
      });
    }
    return res;
  };

  const url = window.__DBG.PlanetSnapshot.capture(s.bodies.mars, s);
  proto.render = orig;
  let lens = { urlLen: url ? url.length : 0 };
  if (url) {
    const img = new Image();
    await new Promise((r) => { img.onload = r; img.onerror = r; img.src = url; });
    const c = document.createElement('canvas'); c.width = 64; c.height = 64;
    const cx = c.getContext('2d'); cx.drawImage(img, 0, 0, 64, 64);
    const d = cx.getImageData(0, 0, 64, 64).data;
    let sum = 0; for (let i = 0; i < d.length; i += 4) sum += (d[i] + d[i + 1] + d[i + 2]) / 3;
    lens.avg = +(sum / (d.length / 4)).toFixed(1);
  }
  return { lens, rec };
});

console.log(JSON.stringify(out, null, 2));
