import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
const root=resolve(import.meta.dirname,'..'),out=join(root,'artifacts/agent/render-smoke');mkdirSync(out,{recursive:true});
const checks=[];
function run(args){const r=spawnSync(process.execPath,[join(root,'tools/bin.mjs'),...args],{cwd:tmpdir(),encoding:'utf8',timeout:120000});assert.equal(r.status,0,r.stdout+'\n'+r.stderr);return JSON.parse(r.stdout);}
const source=join(root,'examples/agent/penguin.design.json');const compilation=run(['compile','--design',source,'--out',join(out,'compiled')]);assert.equal(compilation.fidelity.exact,true);assert.equal(compilation.pieces,321);checks.push('compile from unrelated cwd with exact geometry');
const plan=compilation.files.plan;const rendering=run(['render','--plan',plan,'--out',join(out,'views'),'--size','512']);assert.equal(rendering.externalRequests.length,0);assert.deepEqual(rendering.errors,[]);const hashes=[];
for(const name of ['front','back','left','right','top','iso']){const png=readFileSync(rendering.files[name]);assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert.equal(png.readUInt32BE(16),512);assert.equal(png.readUInt32BE(20),512);assert.ok(png.length>5000);hashes.push(createHash('sha256').update(png).digest('hex'));assert.equal(rendering.cameras[name].position.length,3);checks.push(name+' real 512px PNG with camera metadata');}
assert.ok(new Set(hashes).size>=5);checks.push('views are distinct, with zero external requests or browser errors');
const exported=run(['export','--plan',plan,'--design',source,'--out',join(out,'export')]);const p=JSON.parse(readFileSync(plan));assert.equal(readFileSync(exported.files.ldraw,'utf8').split(/\r?\n/).filter(l=>l.startsWith('1 ')).length,p.bricks.length);assert.equal(JSON.parse(readFileSync(exported.files.plan)).bricks.length,p.bricks.length);const rows=readFileSync(exported.files.inventory,'utf8').trim().split(/\r?\n/).slice(1);assert.equal(rows.reduce((n,s)=>n+Number(s.split(',').at(-1)),0),p.bricks.length);const html=readFileSync(exported.files.instructions,'utf8');for(const b of p.bricks)assert.ok(html.includes(' / '+b.id+'</td>'));checks.push('exported JSON, LDraw, CSV and instruction IDs agree');
const result={status:'passed',checks:checks.length,names:checks,render:rendering,export:exported};writeFileSync(join(out,'smoke-report.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
