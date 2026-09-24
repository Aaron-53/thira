import * as THREE from 'three';

// Native controls retain focus, permission gestures and screen-reader semantics.
// Their visible ink is a scene texture, so it shares the same lens and grading.
export function createSceneControls(scene,palette){
  const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  texture.generateMipmaps=false;
  const uniforms={uInk:{value:texture},uTime:{value:0},uCue:{value:0},uResolution:{value:new THREE.Vector2(innerWidth,innerHeight)},uIvory:palette.uIvory};
  const material=new THREE.ShaderMaterial({uniforms,transparent:true,depthTest:false,depthWrite:false,
    vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}',
    fragmentShader:`varying vec2 vUv;uniform sampler2D uInk;uniform vec2 uResolution;uniform vec3 uIvory;uniform float uTime,uCue;
      void main(){vec4 ink=texture2D(uInk,vUv);
        float shift=sin(uTime*2.618)*2.5;
        vec2 pixel=vUv*uResolution;
        float line=(1.0-smoothstep(.4,1.1,abs(pixel.x-uResolution.x*.5)))*step(38.0+shift,pixel.y)*step(pixel.y,62.0+shift);
        float alpha=line*uCue*(.65+.35*cos(uTime*2.618));
        gl_FragColor=vec4(mix(ink.rgb,uIvory,alpha),max(ink.a,alpha));
      }`});
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(2,2),material);mesh.frustumCulled=false;mesh.renderOrder=1000;scene.add(mesh);
  const button=document.querySelector('#tilt-control'),status=document.querySelector('#tilt-status'),cue=document.querySelector('#scroll-cue');
  let last='';
  function resize(){const dpr=Math.min(devicePixelRatio,2);canvas.width=innerWidth*dpr;canvas.height=innerHeight*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);uniforms.uResolution.value.set(innerWidth,innerHeight);last='';}
  resize();
  return {resize,
    update(time,act,state,reduced){
      uniforms.uTime.value=reduced?0:time;uniforms.uCue.value=reduced?0:state.cue*(1-THREE.MathUtils.smoothstep(act.progress,.16,.22));
      mesh.visible=(!act.opening||act.introSeconds>4.6)&&act.arrivalUI!==false;
      button.style.pointerEvents=mesh.visible?'auto':'none';button.tabIndex=mesh.visible?0:-1;
      const focus=document.activeElement;
      const key=[button.hidden,button.textContent,status.textContent,focus===button,focus===cue,innerWidth,innerHeight].join('|');
      if(key===last)return;last=key;
      ctx.clearRect(0,0,innerWidth,innerHeight);ctx.font='12px Arial';ctx.textBaseline='middle';
      if(!button.hidden){
        const r=button.getBoundingClientRect();
        ctx.fillStyle='rgba(11,14,26,.6)';ctx.strokeStyle=focus===button?'#F4E4D0':'rgba(244,228,208,.45)';ctx.lineWidth=focus===button?2:1;
        ctx.beginPath();ctx.roundRect(r.x,r.y,r.width,r.height,24);ctx.fill();ctx.stroke();
        ctx.textAlign='center';ctx.fillStyle='#F4E4D0';ctx.fillText(button.textContent,r.x+r.width/2,r.y+r.height/2);
      }
      if(status.textContent){
        ctx.textAlign='right';ctx.fillStyle='#F4E4D0';
        const words=status.textContent.split(' '),lines=[];let line='';
        for(const word of words){if(ctx.measureText(line+word).width>innerWidth-40){lines.push(line);line='';}line+=word+' ';}lines.push(line);
        lines.reverse().forEach((text,i)=>ctx.fillText(text.trim(),innerWidth-20,innerHeight-88-i*17));
      }
      if(focus===cue){const r=cue.getBoundingClientRect();ctx.strokeStyle='#F4E4D0';ctx.strokeRect(r.x,r.y,r.width,r.height);}
      texture.needsUpdate=true;
    },
    dispose(){scene.remove(mesh);mesh.geometry.dispose();material.dispose();texture.dispose();},
  };
}
