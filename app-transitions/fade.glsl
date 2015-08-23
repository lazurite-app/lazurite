vec4 transition(sampler2D from, sampler2D to, vec2 coord, vec2 resolution, float progress) {
  return mix(
    texture2D(from, coord / resolution),
    texture2D(to, coord / resolution),
    progress
  );
}

#pragma glslify: export(transition)
