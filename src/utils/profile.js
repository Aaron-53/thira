import Stats from 'three/addons/libs/stats.module.js';

// Diagnostics only: draw suppression retains cached textures to isolate pass cost.
// This is not a quality mode and never runs without ?profile&capture.
export function installProfiler({renderer,scene,ocean,frame}){
  const stats=new Stats();stats.showPanel(1);document.body.appendChild(stats.dom);
  const gl=renderer.getContext(),timer=gl.getExtension('EXT_disjoint_timer_query_webgl2');
  const debug=gl.getExtension('WEBGL_debug_renderer_info');
  const originalRender=renderer.render.bind(renderer);
  let options={};
  renderer.render=(drawScene,camera)=>{
    const u=drawScene.children[0]?.material?.uniforms||{};
    const reflection=drawScene!==scene&&!!u.uLogo;
    const rays=!!u.uDepthTexture&&!u.uScene&&!u.uLit;
    const bloom=!!u.uLit&&!u.uBloomTexture;
    const composite=!!u.uBloomTexture;
    if(options.reflectionOff&&reflection||options.raysOff&&rays||options.bloomOff&&bloom||options.compositeOff&&composite)return;
    originalRender(drawScene,camera);
  };
  const average=values=>values.length?values.reduce((a,b)=>a+b,0)/values.length:null;
  const percentile=(values,p)=>values.length?[...values].sort((a,b)=>a-b)[Math.floor((values.length-1)*p)]:null;
  const nextFrame=()=>new Promise(requestAnimationFrame);
  window.__oceanProfile={
    device:{renderer:debug?gl.getParameter(debug.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),vendor:debug?gl.getParameter(debug.UNMASKED_VENDOR_WEBGL):null,gpuTimer:!!timer,hardwareConcurrency:navigator.hardwareConcurrency,dpr:devicePixelRatio,width:innerWidth,height:innerHeight},
    async run({p=.15,t=12,variant='baseline',samples=90,warmup=20}){
      options=variant==='baseline'?{}:{[variant]:true};
      const hidden=[];
      if(options.particlesOff)for(const child of scene.children)if(child.isPoints){hidden.push([child,child.visible]);child.visible=false;}
      if(options.oceanOnly)for(const child of scene.children)if(child!==ocean.mesh){hidden.push([child,child.visible]);child.visible=false;}
      const cpu=[],intervals=[],calls=[],gpu=[],pending=[];let last;
      renderer.info.autoReset=false;
      function collect(){
        const disjoint=timer&&gl.getParameter(timer.GPU_DISJOINT_EXT);
        for(let i=pending.length-1;i>=0;i--){const q=pending[i];
          if(disjoint||gl.getQueryParameter(q,gl.QUERY_RESULT_AVAILABLE)){
            if(!disjoint)gpu.push(gl.getQueryParameter(q,gl.QUERY_RESULT)/1e6);
            gl.deleteQuery(q);pending.splice(i,1);
          }
        }
      }
      try{
        for(let i=-warmup;i<samples;i++){
          const now=await nextFrame();collect();stats.begin();renderer.info.reset();
          const q=i>=0&&timer?gl.createQuery():null;if(q)gl.beginQuery(timer.TIME_ELAPSED_EXT,q);
          const start=performance.now();
          frame(p,t+(i+warmup)/60,options);
          const elapsed=performance.now()-start;
          if(q){gl.endQuery(timer.TIME_ELAPSED_EXT);pending.push(q);}
          if(i>=0){cpu.push(elapsed);calls.push(renderer.info.render.calls);if(last!==undefined)intervals.push(now-last);}
          last=now;stats.end();
        }
        for(let i=0;pending.length&&i<120;i++){await nextFrame();collect();}
        return {variant,p,t,samples,cpuMs:average(cpu),cpuP95:percentile(cpu,.95),gpuMs:average(gpu),gpuSamples:gpu.length,frameMs:average(intervals),frameP95:percentile(intervals,.95),drawCalls:average(calls)};
      }finally{
        for(const q of pending)gl.deleteQuery(q);
        for(const [child,visible]of hidden)child.visible=visible;
        renderer.info.autoReset=true;options={};
      }
    },
  };
}
