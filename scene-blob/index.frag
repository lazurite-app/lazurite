precision mediump float;

uniform float iGlobalTime;
uniform float speed;

void main() {
  float r = sin(iGlobalTime) * .5 + .5;
  gl_FragColor = vec4(r, 1, 1, 1);
}
