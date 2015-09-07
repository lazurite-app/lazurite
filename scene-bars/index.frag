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

uniform sampler2D waveformL0;
uniform sampler2D waveformR0;
uniform float barScale;
uniform float wavesAmount;
uniform float wavesPeriod;
uniform float noiseAmount;
uniform float noisePeriod;
uniform float brightness;

void main() {
  vec2 uv = vec2(gl_FragCoord.xy / iResolution.xy);

  uv.x *= barScale;
  uv.x += wavesAmount * sin(sin(uv.y * wavesPeriod) + iGlobalTime);
  uv.x += noiseAmount * (
    noise(vec2(uv.y * noisePeriod * 8.0, iGlobalTime)) +
    noise(vec2(uv.y * noisePeriod * 100.0, iGlobalTime) * 0.1)
  );

  float amplitude = (texture2D(waveformL0, uv).r * 2.0 - 1.0) * 10.0 * brightness;

  vec3 color = vec3(0);

  color += max(0.0, +amplitude) * hsl(fract(iGlobalTime * 1.000 + 0.0), 0.5, 0.5);
  color += max(0.0, -amplitude) * hsl(fract(iGlobalTime * 0.953 + 0.5), 0.5, 0.5);

  gl_FragColor.rgb = color;
  gl_FragColor.a   = 1.0;
}
