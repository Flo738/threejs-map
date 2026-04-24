export const WATER_VERT = `
  uniform float uTime;
  uniform float uLakeR;
  varying vec3  vWorldPos;
  varying vec3  vNormal;
  varying float vCrest;
  varying vec2  vUv;

  vec3 gerstner(vec2 xz, vec2 dir, float steep, float amp, float freq, float spd) {
    vec2  d = normalize(dir);
    float f = freq * dot(d, xz) + spd * uTime;
    return vec3(d.x * steep * amp * cos(f), amp * sin(f), d.y * steep * amp * cos(f));
  }

  vec3 gerstnerAll(vec2 xz) {
    vec3 g  = gerstner(xz, vec2( 1.0,  0.30), 0.75, 0.40, 0.07, 1.10);
         g += gerstner(xz, vec2(-0.6,  1.00), 0.60, 0.24, 0.12, 0.85);
         g += gerstner(xz, vec2( 0.2, -0.85), 0.45, 0.15, 0.19, 0.65);
         g += gerstner(xz, vec2( 0.8,  0.60), 0.30, 0.09, 0.28, 1.40);
    return g;
  }

  void main() {
    vUv = uv;

    float radial   = length(position.xz) / uLakeR;
    float edgeFade = 1.0 - smoothstep(0.55, 0.97, radial);

    vec3 p  = position;
    vec3 ga = gerstnerAll(p.xz) * edgeFade;
    p      += ga;
    vCrest  = clamp(ga.y / 0.88, 0.0, 1.0);

    float e   = 0.4;
    float ef2 = 1.0 - smoothstep(0.55, 0.97, length(position.xz + vec2(e,0)) / uLakeR);
    float ef3 = 1.0 - smoothstep(0.55, 0.97, length(position.xz + vec2(0,e)) / uLakeR);
    vec3 px   = position + vec3(e,0,0) + gerstnerAll(position.xz + vec2(e,0)) * ef2;
    vec3 pz   = position + vec3(0,0,e) + gerstnerAll(position.xz + vec2(0,e)) * ef3;
    vNormal = normalize(cross(normalize(pz - p), normalize(px - p)));

    vec4 world  = modelMatrix * vec4(p, 1.0);
    vWorldPos   = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

export const WATER_FRAG = `
  precision highp float;
  uniform float uTime;
  uniform vec3  uCameraPos;
  uniform vec3  uDeepColor;
  uniform vec3  uShallowColor;
  uniform vec3  uSkyColor;
  uniform vec3  uSunDir;
  uniform vec3  uSunColor;
  varying vec3  vWorldPos;
  varying vec3  vNormal;
  varying float vCrest;
  varying vec2  vUv;

  void main() {
    vec3  N       = normalize(vNormal);
    vec3  V       = normalize(uCameraPos - vWorldPos);
    float cosT    = max(dot(N, V), 0.0);
    float fresnel = 0.04 + 0.96 * pow(1.0 - cosT, 5.0);

    vec3  L      = normalize(uSunDir);
    vec3  Rl     = reflect(-L, N);
    float NdotL  = max(dot(N, L), 0.0);
    float spec   = pow(max(dot(Rl, V), 0.0), 280.0) * 2.0;
    float glint  = pow(max(dot(Rl, V), 0.0),  40.0) * 0.40;

    vec3 waterBase = mix(uDeepColor, uShallowColor, clamp(vCrest, 0.0, 1.0));
    vec3 skyRefl   = mix(uSkyColor * 0.75, uSunColor * 1.1, NdotL * 0.6);
    vec3 color     = mix(waterBase, skyRefl, fresnel * 0.75);

    float foam = smoothstep(0.60, 1.0, vCrest) * 0.35;
    color = mix(color, vec3(0.85, 0.88, 0.90), foam);
    color += uSunColor * (spec + glint);

    gl_FragColor = vec4(color, mix(0.88, 0.97, fresnel));
  }
`;

export const FIREFLY_VERT = `
  attribute vec3  aOffset;
  attribute vec4  aRnd;
  uniform   float uTime;
  varying   float vFlicker;
  void main() {
    float px     = aOffset.x + 4.0 * sin(0.38 * uTime + aRnd.x * 6.2832);
    float pz     = aOffset.z + 4.0 * cos(0.33 * uTime + aRnd.z * 6.2832);
    float py     = aOffset.y + 1.2 * sin(0.55 * uTime + aRnd.y * 6.2832);
    vFlicker     = 0.5 + 0.5 * sin(4.5 * uTime + aRnd.w * 6.2832);
    vec4 mvPos   = modelViewMatrix * vec4(px, py, pz, 1.0);
    gl_PointSize = (4.0 + 3.0 * vFlicker) * (280.0 / -mvPos.z);
    gl_Position  = projectionMatrix * mvPos;
  }
`;

export const FIREFLY_FRAG = `
  varying float vFlicker;
  void main() {
    vec2  uv    = gl_PointCoord - 0.5;
    float d     = length(uv);
    if (d > 0.5) discard;
    float core  = 1.0 - smoothstep(0.0, 0.18, d);
    float halo  = 1.0 - smoothstep(0.0, 0.50, d);
    float alpha = core + halo * 0.4 * vFlicker;
    vec3  col   = mix(vec3(0.9, 1.0, 0.25), vec3(0.3, 0.95, 0.7), vFlicker);
    gl_FragColor = vec4(col * 2.8, alpha);
  }
`;
