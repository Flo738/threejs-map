import * as THREE from 'https://esm.sh/three@0.132.2';

const tl = new THREE.TextureLoader();
const A  = 'ressources/Arbres/';

export const TX = {
  terrainColor:   tl.load('https://threejs.org/examples/textures/terrain/grasslight-big.jpg'),
  grassColor:     tl.load(A + 'grass_color.webp'),
  plantColor:     tl.load(A + 'plant_color.webp'),
  plantNormal:    tl.load(A + 'plant_normal.webp'),
  plantORM:       tl.load(A + 'plant_orm.webp'),
  alphaBushRound: tl.load(A + 'alpha_bush_round.webp'),
  alphaFlowerTall:tl.load(A + 'alpha_flower_tall.webp'),
  alphaFlowerStar:tl.load(A + 'alpha_flower_star.webp'),
  treeColor:      tl.load(A + 'tree_color.webp'),
  treeLeafColor:  tl.load(A + 'tree_leaf_color.webp'),
  impostor:       tl.load(A + 'tree_impostor.webp'),
};

TX.terrainColor.wrapS = TX.terrainColor.wrapT = THREE.RepeatWrapping;
TX.terrainColor.repeat.set(25, 25);
TX.terrainColor.encoding = THREE.sRGBEncoding;
TX.grassColor.encoding   = THREE.sRGBEncoding;
