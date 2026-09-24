import * as THREE from 'three';
import {heightAtWorld} from '../ocean/waves.config.js';
import {smoothstep} from '../utils/lerp.js';
import rippleSample from '../shaders/ripple-sample.glsl?raw';

// One timed arrival per page visit; scrolling backwards cannot re-arm it.
export function createArrival(scene,ripples,motion){
  const segments=160,positions=new Float32Array((segments+1)*2*3),uvs=new Float32Array((segments+1)*2*2),indices=[];
  for(let i=0;i<=segments;i++)for(let j=0;j<2;j++){uvs[(i*2+j)*2]=i/segments;uvs[(i*2+j)*2+1]=j;if(i<segments&&j===0){const a=i*2;indices.push(a,a+2,a+1,a+1,a+2,a+3);}}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.BufferAttribute(uvs,2));geometry.setIndex(indices);
  const uniforms={uOpacity:{value:0},uRipples:{value:ripples.texture},uRippleOrigin:{value:ripples.origin},uRippleExtent:{value:ripples.extent},uRippleTexel:{value:new THREE.Vector2(1/ripples.size,1/ripples.size)}};
  const material=new THREE.ShaderMaterial({uniforms,transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,
    vertexShader:`varying vec2 vUv;${rippleSample}void main(){vUv=uv;vec3 p=position;p.y+=rippleHeight(p.xz);gl_Position=projectionMatrix*viewMatrix*vec4(p,1.0);}`,
    fragmentShader:'varying vec2 vUv;uniform float uOpacity;void main(){float edge=sin(vUv.y*3.14159265);gl_FragColor=vec4(mix(vec3(.91,.48,.12),vec3(.96,.88,.72),edge)*2.5,edge*edge*uOpacity);}' });
  const mesh=new THREE.Mesh(geometry,material);mesh.frustumCulled=false;mesh.visible=false;scene.add(mesh);
  let fired=false,age=0,count=0;
  return {
    update(act,delta,time,flow){
      if(!fired&&!motion.matches&&!act.opening&&act.resolve>=.999){fired=true;age=0;count++;ripples.inject(0,-30,.24,1.2);}
      else if(fired)age+=delta;
      const end=act.progress>=.94,active=fired&&age<1.1&&end&&!motion.matches;
      const envelope=active?smoothstep(0,.35,age)*(1-smoothstep(.35,1.1,age)):0;
      act.bloom+=envelope*.8;act.exposure+=envelope*.18;
      if(end){const settle=motion.matches?1:smoothstep(.35,1.1,age);act.amplitude=THREE.MathUtils.lerp(act.amplitude,.08,settle);act.steepness=THREE.MathUtils.lerp(act.steepness,.08,settle);act.foam=THREE.MathUtils.lerp(act.foam,1,settle);}
      mesh.visible=active&&age>0;
      if(!mesh.visible)return;
      const radius=1.5+age*35;
      uniforms.uOpacity.value=smoothstep(0,.08,age)*(1-smoothstep(.2,1.1,age))*.8;uniforms.uRipples.value=ripples.texture;
      for(let i=0;i<=segments;i++)for(let j=0;j<2;j++){
        const angle=i/segments*Math.PI*2,r=radius+(j-.5)*.65,x=Math.cos(angle)*r,z=-30+Math.sin(angle)*r,k=(i*2+j)*3;
        positions[k]=x;positions[k+1]=heightAtWorld(x+flow.x,z+flow.y,time,act)+.12;positions[k+2]=z;
      }
      geometry.attributes.position.needsUpdate=true;
    },
    get stats(){return {fired,count,age,settled:fired&&age>=1.1,visible:mesh.visible};},
    dispose(){scene.remove(mesh);geometry.dispose();material.dispose();},
  };
}
