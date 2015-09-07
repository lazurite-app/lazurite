precision mediump float;

#define RING_COUNT 2
#define RING_PRECISION 0.2

struct Ring {
  float movement;
  float radius;
  float speed;
  vec2  spin;
};

uniform float audioReaction;

uniform sampler2D waveformL0;
uniform float time;
uniform mat4 proj;
uniform mat4 view;
uniform Ring rings[RING_COUNT];

attribute float index;
varying float vindex;
varying vec3  vpos;

vec3 cartesian(vec2 ll) {
  return vec3(
      cos(ll.x) * sin(ll.y)
    , sin(ll.x) * sin(ll.y)
    , cos(ll.y)
  );
}

void main() {
  vec3 position = vec3(0.0);

  for (int i = 0; i < RING_COUNT; i++) {
    Ring ring = rings[i];

    position += ring.radius * cartesian(
        RING_PRECISION
      * index
      * (ring.spin + vec2(sin(time * ring.speed), cos(time * ring.speed)) * ring.movement)
    );
  }

  float amplitude = 2. * (texture2D(waveformL0, vec2(fract(position.x * 0.1), 0.0)).r - 0.5); // index * 0.002
  position *= 1.0 + amplitude * 0.5 * audioReaction;

  gl_Position = proj * view * vec4(position, 1.0);
  vindex = index;
  vpos = position;
}
