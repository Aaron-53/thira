// Loading is a dependency of the camera timeline, not a separate visual scene.
export function createLoader(journey,manager){
  let resolveReady;
  const ready=new Promise(resolve=>{resolveReady=resolve;});
  manager.onLoad=()=>{journey.assetsLoaded();resolveReady();};
  const cue=document.querySelector('#scroll-cue');
  const state={reveal:0,typeReveal:0,cue:0};
  return {ready,state,finish:()=>journey.finishIntro(),resize(){},
    update(act){state.reveal=act.reveal;state.typeReveal=act.typeReveal;state.cue=act.cue;
      const available=act.cue>.1&&act.progress<.22;
      cue.style.pointerEvents=available?'auto':'none';cue.tabIndex=available?0:-1;
    },dispose(){manager.onLoad=()=>{};},
  };
}
