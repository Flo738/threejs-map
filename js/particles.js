import * as THREE      from 'https://esm.sh/three@0.132.2';
import { GLTFLoader }  from 'https://esm.sh/three@0.132.2/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'https://esm.sh/three@0.132.2/examples/jsm/loaders/DRACOLoader.js';
import { LAKE_X, LAKE_Z, LAKE_R, W_LEVEL, T_SIZE } from './constants.js';
import { getHeight } from './terrain.js';
import { FIREFLY_VERT, FIREFLY_FRAG } from './shaders.js';

const COIN_COUNT = 70;
const coinData = [];
const coinState = { mesh: null };
const _dummy    = new THREE.Object3D();

function makeDraco() {
  const d = new DRACOLoader();
  d.setDecoderPath('ressources/draco/');
  return d;
}

function extractNormGeo(gltf, targetSize) {
  gltf.scene.updateMatrixWorld(true);
  let baseMesh = null;
  gltf.scene.traverse(c => { if (c.isMesh && !baseMesh) baseMesh = c; });
  if (!baseMesh) return null;
  const geo = baseMesh.geometry.clone();
  baseMesh.updateMatrixWorld(true);
  geo.applyMatrix4(baseMesh.matrixWorld);
  geo.computeBoundingBox();
  const center = new THREE.Vector3();
  geo.boundingBox.getCenter(center);
  geo.translate(-center.x, -center.y, -center.z);
  geo.computeBoundingSphere();
  const norm = 1.0 / (geo.boundingSphere.radius || 1);
  return { geo, norm: norm * targetSize };
}

function makeCoinData(N) {
  const data = [];
  for (let i = 0; i < N; i++) {
    const x     = (Math.random() - 0.5) * T_SIZE * 0.55;
    const z     = (Math.random() - 0.5) * T_SIZE * 0.55;
    const baseY = getHeight(x, z) + 1.0 + Math.random() * 12.0;
    data.push({
      x, z, baseY,
      scale:  0.55 + Math.random() * 0.45,
      speed:  0.5  + Math.random() * 1.2,
      phase:  Math.random() * Math.PI * 2,
      rotSpd: (Math.random() > 0.5 ? 1 : -1) * (2.0 + Math.random() * 3.0),
      tiltX:  (Math.random() - 0.5) * 1.2,
      driftA: 3.0  + Math.random() * 6.0,
      driftS: 0.20 + Math.random() * 0.40,
    });
  }
  return data;
}

export function buildCoins(scene) {
  const loader = new GLTFLoader();
  loader.setDRACOLoader(makeDraco());

  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0xffe44d), metalness: 0.95, roughness: 0.08,
    emissive: new THREE.Color(0x9a6000), emissiveIntensity: 0.35,
  });

  loader.load('ressources/gold_coin.glb', (gltf) => {
    const res = extractNormGeo(gltf, 1.0);
    if (!res) return;
    coinState.mesh = new THREE.InstancedMesh(res.geo, mat, COIN_COUNT);
    coinState.mesh.castShadow = true;
    const d = makeCoinData(COIN_COUNT);
    d.forEach((cd, i) => {
      coinData.push({ ...cd, scale: cd.scale * res.norm });
      _dummy.position.set(cd.x, cd.baseY, cd.z);
      _dummy.scale.setScalar(coinData[i].scale);
      _dummy.updateMatrix();
      coinState.mesh.setMatrixAt(i, _dummy.matrix);
    });
    coinState.mesh.instanceMatrix.needsUpdate = true;
    scene.add(coinState.mesh);
  });
}

export function animateCoins(elapsed) {
  if (!coinState.mesh || coinData.length !== COIN_COUNT) return;
  for (let i = 0; i < COIN_COUNT; i++) {
    const d = coinData[i];
    _dummy.position.set(
      d.x + d.driftA * Math.sin(elapsed * d.driftS + d.phase),
      d.baseY + Math.sin(elapsed * d.speed + d.phase) * 2.0,
      d.z + d.driftA * Math.cos(elapsed * d.driftS * 0.7 + d.phase + 1.2)
    );
    _dummy.rotation.set(d.tiltX, elapsed * d.rotSpd + d.phase, 0);
    _dummy.scale.setScalar(d.scale);
    _dummy.updateMatrix();
    coinState.mesh.setMatrixAt(i, _dummy.matrix);
  }
  coinState.mesh.instanceMatrix.needsUpdate = true;
}

