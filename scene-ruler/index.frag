precision mediump float;

uniform float iGlobalTime;
uniform vec3 iResolution;

uniform float objectRaise;
uniform float sphereBlend;

vec2 doModel(vec3 p);

#pragma glslify: ruler = require('glsl-ruler/color')
#pragma glslify: trace = require('glsl-ruler/trace', map = doModel, steps = 90)
#pragma glslify: normal = require('glsl-sdf-normal', map = doModel)
#pragma glslify: camera = require('glsl-turntable-camera')
#pragma glslify: box = require('glsl-sdf-box')

vec2 doModel(vec3 p) {
  p.y -= objectRaise;

  float b  = box(p, vec3(1.0));
  float d  = length(p) - 1.0;
  float id = 1.0;

  return vec2(mix(b, d, sphereBlend), id);
}

void main() {
  vec3 color = vec3(0.0);
  vec3 ro, rd;

  float rotation = iGlobalTime;
  float height   = 3.0;
  float dist     = 4.0;
  camera(rotation, height, dist, iResolution.xy, ro, rd);

  vec3 t = trace(ro, rd);
  if (t.x > -0.5) {
    vec3 pos = ro + rd * t.x;
    vec3 nor = normal(pos);

    color = nor * 0.5 + 0.5;
    color = t.y < -0.5 ? ruler(t.z) : color;
  }

  gl_FragColor.rgb = color;
  gl_FragColor.a   = 1.0;
}
