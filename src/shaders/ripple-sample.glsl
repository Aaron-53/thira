uniform sampler2D uRipples;
uniform vec2 uRippleOrigin;
uniform float uRippleExtent;
uniform vec2 uRippleTexel;
float rippleHeight(vec2 worldXZ) {
  vec2 uv = (worldXZ - uRippleOrigin) / uRippleExtent;
  float edge = min(min(uv.x, uv.y), min(1.0-uv.x, 1.0-uv.y));
  return texture2D(uRipples, clamp(uv, 0.0, 1.0)).r * smoothstep(0.0, .04, edge);
}
vec2 rippleGradient(vec2 worldXZ) {
  float e = uRippleTexel.x * uRippleExtent;
  return vec2(rippleHeight(worldXZ+vec2(e,0))-rippleHeight(worldXZ-vec2(e,0)),
              rippleHeight(worldXZ+vec2(0,e))-rippleHeight(worldXZ-vec2(0,e)))/(2.0*e);
}
