import * as THREE from 'three';
import sky from '../shaders/sky.glsl?raw';
import { PALETTE,STORM_PALETTE } from '../ocean/waves.config.js';
export function createEnvironment(scene){
  const uniforms={};
  for(const [name,hex] of Object.entries(PALETTE)) uniforms['u'+name[0].toUpperCase()+name.slice(1)]={value:new THREE.Color(hex)};
  const grades=Object.entries(STORM_PALETTE).map(([name,hex])=>({uniform:uniforms['u'+name[0].toUpperCase()+name.slice(1)],storm:new THREE.Color(hex),warm:new THREE.Color(PALETTE[name])}));
  uniforms.uLightDirection={value:new THREE.Vector3(-.12,.085,-1).normalize()};
  uniforms.uUnderwater={value:0};
  const material=new THREE.ShaderMaterial({
    uniforms,side:THREE.BackSide,depthWrite:false,
    vertexShader:'varying vec3 vRay;void main(){vRay=position;gl_Position=projectionMatrix*viewMatrix*vec4(position+cameraPosition,1.0);}',
    fragmentShader:`uniform float uUnderwater;varying vec3 vRay;${sky}\nvoid main(){gl_FragColor=vec4(mix(skyColor(normalize(vRay)),uAbyss,uUnderwater),1);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}`,
  });
  const dome=new THREE.Mesh(new THREE.SphereGeometry(450,32,20),material);
  dome.frustumCulled=false;scene.add(dome);
  return {uniforms,update(underwater,act){uniforms.uUnderwater.value=underwater;for(const grade of grades)grade.uniform.value.copy(grade.storm).lerp(grade.warm,act?.palette??1);},dispose(){dome.geometry.dispose();material.dispose();}};
}
