import * as THREE from 'three';
import godrays from '../shaders/godrays.frag.glsl?raw';
import lighting from '../shaders/lighting.frag.glsl?raw';
import bloom from '../shaders/bloom.frag.glsl?raw';
import {createActGrades} from './color-grade.js';
import composite from '../shaders/composite.frag.glsl?raw';
import {WAVES} from '../ocean/waves.config.js';
import {smoothstep} from '../utils/lerp.js';
const vertex='varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0,1);}';
const heightGLSL=`float surfaceHeight(vec2 p,float time){float h=0.0;${WAVES.map(w=>`{float k=6.283185307179586/${w.wavelength.toFixed(1)};h+=${w.amplitude.toPrecision(12)}*sin(k*dot(vec2(${w.direction.join(',')}),p)-sqrt(9.81*k)*${w.speed.toPrecision(12)}*time);}`).join('')}return h*uAmplitude;}`;
export function createPostprocess(renderer,camera,palette,mobile){
  const target=new THREE.WebGLRenderTarget(1,1,{type:THREE.HalfFloatType,depthBuffer:true});
  target.depthTexture=new THREE.DepthTexture(1,1,THREE.UnsignedIntType);
  const raysTarget=new THREE.WebGLRenderTarget(1,1,{type:THREE.HalfFloatType,depthBuffer:false});
  const uniforms={...palette,uDepthTexture:{value:target.depthTexture},uInverseProjection:{value:camera.projectionMatrixInverse},uCameraWorld:{value:camera.matrixWorld},uCamera:{value:camera.position},uTime:{value:0},uAmplitude:{value:1},uUnderwater:{value:0}};
  const rayMaterial=new THREE.ShaderMaterial({uniforms,defines:{RAY_STEPS:mobile?6:10},vertexShader:vertex,fragmentShader:godrays.replace('/* HEIGHT */',heightGLSL),depthTest:false,depthWrite:false});
  const litTarget=new THREE.WebGLRenderTarget(1,1,{type:THREE.HalfFloatType,depthBuffer:false});
  const bloomTarget=new THREE.WebGLRenderTarget(1,1,{type:THREE.HalfFloatType,depthBuffer:false});
  const grades=createActGrades();
  const lightingMaterial=new THREE.ShaderMaterial({uniforms:{...uniforms,uScene:{value:target.texture},uRays:{value:raysTarget.texture}},vertexShader:vertex,fragmentShader:lighting,depthTest:false,depthWrite:false});
  const bloomMaterial=new THREE.ShaderMaterial({uniforms:{uLit:{value:litTarget.texture},uResolution:{value:new THREE.Vector2()}},vertexShader:vertex,fragmentShader:bloom,depthTest:false,depthWrite:false});
  const finalUniforms={...palette,...grades.uniforms,uLit:{value:litTarget.texture},uBloomTexture:{value:bloomTarget.texture},uReturn:{value:0},uGrain:{value:.035},uAberration:{value:1.5},uInverseProjection:{value:camera.projectionMatrixInverse},uScene:{value:target.texture},uRays:{value:raysTarget.texture},uDepthTexture:{value:target.depthTexture},uResolution:{value:new THREE.Vector2()},uTime:{value:0},uUnderwater:{value:0},uWet:{value:0},uRunoff:{value:0},uBloom:{value:1}};
  const finalMaterial=new THREE.ShaderMaterial({uniforms:finalUniforms,vertexShader:vertex,fragmentShader:composite,depthTest:false,depthWrite:false});
  const quad=new THREE.Mesh(new THREE.PlaneGeometry(2,2),rayMaterial);
  const passScene=new THREE.Scene();passScene.add(quad);
  const passCamera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
  let wet=0,previousUnder=0,rayScale=.5,bloomScale=.5;
  function resize(){const size=renderer.getDrawingBufferSize(new THREE.Vector2());target.setSize(size.x,size.y);litTarget.setSize(size.x,size.y);bloomTarget.setSize(Math.max(1,Math.round(size.x*bloomScale)),Math.max(1,Math.round(size.y*bloomScale)));bloomMaterial.uniforms.uResolution.value.copy(size);raysTarget.setSize(Math.max(1,Math.round(size.x*rayScale)),Math.max(1,Math.round(size.y*rayScale)));finalUniforms.uResolution.value.copy(size);}
  resize();
  return {
    setQuality(quality){rayScale=quality.rays;bloomScale=quality.bloom;resize();},
    render(scene,time,act,delta,deterministic=false){
      const submerged=act.underwater;
      if(Math.abs(submerged-previousUnder)>.05)wet=1;
      wet=Math.max(0,wet-delta/0.3);previousUnder=submerged;
      const breach=act.breach||0;
      uniforms.uTime.value=time;uniforms.uAmplitude.value=act.amplitude;uniforms.uUnderwater.value=submerged;
      finalUniforms.uReturn.value=0;
      finalUniforms.uTime.value=time;finalUniforms.uUnderwater.value=submerged;
      finalUniforms.uWet.value=Math.max(act.breach||0,deterministic?0:wet);
      finalUniforms.uGrain.value=act.opening?.035+.045*(1-smoothstep(0,2.2,act.introSeconds)):.035;
      finalUniforms.uRunoff.value=breach;finalUniforms.uBloom.value=act.bloom??1;
      renderer.setRenderTarget(target);renderer.render(scene,camera);
      if(submerged>.001){quad.material=rayMaterial;renderer.setRenderTarget(raysTarget);renderer.render(passScene,passCamera);}
      quad.material=lightingMaterial;renderer.setRenderTarget(litTarget);renderer.render(passScene,passCamera);
      quad.material=bloomMaterial;renderer.setRenderTarget(bloomTarget);renderer.render(passScene,passCamera);
      quad.material=finalMaterial;renderer.setRenderTarget(null);renderer.render(passScene,passCamera);
    },resize,
    dispose(){litTarget.dispose();bloomTarget.dispose();grades.dispose();lightingMaterial.dispose();bloomMaterial.dispose();target.dispose();raysTarget.dispose();quad.geometry.dispose();rayMaterial.dispose();finalMaterial.dispose();},
  };
}
