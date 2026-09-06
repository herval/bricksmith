import type {Library} from './library.mjs';
export interface CatalogPlacement {id:string;part:string;color:number;position:number[];rotation:number[]}
export interface CatalogScene {schema:'bricksmith.scene.v1';name:string;description?:string;units:'LDU';libraryDigest?:string;parts:CatalogPlacement[];assemblyOrder?:string[]}
export const IDENTITY:number[];
export function parseScene(value:unknown,library:Library):CatalogScene;
export function validateScene(value:unknown,library:Library):Record<string,any>;
export function sceneLDraw(value:unknown,library:Library):string;
export function inventoryScene(value:unknown,library:Library):{part:string;name:string;color:number;colorName:string;quantity:number}[];
export function packedModel(value:unknown,library:Library):{model:string;dependency:Record<string,any>;fileMap:Record<string,string>};
export function exportScene(value:unknown,library:Library,directory:string):Record<string,any>;
