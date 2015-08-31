vec4 transition(sampler2D from, sampler2D to, vec2 coord, vec2 resolution, float t) {
  vec3 a = texture2D(from, coord / resolution).rgb;
  vec3 b = texture2D(to, coord / resolution).rgb;

  float at = clamp(2.0 - t * 2.0, 0., 1.);
  float bt = clamp(t * 2.0, 0., 1.);

  return vec4(a * at + b * bt, 1);
}

#pragma glslify: export(transition)
