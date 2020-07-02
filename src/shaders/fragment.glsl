precision mediump float;

uniform float u_time;
uniform vec2 u_mouse;
varying vec2 v_uv;

void main() {
  vec3 color = vec3(v_uv, 0.25 + 0.5 * sin(u_time));
  float hole = sin(distance(v_uv, u_mouse) * 12.);
  color = mix(color, vec3(hole), -0.5);
  gl_FragColor = vec4(color, 1.0);
}