import * as THREE from 'three';
import vertex from '../shaders/ocean.vert.glsl?raw';
import fragment from '../shaders/ocean.frag.glsl?raw';
import noise from '../shaders/noise.glsl?raw';
import sky from '../shaders/sky.glsl?raw';
import rippleSample from '../shaders/ripple-sample.glsl?raw';
import {waveGLSL} from './waves.config.js';
import {narrativeGLSL} from './narrative.js';
export function createOcean(scene,palette,mobile,ripples){
  const geometry=new THREE.PlaneGeometry(400,400,mobile?256:512,mobile?256:512);
  // Mapping the plane's Y coordinate onto world Z reverses its winding.
  // Keep the geometric front face pointing upward for underside shading.
  const indices=geometry.index.array;
  for(let i=0;i<indices.length;i+=3){[indices[i+1],indices[i+2]]=[indices[i+2],indices[i+1]];}
  const material=new THREE.ShaderMaterial({
    uniforms:{...palette,uVortex:{value:0},uGather:{value:0},uFold:{value:0},uResolve:{value:0},uWaterMark:{value:0},uFormationMask:{value:null},uTime:{value:0},uFlow:{value:new THREE.Vector2()},uAmplitude:{value:1},uSteepness:{value:1},uUnderwater:{value:0},uFoamThreshold:{value:.72},
      uRipples:{value:ripples.texture},uRippleOrigin:{value:ripples.origin},
      uRippleExtent:{value:ripples.extent},uRippleTexel:{value:new THREE.Vector2(1/ripples.size,1/ripples.size)}},
    vertexShader:vertex.replace('/* WAVES */',waveGLSL).replace('/* RIPPLES */',rippleSample).replace('/* NARRATIVE */',narrativeGLSL),
    fragmentShader:fragment.replace('/* SKY */',sky).replace('/* NOISE */',noise).replace('/* RIPPLES */',rippleSample),
    side:THREE.DoubleSide,
  });
  const mesh=new THREE.Mesh(geometry,material);mesh.frustumCulled=false;scene.add(mesh);
  const patchMaterial=new THREE.ShaderMaterial({uniforms:{...material.uniforms,uWaterMark:{value:1}},vertexShader:material.vertexShader,fragmentShader:material.fragmentShader,side:THREE.DoubleSide,transparent:true,depthWrite:false});
  const patch=new THREE.Mesh(new THREE.PlaneGeometry(18,24.857142857,mobile?80:128,mobile?112:176),patchMaterial);patch.frustumCulled=false;patch.visible=false;scene.add(patch);
  return {mesh,connectLogo(uniforms){Object.assign(material.uniforms,uniforms);Object.assign(patchMaterial.uniforms,uniforms);},update(time,flow,act){material.uniforms.uTime.value=time;if(flow)material.uniforms.uFlow.value.copy(flow);material.uniforms.uRipples.value=ripples.texture;if(act){patch.visible=act.gather>.001&&act.resolve<.999;material.uniforms.uVortex.value=act.vortex||0;material.uniforms.uGather.value=act.gather||0;material.uniforms.uFold.value=act.fold||0;material.uniforms.uResolve.value=act.resolve||0;material.uniforms.uAmplitude.value=act.amplitude;material.uniforms.uSteepness.value=act.steepness??1;material.uniforms.uFoamThreshold.value=1.5-act.foam;material.uniforms.uUnderwater.value=act.underwater;}},dispose(){geometry.dispose();material.dispose();patch.geometry.dispose();patchMaterial.dispose();}};
}
