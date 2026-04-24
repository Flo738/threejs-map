import * as THREE         from 'https://esm.sh/three@0.132.2';
import { OrbitControls }  from 'https://esm.sh/three@0.132.2/examples/jsm/controls/OrbitControls.js';
import { Sky }            from 'https://esm.sh/three@0.132.2/examples/jsm/objects/Sky.js';
import { EffectComposer } from 'https://esm.sh/three@0.132.2/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass }     from 'https://esm.sh/three@0.132.2/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass }from 'https://esm.sh/three@0.132.2/examples/jsm/postprocessing/UnrealBloomPass.js';
import Stats              from 'https://cdn.jsdelivr.net/npm/stats.js@0.17.0/src/Stats.js';
import { SUN_DIR, SUN_COL, SKY_TINT, LAKE_X, LAKE_Z, LAKE_R, W_LEVEL, FIRE_X, FIRE_Z } from './constants.js';
import { getHeight } from './terrain.js';

export function initRenderer() {
  const r = new THREE.WebGLRenderer({ antialias: true });
  r.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  r.setSize(window.innerWidth, window.innerHeight);
  r.shadowMap.enabled   = true;
  r.shadowMap.type      = THREE.PCFSoftShadowMap;
  r.toneMapping         = THREE.ACESFilmicToneMapping;
  r.toneMappingExposure = 0.8;
  r.outputEncoding      = THREE.sRGBEncoding;
  r.setClearColor(0xcc8855);
  document.body.appendChild(r.domElement);
  return r;
}

export function initStats() {
  const s = new Stats();
  s.showPanel(0);
  document.body.appendChild(s.dom);
  return s;
}

export function initScene() {
  const s = new THREE.Scene();
  s.fog = new THREE.Fog(0xcc8855, 200, 480);
  s.background = null;
  return s;
}

export function initCamera(renderer) {
  const cam  = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 2000);
  cam.position.set(90, 14, 90);
  cam.lookAt(20, 4, 20);
  const ctrl = new OrbitControls(cam, renderer.domElement);
  ctrl.enableDamping = true;
  ctrl.dampingFactor = 0.05;
  ctrl.target.set(20, 4, 20);
  return { camera: cam, controls: ctrl };
}

export function initPostProcessing(renderer, scene, camera) {
  const c = new EffectComposer(renderer);
  c.addPass(new RenderPass(scene, camera));
  c.addPass(new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.35, 0.4, 0.75));
  return c;
}

export function initLights(scene) {
  scene.add(new THREE.AmbientLight(0x665544, 0.32));

  const sun = new THREE.DirectionalLight(SUN_COL.getHex(), 3.4);
  sun.position.set(SUN_DIR.x * 500, SUN_DIR.y * 500, SUN_DIR.z * 500);
  sun.target.position.set(0, 0, 0);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left   = sun.shadow.camera.bottom = -280;
  sun.shadow.camera.right  = sun.shadow.camera.top    =  280;
  sun.shadow.camera.near   = 1;
  sun.shadow.camera.far    = 700;
  sun.shadow.bias          = -0.0003;
  scene.add(sun);
  scene.add(sun.target);

  scene.add(new THREE.HemisphereLight(0xff5522, 0x1a1008, 0.65));

  const moon = new THREE.PointLight(0x6688cc, 0.25, 800, 1.2);
  moon.position.set(200, 300, -200);
  scene.add(moon);

  const lakeLight = new THREE.PointLight(0xff7744, 0.35, 90, 2.0);
  lakeLight.position.set(LAKE_X, W_LEVEL + 12, LAKE_Z);
  scene.add(lakeLight);

  const fireY  = getHeight(FIRE_X, FIRE_Z);
  const fireSpt = new THREE.SpotLight(0xff6622, 5.0, 120, Math.PI / 5, 0.4, 1.5);
  fireSpt.position.set(FIRE_X, fireY + 14, FIRE_Z);
  fireSpt.target.position.set(FIRE_X, fireY, FIRE_Z);
  fireSpt.castShadow = true;
  fireSpt.shadow.mapSize.set(1024, 1024);
  fireSpt.shadow.bias = -0.001;
  scene.add(fireSpt);
  scene.add(fireSpt.target);

  const ember = new THREE.PointLight(0xff4400, 3.0, 40, 2.0);
  ember.position.set(FIRE_X, fireY + 1.5, FIRE_Z);
  scene.add(ember);

  return {
    uTime:        { value: 0 },
    uCameraPos:   { value: new THREE.Vector3() },
    uLakeR:       { value: LAKE_R },
    uDeepColor:   { value: new THREE.Color(0x010508) },
    uShallowColor:{ value: new THREE.Color(0x071828) },
    uSkyColor:    { value: SKY_TINT.clone() },
    uSunDir:      { value: SUN_DIR.clone() },
    uSunColor:    { value: SUN_COL.clone() },
  };
}

export function initSky(scene) {
  const sky = new Sky();
  sky.scale.setScalar(500000);
  sky.material.fog = false;
  scene.add(sky);
  const u = sky.material.uniforms;
  u['turbidity'].value       = 12;
  u['rayleigh'].value        = 3.0;
  u['mieCoefficient'].value  = 0.006;
  u['mieDirectionalG'].value = 0.985;
  u['sunPosition'].value.copy(SUN_DIR);
}
