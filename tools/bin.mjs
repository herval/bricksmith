#!/usr/bin/env node
// Portable entry point: resolves modules relative to this installed package, never cwd.
import {register} from 'tsx/esm/api';
register();
if(['library','parts','scene'].includes(process.argv[2])) {
  try { const {catalogCLI}=await import('./catalog/cli.mjs');console.log(JSON.stringify(await catalogCLI(process.argv.slice(2)),null,2)); }
  catch(e){process.exitCode=e.exitCode??4;console.log(JSON.stringify({ok:false,error:{code:e.code??'RUNTIME',message:e.message,details:e.details},exitCode:process.exitCode},null,2));}
} else await import('./cli.ts');
