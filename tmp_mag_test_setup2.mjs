import fs from 'fs';

const html = fs.readFileSync('index.html', 'utf8');

const waitScript = (action) => `
<script>
  window.addEventListener('load', () => {
    const t0 = Date.now();
    const iv = setInterval(() => {
      if (window.__ORBIT && window.__ORBIT.bodies && window.__ORBIT.bodies.mars && window.__ORBIT.bodies.mars.mesh) {
        clearInterval(iv);
        setTimeout(() => {
          try {
            ${action}
          } catch (e) { console.error('TEST ERROR', e && e.message, e && e.stack); }
        }, 400);
      } else if (Date.now() - t0 > 25000) {
        clearInterval(iv);
        console.error('TEST ERROR: system not ready');
      }
    }, 100);
  });
</script>
</body>`;

// A: select without snapshot (stub capture)
fs.writeFileSync('tmp_test_nosnap.html', html.replace('</body>', waitScript(`
    PlanetSnapshot.capture = () => null;
    window.__ORBIT.selectBody('mars');
    window.__ORBIT.focusSelected();
    console.log('TEST: selected mars (no snapshot)');
`)));

// B: snapshot only, no selection
fs.writeFileSync('tmp_test_snaponly.html', html.replace('</body>', waitScript(`
    const url = PlanetSnapshot.capture(window.__ORBIT.bodies.mars, window.__ORBIT);
    console.log('TEST: snapshot url length = ' + (url ? url.length : 'null'));
`)));

// C: cover only, no snapshot
fs.writeFileSync('tmp_test_coveronly.html', html.replace('</body>', waitScript(`
    PlanetSnapshot.capture = () => null;
    window.__ORBIT.ui.showMagCover(window.__ORBIT.bodies.mars, MAG_EDITORIAL.mars);
    console.log('TEST: cover shown');
`)));

console.log('variant test files written');
