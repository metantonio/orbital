// Sonda: ¿por qué la esfera del planeta no se dibuja en el renderer offscreen?
import { createRequire } from 'module';
const require = createRequire('C:/Repositorios/deepseek-harness/package.json');
const { chromium } = require('playwright');

const browser = await chromium.connectOverCDP('http://127.0.0.1:9333');
const ctx = browser.contexts()[0] || await browser.newContext();
const page = await ctx.newPage();
const logs = [];
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text().slice(0, 400)}`));
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));

await page.goto('http://127.0.0.1:8123/index.html', { waitUntil: 'load', timeout: 60000 });
await page.waitForFunction('!!window.__ORBIT && !!window.__ORBIT.bodies', null, { timeout: 180000 });
await page.evaluate('window.__ORBIT.clock.paused = true');

const out = await page.evaluate(async () => {
  const THREE = await import('three');
  const s = window.__ORBIT;
  const body = s.bodies.mars;

  function stats(r, cam, scene) {
    r.render(scene, cam);
    const px = new Uint8Array(4 * 64 * 64);
    // lectura de píxeles del framebuffer por gl
    const gl = r.getContext();
    r.readRenderTarget ? null : null;
    return { calls: r.info.render.calls, tris: r.info.render.triangles, progCount: r.info.programs ? r.info.programs.length : -1 };
  }

  const mk = (variant) => {
    const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
    renderer.setSize(256, 256);
    renderer.setPixelRatio(1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x02040a);
    let mat;
    if (variant === 'clone') mat = body.mesh.material.clone();
    else if (variant === 'freshStandard') mat = new THREE.MeshStandardMaterial({ map: body.mesh.material.map, roughness: 0.82, metalness: 0.02 });
    else if (variant === 'plain') mat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    else if (variant === 'basic') mat = new THREE.MeshBasicMaterial({ map: body.mesh.material.map });
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 48), mat);
    scene.add(mesh);
    const key = new THREE.DirectionalLight(0xfff1d6, 3.2);
    key.position.set(6, 3, 8);
    scene.add(key);
    scene.add(new THREE.AmbientLight(0x2a3a52, 0.25));
    const cam = new THREE.PerspectiveCamera(30, 1, 0.05, 300);
    cam.position.set(0, 0.16, 9.8).normalize().multiplyScalar(9.8);
    cam.lookAt(0, 0, 0);

    renderer.render(scene, cam);
    const info = { variant, calls: renderer.info.render.calls, tris: renderer.info.render.triangles, matType: mat.type, visible: mesh.visible };
    // lectura de píxeles vía readPixels
    const gl = renderer.getContext();
    const px = new Uint8Array(256 * 256 * 4);
    gl.readPixels(0, 0, 256, 256, gl.RGBA, gl.UNSIGNED_BYTE, px);
    let sum = 0, mx = 0;
    for (let i = 0; i < px.length; i += 4) { const l = (px[i] + px[i + 1] + px[i + 2]) / 3; sum += l; if (l > mx) mx = l; }
    info.avg = +(sum / (px.length / 4)).toFixed(1);
    info.max = mx;
    info.dataUrlLen = renderer.domElement.toDataURL('image/jpeg', 0.9).length;
    renderer.dispose();
    return info;
  };

  return {
    live: (() => {
      const r = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
      r.setSize(64, 64);
      const gl = r.getContext();
      return { maxAniso: gl.getParameter(gl.MAX_TEXTURE_MAX_ANISOTROPY_EXT) };
    })(),
    variants: ['clone', 'freshStandard', 'plain', 'basic'].map(mk),
  };
});

console.log(JSON.stringify(out, null, 2));
console.log('--- console ---');
console.log(logs.slice(0, 14).join('\n'));
