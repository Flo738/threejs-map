import * as THREE from 'https://esm.sh/three@0.132.2';

export const T_SIZE   = 500;
export const T_HEIGHT = 24;
export const W_LEVEL  = 4;
export const LAKE_X   = 0;
export const LAKE_Z   = 0;
export const LAKE_R   = 95;
export const FIRE_X   = 130;
export const FIRE_Z   = 90;

export const SUN_DIR  = new THREE.Vector3(-0.52, 0.055, -0.84).normalize();
export const SUN_COL  = new THREE.Color(0xff6618);
export const SKY_TINT = new THREE.Color(0xff9966);
