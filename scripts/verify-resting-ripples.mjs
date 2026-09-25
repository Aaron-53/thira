import puppeteer from 'puppeteer';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const dir='artifacts/resting-ripples';fs.mkdirSync(dir,{recursive:true});
const browser=await puppeteer.launch({headless:true,args:['--no-sandbox','--use-angle=d3d11']});
try{
 const page=await browser.newPage();page.setDefaultTimeout(60000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewport({width:1440,height:900});await page.goto('http://localhost:8080/?capture');await page.waitForFunction(()=>window.__oceanStudy?.ready);
 const before=await page.evaluate(()=>window.__oceanStudy.capture(12,1));await page.screenshot({path:`${dir}/before.png`});
 for(let x=420;x<600;x+=18){await page.mouse.move(x,660);await page.evaluate(()=>window.__oceanStudy.advanceRipples(3));}
 const after=await page.evaluate(()=>window.__oceanStudy.stats());assert.ok(after.injectionCount>2);assert.deepEqual(after.camera,before.camera);assert.equal(after.progress,1);
 await page.screenshot({path:`${dir}/drag.png`});await page.screenshot({path:`${dir}/edge.png`,clip:{x:350,y:560,width:300,height:230}});
 assert.deepEqual(errors,[]);fs.writeFileSync(`${dir}/report.json`,JSON.stringify({after,errors},null,2));console.log(JSON.stringify({pass:true,injections:after.injectionCount,cameraUnchanged:true}));
}finally{await browser.close();}
