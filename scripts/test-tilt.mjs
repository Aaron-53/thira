import assert from 'node:assert/strict';
import {createTiltControl} from '../src/ui/tilt.js';
function setup({coarse=true,reduced=false,permission}={}){
  const host=new EventTarget();const button=new EventTarget();const motion=new EventTarget();
  motion.matches=reduced;button.attrs={};button.setAttribute=(k,v)=>button.attrs[k]=v;
  host.navigator={maxTouchPoints:coarse?5:0};host.isSecureContext=true;
  host.matchMedia=()=>({matches:coarse});host.document=new EventTarget();host.document.hidden=false;
  host.screen={orientation:new EventTarget()};host.screen.orientation.angle=0;
  host.DeviceOrientationEvent=class{};
  if(permission)host.DeviceOrientationEvent.requestPermission=async()=>permission;
  const status={textContent:''};const control=createTiltControl({button,status,motion,host});
  const send=(beta,gamma)=>host.dispatchEvent(Object.assign(new Event('deviceorientation'),{beta,gamma}));
  return {host,button,motion,status,control,send};
}
const desktop=setup({coarse:false});assert.equal(desktop.button.hidden,true);desktop.send(45,30);assert.equal(desktop.control.update(1).enabled,false);desktop.control.dispose();
const phone=setup();phone.send(45,0);assert.equal(phone.control.update(1).x,0);phone.send(45,25);assert.ok(phone.control.update(.1).x>0);assert.ok(phone.control.update(.1).x<1);
phone.host.screen.orientation.angle=90;phone.host.screen.orientation.dispatchEvent(new Event('change'));phone.send(45,0);phone.send(65,0);const landscape=phone.control.update(1);assert.ok(landscape.x>.5);assert.ok(Math.abs(landscape.y)<.01);
phone.button.dispatchEvent(new Event('click'));assert.equal(phone.control.update(1).enabled,false);phone.control.dispose();
const denied=setup({permission:'denied'});denied.button.dispatchEvent(new Event('click'));await new Promise(setImmediate);assert.match(denied.status.textContent,/not enabled/);assert.equal(denied.control.update(1).enabled,false);denied.control.dispose();
const granted=setup({permission:'granted'});granted.button.dispatchEvent(new Event('click'));await new Promise(setImmediate);granted.send(45,0);granted.send(45,-25);assert.ok(granted.control.update(1).x<-.9);granted.motion.matches=true;granted.motion.dispatchEvent(new Event('change'));assert.equal(granted.button.hidden,true);assert.equal(granted.control.update(1).enabled,false);granted.control.dispose();
const reduced=setup({reduced:true});reduced.send(45,0);reduced.send(45,25);assert.equal(reduced.control.update(1).x,0);assert.equal(reduced.button.hidden,true);reduced.control.dispose();
console.log('PASS: desktop unchanged, calibration, smoothing, portrait/landscape, disable, permission granted/denied, and reduced motion.');
