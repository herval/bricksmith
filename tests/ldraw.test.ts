import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Box3} from 'three';
import {LDrawLoader} from 'three/addons/loaders/LDrawLoader.js';
import {LDrawConditionalLineMaterial} from 'three/addons/materials/LDrawConditionalLineMaterial.js';
import {PARTS,dimensions,toLDraw,bounds,layers,type Plan,type Brick} from '../src/model';
import {procedural} from '../src/generate';
import {compile} from '../tools/design';
const manifest=JSON.parse(readFileSync(new URL('../docs/ldraw/manifest.json',import.meta.url),'utf8')) as {files:{reference:string;path:string}[]};
const files=new Map(manifest.files.map(f=>[f.reference,readFileSync(new URL('../docs/ldraw/'+f.path,import.meta.url),'utf8')]));
type Point=[number,number,number];
// Independent geometry walker: reads actual official part polygons and transforms recursively.
// This deliberately does not use Bricksmith's part catalog to derive source dimensions.
const cache=new Map<string,Point[]>();
function transform(v:Point,n:number[]):Point{return [n[3]*v[0]+n[4]*v[1]+n[5]*v[2]+n[0],n[6]*v[0]+n[7]*v[1]+n[8]*v[2]+n[1],n[9]*v[0]+n[10]*v[1]+n[11]*v[2]+n[2]];}
function vertices(name:string):Point[]{name=name.replaceAll('\\','/').toLowerCase();if(cache.has(name))return cache.get(name)!;const text=files.get(name);assert.ok(text,`Missing fixture: ${name}`);const points:Point[]=[];for(const line of text.split(/\r?\n/)){const t=line.trim().split(/\s+/);if(t[0]==='1'){const matrix=t.slice(2,14).map(Number);for(const p of vertices(t.slice(14).join(' ')))points.push(transform(p,matrix));}else if(t[0]==='3'||t[0]==='4'){for(let i=2;i<t.length;i+=3)points.push([Number(t[i]),Number(t[i+1]),Number(t[i+2])]);}}cache.set(name,points);return points;}
function extent(points:Point[]){return {min:[0,1,2].map(i=>Math.min(...points.map(p=>p[i]))),max:[0,1,2].map(i=>Math.max(...points.map(p=>p[i])))};}
function near(actual:number,expected:number){assert.ok(Math.abs(actual-expected)<.02,`${actual} ≠ ${expected}`);}
for(const p of PARTS)test(`official ${p.id}.dat geometry verifies body-top origin and ${p.w}×${p.d} orientation`,()=>{const b=extent(vertices(p.id+'.dat'));near(b.min[0],-p.w*10);near(b.max[0],p.w*10);near(b.min[2],-p.d*10);near(b.max[2],p.d*10);near(b.min[1],-4);near(b.max[1],p.h*8);});
test('all exported part transforms agree with actual official geometry at 0° and 90°',()=>{for(const p of PARTS)for(const rotation of [0,90] as const){const b:Brick={id:'p',part:p.id,color:4,x:-3,z:5,y:7,rotation};const plan:Plan={version:1,name:'Transforms',source:'custom',description:'Reference check',bricks:[b]};const line=toLDraw(plan).split('\r\n').find(l=>l.startsWith('1 '))!;const tokens=line.split(' '),matrix=tokens.slice(2,14).map(Number),ext=extent(vertices(p.id+'.dat').map(v=>transform(v,matrix))),d=dimensions(b);near(ext.min[0],b.x*20);near(ext.max[0],(b.x+d.w)*20);near(ext.min[2],-(b.z+d.d)*20);near(ext.max[2],-b.z*20);near(ext.min[1],-(b.y+d.h)*8-4);near(ext.max[1],-b.y*8);}});
test('independent Three.js LDrawLoader parses exported cottage using official library fixtures',{timeout:20000},async()=>{const p=procedural('cottage'),config=readFileSync(new URL('../docs/LDConfig-reference.ldr',import.meta.url),'utf8').split(/\r?\n/).filter(l=>l.startsWith('0 !COLOUR')).join('\n');const mpd='0 FILE verify.ldr\n'+config+'\n'+toLDraw(p)+'\n'+[...files].map(([name,text])=>'0 FILE '+name+'\n'+text).join('\n');const loader=new LDrawLoader();loader.setFileMap(Object.fromEntries([...files.keys()].map(name=>[name,name])));loader.setConditionalLineMaterial(LDrawConditionalLineMaterial);const group=await new Promise<import('three').Group>((resolve,reject)=>loader.parse(mpd,resolve,reject));group.updateMatrixWorld(true);const box=new Box3().setFromObject(group),b=bounds(p);near(box.min.x,b.minX*20);near(box.max.x,b.maxX*20);near(box.min.z,-b.maxZ*20);near(box.max.z,-b.minZ*20);near(box.max.y,0);near(box.min.y,-b.maxY*8-4);assert.equal(group.userData.numBuildingSteps,layers(p).length);let meshes=0;group.traverse(o=>{if((o as import('three').Mesh).isMesh)meshes++;});assert.ok(meshes>0);});
for(const name of ['penguin','rover'])test(`independent official-part LDraw parse verifies novel ${name} export`,{timeout:20000},async()=>{
 const {plan:p}=compile(JSON.parse(readFileSync(new URL(`../examples/agent/${name}.design.json`,import.meta.url),'utf8')));
 const config=readFileSync(new URL('../docs/LDConfig-reference.ldr',import.meta.url),'utf8').split(/\r?\n/).filter(l=>l.startsWith('0 !COLOUR')).join('\n');
 const mpd='0 FILE verify.ldr\n'+config+'\n'+toLDraw(p)+'\n'+[...files].map(([name,text])=>'0 FILE '+name+'\n'+text).join('\n');
 const loader=new LDrawLoader();loader.setFileMap(Object.fromEntries([...files.keys()].map(name=>[name,name])));loader.setConditionalLineMaterial(LDrawConditionalLineMaterial);
 const group=await new Promise<import('three').Group>((resolve,reject)=>loader.parse(mpd,resolve,reject));group.updateMatrixWorld(true);const ext=new Box3().setFromObject(group),b=bounds(p);
 near(ext.min.x,b.minX*20);near(ext.max.x,b.maxX*20);near(ext.min.z,-b.maxZ*20);near(ext.max.z,-b.minZ*20);near(ext.max.y,0);near(ext.min.y,-b.maxY*8-4);assert.equal(group.userData.numBuildingSteps,layers(p).length);
});
