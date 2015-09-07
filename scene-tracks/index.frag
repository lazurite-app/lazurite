precision mediump float;

uniform float iGlobalTime;
uniform vec3 iResolution;

uniform float noiseAmplitude;
uniform float noiseDetail;
uniform float blobRadius;
uniform float cameraRotation;
uniform float cameraHeight;
uniform float trackWidth;
uniform float trackWave;
uniform float trackRaise;
uniform sampler2D waveformL0;

vec2 doModel(vec3 p);

#pragma glslify: raytrace = require('glsl-raytrace', map = doModel, steps = 90)
#pragma glslify: normal = require('glsl-sdf-normal', map = doModel)
#pragma glslify: sdBox = require('glsl-sdf-primitives/sdBox')
#pragma glslify: camera = require('glsl-turntable-camera')
#pragma glslify: noise2 = require('glsl-noise/simplex/2d')
#pragma glslify: noise3 = require('glsl-noise/simplex/3d')
#pragma glslify: noise = require('glsl-noise/simplex/4d')
#pragma glslify: fog = require('glsl-fog')

#define ID_TRACKS 1.0
#define ID_TERRAIN 2.0

void pmod(inout float p, float n) {
  p = mod(p, n) - n * 0.5;
}
void pmod(inout vec2 p, float n) {
  p = mod(p, n) - n * 0.5;
}
void pmod(inout vec3 p, float n) {
  p = mod(p, n) - n * 0.5;
}

vec2 su(vec2 a, vec2 b) {
  return a.x < b.x ? a : b;
}

float trackSide(vec3 p) {
  vec3 trackGap = vec3(0.25 * trackWidth, 0, 0);

  pmod(p.z, 0.1);

  return min(
    sdBox(p + trackGap, vec3(0.05, 0.05, 1.0)),
    sdBox(p - trackGap, vec3(0.05, 0.05, 1.0))
  );
}

float trackNotch(vec3 p) {
  pmod(p.z, 0.5);
  return sdBox(p, vec3(0.25 * trackWidth + 0.1, 0.065, 0.05));
}

float trackBase(vec3 p) {
  pmod(p.z, 0.5);
  p.y += 100.0;
  return sdBox(p, vec3(0.25 * trackWidth + 0.25, 100.0, 0.5));
}

float track(vec3 p) {
  p.y -= trackRaise;

  return min(min(
    trackSide(p),
    trackNotch(p)
  ), trackBase(p));
}

float heightmap(vec2 p) {
  float h = 0.0;

  p *= noiseDetail;
  h += noise2(vec2(p * 0.005)) * 5.5;
  h += noise2(vec2(p * 0.15)) * 0.5;
  h += (texture2D(waveformL0, p.yx * vec2(0.1, 1.0)).r - 0.5) * 0.25 * trackWave;

  return h * noiseAmplitude;
}

vec2 doModel(vec3 p) {
  float groundTrack = heightmap(vec2(0.0, p.z)) + trackRaise;
  float ground = heightmap(p.xz);
  float terrain = p.y - ground;

  p.y -= groundTrack;

  return su(
    vec2(track(p), ID_TRACKS),
    vec2(terrain, ID_TERRAIN)
  );
}

void main() {
  vec3 bgcolor = vec3(1);
  vec3 sunCol = vec3(1);
  vec3 sunDir = normalize(vec3(-0.045, 1, 0.025));

  vec3 color = bgcolor;
  vec3 ro, rd;

  float rotation = cameraRotation;
  float height   = cameraHeight + 0.25;
  float dist     = 8.0;
  camera(rotation, height, dist, iResolution.xy, ro, rd);

  ro.z -= iGlobalTime * 10.;
  ro.y += heightmap(ro.xz);
  ro.y += trackRaise;

  vec2 t = raytrace(ro, rd);
  if (t.x > -0.5) {
    vec3 pos = ro + rd * t.x;
    vec3 nor = normal(pos);
    vec3 mat = vec3(1.0);

    float sunDif = max(0.0, dot(sunDir, nor));
    if (t.y == ID_TERRAIN) {
      mat = vec3(1.0);
    }

    color = mat * sunCol * sunDif;
    color = mix(color, bgcolor, fog(t.x, 0.125));
  }

  gl_FragColor.rgb = color;
  gl_FragColor.a   = 1.0;
}
