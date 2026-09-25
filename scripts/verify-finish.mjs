import puppeteer from 'puppeteer';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const folder='artifacts/finish-gate-1';fs.mkdirSync(folder,{recursive:true});
const browser=await puppeteer.launch({headless:true,args:['--no-sandbox','--use-angle=d3d11']});
const report={errors:[],samples:[]};
try{
 const page=await browser.newPage();page.setDefaultTimeout(90000);
 page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
 await page.setViewport({width:1440,height:900});await page.goto('http://localhost:8080/?capture');await page.waitForFunction(()=>window.__oceanStudy?.ready);
 for(let i=0;i<=45;i++){
  const act=await page.evaluate(p=>window.__oceanStudy.capture(12,p).act,i/100);report.samples.push(act);
  assert.equal(act.palette,1);assert.equal(act.vortex,0);
  if(i>0){assert.ok(act.amplitude<report.samples[i-1].amplitude);assert.ok(act.foam>report.samples[i-1].foam);}
 }
 for(const p of [0,.05,.15,.25,.4,.45,.52,.7,.85,1]){await page.evaluate(p=>window.__oceanStudy.capture(12,p),p);await page.screenshot({path:`${folder}/${p}.png`});}
 await page.setViewport({width:390,height:844,isMobile:true,hasTouch:true});await page.reload();await page.waitForFunction(()=>window.__oceanStudy?.ready);
 for(const p of [.05,.4,.58,.63,.7,.85,1,.7,.58]){
  const act=await page.evaluate(p=>window.__oceanStudy.capture(12,p).act,p);
  const marks=await page.evaluate(()=>window.__oceanStudy.presenterStats());
  if(p<=.58)assert.equal(marks.opacity,0);
  if(p===.7)assert.equal(marks.opacity,1);
  if(p===1){assert.equal(marks.opacity,1);assert.equal(marks.count,2);assert.equal(act.reveal,0);assert.equal(act.resolve,0);assert.equal(act.underwater,1);}
  await page.screenshot({path:`${folder}/phone-${p}.png`});
 }
 assert.deepEqual(report.errors,[]);
}catch(e){report.errors.push(String(e));process.exitCode=1;}
finally{fs.writeFileSync(`${folder}/report.json`,JSON.stringify(report,null,2));console.log(JSON.stringify({errors:report.errors,samples:report.samples.length}));await browser.close();}
