import {PARTS,PALETTES,COLORS,COLOR_BY_CODE,DEFAULTS,normalizeOptions,enforceBudget,type Plan,type Brick,type Options} from './model';
export type Family='cottage'|'tower'|'pyramid';
export interface ParsedPrompt {family:Family; size:number; height:number; color?:number; roofColor?:number; summary:string}
const colorWords:Record<string,number>={black:0,blue:1,green:2,red:4,yellow:14,white:15,tan:19,orange:25,brown:70,gray:71,grey:71};
export function parsePrompt(text:string,options:Options=DEFAULTS):ParsedPrompt {
  normalizeOptions(options);if(text.length>500)throw Error('Keep the procedural prompt under 500 characters.');
  let rest=text.toLowerCase().replace(/[.,!;:]/g,' ').trim();
  const families=[...rest.matchAll(/\b(cottage|house|cabin|tower|pyramid)\b/g)].map(m=>m[1]);
  if(!families.length)throw Error('That idea is not supported by this local prototype. Try a cottage, tower, or pyramid — or import a custom JSON brick plan. No AI is running.');
  const mapped=families.map(s=>['house','cabin'].includes(s)?'cottage':s) as Family[];
  if(new Set(mapped).size!==1)throw Error('Choose one family per design: cottage, tower, or pyramid.');
  let size=options.size,height=options.height;
  const roof=rest.match(/\b(black|blue|green|red|yellow|white|tan|orange|brown|gray|grey)\s+roof\b/);const roofColor=roof?colorWords[roof[1]]:undefined;if(roof)rest=rest.replace(roof[0],'');
  let color:number|undefined;
  const colors=[...rest.matchAll(/\b(black|blue|green|red|yellow|white|tan|orange|brown|gray|grey)\b/g)];
  if(colors.length>1)throw Error('Use one body color and optionally a second color followed by “roof”.');
  if(colors.length){color=colorWords[colors[0][1]];rest=rest.replace(colors[0][0],'');}
  rest=rest.replace(/\b(?:size|width)\s+(\d+)\b/g,(_,n)=>{size=Number(n);return '';});
  rest=rest.replace(/\b(?:height|layers)\s+(\d+)\b/g,(_,n)=>{height=Number(n);return '';});
  rest=rest.replace(/\b(\d+)\s*(?:studs?\s*(?:wide)?|wide)\b/g,(_,n)=>{size=Number(n);return '';});
  rest=rest.replace(/\b(\d+)\s*(?:layers?|courses?)\s*(?:tall|high)?\b/g,(_,n)=>{height=Number(n);return '';});
  rest=rest.replace(/\b(small|large|tall|short)\b/g,word=>{if(word==='small')size=12;if(word==='large')size=24;if(word==='tall')height=12;if(word==='short')height=4;return '';});
  rest=rest.replace(/\b(cottage|house|cabin|tower|pyramid|a|an|the|build|make|create|please|with|and|of|body|walls|wall|brick|bricks|lego|model)\b/g,'').trim();
  if(rest.trim())throw Error(`Unsupported procedural detail: “${rest.replace(/\s+/g,' ').slice(0,90)}”. Supported: cottage / tower / pyramid, body color, roof color, size 8–40, height 3–20, small / large / tall / short.`);
  if(roofColor!==undefined&&mapped[0]!=='cottage')throw Error('Roof color is supported only for cottages.');
  normalizeOptions({...options,size,height});
  return {family:mapped[0],size,height,color,roofColor,summary:`${mapped[0]} · ${size}-stud base · ${height} body courses${color!==undefined?` · ${COLOR_BY_CODE[color].name} body`:''}${roofColor!==undefined?` · ${COLOR_BY_CODE[roofColor].name} roof`:''}`};
}
// Deterministic greedy rectangular packing. Alternating orientations and offset edge strips
// reduce continuous vertical seams. This is not a globally optimal packing solver.
export function packLayer(grid:(number|null)[][],y:number,h:1|3,phase:number,startId=0):Brick[] {
  const depth=grid.length,width=grid[0]?.length||0;const used=Array.from({length:depth},()=>Array(width).fill(false));
  const candidates=PARTS.filter(p=>p.h===h).flatMap(p=>[{p,r:0 as 0|90,w:p.w,d:p.d},...(p.w!==p.d?[{p,r:90 as 0|90,w:p.d,d:p.w}]:[])]).sort((a,b)=>b.w*b.d-a.w*a.d||(phase%2?b.d-a.d:b.w-a.w)||a.p.id.localeCompare(b.p.id));
  const bricks:Brick[]=[];
  for(let z=0;z<depth;z++)for(let x=0;x<width;x++){
    const color=grid[z][x];if(color===null||used[z][x])continue;
    const c=candidates.find(c=>{
      if(x+c.w>width||z+c.d>depth)return false;
      if(phase%2&&((x===0&&c.w>1)||(z===0&&c.d>1)))return false;
      for(let dz=0;dz<c.d;dz++)for(let dx=0;dx<c.w;dx++)if(used[z+dz][x+dx]||grid[z+dz][x+dx]!==color)return false;
      return true;
    })!;
    for(let dz=0;dz<c.d;dz++)for(let dx=0;dx<c.w;dx++)used[z+dz][x+dx]=true;
    bricks.push({id:`b${startId+bricks.length+1}`,part:c.p.id,color,x,y,z,rotation:c.r});
  }return bricks;
}
export function nearestColor(r:number,g:number,b:number,palette:number[]):number {
  // Linear-light weighted RGB distance. Deterministic, not perceptual Lab/DeltaE.
  const lin=(v:number)=>{v/=255;return v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4;};
  let best=palette[0],distance=Infinity;
  for(const code of palette){const hex=COLOR_BY_CODE[code].hex;const rr=parseInt(hex.slice(1,3),16),gg=parseInt(hex.slice(3,5),16),bb=parseInt(hex.slice(5,7),16);const d=.2126*(lin(r)-lin(rr))**2+.7152*(lin(g)-lin(gg))**2+.0722*(lin(b)-lin(bb))**2;if(d<distance){distance=d;best=code;}}
  return best;
}
function paletteColor(code:number,palette:string){const hex=COLOR_BY_CODE[code].hex;return nearestColor(parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16),PALETTES[palette]);}
export function procedural(text:string,options:Options=DEFAULTS):Plan {
  const parsed=parsePrompt(text,options),{family,size:n,height}=parsed;
  const bricks:Brick[]=[];let phase=0;
  const col=(c:number)=>paletteColor(c,options.palette);
  const add=(y:number,h:1|3,fn:(x:number,z:number)=>number|null)=>{const grid=Array.from({length:n},(_,z)=>Array.from({length:n},(_,x)=>{const c=fn(x,z);return c===null?null:col(c);}));bricks.push(...packLayer(grid,y,h,phase++,bricks.length));};
  add(0,1,()=>family==='pyramid'?19:288);add(1,1,()=>family==='pyramid'?19:288);
  if(family==='cottage'){
    const w=Math.max(4,Math.floor(n*.7/2)*2),d=Math.max(4,Math.floor(n*.6/2)*2),x0=Math.floor((n-w)/2),z0=Math.floor((n-d)/2),mid=Math.floor(n/2);
    const inside=(x:number,z:number)=>x>=x0&&x<x0+w&&z>=z0&&z<z0+d;
    add(2,1,(x,z)=>inside(x,z)?70:null);
    for(let l=0;l<height;l++)add(3+l*3,3,(x,z)=>{
      if(!inside(x,z))return null;
      if(!(x===x0||x===x0+w-1||z===z0||z===z0+d-1))return parsed.color??19;
      if(z===z0&&x>=mid-1&&x<=mid&&l<Math.min(4,height-1))return 70;
      if(l>=1&&l<=Math.min(2,height-2)&&((z===z0&&(x===x0+1||x===x0+w-2))||((x===x0||x===x0+w-1)&&z>=z0+2&&z<z0+d-2)))return 1;
      return parsed.color??19;
    });
    const roofY=3+height*3;
    for(let r=0;r<Math.ceil(w/2);r++)add(roofY+r*3,3,(x,z)=>z>=z0&&z<z0+d&&x>=x0+r&&x<x0+w-r?(parsed.roofColor??4):null);
    // Colored door/windows are solid bricks, not specialist openings or transparent elements.
  }else if(family==='tower'){
    const w=Math.max(4,Math.floor(n*.55/2)*2),a=Math.floor((n-w)/2),b=a+w;
    for(let l=0;l<height;l++)add(2+l*3,3,(x,z)=>{
      if(x<a||x>=b||z<a||z>=b)return null;
      const rim=x===a||x===b-1||z===a||z===b-1;
      if(l===0||l===height-1)return parsed.color??71;
      if(!rim)return parsed.color??71;
      return l%4===2&&(x===a+Math.floor(w/2)||z===a+Math.floor(w/2))?0:parsed.color??71;
    });
    add(2+height*3,3,(x,z)=>x>=a&&x<b&&z>=a&&z<b&&(x===a||x===b-1||z===a||z===b-1)&&((x+z)%2===0)?parsed.color??71:null);
  }else{
    for(let l=0;l<height;l++){const inset=Math.min(Math.floor(n/2)-1,1+Math.floor(l*(n/2-2)/Math.max(1,height-1)));add(2+l*3,3,(x,z)=>x>=inset&&x<n-inset&&z>=inset&&z<n-inset?parsed.color??19:null);}
  }
  const title=family==='cottage'?'Little hillside cottage':family==='tower'?'The watchtower':'Stepped desert pyramid';
  return enforceBudget({version:1,name:title,source:'procedural',description:`Deterministic ${parsed.summary}. Palette ${options.palette}. Solid display model (not hollow). Solid-color brick details; no generated AI geometry. Base plates included.`,bricks},options.budget);
}
export function imagePlan(rgba:Uint8ClampedArray,width:number,depth:number,mode:'mosaic'|'relief',options:Options=DEFAULTS):Plan {
  normalizeOptions(options);if(!Number.isInteger(width)||!Number.isInteger(depth)||width<1||depth<1||width>40||depth>40||rgba.length!==width*depth*4)throw Error('Image grid must be 1–40 studs per side with valid RGBA pixels.');
  const palette=PALETTES[options.palette];const colors:number[][]=[],heights:number[][]=[];
  for(let z=0;z<depth;z++){colors[z]=[];heights[z]=[];for(let x=0;x<width;x++){const i=(z*width+x)*4,a=rgba[i+3]/255,r=rgba[i]*a+255*(1-a),g=rgba[i+1]*a+255*(1-a),b=rgba[i+2]*a+255*(1-a);colors[z][x]=nearestColor(r,g,b,palette);heights[z][x]=mode==='mosaic'?1:1+Math.round((.2126*r+.7152*g+.0722*b)/255*(Math.min(options.height,8)-1));}}
  const bricks:Brick[]=[];const add=(grid:(number|null)[][],y:number)=>bricks.push(...packLayer(grid,y,1,y,bricks.length));
  const backing=Array.from({length:depth},()=>Array(width).fill(paletteColor(71,options.palette)));
  add(backing,0);add(backing,1);
  const max=Math.max(...heights.flat());
  for(let l=0;l<max;l++)add(colors.map((row,z)=>row.map((c,x)=>heights[z][x]>l?c:null)),l+2);
  return enforceBudget({version:1,name:mode==='mosaic'?'Image plate mosaic':'Image brightness relief',source:mode,description:`${width} × ${depth} studs. ${mode==='mosaic'?'Flat color quantization':'Brightness heightmap (light = high), NOT inferred 3D shape'}. ${palette.length}-color ${options.palette} palette; two interlocking backing layers included.`,bricks},options.budget);
}
export {COLORS};
