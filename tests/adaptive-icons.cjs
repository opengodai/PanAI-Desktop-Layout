// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 OpenGodAI contributors
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const context={};vm.createContext(context);
vm.runInContext(fs.readFileSync('extension/adaptive-icons.js','utf8').replaceAll('export function ','function ')+'\nglobalThis.api={adaptiveSizes,adaptDash};',context);
const {adaptiveSizes,adaptDash}=context.api;
assert.deepEqual(Array.from(adaptiveSizes(52)),Array.from({length:38},(_,i)=>i+15));
for(const max of [8,15,28,39,52,99]){
 const list=Array.from(adaptiveSizes(max));assert(list[0]===15);assert(list.at(-1)<=52);
}
const dash={_availableIconSizes:[16,22,24,32,48,52],redisplays:0,_initializeIconSize(max){this._availableIconSizes=[16,22,24,32,48].filter(n=>n<max).concat(max);},_queueRedisplay(){this.redisplays++;}};
const original=dash._initializeIconSize;const cleanup=adaptDash(dash);
const pick=space=>Array.from(dash._availableIconSizes).filter(n=>n<=space).at(-1)??dash._availableIconSizes[0];
assert.equal(pick(999),52);assert.equal(pick(39.8),39);assert.equal(pick(16),16);assert.equal(pick(1),15);
dash._initializeIconSize(52);assert.equal(pick(40),40);
cleanup();cleanup();assert.equal(dash._initializeIconSize,original);assert.deepEqual(dash._availableIconSizes,[16,22,24,32,48,52]);
// Screen lock: Ubuntu Dock is disabled first, so its DockManager is gone and
// _initializeIconSize throws. Cleanup must still restore the method and not throw.
context.console={debug(){}};
let dockAlive=true;
const torn={_availableIconSizes:[16,22,24,32,48,52],_initializeIconSize(max){if(!dockAlive)throw new TypeError("can't access property \"settings\", DockManager.getDefault() is null");this._availableIconSizes=[16,22,24,32,48].filter(n=>n<max).concat(max);},_queueRedisplay(){}};
const tornOriginal=torn._initializeIconSize;const tornCleanup=adaptDash(torn);
dockAlive=false;
assert.doesNotThrow(()=>tornCleanup());assert.equal(torn._initializeIconSize,tornOriginal);
// Ubuntu Dock rebuilds its dash (monitor/settings changes). A destroyed dash
// must be forgotten: no work is queued on it later and the owner drops it.
const handlers=new Map();let nextId=1,dead=0,forgotten=0;
const rebuilt={_availableIconSizes:[16,22,24,32,48,52],_initializeIconSize(max){this._availableIconSizes=[16,22,24,32,48].filter(n=>n<max).concat(max);},
 _queueRedisplay(){if(this.destroyed)dead++;},connect(sig,fn){const id=nextId++;handlers.set(id,[sig,fn]);return id;},disconnect(id){assert(!this.destroyed,'disconnect after destroy');handlers.delete(id);},
 destroy(){this.destroyed=true;for(const [sig,fn] of [...handlers.values()])if(sig==='destroy')fn();handlers.clear();}};
const rebuiltCleanup=adaptDash(rebuilt,()=>forgotten++);
rebuilt.destroy();assert.equal(forgotten,1);
rebuiltCleanup();assert.equal(dead,0);
const live={...rebuilt,destroyed:false};handlers.clear();
const liveCleanup=adaptDash(live,()=>forgotten++);assert.equal(handlers.size,1);
liveCleanup();assert.equal(handlers.size,0);assert.equal(forgotten,1);
console.log('PASS: adaptive 15–52, 1px steps, space-dependent selection, lower/upper bounds, reinitialize, rollback, lock-time cleanup and rebuilt-dash release');
