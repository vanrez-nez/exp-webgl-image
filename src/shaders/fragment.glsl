#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform float u_time;
uniform vec2 u_mouse;
uniform vec2 u_ratio;
uniform sampler2D u_tImage;
uniform sampler2D u_tNoise;

uniform float u_waveIntensity;
uniform float u_waveScale;

// https://www.shadertoy.com/view/MdlXz8
// https://www.shadertoy.com/view/4t33z8
varying vec2 v_uv;
varying vec2 v_uv2;

void main() {

  vec2 uv = v_uv;

  vec2 warpUV = 1. * 0.2 * uv;
	float d = length( warpUV );
	vec2 st = warpUV + 0.1 * vec2(
    cos( 0.2 * u_time + d ),
		sin( 0.2 * u_time - d )
  );
  vec3 warpedCol = texture2D( u_tNoise, st ).xyz * 1.0;
  float w = max( warpedCol.r, 0.75);
  vec2 offset = 0.01 * u_waveIntensity * cos( warpedCol.rg * 3.14159 );
  vec3 col = texture2D( u_tImage, uv + offset ).rgb * vec3(1.0, 1.0, 1.5) ;
  col *= w * 2.;

  float force = distance(u_mouse * u_ratio, v_uv2 * u_ratio);
  //vec3 color = //texture2D(u_tImage, v_uv + force * 0.1).rgb;
  gl_FragColor = vec4(mix(col, texture2D(u_tImage, uv + offset).rgb, 0.9), 1.0);
}