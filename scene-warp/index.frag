precision mediump float;

uniform float iGlobalTime;
uniform vec3  iResolution;
uniform float uChannelOffset;
uniform float uWarp;
uniform float uWeird;


float n(float g) { return g * .5 + .5; }

void main() {
  vec2 uv = 2. * gl_FragCoord.xy / iResolution.xy - 1.;
  vec2 p  = vec2(1, iResolution.y/iResolution.x) * uv;
  float a = atan(p.y, p.x);
  float l = length(p);
  vec3  c = vec3(0);

  p = vec2(sin(a), cos(a))/l;

  for (int i = 0; i < 3; i++) {
    float mag = 0.0;
    float t = iGlobalTime;// + float(i) * 0.05;

    p.y += 0.425 * uChannelOffset;

    mag += n(cos(p.y * 1.5 + t * 5. * uWarp));
    mag += n(sin(p.x * uWeird + t * 3. * uWarp));
    mag += n(cos(p.x * p.y * uWeird));
    mag *= 0.3333;

    c[i] = mag;
  }

  gl_FragColor = vec4(1.0 - pow(c * vec3(0.9, 0.8, 0.7), vec3(0.4545)), 1);
}
