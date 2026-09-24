import * as THREE from 'three';
import {Text} from 'troika-three-text';
import fontURL from '@fontsource/outfit/files/outfit-latin-500-normal.woff?url';
import {heightAtWorld} from '../ocean/waves.config.js';
import {smoothstep} from '../utils/lerp.js';

const PHRASE='COMING SOON   ';
const CLUSTERS=9;
export function createWaveType(scene,camera,palette,manager){
  const group=new THREE.Group();group.name='Wave typography';scene.add(group);
  const mobile=innerWidth<700;
  const step=mobile?1.85:2.65,fontSize=mobile?2.1:2.8;
  const cycle=PHRASE.length*step;
  const letters=[];
  const points=Array.from({length:81},()=>new THREE.Vector3());
  const curve=new THREE.CatmullRomCurve3(points,false,'catmullrom',.5);
  const tangent=new THREE.Vector3(),normal=new THREE.Vector3(),up=new THREE.Vector3();
  const cameraRight=new THREE.Vector3(),cameraUp=new THREE.Vector3(),submergedPoint=new THREE.Vector3();
  const basis=new THREE.Matrix4(),direction=new THREE.Vector3(),centre=new THREE.Vector3();
  const shadows=Array.from({length:CLUSTERS},()=>new THREE.Vector4(1e4,1e4,1,0));
  const waterUniforms={uTypeShadows:{value:shadows}};
  const promises=[];
  let disposed=false,extent=80,lockAdvance=null,lastStats={};
  manager.itemStart('wave-type-font');
  // Fixed pool: no text layout, mesh creation, or font fetch in the animation loop.
  for(let i=0;i<PHRASE.length*7;i++){
    const char=PHRASE[i%PHRASE.length];if(char===' ')continue;
    const uniforms={uInk:{value:new THREE.Color()},uOpacity:{value:0},uFringe:{value:0}};
    const base=new THREE.ShaderMaterial({uniforms,transparent:true,depthTest:true,depthWrite:true,side:THREE.DoubleSide,
      vertexShader:'void main(){gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader:`uniform vec3 uInk;uniform float uOpacity,uFringe;
        void main(){
          vec3 color=uInk;
          // Troika supplies the distance-field helpers; different sampling offsets
          // split warm/cool light at glyph edges while preserving the SDF contour.
          float a=troikaGlyphUvToDistance(vTroikaGlyphUV+vec2(uFringe,0.0));
          float b=troikaGlyphUvToDistance(vTroikaGlyphUV-vec2(uFringe,0.0));
          float edge=clamp((a-b)*24.0,-1.0,1.0);
          color+=vec3(max(edge,0.0),0.0,max(-edge,0.0))*.9;
          gl_FragColor=vec4(color,uOpacity);
        }`});
    const glyph=new Text();glyph.name=`wave-glyph-${i}`;glyph.text=char;glyph.font=fontURL;
    glyph.fontSize=fontSize;glyph.anchorX='center';glyph.anchorY='bottom';
    glyph.sdfGlyphSize=64;glyph.material=base;glyph.frustumCulled=false;group.add(glyph);
    letters.push({glyph,base,uniforms,index:i});
    promises.push(new Promise(resolve=>glyph.sync(resolve)));
  }
  const ready=Promise.all(promises).then(()=>manager.itemEnd('wave-type-font'));
  function sample(x,z,time,act,flow){return heightAtWorld(x+flow.x,z+flow.y,time,act);}
  return {ready,waterUniforms,resize(){},
    update(time,act,flow,reveal=1,reduced=false){
      if(disposed)return;
      group.visible=reveal>.001;
      if(!group.visible){for(const shadow of shadows)shadow.w=0;lastStats={visible:0,minBrightness:0,maxBrightness:0,underwaterOpacity:0,depthTest:true,depthWrite:true,glyphs:letters.length};return;}
      const underwater=smoothstep(.35,.85,act.underwater);
      camera.getWorldDirection(direction);
      cameraRight.setFromMatrixColumn(camera.matrixWorld,0);cameraUp.setFromMatrixColumn(camera.matrixWorld,1);
      const back=camera.position.z<-22?-1:1;
      // The surface ribbon stays at z=-22. Underwater it drifts below the
      // ceiling into view, then rejoins that same world-space line on surfacing.
      centre.copy(camera.position).addScaledVector(direction,5);
      const z=THREE.MathUtils.lerp(-22,centre.z,underwater);
      const sizeScale=(1-underwater*.86)*(1-.16*smoothstep(.95,1,act.progress));
      const distance=THREE.MathUtils.lerp(Math.max(12,Math.abs(camera.position.z-z)),5,underwater);
      const viewWidth=2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*distance*camera.aspect;
      extent=Math.min(110,Math.max(2,viewWidth*.68));
      for(let i=0;i<points.length;i++){
        const x=(i/(points.length-1)*2-1)*extent;
        const edge=Math.pow(Math.abs(x/extent),4);
        const pz=z-edge*5*back;
        const h=sample(x,pz,time,act,flow);
        const caustic=Math.sin(x*.65+pz*.8+h*2.5+time*.6);
        points[i].set(x,.65+h,pz);
        submergedPoint.copy(centre).addScaledVector(cameraRight,x).addScaledVector(cameraUp,h*.12+caustic*.06);
        points[i].lerp(submergedPoint,underwater);
      }
      curve.updateArcLengths();
      const lock=reduced?1:smoothstep(.97,1,act.progress);
      if(lock>0&&lockAdvance===null)lockAdvance=reduced?0:(time*2.7)%cycle;
      if(lock===0)lockAdvance=null;
      const advance=lockAdvance??((time*2.7)%cycle);
      const centerPhrase=3*PHRASE.length;
      let visible=0,minBrightness=Infinity,maxBrightness=0;
      for(const letter of letters){
        const {glyph,uniforms,index}=letter;
        const centered=index-centerPhrase;
        const chosen=centered>=0&&centered<11;
        const original=(centered-5)*step-advance;
        const x=THREE.MathUtils.lerp(original,(centered-5)*step,chosen?lock:0)*THREE.MathUtils.lerp(back,1,underwater)*sizeScale;
        glyph.scale.setScalar(sizeScale);
        const u=(x/extent+1)*.5;
        glyph.visible=u>0&&u<1&&reveal>.001;
        if(!glyph.visible)continue;
        curve.getPoint(u,glyph.position);curve.getTangent(u,tangent);
        tangent.multiplyScalar(THREE.MathUtils.lerp(back,1,underwater));
        normal.copy(camera.position).sub(glyph.position);
        normal.addScaledVector(tangent,-normal.dot(tangent)).normalize();
        up.crossVectors(normal,tangent).normalize();normal.crossVectors(tangent,up).normalize();
        basis.makeBasis(tangent,up,normal);glyph.quaternion.setFromRotationMatrix(basis);
        const h=sample(x,z,time,act,flow),crest=smoothstep(-.8,1.4,h);
        glyph.rotateZ(tangent.y*crest*.45);glyph.rotateX(Math.sin(x*.18+time*.35)*crest*.12);
        const edge=1-smoothstep(.7,1,Math.abs(x)/extent);
        const emergence=smoothstep((x/extent+1)*.18,(x/extent+1)*.18+.64,reveal);
        glyph.position.y-=(1-emergence)*2.5;
        const opacity=edge*emergence*(1-underwater*.75)*(chosen?1:1-lock);
        uniforms.uOpacity.value=opacity;uniforms.uFringe.value=underwater*.008;
        const brightness=THREE.MathUtils.lerp(.42,2.8,crest)*act.exposure/1.15;
        uniforms.uInk.value.copy(palette.uDeep.value).lerp(palette.uIvory.value,.7+crest*.3).lerp(palette.uGold.value,crest*.45).multiplyScalar(brightness);
        if(opacity>.05){visible++;minBrightness=Math.min(minBrightness,brightness);maxBrightness=Math.max(maxBrightness,brightness);}
      }
      for(let i=0;i<CLUSTERS;i++){
        const phraseIndex=i-4;
        const x=((phraseIndex*PHRASE.length+.3)*step-advance*(1-lock))*back;
        const h=sample(x,z,time,act,flow);
        shadows[i].set(x+palette.uLightDirection.value.x*1.8,z+1.3,cycle*.33,reveal*(1-underwater)*(phraseIndex===0?1:1-lock)*(.23+.1*smoothstep(-1,1,h)));
      }
      lastStats={visible,minBrightness,maxBrightness,underwaterOpacity:1-underwater*.75,depthTest:true,depthWrite:true,glyphs:letters.length};
    },
    stats(){return lastStats;},
    dispose(){disposed=true;scene.remove(group);for(const {glyph,base} of letters){glyph.dispose();base.dispose();}},
  };
}
