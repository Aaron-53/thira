import * as THREE from 'three';
import logoURL from '../../logo-centered.svg?url';
import {heightAtWorld} from '../ocean/waves.config.js';
import noise from '../shaders/noise.glsl?raw';
import {smoothstep} from '../utils/lerp.js';

// Replay the SVG's original SMIL path keyframes in JS. Canvas does not reliably
// advance SMIL inside drawImage; Path2D preserves its paths and alpha mask.
function animatedPath(element) {
  const animation=element.querySelector('animate[attributeName="d"]');
  if(!animation){const path=new Path2D(element.getAttribute('d'));return ()=>path;}
  const values=animation.getAttribute('values').split(';').filter(v=>v.trim());
  const number=/-?\d*\.?\d+(?:e[-+]?\d+)?/gi;
  const parts=values[0].split(number);
  const frames=values.map(v=>v.match(number).map(Number));
  if(frames.some(f=>f.length!==frames[0].length))throw new Error('Incompatible logo path keyframes');
  const duration=parseFloat(animation.getAttribute('dur'))||2;
  return (time,motionScale=1)=>{
    const phase=((time%duration)+duration)%duration/duration*(frames.length-1);
    const i=Math.floor(phase),a=frames[i],b=frames[Math.min(i+1,frames.length-1)],mix=phase-i;
    let d=parts[0];for(let n=0;n<a.length;n++)d+=(frames[0][n]+(a[n]+(b[n]-a[n])*mix-frames[0][n])*motionScale).toFixed(3)+parts[n+1];
    return new Path2D(d);
  };
}

