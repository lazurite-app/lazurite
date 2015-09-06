precision mediump float;

uniform float iGlobalTime;
uniform vec3  iResolution;

vec2 doModel(vec3 p);

#pragma glslify: raytrace = require('glsl-raytrace', map = doModel, steps = 90)
#pragma glslify: normal = require('glsl-sdf-normal', map = doModel)
#pragma glslify: camera = require('glsl-turntable-camera')
#pragma glslify: random = require('glsl-random')
#pragma glslify: noise = require('glsl-noise/simplex/2d')
#pragma glslify: fog = require('glsl-fog')
#pragma glslify: hsl = require('glsl-hsl2rgb')
#define PI 3.14159265359
#define TAU 6.28318530718

uniform sampler2D waveformL1;
uniform sampler2D waveformR1;
uniform float hue1;
uniform float hue2;

void main() {
  vec2 uv = vec2(gl_FragCoord.xy / iResolution.xy);
  float a1 = texture2D(waveformL1, uv).r * 2.0 - 1.0;
  float a2 = 1.0 - texture2D(waveformR1, uv).r * 2.0;

  uv = uv * 2.0 - 1.0;

  float w1 = 1.5 * pow(max(0.0, 1.0 - 5.0 * abs(uv.y - a1)), 10.1);
  float w2 = 1.5 * pow(max(0.0, 1.0 - 5.0 * abs(uv.y - a2)), 10.1);

  vec3 color = (
    w1 * hsl(hue1, 0.75, 0.65) +
    w2 * hsl(hue2, 0.75, 0.65)
  );

  gl_FragColor.rgb = color;
  gl_FragColor.a   = 1.0;
}
