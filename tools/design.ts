import {PARTS,COLORS,dimensions,validatePlan,inventory,diagnose,type Plan,type Brick} from '../src/model.ts';
import {packLayer} from '../src/generate.ts';

export const CAPS = Object.freeze({inputBytes:4_000_000,volume:262144,nodes:128,depth:16,evaluations:24_000_000,voxels:100000,pieces:5000,issues:12000});
export class ToolError extends Error {constructor(public code:string,message:string,public path='$',public details:unknown={},public exitCode=2){super(message);}}
function fail(code:string,message:string,path:string,details:unknown={}):never {throw new ToolError(code,message,path,details);}
type Vec=[number,number,number];
export type Shape = {type:'box';min:Vec;size:Vec}|{type:'ellipsoid';center:Vec;radii:Vec}|{type:'cylinder';center:Vec;radius:number;height:number;axis:'x'|'y'|'z'}|{type:'union'|'intersection'|'difference';children:Shape[]};
export interface Design {schema:'bricksmith.design.v1';name:string;description:string;bounds:{min:Vec;size:Vec};shapes:{op:'add'|'subtract'|'paint';color?:number;shape:Shape}[];voxels?:{at:Vec;color:number|null}[];packing?:{mode?:'mixed'|'plates';maxPieces?:number};limits?:{maxVoxels?:number;maxEvaluations?:number}}
function object(v:unknown,path:string,allowed:string[]):Record<string,any>{if(!v||typeof v!=='object'||Array.isArray(v))fail('SCHEMA','Expected object',path);for(const k of Object.keys(v))if(!allowed.includes(k))fail('SCHEMA',`Unknown field ${k}`,`${path}.${k}`);return v as Record<string,any>;}
function number(v:unknown,path:string,min:number,max:number,integer=false):number {if(typeof v!=='number'||!Number.isFinite(v)||v<min||v>max||(integer&&!Number.isInteger(v)))fail('SCHEMA',`Expected ${integer?'integer':'finite number'} in [${min}, ${max}]`,path);return v;}
function vec(v:unknown,path:string,min:number,max:number,integer=false):Vec {if(!Array.isArray(v)||v.length!==3)fail('SCHEMA','Expected [x, y, z]',path);return v.map((n,i)=>number(n,`${path}[${i}]`,min,max,integer)) as Vec;}
function color(v:unknown,path:string){if(!COLORS.some(c=>c.code===v))fail('COLOR','Unknown LDraw color; use catalog',path,{allowed:COLORS.map(c=>c.code)});}
function text(v:unknown,path:string,max:number,empty=false){if(typeof v!=='string'||v.length>max||(!empty&&!v.trim())||/[\x00-\x1f]/.test(v))fail('SCHEMA',`Expected ${empty?'0':'1'}–${max} printable characters`,path);}
function envelope(s:Shape):[Vec,Vec]{
  if(s.type==='box')return [s.min,s.min.map((v,i)=>v+s.size[i]) as Vec];
  if(s.type==='ellipsoid')return [s.center.map((v,i)=>v-s.radii[i]) as Vec,s.center.map((v,i)=>v+s.radii[i]) as Vec];
  if(s.type==='cylinder'){const a=['x','y','z'].indexOf(s.axis);return [s.center.map((v,i)=>v-(i===a?s.height/2:s.radius)) as Vec,s.center.map((v,i)=>v+(i===a?s.height/2:s.radius)) as Vec];}
  const bs=s.children.map(envelope);if(s.type==='difference')return bs[0];
  return [[0,1,2].map(i=>(s.type==='intersection'?Math.max:Math.min)(...bs.map(b=>b[0][i]))) as Vec,[0,1,2].map(i=>(s.type==='intersection'?Math.min:Math.max)(...bs.map(b=>b[1][i]))) as Vec];
}
export function parseDesign(raw:unknown):Design {
  const d=object(raw,'$',['schema','name','description','bounds','shapes','voxels','packing','limits']);
  if(d.schema!=='bricksmith.design.v1')fail('SCHEMA','Expected schema bricksmith.design.v1','$.schema');text(d.name,'$.name',100);text(d.description,'$.description',800,true);
  const b=object(d.bounds,'$.bounds',['min','size']);vec(b.min,'$.bounds.min',-128,128,true);vec(b.size,'$.bounds.size',1,128,true);
  if(b.min[1]<0||b.size[0]>64||b.size[2]>64||b.min.some((v:number,i:number)=>v+b.size[i]>129))fail('BOUNDS','Bounds must fit x/z −128…129, y 0…129; horizontal size ≤64','$.bounds');
  const volume=b.size.reduce((a:number,v:number)=>a*v,1);if(volume>CAPS.volume)fail('BUDGET','Sampling volume exceeds hard cap','$.bounds',{volume,cap:CAPS.volume});
  let nodes=0;
  const walk=(v:unknown,p:string,depth:number):void=>{if(++nodes>CAPS.nodes||depth>CAPS.depth)fail('BUDGET','CSG node/depth limit exceeded',p,{nodes,depth,caps:CAPS});const s=object(v,p,['type','min','size','center','radii','radius','height','axis','children']);
    const exact=(keys:string[])=>{for(const k of Object.keys(s))if(!keys.includes(k))fail('SCHEMA',`Field ${k} not allowed for ${s.type}`,`${p}.${k}`);};
    if(s.type==='box'){exact(['type','min','size']);vec(s.min,p+'.min',-256,256);vec(s.size,p+'.size',.001,512);}
    else if(s.type==='ellipsoid'){exact(['type','center','radii']);vec(s.center,p+'.center',-256,256);vec(s.radii,p+'.radii',.001,256);}
    else if(s.type==='cylinder'){exact(['type','center','radius','height','axis']);vec(s.center,p+'.center',-256,256);number(s.radius,p+'.radius',.001,256);number(s.height,p+'.height',.001,512);if(!['x','y','z'].includes(s.axis))fail('SCHEMA','Cylinder axis must be x, y, or z',p+'.axis');}
    else if(['union','intersection','difference'].includes(s.type)){exact(['type','children']);if(!Array.isArray(s.children)||s.children.length<2||s.children.length>32)fail('SCHEMA','CSG requires 2–32 children',p+'.children');s.children.forEach((c:unknown,i:number)=>walk(c,`${p}.children[${i}]`,depth+1));}
    else fail('SCHEMA','Unknown shape type',p+'.type');
  };
  if(!Array.isArray(d.shapes)||d.shapes.length>64)fail('SCHEMA','shapes must be an array of 0–64 operations','$.shapes');
  d.shapes.forEach((v:unknown,i:number)=>{const p=`$.shapes[${i}]`,s=object(v,p,['op','color','shape']);if(!['add','subtract','paint'].includes(s.op))fail('SCHEMA','op must be add, subtract, or paint',p+'.op');if(s.op==='subtract'){if('color' in s)fail('SCHEMA','subtract has no color',p+'.color');}else color(s.color,p+'.color');walk(s.shape,p+'.shape',1);
    if(s.op==='add'){const [min,max]=envelope(s.shape);if(min.some((v,j)=>v<b.min[j]-1e-9)||max.some((v,j)=>v>b.min[j]+b.size[j]+1e-9))fail('CLIPPED_SHAPE','Additive shape extends outside bounds. Enlarge bounds or explicitly intersect with a box; no implicit clipping.',p+'.shape',{envelope:[min,max]});}
  });
  if(d.voxels!==undefined){if(!Array.isArray(d.voxels)||d.voxels.length>CAPS.voxels)fail('BUDGET','voxels must be an array of at most 100000 overrides','$.voxels');const seen=new Set<string>();d.voxels.forEach((v:unknown,i:number)=>{const p=`$.voxels[${i}]`,c=object(v,p,['at','color']);vec(c.at,p+'.at',-128,128,true);if(c.at.some((n:number,j:number)=>n<b.min[j]||n>=b.min[j]+b.size[j]))fail('BOUNDS','Voxel outside declared bounds',p+'.at');if(c.color!==null)color(c.color,p+'.color');const key=c.at.join(',');if(seen.has(key))fail('SCHEMA','Duplicate voxel override',p+'.at');seen.add(key);});}
  if(d.packing!==undefined){const p=object(d.packing,'$.packing',['mode','maxPieces']);if(p.mode!==undefined&&!['mixed','plates'].includes(p.mode))fail('SCHEMA','mode must be mixed or plates','$.packing.mode');if(p.maxPieces!==undefined)number(p.maxPieces,'$.packing.maxPieces',1,CAPS.pieces,true);}
  if(d.limits!==undefined){const l=object(d.limits,'$.limits',['maxVoxels','maxEvaluations']);if(l.maxVoxels!==undefined)number(l.maxVoxels,'$.limits.maxVoxels',1,CAPS.volume,true);if(l.maxEvaluations!==undefined)number(l.maxEvaluations,'$.limits.maxEvaluations',1,CAPS.evaluations,true);}
  const work=nodes*volume,limit=d.limits?.maxEvaluations??CAPS.evaluations;if(work>limit)fail('BUDGET','Conservative CSG evaluation budget exceeded','$.limits.maxEvaluations',{estimated:work,limit});
  return structuredClone(d) as Design;
}
function inside(s:Shape,p:Vec):boolean {
  if(s.type==='box')return p.every((v,i)=>v>=s.min[i]&&v<s.min[i]+s.size[i]);
  if(s.type==='ellipsoid')return p.reduce((n,v,i)=>n+((v-s.center[i])/s.radii[i])**2,0)<=1;
  if(s.type==='cylinder'){const a=['x','y','z'].indexOf(s.axis);return p[a]>=s.center[a]-s.height/2&&p[a]<s.center[a]+s.height/2&&p.reduce((n,v,i)=>n+(i===a?0:(v-s.center[i])**2),0)<=s.radius**2;}
  if(s.type==='union')return s.children.some(c=>inside(c,p));if(s.type==='intersection')return s.children.every(c=>inside(c,p));return inside(s.children[0],p)&&!s.children.slice(1).some(c=>inside(c,p));
}
export const cellKey=(x:number,y:number,z:number)=>`${x},${y},${z}`;
export function voxelize(raw:unknown):{design:Design;cells:Map<string,number>} {
  const design=parseDesign(raw),cells=new Map<string,number>(),{min,size}=design.bounds;
  for(let y=min[1];y<min[1]+size[1];y++)for(let z=min[2];z<min[2]+size[2];z++)for(let x=min[0];x<min[0]+size[0];x++){
    let c:number|undefined;for(const op of design.shapes)if(inside(op.shape,[x+.5,y+.5,z+.5])){if(op.op==='subtract')c=undefined;else if(op.op==='add'||c!==undefined)c=op.color;}
    if(c!==undefined)cells.set(cellKey(x,y,z),c);
  }
  for(const v of design.voxels??[]){const key=v.at.join(',');if(v.color===null)cells.delete(key);else cells.set(key,v.color);}
  if(!cells.size)fail('EMPTY','Design contains no occupied voxel centers','$');if(cells.size>(design.limits?.maxVoxels??CAPS.volume))fail('BUDGET','Occupied voxel budget exceeded','$.limits.maxVoxels',{actual:cells.size,limit:design.limits?.maxVoxels??CAPS.volume});return {design,cells};
}
export function compile(raw:unknown){
  const {design,cells}=voxelize(raw),{min,size}=design.bounds,bricks:Brick[]=[],tops=new Map<string,string>();let phase=0;
  for(let y=min[1];y<min[1]+size[1];){
    const grid=Array.from({length:size[2]},(_,dz)=>Array.from({length:size[0]},(_,dx)=>cells.get(cellKey(min[0]+dx,y,min[2]+dz))??null));
    // Use brick-height courses only when three entire color slices agree. Extracting tall
    // cores first strands fringe plates; a full plate course can bridge a curved overhang.
    let h:1|3=1;if(design.packing?.mode!=='plates'&&y+2<min[1]+size[1]&&grid.every((row,dz)=>row.every((c,dx)=>[1,2].every(dy=>(cells.get(cellKey(min[0]+dx,y+dy,min[2]+dz))??null)===c))))h=3;
    let best:Brick[]=[];let bestScore=Infinity;
    // Eight bounded alternatives reuse the tested packer. Alternate seam preference,
    // mirror traversal, prefer lower stud contact and bridging distinct lower pieces.
    for(const flipX of [false,true])for(const flipZ of [false,true])for(const shift of [0,1]){
      const mirrored=(flipZ?[...grid].reverse():grid).map(row=>flipX?[...row].reverse():row);
      const candidate=packLayer(mirrored,y,h,phase+shift,bricks.length);let unsupported=0,bridges=0;
      for(const p of candidate){const d=dimensions(p);p.x=min[0]+(flipX?size[0]-p.x-d.w:p.x);p.z=min[2]+(flipZ?size[2]-p.z-d.d:p.z);const supports=new Set<string>();for(let dx=0;dx<d.w;dx++)for(let dz=0;dz<d.d;dz++){const id=tops.get(cellKey(p.x+dx,y,p.z+dz));if(id)supports.add(id);}if(y>0&&!supports.size)unsupported++;bridges+=Math.max(0,supports.size-1);}
      const score=unsupported*10000+candidate.length*10-bridges*8+shift*.1;if(score<bestScore){bestScore=score;best=candidate;}
    }
    for(const p of best){const d=dimensions(p);for(let dx=0;dx<d.w;dx++)for(let dz=0;dz<d.d;dz++)tops.set(cellKey(p.x+dx,y+d.h,p.z+dz),p.id);}bricks.push(...best);
    if(bricks.length>(design.packing?.maxPieces??CAPS.pieces))fail('BUDGET','Exact packing exceeds piece budget. Simplify the design or increase maxPieces; no geometry was deleted.','$.packing.maxPieces',{atLeast:bricks.length,limit:design.packing?.maxPieces??CAPS.pieces});
    phase++;y+=h;
  }
  const plan:Plan=validatePlan({version:1,name:design.name,source:'custom',description:design.description,bricks});
  const report=validate(plan,design);if(!report.fidelity?.exact)throw new ToolError('INTERNAL','Packing did not preserve voxel geometry','$',report,5);
  return {plan,report};
}
export interface Issue {code:string;severity:'error'|'warning';pieceIds:string[];message:string;action:string;details?:unknown}
export function parsePlan(raw:unknown):Plan {
  let plan:Plan;try{plan=validatePlan(raw);}catch(e){const message=(e as Error).message,index=message.match(/^Brick (\d+)/)?.[1];throw new ToolError('PLAN_SCHEMA',message,index?`$.bricks[${Number(index)-1}]`:'$',index?{pieceIndex:Number(index)-1}:{});}
  const p=object(raw,'$',['version','name','source','description','bricks']);p.bricks.forEach((b:unknown,i:number)=>object(b,`$.bricks[${i}]`,['id','part','color','x','y','z','rotation']));return plan;
}
export function validate(raw:unknown,designRaw?:unknown){
  const plan=parsePlan(raw);
  const d=diagnose(plan),issues:Issue[]=[];let issuesTruncated=false;
  const issue=(code:string,severity:Issue['severity'],pieceIds:string[],message:string,action:string,details?:unknown)=>{if(issues.length<CAPS.issues-1)issues.push({code,severity,pieceIds,message,action,details});else issuesTruncated=true;};
  for(const pair of d.collisions)issue('COLLISION','error',pair,'Brick bodies occupy the same cell.','Move/remove one listed piece or recompile the intended design.');
  const byId=new Map(plan.bricks.map(b=>[b.id,b]));
  for(const id of d.unsupported){const b=byId.get(id)!;issue('UNSUPPORTED','error',[id],`No lower stud contact at y=${b.y}.`,'Add explicit geometry below this footprint, lower it, or redesign the assembly. Nothing is added automatically.',{position:[b.x,b.y,b.z],footprint:dimensions(b)});}
  for(const id of d.partialSupport)issue('PARTIAL_SUPPORT','warning',[id],'Only part of this footprint has lower stud contacts.','Inspect this overhang and load path; add explicit support or reduce it if needed.');
  const sorted=[...d.components].sort((a,b)=>b.length-a.length||a[0].localeCompare(b[0]));
  sorted.slice(1).forEach((ids,i)=>issue('DISCONNECTED','error',ids,'Separate vertical-stud connected component; side contact alone is not a connection.','Add explicitly designed overlapping upper/lower courses joining this component to the main assembly.',{component:i+2}));
  for(const ids of d.components)if(!ids.some(id=>byId.get(id)!.y===0))issue('NO_GROUND_PATH','error',ids,'This connected component has no piece on the ground plane.','Lower the assembly or explicitly design a connection to a grounded component.');
  if(d.truncated)issue('DIAGNOSTICS_TRUNCATED','error',[],'Collision/contact safety cap reached; diagnostic counts are incomplete.','Reduce the pathological overlap/component density and rerun.');
  let fidelity:{exact:boolean;targetVoxels:number;planVoxels:number;missing:number;extra:number;wrongColor:number;overlaps:number;examples:unknown[]}|undefined;
  if(designRaw!==undefined){const {cells:target}=voxelize(designRaw),actual=new Map<string,{color:number;id:string}>();let overlaps=0;for(const b of plan.bricks){const s=dimensions(b);for(let x=b.x;x<b.x+s.w;x++)for(let y=b.y;y<b.y+s.h;y++)for(let z=b.z;z<b.z+s.d;z++){const key=cellKey(x,y,z);if(actual.has(key))overlaps++;actual.set(key,{color:b.color,id:b.id});}}
    let missing=0,extra=0,wrongColor=0;const examples:unknown[]=[];const sample=(v:unknown)=>{if(examples.length<20)examples.push(v);};for(const [key,c] of target){const a=actual.get(key);if(!a){missing++;sample({code:'MISSING_VOXEL',at:key.split(',').map(Number),color:c});}else if(a.color!==c){wrongColor++;sample({code:'WRONG_COLOR',at:key.split(',').map(Number),pieceId:a.id,expected:c,actual:a.color});}}for(const [key,a] of actual)if(!target.has(key)){extra++;sample({code:'EXTRA_VOXEL',at:key.split(',').map(Number),pieceId:a.id});}
    fidelity={exact:missing+extra+wrongColor+overlaps===0,targetVoxels:target.size,planVoxels:actual.size,missing,extra,wrongColor,overlaps,examples};if(!fidelity.exact)issue('FIDELITY','error',[],'Plan differs from the sampled design.','Inspect the voxel examples and restore the intended geometry/colors.',fidelity);
  }
  if(issuesTruncated)issues.push({code:'ISSUES_TRUNCATED',severity:'error',pieceIds:[],message:'The per-issue report cap was reached; additional issues were omitted.',action:'Repair the listed defects or validate smaller explicit subassemblies, then rerun.'});
  return {schema:'bricksmith.report.v1',valid:!issues.some(i=>i.severity==='error'),pieces:plan.bricks.length,inventory:inventory(plan),summary:{collisions:d.collisions.length,unsupported:d.unsupported.length,partialSupport:d.partialSupport.length,components:d.components.length,groundPieces:d.groundCount,connections:d.connections,truncated:d.truncated||issuesTruncated,issuesTruncated},issues,...(fidelity?{fidelity}:{ }),limitations:['Center-sampled stud/plate voxels, not continuous-surface fidelity.','Upright rectangular parts; vertical stud contacts only. No friction, torque, clutch, insertion-path, stock or physical-strength guarantee.','No automatic supports or geometry repairs; host agent must explicitly edit the design.']};
}
export function catalog(){return {schema:'bricksmith.catalog.v1',units:{x:'studs right',y:'plates up',z:'studs toward back; front view looks along +z',studMm:8,plateMm:3.2,brickHeightPlates:3},parts:PARTS,colors:COLORS,caps:CAPS};}
