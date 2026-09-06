// Optional maintainer utility. Runtime and tests never fetch the network.
// Downloads only the 14 documented upright parts and their referenced primitives.
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {dirname} from 'node:path';
const root=new URL('../docs/ldraw/',import.meta.url);
const ids=['3001','3002','3003','3010','3622','3004','3005','3020','3021','3022','3710','3623','3023','3024'];
const manifest={source:'https://library.ldraw.org/library/official/',retrievedAt:new Date().toISOString(),files:[]};
const done=new Set();
async function load(name){name=name.replaceAll('\\','/').toLowerCase();if(done.has(name))return;done.add(name);
 const candidates=name.startsWith('s/')?['parts/'+name]:name.startsWith('48/')||name.startsWith('8/')?['p/'+name]:[/^\d{4}\.dat$/.test(name)?'parts/'+name:'p/'+name,/^\d{4}\.dat$/.test(name)?'p/'+name:'parts/'+name];
 let content,path,url;
 for(const candidate of candidates){url=manifest.source+candidate;let response=await fetch(url);if(response.status===429){await new Promise(r=>setTimeout(r,Math.max(1000,Number(response.headers.get('retry-after')||5)*1000)));response=await fetch(url);}if(response.status===404)continue;if(!response.ok)throw Error(`${response.status} ${url}`);content=await response.text();path=candidate;break;}
 if(!content||!path)throw Error(`Missing official reference ${name}`);const target=new URL(path,root);await mkdir(dirname(target.pathname),{recursive:true});await writeFile(target,content);manifest.files.push({reference:name,path,url});
 for(const line of content.split(/\r?\n/)){const t=line.trim().split(/\s+/);if(t[0]==='1')await load(t.slice(14).join(' '));}
}
for(const id of ids)await load(id+'.dat');
await writeFile(new URL('manifest.json',root),JSON.stringify(manifest,null,2)+'\n');console.log(`Cached ${manifest.files.length} official reference files.`);
