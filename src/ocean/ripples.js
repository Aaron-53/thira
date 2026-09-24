import * as THREE from 'three';
import fragmentShader from '../shaders/ripple.frag.glsl?raw';

export function createRipples(renderer, mobile) {
  const size = mobile ? 256 : 512;
  const extent = 64;
  const origin = new THREE.Vector2(-32, -36);
  const floatLinear = renderer.extensions.has('OES_texture_float_linear');
  const options = {
    type: floatLinear ? THREE.FloatType : THREE.HalfFloatType,
    format: THREE.RGBAFormat, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter,
    depthBuffer: false, stencilBuffer: false,
  };
  let current = new THREE.WebGLRenderTarget(size, size, options);
  let next = new THREE.WebGLRenderTarget(size, size, options);
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uState: {value: current.texture}, uTexel: {value: new THREE.Vector2(1/size, 1/size)},
      uImpulse: {value: new THREE.Vector2(-2, -2)}, uStrength: {value: 0}, uRadius: {value: .7/extent},
    },
    vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}',
    fragmentShader, depthTest: false, depthWrite: false,
  });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  scene.add(quad);
  let accumulator = 0;
  let pending = null;
  let stepCount = 0;
  let injectionCount = 0;
  function reset() {
    const oldTarget = renderer.getRenderTarget();
    const oldColor = renderer.getClearColor(new THREE.Color());
    const oldAlpha = renderer.getClearAlpha();
    renderer.setClearColor(0, 0);
    for (const target of [current, next]) { renderer.setRenderTarget(target); renderer.clear(); }
    renderer.setRenderTarget(oldTarget); renderer.setClearColor(oldColor, oldAlpha);
    accumulator = 0; pending = null; stepCount = 0; injectionCount = 0;
  }
  reset();
  return {
    size, extent, origin,
    get texture() { return current.texture; },
    get stats() { return {size, stepCount, injectionCount}; },
    recenter(x,z) {
      if(Math.abs(x-(origin.x+32))>8||Math.abs(z-(origin.y+60))>8){
        origin.set(x-32,z-60);reset();
      }
    },
    inject(x, z, strength = .12, radius = .7) {
      const u = (x-origin.x)/extent, v = (z-origin.y)/extent;
      if (u<.04 || u>.96 || v<.04 || v>.96) return false;
      if(pending&&Math.abs(pending.strength)>Math.abs(strength))return false;
      pending = {u, v, strength, radius};
      return true;
    },
    update(delta) {
      // Fixed 60Hz simulation; cap catch-up after a slow frame or tab switch.
      accumulator = Math.min(accumulator + delta, 4/60);
      const oldTarget = renderer.getRenderTarget();
      while (accumulator >= 1/60 - 1e-8) {
        material.uniforms.uState.value = current.texture;
        material.uniforms.uStrength.value = pending?.strength ?? 0;
        if (pending) {
          material.uniforms.uRadius.value=pending.radius/extent;
          material.uniforms.uImpulse.value.set(pending.u, pending.v);
          injectionCount++;
          pending = null;
        }
        renderer.setRenderTarget(next);
        renderer.render(scene, camera);
        [current, next] = [next, current];
        accumulator -= 1/60; stepCount++;
      }
      renderer.setRenderTarget(oldTarget);
    },
    reset,
    dispose() { current.dispose(); next.dispose(); quad.geometry.dispose(); material.dispose(); },
  };
}