export function createLogo(scene,renderer,camera,palette,ripples,mobile,motion,manager){
  let size=mobile?512:1024;
  const canvas=document.createElement('canvas');canvas.width=canvas.height=size;
  const ink=document.createElement('canvas');ink.width=ink.height=size;
  const ctx=canvas.getContext('2d'),draw=ink.getContext('2d');
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const formationCanvas=document.createElement('canvas');formationCanvas.width=formationCanvas.height=512;
  const formationTexture=new THREE.CanvasTexture(formationCanvas);
  texture.generateMipmaps=true;texture.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
  const width=18,height=width*348/252;
  const uniforms={...palette,uLogo:{value:texture},uReveal:{value:0},uForming:{value:0},uTime:{value:0},uIntensity:{value:1},uBackView:{value:0},uTexel:{value:1/size}};
  const material=new THREE.ShaderMaterial({uniforms,transparent:true,depthTest:true,depthWrite:true,side:THREE.DoubleSide,
    vertexShader:`varying vec2 vUv;varying vec3 vWorld;varying vec3 vNormal;
      void main(){vUv=uv;vec4 world=modelMatrix*vec4(position,1.0);vWorld=world.xyz;vNormal=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*world;}`,
    fragmentShader:`uniform sampler2D uLogo;uniform float uReveal,uForming,uTime,uIntensity,uTexel,uBackView;uniform vec3 uEmber,uIvory,uGold;
      varying vec2 vUv;varying vec3 vWorld,vNormal;${noise}
      void main(){vec2 markUv=vec2(mix(vUv.x,1.0-vUv.x,uBackView),vUv.y);float alpha=texture2D(uLogo,markUv).a;
        float n=.5+.5*simplex(vUv*6.0+vec2(uTime*.08,0));
        alpha*=mix(1.0-smoothstep(uReveal*1.3-.25,uReveal*1.3-.05,n),uReveal,uForming);
        if(alpha<.035)discard;
        float core=min(min(texture2D(uLogo,markUv+vec2(uTexel,0)).a,texture2D(uLogo,markUv-vec2(uTexel,0)).a),min(texture2D(uLogo,markUv+vec2(0,uTexel)).a,texture2D(uLogo,markUv-vec2(0,uTexel)).a));
        float rim=pow(1.0-abs(dot(normalize(vNormal),normalize(cameraPosition-vWorld))),3.0);
        vec3 color=mix(uEmber*2.5,uIvory*2.0,smoothstep(.1,.9,core))+uGold*rim*1.5;
        gl_FragColor=vec4(color*uIntensity,alpha);
      }`});
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(width,height),material);
  mesh.renderOrder=2;
  mesh.position.set(0,height/2+.15,-30);scene.add(mesh);
  const reflectionScene=new THREE.Scene();
  const mirrored=new THREE.Mesh(mesh.geometry,material);reflectionScene.add(mirrored);
  const target=new THREE.WebGLRenderTarget(mobile?512:1024,mobile?512:1024,{type:THREE.HalfFloatType,depthBuffer:false});
  const matrix=new THREE.Matrix4();
  const waterUniforms={uFormationMask:{value:formationTexture},uLogoReflection:{value:target.texture},uLogoTexture:{value:texture},uLogoProjection:{value:matrix},uLogoPosition:{value:mesh.position},uLogoSize:{value:new THREE.Vector2(width,height)},uIntroSmear:{value:0},uLogoStrength:{value:0}};
  let paths=[],mask,lastRaster=-Infinity,lastImpulse=0,disposed=false,reflectionInterval=1,reflectionFrame=0;
  const clearColor=new THREE.Color();
  const ready=new Promise((resolve,reject)=>{
    new THREE.FileLoader(manager).load(logoURL,source=>{
      try{
        const svg=new DOMParser().parseFromString(source,'image/svg+xml');
        mask=new Path2D(svg.querySelector('mask path').getAttribute('d'));
        paths=[...svg.querySelectorAll('path')].filter(p=>!p.closest('mask')).map(p=>({sample:animatedPath(p),masked:!!p.closest('g[mask]')}));
        raster(0);formationCanvas.getContext('2d').drawImage(canvas,0,0,512,512);formationTexture.needsUpdate=true;resolve();
      }catch(error){reject(error);}
    },undefined,reject);
  });
  function raster(time,motionScale=1){
    if(disposed||!paths.length)return;
    draw.clearRect(0,0,size,size);draw.save();draw.scale(size/252,size/348);draw.translate(-610,-253);draw.fillStyle='white';
    for(const path of paths){draw.save();if(path.masked)draw.clip(mask);draw.fill(path.sample(time,motionScale));draw.restore();}
    draw.restore();ctx.clearRect(0,0,size,size);ctx.filter=`blur(${size/4096}px)`;ctx.drawImage(ink,0,0);ctx.filter='none';texture.needsUpdate=true;
  }
  return {ready,mesh,waterUniforms,
    setReflectionInterval(value){reflectionInterval=value;reflectionFrame=0;},
    setQuality(quality){
      const next=mobile||quality.scale<=.75?512:1024;
      if(next===size)return;
      texture.dispose();size=next;canvas.width=canvas.height=ink.width=ink.height=size;
      uniforms.uTexel.value=1/size;lastRaster=-Infinity;
    },
    update(time,act,reveal,deterministic=false,diagnostics={}){
      const animationTime=motion.matches||act.gather>0&&act.progress<.95?0:time;
      if(!diagnostics.logoUploadOff&&reveal>.001){
        if(!diagnostics.logoRasterOff&&(deterministic||Math.abs(animationTime-lastRaster)>=1/15)){raster(animationTime,1-.85*smoothstep(.95,1,act.progress));lastRaster=animationTime;}
      }
      mesh.position.y=height/2+4.15+heightAtWorld(0,-30,time,act)*.25;
      uniforms.uBackView.value=camera.position.z<mesh.position.z?1:0;
      uniforms.uTime.value=time;uniforms.uReveal.value=reveal;uniforms.uIntensity.value=act.exposure/1.15;
      uniforms.uForming.value=act.gather>0?1:0;
      waterUniforms.uIntroSmear.value=act.smear||0;
      waterUniforms.uLogoStrength.value=(act.opening?Math.max(reveal,act.smear*2.5):reveal)*uniforms.uIntensity.value;
      if(!motion.matches&&!deterministic&&time-lastImpulse>=4){ripples.inject(0,-30,.055);lastImpulse=time;}
      if(!deterministic&&reflectionFrame++%reflectionInterval!==0)return;
      camera.updateMatrixWorld();matrix.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);
      mirrored.position.copy(mesh.position);mirrored.position.y*=-1;mirrored.scale.y=-1;
      const prior=renderer.getRenderTarget(),color=renderer.getClearColor(clearColor),alpha=renderer.getClearAlpha();
      renderer.setClearColor(0,0);renderer.setRenderTarget(target);renderer.clear();renderer.render(reflectionScene,camera);
      renderer.setRenderTarget(prior);renderer.setClearColor(color,alpha);
    },
    dispose(){disposed=true;scene.remove(mesh);mesh.geometry.dispose();material.dispose();texture.dispose();formationTexture.dispose();target.dispose();},
  };
}
