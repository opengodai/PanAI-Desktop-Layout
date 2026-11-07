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
console.log('PASS: adaptive 15–52, 1px steps, space-dependent selection, lower/upper bounds, reinitialize and rollback');