const _skullDummy = new THREE.Object3D();

export function buildSkullParticles(scene) {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d');

  ctx.fillStyle = '#e8e0c8';
  ctx.beginPath(); ctx.arc(32, 24, 18, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#c8bc9a';
  ctx.beginPath(); ctx.ellipse(32, 40, 12, 8, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#1a1008';
  ctx.beginPath(); ctx.arc(23, 20, 6, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(41, 20, 6, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(32, 30, 3, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#e8e0c8';
  for (let t = 0; t < 4; t++) ctx.fillRect(21 + t * 6, 38, 4, 9);

  const tex = new THREE.CanvasTexture(c);
  const SK  = 25;
  const positions = new Float32Array(SK * 3);
  const skData    = [];

  for (let i = 0; i < SK; i++) {
    const x = (Math.random() - 0.5) * T_SIZE * 0.50;
    const z = (Math.random() - 0.5) * T_SIZE * 0.50;
    const y = getHeight(x, z) + 3.0 + Math.random() * 14.0;
    positions[i*3] = x; positions[i*3+1] = y; positions[i*3+2] = z;
    skData.push({
      baseY: y, speed: 0.3 + Math.random() * 0.6, phase: Math.random() * Math.PI * 2,
      driftS: 0.15 + Math.random() * 0.3,
    });
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  scene.add(new THREE.Points(geo, new THREE.PointsMaterial({
    map: tex, size: 2.8, transparent: true, alphaTest: 0.05,
    sizeAttenuation: true, depthWrite: false, opacity: 0.75,
  })));
  return { geo, skData, count: SK };
}

export function animateSkullParticles(elapsed, skullRef) {
  if (!skullRef) return;
  const arr = skullRef.geo.attributes.position.array;
  for (let i = 0; i < skullRef.count; i++) {
    const d = skullRef.skData[i];
    arr[i*3]   += Math.sin(elapsed * d.driftS + d.phase) * 0.015;
    arr[i*3+1]  = d.baseY + Math.sin(elapsed * d.speed + d.phase) * 2.5;
    arr[i*3+2] += Math.cos(elapsed * d.driftS + d.phase) * 0.012;
  }
  skullRef.geo.attributes.position.needsUpdate = true;
}

export function buildFireflies(scene) {
  const FF   = 120;
  const offs = new Float32Array(FF * 3);
  const rnds = new Float32Array(FF * 4);
  for (let i = 0; i < FF; i++) {
    let x, z;
    if (i < 60) {
      const angle = Math.random() * Math.PI * 2;
      x = LAKE_X + Math.cos(angle) * LAKE_R * (0.7 + Math.random() * 0.7);
      z = LAKE_Z + Math.sin(angle) * LAKE_R * (0.7 + Math.random() * 0.7);
    } else {
      x = (Math.random() - 0.5) * T_SIZE * 0.5;
      z = (Math.random() - 0.5) * T_SIZE * 0.5;
    }
    const y = getHeight(x, z) + 1.5 + Math.random() * 5.0;
    offs[i*3] = x; offs[i*3+1] = y; offs[i*3+2] = z;
    rnds[i*4] = Math.random(); rnds[i*4+1] = Math.random();
    rnds[i*4+2] = Math.random(); rnds[i*4+3] = Math.random();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('aOffset',  new THREE.Float32BufferAttribute(offs, 3));
  geo.setAttribute('aRnd',     new THREE.Float32BufferAttribute(rnds, 4));
  geo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(FF * 3), 3));
  const mat = new THREE.ShaderMaterial({
    vertexShader: FIREFLY_VERT, fragmentShader: FIREFLY_FRAG,
    uniforms: { uTime: { value: 0 } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  scene.add(new THREE.Points(geo, mat));
  return mat.uniforms;
}
