import fs from 'fs';

const html = fs.readFileSync('index.html', 'utf8');

const waitScript = (action) => `
<script>
  window.addEventListener('load', () => {
    const t0 = Date.now();
    const iv = setInterval(() => {
      if (window.__ORBIT && window.__ORBIT.bodies && window.__ORBIT.bodies.mars && window.__ORBIT.bodies.mars.mesh && window.__DBG) {
        clearInterval(iv);
        setTimeout(() => {
          try {
            ${action}
          } catch (e) { console.error('TEST ERROR: ' + (e && e.message) + ' | ' + (e && e.stack)); }
        }, 400);
      } else if (Date.now() - t0 > 25000) {
        clearInterval(iv);
        console.error('TEST ERROR: system not ready');
      }
    }, 100);
  });
</script>
</body>`;

// A: full selection (renders magazine + snapshot + cover)
fs.writeFileSync('tmp_test_full.html', html.replace('</body>', waitScript(`
    window.__ORBIT.selectBody('mars');
    window.__ORBIT.focusSelected();
    console.log('TEST: full selection done');
`)));

// B: snapshot only
fs.writeFileSync('tmp_test_snap.html', html.replace('</body>', waitScript(`
    const url = window.__DBG.PlanetSnapshot.capture(window.__ORBIT.bodies.mars, window.__ORBIT);
    console.log('TEST: snapshot result = ' + (url ? ('url len ' + url.length) : 'NULL'));
`)));

// C: selection but stub snapshot via __DBG (same object reference as module scope)
fs.writeFileSync('tmp_test_selnosnap.html', html.replace('</body>', waitScript(`
    window.__DBG.PlanetSnapshot.capture = () => null;
    window.__ORBIT.selectBody('mars');
    window.__ORBIT.focusSelected();
    console.log('TEST: selection done (no snapshot)');
`)));

console.log('written');
