// PS1Lambert: the game's lit surface material.
//
// It reproduces, in one small shader, exactly what the original demo got from
// MeshLambertMaterial in Three.js r128:
//   - lighting computed PER VERTEX (Gouraud) and interpolated across each
//     triangle. Newer Three.js lights Lambert per pixel, which would turn the
//     blocky lamp pools into smooth modern gradients.
//   - the old point-light falloff: (1 - distance / range) ^ decay
//   - no colour management: colours and textures are used as authored
//   - PS1 vertex snapping to the low-res pixel grid
//
// Owning this shader means the look no longer depends on which Three.js
// version is installed.
import * as THREE from 'three';

const vertexShader = /* glsl */`
uniform vec2 uSnap;
uniform vec3 ambientLightColor;
#if NUM_DIR_LIGHTS > 0
 struct DirectionalLight { vec3 direction; vec3 color; };
 uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
#endif
#if NUM_POINT_LIGHTS > 0
 struct PointLight { vec3 position; vec3 color; float distance; float decay; };
 uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
#endif
varying vec3 vLight;
varying float vFogDepth;
#ifdef PS1_UV
 varying vec2 vUv;
#endif
#ifdef USE_COLOR
 varying vec3 vColor;
#endif

void main() {
 #ifdef PS1_UV
  vUv = uv;
 #endif
 #ifdef USE_COLOR
  vColor = color;
 #endif
 vec3 n = normalize( normalMatrix * normal );
 vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
 gl_Position = projectionMatrix * mvPosition;
 // vertex snapping: clip-space xy quantised to the low-res pixel grid -> polygon wobble
 if ( gl_Position.w > 0.0 ) {
  vec2 sp = gl_Position.xy / gl_Position.w;
  sp = floor( sp * uSnap + 0.5 ) / uSnap;
  gl_Position.xy = sp * gl_Position.w;
 }

 vec3 light = ambientLightColor;
 #if NUM_DIR_LIGHTS > 0
  for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
   light += clamp( dot( n, directionalLights[ i ].direction ), 0.0, 1.0 ) * directionalLights[ i ].color;
  }
 #endif
 #if NUM_POINT_LIGHTS > 0
  for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
   vec3 lv = pointLights[ i ].position - mvPosition.xyz;
   float d = length( lv );
   float atten = 1.0;
   if ( pointLights[ i ].distance > 0.0 && pointLights[ i ].decay > 0.0 ) {
    atten = pow( clamp( 1.0 - d / pointLights[ i ].distance, 0.0, 1.0 ), pointLights[ i ].decay );
   }
   light += clamp( dot( n, lv / d ), 0.0, 1.0 ) * pointLights[ i ].color * atten;
  }
 #endif
 vLight = light;
 vFogDepth = - mvPosition.z;
}`;

const fragmentShader = /* glsl */`
uniform vec3 diffuse;
uniform float opacity;
uniform vec3 emissive;
uniform float emissiveIntensity;
uniform float uAlphaTest;
uniform vec3 fogColor;
uniform float fogDensity;
#ifdef PS1_MAP
 uniform sampler2D map;
#endif
#ifdef PS1_EMISSIVEMAP
 uniform sampler2D emissiveMap;
#endif
varying vec3 vLight;
varying float vFogDepth;
#ifdef PS1_UV
 varying vec2 vUv;
#endif
#ifdef USE_COLOR
 varying vec3 vColor;
#endif

void main() {
 vec4 diffuseColor = vec4( diffuse, opacity );
 #ifdef PS1_MAP
  diffuseColor *= texture2D( map, vUv );
 #endif
 #ifdef USE_COLOR
  diffuseColor.rgb *= vColor;
 #endif
 if ( diffuseColor.a < uAlphaTest ) discard;
 vec3 glow = emissive * emissiveIntensity;
 #ifdef PS1_EMISSIVEMAP
  glow *= texture2D( emissiveMap, vUv ).rgb;
 #endif
 vec3 outgoing = diffuseColor.rgb * vLight + glow;
 float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
 gl_FragColor = vec4( mix( outgoing, fogColor, clamp( fogFactor, 0.0, 1.0 ) ), diffuseColor.a );
}`;

export class PS1Lambert extends THREE.ShaderMaterial {
  // opts: color, map, emissive, emissiveMap, emissiveIntensity, vertexColors,
  //       alphaTest, plus any plain Material option (transparent, polygonOffset...).
  constructor(snapUniform, opts = {}) {
    const { color = 0xffffff, map = null, emissive = 0x000000, emissiveMap = null, emissiveIntensity = 1, alphaTest = 0, ...rest } = opts;
    const uniforms = THREE.UniformsUtils.merge([
      THREE.UniformsLib.lights,
      THREE.UniformsLib.fog,
      {
        diffuse: { value: new THREE.Color(color) },
        opacity: { value: 1 },
        emissive: { value: new THREE.Color(emissive) },
        emissiveIntensity: { value: emissiveIntensity },
        uAlphaTest: { value: alphaTest },
        map: { value: null },
        emissiveMap: { value: null },
      },
    ]);
    // Textures and the snap grid are shared by reference, not cloned.
    uniforms.map.value = map;
    uniforms.emissiveMap.value = emissiveMap;
    uniforms.uSnap = snapUniform;
    const defines = {};
    if (map || emissiveMap) defines.PS1_UV = '';
    if (map) defines.PS1_MAP = '';
    if (emissiveMap) defines.PS1_EMISSIVEMAP = '';
    super({ uniforms, defines, vertexShader, fragmentShader, lights: true, fog: true, ...rest });
    this.type = 'PS1Lambert';
  }
  get color() { return this.uniforms.diffuse.value; }
  get emissive() { return this.uniforms.emissive.value; }
  get emissiveIntensity() { return this.uniforms.emissiveIntensity.value; }
  set emissiveIntensity(v) { this.uniforms.emissiveIntensity.value = v; }
}
