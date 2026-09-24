import assert from 'node:assert/strict';
import {createPerfMonitor} from '../src/utils/perf-monitor.js';
const changes=[],monitor=createPerfMonitor(q=>changes.push({...q}));
for(let i=0;i<180;i++)monitor.frame(1/60);
assert.equal(monitor.stats.level,0,'steady 60 FPS retains quality');
monitor.frame(.3);for(let i=0;i<180;i++)monitor.frame(1/60);
assert.equal(monitor.stats.level,0,'one spike cannot reduce quality');
for(let i=0;i<2000;i++)monitor.frame(1/20);
assert.equal(monitor.stats.level,8,'sustained overload reaches final rung');
assert.deepEqual(changes.map(q=>[q.scale,q.rays,q.bloom,q.particles,q.reflection]),[
 [.85,.5,.5,1,1],[.75,.5,.5,1,1],[.65,.5,.5,1,1],[.65,.25,.5,1,1],
 [.65,.25,.25,1,1],[.65,.25,.25,.6,1],[.65,.25,.25,.6,2],[.65,.25,.25,.6,3],
]);
for(let i=0;i<400;i++)monitor.frame(1/120);
assert.equal(monitor.stats.level,8,'short recovery cannot immediately raise quality');
for(let i=0;i<10000;i++)monitor.frame(1/120);
assert.equal(monitor.stats.level,0,'sustained recovery restores quality');
const phone=createPerfMonitor(()=>{}, {tier:'phone'});
for(let i=0;i<500;i++)phone.frame(1/30);
assert.equal(phone.stats.level,0,'stable phone 30 FPS is on budget');
phone.reset();assert.equal(phone.stats.averageMs,0);
const retry=createPerfMonitor(()=>{});
for(let i=0;i<2000;i++)retry.frame(1/20);
while(retry.stats.level===8)retry.frame(1/60);
assert.equal(retry.stats.level,7,'recovery works on a 60 Hz display');
while(retry.stats.level===7)retry.frame(1/20);
assert.equal(retry.stats.recoverySeconds,12,'a failed quality increase backs off instead of oscillating');
console.log('PASS: sustained overload, ordered ladder, spike resistance, cautious recovery, phone budget, reset');
