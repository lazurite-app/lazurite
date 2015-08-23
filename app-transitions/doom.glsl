int barWidth = 20;
float amplitude = 2.0;
float noise = 0.1;
float frequency = 1.0;

float rand(int num) {
  return fract(mod(float(num) * 67123.313, 12.0) * sin(float(num) * 10.3) * cos(float(num)));
}

float wave(int num) {
  float fn = float(num) * frequency * 0.1  * float(barWidth);
  return cos(fn * 0.5) * cos(fn * 0.13) * sin((fn+10.0) * 0.3) / 2.0 + 0.5;
}

float pos(int num) {
  return noise == 0.0 ? wave(num) : mix(wave(num), rand(num), noise);
}

vec4 transition(sampler2D from, sampler2D to, vec2 coord, vec2 resolution, float progress) {
  int bar = int(coord.x) / barWidth;
  float scale = 1.0 + pos(bar) * amplitude;
  float phase = progress * scale;
  float posY = coord.y / resolution.y;
  vec2 p;
  vec4 c;
  if (phase + posY < 1.0) {
    p = vec2(coord.x, coord.y + mix(0.0, resolution.y, phase)) / resolution.xy;
    c = texture2D(from, p);
  } else {
    p = coord.xy / resolution.xy;
    c = texture2D(to, p);
  }

  return c;
}

#pragma glslify: export(transition)
