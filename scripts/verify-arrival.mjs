import puppeteer from 'puppeteer';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const folder='artifacts/change-05-gate-1';fs.mkdirSync(folder,{recursive:true});
const browser=await puppeteer.launch({headless:true,args:['--no-sandbox','--use-angle=d3d11']});
const report={errors:[]};
try{
 const page=await browser.newPage();page.setDefaultTimeout(90000);
 page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
 await page.setViewport({width:1440,height:900,deviceScaleFactor:1});
 await page.goto('http://127.0.0.1:4176/?capture',{waitUntil:'networkidle0'});await page.waitForFunction(()=>window.__oceanStudy?.ready);
 for(const p of [0,.5,.93]){await page.evaluate(p=>window.__oceanStudy.capture(12,p),p);assert.equal(await page.evaluate(()=>window.__oceanStudy.arrivalStats().count),0);await page.screenshot({path:`${folder}/before-${p}.png`});}
 await page.evaluate(()=>window.__oceanStudy.capture(12,.94));
 report.mid=await page.evaluate(()=>window.__oceanStudy.advanceArrival(12));
 assert.equal(report.mid.arrival.count,1);assert.ok(report.mid.arrival.visible);assert.ok(report.mid.ripples.injectionCount>=1);
 await page.screenshot({path:`${folder}/pulse-200ms.png`});
 report.settled=await page.evaluate(()=>window.__oceanStudy.advanceArrival(60));
 assert.ok(report.settled.arrival.settled);assert.ok(!report.settled.arrival.visible);assert.ok(report.settled.act.amplitude<.1);
 await page.evaluate(()=>window.__oceanStudy.capture(13.2,1));await page.screenshot({path:`${folder}/end.png`});
 for(const p of [.9,1,.9,1])await page.evaluate(p=>window.__oceanStudy.capture(14,p),p);
 assert.equal(await page.evaluate(()=>window.__oceanStudy.arrivalStats().count),1);
 await page.setViewport({width:390,height:844,deviceScaleFactor:1,isMobile:true,hasTouch:true});
 await page.reload({waitUntil:'networkidle0'});await page.waitForFunction(()=>window.__oceanStudy?.ready);
 await page.evaluate(()=>{window.__oceanStudy.capture(12,.94);window.__oceanStudy.advanceArrival(12);});await page.screenshot({path:`${folder}/phone-pulse.png`});
 await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
 await page.evaluate(()=>window.__oceanStudy.capture(12,1));assert.equal(await page.evaluate(()=>window.__oceanStudy.arrivalStats().visible),false);
 assert.deepEqual(report.errors,[]);
}catch(e){report.errors.push(String(e));process.exitCode=1;}
finally{fs.writeFileSync(`${folder}/report.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report));await browser.close();}
