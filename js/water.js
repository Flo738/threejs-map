import * as THREE from 'https://esm.sh/three@0.132.2';
import { LAKE_X, LAKE_Z, LAKE_R, W_LEVEL } from './constants.js';
import { WATER_VERT, WATER_FRAG } from './shaders.js';

export function buildWater(scene, camera, waterUniforms) {
  waterUniforms.uCameraPos.value = camera.position;

  const geo = new THREE.CircleGeometry(LAKE_R, 512);
  geo.rotateX(-Math.PI / 2);
  const mesh = new THREE.Mesh(geo, new THREE.ShaderMaterial({
    vertexShader:   WATER_VERT,
    fragmentShader: WATER_FRAG,
    uniforms:       waterUniforms,
    transparent:    true,
    depthWrite:     true,
    side:           THREE.FrontSide,
  }));
  mesh.position.set(LAKE_X, W_LEVEL, LAKE_Z);
  scene.add(mesh);

  const ringGeo = new THREE.RingGeometry(LAKE_R - 1.0, LAKE_R + 3.5, 512);
  ringGeo.rotateX(-Math.PI / 2);
  const shoreRing = new THREE.Mesh(ringGeo, new THREE.MeshStandardMaterial({
    color: new THREE.Color(0x7a6845), roughness: 1.0, metalness: 0.0,
  }));
  shoreRing.position.set(LAKE_X, W_LEVEL + 0.04, LAKE_Z);
  shoreRing.receiveShadow = true;
  scene.add(shoreRing);

}
