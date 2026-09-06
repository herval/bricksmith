import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import * as api from '../tools/index.mjs';
const bin=fileURLToPath(new URL('../tools/bin.mjs',import.meta.url));
const pkg=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'));
function run(args:string[]) {
  const result=spawnSync(process.execPath,[bin,...args],{cwd:tmpdir(),encoding:'utf8',timeout:20000});
  assert.equal(result.error,undefined);
  assert.equal(result.stderr,'');
  return {status:result.status,body:JSON.parse(result.stdout)};
}
const legacy=['schema','catalog','compile','validate','render','export'];
test('native CLI help works from unrelated cwd without a library or TypeScript loader',()=>{
  for(const args of [[],['help'],['--help'],['-h']]) {
    const {status,body}=run(args);assert.equal(status,0);assert.equal(body.version,'0.3.1');
    for(const name of ['library','parts','scene'])assert.equal(typeof body.commands[name],'string');
    for(const name of legacy)assert.equal(Object.hasOwn(body.commands,name),false);
    assert.doesNotMatch(JSON.stringify(body),/--plan|--design|voxel|compile|design\.schema|plan\.schema/);
  }
  assert.doesNotMatch(readFileSync(bin,'utf8'),/from ['"]tsx|import\(['"].*cli\.ts/);
});
test('native namespaces expose scoped help and scene schema without opening a library',()=>{
  for(const namespace of ['library','parts','scene'])for(const flag of ['help','--help','-h']) {
    const {status,body}=run([namespace,flag]);assert.equal(status,0);assert.equal(body.command,namespace);assert.match(body.usage,new RegExp('^'+namespace+' '));
  }
  const {status,body}=run(['scene','schema']);assert.equal(status,0);assert.match(JSON.stringify(body),/bricksmith\.scene\.v1/);
});
test('obsolete routes fail explicitly instead of invoking the voxel engine',()=>{
  for(const command of legacy) {
    const {status,body}=run([command]);assert.equal(status,2);assert.equal(body.error.code,'LEGACY_COMMAND_REMOVED');assert.match(body.error.message,/removed in 0\.3\.1; use /);
  }
});
test('unknown routes and malformed help fail as arguments',()=>{
  for(const args of [['nonsense'],['scene','compile'],['help','extra'],['scene','help','extra']]) {
    const {status,body}=run(args);assert.equal(status,2);assert.equal(body.error.code,'ARGUMENT');
  }
});
test('public API and package exports contain only the native catalog workflow',()=>{
  for(const name of ['Library','installLibrary','indexLibrary','auditLibrary','parseScene','validateScene','sceneLDraw','inventoryScene','exportScene','renderScene'])assert.equal(typeof api[name as keyof typeof api],'function');
  for(const name of ['compile','validate','voxelize','parseDesign','parsePlan','catalog','CAPS','ToolError'])assert.equal(Object.hasOwn(api,name),false);
  assert.deepEqual(Object.keys(pkg.exports).sort(),['.','./catalog','./scene','./schema/scene']);
  for(const command of ['dev','preview','build','samples','test:browser','test:browser:ephemeral','test:tools','test:tool-render'])assert.equal(Object.hasOwn(pkg.scripts,command),false);
  assert.equal(pkg.dependencies.tsx,undefined);assert.equal(pkg.dependencies['@playwright/test'],undefined);
  assert.ok(pkg.files.includes('SKILL.md'));assert.ok(pkg.files.includes('references'));
  for(const path of ['src','public','index.html','samples','examples/agent','docs','tests','scripts'])assert.equal(pkg.files.includes(path),false);
});
