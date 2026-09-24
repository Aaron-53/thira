import puppeteer from 'puppeteer';
import fs from 'node:fs';
const folder='artifacts/change-04-final';
fs.mkdirSync(folder,{recursive:true});
const browser=await puppeteer.launch({headless:true,args:['--no-sandbox','--use-angle=d3d11']});
const report={errors:[],results:[]};
try{
  const page=await browser.newPage();page.setDefaultTimeout(90000);
  page.on('pageerror',error=>report.errors.push(error.message));
  await page.setViewport({width:1440,height:900,deviceScaleFactor:1});
  await page.goto('http://127.0.0.1:4176/?capture&profile',{waitUntil:'networkidle0'});
  await page.waitForFunction(()=>window.__oceanStudy?.ready&&window.__oceanProfile);
  report.device=await page.evaluate(()=>window.__oceanProfile.device);
  for(const p of [.05,.52,.7,.88,.92,.95,1]){
    const result=await page.evaluate(p=>window.__oceanProfile.run({p,t:12,samples:60,warmup:15}),p);
    report.results.push(result);console.log(JSON.stringify(result));
  }
}catch(error){report.errors.push(String(error));process.exitCode=1;}
finally{
  fs.writeFileSync(`${folder}/narrative-performance.json`,JSON.stringify(report,null,2));
  await browser.close();
}
