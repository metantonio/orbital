// Sonda 2: réplica exacta de PlanetSnapshot.capture con conmutadores para
// localizar por qué la esfera del planeta no aparece en el render offscreen.
import { createRequire } from 'module';
const require = createRequire('C:/Repositorios/deepseek-harness/package.json');
const { chromium } = require('playwright');

const browser = await chromium.connectOverCDP('http://127.0.0.1:9333');
const ctx = browser.contexts()[0] || await browser.newContext();
const page = await ctx.newPage();
const logs = [];
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text().slice(0, 300)}`));

await page.goto('http://127.0.0.1:8123/index.html', { waitUntil: 'load', timeout: 60000 });
await page.waitForFunction('!!window.__ORBIT && !!window.__ORBIT.bodies', null, { timeout: 180000 });
await page.evaluate('window.__ORBIT.clock.paused = true');

const out = await page.evaluate(async () => {
  const THREE = await import('three');
  const s = window.__ORBIT;
  const body = s.bodies.mars;

  function sunDirection(body, sys) {
    const sun = sys.bodies && sys.bodies.sun;
    if (!sun) return new THREE.Vector3(1, 0, 0);
    const v = sun.worldPos.clone().sub(body.worldPos);
    if (v.lengthSq() < 1e-12) return new THREE.Vector3(1, 0, 0);
    return v.normalize();
  }

  function run(opts) {
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(1024, 1024);
    renderer.setPixelRatio(1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x02040a);

    if (opts.stars !== false) {
      const starGeo = new THREE.BufferGeometry();
      const n = 420, pos = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { const v = new THREE.Vector3().randomDirection().multiplyScalar(60); pos[i * 3] = v.x; pos[i * 3 + 1] = v.y; pos[i * 3 + 2] = v.z; }
      starGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.14, transparent: true, opacity: 0.7, depthWrite: false });
      scene.add(new THREE.Points(starGeo, starMat));
    }

    const isStar = body.data.kind === 'star';
    const group = new THREE.Group();
    let mat = body.mesh.material.clone();
    const sunDir = sunDirection(body, s);
    if (mat.uniforms && mat.uniforms.uSunDir) mat.uniforms.uSunDir.value.copy(sunDir);

    const sphere = new THREE.SphereGeometry(1, opts.hiRes === false ? 48 : 96, opts.hiRes === false ? 48 : 96);
    const mesh = new THREE.Mesh(sphere, mat);
    mesh.rotation.y = 2.05;
    group.add(mesh);

    if (opts.atmos !== false && body.atmosphereMat) {
      const am = body.atmosphereMat.clone();
      if (am.uniforms && am.uniforms.uSunDir) am.uniforms.uSunDir.value.copy(sunDir);
      const ag = new THREE.SphereGeometry(body.key === 'earth' ? 1.04 : 1.07, 64, 64);
      group.add(new THREE.Mesh(ag, am));
    }

    scene.add(group);

    if (opts.lights !== false && !isStar) {
      const lp = sunDir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), 0.5);
      lp.y += 0.28;
      lp.normalize().multiplyScalar(10);
      const key = new THREE.DirectionalLight(0xfff1d6, 3.2);
      key.position.copy(lp);
      scene.add(key);
      scene.add(new THREE.AmbientLight(0x2a3a52, 0.25));
    }

    const cam = new THREE.PerspectiveCamera(30, 1, 0.05, 300);
    cam.position.set(0, 0.16, 9.8).normalize().multiplyScalar(9.8);
    cam.lookAt(0, 0, 0);

    renderer.render(scene, cam);
    const gl = renderer.getContext();
    const px = new Uint8Array(1024 * 1024 * 4);
    gl.readPixels(0, 0, 1024, 1024, gl.RGBA, gl.UNSIGNED_BYTE, px);
    let sum = 0, mx = 0, bright = 0, n = 0;
    for (let i = 0; i < px.length; i += 4 * 37) { const l = (px[i] + px[i + 1] + px[i + 2]) / 3; sum += l; if (l > mx) mx = l; if (l > 12) bright++; n++; }
    const info = {
      opts, calls: renderer.info.render.calls, tris: renderer.info.render.triangles,
      avg: +(sum / n).toFixed(1), max: Math.round(mx), brightPct: +(100 * bright / n).toFixed(2),
      groupChildren: group.children.length, sceneChildren: scene.children.length,
      camPos: [ +cam.position.x.toFixed(2), +cam.position.y.toFixed(2), +cam.position.z.toFixed(2) ],
      meshScale: mesh.getWorldScale(new THREE.Vector3()).toArray(),
      meshPos: mesh.getWorldPosition(new THREE.Vector3()).toArray(),
      matVisible: mat.visible, matOpacity: mat.opacity, matTransparent: mat.transparent,
      matColor: mat.color ? mat.color.getHex().toString(16) : null,
      hasMap: !!mat.map, sunDir: sunDir.toArray().map(x => +x.toFixed(3)),
    };
    renderer.dispose();
    return info;
  }

  return {
    full: run({}),
    noAtmos: run({ atmos: false }),
    noStars: run({ stars: false }),
    noLights: run({ lights: false }),
    loRes: run({ hiRes: false }),
  };
});

console.log(JSON.stringify(out, null, 2));
console.log('--- console (primeras) ---');
console.log(logs.slice(0, 6).join('\n'));
