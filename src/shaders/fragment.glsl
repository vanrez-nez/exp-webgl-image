precision highp float;

uniform vec3 u_vec3a[3];
uniform float u_fa[10];
varying vec2 v_uv;

void main() {
  vec3 c = vec3(0.0);
  c.r += u_vec3a[0].r;
  c.g += u_vec3a[1].g;
  c.b += u_vec3a[2].b + u_fa[0];
  gl_FragColor = vec4(c, 1.0);
}