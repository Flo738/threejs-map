import * as THREE      from 'https://esm.sh/three@0.132.2';
import { GLTFLoader }  from 'https://esm.sh/three@0.132.2/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'https://esm.sh/three@0.132.2/examples/jsm/loaders/DRACOLoader.js';
import { LAKE_X, LAKE_Z, LAKE_R, W_LEVEL } from './constants.js';
import { getHeight } from './terrain.js';

const pirateState = { ship: null, shipBaseY: 0, lantern: null };

function makeDraco() {
  const d = new DRACOLoader();
  d.setDecoderPath('ressources/draco/');
  return d;
}

function loadNormalized(loader, path, targetSize, cb) {
  loader.load(path, (gltf) => {
    gltf.scene.updateMatrixWorld(true);
    const bb0 = new THREE.Box3().setFromObject(gltf.scene);
    const sz  = new THREE.Vector3();
    bb0.getSize(sz);
    const sc = targetSize / (Math.max(sz.x, sz.y, sz.z) || 1);
    gltf.scene.scale.setScalar(sc);
    gltf.scene.updateMatrixWorld(true);
    const bb1 = new THREE.Box3().setFromObject(gltf.scene);
    gltf.scene.position.y -= bb1.min.y;
    gltf.scene.traverse(child => {
      if (!child.isMesh) return;
      child.castShadow = true;
      if (child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach(m => { if (m.map) m.map.encoding = THREE.sRGBEncoding; });
      }
    });
    cb(gltf.scene, sc);
  });
}

export function buildPirateProps(scene) {
  const loader = new GLTFLoader();
  loader.setDRACOLoader(makeDraco());

  loader.load('ressources/pirate_ship.glb', (gltf) => {
    const ship = gltf.scene;
    ship.scale.setScalar(4.2);
    ship.rotation.y = Math.PI * 0.6;
    ship.updateMatrixWorld(true);

    const bb    = new THREE.Box3().setFromObject(ship);
    const shipH = bb.max.y - bb.min.y;
    const baseY = W_LEVEL - bb.min.y - shipH * 0.12;
    ship.position.set(LAKE_X, baseY, LAKE_Z);

    ship.traverse(child => {
      if (!child.isMesh) return;
      child.castShadow = child.receiveShadow = true;
      if (child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach(m => { if (m.map) m.map.encoding = THREE.sRGBEncoding; });
      }
    });
    scene.add(ship);

    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(16, 48),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.18, depthWrite: false })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(LAKE_X, W_LEVEL + 0.06, LAKE_Z);
    scene.add(shadow);

    const lantern = new THREE.PointLight(0xff9933, 2.5, 55, 2.0);
    lantern.position.set(LAKE_X + 3, baseY + shipH * 0.75, LAKE_Z - 2);
    scene.add(lantern);

    pirateState.ship      = ship;
    pirateState.shipBaseY = baseY;
    pirateState.lantern   = lantern;
  });
}

export function buildLuffy(scene) {
  const loader = new GLTFLoader();
  loader.setDRACOLoader(makeDraco());

  const angle = Math.PI * 0.25;
  const lx    = LAKE_X + Math.cos(angle) * (LAKE_R + 5);
  const lz    = LAKE_Z + Math.sin(angle) * (LAKE_R + 5);
  const ly    = getHeight(lx, lz);

  loadNormalized(loader, 'ressources/luffy.glb', 3.2, (src) => {
    src.position.set(lx, ly, lz);
    src.rotation.y = angle + Math.PI + 0.3;
    src.castShadow = src.receiveShadow = true;
    scene.add(src);
  });
}

export function buildAnchor(scene) {
  const loader = new GLTFLoader();
  loader.setDRACOLoader(makeDraco());

  const angle = Math.PI * 0.9;
  const ax    = LAKE_X + Math.cos(angle) * (LAKE_R + 10);
  const az    = LAKE_Z + Math.sin(angle) * (LAKE_R + 10);
  const ay    = getHeight(ax, az);

  loadNormalized(loader, 'ressources/encre.glb', 7.0, (src) => {
    src.position.set(ax, ay + 0.5, az);
    src.rotation.x = Math.PI * 0.5;
    src.rotation.z = Math.PI * 0.15;
    src.castShadow = true;
    scene.add(src);
  });

  const barrelLoader = new GLTFLoader();
  barrelLoader.setDRACOLoader(makeDraco());

  const luffyAngle = Math.PI * 0.25;
  const lx2 = LAKE_X + Math.cos(luffyAngle) * (LAKE_R + 5);
  const lz2 = LAKE_Z + Math.sin(luffyAngle) * (LAKE_R + 5);

  const barrelPositions = [
    { dx:  3.5, dz:  1.5, ry: 0.3 },
    { dx:  2.0, dz: -2.5, ry: 1.1 },
    { dx: -3.5, dz:  1.0, ry: 2.4 },
    { dx: -2.0, dz: -3.0, ry: 0.8 },
    { dx:  4.5, dz: -1.0, ry: 1.9 },
  ];

  loadNormalized(barrelLoader, 'ressources/barrel.glb', 3.0, (src) => {
    barrelPositions.forEach(({ dx, dz, ry }) => {
      const bx = lx2 + dx;
      const bz = lz2 + dz;
      const by = getHeight(bx, bz);
      const b  = src.clone();
      b.position.set(bx, by, bz);
      b.rotation.y = ry;
      b.castShadow = true;
      scene.add(b);
    });
  });
}

export function animateShip(elapsed) {
  if (!pirateState.ship) return;
  const roll  = Math.sin(elapsed * 0.45) * 0.028;
  const pitch = Math.sin(elapsed * 0.32 + 0.8) * 0.018;
  const bob   = Math.sin(elapsed * 0.55) * 0.35;
  pirateState.ship.rotation.z = roll;
  pirateState.ship.rotation.x = pitch;
  pirateState.ship.position.y = pirateState.shipBaseY + bob;

  if (pirateState.lantern) {
    const flicker = 2.2 + Math.sin(elapsed * 7.3) * 0.4 + Math.sin(elapsed * 13.1) * 0.2;
    pirateState.lantern.intensity = flicker;
    pirateState.lantern.position.y = pirateState.shipBaseY + 8 + bob * 0.6;
  }
}
