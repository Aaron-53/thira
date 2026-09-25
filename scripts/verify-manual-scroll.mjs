import puppeteer from 'puppeteer';
import assert from 'node:assert/strict';
const browser=await puppeteer.launch({headless:true,args:['--no-sandbox','--use-angle=d3d11']});
try{
 const page=await browser.newPage();page.setDefaultTimeout(60000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://localhost:8080');await page.waitForFunction(()=>window.__oceanStudy?.ready&&window.__oceanStudy.stats().intro.finished);
 await page.mouse.wheel({deltaY:180});await page.waitForFunction(()=>scrollY>0);
 await new Promise(r=>setTimeout(r,500));const y=await page.evaluate(()=>scrollY);
 await new Promise(r=>setTimeout(r,1500));assert.equal(await page.evaluate(()=>scrollY),y);
 assert.ok(await page.evaluate(()=>window.__oceanStudy.stats().progress<.5));
 await page.mouse.wheel({deltaY:-90});await page.waitForFunction(y=>scrollY<y,{},y);
 await page.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight));await page.waitForFunction(()=>window.__oceanStudy.stats().progress===1);
 assert.equal(await page.evaluate(()=>window.__oceanStudy.presenterStats().opacity),1);assert.deepEqual(errors,[]);
 console.log('PASS: scrolling stops without input, reverses normally, and reaches the ending.');
}finally{await browser.close();}
