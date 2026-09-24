uniform sampler2D uState;
uniform vec2 uTexel;
uniform vec2 uImpulse;
uniform float uStrength;
uniform float uRadius;
varying vec2 vUv;
void main() {
  vec2 state = texture2D(uState, vUv).rg;
  float laplacian = texture2D(uState, vUv + vec2(uTexel.x, 0.0)).r
                  + texture2D(uState, vUv - vec2(uTexel.x, 0.0)).r
                  + texture2D(uState, vUv + vec2(0.0, uTexel.y)).r
                  + texture2D(uState, vUv - vec2(0.0, uTexel.y)).r - 4.0 * state.r;
  // R stores the current height; G stores the previous height.
  // c²=.22 is below the two-dimensional CFL stability limit of .5.
  float next = (2.0 * state.r - state.g + .22 * laplacian) * .985;
  vec2 offset = (vUv - uImpulse) / uRadius;
  next += exp(-dot(offset, offset) * .5) * uStrength;
  float edge = min(min(vUv.x, vUv.y), min(1.0-vUv.x, 1.0-vUv.y));
  next *= smoothstep(0.0, .035, edge);
  gl_FragColor = vec4(clamp(next, -2.0, 2.0), state.r, 0.0, 1.0);
}
