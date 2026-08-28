import https from 'https';
import fs from 'fs';
import { tmpdir } from 'os';

const url = process.argv[2];
const out = process.argv[3];
https.get(url, (res) => {
  console.log('status=' + res.statusCode);
  if (res.statusCode !== 200) {
    let s = '';
    res.on('data', (c) => (s += c));
    res.on('end', () => console.log(s.slice(0, 300)));
    return;
  }
  const f = fs.createWriteStream(out);
  res.pipe(f);
  f.on('finish', () => {
    f.close();
    console.log('OK ' + fs.statSync(out).size + ' bytes -> ' + out);
  });
}).on('error', (e) => console.log('FAIL ' + e.message));
