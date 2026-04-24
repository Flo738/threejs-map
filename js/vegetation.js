import * as THREE               from 'https://esm.sh/three@0.132.2';
import { GLTFLoader }           from 'https://esm.sh/three@0.132.2/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader }          from 'https://esm.sh/three@0.132.2/examples/jsm/loaders/DRACOLoader.js';
import * as BufferGeometryUtils from 'https://esm.sh/three@0.132.2/examples/jsm/utils/BufferGeometryUtils.js';
import { T_SIZE, W_LEVEL, LAKE_X, LAKE_Z, LAKE_R } from './constants.js';
import { getHeight } from './terrain.js';
import { TX } from './textures.js';

export const lodObjects = [];

function makeDraco() {
  const draco = new DRACOLoader();
  draco.setDecoderPath('ressources/draco/');
  return draco;
}

export function buildTerrain(scene) {
  const geo = new THREE.PlaneGeometry(T_SIZE, T_SIZE, 320, 320);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position.array;
  for (let i = 0; i < pos.length; i += 3) pos[i+1] = getHeight(pos[i], pos[i+2]);
  geo.computeVertexNormals();

  const rep      = 25;
  const roughMap = new THREE.TextureLoader().load('https://threejs.org/examples/textures/terrain/grasslight-big.jpg');
  roughMap.wrapS = roughMap.wrapT = THREE.RepeatWrapping;
  roughMap.repeat.set(rep, rep);

  const normalMap = new THREE.TextureLoader().load('https://threejs.org/examples/textures/waternormals.jpg');
  normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;
  normalMap.repeat.set(rep, rep);

  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
    map:          TX.terrainColor,
    color:        new THREE.Color(0xc8e0c0),
    normalMap,
    normalScale:  new THREE.Vector2(0.35, 0.35),
    roughnessMap: roughMap,
    roughness:    0.85,
    metalness:    0.0,
  }));
  mesh.receiveShadow = true;
  scene.add(mesh);
}

