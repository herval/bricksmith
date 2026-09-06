import {register} from 'tsx/esm/api';
register();
const api=await import('./design.ts');
export const {CAPS,ToolError,parseDesign,parsePlan,voxelize,compile,validate,catalog,cellKey}=api;

export {Library,installLibrary,indexLibrary,auditLibrary,DEFAULT_LIBRARY,CatalogError} from './catalog/library.mjs';
export {parseScene,validateScene,sceneLDraw,inventoryScene,exportScene} from './catalog/scene.mjs';
export {renderScene} from './catalog/render.mjs';
