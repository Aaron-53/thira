import ieeeURL from '../../sb logo/logowhiteieeemec.png?url';
import wieURL from '../../sb logo/wie_logo.png?url';
import * as THREE from 'three';
import {smoothstep} from '../utils/lerp.js';
import fragment from '../shaders/presenter.frag.glsl?raw';
import rippleSample from '../shaders/ripple-sample.glsl?raw';

export function createPresenters(scene,camera,palette,ripples){
  // Fixed below the surface, on the settled camera's central viewing axis.
  const group=new THREE.Group();group.name='Underwater presenters';group.position.set(0,-1.6,-22);group.rotation.x=.6;scene.add(group);
  const marks=[];let opacity=0;
  // Trim transparent source padding once, so both marks use their actual ink bounds.
  const ready=Promise.all([[ieeeURL,'IEEE MEC Student Branch'],[wieURL,'IEEE Women in Engineering']].map(async([url,label])=>{
    const image=new Image();image.src=url;await image.decode();
    const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
    const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);
    const {data}=ctx.getImageData(0,0,canvas.width,canvas.height);let left=canvas.width,top=canvas.height,right=0,bottom=0;
    for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++)if(data[(y*canvas.width+x)*4+3]>8){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
    const cropped=document.createElement('canvas');cropped.width=right-left+1;cropped.height=bottom-top+1;
    cropped.getContext('2d').drawImage(image,left,top,cropped.width,cropped.height,0,0,cropped.width,cropped.height);
    const texture=new THREE.CanvasTexture(cropped);
    const material=new THREE.ShaderMaterial({uniforms:{...palette,uMap:{value:texture},uOpacity:{value:0},uTime:{value:0},uRipples:{value:ripples.texture},uRippleOrigin:{value:ripples.origin},uRippleExtent:{value:ripples.extent},uRippleTexel:{value:new THREE.Vector2(1/ripples.size,1/ripples.size)}},transparent:true,depthTest:true,depthWrite:true,side:THREE.DoubleSide,
      vertexShader:'varying vec2 vUv;varying vec3 vWorld;void main(){vUv=uv;vec4 p=modelMatrix*vec4(position,1.0);vWorld=p.xyz;gl_Position=projectionMatrix*viewMatrix*p;}',
      fragmentShader:fragment.replace('/* RIPPLES */',rippleSample) });
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(1,cropped.height/cropped.width),material);mesh.name=label;group.add(mesh);marks.push(mesh);return mesh;
  })).then(loaded=>{marks.splice(0,marks.length,...loaded);});
  return {ready,update(act,time){
    opacity=smoothstep(.58,.68,act.progress)*smoothstep(.5,1,act.underwater);group.visible=opacity>.001;
    // A compact, balanced pair with 1.1 mark-widths of empty space between.
    const width=Math.min(2.1,camera.aspect*2);
    marks.forEach((mesh,i)=>{mesh.position.x=(i===0?-1:1)*width*1.05;mesh.scale.setScalar(width);mesh.material.uniforms.uOpacity.value=opacity;mesh.material.uniforms.uTime.value=time;mesh.material.uniforms.uRipples.value=ripples.texture;});
  },stats(){return {opacity,count:marks.length,worldPosition:group.position.toArray(),sceneObjects:true};},
  dispose(){scene.remove(group);for(const mesh of marks){mesh.material.uniforms.uMap.value.dispose();mesh.geometry.dispose();mesh.material.dispose();}}};
}
