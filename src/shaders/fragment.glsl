precision highp float;

uniform float u_time;
varying vec2 v_uv;

void main() {
  gl_FragColor = vec4(
    vec3(
      (sin(u_time * v_uv.x) + 1.0) / 2.0,
      (cos(u_time * v_uv.y) + 1.0) / 2.0,
      (cos(u_time) + 1.0) / 2.0
    ),
    1.0);
}