import assert from 'node:assert/strict';
import {WAVES,heightAtWorld,gerstnerHeight,ROUGH_WATER,SETTLED_WATER} from '../src/ocean/waves.config.js';
let maxError=0;
for(const controls of [ROUGH_WATER,SETTLED_WATER]){
 assert.ok(WAVES.reduce((sum,w)=>sum+w.steepness*controls.steepness,0)<1,'horizontal displacement stays non-folding');
 for(let x=-30;x<=30;x+=5)for(let z=-30;z<=30;z+=5){
   let wx=x,wz=z;
   for(const w of WAVES){const k=2*Math.PI/w.wavelength,phase=k*(w.direction[0]*x+w.direction[1]*z)-Math.sqrt(9.81*k)*w.speed*12;
     const offset=w.steepness*controls.steepness/k*Math.cos(phase);wx+=w.direction[0]*offset;wz+=w.direction[1]*offset;}
   const error=Math.abs(heightAtWorld(wx,wz,12,controls)-gerstnerHeight(x,z,12,controls));
   maxError=Math.max(maxError,error);assert.ok(error<.05,'CPU projection tracks the shader displacement within 5 cm');
 }
}
assert.equal(Math.abs(gerstnerHeight(4,9,12,{amplitude:0})),0);
assert.equal(heightAtWorld(4,9,12,{amplitude:1,steepness:0}),gerstnerHeight(4,9,12));
console.log(JSON.stringify({pass:true,maxHeightError:maxError}));
