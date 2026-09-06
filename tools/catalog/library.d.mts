export interface CatalogPart {id:string;path:string;name:string;category:string;org:string;kind:string;alias:boolean;moved:boolean;patterned:boolean;author?:string;license?:string;keywords:string;texmap:boolean}
export interface CatalogColor {code:number;name:string;value:string;edge:string;alpha:number;luminance:number;definition:string}
export class CatalogError extends Error {code:string;details:Record<string,unknown>;exitCode:number}
export const DEFAULT_LIBRARY:string;
export const SOURCE:string;
export const fail:(code:string,message:string,details?:unknown)=>never;
export const sha256:(bytes:string|Uint8Array)=>string;
export function atomicJSON(path:string,value:unknown):void;
export function safeRef(value:string):string;
export function mainId(value:string):string;
export function indexLibrary(directory?:string,provenance?:Record<string,unknown>):Record<string,any>;
export function installLibrary(options?:{directory?:string;archive?:string;sha256?:string}):Promise<Record<string,any>>;
export function auditLibrary(library:Library):Record<string,any>;
export class Library {
 constructor(directory?:string);
 root:string;manifest:Record<string,any>;files:Record<string,{path:string;bytes:number;sha256:string}>;parts:CatalogPart[];colors:CatalogColor[];
 part(id:string):CatalogPart;
 search(options?:{query?:string;category?:string;offset?:number;limit?:number;kind?:string}):{total:number;offset:number;limit:number;nextOffset:number|null;results:CatalogPart[];library:Record<string,any>};
 inspect(id:string):Record<string,any>;
 bytes(ref:string):Buffer;
 text(ref:string):string;
 resolve(ref:string,from?:string):string;
 closure(ids:string[]):{files:string[];references:Record<string,string>;sourceBytes:number};
 geometry(id:string):{points:Float64Array;triangles:number;lines:number;conditionalLines:number};
}
