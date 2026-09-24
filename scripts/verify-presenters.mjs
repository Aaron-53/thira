import puppeteer from 'puppeteer';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const folder='artifacts/change-05-final';fs.mkdirSync(folder,{recursive:true});
const browser=await puppeteer.launch({headless:true,args:['--no-sandbox','--use-angle=d3d11']});
const report={errors:[],layouts:[]};
try{
 const page=await browser.newPage();page.setDefaultTimeout(90000);page.on('pageerror',e=>report.errors.push(e.message));
 for(const [name,width,height] of [['desktop',1440,900],['phone',390,844],['small-phone',320,667]]){
  await page.setViewport({width,height,deviceScaleFactor:1,isMobile:width<600,hasTouch:width<600});
  await page.goto('http://127.0.0.1:4176/?capture',{waitUntil:'networkidle0'});await page.waitForFunction(()=>window.__oceanStudy?.ready);
  const opening=await page.evaluate(()=>window.__oceanStudy.capture(12,0));await page.screenshot({path:`${folder}/${name}-opening.png`});
  for(const p of [0,.5,.98]){await page.evaluate(p=>window.__oceanStudy.capture(12,p),p);assert.equal(await page.$eval('#presenters',e=>e.classList.contains('visible')),false);}
  await page.evaluate(()=>window.__oceanStudy.capture(12,1));
  await page.evaluate(()=>window.__oceanStudy.advanceArrival(12));await page.screenshot({path:`${folder}/${name}-pulse.png`});
  assert.equal(await page.$eval('#presenters',e=>e.classList.contains('visible')),false);
  const settled=await page.evaluate(()=>window.__oceanStudy.advanceArrival(100));
  await page.waitForFunction(()=>Number(getComputedStyle(document.querySelector('#presenters')).opacity)>.84);
  const ending=await page.evaluate(()=>window.__oceanStudy.capture(14,1));
  const marks=await page.$$eval('#presenters img',images=>images.map(i=>({width:i.naturalWidth,height:i.naturalHeight,x:i.getBoundingClientRect().x,right:i.getBoundingClientRect().right,y:i.getBoundingClientRect().y})));
  assert.equal(marks.length,2);assert.ok(marks[0].right<marks[1].x);assert.ok(marks.every(m=>m.width>0&&m.height>0&&m.y>=24));
  assert.ok(ending.camera[2]<opening.camera[2]);assert.ok(ending.camera[1]<opening.camera[1]);assert.ok(settled.act.amplitude<opening.act.amplitude);
  await page.screenshot({path:`${folder}/${name}-ending.png`});
  if(name==='desktop'){
   await page.addStyleTag({content:'#presenters img{filter:none!important}'});await page.screenshot({path:`${folder}/desktop-original-color.png`});
  }
  await page.evaluate(()=>window.__oceanStudy.capture(14,.9));await page.waitForFunction(()=>Number(getComputedStyle(document.querySelector('#presenters')).opacity)<.01);
  await page.screenshot({path:`${folder}/${name}-back.png`});
  report.layouts.push({name,opening:opening.camera,ending:ending.camera,marks,amplitude:settled.act.amplitude});
 }
 assert.deepEqual(report.errors,[]);
 const comparison=await browser.newPage();await comparison.setViewport({width:1440,height:480,deviceScaleFactor:1});
 const data=name=>'data:image/png;base64,'+fs.readFileSync(`${folder}/desktop-${name}.png`).toString('base64');
 await comparison.setContent(`<body style="margin:0;background:#111;color:#eee;font:16px Arial;display:flex"><div style="width:50%">Opening · p=0<img style="width:100%" src="${data('opening')}"></div><div style="width:50%">Arrival · p=1<img style="width:100%" src="${data('ending')}"></div></body>`);
 await comparison.screenshot({path:`${folder}/comparison.png`});
}catch(e){report.errors.push(String(e));process.exitCode=1;}
finally{fs.writeFileSync(`${folder}/report.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report));await browser.close();}
