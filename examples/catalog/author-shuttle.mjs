// Host-authored visual composition using inspected official meshes, NOT an assembly solver.
import {Library,atomicJSON} from '../../tools/catalog/library.mjs';
import {parseScene,validateScene,IDENTITY} from '../../tools/catalog/scene.mjs';
import {resolve,join} from 'node:path';
const args=process.argv.slice(2);const flag=name=>args[args.indexOf('--'+name)+1];if(!args.includes('--library')||!args.includes('--out'))throw Error('Usage: node author-shuttle.mjs --library DIR --out NEW_DIR');
const lib=new Library(flag('library')),out=resolve(flag('out'));
const ry90=[0,0,1,0,1,0,-1,0,0],ryMinus=[0,0,-1,0,1,0,1,0,0],rx90=[1,0,0,0,0,-1,0,1,0];
const parts=[];function put(id,part,color,x,y,z,rotation=IDENTITY){lib.part(part);parts.push({id,part,color,position:[x,y,z],rotation:[...rotation]});}
// Thin black heat shield and white wing layer; continuous true diagonal edges, not voxel steps.
for(const [side,x,wing,root] of [['starboard',140,'30355','3544'],['port',-140,'30356','3545']])for(const [layer,y,color] of [['heatshield',0,0],['surface',-8,15]]){
 put(`${side}-wing-${layer}`,wing,color,x,y,100);
 put(`${side}-root-${layer}`,root,color,Math.sign(x)*110,y,-100);
}
// Eight-stud-wide fuselage, native part origins and actual plate/brick heights.
for(const [layer,y,color] of [['belly',0,0],['lower-skin',-8,15],['upper-deck',-40,15]]){
 for(const z of [-100,20,140])put(`${layer}-${z}`,'3036',color,0,y,z);
 put(`${layer}-aft`,'3034',color,0,y,220);
}
for(const x of [-60,-20,20,60])for(const z of [-120,-40,40,120,200])put(`wall-${x}-${z}`,'3001',15,x,-32,z,ry90);
// Smooth cross-body curvature: each 24309 is rotated across the body, high edge inward.
for(const z of [-140,-100,-60,-20,20,60,100,140,180,220]){
 put(`curved-port-${z}`,'24309',15,-50,-64,z,ry90);
 put(`curved-starboard-${z}`,'24309',15,50,-64,z,ryMinus);
 put(`spine-low-${z}`,'3022',15,0,-48,z);
 put(`spine-high-${z}`,'3022',15,0,-56,z);
 put(`cargo-seam-${z}`,'3068b',15,0,-64,z);
}
// Integrated cockpit shoulders and paired upper/inverted curved nose shells.
put('cockpit-base','3035',0,0,0,-200);
put('cockpit-floor','3035',15,0,-8,-200);
put('nose-upper','43712',15,0,-40,-260);
put('nose-lower','43713',0,0,-16,-260);
put('rounded-thermal-nose','15068',0,0,-14,-350);
put('cockpit-windshield','3037',0,0,-64,-210);
put('cockpit-roof','87079',15,0,-72,-180);
put('cockpit-roof-front','2431',15,0,-72,-210);
put('cockpit-core','3001',15,0,-32,-200);
put('cockpit-left-shoulder','43711',15,-50,-32,-230);
put('cockpit-right-shoulder','43710',15,50,-32,-230);
for(const x of [-60,60])for(const z of [-220,-180])put(`cockpit-curved-${x}-${z}`,'15068',15,x,-40,z,x<0?ry90:ryMinus);
// Genuine thin swept shuttle tail; no stair-stepped voxel fin.
put('swept-vertical-tail','6239',15,0,-72,150);
// Three actual round engine bells with axes rotated 90 degrees into the aft direction.
for(const [id,x,y] of [['lower-port',-40,-22],['lower-starboard',40,-22],['upper',0,-74]]){
 put(`engine-neck-${id}`,'3941',72,x,y,222,rx90);
 put(`engine-bell-${id}`,'6233',72,x,y,246,rx90);
}
// Smaller round OMS housings sit beside the tail and continue aft from curved body shoulders.
for(const x of [-65,65]){put(`oms-cylinder-${x}`,'3941',15,x,-70,196,rx90);put(`oms-nozzle-${x}`,'3942c',72,x,-70,220,rx90);}
// Black trailing-edge elevon tiles and restrained gray access panels on the real wing plates.
for(const x of [-180,-140,-100,100,140,180])put(`elevon-${x}`,'3068b',0,x,-16,200);
for(const x of [-110,110])put(`wing-panel-${x}`,'3068b',71,x,-16,120);
const scene=parseScene({schema:'bricksmith.scene.v1',name:'Orbiter — full-catalog visual prototype',description:'Host-authored shuttle with curved fuselage and nose, genuine diagonal wing/root plates, swept thin tail and rotated round engine bells. Visual prototype: some joins/interpenetrations and cantilevered assemblies are not mechanically solved. No buildability claim or inferred instructions.',units:'LDU',parts},lib);
const ids=[...new Set(parts.map(p=>p.part))];const inspections=ids.map(id=>lib.inspect(id));atomicJSON(join(out,'scene.json'),scene);atomicJSON(join(out,'part-inspection.json'),inspections);atomicJSON(join(out,'report.json'),validateScene(scene,lib));console.log(JSON.stringify({ok:true,scene:join(out,'scene.json'),pieces:parts.length,uniqueParts:ids.length,ids,physicalValidity:'unverified'},null,2));
