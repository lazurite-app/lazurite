precision mediump float;

uniform float iGlobalTime;
uniform vec3  iResolution;

uniform float turnRate;
uniform float turnOffset;
uniform float nodeThickness;
uniform float baseThickness;
uniform float lightReaction;
uniform float lightBase;
uniform float satReaction;
uniform float satBase;
uniform float hueReaction;
uniform float hueBase;

vec2 doModel(vec3 p);

#pragma glslify: raytrace = require('glsl-raytrace', map = doModel, steps = 90)
#pragma glslify: normal = require('glsl-sdf-normal', map = doModel)
#pragma glslify: camera = require('glsl-turntable-camera')
#pragma glslify: random = require('glsl-random')
#pragma glslify: noise = require('glsl-noise/simplex/4d')
#pragma glslify: fog = require('glsl-fog')
#pragma glslify: hsl = require('glsl-hsl2rgb')
#define PI 3.14159265359
#define TAU 6.28318530718

uniform sampler2D waveformL0;
uniform sampler2D waveformR0;
uniform sampler2D frequencyL0;

void pmod(inout vec3 p, float n) {
  p = mod(p + n, n * 2.0) - n;
}
void pmod(inout vec2 p, float n) {
  p = mod(p + n, n * 2.0) - n;
}
void pmod(inout float p, float n) {
  p = mod(p + n, n * 2.0) - n;
}

float sdBox( vec3 p, vec3 b ) {
  vec3 d = abs(p) - b;
  return min(max(d.x,max(d.y,d.z)),0.0) +
         length(max(d,0.0));
}

mat4 rotationMatrix(vec3 axis, float angle)
{
    axis = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;

    return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
                oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
                oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
                0.0,                                0.0,                                0.0,                                1.0);
}

vec3 rotater (vec3 p, float a, float d) {
  return (
    rotationMatrix(vec3(0, 0, 1), PI * -a) * vec4(p + d * vec3(sin(PI * a), cos(PI * a), 0), 1)
  ).xyz;
}

vec2 doModel(vec3 p) {
  vec3 op = p;
  float idx = floor(op.z + 0.5) - 1.0;

  vec2 frq = vec2(
    texture2D(frequencyL0, vec2(0.01 + fract(idx * 0.1) * 0.1)).r
  );

  pmod(p.z, 1.0);

  p.y = -abs(p.y);

  vec3 p1 = rotater(p, +0.33, 1.0);
  vec3 p2 = rotater(p, +0.00, 1.0);
  vec3 p3 = rotater(p, -0.33, 1.0);

  p1 = (rotationMatrix(normalize(vec3(0, 1, 1)), iGlobalTime + idx * turnRate + turnOffset) * vec4(p1, 1)).xyz;
  p2 = (rotationMatrix(normalize(vec3(0, 1, 1)), iGlobalTime + idx * turnRate + turnOffset) * vec4(p2, 1)).xyz;
  p3 = (rotationMatrix(normalize(vec3(0, 1, 1)), iGlobalTime + idx * turnRate + turnOffset) * vec4(p3, 1)).xyz;

  vec3 size = vec3(0.225, 0.025 + nodeThickness, 0.125) * frq.x + baseThickness;

  float r  = 1.0;
  float d  = min(min(sdBox(p1, size), sdBox(p2, size)), sdBox(p3, size));

  return vec2(d, idx);
}

void main() {
  vec3 color = vec3(0.0);
  vec3 ro, rd;

  float rotation = 0.0; //iGlobalTime;
  float height   = 0.0;
  float dist     = 4.0;
  camera(rotation, height, dist, iResolution.xy, ro, rd);

  ro.z += iGlobalTime * 10.0;

  vec2 t = raytrace(ro, rd);
  if (t.x > -0.5) {
    vec3 pos = ro + rd * t.x;
    vec2 amp = (vec2(
      texture2D(waveformL0, t.yy * 0.1).r,
      texture2D(waveformR0, t.yy * 0.1).r
    ) - vec2(0.5)) * 2.0;

    vec3 nor = normal(pos);
    vec3 col = hsl(
      fract(hueBase + 0.5 + iGlobalTime + 5.0 * random(vec2(t.y, 0.5)) + amp.x * hueReaction),
      satBase + amp.x * satReaction,
      lightReaction * amp.y + lightBase
    );

    vec3 mat = vec3(0.0);

    mat += col * max(0.0, 1.0 + dot(nor, vec3(0, 1, 0)));

    color = mix(mat, color, fog(t.x, 0.195));
  }


  gl_FragColor.rgb = pow(color, vec3(0.45454));
  gl_FragColor.a   = 1.0;
}
