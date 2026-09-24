import * as THREE from 'three';
import {createEnvironment} from './scene/environment.js';
import {createOcean} from './ocean/ocean.js';
import {createRipples} from './ocean/ripples.js';
import {heightAtWorld} from './ocean/waves.config.js';
import {createTiltControl} from './ui/tilt.js';
import {createCameraJourney} from './scene/camera-path.js';
import {createPostprocess} from './scene/postprocess.js';
import {createParticles} from './scene/particles.js';
import {createPerfMonitor} from './utils/perf-monitor.js';
import {smoothstep} from './utils/lerp.js';
import './style.css';
import {createLogo} from './scene/logo.js';
import {createSceneControls} from './ui/scene-controls.js';
import {createLoader} from './ui/loader.js';
import {createArrival} from './scene/arrival.js';
import {createPresenters} from './ui/presenters.js';
import {createWaveType} from './ui/wave-type.js';

// The logo and ocean share scene depth and the HDR post-processing pipeline.
const canvas=document.querySelector('#ocean');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.setSize(innerWidth,innerHeight);
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.15;
renderer.outputColorSpace=THREE.SRGBColorSpace;
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(55,innerWidth/innerHeight,.1,700);
camera.position.set(0,3,24);camera.lookAt(0,1,-90);
const environment=createEnvironment(scene);
const ripples=createRipples(renderer,innerWidth<700);
const ocean=createOcean(scene,environment.uniforms,innerWidth<700,ripples);
const motion=matchMedia('(prefers-reduced-motion: reduce)');
const arrival=createArrival(scene,ripples,motion);
const presenters=createPresenters(motion);
addEventListener('pagehide',event=>{if(!event.persisted)presenters.dispose();});
addEventListener('pagehide',event=>{if(!event.persisted)arrival.dispose();});
const journey=createCameraJourney(camera,renderer,motion);
const post=createPostprocess(renderer,camera,environment.uniforms,innerWidth<700);
const particles=createParticles(scene,environment.uniforms,innerWidth<700);
const perf=createPerfMonitor(quality=>{
  renderer.setPixelRatio(Math.min(devicePixelRatio,2)*quality.scale);renderer.setSize(innerWidth,innerHeight);
  post.setQuality(quality);particles.setQuality(quality.particles);logo.setReflectionInterval(quality.reflection);logo.setQuality(quality);
},{tier:matchMedia('(pointer: coarse)').matches&&innerWidth<900?'phone':'mid',debug:import.meta.env.DEV});
const tilt=createTiltControl({button:document.querySelector('#tilt-control'),status:document.querySelector('#tilt-status'),motion});
const loadingManager=new THREE.LoadingManager();
const loader=createLoader(journey,loadingManager);
const logo=createLogo(scene,renderer,camera,environment.uniforms,ripples,innerWidth<700,motion,loadingManager);
ocean.connectLogo(logo.waterUniforms);
const waveType=createWaveType(scene,camera,environment.uniforms,loadingManager);
ocean.connectLogo(waveType.waterUniforms);
const sceneControls=createSceneControls(scene,environment.uniforms);
const flow=new THREE.Vector2();
let paused=motion.matches,time=12,previous=performance.now(),raf;
let manual=new URLSearchParams(location.search).has('capture');
let act={progress:0,amplitude:1,underwater:0};
function updateTilt(dt){const input=tilt.update(dt);flow.x-=input.x*dt*4;flow.y+=input.y*dt*4;}
function render(delta=0,diagnostics){
  act=journey.apply(time);
  loader.update(act);
  ripples.recenter(camera.position.x,act.progress>=.9?Math.min(camera.position.z,10):camera.position.z);
  arrival.update(act,delta,time,flow);
  presenters.update(act,arrival.stats,delta);
  renderer.toneMappingExposure=act.exposure;
  // Smooth the actual surface crossing over the requested ~300ms.
  const surface=heightAtWorld(camera.position.x+flow.x,camera.position.z+flow.y,time,act);
  const wetness=1-smoothstep(-.3,.3,camera.position.y-surface);
  act.underwater=paused?0:wetness;
  environment.update(act.underwater,act);ocean.update(time,flow,act);particles.update(time,act.underwater,act);
  logo.update(time,act,loader.state.reveal,manual,diagnostics);
  waveType.update(time,act,flow,loader.state.typeReveal,paused);
  sceneControls.update(time,act,loader.state,paused);
  post.render(scene,time,act,delta,manual);
}
function frame(now){if(paused!==motion.matches){paused=motion.matches;if(paused)ripples.reset();}previous=previous||now;const raw=(now-previous)/1000;const dt=Math.min(raw,.05);previous=now;if(!paused&&!manual){journey.tick(now);time+=dt;updateTilt(dt);ripples.update(dt);perf.frame(raw);}render(dt);if(!paused&&!manual)raf=requestAnimationFrame(frame);}
function resume(){cancelAnimationFrame(raf);journey.resetClock();previous=performance.now();if(!document.hidden)frame(previous);}
motion.addEventListener('change',()=>{paused=motion.matches;perf.reset();if(paused)ripples.reset();resume();});
document.addEventListener('visibilitychange',()=>{perf.reset();document.hidden?cancelAnimationFrame(raf):resume();});
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);post.resize();journey.resize();loader.resize();sceneControls.resize();waveType.resize();render();});
addEventListener('pagehide',event=>{cancelAnimationFrame(raf);if(event.persisted)return;loader.dispose();sceneControls.dispose();logo.dispose();waveType.dispose();journey.dispose();post.dispose();particles.dispose();tilt.dispose();ripples.dispose();ocean.dispose();environment.dispose();renderer.dispose();});
addEventListener('pageshow',event=>{if(event.persisted)resume();});

