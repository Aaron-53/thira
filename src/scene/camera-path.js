import * as THREE from 'three';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';

import {smoothstep,perlin1} from '../utils/lerp.js';
gsap.registerPlugin(ScrollTrigger);
export const INTRO_SECONDS=4.9;
// Reserve three times the original scroll distance for the spiral/descent.
// Keep scene progress unchanged so lighting, logos and water stay synchronized.
function sceneProgress(scrollProgress){
  const distance=THREE.MathUtils.clamp(scrollProgress,0,1)*1.3;
  if(distance<=.45)return distance;
  if(distance<=.9)return .45+(distance-.45)/3;
  return Math.min(1,distance-.3);
}
// One continuous warm-ocean journey: approach, spiral, drift, formation, reveal.
const stops=[0,.30,.45,.49,.52,.56,.60,.70,.78,.84,.88,.90,.95,1];
const positions=[[0,4,24],[0,4,14],[0,26,8],[14,25,-4],[10,22,-18],[-5,0,-14],[0,-6,-10],[0,-6.8,-12],[0,-7,-13],[0,-7.1,-13.5],[0,-7.15,-13.8],[0,-7.18,-13.9],[0,-7.2,-14],[0,-7.2,-14]];
const targets=[[0,4,-45],[0,3,-30],[0,-2,-10],[0,-3,-10],[0,-5,-10],[0,-7,-10],[0,0,-28],[0,2,-30],[0,3,-30],[0,3.5,-30],[0,3.8,-30],[0,3.9,-30],[0,4,-30],[0,4,-30]];
export function createCameraJourney(camera,renderer,motion){
  const curve=new THREE.CatmullRomCurve3(positions.map(p=>new THREE.Vector3(...p)),false,'catmullrom',.35);
  const lookCurve=new THREE.CatmullRomCurve3(targets.map(p=>new THREE.Vector3(...p)),false,'catmullrom',.35);
  const state={progress:0,amplitude:1,steepness:.7,foam:.85,palette:1,exposure:1.05,fov:55,vortex:0,gather:0,fold:0,resolve:0,typeReveal:0,bloom:.7};
  const master=gsap.timeline({paused:true,defaults:{ease:'none'}})
    .to(state,{progress:1,duration:1},0)
    .to(state,{amplitude:.55,steepness:.45,foam:.95,palette:1,duration:.45},0)
    .to(state,{vortex:1,amplitude:.65,steepness:.7,exposure:.9,fov:68,duration:.07,ease:'sine.inOut'},.45)
    .to(state,{vortex:0,amplitude:.2,steepness:.3,foam:.98,exposure:.8,fov:55,duration:.08,ease:'sine.inOut'},.52)
    .to(state,{amplitude:.08,steepness:.08,foam:1,exposure:.85,bloom:.55,duration:.4,ease:'sine.inOut'},.60);
  const point=new THREE.Vector3(),look=new THREE.Vector3();
  const intro={y:-14,lookY:20,lookZ:0,exposure:.035,reveal:0,cue:0};
  const entrance=gsap.timeline({paused:true,defaults:{ease:'none'}})
    .to(intro,{y:-10,exposure:.32,duration:1.2,ease:'power2.in'},1)
    .to(intro,{y:-1.1,exposure:.9,duration:1.2,ease:'power2.in'},2.2)
    .to(intro,{y:4,lookY:4,lookZ:-45,exposure:1.85,duration:.28,ease:'power2.out'},3.4)
    .to(intro,{exposure:1.05,duration:.22,ease:'power2.out'},3.68)
    .to(intro,{reveal:1,duration:.7},3.9)
    .to(intro,{cue:1,duration:.3},4.6);
  let previewIntro=false;
  let trigger,manual=false,assetsReady=false,introTime=0,previous=null;
  let finished=motion.matches||scrollY>4;
  function finishIntro(){finished=true;introTime=INTRO_SECONDS;master.progress(motion.matches?1:sceneProgress(trigger?.progress||0));}
  function configure(){
    trigger?.kill();trigger=null;
    document.documentElement.classList.toggle('reduced-motion',motion.matches);
    if(motion.matches){finishIntro();window.scrollTo(0,0);return;}

    trigger=ScrollTrigger.create({trigger:'#journey',start:'top top',end:'bottom bottom',onUpdate:self=>{if(!manual&&finished)master.progress(sceneProgress(self.progress));}});
    if(finished)finishIntro();ScrollTrigger.refresh();
  }
  configure();motion.addEventListener('change',configure);

  function interrupt(event){
    if(manual||motion.matches||finished)return;
    if(event.type==='keydown'&&!['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(event.key))return;
    if(event.type==='wheel'&&event.deltaY<=0)return;
    if(event.type==='scroll'&&scrollY<=0)return;
    finishIntro();
  }
  for(const name of ['wheel','touchmove','keydown','scroll'])addEventListener(name,interrupt,{passive:true});
  return {state,finishIntro,
    assetsLoaded(){assetsReady=true;},
    tick(now){
      
      const dt=previous===null?0:Math.min(.1,Math.max(0,(now-previous)/1000));previous=now;
      // The timed underwater entrance hands off to scroll progress zero.
      if(!manual&&!finished){introTime=Math.min(assetsReady?INTRO_SECONDS:2.2,introTime+dt);if(introTime>=INTRO_SECONDS)finished=true;}
    },
    resetClock(){previous=null;},
    apply(time){
      const p=motion.matches?1:state.progress,opening=!motion.matches&&(previewIntro||!manual&&!finished);
      const fov=motion.matches?55:state.fov;
      if(camera.fov!==fov){camera.fov=fov;camera.updateProjectionMatrix();}
      let i=0;while(i<stops.length-2&&p>stops[i+1])i++;
      const t=(i+(p-stops[i])/(stops[i+1]-stops[i]))/(stops.length-1);
      curve.getPoint(t,point);lookCurve.getPoint(t,look);camera.position.copy(point);
      const deep=smoothstep(.48,.65,p);
      const sway=motion.matches?0:(1-Math.min(p/.45,1))*.08*(opening?smoothstep(3.9,4.9,introTime):1);
      camera.position.x+=perlin1(time*.36)*sway;camera.position.y+=perlin1(time*.31+3)*sway*.5;
      camera.up.set(0,1,0);camera.lookAt(look);camera.rotateZ(smoothstep(.45,.54,p)*(1-smoothstep(.54,.61,p))*.5+perlin1(time*.25+8)*sway*.035);
      if(opening){
        entrance.time(introTime);
        camera.position.y+=intro.y-4;
        camera.up.set(0,1,0);camera.lookAt(0,intro.lookY,intro.lookZ);
        camera.rotateZ(perlin1(time*.25+8)*sway*.035);
      }
      const emergence=opening?intro.reveal:1;
      const exposure=opening?intro.exposure:state.exposure;
      camera.updateMatrixWorld();renderer.toneMappingExposure=exposure;
      const welcome=1-smoothstep(.25,.40,p);
      return {amplitude:state.amplitude,steepness:state.steepness,foam:state.foam,palette:state.palette,vortex:state.vortex,gather:state.gather,fold:state.fold,resolve:state.resolve,bloom:state.bloom,progress:p,exposure,underwater:deep,opening,introSeconds:introTime,
        reveal:Math.max(welcome,state.resolve)*emergence,typeReveal:Math.max(welcome,state.typeReveal)*emergence,cue:opening?intro.cue:1,
        smear:opening?smoothstep(2.2,2.8,introTime)*(1-smoothstep(3.4,3.9,introTime)):deep*.85,
        breach:opening?smoothstep(3.35,3.55,introTime)*(1-smoothstep(3.55,4.2,introTime)):0,
        rising:opening?smoothstep(1,3.4,introTime)*(1-smoothstep(3.4,3.9,introTime)):0};
    },
    capture(p){manual=true;previewIntro=false;master.progress(motion.matches?1:THREE.MathUtils.clamp(p,0,1));},
    captureIntro(seconds){manual=true;previewIntro=true;introTime=THREE.MathUtils.clamp(seconds,0,INTRO_SECONDS);master.progress(0);},
    release(){manual=false;previewIntro=false;previous=null;ScrollTrigger.update();},
    stats(){return {seconds:introTime,finished,assetsReady,holding:!assetsReady&&introTime>=2.2};},
    resize(){ScrollTrigger.refresh();},
    dispose(){trigger?.kill();master.kill();entrance.kill();motion.removeEventListener('change',configure);for(const name of ['wheel','touchmove','keydown','scroll'])removeEventListener(name,interrupt);},
  };
}
