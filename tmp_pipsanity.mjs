function inRing(lon, lat, ring) {
  let inside = false;
  const n = ring.length / 2;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = ring[i * 2], yi = ring[i * 2 + 1];
    const xj = ring[j * 2], yj = ring[j * 2 + 1];
    if (((yi > lat) !== (yj > lat)) &&
        lon < (xj - xi) * (lat - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

// square 0..10 (flat format)
const sq = [0, 0, 10, 0, 10, 10, 0, 10];
console.log('square (5,5) =', inRing(5, 5, sq), '(expect true)');
console.log('square (15,5) =', inRing(15, 5, sq), '(expect false)');
console.log('square (5,15) =', inRing(5, 15, sq), '(expect false)');

// diamond
const dia = [5, 0, 10, 5, 5, 10, 0, 5];
console.log('diamond (5,5) =', inRing(5, 5, dia), '(expect true)');
console.log('diamond (1,1) =', inRing(1, 1, dia), '(expect false)');

// ring crossing dateline: polygon = band from 170E to -170E (i.e. covering the antipodal region across 180)
// vertices: 170,-10 ; 170,10 ; -170,10 ; -170,-10  (this represents a rectangle around lon=180)
const dl = [170, -10, 170, 10, -170, 10, -170, -10];
console.log('dateline-rect (175,0) =', inRing(175, 0, dl), '(expect true: 175E is inside the 180-centered rect)');
console.log('dateline-rect (-175,0) =', inRing(-175, 0, dl), '(expect true)');
console.log('dateline-rect (0,0) =', inRing(0, 0, dl), '(expect false)');
console.log('dateline-rect (90,0) =', inRing(90, 0, dl), '(expect false)');