export function buildGrass(scene) {
  const COUNT = 4000;
  const gW = 2.0, gH = 1.4;
  const makePlane = (angle) => {
    const p = new THREE.PlaneGeometry(gW, gH);
    p.translate(0, gH / 2, 0);
    p.applyMatrix4(new THREE.Matrix4().makeRotationY(angle));
    return p;
  };
  const geo  = BufferGeometryUtils.mergeBufferGeometries([
    makePlane(0), makePlane(Math.PI / 3), makePlane(2 * Math.PI / 3)
  ]);
  const mat  = new THREE.MeshLambertMaterial({
    map: TX.grassColor, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide,
  });
  const mesh  = new THREE.InstancedMesh(geo, mat, COUNT);
  const dummy = new THREE.Object3D();
  let placed  = 0;
  while (placed < COUNT) {
    const x = (Math.random() - 0.5) * T_SIZE * 0.92;
    const z = (Math.random() - 0.5) * T_SIZE * 0.92;
    if (Math.sqrt((x-LAKE_X)**2 + (z-LAKE_Z)**2) < LAKE_R + 10) continue;
    const y = getHeight(x, z);
    if (y < W_LEVEL + 0.5) continue;
    dummy.position.set(x, y, z);
    dummy.rotation.y = Math.random() * Math.PI * 2;
    dummy.scale.setScalar(0.7 + Math.random() * 1.0);
    dummy.updateMatrix();
    mesh.setMatrixAt(placed++, dummy.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
  mesh.castShadow    = false;
  mesh.receiveShadow = true;
  scene.add(mesh);
}

export function buildBushes(scene) {
  const planes = (w, h, n) => {
    const list = [];
    for (let i = 0; i < n; i++) {
      const p = new THREE.PlaneGeometry(w, h);
      p.translate(0, h/2, 0);
      p.applyMatrix4(new THREE.Matrix4().makeRotationY(i * Math.PI / n));
      list.push(p);
    }
    return BufferGeometryUtils.mergeBufferGeometries(list);
  };
  const mat  = new THREE.MeshStandardMaterial({
    map: TX.plantColor, normalMap: TX.plantNormal, roughnessMap: TX.plantORM,
    alphaMap: TX.alphaBushRound, alphaTest: 0.2, transparent: false,
    roughness: 0.85, metalness: 0.0, side: THREE.DoubleSide, depthWrite: true,
  });
  const mesh  = new THREE.InstancedMesh(planes(2.6, 2.2, 3), mat, 350);
  mesh.castShadow = true;
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  let placed  = 0;
  while (placed < 350) {
    const x = (Math.random() - 0.5) * T_SIZE * 0.85;
    const z = (Math.random() - 0.5) * T_SIZE * 0.85;
    if (Math.sqrt(x*x + (z-100)**2) < 20) continue;
    if (Math.sqrt((x-LAKE_X)**2 + (z-LAKE_Z)**2) < LAKE_R + 12) continue;
    const y = getHeight(x, z);
    if (y < W_LEVEL + 0.5) continue;
    dummy.position.set(x, y, z);
    dummy.rotation.y = Math.random() * Math.PI * 2;
    dummy.scale.setScalar(0.7 + Math.random() * 1.0);
    dummy.updateMatrix();
    mesh.setMatrixAt(placed, dummy.matrix);
    const t = Math.random();
    color.setRGB(0.28 + t*0.15, 0.58 + t*0.22, 0.18 + t*0.10);
    mesh.setColorAt(placed, color);
    placed++;
  }
  mesh.instanceMatrix.needsUpdate = true;
  mesh.instanceColor.needsUpdate  = true;
  scene.add(mesh);
}

export function buildPlants(scene) {
  const pa = new THREE.PlaneGeometry(1.1, 2.8); pa.translate(0, 1.4, 0);
  const pb = new THREE.PlaneGeometry(1.1, 2.8); pb.translate(0, 1.4, 0);
  pb.applyMatrix4(new THREE.Matrix4().makeRotationY(Math.PI / 2));
  const plantGeo = BufferGeometryUtils.mergeBufferGeometries([pa, pb]);

  const pc = new THREE.PlaneGeometry(1.3, 1.3); pc.translate(0, 0.65, 0);
  const pd = new THREE.PlaneGeometry(1.3, 1.3); pd.translate(0, 0.65, 0);
  pd.applyMatrix4(new THREE.Matrix4().makeRotationY(Math.PI / 2));
  const flowerGeo = BufferGeometryUtils.mergeBufferGeometries([pc, pd]);

  const matTall = new THREE.MeshStandardMaterial({
    map: TX.plantColor, normalMap: TX.plantNormal, roughnessMap: TX.plantORM,
    alphaMap: TX.alphaFlowerTall, alphaTest: 0.25, roughness: 0.75, metalness: 0.0,
    transparent: false, side: THREE.DoubleSide, depthWrite: true,
  });
  const matStar = new THREE.MeshStandardMaterial({
    map: TX.plantColor, normalMap: TX.plantNormal, roughnessMap: TX.plantORM,
    alphaMap: TX.alphaFlowerStar, alphaTest: 0.2, roughness: 0.70, metalness: 0.0,
    transparent: false, side: THREE.DoubleSide, depthWrite: true,
  });

  const dummy = new THREE.Object3D();
  const color = new THREE.Color();

  const meshTall = new THREE.InstancedMesh(plantGeo, matTall, 200);
  let placed = 0;
  while (placed < 200) {
    const x = (Math.random() - 0.5) * T_SIZE * 0.88;
    const z = (Math.random() - 0.5) * T_SIZE * 0.88;
    if (Math.sqrt(x*x + (z-100)**2) < 15) continue;
    if (Math.sqrt((x-LAKE_X)**2 + (z-LAKE_Z)**2) < LAKE_R + 12) continue;
    const y = getHeight(x, z);
    if (y < W_LEVEL + 0.5) continue;
    dummy.position.set(x, y, z);
    dummy.rotation.y = Math.random() * Math.PI * 2;
    const s = 0.9 + Math.random() * 1.1;
    dummy.scale.set(s, s * (0.85 + Math.random() * 0.5), s);
    dummy.updateMatrix();
    meshTall.setMatrixAt(placed, dummy.matrix);
    const t = Math.random();
    color.setRGB(0.38 + t*0.22, 0.68 + t*0.18, 0.15 + t*0.08);
    meshTall.setColorAt(placed, color);
    placed++;
  }
  meshTall.instanceMatrix.needsUpdate = true;
  meshTall.instanceColor.needsUpdate  = true;
  scene.add(meshTall);

  const meshStar = new THREE.InstancedMesh(flowerGeo, matStar, 150);
  placed = 0;
  while (placed < 150) {
    const x = (Math.random() - 0.5) * T_SIZE * 0.88;
    const z = (Math.random() - 0.5) * T_SIZE * 0.88;
    if (Math.sqrt(x*x + (z-100)**2) < 12) continue;
    if (Math.sqrt((x-LAKE_X)**2 + (z-LAKE_Z)**2) < LAKE_R + 12) continue;
    const y = getHeight(x, z);
    if (y < W_LEVEL + 0.5) continue;
    dummy.position.set(x, y, z);
    dummy.rotation.y = Math.random() * Math.PI * 2;
    dummy.scale.setScalar(0.5 + Math.random() * 0.9);
    dummy.updateMatrix();
    meshStar.setMatrixAt(placed, dummy.matrix);
    const pick = Math.floor(Math.random() * 3);
    if      (pick === 0) color.setRGB(0.95, 0.85, 0.80);
    else if (pick === 1) color.setRGB(0.95, 0.90, 0.30);
    else                 color.setRGB(0.75, 0.55, 0.90);
    meshStar.setColorAt(placed, color);
    placed++;
  }
  meshStar.instanceMatrix.needsUpdate = true;
  meshStar.instanceColor.needsUpdate  = true;
  scene.add(meshStar);
}

export function buildTrees(scene) {
  const loader = new GLTFLoader();
  loader.setDRACOLoader(makeDraco());

  loader.load('ressources/tree.glb', (gltf) => {
    const src = gltf.scene;

    const barkMat = new THREE.MeshStandardMaterial({
      map: TX.treeColor, roughness: 0.9, metalness: 0.0, side: THREE.DoubleSide,
    });
    const leafMat = new THREE.MeshStandardMaterial({
      map: TX.treeLeafColor, alphaTest: 0.35, side: THREE.DoubleSide,
      depthWrite: true, roughness: 0.8,
      emissive: new THREE.Color(0x1a3308), emissiveIntensity: 0.15,
    });

    src.updateWorldMatrix(true, true);
    src.traverse(child => {
      if (!child.isMesh) return;
      const origMat  = Array.isArray(child.material) ? child.material[0] : child.material;
      const meshName = (child.name        || '').toLowerCase();
      const matName  = (origMat?.name     || '').toLowerCase();
      child.geometry = child.geometry.clone();
      child.geometry.applyMatrix4(child.matrixWorld);
      child.position.set(0,0,0); child.rotation.set(0,0,0); child.scale.set(1,1,1);
      child.updateMatrix();
      child.castShadow = child.receiveShadow = true;
      const nameHint = meshName.includes('leaf') || meshName.includes('leave') ||
                       meshName.includes('feuil') || meshName.includes('foliage') ||
                       matName.includes('leaf')   || matName.includes('leave')   ||
                       matName.includes('feuil')  || matName.includes('foliage');
      child.material = (nameHint || origMat?.alphaTest > 0) ? leafMat : barkMat;
    });
    src.position.set(0,0,0); src.rotation.set(0,0,0); src.scale.set(1,1,1);

    const bb = new THREE.Box3().setFromObject(src);
    src.traverse(child => { if (child.isMesh) child.geometry.translate(0, -bb.min.y, 0); });

    const srcLow = src.clone();
    srcLow.traverse(child => { if (child.isMesh) child.castShadow = false; });

    const treeH = bb.max.y - bb.min.y;
    const treeW = Math.max(bb.max.x - bb.min.x, bb.max.z - bb.min.z);
    TX.impostor.encoding = THREE.sRGBEncoding;
    const impostorMat = new THREE.SpriteMaterial({
      map: TX.impostor, fog: true, depthWrite: false, transparent: true,
    });

    for (let i = 0; i < 200; i++) {
      const x = (Math.random() - 0.5) * T_SIZE * 0.75;
      const z = (Math.random() - 0.5) * T_SIZE * 0.75;
      if (Math.sqrt(x*x + (z-100)**2) < 40) continue;
      if (Math.sqrt((x-LAKE_X)**2 + (z-LAKE_Z)**2) < LAKE_R + 20) continue;
      const y = getHeight(x, z);
      if (y < W_LEVEL + 1) continue;

      const scale = 1.8 + Math.random() * 0.8;
      const lod   = new THREE.LOD();
      const clone = (s) => { const c = s.clone(); c.scale.setScalar(scale); return c; };
      lod.addLevel(clone(src),    0);
      lod.addLevel(clone(srcLow), 100);
      const sprite = new THREE.Sprite(impostorMat);
      sprite.scale.set(treeW * scale, treeH * scale, 1);
      sprite.position.y = (treeH * scale) / 2;
      lod.addLevel(sprite, 220);
      lod.position.set(x, y, z);
      scene.add(lod);
      lodObjects.push(lod);
    }
  });

  const loader2 = new GLTFLoader();
  loader2.setDRACOLoader(makeDraco());
  loader2.load('ressources/anime_tree.glb', (gltf) => {
    const src = gltf.scene;
    src.updateWorldMatrix(true, true);
    src.traverse(child => {
      if (!child.isMesh) return;
      child.castShadow = child.receiveShadow = true;
      if (child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach(m => { if (m.map) m.map.encoding = THREE.sRGBEncoding; });
      }
    });
    const bb = new THREE.Box3().setFromObject(src);
    src.traverse(child => { if (child.isMesh) child.geometry.translate(0, -bb.min.y, 0); });

    for (let i = 0; i < 60; i++) {
      const x = (Math.random() - 0.5) * T_SIZE * 0.75;
      const z = (Math.random() - 0.5) * T_SIZE * 0.75;
      if (Math.sqrt(x*x + (z-100)**2) < 40) continue;
      if (Math.sqrt((x-LAKE_X)**2 + (z-LAKE_Z)**2) < LAKE_R + 18) continue;
      const y = getHeight(x, z);
      if (y < W_LEVEL + 1) continue;
      const t = src.clone();
      t.scale.setScalar(2.2 + Math.random() * 1.2);
      t.rotation.y = Math.random() * Math.PI * 2;
      t.position.set(x, y, z);
      scene.add(t);
    }
  });
}
