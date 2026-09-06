import {build} from 'vite';
import {chromium} from '@playwright/test';
import {createServer} from 'node:http';
import {mkdtemp,mkdir,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve,join,dirname,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import type {Plan} from '../src/model.ts';
import {ToolError} from './design.ts';
export async function render(plan:Plan,out:string,size:number,browserPath?:string){
 const temporary=await mkdtemp(join(tmpdir(),'bricksmith-render-'));let browser:Awaited<ReturnType<typeof chromium.launch>>|undefined,server:ReturnType<typeof createServer>|undefined;
 try {
  await build({configFile:false,root:resolve(dirname(fileURLToPath(import.meta.url)),'render'),publicDir:false,logLevel:'silent',build:{outDir:join(temporary,'site'),emptyOutDir:true,minify:false}});
  server=createServer(async(req,res)=>{try{const path=new URL(req.url??'/','http://localhost').pathname;const target=resolve(temporary,'site','.'+(path==='/'?'/index.html':decodeURIComponent(path)));if(!target.startsWith(join(temporary,'site')+'/')){res.writeHead(403).end();return;}const bytes=await readFile(target);res.setHeader('Content-Type',extname(target)==='.js'?'text/javascript':extname(target)==='.html'?'text/html':'application/octet-stream');res.end(bytes);}catch{res.writeHead(404).end();}});
  await new Promise<void>((done,reject)=>{server!.once('error',reject);server!.listen(0,'127.0.0.1',done);});const address=server.address();if(!address||typeof address==='string')throw new Error('No render port');const base=`http://127.0.0.1:${address.port}`;
  const settings={headless:true,timeout:20000,args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']};
  if(browserPath)browser=await chromium.launch({...settings,executablePath:resolve(browserPath)});
  else {try{browser=await chromium.launch(settings);}catch{try{browser=await chromium.launch({...settings,channel:'chrome'});}catch{throw new ToolError('BROWSER_UNAVAILABLE','Install Playwright Chromium (npx playwright install chromium), use installed Chrome, or provide --browser. No browser is downloaded automatically.','$',{},4);}}}
  const context=await browser.newContext({viewport:{width:size,height:size},deviceScaleFactor:1});const errors:string[]=[],external:string[]=[];
  await context.route('**/*',route=>{if(new URL(route.request().url()).origin===base)return route.continue();external.push(route.request().url());return route.abort();});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(20000);await page.goto(base);await page.waitForFunction(()=>typeof (window as any).loadPlan==='function');
  await page.evaluate(p=>(window as any).loadPlan(p),plan);await mkdir(out,{recursive:true});const views=['front','back','left','right','top','iso'];const files:Record<string,string>={};const cameras:Record<string,unknown>={};
  for(const view of views){cameras[view]=await page.evaluate(v=>(window as any).setView(v),view);const file=join(out,view+'.png');await page.locator('canvas').screenshot({path:file,timeout:20000});files[view]=file;}
  if(errors.length||external.length)throw new ToolError('RENDER','Render had browser errors or attempted external requests','$',{errors,external},4);
  const report={schema:'bricksmith.render.v1',renderer:'Three.js upright body-and-stud approximation (not official LDraw mesh)',browser:browser.version(),size,pieces:plan.bricks.length,files,cameras,externalRequests:external,errors};await writeFile(join(out,'render.json'),JSON.stringify(report,null,2)+'\n');return report;
 }finally{await browser?.close();if(server)await new Promise<void>(done=>server!.close(()=>done()));await rm(temporary,{recursive:true,force:true});}
}
