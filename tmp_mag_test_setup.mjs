import fs from 'fs';

const html = fs.readFileSync('index.html', 'utf8');

const common = (extra) => `
<script>
  window.addEventListener('load', () => {
    const t0 = Date.now();
    const iv = setInterval(() => {
      if (window.__ORBIT && window.__ORBIT.bodies && window.__ORBIT.bodies.mars && window.__ORBIT.bodies.mars.mesh) {
        clearInterval(iv);
        setTimeout(() => {
          try {
            window.__ORBIT.selectBody('mars');
            window.__ORBIT.focusSelected();
            ${extra}
            console.log('TEST: selected mars');
          } catch (e) { console.error('TEST ERROR', e); }
        }, 400);
      } else if (Date.now() - t0 > 25000) {
        clearInterval(iv);
        console.error('TEST ERROR: system not ready');
      }
    }, 100);
  });
</script>
</body>`;

// Panel shot: let everything develop naturally
fs.writeFileSync('tmp_test_panel.html', html.replace('</body>', common('')));
// Cover shot: freeze the cover overlay on screen
fs.writeFileSync('tmp_test_cover.html', html.replace('</body>', common(`
            clearTimeout(window.__ORBIT.ui._magCoverT);
            document.getElementById('magCover').classList.add('on');
`)));
console.log('test files written');
