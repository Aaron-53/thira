import puppeteer from 'puppeteer';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const folder='artifacts/restored-intro';fs.mkdirSync(folder,{recursive:true});
const browser=await puppeteer.launch({headless:true,args:['--no-sandbox','--use-angle=d3d11']});
const report={errors:[],frames:[]};
try{
 const page=await browser.newPage();page.setDefaultTimeout(90000);
 page.on('pageerror',e=>report.errors.push(e.message));
 await page.setViewport({width:1440,height:900,deviceScaleFactor:1});
 await page.goto('http://127.0.0.1:4176/?capture',{waitUntil:'networkidle0'});
 await page.waitForFunction(()=>window.__oceanStudy?.ready);
 for(const seconds of [0,2.2,3.3,3.6,4.2,4.9]){
   const frame=await page.evaluate(s=>window.__oceanStudy.introCapture(s),seconds);
   report.frames.push(frame);await page.screenshot({path:`${folder}/${seconds}.png`});
 }
 assert.ok(report.frames[0].camera[1]<-13);
 assert.ok(report.frames[1].camera[1]<-9);
 assert.ok(report.frames[3].camera[1]>0);
 assert.equal(report.frames[5].act.reveal,1);
 const endpoint=await page.evaluate(()=>window.__oceanStudy.capture(16.9,0));
 assert.ok(Math.hypot(...endpoint.camera.map((v,i)=>v-report.frames[5].camera[i]))<.001);
 await page.goto('http://127.0.0.1:4176/',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.__oceanStudy?.ready&&window.__oceanStudy.stats().intro.finished);
 report.live=await page.evaluate(()=>window.__oceanStudy.stats());
 assert.equal(report.live.progress,0);assert.equal(report.live.loader.reveal,1);
 assert.deepEqual(report.errors,[]);
}catch(e){report.errors.push(String(e));process.exitCode=1;}
finally{fs.writeFileSync(`${folder}/report.json`,JSON.stringify(report,null,2));console.log(JSON.stringify({errors:report.errors,frames:report.frames.length}));await browser.close();}
