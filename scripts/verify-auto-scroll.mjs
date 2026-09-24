import puppeteer from 'puppeteer';
import assert from 'node:assert/strict';
const browser=await puppeteer.launch({headless:true,args:['--no-sandbox','--use-angle=d3d11']});
try{
 const page=await browser.newPage();page.setDefaultTimeout(30000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://localhost:8080');await page.waitForFunction(()=>window.__oceanStudy?.ready&&window.__oceanStudy.stats().intro.finished);
 await page.mouse.wheel({deltaY:100});
 await page.waitForFunction(()=>window.__oceanStudy.stats().progress===1);
 assert.ok(await page.evaluate(()=>Math.abs(scrollY-(document.documentElement.scrollHeight-innerHeight))<2));
 await page.waitForFunction(()=>document.querySelector('#presenters').classList.contains('visible'));
 await page.mouse.wheel({deltaY:-100});await page.waitForFunction(()=>window.__oceanStudy.stats().progress===0);
 assert.equal(await page.evaluate(()=>scrollY),0);
 await page.mouse.wheel({deltaY:100});await page.waitForFunction(()=>window.__oceanStudy.stats().progress>.15);
 await page.mouse.wheel({deltaY:-100});await page.waitForFunction(()=>window.__oceanStudy.stats().progress===0);
 assert.deepEqual(errors,[]);console.log('PASS: one gesture reaches each page endpoint; mid-scroll reversal works; no browser errors');
}finally{await browser.close();}
