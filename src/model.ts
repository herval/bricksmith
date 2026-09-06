// Units: x/z = stud grid boundaries, y = plate units upward. Upright parts only.
export interface Part { id: string; name: string; w: number; d: number; h: number }
export const PARTS: Part[] = [
  {id:'3001',name:'Brick 2 × 4',w:4,d:2,h:3},{id:'3002',name:'Brick 2 × 3',w:3,d:2,h:3},
  {id:'3003',name:'Brick 2 × 2',w:2,d:2,h:3},{id:'3010',name:'Brick 1 × 4',w:4,d:1,h:3},
  {id:'3622',name:'Brick 1 × 3',w:3,d:1,h:3},{id:'3004',name:'Brick 1 × 2',w:2,d:1,h:3},
  {id:'3005',name:'Brick 1 × 1',w:1,d:1,h:3},{id:'3020',name:'Plate 2 × 4',w:4,d:2,h:1},
  {id:'3021',name:'Plate 2 × 3',w:3,d:2,h:1},{id:'3022',name:'Plate 2 × 2',w:2,d:2,h:1},
  {id:'3710',name:'Plate 1 × 4',w:4,d:1,h:1},{id:'3623',name:'Plate 1 × 3',w:3,d:1,h:1},
  {id:'3023',name:'Plate 1 × 2',w:2,d:1,h:1},{id:'3024',name:'Plate 1 × 1',w:1,d:1,h:1},
];
export const PART_BY_ID = Object.fromEntries(PARTS.map(p=>[p.id,p]));
export const COLORS = [
  {code:0,name:'Black',hex:'#1B2A34'},{code:1,name:'Blue',hex:'#1E5AA8'},
  {code:2,name:'Green',hex:'#00852B'},{code:4,name:'Red',hex:'#B40000'},
  {code:14,name:'Yellow',hex:'#FAC80A'},{code:15,name:'White',hex:'#F4F4F4'},
  {code:19,name:'Tan',hex:'#D7BA8C'},{code:25,name:'Orange',hex:'#D67923'},
  {code:70,name:'Reddish brown',hex:'#5F3109'},{code:71,name:'Light bluish gray',hex:'#969696'},
  {code:72,name:'Dark bluish gray',hex:'#646464'},{code:288,name:'Dark green',hex:'#00451A'},
];
export const COLOR_BY_CODE = Object.fromEntries(COLORS.map(c=>[c.code,c]));
export const PALETTES: Record<string,number[]> = {classic:[0,1,2,4,14,15,19,25,70,71,72,288],earth:[0,15,19,70,71,72,288],mono:[0,15,71,72]};
export interface Brick {id:string; part:string; color:number; x:number; y:number; z:number; rotation:0|90}
export interface Plan {version:1; name:string; source:'procedural'|'mosaic'|'relief'|'custom'; description:string; bricks:Brick[]}
export interface Options {size:number; height:number; budget:number; palette:string}
export const DEFAULTS: Options = {size:16,height:8,budget:1200,palette:'classic'};
export function dimensions(b:Brick) {const p=PART_BY_ID[b.part];return {w:b.rotation===90?p.d:p.w,d:b.rotation===90?p.w:p.d,h:p.h};}
export function bounds(plan:Plan) { const bs=plan.bricks; return {minX:Math.min(...bs.map(b=>b.x)),minZ:Math.min(...bs.map(b=>b.z)),maxX:Math.max(...bs.map(b=>b.x+dimensions(b).w)),maxZ:Math.max(...bs.map(b=>b.z+dimensions(b).d)),maxY:Math.max(...bs.map(b=>b.y+dimensions(b).h))}; }
export function layers(plan:Plan) {return [...new Set(plan.bricks.map(b=>b.y))].sort((a,b)=>a-b);}
export function ordered(plan:Plan) {return [...plan.bricks].sort((a,b)=>a.y-b.y||a.z-b.z||a.x-b.x||a.id.localeCompare(b.id));}
export function normalizeOptions(input:Options):Options {
  const integer=(v:number,min:number,max:number,name:string)=>{if(!Number.isInteger(v)||v<min||v>max) throw Error(`${name} must be an integer from ${min} to ${max}.`);return v;};
  if(!Object.hasOwn(PALETTES,input.palette)) throw Error('Unknown palette.');
  return {size:integer(input.size,8,40,'Size'),height:integer(input.height,3,20,'Height'),budget:integer(input.budget,20,5000,'Budget'),palette:input.palette};
}
export function enforceBudget(plan:Plan,budget:number) {if(plan.bricks.length>budget) throw Error(`This design needs ${plan.bricks.length.toLocaleString()} pieces; your budget is ${budget.toLocaleString()}. Reduce size / height or raise the piece budget. No partial model was loaded.`); return plan;}
export function validatePlan(value:unknown):Plan {
  if(!value||typeof value!=='object') throw Error('Plan must be a JSON object.');
  const p=value as Record<string,unknown>;
  if(p.version!==1) throw Error('Unsupported plan version; expected 1.');
  if(typeof p.name!=='string'||!p.name.trim()||p.name.length>100||/[\x00-\x1f]/.test(p.name)) throw Error('Name must be 1–100 characters with no control characters.');
  if(!['procedural','mosaic','relief','custom'].includes(String(p.source))) throw Error('Invalid plan source.');
  if(typeof p.description!=='string'||p.description.length>1000) throw Error('Description must be text up to 1,000 characters.');
  if(!Array.isArray(p.bricks)||p.bricks.length<1||p.bricks.length>5000) throw Error('Plan must contain 1–5,000 bricks.');
  const ids=new Set<string>();
  const bricks:Brick[]=p.bricks.map((v:unknown,i:number)=>{
    if(!v||typeof v!=='object') throw Error(`Brick ${i+1} must be an object.`);
    const b=v as Record<string,unknown>;
    if(typeof b.id!=='string'||!/^[-a-zA-Z0-9_]{1,64}$/.test(b.id)||ids.has(b.id)) throw Error(`Brick ${i+1}: IDs must be unique, alphanumeric, hyphen/underscore (1–64).`);
    ids.add(b.id);
    if(typeof b.part!=='string'||!Object.hasOwn(PART_BY_ID,b.part)) throw Error(`Brick ${i+1}: unsupported part ${String(b.part)}.`);
    if(typeof b.color!=='number'||!Object.hasOwn(COLOR_BY_CODE,b.color)) throw Error(`Brick ${i+1}: unsupported color.`);
    for(const key of ['x','y','z']) if(!Number.isInteger(b[key])||Number(b[key])<(key==='y'?0:-128)||Number(b[key])>128) throw Error(`Brick ${i+1}: ${key} must be an integer ${key==='y'?'0':'−128'}…128.`);
    if(b.rotation!==0&&b.rotation!==90) throw Error(`Brick ${i+1}: rotation must be 0 or 90.`);
    return {id:b.id,part:b.part,color:b.color,x:Number(b.x),y:Number(b.y),z:Number(b.z),rotation:b.rotation};
  });
  return {version:1,name:p.name,source:p.source as Plan['source'],description:p.description,bricks};
}
export interface InventoryRow {part:string; name:string; color:number; colorName:string; quantity:number}
export function inventory(plan:Plan):InventoryRow[] {const rows=new Map<string,InventoryRow>();for(const b of plan.bricks){const key=`${b.part}-${b.color}`;const row=rows.get(key);if(row)row.quantity++;else rows.set(key,{part:b.part,name:PART_BY_ID[b.part].name,color:b.color,colorName:COLOR_BY_CODE[b.color].name,quantity:1});}return [...rows.values()].sort((a,b)=>b.quantity-a.quantity||a.part.localeCompare(b.part)||a.color-b.color);}
export interface Diagnostics {collisions:[string,string][]; unsupported:string[]; partialSupport:string[]; components:string[][]; groundCount:number; connections:number; truncated:boolean}
export function diagnose(plan:Plan):Diagnostics {
  // Exact occupied-cell hashing for this integer-grid rectangular subset; no all-pairs scan.
  let truncated=false;let connectionCount=0;const cells=new Map<string,string[]>();const collisions:[string,string][]=[];const collisionKeys=new Set<string>();
  const top=new Map<string,string[]>();const adjacency=new Map(plan.bricks.map(b=>[b.id,new Set<string>()]));
  const k=(x:number,y:number,z:number)=>`${x},${y},${z}`;
  for(const b of plan.bricks){const {w,d,h}=dimensions(b);for(let x=b.x;x<b.x+w;x++)for(let z=b.z;z<b.z+d;z++){
    for(let y=b.y;y<b.y+h;y++){const key=k(x,y,z),others=cells.get(key)||[];if(collisions.length<1000){for(const other of others){const pair=[other,b.id].sort() as [string,string];const pk=pair.join('|');if(!collisionKeys.has(pk)){collisions.push(pair);collisionKeys.add(pk);if(collisions.length>=1000){truncated=true;break;}}}}others.push(b.id);cells.set(key,others);}
    const tk=k(x,b.y+h,z);const stack=top.get(tk)||[];stack.push(b.id);top.set(tk,stack);
  }}
  const unsupported:string[]=[],partialSupport:string[]=[];let groundCount=0;
  for(const b of plan.bricks){if(b.y===0){groundCount++;continue;}const {w,d}=dimensions(b);let supported=0;
    for(let x=b.x;x<b.x+w;x++)for(let z=b.z;z<b.z+d;z++){const below=top.get(k(x,b.y,z))||[];if(below.length)supported++;if(connectionCount<20000){for(const id of below){if(!adjacency.get(id)!.has(b.id)){adjacency.get(id)!.add(b.id);adjacency.get(b.id)!.add(id);connectionCount++;if(connectionCount>=20000){truncated=true;break;}}}}}
    if(!supported)unsupported.push(b.id);else if(supported<w*d)partialSupport.push(b.id);
  }
  const seen=new Set<string>(),components:string[][]=[];for(const b of plan.bricks){if(seen.has(b.id))continue;const component:string[]=[],queue=[b.id];seen.add(b.id);while(queue.length){const id=queue.pop()!;component.push(id);for(const neighbor of adjacency.get(id)!){if(!seen.has(neighbor)){seen.add(neighbor);queue.push(neighbor);}}}components.push(component);}
  return {collisions,unsupported,partialSupport,components,groundCount,connections:connectionCount,truncated};
}
export function toLDraw(plan:Plan):string {
  const lines=[`0 ${plan.name.replace(/[\r\n]/g,' ')}`,'0 Name: bricksmith.ldr','0 Author: Bricksmith','0 !LDRAW_ORG Model','0 // Units: 20 LDU/stud, 8 LDU/plate, -Y up. Upright common parts only.','0 // Not physically validated. Standard LDraw parts library required.'];
  const sorted=ordered(plan);let previous=sorted[0]?.y;
  for(const b of sorted){if(b.y!==previous){lines.push('0 STEP');previous=b.y;}const {w,d,h}=dimensions(b);const matrix=b.rotation===90?'0 0 1 0 1 0 -1 0 0':'1 0 0 0 1 0 0 0 1';lines.push(`1 ${b.color} ${(b.x+w/2)*20} ${-(b.y+h)*8} ${-(b.z+d/2)*20} ${matrix} ${b.part}.dat`);}
  lines.push('0 STEP');return lines.join('\r\n')+'\r\n';
}
export function toCSV(plan:Plan) {return ['part_id,description,ldraw_color,color_name,quantity',...inventory(plan).map(r=>`${r.part},"${r.name}",${r.color},"${r.colorName}",${r.quantity}`)].join('\r\n')+'\r\n';}
export function toJSON(plan:Plan){return JSON.stringify(plan,null,2)+'\n';}
export function escapeHTML(s:string){return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));}
