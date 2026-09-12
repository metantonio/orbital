import fs from 'fs';
const c = fs.readFileSync('index.html', 'utf8');
const m = c.match(/<script type="module">([\s\S]*?)<\/script>/);
if (!m) { console.log('NO MATCH'); process.exit(1); }
fs.writeFileSync('tmp_syntax_check.mjs', m[1]);
console.log('extracted ' + m[1].length + ' chars');
