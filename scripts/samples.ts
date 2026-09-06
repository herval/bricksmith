import {mkdir,writeFile} from 'node:fs/promises';
import {deflateSync} from 'node:zlib';
import {procedural,imagePlan} from '../src/generate';
import {toLDraw,toCSV,toJSON,diagnose,inventory,layers,DEFAULTS,type Plan} from '../src/model';
import {instructionHTML} from '../src/instructions';
const out=new URL('../samples/',import.meta.url);await mkdir(out,{recursive:true});
const summary:Record<string,unknown>={};
async function save(name:string,p:Plan){for(const [ext,content] of [['ldr',toLDraw(p)],['csv',toCSV(p)],['json',toJSON(p)],['html',instructionHTML(p)]])await writeFile(new URL(`${name}.${ext}`,out),content);const d=diagnose(p);summary[name]={pieces:p.bricks.length,steps:layers(p).length,inventoryRows:inventory(p).length,collisions:d.collisions.length,unsupported:d.unsupported.length,partialSupport:d.partialSupport.length,groups:d.components.length};}
for(const family of ['cottage','tower','pyramid'])await save(family,procedural(family));
const w=24,h=16,pixels=new Uint8ClampedArray(w*h*4);
for(let z=0;z<h;z++)for(let x=0;x<w;x++){let c=[30,90,168];if((x-18)**2+(z-4)**2<8)c=[250,200,10];const ridge=9-Math.round(4*Math.sin(x*.23)**2);if(z>=ridge)c=[0,69,26];if(z>12)c=[0,133,43];if(z>14)c=[215,186,140];pixels.set([...c,255],(z*w+x)*4);}
await save('landscape-mosaic',imagePlan(pixels,w,h,'mosaic',{...DEFAULTS,size:24}));await save('landscape-relief',imagePlan(pixels,w,h,'relief',{...DEFAULTS,size:24,height:6}));
// Tiny dependency-free PNG encoder, only for a reproducible upload fixture.
function crc32(data:Uint8Array){let crc=0xffffffff;for(const b of data){crc^=b;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return (crc^0xffffffff)>>>0;}
function chunk(type:string,data:Buffer){const t=Buffer.from(type),length=Buffer.alloc(4),crc=Buffer.alloc(4);length.writeUInt32BE(data.length);crc.writeUInt32BE(crc32(Buffer.concat([t,data])));return Buffer.concat([length,t,data,crc]);}
const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(w);ihdr.writeUInt32BE(h,4);ihdr[8]=8;ihdr[9]=6;const rows=Buffer.alloc(h*(w*4+1));for(let y=0;y<h;y++)rows.set(pixels.slice(y*w*4,(y+1)*w*4),y*(w*4+1)+1);const png=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',deflateSync(rows)),chunk('IEND',Buffer.alloc(0))]);await writeFile(new URL('source-landscape.png',out),png);
await writeFile(new URL('summary.json',out),JSON.stringify(summary,null,2)+'\n');console.log(JSON.stringify(summary,null,2));
