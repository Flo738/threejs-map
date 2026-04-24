import { T_SIZE, T_HEIGHT, W_LEVEL, LAKE_X, LAKE_Z, LAKE_R } from './constants.js';

function hash(n)   { return Math.abs(Math.sin(n) * 43758.5453) % 1; }
function smooth(t) { return t * t * (3 - 2 * t); }

function noise2D(x, z) {
  const ix = Math.floor(x), iz = Math.floor(z);
  const fx = x - ix,        fz = z - iz;
  const a = hash(ix     + iz       * 157);
  const b = hash(ix + 1 + iz       * 157);
  const c = hash(ix     + (iz + 1) * 157);
  const d = hash(ix + 1 + (iz + 1) * 157);
  return a + (b-a)*smooth(fx) + (c-a)*smooth(fz) + smooth(fx)*smooth(fz)*(a-b-c+d);
}

function fbm(x, z) {
  let v = 0, a = 0.5, f = 1;
  for (let i = 0; i < 5; i++) { v += a * noise2D(x*f, z*f); a *= 0.5; f *= 2; }
  return v;
}

export function getHeight(x, z) {
  const nx = (x / T_SIZE + 0.5) * 4;
  const nz = (z / T_SIZE + 0.5) * 4;
  let h = (
    fbm(nx, nz)       * 0.55 +
    fbm(nx*2, nz*2)   * 0.30 +
    fbm(nx*4, nz*4)   * 0.15
  ) * T_HEIGHT;
  const dx = x - LAKE_X, dz = z - LAKE_Z;
  const t  = Math.sqrt(dx*dx + dz*dz) / LAKE_R;
  if (t < 1.0) {
    const s     = t * t * (3 - 2 * t);
    const floor = W_LEVEL - 2.5;
    h = floor + s * Math.max(0, h - floor);
    h = Math.min(h, W_LEVEL - 0.4);
  }
  return h;
}
