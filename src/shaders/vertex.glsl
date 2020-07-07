attribute vec2 position;
uniform vec2 u_scale;
uniform vec2 u_offset;
uniform vec2 u_origin;

attribute vec2 uv;
varying vec2 v_uv;
varying vec2 v_uv2;

void main() {
  v_uv = (uv - u_origin) / u_scale + u_offset;
  v_uv += u_origin;
  v_uv2 = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}