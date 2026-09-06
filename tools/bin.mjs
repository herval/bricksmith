#!/usr/bin/env node
// Native ESM entry point; no runtime TypeScript loader or legacy engine.
import {readFileSync} from 'node:fs';
import {catalogCLI,catalogContract} from './catalog/cli.mjs';
import {fail} from './catalog/library.mjs';
const {version}=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'));
const argv=process.argv.slice(2);
const legacy={schema:'scene schema',catalog:'parts search',compile:'author a native scene, then use scene validate',validate:'scene validate',render:'scene render',export:'scene export'};
try {
  const [command='help']=argv;
  let result;
  if(['help','--help','-h'].includes(command)) {
    if(argv.length>1)fail('ARGUMENT','Help takes no additional arguments');
    result={tool:'bricksmith',version,commands:catalogContract,exitCodes:{0:'Command complete; geometry checks do not certify physical buildability',2:'Invalid arguments, schema, library integrity or geometry',3:'Library audit found errors',4:'Filesystem/browser/runtime dependency failure'}};
  } else {
    if(Object.hasOwn(legacy,command))fail('LEGACY_COMMAND_REMOVED',`Legacy command "${command}" was removed in 0.3.1; use ${legacy[command]}. Native scenes use bricksmith.scene.v1, not voxel designs or plans.`);
    result=await catalogCLI(argv);
  }
  console.log(JSON.stringify(result,null,2));
} catch(error) {
  process.exitCode=error.exitCode??4;
  console.log(JSON.stringify({ok:false,error:{code:error.code??'RUNTIME',message:error.message,details:error.details},exitCode:process.exitCode},null,2));
}