const raycaster=new THREE.Raycaster();
const hit=new THREE.Vector3();
let lastMove=0;
let lastHit=null;
function projectPointer(event){
  camera.updateMatrixWorld();
  raycaster.setFromCamera(new THREE.Vector2(event.clientX/innerWidth*2-1,1-event.clientY/innerHeight*2),camera);
  const ray=raycaster.ray;
  if(ray.direction.y>=0)return null;
  let prior=.1;
  for(let t=.6;t<130;t+=.5){
    ray.at(t,hit);
    if(hit.y<=heightAtWorld(hit.x+flow.x,hit.z+flow.y,time,act)){
      let low=prior,high=t;
      for(let i=0;i<9;i++){
        const middle=(low+high)*.5;ray.at(middle,hit);
        if(hit.y>heightAtWorld(hit.x+flow.x,hit.z+flow.y,time,act))low=middle;else high=middle;
      }
      ray.at((low+high)*.5,hit);
      return hit;
    }
    prior=t;
  }
  return null;
}
function interact(event){
  if(paused||document.hidden||act.underwater>.5)return;
  const isTap=event.type==='pointerdown';
  if(!isTap&&event.timeStamp-lastMove<32)return;
  const point=projectPointer(event);
  if(!point)return;
  if(!isTap&&lastHit&&lastHit.distanceToSquared(point)<.12)return;
  if(ripples.inject(point.x,point.z,isTap?.22:.085)){
    lastHit=point.clone();lastMove=event.timeStamp;
  }
}
canvas.addEventListener('pointermove',interact,{passive:true});
canvas.addEventListener('pointerdown',interact,{passive:true});
canvas.addEventListener('pointerleave',()=>{lastHit=null;});
// Deterministic captures, without depending on timing or driver speed.
window.__oceanStudy={
  capture(t=12,p=0){manual=true;cancelAnimationFrame(raf);time=t;ripples.reset();journey.capture(p);render();return {segments:innerWidth<700?256:512,time,act,camera:camera.position.toArray()};},
  introCapture(seconds){manual=true;cancelAnimationFrame(raf);time=12+seconds;ripples.reset();journey.captureIntro(seconds);render();return {time,act,camera:camera.position.toArray()};},
  advanceRipples(steps=1){for(let i=0;i<steps;i++)ripples.update(1/60);render();return ripples.stats;},
  advanceArrival(steps=1){for(let i=0;i<steps;i++){time+=1/60;ripples.update(1/60);render(1/60);}return {arrival:arrival.stats,act,ripples:ripples.stats};},
  arrivalStats(){return arrival.stats;},
  advanceTilt(steps=60){for(let i=0;i<steps;i++)if(!paused)updateTilt(1/60);render();return flow.toArray();},
  stats(){return {quality:perf.stats,type:waveType.stats(),...ripples.stats,paused,lastHit:lastHit?.toArray()??null,progress:act.progress,underwater:act.underwater,scale:perf.scale,camera:camera.position.toArray(),intro:journey.stats(),loader:{reveal:loader.state.reveal,cue:loader.state.cue}};},ready:false,
};
Promise.all([loader.ready,logo.ready,waveType.ready,presenters.ready]).then(()=>{window.__oceanStudy.ready=true;render();});
document.querySelector('#scroll-cue').addEventListener('click',()=>journey.scrollToEnd(1));
resume();
// Opt-in diagnostic harness; no instrumentation runs in the normal experience.
if(new URLSearchParams(location.search).has('profile')){
  import('./utils/profile.js').then(({installProfiler})=>installProfiler({renderer,scene,ocean,logo,
    frame(p,t,options){manual=true;cancelAnimationFrame(raf);journey.capture(p);time=t;
      if(options.oceanOnly){act=journey.apply(time);environment.update(act.underwater,act);ocean.update(time,flow,act);renderer.setRenderTarget(null);renderer.render(scene,camera);return;}
      manual=false;if(!options.ripplesOff)ripples.update(1/60);render(1/60,options);manual=true;},
  }));
}
