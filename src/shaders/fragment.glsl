#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform float u_time;
uniform vec2 u_mouse;
uniform vec2 u_ratio;
uniform vec2 u_resolution;
varying vec2 v_uv;

void main() {
  vec2 uv = v_uv * u_ratio;
  vec2 mouse = u_mouse * u_ratio;
  vec3 color = vec3(uv, 0.25 + 0.5 * sin(u_time));
  float hole = sin(distance(uv, mouse) * 12.);
  color = mix(color, vec3(hole), -0.5);
  gl_FragColor = vec4(color, 1.0);
}