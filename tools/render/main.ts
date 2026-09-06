import * as THREE from 'three';
import {BrickViewer} from '../../src/viewer.ts';
import {bounds,type Plan} from '../../src/model.ts';
const viewer=new BrickViewer(document.querySelector('#view')!);viewer.controls.enabled=false;viewer.controls.enableDamping=false;viewer.grid.visible=false;
const api=window as any;
api.loadPlan=(plan:Plan)=>{viewer.setPlan(plan);viewer.renderer.setClearColor(0xe9eee8,1);};
api.setView=async(name:string)=>{const b=bounds(viewer.plan!),center=new THREE.Vector3((b.minX+b.maxX)/2,b.maxY*.2,(b.minZ+b.maxZ)/2),directions:Record<string,number[]>={front:[0,0,-1],back:[0,0,1],left:[-1,0,0],right:[1,0,0],top:[0,1,0],iso:[-1,.8,-1]};const dir=new THREE.Vector3(...directions[name]).normalize();
 // Fit a conservative bounding sphere, including studs: every view shares physical proportions.
 const radius=Math.sqrt((b.maxX-b.minX)**2+(b.maxY*.4+.4)**2+(b.maxZ-b.minZ)**2)/2;const camera=viewer.camera;camera.up.set(0,1,0);if(name==='top')camera.up.set(0,0,1);const distance=radius/Math.sin(THREE.MathUtils.degToRad(camera.fov/2))*1.08;camera.position.copy(center).addScaledVector(dir,distance);camera.lookAt(center);camera.updateProjectionMatrix();
 // Stop the UI's orbit loop so exact front/top cameras are not clamped by OrbitControls.
 cancelAnimationFrame(viewer.frame);viewer.renderer.render(viewer.scene,camera);await new Promise(done=>requestAnimationFrame(done));viewer.renderer.render(viewer.scene,camera);
 return {position:camera.position.toArray(),target:center.toArray(),up:camera.up.toArray(),verticalFov:camera.fov,axes:'x right, y plates up (0.4 stud), +z back'};
};
