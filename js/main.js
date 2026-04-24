import * as THREE from 'https://esm.sh/three@0.132.2';
import { initRenderer, initStats, initScene, initCamera, initPostProcessing, initLights, initSky } from './scene.js';
import { buildTerrain, buildGrass, buildBushes, buildPlants, buildTrees, lodObjects } from './vegetation.js';
import { buildWater } from './water.js';
import { buildCampfire } from './campfire.js';
import { buildPirateProps, animateShip, buildLuffy, buildAnchor } from './pirates.js';
import { buildCoins, animateCoins, buildFireflies, buildSkullParticles, animateSkullParticles } from './particles.js';

const renderer = initRenderer();
const stats    = initStats();
const scene    = initScene();
const { camera, controls } = initCamera(renderer);
const composer = initPostProcessing(renderer, scene, camera);
const waterUniforms = initLights(scene);

initSky(scene);
buildTerrain(scene);
buildGrass(scene);
buildBushes(scene);
buildPlants(scene);
buildTrees(scene);
buildWater(scene, camera, waterUniforms);
buildCampfire(scene);
buildPirateProps(scene);
buildLuffy(scene);
buildAnchor(scene);
buildCoins(scene);
const ffUniforms = buildFireflies(scene);
const skullRef   = buildSkullParticles(scene);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

const clock  = new THREE.Clock();
let   frame  = 0;

function animate() {
  requestAnimationFrame(animate);
  stats.begin();

  const elapsed = clock.getElapsedTime();
  clock.getDelta();
  frame++;

  controls.update();

  waterUniforms.uTime.value = elapsed;
  waterUniforms.uCameraPos.value.copy(camera.position);
  ffUniforms.uTime.value = elapsed;

  animateCoins(elapsed);
  animateShip(elapsed);
  animateSkullParticles(elapsed, skullRef);

  if (frame % 2 === 0) {
    for (const lod of lodObjects) {
      try { lod.update(camera); } catch(e) {}
    }
  }

  composer.render();
  stats.end();
}

animate();
