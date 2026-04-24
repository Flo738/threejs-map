import * as THREE from 'https://esm.sh/three@0.132.2';
import { FIRE_X, FIRE_Z } from './constants.js';
import { getHeight } from './terrain.js';

export function buildCampfire(scene) {
  const fireY = getHeight(FIRE_X, FIRE_Z);
  const group = new THREE.Group();
  group.position.set(FIRE_X, fireY, FIRE_Z);

  const logMat = new THREE.MeshLambertMaterial({ color: 0x2a1005 });
  const logGeo = new THREE.CylinderGeometry(0.12, 0.18, 1.6, 6);
  for (let i = 0; i < 4; i++) {
    const log = new THREE.Mesh(logGeo, logMat);
    log.rotation.z = Math.PI / 2.2;
    log.rotation.y = i * Math.PI / 2;
    log.castShadow = true;
    group.add(log);
  }

  const addFlame = (sx, sz, h, color) => {
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(0.22, h, 6),
      new THREE.MeshBasicMaterial({ color })
    );
    cone.position.set(sx, h / 2 + 0.1, sz);
    group.add(cone);
  };
  addFlame(0,      0,    1.4, 0xff5500);
  addFlame( 0.15,  0.1,  1.0, 0xffaa00);
  addFlame(-0.12,  0.08, 0.8, 0xffaa00);
  addFlame(0,      0,    0.6, 0xffee88);

  scene.add(group);
}
